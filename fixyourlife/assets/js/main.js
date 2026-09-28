// Fix Your Life landing: scroll reveal and the self-filling year grids.
// Everything here is progressive: without JS the page shows all content.
(function () {
  document.documentElement.classList.add("js");

  // ---------------------------------------------------------------------
  // Local prices. prices.json (written by sync_prices.py from App Store
  // Connect) holds every country's weekly, yearly and lifetime price in its
  // own currency. The visitor's country comes from the time zone, or failing
  // that from the language region; with neither, the page keeps its USD
  // prices and USD note.
  // ---------------------------------------------------------------------
  var scriptSrc = document.currentScript && document.currentScript.src;

  function detectCountry(zones) {
    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && zones[tz]) return zones[tz];
    } catch (e) {}
    var langs = navigator.languages || [navigator.language || ""];
    for (var i = 0; i < langs.length; i++) {
      var m = /-([A-Za-z]{2})(?:-|$)/.exec(langs[i] || "");
      if (m) return m[1].toUpperCase();
    }
    return null;
  }

  function applyPrices(data) {
    var country = detectCountry(data.tz || {});
    var row = country && data.prices && data.prices[country];
    if (!row) return;
    var lang = document.documentElement.lang || "en";
    var currency = row[0];
    function format(value) {
      var opts = { style: "currency", currency: currency };
      if (Math.round(value) === value) opts.minimumFractionDigits = 0;
      try { return new Intl.NumberFormat(lang, opts).format(value); }
      catch (e) { return currency + " " + value; }
    }
    var digits = 2;
    try { digits = new Intl.NumberFormat("en", { style: "currency", currency: currency }).resolvedOptions().maximumFractionDigits; } catch (e) {}
    var values = {
      free: 0, weekly: row[1], yearly: row[2], lifetime: row[3],
      perweek: Number((row[2] / 52).toFixed(digits))
    };
    document.querySelectorAll("[data-price]").forEach(function (el) {
      var key = el.getAttribute("data-price");
      if (key in values) el.textContent = format(values[key]);
    });
    var usd = document.querySelector('[data-note="usd"]');
    var local = document.querySelector('[data-note="local"]');
    if (usd && local) {
      var name = country;
      try { name = new Intl.DisplayNames([lang], { type: "region" }).of(country) || country; } catch (e) {}
      local.textContent = (local.getAttribute("data-template") || "").replace("%@", name);
      local.hidden = false;
      usd.hidden = true;
    }
  }

  if (scriptSrc && document.querySelector("[data-price]") && window.fetch) {
    fetch(new URL("prices.json", scriptSrc))
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) { if (data) applyPrices(data); })
      .catch(function () {});
  }

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Deterministic noise (splitmix-style) so every visit draws the same year,
  // with missed days scattered instead of lining up in stripes.
  function roll(seed) {
    var z = (seed + 0x9e3779b9) | 0;
    z = Math.imul(z ^ (z >>> 16), 0x85ebca6b);
    z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35);
    z ^= z >>> 16;
    return (z >>> 0) % 100;
  }

  // Build each year card: 26 weeks x 7 days, later weeks denser than early
  // ones, so the picture reads as getting better.
  var cards = document.querySelectorAll(".year-card");
  cards.forEach(function (card, cardIndex) {
    var holder = card.querySelector(".year-cells");
    var counter = card.querySelector(".count");
    if (!holder) return;
    var weeks = 26, days = 7, cells = [];
    for (var w = 0; w < weeks; w++) {
      for (var d = 0; d < days; d++) {
        var cell = document.createElement("i");
        var chance = 50 + Math.round((w * 45) / (weeks - 1));
        cell.dataset.kept = roll(cardIndex * 1000 + w * 8 + d) < chance ? "1" : "";
        cell.dataset.week = w;
        holder.appendChild(cell);
        cells.push(cell);
      }
    }
    card._cells = cells;
    card._counter = counter;
  });

  function fill(card) {
    if (card._filled || !card._cells) return;
    card._filled = true;
    var kept = card._cells.filter(function (c) { return c.dataset.kept; });
    var label = card._counter ? card._counter.dataset.label || "%@ days kept" : "";
    if (reduceMotion) {
      kept.forEach(function (c) { c.classList.add("on"); });
      if (card._counter) card._counter.textContent = label.replace("%@", kept.length);
      return;
    }
    var week = 0, total = 0;
    var timer = setInterval(function () {
      card._cells.forEach(function (c) {
        if (+c.dataset.week === week && c.dataset.kept) { c.classList.add("on"); total++; }
      });
      if (card._counter) card._counter.textContent = label.replace("%@", total);
      week++;
      if (week >= 26) clearInterval(timer);
    }, 70);
  }

  var targets = document.querySelectorAll(".reveal, .year-card");
  if (!("IntersectionObserver" in window)) {
    targets.forEach(function (el) { el.classList.add("in"); if (el._cells) fill(el); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("in");
      if (entry.target._cells) fill(entry.target);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.2 });
  targets.forEach(function (el) { io.observe(el); });
})();
