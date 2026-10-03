// utils/table-of-contents.js
// "Contents" list for note pages: every heading, label line ("Recommended:") and
// the references section gets an id while rendering, and the tableOfContents
// filter reads them back from the rendered HTML.

const slugify = (text) =>
  text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/<[^>]*>/g, "")
    .replace(/&[a-z0-9#]+;/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "section";

// markdown-it plugin: ids on headings and label paragraphs, unique per note
function headingIds(md) {
  md.core.ruler.push("heading_ids", (state) => {
    const used = new Set(["references-list"]);
    const unique = (base) => {
      let id = base;
      for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
      used.add(id);
      return id;
    };
    state.tokens.forEach((token, i) => {
      const isHeading = token.type === "heading_open";
      const isLabel = token.type === "paragraph_open" && /\b(section-label|refs-title)\b/.test(token.attrGet("class") || "");
      if ((!isHeading && !isLabel) || token.attrGet("id")) return;
      const inline = state.tokens[i + 1];
      const text = inline && inline.children ? inline.children.filter((t) => t.type === "text" || t.type === "code_inline").map((t) => t.content).join("") : "";
      token.attrSet("id", unique(slugify(text)));
      token.attrSet("data-toc", isHeading ? token.tag.slice(1) : "label");
    });
  });
}

// Eleventy filter: [{ id, text, depth }] from rendered note HTML
function tableOfContents(html) {
  const items = [];
  const re = /<(h[1-6]|p)\b([^>]*\bdata-toc="([^"]+)"[^>]*)>([\s\S]*?)<\/\1>/g;
  for (const [, , attrs, level, inner] of String(html).matchAll(re)) {
    const id = (attrs.match(/\bid="([^"]+)"/) || [])[1];
    const text = inner.replace(/<[^>]*>/g, "").replace(/\s*:\s*$/, "").trim();
    if (id && text) items.push({ id, text, level });
  }
  // Indent headings relative to the note's top heading level; labels and
  // references sit at that top level
  const levels = items.filter((item) => item.level !== "label" && item.level !== "refs").map((item) => Number(item.level));
  const top = levels.length ? Math.min(...levels) : 1;
  return items.map(({ id, text, level }) => ({
    id,
    text,
    depth: /^\d$/.test(level) ? Math.min(Number(level) - top, 2) : 0,
  }));
}

module.exports = { headingIds, tableOfContents };
