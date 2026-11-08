// FOOTBALL CLASSIC, CURVE IN THROUGH BALLS (v165): a through ball may bend more than a long pass -- 2 degrees of turn at
// Curve 1, 29 at 10 (a long pass, still 16) -- and the computer's, round their back line, up to 43 at 10 (it was 34).
// THE MAN CLOSING ON IT: of theirs, the one who'd be soonest where it's going -- a race for it if he'd be there by the
// time it is, none of one half a second behind it; with one closing on it, it's bent away from him, all the bend the
// passer has if it's a race. A man it'll be over the head of as it gets to him isn't in its way. A CURLING THROUGH BALL
// is harder to deal with, by the bend it was struck with, till anyone touches it: a man of theirs has a fifth less reach
// for it at Curve 10's full bend and a worse touch on it, and the man it's for takes it the cleaner. YOUR MAN, RUN ONTO
// IT (the stick left alone), goes to the spot a bent one was played to -- he read it as if it went straight, and ran the
// wrong way -- and in varied scenes (a man breaking past a back line of two, their keeper in goal), as many of your
// through balls end up yours at Curve 10 as at 1, where 5 in 100 fewer did.
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
ok(B[1].thru === 2.3 && B[10].thru === 28.6 && B[10].pass === 16, 'a through ball: 2 degrees of turn at Curve 1, 29 at 10 -- a long pass still 16 at most (' + B[10].pass + ')');
ok(B[1].arc === 5.7 && B[10].arc === 43, 'the computer\'s round their line: 6 degrees at Curve 1, 43 at 10 (it was 34)');

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
  window.__thru=(cv,o)=>{ const S=window.__sc(cv,o); let CU=null; const pc=passCurl; passCurl=function(){ CU=pc.apply(this,arguments); return CU; };
    const R=Math.random; Math.random=()=>0.5; try{ thruBall(S.p,S.r,{dx:S.atk,dy:0},false); } finally { Math.random=R; passCurl=pc; }
    const T={x:ball.thru.x, y:ball.thru.y}, dl=Math.hypot(T.x-ball.x,T.y-ball.y), ex=(T.x-ball.x)/dl, ey=(T.y-ball.y)/dl, off=(S.D.y-ball.y)*ex-(S.D.x-ball.x)*ey;
    const c=controlled, tm=thruMeet(c), mp=meetPoint(c);
    const out={ y:+((T.y-YC)/S.M).toFixed(2), why:CU&&CU.why, bend:CU?+(CU.bend*57.3).toFixed(1):0, side:CU?CU.side:0, away:off>0?-1:1, q:+thruCurlQ().toFixed(2),
      runner:c===S.r, toSpot:tm?+(Math.hypot(tm.x-T.x,tm.y-T.y)/S.M).toFixed(2):null, straightRead:+(Math.hypot(mp.x-T.x,mp.y-T.y)/S.M).toFixed(2) };
    ball.ownedBy=null; ball.thru=null; ball.vx=ball.vy=ball.vz=0; ball.z=0; ball.x=FW/2; ball.y=YC; endCurve(); return out; };
  return 1; })()`);

// THE MAN CLOSING ON IT: D, as far from the spot as gets him there with the ball, a quarter of a second after it, and
// half a second after it
const C = await K(`(()=>{ const S=window.__sc(10), {D}=S, tx=S.X(30), ty=S.Y(-6), tA=0.8, sp=sprintSpeedOf(D), at=late=>{ const dd=25+(tA+late-0.15)*sp; D.x=tx-S.atk*dd; D.y=ty; const c=thruCloser(S.p,tx,ty,tA); return c&&c.o===D?+c.k.toFixed(2):null; };
  return { even:at(0), quarter:at(0.25), half:at(0.5), more:at(0.9) }; })()`);
info('the man closing on it, by when he\'d be there: ' + JSON.stringify(C));
ok(C.even === 1 && Math.abs(C.quarter - 0.5) < 0.02 && C.half === 0 && C.more === 0, 'a race for it with him there by the time it is (1), half one a quarter of a second behind it, none half a second behind it');

// BENT AWAY FROM HIM: your through ball at Curve 1, 5.5 and 10 (struck true), D closing on it -- and with D out of it
const A = {}; for(const cv of [1, 5.5, 10]) A[cv] = await K(`window.__thru(${cv})`);
const F1 = await K(`window.__thru(10,{Du:-20,Dw:-20})`);
info('your through ball, D closing on it: ' + JSON.stringify(A) + '; D out of it: ' + JSON.stringify(F1));
ok(A[10].why === 'away' && A[10].side === A[10].away && A[10].bend === 28.6 && A[5.5].bend === 15.5 && A[1].bend === 2.3, 'bent away from the man closing on it: all the bend the passer has, it being a race (' + A[10].bend + '° at Curve 10, ' + A[5.5].bend + ' at 5.5, ' + A[1].bend + ' at 1)');
ok(A[10].y === A[1].y && A[5.5].y === A[1].y, 'to the same spot whatever his Curve: where the runner\'s run and the drag put it (' + A[10].y + ' m off the middle)');
ok(F1.why !== 'away', 'with nobody closing on it, no bending away (' + F1.why + ')');
ok(A[10].q === 1 && A[5.5].q > 0.5 && A[5.5].q < 0.6 && A[1].q < 0.1, 'it carries its bend: as curling as a through ball can be at Curve 10 (' + A[10].q + '), about half that at 5.5 (' + A[5.5].q + '), hardly at all at 1 (' + A[1].q + ')');

// YOUR MAN, RUN ONTO IT: once it's played he's yours, run onto it with the stick left alone -- to the spot it was
// played to, not where it would come down if it went straight
ok(A[10].runner && A[10].toSpot === 0 && A[10].straightRead > 1, 'your man, run onto your bent through ball, goes to the spot it was played to (a straight read of it is ' + A[10].straightRead + ' m off it)');

// OVER HIS HEAD: one of theirs on its line, half-way along it -- a 10 m through ball is along the grass there, a 20 m one
// is up over his head (lifted as any pass that long): only the first bends round him
const O = await K(`(()=>{ const S=window.__sc(10,{Du:-20,Dw:-20}), {p,r,D}=S, out={};
  for(const m of [10,20]){ const tx=ball.x+S.atk*m*S.M, ty=ball.y, sol=passSolve(m*S.M); D.x=ball.x+S.atk*m*S.M/2; D.y=ball.y+10; r.vx=r.vy=0;
    const cu=passCurl(p,r,tx,ty,false,{vz:sol.vz,vh:sol.vh,tA:m*S.M/sol.vh}), t=m*S.M/2/sol.vh; out[m]={why:cu&&cu.why, zThere:+(sol.vz*t-260*t*t).toFixed(1)}; }
  ball.ownedBy=null; return out; })()`);
info('a man on its line half-way: ' + JSON.stringify(O));
ok(O[10].why === 'round' && O[10].zThere < 12, 'a 10 m through ball, along the grass as it gets to him (' + O[10].zThere + ' px up): bent round him');
ok(O[20].why !== 'round' && O[20].zThere > 12, 'a 20 m one, over his head there (' + O[20].zThere + ' px up): he isn\'t in its way (' + O[20].why + ')');

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

// IN THE SCENES: your through ball to a man breaking in behind a back line of two -- him at an angle, them a few metres
// either side of him, their keeper home, everyone fresh and free to go for it -- the same scenes (the same random draws)
// at Curve 1 and at 10. How many end up yours (one of yours has it before one of theirs does)
const N = 400, mine = {};
for(const cv of [1, 10]){ let g = 0, n = 0;
  for(let k = 0; k < N; k++){
    const out = await page.evaluate(({ k, cv }) => new Promise(res => { const K = window.__K;
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
        Dd[0].x=X(line); Dd[0].y=Y(rw+sd*d1); Dd[1].x=X(line); Dd[1].y=Y(rw-sd*d2); for(const q of Dd){ q.vx=q.vy=0; q.state='normal'; q.noTouchT=0; q.facing={x:-atk,y:0}; q.faceAvg={x:-atk,y:0}; q.stats=Object.assign({},q.stats,{interceptions:6,defIQ:6,speed:6,acceleration:6,tackle:6}); }
        ball.x=p.x+atk*(p.r+ball.r+4); ball.y=p.y; ball.z=0; ball.vx=ball.vy=ball.vz=0; own(p,p.r+ball.r+4);
        thruBall(p,r,{dx:atk,dy:0},false); window.__tr={t0:simNow}; return 1; })()`);
      (function tick(){ const st = K.ev(`(()=>{ const T=window.__tr, b=ball; if(b.ownedBy&&b.ownedBy.team==='G') return 'ours'; if(gkHold||(b.ownedBy&&b.ownedBy.team==='R')) return 'theirs'; if(simNow-T.t0>4||b.x<0||b.x>FW||b.y<0||b.y>FH) return 'else'; return null; })()`);
        if(st) return res(st); setTimeout(tick, 4); })(); }), { k, cv });
    n++; if(out === 'ours') g++; }
  mine[cv] = +(g / n).toFixed(3); }
info('your through balls in the scenes that end up yours: Curve 1 ' + mine[1] + ', Curve 10 ' + mine[10] + ' (' + N + ' each; before v165, 1000 each: 68 in 100 at Curve 1, 63 at 10)');
ok(mine[10] >= mine[1] - 0.03, 'as many end up yours at Curve 10 as at 1, within 3 in 100 (' + mine[10] + ' against ' + mine[1] + ') -- the bend no longer costs you');

await browser.close();
process.exit(rep.finish() ? 1 : 0);
