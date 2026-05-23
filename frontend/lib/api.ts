import axios, { AxiosError } from 'axios';
import {
  AssignmentFormData,
  CreateAssignmentResponse,
  AssignmentStatusResponse,
  QuestionPaper,
  Assignment,
  PaginationMeta,
  ApiSuccess,
} from '../types';

const api = axios.create({
  baseURL:         process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1',
  timeout:         30_000,
  headers:         { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Response interceptor — unwrap data or throw structured error
api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<{ success: false; error: { code: string; message: string } }>) => {
    const apiErr = err.response?.data?.error;
    if (apiErr) {
      const error = new Error(apiErr.message) as Error & { code: string };
      error.code = apiErr.code;
      return Promise.reject(error);
    }
    return Promise.reject(err);
  }
);

// ─── Assignment API ────────────────────────────────────────────────────────────

export const AssignmentAPI = {
  create: async (data: AssignmentFormData): Promise<CreateAssignmentResponse> => {
    const res = await api.post<ApiSuccess<CreateAssignmentResponse>>('/assignments', data);
    return res.data.data;
  },

  getById: async (id: string): Promise<Assignment> => {
    const res = await api.get<ApiSuccess<Assignment>>(`/assignments/${id}`);
    return res.data.data;
  },

  getStatus: async (id: string): Promise<AssignmentStatusResponse> => {
    const res = await api.get<ApiSuccess<AssignmentStatusResponse>>(`/assignments/${id}/status`);
    return res.data.data;
  },

  list: async (
    page = 1,
    limit = 10,
    status?: string
  ): Promise<{ assignments: Assignment[]; pagination: PaginationMeta }> => {
    const params: Record<string, unknown> = { page, limit };
    if (status) params.status = status;
    const res = await api.get<ApiSuccess<{ assignments: Assignment[]; pagination: PaginationMeta }>>(
      '/assignments',
      { params }
    );
    return res.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/assignments/${id}`);
  },
};

export const AIAPI = {
  extractTextFromImage: async (file: File): Promise<{ text: string; summary: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await api.post<ApiSuccess<{ text: string; summary: string }>>('/ai/extract-text', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return res.data.data;
  },

  gradeSubmission: async (data: {
    questionText: string;
    studentAnswer: string;
    maxMarks: number;
    subject: string;
    gradeLevel?: string;
    correctAnswer?: string;
  }) => {
    const res = await api.post<ApiSuccess<{
      score: number;
      maxMarks: number;
      percentage: number;
      grade: string;
      feedback: string;
      strengths: string[];
      improvements: string[];
      detailedBreakdown: string;
    }>>('/ai/grade', data);
    return res.data.data;
  },

  buildRubric: async (data: {
    subject: string;
    topic: string;
    totalMarks: number;
    criteria?: number;
    gradeLevel?: string;
    taskType?: string;
  }) => {
    const res = await api.post<ApiSuccess<{
      title: string;
      subject: string;
      topic: string;
      taskType: string;
      totalMarks: number;
      criteria: {
        name: string;
        description: string;
        maxMarks: number;
        levels: { label: string; marks: number; description: string }[];
      }[];
    }>>('/ai/rubric', data);
    return res.data.data;
  },

  generateFeedback: async (data: {
    studentName?: string;
    subject: string;
    topic: string;
    studentAnswer: string;
    questionText?: string;
    marks?: number;
    tone?: 'Encouraging' | 'Neutral' | 'Strict';
  }) => {
    const res = await api.post<ApiSuccess<{
      studentName: string;
      subject: string;
      overallComment: string;
      strengths: string[];
      areasToImprove: string[];
      actionPlan: string[];
      motivationalClose: string;
    }>>('/ai/feedback', data);
    return res.data.data;
  },

  createQuiz: async (data: {
    topic: string;
    subject: string;
    gradeLevel?: string;
    count?: number;
    type?: 'MCQ' | 'True/False' | 'Mixed';
    difficulty?: 'Easy' | 'Medium' | 'Hard' | 'Mixed';
  }) => {
    const res = await api.post<ApiSuccess<{
      title: string;
      subject: string;
      topic: string;
      gradeLevel: string;
      estimatedMinutes: number;
      questions: {
        number: number;
        text: string;
        type: string;
        difficulty: string;
        options: string[];
        correctAnswer: string;
        explanation: string;
      }[];
    }>>('/ai/quiz', data);
    return res.data.data;
  },
};

// ─── Analytics API ────────────────────────────────────────────────────────────

export const AnalyticsAPI = {
  getDashboard: async () => {
    const res = await api.get<ApiSuccess<{
      total: number;
      completed: number;
      processing: number;
      pending: number;
      failed: number;
      successRate: number;
      bySubject: { subject: string; count: number }[];
      overTime: { date: string; count: number }[];
      avgMarksBySubject: { subject: string; avgMarks: number; count: number }[];
      questionTypeStats: { type: string; count: number }[];
      insights: string[];
    }>>('/analytics/dashboard');
    return res.data.data;
  },
};

// ─── Paper API ────────────────────────────────────────────────────────────────

export const PaperAPI = {
  get: async (assignmentId: string): Promise<QuestionPaper> => {
    const res = await api.get<ApiSuccess<QuestionPaper>>(`/assignments/${assignmentId}/paper`);
    return res.data.data;
  },

  regenerate: async (
    assignmentId: string,
    additionalInstructions?: string
  ): Promise<CreateAssignmentResponse> => {
    const res = await api.post<ApiSuccess<CreateAssignmentResponse>>(
      `/assignments/${assignmentId}/regenerate`,
      { additionalInstructions }
    );
    return res.data.data;
  },
};

// ─── Group API ────────────────────────────────────────────────────────────────

export const GroupAPI = {
  list: async () => {
    const res = await api.get('/groups');
    return res.data.data;
  },
  getById: async (id: string) => {
    const res = await api.get(`/groups/${id}`);
    return res.data.data;
  },
  create: async (data: any) => {
    const res = await api.post('/groups', data);
    return res.data.data;
  },
  update: async (id: string, data: any) => {
    const res = await api.put(`/groups/${id}`, data);
    return res.data.data;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/groups/${id}`);
    return res.data.data;
  },
};

// ─── Student API ──────────────────────────────────────────────────────────────

export const StudentAPI = {
  listByGroup: async (groupId: string) => {
    const res = await api.get(`/students/group/${groupId}`);
    return res.data.data;
  },
  create: async (groupId: string, data: any) => {
    const res = await api.post(`/students/group/${groupId}`, data);
    return res.data.data;
  },
  update: async (id: string, data: any) => {
    const res = await api.put(`/students/${id}`, data);
    return res.data.data;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/students/${id}`);
    return res.data.data;
  },
};

// ─── Profile API ──────────────────────────────────────────────────────────────

let _profileCache: { data: any; ts: number } | null = null;
let _profileInflight: Promise<any> | null = null;
const PROFILE_TTL = 30_000; // 30 seconds cache

export const ProfileAPI = {
  get: async () => {
    // Return cached data if fresh
    if (_profileCache && Date.now() - _profileCache.ts < PROFILE_TTL) {
      return _profileCache.data;
    }
    // De-duplicate concurrent requests
    if (_profileInflight) return _profileInflight;
    _profileInflight = api.get('/profile')
      .then(res => {
        _profileCache = { data: res.data.data, ts: Date.now() };
        _profileInflight = null;
        return _profileCache.data;
      })
      .catch(err => {
        _profileInflight = null;
        throw err;
      });
    return _profileInflight;
  },
  update: async (data: any) => {
    const res = await api.put('/profile', data);
    // Keep cache hot with latest profile and notify UI listeners.
    _profileCache = { data: res.data.data, ts: Date.now() };
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('profile:updated', { detail: res.data.data }));
    }
    return res.data.data;
  },
  invalidateCache: () => { _profileCache = null; },
};

export default api;
