import React from 'react';

interface ProgressBarProps {
  value: number;
  onChange: (value: number) => void;
  options: number[];
  label?: string;
  required?: boolean;
  className?: string;
  isDarkMode?: boolean;
  disabled?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  onChange,
  options,
  label,
  required = false,
  className = '',
  isDarkMode = false,
  disabled = false,
}) => {
  const currentIndex = options.indexOf(value);
  const progress = currentIndex >= 0 ? (currentIndex / (options.length - 1)) * 100 : 0;

  return (
    <div className={className}>
      {label && (
        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {/* Progress Bar Container */}
      <div className="relative">
        {/* Background Track */}
        <div className={`w-full h-3 rounded-full ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
          {/* Progress Fill */}
          <div 
            className={`h-3 rounded-full transition-all duration-300 ${
              isDarkMode 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                : 'bg-gradient-to-r from-purple-400 to-pink-400'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Clickable Points */}
        <div className="absolute top-0 left-0 w-full h-3 flex justify-between items-center">
          {options.map((option, index) => (
            <button
              key={option}
              type="button"
              onClick={() => !disabled && onChange(option)}
              disabled={disabled}
              className={`w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                value === option
                  ? isDarkMode
                    ? 'bg-purple-500 border-purple-300 shadow-lg shadow-purple-500/50'
                    : 'bg-purple-500 border-purple-200 shadow-lg shadow-purple-500/50'
                  : isDarkMode
                  ? 'bg-gray-700 border-gray-500 hover:border-purple-400'
                  : 'bg-white border-gray-300 hover:border-purple-400'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span className={`text-xs font-bold ${
                value === option ? 'text-white' : isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {option}X
              </span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Current Value Display */}
      <div className="mt-2 text-center">
        <span className={`text-lg font-bold ${
          isDarkMode ? 'text-purple-400' : 'text-purple-600'
        }`}>
          {value}X Leverage
        </span>
      </div>
    </div>
  );
};

export default ProgressBar;
