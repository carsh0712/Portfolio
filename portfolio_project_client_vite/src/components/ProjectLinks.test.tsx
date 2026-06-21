import { describe, it, expect } from 'vitest';
import { render, screen } from '../test/utils';
import ProjectLinks from './ProjectLinks';
import type { ProjectLink } from '../types/project';

describe('ProjectLinks', () => {
  const mockLinks: ProjectLink[] = [
    {
      name: 'GitHub',
      url: 'https://github.com/test',
      backgroundColor: '#1F2937',
      textColor: '#FFFFFF',
      icon: 'github',
    },
    {
      name: 'Live Demo',
      url: 'https://demo.example.com',
      backgroundColor: '#2563EB',
      textColor: '#FFFFFF',
      icon: 'external-link',
    },
  ];

  it('링크들이 렌더링되어야 한다', () => {
    render(<ProjectLinks links={mockLinks} />);
    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('Live Demo')).toBeInTheDocument();
  });

  it('링크가 올바른 href를 가져야 한다', () => {
    render(<ProjectLinks links={mockLinks} />);
    const githubLink = screen.getByText('GitHub').closest('a');
    expect(githubLink).toHaveAttribute('href', 'https://github.com/test');
  });

  it('링크에 커스텀 배경색이 적용되어야 한다', () => {
    render(<ProjectLinks links={mockLinks} />);
    const githubLink = screen.getByText('GitHub').closest('a');
    expect(githubLink).toHaveStyle({ backgroundColor: '#1F2937', color: '#FFFFFF' });
  });

  it('빈 배열이면 아무것도 렌더링하지 않아야 한다', () => {
    const { container } = render(<ProjectLinks links={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('background_color 폴백이 동작해야 한다', () => {
    const links: ProjectLink[] = [
      { name: 'Test', url: 'https://test.com', background_color: '#FF0000', text_color: '#000' },
    ];
    render(<ProjectLinks links={links} />);
    const link = screen.getByText('Test').closest('a');
    expect(link).toHaveStyle({ backgroundColor: '#FF0000' });
  });
});
