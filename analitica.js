// ----------------------------------------------------------------
// Google Analytics 4 para todo dezeo.lat, con consentimiento.
//
// Lo cargan todas las paginas con <script src="/analitica.js" async>.
//
//  - Europa (EEE), Reino Unido y Suiza: no se carga nada de Google hasta que
//    la persona acepta en el cartel. Se detecta por la zona horaria del
//    navegador; ademas Google recibe la lista de regiones con el consentimiento
//    negado por defecto, por si alguien de ahi tiene otra zona horaria.
//  - Resto del mundo: mide sin cartel.
//  - Con Global Privacy Control activado no se mide nunca.
//  - La eleccion queda en localStorage ("dz-analitica": granted / denied) y se
//    cambia desde /privacy/, que llama a window.dzAnalitica.elegir().
//  - Cada toque a un boton de App Store o Google Play manda "download_click"
//    con la app, la tienda y la pagina.
//
// Publicidad: todo lo de anuncios queda negado siempre. El sitio no tiene ads.
// ----------------------------------------------------------------
(function () {
  var ID = "G-50DQGD17SX";
  if (!/^G-[A-Z0-9]{6,}$/.test(ID)) return;

  var CLAVE = "dz-analitica";
  var REGIONES = ["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU",
    "IS", "IE", "IT", "LV", "LI", "LT", "LU", "MT", "NL", "NO", "PL", "PT", "RO", "SK", "SI",
    "ES", "SE", "GB", "CH"];

  function leer() {
    try { return localStorage.getItem(CLAVE); } catch (e) { return null; }
  }
  function guardar(v) {
    try { localStorage.setItem(CLAVE, v); } catch (e) {}
  }
  function europa() {
    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      return /^Europe\//.test(tz) ||
        /^(Atlantic\/(Canary|Madeira|Azores|Faroe|Reykjavik)|Arctic\/Longyearbyen)$/.test(tz);
    } catch (e) { return false; }
  }

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  var NEGADO = { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" };
  gtag("consent", "default", Object.assign({ analytics_storage: "denied", region: REGIONES, wait_for_update: 500 }, NEGADO));
  gtag("consent", "default", Object.assign({ analytics_storage: "granted" }, NEGADO));

  var gpc = navigator.globalPrivacyControl === true;
  var eleccion = gpc ? "denied" : leer();
  var pideCartel = !gpc && !eleccion && europa();
  var cargado = false;

  function cargar() {
    if (cargado) return;
    cargado = true;
    window.gtag = gtag;
    gtag("js", new Date());
    gtag("config", ID, { allow_google_signals: false, allow_ad_personalization_signals: false });
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + ID;
    document.head.appendChild(s);
  }

  function elegir(v) {
    guardar(v);
    gtag("consent", "update", { analytics_storage: v });
    if (v === "granted") cargar();
    var c = document.getElementById("dz-cartel");
    if (c) c.remove();
  }
  window.dzAnalitica = {
    elegir: elegir,
    estado: function () { return gpc ? "gpc" : (leer() || (europa() ? "pending" : "granted")); }
  };

  if (eleccion === "granted" || (!eleccion && !pideCartel)) {
    if (eleccion) gtag("consent", "update", { analytics_storage: "granted" });
    cargar();
  }

  // ---- toques a las tiendas ----
  document.addEventListener("click", function (e) {
    if (!cargado || !e.target.closest) return;
    var a = e.target.closest('a[href*="apps.apple.com"], a[href*="play.google.com"]');
    if (!a) return;
    var tienda = a.href.indexOf("play.google.com") >= 0 ? "google_play" : "app_store";
    var app = location.pathname.split("/")[1] || "dezeo";
    gtag("event", "download_click", { app: app, store: tienda, link_url: a.href, transport_type: "beacon" });
  }, true);

  // ---- cartel (solo Europa, sin eleccion guardada) ----
  if (!pideCartel) return;
  function mostrar() {
    if (document.getElementById("dz-cartel")) return;
    var c = document.createElement("div");
    c.id = "dz-cartel";
    c.setAttribute("role", "dialog");
    c.setAttribute("aria-label", "Cookies");
    c.innerHTML =
      '<p>We use Google Analytics cookies to see which pages are useful. Nothing is used for ads. ' +
      '<a href="/privacy/">Learn more</a></p>' +
      '<div><button type="button" data-v="denied">Decline</button>' +
      '<button type="button" data-v="granted">Accept</button></div>';
    var st = document.createElement("style");
    st.textContent =
      "#dz-cartel{position:fixed;left:16px;bottom:16px;z-index:2147483000;max-width:360px;box-sizing:border-box;" +
      "padding:16px 18px;border-radius:14px;background:#111114;color:#f4f4f7;border:1px solid #2a2a33;" +
      "box-shadow:0 12px 40px rgba(0,0,0,.35);font:14px/1.5 system-ui,-apple-system,'Segoe UI',sans-serif;text-align:left}" +
      "#dz-cartel p{margin:0 0 12px;color:#f4f4f7;font-size:14px}" +
      "#dz-cartel a{color:#b8ff00;text-decoration:underline}" +
      "#dz-cartel div{display:flex;gap:8px;justify-content:flex-end}" +
      "#dz-cartel button{font:600 14px/1 system-ui,-apple-system,sans-serif;padding:10px 16px;border-radius:999px;cursor:pointer;" +
      "border:1px solid #3a3a46;background:transparent;color:#f4f4f7}" +
      "#dz-cartel button[data-v=granted]{background:#b8ff00;border-color:#b8ff00;color:#0b0b0b}" +
      "@media (max-width:480px){#dz-cartel{left:12px;right:12px;bottom:12px;max-width:none}}";
    c.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("button[data-v]");
      if (b) elegir(b.getAttribute("data-v"));
    });
    document.head.appendChild(st);
    document.body.appendChild(c);
  }
  if (document.body) mostrar();
  else document.addEventListener("DOMContentLoaded", mostrar);
})();
