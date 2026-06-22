import type { ReactNode } from 'react';
import type { Screenshot } from '../types/project';
import ArrowLeftIcon from './svg/ArrowLeftIcon';
import type { FileVariant } from '../utils/api';

interface ProjectImageLightboxProps {
  images: Screenshot[];
  selectedIndex: number | null;
  renderImage: (fileUuid: string, alt: string, className: string, variant?: FileVariant) => ReactNode;
  onSelect: (index: number | null) => void;
}

export default function ProjectImageLightbox({
  images,
  selectedIndex,
  renderImage,
  onSelect,
}: ProjectImageLightboxProps) {
  const selectedImage = selectedIndex !== null ? images[selectedIndex] : null;
  if (!selectedImage || selectedIndex === null) return null;

  const canGoPrev = selectedIndex > 0;
  const canGoNext = selectedIndex < images.length - 1;

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={() => onSelect(null)}
    >
      {canGoPrev && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSelect(selectedIndex - 1);
          }}
          className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-3 md:p-2 text-white hover:text-gray-300 bg-black/80 rounded-full hover:bg-black/90 transition-colors z-10 shadow-lg"
        >
          <ArrowLeftIcon className="w-6 h-6 md:w-8 md:h-8" />
        </button>
      )}

      {canGoNext && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSelect(selectedIndex + 1);
          }}
          className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-3 md:p-2 text-white hover:text-gray-300 bg-black/80 rounded-full hover:bg-black/90 transition-colors z-10 shadow-lg"
        >
          <span className="text-4xl leading-none">›</span>
        </button>
      )}

      <div className="relative max-w-5xl max-h-[90vh]">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="absolute -top-10 right-0 text-white hover:text-gray-300"
        >
          <span className="text-4xl leading-none">×</span>
        </button>
        <div onClick={(event) => event.stopPropagation()}>
          {renderImage(
            selectedImage.file_uuid,
            selectedImage.caption || '스크린샷',
            'max-w-full max-h-[85vh] object-contain rounded-lg',
            'detail'
          )}
        </div>
        {selectedImage.caption && (
          <p className="text-white text-center mt-4">
            {selectedImage.caption}
            <span className="ml-2 text-gray-400">
              ({selectedIndex + 1} / {images.length})
            </span>
          </p>
        )}
        {!selectedImage.caption && (
          <p className="text-gray-400 text-center mt-4">
            {selectedIndex + 1} / {images.length}
          </p>
        )}
      </div>
    </div>
  );
}
