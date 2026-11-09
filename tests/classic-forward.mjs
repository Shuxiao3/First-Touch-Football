// FOOTBALL CLASSIC, THE COMPUTER GOES FORWARD (v111). It used to give the ball back nearly half the time -- seven in ten in
// the other half, six in ten with a man on him there, six in ten straight after a ball forward -- because a ball back was
// all but safe and the ground it gave up cost next to nothing. Now a ball back costs more than the ground it gives up
// (OB_AGGR): 0.85 of its worth in our half, 0.72 in theirs, a further 0.85 with a man within 4 m of him there, and a further
// 0.85 within 3 s of our last ball forward; a cutback into their box isn't a ball back; and the urge to get forward never
// drops below 0.4. Then two computer v computer matches (every man on the computer, both sides playing the plain style, a
// virtual clock): its balls back under 42% of its passes (46-51% before), under 60% in the other half (68-70% before).
// On a copy of the game that lets the test reach it.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={players:()=>players, keepers:()=>keepers, ball:()=>ball, now:()=>simNow, atkOf, dims:()=>({FW,FH,YC,BX,BY,OBM,GOAL_W}), aggr:()=>OB_AGGR, poss:()=>obPoss,\n'
  + '    ctx:(p,a,g)=>obCtx(p,a,g), passOpt:(p,q,C)=>obPassOpt(p,q,C), urge:(p,C)=>obUrge(p,C), over:()=>matchOver, score:()=>[scoreG,scoreR], setStyle:(t,v)=>{ TAC[t].off=v; },\n'
  + '    freeze:()=>{ restartT=0; offsideT=0; scoredT=0; gkHold=null; kickT=0; kickBy=null; kickTo=null; restartInfo=null; }};\n  const LAB_TITLE=');
patch('\n    draw();\n', '\n    if(!window.__noDraw) draw();\n');
patch('      if(p===controlled){ if(!skillStep(p,dt)) stepOutfield(p,hi.ix,hi.iy,dt); }', '      if(p===controlled&&!window.__aiAll){ if(!skillStep(p,dt)) stepOutfield(p,hi.ix,hi.iy,dt); }');
patch('carry(p,dt,p===controlled?(hi.ix||hi.iy):true)', 'carry(p,dt,(p===controlled&&!window.__aiAll)?(hi.ix||hi.iy):true)');
patch("  function obExec(p,o,C,ft){   // (ft: struck first time, still getting it under control -- see onBall's looking)\n    const ob=p.ob;", "  function obExec(p,o,C,ft){\n    if(window.__obl&&o.kind==='pass') window.__obl.push({t:p.team, f:C.atk*(o.tx-p.x)/OBM, u:C.u/FW, s:simNow});\n    const ob=p.ob;");
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-forward-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
// a virtual clock: frames as fast as they'll go, a five-minute half
await page.addInitScript(() => { try{ const o = JSON.parse(localStorage.getItem('ftc_prefs') || '{}') || {}; o.diff = o.diff || 'star'; o.halfMin = 5; localStorage.setItem('ftc_prefs', JSON.stringify(o)); }catch(e){} });
await page.addInitScript(() => { let vt = 0; const ch = new MessageChannel(), q = [];
  ch.port1.onmessage = () => { const cbs = q.splice(0); vt += 33; for(const cb of cbs){ try{ cb(vt); }catch(e){} } };
  window.requestAnimationFrame = cb => { q.push(cb); if(q.length === 1) ch.port2.postMessage(0); return 0; }; });
const kickOff = async () => { await page.goto('file://' + copy); await page.waitForTimeout(300);
  await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show'); await page.click('#exhGo'); await page.waitForTimeout(300); };

// --- WHAT A BALL BACK IS WORTH, against what it was: one scene, the ground-gained credit set aside (gain 0) ---------------
await kickOff();
const mech = await page.evaluate(() => { const T = window.__T; window.__noDraw = true; T.freeze();
  const D = T.dims(), A = T.aggr(), team = 'R', atk = T.atkOf(team), gx = atk > 0 ? D.FW : 0, X = u => atk > 0 ? u * D.FW : D.FW - u * D.FW;
  const keep = Object.assign({}, A), K = T.keepers(), mine = T.players().filter(q => q.team === team && !K.includes(q)), opps = T.players().filter(q => q.team !== team && !K.includes(q));
  const [p, back] = mine, place = (q, x, y) => { q.x = x; q.y = y; q.vx = q.vy = 0; q.state = 'normal'; };
  const scene = (u, o) => { o = o || {};
    mine.forEach((q, i) => place(q, X(0.08), 60 + i * 40)); opps.forEach((q, i) => place(q, X(0.98), D.FH - 60 - i * 40));   // (everyone else out of it)
    place(p, X(u), o.py ?? D.YC); place(back, o.bx ?? X(u) - atk * 10 * D.OBM, o.by ?? D.YC + 40);
    if(o.press) place(opps[0], p.x + atk * 3 * D.OBM * 0.6, p.y + 3 * D.OBM * 0.8);
    const b = T.ball(); b.x = p.x + atk * 12; b.y = p.y; b.z = 0; b.vx = b.vy = b.vz = 0; b.ownedBy = p;
    T.poss()[team].fwdT = o.after ? T.now() : -9; };
  const v = () => { const C = T.ctx(p, atk, gx), o = T.passOpt(p, back, C); return o ? o.v : null; };
  const ratio = (u, o) => { scene(u, o); A.gain = 0; const v1 = v(); Object.assign(A, { back: 1, backHigh: 1, backPressed: 1, backAfter: 1 }); const v0 = v(); Object.assign(A, keep); return v0 ? +(v1 / v0).toFixed(3) : null; };
  const out = { high: ratio(0.65), pressed: ratio(0.65, { press: true }), after: ratio(0.65, { after: true }), own: ratio(0.35),
    // a cutback: by their byline out wide, back to a man on the penalty spot
    cut: ratio(0.97, { py: D.YC + D.GOAL_W * 0.75, bx: gx - atk * 11 * D.OBM, by: D.YC }) };
  scene(0.5); const S = T.poss()[team]; S.t = T.now(); S.u = 0; S.last = T.now(); const C = T.ctx(p, atk, gx); out.urge = +C.urge.toFixed(2); out.A = keep;
  return out; });
info('a ball back, against what it was worth: ' + JSON.stringify(mech));
const near = (a, b) => a != null && Math.abs(a - b) < 0.005;
ok(near(mech.high, 0.72) && near(mech.own, 0.85) && near(mech.pressed, 0.72 * 0.85) && near(mech.after, 0.72 * 0.85) && mech.cut === 1,
  'a ball back costs more than the ground it gives up: ' + mech.own + ' of its worth in our half, ' + mech.high + ' in theirs, ' + mech.pressed + ' there with a man on him, ' + mech.after + ' straight after a ball forward; a cutback into their box nothing (' + mech.cut + ')');
ok(mech.urge === 0.4, 'the urge to get forward never below ' + mech.urge + ' (it was 0.25), ground counting for ' + mech.A.gain + ' (it was 0.025)');

// --- AND WHAT IT DOES: two computer v computer matches, both sides the plain style ---------------------------------------------
const log = [], games = [];
for(let m = 0; m < 2; m++){
  await kickOff();
  const r = await page.evaluate(async () => { const T = window.__T; window.__noDraw = true; window.__aiAll = true; window.__obl = []; T.setStyle('G', 'neutral'); T.setStyle('R', 'neutral');
    await new Promise(res => { (function tick(){ if(T.over() || T.now() > 60 * 30) return res(); requestAnimationFrame(tick); })(); });
    return { log: window.__obl, score: T.score() }; });
  log.push(...r.log); games.push(r.score);
}
const pct = (a, f) => Math.round(100 * a.filter(f).length / Math.max(1, a.length)), back = e => e.f < -3, fwd = e => e.f > 3;
const high = log.filter(e => e.u > 0.5);
const res = { passes: log.length, back: pct(log, back), fwd: pct(log, fwd), highBack: pct(high, back), highN: high.length, scores: games };
info('two matches, computer v computer: ' + JSON.stringify(res));
ok(res.passes > 150 && res.back < 42 && res.highBack < 60 && res.fwd > res.back,
  'two computer v computer matches: ' + res.passes + ' passes, ' + res.back + '% back (46-51% before), ' + res.fwd + '% forward; in the other half ' + res.highBack + '% back (68-70% before)');

process.exitCode = rep.finish() ? 1 : 0;
await browser.close();
