import type { ReactNode } from 'react';

interface ActionCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

export default function ActionCard({ icon, title, description, onClick }: ActionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group block bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 border-2 border-dashed border-gray-300 hover:border-blue-500"
    >
      <div className="aspect-video overflow-hidden flex items-center justify-center bg-gray-50 group-hover:bg-blue-50 transition-colors">
        {icon}
      </div>
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-500 mb-2 group-hover:text-blue-600 transition-colors">
          {title}
        </h2>
        <p className="text-gray-400">{description}</p>
      </div>
    </button>
  );
}
