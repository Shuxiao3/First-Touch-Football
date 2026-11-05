# First Touch. Football

A phosphor-green 7v7 arcade football game (seven outfielders and a keeper a side) — one self-contained HTML file, no build step,
no dependencies. Open `index.html` in a browser and play.

## Play

Open `index.html` directly, or serve it:

```sh
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Football Classic (`classic.html`)

The same game played like any other football game, and nine a side since v124: eight outfielders and a keeper (`index.html`
is still seven and a keeper). It's a copy of `index.html` with two changes:

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
    comes to his side, he has to check, turn and face it.
  - **Over his head, he runs on (v81).** A ball played on ahead of a man on his way, through or in the air, comes from
    behind him: he keeps running on to where he'll take it, in front of him, and doesn't turn round to watch it come.
    Only one coming down on him, or stopping at his feet, does he turn to. Before, he turned round and back-pedalled
    at half pace or less for most of its flight, so the man marking him usually got there first. One through along the
    grass that catches him up from behind, the way he's running, he takes in his stride. It no longer comes off his back.
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
- **On the pitch.** The man you control has a dotted green ring on the grass round his reach: how far from him he
  can take the ball, by his Ball control. A ball touching the ring is in his reach. The ring's bright while the
  ball's in it and faint while it's out of his reach. (It was a solid ring at his reach, always the same, and read as
  a marker under the man you're on more than as how far he can get to the ball.) The ring under whoever had the ball
  is gone. The ball is drawn in whole pixels like the players: white with
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
- **Going down big (v78).** Out at one of theirs -- closing down the man on the ball, or running at a loose ball one
  of theirs is getting to -- and that man shoots from within 10 m of him, the keeper goes down low and makes himself as
  big as he can: one knee down, the other leg out, arms spread. Down there he's a wall across the shot's way, as high
  as he stands: just his body as he starts going down (coming out at a man, he isn't set), and once he's all the way
  down his reach and a quarter of his dive (1.9 m either side for an average side's keeper; 1 m at Reach and Diving
  1, 2.3 m at 10). Getting down is his timing and his Reflexes: he reads the strike, and as often as not he's a moment
  late (up to 0.14 s, less the better his Reflexes), then he takes 0.24 s (Reflexes 1) to 0.12 s (10) to get all the
  way down. So from close in a shot can be past him before he's down, and from further out one into the corner is
  past the end of him.
  - **It comes back off him, never held**, however soft: back out the way it came at a third to a half of its pace, up
    off the turf and off to one side -- out wide, away from the middle of the goal, the better his Handling (as with a
    save he can't hold: 95% of them at Handling 10, a little over half at 1). The shot's over and it's anyone's ball,
    the shooter's as likely as anyone's.
  - **One past the end of him, or over him, goes on**, and he's no help with it: he's down 0.7 s and takes 0.45 s more to
    get up. A man shooting from further away than 10 m he stays up for and dives at, as before.
  - Drawn with two new rows of the keepers' sheet (below): going down, then spread, and half up again as he gets up.
  - Before, he stayed up and his reach was looked at frame by frame, which a hard shot from close can step past. His
    wall is looked at all along the ball's way.
  - **One on one**, measured: a forward (an average side's) running at goal from 24 m with you on the stick, the keeper
    (an average side's) doing what he does -- coming out, closing him down -- and from the spot the forward shoots as
    you would, low into a corner, full power, either side in turn:

    | He shoots from | The keeper, from him | v77 | v78 |
    | --- | --- | --- | --- |
    | 11 m out, in the middle | 3.7 m (down big) | 72% | 39% |
    | 12 m, in the middle | 6.2 m (down big) | 67% | 54% |
    | 12 m, 4.5 m off the middle | 7.1 m (down big) | 75% | 48% |
    | 13 m, in the middle | 8.3 m (down big) | 78% | 70% |
    | 14 m, 4.5 m off the middle | 10.2 m (down big, just) | 78% | 65% |
    | 15 m, in the middle | 11 m (he stays up and dives) | 70% | 55% |

    60 shots a row on v77; 120 on v78 (60 for the last two). Give or take 5 to 7 points. From any nearer the keeper
    has it off his feet first. So a one on one is a contest now, not a goal: let the keeper get out to you and down in
    time and fewer than two in five go in; hit it while he's still coming and one into the corner beats him.
- **The keeper claims crosses.** A cross into his six-yard box (or half a metre past it), that he can get to while
  it's within his reach (hands up, a little higher than the bar), he comes for, over everyone's heads: the men going
  up for it leave it to him. One that comes down further out he leaves to his defenders. (v107: a little less of
  everything -- see **He comes for the ones that are his**.)
  - **Nobody reaches higher than a keeper.** A header tops out at the top of a man's head and a little over it at
    a stretch: 61 px at the very most (Heading 10, at the top of his leap; 47 standing), against the keeper's 78
    (82 before v107).
    Yours used to reach 51 px over your head, up to 97 px, and your clearing header 87 px, over the keeper's hands.
  - **Catch it or punch it.** Comfortably under it (it'll come to his body, him going to it), he catches it. If he
    only just gets there, at the end of his reach, or one of theirs is up with him and it isn't dropping into his
    midriff, he punches it clear: up and away to the side it's on, 12 to 18 m, nobody's ball. The Crossing Lab calls
    it PUNCHED CLEAR.
- **The keeper's hands (Handling).** Whatever shot he gets to -- on his line, at the end of a dive, or coming for it --
  he holds only if it's slow enough as it reaches him and close enough to his body. How slow and how close is his
  **Handling**, a keeper's stat like the rest (1 to 10; an average side's keeper has 7): up to 430 px/s right at him at
  1 (a header, a scuff), up to 760 and a good way out toward his fingertips at 10. A struck shot flies, and gets to him
  nearly as hard as it was hit, 700 to 800 px/s, so an average keeper parries almost any struck shot even straight
  at him and holds headers and soft ones; at 10 he holds about half the hard ones at him. A dive is a stretch, so only very safe hands hold a diving save, and a
  slow one at that; a curling shot is harder to hold. At the edge of the window it's even money. A slow one -- a
  header, a scuff -- he goes to, as before, and has it if he gets there.
  - **What he can't hold he pushes away**: wide of his near post the better his Handling (15% of them at 1, half at
    5.5, 90% at 10) -- off the line beside the goal and back out wide, away from the danger -- and out in front of
    him the worse, for whoever's first to it. Either way the shot's over: it's anyone's ball, the shooter's
    team-mates' too, and he can't claim it back for a moment (getting up, or set again). Before, a shot he got to
    came off him anywhere at random -- or, if it came within a stride of him, he simply held it, however hard it was.
  - **A stretch isn't always enough.** A hard shot he only gets to at a stretch -- a dive, or the end of his reach --
    can go on in anyway, slower and pushed a little further from him: the further he's had to go and the harder it's
    hit, the likelier, up to 60% at his fingertips to one at 800 px/s (36% at Handling 10). A long dive to a forward's
    shot beats an average keeper about one time in eleven; one at his body, or a soft one, never.
  - **Long shots keep their pace.** The Long Shots stat still decides how true a shot from distance flies, but it
    takes off only half the pace it used to, so one on target from 20 m is hit hard enough to beat a keeper at full
    stretch.
- **He dives a tenth further (v78).** Diving 1 to 10 flings him 33 to 110 (it was 30 to 100): a little quicker across
  his goal, and the same dive is less of a stretch, so a little less often beaten at his fingertips (see above) and a
  little more often held by very safe hands. It's a tad, as asked: shots he has to dive for go in a little less often
  (below).
- **Following a shot in.** When a team-mate shoots, the computer's forwards and midfielders in and around the box go
  in after it, to 5 to 8 m out on the side it's going, for whatever the keeper can't hold.
- **What v77 did to the score** (the keeper's hands, long shots, following in, and the reads below; 84 club pairings,
  every man on the computer, 6-minute matches, against the same 84 on v76): goals 1.99 a match → 2.31, goalless draws
  18% → 14%, five goals or more 5% → 12%. Shots from 20-25 m go in 13% of the time (2% before), from further out 3%
  (none in 137 before). Like any 84 matches it's give or take about 0.3 a match.
  - **His positioning is as it was**: he still comes for a ball near him, a shot included, and for a slow one in his
    box; only what happens when he gets to it is new. Sending every shot to a keeper on his line, diving, made him
    better at close range than he'd ever been (headers from 8-12 m went in 27% of the time, not 49%, and the score fell
    to 1.77 a match), so he doesn't.
  - **The computer's chance table is as it was.** Measured again with the new keeper (the same 32 shots a spot, struck
    the computer's way with nobody else about), it came out a little higher from wide of the posts 18-23 m out -- and
    put in, the computer shot from there three times a match instead of under twice, where in a match those go in
    one time in fifty, and scored 1.43 a match. So long shots are more dangerous when it takes them, not more often.
- **What v78 did to the score** (going down big and the dive; the same 84 club pairings, every man on the computer,
  6-minute matches, against v77). Run twice -- once with his wall starting at his reach, once as it's shipped,
  starting at his body -- goals came to 2.23 and 2.01 a match, against 2.31: about 2.1, each give or take 0.2, so
  likely a little fewer than before, and nearly all of it from further out. From 20-25 m 13% of shots went in on
  v77, 3% now (90 shots); from 16-20 m 46% → 38%; from 12-16 m 54% → 51%. Goalless draws 14% → 19%, five goals or
  more 12% → 11%. The keeper goes down big about once a match and stops about one in four of those with his wall;
  two in five go in anyway (the computer's forwards go for the corners).
- **No corners, no goal kicks.** Wide of a post or over the bar the ball still comes back off the line (see the net,
  above). Should one ever get past it, it's a goal kick for the side whose goal it is -- in either half: the old rule
  had the ends the wrong way round after half-time.

- **Made for a phone held sideways.** Every screen fits 844×390, 844×340 (Safari's bar showing) and 667×375 (an
  iPhone SE), and no word or number runs out of its box (checked at 640×360 up to 932×430).
  - **Nothing scrolls.** A list or a table with more in it than fits shows a page of it, with ◀ 2 / 3 ▶ along its
    foot; hold an arrow to flip through the pages. Pages break between rows, never through one: a list keeps its
    filters on every page, a table keeps its head row, and a heading moves over with the rows it heads. A player's
    card never goes over pages, anywhere: it's made to fit. Measured on a new career at 844×390: the squad over 4 pages, the transfer market's list of League 2
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
  - **Settings** are a player's: match length, how good exhibition opponents are, the DIFFICULTY (v89), pixel or simple
    graphics, the colours and which side of the career's campus its buildings are listed down, kept in this browser (`ftc_prefs`),
    plus the button layout on a touch screen. Settings also credits the campus's tilesets and the font. The 92 feel dials are the game's
    own tuning: players never see them and their saved values aren't loaded. A developer gets them back (with the
    labs' TUNE and EDIT STATS) with `?dev` in the address or five taps on the build number on the start menu.
  - **The buildings.** One line across the top: ◀ CAMPUS, the building, its tabs. A message shows as a toast along the
    bottom. The squad, the market's lists, the scouts' reports and the academy put the list on the left (over pages if
    it's long) and the man you tap on the right. His card is drawn as on the tactics screen, never goes over pages and
    has no long text on it: his figure, name, own position, style, age, stars, rating and potential (as you know it:
    see **His story**) on top, then the spots he plays (v116): PLAYS and the ones that are his own, lit green, ALSO and
    the ones he can play well enough (a second position: a little off his reading of the game), outlined -- his
    archetype's since v118, e.g. a wing-back PLAYS FB WM ALSO W, a stopper PLAYS CB and nothing else -- and his
    popularity under his potential. Along the card's foot, a tab for each side
    -- RATINGS, DEAL, CAREER, PERSONALITY (v116: in the Squad tab ◀ TEAM first, back to the little pitch) -- the one
    showing lit; the side you're on stays as you go from man to man. (Before v116 one small button under his rating,
    DEAL ▶ and so on, turned it a side at a time.) His trait tags show on his ratings side, and while one of the six is
    open his season's facts give way to it. One side has his six numbers (pace, physical, technique, passing, shooting, defending, each the average of
    its attributes, as in **The six** below; tap one and what it's made of opens under them, a coloured bar for each
    rating, tap it again to shut it), and for your own man his games and goals this season; a man you haven't scouted
    shows ? for each, with SCOUT HIM (once the scouts' house is built); one you have, what the reports say (see
    **Scouting**). The second side, his deal, has what he earns or
    costs in a small grid, then what you can do about him, a line each: in the clubhouse's Squad tab his contract (a
    new deal, releasing him); in the market's Selling tab selling him (the two best bids, the transfer list); for
    another club's man the asking price, scouting him and your offer; for a free agent signing him; for a youngster
    promoting him. The third side is his career (see **His story**). The fourth, his personality (v116): his mood,
    then his character in words, never numbers, two to a line -- TEMPER (explosive, volatile, even, calm, ice cool),
    WORK (lazy to model pro), LEARNS, DRIVE, LOYALTY, VOICE, GRIT, BODY and SETTLES -- then the traits that have come
    out, each with its good side and its cost (see **Character and morale**). That's yours and your academy's, whom you
    know; another club's man shows what your scouts have found stands out about him, and SCOUT HIM or SCOUT MORE.
    In the Squad tab his card has the right side to
    itself (◀ TEAM in its tabs, or a tap on him in the list, for the little pitch), and the little pitch comes back as you pick
    a man up to drop on it.
  - **Tactics** (in a career, on the training pitch: its level decides which shapes and styles your side can have; see
    **The campus**). The pitch first, on its side as in a match, your goal on the left. Above it, one
    row: with or without the ball, then menus for the shape, the width and the style -- just the names, the style's
    seven two to a line -- and, at its end, INSTRUCTIONS and BEST 9 (v116: INSTRUCTIONS was a button on his card). Under the pitch, on one line, the bench: five men, the subs you'll have in a
    match, and no one else (who's taken at all is the Selection tab's: below). Drag one onto a man on the pitch, or
    on the bench, to swap them. BEST 9 puts the next keeper first on the bench and the best four of the rest after
    him. The tokens narrow to fit; if they still don't, they show a page at a time, with a small 1/2 ▶ button to
    turn to the next, so the pitch never loses height. (The rest of the squad used to sit after the bench, in
    reserve, dimmed: with squads of twenty-one that crammed the pitch's screen.) On the right, from under that
    row to the foot of the screen, the card of the man you tapped. Every man on the pitch shows his face (his own
    look, in the club's kit) beside two lines: his rating and his own position (GK, CB, FB, CM, WM, WNG, STK)
    on top, his name and shirt number under them. The bench has the same two lines without the face, in a shorter box,
    so the pitch gets the height. The lines sit inside each token with room round them, clear of its edges.
  - **Selection** (in a career, on the training pitch): who you take, and your quick subs. The whole squad as one
    list, top to bottom: the keeper, then the eight on the pitch (each beside the spot he's in, with the ball), the
    five on the bench, then the rest, who aren't taken. It's wrapped into three columns where its parts meet -- ON THE
    PITCH, THE BENCH, NOT TAKEN -- so a squad of twenty-one fits a phone held sideways without scrolling; the fourth is
    QUICK SUBS (below). No faces: a bar a man,
    with his place in the list, his name, his position (on the pitch, the spot he plays) and his rating (there:
    lime in a second position of his, amber out of position). Drag a bar up or down (or across) and put it down:
    - **On the pitch's part** (the keeper or one of the eight), or anywhere if he came from there, the two change
      places: he takes the other's spots, with the ball and without it, and the other takes his place in the list.
      So a man dragged from NOT TAKEN onto your right back plays there, and the right back is not taken.
    - **On the bench or in the rest**, coming from there, he goes in where you put him and the men in between
      move along one: a man dragged up into the bench pushes its fifth out to the top of NOT TAKEN; dropped below
      a column's last bar, he goes to the end of it. Over a bar to swap with, it lights; where he'd go in, a line
      shows. The bar follows your finger, a little above it, so you can see what's under it.
    - **QUICK SUBS** (v116: they had a Subs tab of their own): your quick subs, planned before the match -- up to
      three pairs, a man on the pitch to come off and one on the bench to come on, down the fourth column. Tap a bar
      on the pitch and one on the bench (either first; the first lights) to pair them -- a tap, where a drag moves
      him; a man paired again leaves his last pair for the new one, and ✕ takes a pair off. A paired man's bar is
      marked, with the other's number. In the match they're first on your quick subs, ready to tap, tired or not --
      and one of yours hurt comes off for his. The career keeps them; a pair goes when either man is no longer on
      the pitch or the bench. The keepers aren't in it.
  - **The width shows on the pitch.** COMPACT draws each line's men closer together and WIDE spreads them, the lines
    running down the pitch's height (a WIDE line's end men reach its edges). No man is drawn over another or off the
    pitch, at any phone size: on a short screen a line's men stay at least a man's height apart, and on a narrow one
    the keeper and the three lines close up, a man's width each, rather than overlap -- in a match's tactics and the
    Squad tab's little pitch too. It used to look the same whatever the width, and a four across the middle overlapped.
  - **The right-hand side has two sides**: INSTRUCTIONS, up in the top row left of BEST 9 (lit while they're up;
    a tap on it again, or on a man, and it's his card), turns it over (v116: it was a small button on his card,
    INSTRUCTIONS ▶, then ◀ PLAYER). One is his card: all of him, head to toe (a keeper in a keeper's top), his name, his
    own position, style, age, skill stars, the spots he plays (PLAYS, ALSO: as on a building's card) and rating (lime in a second position of his, amber out of position: no line of text says
    so, nor that he's on the bench), and in a match his stamina: the word and a bar, no figure; under it the six (tap
    one and what it's made of opens under them: its name and a row for each rating, with a coloured bar; on a phone
    360 px tall or less a category of four ratings puts them two to a line). The other is the TEAM's instructions for
    the phase you're looking at (v112: see **Team instructions**) -- the same whichever man you tapped. Neither goes
    over pages: each has the whole right-hand side, and everything on it fits, down to 640×360. On a short phone his
    figure and name are drawn a little smaller; on a narrow one (700 px wide or less) his name stays on one line. A
    match's tactics have INSTRUCTIONS at the top row's end too, for your side.
  - **The other phase's shape** is a small lit box with each man's shirt number and name (the number his token
    shows, so you can tell whose box is whose), off the bottom-right corner of his spot, the forwards' too: on WITH
    BALL you see where each of them goes without it, and the other way round. It's no longer a full token tucked
    under the man, with his face, that you couldn't see.
  - **In a match**, the pause menu is five buttons: TACTICS, SKILL MOVES, SETTINGS, EXIT and BACK. TACTICS opens the same
    pitch-first screen on the match itself, with each man's stamina on his card (and the two sides: the other team's
    men show their ratings only). Your five subs are on the bench: drag one onto a man to bring him on, on fresh
    legs. That's three subs a match (it was two), and a man taken off can't come back. Every exhibition club has a bench of five
    too (a keeper, a man for each line and another defender), a little short of its starters.
    Swapping men's spots is free, and the other side is there to look at.
  - **The match** has the score, the way you're kicking and the clock along the top, then, top right beside the
    menu, **your man's window**: his number, full name and position over his stamina bar (the red tick on it is
    how far it can come back, as over his head) and his skill stars, lit gold up to his number, so you know what
    he can do with the ball. Switch and it's the new man's. A club's man in an exhibition has only his surname
    on his card, so the window gives him a first name, always the same one. No stars over anyone's head now.
  - **Quick subs**, just left of your man's window: SUBS and how many you've left. Press it and a small list drops
    down, a sub a line -- the man coming off, his stamina under him, ▸ the man coming on: in a career match your
    planned subs first (Training's **Subs** tab), then your most tired men (by how far his stamina can come back, the
    red tick), each with the man on the bench who'd do his job best, when on fresh legs he'd do it better than the
    tired man can now (his rating at the spot, the tired man's taken down by what his legs have left). Three lines at
    most: 200 px wide and under 120 high. It only ever drops down when you press it, and stays down until you press
    it again. When one of yours gets too tired -- his stamina only able to come back to 60%, about a tenth off his
    top speed -- the chip lights up amber, and that's all. Tap a line and he's on there and then, as from TACTICS; a
    man coming off with the ball at his feet goes as soon as he's played it, his line ringed till then (tap it again
    and he stays on). It doesn't wait for the ball to go dead: a match has two or three dead balls, the goals and half
    time, so a sub that waited for one could wait a half. ALL SUBS opens TACTICS for any other sub. The keeper is never
    one of them. With no subs left it goes, and it isn't there in a lab. (In v63 it was twice the size, and it dropped
    down by itself.)
  - **The match report** (v106), after a career match you played, is two screens. THE RESULT: the score between
    the two clubs with their crests, each side's goals -- the minute, the scorer, who made it -- anyone hurt, and
    where it leaves you (the league position and how it moved; through or out of a cup; the playoffs); NEXT. YOUR
    PLAYERS: a row for every one of yours who played -- his rating, goals, assists, passes found of those tried and the
    share, shots on target of his shots, tackles won, interceptions, a keeper's saves -- your best on the day starred;
    CONTINUE. Back at the club, after the press conference: THE MONEY (see the manager career).
  - **The goal, celebrated** (v106). A goal of theirs: GOAL, big in the middle of the screen with the score under it,
    and play held a moment as before. One of yours: GOAL! grander -- gold, bigger, the scorer's name under it -- and
    the scorer wheels away toward the corner flag at the end he scored at (top left or top right, in front of the far
    stand), his team-mates after him, the camera with them, and they celebrate as big as the goal was:
    - *small* -- an early goal, one more on top of a lead, or a consolation: he runs a few strides toward the corner
      (8 m at most), the two nearest get to him, a hop or two. Play's held 2.8 s.
    - *big* -- a goal that makes it level or puts you in front in the second half (EQUALISER! / IN FRONT!): off toward
      the flag (16 m at most), every team-mate after him, jumping round him as they get there, a little confetti and
      the cameras flashing in the stand. 4.6 s.
    - *epic* -- the winner at the death (level, in the last twelfth of the match or the advantage at its end):
      WINNER!, a knee slide toward the flag, the whole team on him -- the keeper running up from his goal too -- confetti
      everywhere. 6.8 s.
    The clock is stopped through it, as for any goal, and the side that conceded kicks off after it. The cameras
    only go off for your big and epic goals, and with reduced motion not at all.
  - **Sim the rest** (v106). The pause menu's SIM THE REST (it asks first, the match waiting): the rest of the match
    simulated from where it stands -- the time left of both halves, each side's men on the pitch now (their ratings),
    the goals a simulated game gives for that much of a match (the home side a little more), the scorers picked as a
    simulated game picks them (a forward most often, a defender now and then, the keeper never) with an assist three
    times in four, at times in what was left -- and it's full time. In a career the report and the money follow.
  - **As wide as the phone.** The game screen's height is fixed and its width follows your screen's shape, so a
    phone held sideways sees more of the pitch across (1169 wide at 844×390) instead of black bands either side.
    The buttons stand over the pitch's bottom-right corner, the stick starts anywhere on the left, and buttons
    you've placed yourself in BUTTON LAYOUT stay where you put them.
  - **Fixed along the way.** A new career can be started by touch (Start was cut off below a card that didn't
    scroll). In a match the tactics card is no longer left blank after a visit to the career's tactics. The pause
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
  to switch to him. On the left side of a phone screen the stick still starts too. A tap that isn't on one of your
  men, a button or the stick does nothing: it used to switch player wherever you tapped on the right. When one of
  theirs crosses it, you're put straight on the man of yours marking the one it's for (within 3 m of him) -- unless
  another of yours is clearly nearer where it comes through head height in or by your box (or where it comes down, if
  it never does) -- and for a cross to nobody in particular, on whoever's nearest there.
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
- **Through balls along the grass** are struck like an ordinary pass (the same pace and lift for the distance), into
  the space ahead of the man. Yours are always along the grass (v81: no lofted through ball). The computer's lofted
  through ball is unchanged. (Where yours goes: into the runner's path, the drag leaning it -- see *Controls*.)
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
  draw from there. On a computer, hold the left mouse button anywhere on the pitch. The pattern is read when you let go,
  against the way your man is going (the way he's running, or else the way he's facing) as it looks on the screen, as
  a stick is in other football games. The same shape is the same move whichever way he's going on the pitch, so the
  same stroke on the screen can be two moves: rightwards, it's a knock-on for a man running right and a drag-back for one
  running left. (It's read on the screen because the pitch's depth is squashed there: read on the pitch, a stroke drawn
  across a man running up or down it wobbled ahead or back, and an elastico could come out as a sombrero.)
  - **Knock-on** (a straight stroke anywhere in the half in front of him, 1 star): he knocks it on along the grass the
    way you drew, over in 0.1 s, and runs on to it. It gets about 2 m clear of him, out of reach of a foot stuck out,
    and it's loose until he's back on it. It replaces the flick, which popped it up a little off his foot.
  - **Drag-back** (a straight stroke anywhere in the half behind him, 2 stars): he stops, rolls it back under his sole
    the way you drew and turns to go with it.
  - **Croqueta** (an L, to the side first and then on, 3 stars): the ball is shifted foot to foot, and he shifts about
    1.8 m the way the L's first stroke went, still running the same way. Drawn the other way round (on, then to the
    side) it's nothing.
  - **Roulette** (a circle, 3 stars): clockwise he goes out to his left, anticlockwise to his right. The ball goes a
    little that way first and then diagonally on; it never swings out on the other side, toward the man. He goes round
    it on his sole: a quarter of the way round he's beside it, facing it, and halfway he's in front of it with his back
    to the man, shielding it. He comes out of it seven-eighths of the way round (315°), face on, going diagonally away
    past the man on that side, about 1.9 m across. (It used to swing the ball out the other way first, toward the man.)
  - **Cruyff turn** (a hook, 3 stars): he shapes to shoot or cross, drags the ball behind his standing leg and goes
    back the way the hook ends.
  - **Rainbow flick** (back, then ahead, 4 stars): over 0.35 s he eases off and rolls the ball back up the back of his
    leg, then flicks it over his head. It peaks about 3.5 m up, is in the air about 1.15 s, and drops 1.6 m ahead of
    where his run would take him. It checks up where it lands, like a lofted pass. Leave the stick alone and he bursts
    on to it. It beats a man who has committed to you. A defender who can simply turn round gets there first, and
    one already in tackling range takes it during the wind-up. He lets it drop and takes it in his stride, the way
    he's going; he used to chest it down again and again as it came down beside him, and turn round to a ball that
    had dropped a stride behind him.
  - **Sombrero** (ahead, then back, 5 stars): for when his back is to one of theirs. He eases off and pops it up a
    little off his foot (0.18 s), then flicks it back over his own head and the man's to drop about 2.3 m past the
    man, and turns and goes round him to it, taking it in his stride as he does the rainbow. With nobody behind him it
    drops about 3.3 m behind him. (It used to go over a man in front of him.)
  - **Elastico** (out to one side and back, 5 stars): out with the outside of his foot, the ball and his weight going
    that way, then snapped back the other and popped up about half a metre, so it gets over a foot stuck out, past the
    man in front on the side it came back to. He goes after it.
  - **Heel flick** (a loop with a straight line out of it, 5 stars): he checks and rolls it to his heel, then backheels
    it past the man in front on the side the line goes while he goes round him on the other, and picks it up beyond.

  There's no step-over, body feint or nutmeg.

  **Holding SKILL** without drawing, the ball at his feet (on a computer, the left mouse button held down and kept
  still). After 0.12 s it's a hold; a finger that moves more than 12 px first draws a move instead.
  - **With the stick, he strafes:** he goes the way it points but keeps facing the way he was, the ball tight at his
    feet. It's slower than running with it: just under two-thirds of his pace straight on, about half going across
    (measured: 75 px/s, against 152 turning to run across with it), and a third backing up.
  - **Without it, he shields it:** he turns his back to the nearest of theirs within 5.6 m, the ball on his far side
    (the screen says SHIELD), and keeps his back to him as he comes round. Then who gets it off him is:
    - **Strength,** how well he stays put. He's planted, and counts as 1.5 points stronger: pushed in the back for a
      second by a level man he gives up two-thirds of the ground he would off the stick, at 9 against 3 next to none
      and at 3 against 9 nearly twice as much. It counts for his cushion, and against barging and being muscled off it.
    - **Dribbling and Ball control,** from where it can be nicked: only by a man within 80° of the way the ball lies
      from him at 1, 30° at 10 (both counted, averaged). Round his back or his side, nobody can get a foot to it.
    - **Off IQ,** how well he moves to keep it away: how soon he reads where the man's gone (0.4 s at 1, 0.06 s at 10)
      and how quickly he turns his back to him (2.5 to 8 radians a second). With a man walking round him at 1.6 m, his
      back is 6° off square to the man on average at Off IQ 10 and 32° at 1.

  **Skill stars** say which moves a man has, one to five, and they're nothing to do with his ratings. Each man has a
  ceiling, drawn once for him from the odds for his position in the league his rating belongs in (halfway between his
  rating and his potential, for a career's men); a keeper always has one star. In the Premium League most wingers have
  three or four and one in fourteen has five; most strikers three, some four, and one in fifty five; midfielders mostly
  one to three, with five very rare (one in 330 in the middle, one in 170 attacking, one in a hundred out wide);
  centre-backs one or two, three at most; full-backs one to three, and never more than one five-star full-back in the
  world. The leagues below have fewer: nobody in the bottom two has five, and their defenders nearly all one or two. A
  new career's world has about three or four five-star men, most of them Premium League wingers.
  - **His stars grow with him.** A young man is a star or two short of his ceiling and grows into it between 19 and 23;
    about half lose one between 32 and 35. When one of yours gains or loses a star, the news says so. An exhibition
    club's men have no age, so they play at their ceiling.
  - **A move above his stars doesn't happen**, and the screen says how many it needs ("SOMBRERO ★★★★★ ONLY"). The stars
    show on every player card, and in a match in your man's window.

  **SKILL MOVES**, on the start menu and the pause menu, shows every move: its name and stars, what to draw (the way
  he's going is the arrow along the foot of the drawing) and a clip of a man doing it, on a loop, at 0.8 speed. The
  clips are this game's own: `tools/clips/record_skill_clips.cjs` plays each move in the game, a man running at one of
  theirs 3 m ahead who stands his ground and watches the ball, and records where the two men are, their sprites'
  frames and the ball, every 1/30 s. The page plays them back with the game's sprites and ball, the camera following
  the action (out as the ball goes up). Change a move and run it again (`node tools/clips/record_skill_clips.cjs`):
  the clips carry a signature of the moves' code, and `tests/classic-moves.mjs` fails until they're re-recorded. On a
  big phone held sideways they're three a row, all nine on one page at 844×390 (two pages at 844×340); on a smaller
  one, two a row and four to a page.

  A move gives you little for free. The ball is wherever the move puts it, and a defender who can reach it while it's
  showing takes it, just as he would off the stick. Beating a man means moving the ball out of his reach as he
  commits. A move sells the man in front of you for a moment, the longer the better you are than him (see **The
  computer does skill moves**). Each move costs a little stamina. How quick a move is and how far it carries you is
  your Dribbling: the times and distances here are at Dribbling 10.

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
  past him. You have all five stars there, to practise every move. A run is called BEAT HIM once you're 1.8 m past him with the ball, or TACKLED, LOST IT, or TOO SLOW
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
  - TUNE has the skill-move dials, which also apply in matches: the croqueta's and the roulette's distance and time,
    the knock-on's push and time, the rainbow's lead, height and wind-up, the first-touch push, and the Dribbling, Agility and Tackling baselines.
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
  - Chips: CROSSER (COMPUTER or YOU), FROM (the byline, or 8, 16 or 24 m out for an early ball, as far out as anyone
    crosses from), OURS (1-3 in the box), THEIRS (0-3), KEEPER (on or off), plus the usual NEXT, TIME, NEW BALL and
    TUNE. TUNE has Crossing, Curve, Heading, Off IQ, Def IQ and the keeper's reach and speed.
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
  - The far side is a strip for each level a ground can be built to (see **The ground**): a metal bleacher at
    halfway with trees all round and a white rail (1), a longer, taller one with a press box (2), a covered stand
    most of the way along under a green roof (3), the timber stand the full length under a grey tiled roof, four
    terraces of fans, a picket fence (4, the strip as it was), two tiers the full width with boxes between them
    under a white truss roof (5). Each has sky, trees where the stand doesn't reach, and a paved track. It pans with
    the camera at the stand's own depth, a touch slower than the far touchline.
  - The game puts the boards along the front and the stand's name on its panel itself: the ground's own boards,
    centred on halfway, and none on a new career's field; away from a career, the old stand with the game's words
    on its boards.
  - The camera's far touchline is now 100 px down the screen instead of 64, so the stand shows over it.
  - The strips come from `python3 tools/sprites/make_pitch_art.py --embed-classic`. `PITCH.enable(false)` in the
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
  again: it had been squeezed into the Office's narrow one, cutting off the keeper). In a career, the training pitch's
  Tactics tab has the same settings under WITH THE BALL and WITHOUT THE BALL.
  - **Formations.** There are eleven shapes for eight outfielders (v127): 3-3-2, 3-2-3, 3-4-1, 3-1-3-1, 3-2-1-2,
    3-1-2-2, 3-2-2-1, 4-2-2, 4-3-1, 4-1-3 and 4-1-2-1, in that order on the menus. Five are in four lines, with a
    holding midfielder's spot (DM) and an attacking midfielder's (AM) where they have them: 3-1-3-1 is a DM, two wide
    midfielders either side of an AM, and a striker; 3-2-1-2 two central midfielders, an AM and two strikers; 3-1-2-2 a
    central midfielder, two wide midfielders and two strikers; 3-2-2-1 two DMs, two wide midfielders and a striker;
    4-1-2-1 a DM, two wide midfielders and a striker. 4-1-3's one in the middle is a central midfielder. Every shape is
    for either phase. (v124 had eight, each one of the seven-outfielder shapes with a man more at the back; 2-4-2 and
    2-3-3, two at the back and for attacking only, went in v127, and 5-2-1 and 5-1-2, five at the back and for defending
    only, in v126.) The same eight men play in both shapes. A back three's middle man is a centre-back and its outside
    men centre-backs or full-backs, either in his own position there (v127); a back four has a full-back at each end,
    who goes up his flank with the ball as the side's instructions tell him. In a four-line shape the two midfield lines
    are a step apart. With the ball the DM holds in front of the back line as the pivot (a second DM holds beside him),
    the AM plays in the hole, between their lines behind the forwards (and the central midfielders a step behind him),
    and two wide midfielders on their own in a line hold the touchlines. Without it the deeper line screens, halfway
    between the back line and the midfield, and a lone AM stands halfway between the midfield and the forwards. Each
    man's defending spot starts as the one nearest his attacking spot, and you can rearrange either shape. A computer
    side defends in the shape it attacks in, with some exceptions. A front three drops a man into midfield unless the side
    gegenpresses, so 3-2-3 defends as 3-4-1 and 4-1-3 as 4-3-1. A direct counter sits deep and makes a back four of some:
    3-2-3 and 4-2-2 defend as 4-3-1. A shape saved before v124 is read as its new one (2-3-2 as 3-3-2; 4-2-1, which
    defended with four at the back, as 4-3-1); 5-2-1 and 5-1-2 as 4-3-1 and 4-2-2; and 2-4-2 and 2-3-3 as 3-4-1 (the
    shape it defended in) and 3-2-3 (its front three kept), each man in the spot of it nearest his old one.
  - **Width.** COMPACT, BALANCED or WIDE, set separately with and without the ball. It spreads each line, and how far
    out the wide men go, by ×0.84, ×1 or ×1.18.
  - **Seven styles, and the style is the whole game.** Each says how a side plays with the ball and how it defends
    without it, so there's no posture to set any more (PRESS HIGH, MID BLOCK and SIT DEEP are gone, and so is
    TIKI-TAKA). The STYLE menu, on both tabs, has the seven two to a line; a match's tactics have the same.
    - **BALANCED**: positional play. Wide men on the touchlines, a forward pinning their back line, two men always
      open for a pass, and runs in behind when the man on the ball can find them. Without it, a compact block around
      halfway that goes at the ball together as it comes over its line of engagement, the forwards screening the pass
      into midfield. (v112: each style's block is now its team instructions -- its lines, its press, its tackling: see
      **Team instructions** -- set as the style's picked, and yours to change.)
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
    - **Measured.** Each style against a BALANCED side, the computer playing both sides, two 30-minute games with the
      ends swapped (ARS v MCI), per 15 minutes of the style's side. Ball: its share of the time a man of either side
      had it. Average pass, under 13 m, 25 m or more: of its passes that reached one of its own. Spread: how far apart
      across the pitch its men were with the ball. Back line: how far its defenders were from their own goal without
      it. Pressing: the seconds it spent pressing. Won back in 5 s: of the times it won the ball, how many came within
      5 s of losing it.

      | | Ball | Passes | Average pass | Under 13 m | 25 m or more | Shots | Shots against | Crosses | Spread | Back line | Pressing | Won back in 5 s |
      |---|---|---|---|---|---|---|---|---|---|---|---|---|
      | BALANCED | 49% | 177 | 19.4 m | 34% | 21% | 6.0 | 6.0 | 2.5 | 48.8 m | 33 m | 128 s | 25% |
      | GEGENPRESS | 52% | 189 | 19.7 m | 35% | 21% | 8.2 | 8.2 | 5.0 | 48.1 m | 42 m | 178 s | 31% |
      | CONTROL POSSESSION | 44% | 187 | 15.0 m | 54% | 13% | 5.0 | 5.5 | 1.5 | 46.7 m | 33 m | 177 s | 19% |
      | WING PLAY | 52% | 172 | 22.0 m | 27% | 29% | 5.5 | 6.2 | 4.2 | 51.8 m | 33 m | 121 s | 25% |
      | DIRECT | 41% | 139 | 21.3 m | 30% | 25% | 8.7 | 5.2 | 2.0 | 48.0 m | 32 m | 152 s | 22% |
      | FLUID COUNTER | 49% | 164 | 20.2 m | 34% | 23% | 8.0 | 6.5 | 2.2 | 45.9 m | 32 m | 133 s | 26% |
      | DIRECT COUNTER | 51% | 172 | 20.6 m | 33% | 25% | 5.7 | 4.2 | 2.2 | 46.4 m | 24 m | 86 s | 30% |

      GEGENPRESS defends 9 m higher than anyone (42 m to BALANCED's 33), presses longest (178 s to 128) and wins the
      most back within 5 s of losing it (31% to 25%); its games are the most open, 8.2 shots a side, and it plays the
      most passes (189). CONTROL POSSESSION plays the shortest (15.0 m, over half of them under 13 m, few long), though
      in these two games it had less of the ball than BALANCED (44%). WING PLAY spreads widest (51.8 m) and goes long
      most (29% of its passes 25 m or more); GEGENPRESS crossed more here (5.0 to 4.2). DIRECT has the ball least (41%)
      and plays the fewest passes (139), and shot the most (8.7). DIRECT COUNTER sits deepest (24 m), presses least
      (86 s) and lets the fewest shots in (4.2). Measured on the code with positions (v45). Two games a style, so a shot
      or two either way is noise.
  - **Your keeper with it in his hands (v114).** The moment your keeper has it in his hands you're on him, as you'd be on
    any man with the ball -- not left on whoever you were. The stick turns him and walks him round his box with it;
    PASS throws it to the man you're aiming at (as your pass picks him: that way, the free one -- an amber ring marks
    him), along the grass as a pass would go, and you go with it, on to him; `J` `J` throws it overarm, up and over;
    a tap on a team-mate throws it to him, a drag off PASS throws it that way, and with nobody that way it's thrown
    into the space. CLEAR -- or SHOOT -- is his long ball (v115): not a defender's clearance but a long pass, pinged to
    the man you're aiming at (picked as a pass picks him, the further on the better, 10 m to 60 m out) on a lofted
    pass's flight, and you go with it; with nobody that way, long into the space that way. (In v114 it was booted as
    far up as it would go, a clearance.) A goal kick is the same, kicked -- the
    ball's on the ground, so the stick turns him but he stays at it. He still has 5 s: for the last 2 s a red
    stopwatch flashes over his head, and when it's up it goes to the man you've got lit (with nobody lit, where the
    side's style says). Before v114 you were left on an outfielder and PASS played it out by the BUILD-UP -- short to
    the nearest free man, mixed to you, long up to the forwards; the computer's keeper still plays it so, by his
    side's style since v116 (the BUILD-UP instruction is gone: CONTROL POSSESSION plays it short, DIRECT and DIRECT
    COUNTER long, the rest mixed): long kicks it up to a man who can win it (with nobody, after a moment, up the
    emptier side anyway), short and mixed find a man near him when one's free (short, made to play it, takes a closer
    call before going long).
  - **The keeper and the rules (v113).** His hands only in his own penalty area -- and never to a ball a team-mate
    has kicked to him on purpose (a pass, a cross, a clearance), unless someone else has touched it since (one of
    theirs, a deflection) or it came off a team-mate's head (a header isn't a kick). Anywhere else he plays it with
    his feet, like anyone: a pass back to him, a loose ball he comes out of his box for (it used to be booted
    upfield, KEEPER CLEAR), a man on the ball he comes out at beyond his box (KEEPER OUT!: off his feet, not into
    his gloves). He used to handle everything.
    - **Yours at his feet**: you're on him -- the stick moves him with it, PASS and SHOOT do what they do for anyone,
      by his own stats (a keeper's passing is a keeper's), CLEAR is his long ball (a long pass to the man you aim
      at: v115), and one of theirs can take it off him. Played
      on, you go with it, on to the man it's for; lost, you're on the nearest of ours. You can pass it back to him
      yourself (he's one of the men your pass can pick out), and he comes for it -- your pass doesn't put you on
      him until it's at his feet.
    - **The computer's at his feet**: a touch to settle it, then a short ball to a man of his who's free -- or, one
      of yours closing in (7 m), or a side that goes long (DIRECT, DIRECT COUNTER), kicked up the pitch; with nobody
      free, a moment, then long.
      He never sits on it: one of yours stood off him gets it played past him (and see **nobody sits on it for
      free** under the line of engagement).
    - **A goal kick** sits on the ground in front of him and is kicked, short or long -- never thrown, never in his
      gloves.
  - **Winning the ball back counts.** All a side does on winning it -- a counter's break, the men going up the pitch
    at a sprint, the counter-press, a deep block noting that it lost the ball high -- starts when the ball changes
    hands. That was read from the last touch alone, and a tackle, a block or a first touch makes the ball the
    winners' before one of them has it at his feet, so it hardly ever started: over 12 minutes a GEGENPRESS side's
    counter-press was on for 151 frames, about one loss's worth, against 4313 now. Now it's the side that last had
    it at a man's feet that lost it; restarts and kick-offs are as they were.
  - **Team instructions (v112).** One set for the whole side, by its lines -- not a man's, nor a spot's -- on the other
    side of the right-hand column (INSTRUCTIONS, at the top row's end left of BEST 8: v116), for the phase you're
    looking at. Each setting is a row; under them,
    a line saying what the one you touched last does. A career keeps your side's, an exhibition club its own (only
    where you've changed its style's), and picking a style sets that style's (see below); then change them as you like.
    - **Without the ball**, first a little pitch of their own, to scale, our goal on the left: the DEFENSIVE LINE (how
      high the back line holds, with the ball far off) and the LINE OF ENGAGEMENT (where the side starts to go at it),
      each a line to drag -- a finger anywhere on the pitch takes the nearer one -- with its distance from our goal on
      it, and dots for where the three lines stand. The back line goes from 15 m to 50 m, the line of engagement from
      30 m to 80 m, and never closer to the other than 14 m: dragged into it, a line stops. Then the rows: ENGAGE WITH
      (FORWARDS: the forwards on the line of engagement, the midfield halfway between them and the back line; MIDFIELD:
      the midfield on it, the forwards a few yards ahead, further if they're told to PRESS UP); DEFENDERS (HOLD THE
      LINE: their height held, and a runner picked up a beat late, as before; OFFSIDE TRAP: with the man on the ball
      facing them, free to pick a pass, and one of theirs on their line, they step up together 3.5 m for a moment --
      leave a man on the old line and he's off when it's played; they don't track runners, they leave them to the
      flag; FOLLOW RUNNERS: a runner picked up from further, at once, from a wider zone, and gone with across the pitch;
      PRESS UP: out to a man dropping in front of them, tight); DEF TACKLES and MID TACKLES (STAY IN FRONT: goal-side,
      a yard further off, and in only when the ball's there to win -- not at a man running at him; BALANCED: as before;
      TACKLE: tighter, and in for it half as often again); FORWARDS (CONSERVE: up the pitch for the ball out, no sprint
      back; DEFEND THE LINE: on the line of engagement, in the way of the passes into midfield; PRESS UP: at the ball
      beyond the line, and on the men it could go to).
    - **The line of engagement, in the match.** With the ball beyond it (and a stride, 10 m), nobody goes and gets it:
      the man nearest waits on his line, in the lane between his place in it and the man on the ball, and the block
      waits with him; the ball coming over it springs the block, all of it at once (it used to be the middle third,
      for every side). Only forwards told to PRESS UP go beyond it. A man a long way upfield of his place in the block
      (15 m; a forward told to DEFEND THE LINE 18 m) gets back at a sprint, so a deep block forms quickly. But nobody
      sits on it for free: a man who keeps the ball within 5 m of where he had it for 3 s gets the nearest of theirs
      out to him wherever their line is (about 1 to 8 s more, by how deep they sit) -- without it, a man stood still
      on the ball in his own half kept it all day.
    - **With the ball**: DEFENDERS (STAY BACK, SUPPORT, PUSH UP: the full-backs staying in the back line, joining the midfield in their third
      as before, or up from the build-up and overlapping, the centre-backs closer to the play); MIDFIELD (STAY BEHIND:
      the central midfielders behind the ball, waiting at the edge of the box for a cross; BALANCED; GET FORWARD: one
      holds, the others run in behind and get in the box); FORWARDS (COME SHORT: the strikers drop between their lines
      for it to feet; BALANCED: one pins their line, the other comes short; IN BEHIND: on their last man, running in
      behind, and going again sooner); WIDE MEN (TO FEET, BALANCED, IN BEHIND: the wingers and wide midfielders coming
      to the ball or running in behind). How the side plays out from the back -- the keeper's ball, and how the back
      line moves it on -- was BUILD-UP (SHORT, MIXED, LONG); since v116 it isn't an instruction but the style's:
      CONTROL POSSESSION short, DIRECT and DIRECT COUNTER long, the rest mixed.
    - **What a style sets.** BALANCED, WING PLAY and FLUID COUNTER: the back line at 32 m and the line of engagement at
      54 m (where the old mid block stood), everything else BALANCED (and the defenders HOLD THE LINE, the forwards
      DEFEND THE LINE, the full-backs SUPPORT). GEGENPRESS: 46 m and 68 m, both lines TACKLE, the forwards PRESS UP.
      DIRECT COUNTER: 20 m and 34 m, the midfield on the line of engagement (and long from the back, as DIRECT;
      CONTROL POSSESSION short: the style's own, no instruction since v116). The computer's clubs play their style's -- they used to have no
      instructions at all. (The block the old code still reads -- high press, mid block, low block -- follows them: a
      high one with the forwards pressing up and the line of engagement at 62 m or more, a low one with the back line
      at 24 m or less.)
    - **Measured** in computer v computer matches (Arsenal against Aston Villa, ten minutes, three a setting, Arsenal
      told one thing, Villa on BALANCED's). Without the ball -- with Villa on it a while in their own half:

      | Arsenal told | Back line | Midfield | Forwards | A man on theirs on the ball | Won it in their half |
      |---|---|---|---|---|---|
      | BALANCED's (32 m, 54 m) | 30 m | 46 m | 58 m | 16% | 10 |
      | Lines deep (18 m, 36 m) | 21 m | 40 m | 51 m | 2% | 9 |
      | Lines high (46 m, 70 m) | 42 m | 56 m | 65 m | 34% | 22 |
      | ENGAGE WITH MIDFIELD | 30 m | 54 m | 61 m | 31% | 25 |
      | FORWARDS PRESS UP | 31 m | 47 m | 60 m | 20% | 18 |
      | GEGENPRESS's | 40 m | 55 m | 63 m | 36% | 22 |
      | DIRECT COUNTER's | 20 m | 42 m | 52 m | 4% | 10 |

      (Three matches' worth; the lines measured where they stand, the defenders' mean.) Both TACKLES at TACKLE: 99
      tackles in three matches, against 54; at STAY IN FRONT, 36. DEFENDERS PRESS UP: 73 tackles, the back line 1.5 m
      higher. The OFFSIDE TRAP: with Villa on it in midfield, the back line 2.5 m higher, and two offsides in three
      matches (the computer won't play a ball to a man it can see is off, so it's your passes it catches). FOLLOW
      RUNNERS is the subtle one: the nearest defender half a metre nearer a runner in mid-run. CONSERVE plays as DEFEND
      THE LINE in a mid block (the forwards are up anyway); in a deep one its forwards stay up for the ball out. With the
      ball: runs in behind in three matches -- BALANCED's 319, the WIDE MEN TO FEET 178 and IN BEHIND 342, the
      FORWARDS COME SHORT 255 (the strikers 9 m deeper) and IN BEHIND 350, the MIDFIELD GET FORWARD 356; STAY BEHIND
      keeps the central midfielders 5 m deeper; DEFENDERS PUSH UP has the centre-backs 1.5 m further up and STAY BACK
      3 m further back. The computer's keeper told LONG kicks it every time, told SHORT throws or rolls it.
    - **Centre-backs.** One told to STAY BACK sits 2.4 m further behind the ball once it's past our third.
    - **Without the ball.**
      - A centre-back told to STEP UP picks up a man 16% of the time (4%); a wide midfielder told to, 33% (14%).
      - A striker told to STAY FORWARD waits 7.5 m higher, and one told to COME BACK 5.4 m deeper.
      - A central midfielder told to INTERCEPT is in a passing lane 10% of the time. One told to COVER WING is
        2.7 m nearer a ball that's been out wide for 1.5 s.
  - **Anyone can play anywhere**, the keeper included. Swap any two men, or put an outfielder in goal (the keeper
    then takes his spots in both shapes). BEST 9 puts a keeper in goal and the best eight by their ratings in the
    spots they're in, a man in his own position ahead of an equal one out of it.
  - **Positions: his own, his second ones, and the rest.** A spot in a shape is a CB, FB, DM (a holding midfielder's:
    v127), CM, AM (an attacking midfielder's: v127), WM, W (a winger's) or ST. Since v118 it's a man's ARCHETYPE that
    says where he can play, not his position: the spots it plays are his own, and the ones it covers his second
    positions -- a stopper is a centre-back and nothing else, a cover CB can go out to full-back, a libero is a
    centre-back and a holding midfielder both, a false nine a striker who can drop into the hole (an AM's spot). Every
    archetype's are in the table under [Playing styles](#playing-styles). The outside spots of a back three are a
    centre-back's and a full-back's alike (v127): a full-back there is in his own position, nothing off him, as a
    centre-back is. (A man without an archetype -- none in a career now -- goes by his position, as every man did
    before v118: a CB also FB; a FB also WM and CB; a DM also CM and CB; a CM also DM, AM and WM; an AM also CM, W and
    ST; a WM also FB and W; a WNG also WM and ST; a STK also W.)

    Anywhere else he's out of position. What it costs him is his reading of the game. In a second position he loses
    0.6 of his Def IQ out of possession and 1.2 of his Off IQ on the ball; out of position, 3 of each. In a match it's
    the spot he takes with the ball that costs him Off IQ and the one he takes without it Def IQ, so a winger who
    drops to wide midfield without the ball loses a little Def IQ and nothing else. His other ratings are as they
    were. His rating in a spot is his own in his own position; in a second one, his own less a point for each point of
    IQ he loses there (2); out of position, his rating for that line less 6 (what his attributes make him there, if
    it's not his own line). On the tactics pitch a man's rating is lime in a second position of his and amber out of
    position, and in Training his card adds what he's rated in his own ("74 at CB"). The computer's clubs pick each
    spot's man by position: in a new career about 83% of them play in their own, 15% in a second one and 2% out of
    position (v127: 85%, 12% and 3% before -- a holding or an attacking midfielder in a central one's spot is in a
    second position; v118: archetypes are choosier than positions were -- 72%, 27% and under 1% before -- so a computer
    squad's positions are dealt to fit its shapes: see [Playing styles](#playing-styles)). Who defends where, when a side's shape without the ball isn't its shape with it (yours too, when you
    change one), is still each man to the spot nearest his, but now in a position of his own before another: a second
    position counts as a little further off, one he'd be out of position in as about a spot further on. So a side
    that drops a midfielder into its back line without the ball drops one who covers there -- an anchor, who covers
    centre-back -- rather than a playmaker beside him (v118). The computer's clubs had
    about 7% of their men out of position without the ball, then about 4% (about 6% with archetypes, v118), none of
    them further from their spots; what's left is the shape's doing (a back three from a side with two defenders in
    it). Before, nothing was lost in a match, and a man was only rated afresh for a spot in another line (a winger at
    wide midfield was rated as a midfielder: 90 down to 78; now 88).
  - **Moving men is a drag.** Touch a man and move your finger, and he's up at once: there's no hold to wait for
    (nothing scrolls, so a moving finger can only mean him). A tap, however long, only shows his card. With a
    mouse, just drag. He stays where you picked him up and moves with your finger from there. While he's up, every spot on the pitch shows what he'd be rated
    there, in the scheme's colour in his own position, lime in a second one and amber out of position. Drop him on another man and they swap
    spots (in the shape you're looking at), or on a sub and the sub comes on (in both shapes). In the clubhouse's
    Squad tab you can drop a man from the list onto a small pitch above his card.
- **Clearances read the game.** Def IQ decides how far a clearance can go and how surely it finds a team-mate up the
  pitch. That covers your CLEAR, the computer's clearances and headed clearances.
  - **Your clearance, charged (v107).** With the ball at your feet in your own half, CLEAR (`L`, or CROSS on a phone)
    charges it: hold it and the meter round your man fills (blue, 0.6 s to full), and it goes as you let go. A tap
    clears it a short way and low -- two-fifths of how far he can clear one, rated 5.5 coming down some 11 m on and
    1.4 m up at the top -- a quarter charged 15 m, held full the whole way, high (28 m on, 4.2 m up, rolling on to
    about halfway: as every clearance went before). A loose ball coming at you, the press arms a first-time clearance
    as before: still holding as it reaches you, it goes the whole way; let go, as far as you'd charged it. Headed
    clearances are one press, no charge: how far is his Heading.
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
    (it took 0.8 s). Hold SKILL to shield it instead (see **Holding SKILL**).
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
  - **Passes bend only when it helps, and not much.** A through ball, or a long pass (along the grass over 24 m, your
    lofted ball over 20 m), to a man running across its line bends a little into his path. At Curve 10 a pass turns
    16° at most over its flight, and a through ball gets to him turned 7° his way; at Curve 1, 1°. It used to turn up
    to 40°, a banana that took a long ball round almost anyone in its way. One with a man of theirs on its line bends
    a little away from him, not round him: at Curve 10 it passes a man 0.6 m off its line 0.1 m further off than at
    Curve 1. To a man running along its line it goes straight. Yours bend the same way as the computer's. In the
    computer's games a curled long ball at Curve 10 now bends 15° on average, where it bent 36°. Whether a long ball
    gets there doesn't hang on Curve, though: with every man at Curve 10 or every man at 1, about nine in ten passes
    of 20 m or more reach one of ours.
  - **The computer's through ball round their line.** A through ball to a man running in behind their back line
    goes through a gap in it -- between two of their back line 3 m or more apart, or, the run being out past their
    outside man, between him and the touchline -- and bends on round onto the runner along a steady arc (the same
    turn every metre, however it slows), as much as that takes and as much as the passer's Curve gives him: 6° of
    turn over its flight at Curve 1, 34° at 10 (over 15 m, from a few centimetres off the straight line to about a
    metre). He chooses it on that path, not on a straight line through a man, so a passer who can bend it finds
    balls in behind that one who can't misses: where the straight ball goes a couple of metres from one of theirs, a
    Curve 10 passer bends it away from him and its chance of getting there goes from about 0.23 to 0.30; out wide,
    with the runner outside their full-back, from 0.36 to 0.60. One he'd have to bend more than he can, he bends as
    far as he can (or half that, if the full bend takes it onto the next man), or plays it straight. It's weighted
    as any through ball is, a touch harder for the longer way round; everyone reading the ball reads the bend, and
    a touch on the way ends it. Yours go where you drag them, as before.
- **The six** on a player's card are each the average of the attributes under them. They're only what the card
  shows: a man's rating comes from weights for his line (see **Ratings**).

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
  A keeper's six: DIV Diving, REF Reflexes, REA Reach, SPD Speed, KIC Kicking (distribution, ball control,
  composure) and HAN Handling (v77; composure and ball control were a CMP of their own).
- **Ratings (v122).** A man's rating is a weighted average of his stats (times ten), the weights out of 5 and set by
  his line -- keeper, defender, midfielder, attacker -- not his exact position or his archetype. What his line's game
  is made of counts 5, then 4 and 2, and every other outfield stat 1, so even a defender's shooting counts a little:
  a League 2 centre-back goes from 49 to 55 with his three shooting stats taken from all 1s to all 10s (his tackling
  the same way: 37 to 65). Before v122 the weights were 1 to 3 and a good many stats counted for nothing -- crossing
  and curve for anyone. A keeper's rating is his keeping, and a little his feet.

  | Stat | Defender | Midfielder | Attacker |
  | --- | --- | --- | --- |
  | Def IQ | 5 | 2 | 1 |
  | Tackle | 5 | 1 | 1 |
  | Interceptions | 5 | 2 | 1 |
  | Slide tackle | 4 | 1 | 1 |
  | Strength | 4 | 1 | 1 |
  | Heading | 4 | 1 | 2 |
  | Speed | 4 | 2 | 4 |
  | Acceleration | 2 | 1 | 4 |
  | Agility | 2 | 4 | 4 |
  | Stamina | 2 | 4 | 1 |
  | Composure | 2 | 4 | 4 |
  | Passing | 2 | 5 | 1 |
  | Off IQ | 1 | 5 | 4 |
  | Ball control | 1 | 4 | 4 |
  | Dribbling | 1 | 4 | 5 |
  | Crossing | 1 | 1 | 1 |
  | Curve | 1 | 1 | 1 |
  | Shot accuracy | 1 | 2 | 5 |
  | Shot power | 1 | 1 | 4 |
  | Long shots | 1 | 2 | 2 |

  Keepers: Reflexes 5, Reach 5, Diving 4, Handling 4, Distribution 4, Keeper speed 2; Composure, Passing and Ball
  control 1 each. The scale is kept where it was: a man of his line's usual make rates what he did before at any
  level, so a League 2 man is still rated as one and prices and wages don't move with the change; what moves a man is
  how his lesser stats compare with a usual one's. A career from before v122 has every man rated again on these, once
  (a new world made on v121 and read on v122: about half the men the same, most of the rest a point either way, a
  few two, the leagues' averages where they were). Played somewhere else, a man's rating is his own in his own positions, two less in a
  second one, six less out of position -- and out in another line he's rated on that line's weights, then six less.
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
    find, all inside the posts (5 m either side of the middle: the goals are the men's size, not the pitch's). How
    far out they wait goes by the pitch's markings, so it's the same spot in the box whatever the pitch's size. Before,
    a forward would come toward the man on the ball, out past the near post.

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
  - **How true it goes is his Crossing**, and how far out he crosses it from. From level with the six-yard box or
    nearer the byline most crosses go close to where they're aimed, and the worst still go as wide as ever (up to 9°
    off at Crossing 1, 1° at 10); further out they go wider (see **Crosses come from 24 m out at most**). Measured in
    the Crossing Lab from the byline, they came through head height about 0.6 m from where they were aimed at
    Crossing 8, and 1.4 m at Crossing 1.
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
    On average they came through head height 0.6 to 1.6 m from where they were aimed, the further out the wider:

    | From | Ours v theirs | Headed by ours | Cleared |
    | --- | --- | --- | --- |
    | 8 m out | 2 v 0 | 16 | 0 |
    | 8 m out | 2 v 2 | 6 | 10 |
    | 8 m out | 3 v 3 | 13 | 3 |
    | The byline | 1 v 1 | 14 | 2 |
    | 16 m out | 3 v 2 | 7 | 9 |
    | 24 m out (early) | 2 v 0 | 16 | 0 |
    | 24 m out (early) | 2 v 2 | 4 | 10 |

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
- **Crosses come from 24 m out at most, and go less true the further out.**
  - Nothing's crossed from more than 24 m from their byline. The computer doesn't choose one from further out (it
    would, from up to 29 m); your CROSS does nothing out there (it crossed from anywhere in their half; on a phone
    it's dimmed now until the ball's 24 m out or nearer); and a team-mate you call for one doesn't cross it (he would
    from about halfway on).
  - The further out it's struck, the less true it goes, the best crosser's too: the computer's, yours (lofted or low)
    and one you call for. From level with the six-yard box or nearer the byline it's as it was. From 24 m out its line
    goes over twice as wide (2.9° off on average at Crossing 8, against 1.0° nearer in; 7.1° against 3.1° at Crossing
    1), and its weight's out as well, up to an eighth of its length over or short (a fifth at Crossing 1). In between,
    in proportion.
  - **A poor crosser comes up short (v107).** He hasn't the power to whip one in, so his miss on its weight is mostly
    short: at Crossing 1 three times in four, by up to 22% of the way (9% off on average from the byline), and the
    other time over by up to 8%; from 24 m out short two times in three. A good crosser's weight is spot on from the
    byline (Crossing 10 exactly, 1.7% off at Crossing 8), and from 24 m out as often over as short. Before, a poor
    crosser's ball from the byline went as far as a good one's, and when it missed its man it carried on, bouncing,
    to the far side: an unmet cross to the far post came to rest some 19 m past it. Now his come through head height
    1.7-2.6 m short of the man from the byline (3.5-4.8 m from 24 m out) and stop 7-15 m past the spot on average. (A
    cross nobody meets, a good one included, still bounces on: that's the ball, as for any lofted ball.)
  - Measured in the Crossing Lab, the computer's crosses with two of ours in the box (with two of theirs and without;
    96 to 144 from each spot at Crossing 8, 48 at Crossing 1): how far from where they were aimed they came through
    head height on average.

    | From | Crossing 8 | Crossing 1 |
    | --- | --- | --- |
    | The byline | 0.6 m | 1.4 m |
    | 8 m out | 0.5 m | 1.5 m |
    | 16 m out | 1.1 m | 2.5 m |
    | 24 m out | 1.8 m | 4.1 m |

    Before, it went as true from 24 m out as from the byline: 0.5-0.6 m at Crossing 8 and 1.4-1.8 m at Crossing 1
    from anywhere. Ours still get to most of them, reading where it's going and going to it, but not all: from 24 m
    out at Crossing 1 with nobody of theirs there, 10 of 24 went to nobody (1 before).
  - The computer weighs it up: a cross is worth less to it the further out, the more so the poorer he crosses (from
    24 m out about 0.7 of what it would be from nearer in at Crossing 10, half at Crossing 1), so he takes it on
    toward the byline when he can.
  - Over whole matches (computer against computer, four 24-minute games each, two with both sides on WING PLAY and
    two on BALANCED, before → now): crosses 2.9 → 2.5 per 6 minutes; from within 8 m of the byline 35% → 53% of
    them, from further out than 24 m 1 in 46 (from 28 m) → none; headed on goal by the side that crossed it 59% →
    52%.
- **The computer does skill moves.** Taking his man on, one of the computer's men with the moves (his skill stars)
  does one to get past him, only those his stars allow: a one-star man knocks it on past him; with more, a knock-on or
  a croqueta most, a drag-back with the man right on him, a roulette only when he's well the better of him, a Cruyff
  turn out wide or near the byline, a rainbow flick with nobody behind him to pick it up, and at five stars an
  elastico, or a heel flick round him close up.
  - **Who.** Wingers and wide midfielders most. Central midfielders and strikers now and then. A full-back only when
    he's pushed on (told to attack, or already in their third) and is clearly the better man (by 1.5 or more). A
    centre-back never.
  - **How keen** is how much better he is on the ball than the man in front of him is at stopping him, not how good
    either of them is: his Dribbling (counted twice), Ball control and Agility against that man's Tackling (twice),
    Def IQ and Agility. Level, he's a third as keen as at 2 better; at 1 worse, not at all. A 5 against a 2 is as
    keen as an 8 against a 5. Keener out on the touchline (×1.3) and in their third (×1.15); never in his own half.
    The keener he is, the more often he takes his man on at all (about twice as often at the keenest).
  - **Which move.** He goes into it about 3 m from his man, toward the side away from him: a croqueta or a knock-on
    most often (knocked on diagonally, away from him), a rainbow flick with nobody behind his man to pick it up, and
    a roulette only with the man right on him and when he's a good deal the better (by 2.5 or more).
  - **The sombrero is for a man behind him.** A five-star man on the ball in their half, his back to one of ours 1 to
    3 m behind him and nobody else of ours within about 6 m of that man, now and then flicks it over them both: he
    looks four times a second, and takes it up to one look in six, the keener he is (see **How keen**). With four
    stars, or with the man in front of him, never.
  - **A move sells the man in front of him,** yours as well as the computer's. Anyone of theirs within 5.5 m and not
    behind him is wrong-footed for a moment: he goes at where the ball was and can't win it. 0.1 s against a level
    man, up to 0.35 s at 4 better, and not at all from 1.6 worse. (Not in the Dribble Lab, where it's your timing
    against his lunge.)
  - **A move's pace and reach are the man's Dribbling,** yours too. At Dribbling 10 it's as the dials have it (as
    quick as before); at 1 it takes 1.6 times as long and carries him and the ball 30% less far; at 5.5, 1.23 times
    as long and 85% as far. A poor dribbler shows the man the ball for longer and gets less far from him.
  - **Measured** over six 6-minute computer-against-computer games: 35 moves, about 6 a game. 30 were by wingers, 3
    by central midfielders and 2 by strikers; 15 croquetas, 14 cuts (flicks chopped square, before the knock-on) and
    6 rainbow flicks; 22 out on the touchline.
    He still had the ball after 26 of them. A winger against a defender closing him down, 8 runs each: at 9 against
    4 he did a move 8 times, got past 5 times and never lost it; at 7 against 6, 5 moves, 1 past, lost it 3 times;
    at 5 against 8 he never tried one.
- **The career is a manager's career.** You don't play in it. On the first screen, NEW CAREER, three tabs: CLUB, where
  you name yourself and your club and give it a three-letter short name (it suggests one from the club's name,
  shown on a scoreboard as you type); KIT, its colours; and CREST, its badge. START works from any of them. You
  start in League 2, the bottom of four 14-club leagues (League 2, League 1, Championship,
  Premium League), with a weak squad of 15 and $20,000. A squad is twenty-one at most (every club's), thirteen at
  least; nine start, five are on the bench, and the rest aren't taken (the training pitch's Selection tab: see
  **Selection**). It was fifteen at most, with a bench of four, then twenty with eight starting (v124: a man more
  each for nine a side, a fifth defender among a new squad's fifteen). The game is buying and selling players:
  nobody's stats are built up by hand.
  - **The season runs a week at a time.** Three weeks of pre-season (no games), then 26 league weeks with a league
    game every Saturday, home and away -- in some weeks a cup game on the Wednesday before it, never in the league's
    first three weeks -- a week's winter break after week 13, the playoffs for those in them, and the season review.
    - **Each week starts on a Monday**: your decisions (your team and tactics in Training, transfers while the window's
      open, the clubhouse, the buildings; more to come), then FORWARD TO MATCHDAY (NEXT WEEK in a week without a game,
      START THE SEASON after pre-season, BACK TO THE LEAGUE after the winter break). On the matchday's morning you PLAY
      it (the live match, in your colours, with the home side in its home kit) or SIMULATE it, and after it you're on
      the next Monday. In a week with a Wednesday cup game you go from it to Saturday morning (your team can still
      change, for tired legs), then to Monday. League 2 has no cups, so never two games in a week.
    - The days between go by on their own: the other clubs' games, your men getting their legs back. The money still
      moves once a league game, as it did (a week without one costs and earns nothing).
  - **The league.** The top two go up. 3rd to 6th play off for a third place: one-game semis
    at the higher seed's ground, then a final, with a shoot-out if it's level. The bottom three go down. There's no
    sack: however badly it goes, you carry on.
  - **Fitness carries from one game to the next.** Every man has it (100%: fresh). A game costs him about a quarter of
    it -- 22% with Stamina 10, up to 33% with Stamina 1, a point more a year past 30; taken off, 60% of that; brought
    on, 40% -- and every day after it he gets some back: 4.5% a day with no physio, up to 7.5% with the best (the
    computer's clubs: by their league, the Premium League's the best). A live match starts with it as his legs'
    ceiling: a man 60% fit can't get past 60% of his legs all game (and comes back at half-time only as far as
    that), so he's slower from the kick-off. In a simulated game he counts 15 points under his rating for all he's
    short of fresh (at 80%, 3 under). Who plays for you is yours (Training's Selection tab shows each man's fitness as a bar along his name, the
    tactics pitch along his token, his card as FITNESS; the hub warns when some of your nine are under 70%).
    - **A game a week, and they're fresh for it**, whatever the physio: a week's rest is more than a game costs. What a
      man's fitness reads between games is what he'll start the next one with.
    - **Two games a week, and only a good physio keeps up**: four days from Saturday to the Wednesday game, three to
      the next Saturday's. In
      the Premium League with the Champions League and the cups and no rotating, a side with no physio starts its
      games about 70% fit on average, at worst under half; with the best, 99% (a season each, simulated). Even
      then a man with poor Stamina, or past 30, can run down to 60% or so: a game costs him more than two days' rest
      gives back, so rest him now and then.
  - **Injuries.** A man can get hurt -- mostly in a game, now and then in training. A full game costs a fresh,
    ordinary man of 25 about a 1.6% chance with no physio; more when he's tired (2.9% at 60% fit), past 29, not durable
    (a hidden value), or in the three weeks after he's back from one (x2.5). In a season the four leagues have about
    300 (five or six a club).
    - **The physio is the one against them** (a computer club's by its league): each level is as good as a point more
      durability for every man (to 10 at most) -- fewer injuries (an ordinary man's risk 1.6% a game with none, 1.4%,
      1.2%, 1.0%, 0.8% with the best: half) and lighter ones -- gets a man back 10% sooner a level (40% with the
      best), and back fitter (80% with none, 4% more a level: 96% with the best). The coaches have nothing to do
      with injuries: they develop players.
    - **How bad**: a knock (3 to 8 days) more than half the time, a strain (10 to 28 days) three times in ten, a torn
      muscle (30 to 90 days) about one in eight, now and then something serious (four to nine months) -- worse the
      older and the less durable; in training mostly knocks. He heals by the day, and comes back short of fitness
      (see the physio, above). From 28, a torn muscle or worse takes half a point off his legs for
      good, and their decline comes on sooner and steeper; younger, it heals clean.
    - **Who plays**: the computer never picks a man who's hurt. Yours, if he's in your nine at kick-off (PLAY or
      SIMULATE), gives his place to the best fit off the bench -- a man of his line, the fittest -- and the hub says so;
      nobody hurt is among the subs.
    - **In a match you play**, a man can get hurt in it: he slows (his legs' ceiling down to 40%), can't sprint, and
      doesn't get better at half-time. ✚ HE'S HURT comes up by the quick subs, and he tops their list with the best
      man to take off for (the chip lights; it never drops down on its own). With no subs left he plays on. The
      report lists him. In a simulated game it's a roll for each man at his share of it.
    - **Where you see it**: ✚ and the weeks out by his name in the squad lists and Training's Selection list, his
      token on the tactics pitch faded, ✚ INJURED · a strain · 2 weeks on his card, the hub (✚ and who, and whether
      he's in your nine), and the news.
  - **Match ratings and form.** Every man who plays gets a rating for the game, 3 to 10 (6 an ordinary one).
    - **In a game you play** it comes from what he did in it, counted as it happens: passes tried and found, shots
      and on target, goals, assists, tackles won, interceptions, the ball lost, a keeper's saves. His role's work
      counts most -- a forward's shots and goals, a midfielder's passes found, a defender's tackles and
      interceptions, a keeper's saves -- and each goal counts less than the one before (one 7.2, two 7.9, three 8.4
      for a forward); the result counts (a win about seven tenths above a loss), and for the back and the keeper
      the goals let in (a clean sheet half a point). An own goal costs a point.
    - **In a simulated game** it's guessed: how good he is beside his side, the result, his goals and the luck of
      the day. Most goals have an assist (three in four).
    - **His form** is the drift of his last few ratings; it fades back to ordinary without games to keep it. It
      counts in his development: in good form he grows faster (twins at 19, a season: 13.8 half points against 7.9);
      in poor form his touch, his reading of the game and his composure slip (not his legs).
    - **What match actions build** is only two things: his goals a little more finishing (each worth less -- five
      goals in three weeks against one is no more growth all told) and big games (the Champions League, a cup's last
      two rounds, the playoffs) a little more composure. Funnelling everything through one man doesn't make him a
      star.
    - **Where you see it**: the report lists your men's ratings, the best starred; his card has THIS SEASON (games,
      goals, assists, a keeper's or defender's clean sheets) and RATING · FORM (his season's average, his form). The
      numbers start again each season; his form carries on.
  - **Character and morale.**
    - **Traits** are a man's character in a few words, never numbers: drawn from his hidden values, each with a good
      side and a cost. Natural Leader (steadies a bad run; his moods spread), Charismatic, Calm Under Pressure,
      Hot-Headed (higher highs, lower lows), Highly Ambitious (grows fastest when he plays; the bench eats at him),
      Loyal Servant (three seasons at the club: renews for less, won't want to go), Quiet Professional, Poor Trainer,
      Determined (bounces back fast; pushes too hard -- a little more injury risk), Easily Frustrated, Team Player,
      Inconsistent (his form swings). A man has none to a few. Yours come out over his first weeks at the club, one
      every four weeks, and on his card (a touch on one says both sides of it).
    - **Morale**, 1 to 10 (6.5 settled): each of yours his own, the side its own. After each game the side moves by
      the result against what was expected -- beating a better side lifts it most, a shock defeat sinks it -- its
      falls softened by a leader with the armband (a Natural Leader by about four tenths, the vice for the captain
      when he's out) and sharpened by a hot-head's. Every Monday each man moves by the week's minutes against what he
      expects (the better and the more ambitious expect more, a team player less; the easily frustrated mind most),
      his form, the side's mood pulling at his, and his resilience bringing him back to settled; the side by its
      men's. Promotion, a title or a cup lifts it; going down sinks it.
    - **What it does**: on match day (that game only, played or simulated) high morale is a little more stamina and
      composure (+0.5, +1 at the very top); low, less of those and of his reading of the game (-0.5, -1.5 at rock
      bottom). In training it steadies or upsets him, and a long low costs his touch and his reading of the game. An
      unhappy, ambitious man asks to leave: the news says so, clubs bid for him as if he were listed, and he won't
      renew till he's settled. Putting a man on the transfer list upsets him; a new deal lifts him.
    - **The captain and his vice**: the side's strongest leaders (charisma, with a little for experience) till you
      name them on the DEAL side of a man's card (ARMBAND: C or VC). Named, he's lifted; an ambitious senior passed
      over minds. (C) and (VC) by their names.
    - **A word with him** (v103; v70's check-ins before): in the Monday papers (below), the two unhappiest men who
      aren't asking for something else each ask for a word. TALK TO HIM and it says how he's feeling and why (wants
      more games, his form, the results, his contract...), his fitness, the coaches' word on how he's coming on, and
      brings out a trait; it lifts him a little, more if he's low.
    - **The Monday papers** (v103). Each Monday the week's papers are on your desk, a pile to go through -- since v106
      waiting off to the side for you: PAPERS on the campus's top bar, how many there are in an orange box on its
      corner (it pops in when they come, and the button glows till you've opened them; v103 to v105 opened the pile by
      itself over the hub, after the phone, the hometown hero or the wonderkid, never over the day going by) -- a paper
      at a time, the side's morale and how it's moved over the pile. First the dressing room: its mood now and last
      Monday, who's happier and who's less happy, who wants to leave and who's settled. Then what needs deciding,
      each with its buttons: a club's bid for one of yours (ACCEPT, REJECT), a club's answer to your bid (SIGN HIM on
      the seasons you set, or MEET their price, or WALK AWAY), a sponsor's offer (SIGN, NO THANKS -- see **Sponsors**),
      a man who's come on and wants a new deal (GIVE IT HIM, OR OFFER less, NOT NOW -- see **Contract talks**), the
      deals running out (v110: at the winter break, in the league's last four weeks and through the playoffs, your men
      whose deals end with the season, each with RENEW and LET GO, and TALK TERMS to his card), one who wants to leave
      (TALK HIM ROUND, LIST HIM), one who wants a word. Then the reports: bids of yours that fell through, sponsors'
      deals that ran out, the physio's (who's hurt, how and for how long, who's fit again), the coaches' every third
      week (who's coming on, who's going back), the scouts' (with a scouts' house and the window open: three men worth
      a look, LOOK to go to him in the market), your next game (where, their place and form, their top scorer) and the
      week's money. LATER puts a paper to the bottom; ✕ puts the pile aside, and PAPERS (with how many are left) opens
      it again. A decision you leave is in next Monday's pile while it stands (STILL WAITING): an offer for one of
      yours or a sponsor's lapses after two weeks. What you decide there is decided as it would be anywhere else --
      the market, the stadium, the clubhouse -- and done there instead, it's gone from the pile. Since v105 the
      dressing room's paper is every man in it: the side's mood and how it's moved, then each man's mood and how far
      it's moved since last Monday (the happiest first; one who wants out in red), then who wants to leave and who's
      settled. And the club shop's paper comes before the week's money: the week's shirt sales, the three best sellers
      and the season's shirts so far (see **Popularity** and **Shirt sales**).
    - **The matchday paper** (v105). The morning of each of your games -- a Saturday's league or playoff game, a
      Wednesday's cup tie (CUP DAY) -- the table, on a small pile of its own that opens by itself over the hub: every
      club's place, goal difference and points in two columns, who's gone up or down since the last round (▲ ▼), the
      places that go up (green), to the playoffs (gold) and down (red) marked down the side, yours shaded and today's
      opponents in red. Over it, where you stand ("5th in League 2, 18 points"), today's game (where, and their
      place), and in a line how far you are off the top, the top two, the playoffs or the drop. The season's first
      day has everyone on nothing. NEXT and it's read; the table's in the Clubhouse's League tab too.
    - **The hub** says when the dressing room is low or buoyant, and who wants to leave.
  - **The press conference** (v104). After each of your games, played or simulated, the press want a word -- its own
    screen, after the match report and before the money and the Monday papers -- in a press room drawn beside the
    questions as big as the club's league (v106): League 2's a back room -- a painted wall with a damp patch, a small
    window, a calendar, a folding table, one microphone, a plastic cup, two reporters; League 1 a banner in the club's
    colours, a cloth on the table, two microphones, four reporters with their hands up; the Championship the sponsors'
    wall, a name plate, three microphones, a TV camera and the odd flash; the Premium League (and any Champions League
    night, under its stars) the full room -- a long table, a row of microphones, two rows of reporters, TV cameras at
    the sides, photographers at the front and their cameras going off (small flashes; none with reduced motion). Two
    questions: the result's (a derby's, a cup tie's, a big win's or a heavy defeat's its own), then one of your men's
    (one who went off hurt, two goals or the day's best rating, one who's not been playing) or the run's (three wins in
    a row, top of the league). Three answers each, and each moves something a little: the dressing room ("All of them.
    The lads were brilliant."), a man ("He's the best I've worked with."), the fans ("This one's for the fans."),
    sometimes one up and another down ("I'm sorry. We owe them one.": the fans like it, the dressing room doesn't).
    After each, what came of it. SEND THE ASSISTANT and nothing's said, nothing moves.
  - **The week's events** (v104), in the Monday papers:
    - **Windfalls**, about one Monday in ten (not in a career's first weeks): money nobody planned on -- a will, a
      council grant, the supporters' lottery win, an insurance payout, the TV picking your game, a benefactor, a
      sponsored walk, an old sell-on clause -- $1,500 to $6,000 in League 2, up to $30,000 to $120,000 in the
      Premium League, in the bank at once.
    - **The community**, about one Monday in six: the town asks something of the club -- a coaching day at the
      primary school, a charity match for the hospital, a visit to the children's ward, a youth club's kits, an open
      training day, a collection for the food bank. YES and the fans think more of the club (1.5% to 3% more of the
      league's usual following), sometimes the dressing room too; some cost money (by the league), some a little of
      your nine's legs. NOT THIS TIME, and nothing happens.
    - **The derby**: a club in your league is your rival, the club down the road (picked when a career starts, and
      again in a season they're not in your league). The week you play them the papers build it up (where they are,
      their form, your record against them); the result counts 1.6 times as much in the dressing room and with the
      fans, win or lose, and a home derby brings every fan the club has, as many as the ground holds (v120; it was a
      quarter more at the gate: see **The turnout**). The press conference after it has its own question.
    - **The cups' draws**: your first round (or a bye, or the Champions League group), and after each round you're
      through, the next draw -- who, home or away, the Wednesday it's on and what winning it pays; or that you're out.
    - **Loans**, in the transfer window: a club wants one of your fringe men (out of your nine, 24 or under or
      not happy) to the end of the season and pays his wages -- LET HIM GO and he plays there and comes back when the
      season's over; or lends you one of theirs out of their nine for a share of his wage (30% to all of it, the
      better he is to them the more) -- TAKE HIM. LOAN HIM on another club's man in the market asks for one yourself
      (a man out of their nine, the window open, room in your squad). A man on loan isn't his club's to sell,
      release, renew or lend again till he's back, and nobody bids for him (the transfer list says who of yours is
      out on loan, and doesn't list the man you have on loan; his card says ON LOAN). Everyone goes back at the
      season's end: in the review, and the Monday papers say how yours did.
    - **The Player of the Month**: every four league weeks, your league's best over them (three games rated at
      least; the best average rating, goals to split a tie). One of yours: the league pays the club ($2,500 in
      League 2, $6,000, $15,000, $40,000 in the Premium League), the fans love it (3% more of the league's usual
      following) and he's lifted. Another club's: the papers say who, and who your best was.
    - **Deadline day** (v105): the winter break's Monday is the window's last day -- it shuts when the week's done,
      till the summer -- and its paper comes straight after the dressing room's (the hub says so too). The clubs
      that still need someone are desperate: the bids for your men come thick and fast (two-thirds more than in a
      pre-season week), a fifth over the usual fee, and three times in five a bigger club comes in late for one of
      your best three, at half as much again as he's worth or more (A DEADLINE-DAY BID). The sellers cut their prices
      (15% under), and a bid you make is answered there and then -- yes, or what they want (a counter to meet before
      the window shuts) -- with no Monday left to wait for. TO THE MARKET goes straight there.
    - **A youngster on a buyback clause** (v105): now and then in a window (about one week in five of pre-season
      and the winter break, one in sixteen of the league's first half) a bigger club -- a league or more above yours;
      in the Premium League, one of its top five -- offers you a youngster it has no use for yet: 21 or under, out of
      its nine, too raw for its first team or not doing it there, no worse than your weakest in his part of the side
      less two, with more to come, at a fee you can find. A fifth under their price, on a buyback clause: at the start
      of either window, to the end of next season, they can have him back for twice what you paid -- and they will if
      he's come on (four points or more, and within five of their league's level): he goes, the money comes in, and
      the papers say so. If they never do, the clause runs out and he's all yours. SIGN HIM (on the seasons you set),
      NO THANKS or LATER; the clause is on the DEAL side of his card (BUYBACK: who, for what, till when).
  - **Popularity** (v105). Every man has one, 1 to 99, on his card under his position: how much the fans think of
    him. It comes of how good he is against his league (2.5 a point either side of its level), his season (1.5 a
    goal to 15, a little for assists and, for a keeper or a defender, clean sheets; his form: his average rating,
    from three games, up to 12 for 7.5), his years at the club (3 a season, to 12), the armband (5), coming up
    through your academy (6), being a bright young thing (4: 21 or under and near the league's level), and his
    honours (to 30: the hometown hero comes with 15, the wonderkid with 8, a Player of the Month adds 5 and of the
    Year 10, the manager's praise a little; a fifth of it fades each summer). A man of yours goes a fifth of the way
    to that each Monday, and an honour lifts him at once too (the Player of the Month 10, of the Year 20; "He's the
    best I've worked with." at a press conference 3, "He can do a lot better." 2 off; a goal in a derby 1.5, 3 in a
    win). A new man starts eight under it: he has to win the fans over (the hometown hero needn't). Anyone else's is
    what it comes to at his club.
    - **Your three most popular** bring people through the gate -- from 40 between them, 1% more for every 3
      points, up to 20% (the books say so: "Your stars' draw") -- and sell the shirts (see **Shirt sales**).
  - **His story.**
    - **Potential is never a number**, not even your own men's: on their cards and in the lists it's a range round
      it, the same every time you look -- 12 points wide with no coaches, down to 4 with a coach rated 10 (your best;
      the academy's lads by its youth coach) -- and another club's man's by how well he's scouted (?, the league he
      could reach, 10 wide, 6 wide). The wonderkid's ceiling comes as a range too.
    - **His career** is his card's third side: his seasons, the latest first (this one so far, then the last three on
      record: season and league, club, games, goals, assists, average rating), his last two moments, and for your own
      man his games and goals for you. A season goes on record for every man who's played for you, and for anyone
      who's won something; the moments are his debut, his first goal, his 50, 100, 200 games and 25, 50, 100 goals
      for you, joining, leaving, being released, coming up from the academy, the armband, promotion, a title or a cup,
      an award.
    - **The season's awards**, in the review and the news: your league's Player of the Year (the best average, from
      ten games rated; v104, its Player of the Season before), its best young player (21 or under), the Golden Boot
      (its top scorer, assists then rating to split a tie) and the Golden Glove (v110: the keeper with the most clean
      sheets, from ten games), and your own Player of the Year (from five). The league's Player of the Year one of
      yours: the league pays the club four times the month's prize ($10,000 in League 2, up to $160,000 in the Premium
      League), the fans love it (8% more of the league's usual following) and he's lifted -- in the review, the news
      and the next Monday papers. The Golden Boot or Glove one of yours: twice the month's prize ($5,000 in League 2),
      4% more fans, a lift; either way the winners are famous for it, and on the summer's first paper (THE LEAGUE).
      Any of these honours counts as a fine season when a man asks for a new deal.
    - **The club's records** (the Clubhouse's Club tab, CLUB RECORDS): the most games and goals for the club, the
      youngest to play and to score, the biggest win, the record signing and sale. They're kept from your first
      season; from your second the news says when one goes (in the first, every debut would be one).
  - **The staff and training focus.**
    - **Five coaches, a post for each from the start**, so it's never a choice of which -- only who's the best you
      can get for each. Each develops one field: **fitness** (speed, acceleration, agility, stamina, strength),
      **technical** (ball control, dribbling, passing, crossing, curve), **finishing** (shot accuracy and power, long
      shots, heading, Off IQ, composure), **defending** (tackling, sliding, interceptions, Def IQ) and
      **goalkeeping** (reflexes, reach, diving, handling, distribution, a keeper's speed). The Training building's **Staff**
      tab has a line for each post (vacant till filled) and two men to hire for each, new ones every four weeks.
    - **The academy's youth coach** is the academy's, never the first team's: its **Coach** tab, a post of his own,
      two men to hire every four weeks. He's good and poor at whole fields of his lads' game (fitness, technical,
      finishing, defending, keeping), by his rating the same way as the first team's coaches; he trains the academy
      0.04 a point (a field he's good at half as well again, one he's poor at not at all) on top of its level's 0.6 +
      0.1 a level.
    - **A coach** is rated 1 to 10 in half points; the better he is the more he costs (about $50 a week for a 1,
      $220 for a 5, $1,400 for a 10), and the best won't come to a small club (above 4 + 1.5 a league up: 5.5 in
      League 2, 10 in the Premium League). Hiring needs the post empty (release the man in it first) and four
      weeks' wages in the budget; releasing one pays him four weeks. Their wages go on the weekly bill.
    - **What he's good and poor at**: each is strong in some of his field and weak in some of it, by his rating --
      up to 3, two weak spots and nothing special; 4, one weak spot; 5, one of each; 6, one strength; 7 and 8, two
      strengths; 9 and 10, three and no weak spot. His card says which (GOOD AT, POOR AT).
    - **What they do**: your training of each attribute is the pitch's (0.58 + 0.07 a level: 0.65 at level 1, 0.86
      at 4) and its coach's: 0.04 a point above 1 on each attribute of his field, a strength half as well again, a
      weak spot not at all (1.3 at most). A level-1 pitch and no coaches trains as it always did, and a coach never
      makes it worse. A finishing coach rated 8 at a level-4 pitch: 1.14 for shooting, Off IQ and composure, 1.28 for
      his two strengths, 0.86 for everything else. Coaches develop players and nothing else: stamina on the day and injuries are the physio's (see
      **Injuries** and **The campus**). A computer club trains by its league, as before.
    - **A man's FOCUS** (RATINGS side of his card, a tap a step: BALANCED, FITNESS, TECHNICAL, FINISHING, DEFENDING;
      a keeper's BALANCED, FITNESS, KEEPING) puts his training on one coach's field: a quarter more there, a tenth
      less on the rest. His card's season facts make room for it: ASSISTS · CS for a defender or keeper, RATING ·
      FORM beside FOCUS.
    - **A career saved before**: its tactics coach becomes the defending coach, every coach gets what he's good and
      poor at, the men to hire are made again, and a focus on PHYSICAL becomes FITNESS (on MENTAL, BALANCED).
  - **The cups.** League 2's clubs play only the league. League 1 and up play the **Coco Cup** (the league clubs' cup:
    the 42 clubs of League 1, the Championship and the Premium League), the Championship and up the **Fashion Cup**
    too (their 28), and the Premium League's top six play the next season's **Champions League** (the first season,
    its six best), with ten clubs from abroad (made up, around the Premium League's best, a new squad each season).
    - **Every round is on a Wednesday**, in the league week its calendar says: the Champions League's six group games
      in weeks 4, 6, 8, 10, 12 and 14, its quarter-finals, semi-finals and final in 18, 21 and 26; the Coco Cup's six
      rounds in weeks 5, 9, 13, 15, 19 and 22; the Fashion Cup's five in 7, 11, 17, 20 and 24 -- none in the league's
      first three weeks. A cup game is the week's first matchday on the hub (COCO R32, CL G1 and so on) when you're in
      that Wednesday's round; one you're not in is played on the way to Saturday.
    - **A tie is one game** at the home side's ground (the draw says who's at home), penalties if it's level. The
      Coco Cup's first round is ten ties, its 22 best clubs through on a bye; the Fashion Cup's twelve, with four
      byes. The Champions League draws four groups of four from four pots by strength; each plays the others home
      and away, and each group's winners are at home in the quarter-finals to another group's runners-up.
    - **The money**: the gate (or the away share) and a television bump for each game, and prize money for each round
      won -- the Coco Cup $5,000 for the first up to $200,000 for the final, the Fashion Cup $20,000 up to $500,000;
      the Champions League $300,000 to be in it, $40,000 a group game won, $200,000 for getting through, then
      $350,000, $500,000 and $1.5m. No week's wages or partners' money: those are the league week's. The cup games
      count as appearances; their goals aren't the league's.
    - **Where to see them**: the Clubhouse's Fixtures tab says how far you are in each, your Champions League group's
      table, and has your cup ties among the league's games; the match report, the season review and the news too.
      A career from before the cups has none that season: they start with its next.
  - **Your phone rings on the first day of pre-season (v83)**, the window's first day: it's the chairman -- from now
    on transfers go through it (agents, other clubs, free agents) -- and TRANSFERS opens in the menu (ANSWER, then GOT
    IT). The transfer market is never bought. (It used to ring after your second game.)
  - **Two men come to you in your first season.** After matchday 2 (once you've taken the call) a veteran comes home: a man of 33 to 35, rated
    70 to 79, once of a Premium League club, who'll play for the club he grew up with on under a third of his wage,
    to the end of next season. He came home to play, not for the money: he never asks for a new deal, however well
    he does, and a new one keeps him on what he's on (v109). Where he plays and how are the luck of the draw, but
    he's never a keeper (v109). After matchday 5 a wonderkid asks to join: 16, rated 60 to 69, with a ceiling of 85 to 90 (the card gives it as a
    range six wide). You pick where he plays and his style (the card says what each style does), and he signs for
    half his wage, to the end of the season after next -- and waits his first season before he asks for more (v109).
    Both go straight into your squad, even a full one; a card on the hub tells you, and so does the news.
  - **Finding a man (v116).** The market's Search tab lists a league's men (◀ ▶ for another league), filtered and
    sorted by drop-downs whose options take the list's place while one's open: POSITION (his own: GK, CB, FB, DM, CM,
    AM, WM, WNG, STK -- v127: DM and AM again; from v118 to v126 a CM was both), TYPE (his archetype -- a position's own once one's picked, the
    commonest first, and picking one picks its position; with every position, all 31 of them, open across the whole
    screen), SORT (RATING, POTENTIAL as your scouts know it -- the list shows it then, a man they haven't looked at
    closely a ? and last -- PRICE ▲ cheapest first, PRICE ▼ dearest first, AGE ▲ youngest first, AGE ▼ oldest first:
    v117), and IN BUDGET, only the men you could pay for. The Free agents tab has POSITION, TYPE and SORT too (v117),
    its price the wage he'd ask (WAGE ▲, WAGE ▼); the two tabs share what you've picked. (Before v116: the league and
    ALL, GK, DEF, MID or ATT, by rating -- and Free agents just ALL, GK, DEF, MID or ATT until v117.)
  - **The transfer window** is open from the first week of pre-season to the end of the winter break -- the first
    half of the season with it -- and shut for the second half. While it's open you can bid for anyone at another
    club (see **Bids** and **What a club asks**). Once a fee's agreed you agree his contract: 1 to 4 seasons at the
    wage he asks, which isn't up for haggling (see **Wages**). A man rated two leagues above yours won't come. Put a man on the transfer list at your price
    (the market's Selling tab) and clubs bid for him -- most in pre-season and the winter break, now and then in the
    weeks between (now and then they bid for your best men anyway); a bid stands for two weeks; accept or reject. Free agents sign any time, with no fee to a club (see **Free agents**). In the red you
    can't buy or sign anyone until you're back in the black, but selling still works. All of it needs you on the
    transfer market first: your phone, which rings on the first day of pre-season (see above); till then nobody's
    bought, sold or signed, and nobody bids for your men.
  - **Bids (v83)** aren't a yes or no on the spot. A bid a quarter or more over the club's asking price they take
    there and then. Over it, as often as not, though they may sit on it to see who else comes in. From 85% of it
    up, they make you wait while they hear the other offers, and answer on Monday:
    - **yes**, if they like yours (always, if it's over their price and nobody's bid more);
    - **the price they want**, if it isn't enough;
    - **more, with another club in for him**, who's bid more than you. Another club is likelier to come in for a
      young man (23 and under) and one a bigger league would want. Match their price (the other club's bid and 5%)
      inside the week and he's yours; leave it, and he goes to them.

    Under 85% they turn it down at once and say roughly what it would take. A counter stands a week: meet it (MEET
    IT) and he's yours; WALK AWAY to drop it; or haggle. An agreed fee stands until the window shuts. On his card:
    AGREED (sign him), YOUR BID (they answer on Monday), THEY WANT (and whether another club's in). The window
    shutting ends them all.
    - **Haggling (v116).** Their figure isn't take it or leave it. COUNTER -- on his card, or on their paper on
      Monday -- with a fee between your last bid and their figure (− / +, a fortieth of it at a time; it starts
      halfway), and they answer there and then: at or over what they'd settle for and he's yours; short of it, they
      come down part of the way to you (a third to a half of the gap). What they'd settle for is 86% to 96% of their
      figure, the greedier the club the less it gives; with another club in for him, never under that club's bid.
      They'll come down three times at most -- the third, or reaching what they'd settle for, is their last word, and
      after it only MEET IT or WALK AWAY. A counter no higher than you bid before moves nothing. (Before v116 you met
      their figure or walked away; a lower bid meant waiting for Monday again.)
  - **Your bids, and your budget (v108).** The top line of every transfers tab has your budget (and, once a fee's
    agreed, what's agreed and not yet paid) beside the window. The Bids tab has every bid you've placed: those out
    now -- waiting on Monday, agreed (sign him), or a price they've come back with (MEET IT and WALK AWAY right
    there) with HIS CARD -- then how each one went, the newest first: SIGNED (and for what), TURNED DOWN (and what
    they'd want), YOU WALKED AWAY, WENT ELSEWHERE (who, for what), THEY GAVE UP WAITING, HE MOVED ON, THE WINDOW
    SHUT; and the season's count, how many signed and what they cost. (Until v108 your live bids sat at the top of
    the Offers tab and went from sight once they were over.)
  - **What a club asks (v83)**: each club prices its own men, no two quite alike.
    - **His position (v116; v119 more so)**, as the real market has it: goals cost the most. A striker asks 80% more
      than a midfielder of the same rating and age, a winger 60% more, a defender a quarter less, a keeper half -- a
      25-year-old rated 66 in League 2 about $79,000 as a striker, $70,000 on the wing, $44,000 in midfield, $33,000 at
      centre-back, $22,000 in goal. What he's worth to you (his VALUE) goes the same way. (v116's was an attacker 30%
      over a midfielder, a defender a fifth under and a keeper a third: about one rating point's worth -- a point is a
      third on a man's price -- so a striker a point below a midfielder, or at a club pricing him a little low, cost the
      same or less, and strikers looked cheap. Now the cheapest strikers in the world, for their rating and age, ask
      more than the dearest midfielders.)
    - **His rating and his age**: the younger the dearer. A man rated 60 asks about 2.4 times as much at 19 as at 29,
      four times as much as at 33.
    - **His potential, as far as the club's scouts can see it.** Each club has its own scouts, better as a rule the
      higher its league, with plenty either way. A club with poor scouts prices a man on what he is now, whatever he
      might become; one with good scouts prices what he could be too. A 19-year-old rated 60 with a ceiling of 85
      asks about the same as one with a ceiling of 60 at a club with no eye for it, and over twice as much at one
      with the best.
    - **Its temperament**: 0.85 to 1.25 times the rest, its own. More for one of its first nine, less in the last
      season of his deal.
    - **A small club is nobody's fool.** A man in fine form (7.2 and up) gets noticed, as a good scout would see him.
      Two bids or more over its price for him -- yours, or another club's -- and it knows it has a gem: it sees all
      of his potential, and asks more than the best of them. What it's heard is forgotten when the window shuts.
  - **Wages (v83)** are set by how good a man is when he signs (the wage a man of his rating earns), not haggled
    over, and they stay put. They climb with his rating faster from v120 -- a 52 (League 2's run of the mill) earns
    $110 a week (it was $90), a 60 $280 ($190), a 68 $770 ($420), a 79 $3,020 ($1,200): about a fifth more for League
    2's men, half again for League 1's, twice for the Championship's, two and a half times for the Premium League's,
    as ticket money grows far faster up the leagues than the old wages did. A save from before v120 puts every man's
    wage up the same way, in the world as well as your squad. A man who's come on a lot -- worth 30% more than he's paid, with more than this season
    left on his deal -- asks for a new one: WANTS A NEW DEAL on the squad list, HE WANTS A NEW DEAL on his card, and
    the news says so. GIVE IT HIM (his new wage from now, the deal no shorter than the one he's on), or NOT NOW: that
    stings, a point off his mood, and he asks again in eight weeks. Leave him waiting, and every three weeks it costs
    him a point: twice, and then he stops asking (he won't forget it) and asks again eight weeks on.
    - **Who asks, when, and for what (v109)** is his age and his season. The young are modest: a man of 22 or under
      doesn't ask in his first season with you (the wonderkid signs for half his wage, and waits his turn); a man of
      20 or under asks only once what he could get is 60% over his wage (at 21 and 22, 45%), and asks for 12% under
      it (6%), though never for less than he's on -- "would like a new deal". A man in his prime (24 to 29) knows his
      worth: he asks once it's 20% over, and for 5% more than it -- "knows what he's worth now". A fine season brings
      it on sooner still and dearer: up to 15 points off when he asks and 15% on what he asks for -- "has had a fine
      season". A fine season is measured against what's usual for his place in the side, about the best one in seven
      in his league: goals and half his assists (a forward 14, the most at 19; a midfielder 11; a defender 4.5), a
      keeper's or defender's clean sheets (9), or a Player of the Month or Year. This season's counts, and early in a
      new season so does last season's, fading over the first fifteen games. Ratings don't come into it: a game you
      play rates a man by what he did in it, a simulated one by a rougher sum, and they come out differently. At 23,
      and from 30 on, it's as it was: 30% over, for what he'd get. A new deal you offer him yourself is on the same
      terms. (A man in his prime after a great season can ask once he's worth just 5% over his wage, for a fifth more
      than it; a lad of 20 waits till he's worth 60% more, and asks for less than he could get.) Two seasons
      simulated from a new career, four careers each: in v108 the veteran asked in every one, for 3.6 to 4.2 times his
      wage, and none to two others did; in v109 he never does, and one or two men ask, all in their prime, for 22% to
      33% more.
    - **Contract talks (v110).** On his card's deal side -- the wage in his new-deal row steps down from his ask with
      − / +, a twentieth of it at a time: AGREE (GIVE IT HIM, if he's asking) at his ask, OFFER under it -- or on his
      paper (OR OFFER, − / +), offer him less than he asks, or a longer deal for less. The least he'd take is his ask
      less his give: 15% at 20 or under, 10% at 21 and 22, 5% for anyone else, a fine season taking up to 3 points off
      it; a Loyal Servant gives 5 more and the Highly Ambitious 3 less; a happy man (7 or more) 3 more, an unhappy one
      (under 4.5) 4 less. A season over two is worth something to him -- 6% at 30 or more, 3% from 23 to 29, 1% at 22
      or under -- and a one-season deal costs that much more. Never under what he's on, when he's worth more. At or
      over the least he'd take, he signs for what you offered (pleased, if less than with his ask). Under it by up to
      8% of his ask, he comes back that week with a figure halfway from it to his ask (HE'LL SIGN FOR, in its own row
      on his card in RELEASE HIM's place that week, and on his paper): MEET IT, or offer again -- and under it a
      second time he's had enough. Further under is an insult. Either way he walks out: a point off his mood, no talk
      of terms for four weeks (NO TALKS on his card, the wage his ask), and if he was asking he stops, as for NOT NOW.
      His ask in full (GIVE IT HIM, AGREE) is always there. NOT NOW sits beside RELEASE HIM, so the card has no more
      rows than before and still fits the smallest phones without paging. The paper says roughly how far he'd go
      ("Young and keen: he might take a little less"; "After a season like his, he won't go far under it").
  - **Contracts.** Every deal runs to the end of a season. Renew it in the clubhouse before it ends, or the player
    leaves as a free agent; since v110 the Monday papers say so first (DEALS RUNNING OUT, above), and LET GO tells a
    man you won't keep him. A new career's men start on deals of one to three seasons, so about a third end with the
    first. Releasing a player pays off half of what's left on his deal.
  - **Squads, as the world is made** (v110): about three men in ten are youngsters of 17 to 22 (it was one in ten),
    the rest 18 to 34, most about 26 -- a new squad of fourteen has two to five of them, rated under what they'll
    become; across the league about three in ten.
  - **Free agents** are mostly old hands past their best. They used to be any age from 18 to 34, up to Premium League
    standard, the best of them kept in the pool from one summer to the next and the young ones growing while they
    waited, all for an ordinary wage.
    - **Who's out there.** Three in four of the men a summer brings are 29 to 35, a point and a half under the
      level they played at for every year past 29; the rest are younger men nobody kept, a little under it and with
      next to nothing left to grow into. Players out of contract, released or let go join them.
    - **No young man with a future is left without a club.** One of 24 or under whose ceiling is 5 or more above him
      is signed by a club at his ceiling's level the day he's free (yours included, if you let his deal run out).
    - **A season without a club** he hardly grows -- little training, no games -- and loses his sharpness and his
      legs (rust: a point or two of his rating in a season, more for an older man); after two seasons without one
      he's out of the game.
    - **What they ask.** From 29, his wage, as from anyone. Younger, he reckons he's worth more than the club that
      let him go did: up to two and a half times his wage at 21 and under, sliding to his wage at 29, and a fee to
      sign of up to twelve weeks of that (TO SIGN on his card), the younger the more. A 60 in League 2 asks $550 a
      week and $6,600 to sign at 21, $390 and $2,300 at 25, and $220 at 29.
  - **Scouting** needs the scouts' house built (see **The campus**). What you know of a man at another club (or a
    free agent) goes in levels, as far as your scouts' house's level:
    - **None**: a rating range, 8 points wide, 6 and then 2 as you grow your scouting network; ? for the rest.
    - **A report** (one scouting, $200 a man in League 2 up to $6,000 in the Premium League, or an assignment: your
      scouts round a league's goalkeepers, defenders, midfielders or forwards): his exact rating and attributes, and
      COULD BE -- the league his potential could take him to (a League 1 player, a Premium League star...).
    - **A second** (SCOUT MORE on his card, a scouts' house at 2 or more): his potential within ten points, and the
      two things about his character that stand out most, a word each -- WORK (a model pro, a hard worker, cuts
      corners), LEARNS (quickly, slowly), BODY (robust, injury-prone), TEMPER (calm, volatile), DRIVE (ambitious,
      content), LOYALTY (loyal, mercenary), GRIT (resilient, fragile), VOICE (a leader, quiet), SETTLES (anywhere,
      slowly); nothing stands out in an ordinary man.
    - **A third** (a scouts' house at 3): his potential within six points, and four things about him.
    - **Playing against him** is half a report a game, up to two (short of a report, his rating's range narrows): your
      league's regulars are known after you've played them twice. A man who's played for you, you know as well as a
      second report when he goes. Each report loses a level when the season ends. The market's lists say SCOUTED (★
      for a second report, ★★ for a third); the Scouting building's Reports tab has every man you've scouted.
  - **Players develop every third week**, not once a year. A man's 26 attributes are his own (saved with him, a
    letter a half point), and his rating is what they rate. Every third week each attribute moves along a hidden
    meter; when it fills he goes up half a point, when it empties he drops half a point. What you see is what plays.
    - **What fills it**: the room under the attribute's ceiling (his potential, shaped round his own strengths: he
      can reach it, never pass it, and growth slows as he gets near), his age, how good his training is (yours by
      the training pitch's level and its coaches, attribute by attribute, and his focus: see THE STAFF AND TRAINING FOCUS; a
      computer club's by its league), how much he plays (his share of his side's games,
      with diminishing returns: half the games is three quarters of the good of all of them), his professionalism,
      how quickly he learns, how much the attribute matters where and how he plays (his role and his style: nobody
      turns into an all-rounder), and his momentum -- a slow drift of good spells and bad. Your academy's youngsters
      grow by its level; a man with no club, hardly at all.
    - **What drains it**: age, by kind of attribute -- his legs (speed, acceleration, agility, stamina, strength)
      grow to 24-26, hold, drop a little from 29 to 32 and more every year after; his touch fades from 31; his
      reading of the game (Off IQ, Def IQ, composure) keeps growing into his thirties and never fades with age -- and
      bad weeks: poor training (a man without a club, or one who barely plays at a poor club) loses his sharpness
      and his legs. Below the best an attribute has ever been, it fills a good deal faster: a man gets back to a
      level he's been at (not his legs, past 29).
    - **His hidden values**, 1 to 10 in half points, are his from the start and never shown: how quickly he learns,
      his professionalism (a professional trains as well every week; the others come and go), and the rest of his
      character, for what's to come. One in sixteen grows late: his touch and his legs keep coming three years
      longer.
    - The dice are his own, the season's and the week's: reload a save and the same weeks come out the same.
    - The season's end grows nobody now: everyone is a year older, and players retire from 34. The season review
      says how far each of yours came. A line in the news every third week says which of your men moved. Once it's
      built, the youth academy takes in 3 to 5 youngsters aged 16 or 17 every summer, the first of them the day it
      opens (more and better as you build up its facilities). Promote them, or they leave at 19.
    - **The world stays the world.** A new man's prime is drawn round his league's level, and the young are made
      short of it by what they have to grow into, so each generation peaks where the one before did. Twenty
      seasons, simulated: each league's best eights stay within about four points of where they began, and the
      number of men rated 85 or more stays between about 5 and 30 (before, the leagues climbed 7 to 11 points and
      85+ men went from about 20 to 140).
  - **The computer clubs** buy from each other and from the free agents while the window's open (most of it in
    pre-season and the winter break, a little in the weeks between), bid for your players, and fill their squads up
    every summer.
    - **Who they pick.** Their best keeper and eight best outfielders on the day, but not always. Up to three men too
      tired for a game (under 90% fit; under 78% in a big one: the Champions League, a cup's last two rounds, the
      playoffs) sit it out for a fresh man not much worse. Their young men (21 and under) get a start now and then in
      the league, and three of them once the league's settled for the club (promotion sure -- in the Premium League a
      Champions League place -- or the top six out of reach with relegation out of reach too: by the last few weeks a
      good few clubs have nothing left to play for). In a cup below its level a club rests its regulars: two leagues
      above the cup's lowest (the Premium League in the Coco Cup), four of its eight are youngsters (or the reserves),
      a league above, one or two. The Champions League, a cup's last two rounds and the playoffs get their best.
      When you play them live, the nine they picked are the nine you face. Each has its own style, with shapes and widths to suit it: a wing side
    plays wide with three up, a counter-attacking side compact, a direct counter deep and compact without the ball.
    The better leagues have more control and gegenpressing sides, the lower ones more direct play and deep counters.
  - **Crests.** Yours is 16 by 18 pixels: a shape (shield, round, classic, block, oval), a pattern in two colours
    (plain, halves, stripes, hoops, sash, quarters, chevron, cross, border, top band) and an emblem in a third
    (none, a ball, a star, a crown, a tower, an anchor, a tree, a bird, a bolt, or the club's first letter), ringed in
    ink (in light, round a dark one). Its colours are the kit's until you pick your own. Every other club's is drawn
    from its name and colours, the same each time. The crests sit beside the short names on the scoreboard, and
    yours by the club's name on the campus and on its clubhouse and academy. Your short name is yours alone: no other club is given it.
  - **Money.** Tickets, the club's partners (local firms: $300 a week in League 2, more in each league
    up), TV, shirt sales, and the ground's boards and sponsors (below). Prize money comes at the end of the season: $12,000 for
    winning League 2, up to $1.5m for the Premium League, less the lower you finish. The broadcast share follows
    your league position, and the partners' money grows when you go up. The ground doesn't. The Stadium's Money tab
    has it all: the gate and the tickets, then the books (the budget, every week of the season, matchdays, the
    season's transfers, the last few weeks). (Until v116 there were concessions too -- food and drink stalls, a
    megastore and a jersey stand, bought on a Concessions tab for a little more from each head at home games; they're
    gone, and a career that had built them got what they cost back.)
    - **Tickets (v108).** The going rate for a seat is $5 in League 2 (v110; $7 in v108), $10 in League 1, $14 in the
      Championship and $20 in the Premium League (it was $3, $5, $8 and $14), and a new career starts on it. With the
      field and bleachers it's one price for the lot. From the big bleachers on, each stand has its own -- the main
      stand (the North) a fifth over the going rate, the South at it, the ends a fifth under (a quarter while they're
      open terraces) -- and seats sold at a premium come with the ground: VIP seats in the main stand (60 with the big
      bleachers, 150 covered, 300 with four stands, 600 in the grand stadium) at four times the going rate, executive
      boxes (twelve of ten seats with four stands, thirty in the grand stadium) at fourteen times, and the members'
      club (800 seats, the grand stadium) at seven. The fans who'd come at the going rate share out over the stands by
      their seats, and each stand thins the dearer it is against its own rate (fuller the cheaper, to its seats -- and
      never past its share of the fans: see **The turnout**); the
      premium seats sell to the money in the town -- about a fifth of them in League 2, all of them in the Premium
      League -- and mind the price more. The fans see the prices too: dearer than the going rate, their loyalty slips
      (more after a defeat); cheaper, it grows. A price you've never touched goes up with the going rate when you're
      promoted; one you've set stays. On the Money tab, each section: its seats and going rate, its price with − and
      +, how full it'll be, how many and what it takes; and BACK TO THE GOING RATE. (There's no longer a rule that the
      price can only go up while the ground's 85% full.) A save from before v108 left at the old going rate moves to
      the new one. In money: a first season in League 2 now ends with $140,000 to $172,000 in the bank, against
      $84,000 to $87,000 on v107 (three simulated seasons each). (v120's turnout and wages: see below.)
    - **The turnout (v120).** The club's fans are everyone who'd ever come: the most a game can bring, not who
      comes. A league game at the going rate brings about seven in ten of them -- up to a tenth more top of the league,
      a tenth fewer bottom (the table counts in full five games in; before a ball's kicked it doesn't) -- and a big
      game more: a cup tie 8% more, a playoff 15%, a side better than yours up to 15% (one rated ten points over you).
      A derby brings every one. Your stars' draw comes on top (see **Popularity**), and cheap tickets fill a stand
      only up to its share of the fans. The Money tab's projected attendance says how full the ground will be and
      what share of the fans a league game brings. (Before v120 every fan came to every game, and a popular side or
      cheap seats brought more people than the club had fans: a new career's 1,000 fans filled 1,150 to 1,300 seats.)
      Two simulated seasons from a new career in League 2 (four careers, doing nothing in the market): the first ends
      with $83,000 to $107,000 in the bank (v119: $125,000 to $169,000; v120's wages count in this too), and the second
      adds $82,000 to $95,000 (v119: $114,000 to $148,000).
    - **The money** (v106), back at the club after a match you played, after the press conference: a line at a time,
      each figure counting up -- where the bank stood before the game, what the game brought in (the gate or your
      share of it, the TV, the week's partners, sponsors and boards; a cup's prize), the wages out, and where it
      stands now, as the books have it; and the fans the result brought. The Monday's shirt sales come after, in the
      papers.
    - **Shirt sales** come in at the start of each week, on its Monday (v105: they used to come with a matchday's
      money), every week of the year, pre-season and the winter break too, and the Monday papers say what came in
      (THE CLUB SHOP: the week's sales, the best sellers, the season's shirts so far). Your fans buy the shirt --
      $0.22 a fan a week in League 2, up to $0.36 in the Premium League (a new career's 1,000 fans: about $200 a
      week) -- more the more popular your three most popular men (0.65 and a hundredth of their popularity: from 15%
      less to 60% more; see **Popularity**) and with a happy dressing room (6% a point of the side's mood either side
      of settled). Who sells the most is shared out by popularity, squared.
  - **The ground.** A new career's is a field with two metal bleachers, one down each side, and one board -- bare
    (YOUR AD HERE) -- round the pitch: 1,800 seats. It's built up a level at a time in the Stadium building (its Stands tab), only when you pay, and only as
    far as your clubhouse lets you (see **The campus**):

    | Level | Seats | Boards | Costs | Needs |
    | --- | --- | --- | --- | --- |
    | 1 Field & bleachers | 1,800 | 1 | (where you start) | |
    | 2 Big bleachers, a press box | 4,200 | 3 | $45,000 | the shed |
    | 3 Covered stands, terraces behind the goals | 8,500 | 6 | $140,000 | the cabin |
    | 4 Four stands, floodlights | 16,000 | 10 | $380,000 | the clubhouse |
    | 5 Grand stadium, two tiers | 36,000 | 16 | $1,200,000 | the hall |

    Promotion builds nothing: a bigger league brings more fans (and a sold-out ground lets you put the price up),
    not more seats. The stands change to match in the match itself (the far one; see the pitch above), and the
    Stands tab shows that stand as it is and as the next level would build it, with your boards and names on. The
    building's door reads the ground's name.
    - **Sponsors** (v103) come to you: nobody's heard of a new club. It starts with its one board bare and no
      offers; they come in the Monday papers, a firm calling about a free place now and then (the longer it's been
      free, the likelier -- a new club's first call usually comes in its first few weeks), two at most in a week,
      each offer standing two weeks. Who calls is the club's size -- its league most of all, then its fans against
      what its league's clubs have, its ground and where it stands in the table: first the businesses round the
      corner (a coffee shop, the tyre place, the bakery, the barber's: $15 to $40 a week for a board, to the end of
      the season), then the town's firms (car dealers, builders, solicitors) a league up, regional companies, national
      companies, and global brands at the top with a grand stadium -- each size paying more (a board $40 to $110
      a week from a town firm, up to $950 to $2,600 from a global brand; the shirt $60 to $160 from a local business,
      $8,000 to $20,000 from a global brand), now and then a bigger firm taking a punt or a smaller one calling.
      Where they can go: boards, as many as the ground's level has (1, 3, 6, 10, 16), never bought, bare till
      someone takes them (YOUR AD HERE on the far stand); the shirt once you've moved into the cabin (clubhouse 2;
      v108 -- it was from your second season); the stands' names once there are covered stands (level 3: the North and South
      Stands, the East and West Ends); the ground's name once there are four (level 4; never a corner shop's). A
      deal holds its fee wherever you go, and ends when its seasons are up (the news says so, the name goes back,
      the board comes down, and the Monday papers say so too). The Sponsors tab in the Stadium shows each board and
      place, who has it, the offers waiting (SIGN, NO) and who's calling now; the advertisers' names go on the boards
      along the far touchline, the shirt sponsor's colours on the kit (a patch on the chest), the ground's name and
      the North Stand's on the far stand and over the kick-off. The club's partners still pay their share every week,
      as before. (On a new club's first season this is about $25,000 less than signing everything there was on the
      first day used to bring; a first season still ends well in the black.)
    - **A sponsor's bonus** (the shirt's, the ground's and a stand's, from a town firm up), paid at the season's end
      for hitting its target in the league -- one to three tiers, the
      highest reached paying, a harder one more (one tier: 8 weeks of its fee; two: 4 and 10; three: 3, 7 and 12).
      A shirt sponsor asks for a finish (top 10, top 6, top 2) or wins (9, 12, 15); the ground's for full crowds (the
      season's home games, 55%, 75% or 95% of the seats on average); a stand's for goals (35, 42, 48), clean sheets
      (6, 8, 10) or crowds. (A typical season is 10 wins, 36 goals, 6 clean sheets; the champions', 16, 48, 10.) Each
      offer shows its bonus (BONUS · top 10 +$990 · top 6 +$2.3K · top 2 +$4.0K), each deal where you stand as the
      season goes, the season's review the bonuses paid (SPONSORS' BONUSES), and the news. The base is about 15%
      under what a deal paid before bonuses came in: a middling season comes out about even, a good one ahead.
    - **Away**, a club's ground is about as big as its league's tend to be, every board let, now and then a
      sponsor's name on it; its shirt may carry a sponsor too.
    - A save from before gets the level that seats as many as it had (6,000 seats: covered stands, 8,500); one from
      before v103 keeps as many of its boards as the ground has now, each paying what it did to its season's end.
  - **The campus** is the hub: the club from above, in the tilesets' tiles (see **The campus** under Sprites), all
    lawn. The stadium runs along the top and off it: drawn as big as a stadium is beside a clubhouse, so what shows is
    its outside -- the fence and the back of a bleacher at level 1, up to the bowl's two tiers at 5 -- with the pitch
    over it while it's low enough to see over. The clubhouse is in the middle, the training pitch to its left, the
    physio's clinic to its right, the scouts' house and the academy under them, each on a roped-off plot till it's
    up. No paths, and no trees but the ones you buy.
    - **The clubhouse** is the club's keep, as a town hall is in a building game: a new career has the shed, the
      stadium and a rough training pitch, and each clubhouse after it -- for the money alone (v108: it used to need
      the next league up first) -- lets you put up more and build up what you have:

      | Clubhouse | Costs | Brings |
      | --- | --- | --- |
      | 1 The shed | (where you start) | the training pitch; the stadium to level 2 |
      | 2 The cabin | $30,000 | the scouts' house and the physio (to 2); the training pitch to 2; the stadium to 3; the shirt open to sponsors |
      | 3 The clubhouse | $120,000 | the youth academy, decorations; the scouts', training pitch and physio to 3; the stadium to 4 |
      | 4 The hall | $450,000 | the academy to 2 and 3, the training pitch and physio to 4; the stadium to 5 |

      Its screen: the next clubhouse and what it brings, then your career (your record, season by season); the
      squad and their contracts (a new deal, releasing a man); the news; the league (all four tables, the top
      scorers); the fixtures (yours, then every result). Your crest is on each clubhouse, your three letters on the
      cabin's board and the hall's sign.
    - **The buildings**, a level at a time (level 1 is putting it up), each level waiting for its clubhouse:

      | Building | 1 | 2 | 3 | 4 |
      | --- | --- | --- | --- | --- |
      | Training pitch | (where you start) | $10,000 | $40,000 | $120,000 |
      | Physio | $5,000 | $15,000 | $45,000 | $130,000 |
      | Scouts' house | $12,000 | $15,000 | $60,000 | |
      | Youth academy | $25,000 | $25,000 | $120,000 | |

      - **The training pitch** is where the tactics are made (shape, width, style, instructions, who plays and who's
        taken: its Tactics and Selection tabs), and its
        level is what shapes and styles your side can have: at 1 the 3-3-2, 4-2-2 and 3-2-3 and the balanced and direct
        styles; 2 adds the 3-4-1, 4-3-1 and 3-1-2-2, wing play and fluid counter; 3 the 4-1-3, 4-1-2-1 and 3-2-1-2,
        control possession and direct counter; 4 the 3-1-3-1, 3-2-2-1 and gegenpress (v127: the four-line shapes from
        level 2, those with a DM's or an AM's spot from 3). The rest are on the menus, locked, each with the
        level it needs -- in a match's tactics too. Width is always yours, and so are the team instructions (v112), from
        the first day (before them every player instruction was, from v106; before that they came with the levels).
      - **The transfer market** is your phone, not a building on the campus, and not bought: it rings on the first
        day of pre-season, and from then TRANSFERS in the menu, straight in. Till then it's locked in the menu.
      - **The physio** is stamina on match day and injuries. Match day: through a game their legs go 8% slower a level
        (32% at 4); at half-time they get back half of the legs they've lost without one, 60% at level 1, 70% at 2,
        78% at 3 and 85% at 4 (v121; it was a quarter, up to 65%); between games they get fit again sooner (see **Fitness**): 4.5% a day without one, 5.2% at level 1
        up to 7.5% at 4; in a simulated game it's worth 0.4 a level on your side's rating. Injuries: each level is a
        point more durability for every man (fewer and lighter: half as many with the best), 10% sooner back, and 4%
        fitter on his return (see **Injuries**). Its screen says all of it, level by level.
      - **The scouts' house** is scouting (see **Scouting**): its level is the network's.
      - **The youth academy**: its first intake the day it opens, then one every summer; its level is its facilities'.
    - **Decorations** come with the clubhouse (level 3): DECORATE, at the campus's top, sells thirty -- thirteen
      trees; flowers, a flower bed, pots, pumpkins, a scarecrow, a haystack and a beehive for a garden; a lamp post,
      benches, a bin, a bike rack, the copper maple leaf and the team bus for a plaza -- from $150 to $12,000, one at
      a time. A bought one goes over the campus to put down: drag it where you want it (green where it can go; red
      on a building, a plot, the stadium or another decoration) and ✓ PUT IT HERE pays for it (✕ or `Esc` leaves
      it). MOVE picks one up again (tap it, drag it, ✓), or PUT AWAY puts it in store, to put out again (PUT ONE OUT,
      in the shop) for nothing. One in the way of a building as it goes up or grows goes into store by itself.
      They're for looks only.
    - The buildings are listed down the left (the right, if Settings says so): Clubhouse, Training, Stadium,
      Transfers, Physio, Scouting, Academy -- one to buy with its price, one not open yet with a lock and the
      clubhouse it needs, a badge where something's waiting (bids for your men in a window, the academy's
      youngsters). The week's button is at the foot: FORWARD TO MATCHDAY (or NEXT WEEK) on a Monday, SIMULATE and PLAY
      on a matchday's morning. The week and its day, the next match, the budget, the fans
      and the week's net run along the campus's own foot, put shorter where there's less room.
    - Tap a building, in the list or on the campus: its button lights, the camera goes in on it with its name over
      it, and you're in. ◀ CAMPUS takes the camera back out. One to buy says what it's for, what it costs and what
      you've got (BUILD IT); one not open yet, what it's for and the clubhouse it needs.
    - **The day's end.** When the week moves on (FORWARD TO MATCHDAY, NEXT WEEK) the sun goes down behind your
      stadium as it stands, the stars come out, the moon comes up and goes down, and the sun comes up again, the new
      day written over it (WEEK 5 OF 26 · SATURDAY): three seconds, the menu waiting. A tap (or `Esc`) ends it; a player whose system asks for less motion
      doesn't see it.
    - It's drawn as the club is: the stadium at its level with its name on it (on the gate at levels 1 and 2, a board
      on the stand's roof at 3 and 4, big letters on the bowl at 5), the clubhouse at its level, each building or its
      plot, the decorations where you put them.
    - On a phone it's at 1x, cut to its middle where there's less room (the clubhouse in the middle, the stadium along
      the top quarter); a bigger screen shows more lawn round it.
    - A career saved before the clubhouse came in is as built up as it was: the hall, the training pitch at 4, on the
      transfer market, its scouting and academy as they were (no physio yet). One from the last version that had only
      begun building starts in the shed, keeping what it built, with its plants' money back.
  - Careers save to three slots (`ft_mgr_slot1` to `3` in `localStorage`). Careers from the old player-manager
    mode (`ft_save_*`) aren't carried over.

Drills and the labs still lock you to one player. The Trap Lab code is still in the file but has no menu entry. Everything else is unchanged, including the
AI and the stats. Changes to `index.html` aren't carried over to `classic.html` automatically.

## Controls

**Desktop**

| Key | Action |
| --- | --- |
| `WASD` | Move (double-tap a direction to sprint) |
| `J` | Call for the ball / pass (hold for a longer ball) · head-clear an incoming cross · your keeper with it in his hands: you're on him, and it's thrown to the man you aim at (`J` `J`: overarm) -- a goal kick, kicked (Football Classic: see **Your keeper with it in his hands**); with it at his feet, a pass like anyone's (**The keeper and the rules**) |
| `J` `J` (double-tap) | **Lofted pass**: up over everyone and down at the receiver's feet, checking up where it lands |
| `K` | Shoot (hold to wind up: while you do, a defender who was behind you can't take it off you) / header / command a teammate to shoot · standing tackle · your keeper with it in his hands: his long ball, as `L` (v115) |
| `K` + `↑`/`↓` (hold) | Curl the shot |
| `L` (hold) | Cross — or, without the ball, request a cross from a wide teammate, or slide in when they have it. (Football Classic: the longer you hold it, the further the man it's for, nearest first; `L` `L` double-tap: a low driven cross. See **Your cross picks its man**. Only from 24 m out from their byline or nearer: further out it does nothing, yours or a team-mate's. See **Crosses come from 24 m out at most**.) |
| `L` in your own half | **Clear** it instead: with the ball, hold it to charge (the blue meter round your man fills in 0.6 s) and it goes as you let go -- a tap a short way and low, held full high and long; a loose ball is struck first time the moment it reaches your reach ring, no trap needed (press as it comes, or hold it for up to two seconds); one dropping over your head, you jump and head it away. The stick picks the direction if it points upfield, otherwise it goes up and out toward your touchline. Your keeper's -- in his hands or at his feet -- is his long ball, a long pass pinged to the man you aim at (the button reads LONG; v115) |
| `SPACE` | Trap: press a hair before the ball reaches your reach ring (leave it and it runs past) |
| `V` | Toggle the pixel-art players / plain vector players |

**Touch**

Drag on the left half to move. **Push the stick out past its ring to sprint** (the ring lights up
orange) and ease back inside it to stop, without ever lifting your thumb; push on out and the
stick follows your thumb, so you can't run off its edge. A double-tap on the left half still
sprints too. The big right-hand button is
context-sensitive — TRAP / CALL / PASS depending on the moment. Separate SHOOT / SLIDE
and hold-to-CROSS buttons sit alongside it (Football Classic: hold CROSS longer for a man further across, double-tap it
for a low driven cross); in your own half CROSS reads **CLEAR** and works like `L` there, and in theirs it's dimmed while the ball's more than 24 m from their byline (too far out to cross). Anywhere else on the right half, off the buttons, is TRAP too (Football Classic, in a match: nothing, unless it's a tap on one of your men, which switches to him).

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
it. To a man on a run it's played into his path, where he's already going (the spot he's running to,
or the way he's running), and the drag only leans it: a third of the drag's angle off his line, 15° at
most either side (v81; it was half, and 25°). Drag along his run and it goes dead along it; drag across
it and it leans that way, still in front of him. To a man standing still the drag picks where in front of him it goes, as it used to,
and to one only just moving, something in between (v80). It's weighted so they run onto it as it gets
there, and the receiver sprints for it. The spot it was
played to flashes on the pitch. A through ball is always along the grass: a drag on the second tap of a
double-tap plays the same one (there's no lofted through ball, v81). (A quick tap waits ~0.15 s before it goes, to see whether a second tap is coming;
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
player **you control** from your team's eight outfielders (a striker by default; switching clubs keeps you
in the same position). **KICK OFF** (or `Enter`) starts it; `Esc` or BACK leaves.

- Each side plays in its club colours, and the scoreboard reads the club codes (`ARS 0 : 0 LIV`).
  Your team wears its home kit. The opponent wears theirs too, unless the shirts are too alike to
  tell apart at a glance (brightness counts most, so colour-blind players can tell them apart);
  then it's their change kit, or a plain white or black one if that's no better. The keepers pick a
  top unlike either team's shirts and the grass.
- **Every club has its own shape**, loosely after how it lines up (a back four is three here, a front
  three three), and the setup shows it under the club's name:

  | Shape | Clubs |
  |---|---|
  | 3-3-2 | Bournemouth, Coventry City, Everton, Newcastle United |
  | 3-2-3 | Arsenal, Leeds United, Liverpool |
  | 3-4-1 | Aston Villa, Fulham |
  | 3-1-3-1 | Tottenham Hotspur *(v127; 2-3-3 before)* |
  | 3-2-1-2 | Brighton *(v127; 3-4-1 before)* |
  | 3-1-2-2 | Hull City *(v127; 2-4-2 before)* |
  | 3-2-2-1 | Chelsea *(v127; 3-4-1 before)* |
  | 4-2-2 | Brentford, Nottingham Forest |
  | 4-3-1 | Crystal Palace, Ipswich Town, Manchester United |
  | 4-1-3 | Manchester City |
  | 4-1-2-1 | Sunderland *(v127; 4-3-1 before)* |

  Both sides kick off in their club's shape, and a club's squad is made for it: wingers on the flanks
  of a front three, wide midfielders where its shape has them, a holding or an attacking midfielder in
  a DM's or an AM's spot (v127), full-backs at the ends of a back four (wing-backs with nobody wide
  ahead of them), who go up the flanks with the ball. Change a shape
  in the match and the club keeps it. A club whose line-up you'd saved before clubs had shapes stays in
  the 3-3-2 its 2-3-2 grew into.
- **Nine a side (v124).** Every club's eight from before are the same men, and a ninth joins them: a
  centre-back of its own, in the middle of its back line (the outside centre-backs of a back three that's
  a back four now are full-backs). A side you'd kept from before gets him too, and everyone else keeps his
  spot.
- **Every club has its own way of playing** too -- its style, loosely after how it plays -- shown on the setup
  screen under its shape, and each side plays its own (they all used to play whatever you'd last picked, BALANCED
  unless you'd changed it):

  | Style | Clubs |
  |---|---|
  | CONTROL POSSESSION | Arsenal, Brighton, Ipswich Town, Manchester City |
  | GEGENPRESS | Bournemouth, Liverpool, Newcastle United |
  | WING PLAY | Chelsea, Leeds United, Manchester United, Tottenham Hotspur |
  | DIRECT | Brentford, Everton |
  | FLUID COUNTER | Aston Villa, Sunderland |
  | DIRECT COUNTER | Crystal Palace, Nottingham Forest |
  | BALANCED | Coventry City, Fulham, Hull City |

  Change your club's style or width (before kick-off or in the match) and the club keeps it, as it keeps a shape;
  set it back to the club's own and nothing's kept as a change.
- **TACTICS before kick-off.** Beside KICK OFF on the setup screen, TACTICS sets the match up and waits: its tactics
  screen comes up before kick-off -- your shapes with the ball and without it, width, style, every man's card and the
  team's instructions, the other side's to look at. ◀ CLUBS goes back to the setup screen, KICK OFF ▶ plays it, everyone
  in his spot in the shape you picked. A man off the bench dragged onto one in the team is a change of team there,
  not a sub: the other goes to the bench (and back again if you like), and all three subs are still yours. It's all
  kept with your club, as a change in the match is. KICK OFF on the setup screen still goes straight in.
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
| ⚙ TUNE | `T` | Shot power, accuracy, curve and long shots; the swipe's curl, the flick for full power and the bend for full spin; the keeper's reflexes, reach, diving and handling |

In both labs your player uses the dials (not their own stats), so what you tune is what you
test, and like the Trap Lab the values are the game's settings.

## What's in the engine

- **9v9 match sim** (eight outfielders and a keeper a side, since v124: it was 8v8) with 3D ball physics (loft, curve/spin, bounce), offside, restarts, and possession-aware team
  phases, on a pitch marked like a real one -- penalty areas, six-yard boxes, penalty spots and arcs, the centre
  circle and the corners -- at nine-tenths of the men's size: they're 25 px to the metre, the pitch 22.5. It's
  99.75 m by 71.4 (2244.375 × 1606.5), a twentieth shorter than a full-length one and a twentieth wider than a usual
  one (v125: nine a side was cramped on the 99.75 by 68 before it): it was 2625 × 1700 at 25 px to the metre, then a
  tenth smaller every way (2362.5 × 1530), then a twentieth shorter goal to goal (2244.375 × 1530), then a twentieth
  wider (v125 made it full length too, 105 m, and v126 took that back: it spread the play out). What goes by the
  pitch shrinks with it: its markings, where the men wait in the box for a cross, where the keeper starts coming
  off his line (5 m outside his box) and how far out a cross can be struck from (24 m). What goes by the men
  doesn't: their size and pace, how far they'll shoot and pass from, and the goals, the men's size, so a little
  wider than real ones. The camera is as it was: it always shows the full width, the far touchline under the stand
  and the near one about nineteen-twentieths of the way down the screen (nine-tenths on the narrower pitch; the lawn
  past it below), the men, the ball and the
  goals as big as ever, and it follows play along the length. The far stand's middle -- its name, its boards -- is
  over the halfway line (it was drawn for the first pitch, and sat a little right of halfway).
  - **Smaller still was tried, and taken back.** A tenth smaller again every way (2126.25 × 1377 at 20.25 px to
    the metre, v55; 80 club pairings, each played on both pitches, every man on the computer, 6-minute matches):
    goals 2.56 a match → 3.02, shots 7.3 → 10.0, +0.46 goals a match pairing by pairing (95%: +0.01 to +0.99).
    Then a fifth shorter and a tenth narrower than that (93 1/3 m by 68 at 18.225, v56): 3.66 goals a match, but
    shots 17.2, most of the new ones from 20 m and more, and it played cramped. Then v55's, a twentieth shorter
    (v57). What was kept was v54's pitch with a twentieth off its length (not measured: too small a step to show in
    80 matches), until nine a side made it bigger again (v125).
- **v129: after the break, each man where the tactics screen shows him.** A change on the tactics screen in the second
  half -- a shape, the width, two men swapped -- dealt that side's spots out for the first half's ends, so once the ends
  had changed a left-back went to right-back, a left winger to the right wing, and each man's spot was in the other
  half. Spots dealt out after the break are mirrored with the ends now, as the ones the men already had were. (In a
  test, two men swapped and the width changed after the break: all eight in their spots; before, all eight on the
  wrong flank and in the wrong half.)
- **v128: the computer picks up your runners later.** It was too good at it: a man of yours going in behind was
  picked up a tenth of a second after he went, the defender reading where he was going and getting goal-side of him.
  Now the computer's men, at every level, hold their line 0.7 s before they go with a runner off the ball (a cover CB
  too, who used to go at once), read his run 0.4 as far as they would, and keep 0.4 as far goal-side of him. Your own
  men pick up the computer's runners as before. Computer v computer, 32 exhibition matches each (STAR, three-minute
  halves), your side's runs in behind against the computer's back line:

  | | v127 | v128 |
  | --- | --- | --- |
  | Your runs picked up by one of theirs within 1 s | 64% | 58% |
  | ...the man on him goal-side of him | 45% | 35% |
  | Your runner past every one of theirs 1 s in | 17% | 21% |
  | Passes into your runners that reach him, a match | 6.0 | 6.6 |

  The computer's runs against your back line, alongside: the man on him goal-side 43% and 41%, its runner past
  everyone 20% and 21% -- no change. (Half a second and half the read was tried first: goal-side 38%, past everyone
  19%, passes reaching him 6.25.)
- **v127: eleven shapes, and a holding and an attacking midfielder again.**
  - **The shapes** are 3-3-2, 3-2-3, 3-4-1, 3-1-3-1, 3-2-1-2, 3-1-2-2, 3-2-2-1, 4-2-2, 4-3-1, 4-1-3 and 4-1-2-1. Five
    are in four lines: 3-1-3-1 (a DM, two wide midfielders either side of an AM, a striker), 3-2-1-2 (two central
    midfielders, an AM, two strikers), 3-1-2-2 (a central midfielder, two wide midfielders, two strikers), 3-2-2-1 (two
    DMs, two wide midfielders, a striker) and 4-1-2-1 (a DM, two wide midfielders, a striker). 4-1-3's one in the middle
    stays a central midfielder. 2-4-2 and 2-3-3, two at the back and for attacking only, are gone, so every shape is for
    either phase; a side or career kept in one plays 3-4-1 or 3-2-3, each man in the spot nearest his old one. The
    training pitch: 3-1-2-2 at level 2, 4-1-2-1 and 3-2-1-2 at 3, 3-1-3-1 and 3-2-2-1 at 4.
  - **DM and AM** are positions of their own again (from v118 to v126 both were CMs), and the seven central archetypes
    are sorted among the three: the anchor and the deep creator are DMs; the box-to-box, the playmaker and the
    ball-winner CMs; the shadow striker and the trequartista AMs. Each covers the next one along as a second position --
    an anchor CM (and CB), a deep creator CM, a ball-winner DM, a playmaker AM, a box-to-box DM and AM (and WM), a
    shadow striker CM (and ST), a trequartista CM (and W, ST) -- and none the far end. A ball-playing CB and an inverted
    full-back cover DM now, a libero plays DM (covering CM), and a false nine covers AM. The market's and the
    wonderkid's POSITION have DM and AM.
  - **Two to one to one.** A holding and an attacking midfielder are each half as common as a central one. A man drawn
    on his own is a wide midfielder a quarter of the time and otherwise two CMs to each DM and each AM; a computer club's
    middle three are dealt first for the DM, AM and CM spots its shapes have, then drawn so the world comes out the
    same. Six new careers' worlds: 0.52 DMs and 0.51 AMs to each CM, every club with a man of his own for each such spot
    of its shapes. Your own squad is dealt for the 3-3-2 you start in. A career saved before: an anchor or a deep
    creator is a DM, a shadow striker or a trequartista an AM (labels only).
  - **A back three's outside men** can be centre-backs or full-backs alike: a full-back there is in his own position,
    nothing off his rating or his reading of the game (a full-back rated 70: 70 there, 64 in its middle).
  - **Four lines on the pitch.** With the ball the DM is the pivot (a second DM holds beside him), the AM plays in the
    hole between their lines with the central midfielders a step behind him, and two wide midfielders on their own in a
    line hold the touchlines; without it the deeper midfield line screens halfway between the back line and the
    midfield, and a lone AM stands halfway between the midfield and the forwards. In computer matches: 3-1-3-1's DM
    about 41 m from his own goal with the ball, its AM 60; 3-2-1-2's central midfielders 47, its AM 51.5, its strikers
    64. An AM supporting the man on the ball offers himself level with it or ahead, seldom behind. Both tactics pitches
    draw a four-line shape in four lines.
  - **The clubs.** Tottenham play 3-1-3-1 (2-3-3 before), Brighton 3-2-1-2 and Chelsea 3-2-2-1 (both 3-4-1 before), Hull
    3-1-2-2 (2-4-2) and Sunderland 4-1-2-1 (4-3-1), their squads made for their spots. The career's computer clubs have
    the four-line shapes too: a passing side an AM, a wing side two wide midfielders either side of one, a direct side
    two up front ahead of a CM, a fluid counter two DMs, a direct counter a DM in front of a back four. Of the men a
    computer club picks, 83% are in their own position, 15% in a second and 2% out of it (85%, 12% and 3% before: a DM
    or an AM in a CM's spot is in a second position).
  - Computer v computer, 220 exhibition matches each (STAR, three-minute halves):

    | | v126 | v127 |
    | --- | --- | --- |
    | Goals a match | 1.16 | 1.34 |
    | Shots a match | 5.5 | 5.8 |
    | Shots scored | 21% | 23% |
    | Shots from 20 m or more | 49% | 47% |
    | Men within 10 m of the man on the ball | 2.67 | 2.63 |
    | A man's nearest neighbour | 6.5 m | 6.6 m |

    Scoring's a little up -- 1.34 a match against 1.16, about one and a half standard errors apart, so likely but not
    sure -- and not from the four-line shapes: the 110 matches with one of them in it scored 1.29 a match, the 110
    without 1.38.
- **v126: the old length back, and no five at the back.** v125's full length is taken back: the pitch is 99.75 m
  long again, keeping v125's width (71.4 m). The two shapes with five at the back (5-2-1 and 5-1-2, for defending only)
  are gone: a side sitting deep defends in a back four instead (3-2-3, 4-2-2 and 2-3-3 as 4-3-1, 2-4-2 as 4-2-2), so
  there are eight shapes, none for defending only. A side or career saved defending in one reads it as 4-3-1 or 4-2-2
  (a career's men's defending spots shared out again, each to the nearest), and one from eight a side that defended
  with four at the back (4-2-1, 4-1-2) gets its eighth man in midfield (4-3-1, 4-2-2). The training pitch's levels: 2
  adds the 3-4-1 and 4-3-1, 3 the 4-1-3 and 2-4-2. Scoring isn't back -- computer v computer, 220 exhibition matches
  each (STAR, three-minute halves):

  | | v124 (99.75 by 68) | v125 (105 by 71.4) | v126 (99.75 by 71.4, no five at the back) |
  | --- | --- | --- | --- |
  | Goals a match | 1.17 | 1.10 | 1.16 |
  | Shots a match | 5.5 | 4.4 | 5.5 |
  | Shots scored | 21% | 25% | 21% |
  | Men within 10 m of the man on the ball | 2.76 | 2.57 | 2.67 |
  | A man's nearest neighbour | 6.4 m | 6.7 m | 6.5 m |

  It's nine a side itself: eight a side scored 1.71 a match, from 7.0 shots. A back three's outside centre-backs going
  up with the ball like full-backs was tried too: 1.23 goals a match (120 matches), no clear change, not kept.
- **v125: a bigger pitch for nine a side.** It was a little cramped. The pitch is full length again, 105 m (it was
  99.75, so a twentieth longer), and a twentieth wider than a usual one, 71.4 m (it was 68), which gives nine a side
  the room eight a side had. The camera's as it was: the men as big as ever, the near touchline about nineteen-twentieths
  of the way down the screen (nine-tenths before). Back to the first pitch's width (75.6 m, 1700 px) was tried and
  not kept: 0.98 goals and 3.7 shots a match (60 matches). Computer v computer, 220 exhibition matches each (STAR,
  three-minute halves; the spacing from 40 to 160 of them):

  | | v123 (eight a side, 99.75 by 68) | v124 (nine a side, 99.75 by 68) | v125 (nine a side, 105 by 71.4) |
  | --- | --- | --- | --- |
  | Men within 10 m of the man on the ball | 2.55 | 2.76 | 2.57 |
  | A man's nearest neighbour | 6.6 m | 6.4 m | 6.7 m |
  | Goals a match | 1.71 | 1.17 | 1.10 |
  | Shots a match | 7.0 | 5.5 | 4.4 |
  | Shots scored | 24% | 21% | 25% |
  | Passes a match | 140 | 153 | 152 |
- **v124: nine a side.** Eight outfielders and a keeper a side (it was seven and a keeper). Every shape is one of the
  old ones with a man more at the back -- 3-3-2 (it was 2-3-2), 4-2-2, 3-2-3, 3-4-1, 4-3-1 and 4-1-3, two for attacking
  only (2-3-3 and 2-4-2: two at the back) and two for defending only (5-2-1 and 5-1-2: five) -- and a shape saved before
  is read as its new one. A back three is three centre-backs; a back four or five has a full-back at each end, who goes
  up his flank with the ball as the side's instructions say. Building from the back a back four's centre-backs split as
  a back three's outside men do and its full-backs go higher and wider still; on the keeper's ball the centre-backs are
  at the corners of the box and the full-backs up toward the touchlines (with seven outfielders a back four only ever
  defended). Every exhibition club keeps its eight men and gets a ninth, a centre-back of its own in the middle of its
  back line; the outside centre-backs of a back three that's a back four now are full-backs (City's, Palace's,
  Ipswich's, United's and Sunderland's two). A career squad is fifteen to start (a fifth defender), twenty-one at most
  and thirteen at least, and BEST 9 picks the side. A career, a club's side or the quick match's squads kept from before
  get their eighth outfielder off the bench (the first fit defender there) in the middle of the back line, everyone else
  in his spot. On a phone a five across the back fits the tactics pitch (on the shortest, right to its edges).
  Computer v computer, 120 exhibition matches each (STAR, three-minute halves):

  | | v123 (eight a side) | v124 (nine a side) |
  | --- | --- | --- |
  | Goals a match | 1.70 | 1.19 |
  | Shots a match | 7.0 | 5.8 |
  | Shots scored | 24% | 20% |
  | Goalless matches | 19% | 29% |
  | Passes a match | 139 | 152 |
  | Stamina's ceiling at half-time / full time (20 matches) | 0.74 / 0.65 | 0.76 / 0.67 |

  A new career's wages are up with its fifteenth man: $948 a week to $1,069 for yours, $1,620 to $1,800 for a League 2
  club's (the median; twelve new careers each). Figures from before v124 elsewhere in this README were measured with
  seven outfielders.
- **v123: players tire again -- halfway.** v121 left the sides almost as fresh at half-time as at the kick-off (the
  ceiling under the bar 0.85 on average, 0.82 at full time). A metre flat out now costs a fifth more -- still the same
  whoever runs it, so a Speed 6 man pays what anyone did before v121, the quickest a fifth more, a slow man about a
  quarter less -- and the ceiling wears at 0.0075 a second at that pace (it was 0.0045). League 2 on the computer:
  0.75 at half-time, 0.67 at full time, the bar about 0.78 through a match; v120's were 0.67, 0.47 and 0.65. Half-time
  still gives back half. See **Stamina**.
- **v122: every stat counts in a rating.** The rating's weights go out of 5, and every outfield stat counts at least 1
  for every outfield line (they were 1 to 3, and crossing, curve, a defender's shooting, an attacker's defending and
  more counted for nothing): what his line's game is made of 5, then 4 and 2, the rest 1; a keeper's keeping, and a
  little his feet. The scale stays where it was -- a usual man of each line rates as before at every level, so prices,
  wages and the leagues' levels hold -- and a man moves by how his lesser stats compare: a defender who can shoot a
  little up. Saves are rated again once (most men the same or a point either way). See **Ratings**.
- **v121: stamina.** A side was winded by half-time -- the ceiling under the bar about 0.67 on average, fast
  forwards 0.45 -- and 30% slower by full time. Now a sprint costs by the ground it covers: the quickest man pays
  what he did, a slower one less a second (Speed 2 about a third less than Speed 10), so pace has a price; the
  ceiling wears more slowly, and half-time gives back half of what the half took (it was a quarter; more with a
  physio, up to 85%). The computer paces itself: once a man's ceiling dips under 0.9 he makes only the sprints that
  matter, so it sprints about as much as before rather than spending the legs it's saved. A half on the computer now
  leaves the ceiling about 0.85, the lowest about 0.7. And no slide tackle on an empty bar: one last-ditch slide off
  a sprint, on what's left, then none till a quarter of the bar is back (the computer's men too). See **Stamina**.
- **v120: a crowd is a share of the fans, and wages are up.** The fans are the most a game can bring: a league
  game at the going rate brings about seven in ten of them (more high in the table, fewer low; more for a cup tie, a
  playoff or a better side; every one for a derby), and cheap tickets fill a stand only up to its share of them.
  Before, every fan came to every game, and a popular side or cheap seats brought more people than the club had
  fans. Wages climb faster with a man's rating: about a fifth more for League 2's men, half again for League 1's,
  twice for the Championship's, two and a half times for the Premium League's; saves get the new wages. A first
  season in League 2, doing nothing in the market, ends with $83,000 to $107,000 in the bank (v119: $125,000 to
  $169,000). Also: in contract talks, a man's halfway figure no longer rounds up to his full ask when the least he'd
  take is one step under it (he comes back at the least he'd take). See **The turnout** and **Wages**.
- **v119: attackers are dearer.** A striker asks 80% more than a midfielder of his rating and age (it was 30%), a
  winger 60% more, a defender a quarter less (a fifth), a keeper half (a third under). v116's premium was about one
  rating point's worth, lost among the rest of what goes into a price -- a club's temperament, whether he's one of its
  first eight, what its scouts see in him -- so strikers looked cheap.
- **v118: archetypes say where a man plays, and there are more of them.** 31 archetypes, keepers' too (none before):
  five centre-backs (Stopper, Cover CB, Ball-playing CB, and new: Wide CB, Libero), four full-backs (Full-back,
  Wing-back, and new: Defensive full-back, Inverted full-back), seven central midfielders (Box-to-box, Anchor,
  Playmaker, Deep creator, and new: Ball-winner, Shadow striker, Trequartista -- the Creator's now a Trequartista),
  three wide midfielders (Wide midfielder, Wide runner, and new: Wide playmaker), four wingers (Winger -- the crosser
  now -- Inside forward, and new: Trickster, Inverted winger), six strikers (Poacher, Speedster, Complete forward,
  Target man, and new: Pressing forward, False nine) and four keepers (Shot-stopper, All-rounder, Sweeper keeper,
  One-on-one keeper). Each has the spots it plays and the ones it covers (PLAYS, ALSO on his card) -- the archetype
  says where he can play, not his position -- how common it is in its position, and its habits on the pitch (see
  [Playing styles](#playing-styles)). A holding and an attacking midfielder are one position now, CM (three of a
  squad's four midfielders: more CMs than any other position); the market's POSITION has no DM or AM. A computer
  club's positions are dealt to fit its shapes, as archetypes are choosier than positions were. A trickster has the
  most skill stars of anyone. The exhibition clubs' squads have the new archetypes too. A save from before: a DM or
  AM is a CM, a Creator a Trequartista, and a keeper gets the archetype his keeping leans toward -- labels only, his
  stats as they were.
- **v117: sort by age either way, and the free agents too.** The Search's SORT has AGE ▲ (youngest first) and AGE ▼
  (oldest first); the Free agents tab has the Search's POSITION, TYPE and SORT, its price the wage he'd ask.
- **v116: a career batch, and two fixes.**
  - **Hurt men come off.** One of your eight hurt between games is out of the side there and then, the best fit off
    the bench in his place (the news says who); hurt in a live match, he comes off at once for your planned quick sub
    for him, else the bench's best at his spot (once he's played the ball, if he has it) -- with no subs left he plays
    on, slowed. They used to stay on, slowed, until you subbed them.
  - **Quick subs on the Selection tab** (the Subs tab is gone): its fourth column, tap a man on the pitch and one on
    the bench. INSTRUCTIONS is up in the tactics' top row, left of BEST 8, not on a man's card.
  - **No BUILD-UP instruction**: how a side plays out from the back comes with its style (CONTROL POSSESSION short,
    DIRECT and DIRECT COUNTER long, the rest mixed).
  - **The market**: prices by position (attackers 30% over midfielders, defenders a fifth under, keepers a third);
    haggling over a club's figure (COUNTER: they come down part of the way, three times at most); the Search tab
    filtered and sorted by position, type, rating, potential, price and age, and IN BUDGET.
  - **The player card**: the spots a man plays (PLAYS, ALSO) on every card, and a fourth side, his personality; its
    sides a tab each along its foot (RATINGS, DEAL, CAREER, PERSONALITY), in place of the small DEAL ▶ button under his
    rating. A new DM archetype, the Deep creator. The Stadium's concessions are gone.
  - **The computer's shield no longer spins the ball round him.** A computer man shielding it turned his body -- and
    so the ball, which follows his facing -- straight to wherever he wanted every frame, so the ball swung round him
    with no turn at all; a take-on's cut set the ball's angle outright too. Now his shield turns at the rate yours does
    (by his Off IQ: 2.5 to 8 radians a second) and the cut turns the ball as any turn does. In two computer matches,
    shielding: 85 frames turning faster than a man can, 17 of them outright jumps, before; 5 and none after. The cut:
    none of either after.
  - **A header is the header's goal.** A header or a first-time volley didn't count as a touch of the man who struck
    it, so a goal headed in from a cross could go down as the crosser's (and the cross never as an assist). Every
    deliberate strike now counts as the striker's touch: in a Star-level test nine headed goals of nine went to the
    header, each with the crosser's assist (the build before: seven of seven credited, but no assists; on Normal two
    of four).
- **The keeper's long ball (v115).** His CLEAR isn't a defender's clearance any more: it's a long pass, pinged to the
  man you're aiming at -- the stick picks him as it would a pass, the further on the better, out to 60 m -- on a
  lofted pass's flight, and you go with it. On a touch screen the button reads LONG when you're on him with it.
- **Your keeper with it in his hands (v114).** You're on him the moment he has it -- not left on an outfielder with
  PASS playing it out for you. The stick walks him round his box and aims; PASS throws it to the man you're aiming at
  (`J` `J`: overarm), and you go with it; CLEAR or SHOOT boots it downfield (a long pass to the man you aim at since
  v115) -- and his CLEAR at his feet does too. A
  goal kick the same, kicked. See **Your keeper with it in his hands**.
- **The keeper and the rules (v113).** He used to handle everything. Now his hands are only for his own penalty
  area, and never for a ball a team-mate kicked to him on purpose (a header back is fine); anything else is at his
  feet, and he plays it like anyone -- yours with you on him (the stick, PASS, CLEAR, SHOOT; one of theirs can take
  it off him), the computer's settling it and passing it short, or kicking it long when he's pressed. You can pass
  it back to him. A goal kick is on the ground and kicked, never thrown. See **The keeper and the rules**.
- **Team instructions (v112).** Every man's -- every spot's -- instructions are gone; the side has one set, by its
  lines. Without the ball: the defensive line and the line of engagement, dragged on a little pitch of their own (never
  closer than 14 m), which line stands on the line of engagement (the forwards or the midfield), what the back line does
  (HOLD THE LINE, OFFSIDE TRAP, FOLLOW RUNNERS, PRESS UP), how the back line and the midfield go into a tackle (STAY IN
  FRONT, BALANCED, TACKLE), and what the forwards do (CONSERVE, DEFEND THE LINE, PRESS UP). With it: the BUILD-UP
  (SHORT, MIXED, LONG -- your keeper's ball as well, in place of his PASS), how far the defenders, the midfield and the
  forwards go forward, and what the wide men look for (TO FEET, IN BEHIND). A style picked sets its own; the computer's
  clubs play their style's. Beyond the line of engagement nobody goes and gets it -- unless a man sits on it (3 s
  within 5 m) -- and the ball coming over it springs the block. See **Team instructions**.
- **The computer goes forward (v111).** It kept giving the ball back: forward a little, then back, and back again
  whenever it was pressed. A ball back now costs more than the ground it gives up -- more in the other half, more with
  a man on him there, more straight after a ball forward -- and ground counts for more. Its balls back are down from
  about half its passes to a third (in the other half, from seven in ten to under half); it has about twice the shots
  and more of the goals. See **Going forward** under the computer's man on the ball.
- **Contract talks, deals running out, the Golden Boot and Glove, $5 tickets, more youngsters (v110).** Offer a man
  less than he asks, or a longer deal for less: he signs, comes back with a figure (MEET IT), or walks out -- the young
  give the most, a man after a fine season the least, a longer deal is worth most to the older man (see **Contract
  talks**). A Monday paper of the deals that end with the season, at the winter break and in its last weeks: RENEW,
  LET GO, TALK TERMS. The Golden Boot (the league's top scorer, the old top scorer's award) and the Golden Glove (its
  keeper with the most clean sheets), with a prize when they're yours. League 2's going rate for a seat is $5: a first
  season ends with $106,000 to $146,000 in the bank, against $143,000 to $189,000 at v108's $7 and $84,000 to $87,000
  before (three simulated seasons each). And a new world is about three in ten youngsters of 17 to 22, against one in
  ten.
- **Contracts by age and season (v109).** The hometown hero who came home cheap never asks for a new deal (and a new
  one keeps him on what he's on), and he's never a keeper. Everyone else asks by his age and his season: the young modestly -- not in their
  first season with you, later, and for less than they could get -- a man in his prime sooner and for a bit more, and
  one coming off a fine season (goals, clean sheets or an award, against what's usual for his position) soonest and
  for most. See **Who asks, when, and for what**.
- **Tickets, bids and the clubhouse (v108).** Tickets start at $7 in League 2 (the going rate, $10 to $20 up the
  leagues), and as the ground grows each stand has its own price and there are seats to sell at a premium -- VIP seats,
  executive boxes, the members' club. Your budget is on every transfers tab, and the new Bids tab keeps every bid
  you've placed and how it went. Every clubhouse is for the money alone (no promotion needed), and the cabin opens the
  shirt to sponsors. See **Tickets**, **Your bids, and your budget** and **The clubhouse**.
- **Crosses, clearances and keepers (v107).** A poor crosser comes up short: he hasn't the power to whip one in, so his
  miss on a cross's weight is mostly short (three times in four at Crossing 1), where it used to go as far as a good
  one's and, missing its man, carry on to the far side. Your clearance charges: with the ball at your feet in your own
  half, hold CLEAR and the blue meter fills -- a tap a short way and low, full the whole way and high (headers stay one
  press). And keepers come for fewer crosses: a little on every count -- it has to come down more, he reads it longer,
  he's slower off his line, he gets a hand to it less far, and only a ball dropping in his six-yard box is his -- so
  more crosses are headed, at both ends. See **A poor crosser comes up short**, **Your clearance, charged** and **He
  comes for the ones that are his**.
- **Full time, and the goals (v106).** Your goals celebrated as big as they are (an early one, an equaliser or a lead
  in the second half, the winner at the death), theirs a plain GOAL; SIM THE REST in the pause menu; the match report
  in two screens (the result, then your players' numbers) and THE MONEY back at the club; the press conference in a
  press room drawn for your league; the Monday papers waiting off to the side (PAPERS, an orange count); every player
  instruction open from the start (they're the team's now: v112); and back from v91, after a standing tackle your man shields it from the man he
  took it from (see **After a tackle**). See **The match report**, **The goal, celebrated** and **Sim the rest** in
  the match section, and **The press conference** and **The money** under the manager career.
- **Deadline day and the fans (v105).** Every man has a popularity, on his card; your most popular bring more
  through the gate and sell the shirts, which come in each Monday now, not with a matchday's money. The morning of
  each of your games, the table (the matchday paper); each Monday, the dressing room man by man. The winter break's
  Monday is deadline day (desperate clubs, cheaper sellers, every bid answered there and then, a bigger club's late
  bid), and a bigger club may offer you a youngster on a buyback clause. See **Popularity**, **The matchday
  paper**, **Deadline day** and **A youngster on a buyback clause** under the manager career.
- **The press conference and the week's events (v104).** After each of your games, a press conference of its own:
  two questions, three answers each, moving the dressing room, a man or the fans. And in the Monday papers:
  windfalls, the community's asks, the derby against your rival (counting more, a fuller gate), the cups' draws, loans
  both ways, and the Player of the Month and of the Year (yours: a prize for the club, more fans). See **The press
  conference** and **The week's events** under the manager career.
- **The Monday papers, and sponsors who come to you (v103).** The check-ins are gone: each Monday the week's papers
  are on your desk instead -- the dressing room's mood and how it's moved, every decision the week has brought (bids
  for your men, answers to your bids, sponsors' offers, new deals, men who want out or want a word) and the reports
  (the physio's, the coaches', the scouts', the next game, the week's money): see **The Monday papers** under the
  manager career. And a new club starts with one bare board and nobody calling: the businesses round the corner
  call first, bigger firms as the club grows, and the shirt, the stands' names and the ground's open up as it does
  (see **Sponsors** under The ground).
- **Back to v89 (v102).** Everything from v90 to v101 was taken back out, and the game is v89's again: v90's
  dribbling (each touch going on ahead and waiting for him) and v94-v95's touch lengths by Dribbling; v91 and v93's
  guard after a standing tackle; v92's Dribble Lab controls (the DRIBBLING, RUN TOUCH and SPRINT TOUCH chips and the
  result box at the top left); and v96-v100's dribbling, already reverted in v101. The tests that came with them
  (classic-dribble, classic-dribblelab, classic-shieldwin) went too. One test fix stays: classic-crossing's low-cross
  check takes up to four crosses (the keeper claims about one in four).
- **Difficulty (v89).** Five levels -- RELAXED, NORMAL, PRO, STAR and CHAMPION -- a row in SETTINGS, and a tap on the
  chip under the title on the exhibition screen (it goes on to the next, CHAMPION round to RELAXED). A fresh browser
  starts at NORMAL; it's kept. STAR is the computer at full strength, as it always played; CHAMPION a notch past it. It
  turns the computer's side only, never your own men, and not the labs or drills. What it turns, for the computer's men
  (RELAXED / NORMAL / PRO / STAR / CHAMPION):
  - how far along your man's run they read him (their Def IQ's read × 0.45 / 0.65 / 0.85 / 1 / 1.12), and how loosely
    they track the man on the ball and how long they take to come to after a touch (× 1.7 / 1.35 / 1.12 / 1 / 0.88);
  - how often they take a chance to press together (40% / 65% / 85% / always / always, and for longer);
  - how keen they are to go to ground, and how surely a tackle at the ball wins it (× 0.5 / 0.7 / 0.87 / 1 / 1.12);
  - how wide their passes and crosses go (× 1.7 / 1.35 / 1.12 / 1 / 0.88) and how true their shots fly (accuracy ×
    0.72 / 0.84 / 0.93 / 1 / 1.06);
  - how noisy their choices on the ball are (× 4 / 2.5 / 1.5 / 1 / 0.7) and how long they look before playing it
    (× 1.5 / 1.25 / 1.1 / 1 / 0.9);
  - how far they stretch to cut out your pass (× 0.8 / 0.88 / 0.95 / 1 / 1.05);
  - and, at every level (v128), a runner of yours off the ball: their back line holds its line 0.7 s before it goes
    with him (your own men a tenth), reads his run 0.4 as far as it would, and keeps 0.4 as far goal-side of him.

  On RELAXED and NORMAL there's a hand on their crosses too: your man heads one clear himself if you don't (as the
  computer's marker would, when he's under it and their man doesn't beat him to it), and with the stick left alone he
  goes to meet it. (Their crosses were where the computer was hardest to play against: its markers head them clear
  by themselves, yours only if you time it.)
- **After a tackle (v91; back in v106).** When your man wins the ball off one of theirs with a standing tackle -- not
  with a slide -- then as soon as he has it he gets his back to the man he took it from, the ball tight at his feet on
  his far side, for a split second. That man can't just get up and take it straight back off him: he can only nick it
  from where the ball shows. How quickly your man turns, how long he keeps at it and how little of the ball he shows
  are his Def IQ: 7 to 14 radians a second (a half-turn in 0.45 s at 1, 0.22 s at 10), 0.3 s to 0.6 s (v93), and from
  within 60 degrees of the ball down to 30 (as a top dribbler shields it) -- so a poor one, slow round, can still have
  it nicked off him by a man quick round him to the ball. The stick still moves him -- only not back into that man,
  across him instead; left alone, he stands and turns. v102 took it out with v90's dribbling; v106 puts it back on
  the dribbling as it is (v89's). Measured on it (classic-shieldwin): at Def IQ 10 he's round in 0.17 s and the man he
  took it from got it straight back (within 1.5 s) 0 times in 12, against 12 in 12 with no guard; at Def IQ 1, 5 times
  in 6 after a tackle.
- **The magnet (v88).** The ball loose a stride or two from your man (within 2.6 m) -- your own knock-on or a heavy
  touch, one that's come off him, one knocked loose -- and he's drawn to it until it's at his feet. Whichever way you're
  pushing, he bends toward it: a quarter of the way at the edge of the pull, up to 60% right by it, half that if you're
  pushing away from it. With the stick left alone he goes to it. It doesn't pull him toward a shot or a cross, our pass
  on its way to someone else, a ball going away from him quicker than he can run, or one of theirs knocked on in their
  own stride. It only steers him: the ball's never his until it's at his feet. (You'd run on thinking you had it, and
  one of theirs would pick it up.)
- **The keeper's way to a cross (v87).** Deciding whether to come for a cross, the keeper now looks at his way to where
  he'd take it. He can't go through one of theirs: one in his way he has to go round (it costs him time, about a quarter
  of a second); two or more and it's shut, and he won't go. Nor will he go for one dropping among two or more of theirs
  (within 2 m of where he'd take it, as they'll be by then): too many people there. Once he's coming, a man of theirs
  stepping into his way stops him and he gets back to his line. Running into one of theirs he's held up (he takes most of
  the bump); one of ours he shoulders aside, off the line of his run to the side the man's on (not on ahead of him), a
  touch before he's on him -- he's calling for it.
- **Auto defend (v86).** Hold SWITCH -- J, or the PASS/SWITCH button -- while they have it, and your man defends by
  himself (the button says DEFEND). He jockeys the man on the ball: goal-side of him and a few metres off -- about 4.4 m
  at Def IQ 1 down to 3 m at 10, never tight -- square to him, shuffling with him rather than diving in, and going round
  him rather than through him to get there. Out wide in our end, where a cross is on, he's across into its way instead,
  nearer him (about 2.5 m), between the ball and the box. How well is his Def IQ: how soon and how truly he reads the man
  (the computer's own reads), how near the right spot he holds (up to 1.8 m off it at 1, on it at 10), and how quickly he
  turns to face him. He never tackles by himself -- that's still yours (SLIDE, or step in) -- and a man jockeyed can still
  go past him. Let go and he's yours again. A quick tap is still a switch (now on release, as on the touch button).
  - **Crosses can be blocked.** A cross struck into a man stood in its way, while it's still on its way up and below his
    shoulders, comes off him as a blocked shot does (his block reach, Def IQ): a few metres off the crosser he gets
    something on it; further off, it's over him. (The computer's crossers already thought twice with a man right in
    front of them.)
- **Clearances and crosses (v85).**
  - **A header is a forehead, not a boot.** How far a defensive header goes is the man's Heading now (it was a dial
    alone). From 8 m out in front of his own goal, the computer's stops some 13 m away at Heading 3, 17 m at 5.5 and
    22 m at 9 (it was 18 / 23 / 32 m). Yours (J) goes a little further, off a cross with pace on it: 15 / 19 / 24 m (it
    was 33 / 36 / 39 m -- a quarter of the cross's pace went into it, now a twelfth). A header looks for a team-mate
    nearer than a kick does.
  - **A clearance by foot carries to about halfway.** From 8 m out it stops 34 m away rated 3 in Shot power and Def
    IQ, 41 m at 5.5 (halfway is 42 m on) and 51 m at 9 (it was 29 / 35 / 43 m).
  - **A keeper coming for a cross gets it.** He used to read where a cross would come down only ahead of him, and only
    after a moment's read. Going in under one coming across him, that read ran out just before he got there (it would
    never come down within his reach after another moment), so he turned back for his line as it reached his hands, and
    one of theirs headed it into the goal he'd left. Now, once he's coming, he's reading it all the way, and a ball at
    his hands is his: caught when he's comfortable, punched at a stretch or with one of theirs up with him. His own men
    leave it to him once he's nearly there, and make way for him (they were nodding it off his fingertips, and blocking
    his run). And on his way back to his line he's still a keeper: a shot on him he saves if he can (he was a
    spectator), and he isn't jerked back to his line in a frame -- he gets back himself.
  - **He comes for the ones that are his.** Deciding to come he takes a moment to read it -- his Reflexes: 0.4 s at 1,
    0.33 s at 5.5, 0.26 s at 10 (v107; it was 0.32 / 0.26 / 0.2, and 0.12 s for everyone before v85) -- and comes only
    for a ball dropping in his six-yard box or half a metre past it (v107: it was a metre past, and 2.7 m wider) while
    it's still over their heads. Since v107 he also waits for it to come down a little more (3.1 m up, it was 3.3 --
    still over any man's head), comes off his line a touch slower (1.2 times his Speed, it was 1.25) and gets a hand to
    it a touch less far (0.92 of his reach): more crosses are headed, by the attackers and away by the defenders, and
    fewer are his. In the Crossing Lab, 40 crosses in each of eight set-ups, he had 18 of 320 against 47 on v106; your
    cross to your nearest man in the box, two of ours and two of theirs, 11 of 40 against 26 (the defenders headed 149
    away against 124, the attackers 153 against 148). Of three settings tried between, this one still leaves him the
    balls that are his; taken further he hardly came at all (1 of 320). A ball dropping in his six-yard box he still
    comes for and has (6 of 6). A good cross whipped in to a man is the man's; one that hangs, or drifts in on him, is
    the keeper's. (v85, in the Crossing Lab: a Crossing 8 man's crosses from the byline to his two forwards all headed,
    16 of 16; a Crossing 1 man's, the keeper 5 of 16.) And while a cross of theirs is still up at their heads he doesn't
    go after it as a loose ball (he'd run out under it, neither having it nor there for the header): he came for it, or
    he's set on his line.
  - **Measured:** their crosses into our box from the byline and from 18 m out on the wing, toward 7, 9, 11 and 13 m
    out, one of theirs attacking each and one of ours marking him, 16 of each (128 in all). Goals 41 → 10. He came for
    35 → 18 of them; of those he let in 23 → 0, and had (caught or punched) 5 → 14 -- the rest we cleared.
- **The kick-off (v84)** -- at the start, after a goal (the side that conceded) and to start the second half (Red):
  everyone is in his own half, a metre short of halfway at least, and the side not kicking off is outside the
  centre circle. The kicking side's most advanced man in the middle stands over the ball on the spot. Play holds
  0.8 s (nobody moves, and the clock doesn't run), then he rolls it back to a team-mate -- the one nearest a spot ten
  metres behind the ball, in the middle -- and it's on. Yours, you're put on the man it's going to. (Before, the
  forwards stood where their shape without the ball put them, up to 6 m into the other half and inside the circle,
  and the man on the ball -- a centre-back at times -- could set off with it at once.)
- **The advantage at the end of each half (v82).** When the clock runs out, the referee doesn't blow while there's an
  attack on: at half time as at full time, play goes on (HALF TIME +ADV, FULL TIME +ADV on the clock) until it's dead.
  The attack is the side's that had the ball as the clock ran out, and it's over once:
  - **they've won it** and kept it a second (in our attacking third: a second to win it straight back), or won it
    anywhere else. Won in their own attacking third, it's their attack now, to finish.
  - **their keeper has it**, or it's gone out and it's theirs (or ours, back in our own half).
  - **we've gone back**: into our own third, into our own half 30 m and more short of where we'd got, or been in our
    own half 5 s.
  - **it's been cleared**: knocked loose by them and out of our attacking half.
  - **20 s have gone**, whatever's on.

  A shot plays out, past the 20 s too, and so does whatever comes of it: a save that isn't held, a block, the
  rebound. With no attack on as the clock runs out, the whistle goes at once.
  - **Before**, there was no advantage at half time at all, and at full time it ended at the first step back in
    midfield, the first ball played back, or the moment a shot was saved: 1.3 s after the clock ran out, on average.
    Measured on computer-v-computer matches, starting an end of half every 3 s of ordinary play (40 matches, 4,700
    of them) and judging each by both rules: v81's let 3.2 goals in 100 be scored, and cut off 2.8 in 100 attacks
    that went on to score within 12 s, nearly as many. Now 6.2 in 100 are scored (+2.9; 95%: +2.1 to +3.9), and 0.7
    cut off. With two ends of half a match where there was one, that's about 0.09 more goals a match. In 24 matches
    played through, 36 of the 48 ends of half had an attack to play on; it went on from 0.1 s to the full 20 s,
    5.5 s in the middle, and 3 goals came in them.
  - **A goal in the last play counts once**, and then it's half time or full time. The ball's left in the net, and at
    full time it used to count again every time the celebration ran out: on the full-time screen the score kept
    climbing, and a career match, its result read a moment later, gave the scorers a goal or two they never scored.
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
- **Stamina (v121)** — two things: the bar, which a sprint drains and a jog or a stand fills again, and the
  ceiling under it, which every sprint wears down for the rest of the half. A tired man is slower: at 70% of both,
  about a seventh.
  - **A sprint costs by the ground it covers, not the seconds.** A metre flat out costs the same whoever runs it, so
    pace has a price: a Speed 6 or 7 man pays a second what a second flat out cost anyone before v121, the quickest
    (Speed 10) a fifth more, a Speed 2 man about a quarter less. His Stamina sets what a metre costs, as before. The
    ceiling wears the same way: 0.0075 a second at a Speed 6 man's pace (before v121 0.007 a second at any speed).
    (v123: v121 had the quickest man pay what he always had and the ceiling wear at 0.0045, and the sides came to
    half-time almost as fresh as they started; a metre went a fifth dearer and the ceiling a good deal faster.)
  - **Half-time gives back half** of what the half took from the ceiling (a quarter before), more with a physio.
  - **The computer paces itself.** A man whose ceiling has begun to go (under 0.9) saves his sprints for what
    matters (see **When the computer sprints**): none of the opportunistic ones -- up in support, on a counter,
    driving on with it -- though the critical ones still.
  - In League 2 matches played on the computer (v123): after a half, the ceiling about 0.75 on average, the lowest
    about 0.6; at full time about 0.67, the lowest about 0.45; the bar about 0.78 through a match -- halfway between
    v120, when a side was winded by half-time (0.67 and 0.43 at the break, 0.47 at full time, the bar 0.65), and
    v121, when it hardly tired at all (0.85, 0.82, the bar 0.87). The men sprint about a fifth of the time, as
    before. The quick forwards who sprint most tire most -- in a top club's side down to 0.45 or so by half-time --
    so they're the ones you'll want to take off on the hour.
  - **No slide on an empty bar.** With a little left -- the end of a sprint -- you can make one last-ditch slide:
    it takes the last of the bar, and then there's none till a quarter of it is back (TOO TIRED TO SLIDE). The
    same once the bar runs dry sprinting. The computer's men are held to it too. A slide costs 0.16 of the bar.
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
  - **Going forward (v111).** He used to give the ball back nearly half the time: seven passes in ten
    in the other half, six in ten with a man on him, six in ten straight after a ball forward -- a ball
    back was all but safe and the ground it gave up cost next to nothing. Now ground counts for more (the
    urge to get forward is never below 0.4 of its full pull, and every metre gained or given up counts
    2.4 times what it did), and a ball back costs more than the ground it gives up: 0.85 of its worth in
    his own half, 0.72 in theirs, 0.61 there with a man within 4 m of him, and 0.85 again within 3 s of
    his side's last ball forward. A cutback into their box isn't a ball back. Measured over computer v
    computer matches (ten minutes each, four a style pairing):

    | Styles | Balls back | in the other half | with a man on him | after a ball forward | Shots a side | Goals a match |
    |---|---|---|---|---|---|---|
    | Control v control | 46% → 35% | 68% → 45% | 61% → 45% | 60% → 47% | 3.0 → 5.1 | 1.4 → 2.0 |
    | Balanced v balanced | 51% → 34% | 70% → 50% | 67% → 43% | 65% → 43% | 3.1 → 6.4 | 1.0 → 2.3 |
    | Direct v wing | 46% → 32% | 70% → 46% | 61% → 40% | 62% → 34% | 2.6 → 5.5 | 1.8 → 2.3 |
    | Gegenpress v counter | 43% → 25% | 68% → 38% | 60% → 33% | 57% → 24% | 4.9 → 7.0 | 3.0 → 4.8 |

    Its passes find a man a little less often (about 85% against 87%), and each style keeps its own
    character against the others.
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
  next attack. A man whose ceiling has begun to go (under 0.9) keeps his sprints for these alone (v121: see
  **Stamina**). By full time a side has used a good part of its legs (the ceiling on its stamina is around 0.67,
  the hardest runners' 0.45 or so), not all of them.
- **Whose ball it is** — both sides read possession the way a player would. A man running with the ball
  knocks it a stride ahead every few steps, and a pass takes a moment to arrive; through both it's still
  his side's ball: his teammates keep their runs and their shape, and the other side keeps defending as a
  block. Only the man it's for goes after it. It's nobody's ball only after a tackle or a deflection, a
  clearance, or a pass that's gone astray. Each side's shape shifts off where it sees the ball, a beat
  behind it, so a quick one-two doesn't drag everyone back and forth.
- **Defending as a block** — out of possession a team defends in lines, not man for man. The back line holds
  one height, goal-side of the ball by a gap that shrinks as the ball comes closer and never higher than the
  tactic allows; it doesn't drop for a forward standing on it (he'd be offside), only the defender with a
  runner in his zone drops with him -- off where the run's taking him by the time he's there, as his Def IQ
  reads it (see the man pressing, below): into the space the runner's going into at 10, off where he is at
  1. When he picks the runner up holding his place in the line, he holds it a beat, a tenth of a second,
  before he turns and goes with him (about a twentieth of a run in behind: half a stride on him for the
  runner); one already pressing, shadowing or tracking a man goes with him at once, and so does one going
  to a man in front of him he's been told to STEP UP to. The computer's men are slower to it (v128): they hold
  it 0.7 s -- a cover CB too, who'd go at once -- read the run 0.4 as far, and keep less far goal-side of him. (In v62 the beat caught a man already shadowing
  the runner too, stopping him mid-run: about a metre and a half more than meant. v63 put that right.) A pressing side's man on his man in their build-up
  reads him the same way, without the beat. The midfield sits a gap in
  front and the forwards in front of that, every line sliding across toward the ball. The midfield stays a
  line: a man of theirs sitting between our lines, the midfielder nearest him drops a couple of yards at most
  and stands in the pass from the ball into him, rather than dropping in front of him (that used to leave the
  midfield in steps). Its wide men only go as wide as there's something to cover -- never wider than the
  widest of theirs between our back line and the ball (a stride inside him), and in off the line with nobody
  out there -- and the far one, the ball on the other flank, slides over with it but stays within about 10 m
  of a man of theirs left free out there (one our other lines aren't on), so a switch doesn't find him alone;
  the men between them are spaced evenly. When the ball's lost,
  a defender or midfielder caught a long way upfield sprints back goal-side of it; the rest jog back into
  shape, the forwards always (they save their legs for the next attack). One man presses the ball, and keeps
  him until a teammate is clearly better placed. He goes for where the man on the ball will be by the time
  he gets there, not where he is: on along his run, as far as it would take him to get there flat out (up to
  a second and a half), as far as his Def IQ reads it -- 95% of it at 10, so a man running across him or
  past him finds him in the space in front of him, goal-side; none of it at 1, where he goes for where the
  man was (he sees him a beat late) and is left behind. The same goes for him going in for the ball, the man
  stepping across to screen, one getting back after he's been beaten and one dropping in front of a man
  through on goal. The next man sits about 5 m behind him at an angle, on the inside, to cover if he's
  beaten (of a pair of centre-backs one goes and the other covers). When the man on the ball is in trouble —
  a pass played back to him, a heavy touch, his back to our goal with one of ours close, the touchline at
  his shoulder — the side presses together for a second and a half: the man on him goes in, the nearest
  other man cuts out his easiest pass, and the lines step up behind them (not in their third unless it's a
  pressing side; a low block only in its own half). When they pass, a man who can get onto the ball's path
  before their receiver goes to cut it out; otherwise the nearest closes the receiver down as the ball
  travels, to be on him for his first touch. The block reads the ball a beat late (about a third of a
  second), and a run a beat late too, so quick passing and well-timed runs can still open it up.
  - **A tired man reads it worse** (v77). The read falls off twice as fast as his legs: a man a tenth off his top
    speed (stamina low, or worn down over the match) reads a fifth less of the run, never less than 40% of what he
    would fresh. A runner off the ball he reads 90% of the way at Def IQ 10, the man on it 95% (it was all of both).
  - **What reading the run did** (80 club pairings, each played before and after, every man on the computer,
    6-minute matches): goals 3.09 a match → 1.85, shots 8.7 → 5.3, goalless draws 13% → 18%, pairing by
    pairing -1.24 goals a match (95%: -1.65 to -0.82): a man running with it no longer gets past a defender
    by running past where he's aiming. Reading a runner off the ball the same way, after it, left it as it was
    (1.89 a match; -0.04 to +0.42 either way, pairing by pairing).
  - **What the coaching did** (v61; 80 club pairings, each played on v60 and on v61, every man on the computer,
    6-minute matches): goals 1.64 a match → 1.15, shots 5.6 → 4.6, goalless draws 21% → 35%, pairing by pairing
    -0.49 goals a match (95%: -0.84 to -0.14). The attacking changes on their own left it where it was (1.66 a
    match). The block -- the midfield kept a line, its wide men covering who's actually out there -- took it to
    1.30 and about a shot a match off the side on the ball, most of it headers (2.0 a match → 1.1) and shots
    from under 11 m (1.8 → 1.1); the keeper's wait took it the rest of the way.
  - **The through ball round their line, and the back line's beat** (v62; the same 80 club pairings, each played
    on v61 and on v62): the computer's through balls 4.4 a match → 4.7, getting to the runner 57% → 64% (cut out
    37% → 31%). 14% of them are bent round their line, 24° of turn on average, and 74% of those get to him. A shot
    within 4 s of one getting to him, 1.19 a match → 1.51; a goal within 6 s, 0.33 → 0.45. Goals a match 1.21 →
    1.30, pairing by pairing +0.09 (95%: -0.19 to +0.40), shots 4.5 → 4.8: up a little, not by enough to tell from
    chance in 80 matches. The beat is in those numbers too; on its own it's too small to measure in 80. (v61 scored
    1.21 here and 1.15 in its own measurement: the matches' randomness isn't seeded, so two runs of the same
    version differ by about that much.) v62's beat caught too many defenders (see above); measured again on v63,
    with it as meant, against the same v61 matches: through balls 4.4 a match, getting to the runner 63% (cut out
    30%), 14% of them round their line and 71% of those getting there; a shot within 4 s of one getting to him
    1.26 a match, a goal within 6 s 0.41; goals 1.26 a match, +0.05 on v61 pairing by pairing (95%: -0.21 to
    +0.39). So it's the ball that gets there more often; some of v62's extra shots were probably the beat.
- **Positional play (the neutral style)** — with the ball, a side on the neutral style plays off one plan
  for the whole team, and every man has a job in it. The centre-backs are the rest defence: level with
  the ball in our third, further behind it in theirs (more of a gap the more men they've left up), and
  always goal-side of their highest man. Building from the back they split: a pair 17 m either side of the
  middle, the outside men of a three 20 m (it was 13 and 15), leaning only a little toward the ball, and
  closing up to the settled width as the ball goes past halfway. The holding midfielder is the pivot in
  front of them, a little further off them while we build up (with the ball out wide in their third, he
  arrives late for the pull-back). The wide men hold the touchlines, about level with the ball -- but while
  we build up they don't come down to it: a winger holds on halfway (46 m out) and a wide midfielder just
  short of it (38 m), and neither comes back into our third to offer himself (a man told to COME SHORT
  excepted), so the build-up has depth and the forward isn't on his own up there. The other central
  midfielders stand off our third too, between their lines. The far wide man comes in to the back post once
  the ball's out wide near their box. With the man on the ball out wide on a wide man's flank in their third,
  and the wide man level with him or behind, he goes past him -- 8 m outside him if there's 9 m between him
  and the line, else 9 m inside him -- rather than straight at him, and the man on the ball leaves him that
  lane (he cuts in, or holds it, rather than carrying it into the run; pushed out to the line anyway, the
  runner goes round the back of him to the inside). Out there with fewer than two men going into the box,
  the furthest-up central midfielder (on BALANCED crosses) gets in it too, through the gap between their
  centre-backs -- one of them, not both. A back four (4-2-2, 4-3-1, 4-1-3) sends its
  full-backs up the flanks as the side's instructions tell them (SUPPORT once the ball's in their third,
  ATTACKING from the build-up), the centre-backs and the holder staying back. Building from the back, a
  back four's centre-backs split as a back three's outside men do and its full-backs go higher and wider
  still; on the keeper's ball the centre-backs are at the corners of the box and the full-backs up toward
  the touchlines (v124). One forward pins their last
  line, in a gap in it, and the other drops between their lines (whoever is pinning stays on it unless the
  other gets clearly higher: one comes short, the other goes); out wide in their third they go to the
  near and far posts. Around the man on the ball, two team-mates take up spots at clearly different
  angles (a triangle) where a pass reaches them before any opponent can get there: further forward
  where it can be, best of all between their lines, about 14 m away and never nearer than 9 m (a man that
  close brings his marker into the space), plus a way back when he's pressed, properly behind him (5 m or
  more).
  The men who can get there soonest go, without leaving a more important job. A spot that stops working
  is first put right with a step or two, and a set only changes when the ball goes to another man or
  a clearly better one turns up. Runs in behind are triggered: when the man on the ball is facing up,
  unpressed, with room behind their line, the man best placed (the forward on their line first) arcs
  along it and goes; two at most, down different lanes. Nobody stands within about 7 m of a team-mate,
  and only runs, and getting up the pitch after winning it back, are at a sprint.
- **Runs in behind, as coached (v79)** -- from the runs drawn on the coaching page:
  - **Anticipation.** The runs go as a pass is played forward to a team-mate, not once he has it: the runner
    gets to their line in his lane and waits there, onside, while the ball's on its way, and goes as it
    arrives. Not for a ball played back. The next run follows him a moment later (a third of a second for a
    balanced side), not a second later.
  - **A run carries on** when the ball's moved on to another team-mate who can still find him: he and the
    spot he's running to are within that man's passing range, give or take half as much again. Before, a
    pass to anyone else called it off.
  - **His own channel.** A wide man runs into the gap in their line he's in (a stride in from the man at its
    edge), or the nearest one, never more than a quarter of the pitch across. Before, the biggest gap won,
    often one on the far side, and that ruled him out of running at all. A forward bends in a little, and
    four tenths of the way towards the man of theirs who's stepped out of their line to the ball: into the
    space behind him.
  - **In towards goal.** A wide man's run that would land within 22 m of their goal goes in towards it,
    into the box: no further across than 12 m from the middle landing 8 m out, 20 m landing 20 m out. It
    no longer goes on down his touchline. An overlap, or a man told to stay wide, still goes down the line.
  - **He goes again.** The man who's just played it forward is the first to run: a forward, a wide man, or
    a midfielder told to run in behind.
  - **The third man.** A forward's run across their line (more than 5 m across) empties his lane. A
    midfielder told to RUN IN BEHIND goes into it, up to their line, for the pass into the space it's left.
    One told to stay back, or balanced, gives the man on the ball the pass level with him or behind him
    instead.
  - **In at the back post.** With the ball, or a ball through (where it's going), within 26 m of their goal
    and no wider than the box, the wide man away from it goes in at the back post, behind his man, instead
    of out on his touchline. With the ball in the middle, both wide men do. This is read off the ball
    itself, not the slow read of the play, and he isn't pulled back out of the box to offer a pass.
  - **Replayed from the page's moments** (each put back as captured, four times over): the computer's man
    now runs within 16 degrees of five of the ten drawn runs, against two before. The striker
    behind the centre-back stepping out: 11 degrees off, 16 m along it in 2 s (28, 12 m). The wide man in
    behind the wide midfielder: 4 degrees, 8 m (he didn't go). The far winger with the ball through to the
    box: 27 degrees, 9 m (he went backwards). The wide man in behind the full-back: 14 degrees, 14 m (26,
    8 m). The wide man at the open space beside their centre-back: 16 degrees, 10 m (34, 8 m). The passer
    on the counter goes again: 67 degrees, 5 m (110 degrees, none).
  - **What it did to the score** (the same 84 club pairings, every man on the computer, 6-minute matches,
    against v78): goals 2.17 a match → 2.46, give or take about 0.2 each. Shots 7.1 → 7.7 a match, and
    those from 12-16 m out 1.8 → 2.5 a match, going in as often (39%). Offsides 0.18 → 0.20 a match: the
    waiting on the line keeps them onside. The keepers went down big 0.8 → 1.5 times a match.
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
  in it, uses his hands anywhere in it (never to a team-mate's ball kicked to him: v113), closes down a man
  on the ball in it, and sweeps outside it for a free ball he'll win -- at his feet (v113). Guarding his goal,
  he stays between the posts.
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
- **The keeper's ball out** — on a goal kick the back line splits to the corners of the box (21 m
  either side of the middle, just inside its edge) and the holding midfielder stands 31 m out in
  front of them; the other midfielders are up at 40 m, the wide men on halfway and the forward on their
  line, so there's someone at every depth (it used to be the whole side inside 35 m but the forward).
  The keeper plays it short only to a man who'll reach
  it before any of theirs can close him down, struck to arrive at him, and tells him it's his; he
  waits a moment for his team to set if he has to. The computer's keeper gives his side up to 2.4 s
  held to get there (while more than one of them is still on his way to his spot), unless one of
  theirs is coming at him: it used to go out after a second or so, the side still bunched in front
  of him. Nothing safe short, he goes long to a man who'll
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
  wages), stadium upgrades, loyalty, and week-by-week progression.
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

Every player has an archetype within his position -- keepers too, since v118 -- and his stats are built around it:
the position's averages shifted by the archetype. Pace most of all: centre-backs and holding midfielders are the
slowest men on the pitch, wingers and speedsters the quickest, and a forward's pace goes with his build. Ratings come
out about the same across archetypes; what changes is the kind of player.

Since v118 the archetype, not the position, says **where a man can play**: PLAYS, the spots that are his own, and
ALSO, the ones he can cover (a second position: a little off his reading of the game -- see **Positions** in the
tactics). Anywhere else he's out of position. It also gives him **habits on the pitch**, on top of what his side's
told (the team instructions). "How common" is its share of the men in its position. (v127: the central midfielders
are three positions again -- holding, central and attacking -- and their seven archetypes are sorted among them, each
covering the next one along as a second position. A holding and an attacking midfielder are each half as common as a
central one: see **Positions, two to one to one** in the career.)

| Position | Archetype | Plays | Also | How common | Pace | Good at | On the pitch |
|---|---|---|---|---|---|---|---|
| Centre-back | Stopper | CB | -- | 30% | 3.5 | strength, heading, tackling | attacks the ball: tighter on a man, and out to one in front of him where the line holds; clears it rather than plays it |
| | Cover CB | CB | FB | 30% | 5 | reading the game, interceptions | sweeps behind: a few yards deeper with the ball, picks up a runner where the line holds, reads it rather than wins it |
| | Ball-playing CB | CB | DM *(v127; CM before)* | 20% | 4 | passing, composure, control | plays it out from the back, the longer pass forward |
| | Wide CB *(v118)* | CB | FB | 13% | 5.5 | stamina, tackling, crossing | the outside man of a back three: splits wider, up behind the play on the ball's side, carries it forward |
| | Libero *(v118)* | CB, DM *(v127; CB, CM before)* | CM | 7% | 5.5 | passing, dribbling, reading the game | up close to the play with the ball, and carries it out of defence into midfield |
| Full-back | Full-back | FB | WM | 40% | 6 | pace, stamina, crossing | overlaps when the side's told to, then gets back |
| | Wing-back | FB, WM | W | 25% | 7.5 | pace, crossing, dribbling, engine | a step further up than the full-backs are told to go; down the line, and the cross |
| | Defensive full-back *(v118)* | FB | CB | 25% | 5 | tackling, strength, heading | a step further back: overlaps rarely, tucks in as a third centre-back, keeps it simple |
| | Inverted full-back *(v118)* | FB | DM, WM *(v127; CM, WM before)* | 10% | 5.5 | passing, composure, control | with the ball (out of our first quarter) steps in off his flank, into midfield beside the pivot; passes, doesn't cross |
| Holding midfield *(v127)* | Anchor | DM | CB, CM | 55% | 4.5 | tackling, interceptions, strength | the holder first; a step back: screens the back line, keeps it simple |
| | Deep creator *(v116)* | DM | CM | 45% | 4.5 | long passing, composure, reading the game | holds with the pivot and runs the game from deep: the long ball forward, never the dribble |
| Central midfield | Box-to-box | CM | DM, AM, WM | 40% | 5 | stamina, strength, tackling, shooting | a step further forward: arrives late in their box, gets back to ours |
| | Playmaker | CM | AM | 33% | 4.5 | passing, vision, bend | plays it through, keeps the ball |
| | Ball-winner *(v118)* | CM | DM | 27% | 6 | tackling, stamina, slide tackles | goes into the man on it tighter, and out to him higher up the pitch; won, he keeps it simple |
| Attacking midfield *(v127)* | Shadow striker *(v118)* | AM | CM, ST | 60% | 5.5 | finishing, composure, runs | runs beyond the striker into the box, always: a second forward from midfield |
| | Trequartista *(v118: was the Creator)* | AM | CM, W, ST | 40% | 5.5 | dribbling, flair, control | a free role between their lines, drifting over to where the ball is; takes men on, the killer ball |
| Wide midfield | Wide midfielder | WM | CM, FB | 45% | 6 | stamina, crossing, tackling | up and down the flank all game; crosses, tracks back |
| | Wide runner | WM | FB, W | 30% | 8 | pace, dribbling, crossing | flies down the line with it and takes his man on |
| | Wide playmaker *(v118)* | WM | W | 25% | 5 | passing, vision, control | inside off the flank, to the ball, to make the play |
| Winger | Trickster *(v118)* | W | WM | 30% | 7 | dribbling, agility, skill moves | runs at his man with tricks, any way at all; the most skill stars of anyone |
| | Winger | W | WM | 30% | 7.5 | pace, crossing, dribbling | takes it down the line to the byline and crosses |
| | Inverted winger *(v118)* | W | WM | 22% | 7.5 | dribbling, bend, passing | narrower; cuts inside to curl it in or slide the pass through |
| | Inside forward | W | ST | 18% | 7.5 | pace, finishing, runs | in the channel between full-back and centre-back; runs in behind, cuts in, shoots |
| Striker | Poacher | ST | -- | 22% | 6 | finishing, composure, movement | on the last man's shoulder: pins their line |
| | Speedster | ST | W | 20% | 8 | pace, acceleration | runs in behind all day |
| | Complete forward | ST | W | 20% | 6 | link play, passing, shooting | drops in to link, then gets in the box |
| | Target man | ST | -- | 18% | 5 | strength, heading, holding it up | back to goal, up and central: holds it up; hardly ever runs |
| | Pressing forward *(v118)* | ST | W | 10% | 7 | stamina, tackling, acceleration | presses up whatever the forwards are told, tight on the man |
| | False nine *(v118)* | ST | AM *(v127; CM before)* | 10% | 6.5 | passing, dribbling, vision | drops into midfield to make the play, always |
| Keeper *(v118)* | Shot-stopper | GK | -- | 35% | 5 | reflexes, diving, handling | stays home: less far off his line at a man, sweeps less, comes for fewer crosses |
| | All-rounder | GK | -- | 30% | 6.5 | a bit of everything | as every keeper was before v118 |
| | Sweeper keeper | GK | -- | 20% | 7.5 | speed off his line, kicking, composure | stands higher (up to 4 m off his line with the ball far up the pitch), sweeps further out and sooner |
| | One-on-one keeper | GK | -- | 15% | 7.5 | speed off his line, diving | at the man through on goal further off his line, straight at him from further, and down bigger and sooner |

(Pace: the middle of a new career's men's speed stat, 1--10 -- a keeper's, his keeper speed.)

**The habits.** Most lean the setting his line has a step one way or the other: a wing-back goes a step further up
than the full-backs are told (SUPPORT is PUSH UP to him), a defensive full-back a step back, a libero a step closer
to the play, a cover CB a step deeper, a box-to-box midfielder a step further forward (and into the box for a cross),
an anchor and a deep creator a step back (they hold with the pivot), a poacher and a speedster a step nearer their
line. Some have a setting of their own: a target man always
holds it up, a false nine always drops in, a shadow striker always goes in behind; an inside forward plays in the
channel, an inverted winger and a wide playmaker narrower, and a wide playmaker comes short for it. (A winger and a
wide runner play wide as their line's told, and go in at the back post with the ball near their box like anyone.) Without the ball: a stopper, a ball-winner and a pressing
forward go in tighter (a step toward TACKLE), a cover CB and a deep creator a step off; where the line holds, a cover
CB picks up a runner (FOLLOW RUNNERS) and a stopper steps out to a man in front of him (PRESS UP); a pressing forward
presses up whatever the forwards are told; a ball-winner goes and gets it further up than the line of engagement. On
the ball his choices tilt: a winger, a wide runner and a wing-back fancy going down the line, an inverted winger, an
inside forward and a wide playmaker cutting in off it; a trickster takes his man on most of all, and does a skill
move keenest; a trequartista takes men on and plays the killer ball, a playmaker and a deep creator the ball
through (the deep creator long, from deep), a libero and a wide CB run with it, an inverted full-back passes and
doesn't cross, a poacher and a shadow striker shoot, a false nine makes it rather than finishes it; a stopper, an
anchor, a ball-winner and a defensive full-back keep it simple. Runs in behind come keenest from a speedster, an
inside forward and a shadow striker, then a winger, a wide runner and a wing-back, a poacher and a pressing forward;
a wide playmaker less, a false nine and a target man hardly ever. The holder is an anchor or a deep
creator if there's one, a ball-winner next, never a shadow striker or a trequartista if anyone else will do.

**Keepers.** A keeper's archetype has his stats (a shot-stopper's reflexes, diving and handling; a sweeper keeper's
speed off his line, kicking and composure; a one-on-one keeper's speed and diving) and his habits in goal, measured
in a computer match: a sweeper keeper stood about 5 m off his line with the ball far up the pitch, the others about a
metre. An exhibition club's keepers have none: they keep as an All-rounder.

**Where they come from.** In a career a man's archetype is drawn for his position by how common each is. A squad's
positions are dealt so it can always field a side -- two or three centre-backs and a full-back or two, three in the
middle of midfield and a wide one, two or three strikers and a winger or two -- and so a computer club's shapes (with
the ball and without it) have the men they need: archetypes are choosier than positions were, and a squad drawn man by
man could be a position short and play a man out of it every week. A club topping its squad up signs the position
it's shortest of, and one buying a man buys one who can play where the man he's replacing did. The exhibition clubs'
squads have the new archetypes too, dealt by the spot each man plays in their shape.

**Positions, two to one to one (v127).** The middle of midfield is three positions again: a holding midfielder (DM), a
central one (CM) and an attacking one (AM) -- from v118 to v126 they were one, CM. A holding and an attacking
midfielder are each half as common as a central one. A man drawn on his own (a youngster, a free agent) is a wide
midfielder a quarter of the time and in the middle the rest, two CMs to each DM and each AM. A squad's middle three
are first a man for each DM, AM and CM spot its shapes have, then drawn so that across the world it comes out the same
-- most shapes have a CM's spot or two and few a DM's or an AM's, so what's left to draw is mostly DMs and AMs. In six
new careers' worlds the computer clubs had 0.52 DMs and 0.51 AMs to each CM, and every one of them had a man of his
own for each DM, AM and CM spot of its shapes. Your own squad is dealt for the 3-3-2 you start in. A career saved
before: a central midfielder's position is his archetype's -- an anchor or a deep creator is a DM, a shadow striker or
a trequartista an AM, the rest CMs (labels only: his stats are as they were). Skill stars: a trickster's ceiling is drawn from odds of its own, the best of anyone's (at the top level
one in seven has five), and a trequartista's and a shadow striker's from an attacking midfielder's; the other
wingers' are a little lower than before, so the world has about as many five-star men. A save from before v118: a
DM or AM is a CM, a Creator a Trequartista, and a keeper gets the archetype his keeping leans toward (about as often
as they come now) -- labels only: his stats are as they were. Players signed before styles existed are labelled with
the style their stats already fit, and keep their stats. A winger (WNG) is a forward and a wide midfielder (WM) a
midfielder: no midfielder is a winger.

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
| 44–45 | spread | 2 | going down big at a man (v78): going down, then spread -- one knee down, the other leg out, arms wide; the right knee down for the keeper facing E, mirrored for the one facing W |

A dive along the goal line runs toward or away from this camera, so the stretch goes forward as
well, climbing toward the top corner or dropping toward the bottom one, and reads at full length.
The head is bigger than the arms can reach past, so the gloves are painted in front of the face, as
a pixel artist would. The spread is drawn facing us whichever way he faces: side on, a man down on one knee
with his arms out reads as a man standing. `keeper_sheet.json` has the layout and `keeper_sheet_preview.png` every frame.

Football Classic (`classic.html`) takes the same art split into parts (a body sheet, every hairstyle's head, and
where the head sits in each cell) so each player can be put together and recoloured. Write them in with:

```sh
python3 tools/sprites/make_player_sheet.py --embed-classic
python3 tools/sprites/make_keeper_sheet.py --embed-classic
python3 tools/sprites/make_pitch_art.py --embed-classic     # the far side of the pitch, a strip a ground level (assets/sprites/pitch_far_1..5.png)
python3 tools/sprites/make_ball.py --embed-classic           # the ball: six 9x9 frames (assets/sprites/ball_preview.png)
```

`index.html` keeps the sheets it was last embedded with until it is re-embedded with `--embed`.

### The campus

The career's campus (`assets/campus/`) is composed from tilesets the player supplied: the houses, offices, garden,
harbour, station and tree sets by **TerribleJared**, with **VeonTrainer** and **Ekat99**, and the shop set with
**HimuraKenshin2010**'s items. Thanks to them; they're credited in the game's Settings too. Nothing Pokémon-branded
from the sets is used: the hall's sign and ball and the clinic's balls are painted over (the hall's sign carries your
three letters and its ball becomes a plaque for your crest; the clinic's cross is red), the clubhouse's "PC" sign is
painted over with its own clapboard, the stone house's shop board reads SCOUTS and the log cabin's "Witch Hut" board is
cleared for your crest; no Poké Balls, Ball-Mart signs, creatures or creature planters appear. The stadium isn't in the
sets: it's drawn in their palette.

The campus comes in pieces, so the game can draw the one a club has:

- `campus_lawn.png`, a 64 by 64 tile of lawn, all over the 768 by 448 campus.
- `campus_inside.png`, the stadium's inside as far as it shows over its walls: the apron and the near half of the
  pitch.
- `campus_stadium_1.png` to `_5.png`, the stadium at each level from outside, the whole of it (768 by 232, its foot 222
  rows down): the campus shows the bottom of it along its top, the day's end all of it against the sky.
  `campus_lights_1.png` to `_5.png` are what's lit on each at night (floodlights, windows, the doors' lamps).
- `campus_sprites.png`, everything else: the four clubhouses (the garden set's shed, let go; the log cabin; the
  clapboard clubhouse; the hall), the four training pitches, the physio's clinic, the scouts' house, the academy, the
  plots, and the thirty decorations.

`CAMPUS_META` says where each goes, what a decoration mustn't be put down on (each piece's footprint), and where the
game writes on them: the ground's name, the club's crest and its three letters. `campus_start.png` is a new career's
campus, `campus_full.png` one with everything built and a few decorations out, and `campus_levels.png` the five
stadiums and the four clubhouses. The tilesets aren't in the repo, so rebuilding needs them:

```sh
python3 -I tools/campus/make_campus.py <tilesets dir> --embed-classic   # CAMPUS_ART and CAMPUS_META in classic.html
```

## Tests

`tests/` holds optional end-to-end tests that drive the real UI in headless Chromium —
creation through to the House, a played career match, a five-match season, the exhibition setup,
the labs, and Football Classic's manager career (a season a week at a time, promotion, the playoffs,
a played match), tactics, the shape with and without the ball, runs in behind, passing, the computer's through ball round their line, quick subs, an exhibition's sides and its tactics before kick-off, the first touch, the players' sprites,
the pitch, the kick-off and the advantage at the end of each half. They need
Playwright; the game itself stays dependency-free. See [tests/README.md](tests/README.md).
