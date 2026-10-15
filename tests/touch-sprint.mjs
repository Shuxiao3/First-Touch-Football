// Sprinting on a phone. Push the move stick out past its ring and you sprint (the ring lights up); ease back
// inside it and the sprint stops, all without lifting your thumb. Push on out and the stick's base follows your
// thumb, so you can't run off its edge. Run with the ball in the Pass Lab (nobody near, nobody pressing),
// away from the receiver, and time the ball over a stretch of each.
import { open } from './_harness.mjs';

const { browser, page, rep } = await open();
const ok = rep.ok, info = rep.info;

const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
const ph = await ctx.newPage();
ph.on('pageerror', e => rep.errs.push('PAGEERROR (phone): ' + e.message));
await ph.goto(page.url()); await ph.waitForTimeout(700);
await ph.tap('#smItems [data-act="passlab"]'); await ph.waitForTimeout(400);
await ph.waitForFunction(() => document.getElementById('rState').textContent.trim() === 'dribbling', null, { timeout: 10000, polling: 50 });

const cdp = await ctx.newCDPSession(ph);
const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 4 }] });
const pad = () => ph.evaluate(() => { const p = document.getElementById('pad'), r = p.getBoundingClientRect();
  return { shown: p.style.display === 'block', sprint: p.classList.contains('sprint'), cx: Math.round(r.left + r.width / 2) }; });
// the ball's mean speed over `ms` while you run with it (it's knocked on and gathered, so it keeps your pace)
const pace = ms => ph.evaluate(ms => new Promise(res => { let n = 0, sum = 0; const t0 = performance.now();
  (function tick(){ sum += +document.getElementById('rBallSpd').textContent || 0; n++;
    if(performance.now() - t0 >= ms) return res(Math.round(sum / n)); requestAnimationFrame(tick); })(); }), ms);
// slide the thumb to x (y fixed), in small steps the way a thumb moves
let tx = 0;
const slideTo = async x => { const n = Math.max(1, Math.round(Math.abs(x - tx) / 8));
  for(let i = 1; i <= n; i++){ await touch('touchMove', tx + (x - tx) * i / n, Y); await ph.waitForTimeout(16); } tx = x; };

const X = 380, Y = 250;                     // a thumb on the left half; we run left, away from the receiver
const under = await ph.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return e ? (e.id || e.tagName) : null; }, [X, Y]);
info('thumb lands on: ' + under);
await touch('touchStart', X, Y); tx = X;
await slideTo(X - 34);                      // inside the ring: jog
let s = await pad();
ok(s.shown && !s.sprint, 'the stick shows, and inside its ring it is not sprinting');
await ph.waitForTimeout(450);
const jog = await pace(650);

await slideTo(X - 70);                      // out past the ring: sprint
s = await pad();
ok(s.sprint, 'pushed out past the ring, the stick lights up for a sprint');
await ph.waitForTimeout(350);
const run = await pace(650);
info(`ball pace: jogging ${jog}, sprinting ${run}`);
ok(run >= jog * 1.15, `...and he sprints with it: ${jog} -> ${run}`);

await slideTo(X - 52);                      // eased back a touch, still past the inner edge
ok((await pad()).sprint, 'easing back a little keeps the sprint (it does not flicker on the edge)');
await slideTo(X - 30);                      // back inside: the sprint stops
s = await pad();
ok(!s.sprint, 'back inside the ring, the sprint stops');
await ph.waitForTimeout(500);
const back = await pace(500);
info('ball pace after easing back in: ' + back);
ok(back < run * 0.9, `...and he slows back down: ${run} -> ${back}`);

const before = (await pad()).cx;
await slideTo(X - 34 - 160);                // a thumb that wanders far out drags the base along with it
s = await pad();
info(`stick base centre ${before} -> ${s.cx}`);
ok(s.sprint && s.cx < before - 100, 'pushed far out, the base follows the thumb and it keeps sprinting');
await touch('touchEnd');
await ph.waitForTimeout(80);
s = await pad();
ok(!s.shown && !s.sprint, 'lifting the thumb puts the stick away and ends the sprint');

await ctx.close();
await browser.close();
process.exit(rep.finish() ? 1 : 0);
