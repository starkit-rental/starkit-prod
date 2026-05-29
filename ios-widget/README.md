# StarKit iOS Widget + Aplikacja

Widget i aplikacja pokazująca aktywne i nadchodzące zamówienia z systemu StarKit.

## Struktura plików

```
ios-widget/
├── OrdersWidget/              ← Widget Extension (target: OrdersWidget)
│   ├── OrdersWidget.swift     # Definicja widgetu + previews
│   ├── Provider.swift         # TimelineProvider – pobieranie danych
│   ├── Models.swift           # Modele danych      ← dodać do OBU targetów
│   ├── NetworkService.swift   # Fetch z API        ← dodać do OBU targetów
│   ├── Config.swift           # URL, deep linki    ← dodać do OBU targetów
│   └── WidgetViews.swift      # Widoki widgetu
│
└── StarKitApp/                ← Główna aplikacja (target: StarKitWidget)
    ├── StarKitApp.swift       # @main, URL handler, AppDelegate (push)
    ├── ContentView.swift      # Dashboard zamówień z pull-to-refresh
    ├── OrdersViewModel.swift  # @MainActor ViewModel
    └── PushManager.swift      # APNs – rejestracja i obsługa powiadomień
```

## Instalacja w Xcode

### 1. Nowy projekt

1. Xcode → File → New → Project → iOS → App
2. Nazwa: `StarKitWidget`, Bundle ID: `pl.starkit.widget`
3. Swift + SwiftUI

### 2. Dodaj Widget Extension

1. File → New → Target → Widget Extension
2. Nazwa: `OrdersWidget`
3. **Odznacz** "Include Configuration Intent"

### 3. Dodaj pliki

**Do targetu `OrdersWidget`** (z folderu `OrdersWidget/`):
- OrdersWidget.swift, Provider.swift, WidgetViews.swift

**Do targetu `StarKitWidget` (główna app)** (z folderu `StarKitApp/`):
- StarKitApp.swift, ContentView.swift, OrdersViewModel.swift, PushManager.swift

**Do OBU targetów** (`StarKitWidget` + `OrdersWidget`):
- Models.swift, NetworkService.swift, Config.swift, **SeenOrdersStore.swift**

W Xcode: zaznacz plik → File Inspector (prawy panel) → Target Membership → zaznacz oba.

### 3b. App Groups (wymagane dla „Oznacz jako widziane")

Aby zamówienia oznaczone jako widziane w aplikacji znikały też z widgetu, oba targety muszą dzielić wspólny `UserDefaults` przez App Groups:

1. Xcode → Target `StarKitWidget` → **Signing & Capabilities** → `+ Capability` → **App Groups**
2. Dodaj grupę: `group.pl.starkit.widget`
3. Powtórz dla targetu `OrdersWidget` → ta sama grupa `group.pl.starkit.widget`
4. Upewnij się, że w obu targetach widnieje ten sam Team ID

Bez App Groups „Oznacz jako widziane" działa tylko wewnątrz aplikacji (nie wpływa na widget).

### 4. Skonfiguruj Config.swift

```swift
static let apiBaseURL = "https://twoja-domena.pl"
static let widgetApiKey = "twoj-tajny-klucz-12345"
```

### 5. URL Scheme (deep linki widget → aplikacja)

Xcode → Target `StarKitWidget` → Info → URL Types → `+`:
- URL Schemes: `starkit`
- Identifier: `pl.starkit.widget`

### 6. Push Notifications Capability

Xcode → Target `StarKitWidget` → Signing & Capabilities → `+ Capability` → **Push Notifications**

### 7. Podpisywanie

Oba targety → Signing & Capabilities → wybierz swój Apple Developer Team.

### 8. Uruchom

Podłącz iPhone → Cmd+R → na telefonie: przytrzymaj ekran → + → "StarKit"

---

## Co pokazuje widget

Każde zamówienie wyświetla **3 linie**:
1. Numer zamówienia + cena
2. Klient + status płatności (badge: zielony opłacone / czerwony nieopłacone / pomarańczowy częściowo)
3. Data startu + dni do odbioru lub zwrotu

**Kliknięcie zamówienia** (medium/large) → otwiera aplikację na tym zamówieniu.
**Kliknięcie nagłówka** "StarKit" lub całego small widgetu → lista zamówień w aplikacji.

---

## Odświeżanie

Widget odświeża się co **15 minut** – to minimum narzucone przez iOS, nie da się tego zmienić.

Aplikacja:
- Odświeża przy starcie automatycznie
- Pull-to-refresh na liście zamówień
- Przycisk `↺` w pasku nawigacji
- Po otwarciu z widgetu wymusza `WidgetCenter.reloadAllTimelines()`

---

## Push Notyfikacje – konfiguracja

### Krok 1 – Tabela w Supabase (jednorazowo)

```sql
create table push_tokens (
  token text primary key,
  platform text not null default 'ios',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### Krok 2 – Klucz APNs

1. [developer.apple.com](https://developer.apple.com) → Certificates, IDs & Profiles → Keys → `+`
2. Zaznacz **Apple Push Notifications service (APNs)**
3. Pobierz plik `.p8` (możesz pobrać tylko raz!)

### Krok 3 – Zmienne środowiskowe

W `.env.local` i Netlify/Vercel:
```
WIDGET_API_KEY=twoj-tajny-klucz-12345
APNS_KEY_ID=ABCDE12345        # z developer.apple.com
APNS_TEAM_ID=TEAMID123        # Twój Team ID
APNS_BUNDLE_ID=pl.starkit.widget
APNS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

### Krok 4 – Pakiet APNs

```bash
npm install @parse/node-apn
```

Następnie odkomentuj sekcję APNs w `app/api/push/send/route.ts`.

### Krok 5 – Webhook w Supabase

Supabase Dashboard → Database → Webhooks → Create:
- **Table**: `orders`, **Events**: `INSERT`
- **URL**: `https://twoja-domena.pl/api/push/send`
- **Header**: `x-widget-api-key: twoj-tajny-klucz-12345`
- **Payload** (HTTP Body):
```json
{
  "title": "Nowe zamówienie!",
  "body": "{{ record.order_number }}",
  "order_id": "{{ record.id }}"
}
```

---

## Ikonka aplikacji

1. Stwórz ikonę **1024×1024 px** (np. logo StarKit na pomarańczowym tle)
2. W Xcode → `Assets.xcassets` → `AppIcon` → przeciągnij plik 1024×1024
3. Xcode wygeneruje wszystkie rozmiary automatycznie

Alternatywa: [makeappicon.com](https://makeappicon.com) – wygeneruje cały zestaw.
