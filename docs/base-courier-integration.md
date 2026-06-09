# Integracja Base Courier - Dokumentacja

## Przegląd

Integracja z Base Courier (dawniej BLPaczka) umożliwia automatyczne generowanie etykiet wysyłkowych i zwrotnych dla przesyłek InPost bezpośrednio z panelu administracyjnego.

## Funkcjonalności

### 1. Generowanie etykiet
- **Etykieta wysyłkowa** - przesyłka z Twojego paczkomatu do klienta
- **Etykieta zwrotna** - przesyłka od klienta z powrotem do Ciebie
- **PDF A4** - obie etykiety łączone na jednym arkuszu do wydruku

### 2. Wybór rozmiaru paczki
- **Mała** (18 × 35 × 60 cm) - gabaryt B InPost
- **Duża** (64 × 38 × 41 cm, 15kg) - gabaryt C InPost

### 3. Konfiguracja nadawcy
- Edytowalne dane nadawcy w `/office/settings/courier`
- Domyślne wartości przechowywane w `lib/courier/base-courier-config.ts`
- Dane zapisywane w tabeli `site_settings`

## Struktura plików

### Backend
```
lib/courier/
├── types.ts                      # TypeScript typy i interfejsy
├── base-courier-config.ts        # Konfiguracja API i dane nadawcy
├── base-courier-api.ts           # API client dla Base Courier
└── get-sender-config.ts          # Helper do pobierania konfiguracji

app/api/courier/
├── create-shipment/route.ts      # Tworzenie przesyłki wysyłkowej
├── create-return-label/route.ts  # Tworzenie etykiety zwrotnej
└── generate-labels-pdf/route.ts  # Łączenie etykiet w PDF
```

### Frontend
```
app/office/orders/[id]/_components/
└── courier-panel.tsx             # Panel generowania etykiet

app/office/settings/courier/
└── page.tsx                      # Strona ustawień kuriera
```

### Baza danych
```
supabase/migrations/
└── 20260609_add_courier_shipments.sql  # Tabela courier_shipments
```

## Baza danych

### Tabela `courier_shipments`

```sql
CREATE TABLE courier_shipments (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  shipment_type TEXT ('outbound' | 'return'),
  base_courier_number TEXT UNIQUE,
  tracking_number TEXT,
  operator_name TEXT DEFAULT 'INPOST',
  parcel_size TEXT ('small' | 'large'),
  destination_code TEXT,
  posting_code TEXT DEFAULT 'POZ118M',
  waybill_url TEXT,
  status TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  advised_at TIMESTAMPTZ
);
```

### Klucze w `site_settings`

```
courier_sender_first_name
courier_sender_last_name
courier_sender_phone
courier_sender_email
courier_sender_street
courier_sender_building
courier_sender_flat
courier_sender_post_code
courier_sender_city
courier_sender_posting_code
```

## Konfiguracja

### 1. Klucz API

Ustaw klucz API w zmiennej środowiskowej:

```env
BASE_COURIER_API_KEY=kziim7ie1nhwk3qw2l6ezc
```

Lub użyj domyślnego klucza z `lib/courier/base-courier-config.ts`.

### 2. Tryb sandbox

Domyślnie w development używany jest sandbox:

```typescript
useSandbox: process.env.NODE_ENV === 'development'
```

API URLs:
- **Production**: `https://api.bliskapaczka.pl/v2`
- **Sandbox**: `https://api.sandbox-bliskapaczka.pl/v2`

### 3. Dane nadawcy

Edytuj w panelu: `/office/settings/courier`

Domyślne wartości:
```typescript
{
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
}
```

## Użycie

### W panelu zamówienia

1. Otwórz szczegóły zamówienia `/office/orders/[id]`
2. W prawej kolumnie znajdziesz panel "Etykiety kurierskie InPost"
3. Wybierz rozmiar paczki (mała/duża)
4. Kliknij "Wygeneruj etykietę wysyłkową"
5. Kliknij "Wygeneruj etykietę zwrotną"
6. Kliknij "Pobierz etykiety PDF (A4)" - pobierze się plik z obiema etykietami

### Wymagania

- Zamówienie musi mieć wybrany paczkomat InPost (`inpost_point_id`)
- Klient musi mieć uzupełnione dane (imię, nazwisko, telefon, email)

## API Endpoints

### POST `/api/courier/create-shipment`

Tworzy przesyłkę wysyłkową (do klienta).

**Request:**
```json
{
  "orderId": "uuid",
  "parcelSize": "small" | "large"
}
```

**Response:**
```json
{
  "success": true,
  "shipment": {
    "id": "uuid",
    "number": "000000001P-000000001",
    "trackingNumber": "123456789",
    "status": "PROCESSING",
    "waybillUrl": "https://..."
  }
}
```

### POST `/api/courier/create-return-label`

Tworzy etykietę zwrotną (od klienta).

**Request/Response:** Identyczne jak `create-shipment`

### POST `/api/courier/generate-labels-pdf`

Łączy etykiety w jeden PDF.

**Request:**
```json
{
  "orderId": "uuid"
}
```

**Response:** PDF file (application/pdf)

## Przepływ danych

### Etykieta wysyłkowa
```
Nadawca:  Twoje dane → POZ118M
Odbiorca: Klient → inpost_point_id
```

### Etykieta zwrotna
```
Nadawca:  Klient → inpost_point_id
Odbiorca: Twoje dane → POZ118M
```

## Statusy przesyłek

- `SAVED` - Przesyłka zapisana, nie wysłana
- `PROCESSING` - W trakcie przetwarzania
- `READY_TO_SEND` - Gotowa do wysyłki
- `ERROR` - Błąd
- `CANCELED` - Anulowana

## Troubleshooting

### Błąd: "Missing customer data or InPost point"
- Sprawdź czy zamówienie ma wybrany paczkomat InPost
- Sprawdź czy klient ma uzupełnione dane kontaktowe

### Błąd: "No shipments found for this order"
- Najpierw wygeneruj etykietę wysyłkową lub zwrotną
- Dopiero potem pobieraj PDF

### Błąd API: 401 Unauthorized
- Sprawdź klucz API w zmiennej środowiskowej
- Upewnij się, że klucz jest aktywny w panelu Base Courier

### Błąd: "Failed to download waybill"
- URL etykiety może wygasnąć po pewnym czasie
- Wygeneruj etykietę ponownie

## Zależności

```json
{
  "pdf-lib": "^1.17.1"
}
```

Instalacja:
```bash
npm install pdf-lib
```

## Migracja bazy danych

Uruchom migrację w Supabase:

```bash
# Lokalnie
supabase migration up

# Lub w panelu Supabase SQL Editor
# Skopiuj zawartość supabase/migrations/20260609_add_courier_shipments.sql
```

## Bezpieczeństwo

- Klucz API przechowywany w zmiennych środowiskowych
- Wszystkie endpointy wymagają uwierzytelnienia (Supabase RLS)
- Dane nadawcy edytowalne tylko przez administratorów

## Przyszłe rozszerzenia

- [ ] Automatyczne śledzenie statusu przesyłki
- [ ] Webhook od Base Courier dla aktualizacji statusu
- [ ] Historia wszystkich przesyłek dla zamówienia
- [ ] Anulowanie przesyłki
- [ ] Zamówienie kuriera po odbiór
- [ ] Wsparcie dla innych kurierów (DPD, GLS)
