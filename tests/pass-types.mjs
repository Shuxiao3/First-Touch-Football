// Pass types. A double-tap of PASS (J on a keyboard) lofts the pass; on a phone, pressing PASS and dragging
// off it plays a through ball the way you dragged. A quick single tap waits a moment (it might be the first
// half of a double-tap); a drag goes at once. Every kick-off is ours, so each check starts from one. And
// running with the ball, knocked a touch ahead every few strides, PASS stays PASS and a tap then passes.
import { open } from './_harness.mjs';

const { browser, page, rep } = await open();
const ok = rep.ok, info = rep.info;

const state = p => p.textContent('#rState').then(t => (t || '').trim());
const kickOff = p => p.waitForFunction(() => document.getElementById('rState').textContent.trim() === 'dribbling', null, { timeout: 10000, polling: 50 });
// on a phone, wait until the big button reads PASS: just after you receive it, a tap there means TRAP
const passReady = p => p.waitForFunction(() => document.getElementById('kickBtn').textContent.trim() === 'PASS', null, { timeout: 10000, polling: 50 });
// ball speed now and `ms` later: a lofted ball keeps its pace in the air, a ball on the grass slows
// (to about half in 400 ms)
const paceHold = (p, ms) => p.evaluate(ms => new Promise(res => {
  const spd = () => +document.getElementById('rBallSpd').textContent || 0;
  const t0 = performance.now(); let a = null;
  (function tick(){
    const loose = document.getElementById('rState').textContent.trim() === 'loose';
    if(a === null && loose && spd() > 100) a = { s: spd(), t: performance.now() };
    if(a && performance.now() - a.t >= ms) return res({ first: a.s, later: spd() });
    if(performance.now() - t0 > 3000) return res(null);
    requestAnimationFrame(tick);
  })();
}), ms);

// ---- keyboard: double-tap J, aiming back at our own half ----
await page.click('#smItems [data-act="exhibition"]');
await kickOff(page);
await page.keyboard.down('a');
await page.waitForTimeout(120);
const held = paceHold(page, 400);
await page.keyboard.down('j'); await page.waitForTimeout(40); await page.keyboard.up('j');
await page.waitForTimeout(60);
await page.keyboard.down('j'); await page.waitForTimeout(40); await page.keyboard.up('j');
await page.keyboard.up('a');
let h = await held;
info('double-tap J -> ' + JSON.stringify(h));
ok(h && h.later >= h.first * 0.8, 'double-tap J lofts the pass: it keeps its pace in the air');

// ---- phone ----
const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
async function phonePage(){
  const ph = await ctx.newPage();
  ph.on('pageerror', e => rep.errs.push('PAGEERROR (phone): ' + e.message));
  await ph.goto(page.url()); await ph.waitForTimeout(700);
  await ph.tap('#smItems [data-act="exhibition"]');
  await kickOff(ph); await passReady(ph);
  const cdp = await ctx.newCDPSession(ph);
  const k = await ph.evaluate(() => { const r = document.getElementById('kickBtn').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 6 }] });
  return { ph, k, touch };
}

{ // a quick tap waits for a possible second tap, then passes
  const { ph, k, touch } = await phonePage();
  await touch('touchStart', k.x, k.y); await ph.waitForTimeout(50); await touch('touchEnd');
  await ph.waitForTimeout(40);
  ok((await state(ph)) === 'dribbling', 'phone: a quick tap of PASS waits a moment (it might be a double-tap)');
  await ph.waitForFunction(() => document.getElementById('rState').textContent.trim() !== 'dribbling', null, { timeout: 1500, polling: 20 })
    .then(() => ok(true, 'phone: ...and then the pass goes'), () => ok(false, 'phone: ...and then the pass goes'));
  await ph.close();
}
{ // double-tap: LOB on the second press, and the ball goes up
  const { ph, k, touch } = await phonePage();
  await touch('touchStart', k.x, k.y); await ph.waitForTimeout(50); await touch('touchEnd');
  await ph.waitForTimeout(60);
  await touch('touchStart', k.x, k.y); await ph.waitForTimeout(80);
  const label = (await ph.textContent('#kickBtn')).trim();
  ok(label === 'LOB', 'phone: the second tap of a double-tap reads LOB: ' + label);
  const lob = paceHold(ph, 400);
  await touch('touchEnd');
  h = await lob;
  info('double-tap PASS -> ' + JSON.stringify(h));
  ok(h && h.later >= h.first * 0.8, 'phone: double-tapped, the pass goes up in the air');
  await ph.close();
}
{ // press and drag: THRU while dragging, and it goes the moment you let go
  const { ph, k, touch } = await phonePage();
  await touch('touchStart', k.x, k.y);
  for(let i = 1; i <= 6; i++){ await ph.waitForTimeout(16); await touch('touchMove', k.x - 3 * i, k.y - 8 * i); }
  const label = (await ph.textContent('#kickBtn')).trim();
  ok(label === 'THRU', 'phone: dragging off PASS reads THRU: ' + label);
  await touch('touchEnd');
  await ph.waitForTimeout(40);
  const st = await state(ph);
  ok(st !== 'dribbling', 'phone: a dragged through ball goes at once (no double-tap wait): ' + st);
  await ph.close();
}
{ // running with it: every stride or two the ball is knocked a touch ahead and gathered again, and it's
  // yours all along. The button stays PASS the whole way (TRAP is only for just after a ball reaches you),
  // and a tap mid-run passes. In the Pass Lab, so nobody else is near: run at him, a very long pass away.
  const ph = await ctx.newPage();
  ph.on('pageerror', e => rep.errs.push('PAGEERROR (phone): ' + e.message));
  await ph.goto(page.url()); await ph.waitForTimeout(700);
  await ph.tap('#smItems [data-act="passlab"]'); await ph.waitForTimeout(400);
  await ph.tap('#labBar [data-lab="pdist"]'); await ph.tap('#labBar [data-lab="pdist"]');
  await kickOff(ph); await passReady(ph);
  const cdp = await ctx.newCDPSession(ph);
  const k = await ph.evaluate(() => { const r = document.getElementById('kickBtn').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 7 }] });
  await ph.keyboard.down('d');
  const seen = await ph.evaluate(ms => new Promise(res => {
    const n = { frames: 0, pass: 0, trap: 0 }, t0 = performance.now();
    (function tick(){
      const b = document.getElementById('kickBtn').textContent.trim();
      n.frames++; if(b === 'PASS') n.pass++; if(b === 'TRAP') n.trap++;
      if(performance.now() - t0 > ms) return res(n);
      requestAnimationFrame(tick);
    })();
  }), 1200);
  info('running with it for 1.2 s -> ' + JSON.stringify(seen));
  ok(seen.trap === 0 && seen.pass === seen.frames, 'phone: running with the ball, the button reads PASS throughout, never TRAP');
  await touch('touchStart', k.x, k.y); await ph.waitForTimeout(50); await touch('touchEnd');
  await ph.waitForTimeout(250);
  await ph.keyboard.up('d');
  const got = await ph.waitForFunction(() => /^1 pass/.test(document.getElementById('labTally').textContent || ''), null, { timeout: 8000, polling: 100 }).then(() => true, () => false);
  const r = (await ph.textContent('#labResult')).trim();
  info('tapped PASS mid-run -> ' + r);
  ok(got && /\bPASS\b/.test(r) && !/KICK/.test(r), 'phone: a tap of PASS mid-run passes it to him');
  await ph.close();
}
await ctx.close();

await browser.close();
process.exit(rep.finish() ? 1 : 0);
