type ServiceSchemaProps = {
  productName: string;
  productSlug: string;
  pricePerDay?: number;
  description?: string;
};

export default function ServiceSchema({
  productName,
  productSlug,
  pricePerDay,
  description,
}: ServiceSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.starkit.pl";
  const productUrl = `${baseUrl}/products/${productSlug}`;
  const price = pricePerDay && pricePerDay > 0 ? pricePerDay : 39;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${productUrl}#service`,
    serviceType: "Wynajem sprzętu",
    name: `Wynajem ${productName}`,
    description:
      description ||
      `Profesjonalny wynajem ${productName} – internet satelitarny bez limitu. Dostawa w 24h na terenie całej Polski. Na event, budowę, wesele, działkę i pracę zdalną.`,
    url: productUrl,
    provider: {
      "@type": "Organization",
      "@id": `${baseUrl}/#organization`,
      name: "Starkit",
      url: baseUrl,
    },
    areaServed: {
      "@type": "Country",
      name: "Polska",
      "@id": "https://www.wikidata.org/wiki/Q36",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `Cennik wynajmu ${productName}`,
      itemListElement: [
        {
          "@type": "Offer",
          name: `Wynajem ${productName} – dzień`,
          price,
          priceCurrency: "PLN",
          eligibleDuration: {
            "@type": "QuantitativeValue",
            value: 1,
            unitCode: "DAY",
          },
          availability: "https://schema.org/InStock",
        },
      ],
    },
    termsOfService: `${baseUrl}/regulamin`,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
