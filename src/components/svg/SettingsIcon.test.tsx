import { describe, it, expect } from 'vitest';
import { render } from '../../test/utils';
import SettingsIcon from './SettingsIcon';

describe('SettingsIcon', () => {
  it('SVG 요소가 렌더링되어야 한다', () => {
    const { container: el } = render(<SettingsIcon />);
    expect(el.querySelector('svg')).toBeInTheDocument();
  });

  it('기본 className이 적용되어야 한다', () => {
    const { container: el } = render(<SettingsIcon />);
    expect(el.querySelector('svg')?.getAttribute('class')).toContain('w-5 h-5');
  });

  it('커스텀 className이 적용되어야 한다', () => {
    const { container: el } = render(<SettingsIcon className="w-6 h-6" />);
    expect(el.querySelector('svg')?.getAttribute('class')).toContain('w-6 h-6');
  });
});
