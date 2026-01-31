import { describe, it, expect } from 'vitest';
import { render, screen } from '../test/utils';
import PublicStatusBadge from './PublicStatusBadge';

describe('PublicStatusBadge', () => {
  it('isPublic이 true이면 "공개"를 표시해야 한다', () => {
    render(<PublicStatusBadge isPublic={true} />);
    expect(screen.getByText('공개')).toBeInTheDocument();
  });

  it('isPublic이 false이면 "비공개"를 표시해야 한다', () => {
    render(<PublicStatusBadge isPublic={false} />);
    expect(screen.getByText('비공개')).toBeInTheDocument();
  });

  it('공개일 때 녹색 스타일이 적용되어야 한다', () => {
    render(<PublicStatusBadge isPublic={true} />);
    const badge = screen.getByText('공개');
    expect(badge.className).toContain('bg-green-100');
    expect(badge.className).toContain('text-green-700');
  });

  it('비공개일 때 회색 스타일이 적용되어야 한다', () => {
    render(<PublicStatusBadge isPublic={false} />);
    const badge = screen.getByText('비공개');
    expect(badge.className).toContain('bg-gray-100');
    expect(badge.className).toContain('text-gray-600');
  });
});
