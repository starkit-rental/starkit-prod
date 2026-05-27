import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/llms.txt", "/llms-full.txt"],
        disallow: ["/studio/", "/office/", "/api/", "/checkout/", "/admin/"],
      },
      {
        userAgent: "GPTBot",
        allow: ["/", "/llms.txt", "/llms-full.txt"],
        disallow: ["/studio/", "/office/", "/api/", "/checkout/", "/admin/"],
      },
      {
        userAgent: "ChatGPT-User",
        allow: ["/", "/llms.txt", "/llms-full.txt"],
        disallow: ["/studio/", "/office/", "/api/", "/checkout/", "/admin/"],
      },
      {
        userAgent: "PerplexityBot",
        allow: ["/", "/llms.txt", "/llms-full.txt"],
        disallow: ["/studio/", "/office/", "/api/", "/checkout/", "/admin/"],
      },
      {
        userAgent: "Google-Extended",
        allow: ["/", "/llms.txt", "/llms-full.txt"],
        disallow: ["/studio/", "/office/", "/api/", "/checkout/", "/admin/"],
      },
    ],
    sitemap: [`${process.env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`],
  };
}
