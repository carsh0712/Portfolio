export interface Portfolio {
  id: number;
  user_id: number;
  profile_id?: number | null;
  code: string;
  name: string;
  description: string;
  screenshot: { file_uuid: string } | null;
  order: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface PortfolioListResponse {
  items: Portfolio[];
  meta: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

export interface CreatePortfolioRequest {
  code: string;
  name: string;
  description: string;
  screenshot: { file_uuid: string } | null;
  profile_id?: number | null;
  order: number;
  is_public: boolean;
}

export type CreatePortfolioResponse = Portfolio;

export interface UpdatePortfolioRequest {
  code: string;
  name: string;
  description: string;
  screenshot: { file_uuid: string } | null;
  profile_id?: number | null;
  order: number;
  is_public: boolean;
}

export type UpdatePortfolioResponse = Portfolio;

