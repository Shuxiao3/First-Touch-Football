// FOOTBALL CLASSIC, OFF IQ MEETING THE BALL: a man a ball's played to reads it as well as his Off IQ lets him -- he
// moves for it a beat after it's struck (0.4 s at Off IQ 1, 0.05 s at 10), sees where it's going out by up to 2.5 m at 1
// (less as it gets to him), and a good one goes to meet it while a poor one lets it come. A cross: only the two of ours
// best placed go for it, and a good one meets it at the first point of its flight he can get to at head height, timing
// his run, where a poor one goes where it comes down -- so he heads it more often. A high-percentage chance (xG 0.3 or
// better) a high Off IQ hits first time. Your own man, the stick left alone after your pass, reads it too.
// Everyone on the computer, on a copy of the game that tells the test of every touch, header and shot, and where a man
// goes for a pass.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={players:()=>players, keepers:()=>keepers, controlled:()=>controlled, ball:()=>ball, P, FW, FH, YC, BX, BY, atkOf, simNow:()=>simNow, '
  + 'aiCross, passTo, doPass, setControlled, offReact, ftFinishOf, recvAuto:()=>recvAuto, '
  + 'freeze:()=>{ restartT=0; offsideT=0; scoredT=0; gkHold=null; skill=null; oneTouch=null; ftAim=null; recvAuto=null; }};\n  const LAB_TITLE=');
patch('      if(p===controlled){ if(!skillStep(p,dt)) stepOutfield(p,hi.ix,hi.iy,dt); }', '      if(p===controlled&&!window.__aiAll){ if(!skillStep(p,dt)) stepOutfield(p,hi.ix,hi.iy,dt); }');   // (your man on the computer too)
const ev = (k, extra = '') => `if(window.__EV) window.__EV.push({k:'${k}', team:p.team, num:p.num, t:simNow${extra}});`;
patch('  function headOnGoal(p){\n', '  function headOnGoal(p){\n    ' + ev('head') + '\n');
patch('  function headClear(p){\n', '  function headClear(p){\n    ' + ev('clear') + '\n');
patch('  function shootAt(p,atkSide,aim,charge,aiCurl,accMul,spin,across){\n', '  function shootAt(p,atkSide,aim,charge,aiCurl,accMul,spin,across){\n    ' + ev('shot') + '\n');
patch('  function own(p,carryDist,keepPos){\n', '  function own(p,carryDist,keepPos){\n    if(ball.ownedBy!==p) ' + ev('own') + '\n');
patch('  function receiveTouch(p,s,intercept){\n', '  function receiveTouch(p,s,intercept){\n    ' + ev('touch') + '\n');
patch("p.dbgTag='RECEIVE';", "p.dbgTag='RECEIVE'; if(window.__RT&&!window.__RT.has(p)) window.__RT.set(p,{x:tgx,y:tgy,px:p.x,py:p.y,bx:ball.x,by:ball.y});");   // (where he goes for it)
patch("    if(o.kind==='shot'){\n      const dG=Math.abs(C.gx-p.x);", "    if(o.kind==='shot'){\n      " + ev('xg', ', P:o.P') + "\n      const dG=Math.abs(C.gx-p.x);");
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-offiq-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show'); await page.click('#exhGo'); await page.waitForTimeout(1500);

const fn = await page.evaluate(() => { const T = window.__T, q = T.players()[1], keep = q.stats, out = {};
  for(const v of [1, 5.5, 9, 10]){ q.stats = Object.assign({}, keep, { offIQ: v }); out[v] = { react: +T.offReact(q).toFixed(3), ft: +T.ftFinishOf(q).toFixed(2) }; }
  q.stats = keep; return out; });
info('by Off IQ: ' + JSON.stringify(fn));
ok(fn[1].react === 0.4 && fn[10].react === 0.05 && Math.abs(fn[5.5].react - 0.225) < 0.001, 'he moves for a ball 0.4 s after it\'s struck at Off IQ 1, 0.225 s at 5.5, 0.05 s at 10');
ok(fn[5.5].ft === 0 && fn[9].ft === 1 && fn[10].ft === 1, 'a first-time finish: not at all at Off IQ 5.5, all the way from 9');

// THE SCENES (everyone else out of the way, the keepers on their lines): a cross from their byline to the penalty spot,
// one of ours 13 m out with a marker goal-side of him; a ball pulled back from their byline to one of ours 13 m out,
// nobody on him (a good chance); a ball squared to him 22 m out, nobody on him (not one: under xG 0.3); a 15 m pass in
// midfield to a man standing with a marker level with him 2 m off
await page.evaluate(() => { window.__aiAll = true; });
const run = (scene, iq, i) => page.evaluate(({ scene, iq, i }) => new Promise(res => {
  const T = window.__T; T.freeze(); window.__EV = [];
  const R = T.players().filter(q => q.team === 'R'), G = T.players().filter(q => q.team === 'G');
  const atk = T.atkOf('R'), gx = atk > 0 ? T.FW : 0, U = u => gx - atk * u;
  const att = R.filter(q => q.role === 'ATT'), mid = R.filter(q => q.role === 'MID'), defs = G.filter(q => q.role === 'DEF');
  const pas = R.find(q => q !== att[0] && q !== mid[0] && q.role !== 'G') || R[1], rcv = scene === 'cross' ? att[0] : mid[0], opp = defs[0], keep = new Map();
  for(const q of [pas, rcv, opp]) keep.set(q, q.stats);
  pas.stats = Object.assign({}, pas.stats, { crossing: 10, passAcc: 10, curve: 5.5, offIQ: 7 });
  rcv.stats = Object.assign({}, rcv.stats, { offIQ: iq, heading: 6.5, speed: 7, acceleration: 7, shotAcc: 7, composure: 7, ballControl: 7 });
  opp.stats = Object.assign({}, opp.stats, { heading: 6.5, speed: 6.5, acceleration: 6.5, defIQ: 6.5, interceptions: 6.5, tackle: 6.5 });
  const cast = /cutback|square/.test(scene) ? [pas, rcv] : [pas, rcv, opp], jy = (i % 3 - 1) * 30, jx = (i % 2) * 20, out = {};
  const park = () => { for(const q of T.players()) if(!cast.includes(q)){ q.x = T.FW / 2 - atk * 700 + (q.team === 'R' ? 0 : 60); q.y = q.team === 'R' ? 50 : T.FH - 50; q.vx = q.vy = 0; } };
  for(const q of cast){ q.state = 'normal'; q.noTouchT = 0; q.stamina = 1; q.staminaCap = 1; q.vx = q.vy = 0; q.ob = null; q.z = 0; q.vz = 0; q.reactUntil = 0; }
  for(const k of T.keepers()){ k.x = k.homeX; k.y = T.YC; k.vx = k.vy = 0; Object.assign(k, { mode: 'line', holdT: 0, claimCd: 0, diveT: 0, groundT: 0, reactT: 0 }); }
  park(); const b = T.ball(); b.dribbler = null; b.z = 0; b.vz = 0; b.vx = b.vy = 0; b.crossT = 0; b.crossBy = null; b.shotT = 0;
  if(scene === 'cross'){ pas.x = U(100); pas.y = T.YC + 480; pas.facing = { x: atk, y: 0 };
    rcv.x = U(T.BX + 110 + jx); rcv.y = T.YC + 40 + jy; rcv.facing = { x: atk, y: 0 }; opp.x = U(T.BX + 70 + jx); opp.y = T.YC + 25 + jy; opp.facing = { x: -atk, y: 0 }; }
  else if(scene === 'cutback'){ pas.x = U(70); pas.y = T.YC + 250; pas.facing = { x: -atk, y: 0 };
    rcv.x = U(T.BX + 110 + jx); rcv.y = T.YC + 40 + jy; rcv.facing = { x: -atk, y: 0 }; }
  else if(scene === 'square'){ pas.x = U(550); pas.y = T.YC + 330; pas.facing = { x: 0, y: -1 };
    rcv.x = U(550 + jx); rcv.y = T.YC + 20 + jy; rcv.facing = { x: atk, y: 0 }; }
  else { pas.x = T.FW / 2 - atk * 220; pas.y = T.YC; pas.facing = { x: atk, y: 0 }; rcv.x = T.FW / 2 + atk * 140 + jx; rcv.y = T.YC + 130 + jy; rcv.facing = { x: -atk, y: 0 };
    const dx = rcv.x - pas.x, dy = rcv.y - pas.y, l = Math.hypot(dx, dy); opp.x = rcv.x - dy / l * 55; opp.y = rcv.y + dx / l * 55; opp.facing = { x: -atk, y: 0 }; }
  b.ownedBy = pas; b.x = pas.x + pas.facing.x * 20; b.y = pas.y + pas.facing.y * 20; b.lastTouch = 'R';
  let t0 = null, got = null;
  (function tick(){
    park();
    if(t0 === null){ t0 = T.simNow(); window.__EV = []; window.__RT = new Map(); if(scene === 'cross') T.aiCross(pas, { x: U(250), y: T.YC - 20, who: rcv }); else T.passTo(pas, rcv); }
    const t = T.simNow() - t0;
    if(out.moved === undefined && /RECEIVE|CROSS/.test(rcv.dbgTag || '')) out.moved = +t.toFixed(2);   // (when he goes for it)
    for(const e of window.__EV){ if(out.k) break;
      if(scene === 'cross'){ if(e.k === 'head' && e.team === 'R') out.k = 'headed'; else if(e.team === 'G' && /clear|head|touch|own/.test(e.k)) out.k = 'cleared'; }
      else { if(e.team === 'G' && (e.k === 'own' || e.k === 'touch')) out.k = 'cut out';
        else if(e.k === 'own' && e.team === 'R' && e.num === rcv.num && got === null){ got = e.t; out.got = +(e.t - t0).toFixed(2); if(scene === 'midfield') out.k = 'his'; }
        else if(e.k === 'xg' && e.team === 'R' && got !== null) out.xg = e.P;
        else if(e.k === 'shot' && e.team === 'R' && got !== null){ out.k = 'shot'; out.after = +(e.t - got).toFixed(2); } } }
    if(out.k || t > (scene === 'cross' ? 2.6 : 3)){ for(const [q, s] of keep) q.stats = s; if(!out.k) out.k = 'nothing';
      const g = window.__RT.get(rcv); if(g){ const l = Math.hypot(g.bx - g.px, g.by - g.py) || 1; out.toward = Math.round(((g.x - g.px) * (g.bx - g.px) + (g.y - g.py) * (g.by - g.py)) / l); }
      b.ownedBy = null; b.x = T.FW / 2; b.y = T.YC; b.vx = b.vy = b.vz = 0; b.z = 0; b.crossT = 0; b.crossBy = null; return res(out); }
    requestAnimationFrame(tick); })(); }), { scene, iq, i });
const S = {};
for(const scene of ['midfield', 'cutback', 'square', 'cross']) for(const iq of [1, 10]){ const R = [], n = scene === 'cross' ? 16 : 10;
  for(let i = 0; i < n; i++) R.push(await run(scene, iq, i)); S[scene + iq] = R; }
const avg = a => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length), cnt = (R, k) => R.filter(r => r.k === k).length;
const mv = iq => S['midfield' + iq].filter(r => r.moved !== undefined).map(r => r.moved), tw = iq => S['midfield' + iq].filter(r => r.toward !== undefined).map(r => r.toward);
const med = a => { const b = [...a].sort((x, y) => x - y); return b.length ? b[b.length >> 1] : NaN; };
info(`midfield: he goes for it ${avg(mv(1)).toFixed(2)} s after the pass at Off IQ 1, ${avg(mv(10)).toFixed(2)} s at 10 -- for a spot ${med(tw(1))} px and ${med(tw(10))} px nearer the ball than he is (median of ` + [1, 10].map(iq => tw(iq).join(' ')).join(' / ') + ')');
ok(Math.min(...mv(1)) >= 0.35 && Math.max(...mv(10)) <= 0.12, 'a pass to him: he goes for it once he\'s read it -- not before 0.35 s at Off IQ 1, inside 0.12 s at 10');
ok(cnt(S.midfield10, 'his') === 10 && med(tw(10)) >= 20 && med(tw(10)) - med(tw(1)) >= 15 && Math.abs(med(tw(1))) < 25, '...at 10 he comes to meet it (' + med(tw(10)) + ' px nearer the ball), at 1 he lets it come to him (' + med(tw(1)) + ' px)');
const ft = (sc, iq) => S[sc + iq].filter(r => r.k === 'shot' && r.after <= 0.06), shots = (sc, iq) => S[sc + iq].filter(r => r.after != null).map(r => r.after + ' s, xG ' + (r.xg || 0).toFixed(2)).join('; ');
for(const sc of ['cutback', 'square']) info((sc === 'cutback' ? 'a ball pulled back to him 13 m out: ' : 'a ball squared to him 22 m out: ') + [1, 10].map(iq => `Off IQ ${iq}: ${cnt(S[sc + iq], 'shot')} shots, ${ft(sc, iq).length} first time (${shots(sc, iq)})`).join(' -- '));
ok(ft('cutback', 10).length >= 8 && ft('cutback', 1).length <= 1, 'a good chance pulled back to him, nobody on him: Off IQ 10 hits it first time (' + ft('cutback', 10).length + ' of 10), Off IQ 1 takes a touch (' + ft('cutback', 1).length + ' first time)');
ok(ft('square', 10).length <= 1 && [...ft('cutback', 10), ...ft('square', 10)].every(r => r.xg >= 0.3), '...not a chance under xG 0.3: squared to him 22 m out, Off IQ 10 takes a touch too (' + ft('square', 10).length + ' first time)');
info('a cross: ' + [1, 10].map(iq => `Off IQ ${iq}: headed ${cnt(S['cross' + iq], 'headed')}, cleared ${cnt(S['cross' + iq], 'cleared')} of 16`).join('; '));
ok(cnt(S.cross10, 'headed') >= 9 && cnt(S.cross10, 'headed') - cnt(S.cross1, 'headed') >= 2, 'a cross to him with a marker on him: he heads it more at Off IQ 10 (' + cnt(S.cross10, 'headed') + ' of 16) than at 1 (' + cnt(S.cross1, 'headed') + ')');

// ONLY TWO GO FOR A CROSS: three of ours in the box, the cross in -- at most two of them going for it at once
const two = await page.evaluate(() => new Promise(res => {
  const T = window.__T, R = T.players().filter(q => q.team === 'R' && (q.role === 'ATT' || q.role === 'MID')), pas = T.players().find(q => q.team === 'R' && q.role === 'DEF') || T.players().filter(q => q.team === 'R')[1];
  const atk = T.atkOf('R'), gx = atk > 0 ? T.FW : 0, U = u => gx - atk * u, three = R.slice(0, 3); T.freeze();
  for(const q of T.players()) if(q !== pas && !three.includes(q)){ q.x = T.FW / 2 - atk * 700; q.y = q.team === 'R' ? 50 : T.FH - 50; q.vx = q.vy = 0; }
  three.forEach((q, i) => { q.x = U(T.BX + 60 + i * 40); q.y = T.YC - 60 + i * 60; q.vx = q.vy = 0; q.state = 'normal'; q.stats = Object.assign({}, q.stats, { offIQ: 8 }); });
  pas.x = U(100); pas.y = T.YC + 480; pas.vx = pas.vy = 0; pas.facing = { x: atk, y: 0 };
  const b = T.ball(); b.ownedBy = pas; b.x = pas.x + 20; b.y = pas.y; b.z = 0; b.vz = 0; b.crossT = 0; b.lastTouch = 'R';
  T.aiCross(pas, { x: U(250), y: T.YC, who: three[0] }); const t0 = T.simNow(); let most = 0;
  (function tick(){ most = Math.max(most, three.filter(q => /CROSS/.test(q.dbgTag || '')).length);
    if(T.simNow() - t0 > 1.1){ b.ownedBy = null; b.crossT = 0; b.crossBy = null; return res(most); } requestAnimationFrame(tick); })(); }));
ok(two === 2, 'three of ours in the box for a cross: two go for it (' + two + ')');

// YOUR MAN, THE STICK LEFT ALONE: after your pass he waits his read (Off IQ) before he runs to meet it
await page.evaluate(() => { window.__aiAll = false; });
const yours = await page.evaluate(() => { const T = window.__T, atk = T.atkOf('G'), G = T.players().filter(q => q.team === 'G' && q.role !== 'G'), c = G[0], m = G[1], keep = m.stats, out = {};
  for(const v of [1, 10]){ T.freeze(); T.setControlled(c); m.stats = Object.assign({}, keep, { offIQ: v });
    for(const q of T.players()) if(q !== c && q !== m){ q.x = T.FW / 2 - atk * 700; q.y = 40; q.vx = q.vy = 0; }
    c.x = T.FW / 2; c.y = T.YC; c.vx = c.vy = 0; c.facing = { x: atk, y: 0 }; c.state = 'normal'; m.x = c.x + atk * 300; m.y = T.YC; m.vx = m.vy = 0; m.state = 'normal';
    const b = T.ball(); b.ownedBy = c; b.dribbler = null; b.x = c.x + atk * 20; b.y = c.y; b.z = 0; b.vz = 0; b.vx = b.vy = 0;
    T.doPass(0.2); const r = T.recvAuto(); out[v] = { on: T.controlled() === m, wait: r ? +(r.wait - T.simNow()).toFixed(3) : null }; }
  m.stats = keep; return out; });
info('your pass, his read: ' + JSON.stringify(yours));
ok(yours[1].on && yours[10].on && Math.abs(yours[1].wait - 0.4) < 0.01 && Math.abs(yours[10].wait - 0.05) < 0.01, 'you\'re put on the man you pass to, and left alone he waits his read before he runs to meet it (0.4 s at Off IQ 1, 0.05 s at 10)');

process.exitCode = rep.finish();
await browser.close();
