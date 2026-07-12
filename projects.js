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
//   platform:    one of "ios", "extension" or "steam" (shows a small logo).
//                omit it if the project has no platform tag.
// ----------------------------------------------------------------
var projects = [
  {
    name: "Block&Read",
    image: "assets/blockandread.png",
    description: "Blocks your distracting apps until you read a few pages of a good book.",
    url: "blockandread/",
    platform: "ios",
    imageFit: "contain"
  },
  {
    name: "Fix Your Life",
    image: "assets/fixyourlife.png",
    description: "An alarm that wakes you to the present with confronting questions.",
    url: "fixyourlife/",
    platform: "ios"
  },
  // {
  //   name: "CurrencyFlow",
  //   image: "assets/currencyflow.png",
  //   description: "A fast, premium currency converter for iPhone. IN PROGRES...",
  //   url: "currencyflow/",
  //   platform: "ios"
  // },
  // {
  //   name: "NetScout",
  //   image: "assets/netscout.png",
  //   description: "Scan your local network and see every device.",
  //   url: "#",
  //   platform: "ios"
  // },
  // {
  //   name: "FocusGrid",
  //   image: "assets/focusgrid.png",
  //   description: "A minimal pomodoro timer that keeps you on task.",
  //   url: "#",
  //   platform: "extension"
  // },
  // {
  //   name: "CipherNote",
  //   image: "assets/ciphernote.png",
  //   description: "End-to-end encrypted notes for your iPhone.",
  //   url: "#",
  //   platform: "ios"
  // },
  // {
  //   name: "PixelRunner",
  //   image: "assets/pixelrunner.png",
  //   description: "A fast-paced 2D platformer made with Unity.",
  //   url: "#",
  //   platform: "steam"
  // },
  // {
  //   name: "HabitLoop",
  //   image: "assets/habitloop.png",
  //   description: "Build habits with simple streaks and reminders.",
  //   url: "#",
  //   platform: "ios"
  // },
  // {
  //   name: "PortPeek",
  //   image: "assets/portpeek.png",
  //   description: "A lightweight port scanner for quick recon.",
  //   url: "#",
  //   platform: "extension"
  // },
  // {
  //   name: "MoodTint",
  //   image: "assets/moodtint.png",
  //   description: "Track your mood and spot patterns over time.",
  //   url: "#",
  //   platform: "ios"
  // },
  // {
  //   name: "VaultKey",
  //   image: "assets/vaultkey.png",
  //   description: "A clean, offline two-factor authentication app.",
  //   url: "#",
  //   platform: "ios"
  // },
  // {
  //   name: "SkyCast",
  //   image: "assets/skycast.png",
  //   description: "Beautiful, no-nonsense weather at a glance.",
  //   url: "#",
  //   platform: "ios"
  // }
];

// Platform logos (monochrome, inherit the text color).
var PLATFORMS = {
  ios: {
    label: "iOS app",
    svg: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.05 12.04c-.03-2.6 2.13-3.85 2.22-3.91-1.21-1.77-3.1-2.01-3.77-2.04-1.6-.16-3.13.94-3.94.94-.81 0-2.07-.92-3.41-.89-1.75.03-3.37 1.02-4.27 2.59-1.82 3.16-.47 7.83 1.31 10.39.87 1.25 1.9 2.66 3.26 2.61 1.31-.05 1.8-.85 3.39-.85 1.58 0 2.03.85 3.41.82 1.41-.03 2.3-1.28 3.16-2.54.99-1.46 1.4-2.87 1.42-2.94-.03-.01-2.73-1.05-2.76-4.16M14.5 4.79c.72-.88 1.21-2.1 1.08-3.31-1.04.04-2.3.69-3.05 1.56-.67.77-1.25 2.01-1.09 3.19 1.16.09 2.34-.59 3.06-1.44"/></svg>'
  },
  extension: {
    label: "Browser extension",
    svg: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7s2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11z"/></svg>'
  },
  steam: {
    label: "Steam game",
    svg: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012M18.955 8.907c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015m-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265"/></svg>'
  }
};

// ----------------------------------------------------------------
// Render the grid, then reveal the cards as they scroll into view.
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
      if (p.imageFit === "contain") img.className = "fit-contain";
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

    var foot = document.createElement("div");
    foot.className = "card-foot";

    var open = document.createElement("span");
    open.className = "card-open";
    open.textContent = "→ open";
    foot.appendChild(open);

    var plat = PLATFORMS[p.platform];
    if (plat) {
      var badge = document.createElement("span");
      badge.className = "card-platform";
      badge.title = plat.label;
      badge.setAttribute("aria-label", plat.label);
      badge.innerHTML = plat.svg;
      foot.appendChild(badge);
    }

    body.appendChild(name);
    body.appendChild(desc);
    body.appendChild(foot);

    card.appendChild(imageWrap);
    card.appendChild(body);
    grid.appendChild(card);
    cards.push(card);
  });

  // No animation: everything is already visible.
  if (!animate) return;

  if (!("IntersectionObserver" in window)) {
    cards.forEach(function (c) { c.classList.add("in"); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
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
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

  cards.forEach(function (c) { io.observe(c); });
})();
