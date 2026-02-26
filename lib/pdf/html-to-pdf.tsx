import React from "react";
import { Text, View, Link as PdfLink } from "@react-pdf/renderer";

// ═══════════════════════════════════════════════════════════
//  HTML → react-pdf converter for TipTap editor output
//  Handles: p, h2, h3, strong, b, em, i, u, a, ul, ol, li, br
// ═══════════════════════════════════════════════════════════

interface AstNode {
  type: "text" | "element";
  tag?: string;
  attrs?: Record<string, string>;
  children?: AstNode[];
  text?: string;
}

// ── Simple HTML tokenizer/parser ──────────────────────────

const VOID_TAGS = new Set(["br", "hr", "img"]);

function parseHtml(html: string): AstNode[] {
  const nodes: AstNode[] = [];
  let pos = 0;

  while (pos < html.length) {
    const tagStart = html.indexOf("<", pos);
    if (tagStart === -1) {
      const text = html.slice(pos).replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
      if (text.trim()) nodes.push({ type: "text", text });
      break;
    }

    // Text before tag
    if (tagStart > pos) {
      const text = html.slice(pos, tagStart).replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
      if (text) nodes.push({ type: "text", text });
    }

    const tagEnd = html.indexOf(">", tagStart);
    if (tagEnd === -1) {
      nodes.push({ type: "text", text: html.slice(tagStart) });
      break;
    }

    const tagContent = html.slice(tagStart + 1, tagEnd).trim();
    pos = tagEnd + 1;

    // Closing tag
    if (tagContent.startsWith("/")) {
      // Return to parent — handled by recursion
      return nodes;
    }

    // Self-closing tag or void tag
    const selfClosing = tagContent.endsWith("/");
    const cleanContent = selfClosing ? tagContent.slice(0, -1).trim() : tagContent;

    // Extract tag name and attributes
    const spaceIdx = cleanContent.indexOf(" ");
    const tagName = (spaceIdx === -1 ? cleanContent : cleanContent.slice(0, spaceIdx)).toLowerCase();
    const attrString = spaceIdx === -1 ? "" : cleanContent.slice(spaceIdx);
    const attrs: Record<string, string> = {};

    // Parse attributes
    const attrRegex = /(\w[\w-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+)))?/g;
    let match: RegExpExecArray | null;
    while ((match = attrRegex.exec(attrString)) !== null) {
      attrs[match[1]] = match[2] ?? match[3] ?? match[4] ?? "";
    }

    if (selfClosing || VOID_TAGS.has(tagName)) {
      nodes.push({ type: "element", tag: tagName, attrs, children: [] });
      continue;
    }

    // Find children by parsing until closing tag
    const childrenAndRest = parseChildrenUntilClose(html, pos, tagName);
    nodes.push({ type: "element", tag: tagName, attrs, children: childrenAndRest.children });
    pos = childrenAndRest.newPos;
  }

  return nodes;
}

function parseChildrenUntilClose(
  html: string,
  startPos: number,
  parentTag: string
): { children: AstNode[]; newPos: number } {
  const children: AstNode[] = [];
  let pos = startPos;
  let depth = 1;

  // Find the matching closing tag
  const closeTag = `</${parentTag}>`;
  let searchPos = pos;

  while (searchPos < html.length) {
    const nextOpen = html.indexOf(`<${parentTag}`, searchPos);
    const nextClose = html.indexOf(closeTag, searchPos);

    if (nextClose === -1) {
      // No closing tag found — treat rest as content
      break;
    }

    if (nextOpen !== -1 && nextOpen < nextClose) {
      // Nested open tag of same type
      depth++;
      searchPos = nextOpen + parentTag.length + 1;
      continue;
    }

    depth--;
    if (depth === 0) {
      // Found matching close tag
      const innerHtml = html.slice(pos, nextClose);
      const parsed = parseHtml(innerHtml);
      return { children: parsed, newPos: nextClose + closeTag.length };
    }

    searchPos = nextClose + closeTag.length;
  }

  // Fallback — parse whatever we have
  const parsed = parseHtml(html.slice(pos));
  return { children: parsed, newPos: html.length };
}

// ── AST → react-pdf elements ──────────────────────────────

const BASE_FONT_SIZE = 7.5;
const LINE_HEIGHT = 1.45;

const blockStyles: Record<string, Record<string, any>> = {
  p: { marginBottom: 3, fontSize: BASE_FONT_SIZE, lineHeight: LINE_HEIGHT, textAlign: "justify" as const },
  h2: { fontSize: 9, fontWeight: 700, marginBottom: 4, marginTop: 6 },
  h3: { fontSize: 8.5, fontWeight: 700, marginBottom: 3, marginTop: 5 },
  li: { fontSize: BASE_FONT_SIZE, lineHeight: LINE_HEIGHT, marginBottom: 2, paddingLeft: 8 },
};

const inlineStyles: Record<string, Record<string, any>> = {
  strong: { fontWeight: 700 },
  b: { fontWeight: 700 },
  em: { fontStyle: "italic" as const },
  i: { fontStyle: "italic" as const },
  u: { textDecoration: "underline" as const },
};

function renderAstNode(node: AstNode, key: string, insideText = false): React.ReactElement | string | null {
  if (node.type === "text") {
    const text = node.text ?? "";
    if (!text) return null;
    // If inside a Text component, return raw string (valid)
    if (insideText) return text;
    // At block level, only render non-whitespace text wrapped in Text
    if (text.trim()) return <Text key={key} style={{ fontSize: BASE_FONT_SIZE, lineHeight: LINE_HEIGHT }}>{text}</Text>;
    return null;
  }

  const tag = node.tag ?? "";
  // Inline elements pass insideText=true so text children return raw strings
  const isInline = !!inlineStyles[tag] || tag === "a";
  const children = (node.children ?? []).map((child, i) => renderAstNode(child, `${key}-${i}`, insideText || isInline)).filter(Boolean);

  if (tag === "hr") {
    return (
      <View
        key={key}
        style={{ borderBottomWidth: 0.5, borderBottomColor: "#cbd5e1", marginVertical: 4 }}
      />
    );
  }

  // Inline elements
  if (inlineStyles[tag]) {
    return (
      <Text key={key} style={inlineStyles[tag]}>
        {children}
      </Text>
    );
  }

  // Links
  if (tag === "a") {
    const href = node.attrs?.href ?? "";
    return (
      <PdfLink key={key} src={href} style={{ color: "#1e40af", textDecoration: "underline" }}>
        {children.length > 0 ? children : href}
      </PdfLink>
    );
  }

  // br inside text context
  if (tag === "br") {
    return insideText ? <Text key={key}>{"\n"}</Text> : null;
  }

  // Lists
  if (tag === "ul" || tag === "ol") {
    // Count actual <li> elements for proper numbering
    let listItemCounter = 0;
    return (
      <View key={key} style={{ marginBottom: 3, marginTop: 1 }}>
        {(node.children ?? []).map((child, i) => {
          if (child.type === "element" && child.tag === "li") {
            listItemCounter++;
            const bullet = tag === "ol" ? `${listItemCounter}.` : "\u2022";
            // li children run in insideText=true so they return raw strings for Text
            const liChildren = (child.children ?? []).map((c, j) => renderAstNode(c, `${key}-li-${i}-${j}`, true)).filter(Boolean);
            return (
              <View key={`${key}-li-${i}`} wrap={false} style={{ flexDirection: "row", marginBottom: 1.5, paddingLeft: 4 }}>
                <Text style={{ fontSize: BASE_FONT_SIZE, width: tag === "ol" ? 14 : 8, color: "#64748b" }}>
                  {bullet}
                </Text>
                <Text style={{ fontSize: BASE_FONT_SIZE, lineHeight: LINE_HEIGHT, flex: 1 }}>
                  {liChildren}
                </Text>
              </View>
            );
          }
          // Skip whitespace text nodes between <li> tags — these cause the numbering skip bug
          if (child.type === "text" && !(child.text ?? "").trim()) return null;
          return renderAstNode(child, `${key}-${i}`, false);
        })}
      </View>
    );
  }

  // Block elements (p, h2, h3, div, etc.)
  if (blockStyles[tag]) {
    // For paragraphs and headings, wrap in Text for proper inline rendering
    if (tag === "p" || tag === "h2" || tag === "h3") {
      // Re-render children in insideText mode
      const textChildren = (node.children ?? []).map((c, i) => renderAstNode(c, `${key}-t-${i}`, true)).filter(Boolean);
      return (
        <Text key={key} style={blockStyles[tag]}>
          {textChildren}
        </Text>
      );
    }
    return (
      <View key={key} style={blockStyles[tag]}>
        {children}
      </View>
    );
  }

  // Default: just render children (inline context passes through)
  if (children.length > 0) {
    if (insideText) return <Text key={key}>{children}</Text>;
    return <View key={key}>{children}</View>;
  }

  return null;
}

// ── Public component ──────────────────────────────────────

export function HtmlContent({
  html,
  style,
}: {
  html: string;
  style?: Record<string, any>;
}): React.ReactElement {
  if (!html || !html.trim()) {
    return (
      <View style={style}>
        <Text style={{ fontSize: BASE_FONT_SIZE, color: "#94a3b8" }}>
          Treść regulaminu niedostępna.
        </Text>
      </View>
    );
  }

  const nodes = parseHtml(html);
  const elements = nodes
    .map((node, i) => renderAstNode(node, `root-${i}`))
    .filter(Boolean);

  return <View style={style}>{elements}</View>;
}

/**
 * Split parsed HTML content into roughly equal halves for multi-column layout.
 * Returns [leftHtml, rightHtml] substrings.
 */
export function splitHtmlForColumns(html: string): [string, string] {
  // Split by top-level block elements
  const blockRegex = /(<(?:p|h[1-6]|ul|ol|li|div|blockquote)[^>]*>[\s\S]*?<\/(?:p|h[1-6]|ul|ol|li|div|blockquote)>|<(?:br|hr)\s*\/?>)/gi;
  const blocks: string[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(html)) !== null) {
    if (match.index > lastIndex) {
      const between = html.slice(lastIndex, match.index).trim();
      if (between) blocks.push(between);
    }
    blocks.push(match[0]);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < html.length) {
    const rest = html.slice(lastIndex).trim();
    if (rest) blocks.push(rest);
  }

  if (blocks.length <= 1) return [html, ""];

  const midpoint = Math.ceil(blocks.length / 2);
  const left = blocks.slice(0, midpoint).join("\n");
  const right = blocks.slice(midpoint).join("\n");

  return [left, right];
}
