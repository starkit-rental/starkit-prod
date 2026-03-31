import { groq } from "next-sanity";
import { bodyQuery } from "./shared/body";
import { imageQuery } from "./shared/image";

export const cityPageQuery = groq`
  *[_type == "cityPage" && slug.current == $slug][0] {
    _id,
    city,
    "slug": slug.current,
    region,
    headline,
    excerpt,
    heroImage {
      ${imageQuery}
    },
    body[]{
      ${bodyQuery}
    },
    deliveryMethod,
    faqs,
    testimonials[]->{
      _id, name, title, rating,
      image{ ${imageQuery} },
      body[]{ ${bodyQuery} },
    },
    meta_title,
    meta_description,
    ogImage {
      asset->{ _id, url, metadata { dimensions { width, height } } }
    }
  }
`;

export const allCityPagesQuery = groq`
  *[_type == "cityPage" && defined(slug)] | order(city asc) {
    "slug": slug.current,
    city
  }
`;
