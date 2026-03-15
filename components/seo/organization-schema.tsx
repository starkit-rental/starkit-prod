export default function OrganizationSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://starkit.pl";

  const schema = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "RentalCarCompany"],
    "@id": `${baseUrl}/#organization`,
    name: "Starkit",
    alternateName: ["Starkit Wynajem Starlink", "Starkit - Wypożyczalnia Starlink"],
    url: baseUrl,
    logo: {
      "@type": "ImageObject",
      url: `${baseUrl}/images/og-image.jpg`,
      width: 1200,
      height: 630,
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
            "@type": "RentalCarBusiness",
            name: "Wynajem Starlink Standard",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "RentalCarBusiness",
            name: "Wynajem Starlink Mini",
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
    sameAs: [],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
