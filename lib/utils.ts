import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDate = (date: string): string => {
  const dateObj = new Date(date);
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return dateObj.toLocaleDateString("en-US", options);
};

// Define the types for block content and children
type Block = {
  _type: string;
  children?: Array<{ text: string }>;
};

type BlockContent = Block[] | null;

// Helper function to extract plain text from block content
export const extractPlainText = (blocks: BlockContent): string | null => {
  if (!blocks || !Array.isArray(blocks)) return null;

  return blocks
    .map((block) => {
      if (block._type === "block" && Array.isArray(block.children)) {
        return block.children.map((child) => child.text).join("");
      }
      return "";
    })
    .join(" ");
};

// Type for internal link reference from Sanity
type InternalLinkRef = {
  _type?: string;
  slug?: string | null;
} | null | undefined;

// Helper function to generate URL from Sanity internal link
export const getInternalLinkUrl = (internalLink: InternalLinkRef): string => {
  if (!internalLink || !internalLink.slug || !internalLink._type) {
    return "#";
  }

  const { _type, slug } = internalLink;

  switch (_type) {
    case "product":
      return `/products/${slug}`;
    case "post":
      return `/blog/${slug}`;
    case "page":
      return `/${slug}`;
    default:
      return "#";
  }
};
