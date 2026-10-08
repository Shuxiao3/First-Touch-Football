// Trap Lab: open it from the start menu, let a ball run past, time presses off the guide
// cursor (perfect / late / too early), glance one off-line, take one on the chest, watch the
// AI receiver, tune a dial, and leave cleanly for an exhibition.
import { open } from './_harness.mjs';

const { browser, page, rep } = await open();
const ok = rep.ok, info = rep.info;
const MIN = -0.35, MAX = 0.20;               // the meter's span (keep in step with LAB_MIN / LAB_MAX)

const text = sel => page.textContent(sel).then(t => (t || '').trim());
const visible = sel => page.isVisible(sel);
const chip = async act => { await page.click(`#labBar [data-lab="${act}"]`); await page.waitForTimeout(80); };   // labels repaint next frame

// Press SPACE the frame the guide cursor reaches `eT` seconds from the ball's arrival.
async function pressAt(eT){
  return page.evaluate(({ eT, MIN, MAX }) => new Promise(res => {
    const cur = document.getElementById('labCursor'), t0 = performance.now();
    (function tick(){
      if(performance.now() - t0 > 15000) return res(null);
      if(cur.style.display === 'block'){
        const e = MIN + parseFloat(cur.style.left) / 100 * (MAX - MIN);
        if(e >= eT){
          window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', key: ' ' }));
          setTimeout(() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', key: ' ' })), 40);
          return res(e);
        }
      }
      requestAnimationFrame(tick);
    })();
  }), { eT, MIN, MAX });
}
// Real milliseconds the guide cursor takes to sweep from -300 ms to -50 ms (0.25 s of game time).
async function sweepMs(){
  return page.evaluate(({ MIN, MAX }) => new Promise(res => {
    const cur = document.getElementById('labCursor'), t0 = performance.now(); let a = null;
    (function tick(){
      if(performance.now() - t0 > 15000) return res(null);
      if(cur.style.display === 'block'){
        const e = MIN + parseFloat(cur.style.left) / 100 * (MAX - MIN);
        if(a === null && e >= -0.30) a = performance.now();
        if(a !== null && e >= -0.05) return res(performance.now() - a);
      }
      requestAnimationFrame(tick);
    })();
  }), { MIN, MAX });
}
// How many balls the tally has counted (for the receiver on show).
const balls = () => page.evaluate(() => { const m = /^(\d+) balls?/.exec(document.getElementById('labTally').textContent || ''); return m ? +m[1] : 0; });
// Wait until the tally passes `n` balls, and return the result line.
async function nextResult(n, timeout = 20000){
  await page.waitForFunction(n => {
    const m = /^(\d+) balls?/.exec(document.getElementById('labTally').textContent || '');
    return m && +m[1] > n;
  }, n, { timeout, polling: 100 });
  return text('#labResult');
}
async function serveAndPress(eT){
  const n = await balls();
  await page.keyboard.press('r');
  const at = await pressAt(eT);
  const res = await nextResult(n);
  info(`pressed at ${at == null ? '—' : Math.round(at * 1000) + ' ms'} → ${res}`);
  return res;
}

// ---- into the lab ----
ok(await visible('#smItems [data-act="traplab"]'), 'start menu offers TRAP LAB');
await page.click('#smItems [data-act="traplab"]');
await page.waitForTimeout(300);
ok(await visible('#labHud'), 'lab HUD is up');
ok((await text('#rClock')) === 'TRAP LAB', 'clock chip reads TRAP LAB');
ok(!(await visible('#rScore')), 'score chip hidden in the lab');
ok(/window -150 to \+60 ms/.test(await text('#labWinTxt')), 'meter shows the default window (-150 to +60 ms): ' + await text('#labWinTxt'));

// ---- the machine serves on its own; leave it and it runs past ----
const first = await nextResult(0, 12000);
info('first ball: ' + first);
ok(/RAN PAST/.test(first) && /no press/.test(first), 'an untouched ball runs past ("no press")');
ok(/1 ball/.test(await text('#labTally')) && /1 ran past/.test(await text('#labTally')), 'tally counts it: ' + await text('#labTally'));

// ---- on cue + quarter speed for precise presses ----
await chip('auto');
ok((await text('#labAutoV')) === 'ON CUE', 'NEXT switches to ON CUE');
let n0 = await balls();
await page.keyboard.press('r');
const fast = await sweepMs();
await nextResult(n0);
await chip('slow'); await chip('slow');
ok((await text('#labSlowV')) === '¼×', 'TIME switches to quarter speed');
n0 = await balls();
await page.keyboard.press('r');
const slow = await sweepMs();
await nextResult(n0);
info(`0.25 s of play took ${Math.round(fast)} ms at 1× and ${Math.round(slow)} ms at ¼×`);
ok(fast > 150 && fast < 400 && slow > fast * 3, 'quarter speed really runs the ball at a quarter of the pace');

let r = await serveAndPress(-0.035);
ok(/PERFECT/.test(r), 'a press ~35 ms early is PERFECT');
ok(/kept 1\d%/.test(r), 'a perfect touch keeps about 12% of the pace');
ok(/straight back/.test(r), 'square on, it comes straight back');

r = await serveAndPress(0.045);
ok(/LOOSE|HEAVY/.test(r) && /late/.test(r), 'a press ~45 ms late is loose/heavy and reads "late"');
ok(/ran on past you/.test(r), 'a late touch lets the ball run on past you, not back');

r = await serveAndPress(-0.30);
ok(/RAN PAST/.test(r) && /window shut/.test(r), 'a press 300 ms early whiffs and the ball runs past');

await chip('line'); await chip('line');             // AT YOU -> ↑12 -> ↑24
ok((await text('#labLineV')) === '↑24', 'LINE moves the ball\'s line 24 above you');
r = await serveAndPress(-0.035);
ok(/glanced \d+° [↖↑]/.test(r), 'off its line, the touch glances away up the screen');

for(let i = 0; i < 4; i++) await chip('line');      // ↑24 -> ↓24 -> ↓12 -> RANDOM -> AT YOU
for(let i = 0; i < 3; i++) await chip('serve');     // ROLLED -> BOUNCING -> THIGH -> CHEST
ok((await text('#labServeV')) === 'CHEST HIGH', 'SERVE switches to chest high');
r = await serveAndPress(-0.035);
ok(/in the air/.test(r) && /PERFECT|CLEAN/.test(r), 'a chest-high ball is trapped in the air');

// ---- AI receiver at full speed, auto serves ----
await chip('serve'); await chip('serve');           // CHEST -> MIXED -> ROLLED
await chip('slow');                                 // ¼× -> 1×
await chip('recv'); await chip('auto');
ok((await text('#labRecvV')) === 'AI' && (await text('#labAutoV')) === 'AUTO', 'receiver AI, serving automatically');
await page.waitForFunction(() => /^([5-9]|\d\d) balls/.test(document.getElementById('labTally').textContent), null, { timeout: 60000, polling: 250 });
const aiTally = await text('#labTally');
info('AI tally: ' + aiTally);
ok(/perfect|clean|loose|heavy/.test(aiTally), 'the AI traps balls with graded touches');

// ---- tune drawer ----
await chip('tune');
ok(await visible('#labTune'), 'TUNE opens the drawer');
ok((await page.locator('#labDials input[type=range]').count()) === 9, 'nine trap dials in the drawer');
await page.evaluate(() => { const s = document.querySelector('#labDials [data-lk="trapWin"]'); s.value = 2; s.dispatchEvent(new Event('input', { bubbles: true })); });
await page.waitForTimeout(100);
ok(/window -300 to/.test(await text('#labWinTxt')), 'doubling the window widens the meter: ' + await text('#labWinTxt'));
ok((await page.inputValue('#s_trapWin')) === '2', 'the Settings slider mirrors the lab dial');
await page.click('#labTune [data-lab="defaults"]');
await page.waitForTimeout(100);
ok(/window -150 to/.test(await text('#labWinTxt')), 'FACTORY DEFAULTS restores the window');
await page.click('#labTune [data-lab="tune"]');
ok(!(await visible('#labTune')), 'the drawer closes');

// ---- leave for a match ----
await page.click('#labExitBtn');
await page.waitForTimeout(300);
ok(await visible('#startMenu'), 'EXIT returns to the start menu');
ok(!(await visible('#labHud')), 'lab HUD is gone');
await page.click('#smItems [data-act="exhibition"]');
await page.waitForTimeout(1200);
ok(!(await visible('#labHud')), 'no lab HUD in an exhibition');
ok(/^\d+:\d\d$/.test(await text('#rClock')), 'exhibition runs its match clock: ' + await text('#rClock'));
ok(await visible('#rScore'), 'score chip back for the match');

// ---- on a phone: the lab's chips and ☰ take taps as clicks, not trap presses ----
{
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  const ph = await ctx.newPage();
  ph.on('pageerror', e => rep.errs.push('PAGEERROR (phone): ' + e.message));
  await ph.goto(page.url()); await ph.waitForTimeout(700);
  await ph.tap('#smItems [data-act="traplab"]'); await ph.waitForTimeout(400);
  await ph.tap('#labBar [data-lab="slow"]'); await ph.waitForTimeout(120);
  ok((await ph.textContent('#labSlowV')) === '½×', 'phone: tapping a lab chip works');
  ok(/^Tap TRAP/.test((await ph.textContent('#labResult')).trim()), 'phone: the intro says to tap TRAP');
  await ph.tap('#menuBtn'); await ph.waitForTimeout(300);
  ok(await ph.isVisible('#pauseMenu.on'), 'phone: tapping ☰ opens the pause menu');
  await ph.tap('#pauseMenu [data-pause="back"]'); await ph.waitForTimeout(200);
  await ph.tap('#labExitBtn'); await ph.waitForTimeout(300);
  ok(await ph.isVisible('#startMenu'), 'phone: EXIT LAB returns to the start menu');
  await ctx.close();
}

await browser.close();
process.exit(rep.finish() ? 1 : 0);
