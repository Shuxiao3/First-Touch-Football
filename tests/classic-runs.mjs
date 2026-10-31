// FOOTBALL CLASSIC, RUNS IN BEHIND (v79, as coached from the runs page): the runs go as a pass is played forward to a
// team-mate, not once he has it (ANTICIPATION) -- the runner gets to their line and waits there till the ball's arrived,
// then goes; a run carries on when the ball's moved on to another team-mate who can still find him; a wide man runs into
// the gap in their line in his own channel, not off towards a bigger one on the far side; a run that would land near their
// goal goes in towards it, into the box, not on down the line; the man who's just played it forward goes again; a
// forward's run across their line takes a midfielder told to RUN IN BEHIND into the lane it emptied (THE THIRD MAN); the
// ball through to the box (or near it, in the middle) takes the wide men in at the back post. The plan's jobs read
// straight off a scene set up in a match. On a copy of the game that lets the test set the scene.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={players:()=>players, keepers:()=>keepers, ball:()=>ball, FW, FH, YC, MK, PA_HW, atkOf, posOf, own, teamPlan, PLAN:()=>PLAN, mkPlanState, PI:()=>PI, '
  + 'runGap, backlineGap, offsideLineX, heldBy, holderOf, EXH, simNow:()=>simNow, setStyle, '
  + 'reset:()=>{ restartT=0; offsideT=0; scoredT=0; gkHold=null; skill=null; for(const t of ["G","R"]){ PLAN[t]=mkPlanState(); playEye[t].t=-9; ballEye[t].t=-9; } '
  + 'for(const c of [blockCache,endsCache,markCache,swarmCache]){ c.G=null; c.R=null; } for(const t of ["G","R"]){ Object.assign(pressSt[t],{until:-9,cd:-9,t:-1,on:false,swarm:-9}); transitionT[t]=0; } '
  + 'for(const q of players){ q.runSeen=null; q.runCd=0; q.gapRun=0; } ball.thru=null; ball.intendedRcv=null; ball.passerRef=null; simNow+=0.5; }, '
  + 'adv:dt=>{ simNow+=dt; for(const c of [blockCache,endsCache,markCache,swarmCache]){ c.G=null; c.R=null; } }};\n  const LAB_TITLE=');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-runs-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
// Liverpool (2-2-3 with the ball) v Manchester City (3-3-1 without it), both BALANCED
await page.evaluate(() => { const T = window.__T; T.EXH.you = 'LIV'; T.EXH.opp = 'MCI'; localStorage.removeItem('ft_clubsq'); });
await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show'); await page.click('#exhGo'); await page.waitForTimeout(1500);
await page.evaluate(() => { const T = window.__T; T.setStyle('G', 'neutral'); T.setStyle('R', 'neutral'); });
await page.evaluate(() => { const T = window.__T, M = T.MK, L = T.FW / M;
  // a man at (u m from his own goal, w m across: + toward y=FH)
  window.__at = (q, u, w) => { const a = T.atkOf(q.team); q.x = a > 0 ? u * M : T.FW - u * M; q.y = T.YC + w * M; q.vx = q.vy = 0; q.state = 'normal'; q.runTarget = null; q.runCd = 0; q.gapRun = 0; q.facing = { x: a, y: 0 }; };
  window.__uw = (team, x, y) => { const a = T.atkOf(team); return [+((a > 0 ? x : T.FW - x) / M).toFixed(1), +((y - T.YC) / M).toFixed(1)]; };
  window.__men = team => T.players().filter(q => q.team === team && !q.benched);
  window.__by = (team, pos, ph, i) => window.__men(team).filter(q => T.posOf(q, ph || 'atk') === pos).sort((a, b) => a.homeY - b.homeY)[i || 0];
  window.__ins = (q, k, v) => { const sl = q.slotAtk, PI = T.PI(); const t = PI[q.team] || (PI[q.team] = {}); const ph = t.atk || (t.atk = {}); const f = ph[sl.form] || (ph[sl.form] = {}); f[sl.si] = Object.assign({}, f[sl.si], { [k]: v }); };
  window.__clearIns = () => { const PI = T.PI(); for(const t of ['G', 'R']) if(PI[t]) PI[t].atk = {}; };
  // City's block: three across their line (u from their goal), three in front of it, the forward up; their keeper on his line
  window.__city = (uLine, ws, uMid) => { const R = window.__men('R'), back = R.filter(q => T.posOf(q, 'def') === 'CB'), rest = R.filter(q => !back.includes(q));
    back.forEach((q, i) => window.__at(q, uLine, ws[i]));
    rest.forEach((q, i) => i < 3 ? window.__at(q, uMid, [-22, 0, 22][i]) : window.__at(q, 62, 0));
    const k = T.keepers().find(q => q.team === 'R'); window.__at(k, 1, 0); };
  // Liverpool deep, out of it (their back two, the men not in the scene)
  window.__liv = () => { window.__men('G').forEach((q, i) => window.__at(q, 22, -20 + i * 7)); };
  // the ball at q's feet, facing up the pitch
  window.__give = q => { const B = T.ball(), a = T.atkOf(q.team); B.x = q.x + a * 14; B.y = q.y; B.z = 0; B.vx = B.vy = B.vz = 0; B.thru = null; T.own(q, 14, true); };
  // the ball played by p to q, on its way (from p's feet, 600 px/s along the ground)
  window.__pass = (p, q, thru) => { const B = T.ball(), a = T.atkOf(p.team); B.ownedBy = null; B.dribbler = null; B.x = p.x + a * 20; B.y = p.y; B.z = 0; B.vz = 0;
    const tx = thru ? thru.x : q.x, ty = thru ? thru.y : q.y, dx = tx - B.x, dy = ty - B.y, d = Math.hypot(dx, dy) || 1; B.vx = dx / d * 600; B.vy = dy / d * 600;
    B.intendedRcv = q; B.passerRef = p; B.lastTouchP = p; B.lastTouch = p.team; B.shotT = 0; B.shotBy = null; B.crossT = 0; B.thru = thru ? { x: tx, y: ty, until: T.simNow() + 2 } : null; p.noTouchT = 0.3; };
  // the plan's jobs for Liverpool, and the runs: [name, pos, job, u, w]
  window.__plan = () => { const S = T.teamPlan('G', 1 / 60), out = [];
    for(const [q, a] of S.jobs) out.push({ q: q.pname || q.name, pos: T.posOf(q, 'atk'), job: a.job, u: window.__uw('G', a.x, a.y)[0], w: window.__uw('G', a.x, a.y)[1] });
    return { jobs: out, runs: S.runs.map(R => ({ q: R.p.pname || R.p.name, pos: T.posOf(R.p, 'atk'), wait: !!R.wait, third: !!R.third })), uol: window.__uw('G', T.offsideLineX('G'), 0)[0] }; };
  window.__nm = q => q.pname || q.name; });

const show = r => r.jobs.filter(j => ['RUN', 'BACKPOST', 'PIN', 'WIDTH', 'INSIDE', 'SUPPORT', 'LATE', 'POCKET'].includes(j.job)).map(j => `${j.q} ${j.pos} ${j.job} ${j.u},${j.w}`).join(' | ');

// --- ANTICIPATION: a centre-back plays it forward to a midfielder; the forward goes as it's played, waits on their line ----
let r = await page.evaluate(() => { const T = window.__T; T.reset(); window.__clearIns(); window.__liv(); window.__city(28, [-10, 2, 12], 40);
  const cb = window.__by('G', 'CB', 'atk', 0), cm = window.__by('G', 'CM', 'atk', 1), st = window.__by('G', 'ST'), wl = window.__by('G', 'W', 'atk', 0), wr = window.__by('G', 'W', 'atk', 1);
  window.__at(cb, 38, -4); window.__at(cm, 54, 6); window.__at(st, 63, -3); window.__at(wl, 60, -27); window.__at(wr, 60, 27);
  window.__pass(cb, cm);
  const inFlight = window.__plan(), held = T.heldBy();
  // and once it's arrived at his feet
  window.__give(cm); T.adv(0.8); const there = window.__plan();
  // the same, played back to the centre-back instead: no runs for that
  T.reset(); window.__liv(); window.__city(28, [-10, 2, 12], 40);
  window.__at(cb, 38, -4); window.__at(cm, 54, 6); window.__at(st, 63, -3); window.__at(wl, 60, -27); window.__at(wr, 60, 27);
  window.__pass(cm, cb); const back = window.__plan();
  return { inFlight, held: held ? window.__nm(held) : null, cm: window.__nm(cm), there, back }; });
info('a pass on its way to the midfielder: ' + JSON.stringify(r.inFlight.runs) + ' (their line ' + r.inFlight.uol + ' m) -- ' + show(r.inFlight));
info('...once he has it: ' + JSON.stringify(r.there.runs) + ' -- ' + show(r.there));
const runIn = r.inFlight.jobs.filter(j => j.job === 'RUN'), runThere = r.there.jobs.filter(j => j.job === 'RUN');
ok(r.held === r.cm && r.inFlight.runs.length >= 1 && r.inFlight.runs.every(R => R.wait) && runIn.length >= 1, `the ball on its way to him (${r.held}): ${r.inFlight.runs.map(R => R.q + ' ' + R.pos).join(', ')} goes as it's played (it was: nobody, till he had it)`);
ok(runIn.every(j => j.u <= r.inFlight.uol + 0.2), `...up to their line (${r.inFlight.uol} m) and waits on it, onside, while it's on its way (${runIn.map(j => j.u).join(', ')} m)`);
ok(runThere.length >= 1 && runThere.some(j => j.u > r.there.uol + 5), `the ball at his feet: he goes, beyond their line (${runThere.map(j => j.u).join(', ')} m, their line ${r.there.uol})`);
ok(r.back.runs.length === 0, `played back to the centre-back: no run for that (${JSON.stringify(r.back.runs)})`);

// --- A RUN CARRIES ON when the ball goes to a man who can still find him; one who can't, it's off ----------------------
r = await page.evaluate(() => { const T = window.__T; T.reset(); window.__clearIns(); window.__liv(); window.__city(28, [-10, 2, 12], 40);
  const cb = window.__by('G', 'CB', 'atk', 0), cms = [window.__by('G', 'CM', 'atk', 0), window.__by('G', 'CM', 'atk', 1)], st = window.__by('G', 'ST'), wr = window.__by('G', 'W', 'atk', 1), wl = window.__by('G', 'W', 'atk', 0);
  window.__at(cb, 30, 0); window.__at(cms[0], 50, -8); window.__at(cms[1], 54, 6); window.__at(st, 63, -3); window.__at(wl, 45, -27); window.__at(wr, 60, 27);
  window.__give(cms[1]); const a = window.__plan(); const runner = a.runs[0] && a.runs[0].q;
  T.adv(0.05); window.__pass(cms[1], cms[0]); const b = window.__plan();        // on to the other midfielder, 14 m away
  T.adv(0.05); window.__pass(cms[0], cb); const c = window.__plan();            // and back to the centre-back, 20 m behind him
  return { runner, a: a.runs, b: b.runs, c: c.runs }; });
info('runs: on the ball ' + JSON.stringify(r.a) + ', passed on ' + JSON.stringify(r.b) + ', passed back ' + JSON.stringify(r.c));
ok(r.runner && r.b.some(R => R.q === r.runner), `${r.runner} goes on the midfielder's ball, and keeps going when it's moved on to the other one, who can still find him (it was: called off)`);

// --- HIS OWN CHANNEL: a wide man's gap is the one he's in, not a bigger one on the far side ----------------------------
r = await page.evaluate(() => { const T = window.__T; T.reset(); window.__clearIns(); window.__liv(); window.__city(29, [-8, 6, 18], 40);
  const wr = window.__by('G', 'W', 'atk', 1); window.__at(wr, 58, 29);
  const g0 = T.backlineGap('G', wr.y), g1 = T.runGap('G', wr, null), w = y => +((y - T.YC) / T.MK).toFixed(1);
  return { old: g0 && w(g0.y), now: g1 && w(g1.y), at: 29 }; });
info('the right winger\'s gap (him 29 m across): ' + JSON.stringify(r));
ok(r.old !== null && Math.abs(r.old - 29) > 17 && r.now !== null && Math.abs(r.now - 29) < 4, `out wide (29 m across), his run's in his own channel (${r.now} m) -- not off at the far side's bigger gap (${r.old} m), which ruled him out`);

// --- NEAR THEIR GOAL, IN TOWARDS IT: a wide man's run that'd land near their goal goes into the box ----------------------
r = await page.evaluate(() => { const T = window.__T; T.reset(); window.__clearIns(); window.__liv(); window.__city(17, [-12, -2, 6], 27);
  const cm = window.__by('G', 'CM', 'atk', 1), st = window.__by('G', 'ST'), wr = window.__by('G', 'W', 'atk', 1), wl = window.__by('G', 'W', 'atk', 0);
  window.__at(cm, 66, 11); window.__at(st, 64, -12); window.__at(wl, 55, -28); window.__at(wr, 74, 26);
  window.__ins(st, 'stRuns', 'target'); window.__ins(wl, 'wSupport', 'short');   // (him the only one to go)
  window.__give(cm); const p = window.__plan(); const run = p.jobs.find(j => j.job === 'RUN'); return { run, p, runs: p.runs, uol: p.uol }; });
info('their line 17 m out, the right winger 26 m across: ' + show(r.p));
ok(r.run && r.run.pos === 'W' && Math.abs(r.run.w) < 26 - 4, `his run goes in towards their goal, not on down his touchline: landing ${r.run && r.run.w} m across (he's 26 m across)`);

// --- HE GOES AGAIN: the man who's just played it forward is the one to run -----------------------------------------------
r = await page.evaluate(() => { const T = window.__T; T.reset(); window.__clearIns(); window.__liv(); window.__city(26, [-14, 2, 14], 36);
  const wl = window.__by('G', 'W', 'atk', 0), st = window.__by('G', 'ST'), wr = window.__by('G', 'W', 'atk', 1), cms = [window.__by('G', 'CM', 'atk', 0), window.__by('G', 'CM', 'atk', 1)];
  window.__at(wl, 63, -8); window.__at(st, 70, -1); window.__at(wr, 58, 29); window.__at(cms[0], 50, -10); window.__at(cms[1], 52, 10);
  window.__pass(wl, st); const p = window.__plan(); return { runs: p.runs, wl: window.__nm(wl), p }; });
info('the left winger plays it forward to the striker: ' + JSON.stringify(r.runs) + ' -- ' + show(r.p));
ok(r.runs.length >= 1 && r.runs[0].q === r.wl, `the man who played it forward (${r.wl}) goes again, first (runs: ${r.runs.map(R => R.q).join(', ')})`);

// --- THE THIRD MAN: a forward's run across their line, and a midfielder told to run in behind goes into his lane ----------
r = await page.evaluate(() => { const T = window.__T; const go = runIns => { T.reset(); window.__clearIns(); window.__liv(); window.__city(28, [-10, 2, 25], 40);
    const cb = window.__by('G', 'CB', 'atk', 0), st = window.__by('G', 'ST'), wl = window.__by('G', 'W', 'atk', 0), wr = window.__by('G', 'W', 'atk', 1);
    const h = T.holderOf('G'), all = window.__men('G').filter(q => T.posOf(q, 'atk') === 'CM'), cms = [all.find(q => q === h) || all[0], all.find(q => q !== h) || all[1]];   // (the holder plays it; the other's the third man)
    window.__at(cb, 36, 0); window.__at(cms[0], 52, -6); window.__at(cms[1], 60, 12); window.__at(st, 66, 19); window.__at(wl, 50, -28); window.__at(wr, 50, 30);
    window.__ins(st, 'stRuns', 'run'); window.__ins(wl, 'wSupport', 'short'); window.__ins(wr, 'wSupport', 'short');
    if(runIns) window.__ins(cms[1], 'cmSupport', 'run');
    window.__give(cms[0]); const p = window.__plan(); return { runs: p.runs, jobs: p.jobs.filter(j => j.job === 'RUN'), cm: window.__nm(cms[1]), st: window.__nm(st), stAt: 19 }; };
  return { run: go(true), bal: go(false) }; });
info('third man (told to run in behind): ' + JSON.stringify(r.run.runs) + ' ' + JSON.stringify(r.run.jobs) + ' | balanced: ' + JSON.stringify(r.bal.runs));
const third = r.run.runs.find(R => R.third), thirdJob = third && r.run.jobs.find(j => j.q === third.q), stJob = r.run.jobs.find(j => j.q === r.run.st);
ok(stJob && Math.abs(stJob.w - r.run.stAt) > 5 && third && third.q === r.run.cm && thirdJob && Math.abs(thirdJob.w - r.run.stAt) < 3,
  `the striker runs in across their line (to ${stJob && stJob.w} m across, from ${r.run.stAt}), and ${r.run.cm}, told to run in behind, goes into the lane he left (${thirdJob && thirdJob.w} m across)`);
ok(!r.bal.runs.some(R => R.third), `told BALANCED, he doesn't: he gives the man on the ball a pass instead (runs: ${r.bal.runs.map(R => R.q).join(', ')})`);

// --- IN AT THE BACK POST: a ball through to the edge of their box, in the middle -- the wide men go in --------------------
r = await page.evaluate(() => { const T = window.__T; T.reset(); window.__clearIns(); window.__liv(); window.__city(24, [-8, 2, 12], 34);
  const cm = window.__by('G', 'CM', 'atk', 1), st = window.__by('G', 'ST'), wl = window.__by('G', 'W', 'atk', 0), wr = window.__by('G', 'W', 'atk', 1);
  window.__at(cm, 64, 4); window.__at(st, 72, -2); window.__at(wl, 62, -28); window.__at(wr, 62, 28);
  const a = T.atkOf('G'), tx = a > 0 ? (99.75 - 19) * T.MK : T.FW - (99.75 - 19) * T.MK;
  window.__pass(cm, st, { x: tx, y: T.YC - 2 * T.MK }); const p = window.__plan();
  return { w: p.jobs.filter(j => j.pos === 'W'), p }; });
info('a ball through to the striker, 19 m out in the middle: ' + show(r.p));
ok(r.w.length === 2 && r.w.every(j => j.job === 'BACKPOST' && Math.abs(j.w) < 14), `both wide men go in at the back post, in the box, not out on their touchlines (${r.w.map(j => j.job + ' ' + j.u + ',' + j.w).join(' / ')})`);

process.exitCode = rep.finish();
await browser.close();
