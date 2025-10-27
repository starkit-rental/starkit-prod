import { defineType, defineField } from "sanity";
import { Tags } from "lucide-react";

export default defineType({
  name: "productCategory",
  title: "Product Category",
  type: "document",
  icon: Tags,
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
    }),
    // 🔽 wymagane przez @sanity/orderable-document-list
    defineField({
      name: "orderRank",
      title: "Order Rank",
      type: "string",
      hidden: true,
    }),
  ],
  preview: {
    select: { title: "title", media: "image" },
  },
});
