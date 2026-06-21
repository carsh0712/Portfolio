import type {
  Project,
  ProjectDetailResponse,
  ProjectListItem,
  PublicProjectDetail,
  PublicProjectItem,
} from '../types/project';

function normalizeLinks(detail: ProjectDetailResponse | PublicProjectDetail) {
  return (detail.links || []).map((link) => ({
    ...link,
    backgroundColor: link.backgroundColor || link.background_color,
    textColor: link.textColor || link.text_color,
  }));
}

export function projectListItemToProject(item: ProjectListItem, portfolioCode: string): Project {
  return {
    id: item.code,
    portfolioCode,
    code: item.code,
    title: item.title,
    summary: item.summary,
    description: '',
    techStack: item.tech_stack,
    tags: item.tags,
    thumbnailFileUuid: item.thumbnail?.file_uuid,
    startDate: '',
    features: [],
    isPublic: item.is_public,
  };
}

export function publicProjectItemToProject(item: PublicProjectItem): Project {
  return {
    id: String(item.id),
    portfolioCode: String(item.portfolio_id),
    code: item.code,
    title: item.title,
    summary: item.summary,
    description: '',
    techStack: item.tech_stack,
    tags: item.tags,
    thumbnailFileUuid: item.thumbnail?.file_uuid,
    startDate: item.created_at,
    features: [],
    isPublic: item.is_public,
  };
}

export function projectDetailToProject(
  detail: ProjectDetailResponse,
  portfolioCode: string
): Project {
  const githubLink = detail.links?.find((link) => link.name.toLowerCase().includes('github'));
  const demoLink = detail.links?.find((link) => link.name.toLowerCase().includes('demo'));
  const downloadLink = detail.links?.find((link) => link.name.toLowerCase().includes('download'));
  const blogLink = detail.links?.find((link) => link.name.toLowerCase().includes('blog'));

  return {
    id: String(detail.id),
    portfolioCode,
    code: detail.code,
    title: detail.title,
    summary: detail.summary,
    description: detail.description,
    techStack: detail.tech_stack || [],
    tags: detail.tags || [],
    thumbnailFileUuid: detail.thumbnail?.file_uuid,
    screenshots: detail.screenshots,
    links: normalizeLinks(detail),
    githubUrl: githubLink?.url,
    demoUrl: demoLink?.url,
    downloadUrl: downloadLink?.url,
    blogUrl: blogLink?.url,
    startDate: detail.start_date || '',
    endDate: detail.end_date,
    features: detail.features || [],
    isPublic: detail.is_public,
  };
}

export function publicProjectDetailToProject(detail: PublicProjectDetail): Project {
  return {
    id: String(detail.id),
    portfolioCode: String(detail.portfolio_id),
    code: detail.code,
    title: detail.title,
    summary: detail.summary,
    description: detail.description,
    techStack: detail.tech_stack || [],
    tags: detail.tags,
    thumbnailFileUuid: detail.thumbnail?.file_uuid,
    screenshots: detail.screenshots,
    links: normalizeLinks(detail),
    startDate: detail.start_date || detail.created_at,
    endDate: detail.end_date,
    features: detail.features || [],
    isPublic: detail.is_public,
  };
}
