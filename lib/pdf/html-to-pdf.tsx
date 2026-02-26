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
 * Strip HTML tags to get approximate text length for balancing columns.
 */
function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
}

/**
 * Extract top-level HTML blocks from an HTML string.
 */
function extractBlocks(html: string): string[] {
  const blockRegex = /(<(?:p|h[1-6]|ul|ol|div|blockquote|table)[^>]*>[\s\S]*?<\/(?:p|h[1-6]|ul|ol|div|blockquote|table)>|<(?:br|hr)\s*\/?>)/gi;
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

  return blocks;
}

/**
 * Estimate the rendered height (in PDF points) of an HTML block.
 *
 * A4 usable column width = (595 - 80 padding - 16 gap) / 2 = ~249pt
 * Font size = 7.5pt, line height = 1.45 => line height = ~10.9pt
 * Chars per line at 7.5pt Roboto in 249pt column ≈ 60 chars
 * Lists get extra indentation so slightly fewer chars per line.
 */
function estimateBlockHeight(blockHtml: string): number {
  const text = stripHtmlTags(blockHtml);
  if (!text) return 0;

  const isHeading = /^<h[1-6]/i.test(blockHtml.trim());
  const isList = /^<[uo]l/i.test(blockHtml.trim());

  const FONT_SIZE = 7.5;
  const LINE_HEIGHT_RATIO = 1.45;
  const LINE_H = FONT_SIZE * LINE_HEIGHT_RATIO; // ~10.9pt
  const CHARS_PER_LINE = isList ? 52 : 60; // lists are narrower due to bullet indent
  const BLOCK_MARGIN = 3; // marginBottom

  if (isHeading) {
    return FONT_SIZE * 1.2 * LINE_HEIGHT_RATIO + BLOCK_MARGIN + 6; // heading top margin
  }

  if (isList) {
    // Each li item: estimate its own wrapped lines
    const liTexts = blockHtml.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) ?? [];
    let total = 0;
    for (const li of liTexts) {
      const liText = stripHtmlTags(li);
      const lines = Math.max(1, Math.ceil(liText.length / CHARS_PER_LINE));
      total += lines * LINE_H + 1.5; // 1.5 marginBottom per li
    }
    return total + BLOCK_MARGIN + 1; // list marginTop
  }

  // Paragraph
  const lines = Math.max(1, Math.ceil(text.length / CHARS_PER_LINE));
  return lines * LINE_H + BLOCK_MARGIN;
}

/**
 * Split HTML into pages of two columns each.
 * Uses estimated block height to decide when a column is full.
 * Returns array of [leftHtml, rightHtml] tuples — one per page.
 */
export function splitHtmlIntoPageColumns(html: string, _unused?: number): [string, string][] {
  const blocks = extractBlocks(html);
  if (blocks.length === 0) return [["", ""]];

  // A4 height 841.89pt, padding top 35 + bottom 55 = 90pt, footer ~28pt
  // First page: minus section title ~20pt + margin 8pt
  const PAGE_HEIGHT = 841.89 - 90 - 28; // ~724pt usable
  const FIRST_PAGE_COL_HEIGHT = PAGE_HEIGHT - 28; // minus section title
  const OTHER_PAGE_COL_HEIGHT = PAGE_HEIGHT;

  const pages: [string, string][] = [];
  let leftBlocks: string[] = [];
  let rightBlocks: string[] = [];
  let leftHeight = 0;
  let rightHeight = 0;
  let isFirstPage = true;
  let fillingLeft = true;

  const getColHeight = () => isFirstPage ? FIRST_PAGE_COL_HEIGHT : OTHER_PAGE_COL_HEIGHT;

  const flushPage = () => {
    pages.push([leftBlocks.join("\n"), rightBlocks.join("\n")]);
    leftBlocks = [];
    rightBlocks = [];
    leftHeight = 0;
    rightHeight = 0;
    isFirstPage = false;
    fillingLeft = true;
  };

  for (const block of blocks) {
    const h = estimateBlockHeight(block);
    const colHeight = getColHeight();

    if (fillingLeft) {
      if (leftHeight + h > colHeight && leftBlocks.length > 0) {
        // Left column full, switch to right
        fillingLeft = false;
        rightBlocks.push(block);
        rightHeight += h;
      } else {
        leftBlocks.push(block);
        leftHeight += h;
      }
    } else {
      if (rightHeight + h > colHeight && rightBlocks.length > 0) {
        // Right column full, emit page and start new
        flushPage();
        leftBlocks.push(block);
        leftHeight += h;
      } else {
        rightBlocks.push(block);
        rightHeight += h;
      }
    }
  }

  // Emit last page
  if (leftBlocks.length > 0 || rightBlocks.length > 0) {
    pages.push([leftBlocks.join("\n"), rightBlocks.join("\n")]);
  }

  return pages.length > 0 ? pages : [["", ""]];
}

/**
 * @deprecated Use splitHtmlIntoPageColumns instead.
 * Split parsed HTML content into two balanced columns by text length.
 */
export function splitHtmlForColumns(html: string): [string, string] {
  const pages = splitHtmlIntoPageColumns(html, 99999);
  return pages[0] ?? ["", ""];
}
