# Originales

Los archivos grandes de los que salen las imágenes que sirve el sitio. No los
pide ninguna página: están acá para poder volver a generar las versiones
livianas con `tools/optimizar-assets.py`, que busca primero en esta carpeta.

`dezeologo.png` y `dezeologo.jpg` se quedaron en `assets/` a propósito: fueron
la imagen de Open Graph antes de la marca nueva y puede haber links viejos
apuntando a esas URLs. Ya no se regeneran.

`neon-portal.png` (la lámina con el logo) y `neon-portal-fondo.jpg` (la sala sin
logo) son la marca nueva: de ahí salen el logo, el símbolo, el favicon y la
portada con `tools/portal-assets.py`.
