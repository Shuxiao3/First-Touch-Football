// FOOTBALL CLASSIC, THE END-OF-HALF ADVANTAGE: once the clock's run out, at half time as at full time, play goes on
// while there's an attack on, and the half ends when it's dead. THE RULE (advOver, judged on set-up positions with the
// sim's clock set by hand): it's the side's that had the ball as the clock ran out; over once the other side have won
// it and kept it a second (at once outside our attacking third; won in their own attacking third it's theirs to
// finish), their keeper has it, it's out to them (or to us back in our own half), we've taken it back into our own
// third or turned back into our own half 30 m short of where we'd got, been in our own half 5 s, or it's been cleared
// out of our attacking half -- and after 20 s whatever. A shot on its way plays out, past the 20 s too, and so does the
// rebound. THE WHISTLE (the match running): an attack on at half time is played out, under HALF TIME +ADV; with none,
// it's half time at once; a goal in the first half's last play counts once and then it's half time.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={ball:()=>ball, players:()=>players, keepers:()=>keepers, simNow:()=>simNow, setNow:v=>{ simNow=v; }, FW, FH, YC, atkOf, '
  + 'adv:()=>({on:advOn, side:ADV.side, best:ADV.best}), advStart, advOver, ADV_MAX, ADV_HOLD, ADV_OWN, gk:k=>{ gkHold=k; }, restart:r=>{ restartInfo=r; }, '
  + 'half:()=>half, over:()=>matchOver, score:()=>scoreG+scoreR, breakT:()=>breakT, scored:()=>scoredT, runout:()=>{ matchClock=halfLenSec()-0.05; }, newMatch:()=>newMatch(), '
  + 'freeze:()=>{ restartT=0; offsideT=0; scoredT=0; gkHold=null; restartInfo=null; }};\n  const LAB_TITLE=');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-adv-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show'); await page.click('#exhGo'); await page.waitForTimeout(1500);

// THE RULE, on set-up positions: u is how far up the pitch toward the goal G attacks (0 its own line, 1 theirs)
const R = await page.evaluate(() => {
  const T = window.__T, b = T.ball(), out = {}, FW = T.FW, atk = T.atkOf('G');
  const xAt = u => atk > 0 ? u * FW : FW - u * FW;
  const g = T.players().find(q => q.team === 'G' && q.role === 'ATT'), r = T.players().find(q => q.team === 'R' && q.role === 'DEF'), rk = T.keepers().find(k => k.team === 'R');
  let now = 1000;
  const at = (who, u, lt) => { T.freeze(); b.x = xAt(u); b.y = T.YC; b.z = 0; b.vx = b.vy = 0; b.shotT = 0; b.ownedBy = who || null; b.lastTouch = lt || (who ? who.team : 'G'); };
  const start = (who, u) => { at(who, u); T.setNow(now += 100); T.advStart(); };
  const over = s => { T.setNow(T.simNow() + s); return !!T.advOver(); };
  // nobody's touched it: nothing to play
  at(null, 0.5, null); b.lastTouch = null; T.setNow(now += 100); T.advStart(); out.nobody = over(0);
  // ours in their third: on, at 5 s and 15 s; not at 20 s
  start(g, 0.8); out.att = [over(0), over(5), over(10), over(5.2)];
  // a shot on its way at 20 s: it plays out
  start(g, 0.85); b.shotT = 0.5; out.shotCap = over(20.5); b.shotT = 0; out.shotDone = over(0);
  // they win it in our attacking third: a second to win it back
  start(g, 0.8); b.ownedBy = r; b.lastTouch = 'R'; out.won = [over(0), over(0.6), over(0.5)];
  // ...and won straight back inside the second: on
  start(g, 0.8); b.ownedBy = r; b.lastTouch = 'R'; out.wonBack = [over(0.6), (b.ownedBy = g, b.lastTouch = 'G', over(0.6)), over(0.6)];
  // they win it in midfield: over at once
  start(g, 0.8); at(r, 0.6); out.wonMid = over(0);
  // they win it in their own attacking third: their attack to finish
  start(g, 0.5); at(r, 0.2); out.counter = [over(0), T.adv().side];
  // their keeper has it
  start(g, 0.85); T.gk(rk); out.keeper = over(0); T.gk(null);
  // a save not held: loose in the box, coming out, their keeper's touch last -- on; cleared beyond halfway -- over
  start(g, 0.85); at(null, 0.9, 'R'); b.vx = -atk * 300; out.rebound = over(0); at(null, 0.45, 'R'); b.vx = -atk * 600; out.cleared = over(0);
  // played back: into our own half 18% short of where we'd got -- over; back but still in their half -- on
  start(g, 0.8); at(g, 0.52); out.backTheirHalf = over(0); at(g, 0.55); out.backHalfway = over(0); at(g, 0.45); out.backOwnHalf = over(0);
  // in our own third: over; in our own half: on, over after 4 s there
  start(g, 0.3); out.ownThird = over(0);
  start(g, 0.45); out.ownHalf = [over(0), over(4.5), over(0.6)];
  // out of play: theirs -- over; ours in their half -- on; ours in our own half -- over
  start(g, 0.8); T.restart({ type: 'kickin', team: 'R', x: xAt(0.8), y: 16 }); out.outTheirs = over(0);
  start(g, 0.8); T.restart({ type: 'kickin', team: 'G', x: xAt(0.8), y: 16 }); out.outOurs = over(0);
  start(g, 0.8); T.restart({ type: 'kickin', team: 'G', x: xAt(0.4), y: 16 }); out.outOursDeep = over(0);
  T.freeze(); T.setNow(now + 100);
  return out;
});
info('the rule: ' + JSON.stringify(R));
ok(R.nobody === true, 'nobody has touched it: no advantage');
ok(R.att.join() === 'false,false,false,true', 'ours in their third: played on at 0, 5 and 15 s, over past 20 s (' + R.att + ')');
ok(R.shotCap === false && R.shotDone === true, 'a shot on its way plays out, past the 20 s, and then it\'s over (' + R.shotCap + ', ' + R.shotDone + ')');
ok(R.won.join() === 'false,false,true', 'they win it in our attacking third: on for a second (0, 0.6 s), then over (1.1 s) (' + R.won + ')');
ok(R.wonBack.join() === 'false,false,false', 'won straight back inside the second: played on (' + R.wonBack + ')');
ok(R.wonMid === true, 'they win it in midfield: over at once');
ok(R.counter[0] === false && R.counter[1] === 'R', 'they win it in their own attacking third: their attack now, played on (' + R.counter + ')');
ok(R.keeper === true, 'their keeper has it: over');
ok(R.rebound === false && R.cleared === true, 'a save not held: the rebound is live; once it\'s cleared out of our attacking half, over (' + R.rebound + ', ' + R.cleared + ')');
ok(R.backTheirHalf === false && R.backHalfway === false && R.backOwnHalf === true, 'played back: on while it\'s in their half, over once it\'s back in ours 30 m and more short of where we\'d got (' + [R.backTheirHalf, R.backHalfway, R.backOwnHalf] + ')');
ok(R.ownThird === true, 'in our own third: over');
ok(R.ownHalf.join() === 'false,false,true', 'in our own half: on, over after 5 s there (' + R.ownHalf + ')');
ok(R.outTheirs === true && R.outOurs === false && R.outOursDeep === true, 'out of play: theirs over, ours in their half on, ours in our own half over (' + [R.outTheirs, R.outOurs, R.outOursDeep] + ')');

// THE WHISTLE, the match running (a fresh match each time, kicked off as the game does): everyone of theirs a long way
// off, one of ours on the ball in their third as the first half's clock runs out
const fresh = () => page.evaluate(() => { const T = window.__T; T.newMatch(); T.freeze(); });
await fresh();
const H = await page.evaluate(() => new Promise(res => { const T = window.__T, b = T.ball(), FW = T.FW, atk = T.atkOf('G'), xAt = u => atk > 0 ? u * FW : FW - u * FW;
  const g = T.players().find(q => q.team === 'G' && q.role === 'ATT');
  for(const q of T.players()) if(q.team === 'R'){ q.x = xAt(0.1); q.y = 60; q.vx = q.vy = 0; }
  for(const q of T.players()) if(q.team === 'G' && q !== g){ q.x = xAt(0.3); q.y = T.FH - 60; q.vx = q.vy = 0; }
  g.x = xAt(0.75); g.y = T.YC; g.vx = g.vy = 0; b.x = g.x + atk * 20; b.y = g.y; b.z = 0; b.vx = b.vy = 0; b.shotT = 0; b.ownedBy = g; b.lastTouch = 'G';
  T.runout(); const t0 = T.simNow(), clk = document.getElementById('rClock'); let seen = null;
  (function tick(){ if(T.adv().on && !seen) seen = clk.textContent;
    if(T.simNow() - t0 < 0.4) return requestAnimationFrame(tick);
    res({ half: T.half(), on: T.adv().on, side: T.adv().side, label: seen }); })(); }));
info('an attack on at half time: ' + JSON.stringify(H));
ok(H.half === 1 && H.on && H.side === 'G' && H.label === 'HALF TIME +ADV', 'an attack on as the first half\'s clock runs out: no whistle yet, the advantage played (' + H.label + ')');
// ...and our own centre-back on it in our own third: half time at once
await fresh();
const H2 = await page.evaluate(() => new Promise(res => { const T = window.__T, b = T.ball(), FW = T.FW, atk = T.atkOf('G'), xAt = u => atk > 0 ? u * FW : FW - u * FW;
  const g = T.players().find(q => q.team === 'G' && q.role === 'DEF');
  g.x = xAt(0.2); g.y = T.YC; g.vx = g.vy = 0; b.x = g.x + atk * 20; b.y = g.y; b.z = 0; b.vx = b.vy = 0; b.shotT = 0; b.ownedBy = g; b.lastTouch = 'G';
  T.runout(); const t0 = T.simNow();
  (function tick(){ if(T.half() === 1 && T.simNow() - t0 < 1) return requestAnimationFrame(tick);
    res({ half: T.half(), after: +(T.simNow() - t0).toFixed(2), on: T.adv().on }); })(); }));
info('no attack on: ' + JSON.stringify(H2));
ok(H2.half === 2 && !H2.on && H2.after <= 0.15, 'none on (ours in our own third): half time at once (' + H2.after + ' s)');

// A GOAL IN THE FIRST HALF'S LAST PLAY: the clock run out, the advantage on, a shot struck into the net -- it counts
// once, and then it's half time (not full time)
await fresh();
const L = await page.evaluate(() => new Promise(res => { const T = window.__T, b = T.ball(), g0 = T.score(), t0 = T.simNow(), w0 = performance.now();
  for(const p of T.players().concat(T.keepers())){ p.x = T.FW / 2; p.y = 40; p.vx = p.vy = 0; }
  b.ownedBy = null; b.dribbler = null; b.inNet = 0; b.shotT = 1.1; b.lastTouch = 'G'; b.x = T.FW - 180; b.y = T.YC + 10; b.z = 0; b.vz = 0; b.vx = 950; b.vy = 0;
  T.runout(); T.advStart();
  let goalAt = null, halfAt = null;
  (function tick(){ if(T.score() > g0 && goalAt == null) goalAt = +(T.simNow() - t0).toFixed(1);
    if(T.half() === 2 && halfAt == null) halfAt = +(T.simNow() - t0).toFixed(1);
    if(T.simNow() - t0 < 5 && performance.now() - w0 < 20000) return requestAnimationFrame(tick);
    res({ goals: T.score() - g0, goalAt, halfAt, over: T.over(), on: T.adv().on }); })(); }));
info('a goal in the first half\'s last play: ' + JSON.stringify(L));
ok(L.goals === 1 && L.goalAt != null && L.halfAt != null && L.halfAt > L.goalAt && !L.over && !L.on,
  'a goal in the first half\'s last play counts once, and then it\'s half time, not full time (' + L.goalAt + ' s, ' + L.halfAt + ' s)');

process.exitCode = rep.finish();
await browser.close();
