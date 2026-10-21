# dezeo.lat

Site and landing-page host for dezeo — a creative studio.

## Structure

```
nicolasdev/
├── index.html      Home (the portal: logo, two buttons, full-page photo)
├── projects.html   Work (grid of projects)
├── styles.css      Shared styles (dark theme, lime accent)  <- edit here
├── projects.json   The list of projects  <- add work here
├── projects.js     Scroll-reveal for the cards (no data)
├── cometa.js       The comet cursor (desktop only)
├── tools/          Build scripts (see "Build step" below)
├── assets/
│   ├── fonts/      Self-hosted Space Grotesk + Inter (OFL, see OFL.txt)
│   └── originales/ Full-size sources; the site serves the small versions
└── charlatan/      One folder per project (landing + privacy policy)
    ├── index.html      guardianreader/, chartmaker/, blockandread/,
    └── privacypolicy/  fixyourlife/ follow the same shape
        └── index.html
```

## Brand

- Fonts: Space Grotesk (headings) + Inter (body).
- Accent: lime `#b8ff00` on a dark background `#0b0b0b`.
- Logo `assets/dezeo-logo.*`, symbol `assets/dezeo-icono.*`, favicon
  `assets/favicon.png` and the home photo `assets/dezeo-portal*` all come from
  the two originals in `assets/originales/neon-portal*`: run
  `python3 tools/portal-assets.py` after replacing either.
- The site is English only.

## How to edit

### Change the home buttons / links
Edit `.portal-acciones` in `index.html` and the nav links. The contact email
is `dezeogsp@gmail.com`.

### Add a project to the grid
Drop the full-size image in `assets/originales/`, run
`python3 tools/optimizar-assets.py`, then add one object to `projects` in
`projects.json`:

```json
{
  "name": "App name",
  "image": "assets/app.jpg",
  "alt": "App name icon: what the image shows",
  "description": "One short line about the app.",
  "url": "appfolder/",
  "platform": "ios"
}
```

Then run `python3 tools/construir.py`. The cards are written into
`projects.html` as real HTML, so search engines and AI crawlers that don't run
JavaScript still see every project and its link. The build refuses a project
whose `url` is not an existing page of the site.

### Add a project landing page
Create a folder (for example `charlatan/`) with an `index.html` and a
`privacypolicy/index.html`. Keep it self-contained. Point the project's
`url` in `projects.json` to that folder.

## Build step

The CSS and scripts are inlined into `index.html` and `projects.html` so
each page paints in a single round trip. `styles.css`,
`assets/fonts/fonts.css`, `projects.js` and `cometa.js` are still the files you
edit; the `<style id="css-del-sitio">` and `<script id="js:...">` blocks, the
Work cards and the footer app links (both from `projects.json`) are
generated. **After touching any of them, run:**

```
python3 tools/construir.py
```

Images are generated too. After adding or replacing anything in
`assets/originales/`, run:

```
python3 tools/optimizar-assets.py
```

It writes the small `.webp` / `.jpg` / `.png` versions the pages actually
serve. Both scripts are idempotent.

To refresh the self-hosted fonts from Google Fonts, run
`python3 tools/traer-fuentes.py`.

## Preview locally

```
node tools/servidor.js
```

Then open http://localhost:4173. (`python3 -m http.server` also works.)

## Hosting
Static site on GitHub Pages, served at the custom domain in `CNAME`.
Update DNS at the registrar to point the domain at GitHub Pages.
