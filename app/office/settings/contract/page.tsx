"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Save, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useToast } from "@/hooks/use-toast";

const RichTextEditor = dynamic(
  () => import("@/components/ui/rich-text-editor").then((mod) => ({ default: mod.RichTextEditor })),
  { ssr: false, loading: () => <div className="h-[400px] rounded-lg border border-slate-200 bg-slate-50 animate-pulse" /> }
);

export default function ContractEditorPage() {
  const supabase = createSupabaseBrowserClient();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contractContent, setContractContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");

  useEffect(() => {
    loadContractContent();
  }, []);

  async function loadContractContent() {
    setLoading(true);
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "contract_content")
      .single();

    if (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się załadować treści umowy: " + error.message,
        variant: "destructive",
      });
    } else if (data) {
      setContractContent(data.value);
      setOriginalContent(data.value);
    }
    setLoading(false);
  }

  async function saveContractContent() {
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .update({ value: contractContent, updated_at: new Date().toISOString() })
      .eq("key", "contract_content");

    if (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się zapisać zmian: " + error.message,
        variant: "destructive",
      });
    } else {
      setOriginalContent(contractContent);
      toast({
        title: "Zapisano",
        description: "Treść umowy została zaktualizowana pomyślnie.",
      });
    }
    setSaving(false);
  }

  const hasChanges = contractContent !== originalContent;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Umowa najmu</h1>
          <p className="mt-0.5 text-sm text-slate-500">Edytuj treść regulaminu w umowach PDF</p>
        </div>

        <Button
          onClick={saveContractContent}
          disabled={!hasChanges || saving}
          size="sm"
          className="gap-2"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Zapisz zmiany
        </Button>
      </div>

      <Card className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-base font-semibold text-slate-900">
            Treść Regulaminu
          </CardTitle>
          <p className="mt-1 text-sm text-slate-500">
            Edytuj treść regulaminu używając edytora WYSIWYG. Możesz formatować tekst, dodawać nagłówki, listy i paragrafy.
          </p>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Ładowanie treści umowy...
            </div>
          ) : (
            <div className="space-y-4">
              <RichTextEditor
                content={contractContent}
                onChange={setContractContent}
                placeholder="Wprowadź treść regulaminu..."
              />

              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                <p className="text-sm font-medium text-blue-900">
                  💡 Wskazówki dotyczące formatowania:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-blue-700">
                  <li>• Użyj przycisków na pasku narzędzi aby formatować tekst</li>
                  <li>• <strong>Bold</strong> i <em>italic</em> dla wyróżnień</li>
                  <li>• Nagłówki H2 i H3 dla tytułów sekcji</li>
                  <li>• Listy punktowane i numerowane dla wyliczenia punktów</li>
                  <li>• Zmiany będą widoczne w checkoucie i umowach PDF po zapisaniu</li>
                </ul>
              </div>

              {hasChanges && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                  <p className="text-sm font-medium text-amber-900">
                    ⚠️ Masz niezapisane zmiany
                  </p>
                  <p className="mt-1 text-sm text-amber-700">
                    Kliknij "Zapisz zmiany" aby zaktualizować treść umowy w bazie danych.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-50 rounded-xl border border-slate-200">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-slate-900">
            Podgląd struktury
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-slate-600">
            Treść regulaminu zostanie wstawiona do sekcji <strong>§5 REGULAMIN WYNAJMU</strong> w umowie PDF.
          </p>
          <p className="text-slate-600">
            Pozostałe sekcje umowy (§1-§4) są generowane automatycznie na podstawie danych zamówienia.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
