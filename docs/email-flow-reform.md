# Email Flow Reform - Two-Stage Communication System

## 🎯 Przegląd

Kompleksowa reforma systemu komunikacji B2B z nowym brandingiem, dwuetapowym przepływem emaili oraz dynamiczną umową z Supabase.

---

## 📧 Nowy Branding

**Nadawca**: `Starkit - wynajem Starlink <wynajem@starkit.pl>`  
**Reply-To**: `wynajem@starkit.pl`  
**Logo**: Absolutne URL z `baseUrl` (localhost lub production)

---

## 🔄 Dwuetapowy Przepływ Email

### Etap 1: ORDER RECEIVED (Natychmiast po płatności)

**Szablon**: `emails/OrderReceived.tsx`  
**Funkcja**: `sendOrderReceivedEmail()`  
**Typ w logach**: `order_received`

**Treść**:
- "Otrzymaliśmy Twoją rezerwację [ID]"
- "Weryfikujemy dostępność i potwierdzimy wynajem w kolejnej wiadomości"
- Podsumowanie: numer zamówienia, daty, łączna kwota
- **Bez załącznika PDF**

**Parametry**:
```typescript
{
  orderId: string;
  customerEmail: string;
  customerName: string;
  startDate: string;
  endDate: string;
  totalAmount: string;
}
```

### Etap 2: ORDER CONFIRMED (Po zmianie statusu na 'confirmed')

**Szablon**: `emails/OrderConfirmed.tsx`  
**Funkcja**: `sendOrderConfirmedEmail()`  
**Typ w logach**: `order_confirmed`

**Treść**:
- "Twoja rezerwacja została potwierdzona!"
- Szczegóły wynajmu (daty, liczba dni)
- Punkt odbioru InPost (ID + adres)
- Podsumowanie finansowe (najem + kaucja)
- Informacja o zwrocie kaucji (48h)
- **Z załącznikiem PDF umowy**

**Parametry**:
```typescript
{
  orderId: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  companyName?: string;
  nip?: string;
  startDate: string;
  endDate: string;
  inpostPointId: string;
  inpostPointAddress: string;
  rentalPrice: string;
  deposit: string;
  totalAmount: string;
}
```

---

## 📄 Dynamiczna Umowa PDF

### Tabela Supabase: `site_settings`

**Schema**:
```sql
CREATE TABLE site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Rekord**: `contract_content`
- Zawiera pełną treść regulaminu
- Pobierany dynamicznie przy generowaniu PDF
- Można edytować bez zmiany kodu

### Szablon PDF: `lib/pdf/ContractTemplate.tsx`

**Nowe props**:
- `contractContent: string` - dynamiczna treść regulaminu z DB
- `rentalDays?: number` - wyliczona liczba dni najmu

**Sekcje**:
- §1 Strony umowy (Wynajmujący: `wynajem@starkit.pl`)
- §2 Przedmiot najmu
- §3 Okres najmu (z liczbą dni)
- §4 Wynagrodzenie i kaucja (realne kwoty z zamówienia)
- §5 Regulamin wynajmu (dynamiczna treść z DB)

---

## 🔧 Implementacja

### 1. Pliki Email

**Utworzone**:
- `emails/OrderReceived.tsx` - Email bez PDF
- `emails/OrderConfirmed.tsx` - Email z PDF

**Zaktualizowane**:
- `lib/email.tsx` - Dodano nowe funkcje i helper `getEmailBaseUrl()`
- `lib/pdf/ContractTemplate.tsx` - Dynamiczna treść regulaminu

### 2. API Routes

**Zaktualizowane**:
- `app/api/confirm-checkout-session/route.ts` - Wysyła `OrderReceived` po płatności

**Utworzone**:
- `app/api/test-email/route.ts` - Endpoint testowy dla obu typów

### 3. Typy Email Logs

**Zaktualizowane typy**:
```typescript
type: "customer_confirmation" | "admin_notification" | "order_received" | "order_confirmed"
```

### 4. Helpers

**Dodane**:
- `getEmailBaseUrl()` - Zwraca URL dla logo (localhost lub production)
- `calculateRentalDays()` - Wylicza liczbę dni najmu

---

## 🧪 Testowanie

### Metoda 1: Bash Script

```bash
chmod +x scripts/test-email-flow.sh

# Test ORDER RECEIVED (bez PDF)
./scripts/test-email-flow.sh your-email@gmail.com received

# Test ORDER CONFIRMED (z PDF)
./scripts/test-email-flow.sh your-email@gmail.com confirmed
```

### Metoda 2: cURL

**ORDER RECEIVED**:
```bash
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "received",
    "email": "test@example.com",
    "orderNumber": "SK-2024-001",
    "customerName": "Jan Kowalski",
    "startDate": "15.03.2024",
    "endDate": "22.03.2024",
    "totalAmount": "1060"
  }'
```

**ORDER CONFIRMED**:
```bash
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "confirmed",
    "email": "test@example.com",
    "orderNumber": "SK-2024-001",
    "customerName": "Jan Kowalski",
    "customerPhone": "+48 123 456 789",
    "startDate": "15.03.2024",
    "endDate": "22.03.2024",
    "inpostPointId": "KRA010",
    "inpostPointAddress": "ul. Floriańska 1, 31-019 Kraków",
    "rentalPrice": "560",
    "deposit": "500",
    "totalAmount": "1060"
  }'
```

---

## 📊 Dane Finansowe

Wszystkie kwoty pobierane z rzeczywistego zamówienia:
- `total_rental_price` - Opłata za najem (grosze → PLN)
- `total_deposit` - Kaucja zwrotna (grosze → PLN)
- Łączna kwota = najem + kaucja
- Liczba dni = automatycznie wyliczana z dat

---

## 🗄️ Baza Danych

### Wymagane tabele:

1. **site_settings** - Dynamiczna konfiguracja
   ```sql
   -- Zobacz: docs/site_settings_schema.sql
   ```

2. **email_logs** - Logowanie wysyłek
   ```sql
   -- Zaktualizowane typy: order_received, order_confirmed
   ```

---

## ✅ Checklist Wdrożenia

### Konfiguracja
- [x] Zaktualizowano branding na "Starkit - wynajem Starlink"
- [x] Dodano `getEmailBaseUrl()` dla logo
- [x] Utworzono tabelę `site_settings` w Supabase
- [x] Dodano rekord `contract_content` z regulaminem

### Email Templates
- [x] Utworzono `OrderReceived.tsx` (bez PDF)
- [x] Utworzono `OrderConfirmed.tsx` (z PDF)
- [x] Zaktualizowano `ContractTemplate.tsx` (dynamiczna treść)

### Funkcje Email
- [x] Dodano `sendOrderReceivedEmail()`
- [x] Dodano `sendOrderConfirmedEmail()`
- [x] Zaktualizowano typy w `email_logs`

### API Routes
- [x] Zaktualizowano `confirm-checkout-session` (wysyła OrderReceived)
- [x] Utworzono `/api/test-email` (endpoint testowy)

### Testy
- [ ] Uruchomiono SQL schema dla `site_settings`
- [ ] Przetestowano ORDER RECEIVED email
- [ ] Przetestowano ORDER CONFIRMED email
- [ ] Zweryfikowano PDF w załączniku
- [ ] Sprawdzono logi w `email_logs`

---

## 🚀 Następne Kroki

1. **Wykonaj SQL**:
   ```bash
   # W Supabase SQL Editor
   cat docs/site_settings_schema.sql
   # Skopiuj i wykonaj
   ```

2. **Test ORDER RECEIVED**:
   ```bash
   ./scripts/test-email-flow.sh your-email@gmail.com received
   ```

3. **Test ORDER CONFIRMED**:
   ```bash
   ./scripts/test-email-flow.sh your-email@gmail.com confirmed
   ```

4. **Weryfikacja**:
   - Sprawdź skrzynkę odbiorczą
   - Otwórz PDF (tylko w ORDER CONFIRMED)
   - Zweryfikuj polskie znaki
   - Sprawdź logo (absolutny URL)

5. **Integracja**:
   - Dodaj trigger/webhook do wysyłki ORDER CONFIRMED
   - Lub wywołaj ręcznie z panelu admina przy zmianie statusu

---

## 📝 Notatki

- **Logo**: Upewnij się że `/public/logo.png` istnieje
- **Polskie znaki**: UTF-8 w PDF i emailach
- **TypeScript**: Wszystkie typy poprawne (0 errors)
- **Supabase**: Tabela `site_settings` musi istnieć przed testem ORDER CONFIRMED
- **Reply-To**: Klienci odpowiadają na `wynajem@starkit.pl`

---

**Status**: ✅ Gotowe do testowania  
**Ostatnia aktualizacja**: 24.02.2026  
**Wersja**: 2.0 (Two-Stage Flow)
