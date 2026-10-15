# Project brief: MOT History Check (complete the whole site)

You are finishing a small static website. Read this whole file, then read `index.html` (the finished homepage). `index.html` is the design and tone source of truth. Build everything else to match it.

## 1. Goal

A free, trustworthy UK guide to checking a vehicle's MOT history by number plate. Two jobs:
1. Let a visitor type a plate and see the MOT history (via a small serverless proxy to the official DVSA API).
2. Teach them how to read the record, especially when buying a used car.

Audience: UK car owners and used-car buyers. Plain British English. No hype.

## 2. Hard constraints

- Static site on GitHub Pages at `https://cozyjournal.github.io/mot-history-check/`. No build step, no framework, no npm for the site itself. Plain HTML, CSS, JS.
- One shared stylesheet `assets/css/site.css` and one shared script `assets/js/site.js`. Move the CSS and JS out of `index.html` into these files and keep the look identical.
- Use relative paths so it works under the `/mot-history-check/` subpath.
- Only external requests allowed: Google Fonts (Overpass, Source Sans 3). Nothing else. No analytics, no trackers, no cookies, no localStorage.
- Every page: one `<h1>`, canonical URL, meta description, Open Graph tags, skip link, same header and footer as the homepage, visible keyboard focus, works at 360px width.
- Do not invent statistics. Every number must come from the fact sheet below or an official source linked on the page.

## 3. Design tokens (from index.html, do not change)

Look: futuristic and modern, dark only. A deep navy "void" background with a faint grid and a cyan glow top right, glass panels with thin blue borders, and the glowing number-plate input as the one memorable element. A cyan scanner line sweeps across the plate when the form is submitted (user-triggered motion only; respect `prefers-reduced-motion`).

- Colours: void `#070d1a`, panel `rgba(255,255,255,.045)`, line `rgba(140,180,255,.2)`, ink `#e9f0ff`, muted `#9aabc9`, cyan `#3de0ff`, plate yellow `#ffc800`, pass `#3ddc84`, fail `#ff6b6b`, warn `#ffc857`.
- Fonts: Sora (800 headings, 600 small headings), Figtree body, JetBrains Mono only for odometer readings and numbers.
- Panels: 14px radius, 1px line border, no drop shadows. Defect grades are rows with a coloured left border. Mileage is shown as the SVG trace chart.
- Do not add gradients on text, parallax, scroll animations, all-caps labels or extra accent colours.
- Sentence case everywhere. Buttons say what they do ("Check MOT history").
- `index-classic.html` is the old light design. Ignore it.

## 4. Files to create

```
index.html                       (exists, refactor to use shared css/js)
how-to-check-mot-history/index.html
mot-failure-reasons/index.html
mot-advisories-explained/index.html
when-is-my-mot-due/index.html
mot-cost/index.html
mot-exemptions/index.html
faq/index.html
about/index.html
contact/index.html
privacy-policy/index.html
404.html
robots.txt
sitemap.xml
assets/css/site.css
assets/js/site.js
assets/images/favicon.svg        (simple plate-yellow rounded square with "MOT")
assets/images/og.png             (1200x630: plate graphic + "Check MOT history")
worker/mot-proxy.js              (see section 7)
README.md                        (setup steps, see section 9)
```

Change the homepage nav from in-page anchors to real pages: How to check, Failure reasons, Advisories, MOT due, FAQ. Keep the plate checker on the homepage only, plus a compact version of it at the top of `how-to-check-mot-history`.

## 5. Page specs

Each guide page: 700 to 1,100 words, an intro answering the question in the first two sentences, H2 sections, a "Sources" list linking GOV.UK, a "Last reviewed: <Month Year>" line, links to 2 to 3 related pages, and `Article` plus `BreadcrumbList` JSON-LD (FAQPage JSON-LD where there is an FAQ block).

1. **how-to-check-mot-history**: step by step: get the plate, use the checker or GOV.UK, read the results. Explain the V5C point (results need only the plate, test location needs the 11-digit V5C reference). Mention recalls. Mention Northern Ireland has different coverage.
2. **mot-failure-reasons**: how the test is graded (advisory, minor, major, dangerous) and the main areas inspected (lights, tyres, brakes, suspension, steering, visibility, emissions, body and structure). Practical pre-test checks owners can do themselves (bulbs, wipers, washer fluid, tyre tread and condition, horn, seatbelts, warning lights). Do not quote percentage fail rates unless you add a dated official source.
3. **mot-advisories-explained**: what an advisory is, what "minor" means, how to decide what to fix, how to use repeated advisories when buying.
4. **when-is-my-mot-due**: first test timing (3 years GB, 4 years NI), then yearly; the one-month-minus-a-day early rule with a worked date example; what happens if it expires; how to check status; link to GOV.UK reminder service.
5. **mot-cost**: maximum fee for a car £54.85, many centres charge less, retest rules (describe only what GOV.UK states; verify before writing), why prices vary.
6. **mot-exemptions**: the rolling 40-year rule for vehicles not substantially changed; point out the owner must still keep the vehicle roadworthy; link GOV.UK.
7. **faq**: 15 questions, `<details>` accordion plus FAQPage JSON-LD. Include the five already in `index.html`.
8. **about**: who runs the site, why it exists, editorial policy (sources are GOV.UK and DVSA, corrections process), the independent-not-affiliated disclaimer. Leave a clearly marked `[ADD AUTHOR NAME]` placeholder.
9. **contact**: email link only (`[ADD EMAIL]` placeholder). No form, no tracking.
10. **privacy-policy**: plain English. The site sets no cookies and has no analytics. Plates entered are sent to the lookup proxy only to fetch the record, and are not stored. Mention Google Fonts requests. Add a `[CHECK WITH LEGAL IF NEEDED]` note at the top of the file as an HTML comment.

## 6. Fact sheet (verified against GOV.UK in October 2026; only use these)

- GOV.UK MOT history service is free and needs the number plate.
- Test results since 2005 for cars, motorcycles and vans; since 2018 for HGVs, trailers, buses and coaches; Northern Ireland since 2017.
- Test location and the failure/minor-problem detail: GOV.UK says to see where each test was done you need the 11-digit number from the V5C.
- The record can show if the vehicle has a manufacturer safety recall.
- First MOT: 3 years after first registration in England, Scotland, Wales; 4 years in Northern Ireland. Then every 12 months.
- Test up to a month (minus a day) before expiry and keep the same renewal date.
- Maximum fee for a car: £54.85.
- Driving without a valid MOT: fine up to £1,000.
- Driving in a dangerous condition is a separate offence: up to £2,500 and 3 penalty points.
- A vehicle that failed with a "dangerous" defect must not be driven on public roads, even if the previous MOT is still valid.
- Most vehicles first registered over 40 years ago and not substantially changed are exempt.

Anything not in this list: look it up on gov.uk and link it, or leave it out. Re-check these facts before publishing, because rules change.

**Never write:** "£800M odometer fraud", "450K monthly checks", "8 million used cars", any fail-rate percentage, "100% accurate", "official" about this site itself, or anything implying GOV.UK or the DVSA runs it.

## 7. Lookup proxy (`worker/mot-proxy.js`)

Browsers cannot hold the DVSA API key safely, so use a Cloudflare Worker.

Requirements:
- Route: `GET /?registration=AB12CDE`.
- Validate: uppercase, strip spaces, 2 to 8 alphanumeric characters, else return 400.
- Call the DVSA MOT History API server-side. **Read the current DVSA documentation first** for the exact endpoint, headers and auth flow (it may need an API key and an OAuth token). Do not guess these.
- Secrets in Worker environment variables (`DVSA_API_KEY` and whatever else the docs require). Never put them in the repo.
- CORS: allow only `https://cozyjournal.github.io`.
- Return the DVSA JSON unchanged on success, 404 if not found, 502 on upstream error.
- Cache successful responses for a short time (a few minutes) and add basic per-IP rate limiting.
- Do not log plates.

The front-end already expects this shape, used in `render()` in `index.html`: `make`, `model`, and `motTests[]` with `completedDate`, `testResult` ("PASSED"/"FAILED"), `expiryDate`, `odometerValue`, `odometerUnit`, `rfrAndComments[]` with `type` and `text`. If the real DVSA response differs, adapt `render()` in `assets/js/site.js`, not the Worker. Then set `MOT_API_PROXY` to the deployed Worker URL.

## 8. SEO and technical

- `sitemap.xml` listing every page; `robots.txt` pointing to it.
- One internal link from each guide to at least two others; breadcrumbs on guide pages.
- `og.png` per section is optional; one shared image is fine.
- `404.html` with the plate checker and links to the main guides.
- Images: only the favicon and og image. Add `width` and `height` to any image.

## 9. README.md must contain

1. How to deploy to GitHub Pages.
2. How to get a DVSA API key (link to the DVSA MOT History API page) and deploy the Worker with Wrangler.
3. Where to set `MOT_API_PROXY`.
4. The list of placeholders still to fill: author name, contact email, custom domain.
5. How to update the "Last reviewed" dates and re-verify the fact sheet.

## 10. Definition of done

- All pages exist, link to each other correctly under the repo subpath, and share one header, footer, CSS and JS.
- Lighthouse (mobile): Performance, Accessibility, Best Practices, SEO all 95 or above.
- No console errors. No requests other than Google Fonts (and the Worker, when configured).
- Passes keyboard-only navigation. Colour contrast meets WCAG AA.
- Every factual claim traces to the fact sheet or a linked official source.
- Placeholders are clearly marked and listed in README.md.
- Work through the pages in this order: refactor homepage, shared css/js, how-to-check, faq, remaining guides, legal pages, worker, README. Test after each step.
