export interface PortfolioCategory {
  id: number;
  user_id: number;
  code: string;
  name: string;
  description: string;
  screenshot: { file_uuid: string } | null;
  order: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface PortfolioCategoryListResponse {
  items: PortfolioCategory[];
  meta: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

export interface CreatePortfolioCategoryRequest {
  code: string;
  name: string;
  description: string;
  screenshot: { file_uuid: string } | null;
  order: number;
  is_public: boolean;
}

export type CreatePortfolioCategoryResponse = PortfolioCategory;

export interface UpdatePortfolioCategoryRequest {
  code: string;
  name: string;
  description: string;
  screenshot: { file_uuid: string } | null;
  order: number;
  is_public: boolean;
}

export type UpdatePortfolioCategoryResponse = PortfolioCategory;

// Backward-compatible aliases for older components/tests.
export type Category = PortfolioCategory;
export type CategoryListResponse = PortfolioCategoryListResponse;
export type CreateCategoryRequest = CreatePortfolioCategoryRequest;
export type CreateCategoryResponse = CreatePortfolioCategoryResponse;
export type UpdateCategoryRequest = UpdatePortfolioCategoryRequest;
export type UpdateCategoryResponse = UpdatePortfolioCategoryResponse;
