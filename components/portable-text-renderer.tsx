import { PortableText, PortableTextProps } from "@portabletext/react";
import Image from "next/image";
import Link from "next/link";
import { YouTubeEmbed } from "@next/third-parties/google";
import { Highlight, themes } from "prism-react-renderer";
import { CopyButton } from "@/components/ui/copy-button";

/** ---------- aggressively normalize any incoming "value" to an array of blocks ---------- */
function toBlocks(value: any): any[] {
  // already an array of blocks
  if (Array.isArray(value)) return value;

  // common nests
  if (value?.value && Array.isArray(value.value)) return value.value;
  if (value?.blocks && Array.isArray(value.blocks)) return value.blocks;
  if (value?.content && Array.isArray(value.content)) return value.content;

  // sometimes Sanity returns { _type: 'blockContent', children: [...] } by mistake
  if (value?.children && Array.isArray(value.children)) return value.children;

  // nothing usable
  return [];
}

const portableTextComponents: PortableTextProps["components"] = {
  types: {
    image: ({ value }) => {
      const { url, metadata } = value.asset || {};
      const { lqip, dimensions } = metadata || {};
      const width = dimensions?.width ?? 1200;
      const height = dimensions?.height ?? 630;

      if (!url) return null;

      return (
        <Image
          src={url}
          alt={value?.alt || "Image"}
          width={width}
          height={height}
          placeholder={lqip ? "blur" : undefined}
          blurDataURL={lqip || undefined}
          style={{
            borderRadius: "1rem",
            marginLeft: "auto",
            marginRight: "auto",
          }}
          quality={100}
        />
      );
    },
    youtube: ({ value }) => {
      const videoId = value?.videoId;
      if (!videoId) return null;
      return (
        <div className="aspect-video max-w-[45rem] rounded-xl overflow-hidden mb-4">
          <YouTubeEmbed videoid={videoId} params="rel=0" />
        </div>
      );
    },
    code: ({ value }) => {
      const code = value?.code ?? "";
      const language = value?.language || "typescript";
      return (
        <div className="grid my-4 overflow-x-auto rounded-lg border border-border text-xs lg:text-sm bg-primary/80 dark:bg-muted/80">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-primary/80 dark:bg-muted">
            <div className="text-muted-foreground font-mono">
              {value?.filename || ""}
            </div>
            <CopyButton code={code} />
          </div>
          <Highlight theme={themes.vsDark} code={code} language={language}>
            {({ style, tokens, getLineProps, getTokenProps }) => (
              <pre
                style={{
                  ...style,
                  padding: "1.5rem",
                  margin: 0,
                  overflow: "auto",
                  backgroundColor: "transparent",
                }}
              >
                {tokens.map((line, i) => (
                  <div key={i} {...getLineProps({ line })}>
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token })} />
                    ))}
                  </div>
                ))}
              </pre>
            )}
          </Highlight>
        </div>
      );
    },
  },
  block: {
    normal: ({ children }) => (
      <p style={{ marginBottom: "1rem" }}>{children}</p>
    ),
    h1: ({ children }) => (
      <h1 style={{ marginBottom: "1rem", marginTop: "1rem" }}>{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 style={{ marginBottom: "1rem", marginTop: "1rem" }}>{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 style={{ marginBottom: "1rem", marginTop: "1rem" }}>{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 style={{ marginBottom: "1rem", marginTop: "1rem" }}>{children}</h4>
    ),
    h5: ({ children }) => (
      <h5 style={{ marginBottom: "1rem", marginTop: "1rem" }}>{children}</h5>
    ),
  },
  marks: {
    link: ({ value, children }) => {
      const href = value?.href || "#";
      const isExternal =
        href.startsWith("http") || href.startsWith("https") || href.startsWith("mailto");
      const target = isExternal ? "_blank" : undefined;
      return (
        <Link
          href={href}
          target={target}
          rel={target ? "noopener" : undefined}
          style={{ textDecoration: "underline" }}
        >
          {children}
        </Link>
      );
    },
  },
  list: {
    bullet: ({ children }) => (
      <ul
        style={{
          paddingLeft: "1.5rem",
          marginBottom: "1rem",
          listStyleType: "disc",
          listStylePosition: "inside",
        }}
      >
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol
        style={{
          paddingLeft: "1.5rem",
          marginBottom: "1rem",
          listStyleType: "decimal",
          listStylePosition: "inside",
        }}
      >
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => (
      <li style={{ marginBottom: "0.5rem" }}>{children}</li>
    ),
    number: ({ children }) => (
      <li style={{ marginBottom: "0.5rem" }}>{children}</li>
    ),
  },
};

type PortableTextRendererProps = {
  value?: PortableTextProps["value"] | any;
};

const PortableTextRenderer = ({ value }: PortableTextRendererProps) => {
  const blocks = toBlocks(value);

  // nic do renderu
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return null;
  }

  try {
    return <PortableText value={blocks} components={portableTextComponents} />;
  } catch {
    // na wszelki wypadek — jeśli biblioteka rzuci wyjątkiem
    return null;
  }
};

export default PortableTextRenderer;
