import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";

// ═══════════════════════════════════════════════════════════
//  Shared helpers for office order pages
//  Extracted to eliminate duplication across:
//    - app/office/orders/page.tsx
//    - app/office/orders/[id]/page.tsx
//    - app/office/dashboard/page.tsx
//    - app/office/customers/*/page.tsx
// ═══════════════════════════════════════════════════════════

export function moneyPln(value: unknown): string {
  const num = typeof value === "number" ? value : Number(String(value));
  if (!Number.isFinite(num)) return "—";
  return `${num.toFixed(2)} zł`;
}

export function dateShort(value: string): string {
  try {
    return format(parseISO(value), "dd MMM yyyy", { locale: pl });
  } catch {
    return value;
  }
}

export function shortOrderNumber(orderId: string): string {
  const hex = orderId.replace(/-/g, "").slice(0, 8);
  const num = Number.parseInt(hex || "0", 16);
  const safe = Number.isFinite(num) ? num : 0;
  return String(1000 + (safe % 9000));
}

export function initials(name: string | null | undefined): string {
  const n = String(name ?? "").trim();
  if (!n) return "?";
  const parts = n.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (a + b).toUpperCase();
}

export function normalizeOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

// ── Status pill helpers ──────────────────────────────────

export type PillInfo = { label: string; cls: string };

export function pillForOrder(status: string | null | undefined): PillInfo {
  const s = (status ?? "").toLowerCase();
  if (s === "pending") return { label: "Nowe", cls: "bg-amber-100 text-amber-700" };
  if (s === "reserved") return { label: "Zarezerwowane", cls: "bg-blue-100 text-blue-700" };
  if (s === "ready_for_pickup") return { label: "Gotowe do odbioru", cls: "bg-purple-100 text-purple-700" };
  if (s === "picked_up") return { label: "Wydane", cls: "bg-orange-100 text-orange-700" };
  if (s === "returned") return { label: "Zwrócone", cls: "bg-green-100 text-green-700" };
  if (s === "cancelled" || s === "canceled") return { label: "Anulowane", cls: "bg-rose-100 text-rose-700" };
  return { label: status || "—", cls: "bg-slate-100 text-slate-500" };
}

export function pillForPayment(status: string | null | undefined): PillInfo {
  const s = (status ?? "").toLowerCase();
  if (s === "paid" || s === "completed") return { label: "Opłacone", cls: "bg-emerald-100 text-emerald-700" };
  if (s === "deposit_refunded") return { label: "Kaucja zwrócona", cls: "bg-blue-100 text-blue-700" };
  if (s === "unpaid") return { label: "Nieopłacone", cls: "bg-red-100 text-red-700" };
  if (s === "payment_due") return { label: "Do zapłaty", cls: "bg-amber-100 text-amber-700" };
  if (s === "pending") return { label: "Oczekuje", cls: "bg-amber-100 text-amber-700" };
  if (s === "manual") return { label: "Ręczne", cls: "bg-sky-100 text-sky-700" };
  if (s === "failed") return { label: "Błąd", cls: "bg-rose-100 text-rose-700" };
  return { label: status || "—", cls: "bg-slate-100 text-slate-500" };
}

export function deliveryBadge(method: string | null | undefined): PillInfo {
  if (method === "personal_pickup") return { label: "🏪 Osobisty", cls: "bg-violet-100 text-violet-700" };
  return { label: "📦 InPost", cls: "bg-sky-100 text-sky-700" };
}
