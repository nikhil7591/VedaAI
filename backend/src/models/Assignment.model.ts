import { Schema, model, Types, Document } from 'mongoose';

export type AssignmentStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type QuestionType = 'MCQ' | 'SHORT' | 'LONG' | 'TRUE_FALSE';

export interface IAssignment extends Document {
  _id: Types.ObjectId;
  title: string;
  subject: string;
  dueDate: Date;
  totalMarks: number;
  totalQuestions: number;
  questionTypes: QuestionType[];
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
  };
  additionalInstructions?: string;
  fileKey?: string;
  status: AssignmentStatus;
  jobId?: string;
  paperId?: Types.ObjectId;
  groupId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema = new Schema<IAssignment>(
  {
    title:          { type: String, required: true, minlength: 3, trim: true },
    subject:        { type: String, required: true, trim: true },
    dueDate:        { type: Date,   required: true },
    totalMarks:     { type: Number, required: true, min: 1, max: 500 },
    totalQuestions: { type: Number, required: true, min: 1, max: 100 },
    questionTypes:  [{ type: String, enum: ['MCQ', 'SHORT', 'LONG', 'TRUE_FALSE'], required: true }],
    difficultyDistribution: {
      easy:   { type: Number, required: true, min: 0, max: 100 },
      medium: { type: Number, required: true, min: 0, max: 100 },
      hard:   { type: Number, required: true, min: 0, max: 100 },
    },
    additionalInstructions: { type: String, default: '' },
    fileKey:  { type: String },
    status:   { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
    jobId:    { type: String },
    paperId:  { type: Schema.Types.ObjectId, ref: 'QuestionPaper' },
    groupId:  { type: Schema.Types.ObjectId, ref: 'Group' },
  },
  { timestamps: true }
);

// Indexes for common query patterns
AssignmentSchema.index({ status: 1, createdAt: -1 });
AssignmentSchema.index({ jobId: 1 });
AssignmentSchema.index({ groupId: 1 });

export const Assignment = model<IAssignment>('Assignment', AssignmentSchema);
