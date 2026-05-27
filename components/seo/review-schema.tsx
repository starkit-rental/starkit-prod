type Review = {
  name: string;
  title?: string;
  rating: number;
  bodyText?: string;
};

type ReviewSchemaProps = {
  productName: string;
  productSlug: string;
  reviews: Review[];
};

export default function ReviewSchema({ productName, productSlug, reviews }: ReviewSchemaProps) {
  if (!reviews.length) return null;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://starkit.pl";
  const productUrl = `${baseUrl}/products/${productSlug}`;

  const avgRating =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${productUrl}#product`,
    name: productName,
    url: productUrl,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: avgRating.toFixed(1),
      reviewCount: String(reviews.length),
      bestRating: "5",
      worstRating: "1",
    },
    review: reviews.map((r) => ({
      "@type": "Review",
      author: {
        "@type": "Person",
        name: r.name,
      },
      reviewRating: {
        "@type": "Rating",
        ratingValue: String(r.rating),
        bestRating: "5",
        worstRating: "1",
      },
      reviewBody: r.bodyText || "",
      datePublished: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      publisher: {
        "@type": "Organization",
        name: "Starkit",
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
