import { defineType, defineField } from "sanity";
import { MapPin } from "lucide-react";

export default defineType({
  name: "cityPage",
  title: "City Landing Pages",
  type: "document",
  icon: MapPin,
  groups: [
    { name: "content", title: "Content" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({
      name: "city",
      title: "City Name",
      type: "string",
      group: "content",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "content",
      options: { source: "city", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "region",
      title: "Region (województwo)",
      type: "string",
      group: "content",
    }),
    defineField({
      name: "headline",
      title: "Page Headline (H1)",
      type: "string",
      group: "content",
    }),
    defineField({
      name: "excerpt",
      title: "Short description",
      type: "text",
      group: "content",
      rows: 3,
    }),
    defineField({
      name: "heroImage",
      title: "Hero Background Image",
      type: "image",
      group: "content",
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: "body",
      title: "Main Content",
      type: "block-content",
      group: "content",
    }),
    defineField({
      name: "deliveryMethod",
      title: "Delivery Method",
      type: "string",
      group: "content",
      options: {
        list: [
          { title: "Odbiór osobisty + wysyłka", value: "pickup_and_shipping" },
          { title: "Tylko wysyłka (paczkomat/kurier)", value: "shipping_only" },
        ],
        layout: "radio",
      },
      initialValue: "shipping_only",
    }),
    defineField({
      name: "faqs",
      title: "FAQs",
      type: "array",
      group: "content",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "question", title: "Question", type: "string" }),
            defineField({ name: "answer", title: "Answer", type: "text" }),
          ],
          preview: { select: { title: "question" } },
        },
      ],
    }),
    defineField({
      name: "testimonials",
      title: "Testimonials",
      type: "array",
      group: "content",
      of: [{ type: "reference", to: [{ type: "testimonial" }] }],
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
      name: "ogImage",
      title: "Open Graph Image",
      type: "image",
      group: "seo",
    }),
  ],
  preview: {
    select: { title: "city", subtitle: "region" },
  },
});
