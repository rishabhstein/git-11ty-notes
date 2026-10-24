// scripts/sync-notes.js
// Copies the public notes from the SilverBullet space into src/posts, so the
// site (and CI, which only sees the repo) builds from them:
//   <space>/<Folder>/**/*.md  -> src/posts/<Folder>/...
//   <space>/ref.bib           -> src/posts/ref.bib
//   images next to the notes  -> assets/images/notes/
// src/posts becomes an exact mirror: notes deleted in SilverBullet disappear here.
// Run with `npm run sync`; set SILVERBULLET_DIR to use another space.
//
// A note edited on the website (its mdate here is newer than in SilverBullet)
// stops the sync, so the edit isn't lost. Copy it into SilverBullet first, or
// pass --force to overwrite it anyway.
const fs = require("fs");
const os = require("os");
const path = require("path");

const SPACE = process.env.SILVERBULLET_DIR || path.join(os.homedir(), "Documents/Silverbullet/notebooks");
const POSTS = "src/posts";
const IMAGES = "assets/images/notes";
// Folders that are never published: the life dashboard and SilverBullet's own code
const PRIVATE = new Set(["Home", "Library"]);
// Kept in src/posts although they don't come from SilverBullet
const KEEP = new Set(["posts.json"]);
const IMAGE_EXT = /\.(png|jpe?g|gif|svg|webp|avif|mp4|webm|mov|pdf)$/i;

const force = process.argv.includes("--force");

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const mdate = (file) => {
  const frontmatter = fs.readFileSync(file, "utf-8").match(/^---\n([\s\S]*?)\n---/);
  const value = frontmatter && frontmatter[1].match(/^mdate:\s*["']?([^"'\n]+)/m);
  const time = value ? Date.parse(value[1].trim().replace(" ", "T")) : NaN;
  return Number.isNaN(time) ? 0 : time;
};

if (!fs.existsSync(SPACE)) {
  console.error(`SilverBullet space not found: ${SPACE}`);
  process.exit(1);
}

// Everything to publish, as path inside src/posts -> source file
const notes = new Map();
const images = [];
for (const entry of fs.readdirSync(SPACE, { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name.startsWith(".") || PRIVATE.has(entry.name)) continue;
  for (const file of walk(path.join(SPACE, entry.name))) {
    if (file.endsWith(".md")) notes.set(path.relative(SPACE, file), file);
    else if (IMAGE_EXT.test(file)) images.push(file);
  }
}
if (fs.existsSync(path.join(SPACE, "ref.bib"))) notes.set("ref.bib", path.join(SPACE, "ref.bib"));

// Notes edited here more recently than in SilverBullet, matched by file name
// (so a note that moved into a folder is still found)
const sources = new Map([...notes].map(([rel, src]) => [path.basename(rel), src]));
const newer = walk(POSTS)
  .filter((file) => file.endsWith(".md") && sources.has(path.basename(file)))
  .filter((file) => mdate(file) > mdate(sources.get(path.basename(file))));
if (newer.length && !force) {
  console.error("These notes are newer here than in SilverBullet (edited on the website?):");
  for (const file of newer) console.error(`  ${file}  ->  ${path.relative(SPACE, sources.get(path.basename(file)))}`);
  console.error("Copy them into SilverBullet first, or run `npm run sync -- --force` to overwrite them.");
  process.exit(1);
}

// Mirror: remove what isn't in SilverBullet any more, then copy everything over
let removed = 0;
for (const file of walk(POSTS)) {
  const rel = path.relative(POSTS, file);
  if (!KEEP.has(rel) && !notes.has(rel)) {
    fs.rmSync(file);
    removed++;
  }
}
for (const dir of fs.readdirSync(POSTS, { withFileTypes: true })) {
  if (dir.isDirectory() && dir.name.startsWith(".")) fs.rmSync(path.join(POSTS, dir.name), { recursive: true });
}
let changed = 0;
for (const [rel, src] of notes) {
  const dest = path.join(POSTS, rel);
  if (fs.existsSync(dest) && fs.readFileSync(dest).equals(fs.readFileSync(src))) continue;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  changed++;
}
fs.mkdirSync(IMAGES, { recursive: true });
for (const src of images) fs.copyFileSync(src, path.join(IMAGES, path.basename(src)));

// Drop folders left empty by removed notes
const prune = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) prune(path.join(dir, entry.name));
  }
  if (dir !== POSTS && !fs.readdirSync(dir).length) fs.rmdirSync(dir);
};
prune(POSTS);

console.log(`Synced ${notes.size} files from ${SPACE}: ${changed} updated, ${removed} removed, ${images.length} images.`);
