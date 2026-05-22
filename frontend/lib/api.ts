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
    // Invalidate cache after update
    _profileCache = null;
    return res.data.data;
  },
  invalidateCache: () => { _profileCache = null; },
};

export default api;
