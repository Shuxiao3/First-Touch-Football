// FOOTBALL CLASSIC, THE TEAM'S INSTRUCTIONS (v112: they replace every man's -- every spot's -- own). WITHOUT THE BALL: the
// defensive line and the line of engagement (dragged on the lines' own little pitch: in range, never closer than 14 m),
// which line stands on the line of engagement (the forwards, the midfield between them and the back line; or the
// midfield, the forwards ahead of it), what the back line does about a runner (HOLD THE LINE, OFFSIDE TRAP, FOLLOW
// RUNNERS, PRESS UP), how the back and middle lines go into a man (STAY IN FRONT, BALANCED, TACKLE), and what the forwards
// do (CONSERVE, DEFEND THE LINE, PRESS UP). (v161: nothing WITH IT any more -- how far each line went forward and what
// the wide men looked for: with the ball a side plays to its style, and its men to theirs.) A style picked sets its own -- and how the side plays out from the back is its style's (v116: no BUILD-UP to set). Here: the lines' rules; where the block stands for them; the
// panel on the smallest phones; and computer v computer matches (every man on the computer, a virtual clock), one side
// told one thing and then another, the other side on its defaults. On a copy of the game that lets the test reach it.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={players:()=>players, keepers:()=>keepers, gkHold:()=>gkHold, ball:()=>ball, now:()=>simNow, atkOf, heldBy, FW, MK, YC, over:()=>matchOver, setStyle, buildOfStyle, TI:()=>TI, TAC, tiDefault, tiLines, tiSet, tiPosture, own, setControlled, SIT:()=>SIT,\n'
  + '    setTI:(t,o)=>{ setTI(t,Object.assign(tiDefault(TAC[t].style),o)); }, block:t=>{ blockCache[t]=null; return defBlock(t); }, seen:(t,x,y)=>{ const e=seenBall(t); e.x=x; e.y=y; },\n'
  + '    freeze:()=>{ restartT=0; offsideT=0; scoredT=0; gkHold=null; kickT=0; kickBy=null; kickTo=null; restartInfo=null; for(const t of ["G","R"]) Object.assign(pressSt[t],{until:-9,cd:-9,t:-1,on:false,swarm:-9,lastU:null}); },\n'   // (v136: the press\'s memory of the ball cleared too -- a side could be pressing by chance)
  + '    hold:kp=>{ kp.mode="hold"; kp.holdT=1.0; kp.heldT=0; kp.x=kp.homeX; kp.y=YC; gkHold=kp; ball.ownedBy=null; ball.dribbler=null; ball.intendedRcv=null; ball.x=kp.x-kp.side*18; ball.y=kp.y; ball.z=6; ball.vx=ball.vy=ball.vz=0; }};\n  const LAB_TITLE=');
patch('\n    draw();\n', '\n    if(!window.__noDraw) draw();\n');
patch('      if(p===controlled){ if(!skillStep(p,dt)) stepOutfield(p,hi.ix,hi.iy,dt); }', '      if(p===controlled&&!window.__aiAll){ if(!skillStep(p,dt)) stepOutfield(p,hi.ix,hi.iy,dt); }');
patch('carry(p,dt,p===controlled?(hi.ix||hi.iy):true)', 'carry(p,dt,(p===controlled&&!window.__aiAll)?(hi.ix||hi.iy):true)');
patch('  function slideAt(p, carrier){\n', '  function slideAt(p, carrier){\n    if(window.__M) window.__M.tk[p.team]++;\n');
patch('  function gkLaunch(kp, tx, ty){', '  function gkLaunch(kp, tx, ty){ if(window.__K) window.__K.kick++;');
patch('  function gkShort(kp,tx,ty,vh,vz,asIs){\n', '  function gkShort(kp,tx,ty,vh,vz,asIs){\n    if(window.__K) window.__K.throw++;\n');
patch('          S.runs.push({p:q, x:best.L.x,', '          if(window.__M){ window.__M.runs[team]++; const pw=posOf(q,"atk"); if(pw==="W"||pw==="WM") window.__M.wruns[team]++; } S.runs.push({p:q, x:best.L.x,');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-ti-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
await page.addInitScript(() => { try{ const o = JSON.parse(localStorage.getItem('ftc_prefs') || '{}') || {}; o.diff = o.diff || 'star'; o.halfMin = 5; localStorage.setItem('ftc_prefs', JSON.stringify(o));
  localStorage.setItem('ft_exh', JSON.stringify({ you: 'ARS', opp: 'AVL' })); }catch(e){} });
await page.addInitScript(() => { let vt = 0; const ch = new MessageChannel(), q = [];
  ch.port1.onmessage = () => { const cbs = q.splice(0); vt += 33; for(const cb of cbs){ try{ cb(vt); }catch(e){} } };
  window.requestAnimationFrame = cb => { q.push(cb); if(q.length === 1) ch.port2.postMessage(0); return 0; }; });
const kickOff = async () => { await page.goto('file://' + copy); await page.waitForTimeout(300);
  await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show'); await page.click('#exhGo'); await page.waitForTimeout(300); };

// --- THE LINES' RULES, A STYLE'S OWN, AND WHERE THE BLOCK STANDS FOR THEM ----------------------------------------------------
await kickOff();
const R = await page.evaluate(() => { const T = window.__T, L = (o, k) => { const x = Object.assign({}, o); T.tiLines(x, k); return [x.dl, x.loe]; };
  const out = { lines: { upInto: L({ dl: 48, loe: 54 }, 'dl'), downInto: L({ dl: 40, loe: 30 }, 'loe'), tooHigh: L({ dl: 80, loe: 99 }), tooLow: L({ dl: 2, loe: 9 }) } };
  out.styles = {}; for(const s of ['neutral', 'gegen', 'dcounter', 'control', 'direct']){ const d = T.tiDefault(s); out.styles[s] = [d.dl, d.loe, d.eng, d.aline, d.dtk, T.buildOfStyle(s)].join('/'); }
  out.noBuild = !('build' in T.tiDefault('control')) && !('build' in T.tiDefault('direct'));
  // the block with the ball far off (their keeper's end), each way of standing on the line of engagement
  T.freeze(); const atk = T.atkOf('G'), far = atk > 0 ? T.FW - 60 : 60, m = u => +(u / T.MK).toFixed(1);
  const at = o => { T.setTI('G', o); T.seen('G', far, T.FW / 2 > 0 ? 765 : 765); const B = T.block('G'); return [m(B.uD), m(B.uM), m(B.uF)]; };
  out.block = { fwd: at({ dl: 30, loe: 56 }), mid: at({ dl: 30, loe: 56, eng: 'mid' }), midPress: at({ dl: 30, loe: 56, eng: 'mid', aline: 'press' }), deep: at({ dl: 18, loe: 36 }), high: at({ dl: 46, loe: 70 }) };
  out.posture = ['neutral', 'gegen', 'dcounter'].map(s => { T.setStyle('G', s); return T.TAC.G.def; });
  return out; });
info('lines: ' + JSON.stringify(R.lines) + ' -- styles: ' + JSON.stringify(R.styles) + ' -- block (back, middle, first, m): ' + JSON.stringify(R.block));
ok(R.lines.upInto.join() === '40,54' && R.lines.downInto.join() === '40,54' && R.lines.tooHigh.join() === '50,80' && R.lines.tooLow.join() === '15,30',
  'the lines: the back line pushed up into the line of engagement stops 14 m short, the line of engagement pulled down into it the same; neither goes past its range (back 15-50 m, engagement 30-80 m)');
ok(R.noBuild && R.styles.neutral === '32/54/fwd/line/bal/mixed' && R.styles.gegen === '46/68/fwd/press/tackle/mixed' && R.styles.dcounter === '20/34/mid/line/bal/long' && R.styles.control.endsWith('/short') && R.styles.direct.endsWith('/long'),
  'a style picked sets its own: BALANCED a mid block, GEGENPRESS high and at them, DIRECT COUNTER deep with the midfield on its line; and plays out from the back its way, no BUILD-UP to set -- CONTROL short, DIRECT and DIRECT COUNTER long, the rest mixed: ' + JSON.stringify(R.styles));
const near = (a, b, e) => Math.abs(a - b) <= (e || 0.6);
ok(near(R.block.fwd[0], 30) && near(R.block.fwd[2], 56) && near(R.block.fwd[1], 43) && near(R.block.mid[1], 56) && near(R.block.mid[2], 62) && near(R.block.midPress[2], 66.5)
   && near(R.block.deep[0], 18) && near(R.block.deep[2], 36) && near(R.block.high[0], 46) && near(R.block.high[2], 70),
  'the block, the ball far off: the back line on its line, the forwards on the line of engagement and the midfield halfway (' + R.block.fwd + '); the midfield on it, the forwards a few yards ahead (' + R.block.mid + '), further told to PRESS UP (' + R.block.midPress + ')');
ok(R.posture.join() === 'neutral,press,lowblock', 'and the old code\'s posture follows them: ' + R.posture.join(', '));

// --- A MAN SITTING ON IT beyond their line: yours, 12 m out from our goal, stood still on the ball -- they wait at their line
// of engagement (54 m from theirs), then after 3 s the nearest of theirs goes out and gets it --------------------------------
const sit = await page.evaluate(() => new Promise(res => { const T = window.__T, b = T.ball(), MK = T.MK; window.__aiAll = false; window.__noDraw = true;
  T.freeze(); T.setStyle('G', 'neutral'); T.setStyle('R', 'neutral'); T.setTI('G', {}); T.setTI('R', {});
  const aG = T.atkOf('G'), xG = u => aG > 0 ? u : T.FW - u, xR = u => aG > 0 ? T.FW - u : u;   // (u: metres-in-px from one's own goal)
  const G = T.players().filter(q => q.team === 'G'), man = G.find(q => q.role === 'DEF') || G[0];
  Object.assign(man, { x: xG(12 * MK), y: T.YC + 150, vx: 0, vy: 0, state: 'normal', facing: { x: aG, y: 0 } });
  const B = T.block('R'); for(const q of T.players()) if(q.team === 'R'){ const r = q.slotDef ? q.slotDef.role : q.role;
    q.x = xR(r === 'DEF' ? B.uD : r === 'MID' ? B.uM : B.uF); q.vx = q.vy = 0; q.state = 'normal'; }
  T.setControlled(man); Object.assign(b, { z: 0, vx: 0, vy: 0, vz: 0 }); T.own(man); const t0 = T.now(); let at25 = null, won = null;
  const nearR = () => Math.min(...T.players().filter(q => q.team === 'R').map(q => Math.hypot(q.x - man.x, q.y - man.y))) / MK;
  (function tick(){ const t = T.now() - t0;
    if(at25 === null && t >= 2.5) at25 = +nearR().toFixed(1);
    if(won === null && (b.lastTouch === 'R' || (b.ownedBy && b.ownedBy.team === 'R'))) won = +t.toFixed(1);
    if(won !== null || t > 16) return res({ at25, won, sat: +T.SIT().t.toFixed(1) });
    requestAnimationFrame(tick); })(); }));
info('a man sitting on it: ' + JSON.stringify(sit));
ok(sit.at25 > 15 && sit.won !== null && sit.won > 3 && sit.won < 14, 'a man stood still on the ball 12 m out from his goal: they wait at their line (the nearest ' + sit.at25 + ' m off after 2.5 s), then after 3 s their nearest goes out and wins it (' + sit.won + ' s)');

// --- AND WHAT IT DOES: computer v computer, side G told one thing, then another --------------------------------------------
const play = (ti, n) => page.evaluate(async ({ ti }) => { const T = window.__T; window.__noDraw = true; window.__aiAll = true;
  T.setStyle('G', 'neutral'); T.setStyle('R', 'neutral'); T.setTI('G', ti); T.setTI('R', {});
  window.__M = { tk: { G: 0, R: 0 }, long: { G: 0, R: 0 }, short: { G: 0, R: 0 }, runs: { G: 0, R: 0 }, wruns: { G: 0, R: 0 } };
  let dSum = 0, dN = 0, ownT = 0, last = null;
  await new Promise(res => { (function tick(){ if(T.over() || T.now() > 60 * 30) return res();
    const c = T.heldBy(), aG = T.atkOf('G'), U = x => (aG > 0 ? x : T.FW - x) / T.MK, b = T.ball();
    if(c){ if(c.team !== (last && last.team)) ownT = T.now(); last = c; }
    if(c && c.team === 'R' && b.ownedBy === c && U(b.x) > 55 && T.now() - ownT > 4){   // (they've had it a while, in their half: the block as it's set)
      const d = T.players().filter(p => p.team === 'G' && (p.slotDef ? p.slotDef.role : p.role) === 'DEF').map(p => U(p.x)); if(d.length){ dSum += d.reduce((s, x) => s + x, 0) / d.length; dN++; } }
    requestAnimationFrame(tick); })(); });
  return { line: dN ? +(dSum / dN).toFixed(1) : null, M: window.__M }; }, { ti });
const runs = async (ti, n) => { const out = []; for(let i = 0; i < n; i++){ await kickOff(); out.push(await play(ti)); } return out; };
const sum = (rs, f) => rs.reduce((s, r) => s + f(r), 0), mean = (rs, f) => +(sum(rs, f) / rs.length).toFixed(1);
const deep = await runs({ dl: 18, loe: 36 }, 1), high = await runs({ dl: 46, loe: 70 }, 1);
info('the back line, they on it a while in their half: deep ' + mean(deep, r => r.line) + ' m, high ' + mean(high, r => r.line) + ' m');
ok(mean(high, r => r.line) - mean(deep, r => r.line) > 12, 'the lines set the block: a deep one\'s back line ' + mean(deep, r => r.line) + ' m from our goal, a high one\'s ' + mean(high, r => r.line) + ' m');
const tk = await runs({ dtk: 'tackle', mtk: 'tackle' }, 2), fr = await runs({ dtk: 'front', mtk: 'front' }, 2);
info('tackles a match: TACKLE ' + mean(tk, r => r.M.tk.G) + ', STAY IN FRONT ' + mean(fr, r => r.M.tk.G));
ok(mean(tk, r => r.M.tk.G) > 2 * mean(fr, r => r.M.tk.G), 'TACKLE goes in more than twice as often as STAY IN FRONT (' + mean(tk, r => r.M.tk.G) + ' a match against ' + mean(fr, r => r.M.tk.G) + ')');
// THE BUILD-UP, the computer's keeper -- his style's (v116): given the ball three times each way, the men where the
// kick-off put them. DIRECT, he kicks it (gkLaunch: up to a man who can win it, or with nobody, after a moment, up the
// emptier side); CONTROL POSSESSION, he throws or rolls it to a man near him (gkShort). (Your keeper's, as you press
// PASS: classic-keeper.mjs.)
await kickOff();
const bu = await page.evaluate(async () => { const T = window.__T, kp = T.keepers().find(k => k.team === 'R'), out = {}, s0 = T.TAC.R.style;
  for(const b of ['long', 'short']){ T.setStyle('R', b === 'long' ? 'direct' : 'control'); window.__K = { kick: 0, throw: 0 };
    for(let i = 0; i < 3; i++){ T.freeze(); T.hold(kp); const t0 = T.now();
      await new Promise(res => { (function tick(){ if(T.gkHold() !== kp || T.now() - t0 > 9) return res(); requestAnimationFrame(tick); })(); }); }
    out[b] = [window.__K.kick, window.__K.throw]; }
  T.setStyle('R', s0); return out; });
info('the computer\'s keeper, three balls each way (kicked, thrown): DIRECT ' + bu.long + ', CONTROL POSSESSION ' + bu.short);
ok(bu.long.join() === '3,0' && bu.short.join() === '0,3', 'the build-up by the style: DIRECT, the keeper kicks it long every time (' + bu.long + '); CONTROL POSSESSION, he plays it short every time (' + bu.short + ')');
// (WIDE MEN TO FEET or IN BEHIND, told, and their runs in behind a match: gone with the instruction, v161)
const kept = await page.evaluate(() => { const T = window.__T; T.setTI('G', { wide: 'feet', aruns: 'run', mruns: 'fwd', druns: 'push' }); const o = T.TI().G; return ['druns', 'mruns', 'aruns', 'wide'].filter(k => k in o); });
ok(!kept.length, 'nothing with the ball can be told any more: a set with WIDE MEN, FORWARDS, MIDFIELD or DEFENDERS in it keeps none of them (' + (kept.join(', ') || 'none kept') + ')');

// --- THE PANEL, WITHOUT THE BALL, ON THE SMALLEST PHONES: the lines' pitch and every row on the screen, in a match ----------
for(const [w, h] of [[640, 360], [844, 340]]){
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true }); const pg = await ctx.newPage();
  await pg.goto('file://' + copy); await pg.waitForTimeout(500);
  await pg.tap('#smItems [data-act="exhibition"]'); await pg.waitForSelector('#exhPanel.show'); await pg.tap('#exhGo'); await pg.waitForTimeout(1200);
  await pg.evaluate(() => document.getElementById('menuBtn').click()); await pg.waitForTimeout(200);
  await pg.tap('#pauseGrid [data-pause="tactics"]'); await pg.waitForTimeout(250);
  await pg.tap('#mtacOv [data-mtph="def"]'); await pg.waitForTimeout(150); await pg.tap('#mtacOv [data-cside="instr"]'); await pg.waitForTimeout(200);
  const f = await pg.evaluate(() => { const R = document.querySelector('#mtacOv .tbRight'), P = R.querySelector('.tiPanel'), all = [...R.querySelectorAll('.tiOpt, .tiPitch, .tiNote')];
    const r0 = R.getBoundingClientRect(); return { rows: P ? P.querySelectorAll('.tiRow').length : 0, pitch: !!R.querySelector('.tiPitch'), fits: R.scrollHeight <= R.clientHeight + 1,
      inside: all.every(e => { const r = e.getBoundingClientRect(); return r.top >= r0.top - 1 && r.bottom <= r0.bottom + 1 && r.right <= innerWidth + 1; }) }; });
  ok(f.rows === 5 && f.pitch && f.fits && f.inside, `a ${w}x${h} phone, in a match: without the ball the lines' pitch and its ${f.rows} rows, all of it on the screen`);
  await ctx.close();
}

process.exitCode = rep.finish() ? 1 : 0;
await browser.close();
