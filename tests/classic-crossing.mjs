// FOOTBALL CLASSIC, CROSSING: with the ball out wide in their third, the men going in the box wait where a cross can find
// them -- one man on his own in the middle of the box; two, one favouring each post; three, the posts and one in the
// middle a little further out -- inside the posts, never out toward the crosser, and none of them pulled out of the box
// to help the man on the ball. The computer crosses to a man (where he'll be as it gets there), not into a space nobody
// gets to: from the byline with nobody on them, most are headed, a good crosser's coming closer to his man than a poor
// one's. Two of theirs meet it in the air and clear a good share. FROM HOW FAR: the further out it's crossed from, the
// less true it goes -- an early ball from 24 m well off where it was aimed, against one from the byline -- and nothing's
// crossed from more than 24 m out: the computer doesn't choose one from there, a team-mate you call for one doesn't
// cross it, and your own CROSS does nothing. The CROSSING LAB: who crosses, from how far, how many of ours and of
// theirs, the keeper -- each ball called and tallied. YOUR CROSS: how long you hold it picks the man it's for, nearest
// first -- a tap the near post, a long hold the far post -- and a double-tap is a low driven cross: flat and quick, to
// his feet.
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
  + 'cast:()=>crossLabCast(), serve:()=>crossLabServe(), crossMen:()=>crossMen(controlled,false), obCtx, obCrossAt, own, requestCross, crossSpray, crossOver, get CROSS_MAX(){ return CROSS_MAX; }};\n  const LAB_TITLE=');
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
const good = await crosses({ crossing: 8, lab: { cFrom: 25, cAtk: 2, cDef: 0 } }, N);
const poor = await crosses({ crossing: 1, lab: { cFrom: 25, cAtk: 2, cDef: 0 } }, N);
const early = await crosses({ crossing: 8, lab: { cFrom: 540, cAtk: 2, cDef: 0 } }, N);
const marked = await crosses({ crossing: 8, lab: { cFrom: 180, cAtk: 2, cDef: 2 } }, N);
await page.evaluate(v => { window.__T.P.crossing.val = v; }, dial);
const hd = R => R.T.head, avg = a => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length), within = (a, m) => a.filter(v => v < m).length;
const line = (k, R) => `${k}: ${hd(R)} of ${R.T.n} headed by ours (${R.T.goal} in), ${R.T.cleared} cleared, ${R.T.keeper} the keeper's, ${R.T.nobody} to nobody; ${within(R.miss, 2.2)} within heading reach of the man it was for (2.2 m), ${avg(R.miss).toFixed(1)} m from him on average (of the ${R.miss.length} that came near him at a heading height); ${avg(R.aim).toFixed(2)} m off where it was aimed`;
for(const [k, R] of [['Crossing 8, from the byline, 2 of ours, none of theirs', good], ['Crossing 1, the same', poor], ['Crossing 8, 24 m out (early)', early], ['Crossing 8, 8 m out, 2 v 2', marked]]) info(line(k, R));
ok(hd(good) >= 0.7 * N && within(good.miss, 2.2) >= 0.7 * N, 'the computer crosses to a man: with nobody on them, 70% or more headed, and 70% or more come within heading reach of the man it was for');
ok(avg(poor.aim) > avg(good.aim) * 1.8 && avg(good.aim) < 1, 'a good crosser puts it where he aims (' + avg(good.aim).toFixed(2) + ' m off at Crossing 8, from the byline), a poor one well off it (' + avg(poor.aim).toFixed(2) + ' m at 1)');
ok(hd(early) >= 0.55 * N && avg(early.aim) > avg(good.aim) * 1.5, 'an early ball from 24 m out still finds the runs in behind with nobody on them (' + hd(early) + ' of ' + N + ' headed), but goes less true: ' + avg(early.aim).toFixed(2) + ' m off where it was aimed, against ' + avg(good.aim).toFixed(2) + ' m from the byline');
ok(marked.T.cleared + marked.T.keeper + (marked.T.punched || 0) >= 3 && hd(marked) < hd(good), 'two of theirs meet it in the air and clear a good share (' + marked.T.cleared + ' of ' + N + (marked.T.punched ? ', and ' + marked.T.punched + ' punched' : '') + ')');
// how wide it goes, drawn 20,000 times: its line (the mean, and the worst, in degrees) and its weight (the mean share
// it's over or short), from the byline (f 0) and from 24 m out (f 1), at Crossing 1, 8 and 10
const spread = await page.evaluate(() => { const T = window.__T, p = T.controlled(), keep = T.P.crossing.val, out = {};
  for(const c of [1, 8, 10]) for(const f of [0, 1]){ T.P.crossing.val = c; let a = 0, w = 0, o = 0; const n = 20000;
    for(let i = 0; i < n; i++){ const e = Math.abs(T.crossSpray(p, f)); a += e; w = Math.max(w, e); o += Math.abs(T.crossOver(p, f)); }
    out[c + (f ? ' at 24 m' : ' at the byline')] = { deg: +(a / n * 180 / Math.PI).toFixed(2), worst: +(w * 180 / Math.PI).toFixed(1), over: +(o / n * 100).toFixed(1) }; }
  T.P.crossing.val = keep; return out; });
info('how wide, by Crossing: ' + JSON.stringify(spread));
const S = (c, at) => spread[c + (at ? ' at 24 m' : ' at the byline')];
ok([1, 8, 10].every(c => S(c, 0).over === 0 && S(c, 1).deg > S(c, 0).deg * 2.2 && S(c, 1).over > 3) && S(10, 1).deg < S(8, 1).deg && S(8, 1).deg < S(1, 1).deg
   && Math.abs(S(1, 0).worst - 9.2) < 0.4 && Math.abs(S(10, 0).worst - 1.1) < 0.2,
  'from the byline as true as ever (the worst 9° off at Crossing 1, 1° at 10, the weight spot on); from 24 m out over twice as wide (' + S(8, 0).deg + '° to ' + S(8, 1).deg + '° on average at Crossing 8), and over or short, at every Crossing, the better crosser still the truer');
// nobody crosses from more than 24 m out: the computer weighing one up from 23 m and from 25 m (two of ours in the box),
// and a team-mate on the ball 30 m out and then 20 m out when you call for one
const reach = await page.evaluate(() => { const T = window.__T, L = T.LAB;
  Object.assign(L, { auto: false, cWho: 'you', cFrom: 180, cAtk: 2, cDef: 0, cKeep: true, ct: null }); T.cast(); T.serve();
  const cr = T.controlled(), atk = T.atkOf(cr.team), gx = atk > 0 ? T.FW : 0, U = m => gx - atk * m * T.MK, out = { max: T.CROSS_MAX / T.MK };
  out.ai23 = !!T.obCrossAt(T.obCtx(cr, atk, gx), U(23), cr.y); out.ai25 = !!T.obCrossAt(T.obCtx(cr, atk, gx), U(25), cr.y);
  const mate = T.players().find(q => q.pRole === 'labAtk'), b = T.ball();
  for(const m of [30, 20]){ b.ownedBy = null; mate.x = U(m); mate.y = cr.y; mate.vx = mate.vy = 0; T.own(mate, mate.r + b.r + 5); out['call' + m] = T.requestCross() && !b.ownedBy; }
  return out; });
info('from how far: ' + JSON.stringify(reach));
ok(reach.max === 24 && reach.ai23 && !reach.ai25, 'the computer crosses from 23 m out, never from 25 m (24 m at most)');
ok(!reach.call30 && reach.call20, 'called for, a team-mate crosses it from 20 m out, not from 30 m');

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
// too far out: from 30 m your CROSS does nothing -- he keeps it; from 24 m it goes
const farPress = async m => {
  await page2.evaluate(m => { const T = window.__T, L = T.LAB; Object.assign(L, { auto: false, cWho: 'you', cFrom: m * T.MK, cAtk: 2, cDef: 0, cKeep: true }); L.ct = null; T.cast(); T.serve(); }, m);
  await page2.waitForTimeout(1200);
  await page2.keyboard.down('KeyL'); await page2.waitForTimeout(300); await page2.keyboard.up('KeyL'); await page2.waitForTimeout(900);
  return page2.evaluate(() => { const T = window.__T; return { crossed: !!(T.LAB.rep && T.LAB.rep.cross), has: T.ball().ownedBy === T.controlled() }; });
};
const F30 = await farPress(30), F24 = await farPress(24);
info('your CROSS from 30 m out: ' + JSON.stringify(F30) + '; from 24 m: ' + JSON.stringify(F24));
ok(!F30.crossed && F30.has && F24.crossed, 'your CROSS from 30 m out does nothing (he keeps it); from 24 m out it crosses');

process.exitCode = rep.finish();
await R2.browser.close();
