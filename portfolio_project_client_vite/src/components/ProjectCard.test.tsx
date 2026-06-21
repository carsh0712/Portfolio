import { describe, it, expect } from 'vitest';
import { render, screen } from '../test/utils';
import ProjectCard from './ProjectCard';
import type { Project } from '../types/project';

describe('ProjectCard', () => {
  const mockProject: Project = {
    id: '1',
    portfolioCode: 'web',
    code: 'test-project',
    title: 'Test Project',
    summary: 'This is a test project summary',
    description: 'Test description',
    techStack: ['React', 'TypeScript', 'Vite', 'Tailwind', 'Node.js'],
    tags: ['frontend', 'backend'],
    startDate: '2024-01-01',
    features: ['Feature 1', 'Feature 2'],
  };

  it('?꾨줈?앺듃 ?쒕ぉ???뚮뜑留곷릺?댁빞 ?쒕떎', () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('?꾨줈?앺듃 ?붿빟???뚮뜑留곷릺?댁빞 ?쒕떎', () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.getByText('This is a test project summary')).toBeInTheDocument();
  });

  it('湲곗닠 ?ㅽ깮??理쒕? 4媛쒓퉴吏 ?쒖떆?섏뼱???쒕떎', () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.getByText('#React')).toBeInTheDocument();
    expect(screen.getByText('#TypeScript')).toBeInTheDocument();
    expect(screen.getByText('#Vite')).toBeInTheDocument();
    expect(screen.getByText('#Tailwind')).toBeInTheDocument();
  });

  it('湲곗닠 ?ㅽ깮??4媛쒕? 珥덇낵?섎㈃ +N ?쒖떆媛 ?섑??섏빞 ?쒕떎', () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.getByText('+3')).toBeInTheDocument();
  });

  it('?꾨줈?앺듃 ?쒕ぉ??泥?湲?먭? ?쒖떆?섏뼱???쒕떎', () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('湲곕낯 留곹겕 寃쎈줈瑜?媛?몄빞 ?쒕떎', () => {
    render(<ProjectCard project={mockProject} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/portfolio/web/project/test-project');
  });

  it('而ㅼ뒪? linkPath媛 ?꾨떖?섎㈃ ?대떦 寃쎈줈瑜??ъ슜?댁빞 ?쒕떎', () => {
    render(<ProjectCard project={mockProject} linkPath="/custom/path" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/custom/path');
  });

  it('湲곗닠 ?ㅽ깮??4媛??댄븯????+N ?쒖떆媛 ?놁뼱???쒕떎', () => {
    const projectWithFewTechs: Project = {
      ...mockProject,
      techStack: ['React', 'TypeScript'],
    };
    render(<ProjectCard project={projectWithFewTechs} />);
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
  });

  it('isPublic이 true이면 공개 배지가 표시되어야 한다', () => {
    const publicProject: Project = { ...mockProject, isPublic: true };
    render(<ProjectCard project={publicProject} />);
    expect(screen.getByText('공개')).toBeInTheDocument();
  });

  it('isPublic이 false이면 비공개 배지가 표시되어야 한다', () => {
    const privateProject: Project = { ...mockProject, isPublic: false };
    render(<ProjectCard project={privateProject} />);
    expect(screen.getByText('비공개')).toBeInTheDocument();
  });

  it('isPublic이 undefined이면 배지가 표시되지 않아야 한다', () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.queryByText('공개')).not.toBeInTheDocument();
    expect(screen.queryByText('비공개')).not.toBeInTheDocument();
  });
});

