#!/usr/bin/env python3
"""Genera las versiones livianas de las imágenes del sitio raíz.

Los originales quedan en assets/originales/ y no se publican; de acá salen los
archivos que sirve la página. Volver a correrlo es idempotente.

Medida que manda: el tamaño real en pantalla, no el del archivo.
  - el logo del header se ve a 44 px de alto  -> 132 px (3x)
  - las tarjetas de Work miden ~340 px de ancho -> 800 px de lado mayor
"""
import pathlib
from PIL import Image

ASSETS = pathlib.Path(__file__).resolve().parent.parent / 'assets'
ORIG = ASSETS / 'originales'

LOGO = 132          # 3x de los 44 px del header
TARJETA = 800       # lado mayor de las imágenes de proyecto
OG = 1024           # imagen para redes sociales


def guardar(im, destino, **kw):
    im.save(destino, **kw)
    return destino.stat().st_size


def encoger(im, lado_mayor):
    if max(im.size) <= lado_mayor:
        return im.copy()
    escala = lado_mayor / max(im.size)
    return im.resize((round(im.width * escala), round(im.height * escala)), Image.LANCZOS)


def fuente(nombre):
    """El original si ya lo archivamos, si no el que está publicado."""
    return ORIG / nombre if (ORIG / nombre).exists() else ASSETS / nombre


def main():
    ORIG.mkdir(exist_ok=True)
    filas = []

    # --- logo del header: es el que pesaba 1,3 MB para verse a 44 px ---
    src = fuente('dezeotransparent.png')
    antes = src.stat().st_size
    # PNG sin cuantizar: el logo es un degradado y la paleta de 256 colores le
    # deja bandas visibles. A 132 px pesa 6 KB igual, no vale la pena arriesgar
    # la marca por 3 KB.
    im = encoger(Image.open(src).convert('RGBA'), LOGO)
    p = guardar(im, ASSETS / 'dezeo-mark.png', format='PNG', optimize=True)
    filas.append(('dezeotransparent.png -> dezeo-mark.png', antes, p))

    # --- imágenes de las tarjetas de Work: webp con respaldo jpg ---
    for nombre in ('chartmaker', 'charlatan', 'guardianreader', 'blockandread', 'fixyourlife'):
        src = fuente(f'{nombre}.png')
        if not src.exists():
            continue
        antes = src.stat().st_size
        im = encoger(Image.open(src).convert('RGB'), TARJETA)
        w = guardar(im, ASSETS / f'{nombre}.webp', format='WEBP', quality=82, method=6)
        j = guardar(im, ASSETS / f'{nombre}.jpg', format='JPEG', quality=82,
                    optimize=True, progressive=True)
        filas.append((f'{nombre}.png -> .webp + .jpg', antes, w + j))

    # --- imagen de og: la piden los crawlers, no el navegador, pero 532 KB es mucho ---
    src = fuente('dezeologo.png')
    antes = src.stat().st_size
    im = encoger(Image.open(src).convert('RGB'), OG)
    j = guardar(im, ASSETS / 'dezeologo.jpg', format='JPEG', quality=88,
                optimize=True, progressive=True)
    filas.append(('dezeologo.png -> dezeologo.jpg', antes, j))

    ancho = max(len(f) for f, _, _ in filas)
    total_a = total_d = 0
    for f, a, d in filas:
        total_a += a
        total_d += d
        print(f'  {f:<{ancho}}  {a/1024:8.1f} KB -> {d/1024:7.1f} KB  ({100*(1-d/a):4.1f}% menos)')
    print(f'  {"TOTAL":<{ancho}}  {total_a/1024:8.1f} KB -> {total_d/1024:7.1f} KB'
          f'  ({100*(1-total_d/total_a):4.1f}% menos)')


if __name__ == '__main__':
    main()
