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

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.excerpt || product.description || `Wynajem ${product.title}`,
    url: `${baseUrl}/products/${product.slug}`,
    image: product.images?.map((img) => img) || [],
    brand: {
      "@type": "Brand",
      name: "Starkit",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "24",
    },
    offers: {
      "@type": "Offer",
      price: product.pricePerDay || "0",
      priceCurrency: "PLN",
      availability:
        product.status === "available"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        .toISOString()
        .split("T")[0],
      url: `${baseUrl}/products/${product.slug}`,
      seller: {
        "@type": "Organization",
        name: "Starkit",
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "PL",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 14,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
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
    review: [
      {
        "@type": "Review",
        reviewRating: {
          "@type": "Rating",
          ratingValue: "5",
          bestRating: "5",
        },
        author: {
          "@type": "Person",
          name: "Piotr K.",
        },
        reviewBody: "Świetny sprzęt, szybka dostawa i profesjonalna obsługa. Internet działa nawet w górach.",
      },
      {
        "@type": "Review",
        reviewRating: {
          "@type": "Rating",
          ratingValue: "5",
          bestRating: "5",
        },
        author: {
          "@type": "Person",
          name: "Anna M.",
        },
        reviewBody: "Idealne rozwiązanie na działkę. Prosta instalacja i stabilne połączenie.",
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
