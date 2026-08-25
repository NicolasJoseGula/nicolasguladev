#!/usr/bin/env python3
"""Baja Space Grotesk e Inter de Google Fonts y las deja servidas desde acá.

Antes el sitio las pedía a fonts.googleapis.com, que encadenaba tres viajes
antes de poder pintar texto: primero el CSS de Google, y recién después los
woff2 desde fonts.gstatic.com, otro dominio con su propio saludo TLS.

Solo se guardan los subconjuntos latin y latin-ext. El unicode-range que viene
en las declaraciones hace que latin-ext ni se pida mientras el texto no traiga
caracteres fuera del latin básico.

Las dos fuentes son SIL Open Font License 1.1: se pueden alojar y redistribuir
conservando el aviso de licencia, que queda en assets/fonts/OFL.txt.
"""
import pathlib
import re
import subprocess

RAIZ = pathlib.Path(__file__).resolve().parent.parent
DESTINO = RAIZ / 'assets' / 'fonts'
API = ('https://fonts.googleapis.com/css2'
       '?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500&display=swap')
# Un user agent moderno: si no, Google devuelve ttf en vez de woff2.
UA = ('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36')

ARCHIVOS = {
    ('Inter', 'latin'): 'inter-latin.woff2',
    ('Inter', 'latin-ext'): 'inter-latin-ext.woff2',
    ('Space Grotesk', 'latin'): 'space-grotesk-latin.woff2',
    ('Space Grotesk', 'latin-ext'): 'space-grotesk-latin-ext.woff2',
}

CABECERA = """/* ----------------------------------------------------------------
   Fuentes propias. Generado por tools/traer-fuentes.py: no editar a mano.

   Las declaraciones son las mismas que servía Google, con la URL apuntando a
   assets/fonts/. Se replican tal cual, una por peso, en vez de usar un rango
   variable: así el resultado es idéntico al de antes, sea la fuente variable
   o estática.

   Space Grotesk e Inter son SIL Open Font License 1.1; ver OFL.txt.
   ---------------------------------------------------------------- */
"""


def bajar(url, destino):
    subprocess.run(['curl', '-sS', '-f', '-A', UA, url, '-o', str(destino)], check=True)
    return destino.stat().st_size


def main():
    DESTINO.mkdir(parents=True, exist_ok=True)
    css = subprocess.run(['curl', '-sS', '-f', '-A', UA, API],
                         check=True, capture_output=True, text=True).stdout

    bloques, bajados = [], {}
    for m in re.finditer(r'/\*\s*([\w\[\]-]+)\s*\*/\s*@font-face\s*\{(.*?)\}', css, re.S):
        subconjunto, cuerpo = m.group(1), m.group(2)
        familia = re.search(r"font-family:\s*'([^']+)'", cuerpo).group(1)
        clave = (familia, subconjunto)
        if clave not in ARCHIVOS:
            continue
        nombre = ARCHIVOS[clave]
        if nombre not in bajados:
            bajados[nombre] = bajar(re.search(r'url\(([^)]+)\)', cuerpo).group(1), DESTINO / nombre)
        peso = re.search(r'font-weight:\s*([^;]+);', cuerpo).group(1).strip()
        rango = re.search(r'unicode-range:\s*([^;]+);', cuerpo).group(1).strip()
        bloques.append(
            "@font-face {\n"
            f"  font-family: '{familia}';\n"
            "  font-style: normal;\n"
            f"  font-weight: {peso};\n"
            "  font-display: swap;\n"
            f"  src: url(assets/fonts/{nombre}) format('woff2');\n"
            f"  unicode-range: {rango};\n"
            "}"
        )

    faltan = set(ARCHIVOS.values()) - set(bajados)
    if faltan:
        raise SystemExit(f'Google no devolvió estos subconjuntos: {sorted(faltan)}')

    (DESTINO / 'fonts.css').write_text(CABECERA + '\n' + '\n\n'.join(bloques) + '\n', encoding='utf-8')
    for nombre, peso in sorted(bajados.items()):
        print(f'  {nombre:30} {peso/1024:6.1f} KB')
    print(f'  fonts.css: {len(bloques)} bloques @font-face')
    print('\n  Ojo: después de esto hay que correr tools/construir.py.')


if __name__ == '__main__':
    main()
