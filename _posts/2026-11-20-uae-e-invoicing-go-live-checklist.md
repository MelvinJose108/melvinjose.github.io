---
title: "E-Invoicing Goes Live on 1 January: A Six-Week Readiness Plan for AED 50m+ Businesses"
date: 2026-11-20 11:30:00 +0400
seo_title: "UAE E-Invoicing Go-Live 1 January 2027: Readiness Checklist"
topic: "E-Invoicing"
description: "A week-by-week plan for UAE businesses with AED 50 million+ revenue to be ready for mandatory e-invoicing on 1 January 2027: scope, data, testing, controls and cut-over."
reviewed: 2026-11-20
image: /assets/images/e-invoicing/ei-golive-cover.png
tldr: "UAE businesses with revenue of AED 50 million or more must be live on e-invoicing by 1 January 2027, through an Accredited Service Provider (ASP) they should already have appointed. With six weeks left, work through it a week at a time: confirm scope and the ASP, fix invoice data, test end to end, set controls for the 14-business-day rule and rejections, get the receiving side and archive ready, then cut over. Not being live counts as failing to implement: AED 5,000, then AED 5,000 a month, capped at AED 50,000 in 12 months."
faq:
  - q: "When does UAE e-invoicing start for large businesses?"
    a: "Businesses with revenue of AED 50 million or more in their latest financial statements must go live by 1 January 2027. The deadline to appoint an ASP was 30 October 2026."
  - q: "What happens if my business isn't live on 1 January 2027?"
    a: "Not implementing e-invoicing, including not appointing an ASP, is penalised at AED 5,000 for the first instance and AED 5,000 for each month it continues, capped at AED 50,000 in any 12 months."
  - q: "Can I still send PDF invoices after go-live?"
    a: "The legal invoice is the e-invoice sent through your ASP. A PDF can go alongside it, and to customers who aren't live yet you must also send a normal tax invoice so they can recover input VAT."
  - q: "How long do I have to issue an e-invoice?"
    a: "E-invoices and e-credit notes must be issued and transmitted within 14 business days of the transaction, subject to the VAT Law's own timing rules."
---

If your business had revenue of **AED 50 million or more** in its latest financial statements, e-invoicing becomes mandatory on **1 January 2027**. That's six weeks from now, with National Day and the year-end close in between.

This is a week-by-week plan to get there. Every rule in it comes from the Ministry of Finance's **E-Invoicing Guidelines v2.0**, **Ministerial Decision No. 197 of 2026** and **Cabinet Decision No. 173 of 2026**. Each one has a full guide on this site, linked below.

![Six-week e-invoicing readiness plan from 23 November 2026 to go-live on 1 January 2027]({{ '/assets/images/e-invoicing/ei-golive-plan.webp' | relative_url }})
{: width="1600" height="900" loading="lazy" decoding="async"}

### Week of 23 November: scope and ASP

- **Confirm the phase for each entity**, on revenue in its latest financial statements. The guidelines don't say whether revenue is added up across a group, so test each entity on its own figures. ([Who must comply]({% post_url 2026-11-16-uae-e-invoicing-who-must-comply %}))
- **List what's excluded:** sales to consumers, imports, exempt and zero-rated financial services, and transactions inside the same **VAT** Tax Group until 31 December 2028. A Corporate Tax Group doesn't count. ([MD 197 explained]({% post_url 2026-11-16-uae-e-invoicing-ministerial-decision-197-2026 %}))
- **Check the ASP is signed** and that onboarding has started from the e-invoicing tile in **EmaraTax**. The deadline to appoint was **30 October 2026**. If you haven't, this is the only job this week. ([Choosing an ASP]({% post_url 2026-11-16-choosing-uae-e-invoicing-asp %}))
- **Get a TIN** for any in-scope entity without a TRN, and note each entity's **Peppol ID**: 0235 followed by its 10-digit TIN.

### Week of 30 November: data

- **Map your invoices against the mandatory fields.** There are 51 under PINT-AE, plus conditional ones. The usual gaps are buyer legal registration details and electronic addresses. ([The five-corner model]({% post_url 2026-11-16-uae-e-invoicing-five-corner-model %}))
- **Clean the customer master:** collect each customer's TRN (or TIN if not VAT-registered). Never put a Corporate Tax TRN in the VAT number field.
- **Tag intra-VAT-group invoices** in the ERP so they can be excluded now and brought in on 1 January 2029.

### Week of 7 December: testing

- **Test end to end with your ASP:** sending, receiving and FTA reporting, with real scenarios.
- **Include the awkward invoices:** a credit note covering several invoices, an advance and its final invoice, a foreign-currency invoice and a zero-rated sale.
- **Send one that fails on purpose**, so you see how a rejection comes back and who receives it.

### Week of 14 December: controls

- **The 14-business-day rule.** E-invoices and credit notes must be issued and transmitted within 14 business days of the transaction. VAT timing rules still apply alongside it, so build both into the billing cut-off.
- **Rejections.** Name who monitors failed invoices and how quickly they're fixed. The 14-day clock doesn't stop while an invoice sits in an error queue.
- **Customers who aren't live yet.** You still issue the e-invoice through your ASP, to the placeholder endpoint **0235:9900000098**, and **also** send a normal tax invoice, such as a PDF, so they can recover input VAT.

### Week of 21 December: receiving and archive

- **Get accounts payable ready to receive.** The penalty for failing to implement applies to recipients too, not only to issuers. ([Penalties]({% post_url 2026-11-16-uae-e-invoicing-penalties-cabinet-decision-173-2026 %}))
- **Agree archive terms.** You must keep e-invoice data for the Tax Procedures Law period, generally 5 years. If the ASP or ERP host stores it, make sure the contract gives you access and export for that whole period.
- **Set a data-change routine.** Not telling your ASP about changes to your FTA-registered details costs AED 250 a day. Add it to the licence-renewal checklist.

### 28 December to 1 January: go live

- **Sign off the cut-over plan:** which invoices go out the old way before 1 January, and which go through the ASP from then on.
- **Check the first invoices daily** in the first week: delivered, accepted, reported.
- **Start an outage log.** There's no longer a duty to report system failures, but an outage doesn't stop the 14-day clock.

### If you're not going to make it

Say so early, and keep going. The penalty for failing to implement is **AED 5,000 for the first instance, then AED 5,000 for each month or part of a month** it continues, capped at **AED 50,000 in any 12 months**. Every month you're live sooner saves money. The per-invoice penalty, AED 100 an invoice capped at AED 5,000 a month, matters less than the commercial cost: customers' payables teams may not process invoices that don't come through the system.

### Not Phase 1?

Businesses under AED 50 million appoint an ASP by **31 March 2027** and go live by **1 July 2027**. The same six steps apply, with more time. The [Deadline Planner]({{ '/tax-deadlines/' | relative_url }}) puts both dates in your calendar.

**Sources:** [UAE Electronic Invoicing Guidelines v2.0](https://mof.gov.ae/wp-content/uploads/2026/10/UAE-Electronic-Invoicing-Guidelines_En.pdf) (Ministry of Finance, 26 October 2026); Ministerial Decision No. 197 of 2026; Cabinet Decision No. 173 of 2026; Ministerial Decision No. 244 of 2025 as amended.
