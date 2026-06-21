import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ActionCard from '../components/ActionCard';
import PageState from '../components/PageState';
import PortfolioCard from '../components/PortfolioCard';
import PlusIcon from '../components/svg/PlusIcon';
import type { Portfolio } from '../types/portfolio';
import { getPortfolios } from '../utils/api';

export default function PortfolioList() {
  const navigate = useNavigate();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<HTMLDivElement | null>(null);

  const isCurator = true;

  const fetchPortfolios = useCallback(async (pageNum: number) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      setError(null);
      const response = await getPortfolios(pageNum, 10);
      const sorted = response.items.sort((a, b) => a.order - b.order);

      if (pageNum === 1) {
        setPortfolios(sorted);
      } else {
        setPortfolios((prev) => [...prev, ...sorted]);
      }

      setHasMore(pageNum < response.meta.total_pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : '포트폴리오를 불러오지 못했습니다.');
      console.error('Failed to fetch portfolios:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchPortfolios(page);
  }, [page, fetchPortfolios]);

  useEffect(() => {
    if (!hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    const el = observerRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [hasMore, loadingMore]);

  if (loading) {
    return <PageState loading message="포트폴리오를 불러오는 중..." />;
  }

  if (error && portfolios.length === 0) {
    return (
      <PageState
        title="오류가 발생했습니다"
        message={error}
        actionLabel="다시 시도"
        onAction={() => window.location.reload()}
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
          {portfolios.map((portfolio) => (
            <PortfolioCard key={portfolio.id} portfolio={portfolio} />
          ))}

          {isCurator && (
            <ActionCard
              icon={
                <PlusIcon className="w-16 h-16 text-gray-400 group-hover:text-blue-500 transition-colors" />
              }
              title="새 포트폴리오 추가"
              description="클릭하여 새 포트폴리오를 만드세요."
              onClick={() => navigate('/portfolio/add')}
            />
          )}
        </div>

        {hasMore && <div ref={observerRef} className="h-10 mt-8" />}

        {loadingMore && (
          <div className="flex justify-center mt-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        )}
      </div>
    </div>
  );
}
