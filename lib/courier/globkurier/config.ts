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

// Default addon IDs (may vary by carrier)
export const ADDON_IDS = {
  INSURANCE: 1578, // Ubezpieczenie
  COD: 632, // Pobranie
  SATURDAY_DELIVERY: 1234, // Dostawa w sobotę (verify actual ID)
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
