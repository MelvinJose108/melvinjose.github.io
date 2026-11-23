/* Site search: loads /search.json once, ranks pages in the browser. Open with the header button, "/" or Ctrl/Cmd+K. */
(function () {
  "use strict";
  var d = document, data = null, box, input, list, sel = -1, hits = [];
  var ALIAS = { ct: "corporate tax", vat: "vat", qfzp: "qualifying free zone", sbr: "small business relief", asp: "accredited service provider",
    einvoice: "e-invoicing", einvoicing: "e-invoicing", "e-invoice": "e-invoicing", tp: "transfer pricing", eosb: "gratuity", fta: "fta" };
  function norm(s) { return String(s || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[\u2019']/g, "").replace(/\s+/g, " "); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function load() {
    if (data) return Promise.resolve(data);
    var url = (d.querySelector('link[rel="search-index"]') || {}).href || "/search.json";
    return fetch(url).then(function (r) { return r.json(); }).then(function (j) {
      data = j.map(function (x) { x._t = norm(x.t); x._k = norm(x.k); x._d = norm(x.d); x._c = norm(x.c); return x; }); return data; });
  }
  function terms(q) {
    q = norm(q).trim(); if (!q) return [];
    var out = [];
    q.split(/[\s,]+/).forEach(function (w) { if (!w) return; out.push(ALIAS[w] ? [w, ALIAS[w]] : [w]); });
    return out;
  }
  function count(hay, w) { var n = 0, i = hay.indexOf(w); while (i >= 0 && n < 20) { n++; i = hay.indexOf(w, i + w.length); } return n; }
  function search(q) {
    var T = terms(q); if (!T.length) return [];
    var res = [];
    data.forEach(function (x) {
      var score = 0, ok = true;
      T.forEach(function (alts) {
        var best = 0;
        alts.forEach(function (w) {
          var s = 0, inT = x._t.indexOf(w);
          if (inT >= 0) s += 12 + (inT === 0 || x._t[inT - 1] === " " ? 4 : 0);
          if (x._k.indexOf(w) >= 0) s += 6;
          if (x._d.indexOf(w) >= 0) s += 5;
          s += Math.min(count(x._c, w), 10);
          if (s > best) best = s;
        });
        if (!best) ok = false; score += best;
      });
      if (ok) res.push({ x: x, s: score + (x.k === "Tool" ? 2 : 0) });
    });
    return res.sort(function (a, b) { return b.s - a.s; }).slice(0, 12).map(function (r) { return r.x; });
  }
  function snippet(x, T) {
    var src = x.c || x.d || "", low = norm(src), at = -1;
    T.some(function (alts) { return alts.some(function (w) { at = low.indexOf(w); return at >= 0; }); });
    if (at < 0 || !x.c) src = x.d || src.slice(0, 160), at = -1;
    var start = at < 0 ? 0 : Math.max(0, at - 60), s = src.slice(start, start + 170);
    if (start > 0) s = "\u2026" + s.replace(/^\S*\s/, ""); if (start + 170 < src.length) s = s.replace(/\s\S*$/, "") + "\u2026";
    var h = esc(s);
    T.forEach(function (alts) { alts.forEach(function (w) { if (w.length < 2) return;
      h = h.replace(new RegExp("(" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig"), "<mark>$1</mark>"); }); });
    return h;
  }
  function render() {
    var q = input.value; hits = q.trim() ? search(q) : []; sel = hits.length ? 0 : -1;
    var T = terms(q);
    if (!q.trim()) { list.innerHTML = '<li class="sx-tip">Try <button type="button" data-q="tax group">tax group</button> <button type="button" data-q="penalty">penalty</button> <button type="button" data-q="e-invoicing">e-invoicing</button> <button type="button" data-q="gratuity">gratuity</button></li>'; return; }
    if (!hits.length) { list.innerHTML = '<li class="sx-none">No results for \u201c' + esc(q) + '\u201d. Try fewer or different words, or <a href="/contact/">ask me</a>.</li>'; return; }
    list.innerHTML = hits.map(function (x, i) {
      return '<li><a id="sx-' + i + '" role="option" aria-selected="' + (i === sel) + '" href="' + esc(x.u) + '"><span class="sx-k">' + esc(x.k) + (x.dt ? " \u00b7 " + esc(x.dt) : "") + '</span><b>' + esc(x.t) + '</b><span class="sx-s">' + snippet(x, T) + '</span></a></li>';
    }).join("");
  }
  function move(k) {
    if (!hits.length) return; sel = (sel + k + hits.length) % hits.length;
    list.querySelectorAll("a").forEach(function (a, i) { a.setAttribute("aria-selected", i === sel); if (i === sel) a.scrollIntoView({ block: "nearest" }); });
    input.setAttribute("aria-activedescendant", "sx-" + sel);
  }
  function build() {
    box = d.createElement("div"); box.className = "sx"; box.hidden = true; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", "Search the site");
    box.innerHTML = '<div class="sx-panel"><div class="sx-head"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M10 2a8 8 0 0 1 6.3 12.9l5.4 5.4-1.4 1.4-5.4-5.4A8 8 0 1 1 10 2zm0 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12z"/></svg>' +
      '<input type="search" placeholder="Search guides and tools" aria-label="Search guides and tools" autocomplete="off" spellcheck="false" role="combobox" aria-expanded="true" aria-controls="sx-list"><button type="button" class="sx-x" aria-label="Close search">Esc</button></div><ul class="sx-list" id="sx-list" role="listbox"></ul></div>';
    d.body.appendChild(box);
    input = box.querySelector("input"); list = box.querySelector(".sx-list");
    input.addEventListener("input", render);
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
      else if (e.key === "Enter" && sel >= 0) { e.preventDefault(); location.href = hits[sel].u; }
    });
    list.addEventListener("click", function (e) { var b = e.target.closest("button[data-q]"); if (b) { input.value = b.dataset.q; render(); input.focus(); } });
    box.addEventListener("click", function (e) { if (e.target === box) close(); });
    box.querySelector(".sx-x").addEventListener("click", close);
  }
  var opener;
  function open() {
    if (!box) build(); opener = d.activeElement; box.hidden = false; d.documentElement.classList.add("sx-open");
    input.value = ""; render(); input.focus();
    load().then(function () { if (input.value) render(); }).catch(function () { list.innerHTML = '<li class="sx-none">Search couldn\u2019t load. Check your connection and try again.</li>'; });
  }
  function close() { if (!box || box.hidden) return; box.hidden = true; d.documentElement.classList.remove("sx-open"); if (opener && opener.focus) opener.focus(); }
  d.addEventListener("keydown", function (e) {
    if (e.key === "Escape") return close();
    var typing = /input|textarea|select/i.test((e.target.tagName || "")) || e.target.isContentEditable;
    if ((e.key === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && !typing)) { e.preventDefault(); open(); }
  });
  d.addEventListener("click", function (e) { if (e.target.closest && e.target.closest("[data-search-open]")) { e.preventDefault(); open(); } });
  // warm the index when the pointer heads for the button
  d.addEventListener("pointerover", function (e) { if (e.target.closest && e.target.closest("[data-search-open]")) load().catch(function () {}); });
})();
