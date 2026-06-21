import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ArrowLeftIcon from '../components/svg/ArrowLeftIcon';
import { createPortfolio, getPortfolios } from '../utils/api';
import type { CreatePortfolioRequest } from '../types/portfolio';
import PortfolioForm, { type PortfolioFormData } from '../components/PortfolioForm';

export default function PortfolioAdd() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<PortfolioFormData>({
    name: '',
    description: '',
    screenshotFileUuid: null,
    code: '',
    isPublic: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const portfoliosResponse = await getPortfolios(1, 100);
      const maxOrder = portfoliosResponse.items.reduce(
        (max, portfolio) => Math.max(max, portfolio.order),
        0
      );

      const requestData: CreatePortfolioRequest = {
        code: formData.code,
        name: formData.name,
        description: formData.description,
        screenshot: formData.screenshotFileUuid ? { file_uuid: formData.screenshotFileUuid } : null,
        order: maxOrder + 1,
        is_public: formData.isPublic,
      };

      await createPortfolio(requestData);
      navigate('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : '?ы듃?대━??異붽????ㅽ뙣?덉뒿?덈떎.');
      console.error('Failed to create portfolio:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Link to="/home" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-8">
        <ArrowLeftIcon className="w-5 h-5 mr-2" />
        ?덉쑝濡??뚯븘媛湲?      </Link>

      <div className="bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">???ы듃?대━??異붽?</h1>

        {error && (
          <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <PortfolioForm formData={formData} onChange={setFormData} />

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/home')}
              disabled={loading}
              className="flex-1 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              痍⑥냼
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {loading ? '異붽? 以?..' : '?ы듃?대━??異붽?'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

