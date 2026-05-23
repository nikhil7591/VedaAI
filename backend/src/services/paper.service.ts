import { Types } from 'mongoose';
import { QuestionPaper, IQuestionPaper } from '../models/QuestionPaper.model';
import { CacheService } from './cache.service';
import { logger } from '../utils/logger';

export interface CreatePaperDTO {
  assignmentId: string;
  title: string;
  className: string;
  subject: string;
  dueDate?: Date;
  totalMarks: number;
  sections: IQuestionPaper['sections'];
  metadata: IQuestionPaper['metadata'];
}

export class PaperService {
  static async create(data: CreatePaperDTO): Promise<IQuestionPaper> {
    // Upsert in case of regeneration — replace existing paper for same assignment
    const paper = await QuestionPaper.findOneAndUpdate(
      { assignmentId: new Types.ObjectId(data.assignmentId) },
      { $set: data },
      { upsert: true, new: true }
    ).lean<IQuestionPaper>();

    if (!paper) throw new Error('Failed to create paper');
    logger.debug(`Paper created/updated for assignment: ${data.assignmentId}`);
    return paper;
  }

  static async findByAssignmentId(assignmentId: string): Promise<IQuestionPaper | null> {
    // Check Redis cache first
    const cached = await CacheService.get<IQuestionPaper>(`paper:${assignmentId}`);
    if (cached) {
      logger.debug(`Cache HIT for paper:${assignmentId}`);
      return cached;
    }

    logger.debug(`Cache MISS for paper:${assignmentId} — querying MongoDB`);
    const paper = await QuestionPaper.findOne({
      assignmentId: new Types.ObjectId(assignmentId),
    }).lean<IQuestionPaper>();

    if (paper) {
      await CacheService.set(`paper:${assignmentId}`, paper);
    }

    return paper;
  }

  static async deleteByAssignmentId(assignmentId: string): Promise<void> {
    await QuestionPaper.deleteOne({ assignmentId: new Types.ObjectId(assignmentId) });
    await CacheService.del(`paper:${assignmentId}`);
    logger.debug(`Paper + cache deleted for assignment: ${assignmentId}`);
  }
}
