// FOOTBALL CLASSIC, A CAREER KEPT (v154): a career saved before the season ran in weeks (v3) is brought up to date on
// opening LOAD GAME, not cleared -- it loads and plays a week -- and only one that can't be is cleared, LOAD GAME saying
// which; a career exported (⇩: a line of text, gzipped and in base64, or a file) and imported (pasted, or the file) into
// another slot is the same career, and plays; text that isn't a career is turned away and nothing written; a slot with
// a career in it asks first. On a copy the test can reach.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  let INJ_OFF=false;', '  let INJ_OFF=true;');
patch('  // ===== END MANAGER CAREER', '  window.__K={ ev:s=>eval(s) };\n  // ===== END MANAGER CAREER');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-sav-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
const K = s => page.evaluate(s => window.__K.ev(s), s);
await page.click('#smItems [data-act="new"]'); await page.waitForTimeout(150);
await page.click('#newSlotList .slotBtn >> nth=0'); await page.waitForTimeout(100);
await page.waitForSelector('#mgrMaker.on', { timeout: 4000 });
await page.fill('#mgName', 'Sam Okafor'); await page.fill('#mgClubIn', 'Kept Town');
await page.evaluate(()=>{ for(let i=0;i<3;i++){ const g=document.getElementById('mgGo'), m=document.getElementById('mgrMaker'); if(!g||!m||!m.classList.contains('on')||g.disabled) break; g.click(); } })   /* (v242: NEXT, NEXT, START CAREER) */; await page.waitForSelector('#careerHub.show', { timeout: 8000 });
await K(`(()=>{ const d=CAREER.data; d.story={vet:2,kid:2,phone:2}; mgStoryShow(d); for(let i=0;i<5;i++){ if(mgNextGame(d)&&d.wday!=='mon') mgSim(d); else mgForward(d); } MGUI.noPile=true; pileHide(); mgSave(d); renderHub(); return 1; })()`);

// --- AN OLD CAREER, BROUGHT UP TO DATE ---------------------------------------------------------------------------------------------
const before = await K(`(()=>{ const d=CAREER.data, o=JSON.parse(JSON.stringify(d)); o.v=3; for(const k of ['wday','wkN','weeks','tm','pile','pileTm','pileMor','wl','wlPrev','ledger','w149']) delete o[k]; o.phase='season';   // (a career from before the week: no week, its season's part named as it was)
  localStorage.setItem(SAVE_KEYS['2'],JSON.stringify(o)); localStorage.setItem(SAVE_KEYS['3'],JSON.stringify({v:3,kind:'manager',clubName:'Broken Town',season:2}));   // (and one that can't be)
  return { club:o.clubName, md:o.md, n:o.roster.length, budget:Math.round(o.budget) }; })()`);
await K(`(()=>{ MGUI.noPile=false; hubToMenu(); return 1; })()`); await page.waitForTimeout(200);
await page.click('#smItems [data-act="load"]'); await page.waitForTimeout(200);
let r = await K(`(()=>{ const s2=readSave(SAVE_KEYS['2']), s3=readSave(SAVE_KEYS['3']); return { v:s2&&s2.v, from:s2&&s2.from, phase:s2&&s2.phase, wday:s2&&s2.wday, md:s2&&s2.md, three:!!s3,
  notes:[...document.querySelectorAll('#slotList .slotNote')].map(n=>n.textContent), rows:[...document.querySelectorAll('#slotList .slotBtn')].map(b=>b.textContent) }; })()`);
info('LOAD GAME after: ' + JSON.stringify(r));
ok(r.v === 4 && r.from === 3 && r.phase === 'league' && r.wday === 'mon' && r.md === before.md && !r.three && r.notes.some(t => /Brought up to date from an older build: SLOT 2/.test(t)) && r.notes.some(t => /couldn’t be brought up to date, and was cleared/.test(t)),
  'a career saved before the week (v3) is brought up to date on opening LOAD GAME -- its league, matchday ' + r.md + ', on a Monday -- not cleared; the one that can\'t be is, and LOAD GAME says both');
await page.click('#slotList .slotBtn >> nth=1'); await page.waitForSelector('#careerHub.show', { timeout: 8000 }); await page.waitForTimeout(200);
r = await K(`(()=>{ const d=CAREER.data, w0=d.weeks, md0=d.md; MGUI.noPile=true; for(let i=0;i<3;i++){ if(mgNextGame(d)&&d.wday!=='mon') mgSim(d); else mgForward(d); } pileHide(); renderHub();
  return { club:d.clubName, n:d.roster.length, w0, w1:d.weeks, md0, md1:d.md, hub:document.getElementById('chPhase').dataset.long }; })()`);
ok(r.club === before.club && r.n === before.n && r.md1 > r.md0 && r.w1 > r.w0, 'it loads -- ' + r.club + ', ' + r.n + ' men -- and plays on: matchday ' + r.md0 + ' to ' + r.md1 + ' (' + r.hub + ')');

// --- A CAREER TO TAKE WITH YOU (v154-v241) -------------------------------------------------------------------------------------
// v242: gone -- careers save themselves, and LOAD GAME has no EXPORT by a slot and no IMPORT A CAREER under them
await K(`(()=>{ hubToMenu(); return 1; })()`); await page.waitForTimeout(200);
await page.click('#smItems [data-act="load"]'); await page.waitForTimeout(200);
r = await K(`(()=>({ rows:document.querySelectorAll('#slotList .slotRow').length, ex:document.querySelectorAll('#slotList .slotEx').length, imp:document.querySelectorAll('#slotList .slotImp').length,
  del:document.querySelectorAll('#slotList .slotDel').length }))()`);
ok(r.rows === 3 && r.ex === 0 && r.imp === 0 && r.del >= 1, 'v242: LOAD GAME -- three slots, a ✕ by a saved one, no export by any and no IMPORT A CAREER (' + JSON.stringify(r) + ')');

process.exitCode = rep.finish();
await browser.close();
