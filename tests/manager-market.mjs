// FOOTBALL CLASSIC, THE MARKET AND THE WEEK'S MONEY (v151): what an unscouted man would ask, read from what he's paid --
// within 15% of what he signs for, nearly always (from the middle of his range it was about one time in five); what it
// costs to release a man, never more than twice what he's worth; a bid set in a tap -- half their price, three-quarters,
// their price, a tenth over -- or any figure typed ('2.5m'), and a price to list him at the same way; once scouted, what
// he's worth beside what they ask. And THE WEEK'S MONEY: NET/WK on the hub says it's projected (in pre-season, what comes
// in: the shirts), and tapped it shows every dollar of the week by what it was -- this week so far, last week, a league
// week projected -- from Monday's bank to now, to the dollar. On a copy the test can reach.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  let INJ_OFF=false;', '  let INJ_OFF=true;');
patch('  // ===== END MANAGER CAREER', '  window.__K={ ev:s=>eval(s) };\n  // ===== END MANAGER CAREER');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-mkt-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
const K = s => page.evaluate(s => window.__K.ev(s), s);
await page.click('#smItems [data-act="new"]'); await page.waitForTimeout(150);
await page.click('#newSlotList .slotBtn >> nth=0'); await page.waitForTimeout(100);
await page.waitForSelector('#mgrMaker.on', { timeout: 4000 });
await page.fill('#mgName', 'Sam Okafor'); await page.fill('#mgClubIn', 'Market Town');
await page.click('#mgGo'); await page.waitForSelector('#careerHub.show', { timeout: 8000 });
await K(`(()=>{ const d=CAREER.data; d.story={vet:2,kid:2,phone:2}; mgStoryShow(d); mgMarketOpen(d); mgSave(d); renderHub(); return 1; })()`);

// --- WHAT HE'D ASK, UNSCOUTED -------------------------------------------------------------------------------------------------
let r = await K(`(()=>{ const d=CAREER.data, st=a=>Math.round(100*a.filter(x=>Math.abs(x-1)<=0.15).length/a.length);
  const F=d.world.free.filter(p=>!mgKnown(d,p)&&!mgWontCome(d,p)), B=Object.values(d.world.clubs).filter(c=>c.id!==d.clubId).flatMap(c=>c.players).filter(p=>!mgKnown(d,p)&&!mgWontCome(d,p)).slice(0,300);
  return { free:st(F.map(p=>mgFreeAskSeen(d,p).wage/mgFreeAsk(d,p).wage)), buy:st(B.map(p=>mgDemandSeen(d,p,true)/mgDemand(d,p,true))), nf:F.length, nb:B.length }; })()`);
ok(r.free >= 85 && r.buy >= 85, 'what an unscouted man would ask, read from what he\'s paid: within 15% of what he signs for ' + r.buy + '% of the time to buy (' + r.nb + ' men), ' + r.free + '% for a free agent (' + r.nf + ') -- from the middle of his range it was about one in five');

// --- RELEASING A MAN --------------------------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, p=d.roster.slice().sort((a,b)=>mgValue(d,a)-mgValue(d,b))[0], keep={until:p.until,wage:p.wage};
  p.until=d.season+4; p.wage=p.wage*6; const capped=mgReleaseCost(d,p), half=mgRound(p.wage*((MG_MD-Math.min(d.md,MG_MD))+MG_MD*Math.max(0,(p.until||0)-d.season))*0.5), v=mgValue(d,p);
  Object.assign(p,keep); const all=d.roster.every(q=>mgReleaseCost(d,q)<=2*mgValue(d,q)+100); return { capped, half, v, all }; })()`);
ok(r.capped <= 2 * r.v + 100 && r.half > r.capped && r.all, 'releasing a cheap man on a long, dear deal: $' + r.capped.toLocaleString() + ' -- twice his worth ($' + r.v.toLocaleString() + '), not half his deal ($' + r.half.toLocaleString() + '); nobody of yours costs more than twice his worth to let go');

// --- A BID IN A TAP, OR TYPED ---------------------------------------------------------------------------------------------------------
await K(`(()=>{ const d=CAREER.data; d.budget=50e6; MGUI.sel=null; curTab.market='Search'; openBuilding('market'); paintBuilding(); return 1; })()`);
await page.waitForTimeout(150);
await page.click('#bpBody .mgList .mgRow >> nth=0'); await page.waitForTimeout(100);
if(await page.$('#bpBody [data-mside="deal"]')){ await page.click('#bpBody [data-mside="deal"]'); await page.waitForTimeout(80); }   // (his card turned over: his deal)
r = await K(`(()=>{ const d=CAREER.data, f=mgFind(d,MGUI.sel); return { pid:f.p.id, ask:mgAsk(d,f.p,f.club) }; })()`);
const pid = r.pid, ask = r.ask;
const fee = () => K(`MGUI.bid&&MGUI.bid.pid===${pid}?MGUI.bid.fee:null`);
const quick = await page.$$eval('#bpBody .mgQuick [data-mg="bidset"]', ns => ns.map(n => n.textContent));
const got = [];
for(const k of ['0.5', '0.75', '1', '1.1']){ await page.click(`#bpBody .mgQuick [data-mg="bidset"][data-k="${k}"]`); await page.waitForTimeout(60); got.push(await fee()); }
await page.fill('#bpBody .mgAmtIn[data-amt="bidset"]', '2.5m'); await page.press('#bpBody .mgAmtIn[data-amt="bidset"]', 'Enter'); await page.waitForTimeout(80); const typed = await fee();
await page.fill('#bpBody .mgAmtIn[data-amt="bidset"]', '10'); await page.press('#bpBody .mgAmtIn[data-amt="bidset"]', 'Enter'); await page.waitForTimeout(80); const tiny = await fee();
info('their price $' + ask.toLocaleString() + ': ' + quick.join(' / ') + ' -> ' + got.join(', ') + '; typed 2.5m -> ' + typed + ', typed 10 -> ' + tiny);
const near = (a, b) => Math.abs(a - b) <= Math.max(100, b * 0.01);
const want = await K(`[0.5,0.75,1.1].map(k=>mgRound(${ask}*k))`);   // (v181: each a round figure as the game rounds it -- $100,000s from $1M: a 1% allowance failed when 1.1 times the price came to just over $1M)
ok(quick.join() === 'HALF,3/4,THEIR PRICE,+10%' && got[0] === want[0] && got[1] === want[1] && got[2] === ask && got[3] === want[2] && typed === 2500000 && tiny === want[0],
  'a bid in a tap: HALF, 3/4, THEIR PRICE, +10% -- or any figure typed (2.5m: $' + (typed || 0).toLocaleString() + '; under half their price, half: $' + (tiny || 0).toLocaleString() + ') -- one tap, or a field, a figure and Enter');
r = await K(`(()=>{ const d=CAREER.data, c=mgAiClubs(d).find(k=>k.tier===d.tier), p=c.players.find(x=>!mgWontCome(d,x)); const before=mgBuyActions(d,p,c,false); knUp(d,p,3,3); const after=mgBuyActions(d,p,c,true); return { before:/WORTH/.test(before), after:/WORTH/.test(after), v:mgValue(d,p), ask:mgAsk(d,p,c) }; })()`);
ok(!r.before && r.after, 'once he\'s scouted, what he\'s worth ($' + r.v.toLocaleString() + ') beside what they ask ($' + r.ask.toLocaleString() + '): a dear price in red, a cheap one in green');
await K(`(()=>{ const d=CAREER.data; MGUI.sel=d.roster[3].id; curTab.market='Selling'; paintBuilding(); return 1; })()`); await page.waitForTimeout(120);
if(await page.$('#bpBody [data-mside="deal"]')){ await page.click('#bpBody [data-mside="deal"]'); await page.waitForTimeout(80); }
const lp = await K(`(()=>{ const d=CAREER.data; return mgValue(d,d.roster[3]); })()`);
await page.click('#bpBody .mgQuick [data-mg="listset"][data-k="1.5"]'); await page.waitForTimeout(60);
const l15 = await K('MGUI.list&&MGUI.list.price');
await page.fill('#bpBody .mgAmtIn[data-amt="listset"]', '750k'); await page.press('#bpBody .mgAmtIn[data-amt="listset"]', 'Enter'); await page.waitForTimeout(80);
const l750 = await K('MGUI.list&&MGUI.list.price');
ok(near(l15, lp * 1.5) && l750 === 750000, 'a price to list him at the same way: +50% of his worth ($' + l15.toLocaleString() + '), or typed (750k: $' + l750.toLocaleString() + ')');
await K(`(()=>{ hideBldg(); return 1; })()`);

// --- THE WEEK'S MONEY ----------------------------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data; d.phase='summer'; renderHub(); return { lbl:document.getElementById('chNetLbl').textContent, v:document.getElementById('chNet').textContent, shirts:shirtSales(d).wk }; })()`);
ok(r.lbl === 'PRE-SEASON/WK' && r.v === '+' + '$' + r.shirts.toLocaleString(), 'in pre-season NET/WK says what comes in a week -- the shirts, ' + r.v + ' -- not a league week\'s');
// a league week, a game in it: from Monday's bank to the next Monday's, to the dollar (a game played or simulated, the
// days run on to the next Monday: its money is last week's)
r = await K(`(()=>{ const d=CAREER.data; while(d.phase!=='league'||!mgNextGame(d)) mgForward(d); d.budget=Math.round(d.budget); mgSim(d); renderHub();
  const P=d.wlPrev, W=d.wl, sum=X=>Object.values(X.L).reduce((a,v)=>a+v,0);
  return { lbl:document.getElementById('chNetLbl').textContent, b0:P.b0, b1:P.b1, restP:P.b1-P.b0-sum(P), L:P.L, restW:Math.round(d.budget)-W.b0-sum(W), W:W.L, now:Math.round(d.budget) }; })()`);
info('the game\'s week: ' + JSON.stringify(r));
ok(r.lbl === 'NET/WK (PROJ.)' && Math.abs(r.restP) <= 1 && Math.abs(r.restW) <= 1 && r.L.wages < 0 && r.L.tv > 0 && r.L.partners > 0,
  'in the league NET/WK says it\'s projected; the game\'s week, line by line (' + Object.entries(r.L).map(([k, v]) => k + ' ' + v).join(', ') + '), takes its Monday\'s $' + r.b0.toLocaleString() + ' to the next Monday\'s $' + r.b1.toLocaleString() + ', and this week\'s (' + Object.entries(r.W).map(([k, v]) => k + ' ' + v).join(', ') + ') to the $' + r.now.toLocaleString() + ' in the bank -- nothing left over');
await page.click('#chNetBtn'); await page.waitForTimeout(150);
r = await page.evaluate(() => ({ on: document.getElementById('ldgModal').classList.contains('on'), t: document.querySelector('#ldgModal .ldgCard').innerText }));
ok(r.on && /THE WEEK’S MONEY/.test(r.t) && /THIS WEEK SO FAR/.test(r.t) && /A LEAGUE WEEK, PROJECTED/.test(r.t) && /Wages/.test(r.t) && /The TV/.test(r.t),
  'NET/WK tapped: THE WEEK\'S MONEY -- this week so far, line by line from Monday\'s bank, and a league week projected');
await page.click('#ldgModal [data-ldg="close"]'); await page.waitForTimeout(80);
// a week on: last week's lines kept, and they still add up; a release and a scout's report in this one
r = await K(`(()=>{ const d=CAREER.data; mgForward(d); while(!mgNextGame(d)) mgForward(d); const P=d.wlPrev; const kP=Object.values(P.L).reduce((a,v)=>a+v,0);
  d.lv.scouting=1; const f=mgAiClubs(d).find(c=>c.tier===d.tier).players[2]; mgScout(d,f.id); const i=d.roster.length-1; mgRelease(d,i);
  const W=d.wl, k=Object.values(W.L).reduce((a,v)=>a+v,0); return { prevOk:Math.abs(P.b0+kP-P.b1)<=1, scout:W.L.scouting, rel:W.L.transfers, rest:Math.round(d.budget)-W.b0-k }; })()`);
ok(r.prevOk && r.scout < 0 && r.rel < 0 && Math.abs(r.rest) <= 1, 'a week on, last week\'s lines kept and adding up; this week a scout\'s report ($' + (-r.scout).toLocaleString() + ') and a release ($' + (-r.rel).toLocaleString() + ') in their lines, nothing unaccounted for');

process.exitCode = rep.finish();
await browser.close();
