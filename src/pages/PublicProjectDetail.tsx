import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import ArrowLeftIcon from '../components/svg/ArrowLeftIcon';
import ProjectLinks from '../components/ProjectLinks';
import { getPublicProjectDetail, getPublicFileUrl } from '../utils/api';
import type { Project, PublicProjectDetail as PublicProjectDetailType } from '../types/project';

function publicProjectDetailToProject(detail: PublicProjectDetailType): Project {
  return {
    id: String(detail.id),
    categoryId: String(detail.portfolio_id),
    code: detail.code,
    title: detail.title,
    summary: detail.summary,
    description: detail.description,
    techStack: detail.tech_stack || [],
    tags: detail.tags,
    thumbnailFileUuid: detail.thumbnail?.file_uuid,
    screenshots: detail.screenshots,
    links: (detail.links || []).map((link) => ({
      ...link,
      backgroundColor: link.backgroundColor || link.background_color,
      textColor: link.textColor || link.text_color,
    })),
    startDate: detail.start_date || detail.created_at,
    endDate: detail.end_date,
    features: detail.features || [],
    isPublic: detail.is_public,
  };
}

export default function PublicProjectDetail() {
  const { username, categoryCode, portfolioCode } = useParams<{
    username: string;
    categoryCode: string;
    portfolioCode: string;
  }>();

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!username || !categoryCode || !portfolioCode) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const detailResponse = await getPublicProjectDetail(username, categoryCode, portfolioCode);
        const projectData = publicProjectDetailToProject(detailResponse);
        setProject(projectData);
      } catch (err) {
        setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.');
        console.error('Failed to fetch public project:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [username, categoryCode, portfolioCode]);

  const screenshots = project?.screenshots || [];
  const selectedImage = selectedIndex !== null ? screenshots[selectedIndex] : null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIndex !== null && selectedIndex < screenshots.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">프로젝트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">오류가 발생했습니다</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            to={`/public/${username}/${categoryCode}`}
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">프로젝트를 찾을 수 없습니다</h1>
          <Link
            to={`/public/${username}/${categoryCode}`}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link
          to={`/public/${username}/${categoryCode}`}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-8"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          목록으로 돌아가기
        </Link>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {project.thumbnailFileUuid && username ? (
            <div className="h-64 overflow-hidden">
              <img
                src={getPublicFileUrl(username, project.thumbnailFileUuid)}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="h-64 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-8xl font-bold opacity-30">
                {project.title.charAt(0)}
              </span>
            </div>
          )}

          <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.title}</h1>

            <div className="flex flex-wrap gap-2 mb-4">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>

            <p className="text-lg text-gray-600 mb-6">{project.summary}</p>

            {project.links && project.links.length > 0 && <ProjectLinks links={project.links} />}

            <div className="border-t border-gray-200 pt-8">
              {project.screenshots && project.screenshots.length > 0 && (
                <>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">스크린샷</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    {project.screenshots.map((screenshot, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedIndex(index)}
                        className="group relative overflow-hidden rounded-lg aspect-video bg-gray-100 hover:ring-2 hover:ring-blue-500 transition-all"
                      >
                        <img
                          src={username ? getPublicFileUrl(username, screenshot.file_uuid) : ''}
                          alt={screenshot.caption || `스크린샷 ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        {screenshot.caption && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-sm px-2 py-1">
                            {screenshot.caption}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <h2 className="text-xl font-semibold text-gray-900 mb-4">프로젝트 설명</h2>
              <p className="text-gray-700 leading-relaxed mb-8">{project.description}</p>

              {project.techStack.length > 0 && (
                <>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">기술 스택</h2>
                  <div className="flex flex-wrap gap-2 mb-8">
                    {project.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                      >
                        #{tech}
                      </span>
                    ))}
                  </div>
                </>
              )}

              {project.features.length > 0 && (
                <>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">주요 기능</h2>
                  <ul className="space-y-3 mb-8">
                    {project.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <svg
                          className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <div className="pt-8 border-t border-gray-200">
                <div className="flex gap-8 text-sm text-gray-500">
                  <div>
                    <span className="font-medium">시작일:</span> {project.startDate}
                  </div>
                  {project.endDate && (
                    <div>
                      <span className="font-medium">종료일:</span> {project.endDate}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedImage && selectedIndex !== null && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedIndex(null)}
        >
          {selectedIndex > 0 && (
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white hover:text-gray-300 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
            >
              <ArrowLeftIcon className="w-8 h-8" />
            </button>
          )}

          {selectedIndex < screenshots.length - 1 && (
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white hover:text-gray-300 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}

          <div className="relative max-w-5xl max-h-[90vh]">
            <button
              onClick={() => setSelectedIndex(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <img
              src={username ? getPublicFileUrl(username, selectedImage.file_uuid) : ''}
              alt={selectedImage.caption || '스크린샷'}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            {selectedImage.caption && (
              <p className="text-white text-center mt-4">
                {selectedImage.caption}
                <span className="ml-2 text-gray-400">
                  ({selectedIndex + 1} / {screenshots.length})
                </span>
              </p>
            )}
            {!selectedImage.caption && (
              <p className="text-gray-400 text-center mt-4">
                {selectedIndex + 1} / {screenshots.length}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
