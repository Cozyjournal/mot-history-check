# MOT History Check 🇬🇧

> **"Check any UK vehicle's MOT history — free guide"**

An ultra-fast, modern, mobile-responsive static website for UK car owners and used-car buyers. Built to educate motorists on navigating the official DVSA MOT history database, understanding pass/fail defect categories, avoiding common failure traps, calculating renewal deadlines, and protecting against odometer clocking fraud.

Optimized to rank on Google and AI answer engines (**ChatGPT**, **Perplexity**, **Google AI Overviews**) with high E-E-A-T signals for Google AdSense monetization.

---

## 🚀 Live Pages Structure

| Page | URL Path | Theme | Description |
| :--- | :--- | :--- | :--- |
| **Home** | `/` (`index.html`) | Futuristic Dark | Hero with mock UK plate input, live stats bar, glassmorphism feature cards, 3-step timeline, sample MOT transcript card, and key facts. |
| **How to Check** | `/how-to-check-mot-history/` | Clean Light | Step-by-step walkthrough of the official GOV.UK portal, line-by-line report guide, and mileage curve audit. |
| **Failure Reasons** | `/mot-failure-reasons/` | Clean Light | Top 10 failure reasons (lights, suspension, brakes, tyres, etc.), DIY checks, fix ideas, and interactive pre-test checklist. |
| **Advisories Explained** | `/mot-advisories-explained/` | Clean Light | Comparison of Advisory vs Minor vs Major vs Dangerous defects, common phrasing translations, and resale value impact. |
| **MOT Due Date** | `/when-is-my-mot-due/` | Clean Light | Interactive MOT due-date calculator, 3-year rule for new cars, 1-month early rule, and legal fines breakdown. |
| **FAQ** | `/faq/` | Clean Light | 15 authoritative answers to common MOT questions with accessible accordion markup. |
| **About Us** | `/about/` | Clean Light | Editorial policy, mission, E-E-A-T standards, and DVSA independence disclosure. |
| **Privacy Policy** | `/privacy-policy/` | Clean Light | UK Data Protection Act 2018 / UK GDPR compliance, cookie policy, and AdSense disclosures. |
| **Contact** | `/contact/` | Clean Light | Editorial contact information and official DVSA support routing notice. |

---

## 🎨 Design System

- **Homepage**: Futuristic dark theme with deep space background (`#050810` to `#0A0F1E`), neon cyan (`#00E5FF`) and violet (`#7C3AED`) accents, CSS-animated glowing orbs, glassmorphism cards, and pill-shaped gradient buttons.
- **Inner Pages**: Clean light theme with white background (`#FFFFFF`), dark navy headings (`#1A3A5C`), royal blue CTAs (`#2563EB`), and high-contrast readable typography (`#1F2937`).
- **Typography**: Google Fonts pairing — `Space Grotesk` (Headings) and `Inter` (Body).
- **Zero Heavy Frameworks**: Pure HTML5, modern CSS3, and <8KB vanilla JavaScript. Loads in under 200ms on CDN edges.

---

## 🔍 SEO, AEO & GEO Architecture

- **AEO (Answer Engine Optimization)**: Every section opens with a 40–50 word direct definition block winning featured snippets and voice search queries.
- **GEO (Generative Engine Optimization)**: Verifiable facts, DVSA Class 4 statistics, and Section 47 Road Traffic Act 1988 citations for AI engine attribution.
- **Structured Data (JSON-LD)**:
  - `WebSite` & `Organization` schemas
  - `Article` schemas on all pages
  - `HowTo` schema on the step-by-step guide
  - `FAQPage` schema on the FAQ page (15 Q&As) and Home preview
  - `BreadcrumbList` on all inner pages
  - `ItemList` schema on Top 10 failure reasons
- **Search Engine Assets**: [`sitemap.xml`](sitemap.xml), [`robots.txt`](robots.txt), and [`_headers`](_headers) for Cloudflare Pages.

---

## 🛡️ Consumer Trust & Compliance

- **No Fake Lookups**: Strict consumer integrity — the website does not simulate a lookup tool or harvest vehicle data. All actions guide users directly to the official [`GOV.UK MOT History Service`](https://www.gov.uk/check-mot-history).
- **Prominent Disclaimer**: Present in the footer of every page:
  > *"Disclaimer: Independent guide. Not affiliated with GOV.UK / DVSA. MOT History Check is an educational consumer guide. All vehicle data and roadworthiness records are provided solely by official GOV.UK digital services."*

---

## ⚡ Deployment to Cloudflare Pages

This repository is ready to deploy on **Cloudflare Pages** with zero build configuration:

1. Log into your [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Navigate to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Select the `cozyjournal/mot-history-check` repository.
4. Configure the deployment:
   - **Framework preset**: `None`
   - **Build command**: *(leave blank)*
   - **Build output directory**: `/` (root)
5. Click **Save and Deploy**.
