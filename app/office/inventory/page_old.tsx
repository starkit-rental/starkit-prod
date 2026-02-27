"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Save, Trash2, Package, Hash, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type ProductRow = {
  id: string;
  sanity_slug: string | null;
  name?: string | null;
  base_price_day: unknown;
  deposit_amount: unknown;
};

type StockItemRow = {
  id: string;
  product_id: string;
  serial_number: string | null;
};

function toText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

export default function OfficeInventoryPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [stockItemsByProduct, setStockItemsByProduct] = useState<Record<string, StockItemRow[]>>({});

  const [draftNew, setDraftNew] = useState({
    sanity_slug: "",
    nameOrTitle: "",
    base_price_day: "",
    deposit_amount: "",
  });

  const [bufferDays, setBufferDays] = useState("2");
  const [savingBuffer, setSavingBuffer] = useState(false);
  const [bufferSaved, setBufferSaved] = useState(false);

  async function loadBufferDays() {
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "buffer_days")
      .maybeSingle();
    setBufferDays(data?.value ?? "2");
  }

  async function saveBufferDays() {
    setSavingBuffer(true);
    setBufferSaved(false);
    const val = String(Math.max(0, parseInt(bufferDays, 10) || 0));
    await supabase.from("site_settings").upsert({ key: "buffer_days", value: val }, { onConflict: "key" });
    setSavingBuffer(false);
    setBufferSaved(true);
    setTimeout(() => setBufferSaved(false), 3000);
  }

  async function load() {
    setLoading(true);
    setError(null);

    const { data: productsData, error: productsError } = await supabase
      .from("products")
      .select("id,sanity_slug,name,base_price_day,deposit_amount")
      .order("id", { ascending: true });

    if (productsError) {
      setError(productsError.message);
      setLoading(false);
      return;
    }

    const nextProducts = (productsData ?? []) as ProductRow[];
    setProducts(nextProducts);

    const productIds = nextProducts.map((p) => p.id);

    if (productIds.length === 0) {
      setStockItemsByProduct({});
      setLoading(false);
      return;
    }

    const { data: stockData, error: stockError } = await supabase
      .from("stock_items")
      .select("id,product_id,serial_number")
      .in("product_id", productIds)
      .order("id", { ascending: true });

    if (stockError) {
      setError(stockError.message);
      setLoading(false);
      return;
    }

    const grouped: Record<string, StockItemRow[]> = {};
    for (const row of (stockData ?? []) as StockItemRow[]) {
      if (!grouped[row.product_id]) grouped[row.product_id] = [];
      grouped[row.product_id].push(row);
    }
    setStockItemsByProduct(grouped);

    setLoading(false);
  }

  useEffect(() => {
    void load();
    void loadBufferDays();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createProduct() {
    setError(null);

    const payload: any = {
      sanity_slug: draftNew.sanity_slug || null,
      base_price_day: draftNew.base_price_day ? Number(draftNew.base_price_day) : 0,
      deposit_amount: draftNew.deposit_amount ? Number(draftNew.deposit_amount) : 0,
    };

    payload.name = draftNew.nameOrTitle || null;

    const { error: insertError } = await supabase.from("products").insert(payload);
    if (insertError) {
      setError(insertError.message);
      return;
    }

    setDraftNew({ sanity_slug: "", nameOrTitle: "", base_price_day: "", deposit_amount: "" });
    await load();
  }

  async function updateProduct(productId: string, patch: Partial<ProductRow> & Record<string, any>) {
    setError(null);
    const { error: updateError } = await supabase.from("products").update(patch).eq("id", productId);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    await load();
  }

  async function deleteProduct(productId: string) {
    setError(null);

    const { error: stockDeleteError } = await supabase.from("stock_items").delete().eq("product_id", productId);
    if (stockDeleteError) {
      setError(stockDeleteError.message);
      return;
    }

    const { error: deleteError } = await supabase.from("products").delete().eq("id", productId);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    await load();
  }

  async function addStockItem(productId: string, serial: string) {
    setError(null);
    const { error: insertError } = await supabase.from("stock_items").insert({
      product_id: productId,
      serial_number: serial || null,
    });
    if (insertError) {
      setError(insertError.message);
      return;
    }
    await load();
  }

  async function updateStockItem(stockItemId: string, patch: Partial<StockItemRow>) {
    setError(null);
    const { error: updateError } = await supabase.from("stock_items").update(patch).eq("id", stockItemId);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    await load();
  }

  async function deleteStockItem(stockItemId: string) {
    setError(null);
    const { error: deleteError } = await supabase.from("stock_items").delete().eq("id", stockItemId);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    await load();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Package className="h-5 w-5" />
        <h1 className="text-lg font-semibold">Inventory</h1>
      </div>

      {error && <div className="text-sm text-destructive">{error}</div>}

      {/* Buffer days setting */}
      <div className="rounded-lg border p-4 bg-amber-50 border-amber-200">
        <div className="mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4 text-amber-600" />
          <div className="text-sm font-semibold text-amber-900">Bufor logistyczny (dni blokady przed i po rezerwacji)</div>
        </div>
        <p className="text-xs text-amber-700 mb-3">
          Liczba dni zablokowanych przed datą startu i po dacie zwrotu każdej rezerwacji. Dotyczy każdego egzemplarza osobno. Domyślnie: 2 dni.
        </p>
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-amber-700 font-medium">Dni buforu (przed i po)</label>
            <Input
              type="number"
              min="0"
              max="14"
              value={bufferDays}
              onChange={(e) => setBufferDays(e.target.value)}
              className="w-24 bg-white border-amber-300"
            />
          </div>
          <Button
            onClick={saveBufferDays}
            disabled={savingBuffer}
            size="sm"
            className="mt-5 bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Save className="h-4 w-4 mr-1" />
            {savingBuffer ? "Zapisywanie…" : bufferSaved ? "Zapisano ✓" : "Zapisz"}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-medium">Dodaj produkt</div>
          <Button onClick={createProduct} size="sm">
            <Plus className="h-4 w-4" />
            Dodaj
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted-foreground">sanity_slug</label>
            <Input value={draftNew.sanity_slug} onChange={(e) => setDraftNew((s) => ({ ...s, sanity_slug: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted-foreground">nazwa / title</label>
            <Input value={draftNew.nameOrTitle} onChange={(e) => setDraftNew((s) => ({ ...s, nameOrTitle: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted-foreground">cena doby (DECIMAL)</label>
            <Input value={draftNew.base_price_day} onChange={(e) => setDraftNew((s) => ({ ...s, base_price_day: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted-foreground">kaucja (DECIMAL)</label>
            <Input value={draftNew.deposit_amount} onChange={(e) => setDraftNew((s) => ({ ...s, deposit_amount: e.target.value }))} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Ładowanie...</div>
      ) : (
        <div className="flex flex-col gap-4">
          {products.map((p) => {
            const displayName = p.name ?? "(bez nazwy)";
            const stock = stockItemsByProduct[p.id] ?? [];

            return (
              <div key={p.id} className="rounded-lg border p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{displayName}</div>
                    <div className="text-xs text-muted-foreground">id: {p.id}</div>
                  </div>

                  <Button variant="destructive" size="sm" onClick={() => deleteProduct(p.id)}>
                    <Trash2 className="h-4 w-4" />
                    Usuń
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-muted-foreground">sanity_slug</label>
                    <Input
                      defaultValue={p.sanity_slug ?? ""}
                      onBlur={(e) => updateProduct(p.id, { sanity_slug: e.target.value || null })}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-muted-foreground">name</label>
                    <Input
                      defaultValue={displayName}
                      onBlur={(e) =>
                        updateProduct(p.id, {
                          name: e.target.value || null,
                        })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-muted-foreground">cena doby</label>
                    <Input
                      defaultValue={toText(p.base_price_day)}
                      onBlur={(e) => updateProduct(p.id, { base_price_day: Number(e.target.value || 0) })}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-muted-foreground">kaucja</label>
                    <Input
                      defaultValue={toText(p.deposit_amount)}
                      onBlur={(e) => updateProduct(p.id, { deposit_amount: Number(e.target.value || 0) })}
                    />
                  </div>
                </div>

                <div className="mt-5 rounded-md border bg-muted/20 p-3">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <Hash className="h-4 w-4" />
                    Egzemplarze (stock_items)
                  </div>

                  <StockItemsEditor
                    stockItems={stock}
                    onAdd={(serial) => addStockItem(p.id, serial)}
                    onUpdate={(id, serial) => updateStockItem(id, { serial_number: serial || null })}
                    onDelete={(id) => deleteStockItem(id)}
                  />
                </div>
              </div>
            );
          })}

          {products.length === 0 && <div className="text-sm text-muted-foreground">Brak produktów.</div>}
        </div>
      )}
    </div>
  );
}

function StockItemsEditor(props: {
  stockItems: StockItemRow[];
  onAdd: (serial: string) => void;
  onUpdate: (id: string, serial: string) => void;
  onDelete: (id: string) => void;
}) {
  const [serial, setSerial] = useState("");

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Numer seryjny"
          value={serial}
          onChange={(e) => setSerial(e.target.value)}
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            props.onAdd(serial);
            setSerial("");
          }}
        >
          <Plus className="h-4 w-4" />
          Dodaj
        </Button>
      </div>

      <div className="divide-y rounded-md border bg-background">
        {props.stockItems.map((si) => (
          <div key={si.id} className="flex items-center justify-between gap-3 p-2">
            <div className="min-w-0 flex-1">
              <Input
                defaultValue={si.serial_number ?? ""}
                onBlur={(e) => props.onUpdate(si.id, e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => props.onDelete(si.id)} aria-label="Usuń">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {props.stockItems.length === 0 && (
          <div className="p-3 text-sm text-muted-foreground">Brak egzemplarzy.</div>
        )}
      </div>
    </div>
  );
}
