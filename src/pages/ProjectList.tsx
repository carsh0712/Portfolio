import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ActionCard from '../components/ActionCard';
import ArrowLeftIcon from '../components/svg/ArrowLeftIcon';
import ProjectCard from '../components/ProjectCard';
import PlusIcon from '../components/svg/PlusIcon';
import SettingsIcon from '../components/svg/SettingsIcon';
import ShareIcon from '../components/svg/ShareIcon';
import type { AuthUser } from '../types/auth';
import type { Category } from '../types/category';
import type { PortfolioItem, Project } from '../types/project';
import { getCategoryDetail, getCurrentUser, getPortfolios } from '../utils/api';

// Helper function to convert PortfolioItem to Project
function portfolioItemToProject(item: PortfolioItem, categoryCode: string): Project {
  return {
    id: item.code,
    categoryId: categoryCode,
    code: item.code,
    title: item.title,
    summary: item.summary,
    description: '',
    techStack: item.tech_stack,
    tags: item.tags,
    thumbnailFileUuid: item.thumbnail?.file_uuid,
    startDate: '',
    features: [],
    isPublic: item.is_public,
  };
}

export default function ProjectList() {
  const { portfolioCode } = useParams<{ portfolioCode: string }>();
  const navigate = useNavigate();

  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page] = useState(1); // TODO: 페이지네이션 UI 추가 시 사용

  // TODO: 실제 사용자 권한은 API나 Context에서 가져와야 함
  const isCurator = true;
  const [tagInput, setTagInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce tag input for API search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(tagInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [tagInput]);

  // Load current user from API
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (err) {
        console.error('Failed to fetch current user:', err);
      }
    };
    fetchUser();
  }, []);

  // Fetch category info
  useEffect(() => {
    if (!portfolioCode) return;

    setIsLoading(true);
    setError(null);

    getCategoryDetail(portfolioCode)
      .then((foundCategory) => {
        setCategory(foundCategory);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.');
        console.error('Failed to fetch category:', err);
        setIsLoading(false);
      });
  }, [portfolioCode]);

  // Fetch portfolios (re-fetch when search or tag filter changes)
  const isInitialLoad = category === null || (isLoading && projects.length === 0);
  useEffect(() => {
    if (!category) return;

    const fetchProjects = async () => {
      try {
        const search =
          debouncedSearch ||
          (selectedTags.length > 0 ? selectedTags[selectedTags.length - 1] : undefined);
        const portfoliosResponse = await getPortfolios(category.code, page, 100, search);
        const convertedProjects = portfoliosResponse.items.map((item) =>
          portfolioItemToProject(item, category.code)
        );
        setProjects(convertedProjects);
      } catch (err) {
        setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.');
        console.error('Failed to fetch projects:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [category, page, selectedTags, debouncedSearch]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    projects.forEach((project) => {
      project.tags.forEach((tag) => tagSet.add(tag));
      project.techStack.forEach((tech) => tagSet.add(tech));
    });
    return Array.from(tagSet).sort();
  }, [projects]);

  const suggestions = useMemo(() => {
    if (!tagInput.trim()) return [];
    const input = tagInput.toLowerCase();
    return allTags.filter(
      (tag) => tag.toLowerCase().includes(input) && !selectedTags.includes(tag)
    );
  }, [tagInput, allTags, selectedTags]);

  const filteredProjects = useMemo(() => {
    let result = projects;

    // 태그 필터링
    if (selectedTags.length > 0) {
      result = result.filter((project) =>
        selectedTags.every((tag) => project.tags.includes(tag) || project.techStack.includes(tag))
      );
    }

    return result;
  }, [projects, selectedTags]);

  const handleAddTag = (tag: string) => {
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && suggestions.length > 0) {
      e.preventDefault();
      handleAddTag(suggestions[0]);
    } else if (e.key === 'Backspace' && tagInput === '' && selectedTags.length > 0) {
      handleRemoveTag(selectedTags[selectedTags.length - 1]);
    }
  };

  const handleAddProject = () => {
    navigate(`/portfolio/${portfolioCode}/project/add`);
  };

  const handleShareClick = async () => {
    if (!category || !currentUser) return;

    const publicUrl = `${window.location.origin}/public/${currentUser.username}/${category.code}`;

    try {
      await navigator.clipboard.writeText(publicUrl);
      setShowCopiedMessage(true);
      setTimeout(() => setShowCopiedMessage(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('링크 복사에 실패했습니다.');
    }
  };

  // Loading state (only for initial load, not search re-fetches)
  if (isInitialLoad) {
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
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // Category not found
  if (!category) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">카테고리를 찾을 수 없습니다</h1>
          <Link to="/home" className="text-blue-600 hover:text-blue-800 underline">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
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
            <h1 className="text-4xl font-bold text-gray-900">{category.name}</h1>
            <div className="flex items-center gap-2">
              {category.is_public && currentUser && (
                <div className="relative">
                  <button
                    onClick={handleShareClick}
                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="공유 링크 복사"
                  >
                    <ShareIcon className="w-6 h-6" />
                  </button>
                  {showCopiedMessage && (
                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-3 py-1 rounded whitespace-nowrap">
                      링크가 복사되었습니다!
                    </div>
                  )}
                </div>
              )}
              {isCurator && (
                <button
                  onClick={() => navigate(`/portfolio/${portfolioCode}/edit`)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="카테고리 편집"
                >
                  <SettingsIcon className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{category.description}</p>
        </div>

        <div className="mb-8">
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <div className="flex flex-wrap items-center gap-2 p-3 bg-white border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                  >
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)} className="hover:text-blue-600">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={selectedTags.length === 0 ? '태그를 입력하세요...' : ''}
                  className="flex-1 min-w-[120px] outline-none bg-transparent text-gray-700 placeholder-gray-400"
                />
              </div>

              {suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                  {suggestions.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleAddTag(tag)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedTags.length > 0 && (
              <div className="flex justify-between items-center mt-3">
                <p className="text-sm text-gray-600">{filteredProjects.length}개 프로젝트</p>
                <button
                  onClick={() => setSelectedTags([])}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  필터 초기화
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}

          {/* Curator 권한: 새 프로젝트 추가 카드 */}
          {isCurator && (
            <ActionCard
              icon={
                <PlusIcon className="w-16 h-16 text-gray-400 group-hover:text-blue-500 transition-colors" />
              }
              title="새 프로젝트 추가"
              description="클릭하여 새 프로젝트를 만드세요"
              onClick={handleAddProject}
            />
          )}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">해당 태그를 가진 프로젝트가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
