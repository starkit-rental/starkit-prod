"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";

import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  CreditCard,
  Edit3,
  Eye,
  Loader2,
  Mail,
  MapPin,
  Package,
  PackageCheck,
  PackageX,
  Phone,
  Receipt,
  Save,
  Send,
  Settings,
  Trash2,
  User,
  X,
  XCircle,
  Zap,
  FileText,
  Download,
  ExternalLink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

type CustomerRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  company_name: string | null;
  nip: string | null;
};

type StockItemRow = {
  id: string;
  serial_number: string | null;
  products?: { id: string; name?: string | null } | { id: string; name?: string | null }[] | null;
};

type OrderItemRow = {
  stock_item_id: string | null;
  stock_items?: StockItemRow | StockItemRow[] | null;
};

type EmailLogRow = {
  id: string;
  recipient: string;
  subject: string;
  body: string | null;
  type: string;
  status: string;
  error_message: string | null;
  sent_at: string;
};

type OrderRow = {
  id: string;
  order_number: string | null;
  start_date: string;
  end_date: string;
  total_rental_price: unknown;
  total_deposit: unknown;
  payment_status: string | null;
  order_status: string | null;
  inpost_point_id: string | null;
  inpost_point_address: string | null;
  customers?: CustomerRow | CustomerRow[] | null;
  order_items?: OrderItemRow[] | null;
};

function moneyPln(value: unknown): string {
  const num = typeof value === "number" ? value : Number(String(value));
  if (!Number.isFinite(num)) return "—";
  return `${num.toFixed(2)} zł`;
}

function dateFmt(value: string): string {
  try {
    return format(parseISO(value), "dd MMM yyyy");
  } catch {
    return value;
  }
}

function initials(name: string | null | undefined): string {
  const n = String(name ?? "").trim();
  if (!n) return "?";
  const parts = n.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (a + b).toUpperCase();
}

function shortOrderNumber(orderId: string): string {
  const hex = orderId.replace(/-/g, "").slice(0, 8);
  const num = Number.parseInt(hex || "0", 16);
  const safe = Number.isFinite(num) ? num : 0;
  return String(1000 + (safe % 9000));
}

function normalizeOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function pillForPayment(status: string | null | undefined) {
  const s = (status ?? "").toLowerCase();
  if (s === "paid") return { label: "Paid", cls: "bg-emerald-100 text-emerald-700" };
  if (s === "payment_due") return { label: "Payment due", cls: "bg-amber-100 text-amber-700" };
  if (s === "pending") return { label: "Pending", cls: "bg-amber-100 text-amber-700" };
  if (s === "manual") return { label: "Manual", cls: "bg-sky-100 text-sky-700" };
  if (s === "failed") return { label: "Failed", cls: "bg-rose-100 text-rose-700" };
  return { label: status || "—", cls: "bg-slate-100 text-slate-500" };
}

function pillForOrder(status: string | null | undefined) {
  const s = (status ?? "").toLowerCase();
  if (s === "pending") return { label: "Nowe", cls: "bg-amber-100 text-amber-700" };
  if (s === "reserved") return { label: "Zarezerwowane", cls: "bg-blue-100 text-blue-700" };
  if (s === "picked_up") return { label: "Wydane", cls: "bg-orange-100 text-orange-700" };
  if (s === "returned") return { label: "Zwrócone", cls: "bg-green-100 text-green-700" };
  if (s === "cancelled" || s === "canceled") return { label: "Anulowane", cls: "bg-rose-100 text-rose-700" };
  return { label: status || "—", cls: "bg-slate-100 text-slate-500" };
}

type SiteSettingRow = { key: string; value: string };

const STATUS_LABELS: Record<string, string> = {
  pending: "Nowe",
  reserved: "Zarezerwowane",
  picked_up: "Wydane",
  returned: "Zwrócone",
  cancelled: "Anulowane",
};

const EMAIL_STATUSES = ["reserved", "picked_up", "returned", "cancelled"];

export default function OfficeOrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const orderId = params?.id;
  const router = useRouter();

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [emailLogs, setEmailLogs] = useState<EmailLogRow[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<"overview" | "actions">("overview");

  // Modal podglądu treści maila
  const [previewLog, setPreviewLog] = useState<EmailLogRow | null>(null);

  // Custom email messenger modal
  const [showMessenger, setShowMessenger] = useState(false);
  const [messengerTemplate, setMessengerTemplate] = useState("general");
  const [messengerSubject, setMessengerSubject] = useState("");
  const [messengerContent, setMessengerContent] = useState("");
  const [messengerSending, setMessengerSending] = useState(false);
  const [messengerError, setMessengerError] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Email countdown state
  const [emailCountdown, setEmailCountdown] = useState<number | null>(null);
  const [emailSending, setEmailSending] = useState(false);
  const [emailToast, setEmailToast] = useState<{ ok: boolean; msg: string } | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sendTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingOrderRef = useRef<OrderRow | null>(null);
  const pendingStatusRef = useRef<string | null>(null);

  // Status change confirmation dialog
  const [statusDialog, setStatusDialog] = useState<{ newStatus: string; label: string } | null>(null);

  // Clear all timers on unmount
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (sendTimerRef.current) clearTimeout(sendTimerRef.current);
    };
  }, []);

  function startEmailCountdown(orderSnapshot: OrderRow, statusType: string) {
    // Cancel any existing countdown
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    if (sendTimerRef.current) clearTimeout(sendTimerRef.current);

    pendingOrderRef.current = orderSnapshot;
    pendingStatusRef.current = statusType;
    setEmailCountdown(10);
    setEmailToast(null);

    // Tick every second
    countdownTimerRef.current = setInterval(() => {
      setEmailCountdown((prev) => {
        if (prev === null || prev <= 1) {
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    // Fire after 10s
    sendTimerRef.current = setTimeout(() => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      setEmailCountdown(null);
      void fireStatusEmail(pendingOrderRef.current, pendingStatusRef.current);
    }, 10000);
  }

  function cancelEmailCountdown() {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    if (sendTimerRef.current) clearTimeout(sendTimerRef.current);
    countdownTimerRef.current = null;
    sendTimerRef.current = null;
    pendingOrderRef.current = null;
    pendingStatusRef.current = null;
    setEmailCountdown(null);
    setEmailToast({ ok: false, msg: "Wysyłka maila została anulowana." });
    setTimeout(() => setEmailToast(null), 4000);
  }

  async function fireStatusEmail(snapshot: OrderRow | null, statusType: string | null) {
    if (!snapshot || !statusType) return;
    const cust = normalizeOne(snapshot.customers);
    if (!cust?.email) {
      setEmailToast({ ok: false, msg: "Brak adresu email klienta — nie można wysłać maila." });
      setTimeout(() => setEmailToast(null), 6000);
      return;
    }
    setEmailSending(true);
    try {
      const res = await fetch("/api/office/send-status-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: statusType,
          orderId: snapshot.id,
          orderNumber: snapshot.order_number ?? undefined,
          customerEmail: cust.email,
          customerName: cust?.full_name || cust?.company_name || cust.email,
          customerPhone: cust?.phone ?? undefined,
          companyName: cust?.company_name ?? undefined,
          nip: cust?.nip ?? undefined,
          startDate: snapshot.start_date,
          endDate: snapshot.end_date,
          inpostPointId: snapshot.inpost_point_id ?? "",
          inpostPointAddress: snapshot.inpost_point_address ?? "",
          rentalPrice: String(Number(String(snapshot.total_rental_price ?? 0)).toFixed(2)),
          deposit: String(Number(String(snapshot.total_deposit ?? 0)).toFixed(2)),
          totalAmount: String(
            (Number(String(snapshot.total_rental_price ?? 0)) +
             Number(String(snapshot.total_deposit ?? 0))).toFixed(2)
          ),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Błąd wysyłki");
      setEmailToast({ ok: true, msg: `E-mail (${STATUS_LABELS[statusType] ?? statusType}) został wysłany.` });
      void loadEmailLogs();
    } catch (e) {
      setEmailToast({ ok: false, msg: `Błąd: ${e instanceof Error ? e.message : "Nieznany błąd"}` });
    } finally {
      setEmailSending(false);
      setTimeout(() => setEmailToast(null), 6000);
    }
  }

  async function loadOrder() {
    if (!orderId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/office/order-detail?orderId=${orderId}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || "Błąd ładowania zamówienia");
        setOrder(null);
      } else {
        setOrder((json.order ?? null) as OrderRow | null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Błąd ładowania zamówienia");
      setOrder(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    void loadOrder();
    void loadEmailLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  async function loadEmailLogs() {
    if (!orderId) return;
    setLoadingLogs(true);
    try {
      const res = await fetch(`/api/office/email-logs?orderId=${orderId}`);
      const json = await res.json();
      setEmailLogs((json.logs as EmailLogRow[]) ?? []);
    } catch {
      setEmailLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  }

  // ── Messenger logic ──
  const MESSENGER_TEMPLATES: { id: string; label: string; defaultSubject: string; defaultContent: (c: CustomerRow | null, o: OrderRow | null) => string }[] = [
    {
      id: "order_confirmed",
      label: "Potwierdzenie rezerwacji",
      defaultSubject: "Potwierdzenie rezerwacji SK-{{order_id}}",
      defaultContent: (c, o) =>
        `Cześć ${c?.full_name || "Kliencie"},\n\nTwoja rezerwacja ${o?.order_number || ""} została potwierdzona.\nOkres wynajmu: ${o?.start_date || ""} – ${o?.end_date || ""}\n\nPozdrawiamy,\nZespół Starkit`,
    },
    {
      id: "order_picked_up",
      label: "Instrukcja / Wysyłka",
      defaultSubject: "Sprzęt w drodze! SK-{{order_id}}",
      defaultContent: (c, o) =>
        `Cześć ${c?.full_name || "Kliencie"},\n\nZamówienie ${o?.order_number || ""} zostało wysłane.\nOtrzymasz SMS od InPost, gdy paczka będzie gotowa do odbioru.\n\nPozdrawiamy,\nZespół Starkit`,
    },
    {
      id: "order_returned",
      label: "Potwierdzenie zwrotu",
      defaultSubject: "Potwierdzenie zwrotu SK-{{order_id}}",
      defaultContent: (c, o) =>
        `Cześć ${c?.full_name || "Kliencie"},\n\nPotwierdzamy odbiór zwróconego sprzętu z zamówienia ${o?.order_number || ""}.\nKaucja zostanie zwrócona w ciągu 48h.\n\nDziękujemy za skorzystanie z Starkit!\nZespół Starkit`,
    },
    {
      id: "general",
      label: "Szablon ogólny",
      defaultSubject: "Wiadomość od Starkit — SK-{{order_id}}",
      defaultContent: (c) =>
        `Cześć ${c?.full_name || "Kliencie"},\n\n\n\nPozdrawiamy,\nZespół Starkit`,
    },
  ];

  async function fetchPreview(tplId: string, content: string) {
    const cust = normalizeOne(order?.customers);
    const total = order ? (Number(order.total_rental_price) + Number(order.total_deposit)).toFixed(2) : "0.00";
    try {
      const res = await fetch("/api/office/preview-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: tplId,
          content,
          customerName: cust?.full_name || "Kliencie",
          orderNumber: order?.order_number || orderId || "",
          startDate: order?.start_date || "—",
          endDate: order?.end_date || "—",
          totalAmount: `${total} zł`,
        }),
      });
      if (res.ok) {
        const html = await res.text();
        setPreviewHtml(html);
      }
    } catch { /* silent */ }
  }

  function debouncedPreview(tplId: string, content: string) {
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    previewTimerRef.current = setTimeout(() => void fetchPreview(tplId, content), 400);
  }

  function openMessenger() {
    const tpl = MESSENGER_TEMPLATES[3]; // default: general
    const cust = normalizeOne(order?.customers);
    const resolvedSubject = (tpl.defaultSubject)
      .replace(/\{\{order_id\}\}/g, order?.order_number || orderId || "")
      .replace(/\{\{name\}\}/g, cust?.full_name || "Kliencie");
    const content = tpl.defaultContent(cust, order);
    setMessengerTemplate(tpl.id);
    setMessengerSubject(resolvedSubject);
    setMessengerContent(content);
    setMessengerError(null);
    setPreviewHtml("");
    setShowMessenger(true);
    void fetchPreview(tpl.id, content);
  }

  function handleTemplateChange(tplId: string) {
    const tpl = MESSENGER_TEMPLATES.find((t) => t.id === tplId) ?? MESSENGER_TEMPLATES[3];
    const cust = normalizeOne(order?.customers);
    const resolvedSubject = (tpl.defaultSubject)
      .replace(/\{\{order_id\}\}/g, order?.order_number || orderId || "")
      .replace(/\{\{name\}\}/g, cust?.full_name || "Kliencie");
    const content = tpl.defaultContent(cust, order);
    setMessengerTemplate(tpl.id);
    setMessengerSubject(resolvedSubject);
    setMessengerContent(content);
    setMessengerError(null);
    void fetchPreview(tpl.id, content);
  }

  function handleContentChange(value: string) {
    setMessengerContent(value);
    debouncedPreview(messengerTemplate, value);
  }

  async function sendCustomEmail() {
    if (!orderId || !messengerContent.trim()) return;
    setMessengerSending(true);
    setMessengerError(null);

    try {
      const res = await fetch("/api/office/send-custom-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          templateId: messengerTemplate,
          finalContent: messengerContent,
          customSubject: messengerSubject,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessengerError(json?.error || "Błąd wysyłki");
        setMessengerSending(false);
        return;
      }
      setShowMessenger(false);
      setMessengerContent("");
      setPreviewHtml("");
      await loadEmailLogs();
    } catch (e) {
      setMessengerError(e instanceof Error ? e.message : "Nieznany błąd");
    } finally {
      setMessengerSending(false);
    }
  }

  // Called from Select — shows dialog for statuses that have emails
  function handleStatusChange(newStatus: string) {
    if (EMAIL_STATUSES.includes(newStatus)) {
      setStatusDialog({ newStatus, label: STATUS_LABELS[newStatus] ?? newStatus });
    } else {
      void applyStatusChange(newStatus, false);
    }
  }

  async function applyStatusChange(newStatus: string, withEmail: boolean) {
    setStatusDialog(null);
    if (!orderId) return;
    const { error: updateError } = await supabase
      .from("orders")
      .update({ order_status: newStatus })
      .eq("id", orderId);
    if (updateError) {
      setError(updateError.message);
    } else {
      await loadOrder();
      if (withEmail) {
        const { data: fresh } = await supabase
          .from("orders")
          .select(
            "id,order_number,start_date,end_date,total_rental_price,total_deposit,payment_status,order_status,inpost_point_id,inpost_point_address,customers:customer_id(id,email,full_name,phone,company_name,nip),order_items(stock_item_id,stock_items(id,serial_number,products(id,name)))"
          )
          .eq("id", orderId)
          .maybeSingle();
        if (fresh) startEmailCountdown(fresh as OrderRow, newStatus);
      }
    }
  }

  async function handleDeleteOrder() {
    if (!orderId) return;
    
    const displayNum = orderId ? shortOrderNumber(String(orderId)) : "";
    const confirmed = confirm(
      `Czy na pewno chcesz usunąć to zamówienie?\n\nOperacji nie da się cofnąć. Zamówienie #${displayNum} zostanie trwale usunięte z systemu.`
    );
    
    if (!confirmed) return;
    
    setDeleting(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to delete order");
      
      alert("✓ Zamówienie zostało pomyślnie usunięte.");
      router.push("/office/orders");
    } catch (e) {
      alert(`❌ Błąd: ${e instanceof Error ? e.message : "Nie udało się usunąć zamówienia"}`);
      setDeleting(false);
    }
  }

  const customer = normalizeOne(order?.customers);
  const orderPill = pillForOrder(order?.order_status);
  const payPill = pillForPayment(order?.payment_status);

  const items = (order?.order_items ?? []) as OrderItemRow[];

  const rental = Number(String(order?.total_rental_price ?? 0));
  const deposit = Number(String(order?.total_deposit ?? 0));
  const rentalSafe = Number.isFinite(rental) ? rental : 0;
  const depositSafe = Number.isFinite(deposit) ? deposit : 0;
  const total = rentalSafe + depositSafe;

  const pickupDate = order?.start_date ? dateFmt(order.start_date) : "—";
  const returnDate = order?.end_date ? dateFmt(order.end_date) : "—";
  const displayNumber = order?.order_number || (orderId ? shortOrderNumber(String(orderId)) : "—");

  const TAB_ITEMS = [
    { id: "overview" as const, label: "Przegląd", icon: Receipt },
    { id: "actions" as const, label: "Akcje", icon: Zap },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/office/orders"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-xs font-medium text-slate-500">Zamówienie</p>
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">#{displayNumber}</h1>
          </div>
          <span className={cn("ml-2 inline-flex rounded-full px-3 py-1 text-xs font-medium", orderPill.cls)}>
            {orderPill.label}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={order?.order_status ?? ""}
            onValueChange={(val) => handleStatusChange(val)}
          >
            <SelectTrigger className="h-9 w-[160px] border-slate-200 bg-white text-sm">
              <SelectValue placeholder="Zmień status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Nowe</SelectItem>
              <SelectItem value="reserved">Zarezerwowane</SelectItem>
              <SelectItem value="picked_up">Wydane</SelectItem>
              <SelectItem value="returned">Zwrócone</SelectItem>
              <SelectItem value="cancelled">Anulowane</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteOrder}
            className="h-9 gap-2 border-destructive/50 text-destructive hover:bg-destructive hover:text-white"
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Usuń</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {TAB_ITEMS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
                activeTab === tab.id
                  ? "border-[#FFD700] text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Email countdown banner */}
      {(emailCountdown !== null || emailSending || emailToast) && (
        <EmailCountdownBanner
          countdown={emailCountdown}
          sending={emailSending}
          toast={emailToast}
          onCancel={cancelEmailCountdown}
        />
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">Ładowanie zamówienia…</div>
      ) : error ? (
        <div className="py-12 text-center text-sm text-destructive">{error}</div>
      ) : !order ? (
        <div className="py-12 text-center text-sm text-slate-500">Nie znaleziono zamówienia.</div>
      ) : activeTab === "actions" ? (
        <ActionsTab
          order={order}
          orderId={orderId!}
          displayNumber={displayNumber}
          customer={customer}
          supabase={supabase}
          onOrderUpdated={loadOrder}
          onLogsRefresh={loadEmailLogs}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">

          {/* LEFT — Customer Profile */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            <Card className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <User className="h-4 w-4" />
                  Profil Klienta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                    {initials(customer?.full_name || customer?.email)}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-900">
                      {customer?.full_name || customer?.company_name || customer?.email || "—"}
                    </div>
                    {!customer?.full_name && customer?.company_name && (
                      <div className="text-xs text-slate-500 truncate">{customer.email}</div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <div className="min-w-0">
                      <div className="text-xs text-slate-500">E-mail</div>
                      <div className="truncate font-medium text-slate-700">{customer?.email || "—"}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <div className="min-w-0">
                      <div className="text-xs text-slate-500">Telefon</div>
                      <div className="truncate font-medium text-slate-700">{customer?.phone || "—"}</div>
                    </div>
                  </div>
                  {customer?.company_name && (
                    <div className="flex items-start gap-3">
                      <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      <div className="min-w-0">
                        <div className="text-xs text-slate-500">Firma</div>
                        <div className="truncate font-medium text-slate-700">{customer.company_name}</div>
                        {customer.nip && (
                          <div className="text-xs text-slate-500">NIP: {customer.nip}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CENTER — Logistics & Products */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <Card className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <Calendar className="h-4 w-4" />
                    Logistyka
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1.5 border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50"
                      onClick={() => handleStatusChange("picked_up")}
                    >
                      <PackageCheck className="h-3.5 w-3.5" />
                      Wydane
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1.5 border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50"
                      onClick={() => handleStatusChange("returned")}
                    >
                      <PackageX className="h-3.5 w-3.5" />
                      Zwrócone
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pickup</div>
                      <div className="mt-1.5 text-base font-semibold text-slate-900">{pickupDate}</div>
                    </div>
                    <ArrowRight className="h-6 w-6 text-slate-300" />
                    <div className="text-right">
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Return</div>
                      <div className="mt-1.5 text-base font-semibold text-slate-900">{returnDate}</div>
                    </div>
                  </div>
                </div>
                {order.inpost_point_id && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600">InPost Paczkomat</div>
                        <div className="mt-1 font-mono text-sm font-semibold text-emerald-900">{order.inpost_point_id}</div>
                        {order.inpost_point_address && (
                          <div className="mt-0.5 text-xs text-emerald-700">{order.inpost_point_address}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <Package className="h-4 w-4" />
                  Produkty
                </CardTitle>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <div className="py-6 text-center text-sm text-slate-500">Brak pozycji w zamówieniu.</div>
                ) : (
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                    {items.map((it, idx) => {
                      const stock = normalizeOne(it.stock_items as any);
                      const product = normalizeOne(stock?.products as any);
                      const name = product?.name ?? "Produkt";
                      const serial = stock?.serial_number ?? "—";

                      return (
                        <div key={`${it.stock_item_id}-${idx}`} className="flex items-center gap-4 px-4 py-3.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
                            <Package className="h-4 w-4 text-slate-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold text-slate-900">{name}</div>
                            <div className="text-xs text-slate-500">SN: {serial}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT — Finance Receipt */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            <Card className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <Receipt className="h-4 w-4" />
                  Finanse
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Wynajem</span>
                    <span className="font-medium text-slate-700">{moneyPln(order.total_rental_price)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Kaucja</span>
                    <span className="font-medium text-slate-700">{moneyPln(order.total_deposit)}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">Razem</span>
                      <span className="text-xl font-bold text-slate-900">{`${total.toFixed(2)} zł`}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-slate-400" />
                  <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-medium", payPill.cls)}>
                    {payPill.label}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* PDF Contract */}
            <ContractPdfCard orderId={orderId!} supabase={supabase} />
          </div>

          {/* Communication History */}
          <div className="lg:col-span-12">
            <Card className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <Mail className="h-4 w-4" />
                    Historia Komunikacji
                  </CardTitle>
                  <Button
                    size="sm"
                    onClick={openMessenger}
                    className="h-8 gap-1.5 bg-[#1a1a2e] text-white hover:bg-[#2a2a4e] text-xs font-medium"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Wyślij wiadomość
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {loadingLogs ? (
                  <div className="py-8 text-center text-sm text-slate-500">
                    Ładowanie historii...
                  </div>
                ) : emailLogs.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-500">
                    Brak wysłanych wiadomości email dla tego zamówienia.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {emailLogs.map((log) => {
                      const isSent = log.status === "sent";
                      const typeLabels: Record<string, string> = {
                        order_received: "Otrzymano rezerwację",
                        order_confirmed: "Rezerwacja potwierdzona",
                        order_picked_up: "Sprzęt wysłany",
                        order_returned: "Zwrot potwierdzony",
                        order_cancelled: "Zamówienie anulowane",
                        customer_confirmation: "Potwierdzenie dla klienta",
                        admin_notification: "Powiadomienie dla admina",
                        manual: "Ręczna wysyłka",
                      };
                      const typeLabel = typeLabels[log.type] || log.type;
                      const sentDate = format(
                        parseISO(log.sent_at),
                        "dd.MM.yyyy, HH:mm"
                      );

                      return (
                        <div
                          key={log.id}
                          className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4"
                        >
                          <div className="mt-0.5">
                            {isSent ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-900 truncate">
                                  {log.subject}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-500">
                                  <span className={cn(
                                    "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium mr-1.5",
                                    isSent ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                                  )}>
                                    {isSent ? "wysłany" : "błąd"}
                                  </span>
                                  {typeLabel} • {log.recipient}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs text-slate-400">{sentDate}</span>
                                {log.body && (
                                  <button
                                    onClick={() => setPreviewLog(log)}
                                    className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline whitespace-nowrap"
                                  >
                                    Podgląd treści
                                  </button>
                                )}
                              </div>
                            </div>
                            {!isSent && log.error_message && (
                              <p className="mt-2 text-xs text-red-600">
                                Błąd: {log.error_message}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Dialog: zmiana statusu z mailem / bez */}
      {statusDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setStatusDialog(null)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-slate-900 mb-1">
              Zmiana statusu na: {statusDialog.label}
            </h3>
            <p className="text-sm text-slate-500 mb-5">
              Czy chcesz wysłać powiadomienie e-mail do klienta o zmianie statusu?
            </p>
            <div className="flex flex-col gap-2">
              <Button
                className="w-full gap-2"
                onClick={() => void applyStatusChange(statusDialog.newStatus, true)}
              >
                <Mail className="h-4 w-4" />
                Zmień status i wyślij e-mail
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => void applyStatusChange(statusDialog.newStatus, false)}
              >
                Zmień status bez wysyłki
              </Button>
              <Button
                variant="ghost"
                className="w-full text-slate-500"
                onClick={() => setStatusDialog(null)}
              >
                Anuluj
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Messenger modal — Split-View Editor */}
      {showMessenger && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => { if (!messengerSending) setShowMessenger(false); }}
        >
          <div
            className="w-full max-w-6xl rounded-2xl bg-white shadow-2xl flex flex-col"
            style={{ height: "min(90vh, 820px)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-3.5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1a1a2e]">
                  <Send className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Wyślij wiadomość</h3>
                  <p className="text-xs text-slate-500">
                    Do: <span className="font-medium text-slate-700">{normalizeOne(order?.customers)?.email || "—"}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMessenger(false)}
                disabled={messengerSending}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Split-view body */}
            <div className="flex-1 flex min-h-0">
              {/* LEFT — Controls */}
              <div className="w-1/2 border-r border-slate-200 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {/* Template selector */}
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">Szablon</Label>
                    <Select value={messengerTemplate} onValueChange={handleTemplateChange}>
                      <SelectTrigger className="h-10 border-slate-200 bg-slate-50/80 text-sm font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MESSENGER_TEMPLATES.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Subject */}
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">Temat</Label>
                    <Input
                      value={messengerSubject}
                      onChange={(e) => setMessengerSubject(e.target.value)}
                      className="h-10 border-slate-200 bg-slate-50/80 text-sm font-medium"
                      placeholder="Temat e-maila…"
                    />
                  </div>

                  {/* Content editor */}
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Treść</Label>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {"{{name}}"} {"{{order_id}}"} — auto-zamiana
                      </span>
                    </div>
                    <textarea
                      value={messengerContent}
                      onChange={(e) => handleContentChange(e.target.value)}
                      className="flex-1 min-h-[280px] w-full rounded-lg border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-800 leading-relaxed resize-none focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
                      placeholder="Wpisz treść wiadomości…"
                    />
                  </div>

                  {messengerError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 font-medium">
                      {messengerError}
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT — Live Preview */}
              <div className="w-1/2 flex flex-col min-h-0 bg-slate-50/50">
                <div className="px-5 py-3 border-b border-slate-100 shrink-0">
                  <div className="flex items-center gap-2">
                    <Eye className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Podgląd na żywo</span>
                  </div>
                </div>
                <div className="flex-1 p-4 min-h-0">
                  {previewHtml ? (
                    <iframe
                      srcDoc={previewHtml}
                      className="w-full h-full rounded-lg border border-slate-200 bg-white shadow-inner"
                      sandbox="allow-same-origin"
                      title="Podgląd e-maila"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-sm text-slate-400">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Generowanie podglądu…
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-200 px-6 py-3.5 shrink-0">
              <p className="text-[11px] text-slate-400">
                E-mail zostanie wysłany z brandingiem Starkit
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMessenger(false)}
                  disabled={messengerSending}
                  className="h-9"
                >
                  Anuluj
                </Button>
                <Button
                  size="sm"
                  onClick={sendCustomEmail}
                  disabled={messengerSending || !messengerContent.trim()}
                  className="h-9 gap-1.5 bg-[#1a1a2e] text-white hover:bg-[#2a2a4e] font-medium"
                >
                  {messengerSending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Wysyłanie…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Wyślij e-mail
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal podglądu treści maila */}
      {previewLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setPreviewLog(null)}
        >
          <div
            className="relative flex flex-col w-full max-w-3xl max-h-[85vh] rounded-xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Podgląd wiadomości</p>
                <p className="text-sm font-semibold text-slate-900 truncate">{previewLog.subject}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Do: {previewLog.recipient} &bull;{" "}
                  {format(parseISO(previewLog.sent_at), "dd.MM.yyyy, HH:mm")}
                </p>
              </div>
              <button
                onClick={() => setPreviewLog(null)}
                className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* Body */}
            <div className="overflow-y-auto flex-1 p-6">
              {/<[a-z][\s\S]*>/i.test(previewLog.body ?? "") ? (
                <iframe
                  srcDoc={previewLog.body ?? ""}
                  className="w-full rounded-lg border border-slate-200 bg-white"
                  style={{ height: "500px" }}
                  sandbox="allow-same-origin"
                  title="Podgląd maila"
                />
              ) : (
                <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans leading-relaxed">
                  {previewLog.body}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   EMAIL COUNTDOWN BANNER
═══════════════════════════════════════════════════ */

const COUNTDOWN_TOTAL = 10;

function EmailCountdownBanner({
  countdown,
  sending,
  toast,
  onCancel,
}: {
  countdown: number | null;
  sending: boolean;
  toast: { ok: boolean; msg: string } | null;
  onCancel: () => void;
}) {
  const isActive = countdown !== null;
  const progress = isActive ? ((COUNTDOWN_TOTAL - countdown) / COUNTDOWN_TOTAL) * 100 : 100;

  if (sending) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
        <Loader2 className="h-5 w-5 shrink-0 animate-spin text-blue-600" />
        <span className="text-sm font-medium text-blue-900">
          Generowanie PDF i wysyłanie e-maila z umową…
        </span>
      </div>
    );
  }

  if (!isActive && toast) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border px-5 py-4",
          toast.ok
            ? "border-emerald-200 bg-emerald-50"
            : "border-amber-200 bg-amber-50"
        )}
      >
        {toast.ok ? (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
        ) : (
          <XCircle className="h-5 w-5 shrink-0 text-amber-600" />
        )}
        <span
          className={cn(
            "text-sm font-medium",
            toast.ok ? "text-emerald-900" : "text-amber-900"
          )}
        >
          {toast.msg}
        </span>
      </div>
    );
  }

  if (!isActive) return null;

  return (
    <div className="rounded-xl border border-[#FFD700] bg-amber-50 px-5 py-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Mail className="h-5 w-5 shrink-0 text-amber-600" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-amber-900">
              Wiadomość do klienta zostanie wysłana za{" "}
              <span
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-base font-bold tabular-nums"
                style={{ backgroundColor: "#FFD700", color: "#000" }}
              >
                {countdown}
              </span>
              s…
            </p>
            <p className="mt-0.5 text-xs text-amber-700">
              E-mail z potwierdzeniem rezerwacji i umową PDF
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
          className="shrink-0 gap-1.5 border-amber-300 bg-white text-amber-800 hover:bg-amber-100 hover:border-amber-400 font-semibold"
        >
          <X className="h-3.5 w-3.5" />
          Anuluj wysyłkę
        </Button>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-amber-200">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-linear"
          style={{
            width: `${progress}%`,
            backgroundColor: "#FFD700",
          }}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   ACTIONS TAB
═══════════════════════════════════════════════════ */

const EMAIL_TEMPLATE_OPTIONS = [
  { key: "email_body_order_received",        subjectKey: "email_subject_order_received",        label: "Potwierdzenie otrzymania zamówienia" },
  { key: "email_body_order_confirmed",       subjectKey: "email_subject_order_confirmed",       label: "Potwierdzenie rezerwacji (z umową)" },
  { key: "email_body_order_picked_up",       subjectKey: "email_subject_order_picked_up",       label: "Sprzęt wysłany (wydane)" },
  { key: "email_body_order_returned",        subjectKey: "email_subject_order_returned",        label: "Zwrot potwierdzony" },
  { key: "email_body_order_cancelled",       subjectKey: "email_subject_order_cancelled",       label: "Zamówienie anulowane" },
  { key: "email_body_admin_notification",    subjectKey: "email_subject_admin_notification",    label: "Powiadomienie admina" },
];

function ActionsTab({
  order,
  orderId,
  displayNumber,
  customer,
  supabase,
  onOrderUpdated,
  onLogsRefresh,
}: {
  order: OrderRow;
  orderId: string;
  displayNumber: string;
  customer: CustomerRow | null;
  supabase: ReturnType<typeof createSupabaseBrowserClient>;
  onOrderUpdated: () => void;
  onLogsRefresh: () => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <SendEmailPanel
        order={order}
        orderId={orderId}
        displayNumber={displayNumber}
        customer={customer}
        supabase={supabase}
        onLogsRefresh={onLogsRefresh}
      />
      <EditOrderPanel
        order={order}
        orderId={orderId}
        supabase={supabase}
        onSaved={onOrderUpdated}
      />
    </div>
  );
}

/* ─────────────────── Send Email Panel ─────────────────── */

function SendEmailPanel({
  order,
  orderId,
  displayNumber,
  customer,
  supabase,
  onLogsRefresh,
}: {
  order: OrderRow;
  orderId: string;
  displayNumber: string;
  customer: CustomerRow | null;
  supabase: ReturnType<typeof createSupabaseBrowserClient>;
  onLogsRefresh: () => void;
}) {
  const [templates, setTemplates] = useState<Record<string, string>>({});
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(EMAIL_TEMPLATE_OPTIONS[0].key);
  const [toEmail, setToEmail] = useState(customer?.email ?? "");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    async function loadTemplates() {
      setLoadingTemplates(true);
      const keys = EMAIL_TEMPLATE_OPTIONS.flatMap((t) => [t.key, t.subjectKey]);
      const { data } = await supabase
        .from("site_settings")
        .select("key,value")
        .in("key", keys);
      const map: Record<string, string> = {};
      for (const row of (data as SiteSettingRow[]) ?? []) map[row.key] = row.value;
      setTemplates(map);
      setLoadingTemplates(false);
    }
    void loadTemplates();
  }, [supabase]);

  // Update subject + body when template selection changes
  useEffect(() => {
    if (loadingTemplates) return; // czekaj na załadowanie szablonów z bazy
    const tpl = EMAIL_TEMPLATE_OPTIONS.find((t) => t.key === selectedTemplate);
    if (!tpl) return;
    const rawSubject = templates[tpl.subjectKey] ?? "";
    const rawBody = templates[tpl.key] ?? "";
    const customerName = customer?.full_name ?? customer?.company_name ?? "Kliencie";
    const resolve = (s: string) =>
      s
        // format {{zmienna}}
        .replace(/\{\{customer_name\}\}/g, customerName)
        .replace(/\{\{order_number\}\}/g, displayNumber)
        .replace(/\{\{order_id\}\}/g, displayNumber)
        .replace(/\{\{total_amount\}\}/g, moneyPln(order?.total_rental_price ? Number(String(order.total_rental_price)) + Number(String(order.total_deposit ?? 0)) : 0))
        .replace(/\{\{start_date\}\}/g, order?.start_date ? dateFmt(order.start_date) : "—")
        .replace(/\{\{end_date\}\}/g, order?.end_date ? dateFmt(order.end_date) : "—")
        // format {zmienna} (legacy)
        .replace(/\{customerName\}/g, customerName)
        .replace(/\{orderId\}/g, displayNumber)
        .replace(/\{orderNumber\}/g, displayNumber);
    setSubject(resolve(rawSubject));
    setBody(resolve(rawBody));
  }, [selectedTemplate, templates, loadingTemplates, customer, displayNumber, order]);

  async function handleSend() {
    if (!toEmail || !subject || !body) return;
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch("/api/office/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, to: toEmail, subject, body }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Błąd wysyłki");
      setSendResult({ ok: true, msg: "E-mail wysłany pomyślnie." });
      void onLogsRefresh();
    } catch (e) {
      setSendResult({ ok: false, msg: e instanceof Error ? e.message : "Nieznany błąd" });
    } finally {
      setSending(false);
    }
  }

  const TEMPLATE_KEY_TO_TYPE: Record<string, string> = {
    email_body_order_received: "order_received",
    email_body_order_confirmed: "order_confirmed",
    email_body_order_picked_up: "order_picked_up",
    email_body_order_returned: "order_returned",
    email_body_order_cancelled: "order_cancelled",
    email_body_admin_notification: "admin_notification",
  };

  async function handlePreview() {
    const previewType = TEMPLATE_KEY_TO_TYPE[selectedTemplate];
    if (!previewType) return;
    setLoadingPreview(true);
    try {
      const rental = Number(String(order?.total_rental_price ?? 0));
      const dep = Number(String(order?.total_deposit ?? 0));
      const res = await fetch("/api/office/email-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: previewType,
          vars: {
            customer_name: customer?.full_name || customer?.company_name || "Kliencie",
            order_number: displayNumber,
            start_date: order?.start_date ? dateFmt(order.start_date) : "—",
            end_date: order?.end_date ? dateFmt(order.end_date) : "—",
            total_amount: `${(rental + dep).toFixed(2)} zł`,
            rental_price: `${rental.toFixed(2)} zł`,
            deposit: `${dep.toFixed(2)} zł`,
            customer_email: customer?.email ?? "",
            customer_phone: customer?.phone ?? "",
            company_name: customer?.company_name ?? "",
            nip: customer?.nip ?? "",
            inpost_point_id: order?.inpost_point_id ?? "",
            inpost_point_address: order?.inpost_point_address ?? "",
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Błąd podglądu");
      setPreviewHtml(json.html);
    } catch (e) {
      setSendResult({ ok: false, msg: `Podgląd: ${e instanceof Error ? e.message : "Błąd"}` });
    } finally {
      setLoadingPreview(false);
    }
  }

  return (
    <>
    <Card className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Send className="h-4 w-4 text-[#FFD700]" />
          Wyślij e-mail
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        {loadingTemplates ? (
          <div className="flex items-center gap-2 text-sm text-slate-400 py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            Ładowanie szablonów…
          </div>
        ) : (
          <>
            {/* Template picker */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-500">Szablon</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger className="h-9 border-slate-200 bg-slate-50 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMAIL_TEMPLATE_OPTIONS.map((t) => (
                    <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* To */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-500">Do</Label>
              <Input
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                placeholder="email@klient.pl"
                className="h-9 border-slate-200 bg-slate-50 text-sm"
              />
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-500">Temat</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Temat wiadomości…"
                className="h-9 border-slate-200 bg-slate-50 text-sm"
              />
            </div>

            {/* Body */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-500">Treść</Label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={7}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-y"
                placeholder="Treść wiadomości…"
              />
            </div>

            {sendResult && (
              <div className={cn(
                "rounded-lg px-4 py-2.5 text-sm font-medium",
                sendResult.ok
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              )}>
                {sendResult.msg}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePreview}
                disabled={loadingPreview || !TEMPLATE_KEY_TO_TYPE[selectedTemplate]}
                className="flex-1 gap-2 border-slate-200"
              >
                {loadingPreview ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                Podgląd
              </Button>
              <Button
                onClick={handleSend}
                disabled={sending || !toEmail || !subject || !body}
                className="flex-1 gap-2 bg-slate-900 hover:bg-slate-800"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {sending ? "Wysyłanie…" : "Wyślij"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>

    {/* Preview modal */}
    {previewHtml && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={() => setPreviewHtml(null)}
      >
        <div
          className="relative flex flex-col w-full max-w-3xl max-h-[90vh] rounded-xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 shrink-0">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Podgląd szablonu e-mail</p>
              <p className="text-sm font-medium text-slate-900 mt-0.5">
                {EMAIL_TEMPLATE_OPTIONS.find((t) => t.key === selectedTemplate)?.label ?? ""}
              </p>
            </div>
            <button
              onClick={() => setPreviewHtml(null)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="overflow-y-auto flex-1 bg-slate-100 p-4">
            <iframe
              srcDoc={previewHtml ?? undefined}
              className="w-full rounded-lg border border-slate-200 bg-white"
              style={{ height: "600px" }}
              sandbox="allow-same-origin"
              title="Podgląd maila"
            />
          </div>
        </div>
      </div>
    )}
    </>
  );
}

/* ─────────────────── Edit Order Panel ─────────────────── */

function EditOrderPanel({
  order,
  orderId,
  supabase,
  onSaved,
}: {
  order: OrderRow;
  orderId: string;
  supabase: ReturnType<typeof createSupabaseBrowserClient>;
  onSaved: () => void;
}) {
  const rentalInit = Number(String(order.total_rental_price ?? 0));
  const depositInit = Number(String(order.total_deposit ?? 0));

  const [rentalPrice, setRentalPrice] = useState(Number.isFinite(rentalInit) ? rentalInit.toFixed(2) : "0.00");
  const [depositAmount, setDepositAmount] = useState(Number.isFinite(depositInit) ? depositInit.toFixed(2) : "0.00");
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const rentalNum = parseFloat(rentalPrice) || 0;
  const depositNum = parseFloat(depositAmount) || 0;
  const totalNum = rentalNum + depositNum;
  const changed =
    rentalNum.toFixed(2) !== rentalInit.toFixed(2) ||
    depositNum.toFixed(2) !== depositInit.toFixed(2);

  async function handleSave() {
    setSaving(true);
    setSaveResult(null);
    const { error } = await supabase
      .from("orders")
      .update({
        total_rental_price: rentalNum,
        total_deposit: depositNum,
      })
      .eq("id", orderId);
    if (error) {
      setSaveResult({ ok: false, msg: error.message });
    } else {
      setSaveResult({ ok: true, msg: "Kwoty zaktualizowane." });
      onSaved();
    }
    setSaving(false);
  }

  return (
    <Card className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Edit3 className="h-4 w-4 text-[#FFD700]" />
          Edytuj pozycje zamówienia
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        {/* Rental price */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-slate-500">Kwota wynajmu (PLN)</Label>
          <div className="relative">
            <Input
              type="number"
              step="0.01"
              min="0"
              value={rentalPrice}
              onChange={(e) => setRentalPrice(e.target.value)}
              className="h-9 border-slate-200 bg-slate-50 text-sm pr-10"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">zł</span>
          </div>
        </div>

        {/* Deposit */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-slate-500">Kaucja (PLN)</Label>
          <div className="relative">
            <Input
              type="number"
              step="0.01"
              min="0"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="h-9 border-slate-200 bg-slate-50 text-sm pr-10"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">zł</span>
          </div>
        </div>

        {/* Live total */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Wynajem</span>
            <span className="font-medium text-slate-700">{rentalNum.toFixed(2)} zł</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1.5">
            <span className="text-slate-500">Kaucja</span>
            <span className="font-medium text-slate-700">{depositNum.toFixed(2)} zł</span>
          </div>
          <div className="mt-2 border-t border-slate-200 pt-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-900">Razem</span>
            <span className="text-lg font-bold text-slate-900" style={{ color: changed ? "#b45309" : undefined }}>
              {totalNum.toFixed(2)} zł
              {changed && <span className="ml-1.5 text-xs font-normal text-amber-600">(niezapisane)</span>}
            </span>
          </div>
        </div>

        {saveResult && (
          <div className={cn(
            "rounded-lg px-4 py-2.5 text-sm font-medium",
            saveResult.ok
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-red-50 text-red-700 border border-red-200"
          )}>
            {saveResult.msg}
          </div>
        )}

        <Button
          onClick={handleSave}
          disabled={saving || !changed}
          className="w-full gap-2 bg-slate-900 hover:bg-slate-800"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Zapisywanie…" : "Zapisz zmiany"}
        </Button>
      </CardContent>
    </Card>
  );
}

/* ─────────────────── Contract PDF Card ─────────────────── */

function ContractPdfCard({
  orderId,
  supabase,
}: {
  orderId: string;
  supabase: ReturnType<typeof createSupabaseBrowserClient>;
}) {
  const [generating, setGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfFilename, setPdfFilename] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if PDF already exists in storage
  useEffect(() => {
    async function checkExistingPdf() {
      try {
        const { data: files } = await supabase.storage
          .from("contracts")
          .list(`contracts/${orderId}`);

        if (files && files.length > 0) {
          const pdfFile = files.find((f) => f.name.endsWith(".pdf"));
          if (pdfFile) {
            const path = `contracts/${orderId}/${pdfFile.name}`;
            const { data: signedUrl } = await supabase.storage
              .from("contracts")
              .createSignedUrl(path, 60 * 60 * 24); // 24h
            if (signedUrl?.signedUrl) {
              setPdfUrl(signedUrl.signedUrl);
              setPdfFilename(pdfFile.name);
            }
          }
        }
      } catch {
        // Storage bucket may not exist yet — that's fine
      } finally {
        setChecking(false);
      }
    }
    void checkExistingPdf();
  }, [orderId, supabase]);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/office/generate-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Błąd generowania PDF");

      if (json.url) {
        setPdfUrl(json.url);
        setPdfFilename(json.filename);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nieznany błąd");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Card className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <FileText className="h-4 w-4" />
          Umowa PDF
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {checking ? (
          <div className="flex items-center gap-2 text-sm text-slate-400 py-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Sprawdzanie…
          </div>
        ) : pdfUrl ? (
          <>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <div className="flex items-center gap-2 text-sm text-emerald-700">
                <FileText className="h-4 w-4 shrink-0" />
                <span className="truncate font-medium">{pdfFilename || "Umowa.pdf"}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-1.5 h-8 text-xs"
                onClick={() => window.open(pdfUrl, "_blank")}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Podgląd
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-1.5 h-8 text-xs"
                asChild
              >
                <a href={pdfUrl} download={pdfFilename || "Umowa.pdf"}>
                  <Download className="h-3.5 w-3.5" />
                  Pobierz
                </a>
              </Button>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="w-full gap-1.5 h-8 text-xs text-slate-500"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
              Generuj ponownie
            </Button>
          </>
        ) : (
          <>
            <p className="text-xs text-slate-500">
              Brak wygenerowanej umowy. Kliknij, aby wygenerować PDF z aktualnym regulaminem.
            </p>
            <Button
              size="sm"
              className="w-full gap-1.5 h-9 bg-[#1a1a2e] hover:bg-[#2a2a4e] text-white text-xs"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Generowanie…
                </>
              ) : (
                <>
                  <FileText className="h-3.5 w-3.5" />
                  Generuj umowę PDF
                </>
              )}
            </Button>
          </>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
