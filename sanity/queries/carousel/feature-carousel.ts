import { groq } from "next-sanity";

export const featureCarouselQuery = groq`
  _type == "feature-carousel" => {
    _type,
    _key,
    title,
    items[]{
      _key,
      eyebrow,
      title,
      description[]{...,},
      ctaTitle,
      ctaHref,
      image{
        asset->,
        crop,
        hotspot
      }
    }
  }
`;
