import { groq } from "next-sanity";

export const allProductsQuery = groq`
  *[_type == "product"] | order(orderRank) {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    pricePerDay,
    deposit,
    status,
    "category": category->title,
    "categorySlug": category->slug.current,
    "image": images[0].asset->url
  }
`;

export const singleProductQuery = groq`
  *[_type == "product" && slug.current == $slug][0] {
    _id,
    title,
    excerpt,
    description,
    pricePerDay,
    deposit,
    status,
    "images": images[].asset->url,
    "category": category->{ title, "slug": slug.current },
    specs,
    blocks[] {
      ...,
      _type == "faqs" => {
        ...,
        items[]->
      }
    }
  }
`;

export const productsPageQuery = groq`
  *[_type == "productsPage"][0]{
    title,
    blocks[]{
      ...,
      _type == "faqs" => {
        ...,
        items[]->
      }
    },
    seo
  }
`;
