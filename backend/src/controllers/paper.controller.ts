import { Request, Response } from 'express';
import { z } from 'zod';
import { AssignmentService } from '../services/assignment.service';
import { PaperService } from '../services/paper.service';
import { QueueService } from '../services/queue.service';
import { asyncHandler } from '../utils/asyncHandler';
import { logger } from '../utils/logger';

export const regenerateSchema = z.object({
  additionalInstructions: z.string().optional(),
});

export const getPaper = asyncHandler(async (req: Request, res: Response) => {
  const { id: assignmentId } = req.params;

  const assignment = await AssignmentService.findById(assignmentId);

  if (assignment.status === 'processing' || assignment.status === 'pending') {
    res.status(409).json({
      success: false,
      error: { code: 'NOT_READY', message: 'Question paper generation is still in progress' },
    });
    return;
  }

  if (assignment.status === 'failed') {
    res.status(409).json({
      success: false,
      error: { code: 'GENERATION_FAILED', message: 'Question paper generation failed. Please regenerate.' },
    });
    return;
  }

  const paper = await PaperService.findByAssignmentId(assignmentId);
  if (!paper) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Question paper not found' },
    });
    return;
  }

  res.json({ success: true, data: paper });
});

export const regeneratePaper = asyncHandler(async (req: Request, res: Response) => {
  const { id: assignmentId } = req.params;
  const body = regenerateSchema.parse(req.body);

  const assignment = await AssignmentService.findById(assignmentId);

  // Delete existing paper + clear cache
  await PaperService.deleteByAssignmentId(assignmentId);

  // Optionally update instructions
  if (body.additionalInstructions !== undefined) {
    // Using direct model update since service doesn't expose this field
    const { Assignment } = await import('../models/Assignment.model');
    await Assignment.findByIdAndUpdate(assignmentId, {
      $set: { additionalInstructions: body.additionalInstructions },
    });
  }

  // Re-enqueue job
  const jobId = await QueueService.enqueueGeneration(assignmentId);
  await AssignmentService.update(assignmentId, { status: 'processing', jobId });

  logger.info(`Regeneration queued for assignment: ${assignmentId} → job: ${jobId}`);

  res.status(202).json({
    success: true,
    data: {
      assignmentId,
      jobId,
      message: 'Regeneration job queued',
    },
  });
});
