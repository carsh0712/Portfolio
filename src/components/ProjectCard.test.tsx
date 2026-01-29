import { describe, it, expect } from 'vitest';
import { render, screen } from '../test/utils';
import ProjectCard from './ProjectCard';
import type { Project } from '../types/project';

describe('ProjectCard', () => {
  const mockProject: Project = {
    id: '1',
    categoryId: 'web',
    title: 'Test Project',
    summary: 'This is a test project summary',
    description: 'Test description',
    techStack: ['React', 'TypeScript', 'Vite', 'Tailwind', 'Node.js'],
    tags: ['frontend', 'backend'],
    startDate: '2024-01-01',
    features: ['Feature 1', 'Feature 2'],
  };

  it('프로젝트 제목이 렌더링되어야 한다', () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('프로젝트 요약이 렌더링되어야 한다', () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.getByText('This is a test project summary')).toBeInTheDocument();
  });

  it('기술 스택이 최대 4개까지 표시되어야 한다', () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.getByText('#React')).toBeInTheDocument();
    expect(screen.getByText('#TypeScript')).toBeInTheDocument();
    expect(screen.getByText('#Vite')).toBeInTheDocument();
    expect(screen.getByText('#Tailwind')).toBeInTheDocument();
  });

  it('기술 스택이 4개를 초과하면 +N 표시가 나타나야 한다', () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('프로젝트 제목의 첫 글자가 표시되어야 한다', () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('올바른 링크 경로를 가져야 한다', () => {
    render(<ProjectCard project={mockProject} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/category/web/project/1');
  });

  it('기술 스택이 4개 이하일 때 +N 표시가 없어야 한다', () => {
    const projectWithFewTechs: Project = {
      ...mockProject,
      techStack: ['React', 'TypeScript'],
    };
    render(<ProjectCard project={projectWithFewTechs} />);
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
  });
});
