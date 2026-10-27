# Tests

End-to-end tests that drive the real UI in headless Chromium. The game itself stays
dependency-free — these are optional and are not needed to play or ship it.

## Running

They need [Playwright](https://playwright.dev). If it is installed globally, link it in:

```sh
mkdir -p tests/node_modules
ln -sfn "$(npm root -g)/playwright" tests/node_modules/playwright
ln -sfn "$(npm root -g)/playwright-core" tests/node_modules/playwright-core
```

Then:

```sh
node tests/house-ui.mjs        # ~15s  — creation, the three House tabs, save shape
node tests/house-rollover.mjs  # ~10s  — a finished season is filed into career history
node tests/house-match.mjs     # ~90s  — plays a career match, checks the report and payout
node tests/house-season.mjs    # ~7min — plays five matches, checks accumulation
node tests/manager-career.mjs  # ~40s  — Football Classic's manager career: creation, every building, a signing, the windows, a season to the review, promotion, the playoffs, goals credited
node tests/manager-match.mjs   # ~70s  — Football Classic's manager career: a live match through to the report
node tests/classic-tactics.mjs # ~30s  — Football Classic's tactics: a shape with the ball and one without (1-3-3 and 1-4-2 attacking only, 4-2-1 and 4-1-2 defending only, for the computer too), width, the style and the posture set apart, anyone anywhere (the keeper too, dragged into goal), dragging men (swap, a sub on and off, what he'd be worth in each spot, the squad list onto its little pitch; no MOVE / SWAP), instructions by position (what each spot can be told, kept through a swap, followed in the match), the pause menu's four buttons, the match's tactics (faces on the pitch, none on the bench, his card head to toe, the other phase's shape, no YOU badge), a sub in the match by drag, skill stars
node tests/classic-sprites.mjs # ~10s  — Football Classic's players: every man has an eye colour of his own, swapped into his sheet (the keepers' too), and the pixel shadow under the sprites (the plain one with them off)
node tests/classic-pitch.mjs   # ~10s  — Football Classic's pitch: the art on by default, the far touchline at 100 px under the stand, a white pixel line, the specked turf, the ground moving with the camera speck for speck, and the vector pitch back when it's switched off; the net (a low drive and one into the side netting go all the way in, the net gives and holds them, a goal; wide of the post or over the bar it comes back off the line); the pitch a tenth smaller (2362.5 x 1530, a real pitch's 105:68), its markings in proportion, the camera as it was (the far touchline at 100, the near one drawn at 471, the men and the goal as big as ever)
node tests/classic-passing.mjs # ~15s  — Football Classic's passing: one-touch passes only short (the near man, not the far one; a far man tapped isn't played first time; nobody near: a short ball, and you're put on the man best placed for it), the turn-and-pass penalty (none lined up, more the further round, a fifth at Off IQ 10, easing off as you keep facing it); the computer's through ball (a long one struck at the 900 px/s dial along the grass, a short one at what it needs, its weight erring two or three times as much at Passing 1 as at 10)
node tests/classic-ui.mjs      # ~1min — Football Classic on a phone held sideways: every screen fits at 844x390, 844x340 and 667x375 (the start menu, Settings, the exhibition setup, a new career, the hub, every building's tabs, the season review, the pause menu, the match's tactics, the report), a player's settings only (no feel dials), the pixel frames (rounded corners), the four colour schemes, one font, nothing scrolls anywhere (a box too short for what's in it is over pages, nothing cut off; ▶ turns the market list's page, its filters on every page), a finger that moves on a man lifts him at once (held still, however long, it doesn't) and the stand-in follows it from where he was picked up, faces on the tactics pitch (not the bench), his card's two sides (RATINGS: head to toe and the six, a category opening in their place; INSTRUCTIONS: his spot's, no ratings, his name, rating and stars still on top), the other phase's shape as small faceless boxes off each spot's corner, every man's shirt number on his token (pitch and bench) and the same numbers on the other phase's boxes, room round the number and the name in every token (the pitch, the bench, the squad's little pitch), the menus' names without essays, the game as wide as the phone (no bands, the buttons over the pitch's corner, the stick on the left), the HUD's four boxes
node tests/classic-shots.mjs   # ~20s  — Football Classic's shots and keeper: a shot through a defender is blocked, one passing 1 m off him blocked at Def IQ 10 and not at 1; the keeper comes off his line as you run in on goal, then goes at the ball and takes it off you; he catches a cross into his six-yard box and leaves one to the edge of the box; a swipe shot off the way your man faces (none up to 25 degrees, all of it from 150) is slower and wilder; the near post drawn in front of a ball in the goal (pixel and plain pitches)
node tests/classic-touch.mjs   # ~30s  — Football Classic's first touch: the smaller reach (18 to 32); no timing, the touch is the player's own -- near-perfect at the back with nobody near whatever his stats, down to Ball control and Composure under pressure and in the final third; taken as it arrives, for you and the computer alike (a perfect one dead at the feet, a poor one off him), harder side-on; a man the ball is coming to turns to it as quick as his Off IQ lets him, side-steps and backs off slower than he runs and can't sprint off his front, a runner in behind runs onto a ball out in front of him flat out but checks and turns to one that comes from behind, a man darting across to cut out their pass goes flat out, a team-mate looking to get it faces the ball before it's played, and a team-mate played a pass with his back to it is square to it when it arrives at Off IQ 9 but not at 1; turned away from it a man can't take it (it comes off him, or goes past him; with time to turn he gets round and takes it); a first-time pass into space puts you on the man best placed for it, who takes a beat to see it's his; one solid green ring under the man you control, the ball in whole pixels (the plain one with the sprites off); above the waist never PERFECT (chest high it comes off him, a little at Ball control 10 and a long way at 1; knee high, Ball control 10 still kills it); the directional first touch played with real flicks on SKILL on a phone (a 24 m pass with the stick held away from it, a flick begun as a 10 m pass gets there, a 30 m pass flicked while it's 20 m off); the man on the ball's skill stars over his stamina bar, lit to his number, and nobody else's
node tests/trap-lab.mjs        # ~2min — Trap Lab: timed presses, AI receiver, tuning, exit, phone: press TRAP and drag to aim the touch
node tests/clear-swipe.mjs     # ~30s  — own-half CLEAR (keyboard + phone), swipe to shoot
node tests/pass-types.mjs      # ~40s  — lofted pass (double-tap), through ball (drag off PASS), the tap wait, PASS while running with it
node tests/pass-shoot-lab.mjs  # ~1min — Pass Lab and Shooting Lab: calls, tallies, tuning, phone gestures
node tests/exhibition-setup.mjs # ~20s  — exhibition setup: clubs, kits, the player you control, remembered, phone
node tests/touch-sprint.mjs    # ~15s  — phone: push the stick past its ring to sprint, ease back in to stop
node tests/touch-layout.mjs    # ~20s  — phone: SETTINGS > BUTTON LAYOUT, drag and size the buttons, kept in matches, RESET
node tests/ai-shape.mjs        # ~50s  — computer players keep their side's logic while the ball is knocked on or passed
node tests/positional-play.mjs # ~80s  — the neutral style: a job for every man with the ball, support, rest defence, spacing; cover and pressing together without it
node tests/on-ball.mjs         # ~90s  — the computer's man on the ball: picks his best-scored option, looks up first, runs with it, few tackles; the decision-time dials; passes land where aimed (no skied chips); with room ahead he runs into it; through on goal he shoots from close in, and with a defender of his own pace 4 m behind him that defender sprints after him and he still gets his shot off from the edge of the box or closer; with time he gets closer before shooting; out wide with the way inside shut he puts it into the box; with his side crowded and a man free out on the far side he switches it
```

`ai-shape.mjs`, `positional-play.mjs` and `on-ball.mjs` run on an instrumented copy of the game (written to a temp
folder) that exposes who has the ball, each computer player's decision tag, and each ball he plays; the game itself
is unchanged. `classic-tactics.mjs` does the same to reach the match's shapes, the positions' instructions and the stars, and
`classic-passing.mjs` to set up the one-touch scenes and read the turn penalty, `classic-sprites.mjs` to reach the
players and their baked sheets, `classic-pitch.mjs` to move the camera, redraw and set up shots at the net, `classic-touch.mjs` to set
the first-touch scenes, judge touches, step a man by hand, hold the stick and read the drawn ring and ball,
`classic-shots.mjs` to set up shots, crosses and a run at goal, hold the stick and read the drawn goal, and `classic-ui.mjs` to end a match at once,
read the match clock, send the other side's men up the pitch out of the way and skip a season to its review.

Each exits non-zero on failure and prints a PASS/FAIL line per assertion.

## Note on timing

The simulation clamps `dt` at 33ms, so a match cannot be fast-forwarded by inflating
frame timestamps — it has to be stepped. The harness pumps `requestAnimationFrame` off a
timer instead of the vsync clock, which plays a 6-minute match out in about a minute.
