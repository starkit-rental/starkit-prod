import { PortableTextBlock } from "sanity";

type FAQSchemaProps = {
  faqs: Array<{
    title: string | null;
    body?: PortableTextBlock[] | null;
  }>;
};

// Prosta funkcja do konwersji Portable Text na plain text
function portableTextToPlainText(blocks?: PortableTextBlock[] | null): string {
  if (!blocks || blocks.length === 0) return "";

  return blocks
    .map((block: any) => {
      if (block._type !== "block" || !block.children) {
        return "";
      }
      return block.children.map((child: any) => child.text).join("");
    })
    .join(" ");
}

export default function FAQSchema({ faqs }: FAQSchemaProps) {
  if (!faqs || faqs.length === 0) {
    return null;
  }

  // Filtruj FAQs bez tytułu
  const validFaqs = faqs.filter((faq) => faq.title);

  if (validFaqs.length === 0) {
    return null;
  }

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: validFaqs.map((faq) => ({
      "@type": "Question",
      name: faq.title,
      acceptedAnswer: {
        "@type": "Answer",
        text: portableTextToPlainText(faq.body),
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
