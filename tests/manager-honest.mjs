// FOOTBALL CLASSIC, HONEST NUMBERS (v155): a man's potential range topped, from 23, at what his age reaches (it ran
// twelve over his potential); a simulated game the same for everyone (no hidden physio help for your side alone); a
// veteran's wage asked once for his age (it was 0.85 again on top of his worth); the dressing room's mood a little of
// every man's rating on match day, played or simulated, and the matchday's paper saying how much; a man settling in at
// a new club coming on as well as he settles (the one hidden value nothing read); and every word of his character
// saying, tapped, what it does. On a copy the test can reach.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  let INJ_OFF=false;', '  let INJ_OFF=true;');
patch('  // ===== END MANAGER CAREER', '  window.__K={ ev:s=>eval(s) };\n  // ===== END MANAGER CAREER');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-hon-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
const K = s => page.evaluate(s => window.__K.ev(s), s);
await page.click('#smItems [data-act="new"]'); await page.waitForTimeout(150);
await page.click('#newSlotList .slotBtn >> nth=0'); await page.waitForTimeout(100);
await page.waitForSelector('#mgrMaker.on', { timeout: 4000 });
await page.fill('#mgName', 'Sam Okafor'); await page.fill('#mgClubIn', 'Honest Town');
await page.click('#mgGo'); await page.waitForSelector('#careerHub.show', { timeout: 8000 });
await K(`(()=>{ const d=CAREER.data; d.story={vet:2,kid:2,phone:2}; mgStoryShow(d); MGUI.noPile=true; pileHide(); mgSave(d); renderHub(); return 1; })()`);

// --- AN HONEST POTENTIAL ------------------------------------------------------------------------------------------------------------
let r = await K(`(()=>{ const d=CAREER.data, all=mgAiClubs(d).flatMap(c=>c.players), old=(p,w)=>{ const pot=p.pot||p.ovr, off=(Math.imul(((p.id>>>0)||1)+977,2654435761)>>>0)%(2*w+1); let lo=pot-off, hi=lo+2*w; if(hi>99){ lo-=hi-99; hi=99; } lo=Math.max(lo,Math.min(p.ovr,pot)); return [lo,Math.max(hi,lo+2)]; };
  const A=all.filter(p=>p.age>=23), Y=all.filter(p=>p.age<=22), capOk=A.filter(p=>potReach(p)!=null).every(p=>{ const [lo,hi]=potRange(p,6); return hi<=Math.max(p.pot,p.ovr+potReach(p),lo+2)&&lo<=Math.max(p.pot,p.ovr)&&hi>=p.pot; });
  const young=Y.every(p=>potRange(p,6).join()===old(p,6).join()), avg=f=>Math.round(A.reduce((a,p)=>a+f(p),0)/A.length*10)/10;
  const p24=A.find(p=>p.age===24&&!devLate(p)); return { n:A.length, capOk, young, was:avg(p=>old(p,6)[1]-p.ovr), now:avg(p=>potRange(p,6)[1]-p.ovr), r24:p24&&[p24.ovr,p24.pot,old(p24,6).join('–'),potRange(p24,6).join('–')] }; })()`);
info('the range\'s top over his rating, 23 and over (no coaches): ' + r.was + ' -> ' + r.now + '; a 24-year-old ' + JSON.stringify(r.r24));
ok(r.capOk && r.young && r.now < r.was - 2, 'his potential range from 23: its top no higher than his age reaches (+5 at 23, +4 at 24... +1 from 29) or his potential if more, always holding it (' + r.n + ' men; on average ' + r.was + ' over his rating, now ' + r.now + '); 22 and under as it was');

// --- THE SAME FOR EVERYONE -------------------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, L=d.lv.physio, out=[]; for(const k of [0,1,2,3,4]){ d.lv.physio=k; out.push(Math.round((mgSimStr(d,d.clubId)-mgStrength(d,d.clubId))*100)/100); } d.lv.physio=L; return out; })()`);
ok(r.every(v => v === 0), 'a simulated game: your side as strong as it is, whatever your physio (' + r.join(', ') + ' from level 0 to 4; it was up to +1.6, yours alone)');

// --- A VETERAN, ASKED ONCE FOR HIS AGE ---------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, V=mgAiClubs(d).flatMap(c=>c.players).filter(p=>p.age>=31&&mgLevelTier(p.ovr)<=d.tier); return { n:V.length, ok:V.every(p=>mgDemand(d,p,true)>=mgRound(mgWage(p.ovr))), r:V.slice(0,3).map(p=>[p.age,p.ovr,mgDemand(d,p,true),mgRound(mgWage(p.ovr))]) }; })()`);
ok(r.n > 0 && r.ok, 'a veteran (31 and over) moving within his level asks at least what he\'d earn staying (' + r.n + ' men; ' + JSON.stringify(r.r) + ' [age, rating, asks, staying]) -- not 0.85 of it again');

// --- THE DRESSING ROOM ON THE PITCH ---------------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, keep=d.tm, at=tm=>{ d.tm=tm; return { o:tmOvr(d), s:Math.round(mgStrength(d,d.clubId)*100)/100, st:careerLineupYours(d).squad[1].stats.composure }; };
  const lo=at(1), mid=at(MOR0), hi=at(10), b8=at(8); d.tm=keep; return { lo, mid, hi, b8 }; })()`);
info('the side\'s mood on the day: ' + JSON.stringify(r));
ok(r.mid.o === 0 && r.hi.o >= 0.3 && r.hi.o <= 0.7 && r.lo.o <= -0.3 && r.lo.o >= -0.7 && r.hi.s > r.mid.s && r.mid.s > r.lo.s && r.hi.st > r.mid.st && r.lo.st < r.mid.st,
  'the dressing room\'s mood on match day: ' + r.lo.o + ' on each man\'s rating at 1, 0 at 6.5, +' + r.b8.o + ' at 8 (buoyant), +' + r.hi.o + ' at 10 -- in a simulated game (the side ' + r.lo.s + ' / ' + r.mid.s + ' / ' + r.hi.s + ') and one you play (his composure ' + r.lo.st + ' / ' + r.mid.st + ' / ' + r.hi.st + ')');
r = await K(`(()=>{ const d=CAREER.data; while(d.phase!=='league'||!mgNextGame(d)) mgForward(d); d.tm=8.6; const g=mgNextGame(d); d.wday='sat'; pileMatchday(d); const x=d.pile.list.find(y=>y.k==='table'); const [t,L]=pileBody(d,x); d.wday='mon'; return L.join(' | ').replace(/<[^>]+>/g,''); })()`);
ok(/The dressing room: buoyant \(8\.6\) · \+0\.\d on each man’s rating today/.test(r), 'the matchday\'s paper says it: "' + (r.match(/The dressing room[^|]*/) || [''])[0].trim() + '"');

// --- A MAN SETTLING IN ---------------------------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, c=mgAiClubs(d)[0], base=c.players.filter(p=>p.age<=21&&p.role!=='GK').sort((a,b)=>(b.pot-b.ovr)-(a.pot-a.ovr))[0];
  const run=(ad,move)=>{ const p=JSON.parse(JSON.stringify(base)), hv=typeof p.hv==='string'?p.hv.split(''):p.hv.slice(); hv[HV_KEYS.indexOf('ad')]=devEnc(ad); p.hv=typeof p.hv==='string'?hv.join(''):hv; delete p.dc; delete p.mvw;
    devTick(d,p,{T:0.9,gw:4,cid:c.id}); if(move) p.dc='elsewhere'; const w0=d.weeks; d.weeks=w0+3; devTick(d,p,{T:0.9,gw:4,cid:c.id}); d.weeks=w0; return { ld:p.ld, mvw:p.mvw!=null }; };
  const a10=run(10,true), a1=run(1,true), stay=run(10,false), stay1=run(1,false); return { a10, a1, stay, stay1 }; })()`);
info('a young man, his tick after a move: settles anywhere ' + r.a10.ld + ', badly ' + r.a1.ld + '; staying put ' + r.stay.ld + ' / ' + r.stay1.ld);
ok(r.a10.mvw && r.a1.mvw && !r.stay.mvw && r.a10.ld > r.a1.ld && r.stay.ld === r.stay1.ld, 'a man settling in at a new club comes on as well as he settles -- SETTLES anywhere more than badly (' + r.a10.ld + ' against ' + r.a1.ld + '); a man who hasn\'t moved, the same either way');

// --- WHAT HIS CHARACTER DOES -----------------------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, p=d.roster[2], h=mgMindSide(d,p,{mine:true}); return [...h.matchAll(/data-xpl="([^"]*)" class="mgFact/g)].map(m=>m[1].replace(/&[a-z#0-9]+;/g,"'")); })()`);
ok(r.length === 9 && r.every(t => /^[A-Z]+: .{20,}/.test(t)) && r.some(t => /^LEARNS: how fast he comes on/.test(t)) && r.some(t => /^SETTLES: /.test(t)), 'his PERSONALITY side: each of the nine words says, tapped, what it does (' + r.map(t => t.split(':')[0]).join(', ') + ')');

process.exitCode = rep.finish();
await browser.close();
