import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackLink from '../components/BackLink';
import FormActions from '../components/FormActions';
import FormError from '../components/FormError';
import PageCard from '../components/PageCard';
import PortfolioForm, { type PortfolioFormData } from '../components/PortfolioForm';
import type { CreatePortfolioRequest } from '../types/portfolio';
import { createPortfolio, getPortfolios } from '../utils/api';

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
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
      setError(err instanceof Error ? err.message : '포트폴리오 추가에 실패했습니다.');
      console.error('Failed to create portfolio:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <BackLink to="/home" label="홈으로 돌아가기" />

      <PageCard>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">새 포트폴리오 추가</h1>
        <FormError message={error} />

        <form onSubmit={handleSubmit} className="space-y-6">
          <PortfolioForm formData={formData} onChange={setFormData} />
          <FormActions
            submitLabel="포트폴리오 추가"
            submittingLabel="추가 중..."
            isSubmitting={loading}
            onCancel={() => navigate('/home')}
          />
        </form>
      </PageCard>
    </div>
  );
}
