-- Site Settings Table for Dynamic Configuration
-- Used for storing dynamic content like contract terms, policies, etc.

CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on key for faster lookups
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);

-- Insert default contract content
INSERT INTO site_settings (key, value, description) VALUES (
  'contract_content',
  '1. Najemca zobowiązuje się do używania sprzętu zgodnie z jego przeznaczeniem i instrukcją obsługi.

2. Najemca ponosi pełną odpowiedzialność za powierzony sprzęt w okresie najmu.

3. Najemca zobowiązuje się do zwrotu sprzętu w stanie niepogorszonym, z uwzględnieniem normalnego zużycia.

4. W przypadku uszkodzenia lub utraty sprzętu, Najemca zobowiązany jest do pokrycia kosztów naprawy lub wartości sprzętu.

5. Najemca nie może oddawać sprzętu w podnajem osobom trzecim.

6. Wynajmujący zapewnia sprawność techniczną sprzętu w momencie wydania.

7. Wynajmujący zapewnia wsparcie techniczne w razie problemów z konfiguracją.

8. Wynajmujący zobowiązuje się do zwrotu kaucji w terminie 48h od weryfikacji zwróconego sprzętu.

9. Wszelkie reklamacje dotyczące stanu technicznego sprzętu należy zgłaszać niezwłocznie na adres: wynajem@starkit.pl.

10. Umowa została zawarta w formie elektronicznej i jest wiążąca dla obu stron.

11. W sprawach nieuregulowanych niniejszą umową mają zastosowanie przepisy Kodeksu Cywilnego.

12. Ewentualne spory będą rozstrzygane przez sąd właściwy dla siedziby Wynajmującego.',
  'Treść regulaminu umowy najmu Starlink Mini'
) ON CONFLICT (key) DO NOTHING;

-- Grant permissions (adjust role name as needed)
-- GRANT SELECT ON site_settings TO authenticated;
-- GRANT ALL ON site_settings TO service_role;
