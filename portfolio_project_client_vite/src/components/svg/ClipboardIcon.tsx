import { Copy } from 'lucide-react';

interface ClipboardIconProps {
  className?: string;
}

export default function ClipboardIcon({ className = 'w-5 h-5' }: ClipboardIconProps) {
  return <Copy className={className} aria-hidden="true" strokeWidth={2} />;
}
