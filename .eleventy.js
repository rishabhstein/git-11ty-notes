const { execSync } = require("child_process");
const { indexVault, obsidianLinks } = require("./src/utils/obsidian-links");


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

  // Notes, most recently modified first
  eleventyConfig.addCollection("notes", (collectionApi) =>
    collectionApi.getFilteredByTag("post").sort(
      (a, b) => (toDateTime(lastModified(b.data)) || 0) - (toDateTime(lastModified(a.data)) || 0)
    )
  );

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
