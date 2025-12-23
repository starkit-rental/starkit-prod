type BlogPostSchemaProps = {
  post: {
    title: string | null;
    slug: {
      current?: string | null;
    } | null;
    excerpt?: string | null;
    image?: {
      url?: string | null;
      alt?: string | null;
    } | null;
    author?: {
      name?: string | null;
    } | null;
    _createdAt?: string | null;
    _updatedAt?: string | null;
  };
};

export default function BlogPostSchema({ post }: BlogPostSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://starkit.pl";
  const slug = post.slug?.current;

  if (!slug || !post.title) {
    return null;
  }

  const postUrl = `${baseUrl}/blog/${slug}`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || `${post.title} - Blog Starkit`,
    url: postUrl,
    ...(post._createdAt && { datePublished: post._createdAt }),
    ...(post._updatedAt && { dateModified: post._updatedAt }),
    author: {
      "@type": "Person",
      name: post.author?.name || "Starkit",
    },
    publisher: {
      "@type": "Organization",
      name: "Starkit",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/images/og-image.jpg`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postUrl,
    },
    ...(post.image?.url && {
      image: {
        "@type": "ImageObject",
        url: post.image.url,
        ...(post.image.alt && { caption: post.image.alt }),
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
