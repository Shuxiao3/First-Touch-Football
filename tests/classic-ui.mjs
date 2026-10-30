// FOOTBALL CLASSIC ON A PHONE, LANDSCAPE: every screen fits -- its title, tabs and main buttons on the screen at
// 844x390, 844x340 (Safari's bar showing) and 667x375 (an iPhone SE) -- and nothing scrolls: what doesn't fit goes over
// pages (◀ 1 / 3 ▶): the start menu, Settings (a player's settings only: the feel dials are the game's own, a
// developer's with ?dev), SKILL MOVES (every move over pages, its name whole, its drawing drawn and its clip playing; from
// the pause menu too, the match waiting while it's open), the exhibition setup, a new career (Start on screen), the hub,
// every building's tabs (the Selection tab's bars too), the market's pages, the tactics, the pause menu and the match's tactics, the match report. The menus are framed in pixels
// (a dark outline, a light rim, rounded corners), in four colour schemes. A finger that moves on a man lifts him at once
// (a tap just shows his card) and the stand-in follows it from where he was picked up; the men on the tactics pitch show
// their faces (the bench doesn't), his card has two sides (his ratings, all of him; his spot's instructions), and the
// other phase's shape is a small name box off each spot's corner; each man's number and name sit in his token with room
// round them, clear of its edges. The width shows on the pitch (a four across the middle spreads from COMPACT to WIDE)
// and no man covers another or hangs off it, at every size; in a match his card shows his STAMINA as a bar, no figure,
// the button that turns it over level with the bar's foot. On a narrow phone (640x360) the bench stays on one line and every man's card fits. The
// game is as wide as the phone: no bands, the buttons over the pitch's corner, the HUD just the score, the clock, your
// man's window (his number, full name and position, his stamina and skill stars: top right beside the menu, at every
// size) and the menu.
import { chromium } from 'playwright';
import { reporter } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={controlled:()=>controlled, players:()=>players, setControlled, sim:()=>simNow, mateAt:(x,y)=>mateAtClient(x,y), scr:q=>{ const s=proj(q.x,q.y,PLAYER_H*0.45), r=rect(); return {x:r.left+s.x*r.width/W, y:r.top+s.y*r.height/H}; }, theirBall:()=>{ const o=players.find(p=>p.team!==controlled.team&&p.role!==\'G\'); own(o,o.r+ball.r+5); }, clear:()=>{ for(const p of players) if(p.team!==controlled.team){ p.x=FW-60; p.vx=p.vy=0; } }, end:()=>{ if(careerFix) finishCareerMatch(careerFix); }};\n  const LAB_TITLE=');
patch('  let INJ_OFF=false;', '  let INJ_OFF=true;');   // (injuries off: a man hurt in a match would change who plays -- manager-injury.mjs is injuries' test)
patch('  // ===== END MANAGER CAREER', '  window.__MG={get d(){ return CAREER&&CAREER.data; }, setPref, bldUp, lvOf, mgForward, mgPlayGame, mgWindowOpen, mgSave, renderHub, STYLES};\n  // ===== END MANAGER CAREER');
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
// NO MAN COVERS ANOTHER on a tactics pitch, and none hangs off it -- and how far its midfield spreads, top to bottom
const apart = (page, sel) => page.evaluate(sel => { const P = document.querySelector(sel), pr = P.getBoundingClientRect(), T = [...P.querySelectorAll('.ptk')].map(e => e.getBoundingClientRect());
  let over = 0, out = 0; for(let i = 0; i < T.length; i++){ const a = T[i]; out = Math.max(out, pr.left - a.left, a.right - pr.right, pr.top - a.top, a.bottom - pr.bottom);
    for(let j = i + 1; j < T.length; j++){ const b = T[j]; if(Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0.5 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0.5) over++; } }
  const M = [...P.querySelectorAll('.ptk[data-role="MID"]')].map(e => e.getBoundingClientRect());
  return { n: T.length, over, out: Math.round(out), span: M.length ? Math.round(Math.max(...M.map(r => r.bottom)) - Math.min(...M.map(r => r.top))) : 0 }; }, sel);
// HIS STAMINA on his card in a match: the word, a bar and no figure -- the button that turns the card over level with the bar's foot
// YOUR MAN'S WINDOW in a match, top right beside the menu: what it says (his number, name, position, how many of its
// stars are lit, how far its stamina bar is filled) against the man you control, and where it sits among the HUD's chips
const hudWin = page => page.evaluate(() => { const c = window.__T.controlled(), R = e => e.getBoundingClientRect(), W = R(document.getElementById('rPlayer')), M = R(document.getElementById('menuBtn')), S = R(document.getElementById('stageWrap'));
  const nm = document.getElementById('rpName'), st = document.querySelector('#rpStars .stars'), fill = document.getElementById('rpSt'), chips = [...document.querySelectorAll('#readout .chip')].filter(e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden').map(R);
  const over = chips.some((a, i) => chips.some((b, j) => j > i && a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5));
  return { num: document.getElementById('rpNum').textContent, name: nm.textContent, pos: document.getElementById('rpPos').textContent, lit: st ? st.textContent.length - (st.querySelector('i') ? st.querySelector('i').textContent.length : 0) : -1,
    fill: +(R(fill).width / R(fill.parentElement).width).toFixed(3), col: fill.style.background, cNum: c.num, cName: c.pname, cStars: c.stars, cSt: +c.stamina.toFixed(3),
    cut: nm.scrollWidth > nm.clientWidth, top: Math.round(W.top - S.top), gap: Math.round(M.left - W.right), level: Math.abs(W.top - M.top) < 1 && Math.abs(W.bottom - M.bottom) < 1, inside: W.left >= S.left && M.right <= S.right, over }; });
const winOk = (v, full) => v.num === '#' + v.cNum && (full ? v.name === v.cName : v.name.split(' ').length === 2 && v.name.endsWith(' ' + v.cName)) && v.pos.length >= 2 && v.lit === Math.max(1, Math.min(5, v.cStars || 1))
  && Math.abs(v.fill - v.cSt) <= 0.02 && !v.cut && v.top <= 12 && v.gap >= 0 && v.gap <= 10 && v.level && v.inside && !v.over;
const legsRow = (page, sel) => page.evaluate(sel => { const h = document.querySelector(sel + ' .mgCardHead'), l = h && h.querySelector('.mtLegs'), bar = l && l.querySelector('.statBar'), f = h && h.querySelector('button[data-cside]');
  return { text: l ? l.textContent : '', pct: /%/.test(h ? h.textContent : ''), bar: bar ? Math.round(bar.getBoundingClientRect().bottom) : null, flip: f ? Math.round(f.getBoundingClientRect().bottom) : null }; }, sel);
// THE SKILL MOVES PAGE as it is on the screen: each page's moves (▶ to the next), any whose name or card is cut off, and
// whether each move showing has its drawing drawn and its clip moving
async function skillsPage(page){
  const all = await page.evaluate(() => [...document.querySelectorAll('#skGrid .skCard')].map(c => c.dataset.sk)), seen = [], cut = []; let pages = 1;
  for(let i = 0; i < 6; i++){
    const v = await page.evaluate(() => { const vis = [...document.querySelectorAll('#skGrid .skCard')].filter(c => c.getClientRects().length);
      return { kinds: vis.map(c => c.dataset.sk), cut: vis.filter(c => { const n = c.querySelector('.skName'); return n.scrollWidth > n.clientWidth + 1 || c.scrollWidth > c.clientWidth + 1; }).map(c => c.dataset.sk),
        next: !!document.querySelector('#skGrid .fitPager [data-fitgo="1"]:not([disabled])') }; });
    seen.push(...v.kinds); cut.push(...v.cut); if(!v.next) break; await page.tap('#skGrid .fitPager [data-fitgo="1"]'); await page.waitForTimeout(150); pages++; }
  const px = () => page.evaluate(() => [...document.querySelectorAll('#skGrid .skCard')].filter(c => c.getClientRects().length).map(c => {
    const sum = cv => { const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let h = 0, n = 0; for(let i = 0; i < d.length; i += 4){ h = (h * 31 + d[i] + d[i + 1] * 3 + d[i + 2] * 7) >>> 0; if(d[i + 3]) n++; } return [h, n]; };
    return { drawn: sum(c.querySelector('.skDraw'))[1], clip: sum(c.querySelector('.skClip'))[0] }; }));
  const a = await px(); await page.waitForTimeout(450); const b = await px();
  return { all, seen, cut, pages, drawn: a.length > 0 && a.every(x => x.drawn > 50), moving: a.some((x, i) => b[i] && x.clip !== b[i].clip) }; }
async function newCareer(page){
  await page.tap('#smItems [data-act="new"]'); await page.waitForTimeout(200); await page.tap('#newSlotList .slotBtn >> nth=1'); await page.waitForTimeout(300);
  await page.fill('#mgName', 'Sam Okafor'); await page.fill('#mgClubIn', 'Fenmoor Athletic'); await page.tap('#mgGo'); await page.waitForSelector('#careerHub.show', { timeout: 6000 });
  await page.evaluate(() => { const d = __MG.d; d.story = { vet: 2, kid: 2 }; __MG.mgSave(d); }); }   // (the first season's two arrivals: manager-career's)

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
    ok(String(st.rows) === 'MATCH LENGTH,EXHIBITION OPPONENTS,GRAPHICS,COLOURS,CAMPUS MENU' && st.dials === 0 && st.dev === 'none', 'Settings: a player\'s settings only (' + st.rows.join(', ') + '), no feel dials');
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
  await page.tap('#smItems [data-act="skills"]'); await page.waitForTimeout(300);
  await check('skill moves', ['#skillsOverlay .pauseTitle', '#skillsOverlay .skHint', '#skGrid .skCard', '[data-skclose]']);
  { const sk = await skillsPage(page);
    ok(sk.all.length === 9 && sk.seen.join() === sk.all.join() && !sk.cut.length && sk.drawn && sk.moving,
      w + 'x' + h + ': SKILL MOVES: all nine moves over ' + sk.pages + ' page' + (sk.pages > 1 ? 's' : '') + ', each name whole, what to draw drawn and its clip playing' + (sk.cut.length ? ' -- cut: ' + sk.cut.join(', ') : '')); }
  await page.tap('[data-skclose]'); await page.waitForTimeout(100);
  await page.tap('#smItems [data-act="exhibition"]'); await page.waitForTimeout(200);
  await check('exhibition', ['#exhGo', '#exhPanel [data-act="back"]']);
  await page.tap('#exhPanel [data-act="back"]'); await page.waitForTimeout(100);
  await page.tap('#smItems [data-act="new"]'); await page.waitForTimeout(200); await page.tap('#newSlotList .slotBtn >> nth=1'); await page.waitForTimeout(300);
  await check('new career', ['#mgGo', '#mgrMaker [data-mm="cancel"]', '#mgName', '#mgClubIn']);
  await page.tap('#mgrMaker [data-mm="cancel"]'); await page.waitForTimeout(200);
  await newCareer(page);
  await check('hub', ['#chBottom button', '#chCampus .bldg', '.chMenuBtn', '.cpStats', '#cpView']);
  { // THE CAMPUS at 1x on a phone (no stretched pixels), its middle in the middle of the room it has, the strip whole;
    // the menu down the left, or the right if Settings says so
    await page.waitForTimeout(150);
    const cp = async () => page.evaluate(() => { const v = document.getElementById('cpView').getBoundingClientRect(), m = new DOMMatrix(getComputedStyle(document.getElementById('cpWorld')).transform),
      st = document.getElementById('cpStats'), nav = document.querySelector('.cpNav').getBoundingClientRect();
      return { s: m.a, whole: Number.isInteger(m.e) && Number.isInteger(m.f), mid: [Math.round(m.e + (64 + 320) * m.a - v.width / 2), Math.round(m.f + (40 + 184) * m.a - v.height / 2)],
        strip: st.scrollWidth <= st.clientWidth + 1, phase: document.getElementById('chPhase').textContent, right: nav.left > v.left }; });
    const c = await cp();
    ok(c.s === 1 && c.whole && Math.abs(c.mid[0]) <= 2 && Math.abs(c.mid[1]) <= 2 && c.strip && !c.right,
      w + 'x' + h + ': the campus at 1x, its middle in the middle (' + c.mid + '), the menu on the left, the strip whole: ' + c.phase);
    if(w === 844 && h === 390){ await page.evaluate(() => window.__MG.setPref('side', 'right')); await page.waitForTimeout(100); const r = await cp();
      await page.evaluate(() => window.__MG.setPref('side', 'left'));
      ok(r.right && r.s === 1 && Math.abs(r.mid[0]) <= 2, 'CAMPUS MENU: RIGHT puts the buildings down the right, the campus as it was'); }
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });   // (the buildings open at once; NEXT DAY's sunset is manager-career.mjs's)
  for(const b of ['club', 'train', 'stadium', 'market', 'physio', 'scouting', 'academy']){
    await page.tap(`#chCampus [data-bldg="${b}"]`); await page.waitForSelector('#bldgPanel.show'); await page.waitForTimeout(80);
    let tabs = await page.$$eval('#bpTabs .bpTab', ns => ns.map(n => n.textContent));
    if(!tabs.length && await page.$('#bpFoot [data-mg="goclub"]')){   // (not yet: what it is, the clubhouse it needs -- then the clubhouse built up to it)
      await check(b + ' / waits for its clubhouse', ['.bpTopBack', '#bpBody', '#bpFoot [data-mg="goclub"]']);
      await page.evaluate(() => { const M = window.__MG, d = M.d; d.budget = 1e7; d.top = 4; while(M.lvOf(d, 'club') < 4) M.bldUp(d, 'club'); M.mgSave(d); M.renderHub(); });
      await page.tap('.bpTopBack'); await page.waitForTimeout(80); await page.tap(`#chCampus [data-bldg="${b}"]`); await page.waitForSelector('#bldgPanel.show'); await page.waitForTimeout(80); }
    if(!tabs.length && await page.$('#bpFoot [data-mg="up"]') && !(await page.$('#bpBody .bpLvl'))){   // (one to buy: what it'd cost, BUILD IT -- then its own screen)
      await check(b + ' / to buy', ['.bpTopBack', '#bpBody', '#bpFoot [data-mg="up"]']);
      await page.evaluate(() => { window.__MG.d.budget = 1e7; }); await page.tap('#bpFoot [data-mg="up"]'); await page.waitForTimeout(150);
      tabs = await page.$$eval('#bpTabs .bpTab', ns => ns.map(n => n.textContent)); }
    if(!tabs.length) await check(b, ['.bpTopBack', '#bpBody', '.mgPager', '#bpFoot .mgBtn']);
    for(const t of tabs){ await page.tap(`#bpTabs .bpTab:text-is("${t}")`); await page.waitForTimeout(80);
      await check(b + ' / ' + t, ['.bpTopBack', '#bpTabs .bpTab', '#bpBody', '.mgPager', '.tbTop .tbDrop', '.tbBest', '.tbBench', '.selRow']); }
    await page.tap('.bpTopBack'); await page.waitForTimeout(80);
  }
  await page.tap('#careerHub [data-hub="decor"]'); await page.waitForSelector('#bldgPanel.show'); await page.waitForTimeout(80);
  for(const t of ['Trees', 'Garden', 'Plaza']){ await page.tap(`#bpTabs .bpTab:text-is("${t}")`); await page.waitForTimeout(100);
    await check('decorate / ' + t, ['.bpTopBack', '#bpTabs .bpTab', '#bpBody', '.decoCard']); }
  await page.tap('.bpTopBack'); await page.waitForTimeout(80);
  ok(!fails.length, w + 'x' + h + ': every menu screen fits, and nothing on it scrolls (one waiting for its clubhouse, one to buy, every building\'s every tab, DECORATE)' + (fails.length ? ' -- ' + fails.slice(0, 3).join(' | ') : ''));
  { // THE WIDTH SHOWS ON THE PITCH and nobody overlaps: a four across the middle (2-4-1), COMPACT and WIDE, on the training pitch and the clubhouse's Squad
    await page.evaluate(() => { const d = window.__MG.d; d.lv.train = 4; window.__MG.mgSave(d); });   // (every shape: the training pitch's locks are manager-career.mjs's)
    await page.tap('#chCampus [data-bldg="train"]'); await page.waitForTimeout(120); await page.tap('#bpTabs .bpTab:text-is("Tactics")'); await page.waitForTimeout(120);
    const d0 = await page.evaluate(() => [window.__MG.d.formation, window.__MG.d.width.atk]);
    const set = async (form, wd) => { await page.tap('#bpBody [data-tdrop="form"]'); await page.waitForTimeout(60); await page.tap(`#bpBody [data-cform="${form}"]`); await page.waitForTimeout(80);
      await page.tap('#bpBody [data-tdrop="width"]'); await page.waitForTimeout(60); await page.tap(`#bpBody [data-cwidth="${wd}"]`); await page.waitForTimeout(80); };
    await set('2-4-1', '0.84'); const cpt = await apart(page, '#bpBody .tpitch');
    await page.tap('.bpTopBack'); await page.waitForTimeout(80); await page.tap('#chCampus [data-bldg="club"]'); await page.waitForTimeout(120);
    await page.tap('#bpTabs .bpTab:text-is("Squad")'); await page.waitForTimeout(120); const sq = await apart(page, '#bpBody .sqPitch');
    await page.tap('.bpTopBack'); await page.waitForTimeout(80); await page.tap('#chCampus [data-bldg="train"]'); await page.waitForTimeout(120); await page.tap('#bpTabs .bpTab:text-is("Tactics")'); await page.waitForTimeout(120);
    await set('2-4-1', '1.18'); const wde = await apart(page, '#bpBody .tpitch');
    await set(d0[0], String(d0[1])); await page.tap('.bpTopBack'); await page.waitForTimeout(80);
    ok(cpt.n === 8 && sq.n === 8 && !cpt.over && !cpt.out && !sq.over && !sq.out && !wde.over && !wde.out && wde.span > cpt.span + 20,
      w + 'x' + h + ': a four across the middle -- COMPACT, nobody overlaps or hangs off the pitch (the training pitch\'s and the Squad\'s); WIDE, the four spread ' + cpt.span + ' -> ' + wde.span + ' px'
      + (cpt.over + sq.over + wde.over ? ' -- overlaps: ' + [cpt.over, sq.over, wde.over].join('/') : '') + (cpt.out + sq.out + wde.out ? ' -- off the pitch by ' + Math.max(cpt.out, sq.out, wde.out) + ' px' : '')); }
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
  for(let i = 0; i < 8; i++){ const nd = await page.$('#chBottom [data-mg="forward"]'); if(!nd) break; await nd.tap(); await page.waitForTimeout(100); }
  await page.tap('#chBottom [data-mg="play"]'); await page.waitForTimeout(1200);
  const hw = await hudWin(page);
  ok(winOk(hw, true), w + 'x' + h + ': your man\'s window, top right beside the menu and level with it: ' + hw.num + ' ' + hw.name + ' ' + hw.pos + ', ' + hw.lit + ' stars lit, stamina ' + Math.round(hw.fill * 100) + '% -- his, all of it on screen and over no other chip' + (winOk(hw, true) ? '' : ' ' + JSON.stringify(hw)));
  await page.evaluate(() => document.getElementById('menuBtn').click()); await page.waitForTimeout(150);
  await mcheck('pause', ['#pauseGrid .pauseBtn']);
  if(w === 844 && h === 390) ok(!(await page.$('#pauseQuick, #pqMenu')), 'the pause menu: five buttons, no quick-tactics row');
  await page.tap('#pauseGrid [data-pause="skills"]'); await page.waitForTimeout(300);
  await mcheck('skill moves, in a match', ['#skillsOverlay .pauseTitle', '#skGrid .skCard', '[data-skclose]']);
  { const t0 = await page.evaluate(() => window.__T.sim()); await page.waitForTimeout(400); const t1 = await page.evaluate(() => window.__T.sim());
    await page.tap('[data-skclose]'); await page.waitForTimeout(150);
    const menu = await page.evaluate(() => document.getElementById('pauseMenu').classList.contains('on') && !document.getElementById('skillsOverlay').classList.contains('on'));
    ok(t0 === t1 && menu, w + 'x' + h + ': SKILL MOVES from the pause menu: the match waits while it\'s open, and BACK goes back to the menu'); }
  await page.tap('#pauseGrid [data-pause="tactics"]'); await page.waitForTimeout(200);
  await mcheck('match tactics', ['#mtacOv .bpTopBack', '#mtTeams .bpTab', '#mtacBody .tbDrop', '#mtacBody .tbBench']);
  const lg = await legsRow(page, '#mtacBody');
  ok(lg.text === 'STAMINA' && !lg.pct && lg.bar != null && lg.flip != null && Math.abs(lg.bar - lg.flip) <= 1, w + 'x' + h + ': his card in a match: STAMINA and a bar, no figure, the button level with the bar\'s foot (' + lg.bar + ' / ' + lg.flip + ')');
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
  await page.evaluate(() => { const M = __MG, d = M.d; let n = 0; while(d.phase !== 'review' && n++ < 300){ if(d.wday === 'mon') M.mgForward(d); else M.mgPlayGame(d, null, null); } M.mgSave(d); M.renderHub(); });
  await page.tap('#chBottom [data-mg="review"]'); await page.waitForTimeout(200);
  const bad = await onScreen(page, ['#bpFoot [data-mg="newseason"]', '.bpTopBack', '#bpBody']);
  ok(!bad.length && await page.isVisible('#bpFoot [data-mg="newseason"]'), 'the season review: START SEASON 2 pinned on the screen' + (bad.length ? ' -- ' + bad.join(' | ') : ''));
  await ctx.close(); }

// A FINGER: touch a man and move, and he's up at once -- no hold (a tap only shows his card) -- the tactics, on a real touch
{ const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(); page.on('pageerror', e => rep.errs.push('PAGEERROR: ' + e.message));
  await page.goto('file://' + copy); await page.waitForTimeout(700); await newCareer(page); await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => { const d = window.__MG.d; d.lv.train = 4; window.__MG.mgSave(d); });
  await page.tap('#chCampus [data-bldg="train"]'); await page.waitForTimeout(150); await page.tap('#bpTabs .bpTab:text-is("Tactics")'); await page.waitForTimeout(150);
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
      const P = g.parentElement.getBoundingClientRect(), dx = r.left - (P.left + parseFloat(g.style.left) / 100 * P.width);
      out.push({ face: !!g.querySelector('img'), w: Math.round(r.width), h: Math.round(r.height), over: +worst.toFixed(2), dx: Math.round(dx), inside: r.right <= P.right + 1 }); }
    const t0 = toks[0]; return { out, tok: [Math.round(t0.width), Math.round(t0.height)] }; });
  info('the ghosts: ' + JSON.stringify(gh));
  ok(gh.out.every(g => !g.face && g.w * g.h < 0.4 * gh.tok[0] * gh.tok[1]), 'a ghost has no face, and is a small box (' + gh.out[0].w + 'x' + gh.out[0].h + ', a man ' + gh.tok.join('x') + ')');
  ok(gh.out.filter(g => g.over > 0.35).length <= 1, 'it sits off the corner of its spot, a man there covering little of it (' + gh.out.map(g => g.over).join(' ') + ')');
  ok(gh.out.every(g => g.dx > 10 && g.inside), 'every box is off the right of its spot, the forwards\' too, and on the pitch (' + gh.out.map(g => g.dx).join(' ') + ' px right)');
  // ...and each carries his shirt number, as his token does (under his face; in the corner on the bench)
  const nums = await page.evaluate(() => { const no = el => ((el && el.querySelector('.ptkNo, em')) || {}).textContent || '';
    return { men: [...document.querySelectorAll('#bpBody .tpitch .ptk[data-tac="field"]')].map(no), keeper: no(document.querySelector('#bpBody .tpitch .ptk[data-tac="gk"]')),
      bench: [...document.querySelectorAll('#bpBody .tbBench .ptk')].map(no), ghosts: [...document.querySelectorAll('#bpBody .tpitch .tpGhost')].map(no) }; });
  const allNo = [nums.keeper, ...nums.men, ...nums.bench], sorted = a => a.slice().sort().join(' ');
  ok(allNo.every(n => /^#\d+$/.test(n)) && new Set(allNo).size === allNo.length && sorted(nums.ghosts) === sorted(nums.men),
    'every man shows his shirt number, on the pitch and the bench, and the other phase\'s boxes carry the same ones (' + nums.men.join(' ') + ' | ' + nums.ghosts.join(' ') + ')');
  // ...and his own position beside his rating; a winger is an attacker, a wide midfielder a midfielder (WM)
  const own = await page.evaluate(() => { const d = window.__MG.d, all = [...d.roster, ...Object.values(d.world.clubs).flatMap(c => c.players || [])];
    return { toks: [...document.querySelectorAll('#bpBody .tpitch .ptk[data-ri], #bpBody .tbBench .ptk[data-ri]')].map(t => { const p = d.roster[+t.dataset.ri];
        return [(t.querySelector('.ptkPos') || {}).textContent || '', p.role === 'GK' ? 'GK' : p.subRole]; }),
      midStyles: Object.values(window.__MG.STYLES).filter(S => S.role === 'MID').map(S => S.sub + ' ' + S.name), wngNotAtt: all.filter(p => p.subRole === 'WNG' && p.role !== 'ATT').length,
      wm: all.filter(p => p.subRole === 'WM' && p.role === 'MID').length }; });
  ok(own.toks.length === 13 && own.toks.every(([a, b]) => a && a === b), 'every man shows his own position beside his rating, the eight and the bench\'s five (' + own.toks.map(x => x[0]).join(' ') + ')');
  ok(!own.midStyles.some(x => /WNG|Winger/.test(x)) && !own.wngNotAtt && own.wm > 0, 'a winger is an attacker: no midfielder is a winger; wide midfielders are WM (' + own.wm + ' in the world; midfield styles ' + own.midStyles.join(', ') + ')');
  // THE CARD HAS TWO SIDES: his ratings (a category opens under the six) and his spot's instructions (no ratings), turned
  // over with one small button under his rating; his figure, name, rating and stars on top of both
  const side = () => page.evaluate(() => { const flips = [...document.querySelectorAll('#cTacRight button[data-cside]')], f = flips[0], fr = f && f.getBoundingClientRect(), o = document.querySelector('#cTacRight .mgCardOvr');
    return { six: document.querySelectorAll('#cTacRight .sixC').length, det: document.querySelectorAll('#cTacRight .sixOpen .statRow').length,
      instr: document.querySelectorAll('#cTacRight .instrGrp').length, ovr: !!o, body: !!document.querySelector('#cTacRight .mgCardHead img.cardBody'),
      stars: !!document.querySelector('#cTacRight .stars'), name: (document.querySelector('#cTacRight .mgCardName') || {}).textContent || '',
      flips: flips.length, flip: f ? f.textContent : '', small: !!f && fr.height <= 24 && fr.width <= 90, under: !!f && !!o && fr.top >= o.getBoundingClientRect().bottom - 1,
      seen: [...document.querySelectorAll('#cTacRight .sixOpen .statRow')].every(e => e.getClientRects().length),
      bars: [...document.querySelectorAll('#cTacRight .sixOpen .statBar')].filter(e => e.getClientRects().length && e.getBoundingClientRect().width > 10).length, hd: (document.querySelector('#cTacRight .sixOpen .sixHd') || {}).textContent || '',
      desc: document.querySelectorAll('#cTacRight .instrDesc, #cTacRight .instrNote, #cTacRight .instrHead').length,
      paged: !!document.querySelector('#cTacRight .fitPager'), fits: (b => b.scrollHeight <= b.clientHeight + 1)(document.getElementById('cTacRight')),
      top: [...document.querySelectorAll('#cTacRight .mgCardHead, #cTacRight .mgCardHead > *')].map(e => { const r = e.getBoundingClientRect(); return Math.round(r.width) + 'x' + Math.round(r.height); }).join(' ') }; });
  await page.tap('#bpBody .tpitch .ptk[data-tac="field"] >> nth=6'); await page.waitForTimeout(150);
  const s1 = await side(); await page.tap('#cTacRight [data-six="DEF"]'); await page.waitForTimeout(150); const s2 = await side();
  for(let i = 0; i < 5; i++){ const pv = await page.$('#cTacRight .fitPager [data-fitgo="-1"]:not([disabled])'); if(!pv) break; await pv.tap(); await page.waitForTimeout(60); }   // (back to the six)
  await page.tap('#cTacRight [data-six="DEF"]'); await page.waitForTimeout(100); await page.tap('#cTacRight [data-cside="instr"]'); await page.waitForTimeout(150); const s3 = await side();
  await page.tap('#cTacRight [data-cside="rate"]'); await page.waitForTimeout(100);
  info('the card: ' + JSON.stringify({ s1, s2, s3 }));
  ok(s1.flips === 1 && s1.small && s1.under && /INSTRUCTIONS/.test(s1.flip) && s1.six === 6 && !s1.instr && s1.body && s1.ovr && s1.stars,
    'his card: his figure, rating and stars, the six, and one small button under his rating (' + s1.flip + ')');
  ok(s2.six === 6 && s2.det === 4 && s2.seen && s2.bars === 4 && /DEFENDING/.test(s2.hd) && !s2.paged && s2.fits, '...tap one and what it\'s made of opens under the six, its name and a coloured bar for each rating, all of it on the card, no pages (DEF: ' + s2.det + ' ratings, ' + s2.bars + ' bars)');
  ok(s3.flips === 1 && /RATINGS/.test(s3.flip) && s3.six === 0 && !s3.det && s3.instr >= 1 && s3.body && s3.ovr && s3.stars && s3.name === s1.name,
    'turned over: his spot\'s instructions (' + s3.instr + '), no ratings, his figure, name, rating and stars still on top, the button back to RATINGS');
  ok(s3.top === s1.top, 'the top of his card is the same on both sides, figure and all (' + s1.top + ')');
  ok(!s1.paged && !s3.paged && s1.fits && s3.fits && !s3.desc, 'his card never goes over pages, and its instructions are just the buttons: no heading, note or descriptions');
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
  await page.tap('.bpTopBack'); await page.waitForTimeout(80); await page.tap('#chCampus [data-bldg="club"]'); await page.waitForTimeout(120);
  await page.tap('#bpTabs .bpTab:text-is("Squad")'); await page.waitForTimeout(150); room.squad = await pads('#bpBody .sqPitch .ptk');
  await page.tap('.bpTopBack'); await page.waitForTimeout(80); await page.tap('#chCampus [data-bldg="train"]'); await page.waitForTimeout(120); await page.tap('#bpTabs .bpTab:text-is("Tactics")'); await page.waitForTimeout(150);
  const rm = Object.entries(room).map(([k, v]) => k + ' ' + v.n + ' men, ' + Math.round(v.top) + ' px over the number, ' + Math.round(v.bottom) + ' under the name').join('; ');
  ok(Object.values(room).every(v => v.n >= 5 && v.top >= 5 && v.bottom >= 2), 'room in every token: ' + rm);
  await page.tap('[data-tdrop="style"]'); await page.waitForTimeout(100);
  const opts = await page.$$eval('.tbMenu .tbOpt', ns => ns.map(n => ({ t: n.textContent, i: n.querySelectorAll('i').length }))), offMenu = await onScreen(page, ['.tbMenu .tbOpt']);
  ok(opts.length === 7 && opts.every(o => !o.i) && !offMenu.length, 'the style menu: seven names, no descriptions, all of it on the screen (' + opts.map(o => o.t).join(', ') + ')' + (offMenu.length ? ' -- ' + offMenu[0] : ''));
  await ctx.close(); }

// A NARROW PHONE (640x360): the bench on one line, each name inside its token and the number clear of the rating; and
// his card fits its box, every man's (his ratings with DEF open, his instructions), with the longest name put out of
// position: his name on one line, his rating amber, and no line of text saying so (nor "on the bench") -- Office and match
{ const ctx = await browser.newContext({ viewport: { width: 640, height: 360 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(); page.on('pageerror', e => rep.errs.push('PAGEERROR: ' + e.message));
  await page.goto('file://' + copy); await page.waitForTimeout(700); await newCareer(page);
  const ri = await page.evaluate(() => { const d = window.__MG.d, lu = d.lineup, on = new Set(lu.atk.concat([lu.gk]));
    const L = ['Kieran Whitlock', 'Tyrese Beaumont', 'Callum Oyelaran', 'Marco Devreese', 'Leo Ahlberg', 'Iker Castillo', 'Yuki Sandoval', 'Dani Bondarenko'];
    let k = 0; d.roster.forEach((p, i) => { if(!on.has(i) && k < L.length) p.name = L[k++]; });
    const f = lu.atk.find(i => d.roster[i].role === 'ATT') ?? lu.atk.find(i => d.roster[i].role !== 'DEF') ?? lu.atk[1], j = lu.atk.indexOf(f);   // a forward
    [lu.atk[0], lu.atk[j]] = [lu.atk[j], lu.atk[0]];                                                                                            // in the first spot: a defender's
    d.roster[f].name = 'Samuel Lindqvist'; d.roster[f].num = 23; d.lv.train = 4; window.__MG.mgSave(d); return f; });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.tap('#chCampus [data-bldg="train"]'); await page.waitForTimeout(150); await page.tap('#bpTabs .bpTab:text-is("Tactics")'); await page.waitForTimeout(150);
  const bench = await page.evaluate(() => { const T = [...document.querySelectorAll('#bpBody .tbBench .ptk')], hit = (a, b) => a.right > b.left + 0.5 && a.left < b.right - 0.5 && a.bottom > b.top + 0.5 && a.top < b.bottom - 0.5;
    return { n: T.length, rows: new Set(T.map(t => Math.round(t.getBoundingClientRect().top))).size,
      inside: T.every(t => { const r = t.getBoundingClientRect(), n = t.querySelector('.ptkName').getBoundingClientRect(); return n.left >= r.left - 0.5 && n.right <= r.right + 0.5; }),
      clear: T.every(t => !hit(t.querySelector('.ptkNo').getBoundingClientRect(), t.querySelector('.ptkOvr').getBoundingClientRect())) }; });
  ok(bench.n === 5 && bench.rows === 1 && bench.inside && bench.clear, 'a narrow phone (640x360): the bench on one line (its ' + bench.n + ' men), every name inside its token, the number clear of the rating');
  await page.tap(`#bpBody .tpitch .ptk[data-ri="${ri}"]`); await page.waitForTimeout(100);
  const said = () => page.evaluate(() => /out of position|on the bench|in reserve|subbed off/.test(document.querySelector('#cTacRight .tbCard').textContent));
  const head = await page.evaluate(() => { const h = document.querySelector('#cTacRight .mgCardHead'), nm = h.querySelector('.mgCardName'), fs = e => parseFloat(getComputedStyle(e).fontSize), o = h.querySelector('.mgCardOvr');
    return { name: nm.textContent, oneLine: nm.getBoundingClientRect().height < fs(nm) * 2, whole: nm.scrollWidth <= nm.clientWidth + 1, amber: /var\(--warn\)/.test(o.getAttribute('style') || '') }; });
  const oopSaid = await said(); await page.tap('#bpBody .tbBench .ptk >> nth=0'); await page.waitForTimeout(100); const benchSaid = await said();
  ok(head.oneLine && head.whole && head.amber && !oopSaid && !benchSaid, '...the longest name out of position: "' + head.name + '" whole on one line, his rating amber, and no line saying he\'s out of position (nor, for a man on the bench, that he\'s on it)');
  const fits = sel => page.evaluate(sel => { const b = document.querySelector(sel); return b.scrollHeight <= b.clientHeight + 1 && !b.querySelector('.fitPager'); }, sel);
  const walk = async (sel, toks) => { const n = await page.$$eval(toks, ns => ns.length), bad = []; let views = 0;
    for(let i = 0; i < n; i++){ await page.tap(`${toks} >> nth=${i}`); await page.waitForTimeout(60);
      if(await page.$(sel + ' [data-six="DEF"]')){ await page.tap(sel + ' [data-six="DEF"]'); await page.waitForTimeout(60); views++; if(!await fits(sel)) bad.push(i + ' DEF'); await page.tap(sel + ' [data-six="DEF"]'); await page.waitForTimeout(40); }
      const fl = await page.$(sel + ' button[data-cside="instr"]'); if(fl){ await fl.tap(); await page.waitForTimeout(60); views++; if(!await fits(sel)) bad.push(i + ' instr'); await page.tap(sel + ' button[data-cside="rate"]'); await page.waitForTimeout(40); } }
    return { n, views, bad }; };
  const wo = await walk('#cTacRight', '#bpBody .tpitch .ptk[data-tac]');
  await page.tap('.bpTopBack'); await page.waitForTimeout(100);
  for(let i = 0; i < 8; i++){ const nd = await page.$('#chBottom [data-mg="forward"]'); if(!nd) break; await nd.tap(); await page.waitForTimeout(100); }
  await page.tap('#chBottom [data-mg="play"]'); await page.waitForTimeout(1200);
  const hw = await hudWin(page);
  ok(winOk(hw, true), '...in a match, your man\'s window at the top right beside the menu, his name whole (' + hw.num + ' ' + hw.name + ' ' + hw.pos + ')' + (winOk(hw, true) ? '' : ' ' + JSON.stringify(hw)));
  await page.evaluate(() => document.getElementById('menuBtn').click()); await page.waitForTimeout(150);
  await page.tap('#pauseGrid [data-pause="tactics"]'); await page.waitForTimeout(200);
  const wm = await walk('#mtacOv .tbRight', '#mtacOv .tpitch .ptk');
  const lg = await legsRow(page, '#mtacOv .tbRight'), mp = await apart(page, '#mtacOv .tpitch');
  ok(lg.text === 'STAMINA' && !lg.pct && lg.bar != null && Math.abs(lg.bar - lg.flip) <= 1 && mp.n === 8 && !mp.over && !mp.out,
    '...in a match his card: STAMINA and a bar, no figure, the button level with its foot (' + lg.bar + ' / ' + lg.flip + '); the match\'s pitch: nobody overlaps or hangs off it');
  ok(wo.views >= 14 && wm.views >= 14 && !wo.bad.length && !wm.bad.length, '...and every man\'s card fits its box, DEF open and his instructions: ' + wo.views + ' views in the Office, ' + wm.views + ' in a match' + (wo.bad.length || wm.bad.length ? ' -- over: ' + wo.bad.concat(wm.bad).join(', ') : ''));
  await ctx.close(); }

// A MAN'S CARD IN A BUILDING (the squad, the market, the academy) never goes over pages, either side -- his ratings (a
// category open) or his deal -- and has no long text on it; and a full squad's bench is its five on one line, the pitch
// keeping its height, with everyone in the Selection tab's three columns, all on the screen -- on the shortest phone
// (844x340) and the narrowest (640x360)
for(const [w, h] of [[844, 340], [640, 360]]){
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(); page.on('pageerror', e => rep.errs.push('PAGEERROR: ' + e.message));
  await page.goto('file://' + copy); await page.waitForTimeout(700); await newCareer(page);
  const R = await page.evaluate(() => { const d = window.__MG.d, R = d.roster, other = Object.values(d.world.clubs).filter(c => c.id !== d.clubId);
    d.listed[R[3].id] = 900; d.offers = d.offers || []; d.offerSeq = d.offerSeq || 0;   // a man listed, a man with three bids, the longest name
    for(const [k, fee] of [[0, 12500], [1, 9800], [2, 9000]]) d.offers.push({ id: ++d.offerSeq, pid: R[5].id, club: other[k].id, fee });
    R[0].name = 'Samuel Lindqvist'; window.__MG.mgSave(d); return R.map(p => String(p.id)); });
  const card = () => page.evaluate(() => { const P = document.querySelector('.mgPaneR .mgPaneScroll'), c = P && P.querySelector('.mgCard');
    return { fits: !!P && P.scrollHeight <= P.clientHeight + 1 && P.scrollWidth <= P.clientWidth + 1, paged: !!(P && P.querySelector('.fitPager')), flips: c ? c.querySelectorAll('.cardFlip').length : 0,
      long: c ? [...c.querySelectorAll('.mgHint')].concat([...c.querySelectorAll('*')].filter(e => !e.closest('.mgCardHead') && !e.children.length && e.textContent.trim().length > 32)).map(e => e.textContent.trim().slice(0, 40)) : ['no card'],
      cut: c ? [...c.querySelectorAll('.mgFact b')].filter(b => b.scrollWidth > b.clientWidth + 1).map(b => b.textContent) : [] }; });
  const views = [], bad = [];
  const walk = async (bldg, tab, pids) => { await page.tap(`#chCampus [data-bldg="${bldg}"]`); await page.waitForTimeout(150); await page.tap(`#bpTabs .bpTab:text-is("${tab}")`); await page.waitForTimeout(150);
    const ids = pids || await page.$$eval('.mgPaneL .mgRow:not(.fitHide)', ns => ns.slice(0, 3).map(n => n.dataset.pid));
    for(const id of ids){ await page.evaluate(id => document.querySelector(`.mgPaneL .mgRow[data-pid="${id}"]`).click(), id); await page.waitForTimeout(80);
      for(const side of ['rate', 'deal']){ const fl = await page.$(`.mgPaneR [data-mside="${side}"]`); if(fl){ await fl.tap(); await page.waitForTimeout(60); }
        const r = await card(); views.push(r); if(!r.fits || r.paged || r.long.length || r.cut.length || r.flips !== 1) bad.push(tab + ' ' + side + ' ' + JSON.stringify(r));
        if(side === 'rate' && await page.$('.mgPaneR [data-six="DEF"]')){ await page.tap('.mgPaneR [data-six="DEF"]'); await page.waitForTimeout(60);
          const r2 = await card(); views.push(r2); if(!r2.fits || r2.paged) bad.push(tab + ' DEF open'); await page.tap('.mgPaneR [data-six="DEF"]'); await page.waitForTimeout(40); } } }
    await page.tap('.bpTopBack'); await page.waitForTimeout(100); };
  await page.evaluate(() => { const M = window.__MG, d = M.d; d.budget = 1e7; d.top = 4; while(M.lvOf(d, 'club') < 3) M.bldUp(d, 'club');   // (on the market, and the academy, to look at its prospects)
    M.bldUp(d, 'market'); M.bldUp(d, 'academy'); d.lv.train = 4; d.budget = 1e6; M.mgSave(d); M.renderHub(); });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await walk('club', 'Squad', [R[0], R[3], R[5]]); await walk('market', 'Selling', [R[3], R[5]]); await walk('market', 'Search'); await walk('market', 'Free agents'); await walk('academy', 'Prospects');
  ok(views.length >= 20 && !bad.length, w + 'x' + h + ': a man\'s card in a building never goes over pages, either side, no long text on it, no fact cut short (' + views.length + ' views: the squad, selling with three bids, the market, free agents, the academy)' + (bad.length ? ' -- ' + bad.slice(0, 2).join(' | ') : ''));
  await page.tap('#chCampus [data-bldg="train"]'); await page.waitForTimeout(150); await page.tap('#bpTabs .bpTab:text-is("Tactics")'); await page.waitForTimeout(200);
  const pitch0 = await page.$eval('#bpBody .tpitch', e => Math.round(e.getBoundingClientRect().height));
  const grow = n => page.evaluate(n => { const d = window.__MG.d; let id = 990000 + d.roster.length; while(d.roster.length < n){ const p = JSON.parse(JSON.stringify(d.roster[d.roster.length % 14])); p.id = ++id; p.num = d.roster.length + 1; d.roster.push(p); d.lineup.bench.push(d.roster.length - 1); } window.__MG.mgSave(d); }, n);
  const redraw = async () => { await page.tap('#bpTabs .bpTab:text-is("Pitch")'); await page.waitForTimeout(120); await page.tap('#bpTabs .bpTab:text-is("Tactics")'); await page.waitForTimeout(250); };
  const bs = () => page.evaluate(() => { const B = document.querySelector('#bpBody .tbBench'), vis = [...B.querySelectorAll('.ptk')].filter(t => t.getClientRects().length), pg = B.querySelector('.benchPg');
    return { men: B.querySelectorAll('.ptk').length, rows: new Set(vis.map(t => Math.round(t.getBoundingClientRect().top))).size, pager: pg && pg.getClientRects().length ? pg.textContent : '',
      pitch: Math.round(document.querySelector('#bpBody .tpitch').getBoundingClientRect().height) }; });
  // ...and the Selection tab: the whole squad, a bar a man in three columns (the eight, the bench, the rest), no faces,
  // every bar the same height, all of them on the screen
  const sel = async () => { await page.tap('#bpTabs .bpTab:text-is("Selection")'); await page.waitForTimeout(200);
    const o = await page.evaluate(() => { const C = [...document.querySelectorAll('#bpBody .selCol')], rows = [...document.querySelectorAll('#bpBody .selRow')], hs = rows.map(r => r.getBoundingClientRect().height);
      return { cols: C.map(c => c.dataset.grp + ' ' + c.querySelectorAll('.selRow').length).join(', '), order: rows.map(r => +r.dataset.k).every((k, i) => k === i), imgs: document.querySelectorAll('#bpBody .selB img').length,
        h: [Math.round(Math.min(...hs)), Math.round(Math.max(...hs))], inside: rows.every(r => { const b = r.getBoundingClientRect(); return b.top >= 0 && b.bottom <= innerHeight && b.left >= 0 && b.right <= innerWidth; }) }; });
    await page.tap('#bpTabs .bpTab:text-is("Tactics")'); await page.waitForTimeout(200); return o; };
  await grow(20); await redraw(); const f = await bs(), s20 = await sel();   // a full squad: eight on the pitch, the bench's five, seven not taken
  ok(f.men === 5 && f.rows === 1 && !f.pager && f.pitch === pitch0 && s20.cols === 'xi 8, bench 5, rest 7' && s20.order && !s20.imgs && s20.h[0] === s20.h[1] && s20.h[0] >= 20 && s20.inside,
    w + 'x' + h + ': a full squad of 20: under the pitch just the bench\'s five, on one line with no pager, the pitch keeping its height (' + f.pitch + ' px); the Selection tab has all twenty, '
    + s20.cols + ', in order, no faces, every bar ' + s20.h[0] + ' px tall and on the screen');
  await grow(22); await redraw(); const b1 = await bs(), s22 = await sel();   // (a squad from before the limit)
  ok(b1.men === 5 && b1.rows === 1 && !b1.pager && b1.pitch === pitch0 && s22.cols === 'xi 8, bench 5, rest 9' && s22.order && s22.h[0] === s22.h[1] && s22.h[0] >= 18 && s22.inside,
    w + 'x' + h + ': a squad of 22 from before: still just the five under the pitch; the Selection tab\'s rest nine long, its bars ' + s22.h[0] + ' px, all on the screen');
  await ctx.close(); }

// AS WIDE AS THE PHONE: no bands -- the game screen is the screen, wider than 920 (more pitch across); the buttons
// stand over its bottom-right corner where they always did, the stick starts anywhere on the left, and the HUD is
// the score, the way you're kicking, the clock, your man's window and the menu
{ const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(); page.on('pageerror', e => rep.errs.push('PAGEERROR: ' + e.message));
  await page.goto('file://' + copy); await page.waitForTimeout(700);
  await page.tap('#smItems [data-act="exhibition"]'); await page.waitForTimeout(250); await page.tap('#exhGo'); await page.waitForTimeout(1200);
  const g = await page.evaluate(() => { const s = document.getElementById('stageWrap').getBoundingClientRect(), c = document.getElementById('c'), b = ['kickBtn','shootBtn','crossBtn','skillBtn'].map(id => document.getElementById(id).getBoundingClientRect());
    return { left: s.left, width: s.width, height: s.height, W: c.width, inside: b.every(r => r.left >= s.left && r.right <= s.right + 1 && r.bottom <= s.bottom + 1 && r.left > s.left + s.width * 0.6 && r.top > s.top + s.height * 0.35),
      chips: [...document.querySelectorAll('#readout .chip')].filter(e => getComputedStyle(e).display !== 'none').map(e => e.id || e.textContent.trim().slice(0, 6)) }; });
  ok(g.left === 0 && Math.abs(g.width - 844) < 1 && Math.abs(g.height - 390) < 2 && g.W > 1100, 'the game fills the phone: ' + Math.round(g.width) + 'x' + Math.round(g.height) + ', ' + g.W + ' wide inside (no bands)');
  ok(g.inside, 'the buttons stand over the bottom-right corner of the pitch, as they did before the bands');
  ok(g.chips.length === 6 && g.chips[0] === 'rScore' && g.chips[1] === 'rDir' && g.chips[3] === 'qsBtn' && g.chips[4] === 'rPlayer' && g.chips[5] === 'menuBtn', 'the HUD: score, direction, clock, quick subs, your man\'s window, menu -- no ball speed, possession or touch grade (' + g.chips.join(' ') + ')');
  const e1 = await hudWin(page);
  ok(winOk(e1, false), 'an exhibition: his window says who he is -- a club\'s man has only his surname, so he\'s given a first name (' + e1.num + ' ' + e1.name + ' ' + e1.pos + ')' + (winOk(e1, false) ? '' : ' ' + JSON.stringify(e1)));
  // (looked at two frames on: a tired man standing gets it back quickly, and the game soon switches you to whoever's best placed)
  await page.evaluate(() => new Promise(res => { const T = window.__T, c = T.controlled(), q = T.players().find(p => p.team === c.team && p !== c && p.pname !== c.pname);
    T.setControlled(q); q.stamina = 0.2; q.stars = 1; requestAnimationFrame(() => requestAnimationFrame(res)); }));
  const e2 = await hudWin(page);
  ok(winOk(e2, false) && e2.name !== e1.name && e2.cSt < 0.3 && /--bad/.test(e2.col), 'switch to another man and the window\'s his: ' + e2.num + ' ' + e2.name + ', one star lit, his stamina a fifth full and red (' + Math.round(e2.fill * 100) + '%)' + (winOk(e2, false) ? '' : ' ' + JSON.stringify(e2)));
  const cdp = await ctx.newCDPSession(page), touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 3 }] });
  await page.evaluate(() => window.__T.clear());   // (their men sent off up the pitch: it's the stick on trial, not whether he's tackled)
  const x0 = 70, c0 = await page.evaluate(() => window.__T.controlled().x), t0 = await page.evaluate(() => window.__T.sim());
  await touch('touchStart', x0, 230); for(let i = 1; i <= 6; i++){ await touch('touchMove', x0 + i * 8, 230); await page.waitForTimeout(40); }
  for(let i = 0; i < 100 && await page.evaluate(t => window.__T.sim() - t < 0.75, t0); i++) await page.waitForTimeout(50);   // (held for 0.75 s of play, however busy the machine)
  const c1 = await page.evaluate(() => window.__T.controlled().x); await touch('touchEnd', x0, 230);
  ok(Math.abs(c1 - c0) > 30, 'a thumb on the left of the screen drives your man (' + Math.round(c1 - c0) + ' px)');
  // a tap on the grass on the right (off the buttons) doesn't switch you; a tap on one of your men does. (The game runs
  // on between finding the spot and the tap landing: on a busy machine a man can run off his spot, or onto the grass,
  // in between -- so each is tried afresh up to three times. Every tap on the grass switching, or none on a man, fails.)
  const who = () => page.evaluate(() => window.__T.controlled().num);
  let grass = null, n0 = null, n1 = null, mate = null, n2 = null;
  for(let k = 0; k < 3 && !(grass && n1 === n0); k++){
    grass = await page.evaluate(() => { const T = window.__T; T.theirBall(); for(let y = 70; y <= 200; y += 10) for(let x = 470; x <= 760; x += 10) if(!T.mateAt(x, y) && !document.elementFromPoint(x, y).closest('.actBtn,#menuBtn,.chip')) return { x, y }; return null; });
    if(!grass) break; n0 = await who(); await touch('touchStart', grass.x, grass.y); n1 = await who(); await touch('touchEnd', grass.x, grass.y); }
  for(let k = 0; k < 3 && !(mate && n2 === mate.num); k++){
    mate = await page.evaluate(() => { const T = window.__T; T.theirBall(); const c = T.controlled(); for(const q of T.players()){ if(q.team !== c.team || q === c || q.role === 'G') continue; const s = T.scr(q); if(s.x > 20 && s.x < 440 && s.y > 60 && s.y < 330 && T.mateAt(s.x, s.y) === q) return { num: q.num, x: s.x, y: s.y }; } return null; });
    if(!mate) break; await touch('touchStart', mate.x, mate.y); n2 = await who(); await touch('touchEnd', mate.x, mate.y); }
  ok(grass && n1 === n0 && mate && n2 === mate.num, 'a tap on the grass doesn\'t switch you (#' + n0 + ' still); a tap on one of your men does (#' + n2 + ')');
  await ctx.close(); }

process.exitCode = rep.finish();
await browser.close();
