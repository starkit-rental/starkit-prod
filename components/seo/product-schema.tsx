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
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
