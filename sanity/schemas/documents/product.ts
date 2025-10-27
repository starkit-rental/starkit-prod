import { defineType, defineField } from "sanity";
import { Boxes } from "lucide-react";

export default defineType({
  name: "product",
  title: "Product",
  type: "document",
  icon: Boxes,
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
      name: "category",
      title: "Category",
      type: "reference",
      to: [{ type: "productCategory" }],
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "excerpt",
      title: "Short description",
      type: "text",
      rows: 3,
    }),

    defineField({
      name: "description",
      title: "Body",
      type: "block-content",
    }),

    defineField({
      name: "images",
      title: "Images",
      type: "array",
      of: [{ type: "image", options: { hotspot: true } }],
      validation: (Rule) => Rule.min(1),
    }),

    defineField({
      name: "pricePerDay",
      title: "Price per day (PLN)",
      type: "number",
      validation: (Rule) => Rule.min(0),
    }),

    defineField({
      name: "deposit",
      title: "Deposit (PLN)",
      type: "number",
      validation: (Rule) => Rule.min(0),
    }),

    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          { title: "Available", value: "available" },
          { title: "Unavailable", value: "unavailable" },
        ],
        layout: "radio",
      },
      initialValue: "available",
    }),

    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "string" }],
    }),

    defineField({
      name: "specs",
      title: "Specs",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "label", title: "Label", type: "string" }),
            defineField({ name: "value", title: "Value", type: "string" }),
          ],
          preview: { select: { title: "label", subtitle: "value" } },
        },
      ],
    }),

    // 🔥 Dynamiczne sekcje (tak jak na stronie głównej)
    defineField({
      name: "blocks",
      title: "Blocks",
      type: "array",
      of: [
        { type: "hero-1" },
        { type: "hero-2" },
        { type: "section-header" },
        { type: "split-row" },
        { type: "split-cards-list" },
        { type: "split-info-list" },
        { type: "grid-row" },
        { type: "carousel-1" },
        { type: "carousel-2" },
        { type: "feature-carousel" },
        { type: "timeline-row" },
        { type: "cta-1" },
        { type: "logo-cloud-1" },
        { type: "faqs" },
        { type: "form-newsletter" },
        { type: "all-posts" },
        { type: "rich-body" },
      ],
    }),

    defineField({
      name: "orderRank",
      title: "Order Rank",
      type: "string",
      hidden: true,
    }),
  ],

  preview: {
    select: {
      title: "title",
      media: "images.0",
      subtitle: "category.title",
    },
  },
});
