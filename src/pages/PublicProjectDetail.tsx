import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import AuthImage from '../components/AuthImage';
import { getPublicProjectDetail } from '../utils/api';
import type { Project, PublicProjectDetail as PublicProjectDetailType } from '../types/project';

function publicProjectDetailToProject(detail: PublicProjectDetailType): Project {
  const githubLink = detail.links?.find((l) => l.name.toLowerCase().includes('github'));
  const demoLink = detail.links?.find((l) => l.name.toLowerCase().includes('demo'));
  const downloadLink = detail.links?.find((l) => l.name.toLowerCase().includes('download'));
  const blogLink = detail.links?.find((l) => l.name.toLowerCase().includes('blog'));

  return {
    id: String(detail.id),
    categoryId: String(detail.category_id),
    code: detail.code,
    title: detail.title,
    summary: detail.summary,
    description: detail.description,
    techStack: detail.tech_stack || [],
    tags: detail.tags,
    thumbnailFileId: detail.thumbnail?.file_id,
    screenshots: detail.screenshots,
    githubUrl: githubLink?.url,
    demoUrl: demoLink?.url,
    downloadUrl: downloadLink?.url,
    blogUrl: blogLink?.url,
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
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          목록으로 돌아가기
        </Link>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="h-64 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-8xl font-bold opacity-30">
              {project.title.charAt(0)}
            </span>
          </div>

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

            <div className="flex gap-4 mb-8">
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  GitHub
                </a>
              )}
              {project.demoUrl && (
                <a
                  href={project.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  Live Demo
                </a>
              )}
              {project.downloadUrl && (
                <a
                  href={project.downloadUrl}
                  download
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download
                </a>
              )}
              {project.blogUrl && (
                <a
                  href={project.blogUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  개발 일지
                </a>
              )}
            </div>

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
                        <AuthImage
                          fileId={screenshot.file_id}
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
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
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
            <AuthImage
              fileId={selectedImage.file_id}
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
