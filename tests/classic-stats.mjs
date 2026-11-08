// FOOTBALL CLASSIC, PASSING AND COMPOSURE IN TWO (v163): Passing is SHORT PASSING and LONG PASSING now, and Composure is
// COMPOSURE IN TRAFFIC and FINAL THIRD COMPOSURE. A pass goes by Short passing up to 12 m and by Long passing from 32 m,
// a blend of the two between (a quarter Long at 17 m, half at 22 m, three-quarters at 27 m); a man's range and his
// wind-up go by Long passing. The composure an action uses is his Composure in traffic in his own half and the middle,
// and his Final third composure going into theirs (all of it 74% of the way up the pitch). Every man has both: an
// exhibition side's (its men's old stats exactly as they were) and a career's; a career from before gets them once, from
// each man's own Short passing and Composure by his role and archetype. The card shows them under PASSING and SHOOTING.
// On a copy the test can reach.
import { open, startExhibition } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  let INJ_OFF=false;', '  let INJ_OFF=true;');
patch('  // ===== END MANAGER CAREER', '  window.__K={ ev:s=>eval(s) };\n  // ===== END MANAGER CAREER');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-st-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
const K = s => page.evaluate(s => window.__K.ev(s), s);

// --- THE STATS ------------------------------------------------------------------------------------------------------------------
let r = await K(`({ out:OUT_KEYS.join(','), lab:[STAT_LABEL.passAcc,STAT_LABEL.longPass,STAT_LABEL.composure,STAT_LABEL.compFinal], dials:[P.passAcc.label,P.longPass.label,P.composure.label,P.compFinal.label],
  six:SIX.filter(g=>g[0]==='PAS'||g[0]==='SHO'||g[0]==='TEC').map(g=>g[0]+':'+g[2].join('/')).join(' '),
  w:['DEF','MID','ATT'].map(k=>[OVR_W[k].passAcc,OVR_W[k].longPass,OVR_W[k].composure,OVR_W[k].compFinal].join('/')).join(' '), gk:[OVR_W.GK.passAcc,OVR_W.GK.composure,OVR_W.GK.longPass||0,OVR_W.GK.compFinal||0].join('/') })`);
info('the stats: ' + JSON.stringify(r));
ok(/passAcc,longPass,composure,compFinal/.test(r.out) && r.lab.join('|') === 'Short pass|Long pass|Traffic comp.|Final 3rd comp.' && /^Short passing/.test(r.dials[0]) && /^Long passing/.test(r.dials[1]) && /^Composure in traffic/.test(r.dials[2]) && /^Final third composure/.test(r.dials[3]),
  'Passing is Short passing and Long passing, Composure is Composure in traffic and Final third composure: on the cards "' + r.lab.join('", "') + '"');
ok(r.six === 'TEC:ballControl/dribbling/composure/curve PAS:passAcc/longPass/crossing/offIQ SHO:shotAcc/shotPower/longShots/compFinal' && r.w === '1/1/2/1 3/2/3/1 1/1/2/2' && r.gk === '1/1/0/0',
  'the card: Long passing under PASSING, Final third composure under SHOOTING; the ratings share what each weighed (a defender 1+1 and 2+1, a midfielder 3+2 and 3+1, a forward 1+1 and 2+2; a keeper as he was)');

// --- THE PASS'S STAT, BY ITS LENGTH ----------------------------------------------------------------------------------------------
r = await K(`(()=>{ const p={stats:{passAcc:9,longPass:3}}; return [6,12,17,22,27,32,45].map(m=>+passStatAt(p,m*MK).toFixed(2)); })()`);
ok(r.join() === '9,9,7.5,6,4.5,3,3', 'a pass goes by Short passing up to 12 m, Long passing from 32 m, a blend between -- Short 9 and Long 3 at 6, 12, 17, 22, 27, 32 and 45 m: ' + r.join(', '));

// --- ON THE PITCH: a short passer and a long passer --------------------------------------------------------------------------------
await startExhibition(page); await page.waitForTimeout(1500);
r = await K(`(()=>{ const c=players.find(q=>q.team==='G'&&!q.isGK), keep=c.stats, atk=atkOf(c.team), where=[c.x,c.y]; c.x=atk>0?FW*0.3:FW*0.7; c.y=YC;
  const far=[]; for(const o of [...players,...keepers]) if(o.team!==c.team){ far.push([o,o.x,o.y]); o.x=atk>0?FW*0.97:FW*0.03; o.y=40; }   // (nobody near him)
  const spr=(st,m)=>{ c.stats=Object.assign({},keep,st); let s=0; for(let i=0;i<4000;i++) s+=Math.abs(passSpray(m*MK,c)); c.stats=keep; return +(s/4000*180/Math.PI).toFixed(3); };
  const S={passAcc:10,longPass:1}, L={passAcc:1,longPass:10};
  const out={ s8:spr(S,8), l8:spr(L,8), s40:spr(S,40), l40:spr(L,40), pf:+pressFactor(c).toFixed(2) };
  c.stats=Object.assign({},keep,S); out.rS=Math.round(passRangeOf(c)); c.stats=Object.assign({},keep,L); out.rL=Math.round(passRangeOf(c)); c.stats=keep;
  for(const [o,x,y] of far){ o.x=x; o.y=y; } [c.x,c.y]=where; return out; })()`);
info('the spray, degrees off on average -- Short 10/Long 1: ' + r.s8 + ' at 8 m, ' + r.s40 + ' at 40 m; Short 1/Long 10: ' + r.l8 + ', ' + r.l40 + ' (pressure ' + r.pf + ')');
ok(r.pf === 0 && r.s8 < r.l8 * 0.5 && r.l40 < r.s40 * 0.25, 'on the pitch, nobody near: the short passer is truer at 8 m (' + r.s8 + '° to ' + r.l8 + '°), the long passer far truer at 40 m (' + r.l40 + '° to ' + r.s40 + '°)');
ok(r.rS === 281 && r.rL === 713, 'how far a man can hit it well goes by his Long passing: ' + r.rS + ' px at Long 1, ' + r.rL + ' at 10');

// --- COMPOSURE, WHERE HE IS ----------------------------------------------------------------------------------------------------------
r = await K(`(()=>{ const c=players.find(q=>q.team==='G'&&!q.isGK), keep=c.stats, atk=atkOf(c.team), where=[c.x,c.y]; c.stats=Object.assign({},keep,{composure:9,compFinal:2}); c.y=YC;
  const at=f=>{ c.x=atk>0?f*FW:(1-f)*FW; return +composureAt(c).toFixed(2); }, out={ own:at(0.3), mid:at(0.55), half:at(0.68), deep:at(0.85) };
  const o=players.find(q=>q.team!==c.team&&!q.isGK), ow=[o.x,o.y], others=[]; for(const q of [...players,...keepers]) if(q.team!==c.team&&q!==o){ others.push([q,q.x,q.y]); q.x=atk>0?FW*0.5:FW*0.5; q.y=10; }
  const pl=f=>{ c.x=atk>0?f*FW:(1-f)*FW; o.x=c.x+atk*40; o.y=c.y; return +poiseLoss(c).toFixed(2); }; out.plOwn=pl(0.3); out.plDeep=pl(0.85);
  for(const [q,x,y] of others){ q.x=x; q.y=y; } [o.x,o.y]=ow; c.stats=keep; [c.x,c.y]=where; return out; })()`);
info('composure where he is (in traffic 9, final third 2): ' + JSON.stringify(r));
ok(r.own === 9 && r.mid === 9 && r.half === 5.5 && r.deep === 2 && r.plOwn === 0.2 && r.plDeep === 0.9,
  'the composure he plays with: in traffic in his own half and the middle (9), the final third\'s going into theirs -- half and half at 68% of the way up (5.5), all of it deep in it (2); a man on him costs 0.2 back there, 0.9 there');

// --- EVERY MAN HAS BOTH ----------------------------------------------------------------------------------------------------------------
r = await K(`(()=>{ const all=[...SQUAD.G,...SQUAD.R]; return { n:all.length, both:all.filter(e=>isFinite(e.stats.longPass)&&isFinite(e.stats.compFinal)).length }; })()`);
ok(r.n >= 18 && r.both === r.n, 'every man of an exhibition side has both new stats (' + r.both + ' of ' + r.n + ')');
await page.goto('file://' + copy); await page.waitForTimeout(700);
await page.click('#smItems [data-act="new"]'); await page.waitForTimeout(150);
await page.click('#newSlotList .slotBtn >> nth=0'); await page.waitForSelector('#mgrMaker.on', { timeout: 4000 });
await page.fill('#mgName', 'Sam Okafor'); await page.fill('#mgClubIn', 'Stat Town'); await page.click('#mgGo'); await page.waitForSelector('#careerHub.show', { timeout: 8000 });
r = await K(`(()=>{ const d=CAREER.data; d.story={vet:2,kid:2,phone:2}; mgStoryShow(d); MGUI.noPile=true; pileHide(); const all=[...d.roster,...Object.values(d.world.clubs).flatMap(c=>c.players)];
  return { st163:!!d.st163, n:all.length, len:[...new Set(all.map(p=>(mgStats(p),p.at.length)))].join(','), rated:all.every(p=>p.ovr===clamp(cwOverall(p.role,mgStats(p)),30,95)) }; })()`);
ok(r.st163 && r.len === '28' && r.rated, 'a new career: every man\'s 28 attributes, the new two among them (' + r.n + ' men), each rated by them');

// --- A CAREER FROM BEFORE ---------------------------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, keep=d.roster.map(p=>[p.at,p.cl,p.bs,p.ovr,p.pot]); for(const p of d.roster){ p.at=p.at.slice(0,26); p.cl=p.cl.slice(0,26); p.bs=p.bs.slice(0,26); } delete d.st163; mgMigrate(d);
  const bad=[]; for(const p of d.roster){ const st=mgStats(p), A=ARCH[p.role], s=STYLES[p.style]&&STYLES[p.style].d||{};
    const lp=clamp(Math.round((st.passAcc+(A.longPass+(s.longPass||0))-(A.passAcc+(s.passAcc||0)))*2)/2,1,10), cf=clamp(Math.round((st.composure+(A.compFinal+(s.compFinal||0))-(A.composure+(s.composure||0)))*2)/2,1,10);
    if(p.at.length!==28||st.longPass!==lp||st.compFinal!==cf||p.ovr!==clamp(cwOverall(p.role,st),30,99)||devUnpack(p.cl).longPass<st.longPass) bad.push(p.name); }
  const eg=d.roster.find(p=>p.style==='deepcreator'||p.style==='playmaker'||p.style==='ballplayer')||d.roster[1], es=mgStats(eg);
  const out={ st163:!!d.st163, bad, n:d.roster.length, eg:[eg.style,es.passAcc,es.longPass,es.composure,es.compFinal] };
  d.roster.forEach((p,i)=>{ [p.at,p.cl,p.bs,p.ovr,p.pot]=keep[i]; }); return out; })()`);
info('a career from before: ' + JSON.stringify(r));
ok(r.st163 && !r.bad.length, 'a career from before (26 attributes a man): once, as it\'s loaded, every man\'s Long passing and Final third composure from his own Short passing and Composure, moved as his role and archetype move them (' + r.eg.join(' ') + '), his ceiling with them, and his rating on the new weights (' + r.n + ' men)');

// --- THE CARD ------------------------------------------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, p=d.roster.find(q=>q.role==='MID'); curTab.club='Squad'; openBuilding('club'); MGUI.sel=p.id; mgSide='rate'; sixOpen='PAS'; paintBuilding();
  const pas=[...document.querySelectorAll('#bpBody .sixOpen .statRow .sl')].map(e=>e.textContent); sixOpen='SHO'; paintBuilding();
  const sho=[...document.querySelectorAll('#bpBody .sixOpen .statRow .sl')].map(e=>e.textContent); sixOpen=null; hideBldg(); return { pas, sho }; })()`);
ok(r.pas.join() === 'Short pass,Long pass,Crossing,Off IQ' && r.sho.join() === 'Shot acc,Shot power,Long shots,Final 3rd comp.', 'his card: PASSING ' + r.pas.join(', ') + '; SHOOTING ' + r.sho.join(', '));

process.exitCode = rep.finish();
await browser.close();
