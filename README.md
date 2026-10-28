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

- **The first touch is the player's own.** There's nothing to time, for you or the computer. As the ball reaches a
  man, his touch is judged from his Ball control and Composure, and how much they matter depends on the moment.
  Knocking it about at the back with nobody near, nearly anyone takes it cleanly: a defender rated 3 for both is clean
  or better every time, and perfect most of it. Pressure counts the nearest opponent, closer still if he's closing in:
  full inside 1.6 m, none beyond 5.6 m. Under pressure or in the final third, the touch is only as good as the player.
  Measured over exhibition matches, with everyone given the same stats:

  | Ball control / Composure | At the back, nobody near | Under pressure | Final third |
  | --- | --- | --- | --- |
  | 3 / 3 | 100% clean or better (85% perfect) | 33% | 46% |
  | 5.5 / 5.5 | 100% (97% perfect) | 85% | 89% |
  | 8 / 8 | 100% (100% perfect) | 100% | 100% |

  The grades are PERFECT, CLEAN, LOOSE and HEAVY (the game no longer shows them; you see the touch itself).
  - A PERFECT touch along the grass is dead at his feet.
  - Anything less comes off him like a bounce off a round body: back the way it came if he's square on, glancing off
    if he's off its line. Half the time a poor one squirms on past him instead.
  - It keeps less pace than the old timed trap did: from 6% for the best touch to 45% for the worst, falling away
    steeply. A clean touch ends a step away, a loose one a couple of metres, a heavy one a few.
  - **Above the waist it's never PERFECT.** A ball you meet at chest or high-thigh height (over 55% of a man's height)
    is never dead at your feet. It comes off your body, CLEAN at best, keeping at least 16% of its pace at Ball
    control 10 (a little way off you) and 45% at 1 (a long way), up to 8% more the higher it is. Below the waist, at
    shin or knee height, it's met as on the grass. Measured: a 450 px/s ball at chest height came off a man at 18%
    of its pace at Ball control 10 and 47% at 1; at knee height, Ball control 10 still killed it (6-8%). The old game
    chested nearly everything down dead (6-11% of its pace at either rating, mostly PERFECT). New dials: Above the waist: pace kept, best and worst.
  - A flicked first touch (a flick on SKILL as the ball comes) strays and runs on as the touch does. Above the waist
    it goes from where you met it, off your chest or thigh, not from your feet.
  - A rocket you get in the way of (their shot, or a pass over 700 px/s) is still a block that runs loose.

  The reach, where you first meet the ball, is smaller: 18 at Ball control 1 up to 32 at 10 (it was 25 to 45). How
  far a touch can fall from the likely one is a dial: First-touch spread ×, default 1.
- **A man the ball is coming to faces it.** Played to him, loose and his to go and get, or just rolling at him: he
  turns his body to it as it comes, as quickly as he reads it (his Off IQ), and gets to it however he must. Yours too,
  while a pass is on its way to you.
  - **Turning is Off IQ.** A half turn takes 0.82 s at Off IQ 1, 0.43 s at 5.5 and 0.28 s at 10.
  - **Off his front he's slower, and he can't sprint.** Side-on he shuffles across at 72% of his running pace, and
    backs off at 55%. Agility moves both: 66% and 50% at 1, 78% and 61% at 10. Facing the ball, he goes at it flat out.
  - **A long way across or away from it**, he turns and runs, and turns back to face it in time. The slower he
    turns, the sooner he has to start.
  - **Team-mates looking for it face it too, before it's played.** With one of yours on the ball, a man within 14 m
    of it, or one up to 32 m off who's free (nobody within 4 m) with the way to him clear, turns to face the ball,
    so he's ready for the pass. A man making a run keeps facing his run.
  - **A through ball** the runner meets where it's played: out in front of him, he runs onto it flat out. If it
    comes to his side or from behind, he has to check, turn and face it.
  - **A man going after a ball that's running away from him** chases it. A man darting across to cut out their
    pass goes flat out for the spot and stretches for it as he gets there.
  - **Turned away from it, he can't take it.** If the ball is behind him as it reaches him (more than 110° from the
    way he faces), or it's coming at him from behind where he can't see it, he gets nothing on it. If it runs into
    him it comes off him, a little bounce and most of its pace gone, and it's nobody's. If not, it goes past him.
    A ball in the air is the same: one dropping onto his back comes off him, one over his head goes on.
    (Dead or crawling balls he just turns and picks up.)
  - **Side-on, the touch is harder**, up to a quarter of the way from the easiest touch to the hardest. Cutting out
    their pass is a stretch whichever way he faces, as it always was.
  - The sprite faces the ball while he does all this, so you see him side-step and back-pedal.
  - Measured over eight three-minute computer-against-computer matches, men took 54 to 77% of their passes with
    their backs to the ball before any of this, and 0 to 2% now. Goals, shots and interceptions are as they were: 18
    goals, 45 shots and 14.5 interceptions a match, against 18, 42 and 14.0. A ball comes off someone's back about
    eight times a match.
  - The dials, in the Trap Lab's TUNE: Body turn ×, Side-step speed, Back-pedal speed, Touch off-square and Back to
    it from (°).
- **On the pitch.** The man you control has one solid green ring on the grass at his reach. The dotted reach ring,
  and the ring under whoever had the ball, are gone. The ball is drawn in whole pixels like the players: white with
  dark patches, turning as it rolls, its patches amber while it's bending. It has a pixel shadow, and a solid ring
  marks where it will land while it's in the air.
- **A goal goes in the net.** A ball that crosses the line between the posts and under the bar carries on into the
  goal, and it's a goal once all of it is over the line. Play stops, but the ball doesn't: it runs on into the net.
  - **The net is 1.6 m deep**, with a back, two sides and a roof that falls from the bar to the back bar.
  - **Each part gives where it's hit**, the harder the shot the further: up to 0.8 m (20 px). It takes all the
    ball's pace on the way, eases it back off and lets it drop to the floor of the goal.
  - **Nothing goes through it** or out of the back.
  - The netting is drawn pushed in where it was hit, and it wobbles back after.
  - Wide of a post or over the bar, the ball still comes back off the line.
  - **The near post and side netting are in front.** A ball in the goal, or a keeper on his line, is drawn behind
    the near post and seen through the near side netting. Before, they were drawn over them. Once the ball is in,
    every part of the goal nearer the camera than the ball is in front of it.
- **Defenders block shots.** A shot that passes close enough to a defender, below his shoulders, is blocked: it
  comes off his body or a leg, losing most of its pace, and it's a loose ball. How close is his block reach: 1 m
  (the Shot block: reach dial), a little more or less for his Def IQ, 22 px at Def IQ 1 up to 28 px at 10. The
  difference is kept small on purpose (Block: Def IQ spread, 12% either way). Hard shots are checked along their
  whole path, so one can't skip through a man between two frames. A scuffed or rolling shot is just a ball he can
  take.
- **The keeper closes a man down.** With one of theirs on the ball coming in on goal (from 5 m outside the box), the
  keeper comes off his line to narrow the angle. He's about 2.5 m out with the man at the edge of the box and 6 m or
  so with him 8 m out, leaning to his near post as before. Once the man is close (7 m), with none of his own
  between them, he goes straight at the ball, and at the man's feet he takes it off him. His reach and a dive at the
  feet (Diving) decide how close that is. Out closing a man down he can leave his posts, anywhere in his box.
- **The keeper claims crosses.** A cross into his six-yard box, or just past it, that he can get to while it's
  within his reach (hands up, a little higher than the bar), he comes for and catches, over everyone's heads: the
  men going up for it leave it to him. One that comes down further out he leaves to his defenders.

- **Made for a phone held sideways.** Every screen fits 844×390, 844×340 (Safari's bar showing) and 667×375 (an
  iPhone SE), and no word or number runs out of its box (checked at 640×360 up to 932×430).
  - **Nothing scrolls.** A list or a table with more in it than fits shows a page of it, with ◀ 2 / 3 ▶ along its
    foot; hold an arrow to flip through the pages. Pages break between rows, never through one: a list keeps its
    filters on every page, a table keeps its head row, and a heading moves over with the rows it heads. A player's
    card never goes over pages, anywhere: it's made to fit. Measured on a new career at 844×390: the squad over 4 pages, the market's list of League 2
    over 42 (5 to a page, the league and the positions on one line above them), the league table over 3.
  - **The menus are pixel windows**, after a handheld RPG's menu kit: a dark outline round rounded corners, a thin
    light rim inside it, buttons in two tones (a light top over a darker band) and text with a one-pixel shadow.
    What's picked is lit in the scheme's second colour; being lit is the only mark. Nothing you tap is under 36 px.
  - **Four colour schemes**, in Settings → COLOURS: BLUE (blue buttons, orange for what's picked; the default),
    RUBY (red and gold), SILVER (grey and blue) and MINT (teal and pink). A money figure, a result or a rating is
    green, yellow or red by how good it is, in any scheme; in a match PASS is green, SHOOT red, CROSS amber and
    SKILL blue.
  - **One font** for everything, menus and match alike: DotGothic16 (Fontworks, SIL Open Font License), cut to the
    characters the game shows, its letters respaced to their own widths, and the few symbols it lacks (▶ ◀ ▾ ✕ ☰
    and the like) drawn in on its own dot grid. `tools/fonts/make_ui_font.py` builds it; the licence is in
    `assets/fonts/OFL-DotGothic16.txt`.
  - **Settings** are a player's: match length, how good exhibition opponents are, pixel or simple graphics and the
    colours, kept in this browser (`ftc_prefs`), plus the button layout on a touch screen. The 92 feel dials are the game's
    own tuning: players never see them and their saved values aren't loaded. A developer gets them back (with the
    labs' TUNE and EDIT STATS) with `?dev` in the address or five taps on the build number on the start menu.
  - **The buildings.** One line across the top: ◀ TOWN, the building, its tabs. A message shows as a toast along the
    bottom. The squad, the market's lists, the scouts' reports and the academy put the list on the left (over pages
    if it's long) and the man you tap on the right. His card is drawn as on the tactics screen, never goes over
    pages and has no long text on it: his figure, name, own position, style, age, stars, rating and potential on
    top, and one small button under his rating (DEAL ▶, then RATINGS ▶) turns it over; the side you're on stays as
    you go from man to man. One side has his six numbers (pace, physical, technique, passing, shooting, defending,
    each the average of its attributes, as in **The six** below; tap one and what it's made of opens under them, a
    coloured bar for each rating, tap it again to shut it), and for your own man his games and goals this season; a man you haven't scouted shows ?
    for each, with SCOUT HIM. The other side, his deal, has what he earns or costs in a small grid, then what you
    can do about him, a line each: in the Squad tab his contract (a new deal, releasing him); in the market's
    Selling tab selling him (the two best bids, the transfer list); for another club's man the asking price,
    scouting him and your offer; for a free agent signing him; for a youngster promoting him. In the Squad tab his
    card has the right side to itself (◀ THE TEAM, or a tap on him in the list, for the little pitch), and the
    little pitch comes back as you pick a man up to drop on it.
  - **Tactics.** The pitch first, on its side as in a match, your goal on the left. Above it, one row: with or
    without the ball, then menus for the shape, the width and the style -- just the names, the style's seven two to
    a line -- and BEST 8. Under the pitch, on one line, the bench: four men, the subs you'll have in a match. After a thin line
    come the rest of the squad, in reserve, dimmed: drag one onto a man on the bench or the pitch to swap them (BEST
    8 puts the best four of the rest on the bench). The tokens narrow to fit; if they still don't (a squad from
    before squads were capped), the reserves show a page at a time, with a small 1/2 ▶ button to turn to the next,
    the bench's four always there, so the pitch never loses height. On the right, from under that row to the foot of the screen, the
    card of the man you tapped. Every man on the pitch shows his face (his own look, in the club's kit) beside two
    lines: his rating and his own position (GK, CB, FB, DM, CM, WM, AM, WNG, STK) on top, his name and shirt number
    under them. The bench has the same two lines without the face, in a shorter box, so the pitch gets the height.
    The lines sit inside each token with room round them, clear of its edges.
  - **The width shows on the pitch.** COMPACT draws each line's men closer together and WIDE spreads them, the lines
    running down the pitch's height (a WIDE line's end men reach its edges). No man is drawn over another or off the
    pitch, at any phone size: on a short screen a line's men stay at least a man's height apart, and on a narrow one
    the keeper and the three lines close up, a man's width each, rather than overlap -- in a match's tactics and the
    Squad tab's little pitch too. It used to look the same whatever the width, and a four across the middle overlapped.
  - **His card has two sides**, turned over with one small button under his rating (INSTRUCTIONS ▶, then RATINGS
    ▶, one size either way). The top is the same on both: all of him, head to toe (a keeper in a keeper's top),
    his name, his own position, style, age, skill stars and rating (amber out of position: no line of text says so,
    nor that he's on the bench), and in a match his stamina: the word and a bar, no figure. Under it, the ratings side has the six (tap one and what
    it's made of opens under them: its name and a row for each rating, with a coloured bar; on a phone 360 px tall
    or less a category of four ratings puts them two to a line); the other has his spot's instructions for
    the phase you're looking at, just each one's name and its options, no descriptions, and no ratings. The side
    you're on stays as you tap from man to man. His card never goes over pages: it has the whole right-hand side,
    and everything on it fits, down to 640×360. On a short phone his figure and name are drawn a little smaller; on
    a narrow one (700 px wide or less) his name stays on one line. The button that turns it over sits under his
    rating, its foot level with the foot of his stamina bar.
  - **The other phase's shape** is a small lit box with each man's shirt number and name (the number his token
    shows, so you can tell whose box is whose), off the bottom-right corner of his spot, the forwards' too: on WITH
    BALL you see where each of them goes without it, and the other way round. It's no longer a full token tucked
    under the man, with his face, that you couldn't see.
  - **In a match**, the pause menu is four buttons: TACTICS, SETTINGS, EXIT and BACK. TACTICS opens the same
    pitch-first screen on the match itself, with each man's stamina on his card (and the two sides: the other team's
    men show their ratings only). Your four subs are on the bench: drag one onto a man to bring him on, on fresh
    legs. That's two subs a match, and a man taken off can't come back. Every exhibition club has a bench of four
    too (a keeper and a man for each line), a little short of its starters.
    Swapping men's spots is free, and the other side is there to look at.
  - **The match** has the score, the way you're kicking and the clock along the top, then, top right beside the
    menu, **your man's window**: his number, full name and position over his stamina bar (the red tick on it is
    how far it can come back, as over his head) and his skill stars, lit gold up to his number, so you know what
    he can do with the ball. Switch and it's the new man's. A club's man in an exhibition has only his surname
    on his card, so the window gives him a first name, always the same one. No stars over anyone's head now.
  - **The match report** is the score along the top, two columns under it, and CONTINUE pinned bottom right.
  - **As wide as the phone.** The game screen's height is fixed and its width follows your screen's shape, so a
    phone held sideways sees more of the pitch across (1169 wide at 844×390) instead of black bands either side.
    The buttons stand over the pitch's bottom-right corner, the stick starts anywhere on the left, and buttons
    you've placed yourself in BUTTON LAYOUT stay where you put them.
  - **Fixed along the way.** A new career can be started by touch (Start was cut off below a card that didn't
    scroll). In a match the tactics card is no longer left blank after a visit to the Office's tactics. The pause
    menu, Settings and the new-career card keep clear of the notch.
- **No player lock.** You control whichever of your players has the ball. When you pass, you're on the receiver as
  soon as the ball is played, and while you leave the stick alone he runs to meet it (sprinting if it's far), once
  he's read it (his Off IQ: see **Off IQ meets the ball**).
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
  long, so the ball can arrive while your finger is still down. You're put on the man it's going to (played into
  space, whoever's best placed to get to it). He takes a beat to see it's his (0.35 s at Off IQ 1, 0.15 s at 10)
  before he turns to it and goes to meet it, and the stick you aimed it with, still held that way, doesn't steer him
  until you let it go or push it somewhere new. How true it goes depends on the ball and the man. Quicker and higher is harder:
  chest height is the hardest, slow along the grass the easiest. Passing counts for most of it (70%), Ball control
  for the rest. The worst case is a dial (One-touch pass: worst spray, default 16°, also in the Pass Lab's TUNE).
  Measured mean error off line, Passing/Ball control 2/2 against 9/9: slow along the grass 3.0° v 0.8°, hard along
  the grass (1200 px/s) 4.3° v 1.7°, chest high 7.0° v 2.4°.
  - **One-touch passes are short passes.** A first-time pass only goes to a team-mate within 18 m (the One-touch
    pass: longest dial, in the Pass Lab's TUNE), along the grass. Tap a man further away as the ball comes in and
    it isn't played first time: the screen says TOO FAR TO PLAY FIRST TIME, and you take it as normal. With nobody
    near enough the way you've aimed, it's a short ball (14 m) into the space there. The computer's first-time
    passes, played while it's still looking up, are short too: a longer ball waits for a touch.
- **Turning and passing costs accuracy.** A pass played the moment you've turned to face it goes less true than one
  you've been lined up for. The game reads your facing over the last ~0.3 s against the way the ball goes.
  - **The angle.** Up to 20° costs nothing. At Off IQ 1 the worst spray is 6.1° turned square and 14° right round
    (the Turn-and-pass: worst spray dial, in the Pass Lab's TUNE). Most passes land well inside the worst.
  - **Off IQ** is the only stat that matters here: at 10 the penalty is a fifth of what it is at 1.
  - **Facing it for a moment takes it away.** Turned square and held there, the penalty is 76% after 0.1 s, 44% after
    0.3 s, 14% after 0.6 s and gone by 1 s.
  - **Every pass gets it**, yours and the computer's, one-touch passes and through balls included. The computer
    knows it. With time on the ball (nobody within 5.6 m), a man about to play it across his body turns to face it
    for 0.3 s first. With a man close, he plays it as he is. Measured over 15-minute computer-against-computer
    games, a side now loses the ball 33.5 times against 30.7.
- **Exhibition setup is just the two clubs.** There's no "you control" picker: you start on whoever kicks off, and
  switch from there.
- **Touch passing.** With the ball, a quick tap or click on a team-mate passes to him, struck for how far away he is.
  A drag or a held press still does what it did before (the stick, a swipe shot, a skill-move drawing).
- **Through balls go along the grass, through the gaps.** Your through ball (PASS and drag) skips along no higher
  than a man's knee: 3 px off the grass at 17 m, 10 px at 33 m. It used to be struck like an ordinary pass, up 2.5 m
  at 25 m and 5 m at 35 m, over everyone's heads. Now their men can get a foot to it the whole way, so it's threaded:
  - **Into the gap.** The spot it's played to can move up to 1.5 m either side of where you aimed, into the gap that
    gives their men least chance (how soon each could get to it: his reach, how quickly he reads it, his pace). The
    runner runs onto it there.
  - **Round a man and back in.** It can bend out round one of theirs and curl back in to the runner, by as much as the
    passer's Curve gives him: 23° over its way at Curve 10, 2° at 1. With nobody near enough to matter, it bends into
    the runner's path, as a pass does: to a man running across its line it gets there turned 10° his way at Curve 10.
  - **Weighted for him.** It's struck to get to the spot when he does, arriving at 150 to 480 px/s: still rolling when
    he gets there, not too hot to take.
  - **The computer's through ball** goes through the gaps the same way, and weighs one up along the way it would go.
  - **Not a sure thing.** A man standing in its way still cuts it out. Scripted, with a back line of three 7 to 11 m
    apart, our runner level with it, the passer 13 to 25 m back and, half the time, a holding man in between (400
    balls each): the runner got the old one 47% of the time at Curve 1 and 50% at Curve 10, with a quarter of them
    running on out of play or dying; this one 53% and 58%, almost none going dead. In the computer's games it still
    plays one now and then (12 to 16 in 20 minutes, about 13 m long).
  - **Reading a ball along the grass.** A ball that skips but never gets 12 px up slows on the grass all the way; the
    game's reading of where the ball will be (the men cutting it out and going to meet it) had it flying free over the
    middle of its way. It reads it right now.

  The lofted through ball is unchanged.
- **The computer's through ball** along the grass is struck to die where the runner will be, but never harder than
  900 px/s (the Computer through ball dial; it was 1500, quicker than anyone could get across to). A long one would
  need more, so it gets there after him or not at all, and he doesn't play it. It's harder to judge than a pass
  to feet, too:
  - the passer misreads how soon each of your men can get across, by 0.3 s at Off IQ 1 and 0.1 s at 10;
  - its weight errs, 14% at Passing 1 and 5% at 10, and how far ahead of the runner it goes errs with his Off IQ;
  - its line errs as any forward ball's through traffic does.

  Measured in three-minute computer-against-computer matches: the last commit (on the old pitch), the old through
  ball on the smaller pitch (to tell the two changes apart), and this one:

  | | Last commit | Smaller pitch, old through ball | Now |
  | --- | --- | --- | --- |
  | Matches | 12 | 12 | 24 |
  | Computer through balls a match | 6.9 | 8.8 | 2.6 |
  | Struck at (median) | 1479 px/s | 1367 px/s | 891 px/s |
  | How far (median, the pitch's metres) | 20 m | 21 m | 14 m |
  | Got to the runner | 60% | 49% | 63% |
  | Cut out | 39% | 43% | 29% |
  | To the keeper | 1% | 1% | 5% |
  | Got through, a match | 4.2 | 4.2 | 1.7 |
  | Shots a match | 4.3 | 6.3 | 4.2 |
  | Goals a match | 1.8 | 2.1 | 1.1 |

  So it's played under a third as often as the old one would be on this pitch, and gets through 1.7 times a match
  where it got through 4.2. The computer only plays it when it's on, so more of the ones it does play get to the
  runner. Fewer goals go in, too: 1.1 a match between two computer sides, against 1.8 at the last commit.
- **Losing the ball to a slide** puts you down longer than a standing tackle (0.5 s): 0.65 s against Slide tackle 1,
  up to 1.05 s against 10, and you can't touch the ball for 0.2 s after that. When they win it, you're moved to a closer team-mate if one is
  more than 6 m nearer than your man.

- **Skill moves instead of a trap.** With the ball, draw a pattern. On a touch screen, start on the SKILL button and
  draw from there. On a computer, hold the left mouse button anywhere on the pitch. The pattern is read when you let go.
  Every player has one to three **skill stars**, from his Dribbling (counted twice), Agility and Ball control: one star
  for the cut, two for the croqueta as well, three for the roulette and the rainbow flick too. A move above his stars
  doesn't happen, and the screen says how many it needs. Two stars from an average of 5.4, three from 7: most
  League 2 forwards have two, about half of the Championship's forwards have three, and nearly all the Premium
  League's. Defenders mostly have one. The stars show on every player card, and in a match in your man's window.
  - **Roulette** (a circle or swirl, 3 stars): you turn as far round as you drew, from 180° to 450°, and come out facing
    wherever that leaves you. You roll up to about 2.3 m to the side the circle went (clockwise goes to your right). The
    ball goes round with your body, so halfway through it's showing on the far side.
  - **Croqueta** (an L, 2 stars): the ball is shifted foot to foot, and you shift about 1.8 m the way the L's second stroke goes,
    still running the same way.
  - **Cut** (a straight flick, 1 star): the ball is chopped the way you flicked and popped a step ahead. It's loose until
    you get back on it.
  - **Rainbow flick** (down, then up, 3 stars): over 0.35 s you ease off and roll the ball back up the back of your leg, then
    flick it over your head. It peaks about 3.5 m up, is in the air about 1.15 s, and drops 1.6 m ahead of where your
    run would take you. It checks up where it lands, like a lofted pass. Leave the stick alone and you burst on to it.
    It beats a man who has committed to you. A defender who can simply turn round gets there first, and one already
    in tackling range takes it during the wind-up.

  A move gives you little for free. The ball is wherever the move puts it, and a defender who can reach it while it's
  showing takes it, just as he would off the stick. Beating a man means moving the ball out of his reach as he
  commits. The old stumble on a sharp cut is gone from this version; instead a move sells the man in front of you for
  a moment, the longer the better you are than him (see **The computer does skill moves**). Each move costs a little
  stamina. How quick a move is and how far it carries you is your Dribbling: the times and distances here are at
  Dribbling 10.

  **Directional first touch:** a flick on SKILL while a pass is coming to you pushes your first touch that way as it
  arrives, by the First touch push dial (your own pace along it is added).
  - **Any ball on its way to you arms it:** one played to you, one led into space ahead of you, or one whose path runs
    within 6 m of you, from as far as 40 m off. It stays armed until the ball gets to you, or someone else touches it.
    (It used to need the ball heading straight at you from within 15 m, unless you'd left the stick alone since the
    pass.)
  - **A flick begun as the ball gets to you, or up to 0.2 s after,** is still your first touch, as long as it ends
    within 0.6 s. The ball is still on your foot, so it goes the way you flicked rather than turning into a cut. On a
    short pass the ball is often there before the flick is done.
  - **While it comes, you open your body to it:** halfway round from the ball toward the way you flicked, but never
    more than 60° off the ball or off the way it's coming, so you're never turned away from it.
  - **Leave the stick alone and you go to meet it.**

- **Dribble Lab instead of Trap Lab.** You start on a mark with the ball and one defender ahead, and try to get
  past him. You have all three stars there, to practise every move. A run is called BEAT HIM once you're 1.8 m past him with the ball, or TACKLED, LOST IT, or TOO SLOW
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
    A move's time and distance are the dials' at Dribbling 10. At the Dribbling dial's 5.5 a move takes 1.23 times
    as long and goes 85% as far, so set it to 10 for moves as quick as they were (and as the timings above were
    measured).
  - Keys: `1`-`3` distance, `B` defender, `C` slides.

- **Crossing Lab.** A cross from out on the right, over and over: the computer's, to watch who he picks and how true it
  goes, or yours. Everyone in the box is the computer, exactly as in a match; the lab only clears everyone else off
  the pitch.
  - Each ball is called: headed in, headed and saved, headed but not in; scored, saved or missed off his feet; his to
    keep; cleared; the keeper's; or nobody's. With it, who it was for and how close it came to him at a height he
    could head it (a low cross: take it). The tally counts each, how many got to one of ours (headed, or to his
    feet), how close they came on average and how far from where they were aimed. On the pitch: the spots our men are
    waiting on, where it was aimed, and its flight with its shadow.
  - The computer crosses 1.4 s after the ball's put down, once his men have taken their spots. With CROSSER: YOU it
    waits for you: hold CROSS for the man you want (the amber ring), or double-tap it for a low cross.
  - Chips: CROSSER (COMPUTER or YOU), FROM (the byline, or 8, 16 or 24 m out for an early ball), OURS (1-3 in the
    box), THEIRS (0-3), KEEPER (on or off), plus the usual NEXT, TIME, NEW BALL and TUNE. TUNE has Crossing, Curve,
    Heading, Off IQ, Def IQ and the keeper's reach and speed.
  - Keys: `1`-`4` from, `C` crosser, `,` `.` ours, `[` `]` theirs, `B` keeper.
- **Every player looks like himself.** Players are put together from swappable parts. There's a body and a head
  in one of seven hairstyles: mop, crop, bald, afro, long, mohawk or bun. A beard and a headband can go over any
  style, and the headband is in the kit's trim colour. On top of that each player gets one of seven skin tones,
  a hair colour (natural shades, plus the odd dyed one), an eye colour, a boot colour and a slightly different
  height. A player's look is seeded from his name, so he looks the same every match (the eye colour is drawn last,
  so nobody's other picks changed when it came in). Keepers get their own skin, hair and eye colour.
  - The art follows the reference overworld sprites (the handheld Gen-5 style). The head is about two-thirds of the
    figure, on a short, stocky body with the hands held out from the sides. The hair falls in clumps under a band of
    sheen, with the fringe hanging to the eyes and the outline in black. The face is small and framed by the hair,
    with 2×2 eyes (lid and iris over white and pupil, the pupils turned in) and a one-pixel mouth. Bald heads keep
    their brows.
  - The diagonals follow an 8-direction reference: turned toward you the face slides to that side and the ear to
    the other; turned away, the cheek and ear show at the edge.
  - Every sprite stands on a flat oval shadow of whole sprite pixels instead of the soft one, which comes back if
    the sprites are switched off (`V`).
- **The pitch is in the town's style.** It's drawn the way Ekat's tiles are: mint turf mown in the 14 bands and specked,
  a dithered edge to the run-off and a lawn past it, the lines, goals (mesh nets, white posts edged in navy) and
  corner flags (a salmon pennant on a navy pole) all in whole pixels.
  - The ground is rendered at half size and doubled, so it's as chunky as the players. Each screen row always shows
    the same line across the pitch, so every row's ground is worked out once and a frame only samples it; drawing a
    frame takes about a millisecond longer than the old vector pitch did. The specks are fixed to the pitch, so they
    travel with it as the camera pans.
  - The far side is one strip: sky, trees past the ends of the stand, a floodlight at each corner, a timber stand
    under a grey tiled roof with four terraces of fans and a picket fence, a paved track and the advertising boards.
    It pans with the camera at the stand's own depth, a touch slower than the far touchline.
  - The camera's far touchline is now 100 px down the screen instead of 64, so the stand shows over it.
  - The strip comes from `python3 tools/sprites/make_pitch_art.py --embed-classic`. `PITCH.enable(false)` in the
    console puts the old vector pitch back.
  - The labs' tally line sits on a dark pill now that it's over the turf rather than a night sky.
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
- **Tactics: one shape with the ball, another without it.** In a match, PAUSE > TACTICS has an OFFENSE and a
  DEFENSE tab, each with its own formation, width and way of playing (the pitch there is drawn the right way round
  again: it had been squeezed into the Office's narrow one, cutting off the keeper). In a career, the Office's
  Tactics tab has the same settings under WITH THE BALL and WITHOUT THE BALL.
  - **Formations.** There are ten seven-a-side shapes: 3-2-2, 2-3-2, 2-2-3, 2-4-1, 3-3-1, 3-1-3, 1-3-3, 1-4-2, 4-2-1
    and 4-1-2. 1-3-3 and 1-4-2 are attacking shapes only, and 4-2-1 and 4-1-2 (four at the back) are defending shapes
    only. Each pair is greyed out in the other phase, and the computer keeps to the same rule. The same seven men play
    in both shapes. Each man's defending spot starts as the one nearest his attacking spot, and you can rearrange
    either shape. A computer side defends in the shape it attacks in, with some exceptions. A front three drops a man
    into midfield unless the side gegenpresses, so 2-2-3 defends as 2-4-1 and 3-1-3 as 3-3-1. 1-3-3 defends as 2-3-2
    and 1-4-2 as 2-4-1. A direct counter sits deep and makes a back four of some: 2-2-3 and 3-2-2 defend as 4-2-1 and 1-4-2 as
    4-1-2 (1-3-3 as 3-3-1).
  - **Width.** COMPACT, BALANCED or WIDE, set separately with and without the ball. It spreads each line, and how far
    out the wide men go, by ×0.84, ×1 or ×1.18.
  - **Seven styles, and the style is the whole game.** Each says how a side plays with the ball and how it defends
    without it, so there's no posture to set any more (PRESS HIGH, MID BLOCK and SIT DEEP are gone, and so is
    TIKI-TAKA). The STYLE menu, on both tabs, has the seven two to a line; a match's tactics have the same.
    - **BALANCED**: positional play. Wide men on the touchlines, a forward pinning their back line, two men always
      open for a pass, and runs in behind when the man on the ball can find them. Without it, a compact block around
      halfway that goes at the ball together as it comes into the middle third, the forwards screening the pass into
      midfield.
    - **GEGENPRESS**: win it high and go. A high line; when they play out from the back the forwards and midfielders
      mark their men; and when it loses the ball the whole side goes straight back at it, together, for five seconds.
      With the ball it's quick and forward, men running in behind, and straight at them when it's won high.
    - **CONTROL POSSESSION**: keep the ball. Three men always close for a pass, short passes and patience (it gives a
      move 10 s before it starts forcing it, against 8), few long balls and few runs in behind until the chance is
      clear. Without it, a mid block, and two seconds straight back at the ball when it's lost.
    - **WING PLAY**: wingers high on the touchlines, the full-back on the ball's side overlapping (in a shape with
      full-backs: see below), early crosses and the forwards attacking the near and far posts. A mid block without it.
    - **DIRECT**: forward quickly. Long balls up to the forwards, the midfielders up behind them for the second ball,
      and the keeper kicking long. A mid block without it.
    - **FLUID COUNTER**: a mid block with one forward up on halfway. When the ball's won, the wide men and a
      midfielder sprint up past it and it goes forward on the carry and in short, quick passes, a man staying near
      the ball for the next one, for as long as the break keeps going (up to 10 s).
    - **DIRECT COUNTER**: two tight banks at the edge of the box, narrow and compact, nobody stepping out until the
      ball is in its half, and one forward up on halfway. When it's won it goes long, in behind, at once, for the
      forwards and the wide men racing up, and the keeper kicks long.
    - A save from before keeps its way of playing, yours and every club's: TIKI-TAKA is CONTROL POSSESSION; a
      COUNTER is a DIRECT COUNTER if it sat deep and a FLUID COUNTER otherwise; BALANCED with PRESS HIGH is
      GEGENPRESS; any other style keeps its name and now defends in its own block.
  - **Your keeper waits for you.** In a match, with the ball in his hands your keeper plays it out when you press PASS
    (on a touch screen the button reads PASS), or by himself once he's had it 5 s; for the last 2 s of that a red
    stopwatch flashes over his head. Either way it goes where his PASS instruction says: PLAYER, to the man you're
    playing as (what calling for it always did); CLOSEST OPEN or FARTHEST OPEN, to the nearest or the furthest of ours,
    up to 55 m away, that the ball gets to with time to spare before any of theirs, the man it's for with an amber ring
    while the keeper holds it; HOOF IT, as far up as it goes, to the one of ours furthest up the pitch, marked or not.
    With nobody open he kicks it long. He used to play it out on his own after about a second. The computer's keeper
    still does.
  - **Winning the ball back counts.** All a side does on winning it -- a counter's break, the men going up the pitch
    at a sprint, the counter-press, a deep block noting that it lost the ball high -- starts when the ball changes
    hands. That was read from the last touch alone, and a tackle, a block or a first touch makes the ball the
    winners' before one of them has it at his feet, so it hardly ever started: over 12 minutes a GEGENPRESS side's
    counter-press was on for 151 frames, about one loss's worth, against 4313 now. Now it's the side that last had
    it at a man's feet that lost it; restarts and kick-offs are as they were.
  - **Instructions go with the position, not the player.** Pick a player in the pause menu or the Office and you
    get the instructions of the spot he's in. Whoever plays there follows them, swaps and subs included, and each shape
    keeps its own. What a spot can be told depends on what it is: with the ball in the attacking shape, without it in
    the defending one.
    - **Centre-back**: both of a back two, all three of a back three (except in 3-2-2, where it's the middle one), the
      middle two of a back four, and a lone defender. With the ball, WIDTH (NORMAL / WIDE: the one away from the ball
      splits wider from his partner) and SUPPORT (NORMAL / PUSH UP: closer to the play in the middle and final thirds,
      past halfway once the ball's deep in their third / STAY BACK, against the counter). Without it, AGGRESSION (STEP
      UP: out to the ball, and to a man dropping in front of him, when they're near him / HOLD THE LINE).
    - **Full-back**: the outside men of a back four, and of 3-2-2's three. With the ball, RUNS (STAY BACK / SUPPORT: up
      into midfield once we're in their third / ATTACKING: in midfield from the build-up, overlapping nearer their
      goal). Without it, AGGRESSION (STEP UP / HOLD THE LINE).
    - **Central midfielder**: both of a midfield two, the middle two of a four, the middle one of a three, or a lone
      one. With the ball, SUPPORT (STAY BACK / BALANCED / RUN IN BEHIND) and CROSSES (EDGE OF THE BOX / BALANCED /
      INTO THE BOX, with the ball out wide in their third). Without it, COVER (COVER CENTRE / COVER WING: across to
      the ball's flank once it's out wide) and DEFENDING (BALANCED / INTERCEPT: in the passing lanes near the ball,
      reading passes sooner).
    - **Left or right midfielder**: the outside men of a midfield three or four. With the ball, SUPPORT (COME SHORT /
      BALANCED / FORWARD: a midfielder in the build-up and a winger nearer their goal, running in behind, cutting in if
      he's narrow and overlapping if he's wide) and WIDTH (NARROW / BALANCED / WIDE). Without it, DEFENDING (STEP UP /
      HOLD THE LINE).
    - **Winger**: the outside men of a front three. With the ball, SUPPORT (RUN IN BEHIND / BALANCED / COME SHORT) and
      WIDTH (CUT INSIDE / BALANCED / STAY WIDE). Without it, DEFENDING (COME BACK / BALANCED / STAY UP).
    - **Striker**: both of a front two, the middle one of a three, or a lone one. With the ball, WIDTH (CENTRAL /
      BALANCED / WIDE) and RUNS (RUN IN BEHIND / BALANCED / TARGET MAN: up and central, holding it up / FALSE NINE:
      dropping into midfield). Without it, DEFENDING (COME BACK / BALANCED / STAY FORWARD).
    - **Keeper**: his own, whatever the shape, on either tab: PASS (PLAYER / CLOSEST OPEN / FARTHEST OPEN / HOOF IT),
      who he plays it to. See **Your keeper waits for you**.

    The defaults (BALANCED, NORMAL, SUPPORT for a full-back's runs, HOLD THE LINE and COVER CENTRE) play as before,
    with two exceptions. A 3-2-2's full-backs used to go up their flanks from the middle third and now, on SUPPORT,
    wait until we're in their third. And WING PLAY's overlap is a full-back's only, so a centre-back of a back two no
    longer goes. A central midfielder told to RUN IN BEHIND never holds; if he's the only central one, the side plays
    without a holder. Each setting has a line under it saying what it does. A career keeps your positions'
    instructions, and an exhibition club keeps them with its squad. The per-player instructions of the last version
    are gone. Measured in 10-minute computer-against-computer games, against the same side left on the defaults:
    - **Strikers.** One told to RUN IN BEHIND is on their last line for 66% of his side's possession (38% otherwise),
      and a TARGET MAN 62%. A FALSE NINE plays 6.6 m deeper.
    - **Central midfielders.** One told to STAY BACK holds 73% of the time (40%), and one told to RUN IN BEHIND
      (and INTO THE BOX for crosses) plays 13 m further up.
    - **Wide men and full-backs.** A full-back told ATTACKING is up his flank 41% of the time (9%) and 7 m wider. A
      wide midfielder told NARROW plays 6 m narrower; a winger told to CUT INSIDE plays 9 m narrower and one told to
      STAY WIDE 3 m wider.
    - **Centre-backs.** One told to STAY BACK sits 2.4 m further behind the ball once it's past our third.
    - **Without the ball.**
      - A centre-back told to STEP UP picks up a man 16% of the time (4%); a wide midfielder told to, 33% (14%).
      - A striker told to STAY FORWARD waits 7.5 m higher, and one told to COME BACK 5.4 m deeper.
      - A central midfielder told to INTERCEPT is in a passing lane 10% of the time. One told to COVER WING is
        2.7 m nearer a ball that's been out wide for 1.5 s.
  - **Anyone can play anywhere**, the keeper included. Swap any two men, or put an outfielder in goal (the keeper
    then takes his spots in both shapes). A man is rated for the spot he's in, from his own attributes, so a forward
    at the back or a defender in goal plays below his usual rating; in the Office that rating shows in amber. BEST 8
    puts a keeper in goal and the best seven by their ratings in the spots they're in.
  - **Moving men is a drag.** Touch a man and move your finger, and he's up at once: there's no hold to wait for
    (nothing scrolls, so a moving finger can only mean him). A tap, however long, only shows his card. With a
    mouse, just drag. He stays where you picked him up and moves with your finger from there. While he's up, every spot on the pitch shows what he'd be rated
    there, in the scheme's colour in his own position and amber out of it. Drop him on another man and they swap
    spots (in the shape you're looking at), or on a sub and the sub comes on (in both shapes). In the Office's
    Squad tab you can drop a man from the list onto a small pitch above his card.
- **Clearances read the game.** Def IQ decides how far a clearance can go and how surely it finds a team-mate up the
  pitch. That covers your CLEAR, the computer's clearances and headed clearances.
  - **How far.** A kicked clearance can carry ×0.85 of what Shot power gives it at Def IQ 1, and ×1.3 at 10: for a
    man with Shot power 4.5, about 18 m against 27 m.
  - **Where to.** It looks for a free team-mate upfield within reach 25% of the time at Def IQ 1, and every time at
    10. If you're pushing the stick, it looks the way the stick points; if not, anywhere upfield. Its spread narrows
    from up to 4.6° to 1.1°.
  - **Measured in open play**, a clearance finds a team-mate 8% of the time at Def IQ 1, 31% at 5.5 and 65% at 10.
  - **Headers.** A headed clearance goes ×0.9 to ×1.15 as far, from Def IQ 1 to 10, and is aimed more surely and
    truly at a team-mate. So is your own defensive header.
- **Strength is body on body.**
  - **Running into each other.** Two men who run into each other are pushed apart, and the stronger holds his
    ground: 7 against 5 splits it 27/73 and 9 against 3 4/96 (it was 42/58 and 25/75). A stronger man running into
    a weaker one also knocks him off his line, by the square of the gap: near-equals hardly notice, a big gap sends
    him clearly aside, and a huge one (4 points or more, run into hard) puts him down for a moment, and off the
    ball if he had it. The strong man barely checks.
  - **The cushion.** The man on the ball holds one of theirs off his back and sides, as if he had an arm out. It
    grows with his Strength (0.4 m at 10) and more with how much stronger he is than the man trying to get through
    (another metre for the whole scale between them): 9 against 3 keeps him about 1 m off, level men 0.2 m, and a
    weak man on the ball against a strong one has next to none. It covers his back and sides and fades out 45°
    either side of the way he's facing, so in front of him nothing has changed. Flat out it's a third smaller.
    - A man leaning on it can only edge round it, the slower the bigger the gap between them.
    - Leaning on it wears it down: a stronger man is through it in under a second, a level one in about 1.7 s, and
      a much weaker one hardly dents it (a 3 on a 9: an eighth of it in 2 s). Off it, it comes back. A stronger man
      who's through it, up against his back, muscles him off the ball: 9 against 4, about two times in three inside
      a second.
    - His tackle reach doesn't count through it.
  - **Measured**, with you running upfield with it (not sprinting) and one of theirs pressing from 2 m behind you,
    straight behind or off your shoulder, 12 goes each over 4 s:

    | You against him | Robbed, straight behind (before → now) | Robbed, off your shoulder (before → now) |
    | --- | --- | --- |
    | 8 against 4 | 3 → 0 | 4 → 1 |
    | 7 against 5.5 | 2 → 1 | 11 → 0 |
    | 5.5 against 5.5 | 7 → 4 | 11 → 12 |
    | 4 against 8 | 12 → 12 | 12 → 12 |

    Standing still with it, you're robbed every time, before and now: he comes round you and takes it from in
    front (22° to 55° round from the way you're facing). At 8 against 4 that takes him 1.1 s from straight behind
    (it took 0.8 s).
  - **Holding it up.** The computer's centre-forward is keener to hold it up the stronger he is: no keener at
    Strength 5.5, up to 1.6 times at 9 and over. How sure he is of keeping it under pressure leans on Strength more
    too.
- **Curve is one stat.** It was Shot curve. Now it's Curve, and it bends crosses, through balls and long passes as
  well as shots (a shot's curl is as it was).
  - **Crosses swing.** Facing the byline it's an outswinger, bending away from goal; facing back toward his own
    goal, an inswinger, bending in toward it; side-on, whichever brings it onto the run of the man it's for (him
    standing, away from the nearest of theirs to where it's going). It's aimed with the swing in, so it still comes
    down on the spot: a 25 m cross at Curve 10 bows about 1.9 m off the straight line and comes down within 0.5 m of
    the spot (Crossing 10); at Curve 1 it hardly bends. Crosses no longer lose pace skimming the grass as they're
    struck, so they get there on time and at head height (they used to arrive a tenth of a second late, nearly on
    the grass).
  - **Everyone reads the swing:** the keeper coming for it, and the men attacking it and defending it. It's still
    harder to deal with. A defender's chance in a heading duel drops by up to 10 points at Curve 10, his headed
    clearance goes a fifth less far and twice as wild, and the keeper's reach for it is 15% shorter.
  - **Passes bend only when it helps, and not much.** A long pass (along the grass over 24 m, your lofted ball over
    20 m) or a lofted through ball, to a man running across its line, bends a little into his path. At Curve 10 a pass
    turns 16° at most over its flight; at Curve 1, 1°. It used to turn up to 40°, a banana that took a long ball round
    almost anyone in its way. (A through ball along the grass bends round men, by up to 23°: see **Through balls go
    along the grass, through the gaps**.) One with a man of theirs on its line bends
    a little away from him, not round him: at Curve 10 it passes a man 0.6 m off its line 0.1 m further off than at
    Curve 1. To a man running along its line it goes straight. Yours bend the same way as the computer's. In the
    computer's games a curled long ball at Curve 10 now bends 15° on average, where it bent 36°. Whether a long ball
    gets there doesn't hang on Curve, though: with every man at Curve 10 or every man at 1, about nine in ten passes
    of 20 m or more reach one of ours.
- **The six** on a player's card are each the average of the attributes under them. They're only what the card
  shows: a man's rating comes from weights for each position, as before.

  | | Attributes |
  | --- | --- |
  | PAC Pace | Speed, Accel, Agility |
  | PHY Physical | Strength, Stamina, Heading |
  | TEC Technique | Ball ctrl, Dribbling, Composure, Curve |
  | PAS Passing | Passing, Crossing, Off IQ |
  | SHO Shooting | Shot acc, Shot power, Long shots |
  | DEF Defending | Tackle, Slide tackle, Interceptions, Def IQ |

  Agility went from Physical to Pace (it's how he turns on the run), Heading from Defending to Physical (it's a duel
  at both ends) and Curve from Shooting to Technique (it bends his crosses and passes as well as his shots).
- **Off IQ meets the ball.** A man a ball's played to reads it as well as his Off IQ lets him: the computer's men, and
  yours when you've passed to him and left the stick alone.
  - **He sees it's his a beat after it's struck:** 0.4 s at Off IQ 1, 0.23 s at 5.5, 0.05 s at 10. Till then he
    carries on as he was.
  - **He reads where it's going** out by up to 2.5 m at Off IQ 1 (none at 10), less the nearer it is to getting to
    him, so he corrects as it comes.
  - **A good one goes to meet it, a poor one lets it come.** At Off IQ 10 he goes for the first point on its path he
    can get to as it does, low enough to take; at 1 he waits on its line where he is (or where it stops, if it won't
    get to him); in between, he goes part of the way. Going for it, he runs a little quicker than he would anywhere
    else, the more so the higher his Off IQ (up to 10% at 10). Measured, a 15 m pass in midfield with a marker 2 m
    off him, 10 each: at Off IQ 10 he goes for a spot 1.6 m nearer the ball than he is, at 5.5 0.6 m, at 1 0.3 m
    (medians). Before, everyone went at once for where it would first come down, whatever his Off IQ: on that
    pass, 1.4 m behind him.
  - **Crosses.** Only the two of ours best placed to get to it go for it (forwards and midfielders); the rest keep
    their places. A good one goes for the first point of its flight he can get to at head height and times his
    run: he holds, then attacks it at pace. A poor one goes at once to where it will have come down to his head
    (the last of its flight he could head) and waits there for it, so a man attacking it gets there first. In the
    air he hardly corrects his read: 80% of it is still there as the ball gets to him. (He used to wait where it
    would come down on the grass, a step goal-side of it: about 3 m past where it was aimed, so he stepped off its
    line and let it drop behind him. See **Crosses find a man**.) Measured, a cross from the byline to the penalty
    spot, our man 13 m out with a marker goal-side of him who now goes to meet it too, 48 each, headed: 4 at Off IQ
    1, 22 at 5.5 and 36 at 10 (Off IQ is in the duel in the air now: see **Crosses find a man**). When the marker
    went to where it would land, 16 each: 10 at Off IQ 1, 12 at 5.5, 16 at 10.
  - **First-time finishes.** A chance of xG 0.3 or better (inside about 16 m and within 8 m of the middle, with a
    clear sight of goal) a high Off IQ hits first time, rather than taking a touch and giving it away: not at all at
    5.5 or under, all the way from 9. Measured, a ball pulled back from the byline to a man 13 m out with nobody
    near him, 10 each, hit first time (before → now): 0 → 9 at Off IQ 10, 0 → 0 at 5.5 and 1. Squared to him 22 m
    out, nothing like a chance from there, Off IQ 10 takes a touch first.
  - **The computer's passer** picks his pass a moment before he strikes it, so the game could tell the man it's for
    where it's going early. It doesn't: that would be reading the passer's mind. He reads it from the strike.
  - **Over whole matches** (16 six-minute computer-against-computer games on each, per 6 minutes, before → now):
    crosses 6.9 → 8.6, headers on goal 1.6 → 1.7, shots 5.0 → 4.2, goals 1.8 → 2.2, and 87-88% of passes reach a
    team-mate either way. The shots and goals are inside how much one batch of games differs from the next; a
    first-time finish comes up about once a game.
- **Crosses find a man.** The computer's crosses went where nobody was. Measured over whole matches, the man a cross
  was for was within 1.5 m of it at head height a quarter of the time, and a fifth of them were headed by one of ours.
  - **Waiting in the box.** With the ball out wide in their third, the men going into the box take spots a cross can
    find, all inside the posts (5 m either side of the middle). Before, a forward would come toward the man on the
    ball, out past the near post.

    | In the box | Where they wait |
    | --- | --- |
    | One | The middle of the box, 9 m out |
    | Two | One favouring each post: 3.6 m toward the ball's side and 7 m out, and 4.2 m to the far side and 8 m out |
    | Three | The two posts, and one in the middle 12 m out, far enough back that a cross to him clears the keeper |
    | Four | And one on the edge of the box, 16 m out, toward the ball's side |

    Who takes which spot keeps everyone's run shortest, and they don't swap about unless it saves 4 m. Until it's
    crossed they wait onside, level with their last man, and none of them comes out to help the man on the ball.
  - **Aimed at a man.** The computer crosses to one of ours: to his spot if he'll be there as it is, to him if he's in
    the box already, or to where his run is taking him. It goes to whichever of them it's likeliest to find first,
    against how soon one of theirs, or the keeper off his line, could be there; a header from in front of goal
    beats one from wide of a post or further out. With nobody in the box yet, it goes to the near post, the penalty
    spot or the far post for whoever can run onto it. It used to go to one of those three every time, for whoever
    was nearest as the crow flies. How soon a man gets there is worked out the way he'd run it: a beat to read it,
    then side-on watching it over a step or two, or turned and sprinting on a longer way.
  - **How true it goes is his Crossing.** Most crosses go close to where they're aimed, and the worst still go as
    wide as ever (up to 9° off at Crossing 1, 1° at 10). Measured in the Crossing Lab, 16 from 8 m out at each, they
    came through head height about 0.55 m from where they were aimed at Crossing 8, and 1.6 m at Crossing 1.
  - **Our man heads it.** A man under a cross of ours no longer tries to bring it down at his feet instead of heading
    it. A man going for it who reads it poorly now waits where it comes down to his head, not where it lands (see
    **Off IQ meets the ball**).
  - **Their men meet it in the air.** The two of theirs best placed to get to it go to meet it at head height, a step
    goal-side of it, once they've read it: 0.4 s after it's struck at Def IQ 1, 0.05 s at 10. If neither can get
    there, the man nearest where it comes down goes there. Before, only the man nearest where it would land went, and
    to where it would land, so our men met it in the air before he could.
  - **The duel in the air.** When one of ours and one of theirs go up for it together, it's Heading against Heading
    as before, and now the timing of it too: the attacker's Off IQ (his run, his jump) against the defender's Def IQ
    (his read of it), worth up to a quarter of the duel either way, and nothing between two men level on them. That
    goes for your headers too.
  - **Measured in the Crossing Lab,** 16 crosses each from the computer at Crossing 8, the men in the box on the dials.
    On average they came through head height 0.4 to 0.8 m from where they were aimed:

    | From | Ours v theirs | Headed by ours | Cleared |
    | --- | --- | --- | --- |
    | 8 m out | 2 v 0 | 16 | 0 |
    | 8 m out | 2 v 2 | 8 | 8 |
    | 8 m out | 3 v 3 | 13 | 3 |
    | The byline | 1 v 1 | 15 | 1 |
    | 16 m out | 3 v 2 | 11 | 5 |
    | 24 m out (early) | 2 v 0 | 16 | 0 |

    The contested ones move by three or four from one run of 16 to the next. With one of theirs against one of
    ours, he goes out to the crosser. How many headers go in swings a lot from run to run, so it isn't shown here.
  - **Your cross picks its man.** Hold CROSS (`L`) and let go: how long you hold it picks which of ours it's for, of
    the men in their box or on their way into it (and onside), nearest the ball first. A tap is for the nearest (the
    near post), the whole bar for the furthest (the far post), and the bar is shared out between them; with three in
    the box, under a quarter of a second for the near post, half a second or more for the far post. While you hold
    it, the man it's for has an amber ring under him. It goes where the computer's would for him (his spot, where he
    is, or his run), timed as the computer's is, and your Crossing aims it. It used to go to whichever man was
    nearest the penalty spot every time, and the hold only made it float or drive.
    - **Double-tap it for a low driven cross** to the man the second press picks (a quick second tap: the nearest;
      hold it: further across). It's flat and quick, up to 30 m/s, and comes in at his knees, low enough to take or
      hit first time. He reads it as he would a pass (his Off IQ), and their men can cut it out as they would one.
      The grass in this game drags a ball along it to a stop too soon for a cross to skim all the way, so it's in the
      air until its last stride: it gets about 1 m up over 13 m, 1.5 m over 22 m and 2.5 m to a man 29 m away,
      against 4-5 m for a lofted cross.
    - A single tap waits the double-tap window (the pass's, 150 ms) in case a second tap is coming; a held press goes
      as you let go. A second press just after your cross has gone doesn't turn into a slide.
  - **The predicted flight** of a ball that's just been lofted now allows for the grass dragging at it till it's off
    the ground. It used to run every cross on 8% too far in its first moments.
  - **Over whole matches** (computer against computer, 12 six-minute games each, per 6 minutes, before → now):
    crosses 7.9 → 4.3, headers on goal 1.9 → 2.3, shots 4.6 → 5.6, goals 1.9 → 2.4; 86-88% of passes reach a
    team-mate either way. There are fewer crosses because the computer now only crosses when a man of ours can be
    there to meet it, and more than half of them end in a header on goal, where it was one in four. Goals are up by
    about as much as one batch of games differs from the next.
- **The computer does skill moves.** Taking his man on, one of the computer's men with the moves (his skill stars)
  does one to get past him: a cut, a croqueta, a roulette or a rainbow flick, as many kinds as his stars allow.
  - **Who.** Wingers and wide midfielders most. Central midfielders and strikers now and then. A full-back only when
    he's pushed on (told to attack, or already in their third) and is clearly the better man (by 1.5 or more). A
    centre-back never.
  - **How keen** is how much better he is on the ball than the man in front of him is at stopping him, not how good
    either of them is: his Dribbling (counted twice), Ball control and Agility against that man's Tackling (twice),
    Def IQ and Agility. Level, he's a third as keen as at 2 better; at 1 worse, not at all. A 5 against a 2 is as
    keen as an 8 against a 5. Keener out on the touchline (×1.3) and in their third (×1.15); never in his own half.
    The keener he is, the more often he takes his man on at all (about twice as often at the keenest).
  - **Which move.** He goes into it about 3 m from his man, toward the side away from him: a croqueta or a cut most
    often (a cut chopped square, away from him), a rainbow flick with nobody behind his man to pick it up, and a
    roulette only with the man right on him and when he's a good deal the better (by 2.5 or more).
  - **A move sells the man in front of him,** yours as well as the computer's. Anyone of theirs within 5.5 m and not
    behind him is wrong-footed for a moment: he goes at where the ball was and can't win it. 0.1 s against a level
    man, up to 0.35 s at 4 better, and not at all from 1.6 worse. (Not in the Dribble Lab, where it's your timing
    against his lunge.)
  - **A move's pace and reach are the man's Dribbling,** yours too. At Dribbling 10 it's as the dials have it (as
    quick as before); at 1 it takes 1.6 times as long and carries him and the ball 30% less far; at 5.5, 1.23 times
    as long and 85% as far. A poor dribbler shows the man the ball for longer and gets less far from him.
  - **Measured** over six 6-minute computer-against-computer games: 35 moves, about 6 a game. 30 were by wingers, 3
    by central midfielders and 2 by strikers; 15 croquetas, 14 cuts and 6 rainbow flicks; 22 out on the touchline.
    He still had the ball after 26 of them. A winger against a defender closing him down, 8 runs each: at 9 against
    4 he did a move 8 times, got past 5 times and never lost it; at 7 against 6, 5 moves, 1 past, lost it 3 times;
    at 5 against 8 he never tried one.
- **The career is a manager's career.** You don't play in it. On the first screen you name yourself and your club
  and pick its colours. You start in League 2, the bottom of four 14-club leagues (League 2, League 1, Championship,
  Premium League), with a weak squad of 14 and $20,000. A squad is fifteen at most (every club's), twelve at
  least; eight start, four are on the bench, and the rest wait in reserve. The game is buying and selling players:
  nobody's stats are built up by hand.
  - **The season.** 26 matchdays, home and away. You PLAY each one (the live match, in your colours, with the home
    side in its home kit) or SIMULATE it. The top two go up. 3rd to 6th play off for a third place: one-game semis
    at the higher seed's ground, then a final, with a shoot-out if it's level. The bottom three go down. There's no
    sack: however badly it goes, you carry on.
  - **Transfer windows.** Five days in the summer before the season, and three at the winter break after matchday
    13. NEXT DAY moves a window on. In a window you can bid for anyone at another club. His club takes the asking
    price, may take 85% or more (once), and turns down less. Then you agree his contract: 1 to 4 seasons at the
    wage he asks. A man rated two leagues above yours won't come. Put a man on the transfer list at your price
    (the market's Selling tab) and clubs bid for him every window day (now and then they bid for your best men
    anyway); accept or reject. Free agents sign any time, for wages only. In the red you can't buy or sign anyone
    until you're back in the black, but selling still works.
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
    and fill their squads up every summer. Each has its own style, with shapes and widths to suit it: a wing side
    plays wide with three up, a counter-attacking side compact, a direct counter deep and compact without the ball.
    The better leagues have more control and gegenpressing sides, the lower ones more direct play and deep counters.
  - **Money.** The stadium works as before: ticket price, seats, concessions, sponsor. Prize money comes at the
    end of the season: $12,000 for winning League 2, up to $1.5m for the Premium League, less the lower you
    finish. The broadcast share follows your league position, and the ground and the sponsor grow when you go up.
  - **The town.** For now its buildings sit in a row. Manager's Office (squad and contracts, tactics, fixtures,
    finances), Transfer Market, Scouting, Youth Academy, Stadium, Newsstand (news, all four tables, results, top
    scorers) and Your House (your record). The walkable town on the tileset comes next.
  - Careers save to three slots (`ft_mgr_slot1` to `3` in `localStorage`). Careers from the old player-manager
    mode (`ft_save_*`) aren't carried over.

Drills and the labs still lock you to one player. The Trap Lab code is still in the file but has no menu entry. Everything else is unchanged, including the
AI and the stats. Changes to `index.html` aren't carried over to `classic.html` automatically.

## Controls

**Desktop**

| Key | Action |
| --- | --- |
| `WASD` | Move (double-tap a direction to sprint) |
| `J` | Call for the ball / pass (hold for a longer ball) · head-clear an incoming cross · your keeper holding it: he plays it out (Football Classic: see **Your keeper waits for you**) |
| `J` `J` (double-tap) | **Lofted pass**: up over everyone and down at the receiver's feet, checking up where it lands |
| `K` | Shoot (hold to wind up: while you do, a defender who was behind you can't take it off you) / header / command a teammate to shoot · standing tackle |
| `K` + `↑`/`↓` (hold) | Curl the shot |
| `L` (hold) | Cross — or, without the ball, request a cross from a wide teammate, or slide in when they have it. (Football Classic: the longer you hold it, the further the man it's for, nearest first; `L` `L` double-tap: a low driven cross. See **Your cross picks its man**.) |
| `L` in your own half | **Clear** it instead: with the ball it's hoofed high and long at once; a loose ball is struck first time the moment it reaches your reach ring, no trap needed (press as it comes, or hold it for up to two seconds); one dropping over your head, you jump and head it away. The stick picks the direction if it points upfield, otherwise it goes up and out toward your touchline |
| `SPACE` | Trap: press a hair before the ball reaches your reach ring (leave it and it runs past) |
| `V` | Toggle the pixel-art players / plain vector players |

**Touch**

Drag on the left half to move. **Push the stick out past its ring to sprint** (the ring lights up
orange) and ease back inside it to stop, without ever lifting your thumb; push on out and the
stick follows your thumb, so you can't run off its edge. A double-tap on the left half still
sprints too. The big right-hand button is
context-sensitive — TRAP / CALL / PASS depending on the moment. Separate SHOOT / SLIDE
and hold-to-CROSS buttons sit alongside it (Football Classic: hold CROSS longer for a man further across, double-tap it
for a low driven cross); in your own half CROSS reads **CLEAR** and works like `L` there. Anywhere else on the right half, off the buttons, is TRAP too.

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

**Swipe to shoot** — (Football Classic: swipe the way your man is facing. Up to 25° off it costs nothing; further
round, the shot is struck across his body, slower and wilder. At 150° or more it loses 45% of its pace and most of
his accuracy, and it grows evenly in between: the Swipe shot: off his line dials, in the Shooting Lab's TUNE.)
With the ball, swipe toward goal on the right half of the screen (off the
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
  and possession-aware team phases, on a pitch shaped like a real one (105 × 68) and marked like one --
  penalty areas, six-yard boxes, penalty spots and arcs, the centre circle and the corners -- at nine-tenths
  of the men's size: they're 25 px to the metre, the pitch 22.5 (2362.5 × 1530; it was 2625 × 1700 at 25).
  The goals are the men's size, so a little wider than real ones. The camera is as it was: it always shows
  the full width, the far touchline under the stand and the near one nine-tenths of the way down the
  screen (the lawn past it below), the men, the ball and the goals as big as ever, and it follows play along
  the length.
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
    with a man on him), and plays it first time only when he's pressed or a ball's clearly on (a good chance, to a
    high Off IQ: see **Off IQ meets the ball**). Then he
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
| | Wide midfielder (WM) | 6.5 | stamina, crossing |
| | Wide runner (WM) | 8 | pace, dribbling, crossing |
| Forward | Target man | 5.5 | strength, heading, holding it up |
| | Poacher | 6.5 | finishing, composure, movement |
| | Complete forward | 6.5 | link play, passing, shooting |
| | Inside forward | 8 | cutting in, bend, shooting |
| | Winger | 8 | dribbling, crossing |
| | Speedster | 8.5 | pace, runs in behind |

The style also shapes how a player is used: an Anchor is the one who holds in midfield, speedsters,
wingers and wide runners make runs in behind sooner and from further out, and a target man stays on the line.
On the ball it tilts his choices: wingers, wide runners and inside forwards fancy taking their man on (an inside
forward a shot too), a speedster running with it, a playmaker or creator the ball through, a poacher a
shot; a target man holds it up, and a stopper or an anchor keeps it simple. The side's way of playing
tilts them too: tiki-taka keeps the ball and passes quickly, direct looks forward first and further, a
wing side crosses more, and a counter goes quickly while the break is on.
In a career, each sub-role (CB, FB, DM, CM, WM, AM, STK, WNG) has its styles; players signed before
styles existed are labelled with the style their stats already fit, and keep their stats. A winger (WNG)
is a forward and a wide midfielder (WM) a midfielder: no midfielder is a winger. A wide midfielder an older
save filed as a CM is moved to WM when it loads.

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

Football Classic (`classic.html`) takes the same art split into parts (a body sheet, every hairstyle's head, and
where the head sits in each cell) so each player can be put together and recoloured. Write them in with:

```sh
python3 tools/sprites/make_player_sheet.py --embed-classic
python3 tools/sprites/make_keeper_sheet.py --embed-classic
python3 tools/sprites/make_pitch_art.py --embed-classic     # the far side of the pitch (assets/sprites/pitch_far.png)
python3 tools/sprites/make_ball.py --embed-classic           # the ball: six 9x9 frames (assets/sprites/ball_preview.png)
```

`index.html` keeps the sheets it was last embedded with until it is re-embedded with `--embed`.

## Tests

`tests/` holds optional end-to-end tests that drive the real UI in headless Chromium —
creation through to the House, a played career match, a five-match season, the exhibition setup,
the labs, and Football Classic's manager career (a season through both windows, promotion, the playoffs,
a played match), tactics, passing, the first touch, the players' sprites and the pitch. They need
Playwright; the game itself stays dependency-free. See [tests/README.md](tests/README.md).
