import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PageState from '../components/PageState';
import ProjectCard from '../components/ProjectCard';
import ProjectFilterBar from '../components/ProjectFilterBar';
import { useProjectFilters } from '../hooks/useProjectFilters';
import type { Project } from '../types/project';
import { getPublicFileUrl, getPublicProjects } from '../utils/api';
import { publicProjectItemToProject } from '../utils/projectMappers';

export default function PublicPortfolioList() {
  const { username, portfolioCode } = useParams<{ username: string; portfolioCode: string }>();

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const filters = useProjectFilters(projects);

  useEffect(() => {
    if (!username || !portfolioCode) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const publicProjects = await getPublicProjects(username, portfolioCode);
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{username}의 Portfolio</h1>
          <p className="text-xl text-gray-600">{portfolioCode}</p>
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
            <ProjectCard
              key={project.id}
              project={project}
              linkPath={`/public/${username}/${portfolioCode}/${project.code}`}
              thumbnailUrl={
                project.thumbnailFileUuid && username
                  ? getPublicFileUrl(username, project.thumbnailFileUuid)
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
