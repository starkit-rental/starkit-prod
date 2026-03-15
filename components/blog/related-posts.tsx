import Link from "next/link";
import Image from "next/image";
import { fetchSanityPosts } from "@/sanity/lib/fetch";
import { urlFor } from "@/sanity/lib/image";

export default async function RelatedPosts() {
  const posts = await fetchSanityPosts();
  const visible = posts?.slice(0, 3) ?? [];

  if (visible.length === 0) return null;

  return (
    <section className="w-full py-12 md:py-16 border-t">
      <div className="container">
        <h2 className="text-xl md:text-2xl font-bold mb-6">
          Przeczytaj też – poradniki o wynajmie Starlink
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map((post: any) => (
            <Link
              key={post.slug?.current}
              href={`/blog/${post.slug?.current}`}
              className="group flex flex-col border rounded-xl overflow-hidden hover:shadow-md transition"
            >
              <div className="aspect-[16/9] relative bg-muted">
                {post.image?.asset && (
                  <Image
                    src={urlFor(post.image).width(400).height(225).url()}
                    alt={post.image?.alt || post.title || ""}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                )}
              </div>
              <div className="p-4 flex-1">
                <p className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">
                  {post.title}
                </p>
                {post.excerpt && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {post.excerpt}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
