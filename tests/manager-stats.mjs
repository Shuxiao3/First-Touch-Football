// FOOTBALL CLASSIC, A MATCH'S NUMBERS AND ITS RATINGS (v147): in a career match you play, every shot you take is in your
// man's numbers, and every ball your keeper plays out -- from his hands, a goal kick -- is a pass of his, tried, and
// found when one of ours takes it (the report had him at 10 found of 0 tried: the found ones counted, the tries never).
// The report's columns are one thing each -- passes tried, the share found, shots, on target -- with both sides' totals
// under them. And the rating: a keeper's saves count less each and every goal past him counts, to six, so the busiest
// keeper on a beaten side is no longer nearly always its best; a defender's clearances and blocks count with his tackles,
// and his side's small share of the shots; every man's rating starts from how good he is beside the rest on the pitch;
// and over a season a better man rates higher. On a copy with injuries off, and the test let in.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  let INJ_OFF=false;', '  let INJ_OFF=true;');
patch('  // ===== END MANAGER CAREER', '  window.__K={ ev:s=>eval(s) };\n  // ===== END MANAGER CAREER');
// (where each of the keeper's balls went: the first man of either side to have it at his feet)
patch("  function own(p,carryDist,keepPos){\n", "  function own(p,carryDist,keepPos){\n    if(window.__gkBall&&!p.isGK){ (window.__gkTo=window.__gkTo||[]).push(p.team); window.__gkBall=false; }\n");
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-st-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
const K = s => page.evaluate(s => window.__K.ev(s), s);
await page.click('#smItems [data-act="new"]'); await page.waitForTimeout(150);
await page.click('#newSlotList .slotBtn >> nth=0'); await page.waitForTimeout(100);
await page.waitForSelector('#mgrMaker.on', { timeout: 4000 });
await page.fill('#mgName', 'Sam Okafor'); await page.fill('#mgClubIn', 'Counted Town');
await page.click('#mgGo'); await page.waitForSelector('#careerHub.show', { timeout: 8000 });
await K(`(()=>{ const d=CAREER.data; d.story={vet:2,kid:2,phone:2}; mgStoryShow(d); while(!mgNextGame(d)) mgForward(d); mgSave(d); renderHub(); return 1; })()`);
await page.click('#chBottom [data-mg="forward"]').catch(() => {}); await page.waitForTimeout(150);
await page.click('#chBottom [data-mg="play"]'); await page.waitForTimeout(2500);

// --- YOUR SHOTS: five of them, K held and let go, 16 m out ------------------------------------------------------------------------
const quiet = `restartT=0; restartInfo=null; offsideT=0; offsidePass=null; scoredT=0; kickT=0; kickBy=null; kickTo=null;`;
const shooters = {};
for(let i = 0; i < 5; i++){
  const si = await K(`(()=>{ ${quiet} gkHold=null; const c=controlled&&controlled.team==='G'&&!controlled.isGK?controlled:players.find(q=>q.team==='G'&&q.role==='ATT'); if(controlled!==c) switchTo(c);
    const atk=atkOf('G'), gx=atk>0?FW:0; c.x=gx-atk*16*MK; c.y=YC+(${i}-2)*30; c.vx=c.vy=0; c.facing={x:atk,y:0}; c.state='normal'; c.noTouchT=0;
    for(const q of players) if(q!==c&&q.team==='R'&&Math.hypot(q.x-c.x,q.y-c.y)<8*MK){ q.x=FW/2; q.y=40; }
    ball.x=c.x+atk*(c.r+ball.r+4); ball.y=c.y; ball.z=0; ball.vx=ball.vy=ball.vz=0; own(c,c.r+ball.r+4); return c.squadIdx; })()`);
  await page.keyboard.down('KeyK'); await page.waitForTimeout(350); await page.keyboard.up('KeyK'); await page.waitForTimeout(1300);
  shooters[si] = (shooters[si] || 0) + 1;
}
const sh = await K(`(()=>{ const o={}; for(const si of ${JSON.stringify(Object.keys(shooters))}) o[si]=(MSTAT.G[si]||{}).sh||0; return o; })()`);
ok(Object.keys(shooters).every(si => sh[si] >= shooters[si]), 'five shots taken with K, each in the shooter\'s numbers: ' + JSON.stringify(shooters) + ' taken, ' + JSON.stringify(sh) + ' counted');

// --- YOUR KEEPER'S BALLS: three from his hands and three goal kicks, played with J --------------------------------------------------
const gk0 = await K(`(()=>{ const o=MSTAT.G[LINEUP.G.gk]||{}; return { pa:o.pa||0, pc:o.pc||0 }; })()`);
for(const kick of [false, false, false, true, true, true]){
  await K(`(()=>{ ${quiet} const kp=keeperOf('G'); kp.x=kp.homeX; kp.y=YC; kp.vx=kp.vy=0; kp.mode='hold'; kp.holdT=1.0; kp.heldT=0; kp.goalKick=${kick}; gkHold=kp;
    ball.x=kp.x-kp.side*${kick ? 26 : 0}; ball.y=YC; ball.z=${kick ? 0 : 10}; ball.vx=ball.vy=ball.vz=0; ball.ownedBy=null; if(controlled!==kp) switchTo(kp); window.__gkBall=true; return 1; })()`);
  await page.waitForTimeout(600); await page.keyboard.press('KeyJ'); await page.waitForTimeout(2600);
}
const gk = await K(`(()=>{ const o=MSTAT.G[LINEUP.G.gk]||{}; return { pa:o.pa||0, pc:o.pc||0, to:window.__gkTo||[] }; })()`);
info('your keeper\'s balls: ' + JSON.stringify(gk) + ' (before them ' + JSON.stringify(gk0) + ')');
const ours = gk.to.filter(t => t === 'G').length;
ok(gk.pa - gk0.pa >= 6 && gk.pc - gk0.pc === ours && ours >= 4, 'his six balls out are six passes tried in his numbers (' + (gk.pa - gk0.pa) + '), and the ' + ours + ' that reached one of ours are the ones found (' + (gk.pc - gk0.pc) + ')');

// --- THE REPORT: a column a number, and both sides' totals -----------------------------------------------------------------------
const want = await K(`(()=>{ const sum=(S,k)=>Object.values(S).reduce((a,o)=>a+(o[k]||0),0); return { pa:sum(MSTAT.G,'pa'), sh:sum(MSTAT.G,'sh'), son:sum(MSTAT.G,'son'), paR:sum(MSTAT.R,'pa'), shR:sum(MSTAT.R,'sh') }; })()`);
await K(`(()=>{ finishCareerMatch(careerFix); return 1; })()`); await page.waitForTimeout(500);
await page.click('#mrNextBtn'); await page.waitForTimeout(150);
const T = await page.evaluate(() => { const cells = tr => [...tr.children].map(c => c.textContent.trim());
  return { head: [...document.querySelectorAll('#matchReport .mrStats thead th')].map(c => c.textContent.trim()), titles: [...document.querySelectorAll('#matchReport .mrStats thead th')].map(c => c.title),
    rows: [...document.querySelectorAll('#matchReport .mrStats tbody tr')].map(cells), foot: [...document.querySelectorAll('#matchReport .mrStats tfoot tr')].map(cells) }; });
info('the columns: ' + T.head.join(' | ') + '; totals: ' + T.foot.map(r => r.join(' ')).join(' / '));
const col = k => T.head.indexOf(k), num = v => v === '·' || v === '' ? 0 : +v;
const keeper = T.rows.find(r => r[1] === 'GK');
ok(['PASSES', '%', 'SHOTS', 'ON TGT'].every(k => col(k) > 0) && T.titles[col('PASSES')] && T.titles[col('ON TGT')] && T.rows.every(r => r.length === T.head.length),
  'the report has passes tried, the share found, shots and shots on target, each its own column and each with its word on what it is');
ok(keeper && num(keeper[col('PASSES')]) >= 6 && /%$/.test(keeper[col('%')]), 'your keeper\'s line: ' + (keeper && keeper[col('PASSES')]) + ' passes, ' + (keeper && keeper[col('%')]) + ' found -- not found of none');
const sumCol = k => T.rows.reduce((a, r) => a + num(r[col(k)]), 0);
ok(T.foot.length === 2 && num(T.foot[0][col('PASSES')]) === want.pa && sumCol('PASSES') === want.pa && num(T.foot[0][col('SHOTS')]) === want.sh && sumCol('SHOTS') === want.sh && num(T.foot[0][col('ON TGT')]) === want.son
  && num(T.foot[1][col('PASSES')]) === want.paR && num(T.foot[1][col('SHOTS')]) === want.shR,
  'under them both sides\' totals -- yours the sum of your men\'s (' + want.pa + ' passes, ' + want.sh + ' shots, ' + want.son + ' on target), theirs the whole match\'s (' + want.paR + ' and ' + want.shR + ')');

// --- THE RATING -----------------------------------------------------------------------------------------------------------------
const r = await K(`(()=>{ const R=(role,o,res,gc,x)=>mRate(role,o,res,gc,x);
  const old=(role,o,res,gc)=>{ const n=k=>o[k]||0, dim=(x,a)=>a*(1-Math.pow(0.6,x))/0.4; let r=6+res*0.35+dim(n('g'),role==='ATT'?0.9:1.1)+dim(n('a'),0.6)+Math.min(n('son'),4)*0.12+Math.min(n('sh'),6)*0.03;
    r+=Math.min(n('pc'),25)*(role==='MID'?0.04:0.025)-Math.max(0,n('pa')-n('pc'))*0.03; r+=Math.min(n('tk')+n('int'),8)*(role==='DEF'?0.18:0.1)-Math.min(n('lost'),8)*0.06;
    if(role==='GK') r+=Math.min(n('sav'),8)*0.3; if(role==='GK'||role==='DEF') r+=gc===0?0.5:-0.25*Math.min(gc,4); return clamp(Math.round((r-n('og'))*10)/10,3,10); };
  const x47={ovr:47,avg:51}, x70={ovr:70,avg:51}, x59={ovr:59,avg:51};
  // a 0-4 beating: the busy keeper (8 saves, 22 of 26 out), a centre-back who played well, one who didn't do much
  const kp=R('GK',{sav:8,pa:26,pc:22},-1,4,x47), kpOld=old('GK',{sav:8,pc:22},-1,4), cbWell=R('DEF',{tk:3,int:3,clr:3,blk:1,pa:14,pc:12,shf:16,shm:3},-1,4,x70),
    cbOld=old('DEF',{tk:3,int:3,pa:14,pc:12},-1,4), cbPlain=R('DEF',{tk:1,int:2,clr:1,pa:10,pc:8,shf:16,shm:3},-1,4,x59);
  const sv=[0,1,2,4,8,12].map(n=>R('GK',{sav:n},0,1)), seven=R('GK',{sav:4,pa:12,pc:10},-1,7,x47), four=R('GK',{sav:4,pa:12,pc:10},-1,4,x47);
  const cs=R('GK',{sav:5},1,0), def0=R('DEF',{tk:2,int:2},0,1), defClr=R('DEF',{tk:2,int:2,clr:4,blk:2},0,1), defShare=R('DEF',{tk:2,int:2,shf:2,shm:10},0,1), defShareBad=R('DEF',{tk:2,int:2,shf:12,shm:1},0,1);
  const a70=R('MID',{pa:20,pc:16},0,1,{ovr:70,avg:60}), a60=R('MID',{pa:20,pc:16},0,1,{ovr:60,avg:60}), a50=R('MID',{pa:20,pc:16},0,1,{ovr:50,avg:60}), a90=R('MID',{pa:20,pc:16},0,1,{ovr:90,avg:60});
  return { kp, kpOld, cbWell, cbOld, cbPlain, sv, seven, four, cs, def0, defClr, defShare, defShareBad, a70, a60, a50, a90 }; })()`);
info('the ratings: ' + JSON.stringify(r));
ok(r.kp < r.cbWell && r.kpOld > r.cbOld && r.kp <= r.kpOld - 1.5 && r.cbPlain <= r.kp + 0.3,
  'beaten 0-4: the busy keeper (eight saves) ' + r.kp + ' (it was ' + r.kpOld + '), under the centre-back who played well, ' + r.cbWell + ' (who had ' + r.cbOld + ' and was under the keeper); one who did little ' + r.cbPlain);
const steps = r.sv.slice(1).map((v, i) => +(v - r.sv[i]).toFixed(1));
ok(steps.every(s => s >= 0) && r.sv[5] - r.sv[0] <= 1.2 && r.sv[1] - r.sv[0] >= 0.4 && r.seven < r.four - 0.5,
  'his saves each count less: none to 1, 2, 4, 8 and 12 saves ' + r.sv.join(', ') + ' (the most they give him ' + (r.sv[5] - r.sv[0]).toFixed(1) + '); seven goals past him rate under four (' + r.seven + ' and ' + r.four + ')');
ok(r.cs >= 7.5 && r.defClr > r.def0 && r.defShare > r.def0 && r.defShareBad === r.def0,
  'five saves and a clean sheet in a win ' + r.cs + '; a defender\'s clearances and blocks count (' + r.def0 + ' to ' + r.defClr + '), and his side letting them have few of the shots (' + r.defShare + '), never against him when they had many (' + r.defShareBad + ')');
ok(r.a70 > r.a60 && r.a60 > r.a50 && +(r.a90 - r.a60).toFixed(1) <= 0.4, 'the same game\'s numbers, rated by how good he is beside the 18 on the pitch: ' + r.a50 + ', ' + r.a60 + ', ' + r.a70 + ' for a man 10 under, level and 10 over, and no more than a third of a point (' + r.a90 + ' at 30 over)');

// --- A SEASON: the better men rate higher ---------------------------------------------------------------------------------------------
await page.click('#mrContinueBtn').catch(() => {}); await page.waitForTimeout(300);
const c = await K(`(()=>{ const d=CAREER.data; let i=0; while(i<3000&&!d.review&&d.md<MG_MD-1){ if(mgNextGame(d)) mgSim(d); else mgForward(d); i++; }
  const W=d.world, tier=new Map(); for(const c of Object.values(W.clubs)) for(const p of c.players||[]) tier.set(p,c.tier); for(const p of d.roster) tier.set(p,d.tier);
  const men=[...tier.keys()].filter(p=>(p.rn||0)>=10), m=a=>a.reduce((x,y)=>x+y,0)/a.length;
  const corr=(L,mx,my)=>{ let c=0,x=0,y=0; for(const p of L){ const dx=p.ovr-mx(p), dy=p.rs/p.rn-my(p); c+=dx*dy; x+=dx*dx; y+=dy*dy; } return +(c/Math.sqrt(x*y)).toFixed(3); };
  const ax=m(men.map(p=>p.ovr)), ay=m(men.map(p=>p.rs/p.rn)), tx={}, ty={};
  for(const t of [1,2,3,4]){ const L=men.filter(p=>tier.get(p)===t); tx[t]=m(L.map(p=>p.ovr)); ty[t]=m(L.map(p=>p.rs/p.rn)); }
  return { men:men.length, r:corr(men,()=>ax,()=>ay), within:corr(men,p=>tx[tier.get(p)],p=>ty[tier.get(p)]) }; })()`);
ok(c.men >= 300 && c.within > 0.35 && c.r > 0.05, 'a season: a man\'s average rating goes with how good he is -- in his own league r = ' + c.within + ' (v146: 0.51 to 0.55), across all four ' + c.r + ' (' + c.men + ' men with ten games or more; each league\'s ratings are its own, as its results are)');

process.exitCode = rep.finish();
await browser.close();
