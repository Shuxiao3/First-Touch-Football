// FOOTBALL CLASSIC, CROSSING: with the ball out wide in their third, the men going in the box wait where a cross can find
// them -- one man on his own in the middle of the box; two, one favouring each post; three, the posts and one in the
// middle a little further out -- inside the posts, never out toward the crosser, and none of them pulled out of the box
// to help the man on the ball. The computer crosses to a man (where he'll be as it gets there), not into a space nobody
// gets to: from 8 m out with nobody on them, most are headed, a good crosser's coming closer to his man than a poor
// one's; an early ball from 24 m finds the runs in behind. Two of theirs meet it in the air and clear a good share. The
// CROSSING LAB: who crosses, from how far, how many of ours and of theirs, the keeper -- each ball called and tallied.
// YOUR CROSS: how long you hold it picks the man it's for, nearest first -- a tap the near post, a long hold the far
// post -- and a double-tap is a low driven cross: flat and quick, to his feet.
// On a copy of the game that lets the test reach the lab and the side's plan, the frames pumped (no vsync) -- and for
// your own presses, which go by the clock, a second copy in real time.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={LAB, P, players:()=>players, controlled:()=>controlled, ball:()=>ball, simNow:()=>simNow, PLAN:()=>PLAN, FW, FH, YC, MK, GOAL_W, atkOf, '
  + 'cast:()=>crossLabCast(), serve:()=>crossLabServe(), crossMen:()=>crossMen(controlled,false)};\n  const LAB_TITLE=');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-cross-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ fastFrames: true, url: 'file://' + copy });
const { ok, info } = rep;
const labBtn = await page.evaluate(() => { const b = document.querySelector('#smItems [data-act="crosslab"]'); if(!b) return null; const r = b.getBoundingClientRect(); return { w: r.width, h: r.height, row: b.parentElement.classList.contains('smRow') }; });
ok(labBtn && labBtn.w > 0 && labBtn.row, 'CROSSING LAB on the start menu, with the other labs');
await page.click('#smItems [data-act="crosslab"]'); await page.waitForTimeout(600);

// THE BOX SPOTS: 1, 2 and 3 of ours in the box, nobody of theirs; read 1.3 s in (the computer crosses at 1.4 s)
const box = n => page.evaluate(n => new Promise(res => { const T = window.__T, L = T.LAB;
  Object.assign(L, { auto: false, cWho: 'ai', cFrom: 180, cAtk: n, cDef: 0, cKeep: true }); T.cast(); T.serve();
  const t0 = T.simNow(), sup = new Set();
  (function tick(){
    for(const q of T.players()) if(q.dbgTag === 'SUPPORT') sup.add(q.num);
    if(T.simNow() - t0 < 1.3) return requestAnimationFrame(tick);
    const J = T.PLAN().G.last, atk = T.atkOf('G'), gx = atk > 0 ? T.FW : 0, side = Math.sign(T.controlled().y - T.YC) || 1, M = T.MK;
    res({ sup: sup.size, men: T.players().filter(q => q.pRole === 'labAtk').map(q => { const j = J && J.get(q), x = j ? (j.bx != null ? j.bx : j.x) : q.x, y = j ? (j.by != null ? j.by : j.y) : q.y;
      return { job: j ? j.job : '-', out: +(Math.abs(gx - x) / M).toFixed(1), across: +((y - T.YC) * side / M).toFixed(1), off: +(Math.hypot(q.x - x, q.y - y) / M).toFixed(1), at: +((q.y - T.YC) * side / M).toFixed(1) }; }) }); })(); }), n);
const B = {}; for(const n of [1, 2, 3]) B[n] = await box(n);
const post = await page.evaluate(() => window.__T.GOAL_W / 2 / window.__T.MK);
for(const n of [1, 2, 3]) info(`${n} in the box: ` + B[n].men.map(m => `${m.job} ${m.out} m out, ${m.across > 0 ? '+' : ''}${m.across} m toward the ball's side (he's ${m.off} m off it)`).join('; '));
const job = (n, j) => B[n].men.find(m => m.job === j);
ok(B[1].men.length === 1 && job(1, 'BOXMID') && job(1, 'BOXMID').out > 8 && job(1, 'BOXMID').out < 10 && Math.abs(job(1, 'BOXMID').across) < 0.6,
  'one man on his own waits in the middle of the box, 8-10 m out');
ok(job(2, 'NEARPOST') && job(2, 'FARPOST') && job(2, 'NEARPOST').across > 1 && job(2, 'NEARPOST').across < post && job(2, 'FARPOST').across < -1 && job(2, 'FARPOST').across > -post
   && [job(2, 'NEARPOST'), job(2, 'FARPOST')].every(m => m.out > 6.5 && m.out < 9),
  'two: one favouring each post, both inside the posts (' + job(2, 'NEARPOST').across + ' and ' + job(2, 'FARPOST').across + ' m across, the posts at ' + post.toFixed(1) + ')');
ok(job(3, 'NEARPOST') && job(3, 'FARPOST') && job(3, 'BOXBACK') && job(3, 'BOXBACK').out > 11 && job(3, 'BOXBACK').out < 12.5 && Math.abs(job(3, 'BOXBACK').across) < 1,
  'three: the posts, and one in the middle a little further out (' + (job(3, 'BOXBACK') || {}).out + ' m)');
ok([1, 2, 3].every(n => B[n].men.every(m => m.off < 2 && m.at < post)), 'they get to their spots before the cross, and none is out toward the crosser past the near post');
ok([1, 2, 3].every(n => B[n].sup === 0), 'none of them leaves the box to help the man on the ball');

// THE COMPUTER'S CROSSES, n of them, called by the lab: the tally, and each one's miss (how close it came to its man at a
// height he could head it)
const crosses = (o, n) => page.evaluate(({ o, n }) => new Promise(res => { const T = window.__T, L = T.LAB;
  if(o.crossing != null) T.P.crossing.val = o.crossing;
  Object.assign(L, { auto: true, cWho: 'ai', cKeep: true, ct: null }, o.lab); T.cast(); T.serve();
  const w0 = performance.now(), seen = new Set([L.last]), miss = [], aim = [];   // (not the last batch's last ball)
  (function tick(){ if(L.last && L.last.done && !seen.has(L.last)){ seen.add(L.last); if(L.last.cross){ if(L.last.miss != null) miss.push(L.last.miss / T.MK); if(L.last.aimMiss != null) aim.push(L.last.aimMiss / T.MK); } }
    if((L.ct && L.ct.n >= n) || performance.now() - w0 > 150000) return res({ T: Object.assign({}, L.ct), miss, aim });
    requestAnimationFrame(tick); })(); }), { o, n });
const dial = await page.evaluate(() => window.__T.P.crossing.val);
const N = 16;
const good = await crosses({ crossing: 8, lab: { cFrom: 180, cAtk: 2, cDef: 0 } }, N);
const poor = await crosses({ crossing: 1, lab: { cFrom: 180, cAtk: 2, cDef: 0 } }, N);
const early = await crosses({ crossing: 8, lab: { cFrom: 540, cAtk: 2, cDef: 0 } }, N);
const marked = await crosses({ crossing: 8, lab: { cFrom: 180, cAtk: 2, cDef: 2 } }, N);
await page.evaluate(v => { window.__T.P.crossing.val = v; }, dial);
const hd = R => R.T.head, avg = a => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length), within = (a, m) => a.filter(v => v < m).length;
const line = (k, R) => `${k}: ${hd(R)} of ${R.T.n} headed by ours (${R.T.goal} in), ${R.T.cleared} cleared, ${R.T.keeper} the keeper's, ${R.T.nobody} to nobody; ${within(R.miss, 2.2)} within heading reach of the man it was for (2.2 m), ${avg(R.miss).toFixed(1)} m from him on average (of the ${R.miss.length} that came near him at a heading height); ${avg(R.aim).toFixed(2)} m off where it was aimed`;
for(const [k, R] of [['Crossing 8, 8 m out, 2 of ours, none of theirs', good], ['Crossing 1, the same', poor], ['Crossing 8, 24 m out (early)', early], ['Crossing 8, 8 m out, 2 v 2', marked]]) info(line(k, R));
ok(hd(good) >= 0.7 * N && within(good.miss, 2.2) >= 0.7 * N, 'the computer crosses to a man: with nobody on them, 70% or more headed, and 70% or more come within heading reach of the man it was for');
ok(avg(poor.aim) > avg(good.aim) * 1.8 && avg(good.aim) < 1, 'a good crosser puts it where he aims (' + avg(good.aim).toFixed(2) + ' m off at Crossing 8), a poor one well off it (' + avg(poor.aim).toFixed(2) + ' m at 1)');
ok(hd(early) >= 0.55 * N, 'an early ball from 24 m out finds the runs in behind: ' + hd(early) + ' of ' + N + ' headed');
ok(marked.T.cleared + marked.T.keeper >= 3 && hd(marked) < hd(good), 'two of theirs meet it in the air and clear a good share (' + marked.T.cleared + ' of ' + N + ')');

// THE LAB ITSELF: its chips, and yours -- the computer leaves it to you (CROSSER: YOU), and your cross is called
await page.evaluate(() => { const L = window.__T.LAB; L.auto = false; L.ct = null; });
const chips = [];
for(const [act, id] of [['cwho', 'labCWhoV'], ['cfrom', 'labCFromV'], ['catk', 'labCAtkV'], ['cdef', 'labCDefV'], ['ckeep', 'labCKeepV']]){
  const vals = [];
  for(let i = 0; i < 4; i++){ await page.click(`#labHud [data-lab="${act}"]`); await page.waitForTimeout(120); vals.push(await page.textContent('#' + id)); }
  chips.push(act + ': ' + vals.join(' → '));
}
info('the chips: ' + chips.join(' | '));
ok(/COMPUTER/.test(chips[0]) && /YOU/.test(chips[0]) && /BYLINE/.test(chips[1]) && /24 M OUT/.test(chips[1]) && /1/.test(chips[2]) && /3/.test(chips[2]) && /0/.test(chips[3]) && /OFF/.test(chips[4]), 'the lab\'s chips: CROSSER (COMPUTER, YOU), FROM (the byline to 24 m), OURS 1-3, THEIRS 0-3, KEEPER');
const yours = await page.evaluate(() => new Promise(res => { const T = window.__T, L = T.LAB;
  Object.assign(L, { cWho: 'you', cFrom: 180, cAtk: 2, cDef: 0, cKeep: true }); T.cast(); T.serve();
  const t0 = T.simNow(); (function tick(){ if(T.simNow() - t0 < 2.5) return requestAnimationFrame(tick); res({ crossed: !!L.rep.cross, has: T.ball().ownedBy === T.controlled() }); })(); }));
await page.keyboard.down('KeyL'); await page.waitForTimeout(400); await page.keyboard.up('KeyL');
const yours2 = await page.evaluate(() => new Promise(res => { const T = window.__T, L = T.LAB, t0 = T.simNow();
  (function tick(){ if(!(L.rep && L.rep.done) && T.simNow() - t0 < 6) return requestAnimationFrame(tick);
    res({ crossed: !!(L.rep && L.rep.cross), result: L.rep && L.rep.result, text: document.getElementById('labResult').textContent, tally: document.getElementById('labTally').textContent }); })(); }));
info('yours: ' + JSON.stringify(yours) + ' then ' + JSON.stringify(yours2));
ok(!yours.crossed && yours.has && yours2.crossed && !!yours2.result && /CROSS/.test(yours2.text) && /1 cross/.test(yours2.tally), 'CROSSER: YOU -- he waits for you; your cross (L) is called and tallied');

// YOUR CROSS, pressed for real (the clock: a tap, a hold, a double-tap), three of ours in the box: who it's for, and the
// ball's flight -- how high it gets and how fast it goes
await browser.close();
const R2 = await open({ url: 'file://' + copy }), page2 = R2.page;
R2.rep.errs = rep.errs;   // (one tally of page errors, and of checks: rep's)
await page2.click('#smItems [data-act="crosslab"]'); await page2.waitForTimeout(500);
const press = async seq => {
  await page2.evaluate(() => { const T = window.__T, L = T.LAB; Object.assign(L, { auto: false, cWho: 'you', cFrom: 180, cAtk: 3, cDef: 0, cKeep: true }); L.ct = null; T.cast(); T.serve(); });
  await page2.waitForTimeout(1500);
  const men = await page2.evaluate(() => window.__T.crossMen().map(m => m.q.num));
  for(let i = 0; i < seq.length; i++){ await page2.keyboard.down('KeyL'); await page2.waitForTimeout(seq[i]); await page2.keyboard.up('KeyL'); if(i < seq.length - 1) await page2.waitForTimeout(40); }
  return page2.evaluate(men => new Promise(res => { const T = window.__T, L = T.LAB, t0 = T.simNow(); let zMax = 0, vMax = 0, low = 99;
    (function tick(){ const r = L.rep, b = T.ball();
      if(r && r.cross && !r.done){ zMax = Math.max(zMax, b.z); if(!b.ownedBy) vMax = Math.max(vMax, Math.hypot(b.vx, b.vy)); if(r.man && b.z < 12 && !b.ownedBy) low = Math.min(low, Math.hypot(b.x - r.man.x, b.y - r.man.y)); }
      if(!(r && r.done) && T.simNow() - t0 < 5) return requestAnimationFrame(tick);
      res({ men, man: r && r.man ? r.man.num : null, low: !!(r && r.low), result: r && r.result, peak: +(zMax / 25).toFixed(2), top: +(vMax / T.MK).toFixed(1),
            near: low < 99 ? +(low / T.MK).toFixed(2) : null, text: document.getElementById('labResult').textContent }); })(); }), men);
};
const Y = { tap: await press([60]), hold: await press([800]), dbl: await press([60, 60]), dblHold: await press([60, 800]) };
for(const [k, y] of Object.entries(Y)) info(`${k}: our men nearest first #${y.men.join(', #')} -- for #${y.man}, ${y.low ? 'low' : 'lofted'}, up to ${y.peak} m, ${y.top} m/s at most${y.near != null ? ', ' + y.near + ' m from him at his feet' : ''}: ${y.result} (${y.text.replace(/^.*→ /, '')})`);
ok(Y.tap.men.length === 3 && Y.tap.man === Y.tap.men[0] && Y.hold.man === Y.hold.men[2] && !Y.tap.low && !Y.hold.low && Y.hold.peak > 3,
  'your cross: a tap goes to the nearest of ours (#' + Y.tap.man + '), a long hold to the furthest (#' + Y.hold.man + '), both lofted');
ok(Y.dbl.low && Y.dbl.man === Y.dbl.men[0] && Y.dblHold.low && Y.dblHold.man === Y.dblHold.men[2] && /LOW CROSS/.test(Y.dbl.text),
  'a double-tap is a low cross, to the man the second press picks (#' + Y.dbl.man + ' quick, #' + Y.dblHold.man + ' held)');
ok(Y.dbl.peak < 1.8 && Y.dbl.peak < Y.tap.peak / 2 && Y.dbl.top > 25 && Y.dbl.near != null && Y.dbl.near < 1.5 && /^(goal|saved|shot|ours)$/.test(Y.dbl.result),
  'the low cross is flat and quick (up to ' + Y.dbl.peak + ' m high, ' + Y.dbl.top + ' m/s, against ' + Y.tap.peak + ' m lofted), and gets to his feet: ' + Y.dbl.result);

process.exitCode = rep.finish();
await R2.browser.close();
