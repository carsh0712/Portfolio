import AuthImage from './AuthImage';
import ImagePlaceholderIcon from './svg/ImagePlaceholderIcon';
import StarIcon from './svg/StarIcon';
import TrashIcon from './svg/TrashIcon';

interface ScreenshotCardProps {
  screenshot: { file_id: number; caption?: string };
  index: number;
  isThumbnail: boolean;
  onToggleThumbnail: () => void;
  onRemove: () => void;
  onFileChange: (file: File) => void;
  onCaptionChange: (caption: string) => void;
}

export default function ScreenshotCard({
  screenshot,
  index,
  isThumbnail,
  onToggleThumbnail,
  onRemove,
  onFileChange,
  onCaptionChange,
}: ScreenshotCardProps) {
  return (
    <div
      className={`bg-white rounded-xl shadow-md border-2 transition-all flex flex-col ${
        isThumbnail
          ? 'border-yellow-400 ring-2 ring-yellow-200'
          : 'border-gray-200 hover:border-blue-500'
      }`}
    >
      <div className="aspect-video bg-gray-100 rounded-t-xl overflow-hidden">
        {screenshot.file_id ? (
          <AuthImage
            fileId={screenshot.file_id}
            alt={screenshot.caption || `스크린샷 ${index + 1}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <ImagePlaceholderIcon />
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900">스크린샷 #{index + 1}</h4>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleThumbnail}
              className={`transition-colors ${
                isThumbnail
                  ? 'text-yellow-500 hover:text-yellow-600'
                  : 'text-gray-400 hover:text-yellow-500'
              }`}
              title={isThumbnail ? '대표 해제' : '대표 스크린샷으로 설정'}
            >
              <StarIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="text-red-600 hover:text-red-800 transition-colors"
              title="스크린샷 삭제"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">이미지 파일 *</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFileChange(file);
            }}
            className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">캡션 (선택)</label>
          <input
            type="text"
            value={screenshot.caption || ''}
            onChange={(e) => onCaptionChange(e.target.value)}
            placeholder="스크린샷 설명"
            className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
