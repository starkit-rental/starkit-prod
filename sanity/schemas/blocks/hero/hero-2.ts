import { defineField, defineType } from "sanity";
import { LayoutTemplate } from "lucide-react";

export default defineType({
  name: "hero-2",
  title: "Hero 2",
  type: "object",
  icon: LayoutTemplate,
  fields: [
    defineField({
      name: "tagLine",
      type: "string",
    }),
    defineField({
      name: "title",
      type: "string",
    }),
    defineField({
      name: "body",
      type: "block-content",
    }),
    defineField({
      name: "links",
      type: "array",
      of: [{ type: "link" }],
      validation: (rule) => rule.max(2),
    }),

    // 🆕 Dodane pola dla obrazu w tle
    defineField({
      name: "backgroundImage",
      title: "Background image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "backgroundAlt",
      title: "Background alt text",
      type: "string",
    }),
    defineField({
      name: "overlay",
      title: "Dark overlay (0–90%)",
      type: "number",
      validation: (Rule) => Rule.min(0).max(90),
      initialValue: 40,
    }),
  ],
  preview: {
    select: {
      title: "title",
      media: "backgroundImage", // 🆕 żeby pokazało miniaturkę w Studio
    },
    prepare({ title, media }) {
      return {
        title: "Hero 2",
        subtitle: title,
        media,
      };
    },
  },
});
