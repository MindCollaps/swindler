# Product

## Register

product

## Users

Friends playing together in real time, split across two contexts: groups on phones (in the same room or on a call, touch-first, glancing between the screen and the conversation) and desktop players (often over Discord, with more screen space and keyboard input). Both arrive mid-social-moment; the job is to get everyone into a lobby and playing with zero friction, then keep each round's clue-vote-reveal loop fast and legible. Many players in a given group are first-timers invited by one person who knows the game.

## Product Purpose

Swindler is a real-time multiplayer social deduction game: everyone gets a secret word except the Swindler, players give one-word clues, then vote on who's faking it. The interface exists to serve that loop — joining is instant, whose-turn-is-it is always obvious, and the tense moments (clue reveal, vote, unmasking) land with drama instead of being buried in chrome. Success: a first-timer can play a full round without asking how, and a regular group can run rounds back-to-back without the UI ever slowing them down.

## Brand Personality

**Sly, playful, sharp.** The game is about deception, and the interface is in on the joke — a wink of mischief in copy and visual moments, but crisp and quick where it counts. Suspenseful at the reveal and the vote; lighthearted everywhere else. The tone is a good party game night: teasing, never mean; dramatic, never slow.

## Anti-references

- **Generic SaaS dashboard**: sterile admin panels, identical card grids, corporate data-tool chrome. Swindler has a dashboard and wordlist manager, but they must feel like part of a game, not a work tool.
- **Cluttered mobile-game UI**: coin counters, badge storms, stacked popups, neon free-to-play noise. Restraint keeps the social moment center stage.
- **Among Us clone**: the obvious genre reference. No bean-shaped mascots, no borrowed color-coded-crewmate iconography — Swindler owns its own visual identity.

## Design Principles

1. **The turn is the interface.** At any instant, every player must know whose turn it is, what phase the round is in, and what they're supposed to do — from across the room, on a phone. Hierarchy serves the game state above all else.
2. **Drama where the game is dramatic.** Motion and visual intensity are budgeted for the moments that carry tension: role reveal, vote, unmasking. Everything between stays calm and quick so those moments land.
3. **First-timer fluent by round one.** New players join mid-party via a friend's link. Every phase teaches itself in context; nobody should need the rules explained by the UI's host.
4. **Fast hands, big targets.** Real-time play on phones means large touch targets, instant feedback on every action, and zero dead-ends — a mis-tap or dropped connection never strands a player.
5. **Sly, not shouty.** Personality shows up in sharp copy and knowing details, not in decoration. One mischievous accent beats ten animated ones.

## Accessibility & Inclusion

Baseline: WCAG 2.1 AA across all screens.

- Text contrast ≥ 4.5:1 (≥ 3:1 for large text), verified with actual contrast checks on the dark theme.
- All interactive elements keyboard-navigable with visible focus states (desktop players live on keyboards).
- `prefers-reduced-motion` respected for every animation, including the dramatic reveal moments — they get a non-motion equivalent, not a blank.
- Game state (roles, votes, turn) never encoded in color alone; always paired with a label or icon.
- Semantic HTML first; ARIA as a supplement.
