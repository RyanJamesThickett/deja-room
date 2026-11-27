# Déjà Room

HackPompey 2026 (online edition) entry. Theme: **unusuality**. Organiser entry, not in judging.

You get two minutes to walk around a room that is already a bit strange (goo pumping through a glass tube on the ceiling, an eye in the wall, goldfish swimming through the air), then you walk back in and one thing has changed. Find it. Changes pile up, and after five you move on to a completely different room: from a living room to the inside of a spaceship.

```bash
pnpm install
pnpm dev
```

The 3D assets (about 20MB) are in `public/` already: models, textures and an HDRI from Poly Haven, with the textures turned into WebP (1024px at most) and the geometry compressed.

`?seed=abc123` in the URL fixes the house, so everyone with the same link gets the same changes.

Controls: click to look around, WASD to walk, Shift to run, Space to jump, C to toggle crouch, click the thing that changed, Esc to pause, Enter for "ready" / "next".

## How it fits together

The game is a run of completely different rooms (living room, corner shop, spaceship, gym, restaurant kitchen, museum, fire station, mechanic's garage), each with its own number of changes. A room is a `RoomDef` (`src/game/rooms/types.ts`): its own catalogue of changeable things, walls, start position, change count and 3D scene.

| File | What it does |
| --- | --- |
| `src/game/rooms/index.ts` | The rooms, in the order you visit them. |
| `src/game/rooms/<room>/items.ts` | That room's changeable objects and the specific changes each allows: hand-picked moves, obvious turns, resizes of at least 50%, recolours, and swaps to a different look. |
| `src/game/rooms/<room>/*Room.tsx` | The room's scene. Each changeable object is an `<Item id>`; swappable ones have `<Variant>` children, only `default` visible. |
| `src/game/rooms/living/oddities.tsx`, `src/game/weird.tsx` | The strange stuff: jelly tube, living picture, lava lamp, orb, eye in the wall, indoor rain cloud, air fish, stairs to nowhere, the 3D world outside. |
| `src/game/rooms/spaceship/` | The spaceship, built entirely in code (canvas-drawn panel textures, shader views of space). |
| `src/game/kit.tsx` | Shared building blocks: `Item`, `Variant`, `Decoy` (a red herring: never changes, but clicking it costs a try), `Wallpaper` (busy feature walls, patterns in `wallpaper.ts`), `Instanced`, `Block`, `PanelLight`. |
| `src/game/mutations.ts` | `generateMutation` picks a round's change from the room's catalogue (seeded; the first rounds only pick big things; colour changes are least likely; one swap per item; `blockedBy` and `clashes` pairs that would hide or undo each other never both happen, in either order). `applyMutations` resets the scene and applies a list of changes, so it can be called again and again. `balanceVariantLights` pads swap variants with unlit lights so a swap never changes the light count (which would recompile every shader). |
| `src/game/Model.tsx`, `assets.ts` | Loads Poly Haven glTF models (re-centred so they sit on the floor or flat on a wall) and tiling PBR textures. |
| `src/game/scene.tsx` | First-person walking with collision (anything marked `solid`, changeable or not), click-to-guess, reveal marker, "Show me" teleport. `House` keeps rendering paused until the room's textures are uploaded and shaders compiled (`warmup.ts`). |
| `src/App.tsx` | Phase state machine (`title → study → shift → hunt → reveal → … → end → next room`), HUD and pause menu. |

Tuning knobs: `changes` in each room's `index.ts`, `HUNT_SECONDS`, `SECONDS_PER_ITEM` (first look scales with how many changeable things a room has) and `ATTEMPTS` at the top of `src/App.tsx`; `EASY_ROUNDS` and `KIND_WEIGHT` in `mutations.ts`.

### Adding a changeable thing

1. Add it to the room's `items.ts` with the changes that make sense for it.
2. Wrap it in `<Item id="…">` in the room's scene. For swaps, add `<Variant of="…" name="default">` plus one `<Variant>` per swap. In dev, the console warns if the catalogue and the scene disagree.
3. Shader objects can be recoloured if their material has a `uColor` uniform.

### Adding a room

Copy `src/game/rooms/shop/` as a starting point: `bounds.ts`, `items.ts`, a memoised scene component, and an `index.ts` exporting a `RoomDef`. Add it to `ROOMS`. Lay it out like the real place; make floor-standing things `solid`; add a few `<Decoy>`s; keep lights few and never toggle their visibility per frame (animate intensity instead); then run the overlap check below.

### Layout photo mode (dev only)

`pnpm dev`, then open `/?shot=x,y,z,tx,ty,tz` to render the room from a fixed camera with no HUD. Add `&swap=plant:bush,books:more` to show swap variants, `&move=tv:0` to apply a move, and `&room=spaceship` to pick a room. Add `&overlaps=1` to list everything that clips something else or pokes through a wall, in the default layout and with every swap and move applied (`src/dev/overlaps.ts`).

## Multiplayer

**Multiplayer!** on the title screen leads to two modes:

- **VS**: two players, same room, same changes, at the same time. Each hunts alone; both results are revealed together, then the next change starts for both. Points as in solo; the quicker total time breaks a tie.
- **Co-op**: 1 to 6 players in bigger levels made for teams (`COOP_ROOMS` in `src/game/rooms/index.ts`). Everyone wanders the same level (shown to each other as the faceless figure, with a name tag) and votes by clicking: your pin goes on what you think changed, and once everyone has a pin down, the most-voted thing is the team's guess. A different player breaks ties each change. You hear (and see) each teammate's pin go in; once everyone's pinned, a three-second countdown gives the team a last chance to move pins before the guess goes in.

After each change, everyone sees what it was. The game moves on when everyone's pressed Ready, or after 30 seconds (counted down on screen), so one idle player can't hold the rest up.

Games are found by a four-letter code (consonants only, so no code spells anything) or an invite link (`?join=BKRT`). There are no accounts: each browser tab gets a random id and a generated name ("Wobbly Lamp"), so there's no typed text anywhere to moderate. Nothing is stored once a game ends.

The host looks after the room, from the lobby or the pause menu mid-game: **Remove** takes someone out (and keeps that player out of this game), **Make host** hands the role on, and **Lock the room** stops anyone new joining with the code. If the host leaves for good, the role passes to someone still there. At the end, the host can start a **rematch** (same room and players, new changes) or go back to the lobby; everyone else can say they're up for another.

| File | What it does |
| --- | --- |
| `server/src/index.ts` | The match server: a Cloudflare Worker that gives each room code its own Durable Object (an in-memory game: who's in, the clock, results and votes). It never knows what changed; every browser works that out from the seed. |
| `src/net/protocol.ts` | Every message and the shared timings, imported by both the game and the server. |
| `src/net/useMatch.ts` | The game's connection: WebSocket, reconnecting, a clock lined up with the server's, rejoining after a refresh. |
| `src/net/MultiplayerUI.tsx`, `CoopScene.tsx` | The menus, lobby and vote board; teammates and vote pins in the 3D view. |

To play it locally, run both of these, each in its own terminal, then open the game in two windows side by side (or one normal and one private window):

```bash
pnpm dev
```

```bash
pnpm mp
```

`pnpm mp` runs the match server with `wrangler dev` on port 8799; Vite forwards `/mp` to it.

## Hosting

The game is a static site, published free on Cloudflare Pages (unlimited bandwidth, which matters with ~20MB of 3D assets). The match server is a Cloudflare Worker with Durable Objects, also free. To put up your own copy, deploy the server first:

```bash
pnpm exec wrangler deploy --config server/wrangler.jsonc
```

The first run opens a browser to log in to Cloudflare, and may ask you to pick a workers.dev subdomain. It prints the server's address. Build the game with that address baked in, then upload it:

```bash
VITE_MP_URL=https://mp.<your-subdomain>.workers.dev pnpm build
pnpm exec wrangler pages deploy dist --project-name deja-room --branch main
```

Without `VITE_MP_URL`, the game looks for the match server on its own host, which is what `pnpm dev` does. `public/_headers` tells browsers to cache the models and textures for a week.

The deploy, asset-fetching and multiplayer test scripts (`pnpm test:mp`) are kept outside this repo.

## Credits

Furniture, props, textures and HDRI from [Poly Haven](https://polyhaven.com) (CC0). Fonts: Bangers and Bricolage Grotesque (Google Fonts, OFL).
