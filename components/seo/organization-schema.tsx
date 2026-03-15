export default function OrganizationSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://starkit.pl";

  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${baseUrl}/#organization`,
    name: "Starkit",
    alternateName: ["Starkit Wynajem Starlink", "Wypożyczalnia Starlink Starkit"],
    url: baseUrl,
    logo: {
      "@type": "ImageObject",
      url: `${baseUrl}/logo.png`,
      width: 200,
      height: 200,
    },
    image: `${baseUrl}/images/og-image.jpg`,
    description:
      "Wynajem Starlink i Starlink Mini – internet satelitarny bez ograniczeń. Idealne rozwiązanie dla eventów, wesel, budów, działek i miejsc bez infrastruktury sieciowej. Dostawa na terenie całej Polski.",
    telephone: "+48453461061",
    email: "kontakt@starkit.pl",
    priceRange: "$$",
    currenciesAccepted: "PLN",
    paymentAccepted: "Credit Card, Cash, Bank Transfer",
    areaServed: {
      "@type": "Country",
      name: "Poland",
      "@id": "https://www.wikidata.org/wiki/Q36",
    },
    serviceArea: {
      "@type": "Country",
      name: "Poland",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Wynajem Starlink",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Wynajem Starlink Standard",
            description:
              "Wynajem zestawu Starlink Standard – internet satelitarny do 250 Mbps. Dostawa na terenie całej Polski.",
            url: `${baseUrl}/products/starlink-standard`,
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Wynajem Starlink Mini",
            description:
              "Wynajem zestawu Starlink Mini – kompaktowy internet satelitarny do 100 Mbps. Idealny dla podróżników i pracy zdalnej.",
            url: `${baseUrl}/products/starlink-mini`,
          },
        },
      ],
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+48-453-461-061",
      contactType: "customer service",
      areaServed: "PL",
      availableLanguage: ["Polish"],
    },
    sameAs: [
      "https://www.facebook.com/starkit.pl",
      "https://www.instagram.com/starkit.pl",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
