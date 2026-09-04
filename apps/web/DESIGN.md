---
name: Bakery Ledger DeFi
colors:
  surface: "#fff9eb"
  surface-dim: "#e3dab8"
  surface-bright: "#fff9eb"
  surface-container-lowest: "#ffffff"
  surface-container-low: "#fdf4d0"
  surface-container: "#f7eeca"
  surface-container-high: "#f1e8c5"
  surface-container-highest: "#ebe3c0"
  on-surface: "#1f1c06"
  on-surface-variant: "#4d4732"
  inverse-surface: "#353119"
  inverse-on-surface: "#faf1cd"
  outline: "#7e775f"
  outline-variant: "#d0c6ab"
  surface-tint: "#6f5d00"
  primary: "#6f5d00"
  on-primary: "#ffffff"
  primary-container: "#ffd801"
  on-primary-container: "#705e00"
  inverse-primary: "#e8c400"
  secondary: "#5e5f5b"
  on-secondary: "#ffffff"
  secondary-container: "#deddd9"
  on-secondary-container: "#61615e"
  tertiary: "#5e5e5e"
  on-tertiary: "#ffffff"
  tertiary-container: "#dadada"
  on-tertiary-container: "#5f5f5f"
  error: "#ba1a1a"
  on-error: "#ffffff"
  error-container: "#ffdad6"
  on-error-container: "#93000a"
  primary-fixed: "#ffe169"
  primary-fixed-dim: "#e8c400"
  on-primary-fixed: "#221b00"
  on-primary-fixed-variant: "#544600"
  secondary-fixed: "#e4e2de"
  secondary-fixed-dim: "#c7c6c2"
  on-secondary-fixed: "#1b1c1a"
  on-secondary-fixed-variant: "#464744"
  tertiary-fixed: "#e2e2e2"
  tertiary-fixed-dim: "#c6c6c6"
  on-tertiary-fixed: "#1b1b1b"
  on-tertiary-fixed-variant: "#474747"
  background: "#fff9eb"
  on-background: "#1f1c06"
  surface-variant: "#ebe3c0"
typography:
  display-hero:
    fontFamily: Roboto Slab
    fontSize: 56px
    fontWeight: "800"
    lineHeight: 64px
    letterSpacing: -0.02em
  display-hero-mobile:
    fontFamily: Roboto Slab
    fontSize: 36px
    fontWeight: "800"
    lineHeight: 42px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Roboto Slab
    fontSize: 36px
    fontWeight: "800"
    lineHeight: 44px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Roboto Slab
    fontSize: 28px
    fontWeight: "800"
    lineHeight: 34px
  headline-md:
    fontFamily: Roboto Slab
    fontSize: 24px
    fontWeight: "500"
    lineHeight: 32px
  headline-sm:
    fontFamily: Roboto Slab
    fontSize: 20px
    fontWeight: "500"
    lineHeight: 28px
  body-lg:
    fontFamily: DM Sans
    fontSize: 18px
    fontWeight: "400"
    lineHeight: 26px
  body-md:
    fontFamily: DM Sans
    fontSize: 15px
    fontWeight: "400"
    lineHeight: 22px
  body-sm:
    fontFamily: DM Sans
    fontSize: 13px
    fontWeight: "400"
    lineHeight: 18px
  label-bold:
    fontFamily: DM Sans
    fontSize: 14px
    fontWeight: "700"
    lineHeight: 20px
    letterSpacing: 0.01em
  metric-lg:
    fontFamily: DM Mono
    fontSize: 28px
    fontWeight: "500"
    lineHeight: 34px
    letterSpacing: -0.02em
  metric-md:
    fontFamily: DM Mono
    fontSize: 18px
    fontWeight: "500"
    lineHeight: 24px
  metric-sm:
    fontFamily: DM Mono
    fontSize: 13px
    fontWeight: "400"
    lineHeight: 18px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  space-2xs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
  space-3xl: 4rem
  grid-gutter-desktop: 1.5rem
  grid-gutter-mobile: 0.75rem
  grid-margin-desktop: 2.5rem
  grid-margin-mobile: 1rem
---

## Scope

This file is the **visual** spec for `apps/web` only: color, type, radius, cards, buttons, ink borders. It comes from the Stitch “Bakery Ledger” kit.

Product UX — journeys (J1–J4), information architecture, copy, account states, what data to show — is `docs/PRD.md` §§7–8 and §13. If this file and the PRD disagree, **PRD wins for behavior**; this file wins for look.

Do not treat the bakery/ledger metaphor as product copy. Screens talk about jobs and desks.

## Brand & Style

The design system takes inspiration from an archival butcher shop ledger crossed with an artisanal baker’s daily accounting slate. Built for an autonomous agent marketplace on the BNB Chain, the aesthetic rejects the cold, dark-mode hyper-futurism of typical Web3 interfaces in favor of physical tactility, tangible accounting, and structural permanence.

The personality is grounded, candid, and meticulously organized. The target audience includes algorithmic traders, liquidity providers, and on-chain protocol managers seeking clarity over noise. Visual cues simulate heavy ink stamped onto dense, high-grade stock. Every UI plane is strictly opaque, flat, and delineated with structural ink borders. No soft blurs, no ambient glows, and no decorative gradients exist within this system; hierarchy is achieved entirely through line weight, typographic scale, and chromatic punctuation.

## Colors

The palette relies on high-contrast black ink over warm, tactile backdrops, accented sparingly with a single saturated yellow.

### Canvas & Base

- **Canvas (Buttercream):** `#fff6d2` — Applied to the document background and root viewport wrapper.
- **Card Surface (Bone White):** `#ffffff` — Default fill for actionable cards, ledger rows, and primary panels.
- **Secondary Surface (Oat):** `#cccbc7` — Used for disabled states, structural divider backing, table headers, and inactive container fills.

### Ink & Typography

- **Ink Black:** `#000000` — Primary text, hairline and structural borders, icons, and solid fills.
- **Char:** `#666664` — Secondary metadata, timestamps, transaction hashes, and non-active labels.

### Chromatic Accent & Status

- **Marigold:** `#ffd801` — The exclusive chromatic CTA fill. Paired strictly with `#000000` text and borders.
- **Status Green (Success / Active):** `#1f8a5f`
- **Status Amber (Warning / Pending):** `#b8790a`
- **Status Red (Error / Halted):** `#c23b30`

### Desk Marks (Category Indicators)

Used solely for small pill tags, categorization rules, and status dots representing agent archetypes:

- **Rebalance:** `#4a63c4`
- **Grid:** `#7c4ac4`
- **Yield:** `#1f8a5f`
- **Guard:** `#c23b30`

_Rules:_

- Gradients are banned.
- Alpha transparency and blurred backdrops are prohibited.
- Colors must meet WCAG AAA contrast against their respective canvas and bone surfaces.

## Typography

Typographic scale dictates hierarchy and imparts an authoritative, printed feel. Three distinct typefaces anchor the identity:

1. **Display & Headlines:** `Roboto Slab` provides the weighted editorial presence of stamped foundry type. Weight `800` is reserved for core metric summaries, section anchors, and hero title banners. Weight `500` brings disciplined structure to card headers and module groupings.
2. **Body & Controls:** `DM Sans` supplies modern, clean, geometric readability for running text, parameters, navigation items, and button actions.
3. **Ledger Figures & Metrics:** `DM Mono` is strictly applied to financial figures, agent contract addresses, gas fees, timestamps, and liquidity counts. All instances must enable `font-variant-numeric: tabular-nums` to guarantee vertical data alignment down columnar entries.

## Layout & Spacing

The layout operates on a firm 8px baseline rhythm (with a 4px sub-grid for dense micro-tabular components). Layouts should emulate printed trade sheets and double-entry journals: bounded, orderly, and content-dense without feeling congested.

### Grid Rules

- **Desktop (1024px+):** 12-column structured grid with `24px` (`1.5rem`) gutters and `40px` (`2.5rem`) outer margin. Maximum content bounding box is `1280px`.
- **Tablet (768px – 1023px):** 8-column grid with `16px` (`1rem`) gutters and `24px` (`1.5rem`) page margins.
- **Mobile (Below 768px):** 4-column layout with `12px` (`0.75rem`) gutters and `16px` (`1rem`) page margins.

### Ledger Sections

Containers adhere to full-width horizontal rule lines (`1px solid #000000`). When displaying market agents or liquidity pools, modular components span equal grid increments (e.g., 3 across on desktop, 2 on tablet, stacked 1-column on mobile). Margins and paddings prefer tighter vertical spacing (`space-md`) and wider horizontal breathing room (`space-lg`) to preserve the feeling of ledger lines.

## Elevation & Depth

This design system enforces a zero-shadow policy. Traditional elevation through lighting physics, drop shadows, inner shadows, and blur filters does not exist.

Depth is defined purely through:

1. **Planar Layering:** Buttercream (`#fff6d2`) serves as the foundation ground. Bone White (`#ffffff`) surfaces sit directly on top of the ground to denote active modules, forms, and cards. Oat (`#cccbc7`) identifies structural headers, inset metadata blocks, and depressed states.
2. **Ink Enclosures:** Every discrete card, input, and button is bound by a crisp `1px` or `2px solid #000000` perimeter stroke.
3. **Hard Stacking:** If an element needs to express high elevation or floating state (such as dialogs or popovers), it receives a solid `2px solid #000000` border paired with an opaque offset backing of solid Oat (`#cccbc7`) or Ink Black (`#000000`) placed at a rigid `4px` or `6px` straight translation—never blurred or softened.

## Shapes

Geometry strikes a balance between retro utilitarianism and tactile friendliness:

- **Buttons & Action Pills:** Full pill border radius (`rounded-full` / `9999px`).
- **Cards & Primary Modules:** Uniform `20px` corner radius.
- **Inputs, Form Controls & Badges:** Uniform `16px` corner radius.
- **Tabular Segments & Table Header Insets:** `8px` or sharp inner joints when docked against parent ledger borders.

All outlines maintain exact pixel-aligned borders (`1px solid #000000` standard; `2px solid #000000` for active focal points, cards, and primary CTAs).

## Components

### Buttons

- **Primary CTA:** Background `Marigold #ffd801`, text `Ink Black #000000`, border `2px solid #000000`, pill radius (`9999px`), DM Sans 700. Active state uses a slight internal depression or darkens slightly to `#ebc700`.
- **Secondary Button:** Background `Bone White #ffffff`, text `Ink Black #000000`, border `1.5px solid #000000`, pill radius (`9999px`). Hover fills background with `Oat #cccbc7`.
- **Tertiary / Utility Button:** Background transparent, text `Ink Black #000000`, underline on hover, DM Sans 500.

### Cards & Ledger Containers

- Background `Bone White #ffffff`, border `2px solid #000000`, radius `20px`, padding `space-xl`.
- Header bars within cards can feature an optional bottom divider `1px solid #000000`.
- Metric displays inside cards use `DM Mono` with explicit bottom labels in Char `#666664`.

### Input Fields & Selects

- Height `48px`, radius `16px`, background `Bone White #ffffff`, border `1.5px solid #000000`.
- Text in DM Sans 400 (`Ink Black`). Placeholder text in Char `#666664`.
- Focus state thickens border to `2px solid #000000` with an outer outline ring of `2px solid #ffd801` (hard offset, no blur).

### Chips & Desk Marks

- Height `24px` to `28px`, pill radius (`9999px`), border `1px solid #000000`, padding `0 12px`.
- Background either `Bone White #ffffff` or matched tinted desk category values (`Rebalance`, `Grid`, `Yield`, `Guard`) at opaque values with contrasting text.
- Must feature uppercase or tabular typography in `DM Mono` or `DM Sans 700` at `11px` - `12px`.

### Checkboxes & Radio Buttons

- Checkbox: `20px x 20px` square with `4px` radius, `1.5px solid #000000`, fill `Bone White #ffffff`. Checked state fills `Marigold #ffd801` with an Ink Black checkmark glyph.
- Radio: `20px x 20px` circle, `1.5px solid #000000`. Selected state features an interior `8px` solid Ink Black dot.

### Data Tables & Lists

- Striped or bounded rows separated by `1px solid #000000`.
- Header row background `Oat #cccbc7`, uppercase DM Sans 700 at `12px` tracking `0.05em`.
- Data columns hosting currency, gas, APY, or addresses must be right-aligned and rendered in `DM Mono` tabular numbers.
