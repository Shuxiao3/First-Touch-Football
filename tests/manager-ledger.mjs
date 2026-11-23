// FOOTBALL CLASSIC, THE WEEK'S MONEY ON A PHONE (v160; v242: the card's gone, NET/WK only a figure -- what's left below), the smallest iPhone held sideways (667x375, touch only): NET/WK
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
await page.evaluate(()=>{ for(let i=0;i<3;i++){ const g=document.getElementById('mgGo'), m=document.getElementById('mgrMaker'); if(!g||!m||!m.classList.contains('on')||g.disabled) break; g.click(); } })   /* (v242: NEXT, NEXT, START CAREER) */; await page.waitForSelector('#careerHub.show', { timeout: 8000 });
const wk = await K(`(()=>{ const d=CAREER.data; d.story={vet:2,kid:2,phone:2}; mgStoryShow(d); if(d.fw) d.fw.off=true; let i=0;
  while(i<80&&(d.phase!=='league'||(d.weeks||0)<4)){ if(mgNextGame(d)&&d.wday!=='mon') mgSim(d); else mgForward(d); i++; }
  MGUI.noPile=true; pileHide(); for(const id of ['pressModal','moneyModal','pileModal','storyModal']) document.getElementById(id).classList.remove('on');
  document.getElementById('matchReport').style.display='none'; MGUI.seq=null; d.press=null; renderHub(); return { phase:d.phase, weeks:d.weeks, prev:!!d.wlPrev }; })()`);
await page.waitForTimeout(300);
info('the career: ' + JSON.stringify(wk));

let pt;
// --- NET/WK (v160-v241: it opened THE WEEK'S MONEY; v242: just the figure; v244: gone from the hub, the club's box has the
// funds) -- the week's books still kept, for the FUND SUMMARY after a match ----
{ const r = await K(`(()=>({ net:!!document.getElementById('chNetBtn'), funds:document.getElementById('chBudget').textContent, want:money(CAREER.data.budget), wl:!!(CAREER.data.wl&&CAREER.data.wl.L) }))()`);
  ok(!r.net && r.funds === r.want && r.wl, 'v244: no NET/WK on the hub, the club\'s box with the funds (' + r.funds + '); the week\'s books still kept, for the FUND SUMMARY'); }

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
// (v246: SKILL MOVES is a page as its template, the whole screen -- BACK top left closes it; a tap on the page picks, it doesn't close)
await K(`(()=>{ openSkills(); return 1; })()`); await page.waitForTimeout(200);
await page.tap('#skillsOverlay .skList .skRow >> nth=2'); await page.waitForTimeout(150);
const skStays = (await K('skillsOpen')) && (await isOn('skillsOverlay'));
await page.tap('#skillsOverlay .tplHead [data-skclose]'); await page.waitForTimeout(150);
ok(skStays && !(await K('skillsOpen')) && !(await isOn('skillsOverlay')), 'SKILL MOVES, a page of its own (v246): a move tapped is picked and the page stays; BACK top left closes it');

process.exitCode = rep.finish();
await browser.close();
