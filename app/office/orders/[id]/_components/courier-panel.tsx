"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, Download, Loader2, Truck, RotateCcw, CheckCircle2, AlertCircle, ExternalLink, Copy, Check } from "lucide-react";
import { CreateShipmentDialog } from "./create-shipment-dialog";
import type { ParcelSize } from "@/lib/courier/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

interface CourierPanelProps {
  orderId: string;
  orderNumber: string | null;
  inpostPointId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  customerAddress?: {
    street: string | null;
    city: string | null;
    zip: string | null;
  };
}

export function CourierPanel({ 
  orderId, 
  orderNumber, 
  inpostPointId,
  customerName,
  customerPhone,
  customerEmail,
  customerAddress,
}: CourierPanelProps) {
  const supabase = createSupabaseBrowserClient();
  const [parcelSize, setParcelSize] = useState<ParcelSize>('small');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'outbound' | 'return'>('outbound');
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [outboundCreated, setOutboundCreated] = useState(false);
  const [returnCreated, setReturnCreated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [senderData, setSenderData] = useState<any>(null);
  const [loadingSender, setLoadingSender] = useState(true);
  const [shipments, setShipments] = useState<any[]>([]);
  const [loadingShipments, setLoadingShipments] = useState(true);
  const [copiedTracking, setCopiedTracking] = useState<string | null>(null);

  // Load existing shipments for this order
  async function loadShipments() {
    setLoadingShipments(true);
    const { data } = await supabase
      .from('courier_shipments')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });
    
    if (data && data.length > 0) {
      setShipments(data);
      const hasOutbound = data.some((s: any) => s.shipment_type === 'outbound');
      const hasReturn = data.some((s: any) => s.shipment_type === 'return');
      setOutboundCreated(hasOutbound);
      setReturnCreated(hasReturn);
    }
    setLoadingShipments(false);
  }

  // Load sender configuration and shipments
  useEffect(() => {
    async function loadSenderConfig() {
      setLoadingSender(true);
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', [
          'courier_sender_first_name',
          'courier_sender_last_name',
          'courier_sender_phone',
          'courier_sender_email',
          'courier_sender_street',
          'courier_sender_building',
          'courier_sender_flat',
          'courier_sender_post_code',
          'courier_sender_city',
          'courier_sender_posting_code',
        ]);

      if (data && data.length > 0) {
        const settingsMap = new Map(data.map((s) => [s.key, s.value]));
        setSenderData({
          firstName: settingsMap.get('courier_sender_first_name') || 'Maciej',
          lastName: settingsMap.get('courier_sender_last_name') || 'Godek',
          phoneNumber: settingsMap.get('courier_sender_phone') || '795097658',
          email: settingsMap.get('courier_sender_email') || 'starkit.rental@gmail.com',
          street: settingsMap.get('courier_sender_street') || 'Cumownicza',
          buildingNumber: settingsMap.get('courier_sender_building') || '1a',
          flatNumber: settingsMap.get('courier_sender_flat') || '2',
          postCode: settingsMap.get('courier_sender_post_code') || '60-480',
          city: settingsMap.get('courier_sender_city') || 'Poznań',
          postingCode: settingsMap.get('courier_sender_posting_code') || 'POZ118M',
        });
      } else {
        // Use defaults
        setSenderData({
          firstName: 'Maciej',
          lastName: 'Godek',
          phoneNumber: '795097658',
          email: 'starkit.rental@gmail.com',
          street: 'Cumownicza',
          buildingNumber: '1a',
          flatNumber: '2',
          postCode: '60-480',
          city: 'Poznań',
          postingCode: 'POZ118M',
        });
      }
      setLoadingSender(false);
    }
    loadSenderConfig();
    loadShipments();
  }, [supabase, orderId]);

  if (!inpostPointId) {
    return (
      <div className="flex items-center gap-2 text-amber-600">
        <AlertCircle className="h-4 w-4" />
        <p className="text-sm">Brak wybranego paczkomatu InPost w zamówieniu</p>
      </div>
    );
  }

  const openOutboundDialog = () => {
    setDialogType('outbound');
    setDialogOpen(true);
  };

  const openReturnDialog = () => {
    setDialogType('return');
    setDialogOpen(true);
  };

  const handleCreateShipment = async (options: {
    insurance: boolean;
    insuranceValue: number;
    saturdayDelivery: boolean;
    sender: any;
    receiver: any;
    productId?: number;
  }) => {
    setError(null);

    // Use GlobKurier endpoint
    const endpoint = '/api/courier/globkurier/create-shipment';

    console.log('Creating shipment:', { endpoint, options, dialogType });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        orderId, 
        parcelSize,
        shipmentType: dialogType,
        productId: options.productId,
        insurance: options.insurance,
        insuranceValue: options.insuranceValue,
        saturdayDelivery: options.saturdayDelivery,
      }),
    });

    const data = await response.json();

    console.log('Shipment response:', { status: response.status, data });

    if (!response.ok) {
      const errorMessage = data.details || data.error || 'Nie udało się utworzyć przesyłki';
      console.error('Shipment creation failed:', errorMessage, data);
      throw new Error(errorMessage);
    }

    if (dialogType === 'outbound') {
      setOutboundCreated(true);
    } else {
      setReturnCreated(true);
    }
    // Reload shipments to get the new data
    loadShipments();
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedTracking(text);
    setTimeout(() => setCopiedTracking(null), 2000);
  };

  const handleDownloadPDF = async () => {
    setError(null);
    setDownloadingPDF(true);

    try {
      const response = await fetch('/api/courier/globkurier/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Nie udało się wygenerować PDF');
      }

      // Download PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `etykiety-${orderNumber || orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd');
    } finally {
      setDownloadingPDF(false);
    }
  };

  const canDownloadPDF = outboundCreated || returnCreated;
  const outboundShipment = shipments.find((s: any) => s.shipment_type === 'outbound');
  const returnShipment = shipments.find((s: any) => s.shipment_type === 'return');

  if (loadingSender || loadingShipments || !senderData) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  // Parse customer name
  const nameParts = (customerName || '').trim().split(' ');
  const receiverFirstName = nameParts[0] || 'Klient';
  const receiverLastName = nameParts.slice(1).join(' ') || 'Starkit';

  // Prepare sender and receiver data for dialog
  const sender = dialogType === 'outbound' ? senderData : {
    firstName: receiverFirstName,
    lastName: receiverLastName,
    phoneNumber: customerPhone || '000000000',
    email: customerEmail || senderData.email,
    street: 'Paczkomat InPost',
    buildingNumber: inpostPointId || '',
    flatNumber: '',
    postCode: '00-000',
    city: 'Polska',
    postingCode: inpostPointId || '',
  };

  const receiver = dialogType === 'outbound' ? {
    firstName: receiverFirstName,
    lastName: receiverLastName,
    phoneNumber: customerPhone || '000000000',
    email: customerEmail || senderData.email,
    street: customerAddress?.street || '',
    buildingNumber: customerAddress?.street?.match(/(\d+[a-zA-Z]?)(?:\/|$)/)?.[1] || '',
    flatNumber: customerAddress?.street?.match(/\/(\d+[a-zA-Z]?)$/)?.[1] || '',
    postCode: customerAddress?.zip || '',
    city: customerAddress?.city || '',
    destinationCode: inpostPointId || '',
  } : {
    firstName: senderData.firstName,
    lastName: senderData.lastName,
    phoneNumber: senderData.phoneNumber,
    email: senderData.email,
    street: senderData.street,
    buildingNumber: senderData.buildingNumber,
    flatNumber: senderData.flatNumber,
    postCode: senderData.postCode,
    city: senderData.city,
    destinationCode: senderData.postingCode,
  };

  return (
    <>
    <div className="space-y-4">
        {/* Parcel Size Selection */}
        <div className="space-y-2">
          <Label htmlFor="parcel-size">Rozmiar paczki</Label>
          <Select value={parcelSize} onValueChange={(v) => setParcelSize(v as ParcelSize)}>
            <SelectTrigger id="parcel-size">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">
                Mała (18 × 35 × 60 cm, gabaryt B)
              </SelectItem>
              <SelectItem value="large">
                Duża (64 × 38 × 41 cm, 15kg, gabaryt C)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* InPost Point Info */}
        <div className="rounded-lg bg-blue-50 p-3 text-sm">
          <p className="font-medium text-blue-900">Paczkomat: {inpostPointId}</p>
        </div>

        {/* Existing Shipments Display */}
        {shipments.length > 0 && (
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Utworzone przesyłki</Label>
            
            {outboundShipment && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-900">Etykieta wysyłkowa</span>
                  </div>
                  <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">
                    {outboundShipment.status || 'SAVED'}
                  </span>
                </div>
                {outboundShipment.tracking_number && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-slate-500">Nr śledzenia:</span>
                    <code className="text-xs font-mono bg-white px-2 py-1 rounded border">
                      {outboundShipment.tracking_number}
                    </code>
                    <button
                      onClick={() => copyToClipboard(outboundShipment.tracking_number)}
                      className="p-1 hover:bg-emerald-100 rounded"
                      title="Kopiuj numer"
                    >
                      {copiedTracking === outboundShipment.tracking_number ? (
                        <Check className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <Copy className="h-3 w-3 text-slate-400" />
                      )}
                    </button>
                    <a
                      href={`https://inpost.pl/sledzenie-przesylek?number=${outboundShipment.tracking_number}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 hover:bg-emerald-100 rounded"
                      title="Śledź przesyłkę"
                    >
                      <ExternalLink className="h-3 w-3 text-slate-400" />
                    </a>
                  </div>
                )}
                {outboundShipment.base_courier_number && (
                  <div className="text-xs text-slate-500 mt-1">
                    ID zamówienia: {outboundShipment.base_courier_number}
                  </div>
                )}
              </div>
            )}

            {returnShipment && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-900">Etykieta zwrotna</span>
                  </div>
                  <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded">
                    {returnShipment.status || 'SAVED'}
                  </span>
                </div>
                {returnShipment.tracking_number && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-slate-500">Nr śledzenia:</span>
                    <code className="text-xs font-mono bg-white px-2 py-1 rounded border">
                      {returnShipment.tracking_number}
                    </code>
                    <button
                      onClick={() => copyToClipboard(returnShipment.tracking_number)}
                      className="p-1 hover:bg-amber-100 rounded"
                      title="Kopiuj numer"
                    >
                      {copiedTracking === returnShipment.tracking_number ? (
                        <Check className="h-3 w-3 text-amber-600" />
                      ) : (
                        <Copy className="h-3 w-3 text-slate-400" />
                      )}
                    </button>
                    <a
                      href={`https://inpost.pl/sledzenie-przesylek?number=${returnShipment.tracking_number}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 hover:bg-amber-100 rounded"
                      title="Śledź przesyłkę"
                    >
                      <ExternalLink className="h-3 w-3 text-slate-400" />
                    </a>
                  </div>
                )}
                {returnShipment.base_courier_number && (
                  <div className="text-xs text-slate-500 mt-1">
                    ID zamówienia: {returnShipment.base_courier_number}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-900 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button
            onClick={openOutboundDialog}
            disabled={outboundCreated}
            className="w-full"
            variant={outboundCreated ? "outline" : "default"}
          >
            {outboundCreated ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Etykieta wysyłkowa utworzona
              </>
            ) : (
              <>
                <Package className="mr-2 h-4 w-4" />
                Wygeneruj etykietę wysyłkową
              </>
            )}
          </Button>

          <Button
            onClick={openReturnDialog}
            disabled={returnCreated}
            className="w-full"
            variant={returnCreated ? "outline" : "default"}
          >
            {returnCreated ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Etykieta zwrotna utworzona
              </>
            ) : (
              <>
                <RotateCcw className="mr-2 h-4 w-4" />
                Wygeneruj etykietę zwrotną
              </>
            )}
          </Button>

          {canDownloadPDF && (
            <Button
              onClick={handleDownloadPDF}
              disabled={downloadingPDF}
              className="w-full"
              variant="secondary"
            >
              {downloadingPDF ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Pobieranie...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Pobierz etykiety PDF (A4)
                </>
              )}
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Etykiety zostaną połączone na jednym arkuszu A4 do wydruku.
        </p>
      </div>

    <CreateShipmentDialog
      open={dialogOpen}
      onOpenChange={setDialogOpen}
      type={dialogType}
      parcelSize={parcelSize}
      sender={sender}
      receiver={receiver}
      onConfirm={handleCreateShipment}
    />
    </>
  );
}
