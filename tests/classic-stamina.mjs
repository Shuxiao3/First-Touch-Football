// FOOTBALL CLASSIC, STAMINA (v121, v123). A SPRINT'S COST: what tires a man is the ground he covers flat out, not the
// seconds -- the same metre costs the same whoever runs it: a Speed 6.5 man pays what a second flat out cost anyone
// before v121, the quickest a fifth more, a slow one about a quarter less -- and the ceiling under his bar wears the
// same way. HALF TIME gives back half of what the half took from the ceiling (it was a quarter). So after a half on the
// computer the sides are tired but not spent. PACING: a computer player
// whose ceiling has begun to go (under CAP_SAVE) saves his sprints for what matters -- none of the opportunistic ones,
// the critical ones still. THE LAST OF HIS LEGS: no slide tackle on an empty bar; one off the end of a sprint, on what's
// left -- it takes the last of it -- and then none till a quarter of the bar is back; the computer's men the same.
// On a copy of the game that lets the test pause it, step a man by hand, play it all on the computer, see each
// half-time's ceilings and count the computer's sprint calls.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={players:()=>players, controlled:()=>controlled, ball:()=>ball, P, MK, FW, FH, YC, stepOutfield, statOf, drainSprintOf, staminaCapDrainOf, sprintSpeedOf, '
  + 'startSlide, slideAt, canSlide, resetKickoff, get SPRINT_TOP(){ return SPRINT_TOP; }, get CAP_WEAR(){ return CAP_WEAR; }, capRate:()=>capRate(), halfLenSec:()=>halfLenSec(), PREFS, get CAP_SAVE(){ return CAP_SAVE; }, get SLIDE_BACK(){ return SLIDE_BACK; }, grade:()=>lastGrade, half:()=>half, clock:()=>matchClock, pause:v=>{ pauseOpen=v; }, setControlled, '
  + 'freeze:()=>{ restartT=0; offsideT=0; scoredT=0; gkHold=null; skill=null; oneTouch=null; ftAim=null; recvAuto=null; }};\n  const LAB_TITLE=');
patch('      if(p===controlled){ if(!skillStep(p,dt)) stepOutfield(p,hi.ix,hi.iy,dt); }', '      if(p===controlled&&!window.__aiAll){ if(!skillStep(p,dt)) stepOutfield(p,hi.ix,hi.iy,dt); }');   // your man on the computer too
patch('\n    draw();\n', '\n    if(!window.__noDraw) draw();\n');   // (nothing drawn: quicker)
// each half-time: every outfield man's ceiling as the half ended, and as the break left it
patch('    if(half===1){\n      half=2; matchClock=0; breakT=2.2;', '    if(half===1){\n      if(window.__HT) window.__HT.before=players.filter(q=>!q.isGK).map(q=>q.staminaCap);\n      half=2; matchClock=0; breakT=2.2;');
patch("      resetKickoff(); lastGrade='HALF TIME';", "      if(window.__HT) window.__HT.after=players.filter(q=>!q.isGK).map(q=>q.staminaCap);\n      resetKickoff(); lastGrade='HALF TIME';");
// the computer's sprint calls, by whether his ceiling is under CAP_SAVE: the critical ones he made, the opportunistic
// ones he made, and the opportunistic ones he'd have made with fresh legs (plenty in the bar)
patch('        p.sprint = reacting ? false : (doSprint && (ai.ix||ai.iy));',
  "        if(window.__PC&&!reacting&&(ai.ix||ai.iy)&&!p.planned){ const g=window.__PC[(p.staminaCap??1)<CAP_SAVE?'tired':'fresh']; g.n++; if(doSprint&&critical) g.crit++; else if(doSprint) g.opp++; if(!critical&&opportunistic&&sta>0.55) g.oppWant++; }\n"
  + '        p.sprint = reacting ? false : (doSprint && (ai.ix||ai.iy));');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-stamina-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ fastFrames: true, url: 'file://' + copy });
const { ok, info } = rep;
await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show'); await page.click('#exhGo'); await page.waitForTimeout(800);

// --- A SPRINT'S COST: one man flat out for two seconds (up to his top speed), then a second more measured -- a quick
// man (Speed 10) and a slow one (Speed 2), Stamina 5.5 both, the game paused and him stepped by hand --------------------
const A = await page.evaluate(() => {
  const T = window.__T; T.pause(true); T.freeze();
  const G = T.players().filter(q => q.team === 'G' && !q.isGK && q !== T.controlled()), p = G[0], keep = { stats: p.stats, x: p.x, y: p.y };
  const bl = T.ball(); bl.ownedBy = null; bl.x = 40; bl.y = 40; bl.vx = bl.vy = 0;
  const run = spd => { p.stats = Object.assign({}, keep.stats, { speed: spd, stamina: 5.5 }); p.x = 160; p.y = T.YC; p.vx = p.vy = 0; p.state = 'normal'; p.stamina = p.staminaCap = 1; p.gassed = false; p.goingForBall = p.intercepting = false; p.engageCap = 1;   // (no burst for a ball: his own top speed)
    const dt = 1 / 60; for(let i = 0; i < 120; i++){ p.sprint = true; T.stepOutfield(p, 1, 0, dt); }
    p.stamina = p.staminaCap = 1; const x0 = p.x;
    for(let i = 0; i < 60; i++){ p.sprint = true; T.stepOutfield(p, 1, 0, dt); }
    const m = (p.x - x0) / T.MK, bar = 1 - p.stamina, cap = 1 - p.staminaCap;
    return { m: +m.toFixed(2), bar: +bar.toFixed(4), cap: +cap.toFixed(5), perM: +(bar / m).toFixed(5), top: T.sprintSpeedOf(p), was: +T.drainSprintOf(p).toFixed(4), wasCap: +(0.007 * T.staminaCapDrainOf(p)).toFixed(5), nowCap: +(T.CAP_WEAR * T.capRate() * T.staminaCapDrainOf(p)).toFixed(5) }; };
  const fast = run(10), mid = run(6.5), slow = run(2);
  p.stats = keep.stats; p.x = keep.x; p.y = keep.y; p.vx = p.vy = 0; p.sprint = false; p.stamina = p.staminaCap = 1;
  return { fast, mid, slow };
});
info('a second flat out: ' + JSON.stringify(A));
// (v136) THE HALF'S LENGTH: 4 minutes unless you pick another, and the ceiling worn as a 3-minute half wears it over the
// match -- a second of it three quarters as fast at 4 minutes, three fifths at 5, CAP_WEAR at 3
const HL = await page.evaluate(() => { const T = window.__T, was = T.P.halfMin.val, r = {};
  r.def = T.P.halfMin.val; r.secs = T.halfLenSec();
  for(const m of [3, 4, 5]){ T.P.halfMin.val = m; r['k' + m] = +T.capRate().toFixed(3); }
  T.P.halfMin.val = was; return r; });
info('the half: ' + JSON.stringify(HL));
ok(HL.def === 4 && HL.secs === 240 && HL.k3 === 1 && HL.k4 === 0.75 && HL.k5 === 0.6, 'a half is 4 minutes unless you pick another (it was 3), and its ceiling wears as a 3-minute half\'s over the match: ' + HL.k4 + ' as fast a second at 4, ' + HL.k5 + ' at 5 (v136)');
ok(Math.abs(A.mid.bar / A.mid.was - 1) < 0.08 && Math.abs(A.mid.cap / A.mid.nowCap - 1) < 0.08,
  'a Speed 6.5 man (' + A.mid.m + ' m in the second flat out) pays what a second cost anyone before v121 (' + A.mid.bar + ' of his bar, against ' + A.mid.was + '), his ceiling ' + A.mid.cap + ' a second');
ok(A.fast.bar / A.fast.was >= 1.1 && A.fast.bar / A.fast.was <= 1.25 && A.slow.bar / A.slow.was >= 0.65 && A.slow.bar / A.slow.was <= 0.85,
  'the quickest (Speed 10, ' + A.fast.m + ' m) pays about a fifth more a second (' + A.fast.bar + '), a slow man (Speed 2, ' + A.slow.m + ' m) about a quarter less (' + A.slow.bar + ')');
ok([A.fast, A.slow].every(x => Math.abs(x.perM / A.mid.perM - 1) < 0.05) && A.slow.cap < A.mid.cap && A.mid.cap < A.fast.cap,
  'a metre flat out costs the same whoever runs it (' + [A.fast.perM, A.mid.perM, A.slow.perM].join(', ') + ' of the bar), and the ceiling wears in step (' + [A.fast.cap, A.mid.cap, A.slow.cap].join(', ') + ' a second)');

// --- THE LAST OF HIS LEGS: one of theirs on the ball 30 px in front of your man, the game paused -----------------------
const L = await page.evaluate(() => {
  const T = window.__T; T.pause(true); T.freeze();
  const ps = T.players(), me = T.controlled(), R = ps.filter(q => q.team === 'R' && !q.isGK), o = R[0], bl = T.ball(), out = {};
  const scene = st => { me.x = T.FW / 2; me.y = T.YC; me.vx = me.vy = 0; me.state = 'normal'; me.tackleCd = 0; me.facing = { x: 1, y: 0 }; me.stamina = st; me.staminaCap = 1;
    o.x = me.x + 30; o.y = me.y; o.vx = o.vy = 0; o.state = 'normal'; bl.ownedBy = o; bl.x = o.x - 8; bl.y = o.y; bl.z = 0; bl.vx = bl.vy = 0; T.freeze(); };
  const tryIt = () => { const st0 = me.stamina; T.startSlide(me); const went = me.state === 'slide'; const r = { went, from: +st0.toFixed(2), left: +me.stamina.toFixed(2), gassed: !!me.gassed, says: T.grade() };
    me.state = 'normal'; me.tackleCd = 0; me.vx = me.vy = 0; return r; };
  // an empty bar: nothing
  scene(0); me.gassed = true; out.empty = tryIt();
  // the end of a sprint, a little left: the slide goes, on the last of it -- then not again
  scene(0.1); me.gassed = false; out.last = tryIt(); out.again = tryIt();
  me.stamina = 0.2; out.at20 = tryIt(); me.stamina = 0.3; out.at30 = tryIt();
  // plenty in the bar: a slide a time, each 0.16 of it, till the last
  scene(0.6); me.gassed = false; out.run = []; for(let i = 0; i < 6; i++){ const r = tryIt(); out.run.push(r.went ? r.left : 'no'); if(!r.went) break; }
  // a sprint run till the bar's empty: no slide till a quarter's back
  const q = ps.filter(x => x.team === 'G' && !x.isGK && x !== me)[1]; q.x = 200; q.y = T.YC - 200; q.vx = q.vy = 0; q.state = 'normal'; q.stamina = 0.1; q.staminaCap = 1; q.gassed = false;
  for(let i = 0; i < 240 && q.stamina > 0.02; i++){ q.sprint = true; T.stepOutfield(q, 1, 0, 1 / 60); } q.sprint = true; T.stepOutfield(q, 1, 0, 1 / 60);
  out.sprint = { empty: +q.stamina.toFixed(2), gassed: !!q.gassed, can0: T.canSlide(q) }; q.stamina = 0.24; out.sprint.can24 = T.canSlide(q); q.stamina = 0.26; out.sprint.can26 = T.canSlide(q);
  q.sprint = false; q.stamina = q.staminaCap = 1;
  // the computer's man: one of yours on the ball 25 px from one of theirs
  const c = ps.filter(x => x.team === 'G' && !x.isGK && x !== me)[2], d = R[1];
  const theirs = st => { c.x = T.FW / 2; c.y = T.YC + 150; c.vx = c.vy = 0; c.state = 'normal'; bl.ownedBy = c; bl.x = c.x + 8; bl.y = c.y; bl.z = 0; bl.vx = bl.vy = 0;
    d.x = c.x + 33; d.y = c.y; d.vx = d.vy = 0; d.state = 'normal'; d.tackleCd = 0; d.facing = { x: -1, y: 0 }; d.stamina = st; d.staminaCap = 1; d.gassed = st <= 0.02; T.freeze();
    let went = false; for(let k = 0; k < 20 && !went; k++){ T.slideAt(d, c); went = d.state === 'slide'; } const r = { went, left: +d.stamina.toFixed(2) }; d.state = 'normal'; d.vx = d.vy = 0; return r; };
  out.cpuEmpty = theirs(0); out.cpuFull = theirs(0.6);
  for(const x of ps){ x.stamina = x.staminaCap = 1; x.gassed = false; x.state = 'normal'; x.vx = x.vy = 0; }
  return out;
});
info('slides: ' + JSON.stringify(L));
ok(!L.empty.went && L.empty.says === 'TOO TIRED TO SLIDE', 'an empty bar: no slide -- TOO TIRED TO SLIDE');
ok(L.last.went && L.last.left === 0 && L.last.gassed && !L.again.went, 'the end of a sprint (0.1 left): one last-ditch slide, on the last of it (' + L.last.left + ' left) -- and then not again');
ok(!L.at20.went && L.at30.went, 'none till a quarter of the bar is back: not at 0.2, at 0.3 yes');
ok(L.run.join() === '0.44,0.28,0.12,0,no', 'with plenty in the bar, a slide costs 0.16 of it, again and again, the last on what\'s left -- then none (' + L.run.join(', ') + ')');
ok(L.sprint.empty <= 0.02 && L.sprint.gassed && !L.sprint.can0 && !L.sprint.can24 && L.sprint.can26, 'sprinting till the bar\'s empty: no slide, not at 0.24 back, at 0.26 yes');
ok(!L.cpuEmpty.went && L.cpuFull.went, 'the computer\'s man the same: on an empty bar he doesn\'t go to ground; with 0.6 he does');

// --- A HALF ON THE COMPUTER: from the kick-off, everyone on the computer, to half-time ---------------------------------
await page.evaluate(() => { const T = window.__T; for(const x of T.players()){ x.stamina = x.staminaCap = 1; x.gassed = false; } T.resetKickoff();
  window.__aiAll = true; window.__noDraw = true; window.__HT = {}; window.__PC = { tired: { n: 0, crit: 0, opp: 0, oppWant: 0 }, fresh: { n: 0, crit: 0, opp: 0, oppWant: 0 } }; T.pause(false); });
const t0 = Date.now();
while(Date.now() - t0 < 300000){ await page.waitForTimeout(1000); if(await page.evaluate(() => window.__T.half() === 2)) break; }
const H = await page.evaluate(() => ({ HT: window.__HT, PC: window.__PC, secs: Math.round((Date.now() - 0) / 1000) }));
const b = H.HT.before || [], a = H.HT.after || [], mean = x => x.reduce((s, y) => s + y, 0) / (x.length || 1);
const back = b.map((x, i) => a[i] - x - 0.5 * (1 - x));
info('half time: ceilings as the half ended ' + b.map(x => x.toFixed(2)).join(' ') + ' -> after the break ' + a.map(x => x.toFixed(2)).join(' '));
ok(b.length >= 12 && mean(b) >= 0.68 && mean(b) <= 0.8 && Math.min(...b) >= 0.33,
  'after a half on the computer, tired but not spent: the ceiling ' + mean(b).toFixed(2) + ' on average, ' + Math.min(...b).toFixed(2) + ' at the lowest -- the quick forwards who sprint most (v120: about 0.66 and 0.44; v121: 0.84 and 0.7)');
ok(b.length === a.length && back.every(x => Math.abs(x) < 0.005), 'half-time gives back half of what the half took from each man\'s ceiling (it was a quarter)');
const P1 = H.PC, share1 = (P1.fresh.crit + P1.fresh.opp + P1.tired.crit + P1.tired.opp) / Math.max(1, P1.fresh.n + P1.tired.n);
info('the first half\'s sprint calls: ' + JSON.stringify(P1) + ' -- sprinting ' + (share1 * 100).toFixed(1) + '% of the computer\'s moves');

// --- PACING: into the second half with every other man's ceiling at 0.7 (under CAP_SAVE), the rest fresh; 40 s ----------
await page.evaluate(() => { const T = window.__T; T.players().filter(x => !x.isGK).forEach((x, i) => { x.staminaCap = i % 2 ? 0.7 : 1; x.stamina = x.staminaCap; });
  window.__PC = { tired: { n: 0, crit: 0, opp: 0, oppWant: 0 }, fresh: { n: 0, crit: 0, opp: 0, oppWant: 0 } };
  // (the tired keep under it, the fresh over it: a ceiling only goes down in play, and not far in 40 s)
  window.__t2 = window.__T.clock(); });
const t1 = Date.now();
while(Date.now() - t1 < 200000){ await page.waitForTimeout(1000); if(await page.evaluate(() => window.__T.clock() - window.__t2 >= 40)) break; }
const PC = await page.evaluate(() => window.__PC);
info('the second half\'s first 40 s, the computer\'s sprint calls: ' + JSON.stringify(PC));
ok(PC.tired.oppWant > 0 && PC.tired.opp === 0 && PC.tired.crit > 0,
  'a man whose legs have begun to go saves them: none of the opportunistic sprints he\'d have made fresh (' + PC.tired.oppWant + ' passed up), the critical ones still (' + PC.tired.crit + ')');
ok(PC.fresh.opp > 0 && PC.fresh.crit > 0, 'the fresh ones make both (' + PC.fresh.opp + ' opportunistic, ' + PC.fresh.crit + ' critical)');
ok(await page.evaluate(() => !window.__afErr), 'no frame errors');

process.exitCode = rep.finish();
await browser.close();
