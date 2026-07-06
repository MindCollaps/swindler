# Swindler — Project Instructions

## Design Context

Design work in this repo is governed by two root files — read them before building or changing any UI:

- **PRODUCT.md** — strategy. Register: `product` (design serves gameplay). Personality: sly, playful, sharp. Principles in short: the turn is the interface; drama only where the game is dramatic (reveal, vote, unmasking); first-timer fluent by round one; fast hands, big targets (40px minimum, phone-first); sly, not shouty. Anti-references: generic SaaS dashboard, cluttered mobile-game UI, Among Us clone. Accessibility baseline: WCAG 2.1 AA, and game state is never encoded in color alone.
- **DESIGN.md** — the visual system ("The Poker Face"): dark tonal charcoal table (`#18181B` ground, depth by stepping the darkgray scale), Velvet Violet (`$primary*`, #8f70c6 working value) as the single interactive accent, Noto Sans only, 8px radius everywhere, one shadow (the buttons' 2px hard "Chip Press"). Token source of truth: `app/utils/styles.ts` (`colorsList`) and `app/colors.scss`; `.impeccable/design.json` is the machine-readable sidecar.

Reuse the `Common*` component kit (`app/components/common/`) before inventing new controls.
