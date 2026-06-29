// ----------------------------------------------------------------
// Your projects.
//
// To add a project, add one object to the list below. The grid on
// projects.html renders itself from this data, so you never touch
// the HTML or CSS.
//
//   name:        the project title
//   image:       path to a screenshot or icon (put the file in assets/)
//                if it is missing, the card shows the first letter instead
//   description: one short line about the project
//   url:         where the card links to (the project landing page)
//
// Note: every project below except CurrencyFlow is fake placeholder
// data, only there to preview how the grid looks. Replace or delete.
// ----------------------------------------------------------------
var projects = [
  {
    name: "CurrencyFlow",
    image: "assets/currencyflow.png",
    description: "A fast, premium currency converter for iPhone.",
    url: "currencyflow/"
  },
  {
    name: "PassForge",
    image: "assets/passforge.png",
    description: "Generate and store strong passwords, fully offline.",
    url: "#"
  },
  {
    name: "NetScout",
    image: "assets/netscout.png",
    description: "Scan your local network and see every device.",
    url: "#"
  },
  {
    name: "FocusGrid",
    image: "assets/focusgrid.png",
    description: "A minimal pomodoro timer that keeps you on task.",
    url: "#"
  },
  {
    name: "CipherNote",
    image: "assets/ciphernote.png",
    description: "End-to-end encrypted notes for your iPhone.",
    url: "#"
  },
  {
    name: "PixelRunner",
    image: "assets/pixelrunner.png",
    description: "A fast-paced 2D platformer made with Unity.",
    url: "#"
  },
  {
    name: "HabitLoop",
    image: "assets/habitloop.png",
    description: "Build habits with simple streaks and reminders.",
    url: "#"
  },
  {
    name: "PortPeek",
    image: "assets/portpeek.png",
    description: "A lightweight port scanner for quick recon.",
    url: "#"
  },
  {
    name: "MoodTint",
    image: "assets/moodtint.png",
    description: "Track your mood and spot patterns over time.",
    url: "#"
  },
  {
    name: "VaultKey",
    image: "assets/vaultkey.png",
    description: "A clean, offline two-factor authentication app.",
    url: "#"
  },
  {
    name: "SkyCast",
    image: "assets/skycast.png",
    description: "Beautiful, no-nonsense weather at a glance.",
    url: "#"
  }
];

// ----------------------------------------------------------------
// Render the grid, then run the intro typing + scroll-reveal.
// You do not need to edit anything below this line.
// ----------------------------------------------------------------
(function () {
  var grid = document.getElementById("projectGrid");
  if (!grid) return;

  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var animate = root.classList.contains("projects-anim") && !reduce;

  var cards = [];
  projects.forEach(function (p) {
    var card = document.createElement("a");
    card.className = "card" + (animate ? " reveal-card" : "");
    card.href = p.url;

    var imageWrap = document.createElement("div");
    imageWrap.className = "card-image";

    // Placeholder shown when there is no image (or it fails to load).
    var mono = document.createElement("span");
    mono.className = "card-mono";
    mono.textContent = p.name.charAt(0);
    imageWrap.appendChild(mono);

    if (p.image) {
      var img = document.createElement("img");
      img.src = p.image;
      img.alt = p.name;
      img.loading = "lazy";
      img.onerror = function () { img.remove(); };
      imageWrap.appendChild(img);
    }

    var body = document.createElement("div");
    body.className = "card-body";

    var name = document.createElement("div");
    name.className = "card-name";
    name.textContent = p.name;

    var desc = document.createElement("div");
    desc.className = "card-desc";
    desc.textContent = p.description;

    var open = document.createElement("div");
    open.className = "card-open";
    open.textContent = "→ open";

    body.appendChild(name);
    body.appendChild(desc);
    body.appendChild(open);

    card.appendChild(imageWrap);
    card.appendChild(body);
    grid.appendChild(card);
    cards.push(card);
  });

  // No animation: everything is already visible, nothing else to do.
  if (!animate) return;

  var cmdText = document.querySelector(".projects-header .cmd-text");
  var cmdLine = cmdText ? cmdText.closest(".cmd") : null;
  var title = document.querySelector(".page-title");
  var hasIO = "IntersectionObserver" in window;

  // Safety net: if anything breaks, reveal everything.
  function revealAll() {
    root.classList.remove("projects-anim");
    cards.forEach(function (c) { c.classList.remove("reveal-card"); });
  }
  var fallback = setTimeout(revealAll, 8000);

  function sleep(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function type(el, speed) {
    return new Promise(function (resolve) {
      var full = el.getAttribute("data-full") || "";
      el.classList.add("typing-active");
      var i = 0;
      (function step() {
        el.textContent = full.slice(0, i);
        if (i < full.length) {
          i++;
          setTimeout(step, speed);
        } else {
          el.classList.remove("typing-active");
          resolve();
        }
      })();
    });
  }

  var io = hasIO ? new IntersectionObserver(function (entries) {
    var delay = 0;
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var el = entry.target;
        // Stagger cards that enter together (for example the first screenful).
        setTimeout(function () { el.classList.add("in"); }, delay);
        delay += 80;
        io.unobserve(el);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }) : null;

  function startReveal() {
    if (hasIO) {
      cards.forEach(function (c) { io.observe(c); });
    } else {
      cards.forEach(function (c) { c.classList.add("in"); });
    }
  }

  async function run() {
    if (cmdText) {
      cmdText.setAttribute("data-full", cmdText.textContent);
      cmdText.textContent = "";
    }

    await sleep(250);
    if (cmdLine) cmdLine.classList.add("show");
    if (cmdText) await type(cmdText, 70);

    await sleep(160);
    if (title) title.classList.add("show");

    await sleep(180);
    startReveal();
    clearTimeout(fallback);
  }

  run().catch(function () {
    clearTimeout(fallback);
    revealAll();
  });
})();
