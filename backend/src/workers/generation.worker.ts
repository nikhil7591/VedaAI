import { Worker, Job } from 'bullmq';
import { createRedisConnection } from '../config/redis';
import { AssignmentService } from '../services/assignment.service';
import { PaperService } from '../services/paper.service';
import { QueueService, GenerationJobData } from '../services/queue.service';
import { PromptBuilder } from '../ai/promptBuilder';
import { LLMClient } from '../ai/llmClient';
import { ResponseParser, LLMParseError, ParsedPaper } from '../ai/responseParser';
import { getSocketGateway } from '../socket/gateway';
import { logger } from '../utils/logger';
import { LLMPrompt } from '../ai/promptBuilder';

const QUEUE_NAME      = 'questionGeneration';
const MAX_PARSE_RETRY = 2;

// ─── Retry LLM call on parse failure ─────────────────────────────────────────

async function generateWithRetry(
  prompt: LLMPrompt,
  attempt = 0
): Promise<{ parsed: ParsedPaper; model: string; promptTokens: number; totalTokens: number }> {
  const raw = await LLMClient.complete(prompt);
  try {
    const parsed = ResponseParser.parse(raw.text);
    return { parsed, model: raw.model, promptTokens: raw.promptTokens, totalTokens: raw.totalTokens };
  } catch (err) {
    if (err instanceof LLMParseError && attempt < MAX_PARSE_RETRY) {
      logger.warn(`Parse failed (attempt ${attempt + 1}/${MAX_PARSE_RETRY}): ${err.message}`);
      const retryPrompt: LLMPrompt = {
        ...prompt,
        user:
          prompt.user +
          `\n\nPrevious attempt failed with: "${err.message}". IMPORTANT: Return ONLY valid JSON matching the schema. No extra text.`,
      };
      return generateWithRetry(retryPrompt, attempt + 1);
    }
    throw err;
  }
}

// ─── Worker ───────────────────────────────────────────────────────────────────

export function startGenerationWorker(): Worker<GenerationJobData> {
  const worker = new Worker<GenerationJobData>(
    QUEUE_NAME,
    async (job: Job<GenerationJobData>) => {
      const { assignmentId } = job.data;
      const jobId            = job.id ?? 'unknown';
      const gateway          = getSocketGateway();

      logger.info(`Worker started job ${jobId} for assignment ${assignmentId}`);

      try {
        // ── Step 1: Notify start ─────────────────────────────────────────────
        await gateway.emit(assignmentId, 'generation:started', {
          jobId,
          message: 'Question generation started',
        });
        await job.updateProgress(5);

        // ── Step 2: Update assignment status ─────────────────────────────────
        await AssignmentService.update(assignmentId, { status: 'processing' });

        // ── Step 3: Fetch assignment ──────────────────────────────────────────
        const assignment = await AssignmentService.findById(assignmentId);
        await gateway.emitProgress(assignmentId, jobId, 15, 'Building AI prompt...');
        await job.updateProgress(15);

        // ── Step 4: Build prompt ──────────────────────────────────────────────
        const prompt = PromptBuilder.build(assignment);
        await gateway.emitProgress(assignmentId, jobId, 30, 'Sending to Groq AI...');
        await job.updateProgress(30);

        // ── Step 5: Call LLM (with retry on parse failure) ────────────────────
        const { parsed, model, promptTokens, totalTokens } =
          await generateWithRetry(prompt);
        await gateway.emitProgress(assignmentId, jobId, 70, 'Processing AI response...');
        await job.updateProgress(70);

        // ── Step 6: Validate & compute section marks ─────────────────────────
        await gateway.emitProgress(assignmentId, jobId, 80, 'Validating question paper...');
        await job.updateProgress(80);

        const totalMarks = parsed.sections.reduce(
          (sum, sec) => sum + sec.questions.reduce((s2, q) => s2 + q.marks, 0),
          0
        );

        // ── Step 7: Store paper in MongoDB ────────────────────────────────────
        const paper = await PaperService.create({
          assignmentId,
          title:      parsed.title,
          subject:    assignment.subject,
          dueDate:    assignment.dueDate,
          totalMarks,
          sections:   parsed.sections as IQuestionPaperSection[],
          metadata: {
            generatedAt:  new Date(),
            llmModel:     model,
            promptTokens,
            totalTokens,
          },
        });
        await gateway.emitProgress(assignmentId, jobId, 90, 'Saving to database...');
        await job.updateProgress(90);

        // ── Step 8: Update assignment status & paperId ────────────────────────
        await AssignmentService.update(assignmentId, {
          status:  'completed',
          paperId: paper._id,
        });

        // ── Step 9: Cache result in Upstash Redis ─────────────────────────────
        // Already handled inside PaperService.findByAssignmentId on next read
        await gateway.emitProgress(assignmentId, jobId, 95, 'Finalizing...');
        await job.updateProgress(95);

        // ── Step 10: Notify completion ────────────────────────────────────────
        await gateway.emitCompleted(assignmentId, jobId, paper._id.toString());
        await job.updateProgress(100);

        logger.info(`Job ${jobId} completed — paper: ${paper._id}`);
        return { paperId: paper._id.toString() };
      } catch (err) {
        const errorCode = err instanceof LLMParseError ? err.code : 'UNKNOWN_ERROR';
        const message   = err instanceof Error ? err.message : 'Unknown error';

        logger.error(`Job ${jobId} failed:`, err);
        await AssignmentService.update(assignmentId, { status: 'failed' }).catch(() => {});
        await gateway.emitFailed(assignmentId, jobId, errorCode, message).catch(() => {});

        throw err;
      }
    },
    {
      connection:  createRedisConnection(),
      concurrency: 5,
    }
  );

  worker.on('completed', (job) => logger.info(`Job ${job.id} completed`));
  worker.on('failed',    (job, err) => logger.error(`Job ${job?.id} failed:`, err));
  worker.on('error',     (err) => logger.error('Worker error:', err));

  logger.info('✅ Generation worker started');
  return worker;
}

// Type alias for paper sections (avoids circular import)
type IQuestionPaperSection = import('../models/QuestionPaper.model').ISection;
