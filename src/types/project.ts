export interface Screenshot {
  file_id: number;
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
  thumbnailFileId?: number;
  screenshots?: Screenshot[];
  links?: ProjectLink[];
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
  thumbnail: { file_id: number } | null;
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

export interface Portfolio {
  id: number;
  category_id: number;
  code: string;
  title: string;
  summary: string;
  description: string;
  tech_stack: string[];
  tags: string[];
  thumbnail_file_id?: number;
  screenshots?: Screenshot[];
  links?: ProjectLink[];
  order: number;
  is_public: boolean;
  start_date?: string;
  end_date?: string;
  features?: string[];
  created_at: string;
  updated_at: string;
}

// Portfolio Update Request Type
export interface UpdatePortfolioRequest {
  category_id: number;
  code: string;
  title: string;
  summary: string;
  thumbnail: { file_id: number } | null;
  tags: string[];
  order: number;
  is_public: boolean;
  description: string;
  tech_stack: string[];
  screenshots: { file_id: number; caption?: string }[];
  links: {
    name: string;
    url: string;
    backgroundColor?: string;
    textColor?: string;
    icon?: string;
  }[];
  start_date: string;
  end_date: string;
  features: string[];
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
  thumbnail: { file_id: number } | null;
  tags: string[];
  tech_stack: string[];
  screenshots?: Screenshot[];
  thumbnail_file_id?: number;
  links?: ProjectLink[];
  order: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  start_date?: string;
  end_date?: string;
  features?: string[];
}
