import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { Category } from '../types/category';
import type { Project } from '../types/project';
import { getCategoryDetail } from '../utils/api';
import ProjectEditForm from '../components/ProjectEditForm';

const emptyProject: Project = {
  id: '',
  categoryId: '',
  code: '',
  title: '',
  summary: '',
  description: '',
  techStack: [],
  tags: [],
  links: [],
  screenshots: [],
  startDate: '',
  endDate: '',
  features: [],
  isPublic: true,
};

export default function ProjectAdd() {
  const { portfolioCode } = useParams<{ portfolioCode: string }>();
  const navigate = useNavigate();

  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategory() {
      try {
        const found = await getCategoryDetail(portfolioCode!);
        setCategory(found);
      } catch (error) {
        console.error('카테고리 조회 실패:', error);
        setCategory(null);
      } finally {
        setLoading(false);
      }
    }
    if (portfolioCode) fetchCategory();
    else setLoading(false);
  }, [portfolioCode]);

  const handleSave = (
    data: Parameters<React.ComponentProps<typeof ProjectEditForm>['onSave']>[0]
  ) => {
    // TODO: API 연동하여 프로젝트 저장
    const projectData = {
      ...data,
      portfolioCode,
    };
    console.log('새 프로젝트 데이터:', projectData);
    navigate(`/portfolio/${portfolioCode}`);
  };

  const handleCancel = () => {
    navigate(`/portfolio/${portfolioCode}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">카테고리를 찾을 수 없습니다</h1>
          <Link to="/home" className="text-blue-600 hover:text-blue-800 underline">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link
        to={`/portfolio/${portfolioCode}`}
        className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-8"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {category.name}으로 돌아가기
      </Link>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="h-64 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <span className="text-white text-8xl font-bold opacity-30">+</span>
        </div>

        <div className="p-8">
          <ProjectEditForm
            project={{ ...emptyProject, categoryId: portfolioCode || '' }}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
}
