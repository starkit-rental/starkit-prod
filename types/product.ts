import type { PortableTextProps } from "@portabletext/react";

export interface ProductImage {
  asset?: {
    _id?: string;
    url?: string;
    mimeType?: string;
    metadata?: {
      lqip?: string;
      dimensions?: {
        width?: number;
        height?: number;
      };
    };
  };
  alt?: string;
  _key?: string;
}

export interface ProductDocument {
  _id?: string;
  title?: string;
  slug?: {
    current?: string;
  };
  excerpt?: string;
  price?: number;
  image?: ProductImage;
  gallery?: ProductImage[];
  body?: PortableTextProps["value"];
  meta_title?: string;
  meta_description?: string;
  noindex?: boolean;
  ogImage?: ProductImage;
}

export type ProductListItem = Pick<
  ProductDocument,
  "_id" | "title" | "slug" | "excerpt" | "price" | "image"
>;
