// ----------------------------------------------------------------
// Animacion de entrada de las tarjetas de Work.
//
// Las tarjetas ya vienen en el HTML: las escribe tools/construir.py a partir
// de projects.json. Antes las armaba este archivo en el navegador, y eso
// dejaba la grilla vacia para cualquiera que leyera el HTML sin ejecutar
// JavaScript: buscadores sin renderizado y extractores de IA veian "Work" y
// nada mas. Para agregar o cambiar un proyecto: projects.json.
//
// Aca solo queda lo que de verdad necesita JavaScript: revelar las tarjetas a
// medida que entran en pantalla. El <head> pone la clase .projects-anim en
// <html> antes de pintar, asi que no hay parpadeo; sin JavaScript esa clase no
// existe y las tarjetas se ven desde el principio.
// ----------------------------------------------------------------
(function () {
  var root = document.documentElement;
  if (!root.classList.contains("projects-anim")) return;

  var cards = [].slice.call(document.querySelectorAll("#projectGrid .card"));
  if (!cards.length) return;

  if (!("IntersectionObserver" in window)) {
    cards.forEach(function (c) { c.classList.add("in"); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    var delay = 0;
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var el = entry.target;
        // Las que entran juntas (la primera pantalla, por ejemplo) se escalonan.
        setTimeout(function () { el.classList.add("in"); }, delay);
        delay += 80;
        io.unobserve(el);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

  cards.forEach(function (c) { io.observe(c); });
})();
