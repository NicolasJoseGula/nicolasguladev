#!/usr/bin/env python3
"""Mete el CSS dentro del HTML de index.html y projects.html.

Un <link rel="stylesheet"> bloquea el pintado y cuesta un viaje de ida y vuelta
entero antes de que se vea nada. Las dos páginas de la raíz suman menos de 13 KB
con el CSS adentro, así que entran en el primer envío del servidor y la página
pinta sin esperar un segundo pedido.

Las fuentes de verdad siguen siendo styles.css y assets/fonts/fonts.css. Después
de tocar cualquiera de los dos hay que correr esto.
"""
import pathlib
import re

RAIZ = pathlib.Path(__file__).resolve().parent.parent
PAGINAS = ('index.html', 'projects.html')
HOJAS = ('assets/fonts/fonts.css', 'styles.css')
MARCA_CSS = re.compile(r'(<style id="css-del-sitio">)(.*?)(</style>)', re.S)
# projects.js dibuja la grilla. Si viaja en un pedido aparte, el navegador
# alcanza a pintar la página con la grilla vacía y, cuando el script llega,
# las tarjetas empujan el pie hacia abajo: eso era 0,149 de CLS.
MARCA_JS = re.compile(r'(<script id="js-del-sitio">)(.*?)(</script>)', re.S)
GUION = 'projects.js'


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
        t = MARCA_CSS.sub(lambda m: m.group(1) + '\n' + css + '\n  ' + m.group(3), t, count=1)
        if MARCA_JS.search(t):
            t = MARCA_JS.sub(lambda m: m.group(1) + '\n' + js + '  ' + m.group(3), t, count=1)
        p.write_text(t, encoding='utf-8')
        print(f'  {nombre}: {antes/1024:.1f} KB -> {len(t)/1024:.1f} KB')
    print(f'  CSS: {len(css)/1024:.1f} KB desde {", ".join(HOJAS)}')
    print(f'  JS:  {len(js)/1024:.1f} KB desde {GUION} (solo en projects.html)')


if __name__ == '__main__':
    main()
