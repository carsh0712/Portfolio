import type { ReactNode } from 'react';

interface PageCardProps {
  children: ReactNode;
  className?: string;
}

export default function PageCard({ children, className = '' }: PageCardProps) {
  return <div className={`bg-white rounded-xl shadow-lg p-8 ${className}`}>{children}</div>;
}
