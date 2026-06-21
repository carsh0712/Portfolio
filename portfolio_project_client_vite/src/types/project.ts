export interface Screenshot {
  file_uuid: string;
  caption?: string;
}

export interface Project {
  id: string;
  portfolioCode: string;
  code?: string;
  title: string;
  summary: string;
  description: string;
  techStack: string[];
  tags: string[];
  thumbnailFileUuid?: string;
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

// Project API Response Types
export interface ProjectListItem {
  code: string;
  title: string;
  summary: string;
  thumbnail: { file_uuid: string } | null;
  tags: string[];
  tech_stack: string[];
  order: number;
  is_public: boolean;
}

export interface PaginationMeta {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ProjectListResponse {
  items: ProjectListItem[];
  meta: PaginationMeta;
}

// Project Detail API Response Type (matches Project structure)
export interface ProjectLink {
  name: string;
  url: string;
  backgroundColor?: string;
  textColor?: string;
  background_color?: string;
  text_color?: string;
  icon?: string;
}

export interface ProjectDetailResponse {
  id: number;
  portfolio_id: number;
  code: string;
  title: string;
  summary: string;
  description: string;
  tech_stack: string[];
  tags: string[];
  thumbnail: { file_uuid: string } | null;
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

// Project Create Request Type
export interface CreateProjectRequest {
  portfolio_code: string;
  code: string;
  title: string;
  summary: string;
  thumbnail: { file_uuid: string } | null;
  tags: string[];
  order: number;
  is_public: boolean;
  description: string;
  tech_stack: string[];
  screenshots: { file_uuid: string; caption?: string }[];
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

// Project Update Request Type
export interface UpdateProjectRequest {
  portfolio_id: number;
  code: string;
  title: string;
  summary: string;
  thumbnail: { file_uuid: string } | null;
  tags: string[];
  order: number;
  is_public: boolean;
  description: string;
  tech_stack: string[];
  screenshots: { file_uuid: string; caption?: string }[];
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

// Public Project API Response Types
export interface PublicProjectItem {
  id: number;
  portfolio_id: number;
  code: string;
  title: string;
  summary: string;
  thumbnail: { file_uuid: string } | null;
  tags: string[];
  tech_stack: string[];
  order: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface PublicProjectDetail {
  id: number;
  portfolio_id: number;
  code: string;
  title: string;
  summary: string;
  description: string;
  thumbnail: { file_uuid: string } | null;
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

