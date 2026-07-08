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

## Before going live

- Replace `NMLS: [ADD COMPANY NMLS]` in the footer of `index.html` with the actual company NMLS number.
- Review all copy for state licensing and compliance requirements.

## Compliance note

This site is informational only and is not a commitment to lend. All copy avoids promises of approval, rates, or guaranteed financing.
