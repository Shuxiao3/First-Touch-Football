// FOOTBALL CLASSIC, NO LOFTED PASSES (v167); NO BACKSPIN (v169). There's no lofted pass any more -- no double-tap of PASS
// to put it in the air, so a tap of PASS goes at once (it used to wait in case a second tap was coming), and the computer
// never lofts one (no lofted switch of play, no chip over a man in the way). And no backspin (v169): a long pass runs on
// through its bounce as any pass does, whatever his Long passing -- the same pace through it at Long passing 1, 5.5 and
// 10, the same way on, your through ball the same. (v167 to v168 a long one checked up where it landed: through the
// bounce it kept 60% of its pace at Long passing 10, all of it at 1.)
// On a copy of the game that lets the test reach inside, its frames pumped (no vsync).
import { open, startExhibition } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  // ===== END MANAGER CAREER', '  window.__K={ ev:s=>eval(s) };\n  // ===== END MANAGER CAREER');
patch('  function checkOffsideTouch(t){\n', '  function checkOffsideTouch(t){\n    if(window.__noOffside) return false;\n');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-bspin-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ fastFrames: true, url: 'file://' + copy });
const { ok, info } = rep;
await page.evaluate(() => { window.__noOffside = true; });
await startExhibition(page); await page.waitForTimeout(800);
const K = s => page.evaluate(s => window.__K.ev(s), s);

// THE SCENE: G attacking; the passer 20 m into our own half with the ball at his feet, facing up the pitch; the man it's
// for `m` metres on, standing; everyone else parked out of the way by the far touchline, the keepers at home
await K(`(()=>{ window.__sc=(m,lp,o)=>{ o=o||{}; restartT=0; offsideT=0; scoredT=0; kickT=0; gkHold=null; breakT=0; const M=MK, atk=atkOf('G'), X=u=>FW/2+atk*u*M, Y=w=>YC+w*M;
  const p=controlled&&controlled.team==='G'&&!controlled.isGK&&controlled.role==='MID'?controlled:players.find(q=>q.team==='G'&&q.role==='MID'); if(controlled!==p) switchTo(p);
  const q=players.find(x=>x.team==='G'&&x!==p&&!x.isGK&&x.role==='ATT')||players.find(x=>x.team==='G'&&x!==p&&!x.isGK);
  let i=0; for(const x of players) if(x!==p&&x!==q){ x.x=X(-30+i*4); x.y=Y(-33); x.vx=x.vy=0; x.state='normal'; i++; }
  for(const k of keepers){ k.x=k.homeX; k.y=YC; k.vx=k.vy=0; }
  p.x=X(-20); p.y=Y(0); p.vx=p.vy=0; p.state='normal'; p.facing={x:atk,y:0}; p.faceAvg={x:atk,y:0}; p.stats=Object.assign({},p.stats,{longPass:lp,passAcc:10,offIQ:10,composure:10});
  q.x=X(-20+m); q.y=Y(0); q.vx=q.vy=0; q.state='normal'; q.runTarget=null; q.facing={x:-atk,y:0}; q.faceAvg={x:-atk,y:0};
  ball.ownedBy=null; ball.x=p.x+atk*(p.r+ball.r+4); ball.y=p.y; ball.z=0; ball.vx=ball.vy=ball.vz=0; ball.lob=null; own(p,p.r+ball.r+4);
  return {p,q,atk,X,Y,M}; };
  window.__park=S=>{ for(const x of players.concat(keepers)){ x.x=S.X(-40); x.y=S.Y(-33); x.vx=x.vy=0; } ball.intendedRcv=null; recvAuto=null; };
  return 1; })()`);

// A TAP OF PASS goes at once; two taps are just a pass, along the ground as any pass this long goes
const tap = await K(`(()=>{ const S=window.__sc(15,8); window.__key=(t,c)=>window.dispatchEvent(new KeyboardEvent(t,{code:c,key:c.slice(-1).toLowerCase()}));
  const sol=passSolve(Math.hypot(S.q.x+S.atk*40-ball.x,S.q.y-ball.y)); window.__key('keydown','KeyJ'); window.__key('keyup','KeyJ');   // (a pass from PASS goes a touch ahead of him)
  return { gone:!ball.ownedBy, to:controlled===S.q, vz:Math.round(ball.vz), want:Math.round(sol.vz), pend:passPend, loft:passLoft,
    lofted:typeof obLobBall!=='undefined'||typeof obLobFlight!=='undefined'||typeof passFlush!=='undefined' }; })()`);
await page.waitForTimeout(40);
Object.assign(tap, await K(`(()=>{ const z0=ball.z, v0=ball.vz; window.__key('keydown','KeyJ'); window.__key('keyup','KeyJ'); const o={ second:Math.round(ball.vz), before:Math.round(v0), up:ball.z>0||z0>0 };
  ball.ownedBy=null; ball.lob=null; ball.vx=ball.vy=ball.vz=0; ball.z=0; ball.x=FW/2; ball.y=YC; return o; })()`));
info('a tap of PASS, and a second straight after: ' + JSON.stringify(tap));
ok(tap.gone && tap.to && tap.pend === null && tap.loft === false, 'a tap of PASS goes at once, to the man you\'re steering at -- no wait for a second tap (it waited 150 ms)');
ok(Math.abs(tap.vz - tap.want) <= 1 && tap.second <= tap.before && tap.second < tap.vz, 'two taps are just a pass, struck as low as any pass that long (' + tap.vz + ' px/s up, as one is struck: ' + tap.want + '), and a second tap doesn\'t put it up in the air');
ok(!tap.lofted, 'no lofted pass left in the game: no lofted switch of play for the computer, nothing holding a tap back');

// A 33 M PASS, struck true, everyone out of its way once it's gone: where it lands, how far it runs on, how quick it is
// through the bounce and when it gets to where it was for -- at Long passing 1, 5.5 and 10
const fly = (lp, k, turn) => page.evaluate(({ lp, k, turn }) => new Promise(res => { const K = window.__K;
  K.ev(`(()=>{ const S=window.__sc(34,${lp}), R=Math.random; Math.random=()=>0.5; try{ passTo(S.p,S.q); } finally { Math.random=R; }
    if(${k}!==null&&ball.lob) ball.lob.k=${k};
    const L=ball.lob?Object.assign({},ball.lob):null, read=ballAt(6); ball.lob=null; const flat=ballAt(6); ball.lob=L;
    window.__f={ S, x0:ball.x, y0:ball.y, T:{x:S.q.x,y:S.q.y}, t0:simNow, k:L&&L.k, read, flat, land:null, pre:0, post:0, atT:null, last:null, turned:false };
    window.__park(S); return 1; })()`);
  (function tick(){ const o = K.ev(`(()=>{ const F=window.__f, b=ball, sp=Math.hypot(b.vx,b.vy), t=simNow-F.t0; window.__park(F.S);
      if(${turn}&&!F.turned&&t>=0.5){ const c=Math.cos(0.7), s=Math.sin(0.7), vx=b.vx; b.vx=vx*c-b.vy*s; b.vy=vx*s+b.vy*c; F.turned=true; }   // (a touch on the way that turns it 40 degrees)
      if(!F.land&&F.last&&F.last.z>0&&b.z<=0) { F.land={x:b.x,y:b.y,t}; F.pre=F.last.sp; F.post=sp; }
      const dx=F.T.x-F.x0, dy=F.T.y-F.y0, d=Math.hypot(dx,dy); if(F.atT===null&&(b.x-F.x0)*dx/d+(b.y-F.y0)*dy/d>=d) F.atT=sp;
      F.last={z:b.z, sp}; return sp<5||t>7; })()`);
    if(o) return res(K.ev(`(()=>{ const F=window.__f, M=MK, L=F.land||{x:ball.x,y:ball.y};
      return { keep:F.k==null?1:+F.k.toFixed(2), landM:+(Math.hypot(L.x-F.x0,L.y-F.y0)/M).toFixed(1), restM:+(Math.hypot(ball.x-F.x0,ball.y-F.y0)/M).toFixed(1), runOn:+(Math.hypot(ball.x-L.x,ball.y-L.y)/M).toFixed(1),
        through:+(F.post/(F.pre||1)).toFixed(2), atMan:F.atT==null?null:Math.round(F.atT/M*10)/10,
        readErr:+(Math.hypot(ball.x-F.read.x,ball.y-F.read.y)/M).toFixed(1), flatErr:+(Math.hypot(ball.x-F.flat.x,ball.y-F.flat.y)/M).toFixed(1) }; })()`));
    requestAnimationFrame(tick); })(); }), { lp, k, turn });
const F1 = await fly(1, null, false), F5 = await fly(5.5, null, false), F10 = await fly(10, null, false);
info('a 33 m pass at Long passing 1: ' + JSON.stringify(F1) + '; 5.5: ' + JSON.stringify(F5) + '; 10: ' + JSON.stringify(F10));
const rel = F => +(F.through / F1.through).toFixed(2);   // (the grass takes its bit of each that frame: against Long passing 1's)
ok(F1.keep === 1 && F5.keep === 1 && F10.keep === 1 && Math.abs(rel(F10) - 1) < 0.03 && Math.abs(rel(F5) - 1) < 0.03, 'no backspin: through the bounce it keeps as much of its pace at Long passing 10 (' + rel(F10) + ') and 5.5 (' + rel(F5) + ') as at 1 (v167-v168: 60% and 80%)');
ok(Math.abs(F10.restM - F1.restM) < 1 && Math.abs(F5.restM - F1.restM) < 1 && F10.restM > F10.landM + 2, '...so it runs on as far whatever his Long passing: it stops ' + F1.restM + ' m on at 1, ' + F5.restM + ' at 5.5, ' + F10.restM + ' at 10 (landing ' + F10.landM + ' m on)');
ok(F10.atMan !== null && F1.atMan !== null && Math.abs(F10.atMan - F1.atMan) < 0.5, '...and comes to the man it was for as quick: ' + F10.atMan + ' m/s at Long passing 10, ' + F1.atMan + ' at 1');

// YOUR THROUGH BALL, 25 m, at Long passing 10: no check on it either
const th = await K(`(()=>{ const S=window.__sc(18,10), R=Math.random; Math.random=()=>0.5; let o; S.q.vx=S.atk*7*MK;
  try{ thruBall(S.p,S.q,{dx:S.atk,dy:0},false); const d=Math.hypot(ball.thru.x-ball.x,ball.thru.y-ball.y); o={ m:+(d/MK).toFixed(1), k:ball.lob&&ball.lob.k!=null?+ball.lob.k.toFixed(2):1 }; } finally { Math.random=R; }
  ball.ownedBy=null; ball.thru=null; ball.lob=null; ball.vx=ball.vy=ball.vz=0; ball.z=0; ball.x=FW/2; ball.y=YC; endCurve(); ball.arcK=0; return o; })()`);
info('your through ball at Long passing 10: ' + JSON.stringify(th));
ok(th.k === 1, 'your through ball doesn\'t check up either: a ' + th.m + ' m one at Long passing 10 keeps all its pace through the bounce');

// THE COMPUTER: with a man of his free out on the far side, and one of theirs in the way of a long ball to his feet --
// along the ground, every time: no lofted switch, no chip
const cp = await K(`(()=>{ const S=window.__sc(34,10), {p,q,atk,X,Y}=S, o=players.find(x=>x.team==='R'), far=players.find(x=>x.team==='G'&&x!==p&&x!==q&&!x.isGK);
  far.x=X(-12); far.y=Y(24); far.vx=far.vy=0; o.x=X(-5); o.y=Y(0.4); o.vx=o.vy=0;
  const C=obCtx(p,atk,atk>0?FW:0), opts=[q,far].map(m=>obPassOpt(p,m,C)).filter(Boolean);
  const R=Math.random; Math.random=()=>0.5; let vz=0, want=0; try{ want=passSolve(Math.hypot(q.x-ball.x,q.y-ball.y)).vz; passTo(p,q); vz=ball.vz; } finally { Math.random=R; }
  ball.ownedBy=null; ball.lob=null; ball.vx=ball.vy=ball.vz=0; ball.z=0; ball.x=FW/2; ball.y=YC; return { opts:opts.map(x=>({lob:x.lob, d:Math.round(x.d/MK)})), vz:Math.round(vz), want:Math.round(want) }; })()`);
info('the computer: ' + JSON.stringify(cp));
ok(cp.opts.length > 0 && cp.opts.every(x => x.lob === false), 'the computer\'s balls out to the far side are along the ground: no lofted switch (' + cp.opts.map(x => x.d + ' m').join(', ') + ')');
ok(Math.abs(cp.vz - cp.want) <= 1, 'with one of theirs in the way of a long ball to his feet: struck as any pass that long, not chipped over him (' + cp.vz + ' px/s up)');

await browser.close();
process.exit(rep.finish() ? 1 : 0);
