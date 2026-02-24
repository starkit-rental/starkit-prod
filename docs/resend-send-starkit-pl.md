# Resend Email System - starkit.pl

## 🎯 Przegląd

System powiadomień email dla Starkit Office Pro wykorzystujący zweryfikowaną domenę `starkit.pl` i Resend API.

---

## 📁 Struktura Plików

### 1. SDK Client
**Plik**: `lib/resend.ts`

Singleton client Resend z lazy initialization:
```typescript
import { getResendClient } from "@/lib/resend";

const resend = getResendClient();
```

### 2. Szablon Email
**Plik**: `emails/RentalConfirmation.tsx`

Profesjonalny szablon potwierdzenia rezerwacji w stylu Starkit Office Pro:
- Minimalistyczny design (biel/czerń/szarość)
- Responsywny layout
- Sekcje: Numer zamówienia, Termin, Paczkomat, Kaucja
- React Email components

### 3. API Webhook Testowy
**Plik**: `app/api/webhooks/resend-test/route.ts`

Endpoint do testowania wysyłki emaili:
```bash
POST /api/webhooks/resend-test
```

### 4. Email Sending Functions
**Plik**: `lib/email.ts`

Zaktualizowane funkcje używające zweryfikowanej domeny `starkit.pl`:
- `sendCustomerConfirmationEmail()` - wysyła z `wynajem@starkit.pl`
- `sendAdminNotificationEmail()` - wysyła z `wynajem@starkit.pl`

---

## 🚀 Konfiguracja

### 1. Zmienne Środowiskowe

Dodaj do `.env.local`:

```bash
# Resend API - Get from https://resend.com/api-keys
RESEND_API_KEY=re_xxxxxxxxx

# Admin email for notifications
ADMIN_EMAIL=admin@starkit.pl

# Site URL for email links
NEXT_PUBLIC_SITE_URL=https://starkit.pl
```

### 2. Konfiguracja Domeny w Resend

1. Zaloguj się do [Resend Dashboard](https://resend.com/domains)
2. Dodaj domenę: `starkit.pl`
3. Skonfiguruj rekordy DNS:
   - **SPF**: `v=spf1 include:_spf.resend.com ~all`
   - **DKIM**: Skopiuj wartości z dashboardu
   - **DMARC**: `v=DMARC1; p=none; rua=mailto:dmarc@starkit.pl`
4. Zweryfikuj domenę

### 3. Tabela email_logs

Jeśli tabela nie istnieje, wykonaj w Supabase:

```sql
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text,
  recipient text NOT NULL,
  subject text NOT NULL,
  type text NOT NULL,
  status text NOT NULL,
  error_message text,
  resend_id text,
  sent_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_order_id ON email_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs(type);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at DESC);
```

---

## 🧪 Testowanie

### Test 1: Webhook Testowy

```bash
curl -X POST http://localhost:3000/api/webhooks/resend-test \
  -H "Content-Type: application/json" \
  -d '{
    "email": "starkit.rental@gmail.com",
    "orderNumber": "SK-2024-001",
    "customerName": "Jan Kowalski",
    "startDate": "15.03.2024",
    "endDate": "22.03.2024",
    "inpostPointId": "KRA010",
    "inpostPointAddress": "ul. Floriańska 1, 31-019 Kraków",
    "depositAmount": "500",
    "totalAmount": "1060"
  }'
```

Oczekiwana odpowiedź:
```json
{
  "success": true,
  "emailId": "abc123...",
  "recipient": "starkit.rental@gmail.com",
  "subject": "Potwierdzenie rezerwacji Starlink Mini - SK-2024-001",
  "logged": true,
  "message": "Test email sent successfully"
}
```

### Test 2: Sprawdź Logi

```sql
SELECT * FROM email_logs 
ORDER BY sent_at DESC 
LIMIT 10;
```

### Test 3: Weryfikacja w Resend Dashboard

1. Otwórz [Resend Emails](https://resend.com/emails)
2. Sprawdź status wysłanego emaila
3. Zobacz podgląd wiadomości

---

## 📧 Szablon Email - RentalConfirmation

### Parametry

```typescript
interface RentalConfirmationProps {
  orderNumber: string;        // "SK-2024-001"
  customerName: string;        // "Jan Kowalski"
  startDate: string;           // "15.03.2024"
  endDate: string;             // "22.03.2024"
  inpostPointId: string;       // "KRA010"
  inpostPointAddress: string;  // "ul. Floriańska 1, 31-019 Kraków"
  depositAmount: string;       // "500"
  totalAmount: string;         // "1060"
}
```

### Sekcje Emaila

1. **Logo** - Starkit logo (140x46px)
2. **Nagłówek** - "Potwierdzenie rezerwacji Starlink Mini"
3. **Powitanie** - "Dzień dobry {customerName}"
4. **Szczegóły zamówienia**:
   - Numer zamówienia
   - Wybrany termin (Od-Do)
5. **Punkt odbioru**:
   - Paczkomat InPost ID
   - Adres paczkomatu
   - Info o wysyłce i kodzie SMS
6. **Informacja o kaucji**:
   - Kwota kaucji
   - Termin zwrotu (48h)
   - Łączna kwota
7. **Stopka** - Kontakt i disclaimer

### Design System

- **Kolory**:
  - Główny tekst: `#0f172a` (slate-900)
  - Tekst pomocniczy: `#64748b` (slate-500)
  - Tło kart: `#f8fafc` (slate-50)
  - Karta kaucji: `#fefce8` (yellow-50)
  - Akcenty: `#fde047` (yellow-300)

- **Typografia**:
  - Font: System fonts (-apple-system, Roboto)
  - H1: 24px, weight 600
  - Body: 15px, line-height 1.6
  - Labels: 14px, color slate-500

---

## 🔄 Integracja z Checkout

Email jest automatycznie wysyłany po potwierdzeniu płatności w:

**Plik**: `app/api/confirm-checkout-session/route.ts`

```typescript
import { sendCustomerConfirmationEmail } from "@/lib/email";

// Po payment_status = "paid"
await sendCustomerConfirmationEmail({
  orderId: orderData.id,
  customerEmail: customer.email,
  customerName: customer.full_name,
  startDate: "15.03.2024",
  endDate: "22.03.2024",
  inpostCode: orderData.inpost_point_id,
  inpostAddress: orderData.inpost_point_address,
  rentalPrice: "560",
  deposit: "500",
  total: "1060",
});
```

---

## 📊 Logowanie

Każda próba wysyłki jest logowana w tabeli `email_logs`:

```typescript
{
  order_id: "uuid-or-test-id",
  recipient: "customer@email.com",
  subject: "Potwierdzenie rezerwacji...",
  type: "rental_confirmation",
  status: "sent" | "failed",
  error_message: null | "error details",
  resend_id: "abc123...",
  sent_at: "2024-02-24T13:00:00Z"
}
```

### Typy Emaili

- `customer_confirmation` - Legacy customer email
- `admin_notification` - Admin notification
- `rental_confirmation` - Nowy szablon RentalConfirmation

---

## 🎨 Customizacja

### Zmiana Stylu

Edytuj `emails/RentalConfirmation.tsx`:

```typescript
const main = {
  backgroundColor: "#ffffff",
  // Twoje zmiany...
};
```

### Zmiana Treści

Modyfikuj sekcje w komponencie:

```tsx
<Text style={paragraph}>
  Twoja nowa treść...
</Text>
```

### Podgląd Lokalny

```bash
npm run email:dev
```

Otwórz: `http://localhost:3000`

---

## 🐛 Troubleshooting

### Email nie wysyła się

1. Sprawdź `RESEND_API_KEY` w `.env.local`
2. Zweryfikuj domenę w Resend Dashboard
3. Sprawdź logi w `email_logs`:
   ```sql
   SELECT * FROM email_logs WHERE status = 'failed';
   ```

### Email trafia do spamu

1. Skonfiguruj SPF/DKIM/DMARC
2. Użyj zweryfikowanej domeny
3. Unikaj spamowych słów w temacie

### Błąd "Missing API key"

```bash
# Sprawdź czy klucz jest ustawiony
echo $RESEND_API_KEY

# Zrestartuj dev server
npm run dev
```

---

## 📚 Zasoby

- [Resend Documentation](https://resend.com/docs)
- [React Email Docs](https://react.email/docs)
- [Email Logs Schema](./email_logs_schema.md)
- [Resend Setup Guide](./resend-setup.md)

---

## ✅ Checklist Wdrożenia

- [ ] Utworzono konto Resend
- [ ] Dodano domenę `starkit.pl` (główna domena)
- [ ] Skonfigurowano DNS (SPF, DKIM, DMARC)
- [ ] Zweryfikowano domenę w Resend
- [ ] Używaj tylko `wynajem@starkit.pl` (nie subdomen)
- [ ] Dodano `RESEND_API_KEY` do `.env.local`
- [ ] Utworzono tabelę `email_logs` w Supabase
- [ ] Przetestowano webhook: `/api/webhooks/resend-test`
- [ ] Sprawdzono logi w bazie danych
- [ ] Zweryfikowano email w skrzynce odbiorczej
- [ ] Przetestowano flow checkout → email

---

**Adres nadawcy**: `Starkit Office Pro <wynajem@starkit.pl>`
**Reply-To**: `wynajem@starkit.pl`

**Status**: ✅ Gotowe do produkcji
