#!/usr/bin/env python3
"""Mete el CSS dentro del HTML de index.html y projects.html.

Un <link rel="stylesheet"> bloquea el pintado y cuesta un viaje de ida y vuelta
entero antes de que se vea nada. Las dos páginas de la raíz suman menos de 13 KB
con el CSS adentro, así que entran en el primer envío del servidor y la página
pinta sin esperar un segundo pedido.

Las fuentes de verdad siguen siendo styles.css y assets/fonts/fonts.css. Después
de tocar cualquiera de los dos hay que correr esto.
"""
import html
import json
import pathlib
import re

RAIZ = pathlib.Path(__file__).resolve().parent.parent
PAGINAS = ('index.html', 'projects.html', 'press/index.html')
HOJAS = ('assets/fonts/fonts.css', 'styles.css')
MARCA_CSS = re.compile(r'(<style id="css-del-sitio">)(.*?)(</style>)', re.S)
# projects.js dibuja la grilla. Si viaja en un pedido aparte, el navegador
# alcanza a pintar la página con la grilla vacía y, cuando el script llega,
# las tarjetas empujan el pie hacia abajo: eso era 0,149 de CLS.
MARCA_JS = re.compile(r'(<script id="js-del-sitio">)(.*?)(</script>)', re.S)
GUION = 'projects.js'


# Las tarjetas de Work se escriben en el HTML. Antes las armaba projects.js en
# el navegador y la grilla llegaba vacia: un buscador sin renderizado o un
# extractor de IA leia "Work" y ningun proyecto, ni un solo enlace a las
# landings. La fuente es projects.json.
MARCA_TARJETAS = re.compile(r'(<!-- tarjetas:.*?-->)(.*?)(\n *<!-- /tarjetas -->)', re.S)
DATOS = 'projects.json'


def e_attr(texto):
    return html.escape(texto, quote=True)


def lista_legible(nombres):
    return nombres[0] if len(nombres) == 1 else ', '.join(nombres[:-1]) + ' and ' + nombres[-1]


def tarjetas():
    datos = json.loads((RAIZ / DATOS).read_text(encoding='utf-8'))
    plataformas = datos['platforms']
    e = html.escape
    piezas = []
    for i, p in enumerate(datos['projects']):
        # Nada de enlaces falsos: la landing tiene que existir de verdad
        for campo in ('name', 'description', 'url'):
            if not p.get(campo):
                raise SystemExit(f'{DATOS}: a "{p.get("name", "?")}" le falta "{campo}"')
        destino = RAIZ / p['url'].lstrip('/')
        if p['url'].startswith(('#', 'http')) or not (destino / 'index.html' if p['url'].endswith('/') else destino).exists():
            raise SystemExit(f'{DATOS}: "{p["name"]}" apunta a {p["url"]}, que no es una pagina del sitio')

        fondo = f' style="background: {e(p["background"])}"' if p.get('background') else ''
        imagen = ''
        if p.get('image'):
            webp = re.sub(r'\.(jpe?g|png)$', '.webp', p['image'], flags=re.I)
            fuente = (f'\n            <source type="image/webp" srcset="{e(webp)}">' if webp != p['image'] else '')
            clase = ' class="fit-contain"' if p.get('imageFit') == 'contain' else ''
            # la primera tarjeta suele ser el elemento mas grande en pantalla
            carga = 'loading="eager" fetchpriority="high"' if i == 0 else 'loading="lazy"'
            imagen = (f'\n          <picture>{fuente}'
                      f'\n            <img src="{e(p["image"])}" alt="{e(p.get("alt") or p["name"])}"{clase}{fondo}'
                      f' {carga} decoding="async" onerror="this.parentNode.remove()">'
                      f'\n          </picture>')

        claves = p.get('platform') or []
        claves = [claves] if isinstance(claves, str) else claves
        insignias = ''.join(
            f'\n              <span class="card-platform" title="{e(plataformas[k]["label"])}">'
            f'{plataformas[k]["svg"]}<span class="sr-only">{e(plataformas[k]["label"])}</span></span>'
            for k in claves if k in plataformas)
        if insignias:
            insignias = f'\n            <span class="card-platforms">{insignias}\n            </span>'

        piezas.append(f'''
      <a class="card" href="{e(p["url"])}">
        <div class="card-image"{fondo}>
          <span class="card-mono" aria-hidden="true">{e(p["name"][0])}</span>{imagen}
        </div>
        <div class="card-body">
          <h2 class="card-name">{e(p["name"])}</h2>
          <p class="card-desc">{e(p["description"])}</p>
          <div class="card-foot">
            <span class="card-open">→ open</span>{insignias}
          </div>
        </div>
      </a>''')
    nombres = [p['name'] for p in datos['projects']]
    return ''.join(piezas), nombres


# Pie de las paginas de la raiz: una fila con las apps y el kit de prensa.
# Le da a la home enlaces rastreables a cada app sin tocar la portada.
MARCA_PIE = re.compile(r'(<!-- apps-pie:.*?-->)(.*?)(\n *<!-- /apps-pie -->)', re.S)
# Kit de prensa: fichas de cada app y el total, desde projects.json.
MARCA_PRENSA = re.compile(r'(<!-- prensa:apps:.*?-->)(.*?)(\n *<!-- /prensa:apps -->)', re.S)
MARCA_CANTIDAD = re.compile(r'(<!-- prensa:cantidad -->)(.*?)(<!-- /prensa:cantidad -->)', re.S)
PT = '129004153'   # provider token de App Store Connect, para medir descargas desde prensa


def datos():
    return json.loads((RAIZ / DATOS).read_text(encoding='utf-8'))


def pie_apps(prefijo):
    e = html.escape
    enlaces = [f'<a href="{prefijo}{e(p["url"])}">{e(p["name"])}</a>' for p in datos()['projects']]
    enlaces.append(f'<a href="{prefijo}press/">Press kit</a>')
    return ('\n    <nav class="pie-apps" aria-label="Apps by dezeo">\n      '
            + '\n      '.join(enlaces) + '\n    </nav>')


def prensa_apps(prefijo):
    e = html.escape
    d = datos()
    plataformas = {k: v['label'].replace(' app', '') for k, v in d['platforms'].items()}
    fichas = []
    for p in d['projects']:
        pr = p['press']
        claves = p.get('platform') or []
        claves = [claves] if isinstance(claves, str) else claves
        tiendas = [f'<a href="{prefijo}{e(p["url"])}">Website</a>']
        if pr.get('app_store'):
            tiendas.append(f'<a href="https://apps.apple.com/app/apple-store/{e(pr["app_store"])}'
                           f'?pt={PT}&amp;ct=presskit&amp;mt=8">App Store</a>')
        if pr.get('google_play'):
            tiendas.append(f'<a href="https://play.google.com/store/apps/details?id={e(pr["google_play"])}'
                           f'&amp;referrer=utm_source%3Dpresskit">Google Play</a>')
        imagenes = [(pr['icon'], f'{p["name"]} app icon', 'App icon')] + [
            (ruta, f'{p["name"]}, press image {i}', f'Image {i}') for i, ruta in enumerate(pr['images'], 1)]
        lista = ''.join(
            f'\n            <li><a href="{prefijo}{e(r)}" download>'
            f'<img src="{prefijo}{e(r)}" alt="{e(alt)}" loading="lazy" decoding="async">'
            f'<span>{e(rotulo)}</span></a></li>' for r, alt, rotulo in imagenes)
        ancla = p['url'].strip('/').split('/')[-1]
        fichas.append(f'''
      <article class="prensa-app" id="{e(ancla)}">
        <div class="prensa-cabeza">
          <img class="prensa-icono" src="{prefijo}{e(pr["icon"])}" alt="" width="56" height="56" loading="lazy" decoding="async">
          <div>
            <h3>{e(p["name"])}</h3>
            <p class="prensa-plataformas">{e(" · ".join(plataformas[k] for k in claves if k in plataformas))}</p>
          </div>
        </div>
        <p class="prensa-texto">{e(p["description"])}</p>
        <p class="prensa-enlaces">{" · ".join(tiendas)}</p>
        <ul class="prensa-imagenes">{lista}
        </ul>
      </article>''')
    return ''.join(fichas), len(d['projects'])


def comprimir(css):
    """Quita comentarios y espacio sobrante. No es un minificador serio: solo
    hace lo que es seguro sin analizar el CSS."""
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    css = re.sub(r'\s*\n\s*', '\n', css)
    css = re.sub(r'\n{2,}', '\n', css)
    return css.strip()


def main():
    css = comprimir('\n'.join((RAIZ / h).read_text(encoding='utf-8') for h in HOJAS))
    js = (RAIZ / GUION).read_text(encoding='utf-8')
    if '</script' in js:
        raise SystemExit(f'{GUION} contiene "</script": no se puede insertar tal cual')

    for nombre in PAGINAS:
        p = RAIZ / nombre
        t = p.read_text(encoding='utf-8')
        if not MARCA_CSS.search(t):
            raise SystemExit(f'{nombre}: falta <style id="css-del-sitio"></style>')
        antes = len(t)
        # Las paginas en subcarpetas (press/) necesitan las fuentes un nivel arriba.
        prefijo = '../' * (len(pathlib.Path(nombre).parts) - 1)
        css_pagina = css.replace('url(assets/', f'url({prefijo}assets/')
        t = MARCA_CSS.sub(lambda m: m.group(1) + '\n' + css_pagina + '\n  ' + m.group(3), t, count=1)
        if MARCA_PIE.search(t):
            t = MARCA_PIE.sub(lambda m: m.group(1) + pie_apps(prefijo) + m.group(3), t, count=1)
        if MARCA_PRENSA.search(t):
            fichas, cantidad = prensa_apps(prefijo)
            t = MARCA_PRENSA.sub(lambda m: m.group(1) + fichas + m.group(3), t, count=1)
            t = MARCA_CANTIDAD.sub(lambda m: m.group(1) + f'<div><dt>Apps published</dt><dd>{cantidad}</dd></div>' + m.group(3), t, count=1)
            print(f'  {nombre}: {cantidad} fichas de prensa desde {DATOS}')
        if MARCA_TARJETAS.search(t):
            grilla, nombres = tarjetas()
            t = MARCA_TARJETAS.sub(lambda m: m.group(1) + grilla + m.group(3), t, count=1)
            # La descripcion se arma desde los mismos datos: si se agrega un
            # proyecto, no queda una meta description desactualizada.
            desc = e_attr(f'Apps and games by dezeo, a creative studio: {lista_legible(nombres)}.')
            for patron in (r'(<meta name="description" content=")[^"]*(">)',
                           r'(<meta property="og:description" content=")[^"]*(">)',
                           r'(<meta name="twitter:description" content=")[^"]*(">)'):
                t = re.sub(patron, lambda m: m.group(1) + desc + m.group(2), t, count=1)
            print(f'  {nombre}: {len(nombres)} tarjetas desde {DATOS}')
        if MARCA_JS.search(t):
            t = MARCA_JS.sub(lambda m: m.group(1) + '\n' + js + '  ' + m.group(3), t, count=1)
        p.write_text(t, encoding='utf-8')
        print(f'  {nombre}: {antes/1024:.1f} KB -> {len(t)/1024:.1f} KB')
    print(f'  CSS: {len(css)/1024:.1f} KB desde {", ".join(HOJAS)}')
    print(f'  JS:  {len(js)/1024:.1f} KB desde {GUION} (solo en projects.html)')


if __name__ == '__main__':
    main()
