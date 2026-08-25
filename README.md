# dezeo.lat

Site and landing-page host for dezeo — a creative studio.

## Structure

```
nicolasdev/
├── index.html      Home (studio hero)
├── projects.html   Work (grid of projects)
├── styles.css      Shared styles (dark theme, brand gradients)  <- edit here
├── projects.js     The list of projects  <- add work here
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
- Gradient: blue `#2F6BFF` → violet `#7C3AED` → pink `#EC4899` → orange `#FB6E3C`.
- Dark background `#08080c`. Logo icon lives at `assets/dezeo-mark.png`.

## How to edit

### Change the hero copy / links
Edit the text in `index.html` (`.hero-title`, `.hero-sub`) and the nav links.
Set the real contact email (currently `hola@dezeo.lat`).

### Add a project to the grid
Drop the full-size image in `assets/originales/`, run
`python3 tools/optimizar-assets.py`, then add one object to `projects` in
`projects.js` pointing at the generated `.jpg`:

```js
{
  name: "App name",
  image: "assets/app.jpg",
  description: "One short line about the app.",
  url: "appfolder/",
  platform: "ios"   // or "extension", "steam", or omit
}
```

### Add a project landing page
Create a folder (for example `charlatan/`) with an `index.html` and a
`privacypolicy/index.html`. Keep it self-contained. Point the project's
`url` in `projects.js` to that folder.

## Build step

The CSS is inlined into `index.html` and `projects.html` so the page paints in
a single round trip. `styles.css` and `assets/fonts/fonts.css` are still the
files you edit; the `<style id="css-del-sitio">` block in each page is
generated. **After touching either stylesheet, run:**

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
