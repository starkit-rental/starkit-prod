# Pricing Tiers Table Schema

## Table: `pricing_tiers`

This table stores tiered pricing structures for products, enabling progressive multiplier-based pricing.

### Columns

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique identifier |
| `product_id` | `uuid` | NOT NULL, REFERENCES `products(id)` ON DELETE CASCADE | Product this tier belongs to |
| `tier_days` | `integer` | NOT NULL | Number of rental days for this tier threshold |
| `multiplier` | `numeric(10,2)` | NOT NULL | Multiplier to apply to base_price_day |
| `label` | `text` | NULL | Display label (e.g., "1 day", "2 days") |
| `sort_order` | `integer` | DEFAULT 0 | Order for display in UI |
| `created_at` | `timestamptz` | DEFAULT `now()` | Creation timestamp |
| `updated_at` | `timestamptz` | DEFAULT `now()` | Last update timestamp |

### Indexes

```sql
CREATE INDEX idx_pricing_tiers_product_id ON pricing_tiers(product_id);
CREATE INDEX idx_pricing_tiers_tier_days ON pricing_tiers(tier_days);
```

### Example SQL Migration

```sql
CREATE TABLE pricing_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tier_days integer NOT NULL,
  multiplier numeric(10,2) NOT NULL,
  label text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_pricing_tiers_product_id ON pricing_tiers(product_id);
CREATE INDEX idx_pricing_tiers_tier_days ON pricing_tiers(tier_days);
```

### Usage Example

For a product with `base_price_day = 100 zł`:

| tier_days | multiplier | label | Resulting price |
|-----------|-----------|-------|-----------------|
| 1 | 1.0 | "1 day" | 100 zł |
| 2 | 2.0 | "2 days" | 200 zł |
| 3 | 3.0 | "3 days" | 300 zł |
| 7 | 6.5 | "7 days" | 650 zł |
| 14 | 12.0 | "14 days" | 1200 zł |

### Pricing Logic

The `calculatePrice` function in `lib/rental-engine.ts`:

1. Sorts tiers by `tier_days` ascending
2. Finds the highest tier where `tier_days <= rental_days`
3. Applies `base_price_day * multiplier` for matched tier
4. If rental exceeds highest tier, uses `autoIncrementMultiplier` for extra days

### Products Table Extension

The `products` table needs an additional column for automatic increments:

```sql
ALTER TABLE products ADD COLUMN auto_increment_multiplier numeric(10,2) DEFAULT 1.0;
```

This multiplier is applied to `base_price_day` for each day beyond the highest tier.

### API Endpoints

- `GET /api/pricing-tiers?productId={uuid}` - Fetch tiers and autoIncrementMultiplier for a product
- `POST /api/pricing-tiers` - Save tiers and autoIncrementMultiplier for a product (replaces all existing)

### Admin UI

Located at `/office/settings/pricing` - Booqable-style interface for managing:
- Pricing tiers per product (tiered multipliers)
- Automatic increments (multiplier for days beyond highest tier)
