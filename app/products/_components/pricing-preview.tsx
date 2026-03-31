import { CheckCircle2 } from "lucide-react";

type Props = {
  pricePerDay: number;
  productTitle: string;
  deposit?: number | null;
};

const EXAMPLE_PERIODS = [
  { days: 3, label: "Weekend (3 dni)" },
  { days: 7, label: "Tydzień (7 dni)" },
  { days: 14, label: "2 tygodnie (14 dni)" },
  { days: 30, label: "Miesiąc (30 dni)" },
];

export default function PricingPreview({ pricePerDay, productTitle, deposit }: Props) {
  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-5 md:p-6">
      <h3 className="text-sm font-semibold text-foreground mb-1">
        Cennik wynajmu – {productTitle}
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        Im dłuższy wynajem, tym niższa stawka dzienna. Minimalne zamówienie: 3 dni.
      </p>

      <div className="space-y-2">
        {EXAMPLE_PERIODS.map(({ days, label }) => {
          const total = pricePerDay * days;
          return (
            <div
              key={days}
              className="flex items-center justify-between rounded-lg bg-background px-4 py-2.5 text-sm border border-border/50"
            >
              <span className="text-muted-foreground">{label}</span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-semibold text-foreground">{total} zł</span>
                <span className="text-xs text-muted-foreground">
                  ({pricePerDay} zł/dzień)
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {deposit && deposit > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          + kaucja zwrotna {deposit} zł (zwracana po oddaniu sprzętu)
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          Darmowa dostawa
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          Bez umowy i abonamentu
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          Sprzęt gotowy do użycia
        </span>
      </div>
    </div>
  );
}
