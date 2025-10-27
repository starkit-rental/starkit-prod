import { orderableDocumentListDeskItem } from "@sanity/orderable-document-list";
import {
  Files,
  BookA,
  User,
  ListCollapse,
  Quote,
  Menu,
  Settings,
  Boxes,
  Tags,
  LayoutTemplate,
} from "lucide-react";

export const structure = (S: any, context: any) =>
  S.list()
    .title("Content")
    .items([
      // --- strony i wpisy ---
      orderableDocumentListDeskItem({
        type: "page",
        title: "Pages",
        icon: Files,
        S,
        context,
      }),
      S.listItem()
        .title("Posts")
        .schemaType("post")
        .child(
          S.documentTypeList("post")
            .title("Post")
            .defaultOrdering([{ field: "_createdAt", direction: "desc" }])
        ),
      orderableDocumentListDeskItem({
        type: "category",
        title: "Categories",
        icon: BookA,
        S,
        context,
      }),
      orderableDocumentListDeskItem({
        type: "author",
        title: "Authors",
        icon: User,
        S,
        context,
      }),
      orderableDocumentListDeskItem({
        type: "faq",
        title: "FAQs",
        icon: ListCollapse,
        S,
        context,
      }),
      orderableDocumentListDeskItem({
        type: "testimonial",
        title: "Testimonials",
        icon: Quote,
        S,
        context,
      }),

      // --- separator ---
      S.divider(),

      // --- Products Page (singleton) ---
      S.listItem()
        .title("Products Page")
        .icon(LayoutTemplate)
        .child(
          S.document()
            .schemaType("productsPage")
            .documentId("productsPage")
        ),

      // --- produkty ---
      orderableDocumentListDeskItem({
        type: "product",
        title: "Products",
        icon: Boxes,
        S,
        context,
      }),
      orderableDocumentListDeskItem({
        type: "productCategory",
        title: "Product Categories",
        icon: Tags,
        S,
        context,
      }),

      // --- separator global ---
      S.divider({ title: "Global" }),

      // --- nawigacja i ustawienia ---
      S.listItem()
        .title("Navigation")
        .icon(Menu)
        .child(
          S.editor()
            .id("navigation")
            .schemaType("navigation")
            .documentId("navigation")
        ),
      S.listItem()
        .title("Settings")
        .icon(Settings)
        .child(
          S.editor()
            .id("settings")
            .schemaType("settings")
            .documentId("settings")
        ),
    ]);
