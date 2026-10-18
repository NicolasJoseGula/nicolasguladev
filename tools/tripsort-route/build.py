# Builds the Trip Sort world route page (tripsort/route/) from the game itself:
#
#   python3 tools/tripsort-route/build.py
#
# Reads, from the Flutter game (~/Documents/TripSortDart):
#   lib/domain/game_data.dart   destinations in play order, and the landmarks
#   assets/map/route.json       where each stop sits on the game's map and how
#                               the trip leaves it (fly, sail, drive, rail)
#   assets/postcards, icons     postcards, landmark art and the vehicles
# and, from the design repo (~/Documents/TripSort):
#   docs/route-stops.json       chapters and real coordinates
#   assets/web/worldmap.js      the game's world map (land and borders)
#
# Writes tripsort/route/index.html, map.json and the images in img/.
# A destination without a place on the map stops the build.
import html
import json
import os
import re
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(SITE, 'tripsort/route')
GAME = os.path.expanduser('~/Documents/TripSortDart')
DESIGN = os.path.expanduser('~/Documents/TripSort')
LEVELS = 12
W, H = 2048, 1588

# ---------- Game data ----------
src = open(os.path.join(GAME, 'lib/domain/game_data.dart'), encoding='utf-8').read()
S = r'"((?:[^"\\]|\\.)*)"'
unq = lambda s: s.replace('\\"', '"').replace("\\'", "'")
start = src.index('const kDestinations')
block = src[start:src.index('];', start)]
dests = [tuple(map(unq, m)) for m in re.findall(rf'Destination\({S}, {S}, {S}\)', block)]
if len(dests) != block.count('Destination('):
    sys.exit('Could not read every destination in game_data.dart')
landmarks = [tuple(map(unq, m)) for m in re.findall(rf'Landmark\({S}, {S}, {S}, {S}, {S}, {S}\)', src)]

route = json.load(open(os.path.join(GAME, 'assets/map/route.json'), encoding='utf-8'))
geo = json.load(open(os.path.join(DESIGN, 'docs/route-stops.json'), encoding='utf-8'))
missing = [d[0] for d in dests if d[0] not in route['stops'] or d[0] not in geo['stops']]
if missing:
    sys.exit('No place on the map for: ' + ', '.join(missing))

slug = lambda s: re.sub(r'[^a-z0-9]+', '_', s.lower()).strip('_')
ch_order = []
for d in dests:
    c = geo['stops'][d[0]]['ch']
    if c not in ch_order:
        ch_order.append(c)
chapters = []
for c in ch_order:
    en = geo['chapters'][c]
    chapters.append({'en': en})

lm_by_place = {l[4]: l for l in landmarks}
stops = []
for i, (sid, city, country) in enumerate(dests):
    x, y, mode = route['stops'][sid]
    g = geo['stops'][sid]
    s = {'n': i + 1, 'id': sid, 'en': city, 'cen': country,
         'x': x, 'y': y, 'm': mode, 'ch': ch_order.index(g['ch']), 'lat': g['lat'], 'lon': g['lon']}
    if sid in lm_by_place:
        s['lm'] = lm_by_place[sid][0]
    stops.append(s)
seen = []
for s in stops:
    if not seen or seen[-1] != s['ch']:
        if s['ch'] in seen:
            sys.exit(f"Chapter {chapters[s['ch']]['en']} is split at {s['en']}")
        seen.append(s['ch'])
# The last stop's mode is the way home; there is no leg after it.
legs = {m: 0 for m in ('fly', 'sail', 'drive', 'rail')}
for s in stops[:-1]:
    legs[s['m']] += 1
countries = len({s['cen'] for s in stops})

# ---------- The world map, simplified ----------
def rings(d):
    out, cur = [], None
    for cmd, body in re.findall(r'([MLZ])([^MLZ]*)', d):
        if cmd == 'Z':
            continue
        x, y = map(float, body.split(','))
        if cmd == 'M':
            cur = []
            out.append(cur)
        cur.append((x, y))
    return [r for r in out if len(r) >= 2]

def simplify(pts, tol):
    if len(pts) < 3:
        return pts
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop()
        (ax, ay), (bx, by) = pts[a], pts[b]
        dx, dy = bx - ax, by - ay
        L = (dx * dx + dy * dy) ** .5 or 1e-9
        far, fi = -1, -1
        for i in range(a + 1, b):
            px, py = pts[i]
            dd = abs(dy * (px - ax) - dx * (py - ay)) / L
            if dd > far:
                far, fi = dd, i
        if far > tol:
            keep[fi] = True
            stack += [(a, fi), (fi, b)]
    return [p for p, k in zip(pts, keep) if k]

def pack(rs, tol, closed):
    out = []
    for r in rs:
        r = simplify(r, tol)
        if closed and len(r) < 4:
            continue
        xs, ys = [p[0] for p in r], [p[1] for p in r]
        if closed and (max(xs) - min(xs)) * (max(ys) - min(ys)) < .02:
            continue
        f = lambda v: ('%.1f' % v).rstrip('0').rstrip('.')
        d = 'M' + 'L'.join(f'{f(x)},{f(y)}' for x, y in r) + ('Z' if closed else '')
        out.append([round(min(xs), 1), round(min(ys), 1), round(max(xs), 1), round(max(ys), 1), d])
    return out

wm = open(os.path.join(DESIGN, 'assets/web/worldmap.js'), encoding='utf-8').read()
world = json.loads(wm[wm.index('{'):wm.rindex('}') + 1])
land_rings, border_rings = rings(world['land']), rings(world['borders'])
mapdata = {'w': W, 'h': H, 'land': pack(land_rings, .12, True), 'borders': pack(border_rings, .2, False)}
os.makedirs(OUT, exist_ok=True)
json.dump(mapdata, open(os.path.join(OUT, 'map.json'), 'w'), separators=(',', ':'))

# ---------- Images ----------
IMG = os.path.join(OUT, 'img')
for sub in ('pc', 'lm', 'v'):
    os.makedirs(os.path.join(IMG, sub), exist_ok=True)

def save(src_path, dst, size, quality=74):
    if os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src_path):
        return
    im = Image.open(src_path).convert('RGBA')
    im.thumbnail(size, Image.LANCZOS)
    im.save(dst, 'WEBP', quality=quality, method=6)

for s in stops:
    save(os.path.join(GAME, f"assets/postcards/{s['id']}.webp"), os.path.join(IMG, 'pc', f"{s['id']}.webp"), (300, 400), 70)
HERO = ['montevideo', 'kyoto', 'paris', 'giza', 'rio']
for sid in HERO:
    save(os.path.join(GAME, f'assets/postcards/{sid}.webp'), os.path.join(IMG, 'pc', f'{sid}-l.webp'), (480, 640), 78)
for l in landmarks:
    save(os.path.join(GAME, f'assets/icons/{l[0]}.webp'), os.path.join(IMG, 'lm', f'{l[0]}.webp'), (220, 220), 80)
VEH = {'fly': 'airplane', 'sail': 'ferry', 'drive': 'busamarillo', 'rail': 'train'}
for m, name in VEH.items():
    save(os.path.join(GAME, f'assets/icons/{name}.webp'), os.path.join(IMG, 'v', f'{m}.webp'), (160, 160), 85)

# The social card: the game's map with the whole route and the title.
def og_image():
    sx = 1200 / W
    oy = 330 * sx   # crop the far north
    im = Image.new('RGB', (1200, 630), (108, 198, 238))
    dr = ImageDraw.Draw(im)
    for r in land_rings:
        pts = [(x * sx, y * sx - oy) for x, y in r]
        if len(pts) >= 3:
            dr.polygon(pts, fill=(191, 227, 138), outline=(125, 178, 85))
    for r in border_rings:
        dr.line([(x * sx, y * sx - oy) for x, y in r], fill=(147, 191, 107), width=1)
    # Route dots, unwrapped across the date line, drawn on both copies.
    ux = []
    for s in stops:
        x = s['x']
        if ux:
            while x - ux[-1] > W / 2: x -= W
            while ux[-1] - x > W / 2: x += W
        ux.append(x)
    shade = Image.new('RGBA', im.size, (0, 0, 0, 0))
    dots = ImageDraw.Draw(shade)
    for off in (-W, 0, W):
        for i in range(1, len(stops)):
            ax, ay, bx, by = (ux[i - 1] + off) * sx, stops[i - 1]['y'] * sx - oy, (ux[i] + off) * sx, stops[i]['y'] * sx - oy
            L = max(1, ((bx - ax) ** 2 + (by - ay) ** 2) ** .5)
            k = 0.0
            while k < L:
                px, py = ax + (bx - ax) * k / L, ay + (by - ay) * k / L
                dots.ellipse([px - 1.6, py - 1.6 + 1, px + 1.6, py + 1.6 + 1], fill=(20, 30, 70, 90))
                dots.ellipse([px - 1.6, py - 1.6, px + 1.6, py + 1.6], fill=(255, 255, 255, 240))
                k += 7
    im.paste(shade, (0, 0), shade)
    dr = ImageDraw.Draw(im)
    first, last = stops[0], stops[-1]
    for s, col in ((first, (232, 65, 47)), (last, (255, 197, 49))):
        px, py = s['x'] * sx, s['y'] * sx - oy
        dr.ellipse([px - 8, py - 8, px + 8, py + 8], fill=col, outline=(255, 255, 255), width=3)
    # Title plate, top left over the North Pacific, where the route is thin.
    font = os.path.join(GAME, 'assets/fonts/Fredoka-Bold.ttf')
    f1, f2 = ImageFont.truetype(font, 58), ImageFont.truetype(os.path.join(GAME, 'assets/fonts/Fredoka-SemiBold.ttf'), 27)
    plate = Image.new('RGBA', im.size, (0, 0, 0, 0))
    ImageDraw.Draw(plate).rounded_rectangle([28, 26, 700, 176], 28, fill=(18, 22, 48, 215))
    im.paste(plate, (0, 0), plate)
    icon = Image.open(os.path.join(SITE, 'tripsort/assets/img/tripsort-icon.png')).convert('RGBA').resize((106, 106), Image.LANCZOS)
    mask = Image.new('L', icon.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, 105, 105], 24, fill=255)
    im.paste(icon, (50, 48), mask)
    dr = ImageDraw.Draw(im)
    dr.text((176, 44), 'Around the world', font=f1, fill=(255, 255, 255))
    dr.text((178, 120), f'Trip Sort · {len(stops)} stops · {len(stops) * LEVELS:,} levels', font=f2, fill=(255, 197, 49))
    im.save(os.path.join(IMG, 'og-route.jpg'), 'JPEG', quality=86, optimize=True)

og_image()

# ---------- Page ----------
e = html.escape
def L(en):
    # Solo ingles. Cada texto queda en su <span>, como cuando venia en par
    # con el espanol: ".stamp span" y otras reglas del template lo esperan.
    return f'<span>{en}</span>'
fmt = lambda n: f'{n:,}'
lv = lambda s: ((s['n'] - 1) * LEVELS + 1, s['n'] * LEVELS)

cards = []
for c, ch in enumerate(chapters):
    ss = [s for s in stops if s['ch'] == c]
    a, b = ss[0], ss[-1]
    pick = [ss[0]] + ss[1:-1][::max(1, (len(ss) - 2) // 2)][:2] + ([ss[-1]] if len(ss) > 1 else [])
    fan = ''.join(f'<img src="img/pc/{s["id"]}.webp" width="300" height="400" loading="lazy" alt="{e(s["en"])} postcard">' for s in pick[:4])
    items = ''.join(
        f'<li><button type="button" data-stop="{s["n"]}"><span class="no">{s["n"]}</span>'
        f'<span class="nm">{L(e(s["en"]))}<small>{L(e(s["cen"]))}</small></span>'
        f'<span class="lv">{fmt(lv(s)[0])}–{fmt(lv(s)[1])}</span></button></li>' for s in ss)
    cards.append(f'''<article class="chapter" id="ch-{c + 1}">
  <div class="fan">{fan}</div>
  <div class="ch-body">
    <p class="ch-no">{L('Chapter')} {c + 1}</p>
    <h3>{L(e(ch['en']))}</h3>
    <p class="ch-meta">{L(f'{len(ss)} stops')} · {L('levels')} {fmt(lv(a)[0])}–{fmt(lv(b)[1])}</p>
    <p class="ch-ends">{L(e(a['en']))} → {L(e(b['en']))}</p>
    <div class="ch-actions"><button type="button" class="chip" data-chapter="{c}">{L('Show on the map')}</button></div>
    <details><summary>{L(f'All {len(ss)} stops')}</summary><ol class="stoplist">{items}</ol></details>
  </div>
</article>''')

lm_cards = []
stop_of = {s['id']: s for s in stops}
for l in sorted(landmarks, key=lambda l: stop_of[l[4]]['n']):
    s = stop_of[l[4]]
    lm_cards.append(f'''<article class="lm">
  <img src="img/lm/{l[0]}.webp" width="220" height="220" loading="lazy" alt="{e(l[1])} in Trip Sort">
  <div>
    <p class="lm-stop">{L('Stop')} {s['n']} · {L(e(s['en']))}</p>
    <h3>{L(e(l[1]))}</h3>
    <p>{L(e(l[5]))}</p>
    <button type="button" class="chip" data-stop="{s['n']}">{L('Find it on the route')}</button>
  </div>
</article>''')

vehicles = ''.join(f'''<div class="veh"><img src="img/v/{m}.webp" width="160" height="160" loading="lazy" alt="">
  <b>{legs[m]}</b><span>{L({'fly': 'flights', 'sail': 'ferry crossings', 'drive': 'bus rides', 'rail': 'train rides'}[m])}</span></div>'''
                   for m in ('fly', 'drive', 'rail', 'sail'))

options = ''.join(f'<option value="{e(s["en"])}, {e(s["cen"])}"></option>' for s in stops)
hero_fan = ''.join(f'<img src="img/pc/{sid}-l.webp" width="480" height="640" alt="Trip Sort postcard of {e(next(s["en"] for s in stops if s["id"] == sid))}">' for sid in HERO)

first, last = stops[0], stops[-1]
data = {'chapters': chapters, 'stops': [{k: v for k, v in s.items() if k not in ('lat', 'lon')} for s in stops],
        'landmarks': {l[0]: {'en': l[1]} for l in landmarks}}
itemlist = {'@context': 'https://schema.org', '@type': 'ItemList', 'name': 'Trip Sort world route',
            'numberOfItems': len(stops), 'itemListOrder': 'https://schema.org/ItemListOrderAscending',
            'itemListElement': [{'@type': 'ListItem', 'position': s['n'],
                                 'item': {'@type': 'Place', 'name': f"{s['en']}, {s['cen']}",
                                          'geo': {'@type': 'GeoCoordinates', 'latitude': s['lat'], 'longitude': s['lon']}}}
                                for s in stops]}

page = open(os.path.join(HERE, 'template.html'), encoding='utf-8').read()
for k, v in {
    '__DATA__': json.dumps(data, ensure_ascii=False, separators=(',', ':')),
    '__ITEMLIST__': json.dumps(itemlist, ensure_ascii=False, separators=(',', ':')),
    '__CHAPTERS__': '\n'.join(cards),
    '__LANDMARKS__': '\n'.join(lm_cards),
    '__VEHICLES__': vehicles,
    '__OPTIONS_EN__': options,
    '__HERO_FAN__': hero_fan,
    '__N_STOPS__': str(len(stops)),
    '__N_CHAPTERS__': str(len(chapters)),
    '__N_LEVELS__': fmt(len(stops) * LEVELS),
    '__N_LANDMARKS__': str(len(landmarks)),
    '__N_COUNTRIES__': str(countries),
    '__N_LEGS__': str(len(stops) - 1),
    '__FIRST_EN__': first['en'],
    '__LAST_EN__': f"{last['en']} ({last['cen']})",
}.items():
    page = page.replace(k, v)
left = re.findall(r'__[A-Z_]+__', page)
if left:
    sys.exit('Unfilled placeholders: ' + ', '.join(sorted(set(left))))
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(page)
size = lambda p: os.path.getsize(os.path.join(OUT, p)) // 1024
print(f"{len(stops)} stops, {len(chapters)} chapters, {len(landmarks)} landmarks, {countries} countries; legs {legs}")
print(f"index.html {size('index.html')} KB, map.json {size('map.json')} KB")
