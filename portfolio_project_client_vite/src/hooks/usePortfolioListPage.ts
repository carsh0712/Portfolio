import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Portfolio } from '../types/portfolio';
import { getPortfolios } from '../utils/api';

export function usePortfolioListPage() {
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

    const element = observerRef.current;
    if (element) observer.observe(element);

    return () => {
      if (element) observer.unobserve(element);
    };
  }, [hasMore, loadingMore]);

  return {
    portfolios,
    loading,
    loadingMore,
    error,
    hasMore,
    observerRef,
    isCurator,
    addPortfolio: () => navigate('/portfolio/add'),
    reload: () => window.location.reload(),
  };
}
