// Shape of every JSON object the Rolebook backend returns. These mirror the
// Go structs in backend/internal/handlers and the queries in
// backend/db/generated. Keep them in sync if the backend response shape
// ever changes.

export interface User {
  id: number;
  email: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Rolebook {
  id: number;
  owner_id: number;
  role_title: string;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: number;
  rolebook_id: number;
  name: string;
  role: string;
  relationship_notes: string;
  communication_preferences: string;
  watch_out_for: string;
  created_at: string;
  updated_at: string;
}

export type ProjectStatus = 'active' | 'on_hold' | 'done';

export interface Project {
  id: number;
  rolebook_id: number;
  title: string;
  status: ProjectStatus;
  deadline: string; // YYYY-MM-DD or ""
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Software {
  id: number;
  rolebook_id: number;
  name: string;
  purpose: string;
  credentials_location: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export type Cadence = 'weekly' | 'monthly' | 'semester' | 'ad_hoc';

export interface RecurringTask {
  id: number;
  rolebook_id: number;
  name: string;
  cadence: Cadence;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: number;
  rolebook_id: number;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface ApiErrorBody {
  error: string;
  message: string;
}

export interface TransferResponse {
  success: boolean;
  message: string;
}
