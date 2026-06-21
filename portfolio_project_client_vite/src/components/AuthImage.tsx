import { useEffect, useState } from 'react';
import { fetchFileAsObjectUrl } from '../utils/api';

interface AuthImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  fileUuid: string;
}

export default function AuthImage({ fileUuid, alt, ...props }: AuthImageProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    let revoked = false;
    let url: string | null = null;
    fetchFileAsObjectUrl(fileUuid)
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
  }, [fileUuid]);

  if (!objectUrl) return null;

  return <img src={objectUrl} alt={alt} {...props} />;
}
