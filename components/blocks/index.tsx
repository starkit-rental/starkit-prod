import { PAGE_QUERYResult } from "@/sanity.types";
import Hero1 from "@/components/blocks/hero/hero-1";
import Hero2 from "@/components/blocks/hero/hero-2";
import SectionHeader from "@/components/blocks/section-header";
import SplitRow from "@/components/blocks/split/split-row";
import GridRow from "@/components/blocks/grid/grid-row";
import Carousel1 from "@/components/blocks/carousel/carousel-1";
import Carousel2 from "@/components/blocks/carousel/carousel-2";
import TimelineRow from "@/components/blocks/timeline/timeline-row";
import Cta1 from "@/components/blocks/cta/cta-1";
import LogoCloud1 from "@/components/blocks/logo-cloud/logo-cloud-1";
import FAQs from "@/components/blocks/faqs";
import FormNewsletter from "@/components/blocks/forms/newsletter";
import AllPosts from "@/components/blocks/all-posts";
import RichBody from "@/components/blocks/body/rich-body";

type Block = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];

// Poluzowana mapa: dzięki temu nie musimy idealnie trafiać w każdy _type z wygenerowanych typów
const componentMap: Record<string, React.ComponentType<any>> = {
  "hero-1": Hero1,
  "hero-2": Hero2,
  "section-header": SectionHeader,
  "split-row": SplitRow,
  "grid-row": GridRow,
  "carousel-1": Carousel1,
  "carousel-2": Carousel2,
  "timeline-row": TimelineRow, // w Twoich typach jest 'timeline-row'
  "cta-1": Cta1,
  "logo-cloud-1": LogoCloud1,
  faqs: FAQs,
  // Jeśli u Ciebie _type to np. "form-newsletter", po prostu zmień klucz poniżej
  newsletter: FormNewsletter,
  "all-posts": AllPosts,
  "rich-body": RichBody,
};

export default function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks?.map((block) => {
        const Component = componentMap[block._type];
        if (!Component) {
          console.warn(`No component implemented for block type: ${block._type}`);
          return <div data-type={block._type} key={block._key} />;
        }
        return <Component {...(block as any)} key={block._key} />;
      })}
    </>
  );
}
