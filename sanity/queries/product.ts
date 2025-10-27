import { groq } from "next-sanity";
import { imageQuery } from "./shared/image";
import { bodyQuery } from "./shared/body";

export const PRODUCT_QUERY = groq`*[_type == "product" && slug.current == $slug][0]{
  _id,
  title,
  slug,
  excerpt,
  price,
  image{
    ${imageQuery}
  },
  gallery[]{
    ${imageQuery}
  },
  body[]{
    ${bodyQuery}
  },
  meta_title,
  meta_description,
  noindex,
  ogImage{
    ${imageQuery}
  }
}`;

export const PRODUCTS_QUERY = groq`*[_type == "product" && defined(slug)] | order(_createdAt desc){
  _id,
  title,
  slug,
  excerpt,
  price,
  image{
    ${imageQuery}
  }
}`;

export const PRODUCTS_SLUGS_QUERY = groq`*[_type == "product" && defined(slug)]{slug}`;
