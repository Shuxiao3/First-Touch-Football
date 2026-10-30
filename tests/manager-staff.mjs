// FOOTBALL CLASSIC, THE STAFF AND TRAINING FOCUS: coaches for fitness, technique, tactics and goalkeeping, a post for
// each of the training pitch's levels, and the academy's youth coach. Rated 1 to 10, dearer the better, the best
// won't come to a small club; hiring needs a free post, one of a kind, four weeks' wages in the budget; releasing one
// pays four weeks. Their wages go on the bill. Your training of each kind of attribute is the pitch's and its coach's
// (coaches develop players, nothing else: injuries and stamina on the day are the physio's), the youth coach a better
// academy. A man's FOCUS
// (his card) puts his training on one kind: more there, a little less elsewhere. The Staff tab and the cards fit a
// phone. On a copy of the game that lets the test reach it.
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
await K(`(()=>{ const d=CAREER.data; d.story={vet:2,kid:2}; window.HV=(o)=>{ const k=['lr','pro','ad','rs','du','ch','te','am','lo'], v=Object.assign({lr:5.5,pro:5.5,ad:5.5,rs:5.5,du:5.5,ch:5.5,te:5.5,am:5.5,lo:5.5},o); return k.map(x=>devEnc(v[x])).join(''); }; mgSave(d); return 1; })()`);

// --- posts and the men to hire ----------------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data; d.lv.train=1; d.lv.academy=0; d.cand=null; const L1=staffCands(d), p1=staffPosts(d), y1=youthPost(d);
  d.lv.academy=1; d.cand=null; const L2=staffCands(d), y2=youthPost(d), w0=d.weeks; d.weeks=w0+3; const same=staffCands(d)===L2; d.weeks=w0+4; const fresh=staffCands(d)!==L2; d.weeks=w0;
  d.lv.train=3; const p3=staffPosts(d); d.lv.train=4; const p4=staffPosts(d); d.lv.train=1;
  const all=L1.concat(L2), halves=all.every(c=>c.r>=1&&c.r<=10&&c.r*2===Math.round(c.r*2)), pay=all.every(c=>Math.abs(c.wage-staffWage(c.r))<=Math.max(10,staffWage(c.r)*0.2));
  return { n1:L1.length, youth1:L1.filter(c=>c.k==='youth').length, p1, y1, n2:L2.length, youth2:L2.filter(c=>c.k==='youth').length, y2, same, fresh, p3, p4, halves, pay,
    w:[staffWage(1),staffWage(5),staffWage(10)], kinds:[...new Set(all.map(c=>c.k))].sort().join(','), mean:+(L1.concat(L2).reduce((a,c)=>a+c.r,0)/all.length).toFixed(1) }; })()`);
info('posts and the men to hire: ' + JSON.stringify(r));
ok(r.p1 === 1 && r.p3 === 3 && r.p4 === 4 && r.y1 === 0 && r.y2 === 1, 'a post for each of the training pitch\'s levels (1, 3, 4), and the youth coach\'s with the academy');
ok(r.n1 === 6 && r.youth1 === 0 && r.n2 === 7 && r.youth2 === 1 && r.same && r.fresh, 'six men to hire, and a youth coach once there\'s an academy; the same men for four weeks, then new ones');
ok(r.halves && r.pay && r.w[0] < r.w[1] && r.w[1] < r.w[2], 'rated 1 to 10 in halves, the better the dearer (' + r.w.join(', ') + ' a week for a 1, a 5, a 10)');

// --- hiring and releasing ---------------------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data; d.lv.train=1; d.lv.academy=1; d.staff=[]; d.budget=1e6; d.cand=null; staffCands(d);
  const mk=(k,rr)=>{ const c={id:(d.staffSeq=(d.staffSeq||0)+1),name:'Coach '+k+rr,k,r:rr,wage:staffWage(rr)}; d.cand.list.push(c); return c; };
  const a=mk('tec',5), b=mk('fit',4), big=mk('tac',7), y=mk('youth',4), dup=mk('tec',3);
  const e1=mgHireCoach(d,a.id), e2=mgHireCoach(d,b.id); d.lv.train=2;
  const e3=mgHireCoach(d,dup.id), e4=mgHireCoach(d,big.id); d.budget=10; const e5=mgHireCoach(d,b.id); d.budget=1e6;
  const e6=mgHireCoach(d,b.id); d.lv.academy=0; const e7=mgHireCoach(d,y.id); d.lv.academy=1; const e8=mgHireCoach(d,y.id);
  const gone=!d.cand.list.includes(a), news=d.news[0].t;
  return { e1,e2,e3,e4,e5,e6,e7,e8, n:d.staff.length, kinds:d.staff.map(c=>c.k).join(','), gone, news, cap1:staffCap(d) }; })()`);
info('hiring: ' + JSON.stringify(r));
ok(r.e1 === null && /No post free/.test(r.e2) && /You have a technique coach/.test(r.e3) && /won’t come to League 2/.test(r.e4) && /Not enough budget/.test(r.e5),
  'hiring: a free post (one at level 1: "' + r.e2 + '"), one of a kind ("' + r.e3 + '"), the best won\'t come to League 2 ("' + r.e4 + '", above ' + r.cap1 + '), four weeks\' wages in the budget');
ok(r.e6 === null && /needs the academy/.test(r.e7) && r.e8 === null && r.n === 3 && r.kinds === 'tec,fit,youth' && r.gone && /joins Coach Town as youth coach/.test(r.news),
  'a second post at level 2; the youth coach in the academy\'s own post; the hired man leaves the list and makes the news (' + r.news + ')');
r = await K(`(()=>{ const d=CAREER.data, f=computeFinance(d).wageWk, pw=d.roster.reduce((a,p)=>a+(p.wage||0),0), sw=d.staff.reduce((a,c)=>a+c.wage,0);
  const c=d.staff.find(x=>x.k==='fit'), b0=d.budget, e=mgReleaseCoach(d,c.id); return { bill:f===pw+sw, sw, e, paid:b0-d.budget, wage4:c.wage*4, left:d.staff.length, news:d.news[0].t }; })()`);
ok(r.bill && r.sw > 0 && r.e === null && r.paid === r.wage4 && r.left === 2 && /leaves Coach Town/.test(r.news), 'their wages go on the bill (' + r.sw + ' a week); releasing one pays four weeks (' + r.paid + ')');

// --- training, kind by kind ---------------------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, f=o=>Object.fromEntries(Object.entries(o).map(([k,v])=>[k,+v.toFixed(3)])), S=d.staff; d.staff=[]; d.lv.train=1; const t1=f(devTrainYours(d)); d.lv.train=4; const t4=f(devTrainYours(d));
  d.staff=[{id:91,k:'tec',r:8,wage:100,name:'x'},{id:92,k:'gk',r:10,wage:100,name:'y'},{id:93,k:'tac',r:2,wage:100,name:'z'}]; const tc=f(devTrainYours(d)); d.staff=S; d.lv.train=2;
  return { t1, t4, tc }; })()`);
info('training: ' + JSON.stringify(r));
ok(Object.values(r.t1).every(v => v === 0.65) && Object.values(r.t4).every(v => v === 0.86), 'the pitch\'s training: 0.65 at level 1 with no coaches (as it always was), 0.86 at level 4');
ok(r.tc.tec === 1.14 && r.tc.gk === 1.15 && r.tc.men === 0.9 && r.tc.phy === 0.86, 'and its coaches\': a technique coach rated 8 lifts the touch to 1.14, a 10 in goal to the most there is (1.15), even a poor tactics coach (2) a little (0.9); no fitness coach, the pitch\'s');

// --- what it does: his touch with the coach, more of his focus ---------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, base={phy:.65,tec:.65,men:.65,gk:.65}, coach={phy:.65,tec:1.15,men:.65,gk:.65}, sum={};
  const grp=(p,g)=>{ const st=devUnpack(p.at), pg=devUnpackPg(p.pg); return DEV_KEYS.filter(k=>devGroup(k)===g).reduce((s,k)=>s+st[k]*2+pg[DEV_KEYS.indexOf(k)],0); };
  const runs={plain:[base,null], coach:[coach,null], ftec:[base,'tec'], fphy:[base,'phy']};
  for(const k in runs) sum[k]={phy:0,tec:0,men:0};
  for(let s=0;s<6;s++){ const a=mgNewPlayer(d,'MID',58,19,{pot:84,sub:'CM'}); a.hv=HV({}); a.seed=1000+s*77; a.mo=0; a.fm=6.6; a.mor=6.5; const j=JSON.stringify(a);
    for(const k in runs){ const p=JSON.parse(j); p.fo=runs[k][1]; const g0={phy:grp(p,'phy'),tec:grp(p,'tec'),men:grp(p,'men')};
      for(let i=0;i<8;i++){ d.weeks=700+3*i; p.mw=4; devTick(d,p,{Tg:runs[k][0],gw:4}); }
      for(const g of ['phy','tec','men']) sum[k][g]+=grp(p,g)-g0[g]; } }
  for(const k in sum) for(const g in sum[k]) sum[k][g]=+sum[k][g].toFixed(1); return sum; })()`);
info('six 19-year-olds, 24 weeks (half points by kind): ' + JSON.stringify(r));
ok(r.coach.tec > r.plain.tec * 1.2 && Math.abs(r.coach.phy - r.plain.phy) <= Math.max(1, Math.abs(r.plain.phy) * 0.05) && Math.abs(r.coach.men - r.plain.men) <= Math.max(1, Math.abs(r.plain.men) * 0.05),
  'a technique coach: his touch comes on more (' + r.coach.tec + ' against ' + r.plain.tec + '), his legs and his head as they would (' + r.coach.phy + ', ' + r.coach.men + ')');
ok(r.ftec.tec > r.plain.tec * 1.15 && r.ftec.phy < r.plain.phy && r.ftec.men < r.plain.men && r.fphy.phy > r.plain.phy * 1.15 && r.fphy.tec < r.plain.tec,
  'his focus: on his touch, it comes on more (' + r.ftec.tec + '), the rest a little less (' + r.ftec.phy + ', ' + r.ftec.men + '); on his legs, the same the other way (' + r.fphy.phy + ' against ' + r.plain.phy + ')');

// --- the fitness coach and the youth coach ------------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, p=d.roster[3], S=d.staff; INJ_OFF=false; p.hv=HV({}); p.age=26; delete p.injB; delete p.cond; d.staff=[];
  const r0=injRisk(d,p,1,null); d.staff=[{id:95,k:'fit',r:8,wage:100,name:'f'}]; const r8=injRisk(d,p,1,null);
  const rest=()=>{ for(const q of d.roster) q.cond=0.5; mgRest(d,1); return d.roster[3].cond; }; const c8=rest(); d.staff=[]; const c0=rest(); for(const q of d.roster) delete q.cond;
  let seen=null; const keep=devTick; devTick=(d,p,x)=>{ if(seen==null&&(d.youth||[]).includes(p)) seen=x.T; return 0; };
  d.lv.academy=1; d.youth=d.youth&&d.youth.length?d.youth:[mgNewPlayer(d,'MID',45,16,{pot:70,sub:'CM'})]; mgDevelop(d); const y0=seen; seen=null;
  d.staff=[{id:96,k:'youth',r:6,wage:100,name:'y'}]; mgDevelop(d); const y6=seen; devTick=keep; d.staff=S;
  return { r:+(r8/r0).toFixed(3), c0:+c0.toFixed(4), c8:+c8.toFixed(4), y0:+y0.toFixed(2), y6:+y6.toFixed(2) }; })()`);
info('the fitness and youth coaches: ' + JSON.stringify(r));
ok(r.r === 1 && r.c8 === r.c0, 'a fitness coach develops a man\'s legs and nothing else: no fewer injuries (risk x' + r.r + '), no quicker back between games (' + r.c8 + ', ' + r.c0 + ' after a day) -- those are the physio\'s');
ok(Math.abs(r.y6 - r.y0 - 0.24) < 0.001, 'a youth coach rated 6: the academy trains better (' + r.y0 + ' to ' + r.y6 + ')');

// --- the Staff tab -----------------------------------------------------------------------------------------------------------------------
await K(`(()=>{ const d=CAREER.data; d.lv.train=2; d.lv.academy=1; d.staff=[]; d.cand=null; d.budget=1e6; const L=staffCands(d); L[0].r=Math.min(L[0].r,5); L[0].k='tec'; L[1].r=Math.min(L[1].r,5); L[1].k='fit'; L[1].name='Bartholomew Featherstonehaugh'; mgSave(d); renderHub(); return 1; })()`);
await page.click('#chCampus [data-bldg="train"]'); await page.waitForSelector('#bldgPanel.show'); await page.waitForTimeout(120);
const tabs = await page.$$eval('#bpTabs .bpTab', ns => ns.map(n => n.textContent.trim()));
await page.click('#bldgPanel .bpTab:text-is("Staff")'); await page.waitForTimeout(150);
const hint0 = await page.textContent('#bpBody .mgHint');
const c0 = await K('CAREER.data.cand.list[1].id');
await page.click(`#bpBody .mgRow[data-cid="${c0}"]`); await page.waitForTimeout(120);
const cardTxt = await page.innerText('#bpBody .mgPaneR .mgCard').catch(() => '');
await page.click('#bpBody [data-mg="chire"]'); await page.waitForTimeout(150);
r = await K(`(()=>{ const d=CAREER.data; return { n:d.staff.length, k:d.staff[0]&&d.staff[0].k }; })()`);
const hint1 = await page.textContent('#bpBody .mgHint');
ok(tabs.join() === 'Tactics,Selection,Subs,Staff,Pitch' && /^0 of 2 posts filled · youth 0 of 1$/.test(hint0.trim()) && /fitness coach · rated/.test(cardTxt) && /HIRE/.test(cardTxt)
   && r.n === 1 && r.k === 'fit' && /^1 of 2 posts filled/.test(hint1.trim()),
  'the Training building\'s Staff tab: ' + hint0.trim() + '; a man\'s card (' + cardTxt.split('\n').slice(0, 2).join(' / ') + '), HIRE, and he\'s in a post (' + hint1.trim() + ')');

// ...and on a phone: the tab bar, a coach's card, a man's card with his FOCUS, all fit, nothing long on them
await page.setViewportSize({ width: 640, height: 360 }); await page.waitForTimeout(250);
const fit = () => page.evaluate(() => { const P = document.querySelector('.mgPaneR .mgPaneScroll'), c = P && P.querySelector('.mgCard'), T = document.getElementById('bpTabs');
  return { fits: !!P && P.scrollHeight <= P.clientHeight + 1 && P.scrollWidth <= P.clientWidth + 1, tabs: !!T && T.scrollWidth <= T.clientWidth + 1,
    long: c ? [...c.querySelectorAll('.mgHint')].concat([...c.querySelectorAll('*')].filter(e => !e.closest('.mgCardHead') && !e.children.length && e.textContent.trim().length > 32)).map(e => e.textContent.trim().slice(0, 40)) : ['no card'],
    cut: c ? [...c.querySelectorAll('.mgFact b')].filter(b => b.scrollWidth > b.clientWidth + 1).map(b => b.textContent) : [] }; });
const sid = await K('(MGUI.csel=null, CAREER.data.staff[0].id)');
await page.evaluate(id => document.querySelector(`#bpBody .mgRow[data-cid="${id}"]`).click(), sid); await page.waitForTimeout(150);
const f1 = await fit(), rel = await page.textContent('#bpBody [data-mg="cfire"]').catch(() => '');
info('640x360, a coach\'s card: ' + JSON.stringify(f1));
ok(f1.fits && f1.tabs && !f1.long.length && !f1.cut.length && /RELEASE \(\$[\d,]+\)/.test(rel), '640x360: the five tabs fit, and a coach\'s card, with RELEASE (' + rel + '), nothing long on it');
await page.click('#bldgPanel .bpTopBack'); await page.waitForTimeout(150);
await page.click('#chCampus [data-bldg="club"]'); await page.waitForSelector('#bldgPanel.show'); await page.click('#bldgPanel .bpTab:text-is("Squad")'); await page.waitForTimeout(150);
const ids = await K(`(()=>{ const d=CAREER.data, m=d.roster.find(p=>p.role==='MID'), g=d.roster.find(p=>p.role==='GK'); m.fo=null; g.fo=null; mgSave(d); return [m.id,g.id]; })()`);
const cycle = async id => { await page.evaluate(id => document.querySelector(`.mgPaneL .mgRow[data-pid="${id}"]`).click(), id); await page.waitForTimeout(120);
  const seen = []; for(let i = 0; i < 6; i++){ const t = (await page.textContent('#bpBody [data-mg="focus"]')).trim(); seen.push(t); if(i && t === 'BALANCED') break;
    await page.click('#bpBody [data-mg="focus"]'); await page.waitForTimeout(80); } return seen.join(' > '); };
const cm = await cycle(ids[0]); const fm = await fit(); const cg = await cycle(ids[1]);
const fo = await K(`CAREER.data.roster.find(p=>p.id===${ids[0]}).fo`);
info('focus: ' + cm + ' | keeper: ' + cg);
ok(cm === 'BALANCED > PHYSICAL > TECHNIQUE > MENTAL > BALANCED' && cg === 'BALANCED > PHYSICAL > TECHNIQUE > MENTAL > KEEPING > BALANCED' && fo === null,
  'his FOCUS on his card, a tap a step: balanced, physical, technique, mental (and a keeper\'s keeping), back to balanced');
ok(fm.fits && !fm.long.length && !fm.cut.length, '640x360: a man\'s card with his FOCUS fits, nothing long or cut on it' + (fm.fits && !fm.long.length && !fm.cut.length ? '' : ' ' + JSON.stringify(fm)));

process.exitCode = rep.finish() ? 1 : 0;
await browser.close();
