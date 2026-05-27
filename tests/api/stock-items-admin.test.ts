import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/office/stock-items/route";
import { PATCH, DELETE } from "@/app/api/office/stock-items/[id]/route";
import { NextRequest } from "next/server";

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";

vi.mock("@/lib/auth-guard", () => ({
  requireAuth: vi.fn(async () => ({ userId: "test-user" })),
}));

const mockSupabaseClient = {
  from: vi.fn((table: string) => ({
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(async () => ({
          data: {
            id: "new-stock-item-id",
            product_id: "product-123",
            serial_number: "SN001",
          },
          error: null,
        })),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(async () => ({
            data: {
              id: "stock-item-123",
              product_id: "product-123",
              serial_number: "SN001-UPDATED",
              unavailable_from: "2026-06-01",
              unavailable_to: "2026-06-10",
              unavailable_reason: "Maintenance",
            },
            error: null,
          })),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(async () => ({
        error: null,
      })),
    })),
  })),
};

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

describe("Stock Items Admin API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/office/stock-items", () => {
    it("should create a new stock item with admin client", async () => {
      const req = new NextRequest("http://localhost:3000/api/office/stock-items", {
        method: "POST",
        body: JSON.stringify({
          product_id: "product-123",
          serial_number: "SN001",
        }),
      });

      const response = await POST(req);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.stockItem).toBeDefined();
      expect(json.stockItem.product_id).toBe("product-123");
      expect(json.stockItem.serial_number).toBe("SN001");
    });
  });

  describe("PATCH /api/office/stock-items/[id]", () => {
    it("should update stock item with unavailability data", async () => {
      const req = new NextRequest("http://localhost:3000/api/office/stock-items/stock-item-123", {
        method: "PATCH",
        body: JSON.stringify({
          unavailable_from: "2026-06-01",
          unavailable_to: "2026-06-10",
          unavailable_reason: "Maintenance",
        }),
      });

      const params = Promise.resolve({ id: "stock-item-123" });
      const response = await PATCH(req, { params });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.stockItem).toBeDefined();
      expect(json.stockItem.unavailable_from).toBe("2026-06-01");
      expect(json.stockItem.unavailable_reason).toBe("Maintenance");
    });

    it("should clear unavailability by setting fields to null", async () => {
      const req = new NextRequest("http://localhost:3000/api/office/stock-items/stock-item-123", {
        method: "PATCH",
        body: JSON.stringify({
          unavailable_from: null,
          unavailable_to: null,
          unavailable_reason: null,
        }),
      });

      const params = Promise.resolve({ id: "stock-item-123" });
      const response = await PATCH(req, { params });

      expect(response.status).toBe(200);
    });
  });

  describe("DELETE /api/office/stock-items/[id]", () => {
    it("should delete a stock item with admin client", async () => {
      const req = new NextRequest("http://localhost:3000/api/office/stock-items/stock-item-123", {
        method: "DELETE",
      });

      const params = Promise.resolve({ id: "stock-item-123" });
      const response = await DELETE(req, { params });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
    });
  });
});
