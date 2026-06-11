"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Package, RotateCcw, AlertCircle } from "lucide-react";
import { CarrierSelector } from "./carrier-selector";
import type { ParcelSize } from "@/lib/courier/types";

interface Carrier {
  id: number;
  name: string;
  carrierName: string;
  priceGross: number;
  priceNet: number;
  currency: string;
  deliveryTime?: string;
  deliveryDays?: number;
  additionalInfo?: string;
}

interface SenderData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  street: string;
  buildingNumber: string;
  flatNumber: string;
  postCode: string;
  city: string;
  postingCode: string;
}

interface ReceiverData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  street?: string;
  buildingNumber?: string;
  flatNumber?: string;
  postCode?: string;
  city?: string;
  destinationCode: string;
}

interface CreateShipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'outbound' | 'return';
  parcelSize: ParcelSize;
  sender: SenderData;
  receiver: ReceiverData;
  onConfirm: (options: {
    insurance: boolean;
    insuranceValue: number;
    saturdayDelivery: boolean;
    sender: SenderData;
    receiver: ReceiverData;
    productId?: number;
  }) => Promise<void>;
}

export function CreateShipmentDialog({
  open,
  onOpenChange,
  type,
  parcelSize,
  sender: initialSender,
  receiver: initialReceiver,
  onConfirm,
}: CreateShipmentDialogProps) {
  const [insurance, setInsurance] = useState(false);
  const [insuranceValue, setInsuranceValue] = useState(500);
  const [saturdayDelivery, setSaturdayDelivery] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carrier selection
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loadingCarriers, setLoadingCarriers] = useState(false);
  const [selectedCarrierId, setSelectedCarrierId] = useState<number | null>(null);
  const [hasSearchedCarriers, setHasSearchedCarriers] = useState(false);
  
  // Editable sender data
  const [sender, setSender] = useState<SenderData>(initialSender);
  
  // Editable receiver data
  const [receiver, setReceiver] = useState<ReceiverData>(initialReceiver);

  const isOutbound = type === 'outbound';
  const title = isOutbound ? 'Potwierdź etykietę wysyłkową' : 'Potwierdź etykietę zwrotną';
  const description = isOutbound
    ? 'Sprawdź dane przed utworzeniem przesyłki do klienta'
    : 'Sprawdź dane przed utworzeniem przesyłki zwrotnej';

  const parcelSizeLabel = parcelSize === 'small' 
    ? 'Mała (18 × 35 × 60 cm, gabaryt B)'
    : 'Duża (64 × 38 × 41 cm, 15kg, gabaryt C)';

  const searchCarriers = async () => {
    setLoadingCarriers(true);
    setHasSearchedCarriers(true);
    setSelectedCarrierId(null);
    setError(null);

    try {
      const response = await fetch('/api/courier/globkurier/search-carriers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parcelSize,
          senderPostCode: sender.postCode,
          senderPointId: sender.postingCode,
          receiverPostCode: receiver.postCode,
          receiverPointId: receiver.destinationCode,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.details || data.error || 'Nie udało się pobrać przewoźników');
      }
      const list: Carrier[] = data.carriers || [];
      setCarriers(list);
      // Auto-select the cheapest (first, already sorted)
      if (list.length > 0) {
        setSelectedCarrierId(list[0].id);
      }
    } catch (err) {
      console.error('Carrier search error:', err);
      setError(err instanceof Error ? err.message : 'Błąd wyszukiwania przewoźników');
      setCarriers([]);
    } finally {
      setLoadingCarriers(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedCarrierId) {
      setError('Wybierz przewoźnika przed utworzeniem przesyłki');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      await onConfirm({
        insurance,
        insuranceValue: insurance ? insuranceValue : 0,
        saturdayDelivery,
        sender,
        receiver,
        productId: selectedCarrierId,
      });
      onOpenChange(false);
    } catch (err) {
      console.error('Shipment creation error:', err);
      setError(err instanceof Error ? err.message : 'Wystąpił błąd');
    } finally {
      setCreating(false);
    }
  };

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setInsurance(false);
      setInsuranceValue(500);
      setSaturdayDelivery(false);
      setError(null);
      setSender(initialSender);
      setReceiver(initialReceiver);
      setCarriers([]);
      setSelectedCarrierId(null);
      setHasSearchedCarriers(false);
      setLoadingCarriers(false);
    }
  }, [open, initialSender, initialReceiver]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isOutbound ? (
              <Package className="h-5 w-5" />
            ) : (
              <RotateCcw className="h-5 w-5" />
            )}
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Parcel Size */}
          <div className="rounded-lg bg-blue-50 p-3">
            <p className="text-sm font-medium text-blue-900">
              Rozmiar paczki: {parcelSizeLabel}
            </p>
          </div>

          {/* Sender Info - Editable */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Nadawca</h3>
            <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Imię</Label>
                  <Input value={sender.firstName} onChange={(e) => setSender({...sender, firstName: e.target.value})} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Nazwisko</Label>
                  <Input value={sender.lastName} onChange={(e) => setSender({...sender, lastName: e.target.value})} className="h-8 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Telefon</Label>
                  <Input value={sender.phoneNumber} onChange={(e) => setSender({...sender, phoneNumber: e.target.value})} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Email</Label>
                  <Input value={sender.email} onChange={(e) => setSender({...sender, email: e.target.value})} className="h-8 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Ulica</Label>
                  <Input value={sender.street} onChange={(e) => setSender({...sender, street: e.target.value})} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Nr budynku</Label>
                  <Input value={sender.buildingNumber} onChange={(e) => setSender({...sender, buildingNumber: e.target.value})} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Nr mieszkania</Label>
                  <Input value={sender.flatNumber} onChange={(e) => setSender({...sender, flatNumber: e.target.value})} className="h-8 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Kod pocztowy</Label>
                  <Input value={sender.postCode} onChange={(e) => setSender({...sender, postCode: e.target.value})} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Miasto</Label>
                  <Input value={sender.city} onChange={(e) => setSender({...sender, city: e.target.value})} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Paczkomat nadania</Label>
                  <Input value={sender.postingCode} onChange={(e) => setSender({...sender, postingCode: e.target.value})} className="h-8 text-sm font-mono" />
                </div>
              </div>
            </div>
          </div>

          {/* Receiver Info - Editable */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Odbiorca</h3>
            <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Imię</Label>
                  <Input value={receiver.firstName} onChange={(e) => setReceiver({...receiver, firstName: e.target.value})} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Nazwisko</Label>
                  <Input value={receiver.lastName} onChange={(e) => setReceiver({...receiver, lastName: e.target.value})} className="h-8 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Telefon</Label>
                  <Input value={receiver.phoneNumber} onChange={(e) => setReceiver({...receiver, phoneNumber: e.target.value})} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Email</Label>
                  <Input value={receiver.email} onChange={(e) => setReceiver({...receiver, email: e.target.value})} className="h-8 text-sm" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Paczkomat odbioru</Label>
                <Input value={receiver.destinationCode} onChange={(e) => setReceiver({...receiver, destinationCode: e.target.value})} className="h-8 text-sm font-mono" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Ulica</Label>
                  <Input value={receiver.street || ''} onChange={(e) => setReceiver({...receiver, street: e.target.value})} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Nr budynku</Label>
                  <Input value={receiver.buildingNumber || ''} onChange={(e) => setReceiver({...receiver, buildingNumber: e.target.value})} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Nr mieszkania</Label>
                  <Input value={receiver.flatNumber || ''} onChange={(e) => setReceiver({...receiver, flatNumber: e.target.value})} className="h-8 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Kod pocztowy</Label>
                  <Input value={receiver.postCode || ''} onChange={(e) => setReceiver({...receiver, postCode: e.target.value})} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Miasto</Label>
                  <Input value={receiver.city || ''} onChange={(e) => setReceiver({...receiver, city: e.target.value})} className="h-8 text-sm" />
                </div>
              </div>
            </div>
          </div>

          {/* Carrier Selection */}
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <CarrierSelector
              carriers={carriers}
              loading={loadingCarriers}
              selectedCarrierId={selectedCarrierId}
              onSelect={setSelectedCarrierId}
              onSearch={searchCarriers}
              hasSearched={hasSearchedCarriers}
            />
          </div>

          {/* Additional Options */}
          <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900">Dodatkowe opcje</h3>
            
            {/* Insurance */}
            <div className="flex items-start space-x-3">
              <Checkbox
                id="insurance"
                checked={insurance}
                onCheckedChange={(checked) => setInsurance(checked as boolean)}
              />
              <div className="flex-1 space-y-2">
                <Label htmlFor="insurance" className="cursor-pointer font-medium">
                  Ubezpieczenie przesyłki
                </Label>
                {insurance && (
                  <div className="space-y-1">
                    <Label htmlFor="insurance-value" className="text-xs text-slate-500">
                      Wartość ubezpieczenia (zł)
                    </Label>
                    <Input
                      id="insurance-value"
                      type="number"
                      min="0"
                      step="50"
                      value={insuranceValue}
                      onChange={(e) => setInsuranceValue(Number(e.target.value))}
                      className="max-w-xs"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Saturday Delivery */}
            <div className="flex items-start space-x-3">
              <Checkbox
                id="saturday"
                checked={saturdayDelivery}
                onCheckedChange={(checked) => setSaturdayDelivery(checked as boolean)}
              />
              <div className="flex-1">
                <Label htmlFor="saturday" className="cursor-pointer font-medium">
                  Dostawa w sobotę
                </Label>
                <p className="text-xs text-slate-500">
                  Przesyłka może być dostarczana również w sobotę
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-900 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={creating}
          >
            Anuluj
          </Button>
          <Button onClick={handleConfirm} disabled={creating || !selectedCarrierId}>
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Tworzenie...
              </>
            ) : (
              <>
                {isOutbound ? (
                  <Package className="mr-2 h-4 w-4" />
                ) : (
                  <RotateCcw className="mr-2 h-4 w-4" />
                )}
                Potwierdź i utwórz
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
