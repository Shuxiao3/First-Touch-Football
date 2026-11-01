// FOOTBALL CLASSIC, DRIBBLING (v90): on the move, each touch goes on ahead of your man and waits for him -- still his
// ball -- and when he's on it the next touch goes. It's never pulled back to him on a string. How far a touch goes is his
// pace and his Dribbling: a good dribbler's are shorter and even, a poor one's longer and uneven, and at a sprint they're
// knocked on further. Push the stick another way and he goes on to the ball, then takes it the new way; let go and he
// goes on to it and stops with it at his feet. A pass asked for with it out ahead goes when he's on it. One of theirs
// stood in its way takes it -- and ours, who wasn't touched, stays on his feet. The computer's men dribble the same way.
// On a copy of the game that lets the test set the scene: everyone else stood well away, the stick held on the keys.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={players:()=>players, keepers:()=>keepers, ball:()=>ball, controlled:()=>controlled, setControlled, FW, FH, YC, MK, atkOf, simNow:()=>simNow, controlROf, '
  + 'freeze:()=>{ restartT=0; offsideT=0; scoredT=0; gkHold=null; kickT=0; kickBy=null; kickTo=null; restartInfo=null; skill=null; oneTouch=null; ftAim=null; recvAuto=null; matchClock=0; switchLock=null; }};\n  const LAB_TITLE=');
patch('      else{\n        let ai=aiBrain(p,dt);', '      else if(p.__script){ p.__script(p,dt); }\n      else{\n        let ai=aiBrain(p,dt);');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-drib-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show'); await page.click('#exhGo'); await page.waitForTimeout(1200);

// THE SCENE: our midfielder (Pace and Ball control 5.5, Dribbling o.drib) 20 m into our half, going forward at 5.3 m/s
// with the ball at his feet; everyone else stood well away (o.def: one of their defenders stood that many metres on, in
// the ball's way; o.mate: our forward 14 m on and 8 m across; o.ai: he's on the computer, you're someone else). Each
// frame: whose it is, how far it is from him, its pace along his run, his touches (and how far clear of him each got).
const scene = (o) => page.evaluate(o => new Promise(res => { const T = window.__T, MK = T.MK, b = T.ball();
  const me = T.players().find(q => q.team === 'G' && q.role === 'MID'), them = T.players().find(q => q.team === 'R' && q.role === 'DEF');
  const mate = T.players().find(q => q.team === 'G' && q.role === 'ATT');
  T.freeze(); T.setControlled(o.ai ? T.players().find(q => q.team === 'G' && q.role === 'DEF') : me);
  const atk = T.atkOf('G'), x0 = T.FW / 2 - atk * 20 * MK, y0 = T.YC;
  for(const q of T.players()) if(q !== me && !(o.def && q === them) && !(o.mate && q === mate)){
    q.x = T.FW / 2 + (q.team === 'R' ? 0.42 : -0.42) * T.FW; q.y = 40 + 12 * T.players().indexOf(q); q.vx = q.vy = 0; q.__script = p => { p.vx = p.vy = 0; }; }
  for(const k of T.keepers()){ k.x = k.homeX; k.y = T.YC; }
  if(o.mate){ Object.assign(mate, { x: x0 + atk * 14 * MK, y: y0 + 8 * MK, vx: 0, vy: 0, state: 'normal' }); mate.__script = p => { p.vx = p.vy = 0; }; }
  if(o.def){ Object.assign(them, { x: x0 + atk * o.def.x * MK, y: y0 + o.def.y * MK, vx: 0, vy: 0, state: 'normal', noTouchT: 0, tackleCd: 0, facing: { x: -atk, y: 0 } });
    let in_ = false;                                                     // (o.def.into: stood well off, then -- the touch out ahead of our man and
    them.__script = (p, dt) => { p.vx = p.vy = 0;                        //  out of his reach -- in its way, a metre on from it)
      if(o.def.into && !in_ && b.ownedBy === me && Math.hypot(b.x - me.x, b.y - me.y) > T.controlROf(me) + b.r + 4 + 0.3 * MK){ in_ = true;
        const sp = Math.hypot(b.vx, b.vy) || 1; p.x = b.x + b.vx / sp * 1.0 * MK; p.y = b.y + b.vy / sp * 1.0 * MK; p.facing = { x: -b.vx / sp, y: -b.vy / sp }; } }; }
  me.__script = null; me.stats = Object.assign({}, me.stats, { dribbling: o.drib, speed: 5.5, ballControl: 5.5 });
  Object.assign(me, { x: x0, y: y0, vx: atk * 120, vy: 0, state: 'normal', noTouchT: 0, sprint: false, facing: { x: atk, y: 0 }, stamina: 1, staminaCap: 1, ob: null, takeOn: null });
  Object.assign(b, { ownedBy: me, x: x0 + atk * 24, y: y0, z: 0, vx: atk * 120, vy: 0, vz: 0, shotT: 0, crossT: 0, intendedRcv: null, thru: null, lastTouch: 'G', dribbler: null, dribbleGrace: 0, passerRef: null });
  const reach = T.controlROf(me) + b.r + 4, t0 = T.simNow();
  let frames = 0, owned = 0, maxGap = 0, back = 1e9, prev = 'me', prevGap = 0, ev = [], last = me.touchAt, lead = 0, touches = [], plans = [];
  (function tick(){ const t = T.simNow() - t0; frames++; if(o.sprint) me.sprint = true;
    const g = Math.hypot(b.x - me.x, b.y - me.y), own = b.ownedBy === me ? 'me' : b.ownedBy ? b.ownedBy.team : 'none';
    if(own === 'me'){ owned++; maxGap = Math.max(maxGap, g); }
    if(own !== prev){ ev.push({ t: +t.toFixed(2), own, gapBefore: +(prevGap / MK).toFixed(2), reach: +(reach / MK).toFixed(2), state: me.state }); prev = own;
      if(o.mate && own === 'none') mate.__script = null; }                // (the pass struck: he goes to meet it, as he would)
    const sp = Math.hypot(me.vx, me.vy); if(o.along && own === 'me' && t > 0.3 && sp > 30) back = Math.min(back, (b.vx * me.vx + b.vy * me.vy) / sp);
    if(me.touchAt !== last && me.touchAt != null){ if(last != null) touches.push({ t: +t.toFixed(2), lead: +(lead / MK).toFixed(2) }); last = me.touchAt; lead = 0;
      plans.push((me.touchLead - me.r - b.r) / MK); }                       // (how far the touch was meant to get ahead of him)
    lead = Math.max(lead, g - me.r - b.r); prevGap = g;
    if(t < o.secs) return requestAnimationFrame(tick);
    for(const q of T.players()) q.__script = null;
    const L = touches.slice(1).map(x => x.lead), m = L.reduce((a, x) => a + x, 0) / (L.length || 1), sd = Math.sqrt(L.reduce((a, x) => a + (x - m) ** 2, 0) / (L.length || 1));
    const gaps = touches.slice(1).map((x, i) => x.t - touches[i].t), P = plans.slice(2), pm = P.reduce((a, x) => a + x, 0) / (P.length || 1), psd = Math.sqrt(P.reduce((a, x) => a + (x - pm) ** 2, 0) / (P.length || 1));
    res({ ownedPct: +(100 * owned / frames).toFixed(1), maxGap: +(maxGap / MK).toFixed(2), back: +(back / MK).toFixed(2), ev, n: touches.length, lead: +m.toFixed(2), sd: +sd.toFixed(2), plan: +pm.toFixed(2), planSd: +psd.toFixed(2), plans: P.length,
      every: gaps.length ? +(gaps.reduce((a, x) => a + x, 0) / gaps.length).toFixed(2) : null, state: me.state,
      end: { gap: +(Math.hypot(b.x - me.x, b.y - me.y) / MK).toFixed(2), reach: +(reach / MK).toFixed(2), sp: +(Math.hypot(me.vx, me.vy) / MK).toFixed(2), bsp: +(Math.hypot(b.vx, b.vy) / MK).toFixed(2),
        bdir: [+(b.vx * atk / MK).toFixed(2), +(b.vy / MK).toFixed(2)], me: [+((me.x - x0) * atk / MK).toFixed(1), +((me.y - y0) / MK).toFixed(1)], mateHas: !!(o.mate && b.ownedBy === mate) } }); })(); }), o);
const fwd = await page.evaluate(() => window.__T.atkOf('G') > 0 ? 'KeyD' : 'KeyA'), bwd = fwd === 'KeyD' ? 'KeyA' : 'KeyD';
const play = async (o, steps) => { const p = scene(o); for(const [ms, act] of steps){ await page.waitForTimeout(ms); await act(); } const r = await p; for(const k of ['KeyD', 'KeyA', 'KeyS', 'KeyW', 'ShiftLeft', 'KeyJ']) await page.keyboard.up(k); await page.waitForTimeout(150); return r; };
const down = k => () => page.keyboard.down(k), up = k => () => page.keyboard.up(k);

// 1. RUNNING WITH IT, the stick held forward: the ball his throughout, never rolling back to him, a touch every so often
const run = await play({ drib: 5.5, secs: 4, along: true }, [[0, down(fwd)]]);
info('running with it (Dribbling 5.5): ' + JSON.stringify(run));
ok(run.ownedPct === 100 && run.back > 1 && run.n >= 4 && run.every > 0.5 && run.every < 1.2 && run.maxGap > 1.5,
  'running with it, each touch goes on ahead (up to ' + run.lead + ' m clear of him) and waits for him: his ball throughout, a touch every ' + run.every + ' s, and never pulled back to him (it\'s always going on at ' + run.back + ' m/s or more)');

// 2. DRIBBLING SETS THE TOUCH: 10 against 1, eight seconds each -- how far each got clear of him, and how far each was
// meant to (its spread)
const d10 = await play({ drib: 10, secs: 8 }, [[0, down(fwd)]]), d1 = await play({ drib: 1, secs: 8 }, [[0, down(fwd)]]);
info('Dribbling 10: ' + JSON.stringify({ lead: d10.lead, sd: d10.sd, plan: d10.plan, planSd: d10.planSd, n: d10.plans }) + '; Dribbling 1: ' + JSON.stringify({ lead: d1.lead, sd: d1.sd, plan: d1.plan, planSd: d1.planSd, n: d1.plans }));
ok(d10.lead < d1.lead && d10.plan < d1.plan && d10.planSd < 0.1 && d1.planSd > d10.planSd * 2 && d10.ownedPct === 100 && d1.ownedPct === 100,
  'Dribbling sets the touch: at 10 shorter and even (up to ' + d10.lead + ' m clear of him, each meant ' + d10.plan + ' ± ' + d10.planSd + ' m), at 1 longer and uneven (' + d1.lead + ' m, ' + d1.plan + ' ± ' + d1.planSd + ' m)');

// 3. AT A SPRINT it's knocked on further
const spr = await play({ drib: 5.5, secs: 4, sprint: true }, [[0, down(fwd)], [0, down('ShiftLeft')]]);
info('at a sprint: ' + JSON.stringify({ lead: spr.lead, n: spr.n, every: spr.every, owned: spr.ownedPct }));
ok(spr.lead > run.lead * 1.5 && spr.ownedPct === 100, 'at a sprint it\'s knocked on further (up to ' + spr.lead + ' m clear of him, against ' + run.lead + ' running) -- and still his');

// 4. TURNING: the stick pushed 90 degrees off after 1.2 s -- he goes on to it, then takes it the new way
const turn = await play({ drib: 5.5, secs: 2.9 }, [[0, down(fwd)], [1200, up(fwd)], [0, down('KeyS')]]);
info('the stick pushed 90° off: ' + JSON.stringify(turn.end) + ', his throughout: ' + turn.ownedPct + '%');
ok(turn.ownedPct === 100 && turn.end.bdir[1] > Math.abs(turn.end.bdir[0]) && turn.end.me[1] > 1,
  'pushing the stick 90° off, he goes on to the ball and takes it the new way (going ' + turn.end.bdir.join(', ') + ' m/s at the end, him ' + turn.end.me[1] + ' m across) -- his throughout');

// 5. LETTING GO: he goes on to it and stops with it at his feet
const rel = await play({ drib: 5.5, secs: 2.6 }, [[0, down(fwd)], [1100, up(fwd)]]);
info('the stick let go after 1.1 s: ' + JSON.stringify(rel.end) + ', his throughout: ' + rel.ownedPct + '%');
ok(rel.ownedPct === 100 && rel.end.gap <= rel.end.reach && rel.end.sp < 0.3 && rel.end.bsp < 0.3,
  'letting go of the stick, he goes on to it and stops with it at his feet (' + rel.end.gap + ' m off him, his reach ' + rel.end.reach + ' m) -- his throughout');

// 6. A PASS ASKED FOR WITH IT OUT AHEAD (J tapped half a second in): it goes when he's on it, and finds the man (stood
// still till it's struck, then meeting it)
const pass = await play({ drib: 5.5, secs: 2.6, mate: true }, [[0, down(fwd)], [520, down('KeyJ')], [60, up('KeyJ')], [1300, up(fwd)]]);
const kick = pass.ev.find(e => e.own !== 'me');
info('J tapped with it out ahead: ' + JSON.stringify(pass.ev) + ', ' + JSON.stringify(pass.end));
ok(!!kick && kick.gapBefore <= kick.reach + 0.05 && pass.ev.some(e => e.own === 'G'), 'a pass asked for with it out ahead goes when he\'s on it (struck ' + (kick && kick.gapBefore) + ' m off him, his reach ' + (kick && kick.reach) + ' m, at ' + (kick && kick.t) + ' s) and finds the man');

// 7. ONE OF THEIRS WHO GETS TO A TOUCH OUT AHEAD OF OUR MAN (stood well off; once it's out of our man's reach, put in its
// way, a metre on from it): he takes it -- and ours, never touched, stays on his feet. And running with it straight at one
// stood in his way (6 m on), it's at our man's feet as he gets to him: a tackle, if it comes, is at his feet.
const def = await play({ drib: 5.5, secs: 2, def: { x: 30, y: 12, into: true } }, [[0, down(fwd)]]);
const took = def.ev.find(e => e.own === 'R');
info('one of theirs in the way of a touch out ahead: ' + JSON.stringify(def.ev));
ok(!!took && took.gapBefore > took.reach && took.state === 'normal', 'one of theirs who gets to a touch out ahead of our man takes it (' + (took && took.gapBefore) + ' m off him), and ours stays on his feet');
const close = await play({ drib: 5.5, secs: 2, def: { x: 6, y: 0 } }, [[0, down(fwd)]]);
const lost = close.ev.find(e => e.own !== 'me');
info('running with it straight at one stood 6 m on: ' + JSON.stringify(close.ev));
ok(!lost || lost.gapBefore <= lost.reach, 'running with it straight at one of theirs stood in his way, it\'s at his feet as he gets to him (' + (lost ? 'lost ' + lost.gapBefore + ' m off him, within his reach of ' + lost.reach + ' m' : 'kept') + ')');

// 8. THE COMPUTER'S MAN dribbles the same way: his throughout, touches out ahead, never pulled back
const ai = await play({ drib: 5.5, secs: 4, ai: true, along: true }, []);
info('our midfielder on the computer: ' + JSON.stringify({ owned: ai.ownedPct, maxGap: ai.maxGap, back: ai.back, n: ai.n }));
ok(ai.ownedPct === 100 && ai.maxGap > 1.5 && ai.back > 1 && ai.n >= 3, 'the computer\'s men dribble the same way: touches out ahead (' + ai.maxGap + ' m from him at the most), his throughout, never pulled back');

process.exitCode = rep.finish();
await browser.close();
