"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import {
  ArrowLeft,
  Building2,
  Edit3,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  ShoppingCart,
  Trash2,
  TrendingUp,
  User,
  X,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

type Customer = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  nip: string | null;
  address_street: string | null;
  address_city: string | null;
  address_zip: string | null;
  created_at: string | null;
};

type Order = {
  id: string;
  order_number: string | null;
  start_date: string | null;
  end_date: string | null;
  total_rental_price: number | null;
  order_status: string | null;
  payment_status: string | null;
};

function moneyPln(v: number | null) {
  if (!v) return "—";
  return `${v.toFixed(2)} zł`;
}

function dateFmt(v: string | null) {
  if (!v) return "—";
  try { return format(parseISO(v), "dd MMM yyyy"); } catch { return v; }
}

function pillOrder(status: string | null) {
  const s = (status ?? "").toLowerCase();
  if (s === "reserved") return { label: "Zarezerwowane", cls: "bg-blue-100 text-blue-700" };
  if (s === "picked_up") return { label: "Wydane", cls: "bg-indigo-100 text-indigo-700" };
  if (s === "returned") return { label: "Zwrócone", cls: "bg-emerald-100 text-emerald-700" };
  if (s === "cancelled") return { label: "Anulowane", cls: "bg-slate-100 text-slate-500" };
  return { label: "Nowe", cls: "bg-amber-100 text-amber-700" };
}

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const customerId = params?.id;
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Edit form state
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    company_name: "",
    nip: "",
    address_street: "",
    address_city: "",
    address_zip: "",
  });

  // Delete state
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    if (!customerId) return;
    setLoading(true);
    setError(null);

    const [{ data: cust, error: custErr }, { data: ords, error: ordsErr }] = await Promise.all([
      supabase
        .from("customers")
        .select("id,full_name,email,phone,company_name,nip,address_street,address_city,address_zip,created_at")
        .eq("id", customerId)
        .maybeSingle(),
      supabase
        .from("orders")
        .select("id,order_number,start_date,end_date,total_rental_price,order_status,payment_status")
        .eq("customer_id", customerId)
        .order("start_date", { ascending: false }),
    ]);

    if (custErr || ordsErr) {
      setError((custErr ?? ordsErr)!.message);
    } else if (!cust) {
      setError("Nie znaleziono klienta");
    } else {
      setCustomer(cust as Customer);
      setOrders((ords ?? []) as Order[]);
    }
    setLoading(false);
  }

  useEffect(() => { void load(); }, [customerId]);

  function startEdit() {
    if (!customer) return;
    setForm({
      full_name: customer.full_name ?? "",
      email: customer.email ?? "",
      phone: customer.phone ?? "",
      company_name: customer.company_name ?? "",
      nip: customer.nip ?? "",
      address_street: customer.address_street ?? "",
      address_city: customer.address_city ?? "",
      address_zip: customer.address_zip ?? "",
    });
    setSaveError(null);
    setEditing(true);
  }

  async function saveEdit() {
    if (!customerId) return;
    setSaving(true);
    setSaveError(null);
    const patch = {
      full_name: form.full_name.trim() || null,
      email: form.email.trim().toLowerCase() || null,
      phone: form.phone.trim() || null,
      company_name: form.company_name.trim() || null,
      nip: form.nip.trim() || null,
      address_street: form.address_street.trim() || null,
      address_city: form.address_city.trim() || null,
      address_zip: form.address_zip.trim() || null,
    };
    const { error: err } = await supabase.from("customers").update(patch).eq("id", customerId);
    setSaving(false);
    if (err) { setSaveError(err.message); return; }
    setEditing(false);
    await load();
  }

  async function handleDelete() {
    if (!customerId) return;
    setDeleting(true);
    const res = await fetch("/api/office/delete-customer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId }),
    });
    setDeleting(false);
    if (res.ok) {
      router.push("/office/customers");
    } else {
      const json = await res.json();
      setError(json?.error ?? "Błąd usuwania");
    }
  }

  function field(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Ładowanie klienta…
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="px-5 py-12 text-center text-sm text-red-600">
        {error ?? "Nie znaleziono klienta"}
      </div>
    );
  }

  const totalSpent = orders.reduce((s, o) => s + (o.total_rental_price ?? 0), 0);
  const displayName = customer.full_name || customer.email || "—";

  return (
    <div className="flex flex-col gap-5 max-w-4xl">
      {/* Back + Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/office/customers"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 mb-2 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Klienci
          </Link>
          <h1 className="text-xl font-bold text-slate-900">{displayName}</h1>
          {customer.company_name && (
            <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              {customer.company_name}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-6">
          {!editing && (
            <>
              <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs border-slate-200" onClick={startEdit}>
                <Edit3 className="h-3.5 w-3.5" />
                Edytuj
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 text-xs border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => setShowDelete(true)}
                disabled={orders.length > 0}
                title={orders.length > 0 ? "Usuń najpierw zamówienia klienta" : undefined}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Usuń
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* LEFT — Details / Edit form */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <Card className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <User className="h-4 w-4" />
                Dane osobowe
              </CardTitle>
              {editing && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditing(false)}>
                    <X className="h-3 w-3 mr-1" />
                    Anuluj
                  </Button>
                  <Button size="sm" className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => void saveEdit()} disabled={saving}>
                    {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
                    Zapisz
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {saveError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{saveError}</div>
              )}

              {editing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">Imię i nazwisko</Label>
                    <Input value={form.full_name} onChange={(e) => field("full_name", e.target.value)} placeholder="Jan Kowalski" className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">Email</Label>
                    <Input value={form.email} onChange={(e) => field("email", e.target.value)} placeholder="jan@firma.pl" className="h-8 text-sm" type="email" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">Telefon</Label>
                    <Input value={form.phone} onChange={(e) => field("phone", e.target.value)} placeholder="+48 600 000 000" className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">NIP</Label>
                    <Input value={form.nip} onChange={(e) => field("nip", e.target.value)} placeholder="1234567890" className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs text-slate-500">Firma</Label>
                    <Input value={form.company_name} onChange={(e) => field("company_name", e.target.value)} placeholder="Nazwa firmy sp. z o.o." className="h-8 text-sm" />
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  <InfoRow icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={customer.email} />
                  <InfoRow icon={<Phone className="h-3.5 w-3.5" />} label="Telefon" value={customer.phone} />
                  <InfoRow icon={<Building2 className="h-3.5 w-3.5" />} label="Firma" value={customer.company_name} />
                  <InfoRow icon={<User className="h-3.5 w-3.5" />} label="NIP" value={customer.nip} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Address */}
          <Card className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <MapPin className="h-4 w-4" />
                Adres
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editing ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5 sm:col-span-3">
                    <Label className="text-xs text-slate-500">Ulica</Label>
                    <Input value={form.address_street} onChange={(e) => field("address_street", e.target.value)} placeholder="ul. Przykładowa 1" className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">Kod pocztowy</Label>
                    <Input value={form.address_zip} onChange={(e) => field("address_zip", e.target.value)} placeholder="00-000" className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs text-slate-500">Miasto</Label>
                    <Input value={form.address_city} onChange={(e) => field("address_city", e.target.value)} placeholder="Warszawa" className="h-8 text-sm" />
                  </div>
                </div>
              ) : (
                customer.address_street || customer.address_city ? (
                  <div className="flex items-start gap-2 text-sm text-slate-700">
                    <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      {customer.address_street && <div>{customer.address_street}</div>}
                      {(customer.address_zip || customer.address_city) && (
                        <div>{[customer.address_zip, customer.address_city].filter(Boolean).join(" ")}</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-400">Brak adresu</div>
                )
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT — Stats + Orders */}
        <div className="flex flex-col gap-5">
          {/* Stats */}
          <Card className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <TrendingUp className="h-4 w-4" />
                Statystyki
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Zamówienia</span>
                <span className={cn(
                  "inline-flex min-w-[28px] justify-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                  orders.length > 0 ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
                )}>
                  {orders.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Łącznie wydano</span>
                <span className="text-sm font-bold text-slate-900">{moneyPln(totalSpent)}</span>
              </div>
              {customer.created_at && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Klient od</span>
                  <span className="text-xs text-slate-700">{dateFmt(customer.created_at)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Orders list */}
          <Card className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <ShoppingCart className="h-4 w-4" />
                Zamówienia
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {orders.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-slate-400">Brak zamówień</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {orders.map((o) => {
                    const pill = pillOrder(o.order_status);
                    return (
                      <Link
                        key={o.id}
                        href={`/office/orders/${o.id}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-slate-900">{o.order_number ?? o.id.slice(0, 8)}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {dateFmt(o.start_date)} → {dateFmt(o.end_date)}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", pill.cls)}>
                            {pill.label}
                          </span>
                          <span className="text-xs font-semibold text-slate-700">{moneyPln(o.total_rental_price)}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete confirmation */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Usuń klienta</h3>
                <p className="text-xs text-slate-500">Ta operacja jest nieodwracalna</p>
              </div>
            </div>
            <p className="text-sm text-slate-700 mb-5">
              Czy na pewno chcesz usunąć klienta <strong>{displayName}</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowDelete(false)} disabled={deleting}>Anuluj</Button>
              <Button variant="destructive" size="sm" onClick={() => void handleDelete()} disabled={deleting}>
                {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
                Usuń klienta
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-50 text-slate-400">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</div>
        <div className="text-sm text-slate-900 truncate">{value || <span className="text-slate-400">—</span>}</div>
      </div>
    </div>
  );
}
