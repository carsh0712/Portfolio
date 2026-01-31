import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ProjectCard from '../components/ProjectCard';
import { getPublicPortfolios } from '../utils/api';
import type { Project, PublicPortfolioItem } from '../types/project';

function publicPortfolioItemToProject(item: PublicPortfolioItem): Project {
  return {
    id: String(item.id),
    categoryId: String(item.category_id),
    code: item.code,
    title: item.title,
    summary: item.summary,
    description: '',
    techStack: item.tags,
    tags: item.tags,
    thumbnailFileId: item.thumbnail?.file_id,
    startDate: item.created_at,
    features: [],
    isPublic: item.is_public,
  };
}

export default function PublicPortfolioList() {
  const { username, categoryCode } = useParams<{ username: string; categoryCode: string }>();

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    if (!username || !categoryCode) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const publicPortfolios = await getPublicPortfolios(username, categoryCode);
        const publicProjects = publicPortfolios.filter((p) => p.is_public === true);
        const convertedProjects = publicProjects.map(publicPortfolioItemToProject);
        setProjects(convertedProjects);
      } catch (err) {
        setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.');
        console.error('Failed to fetch public portfolios:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [username, categoryCode]);

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
    if (selectedTags.length === 0) return projects;

    return projects.filter((project) =>
      selectedTags.every((tag) => project.tags.includes(tag) || project.techStack.includes(tag))
    );
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

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{username}의 포트폴리오</h1>
          <p className="text-xl text-gray-600">{categoryCode}</p>
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
            <ProjectCard
              key={project.id}
              project={project}
              linkPath={`/public/${username}/${categoryCode}/${project.code}`}
            />
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">
              {selectedTags.length > 0
                ? '해당 태그를 가진 프로젝트가 없습니다.'
                : '아직 공개된 프로젝트가 없습니다.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
