export interface Category {
  id: number;
  user_id: number;
  code: string;
  name: string;
  description: string;
  image_url: string;
  order: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryListResponse {
  items: Category[];
  meta: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

// 기존 코드와의 호환성을 위한 alias
export interface PortfolioCategory {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  order: number;
}
