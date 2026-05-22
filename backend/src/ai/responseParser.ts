import { z } from 'zod';
import { logger } from '../utils/logger';

// ─── Custom error class ───────────────────────────────────────────────────────

export class LLMParseError extends Error {
  constructor(
    public readonly code: 'LLM_PARSE_ERROR' | 'LLM_SCHEMA_ERROR',
    message: string
  ) {
    super(message);
    this.name = 'LLMParseError';
  }
}

// ─── Zod schemas ─────────────────────────────────────────────────────────────

const QuestionZodSchema = z
  .object({
    questionNumber: z.number().int().positive(),
    text:           z.string().min(5, 'Question text too short'),
    type:           z.enum(['MCQ', 'SHORT', 'LONG', 'TRUE_FALSE']),
    difficulty:     z.enum(['easy', 'medium', 'hard']),
    marks:          z.number().positive(),
    options:        z.array(z.string()).optional(),
    answer:         z.string().optional(),
  })
  .refine(
    (q) => q.type !== 'MCQ' || (q.options?.length === 4),
    { message: 'MCQ questions must have exactly 4 options' }
  );

const SectionZodSchema = z.object({
  sectionLabel: z.string().min(1),
  title:        z.string().min(3),
  instruction:  z.string().min(5),
  questions:    z.array(QuestionZodSchema).min(1),
});

const PaperZodSchema = z.object({
  title:    z.string().min(3),
  sections: z.array(SectionZodSchema).min(1),
});

export type ParsedPaper = z.infer<typeof PaperZodSchema>;

// ─── Parser ───────────────────────────────────────────────────────────────────

export class ResponseParser {
  static parse(rawText: string): ParsedPaper {
    // Strip potential markdown code fences from non-JSON-mode responses
    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      logger.warn('LLM output is not valid JSON:', cleaned.slice(0, 200));
      throw new LLMParseError('LLM_PARSE_ERROR', 'LLM response is not valid JSON');
    }

    const result = PaperZodSchema.safeParse(parsed);
    if (!result.success) {
      const issues = result.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ');
      logger.warn('LLM schema validation failed:', issues);
      throw new LLMParseError('LLM_SCHEMA_ERROR', `Schema validation failed: ${issues}`);
    }

    // Calculate section totalMarks from questions
    for (const section of result.data.sections) {
      (section as ParsedPaper['sections'][0] & { totalMarks?: number }).totalMarks =
        section.questions.reduce((sum, q) => sum + q.marks, 0);
    }

    return result.data;
  }
}
