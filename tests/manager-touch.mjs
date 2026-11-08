// FOOTBALL CLASSIC, TOUCH FIRST (v158), on a phone held sideways (844x390, touch only): a career from the menu to a
// sub, all by taps -- a new career, the keeper and a man not taken swapped on Training's Selection (tap one, tap the
// other: it was a drag only), a bid in a tap, a match played, a sub made from SUBS; the smallest buttons take a tap from
// round them; and TEXT SIZE: LARGE makes a building's screens a size up. On a copy the test can reach.
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
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-tch-')), 'classic.html');
writeFileSync(copy, src);

const rep = reporter(); const { ok, info } = rep;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true }); await ctx.addInitScript(STAR);
const page = await ctx.newPage(); await pileAside(page);
page.on('pageerror', e => rep.errs.push('PAGEERROR: ' + e.message));
await page.goto('file://' + copy); await page.waitForTimeout(700);
const K = s => page.evaluate(s => window.__K.ev(s), s);

// --- a new career, by taps ------------------------------------------------------------------------------------------------------------
await page.tap('#smItems [data-act="new"]'); await page.waitForTimeout(200);
await page.tap('#newSlotList .slotBtn >> nth=0'); await page.waitForSelector('#mgrMaker.on', { timeout: 4000 });
await page.fill('#mgName', 'Sam Okafor'); await page.fill('#mgClubIn', 'Touch Town');
await page.tap('#mgGo'); await page.waitForSelector('#careerHub.show', { timeout: 8000 });
await K(`(()=>{ const d=CAREER.data; d.story={vet:2,kid:2,phone:2}; mgStoryShow(d); mgMarketOpen(d); d.budget=5e6; MGUI.noPile=true; pileHide(); renderHub(); return 1; })()`); await page.waitForTimeout(150);
ok(await K('!!CAREER&&!!CAREER.data'), 'a new career from the menu, by taps');

// --- A TAP TO MOVE A MAN ----------------------------------------------------------------------------------------------------------------
await page.tap('#chCampus [data-bldg="train"]'); await page.waitForSelector('#bldgPanel.show'); await page.waitForTimeout(150);
await page.tap('#bpTabs .bpTab:text-is("Selection")'); await page.waitForTimeout(150);
const before = await K(`(()=>{ const d=CAREER.data, lu=ensureLineup(d), L=selList(lu); return { L, gk:lu.gk, keepers:L.map((ri,k)=>[k,d.roster[ri].role]).filter(x=>x[1]==='GK').map(x=>x[0]) }; })()`);
const k2 = before.keepers.find(k => k > 0);
await page.tap('#bpBody .selRow[data-k="0"]'); await page.waitForTimeout(120);
const lit = await page.$eval('#bpBody .selRow[data-k="0"]', e => e.classList.contains('qpOn'));
await page.tap(`#bpBody .selRow[data-k="${k2}"]`); await page.waitForTimeout(150);
const after = await K(`(()=>{ const d=CAREER.data, lu=ensureLineup(d); return { gk:lu.gk, pick:MGUI.selPick }; })()`);
ok(lit && after.gk === before.L[k2] && after.pick == null, 'Training\'s Selection: your keeper tapped (lit), then the other keeper -- they swap, no drag (keeper ' + before.gk + ' to ' + after.gk + ')');
// a man not taken onto the pitch: tapped, then a man of your nine
const r2 = await K(`(()=>{ const d=CAREER.data, lu=ensureLineup(d), L=selList(lu), n8=1+lu.atk.length, nb=Math.min(L.length,n8+BENCH_N), rest=L.findIndex((ri,k)=>k>=nb&&d.roster[ri].role!=='GK'); return { rest, ri:L[rest], xi:L[3] }; })()`);
await page.tap(`#bpBody .selRow[data-k="${r2.rest}"]`); await page.waitForTimeout(120);
await page.tap('#bpBody .selRow[data-k="3"]'); await page.waitForTimeout(150);
const r3 = await K(`(()=>{ const d=CAREER.data, lu=ensureLineup(d); return { inXi:lu.atk.includes(${r2.ri}), outXi:!lu.atk.includes(${r2.xi}), plans:qpPlans(d).length }; })()`);
ok(r3.inXi && r3.outXi && r3.plans === 0, 'a man not taken, tapped, then one of your nine: he\'s in, the other out (and no quick sub planned by it)');
await page.tap('#bldgPanel .bpTopBack'); await page.waitForTimeout(120);

// --- A TAP TO SWAP, on Training's pitch ---------------------------------------------------------------------------------------------
await page.tap('#chCampus [data-bldg="train"]'); await page.waitForSelector('#bldgPanel.show'); await page.waitForTimeout(150);
await page.tap('#bpTabs .bpTab:text-is("Tactics")'); await page.waitForTimeout(200);
const tb = await K(`(()=>{ const lu=ensureLineup(CAREER.data); return { b:lu.bench[0], f:lu.atk[3] }; })()`);
await page.tap(`#bpBody .ptk[data-tac="bench"][data-ri="${tb.b}"]`); await page.waitForTimeout(150);
await page.tap('#bpBody [data-tarm]'); await page.waitForTimeout(150);
await page.tap(`#bpBody .ptk[data-tac="field"][data-ri="${tb.f}"]`); await page.waitForTimeout(200);
const tb2 = await K(`(()=>{ const lu=ensureLineup(CAREER.data); return { inXi:lu.atk.includes(${tb.b}), outXi:!lu.atk.includes(${tb.f}) }; })()`);
ok(tb2.inXi && tb2.outXi, 'Training\'s pitch: a man on the bench tapped, SWAP on his card, a man of your nine tapped -- they change places, no drag');
await page.tap('#bldgPanel .bpTopBack'); await page.waitForTimeout(120);

// --- A BID IN A TAP ---------------------------------------------------------------------------------------------------------------
await page.tap('#chCampus [data-bldg="market"]'); await page.waitForSelector('#bldgPanel.show'); await page.waitForTimeout(150);
await page.tap('#bpBody .mgList .mgRow >> nth=0'); await page.waitForTimeout(120);
if(await page.$('#bpBody [data-mside="deal"]')){ await page.tap('#bpBody [data-mside="deal"]'); await page.waitForTimeout(100); }
await page.tap('#bpBody .mgQuick [data-mg="bidset"][data-k="1"]'); await page.waitForTimeout(80);
await page.tap('#bpBody [data-mg="bid"]'); await page.waitForTimeout(150);
const bids = await K('(CAREER.data.bids||[]).length');
ok(bids === 1, 'a bid in two taps: THEIR PRICE, then BID');
await page.tap('#bldgPanel .bpTopBack'); await page.waitForTimeout(120);

// --- the smallest buttons, a tap from round them ------------------------------------------------------------------------------------
const hit = await page.evaluate(() => { const el = document.querySelector('#cpFirst .fwX'); if(!el) return null; const b = el.getBoundingClientRect();
  const at = (x, y) => { const e = document.elementFromPoint(x, y); return !!e && (e === el || el.contains(e)); };
  return { w: Math.round(b.width), h: Math.round(b.height), right: at(b.right + 6, b.top + b.height / 2), below: at(b.left + b.width / 2, b.bottom + 6) }; });
ok(hit && hit.right && hit.below, 'the smallest button (YOUR FIRST WEEK\'s ✕, ' + (hit && hit.w + 'x' + hit.h) + ' px) takes a tap 6 px off it, to the side and below');

// --- TEXT SIZE ---------------------------------------------------------------------------------------------------------------
const ts = await K(`(()=>{ setPref('text','l'); curTab.club='Squad'; openBuilding('club'); paintBuilding(); const z=getComputedStyle(document.getElementById('bpBody')).zoom, row=document.querySelector('#setRows')?'':''; const big=document.documentElement.dataset.text;
  renderSetRows(); const opt=!!document.querySelector('#setRows [data-pref="text"][data-val="l"].on'); setPref('text','n'); const z2=getComputedStyle(document.getElementById('bpBody')).zoom; hideBldg(); return { z, big, opt, z2 }; })()`);
ok(ts.big === 'large' && +ts.z > 1.1 && ts.opt && +ts.z2 === 1, 'Settings has TEXT SIZE: LARGE puts a building\'s screens a size up (zoom ' + ts.z + '), NORMAL back');

// --- a match, and a sub, by taps -----------------------------------------------------------------------------------------------
for(let i = 0; i < 8; i++){ if(await page.$('#chBottom [data-mg="play"]')) break; if(!(await page.$('#chBottom [data-mg="forward"]'))) break; await page.tap('#chBottom [data-mg="forward"]'); await page.waitForTimeout(250); await K(`(()=>{ MGUI.noPile=true; pileHide(); return 1; })()`); }
await page.tap('#chBottom [data-mg="play"]'); await page.waitForTimeout(400);
if(await page.$('#ctlModal.on')){ await page.tap('#ctlModal [data-ctl="go"], #ctlModal button >> nth=-1').catch(() => {}); await page.waitForTimeout(300); }
await page.waitForTimeout(1500);
const inMatch = await K('SCREEN');
await page.tap('#qsBtn'); await page.waitForTimeout(200);
await page.tap('#qsDrop .qsAll'); await page.waitForSelector('#mtacOv.on', { timeout: 4000 }); await page.waitForTimeout(200);   // (ALL SUBS: the match's tactics)
const offSi = await page.$eval('#mtacOv .tacB1:not(.ro) .ptk[data-mtk="field"] >> nth=2', e => +e.dataset.si).catch(async () => +(await page.locator('#mtacOv .tacB1:not(.ro) .ptk[data-mtk="field"]').nth(2).getAttribute('data-si')));
await page.locator('#mtacOv .tbBench .ptk').first().tap(); await page.waitForTimeout(150);
const armTxt = await page.textContent('#mtacOv [data-mtarm]');
await page.tap('#mtacOv [data-mtarm]'); await page.waitForTimeout(150);
const armed = await page.$$eval('#mtacOv .ptk.armed', ns => ns.length);
await page.locator('#mtacOv .tacB1:not(.ro) .ptk[data-mtk="field"]').nth(2).tap(); await page.waitForTimeout(250);
const used = await K('SUBS.G.used'), offNow = await K(`SUBS.G.off.includes(${offSi})`);
info('the match: ' + JSON.stringify({ inMatch, armTxt, armed, used, offNow }));
ok(inMatch === 'match' && /SWAP/.test(armTxt) && armed === 1 && used === 1 && offNow, 'PLAY, then ALL SUBS: a man on the bench tapped, SWAP on his card, a man on the pitch tapped -- he\'s on, one sub used, no drag');

process.exitCode = rep.finish();
await browser.close();
