import { Link } from 'react-router-dom';
import ArrowLeftIcon from './svg/ArrowLeftIcon';

interface BackLinkProps {
  to: string;
  label: string;
}

export default function BackLink({ to, label }: BackLinkProps) {
  return (
    <Link to={to} className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-8">
      <ArrowLeftIcon className="w-5 h-5 mr-2" />
      {label}
    </Link>
  );
}
