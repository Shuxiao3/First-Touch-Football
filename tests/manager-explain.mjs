// FOOTBALL CLASSIC, EVERY NUMBER EXPLAINED (v152): which way a man's going -- ▲ coming on, ▼ going back -- by his rating
// on his card and in your lists, from his rating to the hundredth tick on tick (a man who comes on over a season shows ▲
// by his first month, nearly always, and almost never one who goes back); a word with him from his card (his mood and
// why, TALK TO HIM once a week, and what he said); one figure for one thing (the papers' head and body give the same
// team morale; a club's rating in the fixtures is the same all week, not its fitness on the day); his number named when
// it isn't his rating ("52 → 50 · second position", "today 47 · tired"); a tap on his stars, his arrow, his potential
// ("not scouted", not "?"), his popularity or the match's top right says what it is; and the ▽ over the man the top right
// names, your keeper in his hands too. On a copy the test can reach.
import { open, startExhibition } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  let INJ_OFF=false;', '  let INJ_OFF=true;');
patch('  // ===== END MANAGER CAREER', '  window.__K={ ev:s=>eval(s) };\n  // ===== END MANAGER CAREER');
patch('      if(isYou){\n        const m=proj(p.x,p.y,p.z+PLAYER_H+14);', '      if(isYou){ window.__tri=p;\n        const m=proj(p.x,p.y,p.z+PLAYER_H+14);');   // (who the ▽ is drawn over)
patch('    if(controllingKeeper===kp||controlled===kp){', '    if(controllingKeeper===kp||controlled===kp){ window.__tri=kp;');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-xpl-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
const K = s => page.evaluate(s => window.__K.ev(s), s);
await page.click('#smItems [data-act="new"]'); await page.waitForTimeout(150);
await page.click('#newSlotList .slotBtn >> nth=0'); await page.waitForTimeout(100);
await page.waitForSelector('#mgrMaker.on', { timeout: 4000 });
await page.fill('#mgName', 'Sam Okafor'); await page.fill('#mgClubIn', 'Arrow Town');
await page.click('#mgGo'); await page.waitForSelector('#careerHub.show', { timeout: 8000 });
await K(`(()=>{ const d=CAREER.data; d.story={vet:2,kid:2,phone:2}; mgStoryShow(d); mgSave(d); renderHub(); return 1; })()`);
const tip = () => page.evaluate(() => { const t = document.getElementById('xplTip'); return t && t.classList.contains('on') ? t.textContent : ''; });

// --- WHICH WAY HE'S GOING ------------------------------------------------------------------------------------------------------
let r = await K(`(()=>{ const d=CAREER.data, c=JSON.parse(JSON.stringify(d)), none=d.roster.every(p=>p.dv==null&&!trendHtml(p));
  const p=c.roster.filter(q=>q.role!=='GK').sort((a,b)=>a.age-b.age)[0], X=()=>devX(p.role,devUnpack(p.at),devUnpackPg(p.pg),p.style);   // (v202: by his playstyle)
  const x0=X(); devTick(c,p,{T:1,gw:1,M:1}); const x1=X(), dv1=p.dv; devTick(c,p,{T:1,gw:1,M:1}); const x2=X(), dv2=p.dv;
  const t=v=>devTrend({dv:v});
  return { none, dv1, want1:Math.round((x1-x0)*100)/100, dv2, want2:Math.round((0.5*dv1+0.5*(x2-x1))*100)/100, age:p.age, marks:[t(0.1),t(0.09),t(-0.09),t(-0.1),t(null)] }; })()`);
info('one tick: ' + JSON.stringify(r));
ok(r.none && Math.abs(r.dv1 - r.want1) <= 0.011 && Math.abs(r.dv2 - r.want2) <= 0.011 && r.marks.join() === '1,0,0,-1,0',
  'which way he\'s going: no arrow before a tick; after one, his rating to the hundredth against before (+' + r.dv1 + ' for the youngest, ' + r.age + '); the next, a half of that and a half of the new; ▲ from +0.1 a tick, ▼ from -0.1');
// the season, every man at every club: a man who comes on shows ▲ by his first month, and ▲ is almost never wrong
r = await K(`(()=>{ const keep=CAREER.data, d=JSON.parse(JSON.stringify(keep)); CAREER.data=d; const all=()=>d.roster.concat(d.youth||[], ...mgAiClubs(d).map(c=>c.players));
  const o0=new Map(all().map(p=>[p.id,p.ovr])), T=[]; let w=d.weeks||0, i=0; const s0=d.season;
  while(i<6000&&d.season===s0&&!d.review){ if(mgNextGame(d)) mgSim(d); else mgForward(d); i++; if(d.weeks!==w){ w=d.weeks; if(d.weeks%DEV_EVERY===0) T.push(new Map(all().map(p=>[p.id,[p.ovr,devTrend(p)]]))); } }
  const ids=[...o0.keys()].filter(id=>T.every(m=>m.has(id))), end=id=>T[T.length-1].get(id)[0], t1=id=>T[0].get(id)[1];
  const up=ids.filter(id=>end(id)>o0.get(id)), a1=ids.filter(id=>t1(id)>0), d1=ids.filter(id=>t1(id)<0);
  CAREER.data=keep; mgSave(keep); MGUI.seq=null; MGUI.money=null; for(const id of ['pressModal','moneyModal','pileModal','storyModal']){ const m=document.getElementById(id); if(m) m.classList.remove('on'); } document.getElementById('matchReport').style.display='none'; showHubScreen&&showHubScreen(); renderHub();   // (the season was a copy's: the career's as it was, and nothing of the copy's left up)
  return { n:ids.length, ticks:T.length, week:DEV_EVERY, up:up.length, upA:up.filter(id=>t1(id)>0).length, upD:up.filter(id=>t1(id)<0).length,
    a1:a1.length, a1back:a1.filter(id=>end(id)<o0.get(id)).length, d1:d1.length, d1on:d1.filter(id=>end(id)>o0.get(id)).length,
    shown:Math.round(100*T.reduce((a,m)=>a+ids.filter(id=>m.get(id)[1]!==0).length,0)/(ids.length*T.length)) }; })()`);
info('a season, ' + r.n + ' men, ' + r.ticks + ' ticks: ' + r.up + ' came on (' + r.upA + ' ▲ at week ' + r.week + ', ' + r.upD + ' ▼); ' + r.a1 + ' ▲ at week ' + r.week + ' (' + r.a1back + ' went back); ' + r.d1 + ' ▼ (' + r.d1on + ' came on); an arrow on ' + r.shown + '% of men at a tick');
ok(r.up >= 50 && r.upA >= 0.6 * r.up && r.upD <= 0.03 * r.up && r.a1back <= 0.05 * r.a1 && r.d1on <= 0.1 * r.d1 + 1 && r.shown <= 60,
  'a man who comes on over a season shows ▲ by his first month: ' + Math.round(100 * r.upA / r.up) + '% of the ' + r.up + ' at week ' + r.week + ' -- and of the ' + r.a1 + ' with ▲ then, ' + r.a1back + ' went back; arrows on ' + r.shown + '% of men at a time, not everyone');
// on his card and in the squad's list, a tap says how fast and the coaches' word
const pT = await K(`(()=>{ const d=CAREER.data, p=d.roster.find(q=>q.role!=='GK'); p.dv=0.4; p.ld=1.5; MGUI.sel=null; mgSide='rate'; curTab.club='Squad'; openBuilding('club'); paintBuilding(); return p.id; })()`);
await page.waitForTimeout(150);
const rowUp = await page.evaluate(id => !!document.querySelector('#bpBody .mgRow[data-pid="' + id + '"] .nm .trend.up'), pT);   // (v171: by his name, as J3 has the row)
await K(`(()=>{ MGUI.sel=${pT}; paintBuilding(); return 1; })()`); await page.waitForTimeout(120);
r = await page.evaluate(() => ({ card: !!document.querySelector('#bpBody .mgCardOvr .trend.up') })); r.row = rowUp;
await page.click('#bpBody .mgCardOvr .trend.up'); await page.waitForTimeout(60);
const tTrend = await tip();
ok(r.row && r.card && /COMING ON/.test(tTrend) && /\+0\.4/.test(tTrend) && /sharp in training/.test(tTrend),
  'his ▲ by his name in the squad\'s list and by his rating on his card; tapped: "' + tTrend + '"');

// --- A WORD WITH HIM, FROM HIS CARD -----------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, p=d.roster.find(q=>q.role!=='GK'&&q.id!==MGUI.sel); p.mor=5; delete p.talkWk; MGUI.sel=p.id; mgSide='mind'; paintBuilding(); return { pid:p.id, why:mgWhy(d,p) }; })()`);
await page.waitForTimeout(120);
const pid = r.pid;
const mind = () => page.evaluate(() => { const t = document.querySelector('#bpBody .mindTalk'); return t ? { txt: t.textContent, btn: !!t.querySelector('[data-mg="talkcard"]'), said: (document.querySelector('#bpBody .mindSaid') || {}).textContent || '' } : null; });
const m0 = await mind();
await page.click('#bpBody .mindTalk [data-mg="talkcard"]'); await page.waitForTimeout(100);
const m1 = await mind(), mor1 = await K(`CAREER.data.roster.find(q=>q.id===${pid}).mor`);
await K(`mgAct('talkcard',{pid:'${pid}'})`); await page.waitForTimeout(60);
const mor2 = await K(`CAREER.data.roster.find(q=>q.id===${pid}).mor`), again = await K('MGUI.msg');
info('his card, PERSONALITY: "' + (m0 && m0.txt) + '" -> talked: "' + (m1 && m1.txt) + '" / "' + (m1 && m1.said) + '"; again: "' + again + '"');
ok(m0 && m0.btn && /UNSETTLED/.test(m0.txt) && m0.txt.includes(r.why) && m1 && !m1.btn && /SPOKEN THIS WEEK/.test(m1.txt) && /Unsettled/.test(m1.said) && /mood \+0\.3/.test(m1.said)
  && Math.abs(mor1 - 5.3) < 1e-6 && mor2 === mor1 && /spoken to him this week/.test(again),
  'a word with him from his card: his mood and why ("' + r.why + '"), TALK TO HIM -- and what he said (' + (m1 && m1.said) + '); a second word the same week does nothing');
await K(`(()=>{ const d=CAREER.data; mgWeekStart(d); paintBuilding(); return 1; })()`); await page.waitForTimeout(80);
const m3 = await mind();
ok(m3 && m3.btn, 'the next week, TALK TO HIM again');

// --- ONE FIGURE FOR ONE THING ---------------------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data; hideBldg(); mgWeekStart(d); const was=d.tm; d.tm=Math.round((was+0.7)*100)/100;   // (a game or a word since the papers came: the side's mood moved)
  d.pile.opened=false; pileShow(d,true); const H=document.querySelector('#pileModal .plHead');
  if(!H) return { why:{ left:pileLeft(d).length, up:['storyModal','matchReport','pressModal','moneyModal'].filter(k=>mgUpOn(k)), money:!!MGUI.money, press:!!(d.press&&d.press.qs&&d.press.qs.length) } };
  const head=H.textContent;
  let body=''; for(let k=0;k<12&&!body;k++){ const t=document.querySelector('#pileModal .plTitle').textContent, L=document.querySelector('#pileModal .plPaper').textContent; if(/^The dressing room is/.test(t)) body=L; else { const n=document.querySelector('#pileModal [data-pile="next"],#pileModal [data-pile="later"]'); if(!n) break; n.click(); } }
  pileHide(); return { head:(head.match(/MORALE\\s*([0-9.]+)/)||[])[1], body:!!body, again:/Team morale/.test(body), week:/THIS WEEK/.test(body), tm:d.tm.toFixed(1), was:was.toFixed(1) }; })()`);   // (v176: the page doesn't say the head's figure again)
if(r.why) info('the papers would not open: ' + JSON.stringify(r.why));
ok(r.head && r.head === r.tm && r.body && !r.again && r.week, 'the papers\' head gives the side\'s mood as it is now (' + r.head + ', moved from ' + r.was + ' after they came), and the dressing room\'s page doesn\'t say it again: its strip has the week\'s change');
r = await K(`(()=>{ const d=CAREER.data, L=d.lg[d.tier], m=L.fx[Math.max(d.md+1,1)].find(x=>x[0]===d.clubId||x[1]===d.clubId), opp=m[0]===d.clubId?m[1]:m[0], c=d.world.clubs[opp];
  const md=Math.max(d.md+1,1)+1, shown=()=>{ const row=mgFixturesTab(d).split('<div class="mgFx').find(x=>x.includes('<span class="md">'+md+'</span>')); return row?+(row.match(/#5d7350">(\\d+)</)||[])[1]:null; };
  const a=shown(), s0=mgStrength(d,opp); for(const p of c.players) p.cond=0.7; const b=shown(), s1=mgStrength(d,opp); for(const p of c.players) p.cond=1;
  const by=(x,y)=>y.ovr-x.ovr, P=c.players.filter(p=>!p.inj), xi=P.filter(p=>p.role==='GK').sort(by).slice(0,1).concat(P.filter(p=>p.role!=='GK').sort(by).slice(0,OUTFIELD));
  return { a, b, s0:+s0.toFixed(1), s1:+s1.toFixed(1), want:Math.round(xi.reduce((t,p)=>t+p.ovr,0)/xi.length) }; })()`);
ok(r.a === r.want && r.b === r.a && r.s1 < r.s0 - 1, 'a club\'s rating in the fixtures is its best nine\'s, ' + r.a + ', all week -- its men tired, still ' + r.b + ' (its strength on the day went ' + r.s0 + ' to ' + r.s1 + ': that\'s what was shown)');

// --- HIS NUMBER NAMED -------------------------------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, lu=ensureLineup(d), A=careerSlots(d.formation,'atk');
  let hit=null; for(let i=0;i<lu.atk.length&&!hit;i++){ const sl=A[i]; if(!sl) continue; for(const ri of lu.atk){ const p=d.roster[ri]; if(fitCls(fitPos(p),sl.role,spotFit(sl))===' sec'){ hit={i,ri}; break; } } }
  if(!hit) return {none:true};
  const j=lu.atk.indexOf(hit.ri), k=hit.i; [lu.atk[j],lu.atk[k]]=[lu.atk[k],lu.atk[j]]; const p=d.roster[hit.ri], tm0=d.tm; d.tm=MOR0; p.cond=1; p.mor=MOR0;   // (v177: the side settled -- its mood was chance, and showed on his card)
  const card1=tbCard(d,hit.ri,'atk'); p.cond=0.7; p.mor=3; const mo=morOvr(p), card2=tbCard(d,hit.ri,'atk'); p.cond=1; p.mor=MOR0; d.tm=tm0;
  const at=ovrAt(p,A[k].role,spotFit(A[k])); return { ovr:p.ovr, at, card1, card2, mo }; })()`);
const why = h => (h.match(/<div class="mgCardSub rWhy">([^<]*)<\/div>/g) || []).map(x => x.replace(/<[^>]+>/g, '')).join(' | ');
if(r.none) ok(false, 'a man in a second position to look at');
else ok(why(r.card1) === r.ovr + ' → ' + r.at + ' · second position' && r.mo < 0 && /today \d+ · tired, unhappy/.test(why(r.card2)),
  'his card in the tactics names why his number isn\'t his rating: "' + why(r.card1) + '"; tired and unhappy, "' + why(r.card2) + '"');
r = await K(`(()=>({ sec:ratingWhy(52,50,' sec'), oop:ratingWhy(60,54,' oop'), same:ratingWhy(52,52,'') }))()`);
ok(/52 → 50 · second position/.test(r.sec) && /60 → 54 · out of position/.test(r.oop) && r.same === '', 'in a match, the same under his number on his card ("52 → 50 · second position", "60 → 54 · out of position"); nothing when it\'s his rating');

// --- A TAP SAYS WHAT IT IS ------------------------------------------------------------------------------------------------------------
await K(`(()=>{ const d=CAREER.data, p=d.roster.find(q=>q.role!=='GK'); mgSide='rate'; curTab.club='Squad'; openBuilding('club'); MGUI.sel=p.id; paintBuilding(); return 1; })()`); await page.waitForTimeout(120);
await page.click('#bpBody .mgCard .mgCardSub .stars'); await page.waitForTimeout(60); const tStars = await tip();
await page.click('#bpBody .mgCard .mgPop'); await page.waitForTimeout(60); const tPop = await tip();
await page.click('#bpBody .mgCard .mgCardName'); await page.waitForTimeout(60); const tGone = await tip();
ok(/SKILL STARS/.test(tStars) && /POPULARITY/.test(tPop) && tGone === '', 'tapped, his stars say what they are ("' + tStars.slice(0, 60) + '...") and his popularity ("' + tPop.slice(0, 50) + '..."); a tap elsewhere, gone');
r = await K(`(()=>{ const d=CAREER.data, c=mgAiClubs(d).find(k=>k.tier===d.tier), p=c.players.find(x=>knOf(d,x)===0); return { h:mgCard(d,p.id), pid:p.id }; })()`);
ok(/not scouted/.test(r.h) && !/potential \?/.test(r.h), 'a man your scouts haven\'t seen: potential "not scouted", not "?" -- and tapped, why');
await K(`(()=>{ hideBldg(); return 1; })()`);

// --- THE MATCH'S TOP RIGHT, AND THE ▽ -------------------------------------------------------------------------------------------------
await K(`(()=>{ hubToMenu(); return 1; })()`); await page.waitForTimeout(200);
await startExhibition(page); await page.waitForTimeout(1500);
const same = () => K(`(()=>{ const c=controlled; return { tri:window.__tri===c, name:document.getElementById('rpName').textContent===fullName(c.pname), pos:document.getElementById('rpPos').textContent, gk:keepers.includes(c) }; })()`);
await K(`(()=>{ window.__tri=null; return 1; })()`); await page.waitForTimeout(150);
const s1 = await same();
await K(`(()=>{ const kp=keepers.find(k=>k.team==='G'); Object.assign(ball,{ownedBy:null,dribbler:null,x:kp.x,y:kp.y,z:20,vx:0,vy:0,vz:0}); kp.gkRoaming=false; kp.mode='hold'; kp.holdT=9; kp.heldT=0; gkHold=kp; window.__tri=null; return 1; })()`);
await page.waitForTimeout(250);
const s2 = await same();
info('the top right and the ▽: ' + JSON.stringify(s1) + ' · your keeper with it in his hands: ' + JSON.stringify(s2));
ok(s1.tri && s1.name && s2.gk && s2.tri && s2.name && s2.pos === 'GK', 'the ▽ is over the man the top right names -- your keeper too, with it in his hands (it was over nobody)');
r = await page.evaluate(() => { const el = document.getElementById('rpStars'); return { ui: !!el.closest('.xplUI'), pe: getComputedStyle(document.getElementById('rPlayer')).pointerEvents }; });
await page.evaluate(() => document.getElementById('rPlayer').click()); await page.waitForTimeout(60); const tHud = await tip();
await page.evaluate(() => document.querySelector('#rpStars .stars').click()); await page.waitForTimeout(60); const tHudStars = await tip();
ok(r.ui && r.pe === 'auto' && /YOUR MAN/.test(tHud) && /STAMINA/.test(tHud) && /SKILL STARS/.test(tHudStars), 'in a match, a tap on the top right says what it shows ("' + tHud.slice(0, 70) + '..."), and on his stars, what they are');

process.exitCode = rep.finish();
await browser.close();
