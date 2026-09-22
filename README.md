# First Touch. Football

A phosphor-green 7v7 arcade football game — one self-contained HTML file, no build step,
no dependencies. Open `index.html` in a browser and play.

## Play

Open `index.html` directly, or serve it:

```sh
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Controls

**Desktop**

| Key | Action |
| --- | --- |
| `WASD` | Move (double-tap a direction to sprint) |
| `J` | Call for the ball / pass · head-clear an incoming cross |
| `K` | Shoot / header / command a teammate to shoot · standing tackle |
| `K` + `↑`/`↓` (hold) | Curl the shot |
| `L` (hold) | Cross — or, without the ball, request a cross from a wide teammate |
| `SPACE` | Trap (timing-graded first touch) |

**Touch**

Drag on the left half to move (double-tap to sprint). The big right-hand button is
context-sensitive — TRAP / CALL / PASS depending on the moment. Separate SHOOT / SLIDE
and hold-to-CROSS buttons sit alongside it.

## What's in the engine

- **7v7 match sim** with 3D ball physics (loft, curve/spin, bounce), offside, restarts,
  and possession-aware team phases.
- **Per-player stats** — 20 outfield attributes plus 5 goalkeeper attributes. Everything
  the simulation does (pass range, spray, sprint speed, trap window, tackle reach, dive
  range, shot odds) reads from a stat, not a constant.
- **AI cascades** — separate carrier, defender, and keeper decision trees, with team
  style levers (press / neutral / low block · neutral / wing / counter) and per-player
  defensive personalities.
- **Career mode** — create-a-pro with stat trees, a 4-tier league world with simulated
  fixtures and tables, promotion/relegation, finance (gate receipts, sponsors, broadcast,
  concessions, wages), stadium upgrades, loyalty, and week-by-week progression.
- **Feel dials** — live-tunable simulation parameters with arcade / balanced / sim
  presets, persisted to `localStorage`.
- **Practice drills** — dribbling, heading, slide and standing tackles, interceptions,
  passing, first touch, shooting, keeper reflexes, keeper distribution.

## Layout

Everything lives in `index.html`:

| Lines | Contents |
| --- | --- |
| 13 | Embedded `Baskic8` pixel font (base64) |
| 14–451 | Styles |
| 453–654 | Markup — canvas, menus, career hub, tuning panel |
| 655–8334 | Engine — sim, AI, rendering, career, UI |

State persists to `localStorage` under the `ft7_` prefix (settings, squads, career saves).
