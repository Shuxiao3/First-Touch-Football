// FOOTBALL CLASSIC, OFF IQ ON A RUN (v211). Off IQ is how a man reads a run off the ball: how soon he sees one that's on
// (and how narrow a gap, from how far off), when he goes -- timed with the man on the ball getting the pass ready, not
// before -- how far onside he waits on their line, how well he keeps his lane as their line shifts, how soon he calls a
// run off when the man on the ball's closed down or the way through is shut, and how soon he gets back onside when he's
// gone too early. Compared at 1, 5.5 and 10, everything else level; your side's men and the computer's alike (the man
// you control makes his own runs). The plan's runs read straight off scenes set up in a match, a man stepped along by
// hand at 60 a second where it's where he gets to that counts. On a copy of the game that lets the test set the scene.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={players:()=>players, keepers:()=>keepers, ball:()=>ball, FW, FH, YC, MK, PA_HW, P, atkOf, posOf, own, teamPlan, PLAN:()=>PLAN, mkPlanState, TI:()=>TI, tiDefault, '
  + 'runGap, offsideLineX, inOffsidePos, holderOf, controlled:()=>controlled, EXH, simNow:()=>simNow, setStyle, setTeamForm, followPlan, stepOutfield, statOf, pressureOn, '
  + 'runNeedOf, runSeeOf, runSdOf, runHoldOf, runLeadOf, runQuitOf, runBackOf, passReadyAt, prepTimeOf, '
  + 'reset:()=>{ restartT=0; offsideT=0; scoredT=0; gkHold=null; skill=null; for(const t of ["G","R"]){ PLAN[t]=mkPlanState(); playEye[t].t=-9; ballEye[t].t=-9; } '
  + 'for(const c of [blockCache,endsCache,markCache,swarmCache]){ c.G=null; c.R=null; } for(const t of ["G","R"]){ Object.assign(pressSt[t],{until:-9,cd:-9,t:-1,on:false,swarm:-9}); transitionT[t]=0; } '
  + 'for(const q of players){ q.runSeen=null; q.runCd=0; q.gapRun=0; q.runSeeL=null; q.runSeeT=null; q.ob=null; } ball.thru=null; ball.intendedRcv=null; ball.passerRef=null; simNow+=0.5; }, '
  + 'adv:dt=>{ simNow+=dt; for(const c of [blockCache,endsCache,markCache,swarmCache]){ c.G=null; c.R=null; } }};\n  const LAB_TITLE=');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-runiq-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
// Liverpool v Manchester City, both BALANCED, as the runs test has them (City in their 3-3-2 without the ball)
await page.evaluate(() => { const T = window.__T; T.EXH.you = 'LIV'; T.EXH.opp = 'MCI'; localStorage.removeItem('ft_clubsq'); });
await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show'); await page.click('#exhGo'); await page.waitForTimeout(1500);
await page.evaluate(() => { const T = window.__T; T.setStyle('G', 'neutral'); T.setStyle('R', 'neutral'); T.setTeamForm('R', 'def', '3-3-2'); T.setTeamForm('G', 'def', '3-3-2'); });
await page.evaluate(() => { const T = window.__T, M = T.MK;
  const A = { W: 'winger', ST: 'complete', CM: 'playmaker', CB: 'ballplayer', FB: 'fullback', WM: 'widemid', AM: 'playmaker', DM: 'anchor' };
  for(const q of T.players()) if(A[T.posOf(q, 'atk')]) q.style = A[T.posOf(q, 'atk')];
  // a man at (u m from his own goal, w m across); where a man is, the same way back
  window.__at = (q, u, w) => { const a = T.atkOf(q.team); q.x = a > 0 ? u * M : T.FW - u * M; q.y = T.YC + w * M; q.vx = q.vy = 0; q.state = 'normal'; q.runTarget = null; q.runCd = 0; q.gapRun = 0; q.facing = { x: a, y: 0 }; q.sprint = false; q.stamina = q.staminaCap = 1; };
  window.__u = (team, x) => { const a = T.atkOf(team); return (a > 0 ? x : T.FW - x) / M; };
  window.__w = y => (y - T.YC) / M;
  window.__men = team => T.players().filter(q => q.team === team && !q.benched);
  window.__by = (team, pos, i) => window.__men(team).filter(q => T.posOf(q, 'atk') === pos).sort((a, b) => a.homeY - b.homeY)[i || 0];
  window.__clearIns = () => { for(const t of ['G', 'R']){ const d = T.tiDefault('neutral'); for(const k in d) T.TI()[t][k] = d[k]; for(const k of ['druns', 'mruns', 'aruns', 'wide']) delete T.TI()[t][k]; } };
  // Off IQ and the rest level for the men in a scene (and their spots their own: no IQ off for playing out of position)
  window.__lvl = (q, iq) => { q.stats = Object.assign({}, q.stats, { offIQ: iq, speed: 6, acceleration: 6, agility: 5.5, longPass: 8, passAcc: 7, ballControl: 6, dribbling: 6 }); q.posPen = { a: q.slotAtk, d: q.slotDef, e: q.squadIdx, s: q.style, offIQ: 0, defIQ: 0 }; };
  // the side defending: its back three across a line u m from its own goal, the others well up the pitch out of it
  window.__line = (team, uLine, ws, uMid) => { const R = window.__men(team), back = R.filter(q => T.posOf(q, 'def') === 'CB'), rest = R.filter(q => !back.includes(q));
    back.forEach((q, i) => window.__at(q, uLine, ws[i]));
    rest.forEach((q, i) => window.__at(q, uMid != null ? uMid : 62, i < 3 ? [-22, 0, 22][i] : (i === 3 ? 0 : -16) + (uMid != null ? 0 : 0)));
    const k = T.keepers().find(q => q.team === team); window.__at(k, 1, 0); };
  window.__deep = team => { window.__men(team).forEach((q, i) => window.__at(q, 22, -20 + i * 7)); };
  // the ball at q's feet, and played by p to q, on its way
  window.__give = q => { const B = T.ball(), a = T.atkOf(q.team); B.x = q.x + a * 14; B.y = q.y; B.z = 0; B.vx = B.vy = B.vz = 0; B.thru = null; T.own(q, 14, true); };
  window.__pass = (p, q) => { const B = T.ball(), a = T.atkOf(p.team); B.ownedBy = null; B.dribbler = null; B.x = p.x + a * 20; B.y = p.y; B.z = 0; B.vz = 0;
    const dx = q.x - B.x, dy = q.y - B.y, d = Math.hypot(dx, dy) || 1; B.vx = dx / d * 600; B.vy = dy / d * 600;
    B.intendedRcv = q; B.passerRef = p; B.lastTouchP = p; B.lastTouch = p.team; B.shotT = 0; B.shotBy = null; B.crossT = 0; B.thru = null; p.noTouchT = 0.3; };
  window.__run = (team, q) => T.teamPlan(team, 1 / 60).runs.find(R => R.p === q) || null;
  window.__job = (team, q) => T.teamPlan(team, 1 / 60).jobs.get(q) || null;
  window.__nm = q => q.pname || q.name;
});

// ===== A LOOK AT THE SCENE =====
const look = await page.evaluate(() => { const T = window.__T, out = {};
  for(const t of ['G', 'R']) out[t] = window.__men(t).map(q => T.posOf(q, 'atk') + '/' + T.posOf(q, 'def') + ' iq' + T.statOf(q, 'offIQ', 5.5).toFixed(1)).join(' ');
  return out; });
info('the sides: ' + JSON.stringify(look));

// (a probe: from standing, flat out straight up the pitch -- how long to cover 0.33, 1.3, 2.2 m)
const cover = await page.evaluate(() => { const T = window.__T, dt = 1 / 60, st = window.__by('G', 'ST'); T.reset(); window.__lvl(st, 5.5); window.__at(st, 40, 0);
  const a = T.atkOf('G'), x0 = st.x, marks = [0.33, 1.3, 2.2, 4], out = {}; let t = 0;
  for(; t < 2; t += dt){ T.adv(dt); st.sprint = true; T.stepOutfield(st, a, 0, dt); const d = (st.x - x0) * a / T.MK; for(const m of marks) if(out[m] == null && d >= m) out[m] = +(t + dt).toFixed(3); }
  return out; });
info('from standing, flat out: ' + JSON.stringify(cover));
// ===== TIMED WITH THE MAN ON THE BALL, AND HELD ONSIDE =====
// their back three 28 m out; our centre-back plays it up to our midfielder, 16 m short of their line, and our striker
// waits on it for him; the ball's at his feet, and the striker's stepped along by hand at 60 a second -- when he goes,
// against when the midfielder's ready to play it, and whether he's onside then, and moving
const timing = await page.evaluate(() => { const T = window.__T, dt = 1 / 60, L = T.FW / T.MK, out = {};
  const scene = (att, def, iq, seed) => { T.reset(); window.__clearIns(); window.__deep(att); window.__line(def, 28, [-10, 2, 12]);
    const cb = window.__by(att, 'CB', 1), cm = window.__by(att, 'CM', 0), st = window.__by(att, 'ST');
    for(const q of window.__men(att)) window.__lvl(q, 5.5); window.__lvl(st, iq);
    window.__at(cb, L - 28 - 30, 0); window.__at(cm, L - 28 - 16, 4); window.__at(st, L - 28 - 3, -4);
    window.__pass(cb, cm); let R0 = null, seen = 0; for(; seen < 1; seen += dt){ R0 = window.__run(att, st); if(R0) break; T.adv(dt); }
    const wait0 = !!(R0 && R0.wait), j0 = window.__job(att, st), uol = window.__u(att, T.offsideLineX(att));
    // he's got there: waiting on their line where he means to
    st.x = j0.x; st.y = j0.y;
    window.__give(cm); cm.settleT = 0; cm.settleNow = 0; const t0 = T.simNow(), rdy = T.passReadyAt(cm);
    let went = null, atRdy = null;
    for(let t = 0; t < 2; t += dt){ T.adv(dt); const S = T.teamPlan(att, dt), R = S.runs.find(R => R.p === st), j = S.jobs.get(st);
      if(R && R.went && went == null) went = +(T.simNow() - t0).toFixed(3);
      if(j){ const it = T.followPlan(st, j, dt); st.sprint = !!j.sprint; T.stepOutfield(st, it.ix, it.iy, dt); }
      if(atRdy == null && T.simNow() >= rdy){ atRdy = { off: T.inOffsidePos(st), past: +(window.__u(att, st.x) - window.__u(att, T.offsideLineX(att))).toFixed(2), v: +(Math.hypot(st.vx, st.vy) / T.MK).toFixed(2) }; } }
    return { run: !!R0, wait: wait0, seen: +seen.toFixed(3), hold: +(uol - window.__u(att, j0.x)).toFixed(2), ready: +(rdy - t0).toFixed(3), lead: +T.runLeadOf(st).toFixed(3), went, atRdy}; };
  for(const iq of [1, 5.5, 10]){ const rs = []; for(let i = 0; i < 100; i++) rs.push(scene('G', 'R', iq, i)); out['G' + iq] = rs; }
  for(const iq of [1, 5.5, 10]){ const rs = []; for(let i = 0; i < 100; i++) rs.push(scene('R', 'G', iq, i)); out['R' + iq] = rs; }
  return out; });
const TM = {};
for(const k in timing){ const rs = timing[k], n = rs.length, e = rs.map(r => r.went - (r.ready - r.lead)), m = e.reduce((a, b) => a + b, 0) / n;
  TM[k] = { n, ran: rs.filter(r => r.run && r.wait).length, seen: rs[0].seen, hold: rs[0].hold, sd: +Math.sqrt(e.reduce((a, b) => a + (b - m) * (b - m), 0) / n).toFixed(3),
    off: rs.filter(r => r.atRdy && r.atRdy.off).length, on: +(-rs.reduce((a, r) => a + r.atRdy.past, 0) / n).toFixed(2), v: +(rs.reduce((a, r) => a + r.atRdy.v, 0) / n).toFixed(1) };
  info(k.replace(/^G/, 'ours, Off IQ ').replace(/^R/, 'theirs, Off IQ ') + ': waiting on it ' + TM[k].ran + '/' + n + ', seen after ' + TM[k].seen + ' s, held ' + TM[k].hold + ' m onside; his going off by ' + TM[k].sd + ' s (sd); as the midfielder\'s ready: offside ' + TM[k].off + '/' + n + ', on average ' + TM[k].on + ' m onside, at ' + TM[k].v + ' m/s'); }
ok(['G', 'R'].every(t => [1, 5.5, 10].every(iq => TM[t + iq].ran === TM[t + iq].n)), 'the ball played up to the midfielder, the striker goes on it and waits on their line for it, at any Off IQ, ours and theirs alike');
ok(['G', 'R'].every(t => TM[t + 1].hold < 0.6 && Math.abs(TM[t + 5.5].hold - 1.3) < 0.05 && TM[t + 10].hold > 2), 'waiting there, onside by ' + TM.G1.hold + ' m at Off IQ 1, ' + TM['G5.5'].hold + ' m at 5.5 (as before: 30 px) and ' + TM.G10.hold + ' m at 10');
ok(['G', 'R'].every(t => TM[t + 1].sd > TM[t + 5.5].sd * 1.6 && TM[t + 5.5].sd > TM[t + 10].sd * 3 && TM[t + 10].sd < 0.04), 'he goes as the midfielder\'s about ready to play it, the readier the better his Off IQ: off by ' + TM.G1.sd + ' s at 1, ' + TM['G5.5'].sd + ' s at 5.5, ' + TM.G10.sd + ' s at 10 (sd; theirs ' + TM.R1.sd + ', ' + TM['R5.5'].sd + ', ' + TM.R10.sd + ')');
const both = iq => (TM['G' + iq].off + TM['R' + iq].off) / (TM['G' + iq].n + TM['R' + iq].n);   // (ours and theirs together: two hundred goes -- about 8 in 100 at 5.5, 30 at 1)
ok(TM.G10.off === 0 && TM.R10.off === 0 && both(5.5) <= 0.14 && both(1) >= 0.2 && both(1) > both(5.5) * 2 && TM.G10.on > 0.6 && TM.G10.v > TM.G1.v + 1 && TM['G5.5'].v > TM.G1.v,
  'so as the midfielder\'s ready to play it: at Off IQ 10 onside every time (' + TM.G10.on + ' m on average, at ' + TM.G10.v + ' m/s); at 5.5 offside ' + TM['G5.5'].off + ' times in ' + TM['G5.5'].n + ' (theirs ' + TM['R5.5'].off + ' in ' + TM['R5.5'].n + '), at ' + TM['G5.5'].v + ' m/s; at 1, ' + TM.G1.off + ' in ' + TM.G1.n + ' (' + TM.R1.off + ' in ' + TM.R1.n + ') -- too early -- and slower off the mark, ' + TM.G1.v + ' m/s');
ok(TM.G1.seen >= 0.3 && TM['G5.5'].seen === 0 && TM.G10.seen === 0, 'and he sees the run\'s on at once at Off IQ 5.5 and 10 (as before), ' + TM.G1.seen + ' s late at 1');

// ===== SEEING IT: how narrow a gap in their line, from how far short of it, and the brighter of two =====
const see = await page.evaluate(() => { const T = window.__T, L = T.FW / T.MK, dt = 1 / 60, out = { gap: {}, reach: {}, pick: {} };
  const st = window.__by('G', 'ST'), cm = window.__by('G', 'CM', 0), wl = window.__by('G', 'W', 0), wr = window.__by('G', 'W', 1);
  // their line 28 m out, seven of them across it 6 m apart (and 5 m): a gap he sees, or not, between the middle two
  for(const gapM of [6, 5]){ T.reset(); window.__deep('G'); const R = window.__men('R');
    R.forEach((q, i) => window.__at(q, 28, i < 7 ? (i - 3) * gapM : 30)); window.__at(T.keepers().find(q => q.team === 'R'), 1, 0);
    window.__at(st, L - 28 - 2, gapM / 2);
    for(const iq of [1, 5.5, 10]){ window.__lvl(st, iq); const g = T.runGap('G', st, T.PA_HW - 60, T.runNeedOf(st)); out.gap[gapM + ' ' + iq] = g ? +window.__w(g.y).toFixed(1) : null; } }
  // the midfielder on the ball, free and facing up the pitch; the striker some way short of their line: is his run on?
  const short = (iq, by) => { T.reset(); window.__clearIns(); T.TI().G.aruns = 'run'; window.__deep('G'); window.__line('R', 28, [-10, 2, 12]);   // (the forwards told IN BEHIND: his job's to pin their line)
    for(const q of window.__men('G')) window.__lvl(q, 5.5); window.__lvl(st, iq);
    window.__at(cm, L - 28 - 18, 4); window.__at(st, L - 28 - by, -4); window.__give(cm); cm.prepT = T.simNow() - 2;
    return T.teamPlan('G', dt).runs.some(R => R.p === st); };
  const bm = 330 * 1.3 / T.MK;   // (how far off a striker pinning their line sees one from at Off IQ 5.5, told IN BEHIND)
  out.reach.base = +bm.toFixed(1);
  for(const f of [0.85, 1.1]) for(const iq of [1, 5.5, 10]) out.reach[f + ' ' + iq] = short(iq, bm * f);
  // two wingers alike, one each side, their line's gaps the same both sides, the midfielder on the ball in the middle:
  // which goes first, by their Off IQ (10 and 5.5, then swapped)
  const two = (iqL, iqR) => { T.reset(); window.__clearIns(); window.__deep('G'); const R = window.__men('R');
    R.forEach((q, i) => window.__at(q, i < 4 ? 28 : 62, i < 4 ? [-18, -6, 6, 18][i] : -10 + i * 3)); window.__at(T.keepers().find(q => q.team === 'R'), 1, 0);
    for(const q of window.__men('G')) window.__lvl(q, 5.5); window.__lvl(wl, iqL); window.__lvl(wr, iqR); st.runCd = 9;
    window.__at(cm, L - 28 - 14, 0); window.__at(wl, L - 28 - 6, -25); window.__at(wr, L - 28 - 6, 25); window.__give(cm); cm.prepT = T.simNow() - 2;
    const S = T.teamPlan('G', dt); return S.runs.length ? (S.runs[0].p === wl ? 'L' : S.runs[0].p === wr ? 'R' : window.__nm(S.runs[0].p)) : null; };
  out.pick = { l10: two(10, 5.5), r10: two(5.5, 10), same: two(5.5, 5.5) };
  return out; });
info('a gap in their line, his lane through it (m across; none: he doesn\'t see it): ' + JSON.stringify(see.gap));
info('a run seen from how far short of their line (a striker told IN BEHIND, ' + see.reach.base + ' m at Off IQ 5.5 as before), at 0.85 and 1.1 times that: ' + JSON.stringify(see.reach));
info('two wingers alike but for Off IQ, who goes first: ' + JSON.stringify(see.pick));
ok(see.gap['6 1'] === null && see.gap['6 5.5'] !== null && see.gap['6 10'] !== null && see.gap['5 1'] === null && see.gap['5 5.5'] === null && see.gap['5 10'] !== null,
  'a 6 m gap between two of theirs he sees at Off IQ 5.5 (as before) and 10, not at 1; a 5 m one only at 10');
ok(see.reach['0.85 1'] === false && see.reach['0.85 5.5'] && see.reach['0.85 10'] && see.reach['1.1 1'] === false && see.reach['1.1 5.5'] === false && see.reach['1.1 10'],
  'and from further off the better his Off IQ (a striker told to run in behind): ' + (see.reach.base * 0.85).toFixed(1) + ' m short of their line at 5.5 and 10, not 1; ' + (see.reach.base * 1.1).toFixed(1) + ' m only at 10');
ok(see.pick.l10 === 'L' && see.pick.r10 === 'R', 'two runs as good as each other, the brighter man goes (the left winger at Off IQ 10, then the right: ' + see.pick.l10 + ', ' + see.pick.r10 + ')');

// ===== THE LANE KEPT, AND THE LINE FOLLOWED =====
// the striker waiting on their line for the midfielder's ball; their back three shift across, 6 m, the middle one into his
// lane -- the plan ticked along at 60 a second: where his run's going; and their line steps up 3 m: where he waits
const lane = await page.evaluate(() => { const T = window.__T, L = T.FW / T.MK, dt = 1 / 60, out = {};
  const cb = window.__by('G', 'CB', 1), cm = window.__by('G', 'CM', 0), st = window.__by('G', 'ST');
  for(const iq of [1, 5.5, 10]){ T.reset(); window.__clearIns(); window.__deep('G'); window.__line('R', 28, [-10, 2, 12]);
    for(const q of window.__men('G')) window.__lvl(q, 5.5); window.__lvl(st, iq);
    window.__at(cb, L - 28 - 30, 0); window.__at(cm, L - 28 - 16, 4); window.__at(st, L - 28 - 3, -4);
    window.__pass(cb, cm); let R = null; for(let t = 0; t < 1 && !R; t += dt){ R = window.__run('G', st); if(!R) T.adv(dt); }
    const j0 = window.__job('G', st); st.x = j0.x; st.y = j0.y; const y0 = R.y, back = window.__men('R').filter(q => T.posOf(q, 'def') === 'CB');
    back.forEach((q, i) => window.__at(q, 28, [-16, -4, 6][i]));
    const ys = []; for(let t = 0; t < 1.0001; t += dt){ T.adv(dt); const S = T.teamPlan('G', dt), Rn = S.runs.find(R => R.p === st); ys.push(Rn ? Rn.y : null); }
    const uol0 = window.__u('G', T.offsideLineX('G')), h0 = uol0 - window.__u('G', window.__job('G', st).x);
    back.forEach((q, i) => window.__at(q, 31, [-16, -4, 6][i])); T.adv(dt);
    const uol1 = window.__u('G', T.offsideLineX('G')), h1 = uol1 - window.__u('G', window.__job('G', st).x);
    out[iq] = { from: +window.__w(y0).toFixed(2), at02: +window.__w(ys[12]).toFixed(2), at1: +window.__w(ys[ys.length - 1]).toFixed(2), up: +(uol1 - uol0).toFixed(1), held: +h0.toFixed(2), heldUp: +h1.toFixed(2) }; }
  return out; });
info('their line shifts 6 m across, the middle man into his lane: his lane (m across) from, after 0.2 s, after 1 s; their line steps up: held onside by, before and after -- ' + JSON.stringify(lane));
const mv = (iq, k) => Math.abs(lane[iq][k] - lane[iq].from);
ok(mv(1, 'at1') < 0.05 && mv(5.5, 'at02') > 0.3 && mv(10, 'at02') > mv(5.5, 'at02') * 1.5 && mv(10, 'at1') >= mv(5.5, 'at1') - 0.05 && mv(5.5, 'at1') > 1,
  'their line shifts across and the middle man\'s in his lane: he moves his run to the gap, the quicker the better his Off IQ (' + mv(5.5, 'at02').toFixed(2) + ' m in 0.2 s at 5.5, ' + mv(10, 'at02').toFixed(2) + ' m at 10, ' + mv(5.5, 'at1').toFixed(2) + ' and ' + mv(10, 'at1').toFixed(2) + ' m in a second); at Off IQ 1 he runs where he first meant to');
ok([1, 5.5, 10].every(iq => lane[iq].up === -3 && Math.abs(lane[iq].heldUp - lane[iq].held) < 0.05), 'their line steps up 3 m and he waits on it where it is now, onside by as much as before (' + [1, 5.5, 10].map(iq => lane[iq].heldUp).join(', ') + ' m)');

// ===== CALLED OFF, AND BACK ONSIDE =====
// the midfielder on the ball, the striker's run on: (a) one of theirs gets right on the midfielder; (b) one of theirs steps
// into the way through to where it's going; (c) their line steps up past him before it's played -- how long till he calls
// it off, and till he's back onside
const quit = await page.evaluate(() => { const T = window.__T, L = T.FW / T.MK, dt = 1 / 60, out = {};
  const cm = window.__by('G', 'CM', 0), st = window.__by('G', 'ST');
  const go = (iq, what) => { T.reset(); window.__clearIns(); window.__deep('G'); window.__line('R', 28, [-10, 2, 12]);
    for(const q of window.__men('G')) window.__lvl(q, 5.5); window.__lvl(st, iq);
    window.__at(cm, L - 28 - 16, 4); window.__at(st, L - 28 - 2, -4); window.__give(cm); cm.prepT = T.simNow() - 2;
    let R = null; for(let t = 0; t < 1 && !R; t += dt){ R = window.__run('G', st); if(!R) T.adv(dt); }
    if(!R) return { run: false };
    const R0 = R, mid = window.__men('R').find(q => T.posOf(q, 'def') !== 'CB');
    if(what === 'pressed') window.__at(mid, 28 + 16 - 1.2, 4);
    if(what === 'shut'){ const f = 0.3; mid.x = cm.x + (R.x - cm.x) * f; mid.y = cm.y + (R.y - cm.y) * f; mid.vx = mid.vy = 0; }
    if(what === 'offside'){ for(const q of window.__men('R').filter(q => T.posOf(q, 'def') === 'CB')) window.__at(q, 28 + 3, window.__w(q.y)); st.x = window.__by('G', 'ST').x; }
    const pr = +T.pressureOn(cm).toFixed(2);
    for(let t = 0; t < 2.5; t += dt){ T.adv(dt); const S = T.teamPlan('G', dt), Rn = S.runs.find(R => R.p === st);
      if(what !== 'offside' && Rn !== R0) return { run: true, pr, off: +(t + dt).toFixed(2) };
      if(what === 'offside' && R0.back) return { run: true, off: T.inOffsidePos(st), back: +(t + dt).toFixed(2), to: +(window.__u('G', T.offsideLineX('G')) - window.__u('G', S.jobs.get(st).x)).toFixed(2) }; }
    return { run: true, pr, off: null, offPos: T.inOffsidePos(st) }; };
  for(const what of ['pressed', 'shut', 'offside']) for(const iq of [1, 5.5, 10]) out[what + ' ' + iq] = go(iq, what);
  out.none = go(5.5, 'none');
  return out; });
info('called off and back onside: ' + JSON.stringify(quit));
const qo = (w, iq) => quit[w + ' ' + iq];
ok(['pressed', 'shut'].every(w => [1, 5.5, 10].every(iq => qo(w, iq).run && qo(w, iq).off != null)) && ['pressed', 'shut'].every(w => qo(w, 10).off < 0.3 && Math.abs(qo(w, 5.5).off - 0.5) < 0.1 && qo(w, 1).off > 1.3 && qo(w, 1).off < 2.1),
  'one of theirs right on the man on the ball, or into the way through to where the run\'s going: he calls it off -- after ' + qo('pressed', 10).off + ' s at Off IQ 10, ' + qo('pressed', 5.5).off + ' s at 5.5, ' + qo('pressed', 1).off + ' s at 1 (the way shut: ' + qo('shut', 10).off + ', ' + qo('shut', 5.5).off + ', ' + qo('shut', 1).off + ' s)');
ok(quit.none.run && quit.none.off > 2.1, 'nobody near him and the way through open, the run\'s on till it\'s over (' + quit.none.off + ' s: 2.2 s, a run on the ball at his feet)');
ok([1, 5.5, 10].every(iq => qo('offside', iq).back != null && qo('offside', iq).to > 0) && qo('offside', 10).back < 0.2 && Math.abs(qo('offside', 5.5).back - 0.4) < 0.08 && qo('offside', 1).back > 1,
  'their line steps up past him before it\'s played: he comes back onside after ' + qo('offside', 10).back + ' s at Off IQ 10, ' + qo('offside', 5.5).back + ' s at 5.5, ' + qo('offside', 1).back + ' s at 1, to wait on it again');

process.exitCode = rep.finish();
await browser.close();
