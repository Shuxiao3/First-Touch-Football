// FOOTBALL CLASSIC, SAVES, REBOUNDS AND READS (v77): the keeper holds a shot only if it's slow enough and close enough to
// his body -- how slow and how close is his Handling (a dive is a stretch, a curling shot harder) -- and pushes away what
// he can't hold: wide of his near post the better his Handling, out in front of him the worse; a hard shot he only gets
// his fingertips to can go on in. Once he's pushed it away the shot's over -- anyone's ball, and he can't claim it back at
// once -- and our men in and around the box follow a shot in. Defenders read a man's run a little less (95% of it on
// the ball, 90% off it, at Def IQ 10) and less again tired. Handling is a keeper's stat like the rest (his six, his
// rating, a side's men). The end lines: a ball can't go out over them, but if it did it'd be a goal kick for the side
// whose goal it is, either half -- no corners. On a copy of the game that lets the test set the scene.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={players:()=>players, keepers:()=>keepers, ball:()=>ball, controlled:()=>controlled, P, FW, FH, YC, MK, GOAL_W, ARCH, OVR_W, atkOf, simNow:()=>simNow, gkHold:()=>gkHold, '
  + 'keeperSave, holdOdds, beatOdds, handlingOf, saveStretch, reachOf, readRun, runLeadT, legsOf, readLegs, RR:()=>RUN_READ, checkOutOfPlay, rs:()=>restartInfo, switchEnds, setControlled, shootAt, '
  + 'overallOf, gkHandlingFor, sixHtml, genStyledStats, rng32, '
  + 'freeze:()=>{ restartT=0; offsideT=0; scoredT=0; gkHold=null; skill=null; oneTouch=null; ftAim=null; recvAuto=null; }};\n  const LAB_TITLE=');
patch('    const h=handlingOf(kp), S=saveStretch(kp,dx,dy), shot=ball.shotT>0, by=ball.lastTouchP, dived=kp.diveT>0;\n',
  '    const h=handlingOf(kp), S=saveStretch(kp,dx,dy), shot=ball.shotT>0, by=ball.lastTouchP, dived=kp.diveT>0;\n    window.__ksIn={h:+h.toFixed(2),S:+S.toFixed(2),v:Math.round(v)};\n');
patch('  function keeperSave(kp,dx,dy,v){\n', '  function keeperSave(kp,dx,dy,v){ const k=keeperSave0(kp,dx,dy,v); window.__ks=k; return k; }\n  function keeperSave0(kp,dx,dy,v){\n');   // (what each save came to, wherever he made it)
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-saves-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show'); await page.click('#exhGo'); await page.waitForTimeout(1200);
await page.evaluate(() => { const T = window.__T;
  window.__park = keep => { for(const q of T.players()) if(!keep.includes(q)){ q.x = T.FW / 2 + (q.team === 'G' ? -350 : 350); q.y = 40; q.vx = q.vy = 0; q.state = 'normal'; } };
  window.__until = (secs, done, each) => new Promise(res => { const t0 = T.simNow(), w0 = performance.now();
    (function tick(){ if(each) each(); const r = done(); if(r !== undefined && r !== false) return res(r);
      if(T.simNow() - t0 > secs || performance.now() - w0 > 15000) return res(null); requestAnimationFrame(tick); })(); });
  // their keeper on his line, everything reset; his Handling set (a stat 1 to 10)
  window.__kp = hand => { const kp = T.keepers().find(k => k.team !== 'G'); T.freeze();
    kp.x = kp.homeX; kp.y = T.YC; kp.vx = kp.vy = 0; kp.mode = 'line'; kp.diveT = 0; kp.groundT = 0; kp.heldT = 0; kp.claimCd = 0; kp.reactT = 0; kp.threatActive = false; kp.beatT = 0; kp.charging = false; kp.gkRoaming = false;
    kp.stats = Object.assign({}, kp.stats, { gkHandling: hand, gkReach: 5.5, gkReflex: 5.5, gkDiveRange: 5.5, keeperSpd: 5.5 }); return kp; }; });

// --- THE HOLD WINDOW (holdOdds: h his Handling 0..1, v the shot's pace, S how far out to it 0..1) ----------------------------
let r = await page.evaluate(() => { const T = window.__T, H = T.holdOdds;
  return { slow1: H(0, 300, 0.2), fast1: H(0, 680, 0.2), fast10: H(1, 680, 0.2), fast5: H(0.5, 680, 0.2), edge5: +H(0.5, 595, 0.3).toFixed(2), stretch10: H(1, 400, 0.9),
    dive5: H(0.5, 300, 0.6), dive10: H(1, 300, 0.6), curl10: H(1, 700, 0.2, true), plain10: +H(1, 700, 0.2).toFixed(2), body1: H(0, 300, 0.45) }; });
info('hold odds: ' + JSON.stringify(r));
ok(r.slow1 === 1 && r.fast1 === 0 && r.fast10 === 1 && r.fast5 === 0, 'a slow shot (300 px/s as it gets to him) right at him is held whatever his Handling; a hard one (680) only at Handling 10, not at 5.5 or 1');
ok(r.edge5 === 0.5 && r.stretch10 === 0 && r.body1 === 0, 'at the edge of the window it\'s even money; at his fingertips not even Handling 10 holds it, and at 1 only one right at him');
ok(r.dive5 === 0 && r.dive10 === 1 && r.curl10 === 0 && r.plain10 > 0.5, 'a dive is a stretch: an average keeper can\'t hold a diving save, Handling 10 can (a slow one); a curling shot is harder to hold (700 px/s at Handling 10: ' + r.plain10 + ' straight, none curling)');

// --- IN THE MATCH: a shot struck at him, at his body or at his fingertips -------------------------------------------------
const shotAt = (hand, pace, off, n, from, react) => page.evaluate(async ({ hand, pace, off, n, from, react }) => {
  const T = window.__T, out = {}; let ins = null;
  for(let i = 0; i < n; i++){ const kp = window.__kp(hand), atk = T.atkOf('G'); window.__park([]); window.__ks = null; window.__ksIn = null;
    const b = T.ball(), o = off === 'tips' ? 0.85 * (T.reachOf(kp) + b.r) : off; b.ownedBy = null; b.dribbler = null; b.x = kp.x - atk * (from || 12) * T.MK; b.y = T.YC + o; b.z = 10; b.vz = 30; b.vx = atk * pace; b.vy = 0;
    b.shotT = 1.1; b.shotBy = 'G'; b.lastTouch = 'G'; b.crossT = 0; b.curveSpinT = 0; kp.reactT = 0; kp.threatActive = !react;   // (react: his reaction gap, as a shot's struck,
    if(react) kp.claimCd = 2;                                                                                              //  and him on his line, not coming for it)
    const k = await window.__until(1.5, () => window.__ks || (T.gkHold() ? 'claimed' : undefined));
    out[k || 'none'] = (out[k || 'none'] || 0) + 1; ins = window.__ksIn || ins; }
  return { out, ins };
}, { hand, pace, off, n, from, react });
const at1 = await shotAt(1, 420, 0, 6), at10f = await shotAt(10, 700, 0, 6), at1f = await shotAt(1, 700, 0, 6), tips = await shotAt(10, 700, 'tips', 6, 8, true);
info('at him: ' + JSON.stringify({ at1, at10f, at1f, tips }));
ok((at1.out.hold || 0) + (at1.out.claimed || 0) === 6, 'a soft shot straight at a Handling 1 keeper: held, every time');
ok(at10f.out.hold === 6 && !at1f.out.hold, 'a hard one straight at him (700 px/s): Handling 10 holds it every time, Handling 1 never does');
ok(!tips.out.hold && Object.values(tips.out).reduce((a, b) => a + b, 0) === 6 && tips.ins.S >= 0.8, 'a hard one from 8 m passing at the end of his reach, too quick to get across to: even Handling 10 can\'t hold it (' + JSON.stringify(tips.out) + ', ' + tips.ins.S + ' of the way out)');

// --- WHERE IT GOES: wide of his post the better his Handling, in front of him the worse; never in -----------------------
const rebound = hand => page.evaluate(hand => { const T = window.__T, R = { wide: 0, front: 0, inside: 0, n: 0, short: 0 };
  for(let i = 0; i < 200; i++){ const kp = window.__kp(hand), atk = T.atkOf('G'), b = T.ball(), glX = kp.side < 0 ? 0 : T.FW, sd = i % 2 ? 1 : -1;
    const off = sd * T.reachOf(kp) * 0.5; b.ownedBy = null; b.x = kp.x; b.y = kp.y + off; b.z = 10; b.vx = atk * 900; b.vy = 0; b.vz = 0; b.shotT = 1.1; b.shotBy = 'G'; b.lastTouch = 'G';
    const k = T.keeperSave(kp, b.x - kp.x, b.y - kp.y, 900); R.n++; if(k === 'wide') R.wide++; else if(k === 'front') R.front++;
    // where it crosses his line (a wide one), or how far out it goes (one in front)
    if(k === 'wide'){ const t = (glX - b.x) / (b.vx || 1e-9), y = b.y + b.vy * t; if(!(t > 0) || Math.abs(y - T.YC) < T.GOAL_W / 2) R.inside++; }
    if(k === 'front' && !((b.vx * kp.side) < 0)) R.short++; }
  return R; }, hand);
const rb1 = await rebound(1), rb55 = await rebound(5.5), rb10 = await rebound(10);
info('rebounds (wide / in front of 200): ' + JSON.stringify({ rb1, rb55, rb10 }));
ok(rb10.wide >= 160 && rb1.wide <= 50 && rb55.wide > rb1.wide && rb55.wide < rb10.wide, 'what he can\'t hold he pushes wide of his post the better his Handling: ' + rb1.wide + ' of 200 at 1, ' + rb55.wide + ' at 5.5, ' + rb10.wide + ' at 10; the rest out in front of him');
ok(rb1.inside + rb55.inside + rb10.inside === 0 && rb1.short + rb55.short + rb10.short === 0, 'one pushed wide crosses his line outside the post, never inside it; one in front goes out away from his goal');

// --- AFTER IT: the shot's over, anyone's ball; he can't claim it back at once -------------------------------------------
r = await page.evaluate(() => { const T = window.__T, kp = window.__kp(5.5), atk = T.atkOf('G'), b = T.ball(), sh = T.players().find(q => q.team === 'G');
  b.ownedBy = null; b.x = kp.x; b.y = kp.y; b.vx = atk * 900; b.vy = 0; b.z = 10; b.shotT = 1.1; b.shotBy = 'G'; b.lastTouch = 'G'; b.lastTouchP = sh;
  const k = T.keeperSave(kp, 0, 0, 900); return { k, shotT: b.shotT, shotBy: b.shotBy, lt: b.lastTouch === kp.team, ltp: b.lastTouchP === sh, cd: +kp.claimCd.toFixed(2) }; });
info('after a parry: ' + JSON.stringify(r));
ok(r.k !== 'hold' && r.shotT === 0 && r.shotBy === null && r.lt && r.ltp && r.cd >= 0.4, 'pushed away, the shot\'s over -- a loose ball the shooter\'s team-mates can go for (one that goes in off him still the shooter\'s goal) -- and he can\'t claim it back for a moment');

// --- NOT ENOUGH: a hard shot at his fingertips can go on in ----------------------------------------------------------------
r = await page.evaluate(() => { const T = window.__T, B = T.beatOdds;
  const odds = { body: B(0, 850, 0.5), slow: B(0, 450, 1), full1: +B(0, 800, 1).toFixed(2), full10: +B(1, 800, 1).toFixed(2), dive: +B(0.667, 730, 0.7).toFixed(3), part: +B(0.5, 500, 0.9).toFixed(2) };
  let beat = 0, on = 0; for(let i = 0; i < 300; i++){ const kp = window.__kp(1), atk = T.atkOf('G'), b = T.ball(), R = T.reachOf(kp) + b.r;
    b.ownedBy = null; b.x = kp.x; b.y = kp.y + R * 0.99; b.z = 10; b.vx = atk * 850; b.vy = 0; b.vz = 0; b.shotT = 1.1; b.shotBy = 'G'; b.lastTouch = 'G'; const sp0 = Math.hypot(b.vx, b.vy);
    if(T.keeperSave(kp, b.x - kp.x, b.y - kp.y, 850) === 'beaten'){ beat++; if(b.vx * atk > 0 && b.shotT > 0 && Math.hypot(b.vx, b.vy) < sp0) on++; } }
  return { odds, beat, on }; });
info('fingertips: ' + JSON.stringify(r));
ok(r.odds.body === 0 && r.odds.slow === 0 && r.odds.full1 === 0.6 && r.odds.full10 === 0.36 && r.odds.part > 0 && r.odds.part < 0.2 && r.odds.dive > 0.05 && r.odds.dive < 0.15, 'never at his body or from a soft one; a hard one (800 px/s as it gets to him) at full stretch beats him up to 60% of the time at Handling 1, 36% at 10; a long dive to a 730 px/s shot, an average keeper (7): ' + r.odds.dive);
ok(r.beat >= 140 && r.beat <= 220 && r.on === r.beat, 'and in the match: ' + r.beat + ' of 300 of the hardest at his fingertips (Handling 1) went on, slower, still a shot');

// --- FOLLOWING IT IN: a team-mate's shot, and our man in the box goes in after it -----------------------------------------
r = await page.evaluate(async () => { const T = window.__T, atk = T.atkOf('G'), gx = atk > 0 ? T.FW : 0, kp = window.__kp(5.5);
  const G = T.players().filter(q => q.team === 'G'), sh = G.find(q => q.role === 'MID') || G[1], fw = G.find(q => q.role === 'ATT' && q !== sh), you = G.find(q => q !== sh && q !== fw);
  window.__park([sh, fw]); T.setControlled(you); you.x = T.FW / 2 - atk * 400; you.y = 40;
  sh.x = gx - atk * 20 * T.MK; sh.y = T.YC - 60; fw.x = gx - atk * 14 * T.MK; fw.y = T.YC + 140; for(const q of [sh, fw]){ q.vx = q.vy = 0; q.state = 'normal'; q.stamina = q.staminaCap = 1; }
  const b = T.ball(); b.ownedBy = null; b.dribbler = null; b.x = sh.x + atk * 20; b.y = sh.y; b.z = 0;
  const d0 = Math.abs(gx - fw.x); T.shootAt(sh, atk, 0, 0.8, 0); let tag = null;
  await window.__until(0.4, () => undefined, () => { if(fw.dbgTag === 'FOLLOW-IN') tag = 'FOLLOW-IN'; });
  return { tag, in: Math.round((d0 - Math.abs(gx - fw.x)) / T.MK * 10) / 10 }; });
info('following in: ' + JSON.stringify(r));
ok(r.tag === 'FOLLOW-IN' && r.in > 1, 'a team-mate shoots from 20 m: our forward 14 m out goes in after it (' + r.in + ' m nearer in the first 0.4 s)');

// --- READS: a man's run read 95% of the way on the ball, 90% off it, at Def IQ 10 -- less again tired --------------------
r = await page.evaluate(() => { const T = window.__T, d = T.players().find(q => q.team === 'R' && q.role === 'DEF'), c = T.players().find(q => q.team === 'G');
  const keep = { d: d.stats, x: d.x, y: d.y, cx: c.x, cy: c.y, cvx: c.vx, cvy: c.vy, st: d.stamina, cap: d.staminaCap };
  d.stats = Object.assign({}, d.stats, { defIQ: 10 }); d.slotAtk = null; d.x = T.FW / 2; d.y = T.YC - 200; c.x = T.FW / 2 - 300; c.y = T.YC; c.vx = 200; c.vy = 0;
  const share = off => { const t = T.runLeadT(d, c), r = T.readRun(d, c, c, off); return +((r.x - c.x) / (c.vx * t)).toFixed(3); };
  d.stamina = 1; d.staminaCap = 1; const on = share(false), off = share(true);
  d.stamina = 0.55; d.staminaCap = 0.6; const legs = +T.legsOf(d).toFixed(3), tOn = share(false), tOff = share(true);
  d.stats = keep.d; d.x = keep.x; d.y = keep.y; c.x = keep.cx; c.y = keep.cy; c.vx = keep.cvx; c.vy = keep.cvy; d.stamina = keep.st; d.staminaCap = keep.cap;
  return { on, off, legs, tOn, tOff, RR: T.RR() }; });
info('reads: ' + JSON.stringify(r));
ok(r.on === 0.95 && r.off === 0.9, 'Def IQ 10, fresh: he reads 95% of the way along a man\'s run with the ball, 90% of a runner\'s without it');
ok(Math.abs(r.tOn - 0.95 * (1 - 2 * (1 - r.legs))) < 0.002 && r.tOn < 0.62 && r.tOff < r.tOn, 'tired (his legs at ' + r.legs + ' of his top speed) he reads twice as much less: ' + r.tOn + ' on the ball, ' + r.tOff + ' off it');

// --- HANDLING, THE STAT ---------------------------------------------------------------------------------------------------
r = await page.evaluate(() => { const T = window.__T, R = T.rng32(7), hs = [];
  for(let i = 0; i < 60; i++){ const st = T.genStyledStats('GK', undefined, R, 0); hs.push(st.gkHandling); }
  const st = { keeperSpd: 6, gkReflex: 8, gkReach: 7.5, gkDiveRange: 6.5, gkDistribution: 5, composure: 6, ballControl: 5 }, w0 = { gkReflex: 3, gkReach: 3, gkDiveRange: 2, keeperSpd: 1, gkDistribution: 2 };
  let s = 0, t = 0; for(const k in w0){ s += st[k] * w0[k]; t += w0[k]; } const before = Math.round(s / t * 10);
  const filled = Object.assign({ gkHandling: T.gkHandlingFor(st) }, st), after = T.overallOf({ role: 'GK', stats: filled });
  const six = T.sixHtml(filled, 'GK');
  return { arch: T.ARCH.GK.gkHandling, w: T.OVR_W.GK.gkHandling, mean: +(hs.reduce((a, b) => a + b, 0) / hs.length).toFixed(2), halves: hs.every(v => v * 2 === Math.round(v * 2) && v >= 1 && v <= 10),
    before, after, fill: filled.gkHandling, han: /data-six="HAN"/.test(six), cmp: /data-six="CMP"/.test(six), kicks: /data-six="KIC"/.test(six), dial: T.P.gkHandling.val }; });
info('handling: ' + JSON.stringify(r));
ok(r.arch === 7 && r.w === 2 && r.dial === 5.5 && Math.abs(r.mean - 7) < 0.6 && r.halves, 'Handling is a keeper\'s stat: 7 for an average side\'s, in half points (60 drawn: ' + r.mean + ' on average), weighed in his rating as Diving is');
ok(r.before === r.after && r.han && r.kicks && !r.cmp, 'a keeper made before it gets his from the rest of his keeping (' + r.fill + '), his rating unchanged (' + r.after + '); his six: DIV REF REA SPD KIC HAN');

// --- THE END LINES: a goal kick for the side whose goal it is, either half -- no corners ----------------------------------
r = await page.evaluate(() => { const T = window.__T, b = T.ball(), res = [];
  const out = (x, last) => { T.freeze(); b.ownedBy = null; b.x = x; b.y = T.YC + 200; b.vx = b.vy = 0; b.z = 0; b.lastTouch = last; T.checkOutOfPlay(); const s = T.rs(); return s ? s.type + ':' + s.team : 'none'; };
  res.push(out(-10, 'G'), out(-10, 'R'), out(T.FW + 10, 'R'), out(T.FW + 10, 'G')); T.switchEnds(); res.push(out(-10, 'G'), out(T.FW + 10, 'R')); T.switchEnds(); T.freeze(); return res; });
info('end lines: ' + JSON.stringify(r));
ok(r.join(' ') === 'goalkick:G goalkick:G goalkick:R goalkick:R goalkick:R goalkick:G', 'over an end line, whoever touched it last: a goal kick for the side whose goal it is -- and after half-time the other side\'s (' + r.join(' ') + ')');

process.exitCode = rep.finish();
await browser.close();
