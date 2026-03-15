export default function WebsiteSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://starkit.pl";

  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    url: baseUrl,
    name: "Starkit",
    description:
      "Wypożyczalnia Starlink – wynajem Starlink Standard i Starlink Mini z dostawą w całej Polsce.",
    inLanguage: "pl-PL",
    publisher: {
      "@id": `${baseUrl}/#organization`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/blog?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
