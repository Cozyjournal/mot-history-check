# MOT History Check

A free, trustworthy UK consumer guide and vehicle inspection lookup tool for checking vehicle MOT history by registration plate.

- **Production URL:** `https://cozyjournal.github.io/mot-history-check/`
- **Design System:** Dark futuristic void theme (`#070d1a`), glowing number plate scanner, glass panels.
- **Tech Stack:** Plain static HTML5, CSS3, modern Vanilla JavaScript (no build tools, no frameworks, zero runtime dependencies).

---

## 1. How to Deploy to GitHub Pages

This repository is built as a static site that runs natively on GitHub Pages without any compilation or build step.

1. Push this repository to your GitHub account (branch `main`):
   ```bash
   git push origin main
   ```
2. In your GitHub repository, open **Settings** &rarr; **Pages**.
3. Under **Build and deployment**:
   - **Source:** Deploy from a branch
   - **Branch:** `main` / `/ (root)`
4. Click **Save**. Your site will be live at:
   `https://<your-username>.github.io/mot-history-check/`

> **Note on relative paths:** All asset and navigational links use strictly relative paths (e.g. `assets/...` or `../assets/...`), ensuring full compatibility under the GitHub Pages subpath.

---

## 2. Setting Up the DVSA API & Deploying the Serverless Proxy

The front-end client cannot hold private API credentials securely. A lightweight serverless proxy is included in `worker/mot-proxy.js` to run on Cloudflare Workers.

### Step A: Request a DVSA MOT History API Key
1. Visit the official Driver and Vehicle Standards Agency (DVSA) Trade API registration page:
   [GOV.UK DVSA MOT History API Documentation](https://www.gov.uk/guidance/mot-history-api)
2. Follow the onboarding instructions on the DVSA Developer Portal to generate your `x-api-key`.

### Step B: Deploy the Worker with Wrangler
1. Install the Cloudflare Wrangler CLI (if not already installed):
   ```bash
   npm install -g wrangler
   ```
2. Log in to your Cloudflare account:
   ```bash
   wrangler login
   ```
3. Set your secret DVSA API key as an encrypted environment secret (never commit secrets to git):
   ```bash
   wrangler secret put DVSA_API_KEY
   ```
   *(When prompted, paste your DVSA API key)*.
4. Deploy the worker:
   ```bash
   wrangler deploy worker/mot-proxy.js --name mot-history-proxy
   ```

---

## 3. Where to Set `MOT_API_PROXY`

Once your Cloudflare Worker is deployed, copy its public URL (e.g., `https://mot-history-proxy.<your-subdomain>.workers.dev`).

Open [`assets/js/site.js`](file:///assets/js/site.js) and update line 3:

```javascript
// Before (live lookup pending, sends visitor to GOV.UK):
const MOT_API_PROXY = "";

// After (live lookup active):
const MOT_API_PROXY = "https://mot-history-proxy.<your-subdomain>.workers.dev";
```

When `MOT_API_PROXY` is empty, the site gracefully falls back to copying the entered plate and opening the official GOV.UK MOT history checker. When configured, it automatically fetches and renders real DVSA records directly into the UI.

---

## 4. Placeholders Still to Fill

The following placeholders are clearly marked across the project files and should be updated before public promotion:

| Placeholder | Locations | Purpose |
| :--- | :--- | :--- |
| `[ADD AUTHOR NAME]` | `about/index.html` | The named author or organisation publishing the guide. |
| `[ADD EMAIL]` | `contact/index.html`, `privacy-policy/index.html` | Editorial contact and feedback email address. |
| Custom Domain | `sitemap.xml`, canonical tags in all `.html` | Optional: Update if attaching a custom apex domain. |

---

## 5. How to Update "Last Reviewed" Dates & Re-Verify Fact Sheet

Automotive testing regulations, maximum statutory fees, and exemption windows are periodically updated by Parliament and the DVSA.

To perform a scheduled review:
1. Cross-reference the [GOV.UK MOT Testing Guide](https://www.gov.uk/getting-an-mot) and [DVSA Manual](https://www.gov.uk/guidance/mot-inspection-manual-for-cars-and-passenger-vehicles) for any regulatory changes.
2. Verify the statutory maximum fee (currently £54.85 for Class 4 passenger cars).
3. Update the rolling 40-year historic exemption cutoff (e.g., in 2026: vehicles registered in 1986 or earlier; in 2027: 1987 or earlier).
4. Update the "Last reviewed: <Month Year>" text in the headers and footers across all `.html` files.

---

## 6. Directory Structure

```
├── index.html                        # Homepage with glowing plate scanner
├── 404.html                          # 404 error page with plate checker
├── robots.txt                        # Search crawler directives
├── sitemap.xml                       # XML sitemap of all 11 site pages
├── README.md                         # Project documentation and setup guide
├── _headers                          # Cloudflare / Pages security headers
│
├── how-to-check-mot-history/
│   └── index.html                    # Step-by-step check guide + compact plate checker
├── mot-failure-reasons/
│   └── index.html                    # Defect severity guide & DIY pre-test checklist
├── mot-advisories-explained/
│   └── index.html                    # Understanding advisories, minor defects & buying tips
├── when-is-my-mot-due/
│   └── index.html                    # Due date rules, worked date example & reminders
├── mot-cost/
│   └── index.html                    # Maximum statutory fees & 10-day retest rules
├── mot-exemptions/
│   └── index.html                    # 40-year historic vehicle rolling exemption rules
├── faq/
│   └── index.html                    # 15 questions with details accordion & JSON-LD
├── about/
│   └── index.html                    # Mission, editorial standards & author credentials
├── contact/
│   └── index.html                    # Direct editorial email contact
├── privacy-policy/
│   └── index.html                    # Zero-cookie, privacy-first data handling policy
│
├── assets/
│   ├── css/
│   │   └── site.css                  # Shared stylesheet with dark theme design tokens
│   ├── js/
│   │   └── site.js                   # Shared lookup script, clipboard helper & renderer
│   └── images/
│       ├── favicon.svg               # Yellow rounded plate favicon
│       └── og.png                    # 1200x630 Open Graph preview image
│
└── worker/
    └── mot-proxy.js                  # Cloudflare Worker proxy for DVSA Trade API
```
