---
title: Guide to setup localDNS with caddy
cdate: 2026-10-03
mdate: 2026-10-05T17:37:00
date: Last Modified
tags:
  - selfhost
  - tech
location: Brussels, Belgium
---
This is going to be a technical post where I want to dump the steps of setting up *Caddy, Cloudflare, and Tailscale* for local DNS so that I can access self-hosted apps using *app.yourdomain.com*.

### Deploying Caddy with Cloudflare plugin:

- Create an API token on Cloudflare without adding any specific details.
- Since the latest Caddy does not include Cloudflare, so build a image, named caddy-cloudflare using following Dockerfile:

> FROM caddy:builder AS builder
> RUN xcaddy build --with github.com/caddy-dns/cloudflare
> 
> FROM caddy:latest
> COPY --from=builder /usr/bin/caddy /usr/bin/caddy

- Now create a container by running:
  
> docker build -t caddy-cloudflare:latest .

- Use the Cloudflare token while deploying Caddy + Cloudflare plugin as a variable (CF_API_TOKEN) in *.env* file.
- The docker compose file is the default one now except change the image name to *caddy-cloudflare:latest*.

### Caddy configuration file:

- It should work now if token is valid and there is no error in config file. The config file should have following format:
  
> app.domain.com {
>     tls {
>         dns cloudflare {env.CF_API_TOKEN}
>     }
>     reverse_proxy localhost:8683
> }

- One key detail is that using Cloudflare the domains will be on *https* so port 443 should be available. For *http* case, which I am not describing here, port 80 should be free.

Other ports might work I have not tried it.
