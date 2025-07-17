// utils/git-date.js
const simpleGit = require('simple-git');
const git = simpleGit();

module.exports = async function getLastModifiedDate(filePath) {
  try {
    const log = await git.log({ file: filePath });
    
    if (!log.latest) return null;
    return new Date(log.latest.date); // Convert string to Date object here

  } catch (e) {
    console.error(`Error getting git date for ${filePath}:`, e);
    return null;
  }
};
