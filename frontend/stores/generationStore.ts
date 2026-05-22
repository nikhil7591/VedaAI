import { create } from 'zustand';
import { GenerationStatus } from '../types';

interface GenerationState {
  assignmentId:  string | null;
  jobId:         string | null;
  status:        GenerationStatus;
  progress:      number;
  stage:         string;
  errorMessage:  string | null;

  setIds:      (assignmentId: string, jobId: string) => void;
  setStatus:   (status: GenerationStatus, progress?: number, error?: string | null, stage?: string) => void;
  setProgress: (progress: number, stage: string) => void;
  reset:       () => void;
}

export const useGenerationStore = create<GenerationState>((set) => ({
  assignmentId:  null,
  jobId:         null,
  status:        'idle',
  progress:      0,
  stage:         '',
  errorMessage:  null,

  setIds: (assignmentId, jobId) => set({ assignmentId, jobId }),

  setStatus: (status, progress = 0, error = null, stage = '') =>
    set({ status, progress, errorMessage: error, stage }),

  setProgress: (progress, stage) => set({ progress, stage }),

  reset: () =>
    set({
      assignmentId: null,
      jobId:        null,
      status:       'idle',
      progress:     0,
      stage:        '',
      errorMessage: null,
    }),
}));
