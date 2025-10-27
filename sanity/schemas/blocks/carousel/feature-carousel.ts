import { defineType, defineField } from "sanity";
import { Images } from "lucide-react";

export default defineType({
  name: "feature-carousel",
  title: "Feature Carousel",
  type: "object",
  icon: Images,
  fields: [
    defineField({ name: "title", type: "string", title: "Sekcja — tytuł" }),
    defineField({
      name: "items",
      title: "Karty",
      type: "array",
      of: [
        defineField({
          name: "feature",
          type: "object",
          title: "Karta",
          fields: [
            { name: "eyebrow", type: "string", title: "Mały nagłówek" },
            { name: "title", type: "string", title: "Nagłówek" },
            { name: "description", type: "block-content", title: "Opis" },
            { name: "ctaTitle", type: "string", title: "CTA — tekst" },
            { name: "ctaHref", type: "url", title: "CTA — link" },
            { name: "image", type: "image", title: "Obraz", options: { hotspot: true } },
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare({ title }) {
      return { title: title || "Feature Carousel" };
    },
  },
});
