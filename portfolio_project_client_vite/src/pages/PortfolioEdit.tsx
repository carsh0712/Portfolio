import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BackLink from '../components/BackLink';
import FormActions from '../components/FormActions';
import FormError from '../components/FormError';
import Modal from '../components/Modal';
import PageCard from '../components/PageCard';
import PageState from '../components/PageState';
import PortfolioForm, { type PortfolioFormData } from '../components/PortfolioForm';
import type { Portfolio } from '../types/portfolio';
import { deletePortfolio, getPortfolioDetail, updatePortfolio } from '../utils/api';

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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmCode, setDeleteConfirmCode] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
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

  const closeDeleteDialog = () => {
    if (isDeleting) return;
    setIsDeleteDialogOpen(false);
    setDeleteConfirmCode('');
  };

  const handleDelete = async () => {
    if (!portfolio) return;

    setIsDeleting(true);
    setError(null);

    try {
      await deletePortfolio(portfolio.code);
      navigate('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : '포트폴리오 삭제에 실패했습니다.');
      setIsDeleting(false);
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

  const canDelete = deleteConfirmCode === portfolio.code && !isDeleting;

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

        <section className="mt-8 pt-8 border-t border-red-200">
          <div className="rounded-lg border border-red-200 bg-red-50 p-5">
            <h2 className="text-lg font-semibold text-red-900">Danger Zone</h2>
            <p className="mt-2 text-sm leading-6 text-red-800">
              이 포트폴리오와 하위 프로젝트, 연결된 이미지 파일이 함께 삭제됩니다. 이 작업은 되돌릴
              수 없습니다.
            </p>
            <button
              type="button"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={isDeleting}
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeleting ? '삭제 중...' : '포트폴리오 삭제'}
            </button>
          </div>
        </section>
      </PageCard>

      <Modal isOpen={isDeleteDialogOpen} onClose={closeDeleteDialog} title="포트폴리오 삭제">
        <div className="space-y-5">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm leading-6 text-red-900">
              <strong className="font-semibold">{portfolio.name}</strong> 포트폴리오를 삭제합니다.
              하위 프로젝트와 연결된 이미지 파일은 삭제 후 복구할 수 없습니다.
            </p>
          </div>

          <label className="block">
            <span className="block text-sm font-medium text-gray-900">
              삭제하려면 포트폴리오 코드 <span className="font-semibold">{portfolio.code}</span> 를
              입력하세요.
            </span>
            <input
              type="text"
              value={deleteConfirmCode}
              onChange={(event) => setDeleteConfirmCode(event.target.value)}
              disabled={isDeleting}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100"
              autoComplete="off"
            />
          </label>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeDeleteDialog}
              disabled={isDeleting}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={!canDelete}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeleting ? '삭제 중...' : '영구 삭제'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
