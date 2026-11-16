/* UAE tax calculation engine for camelvinjose.com
 * Pure functions, no DOM. Used by /calculator/ and /penalty-calculator/, and unit-tested in Node.
 *
 * Sources:
 *  - VAT: Federal Decree-Law No. 8 of 2017 (5% standard rate); Executive Regulation Art. 53 (blocked input tax), Art. 55 (apportionment).
 *  - Corporate Tax: Federal Decree-Law No. 47 of 2022 (0% up to AED 375,000, 9% above; 75% loss cap; 50% entertainment;
 *    interest limit 30% of EBITDA with AED 12m de minimis); Ministerial Decision on Small Business Relief (AED 3m revenue);
 *    Qualifying Free Zone Person de minimis (lower of 5% of revenue or AED 5m).
 *  - Penalties: Cabinet Decision No. 40 of 2017 as amended by Cabinet Decision No. 129 of 2025 (VAT/TPL, from 14 April 2026);
 *    Cabinet Decision No. 75 of 2023 as amended by Cabinet Decision No. 10 of 2024 (Corporate Tax).
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.TaxCalc = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var VAT_RATE = 0.05;
  var r2 = function (n) { return Math.round((n + Number.EPSILON) * 100) / 100; };
  var pos = function (n) { return Math.max(0, Number(n) || 0); };

  /* ---------------- VAT ---------------- */
  function vatAdd(net) { net = Number(net) || 0; var v = r2(net * VAT_RATE); return { net: r2(net), vat: v, gross: r2(net + v) }; }
  function vatExtract(gross) { gross = Number(gross) || 0; var net = r2(gross / (1 + VAT_RATE)); return { net: net, vat: r2(gross - net), gross: r2(gross) }; }

  // lines: [{desc, qty, price, rate: "standard"|"zero"|"exempt"}]
  function vatInvoice(lines) {
    var out = { lines: [], standard: 0, zero: 0, exempt: 0, vat: 0, total: 0 };
    (lines || []).forEach(function (l) {
      var amt = r2((Number(l.qty) || 0) * (Number(l.price) || 0));
      var v = l.rate === "standard" ? r2(amt * VAT_RATE) : 0;
      out.lines.push({ desc: l.desc || "", amount: amt, rate: l.rate, vat: v });
      out[l.rate] = r2(out[l.rate] + amt); out.vat = r2(out.vat + v);
    });
    out.total = r2(out.standard + out.zero + out.exempt + out.vat);
    return out;
  }

  /* VAT return estimate.
   * i: standardSales, zeroSales, exemptSales, rcmServices (imports of services under reverse charge),
   *    inputDirect (input VAT wholly on taxable supplies), inputOverheads (input VAT on general overheads),
   *    blocked (input VAT on blocked items, e.g. client entertainment, private-use cars)
   * Overheads are apportioned on taxable / total supplies (standard method). Reverse charge VAT is assumed
   * to be recoverable in the same proportion as overheads unless it relates to taxable supplies only.
   */
  function vatReturn(i) {
    var std = pos(i.standardSales), zero = pos(i.zeroSales), ex = pos(i.exemptSales), rcm = pos(i.rcmServices);
    var taxable = std + zero, total = taxable + ex;
    var recPct = total > 0 ? taxable / total : 1;
    var outputStd = r2(std * VAT_RATE), outputRcm = r2(rcm * VAT_RATE);
    var direct = pos(i.inputDirect), over = pos(i.inputOverheads), blocked = pos(i.blocked);
    var overRec = r2(over * recPct), rcmRec = r2(outputRcm * recPct);
    var inputRec = r2(direct + overRec + rcmRec);
    var output = r2(outputStd + outputRcm);
    return {
      outputStandard: outputStd, outputReverseCharge: outputRcm, output: output,
      recoveryPercent: r2(recPct * 100), overheadsRecoverable: overRec, reverseChargeRecoverable: rcmRec,
      inputDirect: r2(direct), blockedNotRecoverable: r2(blocked), inputRecoverable: inputRec,
      netPayable: r2(output - inputRec)
    };
  }

  /* ---------------- Corporate Tax ----------------
   * i: profit (accounting profit before tax), revenue,
   *    addBacks (other non-deductible), entertainment (client entertainment expense; 50% added back),
   *    penalties (fines and penalties; 100% added back), exemptIncome (e.g. qualifying dividends),
   *    netInterest, ebitda (tax-adjusted EBITDA; for the interest limit), lossesBF,
   *    regime: "standard" | "sbr" | "qfzp", qualifyingIncome, nonQualifyingRevenue
   */
  function corporateTax(i) {
    var notes = [];
    var profit = Number(i.profit) || 0, revenue = pos(i.revenue);
    var ent = r2(pos(i.entertainment) * 0.5), pen = pos(i.penalties), other = pos(i.addBacks), exempt = pos(i.exemptIncome);
    var nie = pos(i.netInterest), ebitda = Number(i.ebitda) || 0;
    var allowance = Math.max(12000000, 0.3 * Math.max(0, ebitda));
    var interestDisallowed = nie > 12000000 ? r2(Math.max(0, nie - allowance)) : 0;
    var regime = i.regime || "standard";

    if (regime === "sbr") {
      if (revenue > 3000000) { notes.push("Revenue is above AED 3m, so Small Business Relief isn't available. Calculated under the standard rules."); regime = "standard"; }
      else {
        notes.push("Small Business Relief elected: Taxable Income is treated as nil. Tax losses for this period can't be carried forward.");
        return { regime: "sbr", adjusted: 0, lossesUsed: 0, lossesCF: pos(i.lossesBF), taxableIncome: 0, zeroBand: 0, at9: 0, tax: 0,
                 effectiveRate: 0, interestDisallowed: 0, entertainmentAddBack: ent, notes: notes };
      }
    }

    var adjusted = r2(profit + ent + pen + other + interestDisallowed - exempt);
    var lossesBF = pos(i.lossesBF);
    var lossCap = r2(Math.max(0, adjusted) * 0.75);
    var lossesUsed = r2(Math.min(lossesBF, lossCap));
    var ti = r2(adjusted - lossesUsed);
    var lossesCF = r2(lossesBF - lossesUsed + (adjusted < 0 ? -adjusted : 0));

    var zeroBand = 0, at9 = 0, tax = 0;
    if (regime === "qfzp") {
      var nqr = pos(i.nonQualifyingRevenue);
      var deMin = Math.min(0.05 * revenue, 5000000);
      if (nqr > deMin) {
        notes.push("Non-qualifying revenue is above the de minimis limit (lower of 5% of revenue or AED 5m), so the company fails the QFZP conditions. Calculated under the standard rules.");
        regime = "standard";
      } else {
        var qi = Math.min(pos(i.qualifyingIncome), Math.max(0, ti));
        zeroBand = r2(qi); at9 = r2(Math.max(0, ti - qi)); tax = r2(at9 * 0.09);
        notes.push("QFZP: 0% on Qualifying Income, 9% on the rest. The AED 375,000 0% band doesn't apply.");
      }
    }
    if (regime === "standard") {
      zeroBand = r2(Math.min(Math.max(0, ti), 375000)); at9 = r2(Math.max(0, ti - 375000)); tax = r2(at9 * 0.09);
    }
    if (interestDisallowed > 0) notes.push("Net interest expense above the higher of AED 12m or 30% of EBITDA is disallowed this year and can be carried forward for up to 10 years.");
    if (lossesUsed > 0 && lossesUsed === lossCap && lossesBF > lossCap) notes.push("Loss relief is capped at 75% of Taxable Income before losses.");
    return { regime: regime, adjusted: adjusted, entertainmentAddBack: ent, interestDisallowed: interestDisallowed,
             lossesUsed: lossesUsed, lossesCF: lossesCF, taxableIncome: Math.max(0, ti), zeroBand: zeroBand, at9: at9, tax: tax,
             effectiveRate: profit > 0 ? r2(tax / profit * 100) : 0, notes: notes };
  }

  /* ---------------- Dates ---------------- */
  function parseDate(s) { var p = String(s).split("-").map(Number); return new Date(Date.UTC(p[0], p[1] - 1, p[2])); }
  function fmtDate(d) { return d.toISOString().slice(0, 10); }
  function addDays(d, n) { return new Date(d.getTime() + n * 86400000); }
  function daysInMonth(y, m) { return new Date(Date.UTC(y, m + 1, 0)).getUTCDate(); }
  // Monthly penalty dates. rule "ct": a missing date falls on the last day of that month (CD 75/2023 Art. 3).
  // rule "vat": a missing date falls on the first day of the following month (CD 40/2017 as amended).
  function addMonthsRule(start, k, rule) {
    var y = start.getUTCFullYear(), m = start.getUTCMonth() + k, d = start.getUTCDate();
    y += Math.floor(m / 12); m = ((m % 12) + 12) % 12;
    var dim = daysInMonth(y, m);
    if (d <= dim) return new Date(Date.UTC(y, m, d));
    return rule === "ct" ? new Date(Date.UTC(y, m, dim)) : new Date(Date.UTC(y, m + 1, 1));
  }
  // Number of monthly penalty dates from the day after `due` up to and including `end` ("each month or part thereof").
  function monthsOrPart(due, end, rule) {
    var start = addDays(due, 1), n = 0;
    if (end < start) return 0;
    while (addMonthsRule(start, n, rule) <= end && n < 1200) n++;
    return n;
  }
  // Add business days (Mon-Fri; UAE weekend is Saturday-Sunday). Public holidays are not excluded.
  function addBusinessDays(d, n) { var x = new Date(d.getTime()); while (n > 0) { x = addDays(x, 1); var w = x.getUTCDay(); if (w !== 0 && w !== 6) n--; } return x; }

  /* ---------------- Penalties ----------------
   * Each returns { total, lines: [{label, amount, basis}], notes: [] }.
   */
  var VAT_CUTOVER = parseDate("2026-04-14");

  function latePayment(tax, amount, dueDate, payDate) {
    var due = parseDate(dueDate), paid = parseDate(payDate), rule = tax === "ct" ? "ct" : "vat";
    var months = monthsOrPart(due, paid, rule), perMonth = r2(pos(amount) * 0.14 / 12), total = r2(pos(amount) * 0.14 * months / 12);
    var notes = [];
    if (tax === "vat" && due < VAT_CUTOVER) notes.push("The due date is before 14 April 2026. Until that date the old VAT rule applied (2% immediately, 4% monthly, up to 300%), so the penalty for the earlier months may differ. This uses the current rule throughout.");
    return { total: total, months: months, lines: [{ label: "Late payment: " + months + " month" + (months === 1 ? "" : "s") + " × 14% a year ÷ 12 (AED " + perMonth.toLocaleString("en-AE", { minimumFractionDigits: 2 }) + " a month)", amount: total,
      basis: tax === "ct" ? "Cabinet Decision No. 75 of 2023, table item 8" : "Cabinet Decision No. 40 of 2017 as amended by CD 129 of 2025, Table 1 item 9" }], notes: notes };
  }

  function lateFiling(tax, dueDate, fileDate, repeat) {
    var due = parseDate(dueDate), filed = parseDate(fileDate);
    if (filed <= due) return { total: 0, months: 0, lines: [], notes: ["Filed on time: no late filing penalty."] };
    if (tax === "vat") {
      var amt = repeat ? 2000 : 1000;
      return { total: amt, lines: [{ label: "Late VAT return" + (repeat ? " (repeat within 24 months)" : " (first time)"), amount: amt, basis: "Cabinet Decision No. 40 of 2017 as amended by CD 129 of 2025, Table 1 item 8" }], notes: [] };
    }
    var m = monthsOrPart(due, filed, "ct"), first = Math.min(m, 12), later = Math.max(0, m - 12);
    var lines = [{ label: "Months 1 to 12: " + first + " × AED 500", amount: first * 500, basis: "Cabinet Decision No. 75 of 2023, table item 7" }];
    if (later) lines.push({ label: "Month 13 onwards: " + later + " × AED 1,000", amount: later * 1000, basis: "Cabinet Decision No. 75 of 2023, table item 7" });
    return { total: first * 500 + later * 1000, months: m, lines: lines, notes: [] };
  }

  // Voluntary disclosure before any audit notice: 1% a month of the Tax Difference, from the day after the original
  // return due date until the disclosure date. Plus the AED 500 incorrect-return penalty if the tax due changed.
  function voluntaryDisclosure(tax, diff, returnDue, vdDate) {
    var rule = tax === "ct" ? "ct" : "vat";
    var m = monthsOrPart(parseDate(returnDue), parseDate(vdDate), rule), pct = r2(pos(diff) * 0.01 * m);
    var lines = [{ label: "Voluntary disclosure: " + m + " month" + (m === 1 ? "" : "s") + " × 1% of the tax difference", amount: pct,
      basis: tax === "ct" ? "Cabinet Decision No. 75 of 2023, table item 10" : "Cabinet Decision No. 40 of 2017 as amended by CD 129 of 2025, Table 1 item 11" }];
    var total = pct;
    if (pos(diff) > 0) { lines.push({ label: "Incorrect tax return (fixed)", amount: 500, basis: tax === "ct" ? "Cabinet Decision No. 75 of 2023, table item 9" : "Cabinet Decision No. 40 of 2017 as amended, Table 1 item 10" }); total += 500; }
    var notes = ["Any additional tax is due 20 business days after the disclosure is submitted. After that, the 14% a year late payment penalty applies."];
    if (tax === "vat" && parseDate(returnDue) < VAT_CUTOVER) notes.push("The return was due before 14 April 2026. Transitional treatment of older periods may differ; check with the FTA or an adviser.");
    return { total: r2(total), months: m, lines: lines, notes: notes };
  }

  // Error found by the FTA (no disclosure before the audit notice): 15% fixed + 1% a month until disclosure or assessment.
  function auditFinding(tax, diff, returnDue, endDate) {
    var rule = tax === "ct" ? "ct" : "vat";
    var m = monthsOrPart(parseDate(returnDue), parseDate(endDate), rule);
    var fixed = r2(pos(diff) * 0.15), monthly = r2(pos(diff) * 0.01 * m);
    var basis = tax === "ct" ? "Cabinet Decision No. 75 of 2023, table item 11" : "Cabinet Decision No. 40 of 2017 as amended by CD 129 of 2025, Table 1 item 12";
    var lines = [{ label: "Fixed: 15% of the tax difference", amount: fixed, basis: basis },
                 { label: "Monthly: " + m + " month" + (m === 1 ? "" : "s") + " × 1% of the tax difference", amount: monthly, basis: basis }];
    var total = fixed + monthly;
    if (pos(diff) > 0) { lines.push({ label: "Incorrect tax return (fixed)", amount: 500, basis: tax === "ct" ? "Cabinet Decision No. 75 of 2023, table item 9" : "Cabinet Decision No. 40 of 2017 as amended, Table 1 item 10" }); total += 500; }
    return { total: r2(total), months: m, lines: lines, notes: ["Compare this with a voluntary disclosure made before any audit notice: no 15% fixed penalty. Disclosing early is almost always cheaper."] };
  }

  function fixedPenalty(kind, tax, repeat) {
    var T = {
      lateRegistration: [10000, 10000, "Late registration", tax === "ct" ? "Cabinet Decision No. 75 of 2023, table item 14" : "Cabinet Decision No. 40 of 2017 as amended, Table 1 item 3"],
      records: [10000, 20000, "Failure to keep required records", tax === "ct" ? "Cabinet Decision No. 75 of 2023, table item 1" : "Cabinet Decision No. 40 of 2017 as amended, Table 1 item 1"],
      changes: [1000, 5000, "Failure to notify changes to tax record details", tax === "ct" ? "Cabinet Decision No. 75 of 2023, table item 4" : "Cabinet Decision No. 40 of 2017 as amended, Table 1 item 5"],
      auditObstruction: [20000, 20000, "Failure to facilitate a tax audit", tax === "ct" ? "Cabinet Decision No. 75 of 2023, table item 12" : "Cabinet Decision No. 40 of 2017 as amended, Table 1 item 13"],
      taxInvoice: [2500, 2500, "Tax invoice not issued on time (per case)", "Cabinet Decision No. 40 of 2017 as amended, Table 3 item 4"],
      pricesInclusive: [5000, 5000, "Prices not shown inclusive of VAT", "Cabinet Decision No. 40 of 2017 as amended, Table 3 item 1"]
    }[kind];
    var amt = repeat ? T[1] : T[0];
    var notes = [];
    if (kind === "lateRegistration" && tax === "ct") notes.push("The FTA has a waiver for the Corporate Tax late registration penalty if the first return (or declaration) is filed within 7 months of the end of the first Tax Period. Check whether it applies.");
    return { total: amt, lines: [{ label: T[2] + (repeat && T[0] !== T[1] ? " (repeat within 24 months)" : ""), amount: amt, basis: T[3] }], notes: notes };
  }

  function lateDeregistration(dueDate, appDate) {
    var m = monthsOrPart(parseDate(dueDate), parseDate(appDate), "vat");
    var total = Math.min(m * 1000, 10000);
    return { total: total, months: m, lines: [{ label: "Late deregistration: AED 1,000 then AED 1,000 a month (" + m + " month" + (m === 1 ? "" : "s") + "), capped at AED 10,000", amount: total, basis: "CD 40 of 2017 as amended, Table 1 item 4 / CD 75 of 2023, item 3" }], notes: [] };
  }

  return { VAT_RATE: VAT_RATE, vatAdd: vatAdd, vatExtract: vatExtract, vatInvoice: vatInvoice, vatReturn: vatReturn,
           corporateTax: corporateTax, monthsOrPart: monthsOrPart, parseDate: parseDate, fmtDate: fmtDate,
           addBusinessDays: addBusinessDays, latePayment: latePayment, lateFiling: lateFiling,
           voluntaryDisclosure: voluntaryDisclosure, auditFinding: auditFinding, fixedPenalty: fixedPenalty,
           lateDeregistration: lateDeregistration };
});
