// FOOTBALL CLASSIC, MANAGER CAREER: create a manager and club -- its short name (suggested from its name, or your own
// three letters, no other club's) and its crest (made on the card) -- walk every building, buy, sell and sign in the
// summer window, simulate a season through the winter window to the review, start the next one. Then, on a copy of
// the game that lets the test reach the season code: a strong side is promoted (and lands in League 1 with a full
// fixture list, its ground as it was), a top-six side plays the playoffs, the goals in a played match go to the men
// who scored them, and THE GROUND: a field with two bleachers to start, built up a level at a time, boards let by the
// week, sponsors' bids for the shirt, the ground's name and the stands', their deals paid weekly and run out. Then THE
// CLUBHOUSE and what it unlocks: a new career has the shed, the stadium and a rough training pitch; the transfer market
// (your phone) and the physio are the first things to buy; each clubhouse after it needs the next league up and the
// money, and opens the next buildings and levels (the stadium's too); the training pitch's level locks shapes, styles
// and instructions; the physio's level shows in a match (half-time, tiring) and a simulated one; decorations bought one at a
// time and put down anywhere free, moved, put away. Last, THE CAMPUS (the hub): drawn as the club has it -- the stadium
// as built, its name, the clubhouse at its level with your crest and letters, each building or its plot, the
// decorations where they were put -- a building tapped on it opens with the camera going in on it and comes back out
// the same way; TRANSFERS is on your phone (straight in); NEXT DAY sets the sun behind your stadium (a tap ends it).
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const anchor = '  // ===== END MANAGER CAREER';
if(src.split(anchor).length !== 2) throw new Error('instrumenting: anchor not found once: ' + anchor);
src = src.replace(anchor, '  window.__MG={get d(){ return CAREER&&CAREER.data; }, mgNextDay, mgPlayGame, mgPos, mgWindowOpen, mgNextGame, mgSave, renderHub, mgStarters, '
  + 'stadOf, stadUpgrade, boardBuy, dealBids, dealSign, dealsExpire, computeFinance, groundOfYours, groundOfClub, mgSetTeams, mgNewSeason, STAD_LEVELS, '
  + 'CAMPUS, CAMPUS_META, crestFor, lvOf, bldUp, bldBlock, mgScout, mgMigrate, mgStrength, mgSimStr, cpPieces, decoFree, decoMakeRoom, physioWear, physioBack, tacNeed, '
  + 'get DECO_SHOP(){ return DECO_SHOP; }, get BLD_LV(){ return BLD_LV; }, get CLUB_LV(){ return CLUB_LV; }, get PLACE(){ return PLACE; }, set fix(v){ careerFix=v; }, set lock(v){ TAC_LOCK=v; }, '
  + 'get G(){ return MATCH_GROUND; }, get V(){ return VENUE; }, get T(){ return TEAM; }};\n' + anchor);
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
ok(await page.getAttribute('#mgCode', 'placeholder') === 'FEN' && await page.textContent('#mkSbCode') === 'FEN' && /^data:image\/png/.test(await page.getAttribute('#mkSbCrest', 'src')),
  'the short name it suggests, FEN, on the scoreboard beside the crest');
await page.fill('#mgCode', 'fm'); await page.waitForTimeout(30);
ok(await page.isDisabled('#mgGo'), 'two letters: START waits for a third');
await page.fill('#mgCode', 'fmr'); await page.waitForTimeout(30);
ok(await page.inputValue('#mgCode') === 'FMR' && !(await page.isDisabled('#mgGo')) && await page.textContent('#mkSbCode') === 'FMR', 'three letters, in capitals: FMR');
await page.click('#mgrMaker [data-mm="tab"][data-t="kit"]');
await page.click('#mgrMaker [data-mm="pri"][data-c="#1d4fa3"]'); await page.click('#mgrMaker [data-mm="sec"][data-c="#f2d23c"]');
await page.click('#mgrMaker [data-mm="tab"][data-t="crest"]');
const crestTo = async (k, want) => { for(let i = 0; i < 12; i++){ const v = await page.$$eval('#mgrMaker .mkCrVal', ns => ns.map(n => n.textContent));
  if(v[{ s: 0, p: 1, e: 2 }[k]] === want) return true; await page.click(`#mgrMaker [data-mm="cr"][data-k="${k}"][data-d="1"]`); } return false; };
ok(await crestTo('s', 'ROUND') && await crestTo('p', 'HOOPS') && await crestTo('e', 'STAR'), 'the crest: round, hooped, a star');
await page.click('#mgrMaker [data-mm="part"][data-i="2"]'); await page.click('#mgrMaker [data-mm="crc"][data-c="#ffb43c"]');
await page.click('#mgGo'); await page.waitForSelector('#careerHub.show', { timeout: 6000 });
let d = await save();
ok(d.kind === 'manager' && d.manager.name === 'Sam Okafor' && d.clubName === 'Fenmoor Athletic', 'saved: the manager and the club');
ok(String(d.colors) === '#1d4fa3,#f2d23c', 'the colours you picked');
{ const me = d.world.clubs[d.clubId], cr = me.crest || {};
  ok(me.code === 'FMR' && d.clubCode === 'FMR' && Object.values(d.world.clubs).filter(c => c.code === 'FMR').length === 1, 'your club is FMR, and no other club is');
  ok(cr.s === 1 && cr.p === 3 && cr.e === 2 && String(cr.c) === '#1d4fa3,#f2d23c,#ffb43c' && cr.l === 'F', 'your crest as you made it: ' + JSON.stringify(cr));
  ok(/^data:image\/png/.test(await page.getAttribute('#chCrest', 'src')), 'and over the club\'s name in town'); }
ok(d.tier === 1 && [1, 2, 3, 4].every(t => d.div[t].length === 14) && d.div[1].includes(d.clubId), 'four leagues of 14, you in League 2');
ok(d.roster.length === 14 && d.budget === 20000 && d.phase === 'summer' && Object.values(d.world.clubs).every(c => c.id === d.clubId || c.players.length === 14), 'a 14-man squad (every club\'s 14), $20,000, the summer window open');
ok(!d.roster.some(p => p.stats), 'no stats in the save (they are rebuilt from the rating)');
ok((await page.textContent('#chMeta')).includes('League 2'), 'the hub: ' + await page.textContent('#chMeta'));

// --- every building, every tab: a new career has the shed, the stadium and the training pitch; the transfer market and
// the physio are there to buy (their price in the menu); the scouts' house and the academy wait for the next clubhouses -
ok(JSON.stringify(d.lv) === '{"club":1,"train":1,"physio":0,"market":0,"scouting":0,"academy":0}' && d.deco.length === 0 && d.youth.length === 0,
  'a new career: the shed, the training pitch, nothing else built, nothing bought, no academy, so no youngsters');
for(const b of ['club', 'train', 'stadium', 'market', 'physio', 'scouting', 'academy']){
  await page.click(`#chCampus [data-bldg="${b}"]`); await page.waitForSelector('#bldgPanel.show'); await page.waitForTimeout(60);
  const tabs = await page.$$eval('#bldgPanel .bpTab', ns => ns.map(n => n.textContent)), chip = await page.textContent(`#chCampus [data-bldg="${b}"] .bPrice`);
  if(['market', 'physio'].includes(b)){ const btn = await page.textContent('#bpFoot [data-mg="up"]');
    ok(!tabs.length && /GET ON IT|BUILD IT/.test(btn) && await page.$eval(`#chCampus [data-bldg="${b}"]`, e => e.classList.contains('unbuilt')), b + ': to buy -- ' + btn + ' (' + chip + ' in the menu)'); }
  else if(['scouting', 'academy'].includes(b)){ const sect = await page.textContent('#bpBody .bpSect');
    ok(!tabs.length && /COMES WITH CLUBHOUSE [23]/.test(sect) && await page.$('#bpFoot [data-mg="goclub"]') && await page.$eval(`#chCampus [data-bldg="${b}"]`, e => e.classList.contains('locked')),
      b + ': ' + sect.toLowerCase() + ' (' + chip + ' in the menu), and a way to the clubhouse'); }
  else { for(const t of tabs){ await page.click(`#bldgPanel .bpTab:text-is("${t}")`); await page.waitForTimeout(60); }
    ok(tabs.length >= 2, b + ': ' + (await page.textContent('#bpTitle')) + ' -- ' + tabs.join(', ')); }
  await page.click('#bldgPanel .bpTopBack'); await page.waitForTimeout(50);
}

// --- the market: scout, bid the asking price, sign him -----------------------------------------
await page.click('#chCampus [data-bldg="market"]'); await page.waitForSelector('#bldgPanel.show'); await page.click('#bpFoot [data-mg="up"]'); await page.waitForTimeout(80);
d = await save();
ok(d.lv.market === 1 && d.budget === 18500 && await page.isVisible('#bldgPanel .bpTab:text-is("Search")'), 'on the transfer market for $1,500: its tabs open up');
await page.click('#bldgPanel .bpTab:text-is("Search")'); await page.waitForTimeout(80);
let signed = false;
for(let i = 0; i < 10 && !signed; i++){                          // the first man who'd come and whom we can afford (page 1: ten men)
  await page.click(`#bpBody .mgList .mgRow >> nth=${i}`); await page.waitForTimeout(60);
  if(await page.$('#bpBody [data-mside="deal"]')){ await page.click('#bpBody [data-mside="deal"]'); await page.waitForTimeout(60); }   // (his card turned over: his deal)
  const card = await page.innerText('#bpBody .mgCard');
  const ask = +(card.match(/ASKING\s*\$([\d,]+)/) || [0, '999999'])[1].replace(/,/g, '');
  if(i === 0) ok(!(await page.$('#bpBody [data-mg="scout"]')) && /scouts’ house/.test(await page.textContent('#bpBody')), 'no scouts\' house: his rating a range, and no SCOUT HIM');
  if(/won’t drop/.test(card) || ask > 15000){ await page.click(`#bpBody .mgList .mgRow >> nth=${i}`); continue; }
  if(await page.$('#bpBody [data-mg="scout"]')){ await page.click('#bpBody [data-mg="scout"]'); await page.waitForTimeout(60); ok(/Scouted/.test(await msg()), 'scouted: ' + await msg()); }
  await page.click('#bpBody [data-mg="bid"]'); await page.waitForTimeout(60);
  info(await msg());
  if(await page.$('#bpBody [data-mg="sign"]')){ await page.click('#bpBody [data-mg="sign"]'); await page.waitForTimeout(60); signed = /Signed/.test(await msg()); }
}
d = await save();
ok(signed && d.roster.length === 15 && d.budget < 18500, 'signed a man for the asking price: squad 15 (the most), budget ' + d.budget);
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

// --- the window shuts, half a season, the winter window, the rest (each day just turning: the day's end is THE
// CAMPUS's) --------------------------------------------------------------------------------------------------------------
await page.emulateMedia({ reducedMotion: 'reduce' });
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
ok(d.sponsorWk === 800 && d.stadium.lvl === 1 && d.capacity === 1800, 'the club\'s partners pay League 1\'s rate; the ground is as it was built (promotion builds nothing)');

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

// --- THE GROUND: built up a level at a time, boards let by the week, sponsors for the shirt and the names ------------
await create('Ground Town');
r = await page.evaluate(() => { const M = __MG, d = M.d, S = M.stadOf(d), out = {};
  out.start = { lvl: S.lvl, cap: M.computeFinance(d).capacity, boards: S.boards, deals: Object.keys(S.deals).length };
  d.budget = 10000; out.poor = M.stadUpgrade(d);
  d.budget = 100000; out.up = M.stadUpgrade(d); out.lvl2 = { lvl: S.lvl, cap: M.computeFinance(d).capacity, cost: 100000 - d.budget };
  const b0 = d.budget; out.board = M.boardBuy(d); const f1 = M.computeFinance(d);
  out.boardCost = b0 - d.budget; out.boardWk = f1.boardsWk; out.att = f1.attendance;
  for(let i = 0; i < 20; i++) M.boardBuy(d); out.boardsN = S.boards; out.full = M.boardBuy(d);
  const bids = M.dealBids(d, 'kit'); out.bids = bids.map(b => b.sp.name + ' $' + b.wk + '/' + b.yrs);
  out.same = JSON.stringify(M.dealBids(d, 'kit')) === JSON.stringify(bids);
  out.sign = M.dealSign(d, 'kit', 0); out.deal = S.deals.kit && { wk: S.deals.kit.wk, until: S.deals.kit.until, yrs: bids[0].yrs };
  out.again = M.dealSign(d, 'kit', 1);
  M.dealBids(d, 'ground'); out.gsign = M.dealSign(d, 'ground', 0); out.gname = M.groundOfYours(d).name; out.gwant = S.deals.ground && S.deals.ground.ground;
  M.dealBids(d, 'E'); out.east = M.dealSign(d, 'E', 0);
  const f2 = M.computeFinance(d); out.dealsWk = f2.dealsWk; out.sumWk = [S.deals.kit.wk + S.deals.ground.wk, f2.poolWk, f2.sponsorWk + f2.broadcastWk + f2.boardsWk + f2.dealsWk];
  const opp = d.div[1].find(id => id !== d.clubId);
  M.mgSetTeams(d, { opp, home: true }); out.home = { lvl: M.G.lvl, boards: M.G.boards.length, venue: M.V, kit: M.T.G.kit.slice() };
  M.mgSetTeams(d, { opp, home: false }); const theirs = M.groundOfClub(d.world.clubs[opp]); out.away = { lvl: M.G.lvl, want: theirs.lvl, boards: M.G.boards.length, wantB: theirs.boards.length, venue: M.V, name: theirs.name };
  const ku = S.deals.kit.until, gu = S.deals.ground.until;
  d.season = Math.min(ku, gu) + 1; M.dealsExpire(d); out.mid = Object.keys(S.deals).sort().join();          // the shorter one ends first
  d.season = Math.max(ku, gu) + 1; M.dealsExpire(d); out.left = Object.keys(S.deals); out.ends = [ku, gu]; d.season = 1;
  const old = { capacity: 6000, clubName: 'Old Town' }; M.stadOf(old); out.old = { lvl: old.stadium.lvl, cap: old.capacity };
  const fresh = { clubName: 'New Town' }; M.stadOf(fresh); out.fresh = fresh.stadium.lvl;
  out.kitCol = S.deals.kit ? null : 'gone';
  return out; });
info('the ground: ' + JSON.stringify(r));
ok(r.start.lvl === 1 && r.start.cap === 1800 && r.start.boards === 0 && r.start.deals === 0, 'a new career\'s ground: a field with two bleachers, 1,800 seats, no boards, no sponsors');
ok(r.poor && r.up === null && r.lvl2.lvl === 2 && r.lvl2.cap === 4200 && r.lvl2.cost === 45000, 'the next level (big bleachers, 4,200 seats) costs $45,000 -- and waits till you have it');
ok(r.board === null && r.boardCost === 900 && r.boardWk === Math.round(r.att * 0.02) && r.boardsN === 10 && r.full,
  'a board costs $900 at level 2 and is let at once (' + r.boardWk + ' a week, by the crowd); room for ten, then no more');
ok(r.bids.length === 3 && r.same && r.sign === null && r.deal && r.deal.until === 1 + r.deal.yrs - 1 && r.again,
  'three bids for the shirt (' + r.bids.join(', ') + '), the same till tomorrow; one signed, and then it\'s taken');
ok(r.gsign === null && r.gname === r.gwant && r.east, 'the ground renamed for its sponsor (' + r.gname + '); no East End to name at level 2');
ok(r.sumWk[1] === r.sumWk[2] && r.dealsWk === r.sumWk[0], 'the deals paid every week, with the partners, TV and boards');
ok(r.home.lvl === 2 && r.home.boards === 10 && r.home.venue === r.gname && r.home.kit.length === 5, 'at home: your stand drawn, your boards up, at ' + r.home.venue + ', the sponsor on the shirt');
ok(r.away.lvl === r.away.want && r.away.boards === r.away.wantB && r.away.venue === r.away.name, 'away: their ground (' + r.away.name + ', level ' + r.away.lvl + ')');
ok(r.left.length === 0 && r.mid === (r.ends[0] === r.ends[1] ? '' : r.ends[0] < r.ends[1] ? 'ground' : 'kit'), 'each deal runs out when its seasons are up (the shirt\'s after season ' + r.ends[0] + ', the name\'s after ' + r.ends[1] + ')');
ok(r.old.lvl === 3 && r.old.cap === 8500 && r.fresh === 1, 'a save from before: the level that seats as many (6,000 -> covered stands, 8,500)');

// --- THE CLUBHOUSE AND WHAT IT UNLOCKS: the market and the physio from the start; the next clubhouse only in the next
// league up, and then with the money; each one opens more (the scouts' house with the cabin, the academy and the
// decorations with the clubhouse, the last levels with the hall), the stadium's levels too ------------------------------
await create('Club Town');
r = await page.evaluate(() => { const M = __MG, d = M.d, him = d.world.clubs[d.div[1].find(id => id !== d.clubId)].players[0].id, out = {};
  const lv = () => JSON.stringify(d.lv), spend = f => { const b = d.budget, e = f(); return [e, b - d.budget]; };
  out.start = lv(); out.noScout = M.mgScout(d, him); d.budget = 1e7;
  out.scout0 = M.bldUp(d, 'scouting'); out.acad0 = M.bldUp(d, 'academy'); out.stad2 = M.bldUp(d, 'stadium'); out.stad3 = M.bldUp(d, 'stadium');
  out.market = spend(() => M.bldUp(d, 'market')); out.physio = spend(() => M.bldUp(d, 'physio')); out.physio2 = M.bldUp(d, 'physio');
  out.club2 = M.bldUp(d, 'club'); d.top = 2; d.budget = 1000; out.club2poor = M.bldUp(d, 'club'); d.budget = 1e7;
  out.club2b = spend(() => M.bldUp(d, 'club')); out.scout = spend(() => M.bldUp(d, 'scouting')); out.scouted = M.mgScout(d, him);
  out.train2 = spend(() => M.bldUp(d, 'train')); out.train3 = M.bldUp(d, 'train'); out.stad3b = M.bldUp(d, 'stadium'); out.acad1 = M.bldUp(d, 'academy');
  d.top = 3; out.club3 = spend(() => M.bldUp(d, 'club')); out.acad = spend(() => M.bldUp(d, 'academy')); out.youth = d.youth.length; out.acad2 = M.bldUp(d, 'academy');
  d.top = 4; out.club4 = spend(() => M.bldUp(d, 'club')); out.club5 = M.bldUp(d, 'club');
  for(const id of ['train', 'train', 'physio', 'physio', 'physio', 'scouting', 'scouting', 'academy', 'academy', 'stadium', 'stadium']) M.bldUp(d, id);
  out.full = lv() + ' stadium ' + M.stadOf(d).lvl; out.more = ['train', 'physio', 'scouting', 'academy', 'stadium'].map(id => M.bldUp(d, id)).filter(Boolean).length;
  out.news = d.news.slice(0, 40).map(n => n.t).filter(t => /move into|open the|build up/.test(t)).length;
  // careers from before: one built up (everything as it was, and a clubhouse that holds it all), one that had only begun
  const pre = JSON.parse(JSON.stringify(d)); delete pre.lv; delete pre.deco; delete pre.store; pre.scoutLvl = 2; pre.academy = 3; M.mgMigrate(pre);
  const v49 = JSON.parse(JSON.stringify(d)); delete v49.lv; delete v49.deco; delete v49.store; v49.built = { scouting: 1 }; v49.decor = { lamps: 1, bikes: 1 }; v49.budget = 0; M.mgMigrate(v49);
  out.pre = JSON.stringify(pre.lv); out.v49 = [JSON.stringify(v49.lv), v49.budget];
  M.renderHub(); return out; });
info('the clubhouse: ' + JSON.stringify(r));
ok(/needs clubhouse 2/.test(r.scout0) && /needs clubhouse 3/.test(r.acad0) && /needs clubhouse 2/.test(r.stad3) && r.stad2 === null && /scouts’ house/.test(r.noScout),
  'the shed: no scouts\' house (clubhouse 2) or academy (3), the stadium to level 2 but not 3, and no scouting');
ok(r.market[0] === null && r.market[1] === 1500 && r.physio[0] === null && r.physio[1] === 5000 && /needs clubhouse 2/.test(r.physio2),
  'the transfer market ($1,500) and the physio ($5,000) to start with; the physio\'s next level waits for clubhouse 2');
ok(/League 1/.test(r.club2) && /budget/.test(r.club2poor) && r.club2b[0] === null && r.club2b[1] === 30000,
  'the cabin: not before League 1 (' + r.club2 + '), then $30,000');
ok(r.scout[0] === null && r.scout[1] === 12000 && r.scouted === null && r.train2[1] === 10000 && /clubhouse 3/.test(r.train3) && r.stad3b === null && /clubhouse 3/.test(r.acad1),
  'with the cabin: the scouts\' house ($12,000) and scouting, the training pitch to level 2 ($10,000), the stadium to 3; not yet the academy');
ok(r.club3[1] === 120000 && r.acad[0] === null && r.acad[1] === 25000 && r.youth > 0 && /clubhouse 4/.test(r.acad2),
  'the clubhouse ($120,000): the academy ($25,000), its first ' + r.youth + ' youngsters in at once; its next level waits for the hall');
ok(r.club4[1] === 450000 && /as good as it gets/.test(r.club5) && r.full === '{"club":4,"train":4,"physio":4,"market":1,"scouting":3,"academy":3} stadium 5' && r.more === 5 && r.news >= 8,
  'the hall ($450,000): everything to its last level, the stadium to 5, and no further; the news says so as it goes');
ok(r.pre === '{"club":4,"train":4,"physio":0,"market":1,"scouting":2,"academy":3}' && r.v49[0] === '{"club":1,"train":1,"physio":0,"market":1,"scouting":1,"academy":0}' && r.v49[1] === 2400,
  'careers from before: one built up keeps it all (the hall, its scouting and academy as they were); one that had only begun starts in the shed, its plants\' money back ($2,400)');

// --- THE TRAINING PITCH: its level locks shapes, styles and instructions (your side's, in a career) -------------------
await page.evaluate(() => { const d = __MG.d; d.lv.train = 1; __MG.mgSave(d); });
await page.click('#chCampus [data-bldg="train"]'); await page.waitForSelector('#bldgPanel.show'); await page.click('#bldgPanel .bpTab:text-is("Tactics")'); await page.waitForTimeout(80);
const locks = async () => { const o = {};
  await page.click('#bpBody [data-tdrop="form"]'); await page.waitForTimeout(60); o.forms = await page.$$eval('#bpBody .formBtn.locked', ns => ns.map(n => n.dataset.cform + ' (' + n.querySelector('.lk').textContent + ')'));
  await page.click('#bpBody [data-tdrop="style"]'); await page.waitForTimeout(60); o.styles = await page.$$eval('#bpBody .tbOpt.locked', ns => ns.length);
  o.free = await page.$$eval('#bpBody .tbOpt:not(.locked)', ns => ns.map(n => n.textContent).join()); await page.click('#bpBody [data-tdrop="style"]'); await page.waitForTimeout(60);
  await page.click('#bpBody .tpitch .ptk[data-tac="field"] >> nth=2'); await page.waitForTimeout(60);
  if(await page.$('#cTacRight button[data-cside="instr"]')){ await page.click('#cTacRight button[data-cside="instr"]'); await page.waitForTimeout(60); }
  o.instr = await page.$$eval('#cTacRight .instrGrp', ns => ns.map(n => (n.classList.contains('locked') ? 'locked ' : '') + n.querySelector('.instrGrpLbl').textContent.replace(/(\d)$/, ' $1')).join(', '));
  return o; };
const l1 = await locks(), lt1 = await page.evaluate(() => { const M = __MG; M.lock = 1; return [M.tacNeed('form', '1-3-3'), M.tacNeed('style', 'gegen'), M.tacNeed('instr', 'cbAggr'), M.tacNeed('instr', 'gkPass')]; });
await page.evaluate(() => { const d = __MG.d; d.lv.train = 4; __MG.mgSave(d); }); await page.click('#bldgPanel .bpTab:text-is("Pitch")'); await page.click('#bldgPanel .bpTab:text-is("Tactics")'); await page.waitForTimeout(80);
const l4 = await locks();
await page.click('#bldgPanel .bpTopBack'); await page.waitForTimeout(80);
info('training locks: ' + JSON.stringify({ l1, lt1, l4 }));
ok(l1.forms.length === 7 && l1.styles === 5 && /BALANCED/.test(l1.free) && /DIRECT/.test(l1.free) && String(lt1) === '4,4,4,0' && /locked/.test(l1.instr),
  'training pitch level 1: three shapes (the other seven locked, each with its level: ' + l1.forms.slice(0, 3).join(' ') + '...), two styles (balanced, direct), instructions locked (' + l1.instr + ')');
ok(!l4.forms.length && !l4.styles && !/locked/.test(l4.instr), 'built up to level 4: every shape, style and instruction');

// --- THE PHYSIO: in a career match your side tires more slowly and gets more back at half-time; a little in a simulated
// game too -------------------------------------------------------------------------------------------------------------
r = await page.evaluate(() => { const M = __MG, d = M.d, me = { team: 'G' }, them = { team: 'R' }, out = {};
  M.fix = null; out.none = [M.physioBack(me), M.physioWear(me)];
  M.fix = { physio: 1 }; out.l1 = [M.physioBack(me), M.physioWear(me), M.physioBack(them), M.physioWear(them)];
  M.fix = { physio: 4 }; out.l4 = [M.physioBack(me), +M.physioWear(me).toFixed(2)]; M.fix = null;
  const L = d.lv.physio; d.lv.physio = 0; const s0 = M.mgSimStr(d, d.clubId) - M.mgStrength(d, d.clubId); d.lv.physio = 4; out.sim = [s0, +(M.mgSimStr(d, d.clubId) - M.mgStrength(d, d.clubId)).toFixed(2)]; d.lv.physio = L;
  return out; });
ok(String(r.none) === '0.25,1' && String(r.l1) === '0.35,0.92,0.25,1' && String(r.l4) === '0.65,0.68' && String(r.sim) === '0,1.6',
  'the physio: a quarter of the legs back at half-time without one, 35% at level 1 up to 65% at 4; tiring 8% slower a level (yours, not theirs); +' + r.sim[1] + ' in a simulated game at level 4');

// --- DECORATIONS: bought from DECORATE and put down where you like (somewhere free), moved, put away, put out again ------
await page.click('#careerHub .cpDeco'); await page.waitForSelector('#bldgPanel.show'); await page.waitForTimeout(60);
const decoTabs = await page.$$eval('#bldgPanel .bpTab', ns => ns.map(n => n.textContent));
const b0 = (await save()).budget;
await page.click('#bpBody [data-mg="dbuy"][data-id="oak"]'); await page.waitForTimeout(150); await page.keyboard.press('Escape'); await page.waitForTimeout(150);
const left = await page.evaluate(() => ({ on: __MG.PLACE.on, cls: document.getElementById('careerHub').classList.contains('placing'), panel: document.getElementById('bldgPanel').classList.contains('show'), n: (__MG.d.deco || []).length, budget: __MG.d.budget }));
ok(!left.on && !left.cls && left.panel && left.n === 0 && left.budget === b0, 'Escape while one is being put down: left, nothing paid, back in the shop');
await page.click('#bpBody [data-mg="dbuy"][data-id="oak"]'); await page.waitForTimeout(150);
const placing = await page.evaluate(() => ({ on: __MG.PLACE.on, k: __MG.PLACE.k, ok: __MG.PLACE.ok, bar: document.getElementById('cpPlace').textContent, cls: document.getElementById('careerHub').classList.contains('placing'), panel: document.getElementById('bldgPanel').classList.contains('show') }));
// drag it onto the clubhouse (red: it can't go there), then to the lawn by the stadium (green)
const toScreen = (x, y) => page.evaluate(([x, y]) => { const v = document.getElementById('cpView').getBoundingClientRect(), m = new DOMMatrix(getComputedStyle(document.getElementById('cpWorld')).transform); return [v.left + m.e + x * m.a, v.top + m.f + y * m.a]; }, [x, y]);
const g0 = await page.evaluate(() => [__MG.PLACE.x, __MG.PLACE.y]), from = await toScreen(g0[0] + 30, g0[1] + 50), club = await page.evaluate(() => __MG.cpPieces(__MG.d).find(p => p.id === 'club'));
const onClub = await toScreen(club.x + club.box[2] / 2, club.y + club.box[3] - 20), lawn = await toScreen(560, 160);
await page.mouse.move(from[0], from[1]); await page.mouse.down(); await page.mouse.move(onClub[0], onClub[1], { steps: 6 }); await page.waitForTimeout(60);
const red = await page.evaluate(() => __MG.PLACE.ok); await page.mouse.move(lawn[0], lawn[1], { steps: 6 }); await page.mouse.up(); await page.waitForTimeout(80);
const green = await page.evaluate(() => ({ ok: __MG.PLACE.ok, x: __MG.PLACE.x, y: __MG.PLACE.y, btn: !document.querySelector('#cpPlace [data-cp="ok"]').disabled }));
await page.click('#cpPlace [data-cp="ok"]'); await page.waitForTimeout(100);
d = await save();
ok(decoTabs.join() === 'Trees,Garden,Plaza' && placing.on && placing.k === 'oak' && placing.cls && !placing.panel && /PUT IT HERE/.test(placing.bar),
  'DECORATE: Trees, Garden, Plaza; an oak bought -- the shop shut, the oak over the campus to put down: ' + placing.bar.replace(/\s+/g, ' '));
ok(red === false && green.ok && green.btn && d.deco.length === 1 && d.deco[0].k === 'oak' && d.deco[0].x === green.x && d.budget === b0 - 1200,
  'dragged onto the clubhouse it can\'t go (red); onto the lawn it can (green): put down there, $1,200 paid');
await page.click('#careerHub [data-hub="move"]'); await page.waitForTimeout(60);
const oak = await toScreen(d.deco[0].x + 30, d.deco[0].y + 40); await page.mouse.click(oak[0], oak[1]); await page.waitForTimeout(80);
const picked = await page.evaluate(() => ({ k: __MG.PLACE.k, idx: __MG.PLACE.idx, bar: document.getElementById('cpPlace').textContent }));
await page.click('#cpPlace [data-cp="store"]'); await page.waitForTimeout(60); await page.click('#cpPlace [data-cp="done"]'); await page.waitForTimeout(60);
d = await save(); const stored = [d.deco.length, d.store.oak];
await page.click('#careerHub .cpDeco'); await page.waitForSelector('#bldgPanel.show'); await page.click('#bpBody [data-mg="dout"][data-id="oak"]'); await page.waitForTimeout(120);
await page.click('#cpPlace [data-cp="ok"]'); await page.waitForTimeout(80);
d = await save();
ok(picked.k === 'oak' && /PUT AWAY/.test(picked.bar) && String(stored) === '0,1' && d.deco.length === 1 && !d.store.oak && d.budget === b0 - 1200,
  'MOVE: tapped, the oak is picked up; PUT AWAY puts it in store; PUT ONE OUT puts it down again (nothing more to pay)');
r = await page.evaluate(() => { const M = __MG, d = M.d, P = M.cpPieces(d), club = P.find(p => p.id === 'club'), sp = M.CAMPUS_META.deco.oak.s;
  const onIt = M.decoFree(d, 'oak', club.fp[0] + 10, club.fp[1] + club.fp[3] - sp[3] - 2), inStad = M.decoFree(d, 'oak', 300, 20), offEdge = M.decoFree(d, 'oak', 750, 300);
  d.deco.push({ k: 'pine', x: club.fp[0] + 20, y: club.fp[1] + 10 - M.CAMPUS_META.deco.pine.s[3] + 20 }); const n = M.decoMakeRoom(d);
  M.mgSave(d); M.renderHub(); return { onIt, inStad, offEdge, n, store: d.store.pine || 0 }; });
ok(!r.onIt && !r.inStad && !r.offEdge && r.n === 1 && r.store === 1, 'nothing goes down on a building, in the stadium or off the edge; one in a new building\'s way goes into store');

// --- THE CAMPUS: the hub draws the club as it is -- its stadium at its level with its name, the clubhouse at its level
// with your crest and letters, each building or its plot, the decorations -- and draws it again as it's built up; a
// building tapped on the campus lights its button, the camera goes in on it with its name over it, it opens, and back
// out the camera comes back out --------------------------------------------------------------------------------------
await page.emulateMedia({ reducedMotion: 'no-preference' });
await create('Campus Town');
await page.evaluate(() => __MG.renderHub()); await page.waitForTimeout(100);
r = await page.evaluate(() => { const M = __MG, d = M.d, CM = M.CAMPUS_META, cv = document.getElementById('cpCanvas'), me = d.world.clubs[d.clubId];
  const hash = (c, b) => { const p = c.getContext('2d').getImageData(b[0], b[1], b[2], b[3]).data; let s = 0; for(let i = 0; i < p.length; i++) s = (s * 31 + p[i]) >>> 0; return s; };
  const full = [0, 0, CM.w, CM.h], draw = o => { const c = document.createElement('canvas'); c.width = CM.w; c.height = CM.h; M.CAMPUS.draw(c, o); return c; };
  const mine = () => ({ stad: M.stadOf(d).lvl, name: M.groundOfYours(d).name, crest: M.crestFor(me), code: me.code, pieces: M.cpPieces(d), deco: d.deco }), but = o => Object.assign(mine(), o);
  const S = CM.stad[1].sign, nameAt = [S.cx - 40, S.y + CM.oys, 80, 9], band = [0, 0, CM.w, CM.foot];
  const C1 = CM.club[1], crestAt = [C1.x + C1.c[0], C1.y + C1.c[1], 8, 9];
  const out = { lvl: M.stadOf(d).lvl, name: M.groundOfYours(d).name, asClub: hash(cv, full) === hash(draw(mine()), full),
    named: hash(draw(mine()), nameAt) !== hash(draw(but({ name: 'Kestrel Arena' })), nameAt), crested: hash(draw(mine()), crestAt) !== hash(draw(but({ crest: null })), crestAt),
    levels: new Set([1, 2, 3, 4, 5].map(l => hash(draw(but({ stad: l })), band))).size, pieces: M.cpPieces(d).map(p => p.id + (p.plot ? '(plot)' : '')).join() };
  d.budget = 1e7; d.top = 4; const before = hash(cv, full);
  M.bldUp(d, 'club'); M.renderHub(); out.club2 = hash(cv, full) !== before && hash(cv, full) === hash(draw(mine()), full);
  const C2 = CM.club[2], codeAt = [C2.x + C2.code[0] - 8, C2.y + C2.code[1], 16, 5]; out.coded = hash(draw(mine()), codeAt) !== hash(draw(but({ code: null })), codeAt);
  out.pieces2 = M.cpPieces(d).map(p => p.id + (p.plot ? '(plot)' : '')).join();
  M.bldUp(d, 'club'); M.bldUp(d, 'club'); out.clubs = new Set([1, 2, 3, 4].map(l => { d.lv.club = l; return hash(draw(mine()), full); })).size;
  for(const id of ['physio', 'scouting', 'academy']) M.bldUp(d, id); out.pieces4 = M.cpPieces(d).map(p => p.id + (p.plot ? '(plot)' : '')).join();
  d.deco = [{ k: 'lamp', x: 40, y: 330 }]; const withLamp = hash(draw(mine()), full); d.deco = []; out.decoDrawn = withLamp !== hash(draw(mine()), full);
  const s0 = hash(cv, band); out.up = M.bldUp(d, 'stadium'); M.renderHub(); out.rebuilt = hash(cv, band) !== s0 && hash(cv, full) === hash(draw(mine()), full);
  M.mgSave(d); return out; });
info('the campus: ' + JSON.stringify(r));
ok(r.asClub && r.named && r.crested && r.levels === 5, 'the campus is the club\'s: its stadium at level ' + r.lvl + ' with ' + r.name + ' on its gate, its crest on the shed; each level of the stadium its own');
ok(r.pieces === 'club,train,physio(plot)' && r.pieces2 === 'club,train,physio(plot),scouting(plot)' && r.pieces4 === 'club,train,physio,scouting,academy',
  'what stands on it: the shed, the training pitch and the physio\'s plot; the scouts\' plot with the cabin; every building once it\'s up');
ok(r.club2 && r.coded && r.clubs === 4 && r.decoDrawn, 'the cabin drawn as soon as you move in, your letters on its board; four clubhouses, each its own; a decoration where it was put');
ok(r.up === null && r.rebuilt, 'the stadium built up a level, drawn again at once');
{ const tf = () => page.evaluate(() => { const m = new DOMMatrix(getComputedStyle(document.getElementById('cpWorld')).transform); return [m.a, m.e, m.f]; });
  const at = await page.evaluate(() => { const b = document.querySelector('#cpHots [data-bldg="stadium"]').getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; });
  const m0 = await tf(); await page.mouse.click(at[0], at[1]); await page.waitForTimeout(90);
  const mid = await page.evaluate(() => ({ sel: [...document.querySelectorAll('#chCampus .bldg.sel')].map(e => e.dataset.bldg).join(), tag: document.getElementById('cpTag').classList.contains('on') ? document.getElementById('cpTag').textContent : '' }));
  const m1 = await tf(); await page.waitForSelector('#bldgPanel.show', { timeout: 2000 }); const title = await page.textContent('#bpTitle'), back = await page.textContent('#bldgPanel .bpTopBack');
  await page.click('#bldgPanel .bpTopBack'); await page.waitForTimeout(450); const m2 = await tf(), lit = await page.$$eval('#chCampus .bldg.sel', ns => ns.length);
  ok(m1[0] > m0[0] && mid.sel === 'stadium' && /STADIUM/.test(mid.tag) && title === r.name.toUpperCase() && /CAMPUS/.test(back),
    'the ground tapped on the campus: STADIUM lit, the camera in on it (x' + m1[0].toFixed(2) + ' from x' + m0[0].toFixed(2) + '), then ' + title + ', back to the ' + back.replace(/[^A-Z ]/g, '').trim());
  ok(m2.join() === m0.join() && !lit, 'back out: the camera where it was, nothing lit');
  const t0 = await tf(); await page.click('#chCampus [data-bldg="market"]'); await page.waitForTimeout(40);
  const phone = { open: await page.isVisible('#bldgPanel.show'), title: await page.textContent('#bpTitle'), still: (await tf()).join() === t0.join() };
  await page.click('#bldgPanel .bpTopBack'); await page.waitForTimeout(100);
  ok(phone.open && phone.title === 'TRANSFERS' && phone.still, 'TRANSFERS: on your phone, open at once, the camera not moving'); }

// --- THE DAY'S END: NEXT DAY sets the sun behind your stadium (the moon up and down, the sun up again) over the campus,
// the menu waiting; it ends by itself, a tap ends it sooner, and it doesn't play for a player who asks for less motion ----
await page.evaluate(() => { const d = __MG.d; d.phase = 'summer'; d.day = 1; __MG.mgSave(d); __MG.renderHub(); }); await page.waitForTimeout(80);
await page.click('#chBottom [data-mg="nextday"]'); await page.waitForTimeout(500);
const scene = await page.evaluate(() => { const el = document.getElementById('cpDay'), cv = document.getElementById('cpDayCv'), g = cv.getContext('2d'), px = g.getImageData(0, 0, cv.width, cv.height).data, cols = new Set();
  for(let i = 0; i < px.length; i += 4 * 97) cols.add(px[i] + ',' + px[i + 1] + ',' + px[i + 2]);
  return { on: el.classList.contains('on'), cols: cols.size, waits: getComputedStyle(document.querySelector('#careerHub .cpNav')).pointerEvents === 'none', day: __MG.d.day }; });
await page.waitForTimeout(3300);
const after = await page.evaluate(() => ({ on: document.getElementById('cpDay').classList.contains('on'), label: document.getElementById('cpDayT').textContent, menu: getComputedStyle(document.querySelector('#careerHub .cpNav')).pointerEvents }));
await page.click('#chBottom [data-mg="nextday"]'); await page.waitForTimeout(300); await page.click('#cpDay'); await page.waitForTimeout(350);
const tapped = await page.evaluate(() => ({ on: document.getElementById('cpDay').classList.contains('on'), day: __MG.d.day }));
await page.click('#chBottom [data-mg="nextday"]'); await page.waitForTimeout(200);
await page.evaluate(() => document.querySelector('#chBottom [data-mg="nextday"]').click()); await page.waitForTimeout(60);   // (a key on it, the tap blocked)
const twice = await page.evaluate(() => __MG.d.day); await page.keyboard.press('Escape'); await page.waitForTimeout(350);
const escd = await page.evaluate(() => ({ on: document.getElementById('cpDay').classList.contains('on'), day: __MG.d.day, hub: document.getElementById('careerHub').classList.contains('show') }));
await page.emulateMedia({ reducedMotion: 'reduce' }); await page.click('#chBottom [data-mg="nextday"]'); await page.waitForTimeout(150);
const still = await page.evaluate(() => ({ on: document.getElementById('cpDay').classList.contains('on'), day: __MG.d.day }));
info('the day\'s end: ' + JSON.stringify({ scene, after, tapped, twice, escd, still }));
ok(scene.on && scene.cols > 20 && scene.waits && scene.day === 2 && !after.on && after.label === 'SUMMER WINDOW · DAY 2/5' && after.menu !== 'none',
  'NEXT DAY: the day turns (day ' + scene.day + '), the sun goes down behind your stadium and comes up again (' + scene.cols + ' colours in it), the menu waiting; then ' + after.label + ', and it\'s gone');
ok(!tapped.on && tapped.day === 3 && twice === 4 && !escd.on && escd.day === 4 && escd.hub && !still.on && still.day === 5,
  'a tap ends it at once; NEXT DAY again while it plays does nothing, Escape ends it (still on the campus); with less motion asked for, it doesn\'t play (the day still turns)');

process.exitCode = rep.finish();
await browser.close();
