# RamiAhmedBock.com

Plain static site: no build step, no framework.

| File | What it is |
| --- | --- |
| `index.html` | The page. To add a link, copy one of the `<a class="main-menu-button">` lines. |
| `icons.svg` | Icon sprite (Font Awesome Free, CC BY 4.0). Reference an icon with `<svg class="icon" aria-hidden="true"><use href="/icons.svg#github"></use></svg>`. |
| `css/site.css` | All styling. |
| `fonts/` | Comfortaa and Do Hyeon, self-hosted (Latin subset; SIL Open Font License, see the `*-OFL.txt` files). |
| `js/site.js` | Click gags (jumping profile picture, disappearing links) and the footer year. |
| `js/asteroids.js` | The background mini-game on the canvas. |
| `404.html` | Shown by GitHub Pages for unknown URLs. |
| `CNAME`, `.nojekyll` | GitHub Pages settings: custom domain, and serve files as-is. |

Everything in the repo root is published, so don't commit anything here that shouldn't be public.

## Preview locally

```
python -m http.server 8000
```

Then open http://localhost:8000. The page has to be served over HTTP: all paths are root-absolute
(`/css/site.css`, `/icons.svg`, ...), so opening `index.html` straight from disk loads it unstyled.

## Deploy

Push to `master`. GitHub Pages publishes the repo root, usually within a minute.

### One-time setup (for reference)

1. Repo **Settings → Pages → Build and deployment**: Source "Deploy from a branch", branch `master`, folder `/ (root)`.
2. Same page, **Custom domain**: `www.ramiahmedbock.com` (matches the `CNAME` file). Add the domain on GitHub
   *before* changing DNS.
3. DNS at the registrar (Namecheap):
   - `www` → CNAME → `ramiahmed.github.io`
   - `@` (apex) → A records `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - Remove the old records pointing at the Hetzner server and the Namecheap URL redirect.
   GitHub then redirects `ramiahmedbock.com` to `www.ramiahmedbock.com` by itself.
4. Once the certificate is issued, tick **Enforce HTTPS** on the Pages settings page.
