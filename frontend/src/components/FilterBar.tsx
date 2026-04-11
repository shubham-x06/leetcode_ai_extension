import { ChevronDown } from 'lucide-react';

interface FilterBarProps {
  difficulty: string[];
  search: string;
  tags: string[];
  onDifficultyChange: (difficulties: string[]) => void;
  onSearchChange: (search: string) => void;
  onTagsChange: (tags: string[]) => void;
  onClear: () => void;
}

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const COMMON_TAGS = ['Array', 'String', 'Linked-List', 'Tree', 'Graph', 'DP', 'Greedy', 'BFS', 'DFS', 'Hash-Map'];

export default function FilterBar({
  difficulty,
  search,
  tags,
  onDifficultyChange,
  onSearchChange,
  onTagsChange,
  onClear,
}: FilterBarProps) {
  const toggleDifficulty = (diff: string) => {
    const updated = difficulty.includes(diff)
      ? difficulty.filter((d) => d !== diff)
      : [...difficulty, diff];
    onDifficultyChange(updated);
  };

  const toggleTag = (tag: string) => {
    const updated = tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];
    onTagsChange(updated);
  };

  const activeCount = difficulty.length + tags.length + (search ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search problems..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
        />
      </div>

      {/* Difficulty Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
        <div className="flex gap-2 flex-wrap">
          {DIFFICULTIES.map((diff) => (
            <button
              key={diff}
              onClick={() => toggleDifficulty(diff)}
              className={`px-3 py-2 rounded-lg text-sm transition ${
                difficulty.includes(diff)
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      {/* Tag Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
        <div className="flex gap-2 flex-wrap">
          {COMMON_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1 rounded-full text-sm transition ${
                tags.includes(tag)
                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-600'
                  : 'bg-gray-100 text-gray-700 border border-gray-300 hover:border-gray-400'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Active Filters Display */}
      {activeCount > 0 && (
        <div className="flex items-center gap-2 pt-2 border-t">
          <span className="text-sm text-gray-600">{activeCount} filter(s) active</span>
          <button
            onClick={onClear}
            className="text-sm text-indigo-600 hover:underline"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
