// FOOTBALL CLASSIC, MATCH RATINGS AND FORM: a man's rating for a game (3 to 10, 6 an ordinary one) -- in a game you
// play, from what he did in it (passes found, shots, goals each counting less than the last, assists, tackles,
// interceptions, the ball lost, a keeper's saves), the result, and for the back and the keeper the goals let in; in a
// simulated game guessed from how good he is beside his side, the result, his goals and the luck of the day. His form
// drifts with them, and development reads it: good form helps a man grow, poor form costs his touch, his reading of the
// game and his composure (not his legs). Match actions build only finishing (his goals, each worth less) and composure
// (big games). His season -- games, goals, assists, clean sheets, his average rating and his form -- is on his card,
// and your men's ratings are in the report. On a copy of the game that lets the test reach it.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  let INJ_OFF=false;', '  let INJ_OFF=true;');   // (everyone fit: a man hurt would change who plays)
patch('  // ===== END MANAGER CAREER', '  window.__K={ ev:s=>eval(s) };\n  // ===== END MANAGER CAREER');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-rat-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
const K = s => page.evaluate(s => window.__K.ev(s), s);
let r;
await page.emulateMedia({ reducedMotion: 'reduce' });
await page.click('#smItems [data-act="new"]'); await page.waitForTimeout(150);
await page.click('#newSlotList .slotBtn >> nth=0'); await page.waitForTimeout(100);
await page.waitForSelector('#mgrMaker.on', { timeout: 4000 });
await page.fill('#mgName', 'Sam Okafor'); await page.fill('#mgClubIn', 'Rated Town');
await page.click('#mgGo'); await page.waitForSelector('#careerHub.show', { timeout: 6000 });
await K(`(()=>{ const d=CAREER.data; d.story={vet:2,kid:2}; mgSave(d); return 1; })()`);

// --- the rating: what he did, his role's work, the result ------------------------------------------------------------------
r = await K(`(()=>{ const R=(role,o,res,gc)=>mRate(role,o,res??0,gc??1);
  return { plain:R('MID',{pa:20,pc:16}), win:R('MID',{pa:20,pc:16},1), loss:R('MID',{pa:20,pc:16},-1), one:R('ATT',{sh:3,son:2,g:1}), two:R('ATT',{sh:4,son:3,g:2}), three:R('ATT',{sh:5,son:4,g:3}),
    def:R('DEF',{tk:4,int:3,pa:10,pc:9},1,0), defBad:R('DEF',{tk:1,lost:3,pa:10,pc:6},-1,3), gk:R('GK',{sav:5},1,0), og:R('DEF',{og:1},0,1), worst:R('DEF',{og:3,lost:8},-1,4), best:R('ATT',{g:6,a:4,son:4,sh:6},1) }; })()`);
info('ratings: ' + JSON.stringify(r));
ok(r.plain >= 6 && r.plain <= 7 && r.win - r.loss >= 0.6, 'an ordinary game, a midfielder finding his passes: ' + r.plain + ' (won ' + r.win + ', lost ' + r.loss + ')');
ok(r.one > r.plain && r.two > r.one && r.three > r.two && (r.three - r.two) < (r.two - r.one), 'a forward\'s goals: one ' + r.one + ', two ' + r.two + ', three ' + r.three + ' -- each worth less than the one before');
ok(r.def >= 7.5 && r.defBad < 5 && r.gk >= 8 && r.og < 6 && r.worst === 3 && r.best === 10, 'a defender\'s tackles and interceptions and a clean sheet ' + r.def + ' (beaten, losing the ball ' + r.defBad + '); a keeper\'s five saves ' + r.gk + '; an own goal ' + r.og + '; from 3 to 10');

// --- a game you play: what each man did is counted, and rated -------------------------------------------------------------------
await K(`(()=>{ const d=CAREER.data; while(!mgNextGame(d)) mgForward(d); mgSave(d); renderHub(); return 1; })()`);
await page.click('#chBottom [data-mg="forward"]'); await page.waitForTimeout(150);
await page.click('#chBottom [data-mg="play"]'); await page.waitForTimeout(15000);
r = await K(`(()=>{ const G=MSTAT.G, R=MSTAT.R, sum=(S,k)=>Object.values(S).reduce((a,o)=>a+(o[k]||0),0); return { men:Object.keys(G).length+Object.keys(R).length, pa:sum(G,'pa')+sum(R,'pa'), pc:sum(G,'pc')+sum(R,'pc') }; })()`);
ok(r.men >= 2 && r.pa >= 2 && r.pc >= 1 && r.pc <= r.pa, 'live, what each man does is counted: ' + r.men + ' men on the ball, ' + r.pa + ' passes, ' + r.pc + ' found');
await K(`(()=>{ const t=players.find(q=>q.team==='G'&&q.squadIdx===LINEUP.G.atk[0]); for(let i=0;i<3;i++) mStat(t,'tk'); finishCareerMatch(careerFix); return 1; })()`); await page.waitForTimeout(500);
r = await K(`(()=>{ const d=CAREER.data, rated=d.roster.filter(p=>p.rn===1), rep=document.getElementById('matchReport').innerText; return { n:rated.length, fm:rated.every(p=>p.fm===p.rs), rep:/RATINGS/.test(rep)&&/★/.test(rep) }; })()`);
ok(r.n >= 8 && r.fm && r.rep, 'after it: ' + r.n + ' of yours rated (his form begins with it), and the report has the ratings, the best starred');

// --- simulated games: guessed, the winners rated above the losers --------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data; let win=[], lose=[]; for(let i=0;i<300;i++){ const xi=[...Array(8)].map((_,k)=>({role:k?'MID':'GK',ovr:60+(k%3)})); const avg=61;
    for(const p of xi){ win.push(mSimRate(p,avg,1,0,1)); lose.push(mSimRate(p,avg,-1,0,1)); } }
  const m=a=>a.reduce((s,x)=>s+x,0)/a.length; const st=xi=>0; const star=mSimRate({role:'ATT',ovr:70},60,0,0,1)-mSimRate({role:'ATT',ovr:50},60,0,0,1);
  return { win:+m(win).toFixed(2), lose:+m(lose).toFixed(2), scorer:+(mSimRate({role:'ATT',ovr:60},60,0,2,1)-mSimRate({role:'ATT',ovr:60},60,0,0,1)).toFixed(1) }; })()`);
ok(r.win - r.lose >= 0.6 && r.win > 6 && r.lose < 6.2, 'simulated: won ' + r.win + ' on average, lost ' + r.lose + '; two goals worth about ' + r.scorer);
r = await K(`(()=>{ const d=CAREER.data; for(let i=0;i<8;i++){ if(d.wday==='mon') mgForward(d); mgPlayGame(d,null,null); }
  const c=mgAiClubs(d)[0], rated=c.players.filter(p=>p.rn>0); return { n:rated.length, avg:+(rated.reduce((a,p)=>a+p.rs/p.rn,0)/rated.length).toFixed(2), fm:rated.every(p=>p.fm>=3&&p.fm<=10), as:mgAiClubs(d).flatMap(k=>k.players).reduce((a,p)=>a+(p.as||0),0), gl:mgAiClubs(d).flatMap(k=>k.players).reduce((a,p)=>a+(p.goals||0),0) }; })()`);
ok(r.n >= 8 && r.avg > 5.4 && r.avg < 7 && r.fm && r.as > 0.5 * r.gl && r.as < r.gl, 'the computer\'s men rated every game too (' + r.n + ' of one club, ' + r.avg + ' on average), and most goals have an assist (' + r.as + ' of ' + r.gl + ')');

// --- form and development ---------------------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, mk=(age,ovr,pot)=>{ const p=mgNewPlayer(d,'MID',ovr,age,{pot,sub:'CM'}); p.hv='jjjjjjjjj'; p.seed=777; p.mo=0; return p; };
  const prog=(p,f)=>{ const st=devUnpack(p.at), pg=devUnpackPg(p.pg); return DEV_KEYS.filter(f||(()=>true)).reduce((s,k)=>s+st[k]*2+pg[DEV_KEYS.indexOf(k)],0); };
  const tick=(p,n,fm,wg)=>{ for(let i=0;i<n;i++){ d.weeks=300+3*i; p.mw=4; p.fm=fm; if(wg!=null) p.wg=wg; devTick(d,p,{T:0.75,gw:4}); } };
  const a=mk(19,58,70), b=JSON.parse(JSON.stringify(a)), a0=prog(a); tick(a,8,8.0); tick(b,8,5.2); const ga=prog(a)-a0, gb=prog(b)-a0;
  const o=mk(27,66,66), o0={tec:prog(o,k=>devGroup(k)==='tec'), men:prog(o,k=>devGroup(k)==='men'), phy:prog(o,k=>devGroup(k)==='phy')};
  tick(o,8,4.6); const od={tec:prog(o,k=>devGroup(k)==='tec')-o0.tec, men:prog(o,k=>devGroup(k)==='men')-o0.men, phy:prog(o,k=>devGroup(k)==='phy')-o0.phy};
  const s=mk(20,60,72), t=JSON.parse(JSON.stringify(s)), s0=prog(s), sa0=prog(s,k=>k==='shotAcc'); tick(s,8,7.5,5); tick(t,8,7.5,1);
  const fade=(()=>{ const q=mk(25,62,62); q.fm=9; d.weeks=999; devTick(d,q,{T:0.75,gw:0}); return q.fm; })();
  return { ga:+ga.toFixed(2), gb:+gb.toFixed(2), od, sGain:+(prog(s)-s0).toFixed(2), tGain:+(prog(t)-s0).toFixed(2), sAcc:+(prog(s,k=>k==='shotAcc')-sa0).toFixed(2), tAcc:+(prog(t,k=>k==='shotAcc')-sa0).toFixed(2), fade }; })()`);
info('form and development: ' + JSON.stringify(r));
ok(r.ga > r.gb * 1.1, 'twins at 19 in good form and poor: ' + r.ga + ' half points grown against ' + r.gb);
ok(r.od.tec < 0 && r.od.men < 0 && r.od.phy === 0 || (r.od.tec < 0 && r.od.men < 0 && Math.abs(r.od.phy) < 0.5), 'poor form at 27: his touch (' + r.od.tec.toFixed(2) + ') and his reading of the game and composure (' + r.od.men.toFixed(2) + ') go, not his legs (' + r.od.phy.toFixed(2) + ')');
ok(r.sAcc > r.tAcc && r.sGain < r.tGain * 1.15, 'five goals a three weeks against one: a little more finishing (' + r.sAcc + ' against ' + r.tAcc + '), but no more than ' + Math.round((r.sGain / r.tGain - 1) * 100) + '% more growth all told');
ok(r.fade < 9 && r.fade > 6.6, 'form fades back without games to keep it (9 to ' + r.fade + ')');

// --- his season on his card ------------------------------------------------------------------------------------------------------
await page.click('#matchReport .mrContinue').catch(() => {}); await page.waitForTimeout(200);
await K(`(()=>{ const d=CAREER.data; mgSave(d); renderHub(); return 1; })()`);
await page.click('#chCampus [data-bldg="club"]'); await page.waitForSelector('#bldgPanel.show'); await page.click('#bldgPanel .bpTab:text-is("Squad")'); await page.waitForTimeout(120);
const nm = await K(`CAREER.data.roster.find(p=>p.rn>0&&p.role!=='GK').name`);
await page.click(`#bpBody .mgRow:has-text("${nm}")`); await page.waitForTimeout(150);
const card = await page.innerText('#bpBody .mgCard').catch(() => '');
info('his card: ' + card.split('\n').filter(l => /GAMES|ASSISTS|RATING|CLEAN|\d/.test(l)).slice(-8).join(' | '));
ok(/GAMES · GOALS\s*\d+ · \d+/.test(card) && /ASSISTS( · CS)?\s*\d+/.test(card) && /RATING · FORM/.test(card) && /\d\.\d · \d\.\d/.test(card), 'his card: this season\'s games, goals and assists, his average rating and his form');
r = await K(`(()=>{ const d=CAREER.data, p=d.roster.find(x=>x.rn>0); const R={grew:[],retired:[],expired:[],youthOut:[]}; mgAgeWorld(d,R); return { rn:p.rn, rs:p.rs, as:p.as, apps:p.apps, fm:p.fm!=null }; })()`);
ok(r.rn === 0 && r.rs === 0 && r.as === 0 && r.apps === 0 && r.fm, 'a new season: the numbers start again (his form carries on)');

process.exitCode = rep.finish() ? 1 : 0;
await browser.close();
