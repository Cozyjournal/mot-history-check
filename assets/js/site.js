// Live MOT checker — calls the mot-check Cloudflare Worker, which adds the
// IsItAGoodCar (Matter Logic) API key server-side and returns DVSA data.
// No key or secret ever appears in this file or in the browser.
const MOT_API_PROXY = "https://mot-check.ahmedbinumar000.workers.dev/check";

document.addEventListener("DOMContentLoaded", () => {
  // Update copyright year across all pages
  const year = new Date().getFullYear();
  document.querySelectorAll("#yr, .current-year").forEach(el => {
    el.textContent = year;
  });

  // Helper functions for DOM creation and date formatting
  function el(tag, text, cls) {
    const e = document.createElement(tag);
    if (text !== undefined && text !== null) e.textContent = text;
    if (cls) e.className = cls;
    return e;
  }

  function fmtDate(s) {
    const d = new Date(s);
    return isNaN(d) ? String(s || "") : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  function titleCase(s) {
    return String(s || "").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }

  const DEFECT_LABELS = {
    advisory: "Advisory",
    minor: "Minor",
    major: "Major",
    dangerous: "Dangerous",
    fail: "Fail item",
    prs: "PRS",
    user: "Note"
  };

  // Render the Worker response: { registration, vehicle, mot, attribution }
  function render(d, plate, out) {
    out.replaceChildren();
    const v = d.vehicle || {};
    const m = d.mot || {};
    const tests = Array.isArray(m.tests) ? m.tests.slice() : [];

    const shownPlate = v.registration_formatted || plate;
    const name = [titleCase(v.make), titleCase(v.model)].filter(Boolean).join(" ");
    out.append(el("h3", shownPlate + (name ? " — " + name : ""), "chk-title"));

    // Vehicle facts line
    const facts = [];
    if (v.year) facts.push(String(v.year));
    if (v.colour) facts.push(titleCase(v.colour));
    if (v.fuel_type) facts.push(titleCase(v.fuel_type));
    if (v.engine_capacity_cc) facts.push(Number(v.engine_capacity_cc).toLocaleString("en-GB") + " cc");
    if (v.first_registration_date) facts.push("First registered " + fmtDate(v.first_registration_date));
    if (facts.length) out.append(el("p", facts.join(" · "), "chk-facts"));

    // Status cards: MOT + Tax
    const cards = el("div", undefined, "chk-cards");

    const motCard = el("div", undefined, "chk-card");
    motCard.append(el("span", "MOT", "chk-label"));
    const motValid = String(m.status || "").toLowerCase() === "valid";
    const motStatusText = m.raw_status || (m.status ? titleCase(m.status) : "No record");
    const motBig = el("span", motStatusText, "chk-big " + (motValid ? "pass" : "fail"));
    motCard.append(motBig);
    if (m.expiry_date) {
      let sub = (motValid ? "Expires " : "Expired ") + fmtDate(m.expiry_date);
      const days = Math.round((new Date(m.expiry_date) - new Date(new Date().toDateString())) / 86400000);
      if (!isNaN(days)) {
        if (days > 0) sub += " · " + days + (days === 1 ? " day" : " days") + " left";
        else if (days < 0) sub += " · " + Math.abs(days) + (days === -1 ? " day" : " days") + " ago";
        else sub += " · expires today";
      }
      motCard.append(el("span", sub, "chk-sub"));
    }
    cards.append(motCard);

    const tax = v.tax || d.tax || null;
    let taxCard = null;
    if (tax && tax.status) {
      taxCard = el("div", undefined, "chk-card");
      taxCard.append(el("span", "Tax", "chk-label"));
      const taxed = String(tax.status).toLowerCase() === "taxed";
      taxCard.append(el("span", tax.status, "chk-big " + (taxed ? "pass" : "warn")));
      if (tax.due_date) taxCard.append(el("span", "Due " + fmtDate(tax.due_date), "chk-sub"));
    }
    // On the car tax check page the tax card leads; everywhere else MOT leads
    if (taxCard && location.pathname.includes("car-tax-check")) {
      cards.insertBefore(taxCard, motCard);
    } else if (taxCard) {
      cards.append(taxCard);
    }
    out.append(cards);

    // Summary line: latest mileage + test counts
    const bits = [];
    if (m.latest_mileage && m.latest_mileage.value) {
      bits.push("Latest mileage " + Number(m.latest_mileage.value).toLocaleString("en-GB") + " " + (m.latest_mileage.unit || "miles") +
        (m.latest_test_date ? " (" + fmtDate(m.latest_test_date) + ")" : ""));
    }
    if (m.counts && m.counts.total) {
      bits.push(m.counts.total + " tests: " + (m.counts.passes || 0) + " passed, " + (m.counts.failures || 0) + " failed");
      const decided = (m.counts.passes || 0) + (m.counts.failures || 0);
      if (decided > 0) bits.push(Math.round((m.counts.passes || 0) / decided * 100) + "% pass rate");
    }
    // Defect totals across the whole history
    let advisoryItems = 0, failItems = 0;
    const advisorySeen = {};
    tests.forEach(t => {
      (Array.isArray(t.defects) ? t.defects : []).forEach(df => {
        const ty = String(df.type || "").toLowerCase();
        if (ty === "advisory" || ty === "minor") {
          advisoryItems++;
          const key = String(df.text || "").trim().toLowerCase();
          if (key) advisorySeen[key] = (advisorySeen[key] || 0) + 1;
        } else if (ty === "major" || ty === "dangerous" || ty === "fail") {
          failItems++;
        }
      });
    });
    if (advisoryItems || failItems) {
      bits.push(advisoryItems + " advisory items, " + failItems + " failure items on record");
    }
    if (bits.length) out.append(el("p", bits.join(" · "), "chk-facts"));

    // Repeat advisories — the same item flagged at 2+ tests is a pattern worth seeing
    const repeats = Object.keys(advisorySeen).filter(k => advisorySeen[k] >= 2)
      .sort((a, b) => advisorySeen[b] - advisorySeen[a]).slice(0, 2);
    if (repeats.length) {
      const note = el("p", undefined, "flag");
      note.append(el("strong", "Repeat advisories: "));
      note.append(document.createTextNode(repeats.map(k =>
        "“" + k.charAt(0).toUpperCase() + k.slice(1) + "” (flagged " + advisorySeen[k] + " times)"
      ).join("; ") + ". The same item coming back year after year usually means a repair that keeps being put off."));
      out.append(note);
    }

    // Mileage chart — one point per test, oldest to newest; a falling segment is drawn red
    const pts = tests.filter(t => t.mileage && t.mileage.value)
      .map(t => ({ d: t.test_date, v: Number(t.mileage.value) })).reverse();
    if (pts.length >= 2) {
      const W = 600, H = 190, PL = 8, PR = 8, PT = 22, PB = 24;
      const max = Math.max.apply(null, pts.map(p => p.v)) * 1.05;
      const min = Math.min(0, Math.min.apply(null, pts.map(p => p.v)));
      const X = i => PL + (W - PL - PR) * (pts.length === 1 ? 0.5 : i / (pts.length - 1));
      const Y = val => PT + (H - PT - PB) * (1 - (val - min) / (max - min || 1));
      const NS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(NS, "svg");
      svg.setAttribute("viewBox", "0 0 " + W + " " + H);
      svg.setAttribute("class", "mileage-chart");
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-label", "Chart of mileage recorded at each MOT test");
      for (let i = 0; i < pts.length - 1; i++) {
        const line = document.createElementNS(NS, "line");
        line.setAttribute("x1", X(i)); line.setAttribute("y1", Y(pts[i].v));
        line.setAttribute("x2", X(i + 1)); line.setAttribute("y2", Y(pts[i + 1].v));
        line.setAttribute("stroke", pts[i + 1].v < pts[i].v ? "#ff6b6b" : "#3de0ff");
        line.setAttribute("stroke-width", "3");
        line.setAttribute("stroke-linecap", "round");
        if (pts[i + 1].v < pts[i].v) line.setAttribute("stroke-dasharray", "7 6");
        svg.appendChild(line);
      }
      pts.forEach((p, i) => {
        const c = document.createElementNS(NS, "circle");
        c.setAttribute("cx", X(i)); c.setAttribute("cy", Y(p.v)); c.setAttribute("r", "4.5");
        c.setAttribute("fill", "#070d1a");
        c.setAttribute("stroke", (i > 0 && p.v < pts[i - 1].v) ? "#ff6b6b" : "#3de0ff");
        c.setAttribute("stroke-width", "3");
        svg.appendChild(c);
      });
      const first = document.createElementNS(NS, "text");
      first.setAttribute("x", X(0)); first.setAttribute("y", Math.max(12, Y(pts[0].v) - 10));
      first.setAttribute("fill", "#e9f0ff"); first.setAttribute("font-size", "13");
      first.setAttribute("font-family", "JetBrains Mono, monospace");
      first.textContent = pts[0].v.toLocaleString("en-GB");
      svg.appendChild(first);
      const last = document.createElementNS(NS, "text");
      last.setAttribute("x", X(pts.length - 1)); last.setAttribute("y", Math.max(12, Y(pts[pts.length - 1].v) - 10));
      last.setAttribute("fill", "#e9f0ff"); last.setAttribute("font-size", "13");
      last.setAttribute("font-family", "JetBrains Mono, monospace");
      last.setAttribute("text-anchor", "end");
      last.textContent = pts[pts.length - 1].v.toLocaleString("en-GB");
      svg.appendChild(last);
      const y1 = document.createElementNS(NS, "text");
      y1.setAttribute("x", X(0)); y1.setAttribute("y", H - 6);
      y1.setAttribute("fill", "#9aabc9"); y1.setAttribute("font-size", "12");
      y1.textContent = String(new Date(pts[0].d).getFullYear());
      svg.appendChild(y1);
      const y2 = document.createElementNS(NS, "text");
      y2.setAttribute("x", X(pts.length - 1)); y2.setAttribute("y", H - 6);
      y2.setAttribute("fill", "#9aabc9"); y2.setAttribute("font-size", "12");
      y2.setAttribute("text-anchor", "end");
      y2.textContent = String(new Date(pts[pts.length - 1].d).getFullYear());
      svg.appendChild(y2);
      const fig = el("figure", undefined, "chart chk-chart");
      fig.appendChild(svg);
      fig.append(el("figcaption", "Mileage recorded at each MOT test. A red dashed drop can be a sign of clocking.", "cap"));
      out.append(fig);
    }

    // Add the MOT due date to the visitor's calendar (.ics download, made in the browser)
    if (m.expiry_date && new Date(m.expiry_date) >= new Date(new Date().toDateString())) {
      const calBtn = el("button", "Add MOT due date to calendar", "cal-btn");
      calBtn.type = "button";
      calBtn.addEventListener("click", () => {
        const dt = m.expiry_date.replace(/-/g, "");
        const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//MOT History Check//EN",
          "BEGIN:VEVENT", "UID:" + dt + "-" + plate + "@mot-history-check.com",
          "DTSTART;VALUE=DATE:" + dt,
          "SUMMARY:MOT due — " + shownPlate,
          "DESCRIPTION:MOT expires today for " + shownPlate + ". Book the test in good time.",
          "BEGIN:VALARM", "TRIGGER:-P7D", "ACTION:DISPLAY", "DESCRIPTION:MOT due in 7 days", "END:VALARM",
          "END:VEVENT", "END:VCALENDAR"].join("\r\n");
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
        a.download = "mot-due-" + plate + ".ics";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      });
      out.append(calBtn);
    }

    if (!tests.length) {
      let msg = "No MOT tests recorded for this vehicle yet. It may be too new for its first MOT, exempt, or registered in Northern Ireland.";
      if (m.test_due_date && new Date(m.test_due_date) > new Date()) {
        msg = "No MOT tests recorded yet. First MOT due " + fmtDate(m.test_due_date) + ".";
      }
      out.append(el("p", msg));
    }

    // Full test history, newest first
    tests.forEach((t, i, arr) => {
      const row = el("div", undefined, "row");
      const left = el("div");
      const passed = String(t.test_result || "").toLowerCase() === "passed";
      left.append(
        el("strong", fmtDate(t.test_date) + " "),
        el("span", passed ? "Pass" : "Fail", "tag " + (passed ? "pass" : "fail"))
      );
      const miles = t.mileage && t.mileage.value ? Number(t.mileage.value).toLocaleString("en-GB") + " " + (t.mileage.unit || "miles") : "No reading";
      left.append(el("div", "Odometer: " + miles, "mono"));

      (Array.isArray(t.defects) ? t.defects : []).forEach(df => {
        const line = el("div", undefined, "cap" + (df.dangerous ? " fail" : ""));
        const label = DEFECT_LABELS[String(df.type || "").toLowerCase()] || titleCase(df.type || "Note");
        line.append(el("strong", label + ": "), document.createTextNode(String(df.text || "")));
        left.append(line);
      });

      const older = arr[i + 1];
      if (older && older.mileage && t.mileage &&
          Number(older.mileage.value) > Number(t.mileage.value) &&
          (older.mileage.unit || "miles") === (t.mileage.unit || "miles")) {
        left.append(el("div", "Mileage is lower than the previous test. Ask the seller to explain.", "flag"));
      }

      row.append(left);
      if (i === 0 && t.expiry_date) {
        row.append(el("div", "Expires " + fmtDate(t.expiry_date)));
      }
      out.append(row);
    });

    if (d.attribution) out.append(el("p", d.attribution, "cap chk-attr"));
  }

  function govukFallback(out) {
    const p = el("p", "The live lookup is having a problem right now. You can check free on the official GOV.UK service instead: ");
    const a = el("a", "GOV.UK MOT history");
    a.href = "https://www.gov.uk/check-mot-history";
    a.target = "_blank";
    a.rel = "noopener";
    p.appendChild(a);
    out.replaceChildren(p);
  }

  // "Try an example plate" links fill the form and run the check
  document.querySelectorAll(".try-reg").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const form = document.querySelector("form.check, form.check-compact");
      if (!form) return;
      const input = form.querySelector("input[name='reg'], #reg");
      if (input) input.value = link.getAttribute("data-reg") || "";
      form.scrollIntoView({ behavior: "smooth", block: "center" });
      if (form.requestSubmit) form.requestSubmit();
      else form.dispatchEvent(new Event("submit", { cancelable: true }));
    });
  });

  // Initialize all plate lookup forms on the page
  const forms = document.querySelectorAll("form.check, form.check-compact");

  forms.forEach(form => {
    const regInput = form.querySelector("input[name='reg'], #reg");
    const plateBox = form.querySelector(".plate");

    // Find or create result container
    let out = form.parentElement.querySelector("#result, .checker-result");
    if (!out) {
      out = el("div", undefined, "checker-result");
      out.setAttribute("role", "status");
      out.setAttribute("aria-live", "polite");
      form.parentElement.appendChild(out);
    }

    form.addEventListener("submit", async e => {
      e.preventDefault();
      if (!regInput) return;
      const plate = regInput.value.replace(/\s+/g, "").toUpperCase();
      if (plate.length < 2) return;

      if (plateBox) {
        plateBox.classList.remove("scan");
        void plateBox.offsetWidth; // retrigger reflow
        plateBox.classList.add("scan");
      }

      out.className = out.id === "result" ? "on" : "checker-result on";
      out.replaceChildren(el("p", "Checking " + plate + "…"));

      try {
        const r = await fetch(MOT_API_PROXY + "?reg=" + encodeURIComponent(plate));
        const data = await r.json().catch(() => null);

        if (!r.ok) {
          const code = data && data.error ? data.error.code : "";
          if (code === "not_found") {
            out.replaceChildren(el("p", "No vehicle found for " + plate + ". Check the registration number and try again."));
          } else if (code === "invalid_registration") {
            out.replaceChildren(el("p", "That does not look like a valid UK registration. Check the plate and try again."));
          } else if (code === "rate_limited") {
            out.replaceChildren(el("p", "Lots of people are checking right now. Wait a minute and try again."));
          } else {
            govukFallback(out);
          }
          return;
        }
        render(data, plate, out);
      } catch (_) {
        govukFallback(out);
      }
    });
  });
});
