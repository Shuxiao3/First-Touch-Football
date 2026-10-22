// Positional play, the neutral style. With the ball a side works off one plan: every man has a job -- the back line and
// the holding midfielder behind the ball as rest defence, the wide men on the touchlines, a forward on their last line
// and one between their lines, two men offering the man on the ball a pass at different angles -- and its men don't
// bunch. Without it, it defends as a unit: one man presses the ball and the next covers him, and when the man on it is
// in trouble they go after it together. Plays an exhibition with every player on the computer, on a copy of the game
// that lets the test see who has the ball and what each player has decided (the decision tags the AI sets for its
// debug log).
import { open, startExhibition } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('      if(p===controlled){stepOutfield(p,hi.ix,hi.iy,dt);}', '      if(p===controlled&&!window.__aiAll){stepOutfield(p,hi.ix,hi.iy,dt);}');   // your man on the computer too
patch('  const LAB_TITLE=', '  window.__T={players:()=>players, ball:()=>ball, gk:()=>gkHold, heldBy, atkOf, controlled:()=>controlled, FW, FH, YC, live:()=>!(restartT>0||scoredT>0||offsideT>0)};\n  const LAB_TITLE=');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-pp-')), 'index.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ fastFrames: true, url: 'file://' + copy });
const ok = rep.ok, info = rep.info;
await page.addInitScript(() => { window.__aiAll = true; });
await page.reload(); await page.waitForTimeout(600);
await startExhibition(page);
await page.waitForTimeout(500);

const JOBS = /^(REST|PIVOT|WIDTH|INSIDE|BACKPOST|PIN|POCKET|NEARPOST|FARPOST|CUTBACK|SUPPORT|RUN)$/;
const T = { owned: 0, men: 0, onJob: 0, sup: 0, fin: 0, rest: 0, bunched: 0, pressed: 0, covered: 0, cover2: 0, cover2gs: 0, lane: 0 };
const t0 = Date.now();
while(Date.now() - t0 < 50000){
  const s = await page.evaluate(() => {
    const A = window.__T; if(!A || !A.live() || A.gk()) return null;
    const b = A.ball(), h = A.heldBy(); if(!h || b.ownedBy !== h) return null;
    const atk = A.atkOf(h.team), U = x => atk > 0 ? x : A.FW - x, ctl = A.controlled();
    const mates = A.players().filter(p => p.team === h.team && p !== h), opp = A.players().filter(p => p.team !== h.team);
    const plan = mates.filter(p => p !== ctl);
    let bunched = 0; for(let i = 0; i < plan.length; i++) for(let k = i + 1; k < plan.length; k++) if(Math.hypot(plan[i].x - plan[k].x, plan[i].y - plan[k].y) < 100) bunched++;
    const first = opp.reduce((m, o) => Math.hypot(o.x - h.x, o.y - h.y) < Math.hypot(m.x - h.x, m.y - h.y) ? o : m, opp[0]);
    const pressed = Math.hypot(first.x - h.x, first.y - h.y) < 100;
    const covered = pressed && opp.some(o => o !== first && U(o.x) > U(h.x) && Math.hypot(o.x - h.x, o.y - h.y) < 230);   // (goal-side of him, from their end)
    const cov = opp.find(o => o.dbgTag === 'COVER2');                                                                       // the cover man, if there is one:
    const covGs = !!cov && U(cov.x) > U(h.x) - 20 && Math.hypot(cov.x - h.x, cov.y - h.y) < 400;                           // goal-side of him and near
    return { tags: plan.map(p => p.dbgTag || ''), uBall: U(b.x), FW: A.FW, behind: mates.filter(p => U(p.x) < U(b.x) - 200).length,
             bunched, pressed, covered, cov: !!cov, covGs, oppTags: opp.map(p => p.dbgTag || '') };
  });
  if(s){
    T.owned++; T.men += s.tags.length; T.onJob += s.tags.filter(t => JOBS.test(t)).length;
    if(s.tags.includes('SUPPORT')) T.sup++;
    if(s.uBall > s.FW * 2 / 3){ T.fin++; if(s.behind >= 2) T.rest++; }
    if(s.bunched) T.bunched++;
    if(s.pressed){ T.pressed++; if(s.covered) T.covered++; }
    if(s.cov){ T.cover2++; if(s.covGs) T.cover2gs++; }
    if(s.oppTags.includes('PRESS-LANE')) T.lane++;
  }
  await page.waitForTimeout(40);
}
const pct = (a, b) => (100 * a / Math.max(1, b)).toFixed(0) + '%';
info(`samples: ${T.owned} with a man on the ball, ${T.fin} of them in the final third, ${T.pressed} with him pressed`);
ok(T.owned >= 150, 'the match gets going: plenty of time on the ball to look at');
ok(T.onJob / Math.max(1, T.men) >= 0.8, `with the ball, the computer players work off the plan (on a job: ${pct(T.onJob, T.men)})`);
ok(T.sup / Math.max(1, T.owned) >= 0.6, `someone comes to support the man on the ball (${pct(T.sup, T.owned)} of the time)`);
ok(T.fin >= 20 && T.rest / Math.max(1, T.fin) >= 0.85, `with the ball in their third, two men or more stay back behind it (${pct(T.rest, T.fin)} of the time)`);
ok(T.bunched / Math.max(1, T.owned) <= 0.25, `the men off the ball don't bunch: two within 4 m of each other ${pct(T.bunched, T.owned)} of the time`);
info(`with the man on the ball pressed, a second man goal-side of him within 9 m: ${pct(T.covered, T.pressed)} of the time`);
ok(T.cover2 >= 20 && T.cover2gs / Math.max(1, T.cover2) >= 0.75, `with the ball pressed, the next man covers: goal-side of the man on it (${pct(T.cover2gs, T.cover2)} of ${T.cover2} looks)`);
ok(T.lane > 0, `pressing together: a man cuts out the pass while the ball is pressed (seen ${T.lane} times)`);

await browser.close();
process.exit(rep.finish() ? 1 : 0);
