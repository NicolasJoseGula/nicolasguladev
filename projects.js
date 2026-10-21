// ----------------------------------------------------------------
// Movimiento de Work.
//
// Las filas de la vitrina ya vienen en el HTML: las escribe tools/construir.py
// a partir de projects.json. Para agregar o cambiar un proyecto: projects.json.
//
// Aca solo queda lo que de verdad necesita JavaScript:
//  - revelar lo marcado con data-reveal a medida que entra en pantalla;
//  - un parallax suave de las imagenes de la vitrina mientras se hace scroll;
//  - una luz que sigue al puntero sobre cada imagen.
// El <head> pone la clase .projects-anim en <html> antes de pintar (salvo con
// "reducir movimiento"); sin JavaScript esa clase no existe y todo se ve.
// ----------------------------------------------------------------
(function () {
  var root = document.documentElement;
  if (!root.classList.contains("projects-anim")) return;

  // ---- aparicion ----
  var piezas = [].slice.call(document.querySelectorAll("[data-reveal]"));
  if (!("IntersectionObserver" in window)) {
    piezas.forEach(function (p) { p.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entradas) {
      var demora = 0;
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        // Las que entran juntas (las tres tarjetas de valores) se escalonan.
        setTimeout(function () { el.classList.add("in"); }, demora);
        demora += 110;
        io.unobserve(el);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
    piezas.forEach(function (p) { io.observe(p); });
  }

  // ---- parallax de las imagenes ----
  var marcos = [].slice.call(document.querySelectorAll(".show-frame"));
  var pedido = 0;
  function mover() {
    pedido = 0;
    var alto = window.innerHeight;
    for (var i = 0; i < marcos.length; i++) {
      var r = marcos[i].getBoundingClientRect();
      if (r.bottom < -100 || r.top > alto + 100) continue;
      // -1 cuando la imagen entra por abajo, +1 cuando sale por arriba
      var t = ((r.top + r.height / 2) - alto / 2) / (alto / 2 + r.height / 2);
      marcos[i].style.setProperty("--py", (t * -18).toFixed(1) + "px");
    }
  }
  function pedir() { if (!pedido) pedido = requestAnimationFrame(mover); }
  if (marcos.length) {
    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", pedir);
    mover();
  }

  // ---- luz que sigue al puntero ----
  if (window.matchMedia("(hover: hover)").matches) {
    marcos.forEach(function (m) {
      m.addEventListener("pointermove", function (e) {
        var r = m.getBoundingClientRect();
        m.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100).toFixed(1) + "%");
        m.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%");
      });
    });
  }
})();
