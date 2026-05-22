import { create } from 'zustand';
import { AssignmentFormData, QuestionType, DifficultyDistribution } from '../types';

interface AssignmentState extends AssignmentFormData {
  setField: <K extends keyof AssignmentFormData>(key: K, value: AssignmentFormData[K]) => void;
  setQuestionType: (type: QuestionType, selected: boolean) => void;
  setDifficulty: (key: keyof DifficultyDistribution, value: number) => void;
  reset: () => void;
}

const defaultValues: AssignmentFormData = {
  title:                  '',
  subject:                '',
  dueDate:                '',
  totalMarks:             100,
  totalQuestions:         20,
  questionTypes:          ['MCQ'],
  difficultyDistribution: { easy: 40, medium: 40, hard: 20 },
  additionalInstructions: '',
};

export const useAssignmentStore = create<AssignmentState>((set, get) => ({
  ...defaultValues,

  setField: (key, value) => set({ [key]: value } as Partial<AssignmentState>),

  setQuestionType: (type, selected) => {
    const current = get().questionTypes;
    if (selected && !current.includes(type)) {
      set({ questionTypes: [...current, type] });
    } else if (!selected) {
      set({ questionTypes: current.filter((t) => t !== type) });
    }
  },

  setDifficulty: (key, value) => {
    set((state) => ({
      difficultyDistribution: { ...state.difficultyDistribution, [key]: value },
    }));
  },

  reset: () => set(defaultValues),
}));
