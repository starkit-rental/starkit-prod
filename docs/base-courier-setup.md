# Base Courier - Instrukcja instalacji i uruchomienia

## Krok 1: Instalacja zależności

Zainstaluj wymaganą bibliotekę `pdf-lib`:

```bash
npm install pdf-lib
# lub
yarn add pdf-lib
```

## Krok 2: Migracja bazy danych

Uruchom migrację w Supabase, aby utworzyć tabelę `courier_shipments`:

### Opcja A: Supabase CLI (lokalnie)
```bash
cd starkit-system
supabase migration up
```

### Opcja B: Supabase Dashboard
1. Zaloguj się do [Supabase Dashboard](https://app.supabase.com)
2. Wybierz projekt starkit-prod
3. Przejdź do **SQL Editor**
4. Skopiuj zawartość pliku `supabase/migrations/20260609_add_courier_shipments.sql`
5. Wklej i uruchom SQL

## Krok 3: Konfiguracja zmiennych środowiskowych

Dodaj klucz API Base Courier do `.env.local`:

```env
BASE_COURIER_API_KEY=kziim7ie1nhwk3qw2l6ezc
```

## Krok 4: Inicjalizacja danych nadawcy

### Opcja A: Przez panel administracyjny (zalecane)
1. Uruchom aplikację: `npm run dev`
2. Przejdź do `/office/settings/courier`
3. Uzupełnij dane nadawcy
4. Kliknij "Zapisz zmiany"

### Opcja B: Ręcznie w bazie danych

Wstaw domyślne dane do tabeli `site_settings`:

```sql
INSERT INTO site_settings (key, value) VALUES
  ('courier_sender_first_name', 'Maciej'),
  ('courier_sender_last_name', 'Godek'),
  ('courier_sender_phone', '795097658'),
  ('courier_sender_email', 'starkit.rental@gmail.com'),
  ('courier_sender_street', 'Cumownicza'),
  ('courier_sender_building', '1a'),
  ('courier_sender_flat', '2'),
  ('courier_sender_post_code', '60-480'),
  ('courier_sender_city', 'Poznań'),
  ('courier_sender_posting_code', 'POZ118M')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

## Krok 5: Testowanie

### Test w środowisku sandbox (development)

Aplikacja automatycznie używa sandbox API w trybie development.

1. Otwórz zamówienie z wybranym paczkomat InPost
2. Przewiń do sekcji "Etykiety kurierskie InPost"
3. Wybierz rozmiar paczki
4. Kliknij "Wygeneruj etykietę wysyłkową"
5. Kliknij "Wygeneruj etykietę zwrotną"
6. Kliknij "Pobierz etykiety PDF (A4)"

### Test w środowisku produkcyjnym

Przed uruchomieniem na produkcji:

1. Upewnij się, że masz aktywne konto Base Courier
2. Wygeneruj klucz API w [panelu Base Courier](https://send.blpaczka.com)
3. Ustaw `NODE_ENV=production`
4. Przetestuj na jednym zamówieniu

## Weryfikacja instalacji

### Sprawdź czy tabela została utworzona:

```sql
SELECT * FROM courier_shipments LIMIT 1;
```

### Sprawdź czy dane nadawcy są zapisane:

```sql
SELECT * FROM site_settings 
WHERE key LIKE 'courier_%';
```

### Sprawdź logi błędów:

W konsoli przeglądarki (F12) lub w logach serwera sprawdź czy nie ma błędów związanych z:
- `pdf-lib` - brak modułu
- Base Courier API - błędy autoryzacji
- Supabase - błędy zapisu do bazy

## Rozwiązywanie problemów

### Problem: `Cannot find module 'pdf-lib'`

**Rozwiązanie:**
```bash
# Usuń node_modules i package-lock.json
rm -rf node_modules package-lock.json

# Zainstaluj ponownie
npm install

# Zainstaluj pdf-lib
npm install pdf-lib
```

### Problem: Błąd migracji "relation already exists"

**Rozwiązanie:**
Tabela już istnieje. Możesz pominąć ten krok lub usunąć tabelę i uruchomić migrację ponownie:

```sql
DROP TABLE IF EXISTS courier_shipments CASCADE;
```

### Problem: 401 Unauthorized z Base Courier API

**Rozwiązanie:**
1. Sprawdź czy klucz API jest poprawny
2. Sprawdź czy klucz jest aktywny w panelu Base Courier
3. Sprawdź czy używasz właściwego URL (sandbox vs production)

### Problem: "No InPost point selected"

**Rozwiązanie:**
Zamówienie musi mieć wybrany paczkomat InPost. Sprawdź pole `inpost_point_id` w tabeli `orders`.

## Aktualizacja

Jeśli aktualizujesz istniejącą integrację:

1. Pobierz najnowszy kod
2. Uruchom nowe migracje: `supabase migration up`
3. Wyczyść cache: `rm -rf .next`
4. Zrestartuj serwer: `npm run dev`

## Wsparcie

W razie problemów:
1. Sprawdź logi w konsoli przeglądarki (F12)
2. Sprawdź logi serwera Next.js
3. Sprawdź dokumentację Base Courier: https://docs.bliskapaczka.pl/
4. Skontaktuj się z supportem Base Courier: wsparcie@sendit.pl
