---
title: "Deploy apps using Pocketid"
cdate: 2026-10-11
mdate: 2026-10-11T18:37
date: Last Modified
tags:
  - code
---

# Deploying an App with Pocket ID

## Overview

Every app follows the same six steps: deploy, add to Caddy, register in Pocket ID, configure OIDC in the app, match the account, then test.

Placeholders used below:

| Placeholder | Meaning |
| --- | --- |
| `example.com` | Your domain |
| `id.example.com` | Pocket ID |
| `app.example.com` | The app being added |
| `APP-NAME` | App folder and container name |
| `APP_PORT` | Host port the app listens on |

Assumed setup: Caddy runs on the host network and proxies to `localhost:PORT`; DNS points to the Tailscale IP; Pocket ID runs at `id.example.com`.

How a login works:

1.  You click "Login with Pocket ID" in the app.
2.  The browser goes to Pocket ID, where you use your passkey.
3.  Pocket ID sends the browser back to the app with a one-time code.
4.  The app's container checks that code with Pocket ID directly. This server-to-server step is why the container must reach `id.example.com` (Step 1).

## Step 1 — Deploy the app

Use the usual conventions, and add `extra_hosts` so the container can reach Pocket ID through Caddy on the host.

```yaml
services:
  APP-NAME:
    image: <image>
    container_name: APP-NAME
    restart: unless-stopped
    ports:
      - "${APP_PORT}:<container-port>"
    environment:
      - TZ=Europe/Brussels
      # OIDC variables go here (Step 4)
    volumes:
      - /home/rpi/portainer/Files/AppData/Config/APP-NAME/data:/data
    extra_hosts:
      - "id.example.com:host-gateway"
    networks:
      - media

networks:
  media:
    external: true
```

*   Keep secrets (client ID, client secret) in the stack's `.env`.
*   `extra_hosts` points `id.example.com` at the Pi itself, where Caddy listens. The certificate stays valid because the name is unchanged.
*   To make the app reachable only through Caddy, bind the port as `"127.0.0.1:${APP_PORT}:<container-port>"`.

## Step 2 — Add the app to Caddy

Caddy is on the host network, so it proxies to `localhost` and the host port.

```
app.example.com {
    reverse_proxy localhost:APP_PORT
}
```

Reload Caddy, then confirm `https://app.example.com` opens before going further.

## Step 3 — Register the app in Pocket ID

1.  Go to **Administration → OIDC Clients → Add**.
2.  **Name:** the app's name (shown on the Pocket ID dashboard).
3.  **Callback URL:** taken from the app's docs. It always starts with `https://app.example.com/...`.
4.  Save, then copy the **Client ID** and **Client Secret** into the app's `.env`.
5.  Open the client's **Access** tab and choose **All Users**, or tick a group.

A new client starts with no group ticked, so nobody can log in until the Access tab is set.

## Step 4 — Configure OIDC in the app

Apps ask for the same few values, either in their settings page or as environment variables.

| Field the app asks for | Value |
| --- | --- |
| Client ID / Secret | From Step 3 |
| Issuer / Provider URL | `https://id.example.com` |
| Discovery URL | `https://id.example.com/.well-known/openid-configuration` |
| Scopes | `openid email profile` (add `groups` if the app maps groups) |

Some apps want each endpoint separately instead of a discovery URL:

| Endpoint | URL |
| --- | --- |
| Authorization | `https://id.example.com/authorize` |
| Token | `https://id.example.com/api/oidc/token` |
| Userinfo | `https://id.example.com/api/oidc/userinfo` |
| JWKS | `https://id.example.com/.well-known/jwks.json` |

After changing environment variables, redeploy the stack.

## Step 5 — Match your existing account

Do this before the first Pocket ID login, or the app creates a new, empty user.

Each app links accounts in one of three ways:

| App links by | What must match |
| --- | --- |
| Username | Pocket ID username = app username (not the display name). Turn off any "unique user id" or "provider prefix" option, and map the username to `preferred_username`. |
| Email | Pocket ID email = email on the app account |
| Manual link on first login | Nothing beforehand; choose "Link to an existing account" and enter the old password once |

If a duplicate user appears, check its real username (not the display name), fix the setting, delete the duplicate, and log in again.

## Step 6 — Test, then lock down (optional)

1.  Keep your current admin session open.
2.  In a private window, log in with Pocket ID and confirm you land in your existing account.
3.  Only then, optionally hide the password form.

Most apps have a setting or environment variable to hide the password form. Before turning it on, note the fallback: a direct-login URL, or removing the variable and redeploying.

Keep a Pocket ID passkey on at least two devices. Git over HTTPS, browser extensions and mobile apps usually use access tokens, so they keep working.

Sources: [Pocket ID docs](https://pocket-id.org/docs/setup/installation), [Pocket ID allowed groups](https://pocket-id.org/docs/configuration/allowed-groups)