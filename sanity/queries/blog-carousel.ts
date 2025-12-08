import { groq } from "next-sanity";

// @sanity-typegen-ignore
export const blogCarouselQuery = groq`
  _type == "blog-carousel" => {
    _type,
    _key,
    padding,
    colorVariant,
    title,
    showViewAllButton,
  }
`;
