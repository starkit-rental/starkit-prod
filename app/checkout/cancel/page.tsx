import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function CheckoutCancelPage() {
  return (
    <section className="w-full py-10 md:py-14">
      <div className="container">
        <div className="mx-auto max-w-2xl rounded-xl border bg-background p-6 md:p-8">
          <h1 className="text-xl font-semibold md:text-2xl">Płatność anulowana</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Wygląda na to, że nie dokończyłeś płatności. Jeśli chcesz, możesz wrócić do strony głównej lub
            ponownie wybrać termin.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/">Wróć do strony głównej</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/products">Wróć do produktów</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
