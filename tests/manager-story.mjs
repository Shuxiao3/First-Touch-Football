// FOOTBALL CLASSIC, HIS STORY: what you know of another club's man in levels (a report a level, as far as your scouts'
// house goes; playing against him half of one a game, up to 2, narrowing his rating's range on the way; a report a
// level less each summer; a man who's played for you a 2 when he goes); potential never exact -- a range (your own
// men's by your best coach, others' by how well they're scouted) or the league it could take him to; the scouts' word
// on his character; his career on the card's third side (his seasons, what's happened to him, his games and goals for
// you); the season's awards; the club's records, and the news when one goes. On a copy of the game that lets the
// test reach it.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  let INJ_OFF=false;', '  let INJ_OFF=true;');
patch('  // ===== END MANAGER CAREER', '  window.__K={ ev:s=>eval(s) };\n  // ===== END MANAGER CAREER');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-story-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
const K = s => page.evaluate(s => window.__K.ev(s), s);
let r;
await page.emulateMedia({ reducedMotion: 'reduce' });
await page.click('#smItems [data-act="new"]'); await page.waitForTimeout(150);
await page.click('#newSlotList .slotBtn >> nth=0'); await page.waitForTimeout(100);
await page.waitForSelector('#mgrMaker.on', { timeout: 4000 });
await page.fill('#mgName', 'Sam Okafor'); await page.fill('#mgClubIn', 'Story Town');
await page.click('#mgGo'); await page.waitForSelector('#careerHub.show', { timeout: 6000 });
// hidden values by letter, in the order lr pro ad rs du ch te am lo ('j' is 5.5)
await K(`(()=>{ const d=CAREER.data; d.story={vet:2,kid:2,phone:2}; mgStoryShow(d); window.HV=(o)=>{ const k=['lr','pro','ad','rs','du','ch','te','am','lo'], v=Object.assign({lr:5.5,pro:5.5,ad:5.5,rs:5.5,du:5.5,ch:5.5,te:5.5,am:5.5,lo:5.5},o); return k.map(x=>devEnc(v[x])).join(''); };
  window.CL=d.div[1].filter(id=>id!==d.clubId).map(id=>d.world.clubs[id]); mgSave(d); return 1; })()`);

// --- scouting, in levels ----------------------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, c=CL[0], p=c.players[0], q=c.players.find(x=>x.role!==p.role); d.budget=1e7; d.kn={};
  d.lv.scouting=0; const e0=mgScout(d,p.id);
  d.lv.scouting=1; const b0=d.budget, e1=mgScout(d,p.id), k1=knOf(d,p), paid=b0-d.budget, e1b=mgScout(d,p.id);
  d.lv.scouting=3; const e2=mgScout(d,p.id), k2=knOf(d,p), e3=mgScout(d,p.id), k3=knOf(d,p), e4=mgScout(d,p.id);
  d.lv.scouting=2; const ks=[]; for(let i=0;i<3;i++){ mgScoutGroup(d,1,q.role); ks.push(knOf(d,q)); }
  return { e0, e1, k1, paid, cost:mgScoutCost(d,p,c), e1b, e2, k2, e3, k3, e4, ks, p3:knOf(d,p) }; })()`);
info('scouting: ' + JSON.stringify(r));
ok(/scouts’ house first/.test(r.e0) && r.e1 === null && r.k1 === 1 && r.paid === r.cost && /bigger scouts’ house/.test(r.e1b),
  'a report takes him up a level, at the price of one ($' + r.paid + '); a level-1 scouts\' house goes no further ("' + r.e1b + '")');
ok(r.e2 === null && r.k2 === 2 && r.e3 === null && r.k3 === 3 && /know all there is/.test(r.e4) && r.ks.join() === '1,2,2' && r.p3 === 3,
  'with a bigger house, 2 and 3, then no more ("' + r.e4 + '"); an assignment a level on each man, as far as the house goes (' + r.ks.join(', ') + ')');
r = await K(`(()=>{ const d=CAREER.data, c=CL[1], t=c.players.slice(0,8); d.lv.scouting=1; for(const p of t) delete d.kn[p.id];
  const w=()=>{ const g=mgRange(d,t[0]); return g[1]-g[0]; }, k=[], ws=[w()];
  const game=()=>mgRateGame(d,[d.clubId,c.id,1,0],d.roster.slice(0,8),t,false,false);
  game(); k.push(knOf(d,t[0])); ws.push(w()); game(); k.push(knOf(d,t[0])); const known=mgKnown(d,t[0]); for(let i=0;i<4;i++) game(); k.push(knOf(d,t[0]));
  d.kn={a:3,b:1,c:0.5,e:2.5}; knAge(d); const aged=JSON.stringify(d.kn);
  const i=d.roster.length-1, gone=d.roster[i]; mgRosterRemove(d,i); const left=knOf(d,gone); mgRosterAdd(d,gone);
  return { k, ws, known, aged, left }; })()`);
info('playing against him: ' + JSON.stringify(r));
ok(r.k.join() === '0.5,1,2' && r.ws[1] < r.ws[0] && r.known, 'playing against him: half a report a game (' + r.k.join(', ') + ', up to 2); after one, his rating\'s range narrower (' + r.ws.join(' to ') + ' wide); after two, known');
ok(r.aged === '{"a":2,"e":1.5}' && r.left === 2, 'a report loses a level each summer (' + r.aged + '); a man who\'s played for you is a 2 when he goes');
r = await K(`(()=>{ const d=CAREER.data, K0=d.kn, R0=d.rec; d.scouted={'12345':1}; delete d.kn; delete d.rec; mgMigrate(d); const out={ kn:d.kn['12345'], gone:!('scouted' in d), rec:!!d.rec }; d.kn=K0; d.rec=R0; return out; })()`);
ok(r.kn === 1 && r.gone && r.rec, 'a career saved before: each man it had scouted is a report');

// --- potential: never the number ----------------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data; d.staff=[]; d.kn={}; const P=d.roster.concat(mgAiClubs(d).slice(0,8).flatMap(c=>c.players)); let contains=true, wide=true, inside=true, same=true;
  for(const p of P) for(const w of [2,3,5,6]){ const g=potRange(p,w); if(!(g[0]<=p.pot&&p.pot<=g[1])) contains=false; if(g[1]-g[0]<2) wide=false; if(g[0]<Math.min(p.ovr,p.pot)||g[1]>99) inside=false; if(potRange(p,w).join()!==g.join()) same=false; }
  const wd=t=>{ const m=String(t).match(/^(\\d+)–(\\d+)$/); return m?m[2]-m[1]:null; };
  // (v194: a range is shown as the ratings shown -- stretched over 60 -- so its width is read in his rating itself, and
  // the card's text checked to be that range as shown)
  const iw=(p,w)=>{ const g=potRange(p,w); return g[1]-g[0]; }, as=(p,w)=>rangeShown(potRange(p,w));
  const y=mgNewPlayer(d,'MID',60,19,{pot:82,sub:'CM'}); y.id=999901; const mine0=potTxt(d,y,{mine:true},true), e0=as(y,potWYours(d,false)), w0=iw(y,potWYours(d,false));
  d.staff=[{id:1,k:'tec',r:10,wage:1,name:'x'}]; const mine10=potTxt(d,y,{mine:true},true), e10=as(y,potWYours(d,false)), w10=iw(y,potWYours(d,false));
  d.staff=[{id:2,k:'youth',r:5,wage:1,name:'y'}]; const ac=potTxt(d,y,{youth:true},true), eac=as(y,potWYours(d,true)), wac=iw(y,potWYours(d,true)), sq=potTxt(d,y,{mine:true},true), esq=as(y,potWYours(d,false)), wsq=iw(y,potWYours(d,false)); d.staff=[];
  const o=mgNewPlayer(d,'ATT',66,20,{pot:84,sub:'STK'}); o.id=999902; const T={}; for(const k of [0,1,2,3]){ d.kn[o.id]=k; T[k]=[potTxt(d,o,{}),potTxt(d,o,{},true)]; } delete d.kn[o.id];
  return { n:P.length, contains, wide, inside, same, mine0, w0, w10, wac, wsq, shownOk:mine0===e0&&mine10===e10&&ac===eac&&sq===esq, T, w2:iw(o,5), w3:iw(o,3), t2ok:T[2][0]===as(o,5), t3ok:T[3][0]===as(o,3), kid:kidPot({name:'Leo Test',ovr:64,pot:88}) }; })()`);
info('potential: ' + JSON.stringify(r));
ok(r.contains && r.wide && r.inside && r.same, 'potential as a range, ' + r.n + ' men at four widths: always round the real one, never narrower than two, inside his rating and 99, the same every time');
ok(r.w0 === 12 && r.w10 === 4 && r.wac === 8 && r.wsq === 12 && r.shownOk, 'your own men\'s by your best coach: ' + r.mine0 + ' with none (12 wide in his rating itself, wider shown over 60 -- v194), 4 wide with a 10; the academy\'s by its youth coach (a 5: 8 wide)');
ok(r.T[0].join() === '?,?' && r.T[1][0] === 'a Premium League player' && r.T[1][1] === '?' && r.w2 === 10 && r.w3 === 6 && r.t2ok && r.t3ok,
  'another club\'s: unscouted ?, scouted once the league it could take him to ("' + r.T[1][0] + '", ? in a list), twice ' + r.T[2][0] + ', three times ' + r.T[3][0]);
ok(r.kid[0] <= 88 && r.kid[1] >= 88 && r.kid[1] - r.kid[0] === 6, 'the wonderkid\'s ceiling, as the club hears it: ' + r.kid.join('–'));

// --- his character, as the scouts tell it ---------------------------------------------------------------------------------------------
r = await K(`(()=>{ const p=mgNewPlayer(CAREER.data,'MID',60,24,{pot:62,sub:'CM'}); const say=(o,n)=>{ p.hv=HV(o); return hvSay(p,n).map(x=>x.join(' ')).join(' | '); };
  return { two:say({pro:9,du:2,am:8},2), four:say({pro:9,du:2,am:8,te:3},4), plain:say({},4), work:say({pro:7.5},2), low:say({ch:2,lo:3,lr:3.5},4) }; })()`);
info('the scouts\' word: ' + JSON.stringify(r));
ok(r.two === 'WORK model pro | BODY injury-prone' && r.four === 'WORK model pro | BODY injury-prone | TEMPER volatile | DRIVE ambitious' && r.plain === '' && r.work === 'WORK hard worker'
   && r.low === 'VOICE quiet | LOYALTY mercenary | LEARNS slowly', 'his character in a few words, what stands out most first: two at a second report, four at a third; nothing stands out in an ordinary man');

// --- one more game for the club; the club's records ----------------------------------------------------------------------------------
// (the youngest records cleared first: a new career's squad can have had a 17-year-old play already)
r = await K(`(()=>{ const d=CAREER.data, R=d.rec; d.news=[]; delete R.yd; delete R.ys; const t=mgNewPlayer(d,'MID',50,17,{pot:60,sub:'CM'}); t.name='Tom Early'; t.id=999950; clubApp(d,t,1);
  const quiet={news:d.news.length,yd:R.yd.name,ys:R.ys.name};   // (your first season: kept, not in the news)
  d.manager.history.push({season:0,club:d.clubName,tier:1,pos:8,result:'STAYED UP'});   // (a season behind you: the news tells of them now)
  const a=mgNewPlayer(d,'MID',55,16,{pot:72,sub:'CM'}); a.name='Kit Young'; a.until=d.season+3; mgRosterAdd(d,a); const yd0=R.yd&&R.yd.age; d.news=[];
  clubApp(d,a,0); const deb=d.news.map(n=>n.t); d.news=[]; clubApp(d,a,1); a.ca=49; clubApp(d,a,0); a.cg=24; clubApp(d,a,1); const most=d.news.map(n=>n.t); window.KID=a.id;
  const b0=R.bw&&R.bw.gf+'-'+R.bw.ga; d.news=[]; recWin(d,6,0,CL[2].id); const big=d.news.map(n=>n.t); recWin(d,3,0,CL[2].id); recWin(d,1,2,CL[2].id);
  return { quiet, yd0, deb, evs:a.evs.map(e=>e[1]), yd:R.yd, ys:R.ys, ap:R.ap.name, most, b0, bw:R.bw, big }; })()`);
info('the club\'s games and records: ' + JSON.stringify(r));
ok(r.quiet.news === 0 && r.quiet.yd === 'Tom Early' && r.quiet.ys === 'Tom Early', 'the records are kept from your first season, but the news tells of them from your second (a 17-year-old\'s debut and goal: no news)');
ok(r.evs.join('|') === 'Debut for STO|First goal for STO|50 games for STO|25 goals for STO' && r.yd.name === 'Kit Young' && r.yd.age === 16 && r.ys.age === 16
   && r.deb.some(t => /youngest ever to play for Story Town/.test(t)), 'his debut, his first goal, fifty games, twenty-five goals, on his record; at 16 the youngest to play (before him ' + r.yd0 + ') and to score, in the news');
ok(r.ap === 'Kit Young' && r.most.some(t => /played more games for Story Town than anyone/.test(t)) && r.bw.gf === 6 && r.bw.ga === 0 && r.big.some(t => /biggest win, 6–0/.test(t)),
  'most games for the club, in the news; the biggest win (' + r.b0 + ' to 6-0, and a 3-0 or a defeat doesn\'t touch it)');
r = await K(`(()=>{ const d=CAREER.data, R=d.rec; d.budget=1e8; d.lv.market=1; d.phase='summer'; const out={};
  const buy=(c,fee)=>{ const p=c.players.find(x=>x.role!=='GK'); d.news=[]; const e=mgSignDeal(d,p.id,fee,2); return [e,p,d.news.map(n=>n.t)]; };
  const [e1,p1]=buy(CL[3],50000), fp1=R.fp&&R.fp.fee, [e2,p2,n2]=buy(CL[4],80000);
  const s=d.roster.find(x=>x.id===p1.id), c=CL[5]; c.budget=1e8; c.players.length=Math.min(c.players.length,MG_MAX-2); d.offers=[{id:7001,pid:s.id,club:c.id,fee:120000,wk:d.wkN}]; d.news=[];
  const e3=mgAcceptOffer(d,7001); const k=mgSetCaptain(d,KID,false), kid=d.roster.find(x=>x.id===KID);
  d.manager.history=d.manager.history.filter(h=>h.season!==0);   // (the season behind you was only for the news)
  return { e1, e2, e3, fp1, fp:R.fp, fs:R.fs, n2, ev2:p2.evs.slice(-1)[0][1], ev3:s.evs.slice(-1)[0][1], kn:knOf(d,s), cap:kid.evs.slice(-1)[0][1] }; })()`);
info('fees: ' + JSON.stringify(r));
ok(!r.e1 && !r.e2 && !r.e3 && r.fp1 === 50000 && r.fp.fee === 80000 && r.n2.some(t => /club record: the most Story Town have ever paid/.test(t)) && r.fs.fee === 120000,
  'the record signing (50,000, then 80,000, in the news) and the record sale (120,000)');
ok(/^Joined STO \(\$80,000\)$/.test(r.ev2) && /^Left for \w+ \(\$120,000\)$/.test(r.ev3) && r.kn === 2 && r.cap === 'Captain of STO', 'on their records: "' + r.ev2 + '", "' + r.ev3 + '" (and you know him: a 2), "' + r.cap + '"');

// --- the season's end: the awards, each man's season on record -------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, A=CL[6].players, B=CL[7].players, X=A.find(p=>p.role!=='GK'), Y=B.find(p=>p.role!=='GK'), Z=CL[8].players.find(p=>p.role==='ATT')||CL[8].players[1], G=CL[9].players.find(p=>p.role==='GK');
  const W=d.roster.find(p=>p.role!=='GK'&&p.id!==KID); W.until=d.season+2; X.age=26; Y.age=20;
  const set=(p,n,avg,g)=>{ p.rn=n; p.rs=Math.round(n*avg*10)/10; p.apps=n; p.goals=g; }; set(X,20,8.1,3); set(Y,12,7.6,1); set(Z,22,6.9,31); set(W,8,9,2); set(G,20,6.5,0); G.cs=50;
  d.news=[]; d.phase='league'; mgSeasonEnd(d); const R=d.review;
  return { aw:R.awards.map(a=>[a.t,a.name===X.name?'X':a.name===Y.name?'Y':a.name===Z.name?'Z':a.name===W.name?'W':a.name===G.name?'G':a.name,a.v,a.you]), news:d.news.filter(n=>/League 2’s/.test(n.t)).map(n=>n.t),
    zev:Z.evs.map(e=>e[1]), gev:G.evs.map(e=>e[1]), xev:X.evs.map(e=>e[1]), xh:X.hist, wev:W.evs.map(e=>e[1]), wh:W.hist&&W.hist[W.hist.length-1], all:d.roster.every(p=>p.hist&&p.hist.length&&p.hist[p.hist.length-1][0]===d.season), zh:!!Z.hist }; })()`);
info('the season\'s end: ' + JSON.stringify(r));
ok(r.aw.map(a => a.slice(0, 3).join(' ')).join(' | ') === 'Player of the Year X 8.1 | Best young player Y 7.6 | Golden Boot Z 31 goals | Golden Glove G 50 clean sheets | Your Player of the Year W 9.0' && r.aw[4][3] === true,
  'the awards: the league\'s Player of the Year (from ten games), its best young player (21 or under), the Golden Boot (its top scorer), the Golden Glove (the keeper with the most clean sheets, v110), and your own Player of the Year (from five)');
ok(r.news.length === 4 && /is League 2’s player of the year \(8\.1\)/.test(r.news.join()) && /wins League 2’s Golden Boot \(31 goals\)/.test(r.news.join()) && /wins League 2’s Golden Glove \(50 clean sheets\)/.test(r.news.join())
  && r.xev.includes('L2 Player of the Year') && r.zev.includes('L2 Golden Boot') && r.gev.includes('L2 Golden Glove') && r.wev.includes('STO Player of the Year'),
  'the league\'s four in the news ("wins League 2’s Golden Boot (31 goals)"); on their records ("L2 Player of the Year", "L2 Golden Boot", "L2 Golden Glove", "STO Player of the Year")');
ok(r.all && r.wh[0] === 1 && r.wh[1] === 'STO' && r.wh[3] === 8 && r.wh[6] === 90 && r.xh && r.xh[0][3] === 20 && r.xh[0][6] === 81 && r.zh,
  'a season\'s line for each of your men (' + JSON.stringify(r.wh) + ') and for the award winners elsewhere (' + JSON.stringify(r.xh[0]) + ')');
await page.click('#chCampus [data-bldg="review"]').catch(() => {}); await page.waitForTimeout(200);
let txt = await page.textContent('#bpBody').catch(() => '');
if(!/THE AWARDS/.test(txt)){ await K(`(()=>{ openBuilding('review'); return 1; })()`); await page.waitForTimeout(200); txt = await page.textContent('#bpBody').catch(() => ''); }
ok(/THE AWARDS · LEAGUE 2/.test(txt) && /Player of the Year/.test(txt) && /Golden Boot/.test(txt) && /Golden Glove/.test(txt), 'the season\'s review: THE AWARDS, the Golden Boot and the Golden Glove among them');
await K(`(()=>{ hideBldg(); return 1; })()`).catch(() => {});
r = await K(`(()=>{ const d=CAREER.data, W=d.roster.find(p=>p.hist&&p.hist.length); mgNewSeason(d); return { s:d.season, apps:W.apps, rn:W.rn, kept:W.hist.length>=1 }; })()`);
ok(r.s === 2 && r.apps === 0 && r.rn === 0 && r.kept, 'a new season: the numbers start again, the record stays');

// --- the card: three sides; his career, in short lines, on a phone ---------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, p=d.roster.find(x=>x.id===KID); p.name='Kit Young'; p.hist=[]; d.season=6;   // (six seasons on: five on his record)
  for(let s=1;s<=5;s++) p.hist.push([s,'STO',Math.min(4,s),20+s,s*3,s,64+s]); p.apps=7; p.goals=2; p.as=1; p.rn=7; p.rs=48.3;
  p.evs=[[3,'Debut for STO'],[4,'Won the Champions League'],[5,'L2 best young player']]; mgSave(d); renderHub(); return p.id; })()`);
const kid = r;
for(const [w, h] of [[640, 360], [844, 340]]){
  await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(200);
  await page.click('#chCampus [data-bldg="club"]'); await page.waitForSelector('#bldgPanel.show'); await page.click('#bldgPanel .bpTab:text-is("Squad")'); await page.waitForTimeout(150);
  await page.evaluate(id => document.querySelector(`.mgPaneL .mgRow[data-pid="${id}"]`).click(), kid); await page.waitForTimeout(150);
  await page.click('.mgPaneR .mgSides [data-mside="rate"]'); await page.waitForTimeout(80);   // (the side it was left on: back to his ratings)
  // HIS CARD'S SIDES (v116): a tab each along its foot -- in the Squad tab ◀ TEAM first -- the one showing lit
  const tabsOf = () => page.evaluate(() => { const P = document.querySelector('.mgPaneR .mgPaneScroll'), S = P.querySelector('.mgSides'), b = S ? [...S.querySelectorAll('button')] : [];
    return { tabs: b.map(n => n.textContent.trim() + (n.classList.contains('on') ? '*' : '')), foot: !!S && Math.abs(S.getBoundingClientRect().bottom - (P.getBoundingClientRect().bottom - parseFloat(getComputedStyle(P).paddingBottom))) <= 1,
      h: b.length ? Math.round(Math.min(...b.map(n => n.getBoundingClientRect().height))) : 0 }; });
  const T0 = await tabsOf(), flips = [];
  for(const k of ['rate', 'deal', 'career', 'mind']){ await page.click(`.mgPaneR .mgSides [data-mside="${k}"]`); await page.waitForTimeout(100); flips.push(await page.$eval('.mgPaneR .mgCard', c => c.dataset.side)); }
  info(w + 'x' + h + ' his card\'s tabs: ' + JSON.stringify({ T0, flips }));
  ok(T0.tabs.join('|') === '◀ TEAM|RATINGS*|DEAL|CAREER|PERSONALITY' && T0.foot && T0.h >= 28 && flips.join() === 'rate,deal,career,mind',
    w + 'x' + h + ': his card\'s sides a tab each along its foot (' + T0.tabs.join(' ') + ', ' + T0.h + ' px tall), each a tap away');
  await page.click('.mgPaneR .mgSides [data-mside="career"]'); await page.waitForTimeout(100);
  // ...and one more: HIS PERSONALITY (v116) -- his mood, his character in words two to a line, his traits as they've come out
  const mindOf = () => page.evaluate(() => { const P = document.querySelector('.mgPaneR .mgPaneScroll'), c = P.querySelector('.mgCard');
    return { side: c.dataset.side, lit: (c.querySelector('.mgSideT.on') || {}).textContent, facts: [...c.querySelectorAll('.mgFact')].map(e => e.querySelector('span').textContent + ':' + e.querySelector('b').textContent),
      tr: [...c.querySelectorAll('.mindT')].map(e => e.textContent), ev: [...c.querySelectorAll('.cvEv')].map(e => e.textContent), tags: c.querySelectorAll('.mgTraits').length,
      mood: (c.querySelector('.mindTalk .mgActL') || {}).textContent || '', talk: !!c.querySelector('.mindTalk [data-mg="talkcard"]'),
      pos: (c.querySelector('.posRow') || {}).textContent || '', fits: P.scrollHeight <= P.clientHeight + 1 && P.scrollWidth <= P.clientWidth + 1,
      cut: [...c.querySelectorAll('.mgFact b, .mindT span, .cvEv')].filter(b => b.scrollWidth > b.clientWidth + 1).map(b => b.textContent) }; });
  await page.click('.mgPaneR .mgSides [data-mside="mind"]'); await page.waitForTimeout(100); const mind = await mindOf();
  info(w + 'x' + h + ' his personality: ' + JSON.stringify(mind));
  ok(mind.side === 'mind' && mind.lit === 'PERSONALITY' && mind.facts.length === 9 && /^(DELIGHTED|CONTENT|SETTLED|UNSETTLED|UNHAPPY) · ./.test(mind.mood) && mind.talk && ['TEMPER', 'WORK', 'LEARNS', 'DRIVE', 'LOYALTY', 'VOICE', 'GRIT', 'BODY', 'SETTLES'].every(k => mind.facts.some(f => f.startsWith(k + ':')))
     && !mind.facts.some(f => /\d/.test(f.split(':')[1])) && (mind.tr.length > 0 || mind.ev.length === 1) && !mind.tags && /^PLAYS/.test(mind.pos) && mind.fits && !mind.cut.length,
    w + 'x' + h + ': PERSONALITY: his mood and why with TALK TO HIM (v152: "' + mind.mood + '"), his character in words, never numbers (' + mind.facts.slice(0, 4).join(', ') + '...), his traits (' + (mind.tr.join(' / ') || mind.ev[0]) + '), all on the card');
  await page.click('.mgPaneR .mgSides [data-mside="rate"]'); await page.waitForTimeout(100); const back = await page.$eval('.mgPaneR .mgCard', c => c.dataset.side);
  ok(back === 'rate', '...and RATINGS turns it back to his ratings');
  await page.click('.mgPaneR .mgSides [data-mside="career"]'); await page.waitForTimeout(80);   // (back to his career, for the checks below)
  const cv = await page.evaluate(() => { const P = document.querySelector('.mgPaneR .mgPaneScroll'), c = P.querySelector('.mgCard');
    return { fits: P.scrollHeight <= P.clientHeight + 1 && P.scrollWidth <= P.clientWidth + 1, rows: [...c.querySelectorAll('.cvTab tr')].map(t => t.textContent.trim()), now: !!c.querySelector('.cvTab tr.now'),
      ev: [...c.querySelectorAll('.cvEv')].map(e => e.textContent), fact: [...c.querySelectorAll('.mgFact')].map(e => e.textContent),
      long: [...c.querySelectorAll('*')].filter(e => !e.closest('.mgCardHead') && !e.children.length && e.textContent.trim().length > 32).map(e => e.textContent.trim()),
      cut: [...c.querySelectorAll('.mgFact b, .cvEv')].filter(b => b.scrollWidth > b.clientWidth + 1).map(b => b.textContent), pot: (c.querySelector('.cardEnd .mgCardSub') || {}).textContent }; });
  info(w + 'x' + h + ' his career: ' + JSON.stringify(Object.assign({ flips }, cv)));
  ok(cv.rows.length === 5 && cv.now && cv.rows[1].replace(/\s/g, '') === 'S6L2STO7216.9' && cv.rows[2].replace(/\s/g, '') === 'S5PLSTO251556.9'
     && cv.ev.join('|') === 'S5L2 best young player|S4Won the Champions League' && /^FOR STO/.test(cv.fact[0]) && /^potential \d+–\d+$/.test(cv.pot),
    w + 'x' + h + ': his career: this season and his last three (' + cv.rows.slice(1, 3).join(' / ') + '), his last two moments, his games and goals for you; his potential a range (' + cv.pot + ')');
  ok(cv.fits && !cv.long.length && !cv.cut.length, w + 'x' + h + ': his career fits the card, nothing long or cut on it' + (cv.fits && !cv.long.length && !cv.cut.length ? '' : ' ' + JSON.stringify(cv)));
  const rows = await page.$$eval('.mgPaneL .sqList .mgRow', ns => ns.map(n => ({ ovr: (n.querySelector('.ovr') || {}).textContent, pot: !!n.querySelector('.pot') })));   // (v171: the list's rows as J3 has them)
  ok(rows.length >= 12 && rows.every(r => /^\d+$/.test(r.ovr) && !r.pot), w + 'x' + h + ': the squad list: his rating on every row, a number (' + rows.slice(0, 3).map(r => r.ovr).join(', ') + '...) -- his potential a range on his card, as above');
  await page.click('#bldgPanel .bpTopBack'); await page.waitForTimeout(150);
}
// another club's man, well scouted: his character on his card, SCOUT MORE while the house can tell more
await page.setViewportSize({ width: 640, height: 360 }); await page.waitForTimeout(200);
r = await K(`(()=>{ const d=CAREER.data, c=mgAiClubs(d).find(k=>k.tier===d.tier), p=c.players.find(x=>x.role!=='GK'); p.hv=HV({pro:9,du:2,am:8,te:3}); d.lv.scouting=3; d.kn={}; d.kn[p.id]=2; mgSave(d); renderHub(); return p.id; })()`);
const pid = r;
await page.click('#chCampus [data-bldg="scouting"]'); await page.waitForSelector('#bldgPanel.show'); await page.click('#bldgPanel .bpTab:text-is("Reports")'); await page.waitForTimeout(150);
const look = async () => { await page.evaluate(id => { const n = document.querySelector(`.mgPaneL .mgRow[data-pid="${id}"]`); n.click(); }, pid); await page.waitForTimeout(150);
  await page.click('.mgPaneR .mgSides [data-mside="rate"]'); await page.waitForTimeout(80);
  return page.evaluate(() => { const P = document.querySelector('.mgPaneR .mgPaneScroll'), c = P.querySelector('.mgCard');
    return { fits: P.scrollHeight <= P.clientHeight + 1, facts: [...c.querySelectorAll('.mgFact')].map(e => e.textContent), more: (c.querySelector('[data-mg="scout"]') || {}).textContent || '', pot: c.querySelector('.cardEnd .mgCardSub').textContent,
      cut: [...c.querySelectorAll('.mgFact b')].filter(b => b.scrollWidth > b.clientWidth + 1).map(b => b.textContent) }; }); };
const k2 = await look();
await page.click('.mgPaneR [data-mg="scout"]'); await page.waitForTimeout(150);
const msg = await page.textContent('#bpMsg').catch(() => '');
await page.evaluate(id => { const n = document.querySelector(`.mgPaneL .mgRow[data-pid="${id}"]`); n.click(); }, pid); await page.waitForTimeout(100);   // (off and on again)
const k3 = await look();
info('640x360, his card scouted twice and three times: ' + JSON.stringify({ k2, msg, k3 }));
ok(k2.facts.join('|') === 'WORKmodel pro|BODYinjury-prone' && /^SCOUT MORE \(\$[\d,]+\)$/.test(k2.more) && /^potential \d+–\d+$/.test(k2.pot) && k2.fits && !k2.cut.length,
  'another club\'s man scouted twice: what stands out about him (' + k2.facts.join(', ') + '), his potential 10 wide (' + k2.pot + '), SCOUT MORE');
ok(/A full report/.test(msg) && k3.facts.length === 4 && !k3.more && k3.fits && !k3.cut.length, 'three times ("' + msg + '"): four things about him, nothing more to find, all on the card');
await page.click('#bldgPanel .bpTopBack'); await page.waitForTimeout(150);
// the club's records, in the Clubhouse
await page.click('#chCampus [data-bldg="club"]'); await page.waitForSelector('#bldgPanel.show'); await page.click('#bldgPanel .bpTab:text-is("Club")'); await page.waitForTimeout(200);
const club = await K(`(()=>{ const o={}; for(const c of document.querySelectorAll('#bpBody .clRec')) o[c.querySelector('.clLbl').textContent]={ v:c.querySelector('b').textContent, who:c.querySelector('em').textContent, x:c.dataset.xpl }; return o; })()`);   // (v172: a card a record, J2)
info('the Clubhouse\'s records: ' + JSON.stringify(club));
const C = club, has = k => C[k] && C[k].v !== '—';
ok(Object.keys(C).length === 7 && C['MOST GAMES'].who === 'YOUNG' && /^Most games for the club: Kit Young, \d+\.$/.test(C['MOST GAMES'].x) && C['BIGGEST WIN'].v === '6–0' && /^v [A-Z ]+ · S1$/.test(C['BIGGEST WIN'].who)
   && C['RECORD SIGNING'].v === '$80K' && /\$80,000\.$/.test(C['RECORD SIGNING'].x) && C['RECORD SALE'].v === '$120K' && /\$120,000\.$/.test(C['RECORD SALE'].x) && has('MOST GOALS') && has('YOUNGEST') && has('YOUNGEST SCORER'),
  'the Clubhouse\'s CLUB RECORDS, a card each, the record first and who holds it beside it: most games (' + C['MOST GAMES'].v + ' ' + C['MOST GAMES'].who + '), most goals, the youngest, the biggest win (6–0 ' + C['BIGGEST WIN'].who + '), the record signing ($80K) and sale ($120K), the rest a tap away');

process.exitCode = rep.finish() ? 1 : 0;
await browser.close();
