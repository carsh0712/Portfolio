interface FormActionsProps {
  cancelLabel?: string;
  submitLabel: string;
  submittingLabel?: string;
  isSubmitting?: boolean;
  onCancel: () => void;
}

export default function FormActions({
  cancelLabel = '취소',
  submitLabel,
  submittingLabel,
  isSubmitting = false,
  onCancel,
}: FormActionsProps) {
  return (
    <div className="flex gap-4 pt-4">
      <button
        type="button"
        onClick={onCancel}
        disabled={isSubmitting}
        className="flex-1 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {cancelLabel}
      </button>
      <button
        type="submit"
        disabled={isSubmitting}
        className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
      >
        {isSubmitting && submittingLabel ? submittingLabel : submitLabel}
      </button>
    </div>
  );
}
