import { useEffect, useState } from 'react';
import Modal from '../components/Modal';
import { useParams } from 'react-router-dom';
import PageState from '../components/PageState';
import ProjectCard from '../components/ProjectCard';
import ProjectFilterBar from '../components/ProjectFilterBar';
import ClipboardIcon from '../components/svg/ClipboardIcon';
import { useProjectFilters } from '../hooks/useProjectFilters';
import type { PublicPortfolio } from '../types/portfolio';
import type { Project } from '../types/project';
import type { PublicProfile } from '../types/profile';
import {
  getPublicFileUrl,
  getPublicPortfolio,
  getPublicPortfolioProfile,
  getPublicProjects,
} from '../utils/api';
import { publicProjectItemToProject } from '../utils/projectMappers';

export default function PublicPortfolioList() {
  const { username, portfolioCode } = useParams<{ username: string; portfolioCode: string }>();
  const publicUsername = username ?? '';

  const [projects, setProjects] = useState<Project[]>([]);
  const [portfolio, setPortfolio] = useState<PublicPortfolio | null>(null);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEmailCopied, setIsEmailCopied] = useState(false);
  const filters = useProjectFilters(projects);
  const publicEmail = profile?.email?.trim();
  const publicExtraFields = (profile?.extra_fields ?? [])
    .filter((field) => field.is_public && field.label && field.value)
    .sort((a, b) => a.order - b.order);

  useEffect(() => {
    if (!username || !portfolioCode) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [publicPortfolio, publicProjects, publicProfile] = await Promise.all([
          getPublicPortfolio(username, portfolioCode),
          getPublicProjects(username, portfolioCode),
          getPublicPortfolioProfile(username, portfolioCode),
        ]);
        setPortfolio(publicPortfolio);
        setProfile(publicProfile);
        setProjects(
          publicProjects.filter((project) => project.is_public).map(publicProjectItemToProject)
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : '프로젝트를 불러오지 못했습니다.');
        console.error('Failed to fetch public projects:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [username, portfolioCode]);

  const handleCopyEmail = async () => {
    if (!publicEmail) return;

    try {
      await navigator.clipboard.writeText(publicEmail);
      setIsEmailCopied(true);
      window.setTimeout(() => setIsEmailCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy email:', err);
      alert('이메일 복사에 실패했습니다.');
    }
  };

  if (isLoading) {
    return <PageState loading message="프로젝트를 불러오는 중..." />;
  }

  if (error) {
    return (
      <PageState
        title="오류가 발생했습니다"
        message={error}
        tone="error"
        actionLabel="다시 시도"
        onAction={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {portfolio?.name ?? portfolioCode}
          </h1>
          {portfolio?.description && (
            <p className="text-xl text-gray-600">{portfolio.description}</p>
          )}
        </div>

        {profile && (
          <div className="flex justify-center mb-8">
            <button
              type="button"
              onClick={() => setIsProfileOpen(true)}
              className="inline-flex items-center gap-3 px-4 py-3 text-left bg-white border border-gray-300 rounded-lg shadow-sm hover:border-blue-500 hover:shadow-md transition-all"
            >
              {profile.avatar_file_uuid && (
                <img
                  src={getPublicFileUrl(publicUsername, profile.avatar_file_uuid, 'thumbnail')}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover border border-gray-200"
                />
              )}
              <span>
                <span className="block text-sm font-semibold text-gray-900">프로필 보기</span>
                {profile.headline && (
                  <span className="block text-xs text-gray-500">{profile.headline}</span>
                )}
                {publicEmail && (
                  <span className="block text-xs text-blue-600">{publicEmail}</span>
                )}
              </span>
            </button>
          </div>
        )}

        {profile && (
          <Modal
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
            title="프로필"
          >
            <div className="text-center">
              {profile.avatar_file_uuid && (
                <img
                  src={getPublicFileUrl(publicUsername, profile.avatar_file_uuid, 'thumbnail')}
                  alt=""
                  className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border border-gray-200"
                />
              )}
              {profile.headline && (
                <p className="text-lg font-semibold text-gray-900">{profile.headline}</p>
              )}
              {publicEmail && (
                <div className="mt-2 inline-flex items-center gap-2">
                  <a
                    href={`mailto:${publicEmail}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    {publicEmail}
                  </a>
                  <button
                    type="button"
                    onClick={() => void handleCopyEmail()}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                    title="이메일 복사"
                    aria-label="이메일 복사"
                  >
                    <ClipboardIcon className="w-4 h-4" />
                  </button>
                  {isEmailCopied && (
                    <span className="text-xs font-medium text-blue-600">복사됨</span>
                  )}
                </div>
              )}
              {profile.bio && (
                <p className="text-gray-600 max-w-2xl mx-auto mt-5 whitespace-pre-wrap text-left sm:text-center">
                  {profile.bio}
                </p>
              )}
              {publicExtraFields.length > 0 && (
                <dl className="grid grid-cols-1 gap-3 mt-6 text-left">
                  {publicExtraFields.map((field) => (
                    <div
                      key={`${field.key}-${field.order}`}
                      className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
                    >
                      <dt className="text-xs font-semibold text-gray-500">{field.label}</dt>
                      <dd className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">
                        {field.type === 'url' ? (
                          <a
                            href={field.value}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {field.value}
                          </a>
                        ) : (
                          field.value
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                {profile.links?.map((link) => (
                  <a
                    key={`${link.name}-${link.url}`}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:border-blue-500 hover:text-blue-600"
                  >
                    {link.name || link.url}
                  </a>
                ))}
              </div>
            </div>
          </Modal>
        )}

        <ProjectFilterBar
          tagInput={filters.tagInput}
          selectedTags={filters.selectedTags}
          suggestions={filters.suggestions}
          filteredCount={filters.filteredProjects.length}
          onTagInputChange={filters.setTagInput}
          onAddTag={filters.addTag}
          onRemoveTag={filters.removeTag}
          onClearTags={() => filters.setSelectedTags([])}
          onKeyDown={filters.handleKeyDown}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filters.filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              linkPath={`/public/${username}/${portfolioCode}/${project.code}`}
              thumbnailUrl={
                project.thumbnailFileUuid && username
                  ? getPublicFileUrl(publicUsername, project.thumbnailFileUuid, 'thumbnail')
                  : undefined
              }
            />
          ))}
        </div>

        {filters.filteredProjects.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">
              {filters.selectedTags.length > 0
                ? '해당 태그를 가진 프로젝트가 없습니다.'
                : '아직 공개 프로젝트가 없습니다.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
