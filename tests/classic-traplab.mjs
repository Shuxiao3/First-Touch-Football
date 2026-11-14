// FOOTBALL CLASSIC, THE TRAP LAB, BACK (v212). On the start menu again, and taking the ball as a match does: no press to
// time any more -- your first touch is your own (Ball control, Composure, the moment), and a flick on SKILL as the ball
// comes, or just as it gets to you, sends it that way. A machine serves at you (or at a computer team-mate) and the lab
// says what each touch did: its grade, which way it went against which way you flicked (as the arrows look on the
// screen), and how soon he's on it again. Played on a phone, with real flicks on SKILL, on a copy of the game whose stick
// the test can hold (to go after the ball the way you flicked it, as you would). (v214) Taken as they come, the touch is only as good as
// the man: a Ball control 5.5 man's -- the lab's own -- is PERFECT now and then, not every time; and a flicked touch is
// pushed into space, away from him till he's caught it up, not his again the moment it's in his reach. (v215) Flicked, the
// stick left alone till he's touched it, he meets it; held, the stick's yours and he goes where you push it (v212 had him
// meet it all the same: taken out). And the touch pops up off his foot, 9 to 12 px, under the 12 a ball's in the air at.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('    if(padId!==null){const l=Math.hypot(pdx,pdy);if(l>10){ix=pdx/l;iy=pdy/l;}}',
  '    if(padId!==null){const l=Math.hypot(pdx,pdy);if(l>10){ix=pdx/l;iy=pdy/l;}}\n    if(window.__stick&&(window.__stick.x||window.__stick.y)){ ix=window.__stick.x; iy=window.__stick.y; }');   // (a stick the test can hold)
patch('  const LAB_TITLE=', `  window.__T={ gap:()=>{ const r=LAB.recv==='ai'?labRecv():controlled; return r?Math.hypot(ball.x-r.x,ball.y-r.y):null; }, armed:()=>!!ftAim, owned:()=>!!ball.ownedBy,
    bc:v=>{ P.ballControl.val=v; if(controlled) controlled.stats=Object.assign({},controlled.stats||{},{ballControl:v}); },
    mine:()=>!!controlled&&ball.dribbler===controlled&&!ball.ownedBy, own:()=>!!controlled&&ball.ownedBy===controlled, z:()=>ball.z,
    held:(sx,sy,fx,fy)=>{ const c=controlled; if(!c) return null; const was=Object.assign({},ball), ra=recvAuto, fa=ftAim;   // (v215: the way he goes, a flick (fx,fy) asked for and the stick at (sx,sy), the ball on its way 40 px to one side of him, 300 px off)
      ball.ownedBy=null; ball.dribbler=null; ball.intendedRcv=null; ball.z=0; ball.vz=0; ball.x=c.x-300; ball.y=c.y-40*fy; ball.vx=450; ball.vy=0; recvAuto=null;
      ftAim={p:c,d:{x:fx,y:fy},until:simNow+1,lt:ball.lastTouch}; window.__stick=(sx||sy)?{x:sx,y:sy}:null; const r=humanIntent(); window.__stick=null;
      Object.assign(ball,was); recvAuto=ra; ftAim=fa; return r?{ix:+r.ix.toFixed(2),iy:+r.iy.toFixed(2)}:null; }, spread:v=>{ P.aiTouch.val=v; },
    toBall:()=>{ const r=controlled; if(!r) return null; const dx=ball.x-r.x, dy=ball.y-r.y, l=Math.hypot(dx,dy); return l>1?{x:dx/l,y:dy/l}:null; },
    odds:(v,n)=>{ const r=controlled, o={P:0,C:0,L:0,H:0}; if(!r) return o; const was=Object.assign({},ball), R=controlROf(r);
      ball.ownedBy=null; ball.dribbler=null; ball.intendedRcv=null; ball.passFrom=null; ball.thru=null; ball.z=0; ball.x=r.x-R; ball.y=r.y; ball.vx=v; ball.vy=0; const f=r.facing; r.facing={x:-1,y:0};
      for(let i=0;i<n;i++){ const t=touchQuality(r,false); o[t>0.8?'P':t>0.55?'C':t>0.3?'L':'H']++; }
      Object.assign(ball,was); r.facing=f; for(const k in o) o[k]=Math.round(o[k]/n*100); return o; } };\n  const LAB_TITLE=`);   // (how far the ball's from him: to flick at a set moment; v214: the lab's Ball control, the way to the ball, his touch n times over)
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-traplab-')), 'classic.html');
writeFileSync(copy, src);

const { browser, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
const mob = await browser.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });
const mp = await mob.newPage(); mp.on('pageerror', e => rep.errs.push('PAGEERROR: ' + e.message));
await mp.goto('file://' + copy); await mp.waitForTimeout(700);

// --- ON THE START MENU, AND IN -------------------------------------------------------------------------------------------
const onMenu = await mp.isVisible('#smItems [data-act="traplab"]');
await mp.tap('#smItems [data-act="traplab"]'); await mp.waitForTimeout(300);
const intro = await mp.evaluate(() => document.getElementById('labResult').innerHTML);   // (before the machine's first ball)
await mp.waitForTimeout(900);
const inLab = await mp.evaluate(() => document.getElementById('stageWrap').dataset.labkind);
const bar = await mp.evaluate(() => [...document.querySelectorAll('#labBar .labChip')].filter(e => e.offsetParent).map(e => e.textContent.replace(/\s+/g, ' ').trim()));
const meter = await mp.isVisible('#labMeter');
info('the lab: ' + inLab + ' -- "' + intro.replace(/<[^>]+>/g, '') + '" -- chips: ' + bar.join(' | '));
ok(onMenu && inLab === 'trap', 'TRAP LAB is on the start menu again, and opens the Trap Lab');
ok(/^Flick on <b>SKILL<\/b>/.test(intro) && !meter && !bar.some(t => /GUIDE/.test(t)), 'it says to flick on SKILL, as in a match -- no timing meter and no guide, as there\'s no press to time');

if(/AUTO/.test(await mp.textContent('#labAutoV'))){ await mp.tap('#labBar [data-lab="auto"]'); await mp.waitForTimeout(100); }   // (balls on cue)
const cdp = await mob.newCDPSession(mp), finger = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 5 }] });
const skillAt = await mp.$eval('#skillBtn', e => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
const flick = async (dx, dy) => { await finger('touchStart', skillAt.x, skillAt.y);
  for(let i = 1; i <= 4; i++){ await finger('touchMove', skillAt.x + dx * i / 4, skillAt.y + dy * i / 4); await mp.waitForTimeout(16); }
  await finger('touchEnd', skillAt.x + dx, skillAt.y + dy); };
const reps = () => mp.evaluate(() => { const m = document.getElementById('labTally').textContent.match(/^(\d+) ball/); return m ? +m[1] : 0; });
// a ball served; a flick on SKILL (dx, dy on the screen) begun as the ball comes within `at` px of him, the stick then held
// that way, as you'd go after it; what the lab says of it
const away = {}, hop = {};   // (v214: for each flicked ball, the furthest it got from him before he was on it again, px; v215: and how high it popped up off his foot)
const ball = async (d, at, tag) => { const n0 = await reps(); await mp.tap('#labGoChip');
  if(d){ for(let i = 0; i < 300; i++){ const g = await mp.evaluate(() => window.__T.gap()); if(g != null && g < (at ?? 300)) break; await mp.waitForTimeout(5); }   // (v213: 300 px, in good time with the machine busy -- at 160 a flick could end after he'd taken it)
    await flick(d[0], d[1]); await mp.evaluate(d => { window.__stick = null;   // (v215: the stick left alone till he's touched it -- he meets it; held, the stick's his to go where you push: see THE STICK HELD)
      // (v214: once he's touched it, after the ball, as you would)
      window.__far = 0; window.__zmax = 0; const t0 = performance.now(); (function chase(){ const T = window.__T; if(T.own() || performance.now() - t0 > 5000) return;
        if(T.mine()){ window.__far = Math.max(window.__far, T.gap() || 0); window.__zmax = Math.max(window.__zmax, T.z()); const v = T.toBall(); if(v) window.__stick = v; } requestAnimationFrame(chase); })(); }, d); }
  let txt = ''; for(let i = 0; i < 120; i++){ await mp.waitForTimeout(60); if(await reps() > n0){ txt = await mp.textContent('#labResult'); break; } }
  if(d && tag){ away[tag] = Math.round(await mp.evaluate(() => window.__far || 0)); hop[tag] = +(await mp.evaluate(() => window.__zmax || 0)).toFixed(1); }
  await mp.evaluate(() => { window.__stick = null; }); await mp.waitForTimeout(300); return txt; };

// --- YOUR TOUCH, LEFT ALONE --------------------------------------------------------------------------------------------
const plains = []; for(let i = 0; i < 8; i++) plains.push(await ball(null));
const plain = plains[0], pg = plains.map(t => (t.match(/(PERFECT|CLEAN|LOOSE|HEAVY)/) || [])[1] || '?');
info('nothing pressed: ' + plain + ' -- eight of them: ' + pg.join(' '));
ok(/(PERFECT|CLEAN|LOOSE|HEAVY)/.test(plain) && !/TOUCH/.test(plain) && /on it again/.test(plain), 'nothing pressed, he takes it his own way, as in a match: graded, and on it again (' + plain.replace(/^\S+ \S+ /, '') + ')');
ok(pg.every(g => g !== '?') && pg.filter(g => g !== 'PERFECT').length >= 2, 'taken as they come, a Ball control 5.5 man (the lab\'s own) doesn\'t kill every one dead: ' + pg.join(' ') + ' (v214: before, all but every ball PERFECT)');
const od = {}; for(const v of [1, 5.5, 10]){ await mp.evaluate(v => window.__T.bc(v), v); od[v] = await mp.evaluate(() => window.__T.odds(450, 2000)); }
await mp.evaluate(() => window.__T.bc(5.5));
info('his touch on a ball served at 450, nobody near, 2000 times (% PERFECT / CLEAN / LOOSE / HEAVY): ' + JSON.stringify(od));
ok(od[5.5].P >= 20 && od[5.5].P <= 55 && od[5.5].L + od[5.5].H >= 6 && od[10].P >= 55 && od[10].P >= od[5.5].P + 15 && od[1].P <= 20 && od[1].L + od[1].H >= 25,
  '...only as good as he is: PERFECT ' + od[1].P + '% at Ball control 1, ' + od[5.5].P + '% at 5.5, ' + od[10].P + '% at 10; LOOSE or worse ' + (od[1].L + od[1].H) + '%, ' + (od[5.5].L + od[5.5].H) + '%, ' + (od[10].L + od[10].H) + '%');

// --- A FLICK ON SKILL: four ways round --------------------------------------------------------------------------------
await mp.evaluate(() => { window.__T.bc(10); window.__T.spread(0); });   // (v214: a man who takes it clean, his likely touch -- what's read here is the flick; how far a lesser man's strays, or a worse touch of his, is his touch, above)
const want = { up: [[0, -60], '↑'], right: [[60, 0], '→'], down: [[0, 60], '↓'], left: [[-60, 0], '←'], upRight: [[45, -45], '↗'] }, got = {};
for(const k in want) got[k] = await ball(want[k][0], undefined, k);
await mp.evaluate(() => window.__T.spread(1));
for(const k in got) info('flicked ' + k + ': ' + got[k]);
const off = t => { const m = t.match(/went (\d+)° off/); return /and it went there/.test(t) ? 0 : m ? +m[1] : 99; };
ok(Object.keys(want).every(k => new RegExp('TOUCH ' + want[k][1]).test(got[k])), 'a flick on SKILL sends his first touch the way you flicked, up, right, down, left and up and across alike (the arrows as they look on the screen: ' + Object.keys(want).map(k => (got[k].match(/TOUCH (\S)/) || [])[1]).join(' ') + ')');
const again = t => { const m = t.match(/on it again in ([\d.]+) s/); return m ? +m[1] : null; };
ok(Object.keys(want).every(k => off(got[k]) <= 15 && /on it again/.test(got[k])), '...within a few degrees of it (v214: 15, as it looks on the screen -- the likely touch of a Ball control 10 man strays up to 12 on the pitch: ' + Object.keys(want).map(k => off(got[k]) + '°').join(', ') + '), and going after it you\'re on it again');
ok(Object.keys(want).every(k => hop[k] >= 7 && hop[k] < 12), 'it pops up off his foot as it goes: ' + Object.keys(want).map(k => hop[k] + ' px').join(', ') + ' high at the most, under the 12 a ball\'s in the air at, so he can take it on the hop (v215: about 2 px off a PERFECT touch before, nothing you\'d see)');
ok(Object.keys(want).every(k => away[k] >= 38 && again(got[k]) >= 0.4 && again(got[k]) <= 1.5), 'pushed into space, away from him till he\'s caught it up and taken it at his feet: ' + Object.keys(want).map(k => away[k] + ' px').join(', ') + ' from him at the most (1.7 m and more), and on it again in ' + Object.keys(want).map(k => again(got[k]) + ' s').join(', ') + ' (v214: his again as soon as it was in his reach, a fifth of a second on -- 23 to 30 px from him at the most)');

// --- FLICKED IN TIME, OR JUST AFTER: the same touch either way --------------------------------------------------------
await mp.tap('#labBar [data-lab="pace"]'); await mp.waitForTimeout(60);   // (the next pace up: still quick enough...)
let slowSet = false; for(let i = 0; i < 6 && !slowSet; i++){ if(/250/.test(await mp.textContent('#labPaceV'))) slowSet = true; else { await mp.tap('#labBar [data-lab="pace"]'); await mp.waitForTimeout(60); } }
// a slow ball, flicked in good time -- 13 m off -- and the stick then left alone (v215: as before v212 -- held, it's yours)
const inTime = { down: await ball([0, 60], 330), up: await ball([0, -60], 330), right: await ball([60, 0], 330) }, early = inTime.down;
info('slow balls flicked in good time, the stick left alone: ' + JSON.stringify(inTime));
await mp.evaluate(() => window.__T.spread(0));   // (v214: his likely touch -- a Ball control 10 man's, PERFECT: what's read is the flick that ends after he's taken it, which he has to have taken)
const lateOne = await ball([0, -60], 37);   // (begun as it gets to him: his reach, at Ball control 10 -- v214: 30, a 5.5 man's)
await mp.evaluate(() => window.__T.spread(1));
info('a slow ball, flicked at once: ' + early + ' -- one flicked as it got to him: ' + lateOne);
ok(slowSet && Object.entries({ down: '↓', up: '↑', right: '→' }).every(([k, a]) => new RegExp('TOUCH ' + a).test(inTime[k]) && !/just after he took it/.test(inTime[k]) && !/OUT OF REACH|RAN PAST/.test(inTime[k])),
  'a slow ball flicked in good time, the stick then left alone: he meets it, and his first touch itself goes that way, down, up and right');
ok(/TOUCH ↑/.test(lateOne) && /just after he took it/.test(lateOne), 'a flick begun as the ball gets to him, ending just after he\'s taken it: still his first touch, off his foot -- and the lab says so');

// --- THE STICK HELD AFTER A FLICK: YOURS (v215) -------------------------------------------------------------------------
// a flick one way across the pitch, the ball on its way to pass 40 px to the other side of him: the stick left alone, he
// goes across to meet it; held the way you flicked, he goes that way, as you push (v212 had him meet it all the same)
const alone = await mp.evaluate(() => window.__T.held(0, 0, 0, -1)), heldUp = await mp.evaluate(() => window.__T.held(0, -1, 0, -1));
info('the way he goes, a flick asked for: the stick left alone ' + JSON.stringify(alone) + ', held the way you flicked ' + JSON.stringify(heldUp));
ok(alone && heldUp && alone.ix < -0.5 && alone.iy > 0.1 && heldUp.iy < -0.99 && Math.abs(heldUp.ix) < 0.01, 'a flick asked for, the stick left alone: he goes to meet the ball, on toward it and across to its line; held the way you flicked, the stick\'s yours and he goes where you push it, away from its line (v215: v212 had him meet it all the same -- taken out)');

// --- IN THE AIR, AND THE COMPUTER'S MAN --------------------------------------------------------------------------------
while(!/CHEST/.test(await mp.textContent('#labServeV'))){ await mp.tap('#labBar [data-lab="serve"]'); await mp.waitForTimeout(60); }
const chest = await ball(null);
while(!/ROLLED/.test(await mp.textContent('#labServeV'))){ await mp.tap('#labBar [data-lab="serve"]'); await mp.waitForTimeout(60); }
await mp.tap('#labBar [data-lab="recv"]'); await mp.waitForTimeout(400);
const aiIntro = await mp.textContent('#labResult'), ai = await ball(null), aiTally = await mp.textContent('#labTally');
info('chest high: ' + chest + ' -- the computer\'s man: "' + aiIntro + '" / ' + ai + ' / ' + aiTally);
ok(/CHEST HIGH/.test(chest) && /(PERFECT|CLEAN|LOOSE|HEAVY)/.test(chest), 'a ball served chest high: taken, and graded (' + chest.replace(/^\S+ \S+ \S+ /, '') + ')');
ok(/^Watch the computer/.test(aiIntro) && /(PERFECT|CLEAN|LOOSE|HEAVY)/.test(ai) && /^1 ball/.test(aiTally), 'the computer\'s man takes it with his own first touch, on a tally of his own (' + aiTally + ')');
await mp.tap('#labBar [data-lab="recv"]'); await mp.waitForTimeout(300);
const tally = await mp.textContent('#labTally');
ok(/flicked, \d+° off on average/.test(tally), 'your tally counts the touches you flicked, and how far off they went on average (' + tally + ')');

// --- NO TRAP TO PRESS, AND OUT --------------------------------------------------------------------------------------------
const dials = await mp.evaluate(() => ['trapSweet', 'trapWin', 'trapLate', 'trapLock', 'ftTurn', 'ftWin', 'ftDrag'].filter(k => document.querySelector('[data-dial-key="' + k + '"]')));
ok(!dials.length, 'the old timed press\'s dials are gone from Settings (sweet spot, window, late tolerance, lockout, and the drag on TRAP)' + (dials.length ? ': ' + dials.join(', ') : ''));
await mp.tap('#labExitBtn'); await mp.waitForTimeout(600);
ok(await mp.isVisible('#smItems [data-act="traplab"]'), 'EXIT LAB goes back to the start menu');
await mob.close();

process.exitCode = rep.finish();
await browser.close();
