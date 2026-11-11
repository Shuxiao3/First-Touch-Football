// FOOTBALL CLASSIC, YOUR CROSS AND YOUR CORNER (v142): your cross puts you on the man it's for -- high (he goes to where
// it's coming through head height for him) or low -- and so does a corner of yours, taken by you or for you when your
// time's up (8 s). The man it's for is the one of ours who'll get to it first, the one it was aimed at unless another's
// clearly sooner. K pressed as it's struck, he goes up for it -- a duel for their man at it -- and heads it as it gets
// to him, as the computer's man would; no K, no header (and no slide under it). While a corner of yours is being taken
// a panel at the top lets you pick how many go in the box and how many stay back for the break (− +, or Q E and Z C);
// the rest go to midfield. Back, a defender before a midfielder; in the box, the best in the air. It's kept for your
// corners after; the computer's are its own (four in the box, two back).
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={players:()=>players, ball:()=>ball, FW, FH, YC, MK, PA_D, PA_HW, atkOf, rs:()=>restartInfo, rt:()=>restartT, check:()=>checkOutOfPlay(), controlled:()=>controlled, '
  + 'setCtl:q=>setControlled(q), recv:()=>recvAuto, prefs:()=>PREFS, simNow:()=>simNow, cross:(c,low)=>cross(c,low), keeperOf, grade:()=>lastGrade, shotQ:()=>shotQ, '
  + 'noPlan:()=>{ for(const t of ["G","R"]) if(PLAN[t]) PLAN[t].last=null; }, manFor:(q,by)=>crossManFor(q,by), '
  + 'freeze:()=>{ restartT=0; restartInfo=null; offsideT=0; offsidePass=null; scoredT=0; gkHold=null; kickT=0; kickBy=null; kickTo=null; skill=null; matchClock=0; advOn=false; recvAuto=null; shotQ=null; }};\n  const LAB_TITLE=');
patch('  function headOnGoal(p){', '  function headOnGoal(p){ if(window.__hd) window.__hd.push(p===controlled?"you":"mate");');   // (who heads it)
patch('  const starStats=', '  STARS.length=0;\n  const starStats=');   // (v198: City\'s men as they were, without its two stars -- all of them line up at these corners)
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-cset-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy, fastFrames: true });
const { ok, info } = rep;
const HELPERS = `window.__run = (sec, until) => new Promise(res => { const T = window.__T, t0 = T.simNow();
  (function tick(){ if(T.simNow() - t0 >= sec || (until && until())) return res(+(T.simNow() - t0).toFixed(2)); requestAnimationFrame(tick); })(); });
// a corner of ours at their end, our men up the pitch as when it comes from an attack
window.__corner = () => { const T = window.__T, b = T.ball(), atk = T.atkOf('G'), gx = atk > 0 ? T.FW : 0; T.freeze();
  T.players().forEach((p, i) => { p.vx = p.vy = 0; p.state = 'normal'; if(p.team === 'G'){ p.x = gx - atk * (14 + (i % 4) * 6) * T.MK; p.y = T.YC + Math.sin(i * 2.4) * 16 * T.MK; } else { p.x = gx - atk * (5 + (i % 4) * 4) * T.MK; p.y = T.YC + Math.sin(i * 1.7) * 12 * T.MK; } });
  b.ownedBy = null; b.x = gx + atk * 12; b.y = 30; b.vx = b.vy = 0; b.z = 0; b.lastTouch = 'R'; T.check(); };
// who's where in the plan: in the box, back in our half, in midfield -- and their roles
window.__where = () => { const T = window.__T, R = T.rs(), out = { box: [], back: [], mid: [] }; if(!R || !R.plan) return out;
  for(const [q, s] of R.plan){ if(q.team !== R.team || !s || s.x == null) continue; const k = (R.boxMen || []).includes(q) ? 'box' : (T.atkOf(R.team) * (s.x - T.FW / 2) < 0 ? 'back' : 'mid'); out[k].push(q.role); }
  return out; };`;
await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show'); await page.click('#exhGo'); await page.waitForTimeout(400);
await page.evaluate(HELPERS);

// --- THE PANEL: on for your corner, the counts, the keys, the limits -------------------------------------------------
const panel = () => page.evaluate(() => ({ on: document.getElementById('cornerSet').classList.contains('on'), box: +document.getElementById('csBox').textContent, back: +document.getElementById('csBack').textContent, mid: +document.getElementById('csMid').textContent, where: window.__where() }));
await page.evaluate(() => { const P = window.__T.prefs(); P.cornerBox = 4; P.cornerBack = 2; window.__corner(); });
await page.evaluate(() => window.__run(0.2));
const s0 = await panel();
await page.keyboard.press('KeyE'); const s1 = await panel();
await page.keyboard.press('KeyC'); const s2 = await panel();
await page.keyboard.press('KeyQ'); await page.keyboard.press('KeyQ'); await page.keyboard.press('KeyC'); const s3 = await panel();
await page.click('#cornerSet [data-cs="back"][data-d="1"]'); const s4 = await panel();
for(let i = 0; i < 6; i++) await page.keyboard.press('KeyZ'); const s5 = await panel();
info('the panel: ' + JSON.stringify({ s0, s1, s2, s3, s4, s5 }));
const sum = s => s.box + s.back + s.mid, n = sum(s0);
ok(s0.on && s0.box === 4 && s0.back === 2 && s0.mid === n - 6 && s0.where.box.length === 4 && s0.where.back.length === 2 && s0.where.mid.length === n - 6,
  'your corner: the panel\'s up -- ' + s0.box + ' in the box, ' + s0.back + ' back, ' + s0.mid + ' in midfield -- and your men go there');
// n of them to place (the taker aside); at most 6 in the box and 5 back
const b2 = Math.min(3, n - 5), b3 = Math.min(b2 + 1, n - 3, 5), b4 = Math.min(b3 + 1, n - 3, 5);
ok(s1.box === 5 && s1.where.box.length === 5 && s2.box === 5 && s2.back === b2 && sum(s2) === n && s2.where.back.length === b2,
  'E one more in the box (5); C one more back only if there\'s a man spare (' + s2.back + ' back, all ' + n + ' of them placed)');
ok(s3.box === 3 && s3.back === b3 && s3.where.back.length === b3 && s4.back === b4 && s4.where.back.length === b4 && s5.back === 0 && s5.where.back.length === 0 && s5.where.mid.length === n - 3,
  'Q one fewer in the box, C one more back (' + s3.back + '), a tap on the panel\'s + one more again (' + s4.back + '), Z down to none back -- the rest in midfield (' + s5.mid + ')');
const order = { DEF: 0, MID: 1, ATT: 2 }, rk = r => order[r] ?? 2;
const fair = w => Math.max(-1, ...w.back.map(rk)) <= Math.min(9, ...w.box.concat(w.mid).map(rk));
ok([s0, s3, s4].every(s => fair(s.where)) && s4.where.back.includes('MID') === (s4.where.box.concat(s4.where.mid).filter(r => r === 'DEF').length === 0 && s4.where.back.length > s4.where.back.filter(r => r === 'DEF').length),
  'back, the defenders first and then a midfielder: ' + [s0, s3, s4].map(s => s.where.back.join('/')).join('  '));

// --- KEPT: the next corner of yours is set up the same; the computer's its own --------------------------------------------
let r = await page.evaluate(async () => { const T = window.__T, P = T.prefs(); P.cornerBox = 3; P.cornerBack = 3; T.freeze(); window.__corner(); await window.__run(0.2);
  const a = window.__where(), saved = JSON.parse(localStorage.getItem('ftc_prefs') || '{}');
  // theirs: at our end, off one of ours
  T.freeze(); const b = T.ball(), atkR = T.atkOf('R'), gxR = atkR > 0 ? T.FW : 0; b.ownedBy = null; b.x = gxR + atkR * 12; b.y = 30; b.vx = b.vy = 0; b.z = 0; b.lastTouch = 'G'; T.check(); await window.__run(0.2);
  const th = window.__where(), shown = document.getElementById('cornerSet').classList.contains('on'); T.freeze(); return { a, saved: [saved.cornerBox, saved.cornerBack], th, shown }; });
info('kept: ' + JSON.stringify(r));
ok(r.saved[0] === s5.box && r.saved[1] === s5.back, 'what you picked is saved on the device (' + r.saved[0] + ' in the box, ' + r.saved[1] + ' back)');
ok(r.a.box.length === 3 && r.a.back.length === 3, 'your next corner: 3 in the box and 3 back, as you left it');
ok(r.th.box.length === 4 && r.th.back.length === 2 && !r.shown, 'their corner: their own four in the box and two back -- and no panel');

// --- YOUR CROSS: you're on the man it's for, who goes to where it's coming ----------------------------------------------
r = await page.evaluate(async () => { const T = window.__T, b = T.ball(), out = {};
  for(const low of [false, true]){
    T.freeze(); const atk = T.atkOf('G'), gx = atk > 0 ? T.FW : 0, gs = T.players().filter(p => p.team === 'G'), c = gs[0];
    gs.forEach((p, i) => { p.vx = p.vy = 0; p.state = 'normal'; if(p !== c){ p.x = gx - atk * (8 + i * 1.5) * T.MK; p.y = T.YC + (i % 3 - 1) * 6 * T.MK; } });
    for(const p of T.players()) if(p.team === 'R'){ p.x = T.FW / 2; p.y = 40; }
    c.x = gx - atk * 6 * T.MK; c.y = T.YC - 22 * T.MK; c.facing = { x: 0, y: 1 }; T.setCtl(c); b.ownedBy = c; b.x = c.x; b.y = c.y + c.r + b.r + 5; b.vx = b.vy = 0; b.z = 0; b.lastTouch = 'G';
    await window.__run(0.1);
    T.cross(0.4, low); const now = T.controlled(), rv = T.recv();
    out[low ? 'low' : 'high'] = { crossed: !b.ownedBy, was: c.num, now: now.num, mate: now !== c && now.team === 'G', rcv: b.intendedRcv ? b.intendedRcv === now : null, spot: !!(rv && rv.q === now && rv.spot) };
  }
  T.freeze(); return out; });
info('your cross: ' + JSON.stringify(r));
ok(r.high.crossed && r.high.mate && r.high.spot, 'your cross: you\'re on the man it\'s for (#' + r.high.was + ' -> #' + r.high.now + '), going to where it\'s coming through head height for him');
ok(r.low.crossed && r.low.mate, 'a low one too: you\'re on the man it\'s for (#' + r.low.was + ' -> #' + r.low.now + ')');

// --- YOUR CORNER, CROSSED -- or taken for you at 8 s: you're on the man it's for -----------------------------------------
r = await page.evaluate(async () => { const T = window.__T, out = {};
  window.__corner(); await window.__run(5, () => T.rs() && T.rs().set); const tk = T.rs().taker; out.yours = T.controlled() === tk;
  T.cross(0.5, false); await window.__run(1, () => !T.rs()); out.crossed = !T.rs(); out.onMate = T.controlled() !== tk && T.controlled().team === 'G';
  window.__corner(); await window.__run(5, () => T.rs() && T.rs().set); const tk2 = T.rs().taker;
  out.after = await window.__run(10, () => !T.rs()); out.onMate2 = T.controlled() !== tk2 && T.controlled().team === 'G' && !!T.recv();
  T.freeze(); return out; });
info('your corner: ' + JSON.stringify(r));
ok(r.yours && r.crossed && r.onMate, 'your corner, crossed: you\'re on the man it\'s for');
ok(Math.abs(r.after - 8) < 0.2 && r.onMate2, 'left alone, it\'s crossed for you after ' + r.after + ' s -- time to set it up -- and you\'re on the man it\'s for');

// --- K AS IT'S STRUCK: he goes up for it and heads it; no K, no header and no slide under it ------------------------------
// (one of ours in the box and the crosser; theirs away up the pitch, their keeper off: it's his to get to)
r = await page.evaluate(async () => { const T = window.__T, b = T.ball(), out = { K: [], none: [] }, kp = T.keeperOf('R');
  const prev = { benched: kp.benched, mode: kp.mode }; kp.benched = true; kp.mode = 'line';
  for(let k = 0; k < 10; k++){ const withK = k % 2 === 0, side = k % 4 < 2 ? -1 : 1;
    T.freeze(); T.noPlan(); const atk = T.atkOf('G'), gx = atk > 0 ? T.FW : 0, gs = T.players().filter(p => p.team === 'G'), c = gs[0], f = gs[1];
    gs.forEach((p, i) => { p.vx = p.vy = 0; p.state = 'normal'; p.z = 0; p.vz = 0; if(p !== c && p !== f){ p.x = T.FW / 2 - atk * (12 + i * 2) * T.MK; p.y = T.YC + (i % 3 - 1) * 9 * T.MK; } });
    T.players().filter(p => p.team === 'R').forEach((p, i) => { p.vx = p.vy = 0; p.state = 'normal'; p.x = T.FW / 2 + atk * 4 * T.MK; p.y = T.YC + (i - 4) * 5 * T.MK; });
    f.x = gx - atk * (10 + k % 3) * T.MK; f.y = T.YC + side * (k % 3) * T.MK;
    c.x = gx - atk * 4 * T.MK; c.y = T.YC + side * 20 * T.MK; c.facing = { x: 0, y: -side }; T.setCtl(c);
    b.ownedBy = c; b.x = c.x; b.y = c.y - side * (c.r + b.r + 5); b.vx = b.vy = 0; b.z = 0; b.lastTouch = 'G'; b.shotBy = null; b.shotT = 0;
    await window.__run(0.1);
    T.cross(0, false); await window.__run(0.6, () => !b.ownedBy);
    const tr = { on: T.controlled() === f, hd: [], slid: false, upEarly: false, goingUp: false };
    // the man it's for: the one it was aimed at, nobody else of ours near it -- and him again, asked for one of ours from deep
    if(k === 0){ out.manFor = T.manFor(f, c) === f && T.manFor(gs[2], c) === f; }
    window.__hd = [];
    if(withK){ dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyK', key: 'k' })); dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyK', key: 'k' })); }
    await window.__run(2.5, () => { if(f.state === 'slide') tr.slid = true; if(f.z > 0 && b.z > 60 && !window.__hd.length) tr.upEarly = true;
      if(b.crossT > 0 && f.aerialT != null && T.simNow() - f.aerialT < 0.1) tr.goingUp = true;
      return window.__hd.length > 0 || !!b.ownedBy || (b.crossT <= 0 && b.z < 2); });
    tr.hd = window.__hd.slice(); if(tr.hd.length){ await window.__run(0.2); tr.away = b.ownedBy !== f && Math.hypot(b.vx, b.vy) > 150; } tr.grade = T.grade(); window.__hd = null;
    T.freeze(); b.ownedBy = null; b.x = T.FW / 2; b.y = T.YC; b.vx = b.vy = b.vz = 0; b.z = 0;   // (before it's in: no goal to restart from)
    (withK ? out.K : out.none).push(tr); }
  kp.benched = prev.benched; kp.mode = prev.mode; T.freeze(); return out; });
info('K as it\'s struck: ' + JSON.stringify(r));
const kHead = r.K.filter(t => t.hd[0] === 'you').length;
ok(r.K.concat(r.none).every(t => t.on) && r.manFor, 'your cross: you\'re on the man it\'s for -- and asked for another of ours, from deep, it\'s still him');
ok(kHead >= 4 && r.K.every(t => t.goingUp && !t.slid && !t.upEarly), 'K pressed as it\'s struck: he goes up for it (a duel for their man at it) and heads it as it gets to him, ' + kHead + ' of ' + r.K.length + ' -- not a slide under it, nor a jump with it still over him');
ok(r.K.filter(t => t.hd.length).every(t => t.away), 'and it\'s away off his head -- not chested down by him again as it leaves it');
ok(r.none.every(t => t.hd.length === 0 && !t.slid && !t.goingUp), 'no K: no header, no slide, not going up for it (' + r.none.map(t => t.grade).join(', ') + ')');

process.exitCode = rep.finish();
await browser.close();
