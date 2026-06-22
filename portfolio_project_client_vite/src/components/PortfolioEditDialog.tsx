import { useState } from 'react';
import Modal from './Modal';
import type { Portfolio } from '../types/portfolio';
import { updatePortfolio } from '../utils/api';
import PortfolioForm, { type PortfolioFormData } from './PortfolioForm';

interface PortfolioEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  portfolio: Portfolio;
  onSuccess: () => void;
}

export default function PortfolioEditDialog({
  isOpen,
  onClose,
  portfolio,
  onSuccess,
}: PortfolioEditDialogProps) {
  const [formData, setFormData] = useState<PortfolioFormData>({
    code: portfolio.code,
    name: portfolio.name,
    description: portfolio.description,
    screenshotFileUuid: portfolio.screenshot?.file_uuid ?? null,
    order: portfolio.order,
    isPublic: portfolio.is_public,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
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
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '포트폴리오 수정에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="포트폴리오 편집">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <PortfolioForm formData={formData} onChange={setFormData} showOrder />

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isSubmitting}
          >
            취소
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

