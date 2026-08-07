# Design QA — HataM Home with Tehran hero

- Source visual truth: `/workspace/scratch/d1b3baf7ee31/upload/home.jpeg`
- Browser-rendered implementation: `/workspace/sites/hatam-mobile-app/implementation-home-tehran.jpg`
- Side-by-side evidence: `/workspace/sites/hatam-mobile-app/qa-home-tehran-comparison.jpg`
- Source pixels: 700 × 622.
- Implementation pixels / CSS viewport: 1348 × 926 at device scale 1.
- Normalization: the source was resized to the implementation width and north-cropped to the 1348 × 926 browser viewport for the comparison image.
- State: public Home `/`, default brand settings, Persian RTL, no active filter.

## Full-view comparison evidence

The browser-rendered Home preserves the selected reference composition: dark green night view of Tehran with Milad Tower on the left, gold/green header, centered Persian slogan, large light search field, compact filter controls, four translucent quick-action panels, and four featured-property cards below the hero. The website remains a desktop web experience; the phone app remains isolated at `/app`.

## Focused region comparison evidence

- Header: HATAM raster logo, navigation, account/avatar, favorites, and notification controls are present in the same hierarchy.
- Hero: the correct Tehran/Milad Tower raster asset is used as the full-bleed background; the exact slogan «مسیر روشن، کار جمع» is centered with its second phrase in gold.
- Search: search CTA, input, five filters, and the extra-filter action match the reference structure.
- Quick actions: exclusive advisor, visit request, AI valuation, and 360-degree visit are all present in matching glass panels.
- Listings: four cards with property photography and gold badges appear directly after the hero.

## Required fidelity surfaces

- Fonts and typography: Vazirmatn, RTL alignment, weight hierarchy, and line spacing match the Persian design direction; font family and global scale remain admin-controlled.
- Spacing and layout rhythm: the desktop layout follows the reference hierarchy and adapts fluidly at the wider browser viewport; header and hero no longer inherit conflicting styles from the former public page.
- Colors and visual tokens: deep green, panel green, gold, soft gold, cream, and muted text are mapped to the central brand variables.
- Image quality and asset fidelity: the supplied HATAM raster logo is used directly; the Tehran night hero is a dedicated 1820 × 864 WebP asset with Milad Tower positioned on the left.
- Copy and content: the official slogan and Persian real-estate labels match the reference.

## Interaction verification

- Smart search accepted «نیاوران», filtered the listing set to one matching card, and displayed the confirmation toast.
- `/app`, `/panel`, and `/admin` loaded independently from the public Home.
- `/app` retained its mobile runtime and mobile-specific layout.
- `/admin` retained centralized controls for name, slogan, logo, favicon, colors, font family, and font scale.
- No application-origin console errors were observed; only unrelated Cloud Browser extension metadata messages appeared.

## Comparison history

- Pass 1: the correct Home existed but used an interior-property photograph rather than the approved Tehran hero; the previous public layout also differed from the supplied mockup.
- Fix: restored the dedicated Tehran/Milad Tower Home experience and its four quick actions and featured listings.
- Pass 2: the global legacy `.site-header` rules still affected the restored header, hiding the logo and wrapping the account label.
- Fix: isolated and reset the Home header positioning/display; the logo and account block now align correctly.
- Pass 3: an extra hero eyebrow line not present in the reference caused above-the-fold drift.
- Fix: removed the extra line and recaptured the browser-rendered implementation.

## Findings

- No actionable P0, P1, or P2 findings remain.
- P3: the wider live desktop viewport creates more horizontal breathing room than the narrower supplied mockup; this is an expected responsive adaptation and preserves the same hierarchy.

## Implementation checklist

- [x] Restore the Tehran/Milad Tower hero on `/`.
- [x] Preserve the selected dark green and gold desktop design.
- [x] Keep the website, mobile app, user panel, and admin as separate routes.
- [x] Keep brand identity and typography connected to admin customization.
- [x] Verify search behavior, routes, browser rendering, and console state.

final result: passed
