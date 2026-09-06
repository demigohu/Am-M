---
name: Butcher Ledger
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
  tertiary: "#006c47"
  on-tertiary: "#ffffff"
  tertiary-container: "#8beebb"
  on-tertiary-container: "#006d48"
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
  tertiary-fixed: "#94f6c3"
  tertiary-fixed-dim: "#77daa8"
  on-tertiary-fixed: "#002113"
  on-tertiary-fixed-variant: "#005235"
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
    fontSize: 38px
    fontWeight: "800"
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Roboto Slab
    fontSize: 36px
    fontWeight: "800"
    lineHeight: 44px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Roboto Slab
    fontSize: 28px
    fontWeight: "800"
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Roboto Slab
    fontSize: 24px
    fontWeight: "700"
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Roboto Slab
    fontSize: 20px
    fontWeight: "500"
    lineHeight: 28px
  body-lg:
    fontFamily: DM Sans
    fontSize: 18px
    fontWeight: "400"
    lineHeight: 28px
  body-md:
    fontFamily: DM Sans
    fontSize: 15px
    fontWeight: "400"
    lineHeight: 22px
  body-md-bold:
    fontFamily: DM Sans
    fontSize: 15px
    fontWeight: "700"
    lineHeight: 22px
  body-sm:
    fontFamily: DM Sans
    fontSize: 13px
    fontWeight: "400"
    lineHeight: 18px
  label-btn:
    fontFamily: DM Sans
    fontSize: 14px
    fontWeight: "700"
    lineHeight: 20px
    letterSpacing: 0.01em
  ledger-mono-lg:
    fontFamily: DM Mono
    fontSize: 18px
    fontWeight: "500"
    lineHeight: 24px
  ledger-mono-md:
    fontFamily: DM Mono
    fontSize: 14px
    fontWeight: "500"
    lineHeight: 20px
  ledger-mono-sm:
    fontFamily: DM Mono
    fontSize: 11px
    fontWeight: "500"
    lineHeight: 16px
    letterSpacing: 0.04em
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
  space-3xl: 4.5rem
  grid-gutter: 1.25rem
  grid-margin: 1.5rem
---

## Brand & Style

This design system blends the deliberate, tactile rigor of a traditional French bakery ledger with the precision of an algorithmic financial marketplace. Built for a DeFi agent platform, the aesthetic departs from standard dark-mode crypto conventions to evoke the honesty of physical record-keeping: dense, ink-ruled ledgers, warm parchment paper, stamp-like verification marks, and bold editorial typesetting.

The visual style is strictly flat, ink-ruled, and high-contrast. It rejects skeuomorphic gradients and soft drop shadows entirely, relying instead on 1px and 2px solid black ink boundaries, warm background fills, deliberate editorial line-heights, and clear stamp accents. The result feels grounded, auditable, and human—evoking confidence through structural clarity rather than neon abstractions.

## Colors

The palette simulates physical print production: oily black ink stamping across warm culinary parchment.

- **Canvas & Background (`#FFF6D2` - Buttercream):** The default root canvas tone. Creates a tactile, butcher-paper ground that softens high-density financial data.
- **Card Surface (`#FFFFFF` - Bone White):** Applied to content cards, ledger panels, and interactive modules to elevate them cleanly against the buttercream field.
- **Ink & Structure (`#000000` - Black Ink):** Universal token for high-emphasis typography, primary icon fills, and structural 1px or 2px borders.
- **Primary Action (`#FFD801` - Marigold):** High-energy, warm yellow reserved strictly for primary user actions, wallet states, and actionable transaction steps. Always paired with `#000000` ink text.
- **Secondary Neutral (`#CCCBC7` - Oat):** Boundary dividers, inactive toggles, muted table borders, and secondary state backgrounds.
- **Muted Text (`#666664` - Char):** Subordinate metadata, timestamps, secondary labels, and gas estimates.
- **Agent Desk Marks:** Distinct color tokens used for categorization, execution flags, and ledger tags:
  - **Yield (`#1F8A5F`):** Vaults, APR/APY metrics, positive pnl, automated compounders.
  - **Rebalance (`#4A63C4`):** Portfolio shifts, delta re-hedging, router actions.
  - **Grid (`#7C4AC4`):** Market-making agents, range orders, liquidity spreads.
  - **Guard / Alert (`#C23B30`):** Stop losses, liquidations, risk warnings, kill-switches.
  - **Caution / Amber (`#B8790A`):** Pending approvals, slippage warnings, network congestion.

## Typography

Typography establishes an editorial rhythm through a clear tri-font strategy:

- **Display & Headings (Roboto Slab):** Used for marketplace titles, vault headers, and section statements. Weight `800` delivers a sturdy, mechanical masthead quality; weight `500` provides an unhurried, editorial sub-heading cadence.
- **Interface & Prose (DM Sans):** Governs interface labels, form descriptions, instructions, and high-legibility transactional text. Clean geometric contours maintain readability beside heavy slab serifs.
- **Ledger Figures & Code (DM Mono):** Deployed for all numerical values, wallet addresses, transaction hashes, token APYs, liquidity balances, and contract metadata. Ensures numbers line up vertically like entries in a handwritten account book.

## Layout & Spacing

The layout is grounded in a 12-column responsive fluid grid structured to replicate ledger leaves and accounting dossiers:

- **Desktop (>=1200px):** 12 columns, 24px gutters, max-width 1360px centered with dynamic side margins. Panels align cleanly along vertical lines resembling accounting ledgers.
- **Tablet (768px - 1199px):** 8 columns, 20px gutters, 24px outer margins. Multi-column metric displays stack into 2-by-2 groups.
- **Mobile (<768px):** 4 columns, 16px gutters, 16px outer margins. Tables convert into single-column indexed cards framed with 1.5px ink borders.

All internal spacing follows a modular 4px / 8px baseline rhythm. Dense financial layouts favor compact vertical margins (`space-xs` to `space-sm`) paired with generous outer padding on cards (`space-lg` to `space-xl`) to establish authoritative, print-grade breathing room.

## Elevation & Depth

This system intentionally eliminates drop shadows, inner shadows, and gradient overlays. Depth and spatial hierarchy are conveyed solely through **pure planar contrast and ink-line weight**:

- **Layer 0 (Canvas):** The base `#FFF6D2` Buttercream surface represents the raw work surface.
- **Layer 1 (Ledger Cards & Panels):** Solid `#FFFFFF` Bone White with a mandatory `2px solid #000000` ink perimeter. Overlapping cards do not cast shadows; their spatial layering is defined strictly by z-index stacking and razor-sharp borders.
- **Layer 2 (Floating Modals & Tooltips):** Solid `#FFFFFF` Bone White surrounded by an amplified `2.5px solid #000000` contour. Modals feature an overlay veil of `#000000` with 25% opacity, evoking dark tracing paper.
- **Focus & Selection:** Active items, focus rings, or pressed states shift their fill to `#FFD801` or receive an offset `2px solid #000000` outline separated by a 2px white gap.

## Shapes

The geometric identity balances curved containers with pill-shaped interaction targets:

- **Cards & Ledger Containers:** Uniform `border-radius: 20px`. The soft corner softens the bold 2px ink line, keeping the interface approachable rather than brutalist.
- **Input Fields & Form Elements:** Uniform `border-radius: 16px`. Provides a snug, comfortable contour for numeric data entry.
- **Buttons, Badges, Tabs, and Status Tags:** Full pill `border-radius: 9999px`. Simulates physical bakery punch tags, stamps, and tokens.

## Components

### Buttons

- **Primary CTA:** Background `#FFD801` (Marigold), border `2px solid #000000`, color `#000000`, full pill radius (`9999px`), font `DM Sans` 700. Hover state darkens slightly to `#ECC800`. Active state transforms `translateY(1px)`.
- **Secondary Button:** Background `#FFFFFF`, border `2px solid #000000`, color `#000000`, full pill radius. Hover fills with `#FFF6D2`.
- **Destructive Button:** Background `#FFFFFF`, border `2px solid #C23B30`, color `#C23B30`. Hover fills with `#C23B30` and text turns `#FFFFFF`.

### Badges & Agent Desk Marks

- **Desk Mark Chips:** Pill-shaped (`9999px`), `1.5px solid #000000`, font `DM Mono` 500, uppercase. Background is a tinted wash (15% opacity of the Desk Mark color) paired with the solid mark color for the icon dot and text:
  - Yield: `#1F8A5F`
  - Rebalance: `#4A63C4`
  - Grid: `#7C4AC4`
  - Guard: `#C23B30`

### Input Fields

- **Container:** Background `#FFFFFF`, border `2px solid #000000`, radius `16px`, height `52px`, padding `0 18px`.
- **Typography:** Value input in `DM Mono` 500, 16px; placeholder in `DM Sans` 400 with color `#666664`.
- **Focus State:** Border expands to `2.5px solid #000000` without glow or halo rings.

### Checkboxes & Radio Buttons

- **Checkboxes:** 20px x 20px box with `4px` corner radius, `2px solid #000000` border, `#FFFFFF` background. Checked state fills `#FFD801` with a bold black checkmark.
- **Radio Buttons:** 20px circular frame, `2px solid #000000` border. Selected state embeds a solid 10px `#000000` circular ink center.

### Cards & Ledger Blocks

- **Card Container:** `#FFFFFF` fill, `2px solid #000000` border, `20px` corner radius, padding `24px`. No shadow.
- **Ledger Sub-panels:** Embedded tables or parameter grids inside cards use a `1px solid #000000` ruled border and `#FFF6D2` alternate row striping for transaction history.

### Agent Status Indicator

- Circular 8px dot with `1.5px solid #000000` stroke, filled with the respective Desk Mark color, accompanied by a `DM Mono` status label (e.g., `RUNNING`, `PAUSED`, `LIQUIDATING`).
