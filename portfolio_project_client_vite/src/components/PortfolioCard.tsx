import { Link } from 'react-router-dom';
import type { Portfolio } from '../types/portfolio';
import AuthImage from './AuthImage';
import PublicStatusBadge from './PublicStatusBadge';

interface PortfolioCardProps {
  portfolio: Portfolio;
}

export default function PortfolioCard({ portfolio }: PortfolioCardProps) {
  return (
    <Link
      to={`/portfolio/${portfolio.code}`}
      className="group block bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
    >
      <div className="aspect-video overflow-hidden">
        {portfolio.screenshot ? (
          <AuthImage
            fileUuid={portfolio.screenshot.file_uuid}
            alt={portfolio.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-4xl font-bold">{portfolio.name[0]}</span>
          </div>
        )}
      </div>
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
          {portfolio.name}
        </h2>
        <p className="text-gray-600 mb-3">{portfolio.description}</p>
        <PublicStatusBadge isPublic={portfolio.is_public} />
      </div>
    </Link>
  );
}
