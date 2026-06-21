import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ArrowLeftIcon from '../components/svg/ArrowLeftIcon';
import type { PortfolioCategory } from '../types/category';
import type { Project } from '../types/project';
import { getPortfolioCategoryDetail, createProject } from '../utils/api';
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

  const [portfolio, setPortfolio] = useState<PortfolioCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPortfolio() {
      try {
        const found = await getPortfolioCategoryDetail(portfolioCode!);
        setPortfolio(found);
      } catch (error) {
        console.error('포트폴리오 조회 실패:', error);
        setPortfolio(null);
      } finally {
        setLoading(false);
      }
    }
    if (portfolioCode) fetchPortfolio();
    else setLoading(false);
  }, [portfolioCode]);

  const handleSave = async (
    data: Parameters<React.ComponentProps<typeof ProjectEditForm>['onSave']>[0]
  ) => {
    if (!portfolio) return;

    setError(null);

    try {
      const requestBody = {
        portfolio_code: portfolioCode!,
        code: data.code,
        title: data.title,
        summary: data.summary,
        thumbnail: data.thumbnailFileUuid ? { file_uuid: data.thumbnailFileUuid } : null,
        tags: data.tags
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        order: 0,
        is_public: data.isPublic,
        description: data.description,
        tech_stack: data.techStack
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        screenshots: data.screenshots,
        links: data.links,
        start_date: data.startDate,
        end_date: data.endDate,
        features: data.features
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      };

      await createProject(requestBody);
      navigate(`/portfolio/${portfolioCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '프로젝트 생성에 실패했습니다.');
    }
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

  if (!portfolio) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">포트폴리오를 찾을 수 없습니다</h1>
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
        <ArrowLeftIcon className="w-5 h-5 mr-2" />
        {portfolio.name}으로 돌아가기
      </Link>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="h-64 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <span className="text-white text-8xl font-bold opacity-30">+</span>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}
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
