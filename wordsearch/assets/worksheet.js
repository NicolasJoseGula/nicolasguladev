// Word search worksheet: builds a puzzle from the page's word list, lets the
// player drag across words on the board (each found word gets a highlighter
// stroke and its pronunciation, like in the app) and prints the sheet with
// its answer key on a second page.
(function () {
  var data = JSON.parse(document.getElementById('ws-data').textContent);
  var ALL = [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]];
  var SIZES = {
    easy: { n: 8, count: 8, dirs: ALL.slice(0, 2), how: 'across and down' },
    medium: { n: 10, count: 12, dirs: ALL.slice(0, 4), how: 'across, down and diagonally' },
    hard: { n: 12, count: 15, dirs: ALL, how: 'in every direction, even backwards' }
  };
  // Filler letters roughly follow English frequency, so the grid reads like words.
  var FILL = 'EEEEEEAAAAIIIIOOOOTTTNNNSSSRRRHHLLDDCCUUMMPPGGBBFFWYKV';
  var COLORS = ['#ffd000', '#ff7a00', '#ff2d87', '#a14cff', '#00c2ff', '#22c55e'];

  var level = document.querySelector('[data-level].on').dataset.level;
  var size = 'medium';
  var puzzle = null;
  var found = [];

  var board = document.getElementById('ws-board');
  var clues = document.getElementById('ws-clues');
  var done = document.getElementById('ws-done');

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  // Places as many words as the size asks for; a word that does not fit after
  // a few hundred tries is skipped for the next one in the pool.
  function makePuzzle() {
    var cfg = SIZES[size];
    var n = cfg.n;
    var pool = shuffle(data.words.filter(function (w) {
      return (level === 'all' || w[1] === level) && w[0].length <= n;
    }).map(function (w) { return w[0]; }));
    var grid = [];
    for (var i = 0; i < n * n; i++) grid.push('');
    var placed = [];
    for (var k = 0; k < pool.length && placed.length < cfg.count; k++) {
      var word = pool[k];
      for (var tries = 0; tries < 300; tries++) {
        var d = pick(cfg.dirs);
        var r = Math.floor(Math.random() * n), c = Math.floor(Math.random() * n);
        var er = r + d[0] * (word.length - 1), ec = c + d[1] * (word.length - 1);
        if (er < 0 || er >= n || ec < 0 || ec >= n) continue;
        var ok = true;
        for (var j = 0; j < word.length && ok; j++) {
          var cell = grid[(r + d[0] * j) * n + c + d[1] * j];
          ok = cell === '' || cell === word[j];
        }
        if (!ok) continue;
        for (j = 0; j < word.length; j++) grid[(r + d[0] * j) * n + c + d[1] * j] = word[j];
        placed.push({ word: word, r: r, c: c, er: er, ec: ec });
        break;
      }
    }
    for (i = 0; i < grid.length; i++) if (grid[i] === '') grid[i] = pick(FILL);
    return { n: n, grid: grid, placed: placed, how: cfg.how };
  }

  // A highlighter stroke from one cell to another, in percent of the board,
  // so it scales with the board (the board is always square).
  function stroke(n, r, c, er, ec, color) {
    var cell = 100 / n;
    var x1 = (c + 0.5) * cell, y1 = (r + 0.5) * cell, x2 = (ec + 0.5) * cell, y2 = (er + 0.5) * cell;
    var len = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
    var s = document.createElement('span');
    s.className = 'ws-stroke';
    s.style.left = (x1 + x2) / 2 + '%';
    s.style.top = (y1 + y2) / 2 + '%';
    s.style.width = len + cell * 0.82 + '%';
    s.style.height = cell * 0.82 + '%';
    s.style.background = color;
    s.style.transform = 'translate(-50%, -50%) rotate(' + Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI + 'deg)';
    return s;
  }

  function drawBoard(el, p, answers) {
    el.innerHTML = '';
    el.style.setProperty('--n', p.n);
    var layer = document.createElement('div');
    layer.className = 'ws-strokes';
    el.appendChild(layer);
    if (answers) {
      p.placed.forEach(function (w, i) {
        layer.appendChild(stroke(p.n, w.r, w.c, w.er, w.ec, COLORS[i % COLORS.length]));
      });
    }
    p.grid.forEach(function (ch) {
      var d = document.createElement('span');
      d.className = 'ws-cell';
      d.textContent = ch;
      el.appendChild(d);
    });
    return layer;
  }

  var layer, live;

  function render() {
    puzzle = makePuzzle();
    found = [];
    done.hidden = true;
    layer = drawBoard(board, puzzle, false);
    live = null;
    clues.innerHTML = '';
    puzzle.placed.forEach(function (w) {
      var li = document.createElement('li');
      li.dataset.word = w.word;
      li.innerHTML = '<button type="button" class="ws-say" data-say="' + w.word.toLowerCase() + '" aria-label="Hear ' + w.word + '">' +
        '<img src="' + data.img + w.word.toLowerCase() + '.webp" width="56" height="56" alt="">' +
        '<span>' + w.word + '</span></button>';
      clues.appendChild(li);
    });
    document.getElementById('ws-found').textContent = '0';
    document.getElementById('ws-of').textContent = puzzle.placed.length;
    document.getElementById('ws-total').textContent = puzzle.placed.length;
  }

  // ---- Pronunciation -------------------------------------------------------

  var audio = new Audio();
  function say(word) {
    audio.src = data.audio + word + '.mp3';
    audio.currentTime = 0;
    audio.play().catch(function () {});
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.ws-say');
    if (b) say(b.dataset.say);
  });

  // ---- Dragging across the board --------------------------------------------

  var start = null;

  function cellAt(e) {
    var r = board.getBoundingClientRect();
    var n = puzzle.n;
    var c = Math.floor((e.clientX - r.left) / r.width * n);
    var rr = Math.floor((e.clientY - r.top) / r.height * n);
    return [Math.max(0, Math.min(n - 1, rr)), Math.max(0, Math.min(n - 1, c))];
  }

  // Snaps the drag to the nearest of the 8 straight directions and keeps it
  // inside the board.
  function snap(a, b) {
    var dr = b[0] - a[0], dc = b[1] - a[1];
    if (!dr && !dc) return [a[0], a[1]];
    var ang = Math.round(Math.atan2(dr, dc) / (Math.PI / 4));
    var sr = Math.round(Math.sin(ang * Math.PI / 4)), sc = Math.round(Math.cos(ang * Math.PI / 4));
    var len = Math.max(Math.abs(dr), Math.abs(dc));
    while (len > 0) {
      var er = a[0] + sr * len, ec = a[1] + sc * len;
      if (er >= 0 && er < puzzle.n && ec >= 0 && ec < puzzle.n) return [er, ec];
      len--;
    }
    return [a[0], a[1]];
  }

  board.addEventListener('pointerdown', function (e) {
    if (!done.hidden) return;
    e.preventDefault();
    board.setPointerCapture(e.pointerId);
    start = cellAt(e);
    live = stroke(puzzle.n, start[0], start[1], start[0], start[1], 'rgba(161, 76, 255, .35)');
    layer.appendChild(live);
  });

  board.addEventListener('pointermove', function (e) {
    if (!start) return;
    var end = snap(start, cellAt(e));
    var s = stroke(puzzle.n, start[0], start[1], end[0], end[1], 'rgba(161, 76, 255, .35)');
    layer.replaceChild(s, live);
    live = s;
  });

  function finish(e) {
    if (!start) return;
    var end = snap(start, cellAt(e));
    layer.removeChild(live);
    live = null;
    var hit = null;
    puzzle.placed.forEach(function (w) {
      if (found.indexOf(w.word) >= 0) return;
      var same = w.r === start[0] && w.c === start[1] && w.er === end[0] && w.ec === end[1];
      var back = w.er === start[0] && w.ec === start[1] && w.r === end[0] && w.c === end[1];
      if (same || back) hit = w;
    });
    start = null;
    if (!hit) return;
    found.push(hit.word);
    var s = stroke(puzzle.n, hit.r, hit.c, hit.er, hit.ec, COLORS[(found.length - 1) % COLORS.length]);
    s.classList.add('pop');
    layer.appendChild(s);
    clues.querySelector('[data-word="' + hit.word + '"]').classList.add('found');
    document.getElementById('ws-found').textContent = found.length;
    say(hit.word.toLowerCase());
    if (found.length === puzzle.placed.length) setTimeout(function () { done.hidden = false; }, 700);
  }
  board.addEventListener('pointerup', finish);
  board.addEventListener('pointercancel', function () {
    if (live) layer.removeChild(live);
    live = null;
    start = null;
  });

  // ---- Controls ----------------------------------------------------------------

  document.querySelectorAll('.ws-controls .chip').forEach(function (b) {
    b.addEventListener('click', function () {
      var key = b.dataset.level ? 'level' : 'size';
      b.parentNode.querySelectorAll('.chip').forEach(function (o) { o.classList.toggle('on', o === b); });
      if (key === 'level') level = b.dataset.level; else size = b.dataset.size;
      render();
    });
  });
  document.getElementById('ws-new').addEventListener('click', render);
  document.getElementById('ws-again').addEventListener('click', render);

  // ---- Download -------------------------------------------------------------------
  // The worksheet is a real PDF made in the browser with jsPDF (loaded only
  // when someone asks for it): page 1 is the puzzle with its clues, page 2
  // the answer key. Letter paper for the Americas' letter-size countries, A4
  // for everyone else.

  var JSPDF = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  var INK = [43, 18, 87];

  function loadScript(src) {
    return new Promise(function (ok, fail) {
      if (window.jspdf) return ok();
      var s = document.createElement('script');
      s.src = src;
      s.onload = ok;
      s.onerror = fail;
      document.head.appendChild(s);
    });
  }

  // jsPDF takes PNG, so each sticker goes through a canvas first.
  function png(src, px) {
    return new Promise(function (ok) {
      var img = new Image();
      img.onload = function () {
        var k = Math.min(px / img.width, px / img.height);
        var c = document.createElement('canvas');
        c.width = Math.round(img.width * k);
        c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        ok({ url: c.toDataURL('image/png'), w: c.width, h: c.height });
      };
      img.onerror = function () { ok(null); };
      img.src = src;
    });
  }

  function fontBase64(src) {
    return fetch(src).then(function (r) { return r.arrayBuffer(); }).then(function (buf) {
      var bytes = new Uint8Array(buf), bin = '';
      for (var i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
      return btoa(bin);
    });
  }

  function paper() {
    var lang = (navigator.language || 'en-US').toUpperCase();
    return /-(US|CA|MX|PH|CL|CO|VE|GT|CR|PA|PR|DO|SV|NI|HN|BO)$/.test(lang) ? 'letter' : 'a4';
  }

  // Draws an image centered in a box, keeping its proportions.
  function fit(doc, im, x, y, box) {
    if (!im) return;
    var k = Math.min(box / im.w, box / im.h);
    doc.addImage(im.url, 'PNG', x + (box - im.w * k) / 2, y + (box - im.h * k) / 2, im.w * k, im.h * k);
  }

  function drawGrid(doc, p, x0, y0, size, answers) {
    var n = p.n, cell = size / n;
    if (answers) {
      doc.setLineCap('round');
      doc.setLineWidth(cell * 0.78);
      doc.setGState(new doc.GState({ opacity: 0.85 }));
      p.placed.forEach(function (w, i) {
        var hex = COLORS[i % COLORS.length];
        doc.setDrawColor(parseInt(hex.substr(1, 2), 16), parseInt(hex.substr(3, 2), 16), parseInt(hex.substr(5, 2), 16));
        doc.line(x0 + (w.c + 0.5) * cell, y0 + (w.r + 0.5) * cell, x0 + (w.ec + 0.5) * cell, y0 + (w.er + 0.5) * cell);
      });
      doc.setGState(new doc.GState({ opacity: 1 }));
    }
    doc.setDrawColor(INK[0], INK[1], INK[2]);
    doc.setLineWidth(0.6);
    doc.roundedRect(x0, y0, size, size, 4, 4, 'S');
    doc.setFont('Lilita', 'normal');
    doc.setFontSize(cell * 1.45);
    doc.setTextColor(INK[0], INK[1], INK[2]);
    p.grid.forEach(function (ch, i) {
      doc.text(ch, x0 + (i % n + 0.5) * cell, y0 + (Math.floor(i / n) + 0.5) * cell, { align: 'center', baseline: 'middle' });
    });
  }

  function header(doc, W, icon, title, task, who) {
    fit(doc, icon, 12, 11, 14);
    doc.setFont('Lilita', 'normal');
    doc.setFontSize(22);
    doc.setTextColor(INK[0], INK[1], INK[2]);
    doc.text(title, 30, 18);
    if (task) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(doc.splitTextToSize(task, who ? W - 30 - 80 : W - 42), 30, 24);
    }
    if (who) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setDrawColor(90, 90, 90);
      doc.setLineWidth(0.25);
      ['Name:', 'Date:'].forEach(function (label, i) {
        var y = 16 + i * 9;
        doc.text(label, W - 70, y);
        doc.line(W - 58, y + 0.5, W - 12, y + 0.5);
      });
    }
  }

  function footer(doc, W, H) {
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.25);
    doc.line(12, H - 16, W - 12, H - 16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(70, 70, 70);
    doc.text('More free English word searches: ' + data.site + '  ·  ' + data.app + ', free on iPhone and Android',
      W / 2, H - 11, { align: 'center' });
  }

  function download() {
    var btn = document.getElementById('ws-download');
    var label = btn.textContent;
    btn.textContent = 'Making your PDF...';
    btn.disabled = true;
    var p = puzzle;
    var mode = document.getElementById('ws-mode').value;
    var words = p.placed.map(function (w) { return w.word; }).sort();
    Promise.all([
      loadScript(JSPDF),
      fontBase64(data.font),
      png(data.icon, 160),
      Promise.all(words.map(function (w) { return mode === 'words' ? null : png(data.img + w.toLowerCase() + '.webp', 200); }))
    ]).then(function (r) {
      var doc = new window.jspdf.jsPDF({ unit: 'mm', format: paper() });
      doc.addFileToVFS('LilitaOne.ttf', r[1]);
      doc.addFont('LilitaOne.ttf', 'Lilita', 'normal');
      var W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
      var title = data.topic + ' Word Search';
      var task = mode === 'pictures'
        ? 'Look at each picture, find its English word in the grid and write it on the line.'
        : 'Find the ' + words.length + ' words in the grid. They go ' + p.how + '.';

      // Page 1: the puzzle and its clues.
      header(doc, W, r[2], title, task, true);
      var G = 140, gy = 38;
      drawGrid(doc, p, (W - G) / 2, gy, G, false);
      var cols = mode === 'words' ? 4 : 6;
      var colW = (W - 24) / cols, y = gy + G + (mode === 'words' ? 12 : 8);
      words.forEach(function (w, i) {
        var cx = 12 + (i % cols) * colW, cy = y + Math.floor(i / cols) * (mode === 'words' ? 10 : 25);
        doc.setFont('Lilita', 'normal');
        doc.setFontSize(12);
        doc.setTextColor(INK[0], INK[1], INK[2]);
        if (mode === 'words') {
          doc.setDrawColor(90, 90, 90);
          doc.setLineWidth(0.3);
          doc.roundedRect(cx + 4, cy - 3.5, 4, 4, 0.8, 0.8, 'S');
          doc.text(w, cx + 11, cy);
          return;
        }
        fit(doc, r[3][i], cx + (colW - 16) / 2, cy, 16);
        if (mode === 'pictures') {
          doc.setDrawColor(90, 90, 90);
          doc.setLineWidth(0.3);
          doc.line(cx + 3, cy + 22, cx + colW - 3, cy + 22);
        } else {
          doc.text(w, cx + colW / 2, cy + 21, { align: 'center' });
        }
      });
      footer(doc, W, H);

      // Page 2: the answer key.
      doc.addPage();
      header(doc, W, r[2], title + ' · Answer key', '', false);
      drawGrid(doc, p, (W - 120) / 2, 32, 120, true);
      doc.setFont('Lilita', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(INK[0], INK[1], INK[2]);
      doc.text(doc.splitTextToSize(words.join('   ·   '), W - 40), W / 2, 164, { align: 'center' });
      footer(doc, W, H);

      doc.save(data.slug + '-word-search.pdf');
    }).catch(function () {
      alert('The PDF could not be made. Check your connection and try again.');
    }).then(function () {
      btn.textContent = label;
      btn.disabled = false;
    });
  }

  document.getElementById('ws-download').addEventListener('click', download);

  render();
})();
