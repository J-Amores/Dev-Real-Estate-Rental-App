# Product

## Register

product

## Users

**Primary: Property managers (small-scale hosts).** Operator mindset, working at a desk, often juggling 1–20 listings rather than a corporate portfolio. Their job is to keep listings accurate, photogenic, and findable, and to move applications through review without dread. They're closer to an Airbnb host than a Yardi admin.

**Secondary: Tenants searching for a place to live.** Consumer mindset, mobile-likely, comparing listings on a map, evaluating fit, and submitting applications. They inherit the same system, but their surfaces (search, public detail page) should read warmer and more spacious than the manager dashboard.

## Product Purpose

A two-sided rental marketplace where small-scale property managers list properties and review applications, and tenants find homes via map-based search and one-click favorites. Success is a manager who logs in, gets work done, and leaves without dreading the tool, and a tenant who can compare and apply without fighting the UI. We are intentionally not building enterprise property-management software.

## Brand Personality

Warm, trustworthy, human. The operator dashboard should feel like a calm, well-lit workspace, not a control panel. Voice is plain and direct, sentence-case, conversational without being cute. Errors apologize without theater. Empty states explain what to do next instead of decorating an absence. Confidence comes from craft and clarity, not from heavy chrome or dramatic color.

## Anti-references

- **Legacy property-management SaaS** (Yardi, Buildium, RentManager, AppFolio): dated table grids, navy + orange palettes, cluttered toolbars, modal-on-modal flows, every action hidden inside a top-bar dropdown. This is the exact gravity well to escape.
- **Aggressive consumer listings** (Zillow, Redfin): high-saturation CTAs, banner-heavy density, ad chrome competing with content. Wrong temperature, wrong tone.
- **Generic Bootstrap admin themes**: cards everywhere, side-stripe accents on alerts, gradient hero metrics, repeated icon-and-heading grids. The AI-slop default we must not collapse to.
- **Crypto / "serious-mode" dark dashboards**: neon on black, terminal vibes, dark-by-reflex. Our scene is daytime work, not 2am ops.

## Design Principles

1. **Host-grade, not landlord-grade.** Frame every screen as if a small-scale host were using it to care for properties, not as a portfolio operator chasing efficiency. When in doubt, choose the more human option.
2. **Calm operator surface, warm tenant surface.** The dashboard reads quiet and dependable; the public listing and search surfaces (Phase 5+) read hospitable and photo-forward. Same tokens, two temperatures, one identity.
3. **Words do most of the warmth.** Personality lives in copy more than color. Sentence-case labels, helpful empty states, plain-language errors. No jargon, no exclamation marks, no marketing voice in the dashboard.
4. **Density only where it pays.** Forms, tables, and dashboards earn density because real work happens there. Marketing and public detail pages breathe. Same system, different rhythm per surface.
5. **The property is the hero.** Photos, addresses, and prices win the visual hierarchy. UI chrome (nav, headers, action buttons) recedes. Never let the toolbar outshine the listing.

## Accessibility & Inclusion

- **Target: WCAG 2.2 AA**, including 4.5:1 contrast for body text, visible focus rings on every interactive element, full keyboard reachability, and form fields with explicit labels (no placeholder-as-label).
- **Reduced motion:** respect `prefers-reduced-motion` everywhere; replace movement with crossfades or instant transitions when set. No motion is ever load-bearing.
- **Touch targets:** minimum 44×44px on tenant-facing surfaces (mobile-likely); minimum 32×32px on the manager dashboard (desktop-likely, finer pointer).
- **Color:** never encode information by color alone (application status, error states, etc.); always pair with shape, label, or icon.
