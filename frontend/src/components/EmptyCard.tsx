interface EmptyCardProps {
  icon?: string;
  title: string;
  message: string;
}

export default function EmptyCard({ icon = '📭', title, message }: EmptyCardProps) {
  return (
    <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-8 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
      <p className="text-gray-600">{message}</p>
    </div>
  );
}