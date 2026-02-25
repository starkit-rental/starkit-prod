"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Save, Loader2, Mail, Eye, RotateCcw, Send, CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useToast } from "@/hooks/use-toast";

/* ───────────────── Template definitions ───────────────── */

type TemplateDefinition = {
  id: string;
  label: string;
  description: string;
  subjectKey: string;
  bodyKey: string;
  defaultSubject: string;
  defaultBody: string;
  availableVars: string[];
};

const TEMPLATES: TemplateDefinition[] = [
  {
    id: "order_received",
    label: "Potwierdzenie zamówienia",
    description: "Wysyłany natychmiast po opłaceniu — bez PDF.",
    subjectKey: "email_subject_order_received",
    bodyKey: "email_body_order_received",
    defaultSubject: "Otrzymaliśmy Twoją rezerwację Starlink Mini — {{order_number}}",
    defaultBody: "Cześć {{customer_name}},\n\nDziękujemy za złożenie rezerwacji {{order_number}}.\n\nOkres wynajmu: {{start_date}} – {{end_date}}\nŁączna kwota: {{total_amount}}\n\nNasz zespół weryfikuje dostępność sprzętu. Otrzymasz kolejną wiadomość z potwierdzeniem.\n\nPozdrawiamy,\nZespół Starkit",
    availableVars: ["customer_name", "order_number", "start_date", "end_date", "total_amount"],
  },
  {
    id: "order_confirmed",
    label: "Potwierdzenie rezerwacji",
    description: "Po zmianie statusu na 'reserved' — z umową PDF w załączniku.",
    subjectKey: "email_subject_order_confirmed",
    bodyKey: "email_body_order_confirmed",
    defaultSubject: "Potwierdzenie rezerwacji SK-{{order_number}}",
    defaultBody: "Cześć {{customer_name}},\n\nTwoja rezerwacja {{order_number}} została oficjalnie potwierdzona!\n\nOkres wynajmu: {{start_date}} – {{end_date}} ({{rental_days}} dni)\nOpłata: {{rental_price}}\nKaucja: {{deposit}}\nŁącznie: {{total_amount}}\n\nPunkt InPost: {{inpost_point_id}}\n{{inpost_point_address}}\n\nW załączniku znajdziesz umowę najmu w formacie PDF.\n\nPozdrawiamy,\nZespół Starkit",
    availableVars: ["customer_name", "order_number", "start_date", "end_date", "rental_days", "rental_price", "deposit", "total_amount", "inpost_point_id", "inpost_point_address"],
  },
  {
    id: "order_picked_up",
    label: "Wysyłka / Instrukcja",
    description: "Po zmianie statusu na 'picked_up' — sprzęt w drodze.",
    subjectKey: "email_subject_order_picked_up",
    bodyKey: "email_body_order_picked_up",
    defaultSubject: "Sprzęt w drodze! SK-{{order_number}}",
    defaultBody: "Cześć {{customer_name}},\n\nZamówienie {{order_number}} zostało wysłane!\n\nOtrzymasz SMS od InPost, gdy paczka będzie gotowa do odbioru.\n\nOkres wynajmu: {{start_date}} – {{end_date}}\n\nPozdrawiamy,\nZespół Starkit",
    availableVars: ["customer_name", "order_number", "start_date", "end_date", "total_amount"],
  },
  {
    id: "order_returned",
    label: "Potwierdzenie zwrotu",
    description: "Po zmianie statusu na 'returned'.",
    subjectKey: "email_subject_order_returned",
    bodyKey: "email_body_order_returned",
    defaultSubject: "Potwierdzenie zwrotu sprzętu SK-{{order_number}}",
    defaultBody: "Cześć {{customer_name}},\n\nPotwierdzamy odbiór zwróconego sprzętu z zamówienia {{order_number}}.\n\nKaucja zostanie zwrócona w ciągu 48h.\n\nDziękujemy za skorzystanie z Starkit!\nZespół Starkit",
    availableVars: ["customer_name", "order_number", "start_date", "end_date", "total_amount"],
  },
  {
    id: "order_cancelled",
    label: "Anulowanie zamówienia",
    description: "Po zmianie statusu na 'cancelled'.",
    subjectKey: "email_subject_order_cancelled",
    bodyKey: "email_body_order_cancelled",
    defaultSubject: "Informacja o anulowaniu zamówienia SK-{{order_number}}",
    defaultBody: "Cześć {{customer_name}},\n\nTwoje zamówienie {{order_number}} zostało anulowane.\n\nJeśli dokonałeś płatności, zwrot nastąpi w ciągu 5–10 dni roboczych.\n\nJeśli masz pytania, skontaktuj się z nami: wynajem@starkit.pl\n\nPozdrawiamy,\nZespół Starkit",
    availableVars: ["customer_name", "order_number", "start_date", "end_date", "total_amount"],
  },
];

/* ───────────────── Component ───────────────── */

export default function EmailTemplatesPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState(TEMPLATES[0].id);

  // DB values (original saved state)
  const [savedSubjects, setSavedSubjects] = useState<Record<string, string>>({});
  const [savedBodies, setSavedBodies] = useState<Record<string, string>>({});

  // Working drafts
  const [draftSubjects, setDraftSubjects] = useState<Record<string, string>>({});
  const [draftBodies, setDraftBodies] = useState<Record<string, string>>({});

  // Preview
  const [previewHtml, setPreviewHtml] = useState("");
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selected = TEMPLATES.find((t) => t.id === selectedId) ?? TEMPLATES[0];
  const draftSubject = draftSubjects[selected.subjectKey] ?? "";
  const draftBody = draftBodies[selected.bodyKey] ?? "";
  const savedSubject = savedSubjects[selected.subjectKey] ?? "";
  const savedBody = savedBodies[selected.bodyKey] ?? "";
  const hasChanges = draftSubject !== savedSubject || draftBody !== savedBody;

  useEffect(() => {
    void loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch preview when selected template or draft body changes
  useEffect(() => {
    debouncedPreview(draftBody);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, draftBody]);

  async function loadTemplates() {
    setLoading(true);
    const allKeys = TEMPLATES.flatMap((t) => [t.subjectKey, t.bodyKey]);
    const { data, error } = await supabase
      .from("site_settings")
      .select("key,value")
      .in("key", allKeys);

    if (error) {
      toast({ title: "Błąd", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const map: Record<string, string> = {};
    for (const row of data ?? []) map[row.key] = row.value;

    const subj: Record<string, string> = {};
    const body: Record<string, string> = {};
    for (const tpl of TEMPLATES) {
      subj[tpl.subjectKey] = map[tpl.subjectKey] ?? "";
      body[tpl.bodyKey] = map[tpl.bodyKey] ?? "";
    }

    setSavedSubjects(subj);
    setSavedBodies(body);
    setDraftSubjects(subj);
    setDraftBodies(body);
    setLoading(false);
  }

  function updateSubject(value: string) {
    setDraftSubjects((prev) => ({ ...prev, [selected.subjectKey]: value }));
  }

  function updateBody(value: string) {
    setDraftBodies((prev) => ({ ...prev, [selected.bodyKey]: value }));
  }

  function resetDraft() {
    setDraftSubjects((prev) => ({ ...prev, [selected.subjectKey]: savedSubjects[selected.subjectKey] ?? "" }));
    setDraftBodies((prev) => ({ ...prev, [selected.bodyKey]: savedBodies[selected.bodyKey] ?? "" }));
  }

  async function fetchPreview(bodyText: string) {
    try {
      const res = await fetch("/api/office/preview-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawBody: bodyText || selected.defaultBody }),
      });
      if (res.ok) setPreviewHtml(await res.text());
    } catch { /* silent */ }
  }

  function debouncedPreview(bodyText: string) {
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    previewTimerRef.current = setTimeout(() => void fetchPreview(bodyText), 400);
  }

  async function saveCurrentTemplate() {
    setSaving(true);

    const pairs: { key: string; value: string }[] = [
      { key: selected.subjectKey, value: draftSubject },
      { key: selected.bodyKey, value: draftBody },
    ];

    for (const { key, value } of pairs) {
      const existing = savedSubjects[key] !== undefined || savedBodies[key] !== undefined;
      // Always try upsert
      const { error } = existing
        ? await supabase.from("site_settings").update({ value, updated_at: new Date().toISOString() }).eq("key", key)
        : await supabase.from("site_settings").insert({ key, value, updated_at: new Date().toISOString() });

      if (error) {
        // Fallback: try the other operation
        const fallback = existing
          ? await supabase.from("site_settings").insert({ key, value, updated_at: new Date().toISOString() })
          : await supabase.from("site_settings").update({ value, updated_at: new Date().toISOString() }).eq("key", key);
        if (fallback.error) {
          toast({ title: "Błąd", description: fallback.error.message, variant: "destructive" });
          setSaving(false);
          return;
        }
      }
    }

    setSavedSubjects((prev) => ({ ...prev, [selected.subjectKey]: draftSubject }));
    setSavedBodies((prev) => ({ ...prev, [selected.bodyKey]: draftBody }));
    toast({ title: "Zapisano", description: `Szablon "${selected.label}" zaktualizowany.` });
    setSaving(false);
  }

  function useDefault() {
    setDraftSubjects((prev) => ({ ...prev, [selected.subjectKey]: selected.defaultSubject }));
    setDraftBodies((prev) => ({ ...prev, [selected.bodyKey]: selected.defaultBody }));
  }

  function isCustomized(tpl: TemplateDefinition): boolean {
    const s = savedSubjects[tpl.subjectKey];
    const b = savedBodies[tpl.bodyKey];
    return (!!s && s.length > 0) || (!!b && b.length > 0);
  }

  return (
    <div className="flex flex-col gap-0 h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/office/settings"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">
              Szablony e-mail
            </h1>
            <p className="text-xs text-slate-500">
              Edytuj automatyczne wiadomości wysyłane do klientów
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button variant="ghost" size="sm" onClick={resetDraft} className="h-9 gap-1.5 text-xs text-slate-500">
              <RotateCcw className="h-3.5 w-3.5" />
              Cofnij zmiany
            </Button>
          )}
          <Button
            size="sm"
            onClick={saveCurrentTemplate}
            disabled={!hasChanges || saving}
            className="h-9 gap-1.5 bg-[#1a1a2e] text-white hover:bg-[#2a2a4e] font-medium"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Zapisz szablon
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Ładowanie szablonów…
        </div>
      ) : (
        <div className="flex-1 flex min-h-0">
          {/* Sidebar — Template list */}
          <div className="w-64 shrink-0 border-r border-slate-200 bg-slate-50/50 overflow-y-auto">
            <div className="p-3 space-y-1">
              {TEMPLATES.map((tpl) => {
                const active = tpl.id === selectedId;
                const customized = isCustomized(tpl);
                return (
                  <button
                    key={tpl.id}
                    onClick={() => setSelectedId(tpl.id)}
                    className={`w-full text-left rounded-lg px-3 py-2.5 transition-colors ${
                      active
                        ? "bg-white border border-slate-200 shadow-sm"
                        : "hover:bg-white/60 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Mail className={`h-3.5 w-3.5 shrink-0 ${active ? "text-[#D4A843]" : "text-slate-400"}`} />
                      <span className={`text-xs font-medium truncate ${active ? "text-slate-900" : "text-slate-600"}`}>
                        {tpl.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 ml-5.5">
                      {customized && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-600">
                          <CheckCircle2 className="h-3 w-3" />
                          Dostosowany
                        </span>
                      )}
                      {!customized && (
                        <span className="text-[10px] text-slate-400">Domyślny</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main area — Split view */}
          <div className="flex-1 flex min-h-0">
            {/* LEFT — Editor */}
            <div className="w-1/2 border-r border-slate-200 flex flex-col min-h-0">
              <div className="px-5 py-3 border-b border-slate-100 shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">{selected.label}</h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">{selected.description}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={useDefault} className="h-7 text-[11px] text-slate-500">
                    Wstaw domyślny
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Subject */}
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">Temat</Label>
                  <Input
                    value={draftSubject}
                    onChange={(e) => updateSubject(e.target.value)}
                    placeholder={selected.defaultSubject}
                    className="h-10 border-slate-200 bg-slate-50/80 text-sm font-medium"
                  />
                </div>

                {/* Body */}
                <div className="flex-1 flex flex-col">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">Treść</Label>
                  <textarea
                    value={draftBody}
                    onChange={(e) => updateBody(e.target.value)}
                    placeholder={selected.defaultBody}
                    className="flex-1 min-h-[300px] w-full rounded-lg border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-800 leading-relaxed resize-none focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
                  />
                </div>

                {/* Variable chips */}
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">Dostępne zmienne</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.availableVars.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => {
                          updateBody(draftBody + `{{${v}}}`);
                        }}
                        className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-[11px] font-mono text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer border border-slate-200"
                      >
                        {`{{${v}}}`}
                      </button>
                    ))}
                  </div>
                </div>

                {hasChanges && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 font-medium">
                    Niezapisane zmiany — kliknij &quot;Zapisz szablon&quot; aby zastosować
                  </div>
                )}

                {!draftBody && !draftSubject && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                    <strong>Pusto?</strong> Jeśli oba pola są puste, system użyje domyślnego szablonu wbudowanego w kod.
                    Kliknij &quot;Wstaw domyślny&quot; aby zobaczyć i edytować aktualną treść.
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
                  <span className="text-[10px] text-slate-400 ml-auto">Zmienne zamienione na przykładowe dane</span>
                </div>
              </div>
              <div className="flex-1 p-4 min-h-0">
                {previewHtml ? (
                  <iframe
                    srcDoc={previewHtml}
                    className="w-full h-full rounded-lg border border-slate-200 bg-white shadow-inner"
                    sandbox="allow-same-origin"
                    title="Podgląd szablonu e-mail"
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
        </div>
      )}
    </div>
  );
}
