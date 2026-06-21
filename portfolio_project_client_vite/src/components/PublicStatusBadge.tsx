interface PublicStatusBadgeProps {
  isPublic: boolean;
}

export default function PublicStatusBadge({ isPublic }: PublicStatusBadgeProps) {
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
        isPublic ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
      }`}
    >
      {isPublic ? '공개' : '비공개'}
    </span>
  );
}
