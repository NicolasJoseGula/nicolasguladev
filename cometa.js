// ----------------------------------------------------------------
// El cursor es un cometa.
//
// Una cabeza de luz verde, una estela que se estira con la velocidad y se
// recoge cuando el puntero se frena, y particulas que se desprenden, flotan
// sin gravedad y se apagan titilando. Todo en un <canvas> encima de la pagina.
//
// Detalles que importan:
//  - Solo con puntero fino (mouse o trackpad). En pantallas tactiles no hay
//    nada que seguir.
//  - La clase que esconde el cursor del sistema la pone este script: si no
//    corre, queda la flecha de siempre.
//  - El bucle se detiene solo cuando no queda nada en movimiento, para no
//    gastar bateria con el puntero quieto.
//  - Con "reducir movimiento" no hay estela ni particulas: solo la luz, pegada
//    al puntero.
//  - Las luces se pintan una vez en un sprite y despues solo se copian:
//    shadowBlur por particula es lo que vuelve lento a un efecto asi.
// ----------------------------------------------------------------
(function () {
  var fino = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)");
  if (!fino || !fino.matches) return;

  var lienzo = document.createElement("canvas");
  var ctx = lienzo.getContext && lienzo.getContext("2d");
  if (!ctx) return;
  lienzo.className = "cometa";
  lienzo.setAttribute("aria-hidden", "true");
  document.body.appendChild(lienzo);
  document.body.classList.add("cometa-activo");

  var quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var VIDA_ESTELA = 260;   // ms que tarda un punto de la estela en apagarse
  var MAX_PARTICULAS = 260;

  // ---- sprites de luz ----
  function sprite(centro, medio) {
    var c = document.createElement("canvas");
    c.width = c.height = 64;
    var g = c.getContext("2d");
    var r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, centro);
    r.addColorStop(0.22, medio);
    r.addColorStop(1, "rgba(184, 255, 0, 0)");
    g.fillStyle = r;
    g.fillRect(0, 0, 64, 64);
    return c;
  }
  var luz = sprite("rgba(236, 255, 180, 1)", "rgba(184, 255, 0, 0.55)");
  var chispa = sprite("rgba(255, 255, 255, 1)", "rgba(214, 255, 120, 0.6)");

  // ---- estado ----
  var dpr = 1, ancho = 0, alto = 0;
  var px = 0, py = 0;          // puntero
  var cx = 0, cy = 0;          // cabeza del cometa
  var estela = [];             // {x, y, t}
  var particulas = [];
  var sobreEnlace = false;
  var escala = 1;              // tamano animado de la cabeza
  var visible = false;
  var pedido = 0, ultimo = 0;

  function medir() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    ancho = window.innerWidth;
    alto = window.innerHeight;
    lienzo.width = Math.round(ancho * dpr);
    lienzo.height = Math.round(alto * dpr);
    lienzo.style.width = ancho + "px";
    lienzo.style.height = alto + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    pedir();
  }

  function pedir() {
    if (!pedido) pedido = requestAnimationFrame(cuadro);
  }

  function soltar(x, y, vx, vy, vidaMin, vidaMax) {
    if (particulas.length >= MAX_PARTICULAS) particulas.shift();
    particulas.push({
      x: x, y: y, vx: vx, vy: vy,
      vida: 1,
      dura: vidaMin + Math.random() * (vidaMax - vidaMin),
      tam: 0.7 + Math.random() * 1.9,
      blanca: Math.random() < 0.24,
      fase: Math.random() * 6.283,
      titila: 5 + Math.random() * 9
    });
  }

  // Polvo que se desprende a lo largo del tramo recorrido en este cuadro
  function desprender(x0, y0, x1, y1, dist, dt) {
    var ux = (x1 - x0) / dist, uy = (y1 - y0) / dist;
    var rapidez = Math.min(dist / Math.max(dt, 0.001), 2600);
    var cuantas = Math.min(8, dist / 5.5);
    var n = Math.floor(cuantas) + (Math.random() < cuantas % 1 ? 1 : 0);
    for (var i = 0; i < n; i++) {
      var t = Math.random();
      var ang = Math.random() * 6.283;
      var deriva = 10 + Math.random() * 34;
      soltar(
        x0 + (x1 - x0) * t + (Math.random() - 0.5) * 3,
        y0 + (y1 - y0) * t + (Math.random() - 0.5) * 3,
        -ux * rapidez * 0.06 + Math.cos(ang) * deriva,
        -uy * rapidez * 0.06 + Math.sin(ang) * deriva,
        0.55, 1.45
      );
    }
  }

  function cuadro(ahora) {
    pedido = 0;
    var dt = ultimo ? Math.min(0.05, (ahora - ultimo) / 1000) : 1 / 60;
    ultimo = ahora;

    // Seguimiento independiente de los fps: la cabeza arrastra un poco.
    var k = quieto ? 1 : 1 - Math.pow(0.00035, dt);
    var ox = cx, oy = cy;
    cx += (px - cx) * k;
    cy += (py - cy) * k;
    var mx = cx - ox, my = cy - oy;
    var dist = Math.sqrt(mx * mx + my * my);

    var objetivo = sobreEnlace ? 1.75 : 1;
    escala += (objetivo - escala) * Math.min(1, dt * 12);

    if (!quieto) {
      if (dist > 0.3 || !estela.length) estela.push({ x: cx, y: cy, t: ahora });
      while (estela.length && ahora - estela[0].t > VIDA_ESTELA) estela.shift();
      if (dist > 0.6) desprender(ox, oy, cx, cy, dist, dt);

      var freno = Math.pow(0.16, dt);   // sin gravedad: solo se frenan
      for (var j = particulas.length - 1; j >= 0; j--) {
        var p = particulas[j];
        p.vida -= dt / p.dura;
        if (p.vida <= 0) { particulas.splice(j, 1); continue; }
        p.vx *= freno;
        p.vy *= freno;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
    }

    dibujar(ahora);

    var sigue = visible && !quieto && (
      estela.length > 1 || particulas.length ||
      Math.abs(px - cx) > 0.2 || Math.abs(py - cy) > 0.2 ||
      Math.abs(escala - objetivo) > 0.01
    );
    if (sigue) pedir();
    else ultimo = 0;
  }

  // Catmull-Rom: con el mouse rapido los puntos quedan a 20-30 px y la cinta
  // salia quebrada. Se intercalan puntos intermedios sobre una curva suave.
  function suavizar(pts) {
    if (pts.length < 3) return pts;
    var salida = [];
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (var s = 0; s < 4; s++) {
        var u = s / 4, u2 = u * u, u3 = u2 * u;
        salida.push({
          x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * u + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * u2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * u3),
          y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * u + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * u2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * u3)
        });
      }
    }
    salida.push(pts[pts.length - 1]);
    return salida;
  }

  // Una cinta rellena: ancho cero en la cola, anchoMax en la cabeza, con un
  // degradado de color a lo largo.
  function cinta(pts, anchoMax, colorCola, colorCabeza) {
    var n = pts.length;
    var cola = pts[0], cabeza = pts[n - 1];
    var dx = cabeza.x - cola.x, dy = cabeza.y - cola.y;
    if (dx * dx + dy * dy < 1) return;
    var izq = [], der = [];
    for (var i = 0; i < n; i++) {
      var a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      var tx = b.x - a.x, ty = b.y - a.y;
      var largo = Math.sqrt(tx * tx + ty * ty) || 1;
      var nx = -ty / largo, ny = tx / largo;
      var w = anchoMax * Math.pow(i / (n - 1), 1.5) / 2;
      izq.push(pts[i].x + nx * w, pts[i].y + ny * w);
      der.push(pts[i].x - nx * w, pts[i].y - ny * w);
    }
    ctx.beginPath();
    ctx.moveTo(izq[0], izq[1]);
    for (i = 2; i < izq.length; i += 2) ctx.lineTo(izq[i], izq[i + 1]);
    for (i = der.length - 2; i >= 0; i -= 2) ctx.lineTo(der[i], der[i + 1]);
    ctx.closePath();
    var g = ctx.createLinearGradient(cola.x, cola.y, cabeza.x, cabeza.y);
    g.addColorStop(0, colorCola);
    g.addColorStop(1, colorCabeza);
    ctx.fillStyle = g;
    ctx.fill();
  }

  function estampar(pts) {
    var n = pts.length, total = 0, largos = [0], i;
    for (i = 1; i < n; i++) {
      var ex = pts[i].x - pts[i - 1].x, ey = pts[i].y - pts[i - 1].y;
      total += Math.sqrt(ex * ex + ey * ey);
      largos.push(total);
    }
    if (total < 1) return;
    var j = 1;
    for (var d = 0; d <= total; d += 3) {
      while (j < n - 1 && largos[j] < d) j++;
      var a = pts[j - 1], b = pts[j];
      var u = (d - largos[j - 1]) / ((largos[j] - largos[j - 1]) || 1);
      var x = a.x + (b.x - a.x) * u, y = a.y + (b.y - a.y) * u;
      var f = d / total;                                 // 0 cola, 1 cabeza
      var r = (2.5 + 19 * Math.pow(f, 1.6)) * escala;
      ctx.globalAlpha = 0.07 * f;
      ctx.drawImage(luz, x - r, y - r, r * 2, r * 2);
    }
    ctx.globalAlpha = 1;
  }

  function dibujar(ahora) {
    ctx.clearRect(0, 0, ancho, alto);
    if (!visible) return;
    ctx.globalCompositeOperation = "lighter";

    // Estela: una cinta continua que se afina hacia la cola. Dibujarla como
    // tramos sueltos con tapa redonda dejaba una hilera de perlas, porque las
    // tapas se superponen y la luz se suma justo ahi.
    if (estela.length > 1) {
      var curva = suavizar(estela);
      // El halo no puede ser una cinta: un poligono ancho tiene bordes duros y
      // queda una cuna, como un reflector. Se estampa luz difusa a lo largo de
      // la curva, que se abre de a poco hacia la cabeza.
      estampar(curva);
      cinta(curva, 4 * escala, "rgba(220, 255, 140, 0)", "rgba(246, 255, 214, 0.9)");
    }

    // Particulas: se achican y titilan mientras se apagan
    var s = ahora / 1000;
    for (var j = 0; j < particulas.length; j++) {
      var p = particulas[j];
      var brillo = 0.6 + 0.4 * Math.sin(s * p.titila + p.fase);
      var r = p.tam * (0.5 + 0.5 * p.vida) * 3.2;
      ctx.globalAlpha = Math.max(0, p.vida * brillo);
      ctx.drawImage(p.blanca ? chispa : luz, p.x - r, p.y - r, r * 2, r * 2);
    }

    // Cabeza: resplandor amplio, coma y punto blanco
    ctx.globalAlpha = 0.32;
    var R = 44 * escala;
    ctx.drawImage(luz, cx - R, cy - R, R * 2, R * 2);
    ctx.globalAlpha = 0.95;
    R = 12 * escala;
    ctx.drawImage(luz, cx - R, cy - R, R * 2, R * 2);
    ctx.globalAlpha = 1;
    R = 4.6 * escala;
    ctx.drawImage(chispa, cx - R, cy - R, R * 2, R * 2);

    // Aro oscuro finito: no se nota sobre la sala, pero es lo que deja ver la
    // cabeza cuando pasa por encima del boton lima.
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, 5.2 * escala, 0, 6.283);
    ctx.strokeStyle = "rgba(11, 11, 11, 0.45)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  function tocable(nodo) {
    return !!(nodo && nodo.closest && nodo.closest('a, button, [role="button"], summary'));
  }

  window.addEventListener("pointermove", function (e) {
    if (e.pointerType && e.pointerType !== "mouse") return;
    px = e.clientX;
    py = e.clientY;
    if (!visible) {
      visible = true;
      cx = px;
      cy = py;
      estela.length = 0;
    }
    sobreEnlace = tocable(e.target);
    pedir();
  }, { passive: true });

  // Un click suelta un estallido de polvo hacia todos lados
  window.addEventListener("pointerdown", function (e) {
    if (quieto || (e.pointerType && e.pointerType !== "mouse")) return;
    for (var i = 0; i < 22; i++) {
      var ang = (i / 22) * 6.283 + Math.random() * 0.3;
      var v = 70 + Math.random() * 150;
      soltar(cx, cy, Math.cos(ang) * v, Math.sin(ang) * v, 0.45, 1.1);
    }
    pedir();
  }, { passive: true });

  function apagar() {
    visible = false;
    estela.length = 0;
    particulas.length = 0;
    ctx.clearRect(0, 0, ancho, alto);
  }
  document.addEventListener("mouseleave", apagar);
  window.addEventListener("blur", apagar);
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) apagar();
  });
  window.addEventListener("resize", medir);

  medir();
})();
