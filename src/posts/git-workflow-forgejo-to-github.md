---
title: "Git workflow: Forgejo to GitHub"
cdate: 2026-10-06
mdate: 2026-10-06T10:12
date: Last Modified
tags:
  - "selfhost"
  - "tech"
description: How I push to Forgejo, mirror to GitHub and deploy a static site to GitHub Pages
location: "Brussels, Belgium"
---
## Overview

Keep a copy of a repo both on Forgejo and Github where Forgejo manages all. I push to Forgejo repo and GitHub receives copies.

- Local clone: `origin` is Forgejo, `github` is GitHub (a second remote for emergencies).
- A Forgejo push mirror copies all branches, including `gh-pages`, to GitHub.
- The runner builds the site and force-pushes `_site` to `gh-pages` on Forgejo. GitHub Pages serves that branch.
- Never commit on GitHub directly: the mirror force-pushes and overwrites it.

## Daily workflow

1. Commit your changes: `git add -A && git commit -m "message"`.
2. Push to Forgejo: `git push origin master` (use `main` if that is the branch name).
3. Forgejo Actions builds the site and updates `gh-pages`; the mirror copies it to GitHub.
4. Check the run in the repo's Actions tab on Forgejo.

## One repo and two remotes: GitHub and Forgejo

Add a second remote, such as with Forgejo as origin and Github as second remote. It will be useful when one remote is down. How to add:

```bash
git remote add github https://github.com/USER/REPO.git   # once, if missing
git push github master
```

When Forgejo is back:

1. Run `git push origin master` once, so Forgejo has the same commits before the mirror syncs again.
2. If you edited on GitHub's website meanwhile, run `git pull github master` first, then push to Forgejo.

The site does not rebuild while Forgejo is down, because the runner depends on it.

## Set up push mirror to GitHub

1. On GitHub, create a fine-grained token (Settings > Developer settings > Fine-grained tokens). Limit it to the target repo, set Contents to Read and write, and set Workflows to Read and write if the repo has any `.github/workflows` file. Copy it right away.
2. In Forgejo open the repo, then Settings > Repository > Mirror settings > Push mirrors.
3. Enter `https://github.com/USER/REPO.git`, your GitHub username, and the token as the password. Turn on "Sync when commits are pushed".
4. Click Add push mirror, then Synchronize now.

The mirror force-pushes, so anything that exists only on GitHub is lost. Fine-grained tokens expire; create a new one and update it here before the date.

## Deploy to gh-pages and GitHub Pages

The workflow `.forgejo/workflows/deploy.yml` (with `runs-on: docker`) runs `npm ci` and `npm run build`, then force-pushes `_site` to the `gh-pages` branch on Forgejo using the secret `FORGEJO_TOKEN`. The mirror then copies that branch to GitHub.

- On GitHub: repo Settings > Pages > Deploy from a branch > `gh-pages` / root.
- Forgejo repo variables: `SITE_URL` (for example `https://USER.github.io/REPO`), `SITE_PATH_PREFIX` (defaults to `/REPO/`, use `/` with a custom domain), `SITE_CNAME` (custom domain only).
- Delete any old `.github/workflows` file, or GitHub runs it too and the Forgejo-only steps conflict.
- `gh-pages` holds only the latest build, since each deploy replaces its history.

## Checklist for a new site repo

1. Create an empty repo in Forgejo and push the code (`git push -u origin --all`).
2. Create the matching empty repo on GitHub.
3. Add `.forgejo/workflows/deploy.yml` and delete `.github/workflows/`.
4. Add the secret `FORGEJO_TOKEN` (Forgejo access token with repository read and write).
5. Add the variable `SITE_URL` (and `SITE_CNAME` for a custom domain).
6. Create a GitHub token that covers the new repo and add the push mirror.
7. Set GitHub Pages to deploy from the `gh-pages` branch.
8. Push a commit and watch the Actions tab on Forgejo.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `src refspec all does not match any` | `--all` typed with a long dash | Retype `git push -u origin --all` by hand |
| Mirror sync gives 403 | GitHub token lacks Contents or Workflows write, or does not cover the repo | Edit the token, then Synchronize now |
| Job stuck on "Waiting for a runner with label: docker" | No runner online | Check `docker logs forgejo-runner` and the runner UUID and token |
| Checkout fails with "Could not resolve host: forgejo" | Job container is not on the Forgejo network | Use the public URL in the runner config, or set its container network |
| Runner logs show 502 Bad Gateway | The reverse proxy cannot reach Forgejo | Point the runner at the internal address instead of the proxy |
| `<jemalloc>: Unsupported system page size` during Pagefind | Pi 5 uses 16 KB memory pages | Build Pagefind with a compatible page size in a custom image. Do not change the Pi kernel |
| Browser opens `/i/` and shows 404 | Chromium address bar autocomplete | Press Delete on the suggestion, or clear the site's cache |
| Push to GitHub rejected or history lost | Commits made on GitHub, then overwritten by the mirror | Commit only to Forgejo; pull from GitHub before pushing if you must edit there |

---

Generated by Claude
