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
      motCard.append(el("span", (motValid ? "Expires " : "Expired ") + fmtDate(m.expiry_date), "chk-sub"));
    }
    cards.append(motCard);

    const tax = v.tax || d.tax || null;
    if (tax && tax.status) {
      const taxCard = el("div", undefined, "chk-card");
      taxCard.append(el("span", "Tax", "chk-label"));
      const taxed = String(tax.status).toLowerCase() === "taxed";
      taxCard.append(el("span", tax.status, "chk-big " + (taxed ? "pass" : "warn")));
      if (tax.due_date) taxCard.append(el("span", "Due " + fmtDate(tax.due_date), "chk-sub"));
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
    }
    if (bits.length) out.append(el("p", bits.join(" · "), "chk-facts"));

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
