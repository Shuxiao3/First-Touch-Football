// The computer players keep their heads while the ball moves. A man running with it knocks it a stride ahead every few
// steps, and a pass takes a moment to arrive: through both, his side keeps playing as the side with the ball (its runs,
// its shape, finding space) and the other side keeps defending as a block -- nobody but the man it's for drops it all to
// chase the ball. Each side's sense of who has it keeps up, too. Plays an exhibition with every player on the
// computer, on a copy of the game that lets the test see who has the ball and what each player has decided (the
// decision tags the AI sets for its debug log).
import { open, startExhibition } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('      if(p===controlled){stepOutfield(p,hi.ix,hi.iy,dt);}', '      if(p===controlled&&!window.__aiAll){stepOutfield(p,hi.ix,hi.iy,dt);}');   // your man on the computer too
patch('  const LAB_TITLE=', '  window.__T={players:()=>players, ball:()=>ball, gk:()=>gkHold, heldBy, possConf:()=>possConfTeam, live:()=>!(restartT>0||scoredT>0||offsideT>0)};\n  const LAB_TITLE=');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-ai-')), 'index.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ fastFrames: true, url: 'file://' + copy });
const ok = rep.ok, info = rep.info;
await page.addInitScript(() => { window.__aiAll = true; });
await page.reload(); await page.waitForTimeout(600);
await startExhibition(page);
await page.waitForTimeout(500);

// the loose-ball scramble: the decisions a player makes when the ball is nobody's
const SCRAMBLE = /^(LOOSE-|COLLECT|CONTEST|COVER$|RECEIVER)/;
const tally = { dribble: { n: 0, off: 0, men: 0 }, pass: { n: 0, off: 0, men: 0 }, held: 0, sense: 0 };
const t0 = Date.now();
while(Date.now() - t0 < 45000){
  const s = await page.evaluate(() => {
    const T = window.__T; if(!T || !T.live() || T.gk()) return null;
    const b = T.ball(), h = T.heldBy(); if(!h) return null;
    const kind = b.ownedBy ? 'owned' : h === b.dribbler ? 'dribble' : 'pass';
    const others = T.players().filter(p => p !== h);
    return { kind, team: h.team, conf: T.possConf(), tags: others.map(p => p.dbgTag || '') };
  });
  if(s){
    tally.held++; if(s.conf === s.team) tally.sense++;
    const k = tally[s.kind];
    if(k){ k.n++; k.men += s.tags.length; k.off += s.tags.filter(t => SCRAMBLE.test(t)).length; }
  }
  await page.waitForTimeout(40);
}
const pct = (a, b) => (100 * a / Math.max(1, b)).toFixed(0) + '%';
info(`samples: ${tally.dribble.n} with the ball knocked on, ${tally.pass.n} with a pass on its way, ${tally.held} with someone's ball in all`);
ok(tally.dribble.n >= 30 && tally.pass.n >= 30, 'the match gets going: plenty of dribbling and passing to look at');
ok(tally.dribble.off / Math.max(1, tally.dribble.men) <= 0.15, `while the man on the ball knocks it on, the others keep their sides' logic (scrambling for it: ${pct(tally.dribble.off, tally.dribble.men)})`);
ok(tally.pass.off / Math.max(1, tally.pass.men) <= 0.15, `while a pass is on its way, the others keep their sides' logic (scrambling for it: ${pct(tally.pass.off, tally.pass.men)})`);
ok(tally.sense / Math.max(1, tally.held) >= 0.85, `each side knows who has the ball (right ${pct(tally.sense, tally.held)} of the time)`);

await browser.close();
process.exit(rep.finish() ? 1 : 0);
