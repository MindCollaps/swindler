---
name: Swindler
description: The Poker Face — a composed dark table where Velvet Violet deals the action and tension only shows at the reveal.

# Values mirror app/utils/styles.ts (colorsList) and app/colors.scss verbatim.
# Those files are the source of truth; this frontmatter is the portable export.
# velvet-violet-* maps to $primary* / primary* in code.
colors:
  # Primary — Velvet Violet ($primary* in SCSS, primary* in colorsList)
  velvet-violet-700: "#512da8"
  velvet-violet-600: "#6743b2"
  velvet-violet-500: "#7c59bc"
  velvet-violet-400: "#8f70c6"
  velvet-violet-300: "#a287d0"

  # Neutral darks — the table ($darkgray*)
  darkgray-1000: "#131316"
  darkgray-950: "#18181B"
  darkgray-900: "#202024"
  darkgray-875: "#26262C"
  darkgray-850: "#2B2B33"
  darkgray-800: "#30303C"
  darkgray-700: "#3c3c3f"
  darkgray-600: "#525255"

  # Neutral lights — text on the table ($lightgray*)
  lightgray-0: "#F7F7FA"
  lightgray-50: "#F2F2F7"
  lightgray-100: "#EDEDF2"
  lightgray-125: "#E6E6EB"
  lightgray-150: "#DEDEE7"
  lightgray-200: "#D5D5E4"
  lightgray-300: "#bfbfc2"
  lightgray-400: "#aaaaac"

  # Semantic state ramps (500 is the working value; 700/300 are the ends)
  success-700: "#46a92d"
  success-500: "#66bb58"
  success-300: "#90d086"
  warning-700: "#a9902d"
  warning-500: "#bbad58"
  warning-300: "#d0c686"
  error-700: "#a92d46"
  error-500: "#bb5866"
  error-300: "#d08690"
  info-700: "#2da990"
  info-500: "#58bbad"
  info-300: "#86d0c6"

typography:
  display:
    fontFamily: "Noto Sans, Arial, sans-serif"
    fontSize: "38px"
    fontWeight: 700
    lineHeight: 1.2
  headline:
    fontFamily: "Noto Sans, Arial, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Noto Sans, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Noto Sans, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.4

rounded:
  md: "8px"
  pill: "999px"

spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"

components:
  button-primary:
    backgroundColor: "{colors.velvet-violet-400}"
    textColor: "{colors.lightgray-50}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.velvet-violet-300}"
    textColor: "{colors.lightgray-50}"
  button-secondary:
    backgroundColor: "{colors.darkgray-900}"
    textColor: "{colors.lightgray-50}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  button-secondary-hover:
    backgroundColor: "{colors.darkgray-850}"
    textColor: "{colors.lightgray-50}"
  input-text:
    backgroundColor: "{colors.darkgray-900}"
    textColor: "{colors.lightgray-150}"
    rounded: "{rounded.md}"
    padding: "0 16px"
  card:
    backgroundColor: "{colors.darkgray-800}"
    textColor: "{colors.lightgray-150}"
    rounded: "{rounded.md}"
    padding: "32px"
---

# Design System: Swindler

## 1. Overview

**Creative North Star: "The Poker Face"**

Swindler's interface is a composed, near-black surface that gives nothing away. The game is deception — one player at the table is lying — and the UI plays it exactly like a good bluffer: calm, even-toned, unhurried. Depth comes from quiet tonal steps of warm-tinted charcoal, not from glow or ornament. Velvet Violet is the one tell the interface allows itself: it marks the action, the focus, the thing you're supposed to touch. Tension is budgeted, not ambient — the interface stays flat and composed through lobby, clues, and discussion, then spends its drama on the moments that carry it: the role reveal, the vote, the unmasking.

This system explicitly rejects the three anti-references in PRODUCT.md: it is not a **generic SaaS dashboard** (no sterile admin chrome, no identical card grids — the dashboard and wordlist manager are part of the game, not a work tool), not a **cluttered mobile-game UI** (no coin counters, badge storms, or stacked popups), and not an **Among Us clone** (no borrowed crewmate iconography; Swindler's identity is the dark table and the violet tell).

**Key Characteristics:**
- Near-black warm-tinted ground (`#18181B`), depth by tonal layering across eight charcoal steps.
- Velvet Violet as the single interactive accent; semantic ramps (success, warning, error, info) reserved for state.
- One typeface (Noto Sans variable) doing all jobs through weight and size, not family changes.
- Chunky, tactile controls: 40px minimum targets, solid fills, a small hard press-shadow.
- One radius (8px) everywhere. No pill shapes, no sharp corners, no mixing.

## 2. Colors

A dark table lit just enough to read: eight charcoal steps for structure, near-white grays for text, one violet for action, four muted semantic ramps for state.

### Primary
- **Velvet Violet 400** (#8f70c6): The working accent — primary button fills and the default interactive color. This is the violet players actually touch.
- **Velvet Violet 500** (#7c59bc): Focus borders on inputs, hover text on flat/transparent buttons. The system's focus voice.
- **Velvet Violet 700** (#512da8): The deep end — pressed/active states and moments that need the violet at full authority.
- **Velvet Violet 300** (#a287d0): The light end — hover lift on violet fills, subtle violet text on dark surfaces.

### Neutral
- **Darkgray 950** (#18181B): The table itself — default page ground.
- **Darkgray 1000** (#131316): Deepest inset (scrollbar tracks, recessed wells).
- **Darkgray 900** (#202024): Input fields and secondary button fills — one step up from the table.
- **Darkgray 875 / 850** (#26262C / #2B2B33): Intermediate lifts — alternate fills and hover states for secondary surfaces.
- **Darkgray 800** (#30303C): Panels and cards (CommonBox), transparent-button hover. The highest resting surface.
- **Darkgray 600** (#525255): Borders and dividers on raised panels.
- **Lightgray 150** (#DEDEE7): Default body text on the table — 13.5:1 against darkgray-950.
- **Lightgray 50** (#F2F2F7): Button labels and high-emphasis text on fills.
- **Lightgray 300 / 400** (#bfbfc2 / #aaaaac): Muted captions and metadata only, on the darkest grounds only.

### Tertiary
The four state ramps, all deliberately desaturated so they sit on the dark table without shouting:
- **Success** (#66bb58 working / #46a92d deep): confirmations, correct votes.
- **Warning** (#bbad58): timers running low, risky actions.
- **Error** (#bb5866): input errors, failed actions, destructive confirms.
- **Info** (#58bbad): neutral notices and hints.

### Named Rules
**The One Tell Rule.** Velvet Violet means "this is the action" — buttons, focus, the current turn. It never decorates. If violet appears on something a player can't act on or doesn't need to track, it's wrong.

**The Tonal Table Rule.** Depth is built by stepping the charcoal scale one level at a time (950 ground → 900 input → 800 panel). Never skip to pure black (#000) or pure white (#fff); neither exists in this system.

**The State-Speaks-Twice Rule.** Semantic colors (success, error, warning, info) never carry game state alone — every colored state is paired with a label or icon. Carried directly from PRODUCT.md's accessibility commitments.

## 3. Typography

**Display Font:** Noto Sans (variable; with Arial, sans-serif fallback)
**Body Font:** Noto Sans — the same family at every level

**Character:** One honest, legible workhorse doing every job through weight and size. No display face, no mono, no italic theatrics — the type keeps a straight face while the game does the acting. Sizes step down roughly one notch on mobile (≤1365px).

### Hierarchy
- **Display** (700, 38px desktop / 32px mobile, 1.2): Page titles (`CommonPage` h1) — one per screen, centered above the action.
- **Headline** (600, 24px, 1.3): Section and layout-level headers (lobby name, panel titles).
- **Body** (400, 14px desktop / 12px mobile, 1.5): Paragraphs, button labels (at 600), list content. The default voice.
- **Label** (600, 13px desktop / 10px mobile, 1.4): Input labels and small functional markers.

### Named Rules
**The Straight-Face Rule.** One family, weights 400–700. Emphasis comes from weight and the lightgray scale (150 → 50), never from a second typeface or from color alone.

**The Across-The-Room Rule.** Game-state text (whose turn, phase name, timer) must read at arm's length on a phone: body size is the floor for anything a player must track during play — 10–12px is for labels and metadata only.

## 4. Elevation

Tonal-first with one tactile signature. Depth is carried by the charcoal steps (950 ground → 900 → 875 → 850 → 800 panel) and 1px darkgray-600 borders on raised panels — not by shadow stacks. The single exception is deliberate: interactive game pieces (buttons) carry a small hard offset shadow, `2px 2px 2px rgba(0,0,0,0.25)`, that makes them read as physical chips sitting on the table rather than painted regions. Flat and transparent button variants drop the shadow entirely.

### Shadow Vocabulary
- **Chip Press** (`box-shadow: 2px 2px 2px rgba(0,0,0,0.25)`): Solid-fill buttons only. Small, hard, unblurred — a game piece, not a floating card.

### Named Rules
**The One Shadow Rule.** Chip Press is the only shadow in the system. Panels, cards, inputs, popups, and toasts rest on tonal steps and borders. If a surface needs more separation, move it one charcoal step up — don't add a shadow.

## 5. Components

Controls are chunky and tactile: solid fills, generous targets, a satisfying press. Game pieces, not form controls.

### Buttons
- **Shape:** Gently rounded (8px radius), min-height 40px (32px for size S), padding 8px 16px, flex-centered with 12px icon gap.
- **Primary:** Velvet Violet 400 fill (#8f70c6), Lightgray 50 text (#F2F2F7) at 14px/600, Chip Press shadow.
- **Hover / Focus:** Fills lighten one violet step on hover (300ms transition, desktop only); flat/transparent variants shift text to Velvet Violet 500. Focus must be visible — keyboard players are first-class.
- **Secondary:** Darkgray 900 fill (875 variant available), hover → 850, active → 800. Same shape and shadow.
- **Transparent / full-transparent:** No fill, no shadow; Lightgray 150 text, hover → violet text (with/without an 800 background lift).
- **Link:** Underlined 10px text, no fill, no radius — inline utility only, never a play action.

### Cards / Containers
- **Corner Style:** 8px radius.
- **Background:** Darkgray 800 (CommonBox), one step below at 875/850 for nested rows.
- **Shadow Strategy:** None — border + tonal step (see Elevation).
- **Border:** 1px solid Darkgray 600.
- **Internal Padding:** 32px, 16px vertical gap between children.

### Inputs / Fields
- **Style:** Filled — Darkgray 900 ground, no visible border at rest (2px transparent), 8px radius, 0 16px padding, optional leading icon.
- **Focus:** Border ignites to Velvet Violet 500 (300ms). Hover shows a Darkgray 800 border as a pre-focus hint.
- **Error:** Border switches to Error 500 (#bb5866); length counter turns the same color when exceeded. Label sits above at 13px/600 with 8px gap.

### Navigation
- **Style:** Minimal layout-level chrome (default layout header at 24px); navigation happens through button-styled links (`CommonButton` with `to`), not a persistent navbar. Keep it that way — a party game doesn't need an app shell.

### Popups & Toasts (signature)
- **Popups (CommonPopup):** Same material as cards — Darkgray 800, 8px radius, border — centered over a dimmed table. One popup at a time, ever.
- **Toasts (CommonToast):** Compact state messengers using the semantic ramps, paired icon + text per the State-Speaks-Twice Rule.

## 6. Do's and Don'ts

### Do:
- **Do** put Velvet Violet on exactly the thing the player should act on — the primary action per screen, the focused input, the current turn marker.
- **Do** build depth by stepping the charcoal scale (950 → 900 → 800) with 1px Darkgray 600 borders; move a surface one step up when it needs separation.
- **Do** keep touch targets at 40px minimum (32px only for size-S utility actions) — fast hands on phones are the primary input.
- **Do** keep the 8px radius universal — every button, input, card, and popup shares it.
- **Do** pair every semantic color with a label or icon (State-Speaks-Twice) — roles, votes, and turns are never color-alone.
- **Do** spend motion and drama on the reveal, the vote, and the unmasking — with a `prefers-reduced-motion` equivalent for each — and keep everything between calm.

### Don't:
- **Don't** build **generic SaaS dashboard** surfaces (PRODUCT.md anti-reference): no identical card grids, no sterile admin chrome, no data-tool tables in the dashboard or wordlist manager.
- **Don't** import **cluttered mobile-game UI** patterns (PRODUCT.md anti-reference): no coin counters, badge storms, stacked popups, or neon free-to-play noise.
- **Don't** echo **Among Us** (PRODUCT.md anti-reference): no bean mascots, no color-coded-crewmate iconography as role identity.
- **Don't** use pure black (#000) or pure white (#fff) — the scale ends at #131316 and #F7F7FA.
- **Don't** add shadows beyond Chip Press on solid buttons — no floating cards, no glow, no glassmorphism.
- **Don't** use Lightgray 300/400 for text players must read during play; they are caption-only on the darkest grounds. Body text stays Lightgray 150 or brighter.
- **Don't** introduce a second typeface, gradient text, or violet used as passive decoration — the accent is a tell, and a tell that fires constantly means nothing.
