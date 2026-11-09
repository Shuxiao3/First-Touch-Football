// FOOTBALL CLASSIC, THE REAL GAME'S MONEY (v149): a man's worth as the real market has it -- $150,000 for a midfielder
// of 55 in his prime, each point 22% more, by position (a striker or a winger a tenth more ... a keeper 38%) and never
// over the most the real game has paid for one ($200M a striker ... $70M a keeper), the veteran's slide steeper; an
// asking price never more than a quarter over that; a wage $2,000 a week at 55, each point 16% more; a coach's twenty
// times what it was. The money round it rescaled: the TV, the partners, the gate, the prizes, the cups, the computer
// clubs' budgets, what the buildings, the scouts and the decorations cost, a new club's $250,000 -- so a mid-table
// club's season nets what the change list reckons (within a quarter) in every league, and a new club's first season
// about $1.8M. A league game's TV money is the week's broadcast, no more; a cup tie brings more. The hometown hero
// is never sold. And a career kept from before is put into the new money once. On a copy the test can reach.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  let INJ_OFF=false;', '  let INJ_OFF=true;');
patch('  // ===== END MANAGER CAREER', '  window.__K={ ev:s=>eval(s) };\n  // ===== END MANAGER CAREER');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-econ-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
const K = s => page.evaluate(s => window.__K.ev(s), s);
await page.click('#smItems [data-act="new"]'); await page.waitForTimeout(150);
await page.click('#newSlotList .slotBtn >> nth=0'); await page.waitForTimeout(100);
await page.waitForSelector('#mgrMaker.on', { timeout: 4000 });
await page.fill('#mgName', 'Sam Okafor'); await page.fill('#mgClubIn', 'Ledger Town');
await page.click('#mgGo'); await page.waitForSelector('#careerHub.show', { timeout: 8000 });
await K(`(()=>{ const d=CAREER.data; d.story={vet:2,kid:2,phone:2}; mgStoryShow(d); return 1; })()`);

// --- WHAT A MAN'S WORTH, AND WHAT HE EARNS -------------------------------------------------------------------------------
let r = await K(`(()=>{ const d=CAREER.data, role={STK:'ATT',WNG:'ATT',WM:'MID',AM:'MID',CM:'MID',DM:'MID',CB:'DEF',FB:'DEF',GK:'GK'};
  const man=(pos,ovr,age,pot)=>({role:role[pos],subRole:pos,ovr,pot:pot??ovr,age:age??26,until:d.season+3,style:null}), v=(pos,ovr,age,pot)=>mgValue(d,man(pos,ovr,age,pot));
  const caps=Object.fromEntries(['STK','WNG','WM','AM','CM','DM','CB','FB','GK'].map(k=>[k,v(k,95)]));
  const club=mgAiClubs(d).find(c=>c.tier===4), star=man('GK',95); star.id=-1; const ask=mgAsk(d,star,club);
  return { stk79:v('STK',79), cm65:v('CM',65), cm55:v('CM',55), stk90:v('STK',90), caps, age:[v('CM',75,28),v('CM',75,32),v('CM',75,34)], ask, gkCap:valCap(star),
    wage:[51,55,65,75,79,85,90,94].map(mgWage), staff:[1,5,9].map(staffWage), start:d.budget, bill:d.roster.reduce((a,p)=>a+p.wage,0), n:d.roster.length, avg:+(d.roster.reduce((a,p)=>a+p.ovr,0)/d.roster.length).toFixed(1) }; })()`);
info('values and wages: ' + JSON.stringify(r));
const M = x => +(x / 1e6).toFixed(1);
ok(Math.abs(r.stk79 - 19e6) <= 1e6 && Math.abs(r.cm65 - 1.1e6) <= 0.1e6 && r.cm55 === 150000 && Math.abs(r.stk90 - 169e6) <= 2e6,
  'in his prime, a striker of 79 is worth $' + M(r.stk79) + 'M, a midfielder of 65 $' + M(r.cm65) + 'M (of 55 $' + r.cm55.toLocaleString() + '), a striker of 90 $' + M(r.stk90) + 'M');
ok(r.caps.STK === 200e6 && r.caps.WNG === 200e6 && r.caps.WM === 200e6 && r.caps.AM === 190e6 && r.caps.CM === 180e6 && r.caps.DM === 120e6 && r.caps.CB === 100e6 && r.caps.FB === 80e6 && r.caps.GK === 70e6,
  'and never more than the most the real game has paid: at 95, $' + Object.entries(r.caps).map(([k, x]) => k + ' ' + M(x) + 'M').join(', '));
ok(Math.abs(r.age[1] / r.age[0] - 0.3) < 0.02 && Math.abs(r.age[2] / r.age[0] - 0.15) < 0.02 && r.ask <= r.gkCap * 1.25,
  'the veteran\'s slide: at 32 three-tenths of his prime\'s worth, at 34 15%; an asking price never more than a quarter over his position\'s most (a keeper of 95: $' + M(r.ask) + 'M asked)');
ok(Math.abs(r.wage[0] - 1100) <= 30 && r.wage[1] === 2000 && Math.abs(r.wage[4] - 69000) <= 1000 && Math.abs(r.wage[7] - 627000) <= 3000 && r.staff[0] === 1000,
  'a wage of $' + r.wage.map(w => w.toLocaleString()).join(', $') + ' a week at 51, 55, 65, 75, 79, 85, 90 and 94; a coach $' + r.staff.map(w => w.toLocaleString()).join(', $') + ' at 1, 5 and 9 (twenty times what it was)');
ok(r.start === 250000 && r.bill >= 9000 && r.bill <= 20000, 'a new club: $' + r.start.toLocaleString() + ' in the bank, its ' + r.n + ' men (rated ' + r.avg + ') on $' + r.bill.toLocaleString() + ' a week');

// --- THE MONEY ROUND IT ----------------------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, out={};
  for(const t of [1,2,3,4]){ const c=JSON.parse(JSON.stringify(d)); c.tier=t; c.loyalty=LOYALTY_BASE[t]; c.sponsorWk=null; if(c.stadium) c.stadium.lvl=Math.min(STAD_MAX,t); c.lg=null; c.staff=[];
    const L=MG_LEVEL[t]; c.roster=[]; for(let i=0;i<19;i++){ const o=L+(i%5)-2; c.roster.push({id:9e6+i,name:'X'+i,role:'MID',ovr:o,wage:mgWage(o),age:26}); }
    const f=computeFinance(c), fh=computeFinance(c,{home:true,competition:'league',oppOvr:L}), bc=f.broadcastWk*(1+(MG_CLUBS-7)/MG_CLUBS*0.8);
    out[t]={partners:f.sponsorWk, tv:f.broadcastWk, rate:goingRate(c), net:Math.round(26*(f.sponsorWk+bc+f.commercialWk+f.shirtWk-f.wageWk)+13*fh.homeGate+13*f.awayGate)}; }
  const B=(k,l)=>BLD_LV[k][l].cost;
  return { mid:out, prize:MG_PRIZE, ai:MG_AI_BUDGET, cl:[CUP.cl.entry,CUP.cl.prize[0],CUP.cl.prize[6],CUP.cl.prize[8]], fa:[CUP.fashion.prize[0],CUP.fashion.prize[4]], coco:[CUP.coco.prize[0],CUP.coco.prize[5]],
    club:CLUB_LV.slice(2).map(x=>x.cost), train:[B('train',2),B('train',3),B('train',4)], physio:[1,2,3,4].map(l=>B('physio',l)), scout:[1,2,3].map(l=>B('scouting',l)), acad:[1,2,3].map(l=>B('academy',l)),
    stad:STAD_LEVELS.slice(2).map(x=>x.cost), scoutOne:MG_SCOUT_COST, deco:[Math.min(...DECO_SHOP.map(x=>x[3])),Math.max(...DECO_SHOP.map(x=>x[3]))],
    tvLeague:broadcastGameBump(d,{competition:'league',oppOvr:90,home:true}), tvCup:broadcastGameBump(d,{competition:'cup',oppOvr:60,home:true}), week:broadcastFor(d) }; })()`);
info('the money: ' + JSON.stringify(r));
const want = { 1: 1.5e6, 2: 10e6, 3: 38e6, 4: 162e6 };
ok([1, 2, 3, 4].every(t => r.mid[t].partners === [0, 15000, 60000, 250000, 1500000][t] && r.mid[t].tv === [0, 45000, 250000, 900000, 3200000][t] && r.mid[t].rate === [0, 25, 30, 40, 60][t]),
  'each league\'s TV ($45k, $250k, $900k, $3.2M a week), partners ($15k to $1.5M) and going rate for a seat ($25, $30, $40, $60)');
ok([1, 2, 3, 4].every(t => Math.abs(r.mid[t].net / want[t] - 1) <= 0.25),
  'a mid-table club\'s season before prizes and transfers: ' + [1, 2, 3, 4].map(t => '$' + M(r.mid[t].net) + 'M (the change list: ~$' + M(want[t]) + 'M)').join(', ') + ' -- each within a quarter');
ok(r.prize[1] === 500000 && r.prize[4] === 60e6 && r.ai[1] === 400000 && r.ai[4] === 150e6 && r.cl.join() === '12000000,2500000,8000000,15000000' && r.fa.join() === '500000,5000000' && r.coco.join() === '50000,400000',
  'the league prizes ($0.5M to $60M), the computer clubs\' budgets ($0.4M to $150M), the Champions League ($12M in it, $2.5M a group game won, $8M to $15M a knockout round), the cups ($0.5M to $5M a round, $50k to $400k)');
// (v170) THE HANDOFF'S TUNING: the Player of the Month's prize, the shirts, the league prize's floor and its own line,
// and the computer clubs' dearest deals
const T = await K(`(()=>{ return { potm:[1,2,3,4].map(t=>POTM_PRIZE[t]), shirt:[1,2,3,4].map(t=>SHIRT_FAN[t]), share:[1,2,7,13,14].map(p=>+lgPrizeShare(p).toFixed(3)), last:mgRound(MG_PRIZE[1]*lgPrizeShare(MG_CLUBS)),
  lname:LDG_NAME.league, top:+(AI_DEAL_SHARE[1]*345e6/1e6).toFixed(1), floor:+(AI_SETTLE*250e6/1e6).toFixed(1), clubs:MG_CLUBS }; })()`);
info('the handoff\'s tuning: ' + JSON.stringify(T));
ok(T.potm.join() === '25000,100000,300000,1000000', 'the Player of the Month\'s prize: $25k, $100k, $300k, $1M by the league (v170: $2,500 to $40,000) -- the Player of the Year four times it, the Golden Boot and Glove twice');
ok(T.shirt.join() === '3.3,3.9,4.5,5.4', 'shirts: $3.30 to $5.40 a fan a week (v170: 22 to 36 cents)');
ok(T.clubs === 14 && T.share[0] === 1 && T.share[4] === 0.1 && T.share[3] === 0.1 && T.share[2] > 0.1 && T.last === 50000 && T.lname === 'League prize money',
  'the league\'s prize money never under a tenth of the champions\' (' + T.share.join(', ') + ' for 1st, 2nd, 7th, 13th, 14th): 14th in League 2 $' + T.last + ' (v170: $7,300), on a line of its own in the week\'s money ("' + T.lname + '")');
ok(T.top >= T.floor, 'the richest Premium League club ($345M) can go for a man asking $250M: what his club would settle for ($' + T.floor + 'M) is within the 65% it spends on one man ($' + T.top + 'M; v170: only an ask under 60% of its money, $207M)');
ok(r.club.join() === '400000,2000000,8000000' && r.train.join() === '150000,700000,2500000' && r.physio.join() === '75000,300000,1000000,3000000' && r.scout.join() === '200000,250000,1200000'
  && r.acad.join() === '400000,400000,2500000' && r.stad.join() === '800000,3000000,10000000,35000000' && r.scoutOne[1] === 3000 && r.scoutOne[4] === 100000 && r.deco[0] === 2500 && r.deco[1] === 200000,
  'what it costs: the clubhouse $0.4M, $2M, $8M; the stadium $0.8M to $35M; the rest as the change list has them; scouting a man $3k to $100k; the decorations $2,500 to $200,000');
ok(r.tvLeague === 0 && r.tvCup > r.week * 0.5, 'a league game\'s TV money is the week\'s broadcast and no more (even against the best: +$' + r.tvLeague + '); a cup tie brings $' + r.tvCup.toLocaleString() + ' more');

// --- HOME TO STAY ---------------------------------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data; mgMarketOpen(d); d.phase='summer'; d.day=1; const p=mgNewPlayer(d,'ATT',76,34,{until:d.season+1}); p.hometown=true; mgRosterAdd(d,p);
  d.offers=[]; for(let i=0;i<300;i++) mgAiBids(d,5,1);
  const bids=d.offers.filter(o=>o.pid===p.id).length, any=d.offers.length, c=mgAiClubs(d).find(c=>c.tier===d.tier), loan=mgLoanOut(d,p.id,c.id);
  MGUI.sel=p.id; const card=mgSaleActions(d,p); return { pid:p.id, bids, any, loan, card, listed:!!d.listed[p.id], tab:mgSellingTab(d).includes('HOME TO STAY') }; })()`);
ok(r.bids === 0 && r.any > 0 && /won’t be sold/.test(r.loan) && /came home to finish his career here/.test(r.card) && !/LIST HIM/.test(r.card) && r.tab,
  'the hometown hero: no club bids for him (' + r.bids + ' of ' + r.any + ' bids), no loan ("' + r.loan + '"), and on the selling screen HOME TO STAY: "He came home to finish his career here. He won\'t be sold." -- no LIST HIM');
await K(`(()=>{ mgSave(CAREER.data); return 1; })()`);
r = await page.evaluate(pid => { const d = JSON.parse(localStorage.getItem('ft_mgr_slot1')); const p = d.roster.find(x => x.id === pid); return !!p && p.hometown === true; }, r.pid);
ok(r, '...and it\'s kept with the career when it\'s saved');

// --- A NEW CLUB'S FIRST SEASON, NO TRANSFERS --------------------------------------------------------------------------------------------
await page.click('#smItems [data-act="new"]').catch(() => {});
r = await K(`(()=>{ const d=CAREER.data; d.roster=d.roster.filter(p=>!p.hometown); d.phase='summer'; const b0=d.budget, s0=d.season; let i=0;
  while(i<4000&&d.season===s0&&!d.review){ if(mgNextGame(d)) mgSim(d); else mgForward(d); i++; }
  return { b0, b1:Math.round(d.budget), pos:mgPos(d) }; })()`);
const net = r.b1 - r.b0;
info('the first season: ' + JSON.stringify(r));
ok(net >= 1.35e6 && net <= 3.3e6, 'a new club\'s first season, no transfers: +$' + M(net) + 'M (' + r.pos + 'th) -- the change list reckons about $1.8M; where it finishes moves it ($1.8M 14th to $2.9M 9th, measured: the TV and the prize go by the table)');

// --- A CAREER KEPT FROM BEFORE: put into the new money, once ------------------------------------------------------------------------------
r = await K(`(()=>{ const d=JSON.parse(JSON.stringify(CAREER.data)), W=d.world, p=d.roster[0], c=mgAiClubs(d).find(c=>c.tier===4), coach={id:99,k:'tec',r:5,wage:250};
  // (as v148 had it: the old wages, the old bank, the old budgets)
  const all=[...d.roster,...(W.free||[]),...Object.values(W.clubs).flatMap(c=>c.players||[])]; for(const q of all) q.wage=WAGE_V148(q.ovr);
  d.staff=[coach]; d.budget=45000; c.budget=6000000; d.listed={[p.id]:Math.round(valueV148(d,p))}; d.ticketPrice=7; delete d.w149;
  const w0=p.wage, v0=d.listed[p.id];
  mgMigrate(d); const once={ budget:d.budget, wage:p.wage, want:mgWage(p.ovr), coach:coach.wage, ai:c.budget, listed:d.listed[p.id], value:mgValue(d,p), price:d.ticketPrice, flag:d.w149 };
  mgMigrate(d); once.again=d.budget===once.budget&&p.wage===once.wage; once.w0=w0; once.v0=v0; return once; })()`);
info('a career from before: ' + JSON.stringify(r));
ok(r.flag && r.budget === 45000 * 22 && Math.abs(r.wage - r.want) <= r.want * 0.02 && r.coach === 5000 && r.ai === 150e6 && Math.abs(r.listed - r.value) <= r.value * 0.02 && r.price === 35 && r.again,
  'a career from before: the bank $45,000 -> $' + r.budget.toLocaleString() + ' (22 times), a man on the going wage still on it ($' + r.w0 + ' -> $' + r.wage.toLocaleString() + '), a coach $250 -> $' + r.coach.toLocaleString() + ', a Premium League club $6M -> $' + M(r.ai) + 'M, a man listed at his worth still at it ($' + r.v0.toLocaleString() + ' -> $' + r.listed.toLocaleString() + '), a $7 seat $' + r.price + ' -- and only once');

process.exitCode = rep.finish();
await browser.close();
