import { useEffect, useState, type ComponentProps } from 'react';
import { Link, useParams } from 'react-router-dom';
import AuthImage from '../components/AuthImage';
import PageState from '../components/PageState';
import ProjectDetailView from '../components/ProjectDetailView';
import ProjectEditForm from '../components/ProjectEditForm';
import ProjectImageLightbox from '../components/ProjectImageLightbox';
import ArrowLeftIcon from '../components/svg/ArrowLeftIcon';
import { useAuth } from '../contexts/AuthContext';
import type { Project, UpdateProjectRequest } from '../types/project';
import { getProjectDetail, updateProject } from '../utils/api';
import { projectDetailToProject } from '../utils/projectMappers';

type ProjectEditData = Parameters<ComponentProps<typeof ProjectEditForm>['onSave']>[0];

function projectEditDataToRequest(editData: ProjectEditData, portfolioId: number): UpdateProjectRequest {
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

export default function ProjectDetail() {
  const { portfolioCode, projectCode } = useParams<{
    portfolioCode: string;
    projectCode: string;
  }>();
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

      try {
        const detail = await getProjectDetail(portfolioCode, projectCode);
        setProject(projectDetailToProject(detail, portfolioCode));
        setPortfolioId(detail.portfolio_id);
      } catch (err) {
        setError(err instanceof Error ? err.message : '프로젝트를 불러오지 못했습니다.');
        console.error('Failed to fetch project data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [projectCode, portfolioCode]);

  const handleShare = async () => {
    if (!user?.username || !portfolioCode || !project?.code) return;
    await navigator.clipboard.writeText(
      `${window.location.origin}/public/${user.username}/${portfolioCode}/${project.code}/`
    );
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async (editData: ProjectEditData) => {
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

  const renderAuthImage = (fileUuid: string, alt: string, className: string) => (
    <AuthImage fileUuid={fileUuid} alt={alt} className={className} />
  );

  if (isLoading) {
    return <PageState loading message="프로젝트를 불러오는 중..." />;
  }

  if (error) {
    return (
      <PageState
        title="오류가 발생했습니다"
        message={error}
        tone="error"
        actionLabel="목록으로 돌아가기"
        actionTo={backPath}
      />
    );
  }

  if (!project) {
    return (
      <PageState
        title="프로젝트를 찾을 수 없습니다"
        message="목록으로 돌아가 다시 선택해 주세요."
        actionLabel="목록으로 돌아가기"
        actionTo={backPath}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link
          to={backPath}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-8"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          목록으로 돌아가기
        </Link>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {project.thumbnailFileUuid ? (
            <div className="h-64 overflow-hidden">
              {renderAuthImage(project.thumbnailFileUuid, project.title, 'w-full h-full object-cover')}
            </div>
          ) : (
            <div className="h-64 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-8xl font-bold opacity-30">
                {project.title.charAt(0)}
              </span>
            </div>
          )}

          <div className="p-8">
            {isEditing ? (
              <ProjectEditForm
                project={project}
                onSave={handleSave}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <ProjectDetailView
                project={project}
                renderImage={renderAuthImage}
                onScreenshotSelect={setSelectedIndex}
                actions={
                  <>
                    <button
                      type="button"
                      onClick={handleShare}
                      disabled={!user?.username || !portfolioCode || !project.code}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {copied ? '복사됨' : '공유'}
                    </button>
                    {isCurator && (
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        편집
                      </button>
                    )}
                  </>
                }
              />
            )}
          </div>
        </div>
      </div>

      <ProjectImageLightbox
        images={project.screenshots || []}
        selectedIndex={selectedIndex}
        renderImage={renderAuthImage}
        onSelect={setSelectedIndex}
      />
    </div>
  );
}
