/* Supplier due diligence logic for FTA Decision No. 13 of 2026 (input VAT verification).
   UMD: window.DD in the browser, module.exports in Node (for tests). */
(function (root, f) { if (typeof module === "object" && module.exports) module.exports = f(); else root.DD = f(); })(this, function () {
  "use strict";
  var SMALL = 10000, CUM = 100000, BIG = 375000, PRICE_BAND = 0.2;
  function n(x) { x = parseFloat(String(x == null ? "" : x).replace(/[^0-9.\-]/g, "")); return isFinite(x) ? x : 0; }

  // Spend tier. Totals are per supplier, excluding VAT, and should include this supply.
  function tier(supply, past12, next12) {
    supply = n(supply); past12 = n(past12); next12 = n(next12);
    if (past12 > BIG || next12 > BIG) return { tier: "enhanced", why: "Spend with this supplier is over AED 375,000 in the past or next 12 months, so the bank account confirmation and reputation review also apply." };
    if (supply < SMALL && past12 <= CUM && next12 <= CUM) return { tier: "exempt", why: "This supply is under AED 10,000 and spend with the supplier is not over AED 100,000 in the past or next 12 months, so the checks may be skipped for it." };
    if (supply < SMALL) return { tier: "standard", why: "This supply is under AED 10,000, but spend with the supplier is over AED 100,000 in the past or next 12 months, so the small-supply relief doesn't apply." };
    return { tier: "standard", why: "This supply is AED 10,000 or more, so the full supplier and supply checks apply." };
  }

  function priceCheck(offered, low, high) {
    offered = n(offered); low = n(low); high = n(high);
    if (!offered || !low) return { flag: false, known: false };
    if (offered < low * (1 - PRICE_BAND)) return { flag: true, known: true, pct: Math.round((1 - offered / low) * 100), dir: "below" };
    if (high && offered > high * (1 + PRICE_BAND)) return { flag: true, known: true, pct: Math.round((offered / high - 1) * 100), dir: "above" };
    return { flag: false, known: true };
  }

  function items(s) {
    var L = [];
    function add(id, group, label, art) { L.push({ id: id, group: group, label: label, art: art }); }
    if (s.type === "individual") {
      add("id", "Supplier", "Copy of a valid Emirates ID or passport", "Art. 3(1)");
      add("met", "Supplier", "Met the supplier before the first supply (in person, by phone or video)", "Art. 3(1)");
    } else {
      add("reg", "Supplier", "Incorporation verified (trade licence, certificate or official registry)", "Art. 3(1)");
      add("match", "Supplier", "Name, address and people match across the documents", "Art. 3(1)");
      add("auth", "Supplier", "Valid ID of the director, agent or employee you deal with", "Art. 3(1)");
    }
    add("premises", "Supplier", "Place of business confirmed (map capture or visit note) and it fits the activity", "Art. 3(2)");
    add("risk", "Supplier", "Risk indicators reviewed (address and key staff changes, deal size)", "Art. 3(3)");
    add("reason", "Supply", "Commercial reason for using this supplier noted", "Art. 4(1)");
    add("payment", "Supply", "Payment method and terms checked", "Art. 4(2)");
    add("price", "Supply", "Price compared with the market (quotes, price list or past purchases)", "Art. 4(3)(a)");
    add("licence", "Supply", "Supplier's licence checked: this supply falls within its activity", "Art. 4(3)(b)");
    if (s.goods) add("origin", "Supply", "Origin evidence kept (serial numbers, customs documents, distributor authorisation)", "Art. 4(3)(c)");
    if (s.intermediary) add("intermediary", "Supply", "Intermediary's role and commercial reason documented", "Art. 4");
    if (s.tier === "enhanced") {
      add("bank", "Over AED 375,000", "Written confirmation of the supplier's UAE bank account (e.g. IBAN letter)", "Art. 3");
      add("reputation", "Over AED 375,000", "Review of public reviews and media coverage of the supplier", "Art. 3");
    }
    add("filed", "Records", "All evidence saved in the supplier file at your designated tax records location", "Art. 5(3)");
    return L;
  }

  function flags(s) {
    var F = [];
    if (n(s.addrChanges) > 2) F.push({ id: "addr", text: "Address changed more than twice in the last 12 months", ex: "Art. 3(3)" });
    if (n(s.staffChanges) > 2) F.push({ id: "staff", text: "Key employees or managers changed more than twice in the last 12 months", ex: "Art. 3(3)" });
    if (s.disproportionate) F.push({ id: "disp", text: "The deal is out of proportion to the supplier's size or track record", ex: "FTA Example 3" });
    if (s.payment === "cash") F.push({ id: "cash", text: "Payment in cash instead of electronic payment", ex: "Art. 4(2)" });
    if (s.payment === "third") F.push({ id: "third", text: "Payment to a third party, not the supplier", ex: "FTA Example 4" });
    if (s.payment === "foreign") F.push({ id: "foreign", text: "Payment to a foreign bank account", ex: "FTA Example 4" });
    if (s.split) F.push({ id: "split", text: "One purchase billed as several invoices or by several companies", ex: "FTA Example 4" });
    var p = priceCheck(s.offered, s.mktLow, s.mktHigh);
    if (p.flag) F.push({ id: "price", text: "Price is " + p.pct + "% " + p.dir + " the market range", ex: "FTA Example 5" });
    if (s.inLicence === "no") F.push({ id: "licence", text: "What you're buying is outside the supplier's licensed activity", ex: "FTA Example 6" });
    return F;
  }

  function addMonths(iso, m) {
    var d = new Date(iso + "T00:00:00Z"); if (isNaN(d)) return "";
    var day = d.getUTCDate(); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + m);
    var last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    d.setUTCDate(Math.min(day, last)); return d.toISOString().slice(0, 10);
  }

  function evaluate(s) {
    var t = tier(s.supply, s.past12, s.next12);
    s.tier = t.tier;
    var L = items(s), F = flags(s), done = s.checks || {}, expl = s.expl || {};
    var missing = L.filter(function (i) { return !done[i.id]; });
    var unexplained = F.filter(function (f) { return String(expl[f.id] || "").trim().length < 15; });
    var status;
    if (t.tier === "exempt") status = "exempt";
    else if (!missing.length && !unexplained.length) status = "complete";
    else status = "gaps";
    var pct = L.length ? Math.round((L.length - missing.length) / L.length * 100) : 100;
    return { tier: t.tier, why: t.why, items: L, flags: F, missing: missing, unexplained: unexplained, status: status, pct: pct,
             nextReview: s.date ? addMonths(s.date, 12) : "" };
  }

  // Bulk tiering: "Name<TAB>past12<TAB>next12" or "Name; past12; next12" per line.
  function parseList(text) {
    return String(text || "").split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean).map(function (l) {
      var p = l.indexOf("\t") >= 0 ? l.split("\t") : l.split(/[;|]/);
      if (p.length < 2) { var m = l.match(/^(.*?)\s+([\d,.]+)(?:\s+([\d,.]+))?$/); if (m) p = [m[1], m[2], m[3] || "0"]; }
      var name = (p[0] || "").trim(), past = n(p[1]), next = n(p[2]);
      if (!name || (/^(name|supplier)/i.test(name) && !past && !next)) return null;
      var big = past > BIG || next > BIG, cum = past > CUM || next > CUM;
      return { name: name, past12: past, next12: next, tier: big ? "enhanced" : cum ? "standard" : "small",
               needs: big ? "Full checks + bank letter + reputation review" : cum ? "Full checks on every supply" : "Full checks on supplies of AED 10,000 or more; may skip smaller ones" };
    }).filter(Boolean);
  }

  return { tier: tier, priceCheck: priceCheck, items: items, flags: flags, evaluate: evaluate, parseList: parseList, addMonths: addMonths,
           SMALL: SMALL, CUM: CUM, BIG: BIG };
});
