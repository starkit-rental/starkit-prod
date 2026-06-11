# Instrukcja uruchomienia migracji GlobKurier

## Problem
Brakuje kolumny `globkurier_order_hash` w tabeli `courier_shipments`.

## Rozwiązanie

### Opcja 1: Supabase Dashboard (ZALECANE)

1. Otwórz Supabase Dashboard: https://supabase.com/dashboard
2. Wybierz swój projekt
3. Przejdź do **SQL Editor**
4. Skopiuj i uruchom poniższy SQL:

```sql
-- Add globkurier_order_hash column for bulk label download
ALTER TABLE courier_shipments
  ADD COLUMN IF NOT EXISTS globkurier_order_hash TEXT;

-- Add index for faster hash lookups
CREATE INDEX IF NOT EXISTS idx_courier_shipments_globkurier_hash 
  ON courier_shipments(globkurier_order_hash);

-- Add comment
COMMENT ON COLUMN courier_shipments.globkurier_order_hash IS 'GlobKurier order hash for bulk label download';
```

5. Kliknij **Run** lub naciśnij `Ctrl+Enter`
6. Sprawdź czy migracja się powiodła (powinno być "Success")

### Opcja 2: Supabase CLI (jeśli masz skonfigurowane)

```bash
# Link do projektu (jeśli nie zrobione)
npx supabase link --project-ref your-project-ref

# Uruchom migrację
npx supabase db push
```

### Weryfikacja

Po uruchomieniu migracji, sprawdź czy kolumna została dodana:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'courier_shipments' 
  AND column_name = 'globkurier_order_hash';
```

Powinno zwrócić:
```
column_name              | data_type
-------------------------|----------
globkurier_order_hash    | text
```

## Po migracji

Odśwież stronę w przeglądarce i spróbuj ponownie utworzyć przesyłkę. Błąd powinien zniknąć.
