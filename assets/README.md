# assets

Los archivos que sirve el sitio salen de acá. **No agregues imágenes sueltas
en esta carpeta**: poné el original en `originales/` y corré

```
python3 tools/optimizar-assets.py
```

que genera las versiones chicas (`.webp` con respaldo `.jpg`) al tamaño en que
se ven de verdad. El original de 1600 px no se publica: la tarjeta lo muestra a
340 px y descargarlo entero era lo que hacía lenta la página.

Proporción recomendada para las tarjetas de proyecto: 16:10.

`fonts/` tiene Space Grotesk e Inter servidas desde este dominio, con su
licencia en `fonts/OFL.txt`.
