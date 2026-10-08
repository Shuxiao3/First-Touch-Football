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
| `SPACE` | Trap: press a hair before the ball reaches your reach ring (leave it and it runs past) |
| `V` | Toggle the pixel-art players / plain vector players |

**Touch**

Drag on the left half to move (double-tap to sprint). The big right-hand button is
context-sensitive — TRAP / CALL / PASS depending on the moment. Separate SHOOT / SLIDE
and hold-to-CROSS buttons sit alongside it.

## Trap Lab

**TRAP LAB** on the start menu is a practice session for testing and tuning the first touch.
A ball machine serves at you (or at an AI receiver) and the lab shows, for every ball:

- a **timing meter**: the trap window drawn around the moment the ball reaches your reach ring
  (perfect / clean / loose / heavy zones), where each of your presses landed, and dots for
  recent balls. With **GUIDE** on, a cursor shows the ball approaching in real time.
- a **result line**: the grade, how many ms early or late you were, pace in and out, which way
  the ball came off you and how far you were off its line, and how long it took to settle —
  or why it ran past (no press, pressed too early, locked out, pressed after it had gone).
- a **tally** of grades, balls that ran past, average error, and how many you settled.

The chips across the top set the serve. Each has a desktop shortcut:

| Chip | Key | What it does |
| --- | --- | --- |
| SERVE | `1`–`5` | Rolled, bouncing, thigh-high, chest-high, or a mix |
| PACE | `[` `]` | The ball's speed as it reaches you (the machine works out the launch) |
| LINE | `,` `.` | Shift the ball's line off you, to test the glancing bounce |
| NEXT | `Q` | Serve automatically, or only on cue |
| TIME | `Z` | 1×, ½× or ¼× speed |
| RECEIVER | `C` | You, or an AI teammate (kept on its own tally) |
| GUIDE | `G` | Show or hide the approach cursor |
| ▶ SERVE | `R` | Serve a ball now |
| ⚙ TUNE | `T` | The trap's dials, live: ball control, sweet spot, window, late tolerance, pace kept on a perfect / botched touch, bounce pop, re-press lockout, AI timing error |
| clear | `X` | Reset the tally |

The tuned values are the game's settings, so they carry into matches. **EXIT LAB** (next to ☰)
goes back to the start menu.

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
- **Timing-only trapping** — a trap is a bounce off a round body. Square on, the ball pops
  slightly up and back the way it came; stand off its line and it glances away from the side
  you're on. Timing sets how much pace the bounce keeps (never more than it arrived with), and
  an untrapped ball runs past you. Computer players trap with a human-like spread of error, so
  their first touch varies too. Every number in the trap is a dial; see [Trap Lab](#trap-lab).
- **Your pro** — the House tracks your own goals, assists, shots, passing, tackling and
  interceptions from live play, rates each match, and pays out skill points you spend back
  into the same creation trees. Kit trim, boots and hair carry onto the pitch.
- **Pixel-art players** — a 32×32, 8-direction sprite sheet in the Gen-4 handheld RPG style
  (idle, run, shoot, pass, slide tackle). Team kits, and your pro's trim, boots and hair, are
  exact palette swaps of one embedded sheet. The two kits differ in brightness as well as
  colour, so teams read apart at a glance (colour blindness included). See [Sprites](#sprites).
- **Feel dials** — live-tunable simulation parameters with arcade / balanced / sim
  presets, persisted to `localStorage`.
- **Practice drills** — dribbling, heading, slide and standing tackles, interceptions,
  passing, first touch, shooting, keeper reflexes, keeper distribution.

## Layout

Everything lives in `index.html`:

| Lines | Contents |
| --- | --- |
| 13 | Embedded `Baskic8` pixel font (base64) |
| 14–540 | Styles |
| 542–771 | Markup — canvas, menus, Trap Lab, career hub, tuning panel |
| 772–9204 | Engine — sim, AI, Trap Lab, rendering, career, UI |

Career saves and squads persist to `localStorage`; the feel dials persist through
`window.storage` when the host provides it.

## Sprites

`assets/sprites/player_sheet.png` is the player sheet: 32×32 cells, 4 columns (frames) by 40
rows (5 animations × 8 directions). Rows run animation-major, and directions follow the
engine's `snap8` order — `atan2` on screen in 45° steps from East, clockwise:

| Rows | Animation | Frames | In game |
| --- | --- | --- | --- |
| 0–7 | idle | 1 | stand |
| 8–15 | run | 4 | contact, passing, contact, passing — picked from stride phase; airborne players use passing |
| 16–23 | shoot | 2 | build-up while you hold `K`, then the shot after the strike |
| 24–31 | pass | 2 | backswing while you hold `J` / `L`, then the strike after any pass or cross |
| 32–39 | slide | 2 | the slide, then getting up |

Within each block the rows are E, SE, S, SW, W, NW, N, NE, and every cell's ground anchor
(between the feet) is at (16, 29). `player_sheet.json` has the same layout in machine-readable
form, with each frame's name and the palette ramps to swap for recolouring.
`player_sheet_green.png` / `player_sheet_red.png` are the in-game team kits, and
`player_sheet_preview.png` / `.gif` show every frame.

The sheet is generated, not hand-edited. `tools/sprites/make_player_sheet.py` poses a small 3D
skeleton per frame, cel-shades and outlines it, and tops it with hand-drawn pixel heads. To
change the art, edit the script and re-run it with `--embed` so `index.html` picks it up:

```sh
pip install numpy pillow                              # dev only
python3 tools/sprites/make_player_sheet.py --embed
```

## Tests

`tests/` holds optional end-to-end tests that drive the real UI in headless Chromium —
creation through to the House, a played career match, a five-match season, and the Trap Lab. They need
Playwright; the game itself stays dependency-free. See [tests/README.md](tests/README.md).
