// Set this to your serverless proxy URL (Cloudflare Worker) that adds your DVSA API key.
// Leave empty while the DVSA API key is pending; visitors will be directed to the official GOV.UK checker.
const MOT_API_PROXY = "";

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

  // Render real DVSA response
  function render(d, plate, outContainer) {
    outContainer.replaceChildren();
    const tests = (d.motTests || []).slice().sort((a, b) => new Date(a.completedDate) - new Date(b.completedDate));
    outContainer.append(el("h3", plate + " " + ([d.make, d.model].filter(Boolean).join(" "))));
    
    if (!tests.length) {
      outContainer.append(el("p", "No MOT tests found for this plate. It may be too new, exempt, or registered in Northern Ireland."));
      return;
    }

    tests.slice().reverse().forEach((t, i, arr) => {
      const row = el("div", undefined, "row");
      const left = el("div");
      const pass = String(t.testResult).toUpperCase() === "PASSED";
      
      left.append(el("strong", fmtDate(t.completedDate) + " "), el("span", pass ? "Pass" : "Fail", "tag " + (pass ? "pass" : "fail")));
      left.append(el("div", "Odometer: " + (t.odometerValue ? Number(t.odometerValue).toLocaleString("en-GB") + " " + (t.odometerUnit || "mi") : "No reading"), "mono"));
      
      (t.rfrAndComments || []).forEach(r => {
        left.append(el("div", r.type + ": " + r.text, "cap"));
      });

      const older = arr[i + 1];
      if (older && Number(older.odometerValue) > Number(t.odometerValue) && t.odometerUnit === older.odometerUnit) {
        left.append(el("div", "Mileage is lower than the previous test. Ask the seller to explain.", "flag"));
      }

      row.append(left);
      if (i === 0 && t.expiryDate) {
        row.append(el("div", "Expires " + fmtDate(t.expiryDate)));
      }
      outContainer.append(row);
    });
  }

  // Initialize all plate lookup forms on the page
  const forms = document.querySelectorAll("form.check, form.check-compact");

  forms.forEach(form => {
    const regInput = form.querySelector("input[name='reg'], #reg");
    const plateBox = form.querySelector(".plate");
    const noteEl = form.parentElement.querySelector(".note, #mode");
    
    // Find or create result container
    let out = form.parentElement.querySelector("#result, .checker-result");
    if (!out) {
      out = el("div", undefined, "checker-result");
      out.setAttribute("role", "status");
      out.setAttribute("aria-live", "polite");
      form.parentElement.appendChild(out);
    }

    if (!MOT_API_PROXY && noteEl) {
      noteEl.innerHTML = 'Direct lookup via API is coming soon. Entering your plate copies it and opens the official <a href="https://www.gov.uk/check-mot-history" target="_blank" rel="noopener">GOV.UK MOT history service</a>.';
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

      if (!MOT_API_PROXY) {
        try {
          await navigator.clipboard.writeText(plate);
        } catch (_) {}
        
        out.replaceChildren();
        const p = el("p", "Plate " + plate + " copied to clipboard! Direct lookup via API is coming soon. Opening the official GOV.UK checker now — simply paste your registration there.");
        const btn = el("p");
        const a = el("a", "Open GOV.UK MOT History Check ↗");
        a.href = "https://www.gov.uk/check-mot-history";
        a.target = "_blank";
        a.rel = "noopener";
        a.style.display = "inline-block";
        a.style.marginTop = "8px";
        btn.appendChild(a);
        out.append(p, btn);

        window.open("https://www.gov.uk/check-mot-history", "_blank", "noopener");
        return;
      }

      out.replaceChildren(el("p", "Scanning " + plate + "..."));

      try {
        const r = await fetch(MOT_API_PROXY + "?registration=" + encodeURIComponent(plate));
        if (r.status === 404) {
          out.replaceChildren(el("p", "No vehicle found for " + plate + ". Check the registration number and try again."));
          return;
        }
        if (!r.ok) throw new Error(r.status);
        const data = await r.json();
        render(data, plate, out);
      } catch (_) {
        out.replaceChildren(el("p", "The live lookup is currently unavailable. Please check directly on the official GOV.UK MOT history service: "));
        const fallbackLink = el("a", "GOV.UK MOT History");
        fallbackLink.href = "https://www.gov.uk/check-mot-history";
        fallbackLink.target = "_blank";
        fallbackLink.rel = "noopener";
        out.appendChild(fallbackLink);
      }
    });
  });
});
