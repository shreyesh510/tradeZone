import { memo } from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  isDarkMode: boolean;
  title?: string;
  hover?: boolean;
}

const Card = memo<CardProps>(({ children, className = '', isDarkMode, title, hover = false }) => {
  return (
    <div className={`p-6 rounded-2xl backdrop-blur-lg border ${
      isDarkMode 
        ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' 
        : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
    } ${hover ? 'hover:scale-105 transition-all duration-300' : ''} ${className}`}>
      {title && (
        <h2 className="text-2xl font-bold mb-6">{title}</h2>
      )}
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export default Card;
