export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

export interface Application {
  _id: string;
  name: string;
  phone: string;
  country: string;
  formType: string;
  status: 'new' | 'contacted' | 'in_progress' | 'completed' | 'cancelled';
  notes: string;
  assignedTo?: User;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Stats {
  total: number;
  byStatus: {
    new: number;
    contacted: number;
    in_progress: number;
    completed: number;
    cancelled: number;
  };
  todayCount: number;
  recentApplications: Application[];
}

export interface AuthResponse {
  user: User;
  token: string;
}
