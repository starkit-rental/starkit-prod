import { defineField, defineType } from "sanity";
import { PackageOpen } from "lucide-react";

export default defineType({
  name: "product",
  title: "Product",
  type: "document",
  icon: PackageOpen,
  groups: [
    {
      name: "content",
      title: "Content",
    },
    {
      name: "media",
      title: "Media",
    },
    {
      name: "seo",
      title: "SEO",
    },
    {
      name: "settings",
      title: "Settings",
    },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      group: "content",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "settings",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "excerpt",
      title: "Excerpt",
      type: "text",
      group: "content",
    }),
    defineField({
      name: "price",
      title: "Price",
      type: "number",
      group: "content",
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: "image",
      title: "Primary image",
      type: "image",
      group: "media",
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: "alt",
          type: "string",
          title: "Alternative text",
        },
      ],
    }),
    defineField({
      name: "gallery",
      title: "Gallery",
      type: "array",
      group: "media",
      of: [
        {
          type: "image",
          options: {
            hotspot: true,
          },
          fields: [
            {
              name: "alt",
              type: "string",
              title: "Alternative text",
            },
          ],
        },
      ],
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "block-content",
      group: "content",
    }),
    defineField({
      name: "meta_title",
      title: "Meta Title",
      type: "string",
      group: "seo",
    }),
    defineField({
      name: "meta_description",
      title: "Meta Description",
      type: "text",
      group: "seo",
    }),
    defineField({
      name: "noindex",
      title: "No Index",
      type: "boolean",
      group: "seo",
      initialValue: false,
    }),
    defineField({
      name: "ogImage",
      title: "Open Graph image - [1200x630]",
      type: "image",
      group: "seo",
    }),
  ],
  preview: {
    select: {
      title: "title",
      media: "image",
      subtitle: "price",
    },
    prepare(selection) {
      const { subtitle } = selection;
      return {
        ...selection,
        subtitle:
          typeof subtitle === "number"
            ? new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(subtitle)
            : undefined,
      };
    },
  },
});
