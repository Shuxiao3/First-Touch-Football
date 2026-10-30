// FOOTBALL CLASSIC, PLAYER DEVELOPMENT: a man's 25 attributes are his own (stored, a letter a half point) and his
// rating is what they rate; every third week each moves along a hidden meter -- filled by the room under its ceiling
// (his potential, hidden: reached, never passed), his age, his training, his minutes (diminishing returns), his
// professionalism, how quickly he learns, how much it matters to him, and his momentum; drained by age (his legs from 29,
// his touch from 31, reading the game never) and by bad training -- and below his best it comes back faster. The dice
// are his, the season's and the week's (a reload gives the same). The season's end grows nobody now; the review says how
// far each of yours came. Over seasons the world neither balloons nor wastes away. On a copy that lets the test reach it.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  // ===== END MANAGER CAREER', '  window.__K={ ev:s=>eval(s) };\n  // ===== END MANAGER CAREER');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-dev-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
const K = s => page.evaluate(s => window.__K.ev(s), s);
let r;
await K(`(()=>{ window.D=mgNewCareer({slot:'1',manager:'T',clubName:'Dev Town',colors:['#c00','#fff'],code:'DEV',crest:{s:0,c:['#c00','#fff','#000']}}); D.story={vet:2,kid:2};
  // a man of a given age and rating, his ceiling given, made as the world makes them
  window.XMK=(age,ovr,pot,role)=>{ const p=mgNewPlayer(D,role||'MID',ovr,age,{pot:pot??ovr,sub:role==='DEF'?'CB':role==='ATT'?'STK':role==='GK'?'GK':'CM'}); p.hv='jjjjjjjjj'; p.seed=424242; p.mo=0; return p; };   // (an ordinary man in every hidden way, the same dice each run)
  window.XCLONE=p=>Object.assign(JSON.parse(JSON.stringify(p)),{id:p.id+100000});
  window.XTICKS=(p,n,x)=>{ for(let i=0;i<n;i++){ D.weeks=(D.weeks||0)+3; if(x.gw) p.mw=x.gw*(x.share??1); devTick(D,p,x); } return p; };
  return 1; })()`);

// --- stored attributes -----------------------------------------------------------------------------------------
r = await K(`(()=>{ const all=[...D.roster,...mgAiClubs(D).flatMap(c=>c.players),...D.world.free];
  const okAt=all.every(p=>/^[a-s]{25}$/.test(p.at)&&/^[a-s]{25}$/.test(p.cl)&&/^[a-s]{25}$/.test(p.bs)&&/^[a-s]{9}$/.test(p.hv));
  const rates=all.every(p=>p.ovr===clamp(cwOverall(p.role,devUnpack(p.at)),30,95)), pot=all.every(p=>p.pot>=p.ovr&&p.pot===Math.max(p.ovr,clamp(cwOverall(p.role,devUnpack(p.cl)),30,99)));
  const under=all.every(p=>{ const a=devUnpack(p.at), c=devUnpack(p.cl); return DEV_KEYS.every(k=>c[k]>=a[k]); });
  const hv=all.flatMap(p=>Object.values(hvOf(p))), hvMean=hv.reduce((a,b)=>a+b,0)/hv.length;
  const p=D.roster[0], s0=JSON.stringify(mgStats(p)), a=devUnpack(p.at); a.speed=Math.min(10,a.speed+1.5); p.at=devPack(a);
  const s1=mgStats(p), e=careerLineupYours(D).squad.find(x=>x.ri===0);
  return { n:all.length, okAt, rates, pot, under, hvMin:Math.min(...hv), hvMax:Math.max(...hv), hvMean:+hvMean.toFixed(2), plays:s1.speed===a.speed&&e&&e.stats.speed===a.speed&&JSON.stringify(s1)!==s0 }; })()`);
info('attributes: ' + JSON.stringify(r));
ok(r.okAt && r.rates && r.pot && r.under, 'all ' + r.n + ' men: their own attributes, ceilings, bests and hidden values stored; the rating what the attributes rate, the potential what the ceilings rate, every attribute at or under its ceiling');
ok(r.hvMin >= 1 && r.hvMax <= 10 && Math.abs(r.hvMean - 5.5) < 0.4, 'the hidden values 1 to 10 in half points, about 5.5 on average (' + r.hvMean + ')');
ok(r.plays, 'what\'s stored is what plays: an attribute changed, his card and his match entry change with it');

// --- every third week; the same dice on a reload ------------------------------------------------------------------
r = await K(`(()=>{ const d=D, seen=[]; d.lv.market=0;
  for(let i=0;i<7;i++){ const before=d.roster.map(p=>p.at+p.pg).join(); mgWeekStart(d); const after=d.roster.map(p=>p.at+p.pg).join(); seen.push(d.weeks+':'+(before===after?'-':'dev')); }
  const snap=JSON.stringify(d), a=JSON.parse(snap), b=JSON.parse(snap); a.weeks=b.weeks=(Math.floor(d.weeks/3)+1)*3-1; mgWeekStart(a); mgWeekStart(b);
  const by=d=>{ const m=new Map(); for(const p of [...d.roster,...mgAiClubs(d).flatMap(c=>c.players),...d.world.free]) m.set(p.id,p.at+p.pg+p.mo); return m; }, ma=by(a), mb=by(b);
  let n=0, diff=0; for(const [id,v] of ma){ if(!mb.has(id)||id>=d.world.nextId) continue; n++; if(mb.get(id)!==v) diff++; }   // (the market's moves after it are the market's dice: the men there were before it, compared by who they are)
  const same=diff===0&&n>700;
  return { seen, same }; })()`);
ok(r.seen.filter(x => /dev/.test(x)).every(x => +x.split(':')[0] % 3 === 0) && r.seen.some(x => /dev/.test(x)), 'development every third week, and only then: ' + r.seen.join(' '));
ok(r.same, 'the same week from the same save, twice: the same development to the half point (a reload changes nothing)');

// --- twins: the same 18-year-old, two careers ----------------------------------------------------------------------
r = await K(`(()=>{ const a=XMK(18,58,72), b=XCLONE(a), c=XCLONE(a); hvOf(a);
  XTICKS(a,10,{T:0.95,gw:4,share:1}); XTICKS(b,10,{T:0.55,gw:4,share:0}); XTICKS(c,10,{T:0.75,gw:4,share:0.5});
  const prog=p=>{ const st=devUnpack(p.at), pg=devUnpackPg(p.pg); return +DEV_KEYS.reduce((s,k,i)=>s+st[k]*2+pg[i],0).toFixed(2); };   // (in half points, the meters too)
  return { start:58, starter:a.ovr, bench:b.ovr, half:c.ovr, pot:a.pot, prog:[prog(a),prog(c),prog(b)] }; })()`);
ok(r.prog[0] > r.prog[1] && r.prog[1] > r.prog[2] && r.starter - r.bench >= 2 && r.bench >= r.start, 'twins at 18 (58, a ceiling of ' + r.pot + '), a season on: a regular with good training ' + r.starter + ', half the games ' + r.half + ', on the bench with poor training ' + r.bench + ' (all he\'s grown, in half points: ' + r.prog.join(', ') + ')');

// --- the ceiling: reached, never passed ------------------------------------------------------------------------------
r = await K(`(()=>{ const p=XMK(19,60,70); for(let i=0;i<80;i++){ XTICKS(p,1,{T:1,gw:3,share:1}); p.age=19+Math.floor(i/10)>23?23:19+Math.floor(i/10); }
  const a=devUnpack(p.at), c=devUnpack(p.cl), rel=devRel(p); const over=DEV_KEYS.filter(k=>a[k]>c[k]), top=DEV_KEYS.filter(k=>rel[k]>=0.7), at=top.filter(k=>a[k]===c[k]);
  return { ovr:p.ovr, pot:p.pot, over:over.length, top:top.length, at:at.length }; })()`);
ok(r.over === 0 && r.at >= r.top / 2 && r.ovr <= r.pot, 'eight years of the best of everything (from 60, a ceiling of ' + r.pot + '): ' + r.ovr + ', ' + r.at + ' of his ' + r.top + ' most important attributes at their ceiling, none past it');

// --- age: legs go from 29, reading the game never -------------------------------------------------------------------
r = await K(`(()=>{ const p=XMK(33,75,75,'DEF'), a0=devUnpack(p.at); XTICKS(p,10,{T:0.8,gw:4,share:1}); const a1=devUnpack(p.at);
  const phy=['speed','acceleration','agility','stamina','strength'].reduce((s,k)=>s+a1[k]-a0[k],0), iq=['offIQ','defIQ'].map(k=>a1[k]-a0[k]);
  const y=XMK(26,75,77,'DEF'), y0=devUnpack(y.at); XTICKS(y,10,{T:0.8,gw:4,share:1}); const y1=devUnpack(y.at), yphy=['speed','acceleration','agility','stamina','strength'].reduce((s,k)=>s+y1[k]-y0[k],0);
  return { ovr:[75,p.ovr], phy, iq, y:[75,y.ovr], yphy }; })()`);
ok(r.phy <= -1.5 && r.iq.every(x => x >= 0) && r.ovr[1] < 75 && r.yphy >= 0, 'a season at 33, playing every week: his legs ' + r.phy + ' (five attributes, summed), Off IQ and Def IQ ' + r.iq.join(' and ') + ', his rating 75 to ' + r.ovr[1] + '; at 26 his legs ' + (r.yphy >= 0 ? '+' : '') + r.yphy);

// --- the way back: below his best, a man gets back faster -------------------------------------------------------------
r = await K(`(()=>{ const a=XMK(24,66,72), b=XCLONE(a), keys=['passAcc','ballControl','dribbling'];
  const st=devUnpack(a.at), cl=devUnpack(a.cl); for(const k of keys){ cl[k]=Math.max(cl[k],st[k]); }
  // a: dropped 1.5 from his best; b: the same now, never better (his best where he is)
  const sa=devUnpack(a.at); for(const k of keys){ sa[k]-=1.5; } a.at=devPack(sa); b.at=a.at; b.bs=a.at; b.cl=a.cl;
  XTICKS(a,4,{T:0.75,gw:4,share:1}); XTICKS(b,4,{T:0.75,gw:4,share:1});
  const ga=keys.reduce((s,k)=>s+devUnpack(a.at)[k]-sa[k],0), gb=keys.reduce((s,k)=>s+devUnpack(b.at)[k]-sa[k],0); return { ga, gb }; })()`);
ok(r.ga > r.gb && r.ga >= 1, 'three attributes a point and a half under his best: twelve weeks on he\'s won back ' + r.ga + ' of it; a man the same who\'s never been better, ' + r.gb);

// --- the rust: little training, no games ------------------------------------------------------------------------------
r = await K(`(()=>{ const p=XMK(25,62,62), a0=devUnpack(p.at); XTICKS(p,10,{T:0.35,M:0.15}); const a1=devUnpack(p.at);
  const g=k=>devGroup(k), sum=f=>DEV_KEYS.filter(f).reduce((s,k)=>s+a1[k]-a0[k],0);
  return { ovr:p.ovr, phy:sum(k=>g(k)==='phy'), tec:sum(k=>g(k)==='tec'), iq:a1.offIQ-a0.offIQ+a1.defIQ-a0.defIQ }; })()`);
ok(r.ovr < 62 && r.phy + r.tec < 0 && r.iq >= 0, 'a season with no club at 25: his legs and his touch go (' + r.phy + ', ' + r.tec + '), his reading of the game doesn\'t (' + r.iq + '); 62 to ' + r.ovr);

// --- minutes: diminishing returns; a simulated game's subs ----------------------------------------------------------------
r = await K(`(()=>{ const m=[devMinutes(0),devMinutes(0.5),devMinutes(1)];
  const c=mgAiClubs(D).find(k=>k.tier===2), xi=mgPickEight(c.players,{kind:'league'},D,c); for(const p of c.players){ p.mw=0; } const apps=c.players.map(p=>p.apps||0);
  mgTireGame(D,c.id,xi,false); const subs=c.players.filter(p=>!xi.includes(p)&&p.mw>0);
  return { m, xi:xi.every(p=>p.mw===1), subs:subs.length, subMw:subs.map(p=>p.mw), subApps:subs.every(p=>(p.apps||0)===apps[c.players.indexOf(p)]+1), gw:c.gw }; })()`);
ok(r.m.join() === '0,0.75,1', 'minutes: half the games is three quarters of the good of all of them');
ok(r.xi && r.subs === 2 && r.subMw.every(x => x === 0.35) && r.subApps && r.gw >= 1, 'a computer club\'s simulated game: its eight a game each, two off the bench a third of one (and an appearance)');

// --- the season's end grows nobody; the review says how far each of yours came; the news says who moved --------------------
await K(`(()=>{ const d=D; d.lv.market=0; let n=0; while(d.phase!=='review'&&n++<500){ if(d.wday==='mon') mgForward(d); else mgPlayGame(d,null,null); } return 1; })()`);
r = await K(`(()=>{ const d=D, R=d.review, news=d.news.filter(x=>/^Three weeks on:/.test(x.t)).length;
  const grew=R.grew.length, okG=R.grew.every(g=>{ const p=d.roster.find(x=>x.name===g.name); return !p||p.ovr===g.to; });
  return { grew, okG, news, weeks:d.weeks }; })()`);
ok(r.okG && r.grew > 0, 'the review: ' + r.grew + ' of yours changed over the season (where each began it, where he is)');
ok(r.news >= 1 && r.news <= 11, 'a line in the news every third week your men move: ' + r.news + ' this season');

// --- a few seasons: the world neither balloons nor wastes away -----------------------------------------------------------
r = await K(`(()=>{ const d=D, tier=()=>[1,2,3,4].map(t=>{ const L=mgAiClubs(d).filter(c=>c.tier===t).flatMap(c=>mgEight(c.players)); return +(L.reduce((a,p)=>a+p.ovr,0)/L.length).toFixed(1); });
  const n85=()=>mgAiClubs(d).flatMap(c=>c.players).filter(p=>p.ovr>=85).length, s0=tier(), c0=n85();
  for(let s=0;s<4;s++){ mgNewSeason(d); let n=0; while(d.phase!=='review'&&n++<500){ if(d.wday==='mon') mgForward(d); else mgPlayGame(d,null,null); } }
  return { s0, s4:tier(), c0, c4:n85(), kb:Math.round(JSON.stringify(d).length/1024) }; })()`);
info('the world: ' + JSON.stringify(r));
ok(r.s4.every((v, i) => Math.abs(v - r.s0[i]) <= 4) && r.c4 <= Math.max(2 * r.c0, r.c0 + 15), 'five seasons on, each league\'s best eights within four points of where they began (' + r.s0.join('/') + ' to ' + r.s4.join('/') + '), 85+ men ' + r.c0 + ' to ' + r.c4);
ok(r.kb < 600, 'the save after five seasons: ' + r.kb + ' KB');

// --- a career from before development: everyone's attributes as they were ---------------------------------------------------
r = await K(`(()=>{ const d=JSON.parse(JSON.stringify(D)); const p=mgAiClubs(d)[0].players[0]; delete p.at; delete p.cl; delete p.bs; delete p.hv; delete p.pg; p.ovr=61; const want=JSON.stringify(mgDeriveStats(p));
  mgMigrate(d); return { has:!!p.at, same:JSON.stringify(devUnpack(p.at))===want, ovr:p.ovr }; })()`);
ok(r.has && r.same && r.ovr === 61, 'a career saved before development: each man\'s attributes made as they always were (his rating unchanged)');

process.exitCode = rep.finish() ? 1 : 0;
await browser.close();
