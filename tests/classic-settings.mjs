// FOOTBALL CLASSIC, SETTINGS (v242), on the iPhone 15 held sideways (852x393, touch): one list that scrolls -- MATCH
// LENGTH, CAMPUS MENU, HALF-TIME, TIPS, then BUTTON LAYOUT, SKILL MOVES and LABS -- with no pages; no GRAPHICS (pixel art,
// always), no EXHIBITION OPPONENTS (ELITE, always) and no TEXT SIZE, even for settings kept from before with other choices
// in them. LABS opens a page of its own, the five labs and BACK to SETTINGS; SKILL MOVES comes back to SETTINGS too. From a
// match's menu, SETTINGS has no SKILL MOVES and no LABS (the menu has its own SKILL MOVES). Served over http, as the real
// page, so what's kept is there after a reload.
import { chromium } from 'playwright';
import { STAR, reporter } from './_harness.mjs';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import http from 'http';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__S={ PREFS, P:()=>P, screen:()=>SCREEN, lab:()=>LAB, openPause:()=>openPause(), settingsOpen:()=>settingsOpen };\n  const LAB_TITLE=');
const srv = http.createServer((req, res) => { if(req.url.split('?')[0] === '/classic.html'){ res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(src); } else { res.writeHead(404); res.end(); } });
await new Promise(r => srv.listen(0, '127.0.0.1', r));
const URL_ = 'http://127.0.0.1:' + srv.address().port + '/classic.html';

const rep = reporter(); const { ok, info } = rep;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 852, height: 393 }, isMobile: true, hasTouch: true }); await ctx.addInitScript(STAR);
const page = await ctx.newPage();
page.on('pageerror', e => rep.errs.push('PAGEERROR: ' + e.message));
// settings kept from before v242, with the choices that are gone in them: ELITE's opposite, plain shapes, large text
await page.goto(URL_); await page.waitForTimeout(400);
await page.evaluate(() => { const o = JSON.parse(localStorage.getItem('ftc_prefs') || '{}'); Object.assign(o, { oppShift: -3, art: false, text: 'l', ev: 0 }); localStorage.setItem('ftc_prefs', JSON.stringify(o)); });
await page.reload(); await page.waitForTimeout(900);
let r = await page.evaluate(() => ({ opp: __S.PREFS.oppShift, art: __S.PREFS.art, text: __S.PREFS.text, val: __S.P().oppShift.val, big: document.documentElement.dataset.text || '' }));
ok(r.opp === 3 && r.val === 3 && r.art === true && r.text === 'n' && !r.big, 'settings kept with -3, plain shapes and large text open as ELITE, pixel art and the text as it is: no choice of them now (' + JSON.stringify(r) + ')');

// --- the list ---------------------------------------------------------------------------------------------------------------------
await page.tap('#smItems [data-act="settings"]'); await page.waitForTimeout(300);
const list = () => page.evaluate(() => { const ov = document.getElementById('settingsOverlay'), sc = ov.querySelector('.setScroll'), vis = sel => { const e = ov.querySelector(sel); return !!e && e.getClientRects().length > 0; };   // (v246: a page's row hides it, not the button)
  return { on: ov.classList.contains('on'), rows: [...ov.querySelectorAll('#setRows .setLbl')].map(e => e.childNodes[0].textContent.trim()), pager: !!ov.querySelector('.fitPager'), sh: sc.scrollHeight, ch: sc.clientHeight, st: sc.scrollTop,
    layout: !!ov.querySelector('[data-setlayout]'), skills: vis('[data-setskills]'), labs: vis('[data-setlabs]'), fromMatch: ov.classList.contains('fromMatch') }; });
r = await list();
info('SETTINGS: ' + JSON.stringify(r));
ok(r.on && r.rows.join() === 'MATCH LENGTH,CAMPUS MENU,HALF-TIME,TIPS', 'SETTINGS: MATCH LENGTH, CAMPUS MENU, HALF-TIME, TIPS -- no GRAPHICS, no EXHIBITION OPPONENTS, no TEXT SIZE');
ok(!r.pager && r.layout && r.skills && r.labs && !r.fromMatch, 'one list, no pages; BUTTON LAYOUT, SKILL MOVES and LABS in it (from the title page)');
const tpl = await page.evaluate(() => { const ov = document.getElementById('settingsOverlay'), R = e => e.getBoundingClientRect(), b = R(ov.querySelector('.tplBack')), t = R(ov.querySelector('.tplTitle')), box = R(ov.querySelector('.setBox'));
  const rows = [...ov.querySelectorAll('.setScroll .setRow')].filter(e => e.getClientRects().length).map(R), gaps = rows.slice(1).map((q, i) => Math.round(q.top - rows[i].top));
  const opt = R(ov.querySelector('#setRows .setOpts')), lbls = [...ov.querySelectorAll('.setScroll > .setRow .setLbl')].filter(e => e.getClientRects().length).map(e => e.childNodes[0].textContent.trim());
  return { back: [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)], title: Math.round(t.left - b.right), box: [Math.round(box.left), Math.round(box.top - b.bottom), Math.round(innerWidth - box.right)], gaps, opt: Math.round(opt.width), pages: lbls, W: innerWidth }; });
info('the template: ' + JSON.stringify(tpl));
ok(tpl.back[1] === 8 && tpl.back[3] === 36 && Math.abs(tpl.back[2] - 112) <= 1 && tpl.title >= 6 && tpl.title <= 12 && tpl.box[0] === tpl.back[0] && tpl.box[1] === 8 && tpl.gaps.every(g => g === 48) && Math.abs(tpl.opt - 340) <= 2 && tpl.pages.join() === 'BUTTON LAYOUT,SKILL MOVES,LABS',
  'as its template (v246): BACK top left (112 x 36, 8 down), SETTINGS beside it, one box under them the width of the grid, a setting every 48 px with its choices in a column 340 wide; BUTTON LAYOUT, SKILL MOVES and LABS rows of their own');
await page.evaluate(() => document.querySelector('#settingsOverlay [data-setlabs]').scrollIntoView({ block: 'end' })); await page.waitForTimeout(150);
const r2 = await list(), labsBox = await page.locator('#settingsOverlay [data-setlabs]').boundingBox(), scBox = await page.locator('#settingsOverlay .setScroll').boundingBox();
ok(r.sh > r.ch && r2.st > 0 && labsBox.y >= scBox.y - 1 && labsBox.y + labsBox.height <= scBox.y + scBox.height + 1, 'too long for the card: it scrolls (' + r.sh + ' px in ' + r.ch + '), LABS scrolled into it');

// --- SKILL MOVES, and back to SETTINGS ----------------------------------------------------------------------------------------------
await page.tap('#settingsOverlay [data-setskills]'); await page.waitForTimeout(300);
const sk = await page.evaluate(() => ({ skills: document.getElementById('skillsOverlay').classList.contains('on'), set: document.getElementById('settingsOverlay').classList.contains('on') }));
await page.tap('#skillsOverlay [data-skclose]'); await page.waitForTimeout(300);
r = await list();
ok(sk.skills && !sk.set && r.on, 'SKILL MOVES from SETTINGS: the moves, and BACK brings SETTINGS back');

// --- LABS: a page of their own ------------------------------------------------------------------------------------------------------
await page.evaluate(() => document.querySelector('#settingsOverlay [data-setlabs]').scrollIntoView({ block: 'end' }));
await page.tap('#settingsOverlay [data-setlabs]'); await page.waitForTimeout(300);
r = await page.evaluate(() => ({ show: document.getElementById('labsPanel').classList.contains('show'), set: document.getElementById('settingsOverlay').classList.contains('on'),
  labs: [...document.querySelectorAll('#labsPanel [data-act$="lab"]')].map(b => b.textContent.replace('▶', '').trim()) }));
ok(r.show && !r.set && r.labs.join() === 'TRAP LAB,DRIBBLE LAB,PASS LAB,SHOOTING LAB,CROSSING LAB', 'LABS: a page of the five labs (' + r.labs.join(', ') + ')');
await page.tap('#labsPanel [data-act="labsback"]'); await page.waitForTimeout(300);
r = await list();
const panelGone = await page.evaluate(() => !document.getElementById('labsPanel').classList.contains('show'));
ok(r.on && panelGone, 'its BACK: SETTINGS again');
await page.evaluate(() => document.querySelector('#settingsOverlay [data-setlabs]').scrollIntoView({ block: 'end' }));
await page.tap('#settingsOverlay [data-setlabs]'); await page.waitForTimeout(250);
await page.tap('#labsPanel [data-act="passlab"]'); await page.waitForTimeout(900);
r = await page.evaluate(() => ({ screen: __S.screen(), lab: !!(__S.lab() && __S.lab().on), kind: __S.lab() && __S.lab().kind }));
ok(r.screen === 'match' && r.lab, 'PASS LAB from it: the lab starts (' + JSON.stringify(r) + ')');

// --- from a match's menu: no SKILL MOVES, no LABS ------------------------------------------------------------------------------------
await page.evaluate(() => __S.openPause()); await page.waitForTimeout(250);
await page.tap('#pauseMenu [data-pause="settings"]'); await page.waitForTimeout(300);
r = await list();
ok(r.on && r.fromMatch && !r.skills && !r.labs && r.layout, 'SETTINGS from a match\'s menu: no SKILL MOVES and no LABS in it (the menu has SKILL MOVES of its own)');
await page.tap('#settingsOverlay [data-setclose]'); await page.waitForTimeout(250);
const backPause = await page.evaluate(() => document.getElementById('pauseMenu').classList.contains('on'));
ok(backPause, 'BACK: the match\'s menu again');

process.exitCode = rep.finish();
await browser.close(); srv.close();
