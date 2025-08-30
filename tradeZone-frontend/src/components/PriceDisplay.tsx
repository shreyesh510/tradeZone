import { memo, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { fetchDogecoinPrice } from '../redux/thunks/tradingview/priceThunks';

interface PriceDisplayProps {
  isDarkMode: boolean;
}

const PriceDisplay = memo(function PriceDisplay({ isDarkMode }: PriceDisplayProps) {
  const dispatch = useAppDispatch();
  const { price: currentPrice, change24h: priceChange, loading, error } = useAppSelector(
    (state) => state.price.dogecoin
  );

  // Fetch price on component mount and set up interval
  useEffect(() => {
    // Fetch immediately on mount
    dispatch(fetchDogecoinPrice());
    
    // Update price every 30 seconds
    const interval = setInterval(() => {
      dispatch(fetchDogecoinPrice());
    }, 30000);
    
    return () => clearInterval(interval);
  }, [dispatch]);

  const formatPrice = (price: number) => {
    return price < 1 ? price.toFixed(6) : price.toFixed(2);
  };

  const formatPriceChange = (change: number) => {
    return `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
  };

  return (
    <div className="text-right">
      {loading ? (
        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Loading...
        </div>
      ) : error ? (
        <div className={`text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
          Price unavailable
        </div>
      ) : currentPrice !== null ? (
        <>
          <div className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            ${formatPrice(currentPrice)}
          </div>
          {priceChange !== null && (
            <div className={`text-sm font-medium ${
              priceChange >= 0 
                ? 'text-green-400' 
                : 'text-red-400'
            }`}>
              {formatPriceChange(priceChange)}
            </div>
          )}
        </>
      ) : (
        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          No data
        </div>
      )}
    </div>
  );
});

export default PriceDisplay;
