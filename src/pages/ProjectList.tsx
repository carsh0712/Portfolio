import { useState, useMemo, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import ProjectCard from '../components/ProjectCard';
import { getPortfolios, getCategories } from '../utils/api';
import type { Project, PortfolioItem } from '../types/project';
import type { Category } from '../types/category';

// Helper function to convert PortfolioItem to Project
function portfolioItemToProject(item: PortfolioItem): Project {
  return {
    id: String(item.id),
    categoryId: String(item.category_id),
    title: item.title,
    summary: item.summary,
    description: '',
    techStack: item.tags,
    tags: item.tags,
    imageUrl: item.thumbnail_url,
    startDate: item.created_at,
    features: [],
    isPublic: item.is_public,
  };
}

export default function ProjectList() {
  const { categoryId } = useParams<{ categoryId: string }>();
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
  const [showPrivate, setShowPrivate] = useState(false);

  // Fetch category and portfolios from API
  useEffect(() => {
    if (!categoryId) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch category info
        const categoriesResponse = await getCategories(1, 100);
        const foundCategory = categoriesResponse.items.find((c) => c.id === Number(categoryId));

        if (!foundCategory) {
          setError('카테고리를 찾을 수 없습니다.');
          return;
        }

        setCategory(foundCategory);

        // Fetch portfolios
        const portfoliosResponse = await getPortfolios(Number(categoryId), page, 100);
        const convertedProjects = portfoliosResponse.items.map(portfolioItemToProject);
        setProjects(convertedProjects);
        // TODO: 페이지네이션 UI 추가 시 totalPages 사용
      } catch (err) {
        setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.');
        console.error('Failed to fetch data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [categoryId, page]);

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

    // 비공개 프로젝트 필터링 (showPrivate가 false면 공개 프로젝트만)
    if (!showPrivate) {
      result = result.filter((project) => project.isPublic !== false);
    }

    // 태그 필터링
    if (selectedTags.length > 0) {
      result = result.filter((project) =>
        selectedTags.every((tag) => project.tags.includes(tag) || project.techStack.includes(tag))
      );
    }

    return result;
  }, [projects, selectedTags, showPrivate]);

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
    navigate(`/category/${categoryId}/project/add`);
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
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          카테고리 목록
        </Link>

        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-4xl font-bold text-gray-900">{category.name}</h1>
            {isCurator && (
              <button
                onClick={handleAddProject}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                새 프로젝트
              </button>
            )}
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
            <button
              onClick={handleAddProject}
              className="group block bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 border-2 border-dashed border-gray-300 hover:border-blue-500"
            >
              <div className="aspect-video flex items-center justify-center bg-gray-50 group-hover:bg-blue-50 transition-colors">
                <svg
                  className="w-16 h-16 text-gray-400 group-hover:text-blue-500 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-500 mb-2 group-hover:text-blue-600 transition-colors">
                  새 프로젝트 추가
                </h2>
                <p className="text-gray-400">클릭하여 새 프로젝트를 만드세요</p>
              </div>
            </button>
          )}

          {/* Curator 권한: 비공개 프로젝트 보기 카드 */}
          {isCurator && (
            <button
              onClick={() => setShowPrivate(!showPrivate)}
              className={`group block rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 border-2 border-dashed ${
                showPrivate
                  ? 'bg-gray-800 border-gray-600 hover:border-gray-500'
                  : 'bg-white border-gray-300 hover:border-gray-500'
              }`}
            >
              <div
                className={`aspect-video flex items-center justify-center transition-colors ${
                  showPrivate ? 'bg-gray-700' : 'bg-gray-50 group-hover:bg-gray-100'
                }`}
              >
                <svg
                  className={`w-16 h-16 transition-colors ${
                    showPrivate ? 'text-gray-400' : 'text-gray-400 group-hover:text-gray-600'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {showPrivate ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  )}
                </svg>
              </div>
              <div className="p-6">
                <h2
                  className={`text-xl font-bold mb-2 transition-colors ${
                    showPrivate ? 'text-gray-300' : 'text-gray-500 group-hover:text-gray-700'
                  }`}
                >
                  {showPrivate ? '비공개 보는 중' : '비공개 프로젝트'}
                </h2>
                <p className={showPrivate ? 'text-gray-500' : 'text-gray-400'}>
                  {showPrivate ? '클릭하여 숨기기' : '클릭하여 비공개 프로젝트 보기'}
                </p>
              </div>
            </button>
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
