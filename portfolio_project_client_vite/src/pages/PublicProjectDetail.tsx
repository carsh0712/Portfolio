import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageState from '../components/PageState';
import ProjectDetailView from '../components/ProjectDetailView';
import ProjectImageLightbox from '../components/ProjectImageLightbox';
import ArrowLeftIcon from '../components/svg/ArrowLeftIcon';
import type { Project } from '../types/project';
import { ApiError, getPublicFileUrl, getPublicProjectDetail, type FileVariant } from '../utils/api';
import { publicProjectDetailToProject } from '../utils/projectMappers';

export default function PublicProjectDetail() {
  const { username, portfolioCode, projectCode } = useParams<{
    username: string;
    portfolioCode: string;
    projectCode: string;
  }>();

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProjectNotFound, setIsProjectNotFound] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const backPath = `/public/${username}/${portfolioCode}`;

  useEffect(() => {
    if (!username || !portfolioCode || !projectCode) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      setIsProjectNotFound(false);
      setProject(null);

      try {
        const detail = await getPublicProjectDetail(username, portfolioCode, projectCode);
        setProject(publicProjectDetailToProject(detail));
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          setIsProjectNotFound(true);
          setError(
            '요청하신 공개 프로젝트를 찾을 수 없습니다. 주소가 맞는지 확인하거나 포트폴리오 목록에서 다시 선택해 주세요.'
          );
        } else {
          setError(err instanceof Error ? err.message : '프로젝트를 불러오지 못했습니다.');
        }
        console.error('Failed to fetch public project:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [username, portfolioCode, projectCode]);

  const renderPublicImage = (
    fileUuid: string,
    alt: string,
    className: string,
    variant: FileVariant = 'detail'
  ) => (
    <img
      src={username ? getPublicFileUrl(username, fileUuid, variant) : ''}
      alt={alt}
      className={className}
    />
  );

  if (isLoading) {
    return <PageState loading message="프로젝트를 불러오는 중..." />;
  }

  if (error) {
    return (
      <PageState
        title={isProjectNotFound ? '프로젝트를 찾을 수 없습니다' : '잠시 문제가 생겼습니다'}
        message={error}
        tone={isProjectNotFound ? 'default' : 'error'}
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
              {renderPublicImage(
                project.thumbnailFileUuid,
                project.title,
                'w-full h-full object-cover',
                'thumbnail'
              )}
            </div>
          ) : (
            <div className="h-64 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-8xl font-bold opacity-30">
                {project.title.charAt(0)}
              </span>
            </div>
          )}

          <div className="p-8">
            <ProjectDetailView
              project={project}
              renderImage={renderPublicImage}
              onScreenshotSelect={setSelectedIndex}
            />
          </div>
        </div>
      </div>

      <ProjectImageLightbox
        images={project.screenshots || []}
        selectedIndex={selectedIndex}
        renderImage={renderPublicImage}
        onSelect={setSelectedIndex}
      />
    </div>
  );
}
