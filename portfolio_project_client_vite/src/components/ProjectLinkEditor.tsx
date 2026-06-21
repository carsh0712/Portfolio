import type { ProjectLink } from '../types/project';
import ActionCard from './ActionCard';
import ColorPicker from './ColorPicker';
import IconPicker from './IconPicker';
import PlusIcon from './svg/PlusIcon';
import TrashIcon from './svg/TrashIcon';

interface ProjectLinkEditorProps {
  links: ProjectLink[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, field: keyof ProjectLink, value: string) => void;
}

export default function ProjectLinkEditor({
  links,
  onAdd,
  onRemove,
  onChange,
}: ProjectLinkEditorProps) {
  return (
    <section className="mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">링크 관리</h3>
      <div className="space-y-4">
        {links.map((link, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-md border-2 border-gray-200 hover:border-blue-500 transition-all"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h4 className="text-base font-semibold text-gray-900">링크 #{index + 1}</h4>
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                  title="링크 삭제"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
                    <input
                      type="text"
                      value={link.name}
                      onChange={(event) => onChange(index, 'name', event.target.value)}
                      placeholder="예: GitHub, Demo"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL *</label>
                    <input
                      type="url"
                      value={link.url}
                      onChange={(event) => onChange(index, 'url', event.target.value)}
                      placeholder="https://example.com"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ColorPicker
                    label="배경색 (선택)"
                    value={link.backgroundColor || ''}
                    defaultColor="#3B82F6"
                    placeholder="#3B82F6"
                    onChange={(value) => onChange(index, 'backgroundColor', value)}
                  />
                  <ColorPicker
                    label="텍스트색 (선택)"
                    value={link.textColor || ''}
                    defaultColor="#FFFFFF"
                    placeholder="#FFFFFF"
                    onChange={(value) => onChange(index, 'textColor', value)}
                  />
                  <IconPicker
                    label="아이콘 (선택)"
                    value={link.icon || ''}
                    onChange={(value) => onChange(index, 'icon', value)}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
        <ActionCard
          icon={
            <PlusIcon className="w-16 h-16 text-gray-400 group-hover:text-blue-500 transition-colors" />
          }
          title="링크 추가"
          description="새 링크를 추가합니다."
          onClick={onAdd}
        />
      </div>
    </section>
  );
}
