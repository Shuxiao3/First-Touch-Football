// FOOTBALL CLASSIC, DEADLINE DAY AND THE FANS (v105): every man's popularity (1-99, on his card: how good he is against
// his league, his season, his years, the armband, the academy, his honours; yours a fifth of the way to it each Monday, a
// new man eight under it; an honour lifts him at once); your three most popular bring more through the gate and sell the
// shirts -- paid each Monday now, not with a matchday's money (THE CLUB SHOP paper); the matchday paper (the table on the
// morning of each of your games); the dressing room, every man, each Monday; DEADLINE DAY (the winter break's Monday:
// the clubs desperate, the sellers' prices down, every bid answered there and then, a bigger club's late bid); and a
// bigger club's youngster on a buyback clause (taken back if he comes on, or the clause runs out). On a copy of the game
// that lets the test reach it.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  let INJ_OFF=false;', '  let INJ_OFF=true;');
patch('  // ===== END MANAGER CAREER', '  window.__K={ ev:s=>eval(s) };\n  // ===== END MANAGER CAREER');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-deadline-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy, papers: true });   // (it goes through the papers itself)
const { ok, info } = rep;
const K = s => page.evaluate(s => window.__K.ev(s), s);
const on = id => page.evaluate(id => document.getElementById(id).classList.contains('on'), id);
const aside = () => K(`(()=>{ const d=CAREER.data; if(d.pile) d.pile.opened=true; d.press=null; pileHide(); document.getElementById('pressModal').classList.remove('on'); return 1; })()`);
let r;
await page.emulateMedia({ reducedMotion: 'reduce' });
await page.click('#smItems [data-act="new"]'); await page.waitForTimeout(150);
await page.click('#newSlotList .slotBtn >> nth=0'); await page.waitForTimeout(100);
await page.waitForSelector('#mgrMaker.on', { timeout: 4000 });
await page.fill('#mgName', 'Ade Kowalski'); await page.fill('#mgClubIn', 'Deadline Town');
await page.click('#mgGo'); await page.waitForSelector('#careerHub.show', { timeout: 6000 });
await K(`(()=>{ const d=CAREER.data; d.story={vet:2,kid:2,phone:2}; mgMarketOpen(d); mgStoryShow(d); mgSave(d); renderHub(); return 1; })()`);

// --- POPULARITY ----------------------------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, P=d.roster.map(p=>popOf(d,p)), p=d.roster[0]; curTab.club='Squad'; openBuilding('club'); MGUI.sel=p.id; mgSide='rate'; paintBuilding();
  const el=document.querySelector('#bpBody .mgPop b'); return { P, ok:P.every(v=>Number.isInteger(v)&&v>=1&&v<=99), card:el?+el.textContent:null, want:popOf(d,p), name:p.name }; })()`);
ok(r.ok && r.card === r.want, 'every man has a popularity, 1-99 (' + r.P.join(' ') + '), on his card: ' + r.name + ' ' + r.card);
await K('hideBldg()');
r = await K(`(()=>{ const d=CAREER.data, b=Object.assign({},d.roster[1],{id:-7,role:'MID',ovr:MG_LEVEL[d.tier],goals:0,as:0,cs:0,rn:0,rs:0,fame:0,hg:0,age:25,since:d.season}), T=(o,m)=>popTarget(d,Object.assign({},b,o),d.tier,!!m);
  const t0=T({}); return { t0, up:T({ovr:b.ovr+10})-t0, goals:T({goals:4})-t0, form:T({rn:4,rs:30})-t0, hg:T({hg:1})-t0, fame:T({fame:10})-t0, young:T({age:20})-t0,
    years:T({since:d.season-2},1)-T({},1), cap:T({id:d.cap},1)-T({},1) }; })()`);
ok(r.up === 25 && r.goals === 6 && r.form === 12 && r.hg === 6 && r.fame === 10 && r.young === 4 && r.years === 6 && r.cap === 5,
  'what the fans make of a man: 2.5 a point over his league\'s level (+' + r.up + ' at ten), 1.5 a goal (+' + r.goals + ' for four), his form (+' + r.form + ' at 7.5), the academy (+' + r.hg + '), his honours (+' + r.fame + '), young and good (+' + r.young + '), his years with you (+' + r.years + ' for two), the armband (+' + r.cap + ')');
r = await K(`(()=>{ const d=CAREER.data, p=d.roster[2], t=popTarget(d,p,d.tier,true); p.pop=t-20; popWeek(d); const a=p.pop;
  const q=mgNewPlayer(d,'MID',60,24,{until:d.season+1}); mgRosterAdd(d,q); const tq=popTarget(d,q,d.tier,true), pq=q.pop; mgRosterRemove(d,d.roster.indexOf(q));
  return { moved:+(a-(t-20)).toFixed(2), pq, tq:+(tq-8).toFixed(1) }; })()`);
ok(Math.abs(r.moved - 4) < 0.11 && Math.abs(r.pq - r.tq) < 0.11, 'a man of yours goes a fifth of the way to it each Monday (20 under: +' + r.moved + '), and a new man starts eight under it (' + r.pq + ')');
r = await K(`(()=>{ const d=CAREER.data; d.potm={s:d.season, snap:{}}; for(const id of d.div[d.tier]) for(const p of mgPlayersOf(d,id)){ p.rn=0; p.rs=0; p.goals=0; }
  const me=d.roster.find(p=>!p.loan); me.rn=4; me.rs=33; me.goals=3; popOf(d,me); const p0=me.pop, f0=me.fame||0; d.wkLog={}; mgPotm(d); const potm=[+(me.pop-p0).toFixed(1), +((me.fame||0)-f0).toFixed(1), !!(d.wkLog.potm&&d.wkLog.potm.you)];
  const st=d.roster[3]; popOf(d,st); const s0=st.pop; d.press={qs:[{q:'?', a:[{t:'He’s the best I’ve worked with.', fx:{pop:[st.id,3]}}]}], i:0}; const said=pressAnswer(d,0); d.press=null;
  return { potm, press:+(st.pop-s0).toFixed(1), said }; })()`);
ok(r.potm[2] && r.potm[0] === 10 && r.potm[1] === 5 && r.press === 3 && /popularity/.test(r.said.join(' ')),
  'an honour lifts him at once: the Player of the Month +' + r.potm[0] + ' (and +' + r.potm[1] + ' to his honours, which last), the manager\'s praise at a press conference +' + r.press + ' ("' + r.said.join(' ') + '")');

// --- the fans through the gate, and the shirts -------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, keep=d.roster.map(p=>(popOf(d,p),p.pop)), f0=computeFinance(d); const T=d.roster.slice(0,3); for(const p of d.roster) p.pop=Math.min(p.pop,30); for(const p of T) p.pop=70;
  const f1=computeFinance(d), books=(mgFinanceTab(d).match(/Your stars’ draw.*?\\+(\\d+)% through the gate/)||[])[1]; const s1=shirtSales(d).wk; for(const p of d.roster) p.pop=40; const s40=shirtSales(d).wk;
  d.roster.forEach((p,i)=>p.pop=keep[i]); return { d0:f0.draw, d1:f1.draw, a0:f0.attendance/f0.draw, a1:f1.attendance, cap:f1.capacity, books, s1, s40, popF:shirtSales(d).popF }; })()`);
ok(Math.abs(r.d1 - 1.1) < 1e-9 && Math.abs(r.a1 - r.a0 * 1.1) <= 2 && r.a1 < r.cap && r.books === '10',
  'your three most popular bring people through the gate: at 70, 10% more (' + Math.round(r.a0) + ' -> ' + r.a1 + '), in the books too ("+' + r.books + '%")');
ok(r.s1 > r.s40 * 1.2, 'and sell the shirts: ' + r.s1 + ' a week with three at 70, ' + r.s40 + ' with nobody over 40');
r = await K(`(()=>{ const d=CAREER.data, f=computeFinance(d), w=applyWeek(d,{home:true}), L0=d.ledger.length, b0=d.budget, R=Math.random; Math.random=()=>0.995;
  try{ mgWeekStart(d); } finally { Math.random=R; } const x=d.pile.list.find(y=>y.k==='shirts'), best=popTop(d,1)[0];
  return { game:w.income-w.gate-w.tv, pool:f.poolWk-f.shirtWk, gain:d.budget-b0, wk:x&&x.wk, top:x&&x.top, best:best.id, ledger:d.ledger.length-L0, season:x&&x.season, title:x&&pileBody(d,x)[0], want:x&&'The club shop: +'+money(x.wk)+' in shirts this week' }; })()`);
ok(r.game === r.pool && r.wk > 0 && r.gain === r.wk && r.ledger === 0, 'the shirts aren\'t a matchday\'s money any more (a game pays the rest: ' + r.game + ') but each Monday\'s: +' + r.wk + ' into the bank as the week starts');
ok(r.title === r.want && r.top.length === 3 && r.top[0][0] === r.best && r.top[0][1] >= r.top[1][1] && r.top[1][1] >= r.top[2][1],
  'THE CLUB SHOP in the Monday papers ("' + r.title + '"): the best sellers, the most popular first (' + r.top.map(x => x[1] + '%').join(', ') + '), the season\'s shirts so far');

// --- THE MATCHDAY PAPER --------------------------------------------------------------------------------------------------------
await aside();
for(let i = 0; i < 8 && !/PLAY/.test(await page.textContent('#chBottom')); i++){ await aside(); await page.click('#chBottom [data-mg="forward"]'); await page.waitForTimeout(150); }
r = await K(`(()=>{ const d=CAREER.data, m=document.getElementById('pileModal'); return { wday:d.wday, md:d.md, kinds:pileLeft(d).map(x=>x.k), day:d.pile&&d.pile.day, modal:m.classList.contains('on'),
  stamp:(m.querySelector('.plStamp span')||{}).textContent, title:(m.querySelector('.plTitle')||{}).textContent, rows:m.querySelectorAll('.plTr').length, you:m.querySelectorAll('.plTr.you').length, opp:m.querySelectorAll('.plTr.opp').length,
  btn:document.getElementById('chBottom').textContent }; })()`);
ok(r.wday === 'sat' && r.modal && r.kinds.join() === 'table' && r.day === 'sat' && r.stamp === 'MATCHDAY' && r.rows === 14 && r.you === 1 && r.opp === 1 && /The season starts today/.test(r.title),
  'the morning of the first game: the matchday paper opens by itself -- the table (' + r.rows + ' clubs, yours and today\'s opponents marked): "' + r.title + '"');
ok(/PLAY/.test(r.btn) && /SIMULATE/.test(r.btn) && !/PAPERS/.test(r.btn), 'and the hub has PLAY and SIMULATE, as before (' + r.btn.trim() + ')');
await page.click('#pileModal .plBtns [data-pile="next"]'); await page.waitForTimeout(100);
r = await K(`(()=>{ const d=CAREER.data; return { left:pileLeft(d).length }; })()`);
ok(!(await on('pileModal')) && r.left === 0, 'NEXT: read, and gone');
r = await K(`(()=>{ const d=CAREER.data; mgPlayGame(d,null,null); d.press=null; const mon={kinds:pileLeft(d).map(x=>x.k), day:d.pile.day}; mgForward(d);
  const x=pileLeft(d)[0], was=(d.tbl0&&d.tbl0.pos)||{}, mv=x.rows.every((r,i)=>r.mv===(was[r.id]?was[r.id]-(i+1):0)), me=x.rows.findIndex(r=>r.id===d.clubId), B=pileBody(d,x);
  return { mon, k:x.k, mv, moved:x.rows.filter(r=>r.mv).length, title:B[0], gaps:pileGaps(d,x), want:ordinal(me+1)+' in '+MG_LEAGUE[d.tier]+', '+x.rows[me].pts+' point'+(x.rows[me].pts===1?'':'s'), cup:pileStamp(d,{k:'table',kind:'cup'}) }; })()`);
ok(r.mon.kinds[0] === 'mor' && r.mon.day === 'mon' && r.k === 'table' && r.mv && r.moved > 0 && r.title === r.want && /off the top|Top of the league|level on points with the top/.test(r.gaps),
  'a week on: the Monday pile, then the next matchday\'s table -- who\'s gone up or down since the last round (' + r.moved + ' clubs), "' + r.title + '", ' + r.gaps.replace(/<[^>]+>/g, ''));
ok(r.cup === 'CUP DAY', 'a cup tie\'s morning has the table too, stamped ' + r.cup);

// --- THE DRESSING ROOM, EVERY MAN, EACH MONDAY -----------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data; let n=0; do{ mgPlayGame(d,null,null); d.press=null; }while(d.wday!=='mon'&&n++<4); const x=pileLeft(d)[0]; d.pile.opened=false; renderHub(); pileShow(d,true);
  const m=document.getElementById('pileModal'), S=[...m.querySelectorAll('.plMor span')];
  return { k:x.k, all:x.all.length, n:d.roster.length, cells:S.length, sample:S.slice(0,3).map(s=>s.textContent), moods:x.all.every(([id,v])=>{ const p=d.roster.find(q=>q.id===id); return p&&Math.abs((p.mor??MOR0)-v)<0.051; }),
    sorted:x.all.every((a,i)=>!i||x.all[i-1][1]>=a[1]) }; })()`);
ok(r.k === 'mor' && r.all === r.n && r.cells === r.n && r.moods && r.sorted, 'each Monday the dressing room comes first, and every man in it: his mood and how it\'s moved (' + r.cells + ' of ' + r.n + ': ' + r.sample.join(' | ') + ')');
await aside();

// --- DEADLINE DAY --------------------------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data; let n=0; while(d.phase==='league'&&n++<80){ if(d.wday==='mon') mgForward(d); else { mgPlayGame(d,null,null); d.press=null; } } d.pile.opened=false; renderHub();
  const L=pileLeft(d), x=L.find(y=>y.k==='deadline'), B=x&&pileBody(d,x);
  return { phase:d.phase, kinds:L.map(y=>y.k), title:B&&B[0], text:B&&B[1].join(' '), warn:document.getElementById('chWarn').textContent, btns:B&&B[2].map(b=>b[0]) }; })()`);
ok(r.phase === 'winter' && r.kinds[0] === 'mor' && r.kinds[1] === 'deadline' && r.title === 'Deadline day' && /shuts tonight/.test(r.text) && /DEADLINE DAY/.test(r.warn) && r.btns.includes('TO THE MARKET'),
  'the winter break\'s Monday is DEADLINE DAY: its paper after the dressing room ("' + r.text.replace(/<[^>]+>/g, '').slice(0, 90) + '..."), on the hub too, and TO THE MARKET');
await aside();
r = await K(`(()=>{ const d=CAREER.data, c=mgAiClubs(d).filter(c=>c.tier===d.tier).sort((a,b)=>b.players.length-a.players.length)[0], p=c.players.slice().sort((a,b)=>b.ovr-a.ovr)[0];
  const a1=mgAsk(d,p,c); d.phase='league'; const a0=mgAsk(d,p,c); d.phase='winter'; return { a0, a1, r:a1/a0 }; })()`);
ok(r.r > 0.8 && r.r < 0.9, 'the sellers cut their prices: ' + r.a0 + ' in a window week, ' + r.a1 + ' on deadline day');
r = await K(`(()=>{ const d=CAREER.data; d.budget=Math.max(d.budget,5e5); const out=[];
  for(const c of mgAiClubs(d).filter(c=>c.tier===d.tier&&c.players.length>13)){ const e8=mgEight(c.players), p=c.players.find(p=>!e8.includes(p)&&!p.loan&&p.role!=='GK'); if(!p||mgWontCome(d,p)) continue;
    const res=mgBid(d,p.id,mgRound(mgAsk(d,p,c)*0.93)), B=mgBidOf(d,p.id); out.push([res.ok?'ok':res.more?'more':res.wait?'wait':'no', B&&B.st]); if(out.length>=5) break; }
  return out; })()`);
ok(r.length >= 3 && r.every(x => (x[0] === 'ok' && x[1] === 'yes') || (x[0] === 'more' && x[1] === 'more')), 'every bid you make is answered there and then: ' + r.map(x => x[0]).join(', ') + ' (no "on Monday")');
r = await K(`(()=>{ const d=CAREER.data, R=Math.random; let x; Math.random=()=>0.01; try{ x=ddDay(d); } finally { Math.random=R; }
  const o=(d.offers||[]).find(y=>y.id===x.big), p=o&&d.roster.find(q=>q.id===o.pid), c=o&&d.world.clubs[o.club], top=d.roster.filter(q=>!q.loan).sort((a,b)=>b.ovr-a.ovr).slice(0,3).map(q=>q.id);
  d.pile.list=d.pile.list.filter(y=>y.k!=='offer'); d.pile.list.push({id:++d.pileSeq,k:'offer',oid:o.id,fresh:true}); const y=d.pile.list[d.pile.list.length-1];
  return { dd:o&&o.dd, ratio:o&&o.fee/mgValue(d,p), tier:c&&c.tier, mine:d.tier, top:!!p&&top.includes(p.id), stamp:pileStamp(d,y), text:pileBody(d,y)[1].join(' ') }; })()`);
ok(r.dd && r.ratio >= 1.4 && r.tier > r.mine && r.top && r.stamp === 'A DEADLINE-DAY BID' && /gone when the window shuts/.test(r.text),
  'a bigger club comes in late for one of your best three, at ' + r.ratio.toFixed(2) + ' times his worth: "' + r.stamp + '"');
r = await K(`(()=>{ const d=CAREER.data, p=d.roster.find(q=>!q.loan&&q.role!=='GK'), R=Math.random, ask=mgValue(d,p); d.listed[p.id]=ask; const fee=prem=>{ d.offers=d.offers.filter(o=>o.pid!==p.id); Math.random=()=>0.3; try{ mgAiBids(d,1,prem); } finally { Math.random=R; } const o=d.offers.find(o=>o.pid===p.id); return o?o.fee:0; };
  const f1=fee(1), f2=fee(DD_BID); delete d.listed[p.id]; d.offers=d.offers.filter(o=>o.pid!==p.id); return { f1, f2 }; })()`);
ok(r.f1 > 0 && r.f2 / r.f1 > 1.12 && r.f2 / r.f1 < 1.28, 'the clubs are desperate: their bids a fifth dearer on deadline day (' + r.f1 + ' -> ' + r.f2 + ')');

// --- A BIGGER CLUB'S YOUNGSTER, ON A BUYBACK CLAUSE ------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data; d.budget=Math.max(d.budget,2e6); while(d.roster.length>16){ const i=d.roster.findIndex((p,j)=>!mgStarters(d).includes(p)&&!mgCanLose(d,j)); if(i<0) break; mgToFree(d,mgRosterRemove(d,i)); }
  const R=Math.random; let o=null; Math.random=()=>0.01; try{ o=wkBuyback(d); } finally { Math.random=R; } if(!o) return null; const f=mgFind(d,o.pid), c=f.club, e8=mgEight(c.players);
  window.__bb=o; return { o, tier:c.tier, mine:d.tier, age:f.p.age, eight:e8.includes(f.p), fee:mgRound(mgAsk(d,f.p,c)*BB_OFF), back:mgRound(o.fee*BB_X), season:d.season }; })()`);
ok(!!r && r.tier > r.mine && r.age <= 21 && !r.eight && r.o.fee === r.fee && r.o.back === r.back && r.o.until === r.season + 1,
  'a bigger club (' + (r && LG(r.tier)) + ') offers you a youngster it has no use for (' + (r && r.age) + ', out of its eight, ' + (r && r.o.why) + '): a fifth under its price (' + (r && r.o.fee) + '), back for twice that (' + (r && r.o.back) + ') to the end of next season');
function LG(t){ return ['', 'League 2', 'League 1', 'the Championship', 'the Premium League'][t] || t; }
r = await K(`(()=>{ const d=CAREER.data, o=window.__bb; d.pile={w:d.weeks, day:d.wday, list:[Object.assign({id:++d.pileSeq,k:'bboffer'},o)], opened:false}; renderHub(); pileShow(d,true);
  const m=document.getElementById('pileModal'); return { stamp:(m.querySelector('.plStamp span')||{}).textContent, title:(m.querySelector('.plTitle')||{}).textContent, text:m.querySelector('.plPaper').textContent, btns:[...m.querySelectorAll('.plBtns button')].map(b=>b.textContent) }; })()`);
ok(r.stamp === 'A BUYBACK DEAL' && /offer you/.test(r.title) && /buyback clause/.test(r.text) && r.btns.join() === 'SIGN HIM,NO THANKS,LATER', 'its paper: "' + r.title + '", the catch spelt out, SIGN HIM / NO THANKS / LATER');
await page.click('#pileModal [data-pile="bbsign"]'); await page.waitForTimeout(120);
r = await K(`(()=>{ const d=CAREER.data, o=window.__bb, p=d.roster.find(q=>q.id===o.pid); if(!p) return null; curTab.club='Squad'; openBuilding('club'); MGUI.sel=p.id; mgSide='deal'; paintBuilding();
  const card=document.querySelector('#bpBody .mgCard').textContent; hideBldg(); mgSide='rate'; return { bb:p.bb, card:/BUYBACK/.test(card)&&card.includes(money(o.back)) }; })()`);
ok(!!r && r.bb && r.bb.fee === (await K('window.__bb.back')) && r.card, 'SIGN HIM: he\'s yours, the clause on his card (who, for what, till when)');
r = await K(`(()=>{ const d=CAREER.data, o=window.__bb, p=d.roster.find(q=>q.id===o.pid), c=d.world.clubs[o.cid]; const quiet=bbCheck(d).length;   // (he hasn't come on: nothing)
  p.ovr=Math.max(p.bb.ovr0+4, MG_LEVEL[c.tier]-5); c.budget=Math.max(c.budget,o.back*2); while(c.players.length>=MG_MAX) c.players.pop();
  d.phase='summer'; d.day=1; const b0=d.budget, out=bbCheck(d); d.phase='winter'; const x=out[0], back=c.players.includes(p);
  return { quiet, k:x&&x.k, back, paid:d.budget-b0, want:o.back, gone:!d.roster.includes(p), title:x&&(d.pile.list.push(Object.assign({id:++d.pileSeq},x)), pileBody(d,d.pile.list[d.pile.list.length-1])[0]) }; })()`);
ok(r.quiet === 0 && r.k === 'bbback' && r.back && r.gone && r.paid === r.want, 'a window\'s start: not come on, nothing; come on, and they use it -- he goes back, and ' + r.paid + ' comes in ("' + r.title + '")');
r = await K(`(()=>{ const d=CAREER.data, p=d.roster.find(q=>!q.loan), c=mgAiClubs(d).find(c=>c.tier>d.tier); p.bb={cid:c.id, fee:1e5, until:d.season-1, ovr0:p.ovr}; const out=bbCheck(d), x=out.find(y=>y.pid===p.id);
  return { k:x&&x.k, kept:d.roster.includes(p), clause:!!p.bb }; })()`);
ok(r.k === 'bbend' && r.kept && !r.clause, 'the clause run out (to the end of last season, never used): he\'s all yours, and the papers say so');

// --- back to the league: the window's shut -------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data; mgForward(d); return { phase:d.phase, open:mgWindowOpen(d), offers:(d.offers||[]).length, dd:isDeadline(d) }; })()`);
ok(r.phase === 'league' && !r.open && r.offers === 0 && !r.dd, 'after the deadline: back to the league, the window shut, the bids gone');

process.exitCode = rep.finish() ? 1 : 0;
await browser.close();
