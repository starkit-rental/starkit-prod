"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Save, Trash2, Package, AlertCircle, Calendar, Edit2, X, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

type ProductRow = {
  id: string;
  sanity_slug: string | null;
  name?: string | null;
  base_price_day: unknown;
  deposit_amount: unknown;
  buffer_before: number | null;
  buffer_after: number | null;
};

type StockItemRow = {
  id: string;
  product_id: string;
  serial_number: string | null;
  unavailable_from: string | null;
  unavailable_to: string | null;
  unavailable_reason: string | null;
};

function toText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const num = typeof value === "number" ? value : Number(String(value));
  return Number.isFinite(num) ? num : 0;
}

export default function OfficeInventoryPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [stockItemsByProduct, setStockItemsByProduct] = useState<Record<string, StockItemRow[]>>({});

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState<string | null>(null);
  const [showDeleteProduct, setShowDeleteProduct] = useState<string | null>(null);
  const [showDeleteStock, setShowDeleteStock] = useState<string | null>(null);
  const [showUnavailability, setShowUnavailability] = useState<string | null>(null);

  const [draftNew, setDraftNew] = useState({
    sanity_slug: "",
    name: "",
    base_price_day: "",
    deposit_amount: "",
    buffer_before: "1",
    buffer_after: "1",
  });

  const [unavailabilityForm, setUnavailabilityForm] = useState({
    unavailable_from: "",
    unavailable_to: "",
    unavailable_reason: "",
  });

  async function load() {
    setLoading(true);
    setError(null);

    const { data: productsData, error: productsError } = await supabase
      .from("products")
      .select("id,sanity_slug,name,base_price_day,deposit_amount,buffer_before,buffer_after")
      .order("name", { ascending: true });

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
      .select("id,product_id,serial_number,unavailable_from,unavailable_to,unavailable_reason")
      .in("product_id", productIds)
      .order("serial_number", { ascending: true });

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createProduct() {
    setError(null);

    const payload: any = {
      sanity_slug: draftNew.sanity_slug || null,
      name: draftNew.name || null,
      base_price_day: draftNew.base_price_day ? Number(draftNew.base_price_day) : 0,
      deposit_amount: draftNew.deposit_amount ? Number(draftNew.deposit_amount) : 0,
      buffer_before: parseInt(draftNew.buffer_before, 10) || 1,
      buffer_after: parseInt(draftNew.buffer_after, 10) || 1,
    };

    const { error: insertError } = await supabase.from("products").insert(payload);
    if (insertError) {
      setError(insertError.message);
      return;
    }

    setDraftNew({ sanity_slug: "", name: "", base_price_day: "", deposit_amount: "", buffer_before: "1", buffer_after: "1" });
    setShowAddProduct(false);
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

    setShowDeleteProduct(null);
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
    setShowDeleteStock(null);
    await load();
  }

  async function setUnavailability(stockItemId: string) {
    setError(null);
    const patch: any = {
      unavailable_from: unavailabilityForm.unavailable_from || null,
      unavailable_to: unavailabilityForm.unavailable_to || null,
      unavailable_reason: unavailabilityForm.unavailable_reason || null,
    };
    
    const { error: updateError } = await supabase.from("stock_items").update(patch).eq("id", stockItemId);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    
    setShowUnavailability(null);
    setUnavailabilityForm({ unavailable_from: "", unavailable_to: "", unavailable_reason: "" });
    await load();
  }

  async function clearUnavailability(stockItemId: string) {
    setError(null);
    const { error: updateError } = await supabase.from("stock_items").update({
      unavailable_from: null,
      unavailable_to: null,
      unavailable_reason: null,
    }).eq("id", stockItemId);
    
    if (updateError) {
      setError(updateError.message);
      return;
    }
    
    await load();
  }

  const productToEdit = showEditProduct ? products.find(p => p.id === showEditProduct) : null;
  const productToDelete = showDeleteProduct ? products.find(p => p.id === showDeleteProduct) : null;
  const stockToDelete = showDeleteStock ? Object.values(stockItemsByProduct).flat().find(s => s.id === showDeleteStock) : null;
  const stockForUnavailability = showUnavailability ? Object.values(stockItemsByProduct).flat().find(s => s.id === showUnavailability) : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-slate-700" />
          <h1 className="text-xl font-semibold text-slate-900">Inventory</h1>
        </div>

        <Button onClick={() => setShowAddProduct(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Dodaj produkt
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-sm text-muted-foreground">Ładowanie...</div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold">Nazwa produktu</TableHead>
                  <TableHead className="font-semibold">Cena / Kaucja</TableHead>
                  <TableHead className="font-semibold">Bufor (dni)</TableHead>
                  <TableHead className="font-semibold">SKU</TableHead>
                  <TableHead className="font-semibold text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => {
                  const stock = stockItemsByProduct[p.id] ?? [];
                  const displayName = p.name ?? "(bez nazwy)";
                  const price = toNumber(p.base_price_day);
                  const deposit = toNumber(p.deposit_amount);

                  return (
                    <TableRow key={p.id} className="group">
                      <TableCell>
                        <div>
                          <div className="font-medium text-slate-900">{displayName}</div>
                          {p.sanity_slug && (
                            <div className="text-xs text-slate-500 mt-0.5">slug: {p.sanity_slug}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{price.toFixed(2)} zł / dzień</div>
                          <div className="text-slate-500">{deposit.toFixed(2)} zł kaucja</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{p.buffer_before ?? 1}</span>
                            <span className="text-slate-500">przed</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{p.buffer_after ?? 1}</span>
                            <span className="text-slate-500">po</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {stock.map((si) => {
                            const isUnavailable = si.unavailable_from || si.unavailable_to;
                            return (
                              <div
                                key={si.id}
                                className={cn(
                                  "flex items-center gap-2 rounded px-2 py-1 text-xs",
                                  isUnavailable ? "bg-red-50 text-red-700" : "bg-slate-50 text-slate-700"
                                )}
                              >
                                <span className="font-mono">{si.serial_number || "(brak SN)"}</span>
                                {isUnavailable && (
                                  <span className="text-[10px] text-red-600">Niedostępny</span>
                                )}
                              </div>
                            );
                          })}
                          {stock.length === 0 && (
                            <span className="text-xs text-slate-400">Brak egzemplarzy</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowEditProduct(p.id)}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowDeleteProduct(p.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {products.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                      Brak produktów. Dodaj pierwszy produkt, aby rozpocząć.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add Product Dialog */}
      <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dodaj nowy produkt</DialogTitle>
            <DialogDescription>
              Wypełnij dane produktu. Egzemplarze (SKU) możesz dodać później.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nazwa produktu *</Label>
                <Input
                  id="name"
                  value={draftNew.name}
                  onChange={(e) => setDraftNew((s) => ({ ...s, name: e.target.value }))}
                  placeholder="np. Starlink Mini"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Sanity Slug</Label>
                <Input
                  id="slug"
                  value={draftNew.sanity_slug}
                  onChange={(e) => setDraftNew((s) => ({ ...s, sanity_slug: e.target.value }))}
                  placeholder="np. starlink-mini"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Cena za dzień (zł) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={draftNew.base_price_day}
                  onChange={(e) => setDraftNew((s) => ({ ...s, base_price_day: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deposit">Kaucja (zł) *</Label>
                <Input
                  id="deposit"
                  type="number"
                  step="0.01"
                  value={draftNew.deposit_amount}
                  onChange={(e) => setDraftNew((s) => ({ ...s, deposit_amount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="buffer_before">Bufor przed (dni)</Label>
                <Input
                  id="buffer_before"
                  type="number"
                  min="0"
                  max="14"
                  value={draftNew.buffer_before}
                  onChange={(e) => setDraftNew((s) => ({ ...s, buffer_before: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">Dni blokady przed rozpoczęciem wynajmu</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="buffer_after">Bufor po (dni)</Label>
                <Input
                  id="buffer_after"
                  type="number"
                  min="0"
                  max="14"
                  value={draftNew.buffer_after}
                  onChange={(e) => setDraftNew((s) => ({ ...s, buffer_after: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">Dni blokady po zakończeniu wynajmu</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddProduct(false)}>
              Anuluj
            </Button>
            <Button onClick={createProduct}>Dodaj produkt</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      {productToEdit && (
        <Dialog open={!!showEditProduct} onOpenChange={() => setShowEditProduct(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edytuj produkt: {productToEdit.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nazwa produktu</Label>
                  <Input
                    defaultValue={productToEdit.name ?? ""}
                    onBlur={(e) => updateProduct(productToEdit.id, { name: e.target.value || null })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sanity Slug</Label>
                  <Input
                    defaultValue={productToEdit.sanity_slug ?? ""}
                    onBlur={(e) => updateProduct(productToEdit.id, { sanity_slug: e.target.value || null })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cena za dzień (zł)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    defaultValue={toText(productToEdit.base_price_day)}
                    onBlur={(e) => updateProduct(productToEdit.id, { base_price_day: Number(e.target.value || 0) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kaucja (zł)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    defaultValue={toText(productToEdit.deposit_amount)}
                    onBlur={(e) => updateProduct(productToEdit.id, { deposit_amount: Number(e.target.value || 0) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bufor przed (dni)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="14"
                    defaultValue={productToEdit.buffer_before ?? 1}
                    onBlur={(e) => updateProduct(productToEdit.id, { buffer_before: parseInt(e.target.value, 10) || 1 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bufor po (dni)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="14"
                    defaultValue={productToEdit.buffer_after ?? 1}
                    onBlur={(e) => updateProduct(productToEdit.id, { buffer_after: parseInt(e.target.value, 10) || 1 })}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Egzemplarze (SKU)</h3>
                  <AddStockItemForm productId={productToEdit.id} onAdd={addStockItem} />
                </div>
                <div className="space-y-2">
                  {(stockItemsByProduct[productToEdit.id] ?? []).map((si) => (
                    <div key={si.id} className="flex items-center gap-2 rounded-lg border p-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Input
                            className="font-mono text-sm"
                            defaultValue={si.serial_number ?? ""}
                            onBlur={(e) => updateStockItem(si.id, { serial_number: e.target.value || null })}
                            placeholder="Numer seryjny"
                          />
                          {(si.unavailable_from || si.unavailable_to) && (
                            <div className="flex items-center gap-1 rounded bg-red-50 px-2 py-1 text-xs text-red-700">
                              <AlertCircle className="h-3 w-3" />
                              <span>Niedostępny</span>
                            </div>
                          )}
                        </div>
                        {si.unavailable_reason && (
                          <p className="text-xs text-slate-500 mt-1">{si.unavailable_reason}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowUnavailability(si.id);
                            setUnavailabilityForm({
                              unavailable_from: si.unavailable_from || "",
                              unavailable_to: si.unavailable_to || "",
                              unavailable_reason: si.unavailable_reason || "",
                            });
                          }}
                        >
                          <Calendar className="h-3.5 w-3.5 mr-1" />
                          {si.unavailable_from ? "Edytuj" : "Wyklucz"}
                        </Button>
                        {(si.unavailable_from || si.unavailable_to) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => clearUnavailability(si.id)}
                          >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Przywróć
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowDeleteStock(si.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {(stockItemsByProduct[productToEdit.id] ?? []).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Brak egzemplarzy. Dodaj pierwszy egzemplarz powyżej.
                    </p>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditProduct(null)}>
                Zamknij
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Product Dialog */}
      {productToDelete && (
        <Dialog open={!!showDeleteProduct} onOpenChange={() => setShowDeleteProduct(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Usuń produkt</DialogTitle>
              <DialogDescription>
                Czy na pewno chcesz usunąć produkt <strong>{productToDelete.name}</strong>?
                Zostaną również usunięte wszystkie egzemplarze tego produktu.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteProduct(null)}>
                Anuluj
              </Button>
              <Button variant="destructive" onClick={() => deleteProduct(productToDelete.id)}>
                Usuń produkt
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Stock Item Dialog */}
      {stockToDelete && (
        <Dialog open={!!showDeleteStock} onOpenChange={() => setShowDeleteStock(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Usuń egzemplarz</DialogTitle>
              <DialogDescription>
                Czy na pewno chcesz usunąć egzemplarz <strong>{stockToDelete.serial_number || "(brak SN)"}</strong>?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteStock(null)}>
                Anuluj
              </Button>
              <Button variant="destructive" onClick={() => deleteStockItem(stockToDelete.id)}>
                Usuń egzemplarz
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Unavailability Dialog */}
      {stockForUnavailability && (
        <Dialog open={!!showUnavailability} onOpenChange={() => setShowUnavailability(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Wyklucz egzemplarz z wynajmu</DialogTitle>
              <DialogDescription>
                Ustaw okres niedostępności dla egzemplarza <strong>{stockForUnavailability.serial_number || "(brak SN)"}</strong>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unavailable_from">Od daty</Label>
                  <Input
                    id="unavailable_from"
                    type="date"
                    value={unavailabilityForm.unavailable_from}
                    onChange={(e) => setUnavailabilityForm((s) => ({ ...s, unavailable_from: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unavailable_to">Do daty</Label>
                  <Input
                    id="unavailable_to"
                    type="date"
                    value={unavailabilityForm.unavailable_to}
                    onChange={(e) => setUnavailabilityForm((s) => ({ ...s, unavailable_to: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="unavailable_reason">Powód (opcjonalnie)</Label>
                <Textarea
                  id="unavailable_reason"
                  value={unavailabilityForm.unavailable_reason}
                  onChange={(e) => setUnavailabilityForm((s) => ({ ...s, unavailable_reason: e.target.value }))}
                  placeholder="np. Naprawa, konserwacja, zgubiony..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUnavailability(null)}>
                Anuluj
              </Button>
              <Button onClick={() => setUnavailability(stockForUnavailability.id)}>
                Zapisz
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function AddStockItemForm(props: { productId: string; onAdd: (productId: string, serial: string) => void }) {
  const [serial, setSerial] = useState("");
  const [show, setShow] = useState(false);

  return (
    <>
      <Button size="sm" onClick={() => setShow(true)}>
        <Plus className="h-3.5 w-3.5 mr-1" />
        Dodaj SKU
      </Button>
      <Dialog open={show} onOpenChange={setShow}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dodaj nowy egzemplarz</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="serial">Numer seryjny</Label>
              <Input
                id="serial"
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
                placeholder="np. STARLINK_MINI_001"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShow(false)}>
              Anuluj
            </Button>
            <Button
              onClick={() => {
                props.onAdd(props.productId, serial);
                setSerial("");
                setShow(false);
              }}
            >
              Dodaj
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
