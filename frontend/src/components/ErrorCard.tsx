interface ErrorCardProps {
  error: string;
  onRetry?: () => void;
}

export default function ErrorCard({ error, onRetry }: ErrorCardProps) {
  return (
    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 text-center">
      <div className="text-4xl text-red-600 mb-2">⚠️</div>
      <p className="text-red-800 font-medium mb-4">{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Retry
        </button>
      )}
    </div>
  );
}