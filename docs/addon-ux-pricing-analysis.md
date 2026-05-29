# Analiza UX i Cenowa - Dodatki Produktowe

## 🎨 UX Flow - Jak będzie wyglądać wybór dodatków

### 1. Strona produktu (`/products/starlink-mini`)

**Obecny widget wynajmu:**
```
┌─────────────────────────────────────┐
│ 📅 Zarezerwuj termin                │
│ Wybierz daty i sprawdź cenę wynajmu │
├─────────────────────────────────────┤
│ OKRES WYNAJMU (minimum 3 dni)      │
│ [📅 5 cze → 12 cze 2026]           │
├─────────────────────────────────────┤
│ PODSUMOWANIE                        │
│ Starlink Mini — 8 dni    640.00 zł │
│ Kaucja zwrotna          500.00 zł │
│ ─────────────────────────────────── │
│ Razem                  1140.00 zł │
├─────────────────────────────────────┤
│ ✅ Termin dostępny                  │
│ [Zarezerwuj termin →]              │
└─────────────────────────────────────┘
```

**PO DODANIU DODATKÓW:**
```
┌─────────────────────────────────────────────┐
│ 📅 Zarezerwuj termin                        │
│ Wybierz daty i sprawdź cenę wynajmu         │
├─────────────────────────────────────────────┤
│ OKRES WYNAJMU (minimum 3 dni)              │
│ [📅 5 cze → 12 cze 2026]                   │
├─────────────────────────────────────────────┤
│ 🎁 DODAJ AKCESORIA                          │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ ☐ Powerbank Cayon 60000mAh  +20 zł/dzień│ │
│ │   Zapewnia 8-10h pracy Starlink Mini    │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ ☐ Przewód USC-C Starlink mini      GRATIS│ │
│ │   Zapasowy przewód 3m, wzmocniony       │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ ☐ Uchwyt na szybę Starlink Mini   GRATIS│ │
│ │   Montaż na szybie auta/kampera         │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ ☐ Zasilacz samochodowy 12V/24V    GRATIS│ │
│ │   Zasilanie z gniazda zapalniczki       │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ PODSUMOWANIE                                │
│ Starlink Mini — 8 dni          640.00 zł   │
│ Kaucja zwrotna                500.00 zł   │
│ ─────────────────────────────────────────── │
│ Razem                        1140.00 zł   │
├─────────────────────────────────────────────┤
│ ✅ Termin dostępny                          │
│ [Zarezerwuj termin →]                      │
└─────────────────────────────────────────────┘
```

**GDY UŻYTKOWNIK WYBIERZE POWERBANK:**
```
┌─────────────────────────────────────────────┐
│ 🎁 DODAJ AKCESORIA                          │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ ☑ Powerbank Cayon 60000mAh  +20 zł/dzień│ │ ← ZAZNACZONE (niebieski border)
│ │   Zapewnia 8-10h pracy Starlink Mini    │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ ☑ Przewód USC-C Starlink mini      GRATIS│ │ ← ZAZNACZONE
│ │   Zapasowy przewód 3m, wzmocniony       │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ PODSUMOWANIE                                │
│ Starlink Mini — 8 dni          640.00 zł   │
│ Powerbank Cayon — 8 dni        160.00 zł   │ ← NOWA LINIA
│ Przewód USC-C                    0.00 zł   │ ← NOWA LINIA
│ Kaucja zwrotna                500.00 zł   │
│ ─────────────────────────────────────────── │
│ Razem                        1300.00 zł   │ ← ZAKTUALIZOWANA CENA
├─────────────────────────────────────────────┤
│ ✅ Termin dostępny                          │
│ [Zarezerwuj termin →]                      │
└─────────────────────────────────────────────┘
```

### 2. Strona checkout (`/checkout`)

**OBECNY CHECKOUT:**
- Formularz z danymi klienta
- Wybór dostawy (InPost / odbiór osobisty)
- Podsumowanie: 1 produkt

**PO DODANIU DODATKÓW:**
```
┌──────────────────────────────────────────────┐
│ TWOJE ZAMÓWIENIE                             │
├──────────────────────────────────────────────┤
│ 📦 Starlink Mini                             │
│    5 czerwca – 12 czerwca 2026 (8 dni)      │
│                                 640.00 zł   │
│                                              │
│ 🔋 Powerbank Cayon 60000mAh PD100W           │
│    8 dni × 20 zł                160.00 zł   │
│                                              │
│ 🔌 Przewód USC-C Starlink mini               │
│    Gratis                         0.00 zł   │
│                                              │
│ 💰 Kaucja zwrotna               500.00 zł   │
│ ──────────────────────────────────────────── │
│ RAZEM DO ZAPŁATY              1300.00 zł   │
└──────────────────────────────────────────────┘

[Formularz z danymi klienta...]
[Zapłać przez Stripe →]
```

### 3. Stripe Checkout

**Line items w Stripe:**
```
Starlink Mini — wynajem (8 dni)         640.00 zł
Starlink Mini — kaucja                  500.00 zł
Powerbank Cayon 60000mAh (dodatek)      160.00 zł
Przewód USC-C Starlink mini (dodatek)     0.00 zł
──────────────────────────────────────────────
RAZEM                                  1300.00 zł
```

---

## 💰 Analiza Cenowa - Czy Stripe przelicza dobrze?

### Obecny system cenowy

**1. Frontend (rental-widget.tsx):**
```typescript
// Oblicza cenę TYLKO głównego produktu
const pricing = calculatePrice({
  startDate,
  endDate,
  dailyRateCents: product.base_price_day * 100,
  depositCents: product.deposit_amount * 100,
  pricingTiers,
  autoIncrementMultiplier
});

// Wynik:
// pricing.rentalSubtotalCents = 64000 (640 zł)
// pricing.depositCents = 50000 (500 zł)
// pricing.totalCents = 114000 (1140 zł)
```

**2. Checkout API (create-checkout-session/route.ts):**
```typescript
// Tworzy Stripe line items dla głównego produktu
line_items: [
  {
    price_data: {
      product_data: { name: "Starlink Mini — wynajem (8 dni)" },
      unit_amount: 64000, // 640 zł w groszach
    },
    quantity: 1,
  },
  {
    price_data: {
      product_data: { name: "Starlink Mini — kaucja" },
      unit_amount: 50000, // 500 zł w groszach
    },
    quantity: 1,
  }
]
```

### ⚠️ PROBLEM: Obecny system NIE obsługuje wielu produktów

**Checkout API tworzy tylko 1 order_item:**
```typescript
// Linia 300-310 w create-checkout-session/route.ts
const { data: orderItem } = await supabase
  .from("order_items")
  .insert({
    order_id: orderId,
    stock_item_id: stockItemId,  // ← TYLKO 1 stock_item
    quantity: 1,
  });
```

---

## ✅ ROZWIĄZANIE: Co musimy zmienić

### 1. Frontend - RentalWidget

**Dodajemy state dla wybranych dodatków:**
```typescript
const [selectedAddonIds, setSelectedAddonIds] = useState<Set<string>>(new Set());

// Obliczamy cenę RAZEM (główny + dodatki)
const selectedAddons = availableAddons?.filter(a => selectedAddonIds.has(a._id)) || [];
const addonsTotalPerDay = selectedAddons.reduce((sum, addon) => sum + addon.pricePerDay, 0);

const totalPricePerDay = product.pricePerDay + addonsTotalPerDay;
const totalDeposit = product.deposit + selectedAddons.reduce((sum, a) => sum + a.deposit, 0);

// Przeliczamy dla wybranego okresu
const pricing = calculatePrice({
  startDate,
  endDate,
  dailyRateCents: totalPricePerDay * 100,  // ← SUMA główny + dodatki
  depositCents: totalDeposit * 100,
  pricingTiers,
  autoIncrementMultiplier
});
```

**Przekazujemy addonIds do checkout:**
```typescript
const params = new URLSearchParams({
  productId: product.id,
  from: startDate,
  to: endDate,
  addonIds: [...selectedAddonIds].join(','),  // ← NOWE
});
```

### 2. Checkout API - create-checkout-session

**Pobieramy dodatki z Supabase:**
```typescript
const addonIds = body.addonIds?.split(',').filter(Boolean) || [];

let addons = [];
if (addonIds.length > 0) {
  const { data: addonsData } = await supabase
    .from('products')
    .select('id, name, base_price_day, deposit_amount')
    .in('id', addonIds);
  addons = addonsData || [];
}
```

**Obliczamy cenę RAZEM:**
```typescript
// Główny produkt
const mainPricing = calculatePrice({
  startDate,
  endDate,
  dailyRateCents: decimalToCents(product.base_price_day),
  depositCents: decimalToCents(product.deposit_amount),
  pricingTiers,
  autoIncrementMultiplier,
});

// Dodatki (każdy osobno, bo mogą mieć różne ceny)
const addonPricings = addons.map(addon => 
  calculatePrice({
    startDate,
    endDate,
    dailyRateCents: decimalToCents(addon.base_price_day),
    depositCents: decimalToCents(addon.deposit_amount),
  })
);

// SUMA
const totalRental = mainPricing.rentalSubtotalCents + 
  addonPricings.reduce((sum, p) => sum + p.rentalSubtotalCents, 0);
const totalDeposit = mainPricing.depositCents + 
  addonPricings.reduce((sum, p) => sum + p.depositCents, 0);
```

**Tworzymy line items w Stripe:**
```typescript
const lineItems = [
  // Główny produkt - wynajem
  {
    price_data: {
      currency: 'pln',
      product_data: { name: `${productName} — wynajem (${days} dni)` },
      unit_amount: mainPricing.rentalSubtotalCents,
    },
    quantity: 1,
  },
  // Główny produkt - kaucja
  {
    price_data: {
      currency: 'pln',
      product_data: { name: `${productName} — kaucja` },
      unit_amount: mainPricing.depositCents,
    },
    quantity: 1,
  },
];

// Dodatki - każdy jako osobny line item
addons.forEach((addon, idx) => {
  const addonPricing = addonPricings[idx];
  
  // Wynajem dodatku
  if (addonPricing.rentalSubtotalCents > 0) {
    lineItems.push({
      price_data: {
        currency: 'pln',
        product_data: { name: `${addon.name} (dodatek)` },
        unit_amount: addonPricing.rentalSubtotalCents,
      },
      quantity: 1,
    });
  }
  
  // Kaucja dodatku (jeśli jest)
  if (addonPricing.depositCents > 0) {
    lineItems.push({
      price_data: {
        currency: 'pln',
        product_data: { name: `${addon.name} — kaucja` },
        unit_amount: addonPricing.depositCents,
      },
      quantity: 1,
    });
  }
});
```

**Zapisujemy addonIds w metadata:**
```typescript
metadata: {
  productId: product.id,
  stockItemId: stockItemId,
  addonIds: addonIds.join(','),  // ← NOWE
  startDate,
  endDate,
  // ...
}
```

**Tworzymy order_items dla dodatków:**
```typescript
// Główny produkt
await supabase.from('order_items').insert({
  order_id: orderId,
  stock_item_id: stockItemId,
  quantity: 1,
});

// Dodatki (bez stock_item_id - są wirtualne)
for (const addonId of addonIds) {
  await supabase.from('order_items').insert({
    order_id: orderId,
    product_id: addonId,  // ← Musimy dodać kolumnę product_id do order_items!
    stock_item_id: null,  // Dodatki nie mają stock
    quantity: 1,
  });
}
```

---

## 🔍 Weryfikacja cenowa - Przykład

### Scenariusz: Starlink Mini + Powerbank na 8 dni

**Ceny bazowe:**
- Starlink Mini: 80 zł/dzień, kaucja 500 zł
- Powerbank: 20 zł/dzień, kaucja 0 zł

**Obliczenia:**

1. **Frontend (rental-widget):**
   ```
   Główny: 80 zł/dzień
   Powerbank: 20 zł/dzień
   ────────────────────
   SUMA: 100 zł/dzień
   
   8 dni × 100 zł = 800 zł (wynajem)
   Kaucja: 500 zł
   ────────────────────
   RAZEM: 1300 zł ✅
   ```

2. **Checkout API (create-checkout-session):**
   ```
   Główny: 8 dni × 80 zł = 640 zł
   Powerbank: 8 dni × 20 zł = 160 zł
   Kaucja główny: 500 zł
   Kaucja powerbank: 0 zł
   ────────────────────
   RAZEM: 1300 zł ✅
   ```

3. **Stripe line items:**
   ```
   Line 1: Starlink Mini — wynajem (8 dni)     640.00 zł
   Line 2: Starlink Mini — kaucja              500.00 zł
   Line 3: Powerbank Cayon (dodatek)           160.00 zł
   ────────────────────────────────────────────────────
   STRIPE TOTAL:                              1300.00 zł ✅
   ```

4. **Supabase orders table:**
   ```sql
   total_rental_price = 800.00  -- 640 + 160
   total_deposit = 500.00
   ```

5. **Supabase order_items table:**
   ```
   order_item 1: product_id = starlink_mini_id, stock_item_id = ABC123
   order_item 2: product_id = powerbank_id, stock_item_id = NULL
   ```

6. **PDF umowa (generate-contract):**
   ```
   System pobiera ALL order_items:
   - Starlink Mini — starlink_mini_1 (SN: ABC123)
   - Powerbank Cayon 60000mAh PD100W
   
   Przelicza ceny z products table:
   - Starlink: 8 × 80 = 640 zł
   - Powerbank: 8 × 20 = 160 zł
   ────────────────────
   RAZEM: 800 zł + 500 zł kaucja = 1300 zł ✅
   ```

---

## ⚠️ POTENCJALNE NIESPODZIANKI

### 1. ❌ Brak kolumny `product_id` w `order_items`

**Problem:** Obecnie `order_items` ma tylko `stock_item_id`, nie ma `product_id`.

**Rozwiązanie:** Dodać kolumnę:
```sql
ALTER TABLE order_items 
ADD COLUMN product_id UUID REFERENCES products(id);
```

**Dlaczego:** Dodatki nie mają `stock_items`, więc musimy zapisać `product_id` bezpośrednio.

### 2. ⚠️ Pricing tiers dla dodatków

**Problem:** Dodatki mogą nie mieć pricing tiers w bazie.

**Rozwiązanie:** 
- Dodatki używają tylko `base_price_day` (bez tiers)
- Lub: tworzymy tier 1:1 (1 dzień = 1× cena)

### 3. ⚠️ Dostępność dodatków

**Problem:** `checkAvailability()` sprawdza tylko stock_items głównego produktu.

**Rozwiązanie:** 
- Dodatki są **nieograniczone** (virtual products)
- NIE sprawdzamy ich dostępności
- To jest **zamierzone** - zawsze dostępne

### 4. ⚠️ Synchronizacja Sanity ↔ Supabase

**Problem:** Dodatki muszą istnieć w OBIE miejscach:
- Sanity: treść, zdjęcia, SEO
- Supabase: ceny, dostępność, pricing tiers

**Rozwiązanie:** Task 3.5 w planie - ręczna synchronizacja przez SQL.

---

## ✅ PODSUMOWANIE

### Czy ceny w Stripe się przeliczą dobrze?

**TAK** - pod warunkiem że:

1. ✅ Frontend sumuje ceny główny + dodatki PRZED wysłaniem do checkout
2. ✅ Checkout API tworzy osobne line items dla każdego dodatku
3. ✅ Każdy dodatek ma `base_price_day` w Supabase products table
4. ✅ Dodamy kolumnę `product_id` do `order_items`
5. ✅ Metadata w Stripe zawiera `addonIds`

### Czy będą niespodzianki?

**Potencjalne problemy:**

1. **Brak `product_id` w order_items** → Musimy dodać kolumnę (Task 3.5)
2. **Dodatki bez pricing tiers** → OK, używamy base_price_day
3. **Dodatki bez stock_items** → OK, są wirtualne
4. **Desynchronizacja Sanity-Supabase** → Musimy ręcznie zsynchronizować

### Czy UX jest dobry?

**TAK:**
- ✅ Checkboxy z opisami - intuicyjne
- ✅ Cena aktualizuje się live
- ✅ Dodatki widoczne w podsumowaniu
- ✅ Dodatki widoczne w Stripe checkout
- ✅ Dodatki widoczne w umowie PDF
- ✅ Dodatki widoczne w panelu zamówienia

---

## 📋 Checklist przed wdrożeniem

- [ ] Dodać kolumnę `product_id` do `order_items`
- [ ] Utworzyć dodatki w Sanity Studio
- [ ] Zsynchronizować dodatki do Supabase products
- [ ] Przetestować flow: widget → checkout → Stripe → order
- [ ] Sprawdzić PDF umowy z dodatkami
- [ ] Sprawdzić panel zamówienia z dodatkami
- [ ] Sprawdzić email potwierdzenia z dodatkami
- [ ] Przetestować różne kombinacje dodatków
- [ ] Sprawdzić czy ceny się zgadzają w każdym miejscu
