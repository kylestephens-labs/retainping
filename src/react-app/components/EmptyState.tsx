import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  buttonText: string;
  onButtonClick: () => void;
  gradient?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  subtitle,
  buttonText,
  onButtonClick,
  gradient = "from-purple-100 to-pink-100"
}: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="max-w-md mx-auto">
        <div className={`w-24 h-24 bg-gradient-to-br ${gradient} rounded-full flex items-center justify-center mx-auto mb-6`}>
          <Icon className="w-12 h-12 text-purple-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
        <p className="text-gray-600 mb-8">{subtitle}</p>
        <button
          onClick={onButtonClick}
          className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-shadow"
        >
          <span>{buttonText}</span>
        </button>
      </div>
    </div>
  );
}
