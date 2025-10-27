import { defineType, defineField } from "sanity";
import { Grid3X3 } from "lucide-react";

export default defineType({
  name: "product-grid",
  title: "Product Grid",
  type: "object",
  icon: Grid3X3,
  fields: [
    defineField({ name: "title", title: "Tytuł sekcji", type: "string" }),
    defineField({
      name: "products",
      title: "Produkty",
      type: "array",
      of: [{ type: "reference", to: [{ type: "product" }] }],
      validation: (Rule) => Rule.min(1),
    }),
    defineField({
      name: "showPrices",
      title: "Pokazuj ceny",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "columns",
      title: "Kolumny (desktop)",
      type: "number",
      initialValue: 3,
      validation: (Rule) => Rule.min(2).max(4),
    }),
  ],
  preview: {
    select: { title: "title", count: "products.length" },
    prepare({ title, count }) {
      return { title: title || "Product Grid", subtitle: `${count || 0} produktów` };
    },
  },
});
