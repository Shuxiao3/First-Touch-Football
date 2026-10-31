// FOOTBALL CLASSIC, THE SHAPE (as coached from the coaching page): on the keeper's ball the back line splits to the corners
// of the box, the pivot stands off it and the midfielders and wide men are up the pitch (not all inside our third), and
// the computer's keeper gives them a moment to get there before he plays it;
// building from the back the centre-backs split wide and the wingers stay up near halfway (not down in our third to
// offer themselves); a man supporting the man on the ball is never on top of him; the defending midfield's far wide man
// stays near a man of theirs left free out wide (and none of its wide men goes wider than the widest of theirs), and
// with nobody out there it tucks in; out wide in their third the wide man on the ball's flank goes past the man on it
// on the outside, not at him, and with the box short of men one central midfielder -- not both -- gets in it; a man of
// theirs between the lines, the midfield keeps its line and stands in the pass into him; a centre-back who picks up a
// runner going in behind holds his line a beat before he goes with him. The
// plan's and the block's spots read straight off a scene set up in a match. On a copy of the game that lets the test
// set the scene.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={players:()=>players, keepers:()=>keepers, ball:()=>ball, FW, FH, YC, MK, PA_HW, atkOf, posOf, own, holderOf, teamPlan, PLAN:()=>PLAN, mkPlanState, '
  + 'blockSpot, playEye:()=>playEye, ballEye:()=>ballEye, EXH, simNow:()=>simNow, gkHold:()=>gkHold, setStyle, '
  + 'reset:()=>{ restartT=0; offsideT=0; scoredT=0; gkHold=null; skill=null; for(const t of ["G","R"]){ PLAN[t]=mkPlanState(); playEye[t].t=-9; ballEye[t].t=-9; } '
  + 'for(const c of [blockCache,endsCache,markCache,swarmCache]){ c.G=null; c.R=null; } for(const t of ["G","R"]){ Object.assign(pressSt[t],{until:-9,cd:-9,t:-1,on:false,swarm:-9}); transitionT[t]=0; } for(const q of players) q.runSeen=null; simNow+=0.5; }, '
  + 'adv:dt=>{ simNow+=dt; for(const c of [blockCache,endsCache,markCache,swarmCache]){ c.G=null; c.R=null; } }, '
  + 'setGk:k=>{ gkHold=k; ball.ownedBy=null; ball.x=k.x; ball.y=k.y; ball.z=6; ball.vx=ball.vy=ball.vz=0; }};\n  const LAB_TITLE=');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-shape-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
// Liverpool (2-2-3 with the ball, 2-4-1 without) v Manchester City (3-1-3 / 3-3-1), both BALANCED (not their clubs' own
// ways, GEGENPRESS and CONTROL POSSESSION: the shape as coached is the balanced one), nothing else changed
await page.evaluate(() => { const T = window.__T; T.EXH.you = 'LIV'; T.EXH.opp = 'MCI'; localStorage.removeItem('ft_clubsq'); });
await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show'); await page.click('#exhGo'); await page.waitForTimeout(1500);
await page.evaluate(() => { const T = window.__T; T.setStyle('G', 'neutral'); T.setStyle('R', 'neutral'); });
await page.evaluate(() => { const T = window.__T, M = T.MK;
  // a scene: every outfield man at (u m from his own goal, w m across: + toward y=FH), the rest where they stand
  window.__at = (q, u, w) => { const a = T.atkOf(q.team); q.x = a > 0 ? u * M : T.FW - u * M; q.y = T.YC + w * M; q.vx = q.vy = 0; q.seenVx = q.seenVy = 0; q.state = 'normal'; q.runTarget = null; q.runCd = 0; q.gapRun = 0; };   // (still: and read as still -- seenVx -- not as he was moving in the frames before)
  window.__uw = (team, x, y) => { const a = T.atkOf(team); return [(a > 0 ? x : T.FW - x) / M, (y - T.YC) / M]; };
  window.__men = team => T.players().filter(q => q.team === team && !q.benched);
  window.__pos = (q, ph) => T.posOf(q, ph);
  // the plan's jobs for the side on the ball, as [name, job, u, w]
  window.__plan = team => { const S = T.teamPlan(team, 1 / 60), out = [];
    for(const [q, a] of S.jobs) out.push({ q: q.pname || q.name, pos: T.posOf(q, 'atk'), job: a.job, u: +window.__uw(team, a.x, a.y)[0].toFixed(1), w: +window.__uw(team, a.x, a.y)[1].toFixed(1) });
    return out; };
  window.__give = (q, u, w) => { const B = T.ball(); window.__at(q, u, w); const a = T.atkOf(q.team); q.facing = { x: a, y: 0 }; B.x = q.x + a * 14; B.y = q.y; B.z = 0; B.vx = B.vy = B.vz = 0; T.own(q, 14, true); };   // (facing up the pitch)
  // both sides at their home spots: the side on the ball in its attacking shape (pushed up to the ball), the other in its block
  window.__home = (team, uShift) => { for(const q of window.__men(team)){ const s = q.slotAtk || q, [u, w] = window.__uw(team, s.homeX, s.homeY); window.__at(q, Math.max(4, u + uShift), w); } };
  window.__homeDef = team => { for(const q of window.__men(team)){ const s = q.slotDef || q, [u, w] = window.__uw(team, s.homeX, s.homeY); window.__at(q, u, w); } }; });

// --- THE KEEPER'S BALL (City's): the back three at the corners of the box, the pivot well off it, the wingers up ---
const kp = await page.evaluate(() => { const T = window.__T; T.reset(); window.__home('R', -20); window.__homeDef('G');
  const k = T.keepers().find(q => q.team === 'R'); window.__at(k, 2, 0); T.setGk(k); return window.__plan('R'); });
info('City on its keeper\'s ball: ' + kp.map(j => `${j.q} ${j.pos} ${j.job} ${j.u},${j.w}`).join(' | '));
const kpCB = kp.filter(j => j.pos === 'CB'), kpW = kp.filter(j => j.pos === 'W'), kpPiv = kp.find(j => j.pos === 'CM');
ok(kpCB.length === 3 && Math.max(...kpCB.map(j => Math.abs(j.w))) >= 19 && Math.min(...kpCB.map(j => j.w)) <= -19 && kpCB.every(j => j.u < 20.5),
  `the back three split to the corners of the box (${kpCB.map(j => j.w).join(', ')} m across, ${kpCB.map(j => j.u).join(', ')} m out)`);
ok(kpPiv && kpPiv.u >= 29, `the pivot stands off them, ${kpPiv && kpPiv.u} m out (it was 28)`);
ok(kpW.length === 2 && kpW.every(j => j.u >= 43), `both wingers up near halfway (${kpW.map(j => j.u).join(', ')} m out; they were ~32)`);
const kpL = await page.evaluate(() => { const T = window.__T; T.reset(); window.__home('G', -20); window.__homeDef('R');
  const k = T.keepers().find(q => q.team === 'G'); window.__at(k, 2, 0); T.setGk(k); return window.__plan('G'); });
const kpIn = kpL.filter(j => j.pos === 'CM' && j.job === 'INSIDE');
ok(kpIn.length === 1 && kpIn[0].u >= 38, `Liverpool on theirs: the other central midfielder up between their lines, ${kpIn[0] && kpIn[0].u} m out (it was ~35)`);

// --- BUILDING FROM THE BACK: City's right centre-back on it 11 m out, out wide --------------------------------------
const bu = await page.evaluate(() => { const T = window.__T; T.reset(); window.__home('R', -25); window.__homeDef('G');
  const cbs = window.__men('R').filter(q => window.__pos(q, 'atk') === 'CB').sort((a, b) => b.slotAtk.homeY - a.slotAtk.homeY);
  const c = T.atkOf('R') > 0 ? cbs[0] : cbs[cbs.length - 1];                      // (whichever is on the + side, attacking)
  const [, wc] = window.__uw('R', c.slotAtk.homeX, c.slotAtk.homeY); window.__give(c, 11, Math.sign(wc || 1) * 20);
  return { c: c.pname || c.name, wc: Math.sign(wc || 1) * 20, jobs: window.__plan('R') }; });
info('City building from the back (' + bu.c + ' on it): ' + bu.jobs.map(j => `${j.q} ${j.pos} ${j.job} ${j.u},${j.w}`).join(' | '));
const buCB = bu.jobs.filter(j => j.pos === 'CB'), farCB = buCB.sort((a, b) => Math.sign(bu.wc) * (a.w - b.w))[0];
ok(farCB && Math.sign(bu.wc) * farCB.w <= -15, `the far centre-back splits wide, ${farCB && farCB.w} m across (the man on it at ${bu.wc}; it was ~-10)`);
const buW = bu.jobs.filter(j => j.pos === 'W');
ok(buW.length === 2 && buW.every(j => j.u >= 30) && buW.some(j => j.job === 'WIDTH' && j.u >= 43),
  `neither winger comes back into our third, one holding near halfway (${buW.map(j => j.job + ' ' + j.u).join(', ')} m out)`);

// --- SUPPORT: room around him -- City's midfielder on it in midfield, a man on him ---------------------------------
const su = await page.evaluate(() => { const T = window.__T; T.reset(); window.__home('R', 15); window.__homeDef('G');
  const c = window.__men('R').find(q => window.__pos(q, 'atk') === 'CM'); window.__give(c, 45, 5);
  const d = window.__men('G').filter(q => window.__pos(q, 'def') === 'CM')[0]; window.__at(d, 99.75 - 49, 5);   // (one of theirs 4 m off him)
  T.PLAN().R.t = -1; const jobs = window.__plan('R'), cx = c.x, cy = c.y;
  return jobs.filter(j => j.job === 'SUPPORT').map(j => { const a = T.atkOf('R'), x = a > 0 ? j.u * T.MK : T.FW - j.u * T.MK, y = T.YC + j.w * T.MK; return +(Math.hypot(x - cx, y - cy) / T.MK).toFixed(1); }); });
ok(su.length >= 2 && su.every(r => r >= 10.5), `the men supporting him give him room: 11 m off him or more (${su.join(', ')} m)`);

// --- THE BLOCK: Liverpool's midfield four, City on it in midfield on one flank, their far winger left free ---------
const bl = await page.evaluate(() => { const T = window.__T; T.reset(); window.__home('R', 15); window.__homeDef('G');
  const R = window.__men('R'), c = R.find(q => window.__pos(q, 'atk') === 'CM'), ws = R.filter(q => window.__pos(q, 'atk') === 'W');
  window.__give(c, 42, 16);
  // a winger high on the ball's flank, the other high and wide on the far one, nobody of Liverpool's back line near him
  window.__at(ws[0], 55, 27); window.__at(ws[1], 55, -28);
  const mids = window.__men('G').filter(q => q.slotDef && q.slotDef.role === 'MID'), out = [];
  for(const q of mids){ const s = T.blockSpot(q), [u, w] = window.__uw('R', s.x, s.y); out.push({ q: q.pname || q.name, pos: window.__pos(q, 'def'), u: +u.toFixed(1), w: +w.toFixed(1) }); }
  return out; });
info('Liverpool\'s midfield four (in City\'s metres): ' + bl.map(j => `${j.q} ${j.pos} ${j.u},${j.w}`).join(' | '));
const blFar = bl.reduce((a, b) => b.w < a.w ? b : a), blNear = bl.reduce((a, b) => b.w > a.w ? b : a);
ok(blFar.w <= -17, `the far wide man stays within ~10 m of their free winger (at ${blFar.w}, the winger at -28; it was ~-12)`);
ok(blNear.w <= 25.5, `the near one no wider than the widest of theirs out there, a stride inside him (${blNear.w}, theirs at 27)`);
ok(Math.max(...bl.map(j => j.u)) - Math.min(...bl.map(j => j.u)) < 2.5, `the four in a line (${bl.map(j => j.u).join(', ')} m)`);
const bl2 = await page.evaluate(() => { const T = window.__T; T.reset(); window.__home('R', 15); window.__homeDef('G');
  const R = window.__men('R'), c = R.find(q => window.__pos(q, 'atk') === 'CM'); window.__give(c, 42, 4);
  R.filter(q => q !== c).forEach((q, i) => { if(window.__uw('R', q.x, q.y)[1] < 4) window.__at(q, window.__uw('R', q.x, q.y)[0], 4 + (i % 4) * 2); });   // (nobody of theirs out on the far side)
  const mids = window.__men('G').filter(q => q.slotDef && q.slotDef.role === 'MID');
  return Math.min(...mids.map(q => { const s = T.blockSpot(q); return window.__uw('R', s.x, s.y)[1]; })); });
ok(bl2 >= -15.5, `with nobody of theirs out on the far side, the far wide man tucks in (${bl2.toFixed(1)} m across; it was ~-20)`);
// their forward standing just in front of our back line, between the lines: the midfielder nearest him stays in the line
// (a couple of yards' drop at most) and stands in the pass from the ball into him, not in front of him
const bl3 = await page.evaluate(() => { const T = window.__T; T.reset(); window.__home('R', 15); window.__homeDef('G');
  const R = window.__men('R'), c = R.find(q => window.__pos(q, 'atk') === 'CM'), st = R.find(q => window.__pos(q, 'atk') === 'ST');
  window.__give(c, 42, 16); window.__at(st, 64, 4);
  const mids = window.__men('G').filter(q => q.slotDef && q.slotDef.role === 'MID');
  for(let k = 0; k < 3; k++){ for(const q of window.__men('G')){ const s = T.blockSpot(q); q.x = s.x; q.y = s.y; } T.reset(); }   // (everyone stood in his spot first)
  return mids.map(q => { const s = T.blockSpot(q), [u, w] = window.__uw('R', s.x, s.y); return { q: q.pname || q.name, u: +u.toFixed(1), w: +w.toFixed(1), tr: s.track ? (s.track.pname || s.track.name) : null }; }); });
info('...their forward between the lines: ' + bl3.map(j => `${j.q} ${j.u},${j.w}${j.tr ? ' on ' + j.tr : ''}`).join(' | '));
const bl3u = bl3.map(j => j.u), bl3t = bl3.find(j => j.tr);
ok(bl3t && Math.max(...bl3u) - Math.min(...bl3u) <= 2.3, `the midfield stays a line, the man on him no more than 2 m off it (${bl3u.join(', ')} m; he used to drop to ~65)`);

// --- HOLDING THE LINE: City's forward going in behind at 8 m/s, 4 m in front of Liverpool's back line, in a centre-back's
// zone, the centre-back holding his place in it: he holds his line a beat (a tenth of a second) before he turns and goes
// with him. (One already pressing or shadowing the man goes with him at once: see classic-shots.mjs's runner into space.)
const hold = await page.evaluate(() => { const T = window.__T; T.reset(); window.__home('R', 15); window.__homeDef('G');
  const R = window.__men('R'), c = R.find(q => window.__pos(q, 'atk') === 'CM'), st = R.find(q => window.__pos(q, 'atk') === 'ST');
  const cb = window.__men('G').find(q => q.slotDef && q.slotDef.role === 'DEF');
  window.__give(c, 42, 16);
  const s0 = T.blockSpot(cb), [u0, w0] = window.__uw('R', s0.x, s0.y);
  window.__at(st, u0 - 4, w0); const a = T.atkOf('R'); st.vx = a * 8 * T.MK; st.seenVx = st.vx; st.vy = st.seenVy = 0;
  cb.blockAt = T.simNow();   // (holding his place in the line when the run comes: see aiBrain)
  const at = () => { const s = T.blockSpot(cb), [u] = window.__uw('R', s.x, s.y); return { u: +u.toFixed(2), tr: !!s.track }; };
  T.adv(0.01); const h0 = at(); T.adv(0.06); const h1 = at(); T.adv(0.06); const h2 = at();
  return { line: +u0.toFixed(2), h0, h1, h2 }; });
info('holding the line (his spot, in City\'s metres; on the runner?): at the line ' + hold.line + ' | picked up ' + JSON.stringify(hold.h0) + ' | 0.06 s on ' + JSON.stringify(hold.h1) + ' | 0.12 s on ' + JSON.stringify(hold.h2));
ok(!hold.h0.tr && !hold.h1.tr && Math.abs(hold.h1.u - hold.line) < 0.3, 'a centre-back who picks up a runner going in behind holds his line a beat: not yet with him 0.06 s on');
ok(hold.h2.tr && hold.h2.u > hold.line + 1, `...then turns and goes with him (by 0.12 s on, his spot ${(hold.h2.u - hold.line).toFixed(1)} m back toward his goal)`);

// --- OUT WIDE IN THEIR THIRD: Liverpool's forward on it 74 m out, 19 m across; the winger behind him on that flank ---
const ov = await page.evaluate(() => { const T = window.__T; T.reset(); window.__home('G', 30); window.__homeDef('R');
  const G = window.__men('G'), st = G.find(q => window.__pos(q, 'atk') === 'ST'), ws = G.filter(q => window.__pos(q, 'atk') === 'W');
  const side = Math.sign(window.__uw('G', ws[0].slotAtk.homeX, ws[0].slotAtk.homeY)[1]) || 1, w = ws[0];
  window.__give(st, 74, side * 19); window.__at(w, 65, side * 28);
  const cms = G.filter(q => window.__pos(q, 'atk') === 'CM'); window.__at(cms[0], 67, side * 12); window.__at(cms[1], 59, side * 6);
  const jobs = window.__plan('G'); return { side, w: jobs.find(j => j.q === (w.pname || w.name)), cms: cms.map(q => jobs.find(j => j.q === (q.pname || q.name))) }; });
info('Liverpool out wide in their third: the winger ' + JSON.stringify(ov.w) + '; the midfielders ' + JSON.stringify(ov.cms));
ok(ov.w && /OVERLAP|RUN/.test(ov.w.job) && ov.side * ov.w.w >= 26 && ov.w.u > 70, `the winger goes past him on the outside (${ov.w && ov.w.job} to ${ov.w && ov.w.u}, ${ov.w && ov.w.w}; the man on it at 19)`);
const inBox = ov.cms.filter(j => j && /^(LATE|NEARPOST|FARPOST|BOXMID|BOXBACK|BOXEDGE)$/.test(j.job));
ok(inBox.length === 1, `one central midfielder gets in the box, not both (${ov.cms.map(j => j && j.job).join(', ')})`);

// --- THE KEEPER'S BALL, played on: the computer's keeper gives his side a moment to get there: still holding it 1.8 s after he got it (it used to
// go out after a second or so), and by the time he plays it both wingers are up past 40 m
const kw = await page.evaluate(() => new Promise(res => { const T = window.__T; T.reset(); window.__home('R', 12); window.__homeDef('G');
  const k = T.keepers().find(q => q.team === 'R'); window.__at(k, 2, 0); k.mode = 'hold'; k.holdT = 1.0; k.heldT = 0; T.setGk(k);
  const ws = window.__men('R').filter(q => window.__pos(q, 'atk') === 'W'), t0 = T.simNow(); let at18 = null;
  (function tick(){ const t = T.simNow() - t0;
    if(at18 === null && t >= 1.8) at18 = T.gkHold() === k;
    if(T.gkHold() !== k || t > 3.5) return res({ at18, t: +t.toFixed(2), wu: ws.map(q => +window.__uw('R', q.x, q.y)[0].toFixed(1)) });
    requestAnimationFrame(tick); })(); }));
ok(kw.at18 === true && kw.t >= 1.8, `the computer's keeper gives his side a moment to set: still holding it at 1.8 s (he played it at ${kw.t} s)`);
ok(kw.wu.length === 2 && kw.wu.every(u => u >= 40), `...and when he plays it both wingers are up past 40 m (${kw.wu.join(', ')} m out)`);

process.exitCode = rep.finish();
await browser.close();
