import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BackLink from '../components/BackLink';
import FormError from '../components/FormError';
import PageState from '../components/PageState';
import ProjectEditForm from '../components/ProjectEditForm';
import type { Portfolio } from '../types/portfolio';
import type { Project } from '../types/project';
import { createProject, getPortfolioDetail } from '../utils/api';

const emptyProject: Project = {
  id: '',
  portfolioCode: '',
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

  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPortfolio() {
      try {
        const found = await getPortfolioDetail(portfolioCode!);
        setPortfolio(found);
      } catch (err) {
        console.error('포트폴리오 조회 실패:', err);
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
      await createProject({
        portfolio_code: portfolioCode!,
        code: data.code,
        title: data.title,
        summary: data.summary,
        thumbnail: data.thumbnailFileUuid ? { file_uuid: data.thumbnailFileUuid } : null,
        tags: data.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        order: 0,
        is_public: data.isPublic,
        description: data.description,
        tech_stack: data.techStack
          .split(',')
          .map((tech) => tech.trim())
          .filter(Boolean),
        screenshots: data.screenshots,
        links: data.links,
        start_date: data.startDate,
        end_date: data.endDate,
        features: data.features
          .split('\n')
          .map((feature) => feature.trim())
          .filter(Boolean),
      });
      navigate(`/portfolio/${portfolioCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '프로젝트 생성에 실패했습니다.');
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
    <div className="max-w-4xl mx-auto px-4 py-12">
      <BackLink to={`/portfolio/${portfolioCode}`} label={`${portfolio.name}으로 돌아가기`} />

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="h-64 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <span className="text-white text-8xl font-bold opacity-30">+</span>
        </div>

        <div className="p-8">
          <FormError message={error} className="text-red-700" />
          <ProjectEditForm
            project={{ ...emptyProject, portfolioCode: portfolioCode || '' }}
            onSave={handleSave}
            onCancel={() => navigate(`/portfolio/${portfolioCode}`)}
          />
        </div>
      </div>
    </div>
  );
}
