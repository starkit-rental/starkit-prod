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

// Payment IDs
export const PAYMENT_IDS = {
  PREPAID: 2, // Przedpłata
  POSTPAID: 1, // Płatność po dostawie
};

// Country IDs
export const COUNTRY_IDS = {
  POLAND: 1,
};

// Popular carrier product IDs (to be fetched dynamically)
export const CARRIER_PRODUCTS = {
  INPOST_PACZKOMAT: 2000, // Example ID, fetch actual from API
};
