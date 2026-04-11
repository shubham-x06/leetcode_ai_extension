import { Bookmark, BookmarkCheck } from 'lucide-react';
import Button from './ui/Button';
import Card from './ui/Card';

interface ProblemCardProps {
  title: string;
  titleSlug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  acceptance?: number;
  frequency?: number;
  tags?: string[];
  isBookmarked?: boolean;
  onBookmark?: (titleSlug: string) => void;
  onSelect?: (titleSlug: string) => void;
}

export default function ProblemCard({
  title,
  titleSlug,
  difficulty,
  acceptance = 0,
  frequency = 0,
  tags = [],
  isBookmarked = false,
  onBookmark,
  onSelect,
}: ProblemCardProps) {
  const getDifficultyColor = (diff: string) => {
    const d = diff.toLowerCase();
    if (d === 'easy') return 'bg-green-100 text-green-800';
    if (d === 'medium') return 'bg-amber-100 text-amber-800';
    if (d === 'hard') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getDifficultyDot = (diff: string) => {
    const d = diff.toLowerCase();
    if (d === 'easy') return '🟢';
    if (d === 'medium') return '🟡';
    if (d === 'hard') return '🔴';
    return '⚪';
  };

  return (
    <Card className="hover:shadow-md transition">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span>{getDifficultyDot(difficulty)}</span>
            <button
              onClick={() => onSelect?.(titleSlug)}
              className="font-semibold text-indigo-600 hover:underline text-left"
            >
              {title}
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mb-2">
            {tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                +{tags.length - 3}
              </span>
            )}
          </div>

          <div className="flex gap-4 text-sm text-gray-600">
            {acceptance > 0 && <span>AC: {acceptance.toFixed(1)}%</span>}
            {frequency > 0 && <span>⭐ {frequency}</span>}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className={`px-3 py-1 rounded text-sm font-medium within-fit ${getDifficultyColor(difficulty)}`}>
            {difficulty}
          </span>
          <button
            onClick={() => onBookmark?.(titleSlug)}
            className="p-2 hover:bg-gray-100 rounded transition"
            title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
          >
            {isBookmarked ? (
              <BookmarkCheck className="w-5 h-5 text-indigo-600" />
            ) : (
              <Bookmark className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </div>
      </div>
    </Card>
  );
}
