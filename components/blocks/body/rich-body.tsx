import clsx from "clsx";
import PortableTextRenderer from "@/components/portable-text-renderer";

type RichBodyProps = {
  _type?: "rich-body";
  _key?: string;
  align?: "left" | "center" | "right" | "justify" | null;
  body?: any;
};

export default function RichBody({ align, body }: RichBodyProps) {
  const alignClass =
    align === "center"
      ? "text-center"
      : align === "right"
      ? "text-right"
      : align === "justify"
      ? "text-justify"
      : "text-left";

  // ✅ Zabezpieczenie przed undefined/null
  const hasBody = Array.isArray(body) && body.length > 0;
  if (!hasBody) return null;

  return (
    <section className="py-12 md:py-16">
      <div className="container">
        <div className={clsx("prose prose-lg dark:prose-invert mx-auto", alignClass)}>
          <PortableTextRenderer value={body} />
        </div>
      </div>
    </section>
  );
}
