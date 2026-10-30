// FOOTBALL CLASSIC, THE WEEK: a manager's season runs a week at a time. Three weeks of pre-season (NEXT WEEK, no
// games), then the league's: each starts on a Monday (your decisions), FORWARD TO MATCHDAY takes you to the matchday's
// morning (PLAY or SIMULATE), and after the game you're on the next Monday. A week with a cup game has it on the
// Wednesday: from it to Saturday morning, then Monday -- never in the league's first three weeks. A week's winter break
// after week 13; the transfer window open from pre-season to the end of it (a bid standing two weeks); the computer
// clubs' choice of eight (the tired rested, the young now and then, a lesser cup's side of them, the best in a big game,
// three of them once the league's settled for the club); the eight you face live are the eight they picked. And a
// career saved before the week is cleared, LOAD GAME saying so. On a copy of the game that lets the test reach it.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  // ===== END MANAGER CAREER', '  window.__K={ ev:s=>eval(s) };\n  // ===== END MANAGER CAREER');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-week-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
const K = s => page.evaluate(s => window.__K.ev(s), s);
let r;
const save = () => page.evaluate(() => JSON.parse(localStorage.getItem('ft_mgr_slot1')));
const bottom = () => page.textContent('#chBottom');
const mid = () => page.getAttribute('#chPhase', 'data-mid');
await page.emulateMedia({ reducedMotion: 'reduce' });   // (the day's end: manager-career.mjs's)

// --- a career saved before the week is cleared, and LOAD GAME says so -----------------------------------------------
await page.evaluate(() => { localStorage.setItem('ft_mgr_slot2', JSON.stringify({ v: 3, kind: 'manager', clubName: 'Old Town', tier: 1, season: 4, manager: { name: 'Old Hand' }, phase: 'summer', day: 2 })); });
await page.reload(); await page.waitForTimeout(700); await page.emulateMedia({ reducedMotion: 'reduce' });
await page.click('#smItems [data-act="new"]'); await page.waitForTimeout(150);
const slots = await page.innerText('#newSlotList');
ok(!(await page.evaluate(() => localStorage.getItem('ft_mgr_slot2'))) && /cleared/.test(slots) && !/Old Town/.test(slots), 'a career from before the week is cleared, and the slots say so: ' + slots.split('\n')[0]);

// --- a new career: pre-season's first Monday ----------------------------------------------------------------------
await page.click('#newSlotList .slotBtn >> nth=0'); await page.waitForTimeout(100);
await page.waitForSelector('#mgrMaker.on', { timeout: 4000 });
await page.fill('#mgName', 'Sam Okafor'); await page.fill('#mgClubIn', 'Week Town');
await page.click('#mgGo'); await page.waitForSelector('#careerHub.show', { timeout: 6000 });
await K("CAREER.data.story={vet:2,kid:2}; CAREER.data.lv.market=1; mgSave(CAREER.data); renderHub();");
let d = await save();
const w1 = [await bottom(), await mid()];
ok(d.v === 4 && d.phase === 'summer' && d.day === 1 && d.wday === 'mon' && d.wkN === 1 && /NEXT WEEK/.test(w1[0]) && w1[1] === 'Pre-season · week 1 of 3 · Monday' && await K('mgWindowOpen(CAREER.data)'),
  'a new career: pre-season\'s first Monday, NEXT WEEK, the window open (' + w1[1] + ')');
ok(!(await page.evaluate(() => localStorage.getItem('ft_mgr_cleared'))), 'starting a new one, the cleared note goes');
await page.click('#chBottom [data-mg="forward"]'); await page.waitForTimeout(60);
await page.click('#chBottom [data-mg="forward"]'); await page.waitForTimeout(60);
const w3 = [await bottom(), await mid()];
await page.click('#chBottom [data-mg="forward"]'); await page.waitForTimeout(60);
d = await save(); const l1 = [await bottom(), await mid()];
ok(/START THE SEASON/.test(w3[0]) && w3[1] === 'Pre-season · week 3 of 3 · Monday' && d.phase === 'league' && d.md === 0 && d.wday === 'mon' && d.wkN === 4 && /FORWARD TO MATCHDAY/.test(l1[0]) && l1[1] === 'Week 1 of 26 · Monday',
  'three weeks of pre-season (the third\'s button: ' + w3[0].trim() + '), then the league\'s first Monday: ' + l1[0].trim() + ', ' + l1[1]);
const longMon = await page.getAttribute('#chPhase', 'data-long');
ok(/Week 1 of 26 · Monday · next: Matchday 1\/26 · (vs|@) /.test(longMon), 'the strip, on a Monday: the week, the day and the week\'s game: ' + longMon);

// --- an ordinary week: FORWARD TO MATCHDAY, Saturday morning, SIMULATE, the next Monday ------------------------------
await page.click('#chBottom [data-mg="forward"]'); await page.waitForTimeout(60);
d = await save(); const s1 = [await bottom(), await mid()];
ok(d.wday === 'sat' && d.md === 0 && /SIMULATE/.test(s1[0]) && /PLAY/.test(s1[0]) && /^Saturday · Matchday 1\/26 · (vs|@) /.test(s1[1]), 'FORWARD TO MATCHDAY: Saturday morning, PLAY or SIMULATE: ' + s1[1]);
await page.click('#chBottom [data-mg="sim"]'); await page.waitForTimeout(80);
d = await save();
ok(d.md === 1 && d.wday === 'mon' && d.wkN === 5 && /FORWARD TO MATCHDAY/.test(await bottom()) && await mid() === 'Week 2 of 26 · Monday', 'after the game: the next Monday (' + await mid() + ')');

// --- the window: a bid stands two weeks; open to the end of the winter break, shut after it -------------------------
r = await K(`(()=>{ const d=CAREER.data; d.offers=[{id:901,pid:d.roster[0].id,club:mgAiClubs(d)[0].id,fee:500,wk:d.wkN-1},{id:902,pid:d.roster[1].id,club:mgAiClubs(d)[1].id,fee:600,wk:d.wkN}];
  d.wday='sat'; mgPlayGame(d,null,null); const kept=d.offers.filter(o=>o.id>900).map(o=>o.id);
  const left=[]; for(let i=0;i<40&&d.phase!=='winter';i++){ left.push(mgWindowWeeks(d)); if(d.wday==='mon') mgForward(d); else mgPlayGame(d,null,null); }
  const inBreak={ phase:d.phase, md:d.md, open:mgWindowOpen(d), weeks:mgWindowWeeks(d) };
  mgForward(d); return { kept, left:left.slice(0,4), inBreak, after:{ phase:d.phase, md:d.md, open:mgWindowOpen(d), offers:d.offers.length, wday:d.wday } }; })()`);
info('the window: ' + JSON.stringify(r));
ok(r.kept.length === 1 && r.kept[0] === 902, 'a new week: a bid made two weeks back lapses, last week\'s stands (' + r.kept.join(',') + ')');
ok(r.inBreak.phase === 'winter' && r.inBreak.md === 13 && r.inBreak.open && r.inBreak.weeks === 1 && r.after.phase === 'league' && r.after.md === 13 && !r.after.open && r.after.offers === 0 && r.after.wday === 'mon',
  'the winter break after week 13, the window\'s last week; then the league again, the window shut and the bids gone');
const wl = await K('mgWindowLine(CAREER.data)');
ok(/shut until the summer/.test(wl), 'the market says the window\'s shut until the summer');

// --- a two-game week: a Premium League club in the Champions League, its first group game on week 4's Wednesday ----
r = await K(`(()=>{ const d=CAREER.data; const other=d.div[4][0]; d.div[4][0]=d.clubId; d.div[1][d.div[1].indexOf(d.clubId)]=other; d.world.clubs[other].tier=1; d.world.clubs[d.clubId].tier=4; d.tier=4;
  for(const p of d.roster) mgSetOvr(p,Math.round(MG_LEVEL[4]+(p.ovr-50)*0.5)); mgAutoLineup(d); d.md=0; d.mw=-1; d.phase='league'; d.wday='mon'; mgNewFixtures(d);
  d.clQual=[d.clubId,...d.div[4].filter(x=>x!==d.clubId).slice(0,5)]; mgCupsStart(d); mgFreshen(d);
  const seen=[]; for(let i=0;i<12&&d.md<4;i++){ if(d.wday==='mon'){ const due=mgCupDue(d); seen.push('mon'+(d.md+1)+(due&&due.key?':'+due.key:'')); mgForward(d); } else { const g=mgNextGame(d); seen.push(d.wday+(d.md+1)+':'+g.kind); mgPlayGame(d,null,null); } }
  mgSave(d); renderHub(); return { seen, wday:d.wday, md:d.md }; })()`);
info('the first four weeks: ' + r.seen.join(' '));
ok(!r.seen.slice(0, 6).some(x => /:cl|:cup/.test(x)) && r.seen.includes('mon4:cl') && r.seen.includes('wed4:cup') && r.seen.indexOf('wed4:cup') + 1 === r.seen.indexOf('sat4:league'),
  'no cup game in the league\'s first three weeks; in week 4, Monday, Wednesday\'s Champions League game, then Saturday\'s league game');
r = await K(`(()=>{ const d=CAREER.data; d.md=3; d.mw=1; d.wday='mon'; for(const t of [1,2,3,4]) for(const m of d.lg[t].fx[3]){ m[2]=null; m[3]=null; }
  for(const g of d.cup.cl.gr) for(const m of g.fx[0]){ m[2]=null; m[3]=null; } mgSave(d); renderHub(); return 1; })()`);
const m4 = [await bottom(), await page.getAttribute('#chPhase', 'data-long')];
await page.click('#chBottom [data-mg="forward"]'); await page.waitForTimeout(60);
d = await save(); const wed = [await bottom(), await mid()];
await page.click('#chBottom [data-mg="sim"]'); await page.waitForTimeout(80);
d = await save(); const sat = [await bottom(), await mid(), d.wday];
await page.click('#chBottom [data-mg="sim"]'); await page.waitForTimeout(80);
d = await save();
ok(/FORWARD TO MATCHDAY/.test(m4[0]) && /next: Champions League · Group game 1/.test(m4[1]) && /SIMULATE/.test(wed[0]) && /^Wednesday · Champions League · Group game 1/.test(wed[1])
   && sat[2] === 'sat' && /SIMULATE/.test(sat[0]) && /^Saturday · Matchday 4\/26/.test(sat[1]) && d.wday === 'mon' && d.md === 4,
  'week 4 on the hub: Monday (' + m4[1].replace(/^Season \d+ · /, '') + '), Wednesday morning (' + wed[1] + '), Saturday morning (' + sat[1] + '), then Monday');

// --- the computer clubs' eight (everyone fresh, chance taken out: no youngster drawn for an ordinary league game) ---
r = await K(`(()=>{ const d=CAREER.data, rnd=Math.random; Math.random=()=>0.99; mgFreshen(d); for(const c of mgAiClubs(d)) for(const p of c.players) delete p.inj;   // (everyone fit too)
  const pl=d.div[4].map(id=>d.world.clubs[id]).filter(c=>c&&c.id!==d.clubId), c=pl[0];
  const diff=(k,ctx)=>{ const base=mgPickEight(k.players), x=mgPickEight(k.players,ctx,d,k); return { n:x.filter(p=>!base.includes(p)).length, base, x }; };
  // the tired: his best eight at 80% -- some rest for fresh men not much worse, three at most; in a big game (78%) they play
  const b8=mgPickEight(c.players); for(const p of b8) p.cond=0.8;
  const lg=diff(c,{kind:'league'}), big=diff(c,{kind:'cup',key:'cl',r:2});
  const tired={ league:lg.n, big:big.n, fresh:lg.x.filter(p=>!lg.base.includes(p)).every(p=>condOf(p)>=AI_REST) };
  for(const p of b8) delete p.cond;
  // a lesser cup: the Premium League's clubs in the Coco Cup put out four youngsters or reserves among their seven
  const coco=pl.map(k=>{ const r=diff(k,{kind:'cup',key:'coco',r:0}); return r.n+r.base.filter(p=>p.role!=='GK'&&(p.age||25)<=AI_YOUNG).length; });
  const sum=(L,ctx)=>L.reduce((a,k)=>a+diff(k,ctx).n,0), l1=d.div[2].map(id=>d.world.clubs[id]).filter(Boolean);
  const out={ tired, coco, l1chg:sum(l1,{kind:'cup',key:'coco',r:0}), final:sum(pl,{kind:'cup',key:'coco',r:5}), cl:sum(pl,{kind:'cup',key:'cl',r:0}), league:sum(pl,{kind:'league'}) };
  Math.random=rnd; return out; })()`);
info('their eight: ' + JSON.stringify(r));
ok(r.tired.league >= 1 && r.tired.league <= 4 && r.tired.fresh && r.tired.big === 0, 'his best eight at 80% for a league game: ' + r.tired.league + ' rested for fresh men (three outfielders at most, and the keeper if there\'s another); in a big game they play');
ok(r.coco.every(n => n >= 4) && r.l1chg === 0 && r.final === 0 && r.cl === 0 && r.league === 0,
  'the Premium League in the Coco Cup: four of the seven youngsters or reserves (' + r.coco.join(',') + '); League 1 in it, the final, the Champions League, an ordinary league game when fresh: the best');

// a settled league: a club safe and out of the top six with three games left; and promotion sure
r = await K(`(()=>{ const d=CAREER.data, t=2, L=d.lg[t], ids=L.ids.slice();
  for(let md=0;md<MG_MD;md++) for(const m of L.fx[md]){ m[2]=null; m[3]=null; }
  // 23 rounds played: the first-listed club wins everything; the next five draw among themselves and beat the rest; the
  // next five draw among themselves, lose to those above and beat the last three, who draw among themselves
  const grp=id=>{ const k=ids.indexOf(id); return k===0?0:k<=5?1:k<=10?2:3; };
  for(let md=0;md<23;md++) for(const m of L.fx[md]){ const a=grp(m[0]), b=grp(m[1]); if(a===b){ m[2]=1; m[3]=1; } else { m[2]=a<b?2:0; m[3]=a<b?0:2; } }
  const T=mgTable(d,t), mid=T[7].id, top=T[0].id, race=T[2].id;
  const c=d.world.clubs[mid], s=mgSettled(d,mid), bench=c.players.filter(p=>p.role!=='GK').sort((a,b)=>a.ovr-b.ovr).slice(0,2); bench[0].age=19; bench[1].age=20;
  let yg=0; for(let i=0;i<40;i++){ const x=mgPickEight(c.players,{kind:'league'},d,c); yg+=x.filter(p=>(p.age||25)<=AI_YOUNG).length; }
  const e=mgEight(c.players).filter(p=>(p.age||25)<=AI_YOUNG).length, kids=c.players.filter(p=>p.role!=='GK'&&(p.age||25)<=AI_YOUNG).length;
  return { mid:s, top:mgSettled(d,top), race:mgSettled(d,race), pts:[T[0].pts,T[2].pts,T[7].pts,T[13].pts], young:yg/40, inEight:e, kids }; })()`);
info('a settled league: ' + JSON.stringify(r));
ok(r.top && r.mid && !r.race, 'with three games left, promotion sure for the top (' + r.pts[0] + ' pts) and nothing to play for mid-table (' + r.pts[2] + '); the clubs still in the race aren\'t settled');
ok(r.young >= Math.min(3, r.kids) - 0.01, 'a settled club starts its young: ' + r.young.toFixed(1) + ' a game (' + r.kids + ' 21 and under in the squad)');

// --- the eight you face live are the eight they picked ---------------------------------------------------------------
await K("(()=>{ const d=CAREER.data; d.wday='sat'; mgSave(d); renderHub(); })()");
await page.click('#chBottom [data-mg="play"]'); await page.waitForTimeout(1200);
r = await K(`(()=>({ live:MG_LIVE_XI&&MG_LIVE_XI.ids.slice().sort().join(), squad:SQUAD.R.map(e=>e.lookKey).sort().join(), n:SQUAD.R.length }))()`);
ok(r.live && r.live === r.squad && r.n === 8, 'live, they field the eight they picked (' + r.n + ')');

process.exitCode = rep.finish() ? 1 : 0;
await browser.close();
