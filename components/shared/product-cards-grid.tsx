import { client } from "@/sanity/lib/client";
import { allProductsQuery } from "@/sanity/queries/products";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

type Product = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  pricePerDay?: number;
  status?: string;
  image?: string;
};

interface ProductCardsGridProps {
  compact?: boolean;
}

export default async function ProductCardsGrid({ compact = false }: ProductCardsGridProps) {
  const products: Product[] = await client.fetch(allProductsQuery);

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto ${compact ? "" : "lg:gap-8"}`}>
      {products.map((p) => (
        <article
          key={p._id}
          className="group relative flex flex-col rounded-2xl border bg-card overflow-hidden hover:shadow-xl transition-shadow"
        >
          <Link href={`/products/${p.slug}`} className="block">
            <div className={`relative bg-muted ${compact ? "aspect-[16/8]" : "aspect-[16/10]"}`}>
              {p.image && (
                <Image
                  src={p.image}
                  alt={`Wynajem ${p.title}`}
                  fill
                  className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              )}
              {p.status === "available" && (
                <span className="absolute top-4 left-4 bg-green-500/90 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                  Dostępny
                </span>
              )}
            </div>
          </Link>
          <div className={`flex flex-col flex-1 ${compact ? "p-5 md:p-6" : "p-6 md:p-8"}`}>
            <Link href={`/products/${p.slug}`}>
              <h3 className={`font-bold mb-2 group-hover:text-primary transition-colors ${compact ? "text-xl md:text-2xl" : "text-2xl md:text-3xl mb-3"}`}>
                Wynajem {p.title}
              </h3>
            </Link>
            {p.excerpt && (
              <p className={`text-muted-foreground leading-relaxed flex-1 ${compact ? "text-sm mb-4 line-clamp-2" : "mb-6"}`}>
                {p.excerpt}
              </p>
            )}
            <div className={`flex items-end justify-between mt-auto pt-4 border-t`}>
              {p.pricePerDay && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Cena od</p>
                  <span className={`font-bold text-primary ${compact ? "text-2xl" : "text-3xl"}`}>
                    {p.pricePerDay} zł
                  </span>
                  <span className="text-sm text-muted-foreground ml-1">/ dzień</span>
                </div>
              )}
              <Button asChild size={compact ? "sm" : "default"}>
                <Link href={`/products/${p.slug}`}>
                  Sprawdź ofertę
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
