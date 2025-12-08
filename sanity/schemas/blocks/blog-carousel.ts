import { defineField, defineType } from "sanity";
import { Newspaper } from "lucide-react";

export default defineType({
  name: "blog-carousel",
  type: "object",
  title: "Blog Carousel",
  icon: Newspaper,
  description: "A carousel of the latest 6 blog posts",
  fields: [
    defineField({
      name: "padding",
      type: "section-padding",
    }),
    defineField({
      name: "colorVariant",
      type: "color-variant",
      title: "Color Variant",
      description: "Select a background color variant",
    }),
    defineField({
      name: "title",
      type: "string",
      title: "Title",
      description: "Optional title for the carousel section",
    }),
    defineField({
      name: "showViewAllButton",
      type: "boolean",
      title: "Show 'View All' Button",
      description: "Display a button linking to the blog page",
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: "title",
    },
    prepare({ title }) {
      return {
        title: "Blog Posts Carousel",
        subtitle: title || "Latest 6 blog posts",
      };
    },
  },
});
