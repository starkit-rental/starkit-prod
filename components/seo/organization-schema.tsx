export default function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Starkit",
    alternateName: "Starkit - Wynajem Starlink",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://starkit.pl",
    logo: `${process.env.NEXT_PUBLIC_SITE_URL || "https://starkit.pl"}/images/og-image.jpg`,
    description:
      "Wynajem Starlink - Internet satelitarny bez ograniczeń. Idealne rozwiązanie dla eventów, budów i miejsc bez infrastruktury.",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+48-453-461-061",
      contactType: "Customer Service",
      areaServed: "PL",
      availableLanguage: ["Polish"],
    },
    sameAs: [
      // Dodaj linki do social media jeśli są
      // "https://facebook.com/starkit",
      // "https://instagram.com/starkit",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
