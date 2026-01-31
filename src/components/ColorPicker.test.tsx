import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../test/utils';
import ColorPicker from './ColorPicker';

describe('ColorPicker', () => {
  const defaultProps = {
    label: 'Background Color',
    value: '#FF0000',
    onChange: vi.fn(),
  };

  it('레이블이 렌더링되어야 한다', () => {
    render(<ColorPicker {...defaultProps} />);
    expect(screen.getByText('Background Color')).toBeInTheDocument();
  });

  it('텍스트 입력에 값이 표시되어야 한다', () => {
    render(<ColorPicker {...defaultProps} />);
    const textInput = screen.getByDisplayValue('#FF0000');
    expect(textInput).toBeInTheDocument();
  });

  it('텍스트 입력 변경 시 onChange가 호출되어야 한다', () => {
    const onChange = vi.fn();
    render(<ColorPicker {...defaultProps} onChange={onChange} />);
    const textInput = screen.getByDisplayValue('#FF0000');
    fireEvent.change(textInput, { target: { value: '#00FF00' } });
    expect(onChange).toHaveBeenCalledWith('#00FF00');
  });

  it('placeholder가 표시되어야 한다', () => {
    render(<ColorPicker {...defaultProps} value="" placeholder="#AABBCC" />);
    expect(screen.getByPlaceholderText('#AABBCC')).toBeInTheDocument();
  });

  it('기본 placeholder는 defaultColor 값이어야 한다', () => {
    render(<ColorPicker {...defaultProps} value="" />);
    expect(screen.getByPlaceholderText('#3B82F6')).toBeInTheDocument();
  });
});
