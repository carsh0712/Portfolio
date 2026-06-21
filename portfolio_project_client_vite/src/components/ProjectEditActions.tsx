interface ProjectEditActionsProps {
  onCancel: () => void;
  onSave: () => void;
  className?: string;
}

export default function ProjectEditActions({
  onCancel,
  onSave,
  className = '',
}: ProjectEditActionsProps) {
  return (
    <div className={`flex justify-end gap-2 ${className}`}>
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
      >
        취소
      </button>
      <button
        type="button"
        onClick={onSave}
        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        저장
      </button>
    </div>
  );
}
