// File: frontend/src/lib/api.ts

import axios, { AxiosResponse } from 'axios';
import type {
  Project,
  ProjectCreateData,
  ProjectListParams,
  ProjectListResponse,
  ProjectStatistics,
  ProjectScores,
  MissingInfoResponse,
  ScoreUpdateData,
  ScoreSummary,
  ApiResponse,
  ScoreHistoryResponse,
  // FIXED: Added missing imports
  MissingInfo,
  MissingInfoCreateData,
  MissingInfoUpdateData
} from './types';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  timeout: 150000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Redirect to login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Helper function to handle API responses
const handleResponse = <T>(response: AxiosResponse<any>): ApiResponse<T> => {

  // Check if response already has the expected structure
  if (response.data && typeof response.data === 'object' && 'code' in response.data) {
    return response.data;
  }

  // If not, wrap the response in the expected format
  return {
    code: response.status,
    message: 'success',
    data: response.data
  };
};

// FIXED: Declare extended interfaces to avoid property assignment errors
interface ExtendedProjectApi {
  getStatistics: () => Promise<ApiResponse<ProjectStatistics>>;
  list: (params?: ProjectListParams) => Promise<ApiResponse<ProjectListResponse>>;
  create: (data: ProjectCreateData) => Promise<ApiResponse<Project>>;
  getDetail: (projectId: string) => Promise<ApiResponse<Project>>;
  update: (projectId: string, data: Partial<ProjectCreateData>) => Promise<ApiResponse<Project>>;
  delete: (projectId: string) => Promise<ApiResponse<{ message: string }>>;
  updateTeamMembers: (projectId: string, teamMembers: string) => Promise<ApiResponse<any>>; // FIXED: Declared property
}

interface ExtendedScoreApi {
  getScores: (projectId: string) => Promise<ApiResponse<ProjectScores>>;
  updateScores: (projectId: string, data: ScoreUpdateData) => Promise<ApiResponse<ProjectScores>>;
  getMissingInfo: (projectId: string) => Promise<ApiResponse<MissingInfoResponse>>;
  getScoreSummary: (projectId: string) => Promise<ApiResponse<ScoreSummary>>;
  getScoreHistory: (projectId: string) => Promise<ApiResponse<ScoreHistoryResponse>>;
  addMissingInfo: (projectId: string, data: MissingInfoCreateData) => Promise<ApiResponse<any>>; // FIXED: Declared property
  updateMissingInfo: (projectId: string, infoId: string, data: MissingInfoUpdateData) => Promise<ApiResponse<any>>; // FIXED: Declared property
  deleteMissingInfo: (projectId: string, infoId: string) => Promise<ApiResponse<any>>; // FIXED: Declared property
}

// Project API
export const projectApi: ExtendedProjectApi = {
  // Get project statistics for dashboard
  getStatistics: async (): Promise<ApiResponse<ProjectStatistics>> => {
    const response = await api.get<ApiResponse<ProjectStatistics>>('/projects/statistics');
    return handleResponse(response);
  },

  // List projects with pagination and filtering
  list: async (params: ProjectListParams = {}): Promise<ApiResponse<ProjectListResponse>> => {
    const response = await api.get<ApiResponse<ProjectListResponse>>('/projects', { params });
    return handleResponse(response);
  },

  // Create a new project
  create: async (data: ProjectCreateData): Promise<ApiResponse<Project>> => {
    const response = await api.post<ApiResponse<Project>>('/projects', data);
    return handleResponse(response);
  },

  // Get project details
  getDetail: async (projectId: string): Promise<ApiResponse<Project>> => {
    const response = await api.get<ApiResponse<Project>>(`/projects/${projectId}`);
    return handleResponse(response);
  },

  // Update project
  update: async (projectId: string, data: Partial<ProjectCreateData>): Promise<ApiResponse<Project>> => {
    const response = await api.put<ApiResponse<Project>>(`/projects/${projectId}`, data);
    return handleResponse(response);
  },

  delete: async (projectId: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete<ApiResponse<{ message: string }>>(`/projects/${projectId}`);
    return handleResponse(response);
  },

  // FIXED: Team members update function properly declared
  updateTeamMembers: async (projectId: string, teamMembers: string): Promise<ApiResponse<any>> => {
    // FIXED: Send as JSON object instead of plain text
    const response = await api.put<ApiResponse<any>>(`/projects/${projectId}/team-members`, {
      team_members: teamMembers  // FIXED: Wrap in object
    }, {
      headers: {
        'Content-Type': 'application/json',  // FIXED: Use JSON content type
      },
    });
    return handleResponse(response);
  },
};

// Score API
export const scoreApi: ExtendedScoreApi = {
  // Get project scores
  getScores: async (projectId: string): Promise<ApiResponse<ProjectScores>> => {
    const response = await api.get<ApiResponse<ProjectScores>>(`/projects/${projectId}/scores`);
    return handleResponse(response);
  },

  // Update project scores
  updateScores: async (projectId: string, data: ScoreUpdateData): Promise<ApiResponse<ProjectScores>> => {
    const response = await api.put<ApiResponse<ProjectScores>>(`/projects/${projectId}/scores`, data);
    return handleResponse(response);
  },

  // Get missing information
  getMissingInfo: async (projectId: string): Promise<ApiResponse<MissingInfoResponse>> => {
    const response = await api.get<ApiResponse<MissingInfoResponse>>(`/projects/${projectId}/missing-information`);
    return handleResponse(response);
  },

  // Get score summary
  getScoreSummary: async (projectId: string): Promise<ApiResponse<ScoreSummary>> => {
    const response = await api.get<ApiResponse<ScoreSummary>>(`/projects/${projectId}/scores/summary`);
    return handleResponse(response);
  },

  // Get score change history
  getScoreHistory: async (projectId: string): Promise<ApiResponse<ScoreHistoryResponse>> => {
    const response = await api.get<ApiResponse<ScoreHistoryResponse>>(`/projects/${projectId}/scores/history`);
    return handleResponse(response);
  },

  // FIXED: Missing info functions properly declared
  addMissingInfo: async (projectId: string, data: MissingInfoCreateData): Promise<ApiResponse<any>> => {
    const response = await api.post<ApiResponse<any>>(`/projects/${projectId}/missing-information`, data);
    return handleResponse(response);
  },

  updateMissingInfo: async (projectId: string, infoId: string, data: MissingInfoUpdateData): Promise<ApiResponse<any>> => {
    const response = await api.put<ApiResponse<any>>(`/projects/${projectId}/missing-information/${infoId}`, data);
    return handleResponse(response);
  },

  deleteMissingInfo: async (projectId: string, infoId: string): Promise<ApiResponse<any>> => {
    const response = await api.delete<ApiResponse<any>>(`/projects/${projectId}/missing-information/${infoId}`);
    return handleResponse(response);
  },
};

export const missingInfoApi = {
  // Get all missing information for a project
  getAll: async (projectId: string): Promise<ApiResponse<MissingInfoResponse>> => {
    const response = await api.get<ApiResponse<MissingInfoResponse>>(`/projects/${projectId}/missing-information`);
    return handleResponse(response);
  },

  // Add new missing information
  create: async (projectId: string, data: MissingInfoCreateData): Promise<ApiResponse<any>> => {
    try {
      console.log('📤 Creating missing info:', data);
      const response = await api.post<ApiResponse<any>>(`/projects/${projectId}/missing-information`, data);
      console.log('✅ Missing info created successfully:', response.data);
      return handleResponse(response);
    } catch (error: any) {
      console.error('❌ Failed to create missing info:', error);

      // FIXED: Provide more specific error messages
      if (error.response?.status === 409) {
        throw new Error('此缺失信息已存在，请勿重复添加');
      } else if (error.response?.status === 400) {
        throw new Error('请填写完整的缺失信息内容');
      } else if (error.response?.status === 404) {
        throw new Error('项目不存在');
      } else {
        throw new Error(error.response?.data?.message || '添加缺失信息失败');
      }
    }
  },

  // Delete missing information
  delete: async (projectId: string, infoId: string): Promise<ApiResponse<any>> => {
    try {
      console.log('🗑️ Deleting missing info:', infoId);

      if (!infoId) {
        throw new Error('缺失信息ID不能为空');
      }

      const response = await api.delete<ApiResponse<any>>(`/projects/${projectId}/missing-information/${infoId}`);
      console.log('✅ Missing info deleted successfully:', response.data);
      return handleResponse(response);
    } catch (error: any) {
      console.error('❌ Failed to delete missing info:', error);

      // FIXED: Provide more specific error messages
      if (error.response?.status === 404) {
        throw new Error('要删除的缺失信息不存在');
      } else {
        throw new Error(error.response?.data?.message || '删除缺失信息失败');
      }
    }
  },

  // Get specific missing information record (if needed)
  getDetail: async (projectId: string, infoId: string): Promise<ApiResponse<MissingInfo>> => {
    const response = await api.get<ApiResponse<MissingInfo>>(`/projects/${projectId}/missing-information/${infoId}`);
    return handleResponse(response);
  },
};

// Business Plan API
export const businessPlanApi = {
  // Upload business plan
  upload: async (projectId: string, file: File): Promise<ApiResponse<any>> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<ApiResponse<any>>(
      `/projects/${projectId}/business-plans`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return handleResponse(response);
  },

  // Get upload status
  getStatus: async (projectId: string): Promise<ApiResponse<any>> => {
    const response = await api.get<ApiResponse<any>>(`/projects/${projectId}/business-plans/status`);
    return handleResponse(response);
  },
    // Get business plan information
  getInfo: async (projectId: string): Promise<ApiResponse<any>> => {
    const response = await api.get<ApiResponse<any>>(`/projects/${projectId}/business-plans/info`);
    return handleResponse(response);
  },

  download: async (projectId: string): Promise<Blob> => {
    const response = await api.get(`/projects/${projectId}/business-plans/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Helper method to trigger download with proper filename
  downloadAndSave: async (projectId: string, fallbackFilename: string = 'business_plan.pdf'): Promise<void> => {
    try {
      // Get BP info first to get the original filename
      const infoResponse = await businessPlanApi.getInfo(projectId);
      const fileName = infoResponse.data.file_name || fallbackFilename;

      // Download the file
      const blob = await businessPlanApi.download(projectId);

      // Create download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      throw error;
    }
  },
};

// Report API
export const reportApi = {
  // Get report information
  getReport: async (projectId: string): Promise<ApiResponse<any>> => {
    const response = await api.get<ApiResponse<any>>(`/projects/${projectId}/reports`);
    return handleResponse(response);
  },

  // Download report
  downloadReport: async (projectId: string): Promise<Blob> => {
    const response = await api.get(`/projects/${projectId}/reports/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

// Auth API
export const authApi = {
  // User login
  login: async (username: string, password: string): Promise<ApiResponse<any>> => {
    const response = await api.post<ApiResponse<any>>('/auth/login', { username, password });
    return handleResponse(response);
  },

  // Logout
  logout: async (): Promise<void> => {
    localStorage.removeItem('token');
  },
};

// FIXED: Removed separate teamMembersApi since it's now part of projectApi
// No need for separate export since projectApi.updateTeamMembers is available

// Export default api instance for custom requests
export default api;