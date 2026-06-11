// GlobKurier API configuration

import type { GlobKurierEnvironment } from './types';

const GLOBKURIER_URLS: Record<GlobKurierEnvironment, string> = {
  production: 'https://api.globkurier.pl/v1',
  test: 'https://test.api.globkurier.pl/v1',
};

export function getApiUrl(environment: GlobKurierEnvironment = 'test'): string {
  return GLOBKURIER_URLS[environment];
}

export function getEnvironment(): GlobKurierEnvironment {
  return process.env.NODE_ENV === 'production' ? 'production' : 'test';
}

// Note: Addon IDs vary by carrier and should be fetched dynamically via GET /products/{productId}/addons
// For bestPrice endpoint, use addon categories instead (e.g., INSURANCE, CASH_ON_DELIVERY)
// Legacy addon IDs kept for reference only - DO NOT USE directly
export const ADDON_IDS = {
  INSURANCE: 1578, // Example - varies by carrier
  COD: 632, // Example - varies by carrier
  SATURDAY_DELIVERY: 1234, // Example - varies by carrier
};

// Payment IDs (from GET /order/payments)
export const PAYMENT_IDS = {
  ONLINE: 2, // Płatność online (default)
  BANK_TRANSFER: 1, // Przelew bankowy
  DEFERRED: 4, // Faktura zbiorcza (odroczony termin płatności) - wymaga umowy
  PREPAID: 9, // Konto pre-paid (faktura zbiorcza) - wymaga doładowania salda
};

// Country IDs
export const COUNTRY_IDS = {
  POLAND: 1,
};

// Popular carrier product IDs (to be fetched dynamically)
export const CARRIER_PRODUCTS = {
  INPOST_PACZKOMAT: 2000, // Example ID, fetch actual from API
};
