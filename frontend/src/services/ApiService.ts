import axios, { AxiosResponse } from 'axios';
import { Project, Comment, ReportingPeriod, NextStep, User } from '../types';

// Configure axios defaults
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

class ApiService {
  // Projects
  static async getProjects(): Promise<Project[]> {
    const response = await api.get('/projects');
    return response.data.projects || response.data;
  }

  static async getProject(id: string): Promise<Project> {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  }

  static async createProject(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    const response = await api.post('/projects', projectData);
    return response.data;
  }

  static async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const response = await api.put(`/projects/${id}`, updates);
    return response.data;
  }

  static async deleteProject(id: string): Promise<void> {
    await api.delete(`/projects/${id}`);
  }

  // Reporting Periods
  static async getReportingPeriods(): Promise<ReportingPeriod[]> {
    const response = await api.get('/periods');
    return response.data.periods || [];
  }

  static async getCurrentPeriod(projectId: string): Promise<ReportingPeriod> {
    const response = await api.get(`/periods/current?projectId=${projectId}`);
    return response.data;
  }

  static async createReportingPeriod(periodData: Omit<ReportingPeriod, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReportingPeriod> {
    const response = await api.post('/periods', periodData);
    return response.data;
  }

  static async createNewPeriod(): Promise<{ success: boolean; message: string; period?: ReportingPeriod }> {
    const response = await api.post('/periods/create-next', { confirmed: true });
    return response.data;
  }

  // Comments
  static async getComments(projectId: string, periodId: string, fieldReference?: string): Promise<Comment[]> {
    let url: string;
    if (fieldReference) {
      // Use the field-specific endpoint
      url = `/comments/field/${projectId}/${periodId}/${encodeURIComponent(fieldReference)}`;
    } else {
      // Use the project-wide endpoint
      url = `/comments/project/${projectId}?periodId=${periodId}`;
    }
    const response = await api.get(url);
    return response.data.data || response.data; // Handle the API response wrapper
  }

  static async createComment(commentData: Omit<Comment, 'id' | 'createdAt' | 'updatedAt' | 'replies'>): Promise<Comment> {
    const response = await api.post('/comments', commentData);
    return response.data.data || response.data; // Handle the API response wrapper
  }

  static async updateComment(id: string, updates: Partial<Comment>): Promise<Comment> {
    const response = await api.put(`/comments/${id}`, updates);
    return response.data.data || response.data;
  }

  static async deleteComment(id: string): Promise<void> {
    await api.delete(`/comments/${id}`);
  }

  static async addReply(parentCommentId: string, replyData: { authorName: string; content: string }): Promise<Comment> {
    const response = await api.post(`/comments/${parentCommentId}/reply`, replyData);
    return response.data.data || response.data;
  }

  // Next Steps
  static async getNextSteps(projectId: string, periodId: string): Promise<NextStep[]> {
    const response = await api.get(`/next-steps?projectId=${projectId}&periodId=${periodId}`);
    return response.data;
  }

  static async createNextStep(stepData: Omit<NextStep, 'id' | 'createdAt' | 'updatedAt'>): Promise<NextStep> {
    const response = await api.post('/next-steps', stepData);
    return response.data;
  }

  static async updateNextStep(id: string, updates: Partial<NextStep>): Promise<NextStep> {
    const response = await api.put(`/next-steps/${id}`, updates);
    return response.data;
  }

  static async deleteNextStep(id: string): Promise<void> {
    await api.delete(`/next-steps/${id}`);
  }

  // Users
  static async getUsers(): Promise<User[]> {
    const response = await api.get('/users');
    return response.data;
  }

  static async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const response = await api.post('/users', userData);
    return response.data;
  }

  // Health Check
  static async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await api.get('/health');
    return response.data;
  }
}

export default ApiService;