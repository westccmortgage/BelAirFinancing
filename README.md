# Bel Air Financing

**by West Coast Capital Mortgage**

A premium static landing page for BelAirFinancing.com — mortgage strategy for high-value homes and complex borrowers across Bel Air, Beverly Hills, Holmby Hills, Brentwood, Pacific Palisades, Malibu, Manhattan Beach, and the Los Angeles Westside.

## Stack

Plain HTML, CSS, and JavaScript. No frameworks, no build step.

| File | Purpose |
| --- | --- |
| `index.html` | Page markup and content |
| `styles.css` | All styling (warm ivory / deep charcoal / soft gold palette) |
| `script.js` | Header state, mobile navigation, scroll reveal, form handling |
| `netlify.toml` | Netlify publish directory and security headers |
| `sitemap.xml` | XML sitemap for search engines |
| `robots.txt` | Crawler rules and sitemap location |
| `<area>/index.html` | Seven area pages (bel-air, beverly-hills, holmby-hills, brentwood, pacific-palisades, malibu, manhattan-beach) |
| `guides/<slug>/index.html` | Educational guides (down-payment, fha-vs-conventional, pre-approval) |
| `review/index.html` | "Share Your Experience" page (noindex) with QR code |
| `REVIEWS.md` | Google review request templates and instructions |

## Local preview

Open `index.html` directly in a browser, or serve the folder:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

Note: the lead form relies on Netlify Forms and only records submissions when the site is deployed on Netlify.

## Deploying to Netlify

1. Connect this repository in the Netlify dashboard (or drag-and-drop the folder).
2. No build command is needed; the publish directory is the repository root (set in `netlify.toml`).
3. After the first deploy, the `financing-review` form appears under **Forms** in the Netlify dashboard. Configure email notifications there.

## Lead form

The form is named `financing-review` and uses Netlify's static form detection (`data-netlify="true"`, hidden `form-name` input, honeypot field). Submissions are confirmed inline via JavaScript, with a standard POST fallback.

## Google Search setup

1. Attach the custom domain `belairfinancing.com` in Netlify (Domain management) so the canonical URL, sitemap, and robots.txt all point at the real domain.
2. Open [Google Search Console](https://search.google.com/search-console) and add `belairfinancing.com` as a **Domain** property. Verify via the DNS TXT record Google provides (add it wherever the domain's DNS is managed — Netlify DNS if you delegate the domain there).
3. In Search Console, go to **Sitemaps** and submit `https://belairfinancing.com/sitemap.xml`.
4. Use **URL Inspection** on `https://belairfinancing.com/` and click *Request Indexing* to speed up the first crawl.
5. Expect indexing within days; ranking for local luxury-mortgage queries builds over time.

The page already includes a canonical tag, Open Graph / Twitter metadata, and `FinancialService` structured data (JSON-LD) for richer search results.

## Before going live

- Verify the licensing numbers in the footer of `index.html` against NMLS Consumer Access and CA DRE records before publishing:
  - West Coast Capital Mortgage Inc. — NMLS #2817729
  - CA DRE Corporation License #02440065
  - Anatoliy Kanevsky — NMLS #2775380
  - California Real Estate Broker DRE #01385024
- Review all copy for state licensing and compliance requirements.

## Compliance note

This site is informational only and is not a commitment to lend. All copy avoids promises of approval, rates, or guaranteed financing.
