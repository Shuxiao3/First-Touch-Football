// Button layout (touch screens). SETTINGS > BUTTON LAYOUT shows the game screen with PASS, SHOOT and CROSS on it: drag
// one with a finger to move it, tap one and set its size, RESET puts the standard cluster back. DONE keeps it -- in
// matches, after a reload -- and goes back to Settings. On a desktop there's no such page (there are no buttons).
import { open, reporter, GAME } from './_harness.mjs';
import { chromium } from 'playwright';

const rep = reporter(), ok = rep.ok, info = rep.info;

// ---- a desktop: no entry ----
{ const { browser, page } = await open();
  await page.click('#smItems [data-act="settings"]'); await page.waitForTimeout(250);
  ok(!(await page.isVisible('[data-setlayout]')), 'desktop: no BUTTON LAYOUT in Settings');
  await browser.close(); }

// ---- a phone ----
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
const ph = await ctx.newPage();
ph.on('pageerror', e => rep.errs.push('PAGEERROR: ' + e.message));
await ph.goto(GAME); await ph.waitForTimeout(700);
await ph.evaluate(() => localStorage.clear()); await ph.reload(); await ph.waitForTimeout(700);
const cdp = await ctx.newCDPSession(ph);
const at = sel => ph.$eval(sel, el => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), w: Math.round(r.width) }; });
const near = (a, b, d = 3) => Math.abs(a.x - b.x) <= d && Math.abs(a.y - b.y) <= d;

await ph.tap('#smItems [data-act="settings"]'); await ph.waitForTimeout(250);
ok(await ph.isVisible('[data-setlayout]'), 'phone: Settings has BUTTON LAYOUT');
await ph.tap('[data-setlayout]'); await ph.waitForTimeout(250);
ok(await ph.isVisible('#layoutEd') && !(await ph.isVisible('#settingsOverlay.on')), 'it opens the layout page');
const stage = await at('#leStage'), real = await at('#stageWrap');
ok(Math.abs(stage.w - real.w) <= 2, 'the page shows the game screen at its own size: ' + stage.w + ' / ' + real.w + ' px');
const kick0 = await at('.leB[data-k="kick"]');
info('PASS starts at ' + kick0.x + ',' + kick0.y);

// drag PASS with a finger
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: kick0.x, y: kick0.y, id: 1 }] });
for(let i = 1; i <= 10; i++){ await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: kick0.x - 32 * i, y: kick0.y - 10 * i, id: 1 }] }); await ph.waitForTimeout(16); }
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await ph.waitForTimeout(100);
const kick1 = await at('.leB[data-k="kick"]');
ok(near(kick1, { x: kick0.x - 320, y: kick0.y - 100 }, 4) && kick1.x < real.x, 'dragging PASS moves it with the finger, over onto the left half: ' + kick1.x + ',' + kick1.y);
// SHOOT bigger
await ph.tap('.leB[data-k="shoot"]'); await ph.waitForTimeout(80);
ok((await ph.textContent('#leSel')) === 'SHOOT', 'tapping SHOOT picks it for sizing');
await ph.evaluate(() => { const s = document.getElementById('leSizeIn'); s.value = 1.5; s.dispatchEvent(new Event('input', { bubbles: true })); });
const shoot1 = await at('.leB[data-k="shoot"]');
ok(shoot1.w === 96, 'its size goes up to 150%: ' + shoot1.w + ' px');
await ph.tap('[data-le="done"]'); await ph.waitForTimeout(200);
ok(!(await ph.isVisible('#layoutEd')) && await ph.isVisible('#settingsOverlay.on'), 'DONE goes back to Settings');
const saved = JSON.parse(await ph.evaluate(() => localStorage.getItem('ft_btnlayout')) || '{}');
ok(saved.kick && saved.shoot && !saved.cross, 'it keeps the two you changed, not the one you left: ' + JSON.stringify(saved));
await ph.tap('[data-setclose]'); await ph.waitForTimeout(200);

// in a match, after a reload
await ph.reload(); await ph.waitForTimeout(700);
await ph.tap('#smItems [data-act="exhibition"]'); await ph.waitForTimeout(250); await ph.tap('#exhGo'); await ph.waitForTimeout(900);
const kickM = await at('#kickBtn'), shootM = await at('#shootBtn');
ok(near(kickM, kick1), 'in a match (after a reload) PASS is where you put it: ' + kickM.x + ',' + kickM.y);
ok(shootM.w === 96, '...and SHOOT is the size you made it: ' + shootM.w + ' px');
// it still works where it is: a tap on PASS with the ball coming is a trap, not a move of the stick
await ph.tap('#kickBtn'); await ph.waitForTimeout(100);
ok(!(await ph.isVisible('#pad')), 'a tap on the moved PASS (on the left half) is the button, not the stick');

// RESET puts the standard cluster back
await ph.tap('#menuBtn'); await ph.waitForTimeout(250); await ph.tap('#pauseMenu [data-pause="settings"]'); await ph.waitForTimeout(250);
await ph.tap('[data-setlayout]'); await ph.waitForTimeout(250);
await ph.tap('[data-le="reset"]'); await ph.waitForTimeout(100);
ok(near(await at('.leB[data-k="kick"]'), kick0), 'RESET puts PASS back');
await ph.tap('[data-le="done"]'); await ph.waitForTimeout(200);
ok((await ph.evaluate(() => localStorage.getItem('ft_btnlayout'))) === '{}', 'and keeps nothing: the standard layout');
await ph.tap('[data-setclose]'); await ph.waitForTimeout(200);
await ph.tap('#pauseMenu [data-pause="back"]'); await ph.waitForTimeout(200);
const kickR = await at('#kickBtn');
info('PASS back at ' + kickR.x + ',' + kickR.y);
ok(Math.abs(kickR.x - kick0.x) <= 3 && Math.abs(kickR.y - kick0.y) <= 3, 'in the match PASS is back in the corner');

await browser.close();
process.exit(rep.finish() ? 1 : 0);
