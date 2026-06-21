import { useEffect, useState } from 'react';
import ImagePlaceholderIcon from './svg/ImagePlaceholderIcon';
import { fetchFileAsObjectUrl } from '../utils/api';

interface ImagePreviewCardProps {
  fileUuid: string;
  alt?: string;
  onRemove: () => void;
}

export default function ImagePreviewCard({
  fileUuid,
  alt = '미리보기',
  onRemove,
}: ImagePreviewCardProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let revoke: string | null = null;
    fetchFileAsObjectUrl(fileUuid)
      .then((url) => {
        revoke = url;
        setObjectUrl(url);
      })
      .catch(() => setImageError(true));
    return () => {
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [fileUuid]);

  return (
    <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 hover:border-blue-500 transition-all inline-block">
      <div className="aspect-video bg-gray-100 rounded-t-xl overflow-hidden w-48">
        {objectUrl && !imageError ? (
          <img
            src={objectUrl}
            alt={alt}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
            <ImagePlaceholderIcon />
            {imageError && <span className="text-xs mt-1">불러오기 실패</span>}
          </div>
        )}
      </div>
      <div className="p-2 flex justify-end">
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-red-600 hover:text-red-800 transition-colors"
        >
          삭제
        </button>
      </div>
    </div>
  );
}
