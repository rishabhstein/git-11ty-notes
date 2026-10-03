// utils/note-references.js
// Tidies how references look at the end of notes, without changing the notes:
//   - a "References:" / "Recommended:" line right before the [^footnotes] becomes
//     the heading of the footnote section (footnotes without one get "References")
//   - a "References:" line followed by a hand-made list (with <a name="1"> anchors)
//     is styled like the footnote section, and [1](#1) or ^[[1](#1)] citations
//     become superscripts
//   - other label lines such as "See also:" become small subheadings
const LABEL = /^(references|recommended|sources|bibliography|see also|further reading)(\s*\([^)]*\))?\s*:?\s*$/i;
const REFERENCE_LABEL = /^(references|sources|bibliography)\b/i;

function noteReferences(md) {
  // ^[[1](#1)] is a citation of a hand-made reference list, not an Obsidian inline
  // footnote ^[...]: turn it into the [1](#1) link before the footnote rule sees it
  md.inline.ruler.before("footnote_inline", "caret_citation", (state, silent) => {
    const match = /^\^\[\[(\d+)\]\(#(\d+)\)\]/.exec(state.src.slice(state.pos));
    if (!match) return false;
    if (!silent) {
      state.push("link_open", "a", 1).attrs = [["href", "#" + match[2]]];
      state.push("text", "", 0).content = match[1];
      state.push("link_close", "a", -1);
    }
    state.pos += match[0].length;
    return true;
  });

  md.core.ruler.push("note_references", (state) => {
    const tokens = state.tokens;

    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type !== "paragraph_open" || !tokens[i + 1] || tokens[i + 1].type !== "inline") continue;
      const text = tokens[i + 1].content.replace(/[*_]/g, "").trim();
      if (!LABEL.test(text)) continue;

      const label = text.replace(/\s*:\s*$/, "");
      const next = tokens[i + 3];
      // A "---" divider right before the label is replaced by the section's own border
      const dropRule = () => {
        if (tokens[i - 1] && tokens[i - 1].type === "hr") {
          tokens.splice(i - 1, 1);
          i--;
        }
      };

      if (next && next.type === "footnote_block_open") {
        next.meta = { ...next.meta, label };
        tokens.splice(i, 3);
        dropRule();
        i--;
      } else if (next && /^(bullet|ordered)_list_open$/.test(next.type) && REFERENCE_LABEL.test(label)) {
        tokens[i].attrJoin("class", "refs-title");
        const last = (tokens[i + 1].children || []).filter((t) => t.type === "text").pop();
        if (last) last.content = last.content.replace(/\s*:\s*$/, "");
        next.attrJoin("class", "refs-list");
        dropRule();
      } else {
        tokens[i].attrJoin("class", "section-label");
      }
    }

    // [1](#1) citations pointing at a hand-made reference list
    for (const block of tokens) {
      for (const token of block.children || []) {
        if (token.type === "link_open" && /^#\d+$/.test(token.attrGet("href") || "")) token.attrJoin("class", "cite-ref");
      }
    }
  });

  md.renderer.rules.footnote_block_open = (tokens, idx) => {
    const label = (tokens[idx].meta && tokens[idx].meta.label) || "References";
    return `<section class="footnotes">\n<h2 class="footnotes-title" id="references-list" data-toc="refs">${md.utils.escapeHtml(label)}</h2>\n<ol class="footnotes-list">\n`;
  };
}

module.exports = { noteReferences };
