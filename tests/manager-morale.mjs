// FOOTBALL CLASSIC, CHARACTER AND MORALE: traits drawn from a man's hidden values (never his numbers), each with a good
// side and a cost, coming out over his first weeks at the club and sooner when you check on him. Morale, his and the
// side's: the side moves with results against what was expected, softened by a leader's armband and sharpened by a
// hot-head's; each man by his minutes against what he expects, his form, the side's mood, his resilience. Match day:
// high, a little more stamina and composure; low, less of those and of his reading of the game (a lot less at rock
// bottom), played or simulated. A long low costs his touch in training. An unhappy, ambitious man asks to leave (the
// market comes for him, he won't renew); a loyal servant renews for less and may not go. The captain and his vice: the
// side's strongest leaders till you name them. Two check-ins a Monday. On a copy of the game that lets the test reach it.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  let INJ_OFF=false;', '  let INJ_OFF=true;');
patch('  // ===== END MANAGER CAREER', '  window.__K={ ev:s=>eval(s) };\n  // ===== END MANAGER CAREER');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-mor-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
const K = s => page.evaluate(s => window.__K.ev(s), s);
let r;
await page.emulateMedia({ reducedMotion: 'reduce' });
await page.click('#smItems [data-act="new"]'); await page.waitForTimeout(150);
await page.click('#newSlotList .slotBtn >> nth=0'); await page.waitForTimeout(100);
await page.waitForSelector('#mgrMaker.on', { timeout: 4000 });
await page.fill('#mgName', 'Sam Okafor'); await page.fill('#mgClubIn', 'Mood Town');
await page.click('#mgGo'); await page.waitForSelector('#careerHub.show', { timeout: 6000 });
// hidden values by letter, in the order lr pro ad rs du ch te am lo ('a' 1 ... 'j' 5.5 ... 's' 10)
await K(`(()=>{ const d=CAREER.data; d.story={vet:2,kid:2,phone:2}; d.lv.market=1; window.HV=(o)=>{ const k=['lr','pro','ad','rs','du','ch','te','am','lo'], v=Object.assign({lr:5.5,pro:5.5,ad:5.5,rs:5.5,du:5.5,ch:5.5,te:5.5,am:5.5,lo:5.5},o); return k.map(x=>devEnc(v[x])).join(''); }; mgSave(d); return 1; })()`);

// --- traits: from his hidden values -------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, p=d.roster[0], t=o=>{ p.hv=HV(o); return traitsOf(p,d).map(x=>x.n).join('|'); };
  const out={ plain:t({}), leader:t({ch:8,te:7}), charis:t({ch:8,te:4.5}), hot:t({te:2}), calm:t({te:8.5}), ambit:t({am:8.5}), quiet:t({pro:8,ch:3}), poor:t({pro:2}), determ:t({rs:8,am:7}),
    frust:t({am:7.5,te:3.5}), team:t({am:4,lo:7,te:6}), incon:t({te:3,rs:3}) };
  p.since=d.season; out.loyalNew=t({lo:8}); p.since=d.season-3; out.loyalOld=t({lo:8}); p.since=d.season;
  const tr=TRAITS.find(x=>x.k==='leader'); out.sides=!!(tr.up&&tr.down); out.short=TRAITS.every(x=>x.n.length<=24&&x.up.length<=28&&x.down.length<=28);
  return out; })()`);
info('traits: ' + JSON.stringify(r));
ok(r.plain === '' && r.leader === 'Natural Leader' && r.charis === 'Charismatic' && /Hot-Headed/.test(r.hot) && r.calm === 'Calm Under Pressure' && r.ambit === 'Highly Ambitious'
   && r.quiet === 'Quiet Professional' && r.poor === 'Poor Trainer' && /Determined/.test(r.determ) && /Easily Frustrated/.test(r.frust) && r.team === 'Team Player' && /Inconsistent/.test(r.incon),
  'traits drawn from his hidden values: an ordinary man none; a leader, a hot-head, the calm, the ambitious, the quiet professional, the poor trainer, the determined, the easily frustrated, the team player, the inconsistent');
ok(r.loyalNew === '' && r.loyalOld === 'Loyal Servant' && r.sides && r.short, 'a Loyal Servant only after three seasons at the club; each trait a good side and a cost, all in a few words');
r = await K(`(()=>{ const d=CAREER.data, p=d.roster[1]; p.hv=HV({ch:8,te:7,am:8.5}); p.kt=0; p.kw=0; const n0=(p.kt||0); for(let i=0;i<4;i++){ d.wday='mon'; morWeek(d); } return { n0, n4:p.kt, of:traitsOf(p,d).length }; })()`);
ok(r.n0 === 0 && r.n4 === 1 && r.of === 2, 'yours come out over his first weeks: none known at first, one after four weeks (of his ' + r.of + ')');

// --- the side's mood: results against what was expected; the captain's character -------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, s=mgStrength(d,d.clubId); const run=(cap,res,opp)=>{ d.tm=6.5; const c=d.roster.find(x=>x.id===d.cap); c.hv=HV(cap); morAfterGame(d,{win:res===1,draw:res===0,oppOvr:opp}); return +(d.tm-6.5).toFixed(2); };
  const lu=ensureLineup(d); d.cap=d.roster[lu.atk[0]].id;
  return { upset:run({},1,s+10), expected:run({},1,s-10), shock:run({},-1,s-10), leaderLoss:run({ch:8.5,te:7},-1,s-10), hotLoss:run({te:2},-1,s-10) }; })()`);
info('the side after a game: ' + JSON.stringify(r));
ok(r.upset > r.expected && r.expected > 0 && r.shock < 0 && r.leaderLoss > r.shock && r.hotLoss < r.shock, 'a win over a better side lifts it most (' + r.upset + ', an expected one ' + r.expected + '); a shock loss sinks it (' + r.shock + '), less under a Natural Leader\'s armband (' + r.leaderLoss + '), more under a hot-head\'s (' + r.hotLoss + ')');

// --- his week: minutes against what he expects ------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, lu=ensureLineup(d), star=d.roster[lu.atk[0]], sub=d.roster[lu.bench[2]];
  const wk=(p,share,o)=>{ p.hv=HV(o||{}); p.mor=6.5; p.fm=6.6; d.tm=6.5; d.mgw=2; for(const q of d.roster) q.wmw=0; p.wmw=2*share; morWeek(d); return +(p.mor-6.5).toFixed(2); };
  return { benchedAmbitious:wk(star,0,{am:8.5}), benchedFrust:wk(star,0,{am:8,te:3}), playing:wk(star,1,{}), benchedTeam:wk(sub,0,{am:4,lo:7,te:6}) }; })()`);
info('his week: ' + JSON.stringify(r));
ok(r.benchedAmbitious < -0.2 && r.benchedFrust < r.benchedAmbitious && r.playing >= -0.05 && r.benchedTeam > r.benchedAmbitious, 'a week on the bench: an ambitious man down ' + r.benchedAmbitious + ', the easily frustrated more (' + r.benchedFrust + '), a team player hardly (' + r.benchedTeam + '); playing every game, he\'s fine (' + r.playing + ')');

// --- match day ------------------------------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, lu=ensureLineup(d), p=d.roster[lu.atk[1]], st=mgStats(p), entry=()=>careerLineupYours(d).squad.find(e=>e.ri===lu.atk[1]).stats;
  p.mor=9.6; const hi=entry(); p.mor=1; const lo=entry(); p.mor=6.5; const mid=entry(); const s0=mgStrength(d,d.clubId); for(const q of d.roster) q.mor=1; const sLow=mgStrength(d,d.clubId); for(const q of d.roster) q.mor=9.6; const sHigh=mgStrength(d,d.clubId); for(const q of d.roster) q.mor=6.5;
  return { hi:[hi.stamina-st.stamina,hi.composure-st.composure,hi.offIQ-st.offIQ], lo:[lo.stamina-st.stamina,lo.composure-st.composure,lo.offIQ-st.offIQ,lo.defIQ-st.defIQ], mid:mid.stamina===st.stamina&&mid.offIQ===st.offIQ, s:[+(sLow-s0).toFixed(1),+(sHigh-s0).toFixed(1)] }; })()`);
info('match day: ' + JSON.stringify(r));
ok(r.hi.join() === '1,1,0' && r.lo.every((v, i) => v < 0 && v >= -1.5) && r.mid, 'match day: on top of the world, +1 stamina and composure (his reading of the game as it is); at rock bottom, down to -1.5 on stamina, composure, Off IQ and Def IQ; settled, as he is');
ok(r.s[0] < 0 && r.s[1] > 0, 'and a simulated game feels it: the side ' + r.s[0] + ' on paper all low, +' + r.s[1] + ' all high');

// --- development: a long low costs his touch ------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, mk=()=>{ const p=mgNewPlayer(d,'MID',64,27,{pot:64,sub:'CM'}); p.hv=HV({}); p.seed=4242; p.mo=0; p.fm=6.6; return p; }, a=mk(), b=JSON.parse(JSON.stringify(a));
  a.mor=2; b.mor=6.5; const tec=p=>{ const st=devUnpack(p.at), pg=devUnpackPg(p.pg); return DEV_KEYS.filter(k=>devGroup(k)==='tec').reduce((s,k)=>s+st[k]*2+pg[DEV_KEYS.indexOf(k)],0); }, t0=tec(a);
  for(let i=0;i<8;i++){ d.weeks=500+3*i; a.mw=b.mw=4; devTick(d,a,{T:0.75,gw:4}); devTick(d,b,{T:0.75,gw:4}); } return { low:+(tec(a)-t0).toFixed(2), ok:+(tec(b)-t0).toFixed(2) }; })()`);
ok(r.low < r.ok - 1, 'twenty-four weeks unhappy at 27: his touch ' + r.low + ' half points, against ' + r.ok + ' for his settled twin');

// --- wanting out ------------------------------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, p=d.roster[4]; p.hv=HV({am:8.5}); let weeks=0; for(;weeks<30&&!p.wantsOut;weeks++){ p.mor=2; d.wday='mon'; morWeek(d); }
  const news=d.news.some(x=>x.t===p.name+' wants to leave '+d.clubName+'.'); d.phase='summer'; d.offers=[]; for(let i=0;i<6;i++) mgAiBids(d,1.5); const bids=d.offers.filter(o=>o.pid===p.id).length;
  const renew=mgRenew(d,d.roster.indexOf(p),2); p.mor=7; d.wday='mon'; morWeek(d); const settled=!p.wantsOut;
  return { weeks, news, bids, renew, settled }; })()`);
ok(r.news && r.weeks < 30 && r.bids >= 1 && /won’t sign/.test(r.renew) && r.settled, 'an unhappy, ambitious man asks to leave (' + r.weeks + ' weeks): the news says so, clubs bid for him as if he were listed (' + r.bids + '), he won\'t renew ("' + r.renew + '"); happy again, he settles');

// --- the loyal servant ----------------------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, p=d.roster[5]; p.hv=HV({lo:8.5}); p.since=d.season-4; p.ovr=Math.max(p.ovr,62); const full=mgDemand(d,p,false), w=mgRenewWage(d,p); let kept=0;   // (good enough to ask more than the least wage: 15% off shows)
  for(let i=0;i<40;i++){ const c=mgAiClubs(d).find(k=>k.budget>100000&&k.players.length<MG_MAX)||mgAiClubs(d)[0]; c.budget=Math.max(c.budget,1e7); d.offers=[{id:9000+i,pid:p.id,club:c.id,fee:1000,wk:d.wkN}]; const err=mgAcceptOffer(d,9000+i);
    if(err&&/doesn’t want to go/.test(err)) kept++; else if(!err){ const k=Object.values(d.world.clubs).find(x=>x.players.includes(p)); k.players.splice(k.players.indexOf(p),1); mgRosterAdd(d,p); p.since=d.season-4; } }
  return { full, w, kept }; })()`);
ok(r.w < r.full && r.kept >= 10 && r.kept <= 30, 'a Loyal Servant renews for less (' + r.w + ' against ' + r.full + ') and half the time won\'t go (' + r.kept + ' of 40 sales refused)');

// --- the armband ------------------------------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data; d.cap=null; d.vice=null; mgCaptains(d); const by=d.roster.slice().sort((a,b)=>leadOf(b,d)-leadOf(a,d));
  const auto=d.cap===by[0].id&&d.vice===by[1].id; const p=d.roster.find(x=>x.id!==d.cap&&x.id!==d.vice); const sen=d.roster.find(x=>x!==p&&x.id!==d.cap);
  sen.hv=HV({am:8,ch:9}); sen.age=30; p.hv=HV({ch:4}); p.mor=6.5; sen.mor=6.5; const err=mgSetCaptain(d,p.id,false);
  return { auto, err, cap:d.cap===p.id, pUp:p.mor, senDown:sen.mor, news:d.news[0].t }; })()`);
ok(r.auto && !r.err && r.cap && r.pUp === 7.5 && r.senDown === 5.5 && /new captain/.test(r.news), 'the armband: till you name them, the side\'s strongest leaders; named, he\'s lifted (6.5 to ' + r.pUp + '), and an ambitious senior passed over minds (' + r.senDown + ')');
await page.click('#chCampus [data-bldg="club"]'); await page.waitForSelector('#bldgPanel.show'); await page.click('#bldgPanel .bpTab:text-is("Squad")'); await page.waitForTimeout(120);
const capName = await K('CAREER.data.roster.find(p=>p.id===CAREER.data.cap).name');
await page.click(`#bpBody .mgRow:has-text("${capName}")`); await page.waitForTimeout(150);
const head = await page.textContent('#bpBody .mgCardName');
ok(/\(C\)$/.test(head.trim()), 'his card says so: ' + head.trim());

// --- check-ins: two a Monday --------------------------------------------------------------------------------------------------------
await page.click('#bldgPanel .bpTopBack'); await page.waitForTimeout(150);
await K(`(()=>{ const d=CAREER.data; d.phase='league'; d.wday='mon'; d.ci=null; for(const p of d.roster){ p.kt=0; p.mor=6.5; } d.roster[2].hv=HV({ch:8,te:7}); d.roster[2].mor=3; mgSave(d); renderHub(); return 1; })()`);
const btn = await page.textContent('#chBottom');
ok(/CHECK-INS 2/.test(btn), 'a Monday on the hub: CHECK-INS 2 beside the week\'s button');
await page.click('#chBottom [data-mg="checkins"]'); await page.waitForSelector('#bldgPanel.show'); await page.waitForTimeout(120);
const n2 = await K('CAREER.data.roster[2].name');
await page.click(`#bpBody .mgRow:has-text("${n2}")`); await page.waitForTimeout(120);
await page.click('#bpBody [data-mg="checkin"]'); await page.waitForTimeout(150);
const box = await page.innerText('#bpBody .ciBox').catch(() => '');
r = await K(`(()=>{ const d=CAREER.data, p=d.roster[2]; return { mor:p.mor, kt:p.kt, left:ciLeft(d) }; })()`);
info('a check-in: ' + JSON.stringify({ box, r }));
ok(/^Unhappy · /.test(box) && /Fitness \d+%/.test(box) && /in training/.test(box) && /✓ Natural Leader/.test(box) && r.mor === 3.8 && r.kt === 1 && r.left === 1,
  'checking on an unhappy man: how he\'s feeling and why, his fitness, the coaches\' word, a trait out ("' + box.split('\n').join(' / ') + '"); it lifts him (3 to ' + r.mor + '); one left');
r = await K(`(()=>{ const d=CAREER.data; const a=mgCheckIn(d,d.roster[2].id), b=mgCheckIn(d,d.roster[3].id), c=mgCheckIn(d,d.roster[4].id); d.wday='sat'; const e=mgCheckIn(d,d.roster[5].id); d.wday='mon'; return [a.err,b.err||'ok',c.err,e.err]; })()`);
ok(/seen him/.test(r[0]) && r[1] === 'ok' && /your two/.test(r[2]) && /Monday/.test(r[3]), 'the same man twice, no; a second, yes; a third, no ("' + r[2] + '"); not on a matchday ("' + r[3] + '")');
const longest = await page.$$eval('#bpBody .mgCard *', ns => Math.max(...ns.filter(e => !e.children.length).map(e => e.textContent.trim().length)));
ok(longest <= 32, 'nothing on the card longer than a short line (' + longest + ' characters)');

process.exitCode = rep.finish() ? 1 : 0;
await browser.close();
