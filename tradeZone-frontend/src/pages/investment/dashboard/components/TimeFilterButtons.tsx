import { memo } from 'react';

type TimeFilter = '1M' | '1W' | '6M' | '1Y' | '5Y';

interface TimeFilterButtonsProps {
  selectedTimeFilter: TimeFilter;
  onFilterChange: (filter: TimeFilter) => void;
  isDarkMode: boolean;
}

const TimeFilterButtons = memo<TimeFilterButtonsProps>(({ selectedTimeFilter, onFilterChange, isDarkMode }) => {
  const filters: TimeFilter[] = ['1W', '1M', '6M', '1Y', '5Y'];

  return (
    <div className="mb-8">
      <div className="flex flex-wrap gap-2">
        {filters.map(filter => (
          <button
            key={filter}
            onClick={() => onFilterChange(filter)}
            className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
              selectedTimeFilter === filter
                ? isDarkMode
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/25'
                  : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25'
                : isDarkMode
                ? 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/70 border border-gray-700/50'
                : 'bg-white/70 text-gray-700 hover:bg-white/90 border border-gray-200/50'
            } backdrop-blur-sm`}
          >
            {filter}
          </button>
        ))}
      </div>
    </div>
  );
});

TimeFilterButtons.displayName = 'TimeFilterButtons';

export default TimeFilterButtons;
