# Sprite sheets and references

Everything the game draws its people, stands, campus and ball from, as Football Classic (`classic.html`) draws them now,
and the references the player sent for them.

## game/ (taken out of `classic.html`, so exactly what the game uses)

**players/**
- `player_body.png`: 128 x 1280, 32 x 32 cells, 4 columns (frames) by 40 rows. Rows by action, eight directions each
  in the order E, SE, S, SW, W, NW, N, NE: 0-7 idle (1 frame), 8-15 run (4), 16-23 shoot (2), 24-31 pass (2),
  32-39 slide (2). His feet are at (16, 29) in his cell. Shirt, trim, shorts, boots, skin and hair are recoloured in
  the game (the ramps are in `player_parts.json`, "drawn").
- `player_heads.png`: every hairstyle's head, 20 x 17 cells, five views across (S, SE, E, NE, N; the other three are
  mirrored), a row each for mop, crop, bald, afro, long, mohawk and bun, then the beard and headband overlays.
  `player_parts.json` says where each head sits on each body frame ("at").
- `keeper_sheet.png`: 128 x 1472, the keepers, the same cells and feet; its rows are in `keeper_sheet.json` (ready,
  shuffle, run, hold, kick, dive, spread).
- `*_preview.png`: every frame laid out, to look at.

**stands/**: `stand_1..5.png` the far side of the pitch at each stadium level with its supporters in;
`stand_1..5_empty.png` the same, empty; `supporters_1..5.png` the supporters on their own.

**campus/**: `campus_sprites.png` every clubhouse, training pitch, building, plot and decoration (`campus_meta.json`
says where each is on the sheet and where it goes on the 768 x 448 campus); `campus_stadium_1..5.png` the stadium from
outside at each level, `campus_lights_1..5.png` what's lit at night; `campus_lawn.png`, `campus_inside.png`; and
`campus_start/full/levels.png`, the campus put together.

**ball/**: `ball_frames.png`, six 9 x 9 frames of it turning (top row) and the same while it bends (amber);
`ball_frames_x8.png` eight times the size.

## first-touch-original/

The one-piece player sheets of the original First Touch (`index.html`) and their layout.

## references/ (what the player sent)

- **characters/**: the character sheets, 256 x 256 each, four frames in each of four directions (down, left, right,
  up): `ref_03` to `ref_09` (10 November), `ref_14` to `ref_19` (12 November).
- **eight-directions/**: `ref_10_angles.png`, the reference for the angles of eight directions (sent for the angles,
  not the art style; shown at 4x), and `ref_20_bare_body.png`, the bare body in eight directions (it came as a soft,
  resized WebP, so it's snapped back to its own pixel grid: 12 colours on a clear background, at 4x).
- **ui/**: `fulltime9_career_home.png` and `fulltime9_tactics.png`, the Fulltime 9 handoff's two pictures;
  `ds_tactics.webp`, the tactics screen in the DS layout (its style for the upright pitch); `ref_00` to `ref_02`, two
  screenshots and a UI kit.

The three blurry collages sent on 10 November (`ref_11` to `ref_13`) are left out, as asked.

The campus is drawn from tilesets by TerribleJared, with VeonTrainer and Ekat99, and HimuraKenshin2010's shop items.
The tilesets themselves aren't here: the pieces the game cut from them are in `game/campus`.
