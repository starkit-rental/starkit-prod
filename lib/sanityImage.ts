import imageUrlBuilder from "@sanity/image-url";
import { projectId, dataset } from "@/lib/sanityClient";

const builder = imageUrlBuilder({ projectId, dataset });

export function urlFor(source: any) {
  return builder.image(source);
}
