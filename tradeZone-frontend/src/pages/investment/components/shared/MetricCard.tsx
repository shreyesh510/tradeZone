import { memo } from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  gradient: string;
  isDarkMode: boolean;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
}

const MetricCard = memo<MetricCardProps>(({ 
  title, 
  value, 
  icon, 
  gradient, 
  isDarkMode, 
  subtitle,
  trend = 'neutral'
}) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-400';
      case 'down': return 'text-red-400';
      default: return isDarkMode ? 'text-gray-300' : 'text-gray-700';
    }
  };

  return (
    <div className={`p-6 rounded-2xl backdrop-blur-lg border ${
      isDarkMode 
        ? 'bg-gray-800/30 border-gray-700/50 shadow-xl shadow-gray-900/20' 
        : 'bg-white/60 border-white/20 shadow-xl shadow-gray-900/10'
    } hover:scale-105 transition-all duration-300`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {title}
        </h3>
        <div className={`w-8 h-8 rounded-lg ${gradient} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <div className="space-y-1">
        <p className={`text-3xl font-bold ${getTrendColor()}`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        {subtitle && (
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
});

MetricCard.displayName = 'MetricCard';

export default MetricCard;
