// Theme toggle: switch between dark and light and remember the choice.
// The initial theme is applied by a small inline script in the <head> of
// each page so there is no flash on load.
(function () {
  var root = document.documentElement;
  var toggle = document.getElementById("themeToggle");
  if (!toggle) return;

  toggle.addEventListener("click", function () {
    var current = root.getAttribute("data-theme") === "light" ? "light" : "dark";
    var next = current === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  });
})();
