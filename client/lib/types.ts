export type User = {
  id: string;
  email: string;
  created_at: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user: User;
};

export type ModelInfo = {
  id: string;
  name: string;
};

export type ModelsResponse = {
  models: ModelInfo[];
  default_model: string | null;
};

export type PredictionResult = {
  history_id: string;
  headline: string;
  category: string;
  model_used: string;
  created_at: string;
};

export type HistoryItem = {
  id: string;
  article: string;
  headline: string;
  category: string;
  model_used: string;
  created_at: string;
};

export type HistoryListResponse = {
  items: HistoryItem[];
};
