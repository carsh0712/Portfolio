import BackLink from '../components/BackLink';
import AuthImage from '../components/AuthImage';
import PageState from '../components/PageState';
import ProjectDetailView from '../components/ProjectDetailView';
import ProjectEditForm from '../components/ProjectEditForm';
import ProjectImageLightbox from '../components/ProjectImageLightbox';
import { useProjectDetailPage } from '../hooks/useProjectDetailPage';

export default function ProjectDetail() {
  const page = useProjectDetailPage();

  const renderAuthImage = (fileUuid: string, alt: string, className: string) => (
    <AuthImage fileUuid={fileUuid} alt={alt} className={className} />
  );

  if (page.isLoading) {
    return <PageState loading message="프로젝트를 불러오는 중..." />;
  }

  if (page.error) {
    return (
      <PageState
        title="오류가 발생했습니다"
        message={page.error}
        tone="error"
        actionLabel="목록으로 돌아가기"
        actionTo={page.backPath}
      />
    );
  }

  if (!page.project) {
    return (
      <PageState
        title="프로젝트를 찾을 수 없습니다"
        message="목록으로 돌아가 다시 선택해 주세요."
        actionLabel="목록으로 돌아가기"
        actionTo={page.backPath}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <BackLink to={page.backPath} label="목록으로 돌아가기" />

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {page.project.thumbnailFileUuid ? (
            <div className="h-64 overflow-hidden">
              {renderAuthImage(
                page.project.thumbnailFileUuid,
                page.project.title,
                'w-full h-full object-cover'
              )}
            </div>
          ) : (
            <div className="h-64 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-8xl font-bold opacity-30">
                {page.project.title.charAt(0)}
              </span>
            </div>
          )}

          <div className="p-8">
            {page.isEditing ? (
              <ProjectEditForm
                project={page.project}
                onSave={page.saveProject}
                onCancel={() => page.setIsEditing(false)}
              />
            ) : (
              <ProjectDetailView
                project={page.project}
                renderImage={renderAuthImage}
                onScreenshotSelect={page.setSelectedIndex}
                actions={
                  <>
                    <button
                      type="button"
                      onClick={page.shareProject}
                      disabled={!page.user?.username || !page.portfolioCode || !page.project.code}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {page.copied ? '복사됨' : '공유'}
                    </button>
                    {page.isCurator && (
                      <button
                        type="button"
                        onClick={() => page.setIsEditing(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        편집
                      </button>
                    )}
                  </>
                }
              />
            )}
          </div>
        </div>
      </div>

      <ProjectImageLightbox
        images={page.project.screenshots || []}
        selectedIndex={page.selectedIndex}
        renderImage={renderAuthImage}
        onSelect={page.setSelectedIndex}
      />
    </div>
  );
}
