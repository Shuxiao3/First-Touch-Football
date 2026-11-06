// FOOTBALL CLASSIC, THE KICK-OFF (v84): at the start, after a goal and at the start of the second half, everyone is in
// his own half (a metre short of halfway at least) and the side not kicking off is outside the centre circle; the
// kicking side's most advanced man in the middle is on the ball at the spot. Play holds a moment -- nobody moves, the
// clock doesn't run -- and then he rolls it back to a team-mate behind him, and it's on (yours: you're put on the man
// it's going to). For eight club pairings, each side kicking off; then after a goal; then the second half's -- and after
// the break, two men swapped and the width changed on the tactics screen, each man's spot still the one it shows (v129).
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={players:()=>players, keepers:()=>keepers, ball:()=>ball, resetKickoff, FW, FH, YC, MK, CIRCLE_R, KICK_HOLD, atkOf, EXH, CLUBS, '
  + 'controlled:()=>controlled, kick:()=>({t:kickT, by:kickBy, to:kickTo}), simNow:()=>simNow, clock:()=>matchClock, half:()=>half, score:()=>scoreG+scoreR, '
  + 'goal:side=>goal(side), scored:()=>scoredT, breakT:()=>breakT, runout:()=>{ matchClock=halfLenSec()-0.05; }, pass:(p,q)=>passTo(p,q), '
  + 'slotsFor, formFor, mtSwapPos, setMenuWidth, LINEUP:()=>LINEUP, gDir:()=>gDir};\n  const LAB_TITLE=');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-kick-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
const PAIRS = [['LIV', 'MCI'], ['ARS', 'TOT'], ['NEW', 'AVL'], ['CHE', 'BHA'], ['MUN', 'LEE'], ['FUL', 'BRE'], ['EVE', 'CRY'], ['SUN', 'IPS']];
const start = async (a, b) => { await page.goto('file://' + copy); await page.waitForTimeout(500);
  await page.evaluate(([a, b]) => { window.__T.EXH.you = a; window.__T.EXH.opp = b; }, [a, b]);
  await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show'); await page.click('#exhGo'); await page.waitForTimeout(300);
  await page.evaluate(HELPERS); };
// where everyone is at a kick-off, and what the man on the spot is: -> wrong-half, in-circle, taker
const HELPERS = `window.__where = k => { const T = window.__T, tk = T.ball().ownedBy;
  const to = T.kick().to, b = T.ball(), f = tk && tk.facing, u = (x, y) => { const l = Math.hypot(x, y) || 1; return [x / l, y / l]; };
  const [tx, ty] = tk && to ? u(to.x - tk.x, to.y - tk.y) : [0, 0], [bx, by] = tk ? u(b.x - tk.x, b.y - tk.y) : [0, 0];
  return { over: T.players().filter(p => p !== tk && T.atkOf(p.team) * (p.x - T.FW / 2) > -0.99 * T.MK).length,   // (the man on the ball at it: the one man who may be over halfway -- v137)
    face: tk && to ? +(f.x * tx + f.y * ty).toFixed(2) : -9, ballAt: tk ? +(f.x * bx + f.y * by).toFixed(2) : -9, spot: +(Math.hypot(b.x - T.FW / 2, b.y - T.YC) / T.MK).toFixed(2),
    circle: T.players().filter(p => p.team !== k && Math.hypot(p.x - T.FW / 2, p.y - T.YC) < T.CIRCLE_R + 0.99 * T.MK).length,
    taker: tk && tk.team === k && Math.hypot(tk.x - T.FW / 2, tk.y - T.YC) < 2 * T.MK ? (tk.slotAtk && tk.slotAtk.pos) || tk.role : null,
    adv: tk ? T.players().filter(p => p.team === k && Math.abs(p.y - T.YC) < T.FH * 0.22 && p !== tk && T.atkOf(k) * (p.homeX - tk.homeX) > 1).length : -1 }; };
// a kick-off watched through its hold and the pass: -> what moved, the clock, the ball's way, who it's to
window.__watch = () => new Promise(res => { const T = window.__T, k0 = T.kick(), by = k0.by, to = k0.to; if(!by) return res({ hold: 0, moved: -1, played: null });
  const a = T.atkOf(by.team);
  const P0 = T.players().map(p => [p, p.x, p.y]), c0 = T.clock(), t0 = T.simNow(); let moved = 0, played = null, clockHold = null;
  (function tick(){ const k = T.kick(), b = T.ball();
    if(k.t > 0){ for(const [p, x, y] of P0) if(p !== by && Math.hypot(p.x - x, p.y - y) > 2) moved++; clockHold = T.clock() - c0; }
    if(!played && k.t <= 0 && !b.ownedBy && Math.hypot(b.vx, b.vy) > 50) played = { at: +(T.simNow() - t0).toFixed(2), back: a * b.vx < 0, rcv: b.intendedRcv === to, mate: to && to.team === by.team, behind: to && a * (to.x - T.FW / 2) < 0, yours: T.controlled() === to };
    if(T.simNow() - t0 < 2.5) return requestAnimationFrame(tick);
    res({ hold: k0.t, moved, clockHold: +(clockHold || 0).toFixed(3), played, team: by.team }); })(); });`;
const where = k => page.evaluate(k => window.__where(k), k);
const watch = () => page.evaluate(() => window.__watch());

const rows = [];
for(const [a, b] of PAIRS){ await start(a, b);
  for(const k of ['G', 'R']){ const [w, s] = await page.evaluate(async k => { window.__T.resetKickoff(k); const w = window.__where(k); return [w, await window.__watch()]; }, k); rows.push(Object.assign({ pair: a + '-' + b, k }, w, s)); } }
info('kick-offs: ' + rows.map(r => r.pair + ' ' + r.k + ': ' + JSON.stringify({ over: r.over, circle: r.circle, taker: r.taker, moved: r.moved, clock: r.clockHold, played: r.played })).join(' | '));
ok(rows.every(r => r.over === 0), 'everyone in his own half, a metre short of halfway at least, the man on the ball at it on his own side (' + rows.length + ' kick-offs, eight club pairings, each side)');
ok(rows.every(r => r.circle === 0), 'the side not kicking off outside the centre circle');
ok(rows.every(r => r.taker && r.adv === 0), 'on the spot with the ball: the kicking side\'s most advanced man in the middle (' + [...new Set(rows.map(r => r.taker))].join(', ') + ')');
ok(rows.every(r => r.face > 0.95 && r.ballAt > 0.95 && r.spot < 0.05), 'he faces his own side -- the man he\'ll roll it back to -- with the ball at his feet on the spot between them (v137: he faced the other side and knocked it back past himself; facing ' + Math.min(...rows.map(r => r.face)) + ' at worst)');
ok(rows.every(r => r.moved === 0 && r.clockHold === 0), 'it holds a moment: nobody moves and the clock doesn\'t run');
ok(rows.every(r => r.played && r.played.back && r.played.rcv && r.played.mate && r.played.behind && Math.abs(r.played.at - r.hold) < 0.15),
  'then he rolls it back to a team-mate behind him (' + rows.map(r => r.played && r.played.at).slice(0, 4).join(', ') + ' s in)');
ok(rows.filter(r => r.team === 'G').every(r => r.played && r.played.yours), 'yours: you\'re put on the man it\'s going to');

// PLAYED IN THE HOLD (yours, a tap on PASS): it's on at once -- no more holding
await page.evaluate(() => window.__T.resetKickoff('G'));
const early = await page.evaluate(() => new Promise(res => { const T = window.__T, b = T.ball(), k = T.kick();
  T.pass(k.by, k.to); const t0 = T.simNow();
  (function tick(){ if(T.simNow() - t0 < 0.1) return requestAnimationFrame(tick); res({ hold0: k.t, hold: T.kick().t, by: !!T.kick().by }); })(); }));
ok(early.hold0 > 0 && early.hold === 0 && !early.by, 'played in the hold (a tap on PASS): it\'s on at once');

// AFTER A GOAL: the side that conceded kicks off, the same way
await start('LIV', 'MCI');
const [g, gw, gs] = await page.evaluate(() => new Promise(res => { const T = window.__T, s0 = T.score(); T.goal(1); const t0 = T.simNow();
  (function tick(){ if(T.scored() > 0 || !T.kick().by) return requestAnimationFrame(tick); const k = T.kick(), g = { goals: T.score() - s0, team: k.by.team, hold: k.t };
    const w = window.__where(g.team); window.__watch().then(s => res([g, w, s])); })(); }));
info('after a goal: ' + JSON.stringify({ g, gw, played: gs.played }));
ok(g.goals === 1 && g.team && gw.over === 0 && gw.circle === 0 && gw.taker && gw.face > 0.95 && gs.moved === 0 && gs.played && gs.played.back && gs.played.rcv,
  'after a goal: the side that conceded (' + g.team + ') kicks off, everyone in his own half, it held, rolled back');

// THE SECOND HALF: after the break, Red kick off, the same way
const [h, hw, hs] = await page.evaluate(() => new Promise(res => { const T = window.__T, b = T.ball(); T.resetKickoff(); b.ownedBy = null; b.lastTouch = null; b.vx = b.vy = 0; T.runout(); const t0 = T.simNow();
  (function tick(){ if(T.half() === 1 && T.simNow() - t0 < 22) return requestAnimationFrame(tick);   // (an attack on as the clock runs out plays on: up to ADV_MAX, 20 s -- v111's computer is more often attacking then)
    (function wait(){ if(T.breakT() > 0) return requestAnimationFrame(wait); const k = T.kick(), h = { half: T.half(), team: k.by && k.by.team, hold: k.t };
      const w = window.__where('R'); window.__watch().then(s => res([h, w, s])); })(); })(); }));
info('the second half: ' + JSON.stringify({ h, hw, played: hs.played }));
ok(h.half === 2 && h.team === 'R' && h.hold > 0 && hw.over === 0 && hw.circle === 0 && hw.face > 0.95 && hs.played && hs.played.back && hs.played.rcv,
  'the second half: after the break Red kick off, the same way (held, rolled back)');

// AFTER THE BREAK, A CHANGE ON THE TACTICS SCREEN (v129): two of yours swapped and the width changed -- every man's spot the
// one the tactics screen shows him in, mirrored with the ends (it used to be dealt out for the first half's: a left-back
// sent to right-back, and into the other half)
const ht = await page.evaluate(() => { const T = window.__T, li = T.LINEUP().G, bad = [];
  T.mtSwapPos('G', 'atk', 0, 1); T.setMenuWidth('G', 'atk', 1.18);
  for(const ph of ['atk', 'def']){ const can = T.slotsFor('G', T.formFor('G', ph), ph);   // (as the tactics screen lays them out)
    for(const p of T.players().filter(q => q.team === 'G')){ const s = ph === 'atk' ? p.slotAtk : p.slotDef, c = can[li[ph].indexOf(p.squadIdx)];
      if(!c || Math.abs((s.homeY - T.YC) + (c.homeY - T.YC)) > 1 || Math.abs(s.homeX - (T.FW - c.homeX)) > 1 || s.wide !== -c.wide) bad.push(ph + ' ' + p.pname + ' ' + s.pos); } }
  T.mtSwapPos('G', 'atk', 0, 1); T.setMenuWidth('G', 'atk', 1);
  return { gDir: T.gDir(), bad }; });
info('after the break, two swapped and the width changed: ' + JSON.stringify(ht));
ok(ht.gDir === -1 && !ht.bad.length, 'after the break, a change on the tactics screen: every man in the spot it shows him in, on his own side\'s flank and in his own half (v129)' + (ht.bad.length ? ': wrong ' + ht.bad.slice(0, 4).join(', ') : ''));

process.exitCode = rep.finish();
await browser.close();
