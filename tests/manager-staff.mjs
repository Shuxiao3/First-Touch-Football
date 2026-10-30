// FOOTBALL CLASSIC, THE STAFF AND TRAINING FOCUS: five coaches -- fitness, technical, finishing, defending, goalkeeping --
// a post each from the start (so only ever who's the best you can get for each), and the academy's youth coach (its
// COACH tab: never the first team's; good and poor at whole fields of his lads' game). Rated
// 1 to 10, dearer the better, the best won't come to a small club; each good at some of his field and poor at some of
// it by his rating (the poor two weak spots, the best three strengths). Hiring needs the post empty and four weeks'
// wages in the budget; releasing one pays four weeks; their wages go on the bill. Training, attribute by attribute, is
// the pitch's and its coach's (a strength half as well again, a weak spot nothing); coaches develop players and nothing
// else (injuries and stamina on the day are the physio's); the youth coach a better academy. A man's FOCUS (his card)
// puts his training on one coach's field. A career saved before: the tactics coach is the defending coach, every coach
// his strengths and weak spots. The Staff tab and the cards fit a phone. On a copy of the game that lets the test reach it.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  // ===== END MANAGER CAREER', '  window.__K={ ev:s=>eval(s) };\n  // ===== END MANAGER CAREER');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-staff-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
const K = s => page.evaluate(s => window.__K.ev(s), s);
let r;
await page.emulateMedia({ reducedMotion: 'reduce' });
await page.click('#smItems [data-act="new"]'); await page.waitForTimeout(150);
await page.click('#newSlotList .slotBtn >> nth=0'); await page.waitForTimeout(100);
await page.waitForSelector('#mgrMaker.on', { timeout: 4000 });
await page.fill('#mgName', 'Sam Okafor'); await page.fill('#mgClubIn', 'Coach Town');
await page.click('#mgGo'); await page.waitForSelector('#careerHub.show', { timeout: 6000 });
// hidden values by letter, in the order lr pro ad rs du ch te am lo ('j' is 5.5)
await K(`(()=>{ const d=CAREER.data; d.story={vet:2,kid:2,phone:2}; window.HV=(o)=>{ const k=['lr','pro','ad','rs','du','ch','te','am','lo'], v=Object.assign({lr:5.5,pro:5.5,ad:5.5,rs:5.5,du:5.5,ch:5.5,te:5.5,am:5.5,lo:5.5},o); return k.map(x=>devEnc(v[x])).join(''); }; mgSave(d); return 1; })()`);

// --- the five coaches' fields, and the men to hire ---------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data; d.lv.academy=0; d.cand=null; const L1=staffCands(d);
  d.lv.academy=1; d.cand=null; const L2=staffCands(d), w0=d.weeks; d.weeks=w0+3; const same=staffCands(d)===L2; d.weeks=w0+4; const fresh=staffCands(d)!==L2; d.weeks=w0;
  const all=L1.concat(L2), halves=all.every(c=>c.r>=1&&c.r<=10&&c.r*2===Math.round(c.r*2)), pay=all.every(c=>Math.abs(c.wage-staffWage(c.r))<=Math.max(10,staffWage(c.r)*0.2));
  const fields=STAFF_ORDER.map(k=>k+':'+COACH_AREA[k].length).join(' '), every=DEV_KEYS.every(k=>STAFF_ORDER.filter(a=>COACH_AREA[a].includes(k)).length===1);
  const Y=youthCands(d);
  return { fields, every, heading:areaOf('heading'), offIQ:areaOf('offIQ'), defIQ:areaOf('defIQ'), n1:L1.length, per:STAFF_ORDER.map(k=>L1.filter(c=>c.k===k).length).join(','), youth1:L1.filter(c=>c.k==='youth').length,
    n2:L2.length, youth2:L2.filter(c=>c.k==='youth').length, ny:Y.length, yk:Y.every(c=>c.k==='youth'), same, fresh, halves, pay, w:[staffWage(1),staffWage(5),staffWage(10)] }; })()`);
info('the fields and the men to hire: ' + JSON.stringify(r));
ok(r.fields === 'fit:5 tec:5 fin:6 def:4 gk:5' && r.every && r.heading === 'fin' && r.offIQ === 'fin' && r.defIQ === 'def',
  'five coaches, every attribute in one field: fitness 5, technical 5, finishing 6 (heading, Off IQ and composure with the shooting), defending 4 (Def IQ, interceptions), goalkeeping 5');
ok(r.n1 === 10 && r.per === '2,2,2,2,2' && r.youth1 === 0 && r.n2 === 10 && r.youth2 === 0 && r.ny === 2 && r.yk && r.same && r.fresh, 'two men to hire for each post, no youth coach among them (the academy has its own two); the same men for four weeks, then new ones');
ok(r.halves && r.pay && r.w[0] < r.w[1] && r.w[1] < r.w[2], 'rated 1 to 10 in halves, the better the dearer (' + r.w.join(', ') + ' a week for a 1, a 5, a 10)');

// --- what each is good and poor at, by his rating -----------------------------------------------------------------------------------
r = await K(`(()=>{ const N={}, bad=[]; for(let rr=1;rr<=10;rr+=0.5) for(const k of STAFF_ORDER){ const c=coachSpec({id:1,k,r:rr,name:'x',wage:1}), all=c.up.concat(c.dn);
    if(!all.every(a=>COACH_AREA[k].includes(a))||new Set(all).size!==all.length) bad.push(k+rr); N[rr]=c.up.length+'/'+c.dn.length; }
  const y=coachSpec({id:2,k:'youth',r:9,name:'y',wage:1}), z=coachSpec({id:3,k:'youth',r:2,name:'z',wage:1}), fields=y.up.concat(y.dn,z.up,z.dn).every(a=>STAFF_ORDER.includes(a));
  return { N, bad, y:y.up.length+'/'+y.dn.length, z:z.up.length+'/'+z.dn.length, fields }; })()`);
info('strengths/weak spots by rating: ' + JSON.stringify(r.N));
const want = { 1: '0/2', 3: '0/2', 3.5: '0/1', 4: '0/1', 4.5: '0/1', 5: '1/1', 5.5: '1/0', 6: '1/0', 6.5: '1/0', 7: '2/0', 8: '2/0', 8.5: '2/0', 9: '3/0', 10: '3/0' };
ok(r.y === '3/0' && r.z === '0/2' && r.fields, 'a youth coach is good and poor at whole fields of his lads\' game, by his rating the same way (a 9: ' + r.y + ', a 2: ' + r.z + ')');
ok(Object.entries(want).every(([k, v]) => r.N[k] === v) && !r.bad.length, 'what he\'s good and poor at, by his rating: up to 3, two weak spots and nothing special; 4, one weak spot; 5, one of each; 6, one strength; 7 and 8, two; 9 and 10, three and no weak spot -- all in his own field, none twice');

// --- hiring and releasing ---------------------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data; d.lv.train=1; d.lv.academy=1; d.staff=[]; d.budget=1e6; d.cand=null; staffCands(d);
  const mk=(k,rr)=>{ const c=coachSpec({id:(d.staffSeq=(d.staffSeq||0)+1),name:'Coach '+k+rr,k,r:rr,wage:staffWage(rr)}); d.cand.list.push(c); return c; };
  const hires=STAFF_ORDER.map(k=>mgHireCoach(d,mk(k,4).id)), dup=mgHireCoach(d,mk('fin',3).id);
  d.staff=d.staff.filter(c=>c.k!=='def'); const big=mgHireCoach(d,mk('def',7).id); d.budget=10; const poor=mgHireCoach(d,mk('def',4).id); d.budget=1e6;
  d.lv.academy=0; const y0=mgHireCoach(d,mk('youth',4).id); d.lv.academy=1; const y1=mgHireCoach(d,mk('youth',4).id);
  return { hires, dup, big, poor, y0, y1, kinds:d.staff.map(c=>c.k).join(','), cap1:staffCap(d), news:d.news[0].t }; })()`);
info('hiring: ' + JSON.stringify(r));
ok(r.hires.every(e => e === null) && /You have a finishing coach: release him first/.test(r.dup) && /won’t come to League 2/.test(r.big) && /Not enough budget/.test(r.poor),
  'all five posts from the start, a level-1 training pitch or not; one in each ("' + r.dup + '"); the best won\'t come to League 2 (above ' + r.cap1 + '); four weeks\' wages in the budget');
ok(/needs the academy/.test(r.y0) && r.y1 === null && r.kinds === 'fit,tec,fin,gk,youth' && /joins Coach Town as youth coach/.test(r.news), 'the youth coach with the academy; the hired man makes the news (' + r.news + ')');
r = await K(`(()=>{ const d=CAREER.data, f=computeFinance(d).wageWk, pw=d.roster.reduce((a,p)=>a+(p.wage||0),0), sw=d.staff.reduce((a,c)=>a+c.wage,0);
  const c=d.staff.find(x=>x.k==='fit'), b0=d.budget, e=mgReleaseCoach(d,c.id); return { bill:f===pw+sw, sw, e, paid:b0-d.budget, wage4:c.wage*4, left:d.staff.length, news:d.news[0].t }; })()`);
ok(r.bill && r.sw > 0 && r.e === null && r.paid === r.wage4 && r.left === 4 && /leaves Coach Town/.test(r.news), 'their wages go on the bill (' + r.sw + ' a week); releasing one pays four weeks (' + r.paid + ')');

// --- training, attribute by attribute -------------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, f=v=>+v.toFixed(3), S=d.staff; d.staff=[]; d.lv.train=1; const t1=devTrainYours(d); d.lv.train=4; const t4=devTrainYours(d);
  d.staff=[{id:91,k:'fin',r:8,wage:1,name:'f',up:['heading','shotPower'],dn:[]},{id:92,k:'def',r:3,wage:1,name:'g',up:[],dn:['tackle','defIQ']},{id:93,k:'gk',r:10,wage:1,name:'h',up:['gkReflex','gkReach','gkDiveRange'],dn:[]}];
  const t=devTrainYours(d); d.staff=S; d.lv.train=2;
  return { one:[...new Set(Object.values(t1).map(f))], four:[...new Set(Object.values(t4).map(f))], fin:[t.shotAcc,t.heading,t.shotPower,t.offIQ].map(f), def:[t.slideTackle,t.tackle,t.defIQ].map(f), gk:[t.gkDistribution,t.gkReflex].map(f), others:[t.passAcc,t.speed].map(f) }; })()`);
info('training: ' + JSON.stringify(r));
ok(r.one.join() === '0.65' && r.four.join() === '0.86', 'the pitch\'s training: 0.65 at level 1 with no coaches (as it always was), 0.86 at level 4');
ok(r.fin.join() === '1.14,1.28,1.28,1.14' && r.def.join() === '0.94,0.86,0.86' && r.gk.join() === '1.22,1.3' && r.others.join() === '0.86,0.86',
  'and the coach\'s, in his field only: a finishing coach rated 8 lifts shooting and Off IQ to 1.14, his strengths (heading, shot power) to 1.28; a poor defending coach (3) a little (0.94), his weak spots (tackling, Def IQ) not at all; a 10 in goal to 1.22, his strengths to the most there is (1.3)');

// --- what it does: twins with and without a finishing coach, and with a focus ---------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, base={}, coach={}; for(const k of DEV_KEYS){ base[k]=0.65; coach[k]=areaOf(k)==='fin'?1.15:0.65; }
  const area=(p,a)=>{ const st=devUnpack(p.at), pg=devUnpackPg(p.pg); return COACH_AREA[a].reduce((s,k)=>s+st[k]*2+pg[DEV_KEYS.indexOf(k)],0); };
  const runs={plain:[base,null], coach:[coach,null], ffin:[base,'fin'], ffit:[base,'fit']}, sum={}; for(const k in runs) sum[k]={fit:0,tec:0,fin:0};
  for(let s=0;s<6;s++){ const a=mgNewPlayer(d,'ATT',58,19,{pot:84,sub:'STK'}); a.hv=HV({}); a.seed=1000+s*77; a.mo=0; a.fm=6.6; a.mor=6.5; const j=JSON.stringify(a);
    for(const k in runs){ const p=JSON.parse(j); p.fo=runs[k][1]; const g0={fit:area(p,'fit'),tec:area(p,'tec'),fin:area(p,'fin')};
      for(let i=0;i<8;i++){ d.weeks=700+3*i; p.mw=4; devTick(d,p,{Tk:runs[k][0],gw:4}); }
      for(const g in g0) sum[k][g]+=area(p,g)-g0[g]; } }
  for(const k in sum) for(const g in sum[k]) sum[k][g]=+sum[k][g].toFixed(1); return sum; })()`);
info('six 19-year-old strikers, 24 weeks (half points by field): ' + JSON.stringify(r));
const near = (a, b) => Math.abs(a - b) <= Math.max(1, Math.abs(b) * 0.05);
ok(r.coach.fin > r.plain.fin * 1.2 && near(r.coach.fit, r.plain.fit) && near(r.coach.tec, r.plain.tec),
  'a finishing coach: his finishing comes on more (' + r.coach.fin + ' against ' + r.plain.fin + '), his legs and his touch as they would (' + r.coach.fit + ', ' + r.coach.tec + ')');
ok(r.ffin.fin > r.plain.fin * 1.15 && r.ffin.fit < r.plain.fit && r.ffin.tec < r.plain.tec && r.ffit.fit > r.plain.fit * 1.15 && r.ffit.fin < r.plain.fin,
  'his focus on finishing: it comes on more (' + r.ffin.fin + '), the rest a little less (' + r.ffin.fit + ', ' + r.ffin.tec + '); on fitness, the same the other way (' + r.ffit.fit + ' against ' + r.plain.fit + ')');

// --- the fitness coach and the youth coach ------------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, p=d.roster[3], S=d.staff; INJ_OFF=false; p.hv=HV({}); p.age=26; delete p.injB; delete p.cond; d.staff=[];
  const r0=injRisk(d,p,1,null); d.staff=[{id:95,k:'fit',r:8,wage:100,name:'f',up:[],dn:[]}]; const r8=injRisk(d,p,1,null);
  const rest=()=>{ for(const q of d.roster) q.cond=0.5; mgRest(d,1); return d.roster[3].cond; }; const c8=rest(); d.staff=[]; const c0=rest(); for(const q of d.roster) delete q.cond;
  let seen=null; const keep=devTick; devTick=(d,p,x)=>{ if(seen==null&&(d.youth||[]).includes(p)) seen=x.Tk.passAcc; return 0; };
  d.lv.academy=1; d.youth=d.youth&&d.youth.length?d.youth:[mgNewPlayer(d,'MID',45,16,{pot:70,sub:'CM'})]; mgDevelop(d); const y0=seen; seen=null;
  d.staff=[{id:96,k:'youth',r:6,wage:100,name:'y'}]; mgDevelop(d); const y6=seen; devTick=keep; d.staff=S;
  d.staff=[{id:97,k:'youth',r:8,wage:100,name:'w',up:['fin'],dn:['gk']}]; const yt=youthTrain(d), f=v=>+v.toFixed(2); d.staff=S;
  return { r:+(r8/r0).toFixed(3), c0:+c0.toFixed(4), c8:+c8.toFixed(4), y0:+y0.toFixed(2), y6:+y6.toFixed(2), spec:[yt.shotAcc,yt.passAcc,yt.gkReflex].map(f) }; })()`);
info('the fitness and youth coaches: ' + JSON.stringify(r));
ok(r.r === 1 && r.c8 === r.c0, 'a fitness coach develops a man\'s legs and nothing else: no fewer injuries (risk x' + r.r + '), no quicker back between games (' + r.c8 + ', ' + r.c0 + ' after a day) -- those are the physio\'s');
ok(Math.abs(r.y6 - r.y0 - 0.24) < 0.001 && r.spec.join() === '1.18,1.02,0.7', 'a youth coach rated 6: the academy trains better (' + r.y0 + ' to ' + r.y6 + '); one rated 8 good at finishing and poor at keeping: ' + r.spec.join(', ') + ' (shooting, passing, a keeper\'s reflexes)');

// --- a career saved before ---------------------------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, S=d.staff, C=d.cand, p=d.roster[0], q=d.roster[1], f0=[p.fo,q.fo];
  d.staff=[{id:801,k:'tac',r:7,wage:300,name:'Old Tactician'},{id:802,k:'tec',r:4,wage:100,name:'Old Tech'}]; d.cand={w:d.weeks,list:[{id:803,k:'tac',r:5,wage:200,name:'x'}]}; p.fo='phy'; q.fo='men';
  mgMigrate(d); const out={ kinds:d.staff.map(c=>c.k).join(','), spec:d.staff.map(c=>c.up.length+'/'+c.dn.length).join(','), own:d.staff.every(c=>c.up.concat(c.dn).every(a=>COACH_AREA[c.k].includes(a))),
    cand:d.cand===null, fo:p.fo+','+q.fo };
  d.staff=S; d.cand=C; p.fo=f0[0]; q.fo=f0[1]; return out; })()`);
ok(r.kinds === 'def,tec' && r.spec === '2/0,0/1' && r.own && r.cand && r.fo === 'fit,null', 'a career saved before: its tactics coach is the defending coach, every coach his strengths and weak spots (' + r.spec + '), new men to hire; a focus on the old kinds moved over (' + r.fo + ')');

// --- the Staff tab -----------------------------------------------------------------------------------------------------------------------
await K(`(()=>{ const d=CAREER.data; d.lv.train=2; d.lv.academy=1; d.staff=[]; d.cand=null; d.budget=1e6; const L=staffCands(d), c=L.find(x=>x.k==='fin');
  c.r=5; delete c.up; delete c.dn; coachSpec(c); c.name='Bartholomew Featherstonehaugh'; window.FIN=c.id; mgSave(d); renderHub(); return 1; })()`);
await page.click('#chCampus [data-bldg="train"]'); await page.waitForSelector('#bldgPanel.show'); await page.waitForTimeout(120);
const tabs = await page.$$eval('#bpTabs .bpTab', ns => ns.map(n => n.textContent.trim()));
await page.click('#bldgPanel .bpTab:text-is("Staff")'); await page.waitForTimeout(150);
const s0 = await page.evaluate(() => ({ hint: document.querySelector('#bpBody .mgHint').textContent.trim(), vac: document.querySelectorAll('#bpBody .mgRow.vac').length }));
const fin = await K('FIN');
await page.evaluate(id => document.querySelector(`#bpBody .mgRow[data-cid="${id}"]`).click(), fin); await page.waitForTimeout(120);
const cardTxt = await page.innerText('#bpBody .mgPaneR .mgCard').catch(() => '');
await page.click('#bpBody [data-mg="chire"]'); await page.waitForTimeout(150);
r = await K(`(()=>{ const d=CAREER.data; return { n:d.staff.length, k:d.staff[0]&&d.staff[0].k }; })()`);
const s1 = await page.evaluate(() => ({ hint: document.querySelector('#bpBody .mgHint').textContent.trim(), vac: document.querySelectorAll('#bpBody .mgRow.vac').length }));
info('the Staff tab: ' + JSON.stringify({ s0, card: cardTxt.split('\n').join(' / '), s1 }));
ok(tabs.join() === 'Tactics,Selection,Subs,Staff,Pitch' && s0.hint === '0 of 5 posts filled' && s0.vac === 5 && /finishing coach · rated 5\.0/.test(cardTxt) && /GOOD AT/.test(cardTxt) && /POOR AT/.test(cardTxt) && /HIRE/.test(cardTxt)
   && r.n === 1 && r.k === 'fin' && s1.hint === '1 of 5 posts filled' && s1.vac === 4,
  'the Staff tab: ' + s0.hint + ', each post a line (vacant till filled); a man\'s card says what he\'s good and poor at; HIRE, and the post is his (' + s1.hint + ')');

// ...and on a phone: the tab bar, a coach's card, a man's card with his FOCUS, all fit, nothing long on them
await page.setViewportSize({ width: 640, height: 360 }); await page.waitForTimeout(250);
const fit = () => page.evaluate(() => { const P = document.querySelector('.mgPaneR .mgPaneScroll'), c = P && P.querySelector('.mgCard'), T = document.getElementById('bpTabs');
  return { fits: !!P && P.scrollHeight <= P.clientHeight + 1 && P.scrollWidth <= P.clientWidth + 1, tabs: !!T && T.scrollWidth <= T.clientWidth + 1,
    long: c ? [...c.querySelectorAll('.mgHint')].concat([...c.querySelectorAll('*')].filter(e => !e.closest('.mgCardHead') && !e.children.length && e.textContent.trim().length > 32)).map(e => e.textContent.trim().slice(0, 40)) : ['no card'],
    cut: c ? [...c.querySelectorAll('.mgFact b, .coChips b')].filter(b => b.scrollWidth > b.clientWidth + 1 || b.getBoundingClientRect().right > c.getBoundingClientRect().right + 1).map(b => b.textContent) : [] }; });
const sid = await K('(MGUI.csel=null, CAREER.data.staff[0].id)');
await page.evaluate(id => document.querySelector(`#bpBody .mgRow[data-cid="${id}"]`).click(), sid); await page.waitForTimeout(150);
const f1 = await fit(), rel = await page.textContent('#bpBody [data-mg="cfire"]').catch(() => '');
info('640x360, a coach\'s card: ' + JSON.stringify(f1));
ok(f1.fits && f1.tabs && !f1.long.length && !f1.cut.length && /RELEASE \(\$[\d,]+\)/.test(rel), '640x360: the five tabs fit, and a coach\'s card with what he\'s good and poor at, and RELEASE (' + rel + '), nothing long or cut on it');
await page.click('#bldgPanel .bpTopBack'); await page.waitForTimeout(150);
// the academy's COACH tab: the youth coach's post and the two men for it, what each is good and poor at (fields)
await K(`(()=>{ const d=CAREER.data; d.lv.academy=1; d.lv.club=3; d.ycand=null; d.budget=1e6; const Y=youthCands(d); Y[0].r=5; delete Y[0].up; delete Y[0].dn; coachSpec(Y[0]); window.YCID=Y[0].id; mgSave(d); renderHub(); return 1; })()`);
await page.click('#chCampus [data-bldg="academy"]'); await page.waitForSelector('#bldgPanel.show'); await page.waitForTimeout(120);
const atabs = await page.$$eval('#bpTabs .bpTab', ns => ns.map(n => n.textContent.trim()));
await page.click('#bldgPanel .bpTab:text-is("Coach")'); await page.waitForTimeout(150);
const y0 = await page.textContent('#bpBody .mgHint'), yc = await K('window.YCID');
await page.evaluate(id => document.querySelector(`#bpBody .mgRow[data-cid="${id}"]`).click(), yc); await page.waitForTimeout(120);
const yf = await fit(), ycard = await page.innerText('#bpBody .mgPaneR .mgCard').catch(() => '');
await page.click('#bpBody [data-mg="chire"]'); await page.waitForTimeout(150);
const y1 = await page.textContent('#bpBody .mgHint'), yk = await K(`CAREER.data.staff.filter(c=>c.k==='youth').length`);
info('the academy\'s coach: ' + JSON.stringify({ atabs, y0, card: ycard.split('\n').join(' / '), y1, yf }));
ok(atabs.join() === 'Prospects,Coach,Facilities' && /No youth coach/.test(y0) && /youth coach · rated 5\.0/.test(ycard) && /GOOD AT/.test(ycard) && /POOR AT/.test(ycard) && /(Fitness|Technical|Finishing|Defending|Keeping)/.test(ycard)
   && /trains the academy/.test(y1) && yk === 1 && yf.fits && !yf.long.length && !yf.cut.length,
  'the academy\'s COACH tab: its own youth coach (' + y0.trim() + '), his card -- good and poor at whole fields -- fitting a phone, HIRE (' + y1.trim() + ')');
await page.click('#bldgPanel .bpTopBack'); await page.waitForTimeout(150);
await page.click('#chCampus [data-bldg="club"]'); await page.waitForSelector('#bldgPanel.show'); await page.click('#bldgPanel .bpTab:text-is("Squad")'); await page.waitForTimeout(150);
const ids = await K(`(()=>{ const d=CAREER.data, m=d.roster.find(p=>p.role==='MID'), g=d.roster.find(p=>p.role==='GK'); m.fo=null; g.fo=null; mgSave(d); return [m.id,g.id]; })()`);
const cycle = async id => { await page.evaluate(id => document.querySelector(`.mgPaneL .mgRow[data-pid="${id}"]`).click(), id); await page.waitForTimeout(120);
  const seen = []; for(let i = 0; i < 7; i++){ const t = (await page.textContent('#bpBody [data-mg="focus"]')).trim(); seen.push(t); if(i && t === 'BALANCED') break;
    await page.click('#bpBody [data-mg="focus"]'); await page.waitForTimeout(80); } return seen.join(' > '); };
const cm = await cycle(ids[0]); const fm = await fit(); const cg = await cycle(ids[1]);
const fo = await K(`CAREER.data.roster.find(p=>p.id===${ids[0]}).fo`);
info('focus: ' + cm + ' | keeper: ' + cg);
ok(cm === 'BALANCED > FITNESS > TECHNICAL > FINISHING > DEFENDING > BALANCED' && cg === 'BALANCED > FITNESS > KEEPING > BALANCED' && fo === null,
  'his FOCUS on his card, a tap a step, a coach\'s field each: balanced, fitness, technical, finishing, defending (a keeper: fitness, keeping), back to balanced');
ok(fm.fits && !fm.long.length && !fm.cut.length, '640x360: a man\'s card with his FOCUS fits, nothing long or cut on it' + (fm.fits && !fm.long.length && !fm.cut.length ? '' : ' ' + JSON.stringify(fm)));

process.exitCode = rep.finish() ? 1 : 0;
await browser.close();
