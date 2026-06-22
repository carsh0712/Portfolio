import { useEffect, useState } from 'react';
import { fetchFileAsObjectUrl, type FileVariant } from '../utils/api';

interface AuthImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  fileUuid: string;
  variant?: FileVariant;
}

export default function AuthImage({ fileUuid, variant = 'detail', alt, ...props }: AuthImageProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    let revoked = false;
    let url: string | null = null;
    fetchFileAsObjectUrl(fileUuid, variant)
      .then((u) => {
        if (revoked) {
          URL.revokeObjectURL(u);
        } else {
          url = u;
          setObjectUrl(u);
        }
      })
      .catch(() => {});
    return () => {
      revoked = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [fileUuid, variant]);

  if (!objectUrl) return null;

  return <img src={objectUrl} alt={alt} {...props} />;
}
