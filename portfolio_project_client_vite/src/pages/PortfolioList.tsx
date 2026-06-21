import ActionCard from '../components/ActionCard';
import PageState from '../components/PageState';
import PortfolioCard from '../components/PortfolioCard';
import PlusIcon from '../components/svg/PlusIcon';
import { usePortfolioListPage } from '../hooks/usePortfolioListPage';

export default function PortfolioList() {
  const page = usePortfolioListPage();

  if (page.loading) {
    return <PageState loading message="포트폴리오를 불러오는 중..." />;
  }

  if (page.error && page.portfolios.length === 0) {
    return (
      <PageState
        title="오류가 발생했습니다"
        message={page.error}
        actionLabel="다시 시도"
        onAction={page.reload}
        tone="error"
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-4xl font-bold text-gray-900">Portfolio</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {page.portfolios.map((portfolio) => (
            <PortfolioCard key={portfolio.id} portfolio={portfolio} />
          ))}

          {page.isCurator && (
            <ActionCard
              icon={
                <PlusIcon className="w-16 h-16 text-gray-400 group-hover:text-blue-500 transition-colors" />
              }
              title="새 포트폴리오 추가"
              description="클릭하여 새 포트폴리오를 만드세요."
              onClick={page.addPortfolio}
            />
          )}
        </div>

        {page.hasMore && <div ref={page.observerRef} className="h-10 mt-8" />}

        {page.loadingMore && (
          <div className="flex justify-center mt-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        )}
      </div>
    </div>
  );
}
