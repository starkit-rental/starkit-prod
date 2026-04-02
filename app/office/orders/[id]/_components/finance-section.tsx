"use client";

import { useState } from "react";
import { DollarSign, Edit3, FileText, Loader2, Save, Send, Upload, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type FinanceSectionProps = {
  orderId: string;
  orderNumber: string;
  paymentStatus: string | null;
  paymentMethod: string | null;
  notes: string | null;
  invoiceSent: boolean | null;
  totalDeposit: number;
  totalRentalPrice: number;
  onUpdate: () => void;
};

const PAYMENT_METHODS = [
  { value: "cash",     label: "Gotówka" },
  { value: "transfer", label: "Przelew" },
  { value: "blik",     label: "BLIK" },
  { value: "stripe",   label: "Stripe" },
] as const;

const MANUAL_PAYMENT_STATUSES = [
  { value: "paid",             label: "Opłacone",        cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { value: "pending",          label: "Oczekuje",         cls: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "unpaid",           label: "Nieopłacone",      cls: "bg-red-100 text-red-700 border-red-200" },
  { value: "deposit_refunded", label: "Kaucja zwrócona",  cls: "bg-blue-100 text-blue-700 border-blue-200" },
] as const;

export function FinanceSection({
  orderId,
  orderNumber,
  paymentStatus,
  paymentMethod,
  notes,
  invoiceSent,
  totalDeposit,
  totalRentalPrice,
  onUpdate,
}: FinanceSectionProps) {
  const supabase = createSupabaseBrowserClient();
  const [localNotes, setLocalNotes] = useState(notes || "");
  const [saving, setSaving] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [sendingInvoice, setSendingInvoice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceDraft, setPriceDraft] = useState("");
  const [savingPrice, setSavingPrice] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);

  async function savePaymentStatus(newStatus: string) {
    setSavingPayment(true);
    setError(null);
    const res = await fetch("/api/office/order-payment", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, payment_status: newStatus }),
    });
    setSavingPayment(false);
    if (!res.ok) { const d = await res.json(); setError(d.error || "Błąd zapisu"); return; }
    onUpdate();
  }

  async function savePaymentMethod(method: string) {
    setSavingPayment(true);
    setError(null);
    const { error: err } = await supabase.from("orders").update({ payment_method: method }).eq("id", orderId);
    if (err) { 
      setError(err.message); 
      setSavingPayment(false);
      return; 
    }
    setSavingPayment(false);
    onUpdate();
  }

  async function savePrice() {
    const val = parseFloat(priceDraft.replace(",", "."));
    if (!Number.isFinite(val) || val < 0) return;
    setSavingPrice(true);
    const { error: err } = await supabase
      .from("orders")
      .update({ total_rental_price: val })
      .eq("id", orderId);
    setSavingPrice(false);
    if (err) { setError(err.message); return; }
    setEditingPrice(false);
    onUpdate();
  }

  const getPaymentStatusInfo = () => {
    const s = (paymentStatus ?? "").toLowerCase();
    if (s === "paid" || s === "completed") 
      return { label: "Opłacone", cls: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 };
    if (s === "deposit_refunded") 
      return { label: "Kaucja zwrócona", cls: "bg-blue-100 text-blue-700 border-blue-200", icon: CheckCircle2 };
    if (s === "unpaid") 
      return { label: "Nieopłacone", cls: "bg-red-100 text-red-700 border-red-200", icon: XCircle };
    return { label: "Oczekuje", cls: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock };
  };

  const statusInfo = getPaymentStatusInfo();
  const StatusIcon = statusInfo.icon;
  const isStripe = paymentMethod === "stripe";
  const methodLabel = PAYMENT_METHODS.find((m) => m.value === paymentMethod)?.label ?? null;

  async function saveNotes() {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/office/order-payment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, notes: localNotes }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Błąd zapisu notatek");
      }

      onUpdate();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Błąd zapisu");
    } finally {
      setSaving(false);
    }
  }

  async function refundDeposit() {
    if (!confirm("Czy na pewno chcesz oznaczyć kaucję jako zwróconą?")) return;

    setSaving(true);
    setError(null);

    try {
      const refundNote = `Kaucja zwrócona: ${totalDeposit.toFixed(2)} zł`;
      const updatedNotes = localNotes ? `${localNotes}\n\n${refundNote}` : refundNote;

      const res = await fetch("/api/office/order-payment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          orderId, 
          payment_status: "deposit_refunded",
          notes: updatedNotes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Błąd zwrotu kaucji");
      }

      setLocalNotes(updatedNotes);
      onUpdate();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Błąd zwrotu kaucji");
    } finally {
      setSaving(false);
    }
  }

  async function sendInvoice() {
    if (!invoiceFile) {
      setError("Wybierz plik PDF faktury");
      return;
    }

    setSendingInvoice(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("orderId", orderId);
      formData.append("invoice", invoiceFile);

      console.log("Sending invoice for order:", orderId, "File:", invoiceFile.name);

      const res = await fetch("/api/office/send-invoice", {
        method: "POST",
        body: formData,
      });

      console.log("Response status:", res.status);

      if (!res.ok) {
        let errorMessage = "Błąd wysyłki faktury";
        try {
          const data = await res.json();
          errorMessage = data.error || errorMessage;
          console.error("API error:", data);
        } catch (parseError) {
          const text = await res.text();
          console.error("Response text:", text);
          errorMessage = `HTTP ${res.status}: ${text.substring(0, 100)}`;
        }
        throw new Error(errorMessage);
      }

      const result = await res.json();
      console.log("Invoice sent successfully:", result);

      setShowInvoiceModal(false);
      setInvoiceFile(null);
      onUpdate();
    } catch (e) {
      console.error("Send invoice error:", e);
      if (e instanceof TypeError && e.message.includes("fetch")) {
        setError("Błąd połączenia z serwerem. Sprawdź czy serwer działa.");
      } else {
        setError(e instanceof Error ? e.message : "Błąd wysyłki faktury");
      }
    } finally {
      setSendingInvoice(false);
    }
  }

  return (
    <>
      <Card className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <DollarSign className="h-4 w-4 text-indigo-600" />
            Finanse
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          {/* Payment Status */}
          <div className="space-y-2">
            <Label className="text-xs text-slate-500 block">Status płatności</Label>

            {/* Current status badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className={cn("inline-flex items-center gap-2 rounded-lg border px-3 py-1.5", statusInfo.cls)}>
                <StatusIcon className="h-3.5 w-3.5" />
                <span className="font-medium text-sm">{statusInfo.label}</span>
              </div>
              {isStripe && (
                <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-600">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/></svg>
                  Stripe (auto)
                </span>
              )}
            </div>

            {/* Manual status change */}
            <div className="pt-1">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Zmień ręcznie</div>
              <div className="flex flex-wrap gap-1.5">
                {MANUAL_PAYMENT_STATUSES.map((s) => (
                  <button
                    key={s.value}
                    disabled={savingPayment || paymentStatus === s.value || (s.value === "paid" && paymentStatus === "completed")}
                    onClick={() => void savePaymentStatus(s.value)}
                    className={cn(
                      "rounded-lg border px-2.5 py-1 text-xs font-medium transition-all",
                      paymentStatus === s.value || (s.value === "paid" && paymentStatus === "completed")
                        ? cn(s.cls, "ring-2 ring-offset-1 ring-current cursor-default")
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    {savingPayment && (paymentStatus !== s.value) ? s.label : s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-500 block">Metoda płatności</Label>
            <div className="flex flex-wrap gap-1.5">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.value}
                  disabled={savingPayment}
                  onClick={() => void savePaymentMethod(m.value)}
                  className={cn(
                    "rounded-lg border px-2.5 py-1 text-xs font-medium transition-all",
                    paymentMethod === m.value
                      ? "border-indigo-300 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200 ring-offset-1"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
            {methodLabel && (
              <div className="text-[11px] text-slate-400">
                Wybrana: <span className="font-medium text-slate-600">{methodLabel}</span>
                {isStripe && <span className="ml-1">· status aktualizowany automatycznie przez Stripe</span>}
              </div>
            )}
          </div>

          {/* Rental Price */}
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">Kwota wynajmu</Label>
            {editingPrice ? (
              <div className="flex items-center gap-2 mt-1">
                <Input
                  value={priceDraft}
                  onChange={(e) => setPriceDraft(e.target.value)}
                  placeholder="np. 500.00"
                  className="h-8 text-sm w-32"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void savePrice();
                    if (e.key === "Escape") setEditingPrice(false);
                  }}
                  autoFocus
                />
                <span className="text-sm text-slate-500">zł</span>
                <button onClick={() => void savePrice()} disabled={savingPrice} className="text-indigo-600 hover:text-indigo-800">
                  {savingPrice ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                </button>
                <button onClick={() => setEditingPrice(false)} className="text-slate-400 hover:text-slate-600">
                  <XCircle className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                className="flex items-center gap-1.5 group mt-1"
                onClick={() => { setPriceDraft(totalRentalPrice.toFixed(2)); setEditingPrice(true); }}
              >
                <span className="text-2xl font-bold text-slate-900">{totalRentalPrice.toFixed(2)} zł</span>
                <Edit3 className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
              </button>
            )}
          </div>

          {/* Deposit Amount */}
          <div>
            <Label className="text-xs text-slate-500 mb-2 block">Kaucja</Label>
            <div className="text-2xl font-bold text-slate-900">{totalDeposit.toFixed(2)} zł</div>
          </div>

          {/* Refund Deposit Button */}
          {paymentStatus !== "deposit_refunded" && (
            <Button
              onClick={refundDeposit}
              disabled={saving}
              variant="outline"
              className="w-full"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Zwróć kaucję
            </Button>
          )}

          {/* Invoice Status */}
          <div>
            <Label className="text-xs text-slate-500 mb-2 block">Faktura</Label>
            <div className="flex items-center gap-2">
              {invoiceSent ? (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">Faktura wysłana</span>
                </div>
              ) : (
                <Button
                  onClick={() => setShowInvoiceModal(true)}
                  variant="outline"
                  size="sm"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Wyślij fakturę
                </Button>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="text-xs text-slate-500 mb-2 block">
              Notatki (stan sprzętu, uwagi o zwrocie kaucji)
            </Label>
            <Textarea
              id="notes"
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              placeholder="np. Kaucja pomniejszona o 50 PLN za porysowany kabel..."
              rows={4}
              className="text-sm"
            />
            <Button
              onClick={saveNotes}
              disabled={saving || localNotes === notes}
              size="sm"
              className="mt-2"
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Zapisz notatki
            </Button>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Modal */}
      <Dialog open={showInvoiceModal} onOpenChange={setShowInvoiceModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Wyślij fakturę VAT</DialogTitle>
            <DialogDescription>
              Wyślij fakturę do klienta za zamówienie #{orderNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="invoice-file" className="text-sm font-medium mb-2 block">
                Wybierz plik PDF faktury
              </Label>
              <div className="flex items-center gap-2">
                <input
                  id="invoice-file"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById("invoice-file")?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {invoiceFile ? invoiceFile.name : "Wybierz plik PDF"}
                </Button>
              </div>
            </div>

            {invoiceFile && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-slate-600" />
                  <span className="font-medium text-slate-900">{invoiceFile.name}</span>
                  <span className="text-slate-500">
                    ({(invoiceFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              </div>
            )}

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
              <p className="font-medium mb-1">Email zostanie wysłany z szablonem:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Nagłówek: "Dziękujemy za wybór Starkit! 🚀"</li>
                <li>Podsumowanie zamówienia</li>
                <li>Załącznik: Faktura VAT (PDF)</li>
                <li>Stopka: Dane firmy Zakład Graficzny Maciej Godek</li>
              </ul>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowInvoiceModal(false);
                setInvoiceFile(null);
                setError(null);
              }}
            >
              Anuluj
            </Button>
            <Button
              onClick={sendInvoice}
              disabled={!invoiceFile || sendingInvoice}
            >
              {sendingInvoice ? (
                <>Wysyłanie...</>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Wyślij fakturę
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
