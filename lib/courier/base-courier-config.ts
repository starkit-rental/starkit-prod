import { SenderConfig } from './types';

// Base Courier API Configuration
export const BASE_COURIER_CONFIG = {
  apiKey: process.env.BASE_COURIER_API_KEY || 'kziim7ie1nhwk3qw2l6ezc',
  apiUrl: 'https://api.bliskapaczka.pl/v2',
  sandboxUrl: 'https://api.sandbox-bliskapaczka.pl/v2',
  useSandbox: process.env.NODE_ENV === 'development',
} as const;

// Default sender configuration (stored in site_settings, fallback values)
export const DEFAULT_SENDER_CONFIG: SenderConfig = {
  firstName: 'Maciej',
  lastName: 'Godek',
  phoneNumber: '795097658',
  email: 'starkit.rental@gmail.com',
  street: 'Cumownicza',
  buildingNumber: '1a',
  flatNumber: '2',
  postCode: '60-480',
  city: 'Poznań',
  postingCode: 'POZ118M',
};

// Site settings keys for courier configuration
export const COURIER_SETTINGS_KEYS = {
  SENDER_FIRST_NAME: 'courier_sender_first_name',
  SENDER_LAST_NAME: 'courier_sender_last_name',
  SENDER_PHONE: 'courier_sender_phone',
  SENDER_EMAIL: 'courier_sender_email',
  SENDER_STREET: 'courier_sender_street',
  SENDER_BUILDING: 'courier_sender_building',
  SENDER_FLAT: 'courier_sender_flat',
  SENDER_POST_CODE: 'courier_sender_post_code',
  SENDER_CITY: 'courier_sender_city',
  SENDER_POSTING_CODE: 'courier_sender_posting_code',
} as const;

export function getApiUrl(): string {
  return BASE_COURIER_CONFIG.useSandbox
    ? BASE_COURIER_CONFIG.sandboxUrl
    : BASE_COURIER_CONFIG.apiUrl;
}

export function getApiKey(): string {
  return BASE_COURIER_CONFIG.apiKey;
}
