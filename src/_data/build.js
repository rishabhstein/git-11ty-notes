// Shown in the site footer: when the site was built and from which commit
const { execSync } = require("child_process");

module.exports = () => {
  let commit = process.env.GITHUB_SHA || "";
  if (!commit) {
    try {
      commit = execSync("git rev-parse HEAD", { encoding: "utf-8" }).trim();
    } catch {}
  }
  return {
    time: new Date(),
    commit: commit.slice(0, 7),
    commitUrl: commit ? `https://github.com/rishabhstein/git-11ty-notes/commit/${commit}` : null,
  };
};
