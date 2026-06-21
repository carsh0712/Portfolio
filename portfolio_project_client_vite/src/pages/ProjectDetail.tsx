import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ArrowLeftIcon from '../components/svg/ArrowLeftIcon';
import AuthImage from '../components/AuthImage';
import ProjectEditForm from '../components/ProjectEditForm';
import ProjectLinks from '../components/ProjectLinks';
import { useAuth } from '../contexts/AuthContext';
import type { ProjectDetailResponse, Project } from '../types/project';
import { getProjectDetail, updateProject } from '../utils/api';

function projectDetailToProject(detail: ProjectDetailResponse, portfolioCode: string): Project {
  const githubLink = detail.links?.find((l) => l.name.toLowerCase().includes('github'));
  const demoLink = detail.links?.find((l) => l.name.toLowerCase().includes('demo'));
  const downloadLink = detail.links?.find((l) => l.name.toLowerCase().includes('download'));
  const blogLink = detail.links?.find((l) => l.name.toLowerCase().includes('blog'));

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
    links: (detail.links || []).map((link) => ({
      ...link,
      backgroundColor: link.backgroundColor || link.background_color,
      textColor: link.textColor || link.text_color,
    })),
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

export default function ProjectDetail() {
  const { portfolioCode, projectCode } = useParams<{
    portfolioCode: string;
    projectCode: string;
  }>();

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const { user } = useAuth();
  // TODO: ?ㅼ젣 ?ъ슜??沅뚰븳? API??AuthContext?먯꽌 媛?몄삤?꾨줉 蹂寃쏀븳??
  const isCurator = true;
  const [isEditing, setIsEditing] = useState(false);
  const [portfolioId, setPortfolioId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!portfolioCode || !projectCode) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const detailResponse = await getProjectDetail(portfolioCode, projectCode);
        const projectData = projectDetailToProject(detailResponse, portfolioCode);
        setProject(projectData);
        setPortfolioId(detailResponse.portfolio_id);
      } catch (err) {
        setError(err instanceof Error ? err.message : '?꾨줈?앺듃瑜?遺덈윭?ㅼ? 紐삵뻽?듬땲??');
        console.error('Failed to fetch project data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [projectCode, portfolioCode]);

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

  const handleShare = async () => {
    if (!user?.username || !portfolioCode || !project?.code) return;
    const shareUrl = `${window.location.origin}/public/${user.username}/${portfolioCode}/${project.code}/`;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async (editData: {
    code: string;
    title: string;
    summary: string;
    description: string;
    techStack: string;
    tags: string;
    features: string;
    links: {
      name: string;
      url: string;
      backgroundColor?: string;
      textColor?: string;
      icon?: string;
    }[];
    screenshots: { file_uuid: string; caption?: string }[];
    thumbnailFileUuid?: string;
    startDate: string;
    endDate: string;
    isPublic: boolean;
  }) => {
    if (!projectCode || !project || !portfolioCode) return;

    setError(null);

    try {
      const requestBody = {
        portfolio_id: portfolioId!,
        code: editData.code,
        title: editData.title,
        summary: editData.summary,
        thumbnail: editData.thumbnailFileUuid ? { file_uuid: editData.thumbnailFileUuid } : null,
        tags: editData.tags
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        order: 0,
        is_public: editData.isPublic,
        description: editData.description,
        tech_stack: editData.techStack
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        screenshots: editData.screenshots,
        links: editData.links,
        start_date: editData.startDate,
        end_date: editData.endDate,
        features: editData.features
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      };

      const updated = await updateProject(portfolioCode, projectCode, requestBody);
      setProject(projectDetailToProject(updated, portfolioCode));
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '?꾨줈?앺듃 ?섏젙???ㅽ뙣?덉뒿?덈떎.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">?꾨줈?앺듃瑜?遺덈윭?ㅻ뒗 以?..</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">?ㅻ쪟媛 諛쒖깮?덉뒿?덈떎</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            to={portfolioCode ? `/portfolio/${portfolioCode}` : '/home'}
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            紐⑸줉?쇰줈 ?뚯븘媛湲?          </Link>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">?꾨줈?앺듃瑜?李얠쓣 ???놁뒿?덈떎</h1>
          <Link
            to={portfolioCode ? `/portfolio/${portfolioCode}` : '/home'}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            紐⑸줉?쇰줈 ?뚯븘媛湲?          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link
          to={`/portfolio/${portfolioCode}`}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-8"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          紐⑸줉?쇰줈 ?뚯븘媛湲?        </Link>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {project.thumbnailFileUuid ? (
            <div className="h-64 overflow-hidden">
              <AuthImage
                fileUuid={project.thumbnailFileUuid}
                alt="????ㅽ겕由곗꺑"
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
            {isEditing ? (
              <ProjectEditForm
                project={project}
                onSave={handleSave}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <>
                <div className="flex items-start justify-between mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <button
                      onClick={handleShare}
                      disabled={!user?.username || !portfolioCode || !project.code}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {copied ? '복사됨' : '공유'}
                    </button>
                    {isCurator && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        ?몄쭛
                      </button>
                    )}
                  </div>
                </div>

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

                {project.links && project.links.length > 0 && (
                  <ProjectLinks links={project.links} />
                )}

                <div className="border-t border-gray-200 pt-8">
                  {project.screenshots && project.screenshots.length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">?ㅽ겕由곗꺑</h2>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {project.screenshots.map((screenshot, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedIndex(index)}
                            className="group relative overflow-hidden rounded-lg aspect-video bg-gray-100 hover:ring-2 hover:ring-blue-500 transition-all"
                          >
                            <AuthImage
                              fileUuid={screenshot.file_uuid}
                              alt={screenshot.caption || `?ㅽ겕由곗꺑 ${index + 1}`}
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
                    </div>
                  )}

                  <h2 className="text-xl font-semibold text-gray-900 mb-4">?꾨줈?앺듃 ?ㅻ챸</h2>
                  <p className="text-gray-700 leading-relaxed mb-8">{project.description}</p>

                  <h2 className="text-xl font-semibold text-gray-900 mb-1">湲곗닠 ?ㅽ깮 ?쒓렇</h2>
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

                  <h2 className="text-xl font-semibold text-gray-900 mb-4">二쇱슂 湲곕뒫</h2>
                  <ul className="space-y-3">
                    {project.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-500 mr-3 mt-0.5 flex-shrink-0">✓</span>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <div className="flex gap-8 text-sm text-gray-500">
                      <div>
                        <span className="font-medium">?쒖옉??</span> {project.startDate}
                      </div>
                      {project.endDate && (
                        <div>
                          <span className="font-medium">醫낅즺??</span> {project.endDate}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
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
              <span className="text-4xl leading-none">›</span>
            </button>
          )}

          <div className="relative max-w-5xl max-h-[90vh]">
            <button
              onClick={() => setSelectedIndex(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <span className="text-4xl leading-none">횞</span>
            </button>
            <AuthImage
              fileUuid={selectedImage.file_uuid}
              alt={selectedImage.caption || '?ㅽ겕由곗꺑'}
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

