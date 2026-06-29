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

  var cmds = hero.querySelectorAll(".cmd-text");
  var name = hero.querySelector(".name");
  var aboutLine = hero.querySelector(".about");
  var aboutText = hero.querySelector(".about-text");
  var links = hero.querySelector(".links");
  var whoamiLine = cmds[0].closest(".cmd");
  var catLine = cmds[1].closest(".cmd");

  // Safety net: if anything throws, reveal everything so nothing stays hidden.
  function revealAll() {
    root.classList.remove("intro");
  }
  var fallback = setTimeout(revealAll, 6000);

  function sleep(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function show(el) {
    el.classList.add("show");
  }

  function type(el, speed) {
    return new Promise(function (resolve) {
      var full = el.textContent;
      el.textContent = "";
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
    await type(cmds[0], 80);
    await sleep(220);

    show(name);
    await sleep(420);

    show(catLine);
    await type(cmds[1], 70);
    await sleep(220);

    show(aboutLine);
    await type(aboutText, 20);

    // Hand off to the steady blinking cursor at the end of the about line.
    root.classList.add("intro-done");
    await sleep(260);

    show(links);
    clearTimeout(fallback);
  }

  run().catch(function () {
    clearTimeout(fallback);
    revealAll();
  });
})();
