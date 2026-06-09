# 🚀 Deployment Checklist - Base Courier Integration

## ✅ Wykonane automatycznie

- [x] Kod został scommitowany do Git
- [x] Kod został wypushowany na GitHub (branch: main)
- [x] pdf-lib zainstalowany w package.json
- [x] 17 testów jednostkowych przechodzi

## 📋 Do wykonania RĘCZNIE

### 1. Sprawdź status deploymentu w Vercel

Jeśli masz skonfigurowany automatyczny deploy:

1. Otwórz [Vercel Dashboard](https://vercel.com/dashboard)
2. Znajdź projekt `starkit-prod`
3. Sprawdź czy deployment się rozpoczął automatycznie
4. Poczekaj na zakończenie (zazwyczaj 2-5 minut)

**Status deploymentu:**
- 🟡 Building - trwa budowanie
- 🟢 Ready - gotowe
- 🔴 Failed - błąd (sprawdź logi)

### 2. Uruchom migrację bazy danych w Supabase

**WAŻNE:** To musi być zrobione PRZED pierwszym użyciem funkcji kurierskich!

#### Opcja A: Przez Supabase Dashboard (zalecane)

1. Zaloguj się do [Supabase Dashboard](https://app.supabase.com)
2. Wybierz projekt `starkit-prod`
3. Przejdź do **SQL Editor**
4. Otwórz plik: `supabase/migrations/20260609_add_courier_shipments.sql`
5. Skopiuj całą zawartość
6. Wklej do SQL Editor
7. Kliknij **Run** (lub Ctrl+Enter)
8. Sprawdź czy nie ma błędów

#### Opcja B: Przez Supabase CLI (jeśli masz zainstalowane)

```bash
cd /Users/godekmaciej/starkit-system
supabase db push
```

#### Weryfikacja migracji:

Uruchom w SQL Editor:
```sql
-- Sprawdź czy tabela istnieje
SELECT * FROM courier_shipments LIMIT 1;

-- Sprawdź czy indeksy zostały utworzone
SELECT indexname FROM pg_indexes WHERE tablename = 'courier_shipments';
```

### 3. Sprawdź zmienne środowiskowe w Vercel

Upewnij się, że masz ustawione:

1. Przejdź do Vercel → Twój projekt → Settings → Environment Variables
2. Sprawdź czy istnieje: `BASE_COURIER_API_KEY`
3. Jeśli nie ma, dodaj:
   - **Name:** `BASE_COURIER_API_KEY`
   - **Value:** `kziim7ie1nhwk3qw2l6ezc`
   - **Environment:** Production, Preview, Development

4. Jeśli dodałeś nową zmienną, **REDEPLOY** projekt:
   - Deployments → ... (menu) → Redeploy

### 4. Skonfiguruj dane nadawcy w produkcji

Po deploymencie:

1. Otwórz produkcyjną stronę: `https://starkit.pl/office/settings/courier`
2. Zaloguj się jako admin
3. Uzupełnij dane nadawcy:
   - Imię: Maciej
   - Nazwisko: Godek
   - Telefon: 795097658
   - Email: starkit.rental@gmail.com
   - Ulica: Cumownicza
   - Nr budynku: 1a
   - Nr mieszkania: 2
   - Kod pocztowy: 60-480
   - Miasto: Poznań
   - Paczkomat: POZ118M
4. Kliknij **Zapisz zmiany**

### 5. Przetestuj integrację na produkcji

#### Test 1: Sprawdź czy panel się wyświetla
1. Otwórz zamówienie z wybranym paczkomat InPost
2. Przewiń do sekcji "Etykiety kurierskie InPost"
3. Sprawdź czy panel się ładuje bez błędów

#### Test 2: Wygeneruj testową etykietę
1. Wybierz rozmiar paczki
2. Kliknij "Wygeneruj etykietę wysyłkową"
3. Sprawdź modal - czy dane są poprawne
4. **NIE ZAZNACZAJ** ubezpieczenia ani soboty (pierwszy test)
5. Kliknij "Potwierdź i utwórz"
6. Sprawdź czy etykieta została utworzona

#### Test 3: Sprawdź w Base Courier
1. Zaloguj się do [Base Courier Panel](https://send.blpaczka.com)
2. Znajdź przesyłkę po numerze zamówienia (SK-2026-XXX)
3. Sprawdź czy dane są poprawne

#### Test 4: Pobierz PDF
1. Wygeneruj też etykietę zwrotną
2. Kliknij "Pobierz etykiety PDF (A4)"
3. Sprawdź czy PDF się pobiera i zawiera obie etykiety

### 6. Monitoring i logi

#### Sprawdź logi w Vercel:
1. Vercel Dashboard → Twój projekt → Logs
2. Filtruj po: `/api/courier`
3. Sprawdź czy nie ma błędów

#### Sprawdź logi w Supabase:
1. Supabase Dashboard → Logs → API
2. Sprawdź zapytania do `courier_shipments`

#### Sprawdź dane w bazie:
```sql
-- Ostatnie przesyłki
SELECT 
  id,
  order_id,
  shipment_type,
  base_courier_number,
  tracking_number,
  status,
  created_at
FROM courier_shipments
ORDER BY created_at DESC
LIMIT 10;
```

## 🔧 Rozwiązywanie problemów

### Problem: "Cannot find module 'pdf-lib'"

**Rozwiązanie:**
1. Sprawdź czy `pdf-lib` jest w `package.json`
2. W Vercel: Settings → General → Node.js Version (upewnij się że jest 18.x lub nowszy)
3. Redeploy projektu

### Problem: "Table courier_shipments does not exist"

**Rozwiązanie:**
1. Uruchom migrację w Supabase (krok 2)
2. Sprawdź czy migracja się wykonała poprawnie

### Problem: "401 Unauthorized" z Base Courier API

**Rozwiązanie:**
1. Sprawdź klucz API w Vercel Environment Variables
2. Sprawdź czy klucz jest aktywny w panelu Base Courier
3. Sprawdź czy używasz właściwego URL (production vs sandbox)

### Problem: Modal się nie otwiera

**Rozwiązanie:**
1. Sprawdź konsolę przeglądarki (F12)
2. Sprawdź czy dane klienta są dostępne
3. Sprawdź czy zamówienie ma `inpost_point_id`

## 📊 Checklist końcowy

Po wykonaniu wszystkich kroków:

- [ ] Deployment w Vercel zakończony sukcesem
- [ ] Migracja bazy danych wykonana
- [ ] Zmienne środowiskowe ustawione
- [ ] Dane nadawcy skonfigurowane
- [ ] Panel kurierski wyświetla się poprawnie
- [ ] Testowa etykieta wygenerowana
- [ ] Przesyłka widoczna w Base Courier
- [ ] PDF z etykietami pobiera się poprawnie
- [ ] Brak błędów w logach

## 🎉 Gotowe!

Jeśli wszystkie checkboxy są zaznaczone, integracja Base Courier jest w pełni wdrożona i gotowa do użycia w produkcji!

## 📞 Wsparcie

W razie problemów:
1. Sprawdź logi w Vercel i Supabase
2. Przeczytaj dokumentację: `docs/base-courier-integration.md`
3. Sprawdź instrukcję testowania: `docs/base-courier-manual-testing.md`
4. Skontaktuj się z supportem Base Courier: wsparcie@sendit.pl

---

**Data deploymentu:** 2026-06-09
**Wersja:** 1.0.0
**Commit:** feat: Base Courier integration with modal confirmation and shipment options
