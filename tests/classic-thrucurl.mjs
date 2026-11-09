// FOOTBALL CLASSIC, CURVE IN THROUGH BALLS (v165; v167, bent as it was drawn): a through ball is hooked in late onto
// the spot -- set off a little wide, almost straight, the turn on it coming with the cube of the way it's gone -- 9
// degrees of turn at Curve 1, 72 at 10 (a long pass, still 16 at most; the computer's round their back line, 6 to 43),
// none on a ball of 11 m or less and all of it from 15 m. Its belly is on the far side from one of theirs on its line,
// or else from the nearest of theirs short of the spot within 18 m -- unless another way (hooked the other way, half
// as much, or straight) clearly keeps it further from their men: a runner through a gap between two of them gets it
// straight. Nobody there, or only a man beyond the spot, it goes straight. It's played as far ahead of the runner as
// ever, finishes on the spot, and everyone reading the ball reads its hook.
// A CURLING THROUGH BALL is harder to deal with, by the bend it was struck with, till anyone touches it: a man of theirs
// has a fifth less reach for it at Curve 10's full bend and a worse touch on it, and the man it's for takes it the
// cleaner. YOUR MAN, RUN ONTO IT (the stick left alone), goes to the spot a bent one was played to. And in varied scenes
// -- a man breaking in behind with one of theirs a few metres off him, as the drawn balls were played, their keeper in
// goal -- more of your through balls end up yours at Curve 10 than at 1; through a gap between two of them (where it
// goes straight), as many.
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

// THE BEND IT MAY HAVE: a through ball's and a long pass's, by Curve; and round their line
const B = await K(`(()=>{ const p=players.find(q=>q.team==='G'&&!q.isGK), keep=p.stats, at=cv=>{ p.stats=Object.assign({},keep,{curve:cv}); return { thru:+(thruBendOf(p)*57.3).toFixed(1), pass:+(passBendOf(p)*57.3).toFixed(1), arc:+(thruArcOf(p)*57.3).toFixed(1) }; };
  const r={1:at(1), 10:at(10)}; p.stats=keep; return r; })()`);
info('the bend it may have, degrees of turn: ' + JSON.stringify(B));
ok(B[1].thru === 8.6 && B[10].thru === 71.6 && B[10].pass === 16, 'a through ball: 9 degrees of turn at Curve 1, 72 at 10, as it was drawn (v165: 2 and 29) -- a long pass still 16 at most (' + B[10].pass + ')');
ok(B[1].arc === 5.7 && B[10].arc === 43, 'the computer\'s round their line: 6 degrees at Curve 1, 43 at 10, as before');

// THE SCENE: G attacking, u metres into their half, w metres off the middle. The passer 10 m in with the ball at his
// feet, the runner 22 m in and 6 m off the middle going straight in behind at 7.5 m/s; D, one of theirs, 2 m outside his
// run and 4 m ahead of him; everyone else parked back by the halfway line, their keeper home
await K(`(()=>{ window.__sc=(cv,o)=>{ o=o||{}; restartT=0; offsideT=0; scoredT=0; kickT=0; gkHold=null; const M=MK, atk=atkOf('G'), X=u=>FW/2+atk*u*M, Y=w=>YC+w*M;
  const p=controlled&&controlled.team==='G'&&!controlled.isGK&&controlled.role==='MID'?controlled:players.find(q=>q.team==='G'&&q.role==='MID'); if(controlled!==p) switchTo(p);
  const r=players.find(q=>q.team==='G'&&q!==p&&!q.isGK&&q.role==='ATT')||players.find(q=>q.team==='G'&&q!==p&&!q.isGK), D=players.find(q=>q.team==='R');
  let i=0; for(const q of players) if(q!==p&&q!==r&&q!==D){ q.x=X(-38); q.y=Y(-28+i*6); q.vx=q.vy=0; i++; }
  for(const k of keepers){ k.x=k.homeX; k.y=YC; k.vx=k.vy=0; }
  p.x=X(10); p.y=Y(0); p.vx=p.vy=0; p.facing={x:atk,y:0}; p.faceAvg={x:atk,y:0}; p.stats=Object.assign({},p.stats,{curve:cv,passAcc:10,longPass:10,offIQ:10});
  r.x=X(22); r.y=Y(-6); r.vx=atk*7.5*M; r.vy=0; r.runTarget=null; r.state='normal'; r.facing={x:atk,y:0}; r.faceAvg={x:atk,y:0};
  D.x=X(o.Du??26); D.y=Y(o.Dw??-8); D.vx=D.vy=0; D.state='normal'; D.stats=Object.assign({},D.stats,{speed:6,acceleration:6});
  ball.ownedBy=null; ball.x=p.x+atk*(p.r+ball.r+4); ball.y=p.y; ball.z=0; ball.vx=ball.vy=ball.vz=0; own(p,p.r+ball.r+4);
  return {p,r,D,atk,X,Y,M}; };
  window.__park=S=>{ for(const q of players.concat(keepers)){ q.x=S.X(-46); q.y=S.Y(-30); q.vx=q.vy=0; } ball.intendedRcv=null; recvAuto=null; };
  window.__thru=(cv,o)=>{ const S=window.__sc(cv,o); let H=null; const th0=thruHook; thruHook=function(){ H=th0.apply(this,arguments); return H; };
    const R=Math.random; Math.random=()=>0.5; try{ thruBall(S.p,S.r,{dx:S.atk,dy:0},false); } finally { Math.random=R; thruHook=th0; }
    const T={x:ball.thru.x, y:ball.thru.y}, dl=Math.hypot(T.x-ball.x,T.y-ball.y), ex=(T.x-ball.x)/dl, ey=(T.y-ball.y)/dl, off=(S.D.y-ball.y)*ex-(S.D.x-ball.x)*ey;
    const c=controlled, tm=thruMeet(c), mp=meetPoint(c);
    const out={ y:+((T.y-YC)/S.M).toFixed(2), ahead:+(Math.hypot(T.x-S.r.x,T.y-S.r.y)/S.M).toFixed(2), turn:H?+(H.th*57.3).toFixed(1):0, side:H?H.side:0, away:off>0?-1:1, q:+thruCurlQ().toFixed(2),
      runner:c===S.r, toSpot:tm?+(Math.hypot(tm.x-T.x,tm.y-T.y)/S.M).toFixed(2):null, straightRead:+(Math.hypot(mp.x-T.x,mp.y-T.y)/S.M).toFixed(2) };
    ball.ownedBy=null; ball.thru=null; ball.vx=ball.vy=ball.vz=0; ball.z=0; ball.x=FW/2; ball.y=YC; endCurve(); ball.arcK=0; return out; };
  return 1; })()`);

// YOUR THROUGH BALL at Curve 1, 5.5 and 10 (struck true), D short of the spot and off its line: how much turn on it,
// which way, and where it's played to
const A = {}; for(const cv of [1, 5.5, 10]) A[cv] = await K(`window.__thru(${cv})`);
info('your through ball, D short of the spot and off its line: ' + JSON.stringify(A));
ok(A[10].turn === 71.6 && A[5.5].turn === 40.1 && A[1].turn === 8.6, 'hooked with all the turn the passer has on a ball this long (' + A[10].turn + '° at Curve 10, ' + A[5.5].turn + ' at 5.5, ' + A[1].turn + ' at 1)');
ok(A[10].side === A[10].away && A[1].side === A[1].away, 'its belly away from him');
ok(A[10].y === A[1].y && A[5.5].y === A[1].y, 'to the same spot whatever his Curve: where the runner\'s run and the drag put it (' + A[10].y + ' m off the middle)');
// (the runner 13.4 m from the passer: 120 px and 0.15 of that, 165 px)
ok(Math.abs(A[1].ahead - 165.3 / 22.5) < 0.15 && Math.abs(A[10].ahead - A[1].ahead) < 0.05, 'played ' + A[1].ahead + ' m ahead of him, as before, whatever his Curve (the through balls drawn went about a quarter further on: played there, more were lost)');
ok(A[10].q === 1 && A[5.5].q > 0.5 && A[5.5].q < 0.6 && A[1].q > 0.1 && A[1].q < 0.15, 'it carries its bend: as curling as a through ball can be at Curve 10 (' + A[10].q + '), about half that at 5.5 (' + A[5.5].q + '), a little at 1 (' + A[1].q + ')');

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
      return { chord:+(d/M).toFixed(1), miss:+(miss/M).toFixed(2), bow:+(bow/M).toFixed(2), turn:+Math.abs(total*57.3).toFixed(1), half:+at(0.5).toFixed(2), threeQ:+at(0.75).toFixed(2), readErr:err(F.read), flatErr:err(F.flat) }; })()`));
    requestAnimationFrame(tick); })(); }));
info('its flight at Curve 10: ' + JSON.stringify(fl));
ok(fl.miss < 0.25, 'it finishes on the spot it was played to (' + fl.miss + ' m off it, ' + fl.chord + ' m away)');
ok(fl.bow <= -2.6 && fl.bow >= -4, 'it bulges away from him, ' + (-fl.bow) + ' m off its line (the ones drawn: 2.5 to 3.7 m)');
ok(fl.turn >= 62 && fl.turn <= 74 && fl.half >= 0.06 && fl.half <= 0.22 && fl.threeQ >= 0.32 && fl.threeQ <= 0.55,
  'and hooks in late: ' + fl.turn + '° of turn on it by the spot, ' + Math.round(fl.half * 100) + '% of it done halfway along, ' + Math.round(fl.threeQ * 100) + '% three-quarters of the way (drawn: 15% and 42%)');
ok(fl.readErr.every(e => e !== null && e < 1.6) && fl.readErr[2] < fl.flatErr[2] / 2,
  'everyone reading the ball reads its hook: where it is 0.4, 0.8 and 1 s on, within ' + Math.max(...fl.readErr) + ' m of where the game read it would be when it was struck (a read of it going straight: ' + fl.flatErr.join(', ') + ' m out)');

// WHICH WAY, AND HOW MUCH: a 20 m ball, Curve 10. One of theirs 6 m short of the spot and 4 m off its line, either
// side; one on its line half-way; two of theirs 3 m either side of its line 14 m along (a gap the runner's through);
// nobody within 18 m; one only beyond the spot; and the ball 11 m and 13 m long with one of theirs 7 m along, 3 m off
const W = await K(`(()=>{ const S=window.__sc(10), {p,r,D}=S, D2=players.find(q=>q.team==='R'&&q!==D), M=S.M, a=S.atk, out={};
  const away=()=>{ D.x=S.X(-38); D.y=S.Y(25); D2.x=S.X(-38); D2.y=S.Y(28); };
  const go=m=>{ const tx=ball.x+a*m*M, ty=ball.y, H=thruHook(p,tx,ty,0,0); return H?{side:H.side*a, turn:+(H.th*57.3).toFixed(1)}:null; };   // (side: -1, its belly up the screen; +1, down it -- whichever way it's going)
  away(); D.x=ball.x+a*14*M; D.y=ball.y+4*M; out.below=go(20);
  away(); D.x=ball.x+a*14*M; D.y=ball.y-4*M; out.above=go(20);
  away(); D.x=ball.x+a*10*M; D.y=ball.y+0.6*M; out.lane=go(20);
  away(); D.x=ball.x+a*14*M; D.y=ball.y+3*M; D2.x=ball.x+a*14*M; D2.y=ball.y-3*M; out.gap=go(20);
  away(); out.nobody=go(20);
  away(); D.x=ball.x+a*23*M; D.y=ball.y+2*M; out.beyond=go(20);
  away(); D.x=ball.x+a*7*M; D.y=ball.y+3*M; out.m11=go(11); out.m13=go(13);
  away(); ball.ownedBy=null; return out; })()`);
info('which way, and how much (side -1: its belly up the screen; +1: down it): ' + JSON.stringify(W));
ok(W.below && W.above && W.below.side === -1 && W.above.side === 1 && W.below.turn === 71.6 && W.above.turn === 71.6,
  'one of theirs short of the spot, off to one side: all the turn on it, bulging the other way, whichever side he\'s on');
ok(W.lane && W.lane.side === -1 && W.lane.turn === 71.6, 'one on its line half-way: bulging away from him');
ok(W.gap === null, 'a runner through a gap between two of them: straight -- its belly would take it into one of them');
ok(W.nobody === null && W.beyond === null, 'nobody of theirs within 18 m of the spot, or only a man beyond it: straight');
ok(W.m11 === null && W.m13 && W.m13.turn === 35.8, 'an 11 m ball: straight; a 13 m one, half the turn (' + (W.m13 && W.m13.turn) + '°) -- all of it from 15 m');

// THE COMPUTER'S, along the grass into a runner's path with D short of the spot: hooked the same, and read exactly
const cpu = await K(`(()=>{ const S=window.__sc(10), {p,r}=S; const R=Math.random; Math.random=()=>0.5; let o;
  try{ ball.ownedBy=null; obThruBall(p,r,S.X(28),S.Y(-6),1.3,null); const t=[0.4,0.8].map(x=>ballAt(x));
    o={ hooked:ball.arcK>0&&ball.arcM===3, turn:+(ball.thruCurl*57.3).toFixed(1), read:t.map(q=>[q.x,q.y]) }; } finally { Math.random=R; }
  window.__cp={S, t0:simNow}; window.__park(S); return o; })()`);
const cpuAt = await page.evaluate(() => new Promise(res => { const K = window.__K, got = [];
  (function tick(){ const t = K.ev('(()=>{ window.__park(window.__cp.S); return [simNow-window.__cp.t0, ball.x, ball.y]; })()'); got.push(t);
    if(t[0] >= 0.85) return res(got); requestAnimationFrame(tick); })(); }));
const posAt = tt => { for(let i = 1; i < cpuAt.length; i++) if(cpuAt[i][0] >= tt){ const a = cpuAt[i - 1], b = cpuAt[i], f = (tt - a[0]) / ((b[0] - a[0]) || 1); return [a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]; } return null; };
const cErr = [0.4, 0.8].map((tt, i) => { const q = posAt(tt); return q ? +(Math.hypot(q[0] - cpu.read[i][0], q[1] - cpu.read[i][1]) / 22.5).toFixed(2) : null; });
info('the computer\'s: ' + JSON.stringify({ hooked: cpu.hooked, turn: cpu.turn, readErr: cErr }));
ok(cpu.hooked && cpu.turn === 71.6, 'the computer\'s through ball is hooked in late the same (' + cpu.turn + '° at Curve 10)');
ok(cErr.every(e => e !== null && e < 0.3), '...and read exactly as it goes: along the grass, where it is 0.4 and 0.8 s on is where the game read it would be (' + cErr.join(', ') + ' m)');

// HARDER TO GET A FOOT TO: a ball of ours going past D on its way through to a man of ours, 0.9 of his reach for it off
// him and coming to him (him facing it); curling as a through ball does at Curve 10's full bend, and straight. The moment
// it's there, as the game decides who gets a touch on it
const reach = curl => K(`(()=>{ const S=window.__sc(1,{Du:-20,Dw:-20}), {D,r}=S, R=winReachR(D)*(0.45+0.55*interceptReachOf(D))*cpu(D).reach;
  r.x=S.X(-38); r.y=S.Y(20); r.vx=r.vy=0; D.x=S.X(20); D.y=S.Y(0); D.vx=D.vy=0; D.facing={x:-S.atk,y:0}; D.faceAvg={x:-S.atk,y:0}; D.noTouchT=0; D.reachT=-1;
  const g=0.9*R+ball.r, ax=0.5*g; ball.ownedBy=null; ball.dribbler=null; ball.dribbleGrace=0; ball.shotT=0; ball.x=D.x-S.atk*ax; ball.y=D.y+Math.sqrt(g*g-ax*ax); ball.z=0; ball.vz=0; ball.vx=S.atk*420; ball.vy=0;
  ball.lastTouch='G'; ball.intendedRcv=r; ball.passerRef=S.p; ball.thru={x:D.x+S.atk*300,y:ball.y,until:simNow+5};
  ball.curveSpin=1; ball.curveK=0; ball.arcK=0; ball.curveSpinT=9; ball.thruCurl=${curl ? 'THRU_BEND[1]' : 0};
  const q=thruCurlQ(); attemptCaptures(); const cut=ball.lastTouch==='R'||ball.ownedBy===D;
  ball.ownedBy=null; ball.thru=null; ball.vx=ball.vy=0; ball.x=FW/2; ball.y=YC; endCurve(); return { cut, R:+R.toFixed(1), off:+g.toFixed(1), q:+q.toFixed(2) }; })()`);
const Rc = await reach(true), Rs = await reach(false);
info('at 0.9 of his reach off him: curling ' + JSON.stringify(Rc) + ', straight ' + JSON.stringify(Rs));
ok(Rs.q === 0 && Rs.cut, 'a ball 0.9 of his reach off him, straight: he gets a foot to it');
ok(Rc.q === 1 && !Rc.cut, '...curling as a through ball at Curve 10: it\'s out of his reach (a fifth less of it)');

// THE TOUCH ON IT: D getting to it, and the man it's for -- the average of 2000 of each, curling at Curve 10's full bend
// and straight
const T = await K(`(()=>{ const S=window.__sc(1,{Du:-20,Dw:-20}), {D,r}=S, n=2000, avg=(p,icp,curl)=>{ let s=0; for(let i=0;i<n;i++){ ball.thru={x:0,y:0,until:simNow+5}; ball.intendedRcv=r; ball.lastTouch='G'; ball.thruCurl=curl?THRU_BEND[1]:0; ball.vx=300; ball.vy=0; ball.z=0; s+=touchQuality(p,icp); } return s/n; };
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
const one = await scenes('one', 300), gap = await scenes('gap', 300);
info('your through balls in the scenes that end up yours -- one of theirs off him: Curve 1 ' + one[1] + ', Curve 10 ' + one[10] + '; through a gap between two: Curve 1 ' + gap[1] + ', Curve 10 ' + gap[10] + ' (300 each)');
ok(one[10] >= one[1] + 0.04, 'with one of theirs off him, more end up yours at Curve 10 than at 1 (' + one[10] + ' against ' + one[1] + ') -- the hook is worth having');
ok(gap[10] >= gap[1] - 0.03, 'through a gap between two of them, as many at Curve 10 as at 1, within 3 in 100 (' + gap[10] + ' against ' + gap[1] + '): it goes straight there');

await browser.close();
process.exit(rep.finish() ? 1 : 0);
