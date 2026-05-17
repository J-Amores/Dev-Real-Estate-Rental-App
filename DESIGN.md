---
name: Real Estate Marketplace
description: Two-sided rental marketplace; warm, host-grade operator software.
colors:
  accent-evergreen: "oklch(38% 0.08 165)"
  accent-evergreen-deep: "oklch(30% 0.08 165)"
  accent-evergreen-soft: "oklch(94% 0.02 165)"
  surface-paper: "oklch(98% 0.004 100)"
  surface-panel: "oklch(95% 0.006 90)"
  surface-sunk: "oklch(92% 0.008 85)"
  ink: "oklch(20% 0.012 160)"
  ink-soft: "oklch(38% 0.012 160)"
  ink-faint: "oklch(58% 0.012 160)"
  divider: "oklch(88% 0.008 90)"
  signal-success: "oklch(42% 0.10 150)"
  signal-warning: "oklch(60% 0.12 70)"
  signal-danger: "oklch(50% 0.16 25)"
typography:
  display:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(2rem, 4.5vw, 3.25rem)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.005em"
  caption:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.005em"
rounded:
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "14px"
  xl: "20px"
  photo: "16px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  base: "16px"
  lg: "24px"
  xl: "32px"
  "2xl": "48px"
  "3xl": "80px"
components:
  button-primary:
    backgroundColor: "{colors.accent-evergreen}"
    textColor: "{colors.surface-paper}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.accent-evergreen-deep}"
    textColor: "{colors.surface-paper}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
  button-secondary:
    backgroundColor: "{colors.surface-panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
    typography: "{typography.label}"
  button-secondary-hover:
    backgroundColor: "{colors.surface-sunk}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
    typography: "{typography.label}"
  button-danger:
    backgroundColor: "{colors.signal-danger}"
    textColor: "{colors.surface-paper}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
    typography: "{typography.label}"
  input:
    backgroundColor: "{colors.surface-sunk}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
    typography: "{typography.body}"
  input-focus:
    backgroundColor: "{colors.surface-paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
  card-listing:
    backgroundColor: "{colors.surface-paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "16px"
  card-form:
    backgroundColor: "{colors.surface-paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "24px"
  chip-status-neutral:
    backgroundColor: "{colors.surface-sunk}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.xs}"
    padding: "4px 8px"
    typography: "{typography.caption}"
  chip-status-approved:
    backgroundColor: "{colors.accent-evergreen-soft}"
    textColor: "{colors.accent-evergreen-deep}"
    rounded: "{rounded.xs}"
    padding: "4px 8px"
    typography: "{typography.caption}"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
    typography: "{typography.label}"
  nav-item-active:
    backgroundColor: "{colors.accent-evergreen-soft}"
    textColor: "{colors.accent-evergreen-deep}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
    typography: "{typography.label}"
  polaroid-marker:
    backgroundColor: "{colors.surface-paper}"
    textColor: "{colors.ink-soft}"
    rounded: "0px"
    padding: "6px 6px 24px"
    typography: "{typography.caption}"
---

# Design System: Real Estate Marketplace

## 1. Overview

**Creative North Star: "The Hospitable Operator"**

Imagine the back office of a small bed-and-breakfast: warm light through a window, dark wood desk, a tidy stack of paperwork, and tools that respect the people whose homes they manage. That is the surface we are building. The dashboard is restrained and precise where work happens (forms, tables, filters) and breathes where it does not (lists, listings, headers). Color is doled out sparingly: a single deep evergreen for action, cream and warm-ash neutrals for everything else, plus three signal colors used only when their meaning is structural (success, warning, danger). The system reads professional, never industrial.

What this is not: the navy-and-orange of legacy property-management SaaS, the banner-density of consumer real-estate portals, the gradient hero-metric template of generic Bootstrap admins, or the neon-on-black of crypto dashboards. The scene is daytime work in a well-lit room, and the visual language commits to that scene without apology.

**Key Characteristics:**
- **Light theme only.** No dark mode by default; the scene is daytime work in good light.
- **Warm tonal stack.** Cream paper, warm-ash panels, deep ink text. Neutrals are tinted toward the green/yellow axis; nothing is pure gray.
- **Single accent.** Hospitable Evergreen on ≤10% of any screen, reserved for action: primary buttons, active nav, focus rings, link text.
- **Mixed shape language.** Tight 6–8px corners on inputs and buttons; soft 14–16px on cards and photo crops. Forms feel precise; surfaces feel hospitable.
- **Flat by default.** Depth comes from tonal layering between Cream Paper, Warm Panel, and Sunk Surface. Shadows appear only on overlays.
- **Inter, monoculture.** One typeface, full weight range, tabular numerics on every column of numbers.
- **Brand surfaces have permission.** Marketing pages (landing, future campaign pages) and auth-gate surfaces (`/signin`, `/signup`) may exceed dashboard restraint with first-paint reveals (`duration-hero`) and the sharp-cornered Polaroid pattern. The dashboard never inherits these.

## 2. Colors: The Hospitable Operator Palette

A warm-leaning, low-chroma palette that lets photographs of properties carry the visual energy. The accent stays out of the way until it is needed; the neutrals do the daily work.

### Primary

- **Hospitable Evergreen** (`oklch(38% 0.08 165)` ≈ #3e6b58): The single accent. Used on primary buttons, active navigation backgrounds, focus rings, link text, and selected-state outlines. Reserved for action, never decoration.
- **Deep Cellar Evergreen** (`oklch(30% 0.08 165)` ≈ #2c5347): Hover and pressed states for primary buttons; active-nav text on top of the soft accent fill.
- **Mossy Soft Evergreen** (`oklch(94% 0.02 165)` ≈ #d9e7df): Selected-row backgrounds, active-nav fill, the "approved" application chip background.

### Neutral

- **Cream Paper** (`oklch(98% 0.004 100)` ≈ #fbfaf6): Base page surface. Tinted slightly warm; never `#fff`.
- **Warm Panel** (`oklch(95% 0.006 90)` ≈ #f3f0ea): Sidebars, secondary surfaces, secondary buttons at rest. The "stepped down" panel layer.
- **Sunk Surface** (`oklch(92% 0.008 85)` ≈ #e7e3da): Input field interiors at rest, hover states on ghost buttons, neutral chip backgrounds, table-row hover.
- **Deep Ink** (`oklch(20% 0.012 160)` ≈ #2a3331): Body text, headings, primary icon strokes.
- **Soft Ink** (`oklch(38% 0.012 160)` ≈ #535f5b): Secondary text, captions, inactive nav.
- **Faint Ink** (`oklch(58% 0.012 160)` ≈ #828b87): Placeholder text, disabled labels, low-priority dividers.
- **Hairline Divider** (`oklch(88% 0.008 90)` ≈ #d8d4c8): Borders, table dividers, separator lines. 1px only, never wider.

### Tertiary (signals, not decoration)

- **Approved Sage** (`oklch(42% 0.10 150)` ≈ #4d7e5b): Application approved, listing live, success toasts.
- **Pending Amber** (`oklch(60% 0.12 70)` ≈ #b48238): Application pending, draft listings, warnings.
- **Withdrawn Brick** (`oklch(50% 0.16 25)` ≈ #b85a3e): Destructive actions (delete property), application denied, error states.

### Named Rules

**The One Voice Rule.** Hospitable Evergreen is used on ≤10% of any given screen. Its rarity is what makes it read as action. If two regions both shout in evergreen, neither is heard.

**The Tinted Neutral Rule.** No pure `#fff`, no pure `#000`, no pure gray. Every neutral carries chroma 0.004–0.012 toward the warm-green axis. The warmth holds the system together; the moment a neutral goes cold, the design reads SaaS.

**The Color-Plus-Shape Rule.** Status is never encoded by color alone. Success pairs with a check, warning with a clock, danger with a stroke icon. Color is the loud half; the icon and label do the work for users with low color vision.

## 3. Typography

**Display, Headline, Title, Body, Label, Caption Font:** Inter, with `system-ui, -apple-system, sans-serif` fallback. Loaded via `next/font/google` with `cv11` (single-storey 'a') and `ss03` (curved-leg 'l') opentype features for a slightly more humanist, less geometric feel. Tabular numerals (`font-feature-settings: "tnum"`) on every price, count, or column of digits.

**Character:** A monoculture by design. Inter's neutrality is the canvas; warmth comes from copy and color, not from the typeface. The opentype features lift it a half-step toward humanist without sacrificing operator-tool clarity.

### Hierarchy

- **Display** (Inter, 600, `clamp(2rem, 4.5vw, 3.25rem)`, 1.05, -0.02em): Public marketing-side hero only. Never used in the dashboard.
- **Headline** (Inter, 600, 1.5rem / 24px, 1.25, -0.015em): Page titles in the dashboard ("Properties", "Settings"), property names on detail pages.
- **Title** (Inter, 600, 1.125rem / 18px, 1.35, -0.01em): Card titles, section headers within a page, form section labels.
- **Body** (Inter, 400, 0.9375rem / 15px, 1.55, normal): Default paragraph and prose. **Cap measure at 65–75ch.**
- **Label** (Inter, 500, 0.8125rem / 13px, 1.4, +0.005em): Form labels, button text, navigation items, table column headers. **Sentence case.**
- **Caption** (Inter, 400, 0.75rem / 12px, 1.4, +0.005em): Helper text, metadata (timestamps, counts), chip text.

### Named Rules

**The Sentence-Case Rule.** All UI labels, buttons, navigation items, and column headers are sentence case. ALL CAPS is forbidden in product surfaces. This is the single largest reason the system reads warm instead of corporate.

**The Tabular-Numerics Rule.** Anywhere numbers stack vertically (price columns, application counts, dates), the typography enables `font-feature-settings: "tnum"`. Misaligned digits in a table cell read as broken software.

**The 65ch Rule.** Body prose is capped at 65–75 characters per line. Long-form copy in dashboard surfaces (descriptions, terms) wraps inside a constrained measure even when the parent column is wider.

## 4. Elevation

The system is **flat by default**. Depth comes from tonal layering, three steps of warm-tinted neutrals (Cream Paper → Warm Panel → Sunk Surface), not from shadow. A page with no shadows but careful tonal stacking still reads as a hierarchy of layers. Shadows are reserved for things that genuinely float over content: dropdowns, popovers, and the rare modal.

### Shadow Vocabulary

- **Hairline Edge** (`box-shadow: 0 0 0 1px oklch(20% 0.012 160 / 0.08), 0 1px 0 oklch(20% 0.012 160 / 0.04)`): Used on raised cards in dense lists where tonal layering alone is not enough. Subtle outline plus a 1px ground line; reads as a held element, not a floating one.
- **Floating** (`box-shadow: 0 12px 28px oklch(20% 0.012 160 / 0.08), 0 2px 6px oklch(20% 0.012 160 / 0.06)`): Dropdowns, popovers, autocomplete menus, sticky toolbar shadows that appear on scroll.
- **Modal** (`box-shadow: 0 24px 64px oklch(20% 0.012 160 / 0.18), 0 4px 12px oklch(20% 0.012 160 / 0.10)`): Modals only. And modals are the lazy answer; exhaust inline alternatives first.
- **Polaroid** (`box-shadow: 0 1px 2px oklch(20% 0.012 160 / 0.06), 0 4px 12px oklch(20% 0.012 160 / 0.08)`): Brand-surface only. Print-edge cards held above the beige globe surface; softer than Floating, never used on overlays.

### Named Rules

**The Flat-By-Default Rule.** Cards and surfaces are flat at rest. Reaching for a shadow to "make something pop" almost always means tonal layering or a hairline divider was the right answer.

**The Shadow-As-Lift Rule.** Shadow appears only when an element genuinely lifts off the page (overlay, popover, dropdown). Decorative shadows on resting cards are forbidden.

## 5. Components

### Buttons

- **Shape:** 6px radius (rounded.sm). Buttons are precise affordances; they do not adopt the warmer 14–16px radii of the surface.
- **Primary:** Hospitable Evergreen background, Cream Paper text, 10px × 16px padding, label typography. Hover steps to Deep Cellar Evergreen with a 200ms `cubic-bezier(0.32, 0.72, 0, 1)` background-color transition. `:focus-visible`: 2px Hospitable Evergreen ring at 2px offset. Active: instant press to Deep Cellar Evergreen, no scale transform.
- **Secondary:** Warm Panel background, Deep Ink text, same padding. Hover steps to Sunk Surface. Used for tertiary CTAs and "Cancel" beside a primary.
- **Ghost:** Transparent background, Soft Ink text, 8px × 12px padding. Hover gets Sunk Surface background. Used for low-importance actions inside dense surfaces (table rows, card headers).
- **Danger:** Withdrawn Brick background, Cream Paper text, same shape and padding as primary. Always confirm-then-execute for destructive actions.

### Inputs

- **Style:** Sunk Surface background at rest, 1px Hairline Divider border, 6px radius, 10px × 12px padding, body typography. Labels sit above the input; never inside as a placeholder.
- **Focus:** 2px Hospitable Evergreen ring (offset 0, flush), background steps up to Cream Paper. The contrast between sunk-at-rest and paper-at-focus replaces the more common border-color shift.
- **Error:** Border swaps to Withdrawn Brick at 2px; helper text appears below in caption typography, also Withdrawn Brick. Error icons live left of the helper text, never inside the input.
- **Disabled:** Background drops to Warm Panel, text uses Faint Ink, cursor `not-allowed`.

### Cards

- **Listing card:** Cream Paper background, 14px radius (rounded.lg), 16px padding, 1px Hairline Divider border. Photo crop sits inside at 16px radius (rounded.photo), slightly tighter than the card itself, so the photo reads as a held element rather than flush. Hover: cursor pointer; no shadow, no transform; subtle background-tint shift only.
- **Form card:** Cream Paper background, 14px radius, 24px padding (one step more breathing room than the listing card). Used for `/dashboard/settings`, `/dashboard/properties/new`, `/dashboard/properties/[id]/edit`.
- **No nested cards.** A card inside a card is always wrong; for internal structure, use spacing and headings instead of another bordered surface.

### Navigation (Sidebar)

- **Style:** Warm Panel background, full-height sidebar, 16px padding, 4px gap between items.
- **Section header:** Label typography, Soft Ink, sentence case, 12px × 8px padding, no background. Replaces the current `text-gray-500 uppercase tracking-wide` treatment in `components/sidebar.tsx`.
- **Default item:** Soft Ink text, transparent background, 8px × 12px padding, 6px radius.
- **Hover:** Sunk Surface background, Deep Ink text. 120ms transition.
- **Active:** Mossy Soft Evergreen background, Deep Cellar Evergreen text. **The current `bg-gray-900 text-white` active treatment is forbidden going forward.**

### Chips / Status pills

- **Shape:** 4px radius (rounded.xs), 4px × 8px padding, caption typography.
- **Neutral:** Sunk Surface background, Soft Ink text. Property type, amenity tags.
- **Approved:** Mossy Soft Evergreen background, Deep Cellar Evergreen text, leading check icon.
- **Pending:** Pending Amber at low opacity background, Pending Amber text, leading clock icon.
- **Denied:** Withdrawn Brick at low opacity background, Withdrawn Brick text, leading X icon.
- Color-plus-icon, always (the Color-Plus-Shape Rule).

### Tables

- **Style:** No vertical dividers; horizontal Hairline Divider between rows only. Cream Paper background, headers in Label typography with Soft Ink, body cells in Body typography with Deep Ink. Numeric columns right-aligned with tabular numerics. Row height ≥48px to keep ample target size even on a desktop manager dashboard.
- **Hover:** Row gets Warm Panel background. No outline, no shadow.

### Property Listing (signature component)

The listing card is the system's centerpiece. Photo (16:10 crop, 16px radius), then title (Title typography), then a single metadata row (price tabular-numeric, separator dot, neighborhood), then a chip row (3 amenity chips max, +N overflow), then the action zone (Edit + Delete on manager surface, Favorite + Apply on tenant surface). Photos load through `next/image`; broken photos swap to `/placeholder.jpg` via `<img onError>`. The chrome around the photo recedes; the photo wins.

### Polaroid marker (brand surface only)

The single sharp-edged component in the system. A small `<a>`-wrapped photo + caption used on the landing globe to preview cities, tilted ±8°. Print-edge intentional: `border-radius: 0`, 1px Hairline Divider border, Polaroid shadow. Image and frame are flush; no inner radius, no inner padding around the photo on the print side. Caption uses Caption typography in Soft Ink. Hover: `transform: scale(1.05)` over 120ms `ease-out-quart`, disabled under `prefers-reduced-motion`. Focus: 2px Hospitable Evergreen ring at 4px offset (the tilt forces a wider offset to clear the rotated edge). Minimum 48×48 touch target on the `<a>` wrapper.

Reserved for brand surfaces (landing, auth-gate pages, future campaign pages); never used on product surfaces where the mixed-corner rule applies.

## 6. Do's and Don'ts

### Do
- **Do** tint every neutral toward warm green/yellow (chroma 0.004–0.012). Pure gray is forbidden.
- **Do** reserve Hospitable Evergreen for action and active state. Never decorative.
- **Do** use sentence case for every UI label, button, and column header.
- **Do** pair every status color with an icon (check, clock, X). Color alone never carries meaning.
- **Do** cap body prose at 65–75ch even inside wide containers.
- **Do** prefer tonal layering (Cream Paper → Warm Panel → Sunk Surface) for depth. Reach for shadow only when something actually floats.
- **Do** enable tabular numerics on every column of numbers.
- **Do** label inputs above the field. Placeholder text is never the label.
- **Do** show focus rings: visible 2px Hospitable Evergreen rings on every interactive element.
- **Do** respect `prefers-reduced-motion`: replace transitions with crossfades or instant changes.

### Don't
- **Don't** use `#fff` or `#000`, ever. Tint every neutral; black and white have no place here.
- **Don't** introduce a second accent color. Hospitable Evergreen is the only voice.
- **Don't** use side-stripe borders (`border-left` greater than 1px) on cards, alerts, callouts, or list items. Forbidden across the system.
- **Don't** use gradient text (`background-clip: text` over a gradient). The single solid color does the work.
- **Don't** use glassmorphism or backdrop-filter for decorative effect. Tonal layering replaces it.
- **Don't** build a hero-metric template (big number + label + supporting stats + gradient accent). It is the SaaS cliché this project is rejecting.
- **Don't** repeat identical card grids (same-sized cards with icon + heading + text) across a page. Vary the rhythm.
- **Don't** reach for a modal first. Inline editing, slide-down panels, and progressive disclosure come first; modals come last.
- **Don't** drift toward the legacy property-management SaaS palette (navy, royal blue, primary orange). Yardi/Buildium/RentManager is the gravity well; pull away.
- **Don't** use ALL CAPS in product surfaces.
- **Don't** put dashboard surfaces in dark mode "to look more pro." The scene is daytime work; light is the answer.
- **Don't** decorate empty states with stock illustrations the way Bootstrap admins do. Empty states tell the user what to do next, in plain copy.
- **Don't** use border-color alone to mark form errors. Error needs border + helper text + icon.
