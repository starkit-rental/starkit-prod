import SectionContainer from "@/components/ui/section-container";
import PostCard from "@/components/ui/post-card";
import Link from "next/link";
import { stegaClean } from "next-sanity";
import { fetchSanityPosts } from "@/sanity/lib/fetch";
import { PAGE_QUERYResult } from "@/sanity.types";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselDots,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

type BlogCarouselProps = Extract<
  NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number],
  { _type: "blog-carousel" }
>;

export default async function BlogCarousel({
  padding,
  colorVariant,
  title,
  showViewAllButton,
}: BlogCarouselProps) {
  const color = stegaClean(colorVariant);
  const posts = await fetchSanityPosts();

  // Get only the latest 6 posts
  const latestPosts = posts.slice(0, 6);

  return (
    <SectionContainer color={color} padding={padding}>
      <div className="flex flex-col">
        {title && (
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold">{title}</h2>
          </div>
        )}

        {latestPosts && latestPosts.length > 0 && (
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
          >
            <CarouselContent>
              {latestPosts.map((post) => (
                <CarouselItem
                  key={post?.slug?.current}
                  className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3"
                >
                  <Link
                    className="flex w-full rounded-3xl ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    href={`/blog/${post?.slug?.current}`}
                  >
                    <PostCard
                      title={post?.title ?? ""}
                      excerpt={post?.excerpt ?? ""}
                      image={post?.image ?? null}
                    />
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious
              variant="secondary"
              className="-left-3 md:-left-8 xl:-left-12"
            />
            <CarouselNext
              variant="secondary"
              className="-right-3 md:-right-8 xl:-right-12"
            />
            <div className="w-full flex justify-center mt-8">
              <CarouselDots />
            </div>
          </Carousel>
        )}

        {showViewAllButton && (
          <div className="flex justify-center mt-12">
            <Button asChild size="lg">
              <Link href="/blog">
                Zobacz wszystkie
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </SectionContainer>
  );
}
