// FOOTBALL CLASSIC, MANAGER CAREER: create a manager and club, walk every building, buy, sell and sign in the
// summer window, simulate a season through the winter window to the review, start the next one. Then, on a copy of
// the game that lets the test reach the season code: a strong side is promoted (and lands in League 1 with a full
// fixture list), a top-six side plays the playoffs, and the goals in a played match go to the men who scored them.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const anchor = '  // ===== END MANAGER CAREER';
if(src.split(anchor).length !== 2) throw new Error('instrumenting: anchor not found once: ' + anchor);
src = src.replace(anchor, '  window.__MG={get d(){ return CAREER&&CAREER.data; }, mgNextDay, mgPlayGame, mgPos, mgWindowOpen, mgNextGame, mgSave, renderHub, mgStarters};\n' + anchor);
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-mgr-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
const save = () => page.evaluate(() => JSON.parse(localStorage.getItem('ft_mgr_slot1')));
async function create(club){
  if(await page.isVisible('#careerHub')){ if(await page.isVisible('#bldgPanel')) await page.click('#bldgPanel .bpTopBack'); await page.click('#careerHub [data-hub="menu"]'); }
  await page.click('#smItems [data-act="new"]'); await page.waitForTimeout(150);
  await page.click('#newSlotList .slotBtn >> nth=0'); await page.waitForTimeout(100);
  if(await page.isVisible('#confirmModal.on')) await page.click('#confirmModal [data-cf="yes"]');
  await page.waitForSelector('#mgrMaker.on', { timeout: 4000 });
  await page.fill('#mgName', 'Sam Okafor'); await page.fill('#mgClubIn', club);
  await page.click('#mgGo'); await page.waitForSelector('#careerHub.show', { timeout: 6000 });
}
const msg = () => page.$eval('#bpMsg', e => e.classList.contains('on') ? e.textContent : '').catch(() => '');   // (a toast along the bottom)
const bottom = () => page.textContent('#chBottom');

// --- creation ------------------------------------------------------------------------
await page.click('#smItems [data-act="new"]'); await page.waitForTimeout(150);
await page.click('#newSlotList .slotBtn >> nth=0');
await page.waitForSelector('#mgrMaker.on', { timeout: 4000 });
ok(await page.isDisabled('#mgGo'), 'START is off until both names are in');
await page.fill('#mgName', 'Sam Okafor'); await page.fill('#mgClubIn', 'Fenmoor Athletic');
await page.click('#mgrMaker [data-mm="pri"][data-c="#1d4fa3"]'); await page.click('#mgrMaker [data-mm="sec"][data-c="#f2d23c"]');
await page.click('#mgGo'); await page.waitForSelector('#careerHub.show', { timeout: 6000 });
let d = await save();
ok(d.kind === 'manager' && d.manager.name === 'Sam Okafor' && d.clubName === 'Fenmoor Athletic', 'saved: the manager and the club');
ok(String(d.colors) === '#1d4fa3,#f2d23c', 'the colours you picked');
ok(d.tier === 1 && [1, 2, 3, 4].every(t => d.div[t].length === 14) && d.div[1].includes(d.clubId), 'four leagues of 14, you in League 2');
ok(d.roster.length === 14 && d.budget === 20000 && d.phase === 'summer' && Object.values(d.world.clubs).every(c => c.id === d.clubId || c.players.length === 14), 'a 14-man squad (every club\'s 14), $20,000, the summer window open');
ok(!d.roster.some(p => p.stats), 'no stats in the save (they are rebuilt from the rating)');
ok((await page.textContent('#chMeta')).includes('League 2'), 'the hub: ' + await page.textContent('#chMeta'));

// --- every building, every tab -----------------------------------------------------------
for(const b of ['office', 'market', 'scouting', 'academy', 'stadium', 'news', 'home']){
  await page.click(`#chCampus [data-bldg="${b}"]`); await page.waitForTimeout(100);
  const tabs = await page.$$eval('#bldgPanel .bpTab', ns => ns.map(n => n.textContent));
  for(const t of tabs){ await page.click(`#bldgPanel .bpTab:text-is("${t}")`); await page.waitForTimeout(60); }
  ok(tabs.length >= 2, b + ': ' + tabs.join(', '));
  await page.click('#bldgPanel .bpTopBack'); await page.waitForTimeout(50);
}

// --- the market: scout, bid the asking price, sign him -----------------------------------------
await page.click('#chCampus [data-bldg="market"]'); await page.click('#bldgPanel .bpTab:text-is("Search")'); await page.waitForTimeout(80);
let signed = false;
for(let i = 0; i < 10 && !signed; i++){                          // the first man who'd come and whom we can afford (page 1: ten men)
  await page.click(`#bpBody .mgList .mgRow >> nth=${i}`); await page.waitForTimeout(60);
  if(await page.$('#bpBody [data-mside="deal"]')){ await page.click('#bpBody [data-mside="deal"]'); await page.waitForTimeout(60); }   // (his card turned over: his deal)
  const card = await page.innerText('#bpBody .mgCard');
  const ask = +(card.match(/ASKING\s*\$([\d,]+)/) || [0, '999999'])[1].replace(/,/g, '');
  if(/won’t drop/.test(card) || ask > 15000){ await page.click(`#bpBody .mgList .mgRow >> nth=${i}`); continue; }
  if(await page.$('#bpBody [data-mg="scout"]')){ await page.click('#bpBody [data-mg="scout"]'); await page.waitForTimeout(60); ok(/Scouted/.test(await msg()), 'scouted: ' + await msg()); }
  await page.click('#bpBody [data-mg="bid"]'); await page.waitForTimeout(60);
  info(await msg());
  if(await page.$('#bpBody [data-mg="sign"]')){ await page.click('#bpBody [data-mg="sign"]'); await page.waitForTimeout(60); signed = /Signed/.test(await msg()); }
}
d = await save();
ok(signed && d.roster.length === 15 && d.budget < 20000, 'signed a man for the asking price: squad 15 (the most), budget ' + d.budget);
const newMan = d.roster[14];
ok(newMan.until >= d.season && newMan.wage > 0 && d.lineup.bench.indexOf(14) >= 4, 'he has a contract, and waits in reserve (the bench is four)');

// --- selling: put the worst man on the list ------------------------------------------------
await page.click('#bldgPanel .bpTab:text-is("Selling")'); await page.waitForTimeout(60);
await page.click('#bpBody .mgList .mgRow >> nth=-1'); await page.waitForTimeout(60);
if(await page.$('#bpBody [data-mside="deal"]')){ await page.click('#bpBody [data-mside="deal"]'); await page.waitForTimeout(60); }
await page.click('#bpBody [data-mg="list"]'); await page.waitForTimeout(60);
d = await save();
ok(Object.keys(d.listed).length === 1, 'one man on the transfer list: ' + await msg());
await page.click('#bldgPanel .bpTopBack');

// --- the window shuts, half a season, the winter window, the rest --------------------------------
for(let i = 0; i < 6 && !/PLAY/.test(await bottom()); i++){ await page.click('#chBottom [data-mg="nextday"]'); await page.waitForTimeout(50); }
d = await save();
ok(d.phase === 'league' && d.md === 0 && d.offers.length === 0, 'the summer window shuts after its fifth day');
for(let i = 0; i < 13; i++){ await page.click('#chBottom [data-mg="sim"]'); await page.waitForTimeout(30); }
d = await save();
ok(d.phase === 'winter' && d.md === 13, 'the winter window opens after matchday 13');
ok(d.lg[1].fx.slice(0, 13).every(day => day.every(m => m[2] != null)) && d.lg[4].fx[12].every(m => m[2] != null), 'thirteen rounds played in every league');
ok(d.week === 13 && d.ledger.length === 12, 'a week paid per round');
for(let i = 0; i < 4 && !/PLAY/.test(await bottom()); i++){ await page.click('#chBottom [data-mg="nextday"]'); await page.waitForTimeout(50); }
for(let i = 0; i < 16 && /SIMULATE/.test(await bottom()); i++){ await page.click('#chBottom [data-mg="sim"]'); await page.waitForTimeout(30); }
for(let i = 0; i < 3 && !/REVIEW/.test(await bottom()); i++){ await page.click('#chBottom [data-mg="continue"]'); await page.waitForTimeout(50); }
d = await save();
ok(d.phase === 'review' && d.review && d.review.pos >= 1, 'the season ends in the review: ' + (d.review && d.review.pos + ', ' + d.review.result));
await page.click('#chBottom [data-mg="review"]'); await page.waitForTimeout(80);
ok((await page.innerText('#bldgPanel')).includes('START SEASON 2'), 'the review offers season 2');
await page.click('#bldgPanel [data-mg="newseason"]'); await page.waitForTimeout(120);
d = await save();
ok(d.season === 2 && d.phase === 'summer' && [1, 2, 3, 4].every(t => d.div[t].length === 14), 'season 2: the summer window, four leagues of 14');
ok(d.manager.history.length === 1 && d.roster.every(p => p.apps === 0), 'season 1 is in your history, the season numbers start again');
ok(d.roster.length >= 12 && d.roster.some(p => p.role === 'GK'), 'never short: ' + d.roster.length + ' men, a keeper among them');

// --- promotion: a squad of 75s ---------------------------------------------------------------
await create('Strong Town');
let r = await page.evaluate(() => { const M = __MG, d = M.d; for(const p of d.roster) p.ovr = 75;
  let n = 0; while(d.phase !== 'review' && n++ < 300){ if(M.mgWindowOpen(d)) M.mgNextDay(d); else M.mgPlayGame(d, null, null); }
  M.mgSave(d); M.renderHub(); return { pos: d.review.pos, result: d.review.result, up: d.review.up }; });
ok(r.pos === 1 && r.up && /CHAMPIONS/.test(r.result), 'a squad of 75s wins League 2: ' + r.result);
await page.click('#chBottom [data-mg="review"]'); await page.click('#bldgPanel [data-mg="newseason"]'); await page.waitForTimeout(120);
d = await save();
ok(d.tier === 2 && d.lg[2].ids.includes(d.clubId) && d.lg[2].fx.filter(day => day.some(m => m[0] === d.clubId || m[1] === d.clubId)).length === 26,
   'promoted: League 1, 26 games');
ok(d.capacity >= 6000 && d.sponsorWk === 800, 'the ground and the sponsor grow with the league');

// --- the playoffs: a top-six side, until one finishes 3rd to 6th -------------------------------------
let po = null;
for(let k = 0; k < 12 && !po; k++){
  await create('Playoff Rovers');
  po = await page.evaluate(() => { const M = __MG, d = M.d; for(const p of d.roster) p.ovr = 59;
    let n = 0; while(d.phase !== 'playoffs' && d.phase !== 'review' && n++ < 300){ if(M.mgWindowOpen(d)) M.mgNextDay(d); else M.mgPlayGame(d, null, null); }
    M.mgSave(d); M.renderHub(); return d.phase === 'playoffs' ? { pos: M.mgPos(d), g: M.mgNextGame(d) } : null; });
}
ok(po && po.g && po.g.label === 'Playoff semi-final', 'in the playoffs (' + (po && po.pos) + '), a semi-final to play');
if(po){
  await page.click('#chBottom [data-mg="sim"]'); await page.waitForTimeout(80);
  d = await save();
  if(d.phase === 'playoffs'){ ok(d.po[1].final && d.po[1].final.includes(d.clubId), 'won the semi: into the final'); await page.click('#chBottom [data-mg="sim"]'); await page.waitForTimeout(80); d = await save(); }
  ok(d.phase === 'review' && d.review.up === (d.po[1].winner === d.clubId), 'the playoff winner goes up: ' + d.review.result);
}

// --- a played match: the goals go to the men who scored them ------------------------------------------
await create('Goal Town');
r = await page.evaluate(() => { const M = __MG, d = M.d; while(M.mgWindowOpen(d)) M.mgNextDay(d);
  const st = M.mgStarters(d), lu = d.lineup, a = lu.atk[lu.atk.length - 1], b = lu.atk[0];
  const logs = [{ team: 'G', scorerRi: a, scorerName: d.roster[a].name }, { team: 'G', scorerRi: a, scorerName: d.roster[a].name },
                { team: 'G', scorerRi: b, scorerName: d.roster[b].name, ownGoal: false }, { team: 'R', scorerRi: null, scorerName: 'X' }];
  const rep = M.mgPlayGame(d, [3, 1], logs); M.mgSave(d);
  return { a: d.roster[a].goals, b: d.roster[b].goals, apps: st.map(p => p.apps), you: rep.mine.you, md: d.md }; });
ok(r.a === 2 && r.b === 1 && r.you === 3 && r.md === 1, 'goals credited from the goal log: 2 and 1');
ok(r.apps.every(n => n === 1), 'an appearance each for the eight who started');

process.exitCode = rep.finish();
await browser.close();
