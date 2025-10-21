import { defineField, defineType } from "sanity";
import { AlignLeft } from "lucide-react";

export default defineType({
  name: "rich-body",
  title: "Body",
  type: "object",
  icon: AlignLeft,
  fields: [
    defineField({
      name: "align",
      title: "Text alignment",
      type: "string",
      options: {
        list: [
          { title: "Left", value: "left" },
          { title: "Center", value: "center" },
          { title: "Right", value: "right" },
          { title: "Justify", value: "justify" },
        ],
        layout: "radio",
      },
      initialValue: "left",
    }),
    defineField({
      name: "body",
      title: "Content",
      // używamy istniejącego typu do bloga – daje nagłówki, listy, linki, obrazy itd.
      type: "block-content",
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: { },
    prepare() {
      return {
        title: "Body",
        subtitle: "Rich text section",
      };
    },
  },
});
