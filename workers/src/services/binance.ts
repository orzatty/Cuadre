// ============================================
// Binance P2P USDT/VES Rate Fetcher
// ============================================

export interface BinanceP2PRate {
  buy: number | null;
  sell: number | null;
  average: number | null;
  fetched_at: string;
}

interface BinanceP2PAdv {
  price: string;
  surplusAmount: string;
  maxSingleTransAmount: string;
  minSingleTransAmount: string;
}

interface BinanceP2POrder {
  adv: BinanceP2PAdv;
}

interface BinanceP2PResponse {
  data: BinanceP2POrder[];
  success: boolean;
}

/**
 * Fetch USDT/VES P2P rates from Binance.
 * Gets both buy and sell rates and calculates an average.
 */
export async function fetchBinanceP2PRate(): Promise<BinanceP2PRate> {
  const result: BinanceP2PRate = {
    buy: null,
    sell: null,
    average: null,
    fetched_at: new Date().toISOString(),
  };

  try {
    // Fetch buy orders (people buying USDT with VES — this is the sell price for VES)
    const [buyPrice, sellPrice] = await Promise.all([
      fetchP2PPrice('BUY'),
      fetchP2PPrice('SELL'),
    ]);

    result.buy = buyPrice;
    result.sell = sellPrice;

    if (buyPrice !== null && sellPrice !== null) {
      result.average = Math.round(((buyPrice + sellPrice) / 2) * 100) / 100;
    } else if (buyPrice !== null) {
      result.average = buyPrice;
    } else if (sellPrice !== null) {
      result.average = sellPrice;
    }

    console.log(
      `Binance P2P rates: BUY=${result.buy}, SELL=${result.sell}, AVG=${result.average}`
    );
  } catch (error) {
    console.error('Error fetching Binance P2P rates:', error);
  }

  return result;
}

/**
 * Fetch the median price from Binance P2P for a given trade side.
 *
 * Uses the Binance P2P search API to get active advertisements.
 * We take the first page of results (top 10 by price) and compute
 * the median to filter out outliers.
 */
async function fetchP2PPrice(
  tradeType: 'BUY' | 'SELL'
): Promise<number | null> {
  try {
    const payload = {
      fiat: 'VES',
      page: 1,
      rows: 10,
      tradeType,
      asset: 'USDT',
      countries: [],
      proMerchantAds: false,
      shieldMerchantAds: false,
      publisherType: null,
      payTypes: [],
      classifies: ['mass', 'profession', 'fiat_trade'],
    };

    const response = await fetch(
      'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      console.error(`Binance P2P ${tradeType} fetch failed: ${response.status}`);
      return null;
    }

    const data = (await response.json()) as BinanceP2PResponse;

    if (!data.success || !data.data || data.data.length === 0) {
      console.warn(`No Binance P2P ${tradeType} orders found`);
      return null;
    }

    // Extract and sort prices
    const prices = data.data
      .map((order) => parseFloat(order.adv.price))
      .filter((price) => !isNaN(price) && price > 0)
      .sort((a, b) => a - b);

    if (prices.length === 0) {
      return null;
    }

    // Use median price to avoid outliers
    const midIndex = Math.floor(prices.length / 2);
    const median =
      prices.length % 2 === 0
        ? (prices[midIndex - 1] + prices[midIndex]) / 2
        : prices[midIndex];

    return Math.round(median * 100) / 100;
  } catch (error) {
    console.error(`Error fetching Binance P2P ${tradeType} price:`, error);
    return null;
  }
}

/**
 * Convenience: fetch just the average USDT/VES rate (for quick lookups).
 */
export async function fetchBinanceUsdtVes(): Promise<number | null> {
  const rates = await fetchBinanceP2PRate();
  return rates.average;
}
