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
import type { ParcelSize } from "@/lib/courier/types";

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
  }) => Promise<void>;
}

export function CreateShipmentDialog({
  open,
  onOpenChange,
  type,
  parcelSize,
  sender,
  receiver,
  onConfirm,
}: CreateShipmentDialogProps) {
  const [insurance, setInsurance] = useState(false);
  const [insuranceValue, setInsuranceValue] = useState(500);
  const [saturdayDelivery, setSaturdayDelivery] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOutbound = type === 'outbound';
  const title = isOutbound ? 'Potwierdź etykietę wysyłkową' : 'Potwierdź etykietę zwrotną';
  const description = isOutbound
    ? 'Sprawdź dane przed utworzeniem przesyłki do klienta'
    : 'Sprawdź dane przed utworzeniem przesyłki zwrotnej';

  const parcelSizeLabel = parcelSize === 'small' 
    ? 'Mała (18 × 35 × 60 cm, gabaryt B)'
    : 'Duża (64 × 38 × 41 cm, 15kg, gabaryt C)';

  const handleConfirm = async () => {
    setCreating(true);
    setError(null);

    try {
      await onConfirm({
        insurance,
        insuranceValue: insurance ? insuranceValue : 0,
        saturdayDelivery,
      });
      onOpenChange(false);
    } catch (err) {
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
    }
  }, [open]);

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

          {/* Sender Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Nadawca</h3>
            <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500">Imię i nazwisko:</span>
                  <p className="font-medium">{sender.firstName} {sender.lastName}</p>
                </div>
                <div>
                  <span className="text-slate-500">Telefon:</span>
                  <p className="font-medium">{sender.phoneNumber}</p>
                </div>
              </div>
              <div>
                <span className="text-slate-500">Email:</span>
                <p className="font-medium">{sender.email}</p>
              </div>
              <div>
                <span className="text-slate-500">Adres:</span>
                <p className="font-medium">
                  {sender.street} {sender.buildingNumber}/{sender.flatNumber}, {sender.postCode} {sender.city}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Paczkomat nadania:</span>
                <p className="font-mono font-medium">{sender.postingCode}</p>
              </div>
            </div>
          </div>

          {/* Receiver Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Odbiorca</h3>
            <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500">Imię i nazwisko:</span>
                  <p className="font-medium">{receiver.firstName} {receiver.lastName}</p>
                </div>
                <div>
                  <span className="text-slate-500">Telefon:</span>
                  <p className="font-medium">{receiver.phoneNumber}</p>
                </div>
              </div>
              <div>
                <span className="text-slate-500">Email:</span>
                <p className="font-medium">{receiver.email}</p>
              </div>
              <div>
                <span className="text-slate-500">Paczkomat odbioru:</span>
                <p className="font-mono font-medium">{receiver.destinationCode}</p>
              </div>
            </div>
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
          <Button onClick={handleConfirm} disabled={creating}>
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
