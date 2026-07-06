import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BackLink from '../components/BackLink';
import FormActions from '../components/FormActions';
import FormError from '../components/FormError';
import PageCard from '../components/PageCard';
import PageState from '../components/PageState';
import PortfolioForm, { type PortfolioFormData } from '../components/PortfolioForm';
import type { Portfolio } from '../types/portfolio';
import { getPortfolioDetail, updatePortfolio } from '../utils/api';

export default function PortfolioEdit() {
  const { portfolioCode } = useParams<{ portfolioCode: string }>();
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [formData, setFormData] = useState<PortfolioFormData>({
    name: '',
    description: '',
    screenshotFileUuid: null,
    profileId: null,
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
        profileId: found.profile_id ?? null,
        order: found.order,
        isPublic: found.is_public,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '포트폴리오를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [portfolioCode]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!portfolio) return;

    setSubmitting(true);
    setError(null);

    try {
      await updatePortfolio(portfolio.code, {
        code: formData.code,
        name: formData.name,
        description: formData.description,
        screenshot: formData.screenshotFileUuid ? { file_uuid: formData.screenshotFileUuid } : null,
        profile_id: formData.profileId,
        order: formData.order ?? portfolio.order,
        is_public: formData.isPublic,
      });
      navigate(`/portfolio/${formData.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '포트폴리오 수정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <PageState loading message="포트폴리오를 불러오는 중..." />;
  }

  if (!portfolio) {
    return (
      <PageState
        title="포트폴리오를 찾을 수 없습니다"
        message="요청한 포트폴리오가 없거나 접근할 수 없습니다."
        actionLabel="홈으로 돌아가기"
        actionTo="/home"
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <BackLink to={`/portfolio/${portfolioCode}`} label="포트폴리오로 돌아가기" />

      <PageCard>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">포트폴리오 편집</h1>
        <FormError message={error} />

        <form onSubmit={handleSubmit} className="space-y-6">
          <PortfolioForm formData={formData} onChange={setFormData} showOrder />
          <FormActions
            submitLabel="저장"
            submittingLabel="저장 중..."
            isSubmitting={submitting}
            onCancel={() => navigate(`/portfolio/${portfolioCode}`)}
          />
        </form>
      </PageCard>
    </div>
  );
}
