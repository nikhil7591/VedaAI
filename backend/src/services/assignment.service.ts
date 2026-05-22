import { Types } from 'mongoose';
import { Assignment, IAssignment, AssignmentStatus } from '../models/Assignment.model';
import { logger } from '../utils/logger';

export interface CreateAssignmentDTO {
  title: string;
  subject: string;
  dueDate: string;
  totalMarks: number;
  totalQuestions: number;
  questionTypes: string[];
  difficultyDistribution: { easy: number; medium: number; hard: number };
  additionalInstructions?: string;
  groupId?: string;
}

export class AssignmentService {
  static async create(data: CreateAssignmentDTO): Promise<IAssignment> {
    const assignment = new Assignment({
      ...data,
      dueDate: new Date(data.dueDate),
      status: 'pending',
    });
    await assignment.save();
    logger.debug(`Assignment created: ${assignment._id}`);
    return assignment;
  }

  static async findById(id: string): Promise<IAssignment> {
    if (!Types.ObjectId.isValid(id)) {
      const err = new Error('Invalid assignment ID') as NodeJS.ErrnoException;
      err.name = 'INVALID_ID';
      throw err;
    }
    const assignment = await Assignment.findById(id).lean<IAssignment>();
    if (!assignment) {
      const err = new Error('Assignment not found') as NodeJS.ErrnoException;
      err.name = 'NOT_FOUND';
      throw err;
    }
    return assignment;
  }

  static async update(
    id: string,
    data: Partial<Pick<IAssignment, 'status' | 'jobId' | 'paperId' | 'fileKey'>>
  ): Promise<IAssignment | null> {
    return Assignment.findByIdAndUpdate(
      id,
      { $set: { ...data, updatedAt: new Date() } },
      { new: true }
    ).lean<IAssignment>();
  }

  static async findAll(
    page: number,
    limit: number,
    status?: AssignmentStatus,
    groupId?: string
  ): Promise<{ assignments: IAssignment[]; total: number }> {
    const filter: any = {};
    if (status) filter.status = status;
    if (groupId) filter.groupId = groupId;
    
    const skip = (page - 1) * limit;
    const [assignments, total] = await Promise.all([
      Assignment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean<IAssignment[]>(),
      Assignment.countDocuments(filter),
    ]);
    return { assignments, total };
  }

  static async findByJobId(jobId: string): Promise<IAssignment | null> {
    return Assignment.findOne({ jobId }).lean<IAssignment>();
  }

  static async delete(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      const err = new Error('Invalid assignment ID') as NodeJS.ErrnoException;
      err.name = 'INVALID_ID';
      throw err;
    }
    const result = await Assignment.findByIdAndDelete(id);
    if (!result) {
      const err = new Error('Assignment not found') as NodeJS.ErrnoException;
      err.name = 'NOT_FOUND';
      throw err;
    }
    logger.debug(`Assignment deleted: ${id}`);
  }
}
