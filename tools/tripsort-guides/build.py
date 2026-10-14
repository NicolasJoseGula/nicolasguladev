#!/usr/bin/env python3
"""Builds the Trip Sort guides from guides.json and content/<slug>.html.

Each content file holds only the body of the article (bilingual, with
data-lang spans). This script wraps it with the shared head, header, footer
and structured data, writes tripsort/guides/<slug>/index.html and the guides
index, and refreshes the guides grid on the landing between the
<!-- guides:start --> and <!-- guides:end --> markers.

Run: python3 tools/tripsort-guides/build.py
"""
import html
import json
import pathlib
import re

HERE = pathlib.Path(__file__).resolve().parent
SITE = HERE.parent.parent / 'tripsort'
BASE = 'https://dezeo.lat/tripsort/'
UPDATED = '2026-10-12'
APP_STORE = 'https://apps.apple.com/app/trip-sort-triple-tile-match/id6818841022'
PLAY = 'https://play.google.com/store/apps/details?id=lat.dezeo.trip_sort'

GUIDES = json.loads((HERE / 'guides.json').read_text(encoding='utf-8'))


def bi(en, es):
    return f'<span data-lang="en">{en}</span><span data-lang="es" lang="es">{es}</span>'


def esc(s):
    return html.escape(s, quote=True)


def header(up):
    return f'''<header class="site-header">
  <div class="container">
    <a class="brand" href="{up}">
      <img src="{up}assets/img/tripsort-icon.png" alt="Trip Sort app icon" width="32" height="32">
      Trip Sort
    </a>
    <input type="checkbox" id="nav-toggle" class="nav-toggle" aria-hidden="true">
    <nav class="site-nav" aria-label="Main">
      <a href="{up}#screenshots">{bi('Screenshots', 'Capturas')}</a>
      <a href="{up}#how-it-works">{bi('How it works', 'Cómo funciona')}</a>
      <a href="{up}guides/">{bi('Guides', 'Guías')}</a>
      <a href="{up}#faq">FAQ</a>
      <a href="/projects.html">{bi('All projects', 'Proyectos')}</a>
      <select class="langselect" id="langselect" onchange="setLang(this.value)" aria-label="Language / Idioma">
        <option value="en">English</option>
        <option value="es">Español</option>
      </select>
      <a class="nav-cta" href="{up}#download">{bi('Download', 'Descargar')}</a>
    </nav>
    <label class="nav-burger" for="nav-toggle" aria-label="Menu"><span></span><span></span><span></span></label>
  </div>
</header>'''


def footer(up):
    foot = [('triple-tile-match', 'Triple tile match', 'Triple tile match'),
            ('how-to-beat-hard-tile-match-levels', 'Hard level tips', 'Niveles difíciles'),
            ('offline-games-no-wifi', 'Offline games', 'Juegos sin internet'),
            ('games-to-play-on-a-plane', 'Games for flights', 'Juegos para el avión'),
            ('brain-puzzle-games-for-adults', 'Brain games', 'Juegos mentales')]
    links = ''.join(f'\n          <li><a href="{up}guides/{s}/">{bi(en, es)}</a></li>' for s, en, es in foot)
    return f'''<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div>
        <a class="brand" href="{up}">
          <img src="{up}assets/img/tripsort-icon.png" alt="Trip Sort app icon" width="32" height="32">
          Trip Sort
        </a>
        <p>{bi('A relaxing triple tile match puzzle. Match 3 tiles, train your brain and travel the world, offline.', 'Un puzzle relajante de emparejar fichas de a tres. Juntá 3 fichas, entrená la cabeza y viajá por el mundo, sin internet.')}</p>
      </div>
      <div>
        <h4>App</h4>
        <ul>
          <li><a href="{up}#download">{bi('Download', 'Descargar')}</a></li>
          <li><a href="{up}#screenshots">{bi('Screenshots', 'Capturas')}</a></li>
          <li><a href="{up}#how-it-works">{bi('How it works', 'Cómo funciona')}</a></li>
          <li><a href="{up}#faq">FAQ</a></li>
          <li><a href="{up}support/">{bi('Support', 'Soporte')}</a></li>
          <li><a href="/projects.html">{bi('All projects', 'Proyectos')}</a></li>
        </ul>
      </div>
      <div>
        <h4>{bi('Guides', 'Guías')}</h4>
        <ul>{links}
          <li><a href="{up}guides/">{bi('All guides →', 'Todas las guías →')}</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© 2026 Trip Sort · Nicolas Gula · <a href="https://dezeo.lat/">dezeo</a></span>
      <span>
        <a href="{up}privacypolicy/">{bi('Privacy Policy', 'Privacidad')}</a> ·
        <a href="{up}terms/">{bi('Terms of Use', 'Términos')}</a> ·
        <a href="{up}support/">{bi('Support', 'Soporte')}</a>
      </span>
    </div>
  </div>
</footer>'''


LANG_JS = '''<script>
  function setLang(l) {
    document.body.setAttribute('data-active', l);
    document.documentElement.lang = l;
    var sel = document.getElementById('langselect');
    if (sel) sel.value = l;
    try { localStorage.setItem('ts-lang', l); } catch (e) {}
  }
  (function () {
    var saved = null;
    try { saved = localStorage.getItem('ts-lang'); } catch (e) {}
    var page = document.body.getAttribute('data-default');
    var l = saved || ((navigator.language || '').toLowerCase().indexOf('es') === 0 ? 'es' : page || 'en');
    setLang(l);
  })();
</script>'''


def head(title, desc, url, image, up, extra=''):
    return f'''<meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{esc(title)}</title>
  <meta name="description" content="{esc(desc)}">
  <link rel="canonical" href="{url}">
  <meta name="robots" content="index, follow">
  <meta name="theme-color" content="#8fd6ff">
  <link rel="icon" type="image/png" href="{up}assets/img/tripsort-icon.png">
  <link rel="apple-touch-icon" href="{up}assets/img/tripsort-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&display=swap">
  <link rel="stylesheet" href="{up}assets/css/site.css">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Trip Sort">
  <meta property="og:title" content="{esc(title)}">
  <meta property="og:description" content="{esc(desc)}">
  <meta property="og:url" content="{url}">
  <meta property="og:image" content="{image}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="{image}">{extra}'''


def guide_page(g, body):
    slug = g['slug']
    lang = g['lang']
    url = f'{BASE}guides/{slug}/'
    image = f'{BASE}assets/img/guides/{slug}.jpg'
    title = g[f'title_{lang}']
    desc = g[f'desc_{lang}']
    up = '../../'
    faq_path = HERE / 'content' / f'{slug}.faq.json'
    faq_ld = ''
    if faq_path.exists():
        faq = json.loads(faq_path.read_text(encoding='utf-8'))
        faq_ld = '\n  <script type="application/ld+json">\n' + json.dumps({
            '@context': 'https://schema.org', '@type': 'FAQPage',
            'mainEntity': [{'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': a}} for q, a in faq]
        }, ensure_ascii=False, indent=2) + '\n  </script>'
    article_ld = json.dumps({
        '@context': 'https://schema.org', '@type': 'Article', 'headline': title, 'description': desc,
        'image': image, 'inLanguage': lang, 'datePublished': UPDATED, 'dateModified': UPDATED,
        'author': {'@type': 'Organization', 'name': 'Trip Sort', 'url': BASE},
        'publisher': {'@type': 'Organization', 'name': 'dezeo', 'url': 'https://dezeo.lat/',
                      'logo': {'@type': 'ImageObject', 'url': BASE + 'assets/img/tripsort-icon.png'}},
        'mainEntityOfPage': url,
        'about': {'@type': 'MobileApplication', 'name': 'Trip Sort: Triple Tile Match', 'operatingSystem': 'iOS, Android',
                  'applicationCategory': 'GameApplication', 'url': BASE},
    }, ensure_ascii=False, indent=2)
    crumbs = json.dumps({
        '@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Trip Sort', 'item': BASE},
            {'@type': 'ListItem', 'position': 2, 'name': 'Guides', 'item': BASE + 'guides/'},
            {'@type': 'ListItem', 'position': 3, 'name': title}]}, ensure_ascii=False, indent=2)
    extra = f'\n  <script type="application/ld+json">\n{article_ld}\n  </script>\n  <script type="application/ld+json">\n{crumbs}\n  </script>{faq_ld}'
    # Related links: the next three guides in the list, wrapping around.
    i = [x['slug'] for x in GUIDES].index(slug)
    related = [GUIDES[(i + k) % len(GUIDES)] for k in (1, 2, 3)]
    rel = ''.join(f'\n    <a class="guide-card" href="../{r["slug"]}/"><img src="../../assets/img/guides/{r["slug"]}.jpg" width="1200" height="630" loading="lazy" alt=""><div class="body"><span class="tag">{bi(esc(r["tag_en"]), esc(r["tag_es"]))}</span><h3>{bi(esc(r["title_en"]), esc(r["title_es"]))}</h3><span class="read">{bi("Read the guide →", "Leer la guía →")}</span></div></a>' for r in related)
    return f'''<!DOCTYPE html>
<html lang="{lang}">
<head>
  {head(title, desc, url, image, up, extra)}
</head>
<body data-active="{lang}" data-default="{lang}">

{header(up)}

<main>
<article class="article article-hero">
  <div class="narrow">
    <p class="breadcrumb"><a href="{up}">Trip Sort</a> › <a href="../">{bi('Guides', 'Guías')}</a></p>
    <h1>{bi(esc(g['title_en']), esc(g['title_es']))}</h1>
    <p class="meta">{bi(f'Updated {UPDATED} · Trip Sort for iPhone and Android', f'Actualizado {UPDATED} · Trip Sort para iPhone y Android')}</p>
    <img class="cover" src="../../assets/img/guides/{slug}.jpg" width="1200" height="630" alt="{esc(g['title_en'])}">
{body.strip()}
    <section class="related" aria-label="Related guides">
      <h2>{bi('Keep reading', 'Seguir leyendo')}</h2>
      <div class="guides-grid">{rel}
      </div>
    </section>
  </div>
</article>
</main>

{footer(up)}

{LANG_JS}
</body>
</html>
'''


def guide_cards(prefix):
    return ''.join(f'''
        <a class="guide-card" href="{prefix}{g["slug"]}/">
          <img src="{'../' if prefix == '' else ''}assets/img/guides/{g["slug"]}.jpg" width="1200" height="630" loading="lazy" alt="{esc(g["title_en"])}">
          <div class="body">
            <span class="tag">{bi(esc(g["tag_en"]), esc(g["tag_es"]))}</span>
            <h3>{bi(esc(g["title_en"]), esc(g["title_es"]))}</h3>
            <p>{bi(esc(g["short_en"]), esc(g["short_es"]))}</p>
            <span class="read">{bi("Read the guide →", "Leer la guía →")}</span>
          </div>
        </a>''' for g in GUIDES)


def guides_index():
    url = BASE + 'guides/'
    title = 'Trip Sort Guides: Tile Match Tips, Offline Games and Brain Puzzles'
    desc = 'Guides for tile match players: how triple tile match works, tips for hard levels, offline games for flights, relaxing brain puzzles and how to play Trip Sort.'
    items = [{'@type': 'ListItem', 'position': k + 1, 'url': f'{BASE}guides/{g["slug"]}/', 'name': g[f'title_{g["lang"]}']} for k, g in enumerate(GUIDES)]
    ld = json.dumps({'@context': 'https://schema.org', '@type': 'ItemList', 'itemListElement': items}, ensure_ascii=False, indent=2)
    extra = f'\n  <script type="application/ld+json">\n{ld}\n  </script>'
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
  {head(title, desc, url, BASE + 'assets/img/og-tripsort.jpg', '../', extra)}
</head>
<body data-active="en">

{header('../')}

<main>
<section class="article-hero">
  <div class="container">
    <div class="section-head">
      <p class="breadcrumb"><a href="../">Trip Sort</a> › {bi('Guides', 'Guías')}</p>
      <h1 class="display" style="font-size:clamp(36px,5vw,58px);margin-bottom:14px">{bi('Trip Sort guides', 'Guías de Trip Sort')}</h1>
      <p>{bi('Tile match rules and tips, offline games for your next flight, relaxing brain puzzles and everything Trip Sort can do.', 'Reglas y consejos de tile match, juegos sin internet para tu próximo vuelo, puzzles relajantes y todo lo que puede hacer Trip Sort.')}</p>
    </div>
    <div class="guides-grid">{guide_cards('')}
    </div>
  </div>
</section>
</main>

{footer('../')}

{LANG_JS}
</body>
</html>
'''


def main():
    built = 0
    for g in GUIDES:
        src = HERE / 'content' / f'{g["slug"]}.html'
        if not src.exists():
            print('missing content:', g['slug'])
            continue
        out = SITE / 'guides' / g['slug'] / 'index.html'
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(guide_page(g, src.read_text(encoding='utf-8')), encoding='utf-8')
        built += 1
    (SITE / 'guides' / 'index.html').write_text(guides_index(), encoding='utf-8')
    # Landing: the guides grid lives between two markers.
    landing = SITE / 'index.html'
    page = landing.read_text(encoding='utf-8')
    page, n = re.subn(r'(<!-- guides:start -->).*?(\s*<!-- guides:end -->)',
                      lambda m: m.group(1) + guide_cards('guides/') + m.group(2), page, flags=re.S)
    if n:
        landing.write_text(page, encoding='utf-8')
    # Header and footer on the landing and support page come from here too.
    for p, up in ((landing, ''), (SITE / 'support' / 'index.html', '../')):
        if not p.exists():
            continue
        t = p.read_text(encoding='utf-8')
        t = re.sub(r'<header class="site-header">.*?</header>', lambda m: header(up), t, count=1, flags=re.S)
        t = re.sub(r'<footer class="site-footer">.*?</footer>', lambda m: footer(up), t, count=1, flags=re.S)
        t = re.sub(r'<script>\s*function setLang.*?</script>', lambda m: LANG_JS, t, count=1, flags=re.S)
        p.write_text(t, encoding='utf-8')
    print(f'{built} guides built, landing grid {"updated" if n else "NOT FOUND"}')


if __name__ == '__main__':
    main()
