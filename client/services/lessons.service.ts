import apiClient from '@/lib/api';

export interface Lesson {
  id: string;
  title: string;
  content: string;
  order: number;
  completed?: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface LessonProgress {
  id: string;
  lessonId: string;
  completed: boolean;
  completedAt?: string;
}

export interface LessonsResponse {
  success: boolean;
  data?: Lesson[];
  error?: {
    code: string;
    message: string;
  };
}

export interface LessonResponse {
  success: boolean;
  data?: Lesson;
  error?: {
    code: string;
    message: string;
  };
}

export interface CompleteLessonResponse {
  success: boolean;
  data?: {
    progress: LessonProgress;
    onboardingStep?: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

export const lessonsService = {
  /**
   * Get all lessons with user's completion status
   */
  async getLessons(): Promise<LessonsResponse> {
    const response = await apiClient.get('/api/lessons');
    return response.data;
  },

  /**
   * Get single lesson details with completion status
   */
  async getLessonDetails(lessonId: string): Promise<LessonResponse> {
    const response = await apiClient.get(`/api/lessons/${lessonId}`);
    return response.data;
  },

  /**
   * Mark lesson as complete
   */
  async completeLesson(lessonId: string): Promise<CompleteLessonResponse> {
    const response = await apiClient.post(`/api/lessons/${lessonId}/complete`);
    return response.data;
  },
};

