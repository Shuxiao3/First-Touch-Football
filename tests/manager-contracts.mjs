// FOOTBALL CLASSIC, CONTRACTS (v110). CONTRACT TALKS: offer a man less than he asks, or a longer deal for less. The least
// he'd take is his ask less his give -- the young the most, a man after a fine season the least; a happy man a little more,
// an unhappy one less; a longer deal worth more to an older man -- and never under what he's on when he's worth more. At it
// or over, he signs for what you offered; a little under, he comes back with a figure (MEET IT); further under, or under
// it twice, he walks out (a point off his mood, no talk of terms for four weeks, and if he was asking he stops). On his
// card (OR OFFER − / +, OFFER, MEET IT) and on his paper. DEALS RUNNING OUT: a paper of your men whose deals end with the
// season -- at the winter break, in the league's last four weeks and through the playoffs -- RENEW, LET GO, or TALK TERMS
// on his card. THE GOLDEN BOOT won by one of yours: the league's prize, on the summer's first paper. And the youngsters a
// new world is made with. On a copy of the game that lets the test reach it.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  let INJ_OFF=false;', '  let INJ_OFF=true;');
patch('  // ===== END MANAGER CAREER', '  window.__K={ ev:s=>eval(s) };\n  // ===== END MANAGER CAREER');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-contracts-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy, papers: true });
const { ok, info } = rep;
const K = s => page.evaluate(s => window.__K.ev(s), s);
const top = () => page.innerText('#pileModal .plPaper').catch(() => '');
// through the pile (NEXT, or LATER for a decision) till the paper on top says `re` -- each click waits for the page to turn
const toPaper = async re => { for(let i = 0; i < 16; i++){ const t = await top(); if(re.test(t)) return true; const b = await page.$('#pileModal .plBtns [data-pile="next"]') || await page.$('#pileModal .plBtns [data-pile="later"]'); if(!b) return false; await b.click();
  for(let w = 0; w < 30 && (await top()) === t; w++) await page.waitForTimeout(50); } return false; };
const click = async sel => { await page.click(sel); await page.waitForTimeout(90); };
let r;
await page.emulateMedia({ reducedMotion: 'reduce' });
await page.click('#smItems [data-act="new"]'); await page.waitForTimeout(150);
await page.click('#newSlotList .slotBtn >> nth=0'); await page.waitForTimeout(100);
await page.waitForSelector('#mgrMaker.on', { timeout: 4000 });
await page.fill('#mgName', 'Ade Moss'); await page.fill('#mgClubIn', 'Contract Town');
await page.click('#mgGo'); await page.waitForSelector('#careerHub.show', { timeout: 6000 }); await page.waitForTimeout(150);
await K(`(()=>{ const d=CAREER.data; d.story={vet:2,kid:2,phone:2}; mgStoryShow(d); pileHide();
  window.HV=(o)=>{ const k=['lr','pro','ad','rs','du','ch','te','am','lo'], v=Object.assign({lr:5.5,pro:5.5,ad:5.5,rs:5.5,du:5.5,ch:5.5,te:5.5,am:5.5,lo:5.5},o); return k.map(x=>devEnc(v[x])).join(''); };
  // a man made plain for a test: rated 65 (worth hundreds a week -- v120's wages: a 70 is near a thousand), no traits, settled, no season to speak of, two seasons left
  window.PLAIN=(p,o)=>Object.assign(p,{ovr:65, mor:6, hv:HV({}), rn:10, rs:62, goals:0, as:0, cs:0, hist:[], evs:[], since:d.season-1, until:d.season+1, wage:100, age:27},o||{});
  for(const p of d.roster){ delete p.cAsk; delete p.cTalk; delete p.cTalkNo; delete p.cNot; delete p.wantsOut; }
  return 1; })()`);

// --- THE YOUNGSTERS a new world is made with ------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, all=Object.values(d.world.clubs).flatMap(c=>c.players).concat(d.roster), y=all.filter(p=>p.age<=22).length;
  return { mine:d.roster.filter(p=>p.age<=22).length, n:d.roster.length, share:+(y/all.length).toFixed(2), men:all.length, min:Math.min(...all.map(p=>p.age)), kids:all.filter(p=>p.age===17).length }; })()`);
info('the youngsters: ' + JSON.stringify(r));
ok(r.share >= 0.22 && r.share <= 0.38 && r.min === 17 && r.kids > 0,
  'a new world: about three in ten of its men 22 or under (' + Math.round(r.share * 100) + '% of ' + r.men + ', some of 17; it was one in ten); ' + r.mine + ' of your ' + r.n);

// --- THE LEAST HE'D TAKE: his ask less his give -----------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, p=d.roster.find(q=>q.role!=='GK'&&!q.loan), keep=JSON.parse(JSON.stringify(p));
  const fl=(o,y)=>{ PLAIN(p,o); const a=mgRenewWage(d,p); return +(cFloor(d,p,y||2)/a).toFixed(3); };
  const out={ y20:fl({age:20}), y22:fl({age:22}), a27:fl({age:27}), f27:fl({age:27,goals:19}), happy:fl({age:27,mor:8}), sour:fl({age:27,mor:3}),
    v32y4:fl({age:32},4), v32y1:fl({age:32},1), a27y4:fl({age:27},4), y20y4:fl({age:20},4) };
  PLAIN(p,{age:20}); p.wage=mgRound(mgRenewWage(d,p)*0.97); out.onWage=+(cFloor(d,p,2)/p.wage).toFixed(3);
  for(const k of Object.keys(keep)) p[k]=keep[k]; return out; })()`);
info('the least he\'d take, against his ask: ' + JSON.stringify(r));
const near = (x, y) => Math.abs(x - y) <= 0.015;
ok(near(r.y20, 0.85) && near(r.y22, 0.90) && near(r.a27, 0.95) && near(r.f27, 0.98),
  'the young give the most: at 20 he\'d take ' + r.y20 + ' of his ask, at 22 ' + r.y22 + '; at 27 ' + r.a27 + '; after a fine season (19 goals) ' + r.f27);
ok(near(r.happy, 0.92) && near(r.sour, 0.99), 'a happy man gives a little more (' + r.happy + '), an unhappy one less (' + r.sour + ')');
ok(near(r.v32y4, 0.83) && r.v32y1 === 1 && near(r.a27y4, 0.89) && near(r.y20y4, 0.83) && r.onWage === 1,
  'a longer deal for less: four seasons at 32 and he\'d take ' + r.v32y4 + ', at 27 ' + r.a27y4 + ', at 20 ' + r.y20y4 + '; one season at 32, nothing under his ask; and never under what he\'s on when he\'s worth more');

// --- WHAT HE SAYS: he signs, he comes back with a figure, or he walks out ----------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, R=d.roster.filter(q=>q.role!=='GK'&&!q.loan), out={};
  const a=PLAIN(R[0]), askA=mgRenewWage(d,a), flA=cFloor(d,a,3), m0=a.mor, ra=mgOffer(d,a.id,flA,3);
  out.take={ ok:!!ra.ok, wage:a.wage, fl:flA, ask:askA, seasons:a.until-d.season, mor:+(a.mor-m0).toFixed(2) };
  const b=PLAIN(R[1]), askB=mgRenewWage(d,b), flB=cFloor(d,b,2), rb=mgOffer(d,b.id,mgRound(flB-askB*0.04),2);
  out.counter={ c:rb.counter, fl:flB, ask:askB, mid:mgRound(flB+(askB-flB)/2), talk:!!cTalkOf(d,b) };
  const em=mgMeetC(d,b.id); out.meet={ err:em, wage:b.wage, seasons:b.until-d.season, talk:!!b.cTalk };
  const c=PLAIN(R[2]), askC=mgRenewWage(d,c), flC=cFloor(d,c,2), m1=c.mor, r1=mgOffer(d,c.id,mgRound(flC-askC*0.04),2), r2=mgOffer(d,c.id,mgRound(flC-askC*0.04),2);
  out.twice={ first:r1.counter, sulk:!!r2.sulk, mor:+(c.mor-m1).toFixed(2), ban:cTalkBan(d,c), wage:c.wage };
  const e=PLAIN(R[3]); e.cAsk={wage:mgRenewWage(d,e),wk:d.weeks||0}; const n0=d.news[0], m2=e.mor, re=mgOffer(d,e.id,mgRound(mgRenewWage(d,e)*0.7),2), fresh=[]; for(const x of d.news){ if(x===n0) break; fresh.push(x.t); }
  const mor=+(e.mor-m2).toFixed(2), asking=!!e.cAsk, cNot=e.cNot-(d.weeks||0), ban=cTalkBan(d,e), again=mgOffer(d,e.id,mgRenewWage(d,e),2), full=mgRenew(d,d.roster.indexOf(e),2);
  out.insult={ sulk:!!re.sulk, mor, asking, cNot, ban, news:fresh.find(t=>/insult/.test(t))||'', again:again.msg||'', full, wage:e.wage, ask:mgRenewWage(d,e) };
  return out; })()`);
info('talks: ' + JSON.stringify(r));
ok(r.take.ok && r.take.wage === r.take.fl && r.take.fl < r.take.ask && r.take.seasons === 3 && r.take.mor === 0.25,
  'at the least he\'d take (a three-season deal, $' + r.take.fl + ' of his $' + r.take.ask + '): he signs for it, to three seasons on -- pleased, if less than if he\'d had his ask');
ok(r.counter.c === r.counter.mid && r.counter.c > r.counter.fl && r.counter.c < r.counter.ask && r.counter.talk && !r.meet.err && r.meet.wage === r.counter.c && r.meet.seasons === 2 && !r.meet.talk,
  'a little under it: he comes back halfway to his ask ($' + r.counter.c + ': the least he\'d take $' + r.counter.fl + ', his ask $' + r.counter.ask + '); MEET IT and he signs for that');
ok(r.twice.first && r.twice.sulk && r.twice.mor === -1 && r.twice.ban === 4 && r.twice.wage === 100,
  'under it again after his figure: he\'s had enough -- a point off his mood, no talk of terms for four weeks, his deal as it was');
ok(r.insult.sulk && r.insult.mor === -1 && !r.insult.asking && r.insult.cNot === 8 && r.insult.ban === 4 && /took that as an insult/.test(r.insult.news) && /won’t talk terms for 4 more weeks/.test(r.insult.again) && r.insult.full === null && r.insult.wage === r.insult.ask,
  'far under (70% of his ask, while he was asking): an insult -- he stops asking (for eight weeks), no talk of terms for four (' + r.insult.again + '); his ask in full still signs him');

// --- ON HIS CARD: OR OFFER − / +, OFFER, MEET IT ------------------------------------------------------------------------------
const card = async pid => { await K(`(()=>{ pileHide(); curTab.club='Squad'; openBuilding('club'); MGUI.sel=${pid}; MGUI.offer=null; MGUI.msg=''; mgSide='deal'; paintBuilding(); return 1; })()`); await page.waitForTimeout(150); };   // (his card's deal side)
const cardTxt = () => page.textContent('#bpBody');
const ids = await K(`(()=>{ const d=CAREER.data, R=d.roster.filter(q=>q.role!=='GK'&&!q.loan); PLAIN(R[4],{age:20}); PLAIN(R[5],{age:27,goals:19}); PLAIN(R[6],{age:27}); return [R[4].id,R[5].id,R[6].id]; })()`);
const dealBtn = () => page.$eval('#bpBody [data-mg="renew"], #bpBody [data-mg="offer"], #bpBody [data-mg="meetc"]', b => b.textContent.trim()).catch(() => '');
await card(ids[0]);
let t0 = await cardTxt(); const b0 = await dealBtn();
const askY = await K(`mgRenewWage(CAREER.data, CAREER.data.roster.find(p=>p.id===${ids[0]}))`);
await click('#bpBody [data-mg="ofr"][data-dir="-1"]');
const stepped = await K(`MGUI.offer&&MGUI.offer.w`), b1 = await dealBtn();
await click('#bpBody [data-mg="offer"]');
r = await K(`(()=>{ const d=CAREER.data, p=d.roster.find(q=>q.id===${ids[0]}); return { wage:p.wage, msg:MGUI.msg, until:p.until-d.season }; })()`);
ok(/NEW DEAL/.test(t0) && t0.includes('$' + askY.toLocaleString('en-US') + '/wk') && b0 === 'AGREE' && b1 === 'OFFER' && stepped < askY && r.wage === stepped && /signs for/.test(r.msg),
  'his card: the wage in his NEW DEAL row at his ask ($' + askY + ', AGREE); − takes it down ($' + stepped + ') and it\'s OFFER; a lad of 20 signs for it ("' + r.msg + '")');
await card(ids[1]);
await click('#bpBody [data-mg="ofr"][data-dir="-1"]'); await click('#bpBody [data-mg="offer"]');
const t1 = await cardTxt(); const msg1 = await K('MGUI.msg');
const hasMeet = !!(await page.$('#bpBody [data-mg="meetc"]'));
await click('#bpBody [data-mg="meetc"]');
r = await K(`(()=>{ const d=CAREER.data, p=d.roster.find(q=>q.id===${ids[1]}); return { wage:p.wage, ask:mgRenewWage(d,p), msg:MGUI.msg, talk:!!p.cTalk }; })()`);
ok(/comes back: he’ll sign for/.test(msg1) && /HE’LL SIGN FOR/.test(t1) && hasMeet && r.wage < r.ask && r.wage > 100 && !r.talk && /signed a new deal/.test(r.msg),
  'after a fine season, 5% under his ask: he comes back with a figure (HE’LL SIGN FOR on his card), and MEET IT signs him for it ($' + r.wage + ' of $' + r.ask + ')');
await card(ids[2]);
for(let i = 0; i < 7; i++) await click('#bpBody [data-mg="ofr"][data-dir="-1"]');
await click('#bpBody [data-mg="offer"]');
const t2 = await cardTxt(), noOffer = !(await page.$('#bpBody [data-mg="offer"]')) && !(await page.$('#bpBody [data-mg="ofr"]')), msg2 = await K('MGUI.msg'), b2 = await dealBtn();
ok(/insult/.test(msg2) && /NO TALKS 4 WK/.test(t2) && noOffer && b2 === 'AGREE',
  'seven steps down (65% of his ask): an insult -- NO TALKS 4 WK on his card, his ask fixed (AGREE still there), no − / + or OFFER till then');
await K(`(()=>{ hideBldg(); return 1; })()`).catch(() => {});

// --- ON HIS PAPER: a man asking, OR OFFER on the paper; a figure, MEET IT ----------------------------------------------------
await K(`(()=>{ const d=CAREER.data, R=d.roster.filter(q=>q.role!=='GK'&&!q.loan), p=PLAIN(R[7],{age:27,goals:19}); p.cAsk={wage:mgRenewWage(d,p),wk:d.weeks||0}; window.ASKER=p.id;
  d.offers=[]; d.spOff=[]; d.bids=[]; d.wday='mon'; d.phase='league'; d.md=5; MGUI.offer=null; MGUI.years=2; pileBuild(d,{dev:null}); d.pile.opened=false; mgSave(d); renderHub(); pileShow(d,true); return 1; })()`);
await page.waitForTimeout(120);
const onIt = await toPaper(/wants a new deal/);
const p0 = await top();
const btns0 = await page.$$eval('#pileModal .plBtns button', ns => ns.map(n => n.textContent.trim()));
await click('#pileModal [data-pile="ofr"][data-dir="-1"]');
const p1 = await top();
await click('#pileModal .plBtns [data-pile="offer"]');
const p2 = await top(), btns2 = await page.$$eval('#pileModal .plBtns button', ns => ns.map(n => n.textContent.trim()));
await click('#pileModal .plBtns [data-pile="meetc"]');
r = await K(`(()=>{ const d=CAREER.data, p=d.roster.find(q=>q.id===ASKER); return { wage:p.wage, ask:mgRenewWage(d,p), asking:!!p.cAsk, live:pileLeft(d).some(x=>x.k==='contract'&&x.pid===p.id) }; })()`);
info('his paper: ' + JSON.stringify({ p0: p0.split('\n').slice(0, 4), btns0, p2: p2.split('\n').slice(-3), btns2 }));
ok(onIt && /OR OFFER/.test(p0) && /won’t go far under it/.test(p0) && btns0.join() === 'GIVE IT HIM,OFFER,NOT NOW,LATER' && p1 !== p0,
  'his paper (A NEW DEAL): what he asks, a word on how far he\'d go ("After a season like his, he won’t go far under it."), OR OFFER − / +; GIVE IT HIM, OFFER, NOT NOW');
ok(/He’ll sign for \$[\d,]+ a week/.test(p2) && btns2[0] === 'MEET IT' && !r.asking && !r.live && r.wage < r.ask,
  'OFFER a step under: "He’ll sign for $..." and MEET IT in place of GIVE IT HIM; met, he\'s signed ($' + r.wage + ' of $' + r.ask + ') and the paper\'s done');

// --- DEALS RUNNING OUT ----------------------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, due={}; for(const [ph,md] of [['summer',0],['league',10],['winter',13],['league',21],['league',22],['playoffs',26]]){ d.phase=ph; d.md=md; due[ph+md]=pileEndingDue(d); }
  for(const p of d.roster){ p.until=d.season+1; delete p.cGo; delete p.cAsk; delete p.cTalk; delete p.cTalkNo; delete p.wantsOut; }
  const E=d.roster.filter(p=>!p.loan).slice(0,3); for(const p of E){ p.until=d.season; p.hv=HV({}); } window.ENDS=E.map(p=>p.id);
  d.offers=[]; d.spOff=[]; d.bids=[]; d.phase='league'; d.md=22; d.wday='mon'; MGUI.years=2; pileBuild(d,{dev:null}); d.pile.opened=false; mgSave(d); renderHub(); pileShow(d,true);
  return { due, n:pileLeft(d).filter(x=>x.k==='ending').length }; })()`);
await page.waitForTimeout(120);
const onEnd = await toPaper(/DEALS RUNNING OUT/);
const e0 = await top();
const rows0 = await page.$$eval('#pileModal .plRow', ns => ns.length), eb = await page.$$eval('#pileModal .plBtns button', ns => ns.map(n => n.textContent.trim()));
const ends = await K('ENDS');
info('deals running out: ' + JSON.stringify({ due: r.due, n: r.n, onEnd, e0: e0.split('\n').slice(0, 5), rows0 }));
ok(r.due.winter13 && r.due.league22 && r.due.playoffs26 && !r.due.summer0 && !r.due.league10 && !r.due.league21 && onEnd && /3 deals end with this season/.test(e0) && rows0 === 3 && eb.includes('TALK TERMS'),
  'DEALS RUNNING OUT: at the winter break, in the league\'s last four weeks and the playoffs (not before) -- "3 deals end with this season", a row each with RENEW and LET GO, and TALK TERMS');
await click(`#pileModal [data-pile="erenew"][data-pid="${ends[0]}"]`);
await click(`#pileModal [data-pile="ego"][data-pid="${ends[1]}"]`);
const e1 = await top(), rows1 = await page.$$eval('#pileModal .plRow', ns => ns.length);
r = await K(`(()=>{ const d=CAREER.data, a=d.roster.find(p=>p.id===ENDS[0]), b=d.roster.find(p=>p.id===ENDS[1]); return { renewed:a.until-d.season, wage:a.wage, ask:mgRenewWage(d,a), gone:b.cGo===d.season, news:d.news.slice(0,3).map(n=>n.t), left:mgEnding(d).map(p=>p.id) }; })()`);
ok(r.renewed === 2 && r.wage === r.ask && r.gone && r.news.some(t => /will leave when his deal ends/.test(t)) && rows1 === 1 && /A deal ends with this season/.test(e1) && r.left.length === 1 && r.left[0] === ends[2],
  'RENEW: a new deal at what he asks, two seasons on; LET GO: he\'ll leave when his deal ends (the news says so); each off the paper, one left');
await click('#pileModal .plBtns [data-pile="eterms"]');
await page.waitForSelector('#bldgPanel.show', { timeout: 2000 });
r = await K(`(()=>{ const d=CAREER.data; return { sel:MGUI.sel, tab:curTab.club, card:document.getElementById('bpBody').textContent, ofr:!!document.querySelector('#bpBody [data-mg="ofr"]'), live:pileLeft(d).some(x=>x.k==='ending') }; })()`);
ok(r.sel === ends[2] && r.tab === 'Squad' && r.ofr && /NEW DEAL/.test(r.card) && /ends now/.test(r.card) && r.live,
  'TALK TERMS: to his card in the clubhouse, its deal side (his deal "ends now", the wage in his NEW DEAL row to step down); the paper waits for him');
await K(`(()=>{ hideBldg(); return 1; })()`).catch(() => {});

// --- THE GOLDEN BOOT, one of yours: the league's prize, and on the summer's first paper ----------------------------------------
r = await K(`(()=>{ const d=CAREER.data, p=d.roster.find(q=>q.role==='ATT')||d.roster.find(q=>q.role!=='GK'); p.goals=99; p.as=0; p.rn=20; p.rs=110; const b0=d.budget, R={};
  d.wkLog={}; mgSeasonStory(d,R); const g=(wkLog(d).gold||{}).boot;
  d.offers=[]; d.spOff=[]; d.bids=[]; d.phase='summer'; d.md=0; d.wday='mon'; pileBuild(d,{dev:null}); d.pile.opened=false; renderHub(); pileShow(d,true);
  return { name:p.name, aw:(R.awards.find(a=>a.t==='Golden Boot')||{}).name, you:g&&g.you, prize:g&&g.prize, fans:g&&g.fans, exp:POTM_PRIZE[d.tier]*2, db:d.budget-b0,
    news:d.news.slice(0,8).map(n=>n.t).find(t=>/Golden Boot\\./.test(t))||'', ev:p.evs.map(e=>e[1]) }; })()`);
await page.waitForTimeout(120);
const onGold = await toPaper(/Golden Boot/);
const g0 = await top();
ok(r.aw === r.name && r.you && r.prize === r.exp && r.db >= r.prize && r.fans > 0 && /The league pays .+ for .+’s Golden Boot\./.test(r.news) && r.ev.includes('L2 Golden Boot')
  && onGold && /THE LEAGUE/.test(g0) && /Yours!/.test(g0) && /The Golden Boot/.test(g0) && new RegExp(r.name).test(g0) && /99 goals/.test(g0),
  'the Golden Boot, one of yours (99 goals): the league pays twice a Player of the Month\'s prize ($' + r.prize + ') and the fans come (+' + r.fans + '); on his record, in the news, and on the summer\'s first paper (THE LEAGUE: "Yours! The Golden Boot ...")');

// --- on a phone held sideways: the new papers fit (a man mid-talks, five deals running out, the summer's gold) ------------------
await page.setViewportSize({ width: 844, height: 390 });
r = await K(`(()=>{ const d=CAREER.data, R=d.roster.filter(q=>q.role!=='GK'&&!q.loan); for(const p of d.roster){ p.until=d.season+1; delete p.cGo; delete p.cAsk; delete p.cTalk; delete p.cTalkNo; }
  const a=PLAIN(R[8]||R[0],{age:27,goals:19}); a.cAsk={wage:mgRenewWage(d,a),wk:d.weeks||0}; a.cTalk={cnt:mgRenewWage(d,a)-10,y:2,wk:d.weeks||0};
  for(const p of d.roster.filter(q=>!q.loan&&q!==a).slice(0,5)) p.until=d.season;
  d.offers=[]; d.spOff=[]; d.bids=[]; d.phase='league'; d.md=23; d.wday='mon';
  wkLog(d).gold={boot:{pid:a.id,name:a.name,club:d.clubName,n:21,you:true,prize:5000,fans:40},glove:{pid:0,name:'Ivo Keeper',club:'Elsewhere Town',n:12,you:false}};
  pileBuild(d,{dev:null}); d.pile.opened=false; renderHub(); pileShow(d,true); return pileLeft(d).map(x=>x.k); })()`);
await page.waitForTimeout(150);
const fits = [], seen = [];
for(let i = 0; i < 10 && await page.evaluate(() => document.getElementById('pileModal').classList.contains('on')); i++){
  const f = await page.evaluate(() => { const c = document.querySelector('#pileModal .pileCard').getBoundingClientRect(), bs = [...document.querySelectorAll('#pileModal .plBtns button, #pileModal .plPaper button')].map(b => b.getBoundingClientRect());
    return { k: (document.querySelector('#pileModal .plPaper').innerText.split('\n')[0] || '').trim(), ok: c.top >= 0 && c.bottom <= innerHeight && bs.every(b => b.bottom <= innerHeight && b.right <= innerWidth && b.width > 0) }; });
  fits.push(f.ok); seen.push(f.k);
  const t = await top(), b = await page.$('#pileModal .plBtns [data-pile="next"]') || await page.$('#pileModal .plBtns [data-pile="later"]'); if(!b) break; await b.click();
  for(let w = 0; w < 30 && (await top()) === t; w++) await page.waitForTimeout(50);
  if(seen.length > 1 && seen[0] === f.k && i > 0) break; }
info('on a phone held sideways: ' + JSON.stringify({ pile: r, seen, fits }));
ok(['A NEW DEAL', 'DEALS RUNNING OUT', 'THE LEAGUE'].every(k => seen.includes(k)) && fits.every(Boolean),
  'on a phone held sideways (844x390): his paper mid-talks, five deals running out (four rows and "…and 1 more"), the Golden Boot and Glove -- each paper and every button on the screen');
await page.setViewportSize({ width: 1280, height: 720 });

process.exitCode = rep.finish() ? 1 : 0;
await browser.close();
