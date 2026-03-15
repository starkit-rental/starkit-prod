import Link from "next/link";
import Image from "next/image";
import { fetchSanityPosts } from "@/sanity/lib/fetch";
import { urlFor } from "@/sanity/lib/image";

export default async function RelatedPosts() {
  const posts = await fetchSanityPosts();
  const visible = posts?.slice(0, 3) ?? [];

  if (visible.length === 0) return null;

  return (
    <section className="w-full py-14 md:py-20 border-t">
      <div className="container">
        <div className="mb-8">
          <p className="text-sm font-semibold text-primary mb-2">Blog</p>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Poradniki o wynajmie Starlink
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map((post: any) => (
            <Link
              key={post.slug?.current}
              href={`/blog/${post.slug?.current}`}
              className="group flex flex-col rounded-2xl border bg-card overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="aspect-[16/9] relative bg-muted overflow-hidden">
                {post.image?.asset && (
                  <Image
                    src={urlFor(post.image).width(400).height(225).url()}
                    alt={post.image?.alt || post.title || ""}
                    fill
                    className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                )}
              </div>
              <div className="p-5 flex-1">
                <p className="font-semibold text-base leading-snug group-hover:text-primary transition-colors line-clamp-2">
                  {post.title}
                </p>
                {post.excerpt && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
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
