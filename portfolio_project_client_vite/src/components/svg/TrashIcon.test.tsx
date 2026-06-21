import { describe, it, expect } from 'vitest';
import { render } from '../../test/utils';
import TrashIcon from './TrashIcon';

describe('TrashIcon', () => {
  it('SVG 요소가 렌더링되어야 한다', () => {
    const { container: el } = render(<TrashIcon />);
    expect(el.querySelector('svg')).toBeInTheDocument();
  });

  it('기본 className이 적용되어야 한다', () => {
    const { container: el } = render(<TrashIcon />);
    expect(el.querySelector('svg')?.getAttribute('class')).toContain('w-5 h-5');
  });

  it('커스텀 className이 적용되어야 한다', () => {
    const { container: el } = render(<TrashIcon className="w-10 h-10" />);
    expect(el.querySelector('svg')?.getAttribute('class')).toContain('w-10 h-10');
  });
});
