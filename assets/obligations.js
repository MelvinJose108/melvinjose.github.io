/* UAE compliance obligations and end-of-service gratuity. UMD: window.UAEObl / module.exports. */
(function (root, f) { if (typeof module === "object" && module.exports) module.exports = f(); else root.UAEObl = f(); })(this, function () {
  "use strict";
  function n(x) { x = parseFloat(String(x == null ? "" : x).replace(/[^0-9.\-]/g, "")); return isFinite(x) ? x : 0; }
  var M = 1e6;

  /* o: { type:"company"|"individual", freeZone:bool, qfzp:"yes"|"no"|"unsure", taxGroup:bool, revenue, prevRevenueUnder3m:bool,
          supplies12, next30, expenses12, rpt, cpMax, groupRevenue (AED), mne750:bool } */
  function obligations(o) {
    var R = [], rev = n(o.revenue), sup = n(o.supplies12), nx = n(o.next30), exp = n(o.expenses12), rpt = n(o.rpt), cp = n(o.cpMax), grp = n(o.groupRevenue);
    function add(area, title, status, text, basis) { R.push({ area: area, title: title, status: status, text: text, basis: basis }); }

    // VAT registration
    if (sup > 375000 || nx > 375000)
      add("VAT", "VAT registration", "required", "Taxable supplies and imports are over AED 375,000 (past 12 months or expected in the next 30 days). Apply within 30 days of crossing the threshold.", "VAT Law Art. 13");
    else if (sup > 187500 || exp > 187500)
      add("VAT", "VAT registration", "option", "Not mandatory, but you can register voluntarily because supplies or expenses are over AED 187,500. That lets you recover input VAT.", "VAT Law Art. 17");
    else add("VAT", "VAT registration", "not", "Below the AED 187,500 voluntary and AED 375,000 mandatory thresholds.", "VAT Law Arts. 13 and 17");

    // Corporate Tax registration
    if (o.type === "individual") {
      if (rev > M) add("Corporate Tax", "Corporate Tax registration", "required", "A natural person whose business turnover is over AED 1 million in a calendar year must register for Corporate Tax.", "Cabinet Decision No. 49 of 2023");
      else add("Corporate Tax", "Corporate Tax registration", "not", "A natural person registers only once business turnover is over AED 1 million in a calendar year.", "Cabinet Decision No. 49 of 2023");
    } else add("Corporate Tax", "Corporate Tax registration", "required", "Every UAE company must register, including Free Zone companies and those with no taxable profit.", "CT Law Art. 51");

    // Small Business Relief
    var isQ = o.freeZone && o.qfzp === "yes";
    if (isQ) add("Corporate Tax", "Small Business Relief", "na", "Not available to a Qualifying Free Zone Person.", "Ministerial Decision No. 73 of 2023");
    else if (grp >= 3150 * M) add("Corporate Tax", "Small Business Relief", "na", "Not available to members of a multinational group with consolidated revenue of AED 3.15 billion or more.", "Ministerial Decision No. 73 of 2023");
    else if (rev <= 3 * M && o.prevRevenueUnder3m !== false)
      add("Corporate Tax", "Small Business Relief", "option", "Available: revenue is AED 3 million or less" + (o.prevRevenueUnder3m ? " in this and every earlier period" : " (it must also have been in every earlier period)") + ". You must elect it in the return, and it applies to tax periods ending on or before 31 December 2029. Losses in relief years can't be carried forward.", "MD No. 73 of 2023 as amended by MD No. 131 of 2026");
    else add("Corporate Tax", "Small Business Relief", "na", "Revenue is over AED 3 million in this or an earlier period.", "Ministerial Decision No. 73 of 2023");

    // Audited financial statements (for Corporate Tax)
    if (o.taxGroup) add("Audit", "Audited financial statements", "required", "Every Tax Group must prepare audited special purpose aggregated financial statements, whatever its revenue.", "Ministerial Decision No. 84 of 2025");
    else if (isQ) add("Audit", "Audited financial statements", "required", "A Qualifying Free Zone Person must keep audited financial statements to keep its 0% rate, whatever its revenue.", "Ministerial Decision No. 84 of 2025");
    else if (rev > 50 * M) add("Audit", "Audited financial statements", "required", "Revenue is over AED 50 million in the tax period.", "Ministerial Decision No. 84 of 2025");
    else if (o.freeZone && o.qfzp === "unsure") add("Audit", "Audited financial statements", "check", "Required if you intend to be a Qualifying Free Zone Person. Otherwise not required for Corporate Tax at this revenue.", "Ministerial Decision No. 84 of 2025");
    else add("Audit", "Audited financial statements", "check", "Not required for Corporate Tax at this revenue. Your free zone authority, licensing authority, bank or the Commercial Companies Law may still require an audit, so check those.", "Ministerial Decision No. 84 of 2025");

    // Transfer pricing
    if (rpt > 40 * M || cp > 500000) add("Transfer pricing", "Transfer Pricing Disclosure Form", "required", "File it with the Corporate Tax return: " + (rpt > 40 * M ? "related-party transactions are over AED 40 million" : "") + (rpt > 40 * M && cp > 500000 ? ", and " : "") + (cp > 500000 ? "payments or benefits to a connected person are over AED 500,000" : "") + ".", "FTA Corporate Tax return: Transfer Pricing Disclosure Form");
    else add("Transfer pricing", "Transfer Pricing Disclosure Form", "not", "Related-party transactions are not over AED 40 million and no connected person received over AED 500,000. Transactions must still be at arm's length.", "CT Law Arts. 34 to 36");
    if (rev >= 200 * M || grp >= 3150 * M) add("Transfer pricing", "Master File and Local File", "required", "Keep both and provide them within 30 days of an FTA request: " + (rev >= 200 * M ? "revenue is AED 200 million or more" : "the group's consolidated revenue is AED 3.15 billion or more") + ".", "Ministerial Decision No. 97 of 2023");
    else add("Transfer pricing", "Master File and Local File", "not", "Revenue is under AED 200 million and group revenue under AED 3.15 billion.", "Ministerial Decision No. 97 of 2023");

    // Pillar Two
    if (o.mne750) add("Corporate Tax", "Domestic Minimum Top-up Tax (15%)", "required", "In scope: the multinational group had consolidated revenue of EUR 750 million or more in at least two of the four preceding years. Applies to financial years starting on or after 1 January 2025.", "Cabinet Decision No. 142 of 2024");

    // E-invoicing
    if (o.type === "individual" && rev <= 0) {}
    else if (rev >= 50 * M) add("E-invoicing", "E-invoicing (Phase 1)", "required", "Appoint an ASP by 30 October 2026 and go live by 1 January 2027. Applies to B2B and B2G transactions, whether or not you're VAT-registered.", "Ministerial Decision No. 244 of 2025, as amended");
    else add("E-invoicing", "E-invoicing (Phase 2)", "required", "Appoint an ASP by 31 March 2027 and go live by 1 July 2027 for B2B and B2G transactions, whether or not you're VAT-registered. Sales only to consumers are out of scope.", "Ministerial Decision No. 244 of 2025, as amended");

    return R;
  }

  /* End-of-service gratuity, Federal Decree-Law No. 33 of 2021, Art. 51 (full-time, private sector). */
  function d(s) { var m = String(s || "").trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/) || null, x;
    if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    m = String(s || "").trim().match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/); if (m) return new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));
    return null; }
  function gratuity(g) {
    var s = d(g.start), e = d(g.end), basic = n(g.basic), unpaid = n(g.unpaidDays);
    if (!s || !e || e < s || !basic) return { ok: false };
    var endX = new Date(e.getTime() + 86400000);              // service runs to the end of the last working day
    var days = Math.round((endX - s) / 86400000) - unpaid; if (days < 0) days = 0;
    // Whole years by anniversary, then the remaining days / 365 (so leap years don't inflate the count)
    var full = endX.getUTCFullYear() - s.getUTCFullYear(), ann = new Date(Date.UTC(s.getUTCFullYear() + full, s.getUTCMonth(), s.getUTCDate()));
    if (ann > endX) { full--; ann = new Date(Date.UTC(s.getUTCFullYear() + full, s.getUTCMonth(), s.getUTCDate())); }
    var years = Math.max(0, full + Math.round((endX - ann) / 86400000) / 365 - unpaid / 365), daily = basic / 30;
    var d21 = Math.min(years, 5) * 21, d30 = Math.max(years - 5, 0) * 30, payDays = d21 + d30;
    var raw = daily * payDays, cap = basic * 24, amt = Math.min(raw, cap);
    var eligible = years >= 1;
    return { ok: true, days: days, years: years, daily: daily, d21: d21, d30: d30, payDays: payDays, raw: raw, cap: cap, capped: raw > cap,
             amount: eligible ? r2(amt) : 0, accrued: r2(amt), eligible: eligible };
  }
  function r2(x) { return Math.round(x * 100) / 100; }
  function parseStaff(text) {
    return String(text || "").split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean).map(function (l) {
      var p = l.indexOf("\t") >= 0 ? l.split("\t") : l.split(/[;|,](?=\s*(?:\d|$))/);
      if (p.length < 3) return null;
      var name = p[0].trim(), start = (p[1] || "").trim(), basic = n(p[2]), unpaid = n(p[3]);
      if (!d(start) || !basic) return null;
      return { name: name, start: start, basic: basic, unpaid: unpaid };
    }).filter(Boolean);
  }
  return { obligations: obligations, gratuity: gratuity, parseStaff: parseStaff, parseDate: d };
});
