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
  max_input_tokens: number;
  max_article_characters: number;
  min_article_words: number;
};

export type ModelsResponse = {
  models: ModelInfo[];
  default_model: string | null;
  max_input_tokens: number;
  max_article_characters: number;
  min_article_words: number;
};

export type HistoryStatus = "success" | "failed";

export type PredictionResult = {
  history_id: string;
  headline: string;
  category: string;
  model_used: string;
  status: HistoryStatus;
  error_message: string | null;
  created_at: string;
};

export type HistoryItem = {
  id: string;
  article: string;
  headline: string;
  category: string;
  model_used: string;
  status: HistoryStatus;
  error_message: string | null;
  created_at: string;
};

export type HistoryListResponse = {
  items: HistoryItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type HistoryFiltersResponse = {
  categories: string[];
  models: string[];
  statuses: HistoryStatus[];
};

export type HistorySortField =
  | "created_at"
  | "headline"
  | "category"
  | "model_used"
  | "status";

export type SortOrder = "asc" | "desc";

export type HistoryQueryParams = {
  page?: number;
  page_size?: number;
  search?: string;
  category?: string;
  model_used?: string;
  status?: HistoryStatus;
  sort_by?: HistorySortField;
  sort_order?: SortOrder;
};

export type PublicNewsSummary = {
  id: string;
  headline: string;
  category: string;
  created_at: string;
};

export type PublicNewsDetail = PublicNewsSummary & {
  article: string;
};

export type PublicNewsListResponse = {
  items: PublicNewsSummary[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};
