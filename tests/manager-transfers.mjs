// FOOTBALL CLASSIC, THE TRANSFER MARKET (v83): your phone rings on the first day of pre-season. Each club prices its own
// men: the younger the dearer; potential only as far as its scouts see it (a club with poor scouts prices a man on what he
// is now, one with good scouts on what he could be); a man in fine form gets noticed; two bids or more over its price and
// it knows it has a gem (and asks more than the best of them); and no two clubs quite alike. YOUR BIDS are answered in
// time: well under the price, no, at once; a quarter over, yes, at once; near it, they make you wait till Monday -- then
// yes, or the price they want (more, with another club in, who gets him if you don't match it in a week); meet it and
// he's yours; sign him at the wage a man as good as he is earns. A man who's come on a lot asks for a new deal: give it
// him, or say not now (it stings), or leave him waiting (every three weeks it costs him). On a copy of the game that lets
// the test reach it.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  let INJ_OFF=false;', '  let INJ_OFF=true;');
patch('  // ===== END MANAGER CAREER', '  window.__K={ ev:s=>eval(s) };\n  // ===== END MANAGER CAREER');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-xfer-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
const K = s => page.evaluate(s => window.__K.ev(s), s);
let r;
await page.emulateMedia({ reducedMotion: 'reduce' });
await page.click('#smItems [data-act="new"]'); await page.waitForTimeout(150);
await page.click('#newSlotList .slotBtn >> nth=0'); await page.waitForTimeout(100);
await page.waitForSelector('#mgrMaker.on', { timeout: 4000 });
await page.fill('#mgName', 'Ade Moss'); await page.fill('#mgClubIn', 'Market Town');
await page.click('#mgGo'); await page.waitForSelector('#careerHub.show', { timeout: 6000 }); await page.waitForTimeout(150);

// --- THE PHONE: it rings on the first day of pre-season -------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, m=document.getElementById('storyModal'); return { phase:d.phase, day:d.day, md:d.md, phone:d.story.phone, on:m.classList.contains('on'), text:m.innerText.replace(/\\s+/g,' ') }; })()`);
info('day one: ' + JSON.stringify(r));
ok(r.phase === 'summer' && r.day === 1 && r.md === 0 && r.phone === 1 && r.on && /YOUR PHONE IS RINGING/.test(r.text), 'a new career, the first day of pre-season: the phone is ringing');
await page.click('#storyModal [data-st="answer"]'); await page.waitForTimeout(60);
const call = await page.evaluate(() => document.querySelector('#storyModal .stCard').innerText.replace(/\s+/g, ' '));
await page.click('#storyModal [data-st="phone"]'); await page.waitForTimeout(60);
r = await K(`(()=>{ const d=CAREER.data; return { market:d.lv.market, phone:d.story.phone, budget:d.budget }; })()`);
ok(/Pre-season starts today/.test(call) && r.market === 1 && r.phone === 2, 'answered: the chairman, pre-season and the window open, transfers through the phone ("' + call.slice(12, 80) + '...")');
await K(`(()=>{ const d=CAREER.data; d.story={vet:2,kid:2,phone:2}; mgStoryShow(d); d.budget=5e6; mgSave(d); return 1; })()`);

// --- WHAT A CLUB ASKS ------------------------------------------------------------------------------------------------------
// one man (rated 60) put through clubs set up by hand: their scouts (sc) and temperament (gr), his age, potential and form
r = await K(`(()=>{ const d=CAREER.data, C=mgAiClubs(d), a=C[0], b=C[1];
  const man=(age,pot,fm,ovr)=>{ const p=mgNewPlayer(d,'MID',ovr||60,age,{sub:'CM',pot,until:d.season+2}); p.ovr=ovr||60; p.pot=pot; p.fm=fm; return p; };
  const at=(c,sc,gr,p)=>{ mgClubEye(c); const s0=c.sc,g0=c.gr; c.sc=sc; c.gr=gr; c.players.push(p); const v=mgAsk(d,p,c); c.players.pop(); c.sc=s0; c.gr=g0; return v; };
  const out={};
  out.age=[at(a,0.5,1,man(19,60)), at(a,0.5,1,man(24,60)), at(a,0.5,1,man(29,60)), at(a,0.5,1,man(33,60))];
  out.poorScouts=[at(a,0,1,man(19,60)), at(a,0,1,man(19,85))];
  out.goodScouts=[at(a,1,1,man(19,60)), at(a,1,1,man(19,85))];
  out.form=[at(a,0,1,man(19,85,6.6)), at(a,0,1,man(19,85,7.6))];
  out.temper=[at(a,0.5,0.9,man(24,70)), at(b,0.5,1.2,man(24,70))];
  const g=man(19,85); a.players.push(g); const s0=a.sc; a.sc=0; out.gem0=mgAsk(d,g,a); mgBidSeen(g,out.gem0*1.1,out.gem0); out.gem1=mgAsk(d,g,a);
  mgBidSeen(g,out.gem0*1.3,out.gem0); out.gem2=mgAsk(d,g,a); out.mk=g.mk; a.players.pop(); a.sc=s0;
  out.eyes=C.map(c=>mgClubEye(c).sc); out.temps=C.map(c=>c.gr);
  return out; })()`);
info('asks: ' + JSON.stringify(r));
ok(r.age[0] > r.age[1] && r.age[1] > r.age[2] && r.age[2] > r.age[3], 'the younger the dearer: the same man, rated 60, at 19, 24, 29 and 33: ' + r.age.join(', '));
ok(r.poorScouts[0] === r.poorScouts[1], 'a club with poor scouts prices a 19-year-old on what he is: the same whether his ceiling is 60 or 85 (' + r.poorScouts.join(', ') + ')');
ok(r.goodScouts[1] > r.goodScouts[0] * 1.8, 'one with good scouts on what he could be: ' + r.goodScouts.join(' -> '));
ok(r.form[1] > r.form[0], 'a man in fine form gets noticed, even by poor scouts: ' + r.form.join(' -> '));
ok(r.temper[0] !== r.temper[1] && new Set(r.temps).size > 1 && new Set(r.eyes).size > 1, 'no two clubs quite alike: the same man ' + r.temper.join(' or ') + ' (temperaments ' + r.temps.slice(0, 5).join(', ') + '...; scouts ' + r.eyes.slice(0, 5).join(', ') + '...)');
ok(r.gem1 === r.gem0 && r.mk.n === 2 && r.gem2 >= r.gem0 * 1.3 * 1.08 - 10, 'one bid over their price changes nothing (' + r.gem1 + '); a second, and they know they have a gem: ' + r.gem2 + ', over the best bid');

// --- YOUR BIDS ------------------------------------------------------------------------------------------------------------
// a man at a club with room to sell; bids at fractions of their price, the dice fixed where it matters
r = await K(`(()=>{ const d=CAREER.data, out={}, rnd=Math.random;
  const pick=()=>{ for(const c of mgAiClubs(d)){ if(c.players.length<14||Math.abs(c.tier-d.tier)>0) continue; const p=c.players.find(x=>x.role!=='GK'&&!mgWontCome(d,x)&&!(d.bids||[]).some(b=>b.pid===x.id)); if(p) return {p,c}; } };
  const go=(k,fee,dice)=>{ const {p,c}=pick(), ask=mgAsk(d,p,c); Math.random=()=>dice; const res=mgBid(d,p.id,mgRound(ask*fee)); Math.random=rnd; return {p,c,ask,res,B:mgBidOf(d,p.id)}; };
  let t=go('low',0.7,0.5); out.low={res:t.res, B:!!t.B};
  t=go('high',1.3,0.99); out.high={res:t.res, st:t.B&&t.B.st};
  t=go('near',0.9,0.99); out.near={res:t.res, st:t.B&&t.B.st};
  // Monday, nobody else in (the dice high): 90% of it, and they want a little more than you bid
  Math.random=()=>0.99; d.weeks=(d.weeks||0)+1; mgBidReplies(d); Math.random=rnd;
  out.nearMon={st:t.B.st, ask:t.B.ask, fee:t.B.fee, price:t.ask};
  // meet it: his
  out.meet=mgBid(d,t.p.id,t.B.ask); out.meetSt=mgBidOf(d,t.p.id).st;
  // and sign him: at the wage a man as good as he is earns, for the agreed fee
  const b0=d.budget, n0=d.roster.length, fee=mgBidOf(d,t.p.id).fee, err=mgSignDeal(d,t.p.id,fee,2), him=d.roster.find(x=>x.id===t.p.id);
  out.sign={err, mine:!!him, wage:him&&him.wage, demand:him&&mgDemand(d,him,true), paid:b0-d.budget, fee, n:d.roster.length-n0, left:!!mgBidOf(d,t.p.id)};
  // ANOTHER CLUB IN: 95% of it on Monday, a rival bidding more (the dice low) -- they want more; left a week, he goes there
  t=go('rival',0.95,0.99); Math.random=()=>0.01; d.weeks++; mgBidReplies(d); Math.random=rnd;
  out.rival={st:t.B.st, ask:t.B.ask, rf:t.B.rf, rivalClub:t.B.rival, fee:t.B.fee};
  d.weeks++; mgBidReplies(d); const where=mgFind(d,t.p.id);
  out.rivalAfter={gone:!mgBidOf(d,t.p.id), club:where&&where.club&&where.club.id, from:t.c.id};
  // THE WINDOW SHUTS on a bid
  t=go('shut',0.9,0.99); const ph=d.phase; d.phase='league'; d.md=MG_HALF+1; mgBidReplies(d); out.shut=!mgBidOf(d,t.p.id); d.phase=ph; d.md=0;
  return out; })()`);
info('bids: ' + JSON.stringify(r));
ok(!r.low.res.ok && !r.low.res.wait && /turn it down: it’d take around/.test(r.low.res.msg) && !r.low.B, 'well under their price (70%): no, at once, and what it would take ("' + r.low.res.msg + '")');
ok(r.high.res.ok && r.high.st === 'yes', 'a quarter over and more (130%): they take it there and then');
ok(r.near.res.wait && r.near.st === 'wait', 'near it (90%): they make you wait -- an answer on Monday');
ok(r.nearMon.st === 'more' && r.nearMon.ask > r.nearMon.fee, 'Monday, nobody else in: they want more than you bid -- ' + r.nearMon.ask + ' for your ' + r.nearMon.fee + ' (their price ' + r.nearMon.price + ')');
ok(r.meet.ok && r.meetSt === 'yes', 'meet it, and he\'s yours to sign');
ok(!r.sign.err && r.sign.mine && r.sign.wage === r.sign.demand && r.sign.paid === r.sign.fee && r.sign.n === 1 && !r.sign.left,
  'signed: the fee paid (' + r.sign.paid + '), his wage what a man as good as he is earns (' + r.sign.wage + '), the bid done with');
ok(r.rival.st === 'more' && r.rival.rivalClub && r.rival.ask > r.rival.rf && r.rival.ask <= r.rival.rf * 1.1 + 50 && r.rival.rf > r.rival.fee, 'another club in for him, bidding more (' + r.rival.rf + ' to your ' + r.rival.fee + '): match ' + r.rival.ask + ' this week');
ok(r.rivalAfter.gone && r.rivalAfter.club === r.rival.rivalClub && r.rivalAfter.club !== r.rivalAfter.from, 'left a week: he joins the other club');
ok(r.shut, 'the window shuts: the bid is off');

// --- ON HIS CARD: bid near their price, and it waits; the Offers tab lists your bids ---------------------------------------
r = await K(`(()=>{ const d=CAREER.data; for(const c of mgAiClubs(d)){ if(c.tier!==d.tier||c.players.length<14) continue; const p=c.players.find(x=>x.role!=='GK'&&!mgWontCome(d,x)&&!mgBidOf(d,x.id)); if(p){ MGUI.sel=p.id; MGUI.tier=c.tier; MGUI.bid={pid:p.id,fee:mgRound(mgAsk(d,p,c)*0.9)}; return {id:p.id, name:p.name}; } } })()`);
await page.click('#chCampus [data-bldg="market"]'); await page.waitForSelector('#bldgPanel.show'); await page.click('#bldgPanel .bpTab:text-is("Search")'); await page.waitForTimeout(80);
await K(`(()=>{ const d=CAREER.data; MGUI.sel=${r.id}; MGUI.bid={pid:${r.id},fee:mgRound(mgAsk(d,mgFind(d,${r.id}).p,mgFind(d,${r.id}).club)*0.9)}; mgRerender(); return 1; })()`); await page.waitForTimeout(60);
if(await page.$('#bpBody [data-mside="deal"]')){ await page.click('#bpBody [data-mside="deal"]'); await page.waitForTimeout(60); }
const before = await page.innerText('#bpBody .mgCard');
await K(`(()=>{ window.__rnd=Math.random; Math.random=()=>0.99; return 1; })()`);
await page.click('#bpBody [data-mg="bid"]'); await page.waitForTimeout(60);
await K(`(()=>{ Math.random=window.__rnd; return 1; })()`);
const after = await page.innerText('#bpBody .mgCard');
await page.click('#bldgPanel .bpTab:text-is("Offers")'); await page.waitForTimeout(80);
const offers = await page.innerText('#bpBody');
ok(/ASKING/.test(before) && /YOUR BID/.test(after) && /answer on Monday/.test(after) && /YOUR BIDS/.test(offers) && offers.includes(r.name) && /answer on Monday/.test(offers),
  'on his card: ASKING, then your bid in -- "they answer on Monday"; the Offers tab lists it under YOUR BIDS');
// Monday's answer, a counter: THEY WANT on his card -- MEET IT, AGREED, SIGN HIM
await page.click('#bldgPanel .bpTab:text-is("Search")'); await page.waitForTimeout(80);
await K(`(()=>{ const d=CAREER.data, B=mgBidOf(d,${r.id}); B.st='more'; B.ask=mgRound(B.fee*1.15); B.rival=null; MGUI.sel=${r.id}; MGUI.bid=null; mgRerender(); return 1; })()`); await page.waitForTimeout(60);
if(await page.$('#bpBody [data-mside="deal"]')){ await page.click('#bpBody [data-mside="deal"]'); await page.waitForTimeout(60); }
const counter = await page.innerText('#bpBody .mgCard');
await page.click('#bpBody [data-mg="meet"]'); await page.waitForTimeout(60);
if(await page.$('#bpBody [data-mside="deal"]')){ await page.click('#bpBody [data-mside="deal"]'); await page.waitForTimeout(60); }
const agreed = await page.innerText('#bpBody .mgCard');
await page.click('#bpBody [data-mg="sign"]'); await page.waitForTimeout(80);
const signedUI = await K(`(()=>{ const d=CAREER.data; return { mine:d.roster.some(p=>p.id===${r.id}), bid:!!mgBidOf(d,${r.id}) }; })()`);
ok(/THEY WANT/.test(counter) && /MEET IT/.test(counter) && /WALK AWAY/.test(counter) && /AGREED/.test(agreed) && signedUI.mine && !signedUI.bid,
  'a counter on his card (THEY WANT, MEET IT, WALK AWAY); MEET IT: AGREED; SIGN HIM: he\'s yours');
// another counter: WALK AWAY drops it; and from the Offers tab, HIS CARD
const r2 = await K(`(()=>{ const d=CAREER.data; for(const c of mgAiClubs(d)){ if(c.tier!==d.tier||c.players.length<14) continue; const p=c.players.find(x=>x.role!=='GK'&&!mgWontCome(d,x)&&!mgBidOf(d,x.id)); if(p){
  mgBidSet(d,{p,club:c},mgRound(mgAsk(d,p,c)*0.9),'more',{ask:mgAsk(d,p,c),rival:null}); MGUI.sel=null; return {id:p.id, name:p.name}; } } })()`);
await page.click('#bldgPanel .bpTab:text-is("Offers")'); await page.waitForTimeout(80);
await page.click(`#bpBody [data-mg="bidgo"][data-pid="${r2.id}"]`); await page.waitForTimeout(120);
if(await page.$('#bpBody [data-mside="deal"]')){ await page.click('#bpBody [data-mside="deal"]'); await page.waitForTimeout(60); }
const viaOffers = { tab: await page.textContent('#bldgPanel .bpTab.on').catch(() => ''), card: await page.innerText('#bpBody .mgCard') };
await page.click('#bpBody [data-mg="walk"]'); await page.waitForTimeout(60);
const walked = await K(`!!mgBidOf(CAREER.data,${r2.id})`);
ok(viaOffers.card.includes(r2.name) && /THEY WANT/.test(viaOffers.card) && !walked, 'from the Offers tab, HIS CARD opens his card in Search (' + viaOffers.tab + '); WALK AWAY drops the bid');
await page.click('#bldgPanel .bpTopBack'); await page.waitForTimeout(60);

// --- A MAN WHO'S COME ON asks for a new deal -------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, out={}, R=d.roster.filter(p=>p.role!=='GK'), p=R[0], q=R[1];
  for(const x of [p,q]){ x.until=d.season+2; x.ovr+=8; delete x.wantsOut; x.mor=6.5; }
  d.news=[]; mgContractAsks(d); out.asked=!!p.cAsk&&!!q.cAsk; out.news=d.news.map(n=>n.t).filter(t=>/wants a new deal/.test(t)).length;
  out.want=p.cAsk&&p.cAsk.wage; out.wage=p.wage;
  // not now (p): a point off, and no asking again for eight weeks -- checked as the weeks go by below
  const m1=p.mor; out.no=mgContractNo(d,p.id); out.noMor=[m1,p.mor]; const no0=d.weeks||0;
  // three weeks unanswered (q): it costs him a point
  const m0=q.mor; d.weeks=(d.weeks||0)+3; mgContractAsks(d); out.waited=[m0,q.mor]; out.again3=!!p.cAsk;
  // ...and three more: a point again, and he stops asking (till eight weeks on)
  const qa={mor:q.mor}; d.weeks+=3; mgContractAsks(d); out.gaveUp={mor:[qa.mor,q.mor], asking:!!q.cAsk, back:q.cNot-d.weeks};
  d.weeks=no0+9; mgContractAsks(d); out.again9=!!p.cAsk;
  delete q.cNot; mgContractAsks(d);   // (q asking again, for the GIVE IT HIM below)
  // give it him: his new wage, his deal no shorter
  const u0=q.until, err=mgRenew(d,d.roster.indexOf(q),1); out.give={err, wage:q.wage, want:mgRenewWage(d,q), until:q.until, u0, asked:!!q.cAsk};
  return out; })()`);
info('new deals: ' + JSON.stringify(r));
ok(r.asked && r.news === 2 && r.want >= r.wage * 1.3, 'two men who\'ve come on a lot (8 points), with two seasons left: each asks for a new deal (' + r.want + ' a week, on ' + r.wage + ')');
ok(r.waited[1] === r.waited[0] - 1, 'left waiting three weeks: a point off his mood (' + r.waited.join(' -> ') + ')');
ok(r.gaveUp.mor[1] === r.gaveUp.mor[0] - 1 && !r.gaveUp.asking && r.gaveUp.back === 8, 'three more: another point, and he stops asking -- till eight weeks on (' + r.gaveUp.mor.join(' -> ') + ')');
ok(!r.no && r.noMor[1] === r.noMor[0] - 1 && !r.again3 && r.again9, 'NOT NOW: a point off, and he asks again eight weeks on (not at three)');
ok(!r.give.err && r.give.wage === r.give.want && r.give.until === r.give.u0 && !r.give.asked, 'GIVE IT HIM: his new wage (' + r.give.wage + '), his deal no shorter, the ask settled');

process.exitCode = rep.finish();
await browser.close();
