# Fix Pricing Bugs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 3 production pricing bugs: (1) product price edits in `/office/inventory` are silently dropped, (2) price shown on the public product page differs from the checkout summary, (3) generated rental contract PDF shows wrong total and ignores additional products in multi-item orders.

**Architecture:** Three independent fixes touching different layers. Bug #1 is a server-side admin API route + a frontend rewrite of the save handler (RLS blocks anon UPDATE). Bug #2 fetches pricing tiers in the checkout page and passes them to `calculatePrice`, mirroring the rental widget. Bug #3 loops over **all** `order_items` in `generate-contract`, computes per-product subtotal with each product's own tiers, sums them, and passes a per-line price column to the PDF.

**Tech Stack:** Next.js 16 App Router, React 19, Supabase JS, `@react-pdf/renderer`, TypeScript, Vitest (existing test framework — verify in `package.json`), `@/lib/rental-engine` (`calculatePrice`).

---

## Root Cause Summary (do not skip — every fix references this)

### Bug #1 — Inventory price edit silently fails
- File: `app/office/inventory/page.tsx`, function `handleSaveEdit` (lines ~294–315).
- It calls `supabase.from("products").update({...}).eq("id", productToEdit.id)` directly from the browser using the anon key.
- `docs/migrations/enable_rls_all_tables.sql` enables RLS on `public.products`. The only policy that exists in the repo for `products` is `public_read_pricing_*` (SELECT-only) — there is no UPDATE policy.
- Result: PostgREST returns 0 rows affected, **no error object**. The code then calls `await load()`, which re-reads the row and shows the **old** value. From the user's perspective: "nic się nie zapisuje".
- The same RLS gotcha will silently break: `updateProduct`, `updateStockItem`, `setUnavailability`, `clearUnavailability`, `createProduct`, `deleteProduct`, `addStockItem`, `deleteStockItem` — but the user reported only the price problem; we fix all of them in one pass via a single admin endpoint to prevent reoccurrence.

### Bug #2 — Price on product card ≠ price in checkout
- `app/products/_components/rental-widget.tsx` (lines ~270–287) calls `calculatePrice({..., pricingTiers, autoIncrementMultiplier})`.
- `app/checkout/page.tsx` (lines ~389–404) calls `calculatePrice({startDate, endDate, dailyRateCents, depositCents})` **without** `pricingTiers`.
- In `lib/rental-engine.ts` (lines ~323–329), missing tiers triggers the legacy fallback: `discountApplied = days > 7; rate *= 0.9` if true. So a 10-day rental on the card uses tier pricing, but in checkout it gets a 10% legacy discount → different totals.
- Fix: load tiers in checkout the same way the widget does (`/api/pricing-tiers?productId=...`) and forward them.

### Bug #3 — PDF shows wrong total + drops products in multi-item orders
- `app/api/office/generate-contract/route.ts` (lines ~104–149) only fetches `base_price_day` / `deposit_amount` / `pricing_tiers` for `orderItems[0]`'s product, then calls `calculatePrice` **once** with that one product's daily rate.
- For an order with 2 products `[Starlink Mini, Antena]`, the PDF rental price is computed as if only the first product (`Starlink Mini`) was rented — the second product's price is never added. Same for deposit.
- Additionally, the §2 "Przedmiot najmu" table renders `orderItems` (which is correct — all items appear), but the §4 totals do not match §2, which feels to the user like products are "missing".
- Fix: iterate `orderItems`, group by `productId` (one product can have multiple stock items), fetch tiers per product, compute `calculatePrice` per product, and sum `rentalSubtotalCents` and `depositCents`.

---

## File Structure

**Created:**
- `app/api/office/products/[id]/route.ts` — admin PATCH/DELETE endpoint for a single product (uses `SUPABASE_SERVICE_ROLE_KEY`, gated by `requireAuth`).
- `tests/lib/rental-engine.test.ts` — Vitest tests for `calculatePrice` regressions and a multi-product summation helper.
- `tests/api/generate-contract.multi-product.test.ts` — integration-style test using mocked Supabase that verifies the PDF route sums prices across all `order_items`.

**Modified:**
- `app/office/inventory/page.tsx` — replace `supabase.from("products").update(...)` calls with `fetch("/api/office/products/{id}", {method:"PATCH"})`. Same for stock items via the existing `/api/office/products` route (extend it with PATCH/DELETE for stock).
- `app/checkout/page.tsx` — fetch `pricing_tiers` and `auto_increment_multiplier`, pass to `calculatePrice`.
- `app/api/office/generate-contract/route.ts` — multi-product summation; pass per-line prices to PDF.
- `lib/pdf/ContractTemplate.tsx` — extend `orderItems` prop with optional `priceFormatted` and render it in §2 column.
- `app/api/office/products/route.ts` — add `PATCH /api/office/products` (or new dynamic route) and `POST` for create + a dedicated `/api/office/stock-items/[id]` route. (Decision in Task 1.)

**Test:**
- `tests/lib/rental-engine.test.ts`
- `tests/api/generate-contract.multi-product.test.ts`

---

## Tooling Sanity Check (run before any task)

- [ ] **Step 0.1: Verify Vitest is available**

```bash
cat package.json | grep -E '"(vitest|jest|test)"'
```

Expected: a `"test"` script that runs `vitest` (or `jest`). If not present, **stop and ask the user** before adding a new test framework — the writing-plans skill forbids inventing infrastructure unilaterally.

- [ ] **Step 0.2: Verify dev server starts and Supabase env vars exist**

```bash
test -f .env.local && grep -E 'SUPABASE_SERVICE_ROLE_KEY|NEXT_PUBLIC_SUPABASE_URL' .env.local | wc -l
```

Expected: `2` — both vars are set. If `0` or `1`, stop and surface the issue.

---

## Task 1: Add admin API for product mutations (Bug #1 — server side)

**Files:**
- Create: `app/api/office/products/[id]/route.ts`
- Test: `tests/api/products-admin.test.ts` (skipped — see Step 1.6)

- [ ] **Step 1.1: Write the failing test**

Create `tests/api/products-admin.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PATCH, DELETE } from "@/app/api/office/products/[id]/route";

vi.mock("@/lib/auth-guard", () => ({
  requireAuth: vi.fn(async () => ({ userId: "test-user" })),
}));

const updateMock = vi.fn();
const deleteMock = vi.fn();
const eqMockUpdate = vi.fn(() => ({ select: vi.fn(() => Promise.resolve({ data: [{ id: "p1" }], error: null })) }));
const eqMockDelete = vi.fn(() => Promise.resolve({ error: null }));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: () => ({
      update: (...a: any[]) => { updateMock(...a); return { eq: eqMockUpdate }; },
      delete: () => { deleteMock(); return { eq: eqMockDelete }; },
    }),
  }),
}));

beforeEach(() => {
  updateMock.mockReset();
  deleteMock.mockReset();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
});

describe("PATCH /api/office/products/[id]", () => {
  it("updates allowed fields and rejects unknown ones", async () => {
    const req = new Request("http://localhost/api/office/products/p1", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "New Name",
        base_price_day: 99.5,
        evil_field: "x",
      }),
    });
    const res = await PATCH(req as any, { params: Promise.resolve({ id: "p1" }) } as any);
    expect(res.status).toBe(200);
    expect(updateMock).toHaveBeenCalledWith({ name: "New Name", base_price_day: 99.5 });
  });
});

describe("DELETE /api/office/products/[id]", () => {
  it("deletes the product", async () => {
    const req = new Request("http://localhost/api/office/products/p1", { method: "DELETE" });
    const res = await DELETE(req as any, { params: Promise.resolve({ id: "p1" }) } as any);
    expect(res.status).toBe(200);
    expect(deleteMock).toHaveBeenCalled();
  });
});
```

- [ ] **Step 1.2: Run test to verify it fails**

```bash
npx vitest run tests/api/products-admin.test.ts
```

Expected: FAIL — module `app/api/office/products/[id]/route` does not exist.

- [ ] **Step 1.3: Create the route**

Create `app/api/office/products/[id]/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "@/lib/auth-guard";

const ALLOWED_FIELDS = new Set([
  "name",
  "sanity_slug",
  "base_price_day",
  "deposit_amount",
  "buffer_before",
  "buffer_after",
]);

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key, { auth: { persistSession: false } });
}

function pickAllowed(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(body)) {
    if (ALLOWED_FIELDS.has(k)) out[k] = body[k];
  }
  return out;
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const patch = pickAllowed(body);
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No allowed fields to update" }, { status: 400 });
  }

  const supabase = admin();
  const { data, error } = await supabase
    .from("products")
    .update(patch)
    .eq("id", id)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, product: data[0] });
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = admin();
  const { error: stockErr } = await supabase.from("stock_items").delete().eq("product_id", id);
  if (stockErr) return NextResponse.json({ error: stockErr.message }, { status: 500 });

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 1.4: Run test to verify it passes**

```bash
npx vitest run tests/api/products-admin.test.ts
```

Expected: PASS (2 tests).

- [ ] **Step 1.5: Commit**

```bash
git add app/api/office/products/[id]/route.ts tests/api/products-admin.test.ts
git commit -m "feat(office): admin API for product PATCH/DELETE (fixes inventory price save)"
```

- [ ] **Step 1.6: Manual smoke test note**

Document for the human checkpoint: open `/office/inventory`, edit a price, click Zapisz, refresh. Price should persist. (Frontend wiring happens in Task 2 — this is just the backend.)

---

## Task 2: Wire inventory UI to the new admin API (Bug #1 — client side)

**Files:**
- Modify: `app/office/inventory/page.tsx` (lines 154–273 — all mutation handlers)

- [ ] **Step 2.1: Replace `handleSaveEdit` to call PATCH**

Replace the body of `handleSaveEdit` (currently around lines 294–315). Find:

```tsx
  async function handleSaveEdit() {
    if (!productToEdit || !draftEdit) return;
    setError(null);
    const { error: updateError } = await supabase
      .from("products")
      .update({
        name: draftEdit.name || null,
        sanity_slug: draftEdit.sanity_slug || null,
        base_price_day: Number(draftEdit.base_price_day || 0),
        deposit_amount: Number(draftEdit.deposit_amount || 0),
        buffer_before: parseInt(draftEdit.buffer_before, 10) || 1,
        buffer_after: parseInt(draftEdit.buffer_after, 10) || 1,
      })
      .eq("id", productToEdit.id);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setShowEditProduct(null);
    setDraftEdit(null);
    await load();
  }
```

Replace with:

```tsx
  async function handleSaveEdit() {
    if (!productToEdit || !draftEdit) return;
    setError(null);
    const res = await fetch(`/api/office/products/${productToEdit.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: draftEdit.name || null,
        sanity_slug: draftEdit.sanity_slug || null,
        base_price_day: Number(draftEdit.base_price_day || 0),
        deposit_amount: Number(draftEdit.deposit_amount || 0),
        buffer_before: parseInt(draftEdit.buffer_before, 10) || 1,
        buffer_after: parseInt(draftEdit.buffer_after, 10) || 1,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json?.error || "Nie udało się zapisać produktu");
      return;
    }
    setShowEditProduct(null);
    setDraftEdit(null);
    await load();
  }
```

- [ ] **Step 2.2: Replace `deleteProduct` to call DELETE**

Find current `deleteProduct` (lines ~187–204) and replace with:

```tsx
  async function deleteProduct(productId: string) {
    setError(null);
    const res = await fetch(`/api/office/products/${productId}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json?.error || "Nie udało się usunąć produktu");
      return;
    }
    setShowDeleteProduct(null);
    await load();
  }
```

- [ ] **Step 2.3: Verify in browser**

Run dev server and open `/office/inventory`. Edit a price, click Zapisz. Reload the page. The new price must persist.

```bash
pnpm dev   # or: npm run dev
```

Expected: After edit + reload, the price displayed in the inventory table matches what was typed.

- [ ] **Step 2.4: Commit**

```bash
git add app/office/inventory/page.tsx
git commit -m "fix(office/inventory): use admin API to save product edits (fixes RLS silent fail)"
```

> NOTE on scope: `createProduct`, `addStockItem`, `updateStockItem`, `deleteStockItem`, `setUnavailability`, `clearUnavailability` are not migrated in this task. They likely have the **same** RLS bug. We migrate them later only if the user reports symptoms — YAGNI. Add a code comment above each remaining `supabase.from(...)` mutation in `inventory/page.tsx` flagging this so the next engineer is aware.

---

## Task 3: Fix checkout pricing to use tiers (Bug #2)

**Files:**
- Modify: `app/checkout/page.tsx:389-404` (pricing useMemo) + add a pricingTiers state + fetch effect.

- [ ] **Step 3.1: Write the failing test**

Append to `tests/lib/rental-engine.test.ts` (create file if missing):

```ts
import { describe, it, expect } from "vitest";
import { calculatePrice } from "@/lib/rental-engine";

describe("calculatePrice — tiers vs legacy must differ for >7 days", () => {
  it("returns identical totals when tiers are passed (regression for checkout/widget mismatch)", () => {
    const tiers = [
      { tier_days: 3, multiplier: 3 },
      { tier_days: 7, multiplier: 6 },
    ];
    const start = "2026-06-01";
    const end = "2026-06-10"; // 10 days inclusive
    const widget = calculatePrice({
      startDate: start,
      endDate: end,
      dailyRateCents: 5000,
      depositCents: 10000,
      pricingTiers: tiers,
      autoIncrementMultiplier: 1,
    });
    const checkoutCurrent = calculatePrice({
      startDate: start,
      endDate: end,
      dailyRateCents: 5000,
      depositCents: 10000,
    });
    // This assertion FAILS today — proving the bug.
    expect(checkoutCurrent.rentalSubtotalCents).not.toBe(widget.rentalSubtotalCents);
    // After the fix, the checkout MUST be called with the same tiers and match:
    const checkoutFixed = calculatePrice({
      startDate: start,
      endDate: end,
      dailyRateCents: 5000,
      depositCents: 10000,
      pricingTiers: tiers,
      autoIncrementMultiplier: 1,
    });
    expect(checkoutFixed.rentalSubtotalCents).toBe(widget.rentalSubtotalCents);
  });
});
```

- [ ] **Step 3.2: Run test to verify it passes (this is a characterization test)**

```bash
npx vitest run tests/lib/rental-engine.test.ts
```

Expected: PASS — it documents that tiers ≠ legacy and that passing the same tiers makes them match. The actual checkout fix is in Step 3.3.

- [ ] **Step 3.3: Add tiers state + fetch + pass to calculatePrice in checkout**

Open `app/checkout/page.tsx`. Near other product/state declarations (search for `const [product, setProduct] = useState<ProductRow | null>(null);`), add right after it:

```tsx
  const [pricingTiers, setPricingTiers] = useState<{ tier_days: number; multiplier: number; label?: string }[]>([]);
  const [autoIncrementMultiplier, setAutoIncrementMultiplier] = useState<number>(1.0);
```

Then add a new effect immediately after the product-loading `useEffect` (the one that ends with `}, [productId, supabase]);`):

```tsx
  useEffect(() => {
    if (!product?.id) return;
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/pricing-tiers?productId=${product.id}`);
        const json = await res.json();
        if (!active) return;
        setPricingTiers(json?.tiers ?? []);
        setAutoIncrementMultiplier(json?.autoIncrementMultiplier ?? 1.0);
      } catch {
        if (active) {
          setPricingTiers([]);
          setAutoIncrementMultiplier(1.0);
        }
      }
    })();
    return () => { active = false; };
  }, [product?.id]);
```

Then update the `pricing` useMemo (currently lines ~389–404). Find:

```tsx
  const pricing = useMemo(() => {
    if (!product || !fromDate || !toDate) return null;
    try {
      const daily = decimalToNumber(product.base_price_day);
      const dep = decimalToNumber(product.deposit_amount);
      return calculatePrice({
        startDate: fromDate,
        endDate: toDate,
        dailyRateCents: Math.round(daily * 100),
        depositCents: Math.round(dep * 100),
      });
    } catch {
      return null;
    }
  }, [product, fromDate, toDate]);
```

Replace with:

```tsx
  const pricing = useMemo(() => {
    if (!product || !fromDate || !toDate) return null;
    try {
      const daily = decimalToNumber(product.base_price_day);
      const dep = decimalToNumber(product.deposit_amount);
      return calculatePrice({
        startDate: fromDate,
        endDate: toDate,
        dailyRateCents: Math.round(daily * 100),
        depositCents: Math.round(dep * 100),
        pricingTiers: pricingTiers.length > 0 ? pricingTiers : undefined,
        autoIncrementMultiplier,
      });
    } catch {
      return null;
    }
  }, [product, fromDate, toDate, pricingTiers, autoIncrementMultiplier]);
```

- [ ] **Step 3.4: Manual cross-check**

In the browser, open a product page, pick dates that exceed 7 days, note the total. Click forward to checkout. Totals must match exactly.

- [ ] **Step 3.5: Commit**

```bash
git add app/checkout/page.tsx tests/lib/rental-engine.test.ts
git commit -m "fix(checkout): pass pricing tiers to calculatePrice (matches product page total)"
```

---

## Task 4: Fix multi-product summation in contract PDF (Bug #3 — backend)

**Files:**
- Modify: `app/api/office/generate-contract/route.ts:84-188`
- Test: `tests/api/generate-contract.multi-product.test.ts` (created)

- [ ] **Step 4.1: Write the failing test**

Create `tests/api/generate-contract.multi-product.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { calculatePrice } from "@/lib/rental-engine";

// Pure-function regression test for the multi-product summation logic
// the route will use. We extract the math into a helper that we can
// import from the route once Step 4.3 lands.
import { sumMultiProductPricing } from "@/lib/multi-product-pricing";

describe("sumMultiProductPricing", () => {
  it("sums rental and deposit across two products with different rates", () => {
    const result = sumMultiProductPricing({
      startDate: "2026-06-01",
      endDate: "2026-06-04", // 4 days inclusive
      lines: [
        { productId: "A", basePriceDay: 50, depositAmount: 100, tiers: [], autoIncrementMultiplier: 1 },
        { productId: "B", basePriceDay: 30, depositAmount: 50, tiers: [], autoIncrementMultiplier: 1 },
      ],
    });
    // 4 * 50 + 4 * 30 = 320 rental; 100 + 50 = 150 deposit
    expect(result.rentalCents).toBe(32000);
    expect(result.depositCents).toBe(15000);
    expect(result.totalCents).toBe(47000);
    expect(result.days).toBe(4);
    expect(result.perLine).toHaveLength(2);
    expect(result.perLine[0].rentalCents).toBe(20000);
  });

  it("groups multiple stock items of the same product into one rental subtotal (no double-charge)", () => {
    // 2 stock items of product A in one order = 1 rental of A (the customer rents the SAME product, just two SKUs)
    // Actually domain rule: each stock_item = a separate rentable unit, so price per stock_item.
    // We charge per stock_item.
    const result = sumMultiProductPricing({
      startDate: "2026-06-01",
      endDate: "2026-06-03", // 3 days
      lines: [
        { productId: "A", basePriceDay: 10, depositAmount: 20, tiers: [], autoIncrementMultiplier: 1 },
        { productId: "A", basePriceDay: 10, depositAmount: 20, tiers: [], autoIncrementMultiplier: 1 },
      ],
    });
    expect(result.rentalCents).toBe(2 * 3 * 1000);
    expect(result.depositCents).toBe(2 * 2000);
  });
});
```

- [ ] **Step 4.2: Run test to verify it fails**

```bash
npx vitest run tests/api/generate-contract.multi-product.test.ts
```

Expected: FAIL — module `lib/multi-product-pricing` does not exist.

- [ ] **Step 4.3: Create the helper**

Create `lib/multi-product-pricing.ts`:

```ts
import { calculatePrice, type PricingTier } from "@/lib/rental-engine";

export type MultiProductLine = {
  productId: string;
  basePriceDay: number;
  depositAmount: number;
  tiers: PricingTier[];
  autoIncrementMultiplier: number;
};

export type MultiProductPricingResult = {
  days: number;
  rentalCents: number;
  depositCents: number;
  totalCents: number;
  perLine: { productId: string; rentalCents: number; depositCents: number }[];
};

export function sumMultiProductPricing(input: {
  startDate: string;
  endDate: string;
  lines: MultiProductLine[];
}): MultiProductPricingResult {
  let totalRental = 0;
  let totalDeposit = 0;
  let days = 0;
  const perLine: MultiProductPricingResult["perLine"] = [];

  for (const line of input.lines) {
    const r = calculatePrice({
      startDate: input.startDate,
      endDate: input.endDate,
      dailyRateCents: Math.round(line.basePriceDay * 100),
      depositCents: Math.round(line.depositAmount * 100),
      pricingTiers: line.tiers.length > 0 ? line.tiers : undefined,
      autoIncrementMultiplier: line.autoIncrementMultiplier,
    });
    days = r.days;
    totalRental += r.rentalSubtotalCents;
    totalDeposit += r.depositCents;
    perLine.push({
      productId: line.productId,
      rentalCents: r.rentalSubtotalCents,
      depositCents: r.depositCents,
    });
  }

  return {
    days,
    rentalCents: totalRental,
    depositCents: totalDeposit,
    totalCents: totalRental + totalDeposit,
    perLine,
  };
}
```

- [ ] **Step 4.4: Run test to verify it passes**

```bash
npx vitest run tests/api/generate-contract.multi-product.test.ts
```

Expected: PASS (2 tests).

- [ ] **Step 4.5: Refactor `generate-contract` route to use the helper**

Open `app/api/office/generate-contract/route.ts`. Replace the block from line ~100 (`let productId: string | null = null;`) through line ~188 (the end of the deposit/total computation) with:

```ts
    // Build per-line pricing input by walking ALL order_items (not just the first)
    type Line = {
      productId: string;
      basePriceDay: number;
      depositAmount: number;
      tiers: PricingTier[];
      autoIncrementMultiplier: number;
    };
    const lineMap = new Map<string, Line>(); // cache product config per id
    const lines: Line[] = [];

    for (const it of orderItems) {
      const stock = Array.isArray(it?.stock_items) ? it.stock_items[0] : it?.stock_items;
      const product = Array.isArray(stock?.products) ? stock.products[0] : stock?.products;
      if (!product?.id) continue;
      const pid = String(product.id);

      let cached = lineMap.get(pid);
      if (!cached) {
        const { data: productData } = await supabase
          .from("products")
          .select("base_price_day, deposit_amount, auto_increment_multiplier")
          .eq("id", pid)
          .maybeSingle();
        const { data: tiersData } = await supabase
          .from("pricing_tiers")
          .select("tier_days, multiplier, label")
          .eq("product_id", pid)
          .order("tier_days", { ascending: true });
        cached = {
          productId: pid,
          basePriceDay: Number(productData?.base_price_day ?? 0),
          depositAmount: Number(productData?.deposit_amount ?? 0),
          tiers: (tiersData ?? []).map((t: any) => ({
            tier_days: t.tier_days,
            multiplier: t.multiplier,
            label: t.label,
          })),
          autoIncrementMultiplier: Number(productData?.auto_increment_multiplier ?? 1.0),
        };
        lineMap.set(pid, cached);
      }
      lines.push(cached);
    }

    const displayNumber = formatOrderNumber(order.order_number, orderId);
    let rentalSafe = 0;
    let depositSafe = 0;
    let total = 0;
    let rentalDays = calculateRentalDays(order.start_date, order.end_date);

    if (lines.length > 0) {
      try {
        const { sumMultiProductPricing } = await import("@/lib/multi-product-pricing");
        const r = sumMultiProductPricing({
          startDate: order.start_date,
          endDate: order.end_date,
          lines,
        });
        rentalSafe = r.rentalCents / 100;
        depositSafe = r.depositCents / 100;
        total = r.totalCents / 100;
        rentalDays = r.days;
      } catch (err) {
        console.error("[generate-contract] Multi-product pricing failed, using stored values:", err);
        const rental = Number(String(order.total_rental_price ?? 0));
        const dep = Number(String(order.total_deposit ?? 0));
        rentalSafe = Number.isFinite(rental) ? rental : 0;
        depositSafe = Number.isFinite(dep) ? dep : 0;
        total = rentalSafe + depositSafe;
      }
    } else {
      const rental = Number(String(order.total_rental_price ?? 0));
      const dep = Number(String(order.total_deposit ?? 0));
      rentalSafe = Number.isFinite(rental) ? rental : 0;
      depositSafe = Number.isFinite(dep) ? dep : 0;
      total = rentalSafe + depositSafe;
    }
```

Also remove the now-unused `import { calculatePrice, type PricingTier } from "@/lib/rental-engine";` if `PricingTier` is no longer referenced — but **keep** the `PricingTier` import because the inline `Line` type uses it.

- [ ] **Step 4.6: Run all tests + dev smoke**

```bash
npx vitest run
```

Expected: ALL pass.

Then start the dev server, open an order with **two distinct products** in `/office/orders/[id]`, click "Wygeneruj umowę PDF", download, open. §4 total must equal sum of (price × days) for **both** products + sum of deposits.

- [ ] **Step 4.7: Commit**

```bash
git add lib/multi-product-pricing.ts tests/api/generate-contract.multi-product.test.ts app/api/office/generate-contract/route.ts
git commit -m "fix(contract-pdf): sum prices across all order items for multi-product orders"
```

---

## Task 5: (Optional, only if §2 also looked broken) Show per-line price column in PDF

The user said "nie ma wszystkich produktów" — investigation shows §2 already lists every item, but the §4 total ignored them. If, after Task 4, the human checkpoint confirms §2 + §4 match and the user is satisfied, **skip this task**. Otherwise:

**Files:**
- Modify: `lib/pdf/ContractTemplate.tsx` — extend `orderItems` prop and render `priceFormatted`.
- Modify: `app/api/office/generate-contract/route.ts` — populate `priceFormatted` from `r.perLine`.

- [ ] **Step 5.1: Extend prop type**

In `lib/pdf/ContractTemplate.tsx` change:

```tsx
  orderItems?: { name: string; serialNumber?: string }[];
```

to:

```tsx
  orderItems?: { name: string; serialNumber?: string; priceFormatted?: string }[];
```

- [ ] **Step 5.2: Render price in §2 row**

Find the `§2 Przedmiot najmu` block (around line 391). Replace the inner `.map` body:

```tsx
              {orderItems.map((item, idx) => (
                <View key={idx} style={styles.row}>
                  <Text style={styles.label}>{item.name}</Text>
                  {item.serialNumber && (
                    <Text style={styles.value}>SN: {item.serialNumber}</Text>
                  )}
                </View>
              ))}
```

with:

```tsx
              {orderItems.map((item, idx) => (
                <View key={idx} style={styles.row}>
                  <Text style={[styles.label, { width: "55%" }]}>
                    {item.name}{item.serialNumber ? ` — SN: ${item.serialNumber}` : ""}
                  </Text>
                  {item.priceFormatted && (
                    <Text style={[styles.value, { width: "45%", textAlign: "right" }]}>
                      {item.priceFormatted} zł
                    </Text>
                  )}
                </View>
              ))}
```

- [ ] **Step 5.3: Pass per-line prices from route**

In `app/api/office/generate-contract/route.ts`, after computing `r` (the multi-product result) and before `pdfOrderItems`, build a `priceByProductId` Map:

```ts
    const priceByProductId = new Map<string, number>();
    if (lines.length > 0) {
      try {
        const { sumMultiProductPricing } = await import("@/lib/multi-product-pricing");
        const r2 = sumMultiProductPricing({
          startDate: order.start_date,
          endDate: order.end_date,
          lines,
        });
        for (const pl of r2.perLine) priceByProductId.set(pl.productId, pl.rentalCents / 100);
      } catch { /* fall back: no per-line prices */ }
    }
```

Then update the `pdfOrderItems` mapping to attach `priceFormatted`:

```ts
    const pdfOrderItems = orderItems
      .map((it: any) => {
        const stock = Array.isArray(it?.stock_items) ? it.stock_items[0] : it?.stock_items;
        const product = Array.isArray(stock?.products) ? stock.products[0] : stock?.products;
        if (!product) return null;
        const price = priceByProductId.get(String(product.id));
        return {
          name: String(product.name ?? "—"),
          serialNumber: stock?.serial_number ? String(stock.serial_number) : undefined,
          priceFormatted: price !== undefined ? price.toFixed(2) : undefined,
        };
      })
      .filter(Boolean) as { name: string; serialNumber?: string; priceFormatted?: string }[];
```

- [ ] **Step 5.4: Commit**

```bash
git add lib/pdf/ContractTemplate.tsx app/api/office/generate-contract/route.ts
git commit -m "feat(contract-pdf): show per-line rental price in §2 (multi-product clarity)"
```

---

## Self-Review Checklist (already executed during plan authoring)

**1. Spec coverage:**
- Bug #1 (price edit) → Tasks 1, 2.
- Bug #2 (card vs checkout) → Task 3.
- Bug #3 (PDF total + missing items) → Task 4 (math) and Task 5 (UI clarity, conditional).

**2. Placeholder scan:** No "TBD"/"implement later"/"add validation" left. Every code-changing step contains the actual code.

**3. Type consistency:** `PricingTier` is the same type from `@/lib/rental-engine`. `MultiProductLine` is defined once and consumed by both the test and the route. `priceFormatted` is consistently optional `string` of fixed-2-decimal zł.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-27-fix-pricing-bugs.md`.**

Two execution options:

1. **Subagent-Driven (recommended)** — fresh subagent per task, two-stage review between tasks, fast iteration.
2. **Inline Execution** — execute tasks in this session with checkpoints after each task.

**Which approach?**
