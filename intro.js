// Intro typing animation for the home page.
// It only runs when the inline head script added the "intro" class, which
// happens once per browser session and never when reduced motion is on.
// The hero text lives in the HTML, so without JS everything still shows.
(function () {
  var root = document.documentElement;
  if (!root.classList.contains("intro")) return;

  var hero = document.querySelector(".hero");
  if (!hero) return;

  // Do not replay for the rest of this session.
  try { sessionStorage.setItem("introPlayed", "1"); } catch (e) {}

  var CMD = 70; // typing speed for commands (ms per character)
  var OUT = 20; // typing speed for output lines (ms per character)

  var cmds = hero.querySelectorAll(".cmd-text"); // whoami, cat about.txt, cat links.txt
  var nameEl = hero.querySelector(".name");
  var aboutLine = hero.querySelector(".about");
  var aboutText = hero.querySelector(".about-text");
  var linksLine = hero.querySelector(".links");
  var linkEls = hero.querySelectorAll(".links a");
  var finalPrompt = hero.querySelector(".prompt-final");

  var whoamiLine = cmds[0].closest(".cmd");
  var catAboutLine = cmds[1].closest(".cmd");
  var catLinksLine = cmds[2].closest(".cmd");

  // Safety net: if anything throws, reveal everything and unlock the height.
  function revealAll() {
    root.classList.remove("intro");
    hero.style.minHeight = "";
  }
  var fallback = setTimeout(revealAll, 8000);

  function sleep(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function show(el) { el.classList.add("show"); }

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

  async function run() {
    await sleep(300);

    show(whoamiLine);
    await type(cmds[0], CMD);
    await sleep(200);

    show(nameEl);
    await type(nameEl, OUT);
    await sleep(320);

    show(catAboutLine);
    await type(cmds[1], CMD);
    await sleep(200);

    show(aboutLine);
    await type(aboutText, OUT);
    await sleep(320);

    show(catLinksLine);
    await type(cmds[2], CMD);
    await sleep(200);

    show(linksLine);
    for (var i = 0; i < linkEls.length; i++) {
      await type(linkEls[i], OUT);
      await sleep(120);
    }
    await sleep(200);

    show(finalPrompt);

    // Unlock the height now that the content is complete (same size, no jump).
    hero.style.minHeight = "";
    clearTimeout(fallback);
  }

  var started = false;
  function begin() {
    if (started) return;
    started = true;

    // Lock the body to its final height BEFORE emptying the text, so the
    // terminal window keeps a constant size while everything types in.
    hero.style.minHeight = hero.offsetHeight + "px";

    // Empty every element we will type into, so nothing flashes before typing.
    var typeables = [cmds[0], cmds[1], cmds[2], nameEl, aboutText];
    linkEls.forEach(function (a) { typeables.push(a); });
    typeables.forEach(function (el) {
      el.setAttribute("data-full", el.textContent);
      el.textContent = "";
    });

    run().catch(function () {
      clearTimeout(fallback);
      revealAll();
    });
  }

  // Wait for the web font before measuring, so the locked height matches the
  // text that will actually be typed (font swaps can change line wrapping).
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(begin);
    setTimeout(begin, 1500); // safety in case fonts.ready never settles
  } else {
    begin();
  }
})();
