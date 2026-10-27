// FOOTBALL CLASSIC ON A PHONE, LANDSCAPE: every screen fits -- its title, tabs and main buttons on the screen at
// 844x390, 844x340 (Safari's bar showing) and 667x375 (an iPhone SE) -- and nothing scrolls: what doesn't fit goes over
// pages (◀ 1 / 3 ▶): the start menu, Settings (a player's settings only: the feel dials are the game's own, a
// developer's with ?dev), the exhibition setup, a new career (Start on screen), the hub, every building's tabs, the
// market's pages, the tactics, the pause menu and the match's tactics, the match report. The menus are framed in pixels
// (a dark outline, a light rim, rounded corners), in four colour schemes. A finger that moves on a man lifts him at once
// (a tap just shows his card) and the stand-in follows it from where he was picked up; the men on the tactics pitch show
// their faces (the bench doesn't), his card has two sides (his ratings, all of him; his spot's instructions), and the
// other phase's shape is a small name box off each spot's corner; each man's number and name sit in his token with room
// round them, clear of its edges. The game is as wide as the phone: no bands, the buttons over the pitch's corner, the
// HUD just the score, the clock and the menu.
import { chromium } from 'playwright';
import { reporter } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={controlled:()=>controlled, sim:()=>simNow, clear:()=>{ for(const p of players) if(p.team!==controlled.team){ p.x=FW-60; p.vx=p.vy=0; } }, end:()=>{ if(careerFix) finishCareerMatch(careerFix); }};\n  const LAB_TITLE=');
patch('  // ===== END MANAGER CAREER', '  window.__MG={get d(){ return CAREER&&CAREER.data; }, mgNextDay, mgPlayGame, mgWindowOpen, mgSave, renderHub};\n  // ===== END MANAGER CAREER');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-ui-')), 'classic.html');
writeFileSync(copy, src);

const rep = reporter(), { ok, info } = rep;
const browser = await chromium.launch();
const SIZES = [[844, 390], [844, 340], [667, 375]];

// on screen: every one of these is wholly inside the viewport (and the page itself doesn't scroll) -- and NOTHING
// scrolls: no box on the screen can be scrolled, and a box too short for what's in it is over pages, nothing cut off
async function onScreen(page, sels){ return page.evaluate(sels => { const W = innerWidth, H = innerHeight, out = [];
  for(const s of sels) for(const el of document.querySelectorAll(s)){ const cs = getComputedStyle(el); if(cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect(); if(r.width < 1 || r.height < 1) continue;
    if(r.left < -1 || r.top < -1 || r.right > W + 1 || r.bottom > H + 1) out.push(s + ' at ' + [r.left, r.top, r.right, r.bottom].map(Math.round).join(',')); }
  const se = document.scrollingElement; if(se.scrollHeight > H + 1) out.push('the page scrolls (' + se.scrollHeight + ')');
  const shown = el => { for(let e = el; e && e !== document.body; e = e.parentElement){ const c = getComputedStyle(e); if(c.display === 'none' || c.visibility === 'hidden') return false; } return el.getClientRects().length > 0; };
  for(const el of document.querySelectorAll('body *')){ const cs = getComputedStyle(el);
    if((/auto|scroll/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 1 || /auto|scroll/.test(cs.overflowX) && el.scrollWidth > el.clientWidth + 1) && shown(el))
      out.push('a box scrolls: ' + (el.id || el.className)); }
  for(const el of document.querySelectorAll('[data-pages]')) if(shown(el) && el.scrollHeight > el.clientHeight + 2) out.push('cut off, not paged: ' + el.dataset.pages + ' ' + el.scrollHeight + '/' + el.clientHeight);
  return out; }, sels); }
async function newCareer(page){
  await page.tap('#smItems [data-act="new"]'); await page.waitForTimeout(200); await page.tap('#newSlotList .slotBtn >> nth=1'); await page.waitForTimeout(300);
  await page.fill('#mgName', 'Sam Okafor'); await page.fill('#mgClubIn', 'Fenmoor Athletic'); await page.tap('#mgGo'); await page.waitForSelector('#careerHub.show', { timeout: 6000 }); }

for(const [w, h] of SIZES){
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(); page.on('pageerror', e => rep.errs.push('PAGEERROR: ' + e.message));
  await page.goto('file://' + copy); await page.waitForTimeout(700);
  const fails = [], check = async (what, sels) => { const bad = await onScreen(page, sels); if(bad.length) fails.push(what + ': ' + bad.slice(0, 2).join('; ')); };
  await check('start menu', ['#smItems .smBtn']);
  await page.tap('#smItems [data-act="settings"]'); await page.waitForTimeout(150);
  await check('settings', ['#settingsOverlay .pauseTitle', '#setRows .setOpt', '[data-setclose]']);
  if(w === 844 && h === 390){
    const st = await page.evaluate(() => ({ rows: [...document.querySelectorAll('#setRows .setLbl')].map(e => e.firstChild.textContent), dials: document.querySelectorAll('#settingsOverlay .dial').length,
      dev: getComputedStyle(document.querySelector('[data-setdev]')).display }));
    ok(String(st.rows) === 'MATCH LENGTH,EXHIBITION OPPONENTS,GRAPHICS,COLOURS' && st.dials === 0 && st.dev === 'none', 'Settings: a player\'s settings only (' + st.rows.join(', ') + '), no feel dials');
    const frame = await page.$eval('#settingsOverlay .pauseCard', e => getComputedStyle(e).boxShadow);
    const radius = await page.$eval('#settingsOverlay .pauseCard', e => parseFloat(getComputedStyle(e).borderTopLeftRadius));
    const btnR = await page.$eval('#setRows .setOpt', e => parseFloat(getComputedStyle(e).borderTopLeftRadius));
    ok(/11, 15, 30/.test(frame) && /230, 238, 255/.test(frame) && radius >= 8 && btnR >= 5, 'the menus are framed in pixels: a dark outline, a light rim, rounded corners (' + radius + ' / ' + btnR + ' px)');
    const look = async () => page.evaluate(() => ({ theme: document.documentElement.dataset.theme || 'blue', btn: getComputedStyle(document.querySelector('#setRows .setOpt:not(.on)')).backgroundImage.slice(0, 40),
      font: getComputedStyle(document.querySelector('#setRows .setOpt')).fontFamily }));
    const l0 = await look(); await page.tap('#setRows [data-pref="theme"][data-val="ruby"]'); await page.waitForTimeout(100); const l1 = await look();
    await page.tap('#setRows [data-pref="theme"][data-val="blue"]'); await page.waitForTimeout(100); const l2 = await look();
    ok(l0.theme === 'blue' && l1.theme === 'ruby' && l1.btn !== l0.btn && l2.btn === l0.btn, 'COLOURS swaps the scheme (blue -> ruby -> blue): ' + l0.btn + ' / ' + l1.btn);
    ok(/FTC Dot/.test(l0.font), 'one font throughout (' + l0.font + ')');
  }
  await page.tap('[data-setclose]'); await page.waitForTimeout(100);
  await page.tap('#smItems [data-act="exhibition"]'); await page.waitForTimeout(200);
  await check('exhibition', ['#exhGo', '#exhPanel [data-act="back"]']);
  await page.tap('#exhPanel [data-act="back"]'); await page.waitForTimeout(100);
  await page.tap('#smItems [data-act="new"]'); await page.waitForTimeout(200); await page.tap('#newSlotList .slotBtn >> nth=1'); await page.waitForTimeout(300);
  await check('new career', ['#mgGo', '#mgrMaker [data-mm="cancel"]', '#mgName', '#mgClubIn']);
  await page.tap('#mgrMaker [data-mm="cancel"]'); await page.waitForTimeout(200);
  await newCareer(page);
  await check('hub', ['#chBottom button', '#chCampus .bldg', '.chMenuBtn']);
  for(const b of ['office', 'market', 'scouting', 'academy', 'stadium', 'news', 'home']){
    await page.tap(`#chCampus [data-bldg="${b}"]`); await page.waitForTimeout(120);
    const tabs = await page.$$eval('#bpTabs .bpTab', ns => ns.map(n => n.textContent));
    for(const t of tabs){ await page.tap(`#bpTabs .bpTab:text-is("${t}")`); await page.waitForTimeout(80);
      await check(b + ' / ' + t, ['.bpTopBack', '#bpTabs .bpTab', '#bpBody', '.mgPager', '.tbTop .tbDrop', '.tbBest', '.tbBench']); }
    await page.tap('.bpTopBack'); await page.waitForTimeout(80);
  }
  ok(!fails.length, w + 'x' + h + ': every menu screen fits, and nothing on it scrolls' + (fails.length ? ' -- ' + fails.slice(0, 3).join(' | ') : ''));
  if(w === 844 && h === 390){   // A LONG LIST GOES OVER PAGES: the market's, with ◀ 1 / n ▶ under it -- ▶ turns the page, the filters stay
    await page.tap('#chCampus [data-bldg="market"]'); await page.waitForTimeout(150); await page.tap('#bpTabs .bpTab:text-is("Search")'); await page.waitForTimeout(150);
    const pg = () => page.evaluate(() => { const b = document.querySelector('#bpBody .mgPaneL [data-pages]'), rows = [...b.querySelectorAll('.mgRow')].filter(r => r.getClientRects().length);
      return { at: (b.querySelector('.fitPager b') || {}).textContent || '', rows: rows.length, first: rows[0] && rows[0].dataset.pid, filters: !!b.querySelector('.mgFilters:not(.fitHide) [data-k="role"]'),
        fits: rows.every(r => r.getBoundingClientRect().bottom <= b.querySelector('.fitPager').getBoundingClientRect().top + 1) }; });
    const p1 = await pg(); await page.tap('#bpBody .mgPaneL .fitPager [data-fitgo="1"]'); await page.waitForTimeout(120); const p2 = await pg();
    info('the market list: ' + JSON.stringify({ p1, p2 }));
    ok(/^1 \/ \d+$/.test(p1.at) && /^2 \//.test(p2.at) && p1.rows >= 3 && p2.rows >= 3 && p1.first !== p2.first && p2.filters && p1.fits && p2.fits,
      'a long list goes over pages: ' + p1.at + ' with ' + p1.rows + ' rows, ▶ for page ' + p2.at + ', the filters on every page, every row above the pager');
    await page.tap('.bpTopBack'); await page.waitForTimeout(80); }
  // a match: the pause menu, the match's tactics, the report
  const mf = [], mcheck = async (what, sels) => { const bad = await onScreen(page, sels); if(bad.length) mf.push(what + ': ' + bad.slice(0, 2).join('; ')); };
  for(let i = 0; i < 8; i++){ const nd = await page.$('#chBottom [data-mg="nextday"]'); if(!nd) break; await nd.tap(); await page.waitForTimeout(100); }
  await page.tap('#chBottom [data-mg="play"]'); await page.waitForTimeout(1200);
  await page.evaluate(() => document.getElementById('menuBtn').click()); await page.waitForTimeout(150);
  await mcheck('pause', ['#pauseGrid .pauseBtn']);
  if(w === 844 && h === 390) ok(!(await page.$('#pauseQuick, #pqMenu')), 'the pause menu: four buttons, no quick-tactics row');
  await page.tap('#pauseGrid [data-pause="tactics"]'); await page.waitForTimeout(200);
  await mcheck('match tactics', ['#mtacOv .bpTopBack', '#mtTeams .bpTab', '#mtacBody .tbDrop', '#mtacBody .tbBench']);
  await page.tap('#mtacOv [data-mt="back"]'); await page.waitForTimeout(100); await page.tap('#pauseGrid [data-pause="back"]');
  await page.evaluate(() => window.__T.end()); await page.waitForTimeout(400);
  await mcheck('match report', ['#mrContinueBtn', '#matchReport .mrScore']);
  ok(!mf.length, w + 'x' + h + ': the pause menu, the match\'s tactics and the report fit' + (mf.length ? ' -- ' + mf.slice(0, 3).join(' | ') : ''));
  await ctx.close();
}

// THE SEASON REVIEW: a long page of the season -- START SEASON 2 stays on the screen (844x340)
{ const ctx = await browser.newContext({ viewport: { width: 844, height: 340 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(); page.on('pageerror', e => rep.errs.push('PAGEERROR: ' + e.message));
  await page.goto('file://' + copy); await page.waitForTimeout(700); await newCareer(page);
  await page.evaluate(() => { const M = __MG, d = M.d; let n = 0; while(d.phase !== 'review' && n++ < 300){ if(M.mgWindowOpen(d)) M.mgNextDay(d); else M.mgPlayGame(d, null, null); } M.mgSave(d); M.renderHub(); });
  await page.tap('#chBottom [data-mg="review"]'); await page.waitForTimeout(200);
  const bad = await onScreen(page, ['#bpFoot [data-mg="newseason"]', '.bpTopBack', '#bpBody']);
  ok(!bad.length && await page.isVisible('#bpFoot [data-mg="newseason"]'), 'the season review: START SEASON 2 pinned on the screen' + (bad.length ? ' -- ' + bad.join(' | ') : ''));
  await ctx.close(); }

// A FINGER: touch a man and move, and he's up at once -- no hold (a tap only shows his card) -- the tactics, on a real touch
{ const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(); page.on('pageerror', e => rep.errs.push('PAGEERROR: ' + e.message));
  await page.goto('file://' + copy); await page.waitForTimeout(700); await newCareer(page);
  await page.tap('#chCampus [data-bldg="office"]'); await page.waitForTimeout(150); await page.tap('#bpTabs .bpTab:text-is("Tactics")'); await page.waitForTimeout(150);
  const cdp = await ctx.newCDPSession(page), touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
  const at = sel => page.$eval(sel, e => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, ri: e.dataset.ri }; });
  const order = () => page.$$eval('#bpBody .tpitch .ptk[data-tac="field"]', ns => ns.map(n => n.dataset.ri).join());
  const o0 = await order(), a = await at('#bpBody .tpitch .ptk[data-tac="field"] >> nth=1'), b = await at('#bpBody .tpitch .ptk[data-tac="field"] >> nth=3');
  await touch('touchStart', a.x, a.y); await page.waitForTimeout(80); await touch('touchEnd', a.x, a.y); await page.waitForTimeout(150);
  ok(await order() === o0 && (await page.$eval('#bpBody .ptk.statview', e => e.dataset.ri)) === a.ri, 'a quick tap shows his card and moves nobody');
  await touch('touchStart', a.x, a.y); await page.waitForTimeout(400); await touch('touchEnd', a.x, a.y); await page.waitForTimeout(150);
  ok(await order() === o0 && !(await page.$('.pxGhost')), 'a finger held still, however long, lifts nobody');
  await touch('touchStart', a.x, a.y); await page.waitForTimeout(20); await touch('touchMove', a.x + (b.x - a.x) / 8, a.y + (b.y - a.y) / 8); await page.waitForTimeout(30);
  const lifted = await page.evaluate(() => !!document.querySelector('.pxGhost'));
  for(let i = 2; i <= 8; i++){ await touch('touchMove', a.x + (b.x - a.x) * i / 8, a.y + (b.y - a.y) * i / 8); await page.waitForTimeout(20); }
  await touch('touchEnd', b.x, b.y); await page.waitForTimeout(200);
  const o1 = (await order()).split(','), w0 = o0.split(',');
  ok(lifted && o1[1] === w0[3] && o1[3] === w0[1], 'a finger that moves lifts him at once, no hold; dropped on another, they swap');
  // ...and the stand-in is where he was picked up, then follows the finger by as much as it's moved
  const c = await at('#bpBody .tpitch .ptk[data-tac="field"] >> nth=2'), tok = await page.$eval('#bpBody .tpitch .ptk[data-tac="field"] >> nth=2', e => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top }; });
  await touch('touchStart', c.x + 5, c.y + 3); await page.waitForTimeout(20);
  await touch('touchMove', c.x + 25, c.y + 13); await page.waitForTimeout(40);
  const g0 = await page.$eval('.pxGhost', e => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top }; });
  await touch('touchMove', c.x + 45, c.y + 23); await page.waitForTimeout(40);
  const g1 = await page.$eval('.pxGhost', e => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top }; });
  await touch('touchEnd', c.x + 45, c.y + 23); await page.waitForTimeout(150);
  ok(Math.abs(g0.l - tok.l - 20) < 1.5 && Math.abs(g0.t - tok.t - 10) < 1.5 && Math.abs(g1.l - g0.l - 20) < 1.5 && Math.abs(g1.t - g0.t - 10) < 1.5,
    'the stand-in moves with the finger from where he was picked up (' + [g0.l - tok.l, g0.t - tok.t].map(Math.round) + ', then ' + [g1.l - g0.l, g1.t - g0.t].map(Math.round) + ')');
  // the tactics: every man on the pitch with his face (not the bench), his card all of him, the other phase's shape lit
  // under them, no MOVE/SWAP, no essays in the menus
  const tv = await page.evaluate(() => { const c = document.querySelector('#cTacRight img.cardBody');
    return { faces: document.querySelectorAll('#bpBody .tpitch .ptk img.ptkFace').length, men: document.querySelectorAll('#bpBody .tpitch .ptk').length,
      benchMen: document.querySelectorAll('#bpBody .tbBench .ptk').length, benchFaces: document.querySelectorAll('#bpBody .tbBench .ptk img').length,
      ghosts: document.querySelectorAll('#bpBody .tpitch .tpGhost').length, card: c ? [c.naturalWidth, c.naturalHeight] : null, move: !!document.querySelector('[data-imove]') }; });
  ok(tv.faces === tv.men && tv.men === 8 && tv.benchMen > 0 && !tv.benchFaces, 'every man on the tactics pitch shows his face (' + tv.faces + '/' + tv.men + '); the bench doesn\'t');
  ok(!!tv.card && tv.card[1] > tv.card[0], 'his card shows all of him, head to toe (' + (tv.card || []).join('x') + ')');
  ok(tv.ghosts === 7, 'the other phase\'s shape is drawn under the men, lit (' + tv.ghosts + ' ghosts)');
  // ...each of them a small box with just the name, off the corner of its spot: over a man there by a little at most
  const gh = await page.evaluate(() => { const toks = [...document.querySelectorAll('#bpBody .tpitch .ptk')].map(e => e.getBoundingClientRect()), out = [];
    for(const g of document.querySelectorAll('#bpBody .tpitch .tpGhost')){ const r = g.getBoundingClientRect(); let worst = 0;
      for(const t of toks){ const w = Math.max(0, Math.min(r.right, t.right) - Math.max(r.left, t.left)), h = Math.max(0, Math.min(r.bottom, t.bottom) - Math.max(r.top, t.top)); worst = Math.max(worst, w * h / (r.width * r.height)); }
      out.push({ face: !!g.querySelector('img'), w: Math.round(r.width), h: Math.round(r.height), over: +worst.toFixed(2) }); }
    const t0 = toks[0]; return { out, tok: [Math.round(t0.width), Math.round(t0.height)] }; });
  info('the ghosts: ' + JSON.stringify(gh));
  ok(gh.out.every(g => !g.face && g.w * g.h < 0.4 * gh.tok[0] * gh.tok[1]), 'a ghost has no face, and is a small box (' + gh.out[0].w + 'x' + gh.out[0].h + ', a man ' + gh.tok.join('x') + ')');
  ok(gh.out.filter(g => g.over > 0.35).length <= 1, 'it sits off the corner of its spot, a man there covering little of it (' + gh.out.map(g => g.over).join(' ') + ')');
  // ...and each carries his shirt number, as his token does (under his face; in the corner on the bench)
  const nums = await page.evaluate(() => { const no = el => ((el && el.querySelector('.ptkNo, em')) || {}).textContent || '';
    return { men: [...document.querySelectorAll('#bpBody .tpitch .ptk[data-tac="field"]')].map(no), keeper: no(document.querySelector('#bpBody .tpitch .ptk[data-tac="gk"]')),
      bench: [...document.querySelectorAll('#bpBody .tbBench .ptk')].map(no), ghosts: [...document.querySelectorAll('#bpBody .tpitch .tpGhost')].map(no) }; });
  const allNo = [nums.keeper, ...nums.men, ...nums.bench], sorted = a => a.slice().sort().join(' ');
  ok(allNo.every(n => /^#\d+$/.test(n)) && new Set(allNo).size === allNo.length && sorted(nums.ghosts) === sorted(nums.men),
    'every man shows his shirt number, on the pitch and the bench, and the other phase\'s boxes carry the same ones (' + nums.men.join(' ') + ' | ' + nums.ghosts.join(' ') + ')');
  // THE CARD HAS TWO SIDES: his ratings (a category opens in their place) and his spot's instructions (no ratings), his
  // name, rating and stars on top of both
  const side = () => page.evaluate(() => ({ six: document.querySelectorAll('#cTacRight .sixC').length, det: document.querySelectorAll('#cTacRight .sixDet .statRow').length,
    instr: document.querySelectorAll('#cTacRight .instrGrp:not(.fitHide)').length + document.querySelectorAll('#cTacRight .instrGrp.fitHide').length, ovr: !!document.querySelector('#cTacRight .mgCardOvr'),
    stars: !!document.querySelector('#cTacRight .stars'), name: (document.querySelector('#cTacRight .mgCardName') || {}).textContent || '', on: (document.querySelector('#cTacRight .cardSide.on') || {}).textContent }));
  await page.tap('#bpBody .tpitch .ptk[data-tac="field"] >> nth=6'); await page.waitForTimeout(150);
  const s1 = await side(); await page.tap('#cTacRight [data-six="DEF"]'); await page.waitForTimeout(150); const s2 = await side();
  await page.tap('#cTacRight [data-six="DEF"]'); await page.waitForTimeout(100); await page.tap('#cTacRight [data-cside="instr"]'); await page.waitForTimeout(150); const s3 = await side();
  await page.tap('#cTacRight [data-cside="rate"]'); await page.waitForTimeout(100);
  info('the card: ' + JSON.stringify({ s1, s2, s3 }));
  ok(s1.on === 'RATINGS' && s1.six === 6 && !s1.instr && s1.ovr && s1.stars, 'his card, RATINGS: the six, his rating and stars on top, no instructions');
  ok(s2.six === 0 && s2.det === 5, '...tap one and what it\'s made of takes their place (DEF: ' + s2.det + ' ratings)');
  ok(s3.on === 'INSTRUCTIONS' && s3.six === 0 && !s3.det && s3.instr >= 1 && s3.ovr && s3.stars && s3.name === s1.name, 'turned over, INSTRUCTIONS: his spot\'s (' + s3.instr + '), no ratings, his name, rating and stars still on top');
  ok(!tv.move, 'no MOVE / SWAP button: a man is moved by dragging him');
  // ROOM IN THE TOKENS: the number clear of the top edge, the name of the bottom -- the glyphs themselves, measured off
  // the font, against the token's 2 px rim -- on the tactics pitch, the bench and the squad's little pitch
  const pads = sel => page.evaluate(sel => {
    const g = document.createElement('canvas').getContext('2d'), out = [];
    const ink = e => { const cs = getComputedStyle(e), r = e.getBoundingClientRect(); g.font = cs.fontSize + ' ' + cs.fontFamily;
      const m = g.measureText(e.textContent), lh = parseFloat(cs.lineHeight), fa = m.fontBoundingBoxAscent, fd = m.fontBoundingBoxDescent;
      const base = r.top + ((isFinite(lh) ? lh : r.height) - (fa + fd)) / 2 + fa;
      return { top: base - m.actualBoundingBoxAscent, bottom: base + m.actualBoundingBoxDescent }; };
    for(const t of document.querySelectorAll(sel)){ const o = t.querySelector('.ptkOvr'), n = t.querySelector('.ptkName'); if(!o || !o.textContent.trim()) continue;
      const T = t.getBoundingClientRect(); out.push({ top: ink(o).top - T.top - 2, bottom: n && n.textContent.trim() ? T.bottom - 2 - ink(n).bottom : 99 }); }
    return { n: out.length, top: Math.min(...out.map(o => o.top)), bottom: Math.min(...out.map(o => o.bottom)) }; }, sel);
  const room = { pitch: await pads('#bpBody .tpitch .ptk'), bench: await pads('#bpBody .tbBench .ptk') };
  await page.tap('#bpTabs .bpTab:text-is("Squad")'); await page.waitForTimeout(150); room.squad = await pads('#bpBody .sqPitch .ptk');
  await page.tap('#bpTabs .bpTab:text-is("Tactics")'); await page.waitForTimeout(150);
  const rm = Object.entries(room).map(([k, v]) => k + ' ' + v.n + ' men, ' + Math.round(v.top) + ' px over the number, ' + Math.round(v.bottom) + ' under the name').join('; ');
  ok(Object.values(room).every(v => v.n >= 7 && v.top >= 5 && v.bottom >= 2), 'room in every token: ' + rm);
  await page.tap('[data-tdrop="style"]'); await page.waitForTimeout(100);
  const opts = await page.$$eval('.tbMenu .tbOpt', ns => ns.map(n => ({ t: n.textContent, i: n.querySelectorAll('i').length })));
  ok(opts.length === 5 && opts.every(o => !o.i), 'the style menu: five names, no descriptions (' + opts.map(o => o.t).join(', ') + ')');
  await ctx.close(); }

// AS WIDE AS THE PHONE: no bands -- the game screen is the screen, wider than 920 (more pitch across); the buttons
// stand over its bottom-right corner where they always did, the stick starts anywhere on the left, and the HUD is
// the score, the way you're kicking, the clock and the menu
{ const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(); page.on('pageerror', e => rep.errs.push('PAGEERROR: ' + e.message));
  await page.goto('file://' + copy); await page.waitForTimeout(700);
  await page.tap('#smItems [data-act="exhibition"]'); await page.waitForTimeout(250); await page.tap('#exhGo'); await page.waitForTimeout(1200);
  const g = await page.evaluate(() => { const s = document.getElementById('stageWrap').getBoundingClientRect(), c = document.getElementById('c'), b = ['kickBtn','shootBtn','crossBtn','skillBtn'].map(id => document.getElementById(id).getBoundingClientRect());
    return { left: s.left, width: s.width, height: s.height, W: c.width, inside: b.every(r => r.left >= s.left && r.right <= s.right + 1 && r.bottom <= s.bottom + 1 && r.left > s.left + s.width * 0.6 && r.top > s.top + s.height * 0.35),
      chips: [...document.querySelectorAll('#readout .chip')].filter(e => getComputedStyle(e).display !== 'none').map(e => e.id || e.textContent.trim().slice(0, 6)) }; });
  ok(g.left === 0 && Math.abs(g.width - 844) < 1 && Math.abs(g.height - 390) < 2 && g.W > 1100, 'the game fills the phone: ' + Math.round(g.width) + 'x' + Math.round(g.height) + ', ' + g.W + ' wide inside (no bands)');
  ok(g.inside, 'the buttons stand over the bottom-right corner of the pitch, as they did before the bands');
  ok(String(g.chips) === 'rScore,rDir,⏱ 0:0,menuBtn' || (g.chips.length === 4 && g.chips[0] === 'rScore' && g.chips[3] === 'menuBtn'), 'the HUD: score, direction, clock, menu -- no ball speed, possession or touch grade (' + g.chips.join(' ') + ')');
  const cdp = await ctx.newCDPSession(page), touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 3 }] });
  await page.evaluate(() => window.__T.clear());   // (their men sent off up the pitch: it's the stick on trial, not whether he's tackled)
  const x0 = 70, c0 = await page.evaluate(() => window.__T.controlled().x), t0 = await page.evaluate(() => window.__T.sim());
  await touch('touchStart', x0, 230); for(let i = 1; i <= 6; i++){ await touch('touchMove', x0 + i * 8, 230); await page.waitForTimeout(40); }
  for(let i = 0; i < 100 && await page.evaluate(t => window.__T.sim() - t < 0.75, t0); i++) await page.waitForTimeout(50);   // (held for 0.75 s of play, however busy the machine)
  const c1 = await page.evaluate(() => window.__T.controlled().x); await touch('touchEnd', x0, 230);
  ok(Math.abs(c1 - c0) > 30, 'a thumb on the left of the screen drives your man (' + Math.round(c1 - c0) + ' px)');
  await ctx.close(); }

process.exitCode = rep.finish();
await browser.close();
