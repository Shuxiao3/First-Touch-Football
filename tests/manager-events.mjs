// FOOTBALL CLASSIC, THE WEEK'S EVENTS (v104): the press conference after each of your games (its own screen, before the
// Monday papers: the result's question -- the derby's its own -- then one of your men's or the run's; each answer moves
// the dressing room, a man or the fans; SEND THE ASSISTANT says nothing); the derby (a rival in your league, the week's
// build-up in the papers, the result felt more, a home derby's fuller gate); windfalls; the community's asks; the cups'
// draws in the papers; loans both ways (a share of the wage, not yours to sell or renew, nobody else's to buy, home at
// the season's end); the Player of the Month (yours: a prize, fans, his mood) and the Player of the Year (more). On a copy
// of the game that lets the test reach it.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  let INJ_OFF=false;', '  let INJ_OFF=true;');
patch('  // ===== END MANAGER CAREER', '  window.__K={ ev:s=>eval(s) };\n  // ===== END MANAGER CAREER');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-events-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy, papers: true });
const { ok, info } = rep;
const K = s => page.evaluate(s => window.__K.ev(s), s);
const on = id => page.evaluate(id => document.getElementById(id).classList.contains('on'), id);
let r;
await page.emulateMedia({ reducedMotion: 'reduce' });
await page.click('#smItems [data-act="new"]'); await page.waitForTimeout(150);
await page.click('#newSlotList .slotBtn >> nth=0'); await page.waitForTimeout(100);
await page.waitForSelector('#mgrMaker.on', { timeout: 4000 });
await page.fill('#mgName', 'Sam Okafor'); await page.fill('#mgClubIn', 'Event Town');
await page.click('#mgGo'); await page.waitForSelector('#careerHub.show', { timeout: 6000 });
await K(`(()=>{ const d=CAREER.data; d.story={vet:2,kid:2,phone:2}; mgMarketOpen(d); mgStoryShow(d); mgSave(d); renderHub(); return 1; })()`);

// --- THE DERBY: a rival in your league ------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data; return { rival:d.rival, inLeague:d.div[d.tier].includes(d.rival)&&d.rival!==d.clubId, name:mgNameOf(d,d.rival) }; })()`);
ok(r.rival != null && r.inLeague, 'a new career has a rival in its league, the club down the road (' + r.name + ')');
r = await K(`(()=>{ const d=CAREER.data, mine={win:true, oppOvr:mgStrength(d,d.clubId)}, run=dby=>{ d.tm=6.5; morAfterGame(d,Object.assign({derby:dby},mine)); return d.tm-6.5; };
  const a=run(false), b=run(true); d.tm=6.5; const g0=applyWeek(d,{home:true}).gate, g1=applyWeek(d,{home:true,derby:true}).gate, ga=applyWeek(d,{home:false,derby:true}).gate, gaw=applyWeek(d,{home:false}).gate;
  const fd=computeFinance(d,{home:true,derby:true}), fl=computeFinance(d,{home:true}), all=Math.min(fd.capacity,Math.round(fd.loyalty));   // (v120: a derby brings every fan -- THE TURNOUT)
  return { a:+a.toFixed(3), b:+b.toFixed(3), g0, g1, ga, gaw, turn:fd.turn, lturn:+fl.turn.toFixed(2), att:fd.attendance, latt:fl.attendance, all, fans:Math.round(fd.loyalty) }; })()`);
ok(Math.abs(r.b - r.a * 1.6) < 0.02 && r.turn === 1 && r.lturn < 1 && Math.abs(r.att - r.all) <= 2 && r.latt < r.att && r.g1 > r.g0 && r.ga === r.gaw,
  'a derby win lifts the dressing room more (' + r.b + ' against ' + r.a + '), and a home derby brings every fan: ' + r.att + ' of ' + r.fans + ' (a league game ' + r.latt + ', ' + Math.round(r.lturn * 100) + '% of them), the gate ' + r.g0 + ' -> ' + r.g1 + ' (away, as ever)');

// --- THE PRESS CONFERENCE: after the derby, before the papers ---------------------------------------------------------------------
await K(`(()=>{ const d=CAREER.data; for(let i=0;i<3;i++) mgForward(d); d.rival=mgNextGame(d).opp; d.derbyRec={w:0,d:0,l:0}; pileBuild(d,{dev:null}); d.pile.opened=true; mgSave(d); renderHub(); return 1; })()`);
r = await K(`(()=>{ const d=CAREER.data; return pileLeft(d).map(x=>x.k); })()`);
const dbyPaper = await K(`(()=>{ const d=CAREER.data, x=pileLeft(d).find(y=>y.k==='derby'); return x?pileBody(d,x)[0]+' / '+pileBody(d,x)[1].join(' / '):''; })()`);
ok(r.includes('derby') && !r.includes('next') && /^Derby week: (at home to|away at) /.test(dbyPaper) && /talking about nothing else/.test(dbyPaper), 'the derby\'s week: the papers build it up ("' + dbyPaper.slice(0, 80) + '...")');
const before = await K(`(()=>{ const d=CAREER.data; return { tm:d.tm, fans:d.loyalty }; })()`);
await K(`(()=>{ const d=CAREER.data; d.pile=null; mgSim(d); return 1; })()`); await page.waitForTimeout(150);
const pq = await page.innerText('#pressModal .prCard').catch(() => '');
r = await K(`(()=>{ const d=CAREER.data; return { derby:!!(d.press&&d.press.derby), n:d.press&&d.press.qs.length, first:d.press&&d.press.qs[0].q, pile:document.getElementById('pileModal').classList.contains('on'), rec:d.derbyRec,
  fx:d.press&&d.press.qs[0].a[0].fx, tm:d.tm, fans:d.loyalty }; })()`);
info('the press after the derby: ' + JSON.stringify({ r, pq: pq.split('\n').slice(0, 3) }));
ok(await on('pressModal') && !r.pile && r.derby && /THE PRESS CONFERENCE/.test(pq) && /THE DERBY/.test(pq) && /(beaten|Honours even|Beaten by)/.test(r.first) && r.rec.w + r.rec.d + r.rec.l === 1,
  'after the game, the press conference -- the papers wait -- and the derby\'s question first ("' + r.first + '"); the derby\'s result kept');
const tm0 = r.tm, fans0 = r.fans, fx = r.fx;
await page.click('#pressModal [data-pr="ans"] >> nth=0'); await page.waitForTimeout(100);
const said = await page.innerText('#pressModal .prSaid').catch(() => '');
r = await K(`(()=>{ const d=CAREER.data; return { tm:d.tm, fans:d.loyalty, i:d.press.i }; })()`);
const base = await K('LOYALTY_BASE[CAREER.data.tier]');
ok(Math.abs((r.tm - tm0) - (fx.tm || 0)) < 0.011 && Math.abs((r.fans - fans0) - Math.round(base * (fx.fans || 0) / 100)) < 0.01 && /^You said “/.test(said),
  'an answer moves what it says it does (' + JSON.stringify(fx) + ': morale ' + tm0 + ' -> ' + r.tm + ', fans ' + fans0 + ' -> ' + r.fans + '), and the paper says how it went down ("' + said.slice(0, 70) + '...")');
for(let i = 0; i < 6 && await on('pressModal'); i++){ const b = await page.$('#pressModal [data-pr="next"]') || await page.$('#pressModal [data-pr="ans"]'); await b.click(); await page.waitForTimeout(80); }
r = await K(`(()=>{ const d=CAREER.data, b=document.querySelector('#careerHub .cpPapers'); return { press:d.press, pile:document.getElementById('pileModal').classList.contains('on'), side:!!b&&getComputedStyle(b).display!=='none', left:pileLeft(d).length }; })()`);
ok(!(await on('pressModal')) && r.press === null && !r.pile && r.side && r.left > 0, 'that\'s all: the press conference over, and the Monday papers wait off to the side (PAPERS, ' + r.left + ')');
await K(`(()=>{ pileHide(); const d=CAREER.data; d.pile=null; d.rival=d.div[d.tier].find(id=>id!==d.clubId&&id!==mgNextGame(d).opp); return 1; })()`);
const s0 = await K(`(()=>{ const d=CAREER.data; mgSim(d); return { tm:d.tm, fans:d.loyalty, q:d.press&&d.press.qs.length }; })()`); await page.waitForTimeout(100);
await page.click('#pressModal [data-pr="skip"]'); await page.waitForTimeout(80);
r = await K(`(()=>{ const d=CAREER.data; return { tm:d.tm, fans:d.loyalty, press:d.press }; })()`);
ok(s0.q >= 1 && r.tm === s0.tm && r.fans === s0.fans && r.press === null && !(await on('pressModal')), 'SEND THE ASSISTANT: nothing said, nothing moves');

// --- A WINDFALL, THE COMMUNITY --------------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, R=Math.random; Math.random=()=>0.05; const b0=d.budget, w=wkWindfall(d); Math.random=R; return { w, b0, b1:d.budget, range:WINDFALL_AMT[d.tier] }; })()`);
ok(r.w && r.b1 - r.b0 === r.w.amt && r.w.amt >= r.range[0] && r.w.amt <= r.range[1] && r.w.txt.includes('$'), 'a windfall: ' + (r.w && r.w.title) + ' -- "' + (r.w && r.w.txt) + '", in the bank at once');
await K(`(()=>{ const d=CAREER.data; d.budget=50000; pileBuild(d,{dev:null, comm:{ck:'kits', cost:600}}); d.pile.opened=false; mgSave(d); renderHub(); pileShow(d,true); return 1; })()`); await page.waitForTimeout(120);
for(let i = 0; i < 12 && !/THE COMMUNITY/.test(await page.innerText('#pileModal .plStamp').catch(() => '')); i++){ const b = await page.$('#pileModal .plBtns [data-pile="next"]') || await page.$('#pileModal .plBtns [data-pile="later"]'); if(!b) break; await b.click(); await page.waitForTimeout(60); }
const commTxt = await page.innerText('#pileModal .plPaper').catch(() => '');
const c0 = await K(`(()=>{ const d=CAREER.data; return { b:d.budget, f:d.loyalty, n:commFans(d,COMMUNITY.find(c=>c.k==='kits')) }; })()`);
await page.click('#pileModal [data-pile="commyes"]'); await page.waitForTimeout(80);
r = await K(`(()=>{ const d=CAREER.data; return { b:d.budget, f:d.loyalty }; })()`);
ok(/youth club/.test(commTxt) && /\+\d+ fans/.test(commTxt) && /costs \$600/.test(commTxt) && r.b === c0.b - 600 && r.f === c0.f + c0.n,
  'the community asks (a youth club\'s kits): YES costs what it said ($600) and the fans think more of the club (+' + c0.n + ')');
await K('pileHide()');

// --- THE CUPS' DRAWS, in the papers ---------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, other=d.div[2][0]; d.div[2][0]=d.clubId; d.div[1][d.div[1].indexOf(d.clubId)]=other; d.world.clubs[other].tier=1; d.world.clubs[d.clubId].tier=2; d.tier=2;
  mgNewFixtures(d); d.wkLog={}; mgCupsStart(d); d.md=0; d.phase='league'; pileBuild(d,{dev:null}); const x=pileLeft(d).find(y=>y.k==='cup'); return x?[pileBody(d,x)[0], pileBody(d,x)[1].join(' / ')]:null; })()`);
ok(r && (/^Coco Cup, first round: (at home to|away at) /.test(r[0]) && /Wednesday of week 5/.test(r[1]) && /\$50,000/.test(r[1]) || /^Coco Cup: a bye to the round of 32/.test(r[0])),
  'a League 1 season: the Coco Cup\'s first-round draw in the papers ("' + (r && r[0]) + '", ' + (r && r[1]) + ')');
r = await K(`(()=>{ const d=CAREER.data; d.wkLog={}; let n=0; while(n++<40){ if(d.wday==='mon'){ mgForward(d); continue; } const g=mgNextGame(d); if(!g) break; mgPlayGame(d,null,null); d.press=null; if(g.kind==='cup'){ const s=mgNextGame(d); if(s){ mgPlayGame(d,null,null); d.press=null; } break; } }   // (the cup's Wednesday, then Saturday: the papers on Monday)
  const L=(d.pile&&d.pile.list||[]).filter(x=>x.k==='cup').map(x=>pileBody(d,x)[0]); return { L, md:d.md }; })()`);
ok(r.L.length >= 1 && r.L.every(t => /^Coco Cup, (round of \d+|quarter-final|semi-final|final): (at home to|away at) |^Out of the Coco Cup in the /.test(t)), 'after the first round, the next draw or the exit in the papers (' + r.L.join('; ') + ')');

// --- LOANS ----------------------------------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data; d.phase='summer'; d.day=1; d.wday='mon'; d.budget=200000;
  const ok=x=>x.role!=='GK'&&(x.until||0)>d.season&&x.age<33;   // (a man with a deal past this season, and years in him: he's still about when the loans end)
  // (a club in the league with a man to spare: a new world's have fourteen each, and only the market's moves make one more -- none yet, and one's given a man)
  const c=mgAiClubs(d).find(c=>c.tier===d.tier&&c.players.length>MG_MIN+2&&c.players.some(x=>ok(x)&&!mgEight(c.players).includes(x)))||mgAiClubs(d).find(c=>c.tier===d.tier&&c.players.length>MG_MIN+2)
    ||(()=>{ const x=mgAiClubs(d).find(c=>c.tier===d.tier); x.players.push(mgNewPlayer(d,'MID',40,30)); return x; })(), e8=mgEight(c.players);
  let p=c.players.find(x=>!e8.includes(x)&&ok(x)); if(!p){ p=c.players.find(x=>!e8.includes(x)&&x.role!=='GK'); p.until=d.season+2; p.age=Math.min(p.age,30); }
  const w0=p.wage, wk0=computeFinance(d).wageWk, sh=mgLoanShare(d,p,c), err=mgLoanIn(d,p.id), i=d.roster.indexOf(p);
  window.__lin={id:p.id, cid:c.id, w0};
  return { err, mine:i>=0, theirs:c.players.includes(p), loan:p.loan, wage:p.wage, want:mgRound(w0*sh), wk:computeFinance(d).wageWk-wk0, sell:mgCanLose(d,i), renew:mgRenew(d,i,2), sh }; })()`);
ok(r.err === null && r.mine && !r.theirs && r.wage === r.want && r.wk === r.want && /on loan/.test(r.sell) && /on loan/.test(r.renew),
  'a loan in: he joins to the season\'s end, on ' + Math.round(r.sh * 100) + '% of his wage (' + r.wage + ' a week on your bill); not yours to sell or renew ("' + r.sell + '")');
r = await K(`(()=>{ const d=CAREER.data, id=window.__lin.id; mgAiBids(d,50); const bid=d.offers.some(o=>o.pid===id);
  const regular=mgAiClubs(d).find(c=>c.tier===d.tier&&c.id!==window.__lin.cid); const reg=mgEight(regular.players)[0];
  return { bid, reg:mgLoanWhy(d,reg,regular), shut:(()=>{ const ph=d.phase; d.phase='league'; d.md=MG_HALF+2; const w=mgLoanWhy(d,regular.players.find(x=>!mgEight(regular.players).includes(x)),regular); d.phase=ph; d.md=0; return w; })() }; })()`);
ok(!r.bid && /regulars/.test(r.reg) && /shut/.test(r.shut), 'nobody bids for a man on loan; a club won\'t lend a regular ("' + r.reg + '"), and nobody lends outside the window');
r = await K(`(()=>{ const d=CAREER.data, xi=new Set(mgStarters(d)), p=d.roster.find(x=>!xi.has(x)&&!x.loan&&x.role!=='GK'&&(x.until||0)>d.season&&x.age<33)||(()=>{ const q=d.roster.find(x=>!xi.has(x)&&!x.loan&&x.role!=='GK'); q.until=d.season+2; q.age=Math.min(q.age,30); return q; })(), c=mgAiClubs(d).find(c=>c.tier===d.tier&&c.players.length<MG_MAX&&c.id!==window.__lin.cid);
  const wk0=computeFinance(d).wageWk, err=mgLoanOut(d,p.id,c.id); window.__lout={id:p.id, cid:c.id};
  for(let i=0;i<30;i++) mgAiTrades(d,3); const still=c.players.includes(p); while(c.players.length<=MG_MAX) c.players.push(mgNewPlayer(d,'MID',40,30)); mgTrimAi(d,c);
  const bid=mgBid(d,p.id,1000);
  return { err, gone:!d.roster.includes(p), there:c.players.includes(p), from:p.loan&&p.loan.from===d.clubId, saved:wk0-computeFinance(d).wageWk, wage:p.wage, still, kept:c.players.includes(p), bid:bid.msg }; })()`);
ok(r.err === null && r.gone && r.there && r.from && r.saved === r.wage && r.still && r.kept && /yours/.test(r.bid),
  'a loan out: he goes to them to the season\'s end, his wages theirs (' + r.saved + ' a week off yours); they never sell or let him go, and you can\'t bid for your own man ("' + r.bid + '")');
await K(`(()=>{ const d=CAREER.data; curTab.market='Selling'; openBuilding('market'); return 1; })()`); await page.waitForTimeout(150);
const sellTxt = await page.textContent('#bpBody');
const linName = await K('mgFind(CAREER.data,window.__lin.id).p.name');
ok(/On loan: .+ at /.test(sellTxt) && !sellTxt.includes(linName), 'the Selling list: yours on loan elsewhere said ("' + (sellTxt.match(/On loan: [^.]+/) || [''])[0] + '"), the man you have on loan not for sale');
await K(`(()=>{ hideBldg(); return 1; })()`);
r = await K(`(()=>{ const d=CAREER.data; d.phase='league'; d.md=26; d.wkLog={}; mgSeasonEnd(d); const R=d.review, lin=mgFind(d,window.__lin.id), lout=mgFind(d,window.__lout.id);
  return { loans:R.loans, linHome:lin&&lin.club&&lin.club.id===window.__lin.cid, linWage:lin&&lin.p.wage===window.__lin.w0, linLoan:lin&&!!lin.p.loan, loutMine:lout&&lout.mine, loutLoan:lout&&!!lout.p.loan, back:(d.wkLog.loanback||[]).length }; })()`);
ok(r.linHome && r.linWage && !r.linLoan && r.loutMine && !r.loutLoan && r.loans.length === 2 && r.back === 1,
  'the season\'s end: everyone on loan goes home -- theirs on his full wage, yours back in the squad -- in the review, and yours in the next papers');
await K(`(()=>{ const d=CAREER.data; mgNewSeason(d); return 1; })()`);
r = await K(`(()=>{ const d=CAREER.data; return { back:pileLeft(d).filter(x=>x.k==='loanback').map(x=>pileBody(d,x)[0]), rival:d.div[d.tier].includes(d.rival) }; })()`);
ok(r.back.length === 1 && /is back from his loan at /.test(r.back[0]) && r.rival, 'the new season\'s first papers: "' + r.back[0] + '"; and a rival in the league you\'re in now');
// the market: LOAN HIM on another club's man; the papers' loan calls
r = await K(`(()=>{ const d=CAREER.data, R=Math.random; Math.random=()=>0.01; const L=wkLoans(d); Math.random=R; d.wday='mon'; pileBuild(d,{dev:null, loans:L}); d.pile.opened=false; renderHub(); pileShow(d,true);
  return L.map(x=>x.k).join(' '); })()`);
await page.waitForTimeout(120);
let loanTxt = '';
for(let i = 0; i < 14 && await on('pileModal'); i++){ const t = await page.innerText('#pileModal .plPaper'); if(/will lend you/.test(t)){ loanTxt = t; break; } const b = await page.$('#pileModal .plBtns [data-pile="next"]') || await page.$('#pileModal .plBtns [data-pile="later"]'); if(!b) break; await b.click(); await page.waitForTimeout(60); }
const n0 = await K('CAREER.data.roster.length');
if(loanTxt) await page.click('#pileModal [data-pile="loanin"]'); await page.waitForTimeout(80);
const n1 = await K('CAREER.data.roster.length');
ok(/loanin/.test(r) && /you pay \d+% of his wage/.test(loanTxt) && n1 === n0 + 1, 'the papers: a club will lend you a man ("' + loanTxt.split('\n')[1] + '"), and TAKE HIM brings him in');
await K('pileHide()');
r = await K(`(()=>{ const d=CAREER.data, c=mgAiClubs(d).find(c=>c.tier===d.tier&&c.players.length>MG_MIN+2), e8=mgEight(c.players), p=c.players.find(x=>!e8.includes(x)&&x.role!=='GK'&&!mgLoanWhy(d,x,c));
  mgSide='deal'; curTab.market='Search'; openBuilding('market'); MGUI.sel=p.id; MGUI.tier=c.tier; paintBuilding(); window.__ask=p.id; return p.name; })()`);   // (the card's deal side: OFFER, LOAN HIM)
await page.waitForTimeout(150);
const askBtn = await page.$('#bpBody [data-mg="loanask"]');
if(askBtn){ await askBtn.click(); await page.waitForTimeout(100); }
r = await K(`(()=>{ const d=CAREER.data, p=d.roster.find(x=>x.id===window.__ask); return { joined:!!p, loan:!!(p&&p.loan) }; })()`);
ok(!!askBtn && r.joined && r.loan, 'the market: LOAN HIM on another club\'s man out of their eight, and he joins');
await K(`(()=>{ hideBldg(); return 1; })()`);

// --- THE PLAYER OF THE MONTH, THE PLAYER OF THE YEAR -------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data; d.potm={s:d.season, snap:{}}; for(const id of d.div[d.tier]) for(const p of mgPlayersOf(d,id)){ p.rn=0; p.rs=0; p.goals=0; }
  const me=d.roster.find(p=>!p.loan), q=mgPlayersOf(d,d.div[d.tier].find(id=>id!==d.clubId))[0]; me.rn=4; me.rs=32.8; me.goals=3; q.rn=4; q.rs=30; me.mor=6; d.wkLog={};
  const b0=d.budget, f0=d.loyalty; mgPotm(d); const x=d.wkLog.potm; return { you:x.you, name:x.name===me.name, prize:d.budget-b0, fans:d.loyalty-f0, want:[POTM_PRIZE[d.tier], Math.round(LOYALTY_BASE[d.tier]*0.03)], mor:me.mor, avg:x.avg }; })()`);
ok(r.you && r.name && r.prize === r.want[0] && r.fans === r.want[1] && r.mor === 7 && r.avg === 8.2,
  'the Player of the Month, yours (8.2 over four games): the league pays the club ' + r.prize + ', the fans love it (+' + r.fans + '), and he\'s lifted');
r = await K(`(()=>{ const d=CAREER.data; for(const id of d.div[d.tier]) for(const p of mgPlayersOf(d,id)){ p.rn=4; p.rs=24; p.goals=0; } d.potm={s:d.season, snap:{}};
  const q=mgPlayersOf(d,d.div[d.tier].find(id=>id!==d.clubId))[1]; q.rs=31; d.wkLog={}; const b0=d.budget; mgPotm(d); const x=d.wkLog.potm; pileBuild(d,{dev:null}); const p=pileLeft(d).find(y=>y.k==='potm');
  return { you:x.you, paid:d.budget-b0, best:x.best, title:p&&pileBody(d,p)[0] }; })()`);
ok(!r.you && r.paid === 0 && r.best && /^Player of the Month: /.test(r.title), 'another club\'s: the papers say who ("' + r.title + '") and your best (' + r.best.name + ', ' + r.best.avg + '), and nothing\'s paid');
await K('pileHide()');
r = await K(`(()=>{ const d=CAREER.data; for(const id of d.div[d.tier]) for(const p of mgPlayersOf(d,id)){ p.rn=12; p.rs=72; } const me=d.roster.find(p=>!p.loan); me.rn=20; me.rs=170; me.mor=6;
  d.wkLog={}; d.phase='league'; d.md=26; const b0=d.budget, f0=d.loyalty; mgSeasonEnd(d); const R=d.review;
  return { aw:R.awards[0], poty:R.poty, paid:d.budget-b0-R.prize, fans:d.loyalty-f0, want:[POTM_PRIZE[d.tier]*4, Math.round(LOYALTY_BASE[d.tier]*0.08)], mor:me.mor, log:!!(d.wkLog.poty&&d.wkLog.poty.you) }; })()`);
ok(r.aw.t === 'Player of the Year' && r.aw.you && r.poty && r.poty.prize === r.want[0] && r.poty.fans === r.want[1] && r.mor === 7.5 && r.log,
  'the Player of the Year, yours (8.5): four times the month\'s prize (' + (r.poty && r.poty.prize) + '), 8% more fans (+' + (r.poty && r.poty.fans) + '), and his mood; the papers will say so');
const rv = await K(`(()=>{ openBuilding('review'); return 1; })()`).then(() => page.waitForTimeout(150)).then(() => page.textContent('#bpBody'));
ok(/Player of the Year/.test(rv) && /Player of the Year’s prize\s*\$[\d,]+ · \+\d+ fans/.test(rv), 'the review: the award and its prize');

process.exitCode = rep.finish() ? 1 : 0;
await browser.close();
