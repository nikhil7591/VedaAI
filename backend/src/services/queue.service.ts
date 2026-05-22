import { Queue, Job } from 'bullmq';
import { createRedisConnection } from '../config/redis';
import { logger } from '../utils/logger';

export interface GenerationJobData {
  assignmentId: string;
}

const QUEUE_NAME = 'questionGeneration';

let generationQueue: Queue<GenerationJobData> | null = null;

export function getGenerationQueue(): Queue<GenerationJobData> {
  if (generationQueue) return generationQueue;

  generationQueue = new Queue<GenerationJobData>(QUEUE_NAME, {
    connection: createRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: { age: 3600, count: 100 },
      removeOnFail:    { age: 86400 },
    },
  });

  generationQueue.on('error', (err) => logger.error('Queue error:', err));
  logger.info(`✅ BullMQ queue "${QUEUE_NAME}" ready`);
  return generationQueue;
}

export class QueueService {
  static async enqueueGeneration(assignmentId: string): Promise<string> {
    const queue = getGenerationQueue();
    const job: Job<GenerationJobData> = await queue.add(
      'generateQuestions',
      { assignmentId },
      { jobId: `gen-${assignmentId}-${Date.now()}` }
    );
    logger.debug(`Job enqueued: ${job.id} for assignment: ${assignmentId}`);
    return job.id!;
  }

  static async getJobStatus(jobId: string): Promise<{
    status: string;
    progress: number;
    failReason?: string;
  }> {
    const queue = getGenerationQueue();
    const job = await queue.getJob(jobId);
    if (!job) return { status: 'not_found', progress: 0 };

    const state    = await job.getState();
    const rawProg  = job.progress;
    const progress = typeof rawProg === 'number' ? rawProg : 0;

    return {
      status:     state,
      progress,
      failReason: job.failedReason,
    };
  }
}
