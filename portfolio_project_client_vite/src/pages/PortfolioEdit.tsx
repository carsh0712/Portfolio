import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ArrowLeftIcon from '../components/svg/ArrowLeftIcon';
import { getPortfolioDetail, updatePortfolio } from '../utils/api';
import type { Portfolio } from '../types/portfolio';
import PortfolioForm, { type PortfolioFormData } from '../components/PortfolioForm';

export default function PortfolioEdit() {
  const { portfolioCode } = useParams<{ portfolioCode: string }>();
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [formData, setFormData] = useState<PortfolioFormData>({
    name: '',
    description: '',
    screenshotFileUuid: null,
    code: '',
    isPublic: false,
    order: 0,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolio = useCallback(async () => {
    if (!portfolioCode) return;
    try {
      setLoading(true);
      const found = await getPortfolioDetail(portfolioCode);
      setPortfolio(found);
      setFormData({
        code: found.code,
        name: found.name,
        description: found.description,
        screenshotFileUuid: found.screenshot?.file_uuid ?? null,
        order: found.order,
        isPublic: found.is_public,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '?ы듃?대━?ㅻ? 遺덈윭?ㅼ? 紐삵뻽?듬땲??');
    } finally {
      setLoading(false);
    }
  }, [portfolioCode]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portfolio) return;
    setSubmitting(true);
    setError(null);

    try {
      await updatePortfolio(portfolio.code, {
        code: formData.code,
        name: formData.name,
        description: formData.description,
        screenshot: formData.screenshotFileUuid ? { file_uuid: formData.screenshotFileUuid } : null,
        order: formData.order ?? portfolio.order,
        is_public: formData.isPublic,
      });
      navigate(`/portfolio/${formData.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '?ы듃?대━???섏젙???ㅽ뙣?덉뒿?덈떎.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">?ы듃?대━?ㅻ? 遺덈윭?ㅻ뒗 以?..</p>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">?ы듃?대━?ㅻ? 李얠쓣 ???놁뒿?덈떎</h2>
          <Link to="/home" className="text-blue-600 hover:text-blue-800">
            ?덉쑝濡??뚯븘媛湲?          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Link
        to={`/portfolio/${portfolioCode}`}
        className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-8"
      >
        <ArrowLeftIcon className="w-5 h-5 mr-2" />
        ?ы듃?대━?ㅻ줈 ?뚯븘媛湲?      </Link>

      <div className="bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">?ы듃?대━???몄쭛</h1>

        {error && (
          <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <PortfolioForm formData={formData} onChange={setFormData} showOrder />

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate(`/portfolio/${portfolioCode}`)}
              disabled={submitting}
              className="flex-1 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              痍⑥냼
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {submitting ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

