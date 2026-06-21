import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '../test/utils';
import Toast from './Toast';

describe('Toast', () => {
  it('메시지를 표시해야 한다', () => {
    render(<Toast message="파일 크기가 10MB를 초과합니다." onClose={() => {}} />);
    expect(screen.getByText('파일 크기가 10MB를 초과합니다.')).toBeInTheDocument();
  });

  it('닫기 버튼 클릭 시 onClose를 호출해야 한다', () => {
    const onClose = vi.fn();
    render(<Toast message="에러" onClose={onClose} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalled();
  });

  it('duration 후 자동으로 onClose를 호출해야 한다', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(<Toast message="에러" onClose={onClose} duration={2000} />);
    expect(onClose).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(onClose).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('error 타입일 때 빨간 배경을 가져야 한다', () => {
    render(<Toast message="에러" type="error" onClose={() => {}} />);
    const toast = screen.getByText('에러').closest('div');
    expect(toast?.className).toContain('bg-red-600');
  });
});
