import axios from 'axios';
import type { AuthResponse, Application, PaginatedResponse, Stats } from '@/types';

// .env (VITE_API_URL) yo'q bo'lsa fallback: https://aa.akaikumogo.uz (SSL)
const FALLBACK_API_ORIGIN = 'https://aa.akaikumogo.uz';
const API_URL = import.meta.env.VITE_API_URL || `${FALLBACK_API_ORIGIN}/api`;
export const API_BASE = API_URL.replace(/\/api\/?$/, '') || FALLBACK_API_ORIGIN;

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Helper function to get full image URL
export const getImageUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_BASE}${path}`;
};

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data.data;
  },
  
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data.data;
  },
  
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  },
};

// Applications API
export const applicationsApi = {
  getAll: async (params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<PaginatedResponse<Application>> => {
    const response = await api.get('/applications', { params });
    return response.data.data;
  },
  
  getOne: async (id: string): Promise<Application> => {
    const response = await api.get(`/applications/${id}`);
    return response.data.data;
  },
  
  update: async (id: string, data: Partial<Application>): Promise<Application> => {
    const response = await api.put(`/applications/${id}`, data);
    return response.data.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/applications/${id}`);
  },
  
  getStats: async (): Promise<Stats> => {
    const response = await api.get('/applications/stats');
    return response.data.data;
  },
};

// Settings API
export const settingsApi = {
  updateQuickReplies: async (quickReplies: Record<string, string>) => {
    const response = await api.put('/telegram/quick-replies', { quickReplies });
    return response.data;
  },
  
  updateOperatorInfo: async (operatorInfo: { name: string; role: string; telegram: string }) => {
    const response = await api.put('/telegram/operator-info', { operatorInfo });
    return response.data;
  },
};

// Hero Settings API
export interface HeroSettings {
  imageUz: string | null;
  imageEn: string | null;
  updatedAt: string;
}

export const heroApi = {
  getSettings: async (): Promise<HeroSettings> => {
    const response = await api.get('/hero/settings');
    return response.data.data;
  },
  
  uploadImage: async (file: File, language: 'uz' | 'en'): Promise<{ imageUrl: string; settings: HeroSettings }> => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('language', language);
    
    const response = await api.post('/hero/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },
  
  deleteImage: async (language: 'uz' | 'en'): Promise<HeroSettings> => {
    const response = await api.delete(`/hero/image/${language}`);
    return response.data.data;
  },
};

// Stats API
export interface StatItem {
  id: string;
  value: number;
  prefix: string;
  suffix: string;
  descriptionUz: string;
  descriptionEn: string;
  order: number;
}

export const statsApi = {
  getAll: async (): Promise<StatItem[]> => {
    const response = await api.get('/stats/admin');
    return response.data.data;
  },
  
  upsert: async (stat: StatItem): Promise<StatItem> => {
    const response = await api.post('/stats', stat);
    return response.data.data;
  },
  
  updateAll: async (stats: StatItem[]): Promise<StatItem[]> => {
    const response = await api.put('/stats/all', { stats });
    return response.data.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/stats/${id}`);
  },
  
  reorder: async (orderedIds: string[]): Promise<StatItem[]> => {
    const response = await api.put('/stats/reorder', { orderedIds });
    return response.data.data;
  },
};

// Features API (Why Us section)
export interface FeatureItem {
  id: string;
  icon: string;
  titleUz: string;
  titleEn: string;
  descriptionUz: string;
  descriptionEn: string;
  order: number;
}

export const featuresApi = {
  getAll: async (): Promise<FeatureItem[]> => {
    const response = await api.get('/features/admin');
    return response.data.data;
  },
  
  upsert: async (feature: FeatureItem): Promise<FeatureItem> => {
    const response = await api.post('/features', feature);
    return response.data.data;
  },
  
  updateAll: async (features: FeatureItem[]): Promise<FeatureItem[]> => {
    const response = await api.put('/features/all', { features });
    return response.data.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/features/${id}`);
  },
  
  reorder: async (orderedIds: string[]): Promise<FeatureItem[]> => {
    const response = await api.put('/features/reorder', { orderedIds });
    return response.data.data;
  },
};

// Programs API
export interface ProgramItem {
  id: string;
  imageUz: string | null;
  imageEn: string | null;
  titleUz: string;
  titleEn: string;
  description1Uz: string;
  description1En: string;
  description2Uz: string;
  description2En: string;
  order: number;
}

export const programsApi = {
  getAll: async (): Promise<ProgramItem[]> => {
    const response = await api.get('/programs/admin');
    return response.data.data;
  },
  
  upsert: async (program: Omit<ProgramItem, 'imageUz' | 'imageEn'>): Promise<ProgramItem> => {
    const response = await api.post('/programs', program);
    return response.data.data;
  },
  
  uploadImage: async (id: string, file: File, language: 'uz' | 'en'): Promise<{ imageUrl: string; program: ProgramItem }> => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('language', language);
    
    const response = await api.post(`/programs/${id}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },
  
  deleteImage: async (id: string, language: 'uz' | 'en'): Promise<ProgramItem> => {
    const response = await api.delete(`/programs/${id}/image/${language}`);
    return response.data.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/programs/${id}`);
  },
  
  reorder: async (orderedIds: string[]): Promise<ProgramItem[]> => {
    const response = await api.put('/programs/reorder', { orderedIds });
    return response.data.data;
  },
};

// Countries API
export interface CountryItem {
  id: string;
  imageUz: string | null;
  imageEn: string | null;
  nameUz: string;
  nameEn: string;
  bgText: string;
  order: number;
}

export const countriesApi = {
  getAll: async (): Promise<CountryItem[]> => {
    const response = await api.get('/countries/admin');
    return response.data.data;
  },
  
  upsert: async (country: Omit<CountryItem, 'imageUz' | 'imageEn'>): Promise<CountryItem> => {
    const response = await api.post('/countries', country);
    return response.data.data;
  },
  
  uploadImage: async (id: string, file: File, language: 'uz' | 'en'): Promise<{ imageUrl: string; country: CountryItem }> => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('language', language);
    
    const response = await api.post(`/countries/${id}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },
  
  deleteImage: async (id: string, language: 'uz' | 'en'): Promise<CountryItem> => {
    const response = await api.delete(`/countries/${id}/image/${language}`);
    return response.data.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/countries/${id}`);
  },
  
  reorder: async (orderedIds: string[]): Promise<CountryItem[]> => {
    const response = await api.put('/countries/reorder', { orderedIds });
    return response.data.data;
  },
};

// Steps API (How it works)
export interface StepItem {
  id: string;
  titleUz: string;
  titleEn: string;
  descriptionUz: string;
  descriptionEn: string;
  order: number;
}

export const stepsApi = {
  getAll: async (): Promise<StepItem[]> => {
    const response = await api.get('/steps/admin');
    return response.data.data;
  },
  
  upsert: async (step: StepItem): Promise<StepItem> => {
    const response = await api.post('/steps', step);
    return response.data.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/steps/${id}`);
  },
  
  reorder: async (orderedIds: string[]): Promise<StepItem[]> => {
    const response = await api.put('/steps/reorder', { orderedIds });
    return response.data.data;
  },
};

// Video API
export interface VideoSettings {
  youtubeUrl: string;
  titleUz: string;
  titleEn: string;
  subtitleUz: string;
  subtitleEn: string;
}

export const videoApi = {
  get: async (): Promise<VideoSettings> => {
    const response = await api.get('/video');
    return response.data.data;
  },
  
  update: async (settings: VideoSettings): Promise<VideoSettings> => {
    const response = await api.put('/video', settings);
    return response.data.data;
  },
};

// Testimonials API
export interface TestimonialItem {
  id: string;
  avatar: string | null;
  textUz: string;
  textEn: string;
  nameUz: string;
  nameEn: string;
  universityUz: string;
  universityEn: string;
  order: number;
}

export const testimonialsApi = {
  getAll: async (): Promise<TestimonialItem[]> => {
    const response = await api.get('/testimonials/admin');
    return response.data.data;
  },
  
  upsert: async (testimonial: Omit<TestimonialItem, 'avatar'>): Promise<TestimonialItem> => {
    const response = await api.post('/testimonials', testimonial);
    return response.data.data;
  },
  
  uploadAvatar: async (id: string, file: File): Promise<{ avatarUrl: string; testimonial: TestimonialItem }> => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await api.post(`/testimonials/${id}/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },
  
  deleteAvatar: async (id: string): Promise<TestimonialItem> => {
    const response = await api.delete(`/testimonials/${id}/avatar`);
    return response.data.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/testimonials/${id}`);
  },
  
  reorder: async (orderedIds: string[]): Promise<TestimonialItem[]> => {
    const response = await api.put('/testimonials/reorder', { orderedIds });
    return response.data.data;
  },
};

// Video Tips API
export interface TipItem {
  id: string;
  youtubeUrl: string;
  titleUz: string;
  titleEn: string;
  order: number;
}

export const tipsApi = {
  getAll: async (): Promise<TipItem[]> => {
    const response = await api.get('/tips/admin');
    return response.data.data;
  },
  
  upsert: async (tip: TipItem): Promise<TipItem> => {
    const response = await api.post('/tips', tip);
    return response.data.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/tips/${id}`);
  },
  
  reorder: async (orderedIds: string[]): Promise<TipItem[]> => {
    const response = await api.put('/tips/reorder', { orderedIds });
    return response.data.data;
  },
};

// FAQ API
export interface FaqSettings {
  titleUz: string;
  titleEn: string;
  subtitleUz: string;
  subtitleEn: string;
  phoneNumber: string;
}

export interface FaqItem {
  id: string;
  questionUz: string;
  questionEn: string;
  answerUz: string;
  answerEn: string;
  order: number;
}

export const faqApi = {
  getSettings: async (): Promise<FaqSettings> => {
    const response = await api.get('/faq/settings');
    return response.data.data;
  },
  
  updateSettings: async (settings: FaqSettings): Promise<FaqSettings> => {
    const response = await api.put('/faq/settings', settings);
    return response.data.data;
  },
  
  getAll: async (): Promise<FaqItem[]> => {
    const response = await api.get('/faq/admin');
    return response.data.data;
  },
  
  upsert: async (faq: FaqItem): Promise<FaqItem> => {
    const response = await api.post('/faq', faq);
    return response.data.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/faq/${id}`);
  },
  
  reorder: async (orderedIds: string[]): Promise<FaqItem[]> => {
    const response = await api.put('/faq/reorder', { orderedIds });
    return response.data.data;
  },
};

// Contact API
export interface ContactSettings {
  titleUz: string;
  titleEn: string;
  addressUz: string;
  addressEn: string;
  landmarkUz: string;
  landmarkEn: string;
  metroUz: string;
  metroEn: string;
  phone: string;
  email: string;
  mapUrl: string;
  mapLink: string;
  telegram: string;
  instagram: string;
  youtube: string;
  workingHoursUz: string;
  workingHoursEn: string;
}

export const contactApi = {
  get: async (): Promise<ContactSettings> => {
    const response = await api.get('/contact');
    return response.data.data;
  },
  
  update: async (settings: ContactSettings): Promise<ContactSettings> => {
    const response = await api.put('/contact', settings);
    return response.data.data;
  },
};

// Chat API
export interface Conversation {
  odId: string;
  lastMessage: string;
  lastMessageTime: string;
  lastMessageIsUser: boolean;
  totalMessages: number;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  isRead: boolean;
  createdAt: string;
}

export interface ChatHistory {
  messages: ChatMessage[];
  total: number;
  page: number;
  totalPages: number;
}

export const chatApi = {
  // Get all conversations
  getConversations: async (): Promise<Conversation[]> => {
    const response = await api.get('/telegram/admin/conversations');
    return response.data.data;
  },
  
  // Get unread count
  getUnreadCount: async (): Promise<number> => {
    const response = await api.get('/telegram/admin/unread-count');
    return response.data.data.count;
  },
  
  // Get chat history for a user
  getChatHistory: async (odId: string, page = 1, limit = 50): Promise<ChatHistory> => {
    const response = await api.get(`/telegram/admin/history/${encodeURIComponent(odId)}`, {
      params: { page, limit },
    });
    return response.data.data;
  },
  
  // Send reply to user
  sendReply: async (odId: string, message: string): Promise<ChatMessage> => {
    const response = await api.post(`/telegram/admin/reply/${encodeURIComponent(odId)}`, { message });
    return response.data.data;
  },
  
  // Delete conversation
  deleteConversation: async (odId: string): Promise<void> => {
    await api.delete(`/telegram/admin/conversation/${encodeURIComponent(odId)}`);
  },
  
  // Quick replies settings
  getQuickReplies: async (): Promise<Record<string, string>> => {
    const response = await api.get('/telegram?action=getQuickReplies');
    return response.data.quickReplies || {};
  },
  
  updateQuickReplies: async (quickReplies: Record<string, string>): Promise<void> => {
    await api.put('/telegram/quick-replies', { quickReplies });
  },
  
  // Operator info settings
  getOperatorInfo: async (): Promise<{ name: string; role: string; telegram: string }> => {
    const response = await api.get('/telegram?action=getOperatorInfo');
    return response.data.operatorInfo || { name: '', role: '', telegram: '' };
  },
  
  updateOperatorInfo: async (operatorInfo: { name: string; role: string; telegram: string }): Promise<void> => {
    await api.put('/telegram/operator-info', { operatorInfo });
  },
};
