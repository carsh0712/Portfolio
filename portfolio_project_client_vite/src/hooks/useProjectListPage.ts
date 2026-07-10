import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProjectFilters } from './useProjectFilters';
import type { AuthUser } from '../types/auth';
import type { Portfolio } from '../types/portfolio';
import type { Project } from '../types/project';
import { ApiError, getCurrentUser, getPortfolioDetail, getProjects } from '../utils/api';
import { projectListItemToProject } from '../utils/projectMappers';

export function useProjectListPage() {
  const { portfolioCode } = useParams<{ portfolioCode: string }>();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPortfolioNotFound, setIsPortfolioNotFound] = useState(false);
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
    setIsPortfolioNotFound(false);
    setPortfolio(null);
    getPortfolioDetail(portfolioCode)
      .then(setPortfolio)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setIsPortfolioNotFound(true);
          setError(
            '요청하신 포트폴리오를 찾을 수 없습니다. 주소가 맞는지 확인하거나 포트폴리오 목록에서 다시 선택해 주세요.'
          );
        } else {
          setError(err instanceof Error ? err.message : '포트폴리오를 불러오지 못했습니다.');
        }
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

  const sharePortfolio = async () => {
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

  return {
    portfolioCode,
    portfolio,
    currentUser,
    filters,
    isLoading,
    error,
    isPortfolioNotFound,
    isCurator,
    showCopiedMessage,
    sharePortfolio,
    editPortfolio: () => navigate(`/portfolio/${portfolioCode}/edit`),
    addProject: () => navigate(`/portfolio/${portfolioCode}/project/add`),
    reload: () => window.location.reload(),
  };
}
