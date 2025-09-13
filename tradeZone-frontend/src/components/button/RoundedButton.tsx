import React from 'react';

interface RoundedButtonProps {
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'purple';
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  isDarkMode?: boolean;
  isActive?: boolean;
  icon?: React.ReactNode;
}

const RoundedButton: React.FC<RoundedButtonProps> = ({
  onClick,
  variant = 'primary',
  children,
  className = '',
  disabled = false,
  isDarkMode = false,
  isActive = false,
  icon
}) => {
  const getVariantClasses = () => {
    if (isActive && variant === 'primary') {
      return isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700';
    }

    switch (variant) {
      case 'primary':
        return 'bg-blue-600 text-white hover:bg-blue-700';
      case 'secondary':
        return isDarkMode 
          ? 'bg-gray-700 hover:bg-gray-600 text-white' 
          : 'bg-gray-200 hover:bg-gray-300 text-gray-700';
      case 'danger':
        return 'bg-red-600 text-white hover:bg-red-700';
      case 'purple':
        return 'bg-purple-600 hover:bg-purple-700 text-white';
      default:
        return 'bg-blue-600 text-white hover:bg-blue-700';
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-6 py-3 rounded-lg font-medium transition-colors ${getVariantClasses()} ${className} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {icon ? (
        <div className="flex items-center space-x-2">
          {icon}
          <span>{children}</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default RoundedButton;