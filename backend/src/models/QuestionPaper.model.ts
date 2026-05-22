import { Schema, model, Types, Document } from 'mongoose';

export interface IQuestion {
  questionNumber: number;
  text: string;
  type: 'MCQ' | 'SHORT' | 'LONG' | 'TRUE_FALSE';
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  options?: string[];
  answer?: string;
}

export interface ISection {
  sectionLabel: string;
  title: string;
  instruction: string;
  totalMarks: number;
  questions: IQuestion[];
}

export interface IQuestionPaper extends Document {
  _id: Types.ObjectId;
  assignmentId: Types.ObjectId;
  title: string;
  subject: string;
  dueDate?: Date;
  totalMarks: number;
  sections: ISection[];
  metadata: {
    generatedAt: Date;
    llmModel: string;
    promptTokens?: number;
    totalTokens?: number;
  };
  pdfUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    questionNumber: { type: Number },
    text:           { type: String, required: true },
    type:           { type: String, enum: ['MCQ', 'SHORT', 'LONG', 'TRUE_FALSE'], required: true },
    difficulty:     { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    marks:          { type: Number, required: true, min: 0 },
    options:        [{ type: String }],
    answer:         { type: String },
  },
  { _id: false }
);

const SectionSchema = new Schema<ISection>(
  {
    sectionLabel: { type: String, required: true },
    title:        { type: String, required: true },
    instruction:  { type: String, required: true },
    totalMarks:   { type: Number, default: 0 },
    questions:    [QuestionSchema],
  },
  { _id: false }
);

const QuestionPaperSchema = new Schema<IQuestionPaper>(
  {
    assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
    title:        { type: String },
    subject:      { type: String },
    dueDate:      { type: Date },
    totalMarks:   { type: Number },
    sections:     [SectionSchema],
    metadata: {
      generatedAt:  { type: Date, required: true },
      llmModel:     { type: String, required: true },
      promptTokens: { type: Number },
      totalTokens:  { type: Number },
    },
    pdfUrl: { type: String },
  },
  { timestamps: true }
);

// One paper per assignment
QuestionPaperSchema.index({ assignmentId: 1 }, { unique: true });

export const QuestionPaper = model<IQuestionPaper>('QuestionPaper', QuestionPaperSchema);
