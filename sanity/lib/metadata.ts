import { urlFor } from "@/sanity/lib/image";
import { PAGE_QUERYResult, POST_QUERYResult } from "@/sanity.types";
const isProduction = process.env.NODE_ENV === "production";

export function generatePageMetadata({
  page,
  slug,
}: {
  page: PAGE_QUERYResult | POST_QUERYResult;
  slug: string;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://starkit.pl";
  const pageUrl = siteUrl + `/${slug === "index" ? "" : slug}`;
  const isBlogPost = slug.startsWith("blog/");
  const ogImage = page?.ogImage
    ? urlFor(page?.ogImage).quality(85).url()
    : `${siteUrl}/images/og-image.jpg`;
  const ogWidth = page?.ogImage?.asset?.metadata?.dimensions?.width || 1200;
  const ogHeight = page?.ogImage?.asset?.metadata?.dimensions?.height || 630;

  return {
    title: page?.meta_title,
    description: page?.meta_description,
    openGraph: {
      url: pageUrl,
      images: [{ url: ogImage, width: ogWidth, height: ogHeight }],
      locale: "pl_PL",
      type: isBlogPost ? "article" : "website",
    },
    twitter: {
      card: "summary_large_image",
      title: page?.meta_title,
      description: page?.meta_description,
      images: [ogImage],
    },
    robots: !isProduction
      ? { index: false, follow: false }
      : page?.noindex
        ? { index: false, follow: false }
        : { index: true, follow: true },
    alternates: {
      canonical: pageUrl,
      languages: { "pl": pageUrl },
    },
  };
}
