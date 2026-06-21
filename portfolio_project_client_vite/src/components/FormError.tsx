interface FormErrorProps {
  message?: string | null;
  className?: string;
}

export default function FormError({ message, className = '' }: FormErrorProps) {
  if (!message) return null;

  return (
    <div className={`p-4 mb-6 bg-red-50 border border-red-200 rounded-lg ${className}`}>
      <p className="text-red-600 text-sm">{message}</p>
    </div>
  );
}
