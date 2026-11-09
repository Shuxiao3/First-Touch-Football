// FOOTBALL CLASSIC, CURVE IN THROUGH BALLS (v165; v167, bent as it was drawn; v168, as much as it needs; v169, by the
// table and the length; v169, by the spin on it): a through ball, set off a little wide, bends from the moment it's
// struck and the more as it slows -- it turns as its spin over its pace, and its pace falls off along the grass -- and
// is met four-fifths of the way along its curve, still turning: left alone it bends on past the spot. (v167-v168 the
// turn came with the cube of the way it had gone: straight, then a dip.) By the spot it has turned as much as the passer's Curve gives him, by the table -- none at Curve 1, 5%
// of the most at 2, 10% at 3, 15% at 4, a quarter at 5, 35% at 6, half at 7, 65% at 8, 80% at 9, all of it at 10, the
// most 43 degrees (a twentieth less than it was) -- and the pass's length: all of it from 17 m to 27 m, none at 8 m or
// less, half at 12, 80% at 32, half from 42 (a long pass 15 degrees at most; the computer's round their back line, 41);
// times as much as the pass needs it: all of it with the straight ball passing within 1.75 m of one of theirs, none with
// it 4.75 m clear of them all, more the longer the ball. Its belly is on the far side from a man of theirs in its way, or else from the nearest of theirs short
// of the spot within 18 m -- unless another way (hooked the other way, half as much, or straight) clearly keeps it
// further from their men: a runner through a gap between two of them gets it straight. Nobody there, or only a man
// beyond the spot, it goes straight. It's played as far ahead of the runner as ever, along his line, finishes on the
// spot, and everyone reading the ball reads its hook.
// A CURLING THROUGH BALL is harder to deal with, by the bend it was struck with, till anyone touches it: a man of theirs
// has a fifth less reach for it at Curve 10's full bend and a worse touch on it, and the man it's for takes it the
// cleaner. YOUR MAN, RUN ONTO IT (the stick left alone), goes to the spot a bent one was played to. And in varied scenes
// -- a man breaking in behind with one of theirs a few metres off him, their keeper in goal -- more of your through balls
// end up yours at Curve 10 than at 1; through a gap between two of them (where it goes straight), as many.
// On a copy of the game that lets the test reach inside, its frames pumped (no vsync); for the scenes, set random draws.
import { open, startExhibition } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  // ===== END MANAGER CAREER', '  window.__K={ ev:s=>eval(s) };\n  // ===== END MANAGER CAREER');
patch('  function checkOffsideTouch(t){\n', '  function checkOffsideTouch(t){\n    if(window.__noOffside) return false;\n');   // (the scenes' runners are in behind)
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-tcurl-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ fastFrames: true, url: 'file://' + copy });
const { ok, info } = rep;
await page.evaluate(() => { window.__noOffside = true; });
await startExhibition(page); await page.waitForTimeout(800);
const K = s => page.evaluate(s => window.__K.ev(s), s);

// THE BEND IT MAY HAVE (v169): the share of the most his Curve gives him, by the table; a through ball's, a long
// pass's and the computer's round their line, by Curve; and the share of it a pass of each length may have
const B = await K(`(()=>{ const p=players.find(q=>q.team==='G'&&!q.isGK), keep=p.stats, at=cv=>{ p.stats=Object.assign({},keep,{curve:cv}); return { pot:+curvePot(p).toFixed(4), thru:+(thruBendOf(p)*57.3).toFixed(1), pass:+(passBendOf(p)*57.3).toFixed(1), arc:+(thruArcOf(p)*57.3).toFixed(1) }; };
  const r={lv:{}, len:{}}; for(const cv of [1,2,3,4,5,5.5,6,7,8,9,10]) r.lv[cv]=at(cv); for(const m of [5,8,10,12,14.5,17,22,27,32,37,42,55]) r.len[m]=+curveLenK(m*MK).toFixed(3); p.stats=keep; return r; })()`);
info('the bend it may have, degrees of turn by Curve: ' + JSON.stringify(B.lv) + '; the share of it by length (m): ' + JSON.stringify(B.len));
const TABLE = { 1: 0, 2: 0.05, 3: 0.10, 4: 0.15, 5: 0.25, 5.5: 0.30, 6: 0.35, 7: 0.50, 8: 0.65, 9: 0.80, 10: 1 };
ok(Object.entries(TABLE).every(([cv, t]) => Math.abs(B.lv[cv].pot - 0.95 * t) < 1e-3), 'his Curve gives him the table\'s share of the most: none at 1, 5% at 2, 10% at 3, 15% at 4, a quarter at 5, 35% at 6, half at 7, 65% at 8, 80% at 9, all of it at 10, in between by how far he is between them (5.5: 30%) -- the most a twentieth less than it was (' + Object.keys(TABLE).map(cv => cv + ' ' + B.lv[cv].pot).join(', ') + ')');
ok(B.lv[1].thru === 0 && B.lv[7].thru === 21.4 && B.lv[8].thru === 27.8 && B.lv[9].thru === 34.2 && B.lv[10].thru === 42.7, 'a through ball: none by the spot at Curve 1, 21 degrees at 7, 28 at 8, 34 at 9, 43 at 10 (v168: 6, 32, 36, 41 and 45)');
ok(B.lv[10].pass === 15.2 && B.lv[1].pass === 0 && B.lv[10].arc === 40.8 && B.lv[1].arc === 0, 'a long pass 15 at most, the computer\'s round their line 41 (v168: 16 and 43), none at Curve 1');
const LEN = { 5: 0, 8: 0, 10: 0.25, 12: 0.5, 14.5: 0.75, 17: 1, 22: 1, 27: 1, 32: 0.8, 37: 0.65, 42: 0.5, 55: 0.5 };
ok(Object.entries(LEN).every(([m, k]) => Math.abs(B.len[m] - k) < 1e-3), 'it bends best over a middling distance: all of it from 17 m to 27 m; none at 8 m or less, half at 12 (a short pass); 80% at 32 (a long pass), half from 42 m (' + Object.keys(LEN).map(m => m + ' m ' + B.len[m]).join(', ') + ')');

// THE SCENE: G attacking, u metres into their half, w metres off the middle. The passer 10 m in with the ball at his
// feet, the runner 22 m in and 6 m off the middle going straight in behind at 7.5 m/s; D, one of theirs, 20 m in and 2 m
// off the middle, a metre off the straight ball's line; everyone else parked back by the halfway line, their keeper home
await K(`(()=>{ window.__sc=(cv,o)=>{ o=o||{}; restartT=0; offsideT=0; scoredT=0; kickT=0; gkHold=null; const M=MK, atk=atkOf('G'), X=u=>FW/2+atk*u*M, Y=w=>YC+w*M;
  const p=controlled&&controlled.team==='G'&&!controlled.isGK&&controlled.role==='MID'?controlled:players.find(q=>q.team==='G'&&q.role==='MID'); if(controlled!==p) switchTo(p);
  const r=players.find(q=>q.team==='G'&&q!==p&&!q.isGK&&q.role==='ATT')||players.find(q=>q.team==='G'&&q!==p&&!q.isGK), D=players.find(q=>q.team==='R');
  let i=0; for(const q of players) if(q!==p&&q!==r&&q!==D){ q.x=X(-38); q.y=Y(-28+i*6); q.vx=q.vy=0; i++; }
  for(const k of keepers){ k.x=k.homeX; k.y=YC; k.vx=k.vy=0; }
  p.x=X(10); p.y=Y(0); p.vx=p.vy=0; p.facing={x:atk,y:0}; p.faceAvg={x:atk,y:0}; p.stats=Object.assign({},p.stats,{curve:cv,passAcc:10,longPass:10,offIQ:10});
  r.x=X(22); r.y=Y(-6); r.vx=atk*7.5*M; r.vy=0; r.runTarget=null; r.state='normal'; r.facing={x:atk,y:0}; r.faceAvg={x:atk,y:0};
  D.x=X(o.Du??20); D.y=Y(o.Dw??-2); D.vx=D.vy=0; D.state='normal'; D.stats=Object.assign({},D.stats,{speed:6,acceleration:6});
  ball.ownedBy=null; ball.x=p.x+atk*(p.r+ball.r+4); ball.y=p.y; ball.z=0; ball.vx=ball.vy=ball.vz=0; own(p,p.r+ball.r+4);
  return {p,r,D,atk,X,Y,M}; };
  window.__park=S=>{ for(const q of players.concat(keepers)){ q.x=S.X(-46); q.y=S.Y(-30); q.vx=q.vy=0; } ball.intendedRcv=null; recvAuto=null; };
  window.__thru=(cv,o)=>{ const S=window.__sc(cv,o); let H=null; const th0=thruHook; thruHook=function(){ H=th0.apply(this,arguments); return H; };
    const R=Math.random; Math.random=()=>0.5; try{ thruBall(S.p,S.r,{dx:S.atk,dy:0},false); } finally { Math.random=R; thruHook=th0; }
    const T={x:ball.thru.x, y:ball.thru.y}, dl=Math.hypot(T.x-ball.x,T.y-ball.y), ex=(T.x-ball.x)/dl, ey=(T.y-ball.y)/dl, off=(S.D.y-ball.y)*ex-(S.D.x-ball.x)*ey;
    const c=controlled, tm=thruMeet(c), mp=meetPoint(c);
    const out={ y:+((T.y-YC)/S.M).toFixed(2), ahead:+(S.atk*(T.x-S.r.x)/S.M).toFixed(2), across:+((T.y-S.r.y)/S.M).toFixed(2), turn:H?+(H.ts*57.3).toFixed(1):0, side:H?H.side:0, away:off>0?-1:1, q:+thruCurlQ().toFixed(2),
      runner:c===S.r, toSpot:tm?+(Math.hypot(tm.x-T.x,tm.y-T.y)/S.M).toFixed(2):null, straightRead:+(Math.hypot(mp.x-T.x,mp.y-T.y)/S.M).toFixed(2) };
    ball.ownedBy=null; ball.thru=null; ball.vx=ball.vy=ball.vz=0; ball.z=0; ball.x=FW/2; ball.y=YC; endCurve(); ball.arcK=0; return out; };
  return 1; })()`);

// YOUR THROUGH BALL at Curve 1, 5.5 and 10 (struck true), D in its way: how much turn on it by the spot, which way, and
// where it's played to
const A = {}; for(const cv of [1, 5.5, 10]) A[cv] = await K(`window.__thru(${cv})`);
info('your through ball, D in its way: ' + JSON.stringify(A));
ok(A[10].turn === 42.7 && A[5.5].turn === 12.8 && A[1].turn === 0, 'with a man in its way, a 19 m ball, it needs all the bend the passer has: turned ' + A[10].turn + '° by the spot at Curve 10, ' + A[5.5].turn + ' at 5.5, none at 1 (v168: 45, 25.5 and 6)');
ok(A[10].side === A[10].away && A[5.5].side === A[5.5].away && A[1].side === 0, 'its belly away from him (at Curve 1, straight)');
ok(A[10].y === A[1].y && A[5.5].y === A[1].y, 'to the same spot whatever his Curve: where the runner\'s run and the drag put it (' + A[10].y + ' m off the middle)');
// (the runner 13.4 m from the passer: 120 px and 0.15 of that, 165 px)
ok(Math.abs(A[1].ahead - 165.3 / 22.5) < 0.15 && Math.abs(A[1].across) < 0.15 && Math.abs(A[10].ahead - A[1].ahead) < 0.05, 'played ' + A[1].ahead + ' m ahead of him along his line, as before, whatever his Curve (the second round\'s balls were met half that again across toward the passer\'s side: played there, more were lost)');
ok(A[10].q === 0.95 && A[5.5].q > 0.27 && A[5.5].q < 0.3 && A[1].q === 0, 'it carries its bend: at Curve 10, 0.95 of the most a through ball can have (' + A[10].q + '), 0.3 at 5.5 (' + A[5.5].q + '), none at 1 (v168: 1, about half and a little)');

// YOUR MAN, RUN ONTO IT: once it's played he's yours, run onto it with the stick left alone -- to the spot it was
// played to, not where it would come down if it went straight
ok(A[10].runner && A[10].toSpot === 0 && A[10].straightRead > 1, 'your man, run onto your bent through ball, goes to the spot it was played to (a straight read of it is ' + A[10].straightRead + ' m off it)');

// ITS FLIGHT: your Curve 10 through ball in the scene, then everyone out of its way -- where it goes, frame by frame,
// against where it was played to, and against where the game read it would be when it was struck (ballAt), and where a
// read of it going straight would have had it
const fl = await page.evaluate(() => new Promise(res => { const K = window.__K;
  K.ev(`(()=>{ const S=window.__sc(10), R=Math.random; Math.random=()=>0.5; try{ thruBall(S.p,S.r,{dx:S.atk,dy:0},false); } finally { Math.random=R; }
    const off=(S.D.y-ball.y)*(ball.thru.x-ball.x)-(S.D.x-ball.x)*(ball.thru.y-ball.y), ts=[0.4,0.8,1.0];
    const read=ts.map(t=>ballAt(t)), keep=[ball.arcK,ball.curveSpinT]; ball.arcK=0; ball.curveSpinT=0; const flat=ts.map(t=>ballAt(t)); ball.arcK=keep[0]; ball.curveSpinT=keep[1];
    window.__f={ S, x0:ball.x, y0:ball.y, T:{x:ball.thru.x,y:ball.thru.y}, h0:Math.atan2(ball.vy,ball.vx), dSide:Math.sign(off), t0:simNow, pts:[], ts, read, flat };
    window.__park(S); return 1; })()`);
  (function tick(){ const o = K.ev(`(()=>{ const F=window.__f; window.__park(F.S); F.pts.push([ball.x,ball.y,Math.atan2(ball.vy,ball.vx),simNow-F.t0]);
      return simNow-F.t0>1.15||Math.hypot(ball.vx,ball.vy)<20; })()`);   // (on past the spot a little: where it is 1 s on)
    if(o) return res(K.ev(`(()=>{ const F=window.__f, M=MK, dx=F.T.x-F.x0, dy=F.T.y-F.y0, d=Math.hypot(dx,dy), ux=dx/d, uy=dy/d, P=F.pts; let miss=1e9, bow=0, end=0;
      for(let i=1;i<P.length;i++){ const [ax,ay]=P[i-1], [bx,by]=P[i], sx=bx-ax, sy=by-ay, L2=sx*sx+sy*sy||1, f=Math.max(0,Math.min(1,((F.T.x-ax)*sx+(F.T.y-ay)*sy)/L2)), dd=Math.hypot(ax+sx*f-F.T.x,ay+sy*f-F.T.y); if(dd<miss){ miss=dd; end=i; } }
      const turnAt=k=>{ const h=P[k][2]-F.h0; return Math.atan2(Math.sin(h),Math.cos(h)); }, total=turnAt(end), len=[0]; for(let i=1;i<=end;i++) len.push(len[i-1]+Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]));
      const at=f=>{ let k=0; while(k<end&&len[k]<f*len[end]) k++; return turnAt(k)/total; };
      for(let i=0;i<=end;i++){ const al=(P[i][0]-F.x0)*ux+(P[i][1]-F.y0)*uy, of=((P[i][1]-F.y0)*ux-(P[i][0]-F.x0)*uy)*F.dSide; if(al>0&&al<d&&Math.abs(of)>Math.abs(bow)) bow=of; }
      const pos=t=>{ for(let i=1;i<P.length;i++) if(P[i][3]>=t){ const a=P[i-1], b=P[i], f=(t-a[3])/((b[3]-a[3])||1); return {x:a[0]+(b[0]-a[0])*f, y:a[1]+(b[1]-a[1])*f}; } return null; };
      const err=(R)=>F.ts.map((t,i)=>{ const q=pos(t); return q?+(Math.hypot(q.x-R[i].x,q.y-R[i].y)/M).toFixed(2):null; });
      const after=Math.sign(total)*(turnAt(P.length-1)-total)*57.3;   // (how much more it's turned 1.15 s on, past the spot)
      return { chord:+(d/M).toFixed(1), miss:+(miss/M).toFixed(2), bow:+(bow/M).toFixed(2), turn:+Math.abs(total*57.3).toFixed(1), after:+after.toFixed(1), half:+at(0.5).toFixed(2), threeQ:+at(0.75).toFixed(2), readErr:err(F.read), flatErr:err(F.flat) }; })()`));
    requestAnimationFrame(tick); })(); }));
info('its flight at Curve 10: ' + JSON.stringify(fl));
ok(fl.miss < 0.25, 'it finishes on the spot it was played to (' + fl.miss + ' m off it, ' + fl.chord + ' m away)');
ok(fl.bow <= -1.1 && fl.bow >= -2.4, 'it bulges away from him, ' + (-fl.bow) + ' m off its line by the spot (the second round\'s: 0.8 to 2.9 m)');
ok(fl.turn >= 38 && fl.turn <= 50 && fl.half >= 0.3 && fl.half <= 0.48 && fl.threeQ >= 0.56 && fl.threeQ <= 0.74,
  'and bends from the moment it\'s struck, the more as it slows (the spin on it: v169 -- v167-v168 it ran on straight and dipped late, 6-22% of the turn done halfway): ' + fl.turn + '° of turn on it by the spot, ' + Math.round(fl.half * 100) + '% of that done halfway there, ' + Math.round(fl.threeQ * 100) + '% three-quarters of the way');
ok(fl.after > 5, '...and it\'s still turning past the spot, as the second round\'s balls were: ' + fl.after + '° more by 1.15 s');
ok(fl.readErr.every(e => e !== null && e < 1.6) && fl.readErr[2] < fl.flatErr[2] / 2,
  'everyone reading the ball reads its hook: where it is 0.4, 0.8 and 1 s on, within ' + Math.max(...fl.readErr) + ' m of where the game read it would be when it was struck (a read of it going straight: ' + fl.flatErr.join(', ') + ' m out)');

// WHICH WAY, AND HOW MUCH: a 20 m ball, Curve 10. One of theirs 6 m short of the spot and 4 m off its line, either
// side; one on its line half-way; two of theirs 2.5 m either side of its line 14 m along (a gap the runner's through);
// nobody within 18 m; one only beyond the spot; and the ball 8 m and 13 m long with one of theirs 5 m along, 3 m off
const W = await K(`(()=>{ const S=window.__sc(10), {p,r,D}=S, D2=players.find(q=>q.team==='R'&&q!==D), M=S.M, a=S.atk, out={};
  const away=()=>{ D.x=S.X(-38); D.y=S.Y(25); D2.x=S.X(-38); D2.y=S.Y(28); };
  const go=m=>{ const tx=ball.x+a*m*M, ty=ball.y, H=thruHook(p,tx,ty,0,0); return H?{side:H.side*a, turn:+(H.ts*57.3).toFixed(1)}:null; };   // (side: -1, its belly up the screen; +1, down it -- whichever way it's going)
  away(); D.x=ball.x+a*14*M; D.y=ball.y+4*M; out.below=go(20);
  away(); D.x=ball.x+a*14*M; D.y=ball.y-4*M; out.above=go(20);
  away(); D.x=ball.x+a*10*M; D.y=ball.y+0.6*M; out.lane=go(20);
  away(); D.x=ball.x+a*14*M; D.y=ball.y+2.5*M; D2.x=ball.x+a*14*M; D2.y=ball.y-2.5*M; out.gap=go(20);
  away(); out.nobody=go(20);
  away(); D.x=ball.x+a*23*M; D.y=ball.y+2*M; out.beyond=go(20);
  away(); D.x=ball.x+a*5*M; D.y=ball.y+3*M; out.m8=go(8); out.m13=go(13);
  away(); ball.ownedBy=null; return out; })()`);
info('which way, and how much (side -1: its belly up the screen; +1: down it): ' + JSON.stringify(W));
ok(W.below && W.above && W.below.side === -1 && W.above.side === 1 && Math.abs(W.below.turn - 17.1) < 0.3 && W.above.turn === W.below.turn,
  'one of theirs short of the spot, 4 m off its line: bulging the other way, whichever side he\'s on, with as much bend as that needs (' + W.below.turn + '° by the spot: four-tenths of it)');
ok(W.lane && W.lane.side === -1 && W.lane.turn === 42.7, 'one in its way, 0.6 m off its line half-way: all the bend there is, bulging away from him (' + (W.lane && W.lane.turn) + '°)');
ok(W.gap === null, 'a runner through a gap between two of them: straight -- its belly would take it into one of them');
ok(W.nobody === null && W.beyond === null, 'nobody of theirs within 18 m of the spot, or only a man beyond it: straight');
ok(W.m8 === null && W.m13 && W.m13.turn > 12 && W.m13.turn < 15, 'an 8 m ball: straight; a 13 m one with a man 3 m off its line, bent ' + (W.m13 && W.m13.turn) + '° by the spot (v168: 23.5 -- a short ball, it has 60% of what it could have from 17 m)');

// THE COMPUTER'S, along the grass into a runner's path with D short of the spot: hooked the same, and read exactly
const cpu = await K(`(()=>{ const S=window.__sc(10), {p,r}=S; const R=Math.random; Math.random=()=>0.5; let o;
  try{ ball.ownedBy=null; obThruBall(p,r,S.X(28),S.Y(-6),1.3,null); const t=[0.4,0.8].map(x=>ballAt(x));
    o={ hooked:ball.arcK>0&&ball.arcA>0, turn:+(ball.thruCurl*57.3).toFixed(1), read:t.map(q=>[q.x,q.y]) }; } finally { Math.random=R; }
  window.__cp={S, t0:simNow}; window.__park(S); return o; })()`);
const cpuAt = await page.evaluate(() => new Promise(res => { const K = window.__K, got = [];
  (function tick(){ const t = K.ev('(()=>{ window.__park(window.__cp.S); return [simNow-window.__cp.t0, ball.x, ball.y]; })()'); got.push(t);
    if(t[0] >= 0.85) return res(got); requestAnimationFrame(tick); })(); }));
const posAt = tt => { for(let i = 1; i < cpuAt.length; i++) if(cpuAt[i][0] >= tt){ const a = cpuAt[i - 1], b = cpuAt[i], f = (tt - a[0]) / ((b[0] - a[0]) || 1); return [a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]; } return null; };
const cErr = [0.4, 0.8].map((tt, i) => { const q = posAt(tt); return q ? +(Math.hypot(q[0] - cpu.read[i][0], q[1] - cpu.read[i][1]) / 22.5).toFixed(2) : null; });
info('the computer\'s: ' + JSON.stringify({ hooked: cpu.hooked, turn: cpu.turn, readErr: cErr }));
ok(cpu.hooked && cpu.turn > 15 && cpu.turn <= 42.7, 'the computer\'s through ball is hooked in late the same, as much as it needs (' + cpu.turn + '° by the spot at Curve 10)');
ok(cErr.every(e => e !== null && e < 0.3), '...and read exactly as it goes: along the grass, where it is 0.4 and 0.8 s on is where the game read it would be (' + cErr.join(', ') + ' m)');

// HARDER TO GET A FOOT TO: a ball of ours going past D on its way through to a man of ours, 0.9 of his reach for it off
// him and coming to him (him facing it); curling as much as a through ball can, and straight. The moment
// it's there, as the game decides who gets a touch on it
const reach = curl => K(`(()=>{ const S=window.__sc(1,{Du:-20,Dw:-20}), {D,r}=S, R=winReachR(D)*(0.45+0.55*interceptReachOf(D))*cpu(D).reach;
  r.x=S.X(-38); r.y=S.Y(20); r.vx=r.vy=0; D.x=S.X(20); D.y=S.Y(0); D.vx=D.vy=0; D.facing={x:-S.atk,y:0}; D.faceAvg={x:-S.atk,y:0}; D.noTouchT=0; D.reachT=-1;
  const g=0.9*R+ball.r, ax=0.5*g; ball.ownedBy=null; ball.dribbler=null; ball.dribbleGrace=0; ball.shotT=0; ball.x=D.x-S.atk*ax; ball.y=D.y+Math.sqrt(g*g-ax*ax); ball.z=0; ball.vz=0; ball.vx=S.atk*420; ball.vy=0;
  ball.lastTouch='G'; ball.intendedRcv=r; ball.passerRef=S.p; ball.thru={x:D.x+S.atk*300,y:ball.y,until:simNow+5};
  ball.curveSpin=1; ball.curveK=0; ball.arcK=0; ball.curveSpinT=9; ball.thruCurl=${curl ? 'THRU_BEND' : 0};
  const q=thruCurlQ(); attemptCaptures(); const cut=ball.lastTouch==='R'||ball.ownedBy===D;
  ball.ownedBy=null; ball.thru=null; ball.vx=ball.vy=0; ball.x=FW/2; ball.y=YC; endCurve(); return { cut, R:+R.toFixed(1), off:+g.toFixed(1), q:+q.toFixed(2) }; })()`);
const Rc = await reach(true), Rs = await reach(false);
info('at 0.9 of his reach off him: curling ' + JSON.stringify(Rc) + ', straight ' + JSON.stringify(Rs));
ok(Rs.q === 0 && Rs.cut, 'a ball 0.9 of his reach off him, straight: he gets a foot to it');
ok(Rc.q === 1 && !Rc.cut, '...curling as much as a through ball can: it\'s out of his reach (a fifth less of it)');

// THE TOUCH ON IT: D getting to it, and the man it's for -- the average of 2000 of each, curling as much as a through
// ball can and straight
const T = await K(`(()=>{ const S=window.__sc(1,{Du:-20,Dw:-20}), {D,r}=S, n=2000, avg=(p,icp,curl)=>{ let s=0; for(let i=0;i<n;i++){ ball.thru={x:0,y:0,until:simNow+5}; ball.intendedRcv=r; ball.lastTouch='G'; ball.thruCurl=curl?THRU_BEND:0; ball.vx=300; ball.vy=0; ball.z=0; s+=touchQuality(p,icp); } return s/n; };
  ball.ownedBy=null; const o={ theirs:+(avg(D,true,true)-avg(D,true,false)).toFixed(3), his:+(avg(r,false,true)-avg(r,false,false)).toFixed(3) }; ball.thru=null; ball.thruCurl=0; ball.vx=0; return o; })()`);
info('a curling through ball against a straight one, the touch on it (0..1, on average): ' + JSON.stringify(T));
ok(T.theirs < -0.15, 'a man of theirs getting to a curling one has the worse touch on it (' + T.theirs + ')');
ok(T.his > 0.05, '...and the man it\'s for the cleaner (+' + T.his + ')');

// IN THE SCENES: your through ball to a man breaking in behind -- him at an angle, their keeper home, everyone fresh and
// free to go for it -- the same scenes (the same random draws) at Curve 1 and at 10. 'gap': a back line of two, a few
// metres either side of him; 'one': one of theirs a few metres off him, level or behind, the other well across. How many
// end up yours (one of yours has it before one of theirs does)
const scenes = async (kind, N) => { const mine = {};
  for(const cv of [1, 10]){ let g = 0, n = 0;
    for(let k = 0; k < N; k++){
      const out = await page.evaluate(({ k, cv, kind }) => new Promise(res => { const K = window.__K;
        let a = (1000003 + k * 7919) >>> 0; const rnd = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
        const g = []; for(let i = 0; i < 8; i++) g.push(rnd()); Math.random = rnd;
        K.ev(`(()=>{ const g=${JSON.stringify(g)}; restartT=0; offsideT=0; scoredT=0; kickT=0; gkHold=null; breakT=0; matchClock=Math.min(matchClock,60); for(const q of players.concat(keepers)) q.stamina=q.staminaCap=1;
          const M=MK, atk=atkOf('G'), X=u=>FW/2+atk*u*M, Y=w=>YC+w*M;
          const p=controlled&&controlled.team==='G'&&!controlled.isGK&&controlled.role==='MID'?controlled:players.find(q=>q.team==='G'&&q.role==='MID'); if(controlled!==p) switchTo(p);
          const r=players.find(q=>q.team==='G'&&q!==p&&!q.isGK&&q.role==='ATT')||players.find(q=>q.team==='G'&&q!==p&&!q.isGK), Dd=players.filter(q=>q.team==='R'&&!q.isGK).slice(0,2);
          let i=0; for(const q of players) if(q!==p&&q!==r&&!Dd.includes(q)){ q.x=X(-38); q.y=Y(-28+i*6); q.vx=q.vy=0; i++; }
          for(const kq of keepers){ kq.x=kq.homeX; kq.y=YC; kq.vx=kq.vy=0; kq.mode='line'; kq.holdT=0; kq.heldT=0; kq.claimCd=0; kq.charging=false; kq.state='normal'; }
          const pw=-6+12*g[0], rw=-12+24*g[1], ang=(-50+100*g[2])*Math.PI/180, line=26+2*g[3], d1=2+4*g[4], d2=2+4*g[5], sd=g[6]<0.5?1:-1;
          p.x=X(8+8*g[7]); p.y=Y(pw); p.vx=p.vy=0; p.facing={x:atk,y:0}; p.faceAvg={x:atk,y:0}; p.state='normal'; p.stats=Object.assign({},p.stats,{curve:${cv},passAcc:8,longPass:8,offIQ:8});
          r.x=X(line-1.5); r.y=Y(rw); r.vx=atk*7.5*M*Math.cos(ang); r.vy=7.5*M*Math.sin(ang); r.runTarget=null; r.state='normal'; r.facing={x:r.vx/(7.5*M),y:r.vy/(7.5*M)}; r.faceAvg=Object.assign({},r.facing);
          if('${kind}'==='gap'){ Dd[0].x=X(line); Dd[0].y=Y(rw+sd*d1); Dd[1].x=X(line); Dd[1].y=Y(rw-sd*d2); }
          else { Dd[0].x=X(line-3*g[4]); Dd[0].y=Y(rw+sd*(2+4*g[5])); Dd[1].x=X(line+2); Dd[1].y=Y(rw-sd*(12+8*g[4])); }
          for(const q of Dd){ q.vx=q.vy=0; q.state='normal'; q.noTouchT=0; q.facing={x:-atk,y:0}; q.faceAvg={x:-atk,y:0}; q.stats=Object.assign({},q.stats,{interceptions:6,defIQ:6,speed:6,acceleration:6,tackle:6}); }
          ball.x=p.x+atk*(p.r+ball.r+4); ball.y=p.y; ball.z=0; ball.vx=ball.vy=ball.vz=0; own(p,p.r+ball.r+4);
          thruBall(p,r,{dx:atk,dy:0},false); window.__tr={t0:simNow}; return 1; })()`);
        (function tick(){ const st = K.ev(`(()=>{ const T=window.__tr, b=ball; if(b.ownedBy&&b.ownedBy.team==='G') return 'ours'; if(gkHold||(b.ownedBy&&b.ownedBy.team==='R')) return 'theirs'; if(simNow-T.t0>4||b.x<0||b.x>FW||b.y<0||b.y>FH) return 'else'; return null; })()`);
          if(st) return res(st); setTimeout(tick, 4); })(); }), { k, cv, kind });
      n++; if(out === 'ours') g++; }
    mine[cv] = +(g / n).toFixed(3); }
  return mine; };
const one = await scenes('one', 400), gap = await scenes('gap', 300);
info('your through balls in the scenes that end up yours -- one of theirs off him: Curve 1 ' + one[1] + ', Curve 10 ' + one[10] + ' (400 each); through a gap between two: Curve 1 ' + gap[1] + ', Curve 10 ' + gap[10] + ' (300 each)');
ok(one[10] >= one[1], 'with one of theirs off him, at least as many end up yours at Curve 10 as at 1 (' + one[10] + ' against ' + one[1] + ', 400 scenes; over 1000 it\'s about 5 in 100 more, since v169 a Curve 1 ball goes straight) -- the hook is worth having');
ok(gap[10] >= gap[1] - 0.03, 'through a gap between two of them, as many at Curve 10 as at 1, within 3 in 100 (' + gap[10] + ' against ' + gap[1] + '): it goes straight there');

await browser.close();
process.exit(rep.finish() ? 1 : 0);
