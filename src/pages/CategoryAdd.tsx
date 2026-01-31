import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createCategory, getCategories } from '../utils/api';
import type { CreateCategoryRequest } from '../types/category';
import CategoryForm, { type CategoryFormData } from '../components/CategoryForm';

export default function CategoryAdd() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    screenshotFileId: null,
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
      // Fetch current categories to determine next order
      const categoriesResponse = await getCategories(1, 100);
      const maxOrder = categoriesResponse.items.reduce((max, cat) => Math.max(max, cat.order), 0);

      // Convert camelCase to snake_case for API
      const requestData: CreateCategoryRequest = {
        code: formData.code,
        name: formData.name,
        description: formData.description,
        screenshot_file_id: formData.screenshotFileId,
        order: maxOrder + 1,
        is_public: formData.isPublic,
      };

      await createCategory(requestData);
      navigate('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : '카테고리 추가에 실패했습니다.');
      console.error('Failed to create category:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Link to="/home" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-8">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        홈으로 돌아가기
      </Link>

      <div className="bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">새 카테고리 추가</h1>

        {error && (
          <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <CategoryForm formData={formData} onChange={setFormData} />

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/home')}
              disabled={loading}
              className="flex-1 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {loading ? '추가 중...' : '카테고리 추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
