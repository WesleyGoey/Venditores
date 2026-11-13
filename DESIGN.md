---
name: Venditores
description: A frosted-glass budget sheet that turns an event proposal into a vendor plan, in paper, ink and one live blue.
colors:
  paper: "#e8ebed"
  ink: "#17191d"
  card: "#f4f6f7"
  live-blue: "#244cff"
  live-blue-pressed: "#1b3be0"
  blue-light: "#6f86ff"
  blue-tint: "#aebbff"
  slate: "#5b616a"
  slate-soft: "#9aa1aa"
  body-grey: "#3d434b"
  hairline: "#d1d6da"
  field: "#c3c9ce"
  wash: "#dde1e4"
  over-budget: "#b42318"
  destructive: "#d92d20"
typography:
  display:
    fontFamily: "'Bricolage Grotesque', 'Onest', sans-serif"
    fontSize: "5rem"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "'Bricolage Grotesque', 'Onest', sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  title:
    fontFamily: "'Onest', ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: "'Onest', ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "'Onest', ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    fontFeature: "tabular-nums"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  card: "16px"
  sheet: "24px"
  pill: "9999px"
spacing:
  row-y: "16px"
  gutter-mobile: "20px"
  gutter-desktop: "32px"
  section: "112px"
components:
  button-primary:
    backgroundColor: "{colors.live-blue}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    padding: "14px 28px"
  button-primary-hover:
    backgroundColor: "{colors.live-blue-pressed}"
  button-outline:
    backgroundColor: "rgb(255 255 255 / 0.5)"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "14px 28px"
  sheet:
    backgroundColor: "rgb(255 255 255 / 0.5)"
    rounded: "{rounded.sheet}"
  card:
    backgroundColor: "rgb(255 255 255 / 0.5)"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "24px"
  best-badge:
    backgroundColor: "{colors.live-blue}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
---

# Design System: Venditores

## Overview

**Creative North Star: "The RAB Sheet"**

Venditores is the committee's own RAB (rencana anggaran biaya, the event budget sheet), already filled in. The landing page is that sheet: one large frosted glass panel with hairline ruled rows, a column header, a total row, and a closing approval block with Prepared by and Approved by lines. The in-app screens share the same palette and glass; the landing is the Persuade surface of that one system. The app screens were not redesigned in this run, so they carry the same tokens but not the sheet composition.

The register is calm, exact and bookkeeping-literal. Paper, ink and a single live blue sit over a pale mesh wash. State is shown as a mark, not a hue: a struck check is a locked vendor, a blue ring is offers to compare, a dash is not started. Proof is arithmetic on screen: shares add to 100%, the total counts to Rp150.000.000, scores follow a stated 60% spec fit and 40% price formula.

**Key Characteristics:**
- One frosted glass sheet is the page; rows are hairline ruled, never carded.
- Blue (#244CFF) is the live or active mark and the primary action, nothing decorative.
- Display in Bricolage Grotesque, body and numerals in Onest with tabular figures.
- Rows land one by one with a brief blue cell highlight; share bars draw in.
- Light-only on the landing; the app has a dark theme through CSS variables.

## Colors

A cool grey paper and near-black ink with one saturated blue; every other value is a tint of these three.

### Primary
- **Live Blue** (#244CFF): primary buttons, focus rings, the Comparing mark, the Best badge, the logo fill, text selection, the Venditores logo. The app's `--primary` and `--ring` are the same value; in dark theme it lifts to #4D6BFF.
- **Pressed Blue** (#1B3BE0): primary button hover.

### Secondary
- **Soft Blue** (#6F86FF) and **Blue Tint** (#AEBBFF): only as budget-split hues in the share bars and row dots.

### Neutral
- **Paper** (#E8EBED): page ground (`--background`), under a three-gradient blue and ink mesh fixed to the viewport.
- **Ink** (#17191D): text, the Locked check, the Catering split hue, total-row rule.
- **Card Mist** (#F4F6F7): app card token.
- **Slate** (#5B616A): secondary text, column headers, the Not started dash, Decoration split hue.
- **Body Grey** (#3D434B): landing paragraph copy and nav links.
- **Slate Soft** (#9AA1AA): Printing split hue and muted chart value.
- **Hairline** (#D1D6DA) and **Field** (#C3C9CE): app borders and inputs. On the landing, rules are Ink at 10% opacity.
- **Wash** (#DDE1E4): app secondary, muted and accent fills.
- **Over Budget Red** (#B42318): an offer's price above the need's budget, in the offers table. App destructive is #D92D20.

### Named Rules
**The One Live Mark Rule.** Blue means live, active or actionable. It never decorates a heading, an icon set or a surface fill.
**The Mark-Not-Hue Rule.** Row state is carried by a shape (check, ring, dash) plus a word. Do not add a status color per state.
**The Tint Rule.** No new hue enters the system; extend with tints of paper, ink and blue.

## Typography

**Display Font:** Bricolage Grotesque (500, 700; with Onest, sans-serif)
**Body Font:** Onest (400, 500, 600; with ui-sans-serif, system-ui, sans-serif)

**Character:** A characterful grotesque for verbs, headlines and money, set against a plain legible body face. Both served from fonts.bunny.net. All numerals use tabular figures so columns align.

### Hierarchy
- **Display** (700, clamp 3rem to 5rem, 1.02, -0.025em): the one H1 in the sheet title row.
- **Headline** (700, 1.875rem to 2.25rem, tight): section H2s, and step verbs at 3rem to 3.75rem as ledger entries.
- **Title** (600, 1.125rem): row names (semibold), the Total label, offer scores in display face (bold 1.125rem).
- **Body** (400, 1.125rem, 1.625): landing paragraphs, at most 28rem measure (`max-w-md`).
- **Label** (500, 0.75rem to 0.875rem): column headers, status words, source line, in Slate.

### Named Rules
**The Tabular Rupiah Rule.** Every amount, share and score uses tabular-nums; totals and scores set in the display face.
**The Verb Ledger Rule.** Steps are large display verbs (Upload, Choose, Compare) with a small object line, in a ruled two-column ledger.

## Layout

Container is `max-w-6xl` with 16px (sm: 24px) side gutters. Rows are one shared grid so header, rows and total align: two columns on mobile (need, budget), five on md and up (1.25fr, 1.5fr, 1.1fr, 1fr, 0.95fr, gap 24px). Row padding is 16px vertical, 20px horizontal (md: 32px). Offers open in a nested six-column table, collapsing to a one-line fit summary on mobile. Sections are separated by 112px (`pt-28`/`py-28`). The first viewport is the sheet itself: nav, title row with the primary action top right, source line, six rows and the total, without scrolling at 1440x900.

## Elevation & Depth

Depth is tonal and optical, not shadowed. The `.glass` utility (`--glass` white at 50%, 1px white at 70% border, blur 20px with 1.4 saturation, `0 8px 32px rgb(23 25 29 / 0.08)`) frosts the mesh behind it. In dark theme the glass drops to white at 6%, border white at 12%, shadow black at 35%. Inside a sheet, depth steps by white overlays (white/35 total row, white/45 offers well, white/50 hover) rather than more shadows. The only lift beyond glass is the primary call-to-action glow.

### Shadow Vocabulary
- **Glass** (`0 8px 32px rgb(23 25 29 / 0.08)`): every `.glass` surface.
- **CTA glow** (`0 8px 24px rgba(36,76,255,0.35)`): large primary buttons only.

### Named Rules
**The Frost Once Rule.** One glass layer per region. Nested wells use white overlay and a hairline, never another blur.
**The Mesh Rule.** Color lives behind the glass as radial gradients (never blurred blobs, which tile-edge in Safari).

## Shapes

Soft but large. Sheets and panels use 24px radius, the app Card 16px, nested wells 16px, inputs and base radius 8px (`--radius`). Every button, nav pill, badge and the header are fully round (pill). Rows are square-edged inside the sheet and divided by 1px hairlines; the total row takes a 2px Ink rule. Status marks are 20px circles; share bars are 6px pills.

## Components

### Buttons
- **Shape:** pill (9999px).
- **Primary:** Live Blue fill, white medium text, large 14px by 28px with CTA glow, compact 6px by 16px in the nav; hover to Pressed Blue; 2px blue focus outline with 2px offset.
- **Outline:** white at 50% fill, 1px white at 70% border, hover white at 80%; dark theme white at 5% and 10%. Used for Log in beside the primary action. The app's default Button is the same blue at 90% on hover.

### Cards / Containers
- **Sheet / Card:** `.glass`, radius 24px (landing) or 16px (app Card), Card padding 24px. Card is the in-app counterpart of the sheet.

### Navigation
- Sticky glass pill, 16px from top: logo and wordmark left in display face, centered links in 14px medium body-grey that gain a white/70 pill on hover, auth actions right. Links collapse below md.

### The Ruled Need Row (signature)
Hairline-top row: colored 10px dot, semibold name, vendor, amount in tabular figures, share bar with percent, status mark. Expandable rows are full-width buttons with `aria-expanded`, a blue chevron, and an animated grid-rows reveal to a ranked offers table with a blue Best badge on the top score. Rows land via `rab-row` (0.6s, staggered 160ms, blue 14% cell flash fading to transparent) and bars via `rab-bar` (scaleX 0 to 1, 0.7s), easing `cubic-bezier(0.22, 1, 0.36, 1)`; reduced motion shows the finished sheet.

### Approval Block
Closing glass panel: headline, one primary action, total to approve, and two signature lines (Prepared by, Approved by) as 60% ink hairlines.

## Do's and Don'ts

### Do:
- **Do** keep blue (#244CFF) to the primary action, focus, live marks and the Best badge.
- **Do** show state as a mark plus a word (check Locked, ring Comparing, dash Not started).
- **Do** set money, shares and scores in tabular-nums and align them in one shared grid.
- **Do** build new surfaces from `.glass` over the mesh, with hairline rules at Ink 10% between rows.
- **Do** honor `prefers-reduced-motion` by showing the finished state.
- **Do** label example data as example on the page.

### Don't:
- **Don't** card the steps or rows; use ruled ledger rows inside a sheet.
- **Don't** add a status hue per state or a second accent color.
- **Don't** nest blur: wells inside glass use white overlay and a border.
- **Don't** use blurred-blob backgrounds; use radial gradients.
- **Don't** let the landing's hardcoded hex diverge further from the CSS variables.
