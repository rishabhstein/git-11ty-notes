const { execSync } = require("child_process");
const fs = require("fs");
const { indexVault, obsidianLinks } = require("./src/utils/obsidian-links");
const markdownItFootnote = require("markdown-it-footnote");
const markdownItMark = require("markdown-it-mark");
const { noteReferences } = require("./src/utils/note-references");


module.exports = async function(eleventyConfig) {
  // Dynamically import ESM modules
  const { EleventyRenderPlugin, HtmlBasePlugin } = await import("@11ty/eleventy");
  const { feedPlugin } = await import("@11ty/eleventy-plugin-rss");
  const { DateTime } = await import("luxon");

  //Just copy this stuff to _site
  eleventyConfig.addPassthroughCopy('./assets');
  eleventyConfig.addPassthroughCopy('./src/style.css');
  eleventyConfig.addPassthroughCopy('./src/robots.txt');

  // Obsidian-style [[wikilinks]], ![[embeds]] and [links](note.md)
  // Embedded images are only taken from ./assets (already copied above)
  const vault = indexVault("src", "src/posts", "assets");
  eleventyConfig.amendLibrary("md", (md) => md.use(obsidianLinks, vault));

  // LaTeX maths ($...$ and $$...$$) rendered by KaTeX at build time, [^footnotes],
  // ==highlights== and bare https:// links, as in Obsidian
  const { katex } = await import("@mdit/plugin-katex");
  eleventyConfig.amendLibrary("md", (md) => {
    md.set({ linkify: true });
    md.linkify.set({ fuzzyLink: false });
    md.use(katex).use(markdownItFootnote).use(markdownItMark).use(noteReferences);
    // Footnote markers as plain numbers ("1", "2:1") instead of "[1]"
    md.renderer.rules.footnote_caption = (tokens, idx) => {
      const { id, subId } = tokens[idx].meta;
      return String(id + 1) + (subId > 0 ? `:${subId}` : "");
    };
  });
  eleventyConfig.addPassthroughCopy({
    "node_modules/katex/dist/katex.min.css": "katex/katex.min.css",
    "node_modules/katex/dist/fonts": "katex/fonts",
  });

  // Infobox on note pages, filled from frontmatter:
  //   image: plato.jpg            (or [[plato.jpg]], or an https:// URL)
  //   image_caption: Bust of Plato
  //   info:
  //     - "Born: c. 428 BCE"
  //     - "Teacher: [[socrates|Socrates]]"
  // Like embeds, image files are only taken from ./assets.
  let markdownLib;
  eleventyConfig.amendLibrary("md", (md) => {
    markdownLib = md;
  });
  eleventyConfig.addFilter("infoboxImage", function (value) {
    if (!value) return null;
    const name = String(value).trim().replace(/^!?\[\[|\]\]$/g, "").split("|")[0].trim();
    if (/^https?:\/\//i.test(name)) return name;
    const file = vault.attachments.get(name.split("/").pop().normalize("NFC").toLowerCase());
    if (!file) console.warn(`[infobox] ${this.page.inputPath}: image "${name}" not found in ./assets`);
    return file ? file.url.split("/").map(encodeURIComponent).join("/") : null;
  });
  eleventyConfig.addFilter("infoboxRows", (info) =>
    [].concat(info || []).map((item) => {
      const text = String(item);
      const colon = text.indexOf(":");
      // "Label: value"; text with no label (or a URL) becomes a full-width row
      return colon > 0 && !/^[a-z]+:\/\//i.test(text)
        ? { label: text.slice(0, colon).trim(), value: text.slice(colon + 1).trim() }
        : { label: "", value: text.trim() };
    })
  );
  eleventyConfig.addFilter("inlineMarkdown", function (text) {
    return markdownLib.renderInline(String(text), { page: this.page });
  });

  // Note dates come from frontmatter: `cdate` (created) and `mdate` (modified,
  // kept up to date by Obsidian). Git and file times are not used because
  // copying/committing notes in batches resets them.
  // Dates are shown exactly as written (UTC), so the build machine's time zone
  // doesn't shift them.
  const toDateTime = (value) => {
    if (!value) return null;
    const dt = value instanceof Date
      ? DateTime.fromJSDate(value, { zone: "utc" })
      : DateTime.fromISO(String(value).trim().replace(" ", "T"), { zone: "utc" });
    return dt.isValid ? dt : null;
  };
  const lastModified = (data) => data.mdate || data.cdate;

  eleventyConfig.addFilter("lastModified", lastModified);

  // Creating a datetime format filter
  eleventyConfig.addFilter("postDate", (value) => {
    const dt = toDateTime(value);
    return dt ? dt.toLocaleString(DateTime.DATE_MED) : "No date";
  });

  // Creating a datetime format filter for homepage; date-only values show no time
  eleventyConfig.addFilter("postDateNotes", (value) => {
    const dt = toDateTime(value);
    if (!dt) return "No date";
    return dt.toFormat(dt.hour || dt.minute ? "dd LLL yyyy, HH:mm" : "dd LLL yyyy");
  });

  // Compact date for the category cards on the homepage
  eleventyConfig.addFilter("shortDate", (value) => {
    const dt = toDateTime(value);
    return dt ? dt.toFormat("dd LLL yyyy") : "";
  });

  // Notes, most recently modified first
  const notesByModified = (collectionApi) =>
    collectionApi.getFilteredByTag("post").sort(
      (a, b) => (toDateTime(lastModified(b.data)) || 0) - (toDateTime(lastModified(a.data)) || 0)
    );
  eleventyConfig.addCollection("notes", notesByModified);

  // Notes grouped by the "## Category" headings and links in the index note
  // (src/posts/index.md), so categories are maintained in Obsidian. Notes not
  // listed there go into a final group so they stay visible.
  const CATEGORY_NOTE = "src/posts/index.md";
  eleventyConfig.addCollection("categories", (collectionApi) => {
    const noteKey = (target) => {
      let name = target.trim();
      try {
        name = decodeURIComponent(name);
      } catch {}
      name = name.split("#")[0].replace(/\/+$/, "").split("/").pop().replace(/\.md$/, "");
      return name.normalize("NFC").toLowerCase();
    };
    const notes = notesByModified(collectionApi).filter((note) => note.inputPath !== "./" + CATEGORY_NOTE);
    const byKey = new Map(notes.map((note) => [noteKey(note.fileSlug), note]));

    const groups = [];
    const sorted = new Set();
    for (const line of fs.readFileSync(CATEGORY_NOTE, "utf-8").split("\n")) {
      const heading = line.match(/^##\s+(.+?)\s*$/);
      if (heading) {
        groups.push({ name: heading[1], keys: new Set() });
        continue;
      }
      if (!groups.length) continue;
      // [[note]], [[note|alias]] or [text](note.md)
      for (const match of line.matchAll(/\[\[([^\]|]+)(?:\|[^\]]*)?\]\]|\]\(([^)]+)\)/g)) {
        const key = noteKey(match[1] || match[2]);
        if (byKey.has(key)) {
          groups.at(-1).keys.add(key);
          sorted.add(key);
        }
      }
    }

    const result = groups
      .map(({ name, keys }) => ({ name, notes: notes.filter((note) => keys.has(noteKey(note.fileSlug))) }))
      .filter((group) => group.notes.length);
    const unsorted = notes.filter((note) => !sorted.has(noteKey(note.fileSlug)));
    if (unsorted.length) result.push({ name: "Not yet sorted", notes: unsorted, unsorted: true });
    return result;
  });

  // Using RenderPlugin
  eleventyConfig.addPlugin(EleventyRenderPlugin);

  // Rewrites root-relative URLs (/style.css etc.) to include pathPrefix
  eleventyConfig.addPlugin(HtmlBasePlugin);

    // Add Pagefind after build hook here
  eleventyConfig.on('eleventy.after', () => {
    console.log("Running Pagefind...");
    execSync(`npx pagefind --source _site --glob "**/*.html"`, { encoding: 'utf-8' });
    console.log("Pagefind finished.");
  });

  return {
    pathPrefix: process.env.SITE_PATH_PREFIX || "/",
    dir: {
      input: "src",
      output: "_site"
    }
  };
};
