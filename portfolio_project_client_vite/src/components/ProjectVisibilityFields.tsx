import type { ChangeEvent } from 'react';

interface ProjectVisibilityFieldsProps {
  startDate: string;
  endDate: string;
  isPublic: boolean;
  onDateChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onTogglePublic: () => void;
}

export default function ProjectVisibilityFields({
  startDate,
  endDate,
  isPublic,
  onDateChange,
  onTogglePublic,
}: ProjectVisibilityFieldsProps) {
  return (
    <section className="mt-8 pt-8 border-t border-gray-200">
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
          <input
            type="date"
            name="startDate"
            value={startDate}
            onChange={onDateChange}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
          <input
            type="date"
            name="endDate"
            value={endDate}
            onChange={onDateChange}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      <div className="flex items-center gap-3 mt-4">
        <label className="text-sm font-medium text-gray-700">공개 여부</label>
        <button
          type="button"
          onClick={onTogglePublic}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isPublic ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isPublic ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <span className="text-sm text-gray-500">{isPublic ? '공개' : '비공개'}</span>
      </div>
    </section>
  );
}
