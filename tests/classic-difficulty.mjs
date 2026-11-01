// FOOTBALL CLASSIC, DIFFICULTY (v89): five levels -- RELAXED, NORMAL, PRO, STAR (the computer at full strength, as it
// always played) and CHAMPION (a notch past it). A fresh browser starts at NORMAL; it's a row in SETTINGS and a tap on the
// exhibition screen, and it's kept. It turns the computer's side only -- how wide its passes, crosses and shots go, how far
// along your man's run its men read him, how keen they are to go to ground, how far they reach to cut out a pass, how
// noisy its choices are -- your own men as they always were. On RELAXED and NORMAL your man heads their cross clear himself
// if you don't; at STAR he doesn't. On a copy of the game that lets the test reach the computer's men and set the scene.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={players:()=>players, keepers:()=>keepers, ball:()=>ball, controlled:()=>controlled, setControlled, aiCross, passSpray, crossSpray, readRun, cpu, PREFS, DIFFS, '
  + 'FW, FH, YC, MK, atkOf, simNow:()=>simNow, score:()=>[scoreG,scoreR], drop:()=>{ gkHold=null; }, stopped:()=>restartT>0||scoredT>0, '
  + 'freeze:()=>{ restartT=0; offsideT=0; scoredT=0; gkHold=null; kickT=0; kickBy=null; kickTo=null; restartInfo=null; skill=null; oneTouch=null; ftAim=null; recvAuto=null; matchClock=0; switchLock=null; }};\n  const LAB_TITLE=');
patch('  function headClear(p){\n', '  function headClear(p){\n    if(p===controlled) window.__hcMine=(window.__hcMine||0)+1;\n');   // (your man's own headers clear)
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-diff-')), 'classic.html');
writeFileSync(copy, src);

// a fresh browser, nothing kept: it's NORMAL (a page of its own: the harness starts its pages at STAR)
const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
{ const fp = await browser.newPage(); await fp.goto('file://' + copy); await fp.waitForTimeout(500);
  const fresh = await fp.evaluate(() => window.__T.PREFS.diff); await fp.close();
  ok(fresh === 'normal', 'a fresh browser starts at NORMAL (' + fresh + ')'); }

// SETTINGS: the row, its five levels, picked and kept
await page.click('#smItems [data-act="settings"]').catch(() => {});
await page.waitForTimeout(300);
const row = await page.evaluate(() => [...document.querySelectorAll('#setRows .setOpt[data-pref="diff"]')].map(b => b.textContent));
info('the DIFFICULTY row: ' + JSON.stringify(row));
ok(row.join(',') === 'RELAXED,NORMAL,PRO,STAR,CHAMPION', 'SETTINGS has a DIFFICULTY row: RELAXED, NORMAL, PRO, STAR, CHAMPION');
await page.click('#setRows .setOpt[data-pref="diff"][data-val="champion"]');
await page.reload(); await page.waitForTimeout(600);
const kept = await page.evaluate(() => window.__T.PREFS.diff);
ok(kept === 'champion', 'picked, it\'s kept (' + kept + ' after a reload)');

// THE EXHIBITION SCREEN: it's there under the title, a tap takes it on to the next (CHAMPION round to RELAXED)
await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show');
const chip0 = await page.textContent('#exhPanel .exhDiff');
await page.click('#exhPanel .exhDiff'); await page.waitForTimeout(100);
const chip1 = await page.textContent('#exhPanel .exhDiff'), now1 = await page.evaluate(() => window.__T.PREFS.diff);
info('the exhibition screen: ' + JSON.stringify({ chip0, chip1, now1 }));
ok(/CHAMPION/.test(chip0) && /RELAXED/.test(chip1) && now1 === 'relaxed', 'on the exhibition screen, a tap takes it to the next level (' + chip0.trim() + ' → ' + chip1.trim() + ')');
await page.click('#exhGo'); await page.waitForTimeout(800);

// THE COMPUTER'S SIDE ONLY: with the same draws, at each level -- a long pass's spread and a cross's spread, by a man of
// theirs and one of ours; how far along a running man's way their defender reads him (and ours); their reach and tackle
const levels = await page.evaluate(() => { const T = window.__T, R0 = Math.random, out = {};
  const r = T.players().find(q => q.team === 'R' && q.role === 'MID'), g = T.players().find(q => q.team === 'G' && q.role === 'MID');
  const rd = T.players().find(q => q.team === 'R' && q.role === 'DEF'), gd = T.players().find(q => q.team === 'G' && q.role === 'DEF');
  const runner = { x: T.FW / 2, y: T.YC, vx: 200, vy: 0 };
  let n = 0; const wide = () => { n = 0; };   // (the widest draw: 1, then 0 -- for a*2-1, and for a-b)
  try { Math.random = () => (n++ % 2 ? 0 : 1);
    for(const k of ['relaxed', 'normal', 'pro', 'star', 'champion']){ T.PREFS.diff = k;
      const rr = T.readRun(rd, runner, runner), gr = T.readRun(gd, runner, runner);
      wide(); const passR = T.passSpray(600, r); wide(); const passG = T.passSpray(600, g); wide(); const crossR = T.crossSpray(r, 0.5); wide(); const crossG = T.crossSpray(g, 0.5);
      out[k] = { passR: +passR.toFixed(4), passG: +passG.toFixed(4), crossR: +crossR.toFixed(4), crossG: +crossG.toFixed(4), all1: Object.values(T.cpu(r)).every(v => v === 1 || v === false),
        readR: +(rr.x - runner.x).toFixed(1), readG: +(gr.x - runner.x).toFixed(1), reach: T.cpu(r).reach, tackle: T.cpu(r).tackle, shot: T.cpu(r).shot }; }
  } finally { Math.random = R0; }
  T.PREFS.diff = 'relaxed'; return out; });
info('at each level (the widest draw): ' + JSON.stringify(levels));
const L = ['relaxed', 'normal', 'pro', 'star', 'champion'], col = k => L.map(l => levels[l][k]);
const down = a => a.every((v, i) => i === 0 || v < a[i - 1]), up = a => a.every((v, i) => i === 0 || v > a[i - 1]), flat = a => a.every(v => v === a[0]);
ok(down(col('passR')) && down(col('crossR')) && up(col('readR')) && up(col('reach')) && up(col('tackle')) && up(col('shot')),
  'from RELAXED to CHAMPION the computer\'s passes and crosses go truer (a long pass ' + col('passR').join(' / ') + ' rad), it reads your run further on (' + col('readR').join(' / ') + ' px), reaches, tackles and finishes better');
ok(flat(col('passG')) && flat(col('crossG')) && flat(col('readG')), 'your own men are the same at every level (' + levels.star.passG + ' rad, ' + levels.star.readG + ' px)');
ok(levels.star.all1 && !levels.normal.all1, 'at STAR every one of its levers is at 1: the computer at full strength, as it always played');

// THE ASSIST: their cross from the byline toward 9 m out, one of theirs attacking it and our marker (yours) left alone
// -- NORMAL: he heads some clear himself; STAR: none
const crosses = (diff, N) => page.evaluate(({ diff, N }) => new Promise(res => { const T = window.__T, b = T.ball(); T.PREFS.diff = diff;
  const kp = T.keepers().find(k => k.team === 'G'), out = -kp.side, gx = kp.side < 0 ? 0 : T.FW, MK = T.MK;
  const R = T.players().filter(q => q.team === 'R'), G = T.players().filter(q => q.team === 'G');
  const cr = R.find(q => q.role === 'MID') || R[0], att = R.find(q => q.role === 'ATT') || R[1], mk = G.find(q => q.role === 'DEF') || G[0];
  T.setControlled(mk); const tally = { cleared: 0, goal: 0, n: 0 }; let i = 0;
  const one = () => { if(i >= N) return res(tally); const sd = i++ % 2 ? 1 : -1;
    T.freeze(); T.drop();
    for(const q of T.players()) if(q !== cr && q !== att && q !== mk){ q.x = T.FW / 2 + out * 300 + (q.team === 'R' ? 0 : 60); q.y = 60; q.vx = q.vy = 0; q.state = 'normal'; }
    Object.assign(kp, { x: kp.homeX, y: T.YC, mode: 'line', claimCd: 0, diveT: 0, groundT: 0, holdT: 0, heldT: 0, vx: 0, vy: 0, spreadT: 0, spreadDn: 0, closeT: -9, gkRoaming: false });
    const spot = { x: gx + out * 9 * MK, y: T.YC + sd * MK };
    Object.assign(cr, { x: gx + out * 1.5 * MK, y: T.YC + sd * 23 * MK, vx: 0, vy: 0, state: 'normal', facing: { x: -out, y: 0 } });
    Object.assign(att, { x: spot.x + out * 5 * MK, y: spot.y + sd * 3 * MK, vx: 0, vy: 0, state: 'normal', z: 0 });
    Object.assign(mk, { x: att.x - out * 1.2 * MK, y: att.y, vx: 0, vy: 0, state: 'normal', z: 0 });
    Object.assign(b, { ownedBy: null, dribbler: null, x: cr.x, y: cr.y - sd * 20, z: 0, vx: 0, vy: 0, vz: 0, crossT: 0, shotT: 0, lastTouch: 'R' });
    const s0 = T.score()[1], h0 = window.__hcMine || 0; T.aiCross(cr, { x: spot.x, y: spot.y, who: att }); const t0 = T.simNow(); let cl = false;
    (function tick(){ if((window.__hcMine || 0) > h0) cl = true;
      const done = T.score()[1] > s0 ? 'goal' : (T.stopped() || T.simNow() - t0 > 3) ? 'other' : null;
      if(done){ tally.n++; if(done === 'goal') tally.goal++; if(cl) tally.cleared++; return one(); }
      requestAnimationFrame(tick); })(); };
  one(); }), { diff, N });
const nrm = await crosses('normal', 16), star = await crosses('star', 16);
info('their crosses, our marker (yours) left alone -- NORMAL: ' + JSON.stringify(nrm) + '; STAR: ' + JSON.stringify(star));
ok(nrm.cleared >= 4 && star.cleared === 0 && nrm.goal < star.goal, 'on NORMAL your man heads their cross clear himself if you don\'t (' + nrm.cleared + ' of 16, ' + nrm.goal + ' in); at STAR he doesn\'t (' + star.cleared + ', ' + star.goal + ' in)');

process.exitCode = rep.finish();
await browser.close();
