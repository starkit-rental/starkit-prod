import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function BlogCTA() {
  return (
    <section className="w-full py-12 md:py-16">
      <div className="container">
        <div className="mx-auto max-w-3xl rounded-2xl border bg-muted/50 p-8 md:p-12 text-center">
          <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold">
              Gotowy na szybki internet satelitarny?
            </h2>
            <p className="text-lg text-muted-foreground">
              Wynajmij Starlink już dziś i ciesz się stabilnym internetem w dowolnym miejscu w Polsce.
              Prosta instalacja i pełne wsparcie techniczne.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/products/starlink-mini">
                Starlink Mini
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/products/starlink-standard">
                Starlink Standard
              </Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Masz pytania? Zadzwoń: <a href="tel:+48453461061" className="font-semibold hover:underline">+48 453 461 061</a>
          </p>
        </div>
      </div>
    </section>
  );
}
