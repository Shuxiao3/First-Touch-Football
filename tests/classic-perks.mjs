// FOOTBALL CLASSIC, PERKS (v234): what a man does on the pitch beyond his numbers. Regular perks come by chance -- each
// one his position can have at its chance, three times as likely for the playstyles it suits, three a man at most -- and
// are the same every time for the same man (rolled from his career id, or his name and playstyle); a star has what he's
// given on the Signature Players sheet. Each perk does what the Perks Master Sheet says: Presser, Jumper, Whipped pass,
// Bend it like.., Finesse (Screamer before v237), Touch pass, Reliable, Fox in the box, Quickshot, Press resistant; and the superstar ones,
// Untouchable, Apex, Godspeed, Predator, Tiki taka, Maestro, Aura Defense and Glorious Leader (one of each of those two a
// side). They show as chips on a man's card. (A man's character traits -- Natural Leader and the rest -- are another thing.)
// On a copy of the game that lets the test reach inside.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  // ===== END MANAGER CAREER', '  window.__K={ ev:s=>eval(s) };\n  // ===== END MANAGER CAREER');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-perks-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
const K = s => page.evaluate(s => window.__K.ev(s), s);
const near = (a, b, t) => Math.abs(a - b) <= t;

// --- WHO HAS WHAT: rolled by position and playstyle, the same every time ------------------------------------------------
const roll = await K(`(()=>{ const per={}, tally={}, fav={}; let men=0, over=0, wrong=0, same=0;
  for(const k in STYLES){ const sub=STYLES[k].sub; for(let i=0;i<3000;i++){ const pk=rollPerks('t'+k+i,sub,k); men++;
    if(pk.length>PERK_SET.maxPer) over++; for(const x of pk){ if(PERKS[x].who.indexOf(sub)<0) wrong++; tally[x]=(tally[x]||0)+1;
      const f=PERKS[x].favs.indexOf(k)>=0?'fav':'other'; fav[x]=fav[x]||{fav:0,other:0,nf:0,no:0}; fav[x][f]++; }
    per[sub]=per[sub]||{n:0,a:0}; per[sub].n++; if(pk.length) per[sub].a++;
    if(i<50&&JSON.stringify(rollPerks('t'+k+i,sub,k))===JSON.stringify(pk)) same++; } }
  // how often a perk comes to a man of a playstyle it suits, against one it doesn't (per man of each)
  const rate={}; for(const x of ['jumper','quickshot','pressres']){ const d=PERKS[x]; let fN=0,fH=0,oN=0,oH=0;
    for(const k in STYLES){ const sub=STYLES[k].sub; if(d.who.indexOf(sub)<0) continue; const isF=d.favs.indexOf(k)>=0;
      for(let i=0;i<3000;i++){ const h=rollPerks('t'+k+i,sub,k).indexOf(x)>=0; if(isF){ fN++; fH+=h; } else { oN++; oH+=h; } } }
    rate[x]={fav:+(fH/fN).toFixed(3), other:+(oH/oN).toFixed(3)}; }
  const share=s=>+(per[s].a/per[s].n).toFixed(2);
  return { men, over, wrong, same, CB:share('CB'), AM:share('AM'), STK:share('STK'), GK:share('GK'), presserWho:PERKS.presser.who.join(), foxWho:PERKS.fox.who.join(), rate }; })()`);
info('rolled: ' + JSON.stringify(roll));
ok(roll.over === 0 && roll.wrong === 0 && roll.same === 34 * 50, 'a man rolls only perks his position can have, three at most, and the same ones every time (' + roll.men + ' men)');
ok(near(roll.CB, 0.67, 0.03) && near(roll.AM, 0.68, 0.03) && near(roll.STK, 0.72, 0.03) && roll.GK <= 0.14,
  'with twenty-six regular perks (v237) about seven in ten outfielders have one, keepers about one in ten (Reliable, Doctor from Ibiza, Big game player): CB ' + roll.CB + ', AM ' + roll.AM + ', ST ' + roll.STK + ', GK ' + roll.GK + ' -- as the sheet works it out');
ok(Object.values(roll.rate).every(r => r.fav > 2.4 * r.other && near(r.other, 0.04, 0.012)),
  'a perk comes three times as often to the playstyles it suits (4 in 100 men, 12 in 100 of those): ' + JSON.stringify(roll.rate));
ok(roll.presserWho === 'WNG,STK' && roll.foxWho === 'STK,AM,WNG', 'Presser only for attackers; Fox in the box for strikers, attacking midfielders and wingers');

// --- IN A MATCH: a man takes his squad entry's perks; a star what he's given --------------------------------------------
await K(`startExhibition()`); await page.waitForTimeout(300); await K(`kickOffExhibition()`); await page.waitForTimeout(1500);
const mt = await K(`(()=>{ const all=players;   // (the outfielders: the keepers are set apart -- see the README's note on v234)
  const match=all.every(p=>{ const e=(SQUAD[p.team]||[]).find(x=>x.name===p.pname); return !!e&&JSON.stringify(p.pk)===JSON.stringify(perksOfEntry(e)); });   // (by his name: a keeper's squadIdx isn't his entry's)
  const st=STARS[0], was=st.pk; st.pk=['godspeed','fox']; const sp=perksOfEntry({star:st.key, name:'x', style:'poacher'}); st.pk=['godspeed','fox','apex','maestro','leader']; const four=perksOfEntry({star:st.key}); st.pk=null; const none=perksOfEntry({star:st.key}); st.pk=was;
  const given=STARS.filter(s=>s.pk&&s.pk.length), bad=given.filter(s=>s.pk.length>3||s.pk.some(k=>!PERKS[k])).map(s=>s.key);
  const one=['aura','leader'].every(k=>{ const ex=given.filter(s=>s.pk.includes(k)).map(s=>s.ex); return new Set(ex).size===ex.length; });
  const inMatch=players.filter(p=>STARS.some(s=>s.pk&&s.pk.length&&s.name===p.pname)).map(p=>({n:p.pname,pk:p.pk.join()}));
  const okMatch=inMatch.every(m=>STARS.find(s=>s.name===m.n).pk.slice(0,3).join()===m.pk);
  return { match, n:all.length, with:all.filter(p=>p.pk&&p.pk.length).length, star:sp, starNone:none, given:given.length, bad, one, inMatch, okMatch, petita:(STARS.find(s=>s.key==='petita').pk||[]).join(), four:four.join(), maxPer:PERK_SET.maxPer, cap:PERK_MAX }; })()`);
ok(mt.match && mt.n === 16, 'in an exhibition every outfielder has his squad entry\'s perks (' + mt.with + ' of the 16 have one)');
ok(mt.star.join() === 'godspeed,fox' && mt.starNone.length === 0, 'a star has what he\'s given on the sheet and nothing rolled: ' + mt.star.join(', ') + ' (none given: none)');
ok(mt.given >= 25 && mt.bad.length === 0 && mt.one && mt.petita === 'untouchable,quickshot,whipped', 'the sheet\'s perks in the game: ' + mt.given + ' stars given some, none more than three or unknown, Aura and Leader one a club; Messiah Petita ' + mt.petita);
ok(mt.okMatch && mt.inMatch.length > 0, 'a star in a match plays with the sheet\'s perks (' + mt.inMatch.map(m=>m.n+': '+m.pk).join('; ') + ')');
ok(mt.four === 'godspeed,fox,apex' && mt.maxPer === 3 && mt.cap === 3, 'three perks a man at most: a star given five has the first three (' + mt.four + '); a man rolls three at most')

// --- THE SUPERSTAR PERKS ON HIS NUMBERS: Godspeed, Untouchable, Predator, Maestro, Leader, Tiki taka, Aura -------------
const fx = await K(`(()=>{ const all=players.concat(keepers), G=players.filter(p=>p.team==='G'), R=players.filter(p=>p.team==='R');
  const keep=all.map(p=>[p,p.pk,p.x,p.y]), kb={o:ball.ownedBy,d:ball.dribbler,g:ball.dribbleGrace,t:ball.thru,i:ball.intendedRcv,l:ball.lastTouch,x:ball.x,y:ball.y}, kr={...tikiRun};
  const clear=()=>{ for(const p of all) p.pk=[]; ball.ownedBy=null; ball.dribbler=null; ball.thru=null; ball.intendedRcv=null; tikiRun={G:0,R:0}; };
  const out={};
  // Godspeed: his Speed 12, quicker flat out than a 10
  clear(); const a=G[1]; a.pk=['godspeed']; perkTick(); out.god={speed:statOf(a,'speed',5), top:Math.round(sprintSpeedOf(a)), ten:Math.round(sprintSpeedOf({stats:{speed:10}}))};
  // Untouchable: on the ball, Strength +2 and Acceleration +3 (over 10); off it, nothing
  clear(); a.pk=['untouchable']; const s0=a.stats.strength, a0=a.stats.acceleration; a.stats.acceleration=9.5; perkTick(); const off={s:statOf(a,'strength',5),a:statOf(a,'acceleration',5)};
  ball.ownedBy=a; perkTick(); out.unt={off, on:{s:statOf(a,'strength',5), a:statOf(a,'acceleration',5)}, base:{s:s0}}; a.stats.acceleration=a0;
  // ...and the angle the ball can be taken from: the same man at 60 degrees off where the ball shows
  ball.x=a.x+20; ball.y=a.y; const q={x:a.x+20*Math.cos(1.05),y:a.y+20*Math.sin(1.05)};
  a.pk=[]; const e0=ballExposure(a,q); a.pk=['untouchable']; const e1=ballExposure(a,q); out.angle={e0:+e0.toFixed(3), e1:+e1.toFixed(3)};
  // Predator: onto a team-mate's through ball, +2 Speed, Acceleration, Strength; once he has it, not
  clear(); a.pk=['predator']; ball.thru={x:a.x+100,y:a.y,until:simNow+3}; ball.intendedRcv=a; ball.lastTouch=a.team; perkTick();
  const run={sp:statOf(a,'speed',5)-a.stats.speed, ac:statOf(a,'acceleration',5)-a.stats.acceleration}; ball.ownedBy=a; perkTick(); out.pred={run, got:statOf(a,'speed',5)-a.stats.speed};
  // Maestro: for a second after his directional touch, Speed, Acceleration, Agility +2
  clear(); a.pk=['maestro']; a.maestroT=simNow+1; perkTick(); out.mae={sp:statOf(a,'speed',5)-a.stats.speed, ag:+(statOf(a,'agility',5)-a.stats.agility).toFixed(2)}; a.maestroT=simNow-1; perkTick(); out.maeAfter=statOf(a,'speed',5)-a.stats.speed;
  // Glorious Leader: every team-mate's composures +0.5 (up to 10), not his own, not theirs; a second leader adds nothing
  clear(); a.pk=['leader']; G[2].pk=['leader']; const m=G[3]; m.stats.composure=6; m.stats.compFinal=9.8; perkTick();
  out.lead={mate:statOf(m,'composure',5), fin:statOf(m,'compFinal',5), self:statOf(a,'composure',5)-a.stats.composure, them:statOf(R[2],'composure',5)-R[2].stats.composure};
  // Tiki taka: +0.1 a completed pass in a row, two men twice as fast, +3 at most, still up to 10
  clear(); const pa0=m.stats.passAcc; m.stats.passAcc=5; a.pk=['tikitaka']; tikiRun.G=10; perkTick(); const one=+(statOf(m,'passAcc',5)-m.stats.passAcc).toFixed(2);
  G[2].pk=['tikitaka']; perkTick(); const two=+(statOf(m,'passAcc',5)-m.stats.passAcc).toFixed(2);
  tikiRun.G=40; perkTick(); const cap=+(statOf(m,'passAcc',5)-m.stats.passAcc).toFixed(2); m.stats.passAcc=9; perkTick(); const top=statOf(m,'passAcc',5); m.stats.passAcc=pa0;
  out.tiki={one, two, cap, top, theirs:statOf(R[2],'passAcc',5)-R[2].stats.passAcc};
  // Aura Defense: their men within 5 m of him Off IQ -2 and Ball control -1; further off, nothing
  clear(); const b=R[1]; b.pk=['aura']; const n1=G[4], f1=G[5]; n1.x=b.x+3*MK; n1.y=b.y; f1.x=b.x+9*MK; f1.y=b.y; perkTick();
  out.aura={nearIQ:+(statOf(n1,'offIQ',5)-(n1.slotAtk?Math.max(1,n1.stats.offIQ-posPenOf(n1).offIQ):n1.stats.offIQ)).toFixed(2), nearBC:statOf(n1,'ballControl',5)-n1.stats.ballControl, farBC:statOf(f1,'ballControl',5)-f1.stats.ballControl, own:statOf(R[2],'ballControl',5)-R[2].stats.ballControl};
  for(const [p,pk,x,y] of keep){ p.pk=pk; p.x=x; p.y=y; } Object.assign(ball,{ownedBy:kb.o,dribbler:kb.d,dribbleGrace:kb.g,thru:kb.t,intendedRcv:kb.i,lastTouch:kb.l,x:kb.x,y:kb.y}); tikiRun=kr; a.maestroT=0; m.stats.composure=m.stats.composure; perkTick();
  return out; })()`);
info('superstar perks on the numbers: ' + JSON.stringify(fx));
ok(fx.god.speed === 12 && fx.god.top > fx.god.ten + 15, 'Godspeed: he runs as if his Speed were 12 -- ' + fx.god.top + ' px/s flat out against a Speed 10 man\'s ' + fx.god.ten);
ok(fx.unt.off.s === fx.unt.base.s && near(fx.unt.on.s - fx.unt.base.s, 2, 0.01) && fx.unt.on.a === 12.5 && fx.unt.off.a === 9.5,
  'Untouchable: with the ball Strength +2 and Acceleration +3, over 10 (9.5 to 12.5); without it, his own');
ok(fx.angle.e1 < fx.angle.e0 - 0.05, 'Untouchable: a defender 60 degrees off where the ball shows sees less of it (' + fx.angle.e0 + ' to ' + fx.angle.e1 + ' of it showing): the angle it can be taken from 40% smaller');
ok(fx.pred.run.sp === 2 && fx.pred.run.ac === 2 && fx.pred.got === 0, 'Predator: running onto a team-mate\'s through ball +2 Speed and Acceleration; once he has it, back to himself');
ok(fx.mae.sp === 2 && fx.mae.ag === 2 && fx.maeAfter === 0, 'Maestro: for a second after his touch, Speed, Acceleration and Agility +2; then his own');
ok(fx.lead.mate === 6.5 && fx.lead.fin === 10 && fx.lead.self === 0 && fx.lead.them === 0, 'Glorious Leader: a team-mate\'s composures +0.5 (6 to 6.5; 9.8 only to 10), not his own nor theirs; a second leader adds nothing');
ok(fx.tiki.one === 1 && fx.tiki.two === 2 && fx.tiki.cap === 3 && fx.tiki.top === 10 && fx.tiki.theirs === 0,
  'Tiki taka: ten passes in a row +1 to the side\'s Short passing (two men with it, +2), +3 at most, never over 10; not theirs');
ok(fx.aura.nearIQ === -2 && fx.aura.nearBC === -1 && fx.aura.farBC === 0 && fx.aura.own === 0, 'Aura Defense: one of theirs 3 m from him Off IQ -2 and Ball control -1; 9 m off, nothing; his own side, nothing');

// --- THE REGULAR PERKS: each where it's used ----------------------------------------------------------------------------
const rg = await K(`(()=>{ const G=players.filter(p=>p.team==='G'), R=players.filter(p=>p.team==='R'), a=G[1], keep=a.pk, out={};
  const kb={o:ball.ownedBy,x:ball.x}, kg=gkHold; gkHold=null;
  // Presser: without the ball a sprint costs half; with it, all
  a.pk=['presser']; ball.ownedBy=R[1]; out.pressOff=presserK(a); ball.ownedBy=G[2]; out.pressOn=presserK(a);
  // Jumper: 20% higher -- the take-off speed the square root of it; Apex 35% more at their goal, not ours
  a.pk=[]; const v0=headJumpVz(a); a.pk=['jumper']; const v1=headJumpVz(a); a.pk=['apex']; const sx=a.x; a.x=FW/2+atkOf(a.team)*200; const v2=headJumpVz(a); a.x=FW/2-atkOf(a.team)*200; const v3=headJumpVz(a); a.x=sx;
  out.jump={j:+(v1/v0).toFixed(4), apexThem:+(v2/v0).toFixed(4), apexUs:+(v3/v0).toFixed(4)};
  a.pk=[]; const h0=headPowerOf(a); a.pk=['apex']; out.head=+(headPowerOf(a)/h0).toFixed(3);
  // Curve: Whipped pass on his passes, Bend it like.. on his crosses, Finesse on his long shots (Screamer before v237) -- 1.5 more, up to 10
  const c0=a.stats.curve; a.stats.curve=6; a.pk=[]; const pb0=passBendOf(a), cr0=crossPot(a), lg0=curveOf(a,true);
  a.pk=['whipped']; const pb1=passBendOf(a); a.stats.curve=7.5; a.pk=[]; const pb15=passBendOf(a); a.stats.curve=6;
  a.pk=['bendit']; const cr1=crossPot(a); a.pk=['finesse']; const lg1=curveOf(a,true), sh1=curveOf(a,false);
  a.stats.curve=9.5; a.pk=['whipped']; const capd=passBendOf(a); a.pk=[]; a.stats.curve=10; const ten=passBendOf(a);
  PERKS.whipped.p.over=true; a.stats.curve=9.5; a.pk=['whipped']; const ov=passBendOf(a); PERKS.whipped.p.over=false; a.stats.curve=c0;
  out.curve={pass:+(pb1/pb15).toFixed(3), passUp:+(pb1/pb0).toFixed(2), cross:+(cr1/cr0).toFixed(3), long:+(lg1/lg0).toFixed(2), shortShot:+(sh1/lg0).toFixed(3), capd:+(capd/ten).toFixed(3), over:+(ov/ten).toFixed(3)};
  // Touch pass: a pass played first time sprays 25% less
  a.pk=[]; ball.ownedBy=a; a.prepT=simNow; const w0=prepWorst(a); a.pk=['touchpass']; const w1=prepWorst(a); out.touch=+(w1/w0).toFixed(3);
  // Press resistant: a quarter less of the pressure in his touch
  a.pk=[]; const tp0=touchPressure(a); a.pk=['pressres']; out.press={k:presResK(a), t:tp0>0?+(touchPressure(a)/tp0).toFixed(3):null};
  // Fox in the box: a parry within 6 m of him -- he's onto it; 10 m off, not; nor theirs
  a.pk=['fox']; const f=G[2]; f.pk=['fox']; const o=R[2]; o.pk=['fox']; ball.ownedBy=null; ball.x=a.x+4*MK; ball.y=a.y; f.x=ball.x+10*MK; f.y=ball.y; o.x=ball.x+2*MK; o.y=ball.y;
  a.foxT=f.foxT=o.foxT=0; foxRebound(a.team); out.fox={near:a.foxT>simNow, far:f.foxT>simNow, theirs:o.foxT>simNow};
  a.foxT=0; f.pk=[]; o.pk=[];
  a.pk=keep; ball.ownedBy=kb.o; ball.x=kb.x; gkHold=kg; return out; })()`);
info('regular perks: ' + JSON.stringify(rg));
ok(rg.pressOff === 0.5 && rg.pressOn === 1, 'Presser: while his side is without the ball a sprint costs him half; with it, all of it');
ok(near(rg.jump.j, Math.sqrt(1.2), 0.002) && near(rg.jump.apexThem, Math.sqrt(1.35), 0.002) && rg.jump.apexUs === 1,
  'Jumper: 20% higher off the ground (take-off ' + rg.jump.j + ' times as quick); Apex 35% higher at their goal (' + rg.jump.apexThem + '), as he was at ours');
ok(rg.head === 1.2, 'Apex: heads it 20% harder');
ok(rg.curve.pass === 1 && rg.curve.passUp > 1.2 && rg.curve.cross === 1.25 && rg.curve.long > 1.2 && rg.curve.shortShot === 1 && rg.curve.capd === 1 && rg.curve.over > 1,
  'Curve 1.5 more: a Whipped pass bends as a Curve 7.5 man\'s (Curve 6), Bend it like.. crosses as a 7.5 (a quarter more), Finesse from outside the box (not inside it); up to 10, over it only if the sheet says so -- ' + JSON.stringify(rg.curve));
ok(rg.touch === 0.75, 'Touch pass: a pass played first time sprays a quarter less');
ok(rg.press.k === 0.75 && (rg.press.t === null || rg.press.t === 0.75), 'Press resistant: a quarter less of the pressure counts in his touch and his dribbling');
ok(rg.fox.near && !rg.fox.far && !rg.fox.theirs, 'Fox in the box: a rebound 4 m from him -- he\'s onto it the instant it comes off; 14 m off, not; one of theirs, not');

// --- THE TEN OF v235 ----------------------------------------------------------------------------------------------------
const nv = await K(`(()=>{ const G=players.filter(p=>p.team==='G'), R=players.filter(p=>p.team==='R'), a=G[1], c=R[1], keep=a.pk, keepC=c.pk, out={};
  // Shot blocker: his block reach 30% bigger
  a.pk=[]; const b0=blockReachOf(a); a.pk=['shotblock']; out.block=+(blockReachOf(a)/b0).toFixed(3);
  // Engine: a sprint costs 20% less (and with Presser, without the ball, both)
  a.pk=['engine']; out.engine=+presserK(a).toFixed(3); a.pk=['engine','presser']; const kb=ball.ownedBy; ball.ownedBy=c; out.both=+presserK(a).toFixed(3); ball.ownedBy=kb;
  // Hold up: shielding, Strength +2; then a pass in the next 2 s, Short passing +2
  a.pk=['holdup']; const ko=ball.ownedBy, km=holdMode; ball.ownedBy=a; holdMode={p:a,kind:'shield'}; perkTick(); const s1=statOf(a,'strength',5)-a.stats.strength;
  holdMode=null; perkTick(); const pa1=statOf(a,'passAcc',5)-a.stats.passAcc; a.holdUpT=simNow-1; perkTick(); const pa2=statOf(a,'passAcc',5)-a.stats.passAcc;
  out.hold={s:s1, pass:pa1, later:pa2}; ball.ownedBy=ko; holdMode=km;
  // Clutch: the second half's last third (the last 15 of 90): Final third composure and Shot accuracy +1.5
  a.pk=['clutch']; const kh=half, kc=matchClock; half=2; matchClock=halfLenSec()*0.8; perkTick(); const cl=statOf(a,'shotAcc',5)-a.stats.shotAcc; half=1; perkTick(); const cl0=statOf(a,'shotAcc',5)-a.stats.shotAcc; half=kh; matchClock=kc;
  out.clutch={late:+cl.toFixed(2), early:cl0};
  // Big game player: not in an exhibition
  a.pk=['biggame']; perkTick(); out.bigExh=statOf(a,'composure',5)-a.stats.composure;
  // Phantom: a defender reads his run as if his Def IQ were 2 lower
  c.pk=[]; const base={x:a.x,y:a.y}; a.vx=200; a.vy=0; const r0=readRun(c,a,base,true); a.pk=['phantom']; const r1=readRun(c,a,base,true);
  out.phantom={plain:Math.round(r0.x-base.x), phantom:Math.round(r1.x-base.x)};
  a.pk=keep; c.pk=keepC; perkTick(); return out; })()`);
info('v235 perks: ' + JSON.stringify(nv));
ok(nv.block === 1.3, 'Shot blocker: his block reach 30% bigger');
ok(nv.engine === 0.8 && nv.both === 0.4, 'Engine: a sprint costs 20% less (with Presser too, without the ball, 60% less)');
ok(nv.hold.s === 2 && nv.hold.pass === 2 && nv.hold.later === 0, 'Hold up: holding it off, Strength +2; his pass straight after, Short passing +2; later, his own');
ok(nv.clutch.late === 1.5 && nv.clutch.early === 0, 'Clutch: the last 15 minutes, Shot accuracy +1.5; before then, his own');
ok(nv.bigExh === 0, 'Big game player: nothing in an exhibition (cup ties and derbies are a career\'s)');
ok(nv.phantom.phantom < nv.phantom.plain, 'Phantom: a defender reads his run less far (' + nv.phantom.plain + ' px ahead of where he is, ' + nv.phantom.phantom + ' with Phantom)');
const nv2 = await K(`(()=>{ const d=mgNewCareer({slot:'x', manager:'Sam Okafor', clubName:'Fenmoor Athletic', colors:['#d4202a','#ffffff'], code:'FEN', crest:null});
  const p=d.roster.find(q=>q.role!=='GK'), q=d.roster.find(q=>q!==p&&q.role!=='GK'); p.pk=['ibiza']; q.pk=[]; p.inj={d:20}; q.inj={d:20}; injHeal(d,4);
  const k=careerFix; careerFix={kind:'cup'}; const a=players.find(x=>x.team==='G'&&x!==controlled); const kp=a.pk; a.pk=['biggame']; perkTick(); const big=statOf(a,'composure',5)-a.stats.composure; a.pk=kp; careerFix=k; perkTick();
  return { ibiza:(20-p.inj.d)/(20-q.inj.d), big }; })()`);
ok(near(nv2.ibiza, 1.75, 0.01), 'Doctor from Ibiza: back from an injury 75% faster (' + nv2.ibiza + ' times the days a day)');
ok(nv2.big === 1, 'Big game player: in a cup tie, composure +1');
// --- v237: WIDE VISION, LAST DITCH, SCREAMER (NEW), FINESSE, CUSHION, CONTEST, PEST; NEAR AND FAR POST ---------------
const v7 = await K(`(()=>{ const out={}, a=players.find(x=>x.team==='G'&&x!==controlled), keep=a.pk, kb={x:ball.x,y:ball.y,z:ball.z,o:ball.ownedBy,pf:ball.passFrom,lt:ball.lastTouch};
  // Wide vision: a pass before he's ready half as far off line
  ball.ownedBy=a; a.prepT=simNow; a.pk=[]; const w0=prepWorst(a); a.pk=['widevision']; const w1=prepWorst(a); out.wide=+(w1/w0).toFixed(3);
  // Last ditch: the last man back, his slide 20% further and its reach 20% further; not the last man, as he was
  const own=atkOf(a.team)>0?-1:1, mates=players.filter(q=>q.team===a.team&&q!==a), deep=Math.max(...mates.map(q=>own*q.x)), kx=a.x;
  a.pk=[]; const h0=slideHitOf(a), l0=slideLenOf(a); a.pk=['lastditch']; a.x=own*(deep+40); const h1=slideHitOf(a), l1=slideLenOf(a), last=lastMan(a);
  a.x=own*(deep-40); const h2=slideHitOf(a); a.x=kx;
  out.ditch={hit:+(h1/h0).toFixed(3), len:+(l1/l0).toFixed(3), notLast:+(h2/h0).toFixed(3), last};
  // Cushion: a long ball of ours (30 m), his touch 30% easier; a short one (10 m) as it was
  ball.ownedBy=null; ball.lastTouch=a.team; ball.z=0; for(const q of players) if(q.team!==a.team){ q._kx=q.x; q._ky=q.y; q.x=a.x+(a.x<FW/2?400:-400); q.y=a.y; }
  a.pk=[]; ball.passFrom={x:a.x-30*MK, y:a.y, team:a.team, by:null}; const d0=touchDifficulty(a,false); a.pk=['cushion']; const d1=touchDifficulty(a,false);
  ball.passFrom={x:a.x-10*MK, y:a.y, team:a.team, by:null}; a.pk=[]; const s0=touchDifficulty(a,false); a.pk=['cushion']; const s1=touchDifficulty(a,false);
  for(const q of players) if(q._kx!=null){ q.x=q._kx; q.y=q._ky; delete q._kx; delete q._ky; }
  out.cushion={long:+(d1/d0).toFixed(3), short:s1===s0, d0:+d0.toFixed(3)};
  // Contest: a loose ball, Strength +1.5; one somebody has, his own
  const ks=a.stats.strength; a.stats.strength=5; a.pk=['contest']; ball.ownedBy=null; ball.dribbler=null; perkTick(); const c1=statOf(a,'strength',5)-a.stats.strength;
  const opp=players.find(q=>q.team!==a.team); ball.ownedBy=opp; perkTick(); const c2=statOf(a,'strength',5)-a.stats.strength; out.contest={loose:c1, held:c2}; a.stats.strength=ks;
  // Pest: their ball, him the nearest of ours to it, Acceleration and Agility +2; another of ours nearer, his own
  a.pk=['pest']; ball.x=a.x+3; ball.y=a.y; perkTick(); const p1=[statOf(a,'acceleration',5)-a.stats.acceleration, statOf(a,'agility',5)-a.stats.agility];
  const m=mates[0], mk={x:m.x,y:m.y}; m.x=ball.x+1; m.y=ball.y; perkTick(); const p2=statOf(a,'acceleration',5)-a.stats.acceleration; m.x=mk.x; m.y=mk.y;
  ball.ownedBy=null; perkTick(); const p3=statOf(a,'acceleration',5)-a.stats.acceleration; out.pest={near:p1, notNearest:p2, loose:p3};
  // Screamer: a shot from 25 m out loses 35% less of its pace; Finesse (Screamer before) bends it
  const c=controlled, ck=c.pk, cs={x:c.x,y:c.y,vx:c.vx,vy:c.vy}, gx=atkOf(c.team)>0?FW:0, sx=gx-atkOf(c.team)*560;
  const shot=pk=>{ c.pk=pk; c.x=sx-atkOf(c.team)*8; c.y=YC; c.vx=0; c.vy=0; ball.ownedBy=c; ball.x=sx; ball.y=YC; ball.z=0; shootAt(c,atkOf(c.team),0,1); return Math.hypot(ball.vx,ball.vy); };
  const sp0=shot([]), sp1=shot(['screamer']), lr=clamp((560-330)/370,0,1), pen=lr*(1-longShotsOf(c))*LONG_PACE;
  out.screamer={plain:Math.round(sp0), with:Math.round(sp1), lossCut:+(1-(1-sp1/(sp0/(1-pen)))/pen).toFixed(3)};
  out.finesse={curve:+(curveOf(Object.assign({},c,{pk:['finesse']}),true)/Math.max(1e-9,curveOf(Object.assign({},c,{pk:[]}),true))).toFixed(3), name:PERKS.finesse.n, newName:PERKS.screamer.n};
  // near post and far post (inside the box, off to one side)
  ball.y=YC+60; ball.x=gx-atkOf(c.team)*200; const nearTy=YC+90, farTy=YC-90;
  out.post={near:postK(nearTy,0.1,200,false), farLow:postK(farTy,0.1,200,false), farHigh:postK(farTy,1,600,false), long:postK(nearTy,0.1,200,true), sideNear:postSide(nearTy), sideFar:postSide(farTy)};
  ball.y=YC; out.post.middle=postK(nearTy,0.1,200,false);
  // a career man with Screamer from before v237 has Finesse now; a star given it on the sheet too
  const d=mgNewCareer({slot:'x', manager:'Sam Okafor', clubName:'Fenmoor Athletic', colors:['#d4202a','#ffffff'], code:'FEN', crest:null}), r=d.roster.find(q=>q.role!=='GK');
  r.pk=['screamer','engine']; delete r.pkv; const mig=careerPerks(r).join(); r.pk=['screamer']; const kept=careerPerks(r).join();
  out.mig={old:mig, new:kept, star:(STARS.find(x=>x.key==='cutinside').pk||[]).join()};
  c.pk=ck; Object.assign(c,cs); a.pk=keep; ball.x=kb.x; ball.y=kb.y; ball.z=kb.z; ball.ownedBy=kb.o; ball.passFrom=kb.pf; ball.lastTouch=kb.lt; ball.vx=0; ball.vy=0; perkTick(); return out; })()`);
info('v237 perks: ' + JSON.stringify(v7));
ok(v7.wide === 0.5, 'Wide vision: a pass before he\'s ready goes half as far off line (' + v7.wide + ')');
ok(v7.ditch.hit === 1.2 && v7.ditch.len === 1.2 && v7.ditch.notLast === 1, 'Last ditch: the last man back, his slide goes 20% further and reaches 20% further; not the last man, as he was');
ok(near(v7.cushion.long, 0.7, 0.001) && v7.cushion.short === true, 'Cushion: a long ball (30 m) 30% easier to take (' + v7.cushion.long + '); a short one (10 m) as it was');
ok(v7.contest.loose === 1.5 && v7.contest.held === 0, 'Contest: with the ball loose, Strength +1.5; with somebody on it, his own');
ok(v7.pest.near[0] === 2 && v7.pest.near[1] === 2 && v7.pest.notNearest === 0 && v7.pest.loose === 0, 'Pest: their ball and him the nearest of his side to it, Acceleration and Agility +2; another nearer, or a loose ball, his own');
ok(v7.screamer.with > v7.screamer.plain && near(v7.screamer.lossCut, 0.35, 0.02), 'Screamer: from 25 m out a shot loses 35% less of its pace (' + v7.screamer.plain + ' px/s, ' + v7.screamer.with + ' with it: ' + v7.screamer.lossCut + ' of the loss gone)');
ok(v7.finesse.name === 'Finesse' && v7.finesse.newName === 'Screamer' && v7.finesse.curve >= 1, 'Finesse is what Screamer was (a long shot\'s curl, Curve +1.5); Screamer is the new one');
ok(v7.mig.old === 'finesse,engine' && v7.mig.new === 'screamer' && v7.mig.star === 'finesse', 'a career man with Screamer from before v237 has Finesse now (a new one keeps the new Screamer); Le CutInside, given it on the sheet, Finesse');
ok(v7.post.sideNear === 'near' && v7.post.sideFar === 'far' && v7.post.near === 0.8 && v7.post.farLow === 1.2 && v7.post.farHigh === 1 && v7.post.long === 1 && v7.post.middle === 1,
  'near post 20% less spray, far post along the ground 20% more (a high one as it was); from outside the box or the middle, as it was');
// --- QUICKSHOT, RELIABLE, MAESTRO'S TOUCH, AND THE CARDS ----------------------------------------------------------------
const qs = await K(`(()=>{ const c=controlled, keep=c.pk; const t0=0.57; c.pk=['quickshot'];
  const fill=hasPk(c,'quickshot')?t0/(1+PERKS.quickshot.p.charge/100):t0; c.pk=keep; return {fill:+fill.toFixed(3)}; })()`);
ok(near(qs.fill, 0.422, 0.002), 'Quickshot: a full shot charges in ' + qs.fill + ' s, against 0.57 s (35% faster)');
const ms = await K(`(()=>{ const c=controlled, keep=c.pk; c.pk=['maestro']; ball.ownedBy=null; ball.x=c.x+6; ball.y=c.y; ball.z=0; ball.vx=-300; ball.vy=0; ball.vz=0;
  ftAim={p:c,d:{x:atkOf(c.team),y:0},until:simNow+1}; directionalTouch(c,0.4); const r={vz:ball.vz, z:ball.z, t:+(c.maestroT-simNow).toFixed(2)};
  c.pk=[]; ball.ownedBy=null; ball.x=c.x+6; ball.y=c.y; ball.z=0; ball.vx=-300; ball.vy=0; ball.vz=0; ftAim={p:c,d:{x:atkOf(c.team),y:0},until:simNow+1}; directionalTouch(c,0.4); r.plainVz=ball.vz;
  c.pk=keep; c.maestroT=0; return r; })()`);
ok(ms.vz === 0 && ms.z <= 1 && near(ms.t, 1, 0.05) && ms.plainVz > 0, 'Maestro: his directional touch stays on the ground (a man without it pops it up ' + Math.round(ms.plainVz) + ' px/s) and a second of pace comes with it');
const cr = await K(`(()=>{ const d=mgNewCareer({slot:'x', manager:'Sam Okafor', clubName:'Fenmoor Athletic', colors:['#d4202a','#ffffff'], code:'FEN', crest:null});
  const p=d.roster.find(q=>q.role!=='GK'), q=d.roster.find(q=>q!==p&&q.role!=='GK'); const pk1=careerPerks(p).slice(), pk2=careerPerks(p).slice();
  p.pk=['reliable']; q.pk=[]; p.cond=0.5; q.cond=0.5; mgRest(d,1); const rp=p.cond-0.5, rq=q.cond-0.5;
  const club=Object.values(d.world.clubs).find(c=>c.id!==d.clubId), sq=careerSquad(club,null), ents=sq.every(e=>Array.isArray(e.pk));
  const men=d.roster.length+Object.values(d.world.clubs).reduce((a,c)=>a+(c.id===d.clubId?0:c.players.length),0);
  let w=0; for(const c of Object.values(d.world.clubs)) for(const m of (c.id===d.clubId?[]:c.players)) if(careerPerks(m).length) w++;
  return { same:JSON.stringify(pk1)===JSON.stringify(pk2)&&Array.isArray(p.pk), rel:+(rp/rq).toFixed(3), ents, share:+(w/men).toFixed(2) }; })()`);
ok(cr.same && cr.ents, 'in a career a man\'s perks are rolled once and kept, and go with him into a match');
ok(near(cr.rel, 1.5, 0.01), 'Reliable: between matches he gets his legs back half as quick again (' + cr.rel + ' times)');
info('a new career\'s other clubs: ' + Math.round(cr.share * 100) + ' in 100 men with a perk');
const chips = await K(`perkChips(['jumper','godspeed'])`);
ok(/pkTag[^>]*>Jumper/.test(chips) && /pkTag pkStar[^>]*>Godspeed/.test(chips) && /title="Jumps 20% higher/.test(chips), 'on his card a chip a perk, a superstar\'s in gold, and a tap says what it does');

process.exitCode = rep.finish() ? 1 : 0;

await browser.close();
