// FOOTBALL CLASSIC, MANAGER CAREER: create a manager and club -- its short name (suggested from its name, or your own
// three letters, no other club's) and its crest (made on the card) -- walk every building, buy, sell and sign in the
// summer window, simulate a season through the winter window to the review, start the next one. Then, on a copy of
// the game that lets the test reach the season code: a strong side is promoted (and lands in League 1 with a full
// fixture list, its ground as it was), a top-six side plays the playoffs, the goals in a played match go to the men
// who scored them, and THE GROUND: a field with two bleachers to start, built up a level at a time, boards let by the
// week, sponsors' bids for the shirt, the ground's name and the stands', their deals paid weekly and run out. Last, THE
// CAMPUS (the hub): a new career's has the ground and the clubhouse, plots for the rest (built when they're paid for) and
// no plants or things (bought); it's drawn as the club has it -- the ground as built, its name, the boards, your crest,
// what's built and bought -- and a building tapped on it opens with the camera going in on it, and comes back out the
// same way; TRANSFERS is on your phone (straight in).
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
  + 'CAMPUS, CAMPUS_META, crestFor, cpHas, mgBuild, mgBuilt, decorBuy, mgScout, mgMigrate, get DECOR_SHOP(){ return DECOR_SHOP; }, get MG_BUILD(){ return MG_BUILD; }, get G(){ return MATCH_GROUND; }, get V(){ return VENUE; }, get T(){ return TEAM; }};\n' + anchor);
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

// --- every building, every tab: a new career has the ground and the clubhouse (and TRANSFERS on your phone); the
// scouts' house, the academy, the newsstand and your house are plots, each with its price -----------------------------
ok(JSON.stringify(d.built) === '{}' && JSON.stringify(d.decor) === '{}' && d.youth.length === 0, 'a new career: nothing built, nothing bought, no academy, so no youngsters');
for(const b of ['office', 'market', 'scouting', 'academy', 'stadium', 'news', 'home']){
  await page.click(`#chCampus [data-bldg="${b}"]`); await page.waitForSelector('#bldgPanel.show'); await page.waitForTimeout(60);
  const tabs = await page.$$eval('#bldgPanel .bpTab', ns => ns.map(n => n.textContent));
  if(['scouting', 'academy', 'news', 'home'].includes(b)){
    const chip = await page.textContent(`#chCampus [data-bldg="${b}"] .bPrice`), btn = await page.textContent('#bpFoot [data-mg="build"]');
    ok(!tabs.length && /BUILD IT/.test(btn) && await page.$eval(`#chCampus [data-bldg="${b}"]`, e => e.classList.contains('unbuilt')), b + ': a plot -- ' + btn + ' (' + chip + ' in the menu)'); }
  else { for(const t of tabs){ await page.click(`#bldgPanel .bpTab:text-is("${t}")`); await page.waitForTimeout(60); }
    ok(tabs.length >= 2, b + ': ' + (await page.textContent('#bpTitle')) + ' -- ' + tabs.join(', ')); }
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
  if(i === 0) ok(!(await page.$('#bpBody [data-mg="scout"]')) && /scouts’ house/.test(await page.textContent('#bpBody')), 'no scouts\' house: his rating a range, and no SCOUT HIM');
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

// --- BUILDING AND DECORATING: a plot built on when it's paid for (the academy brings its first youngsters), the
// scouts' house before any scouting, the campus's plants and things bought one set at a time --------------------------
r = await page.evaluate(() => { const M = __MG, d = M.d, him = d.world.clubs[d.div[1].find(id => id !== d.clubId)].players[0].id, out = {};
  out.start = [JSON.stringify(d.built), JSON.stringify(d.decor)]; out.noScout = M.mgScout(d, him);
  d.budget = 1000; out.poor = M.mgBuild(d, 'academy');
  d.budget = 100000; out.acad = M.mgBuild(d, 'academy'); out.acadCost = 100000 - d.budget; out.youth = d.youth.length; out.again = M.mgBuild(d, 'academy');
  for(const b of ['scouting', 'news', 'home']) M.mgBuild(d, b);
  out.built = Object.keys(d.built).sort().join(); out.scout = M.mgScout(d, him);
  const b1 = d.budget; out.lamps = M.decorBuy(d, 'lamps'); out.lampCost = b1 - d.budget; out.twice = M.decorBuy(d, 'lamps');
  d.budget = 10; out.poorDecor = M.decorBuy(d, 'maple'); d.budget = 100000;
  const old = JSON.parse(JSON.stringify(d)); delete old.built; delete old.decor; M.mgMigrate(old);
  out.old = [Object.keys(old.built).length, Object.keys(old.decor).length, M.DECOR_SHOP.length];
  M.renderHub(); return out; });
info('building and decorating: ' + JSON.stringify(r));
ok(r.start[0] === '{}' && /scouts’ house/.test(r.noScout) && r.poor && r.acad === null && r.acadCost === 25000 && r.youth > 0 && r.again,
  'the academy built for $25,000 (and not before you have it), its first ' + r.youth + ' youngsters in at once; no scouting till the scouts\' house is up');
ok(r.built === 'academy,home,news,scouting' && r.scout === null, 'the scouts\' house, the newsstand and your house built too: now you can scout');
ok(r.lamps === null && r.lampCost === 2000 && r.twice && r.poorDecor, 'the plaza\'s lamps bought for $2,000, once; the maple leaf waits till you can pay');
ok(r.old[0] === 4 && r.old[1] === r.old[2], 'a career from before: everything built and planted, as its campus was');

// --- THE CAMPUS: the hub draws the club as it is -- its ground at its level, the name, the boards, its crest -- and draws
// it again when the ground's built up; a building tapped on the campus lights its button, the camera goes in on it with
// its name over it, it opens, and back out the camera comes back out ---------------------------------------------------
await page.evaluate(() => __MG.renderHub()); await page.waitForTimeout(100);
r = await page.evaluate(() => { const M = __MG, d = M.d, CM = M.CAMPUS_META, cv = document.getElementById('cpCanvas');
  const hash = (c, b) => { const p = c.getContext('2d').getImageData(b[0], b[1], b[2], b[3]).data; let s = 0; for(let i = 0; i < p.length; i++) s = (s * 31 + p[i]) >>> 0; return s; };
  const full = [0, 0, CM.w, CM.h], draw = o => { const c = document.createElement('canvas'); c.width = CM.w; c.height = CM.h; M.CAMPUS.draw(c, o); return c; };
  const g = M.groundOfYours(d), mine = { lvl: g.lvl, name: g.name, stand: g.stand, boards: g.boards, crest: M.crestFor(d.world.clubs[d.clubId]), has: M.cpHas(d) }, but = o => Object.assign({}, mine, o);
  const L = CM.lv[g.lvl], crestAt0 = CM.items.find(it => it.n === 'office'), nameAt = L.sign ? [L.sign[0], L.sign[1], L.sign[2], 9] : L.press ? [L.press[0], L.press[1], L.press[2], 5] : [L.south[0] - L.south[2] / 2, L.south[1], L.south[2], 9];
  const boardsAt = [L.boards[0], L.boards[2], L.boards[1] - L.boards[0], 8], crestAt = [crestAt0.x + crestAt0.c[0], crestAt0.y + crestAt0.c[1], 8, 9], big = CM.lv[5].box;
  const out = { lvl: g.lvl, boards: g.boards.length, name: g.name, asClub: hash(cv, full) === hash(draw(mine), full),
    named: hash(draw(mine), nameAt) !== hash(draw(but({ name: 'Kestrel Arena' })), nameAt), boarded: hash(draw(mine), boardsAt) !== hash(draw(but({ boards: [] })), boardsAt),
    crested: hash(draw(mine), crestAt) !== hash(draw(but({ crest: null })), crestAt), levels: new Set([1, 2, 3, 4, 5].map(l => hash(draw(but({ lvl: l })), big))).size,
    bare: hash(draw(but({ has: gr => gr === 'core' || gr[0] === 'p' })), full) !== hash(draw(mine), full),
    plots: Object.keys(CM.plots).length === 4 && CM.items.filter(it => it.g[0] === 'd').length > 30 && !CM.items.some(it => it.n === 'market') };
  const before = hash(cv, big), w0 = parseFloat(document.querySelector('#cpHots [data-bldg="stadium"]').style.width);
  d.budget = 1e6; out.up = M.stadUpgrade(d); M.renderHub();
  out.rebuilt = hash(cv, big) !== before && hash(cv, full) === hash(draw(but({ lvl: M.stadOf(d).lvl })), full);
  out.wider = parseFloat(document.querySelector('#cpHots [data-bldg="stadium"]').style.width) > w0;
  return out; });
info('the campus: ' + JSON.stringify(r));
ok(r.asClub && r.named && r.boarded && r.crested && r.levels === 5, 'the campus is the club\'s: its ground at level ' + r.lvl + ', ' + r.name + ' on it, its ' + r.boards + ' boards, its crest on the clubhouse; each level\'s ground its own');
ok(r.bare && r.plots, 'built up and planted, it isn\'t a new career\'s (the clubhouse and four plots, no plants); no market hall: the market\'s on your phone');
ok(r.up === null && r.rebuilt && r.wider, 'built up a level, the campus is drawn again with the bigger ground (and more of it to tap)');
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

process.exitCode = rep.finish();
await browser.close();
