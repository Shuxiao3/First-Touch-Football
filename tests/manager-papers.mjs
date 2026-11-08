// FOOTBALL CLASSIC, THE MONDAY PAPERS (v103): each Monday the week's papers are on your desk, a pile to go through in
// place of the check-ins -- the dressing room's mood and how it's moved since last week first; then what needs
// deciding (a club's bid for one of yours, a club's answer to your bid, a sponsor's offer, a man who wants a new deal,
// one who wants to leave, one who wants a word); then the reports (the physio's, the coaches' every third week, the
// next game, the week's money). The pile opens by itself on a Monday, ✕ puts it aside (PAPERS on the hub opens it
// again), LATER puts a paper to the bottom, and what's decided there is decided as it would be anywhere else. A
// decision you leave is in next Monday's pile while it stands. And the sponsors who call: nobody at first -- one bare
// board -- then the businesses round the corner. On a copy of the game that lets the test reach it.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  let INJ_OFF=false;', '  let INJ_OFF=true;');
patch('  // ===== END MANAGER CAREER', '  window.__K={ ev:s=>eval(s) };\n  // ===== END MANAGER CAREER');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-papers-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy, papers: true });
const { ok, info } = rep;
const K = s => page.evaluate(s => window.__K.ev(s), s);
const top = () => page.innerText('#pileModal .plPaper').catch(() => '');
const modal = () => page.evaluate(() => document.getElementById('pileModal').classList.contains('on'));
const press = async a => { await page.click('#pileModal [data-pile="' + a + '"]'); await page.waitForTimeout(80); };
// through the pile (NEXT, or LATER for a decision) till the paper on top says `re`
// (each click waits for the paper on top to change, so a slow page under load can't skip one)
const toPaper = async re => { for(let i = 0; i < 16; i++){ const t = await top(); if(re.test(t)) return true; const b = await page.$('#pileModal .plBtns [data-pile="next"]') || await page.$('#pileModal .plBtns [data-pile="later"]'); if(!b) return false; await b.click();
  for(let w = 0; w < 30 && (await top()) === t; w++) await page.waitForTimeout(50); } return false; };
let r;
await page.emulateMedia({ reducedMotion: 'reduce' });
await page.click('#smItems [data-act="new"]'); await page.waitForTimeout(150);
await page.click('#newSlotList .slotBtn >> nth=0'); await page.waitForTimeout(100);
await page.waitForSelector('#mgrMaker.on', { timeout: 4000 });
await page.fill('#mgName', 'Sam Okafor'); await page.fill('#mgClubIn', 'Paper Town');
await page.click('#mgGo'); await page.waitForSelector('#careerHub.show', { timeout: 6000 });
await K(`(()=>{ const d=CAREER.data; d.story={vet:2,kid:2,phone:2}; mgMarketOpen(d); mgStoryShow(d); mgSave(d); renderHub(); return 1; })()`);

// --- a new career: nothing on the desk yet, one bare board and nobody calling ------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, S=stadOf(d); return { pile:pileLeft(d).length, modal:document.getElementById('pileModal').classList.contains('on'), btn:document.getElementById('chBottom').textContent, boards:S.boards, ads:S.ads.length, offers:d.spOff.length }; })()`);
ok(r.pile === 0 && !r.modal && !/PAPERS/.test(r.btn) && /NEXT WEEK/.test(r.btn) && r.boards === 1 && r.ads === 0 && r.offers === 0,
  'a new career\'s first Monday: no papers yet (' + r.btn.trim() + '), one bare board, no sponsor offers');

// --- a week on: the pile waits off to the side (v106: PAPERS on the campus, its count in an orange box); pressed, the
// dressing room first; ✕ puts it aside, PAPERS brings it back -------------------------------------------------------------------
await K(`(()=>{ const d=CAREER.data; d.roster[0].mor=8.5; d.roster[1].mor=2.9; mgForward(d); mgSave(d); renderHub(); return 1; })()`);
await page.waitForTimeout(150);
const side = await K(`(()=>{ const d=CAREER.data, b=document.querySelector('#careerHub .cpPapers'), n=document.getElementById('cpPapersN');
  return { modal:document.getElementById('pileModal').classList.contains('on'), shown:!!b&&getComputedStyle(b).display!=='none', n:n&&n.textContent, left:pileLeft(d).length, fresh:!!b&&b.classList.contains('fresh'), btn:document.getElementById('chBottom').textContent }; })()`);
ok(!side.modal && side.shown && +side.n === side.left && side.left > 0 && side.fresh && !/PAPERS/.test(side.btn),
  'a week on: the papers wait off to the side, not over the hub -- PAPERS on the campus, ' + side.n + ' in its orange box, glowing till they\'re opened');
await page.click('#careerHub .cpPapers'); await page.waitForTimeout(150);
r = await K(`(()=>{ const d=CAREER.data, L=pileLeft(d); return { kinds:L.map(x=>x.k), head:document.querySelector('#pileModal .plHead').textContent, wk:mgWeekShort(d), fresh:document.querySelector('#careerHub .cpPapers').classList.contains('fresh') }; })()`);
const first = await top();
info('the first pile: ' + JSON.stringify({ r, first }));
ok(await modal() && r.kinds[0] === 'mor' && /THE DRESSING ROOM/.test(first) && /Team morale \d+\.\d/.test(first) && /MORALE \d+\.\d/.test(r.head) && /TO GO/.test(r.head) && !r.fresh,
  'PAPERS pressed (' + r.wk + '): the dressing room on top ("' + first.split('\n')[1] + '"), the side\'s morale over the pile, and the button\'s glow gone');
await press('close');
r = await K(`(()=>{ const d=CAREER.data; renderHub(); return { modal:document.getElementById('pileModal').classList.contains('on'), left:pileLeft(d).length }; })()`);
await page.click('#careerHub .cpPapers'); await page.waitForTimeout(120);
ok(!r.modal && r.left > 0 && await modal(), '✕ puts them aside -- they don\'t open again by themselves -- and PAPERS brings them back');

// --- the decisions: a club's bid for one of yours, your bid answered, a sponsor, a new deal, one who wants out -------------------
await K(`(()=>{ const d=CAREER.data, R=d.roster, cl=d.div[1].filter(id=>id!==d.clubId), c=d.world.clubs[cl[0]];
  d.offers=[{id:++d.offerSeq,pid:R[5].id,club:cl[0],fee:3000,wk:d.wkN},{id:++d.offerSeq,pid:R[6].id,club:cl[1],fee:2500,wk:d.wkN}];
  const t=d.world.clubs[cl[2]], tp=t.players.slice().sort((a,b)=>a.ovr-b.ovr)[0]; d.budget=60000; d.bids=[{pid:tp.id,club:t.id,fee:900,st:'more',ask:mgRound(Math.max(1000,mgAsk(d,tp,t))),rival:null,wk:d.weeks}];
  window.__tp=tp.id; d.spOff=[spOfferFor(d,'board',new Set())];
  for(const p of R){ delete p.wantsOut; delete p.cAsk; }   // (nobody else asking for anything this week)
  R[7].cAsk={wage:mgRenewWage(d,R[7]),wk:d.weeks}; R[8].wantsOut=true; R[8].mor=3.2; R[9].wantsOut=true; R[9].mor=3.4;
  pileBuild(d,{dev:null}); d.pile.opened=false; mgSave(d); renderHub(); pileShow(d,true); return 1; })()`);
await page.waitForTimeout(120);
r = await K(`(()=>{ const d=CAREER.data; return pileLeft(d).map(x=>x.k); })()`);
info('the pile: ' + r.join(', '));
ok(r[0] === 'mor' && r.indexOf('offer') < r.indexOf('bid') && r.indexOf('bid') < r.indexOf('sponsor') && r.indexOf('sponsor') < r.indexOf('contract') && r.indexOf('contract') < r.indexOf('out')
  && r.filter(k => k === 'offer').length === 2 && r.filter(k => k === 'out').length === 2, 'the dressing room, then the decisions: bids for your men, your bid, the sponsor, the new deal, the two who want out (' + r.join(' ') + ')');
// a bid for one of yours: accept one, reject the other
const n5 = await K('CAREER.data.roster[5].name'), n6 = await K('CAREER.data.roster[6].name');
await toPaper(new RegExp('bid \\$3,000 for ' + n5));
const offTxt = await top(); const b0 = await K('CAREER.data.budget');
await press('accept');
r = await K(`(()=>{ const d=CAREER.data; return { gone:!d.roster.some(p=>p.name===${JSON.stringify(n5)}), budget:d.budget }; })()`);
ok(/A BID FOR ONE OF YOURS/.test(offTxt) && /NEW/.test(offTxt) && /rated \d+/.test(offTxt) && r.gone && r.budget === b0 + 3000, 'a club\'s bid for one of yours: ACCEPT sells him (' + n5 + ' gone, $3,000 in)');
await toPaper(new RegExp('for ' + n6)); await press('reject');
r = await K(`(()=>{ const d=CAREER.data; return { offers:d.offers.length, still:d.roster.some(p=>p.name===${JSON.stringify(n6)}) }; })()`);
ok(r.offers === 0 && r.still, 'REJECT turns it down: he stays');
// your bid: they want more -- meet it, then sign him
await toPaper(/want \$[\d,]+ for/);
const bidTxt = await top();
// HAGGLING (v116): COUNTER on the paper -- a fee between yours and theirs; short of what they'd settle for, they come down
const hag0 = await K(`(()=>{ const B=mgBidOf(CAREER.data,window.__tp); B.lo=mgRound(B.fee+(B.ask-B.fee)*0.9); return { ask:B.ask, fee:B.fee }; })()`);   // (what they'd settle for, set high for the test)
await page.click('#pileModal [data-pile="cfee"][data-dir="1"]'); await page.waitForTimeout(60); await press('counter');
const hag1 = await K(`(()=>{ const B=mgBidOf(CAREER.data,window.__tp); return { ask:B.ask, fee:B.fee, st:B.st }; })()`), bidTxt2 = await top();
info('haggled on the paper: ' + JSON.stringify({ hag0, hag1, title: bidTxt2.split('\n')[0] }));
ok(/COUNTER/.test(bidTxt) && hag1.st === 'more' && hag1.fee > hag0.fee && hag1.ask < hag0.ask && hag1.ask > hag1.fee && bidTxt2.includes('$' + hag1.ask.toLocaleString()),
  'their figure on the paper, with COUNTER: a fee between, and they come down (' + hag0.ask + ' to ' + hag1.ask + ' for your ' + hag1.fee + ')');
await press('meet');
const yes = await top();   // (then two seasons to three)
await page.click('#pileModal [data-pile="yrs"][data-dir="1"]'); await page.waitForTimeout(60);
await press('sign');
r = await K(`(()=>{ const d=CAREER.data, p=d.roster.find(q=>q.id===window.__tp); return { signed:!!p, until:p&&p.until, season:d.season, bids:d.bids.length }; })()`);
info('your bid: ' + JSON.stringify({ bidTxt: bidTxt.split('\n').slice(0, 3), yes: yes.split('\n').slice(0, 3), r }));
ok(/YOUR BID/.test(bidTxt) && /accept your/.test(yes) && /SEASONS?/.test(yes) && r.signed && r.until === r.season + 2 && r.bids === 0,
  'your bid answered: MEET their price, they accept, and SIGN HIM on the seasons you set (three: to S' + r.until + ')');
// a sponsor: a local business for the board
await toPaper(/A SPONSOR CALLS/);
const spTxt = await top(); await press('spsign');
r = await K(`(()=>{ const d=CAREER.data, S=stadOf(d); return { ads:S.ads.map(a=>a.sp.name+' $'+a.wk), wk:computeFinance(d).boardsWk, drawn:groundOfYours(d).boards.map(b=>b.short), offers:d.spOff.length }; })()`);
info('the sponsor: ' + JSON.stringify({ spTxt: spTxt.split('\n'), r }));
ok(/A local business/.test(spTxt) && /an ad board/.test(spTxt) && /\$[\d,]+ a week, to the end of the season/.test(spTxt) && r.ads.length === 1 && r.wk > 0 && r.drawn[0] !== 'YOUR AD HERE' && r.offers === 0,
  'a sponsor calls -- a local business for the ad board ("' + spTxt.split('\n')[1] + '") -- SIGN, and its name\'s on the board, its fee every week (' + r.ads[0] + ')');
// a man who's come on: a new deal
const n7 = await K('CAREER.data.roster[6].name'), w7 = await K('mgRenewWage(CAREER.data,CAREER.data.roster[6])');
await toPaper(/wants a new deal/);
const cTxt = await top(); await press('renew');
r = await K(`(()=>{ const d=CAREER.data, p=d.roster.find(q=>q.name===${JSON.stringify(n7)}); return { ask:!!p.cAsk, wage:p.wage }; })()`);
ok(/A NEW DEAL/.test(cTxt) && !r.ask && r.wage === w7, 'a man who\'s come on: GIVE IT HIM, and he\'s on what he asked (' + money0(r.wage) + ' a week)');
// two who want out: talk one round, list the other
const outA = await K(`(()=>{ const d=CAREER.data; return d.roster.filter(p=>p.wantsOut).map(p=>({n:p.name, m:p.mor})); })()`);
await toPaper(/wants to leave/);
const oTxt = await top(); await press('round');
const said = await top(); await press('next');
await toPaper(/wants to leave/); await press('list');
r = await K(`(()=>{ const d=CAREER.data; return d.roster.filter(p=>${JSON.stringify(outA.map(x => x.n))}.includes(p.name)).map(p=>({n:p.name, m:p.mor, out:!!p.wantsOut, listed:!!d.listed[p.id]})); })()`);
info('they want out: ' + JSON.stringify({ before: outA, oTxt: oTxt.split('\n').slice(0, 3), said: said.split('\n').slice(1, 3), after: r }));
ok(/HE WANTS TO LEAVE/.test(oTxt) && r.some(x => x.m > outA.find(y => y.n === x.n).m + 1 && !x.listed) && r.some(x => x.listed), 'one who wants out: TALK HIM ROUND lifts him (he says how he is); the other, LIST HIM, and he\'s on the transfer list');
r = await K(`(()=>{ const d=CAREER.data; return { left:pileLeft(d).map(x=>x.k), modal:document.getElementById('pileModal').classList.contains('on') }; })()`);
while((await K('pileLeft(CAREER.data).length')) > 0 && await modal()) await page.click('#pileModal .plBtns button:first-child').catch(() => {});
ok(!(await modal()) && (await K('pileLeft(CAREER.data).length')) === 0 && await K(`getComputedStyle(document.querySelector('#careerHub .cpPapers')).display==='none'`), 'the last one done: the pile\'s gone, and so is PAPERS on the campus');

// --- LATER, and a decision left for next week -----------------------------------------------------------------------------------
await K(`(()=>{ const d=CAREER.data, cl=d.div[1].filter(id=>id!==d.clubId); d.offers=[{id:++d.offerSeq,pid:d.roster[3].id,club:cl[0],fee:2000,wk:d.wkN}]; d.spOff=[]; pileBuild(d,{dev:null}); d.pile.opened=false; mgSave(d); renderHub(); pileShow(d,true); return 1; })()`);
await page.waitForTimeout(100);
await toPaper(/bid \$2,000/); await press('later');
r = await K(`(()=>{ const d=CAREER.data, L=pileLeft(d); return L.map(x=>x.k); })()`);
ok(r[r.length - 1] === 'offer' && r[0] !== 'offer', 'LATER: to the bottom of the pile (' + r.join(' ') + ')');
await press('close');
r = await K(`(()=>{ const d=CAREER.data; d.wday='sat'; renderHub(); const sat={left:pileLeft(d).length, modal:document.getElementById('pileModal').classList.contains('on')};
  d.wday='mon'; d.weeks++; d.wkN++; pileBuild(d,{dev:null}); d.pile.opened=false; renderHub(); pileShow(d,true); const x=pileLeft(d).find(y=>y.k==='offer'); return { sat, again:!!x, fresh:x&&x.fresh }; })()`);
await page.waitForTimeout(100);
await toPaper(/bid \$2,000/); const still = await top();
ok(r.sat.left === 0 && !r.sat.modal && r.again && !r.fresh && /STILL WAITING/.test(still), 'not on a matchday; a bid you left is in next Monday\'s pile while it stands, STILL WAITING');
await press('reject');

// --- the reports: the physio, the coaches, the next game, the week's money --------------------------------------------------------
await K(`(()=>{ const d=CAREER.data; INJ_OFF=false; d.phase='league'; const p=d.roster[2]; injHurt(d,p,'strain',null,'in training'); const q=d.roster[4]; q.inj={k:'knock',d:2}; injHeal(d,3);
  const dev={up:[[d.roster[0].id,2],[d.roster[1].id,1]], down:[[d.roster[3].id,-1]]}; d.ledger.unshift({week:(d.week||0)+1,season:d.season,income:4000,gate:3000,tv:0,wages:1100,net:2900,budget:Math.round(d.budget)});
  pileBuild(d,{dev}); d.pile.opened=false; mgSave(d); renderHub(); pileShow(d,true); INJ_OFF=true; return 1; })()`);
await page.waitForTimeout(100);
// one pass through the pile, each report taken as it comes up (when the next game is against the rival it's DERBY WEEK, which
// sits higher in the pile, so the pile isn't searched report by report)
const reports = {}, want = [['phys', /THE PHYSIO/], ['dev', /THE COACHES/], ['next', /NEXT UP|DERBY WEEK/], ['money', /THE WEEK’S MONEY/]];
for(let i = 0; i < 20 && Object.keys(reports).length < want.length; i++){ const t = await top();
  for(const [k, re] of want) if(!reports[k] && re.test(t)) reports[k] = t.split('\n').slice(1).join(' / ');
  const b = await page.$('#pileModal .plBtns [data-pile="next"]') || await page.$('#pileModal .plBtns [data-pile="later"]'); if(!b) break; await b.click();
  for(let w = 0; w < 30 && (await top()) === t; w++) await page.waitForTimeout(50); }
info('the reports: ' + JSON.stringify(reports));
const n2 = await K('CAREER.data.roster[2].name'), n4 = await K('CAREER.data.roster[4].name');
ok(reports.phys && reports.phys.includes(n2 + ': a strain, in training') && reports.phys.includes(n4 + ' is fit again'), 'the physio: who\'s hurt, how and for how long, who\'s fit again');
ok(reports.dev && /Coming on: .+ \+2 → \d+/.test(reports.dev) && /Going back: .+ -1 → \d+/.test(reports.dev), 'the coaches, every third week: who\'s coming on and who\'s going back');
ok(reports.next && /^(Derby week: )?(At home to|Away at|at home to|away at) /.test(reports.next) && /Matchday 1/.test(reports.next), 'the next game: who, where (' + (reports.next || '').split(' / ')[0] + ')');
ok(reports.money && /In \$4,000 · wages out \$1,100 · \+\$2,900/.test(reports.money), 'the week\'s money: in, out, and in the bank');

// --- sponsors over the weeks: the businesses round the corner call about the board ------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, S=stadOf(d); S.ads=[]; d.spOff=[]; S.wait={}; const seen=[]; let first=-1;
  for(let w=1;w<=10;w++){ d.weeks++; const made=spOffers(d); for(const o of made){ seen.push(o.sp.name+' ('+o.k+', '+SP_SIZES[o.sz].n+', $'+o.wk+')'); if(first<0) first=w; } }
  return { seen, first, kit:seen.some(t=>/\\(kit/.test(t)) }; })()`);
info('ten weeks of calls: ' + JSON.stringify(r));
ok(r.seen.length >= 1 && r.first <= 8 && r.seen.every(t => /, local, \$\d+\)/.test(t)) && !r.kit, 'over the first weeks, local businesses call about the board (' + r.seen.slice(0, 3).join('; ') + '): the first by week ' + r.first + ', none for the shirt yet');

// --- on a phone held sideways: the paper and its buttons fit ------------------------------------------------------------------------
await page.setViewportSize({ width: 844, height: 390 });
await K(`(()=>{ const d=CAREER.data, cl=d.div[1].filter(id=>id!==d.clubId); d.spOff=[spOfferFor(d,'board',new Set())]; d.offers=[{id:++d.offerSeq,pid:d.roster[3].id,club:cl[0],fee:2000,wk:d.wkN}]; pileBuild(d,{dev:null}); d.pile.opened=false; renderHub(); pileShow(d,true); return 1; })()`);
await page.waitForTimeout(150);
const fits = [];
for(let i = 0; i < 6 && await modal(); i++){
  fits.push(await page.evaluate(() => { const c = document.querySelector('#pileModal .pileCard').getBoundingClientRect(), bs = [...document.querySelectorAll('#pileModal .plBtns button')].map(b => b.getBoundingClientRect());
    return c.top >= 0 && c.bottom <= innerHeight && bs.every(b => b.bottom <= innerHeight && b.right <= innerWidth); }));
  const b = await page.$('#pileModal .plBtns [data-pile="next"]') || await page.$('#pileModal .plBtns [data-pile="later"]'); if(!b) break; await b.click(); await page.waitForTimeout(60); }
ok(fits.length >= 2 && fits.every(Boolean), 'on a phone held sideways (844x390), each paper and its buttons on the screen (' + fits.length + ' papers)');

function money0(v){ return '$' + Math.round(v).toLocaleString('en-US'); }
process.exitCode = rep.finish() ? 1 : 0;
await browser.close();
