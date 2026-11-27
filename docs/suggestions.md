# Suggestions

Ideas for making Déjà Room better, roughly in order of payoff. Started on
25 November 2026, after multiplayer went live; finished items are ticked.

## Load faster

First impressions, especially on venue wifi.

- [x] **Split the code.** Each room's 3D scene is its own download now
  (`src/game/rooms/lazyScene.ts`), so the menu loads 1.7 MB of JavaScript
  instead of 2.8 MB.
- [x] **Shrink the 3D assets.** A compression script turned the
  textures into WebP and compressed the geometry: 109 MB down to 20 MB.

## Make multiplayer more solid

- [x] **Keep the multiplayer tests.** `pnpm test:mp` (kept outside this repo)
  plays scripted VS and co-op games against the server.
- [x] **A reconnect test.** Part of `pnpm test:mp`: players drop out
  mid-hunt and come back (or don't), and the game neither loses their result
  nor waits for them.
- [x] **Rematch.** The host can play the same room again with new changes;
  everyone else can say they're up for another.
- [x] **Room moderation.** The host can remove someone (they can't rejoin),
  hand over the host's role, and lock the room against new players.
- [x] **A second co-op level.** The train station
  (`src/game/rooms/station/`) joins the city market.

## A safety net

- [ ] **CI.** A GitHub Action that runs the typecheck, lint, build and
  `pnpm test:mp` on every push, so a broken commit is caught before it
  reaches a deploy.

## Polish

- [ ] **Daily seed and a share card.** A "my score today" image or text for
  socials gives people a reason to come back and to spread it.
- [ ] **Accessibility.** Rebindable controls, a colour-blind-safe highlight
  for finds and misses, and an option to tone down the "something is
  different" flash.
- [ ] **Something for phones.** Phones get a "doesn't work here" message. A
  read-only spectator view for co-op, watching the team's pins, would let
  people without a laptop join in.
