// Pass Lab and Shooting Lab. Open each from the start menu, check its chips, play a few balls (keyboard and
// a phone's gestures), see every one called in the result line and counted in the tally, use the TUNE
// drawer, and leave cleanly.
import { open } from './_harness.mjs';

const { browser, page, rep } = await open();
const ok = rep.ok, info = rep.info;
const text = (p, sel) => p.textContent(sel).then(t => (t || '').trim());
const count = (p, re) => p.evaluate(re => { const m = new RegExp(re).exec(document.getElementById('labTally').textContent || ''); return m ? +m[1] : 0; }, re);
// play one ball: wait until it's ours, do `act`, wait for the tally to move on, return the result line
async function play(p, kind, act){
  const re = kind === 'pass' ? '^(\\d+) pass' : '^(\\d+) shot';
  const n = await count(p, re);
  await p.waitForFunction(() => document.getElementById('rState').textContent.trim() === 'dribbling', null, { timeout: 10000, polling: 50 });
  await p.waitForTimeout(250);
  await act();
  await p.waitForFunction(([re, n]) => { const m = new RegExp(re).exec(document.getElementById('labTally').textContent || ''); return m && +m[1] > n; }, [re, n], { timeout: 15000, polling: 100 });
  return text(p, '#labResult');
}
const key = async (k, ms) => { await page.keyboard.down(k); await page.waitForTimeout(ms); await page.keyboard.up(k); };

// ================= PASS LAB =================
ok(await page.isVisible('#smItems [data-act="passlab"]'), 'start menu offers PASS LAB');
await page.click('#smItems [data-act="passlab"]');
await page.waitForTimeout(400);
ok((await text(page, '#rClock')) === 'PASS LAB', 'clock chip reads PASS LAB');
ok(await page.isVisible('#labBar [data-lab="pdist"]') && !(await page.isVisible('#labBar [data-lab="serve"]')), 'the pass chips show, the trap ones don\'t');
ok(!(await page.isVisible('#labMeter')), 'no timing meter in the Pass Lab');
ok(/J J/.test(await text(page, '#labResult')), 'the result line starts with how to pass');

let r = await play(page, 'pass', () => key('j', 50));
info('tap J → ' + r);
ok(/\bPASS\b/.test(r) && /RECEIVED|NOT RECEIVED|CUT OUT/.test(r), 'a tap of J is a pass, and it is called');
r = await play(page, 'pass', async () => { await key('j', 40); await page.waitForTimeout(60); await key('j', 40); });
info('J J → ' + r);
ok(/LOFTED PASS/.test(r), 'a double-tap of J is a lofted pass');
ok(/px high/.test(r), 'the result says how high it went');

await page.click('#labBar [data-lab="pdef"]'); await page.waitForTimeout(150);
ok((await text(page, '#labPDefV')) === 'IN THE LANE', 'DEFENDER puts one in the lane');
await page.click('#labBar [data-lab="prun"]'); await page.waitForTimeout(150);
ok((await text(page, '#labPRunV')) === 'MAKES A RUN', 'RECEIVER makes a run');
r = await play(page, 'pass', async () => { await page.waitForTimeout(800); await key('j', 50); });
info('to a runner, defender in the lane → ' + r);
ok(/running · defender in the lane/.test(r), 'the result line carries the setup');
const passTally = await text(page, '#labTally');
info('tally: ' + passTally);
ok(/^3 passes · \d received/.test(passTally) && /lofted pass \d\/1/.test(passTally), 'the tally counts the passes, by type');

await page.click('#labBar [data-lab="tune"]'); await page.waitForTimeout(150);
ok(await page.isVisible('#labTune') && (await text(page, '#labTuneTitle')) === 'TUNE PASSING', 'TUNE opens the passing dials');
ok((await page.locator('#labDials input[type=range]').count()) === 11, 'eleven passing dials');
await page.evaluate(() => { const s = document.querySelector('#labDials [data-lk="passDtap"]'); s.value = 250; s.dispatchEvent(new Event('input', { bubbles: true })); });
ok((await page.inputValue('#s_passDtap')) === '250', 'a lab dial moves the Settings slider too');
await page.click('#labTune [data-lab="defaults"]'); await page.waitForTimeout(100);
ok((await page.inputValue('#s_passDtap')) === '150', 'FACTORY DEFAULTS puts it back');
await page.click('#labTune [data-lab="tune"]');
await page.click('#labExitBtn'); await page.waitForTimeout(300);
ok(await page.isVisible('#startMenu'), 'EXIT returns to the start menu');

// ================= SHOOTING LAB =================
await page.click('#smItems [data-act="shootlab"]');
await page.waitForTimeout(400);
ok((await text(page, '#rClock')) === 'SHOOTING LAB', 'clock chip reads SHOOTING LAB');
ok(await page.isVisible('#labGoal'), 'the goal panel is up');
ok((await text(page, '#labTuneTitle')) === 'TUNE SHOOTING', 'the drawer is the shooting one now');
await page.click('#labBar [data-lab="skeep"]'); await page.waitForTimeout(150);
ok((await text(page, '#labSKeepV')) === 'OFF', 'KEEPER switches the keeper off');
await page.click('#labBar [data-lab="sdist"]'); await page.click('#labBar [data-lab="sdist"]'); await page.click('#labBar [data-lab="sdist"]');
await page.waitForTimeout(150);
ok((await text(page, '#labSDistV')) === 'PENALTY SPOT', 'FROM steps round to the penalty spot');
r = await play(page, 'shoot', () => key('k', 150));
info('K from the spot, no keeper → ' + r);
ok(/SHOT power \d+%/.test(r) && /GOAL|OFF THE POST|WIDE/.test(r), 'a K shot is called with its power');
await page.click('#labBar [data-lab="skeep"]'); await page.waitForTimeout(150);
r = await play(page, 'shoot', () => key('k', 300));
info('K with the keeper on → ' + r);
ok(/GOAL|SAVED|OFF THE POST|WIDE|OVER/.test(r), 'with the keeper on it is called too');
const shotTally = await text(page, '#labTally');
info('tally: ' + shotTally);
ok(/^2 shots · \d scored · \d saved/.test(shotTally) && /% on target/.test(shotTally), 'the tally counts shots, goals, saves, on target');
ok((await page.locator('#labGoalDots .lgDot').count()) >= 1, 'the goal panel plots where they went');
await page.click('#labExitBtn'); await page.waitForTimeout(300);

// ================= phone: the gestures inside the labs =================
{
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  const ph = await ctx.newPage();
  ph.on('pageerror', e => rep.errs.push('PAGEERROR (phone): ' + e.message));
  const cdp = await ctx.newCDPSession(ph);
  const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 8 }] });
  await ph.goto(page.url()); await ph.waitForTimeout(700);
  await ph.tap('#smItems [data-act="shootlab"]'); await ph.waitForTimeout(500);
  const box = await ph.evaluate(() => { const r = document.getElementById('c').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  const X0 = box.x + box.w * 0.6, Y0 = box.y + box.h * 0.62;
  r = await play(ph, 'shoot', async () => {
    const t0 = Date.now() / 1000;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: X0, y: Y0, id: 9 }], timestamp: t0 });
    for(let i = 1; i <= 10; i++){ await ph.waitForTimeout(14); await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: X0 + 22 * i, y: Y0 - 2 * i, id: 9 }], timestamp: t0 + 0.014 * i }); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [], timestamp: t0 + 0.145 });
  });
  info('phone swipe → ' + r);
  ok(/SWIPE power \d+%/.test(r), 'phone: a swipe in the Shooting Lab is a shot, called as a SWIPE');
  await ph.tap('#labExitBtn'); await ph.waitForTimeout(300);
  await ph.tap('#smItems [data-act="passlab"]'); await ph.waitForTimeout(500);
  await ph.tap('#labBar [data-lab="prun"]'); await ph.waitForTimeout(200);
  const k = await ph.evaluate(() => { const r = document.getElementById('kickBtn').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  r = await play(ph, 'pass', async () => {
    await ph.waitForFunction(() => document.getElementById('kickBtn').textContent.trim() === 'PASS', null, { timeout: 5000 });
    await ph.waitForTimeout(700);
    await touch('touchStart', k.x, k.y);
    for(let i = 1; i <= 6; i++){ await ph.waitForTimeout(16); await touch('touchMove', k.x - 2 * i, k.y - 7 * i); }
    await touch('touchEnd');
  });
  info('phone drag off PASS → ' + r);
  ok(/THROUGH BALL/.test(r), 'phone: dragging off PASS in the Pass Lab plays a through ball');
  await ph.tap('#labExitBtn'); await ph.waitForTimeout(300);
  ok(await ph.isVisible('#startMenu'), 'phone: EXIT LAB returns to the start menu');
  await ctx.close();
}

await browser.close();
process.exit(rep.finish() ? 1 : 0);
