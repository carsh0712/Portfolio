import type { KeyboardEvent } from 'react';

interface ProjectFilterBarProps {
  tagInput: string;
  selectedTags: string[];
  suggestions: string[];
  filteredCount: number;
  onTagInputChange: (value: string) => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onClearTags: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
}

export default function ProjectFilterBar({
  tagInput,
  selectedTags,
  suggestions,
  filteredCount,
  onTagInputChange,
  onAddTag,
  onRemoveTag,
  onClearTags,
  onKeyDown,
}: ProjectFilterBarProps) {
  return (
    <div className="mb-8">
      <div className="max-w-xl mx-auto">
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2 p-3 bg-white border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
            {selectedTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => onRemoveTag(tag)}
                  className="hover:text-blue-600"
                  aria-label={`${tag} 필터 제거`}
                >
                  ×
                </button>
              </span>
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={(event) => onTagInputChange(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder={selectedTags.length === 0 ? '태그를 입력하세요...' : ''}
              className="flex-1 min-w-[120px] outline-none bg-transparent text-gray-700 placeholder-gray-400"
            />
          </div>

          {suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
              {suggestions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onAddTag(tag)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedTags.length > 0 && (
          <div className="flex justify-between items-center mt-3">
            <p className="text-sm text-gray-600">{filteredCount}개 프로젝트</p>
            <button
              type="button"
              onClick={onClearTags}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              필터 초기화
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
