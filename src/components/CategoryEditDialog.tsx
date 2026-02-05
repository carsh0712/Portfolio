import { useState } from 'react';
import Modal from './Modal';
import type { Category } from '../types/category';
import { updateCategory } from '../utils/api';
import CategoryForm, { type CategoryFormData } from './CategoryForm';

interface CategoryEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category;
  onSuccess: () => void;
}

export default function CategoryEditDialog({
  isOpen,
  onClose,
  category,
  onSuccess,
}: CategoryEditDialogProps) {
  const [formData, setFormData] = useState<CategoryFormData>({
    code: category.code,
    name: category.name,
    description: category.description,
    screenshotFileUuid: category.screenshot?.file_uuid ?? null,
    order: category.order,
    isPublic: category.is_public,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await updateCategory(category.code, {
        code: formData.code,
        name: formData.name,
        description: formData.description,
        screenshot_file_uuid: formData.screenshotFileUuid,
        order: formData.order ?? category.order,
        is_public: formData.isPublic,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '카테고리 수정에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="카테고리 편집">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <CategoryForm formData={formData} onChange={setFormData} showOrder />

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
