// utils/figures.js
// An image alone in its paragraph with alt text becomes a captioned card that
// floats right, with the text wrapping around it (Library/Personal/Figures.md
// does the same in SilverBullet):
//   ![Liesegang rings in a test tube](rings.jpg)  -> card, captioned
//   ![](plot.png)                                 -> full-width image, as before

function figures(md) {
  md.core.ruler.push("figures", (state) => {
    const tokens = state.tokens;
    for (let i = 0; i + 2 < tokens.length; i++) {
      if (tokens[i].type !== "paragraph_open" || tokens[i + 2].type !== "paragraph_close") continue;
      const children = (tokens[i + 1].children || []).filter(
        (t) => !(t.type === "softbreak" || (t.type === "text" && !t.content.trim()))
      );
      const image = children[0];
      if (children.length !== 1 || image.type !== "image" || !image.content.trim()) continue;
      image.meta = { ...image.meta, figure: true };
      tokens[i].hidden = tokens[i + 2].hidden = true;
    }
  });

  const renderImage = md.renderer.rules.image;
  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    const html = renderImage(tokens, idx, options, env, self);
    const token = tokens[idx];
    if (!token.meta || !token.meta.figure) return html;
    const caption = self.renderInline(token.children || [], options, env);
    return `<figure class="note-figure">${html}<figcaption>${caption}</figcaption></figure>\n`;
  };
}

module.exports = { figures };
