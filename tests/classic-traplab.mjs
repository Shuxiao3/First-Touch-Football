// FOOTBALL CLASSIC, THE TRAP LAB, BACK (v212). On the start menu again, and taking the ball as a match does: no press to
// time any more -- your first touch is your own (Ball control, Composure, the moment), and a flick on SKILL as the ball
// comes, or just as it gets to you, sends it that way. A machine serves at you (or at a computer team-mate) and the lab
// says what each touch did: its grade, which way it went against which way you flicked (as the arrows look on the
// screen), and how soon he's on it again. Played on a phone, with real flicks on SKILL, on a copy of the game whose stick
// the test can hold (to go after the ball the way you flicked it, as you would).
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('    if(padId!==null){const l=Math.hypot(pdx,pdy);if(l>10){ix=pdx/l;iy=pdy/l;}}',
  '    if(padId!==null){const l=Math.hypot(pdx,pdy);if(l>10){ix=pdx/l;iy=pdy/l;}}\n    if(window.__stick&&(window.__stick.x||window.__stick.y)){ ix=window.__stick.x; iy=window.__stick.y; }');   // (a stick the test can hold)
patch('  const LAB_TITLE=', '  window.__T={ gap:()=>{ const r=LAB.recv===\'ai\'?labRecv():controlled; return r?Math.hypot(ball.x-r.x,ball.y-r.y):null; }, armed:()=>!!ftAim, owned:()=>!!ball.ownedBy };\n  const LAB_TITLE=');   // (how far the ball's from him: to flick at a set moment)
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
const ball = async (d, at) => { const n0 = await reps(); await mp.tap('#labGoChip');
  if(d){ for(let i = 0; i < 300; i++){ const g = await mp.evaluate(() => window.__T.gap()); if(g != null && g < (at ?? 300)) break; await mp.waitForTimeout(5); }   // (v213: 300 px, in good time with the machine busy -- at 160 a flick could end after he'd taken it)
    await flick(d[0], d[1]); await mp.evaluate(d => { const l = Math.hypot(d[0], d[1]); window.__stick = { x: d[0] / l, y: d[1] / l }; }, d); }
  let txt = ''; for(let i = 0; i < 120; i++){ await mp.waitForTimeout(60); if(await reps() > n0){ txt = await mp.textContent('#labResult'); break; } }
  await mp.evaluate(() => { window.__stick = null; }); await mp.waitForTimeout(300); return txt; };

// --- YOUR TOUCH, LEFT ALONE --------------------------------------------------------------------------------------------
const plain = await ball(null);
info('nothing pressed: ' + plain);
ok(/(PERFECT|CLEAN|LOOSE|HEAVY)/.test(plain) && !/TOUCH/.test(plain) && /on it again/.test(plain), 'nothing pressed, he takes it his own way, as in a match: graded, and on it again (' + plain.replace(/^\S+ \S+ /, '') + ')');

// --- A FLICK ON SKILL: four ways round --------------------------------------------------------------------------------
const want = { up: [[0, -60], '↑'], right: [[60, 0], '→'], down: [[0, 60], '↓'], left: [[-60, 0], '←'], upRight: [[45, -45], '↗'] }, got = {};
for(const k in want) got[k] = await ball(want[k][0]);
for(const k in got) info('flicked ' + k + ': ' + got[k]);
const off = t => { const m = t.match(/went (\d+)° off/); return /and it went there/.test(t) ? 0 : m ? +m[1] : 99; };
ok(Object.keys(want).every(k => new RegExp('TOUCH ' + want[k][1]).test(got[k])), 'a flick on SKILL sends his first touch the way you flicked, up, right, down, left and up and across alike (the arrows as they look on the screen: ' + Object.keys(want).map(k => (got[k].match(/TOUCH (\S)/) || [])[1]).join(' ') + ')');
ok(Object.keys(want).every(k => off(got[k]) <= 12 && /on it again/.test(got[k])), '...within a few degrees of it (' + Object.keys(want).map(k => off(got[k]) + '°').join(', ') + '), and going after it you\'re on it again at once');

// --- FLICKED IN TIME, OR JUST AFTER: the same touch either way --------------------------------------------------------
await mp.tap('#labBar [data-lab="pace"]'); await mp.waitForTimeout(60);   // (the next pace up: still quick enough...)
let slowSet = false; for(let i = 0; i < 6 && !slowSet; i++){ if(/250/.test(await mp.textContent('#labPaceV'))) slowSet = true; else { await mp.tap('#labBar [data-lab="pace"]'); await mp.waitForTimeout(60); } }
// a slow ball, flicked in good time -- 13 m off -- and the stick then held the way you flicked (v212: before, that took
// him off the ball's line before it got to him, and it ran past him -- wide of his reach)
const inTime = { down: await ball([0, 60], 330), up: await ball([0, -60], 330), right: await ball([60, 0], 330) }, early = inTime.down;
info('slow balls flicked in good time, the stick held that way: ' + JSON.stringify(inTime));
const lateOne = await ball([0, -60], 30);   // (begun as it gets to him)
info('a slow ball, flicked at once: ' + early + ' -- one flicked as it got to him: ' + lateOne);
ok(slowSet && Object.entries({ down: '↓', up: '↑', right: '→' }).every(([k, a]) => new RegExp('TOUCH ' + a).test(inTime[k]) && !/just after he took it/.test(inTime[k]) && !/OUT OF REACH|RAN PAST/.test(inTime[k])),
  'a slow ball flicked in good time, the stick then held the way you flicked: he still meets it, and his first touch itself goes that way, down, up and right (v212: it took him off its line, and it ran past him)');
ok(/TOUCH ↑/.test(lateOne) && /just after he took it/.test(lateOne), 'a flick begun as the ball gets to him, ending just after he\'s taken it: still his first touch, off his foot -- and the lab says so');

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
