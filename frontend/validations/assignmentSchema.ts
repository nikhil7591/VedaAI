import { z } from 'zod';

export const assignmentSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(120, 'Title is too long')
    .trim(),

  subject: z
    .string()
    .min(2, 'Subject must be at least 2 characters')
    .max(60, 'Subject is too long')
    .trim(),

  dueDate: z
    .string()
    .min(1, 'Due date is required')
    .refine((d) => new Date(d) > new Date(), 'Due date must be in the future'),

  totalMarks: z
    .number({ invalid_type_error: 'Total marks must be a number' })
    .int('Must be a whole number')
    .positive('Marks must be positive')
    .max(500, 'Maximum 500 marks'),

  totalQuestions: z
    .number({ invalid_type_error: 'Total questions must be a number' })
    .int('Must be a whole number')
    .min(1, 'At least 1 question')
    .max(100, 'Maximum 100 questions'),

  questionTypes: z
    .array(z.enum(['MCQ', 'SHORT', 'LONG', 'TRUE_FALSE']))
    .min(1, 'Select at least one question type'),

  difficultyDistribution: z
    .object({
      easy:   z.number().min(0).max(100),
      medium: z.number().min(0).max(100),
      hard:   z.number().min(0).max(100),
    })
    .refine((d) => d.easy + d.medium + d.hard === 100, {
      message: 'Easy + Medium + Hard must total 100%',
    }),

  additionalInstructions: z.string().max(500).optional().default(''),
});

export type AssignmentFormValues = z.infer<typeof assignmentSchema>;
