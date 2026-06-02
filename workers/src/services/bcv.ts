// ============================================
// BCV (Banco Central de Venezuela) Rate Scraper
// ============================================

export interface BcvRates {
  usd: number | null;
  eur: number | null;
  fetched_at: string;
}

/**
 * Fetch official exchange rates from the BCV website.
 * Parses the HTML to extract USD and EUR rates.
 *
 * The BCV website displays rates in divs with specific IDs:
 *   - #dolar: USD/VES rate
 *   - #euro:  EUR/VES rate
 *
 * The rate value is inside a <strong> tag with format like "36,71920000"
 * (Venezuelan locale uses comma as decimal separator).
 */
export async function fetchBcvRates(): Promise<BcvRates> {
  const result: BcvRates = {
    usd: null,
    eur: null,
    fetched_at: new Date().toISOString(),
  };

  try {
    const response = await fetch('https://www.bcv.org.ve/', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-VE,es;q=0.9,en;q=0.5',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.error(`BCV fetch failed with status: ${response.status}`);
      return result;
    }

    const html = await response.text();

    // Extract USD rate
    result.usd = extractBcvRate(html, 'dolar');

    // Extract EUR rate
    result.eur = extractBcvRate(html, 'euro');

    console.log(`BCV rates fetched: USD=${result.usd}, EUR=${result.eur}`);
  } catch (error) {
    console.error('Error fetching BCV rates:', error);
  }

  return result;
}

/**
 * Extract a specific rate from BCV HTML.
 *
 * The BCV page structure has patterns like:
 *   <div id="dolar" ...>
 *     ...
 *     <strong>36,71920000</strong>
 *     ...
 *   </div>
 *
 * We also try alternative patterns since the BCV page layout can change.
 */
function extractBcvRate(html: string, currencyId: string): number | null {
  try {
    // Pattern 1: Look for the div with the specific ID, then find the <strong> inside
    // The BCV page uses: <div id="dolar"> ... <strong>XX,XXXXXXXX</strong> ...
    const divPattern = new RegExp(
      `id="${currencyId}"[^>]*>[\\s\\S]*?<strong>\\s*([\\d.,]+)\\s*</strong>`,
      'i'
    );
    let match = html.match(divPattern);

    if (match && match[1]) {
      return parseBcvNumber(match[1]);
    }

    // Pattern 2: Look for class-based selectors
    // Sometimes the rate is in: <div class="...dolar..."> <strong>XX,XX</strong>
    const classPattern = new RegExp(
      `class="[^"]*${currencyId}[^"]*"[^>]*>[\\s\\S]*?<strong>\\s*([\\d.,]+)\\s*</strong>`,
      'i'
    );
    match = html.match(classPattern);

    if (match && match[1]) {
      return parseBcvNumber(match[1]);
    }

    // Pattern 3: Look for the rate near the currency name text
    const nameMap: Record<string, string> = {
      dolar: 'D[óo]lar',
      euro: 'Euro',
    };
    const namePattern = nameMap[currencyId] || currencyId;
    const textPattern = new RegExp(
      `${namePattern}[\\s\\S]{0,200}<strong>\\s*([\\d.,]+)\\s*</strong>`,
      'i'
    );
    match = html.match(textPattern);

    if (match && match[1]) {
      return parseBcvNumber(match[1]);
    }

    // Pattern 4: Broader search - look for rate-value or similar class
    const broadPattern = new RegExp(
      `${currencyId}[\\s\\S]{0,500}(\\d{1,3}[,.]\\d{2,8})`,
      'i'
    );
    match = html.match(broadPattern);

    if (match && match[1]) {
      return parseBcvNumber(match[1]);
    }

    console.warn(`Could not extract BCV rate for: ${currencyId}`);
    return null;
  } catch (error) {
    console.error(`Error parsing BCV rate for ${currencyId}:`, error);
    return null;
  }
}

/**
 * Parse a BCV number string (Venezuelan format: "36,71920000") to a float.
 * Handles both "36,71" and "36.71" formats.
 */
function parseBcvNumber(raw: string): number | null {
  try {
    // Remove any spaces
    let cleaned = raw.trim();

    // If the number has both dots and commas, determine the format:
    // "1.234,56" (European/Venezuelan) or "1,234.56" (US)
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');

    if (lastComma > lastDot) {
      // Venezuelan format: dots are thousands separators, comma is decimal
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (lastDot > lastComma) {
      // US format or no comma: remove commas (thousands separators)
      cleaned = cleaned.replace(/,/g, '');
    } else {
      // Only one type of separator - assume comma is decimal
      cleaned = cleaned.replace(',', '.');
    }

    const value = parseFloat(cleaned);

    if (isNaN(value) || value <= 0) {
      return null;
    }

    // BCV rates are typically between 1 and 200 for USD/EUR at current times
    // If rate seems unreasonable (> 10000 or < 0.01), it might be parsed wrong
    if (value > 100000 || value < 0.001) {
      console.warn(`BCV rate seems unreasonable: ${value} from "${raw}"`);
      return null;
    }

    return Math.round(value * 100) / 100; // Round to 2 decimal places
  } catch {
    return null;
  }
}
