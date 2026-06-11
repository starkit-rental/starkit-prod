# GlobKurier API Integration - Fixes Summary

## Overview
Complete fix of GlobKurier API integration for creating outbound and return shipments with InPost paczkomaty, including carrier search, order creation, and label PDF download.

## Issues Fixed

### 1. ✅ Carrier Search Returns No Results
**Problem:** `/products` endpoint with `flatList=true` returns grouped response under keys like `standard`, `fast`, etc., but code expected flat array.

**Fix:** Updated `searchProducts` in `lib/courier/globkurier/api.ts` to parse `response.standard` key.

```typescript
// Before
const items: any[] = Array.isArray(response) ? response : response.items || [];

// After
const items: any[] = Array.isArray(response) 
  ? response 
  : response.standard || response.items || [];
```

**Files Changed:**
- `lib/courier/globkurier/api.ts` (lines 197-201)

---

### 2. ✅ Saturday Delivery Addon Rejected
**Problem:** InPost paczkomaty reject `SATURDAY_DELIVERY` addon category. Correct category is `WEEKEND_DELIVERY`.

**Fix:** Updated order creation to use `WEEKEND_DELIVERY` addon when `saturdayDelivery` option is selected.

```typescript
if (saturdayDelivery) {
  addons.WEEKEND_DELIVERY = {};
}
```

**Files Changed:**
- `app/api/courier/globkurier/create-shipment/route.ts` (lines 120-123)

---

### 3. ✅ Missing NIP Field
**Problem:** Order creation missing optional `nip` (tax ID) field for sender and receiver addresses.

**Fix:** Added `nip` field to both sender and receiver address objects, populated from sender config and customer data.

**Files Changed:**
- `lib/courier/types.ts` - Added `nip?: string` to `SenderConfig`
- `app/api/courier/globkurier/create-shipment/route.ts` - Added `nip` to address objects and customer query

---

### 4. ✅ Order Hash Not Captured
**Problem:** Order response includes `hash` field needed for bulk label download, but it wasn't being saved to database.

**Fix:** 
1. Added `hash` field to `GlobKurierOrderResponse` type
2. Captured `orderResponse.hash` and saved to `globkurier_order_hash` column

**Files Changed:**
- `lib/courier/globkurier/types.ts` - Added `hash?: string` to response type
- `app/api/courier/globkurier/create-shipment/route.ts` - Save hash to DB

---

### 5. ✅ Label Download Inefficient
**Problem:** Labels downloaded individually per order number, requiring multiple API calls and PDF merging with pdf-lib.

**Fix:** Implemented bulk label download using `/order/labels?orderHashes[]=hash1&orderHashes[]=hash2&format=A4` endpoint which returns merged PDF directly.

**Implementation:**
1. Added `getLabelsByHashes()` method to API client
2. Updated request method to handle binary PDF responses with `binary: true` flag
3. Simplified labels route to collect hashes and download merged PDF in one call

**Files Changed:**
- `lib/courier/globkurier/api.ts` - Added binary response handling and `getLabelsByHashes()` method
- `app/api/courier/globkurier/labels/route.ts` - Replaced individual fetching with bulk download
- Removed dependency on `pdf-lib` for label merging (now handled by API)

---

### 6. ✅ Hardcoded Fallback Data
**Problem:** Customer phone defaulted to `'000000000'` if missing.

**Fix:** Added validation to reject requests with missing required fields instead of using dummy data.

```typescript
if (!customer.phone) {
  return NextResponse.json({ error: 'Customer phone number is required' }, { status: 400 });
}
if (!customer.email) {
  return NextResponse.json({ error: 'Customer email is required' }, { status: 400 });
}
if (!order.inpost_point_id) {
  return NextResponse.json({ error: 'InPost point ID is required' }, { status: 400 });
}
```

**Files Changed:**
- `app/api/courier/globkurier/create-shipment/route.ts` (lines 144-162)

---

### 7. ✅ Missing serviceCode and addonsCategories
**Problem:** Product search response didn't include `serviceCode` and `addonsCategories` fields needed for order creation.

**Fix:** Added these fields to product mapping in `searchProducts` method.

**Files Changed:**
- `lib/courier/globkurier/api.ts` (lines 218-220)

---

## API Endpoints Used

### Search Carriers
```
GET /products?flatList=true&collectionTypes[]=POINT&deliveryTypes[]=POINT&...
Response: { standard: [...], fast: [...], ... }
```

### Create Order
```
POST /order/bestPrice?createFully=true&onlyPricing=false
Body: { shipment: { integrationName: "InPost", ... }, addons: { WEEKEND_DELIVERY: {} }, ... }
Response: { number, hash, status, pricing, trackingNumber, ... }
```

### Download Labels
```
GET /order/labels?orderHashes[]=hash1&orderHashes[]=hash2&format=A4
Response: Binary PDF (merged A4 format)
```

---

## Testing

### Diagnostic Scripts Created
1. `scripts/gk-diagnose.mjs` - Test /products response structure
2. `scripts/gk-diagnose2.mjs` - Test addons and bestPrice with various combinations
3. `scripts/gk-points.mjs` - Test /points endpoint parameters
4. `scripts/gk-data.mjs` - Verify sender point and real order data
5. `scripts/gk-validate-fixes.mjs` - Validate all fixes against live API
6. `scripts/gk-e2e-test.mjs` - End-to-end test (requires running app)

### Manual Testing Steps
1. Start dev server: `pnpm dev`
2. Navigate to order with InPost point (e.g., order #35)
3. Open courier panel
4. Click "Utwórz przesyłkę wychodzącą"
5. Select parcel size, enable insurance and/or weekend delivery
6. Confirm - should create outbound shipment successfully
7. Click "Utwórz przesyłkę zwrotną"
8. Confirm - should create return shipment successfully
9. Click "Pobierz etykiety PDF"
10. Should download merged PDF with both labels

---

## Database Schema

### courier_shipments table
Required columns:
- `globkurier_order_hash` - For bulk label download (added)
- `globkurier_order_number` - GK order number (existing)
- `globkurier_product_id` - Product ID if carrier was selected (existing)
- Other standard fields: tracking_number, status, price, etc.

---

## Configuration

### site_settings keys
- `globkurier_email` - API login email
- `globkurier_password` - API password
- `globkurier_environment` - 'test' or 'production'
- `courier_sender_*` - Sender data (10 keys including optional `nip`)

### Sender Point
- Default: `POZ118M` (Poznań)
- Must be valid InPost paczkomat code
- Used as `pointId` in sender address for POINT collection type

---

## Key Learnings

1. **flatList=true groups products** - Response structure is `{ standard: [], fast: [], ... }`, not flat array
2. **WEEKEND_DELIVERY vs SATURDAY_DELIVERY** - InPost uses `WEEKEND_DELIVERY` addon category
3. **Order hash required for bulk labels** - Must capture `hash` from order response for efficient label download
4. **Binary PDF responses** - Need special handling in request method with `Accept: application/pdf` header
5. **Required fields validation** - Better to fail fast than use dummy data

---

## Files Modified

### Core API Client
- `lib/courier/globkurier/api.ts` - searchProducts parsing, binary response handling, getLabelsByHashes

### Type Definitions
- `lib/courier/types.ts` - Added nip to SenderConfig
- `lib/courier/globkurier/types.ts` - Added hash to GlobKurierOrderResponse

### Backend Routes
- `app/api/courier/globkurier/create-shipment/route.ts` - WEEKEND_DELIVERY addon, nip field, hash capture, validation
- `app/api/courier/globkurier/labels/route.ts` - Bulk hash-based label download

---

## Status: ✅ Complete

All fixes implemented and ready for testing. No hardcoded data, proper validation, efficient label download, and correct addon usage.
