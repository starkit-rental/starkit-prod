import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { fetchSanityPosts } from "@/sanity/lib/fetch";
import { urlFor } from "@/sanity/lib/image";

export const metadata: Metadata = {
  title: "Blog – Wynajem Starlink, porady i aktualności | Starkit",
  description:
    "Porady, aktualności i poradniki dotyczące wynajmu Starlink. Dowiedz się jak działa Starlink Mini, dla kogo sprawdzi się na evencie lub budowie.",
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/blog`,
  },
  openGraph: {
    title: "Blog – Wynajem Starlink | Starkit",
    description:
      "Porady i aktualności dotyczące wynajmu Starlink i Starlink Mini.",
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/blog`,
    type: "website",
  },
};

export default async function BlogPage() {
  const posts = await fetchSanityPosts();

  return (
    <section className="container py-12 md:py-16">
      <div className="max-w-2xl mb-10">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
          Blog Starkit
        </h1>
        <p className="text-muted-foreground text-lg">
          Porady, aktualności i poradniki o wynajmie Starlink i Starlink Mini.
        </p>
      </div>

      {(!posts || posts.length === 0) && (
        <p className="text-muted-foreground">Brak artykułów.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts?.map((post: any) => (
          <Link
            key={post.slug?.current}
            href={`/blog/${post.slug?.current}`}
            className="group block border rounded-xl overflow-hidden hover:shadow-lg transition"
          >
            <div className="aspect-[16/9] relative bg-muted">
              {post.image?.asset && (
                <Image
                  src={urlFor(post.image).width(600).height(337).url()}
                  alt={post.image?.alt || post.title || ""}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              )}
            </div>
            <div className="p-5">
              <h2 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                {post.title}
              </h2>
              {post.excerpt && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {post.excerpt}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
