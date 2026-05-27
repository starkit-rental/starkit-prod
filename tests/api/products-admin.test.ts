import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth-guard", () => ({
  requireAuth: vi.fn(async () => ({ userId: "test-user" })),
}));

const updateMock = vi.fn();
const deleteProductsMock = vi.fn();
const deleteStockMock = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: (table: string) => {
      if (table === "products") {
        return {
          update: (...a: any[]) => {
            updateMock(...a);
            return {
              eq: () => ({
                select: () => Promise.resolve({ data: [{ id: "p1" }], error: null }),
              }),
            };
          },
          delete: () => {
            deleteProductsMock();
            return { eq: () => Promise.resolve({ error: null }) };
          },
        };
      }
      if (table === "stock_items") {
        return {
          delete: () => {
            deleteStockMock();
            return { eq: () => Promise.resolve({ error: null }) };
          },
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  }),
}));

beforeEach(() => {
  updateMock.mockReset();
  deleteProductsMock.mockReset();
  deleteStockMock.mockReset();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
});

describe("PATCH /api/office/products/[id]", () => {
  it("updates allowed fields and rejects unknown ones", async () => {
    const { PATCH } = await import("@/app/api/office/products/[id]/route");
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
    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(updateMock).toHaveBeenCalledWith({ name: "New Name", base_price_day: 99.5 });
  });

  it("returns 400 when no allowed fields", async () => {
    const { PATCH } = await import("@/app/api/office/products/[id]/route");
    const req = new Request("http://localhost/api/office/products/p1", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ evil: "x" }),
    });
    const res = await PATCH(req as any, { params: Promise.resolve({ id: "p1" }) } as any);
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/office/products/[id]", () => {
  it("deletes the product and its stock items", async () => {
    const { DELETE } = await import("@/app/api/office/products/[id]/route");
    const req = new Request("http://localhost/api/office/products/p1", { method: "DELETE" });
    const res = await DELETE(req as any, { params: Promise.resolve({ id: "p1" }) } as any);
    expect(res.status).toBe(200);
    expect(deleteStockMock).toHaveBeenCalledTimes(1);
    expect(deleteProductsMock).toHaveBeenCalledTimes(1);
  });
});
