// FOOTBALL CLASSIC, STRENGTH: two men who run into each other are pushed apart by Strength cubed (the stronger holds his
// ground), and a stronger man driving into a weaker one knocks him off his line by the square of the gap -- a huge gap
// puts him down. The man on the ball holds one of theirs off his back and sides (the cushion): bigger the stronger he
// is and the weaker the other man, none in front, a third smaller flat out, worn through by a man leaning on it (fast
// if he's the stronger, hardly at all if he's much the weaker), and a stronger man through it muscles him off the
// ball. So a strong man running with it isn't robbed from
// behind, a weak one is, and standing still he's only robbed by a man who's come round in front of him. A strong
// striker holds it up: the computer's keener to, and the man on his back doesn't get it.
// On a copy of the game that lets the test pause it, step the bodies, set the scene, hold the stick and hear of every
// tackle (where the man who made it was).
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={players:()=>players, keepers:()=>keepers, controlled:()=>controlled, ball:()=>ball, P, FW, FH, YC, TAC, atkOf, strengthOf, simNow:()=>simNow, '
  + 'separateBodies, shieldCushion, contactTackles, obMods, pause:v=>{ pauseOpen=v; }, setControlled, stick:(x,y)=>{ window.__stick={x,y}; }, '
  + 'freeze:()=>{ restartT=0; offsideT=0; scoredT=0; gkHold=null; skill=null; oneTouch=null; ftAim=null; recvAuto=null; }};\n  const LAB_TITLE=');
patch('    if(padId!==null){const l=Math.hypot(pdx,pdy);if(l>10){ix=pdx/l;iy=pdy/l;}}',
  '    if(padId!==null){const l=Math.hypot(pdx,pdy);if(l>10){ix=pdx/l;iy=pdy/l;}}\n    if(window.__stick&&(window.__stick.x||window.__stick.y)){ ix=window.__stick.x; iy=window.__stick.y; }');   // (a stick the test can hold)
patch('      if(p===controlled){ if(!skillStep(p,dt)) stepOutfield(p,hi.ix,hi.iy,dt); }', '      if(p===controlled&&!window.__aiAll){ if(!skillStep(p,dt)) stepOutfield(p,hi.ix,hi.iy,dt); }');   // your man on the computer too
// every tackle: how far round from the way the man on the ball was facing the man who took it was
patch('  function winBall(t,carrier){\n', '  function winBall(t,carrier){\n    if(window.__TK){ const f=carrier.facing, dx=t.x-carrier.x, dy=t.y-carrier.y; window.__TK.push(Math.acos(Math.max(-1,Math.min(1,(dx*f.x+dy*f.y)/(Math.hypot(dx,dy)||1))))*57.3); }\n');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-strength-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show'); await page.click('#exhGo'); await page.waitForTimeout(1500);

// BODY ON BODY, the game paused and the bodies stepped by hand: two men 10 px into each other; one running at 180 px/s
// into another standing; one of theirs 27 px from the man on the ball, behind him, square on and in front, and
// leaning on him for 2 s; and the man on the ball flat out
const U = await page.evaluate(() => {
  const T = window.__T; T.pause(true); T.freeze();
  const ps = T.players(), bl = T.ball(), G = ps.filter(q => q.team === 'G'), R = ps.filter(q => q.team === 'R'), out = {};
  const park = () => { ps.forEach((q, i) => { q.x = 60 + i * 70; q.y = 40; q.vx = q.vy = 0; q.state = 'normal'; q.sprint = false; q.lean = 0; q.leanOn = undefined; });
    for(const k of T.keepers()) k.y = T.FH - 30; bl.ownedBy = null; bl.dribbler = null; bl.x = 40; bl.y = T.FH - 40; bl.z = 0; };
  const str = (p, s) => { p.stats = Object.assign({}, p.stats, { strength: s }); };
  const a = G[1], c = R[1], keepA = a.stats, keepC = c.stats;
  out.push = [[5.5, 5.5], [7, 5], [9, 3]].map(([x, y]) => { park(); str(a, x); str(c, y);
    a.x = 1000; a.y = 700; c.x = 1016; c.y = 700; T.separateBodies(1 / 60); return { x, y, a: 1000 - a.x, c: c.x - 1016 }; });
  out.barge = [[5.5, 5.5], [7, 5], [9, 3]].map(([x, y]) => { park(); str(a, x); str(c, y);
    a.x = 1000; a.y = 700; a.vx = 180; c.x = 1025; c.y = 700; T.separateBodies(1 / 60); return { x, y, knock: c.vx, keeps: a.vx / 180, down: c.state === 'stumble' }; });
  const onBall = () => { a.x = 1000; a.y = 700; a.facing = { x: 1, y: 0 }; bl.ownedBy = a; bl.x = 1025; bl.y = 700; };
  out.cush = [];
  for(const [x, y] of [[9, 3], [5.5, 5.5], [3, 9]]) for(const ang of [180, 90, 30]){ park(); str(a, x); str(c, y); onBall();
    c.x = 1000 + Math.cos(ang / 57.3) * 27; c.y = 700 + Math.sin(ang / 57.3) * 27;
    for(let k = 0; k < 6; k++) T.separateBodies(1 / 60);
    out.cush.push({ x, y, ang, d: Math.hypot(c.x - a.x, c.y - a.y), cu: T.shieldCushion(a, c) }); }
  out.wear = [[9, 3], [5.5, 5.5], [5, 7]].map(([x, y]) => { park(); str(a, x); str(c, y); onBall(); const lean = [];
    for(let k = 1; k <= 120; k++){ c.x = 973; c.y = 700; T.separateBodies(1 / 60); if(k === 60 || k === 120) lean.push(c.lean); }
    return { x, y, lean }; });
  park(); str(a, 9); str(c, 3); onBall(); c.x = 960; c.y = 700; const walk = T.shieldCushion(a, c);
  a.sprint = true; a.vx = 0.98 * 228; const flat = T.shieldCushion(a, c);
  out.sprint = { walk, flat };
  a.stats = keepA; c.stats = keepC; park(); T.pause(false); return out; });
const f1 = v => (+v).toFixed(1);
info('pushed apart (of 10 px): ' + U.push.map(r => `${r.x} v ${r.y}: ${f1(r.a)}/${f1(r.c)}`).join(', '));
ok(Math.abs(U.push[0].a - 5) < 0.1 && Math.abs(U.push[0].c - 5) < 0.1, 'level men are pushed apart evenly');
ok(U.push[1].c > 7 && U.push[1].c < 7.6, '7 against 5: the weaker moved about three-quarters of it (' + f1(U.push[1].c) + ' px)');
ok(U.push[2].c > 9.4, '9 against 3: the weaker moved nearly all of it (' + f1(U.push[2].c) + ' px)');
info('run into at 180 px/s: ' + U.barge.map(r => `${r.x} v ${r.y}: knocked ${Math.round(r.knock)} px/s${r.down ? ', down' : ''}, the runner keeps ${Math.round(100 * r.keeps)}%`).join('; '));
ok(U.barge[0].knock === 0 && !U.barge[0].down, 'level men: no knock');
ok(U.barge[1].knock > 40 && U.barge[1].knock < 100 && !U.barge[1].down, '7 against 5: knocked off his line (' + Math.round(U.barge[1].knock) + ' px/s), on his feet');
ok(U.barge[2].knock >= 250 && U.barge[2].down && U.barge[2].keeps > 0.85, '9 against 3: knocked flying and down, the strong man barely checked (' + Math.round(100 * U.barge[2].keeps) + '% of his pace kept)');
const C = (x, y, ang) => U.cush.find(r => r.x === x && r.y === y && r.ang === ang);
info('the cushion (bodies touch at 26 px): ' + U.cush.map(r => `${r.x} v ${r.y} at ${r.ang}°: held at ${f1(r.d)} (${f1(r.cu)})`).join('; '));
ok(C(9, 3, 180).d > 48 && C(9, 3, 180).d < 53, '9 against 3: one of theirs behind him is held off about 1 m past his body (' + f1(C(9, 3, 180).d) + ' px)');
ok(Math.abs(C(9, 3, 90).d - C(9, 3, 180).d) < 1, '...as far square on');
ok(C(9, 3, 30).cu === 0 && C(9, 3, 30).d < 28, '...and not at all in front of him');
ok(C(5.5, 5.5, 180).cu > 4 && C(5.5, 5.5, 180).cu < 7, 'level men: a thin one (' + f1(C(5.5, 5.5, 180).cu) + ' px)');
ok(C(3, 9, 180).cu < 2, 'a weak man on the ball against a strong one: next to none (' + f1(C(3, 9, 180).cu) + ' px)');
info('leaning on it, worn after 1 s and 2 s: ' + U.wear.map(r => `${r.y} on ${r.x}: ${r.lean.map(v => Math.round(100 * v) + '%').join(', ')}`).join('; '));
ok(U.wear[0].lean[1] < 0.2, 'a 3 leaning on a 9 has hardly dented it after 2 s');
ok(U.wear[1].lean[1] === 1, 'a level man is through it inside 2 s');
ok(U.wear[2].lean[0] === 1, 'a 7 leaning on a 5 is through it inside 1 s');
ok(U.sprint.flat < U.sprint.walk * 0.7 && U.sprint.flat > U.sprint.walk * 0.6, 'flat out it\'s a third smaller (' + f1(U.sprint.walk) + ' -> ' + f1(U.sprint.flat) + ' px)');

// THROUGH THE CUSHION: one of theirs right up against his back who's worn it through muscles him off it, if he's the
// stronger (1.6% a frame at 9 against 4) -- not before he's through it, and never a level or weaker man
const M = await page.evaluate(() => {
  const T = window.__T; T.pause(true); T.freeze();
  const ps = T.players(), bl = T.ball(), a = ps.find(q => q.team === 'G'), c = ps.find(q => q.team === 'R'), keepA = a.stats, keepC = c.stats, out = [];
  for(const [x, y, lean] of [[4, 9, 1], [4, 9, 0.5], [7, 7, 1], [9, 4, 1]]){
    ps.forEach((q, i) => { q.x = 60 + i * 70; q.y = 40; q.vx = q.vy = 0; q.state = 'normal'; });
    a.stats = Object.assign({}, keepA, { strength: x }); c.stats = Object.assign({}, keepC, { strength: y });
    a.x = 1000; a.y = 700; a.facing = { x: 1, y: 0 }; c.x = 974; c.y = 700; c.noTouchT = 0; c.tackleCd = 0; c.leanOn = a; c.lean = lean;
    bl.ownedBy = a; bl.dribbler = null; bl.x = 1025; bl.y = 700; bl.z = 0; bl.vx = bl.vy = 0;
    const R = Math.random; Math.random = () => 0.01; try { T.contactTackles(); } finally { Math.random = R; }
    out.push({ x, y, lean, off: bl.ownedBy !== a }); a.state = 'normal'; a.noTouchT = 0; }
  a.stats = keepA; c.stats = keepC; bl.ownedBy = null; T.pause(false); return out; });
info('up against his back: ' + M.map(r => `${r.y} on ${r.x}${r.lean < 1 ? ' (half through it)' : ''}: ${r.off ? 'off it' : 'kept it'}`).join('; '));
ok(M[0].off, 'a 9 who\'s through a 4\'s cushion muscles him off it');
ok(!M[1].off, '...not while he\'s only half through it');
ok(!M[2].off && !M[3].off, '...and a level or weaker man never does');

// FROM BEHIND, IN PLAY: you run upfield with it (no sprint) and one of theirs, pressing, starts 2 m behind you --
// straight behind or off your shoulder -- and goes after it for 4 s. Your man and theirs: 8 against 4, and 4 against 8.
// Then the same with you standing still: whoever takes it has come round in front of you.
const scene = (cs, os, ang, i, run) => page.evaluate(({ cs, os, ang, i, run }) => new Promise(res => {
  const T = window.__T, c = T.controlled(), atk = T.atkOf(c.team); T.freeze(); T.TAC.R.def = 'press'; window.__TK = [];
  const o = T.players().filter(q => q.team !== c.team && q.role !== 'G')[1], keepC = c.stats, keepO = o.stats;
  c.stats = Object.assign({}, keepC, { strength: cs, speed: 6, acceleration: 6, dribbling: 5, ballControl: 6, agility: 6 });
  o.stats = Object.assign({}, keepO, { strength: os, speed: 7, acceleration: 7, tackle: 6, defIQ: 6, agility: 6 });
  for(const p of [c, o]){ p.state = 'normal'; p.noTouchT = 0; p.tackleCd = 0; p.stamina = 1; p.staminaCap = 1; p.sprintMoT = 0; p.sprint = false; p.lean = 0; }
  c.x = T.FW * 0.3; c.y = T.YC + (i % 3 - 1) * 120; c.vx = run ? atk * 140 : 0; c.vy = 0; c.facing = { x: atk, y: 0 }; c.carryAngle = atk > 0 ? 0 : Math.PI;
  const r = (180 - ang) / 57.3, side = i % 2 ? 1 : -1;
  o.x = c.x + atk * Math.cos(r) * 50; o.y = c.y + side * Math.sin(r) * 50; o.vx = c.vx; o.vy = 0; o.facing = { x: atk, y: 0 };
  const bl = T.ball(); bl.ownedBy = c; bl.dribbler = null; bl.x = c.x + atk * 25; bl.y = c.y; bl.z = 0; bl.vx = c.vx; bl.vy = 0; bl.vz = 0; bl.lastTouch = c.team;
  T.stick(run ? atk : 0, 0); const t0 = T.simNow();
  (function tick(){
    for(const q of T.players()) if(q !== c && q !== o){ q.x = atk > 0 ? 60 : T.FW - 60; q.y = q.team === c.team ? 70 : T.FH - 70; q.vx = q.vy = 0; }
    for(const k of T.keepers()) k.y = T.FH - 30;
    const won = bl.lastTouch === o.team || bl.ownedBy === o;
    if(won || T.simNow() - t0 > 4){ T.stick(0, 0); c.stats = keepC; o.stats = keepO; return res({ won, t: T.simNow() - t0, ang: window.__TK[0] }); }
    requestAnimationFrame(tick); })(); }), { cs, os, ang, i, run });
const runs = {};
for(const [cs, os] of [[8, 4], [4, 8]]){ const R = [];
  for(const ang of [0, 45]) for(let i = 0; i < 8; i++) R.push(await scene(cs, os, ang, i, true));
  runs[cs + 'v' + os] = R.filter(r => r.won).length; }
info(`running with it, one of theirs from behind: robbed ${runs['8v4']} of 16 at 8 against 4, ${runs['4v8']} of 16 at 4 against 8`);
ok(runs['8v4'] <= 2, 'a strong man running with it isn\'t robbed from behind by a weak one (' + runs['8v4'] + ' of 16)');
ok(runs['4v8'] >= 13, '...a weak one is, by a strong one (' + runs['4v8'] + ' of 16)');
const stand = [];
for(let i = 0; i < 8; i++) stand.push(await scene(8, 4, i % 2 ? 0 : 45, i, false));
const tk = stand.filter(r => r.won && isFinite(r.ang)).map(r => Math.round(r.ang));
info('standing, 8 against 4: taken ' + stand.filter(r => r.won).length + ' of 8, each from ' + tk.join(', ') + '° round from where he faced');
ok(tk.length >= 4 && tk.every(a => a <= 62), 'a strong man standing with it is only robbed by a man who\'s come round in front of him');

// HOLD-UP PLAY: the computer's centre-forward is keener to hold it up the stronger he is (1.6 times at 9, as keen as
// ever at 5.5), and with his back to goal and one of ours on his back he keeps it -- laid off, played or still his
// after 5 s -- at 9 against 4; at 4 against 9 he loses it more
const keen = await page.evaluate(() => { const T = window.__T, R = T.players().filter(q => q.team === 'R'), out = {};
  const st = R.find(q => q.slotAtk && q.slotAtk.pos === 'ST') || R.find(q => q.role === 'ATT'), keep = st.stats, slot = st.slotAtk;
  st.slotAtk = Object.assign({}, slot, { pos: 'ST' });   // (the centre-forward, whatever the shape)
  for(const s of [5.5, 9]){ st.stats = Object.assign({}, keep, { strength: s }); out[s] = T.obMods(st).hold; }
  st.stats = keep; st.slotAtk = slot; return out; });
info('keenness to hold it up (his position and style aside): ' + JSON.stringify(keen));
ok(Math.abs(keen[9] / keen[5.5] - 1.6) < 0.01, 'a centre-forward of Strength 9 is 1.6 times as keen to hold it up as one of 5.5');

process.exitCode = rep.finish();
await browser.close();
