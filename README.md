# dezeo.lat

Site and landing-page host for dezeo — a creative studio.

## Structure

```
nicolasdev/
├── index.html      Home (studio hero)
├── projects.html   Work (grid of projects)
├── styles.css      Shared styles (dark theme, brand gradients)
├── projects.js     The list of projects  <- add work here
├── assets/         Images, screenshots, and the dezeo logo
└── currencyflow/   One folder per project (landing + privacy policy)
    ├── index.html
    └── privacypolicy/
        └── index.html
```

## Brand

- Fonts: Space Grotesk (headings) + Inter (body).
- Gradient: blue `#2F6BFF` → violet `#7C3AED` → pink `#EC4899` → orange `#FB6E3C`.
- Dark background `#08080c`. Logo icon lives at `assets/dezeo-icon.png`.

## How to edit

### Change the hero copy / links
Edit the text in `index.html` (`.hero-title`, `.hero-sub`) and the nav links.
Set the real contact email (currently `hola@dezeo.lat`).

### Add a project to the grid
Open `projects.js` and add one object to the `projects` list:

```js
{
  name: "App name",
  image: "assets/app.png",
  description: "One short line about the app.",
  url: "appfolder/",
  platform: "ios"   // or "extension", "steam", or omit
}
```

### Add a project landing page
Create a folder (for example `currencyflow/`) with an `index.html` and a
`privacypolicy/index.html`. Keep it self-contained. Point the project's
`url` in `projects.js` to that folder.

## Preview locally
Open `index.html` in a browser, or run a static server from this folder:

```
python3 -m http.server 8000
```

## Hosting
Static site on GitHub Pages, served at the custom domain in `CNAME`.
Update DNS at the registrar to point the domain at GitHub Pages.
