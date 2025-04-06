export interface User {
  id: number;
  username: string;
  email: string;
}

export interface Session {
  id: number;
  title: string;
  is_active: boolean;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  content: string;
  is_from_user: boolean;
  created_at: string;
}

export interface Recommendation {
  id: string;
  content: string;
  type: string;
  created_at: string;
  feedback?: 'positive' | 'negative';
}

export interface EmotionalProfile {
  emotional_trends: {
    overall_progression: string;
    key_emotions: string[];
  };
  recurring_themes: string[];
  progress_indicators: string[];
  recommendations: Recommendation[];
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
} 