export interface Screenshot {
  url: string;
  caption?: string;
}

export interface Project {
  id: string;
  categoryId: string;
  code?: string;
  title: string;
  summary: string;
  description: string;
  techStack: string[];
  tags: string[];
  imageUrl?: string;
  screenshots?: Screenshot[];
  githubUrl?: string;
  demoUrl?: string;
  downloadUrl?: string;
  blogUrl?: string;
  startDate: string;
  endDate?: string;
  features: string[];
  isPublic?: boolean;
}

// Portfolio API Response Types
export interface PortfolioItem {
  id: number;
  category_id: number;
  code: string;
  title: string;
  summary: string;
  thumbnail_url: string;
  tags: string[];
  order: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface PortfolioListResponse {
  items: PortfolioItem[];
  meta: PaginationMeta;
}

// Portfolio Item Detail API Response Type (matches Project structure)
export interface ProjectLink {
  name: string;
  url: string;
  backgroundColor?: string;
  textColor?: string;
  icon?: string;
}

export interface PortfolioItemDetail {
  id: string;
  categoryId: string;
  code?: string;
  title: string;
  summary: string;
  description: string;
  techStack: string[];
  tags: string[];
  imageUrl?: string;
  screenshots?: Screenshot[];
  links?: ProjectLink[];
  startDate: string;
  endDate?: string;
  features: string[];
  createdAt: string;
  updatedAt: string;
}

// Public Portfolio API Response Types
export type PublicPortfolioItem = PortfolioItem;

export interface PublicProjectDetail {
  id: number;
  category_id: number;
  code: string;
  title: string;
  summary: string;
  description: string;
  thumbnail_url: string;
  tags: string[];
  tech_stack: string[];
  screenshots?: Screenshot[];
  links?: ProjectLink[];
  order: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  start_date?: string;
  end_date?: string;
  features?: string[];
}
