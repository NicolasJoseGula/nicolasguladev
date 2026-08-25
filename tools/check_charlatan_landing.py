#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Audita la landing de Charlatan: traducciones alineadas y demo completo.

Las traducciones viven en assets/js/charlatan-i18n.js como listas alineadas
POR ORDEN DE DOCUMENTO con los spans data-lang="es" de index.html. Ese
acoplamiento es la fragilidad del diseño: si alguien agrega o quita un span,
todos los idiomas se corren un lugar y el error es texto de otra sección en
perfecto japonés. Este script existe para que eso no llegue a publicarse:
corrélo después de cualquier edición de index.html.
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..", "charlatan")
html = open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
js = open(os.path.join(ROOT, "assets/js/charlatan-i18n.js"), encoding="utf-8").read()

es_spans = len(re.findall(r'<span\s+data-lang="es"', html))
en_spans = len(re.findall(r'<span\s+data-lang="en"', html))

i18n = json.loads(re.search(r"window\.CH_I18N = (\{.*?\});\n", js, re.S).group(1))
cues = json.loads(re.search(r"window\.CH_CUES = (\{.*?\});\n", js, re.S).group(1))

problems = []
if es_spans != en_spans:
    problems.append(f"spans desparejos: {en_spans} en vs {es_spans} es")
for lang, rows in sorted(i18n.items()):
    if len(rows) != es_spans:
        problems.append(f"{lang}: {len(rows)} textos, el HTML tiene {es_spans} spans es")
    for i, needle in ((7, 'class="accent"'), (144, "<br>"), (148, 'href="/guardianreader/"')):
        if i < len(rows) and needle not in rows[i]:
            problems.append(f"{lang}[{i}]: perdió {needle}")

for code, rows in sorted(cues.items()):
    for name in (f"demo-{code}.mp4", f"demo-{code}.jpg"):
        path = os.path.join(ROOT, "assets/video", name)
        if not os.path.exists(path):
            problems.append(f"falta {name}")
        elif name.endswith(".mp4") and os.path.getsize(path) > 2_500_000:
            problems.append(f"{name} pesa {os.path.getsize(path)//1024} KB — ¿es el archivo correcto?")
    if not rows:
        problems.append(f"cues vacíos para {code}")

expected = {"pt-BR","pt-PT","it","fr","de","ja","ko","zh-Hans","zh-Hant"}
if set(i18n) != expected:
    problems.append(f"idiomas: {sorted(i18n)} — se esperaban {sorted(expected)}")

if problems:
    print("PROBLEMAS:"); [print(" -", p) for p in problems]; sys.exit(1)
print(f"ok: {len(i18n)} idiomas × {es_spans} textos · {len(cues)} demos con video y póster")
