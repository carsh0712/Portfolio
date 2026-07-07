interface ClipboardIconProps {
  className?: string;
}

export default function ClipboardIcon({ className = 'w-5 h-5' }: ClipboardIconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5h6m-7 4h8m-8 4h8m-8 4h5m-8 4h10a2 2 0 002-2V7.5A2.5 2.5 0 0014.5 5h-1A1.5 1.5 0 0012 3.5h0A1.5 1.5 0 0010.5 5h-1A2.5 2.5 0 007 7.5V19a2 2 0 002 2z"
      />
    </svg>
  );
}
