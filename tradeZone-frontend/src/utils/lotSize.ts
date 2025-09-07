// Lot size (base asset units per lot) mapping per symbol
// These values are chosen to match platform sizing observed:
// - BTCUSD: 1 lot ≈ 0.003 BTC
// - ETHUSD: 1 lot ≈ 0.03 ETH
// Extend as needed for other symbols.

const LOT_SIZES: Record<string, number> = {
  BTCUSD: 0.001,  // Delta Exchange: 3 lots = 0.003 BTC, so 1 lot = 0.001 BTC
  ETHUSD: 0.01,   // Delta Exchange: 6 lots = 0.06 ETH, so 1 lot = 0.01 ETH
  AVAXUSD: 1,     // Delta Exchange: 8 lots = 8 AVAX, so 1 lot = 1 AVAX
  ALGOUSD: 1,     // Delta Exchange: 1 lot = 1 ALGO (spot-like sizing)
  FLOKIUSD: 1000000,  // Approximate lot size for FLOKI (meme coin with high supply)
  DOGEUSD: 1000,  // Approximate lot size for DOGE
  SOLUSD: 0.1,    // Approximate lot size for SOL
  ADAUSD: 100,    // Approximate lot size for ADA
};

export function getLotSize(symbol?: string): number {
  if (!symbol) return 0;
  return LOT_SIZES[symbol.toUpperCase()] ?? 0;
}

export function hasLotSize(symbol?: string): boolean {
  return getLotSize(symbol) > 0;
}
