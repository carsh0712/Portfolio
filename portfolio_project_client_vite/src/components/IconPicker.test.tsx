import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../test/utils';
import IconPicker from './IconPicker';

describe('IconPicker', () => {
  const defaultProps = {
    label: '아이콘',
    value: '',
    onChange: vi.fn(),
  };

  it('레이블이 렌더링되어야 한다', () => {
    render(<IconPicker {...defaultProps} />);
    expect(screen.getByText('아이콘')).toBeInTheDocument();
  });

  it('아이콘이 선택되지 않으면 "아이콘 선택" 플레이스홀더가 표시되어야 한다', () => {
    render(<IconPicker {...defaultProps} />);
    expect(screen.getByText('아이콘 선택')).toBeInTheDocument();
  });

  it('아이콘이 선택되면 선택된 아이콘의 레이블이 표시되어야 한다', () => {
    render(<IconPicker {...defaultProps} value="github" />);
    expect(screen.getByText('GitHub')).toBeInTheDocument();
  });

  it('버튼 클릭 시 드롭다운이 열려야 한다', () => {
    render(<IconPicker {...defaultProps} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('선택 안함')).toBeInTheDocument();
  });

  it('아이콘 선택 시 onChange가 호출되어야 한다', () => {
    const onChange = vi.fn();
    render(<IconPicker {...defaultProps} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button'));
    // 드롭다운에서 GitHub 아이콘 선택
    const githubButtons = screen.getAllByText('GitHub');
    fireEvent.click(githubButtons[githubButtons.length - 1]);
    expect(onChange).toHaveBeenCalledWith('github');
  });

  it('"선택 안함" 클릭 시 빈 문자열로 onChange가 호출되어야 한다', () => {
    const onChange = vi.fn();
    render(<IconPicker {...defaultProps} value="github" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('선택 안함'));
    expect(onChange).toHaveBeenCalledWith('');
  });
});
