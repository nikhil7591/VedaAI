import { create } from 'zustand';
import { QuestionPaper } from '../types';

interface PaperState {
  paper:     QuestionPaper | null;
  isLoading: boolean;
  error:     string | null;
  setPaper:  (paper: QuestionPaper) => void;
  setLoading:(loading: boolean) => void;
  setError:  (error: string | null) => void;
  clearPaper:() => void;
}

export const usePaperStore = create<PaperState>((set) => ({
  paper:     null,
  isLoading: false,
  error:     null,

  setPaper:   (paper)   => set({ paper, isLoading: false, error: null }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError:   (error)   => set({ error, isLoading: false }),
  clearPaper: ()        => set({ paper: null, isLoading: false, error: null }),
}));
