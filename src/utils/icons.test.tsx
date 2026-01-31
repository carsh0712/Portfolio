import { describe, it, expect } from 'vitest';
import { render } from '../test/utils';
import { ICON_OPTIONS, renderIcon, renderIconByName } from './icons';

describe('icons', () => {
  describe('ICON_OPTIONS', () => {
    it('아이콘 옵션 목록이 존재해야 한다', () => {
      expect(ICON_OPTIONS.length).toBeGreaterThan(0);
    });

    it('각 아이콘에 name, label, path가 있어야 한다', () => {
      ICON_OPTIONS.forEach((icon) => {
        expect(icon.name).toBeTruthy();
        expect(icon.label).toBeTruthy();
        expect(icon.path).toBeTruthy();
      });
    });

    it('github 아이콘이 포함되어야 한다', () => {
      const github = ICON_OPTIONS.find((i) => i.name === 'github');
      expect(github).toBeDefined();
      expect(github?.fill).toBe(true);
    });
  });

  describe('renderIcon', () => {
    it('fill 아이콘을 올바르게 렌더링해야 한다', () => {
      const github = ICON_OPTIONS.find((i) => i.name === 'github')!;
      const { container } = render(renderIcon(github) as React.ReactElement);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg?.getAttribute('fill')).toBe('currentColor');
    });

    it('stroke 아이콘을 올바르게 렌더링해야 한다', () => {
      const check = ICON_OPTIONS.find((i) => i.name === 'check')!;
      const { container } = render(renderIcon(check) as React.ReactElement);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg?.getAttribute('fill')).toBe('none');
      expect(svg?.getAttribute('stroke')).toBe('currentColor');
    });

    it('커스텀 size가 적용되어야 한다', () => {
      const check = ICON_OPTIONS.find((i) => i.name === 'check')!;
      const { container } = render(renderIcon(check, 'w-8 h-8') as React.ReactElement);
      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('class')).toContain('w-8 h-8');
    });
  });

  describe('renderIconByName', () => {
    it('이름으로 아이콘을 렌더링해야 한다', () => {
      const result = renderIconByName('github');
      expect(result).not.toBeNull();
    });

    it('존재하지 않는 이름이면 null을 반환해야 한다', () => {
      const result = renderIconByName('nonexistent-icon');
      expect(result).toBeNull();
    });

    it('커스텀 className이 적용되어야 한다', () => {
      const element = renderIconByName('check', 'w-10 h-10');
      const { container } = render(element as React.ReactElement);
      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('class')).toContain('w-10 h-10');
    });
  });
});
