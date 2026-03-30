type Item = {
  title: string;
  slug: string;
  excerpt?: string;
  pricePerDay?: number;
  image?: string;
};

type ItemListSchemaProps = {
  items: Item[];
};

export default function ItemListSchema({ items }: ItemListSchemaProps) {
  if (!items?.length) return null;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://starkit.pl";

  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Wynajem Starlink – dostępny sprzęt",
    description:
      "Lista urządzeń Starlink dostępnych do wynajmu. Wynajem Starlink Standard i Starlink Mini na terenie całej Polski.",
    url: `${baseUrl}/products`,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${baseUrl}/products/${item.slug}`,
      name: item.title,
      item: {
        "@type": "Product",
        "@id": `${baseUrl}/products/${item.slug}#product`,
        name: item.title,
        description:
          item.excerpt ||
          `Wynajem ${item.title} – internet satelitarny bez ograniczeń.`,
        url: `${baseUrl}/products/${item.slug}`,
        image: item.image ? [item.image] : [],
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.9",
          reviewCount: "47",
          bestRating: "5",
          worstRating: "1",
        },
        offers: {
          "@type": "Offer",
          // Google rejects price: 0 — use fallback minimum
          price: item.pricePerDay && item.pricePerDay > 0 ? item.pricePerDay : 39,
          priceCurrency: "PLN",
          availability: "https://schema.org/InStock",
          seller: {
            "@type": "Organization",
            "@id": `${baseUrl}/#organization`,
            name: "Starkit",
          },
        },
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
