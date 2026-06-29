# nicolasgula.dev

Personal site and home for the landing pages of my apps.

## Structure

```
nicolasdev/
├── index.html      Home (terminal style, dark by default + light toggle)
├── projects.html   Grid of all projects
├── styles.css      Shared styles and the two themes
├── theme.js        Light / dark toggle (remembers the choice)
├── projects.js     The list of projects  <- add apps here
├── assets/         Images and screenshots
└── currencyflow/   One folder per app (landing + privacy policy)
    ├── index.html
    └── privacy.html
```

## How to edit

### Change my name / intro / links
Open `index.html` and edit the text inside `<h1 class="name">`, the
`<p class="about">` line, and the `<a>` links (set the real LinkedIn URL).

### Add a project to the grid
Open `projects.js` and add one object to the `projects` list:

```js
{
  name: "App name",
  image: "assets/app.png",
  description: "One short line about the app.",
  url: "appfolder/"
}
```

Drop the image in `assets/`. The grid updates itself.

### Add an app landing page
Create a folder (for example `currencyflow/`) with an `index.html`
(the landing) and a `privacy.html` (the privacy policy Apple requires).
Reuse `../styles.css` so everything matches. Then point that project's
`url` in `projects.js` to the folder.

## Preview locally
Open `index.html` directly in a browser, or run a tiny static server
from this folder:

```
python3 -m http.server 8000
```

Then visit http://localhost:8000

## Hosting (later)
This is a plain static site, so it works on Cloudflare Pages, GitHub
Pages, Netlify or Vercel. Point the `nicolasgula.dev` domain there.
