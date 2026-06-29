// ----------------------------------------------------------------
// Your projects.
//
// To add a project, add one object to the list below. The grid on
// projects.html renders itself from this data, so you never touch
// the HTML or CSS.
//
//   name:        the project title
//   image:       path to a screenshot or icon (put the file in assets/)
//   description: one short line about the project
//   url:         where the card links to (the project landing page)
// ----------------------------------------------------------------
var projects = [
  {
    name: "CurrencyFlow",
    image: "assets/currencyflow.png",
    description: "A fast, premium currency converter for iPhone.",
    url: "currencyflow/"
  }
];

// ----------------------------------------------------------------
// Renderer. You do not need to edit anything below this line.
// ----------------------------------------------------------------
(function () {
  var grid = document.getElementById("projectGrid");
  if (!grid) return;

  projects.forEach(function (p) {
    var card = document.createElement("a");
    card.className = "card";
    card.href = p.url;

    var imageWrap = document.createElement("div");
    imageWrap.className = "card-image";

    if (p.image) {
      var img = document.createElement("img");
      img.src = p.image;
      img.alt = p.name;
      img.loading = "lazy";
      // If the image is missing, just leave the empty placeholder box.
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
  });
})();
