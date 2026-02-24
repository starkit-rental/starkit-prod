"use client";

type Kind = "product" | "product-detail" | "product-button";

type Props = {
  kind: Kind;
  id: string;
  className?: string;
};

export default function ExternalEmbed({ kind, id, className }: Props) {
  return null;
}
