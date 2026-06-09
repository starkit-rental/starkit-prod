"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, Download, Loader2, Truck, RotateCcw, CheckCircle2, AlertCircle } from "lucide-react";
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
}

export function CourierPanel({ 
  orderId, 
  orderNumber, 
  inpostPointId,
  customerName,
  customerPhone,
  customerEmail,
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

  // Load sender configuration
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
  }, [supabase]);

  if (!inpostPointId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Etykiety kurierskie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">Brak wybranego paczkomatu InPost w zamówieniu</p>
          </div>
        </CardContent>
      </Card>
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
  }) => {
    setError(null);

    const endpoint = dialogType === 'outbound' 
      ? '/api/courier/create-shipment'
      : '/api/courier/create-return-label';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        orderId, 
        parcelSize,
        insurance: options.insurance,
        insuranceValue: options.insuranceValue,
        saturdayDelivery: options.saturdayDelivery,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Nie udało się utworzyć przesyłki');
    }

    if (dialogType === 'outbound') {
      setOutboundCreated(true);
    } else {
      setReturnCreated(true);
    }
  };

  const handleDownloadPDF = async () => {
    setError(null);
    setDownloadingPDF(true);

    try {
      const response = await fetch('/api/courier/generate-labels-pdf', {
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

  if (loadingSender || !senderData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Etykiety kurierskie InPost
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        </CardContent>
      </Card>
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
    destinationCode: inpostPointId || '',
  } : {
    firstName: senderData.firstName,
    lastName: senderData.lastName,
    phoneNumber: senderData.phoneNumber,
    email: senderData.email,
    destinationCode: senderData.postingCode,
  };

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Etykiety kurierskie InPost
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
      </CardContent>
    </Card>

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
