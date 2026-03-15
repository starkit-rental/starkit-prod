import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { fetchSanityPosts } from "@/sanity/lib/fetch";
import { urlFor } from "@/sanity/lib/image";

export const revalidate = 60;

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
    <section className="container py-14 md:py-20">
      <div className="max-w-2xl mb-12">
        <p className="text-sm font-semibold text-primary mb-3 tracking-wide uppercase">
          Blog
        </p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          Wynajem Starlink: Poradniki i Aktualności
        </h1>
        <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
          Poradniki, porównania i aktualności o wynajmie Starlink i Starlink Mini.
          Dowiedz się jak działa wypożyczalnia Starlink, ile kosztuje i dla kogo jest najlepsza.
        </p>
      </div>

      {(!posts || posts.length === 0) && (
        <p className="text-muted-foreground">Brak artykułów.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts?.map((post: any) => (
          <Link
            key={post.slug?.current}
            href={`/blog/${post.slug?.current}`}
            className="group flex flex-col rounded-2xl border bg-card overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="aspect-[16/9] relative bg-muted overflow-hidden">
              {post.image?.asset && (
                <Image
                  src={urlFor(post.image).width(600).height(337).url()}
                  alt={post.image?.alt || post.title || ""}
                  fill
                  className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              )}
            </div>
            <div className="p-5 flex-1">
              <h2 className="font-semibold text-base md:text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                {post.title}
              </h2>
              {post.excerpt && (
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
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
