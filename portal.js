// ----------------------------------------------------------------
// La sala del portal, viva.
//
//  - La luz de la puerta "respira": un brillo que sube y baja muy despacio.
//  - Polvo en el haz: motas de luz que salen de la puerta y flotan.
//  - Parallax: la foto se corre unos pixeles con el puntero (solo con mouse).
//
// Todo se dibuja en un <canvas> encima de la foto y debajo del velo. La puerta
// esta medida sobre los pixeles de las dos fotos (horizontal y vertical) como
// fraccion del ancho y el alto; como la foto va con object-fit: cover, se
// calcula donde cae en pantalla cada vez que cambia el tamano.
// Con "reducir movimiento" no se carga nada.
// ----------------------------------------------------------------
(function () {
  var foto = document.querySelector(".portada-fondo");
  if (!foto) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var lienzo = document.createElement("canvas");
  var ctx = lienzo.getContext && lienzo.getContext("2d");
  if (!ctx) return;
  lienzo.className = "portal-luz";
  lienzo.setAttribute("aria-hidden", "true");
  (foto.closest("picture") || foto).insertAdjacentElement("afterend", lienzo);

  // [izquierda, arriba, derecha, abajo] del vano, en fraccion de la foto
  var PUERTA = { horizontal: [0.643, 0.376, 0.72, 0.734], vertical: [0.391, 0.375, 0.622, 0.737] };
  var conMouse = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  var W = 0, H = 0, dpr = 1, vano = null, motas = [], CANT = 0;
  var objX = 0, objY = 0, desX = 0, desY = 0;

  function medir() {
    W = window.innerWidth;
    H = foto.getBoundingClientRect().height || window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    lienzo.width = Math.round(W * dpr);
    lienzo.height = Math.round(H * dpr);
    lienzo.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var nw = foto.naturalWidth, nh = foto.naturalHeight;
    if (!nw || !nh) { vano = null; return; }
    var escala = Math.max(W / nw, H / nh);
    var rw = nw * escala, rh = nh * escala;
    var pos = getComputedStyle(foto).objectPosition.split(" ");
    var fx = parseFloat(pos[0]); fx = isNaN(fx) ? 0.5 : fx / 100;
    var fy = parseFloat(pos[1]); fy = isNaN(fy) ? 0.5 : fy / 100;
    var x0 = (W - rw) * fx, y0 = (H - rh) * fy;
    var d = nh > nw ? PUERTA.vertical : PUERTA.horizontal;
    vano = { x0: x0 + d[0] * rw, y0: y0 + d[1] * rh, x1: x0 + d[2] * rw, y1: y0 + d[3] * rh };
    vano.cx = (vano.x0 + vano.x1) / 2;
    vano.cy = (vano.y0 + vano.y1) / 2;
    vano.w = vano.x1 - vano.x0;
    vano.h = vano.y1 - vano.y0;
    CANT = W < 700 ? 34 : 64;
    while (motas.length < CANT) motas.push(nueva(true));
    motas.length = CANT;
  }

  function nueva(alAzar) {
    var m = {};
    if (!vano) return m;
    // nacen dentro del vano y salen hacia la sala, abriendose
    m.x = vano.x0 + Math.random() * vano.w;
    m.y = vano.y0 + Math.random() * vano.h;
    m.vx = (m.x - vano.cx) / vano.w * (14 + Math.random() * 22);
    m.vy = -2 - Math.random() * 6;
    m.r = 0.7 + Math.random() * 1.9;
    m.vida = alAzar ? Math.random() : 0;
    m.dura = 7 + Math.random() * 8;
    m.fase = Math.random() * 6.28;
    return m;
  }

  var ultimo = 0, pausa = false;
  function cuadro(t) {
    if (pausa) return;
    requestAnimationFrame(cuadro);
    var dt = ultimo ? Math.min(0.05, (t - ultimo) / 1000) : 0.016;
    ultimo = t;

    // parallax suave hacia el objetivo del puntero
    desX += (objX - desX) * Math.min(1, dt * 3);
    desY += (objY - desY) * Math.min(1, dt * 3);
    var mov = "translate3d(" + desX.toFixed(2) + "px," + desY.toFixed(2) + "px,0) scale(1.03)";
    foto.style.transform = mov;
    lienzo.style.transform = mov;

    ctx.clearRect(0, 0, W, H);
    if (!vano) return;

    // la puerta respira
    var s = t / 1000;
    var pulso = 0.5 + 0.5 * Math.sin(s * 0.9);
    var radio = vano.h * (0.85 + 0.12 * pulso);
    var g = ctx.createRadialGradient(vano.cx, vano.cy, vano.w * 0.2, vano.cx, vano.cy, radio);
    g.addColorStop(0, "rgba(200, 255, 80," + (0.10 + 0.08 * pulso).toFixed(3) + ")");
    g.addColorStop(1, "rgba(184, 255, 0, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(vano.cx - radio, vano.cy - radio, radio * 2, radio * 2);

    // polvo en el haz
    ctx.globalCompositeOperation = "lighter";
    for (var i = 0; i < motas.length; i++) {
      var m = motas[i];
      m.vida += dt / m.dura;
      if (m.vida >= 1 || m.x === undefined) { motas[i] = m = nueva(false); }
      m.x += (m.vx + Math.sin(s * 0.7 + m.fase) * 4) * dt;
      m.y += m.vy * dt;
      var a = Math.sin(Math.PI * m.vida) * (0.6 + 0.3 * Math.sin(s * 2 + m.fase));
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, 6.283);
      ctx.fillStyle = "rgba(225, 255, 160," + Math.max(0, a).toFixed(3) + ")";
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
  }

  if (conMouse) {
    window.addEventListener("pointermove", function (e) {
      objX = (e.clientX / W - 0.5) * -16;
      objY = (e.clientY / H - 0.5) * -10;
    }, { passive: true });
  }
  document.addEventListener("visibilitychange", function () {
    pausa = document.hidden;
    if (!pausa) { ultimo = 0; requestAnimationFrame(cuadro); }
  });
  window.addEventListener("resize", medir);

  // Al girar el telefono el <picture> puede cambiar de foto: se vuelve a medir.
  foto.addEventListener("load", medir);
  if (foto.complete && foto.naturalWidth) medir();
  requestAnimationFrame(cuadro);
})();
