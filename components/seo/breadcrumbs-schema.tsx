type BreadcrumbLink = {
  label: string;
  href: string;
};

type BreadcrumbsSchemaProps = {
  links: BreadcrumbLink[];
};

export default function BreadcrumbsSchema({ links }: BreadcrumbsSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://starkit.pl";

  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: links.map((link, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: link.label,
      item: `${baseUrl}${link.href}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
