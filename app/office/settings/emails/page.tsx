"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Save, Loader2, Mail, Eye, EyeOff, RotateCcw } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useToast } from "@/hooks/use-toast";

type EmailTemplate = {
  key: string;
  value: string;
  updated_at: string | null;
};

const EMAIL_TEMPLATE_KEYS = [
  {
    key: "email_subject_order_received",
    label: "Temat: Potwierdzenie otrzymania zamówienia",
    description: "Email wysyłany natychmiast po opłaceniu zamówienia (bez PDF).",
    type: "subject" as const,
    placeholder: "Otrzymaliśmy Twoją rezerwację Starlink Mini - {orderId}",
  },
  {
    key: "email_body_order_received",
    label: "Treść: Potwierdzenie otrzymania zamówienia",
    description: "Główna treść emaila wysyłanego po płatności. Dostępne zmienne: {customerName}, {orderId}, {startDate}, {endDate}, {totalAmount}",
    type: "body" as const,
    placeholder: "Cześć {customerName},\n\nDziękujemy za złożenie rezerwacji...",
  },
  {
    key: "email_subject_order_confirmed",
    label: "Temat: Potwierdzenie rezerwacji (z umową PDF)",
    description: "Email wysyłany po zmianie statusu na 'confirmed', z załączoną umową PDF.",
    type: "subject" as const,
    placeholder: "Rezerwacja potwierdzona! Starlink Mini - {orderId}",
  },
  {
    key: "email_body_order_confirmed",
    label: "Treść: Potwierdzenie rezerwacji (z umową PDF)",
    description: "Główna treść emaila z potwierdzeniem. Zmienne: {customerName}, {orderId}, {startDate}, {endDate}, {rentalDays}, {inpostPointId}, {inpostPointAddress}, {rentalPrice}, {deposit}, {totalAmount}",
    type: "body" as const,
    placeholder: "Cześć {customerName},\n\nTwoja rezerwacja została potwierdzona!...",
  },
  {
    key: "email_subject_admin_notification",
    label: "Temat: Powiadomienie admina o nowym zamówieniu",
    description: "Temat emaila wysyłanego do admina przy nowym zamówieniu.",
    type: "subject" as const,
    placeholder: "Nowa kasa! Zamówienie #{orderId} od {customerName}",
  },
  {
    key: "email_footer_text",
    label: "Stopka e-mail",
    description: "Tekst wyświetlany na dole każdego emaila do klienta.",
    type: "body" as const,
    placeholder: "Starkit - Wynajem Starlink Mini\nwww.starkit.pl | wynajem@starkit.pl",
  },
] as const;

export default function EmailTemplatesPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Record<string, EmailTemplate>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [expandedPreview, setExpandedPreview] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    setLoading(true);

    const keys = EMAIL_TEMPLATE_KEYS.map((t) => t.key);
    const { data, error } = await supabase
      .from("site_settings")
      .select("key,value,updated_at")
      .in("key", keys);

    if (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się załadować szablonów: " + error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const map: Record<string, EmailTemplate> = {};
    const draftMap: Record<string, string> = {};
    for (const row of data ?? []) {
      map[row.key] = row as EmailTemplate;
      draftMap[row.key] = row.value;
    }

    setTemplates(map);
    setDrafts(draftMap);
    setLoading(false);
  }

  function updateDraft(key: string, value: string) {
    setDrafts((prev) => ({ ...prev, [key]: value }));
  }

  function hasChanges(key: string): boolean {
    const original = templates[key]?.value ?? "";
    const draft = drafts[key] ?? "";
    return original !== draft;
  }

  function resetDraft(key: string) {
    setDrafts((prev) => ({ ...prev, [key]: templates[key]?.value ?? "" }));
  }

  async function saveTemplate(key: string) {
    const value = drafts[key];
    if (value === undefined) return;

    setSaving(key);

    // Upsert: update if exists, insert if not
    const existing = templates[key];
    let error;

    if (existing) {
      const result = await supabase
        .from("site_settings")
        .update({ value, updated_at: new Date().toISOString() })
        .eq("key", key);
      error = result.error;
    } else {
      const result = await supabase
        .from("site_settings")
        .insert({ key, value, updated_at: new Date().toISOString() });
      error = result.error;
    }

    if (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się zapisać szablonu: " + error.message,
        variant: "destructive",
      });
    } else {
      setTemplates((prev) => ({
        ...prev,
        [key]: { key, value, updated_at: new Date().toISOString() },
      }));
      toast({
        title: "Zapisano",
        description: `Szablon "${EMAIL_TEMPLATE_KEYS.find((t) => t.key === key)?.label}" zaktualizowany.`,
      });
    }

    setSaving(null);
  }

  const anyChanges = EMAIL_TEMPLATE_KEYS.some((t) => hasChanges(t.key));

  async function saveAll() {
    const changed = EMAIL_TEMPLATE_KEYS.filter((t) => hasChanges(t.key));
    for (const t of changed) {
      await saveTemplate(t.key);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/office/settings"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              Szablony e-mail
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Edytuj tematy i treści e-maili wysyłanych do klientów i admina
            </p>
          </div>
        </div>

        <Button
          onClick={saveAll}
          disabled={!anyChanges || saving !== null}
          className="gap-2"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Zapisz wszystkie
        </Button>
      </div>

      {/* Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <p className="text-sm text-blue-900">
            <strong>Zmienne szablonów</strong> — używaj nawiasów klamrowych, np.{" "}
            <code className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-mono">
              {"{customerName}"}
            </code>{" "}
            aby wstawiać dynamiczne dane zamówienia. Zmienne zostaną automatycznie podmienione
            podczas wysyłki.
          </p>
        </CardContent>
      </Card>

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">Ładowanie szablonów…</div>
      ) : (
        <div className="space-y-4">
          {EMAIL_TEMPLATE_KEYS.map((tpl) => {
            const draft = drafts[tpl.key] ?? "";
            const changed = hasChanges(tpl.key);
            const isSaving = saving === tpl.key;
            const isPreview = expandedPreview === tpl.key;

            return (
              <Card
                key={tpl.key}
                className={`bg-white rounded-xl border shadow-sm transition-colors ${
                  changed ? "border-amber-300" : "border-slate-200"
                }`}
              >
                <CardHeader className="border-b border-slate-100 pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-2">
                      <Mail className="h-4 w-4 mt-0.5 text-slate-400" />
                      <div>
                        <CardTitle className="text-sm font-semibold text-slate-900">
                          {tpl.label}
                        </CardTitle>
                        <p className="mt-0.5 text-xs text-slate-500">{tpl.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {tpl.type === "body" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 text-xs text-slate-500"
                          onClick={() =>
                            setExpandedPreview((prev) => (prev === tpl.key ? null : tpl.key))
                          }
                        >
                          {isPreview ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                          {isPreview ? "Ukryj" : "Podgląd"}
                        </Button>
                      )}
                      {changed && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 text-xs text-slate-500"
                          onClick={() => resetDraft(tpl.key)}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Cofnij
                        </Button>
                      )}
                      <Button
                        size="sm"
                        className="h-8 gap-1 text-xs"
                        disabled={!changed || isSaving}
                        onClick={() => saveTemplate(tpl.key)}
                      >
                        {isSaving ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Save className="h-3.5 w-3.5" />
                        )}
                        Zapisz
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  {tpl.type === "subject" ? (
                    <Input
                      value={draft}
                      onChange={(e) => updateDraft(tpl.key, e.target.value)}
                      placeholder={tpl.placeholder}
                      className="h-10 bg-slate-50 border-slate-200 text-sm placeholder:text-slate-400 focus-visible:bg-white"
                    />
                  ) : (
                    <div className="space-y-3">
                      <textarea
                        value={draft}
                        onChange={(e) => updateDraft(tpl.key, e.target.value)}
                        placeholder={tpl.placeholder}
                        className="w-full min-h-[140px] rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-y"
                      />
                      {isPreview && draft && (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                            Podgląd
                          </p>
                          <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                            {draft
                              .replace(/\{customerName\}/g, "Jan Kowalski")
                              .replace(/\{orderId\}/g, "SK-2026-001")
                              .replace(/\{startDate\}/g, "15.03.2026")
                              .replace(/\{endDate\}/g, "22.03.2026")
                              .replace(/\{totalAmount\}/g, "1 060 zł")
                              .replace(/\{rentalPrice\}/g, "560 zł")
                              .replace(/\{deposit\}/g, "500 zł")
                              .replace(/\{rentalDays\}/g, "7")
                              .replace(/\{inpostPointId\}/g, "KRA010")
                              .replace(/\{inpostPointAddress\}/g, "ul. Floriańska 1, 31-019 Kraków")}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {changed && (
                    <div className="mt-2 text-xs text-amber-600 font-medium">
                      Niezapisane zmiany
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Key reference */}
      <Card className="bg-slate-50 rounded-xl border border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900">
            Dostępne klucze w bazie (site_settings)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-xs text-slate-600">
          {EMAIL_TEMPLATE_KEYS.map((t) => (
            <div key={t.key} className="flex items-center gap-2">
              <code className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-[11px] text-slate-700">
                {t.key}
              </code>
              <span className="text-slate-400">—</span>
              <span>{t.label}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
