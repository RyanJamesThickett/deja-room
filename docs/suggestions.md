# Suggestions

Ideas for making Déjà Room better, roughly in order of payoff. Written on
25 November 2026, after multiplayer went live.

## Load faster

First impressions, especially on venue wifi.

- **Split the code.** The game shipped as one 2.9 MB JavaScript file, so all
  of it downloaded before the title screen appeared. Load each room's 3D
  scene, the item check world and multiplayer only when they're needed, so
  the menu shows up sooner.
- **Shrink the 3D assets.** The models and textures came to about 100 MB,
  mostly 2K textures. Resizing them and storing them as WebP, and compressing
  the meshes, cuts that by well over half and shortens "Fetching the
  furniture…".

## Make multiplayer more solid

- **A second co-op level.** The city market is the only one. A train station
  or a festival field would make co-op feel like a mode rather than a demo.
- **A reconnect test.** The server holds your place for 20 seconds after a
  dropout. A scripted test where one player drops mid-hunt and comes back
  would catch the worst live failure: a game stuck waiting for someone.
- **Rematch.** "Play again" on both end panels, with the same group and a
  fresh seed, instead of going back through the lobby.

## A safety net

- **CI.** A GitHub Action that runs the typecheck, lint and build on every
  push, so a broken commit is caught before it reaches a deploy.
- **Keep the multiplayer test scripts.** The scripted VS, co-op and refresh
  tests used during development should live in `scripts/` so they can be run
  again, by hand or in CI.

## Polish

- **Daily seed and a share card.** A "my score today" image or text for
  socials gives people a reason to come back and to spread it.
- **Accessibility.** Rebindable controls, a colour-blind-safe highlight for
  finds and misses, and an option to tone down the "something is different"
  flash.
- **Something for phones.** Phones get a "doesn't work here" message. A
  read-only spectator view for co-op, watching the team's pins, would let
  people without a laptop join in.
