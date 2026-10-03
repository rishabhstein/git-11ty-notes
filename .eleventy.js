const { execSync } = require("child_process");
const getLastModifiedDate = require("./src/utils/git-date");
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

  // Creating a datetime format filter
  eleventyConfig.addFilter("postDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj).toLocaleString(DateTime.DATE_MED);
  });

  // Creating a datetime format filter for homepage
  eleventyConfig.addFilter("postDateNotes", (dateObj) => {
    if (!dateObj) return "No date";             // Handle null/undefined
    if (!(dateObj instanceof Date)) {
      dateObj = new Date(dateObj);               // Convert if it's a string
    }
    if (isNaN(dateObj)) return "Invalid Date";  // Handle invalid dates

    return DateTime.fromJSDate(dateObj).toFormat("dd LLL yyyy, HH:mm");
  });


  // Using RenderPlugin
  eleventyConfig.addPlugin(EleventyRenderPlugin);

  // Rewrites root-relative URLs (/style.css etc.) to include pathPrefix
  eleventyConfig.addPlugin(HtmlBasePlugin);

  //Sorting posts from GitlastModifiedDate
  eleventyConfig.addCollection("posts", async function(collectionApi) {
    let posts = collectionApi.getFilteredByGlob("./posts/*.md");

    // Fetch lastModified for each post
    for (let post of posts) {
      post.data.lastModified = await getLastModifiedDate(post.inputPath);
    }

    // Sort posts by lastModified descending
    posts.sort((a, b) => new Date(b.data.lastModified) - new Date(a.data.lastModified));

    return posts;
  });


  eleventyConfig.addNunjucksAsyncFilter("gitLastModified", async function (filePath, callback) {
    const date = await getLastModifiedDate(filePath);
    callback(null, date);
  });


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
