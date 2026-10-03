// utils/obsidian-links.js
// Renders Obsidian-style links so notes can stay exactly as written in Obsidian:
//   [[note]], [[note|alias]], [[note#heading]]   -> link to the note's page
//   ![[image.png]], ![[image.png|300]]            -> <img> (or <video> for movies)
//   [text](note.md), [text](note)                 -> link to the note's page
const fs = require("fs");
const path = require("path");

const ATTACHMENT_EXT = /\.(png|jpe?g|gif|svg|webp|avif|mp4|webm|mov|pdf)$/i;
const VIDEO_EXT = /\.(mp4|webm|mov)$/i;

// Obsidian matches note and file names case-insensitively
const key = (name) => name.normalize("NFC").toLowerCase();

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "_includes" || entry.name === "node_modules") continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

// Map note names -> page URLs and attachment names -> public URLs.
// Attachments are only looked up in publicDir (already copied to the site as-is),
// so images kept elsewhere, e.g. next to private notes, are never published.
function indexVault(srcDir, notesDir, publicDir) {
  const notes = new Map();
  const attachments = new Map();
  const notesUrl = "/" + path.relative(srcDir, notesDir).split(path.sep).join("/") + "/";

  for (const file of walk(notesDir)) {
    const name = path.basename(file);
    if (path.resolve(path.dirname(file)) === path.resolve(notesDir) && name.endsWith(".md")) {
      const slug = name.slice(0, -3);
      notes.set(key(slug), slug === "index" ? notesUrl : `${notesUrl}${slug}/`);
    }
  }
  for (const file of walk(publicDir)) {
    const name = path.basename(file);
    if (ATTACHMENT_EXT.test(name)) {
      attachments.set(key(name), { url: "/" + path.relative(".", file).split(path.sep).join("/") });
    }
  }
  return { notes, attachments };
}

const encodePath = (url) => url.split("/").map(encodeURIComponent).join("/");
const headingAnchor = (heading) =>
  heading ? "#" + encodeURIComponent(heading.trim().toLowerCase().replace(/\s+/g, "-")) : "";

function obsidianLinks(md, { notes, attachments }) {
  const where = (env) => (env && env.page && env.page.inputPath) || "?";
  const warn = (env, msg) => console.warn(`[obsidian-links] ${where(env)}: ${msg}`);

  const noteUrl = (name, heading) => {
    const url = notes.get(key(name.trim()));
    return url ? encodePath(url) + headingAnchor(heading) : null;
  };

  // Resolve a relative markdown href like "kanada.md", "./stoicism/" or "Grammar%20notes.md#x"
  const resolveHref = (href) => {
    if (!href || /^([a-z][a-z0-9+.-]*:|\/|#)/i.test(href)) return null;
    const [rawPath, fragment] = href.split(/#(.*)/s);
    let name;
    try {
      name = decodeURIComponent(rawPath);
    } catch {
      name = rawPath;
    }
    name = path.posix.basename(name.replace(/\/+$/, ""));
    const isMd = name.endsWith(".md");
    if (isMd) name = name.slice(0, -3);
    const url = notes.get(key(name));
    if (url) return { url: encodePath(url) + (fragment ? "#" + fragment : "") };
    // "note.md" or a bare "note" (no file extension) points at a note that doesn't exist
    return { missing: isMd || !/\.[a-z0-9]+$/i.test(name) };
  };

  // [[...]] and ![[...]]
  md.inline.ruler.before("link", "obsidian_wikilink", (state, silent) => {
    const src = state.src;
    const embed = src.charCodeAt(state.pos) === 0x21; // "!"
    const open = embed ? state.pos + 1 : state.pos;
    if (!src.startsWith("[[", open)) return false;
    const close = src.indexOf("]]", open + 2);
    if (close < 0) return false;
    const inner = src.slice(open + 2, close);
    if (!inner.trim() || /[[\]\n]/.test(inner)) return false;

    if (!silent) {
      const [target, label] = inner.split(/\|(.*)/s);
      const [name, heading] = target.split(/#(.*)/s);
      const file = embed && attachments.get(key(name.trim()));

      if (file) {
        // ![[image.png|300]] or ![[image.png|300x200]]
        const size = (label || "").match(/^(\d+)(?:x(\d+))?$/);
        const attrs =
          ` src="${md.utils.escapeHtml(encodePath(file.url))}"` +
          (size ? ` width="${size[1]}"` : "") +
          (size && size[2] ? ` height="${size[2]}"` : "");
        const alt = md.utils.escapeHtml(size ? name.trim() : label || name.trim());
        const token = state.push("html_inline", "", 0);
        token.content = VIDEO_EXT.test(name)
          ? `<video controls${attrs}></video>`
          : `<img${attrs} alt="${alt}" loading="lazy">`;
      } else {
        const text = (label || target).trim();
        const url = noteUrl(name, heading);
        if (url) {
          state.push("link_open", "a", 1).attrs = [["href", url]];
          state.push("text", "", 0).content = text;
          state.push("link_close", "a", -1);
        } else {
          warn(state.env, `unresolved ${embed ? "embed" : "link"} [[${inner}]]`);
          state.push("text", "", 0).content = text;
        }
      }
    }
    state.pos = close + 2;
    return true;
  });

  // [text](note.md) and ![alt](image.png)
  // Links to missing notes are rendered as plain text, like unresolved [[wikilinks]]
  const unlink = (token) => {
    token.type = "text";
    token.tag = "";
    token.content = "";
  };

  md.core.ruler.push("obsidian_md_links", (state) => {
    for (const block of state.tokens) {
      const children = block.children || [];
      let unlinkedFrom = -1;
      for (let j = 0; j < children.length; j++) {
        const token = children[j];
        if (token.type === "link_open") {
          const href = token.attrGet("href");
          const resolved = resolveHref(href);
          if (resolved && resolved.url) token.attrSet("href", resolved.url);
          else if (resolved && resolved.missing) {
            warn(state.env, `unresolved link (${href})`);
            unlink(token);
            unlinkedFrom = j;
          }
        } else if (token.type === "link_close" && unlinkedFrom >= 0) {
          unlink(token);
          // A bare "Link" to an unpublished note (e.g. a Zotero literature note in a
          // reference) means nothing as plain text, so drop it and its separator
          const label = children.slice(unlinkedFrom + 1, j);
          if (label.length === 1 && label[0].type === "text" && /^link$/i.test(label[0].content.trim())) {
            label[0].content = "";
            const next = children[j + 1];
            const prev = children[unlinkedFrom - 1];
            if (next && next.type === "text" && next.content.trim()) next.content = next.content.replace(/^\s*,\s*/, "");
            else if (prev && prev.type === "text") prev.content = prev.content.replace(/,\s*$/, "");
          }
          unlinkedFrom = -1;
        } else if (token.type === "image") {
          const src = token.attrGet("src");
          if (!src || /^([a-z][a-z0-9+.-]*:|\/)/i.test(src)) continue;
          let name = src;
          try {
            name = decodeURIComponent(src);
          } catch {}
          const file = attachments.get(key(path.posix.basename(name)));
          if (file) token.attrSet("src", encodePath(file.url));
        }
      }
    }
  });
}

module.exports = { indexVault, obsidianLinks };
