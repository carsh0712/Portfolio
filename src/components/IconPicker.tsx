import { useState, useRef, useEffect } from 'react';
import { ICON_OPTIONS, renderIcon } from '../utils/icons';

interface IconPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export default function IconPicker({ label, value, onChange }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedIcon = ICON_OPTIONS.find((icon) => icon.name === value);

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-left"
      >
        {selectedIcon ? (
          <>
            <span className="text-gray-700">{renderIcon(selectedIcon)}</span>
            <span className="text-gray-700">{selectedIcon.label}</span>
          </>
        ) : (
          <span className="text-gray-400">아이콘 선택</span>
        )}
        <svg
          className={`w-4 h-4 ml-auto text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {/* 선택 해제 */}
          <button
            type="button"
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:bg-gray-100"
          >
            선택 안함
          </button>
          {ICON_OPTIONS.map((icon) => (
            <button
              key={icon.name}
              type="button"
              onClick={() => {
                onChange(icon.name);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-blue-50 ${
                value === icon.name ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
              }`}
            >
              {renderIcon(icon)}
              <span>{icon.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
