# KOREKTA: Dodatki są fizycznymi produktami

## ⚠️ Krytyczna korekta założeń

### ❌ BŁĘDNE ZAŁOŻENIE (do usunięcia):
- Dodatki są wirtualne/nieograniczone
- Dodatki nie mają stock_items
- Dodatki nie używają pricing tiers
- `product_id` w order_items bez `stock_item_id`

### ✅ POPRAWNE ZAŁOŻENIE:
- **Dodatki są fizycznymi produktami** (powerbank, przewód, uchwyt, zasilacz)
- **Każdy dodatek ma stock_items** (np. 5 powerbanków w magazynie)
- **Dodatki używają pricing tiers** (jak główne produkty)
- **Dodatki blokują dostępność** (jeśli wszystkie wypożyczone → niedostępny)
- **order_items ma ZARÓWNO `product_id` JAK I `stock_item_id`**

---

## 🔧 Co to zmienia w implementacji

### 1. Task 0 - product_id w order_items

**NADAL POTRZEBNE**, ale z innym uzasadnieniem:

**Dlaczego:**
- Obecnie system pobiera product info przez `stock_items.product_id`
- To wymaga JOIN: `order_items → stock_items → products`
- Dodanie `product_id` bezpośrednio w order_items:
  - ✅ Przyspiesza queries (mniej JOINów)
  - ✅ Ułatwia agregacje i raporty
  - ✅ Redundancja danych, ale kontrolowana

**Zmiana w migracji:**
```sql
-- STARA wersja (błędna):
-- "product_id dla wirtualnych produktów bez stock"

-- NOWA wersja (poprawna):
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);

COMMENT ON COLUMN order_items.product_id IS 
'Direct product reference for performance. Denormalized from stock_items.product_id. 
Both product_id and stock_item_id should be set for all order items (main products and addons).';

-- Backfill (WAŻNE - wypełniamy dla WSZYSTKICH):
UPDATE order_items oi
SET product_id = si.product_id
FROM stock_items si
WHERE oi.stock_item_id = si.id
  AND oi.product_id IS NULL;
```

### 2. Task 3.5 - Supabase products

**ZMIANA:** Dodatki potrzebują stock_items!

```sql
-- Powerbank - FIZYCZNY produkt
INSERT INTO products (id, name, sanity_slug, base_price_day, deposit_amount, buffer_before, buffer_after)
VALUES (
  gen_random_uuid(),
  'Powerbank Cayon 60000mAh PD100W',
  'powerbank-cayon-60000mah-pd100w',
  20.00,
  0.00,
  1,  -- ← buffer_before (jak główne produkty)
  1   -- ← buffer_after
);

-- Dodaj stock_items dla powerbanków (np. 5 sztuk)
INSERT INTO stock_items (id, product_id, serial_number)
SELECT 
  gen_random_uuid(),
  p.id,
  'POWERBANK_' || generate_series(1, 5)
FROM products p
WHERE p.sanity_slug = 'powerbank-cayon-60000mah-pd100w';

-- Podobnie dla pozostałych dodatków
```

### 3. Task 6 - Sprawdzanie dostępności

**ZMIANA:** Musimy sprawdzać dostępność dodatków!

```typescript
// W rental-widget.tsx

useEffect(() => {
  if (!startDate || !endDate || !availableAddons) return;
  
  async function checkAddonsAvailability() {
    const results: Record<string, { available: boolean; reason?: string }> = {};
    
    for (const addon of availableAddons) {
      try {
        // Sprawdź dostępność przez API (jak dla głównego produktu)
        const res = await fetch('/api/check-availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: addon._id,
            startDate,
            endDate,
          }),
        });
        
        const json = await res.json();
        
        if (json.available) {
          results[addon._id] = { available: true };
        } else {
          results[addon._id] = { 
            available: false, 
            reason: `Niedostępny ${format(parseISO(startDate), 'd MMM')} - ${format(parseISO(endDate), 'd MMM')}`
          };
        }
      } catch (err) {
        console.error(`Failed to check availability for ${addon.title}:`, err);
        results[addon._id] = { available: false, reason: 'Błąd sprawdzania' };
      }
    }
    
    setAddonAvailability(results);
  }
  
  checkAddonsAvailability();
}, [startDate, endDate, availableAddons]);
```

### 4. Task 7 - Checkout API

**ZMIANA:** Musimy przypisać stock_item_id dla dodatków!

```typescript
// create-checkout-session/route.ts

// Dla głównego produktu (bez zmian)
const mainAvailability = await checkAvailability({
  supabase,
  productId,
  startDate,
  endDate,
});

if (!mainAvailability.available) {
  return NextResponse.json({ error: "Product unavailable" }, { status: 409 });
}

const mainStockItemId = mainAvailability.availableStockItemIds[0];

// DLA DODATKÓW - sprawdź dostępność i przypisz stock_item_id
const addonStockAssignments: Array<{ productId: string; stockItemId: string }> = [];

for (const addonId of addonIds) {
  const addonAvailability = await checkAvailability({
    supabase,
    productId: addonId,
    startDate,
    endDate,
  });
  
  if (!addonAvailability.available) {
    return NextResponse.json({ 
      error: `Addon unavailable: ${addonId}`,
      addonId 
    }, { status: 409 });
  }
  
  addonStockAssignments.push({
    productId: addonId,
    stockItemId: addonAvailability.availableStockItemIds[0],
  });
}

// Tworzenie order_items
// Główny produkt
await supabase.from('order_items').insert({
  order_id: orderId,
  product_id: productId,
  stock_item_id: mainStockItemId,
  quantity: 1,
});

// Dodatki - KAŻDY z przypisanym stock_item_id
for (const addon of addonStockAssignments) {
  await supabase.from('order_items').insert({
    order_id: orderId,
    product_id: addon.productId,
    stock_item_id: addon.stockItemId,  // ← WAŻNE: przypisujemy stock
    quantity: 1,
  });
}
```

### 5. Pricing tiers dla dodatków

**ZMIANA:** Dodatki mogą mieć pricing tiers!

```sql
-- Przykład: Powerbank ma tiers (3 dni = 50 zł, 7 dni = 120 zł)
INSERT INTO pricing_tiers (product_id, tier_days, multiplier, label)
SELECT 
  p.id,
  3,
  2.5,  -- 3 dni × 20 zł × 2.5 = 50 zł (zamiast 60 zł)
  '3 dni'
FROM products p
WHERE p.sanity_slug = 'powerbank-cayon-60000mah-pd100w';

INSERT INTO pricing_tiers (product_id, tier_days, multiplier, label)
SELECT 
  p.id,
  7,
  6.0,  -- 7 dni × 20 zł × 6.0 = 120 zł (zamiast 140 zł)
  '7 dni'
FROM products p
WHERE p.sanity_slug = 'powerbank-cayon-60000mah-pd100w';
```

**W checkout API:**
```typescript
// Oblicz cenę dodatku z pricing tiers
const { data: addonTiers } = await supabase
  .from('pricing_tiers')
  .select('tier_days, multiplier, label')
  .eq('product_id', addonId)
  .order('tier_days', { ascending: true });

const addonPricing = calculatePrice({
  startDate,
  endDate,
  dailyRateCents: decimalToCents(addon.base_price_day),
  depositCents: decimalToCents(addon.deposit_amount),
  pricingTiers: addonTiers || [],  // ← Dodatki używają tiers!
  autoIncrementMultiplier: addon.auto_increment_multiplier || 1.0,
});
```

---

## 📊 Porównanie: Przed vs Po korekcie

| Aspekt | BŁĘDNE (przed) | POPRAWNE (po) |
|--------|----------------|---------------|
| Typ produktu | Wirtualny | Fizyczny |
| Stock items | Brak | Tak (np. 5 powerbanków) |
| Dostępność | Nieograniczona | Ograniczona (sprawdzamy) |
| Pricing tiers | Nie | Tak |
| Buffer days | 0 | 1-2 (jak główne produkty) |
| order_items.stock_item_id | NULL | Przypisany konkretny stock |
| order_items.product_id | Tylko dla addonów | Dla wszystkich (denormalizacja) |

---

## ✅ Zaktualizowany flow

### Checkout z dodatkami:

1. **Użytkownik wybiera daty:** 5-12 czerwca (8 dni)
2. **Wybiera główny produkt:** Starlink Mini
3. **Sprawdzamy dostępność głównego:** 
   - API: `checkAvailability(starlink-mini, 5-12 cze)`
   - Wynik: `available: true, availableStockItemIds: ['stock_123']`
4. **Użytkownik dodaje powerbank**
5. **Sprawdzamy dostępność powerbanku:**
   - API: `checkAvailability(powerbank-cayon, 5-12 cze)`
   - Wynik: `available: true, availableStockItemIds: ['powerbank_1', 'powerbank_2']`
6. **Obliczamy ceny Z PRICING TIERS:**
   - Starlink: 8 dni → tier 7 dni → 560 zł (zamiast 640 zł)
   - Powerbank: 8 dni → tier 7 dni → 120 zł (zamiast 160 zł)
   - Razem: 680 zł + 500 zł kaucja = 1180 zł
7. **Tworzymy zamówienie:**
   - order_items[0]: product_id=starlink, stock_item_id=stock_123
   - order_items[1]: product_id=powerbank, stock_item_id=powerbank_1
8. **Oba stock_items są zablokowane** dla dat 5-12 czerwca

---

## 🚨 Kluczowe zmiany w planie

### Task 0 - Uzasadnienie zmienione
- Nie "dla wirtualnych produktów"
- Ale "dla denormalizacji i performance"

### Task 3.5 - Dodać stock_items
- Utworzyć stock_items dla każdego dodatku
- Ustawić buffer_before/after (jak główne produkty)

### Task 6 - Sprawdzanie dostępności
- Wywołać `checkAvailability()` dla każdego dodatku
- Pokazać overlay gdy niedostępny
- Disable przycisk "Dodaj"

### Task 7 - Przypisanie stock_item_id
- Sprawdzić dostępność dodatków
- Przypisać konkretny stock_item_id
- Zwrócić błąd jeśli dodatek niedostępny

### Task 8 - Bez zmian
- order_items już ma stock_item_id

---

## 💡 Dodatkowe konsekwencje

### 1. Dashboard dostępności
- Dodatki będą widoczne w timeline (`/office/dashboard`)
- Każdy stock_item dodatku jako osobny wiersz
- Można śledzić który powerbank jest gdzie

### 2. Zarządzanie stock
- Admin może dodawać/usuwać stock_items dodatków
- Można oznaczyć powerbank jako "w serwisie" (unavailable_from/to)
- Można śledzić historię wypożyczeń każdego powerbanku

### 3. Raporty
- "Który dodatek jest najpopularniejszy?"
- "Ile razy powerbank_3 był wypożyczony?"
- "Czy potrzebujemy więcej powerbanków?"

---

## ✅ Podsumowanie korekty

**Dodatki to pełnoprawne produkty:**
- ✅ Mają stock_items (fizyczne egzemplarze)
- ✅ Używają pricing tiers
- ✅ Blokują dostępność
- ✅ Mają buffer days
- ✅ Są śledzeni w systemie

**Jedyna różnica:**
- ❌ Nie można ich zamówić samodzielnie (tylko jako dodatek)
- ✅ Wszystko inne działa tak samo jak główne produkty

**Implikacje:**
- Więcej logiki sprawdzania dostępności
- Więcej stock_items w bazie
- Lepsze śledzenie i raporty
- Bardziej realistyczny system
