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
await page.click('#mgGo'); await page.waitForSelector('#careerHub.show', { timeout: 8000 });
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

// --- A CAREER TO TAKE WITH YOU ---------------------------------------------------------------------------------------------------
await K(`(()=>{ hubToMenu(); return 1; })()`); await page.waitForTimeout(200);
await page.click('#smItems [data-act="load"]'); await page.waitForTimeout(200);
const raw1 = await K(`localStorage.getItem(SAVE_KEYS['1']).length`);
await page.click('#slotList .slotRow >> nth=0 >> .slotEx'); await page.waitForSelector('#ioModal.on', { timeout: 4000 }); await page.waitForTimeout(150);
const text = await page.inputValue('#ioModal .ioText');
info('exported: ' + text.slice(0, 40) + '... ' + text.length + ' characters (the save, ' + raw1 + ')');
ok(/^FTC1:[A-Za-z0-9+/=]+$/.test(text) && text.length < raw1 / 2.5, 'EXPORT: a line of text, the career gzipped -- ' + text.length.toLocaleString() + ' characters for a ' + raw1.toLocaleString() + '-character save');
const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#ioModal [data-io="file"]')]);
const fileText = readFileSync(await dl.path(), 'utf8');
ok(fileText === text && /\.txt$/.test(dl.suggestedFilename()), 'or a file to keep: ' + dl.suggestedFilename() + ', the same text');
await page.click('#ioModal [data-io="close"]'); await page.waitForTimeout(100);
// in again: into slot 3 (empty), pasted
await page.click('#slotList .slotImp'); await page.waitForSelector('#ioModal.on', { timeout: 4000 }); await page.waitForTimeout(100);
await page.fill('#ioModal .ioText', 'not a career at all'); await page.click('#ioModal [data-io="in"]'); await page.waitForTimeout(200);
const bad = await page.textContent('#ioModal .ioMsg'), three0 = await K(`!!readSave(SAVE_KEYS['3'])`);
ok(/isn’t a career/.test(bad) && !three0, 'text that isn\'t a career is turned away ("' + bad + '"), nothing written');
const slot3 = await page.$('#ioModal [data-io="slot"][data-l="3"]'); if(slot3){ await slot3.click(); await page.waitForTimeout(80); }
await page.fill('#ioModal .ioText', text); await page.click('#ioModal [data-io="in"]'); await page.waitForTimeout(400);
const msg = await page.textContent('#ioModal .ioMsg');
r = await K(`(()=>{ const a=readSave(SAVE_KEYS['1']), b=readSave(SAVE_KEYS['3']); if(!b) return null; return { same:a.clubName===b.clubName&&a.season===b.season&&a.md===b.md&&Math.round(a.budget)===Math.round(b.budget)&&a.roster.map(p=>p.id+':'+p.ovr).join()===b.roster.map(p=>p.id+':'+p.ovr).join()&&a.manager.name===b.manager.name, slot:b.slot, club:b.clubName }; })()`);
ok(/Imported into SLOT 3/.test(msg) && r && r.same && r.slot === 'SLOT 3', 'IMPORT A CAREER: pasted into slot 3 -- ' + (r && r.club) + ', the same career (its men and their ratings, its money, its week)');
// from the file, into a slot with a career in it: asked first
await page.click('#ioModal [data-io="slot"][data-l="2"]'); await page.waitForTimeout(80);
await page.setInputFiles('#ioModal .ioFile', { name: 'kept.txt', mimeType: 'text/plain', buffer: Buffer.from(text) }); await page.waitForTimeout(200);
await page.click('#ioModal [data-io="in"]'); await page.waitForTimeout(200);
const asked = await page.evaluate(() => document.getElementById('confirmModal').classList.contains('on') ? document.querySelector('#confirmModal .cfMsg').textContent : '');
await page.click('#confirmModal [data-cf="yes"]'); await page.waitForTimeout(300);
r = await K(`(()=>{ const a=readSave(SAVE_KEYS['1']), b=readSave(SAVE_KEYS['2']); return { same:!!b&&a.clubName===b.clubName&&a.roster.length===b.roster.length&&a.md===b.md, v:b&&b.v }; })()`);
ok(/holds a career/.test(asked) && r.same && r.v === 4, 'from the file into a slot that has a career: asked first ("' + asked.slice(0, 50) + '..."), then it\'s in');
await page.click('#ioModal [data-io="close"]'); await page.waitForTimeout(100);
await page.click('#slotList .slotBtn >> nth=2'); await page.waitForSelector('#careerHub.show', { timeout: 8000 }); await page.waitForTimeout(150);
r = await K(`(()=>{ const d=CAREER.data, md=d.md; MGUI.noPile=true; for(let i=0;i<3;i++){ if(mgNextGame(d)&&d.wday!=='mon') mgSim(d); else mgForward(d); } pileHide(); return { md0:md, md1:d.md, key:CAREER.key }; })()`);
ok(r.md1 > r.md0 && /slot3/.test(r.key), 'the imported career loads and plays on (matchday ' + r.md0 + ' to ' + r.md1 + ')');

process.exitCode = rep.finish();
await browser.close();
