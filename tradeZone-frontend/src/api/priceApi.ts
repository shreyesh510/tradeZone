// API service for fetching cryptocurrency prices
export interface PriceData {
  price: number;
  change24h: number;
}

export interface CoinGeckoResponse {
  dogecoin: {
    usd: number;
    usd_24h_change: number;
  };
}

class PriceApiService {
  private readonly baseUrl = 'https://api.coingecko.com/api/v3';

  async fetchDogecoinPrice(): Promise<PriceData> {
    try {
      const response = await fetch(
        `${this.baseUrl}/simple/price?ids=dogecoin&vs_currencies=usd&include_24hr_change=true`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: CoinGeckoResponse = await response.json();

      if (!data.dogecoin) {
        throw new Error('Dogecoin data not found in response');
      }

      return {
        price: data.dogecoin.usd,
        change24h: data.dogecoin.usd_24h_change,
      };
    } catch (error) {
      console.error('Error fetching Dogecoin price:', error);
      throw error;
    }
  }

  // Method to fetch multiple cryptocurrencies (for future use)
  async fetchMultiplePrices(coinIds: string[]): Promise<Record<string, PriceData>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd&include_24hr_change=true`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const result: Record<string, PriceData> = {};

      for (const coinId of coinIds) {
        if (data[coinId]) {
          result[coinId] = {
            price: data[coinId].usd,
            change24h: data[coinId].usd_24h_change,
          };
        }
      }

      return result;
    } catch (error) {
      console.error('Error fetching multiple prices:', error);
      throw error;
    }
  }
}

export const priceApiService = new PriceApiService();
