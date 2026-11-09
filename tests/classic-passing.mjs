// FOOTBALL CLASSIC, PASSING: one-touch passes are short (only to a team-mate within the One-touch dial, 18 m; a man
// tapped further away isn't played first time; with nobody near that way it's a short ball into space, and you're put
// on whoever's best placed for it), and a pass
// played the moment you've turned to face it goes less true -- by how far you've turned over the last ~0.3 s, less the
// higher your Off IQ. The computer's through ball along the grass is never struck harder than its dial (900 px/s), and
// its weight errs with the passer's Passing. On a copy of the game that lets the test set the scene.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={players:()=>players, keepers:()=>keepers, controlled:()=>controlled, ball:()=>ball, P, FW, FH, YC, MK, passPick, passRange, gkSolvePower, turnWorst, trackFacing, oneTouchMax, passSolve, firstTouchPass, touchPass, oneTouch:()=>oneTouch, lastGrade:()=>lastGrade, obThruBall, obThruV0, '
  + 'freeze:()=>{ restartT=0; offsideT=0; scoredT=0; gkHold=null; skill=null; oneTouch=null; recvAuto=null; }};\n  const LAB_TITLE=');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-pass-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show'); await page.click('#exhGo'); await page.waitForTimeout(800);

// the scene: you in midfield facing upfield, everyone else out of the way, a ball rolling in to you
const scene = (mates) => page.evaluate(mates => { const T = window.__T, c = T.controlled(), atk = c.team === 'G' ? 1 : -1; T.freeze();
  let i = 0; for(const q of T.players()){ if(q === c) continue; q.vx = q.vy = 0; q.state = 'normal';
    if(q.team === c.team && i < mates.length){ q.x = T.FW * 0.4 + atk * mates[i][0]; q.y = T.YC + mates[i][1]; i++; }
    else { q.x = T.FW * 0.4 - atk * 900; q.y = q.team === c.team ? 120 : T.FH - 120; } }
  c.x = T.FW * 0.4; c.y = T.YC; c.vx = c.vy = 0; c.facing = { x: atk, y: 0 }; c.faceAvg = { x: atk, y: 0 };
  const b = T.ball(); b.ownedBy = null; b.dribbler = null; b.x = c.x + atk * 30; b.y = c.y; b.z = 0; b.vx = -atk * 200; b.vy = 0; b.vz = 0;
  return { atk, mates: T.players().filter(q => q.team === c.team && q !== c).slice(0, mates.length).map(q => q.lookKey ?? q.num) }; }, mates);
const strike = (dir) => page.evaluate(dir => { const T = window.__T, c = T.controlled(), b = T.ball(); T.firstTouchPass({ dir });
  const sp = Math.hypot(b.vx, b.vy), now = T.controlled();
  return { sp, ang: Math.atan2(b.vy, b.vx) * 57.3, switched: now !== c, toX: now.x - c.x, toY: now.y - c.y, max: T.oneTouchMax(), short: T.passSolve(Math.min(T.oneTouchMax(), 340)).vh }; }, dir);

// a man 14 m away that way, and one 36 m on: first time, to the near one
let s = await scene([[330, 120], [900, 0]]);
let r = await strike({ x: s.atk, y: 0 });
ok(r.switched && Math.abs(r.toX) < 400 && Math.abs(r.toY - 120) < 5, 'one-touch: to the man 14 m away, not the one 36 m on (' + (r.toX / 25).toFixed(0) + ' m)');
// only the far one that way: a short ball into space -- and you're put on whoever's best placed for it, him
s = await scene([[900, 0]]);
r = await strike({ x: s.atk, y: 0 });
ok(r.sp <= r.short * 1.05 && r.switched && Math.abs(r.toX - s.atk * 900) < 5, 'one-touch with only a man 36 m away: a short ball, struck at ' + Math.round(r.sp) + ' px/s (a ' + Math.round(Math.min(r.max, 340) / 25) + ' m pass is ' + Math.round(r.short) + '), and you\'re put on him, the man best placed for it');
// a tap on a man 36 m away with the ball coming in: not played first time
s = await scene([[900, 0], [330, 120]]);
const tap = await page.evaluate(() => { const T = window.__T, c = T.controlled(); const far = T.players().filter(q => q.team === c.team && q !== c).sort((a, b) => Math.hypot(b.x - c.x, b.y - c.y) - Math.hypot(a.x - c.x, a.y - c.y))[0];
  const b = T.ball(); b.x = c.x + (c.team === 'G' ? 1 : -1) * 200; b.vx = -(c.team === 'G' ? 1 : -1) * 500;
  const used = T.touchPass(far); return { used, queued: !!T.oneTouch(), grade: T.lastGrade() }; });
ok(tap.used && !tap.queued && /TOO FAR/.test(tap.grade), 'a tap on a man 36 m away as the ball comes in: ' + tap.grade);
// ... and on one 14 m away it is
const tap2 = await page.evaluate(() => { const T = window.__T, c = T.controlled(); const near = T.players().filter(q => q.team === c.team && q !== c).sort((a, b) => Math.hypot(a.x - c.x, a.y - c.y) - Math.hypot(b.x - c.x, b.y - c.y))[0];
  const used = T.touchPass(near); return { used, queued: !!T.oneTouch() }; });
ok(tap2.used && tap2.queued, 'a tap on the man 14 m away: queued to go first time');

// turning and passing: lined up, nothing; turned square, some; right round, the most -- and Off IQ takes it down to a fifth
const tw = await page.evaluate(() => { const T = window.__T, c = T.controlled(), atk = c.team === 'G' ? 1 : -1, deg = r => +(r * 57.3).toFixed(2), keep = c.stats.offIQ, out = {};
  c.faceAvg = { x: atk, y: 0 };
  for(const iq of [1, 10]){ c.stats.offIQ = iq; out[iq] = { ahead: deg(T.turnWorst(c, atk, 0)), slight: deg(T.turnWorst(c, Math.cos(0.3) * atk, Math.sin(0.3))), square: deg(T.turnWorst(c, 0, 1)), back: deg(T.turnWorst(c, -atk, 0)) }; }
  c.stats.offIQ = keep; out.dial = T.P.turnPassErr.val; return out; });
info(JSON.stringify(tw));
ok(tw[1].ahead === 0 && tw[1].slight === 0, 'lined up (or nearly): no turn penalty');
ok(tw[1].square > 4 && tw[1].back > tw[1].square && Math.abs(tw[1].back - tw.dial) < 0.01, 'Off IQ 1: ' + tw[1].square + ' deg at worst turned square, ' + tw[1].back + ' right round');
ok(Math.abs(tw[10].back - tw[1].back * 0.2) < 0.01 && Math.abs(tw[10].square - tw[1].square * 0.2) < 0.01, 'Off IQ 10: a fifth of it (' + tw[10].back + ' deg right round)');
// facing the new way for a moment takes it away: turned square, the penalty eases off over ~0.3 s as he keeps facing it
const ease = await page.evaluate(() => { const T = window.__T, c = T.controlled(), atk = c.team === 'G' ? 1 : -1, deg = r => +(r * 57.3).toFixed(2), out = [];
  c.facing = { x: 0, y: 1 }; c.faceAvg = { x: atk, y: 0 }; out.push(deg(T.turnWorst(c, 0, 1)));
  for(const t of [0.1, 0.2, 0.3, 0.4]){ for(let i = 0; i < Math.round(t * 60); i++) T.trackFacing(c, 1 / 60); out.push(deg(T.turnWorst(c, 0, 1))); }
  return out; });
ok(ease[0] > 0 && ease[1] < ease[0] && ease[2] < ease[1] && ease[3] < ease[0] * 0.2 && ease[4] === 0, 'turned square and held: ' + ease.join(' -> ') + ' deg after 0, 0.1, 0.3, 0.6 and 1 s');

// THE COMPUTER'S THROUGH BALL: along the grass, struck to die where the runner will be -- but never harder than the
// Computer through ball dial (900 px/s; it was 1500, and nobody could get across to it). Its weight errs with Passing:
// struck a hundred times each, a Passing 1 man's pace spreads two or three times as wide as a 10's.
const tb = await page.evaluate(() => { const T = window.__T, c = T.controlled(), mates = T.players().filter(q => q.team === c.team && q !== c), q = mates[0], b = T.ball(), keep = c.stats.passAcc, keepL = c.stats.longPass, out = {};
  T.freeze(); const ox = c.x, oy = c.y;
  const hit = (d, tA, acc) => { c.stats.passAcc = acc; c.stats.longPass = acc; c.x = ox;   // (v169: Long passing too -- an 18 m ball is three-tenths a long pass since v163, and his own Long passing left the spread by Passing on the edge of the check) c.y = oy; q.x = ox + 300; q.y = oy; q.vx = q.vy = 0; b.ownedBy = c;   // (him standing: nothing to bend it into)
    b.x = c.x + 20; b.y = c.y; b.z = 0;
    T.obThruBall(c, q, b.x + d, b.y, tA); const sp = Math.hypot(b.vx, b.vy); b.vx = b.vy = 0; return { sp, vz: b.vz }; };
  out.cap = T.P.thruPace.val; out.need = Math.round(T.obThruV0(600, 0.45).v0);
  const R = Math.random; Math.random = () => 0.5; try { out.long = hit(600, 0.45, 9); out.short = hit(220, 0.8, 9); } finally { Math.random = R; }
  out.shortNeed = Math.round(T.obThruV0(220, 0.8).v0);
  const sd = acc => { const v = []; for(let i = 0; i < 100; i++) v.push(hit(400, 0.6, acc).sp); const m = v.reduce((a, x) => a + x, 0) / v.length; return Math.sqrt(v.reduce((a, x) => a + (x - m) * (x - m), 0) / v.length) / m; };
  out.sd1 = +sd(1).toFixed(3); out.sd10 = +sd(10).toFixed(3);
  c.stats.passAcc = keep; c.stats.longPass = keepL; c.x = ox; c.y = oy; return out; });
info('the computer\'s through ball: ' + JSON.stringify(tb));
ok(tb.cap === 900 && Math.abs(tb.long.sp - 900) < 1 && tb.long.vz === 0, 'a long through ball that would need ' + tb.need + ' px/s to get there in time is struck at ' + Math.round(tb.long.sp) + ', along the grass');
ok(Math.abs(tb.short.sp - tb.shortNeed) < 1, '...a short one at what it needs (' + Math.round(tb.short.sp) + ' px/s)');
ok(tb.sd1 > 2 * tb.sd10 && tb.sd10 > 0.02, 'its weight errs with Passing: ' + Math.round(tb.sd1 * 100) + '% at 1, ' + Math.round(tb.sd10 * 100) + '% at 10');

// --- WHO YOUR PASS IS FOR (v134): the way you aim it, at the range you held PASS for -- your keeper only when it's
// plainly him. (It was the way you aimed and how free a man was, from 72 degrees either side, the range no part of it.)
const pk = await page.evaluate(() => { const T = window.__T, c = T.controlled(), atk = c.team === 'G' ? 1 : -1, M = T.MK; T.freeze();
  const mates = T.players().filter(q => q.team === c.team && q !== c), opp = T.players().filter(q => q.team !== c.team);
  const put = (q, u, w) => { q.x = c.x + atk * u * M; q.y = c.y + w * M; q.vx = q.vy = 0; };
  const clear = () => [...mates, ...opp].forEach((q, i) => { q.x = c.x + (i % 4 - 1.5) * M; q.y = i % 2 ? 40 : T.FH - 40; q.vx = q.vy = 0; });   // (out on the touchlines, square of him)
  const name = q => q ? (q.isGK ? 'GK' : mates.indexOf(q)) : 'nobody', out = {};
  c.x = T.FW * 0.5; c.y = T.YC;
  // two of yours the same way, 10 m and 30 m on: a tap to the near one, held all the way to the far one
  clear(); put(mates[0], 10, 0); put(mates[1], 30, 1);
  out.tapNear = name(T.passPick(c, atk, 0, 0.15)); out.heldFar = name(T.passPick(c, atk, 0, 1));
  // one dead ahead with a man of theirs 2 m off him, one free 30 degrees off: the one you aimed at
  clear(); put(mates[0], 18, 0); put(mates[1], 14, 8); opp[0].x = mates[0].x; opp[0].y = mates[0].y + 2 * M;
  out.aimed = name(T.passPick(c, atk, 0, (18 * M - 180) / 720));
  // the keeper: you 50 m out tapping it straight back toward him (one of yours back there too, out wide) -- not him;
  // 15 m out, aiming at him -- him; and 15 m out with one of yours 18 degrees off the line to him -- that man
  const kp = T.keepers().find(k => k.team === c.team), gx = atk > 0 ? 0 : T.FW;
  kp.x = gx + atk * 1 * M; kp.y = T.YC; kp.vx = kp.vy = 0;
  clear(); c.x = gx + atk * 50 * M; put(mates[0], -20, 18); out.tapBack50 = name(T.passPick(c, -atk, 0, 0.1));
  clear(); c.x = gx + atk * 15 * M; out.back15 = name(T.passPick(c, -atk, 0, 0.1));
  put(mates[0], -12, 4); out.back15mate = name(T.passPick(c, -atk, 0, 0.1));
  const kick = ch => { const d = T.passRange(ch), vz = Math.min(520, d * 0.22) * T.P.passLoft.val; return { d: Math.round(d / M), v: Math.round(T.gkSolvePower(d, vz)) }; };   // (as doPass strikes one to nobody)
  out.tap = kick(0.1); out.full = kick(1);
  return out; });
info('who the pass is for: ' + JSON.stringify(pk));
ok(pk.tapNear === 0 && pk.heldFar === 1, 'two of yours the same way, 10 m and 30 m on: a tap finds the near one, PASS held all the way the far one (it was the near one, held or not)');
ok(pk.aimed === 0, 'the man you aimed at, marked, not a free one 30 degrees off your line (it was the free one)');
ok(pk.tapBack50 !== 'GK' && pk.back15 === 'GK' && pk.back15mate === 0, `your keeper only when it's plainly him: tapped back toward him from 50 m, not him (${pk.tapBack50}); 15 m out aimed at him, him; one of yours 18 degrees off the line to him, that man`);
ok(pk.tap.d <= 13 && pk.full.d >= 40 && pk.tap.v < 620 && pk.tap.v < pk.full.v, `a kick to nobody dies about where you held it for: off a tap ${pk.tap.d} m away (struck at ${pk.tap.v} px/s), held all the way ${pk.full.d} m (${pk.full.v}) -- it was 620 px/s and in the air either way`);

process.exitCode = rep.finish();
await browser.close();
