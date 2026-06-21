import { describe, it, expect } from 'vitest';
import { render } from '../../test/utils';
import PlusIcon from './PlusIcon';

describe('PlusIcon', () => {
  it('SVG 요소가 렌더링되어야 한다', () => {
    const { container: el } = render(<PlusIcon />);
    const svg = el.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('기본 className이 적용되어야 한다', () => {
    const { container: el } = render(<PlusIcon />);
    const svg = el.querySelector('svg');
    expect(svg?.getAttribute('class')).toContain('w-5 h-5');
  });

  it('커스텀 className이 적용되어야 한다', () => {
    const { container: el } = render(<PlusIcon className="w-8 h-8" />);
    const svg = el.querySelector('svg');
    expect(svg?.getAttribute('class')).toContain('w-8 h-8');
  });
});
