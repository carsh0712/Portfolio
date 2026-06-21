import BackLink from '../components/BackLink';
import ActionCard from '../components/ActionCard';
import PageState from '../components/PageState';
import ProjectCard from '../components/ProjectCard';
import ProjectFilterBar from '../components/ProjectFilterBar';
import PlusIcon from '../components/svg/PlusIcon';
import SettingsIcon from '../components/svg/SettingsIcon';
import ShareIcon from '../components/svg/ShareIcon';
import { useProjectListPage } from '../hooks/useProjectListPage';

export default function ProjectList() {
  const page = useProjectListPage();
  const { filters } = page;

  if (page.portfolio === null || (page.isLoading && filters.filteredProjects.length === 0)) {
    return <PageState loading message="프로젝트를 불러오는 중..." />;
  }

  if (page.error) {
    return (
      <PageState
        title="오류가 발생했습니다"
        message={page.error}
        tone="error"
        actionLabel="다시 시도"
        onAction={page.reload}
      />
    );
  }

  if (!page.portfolio) {
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
        <BackLink to="/home" label="포트폴리오 목록" />

        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-4xl font-bold text-gray-900">{page.portfolio.name}</h1>
            <div className="flex items-center gap-2">
              {page.portfolio.is_public && page.currentUser && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={page.sharePortfolio}
                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="공유 링크 복사"
                  >
                    <ShareIcon className="w-6 h-6" />
                  </button>
                  {page.showCopiedMessage && (
                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-3 py-1 rounded whitespace-nowrap">
                      링크가 복사되었습니다.
                    </div>
                  )}
                </div>
              )}
              {page.isCurator && (
                <button
                  type="button"
                  onClick={page.editPortfolio}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="포트폴리오 편집"
                >
                  <SettingsIcon className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{page.portfolio.description}</p>
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

          {page.isCurator && (
            <ActionCard
              icon={
                <PlusIcon className="w-16 h-16 text-gray-400 group-hover:text-blue-500 transition-colors" />
              }
              title="새 프로젝트 추가"
              description="클릭하여 새 프로젝트를 만드세요."
              onClick={page.addProject}
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
