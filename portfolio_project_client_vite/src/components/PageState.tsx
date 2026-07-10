import { Link } from 'react-router-dom';

interface PageStateProps {
  title?: string;
  message: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  secondaryActionTo?: string;
  onSecondaryAction?: () => void;
  tone?: 'default' | 'error';
  loading?: boolean;
}

export default function PageState({
  title,
  message,
  actionLabel,
  actionTo,
  onAction,
  secondaryActionLabel,
  secondaryActionTo,
  onSecondaryAction,
  tone = 'default',
  loading = false,
}: PageStateProps) {
  const accentClass = tone === 'error' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700';
  const titleClass = tone === 'error' ? 'text-rose-700' : 'text-gray-900';
  const primaryActionClass =
    'inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700';
  const secondaryActionClass =
    'inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center">
        {loading && (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-5" />
        )}
        {!loading && (
          <div
            className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full ${accentClass}`}
            aria-hidden="true"
          >
            <span className="text-2xl font-bold">{tone === 'error' ? '!' : '?'}</span>
          </div>
        )}
        {title && <h1 className={`text-2xl font-bold mb-3 ${titleClass}`}>{title}</h1>}
        <p className="text-gray-600 leading-7 mb-7">{message}</p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          {actionLabel && actionTo && (
            <Link to={actionTo} className={primaryActionClass}>
              {actionLabel}
            </Link>
          )}
          {actionLabel && onAction && (
            <button type="button" onClick={onAction} className={primaryActionClass}>
              {actionLabel}
            </button>
          )}
          {secondaryActionLabel && secondaryActionTo && (
            <Link to={secondaryActionTo} className={secondaryActionClass}>
              {secondaryActionLabel}
            </Link>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <button type="button" onClick={onSecondaryAction} className={secondaryActionClass}>
              {secondaryActionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
