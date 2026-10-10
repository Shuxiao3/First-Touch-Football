// CLEAR and swipe-to-shoot. In your own half the cross button clears instead of crossing (L on a
// keyboard, the CROSS button on a phone, which then reads CLEAR): with the ball it's hoofed high and long
// at once. On a phone, with the ball, a swipe on the right side shoots; a tap there doesn't.
// Every kick-off is ours and taken a step inside our own half, so each check starts from one.
import { open } from './_harness.mjs';

const { browser, page, rep } = await open();
const ok = rep.ok, info = rep.info;

const state = p => p.textContent('#rState').then(t => (t || '').trim());
const speed = p => p.textContent('#rBallSpd').then(t => +t);
const kickOff = async p => {
  await p.waitForFunction(() => document.getElementById('rState').textContent.trim() === 'dribbling', null, { timeout: 10000, polling: 50 });
};

// ---- keyboard: L at our own kick-off clears it ----
await page.click('#smItems [data-act="exhibition"]');
await kickOff(page);
await page.keyboard.press('l');
await page.waitForTimeout(120);
let st = await state(page), sp = await speed(page);
info(`L at kick-off -> ${st}, ${sp} px/s`);
ok(st !== 'dribbling' && sp > 300, 'L in your own half clears the ball at once');
await page.waitForTimeout(500);
sp = await speed(page);
ok(sp > 300, 'the clearance is still flying at full pace half a second later (it\'s up in the air): ' + sp);

// ---- phone ----
const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
const errs = rep.errs;
async function phonePage(){
  const ph = await ctx.newPage();
  ph.on('pageerror', e => errs.push('PAGEERROR (phone): ' + e.message));
  await ph.goto(page.url()); await ph.waitForTimeout(700);
  await ph.tap('#smItems [data-act="exhibition"]');
  await kickOff(ph);
  return ph;
}
async function swipe(ph, pts, ms){
  const cdp = await ctx.newCDPSession(ph), step = ms / (pts.length - 1), t0 = Date.now() / 1000;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: pts[0][0], y: pts[0][1], id: 5 }], timestamp: t0 });
  for(let i = 1; i < pts.length; i++){
    await new Promise(r => setTimeout(r, step));
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: pts[i][0], y: pts[i][1], id: 5 }], timestamp: t0 + step * i / 1000 });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [], timestamp: t0 + ms / 1000 + 0.004 });
  await cdp.detach();
}
const line = (x0, y0, x1, y1, n = 10) => Array.from({ length: n + 1 }, (_, i) => [x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n]);

{ // CROSS reads CLEAR in our half, and a tap on it clears
  const ph = await phonePage();
  ok((await ph.textContent('#crossBtn')).trim() === 'CLEAR', 'phone: in your own half the cross button reads CLEAR');
  await ph.tap('#crossBtn');
  await ph.waitForTimeout(120);
  st = await state(ph); sp = await speed(ph);
  info(`CLEAR tapped at kick-off -> ${st}, ${sp} px/s`);
  ok(st !== 'dribbling' && sp > 300, 'phone: tapping CLEAR with the ball clears it');
  await ph.close();
}
{ // a tap on the right with the ball does nothing; a swipe toward goal shoots; a swipe back doesn't
  const ph = await phonePage();
  const box = await ph.evaluate(() => { const r = document.getElementById('c').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  const X0 = box.x + box.w * 0.6, Y0 = box.y + box.h * 0.55;
  await swipe(ph, [[X0, Y0], [X0 + 2, Y0 + 1]], 60);
  await ph.waitForTimeout(150);
  ok((await state(ph)) === 'dribbling', 'phone: a tap on the right with the ball is not a shot');
  await swipe(ph, line(X0 + 160, Y0, X0 - 40, Y0), 140);
  await ph.waitForTimeout(150);
  ok((await state(ph)) === 'dribbling', 'phone: a swipe away from goal is not a shot');
  // the strike happens on release: watch the next 400 ms for the ball running loose. From halfway it's a
  // long shot, so even the softest from the weakest long-shooter leaves at ~190 px/s; a red can step in after.
  await swipe(ph, line(X0, Y0, X0 + 200, Y0 - 25), 80);
  sp = await ph.evaluate(() => new Promise(res => { let m = 0; const t0 = performance.now();
    (function tick(){ if(document.getElementById('rState').textContent.trim() === 'loose') m = Math.max(m, +document.getElementById('rBallSpd').textContent || 0);
      if(performance.now() - t0 > 400) return res(m); requestAnimationFrame(tick); })(); }));
  st = await state(ph);
  info(`swipe toward goal -> ${st}, loose at up to ${sp} px/s`);
  ok(st !== 'dribbling' && sp > 150, 'phone: a swipe toward goal with the ball shoots');
  await ph.close();
}
await ctx.close();

await browser.close();
process.exit(rep.finish() ? 1 : 0);
