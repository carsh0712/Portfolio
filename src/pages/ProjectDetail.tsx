import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPortfolioItemDetail } from '../utils/api';
import type { Project, PortfolioItemDetail } from '../types/project';

// Helper function to convert PortfolioItemDetail to Project
function portfolioDetailToProject(detail: PortfolioItemDetail): Project {
  // Extract specific links by name
  const githubLink = detail.links?.find((l) => l.name.toLowerCase().includes('github'));
  const demoLink = detail.links?.find((l) => l.name.toLowerCase().includes('demo'));
  const downloadLink = detail.links?.find((l) => l.name.toLowerCase().includes('download'));
  const blogLink = detail.links?.find((l) => l.name.toLowerCase().includes('blog'));

  return {
    id: detail.id,
    categoryId: detail.categoryId,
    title: detail.title,
    summary: detail.summary,
    description: detail.description,
    techStack: detail.techStack,
    tags: detail.tags,
    imageUrl: detail.imageUrl,
    screenshots: detail.screenshots,
    githubUrl: githubLink?.url,
    demoUrl: demoLink?.url,
    downloadUrl: downloadLink?.url,
    blogUrl: blogLink?.url,
    startDate: detail.startDate,
    endDate: detail.endDate,
    features: detail.features,
    isPublic: true,
  };
}

export default function ProjectDetail() {
  const { categoryId, id } = useParams<{ categoryId: string; id: string }>();

  // State
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // TODO: 실제 사용자 권한은 API나 Context에서 가져와야 함
  const isCurator = true;
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: '',
    summary: '',
    description: '',
    techStack: '',
    tags: '',
    features: '',
    githubUrl: '',
    demoUrl: '',
    downloadUrl: '',
    blogUrl: '',
    startDate: '',
    endDate: '',
    isPublic: true,
  });

  // Fetch portfolio data from API
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch detailed info (now includes all data)
        const detailResponse = await getPortfolioItemDetail(Number(id));

        // Convert to Project format
        const projectData = portfolioDetailToProject(detailResponse);
        setProject(projectData);

        // Initialize edit data
        setEditData({
          title: projectData.title,
          summary: projectData.summary,
          description: projectData.description,
          techStack: projectData.techStack.join(', '),
          tags: projectData.tags.join(', '),
          features: projectData.features.join('\n'),
          githubUrl: projectData.githubUrl || '',
          demoUrl: projectData.demoUrl || '',
          downloadUrl: projectData.downloadUrl || '',
          blogUrl: projectData.blogUrl || '',
          startDate: projectData.startDate,
          endDate: projectData.endDate || '',
          isPublic: projectData.isPublic ?? true,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.');
        console.error('Failed to fetch portfolio data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    // TODO: API 연동하여 프로젝트 저장
    const updatedProject = {
      ...editData,
      techStack: editData.techStack
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      tags: editData.tags
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      features: editData.features
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    };
    console.log('수정된 프로젝트 데이터:', updatedProject);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      title: project?.title || '',
      summary: project?.summary || '',
      description: project?.description || '',
      techStack: project?.techStack.join(', ') || '',
      tags: project?.tags.join(', ') || '',
      features: project?.features.join('\n') || '',
      githubUrl: project?.githubUrl || '',
      demoUrl: project?.demoUrl || '',
      downloadUrl: project?.downloadUrl || '',
      blogUrl: project?.blogUrl || '',
      startDate: project?.startDate || '',
      endDate: project?.endDate || '',
      isPublic: project?.isPublic ?? true,
    });
    setIsEditing(false);
  };

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

  // Loading state
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

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">오류가 발생했습니다</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            to={categoryId ? `/category/${categoryId}` : '/home'}
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  // Project not found
  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">프로젝트를 찾을 수 없습니다</h1>
          <Link
            to={categoryId ? `/category/${categoryId}` : '/home'}
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
          to={`/category/${categoryId}`}
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
            <div className="flex items-start justify-between mb-2">
              {isEditing ? (
                <input
                  type="text"
                  name="title"
                  value={editData.title}
                  onChange={handleEditChange}
                  className="text-3xl font-bold text-gray-900 w-full border-b-2 border-blue-500 focus:outline-none bg-transparent"
                />
              ) : (
                <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
              )}
              {isCurator && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors ml-4 flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  편집
                </button>
              )}
              {isEditing && (
                <div className="flex gap-2 ml-4 flex-shrink-0">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    저장
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {isEditing ? (
                <input
                  type="text"
                  name="tags"
                  value={editData.tags}
                  onChange={handleEditChange}
                  placeholder="태그 (쉼표로 구분)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                  >
                    #{tag}
                  </span>
                ))
              )}
            </div>

            {isEditing ? (
              <input
                type="text"
                name="summary"
                value={editData.summary}
                onChange={handleEditChange}
                placeholder="요약"
                className="w-full text-lg text-gray-600 mb-6 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <p className="text-lg text-gray-600 mb-6">{project.summary}</p>
            )}

            {isEditing ? (
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GitHub URL</label>
                  <input
                    type="url"
                    name="githubUrl"
                    value={editData.githubUrl}
                    onChange={handleEditChange}
                    placeholder="https://github.com/..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">데모 URL</label>
                  <input
                    type="url"
                    name="demoUrl"
                    value={editData.demoUrl}
                    onChange={handleEditChange}
                    placeholder="https://demo.example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    다운로드 URL
                  </label>
                  <input
                    type="url"
                    name="downloadUrl"
                    value={editData.downloadUrl}
                    onChange={handleEditChange}
                    placeholder="https://example.com/download"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    개발 일지 URL
                  </label>
                  <input
                    type="url"
                    name="blogUrl"
                    value={editData.blogUrl}
                    onChange={handleEditChange}
                    placeholder="https://blog.example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            ) : (
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
            )}

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
                          src={screenshot.url}
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
              {isEditing ? (
                <textarea
                  name="description"
                  value={editData.description}
                  onChange={handleEditChange}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-8"
                />
              ) : (
                <p className="text-gray-700 leading-relaxed mb-8">{project.description}</p>
              )}

              <h2 className="text-xl font-semibold text-gray-900 mb-4">기술 스택</h2>
              {isEditing ? (
                <div className="mb-8">
                  <input
                    type="text"
                    name="techStack"
                    value={editData.techStack}
                    onChange={handleEditChange}
                    placeholder="React, TypeScript, Tailwind (쉼표로 구분)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">쉼표(,)로 구분하여 입력하세요</p>
                </div>
              ) : (
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
              )}

              <h2 className="text-xl font-semibold text-gray-900 mb-4">주요 기능</h2>
              {isEditing ? (
                <div className="mb-8">
                  <textarea
                    name="features"
                    value={editData.features}
                    onChange={handleEditChange}
                    rows={5}
                    placeholder="기능 1&#10;기능 2&#10;기능 3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">한 줄에 하나씩 입력하세요</p>
                </div>
              ) : (
                <ul className="space-y-3">
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
              )}

              <div className="mt-8 pt-8 border-t border-gray-200">
                {isEditing ? (
                  <div className="flex flex-wrap gap-4 items-end">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
                      <input
                        type="date"
                        name="startDate"
                        value={editData.startDate}
                        onChange={handleEditChange}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
                      <input
                        type="date"
                        name="endDate"
                        value={editData.endDate}
                        onChange={handleEditChange}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-3 py-2">
                      <label className="text-sm font-medium text-gray-700">공개 여부</label>
                      <button
                        type="button"
                        onClick={() =>
                          setEditData((prev) => ({ ...prev, isPublic: !prev.isPublic }))
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          editData.isPublic ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            editData.isPublic ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <span className="text-sm text-gray-500">
                        {editData.isPublic ? '공개' : '비공개'}
                      </span>
                    </div>
                  </div>
                ) : (
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
                )}
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
          {/* 이전 버튼 */}
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

          {/* 다음 버튼 */}
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
              src={selectedImage.url}
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
