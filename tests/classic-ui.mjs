// FOOTBALL CLASSIC ON A PHONE, LANDSCAPE: every screen fits -- its title, tabs and main buttons on the screen at
// 844x390, 844x340 (Safari's bar showing) and 667x375 (an iPhone SE) -- and nothing scrolls but a list of players (v171:
// swiped, its filters and count fixed over it, N MORE at its foot): what else doesn't fit goes over pages (◀ 1 / 3 ▶): the start menu, Settings (a player's settings only: the feel dials are the game's own, a
// developer's with ?dev), SKILL MOVES (every move over pages, its name whole, its drawing drawn and its clip playing; from
// the pause menu too, the match waiting while it's open), the exhibition setup, a new career (Start on screen), the hub,
// every building's tabs (the Selection tab's bars too), the market's list and the squad's (25 men, every one reached by a finger), the tactics, the pause menu and the match's tactics, the match report. The menus are framed in pixels
// (a dark outline, a light rim, rounded corners), in four colour schemes. A finger that moves on a man lifts him at once
// (a tap just shows his card) and the stand-in follows it from where he was picked up; the men on the tactics pitch show
// their faces (the bench doesn't), his card has two sides (his ratings, all of him; his spot's instructions), and the
// other phase's shape is a small name box off each spot's corner; each man's number and name sit in his token with room
// round them, clear of its edges. The width shows on the pitch (a four across the middle spreads from COMPACT to WIDE)
// and no man covers another or hangs off it, at every size; in a match (v243) TACTICS is the field and the tactics, no
// man's card and no bench, and PLAYER SWAP the bench under the field, the man coming off and the man going on each with
// his STAMINA as a bar, no figure, their six face to face. On a narrow phone (640x360) the bench stays on one line and every man's card fits. The
// game is as wide as the phone: no bands, the buttons over the pitch's corner, the HUD just the score, the clock, your
// man's window (his number, full name and position, his stamina and skill stars: top right beside the menu, at every
// size) and the menu.
import { chromium } from 'playwright';
import { reporter, STAR, pileAside } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={ctlShow:o=>ctlShow(o), ctlHide:()=>ctlHide(), controlled:()=>controlled, players:()=>players, setControlled, sim:()=>simNow, mateAt:(x,y)=>mateAtClient(x,y), scr:q=>{ const s=proj(q.x,q.y,PLAYER_H*0.45), r=rect(); return {x:r.left+s.x*r.width/W, y:r.top+s.y*r.height/H}; }, theirBall:()=>{ const o=players.find(p=>p.team!==controlled.team&&p.role!==\'G\'); own(o,o.r+ball.r+5); }, camX:()=>camX, shirt:t=>shirtCol(t), sides:(g,r)=>{ if(g){ EXH.play.you=g; EXH.play.opp=r; setTeamsFromClubs(); } return [EXH.play.you,EXH.play.opp]; }, clear:()=>{ for(const p of players) if(p.team!==controlled.team){ p.x=FW-60; p.vx=p.vy=0; } }, end:()=>{ if(careerFix) finishCareerMatch(careerFix); }};\n  const LAB_TITLE=');
patch('  let INJ_OFF=false;', '  let INJ_OFF=true;');   // (injuries off: a man hurt in a match would change who plays -- manager-injury.mjs is injuries' test)
patch('  // ===== END MANAGER CAREER', '  window.__MG={get d(){ return CAREER&&CAREER.data; }, setPref, bldUp, mgMarketOpen, lvOf, mgForward, mgPlayGame, mgWindowOpen, mgSave, renderHub, STYLES, setCareerForm, FORMS, ATK_ONLY, DEF_ONLY, mgNewPlayer};\n  // ===== END MANAGER CAREER');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-ui-')), 'classic.html');
writeFileSync(copy, src);

const rep = reporter(), { ok, info } = rep;
const browser = await chromium.launch();
const SIZES = [[844, 390], [844, 340], [667, 375]];

// on screen: every one of these is wholly inside the viewport (and the page itself doesn't scroll) -- and NOTHING
// scrolls: no box on the screen can be scrolled, and a box too short for what's in it is over pages, nothing cut off
// (v171: but a list of players, .plPane, is the one box that scrolls -- swiped, never paged)
async function onScreen(page, sels){ return page.evaluate(sels => { const W = innerWidth, H = innerHeight, out = [];
  for(const s of sels) for(const el of document.querySelectorAll(s)){ const cs = getComputedStyle(el); if(cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect(); if(r.width < 1 || r.height < 1) continue;
    if(r.left < -1 || r.top < -1 || r.right > W + 1 || r.bottom > H + 1) out.push(s + ' at ' + [r.left, r.top, r.right, r.bottom].map(Math.round).join(',')); }
  const se = document.scrollingElement; if(se.scrollHeight > H + 1) out.push('the page scrolls (' + se.scrollHeight + ')');
  const shown = el => { for(let e = el; e && e !== document.body; e = e.parentElement){ const c = getComputedStyle(e); if(c.display === 'none' || c.visibility === 'hidden') return false; } return el.getClientRects().length > 0; };
  for(const el of document.querySelectorAll('body *')){ const cs = getComputedStyle(el);
    if((/auto|scroll/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 1 && !el.classList.contains('plPane') && !el.classList.contains('setScroll') || /auto|scroll/.test(cs.overflowX) && el.scrollWidth > el.clientWidth + 1) && shown(el))
      out.push('a box scrolls: ' + (el.id || el.className)); }
  for(const el of document.querySelectorAll('[data-pages]')){ if(!shown(el)) continue;   // (v248: a box marked fitOut has its pager under it -- that's all that may hang below it)
    const pg = el.classList.contains('fitOut') ? el.querySelector(':scope > .fitPager') : null, under = pg ? Math.max(0, pg.offsetTop + pg.offsetHeight - el.clientHeight) : 0;
    if(el.scrollHeight > el.clientHeight + under + 2) out.push('cut off, not paged: ' + el.dataset.pages + ' ' + el.scrollHeight + '/' + el.clientHeight); }
  return out; }, sels); }
// NO MAN COVERS ANOTHER on a tactics pitch, and none hangs off it -- and how far its midfield spreads, top to bottom
const apart = (page, sel) => page.evaluate(sel => { const P = document.querySelector(sel), pr = P.getBoundingClientRect(), T = [...P.querySelectorAll('.ptk')].map(e => e.getBoundingClientRect());
  let over = 0, out = 0; for(let i = 0; i < T.length; i++){ const a = T[i]; out = Math.max(out, pr.left - a.left, a.right - pr.right, pr.top - a.top, a.bottom - pr.bottom);
    for(let j = i + 1; j < T.length; j++){ const b = T[j]; if(Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0.5 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0.5) over++; } }
  const M = [...P.querySelectorAll('.ptk[data-role="MID"]')].map(e => e.getBoundingClientRect());
  return { n: T.length, over, out: Math.round(out), span: M.length ? Math.round(Math.max(...M.map(r => r.right)) - Math.min(...M.map(r => r.left))) : 0 }; }, sel);   // (span: the midfield across the upright pitch, v226)
// YOUR MAN'S WINDOW in a match, top right beside the menu: what it says (his number, name, position, how many of its
// stars are lit, how far its stamina bar is filled) against the man you control, and where it sits among the HUD's chips
const hudWin = page => page.evaluate(() => { const c = window.__T.controlled(), R = e => e.getBoundingClientRect(), W = R(document.getElementById('rPlayer')), M = R(document.getElementById('menuBtn')), S = R(document.getElementById('stageWrap'));
  const nm = document.getElementById('rpName'), st = document.querySelector('#rpStars .stars'), fill = document.getElementById('rpSt'), chips = [...document.querySelectorAll('#readout .chip')].filter(e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden').map(R);
  const over = chips.some((a, i) => chips.some((b, j) => j > i && a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5));
  return { num: document.getElementById('rpNum').textContent, name: nm.textContent, pos: document.getElementById('rpPos').textContent, lit: st ? st.textContent.length - (st.querySelector('i') ? st.querySelector('i').textContent.length : 0) : -1,
    fill: +(R(fill).width / R(fill.parentElement).width).toFixed(3), col: fill.style.background, cNum: c.num, cName: c.pname, cUniq: !!c.uniq, cStars: c.stars, cSt: +c.stamina.toFixed(3),
    cut: nm.scrollWidth > nm.clientWidth, top: Math.round(W.top - S.top), gap: Math.round(M.left - W.right), level: Math.abs(W.top - M.top) < 1 && Math.abs(W.bottom - M.bottom) < 1, inside: W.left >= S.left && M.right <= S.right, over }; });
const ini = n => n.includes(' ') ? n[0] + '. ' + n.slice(n.indexOf(' ') + 1) : n;   // (v228: a name too long for the narrower window has his first name's initial)
const winOk = (v, full) => v.num === '#' + v.cNum && (full || v.cUniq || /\s/.test(v.cName) ? v.name === v.cName || v.name === ini(v.cName) : v.name.split(' ').length === 2 && v.name.endsWith(' ' + v.cName))   // (v201: a man with a first name already -- a star's -- shown as he is; v202: a star with one name too) && v.pos.length >= 2 && v.lit === Math.max(1, Math.min(5, v.cStars || 1))
  && Math.abs(v.fill - v.cSt) <= 0.02 && !v.cut && v.top <= 12 && v.gap >= 0 && v.gap <= 12 && v.level && v.inside && !v.over;
// INSTRUCTIONS up in a tactics screen's top row (v116: not on his card): lit or not, and just left of BEST 9 where there's one
const insTop = (page, root) => page.evaluate(root => { const i0 = document.querySelector(root + ' .tbTop .tbIns'), top = (i0 && i0.closest('.tbTop')) || document.querySelector(root + ' .tbTop'), b = top && top.querySelector('.tbIns'),   /* (v260: the row INSTRUCTIONS shares with BEST 9) */ bs = top && top.querySelector('.tbBest'), r = b && b.getBoundingClientRect();
  return { there: !!b, lit: !!(b && b.classList.contains('go')), text: b ? b.textContent : '', inside: !!r && r.right <= innerWidth && r.left >= 0,
    left: !!b && (!bs || (b.nextElementSibling === bs && r.right <= bs.getBoundingClientRect().left && Math.abs(r.top - bs.getBoundingClientRect().top) < 2)) }; }, root);
// THE SKILL MOVES PAGE as it is on the screen: each page's moves (▶ to the next), any whose name or card is cut off, and
// whether each move showing has its drawing drawn and its clip moving
async function skillsPage(page){   // (v246: as its template -- the moves as rows on the right, the one picked drawn and playing on the left)
  const all = await page.evaluate(() => [...document.querySelectorAll('#skList .skRow')].map(r => r.dataset.skpick));
  const cut = await page.evaluate(() => [...document.querySelectorAll('#skList .skRow')].filter(r => { const n = r.querySelector('.skName'), q = r.getBoundingClientRect(), L = r.closest('.skList').getBoundingClientRect();
    return n.scrollWidth > n.clientWidth + 1 || r.scrollWidth > r.clientWidth + 1 || q.bottom > L.bottom + 1 || q.top < L.top - 1; }).map(r => r.dataset.skpick));
  const seen = [];
  for(const k of all){ await page.evaluate(k => document.querySelector('#skList [data-skpick="' + k + '"]').click(), k); await page.waitForTimeout(40);
    seen.push(await page.evaluate(k => { const c = document.querySelector('#skGrid .skCard'), on = document.querySelector('#skList .skRow.on'); return c && on && c.dataset.sk === k && on.dataset.skpick === k ? k : '-'; }, k)); }
  const px = () => page.evaluate(() => [...document.querySelectorAll('#skGrid .skCard')].filter(c => c.getClientRects().length).map(c => {
    const sum = cv => { const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let h = 0, n = 0; for(let i = 0; i < d.length; i += 4){ h = (h * 31 + d[i] + d[i + 1] * 3 + d[i + 2] * 7) >>> 0; if(d[i + 3]) n++; } return [h, n]; };
    return { drawn: sum(c.querySelector('.skDraw'))[1], clip: sum(c.querySelector('.skClip'))[0] }; }));
  await page.waitForFunction(() => [...document.querySelectorAll('#skGrid .skCard')].filter(c => c.getClientRects().length).every(c => c.querySelector('.skDraw').dataset.drawn), null, { timeout: 1500 }).catch(() => {});
  const a = await px(); await page.waitForTimeout(450); const b = await px();
  return { all, seen, cut, pages: 1, drawn: a.length === 1 && a.every(x => x.drawn > 50), moving: a.some((x, i) => b[i] && x.clip !== b[i].clip) }; }
async function newCareer(page){
  await page.tap('#smItems [data-act="new"]'); await page.waitForTimeout(200); await page.tap('#newSlotList .slotBtn >> nth=1'); await page.waitForTimeout(300);
  await page.fill('#mgName', 'Sam Okafor'); await page.fill('#mgClubIn', 'Fenmoor Athletic'); await page.evaluate(()=>{ for(let i=0;i<3;i++){ const g=document.getElementById('mgGo'), m=document.getElementById('mgrMaker'); if(!g||!m||!m.classList.contains('on')||g.disabled) break; g.click(); } })   /* (v242: NEXT, NEXT, START CAREER) */; await page.waitForSelector('#careerHub.show', { timeout: 6000 });
  await page.evaluate(() => { const d = __MG.d; d.story = { vet: 2, kid: 2, phone: 2 }; __MG.mgSave(d); __MG.renderHub(); }); }   // (the first season's two arrivals: manager-career's)

for(const [w, h] of SIZES){
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true }); await ctx.addInitScript(STAR);
  const page = await ctx.newPage(); await pileAside(page); page.on('pageerror', e => rep.errs.push('PAGEERROR: ' + e.message));
  await page.goto('file://' + copy); await page.waitForTimeout(700);
  const fails = [], check = async (what, sels) => { const bad = await onScreen(page, sels); if(bad.length) fails.push(what + ': ' + bad.slice(0, 2).join('; ')); };
  await check('start menu', ['#smItems .smBtn']);
  const footOnTitle = await page.evaluate(() => [...document.querySelectorAll('.cfFoot')].filter(f => f.getClientRects().length).length);   // (v225: the footer's the career's alone)
  await page.tap('#smItems [data-act="settings"]'); await page.waitForTimeout(150);
  await check('settings', ['#settingsOverlay .tplTitle', '#setRows .setOpt', '[data-setclose]']);
  if(w === 844 && h === 390){
    const st = await page.evaluate(() => ({ rows: [...document.querySelectorAll('#setRows .setLbl')].map(e => e.firstChild.textContent), dials: document.querySelectorAll('#settingsOverlay .dial').length,
      dev: document.querySelector('[data-setdev]').getClientRects().length ? 'shown' : 'none' }));   // (v246: its row hidden, not the button)
    ok(String(st.rows) === 'MATCH LENGTH,CAMPUS MENU,HALF-TIME,TIPS' && st.dials === 0 && st.dev === 'none', 'Settings: a player\'s settings only (' + st.rows.join(', ') + '), no feel dials -- and no DIFFICULTY (v228: CHAMPION), no EXHIBITION OPPONENTS, GRAPHICS or TEXT SIZE (v242)');
    // (v136) MATCH LENGTH: 4 minutes unless you pick another (it was 3) -- and a 3 kept from before, picked or not, is the
    // new 4, where a 3 picked from now on stays 3
    const mlOn = pg => pg.evaluate(() => { const r = [...document.querySelectorAll('#setRows .setRow')].find(x => /MATCH LENGTH/.test(x.textContent)), on = r && r.querySelector('.setOpt.on'); return on ? on.textContent : null; });
    const fresh = await mlOn(page);
    const keptAs = async o => { const c = await browser.newContext({ viewport: { width: 1100, height: 800 } }); await c.addInitScript(o => { try{ localStorage.setItem('ftc_prefs', JSON.stringify(o)); }catch(e){} }, o);
      const pg = await c.newPage(); await pg.goto('file://' + copy); await pg.waitForTimeout(500); await pg.click('#smItems [data-act="settings"]'); await pg.waitForTimeout(150); const v = await mlOn(pg); await c.close(); return v; };
    const old3 = await keptAs({ halfMin: 3, diff: 'star' }), new3 = await keptAs({ halfMin: 3, diff: 'star', pv: 1 }), old5 = await keptAs({ halfMin: 5, diff: 'star' });
    ok(fresh === '4 MIN' && old3 === '4 MIN' && new3 === '3 MIN' && old5 === '5 MIN', `MATCH LENGTH: 4 minutes unless you pick another (${fresh}); a 3 kept from before is the new 4 (${old3}), one picked since stays (${new3}), a 5 kept as it was (${old5}) (v136)`);
    const frame = await page.$eval('#settingsOverlay .setBox', e => getComputedStyle(e).boxShadow);   // (v246: settings a page as its template, its list in a box)
    const radius = await page.$eval('#settingsOverlay .setBox', e => parseFloat(getComputedStyle(e).borderTopLeftRadius));
    const btnR = await page.$eval('#setRows .setOpt', e => parseFloat(getComputedStyle(e).borderTopLeftRadius));
    const fill = await page.$eval('#settingsOverlay .setBox', e => getComputedStyle(e).backgroundColor);
    // (v240: as the match screen's boxes -- a dark outline, one thin light rim, a dark see-through fill, 6 px corners; 10 before, and a second, darker rim)
    ok(/11, 15, 30/.test(frame) && /230, 238, 255/.test(frame) && !/127, 147, 196/.test(frame) && /rgba\(20, 26, 44, 0\.9\)/.test(fill) && radius === 6 && btnR >= 3, 'the menus are boxed as the match screen\'s: a dark outline, one thin light rim, a dark see-through fill, rounded corners (' + radius + ' / ' + btnR + ' px; ' + fill + ')');
    // (v221) ONE COLOUR SCHEME: no COLOURS row, no other scheme in the stylesheet, and a pick saved from before (RUBY) opens in BLUE
    const one = await page.evaluate(() => { let rules = 0; for(const sh of document.styleSheets){ let rs; try{ rs = sh.cssRules; }catch(e){ continue; } for(const r of rs) if(r.selectorText && /data-theme/.test(r.selectorText)) rules++; }
      return { opts: document.querySelectorAll('#setRows [data-pref="theme"]').length, rules, font: getComputedStyle(document.querySelector('#setRows .setOpt')).fontFamily }; });
    const was = await browser.newContext({ viewport: { width: 1100, height: 800 } }); await was.addInitScript(() => { try{ localStorage.setItem('ftc_prefs', JSON.stringify({ theme: 'ruby', diff: 'star', pv: 1 })); }catch(e){} });
    const wp = await was.newPage(); await wp.goto('file://' + copy); await wp.waitForTimeout(500);
    const kept = await wp.evaluate(() => ({ theme: document.documentElement.dataset.theme || '', btn: getComputedStyle(document.querySelector('#smItems .smBtn:not(.sel)')).backgroundImage })); await was.close();
    ok(one.opts === 0 && one.rules === 0 && kept.theme === '' && /106, 168, 248/.test(kept.btn), 'one colour scheme: no COLOURS in Settings, no other scheme in the page, and a RUBY picked before opens in BLUE (' + kept.btn.slice(0, 48) + ')');
    // (v222) THE TITLE PAGE'S PICTURE: a stadium behind the start menu, under a wash of the screen colour; the picture decodes;
    // no other screen has it
    const tp = await page.evaluate(async () => { const c = getComputedStyle(document.getElementById('startMenu')), m = c.backgroundImage.match(/url\("?(data:image\/webp;base64,[^")]+)/);
      const dims = m ? await new Promise(res => { const i = new Image(); i.onload = () => res([i.naturalWidth, i.naturalHeight]); i.onerror = () => res(null); i.src = m[1]; }) : null;
      const plain = ['exhPanel', 'careerHub', 'settingsOverlay', 'newPanel'].every(id => { const n = document.getElementById(id); return !n || !/url\(/.test(getComputedStyle(n).backgroundImage); });
      return { wash: /rgba\(18, 26, 51, 0\.62\)/.test(c.backgroundImage), size: c.backgroundSize, dims, plain }; });
    ok(tp.wash && tp.dims && tp.dims[0] === 1672 && tp.dims[1] === 941 && /cover/.test(tp.size) && tp.plain, 'the title page has its stadium picture, the Studio\'s since v227 (' + (tp.dims || ['none']).join(' x ') + '), filling the screen under a wash of the screen colour, and no other screen has it (v222)');
    // (v223) THE TITLE IS THE LOGO: Fulltime 9's logo where the words were, as tall as there's room for, above the menu and never
    // on it, and the whole menu on the screen -- the shortest phone, an iPhone 15, and a Pro Max (whose menu ran off the bottom)
    const logoAt = async (w, h) => { const c = await browser.newContext({ viewport: { width: w, height: h } });
      await c.addInitScript(() => { try{ localStorage.setItem('ftc_prefs', JSON.stringify({ diff: 'star', pv: 1 })); }catch(e){} });
      const pg = await c.newPage(); await pg.goto('file://' + copy); await pg.waitForTimeout(600);
      const r = await pg.evaluate(() => { const img = document.querySelector('#startMenu .smLogo img'); if(!img) return null; const b = img.getBoundingClientRect();
        const btns = [...document.querySelectorAll('#smItems .smBtn')].filter(x => x.offsetParent).map(x => x.getBoundingClientRect());
        return { nat: [img.naturalWidth, img.naturalHeight], alt: img.alt, top: b.top, bottom: b.bottom, h: b.height, first: Math.min(...btns.map(x => x.top)), last: Math.max(...btns.map(x => x.bottom)),
          words: /FOOTBALL\.? CLASSIC/i.test(document.getElementById('startMenu').innerText) }; });
      await c.close(); return r; };
    const sizes = [[844, 340], [852, 393], [932, 430]], lg = [];
    for(const [w, h] of sizes) lg.push(await logoAt(w, h));
    ok(lg.every((r, i) => r && r.nat[0] === 491 && r.nat[1] === 159 && /Fulltime 9/.test(r.alt) && !r.words && r.top >= 0 && r.bottom <= r.first && r.last <= sizes[i][1] && Math.round(r.h) === 64 && Math.round(r.top) === 8),   // (v246: 64 high, 8 down, as the template)
      'the title is the Fulltime 9 logo, above the menu with the menu whole on the screen: ' + lg.map((r, i) => r ? sizes[i].join('x') + ' ' + Math.round(r.h) + ' px tall, the last button at ' + Math.round(r.last) : 'no logo').join('; ') + ' (v223)');
    // (v224) THE TITLE PAGE AS LAID OUT IN THE STUDIO, AND ONE FONT: CONTINUE, LOAD GAME, NEW CAREER, EXHIBITION and SETTINGS in one
    // column down the middle, 257 wide and 12 apart, NEW CAREER lit with no game saved, the labs off it; Roboto Condensed for every word
    { const c = await browser.newContext({ viewport: { width: 852, height: 393 } }); const pg = await c.newPage(); await pg.goto('file://' + copy); await pg.waitForTimeout(800);
      const t = await pg.evaluate(async () => { await document.fonts.ready;
        const btns = [...document.querySelectorAll('#smItems .smBtn')].filter(b => b.offsetParent).map(b => { const r = b.getBoundingClientRect();
          return { t: b.textContent.replace('▶', '').trim(), l: r.left, w: r.width, top: r.top, bottom: r.bottom, sel: b.classList.contains('sel'), font: getComputedStyle(b).fontFamily }; });
        let ftc = 0; for(const sh of document.styleSheets){ let rs; try{ rs = sh.cssRules; }catch(e){ continue; } for(const r of rs) if(r.selectorText && r.style && /^\s*['"]?FTC Dot/.test(r.style.fontFamily || '')) ftc++; }   // (style rules: the pixel font's own @font-face is there for the symbols)
        return { btns, ftc, rc: document.fonts.check('600 14px "Roboto Condensed"'), labs: [...document.querySelectorAll('#smItems [data-act$="lab"], #smItems [data-act="skills"]')].filter(b => b.offsetParent).length }; });
      await c.close();
      const bt = t.btns, gaps = bt.slice(1).map((x, i) => Math.round(x.top - bt[i].bottom)), lit = bt.find(x => x.sel);
      ok(bt.map(x => x.t).join(',') === 'CONTINUE,LOAD GAME,NEW CAREER,EXHIBITION,SETTINGS' && bt.every(x => Math.abs(x.l - bt[0].l) < 1 && Math.abs(x.w - 232) < 1.5 && Math.abs(x.l + x.w / 2 - 426) < 1.5)
        && gaps.every(g => g === 8) && lit && lit.t === 'NEW CAREER' && t.labs === 0,   // (v246: four columns of the grid, 8 apart, as the template)
        'the title page as its template: ' + bt.map(x => x.t).join(', ') + ', one column down the middle, ' + Math.round(bt[0] ? bt[0].w : 0) + ' wide, ' + gaps.join('/') + ' apart, ' + (lit ? lit.t : 'nothing') + ' lit, ' + t.labs + ' labs (v224)');
      ok(t.rc && t.ftc === 0 && bt.every(x => /^"?Roboto Condensed/.test(x.font)), 'one font for every word: Roboto Condensed, loaded, and no rule leading with the pixel font (kept for the symbols alone) (v224)'); }
    ok(/^"?Roboto Condensed/.test(one.font), 'one font throughout: Roboto Condensed since v224 (' + one.font + ')');
  }
  await page.tap('[data-setclose]'); await page.waitForTimeout(100);
  await page.$eval('#smItems [data-act="skills"]', b => b.click()); await page.waitForTimeout(300);
  await check('skill moves', ['#skillsOverlay .tplTitle', '#skillsOverlay .skHint', '#skGrid .skCard', '#skList .skRow', '[data-skclose]']);
  { const sk = await skillsPage(page);
    ok(sk.all.length === 9 && sk.seen.join() === sk.all.join() && !sk.cut.length && sk.drawn && sk.moving,
      w + 'x' + h + ': SKILL MOVES as its template (v246): all nine moves as rows, each name whole and each picked in turn into the box on the left, what to draw drawn and its clip playing' + (sk.cut.length ? ' -- cut: ' + sk.cut.join(', ') : '') + (sk.seen.join() !== sk.all.join() ? ' -- seen ' + sk.seen.join(' ') : '') + (!sk.drawn ? ' -- not drawn' : '') + (!sk.moving ? ' -- clips still' : '')); }
  await page.tap('[data-skclose]'); await page.waitForTimeout(100);
  // (v246) THE START SECTION AS ITS TEMPLATES: on the grid (twelve columns 8 apart between the margins, C one column) --
  // NEW CAREER's slots in a box from the third column to the tenth, 56 high and 8 apart, BACK top left (two columns by 36,
  // 8 down) and the title beside it; the maker's two boxes, seven columns and five, CLUB KIT CREST at the header's right
  // end; HOW TO PLAY's eight in two columns of four, down the first then the second
  { const G = await page.evaluate(() => { const cs = getComputedStyle(document.documentElement), px = v => parseFloat(v);
      const t = document.createElement('div'); t.style.cssText = 'position:fixed;left:var(--tplL);width:var(--tplC);top:0;height:1px'; document.body.appendChild(t); const r = t.getBoundingClientRect(); t.remove(); return { L: r.left, C: r.width }; });
    const near = (a, b) => Math.abs(a - b) <= 1;
    await page.tap('#smItems [data-act="new"]'); await page.waitForTimeout(200);
    const sl = await page.evaluate(() => { const R = e => e.getBoundingClientRect(), b = R(document.querySelector('#newPanel .tplBack')), ti = R(document.querySelector('#newPanel .tplTitle')), box = R(document.getElementById('newSlotList')),
      rows = [...document.querySelectorAll('#newSlotList .slotBtn')].map(R); return { b: [b.left, b.top, b.width, b.height], ti: ti.left - b.right, box: [box.left, box.top, box.width], h: rows.map(q => Math.round(q.height)), gap: rows.slice(1).map((q, i) => Math.round(q.top - rows[i].bottom)),
        menu: getComputedStyle(document.querySelector('#startMenu > .smCenter')).visibility }; });
    const slOk = near(sl.b[0], G.L) && sl.b[1] === 8 && near(sl.b[2], 2 * G.C + 8) && sl.b[3] === 36 && sl.ti >= 6 && sl.ti <= 12 && near(sl.box[0], G.L + 2 * G.C + 16) && sl.box[1] === 52 && near(sl.box[2], 8 * G.C + 56)
      && sl.h.join() === '56,56,56' && sl.gap.join() === '8,8' && sl.menu === 'hidden';
    await page.tap('#newSlotList .slotBtn >> nth=2'); await page.waitForSelector('#mgrMaker.on', { timeout: 3000 }).catch(() => {}); await page.waitForTimeout(200);
    const mk = await page.evaluate(() => { const R = e => e.getBoundingClientRect(), l = R(document.querySelector('#mgrMaker .mkL')), r = R(document.querySelector('#mgrMaker .mkR')), tabs = [...document.querySelectorAll('#mgrMaker .tplTabs .mkTab')].map(R), go = R(document.getElementById('mgGo'));
      return { l: [l.left, l.top, l.width], r: [r.left, r.width, innerWidth - r.right], tabsEnd: innerWidth - tabs[tabs.length - 1].right, tabs: tabs.map(q => Math.round(q.width) + 'x' + Math.round(q.height)), goIn: go.left >= r.left && go.right <= r.right && go.bottom <= r.bottom, wells: [...document.querySelectorAll('#mgrMaker .tplWell')].map(w => w.textContent) }; });
    const mkOk = near(mk.l[0], G.L) && mk.l[1] === 52 && near(mk.l[2], 7 * G.C + 48) && near(mk.r[1], 5 * G.C + 32) && near(mk.r[2], G.L) && near(mk.tabsEnd, G.L) && mk.tabs.join() === '60x36,60x36,60x36' && mk.goIn && mk.wells.join() === 'YOU AND YOUR CLUB,ON THE SCOREBOARD';
    await page.tap('#mgrMaker [data-mm="cancel"]'); await page.waitForTimeout(200);
    await page.evaluate(() => { const b = document.querySelector('#newPanel [data-act="back"]'); if(b && b.offsetParent) b.click(); }); await page.waitForTimeout(150);
    await page.evaluate(() => window.__T && window.__T.ctlShow ? window.__T.ctlShow({}) : null);
    const ct = await page.evaluate(() => { const m = document.getElementById('ctlModal'); if(!m.classList.contains('on')) return null; const R = e => e.getBoundingClientRect(), rows = [...m.querySelectorAll('.ctlRow')].map(e => ({ k: e.querySelector('b').textContent, r: R(e) })), go = R(m.querySelector('[data-ctl="go"]')), card = R(m.querySelector('.ctlCard'));
      return { order: rows.map(x => x.k).join(), cols: [...new Set(rows.map(x => Math.round(x.r.left)))].length, h: [...new Set(rows.map(x => Math.round(x.r.height)))].join(), firstCol: rows.slice(0, 4).every(x => Math.round(x.r.left) === Math.round(rows[0].r.left)), go: [Math.round(card.right - go.right), Math.round(card.bottom - go.bottom)], tap: rows.every(x => true) }; });
    if(ct) await page.evaluate(() => window.__T.ctlHide());
    ok(slOk && mkOk && (!ct || (ct.order === 'MOVE,PASS,SHOOT,CROSS,SKILL,DEFENDING,CORNERS,MENU' && ct.cols === 2 && (ct.h === '48' || (h < 370 && ct.h === '44')) && ct.firstCol && ct.go[0] <= 6 && ct.go[1] <= 6)),
      w + 'x' + h + ': the Start screens as their templates (v246): NEW CAREER\'s slots in a box from the 3rd column to the 10th, 56 high and 8 apart, BACK (2 columns by 36, 8 down) and the title beside it, the menu hidden behind; the maker\'s boxes 7 and 5 columns, CLUB KIT CREST 60 x 36 at the header\'s end, NEXT in the right box' + (ct ? '; HOW TO PLAY\'s eight in two columns of four, BACK TO THE GAME bottom right' : '')
      + (slOk && mkOk && (!ct || ct.order === 'MOVE,PASS,SHOOT,CROSS,SKILL,DEFENDING,CORNERS,MENU') ? '' : ' -- ' + JSON.stringify({ G, sl, mk, ct }))); }
  await page.tap('#smItems [data-act="exhibition"]'); await page.waitForTimeout(200);
  await check('exhibition', ['#exhGo', '#exhPanel [data-act="back"]']);
  await page.tap('#exhPanel [data-act="back"]'); await page.waitForTimeout(100);
  await page.tap('#smItems [data-act="new"]'); await page.waitForTimeout(200); await page.tap('#newSlotList .slotBtn >> nth=1'); await page.waitForTimeout(300);
  await check('new career', ['#mgGo', '#mgrMaker [data-mm="cancel"]', '#mgName', '#mgClubIn']);
  await page.tap('#mgrMaker [data-mm="cancel"]'); await page.waitForTimeout(200);
  await newCareer(page);
  await check('hub', ['#chBottom button', '#chCampus .bldg', '.chMenuBtn', '.cpStats', '#cpView', '.cpPapers', '.chNews .chWell', '.chFix .chFx', '.chNext .chNgS', '.chOver .chKv']);
  { // (v244) THE HUB AS THE HUB TEMPLATE: the top bar and the week's button over the boxes; the campus in its box, as wide
    // as the box (its own size at most) with the stand and the clubhouse in it; the week in the top bar whole; the menu
    // down the left, or the right if Settings says so (the next game and the club's box then down the left)
    await page.waitForTimeout(150);
    const cp = async () => page.evaluate(() => { const v = document.getElementById('cpView').getBoundingClientRect(), m = new DOMMatrix(getComputedStyle(document.getElementById('cpWorld')).transform),
      ph = document.getElementById('chPhase'), nav = document.querySelector('.cpNav').getBoundingClientRect(), nx = document.querySelector('.chNext').getBoundingClientRect(), rg = document.createRange(); rg.selectNodeContents(ph);
      const top = document.querySelector('.chTop').getBoundingClientRect(), btn = document.getElementById('chBottom').getBoundingClientRect();
      return { s: +m.a.toFixed(3), want: +Math.max(v.width / 768, v.height / 448, Math.min(1, v.width / 768)).toFixed(3), whole: Number.isInteger(m.e) && Number.isInteger(m.f),
        stand: m.f + 74 * m.a >= -1, club: m.f + 287 * m.a <= v.height + 1, week: rg.getBoundingClientRect().width <= ph.getBoundingClientRect().width + 0.05, phase: ph.textContent,
        bar: btn.left >= top.right && Math.abs(btn.top - top.top) < 1 && top.bottom <= v.top, right: nav.left > v.left && nx.right <= v.left }; });
    const c = await cp();
    ok(Math.abs(c.s - c.want) < 0.004 && c.whole && c.stand && c.club && c.week && c.bar && !c.right,
      w + 'x' + h + ': the hub as the template -- the top bar with the week\'s button beside it, the campus in its box as wide as the box (x' + c.s + ') with the stand and the clubhouse in it, the week whole ("' + c.phase + '"), the menu on the left (v244)');
    if(w === 844 && h === 390){ await page.evaluate(() => window.__MG.setPref('side', 'right')); await page.waitForTimeout(150); const r = await cp();
      await page.evaluate(() => window.__MG.setPref('side', 'left'));
      ok(r.right && Math.abs(r.s - r.want) < 0.004 && r.stand && r.club, 'CAMPUS MENU: RIGHT puts the buildings down the right and the next game and the club\'s box down the left, the campus in its box as it was'); }
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });   // (the buildings open at once; NEXT DAY's sunset is manager-career.mjs's)
  const audit = [];   // (v177, the handoff's J1: no sentence longer than a label on a building's screen, by default -- its words a tap away)
  for(const b of ['club', 'train', 'stadium', 'market', 'physio', 'scouting', 'academy']){
    await page.tap(`#chCampus [data-bldg="${b}"]`); await page.waitForSelector('#bldgPanel.show'); await page.waitForTimeout(80);
    let tabs = await page.$$eval('#bpTabs .bpTab', ns => ns.map(n => n.textContent));
    if(!tabs.length && await page.$('#bpBody .clGo [data-mg="goclub"]')){   // (not yet: what it is, the clubhouse it needs -- then the clubhouse built up to it; v173: ◀ CLUBHOUSE on its screen)
      await check(b + ' / waits for its clubhouse', ['.bpTopBack', '#bpBody', '#bpBody .clGo [data-mg="goclub"]', '#bpBody .bsTiles', '#bpBody .clNodes']);
      await page.evaluate(() => { const M = window.__MG, d = M.d; d.budget = 1e9; d.top = 4; while(M.lvOf(d, 'club') < 4) M.bldUp(d, 'club'); M.mgSave(d); M.renderHub(); });
      await page.tap('.bpTopBack'); await page.waitForTimeout(80); await page.tap(`#chCampus [data-bldg="${b}"]`); await page.waitForSelector('#bldgPanel.show'); await page.waitForTimeout(80); }
    if(!tabs.length && await page.$('#bpBody .clGo [data-mg="up"]') && await page.$('#bpBody .clChip.dim')){   // (one to buy: NOT BUILT, what it'd do, BUILD IT -- then its own screen)
      await check(b + ' / to buy', ['.bpTopBack', '#bpBody', '#bpBody .clGo [data-mg="up"]', '#bpBody .bsTiles']);
      await page.evaluate(() => { window.__MG.d.budget = 1e9; }); await page.tap('#bpBody .clGo [data-mg="up"]'); await page.waitForTimeout(150);
      tabs = await page.$$eval('#bpTabs .bpTab', ns => ns.map(n => n.textContent)); }
    if(!tabs.length && b === 'market'){   // (your phone, before it rings: what it's for -- then the call, and its tabs)
      await check(b + ' / before the call', ['.bpTopBack', '#bpBody']);
      await page.evaluate(() => { const M = window.__MG; M.mgMarketOpen(M.d); M.mgSave(M.d); M.renderHub(); });
      await page.tap('.bpTopBack'); await page.waitForTimeout(80); await page.tap(`#chCampus [data-bldg="${b}"]`); await page.waitForSelector('#bldgPanel.show'); await page.waitForTimeout(80);
      tabs = await page.$$eval('#bpTabs .bpTab', ns => ns.map(n => n.textContent)); }
    if(!tabs.length) await check(b, ['.bpTopBack', '#bpBody', '.mgPager', '#bpFoot .mgBtn', '#bpBody .clGo .mgBtn', '#bpBody .bsTiles']);
    for(const t of tabs){ await page.tap(`#bpTabs .bpTab:text-is("${t}")`); await page.waitForTimeout(80);
      await check(b + ' / ' + t, ['.bpTopBack', '#bpTabs .bpTab', '#bpBody', '.mgPager', '.tbTop .tbDrop', '.tbBest', '.tbBench', '.selRow']);
      if(w === 844 && h === 390 && !(b === 'club' && t === 'News')) for(const x of await page.evaluate(() => [...document.querySelectorAll('#bldgPanel *')].filter(e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden')
          .map(e => [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').replace(/\s+/g, ' ').trim()).filter(t => t.length > 48))) audit.push(b + ' / ' + t + ': "' + x.slice(0, 70) + '"'); }   // (v177: J1's audit -- the news is the game's voice)
    await page.tap('.bpTopBack'); await page.waitForTimeout(80);
  }
  await page.tap('#chCampus [data-bldg="club"]'); await page.waitForSelector('#bldgPanel.show'); await page.waitForTimeout(80);   // (v244: DECORATE, the Clubhouse's last tab)
  await page.tap('#bpTabs .bpTab:text-is("Decorate")'); await page.waitForTimeout(100);
  for(const t of ['Trees', 'Garden', 'Plaza']){ await page.tap(`#bpTabs .bpTab:text-is("${t}")`); await page.waitForTimeout(100);
    await check('decorate / ' + t, ['.bpTopBack', '#bpTabs .bpTab', '#bpBody', '.decoCard']); }
  await page.tap('.bpTopBack'); await page.waitForTimeout(80);
  ok(!fails.length, w + 'x' + h + ': every menu screen fits, and nothing on it scrolls (one waiting for its clubhouse, one to buy, every building\'s every tab, DECORATE)' + (fails.length ? ' -- ' + fails.slice(0, 3).join(' | ') : ''));
  if(w === 844 && h === 390) ok(!audit.length, 'J1\'s audit: no building\'s screen, any tab, shows a sentence longer than a label by default (48 characters; the news excepted)' + (audit.length ? ' -- ' + audit.slice(0, 4).join(' | ') : ''));
  { // (v225) THE FOOTER: the Fulltime 9 kit's bushes and grass along the foot of the campus and of every building -- at the very
    // foot, the full width, 8% of the screen's height (24 to 64 px), the bushes as drawn at each end and the grass repeating
    // between them, behind the page and taking no taps; the page stops above it (380 px tall or less: halfway into it; 350 px
    // or less: where it always stopped), and it's on no screen outside the career
    const foot = sel => page.evaluate(sel => { const f = document.querySelector(sel + ' > .cfFoot'); if(!f || !f.getClientRects().length) return null;
      const r = f.getBoundingClientRect(), cs = getComputedStyle(f), part = c => { const e = f.querySelector(c), s = getComputedStyle(e); return { w: e.getBoundingClientRect().width, img: /^url\("?data:image\/webp/.test(s.backgroundImage), rep: s.backgroundRepeat }; };
      const page = sel === '#careerHub' ? ['.cpNav', '.cpMain', '.chNews', '.chFix', '.chOver'] : ['#bldgPanel .bpInner'], low = Math.max(...page.map(s => document.querySelector(s).getBoundingClientRect().bottom));
      return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, h: r.height, z: cs.zIndex, pe: cs.pointerEvents, L: part('.cfL'), M: part('.cfM'), R: part('.cfR'), low, W: innerWidth, H: innerHeight }; }, sel);
    const want = Math.min(64, Math.max(24, h * 0.08)), stop = h > 380 ? h - want - 2 : h > 350 ? h - want * 0.5 : h - 8;
    const good = f => !!f && Math.abs(f.bottom - f.H) < 1 && f.left === 0 && Math.abs(f.right - f.W) < 1 && Math.abs(f.h - want) < 1 && f.z === '-1' && f.pe === 'none'
      && f.L.img && f.M.img && f.R.img && Math.abs(f.L.w - f.h * 406 / 107) < 1.5 && Math.abs(f.R.w - f.h * 232 / 107) < 1.5 && /round/.test(f.M.rep) && f.low <= stop + 1;
    const hubF = await foot('#careerHub');
    await page.tap('#chCampus [data-bldg="club"]'); await page.waitForSelector('#bldgPanel.show'); await page.waitForTimeout(100); const bldF = await foot('#bldgPanel');
    await page.tap('.bpTopBack'); await page.waitForTimeout(80);
    ok(good(hubF) && good(bldF) && footOnTitle === 0, w + 'x' + h + ': the footer along the foot of the campus and the Clubhouse, and not on the title page -- the full width, ' + (hubF ? Math.round(hubF.h * 10) / 10 : '-') + ' px tall (8% of the screen), the bushes as drawn at each end ('
      + (hubF ? Math.round(hubF.L.w) + ' and ' + Math.round(hubF.R.w) : '-') + ' px wide) and the grass repeating between, behind the page and taking no taps; the page ending at '
      + (hubF ? Math.round(hubF.low) + ' and ' + Math.round(bldF ? bldF.low : 0) : '-') + ' px (' + (h > 380 ? 'above it' : h > 350 ? 'halfway into it' : 'where it always did') + ') (v225)'); }
  if(w === 844 && h === 390){   // (v220) THE CAREER BACK IN THE PIXEL KIT: Fulltime 9's look (v206) and its type (v207) taken off the hub and the Tactics
    const hub = await page.evaluate(() => { const q = s => document.querySelector(s), fam = e => getComputedStyle(e).fontFamily.split(',')[0].replace(/["']/g, '').trim();
      const hex = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(), n = parseInt(hex.slice(1), 16);
      return { ft: [...document.querySelectorAll('#ftTop, .ftCard, .ftCampus, .tacV, .tpV, .ptkFig')].length, crest: !!q('.chTop #chClub'), week: !!q('#careerHub > #chBottom'), strip: !!q('.chTop #cpStats'),
        font: fam(q('#chClub')), bg: getComputedStyle(q('#careerHub')).backgroundColor, want: 'rgb(' + (n >> 16) + ', ' + (n >> 8 & 255) + ', ' + (n & 255) + ')',
        roboto: [...document.fonts].some(f => /Roboto/.test(f.family)) }; });
    await page.tap('#chCampus [data-bldg="train"]'); await page.waitForSelector('#bldgPanel.show'); await page.waitForTimeout(80);
    await page.tap('#bpTabs .bpTab:text-is("Tactics")'); await page.evaluate(() => { const b = document.querySelector('#bpBody [data-tlist="bench"]'); if(b) b.click(); }); await page.waitForTimeout(120);
    const tac = await page.evaluate(() => { const p = document.querySelector('#bpBody .tpitch').getBoundingClientRect(), b = document.querySelector('#bpBody .tbBench').getBoundingClientRect();
      const mid = e => { const r = e.getBoundingClientRect(); return r.top + r.height / 2; }, gk = document.querySelector('#bpBody .tpitch .ptk[data-tac="gk"]'),
        F = [...document.querySelectorAll('#bpBody .tpitch .ptk[data-tac="field"]')], att = F.filter(e => e.dataset.role === 'ATT'), fld = document.querySelector('#bpBody .tvF');
      return { wide: p.height > p.width, beside: b.left >= p.right - 1 && b.top < p.bottom,   /* (v260: the template's pitch box, four columns wide and taller than that; the bench's rows in the next box) */ upright: !!gk && F.every(e => mid(e) < mid(gk)) && att.length > 0 && att.every(a => F.every(e => mid(a) <= mid(e) + 1)),
        pic: !!fld && /data:image\/webp/.test(getComputedStyle(fld).backgroundImage), faces: document.querySelectorAll('#bpBody .tpitch .ptkFace').length, figs: document.querySelectorAll('#bpBody .ptkFig, #bpBody .tpV').length,
        font: getComputedStyle(document.getElementById('bpTitle')).fontFamily.split(',')[0].replace(/["']/g, '').trim() }; });
    await page.tap('.bpTopBack'); await page.waitForTimeout(80);
    ok(!hub.ft && hub.crest && hub.week && hub.strip && hub.font === 'Roboto Condensed' && hub.bg === hub.want && hub.roboto,
      'the career\'s home in the pixel kit: no Fulltime 9 cards or cream (the hub on the scheme\'s ' + hub.bg + '); v244: the crest, the club and the week in the top bar, the week\'s button beside it; its words in Roboto Condensed (v224)');
    ok(tac.wide && tac.beside && tac.upright && tac.pic && tac.faces === 9 && !tac.figs && tac.font === 'Roboto Condensed',
      'the Tactics (v226): the pitch upright on the Studio\'s pitch picture (Retro Pixel Soccer Field) -- the keeper at its foot, the forwards at its top -- the nine shown by their faces (' + tac.faces + '), the bench\'s rows in the box beside it (v260), the title in Roboto Condensed (v224)');
  }
  { // THE WIDTH SHOWS ON THE PITCH and nobody overlaps: a four across the middle (3-4-1), COMPACT and WIDE, on the training pitch and the clubhouse's Squad
    await page.evaluate(() => { const d = window.__MG.d; d.lv.train = 4; window.__MG.mgSave(d); });   // (every shape: the training pitch's locks are manager-career.mjs's)
    await page.tap('#chCampus [data-bldg="train"]'); await page.waitForTimeout(120); await page.tap('#bpTabs .bpTab:text-is("Tactics")'); await page.evaluate(() => { const b = document.querySelector('#bpBody [data-tlist="bench"]'); if(b) b.click(); }); await page.waitForTimeout(120);
    const d0 = await page.evaluate(() => [window.__MG.d.formation, window.__MG.d.width.atk]);
    const set = async (form, wd) => { await page.tap('#bpBody [data-tdrop="form"]'); await page.waitForTimeout(60); await page.tap(`#bpBody [data-cform="${form}"]`); await page.waitForTimeout(80);
      await page.tap('#bpBody [data-tdrop="width"]'); await page.waitForTimeout(60); await page.tap(`#bpBody [data-cwidth="${wd}"]`); await page.waitForTimeout(80); };
    await set('3-4-1', '0.84'); const cpt = await apart(page, '#bpBody .tpitch');
    await page.tap('.bpTopBack'); await page.waitForTimeout(80); await page.tap('#chCampus [data-bldg="club"]'); await page.waitForTimeout(120);
    await page.tap('#bpTabs .bpTab:text-is("Squad")'); await page.waitForTimeout(120); const sq = await apart(page, '#bpBody .sqPitch');
    await page.tap('.bpTopBack'); await page.waitForTimeout(80); await page.tap('#chCampus [data-bldg="train"]'); await page.waitForTimeout(120); await page.tap('#bpTabs .bpTab:text-is("Tactics")'); await page.evaluate(() => { const b = document.querySelector('#bpBody [data-tlist="bench"]'); if(b) b.click(); }); await page.waitForTimeout(120);
    await set('3-4-1', '1.18'); const wde = await apart(page, '#bpBody .tpitch');
    await set('3-3-2', '0.84'); const c3 = await apart(page, '#bpBody .tpitch'); await set('3-3-2', '1.18'); const w3 = await apart(page, '#bpBody .tpitch');
    await set(d0[0], String(d0[1])); await page.tap('.bpTopBack'); await page.waitForTimeout(80);
    ok(cpt.n === 9 && sq.n === 9 && !cpt.over && !cpt.out && !sq.over && !sq.out && !wde.over && !wde.out && !c3.over && !w3.over && w3.span > c3.span + 20,
      w + 'x' + h + ': a four across the middle (3-4-1), COMPACT and WIDE -- nobody overlaps or hangs off the pitch (the training pitch\'s and the Squad\'s; v226: on the upright pitch a four fills it touchline to touchline either way); a three (3-3-2), WIDE spreads it ' + c3.span + ' -> ' + w3.span + ' px'
      + (cpt.over + sq.over + wde.over ? ' -- overlaps: ' + [cpt.over, sq.over, wde.over].join('/') : '') + (cpt.out + sq.out + wde.out ? ' -- off the pitch by ' + Math.max(cpt.out, sq.out, wde.out) + ' px' : '')); }
  { // A LIST OF PLAYERS SCROLLS (v171: the handoff's J3), never over pages -- a finger up it, no buttons. The market's at
    // 844x390: no pager, eleven rows and more on the screen at once, the count over it the rows in it, a swipe moves it and
    // the filters and the column heads stay put (sticky), N MORE counts down and goes at the end, where the last man is.
    // Then the squad's, at every size: 25 men in it, every one reached by swiping from the top, the count 25, eleven rows
    // and more seen at once on a phone (844x390, 667x375; Safari's bar showing, 844x340, ten); and a finger ACROSS a man,
    // toward the little pitch, still carries him to a spot
    const cdp = await ctx.newCDPSession(page), T = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
    const swipe = async (sel, dy) => { const r = await page.$eval(sel, e => { const q = e.getBoundingClientRect(); return { x: q.left + q.width * 0.4, y: q.top + q.height * 0.8 }; });
      await T('touchStart', r.x, r.y); for(let i = 1; i <= 10; i++){ await T('touchMove', r.x, r.y - dy * i / 10); await page.waitForTimeout(16); }
      await page.waitForTimeout(120); await T('touchEnd', r.x, r.y - dy); await page.waitForTimeout(150); };   // (held still at the end: no fling)
    const look = sel => page.evaluate(sel => { const b = document.querySelector(sel), br = b.getBoundingClientRect(), t = b.querySelector('.plTop'), top = t ? t.getBoundingClientRect().bottom : br.top;
      const rows = [...b.querySelectorAll('.mgRow')].filter(r => r.getClientRects().length), seen = rows.filter(r => { const q = r.getBoundingClientRect(); return q.top >= top - 1 && q.bottom <= br.bottom + 1; }).map(r => r.dataset.pid);
      const fade = b.parentElement.querySelector(':scope > .plFade'), f = b.querySelector('.mkFilters') || b.parentElement.querySelector('.mkFilters'), fr = f && f.getBoundingClientRect(), c = b.querySelector('.plCols') || b.parentElement.querySelector('.plCols'), cr = c && c.getBoundingClientRect();   /* (v257: the market's filters and heads over the list, in its box) */
      return { pager: !!b.parentElement.querySelector('.fitPager, [data-pages]'), rows: rows.length, seen, n: +((b.querySelector('.plN') || b.parentElement.querySelector('.plN') || {}).textContent),   /* (v252: the squad's count in its box's well, over the rows) */ last: rows.length ? seen.includes(rows[rows.length - 1].dataset.pid) : true,
        more: fade && !fade.classList.contains('end') ? parseInt(fade.textContent) || 0 : 0, end: !!fade && fade.classList.contains('end'), st: Math.round(b.scrollTop), max: b.scrollHeight - b.clientHeight,
        stuck: (!f || fr.top >= br.top - 1 && fr.bottom <= top + 1) && !!cr && cr.top >= br.top - 1 && cr.bottom <= top + 1 || !!cr && !b.contains(c) && cr.bottom <= br.top + 1 && (!f || fr.bottom <= br.top + 1) }; }, sel);
    const L = '#bpBody .mgPaneL .plPane';
    if(w === 844 && h === 390){
      await page.tap('#chCampus [data-bldg="market"]'); await page.waitForTimeout(150); await page.tap('#bpTabs .bpTab:text-is("Search")'); await page.waitForTimeout(150);
      const a = await look(L); await swipe(L, 150); const b = await look(L);
      await page.evaluate(L => { const e = document.querySelector(L); e.scrollTop = e.scrollHeight; e.dispatchEvent(new Event('scroll')); }, L); await page.waitForTimeout(100); const z = await look(L);
      info('the market list: ' + JSON.stringify({ top: { rows: a.rows, seen: a.seen.length, n: a.n, more: a.more }, swiped: { st: b.st, seen: b.seen.length, more: b.more, stuck: b.stuck }, end: { st: z.st, max: z.max, last: z.last, more: z.more, end: z.end } }));
      ok(!a.pager && a.rows > 30 && a.n === a.rows && a.seen.length >= 7 && a.more > 0 && a.more <= a.rows - a.seen.length, 'the market\'s list: no pages, ' + a.seen.length + ' rows on the screen at once, ' + a.n + ' over it and ' + a.rows + ' in it, ' + a.more + ' MORE');   // (v225: 10 rows, the footer under the page; 11 before. v257: 7, the template's well, filters and heads over them)
      ok(b.st >= 100 && b.more < a.more && b.stuck && !b.seen.includes(a.seen[0]), 'a finger up it: it moves (' + b.st + ' px), N MORE counts down (' + a.more + ' -> ' + b.more + '), the filters and the column heads stay where they were');
      ok(z.st >= z.max - 1 && z.last && z.end && z.more === 0, 'at its foot: the last man on the screen, and no N MORE');
      await page.tap('.bpTopBack'); await page.waitForTimeout(80); }
    { const n0 = await page.evaluate(() => { const M = window.__MG, d = M.d, n0 = d.roster.length, R = ['GK', 'DEF', 'MID', 'ATT'];
        while(d.roster.length < 25) d.roster.push(M.mgNewPlayer(d, R[d.roster.length % 4], 45, 24)); M.mgSave(d); M.renderHub(); return n0; });
      await page.tap('#chCampus [data-bldg="club"]'); await page.waitForTimeout(150); await page.tap('#bpTabs .bpTab:text-is("Squad")'); await page.waitForTimeout(150);
      const a = await look(L), got = new Set(a.seen); let z = a, k = 0;
      while(z.st < z.max - 1 && k++ < 20){ await swipe(L, 120); z = await look(L); z.seen.forEach(x => got.add(x)); }
      const want = w === 844 && h === 340 ? 7 : 8, back = (await onScreen(page, ['.bpTopBack', '#bpTabs .bpTab', '#bpBody .mgPaneL .tplWell'])).length;   // (v252: the template's rows of 28, eight on the screen -- 11 and 10 before, rows of 22)
      info(w + 'x' + h + ' the squad: ' + JSON.stringify({ n: a.n, rows: a.rows, seen: a.seen.length, swipes: k, reached: got.size, more0: a.more, endMore: z.more, end: z.end }));
      ok(!a.pager && a.n === 25 && a.rows === 25 && a.seen.length >= want && got.size === 25 && z.end && !back,
        w + 'x' + h + ': a squad of 25 -- ' + a.seen.length + ' rows seen at once, every man reached by swiping from the top (' + got.size + ' in ' + k + ' swipes, no taps), 25 over the list and 25 in it');
      const pick = await page.evaluate(() => { const d = window.__MG.d, lu = d.lineup, on = new Set([lu.gk, ...lu.atk]), ri = d.roster.findIndex((p, i) => !on.has(i) && p.role !== 'GK'); return { ri, pid: d.roster[ri].id, to: lu.atk[2] }; });
      const r = await page.$eval(`#bpBody .sqList .mgRow[data-pid="${pick.pid}"]`, e => { e.scrollIntoView({ block: 'center' }); const q = e.getBoundingClientRect(); return { x: q.left + q.width * 0.3, y: q.top + q.height / 2 }; });
      await page.waitForTimeout(100); const t = await page.$eval(`#bpBody .sqPitch .ptk[data-ri="${pick.to}"]`, e => { const q = e.getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2 }; });
      const st0 = await page.$eval(L, e => e.scrollTop); await T('touchStart', r.x, r.y);
      for(let i = 1; i <= 3; i++){ await T('touchMove', r.x + i * 6, r.y); await page.waitForTimeout(16); }
      for(let i = 1; i <= 10; i++){ await T('touchMove', r.x + 18 + (t.x - r.x - 18) * i / 10, r.y + (t.y - r.y) * i / 10); await page.waitForTimeout(16); }
      await T('touchEnd', t.x, t.y); await page.waitForTimeout(250);
      const c = await page.evaluate(([ri, st0, L]) => ({ in: window.__MG.d.lineup.atk[2] === ri, st: Math.abs(document.querySelector(L) ? document.querySelector(L).scrollTop - st0 : 0) }), [pick.ri, st0, L]);
      ok(c.in && c.st <= 2, w + 'x' + h + ': a finger across a man in the list, toward the little pitch, carries him to a spot -- and the list, redrawn, is where it was (' + c.st + ' px out)');
      { await page.evaluate(L => { const e = document.querySelector(L); e.scrollTop = e.scrollHeight; e.dispatchEvent(new Event('scroll')); }, L); await page.waitForTimeout(80);
        const s0 = await page.$eval(L, e => e.scrollTop), pid = (await look(L)).seen.slice(-2)[0];
        await page.tap(`#bpBody .sqList .mgRow[data-pid="${pid}"]`); await page.waitForTimeout(150);
        const p = await page.evaluate(([L, pid]) => ({ st: document.querySelector(L).scrollTop, on: !!document.querySelector(`#bpBody .sqList .mgRow.on[data-pid="${pid}"]`), card: !!document.querySelector('#bpBody .mgPaneR .mgCard') }), [L, pid]);
        ok(p.on && p.card && Math.abs(p.st - s0) <= 2, w + 'x' + h + ': a man near the foot of the list tapped: his card, his row lit, and the list where it was (' + Math.round(s0) + ' -> ' + Math.round(p.st) + ' px)'); }
      await page.evaluate(n0 => { const M = window.__MG, d = M.d; d.lineup = null; d.roster.splice(n0); M.mgSave(d); M.renderHub(); }, n0);
      await page.tap('.bpTopBack'); await page.waitForTimeout(80); }
  }
  { // THE CLUBHOUSE'S CLUB AS ITS TEMPLATE (v251; v172 had it on one screen in two columns) -- at every size: three
    // boxes of four columns, the page's height, no frame round them, no pages, nothing off the screen and no words cut;
    // THE CLUB NOW (Bank, Fans, a week, Morale) and HISTORY (Seasons, Promotions, Titles, Now) as rows of 24 with their
    // marks; THE BUILDINGS as six rows of 36 you tap, the clubhouse first, lit, MOVE IN and its price at the shed, the
    // hall and nothing to buy once it's the best; RECORDS as seven rows; every row of figures a tap from its sentence
    const lv0 = await page.evaluate(() => { const d = __MG.d, v = d.lv.club; d.lv.club = 1; __MG.mgSave(d); return v; });   // (at the shed: the hall's after, as an earlier scene left it)
    await page.tap('#chCampus [data-bldg="club"]'); await page.waitForTimeout(150); await page.tap('#bpTabs .bpTab:text-is("Club")'); await page.waitForTimeout(150);
    const club = () => page.evaluate(() => { const B = document.getElementById('bpBody'), br = B.getBoundingClientRect(), q = s => [...B.querySelectorAll(s)];
      const out = q('.clTpl *').filter(e => { const r = e.getBoundingClientRect(); return r.height > 0 && (r.bottom > br.bottom + 1 || r.right > br.right + 1 || r.top < br.top - 1 || r.left < br.left - 1); }).map(e => e.className).slice(0, 3);
      const cut = q('.clKv .clLbl, .clBld span').filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent);
      const pr = document.createElement('i'); pr.style.cssText = 'position:fixed;left:0;top:0;height:1px;width:var(--tplC)'; document.body.appendChild(pr); const cw = pr.getBoundingClientRect().width; pr.remove();
      const boxes = q('.clTpl > .tplBox'), bw = boxes.map(x => x.getBoundingClientRect().width), bh = boxes.map(x => x.getBoundingClientRect().height);
      return { paged: !!document.querySelector('#bldgPanel .fitPager'), out, cut, n: boxes.length, four: bw.every(v => Math.abs(v - (4 * cw + 24)) <= 2), tall: bh.every(v => Math.abs(v - br.height) <= 1), frame: getComputedStyle(B).boxShadow,
        wells: q('.clTpl .tplWell').map(e => e.textContent).join(' | '), rows: q('.clKv:not(.clRk)').map(e => e.querySelector('.clLbl').textContent + (e.querySelector('.hic svg') ? '*' : '')).join(' / '),
        h24: q('.clKv').every(e => Math.round(e.getBoundingClientRect().height) === 24),
        bld: q('.clBld').map(e => e.dataset.b + ':' + e.querySelector('span').textContent + (e.matches('.lit') ? ' lit' : '') + (e.querySelector('.hic svg') ? '*' : '') + ':' + Math.round(e.getBoundingClientRect().height)),
        up: !!B.querySelector('.clBld.lit[data-mg="up"][data-b="club"]'), price: (B.querySelector('.clBld.lit .clPrice') || {}).textContent, goto: q('.clBld[data-mg="goto"]').map(e => e.dataset.b).join(' '),
        recs: q('.clRk .clLbl').map(e => e.textContent).join(' / '), noTap: q('.clKv, .clBld.best').filter(e => !e.dataset.xpl).map(e => e.textContent) }; });
    const c = await club();
    await page.evaluate(lv => { const d = __MG.d; d.lv.club = lv; __MG.mgSave(d); }, lv0); await page.tap('#bpTabs .bpTab:text-is("Squad")'); await page.waitForTimeout(80); await page.tap('#bpTabs .bpTab:text-is("Club")'); await page.waitForTimeout(150);
    const c4 = await club();
    if(w === 844 && h === 390) info('the Clubhouse\'s Club: ' + JSON.stringify(c) + ' / at clubhouse ' + lv0 + ': ' + JSON.stringify({ bld: c4.bld[0], up: c4.up, paged: c4.paged, out: c4.out, cut: c4.cut }));
    ok(!c.paged && !c.out.length && !c.cut.length && c.n === 3 && c.four && c.tall && c.frame === 'none' && c.wells === 'THE CLUB NOW | HISTORY | THE BUILDINGS | RECORDS'
       && c.rows === 'Bank* / Fans* / A week, pre-season* / Morale* / Seasons* / Promotions* / Titles* / Now*' && c.h24
       && c.bld.length === 6 && c.bld[0] === 'club:CLUBHOUSE · MOVE IN lit*:36' && c.bld.slice(1).every(x => /^\w+:[A-Z]+ · (LEVEL \d|NOT BUILT)\*:36$/.test(x)) && c.up && c.price === '$400K' && c.goto === 'train stadium physio scouting academy'
       && c.recs === 'Most games / Most goals / Youngest / Youngest scorer / Biggest win / Record signing / Record sale' && !c.noTap.length
       && lv0 === 4 && c4.bld[0] === 'club:CLUBHOUSE · THE HALL*:36' && !c4.up && !c4.paged && !c4.out.length && !c4.cut.length,
      w + 'x' + h + ': the Clubhouse\'s Club as its template -- three boxes of four columns, the page\'s height, no frame, no pages, nothing off it or cut; the club now and its history as rows of 24 with their marks, the six buildings as rows of 36 you tap (the clubhouse lit, MOVE IN, $400K), the seven records, every row a tap from its sentence; in the hall, THE HALL and nothing to buy'
      + (c.paged || c.out.length || c.cut.length || c.noTap.length || !c.four || !c.tall ? ' -- ' + JSON.stringify({ paged: c.paged, out: c.out, cut: c.cut, noTap: c.noTap, four: c.four, tall: c.tall }) : ''));
    await page.tap('.bpTopBack'); await page.waitForTimeout(80); }
  if(w === 844 && h === 390){ // THE GROUND FROM ABOVE (v175: the handoff's J4) -- the Stands tab: the pitch and its stands round it, each with
    // its name, the ground's level as pips, its price on a chip and how full it is; the ends only once there are covered
    // stands; SEATS, FANS, LAST CROWD and BOARDS; the five levels as a path, your money against the next, BUILD IT
    const plan = async () => { await page.tap('#chCampus [data-bldg="stadium"]'); await page.waitForTimeout(150); await page.tap('#bpTabs .bpTab:text-is("Stands")'); await page.waitForTimeout(150);
      const r = await page.evaluate(() => { const B = document.getElementById('bpBody'), q = s => [...B.querySelectorAll(s)];
        return { stands: q('.sgS:not(.none)').map(e => e.className.replace('sgS ', '') + ':' + e.querySelector('b').textContent + ':' + e.querySelectorAll('.bsPips i.on').length + ':' + (e.querySelector('.sgPrice') || {}).textContent + ':' + !!e.querySelector('.sgFill i') + ':' + !!e.dataset.xpl).join(' '),
          ends: q('.sgS.none').length, pitch: !!B.querySelector('.sgPitch'), tiles: q('.sgSide .clTile .clLbl').map(e => e.textContent).join(' '), nodes: q('.sgSide .clNode').length, build: !!B.querySelector('.sgSide [data-stad="upgrade"]'), paged: !!B.querySelector('.fitPager') }; });
      await page.tap('.bpTopBack'); await page.waitForTimeout(80); return r; };
    const lv0 = await page.evaluate(() => { const d = __MG.d, v = d.stadium.lvl; d.stadium.lvl = 1; __MG.mgSave(d); return v; }), p1 = await plan();
    await page.evaluate(() => { const d = __MG.d; d.stadium.lvl = 4; __MG.mgSave(d); }); const p4 = await plan();
    await page.evaluate(lv => { const d = __MG.d; d.stadium.lvl = lv; __MG.mgSave(d); }, lv0);
    info('the ground from above: ' + JSON.stringify({ p1, p4 }));
    ok(/^n:BLEACHERS:1:\$\d+:true:true s:BLEACHERS:1:\$\d+:true:true$/.test(p1.stands) && p1.ends === 2 && p1.pitch && p1.tiles === 'SEATS FANS LAST CROWD BOARDS' && p1.nodes === 5 && p1.build && !p1.paged
       && /^n:NORTH STAND:4:\$\d+:true:true w:WEST END:4:\$\d+:true:true e:EAST END:4:\$\d+:true:true s:SOUTH STAND:4:\$\d+:true:true$/.test(p4.stands) && p4.ends === 0 && !p4.paged,
      'the Stands tab, the ground from above: at level 1 the bleachers down both sides and no ends, at 4 four stands, each with its name, the level as pips, its price, how full it is and its words a tap away; SEATS, FANS, LAST CROWD (v186: not a projected FULL), BOARDS; the five levels and BUILD IT; no pages'); }
  // a match: the pause menu, the match's tactics, the report
  const mf = [], mcheck = async (what, sels) => { const bad = await onScreen(page, sels); if(bad.length) mf.push(what + ': ' + bad.slice(0, 2).join('; ')); };
  for(let i = 0; i < 8; i++){ if(!(await page.$('#chBottom [data-mg="forward"]'))) break; await page.tap('#chBottom [data-mg="forward"]'); await page.waitForTimeout(100); }   // (by its selector: the Monday papers put aside redraw the hub)
  await page.tap('#chBottom [data-mg="play"]'); await page.waitForTimeout(1200);
  const hw = await hudWin(page);
  ok(winOk(hw, true), w + 'x' + h + ': your man\'s window, top right beside the menu and level with it: ' + hw.num + ' ' + hw.name + ' ' + hw.pos + ', ' + hw.lit + ' stars lit, stamina ' + Math.round(hw.fill * 100) + '% -- his, all of it on screen and over no other chip' + (winOk(hw, true) ? '' : ' ' + JSON.stringify(hw)));
  await page.evaluate(() => document.getElementById('menuBtn').click()); await page.waitForTimeout(150);
  await mcheck('pause', ['#pauseGrid .pauseBtn']);
  // (v247) the menu as its template: a card six columns wide -- MENU and its line, six buttons in pairs 36 high with their
  // marks (SIM THE REST's ⏭ its own), BACK TO THE GAME lit along the foot
  { const pm = await page.evaluate(() => { const t = document.createElement('div'); t.style.cssText = 'position:fixed;width:calc(var(--tplC) * 6 + 40px);height:1px'; document.body.appendChild(t); const w6 = t.getBoundingClientRect().width; t.remove();
      const card = document.querySelector('#pauseMenu .pauseMain').getBoundingClientRect(), B = [...document.querySelectorAll('#pauseGrid .pauseBtn')].filter(b => b.getClientRects().length), back = document.querySelector('#pauseGrid .pauseBack');
      return { w: card.width, w6, n: B.length, h: [...new Set(B.map(b => Math.round(b.getBoundingClientRect().height)))].join(), marks: B.filter(b => b.querySelector('.hic svg')).length, lit: getComputedStyle(back).backgroundImage.includes('255, 156, 64'), back: back.textContent.trim(), title: getComputedStyle(document.querySelector('#pauseMenu .pauseTitle')).textAlign }; });
    ok(Math.abs(pm.w - Math.max(300, pm.w6)) <= 1.5 && pm.n === 7 && pm.h === '36' && pm.marks === 6 && pm.lit && pm.back === 'BACK TO THE GAME' && pm.title === 'left',
      w + 'x' + h + ': the menu as its template (v247): six columns wide, MENU to the left, six buttons in pairs with their marks, 36 high, BACK TO THE GAME lit (' + JSON.stringify(pm) + ')'); }
  if(w === 844 && h === 390) ok(!(await page.$('#pauseQuick, #pqMenu')), 'the pause menu: six buttons (SIM THE REST among them, v106), no quick-tactics row');
  await page.tap('#pauseGrid [data-pause="skills"]'); await page.waitForTimeout(300);
  await mcheck('skill moves, in a match', ['#skillsOverlay .pauseTitle', '#skGrid .skCard', '[data-skclose]']);
  { const t0 = await page.evaluate(() => window.__T.sim()); await page.waitForTimeout(400); const t1 = await page.evaluate(() => window.__T.sim());
    await page.tap('[data-skclose]'); await page.waitForTimeout(150);
    const menu = await page.evaluate(() => document.getElementById('pauseMenu').classList.contains('on') && !document.getElementById('skillsOverlay').classList.contains('on'));
    ok(t0 === t1 && menu, w + 'x' + h + ': SKILL MOVES from the pause menu: the match waits while it\'s open, and BACK goes back to the menu'); }
  await page.tap('#pauseGrid [data-pause="tactics"]'); await page.waitForTimeout(200);
  await mcheck('match tactics', ['#mtacOv .bpTopBack', '#mtTeams .bpTab', '#mtViews .bpTab', '#mtacBody .tbDrop', '#mtacBody .mtPanel .tbIns', '#mtacBody .mtGo']);
  const tv = await page.evaluate(() => { const b = document.querySelector('#mtacBody .mtPanel .tbIns'), r = b && b.getBoundingClientRect();
    return { card: !!document.querySelector('#mtacBody .mgCard, #mtacBody .mgCardHead, #mtacBody img.cardBody'), bench: document.querySelectorAll('#mtacBody .tbBench').length, ins: !!b && r.right <= innerWidth && r.bottom <= innerHeight,
      lit: !!(b && b.classList.contains('go')), title: document.getElementById('mtTitle').textContent }; });
  ok(tv.title === 'TACTICS' && !tv.card && !tv.bench && tv.ins && !tv.lit, w + 'x' + h + ': TACTICS in a match (v243): the field on the left, the tactics on the right -- no man\'s card and no bench on it, INSTRUCTIONS among the tactics');
  // (v245) each card's shadow thrown behind it: a shadow of its own where its card stands, every one drawn before the cards
  // (so a card stands in front of its own shadow and its neighbours'), leaning up the field to the right; none off the card itself
  const shd = await page.evaluate(() => { const F = document.querySelector('#mtacBody .tpitch .tvF'), kids = [...F.children], S = kids.filter(e => e.classList.contains('ptkSh')), C = kids.filter(e => e.classList.contains('ptk'));
    const mid = e => { const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2, r.width]; }, by = new Map(S.map(e => [e.dataset.shk, e]));
    const off = Math.max(...C.map(c => { const s = by.get(c.dataset.si), a = mid(c), b = s ? mid(s) : [1e9, 1e9, 0]; return Math.hypot(a[0] - b[0], a[1] - b[1]) + Math.abs(a[2] - b[2]); }));
    const m = /matrix\(([^)]+)\)/.exec(getComputedStyle(S[0], '::before').transform), c = m ? +m[1].split(',')[2] : 0;
    return { n: S.length, cards: C.length, under: Math.max(...S.map(e => kids.indexOf(e))) < Math.min(...C.map(e => kids.indexOf(e))), off: Math.round(off), lean: c, own: getComputedStyle(C[0], '::before').transform }; });
  ok(shd.cards === 9 && shd.n === 9 && shd.under && shd.off <= 1 && shd.lean < -0.5 && shd.own === 'none',
    w + 'x' + h + ': the cards\' shadows (v245): one behind each of the ' + shd.cards + ' cards (' + shd.n + '), where it stands and as wide, every one drawn before the cards, leaning up the field to the right (' + shd.lean.toFixed(2) + ')');
  await page.tap('#mtViews [data-v="swap"]'); await page.waitForTimeout(150);
  await page.tap('#mtacBody .tpitch .ptk[data-mtk="field"] >> nth=1'); await page.waitForTimeout(80); await page.tap('#mtacBody .tbBench .ptk >> nth=0'); await page.waitForTimeout(80);
  await mcheck('player swap', ['#mtacBody .tbBench .ptk', '#mtacBody .mtSide', '#mtacBody .mtCmpRow', '#mtacBody .mtDoSwap', '#mtacBody .mtGo']);
  const lg = await page.evaluate(() => { const L = [...document.querySelectorAll('#mtacBody .mtSide .mtLegs')], go = document.querySelector('#mtacBody .mtDoSwap');
    return { title: document.getElementById('mtTitle').textContent, n: L.length, text: L.map(l => l.firstElementChild.textContent).join(), fig: L.some(l => /\d/.test(l.textContent)), bars: L.filter(l => l.querySelector('.statBar i')).length,
      rows: document.querySelectorAll('#mtacBody .mtCmpRow').length, go: !!go && !go.disabled }; });
  ok(lg.title === 'PLAYER SWAP' && lg.n === 2 && lg.text === 'STAMINA,STAMINA' && !lg.fig && lg.bars === 2 && lg.rows === 6 && lg.go,
    w + 'x' + h + ': PLAYER SWAP in a match (v243): the bench under the field; the man coming off and the man going on, each his STAMINA a bar with no figure, their six face to face, MAKE THE SWAP ready');
  await page.tap('#mtacOv [data-mt="back"]'); await page.waitForTimeout(100); await page.tap('#pauseGrid [data-pause="back"]');
  await page.evaluate(() => window.__T.end()); await page.waitForTimeout(400);
  await mcheck('match report', ['#mrNextBtn', '#matchReport .mrScore']);                     // (v106: THE RESULT, then NEXT)
  await page.tap('#mrNextBtn'); await page.waitForTimeout(150);
  await mcheck('match report, your players', ['#mrContinueBtn', '#matchReport .mrStats']);   //  (YOUR PLAYERS, then CONTINUE)
  ok(!mf.length, w + 'x' + h + ': the pause menu, the match\'s tactics and the report fit' + (mf.length ? ' -- ' + mf.slice(0, 3).join(' | ') : ''));
  await ctx.close();
}

// THE SEASON REVIEW: a long page of the season -- START SEASON 2 stays on the screen (844x340)
{ const ctx = await browser.newContext({ viewport: { width: 844, height: 340 }, isMobile: true, hasTouch: true }); await ctx.addInitScript(STAR);
  const page = await ctx.newPage(); await pileAside(page); page.on('pageerror', e => rep.errs.push('PAGEERROR: ' + e.message));
  await page.goto('file://' + copy); await page.waitForTimeout(700); await newCareer(page);
  await page.evaluate(() => { const M = __MG, d = M.d; let n = 0; while(d.phase !== 'review' && n++ < 300){ if(d.wday === 'mon') M.mgForward(d); else M.mgPlayGame(d, null, null); } M.mgSave(d); M.renderHub(); });
  await page.tap('#chBottom [data-mg="review"]'); await page.waitForTimeout(200);
  const btn = await page.$('#bpFoot [data-mg="rvnext"]') ? '#bpFoot [data-mg="rvnext"]' : '#bpFoot [data-mg="newseason"]';   // (v242: NEXT till the last page)
  const bad = await onScreen(page, [btn, '.bpTopBack', '#bpBody']);
  ok(!bad.length && await page.isVisible(btn), 'the season review: its button (' + (await page.textContent(btn)).trim() + ') pinned on the screen' + (bad.length ? ' -- ' + bad.join(' | ') : ''));
  await ctx.close(); }

// A FINGER: touch a man and move, and he's up at once -- no hold (a tap only shows his card) -- the tactics, on a real touch
{ const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(); await pileAside(page); page.on('pageerror', e => rep.errs.push('PAGEERROR: ' + e.message));
  await page.goto('file://' + copy); await page.waitForTimeout(700); await newCareer(page); await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => { const d = window.__MG.d; d.lv.train = 4; window.__MG.mgSave(d); });
  await page.tap('#chCampus [data-bldg="train"]'); await page.waitForTimeout(150); await page.tap('#bpTabs .bpTab:text-is("Tactics")'); await page.evaluate(() => { const b = document.querySelector('#bpBody [data-tlist="bench"]'); if(b) b.click(); }); await page.waitForTimeout(150);
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
  // the tactics: every man on the pitch with his face (not the bench), his card all of him, no MOVE/SWAP, no essays in the
  // menus -- and (v161) no box for the other phase's man under each spot: WITHOUT tapped, the men slide to their spots
  const tv = await page.evaluate(() => { const c = document.querySelector('#cTacRight img.cardBody');
    return { faces: document.querySelectorAll('#bpBody .tpitch .ptk img.ptkFace').length, men: document.querySelectorAll('#bpBody .tpitch .ptk').length,
      benchMen: document.querySelectorAll('#bpBody .tbBench .ptk').length, benchFaces: document.querySelectorAll('#bpBody .tbBench .ptk img').length,
      ghosts: document.querySelectorAll('#bpBody .tpitch .tpGhost, #bpBody .tpitch i[class*="Ghost"]').length, card: c ? [c.naturalWidth, c.naturalHeight] : null, move: !!document.querySelector('[data-imove]') }; });
  ok(tv.faces === tv.men && tv.men === 9 && tv.benchMen > 0 && !tv.benchFaces, 'every man on the tactics pitch shows his face (' + tv.faces + '/' + tv.men + '); the bench doesn\'t');
  ok(!!tv.card && tv.card[1] > tv.card[0], 'his card shows all of him, head to toe (' + (tv.card || []).join('x') + ')');
  ok(tv.ghosts === 0, 'no box for the other phase\'s man under the spots any more (' + tv.ghosts + ')');
  // ...the shape without the ball a different one: WITHOUT tapped, each man's card slides from his spot with the ball to his spot without it
  const spots = () => page.$$eval('#bpBody .tpitch .ptk', ns => ns.map(e => { const r = e.getBoundingClientRect(); return { k: e.dataset.ri, x: r.left + r.width / 2, y: r.top + r.height / 2, tf: e.style.transform }; }));
  const def0 = await page.evaluate(() => { const M = window.__MG, d = M.d, was = d.formDef, f = Object.keys(M.FORMS).find(x => M.FORMS[x].join() !== M.FORMS[d.formation].join() && !M.ATK_ONLY.includes(x) && !M.DEF_ONLY.includes(x)); M.setCareerForm(d, 'def', f); return was; });   // (other lines: v213, a copy of the shape is next on the list now)
  await page.click('#bpBody [data-ctphase="atk"]'); await page.waitForTimeout(600);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const sp0 = await spots(); await page.click('#bpBody [data-ctphase="def"]'); await page.waitForTimeout(110); const sp1 = await spots(); await page.waitForTimeout(700); const sp2 = await spots();
  const far = (a, b) => a && b && Math.hypot(a.x - b.x, a.y - b.y) > 3, by = (S, k) => S.find(q => q.k === k);
  const moved = sp2.filter(q => far(by(sp0, q.k), q)), between = moved.filter(q => far(by(sp1, q.k), q) && far(by(sp1, q.k), by(sp0, q.k)));
  info('WITHOUT tapped: ' + moved.length + ' of ' + sp2.length + ' men to new spots, ' + between.length + ' of them on their way 0.11 s in');
  ok(moved.length >= 3 && between.length === moved.length && sp2.every(q => !q.tf), 'WITHOUT tapped, the men going elsewhere slide there (' + between.length + ' of ' + moved.length + ' on their way 0.11 s in), and settle on their spots');
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.click('#bpBody [data-ctphase="atk"]'); await page.waitForTimeout(60); const rmS = await spots();
  const jumped = rmS.filter(q => far(by(sp2, q.k), q)), onWay = jumped.filter(q => far(by(sp0, q.k), q));
  ok(jumped.length === moved.length && !onWay.length, 'with Reduce Motion on, they go straight to their spots (' + jumped.length + ' moved, none on the way 0.06 s in)');
  await page.evaluate(was => { const M = window.__MG; M.setCareerForm(M.d, 'def', was); }, def0); await page.click('#bpBody [data-ctphase="atk"]'); await page.waitForTimeout(600);
  // ...and each carries his shirt number, as his token does (under his face; in the corner on the bench)
  const nums = await page.evaluate(() => { const no = el => ((el && el.querySelector('.ptkNo, em')) || {}).textContent || '';
    return { men: [...document.querySelectorAll('#bpBody .tpitch .ptk[data-tac="field"]')].map(no), keeper: no(document.querySelector('#bpBody .tpitch .ptk[data-tac="gk"]')),
      bench: [...document.querySelectorAll('#bpBody .tbBench .ptk')].map(no) }; });
  const allNo = [nums.keeper, ...nums.men, ...nums.bench];
  ok(allNo.every(n => /^#\d+$/.test(n)) && new Set(allNo).size === allNo.length,
    'every man shows his shirt number, on the pitch and the bench (' + nums.men.join(' ') + ')');
  // ...and his own position beside his rating; a winger is an attacker, a wide midfielder a midfielder (WM)
  const own = await page.evaluate(() => { const d = window.__MG.d, all = [...d.roster, ...Object.values(d.world.clubs).flatMap(c => c.players || [])];
    return { toks: [...document.querySelectorAll('#bpBody .tpitch .ptk[data-ri], #bpBody .tbBench .ptk[data-ri]')].map(t => { const p = d.roster[+t.dataset.ri];
        return [(t.querySelector('.ptkPos') || {}).textContent || '', p.role === 'GK' ? 'GK' : p.subRole]; }),
      midStyles: Object.values(window.__MG.STYLES).filter(S => S.role === 'MID').map(S => S.sub + ' ' + S.name), wngNotAtt: all.filter(p => p.subRole === 'WNG' && p.role !== 'ATT').length,
      wm: all.filter(p => p.subRole === 'WM' && p.role === 'MID').length }; });
  ok(own.toks.length === 14 && own.toks.every(([a, b]) => a && a === b), 'every man shows his own position beside his rating, the nine and the bench\'s five (' + own.toks.map(x => x[0]).join(' ') + ')');
  ok(!own.midStyles.some(x => /WNG|Winger/.test(x)) && !own.wngNotAtt && own.wm > 0, 'a winger is an attacker: no midfielder is a winger; wide midfielders are WM (' + own.wm + ' in the world; midfield styles ' + own.midStyles.join(', ') + ')');
  // THE RIGHT COLUMN HAS TWO SIDES: his card (his figure, name, rating and stars, and his ratings: a category opens under the
  // six) and, with INSTRUCTIONS up in the top row left of BEST 9 (v116: before, a button on his card turned it over), the
  // TEAM's instructions (v112: no man's own) -- no ratings, a row a setting and the one note for the row last touched
  const side = () => page.evaluate(() => { const flips = [...document.querySelectorAll('#cTacRight button[data-cside]')], f = flips[0], fr = f && f.getBoundingClientRect(), o = document.querySelector('#cTacRight .mgCardOvr');
    return { six: document.querySelectorAll('#cTacRight .sixC').length, det: document.querySelectorAll('#cTacRight .sixOpen .statRow').length,
      instr: document.querySelectorAll('#cTacRight .tiRow').length, withP: !!document.querySelector('#cTacRight .tiWith .tiGoDef'), head: (document.querySelector('#cTacRight .tiHead') || {}).textContent || '', notes: document.querySelectorAll('#cTacRight .tiNote').length, ovr: !!o, body: !!document.querySelector('#cTacRight .mgCardHead img.cardBody'),
      stars: !!document.querySelector('#cTacRight .stars'), name: (document.querySelector('#cTacRight .mgCardName') || {}).textContent || '',
      flips: flips.length, flip: f ? f.textContent : '', small: !!f && fr.height <= 24 && fr.width <= 90, under: !!f && !!o && fr.top >= o.getBoundingClientRect().bottom - 1,
      seen: [...document.querySelectorAll('#cTacRight .sixOpen .statRow')].every(e => e.getClientRects().length),
      bars: [...document.querySelectorAll('#cTacRight .sixOpen .statBar')].filter(e => e.getClientRects().length && e.getBoundingClientRect().width > 10).length, hd: (document.querySelector('#cTacRight .sixOpen .sixHd') || {}).textContent || '',
      desc: document.querySelectorAll('#cTacRight .instrDesc, #cTacRight .instrNote, #cTacRight .instrHead').length,   /* (the old per-spot panel's) */
      paged: !!document.querySelector('#cTacRight .fitPager'), fits: (b => b.scrollHeight <= b.clientHeight + 1)(document.getElementById('cTacRight')),
      top: [...document.querySelectorAll('#cTacRight .mgCardHead, #cTacRight .mgCardHead > *')].map(e => { const r = e.getBoundingClientRect(); return Math.round(r.width) + 'x' + Math.round(r.height); }).join(' ') }; });
  await page.tap('#bpBody .tpitch .ptk[data-tac="field"] >> nth=6'); await page.waitForTimeout(150);
  const s1 = await side(); await page.tap('#cTacRight [data-six="DEF"]'); await page.waitForTimeout(150); const s2 = await side();
  for(let i = 0; i < 5; i++){ const pv = await page.$('#cTacRight .fitPager [data-fitgo="-1"]:not([disabled])'); if(!pv) break; await pv.tap(); await page.waitForTimeout(60); }   // (back to the six)
  const i1 = await insTop(page, '#bpBody');
  await page.tap('#cTacRight [data-six="DEF"]'); await page.waitForTimeout(100); await page.tap('#bpBody .tbTop .tbIns'); await page.waitForTimeout(150); const s3 = await side(), i3 = await insTop(page, '#bpBody');
  await page.tap('#bpBody .tbTop .tbIns'); await page.waitForTimeout(100); const i4 = await insTop(page, '#bpBody'), s4 = await side();
  info('the card: ' + JSON.stringify({ s1, s2, s3, i1, i3 }));
  ok(s1.flips === 0 && i1.there && i1.left && i1.inside && !i1.lit && s1.six === 6 && !s1.instr && s1.body && s1.ovr && s1.stars,
    'his card: his figure, rating and stars, the six -- nothing on it to turn it over: INSTRUCTIONS is up in the top row, just left of BEST 9');
  ok(s2.six === 6 && s2.det === 4 && s2.seen && s2.bars === 4 && /DEFENDING/.test(s2.hd) && !s2.paged && s2.fits, '...tap one and what it\'s made of opens under the six, its name and a coloured bar for each rating, all of it on the card, no pages (DEF: ' + s2.det + ' ratings, ' + s2.bars + ' bars)');
  ok(i3.lit && s3.flips === 0 && s3.six === 0 && !s3.det && s3.instr === 0 && s3.withP && /^TEAM · WITH THE BALL/.test(s3.head) && s3.notes === 0 && !i4.lit && s4.six === 6,
    'INSTRUCTIONS, lit: the team\'s where his card was -- with the ball (v161) nothing to set, what the side does instead and a button over to WITHOUT THE BALL (' + s3.head + '), no ratings; tapped again, his card');
  ok(!s1.paged && !s3.paged && s1.fits && s3.fits && !s3.desc, 'neither side goes over pages: all of it on the screen');
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
  await page.tap('.bpTopBack'); await page.waitForTimeout(80); await page.tap('#chCampus [data-bldg="train"]'); await page.waitForTimeout(120); await page.tap('#bpTabs .bpTab:text-is("Tactics")'); await page.evaluate(() => { const b = document.querySelector('#bpBody [data-tlist="bench"]'); if(b) b.click(); }); await page.waitForTimeout(150);
  const rm = Object.entries(room).map(([k, v]) => k + ' ' + v.n + ' men, ' + v.top.toFixed(1) + ' px over the number, ' + v.bottom.toFixed(1) + ' under the name').join('; ');
  ok(Object.values(room).every(v => v.n >= 5 && v.top >= 5 && v.bottom >= 2), 'room in every token: ' + rm);
  await page.tap('[data-tdrop="style"]'); await page.waitForTimeout(100);
  const opts = await page.$$eval('.tbMenu .tbOpt', ns => ns.map(n => ({ t: n.textContent, i: n.querySelectorAll('i').length }))), offMenu = await onScreen(page, ['.tbMenu .tbOpt']);
  ok(opts.length === 6 && opts.every(o => !o.i) && !offMenu.length, 'the style menu: six names (v204: one COUNTER-ATTACK), no descriptions, all of it on the screen (' + opts.map(o => o.t).join(', ') + ')' + (offMenu.length ? ' -- ' + offMenu[0] : ''));
  await ctx.close(); }

// A NARROW PHONE (640x360): the bench on one line, each name inside its token and the number clear of the rating; and
// his card fits its box, every man's (his ratings with DEF open, his instructions), with the longest name put out of
// position: his name on one line, his rating amber, and no line of text saying so (nor "on the bench") -- Office and match
{ const ctx = await browser.newContext({ viewport: { width: 640, height: 360 }, isMobile: true, hasTouch: true }); await ctx.addInitScript(STAR);   // (v148: and the controls card taken as seen -- it'd stop PLAY)
  const page = await ctx.newPage(); await pileAside(page); page.on('pageerror', e => rep.errs.push('PAGEERROR: ' + e.message));
  await page.goto('file://' + copy); await page.waitForTimeout(700); await newCareer(page);
  const ri = await page.evaluate(() => { const d = window.__MG.d, lu = d.lineup, on = new Set(lu.atk.concat([lu.gk]));
    const L = ['Kieran Whitlock', 'Tyrese Beaumont', 'Callum Oyelaran', 'Marco Devreese', 'Leo Ahlberg', 'Iker Castillo', 'Yuki Sandoval', 'Dani Bondarenko'];
    let k = 0; d.roster.forEach((p, i) => { if(!on.has(i) && k < L.length) p.name = L[k++]; });
    const f = lu.atk.find(i => d.roster[i].role === 'ATT') ?? lu.atk.find(i => d.roster[i].role !== 'DEF') ?? lu.atk[1], j = lu.atk.indexOf(f);   // a forward
    [lu.atk[0], lu.atk[j]] = [lu.atk[j], lu.atk[0]];                                                                                            // in the first spot: a defender's
    d.roster[f].name = 'Samuel Lindqvist'; d.roster[f].num = 23; d.lv.train = 4; window.__MG.mgSave(d); return f; });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.tap('#chCampus [data-bldg="train"]'); await page.waitForTimeout(150); await page.tap('#bpTabs .bpTab:text-is("Tactics")'); await page.evaluate(() => { const b = document.querySelector('#bpBody [data-tlist="bench"]'); if(b) b.click(); }); await page.waitForTimeout(150);
  const bench = await page.evaluate(() => { const T = [...document.querySelectorAll('#bpBody .tbBench .ptk')], hit = (a, b) => a.right > b.left + 0.5 && a.left < b.right - 0.5 && a.bottom > b.top + 0.5 && a.top < b.bottom - 0.5;
    return { n: T.length, rows: new Set(T.map(t => Math.round(t.getBoundingClientRect().left))).size,   /* (v260: the bench's rows, one column of them) */
      inside: T.every(t => { const r = t.getBoundingClientRect(), n = t.querySelector('.ptkName').getBoundingClientRect(); return n.left >= r.left - 0.5 && n.right <= r.right + 0.5; }),
      clear: T.every(t => !hit(t.querySelector('.ptkNo').getBoundingClientRect(), t.querySelector('.ptkOvr').getBoundingClientRect())) }; });
  ok(bench.n === 5 && bench.rows === 1 && bench.inside && bench.clear, 'a narrow phone (640x360): the bench on one line (its ' + bench.n + ' men), every name inside its token, the number clear of the rating');
  await page.tap(`#bpBody .tpitch .ptk[data-ri="${ri}"]`); await page.waitForTimeout(100);
  const said = () => page.evaluate(() => [...document.querySelectorAll('#cTacRight .tbCard .rWhy')].map(e => e.textContent).join(' | '));   // (v152: why his number isn't his rating, under it)
  const head = await page.evaluate(() => { const h = document.querySelector('#cTacRight .mgCardHead'), nm = h.querySelector('.mgCardName'), fs = e => parseFloat(getComputedStyle(e).fontSize), o = h.querySelector('.mgCardOvr');
    return { name: nm.textContent, oneLine: nm.getBoundingClientRect().height < fs(nm) * 2, whole: nm.scrollWidth <= nm.clientWidth + 1, amber: /var\(--warn\)/.test(o.getAttribute('style') || '') }; });
  const oopSaid = await said(); await page.tap('#bpBody .tbBench .ptk >> nth=0'); await page.waitForTimeout(100); const benchSaid = await said();
  info('out of position: ' + JSON.stringify({ head, oopSaid, benchSaid }));
  ok(head.oneLine && head.whole && head.amber && /^\d+ → \d+ · out of position( \| today \d+ · .+)?$/.test(oopSaid) && !/out of position|on the bench|in reserve|subbed off/.test(benchSaid),
    '...the longest name out of position: "' + head.name + '" whole on one line, his rating amber, and why under it (v152: "' + oopSaid + '"); a man on the bench, nothing saying so');
  const fits = sel => page.evaluate(sel => { const b = document.querySelector(sel); return b.scrollHeight <= b.clientHeight + 1 && !b.querySelector('.fitPager'); }, sel);
  const walk = async (sel, toks, ins) => { const n = await page.$$eval(toks, ns => ns.length), bad = []; let views = 0;
    for(let i = 0; i < n; i++){ await page.tap(`${toks} >> nth=${i}`); await page.waitForTimeout(60);
      if(await page.$(sel + ' [data-six="DEF"]')){ await page.tap(sel + ' [data-six="DEF"]'); await page.waitForTimeout(60); views++; if(!await fits(sel)) bad.push(i + ' DEF'); await page.tap(sel + ' [data-six="DEF"]'); await page.waitForTimeout(40); }
      const fl = await page.$(ins + '[data-cside="instr"]'); if(fl){ await fl.tap(); await page.waitForTimeout(60); views++; if(!await fits(sel)) bad.push(i + ' instr'); await page.tap(ins); await page.waitForTimeout(40); } }
    return { n, views, bad }; };
  const wo = await walk('#cTacRight', '#bpBody .tpitch .ptk[data-tac]', '#bpBody .tbTop .tbIns');
  // (and the team's instructions without the ball: the lines' pitch above the rows -- the tallest of them)
  await page.tap('#bpBody [data-ctphase="def"]'); await page.waitForTimeout(100); await page.tap('#bpBody .tbTop .tbIns'); await page.waitForTimeout(150);
  if(!await fits('#cTacRight') || !(await page.$('#cTacRight .tiPitch'))) wo.bad.push('team without the ball'); else wo.views++;
  await page.tap('#bpBody .tbTop .tbIns'); await page.waitForTimeout(80); await page.tap('#bpBody [data-ctphase="atk"]'); await page.waitForTimeout(100);
  await page.tap('.bpTopBack'); await page.waitForTimeout(100);
  for(let i = 0; i < 8; i++){ if(!(await page.$('#chBottom [data-mg="forward"]'))) break; await page.tap('#chBottom [data-mg="forward"]'); await page.waitForTimeout(100); }   // (by its selector: the Monday papers put aside redraw the hub)
  await page.tap('#chBottom [data-mg="play"]'); await page.waitForTimeout(1200);
  const hw = await hudWin(page);
  ok(winOk(hw, true), '...in a match, your man\'s window at the top right beside the menu, his name whole (' + hw.num + ' ' + hw.name + ' ' + hw.pos + ')' + (winOk(hw, true) ? '' : ' ' + JSON.stringify(hw)));
  await page.evaluate(() => document.getElementById('menuBtn').click()); await page.waitForTimeout(150);
  await page.tap('#pauseGrid [data-pause="tactics"]'); await page.waitForTimeout(200);
  // (v243: no man's card in a match -- TACTICS, the instructions with the ball and without fitting beside the field; then
  // PLAYER SWAP, three men on the pitch each against two on the bench, the two side by side fitting every time)
  const mp = await apart(page, '#mtacOv .tpitch'), wm = { views: 0, bad: [] };
  for(const ph of ['atk', 'def']){ await page.tap(`#mtacOv .mtPanel [data-mtph="${ph}"]`); await page.waitForTimeout(80); await page.tap('#mtacOv .mtPanel .tbIns'); await page.waitForTimeout(120); wm.views++;
    if(!(await page.$('#mtacOv .mtInsV' + (ph === 'def' ? ' .tiRow' : ''))) || !await fits('#mtacOv .tbRight')) wm.bad.push('instructions ' + ph); await page.tap('#mtacOv .mtPanel .tbIns'); await page.waitForTimeout(80); }   // (with the ball, nothing to set: a word and WITHOUT THE BALL)
  await page.tap('#mtacOv .mtPanel [data-mtph="atk"]'); await page.waitForTimeout(80);
  await page.tap('#mtViews [data-v="swap"]'); await page.waitForTimeout(150); const ps = await apart(page, '#mtacOv .tpitch');
  for(let i = 0; i < 3; i++) for(let j = 0; j < 2; j++){ const f = `#mtacOv .tpitch .ptk[data-mtk="field"] >> nth=${i}`, b = `#mtacOv .tbBench .ptk >> nth=${j}`;
    await page.tap(f); await page.waitForTimeout(50); await page.tap(b); await page.waitForTimeout(60); wm.views++;
    if(!await fits('#mtacOv .tbRight') || (await page.$$('#mtacOv .mtCmpRow')).length !== 6) wm.bad.push('swap ' + i + '/' + j);
    await page.tap(f); await page.waitForTimeout(40); await page.tap(b); await page.waitForTimeout(40); }
  ok(mp.n === 9 && !mp.over && !mp.out && ps.n === 9 && !ps.over && !ps.out, '...in a match (v243), TACTICS and PLAYER SWAP: the match\'s pitch on both, nobody overlapping or hanging off it');
  ok(wo.views >= 14 && wm.views >= 8 && !wo.bad.length && !wm.bad.length, '...and every man\'s card fits its box, DEF open and his instructions: ' + wo.views + ' views in the Office; in a match the instructions with and without the ball and six men off against men on (v243: no man\'s card), ' + wm.views + ' views' + (wo.bad.length || wm.bad.length ? ' -- over: ' + wo.bad.concat(wm.bad).join(', ') : ''));
  await ctx.close(); }

// A MAN'S CARD IN A BUILDING (the squad, the market, the academy) never goes over pages, any side -- his ratings (a
// category open), his deal or his career -- and has no long text on it; and a full squad's bench is its five on one line, the pitch
// keeping its height, with everyone in the Selection tab's three columns, all on the screen -- on the shortest phone
// (844x340) and the narrowest (640x360)
for(const [w, h] of [[844, 340], [640, 360]]){
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true }); await ctx.addInitScript(STAR);
  const page = await ctx.newPage(); await pileAside(page); page.on('pageerror', e => rep.errs.push('PAGEERROR: ' + e.message));
  await page.goto('file://' + copy); await page.waitForTimeout(700); await newCareer(page);
  const R = await page.evaluate(() => { const d = window.__MG.d, R = d.roster, other = Object.values(d.world.clubs).filter(c => c.id !== d.clubId);
    d.listed[R[3].id] = 900; R[3].ovr = 85; d.offers = d.offers || []; d.offerSeq = d.offerSeq || 0;   // a man listed, a man with three bids, the longest name (v230: the listed man rated 85 -- a new deal's six-figure wage, its row the longest)
    for(const [k, fee] of [[0, 12500], [1, 9800], [2, 9000]]) d.offers.push({ id: ++d.offerSeq, pid: R[5].id, club: other[k].id, fee });
    R[0].name = 'Samuel Lindqvist'; window.__MG.mgSave(d); return R.map(p => String(p.id)); });
  const card = () => page.evaluate(() => { const P = document.querySelector('.mgPaneR .mgPaneScroll'), c = P && P.querySelector('.mgCard');
    return { fits: !!P && P.scrollHeight <= P.clientHeight + 1 && P.scrollWidth <= P.clientWidth + 1, paged: !!(P && P.querySelector('.fitPager')), flips: c ? c.querySelectorAll('.mgSides [data-mside]').length : 0, tabsIn: (t => !!t && !!P && t.getBoundingClientRect().bottom <= P.getBoundingClientRect().bottom + 1)(c && c.querySelector('.mgSides')),
      tabH: c && c.querySelector('.mgSideT') ? Math.round(c.querySelector('.mgSideT').getBoundingClientRect().height) : 0, tabCut: c ? [...c.querySelectorAll('.mgSideT')].filter(b => b.scrollWidth > b.clientWidth + 1).map(b => b.textContent) : [],
      long: c ? [...c.querySelectorAll('.mgHint')].concat([...c.querySelectorAll('*')].filter(e => !e.closest('.mgCardHead') && !e.children.length && e.textContent.trim().length > 32)).map(e => e.textContent.trim().slice(0, 40)) : ['no card'],
      cut: c ? [...c.querySelectorAll('.mgFact b')].filter(b => b.scrollWidth > b.clientWidth + 1).map(b => b.textContent) : [],
      over: P && P.scrollHeight > P.clientHeight + 1 ? P.scrollHeight + ' in ' + P.clientHeight + '; two lines: ' + [...P.querySelectorAll('*')].filter(e => !e.children.length && e.textContent.trim() && e.getClientRects().length > 1).map(e => e.textContent.trim().slice(0, 24)).join(' | ') : '' }; });
  const views = [], bad = [];
  const walk = async (bldg, tab, pids) => { await page.tap(`#chCampus [data-bldg="${bldg}"]`); await page.waitForTimeout(150); await page.tap(`#bpTabs .bpTab:text-is("${tab}")`); await page.waitForTimeout(150);
    const ids = pids || await page.$$eval('.mgPaneL .mgRow:not(.fitHide)', ns => ns.slice(0, 3).map(n => n.dataset.pid));
    for(const id of ids){ await page.evaluate(id => document.querySelector(`.mgPaneL .mgRow[data-pid="${id}"]`).click(), id); await page.waitForTimeout(80);
      if(await page.$('.mgPaneR .sqSum')){   // (v252: the squad's man in short -- his well, five rows, SELL and NEW DEAL, all in its box; then his card, a tap on his well)
        const s = await page.evaluate(() => { const B = document.querySelector('.mgPaneR'), br = B.getBoundingClientRect(), S = B.querySelector('.sqSum');
          const out = [...S.querySelectorAll('*')].filter(e => { const r = e.getBoundingClientRect(); return r.height > 0 && (r.bottom > br.bottom + 1 || r.right > br.right + 1); }).map(e => e.className).slice(0, 3);
          return { out, rows: S.querySelectorAll('.sqKv').length, btns: [...S.querySelectorAll('.sqFoot .tplBtn')].map(b => b.textContent).join(' / '), cut: [...S.querySelectorAll('.sqKv b, .tplBtn')].filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent) }; });
        views.push(s); if(s.out.length || (tab === 'Squad' ? s.rows !== 5 || s.btns !== 'SELL / NEW DEAL' : s.rows < 4) || s.cut.length) bad.push(tab + ' in short ' + JSON.stringify(s));   // (v257: the market's men in short too, their own buttons)
        await page.tap('.mgPaneR .sqMan'); await page.waitForTimeout(60); }
      for(const side of ['rate', 'deal', 'career', 'mind']){   // (his card's four sides, a tab each along its foot: v116)
        const tb = await page.$(`.mgPaneR .mgSides [data-mside="${side}"]`); if(tb){ await tb.tap(); await page.waitForTimeout(60); }
        const r = await card(); views.push(r); if(!r.fits || r.paged || r.long.length || r.cut.length || r.flips !== 4 || !r.tabsIn || r.tabH < 28 || r.tabCut.length) bad.push(tab + ' ' + side + ' ' + JSON.stringify(r));
        if(side === 'rate' && await page.$('.mgPaneR [data-six="DEF"]')){ await page.tap('.mgPaneR [data-six="DEF"]'); await page.waitForTimeout(60);
          const r2 = await card(); views.push(r2); if(!r2.fits || r2.paged) bad.push(tab + ' DEF open'); await page.tap('.mgPaneR [data-six="DEF"]'); await page.waitForTimeout(40); } } }
    await page.tap('.bpTopBack'); await page.waitForTimeout(100); };
  await page.evaluate(() => { const M = window.__MG, d = M.d; d.budget = 1e9; d.top = 4; while(M.lvOf(d, 'club') < 3) M.bldUp(d, 'club');   // (on the market, and the academy, to look at its prospects)
    M.mgMarketOpen(d); M.bldUp(d, 'academy'); d.lv.train = 4; d.budget = 1e6; M.mgSave(d); M.renderHub(); });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await walk('club', 'Squad', [R[0], R[3], R[5]]); await walk('market', 'Selling', [R[3], R[5]]); await walk('market', 'Search'); await walk('market', 'Free agents'); await walk('academy', 'Prospects');
  ok(views.length >= 30 && !bad.length, w + 'x' + h + ': a man\'s card in a building never goes over pages, any of its four sides, its tabs along its foot (28 px and taller, every label whole), no long text on it, no fact cut short (' + views.length + ' views: the squad, selling with three bids, the market, free agents, the academy)' + (bad.length ? ' -- ' + bad.slice(0, 2).join(' | ') : ''));
  await page.tap('#chCampus [data-bldg="train"]'); await page.waitForTimeout(150); await page.tap('#bpTabs .bpTab:text-is("Tactics")'); await page.evaluate(() => { const b = document.querySelector('#bpBody [data-tlist="bench"]'); if(b) b.click(); }); await page.waitForTimeout(200);
  const pitch0 = await page.$eval('#bpBody .tpitch', e => Math.round(e.getBoundingClientRect().height));
  const grow = n => page.evaluate(n => { const d = window.__MG.d; let id = 990000 + d.roster.length; while(d.roster.length < n){ const p = JSON.parse(JSON.stringify(d.roster[d.roster.length % 15])); p.id = ++id; p.num = d.roster.length + 1; d.roster.push(p); d.lineup.bench.push(d.roster.length - 1); } window.__MG.mgSave(d); }, n);
  const redraw = async () => { await page.tap('#bpTabs .bpTab:text-is("Pitch")'); await page.waitForTimeout(120); await page.tap('#bpTabs .bpTab:text-is("Tactics")'); await page.evaluate(() => { const b = document.querySelector('#bpBody [data-tlist="bench"]'); if(b) b.click(); }); await page.waitForTimeout(250); };
  const bs = () => page.evaluate(() => { const B = document.querySelector('#bpBody .tbBench'), vis = [...B.querySelectorAll('.ptk')].filter(t => t.getClientRects().length), pg = B.querySelector('.benchPg');
    const col = getComputedStyle(B).flexDirection === 'column', at = t => Math.round(col ? t.getBoundingClientRect().left : t.getBoundingClientRect().top);   // (v226: down the pitch's side on a wider phone -- one column)
    return { men: B.querySelectorAll('.ptk').length, rows: new Set(vis.map(at)).size, col, pager: pg && pg.getClientRects().length ? pg.textContent : '',
      pitch: Math.round(document.querySelector('#bpBody .tpitch').getBoundingClientRect().height) }; });
  // ...and the Selection tab: the whole squad, a bar a man in three boxes (the nine; the bench over the rest, three of
  // them to a page; the quick subs), no faces, every bar on the page the same height, all of them on the screen
  const sel = async () => { await page.tap('#bpTabs .bpTab:text-is("Selection")'); await page.waitForTimeout(200);
    const o = await page.evaluate(() => { const C = [...document.querySelectorAll('#bpBody .selCol:not(.qpCol)')], rows = [...document.querySelectorAll('#bpBody .selRow')], vis = rows.filter(r => r.getClientRects().length), hs = vis.map(r => r.getBoundingClientRect().height);
      return { cols: C.map(c => c.dataset.grp + ' ' + c.querySelectorAll('.selRow').length).join(', '), order: rows.map(r => +r.dataset.k).every((k, i) => k === i), imgs: document.querySelectorAll('#bpBody .selB img').length,
        h: [Math.round(Math.min(...hs)), Math.round(Math.max(...hs))], inside: vis.every(r => { const b = r.getBoundingClientRect(); return b.top >= 0 && b.bottom <= innerHeight && b.left >= 0 && b.right <= innerWidth; }),
        shown: vis.length, pg: (document.querySelector('#bpBody .selPg b') || {}).textContent || '' }; });
    await page.tap('#bpTabs .bpTab:text-is("Tactics")'); await page.evaluate(() => { const b = document.querySelector('#bpBody [data-tlist="bench"]'); if(b) b.click(); }); await page.waitForTimeout(200); return o; };
  await grow(21); await redraw(); const f = await bs(), s20 = await sel();   // a full squad: nine on the pitch, the bench's five, seven not taken
  ok(f.men === 5 && f.rows === 1 && !f.pager && f.pitch === pitch0 && s20.cols === 'xi 9, bench 5, rest 7' && s20.order && !s20.imgs && s20.h[0] === s20.h[1] && s20.h[0] >= 26 && s20.inside && s20.shown === 17 && s20.pg === '1 / 3',
    w + 'x' + h + ': a full squad of 21: beside the pitch just the bench\'s five, on one line (' + (f.col ? 'down its side' : 'under it') + ') with no pager, the pitch keeping its height (' + f.pitch + ' px); the Selection tab has all twenty-one, '
    + s20.cols + ', in order, no faces, the seven not taken three to a page (' + s20.pg + '), every bar ' + s20.h[0] + ' px tall and on the screen');
  await grow(23); await redraw(); const b1 = await bs(), s22 = await sel();   // (a squad from before the limit)
  ok(b1.men === 5 && b1.rows === 1 && !b1.pager && b1.pitch === pitch0 && s22.cols === 'xi 9, bench 5, rest 9' && s22.order && s22.h[0] === s22.h[1] && s22.h[0] >= 26 && s22.inside && s22.shown === 17 && s22.pg === '1 / 3',
    w + 'x' + h + ': a squad of 23 from before: still just the five beside the pitch; the Selection tab\'s rest nine long, three to a page (' + s22.pg + '), its bars ' + s22.h[0] + ' px, all on the screen');
  await ctx.close(); }

// AS WIDE AS THE PHONE: no bands -- the game screen is the screen, wider than 920 (more pitch across); the buttons
// stand over its bottom-right corner, the stick starts anywhere on the left, and the HUD (v228: as the Studio's match
// screen has it) is the clock and the score on the left; SUBS, the way you're kicking, THEIR MAN, your man's window and
// the menu on the right -- and the buttons where it puts them, PASS the biggest
{ const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(); await pileAside(page); page.on('pageerror', e => rep.errs.push('PAGEERROR: ' + e.message));
  await page.goto('file://' + copy); await page.waitForTimeout(700);
  await page.tap('#smItems [data-act="exhibition"]'); await page.waitForTimeout(250); await page.tap('#exhGo'); await page.waitForTimeout(1200);
  const g = await page.evaluate(() => { const s = document.getElementById('stageWrap').getBoundingClientRect(), c = document.getElementById('c'), b = ['kickBtn','shootBtn','crossBtn','skillBtn'].map(id => document.getElementById(id).getBoundingClientRect());
    return { left: s.left, width: s.width, height: s.height, W: c.width, inside: b.every(r => r.left >= s.left && r.right <= s.right + 1 && r.bottom <= s.bottom + 1 && r.left > s.left + s.width * 0.6 && r.top > s.top + s.height * 0.35),
      chips: [...document.querySelectorAll('#readout .chip')].filter(e => getComputedStyle(e).display !== 'none').map(e => e.id || e.textContent.trim().slice(0, 6)),
      at: Object.fromEntries([...document.querySelectorAll('#readout .chip')].filter(e => getComputedStyle(e).display !== 'none').map(e => { const r = e.getBoundingClientRect(); return [e.id, [+(r.left - s.left).toFixed(1), +(s.right - r.right).toFixed(1), +r.width.toFixed(1)]]; })),
      btn: Object.fromEntries(['kickBtn','shootBtn','crossBtn','skillBtn'].map((id, i) => [id, [+b[i].width.toFixed(1), +(s.right - b[i].right).toFixed(1), +(s.bottom - b[i].bottom).toFixed(1)]])) }; });
  ok(g.left === 0 && Math.abs(g.width - 844) < 1 && Math.abs(g.height - 390) < 2 && g.W > 1100, 'the game fills the phone: ' + Math.round(g.width) + 'x' + Math.round(g.height) + ', ' + g.W + ' wide inside (no bands)');
  ok(g.inside, 'the buttons stand over the bottom-right corner of the pitch, as they did before the bands');
  ok(g.chips.join(' ') === 'rBox qsBtn rDir rTheir rPlayer menuBtn', 'the HUD (v228: the Studio\'s match screen; v232: the clock and the score one box): the score box; SUBS, the way you\'re kicking, THEIR MAN, your man\'s window and the menu -- no ? (the controls are in the menu), no ball speed, possession or touch grade (' + g.chips.join(' ') + ')');
  // (where the Studio puts them, on its 852 x 393 phone: the clock 34 px in, the menu 26 px from the right, 11.5 px
  // between; your man's window 169 wide, theirs 90.5, the menu 32 -- and the buttons from the bottom-right corner)
  { const A = g.at, ids = g.chips, near = (a, b, t = 1) => Math.abs(a - b) <= t, gaps = ids.slice(1).map((id, i) => +(A[id][0] - (g.width - A[ids[i]][1])).toFixed(1));
    info('the HUD at 844 x 390: ' + JSON.stringify({ at: A, btn: g.btn, gaps }));
    ok(near(A.rBox[0], 34) && near(A.rBox[2], 122) && near(A.menuBtn[1], 26) && near(A.menuBtn[2], 32) && near(A.rPlayer[2], 169) && near(A.rTheir[2], 90.5)
      && ['rDir', 'rTheir', 'rPlayer', 'menuBtn'].every(id => near(gaps[ids.indexOf(id) - 1], 11.5)),
      'the row where the Studio has it: the score box ' + A.rBox[0] + ' px in and ' + A.rBox[2] + ' wide (v232), the menu ' + A.menuBtn[1] + ' px from the right, ' + gaps.join(' / ') + ' px between; your man\'s window ' + A.rPlayer[2] + ' wide, theirs ' + A.rTheir[2] + ', the menu ' + A.menuBtn[2]);
    const B = g.btn, want = { kickBtn: [96, 42, 21], shootBtn: [64, 42, 132.5], crossBtn: [64, 158.5, 26], skillBtn: [58, 132.5, 117] };
    ok(Object.keys(want).every(k => want[k].every((v, i) => near(B[k][i], v))), 'the buttons where the Studio has them, from the bottom-right corner (size, right, bottom): PASS ' + B.kickBtn.join('/') + ', SHOOT ' + B.shootBtn.join('/') + ', CROSS ' + B.crossBtn.join('/') + ', SKILL ' + B.skillBtn.join('/')); }
  // (v232) the match screen as the scoreboard mockups have it: the score box (the clock in its well, in orange, its half
  // under it; the crests or the clubs' letters; the score in a narrow panel), the rest of the row a well and a panel
  // each at 36 px, and the buttons rings in their own colours with a drawing over the name
  const look = await page.evaluate(() => { const cs = (id, ps) => getComputedStyle(document.getElementById(id), ps), R = id => document.getElementById(id).getBoundingClientRect();
    const btn = id => { const c = cs(id), b = cs(id, '::before'); return { ring: /inset/.test(c.boxShadow) && /radial-gradient/.test(c.backgroundImage), ico: /svg/.test(b.webkitMaskImage || b.maskImage || ''), w: Math.round(R(id).width) }; };
    return { box: [Math.round(R('rBox').width), Math.round(R('rBox').height)], well: Math.round(R('rClockChip').width), clock: cs('rClock').color, half: document.getElementById('rHalf').textContent,
      nums: Math.round(document.querySelector('#rScore .sbNums').getBoundingClientRect().width), right: ['qsBtn', 'rDir', 'rTheir', 'rPlayer', 'menuBtn'].map(id => Math.round(R(id).height)),
      wells: ['qsBtn', 'rTheir', 'rPlayer'].every(id => document.querySelector('#' + id + ' .hW') && document.querySelector('#' + id + ' .hW').getBoundingClientRect().width > 20),
      btns: ['kickBtn', 'shootBtn', 'crossBtn', 'skillBtn'].map(btn),
      // (v233) by each side's score a strip in the shirt it's wearing
      strips: ['::before', '::after'].map(ps => getComputedStyle(document.querySelector('#rScore .sbNums'), ps).backgroundColor),
      shirts: ['G', 'R'].map(t => { const h = window.__T.shirt(t); return 'rgb(' + [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)).join(', ') + ')'; }) }; });
  info('the match screen\'s look (v232): ' + JSON.stringify(look));
  ok(look.box[0] === 122 && look.box[1] === 46 && look.well >= 60 && look.clock === 'rgb(255, 156, 64)' && /^(1ST|2ND) HALF$/.test(look.half) && look.nums === 28 && look.right.every(h => h === 36) && look.wells
     && look.btns.every(b => b.ring && b.ico),
    'the match screen as the mockups have it (v232): one score box ' + look.box.join(' x ') + ' -- the clock in orange in its well, "' + look.half + '" under it, the score in a ' + look.nums + ' px panel; SUBS, THEIR MAN and YOUR MAN a well and a panel each, the row 36 px; every button a ring with a drawing over its name');
  ok(look.strips[0] === look.shirts[0] && look.strips[1] === look.shirts[1] && look.strips[0] !== look.strips[1],
    'by each side\'s score a strip in the shirt it\'s wearing (v233): ' + look.strips.join(' over ') + ' -- the shirts on the pitch ' + look.shirts.join(' and '));
  // ...and when the shirts clash, the change kit's: Liverpool out of red against Arsenal (then the sides as they were)
  const clash = await page.evaluate(() => { const T = window.__T, was = T.sides(), n = document.querySelector('#rScore .sbNums'), col = ps => getComputedStyle(n, ps).backgroundColor;
    T.sides('ARS', 'LIV'); const r = { top: col('::before'), bottom: col('::after'), shirt: T.shirt('R') }; T.sides(was[0], was[1]); return r; });
  ok(clash.top === 'rgb(212, 32, 42)' && clash.bottom === 'rgb(14, 59, 46)' && clash.shirt === '#0e3b2e',
    '...the change kit\'s when the shirts clash: Arsenal\'s red ' + clash.top + ' over Liverpool\'s change green ' + clash.bottom);
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
  const settle = async () => { let x = null; for(let i = 0; i < 40; i++){ await page.waitForTimeout(100); const x2 = await page.evaluate(() => window.__T.camX()); if(x !== null && Math.abs(x2 - x) < 1) return; x = x2; } };   // (the camera gone over to the ball, and still: v125, a longer way on the longer pitch)
  for(let k = 0; k < 3 && !(mate && n2 === mate.num); k++){
    await page.evaluate(() => window.__T.theirBall()); await settle();
    mate = await page.evaluate(() => { const T = window.__T; const c = T.controlled(); for(const q of T.players()){ if(q.team !== c.team || q === c || q.role === 'G') continue; const s = T.scr(q); if(s.x > 20 && s.x < 440 && s.y > 60 && s.y < 330 && T.mateAt(s.x, s.y) === q) return { num: q.num, x: s.x, y: s.y }; } return null; });
    if(!mate) break; await touch('touchStart', mate.x, mate.y); n2 = await who(); await touch('touchEnd', mate.x, mate.y); }
  ok(grass && n1 === n0 && mate && n2 === mate.num, 'a tap on the grass doesn\'t switch you (#' + n0 + ' still); a tap on one of your men does (#' + n2 + ')');
  // (v228) THEIR MAN, beside yours: theirs on the ball -- his number, surname and position, and his stamina
  const th = await page.evaluate(() => new Promise(res => { const T = window.__T; T.theirBall(); const o = T.players().find(p => p.team !== T.controlled().team && p.role !== 'G');
    requestAnimationFrame(() => requestAnimationFrame(() => { const nm = document.getElementById('rtName'), bar = document.getElementById('rtSt');
      res({ num: document.getElementById('rtNum').textContent, name: nm.textContent, pos: document.getElementById('rtPos').textContent, oNum: o.num, oName: String(o.pname || ''), oSt: +o.stamina.toFixed(3),
        fill: +(bar.getBoundingClientRect().width / bar.parentElement.getBoundingClientRect().width).toFixed(3), xpl: document.getElementById('rTheir').dataset.xpl }); })); }));
  ok(th.num === '#' + th.oNum && th.name === th.oName.split(' ').slice(-1)[0] && th.pos.length >= 2 && Math.abs(th.fill - th.oSt) <= 0.03 && th.xpl === 'their',
    'THEIR MAN, beside yours: theirs on the ball, ' + th.num + ' ' + th.name + ' ' + th.pos + ', his stamina ' + Math.round(th.fill * 100) + '% -- and a tap says what it is (v228)' + (th.num === '#' + th.oNum ? '' : ' ' + JSON.stringify(th)));
  await ctx.close(); }

// (v224) SKILL MOVES WHEN THE FIRST FRAME IS STAMPED BEFORE THE PAGE OPENED: a frame's time can be a moment before the
// tap that opened the page (a busy phone, or a tap handled inside a frame). The clips used to go to frame -1 then, the
// ball had no picture, and the throw stopped every clip for good; now they start at 0 and play, nothing thrown
{ const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true }); await ctx.addInitScript(STAR);
  const page = await ctx.newPage(); await pileAside(page); const errs = []; page.on('pageerror', e => errs.push(e.message.slice(0, 70)));
  await page.goto('file://' + copy); await page.waitForTimeout(700);
  await page.evaluate(() => { const real = performance.now.bind(performance); performance.now = () => real() + 80;   // (the page opened 80 ms "after" the next frames)
    try{ document.querySelector('#smItems [data-act="skills"]').click(); } finally { performance.now = real; } });
  await page.waitForTimeout(500);
  const px = () => page.evaluate(() => [...document.querySelectorAll('#skGrid .skCard')].filter(c => c.getClientRects().length).map(c => { const cv = c.querySelector('.skClip'), d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
    let h = 0; for(let i = 0; i < d.length; i += 4) h = (h * 31 + d[i] + d[i + 1] * 3 + d[i + 2] * 7) >>> 0; return h; }));
  const a = await px(); await page.waitForTimeout(450); const b = await px();
  ok(!errs.length && a.length > 0 && a.some((h, i) => b[i] !== undefined && h !== b[i]), 'SKILL MOVES opened with the first frames stamped before it: the clips play from the start, nothing thrown (' + (errs[0] || 'no errors') + ') (v224)');
  await ctx.close(); }

process.exitCode = rep.finish();
await browser.close();
