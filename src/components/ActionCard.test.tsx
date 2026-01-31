import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../test/utils';
import ActionCard from './ActionCard';

describe('ActionCard', () => {
  const defaultProps = {
    icon: <span data-testid="test-icon">+</span>,
    title: 'Add Item',
    description: 'Click to add a new item',
    onClick: vi.fn(),
  };

  it('제목이 렌더링되어야 한다', () => {
    render(<ActionCard {...defaultProps} />);
    expect(screen.getByText('Add Item')).toBeInTheDocument();
  });

  it('설명이 렌더링되어야 한다', () => {
    render(<ActionCard {...defaultProps} />);
    expect(screen.getByText('Click to add a new item')).toBeInTheDocument();
  });

  it('아이콘이 렌더링되어야 한다', () => {
    render(<ActionCard {...defaultProps} />);
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('클릭 시 onClick 핸들러가 호출되어야 한다', () => {
    const onClick = vi.fn();
    render(<ActionCard {...defaultProps} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
