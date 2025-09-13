import { memo } from 'react';
import PositionCard from './positionCard';

interface Position {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  entryPrice: number;
  currentPrice?: number;
  lots: number;
  investedAmount: number;
  platform: 'Delta Exchange' | 'Groww';
  leverage: number;
  timestamp: string;
}

interface PositionsGridProps {
  positions: Position[];
  isDarkMode: boolean;
}

const PositionsGrid = memo<PositionsGridProps>(({ positions, isDarkMode }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {positions.map((position) => (
        <PositionCard 
          key={position.id} 
          position={position} 
          isDarkMode={isDarkMode} 
        />
      ))}
    </div>
  );
});

PositionsGrid.displayName = 'PositionsGrid';

export default PositionsGrid;
