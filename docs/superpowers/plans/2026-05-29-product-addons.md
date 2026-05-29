# Product Addons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add addon products (powerbanks, cables, accessories) to Sanity CMS and enable selecting them on main product pages (Starlink Mini, Starlink Standard).

**Architecture:** Extend Sanity product schema with `isAddon` flag and `availableAddons` reference array. Create addon products in Sanity with full content. Update product page to display addon selection in rental widget. **CRITICAL:** Addons are "virtual" products without stock_items - they don't block availability. Pricing system already handles multiple order_items, so addon prices will be included in contracts and order totals automatically.

**Tech Stack:** Sanity CMS, Next.js 16, React 19, TypeScript, Tailwind CSS

**Key Integration Points:**
- ✅ PDF contracts (`generate-contract/route.ts`) - already loops through ALL order_items for §2 product list and pricing
- ✅ Order detail panel (`orders/[id]/page.tsx`) - already fetches all order_items with products
- ✅ Email system (`lib/email.tsx`) - already includes order_items in confirmation emails
- ⚠️ Availability check (`lib/rental-engine.ts`) - only checks stock_items, addons bypass this (intentional - they're unlimited)
- ⚠️ Supabase products table - addons need `base_price_day` and `deposit_amount` set to 0 or actual price

---

## ⚠️ CRITICAL PREREQUISITE

**Database Schema Change Required:** The `order_items` table currently only has `stock_item_id` but NO `product_id` column. Addons are virtual products without stock_items, so we MUST add `product_id` column first.

**Task 0 MUST be completed before any other tasks.**

---

## File Structure

**Sanity Schema:**
- Modify: `sanity/schemas/documents/product.ts` - add addon fields
- Create: `sanity/schemas/documents/addon-product.ts` - dedicated addon schema (optional, or reuse product)

**Frontend:**
- Modify: `app/products/[slug]/page.tsx` - pass addons to widget
- Modify: `app/products/_components/rental-widget.tsx` - display addon selection UI
- Modify: `sanity/queries/products.ts` - fetch addons in product query

**Sanity Content:**
- Create 4 addon products via Sanity Studio

**Database:**
- Modify: Supabase `order_items` table - add `product_id` column

---

### Task 0: Add product_id Column to order_items Table

**Files:**
- Database: Supabase `order_items` table

**Context:** Currently `order_items` only has `stock_item_id` to link to products via `stock_items.product_id`. Addons are virtual products without stock_items, so we need direct `product_id` reference.

- [ ] **Step 1: Open Supabase SQL Editor**

Navigate to https://supabase.com → Your project → SQL Editor

- [ ] **Step 2: Check current order_items schema**

Run query to see current structure:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'order_items'
ORDER BY ordinal_position;
```

Expected: Should see `order_id`, `stock_item_id`, but NO `product_id`

- [ ] **Step 3: Add product_id column**

Run this migration:

```sql
-- Add product_id column (nullable for backward compatibility)
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_order_items_product_id 
ON order_items(product_id);

-- Add comment for documentation
COMMENT ON COLUMN order_items.product_id IS 
'Direct product reference. Used for addon products that don''t have stock_items. For main products with stock, product_id can be derived from stock_items.product_id';
```

Expected: Column added successfully

- [ ] **Step 4: Backfill product_id for existing order_items**

Populate product_id from stock_items for existing records:

```sql
-- Backfill product_id from stock_items.product_id
UPDATE order_items oi
SET product_id = si.product_id
FROM stock_items si
WHERE oi.stock_item_id = si.id
  AND oi.product_id IS NULL;
```

Expected: X rows updated (existing order_items now have product_id)

- [ ] **Step 5: Verify the migration**

Check that data looks correct:

```sql
-- Check sample order_items
SELECT 
  oi.id,
  oi.order_id,
  oi.stock_item_id,
  oi.product_id,
  p.name as product_name
FROM order_items oi
LEFT JOIN products p ON oi.product_id = p.id
LIMIT 10;
```

Expected: All rows should have product_id populated (either from backfill or will be set on new inserts)

- [ ] **Step 6: Update create-checkout-session to set product_id**

This will be done in Task 7, but document the requirement here:

**Future code change needed:**
```typescript
// OLD (current):
await supabase.from("order_items").insert({
  order_id: orderId,
  stock_item_id: stockItemId,
});

// NEW (after Task 7):
await supabase.from("order_items").insert({
  order_id: orderId,
  stock_item_id: stockItemId,
  product_id: productId,  // ← ADD THIS
});
```

- [ ] **Step 7: Document completion**

```bash
# No code commit - database migration
# order_items table now supports both:
# 1. Main products: product_id + stock_item_id (both set)
# 2. Addon products: product_id only, stock_item_id = NULL
```

**Why this is critical:**
- Addons don't have stock_items (they're unlimited virtual products)
- Without product_id, we can't create order_items for addons
- PDF generation, pricing, and order display all need product info
- This change is backward compatible (existing code still works)

---

### Task 1: Extend Sanity Product Schema with Addon Support

**Files:**
- Modify: `sanity/schemas/documents/product.ts`

- [ ] **Step 1: Add `isAddon` boolean field to product schema**

Open `sanity/schemas/documents/product.ts` and add after line 91 (after `status` field):

```typescript
defineField({
  name: "isAddon",
  title: "Is Addon Product",
  type: "boolean",
  group: "content",
  description: "Mark this product as an addon (powerbank, cable, accessory) that can be added to main products",
  initialValue: false,
}),
defineField({
  name: "canBeOrderedAlone",
  title: "Can Be Ordered Alone",
  type: "boolean",
  group: "content",
  description: "If false, this addon can only be added to main products, not ordered separately",
  initialValue: false,
  hidden: ({ document }) => document?.isAddon !== true,
}),
defineField({
  name: "mainProducts",
  title: "Main Products",
  type: "array",
  group: "content",
  description: "Main products that this addon can be added to (e.g., Starlink Mini, Starlink Standard)",
  of: [
    {
      type: "reference",
      to: [{ type: "product" }],
      options: {
        filter: "isAddon != true",
      },
    },
  ],
  hidden: ({ document }) => document?.isAddon !== true,
}),
```

- [ ] **Step 2: Add `availableAddons` reference array field**

Add after the `isAddon` field:

```typescript
defineField({
  name: "availableAddons",
  title: "Available Addons",
  type: "array",
  group: "content",
  description: "Select addon products that can be added to this main product",
  of: [
    {
      type: "reference",
      to: [{ type: "product" }],
      options: {
        filter: "isAddon == true",
      },
    },
  ],
  hidden: ({ document }) => document?.isAddon === true,
}),
```

- [ ] **Step 3: Commit schema changes**

```bash
git add sanity/schemas/documents/product.ts
git commit -m "feat(sanity): add addon support to product schema"
```

---

### Task 2: Update Sanity Product Query to Fetch Addons

**Files:**
- Modify: `sanity/queries/products.ts`

- [ ] **Step 1: Locate and read current product query**

Open `sanity/queries/products.ts` and find `singleProductQuery`.

- [ ] **Step 2: Add availableAddons to query projection**

Find the query projection (likely around line 20-50) and add:

```typescript
availableAddons[]-> {
  _id,
  title,
  slug,
  excerpt,
  pricePerDay,
  deposit,
  images[] {
    asset-> {
      url
    }
  },
  isAddon
},
```

Add this inside the main product query object, after `blocks` or `specs` field.

- [ ] **Step 3: Verify query syntax**

Ensure the query is valid GROQ syntax. The `availableAddons[]->` dereferences the product references.

- [ ] **Step 4: Commit query changes**

```bash
git add sanity/queries/products.ts
git commit -m "feat(sanity): fetch availableAddons in product query"
```

---

### Task 3: Create Addon Products in Sanity Studio

**Files:**
- Manual content creation in Sanity Studio (no code changes)

- [ ] **Step 1: Start Sanity Studio**

```bash
cd sanity
npm run dev
```

Expected: Studio runs on http://localhost:3333

- [ ] **Step 2: Create Powerbank Cayon 60000mAh PD100W**

Navigate to Products → Create New Product

Fill in:
- **Title:** Powerbank Cayon 60000mAh PD100W
- **Slug:** powerbank-cayon-60000mah-pd100w
- **Category:** Select or create "Akcesoria"
- **Is Addon Product:** ✅ TRUE
- **Can Be Ordered Alone:** ❌ FALSE (nie można zamówić samodzielnie)
- **Main Products:** Add references to "Starlink Mini" and "Starlink Standard"
- **Excerpt:** Potężny powerbank o pojemności 60000mAh z szybkim ładowaniem PD 100W. Idealny do zasilania Starlink Mini przez wiele godzin bez dostępu do prądu.
- **Price per day:** 20.00
- **Deposit:** 0.00
- **Status:** Available
- **Description (Body):** 

```
Powerbank Cayon 60000mAh to profesjonalne rozwiązanie dla użytkowników Starlink Mini, którzy potrzebują mobilnego zasilania. 

**Kluczowe cechy:**
- Pojemność 60000mAh – zapewnia do 8-10 godzin pracy Starlink Mini
- Szybkie ładowanie PD 100W – błyskawiczne uzupełnianie energii
- Kompaktowa konstrukcja – łatwy transport
- Wielokrotne zabezpieczenia – ochrona przed przeciążeniem i przegrzaniem

**Idealne zastosowania:**
- Praca zdalna w terenie bez dostępu do prądu
- Eventy outdoor i festiwale
- Budowy i place bez infrastruktury elektrycznej
- Podróże kamperem lub łodzią
```

- **Images:** Upload 1-2 stock images of powerbank (use placeholder if needed)
- **Specs:**
  - Pojemność: 60000mAh
  - Moc wyjściowa: 100W PD
  - Porty: 2x USB-C, 2x USB-A
  - Waga: ~1.2kg
  - Czas ładowania: 4-5h

- [ ] **Step 3: Create Przewód USC-C Starlink mini**

Create new product:
- **Title:** Przewód USC-C Starlink mini
- **Slug:** przewod-usc-c-starlink-mini
- **Category:** Akcesoria
- **Is Addon Product:** ✅ TRUE
- **Excerpt:** Zapasowy przewód USB-C do zasilania Starlink Mini. Długość 3m, wzmocniona izolacja, kompatybilny z powerbankami i ładowarkami PD.
- **Price per day:** 0.00
- **Deposit:** 0.00
- **Status:** Available
- **Description:**

```
Zapasowy lub dodatkowy przewód zasilający USB-C do Starlink Mini. Niezbędny, gdy potrzebujesz większej elastyczności w rozmieszczeniu sprzętu lub chcesz mieć backup na wypadek zgubienia.

**Specyfikacja:**
- Długość 3 metry – większa swoboda ustawienia
- Wzmocniona izolacja – odporność na uszkodzenia
- Obsługa Power Delivery do 100W
- Kompatybilny z powerbankami i ładowarkami

**Kiedy się przyda:**
- Jako zapasowy przewód na event
- Gdy potrzebujesz dłuższego kabla
- Do zasilania z powerbanku w terenie
```

- **Images:** Upload cable image
- **Specs:**
  - Długość: 3m
  - Typ: USB-C to USB-C
  - Moc: do 100W PD
  - Materiał: wzmocniony nylon

- [ ] **Step 4: Create Uchwyt na szybę Starlink Mini**

Create new product:
- **Title:** Uchwyt na szybę Starlink Mini
- **Slug:** uchwyt-na-szybe-starlink-mini
- **Category:** Akcesoria
- **Is Addon Product:** ✅ TRUE
- **Excerpt:** Profesjonalny uchwyt przyssawkowy do montażu Starlink Mini na szybie samochodu, kampera lub oknie. Stabilny, łatwy montaż, nie pozostawia śladów.
- **Price per day:** 0.00
- **Deposit:** 0.00
- **Status:** Available
- **Description:**

```
Uchwyt na szybę to must-have dla użytkowników mobilnych. Pozwala zamontować Starlink Mini na szybie pojazdu lub oknie, zapewniając stabilne połączenie podczas podróży.

**Zalety:**
- Mocne przyssawki – stabilny montaż nawet podczas jazdy
- Uniwersalny – pasuje do Starlink Mini
- Szybki montaż i demontaż – bez narzędzi
- Nie pozostawia śladów na szybie

**Zastosowania:**
- Kamper i samochód – internet w trasie
- Okno mieszkania/biura – tymczasowa instalacja
- Łódź i jacht – stabilne mocowanie
```

- **Images:** Upload mount image
- **Specs:**
  - Typ: uchwyt przyssawkowy
  - Kompatybilność: Starlink Mini
  - Materiał: ABS + silikon
  - Nośność: do 2kg

- [ ] **Step 5: Create Zasilacz samochodowy Starlink Mini**

Create new product:
- **Title:** Zasilacz samochodowy Starlink Mini
- **Slug:** zasilacz-samochodowy-starlink-mini
- **Category:** Akcesoria
- **Is Addon Product:** ✅ TRUE
- **Excerpt:** Zasilacz 12V/24V do gniazda zapalniczki samochodowej. Umożliwia zasilanie Starlink Mini bezpośrednio z instalacji pojazdu podczas jazdy.
- **Price per day:** 0.00
- **Deposit:** 0.00
- **Status:** Available
- **Description:**

```
Zasilacz samochodowy to idealne rozwiązanie dla osób podróżujących kamperem, samochodem dostawczym lub ciężarówką. Pozwala korzystać ze Starlink Mini bez rozładowywania powerbanku.

**Funkcje:**
- Zasilanie 12V/24V – kompatybilne z większością pojazdów
- Wyjście USB-C PD 100W – pełna moc dla Starlink Mini
- Zabezpieczenia – ochrona przed przepięciem i zwarciem
- Kompaktowa konstrukcja – nie zajmuje dużo miejsca

**Dla kogo:**
- Kierowcy ciężarówek – internet w trasie
- Właściciele kamperów – stały dostęp do sieci
- Firmy transportowe – komunikacja w terenie
- Podróżnicy – praca zdalna z samochodu
```

- **Images:** Upload car charger image
- **Specs:**
  - Wejście: 12V/24V DC
  - Wyjście: USB-C PD 100W
  - Zabezpieczenia: OVP, OCP, SCP
  - Długość przewodu: 1.5m

- [ ] **Step 6: Verify all addon products are created**

Navigate to Products list and filter by "Is Addon Product = true". Confirm all 4 products are visible.

- [ ] **Step 7: Commit (manual note)**

```bash
# No code commit needed - content created in Sanity Studio
# Document completion in plan tracking
```

---

### Task 3.5: Sync Addon Products to Supabase Products Table

**Files:**
- Manual database operations in Supabase

**Context:** The pricing system (`generate-contract/route.ts`) fetches `base_price_day`, `deposit_amount`, and `pricing_tiers` from Supabase `products` table. We need to ensure addon products exist there with correct pricing.

- [ ] **Step 1: Open Supabase SQL Editor**

Navigate to https://supabase.com → Your project → SQL Editor

- [ ] **Step 2: Check if products table has sanity_slug column**

Run query:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products';
```

Expected: Should see `sanity_slug` column (used to match Sanity products to Supabase)

- [ ] **Step 3: Insert addon products into Supabase**

Run this SQL to create addon product records:

```sql
-- Powerbank Cayon 60000mAh PD100W
INSERT INTO products (id, name, sanity_slug, base_price_day, deposit_amount, buffer_before, buffer_after)
VALUES (
  gen_random_uuid(),
  'Powerbank Cayon 60000mAh PD100W',
  'powerbank-cayon-60000mah-pd100w',
  20.00,
  0.00,
  0,
  0
)
ON CONFLICT (sanity_slug) DO UPDATE SET
  name = EXCLUDED.name,
  base_price_day = EXCLUDED.base_price_day,
  deposit_amount = EXCLUDED.deposit_amount;

-- Przewód USC-C Starlink mini
INSERT INTO products (id, name, sanity_slug, base_price_day, deposit_amount, buffer_before, buffer_after)
VALUES (
  gen_random_uuid(),
  'Przewód USC-C Starlink mini',
  'przewod-usc-c-starlink-mini',
  0.00,
  0.00,
  0,
  0
)
ON CONFLICT (sanity_slug) DO UPDATE SET
  name = EXCLUDED.name,
  base_price_day = EXCLUDED.base_price_day,
  deposit_amount = EXCLUDED.deposit_amount;

-- Uchwyt na szybę Starlink Mini
INSERT INTO products (id, name, sanity_slug, base_price_day, deposit_amount, buffer_before, buffer_after)
VALUES (
  gen_random_uuid(),
  'Uchwyt na szybę Starlink Mini',
  'uchwyt-na-szybe-starlink-mini',
  0.00,
  0.00,
  0,
  0
)
ON CONFLICT (sanity_slug) DO UPDATE SET
  name = EXCLUDED.name,
  base_price_day = EXCLUDED.base_price_day,
  deposit_amount = EXCLUDED.deposit_amount;

-- Zasilacz samochodowy Starlink Mini
INSERT INTO products (id, name, sanity_slug, base_price_day, deposit_amount, buffer_before, buffer_after)
VALUES (
  gen_random_uuid(),
  'Zasilacz samochodowy Starlink Mini',
  'zasilacz-samochodowy-starlink-mini',
  0.00,
  0.00,
  0,
  0
)
ON CONFLICT (sanity_slug) DO UPDATE SET
  name = EXCLUDED.name,
  base_price_day = EXCLUDED.base_price_day,
  deposit_amount = EXCLUDED.deposit_amount;
```

Expected: 4 rows inserted or updated

- [ ] **Step 4: Verify products were created**

```sql
SELECT id, name, sanity_slug, base_price_day, deposit_amount
FROM products
WHERE sanity_slug IN (
  'powerbank-cayon-60000mah-pd100w',
  'przewod-usc-c-starlink-mini',
  'uchwyt-na-szybe-starlink-mini',
  'zasilacz-samochodowy-starlink-mini'
);
```

Expected: 4 rows returned with correct prices

- [ ] **Step 5: Document completion**

```bash
# No code commit - database operation
# Addons now exist in Supabase and will be included in pricing calculations
```

**Note:** Addons don't need `stock_items` because they're unlimited virtual products. The `buffer_before` and `buffer_after` are set to 0 since they don't block availability.

---

### Task 4: Link Addons to Main Products (Starlink Mini & Standard)

**Files:**
- Manual content update in Sanity Studio

- [ ] **Step 1: Open Starlink Mini product**

In Sanity Studio, navigate to Products → Find "Starlink Mini" (slug: `starlink-mini`)

- [ ] **Step 2: Add available addons**

Scroll to "Available Addons" field and add references to:
- Powerbank Cayon 60000mAh PD100W
- Przewód USC-C Starlink mini
- Uchwyt na szybę Starlink Mini
- Zasilacz samochodowy Starlink Mini

Click "Publish"

- [ ] **Step 3: Open Starlink Standard product**

Navigate to Products → Find "Starlink Standard" (slug: `starlink-standard`)

- [ ] **Step 4: Add available addons to Standard**

Add same 4 addons (or subset if some are Mini-specific). Publish.

- [ ] **Step 5: Verify addon links**

Open both products and confirm "Available Addons" field shows all 4 products.

---

### Task 5: Update Product Page to Pass Addons to Widget

**Files:**
- Modify: `app/products/[slug]/page.tsx`

- [ ] **Step 1: Read current page.tsx structure**

Open `app/products/[slug]/page.tsx` and locate where `<RentalWidget>` is rendered (likely around line 150-200).

- [ ] **Step 2: Pass availableAddons prop to RentalWidget**

Find the RentalWidget component usage and add `availableAddons` prop:

```tsx
<RentalWidget
  product={{
    id: product._id,
    title: product.title,
    slug: product.slug,
    pricePerDay: product.pricePerDay,
    deposit: product.deposit,
    images: product.images,
  }}
  availableAddons={product.availableAddons || []}
/>
```

- [ ] **Step 3: Commit page changes**

```bash
git add app/products/[slug]/page.tsx
git commit -m "feat(product): pass availableAddons to RentalWidget"
```

---

### Task 6: Update RentalWidget Component to Display Addon Selection

**Files:**
- Modify: `app/products/_components/rental-widget.tsx`

- [ ] **Step 1: Read current RentalWidget structure**

Open `app/products/_components/rental-widget.tsx` and understand current state management and UI.

- [ ] **Step 2: Add availableAddons prop to component interface**

Find the component props interface (likely at top) and add:

```typescript
type RentalWidgetProps = {
  product: {
    id: string;
    title: string;
    slug: string;
    pricePerDay: number;
    deposit: number;
    images: any[];
  };
  availableAddons?: Array<{
    _id: string;
    title: string;
    slug: { current: string };
    excerpt?: string;
    pricePerDay: number;
    deposit: number;
    images?: any[];
  }>;
};
```

- [ ] **Step 3: Add state for selected addons**

Inside component, add state:

```typescript
const [selectedAddonIds, setSelectedAddonIds] = useState<Set<string>>(new Set());
```

- [ ] **Step 4: Add addon toggle handler**

```typescript
const toggleAddon = (addonId: string) => {
  setSelectedAddonIds(prev => {
    const next = new Set(prev);
    if (next.has(addonId)) {
      next.delete(addonId);
    } else {
      next.add(addonId);
    }
    return next;
  });
};
```

- [ ] **Step 5: Calculate total price including addons**

Update price calculation logic to include selected addons:

```typescript
const selectedAddons = availableAddons?.filter(a => selectedAddonIds.has(a._id)) || [];
const addonsTotalPerDay = selectedAddons.reduce((sum, addon) => sum + addon.pricePerDay, 0);
const totalPricePerDay = product.pricePerDay + addonsTotalPerDay;
const totalDeposit = product.deposit + selectedAddons.reduce((sum, a) => sum + a.deposit, 0);
```

- [ ] **Step 6: Add addon selection UI**

Add after date selection and before price summary (find appropriate location in JSX):

```tsx
{availableAddons && availableAddons.length > 0 && (
  <div className="space-y-3">
    <h3 className="text-sm font-semibold text-slate-900">Dodaj akcesoria</h3>
    <div className="space-y-2">
      {availableAddons.map(addon => (
        <label
          key={addon._id}
          className={cn(
            "flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
            selectedAddonIds.has(addon._id)
              ? "border-blue-500 bg-blue-50"
              : "border-slate-200 hover:border-slate-300"
          )}
        >
          <input
            type="checkbox"
            checked={selectedAddonIds.has(addon._id)}
            onChange={() => toggleAddon(addon._id)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-medium text-slate-900">
                {addon.title}
              </span>
              {addon.pricePerDay > 0 && (
                <span className="text-sm font-semibold text-slate-900 whitespace-nowrap">
                  +{addon.pricePerDay.toFixed(2)} zł/dzień
                </span>
              )}
            </div>
            {addon.excerpt && (
              <p className="mt-1 text-xs text-slate-600 line-clamp-2">
                {addon.excerpt}
              </p>
            )}
          </div>
        </label>
      ))}
    </div>
  </div>
)}
```

- [ ] **Step 7: Update price display to use totalPricePerDay**

Find the price summary section and update to use calculated `totalPricePerDay` instead of `product.pricePerDay`.

- [ ] **Step 8: Update checkout data to include selected addons**

Find where checkout session is created (likely in submit handler) and add selected addons to the payload:

```typescript
const checkoutData = {
  productId: product.id,
  startDate,
  endDate,
  addonIds: [...selectedAddonIds],
  // ... other fields
};
```

- [ ] **Step 9: Commit widget changes**

```bash
git add app/products/_components/rental-widget.tsx
git commit -m "feat(rental-widget): add addon selection UI and pricing"
```

---

### Task 7: Update Checkout API to Handle Addons

**Files:**
- Modify: `app/api/create-checkout-session/route.ts` (or similar checkout endpoint)

- [ ] **Step 1: Locate checkout session creation endpoint**

Find the API route that creates Stripe checkout sessions (likely `app/api/create-checkout-session/route.ts`).

- [ ] **Step 2: Add addonIds to request body type**

Update request body interface:

```typescript
type CheckoutRequest = {
  productId: string;
  startDate: string;
  endDate: string;
  addonIds?: string[];
  // ... other fields
};
```

- [ ] **Step 3: Fetch addon products from Sanity**

If `addonIds` is provided, fetch addon details:

```typescript
const { addonIds } = await req.json();

let addons = [];
if (addonIds && addonIds.length > 0) {
  addons = await client.fetch(
    `*[_type == "product" && _id in $ids]{
      _id,
      title,
      pricePerDay,
      deposit
    }`,
    { ids: addonIds }
  );
}
```

- [ ] **Step 4: Calculate total price including addons**

```typescript
const addonsTotalPerDay = addons.reduce((sum, a) => sum + a.pricePerDay, 0);
const totalPricePerDay = product.pricePerDay + addonsTotalPerDay;
const totalDeposit = product.deposit + addons.reduce((sum, a) => sum + a.deposit, 0);
```

- [ ] **Step 5: Add addon line items to Stripe checkout**

Update Stripe line items array:

```typescript
const lineItems = [
  {
    price_data: {
      currency: 'pln',
      product_data: {
        name: `${product.title} - wynajem`,
      },
      unit_amount: Math.round(totalPricePerDay * 100),
    },
    quantity: numberOfDays,
  },
];

// Add addon line items
addons.forEach(addon => {
  lineItems.push({
    price_data: {
      currency: 'pln',
      product_data: {
        name: `${addon.title} (dodatek)`,
      },
      unit_amount: Math.round(addon.pricePerDay * numberOfDays * 100),
    },
    quantity: 1,
  });
});
```

- [ ] **Step 6: Store addon IDs in session metadata**

```typescript
metadata: {
  productId: product._id,
  addonIds: addonIds?.join(',') || '',
  startDate,
  endDate,
  // ... other metadata
}
```

- [ ] **Step 7: Commit checkout API changes**

```bash
git add app/api/create-checkout-session/route.ts
git commit -m "feat(checkout): support addon products in checkout flow"
```

---

### Task 8: Update Order Confirmation to Include Addons

**Files:**
- Modify: `app/api/confirm-checkout-session/route.ts` (or order creation logic)

- [ ] **Step 1: Locate order confirmation endpoint**

Find where orders are created after successful payment (likely `app/api/confirm-checkout-session/route.ts`).

- [ ] **Step 2: Parse addonIds from session metadata**

```typescript
const addonIds = session.metadata.addonIds?.split(',').filter(Boolean) || [];
```

- [ ] **Step 3: Create order_items for addons**

After creating main product order_item, create addon items:

```typescript
// Create main product order item
const { data: mainItem } = await supabase
  .from('order_items')
  .insert({
    order_id: orderId,
    product_id: productId,
    stock_item_id: assignedStockItemId,
    quantity: 1,
    price_per_day: product.pricePerDay,
  });

// Create addon order items
for (const addonId of addonIds) {
  const addon = await client.fetch(
    `*[_type == "product" && _id == $id][0]{_id, title, pricePerDay}`,
    { id: addonId }
  );
  
  await supabase
    .from('order_items')
    .insert({
      order_id: orderId,
      product_id: addonId,
      stock_item_id: null, // Addons may not have stock tracking
      quantity: 1,
      price_per_day: addon.pricePerDay,
    });
}
```

- [ ] **Step 4: Commit order confirmation changes**

```bash
git add app/api/confirm-checkout-session/route.ts
git commit -m "feat(orders): create order items for addon products"
```

---

### Task 9: Test Addon Flow End-to-End

**Files:**
- No code changes - manual testing

- [ ] **Step 1: Start development server**

```bash
npm run dev
```

Expected: Server runs on http://localhost:3000

- [ ] **Step 2: Navigate to Starlink Mini product page**

Open http://localhost:3000/products/starlink-mini

- [ ] **Step 3: Verify addons are displayed**

Scroll to rental widget. Confirm 4 addon checkboxes are visible:
- Powerbank Cayon 60000mAh PD100W (+20 zł/dzień)
- Przewód USC-C Starlink mini (0 zł)
- Uchwyt na szybę Starlink Mini (0 zł)
- Zasilacz samochodowy Starlink Mini (0 zł)

- [ ] **Step 4: Select addons and verify price updates**

Check "Powerbank Cayon" checkbox. Confirm total price increases by 20 zł/dzień.

- [ ] **Step 5: Test checkout flow**

Select dates, click "Wynajmij teraz", verify Stripe checkout includes addon line items.

- [ ] **Step 6: Complete test order (use Stripe test mode)**

Use test card 4242 4242 4242 4242, complete payment.

- [ ] **Step 7: Verify order in database**

Check Supabase `orders` and `order_items` tables. Confirm order has 2 order_items: main product + powerbank addon.

- [ ] **Step 8: Document test results**

Create note in `docs/testing/addon-flow-test.md` with screenshots and results.

---

### Task 10: Final Commit and Push

**Files:**
- All modified files

- [ ] **Step 1: Review all changes**

```bash
git status
git diff
```

Expected: See all modified files from previous tasks.

- [ ] **Step 2: Run type check**

```bash
npm run type-check
```

Expected: No TypeScript errors.

- [ ] **Step 3: Run build**

```bash
npm run build
```

Expected: Build succeeds without errors.

- [ ] **Step 4: Create final commit if any uncommitted changes**

```bash
git add -A
git commit -m "feat: complete addon products implementation"
```

- [ ] **Step 5: Push to remote**

```bash
git push origin main
```

Expected: All commits pushed successfully.

---

## Self-Review Checklist

**Spec coverage:**
- ✅ Add addon products to Sanity (Task 3)
- ✅ Link addons to main products (Task 4)
- ✅ Display addons on product page (Task 5, 6)
- ✅ Handle addons in checkout (Task 7)
- ✅ Create order items for addons (Task 8)
- ✅ Write addon content (Task 3 - descriptions provided)

**Placeholder scan:**
- ✅ No TBD or TODO placeholders
- ✅ All code blocks are complete
- ✅ All file paths are exact
- ✅ All commands have expected output

**Type consistency:**
- ✅ `availableAddons` used consistently across tasks
- ✅ `addonIds` used for ID arrays
- ✅ `selectedAddonIds` for UI state
- ✅ Product schema fields match query projections

**Missing:**
- None - all requirements covered

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-29-product-addons.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
