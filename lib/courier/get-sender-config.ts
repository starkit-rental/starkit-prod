import { createSupabaseServerClient } from '@/lib/supabase/server';
import { DEFAULT_SENDER_CONFIG, COURIER_SETTINGS_KEYS } from './base-courier-config';
import type { SenderConfig } from './types';

/**
 * Get sender configuration from site_settings or use defaults
 */
export async function getSenderConfig(): Promise<SenderConfig> {
  const supabase = await createSupabaseServerClient();

  const { data: settings } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', Object.values(COURIER_SETTINGS_KEYS));

  if (!settings || settings.length === 0) {
    return DEFAULT_SENDER_CONFIG;
  }

  const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

  return {
    firstName: settingsMap.get(COURIER_SETTINGS_KEYS.SENDER_FIRST_NAME) || DEFAULT_SENDER_CONFIG.firstName,
    lastName: settingsMap.get(COURIER_SETTINGS_KEYS.SENDER_LAST_NAME) || DEFAULT_SENDER_CONFIG.lastName,
    phoneNumber: settingsMap.get(COURIER_SETTINGS_KEYS.SENDER_PHONE) || DEFAULT_SENDER_CONFIG.phoneNumber,
    email: settingsMap.get(COURIER_SETTINGS_KEYS.SENDER_EMAIL) || DEFAULT_SENDER_CONFIG.email,
    street: settingsMap.get(COURIER_SETTINGS_KEYS.SENDER_STREET) || DEFAULT_SENDER_CONFIG.street,
    buildingNumber: settingsMap.get(COURIER_SETTINGS_KEYS.SENDER_BUILDING) || DEFAULT_SENDER_CONFIG.buildingNumber,
    flatNumber: settingsMap.get(COURIER_SETTINGS_KEYS.SENDER_FLAT) || DEFAULT_SENDER_CONFIG.flatNumber,
    postCode: settingsMap.get(COURIER_SETTINGS_KEYS.SENDER_POST_CODE) || DEFAULT_SENDER_CONFIG.postCode,
    city: settingsMap.get(COURIER_SETTINGS_KEYS.SENDER_CITY) || DEFAULT_SENDER_CONFIG.city,
    postingCode: settingsMap.get(COURIER_SETTINGS_KEYS.SENDER_POSTING_CODE) || DEFAULT_SENDER_CONFIG.postingCode,
  };
}
