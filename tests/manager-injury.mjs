// FOOTBALL CLASSIC, INJURIES: a man can get hurt -- mostly in a game, now and then in training. The risk goes up when
// he's tired, past 29, not durable (hidden), or just back from one; a better physio brings it down (a point more
// durability for everyone a level). A knock, a strain, a torn muscle, now and then something serious, worse the older
// and the less durable, lighter and shorter with a better physio, and back fitter; from
// 28 a tear or worse takes something off his legs for good, and their decline comes sooner. He heals by the day and
// comes back short of fitness. The computer never picks a man who's hurt; yours, if he's in your eight at kick-off, is
// replaced by the best fit off the bench, and the injured aren't among the subs. A season of them, the news saying who.
// In a live match he slows (no sprinting, his legs' ceiling down to 40%, not back at half-time), tops the quick subs
// (the chip lights, it doesn't drop down) and the report lists him. And everywhere he's marked: the squad, Training's
// Selection, the tactics pitch, his card, the hub. On a copy of the game that lets the test reach it.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  // ===== END MANAGER CAREER', '  window.__K={ ev:s=>eval(s) };\n  // ===== END MANAGER CAREER');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-inj-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
const K = s => page.evaluate(s => window.__K.ev(s), s);
let r;
await page.emulateMedia({ reducedMotion: 'reduce' });
// a career through the menu (the hub, its buildings), its first-season arrivals done with
await page.click('#smItems [data-act="new"]'); await page.waitForTimeout(150);
await page.click('#newSlotList .slotBtn >> nth=0'); await page.waitForTimeout(100);
await page.waitForSelector('#mgrMaker.on', { timeout: 4000 });
await page.fill('#mgName', 'Sam Okafor'); await page.fill('#mgClubIn', 'Hurt Town');
await page.click('#mgGo'); await page.waitForSelector('#careerHub.show', { timeout: 6000 });
await K(`(()=>{ const d=CAREER.data; d.story={vet:2,kid:2}; window.XP=(age,role)=>{ const p=mgNewPlayer(d,role||'MID',60,age||25,{sub:role==='GK'?'GK':'CM'}); p.hv='jjjjjjjjj'; return p; }; mgSave(d); return 1; })()`);

// --- the risk ----------------------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, R=(f)=>{ const p=XP(); f(p); return injRisk(d,p,1,null); };
  const base=R(p=>{}), tired=R(p=>p.cond=0.6), old=R(p=>p.age=33), frail=R(p=>p.hv='jjjjcjjjj'), hardy=R(p=>p.hv='jjjjrjjjj'), back=R(p=>p.injB=10);
  d.lv.physio=4; const phys=R(p=>{}); d.lv.physio=0; INJ_OFF=true; const off=R(p=>{}); INJ_OFF=false;
  return { base, tired, old, frail, hardy, back, phys, off }; })()`);
info('the risk a game: ' + JSON.stringify(Object.fromEntries(Object.entries(r).map(([k, v]) => [k, +(v * 100).toFixed(2) + '%']))));
ok(r.base > 0.008 && r.base < 0.02 && r.tired > r.base && r.old > r.base && r.frail > r.base && r.hardy < r.base && Math.abs(r.back / r.base - 2.5) < 0.01 && r.phys < r.base && r.off === 0,
  'a full game\'s risk about ' + (r.base * 100).toFixed(1) + '%: more tired, older, less durable, just back (x2.5); less durable-built, with a good physio');

// --- how bad, how long ---------------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, p=XP(), N=4000, k={}, t={}; for(let i=0;i<N;i++){ const a=injKind(p,Math.random()); k[a]=(k[a]||0)+1; const b=injKind(p,Math.random(),true); t[b]=(t[b]||0)+1; }
  const pct=o=>Object.fromEntries(Object.entries(o).map(([a,v])=>[a,Math.round(v/N*100)]));
  const days=(kind,phys)=>{ d.lv.physio=phys; let s=0, lo=1e9, hi=0; for(let i=0;i<300;i++){ const q=XP(); q.age=24; injHurt(d,q,kind,null,''); s+=q.inj.d; lo=Math.min(lo,q.inj.d); hi=Math.max(hi,q.inj.d); } d.lv.physio=0; d.news.length=0; return {mean:Math.round(s/300),lo,hi}; };   // (yours: your physio's level)
  return { game:pct(k), train:pct(t), knock:days('knock',0), strain:days('strain',0), tear:days('tear',0), serious:days('serious',0), tearPhys:days('tear',4) }; })()`);
info('how bad: ' + JSON.stringify(r));
ok(Math.abs(r.game.knock - 55) <= 6 && Math.abs(r.game.strain - 30) <= 6 && r.game.tear >= 6 && r.game.tear <= 18 && r.game.serious >= 1 && r.game.serious <= 7 && r.train.knock >= 75,
  'in a game: a knock ' + r.game.knock + '%, a strain ' + r.game.strain + '%, a torn muscle ' + r.game.tear + '%, something serious ' + r.game.serious + '%; in training, mostly knocks (' + r.train.knock + '%)');
ok(r.knock.lo >= 2 && r.knock.hi <= 8 && r.strain.lo >= 10 && r.strain.hi <= 28 && r.tear.lo >= 30 && r.tear.hi <= 90 && r.serious.lo >= 120 && r.serious.hi <= 270,
  'out for: a knock ' + r.knock.lo + '-' + r.knock.hi + ' days, a strain ' + r.strain.lo + '-' + r.strain.hi + ', a tear ' + r.tear.lo + '-' + r.tear.hi + ', something serious ' + r.serious.lo + '-' + r.serious.hi);
ok(r.tearPhys.mean < r.tear.mean * 0.8, 'the best physio gets a man back sooner (a tear: ' + r.tear.mean + ' days on average, ' + r.tearPhys.mean + ' with the best)');

// --- the physio: each level a point more durability for everyone (fewer and lighter), back sooner and fitter -------------------
r = await K(`(()=>{ const d=CAREER.data, p=XP(); delete p.injB; delete p.cond; const R=[0,1,2,3,4].map(L=>{ d.lv.physio=L; return injRisk(d,p,1,null); });
  const N=6000, bad=L=>{ d.lv.physio=L; const du=injDu(d,p,null); let n=0; for(let i=0;i<N;i++){ const k=injKind(p,Math.random(),false,du); if(k==='tear'||k==='serious') n++; } return +(n/N*100).toFixed(1); };
  const s0=bad(0), s4=bad(4), back=L=>{ d.lv.physio=L; const q=XP(); q.inj={k:'strain',d:1}; d.roster.push(q); injHeal(d,1); d.roster.pop(); return +condOf(q).toFixed(2); };
  const b0=back(0), b4=back(4), hardy=XP(); hardy.hv='jjjjsjjjj'; d.lv.physio=4; const cap=injDu(d,hardy,null);
  d.lv.physio=2; const screen=mgPhysioBody(d).replace(/<[^>]+>/g,' ').replace(/\\s+/g,' '); d.lv.physio=0;
  return { R:R.map(x=>+(x*100).toFixed(2)), ratio:+(R[4]/R[0]).toFixed(2), s0, s4, b0, b4, cap, screen }; })()`);
info('the physio: ' + JSON.stringify(r));
ok(r.R.every((v, i) => !i || v < r.R[i - 1]) && Math.abs(r.ratio - 0.49) < 0.02, 'each physio level is a point more durability for everyone: an ordinary man\'s risk a game ' + r.R.join('%, ') + '% at levels 0 to 4 (half at the best)');
ok(r.s4 < r.s0 * 0.8 && r.b0 === 0.8 && r.b4 === 0.96 && r.cap === 10, 'lighter too (a tear or worse ' + r.s0 + '% of the time with none, ' + r.s4 + '% with the best), and back fitter (' + r.b0 + ', ' + r.b4 + ' with the best); nobody past 10');
ok(/In a game tiring 16% slower/.test(r.screen) && /Injuries \d+% fewer, lighter/.test(r.screen) && /Back from one 20% sooner, 88% fit/.test(r.screen), 'the physio\'s screen says what it does: ' + r.screen.slice(r.screen.indexOf('THE PHYSIO'), r.screen.indexOf('THE PHYSIO') + 190));

// --- late in a career: a bad one takes something off his legs, and they go sooner ------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, a=XP(30), b=XCL(a), a0=devUnpack(a.at), K4=['speed','acceleration','agility','stamina'];
  injHurt(d,a,'tear',{tier:2},''); const a1=devUnpack(a.at), legs=k=>K4.reduce((s,x)=>s+k[x],0), lost=legs(a0)-legs(a1); delete a.inj;
  const prog=p=>{ const st=devUnpack(p.at), pg=devUnpackPg(p.pg); return K4.reduce((s,k)=>s+st[k]*2+pg[DEV_KEYS.indexOf(k)],0); }, pa=prog(a), pb=prog(b);   // (in half points, the meters too)
  for(let i=1;i<=10;i++){ d.weeks=99+3*i; a.mw=b.mw=4; devTick(d,a,{T:0.8,gw:4}); devTick(d,b,{T:0.8,gw:4}); }
  const young=XP(24); injHurt(d,young,'tear',{tier:2},'');
  return { lost, decl:a.decl, fallA:+(pa-prog(a)).toFixed(2), fallB:+(pb-prog(b)).toFixed(2), young:young.decl||0 }; })()`.replace('XCL(a)', 'Object.assign(JSON.parse(JSON.stringify(a)),{id:a.id+50000})'));
ok(r.lost === 0.5 && r.decl > 0 && r.fallA > r.fallB + 0.5 && r.young === 0,
  'a torn muscle at 30: half a point off his legs at once, and in the season after they fall ' + r.fallA + ' half points against his uninjured twin\'s ' + r.fallB + '; at 24 it heals clean');

// --- healing -----------------------------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, p=d.roster[3]; injHurt(d,p,'strain',null,'in training'); const days=p.inj.d, news=d.news[0].t;
  mgDays(d,days-1); const still=!!p.inj; mgDays(d,1); const healed=!p.inj, back=p.injB, cond=condOf(p); mgDays(d,INJ_BACK); return { days, news, still, healed, back, cond, clear:!p.injB }; })()`);
ok(r.still && r.healed && r.back === 21 && r.cond <= 0.8 && r.clear && /is out for \d+ weeks? \(a strain, in training\)/.test(r.news),
  'hurt (the news: "' + r.news + '"), he heals by the day: out ' + r.days + ' days, back a short of fitness (' + Math.round(r.cond * 100) + '%), three risky weeks after it');

// --- who plays: never a hurt man for the computer; yours replaced at kick-off, none on the bench -------------------------------
r = await K(`(()=>{ const d=CAREER.data, c=mgAiClubs(d)[0], best=mgEight(c.players), hurt=best[3]; hurt.inj={k:'strain',d:14};
  const pick=mgPickEight(c.players,{kind:'league'},d,c); delete hurt.inj;
  const lu=ensureLineup(d), R=d.roster, bri=lu.bench[1]; R[bri].inj={k:'tear',d:40};
  const ri=lu.atk.find(i=>lu.bench.some(b=>b!==bri&&R[b].role===R[i].role))??lu.atk[2], man=R[ri]; man.inj={k:'knock',d:5}; const role=man.role;   // (a man the bench has another of)
  const sw=mgFitXI(d), squad=careerLineupYours(d).squad;
  const k=lu.atk.indexOf(ri)>=0?-1:0, slot=sw.length?lu.atk.indexOf(sw[0][1]&&R.indexOf(sw[0][1])):-1, now=slot>=0?lu.atk[slot]:ri, inn=R[now];
  const out={ ai:!pick.includes(hurt), swapped:sw.length===1&&sw[0][0]===man&&!lu.atk.includes(ri), sameRole:inn.role===role, notInj:!inn.inj, benchOk:!squad.some(e=>R[e.ri]&&R[e.ri].inj), def:lu.def.includes(now)&&!lu.def.includes(ri) };
  delete man.inj; delete R[bri].inj; return out; })()`);
ok(r.ai, 'the computer leaves a man who\'s hurt out of its eight');
ok(r.swapped && r.sameRole && r.notInj && r.def && r.benchOk, 'one of your eight hurt at kick-off: the best fit off the bench (his line\'s) takes his place, with the ball and without it; nobody hurt among the subs');

// --- a season of them -----------------------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data; d.news.length=0; let n=0, mine=0; const orig=injHurt; injHurt=function(a,p,k,c,h){ orig(a,p,k,c,h); n++; if(!c) mine++; };
  let s=0; while(d.phase!=='review'&&s++<500){ if(d.wday==='mon') mgForward(d); else mgPlayGame(d,null,null); } injHurt=orig;
  return { n, mine, news:d.news.filter(x=>/is out for/.test(x.t)).length, nowHurt:[...mgAiClubs(d).flatMap(c=>c.players)].filter(p=>p.inj).length }; })()`);
info('a season: ' + JSON.stringify(r));
ok(r.n >= 150 && r.n <= 500 && r.news === r.mine, 'a season: ' + r.n + ' injuries across the four leagues (about ' + (r.n / 56).toFixed(1) + ' a club), ' + r.mine + ' of yours, each in the news');

// --- a live match: hurt in it ------------------------------------------------------------------------------------------------
await K(`(()=>{ const d=CAREER.data; mgNewSeason(d); d.story={vet:2,kid:2}; for(const p of d.roster){ delete p.inj; delete p.injB; } INJ_OFF=true; while(!mgNextGame(d)) mgForward(d); mgSave(d); renderHub(); return 1; })()`);
await page.click('#chBottom [data-mg="forward"]'); await page.waitForTimeout(150);
await page.click('#chBottom [data-mg="play"]'); await page.waitForTimeout(1500);
r = await K(`(()=>{ const p=players.find(q=>q.team==='G'&&q.squadIdx===3); hurtInMatch(p); p.sprint=true; return { cap:p.staminaCap, hurt:HURT.G.has(3), name:SQUAD.G[3].name }; })()`);
await page.waitForTimeout(700);
const live = await K(`(()=>{ const p=players.find(q=>q.team==='G'&&q.squadIdx===3), sug=qsSuggest(); return { cap:+p.staminaCap.toFixed(2), first:sug[0]&&sug[0].out, hot:document.getElementById('qsWrap').classList.contains('hot'), open:document.getElementById('qsWrap').classList.contains('open'), msg:document.getElementById('qsMsg').textContent }; })()`);
info('hurt in a live match: ' + JSON.stringify({ r, live }));
ok(r.hurt && live.cap <= 0.4 && live.first === 3 && live.hot && !live.open && /IS HURT/.test(live.msg), 'hurt in the match: his legs\' ceiling at ' + Math.round(live.cap * 100) + '%, first on the quick subs, the chip lit (not dropped down): "' + live.msg + '"');
await K(`(()=>{ half=1; matchClock=halfLenSec(); return 1; })()`); await page.waitForTimeout(2600);
const ht = await K(`(()=>{ const p=players.find(q=>q.team==='G'&&q.squadIdx===3); return { half, cap:p?+p.staminaCap.toFixed(2):null }; })()`);
ok(ht.half === 2 && ht.cap !== null && ht.cap <= 0.4, 'half-time: the others get some of their legs back, he doesn\'t (' + Math.round(ht.cap * 100) + '%)');
await K(`(()=>{ finishCareerMatch(careerFix); return 1; })()`); await page.waitForTimeout(500);
r = await K(`(()=>{ const d=CAREER.data, p=d.roster.find(x=>x.name===${JSON.stringify(r.name)}); return { inj:p&&p.inj, report:document.getElementById('matchReport').innerText }; })()`);
ok(r.inj && /INJURED/.test(r.report) && r.report.includes(r.inj ? 'week' : 'x') || (r.inj && r.inj.d < 7 && /INJURED/.test(r.report)), 'after it, the injury is his (' + (r.inj ? r.inj.k + ', ' + r.inj.d + ' days' : 'none') + '), and the report lists it');

// --- marked everywhere ---------------------------------------------------------------------------------------------------------
await K(`(()=>{ const d=CAREER.data; for(const p of d.roster){ delete p.inj; } const lu=ensureLineup(d); d.roster[lu.atk[0]].inj={k:'strain',d:15}; window.HURTNAME=d.roster[lu.atk[0]].name; mgSave(d); renderHub(); return 1; })()`);
await page.click('#matchReport .mrContinue').catch(() => {}); await page.waitForTimeout(200);
const warn = await page.textContent('#chWarn');
await page.click('#chCampus [data-bldg="train"]'); await page.waitForSelector('#bldgPanel.show'); await page.waitForTimeout(150);
const tok = await page.$$eval('#bpBody .ptk.inj', ns => ns.length);
await page.click('#bldgPanel .bpTab:text-is("Selection")'); await page.waitForTimeout(120);
const sel = await page.$$eval('#bpBody .selRow.inj .injX', ns => ns.length);
await page.click('#bldgPanel .bpTopBack'); await page.waitForTimeout(150);
await page.click('#chCampus [data-bldg="club"]'); await page.waitForSelector('#bldgPanel.show'); await page.click('#bldgPanel .bpTab:text-is("Squad")'); await page.waitForTimeout(120);
const row = await page.$$eval('#bpBody .mgRow .mgInj', ns => ns.map(n => n.textContent));
const hn = await K('HURTNAME'); await page.click(`#bpBody .mgRow:has-text("${hn}")`); await page.waitForTimeout(120);
const card = await page.innerText('#bpBody .mgCard').catch(() => '');
info('marked: ' + JSON.stringify({ warn, tok, sel, row, card: card.split('\n').find(l => /INJURED/.test(l)) }));
ok(/✚/.test(warn) && /in your eight/.test(warn) && tok >= 1 && sel === 1 && row.length === 1 && /2w/.test(row[0]) && /INJURED · a strain · 2 weeks/.test(card),
  'marked everywhere: the hub ("' + warn.split('·').find(x => /✚/.test(x)).trim() + '"), the tactics pitch, the Selection list, the squad (' + row[0] + '), his card');

process.exitCode = rep.finish() ? 1 : 0;
await browser.close();
