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
  const as=(role,sub)=>{ const p=mgNewPlayer(d,role,66,25,{sub,pot:66,until:d.season+2}); p.ovr=66; p.pot=66; return p; }, ps=[['ATT','STK'],['ATT','WNG'],['MID','CM'],['DEF','CB'],['GK','GK']].map(x=>as(...x));
  out.pos=ps.map(p=>at(a,0.5,1,p)); out.posVal=ps.map(p=>mgValue(d,p));
  return out; })()`);
info('asks: ' + JSON.stringify(r));
ok(r.age[0] > r.age[1] && r.age[1] > r.age[2] && r.age[2] > r.age[3], 'the younger the dearer: the same man, rated 60, at 19, 24, 29 and 33: ' + r.age.join(', '));
ok(r.poorScouts[0] === r.poorScouts[1], 'a club with poor scouts prices a 19-year-old on what he is: the same whether his ceiling is 60 or 85 (' + r.poorScouts.join(', ') + ')');
ok(r.goodScouts[1] > r.goodScouts[0] * 1.8, 'one with good scouts on what he could be: ' + r.goodScouts.join(' -> '));
ok(r.form[1] > r.form[0], 'a man in fine form gets noticed, even by poor scouts: ' + r.form.join(' -> '));
ok(r.temper[0] !== r.temper[1] && new Set(r.temps).size > 1 && new Set(r.eyes).size > 1, 'no two clubs quite alike: the same man ' + r.temper.join(' or ') + ' (temperaments ' + r.temps.slice(0, 5).join(', ') + '...; scouts ' + r.eyes.slice(0, 5).join(', ') + '...)');
const dn = a => a.every((v, i) => !i || a[i - 1] > v);
const nearK = (a, b, k) => Math.abs(a / b - k) <= 0.06;   // (v149: the change list's prices by position -- rounded to the $10,000 or $100,000)
ok(nearK(r.posVal[0], r.posVal[2], 1.1) && nearK(r.posVal[1], r.posVal[2], 1.1) && nearK(r.posVal[3], r.posVal[2], 0.55) && nearK(r.posVal[4], r.posVal[2], 0.38) && r.pos[0] > r.pos[2] && r.pos[1] > r.pos[2] && r.pos[3] < r.pos[2] * 0.7 && r.pos[4] < r.pos[3],
  'by position, as the real market has it (v149: the change list\'s -- a striker or a winger a tenth over a midfielder, a centre-back 55%, a keeper 38%): the same man, rated 66 at 25, asked ' + r.pos.join(', ') + ' as a striker, a winger, a midfielder, a centre-back and a keeper (worth to you ' + r.posVal.join(', ') + ')');
ok(r.gem1 === r.gem0 && r.mk.n === 2 && r.gem2 >= r.gem0 * 1.3 * 1.08 - 10, 'one bid over their price changes nothing (' + r.gem1 + '); a second, and they know they have a gem: ' + r.gem2 + ', over the best bid');

// --- YOUR BIDS ------------------------------------------------------------------------------------------------------------
// a man at a club with room to sell; bids at fractions of their price, the dice fixed where it matters
r = await K(`(()=>{ const d=CAREER.data, out={}, rnd=Math.random;
  const pick=()=>{ for(const c of mgAiClubs(d)){ if(c.players.length<14||Math.abs(c.tier-d.tier)>0) continue; const p=c.players.find(x=>x.role!=='GK'&&!mgWontCome(d,x)&&!(d.bids||[]).some(b=>b.pid===x.id)&&mgAsk(d,x,c)>=500); if(p) return {p,c}; } };   /* (a man with a price: one asking next to nothing rounds a 90% bid up to it) */
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
  // ANOTHER CLUB IN: 90% of it on Monday, a rival bidding more (the dice low) -- they want more; left a week, he goes there
  // (90%, not 95%: at an ask of about $3,000 95% and the rival's 98% round to the same $2,900, and yours is as good as his)
  t=go('rival',0.9,0.99); Math.random=()=>0.01; d.weeks++; mgBidReplies(d); Math.random=rnd;
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

// --- ON HIS CARD: bid near their price, and it waits; the Bids tab lists your bids (v108; it was the Offers tab) -----------
r = await K(`(()=>{ const d=CAREER.data; for(const c of mgAiClubs(d)){ if(c.tier!==d.tier||c.players.length<14) continue; const p=c.players.find(x=>x.role!=='GK'&&!mgWontCome(d,x)&&!mgBidOf(d,x.id)); if(p){ MGUI.sel=p.id; MGUI.tier=c.tier; MGUI.bid={pid:p.id,fee:mgRound(mgAsk(d,p,c)*0.9)}; return {id:p.id, name:p.name}; } } })()`);
await page.click('#chCampus [data-bldg="market"]'); await page.waitForSelector('#bldgPanel.show'); await page.click('#bldgPanel .bpTab:text-is("Search")'); await page.waitForTimeout(80);
await K(`(()=>{ const d=CAREER.data; MGUI.sel=${r.id}; MGUI.bid={pid:${r.id},fee:mgRound(mgAsk(d,mgFind(d,${r.id}).p,mgFind(d,${r.id}).club)*0.9)}; mgRerender(); return 1; })()`); await page.waitForTimeout(60);
if(await page.$('#bpBody [data-mside="deal"]')){ await page.click('#bpBody [data-mside="deal"]'); await page.waitForTimeout(60); }
const before = await page.innerText('#bpBody .mgCard');
await K(`(()=>{ window.__rnd=Math.random; Math.random=()=>0.99; return 1; })()`);
await page.click('#bpBody [data-mg="bid"]'); await page.waitForTimeout(60);
await K(`(()=>{ Math.random=window.__rnd; return 1; })()`);
const after = await page.innerText('#bpBody .mgCard');
await page.click('#bldgPanel .bpTab:text-is("Bids")'); await page.waitForTimeout(80);
const offers = await page.innerText('#bpBody'), bud = await K(`'$'+Math.round(CAREER.data.budget).toLocaleString()`);
ok(/ASKING/.test(before) && /YOUR BID/.test(after) && /answer on Monday/.test(after) && /OUT NOW/.test(offers) && offers.includes(r.name) && /answer on Monday/.test(offers) && /BUDGET/.test(offers) && offers.includes(bud),
  'on his card: ASKING, then your bid in -- "they answer on Monday"; the Bids tab lists it (OUT NOW), your budget on its top line (' + bud + ')');
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
// another counter: WALK AWAY drops it; and from the Bids tab, HIS CARD
const r2 = await K(`(()=>{ const d=CAREER.data; for(const c of mgAiClubs(d)){ if(c.tier!==d.tier||c.players.length<14) continue; const p=c.players.find(x=>x.role!=='GK'&&!mgWontCome(d,x)&&!mgBidOf(d,x.id)); if(p){
  mgBidSet(d,{p,club:c},mgRound(mgAsk(d,p,c)*0.9),'more',{ask:mgAsk(d,p,c),rival:null}); MGUI.sel=null; return {id:p.id, name:p.name}; } } })()`);
await page.click('#bldgPanel .bpTab:text-is("Bids")'); await page.waitForTimeout(80);
await page.click(`#bpBody [data-mg="bidgo"][data-pid="${r2.id}"]`); await page.waitForTimeout(120);
if(await page.$('#bpBody [data-mside="deal"]')){ await page.click('#bpBody [data-mside="deal"]'); await page.waitForTimeout(60); }
const viaOffers = { tab: await page.textContent('#bldgPanel .bpTab.on').catch(() => ''), card: await page.innerText('#bpBody .mgCard') };
await page.click('#bpBody [data-mg="walk"]'); await page.waitForTimeout(60);
const walked = await K(`!!mgBidOf(CAREER.data,${r2.id})`);
ok(viaOffers.card.includes(r2.name) && /THEY WANT/.test(viaOffers.card) && !walked, 'from the Bids tab, HIS CARD opens his card in Search (' + viaOffers.tab + '); WALK AWAY drops the bid');
// HAGGLING (v116): their figure isn't take it or leave it -- a counter between yours and theirs, answered there and then
const hg = await K(`(()=>{ const d=CAREER.data, out={}; d.budget=5e6;
  const set=()=>{ for(const c of mgAiClubs(d)){ if(c.tier!==d.tier||c.players.length<14) continue; const p=c.players.find(x=>x.role!=='GK'&&!mgWontCome(d,x)&&!mgBidOf(d,x.id)&&!x.loan);
    if(p){ mgBidSet(d,{p,club:c},40000,'more',{ask:50000,rival:null}); return mgBidOf(d,p.id); } } };   // (round figures, for the test)
  let B=set(); const pid=B.pid, a0=B.ask, f0=B.fee; out.a0=a0; out.f0=f0;
  out.same=mgCounter(d,pid,f0); out.sameSt=mgBidOf(d,pid).st;                                  // no more than you bid before: nothing moves
  B.lo=43000;                                                                                     // (what they'd settle for, set for the test)
  const c1=41200; out.r1=mgCounter(d,pid,c1); B=mgBidOf(d,pid); out.a1=B.ask; out.c1=c1; out.st1=B.st;
  out.r2=mgCounter(d,pid,41800); B=mgBidOf(d,pid); out.a2=B.ask;
  out.r3=mgCounter(d,pid,42400); B=mgBidOf(d,pid); out.a3=B.ask; out.firm=!!B.firm;
  out.r4=mgCounter(d,pid,B.ask-mgRound(B.ask*0.01)); out.st4=mgBidOf(d,pid).st;                // their last word: no more of it
  out.lastLo=out.a3>=B.lo;
  let C=set(); C.lo=46000; out.ok=mgCounter(d,C.pid,C.lo); out.okSt=mgBidOf(d,C.pid).st; out.okFee=mgBidOf(d,C.pid).fee; out.lo=C.lo;   // at what they'd settle for: a deal
  let R=set(); R.rival=mgAiClubs(d)[1].id; R.rf=47600; out.rv=mgCounter(d,R.pid,46000); out.rvLo=R.lo; out.rf=R.rf; out.rvSt=mgBidOf(d,R.pid).st;   // another club in: never under its fee
  for(const x of [pid,C.pid,R.pid]) d.bids=d.bids.filter(b=>b.pid!==x);
  return JSON.parse(JSON.stringify(out)); })()`);
info('haggling: ' + JSON.stringify(hg));
ok(hg.same.more && /no more than you bid/.test(hg.same.msg) && hg.sameSt === 'more', 'a counter no higher than your bid: nothing moves ("' + hg.same.msg + '")');
ok(hg.r1.more && hg.st1 === 'more' && hg.a1 < hg.a0 && hg.a1 > hg.c1 && hg.a2 < hg.a1 && hg.a3 <= hg.a2 && hg.firm && hg.lastLo,
  'a counter between: they come down part of the way (' + hg.a0 + ' > ' + hg.a1 + ' > ' + hg.a2 + ' > ' + hg.a3 + '), never under what they\'d settle for; the third is their last word');
ok(/won’t move/.test(hg.r4.msg) && hg.st4 === 'more', '...after it, they won\'t move ("' + hg.r4.msg + '")');
ok(hg.ok.ok && hg.okSt === 'yes' && hg.okFee === hg.lo, 'a counter at what they\'d settle for: they accept (' + hg.okFee + ')');
ok(hg.rv.more && hg.rvLo >= hg.rf && hg.rvSt === 'more', 'another club in for him: never under its fee (' + hg.rf + ': they\'d settle for ' + hg.rvLo + ')');
// ...and on his card: COUNTER, its fee between theirs and yours, + and −, answered there and then
const r3 = await K(`(()=>{ const d=CAREER.data; for(const c of mgAiClubs(d)){ if(c.tier!==d.tier||c.players.length<14) continue; const p=c.players.find(x=>x.role!=='GK'&&!mgWontCome(d,x)&&!mgBidOf(d,x.id)&&!x.loan); if(p){
  mgBidSet(d,{p,club:c},40000,'more',{ask:50000,rival:null}); const B=mgBidOf(d,p.id); B.lo=49500; MGUI.sel=p.id; MGUI.tier=c.tier; MGUI.bid=null; mgRerender(); return {id:p.id, ask:B.ask, fee:B.fee}; } } })()`);
await page.click('#bldgPanel .bpTab:text-is("Search")'); await page.waitForTimeout(80);
await K(`(()=>{ MGUI.sel=${r3.id}; mgRerender(); return 1; })()`); await page.waitForTimeout(60);
if(!(await page.$('#bpBody [data-mg="counter"]'))){ await page.click('#bpBody .mgPaneR .mgSides [data-mside="deal"]'); await page.waitForTimeout(60); }   // (to his deal side: its tab)
const cardH = await page.innerText('#bpBody .mgCard'); await page.click('#bpBody .mgStep [data-mg="bidstep"][data-dir="1"]'); await page.waitForTimeout(50);
const stepped = await K(`MGUI.bid&&MGUI.bid.fee`); await page.click('#bpBody [data-mg="counter"]'); await page.waitForTimeout(80);
const cardH2 = { msg: await page.textContent('#bpMsg').catch(() => ''), B: await K(`(()=>{ const B=mgBidOf(CAREER.data,${r3.id}); return B&&{ask:B.ask, fee:B.fee, st:B.st}; })()`) };
info('haggling on his card: ' + JSON.stringify({ r3, stepped, cardH2 }));
ok(/THEY WANT/.test(cardH) && /COUNTER/.test(cardH) && cardH.includes('$45,000') && stepped === 46300 && stepped <= r3.ask
   && cardH2.B && cardH2.B.st === 'more' && cardH2.B.ask < r3.ask && cardH2.B.fee === stepped && /come down/.test(cardH2.msg),
  'on his card: THEY WANT, and COUNTER with a fee between (' + stepped + ' after a +): they come down there and then ("' + cardH2.msg + '")');
await K(`(()=>{ const d=CAREER.data; d.bids=d.bids.filter(b=>b.pid!==${r3.id}); MGUI.sel=null; return 1; })()`);
// THE SEARCH'S FILTERS (v116): POSITION, TYPE, SORT (rating, potential, price either way, age) and IN BUDGET
await page.click('#bldgPanel .bpTab:text-is("Search")'); await page.waitForTimeout(80);
await K(`(()=>{ const d=CAREER.data; d.budget=20000; Object.assign(MGUI,{mpos:'ALL',arch:'ALL',sort:'ovr',cheap:false,drop:null,sel:null}); mgRerender(); return 1; })()`); await page.waitForTimeout(60);
const rows = () => page.evaluate(() => [...document.querySelectorAll('#bpBody .mgPaneL .mgRow')].map(r => ({ id: +r.dataset.pid, pos: r.querySelector('.pos').textContent, amt: +r.querySelector('.amt').textContent.replace(/[^\d]/g, ''), ovr: r.querySelector('.ovr').textContent })));
const pick = async (k, v) => { await page.click(`#bpBody [data-mg="mdrop"][data-k="${k}"]`); await page.waitForTimeout(60); const opts = await page.$$eval('#bpBody .mkMenu [data-mg="filt"]', ns => ns.map(n => n.textContent));
  await page.click(`#bpBody .mkMenu [data-mg="filt"][data-k="${k}"][data-v="${v}"]`); await page.waitForTimeout(80); return opts; };
const all0 = await rows();
const posOpts = await pick('mpos', 'DM'); const dm = await rows();   // (v127: a holding midfielder's a position again)
const typeOpts = await pick('arch', 'deepcreator'); const dc = await rows(), dcStyles = await K(`(()=>{ const d=CAREER.data; return ${JSON.stringify((await rows()).map(r => r.id))}.map(id=>mgFind(d,id).p.style); })()`);
const posAfter = await K('MGUI.mpos');
await pick('arch', 'ALL'); await pick('mpos', 'GK'); const gkTypes = await pick('arch', 'shotstopper'), gkRows = await rows(), gkStyles = await K(`(()=>{ const d=CAREER.data; return ${JSON.stringify((await rows()).map(r => r.id))}.map(id=>mgFind(d,id).p.style); })()`);
await pick('arch', 'ALL'); await pick('mpos', 'ALL');
await pick('sort', 'cheap'); const cheap = await rows();
await pick('sort', 'dear'); const dear = await rows();
const agesNow = () => K(`(()=>{ const d=CAREER.data; return [...document.querySelectorAll('#bpBody .mgPaneL .mgRow')].map(r=>mgFind(d,+r.dataset.pid).p.age); })()`);
const sortOpts = await pick('sort', 'age'); const ages = await agesNow();
await pick('sort', 'old'); const olds = await agesNow();
await K(`(()=>{ const d=CAREER.data, L=mgAiClubs(d).filter(c=>c.tier===(MGUI.tier||d.tier)).flatMap(c=>c.players); for(const p of L.slice(0,4)){ d.kn=d.kn||{}; d.kn[p.id]=2; } return 1; })()`);
await pick('sort', 'pot'); const pot = await rows(), potKnown = await K(`(()=>{ const d=CAREER.data; return [...document.querySelectorAll('#bpBody .mgPaneL .mgRow')].map(r=>mgPotSort(d,mgFind(d,+r.dataset.pid).p)); })()`);
await pick('sort', 'ovr'); await K(`(()=>{ CAREER.data.budget=${cheap[Math.floor(cheap.length / 2)].amt}; mgRerender(); return 1; })()`);   // (a budget some of them are over: the middle of their prices)
await page.click('#bpBody [data-mg="cheap"]'); await page.waitForTimeout(80); const inBud = await rows(), budNow = await K('CAREER.data.budget');
await page.click('#bpBody [data-mg="cheap"]'); await page.waitForTimeout(60); await K('(()=>{ CAREER.data.budget=20000; mgRerender(); return 1; })()');
const asc = a => a.every((v, i) => !i || a[i - 1] <= v), desc = a => a.every((v, i) => !i || a[i - 1] >= v);
info('the Search\'s filters: ' + JSON.stringify({ all: all0.length, dm: dm.length, dc: dc.length, posOpts, typeOpts, posAfter, cheap: cheap.slice(0, 4).map(r => r.amt), dear: dear.slice(0, 4).map(r => r.amt), ages: ages.slice(0, 6), pot: pot.slice(0, 5).map(r => r.ovr), inBud: inBud.length }));
ok(posOpts.join() === 'ALL,GK,CB,FB,DM,CM,AM,WM,WNG,STK' && dm.length > 0 && dm.length < all0.length && dm.every(r => r.pos === 'DM'), 'POSITION: a man\'s own (' + posOpts.join(' ') + ': v127, a holding and an attacking midfielder positions again); DM, and only DMs (' + dm.length + ' of ' + all0.length + ')');
ok(String(typeOpts) === 'ALL,DMBall-winner,DMDeep creator,DMAnchor' && dcStyles.every(x => x === 'deepcreator') && dc.length <= dm.length && posAfter === 'DM',
  'TYPE: a DM\'s three archetypes, the commonest first (v127; v144: the ball-winner, the deep creator, the anchor); Deep creator, and only they (' + dc.length + ')');
ok(String(gkTypes) === 'ALL,GKAll-rounder,GKShot-stopper,GKSweeper keeper' && gkRows.length > 0 && gkStyles.every(x => x === 'shotstopper'),
  'a keeper\'s three types (v118; v144: no one-on-one keeper): Shot-stopper, and only they (' + gkRows.length + ')');
ok(String(sortOpts) === 'RATING,POTENTIAL,PRICE ▲,PRICE ▼,AGE ▲,AGE ▼' && asc(cheap.map(r => r.amt)) && desc(dear.map(r => r.amt)) && asc(ages) && desc(olds) && ages[0] < olds[0] && cheap.length === all0.length,
  'SORT: the price cheapest first and dearest first, and age youngest first and oldest first (v117: ' + ages[0] + ' to ' + olds[0] + ')');
// ...and the Free agents tab has them too (v117), its price the wage he'd ask -- sharing what's picked with the Search
await page.click('#bldgPanel .bpTab:text-is("Free agents")'); await page.waitForTimeout(80);
const faAges = async () => K(`(()=>{ const d=CAREER.data; return [...document.querySelectorAll('#bpBody .mgPaneL .mgRow')].map(r=>mgFind(d,+r.dataset.pid).p.age); })()`);
const faSort = await pick('sort', 'age'); const fa1 = await faAges(); await pick('sort', 'old'); const fa2 = await faAges();
await pick('sort', 'cheap'); const fa3 = (await rows()).map(r => r.amt); await pick('sort', 'dear'); const fa4 = (await rows()).map(r => r.amt);
const faPosOpts = await pick('mpos', 'CB'); const fa5 = await rows(); await pick('mpos', 'ALL'); await pick('sort', 'ovr');
const faAll = await K('CAREER.data.world.free.length');
info('free agents, sorted: ' + JSON.stringify({ n: faAll, young: fa1.slice(0, 4), old: fa2.slice(0, 4), wageUp: fa3.slice(0, 3), wageDown: fa4.slice(0, 3), cb: fa5.length }));
ok(String(faSort) === 'RATING,POTENTIAL,WAGE ▲,WAGE ▼,AGE ▲,AGE ▼' && fa1.length === faAll && asc(fa1) && desc(fa2) && asc(fa3) && desc(fa4) && faPosOpts.length === 10 && fa5.every(r => r.pos === 'CB'),
  'free agents: POSITION, TYPE and SORT too -- age youngest or oldest first (' + fa1[0] + ' / ' + fa2[0] + '), the wage he asks either way, CBs only (' + fa5.length + ' of ' + faAll + ')');
await page.click('#bldgPanel .bpTab:text-is("Search")'); await page.waitForTimeout(80);
ok(potKnown.slice(0, 4).every(v => v > 0) && desc(potKnown.filter(v => v > 0)) && potKnown.slice(4).every(v => v < 0) && /^POT/.test(pot[0].ovr), 'SORT POTENTIAL: the men your scouts know, best first, their potential in the list (' + pot[0].ovr + '); the rest after');
ok(inBud.length > 0 && inBud.length < all0.length && inBud.every(r => r.amt <= budNow), 'IN BUDGET: only the men you could pay for (' + inBud.length + ', all at or under ' + budNow + ')');
// the Bids tab's history (v108): the one you signed, and the one you walked away from -- and the season's count
await page.click('#bldgPanel .bpTab:text-is("Bids")'); await page.waitForTimeout(80);
const hist = await K(`(()=>{ const L=CAREER.data.bidLog||[]; return { log:L.slice(0,4).map(e=>e.name+':'+e.out), txt:document.getElementById('bpBody').textContent }; })()`);   // (all its pages)
info('the bids log: ' + JSON.stringify(hist.log) + ' -- ' + (hist.txt.match(/This season:[^·]*·[^·A-Z]*/) || [''])[0]);
ok(hist.log.includes(r.name + ':signed') && hist.log.includes(r2.name + ':walked') && /HOW THEY WENT/.test(hist.txt) && /SIGNED/.test(hist.txt) && /YOU WALKED AWAY/.test(hist.txt) && /This season: \d+ bids? · \d+ signed/.test(hist.txt),
  'the Bids tab keeps how each one went: ' + r.name + ' SIGNED, ' + r2.name + ' YOU WALKED AWAY; and the season\'s bids and signings');
await page.click('#bldgPanel .bpTopBack'); await page.waitForTimeout(60);

// --- A MAN WHO'S COME ON asks for a new deal -------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, out={}, R=d.roster.filter(p=>p.role!=='GK'&&p.age>=23), p=R[0], q=R[1];   /* (v109: the young don't ask in their first season with you) */
  for(const x of [p,q]){ x.until=d.season+2; x.ovr+=8; delete x.wantsOut; x.mor=6.5; }
  d.news=[]; mgContractAsks(d); out.asked=!!p.cAsk&&!!q.cAsk; out.news=d.news.map(n=>n.t).filter(t=>/a new deal: /.test(t)&&(t.startsWith(p.name+' ')||t.startsWith(q.name+' '))).length;   /* (theirs: another of the squad may have come on enough to ask too) */
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

// --- WHO ASKS, WHEN, AND FOR WHAT (v109): the young are modest, a man in his prime knows his worth, a fine season more so;
// the hometown hero never asks ---------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, base=d.roster.find(p=>p.role!=='GK'&&!p.loan&&!p.hometown&&!hasTrait(p,d,'loyal')), keep=JSON.parse(JSON.stringify(base)), out={};
  const at=(age,form,over)=>{ Object.assign(base,{age, ovr:70, rn:10, rs:62, goals:form?19:0, as:0, cs:0, hist:[], evs:[], until:d.season+2, since:d.season-1, loan:null});   /* (rated 70: worth hundreds a week, so the steps show through the rounding) */ delete base.cAsk; delete base.cNot; delete base.wantsOut;
    const mkt=mgMarketWage(d,base); base.wage=Math.round(mkt/over); const top0=d.news[0]; mgContractAsks(d); const P=cPush(d,base), fresh=[];
    for(const x of d.news){ if(x===top0) break; fresh.push(x); }   /* (what's new -- the news is kept to 90 -- and his: another may have asked too) */
    const his=fresh.find(x=>x.t.startsWith(base.name+' '));
    return { at:+P.at.toFixed(2), ask:+P.ask.toFixed(2), asked:!!base.cAsk, want:base.cAsk?base.cAsk.wage:null, mkt, said:his?his.t:'' }; };
  out.y20=at(20,false,1.5); out.y22=at(22,false,1.5); out.a23=at(23,false,1.5); out.p27=at(27,false,1.5); out.p27f=at(27,true,1.5); out.v32=at(32,false,1.5);
  out.p27lo=at(27,false,1.25); out.a23lo=at(23,false,1.25); out.p27flo=at(27,true,1.1);
  for(const k of Object.keys(keep)) base[k]=keep[k]; for(const k of ['cAsk','cNot']) if(!(k in keep)) delete base[k]; return out; })()`);
info('who asks (what he\'d get 50% over his wage, then 25%, then 10%): ' + JSON.stringify(Object.fromEntries(Object.entries(r).map(([k, v]) => [k, [v.at, v.ask, v.asked, v.want, v.mkt]]))));
const near = (a, b) => Math.abs(a - b) <= (b >= 1e5 ? 1e4 : b >= 1e4 ? 1e3 : b >= 1e3 ? 100 : 10) / 2 + 1;   // (wages are rounded: to $10 under $1,000, $100 under $10,000...)
ok(!r.y20.asked && r.y22.asked && near(r.y22.want, r.y22.mkt * 0.94) && r.a23.asked && near(r.a23.want, r.a23.mkt) && /would like a new deal/.test(r.y22.said),
  'the young are modest: worth half as much again as his wage, a man of 20 doesn\'t ask yet; at 22 he does -- for 6% under what he\'d get ($' + r.y22.want + ' of $' + r.y22.mkt + ')');
ok(r.p27.asked && near(r.p27.want, r.p27.mkt * 1.05) && r.p27lo.asked && !r.a23lo.asked && /knows what he.s worth/.test(r.p27.said),
  'in his prime he knows his worth: he asks sooner (a quarter over his wage at 27, not at 23) and for 5% more than it ($' + r.p27.want + ' of $' + r.p27.mkt + ')');
ok(r.p27f.asked && near(r.p27f.want, r.p27f.mkt * 1.2) && r.p27flo.asked && /fine season/.test(r.p27f.said) && r.v32.asked && near(r.v32.want, r.v32.mkt),
  'after a fine season (19 goals) sooner still -- a tenth over his wage is enough -- and for a fifth more ($' + r.p27f.want + '); a man of 32 as before ($' + r.v32.want + ')');
// the wonderkid: signs for half his wage -- worth twice that the day he signs -- and waits his first season out
r = await K(`(()=>{ const d=CAREER.data, S=d.story; S.kid=1; S.kidAsk={name:'Tobi Wonder', ovr:64, pot:88}; const err=mgSignKid(d,'CM'), k=d.roster.find(p=>p.id===S.kidId);
  delete k.cAsk; delete k.cNot; mgContractAsks(d); const first=!!k.cAsk, mkt=mgMarketWage(d,k), wage=k.wage;
  k.since=d.season-1; mgContractAsks(d); const next=k.cAsk?k.cAsk.wage:null, said=(d.news.find(x=>x.t.startsWith(k.name+' ')&&/a new deal/.test(x.t))||{t:''}).t;
  return { err, first, next, mkt, wage, said }; })()`);
ok(!r.err && !r.first && r.mkt >= r.wage * 1.6 && r.next && r.next < r.mkt && r.next >= r.wage && /would like a new deal/.test(r.said),
  'the wonderkid signs for half his wage (on $' + r.wage + ', worth $' + r.mkt + ') and doesn\'t ask in his first season; in his second he would like a new deal, for less than he could get ($' + r.next + ')');
// last season's: early in a new one it still counts, and fades as the games go by
r = await K(`(()=>{ const d=CAREER.data, base=d.roster.find(p=>p.role!=='GK'&&!p.loan&&!p.hometown), keep=JSON.parse(JSON.stringify(base));
  Object.assign(base,{age:27, rn:0, rs:0, goals:0, as:0, cs:0, evs:[], hist:[[d.season-1,'X',1,30,19,0,64,0]]}); const a=+cForm(d,base).toFixed(2);
  Object.assign(base,{rn:8, rs:52}); const b=+cForm(d,base).toFixed(2); Object.assign(base,{rn:16, rs:104}); const c=+cForm(d,base).toFixed(2);
  for(const k of Object.keys(keep)) base[k]=keep[k]; return { a, b, c }; })()`);
// what makes a fine season: against what's usual for his place -- goals for a forward, fewer for a midfielder, fewer
// still for a defender, clean sheets for a keeper or defender; a Player of the Month; not his ratings
const fine = await K(`(()=>{ const d=CAREER.data, base=d.roster.find(p=>!p.loan&&!p.hometown), keep=JSON.parse(JSON.stringify(base)), f=(role,o)=>{ Object.assign(base,{role, rn:10, rs:62, goals:0, as:0, cs:0, evs:[], hist:[]},o); return +cForm(d,base).toFixed(2); };
  const out={ att10:f('ATT',{goals:10}), att14:f('ATT',{goals:14}), att19:f('ATT',{goals:19}), mid11:f('MID',{goals:9,as:4}), def5:f('DEF',{goals:4,as:1}), def9cs:f('DEF',{cs:9}),
    gk12cs:f('GK',{cs:12}), gk20g:f('GK',{goals:20}), rated:f('MID',{rn:10, rs:80}), potm:f('MID',{evs:[[d.season,'L2 Player of the Month']]}), potmOld:f('MID',{evs:[[d.season-1,'L2 Player of the Month']]}) };
  for(const k of Object.keys(keep)) base[k]=keep[k]; return out; })()`);
info('a fine season: ' + JSON.stringify(fine));
ok(fine.att10 === 0.1 && fine.att14 === 0.5 && fine.att19 === 1 && fine.mid11 === 0.5 && fine.def5 === 0.5 && fine.def9cs === 0.5 && fine.gk12cs === 1 && fine.gk20g === 0 && fine.rated === 0 && fine.potm === 0.75 && fine.potmOld === 0,
  'a fine season is against his place in the side: a forward\'s 14 goals (10 isn\'t), a midfielder\'s 9 and 4 assists, a defender\'s 4 and 1 or 9 clean sheets, a keeper\'s clean sheets (not goals); a Player of the Month this season; not his average rating (8.0 alone counts for nothing)');
ok(r.a === 1 && r.b > 0 && r.b < r.a && r.c === 0, 'a fine season last time counts early in the next (' + r.a + '), less as this one\'s games go by (' + r.b + ' after 8), and not at all after 15 (' + r.c + ')');
// the hometown hero: comes home cheap, never asks however he plays, and renews on what he's on
r = await K(`(()=>{ const d=CAREER.data; d.story.vet=0; d.md=Math.max(d.md||0,2); mgStory(d); const v=d.roster.find(p=>p.id===d.story.vetId);
  v.until=d.season+2; v.ovr+=8; Object.assign(v,{rn:10, rs:80, goals:20, cs:12}); delete v.cAsk; delete v.cNot; mgContractAsks(d); const asked=!!v.cAsk, w0=v.wage, renew=mgRenewWage(d,v), mkt=mgMarketWage(d,v);
  const old=JSON.parse(JSON.stringify(d)), ov=old.roster.find(p=>p.id===d.story.vetId); delete ov.hometown; ov.cAsk={wage:999,wk:0}; mgMigrate(old);
  return { home:!!v.hometown, asked, w0, renew, mkt, mig:!!ov.hometown && !ov.cAsk }; })()`);
ok(r.home && !r.asked && r.renew === r.w0 && r.mkt > r.w0 * 3 && r.mig,
  'the hometown hero (on $' + r.w0 + ' a week, worth $' + r.mkt + '): eight points better and a fine season, and he never asks for a new deal; a new one keeps him on what he\'s on; a career from before has him so too');

// ...and he's never a keeper: forty homecomings, not one in goal (with a keeper one time in eight, as before v109, all forty
// would miss the goal one time in two hundred)
r = await K(`(()=>{ const d=CAREER.data, roles={}; for(let i=0;i<40;i++){ d.story.vet=0; mgStory(d); const v=d.roster.find(p=>p.id===d.story.vetId); roles[v.role]=(roles[v.role]||0)+1; mgRosterRemove(d,d.roster.indexOf(v)); } return roles; })()`);
ok(!r.GK && Object.values(r).reduce((a, b) => a + b, 0) === 40 && Object.keys(r).length >= 2, 'the hometown hero is never a keeper: forty homecomings, ' + JSON.stringify(r));

process.exitCode = rep.finish();
await browser.close();
