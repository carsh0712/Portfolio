import { Link } from 'react-router-dom';

interface PageStateProps {
  title?: string;
  message: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
  tone?: 'default' | 'error';
  loading?: boolean;
}

export default function PageState({
  title,
  message,
  actionLabel,
  actionTo,
  onAction,
  tone = 'default',
  loading = false,
}: PageStateProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        {loading && (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        )}
        {title && (
          <h1
            className={`text-2xl font-bold mb-4 ${
              tone === 'error' ? 'text-red-600' : 'text-gray-900'
            }`}
          >
            {title}
          </h1>
        )}
        <p className="text-gray-600 mb-4">{message}</p>
        {actionLabel && actionTo && (
          <Link
            to={actionTo}
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {actionLabel}
          </Link>
        )}
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
