import { useEffect, useState, type ComponentProps } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ProjectEditForm from '../components/ProjectEditForm';
import type { Project, UpdateProjectRequest } from '../types/project';
import { ApiError, deleteProject, getProjectDetail, updateProject } from '../utils/api';
import { projectDetailToProject } from '../utils/projectMappers';

type ProjectEditData = Parameters<ComponentProps<typeof ProjectEditForm>['onSave']>[0];

function projectEditDataToRequest(
  editData: ProjectEditData,
  portfolioId: number
): UpdateProjectRequest {
  return {
    portfolio_id: portfolioId,
    code: editData.code,
    title: editData.title,
    summary: editData.summary,
    thumbnail: editData.thumbnailFileUuid ? { file_uuid: editData.thumbnailFileUuid } : null,
    tags: editData.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    order: 0,
    is_public: editData.isPublic,
    description: editData.description,
    tech_stack: editData.techStack
      .split(',')
      .map((tech) => tech.trim())
      .filter(Boolean),
    screenshots: editData.screenshots,
    links: editData.links,
    start_date: editData.startDate,
    end_date: editData.endDate,
    features: editData.features
      .split('\n')
      .map((feature) => feature.trim())
      .filter(Boolean),
  };
}

export function useProjectDetailPage() {
  const { portfolioCode, projectCode } = useParams<{
    portfolioCode: string;
    projectCode: string;
  }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProjectNotFound, setIsProjectNotFound] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [portfolioId, setPortfolioId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const isCurator = true;
  const backPath = portfolioCode ? `/portfolio/${portfolioCode}` : '/home';

  useEffect(() => {
    if (!portfolioCode || !projectCode) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      setIsProjectNotFound(false);
      setProject(null);

      try {
        const detail = await getProjectDetail(portfolioCode, projectCode);
        setProject(projectDetailToProject(detail, portfolioCode));
        setPortfolioId(detail.portfolio_id);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          setIsProjectNotFound(true);
          setError(
            '요청하신 프로젝트를 찾을 수 없습니다. 주소가 맞는지 확인하거나 프로젝트 목록에서 다시 선택해 주세요.'
          );
        } else {
          setError(err instanceof Error ? err.message : '프로젝트를 불러오지 못했습니다.');
        }
        console.error('Failed to fetch project data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [projectCode, portfolioCode]);

  const shareProject = async () => {
    if (!user?.username || !portfolioCode || !project?.code) return;

    await navigator.clipboard.writeText(
      `${window.location.origin}/public/${user.username}/${portfolioCode}/${project.code}/`
    );
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const saveProject = async (editData: ProjectEditData) => {
    if (!projectCode || !project || !portfolioCode || portfolioId === null) return;

    setError(null);
    try {
      const updated = await updateProject(
        portfolioCode,
        projectCode,
        projectEditDataToRequest(editData, portfolioId)
      );
      setProject(projectDetailToProject(updated, portfolioCode));
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '프로젝트 수정에 실패했습니다.');
    }
  };

  const removeProject = async () => {
    if (!projectCode || !portfolioCode) return;

    setError(null);
    try {
      await deleteProject(portfolioCode, projectCode);
      navigate(backPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : '프로젝트 삭제에 실패했습니다.');
    }
  };

  return {
    user,
    portfolioCode,
    project,
    isLoading,
    error,
    isProjectNotFound,
    selectedIndex,
    setSelectedIndex,
    isEditing,
    setIsEditing,
    isCurator,
    backPath,
    copied,
    shareProject,
    saveProject,
    removeProject,
  };
}
