import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ActionCard from '../components/ActionCard';
import PageState from '../components/PageState';
import ProjectCard from '../components/ProjectCard';
import ProjectFilterBar from '../components/ProjectFilterBar';
import ArrowLeftIcon from '../components/svg/ArrowLeftIcon';
import PlusIcon from '../components/svg/PlusIcon';
import SettingsIcon from '../components/svg/SettingsIcon';
import ShareIcon from '../components/svg/ShareIcon';
import { useProjectFilters } from '../hooks/useProjectFilters';
import type { AuthUser } from '../types/auth';
import type { Portfolio } from '../types/portfolio';
import type { Project } from '../types/project';
import { getCurrentUser, getPortfolioDetail, getProjects } from '../utils/api';
import { projectListItemToProject } from '../utils/projectMappers';

export default function ProjectList() {
  const { portfolioCode } = useParams<{ portfolioCode: string }>();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const filters = useProjectFilters(projects);

  const isCurator = true;

  useEffect(() => {
    getCurrentUser()
      .then(setCurrentUser)
      .catch((err) => console.error('Failed to fetch current user:', err));
  }, []);

  useEffect(() => {
    if (!portfolioCode) return;

    setIsLoading(true);
    setError(null);
    getPortfolioDetail(portfolioCode)
      .then(setPortfolio)
      .catch((err) => {
        setError(err instanceof Error ? err.message : '포트폴리오를 불러오지 못했습니다.');
        console.error('Failed to fetch portfolio:', err);
        setIsLoading(false);
      });
  }, [portfolioCode]);

  useEffect(() => {
    if (!portfolio) return;

    const fetchProjects = async () => {
      try {
        const search =
          filters.debouncedTagInput ||
          (filters.selectedTags.length > 0
            ? filters.selectedTags[filters.selectedTags.length - 1]
            : undefined);
        const response = await getProjects(portfolio.code, 1, 100, search);
        setProjects(response.items.map((item) => projectListItemToProject(item, portfolio.code)));
      } catch (err) {
        setError(err instanceof Error ? err.message : '프로젝트를 불러오지 못했습니다.');
        console.error('Failed to fetch projects:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [portfolio, filters.debouncedTagInput, filters.selectedTags]);

  const handleShareClick = async () => {
    if (!portfolio || !currentUser) return;

    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/public/${currentUser.username}/${portfolio.code}`
      );
      setShowCopiedMessage(true);
      window.setTimeout(() => setShowCopiedMessage(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('링크 복사에 실패했습니다.');
    }
  };

  if (portfolio === null || (isLoading && projects.length === 0)) {
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

  if (!portfolio) {
    return (
      <PageState
        title="포트폴리오를 찾을 수 없습니다"
        message="홈으로 돌아가 다시 선택해 주세요."
        actionLabel="홈으로 돌아가기"
        actionTo="/home"
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <Link
          to="/home"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-8"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          포트폴리오 목록
        </Link>

        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-4xl font-bold text-gray-900">{portfolio.name}</h1>
            <div className="flex items-center gap-2">
              {portfolio.is_public && currentUser && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={handleShareClick}
                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="공유 링크 복사"
                  >
                    <ShareIcon className="w-6 h-6" />
                  </button>
                  {showCopiedMessage && (
                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-3 py-1 rounded whitespace-nowrap">
                      링크가 복사되었습니다
                    </div>
                  )}
                </div>
              )}
              {isCurator && (
                <button
                  type="button"
                  onClick={() => navigate(`/portfolio/${portfolioCode}/edit`)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="포트폴리오 편집"
                >
                  <SettingsIcon className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{portfolio.description}</p>
        </div>

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
            <ProjectCard key={project.id} project={project} />
          ))}

          {isCurator && (
            <ActionCard
              icon={
                <PlusIcon className="w-16 h-16 text-gray-400 group-hover:text-blue-500 transition-colors" />
              }
              title="새 프로젝트 추가"
              description="클릭하여 새 프로젝트를 만드세요"
              onClick={() => navigate(`/portfolio/${portfolioCode}/project/add`)}
            />
          )}
        </div>

        {filters.filteredProjects.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">조건에 맞는 프로젝트가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
