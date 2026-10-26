# First Touch. Football

A phosphor-green 7v7 arcade football game (seven outfielders and a keeper a side) — one self-contained HTML file, no build step,
no dependencies. Open `index.html` in a browser and play.

## Play

Open `index.html` directly, or serve it:

```sh
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Football Classic (`classic.html`)

The same game played like any other football game. It's a copy of `index.html` with two changes:

- **No first touch to time.** A ground ball that reaches your man is under control at once, and a ball at chest or
  thigh height is cushioned down for you, unless you've gone up for a header. The only exception is a rocket you get
  in the way of, such as their shot or a hard-hit pass over 700 px/s, which is a block that runs loose.
- **No player lock.** You control whichever of your players has the ball. When you pass, you're on the receiver as
  soon as the ball is played, and while you leave the stick alone he runs to meet it (sprinting if it's far).
  Without the ball, PASS (`J`, or the PASS button, which reads SWITCH) switches player. Push the stick as you press it
  and you get the nearest team-mate within 60° of that direction. With the stick centred, or nobody that way, you get
  the one nearest where the ball will be a moment from now. `SPACE` does the same. On a phone you can also swipe off the
  SWITCH button: the swipe's direction picks the man and overrides the stick. After any switch, the man you get
  keeps running the way he was going for 0.25 s (the Switch: keep his run dial) before the stick takes him over, so
  the direction you held for the last man doesn't snap him round. You can also tap or click a team-mate
  to switch to him. On the left side of a phone screen the stick still starts too.
- **One-touch passing.** With a ball on its way to you, press PASS (`J`, or the PASS button, which reads 1-TOUCH),
  or tap/click a team-mate. It's played first time the moment it arrives, to the man you tapped or whoever is that
  way, and you're on the receiver. "That way" is the stick's direction as the ball reaches you. On a phone, swiping
  off the 1-TOUCH button sets the direction instead and overrides the stick. The swipe counts as soon as it's 18 px
  long, so the ball can arrive while your finger is still down. How true it goes depends on the ball and the man. Quicker and higher is harder:
  chest height is the hardest, slow along the grass the easiest. Passing counts for most of it (70%), Ball control
  for the rest. The worst case is a dial (One-touch pass: worst spray, default 16°, also in the Pass Lab's TUNE).
  Measured mean error off line, Passing/Ball control 2/2 against 9/9: slow along the grass 3.0° v 0.8°, hard along
  the grass (1200 px/s) 4.3° v 1.7°, chest high 7.0° v 2.4°.
- **Exhibition setup is just the two clubs.** There's no "you control" picker: you start on whoever kicks off, and
  switch from there.
- **Touch passing.** With the ball, a quick tap or click on a team-mate passes to him, struck for how far away he is.
  A drag or a held press still does what it did before (the stick, a swipe shot, a skill-move drawing).
- **Through balls along the grass** are struck like an ordinary pass (the same pace and lift for the distance), into
  the space ahead of the man. The lofted through ball is unchanged.
- **Losing the ball to a slide** puts you down longer than a standing tackle (0.5 s): 0.65 s against Slide tackle 1,
  up to 1.05 s against 10, and you can't touch the ball for 0.2 s after that. When they win it, you're moved to a closer team-mate if one is
  more than 6 m nearer than your man.

- **Skill moves instead of a trap.** With the ball, draw a pattern. On a touch screen, start on the SKILL button and
  draw from there. On a computer, hold the left mouse button anywhere on the pitch. The pattern is read when you let go:
  - **Spin** (a circle or swirl): you turn as far round as you drew, from 180° to 450°, and come out facing wherever
    that leaves you. You roll up to about 2.3 m to the side the circle went (clockwise goes to your right). The ball
    goes round with your body, so halfway through it's showing on the far side.
  - **Croqueta** (an L): the ball is shifted foot to foot, and you shift about 1.8 m the way the L's second stroke goes,
    still running the same way.
  - **Cut** (a straight flick): the ball is chopped the way you flicked and popped a step ahead. It's loose until
    you get back on it.
  - **Rainbow flick** (down, then up): over 0.35 s you ease off and roll the ball back up the back of your leg, then
    flick it over your head. It peaks about 3.5 m up, is in the air about 1.15 s, and drops 1.6 m ahead of where your
    run would take you. It checks up where it lands, like a lofted pass. Leave the stick alone and you burst on to it.
    It beats a man who has committed to you. A defender who can simply turn round gets there first, and one already
    in tackling range takes it during the wind-up.

  A move gives you nothing for free. The ball is wherever the move puts it, and a defender who can reach it while it's
  showing takes it, just as he would off the stick. Beating a man means moving the ball out of his reach as he
  commits. Nobody is wrong-footed automatically: the old stumble on a sharp cut is gone from this version. Each move
  costs a little stamina.

  **Directional first touch:** a flick on SKILL while a pass is coming to you pushes your first touch that way as it
  arrives, by the First touch push dial (your own pace along it is added).

- **Dribble Lab instead of Trap Lab.** You start on a mark with the ball and one defender ahead, and try to get
  past him. A run is called BEAT HIM once you're 1.8 m past him with the ball, or TACKLED, LOST IT, or TOO SLOW
  after 10 s.
  - The defender sees the ball 0.2 s late and lunges at it when he's close (about 2.3 m, 2.8 m when pressing). The
    lunge is a 0.22 s burst at where he saw it, and it wins the ball if it's showing when he gets there. He then
    needs 0.45 s to recover.
  - Each move you made is listed with its timing against his lunge, e.g. "he lunged 83 ms later" or "17 ms after he
    lunged". The tally counts runs, beats, tackles, and for each move how often it was the one that got you past.
  - Measured against a closing defender from 10 m: a croqueta started 4.4 m from him beat him 6 times in 8, at 3.6 m
    8 in 8, at 2.8 m 3 in 8, and from 5.2 m or further, or once he'd lunged, never. A rainbow started 5.6 to 6.8 m
    from him beat him 7 times in 12, and from 8 m or further, or at 4.4 m, never.
  - Chips: DEFENDER (stands and waits, closes you down, or presses at a sprint), FROM (5, 10 or 16 m), SLIDES
    (whether he slides in), plus the usual NEXT, TIME, NEW BALL and TUNE.
  - TUNE has the skill-move dials, which also apply in matches: each move's distance and time, the cut's burst and
    pop, the rainbow's lead and height, the first-touch push, and the Dribbling, Agility and Tackling baselines.
  - Keys: `1`-`3` distance, `B` defender, `C` slides.

- **Every player looks like himself.** Players are put together from swappable parts. There's a body and a head
  in one of seven hairstyles: mop, crop, bald, afro, long, mohawk or bun. A beard and a headband can go over any
  style, and the headband is in the kit's trim colour. On top of that each player gets one of seven skin tones,
  a hair colour (natural shades, plus the odd dyed one), a boot colour and a slightly different height. A player's
  look is seeded from his name, so he looks the same every match. Keepers get their own skin and hair colour.
  The parts come from `tools/sprites/make_player_sheet.py --embed-classic`; the styles are in
  `tools/sprites/head_variants.py`, and `assets/sprites/player_looks_preview.png` shows a few looks. A career
  player's look is seeded from the player himself, so he looks the same at every club.
- **Headers are a real leap.** Going up for a header lifts a player's feet 8 px (Heading 1) to 14 px (Heading 10),
  a quarter to two-fifths of his height. It used to be up to 83 px, over two and a half times his height. That
  covers your attacking header (K), your defensive one (J) and the computer's. Your header arms in their box
  whichever end you're attacking: it used to work only at the right-hand end, so after half-time it never did.
- **Stamina bars in the team's colour**, with no shirt number beside them. The bar is the colour of the shirt the
  team is wearing, on a dark track under a light colour and a light track under a dark one. Shirts follow the
  usual rule: your side wears its home kit, and the other side wears its home kit unless the shirts are too alike,
  then its change kit, then plain white or black. So the bars never clash either.
- **The career is a manager's career.** You don't play in it. On the first screen you name yourself and your club
  and pick its colours. You start in League 2, the bottom of four 14-club leagues (League 2, League 1, Championship,
  Premium League), with a weak squad of 16 and $20,000. The game is buying and selling players: nobody's stats are
  built up by hand.
  - **The season.** 26 matchdays, home and away. You PLAY each one (the live match, in your colours, with the home
    side in its home kit) or SIMULATE it. The top two go up. 3rd to 6th play off for a third place: one-game semis
    at the higher seed's ground, then a final, with a shoot-out if it's level. The bottom three go down. There's no
    sack: however badly it goes, you carry on.
  - **Transfer windows.** Five days in the summer before the season, and three at the winter break after matchday
    13. NEXT DAY moves a window on. In a window you can bid for anyone at another club. His club takes the asking
    price, may take 85% or more (once), and turns down less. Then you agree his contract: 1 to 4 seasons at the
    wage he asks. A man rated two leagues above yours won't come. Put a man on the transfer list at your price and
    clubs bid for him every window day (now and then they bid for your best men anyway); accept or reject. Free
    agents sign any time, for wages only. In the red you can't buy or sign anyone until you're back in the black,
    but selling still works.
  - **Contracts.** Every deal runs to the end of a season. Renew it in the Office before it ends, or the player
    leaves as a free agent. Releasing a player pays off half of what's left on his deal.
  - **Scouting.** A player at another club shows a rating range until you scout him: 8 points wide, 6 and then 2
    as you grow your scouting network. One player costs $200 in League 2, up to $6,000 in the Premium League. Or
    send your scouts round a league's goalkeepers, defenders, midfielders or forwards. A scouted player shows his
    exact rating, potential and attributes. Reports last until the end of the season.
  - **Ageing.** At the end of a season everyone is a year older. Players up to 25 grow towards their potential:
    faster with 12 or more games that season, slower with fewer than 4. The late twenties hold, the thirties
    decline, and players retire from 34. The youth academy takes in 3 to 5 youngsters aged 16 or 17 every summer
    (more and better as you build it up). Promote them, or they leave at 19.
  - **The computer clubs** buy from each other and from the free agents every window day, bid for your players,
    and fill their squads up every summer.
  - **Money.** The stadium works as before: ticket price, seats, concessions, sponsor. Prize money comes at the
    end of the season: $12,000 for winning League 2, up to $1.5m for the Premium League, less the lower you
    finish. The broadcast share follows your league position, and the ground and the sponsor grow when you go up.
  - **The town.** For now its buildings sit in a row. Manager's Office (squad and contracts, tactics, fixtures,
    finances), Transfer Market, Scouting, Youth Academy, Stadium, Newsstand (news, all four tables, results, top
    scorers) and Your House (your record). The walkable town on the tileset comes next.
  - Careers save to three slots (`ft_mgr_slot1` to `3` in `localStorage`). Careers from the old player-manager
    mode (`ft_save_*`) aren't carried over.

Drills and the labs still lock you to one player. The Trap Lab code is still in the file but has no menu entry. Everything else is unchanged, including the
AI, stats and settings. Changes to `index.html` aren't carried over to `classic.html` automatically.

## Controls

**Desktop**

| Key | Action |
| --- | --- |
| `WASD` | Move (double-tap a direction to sprint) |
| `J` | Call for the ball / pass (hold for a longer ball) · head-clear an incoming cross |
| `J` `J` (double-tap) | **Lofted pass**: up over everyone and down at the receiver's feet, checking up where it lands |
| `K` | Shoot (hold to wind up: while you do, a defender who was behind you can't take it off you) / header / command a teammate to shoot · standing tackle |
| `K` + `↑`/`↓` (hold) | Curl the shot |
| `L` (hold) | Cross — or, without the ball, request a cross from a wide teammate, or slide in when they have it |
| `L` in your own half | **Clear** it instead: with the ball it's hoofed high and long at once; a loose ball is struck first time the moment it reaches your reach ring, no trap needed (press as it comes, or hold it for up to two seconds); one dropping over your head, you jump and head it away. The stick picks the direction if it points upfield, otherwise it goes up and out toward your touchline |
| `SPACE` | Trap: press a hair before the ball reaches your reach ring (leave it and it runs past) |
| `V` | Toggle the pixel-art players / plain vector players |

**Touch**

Drag on the left half to move. **Push the stick out past its ring to sprint** (the ring lights up
orange) and ease back inside it to stop, without ever lifting your thumb; push on out and the
stick follows your thumb, so you can't run off its edge. A double-tap on the left half still
sprints too. The big right-hand button is
context-sensitive — TRAP / CALL / PASS depending on the moment. Separate SHOOT / SLIDE
and hold-to-CROSS buttons sit alongside it; in your own half CROSS reads **CLEAR** and works
like `L` there. Anywhere else on the right half, off the buttons, is TRAP too.

**Directional first touch** — press TRAP (the button, or anywhere off the buttons on the right half)
and **drag** the way you want the ball to go. The trap is timed from the moment your finger lands,
exactly as a tap is; the drag only aims it. It can come before the ball gets to you or in the
moment just after (up to 0.2 s after your finger lands: the touch is still on your foot), so a
press-and-flick in one movement works. An arrow under your player shows the way it'll go. Perfect
timing puts the ball where you aimed, a couple of metres ahead to run onto (your own pace along the
aim is added); worse timing strays further off and is heavier, and turning the ball away from where
it would come off you anyway narrows the timing window, more so on a quick ball. No drag is the plain
trap. The push, aim error, turn difficulty, drag window and how far a drag has to go are dials (in
the Trap Lab's TUNE drawer and Settings).

**Button layout** — **SETTINGS → BUTTON LAYOUT** shows the game screen with PASS, SHOOT and CROSS on
it: drag them wherever suits your thumbs, tap one and set its size (70 to 180%), RESET for the
standard cluster in the corner, DONE to keep it. It's kept on the device and used in every match and
lab; the left half is still the stick and the rest of the right half still TRAP.

A ball you're running with is knocked a stride ahead every step or two, and a trapped ball comes
off you before you gather it. Either way it's still yours while it's a step away: it's back at your
feet as soon as it's in your reach again, and if you let go of the stick your player steps onto it
and collects it himself. PASS, SHOOT
and CROSS (on any device) mean what they say: pressed with the ball in reach, it's played from
where it is; pressed with it just out of reach, it goes once it's back at your feet (or is dropped
if it isn't within about half a second). Just after a ball reaches you (a pass you receive, or
your own trap) the big button reads TRAP for a quarter of a second, so a late trap tap can't turn
into a pass. Running with the ball never sets that off.

**Passes** — tap PASS for a low, firm pass to the teammate your move stick points at (or the
way you're facing): the longer it is, the more it's lifted, but never so hard it arrives too hot to
control. **Double-tap** it for a **lofted pass** (the button reads LOB on the second
tap). **Press PASS and drag** off the button for a **through ball**: the stick still picks who gets
it, and the drag picks where in front of them it goes — the ball is played into that space,
weighted so they run onto it as it gets there, and the receiver sprints for it. The spot it was
played to flashes on the pitch. Drag on the second tap of a double-tap for a lofted through ball
over the top. (A quick tap waits ~0.15 s before it goes, to see whether a second tap is coming;
a held pass, a drag and a double-tap go at once.)

**Swipe to shoot** — with the ball, swipe toward goal on the right half of the screen (off the
buttons). The swipe's line, cast from your player, picks the spot on the goal line (point past a
post and it goes for that corner; straight at the middle lets your player pick the better corner,
as an unaimed `K` shot does). How fast you flick it sets the power. **Bend the swipe to curl the
shot**: the ball bows out the same way your swipe did and bends back onto the spot, so a curled
shot still finds its target while starting out away from the keeper. The bigger the bow, the more
spin, and your Curve stat sets how hard it bends. A tap, or a swipe back toward your own goal,
doesn't shoot.

## Exhibition

**EXHIBITION** opens a match setup before kick-off. Pick **your team** and the **opponent** from the
2026/27 Premier League (◀ ▶ step through the clubs; tap a club for the full list), then pick the
player **you control** from your team's seven outfielders (a striker by default; switching clubs keeps you
in the same position). **KICK OFF** (or `Enter`) starts it; `Esc` or BACK leaves.

- Each side plays in its club colours, and the scoreboard reads the club codes (`ARS 0 : 0 LIV`).
  Your team wears its home kit. The opponent wears theirs too, unless the shirts are too alike to
  tell apart at a glance (brightness counts most, so colour-blind players can tell them apart);
  then it's their change kit, or a plain white or black one if that's no better. The keepers pick a
  top unlike either team's shirts and the grass.
- **Every club has its own shape**, loosely after how it lines up (a back four is two here, a front
  three three), and the setup shows it under the club's name:

  | Shape | Clubs |
  |---|---|
  | 2-2-3 | Arsenal, Leeds United, Liverpool |
  | 2-3-2 | Bournemouth, Coventry City, Everton, Newcastle United |
  | 2-4-1 | Aston Villa, Brighton, Chelsea, Fulham |
  | 3-3-1 | Crystal Palace, Ipswich Town, Manchester United, Sunderland |
  | 3-2-2 | Brentford, Nottingham Forest |
  | 3-1-3 | Manchester City |
  | 1-4-2 | Hull City |
  | 1-3-3 | Tottenham Hotspur |

  Both sides kick off in their club's shape, and a club's squad is made for it: wingers on the flanks
  of a front three, wide midfielders in a midfield of three or four, wing-backs in a back three with
  nobody wide ahead of it (who go up the flanks with the ball). Change a shape in the match and the
  club keeps it. A club whose line-up you'd saved before clubs had shapes stays in its 2-3-2.
- The squads are made up: fixed names, numbers and stats for each club, with stronger squads for
  clubs that finished higher last season. Every outfielder has a **playing style** (shown under his
  name, with a line about it in the TACTICS menu), and his stats are built around it (see
  [Playing styles](#playing-styles)). Line-up and stat changes you make in the match's TACTICS menu
  stay with that club for next time (and never touch the custom GRN / RED squads the labs use). A
  club kept from before styles gets its generated players back once, styled; its line-up stays.
- Your last setup is remembered.

## Trap Lab

**TRAP LAB** on the start menu is a practice session for testing and tuning the first touch.
A ball machine serves at you (or at an AI receiver) and the lab shows, for every ball:

- a **timing meter**: the trap window drawn around the moment the ball reaches your reach ring
  (the dashed ring; the dotted one inside it is the gather radius)
  (perfect / clean / loose / heavy zones), where each of your presses landed, and dots for
  recent balls. With **GUIDE** on, a cursor shows the ball approaching in real time.
- a **result line**: the grade, how many ms early or late you were, pace in and out, which way
  the ball came off you and how far you were off its line, and how long it took to settle —
  or why it ran past (no press, pressed too early, locked out, pressed after it had gone). A
  directional touch (on a phone: press TRAP and drag) reads where you aimed and how far off it
  went, whether you dragged just after the touch, and how much turning it narrowed the window; an
  amber line on the pitch shows the aim under the white one for where it went.
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
| ⚙ TUNE | `T` | The trap's dials, live: ball control, sweet spot, window, late tolerance, pace kept on a perfect / botched touch, bounce pop, re-press lockout, gather radius, the directional touch's push, aim error, turn difficulty, drag window and drag distance, AI timing error, AI reaction |
| clear | `X` | Reset the tally |

The tuned values are the game's settings, so they carry into matches. **EXIT LAB** (next to ☰)
goes back to the start menu.

## Pass Lab

**PASS LAB** (next to the Trap Lab on the start menu) puts you on a mark with the ball and a
teammate to pass to. Every pass is called in the result line: what you played (a pass, a lofted
pass, a through ball, a lofted through ball), its pace and how high it went, and then whether it
got there — the receiver's first touch and its grade, how soon it was under control — or that it
was cut out, or where it stopped instead. The tally counts passes received, by type, and the
receiver's touches. On the pitch you see your mark, where the receiver started (and their run),
and the ball's path, lofted ones drawn up in the air. Once the ball is on its way the receiver
reads and takes it exactly as in a match.

| Chip | Key | What it does |
| --- | --- | --- |
| DISTANCE | `1`–`4` | Short, medium, long or very long |
| WHERE | `,` `.` | Ahead, diagonally up or down, square up or down, or random |
| RECEIVER | `C` | Stands, or makes a run in behind (for through balls) |
| DEFENDER | `B` | None, one stood in the passing lane, or one marking the receiver |
| NEXT · TIME | `Q` · `Z` | A new ball after each pass or only on cue · 1×, ½×, ¼× |
| ▶ NEW BALL | `R` | Reset now |
| ⚙ TUNE | `T` | Passing, pass loft and pace, the double-tap window, the drag that makes a through ball, through-ball lead, lofted-pass hang time and check-up, and the receiver's ball control, AI timing error and AI reaction |

## Shooting Lab

**SHOOTING LAB** puts you on a spot with the ball and their keeper in goal (who stays on the
line until you shoot). Every shot is called — goal, saved (and how), off the post, wide or over (and by
how much), or short — with its power and pace, how far from where you aimed it crossed the
line, and how far it bent. The goal panel in the corner keeps where your last shots crossed,
seen from where you shoot, with the spot you aimed at; the pitch shows the last shot's flight
and its shadow on the grass, so you can see the curl. Swipe shots on a phone are called as
swipes.

| Chip | Key | What it does |
| --- | --- | --- |
| FROM | `1`–`4` | Penalty spot, edge of the box, 25 yards, long range |
| ANGLE | `,` `.` | Centre, left, right, or random |
| KEEPER | `B` | On or off |
| NEXT · TIME | `Q` · `Z` | A new ball after each shot or only on cue · 1×, ½×, ¼× |
| ▶ NEW BALL | `R` | Reset now |
| ⚙ TUNE | `T` | Shot power, accuracy, curve and long shots; the swipe's curl, the flick for full power and the bend for full spin; the keeper's reflexes, reach and diving |

In both labs your player uses the dials (not their own stats), so what you tune is what you
test, and like the Trap Lab the values are the game's settings.

## What's in the engine

- **7v7 match sim** with 3D ball physics (loft, curve/spin, bounce), offside, restarts,
  and possession-aware team phases, on a pitch shaped like a real one (105 × 68 m, at 25 px to the
  metre: 2625 × 1700) and marked at real size: penalty areas, six-yard boxes, penalty spots and arcs,
  the centre circle and the corners (the goals are a little wider than real ones). The camera always
  shows the full width, spreads the depth evenly so the middle of the pitch sits midway between the
  touchlines, and follows play along the length.
- **Per-player stats** — 20 outfield attributes plus 5 goalkeeper attributes. Everything
  the simulation does (pass range, spray, sprint speed, trap window, tackle reach, dive
  range, shot odds) reads from a stat, not a constant. Each outfielder's stats are built around a
  playing style; see [Playing styles](#playing-styles).
- **Pace, with the ball and without** — Speed sets how fast a man runs: 3.8 m/s at a jog and 5.4 m/s
  flat out at 1, up to 6.6 and 9.1 m/s at 10. With the ball at his feet he's slower, by a fifth at
  Dribbling 1 and a twentieth at 10. Sprinting with it tires him a little more than sprinting without
  it, and running with it at a jog tires him a little (well under half what it once did); without the
  ball, a jog gets his breath back. So a man through on goal with a defender of his own pace 4 m behind
  him, sprinting after him, gets his shot off before he's caught, from the edge of the box or closer.
- **The computer's man on the ball** — he weighs everything he could do and picks whatever scores
  best, rather than going down a list of rules where the first that fits wins: a pass to each
  team-mate (to his feet, or into the path of a man making a run, weighted to arrive with him), a carry
  in a dozen directions, taking his man on, a shot, a cross, shielding it, and, with a man on him in his
  own third and nothing on, a clearance. Everything is scored in one currency: roughly, how likely it
  is to lead to a goal for his side, less how likely it is to give one away.
  - A pass's odds come from a race between the ball and every opponent who could get to it on the way
    (a ball in the air can't be cut out until it comes down), the passer's accuracy over that distance,
    and how tight they'll be on the receiver when it arrives. Its worth is where the receiver has it
    and how much room he has there; a runner through on goal is worth a good part of a shot.
  - Over a man in the way, a long ball is chipped just high enough to be over his head where he is
    (about 2.5 m) and comes down a little short of the receiver, skipping on to him. A ball still
    bouncing up off his first touch, he lets drop before he plays it unless there's a man on him.
  - A carry is worth where he gets to before anyone can reach him. With room in front of him (nobody
    within about 6 m in the 120° ahead), a run forward is worth more than the ground it gains: it draws a
    man out to meet him and opens a ball for someone else. So he attacks the space rather than turning
    back with it, and he lets the ball go as a man comes in to meet him, not once he's on him.
  - Toward goal a carry is also worth the best he could do further on, flat out, before anyone could
    get to him: the shot from closer in (his own finishing, anyone in the way, hurried if a man's about
    to arrive) or the cross from nearer the byline, a little less the longer it takes to get there. So
    through on goal he takes it on and shoots from 10–14 m rather than squaring it; with time to get
    closer he gets closer rather than shooting from 20 m; and only once a man can get to him does he
    settle for what's on where he is. Through on goal with a man after him from behind, he stays flat
    out: easing off would only let him catch up.
  - A shot's chance comes from a table measured in this game: shots struck the way the computer
    strikes them, run onto from all over their half. About half go in from 10–14 m out and fairly
    central, a third from 16 m, one in twelve from 18 m and next to none from further out, from a tight
    angle, or from right in front, where the keeper's out at your feet. Anyone in the way of the corner
    he'd aim for cuts it down.
  - A cross is worth what's at the end of it: whether one of his will be at the near post, the
    penalty spot or the far post as it comes down, and whether one of theirs will be there first to
    head it away; and how well he crosses. It's worth more from by the byline than from 25 m. So out
    wide, with the way inside shut and men of his in the box, he takes it down the line and puts it in
    rather than playing it back.
  - With his side of the pitch crowded (three or more of theirs more than of his own within 18 m of
    the ball) and one of his free out on the far side, he can switch it: a ball lofted up over
    everyone, not much over 7 m high, and down at the man's feet, as your double-tapped lofted pass is.
    An average passer can hit one 45 m, a good one 55. He rates it a little below the same ball to a
    man with others round him, so he switches it when his side is shut, not every time he could: about
    one time in six his side's crowded like that, three or so times a side a match.
  - He gets the ball under control and looks up first (the decision-time dials say for how long, less
    with a man on him), and plays it first time only when he's pressed or a ball's clearly on. Then he
    sticks with a choice for a moment rather than changing his mind every frame.
  - A side that's had the ball a while without getting forward starts to force it (sooner for a direct
    side, later for tiki-taka).
  - A lower Off IQ misjudges the options more, and the side's way of playing and the man's own style
    tilt them (see [Playing styles](#playing-styles)).
  - Press ` (backquote) for the debug overlay: it shows the man on the ball's five best options, as he
    scored them, and the one he picked.
- **Team style levers** (press / neutral / low block · neutral / wing / counter) and per-player
  defensive personalities. Defenders close down quickly, then come in under control for the last
  few strides, and a beaten one chases back up alongside rather than through the man.
- **When the computer sprints** — most of the time it saves its legs, but it goes flat out when it
  matters: a defender or midfielder who's been beaten; every defender and midfielder within 30 m when
  one of yours is through on goal; closing down the man on the ball; covering a break; staying with a
  runner who's sprinting in behind; going for a cross or a through ball; a run in behind; getting back
  when caught upfield. Forwards jog back: a sprint all the way back would leave them nothing for the
  next attack. By full time a side has used a good part of its legs (the ceiling on its stamina is
  around 0.6–0.75), not all of them.
- **Whose ball it is** — both sides read possession the way a player would. A man running with the ball
  knocks it a stride ahead every few steps, and a pass takes a moment to arrive; through both it's still
  his side's ball: his teammates keep their runs and their shape, and the other side keeps defending as a
  block. Only the man it's for goes after it. It's nobody's ball only after a tackle or a deflection, a
  clearance, or a pass that's gone astray. Each side's shape shifts off where it sees the ball, a beat
  behind it, so a quick one-two doesn't drag everyone back and forth.
- **Defending as a block** — out of possession a team defends in lines, not man for man. The back
  line holds one height, goal-side of the ball by a gap that shrinks as the ball comes closer and
  never higher than the tactic allows; it doesn't drop for a forward standing on it (he'd be
  offside), only the defender with a runner in his zone drops with him. The midfield sits a gap in
  front and the forwards in front of that, every line sliding across toward the ball. When the ball's
  lost, a defender or midfielder caught a long way upfield sprints back goal-side of it; the rest jog
  back into shape, the forwards always (they save their legs for the next attack). One man presses the ball, and keeps him until a teammate is
  clearly better placed; the next man sits about 5 m behind him at an angle, on the inside, to cover if
  he's beaten (of a pair of centre-backs one goes and the other covers). When the man on the ball is in
  trouble — a pass played back to him, a heavy touch, his back to our goal with one of ours close, the
  touchline at his shoulder — the side presses together for a second and a half: the man on him goes in,
  the nearest other man cuts out his easiest pass, and the lines step up behind them (not in their third
  unless it's a pressing side; a low block only in its own half). When they pass, a man
  who can get onto the ball's path before their receiver goes to cut it out; otherwise the nearest
  closes the receiver down as the ball travels, to be on him for his first touch. The block reads the
  ball a beat late (about a third of a second), and a run a beat late too, so quick passing and
  well-timed runs can still open it up.
- **Positional play (the neutral style)** — with the ball, a side on the neutral style plays off one plan
  for the whole team, and every man has a job in it. The centre-backs are the rest defence: level with
  the ball in our third, further behind it in theirs (more of a gap the more men they've left up), and
  always goal-side of their highest man. The holding midfielder is the pivot in front of them (with the
  ball out wide in their third, he arrives late for the pull-back). The wide men hold the touchlines; the
  far one comes in to the back post once the ball's out wide near their box. A back three with nobody
  wide ahead of it (3-2-2) sends its outside men up the flanks as wing-backs once the ball's out of its
  third, the middle one and the holder staying back (the far wing-back too while they've two or more
  men left up). One forward pins their last
  line, in a gap in it, and the other drops between their lines (whoever is pinning stays on it unless the
  other gets clearly higher: one comes short, the other goes); out wide in their third they go to the
  near and far posts. Around the man on the ball, two team-mates take up spots at clearly different
  angles (a triangle) where a pass reaches them before any opponent can get there: further forward
  where it can be, best of all between their lines, about 12 m away, plus a way back when he's pressed.
  The men who can get there soonest go, without leaving a more important job. A spot that stops working
  is first put right with a step or two, and a set only changes when the ball goes to another man or
  a clearly better one turns up. Runs in behind are triggered: when the man on the ball is facing up,
  unpressed, with room behind their line, the man best placed (the forward on their line first) arcs
  along it and goes; two at most, down different lanes. Nobody stands within about 7 m of a team-mate,
  and only runs, and getting up the pitch after winning it back, are at a sprint.
- **Taking up a position** — a computer player heading for a position eases off over the last few metres
  instead of charging past it, and moves with a position that's on the move (following the ball,
  tracking a runner) at its pace. Only the man going for the ball, the presser and a runner go flat out.
- **Attacking movement (the wing and counter styles)** — in possession the wide men hold the touchlines (on a break they go up their
  own touchline; coming short to support is the central men's job) and one central
  midfielder holds: a gap in front of the back line, the pass out from the back (he doesn't drop in
  between the centre-backs), and once the ball's further up, behind it as a screen against the
  counter. Past halfway the full-back on the
  ball's side goes up his own flank while the other holds; the ball has to get clearly across the
  middle before they swap. Everyone else looks for space
  around his place in the shape: a pocket away from their men, with a clear lane from the ball,
  ahead of it where it can be, not on top of a teammate. Forwards work their own channel. Runs are
  triggered, not random: when the man on the ball can play it forward, a forward or a wide man near
  their line goes beyond it (a speedster or winger from further out, a target man only off the
  line), and the ball is slipped in behind as he arrives at it. On any style, in the final third the man on the
  ball shoots when he has a sight of goal (the Long Shots stat sets from how far), sets up a teammate
  with a better one, or crosses into the space between their line and the keeper when one of ours
  can get there first. A good dribbler facing a lone defender with nobody covering takes him on: he
  runs at him to make him commit, then cuts sharply past him (see *Beating a tight press*).
- **The keeper's area** — he works his whole penalty area: he comes for a loose ball or a cross anywhere
  in it, uses his hands anywhere in it, closes down a man on the ball in it, and sweeps outside it for a
  free ball he'll win. Guarding his goal, he stays between the posts.
- **The keeper's angles** — facing a man on the ball he stands about halfway between the line that
  splits the angle between his posts and his near post: not hugging the post (that leaves the far
  corner to anyone wide of him), and closer in, he comes off his line toward the man. From a tight
  angle by the byline he doesn't step out level with him: he stays near his line on his near post, where
  stepping out would leave the far post. Shots from by the byline, or from the corner of the box, now
  rarely go in.
- **Crosses and headers** — the computer's cross comes down through head height where it's aimed, so
  the man attacking it can meet it (it used to sail on over everyone). Its defenders go up for a cross
  into their box: the man nearest where it'll drop gets goal-side of it and heads it away, and if one
  of the other side goes up with him it's a heading duel (Heading against Heading). Your cross comes
  down through head height too, where the man it's for is going: tap it and it's driven in low and
  quick (no quicker than 26 m/s), hold it and it's floated. It used to go up like a lofted pass, for
  a man to jump for, and come down beyond him. A header on goal follows the same rules for the
  computer's men as for yours: toward the side away from the keeper, but not right into the corner
  (you can't place a header like a shot), as true and as hard as the Heading stat makes it.
- **The keeper's ball out** — on a goal kick the back line splits to the corners of the box and the
  holding midfielder drops in front of them. The keeper plays it short only to a man who'll reach
  it before any of theirs can close him down, struck to arrive at him, and tells him it's his; he
  waits a moment for his team to set if he has to. Nothing safe short, he goes long to a man who'll
  win or contest it, or into the open side of the pitch.
- **Beating a tight press** — a sharp cut on the ball (55° or more, at pace) wrong-foots a defender
  who's right up against the man on it, or diving in at him: he stumbles and can't tackle for a
  moment (0.45 s on the *Beat a tight press* dial, longer against a good dribbler, shorter for an
  agile defender). When you're defending, only diving in gets you caught; standing close is fine.
- **Career mode** — every club in the league world has a shape that goes with how it plays (a passing
  side keeps men in midfield, a wing side has wingers, a direct side two up front, a counter-attacking
  side a back three); an opponent picks its starters to fit it, and the office shows your next
  opponent's shape. Create-a-pro with stat trees, a 4-tier league world with simulated
  fixtures and tables, promotion/relegation, finance (gate receipts, sponsors, broadcast,
  concessions, wages), stadium upgrades, loyalty, and week-by-week progression.
- **Timing-only trapping** — a trap is a bounce off a round body. Square on, the ball pops
  slightly up and back the way it came; stand off its line and it glances away from the side
  you're on. Timing sets how much pace the bounce keeps (never more than it arrived with). A
  late touch catches the ball as it's already going by, so it glances on past you rather than
  back, and an untrapped ball runs past you. A ball you take running its way (it's catching you
  up, or you're catching it) is judged against your run, so it stays with you rather than being
  knocked back behind you. Two radii: your **reach** (from Ball control) is where you can first meet
  the ball, when the timing is judged, and where you take it back afterwards (a dead ball too); the
  **gather radius** is the same for everyone — the touch comes off you there — so a big reach never
  sends a touch further away. You can't take it back for a moment after the touch (longer after a
  worse one): a good touch is at your feet at once, a heavy one has got away. Computer players trap with a human-like
  spread of error, so their first touch varies too (mostly clean, some loose, the odd heavy one),
  and like you they take a moment (0.15 s by default, a little less for agile players) to react to
  where their touch went, easing off what they were doing meanwhile rather than running on, so a
  heavy one can still get away from them. Every number in the trap is a dial; see
  [Trap Lab](#trap-lab).
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
- **Three labs** — Trap, Pass and Shooting: every rep called and tallied, with the relevant dials
  live in a drawer. See [Trap Lab](#trap-lab), [Pass Lab](#pass-lab), [Shooting Lab](#shooting-lab).

## Playing styles

Every outfield player has a style within his position, and his stats are built around it: the
position's averages shifted by the style. Pace most of all — centre-backs and holding midfielders
are the slowest men on the pitch, wingers and speedsters the quickest, and a forward's pace goes
with his build. Ratings come out about the same across styles; what changes is the kind of player.

| Position | Style | Pace (typical speed stat, 1–10) | Strengths |
|---|---|---|---|
| Centre-back | Stopper | 4 | strength, heading, tackling |
| | Ball-playing CB | 4.5 | passing, composure, control |
| | Cover CB | 5.5 | reading the game, interceptions |
| Full-back | Full-back | 6.5 | stamina, crossing |
| | Wing-back | 7.5 | crossing, dribbling, engine (defends less) |
| Midfield | Anchor (DM) | 4.5 | tackling, interceptions, strength |
| | Playmaker (CM) | 4.5 | passing, vision, bend |
| | Box-to-box (CM) | 5.5 | stamina, tackling, shooting |
| | Creator (AM) | 5.5 | dribbling, the killer ball, shooting |
| | Wide midfielder | 6.5 | stamina, crossing |
| | Winger (wide midfield) | 8 | dribbling, crossing |
| Forward | Target man | 5.5 | strength, heading, holding it up |
| | Poacher | 6.5 | finishing, composure, movement |
| | Complete forward | 6.5 | link play, passing, shooting |
| | Inside forward | 8 | cutting in, bend, shooting |
| | Winger | 8 | dribbling, crossing |
| | Speedster | 8.5 | pace, runs in behind |

The style also shapes how a player is used: an Anchor is the one who holds in midfield, speedsters
and wingers make runs in behind sooner and from further out, and a target man stays on the line.
On the ball it tilts his choices: wingers and inside forwards fancy taking their man on (an inside
forward a shot too), a speedster running with it, a playmaker or creator the ball through, a poacher a
shot; a target man holds it up, and a stopper or an anchor keeps it simple. The side's way of playing
tilts them too: tiki-taka keeps the ball and passes quickly, direct looks forward first and further, a
wing side crosses more, and a counter goes quickly while the break is on.
In a career, each sub-role (CB, FB, DM, CM, AM, STK, WNG) has its styles; players signed before
styles existed are labelled with the style their stats already fit, and keep their stats.

## Layout

Everything lives in `index.html`:

| Lines | Contents |
| --- | --- |
| 13 | Embedded `Baskic8` pixel font (base64) |
| 14–601 | Styles |
| 603–870 | Markup — canvas, menus, exhibition setup, the labs, career hub, tuning panel |
| 871–10564 | Engine — sim, AI, clubs, the labs, rendering, career, UI |

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
python3 tools/sprites/make_keeper_sheet.py --embed    # the keepers' sheet (below)
```

`assets/sprites/keeper_sheet.png` is the keepers' sheet, made the same way by
`tools/sprites/make_keeper_sheet.py` (which reuses the player renderer): long sleeves and gloves,
and his top, socks, shorts and trim recoloured in the game — the top to the team's keeper colour
(one unlike either side's shirts), the shorts and trim dark. Same 32×32 cells and ground anchor:

| Rows | Animation | Frames | In game |
| --- | --- | --- | --- |
| 0–7 | ready | 1 | set, watching the ball |
| 8–15 | shuffle | 2 | side-stepping along his line, still facing the ball |
| 16–23 | run | 4 | going for a ball or a man |
| 24–31 | hold | 1 | the ball gathered into his chest (the ball itself isn't drawn meanwhile) |
| 32–39 | kick | 1 | just after he's sent it out, toward where it went |
| 40–43 | dive | 2 | the stretch, then down on the turf: up the screen and down it, facing E, then facing W |

A dive along the goal line runs toward or away from this camera, so the stretch goes forward as
well, climbing toward the top corner or dropping toward the bottom one, and reads at full length.
The head is bigger than the arms can reach past, so the gloves are painted in front of the face, as
a pixel artist would. `keeper_sheet.json` has the layout and `keeper_sheet_preview.png` every frame.

## Tests

`tests/` holds optional end-to-end tests that drive the real UI in headless Chromium —
creation through to the House, a played career match, a five-match season, the exhibition setup,
the labs, and Football Classic's manager career (a season through both windows, promotion, the playoffs,
a played match). They need
Playwright; the game itself stays dependency-free. See [tests/README.md](tests/README.md).
