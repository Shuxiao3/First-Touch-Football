// FOOTBALL CLASSIC, THE DRIBBLE LAB'S CONTROLS (v92): a DRIBBLING chip sets your man's Dribbling (1, 3, 5.5, 8, 10; V);
// RUN TOUCH and SPRINT TOUCH set how far a touch goes on ahead of him running and knocked on at a sprint (half as far to
// twice as far, shown in metres for him; [ ] and , . on a keyboard), kept in this browser and played everywhere; and the
// box with how the run went is off to the top left, under the chips: the result and the tally, nothing more.
// On a copy of the game that lets the test reach the lab's man and the settings, and hold the stick.
import { open, STAR } from './_harness.mjs';
import { createRequire } from 'module';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';
const { chromium } = createRequire(import.meta.url)('playwright');

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={controlled:()=>controlled, ball:()=>ball, LAB, PREFS, MK, simNow:()=>simNow, statOf, dlTouchM, dlDef, atkOf, runSpeedOf};\n  const LAB_TITLE=');
patch('    if(padId!==null){const l=Math.hypot(pdx,pdy);if(l>10){ix=pdx/l;iy=pdy/l;}}',
  '    if(padId!==null){const l=Math.hypot(pdx,pdy);if(l>10){ix=pdx/l;iy=pdy/l;}}\n    if(window.__stick&&(window.__stick.x||window.__stick.y)){ ix=window.__stick.x; iy=window.__stick.y; }');   // (a stick the test can hold)
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-dlab-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
const toLab = async (pg) => { await pg.evaluate(() => document.querySelector('#smItems [data-act="dribblelab"]').click()); await pg.waitForTimeout(1500); };
await toLab(page);
const m1 = v => v.toFixed(v < 10 ? 1 : 0) + ' M';          // (as the chips show it)
const chip = (k) => page.textContent('#labHud [data-lab="' + k + '"] b');
const state = () => page.evaluate(() => { const T = window.__T, c = T.controlled();
  return { drib: T.statOf(c, 'dribbling', -1), run: T.dlTouchM(c, false), sprint: T.dlTouchM(c, true), dRun: T.PREFS.dRun, dSprint: T.PREFS.dSprint, rep: T.LAB.rep && T.LAB.rep.t0 }; });
const settle = () => page.waitForTimeout(150);

// 1. THE CHIPS: there, and what they say is what he plays at
const c0 = { drib: await chip('ddrib'), run: await chip('drun'), sprint: await chip('dsprint') }, s0 = await state();
info('the chips: ' + JSON.stringify(c0) + '; his: Dribbling ' + s0.drib + ', touches ' + s0.run.toFixed(2) + ' m running, ' + s0.sprint.toFixed(2) + ' m sprinting');
ok(c0.drib === '5.5' && s0.drib === 5.5 && c0.run === m1(s0.run) && c0.sprint === m1(s0.sprint) && s0.sprint > s0.run * 2 && s0.dRun === 1 && s0.dSprint === 1,
  'the Dribble Lab has a DRIBBLING chip (' + c0.drib + ': his Dribbling), a RUN TOUCH (' + c0.run + ') and a SPRINT TOUCH (' + c0.sprint + ') -- how far his touches go on, for him');

// 2. DRIBBLING: a tap takes it on (5.5 -> 8), and V round the rest; the better he is, the shorter his touch
await page.click('#labHud [data-lab="ddrib"]'); await settle();
const s8 = await state(), seen = [s8.drib];
for(let i = 0; i < 4; i++){ await page.keyboard.press('KeyV'); await page.waitForTimeout(80); seen.push((await state()).drib); }
info('Dribbling, tapped then V four times: ' + seen.join(' → ') + '; at 8 his touches ' + s8.run.toFixed(2) + ' m running (chip ' + (await chip('drun')) + ' at 5.5 again)');
ok(s8.drib === 8 && seen.join(',') === '8,10,1,3,5.5' && s8.run < s0.run * 0.9,
  'a tap on DRIBBLING sets his Dribbling (5.5 → 8), V takes it round (' + seen.join(' → ') + '), and the better he is the shorter his touch (' + s0.run.toFixed(2) + ' → ' + s8.run.toFixed(2) + ' m running)');

// 3. RUN TOUCH and SPRINT TOUCH: a tap a step longer (x1.25), the keys a step either way (no further than the ends);
//    neither serves him a new ball
const repBefore = (await state()).rep;
await page.click('#labHud [data-lab="drun"]'); await settle(); const r1 = await state(), r1c = await chip('drun');
await page.keyboard.press('BracketRight'); await settle(); const r2 = await state();
for(let i = 0; i < 8; i++) await page.keyboard.press('BracketLeft'); await settle(); const r3 = await state(), r3c = await chip('drun');
await page.click('#labHud [data-lab="dsprint"]'); await settle(); const p1 = await state(), p1c = await chip('dsprint');
info('RUN TOUCH: ' + [r1, r2, r3].map(s => '×' + s.dRun + ' ' + s.run.toFixed(2) + ' m').join(', ') + ' (chips ' + r1c + ', ' + r3c + '); SPRINT TOUCH tapped: ×' + p1.dSprint + ' ' + p1.sprint.toFixed(2) + ' m (chip ' + p1c + ')');
ok(r1.dRun === 1.25 && Math.abs(r1.run / s0.run - 1.25) < 0.01 && r1c === m1(r1.run) && r2.dRun === 1.5 && r3.dRun === 0.5 && Math.abs(r3.run / s0.run - 0.5) < 0.01 && r3c === m1(r3.run)
  && p1.dSprint === 1.25 && p1.sprint > r3.sprint && p1c === m1(p1.sprint) && Math.abs(p1.run - r3.run) < 1e-9 && p1.rep === repBefore,
  'RUN TOUCH: a tap a step longer (' + s0.run.toFixed(2) + ' → ' + r1.run.toFixed(2) + ' m), ] another, [ back down to half (' + r3.run.toFixed(2) + ' m); SPRINT TOUCH a step longer at a sprint (' + p1.sprint.toFixed(2) + ' m), his running touch as it was; no new ball for any of it');

// 4. IT'S WHAT HE PLAYS: running in the clear (Dribbling 10, nobody near him), his touches once he's up to speed, at
//    RUN TOUCH x1 and x2 -- and at x1 about what the chip says
const runTouches = (k) => page.evaluate(k => new Promise(res => { const T = window.__T, keep = T.PREFS.dRun;
  T.PREFS.dRun = k; T.LAB.dDrib = 10; T.LAB.dDef = 'stand';
  document.querySelector('#labHud [data-lab="go"]').click();
  const me = T.controlled(), b = T.ball(), D = T.dlDef(), atk = T.atkOf(me.team), chipM = T.dlTouchM(me, false);
  D.x = me.x + atk * 1300;                                   // (the defender stood right away)
  const t0 = T.simNow(), out = []; let last = me.touchAt;
  window.__stick = { x: atk, y: 0 };
  (function tick(){
    if(me.touchAt !== last && me.touchAt != null){ last = me.touchAt;
      out.push({ t: +(T.simNow() - t0).toFixed(2), m: +((me.touchLead - me.r - b.r) / T.MK).toFixed(2), v: +(Math.hypot(me.vx, me.vy) / T.runSpeedOf(me)).toFixed(2) }); }
    if(T.simNow() - t0 < 4) return requestAnimationFrame(tick);
    window.__stick = null; T.PREFS.dRun = keep; res({ out, chipM, lost: !(b.ownedBy === me || b.dribbler === me) }); })(); }), k);
const a1 = await runTouches(1), a2 = await runTouches(2);
const steady = a => a.out.filter(x => x.t > 1 && x.v > 0.85).map(x => x.m), avg = a => a.reduce((x, y) => x + y, 0) / (a.length || 1);
const g1 = steady(a1), g2 = steady(a2), k1 = avg(g1), k2 = avg(g2);
info('his touches running (m clear of him; t s, pace/running pace): at RUN TOUCH ×1 ' + JSON.stringify(a1.out) + ' (the chip: ' + a1.chipM.toFixed(2) + ' m)');
info('                                                  at ×2 ' + JSON.stringify(a2.out) + ' (the chip: ' + a2.chipM.toFixed(2) + ' m)');
ok(g1.length >= 3 && g2.length >= 3 && k2 / k1 > 1.6 && k2 / k1 < 2.3 && Math.abs(k1 / a1.chipM - 1) < 0.35 && Math.abs(a2.chipM / a1.chipM - 2) < 0.01 && !a1.lost && !a2.lost,
  'it\'s what he plays: up to speed, his touches go ' + k1.toFixed(2) + ' m on at RUN TOUCH ×1 (the chip says ' + m1(a1.chipM) + ') and ' + k2.toFixed(2) + ' m at ×2 -- ' + (k2 / k1).toFixed(2) + ' times as far, and still his');

// 5. KEPT: , and . step SPRINT TOUCH too; a reload, and both are as you left them
await page.keyboard.press('Period'); await settle(); await page.keyboard.press('Period'); await settle(); await page.keyboard.press('Comma'); await settle();
const before = await state();
await page.reload(); await page.waitForTimeout(700); await toLab(page);
const kept = await state(), keptC = { run: await chip('drun'), sprint: await chip('dsprint') };
info('before the reload: ×' + before.dRun + ' / ×' + before.dSprint + '; after: ×' + kept.dRun + ' / ×' + kept.dSprint + ' ' + JSON.stringify(keptC));
ok(before.dRun === 0.5 && before.dSprint === 1.5 && kept.dRun === 0.5 && kept.dSprint === 1.5 && keptC.run === m1(kept.run) && keptC.sprint === m1(kept.sprint),
  'kept in this browser: . . , takes SPRINT TOUCH to ×1.5, and after a reload RUN TOUCH is still ×' + kept.dRun + ' (' + keptC.run + ') and SPRINT TOUCH ×' + kept.dSprint + ' (' + keptC.sprint + ')');

// 6. THE BOX: off to the top left, under the chips -- the result and the tally, nothing more (and on a phone)
const boxAfterRun = async (pg) => {
  const before = await pg.evaluate(() => { const el = document.getElementById('labResult'); return el.innerText.replace(/\s+/g, ' ').trim(); });
  await pg.evaluate(() => { const T = window.__T; T.LAB.dDef = 'press'; T.LAB.dDist = 125; document.querySelector('#labHud [data-lab="go"]').click(); window.__stick = { x: T.atkOf(T.controlled().team), y: 0 }; });
  await pg.waitForFunction(() => window.__T.LAB.last && window.__T.LAB.last.done, null, { timeout: 20000 }).catch(() => {});
  await pg.evaluate(() => { window.__stick = null; }); await pg.waitForTimeout(250);
  return pg.evaluate(before => { const el = document.getElementById('labResult'), r = el.getBoundingClientRect(), sr = document.getElementById('stageWrap').getBoundingClientRect();
    const chips = [...document.querySelectorAll('#labBar .labChip')].filter(c => c.getClientRects().length && getComputedStyle(c).display !== 'none').map(c => c.getBoundingClientRect());
    const pad = document.getElementById('pad'), pr = pad && pad.getClientRects().length ? pad.getBoundingClientRect() : null;
    const hit = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    return { before, text: el.innerText.replace(/\s+/g, ' ').trim(), left: Math.round(r.left - sr.left), right: Math.round(r.right - sr.left), top: Math.round(r.top), w: Math.round(sr.width),
      chipsBottom: Math.round(Math.max(...chips.map(c => c.bottom))), rows: new Set(chips.map(c => Math.round(c.top))).size, onChip: chips.some(c => hit(c, r)), onPad: !!(pr && hit(pr, r)),
      tally: getComputedStyle(document.querySelector('.labTallyRow')).display }; }, before); };
const boxOk = b => /^(BEAT HIM|TACKLED|LOST IT|TOO SLOW)\b/.test(b.text) && /\b\d+ of \d+ beaten\b/.test(b.text) && b.text.length <= 40 && b.right < b.w * 0.35 && b.top >= b.chipsBottom - 1 && !b.onChip && !b.onPad && b.tally === 'none';
const box = await boxAfterRun(page);
info('the box: before a run "' + box.before + '"; after one ' + JSON.stringify(box));
ok(boxOk(box) && /draw a move/i.test(box.before) && box.before.length <= 60,
  'the box: just how the run went and the tally ("' + box.text + '"), off to the top left under the chips (' + box.left + '-' + box.right + ' px of ' + box.w + ')');
const pb = await chromium.launch();
for(const [w, h] of [[844, 390], [667, 375]]){
  const pctx = await pb.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true }); await pctx.addInitScript(STAR);
  const ph = await pctx.newPage(); ph.on('pageerror', e => rep.errs.push('PAGEERROR (phone): ' + e.message));
  await ph.goto('file://' + copy); await ph.waitForTimeout(700); await toLab(ph);
  const pbox = await boxAfterRun(ph);
  info('on a phone, ' + w + 'x' + h + ': ' + JSON.stringify(pbox));
  ok(boxOk(pbox) && pbox.rows <= 2, 'on a phone (' + w + 'x' + h + ') too: "' + pbox.text + '" at the top left (' + pbox.left + '-' + pbox.right + ' px of ' + pbox.w + '), clear of the chips (in ' + pbox.rows + ' row' + (pbox.rows > 1 ? 's' : '') + ') and the stick');
  await pctx.close(); }
await pb.close();

process.exitCode = rep.finish();
await browser.close();
