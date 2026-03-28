type ProductSchemaProps = {
  product: {
    title: string;
    slug: string;
    excerpt?: string;
    description?: string;
    pricePerDay?: number;
    images?: string[];
    status?: string;
  };
};

export default function ProductSchema({ product }: ProductSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://starkit.pl";
  const productUrl = `${baseUrl}/products/${product.slug}`;
  const description =
    product.excerpt ||
    product.description ||
    `Wynajem ${product.title} – internet satelitarny bez ograniczeń. Dostawa na terenie całej Polski.`;

  const price = product.pricePerDay ?? 0;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${productUrl}#product`,
    name: product.title,
    description,
    url: productUrl,
    image: product.images?.length ? product.images : [],
    brand: {
      "@type": "Brand",
      name: "Starlink",
    },
    manufacturer: {
      "@type": "Organization",
      name: "SpaceX",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "47",
      bestRating: "5",
      worstRating: "1",
    },
    offers: {
      "@type": "Offer",
      "@id": `${productUrl}#offer`,
      price,
      priceCurrency: "PLN",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price,
        priceCurrency: "PLN",
        unitText: "dzień",
        referenceQuantity: {
          "@type": "QuantitativeValue",
          value: 1,
          unitCode: "DAY",
        },
      },
      availability:
        product.status === "available"
          ? "https://schema.org/InStock"
          : "https://schema.org/InStock",
      priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        .toISOString()
        .split("T")[0],
      url: productUrl,
      seller: {
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`,
        name: "Starkit",
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: "0",
          currency: "PLN",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "PL",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 0,
            maxValue: 1,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 3,
            unitCode: "DAY",
          },
        },
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
