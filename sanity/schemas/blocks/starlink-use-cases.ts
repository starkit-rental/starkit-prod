import { defineField, defineType } from "sanity";
import { Lightbulb } from "lucide-react";

export default defineType({
  name: "starlink-use-cases",
  type: "object",
  title: "Starlink Use Cases",
  icon: Lightbulb,
  description: "3 główne zastosowania Starlink Mini",
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
      title: "Section Title",
      initialValue: "Gdzie sprawdzi się Starlink Mini?",
    }),
  ],
  preview: {
    select: {
      title: "title",
    },
    prepare({ title }) {
      return {
        title: "Starlink Use Cases",
        subtitle: title || "Gdzie sprawdzi się Starlink Mini?",
      };
    },
  },
});
