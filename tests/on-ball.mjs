// The computer's man on the ball. He weighs everything he could do -- a pass to each team-mate, a carry, a shot, a
// cross, shielding it -- and does whatever scores best as he sees it, once he's got it under control and looked up: he
// only plays it first time with a man on him or a ball that's clearly on. So the ball isn't pinged on the moment it
// arrives, men run with it into space, and few run into a tackle. How long he looks up for is the decision-time dials'.
// His passes land where he means them to -- a chip over a man goes just over his head, not up into the sky and on past
// the man it was for -- and with space in front of him he runs into it rather than turning back.
// Through on goal, he takes it on and shoots from close in -- not a ball square or back. With time to get closer, he
// gets closer before he shoots. Out wide with the way inside shut and men of his in the box, he goes down the line or
// puts it into the box (a cross, a ball in to one of them, a shot from in there) -- not straight back out of it.
// Through on goal with a defender of the same pace 4 m behind him, an ordinary man still gets his shot off from in
// the box. And with his side of the pitch crowded and one of his free out on the far side, he switches it.
// Plays an exhibition with every player on the computer, on a copy of the game that lets the test see each decision
// and what came of it; then sets a midfielder up with the ball and room ahead of him, a few times; then the other
// five situations, a few times each.
import { open, startExhibition } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('      if(p===controlled){stepOutfield(p,hi.ix,hi.iy,dt);}', '      if(p===controlled&&!window.__aiAll){stepOutfield(p,hi.ix,hi.iy,dt);}');   // your man on the computer too
// a man getting the ball, every ball he plays, and him being tackled -- each told to the test as it happens
patch('  function own(p,carryDist,keepPos){\n', '  function own(p,carryDist,keepPos){\n    if(window.__OBT&&ball.ownedBy!==p) window.__OBT.got(p,simNow);\n');
patch('  function passTo(p,mate,loft=0){\n', '  function passTo(p,mate,loft=0){\n    if(window.__OBT) window.__OBT.rel(p,"pass",mate,simNow);\n');
patch('  function obThruBall(p,q,tx,ty,tA){\n', '  function obThruBall(p,q,tx,ty,tA){\n    if(window.__OBT) window.__OBT.rel(p,"pass",q,simNow);\n');
patch('  function obLobBall(p,q,tx,ty){\n', '  function obLobBall(p,q,tx,ty){\n    if(window.__OBT) window.__OBT.rel(p,"pass",q,simNow);\n');
patch('  function shootAt(p,atkSide,aim,charge,aiCurl,accMul,spin){\n', '  function shootAt(p,atkSide,aim,charge,aiCurl,accMul,spin){\n    if(window.__OBT) window.__OBT.rel(p,"shot",null,simNow);\n');
patch('  function aiCross(p,spot){\n', '  function aiCross(p,spot){\n    if(window.__OBT) window.__OBT.rel(p,"cross",null,simNow);\n');
patch('  function obClearBall(p,tx,ty){\n', '  function obClearBall(p,tx,ty){\n    if(window.__OBT) window.__OBT.rel(p,"clear",null,simNow);\n');
patch('  function winBall(t,carrier){\n', '  function winBall(t,carrier){\n    if(window.__OBT) window.__OBT.lost(carrier,simNow);\n');
patch('    if(!ob||ob.done||simNow-ob.seen>0.7) ob=p.ob=obStart(p,C);', '    if(!ob||ob.done||simNow-ob.seen>0.7){ ob=p.ob=obStart(p,C); if(window.__OBT) window.__OBT.looks.push({ seg: window.__OBT.seg, t: ob.look - ob.since, alone: C.prD >= 150 }); }');   // how long he'll look up
// each pass as it's struck (how far it's meant to go, and where to), and every frame, so the test can follow its flight
patch('    recordPassTeam(p.team,p); passPose(p);\n    // locked: no auto-switch\n', '    if(window.__OBT) window.__OBT.struck(d,lead.x,lead.y);\n    recordPassTeam(p.team,p); passPose(p);\n    // locked: no auto-switch\n');
patch("    if(meIs(p)) meBump('passes');\n    recordPassTeam(p.team,p); passPose(p);\n  }\n  // How the side", "    if(meIs(p)) meBump('passes');\n    if(window.__OBT) window.__OBT.struck(d,tx,ty);\n    recordPassTeam(p.team,p); passPose(p);\n  }\n  // How the side");
patch("    ball.intendedRcv=q; ball.rcvRunner=false; ball.passerRef=p; ball.thru=null;   // he goes to where it drops\n", "    ball.intendedRcv=q; ball.rcvRunner=false; ball.passerRef=p; ball.thru=null;   // he goes to where it drops\n    if(window.__OBT) window.__OBT.struck(d,tx,ty);\n");
patch('    if(LAB.on) labStep(dt,rdt);\n', '    if(LAB.on) labStep(dt,rdt);\n    if(window.__OBT) window.__OBT.tick();\n');
// ROOM AHEAD: green's man in midfield with the ball; his back line 15 m behind him, free; his other team-mates level with
// him out on the touchlines; theirs in a line 12 m in front of him, spread right across, and two more behind that
patch('  const LAB_TITLE=', `  window.__T={players:()=>players, P, sim:()=>simNow, ball:()=>ball, gk:()=>gkHold, dead:()=>restartT>0||scoredT>0||offsideT>0, atkOf,
    space:(k)=>{ restartT=0; scoredT=0; offsideT=0; gkHold=null; breakT=0; matchClock=0;   // (no half-time whistle mid-trial)
      const atk=atkOf('G'), X=u=>atk>0?u:FW-u, G=players.filter(q=>q.team==='G'), R=players.filter(q=>q.team==='R');
      const mids=G.filter(q=>q.role!=='DEF'), c=mids[k%mids.length], u0=FW*0.42;
      const put=(q,u,y)=>{ q.x=X(u); q.y=y; q.vx=q.vy=0; q.state='normal'; q.z=0; q.vz=0; q.noTouchT=0; q.takeOn=null; q.ob=null; q.runTarget=null; q.gapRun=0; };
      put(c,u0,YC); let i=0, j=0;
      for(const q of G){ if(q===c) continue; if(q.role==='DEF') put(q,u0-380,YC+((i++)%2?1:-1)*240); else put(q,u0-60,YC+((j++)%2?1:-1)*FH*0.4); }
      R.forEach((q,n)=>put(q, n<5?u0+300:u0+520, n<5?YC+(n-2)*300:YC+(n===5?-200:200)));
      ball.x=c.x+atk*(c.r+ball.r+5); ball.y=c.y; ball.z=0; ball.vx=ball.vy=ball.vz=0; ball.ownedBy=null; ball.dribbler=null; ball.intendedRcv=null; ball.thru=null; ball.shotT=0; ball.crossT=0;
      own(c,c.r+ball.r+5);
      return {id:c.team+c.num, atk, x:c.x}; },
    // green's man with the ball and others placed about him: dl metres from their goal line, y metres off the middle;
    // c.pref picks him (a striker, a wide man); the rest of his team (defenders last) and theirs go where listed, or
    // well out of it
    scene:(S)=>{ restartT=0; scoredT=0; offsideT=0; gkHold=null; breakT=0; ftPending=false; matchClock=0;
      const atk=atkOf('G'), gx=atk>0?FW:0, X=dl=>gx-atk*dl*25, Y=y=>YC+y*25;
      const G=players.filter(q=>q.team==='G'), R=players.filter(q=>q.team==='R');
      const put=(q,dl,y)=>{ q.x=X(dl); q.y=Y(y); q.vx=q.vy=0; q.state='normal'; q.z=0; q.vz=0; q.noTouchT=0; q.takeOn=null; q.ob=null; q.runTarget=null; q.gapRun=0; q.stamina=1; };
      const pool=G.filter(q=>S.c.pref==='WIDE'?(q.role!=='DEF'&&(q.slotAtk||q).wide):S.c.pref==='MID'?q.role==='MID':q.role==='ATT'), c=pool[(S.k||0)%pool.length];
      put(c,S.c.dl,S.c.y); controlled=c; if(S.c.st){ c.stats={...(c.stats||{}),...S.c.st}; c.staminaCap=1; c.stamina=1; }   // (a man given here starts fresh)
      G.filter(q=>q!==c).sort((a,b)=>(a.role==='DEF')-(b.role==='DEF')).forEach((q,i)=>{ const m=(S.mates||[])[i]; if(m) put(q,m.dl,m.y); else put(q,72,-24+i*8); });
      R.forEach((q,n)=>{ const o=(S.opps||[])[n]; if(o){ put(q,o.dl,o.y); if(o.st){ q.stats={...(q.stats||{}),...o.st}; q.staminaCap=1; q.stamina=1; } } else put(q,92,-20+n*7); });
      for(const kk of keepers){ kk.x=kk.homeX; kk.y=YC; kk.mode='line'; kk.holdT=0; kk.claimCd=0; kk.diveT=0; kk.groundT=0; kk.reactT=0; kk.threatActive=false; }
      ball.x=c.x+atk*(c.r+ball.r+5); ball.y=c.y; ball.z=0; ball.vx=ball.vy=ball.vz=0; ball.ownedBy=null; ball.dribbler=null; ball.intendedRcv=null; ball.thru=null; ball.shotT=0; ball.crossT=0; ball.shotBy=null;
      own(c,c.r+ball.r+5);
      return {id:c.team+c.num, x:c.x}; },
    pos:(id)=>{ const q=players.find(q=>q.team+q.num===id), gx=atkOf('G')>0?FW:0; return q?{x:q.x,y:q.y,dl:Math.abs(gx-q.x)/25}:null; } };
  const LAB_TITLE=`);
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-ob-')), 'index.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ fastFrames: true, url: 'file://' + copy });
const ok = rep.ok, info = rep.info;
await page.addInitScript(() => {
  window.__aiAll = true;
  // spells on the ball: who, when he got it, where, how close the nearest opponent was then; and what he did with it
  const O = window.__OBT = { log: [], tackled: 0, spells: 0, cur: null, pend: null, seg: 1, longest: 0, looks: [] };
  const near = p => { let d = 1e9; for(const o of window.__T.players()) if(o.team !== p.team) d = Math.min(d, Math.hypot(o.x - p.x, o.y - p.y)); return d; };
  O.got = (p, t) => {
    if(O.pend){ O.pend.out = p.team === O.pend.team ? 'ok' : 'lost'; O.pend = null; }
    const c = O.cur; if(c && c.p === p && !c.done) return;                         // his own touch, gathered again
    if(c) O.longest = Math.max(O.longest, (c.tEnd || t) - c.t0);
    O.cur = { p, t0: t, x0: p.x, y0: p.y, free: near(p) > 100, seg: O.seg, done: false }; O.spells++;
  };
  O.rel = (p, kind, mate, t) => {
    const c = O.cur; if(!c || c.p !== p || c.done) return;
    c.done = true; c.tEnd = t;
    const L = p.obLast, mine = !!L && L.t === t && !!L.pick && L.pick.kind === kind && (kind !== 'pass' || L.pick.q === mate);
    const atk = window.__T.atkOf(p.team), gx = atk > 0 ? 2625 : 0;
    const r = { kind, team: p.team, by: p.team + p.num, tOn: t - c.t0, carry: Math.hypot(p.x - c.x0, p.y - c.y0) / 25, free: c.free, seg: c.seg, brain: mine, nOpts: L ? L.opts.length : 0,
                dU: mate ? (atk * (mate.x - p.x)) / 25 : 0, toBack: !!mate && mate.role === 'DEF',
                dl: Math.abs(gx - p.x) / 25, y: (p.y - 850) / 25, toDl: mate ? Math.abs(gx - mate.x) / 25 : null, toY: mate ? (mate.y - 850) / 25 : null };
    O.log.push(r); if(kind === 'pass') O.pend = r;
  };
  O.lost = (carrier, t) => { const c = O.cur; if(c && c.p === carrier && !c.done){ c.done = true; c.tEnd = t; O.tackled++; } };
  // each pass's flight, from the strike until someone has it, it's dead or it stops: how far along its line it got (past
  // the man it was for?) and how high it went
  O.flights = []; O.fl = null;
  O.struck = (d, tx, ty) => { const b = window.__T.ball(), l = Math.hypot(tx - b.x, ty - b.y) || 1;
    O.fl = { t0: window.__T.sim(), x0: b.x, y0: b.y, ux: (tx - b.x) / l, uy: (ty - b.y) / l, d, along: 0, top: b.z }; };
  O.tick = () => { const f = O.fl; if(!f || !window.__T) return; const T = window.__T, b = T.ball(), t = T.sim();
    f.along = Math.max(f.along, (b.x - f.x0) * f.ux + (b.y - f.y0) * f.uy); f.top = Math.max(f.top, b.z);
    if((b.ownedBy && t - f.t0 > 0.05) || T.gk() || T.dead() || (t - f.t0 > 0.3 && Math.hypot(b.vx, b.vy) < 40 && b.z < 2) || t - f.t0 > 5){ O.flights.push(f); O.fl = null; } };
});
await page.reload(); await page.waitForTimeout(600);
await startExhibition(page);
const sim = () => page.evaluate(() => window.__T.sim());
const until = async t => { const w0 = Date.now(); while((await sim()) < t && Date.now() - w0 < 240000) await page.waitForTimeout(250); };
await until(90);
// now make everyone look up for longer: the decision-time dials (opponent and team-mate)
const think = await page.evaluate(() => { const P = window.__T.P, was = [P.aiThink.val, P.mateThink.val]; P.aiThink.val = 1.3; P.mateThink.val = 1.3; window.__OBT.seg = 2; return was; });
await until(150);
const R = await page.evaluate(() => { const O = window.__OBT, c = O.cur, now = window.__T.sim();
  return { rel: O.log, tackled: O.tackled, spells: O.spells, longest: Math.max(O.longest, c ? (c.tEnd || now) - c.t0 : 0), flights: O.flights, looks: O.looks }; });
// room ahead, eight times over (a different man each time): does he go forward with it -- a run of 2 m or more, or a
// ball forward -- inside a second and a half, rather than play it back to his back line?
await page.evaluate(was => { const P = window.__T.P; P.aiThink.val = was[0]; P.mateThink.val = was[1]; }, think);   // (the dials back as they were)
const trials = [];
for(let k = 0; k < 8; k++){
  const s = await page.evaluate(k => { window.__OBT.log.length = 0; window.__OBT.cur = null; window.__OBT.pend = null; return window.__T.space(k); }, k);
  const t0 = await sim(); while((await sim()) - t0 < 1.5) await page.waitForTimeout(20);
  const r = await page.evaluate(id => ({ played: window.__OBT.log.filter(e => e.by === id), at: window.__T.pos(id) }), s.id);
  const ran = s.atk * (r.at.x - s.x) / 25, first = r.played[0];
  trials.push({ ran, back: !!first && first.toBack, fwd: !!first && first.dU > 3, kind: first ? first.kind : null });
}
// THROUGH ON GOAL from 30 m (their back line 10 m behind him, a team-mate out wide on the other side); TIME TO GET
// CLOSER, 23 m out with their nearest men 9 m away; OUT WIDE 25 m out, their full-back goal-side and inside him, a
// striker of his level with their last man at the far post and another arriving: what he does with it (6 s at most)
const SCENES = {
  thru: { c: { dl: 30, y: 3, pref: 'ATT' }, mates: [{ dl: 32, y: -14 }], opps: [{ dl: 40, y: -8 }, { dl: 40, y: 0 }, { dl: 40, y: 8 }] },
  closer: { c: { dl: 23, y: 2, pref: 'ATT' }, mates: [{ dl: 30, y: -16 }], opps: [{ dl: 23, y: 11 }, { dl: 23, y: -7 }, { dl: 32, y: 2 }] },
  wide: { c: { dl: 25, y: 17, pref: 'WIDE' }, mates: [{ dl: 11, y: -8 }, { dl: 14, y: 1 }, { dl: 30, y: 5 }], opps: [{ dl: 22, y: 12 }, { dl: 10, y: 3 }, { dl: 10, y: -5 }] },
  // THE CHASE: through on goal from 30 m, Speed 6 and Dribbling 6, a Speed 6 defender 4 m behind him, both fresh
  chase: { c: { dl: 30, y: 2, pref: 'ATT', st: { speed: 6, dribbling: 6, acceleration: 6, stamina: 6 } }, mates: [], opps: [{ dl: 34, y: 1, st: { speed: 6, acceleration: 6, stamina: 6 } }] },
  // SWITCH: a midfielder 38 m out on the right, four of theirs closing round him and his near man marked; one of his
  // free out on the left 40 m across, with room in front of him
  switch: { c: { dl: 38, y: 22, pref: 'MID' }, mates: [{ dl: 35, y: -18 }, { dl: 34, y: 16 }, { dl: 52, y: 8 }], opps: [{ dl: 33, y: 23 }, { dl: 36, y: 17 }, { dl: 41, y: 17 }, { dl: 42, y: 26 }, { dl: 33, y: 15 }, { dl: 25, y: 4 }, { dl: 22, y: -6 }] },
};
const scenes = {}, TRIALS = { wide: 6 };   // (four of each, six out wide: it's right nine times in ten, so three of four would fail one run in twenty)
for(const name of Object.keys(SCENES)) for(let k = 0; k < (TRIALS[name] || 4); k++){
  const s = await page.evaluate(([S, k]) => { window.__OBT.log.length = 0; window.__OBT.cur = null; window.__OBT.pend = null; return window.__T.scene({ ...S, k }); }, [SCENES[name], k]);
  const t0 = await sim(); let r = null;
  while((await sim()) - t0 < 6){
    await page.waitForTimeout(40);
    r = await page.evaluate(id => ({ played: window.__OBT.log.filter(e => e.by === id), at: window.__T.pos(id), dead: window.__T.dead() }), s.id);
    if(r.played.length || r.dead) break;
  }
  (scenes[name] = scenes[name] || []).push({ first: r && r.played[0] || null, endDl: r ? r.at.dl : 99 });
}
await browser.close();

const med = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
const pct = (a, b) => (100 * a / Math.max(1, b)).toFixed(0) + '%';
const all = R.rel, passes = all.filter(r => r.kind === 'pass'), p1 = passes.filter(r => r.seg === 1), p2 = passes.filter(r => r.seg === 2);
const kinds = {}; for(const r of all) kinds[r.kind] = (kinds[r.kind] || 0) + 1;
info(`${R.spells} spells on the ball; played: ${JSON.stringify(kinds)}`);
ok(passes.length >= 25, `the ball gets moved about: ${passes.length} passes in two and a half minutes`);   // (about 40 since carrying it got cheaper; 60 at v36's rate)
ok(all.filter(r => r.brain).length / Math.max(1, all.length) >= 0.95, `every ball played is the choice the man on it scored best (${pct(all.filter(r => r.brain).length, all.length)})`);
ok(med(all.map(r => r.nOpts)) >= 8, `...out of everything he could do: ${med(all.map(r => r.nOpts))} options weighed (median)`);
const firstFree = p1.filter(r => r.free), oneT = firstFree.filter(r => r.tOn < 0.1).length;
ok(firstFree.length >= 8 && oneT / firstFree.length <= 0.25, `with nobody on him when it comes, he gets it under control first: played first time ${pct(oneT, firstFree.length)} of ${firstFree.length}`);
ok(med(p1.map(r => r.tOn)) >= 0.3, `a pass comes after a look up: ${med(p1.map(r => r.tOn)).toFixed(2)} s on the ball (median)`);
ok(passes.filter(r => r.carry >= 2).length / Math.max(1, passes.length) >= 0.2, `men run with it: ${pct(passes.filter(r => r.carry >= 2).length, passes.length)} of passes come after a carry of 2 m or more`);
const done = passes.filter(r => r.out);
ok(done.filter(r => r.out === 'ok').length / Math.max(1, done.length) >= 0.7, `passes find a team-mate: ${pct(done.filter(r => r.out === 'ok').length, done.length)} of ${done.length}`);
ok(R.tackled / Math.max(1, R.spells) <= 0.1, `few run into a tackle: ${R.tackled} of ${R.spells} spells end in one`);
ok(R.longest < 15, `nobody keeps it for ever (shielding it in a corner, say): the longest spell on the ball was ${R.longest.toFixed(1)} s`);   // (a winger's run the length of the flank takes about 13)
// (how long he looks up before he'll play it, getting it with nobody of theirs within 6 m: a man closing in cuts it short)
const l1 = R.looks.filter(l => l.seg === 1 && l.alone).map(l => l.t), l2 = R.looks.filter(l => l.seg === 2 && l.alone).map(l => l.t), m1 = med(l1), m2 = med(l2);
ok(l2.length >= 5 && m2 >= m1 + 0.4, `with the decision-time dials up he looks up for longer before he'll play it: ${m1.toFixed(2)} s -> ${m2.toFixed(2)} s (median of ${l1.length} and ${l2.length} looks, nobody within 6 m when it came)`);

const fl = R.flights, over = fl.filter(f => (f.along - f.d) / 25 > 10).length, top = Math.max(0, ...fl.map(f => f.top)) / 25;
ok(fl.length >= 20 && top < 10, `no pass is skied: the highest of ${fl.length} went ${top.toFixed(1)} m up`);
ok(over / Math.max(1, fl.length) <= 0.08, `passes land where they're meant to: ${over} of ${fl.length} ran on more than 10 m past the man they were for`);
info('room ahead: ' + trials.map(t => 'ran ' + t.ran.toFixed(1) + ' m' + (t.back ? ', then BACK TO THE BACK LINE' : t.fwd ? ', then a ball forward' : t.kind ? ', then a ' + t.kind : '')).join(' | '));
const goodT = trials.filter(t => !t.back && (t.ran >= 2 || t.fwd)).length;
ok(goodT >= 6 && !trials.some(t => t.back), `with room ahead of him he goes forward with it, not back: ${goodT} of ${trials.length}`);
const said = (r) => r.first ? `${r.first.kind}${r.first.kind === 'pass' ? (r.first.dU > 3 ? ' forward' : ' square/back') : ''} from ${r.first.dl.toFixed(1)} m` : 'nothing';
info('through on goal: ' + scenes.thru.map(said).join(' | '));
const thruOk = scenes.thru.filter(r => r.first && r.first.kind === 'shot' && r.first.dl <= 16).length;
ok(thruOk >= 3 && !scenes.thru.some(r => r.first && r.first.kind === 'pass' && r.first.dU <= 3), `through on goal, he takes it on and shoots from 16 m or closer, never a ball square or back: ${thruOk} of 4`);
info('time to get closer: ' + scenes.closer.map(said).join(' | '));
const closeOk = scenes.closer.filter(r => r.first && !(r.first.kind === 'shot' && r.first.dl > 18)).length, closeShots = scenes.closer.filter(r => r.first && r.first.kind === 'shot' && r.first.dl <= 16).length;
ok(closeOk === 4 && closeShots >= 2, `with time to get closer he gets closer first: no shot from beyond 18 m, ${closeShots} of 4 from 16 m or closer`);
info('out wide, the way inside shut: ' + scenes.wide.map(r => (r.first ? said(r) + ` (${Math.abs(r.first.y).toFixed(0)} m wide)` + (r.first.kind === 'pass' ? ` to a man ${r.first.toDl.toFixed(0)} m out` : '') : `still on it ${r.endDl.toFixed(0)} m out`)).join(' | '));
const intoBox = (f) => f && (f.kind === 'cross' || (f.kind === 'pass' && f.toDl < 17.5 && Math.abs(f.toY) < 20) || (f.kind === 'shot' && f.dl < 16.5));
const downLine = (r) => (r.first ? r.first.dl : r.endDl) <= 18;              // (7 m or more down the line, whatever then)
const backOut = (r) => r.first && r.first.kind === 'pass' && r.first.toDl > 20 && r.first.dl > 18;   // back out without trying the line
const wideOk = scenes.wide.filter(r => intoBox(r.first) || downLine(r)).length;
ok(wideOk >= 4 && !scenes.wide.some(backOut), `out wide with the way inside shut and men in the box, he goes down the line or puts it in -- never straight back out: ${wideOk} of ${scenes.wide.length}`);
info('the chase: ' + scenes.chase.map(said).join(' | '));
const chaseOk = scenes.chase.filter(r => r.first && r.first.kind === 'shot' && r.first.dl <= 15.5).length;
ok(chaseOk >= 3, `through on goal with a defender as quick as him 4 m behind, an ordinary man still gets his shot off from in the box (15.5 m or closer): ${chaseOk} of 4`);
info('switch: ' + scenes.switch.map(r => r.first ? `${r.first.kind} to a man ${Math.abs(r.first.toY - r.first.y).toFixed(0)} m across` : 'nothing').join(' | '));
const swOk = scenes.switch.filter(r => r.first && r.first.kind === 'pass' && r.first.toY * r.first.y < 0 && Math.abs(r.first.toY - r.first.y) >= 25).length;
ok(swOk >= 3, `with his side crowded and a man free out on the far side, he switches it to him: ${swOk} of 4`);

process.exit(rep.finish() ? 1 : 0);
