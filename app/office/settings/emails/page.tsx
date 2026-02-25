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
  infoBoxKey: string;
  ctaTextKey: string;
  ctaLinkKey: string;
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
    infoBoxKey: "email_info_box_order_received",
    ctaTextKey: "email_cta_text_order_received",
    ctaLinkKey: "email_cta_link_order_received",
    defaultSubject: "Otrzymaliśmy Twoją rezerwację Starlink Mini — {{order_number}}",
    defaultBody: `<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1a1a2e;line-height:1.3;text-align:center">📡 Dziękujemy za złożenie zamówienia!</h1>
<p style="margin:0 0 24px;font-size:15px;color:#64748b;text-align:center">Cześć {{customer_name}}, mamy Twoje zamówienie</p>
<p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.65">Twoja rezerwacja <strong>{{order_number}}</strong> została zarejestrowana w naszym systemie. Płatność została potwierdzona.</p>
{{summary_box}}
<p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.65"><strong>Co dalej?</strong> Nasz zespół weryfikuje dostępność sprzętu na wybrane przez Ciebie daty. Uwzględniamy również 2-dniowy bufor logistyczny na przygotowanie i wysyłkę.</p>
<p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.65">W ciągu najbliższych godzin otrzymasz kolejną wiadomość z <strong>oficjalnym potwierdzeniem rezerwacji</strong> oraz umową najmu w formacie PDF.</p>
{{info_box}}
<p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.65">Jeśli masz pytania, śmiało odpowiedz na tego maila lub napisz na <a href="mailto:wynajem@starkit.pl" style="color:#1a1a2e;font-weight:600">wynajem@starkit.pl</a>.</p>
<p style="margin:24px 0 0;font-size:15px;color:#334155;line-height:1.65">Pozdrawiamy,<br/><strong>Zespół Starkit</strong></p>`,
    availableVars: ["customer_name", "order_number", "start_date", "end_date", "total_amount", "summary_box", "info_box"],
  },
  {
    id: "order_confirmed",
    label: "Potwierdzenie rezerwacji",
    description: "Po zmianie statusu na 'reserved' — z umową PDF w załączniku.",
    subjectKey: "email_subject_order_confirmed",
    bodyKey: "email_body_order_confirmed",
    infoBoxKey: "email_info_box_order_confirmed",
    ctaTextKey: "email_cta_text_order_confirmed",
    ctaLinkKey: "email_cta_link_order_confirmed",
    defaultSubject: "Potwierdzenie rezerwacji SK-{{order_number}}",
    defaultBody: `<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1a1a2e;line-height:1.3;text-align:center">🎉 Mamy to! Twoja rezerwacja jest potwierdzona</h1>
<p style="margin:0 0 24px;font-size:15px;color:#64748b;text-align:center">Wszystko gotowe, {{customer_name}}</p>
<p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.65">Świetna wiadomość! Twoja rezerwacja <strong>{{order_number}}</strong> została oficjalnie potwierdzona. Sprzęt jest zarezerwowany i czeka na Ciebie.</p>
{{reservation_details_box}}
{{pdf_box}}
{{financial_box}}
{{info_box}}
<p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.65"><strong>Ważne informacje:</strong></p>
<ul style="margin:0 0 16px;padding-left:20px;font-size:14px;color:#334155;line-height:1.8">
<li>Sprzęt odbierzesz w dniu <strong>{{start_date}}</strong></li>
<li>Zwrot do końca dnia <strong>{{end_date}}</strong></li>
<li>Kod odbioru otrzymasz SMS-em od InPost</li>
<li>W razie pytań — odpowiedz na tego maila</li>
</ul>
<p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.65">Dziękujemy za wybór Starkit i życzymy udanego wynajmu!</p>
<p style="margin:24px 0 0;font-size:15px;color:#334155;line-height:1.65">Pozdrawiamy,<br/><strong>Zespół Starkit</strong></p>`,
    availableVars: ["customer_name", "order_number", "start_date", "end_date", "rental_days", "rental_price", "deposit", "total_amount", "inpost_point_id", "inpost_point_address", "reservation_details_box", "pdf_box", "financial_box", "info_box", "order_link"],
  },
  {
    id: "order_picked_up",
    label: "Wysyłka / Instrukcja",
    description: "Po zmianie statusu na 'picked_up' — sprzęt w drodze.",
    subjectKey: "email_subject_order_picked_up",
    bodyKey: "email_body_order_picked_up",
    infoBoxKey: "email_info_box_order_picked_up",
    ctaTextKey: "email_cta_text_order_picked_up",
    ctaLinkKey: "email_cta_link_order_picked_up",
    defaultSubject: "Sprzęt w drodze! SK-{{order_number}}",
    defaultBody: `<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1a1a2e;line-height:1.3;text-align:center">🚀 Sprzęt jest już w drodze!</h1>
<p style="margin:0 0 24px;font-size:15px;color:#64748b;text-align:center">Zamówienie {{order_number}} zostało wysłane, {{customer_name}}</p>
<p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.65">Twój zestaw Starlink Mini został nadany i wkrótce będzie gotowy do odbioru. Poniżej znajdziesz dane punktu odbioru oraz instrukcję uruchomienia.</p>
{{pickup_box}}
{{instructions_box}}
{{info_box}}
<p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.65"><strong>Okres wynajmu:</strong> {{start_date}} – {{end_date}}</p>
<p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.65">Jeśli napotkasz jakiekolwiek problemy z uruchomieniem, odpowiedz na tego maila — pomożemy!</p>
<p style="margin:24px 0 0;font-size:15px;color:#334155;line-height:1.65">Pozdrawiamy,<br/><strong>Zespół Starkit</strong></p>`,
    availableVars: ["customer_name", "order_number", "start_date", "end_date", "total_amount", "pickup_box", "instructions_box", "info_box"],
  },
  {
    id: "order_returned",
    label: "Potwierdzenie zwrotu",
    description: "Po zmianie statusu na 'returned'.",
    subjectKey: "email_subject_order_returned",
    bodyKey: "email_body_order_returned",
    infoBoxKey: "email_info_box_order_returned",
    ctaTextKey: "email_cta_text_order_returned",
    ctaLinkKey: "email_cta_link_order_returned",
    defaultSubject: "Potwierdzenie zwrotu sprzętu SK-{{order_number}}",
    defaultBody: `<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1a1a2e;line-height:1.3;text-align:center">✅ Dziękujemy za zwrot sprzętu</h1>
<p style="margin:0 0 24px;font-size:15px;color:#64748b;text-align:center">Zamówienie {{order_number}}, {{customer_name}}</p>
<p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.65">Potwierdzamy odbiór zwróconego zestawu Starlink Mini z zamówienia <strong>{{order_number}}</strong>. Sprzęt został sprawdzony i przyjęty.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0">
<tr><td style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-left:4px solid #22c55e;border-radius:8px;padding:16px 20px">
<p style="margin:0;font-size:14px;line-height:1.6;color:#166534">💳 <strong>Zwrot kaucji:</strong> Kaucja zostanie przetworzona ręcznie przez nasz zespół. Środki powinny pojawić się na Twoim koncie w ciągu <strong>3–5 dni roboczych</strong>. Jeśli po tym czasie nie widzisz zwrotu, napisz do nas.</p>
</td></tr>
</table>
{{info_box}}
<p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.65">Dziękujemy za skorzystanie z Starkit! Mamy nadzieję, że internet Starlink spełnił Twoje oczekiwania. 🛰️</p>
<p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.65">Będziemy wdzięczni za Twoją opinię — <strong>odpowiedz na tego maila</strong> i powiedz, jak Ci się korzystało!</p>
<p style="margin:24px 0 0;font-size:15px;color:#334155;line-height:1.65">Pozdrawiamy,<br/><strong>Zespół Starkit</strong></p>`,
    availableVars: ["customer_name", "order_number", "start_date", "end_date", "total_amount", "info_box"],
  },
  {
    id: "order_cancelled",
    label: "Anulowanie zamówienia",
    description: "Po zmianie statusu na 'cancelled'.",
    subjectKey: "email_subject_order_cancelled",
    bodyKey: "email_body_order_cancelled",
    infoBoxKey: "email_info_box_order_cancelled",
    ctaTextKey: "email_cta_text_order_cancelled",
    ctaLinkKey: "email_cta_link_order_cancelled",
    defaultSubject: "Informacja o anulowaniu zamówienia SK-{{order_number}}",
    defaultBody: `<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1a1a2e;line-height:1.3;text-align:center">Zamówienie anulowane</h1>
<p style="margin:0 0 24px;font-size:15px;color:#64748b;text-align:center">Zamówienie {{order_number}}, {{customer_name}}</p>
<p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.65">Twoje zamówienie <strong>{{order_number}}</strong> zostało anulowane.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0">
<tr><td style="background-color:#fff7ed;border:1px solid #f97316;border-left:4px solid #f97316;border-radius:8px;padding:16px 20px">
<p style="margin:0;font-size:14px;line-height:1.6;color:#9a3412">Jeśli dokonałeś płatności, zwrot środków nastąpi w ciągu <strong>5–10 dni roboczych</strong> na konto, z którego dokonano płatności.</p>
</td></tr>
</table>
{{info_box}}
<p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.65">Jeśli masz pytania dotyczące anulowania lub chcesz złożyć nowe zamówienie, skontaktuj się z nami:</p>
<p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.65">📧 <a href="mailto:wynajem@starkit.pl" style="color:#1a1a2e;font-weight:600">wynajem@starkit.pl</a><br/>🌐 <a href="https://www.starkit.pl" style="color:#1a1a2e;font-weight:600">www.starkit.pl</a></p>
<p style="margin:24px 0 0;font-size:15px;color:#334155;line-height:1.65">Pozdrawiamy,<br/><strong>Zespół Starkit</strong></p>`,
    availableVars: ["customer_name", "order_number", "start_date", "end_date", "total_amount", "info_box", "order_link"],
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
  const [savedInfoBoxes, setSavedInfoBoxes] = useState<Record<string, string>>({});
  const [savedCtaTexts, setSavedCtaTexts] = useState<Record<string, string>>({});
  const [savedCtaLinks, setSavedCtaLinks] = useState<Record<string, string>>({});

  // Working drafts
  const [draftSubjects, setDraftSubjects] = useState<Record<string, string>>({});
  const [draftBodies, setDraftBodies] = useState<Record<string, string>>({});
  const [draftInfoBoxes, setDraftInfoBoxes] = useState<Record<string, string>>({});
  const [draftCtaTexts, setDraftCtaTexts] = useState<Record<string, string>>({});
  const [draftCtaLinks, setDraftCtaLinks] = useState<Record<string, string>>({});

  // Preview
  const [previewHtml, setPreviewHtml] = useState("");
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selected = TEMPLATES.find((t) => t.id === selectedId) ?? TEMPLATES[0];
  const draftSubject = draftSubjects[selected.subjectKey] ?? "";
  const draftBody = draftBodies[selected.bodyKey] ?? "";
  const draftInfoBox = draftInfoBoxes[selected.infoBoxKey] ?? "";
  const draftCtaText = draftCtaTexts[selected.ctaTextKey] ?? "";
  const draftCtaLink = draftCtaLinks[selected.ctaLinkKey] ?? "";
  const savedSubject = savedSubjects[selected.subjectKey] ?? "";
  const savedBody = savedBodies[selected.bodyKey] ?? "";
  const savedInfoBox = savedInfoBoxes[selected.infoBoxKey] ?? "";
  const savedCtaText = savedCtaTexts[selected.ctaTextKey] ?? "";
  const savedCtaLink = savedCtaLinks[selected.ctaLinkKey] ?? "";
  const hasChanges = draftSubject !== savedSubject || draftBody !== savedBody || draftInfoBox !== savedInfoBox || draftCtaText !== savedCtaText || draftCtaLink !== savedCtaLink;

  useEffect(() => {
    void loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch preview when selected template, draft body, info box, or CTA changes
  useEffect(() => {
    debouncedPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, draftBody, draftInfoBox, draftCtaText, draftCtaLink]);

  async function loadTemplates() {
    setLoading(true);
    const allKeys = TEMPLATES.flatMap((t) => [t.subjectKey, t.bodyKey, t.infoBoxKey, t.ctaTextKey, t.ctaLinkKey]);
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
    const info: Record<string, string> = {};
    const ctaT: Record<string, string> = {};
    const ctaL: Record<string, string> = {};
    for (const tpl of TEMPLATES) {
      subj[tpl.subjectKey] = map[tpl.subjectKey] ?? "";
      body[tpl.bodyKey] = map[tpl.bodyKey] ?? "";
      info[tpl.infoBoxKey] = map[tpl.infoBoxKey] ?? "";
      ctaT[tpl.ctaTextKey] = map[tpl.ctaTextKey] ?? "";
      ctaL[tpl.ctaLinkKey] = map[tpl.ctaLinkKey] ?? "";
    }

    setSavedSubjects(subj);
    setSavedBodies(body);
    setSavedInfoBoxes(info);
    setSavedCtaTexts(ctaT);
    setSavedCtaLinks(ctaL);
    setDraftSubjects(subj);
    setDraftBodies(body);
    setDraftInfoBoxes(info);
    setDraftCtaTexts(ctaT);
    setDraftCtaLinks(ctaL);
    setLoading(false);
  }

  function updateSubject(value: string) {
    setDraftSubjects((prev) => ({ ...prev, [selected.subjectKey]: value }));
  }

  function updateBody(value: string) {
    setDraftBodies((prev) => ({ ...prev, [selected.bodyKey]: value }));
  }

  function updateInfoBox(value: string) {
    setDraftInfoBoxes((prev) => ({ ...prev, [selected.infoBoxKey]: value }));
  }

  function resetDraft() {
    setDraftSubjects((prev) => ({ ...prev, [selected.subjectKey]: savedSubjects[selected.subjectKey] ?? "" }));
    setDraftBodies((prev) => ({ ...prev, [selected.bodyKey]: savedBodies[selected.bodyKey] ?? "" }));
    setDraftInfoBoxes((prev) => ({ ...prev, [selected.infoBoxKey]: savedInfoBoxes[selected.infoBoxKey] ?? "" }));
    setDraftCtaTexts((prev) => ({ ...prev, [selected.ctaTextKey]: savedCtaTexts[selected.ctaTextKey] ?? "" }));
    setDraftCtaLinks((prev) => ({ ...prev, [selected.ctaLinkKey]: savedCtaLinks[selected.ctaLinkKey] ?? "" }));
  }

  async function fetchPreview() {
    try {
      const bodyText = draftBodies[selected.bodyKey] ?? "";
      const infoBoxText = draftInfoBoxes[selected.infoBoxKey] ?? "";
      const ctaText = draftCtaTexts[selected.ctaTextKey] ?? "";
      const ctaLink = draftCtaLinks[selected.ctaLinkKey] ?? "";
      const res = await fetch("/api/office/preview-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawBody: bodyText || selected.defaultBody,
          infoBoxContent: infoBoxText || undefined,
          ctaText: ctaText || undefined,
          ctaLink: ctaLink || undefined,
        }),
      });
      if (res.ok) setPreviewHtml(await res.text());
    } catch { /* silent */ }
  }

  function debouncedPreview() {
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    previewTimerRef.current = setTimeout(() => void fetchPreview(), 400);
  }

  async function upsertSetting(key: string, value: string) {
    const { error } = await supabase
      .from("site_settings")
      .update({ value, updated_at: new Date().toISOString() })
      .eq("key", key);
    if (error) {
      const { error: e2 } = await supabase
        .from("site_settings")
        .insert({ key, value, updated_at: new Date().toISOString() });
      if (e2) throw e2;
    }
  }

  async function saveCurrentTemplate() {
    setSaving(true);

    const pairs: { key: string; value: string }[] = [
      { key: selected.subjectKey, value: draftSubject },
      { key: selected.bodyKey, value: draftBody },
      { key: selected.infoBoxKey, value: draftInfoBox },
      { key: selected.ctaTextKey, value: draftCtaText },
      { key: selected.ctaLinkKey, value: draftCtaLink },
    ];

    try {
      for (const { key, value } of pairs) {
        await upsertSetting(key, value);
      }

      setSavedSubjects((prev) => ({ ...prev, [selected.subjectKey]: draftSubject }));
      setSavedBodies((prev) => ({ ...prev, [selected.bodyKey]: draftBody }));
      setSavedInfoBoxes((prev) => ({ ...prev, [selected.infoBoxKey]: draftInfoBox }));
      setSavedCtaTexts((prev) => ({ ...prev, [selected.ctaTextKey]: draftCtaText }));
      setSavedCtaLinks((prev) => ({ ...prev, [selected.ctaLinkKey]: draftCtaLink }));
      toast({ title: "Zapisano", description: `Szablon "${selected.label}" zaktualizowany.` });
    } catch (e: any) {
      toast({ title: "Błąd", description: e?.message || "Nie udało się zapisać.", variant: "destructive" });
    }
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

                {/* Info Box (Yellow Box) */}
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">
                    Blok Informacyjny (Żółty Box)
                  </Label>
                  <p className="text-[11px] text-slate-400 mb-1.5">
                    Opcjonalny. Wyświetla się w miejscu tagu <code className="bg-slate-100 px-1 rounded text-[10px]">{'{{info_box}}'}</code> w treści, lub na końcu jeśli tag nie użyty. Pusty = brak boxu.
                  </p>
                  <textarea
                    value={draftInfoBox}
                    onChange={(e) => updateInfoBox(e.target.value)}
                    placeholder="np. Kaucja zostanie zwrócona w ciągu 48h od zwrotu sprzętu…"
                    rows={3}
                    className="w-full rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-sm text-slate-800 leading-relaxed resize-none focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 font-mono"
                  />
                </div>

                {/* CTA Button */}
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">
                    Przycisk (CTA)
                  </Label>
                  <p className="text-[11px] text-slate-400 mb-1.5">
                    Opcjonalny przycisk akcji. Oba pola muszą być wypełnione. Pusty = brak przycisku.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={draftCtaText}
                      onChange={(e) => setDraftCtaTexts((prev) => ({ ...prev, [selected.ctaTextKey]: e.target.value }))}
                      placeholder="Tekst przycisku, np. Szczegóły zamówienia"
                      className="h-9 border-slate-200 bg-slate-50/80 text-sm flex-1"
                    />
                    <Input
                      value={draftCtaLink}
                      onChange={(e) => setDraftCtaLinks((prev) => ({ ...prev, [selected.ctaLinkKey]: e.target.value }))}
                      placeholder="Link, np. {{order_link}}"
                      className="h-9 border-slate-200 bg-slate-50/80 text-sm flex-1 font-mono"
                    />
                  </div>
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
                    <strong>Tryb Blank Canvas:</strong> Jeśli treść jest pusta, mail będzie zawierał tylko logo i stopkę.
                    Kliknij &quot;Wstaw domyślny&quot; aby wypełnić pełny szablon z powitaniem i podpisem.
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
