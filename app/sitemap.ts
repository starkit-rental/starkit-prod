import { MetadataRoute } from "next";
import { groq } from "next-sanity";
import { sanityFetch } from "@/sanity/lib/live";

async function getPagesSitemap(): Promise<MetadataRoute.Sitemap[]> {
  const pagesQuery = groq`
    *[_type == 'page'] | order(slug.current) {
      'url': $baseUrl + select(slug.current == 'index' => '', '/' + slug.current),
      'lastModified': _updatedAt,
      'changeFrequency': 'daily',
      'priority': select(
        slug.current == 'index' => 1,
        0.5
      )
    }
  `;

  const { data } = await sanityFetch({
    query: pagesQuery,
    params: {
      baseUrl: process.env.NEXT_PUBLIC_SITE_URL,
    },
  });

  return data;
}

async function getPostsSitemap(): Promise<MetadataRoute.Sitemap[]> {
  const postsQuery = groq`
    *[_type == 'post' && (!defined(publishAt) || publishAt <= now())] | order(_updatedAt desc) {
      'url': $baseUrl + '/blog/' + slug.current,
      'lastModified': _updatedAt,
      'changeFrequency': 'weekly',
      'priority': 0.7
    }
  `;

  const { data } = await sanityFetch({
    query: postsQuery,
    params: {
      baseUrl: process.env.NEXT_PUBLIC_SITE_URL,
    },
  });

  return data;
}

async function getProductsSitemap(): Promise<MetadataRoute.Sitemap[]> {
  const productsQuery = groq`
    *[_type == 'product' && isAddon != true && noindex != true] | order(orderRank) {
      'url': $baseUrl + '/products/' + slug.current,
      'lastModified': _updatedAt,
      'changeFrequency': 'daily',
      'priority': 0.9
    }
  `;

  const { data } = await sanityFetch({
    query: productsQuery,
    params: {
      baseUrl: process.env.NEXT_PUBLIC_SITE_URL,
    },
  });

  return data;
}

async function getCityPagesSitemap(): Promise<MetadataRoute.Sitemap[]> {
  const cityQuery = groq`
    *[_type == 'cityPage' && defined(slug)] | order(city asc) {
      'url': $baseUrl + '/wynajem-starlink/' + slug.current,
      'lastModified': _updatedAt,
      'changeFrequency': 'weekly',
      'priority': 0.8
    }
  `;

  const { data } = await sanityFetch({
    query: cityQuery,
    params: {
      baseUrl: process.env.NEXT_PUBLIC_SITE_URL,
    },
  });

  return data;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const [pages, posts, products, cityPages] = await Promise.all([
    getPagesSitemap(),
    getPostsSitemap(),
    getProductsSitemap(),
    getCityPagesSitemap(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
  ];

  return [...pages, ...staticPages, ...posts, ...products, ...cityPages].flat();
}
