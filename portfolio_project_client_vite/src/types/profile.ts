import type { ProjectLink } from './project';

export interface Profile {
  id: number;
  user_id: number;
  display_name: string;
  headline?: string | null;
  bio?: string | null;
  avatar_file_uuid?: string | null;
  links: ProjectLink[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileListResponse {
  items: Profile[];
  meta: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

export interface ProfileRequest {
  display_name: string;
  headline?: string | null;
  bio?: string | null;
  avatar_file_uuid?: string | null;
  links: ProjectLink[];
  is_default: boolean;
}

export interface PublicProfile {
  id: number;
  display_name: string;
  headline?: string | null;
  bio?: string | null;
  avatar_file_uuid?: string | null;
  links: ProjectLink[];
  is_default: boolean;
}
