// FOOTBALL CLASSIC, THE WEEK'S MONEY ON A PHONE (v160), the smallest iPhone held sideways (667x375, touch only): NET/WK
// on the campus opens the week's money -- this week so far, last week, a league week projected -- and its lines page
// (◀ 1 / 3 ▶) between the title and BACK, as every card's do, so BACK is always on the screen and every line is on one
// of the pages; the arrows and a tap on the card leave it open; BACK closes it, and it opens again on its first page;
// and a tap anywhere outside the card closes it too. Before, the lines were the card's own and ran 300 px past the foot
// of the screen, BACK with them: the week's money couldn't be left. The same tap outside closes HOW TO PLAY and SKILL
// MOVES, the cards only to be read -- not the one before your first match, whose button is KICK OFF. On a copy the test
// can reach.
import { chromium } from 'playwright';
import { STAR, pileAside, reporter } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  let INJ_OFF=false;', '  let INJ_OFF=true;');
patch('  // ===== END MANAGER CAREER', '  window.__K={ ev:s=>eval(s) };\n  // ===== END MANAGER CAREER');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-ldg-')), 'classic.html');
writeFileSync(copy, src);

const rep = reporter(); const { ok, info } = rep;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 667, height: 375 }, isMobile: true, hasTouch: true }); await ctx.addInitScript(STAR);
const page = await ctx.newPage(); await pileAside(page);
page.on('pageerror', e => rep.errs.push('PAGEERROR: ' + e.message));
await page.goto('file://' + copy); await page.waitForTimeout(700);
const K = s => page.evaluate(s => window.__K.ev(s), s);
const isOn = id => K(`document.getElementById('${id}').classList.contains('on')`);
// a point on the dimmed screen round a card, outside it: the middle of the widest margin
const outside = sel => page.evaluate(sel => { const r = document.querySelector(sel).getBoundingClientRect(), W = innerWidth, H = innerHeight;
  const m = [[r.left, r.left / 2, H / 2], [W - r.right, (r.right + W) / 2, H / 2], [r.top, W / 2, r.top / 2], [H - r.bottom, W / 2, (r.bottom + H) / 2]].sort((a, b) => b[0] - a[0])[0];
  return { x: m[1], y: m[2], room: Math.round(m[0]) }; }, sel);

// --- a career some weeks into its season, by taps ------------------------------------------------------------------------------
await page.tap('#smItems [data-act="new"]'); await page.waitForTimeout(200);
await page.tap('#newSlotList .slotBtn >> nth=0'); await page.waitForSelector('#mgrMaker.on', { timeout: 4000 });
await page.fill('#mgName', 'Sam Okafor'); await page.fill('#mgClubIn', 'Ledger Town');
await page.tap('#mgGo'); await page.waitForSelector('#careerHub.show', { timeout: 8000 });
const wk = await K(`(()=>{ const d=CAREER.data; d.story={vet:2,kid:2,phone:2}; mgStoryShow(d); if(d.fw) d.fw.off=true; let i=0;
  while(i<80&&(d.phase!=='league'||(d.weeks||0)<4)){ if(mgNextGame(d)&&d.wday!=='mon') mgSim(d); else mgForward(d); i++; }
  MGUI.noPile=true; pileHide(); for(const id of ['pressModal','moneyModal','pileModal','storyModal']) document.getElementById(id).classList.remove('on');
  document.getElementById('matchReport').style.display='none'; MGUI.seq=null; d.press=null; renderHub(); return { phase:d.phase, weeks:d.weeks, prev:!!d.wlPrev }; })()`);
await page.waitForTimeout(300);
info('the career: ' + JSON.stringify(wk));

// --- NET/WK: the week's money, all of it on the screen ---------------------------------------------------------------------------
await page.tap('#chNetBtn'); await page.waitForTimeout(350);
const card = () => K(`(()=>{ const c=document.querySelector('#ldgModal .ldgCard'), cr=c.getBoundingClientRect(), b=c.querySelector('[data-ldg="close"]'), br=b.getBoundingClientRect(), at=document.elementFromPoint(br.left+br.width/2,br.top+br.height/2);
  const shown=[...c.querySelectorAll('.ldgSect,.ldgRow,.ldgNote')].filter(e=>e.getClientRects().length&&!e.closest('.fitHide')).map(e=>e.textContent.trim());
  const all=[...c.querySelectorAll('.ldgSect,.ldgRow,.ldgNote')].map(e=>e.textContent.trim());
  const pg=c.querySelector('.fitPager b'); return { on:document.getElementById('ldgModal').classList.contains('on'), top:Math.round(cr.top), bottom:Math.round(cr.bottom), vh:innerHeight,
    back:[Math.round(br.top),Math.round(br.bottom)], backHit:!!at&&(at===b||b.contains(at)), cut:c.scrollHeight-c.clientHeight, pager:pg?pg.textContent:null, shown, all }; })()`);
let c = await card();
info('the card: ' + c.top + ' to ' + c.bottom + ' px of ' + c.vh + ', BACK ' + c.back.join(' to ') + ', page ' + c.pager + ', ' + c.all.length + ' lines in all');
ok(c.on && c.top >= 0 && c.bottom <= c.vh && c.back[1] <= c.vh && c.backHit && c.cut <= 1,
  'NET/WK: the week\'s money, the card on the screen and BACK on it, a tap away (' + c.back.join('-') + ' px of ' + c.vh + ')');
const pages = c.pager ? +c.pager.split('/')[1] : 1, seen = [...c.shown];
ok(pages >= 2 && /^1 \/ \d+$/.test(c.pager) && /THIS WEEK SO FAR/.test(c.shown[0]), 'its lines page between the title and BACK: ' + c.pager + ', this week so far first');
let stays = true;
for(let i = 1; i < pages; i++){ await page.tap('#ldgModal .fitPager [data-fitgo="1"]'); await page.waitForTimeout(150); const n = await card(); stays = stays && n.on && n.backHit; seen.push(...n.shown); }
const missing = c.all.filter(t => !seen.includes(t));
ok(stays && !missing.length && seen.some(t => /LAST WEEK/.test(t)) && seen.some(t => /A LEAGUE WEEK, AS IT’S GONE/.test(t)),
  'every line on one of the ' + pages + ' pages -- last week, a league week as it\'s gone (v186: not projected) -- and turning them leaves it open, BACK on each' + (missing.length ? ' (missing: ' + missing.join(' | ') + ')' : ''));
await page.tap('#ldgModal .ldgRow:not(.fitHide) >> nth=0'); await page.waitForTimeout(150);
const afterRow = await isOn('ldgModal');
await page.tap('#ldgModal [data-ldg="close"]'); await page.waitForTimeout(150);
const afterBack = await isOn('ldgModal');
ok(afterRow && !afterBack, 'a tap on the card leaves it open; BACK closes it');
await page.tap('#chNetBtn'); await page.waitForTimeout(350);
c = await card();
ok(c.on && /^1 \//.test(c.pager || ''), 'opened again: on its first page (' + c.pager + ')');
let pt = await outside('#ldgModal .ldgCard');
await page.touchscreen.tap(pt.x, pt.y); await page.waitForTimeout(200);
ok(!(await isOn('ldgModal')), 'a tap outside the card, on the dimmed screen round it (' + pt.room + ' px of it): closed');

// --- HOW TO PLAY and SKILL MOVES: a tap outside closes them too; not the card before your first match ---------------------------
await K(`(()=>{ ctlShow(); return 1; })()`); await page.waitForTimeout(150);
pt = await outside('#ctlModal .ctlCard'); await page.touchscreen.tap(pt.x, pt.y); await page.waitForTimeout(150);
const ctlGone = !(await isOn('ctlModal'));
await K(`(()=>{ window.__kicked=0; ctlShow({first:true, then:()=>{ window.__kicked=1; }}); return 1; })()`); await page.waitForTimeout(150);
pt = await outside('#ctlModal .ctlCard'); await page.touchscreen.tap(pt.x, pt.y); await page.waitForTimeout(150);
const firstStays = (await isOn('ctlModal')) && !(await K('window.__kicked'));
await page.tap('#ctlModal [data-ctl="go"]'); await page.waitForTimeout(150);
const kicked = !(await isOn('ctlModal')) && (await K('window.__kicked')) === 1;
ok(ctlGone && firstStays && kicked, 'HOW TO PLAY: a tap outside closes it; the card before your first match stays till KICK OFF');
await K(`(()=>{ openSkills(); return 1; })()`); await page.waitForTimeout(200);
pt = await outside('#skillsOverlay .skillsCard'); await page.touchscreen.tap(pt.x, pt.y); await page.waitForTimeout(150);
ok(!(await K('skillsOpen')) && !(await isOn('skillsOverlay')), 'SKILL MOVES: a tap outside closes it (' + pt.room + ' px round the card)');

process.exitCode = rep.finish();
await browser.close();
