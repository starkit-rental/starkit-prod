import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/office/products/route";
import { NextRequest } from "next/server";

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";

vi.mock("@/lib/auth-guard", () => ({
  requireAuth: vi.fn(async () => ({ userId: "test-user" })),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table: string) => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(async () => ({
            data: {
              id: "new-product-id",
              name: "Test Product",
              sanity_slug: "test-product",
              base_price_day: 100,
              deposit_amount: 500,
              buffer_before: 1,
              buffer_after: 1,
            },
            error: null,
          })),
        })),
      })),
    })),
  })),
}));

describe("POST /api/office/products", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a new product with admin client", async () => {
    const req = new NextRequest("http://localhost:3000/api/office/products", {
      method: "POST",
      body: JSON.stringify({
        name: "Test Product",
        sanity_slug: "test-product",
        base_price_day: 100,
        deposit_amount: 500,
        buffer_before: 1,
        buffer_after: 1,
      }),
    });

    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.product).toBeDefined();
    expect(json.product.name).toBe("Test Product");
    expect(json.product.base_price_day).toBe(100);
  });
});
