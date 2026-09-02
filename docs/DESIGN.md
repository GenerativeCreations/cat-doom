# CatDoom — Twelve Levels (Game Design Document)

**Status:** design locked for implementation · 2026-09-01 · owner Grant · game at `demos/catdoom/`
**Premise:** Doom, but the demons are cats. You have a spray bottle. Every cat you spritz goes down for a nap.
Nap them all and the EXIT door opens. Twelve rooms of one increasingly haunted house, each introducing a
new, scarier cat, ending with the cat goddess herself.

## 1. Difficulty philosophy

Difficulty comes from **four dials**, never from bullet-sponge HP alone:

| Dial | What it does | Range L1 → L12 |
|---|---|---|
| Roster | which cat types are present, and how many | 8 tabbies → ~30 mixed + a boss |
| Space | corridor width, sightlines, loops for flanking | wide & simple → cramped, looped, dark |
| Light (`fog`) | how far you can see before it goes black | 0 → 0.7 |
| Economy | water bowls and tuna per cat | 1 bowl / 3 cats → 1 bowl / 8 cats |

Every level must be **beatable by a careful player at full HP with no pickups**, and *comfortable* with
pickups. A new cat type is always introduced **alone or nearly alone** the first time so the player learns
its tell before it's mixed in. Every odd level ramps, every even level adds a mechanic.

## 2. The bestiary (introduced in this order)

| # | Cat | Letter | HP | Speed | Dmg | Scale | Behaviour / the "tell" |
|---|---|---|---|---|---|---|---|
| 1 | **Tabby** | `t` | 60 | 1.6 | 8 | 0.62 | Baseline chaser. Meows when it spots you. |
| 2 | **Void cat** | `v` | 90 | 1.9 | 10 | 0.62 | Black; hard to see at range in fog. Faster. |
| 3 | **Tuxedo** | `x` | 120 | 1.1 | 12 | 0.68 | Tank. Slow, four sprays at range. Soaks water. |
| 4 | **Kitten** | `k` | 20 | 2.4 | 4 | 0.38 | Comes in packs of 4–6. One spray each, but they surround you. |
| 5 | **The Chonk** | `c` | 240 | 0.75 | 20 | 0.90 | Mini-boss. Slow, huge hit. Kite it. |
| 6 | **Hairball Hurler** | `h` | 70 | 1.2 | 6 | 0.62 | **Ranged.** Keeps 3–6 tiles away, spits a hairball every 2.2 s (10 dmg projectile). Break line of sight. |
| 7 | **Sphynx** | `s` | 110 | 2.2 | 15 | 0.62 | **Only moves when you are not looking at it.** Silent (no meow). Turn around and it's closer. |
| 8 | **Zoomie** | `z` | 50 | 2.6 | 8 | 0.55 | Erratic. Strafes sideways in bursts, hard to line up. |
| 9 | **Ghost cat** | `g` | 100 | 1.0 | 12 | 0.62 | **Passes through walls.** Translucent. Corridors don't protect you. |
| 10 | **Caterwauler** | `w` | 130 | 1.3 | 12 | 0.70 | Every 7 s within 10 tiles: **wails** — wakes every cat on the level and gives them +50% speed for 4 s. Kill first. |
| 11 | **The Matriarch** (boss) | `M` | 600 | 0.9 | 22 | 1.25 | Spawns 2 kittens beside her every 8 s (max 8 of hers alive). |
| 12 | **Bastet** (final boss) | `B` | 1400 | 1.4 | 30 | 1.40 | Hairball every 3 s, spawns 2 cats (void/zoomie) every 12 s. Below 50% HP: **enraged** — speed 2.0, hairball every 1.8 s. |

Spray damage: 40 at ≤2.5 tiles, 28 beyond, 7-tile max range. All cats wake on line of sight ≤7 tiles, or
when you spray within 12. Bosses are awake from the start.

## 2b. The toolbelt (one new tool per level after the spray bottle)

| Unlocked | Tool | Key | Ammo (start / drop / cap) | What it does |
|---|---|---|---|---|
| L2 | **Catnip** | 1 | 3 / +2 / 6 | Thrown ~5 tiles. Cats within 6 tiles walk to it and sit **dazed** (no attacks) for 8 s. |
| L3 | **Yarn ball** | 2 | 3 / +2 / 6 | Thrown grenade. Cats within 2.2 tiles of the landing spot take 30 and are **tangled** (frozen) for 5 s. |
| L4 | **Plastic bag** | 3 | 2 / +1 / 5 | Thrown lure. Cats within 5 tiles come; the first one in is **bagged** for 8 s — runs blind, can't attack, takes double damage. |
| L5 | **Cardboard box** | 4 | 2 / +1 / 4 | Dropped in front of you, lasts 25 s. The first three cats within a tile climb in and sit **boxed** for 10 s, double damage. |
| L6 | **Laser pointer** | 5 | 3 / +2 / 6 | Not thrown: a red dot lands where you aim (up to 8 tiles). Cats within 7 tiles that can see it chase it at 1.3× and sit **dazed** on it for the dot's 6 s. |
| L8 | **Vacuum cleaner** | 6 | 2 / +1 / 4 | Not thrown: every cat within 4 tiles that can see you is **scared** for 4 s (flees at 1.5×, can't attack). Screen shake (off with FLASH OFF). Ghosts have no ears. |
| L10 | **Treats** | 7 | 2 / +1 / 4 | Thrown lure (8 s). Cats within 3 tiles come; an arrival is **eating** for 6 s (sits, double damage) and is **calmed** afterwards: it forgets you until it sees you again. |

Bosses are immune to daze/bag/box/laser/vacuum/treats (yarn still damages them). Laser and vacuum skip cats that already carry a status so tools combine instead of cancelling. Ghosts can't be boxed. Each level grants the
starting stash for every unlocked tool and the engine auto-places ammo drops (2 per tool, 1 for boxes) on
reachable floor if the level file has none; authors may place them with `N` catnip, `Y` yarn, `P` bag, `O` box.
On-screen: a tool row above the pads, one tap each. The level that unlocks a tool shows its blurb after
the intro card.

## 3. The twelve levels

Legend for the *feel* column: **W** wide rooms · **C** cramped corridors · **L** loops (flank routes) · **A** arena.

| L | Name | Theme | Feel | Fog | New cat | Roster (approx.) | Water / Tuna | Hook |
|---|---|---|---|---|---|---|---|---|
| 1 | **The Hallway** | brick + wood, warm | W | 0 | Tabby | 8 t | 3 / 2 | Tutorial. Straight sightlines, one loop. |
| 2 | **The Kitchen** | white tile + wood | W L | 0.1 | Void cat | 8 t, 4 v | 4 / 2 | Voids wait behind the island counters. Picking up the tuna on the table springs 2 more voids (`pickup` trigger). |
| 3 | **The Laundry Room** | wallpaper + wood | C L | 0.15 | Tuxedo | 8 t, 5 v, 3 x | 3 / 2 | Tuxedos block the narrow aisles between machines; learn to back up while spraying. |
| 4 | **The Nursery** | pastel wallpaper + tile | W A | 0.1 | Kitten | 4 t, 18 k (3 packs) | 4 / 2 | Packs are placed in side rooms; entering each (`enter` trigger) releases the pack with a "mew" chorus. |
| 5 | **The Living Room** | brick + wallpaper | W L | 0.2 | The Chonk | 6 t, 4 v, 2 x, 2 c | 3 / 2 | Two Chonks on the sofa. Big central room with pillars to kite around. |
| 6 | **The Garage** | metal + concrete(stone) | W L | 0.25 | Hurler | 6 v, 3 x, 6 h | 3 / 1 | Long sightlines = hairballs. Cover pillars (cars) every 4 tiles. Water bowls out in the open. |
| 7 | **The Basement** | dark stone + metal | C | 0.6 | Sphynx | 4 v, 2 x, 5 s | 2 / 2 | Nearly black. Sphynxes teleport-walk when you turn. Every corridor has a blind corner. |
| 8 | **The Attic** | wood beams + wallpaper | C L | 0.3 | Zoomie | 6 t, 4 v, 10 z, 1 c | 3 / 1 | Cramped diagonal corridors; zoomies ricochet down them. Chonk sits on the exit. |
| 9 | **The Crawlspace** | bone/dust + dark stone | C L | 0.55 | Ghost | 4 v, 4 x, 8 g, 2 s | 2 / 1 | Ghosts come through the walls of the maze. Sphynxes in the dead ends. |
| 10 | **The Cat Tree** | wood + carpet(wallpaper) | A W | 0.2 | Caterwauler | waves: 6 t → 6 z + 2 w → 4 x + 4 h + 2 w → 2 c + 6 k | 4 / 2 | Arena. `kills` triggers release each wave. Kill the wailers first or the waves merge. |
| 11 | **The Litter Box Cathedral** | stone + bone | A L | 0.35 | The Matriarch | M + 4 x, 4 h, 6 v, 2 w | 3 / 2 | Boss in the nave spawning kittens; her guard circles the side aisles. |
| 12 | **The Shrine of Bastet** | gold(metal) + bone + brick | A L | 0.4 | Bastet | B + 2 s, 4 z, 4 g, 2 w, 2 c | 4 / 3 | Final. Pillared arena with four alcoves of water. Enrage at 50%. Clearing her opens the last exit → **VICTORY**. |

Approximate rosters are targets, not law: the level author tunes ±20% after playing. Total cats per level
must be visible in the HUD ("cats napping x / y") and must include trigger-spawned cats once spawned.

### Per-level detail

**L1 The Hallway.** Keep the current hand-built 20×20 map. Cut to 8 tabbies so the first room is a
warm-up. Message on start: "SPRAY ALL 8 CATS TO OPEN THE EXIT".

**L2 The Kitchen.** 22×20. Two long counters ("islands") in the middle make a figure-eight loop. Voids
sit on the far side of each island so the player first sees a black shape slip out of view. Trigger:
the tuna on the table at the room's centre spawns 2 voids behind the player with "SOMETHING KNOCKED
A GLASS OFF THE COUNTER".

**L3 The Laundry Room.** 22×22. Aisles 1 tile wide between rows of "machines" (2×2 wall blocks). Two
loops so the player can circle a tuxedo. Tuxedos start in the aisles, tabbies in the back room.

**L4 The Nursery.** 24×22. One big central play room with three side rooms (cribs). Each side room's
doorway has an `enter` trigger that spawns its 6-kitten pack with "MEW MEW MEW MEW MEW". Tabbies patrol
the centre. Exit at the back of the third room.

**L5 The Living Room.** 24×24. Central 10×10 room with four 2×2 pillars (armchairs). Chonks sit in the
far corners and are awake from spawn (`awake: true`). Voids in the side halls flank while you kite.

**L6 The Garage.** 26×20. Three long bays, each 4 wide, separated by half-walls with gaps. 2×3 pillars
(cars) every 4 tiles give hairball cover. Hurlers start at the far ends of the bays.

**L7 The Basement.** 24×24, `fog: 0.6`. Corridors 1 wide with blind corners every 4–5 tiles; three
small rooms. Sphynxes placed *behind* the player's route so the first one is met when turning back.
Only 2 water bowls — spray discipline.

**L8 The Attic.** 26×22. Staircase-shaped diagonal corridors (1 wide) that force turning; three loops.
Zoomies split across the loops; one Chonk sits in the 3×3 room in front of the exit.

**L9 The Crawlspace.** 26×24, `fog: 0.55`. A true maze (1-wide) with 4 dead-end pockets holding
sphynxes. Ghosts are spawned in the *walls* between corridors (allowed only for `g`). Two water bowls
at the ends of the two longest dead ends.

**L10 The Cat Tree.** 24×24 arena: a 14×14 open floor with a raised "tree" of pillars in the middle and
four alcoves. Waves via `kills` triggers at 6, 14, 24 kills. Each wave says its name ("SECOND WAVE —
THE WAILERS"). Water in the alcoves, replenished by trigger spawn on wave 3.

**L11 The Litter Box Cathedral.** 28×26. Central nave 6 wide with pillar rows, two side aisles that loop
behind the apse. The Matriarch starts at the altar, awake. Guard cats sit in the aisles.

**L12 The Shrine of Bastet.** 28×28. Circular-ish arena (octagon of walls) with 8 pillars and 4 alcoves
each holding a water bowl; a ring corridor outside the arena with the exit door at the back. Bastet
starts in the centre, awake. Beating her: "BASTET SLEEPS. THE HOUSE IS YOURS." Exit → victory screen
with total time, total naps, and levels.

## 4. Level file schema (what authors write)

One file per level: `demos/catdoom/levels/levelNN.js`, registered with the engine:

```js
CatDoom.registerLevel({
  n: 3,
  name: 'The Laundry Room',
  subtitle: 'Something is nesting in the warm clothes.',
  theme: { walls: ['wallpaper', 'wood', 'stone'], border: 'stone', sky: '#2a2226', floor: '#4a3a2c', fog: 0.15 },
  rows: [                       // every row the same length, border must be wall
    '######################',
    '#S..t....#...........#',
    '#..##..@@#..##..W..x.#',
    '#...........T........#',
    '######################E',   // 'E' replaces ONE wall cell adjacent to floor (may be on the border)
  ],
  triggers: [
    { when: 'pickup', x: 12, y: 3, spawn: [{ x: 4, y: 1, type: 'v' }], say: 'SOMETHING MOVED IN THE DRYER' },
    { when: 'enter',  x: 10, y: 5, w: 3, h: 3, spawn: [...], say: '...' },
    { when: 'kills',  count: 6, spawn: [...], say: 'SECOND WAVE', water: 20 },   // optional water: refills the bottle when it fires
  ],
  awake: [[18, 9]],              // optional: cats at these cells start awake (bosses)
});
```

**Map legend.** `#` wall A · `@` wall B · `=` wall C (indices into `theme.walls`) · `.` floor · `S` start
(exactly one) · `E` exit (exactly one; a wall cell with at least one floor neighbour) · `W` water bowl ·
`T` tuna · cat letters `t v x k c h s z g w M B` (spawns at that floor cell) · `G` = a ghost embedded in a wall cell (the cell stays wall A) · anything else is an error. Facing direction at start is auto (first open neighbour) or
`start: { dir: 'E' | 'W' | 'N' | 'S' }`.

**Textures available:** `brick`, `stone`, `wood`, `tile`, `wallpaper`, `metal`, `bone`, `gold`.

**Validator.** `node demos/catdoom/tools/validate-levels.js` loads every level file headlessly and fails on:
bad legend char, ragged rows, non-wall border, missing/duplicate `S`/`E`, exit not adjacent to floor, exit
unreachable from start, any non-ghost cat or pickup in a wall, trigger spawn cell in a wall (non-ghost),
`enter` area entirely wall, `kills` count ≥ total cats before that wave, or a level whose cats can't all be
reached from the start. It prints the roster and a rendered map. Authors run it until it passes.

## 5. Engine features required (owner: Fable seat, before fan-out)

- Level registry (`registerLevel`), legend parser, theme textures, per-level fog, intro title card.
- Toolbelt (§2b): thrown projectiles, world items (lures, boxes), cat status effects, tool row UI, ammo pickups.
- Completability guards: unfired spawn triggers hold the exit shut and are released one by one once nothing
  is alive; trigger pickups are always collectible; with ≤2 cats left they wake and hunt the player;
  standing at a locked exit reports how many cats remain.
- Triggers: `pickup`, `enter`, `kills`. `cleared` recomputed each frame = no cat alive and no pending
  `kills` trigger; exit closes again if a trigger spawns cats.
- Behaviours: hurler (ranged + projectiles), sphynx (freeze in view cone), zoomie (strafe bursts), ghost
  (wall-phasing + alpha), wailer (wail buff), matriarch (spawner), bastet (phases). Kitten scale.
- Sprites for the 8 new cats (variants on the procedural cat: kitten big eyes; sphynx pink no-whiskers;
  hurler with hairball in mouth; zoomie motion lines; ghost alpha; wailer open mouth; matriarch crown;
  bastet gold with glowing eyes).
- Victory screen after L12. `?level=N` deep link for testing. Debug seam kept (`tick`, `warp`, `napAll`).

## 6. Implementation plan

1. Fable seat: engine refactor (`engine.js` + `index.html` shell), L1 as the reference level file,
   validator, this doc. Verify in the browser with the tick seam.
2. Fan-out (Opus workers, one brief each): A = L2–L4, B = L5–L7, C = L8–L10, D = L11–L12. Each worker
   writes its level files, runs the validator to green, plays each level headlessly via the tick seam
   to confirm a cat reaches the player and the exit opens after `napAll`, and returns a Decisions section.
3. Fable seat integrates, warps through all 12 in the browser, audits (reachability, roster vs. table,
   snapshot of each intro), tunes, and hands Grant the build.

## 7. Open questions (ask Grant, don't assume)

- Should difficulty be selectable (kitten / cat / lion)? Not in v1; rosters are tuned for one setting.
- Save progress between sessions (localStorage)? Not in v1; `?level=N` covers replay.

## 8. As built (2026-09-01)

All twelve level files landed (four Opus workers, validator green, full browser run L1→L12→victory).
Deviations the workers chose, kept on integration:

- **Triggers added where the table had none:** L3 dryer void (pickup), L5 centre tuna → 2 voids + "armchairs stood up"
  (enter, say-only), L6 garage "winding up" (enter) + tuna ambush, L7 dryer sphynx, L8 tuna → 2 zoomies,
  L9 tuna → 2 ghosts in the walls. Rosters stay within ±20%, and trigger spawns are counted into the table numbers.
- **L4 tabbies:** one in each of cribs A and B rather than all four in the centre (pre-dates the engine fix that
  holds the exit for unfired spawn triggers; harmless now, could move back).
- **L5 exit** is on the same ring corridor as the start (at max BFS distance); worker flagged it as their least
  confident call. **L8 Chonk** starts awake. **L10 exit** is a 3×3 antechamber, not a 1-wide choke.
  **L11 nave** is 12 wide with 2×2 pier arcades (6 wide only at the choir). **L12 alcoves** are inner nooks
  open on two sides. **L11 `=`** is `tile` (litter-box joke).
- **Untuned:** felt difficulty. Everything was verified structurally and by headless engine runs, not by
  play. L12 water budget (worker: raise the two `water:` triggers 25→40 if it plays dry) and L10 wave 4
  (currently no refill) are the two knobs most likely to move.
- **Engine additions since §5:** toolbelt (§2b), the completability guards, `?level=N`, tool row UI.

## 9. Improvement wave (2026-09-02)

Chosen after the first live deployment, from a scripted-play review; implemented in this order.

**Engine core (Fable seat):** continue from the highest level reached (localStorage, CONTINUE button on the
title and on death) · exit guidance once a level is clear (green marker over the door in view, edge arrow
otherwise) · yarn balls detonate on first cat contact · flashlight cone (the centre of the view stays brighter
in dark levels, fog ≥ 0.3) · cat pathing by a BFS distance field from the player (refreshed on cell change /
0.3 s) instead of wall-hugging · spray feedback (cyan hit marker, splash sprite on the cat) · reduced-flash
option (FLASH button: vignette instead of full-screen hurt flash, no wail tint) · minimap pickups drawn as
crosses · debug cheats only on localhost or `?debug=1` · engine split: `sprites.js` (cat art, facings) and
`audio.js` (soundtrack) with fixed APIs so they can be built independently.

**Workers:** ambient soundtrack per theme (`audio.js`, WebAudio only) · directional cat sprites
(front/left/right/back per type, `sprites.js`) · three more tools (laser pointer L6, vacuum L8, treats L10),
level select, per-level results line on the intro card, COPY RESULT share text, mobile portrait layout
(`engine.js` + `index.html`).

**Then:** difficulty tuned by actually playing through the browser controls (levels 10–12 first), and the
public repo gets a validator workflow (`.github/workflows/validate.yml`).

## 10. Tuning pass from hands-on play (2026-09-02)

Played through the browser pane with real key/button inputs (pause between decisions; see
`tools/play-helpers.js`). Full notes in the session log; what changed:

- **Spray cone** was ±9° at two tiles; pincer pairs sat at 25–30° and whole bursts missed. Now ±26° (plus
  body-width at point-blank), nearest cat first. Held fire 3.5/s → 2.9/s (taps still fire instantly).
- **Grace period:** nothing wakes or moves while the level card is up (~2.8 s). L10 used to land its first
  swipe during the card.
- **Melee wind-up:** 0.8 s before a cat's first swipe after reaching you, 1.1 s cadence (was ≤0.5 s / 0.9 s).
- **Boss timers:** Matriarch's first kitten call at 12 s, Bastet's first summon at 14 s (both were 5 s, so
  the designed "boss alone" openings never happened).
- **Per-level knobs:** `difficulty: { dmg, speed }` in a level file. L1 dmg ×0.6, L2 ×0.8, L3 ×0.9.
- **Stuck fallback:** a chaser that hasn't moved for 0.4 s nudges around the obstacle.
- **Pause** (P / Esc / HUD button), needed for phones and for testing.

Still open after this pass: water economy on L10–L12 is fine on paper with ≥55% accuracy and the wider cone
should deliver that, but a full human clear of L10–L12 has not been played; bowls hidden in alcoves
(L10) are easy to miss.

## 11. The Doom systems (design, 2026-09-02)

Research pass against the 1993 original: CatDoom had the shooting and the atmosphere but none of Doom's
*interacting* systems. Each one below is re-skinned so it reads as a cat thing, not a demon thing.

| Doom system | CatDoom version | How it plays |
|---|---|---|
| Secrets + intermission tally | **Hidey-holes.** `?` = a wall cell that yields when walked into (rendered with the room's wall texture plus a faint claw-scratch as the tell). Behind it, `$` secret floor cells holding a stash (catnip, a bowl, tuna). | First step onto a `$` cell: "SECRET FOUND" + count. End-of-room card grades CATS %, BOWLS %, SECRETS %, TIME vs PAR (`par` seconds in the level file) and a letter grade. Best time and secrets found persist per level and show under the level-select buttons. |
| Monster infighting | **Cat fights.** Any cat hurt by another cat (a hairball, a scared or bagged cat crashing into it, a litter-box blast started by a cat) turns on the attacker for 8 s: chases and swipes it instead of you. | "CAT FIGHT!" message. Stand behind a pack so a hurler's hairballs land on its friends. Boss summons never fight their boss. |
| Pain state | **Flinch.** Each spray hit has a per-type pain chance (kitten 90, tabby 70, zoomie 80, void 60, hurler 60, sphynx 50, ghost 50, tuxedo 40, wailer 35, chonk 15, matriarch 8, bastet 5). A flinch stops movement and attacks for 0.35 s and resets the swipe wind-up. | Rapid taps stun-lock kittens; bosses shrug it off. The spray finally *interrupts* the swipe that was about to land. |
| Sound propagation | **They hear the bottle.** Spray noise travels through open floor (BFS distance ≤ 9 cells, reusing the distance field), not through walls. | Sleeping cats behind a wall stay asleep; sneaking past a room is a real option. |
| Keys and locked doors | **The collar tag.** `L` = a locked door (wall id 6, drawn with a cat flap and a padlock). `K` = the tag on the floor, guarded. Walking into the door with the tag opens it for good. One per level where used; the validator proves the tag is reachable without the door and that the door matters (exit behind it). | Forces the Romero revisit: clear the room, find the tag in a side room, come back through territory you know. |
| Skill levels | **KITTEN / CAT / LION** on the title. Kitten: damage ×0.6, bottle 90. Cat: as tuned. Lion: damage ×1.4, cats 15 % faster, no intro grace. | Chosen per run, remembered. |
| Barrels | **Litter boxes.** `!` = a full litter box: solid, 40 HP. A spray hit or a hairball detonates it: dust cloud, 70 damage to cats within 2.2 tiles, 15 to you, chain-reacts. Cats caught in the dust are dazed 2 s. | Doom's oldest trick: bait a pack past the box, spray the box. |

Not taken from the list: armour, timed power-ups and a weapon ladder. The toolbelt already fills that slot;
adding a second damage source would dilute the spray-bottle joke.

**Legend additions:** `?` secret wall (passable, counts when passed) · `$` secret floor · `L` locked door ·
`K` collar tag · `!` litter box. **Level file additions:** `par: <seconds>`.

**Rollout:** engine + validator first (Fable seat), then the twelve level files get secrets, litter boxes,
par times and (from L3 on, every other level) a tag-and-door, by four workers, then a play pass.
