// FOOTBALL CLASSIC, THE BOARD, LOANS, DEALS AND MOODS (v150): the board's limit read at last -- over what it lets the club
// owe, no signings, loans or building and a word on the hub, and still over it at the season's end the board sells your
// most valuable man (never the hometown hero); it tops a short squad up to thirteen with men to make up the numbers. A
// loan costs an eighth of a man's worth up front, and a man who'd walk into your nine at least 60% of his wage. A man
// turned down twice for a new deal, if he's ambitious, asks to leave. A man's mood counts on the pitch at every point
// either side of 6.5 -- no dead zone -- through what it always came to at the steps. And a word with a man once a week.
// On a copy the test can reach.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  let INJ_OFF=false;', '  let INJ_OFF=true;');
patch('  // ===== END MANAGER CAREER', '  window.__K={ ev:s=>eval(s) };\n  // ===== END MANAGER CAREER');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-board-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
const K = s => page.evaluate(s => window.__K.ev(s), s);
await page.click('#smItems [data-act="new"]'); await page.waitForTimeout(150);
await page.click('#newSlotList .slotBtn >> nth=0'); await page.waitForTimeout(100);
await page.waitForSelector('#mgrMaker.on', { timeout: 4000 });
await page.fill('#mgName', 'Sam Okafor'); await page.fill('#mgClubIn', 'Board Town');
await page.click('#mgGo'); await page.waitForSelector('#careerHub.show', { timeout: 8000 });
await K(`(()=>{ const d=CAREER.data; d.story={vet:2,kid:2,phone:2}; mgStoryShow(d); mgMarketOpen(d); d.phase='summer'; d.day=1; mgSave(d); renderHub(); return 1; })()`);

// --- A MAN'S MOOD: a dial, not a cliff -----------------------------------------------------------------------------------------
let r = await K(`(()=>{ const at=m=>{ const x=morDeltas(m); return x?+(x.all??x.composure).toFixed(2):0; }, n=m=>{ const x=morDeltas(m); return x?(x.all!=null?'all':Object.keys(x).length):0; };
  const p=CAREER.data.roster.find(q=>q.role==='MID'), was=p.mor, ovr=m=>{ p.mor=m; return +morOvr(p).toFixed(2); }, o={ m4:ovr(4), m65:ovr(6.5), m9:ovr(9) };
  p.mor=4; const st=mgStats(p), lo=morStats(p,st), ks=Object.keys(st).filter(k=>typeof st[k]==='number'&&st[k]>=2.25), mean=+(ks.reduce((a,k)=>a+lo[k]-st[k],0)/ks.length).toFixed(2); p.mor=was;   // (those not already near the floor of 1)
  return { v:[1,1.5,2.5,3.5,4,5,6,6.5,7,8,9,9.5,10].map(at), n:[n(3),n(8)], o, mean4:mean, nk:ks.length }; })()`);
info('mood -> composure (and the rest): ' + JSON.stringify(r));
const [m1, m15, m25, m35, m4, m5, m6, m65, m7, m8, m9, m95, m10] = r.v;
ok(m1 === -2.75 && m15 === -2.5 && m25 === -2 && m35 === -1.5 && m4 === -1.25 && m5 === -0.75 && m6 === -0.25 && m65 === 0 && m8 === 0.5 && m95 === 1 && m10 === 1,
  'below settled, half a point off every attribute a point under 6.5, -2.75 at most (v170): -0.75 at 5, -1.25 at 4, -1.5 at 3.5, -2.75 at 1 (v150-v169: -0.25, -0.42, -0.5, -1.5); above, as it was, +0.5 at 8 and +1 at 9.5 and over; nothing at 6.5');
ok(m7 > 0 && m9 > 0 && m7 < m8 && m8 < m9 && r.n[0] === 'all' && r.n[1] === 3 && r.o.m4 <= -10 && r.o.m9 > 0 && r.o.m65 === 0,
  'and every point between counts -- no dead zone: ' + [4, 5, 6, 7, 9].map((m, i) => m + ': ' + [m4, m5, m6, m7, m9][i]).join(', ') + '; below settled every attribute he has (v170: it was his stamina, both composures and both IQs), above his stamina and both composures; a midfielder at 4 rates ' + r.o.m4 + ' (v169: -1), at 9 +' + r.o.m9);
ok(Math.abs(r.mean4 + 1.25) < 0.01 && r.o.m4 <= -10 && r.o.m4 >= -16, 'a man at 4: each of his ' + r.nk + ' attributes off the floor 1.25 under what it is (' + r.mean4 + '), his rating ' + r.o.m4 + ' -- on the attributes\' scale 1.25 under his card\'s (the handoff\'s M1)');

// --- A WORD WITH HIM: once a week --------------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, p=d.roster[2]; p.mor=3; const a=mgTalk(d,p), m1=p.mor, b=mgTalk(d,p), m2=p.mor; d.weeks=(d.weeks||0)+1; const c=mgTalk(d,p), m3=p.mor; return { a:a[0], b, m:[3,m1,m2,m3], c:c[0] }; })()`);
ok(r.m[1] > 3 && r.m[2] === r.m[1] && r.b.length === 1 && /spoken to him this week/.test(r.b[0]) && r.m[3] > r.m[2],
  'a word with a man lifts him (3 -> ' + r.m[1] + '); a second the same week: "' + r.b[0] + '" and nothing; the next week, again (' + r.m[3] + ')');

// --- TURNED DOWN TWICE ----------------------------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, A=d.roster[3], B=d.roster[4], am=(p,v)=>{ if(!p.hv) p.hv=hvMake(p); const h=typeof p.hv==='string'?p.hv.split(''):p.hv.slice(); h[HV_KEYS.indexOf('am')]=devEnc(v); p.hv=typeof p.hv==='string'?h.join(''):h; };
  am(A,8); am(B,4); const ask=p=>{ p.cAsk={wage:p.wage*2,wk:d.weeks||0}; delete p.cNot; };
  ask(A); mgContractNo(d,A.id); const a1=!!A.wantsOut, ma=A.mor; ask(A); mgContractNo(d,A.id); const a2=!!A.wantsOut;
  ask(B); const mb0=B.mor; mgContractNo(d,B.id); ask(B); mgContractNo(d,B.id); const b2=!!B.wantsOut, mb=B.mor;
  // a new deal between the noes forgets them
  const C=d.roster[5]; am(C,9); ask(C); mgContractNo(d,C.id); delete C.cAsk; mgRenew(d,d.roster.indexOf(C),2); ask(C); mgContractNo(d,C.id); const c2=!!C.wantsOut;
  const news=d.news.slice(0,8).map(n=>n.t).find(t=>/twice he asked/.test(t))||'';
  return { a1, a2, b2, mb:[mb0,mb], c2, news }; })()`);
ok(!r.a1 && r.a2 && !r.b2 && r.mb[1] <= r.mb[0] - 2 && !r.c2 && /twice he asked for what he’s worth/.test(r.news),
  'an ambitious man told NOT NOW twice asks to leave ("' + r.news + '"); one who isn\'t sulks a point each time (' + r.mb.join(' -> ') + '); a new deal between the noes forgets them');

// --- A LOAN'S FEE --------------------------------------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data; d.budget=50e6; const clubs=mgAiClubs(d).filter(c=>c.tier===d.tier+1&&c.players.length>MG_MIN+1);
  let p=null, c=null; for(const k of clubs){ const e=mgEight(k.players); const q=k.players.find(x=>!e.includes(x)&&x.role!=='GK'&&!mgLoanWhy(d,x,k)); if(q){ p=q; c=k; break; } }
  if(!p) return null; const fee=mgLoanFee(d,p), v=mgValue(d,p), share=mgLoanShare(d,p,c), w=p.wage, nine=mgEight(d.roster), worst=Math.min(...nine.map(q=>q.ovr));
  const b0=d.budget, cb0=c.budget, err=mgLoanIn(d,p.id), paid=b0-d.budget, got=c.budget-cb0;
  // what a season of him costs: the loan (its fee and his share of the wage) against buying him (their price and his wage)
  const loanCost=fee+Math.round(w*share)*26, buy=mgAsk(d,p,c)+mgDemand(d,p,true)*26;
  return { err, fee, v, paid, got, share, into:p.ovr>worst, ovr:p.ovr, worst, ratio:+(loanCost/buy).toFixed(2), was:+((Math.round(w*clamp(Math.round((0.45+0.05*(p.ovr-MG_LEVEL[c.tier]))*20)/20,0.3,1))*26)/buy).toFixed(2) }; })()`);
info('a loan: ' + JSON.stringify(r));
ok(r && r.err === null && Math.abs(r.fee / r.v - 0.125) < 0.02 && r.paid === r.fee && r.got === r.fee && (!r.into || r.share >= 0.6),
  'a loan: ' + (r && ('$' + r.fee.toLocaleString() + ' up front -- an eighth of his worth ($' + r.v.toLocaleString() + ') -- to his club; ' + Math.round(r.share * 100) + '% of his wage' + (r.into ? ' (he\'d walk into your nine: 60% at least)' : '') + '; a season of him on loan ' + Math.round(r.ratio * 100) + '% of a season\'s buying (their price and his wage; ' + Math.round(r.was * 100) + '% before)')));
r = await K(`(()=>{ const d=CAREER.data, clubs=mgAiClubs(d).filter(c=>c.tier===d.tier+1);
  let p=null, c=null; for(const k of clubs){ const e=mgEight(k.players); const q=k.players.find(x=>!e.includes(x)&&x.role!=='GK'&&!mgLoanWhy(d,x,k)); if(q){ p=q; c=k; break; } }
  d.budget=1000; const poor=mgLoanIn(d,p.id); d.budget=-debtLimitOf(d)-1; const over=mgLoanIn(d,p.id); d.budget=50e6; return { poor, over }; })()`);
ok(/costs \$[\d,]+ up front/.test(r.poor) && /board won’t let you spend/.test(r.over), 'without the money: "' + r.poor + '"; over the board\'s limit: "' + r.over + '"');

// --- THE BOARD'S LIMIT ------------------------------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, lim=debtLimitOf(d); d.budget=-lim+50000; renderHub(); const red=document.getElementById('chWarn').innerText, b1=bldUp(d,'physio');
  d.budget=-lim-200000; renderHub(); const over=document.getElementById('chWarn').innerText, b2=bldUp(d,'physio'), s2=stadUpgrade(d);
  const club=mgAiClubs(d).find(c=>c.tier===d.tier), q=club.players[0], bid=mgBid(d,q.id,mgAsk(d,q,club));
  return { lim, red, over, b1, b2, s2, bid:bid&&bid.msg }; })()`);
info('the limit: ' + JSON.stringify(r));
ok(r.lim === 150000 && /IN THE RED/.test(r.red) && /THE BOARD: \$200,000 over/.test(r.over) && /board won’t let you spend/.test(r.b2) && /board won’t let you spend/.test(r.s2) && /in the red/.test(r.bid),
  'Division 2\'s limit $150,000: in the red but inside it, IN THE RED as before; $200,000 over it, the board says so on the hub ("' + r.over.split('·')[0].trim().slice(0, 80) + '...") and no building ("' + r.b2 + '") or signing');
r = await K(`(()=>{ const d=CAREER.data, lim=debtLimitOf(d), hero=mgNewPlayer(d,'ATT',79,34,{until:d.season+1}); hero.hometown=true; mgRosterAdd(d,hero);
  const L=d.roster.filter(p=>!p.hometown&&!p.loan).sort((a,b)=>mgValue(d,b)-mgValue(d,a)), top=L[0], v=mgValue(d,top), n0=d.roster.length;
  d.budget=-lim-v*2; const b0=d.budget, sold=boardSale(d);
  const gone=!d.roster.includes(top), heroStays=d.roster.includes(hero), at=Object.values(d.world.clubs).find(c=>(c.players||[]).includes(top));
  d.budget=1e6; const none=boardSale(d);
  return { sold, gone, heroStays, at:at&&at.name, up:d.budget, paid:sold?sold.fee:0, v, n:[n0,d.roster.length], none }; })()`);
ok(r.sold && r.gone && r.heroStays && r.paid === r.v && !!r.at && r.none === null,
  'still over it at the season\'s end: the board sells the most valuable man (' + (r.sold && r.sold.name) + ' to ' + r.at + ' for $' + r.paid.toLocaleString() + ') -- never the hometown hero -- and inside the limit, nobody');

// --- THE BOARD TOPS UP A SHORT SQUAD -----------------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data; d.roster=d.roster.filter(p=>!p.hometown).slice(0,10); const n0=d.roster.length, ids=new Set(d.roster.map(p=>p.id)); mgTopUpYours(d);
  const added=d.roster.filter(p=>!ids.has(p.id)); return { n0, n:d.roster.length, ovrs:added.map(p=>p.ovr), lvl:MG_LEVEL[d.tier] }; })()`);
ok(r.n === 13 && r.ovrs.every(o => o <= r.lvl - 4), 'a squad of ' + r.n0 + ': the board signs three to make thirteen, no more -- men to make up the numbers (rated ' + r.ovrs.join(', ') + ', Division 2\'s level ' + r.lvl + ')');

process.exitCode = rep.finish();
await browser.close();
