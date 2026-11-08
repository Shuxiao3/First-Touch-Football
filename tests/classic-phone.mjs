// FOOTBALL CLASSIC, ON A COMPUTER AN IPHONE HELD SIDEWAYS (v166): on a computer (no touch screen, and not a browser a test
// drives), the page puts up a phone held sideways -- a screen 852 x 393, an iPhone 15 or 16's -- as big as the window
// takes and in the middle of it, and runs the game in that screen as on the phone: laid out for it, the on-screen
// buttons there, the mouse a finger. The phone's screen is the game's whole screen (it reads 852 x 393, a touch screen);
// the menus are tapped with the mouse; in a match a press and drag on the pitch is the stick, a press on PASS with the
// ball passes it, and a touch the game takes for itself takes the click after it, as on a phone. A bigger or smaller
// window, a bigger or smaller phone, the game's screen the same. If the phone never starts (a host that won't run it),
// 10 s on the game is put on the page instead, for that tab. A phone, or a browser a test drives, isn't put in one.
// On a copy of the game that lets the test reach inside.
import { chromium } from 'playwright';
import { reporter, STAR } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  // ===== END MANAGER CAREER', '  window.__K={ ev:s=>eval(s) };\n  // ===== END MANAGER CAREER');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-phone-')), 'classic.html');
writeFileSync(copy, src);

const rep = reporter(); const { ok, info } = rep;
const browser = await chromium.launch();
const desk = async (viewport, webdriver = false) => { const page = await browser.newPage({ viewport });
  await page.addInitScript(STAR);
  if(!webdriver) await page.addInitScript(() => { Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }); });   // (as a computer's own browser)
  page.on('pageerror', e => rep.errs.push('PAGEERROR: ' + e.message)); page.on('console', m => { if(m.type() === 'error') rep.errs.push('CONSOLE: ' + m.text()); });
  await page.goto('file://' + copy); await page.waitForTimeout(1500); return page; };
const box = (page) => page.evaluate(() => { const f = document.querySelector('iframe[name="ftc-phone"]'); if(!f) return null; const r = f.getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height, cx: Math.round(r.x + r.width / 2), cy: Math.round(r.y + r.height / 2), page: [innerWidth, innerHeight], stage: !!document.getElementById('stageWrap'), kids: document.body.children.length }; });

// A COMPUTER: the phone, in the middle of the window, as big as it takes
const page = await desk({ width: 1280, height: 720 });
const B0 = await box(page);
info('the window 1280 x 720: ' + JSON.stringify(B0));
ok(B0 && Math.abs(B0.w / B0.h - 852 / 393) < 0.01 && B0.cx === 640 && B0.cy === 360 && (B0.w > 1150 || B0.h > 520) && B0.w <= 1280 && B0.h <= 720,
  'a phone held sideways (852:393) in the middle of the window, as big as it takes (' + Math.round(B0.w) + ' x ' + Math.round(B0.h) + ')');
ok(B0 && !B0.stage && B0.kids === 1, 'the game isn\'t on the page itself: only the phone is');
const fr = page.frame({ name: 'ftc-phone' });
await fr.waitForSelector('#smItems [data-act="exhibition"]');
const I0 = await fr.evaluate(() => ({ w: innerWidth, h: innerHeight, touch: document.body.classList.contains('touch'), phone: !!window.__FTC_PHONE, stage: (() => { const r = document.getElementById('stageWrap').getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; })() }));
info('in the phone: ' + JSON.stringify(I0));
ok(I0.w === 852 && I0.h === 393 && I0.touch && I0.phone, 'in it the game\'s screen is the phone\'s, 852 x 393, a touch screen\'s');
ok(I0.stage[0] === 852 && I0.stage[1] === 393, 'the game fills it, as on the phone (' + I0.stage.join(' x ') + ')');

// THE MENUS: tapped with the mouse
await fr.click('#smItems [data-act="exhibition"]'); await fr.waitForSelector('#exhPanel.show', { timeout: 5000 });
await fr.click('#exhGo'); await page.waitForTimeout(1500);
const M = await fr.evaluate(() => { const b = id => { const e = document.getElementById(id), r = e.getBoundingClientRect(); return { on: getComputedStyle(e).display !== 'none', inside: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight }; };
  return { match: window.__K.ev('SCREEN'), kick: b('kickBtn'), shoot: b('shootBtn'), skill: b('skillBtn'), cross: b('crossBtn') }; });
info('a match, from the menus by mouse: ' + JSON.stringify(M));
ok(M.match === 'match' && ['kick', 'shoot', 'skill'].every(k => M[k].on && M[k].inside), 'EXHIBITION and kick off, by mouse; the match has the phone\'s buttons on its screen (PASS, SHOOT, SKILL)');

// THE MOUSE A FINGER: a press on the pitch's left side and a drag -- the stick, under it, and him running that way; let go,
// it's gone
const at = async (sel) => { const r = await fr.evaluate(sel => { const e = typeof sel === 'string' ? document.querySelector(sel) : null; const b = e.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; }, sel);
  const k = B0.w / 852; return [B0.x + r[0] * k, B0.y + r[1] * k]; };   // (where a spot in the phone is on the window)
const k = B0.w / 852, px = (x, y) => [B0.x + x * k, B0.y + y * k];
await fr.evaluate(() => window.__K.ev(`(()=>{ restartT=0; kickT=0; offsideT=0; scoredT=0; gkHold=null; const p=controlled; ball.ownedBy=null; p.vx=p.vy=0; return 1; })()`));
let [x0, y0] = px(200, 260); await page.mouse.move(x0, y0); await page.mouse.down(); await page.waitForTimeout(60);
await page.mouse.move(x0 + 50 * k, y0, { steps: 5 }); await page.waitForTimeout(120);
const S1 = await fr.evaluate(() => { const pad = document.getElementById('pad'), st = document.getElementById('stick'), r = pad.getBoundingClientRect(); return { pad: pad.style.display, at: [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)], stick: st.style.transform, ix: window.__K.ev('curIx') }; });
await page.mouse.up(); await page.waitForTimeout(80);
const S2 = await fr.evaluate(() => document.getElementById('pad').style.display);
info('a press and drag on the pitch: ' + JSON.stringify(S1) + '; let go: ' + S2);
ok(S1.pad === 'block' && Math.abs(S1.at[0] - 200) < 3 && Math.abs(S1.at[1] - 260) < 3 && /translate\((\d+(\.\d+)?)px/.test(S1.stick) && parseFloat(S1.stick.match(/translate\(([-\d.]+)px/)[1]) > 20 && S1.ix > 0.5,
  'pressed on the pitch\'s left side and dragged right: the stick comes up under it and goes right, and so does he');
ok(S2 === 'none', '...and let go of, it\'s gone');

// PASS: the ball at his feet, a press and let-go on PASS -- it's played; and the click after a touch the game took doesn't
// reach anything (a tap on the phone makes none)
await fr.evaluate(() => { window.__clicks = 0; document.addEventListener('click', () => { window.__clicks++; }, true);
  window.__K.ev(`(()=>{ restartT=0; kickT=0; offsideT=0; scoredT=0; gkHold=null; const p=controlled, a=atkOf(p.team); p.vx=p.vy=0; p.facing={x:a,y:0}; ball.x=p.x+a*(p.r+ball.r+4); ball.y=p.y; ball.z=0; ball.vx=ball.vy=ball.vz=0; own(p,p.r+ball.r+4); window.__had=p; return 1; })()`); });
await page.waitForTimeout(60);
const [kx, ky] = await at('#kickBtn'); await page.mouse.move(kx, ky); await page.mouse.down(); await page.waitForTimeout(220); await page.mouse.up(); await page.waitForTimeout(700);
const P1 = await fr.evaluate(() => ({ gone: window.__K.ev('ball.ownedBy!==window.__had'), by: window.__K.ev('ball.lastTouch'), clicks: window.__clicks }));
info('PASS pressed and let go of, by mouse: ' + JSON.stringify(P1));
ok(P1.gone && P1.by === 'G', 'the ball at his feet, PASS pressed and let go of: it\'s played');
ok(P1.clicks === 0, 'and the click after it reaches nothing, as a tap on a phone makes none (' + P1.clicks + ')');

// A SMALLER WINDOW, a taller one: the phone smaller, still in the middle; the game's screen the same
await page.setViewportSize({ width: 900, height: 900 }); await page.waitForTimeout(300);
const B1 = await box(page);
const I1 = await fr.evaluate(() => [innerWidth, innerHeight]);
info('the window 900 x 900: ' + JSON.stringify(B1) + ', in the phone ' + I1.join(' x '));
ok(B1 && Math.abs(B1.w / B1.h - 852 / 393) < 0.01 && B1.cx === 450 && B1.cy === 450 && B1.w < B0.w && B1.w > 800, 'a narrower window: the phone smaller to fit it, still in the middle (' + Math.round(B1.w) + ' wide)');
ok(I1[0] === 852 && I1[1] === 393, '...the game\'s screen the same, 852 x 393');
await page.close();

// A HOST THAT WON'T START THE PHONE (the screen put up, but nothing ever running in it): after 10 s, once, the game on the
// page -- and on from then, in that tab
{ const bp = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await bp.addInitScript(STAR);
  await bp.addInitScript(() => { Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false });
    if(window.top === window){ const d = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'srcdoc');
      Object.defineProperty(HTMLIFrameElement.prototype, 'srcdoc', { configurable: true, get(){ return d.get.call(this); }, set(v){ d.set.call(this, '<!DOCTYPE html><p>nothing</p>'); } }); } });
  await bp.goto('file://' + copy); await bp.waitForTimeout(1500);
  const before = await bp.evaluate(() => ({ frame: !!document.querySelector('iframe[name="ftc-phone"]'), stage: !!document.getElementById('stageWrap') }));
  await bp.waitForTimeout(11000);
  const after = await bp.evaluate(() => ({ frame: !!document.querySelector('iframe[name="ftc-phone"]'), stage: !!document.getElementById('stageWrap'), menu: !!document.querySelector('#smItems [data-act="exhibition"]') }));
  await bp.reload(); await bp.waitForTimeout(1500);
  const again = await bp.evaluate(() => ({ frame: !!document.querySelector('iframe[name="ftc-phone"]'), stage: !!document.getElementById('stageWrap') }));
  info('the phone never starting: at first ' + JSON.stringify(before) + ', 12 s on ' + JSON.stringify(after) + ', opened again ' + JSON.stringify(again));
  ok(before.frame && !before.stage && !after.frame && after.stage && after.menu && !again.frame && again.stage, 'a phone that never starts: 10 s on, the game on the page instead, and so on in that tab');
  await bp.close(); }

// A PHONE: no phone put up -- the game as it is
const ctx = await browser.newContext({ viewport: { width: 852, height: 393 }, hasTouch: true, isMobile: true });
const ph = await ctx.newPage(); await ph.addInitScript(() => { Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }); });
await ph.goto('file://' + copy); await ph.waitForTimeout(1500);
const PH = await ph.evaluate(() => ({ frame: !!document.querySelector('iframe[name="ftc-phone"]'), stage: !!document.getElementById('stageWrap'), touch: document.body.classList.contains('touch'), w: innerWidth }));
info('on a phone: ' + JSON.stringify(PH));
ok(!PH.frame && PH.stage && PH.touch, 'on a phone, the game as it is: no phone put up round it');
await ctx.close();

// A BROWSER A TEST DRIVES: as before -- the game on the page, as every other test has it
const td = await desk({ width: 1100, height: 700 }, true);
const TD = await td.evaluate(() => ({ frame: !!document.querySelector('iframe[name="ftc-phone"]'), stage: !!document.getElementById('stageWrap'), touch: document.body.classList.contains('touch') }));
info('a browser a test drives: ' + JSON.stringify(TD));
ok(!TD.frame && TD.stage && !TD.touch, 'a browser a test drives: no phone, the game on the page as before');
await td.close();

await browser.close();
process.exit(rep.finish() ? 1 : 0);
