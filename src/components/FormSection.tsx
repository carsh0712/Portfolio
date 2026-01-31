import type { ReactNode } from 'react';

interface FormSectionProps {
  title: string;
  description?: string;
  className?: string;
  children: ReactNode;
}

export default function FormSection({ title, description, className, children }: FormSectionProps) {
  return (
    <div className={className}>
      <h2 className="text-xl font-semibold text-gray-900 mb-1">{title}</h2>
      {description && <p className="mb-2 text-sm text-gray-500">{description}</p>}
      {children}
    </div>
  );
}
