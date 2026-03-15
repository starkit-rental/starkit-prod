import Blocks from "@/components/blocks";
import { fetchSanityPageBySlug } from "@/sanity/lib/fetch";
import { generatePageMetadata } from "@/sanity/lib/metadata";
import MissingSanityPage from "@/components/ui/missing-sanity-page";
import FAQSchema from "@/components/seo/faq-schema";

export async function generateMetadata() {
  const page = await fetchSanityPageBySlug({ slug: "index" });

  return generatePageMetadata({ page, slug: "index" });
}

export default async function IndexPage() {
  const page = await fetchSanityPageBySlug({ slug: "index" });

  if (!page) {
    return MissingSanityPage({ document: "page", slug: "index" });
  }

  const blocks = page?.blocks ?? [];

  const faqsFromBlocks = blocks
    .filter((b: any) => b._type === "faqs")
    .flatMap((b: any) => b.faqs ?? []);

  return (
    <>
      {faqsFromBlocks.length > 0 && <FAQSchema faqs={faqsFromBlocks} />}
      <Blocks blocks={blocks} />
    </>
  );
}
