import { Request, Response } from 'express';
import { z } from 'zod';
import { AssignmentService } from '../services/assignment.service';
import { QueueService } from '../services/queue.service';
import { asyncHandler } from '../utils/asyncHandler';
import { logger } from '../utils/logger';

// ─── Validation schema ────────────────────────────────────────────────────────

export const createAssignmentSchema = z.object({
  title:          z.string().min(3, 'Title must be at least 3 characters').trim(),
  subject:        z.string().min(2, 'Subject must be at least 2 characters').trim(),
  dueDate:        z.string().refine((d) => new Date(d) > new Date(), 'Due date must be in the future'),
  totalMarks:     z.number().int().positive().max(500),
  totalQuestions: z.number().int().min(1).max(100),
  questionTypes:  z.array(z.enum(['MCQ', 'SHORT', 'LONG', 'TRUE_FALSE'])).min(1),
  difficultyDistribution: z
    .object({
      easy:   z.number().min(0).max(100),
      medium: z.number().min(0).max(100),
      hard:   z.number().min(0).max(100),
    })
    .refine((d) => d.easy + d.medium + d.hard === 100, {
      message: 'easy + medium + hard must equal 100',
    }),
  additionalInstructions: z.string().optional().default(''),
  groupId: z.string().optional(),
});

// ─── Handlers ─────────────────────────────────────────────────────────────────

export const createAssignment = asyncHandler(async (req: Request, res: Response) => {
  const data       = req.body as z.infer<typeof createAssignmentSchema>;
  const assignment = await AssignmentService.create(data);
  const jobId      = await QueueService.enqueueGeneration(assignment._id.toString());
  await AssignmentService.update(assignment._id.toString(), { jobId });

  logger.info(`Assignment created & job queued: ${assignment._id} → ${jobId}`);

  res.status(201).json({
    success: true,
    data: {
      assignmentId: assignment._id,
      jobId,
      status: 'queued',
    },
  });
});

export const getAssignment = asyncHandler(async (req: Request, res: Response) => {
  const assignment = await AssignmentService.findById(req.params.id);
  res.json({ success: true, data: assignment });
});

export const getAssignmentStatus = asyncHandler(async (req: Request, res: Response) => {
  const assignment = await AssignmentService.findById(req.params.id);

  let jobStatus: { status: string; progress: number; failReason?: string } = {
    status:    assignment.status,
    progress:  0,
    failReason: undefined,
  };

  if (assignment.jobId) {
    const qs = await QueueService.getJobStatus(assignment.jobId);
    jobStatus = {
      status:     qs.status === 'not_found' ? assignment.status : qs.status,
      progress:   qs.progress,
      failReason: qs.failReason,
    };
  }

  res.json({
    success: true,
    data: {
      assignmentId:  assignment._id,
      jobId:         assignment.jobId,
      status:        jobStatus.status,
      progress:      jobStatus.progress,
      errorMessage:  jobStatus.failReason ?? null,
    },
  });
});

export const deleteAssignment = asyncHandler(async (req: Request, res: Response) => {
  await AssignmentService.delete(req.params.id);
  logger.info(`Assignment deleted: ${req.params.id}`);
  res.json({ success: true, data: null });
});

export const listAssignments = asyncHandler(async (req: Request, res: Response) => {
  const page    = Math.max(1, parseInt(String(req.query.page  ?? '1')));
  const limit   = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? '10'))));
  const status  = req.query.status as string | undefined;
  const groupId = req.query.groupId as string | undefined;

  const { assignments, total } = await AssignmentService.findAll(
    page,
    limit,
    status as import('../models/Assignment.model').AssignmentStatus | undefined,
    groupId
  );

  res.json({
    success: true,
    data: {
      assignments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
});
