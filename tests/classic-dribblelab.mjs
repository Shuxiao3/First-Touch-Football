// FOOTBALL CLASSIC, THE DRIBBLE LAB'S CONTROLS (v92) AND THE TOUCH LENGTHS (v94, v95): a DRIBBLING chip sets your man's
// Dribbling (1, 3, 5.5, 8, 10; V); how far a touch goes on ahead of him is his Dribbling's, whatever his pace -- 1 m
// running and 2 m at a sprint at Dribbling 1, down to 0.3 m and 1 m at 10 (v95); RUN TOUCH and SPRINT TOUCH take
// those from half as far to twice as far (shown in metres for him; [ ] and , . on a keyboard), kept in this browser
// and played everywhere; and the box with how the run went is off to the top left, under the chips: the result and the
// tally, nothing more.
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
patch('  const LAB_TITLE=', '  window.__T={controlled:()=>controlled, ball:()=>ball, LAB, PREFS, MK, simNow:()=>simNow, statOf, dlTouchM, dlDef, atkOf, runSpeedOf, sprintSpeedOf, dribSpeedPenOf, dribTouchBase, legsOf};\n  const LAB_TITLE=');
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
const chips = async () => ({ run: await chip('drun'), sprint: await chip('dsprint') });
const state = () => page.evaluate(() => { const T = window.__T, c = T.controlled();
  return { drib: T.statOf(c, 'dribbling', -1), run: T.dlTouchM(c, false), sprint: T.dlTouchM(c, true), touchRun: T.PREFS.touchRun, touchSprint: T.PREFS.touchSprint, rep: T.LAB.rep && T.LAB.rep.t0 }; });
const settle = () => page.waitForTimeout(150);
const near = (a, b, e = 0.005) => Math.abs(a - b) < e;

// 1. THE CHIPS: there, and what they say is what he plays at (Dribbling 5.5: 0.65 m running, 1.5 m at a sprint)
const c0 = { drib: await chip('ddrib'), ...await chips() }, s0 = await state();
info('the chips: ' + JSON.stringify(c0) + '; his: Dribbling ' + s0.drib + ', touches ' + s0.run.toFixed(2) + ' m running, ' + s0.sprint.toFixed(2) + ' m sprinting');
ok(c0.drib === '5.5' && s0.drib === 5.5 && c0.run === m1(s0.run) && c0.sprint === m1(s0.sprint) && near(s0.run, 0.65) && near(s0.sprint, 1.5) && s0.touchRun === 1 && s0.touchSprint === 1,
  'the Dribble Lab has a DRIBBLING chip (' + c0.drib + ': his Dribbling), a RUN TOUCH (' + c0.run + ') and a SPRINT TOUCH (' + c0.sprint + ') -- how far his touches go on, for him');

// 2. DRIBBLING: a tap takes it on (5.5 -> 8), and V round the rest -- and the touch lengths are Dribbling's: 0.3 m running
//    and 1 m at a sprint at 10, 1 m and 2 m at 1
await page.click('#labHud [data-lab="ddrib"]'); await settle();
const s8 = await state(), seen = [s8.drib], at = {};
for(let i = 0; i < 4; i++){ await page.keyboard.press('KeyV'); await page.waitForTimeout(80); const s = await state(); seen.push(s.drib); at[s.drib] = { ...s, chips: await chips() }; }
info('Dribbling, tapped then V four times: ' + seen.join(' → ') + '; at 10: ' + JSON.stringify(at[10].chips) + ', at 1: ' + JSON.stringify(at[1].chips));
ok(s8.drib === 8 && seen.join(',') === '8,10,1,3,5.5', 'a tap on DRIBBLING sets his Dribbling (5.5 → 8), V takes it round (' + seen.join(' → ') + ')');
ok(near(at[10].run, 0.3) && near(at[10].sprint, 1) && near(at[1].run, 1) && near(at[1].sprint, 2) && at[10].chips.run === '0.3 M' && at[10].chips.sprint === '1.0 M' && at[1].chips.run === '1.0 M' && at[1].chips.sprint === '2.0 M'
  && s8.run < s0.run && s8.run > at[10].run,
  'his touches are his Dribbling\'s: at 10, ' + at[10].chips.run + ' running and ' + at[10].chips.sprint + ' at a sprint; at 1, ' + at[1].chips.run + ' and ' + at[1].chips.sprint + ' (at 8, ' + s8.run.toFixed(2) + ' m running)');

// 2b. ...whatever his pace: the same for a man of Speed 1 and of Speed 10; part way from a run to a sprint, part way
//     between; slower than a run, shorter
const pace = await page.evaluate(() => { const T = window.__T, c = T.controlled(), keep = c.stats.speed, out = {};
  for(const sp of [1, 10]){ c.stats.speed = sp; const run = T.runSpeedOf(c), spr = T.sprintSpeedOf(c);
    out[sp] = { run: T.dlTouchM(c, false), sprint: T.dlTouchM(c, true), mid: T.dribTouchBase(c, (run + spr) / 2) / T.MK, half: T.dribTouchBase(c, run / 2) / T.MK, crawl: T.dribTouchBase(c, run / 10) / T.MK }; }
  c.stats.speed = keep; return out; });
info('at Dribbling 5.5, Speed 1: ' + JSON.stringify(pace[1]) + '; Speed 10: ' + JSON.stringify(pace[10]));
ok(near(pace[1].run, pace[10].run, 1e-9) && near(pace[1].sprint, pace[10].sprint, 1e-9) && near(pace[1].mid, (pace[1].run + pace[1].sprint) / 2) && near(pace[10].half, pace[10].run / 2) && near(pace[10].crawl, pace[10].run * 0.45),
  'whatever his pace: a man of Speed 1 and one of 10 both knock it ' + pace[1].run.toFixed(2) + ' m on running and ' + pace[1].sprint.toFixed(2) + ' m sprinting; half-way to a sprint, half-way between (' + pace[1].mid.toFixed(2) + ' m); at half his running pace, half as far, and never under 0.45 of it');

// 3. RUN TOUCH and SPRINT TOUCH: a tap a step longer (x1.25), the keys a step either way (no further than the ends);
//    neither serves him a new ball
const repBefore = (await state()).rep;
await page.click('#labHud [data-lab="drun"]'); await settle(); const r1 = await state(), r1c = await chip('drun');
await page.keyboard.press('BracketRight'); await settle(); const r2 = await state();
for(let i = 0; i < 8; i++) await page.keyboard.press('BracketLeft'); await settle(); const r3 = await state(), r3c = await chip('drun');
await page.click('#labHud [data-lab="dsprint"]'); await settle(); const p1 = await state(), p1c = await chip('dsprint');
info('RUN TOUCH: ' + [r1, r2, r3].map(s => '×' + s.touchRun + ' ' + s.run.toFixed(2) + ' m').join(', ') + ' (chips ' + r1c + ', ' + r3c + '); SPRINT TOUCH tapped: ×' + p1.touchSprint + ' ' + p1.sprint.toFixed(2) + ' m (chip ' + p1c + ')');
ok(r1.touchRun === 1.25 && near(r1.run / s0.run, 1.25, 0.01) && r1c === m1(r1.run) && r2.touchRun === 1.5 && r3.touchRun === 0.5 && near(r3.run / s0.run, 0.5, 0.01) && r3c === m1(r3.run)
  && p1.touchSprint === 1.25 && near(p1.sprint / s0.sprint, 1.25, 0.01) && p1c === m1(p1.sprint) && near(p1.run, r3.run, 1e-9) && p1.rep === repBefore,
  'RUN TOUCH: a tap a step longer (' + s0.run.toFixed(2) + ' → ' + r1.run.toFixed(2) + ' m), ] another, [ back down to half (' + r3.run.toFixed(2) + ' m); SPRINT TOUCH a step longer at a sprint (' + s0.sprint.toFixed(2) + ' → ' + p1.sprint.toFixed(2) + ' m), his running touch as it was; no new ball for any of it');

// 4. IT'S WHAT HE PLAYS: in the clear (nobody near him), his touches once he's up to speed -- running at Dribbling 10 at
//    RUN TOUCH x1 and x2, and flat out at Dribbling 10 and 1 -- about what the chips say
const inPlay = (o) => page.evaluate(o => new Promise(res => { const T = window.__T, keep = [T.PREFS.touchRun, T.PREFS.touchSprint];
  T.PREFS.touchRun = o.run; T.PREFS.touchSprint = o.sprint; T.LAB.dDrib = o.drib; T.LAB.dDef = 'stand';
  document.querySelector('#labHud [data-lab="go"]').click();
  const me = T.controlled(), b = T.ball(), D = T.dlDef(), atk = T.atkOf(me.team), chipM = T.dlTouchM(me, !!o.flat), pen = T.dribSpeedPenOf(me);
  D.x = me.x + atk * 1300;                                   // (the defender stood right away)
  const t0 = T.simNow(), out = []; let last = me.touchAt;
  window.__stick = { x: atk, y: 0 };
  (function tick(){ if(o.flat) me.sprint = true;
    if(me.touchAt !== last && me.touchAt != null){ last = me.touchAt; const top = (o.flat ? T.sprintSpeedOf(me) : T.runSpeedOf(me)) * T.legsOf(me);
      out.push({ t: +(T.simNow() - t0).toFixed(2), m: +((me.touchLead - me.r - b.r) / T.MK).toFixed(2), v: +(Math.hypot(me.vx, me.vy) / (1 - pen) / top).toFixed(2) }); }   // (v: the pace he'll be going, of his top pace as he is now)
    if(T.simNow() - t0 < o.secs) return requestAnimationFrame(tick);
    window.__stick = null; me.sprint = false; T.PREFS.touchRun = keep[0]; T.PREFS.touchSprint = keep[1];
    res({ out, chipM, lost: !(b.ownedBy === me || b.dribbler === me) }); })(); }), o);
const steady = a => a.out.filter(x => x.t > 1.2 && x.v > 0.9).map(x => x.m), avg = a => a.reduce((x, y) => x + y, 0) / (a.length || 1);
const a1 = await inPlay({ drib: 10, run: 1, sprint: 1, secs: 4 }), a2 = await inPlay({ drib: 10, run: 2, sprint: 1, secs: 4 });
const g1 = steady(a1), g2 = steady(a2), k1 = avg(g1), k2 = avg(g2);
info('his touches running (m clear of him; t s, pace/running pace): at RUN TOUCH ×1 ' + JSON.stringify(a1.out) + ' (the chip: ' + a1.chipM.toFixed(2) + ' m)');
info('                                                  at ×2 ' + JSON.stringify(a2.out) + ' (the chip: ' + a2.chipM.toFixed(2) + ' m)');
ok(g1.length >= 3 && g2.length >= 3 && k2 / k1 > 1.6 && k2 / k1 < 2.3 && Math.abs(k1 / a1.chipM - 1) < 0.15 && near(a2.chipM / a1.chipM, 2, 0.01) && !a1.lost && !a2.lost,
  'it\'s what he plays: up to speed, running at Dribbling 10, his touches go ' + k1.toFixed(2) + ' m on at RUN TOUCH ×1 (the chip says ' + m1(a1.chipM) + ') and ' + k2.toFixed(2) + ' m at ×2 -- ' + (k2 / k1).toFixed(2) + ' times as far, and still his');
const f10 = await inPlay({ drib: 10, run: 1, sprint: 1, secs: 5, flat: true }), f1 = await inPlay({ drib: 1, run: 1, sprint: 1, secs: 5, flat: true });
const h10 = steady(f10), h1 = steady(f1), j10 = avg(h10), j1 = avg(h1);
info('his touches flat out (m clear of him; t s, pace/sprinting pace): at Dribbling 10 ' + JSON.stringify(f10.out) + ' (the chip: ' + f10.chipM.toFixed(2) + ' m)');
info('                                                     at Dribbling 1 ' + JSON.stringify(f1.out) + ' (the chip: ' + f1.chipM.toFixed(2) + ' m)');
ok(h10.length >= 2 && h1.length >= 2 && near(f10.chipM, 1) && near(f1.chipM, 2) && Math.abs(j10 / f10.chipM - 1) < 0.15 && Math.abs(j1 / f1.chipM - 1) < 0.35 && j1 > j10 * 1.4 && !f10.lost && !f1.lost,
  '...and flat out, ' + j10.toFixed(2) + ' m on at Dribbling 10 (' + m1(f10.chipM) + ') and ' + j1.toFixed(2) + ' m at 1 (' + m1(f1.chipM) + ', a poor dribbler\'s touches the more uneven), still his');

// 5. KEPT: , and . step SPRINT TOUCH too; a reload, and both are as you left them -- but settings from before v95 (v92's
//    and v94's), set on other touch lengths, go: back to x1
await page.keyboard.press('Period'); await settle(); await page.keyboard.press('Period'); await settle(); await page.keyboard.press('Comma'); await settle();
const before = await state();
await page.reload(); await page.waitForTimeout(700); await toLab(page);
const kept = await state(), keptC = await chips();
info('before the reload: ×' + before.touchRun + ' / ×' + before.touchSprint + '; after: ×' + kept.touchRun + ' / ×' + kept.touchSprint + ' ' + JSON.stringify(keptC));
ok(before.touchRun === 0.5 && before.touchSprint === 1.5 && kept.touchRun === 0.5 && kept.touchSprint === 1.5 && keptC.run === m1(kept.run) && keptC.sprint === m1(kept.sprint),
  'kept in this browser: . . , takes SPRINT TOUCH to ×1.5, and after a reload RUN TOUCH is still ×' + kept.touchRun + ' (' + keptC.run + ') and SPRINT TOUCH ×' + kept.touchSprint + ' (' + keptC.sprint + ')');
await page.evaluate(() => localStorage.setItem('ftc_prefs', JSON.stringify({ diff: 'star', dRun: 2, dSprint: 0.5, touchRun: 0.5, touchSprint: 2 })));
await page.reload(); await page.waitForTimeout(700); await toLab(page);
const mig = await page.evaluate(() => { const P = window.__T.PREFS; return { touchRun: P.touchRun, touchSprint: P.touchSprint, old: 'dRun' in P || 'dSprint' in P }; });
ok(mig.touchRun === 1 && mig.touchSprint === 1 && !mig.old, 'touch settings from before v95 (v92\'s ×2 / ×0.5, v94\'s ×0.5 / ×2, on other touch lengths) are dropped: ×' + mig.touchRun + ' / ×' + mig.touchSprint);

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
