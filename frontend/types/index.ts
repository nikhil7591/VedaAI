// ─── Enums ───────────────────────────────────────────────────────────────────

export type QuestionType       = 'MCQ' | 'SHORT' | 'LONG' | 'TRUE_FALSE';
export type DifficultyLevel    = 'easy' | 'medium' | 'hard';
export type AssignmentStatus   = 'pending' | 'processing' | 'completed' | 'failed';
export type GenerationStatus   = 'idle' | 'queued' | 'processing' | 'completed' | 'failed';

// ─── Assignment ───────────────────────────────────────────────────────────────

export interface DifficultyDistribution {
  easy:   number;
  medium: number;
  hard:   number;
}

export interface AssignmentFormData {
  title:                  string;
  subject:                string;
  dueDate:                string;
  totalMarks:             number;
  totalQuestions:         number;
  questionTypes:          QuestionType[];
  difficultyDistribution: DifficultyDistribution;
  additionalInstructions: string;
}

export interface Assignment extends AssignmentFormData {
  _id:       string;
  status:    AssignmentStatus;
  jobId?:    string;
  paperId?:  string;
  groupId?:  string;
  createdAt: string;
  updatedAt: string;
}

// ─── Question Paper ───────────────────────────────────────────────────────────

export interface Question {
  questionNumber: number;
  text:           string;
  type:           QuestionType;
  difficulty:     DifficultyLevel;
  marks:          number;
  options?:       string[];
  answer?:        string;
}

export interface Section {
  sectionLabel: string;
  title:        string;
  instruction:  string;
  totalMarks:   number;
  questions:    Question[];
}

export interface PaperMetadata {
  generatedAt:  string;
  llmModel:     string;
  promptTokens?: number;
  totalTokens?:  number;
}

export interface QuestionPaper {
  _id:          string;
  assignmentId: string;
  title:        string;
  subject:      string;
  dueDate?:     string;
  totalMarks:   number;
  sections:     Section[];
  metadata:     PaperMetadata;
  pdfUrl?:      string;
  createdAt:    string;
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data:    T;
}

export interface ApiError {
  success: false;
  error: {
    code:     string;
    message:  string;
    details?: { field: string; message: string }[];
  };
}

export interface CreateAssignmentResponse {
  assignmentId: string;
  jobId:        string;
  status:       string;
}

export interface AssignmentStatusResponse {
  assignmentId:  string;
  jobId?:        string;
  status:        string;
  progress:      number;
  errorMessage?: string | null;
}

export interface PaginationMeta {
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}

// ─── WebSocket Events ─────────────────────────────────────────────────────────

export interface WsGenerationStarted {
  assignmentId: string;
  jobId:        string;
  message:      string;
  timestamp:    string;
}

export interface WsGenerationProgress {
  assignmentId: string;
  jobId:        string;
  progress:     number;
  stage:        string;
  timestamp:    string;
}

export interface WsGenerationCompleted {
  assignmentId: string;
  jobId:        string;
  paperId:      string;
  message:      string;
  timestamp:    string;
}

export interface WsGenerationFailed {
  assignmentId: string;
  jobId:        string;
  errorCode:    string;
  message:      string;
  timestamp:    string;
}
