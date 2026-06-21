import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ActionCard from '../components/ActionCard';
import PlusIcon from '../components/svg/PlusIcon';
import PublicStatusBadge from '../components/PublicStatusBadge';
import type { PortfolioCategory } from '../types/category';
import { getPortfolioCategories } from '../utils/api';
import AuthImage from '../components/AuthImage';

export default function CategoryList() {
  const navigate = useNavigate();
  const [portfolios, setPortfolios] = useState<PortfolioCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<HTMLDivElement | null>(null);

  // TODO: 실제 사용자 권한은 API나 AuthContext에서 가져오도록 변경한다.
  const isCurator = true;

  const fetchPortfolios = useCallback(async (pageNum: number) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      const response = await getPortfolioCategories(pageNum, 10);
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

  const handleAddPortfolio = () => {
    navigate('/portfolio/add');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">포트폴리오를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error && portfolios.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">!</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">오류가 발생했습니다</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-4xl font-bold text-gray-900">Portfolio</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {portfolios.map((portfolio) => (
            <Link
              key={portfolio.id}
              to={`/portfolio/${portfolio.code}`}
              className="group block bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <div className="aspect-video overflow-hidden">
                {portfolio.screenshot ? (
                  <AuthImage
                    fileUuid={portfolio.screenshot.file_uuid}
                    alt={portfolio.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white text-4xl font-bold">{portfolio.name[0]}</span>
                  </div>
                )}
              </div>
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                  {portfolio.name}
                </h2>
                <p className="text-gray-600 mb-3">{portfolio.description}</p>
                <PublicStatusBadge isPublic={portfolio.is_public} />
              </div>
            </Link>
          ))}

          {isCurator && (
            <ActionCard
              icon={
                <PlusIcon className="w-16 h-16 text-gray-400 group-hover:text-blue-500 transition-colors" />
              }
              title="새 포트폴리오 추가"
              description="클릭하여 새 포트폴리오를 만드세요"
              onClick={handleAddPortfolio}
            />
          )}
        </div>

        {hasMore && <div ref={observerRef} className="h-10 mt-8" />}

        {loadingMore && (
          <div className="flex justify-center mt-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
    </div>
  );
}
