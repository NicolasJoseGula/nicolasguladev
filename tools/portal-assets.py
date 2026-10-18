#!/usr/bin/env python3
"""Prepara la portada a partir de dos originales.

  - assets/originales/neon-portal-fondo.jpg: la sala del portal, hecha para
    fondo (2752x1536, sin logo). De aca salen los .webp/.jpg de la portada.
  - assets/originales/neon-portal.png: la lamina de marca, con el logo pintado
    sobre la pared. De aca se recorta el logo con transparencia, para
    superponerlo como un elemento HTML que se reubica y se escala solo.

La reparacion de la pared (separar() devuelve tambien la sala sin logo) quedo
de cuando la portada usaba la lamina como fondo; hoy solo se usa el logo.

La bajada "GAMES STUDIO & PUBLISHER" no entra en el recorte a proposito: en el
sitio es texto de verdad, hoy dice "CREATIVE STUDIO" y se cambia editando el
HTML.

La reparacion interpola por COLUMNA. La pared tiene una junta vertical que
cruza el logotipo; interpolar por fila la habria arrastrado a lo ancho.
Tambien hace falta dilatar la mascara bastante mas que la tinta: el logo tira
un halo de luz sobre la pared, y si las referencias se toman pegadas al borde
el parche hereda un fantasma del logotipo.

Correr despues de cambiar la lamina:  python3 tools/portal-assets.py
"""
import pathlib
import random
import sys

from PIL import Image, ImageDraw, ImageFilter

RAIZ = pathlib.Path(__file__).resolve().parent.parent
ASSETS = RAIZ / 'assets'
ORIGINAL = ASSETS / 'originales' / 'neon-portal.png'
FONDO = ASSETS / 'originales' / 'neon-portal-fondo.jpg'

# Geometria medida sobre la lamina de 1672x941:
#   simbolo   x 230..384
#   logotipo  x 430..853  y 357..469
#   bajada    x 430..853  y 496..510
ZONA = (190, 280, 900, 565)
BAJADA = (425, 488, 860, 518)
UMBRAL_TINTA = 70      # la pared llega a 77; el logo esta en 242
UMBRAL_HALO = 32       # la mediana de la pared es 12
DILATAR = 12
REFERENCIA = 8         # pixeles limpios que se promedian para interpolar

ANCHOS_FONDO = (2400, 1600, 1000)
# En vertical solo se ve una franja angosta alrededor del vano: mandarle al
# telefono la panoramica entera son 170 KB para mostrar una cuarta parte.
# El recorte vertical va centrado en el vano (68% del ancho, medido) y es mas
# ancho que cualquier telefono (0,6) para que el cover tenga margen.
CENTRO_VANO = 0.68
PROPORCION_VERTICAL = 0.6
CALIDAD_WEBP = 88      # degradados oscuros: por debajo de 85 aparecen bandas
CALIDAD_JPG = 86


def luma(p):
    return 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]


def separar(im):
    """Devuelve (logo con transparencia, sala sin logo)."""
    px = im.load()
    tinta, halo = set(), set()
    for y in range(ZONA[1], ZONA[3]):
        for x in range(ZONA[0], ZONA[2]):
            v = luma(px[x, y])
            if v > UMBRAL_TINTA:
                tinta.add((x, y))
            if v > UMBRAL_HALO:
                halo.add((x, y))

    mascara = set()
    for (x, y) in halo:
        for dy in range(-DILATAR, DILATAR + 1):
            for dx in range(-DILATAR, DILATAR + 1):
                if dx * dx + dy * dy <= DILATAR * DILATAR:
                    mascara.add((x + dx, y + dy))

    # --- logo, sin la bajada ---
    sin_bajada = {(x, y) for (x, y) in tinta
                  if not (BAJADA[0] <= x < BAJADA[2] and BAJADA[1] <= y < BAJADA[3])}
    lx0, lx1 = min(x for x, _ in sin_bajada) - 3, max(x for x, _ in sin_bajada) + 4
    ly0, ly1 = min(y for _, y in sin_bajada) - 3, max(y for _, y in sin_bajada) + 4
    ancho, alto = lx1 - lx0, ly1 - ly0

    # El alfa sale de una rampa de luminancia, pero acotada a lo que esta pegado
    # a la tinta: si no, la textura de la pared que pasa el umbral se cuela como
    # manchas sueltas en las esquinas.
    cerca = Image.new('L', (ancho, alto), 0)
    cp = cerca.load()
    for (x, y) in sin_bajada:
        if lx0 <= x < lx1 and ly0 <= y < ly1:
            cp[x - lx0, y - ly0] = 255
    cerca = cerca.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(1.6))
    cp = cerca.load()

    logo = Image.new('RGBA', (ancho, alto), (0, 0, 0, 0))
    lp = logo.load()
    for y in range(ly0, ly1):
        for x in range(lx0, lx1):
            if BAJADA[0] <= x < BAJADA[2] and BAJADA[1] <= y < BAJADA[3]:
                continue
            r, g, b = px[x, y]
            a = (luma((r, g, b)) - 45.0) / 105.0
            a = 0.0 if a < 0 else (1.0 if a > 1 else a)
            a *= cp[x - lx0, y - ly0] / 255.0
            if a > 0.004:
                lp[x - lx0, y - ly0] = (r, g, b, int(round(a * 255)))
    logo = logo.crop(logo.getbbox())

    # --- pared reparada ---
    sala = im.copy()
    sp = sala.load()
    rnd = random.Random(7)
    porcolumna = {}
    for (x, y) in mascara:
        porcolumna.setdefault(x, []).append(y)

    for x, ys in porcolumna.items():
        ys.sort()
        arriba, abajo = ys[0] - 1, ys[-1] + 1
        ca = [sum(px[x, arriba - k][i] for k in range(REFERENCIA)) / REFERENCIA for i in range(3)]
        cb = [sum(px[x, abajo + k][i] for k in range(REFERENCIA)) / REFERENCIA for i in range(3)]
        tramo = abajo - arriba
        for y in ys:
            t = (y - arriba) / tramo
            ruido = rnd.gauss(0, 1.6)
            sp[x, y] = tuple(max(0, min(255, int(round(ca[i] + (cb[i] - ca[i]) * t + ruido))))
                             for i in range(3))

    # desenfoque leve, solo adentro del parche, para matar el bandeado
    caja = (ZONA[0] - DILATAR - 8, ZONA[1] - DILATAR - 8,
            ZONA[2] + DILATAR + 8, ZONA[3] + DILATAR + 8)
    suave = sala.crop(caja).filter(ImageFilter.GaussianBlur(2.0))
    final = sala.copy()
    final.paste(suave, caja)
    a, b = final.load(), sala.load()
    for y in range(caja[1], caja[3]):
        for x in range(caja[0], caja[2]):
            if (x, y) not in mascara:
                a[x, y] = b[x, y]

    return logo, final


def main():
    for ruta in (ORIGINAL, FONDO):
        if not ruta.exists():
            raise SystemExit(f'falta {ruta}')

    logo, _ = separar(Image.open(ORIGINAL).convert('RGB'))
    sala = Image.open(FONDO).convert('RGB')
    print(f'  fondo: {FONDO.relative_to(RAIZ)}  ({sala.width}x{sala.height})')

    filas = []
    for ancho in ANCHOS_FONDO:
        im = sala if ancho == sala.width else sala.resize(
            (ancho, round(sala.height * ancho / sala.width)), Image.LANCZOS)
        sufijo = '' if ancho == max(ANCHOS_FONDO) else f'-{ancho}'
        w = ASSETS / f'dezeo-portal{sufijo}.webp'
        im.save(w, format='WEBP', quality=CALIDAD_WEBP, method=6)
        filas.append((w, im.size))
        if ancho == ANCHOS_FONDO[1]:
            # respaldo jpg y tarjeta para redes: 1600 alcanza y pesa la mitad
            j = ASSETS / 'dezeo-portal.jpg'
            im.save(j, format='JPEG', quality=CALIDAD_JPG, optimize=True, progressive=True)
            filas.append((j, im.size))

    alto = sala.height
    ancho_v = round(alto * PROPORCION_VERTICAL)
    x0 = round(sala.width * CENTRO_VANO - ancho_v / 2)
    x0 = max(0, min(sala.width - ancho_v, x0))
    vertical = sala.crop((x0, 0, x0 + ancho_v, alto))
    v = ASSETS / 'dezeo-portal-vertical.webp'
    vertical.save(v, format='WEBP', quality=CALIDAD_WEBP, method=6)
    filas.append((v, vertical.size))

    # El simbolo solo, para el encabezado de las otras paginas y como favicon.
    # Arranca en el borde izquierdo del logo y termina donde empieza el blanco
    # del logotipo (la columna 384 del original, menos el recorte ya aplicado).
    ancho_simbolo = round(logo.width * 160 / 630)
    simbolo = logo.crop((0, 0, ancho_simbolo, logo.height))
    simbolo = simbolo.crop(simbolo.getbbox())

    # Favicon (y apple-touch-icon): el simbolo sobre un cuadrado oscuro de
    # puntas redondeadas, porque el blanco solo se pierde en una pestana clara.
    lado = 256
    favicon = Image.new('RGBA', (lado, lado), (0, 0, 0, 0))
    mascara = Image.new('L', (lado, lado), 0)
    ImageDraw.Draw(mascara).rounded_rectangle((0, 0, lado - 1, lado - 1), radius=56, fill=255)
    favicon.paste((11, 11, 11, 255), (0, 0), mascara)
    alto = round(lado * 0.68)
    chico = simbolo.resize((round(simbolo.width * alto / simbolo.height), alto), Image.LANCZOS)
    favicon.alpha_composite(chico, ((lado - chico.width) // 2, (lado - alto) // 2))
    fv = ASSETS / 'favicon.png'
    favicon.save(fv, format='PNG', optimize=True)
    filas.append((fv, favicon.size))

    # En la pastilla se ve a 44 px de alto: 132 px es 3x y alcanza de sobra.
    # Servirlo a 196 era mandar cuatro veces los pixeles necesarios.
    alto_icono = 132
    simbolo = simbolo.resize(
        (round(simbolo.width * alto_icono / simbolo.height), alto_icono), Image.LANCZOS)
    for ruta, kw in ((ASSETS / 'dezeo-icono.webp', dict(format='WEBP', quality=92, method=6)),
                     (ASSETS / 'dezeo-icono.png', dict(format='PNG', optimize=True))):
        simbolo.save(ruta, **kw)
        filas.append((ruta, simbolo.size))

    # El logo lleva transparencia: webp con respaldo png.
    lw = ASSETS / 'dezeo-logo.webp'
    logo.save(lw, format='WEBP', quality=92, method=6)
    lp = ASSETS / 'dezeo-logo.png'
    logo.save(lp, format='PNG', optimize=True)
    filas += [(lw, logo.size), (lp, logo.size)]

    total = 0
    for ruta, tam in filas:
        kb = ruta.stat().st_size / 1024
        total += kb
        print(f'  {ruta.relative_to(RAIZ)!s:34} {tam[0]:5}x{tam[1]:<4} {kb:7.1f} KB')
    print(f'  {"total publicado":34} {"":10} {total:7.1f} KB')


if __name__ == '__main__':
    main()
