// FOOTBALL CLASSIC, THE GOAL, CELEBRATED and SIM THE REST (v106). A goal of theirs: GOAL, big, play held a moment. One of
// yours: GOAL! grander, and a celebration as big as the goal -- small (early, or one more on a lead: he runs a few strides
// toward the corner flag, the two nearest get to him), big (level or in front in the second half: off toward the flag,
// everyone after him, EQUALISER! / IN FRONT!, confetti), epic (the winner at the death: a knee slide, the whole team and
// the keeper, WINNER!). The clock stopped through it; the side that conceded kicks off after; nobody left in the air.
// And SIM THE REST, from the pause menu: the rest of the match simulated, straight to full time.
// On a copy of the game that lets the test set the scene.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={players:()=>players, keepers:()=>keepers, ball:()=>ball, goal, FW, FH, YC, MK, gDir:()=>gDir, celeb:()=>celeb, scoredT:()=>scoredT, simNow:()=>simNow, halfLenSec, '
  + 'clock:()=>matchClock, half:()=>half, over:()=>matchOver, reopen:()=>{ matchOver=false; breakT=0; }, score:()=>[scoreG,scoreR], log:()=>goalLog, kick:()=>({by:kickBy, t:kickT}), simRest, '
  + 'set:o=>{ if(o.half!=null) half=o.half; if(o.clock!=null) matchClock=o.clock; if(o.g!=null) scoreG=o.g; if(o.r!=null) scoreR=o.r; }, '
  + 'freeze:()=>{ restartT=0; offsideT=0; scoredT=0; gkHold=null; kickT=0; kickBy=null; kickTo=null; restartInfo=null; }};\n  const LAB_TITLE=');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-celebrate-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show'); await page.click('#exhGo'); await page.waitForTimeout(1500);

// a goal, set up: your men near their goal (the scorer 8 m out), the ball in the net; then followed till play's on again
const goal = o => page.evaluate(o => new Promise(res => { const T = window.__T, b = T.ball(); T.freeze(); T.set(o);
  const G = T.players().filter(p => p.team === 'G'), gx = T.gDir() > 0 ? T.FW : 0;
  if(!o.theirs) G.forEach((p, i) => { p.x = gx - T.gDir() * (8 + 4 * i) * T.MK; p.y = T.YC + ((i % 3) - 1) * 9 * T.MK; p.vx = p.vy = 0; });
  const side = o.theirs ? -T.gDir() : T.gDir(), sc = o.theirs ? T.players().find(p => p.team === 'R') : G[0];
  Object.assign(b, { ownedBy: null, x: side > 0 ? T.FW + 12 : -12, y: T.YC, z: 0, vx: side * 50, vy: 0, vz: 0, lastTouchP: sc, prevTouchP: o.theirs ? null : G[1] });
  const x0 = sc.x, y0 = sc.y, clk0 = T.clock(); T.goal(side); const C = T.celeb();
  const out = { tier: C && C.tier, team: C && C.team, men: C && C.men ? C.men.length : 0, held: +T.scoredT().toFixed(2), keeper: !!(C && C.men && C.men.some(M => M.keeper)), conf: C ? C.conf.length : 0,
    run: C && C.sx != null ? +(Math.hypot(C.sx - x0, C.sy - y0) / T.MK).toFixed(1) : null, slid: false, arrived: 0, maxZ: 0, clockMoved: false, t0: T.simNow() };
  const want = C && C.sx != null ? { x: C.sx, y: C.sy } : null, hero = C && C.hero;
  (function tick(){ const c = T.celeb();
    if(c){ if(hero && hero.celebSlide) out.slid = true; out.maxZ = Math.max(out.maxZ, ...T.players().map(p => p.z || 0)); if(T.clock() !== clk0) out.clockMoved = true;
      if(want && hero) out.heroGap = +Math.hypot(hero.x - want.x, hero.y - want.y).toFixed(1);
      if(c.men) out.arrived = c.men.filter(M => Math.hypot(M.p.x - (c.sx + M.ox), M.p.y - (c.sy + M.oy)) < 10).length; }
    if(T.scoredT() > 0) return requestAnimationFrame(tick);
    out.secs = +(T.simNow() - out.t0).toFixed(1); out.after = { celeb: !!T.celeb(), z: Math.max(...T.players().map(p => p.z || 0)), slide: T.players().some(p => p.celebSlide), kicker: T.kick().by && T.kick().by.team };
    res(out); })(); }), o);

const L = await page.evaluate(() => window.__T.halfLenSec());
const th = await goal({ half: 1, clock: 40, g: 0, r: 0, theirs: true });
info('theirs: ' + JSON.stringify(th));
ok(th.team === 'R' && th.men === 0 && th.held === 1.8 && th.after.kicker === 'G' && !th.clockMoved, 'a goal of theirs: GOAL, play held ' + th.held + ' s (nobody celebrating), then you kick off; the clock stopped');
const sm = await goal({ half: 1, clock: 20, g: 0, r: 0 });
info('small: ' + JSON.stringify(sm));
ok(sm.tier === 'small' && sm.men === 3 && sm.run <= 8.05 && sm.held === 2.8 && sm.arrived >= 2 && sm.maxZ > 2 && sm.conf === 0,
  'an early one of yours (small): the scorer ' + sm.run + ' m toward the corner, the two nearest to him (' + sm.arrived + ' of 3 got there), a hop; held ' + sm.held + ' s');
const bg = await goal({ half: 2, clock: L / 2, g: 1, r: 2 });
info('big: ' + JSON.stringify(bg));
ok(bg.tier === 'big' && bg.men === 7 && bg.run <= 16.05 && bg.held === 4.6 && bg.heroGap < 3 && bg.arrived >= 4 && bg.conf > 0 && !bg.keeper,
  'an equaliser in the second half (big): off toward the flag (' + bg.run + ' m), all ' + (bg.men - 1) + ' team-mates after him (' + bg.arrived + ' of ' + bg.men + ' there by the end), confetti; held ' + bg.held + ' s');
const ep = await goal({ half: 2, clock: L - 4, g: 2, r: 2 });
info('epic: ' + JSON.stringify(ep));
ok(ep.tier === 'epic' && ep.keeper && ep.slid && ep.held === 6.8 && ep.conf > bg.conf && ep.heroGap < 3,
  'the winner at the death (epic): a knee slide, the whole team and the keeper up from his goal, more confetti; held ' + ep.held + ' s');
ok([th, sm, bg, ep].every(r => !r.after.celeb && r.after.z === 0 && !r.after.slide && !r.clockMoved && r.after.kicker === (r === th ? 'G' : 'R')),
  'after each: nobody left in the air or on his knees, the clock never moved, and the side that conceded kicks off');

// SIM THE REST: from a goal down at half time, straight to full time
const sr = await page.evaluate(() => { const T = window.__T, L = T.halfLenSec(); T.freeze(); T.reopen(); T.set({ half: 1, clock: L * 0.5, g: 0, r: 1 }); const n0 = T.log().length, s0 = T.score();
  let runs = 0, goals = 0; const r = (() => { T.simRest(); const s = T.score(), lg = T.log().slice(n0);
    return { over: T.over(), half: T.half(), clock: T.clock() === L, add: [s[0] - s0[0], s[1] - s0[1]], logged: [lg.filter(x => x.team === 'G').length, lg.filter(x => x.team === 'R').length],
      times: lg.every(x => x.sim && (x.half === 1 ? x.time >= L * 0.5 - 1 : x.half === 2) && x.time <= L + 1), named: lg.every(x => x.scorerName && x.scorerName !== '?') }; })();
  return r; });
info('sim the rest: ' + JSON.stringify(sr));
ok(sr.over && sr.half === 2 && sr.clock && sr.add[0] === sr.logged[0] && sr.add[1] === sr.logged[1] && sr.times && sr.named,
  'SIM THE REST: full time at once, the goals of what was left (+' + sr.add[0] + ' and +' + sr.add[1] + ') in the log, each named, at a time in what was left of the match');
// how many: over many tries, about what a simulated match gives for what's left (a half: ~1.4 goals between them)
const many = await page.evaluate(() => { const T = window.__T, L = T.halfLenSec(); let tot = 0, n = 300, early = 0;
  for(let i = 0; i < n; i++){ T.freeze(); T.reopen(); T.set({ half: 2, clock: 0, g: 0, r: 0 }); const s0 = T.score(); T.simRest(); const s = T.score(); tot += s[0] + s[1] - s0[0] - s0[1]; }
  return { half: +(tot / n).toFixed(2) }; });
info('sim the rest, a half to go, 300 times: ' + JSON.stringify(many));
ok(many.half > 0.9 && many.half < 2.2, 'a half to go: about what a simulated game gives for it (' + many.half + ' goals a time)');
// the button: in the pause menu, asks first, and the match waits
const pm = await page.evaluate(() => { const b = document.querySelector('#pauseMenu [data-pause="simrest"]'); return b ? b.textContent : null; });
ok(/SIM THE REST/.test(pm || ''), 'the pause menu has it: ' + pm);

process.exitCode = rep.finish() ? 1 : 0;
await browser.close();
