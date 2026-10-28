// FOOTBALL CLASSIC, THE COMPUTER'S SKILL MOVES: taking a man on, one of the computer's men who has the moves (his stars)
// does one -- only those his stars allow: a one-star man the flick, a three-star man up to the croqueta, roulette and
// Cruyff turn, a five-star man the rainbow, sombrero, elastico and heel flick too -- rather than just swerving by. Who: wingers and wide
// midfielders most, central midfielders and strikers less, a full-back only on the attack and only when he's clearly the
// better man, a centre-back never; how keen: how much better he is on the ball than the man in front of him is at
// stopping him (not how good he is overall); where: on the touchline keenest, never in his own half. And every move's pace
// and reach are the man's Dribbling, yours too: at 10 as the dials have them, at 1 1.6 times as long and 30% less far.
// On a copy of the game that lets the test reach the players and the moves, everyone on the computer.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={P, players:()=>players, keepers:()=>keepers, controlled:()=>controlled, ball:()=>ball, simNow:()=>simNow, FW, FH, YC, MK, atkOf, applySlot, own, '
  + 'aiSkillKeen, aiSkillMove, mkSkill, skillPaceOf, skillReachOf, ROULETTE_TURN, freeze:()=>{ restartT=0; offsideT=0; scoredT=0; gkHold=null; skill=null; oneTouch=null; ftAim=null; recvAuto=null; }};\n  const LAB_TITLE=');
patch('      if(p===controlled){ if(!skillStep(p,dt)) stepOutfield(p,hi.ix,hi.iy,dt); }', '      if(p===controlled&&!window.__aiAll){ if(!skillStep(p,dt)) stepOutfield(p,hi.ix,hi.iy,dt); }');   // (your man on the computer too)
patch("    lastGrade=SKILL_NAME[kind]; gradeColor=p.team==='G'?'#9dff3c':'#ff5a4d'; gradeFade=0.8;\n    return kind;",
  "    lastGrade=SKILL_NAME[kind]; gradeColor=p.team==='G'?'#9dff3c':'#ff5a4d'; gradeFade=0.8;\n    if(window.__SK) window.__SK.push({team:p.team, num:p.num, kind});\n    return kind;");   // (every move the computer makes)
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-skill-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show'); await page.click('#exhGo'); await page.waitForTimeout(1200);

// HOW KEEN, man by man: a winger, a central midfielder, a full-back (holding, and pushed on), a centre-back, each with
// the ball in their third against a man in front of him, his skills against that man's
const keen = await page.evaluate(() => { const T = window.__T, R = T.players().filter(q => q.team === 'R'), G = T.players().filter(q => q.team === 'G');
  const p = R[0], d = G[0], atk = T.atkOf('R'), C = { atk }, keep = { s: p.stats, a: p.slotAtk, d: d.stats };
  const as = (pos, role, wide) => { p.slotAtk = Object.assign({}, keep.a, { pos, role, wide, lineSize: 3, isWidthLine: true, si: -1 }); T.applySlot(p, p.slotAtk); };
  const at = (u, y) => { p.x = atk > 0 ? u : T.FW - u; p.y = y; };
  const sk = (me, him) => { p.stats = Object.assign({}, keep.s, { dribbling: me, ballControl: me, agility: me }); d.stats = Object.assign({}, keep.d, { tackle: him, defIQ: him, agility: him }); };
  const out = {};
  sk(8, 5); as('W', 'ATT', 1); at(T.FW * 0.75, T.YC + T.FH * 0.4); out.wingTouchline = T.aiSkillKeen(p, d, C);
  at(T.FW * 0.75, T.YC + T.FH * 0.1); out.wingInside = T.aiSkillKeen(p, d, C);
  sk(8, 8); at(T.FW * 0.75, T.YC + T.FH * 0.4); out.wingLevel = T.aiSkillKeen(p, d, C);
  sk(5, 2); out.wingWeakVsWeaker = T.aiSkillKeen(p, d, C);                       // (the same edge, both poorer)
  sk(8, 5); at(T.FW * 0.4, T.YC + T.FH * 0.4); out.wingOwnHalf = T.aiSkillKeen(p, d, C);
  at(T.FW * 0.75, T.YC + T.FH * 0.1); as('CM', 'MID', 0); out.cm = T.aiSkillKeen(p, d, C);
  as('CB', 'DEF', 0); out.cb = T.aiSkillKeen(p, d, C);
  as('FB', 'DEF', 1); at(T.FW * 0.6, T.YC + T.FH * 0.4); out.fbHolding = T.aiSkillKeen(p, d, C);
  at(T.FW * 0.75, T.YC + T.FH * 0.4); out.fbOn = T.aiSkillKeen(p, d, C);
  sk(6, 5); out.fbOnSmallEdge = T.aiSkillKeen(p, d, C);
  p.stats = keep.s; d.stats = keep.d; p.slotAtk = keep.a; T.applySlot(p, keep.a);
  for(const k in out) out[k] = +out[k].toFixed(2); return out; });
info('how keen: ' + JSON.stringify(keen));
ok(keen.wingTouchline > 0.8 && keen.wingTouchline > keen.wingInside, 'a winger 3 better than the man in front of him on the touchline in their third is keenest (' + keen.wingTouchline + ', ' + keen.wingInside + ' infield)');
ok(keen.wingLevel < keen.wingTouchline * 0.5 && Math.abs(keen.wingWeakVsWeaker - keen.wingTouchline) < 0.01, 'it\'s how much better he is than that man, not how good: level, ' + keen.wingLevel + '; a 5 against a 2, as keen as an 8 against a 5');
ok(keen.wingOwnHalf === 0 && keen.cb === 0, 'never in his own half, and never a centre-back');
ok(keen.cm > 0 && keen.cm < keen.wingInside, 'a central midfielder now and then (' + keen.cm + ', the winger there ' + keen.wingInside + ')');
ok(keen.fbHolding === 0 && keen.fbOn > 0 && keen.fbOnSmallEdge === 0, 'a full-back only pushed on, and only when he\'s clearly the better man (' + keen.fbOn + '; 1 better: ' + keen.fbOnSmallEdge + ')');

// A MOVE'S PACE AND REACH ARE HIS DRIBBLING
const pace = await page.evaluate(() => { const T = window.__T, p = T.players()[1], keep = p.stats, out = {};
  for(const v of [10, 5.5, 1]){ p.stats = Object.assign({}, keep, { dribbling: v }); p.vx = p.vy = 0; p.facing = { x: 1, y: 0 };
    const c = T.mkSkill(p, { kind: 'croq', d: { x: 0, y: 1 } }), s = T.mkSkill(p, { kind: 'spin', sense: 1 }), r = T.mkSkill(p, { kind: 'rainbow' });
    out[v] = { croqT: +c.T.toFixed(3), croqD: +c.D.toFixed(1), spinT: +s.T.toFixed(3), spinD: +s.D.toFixed(1), rainbowT: +r.T.toFixed(3), rbDist: +r.rbDist.toFixed(1) }; }
  p.stats = keep; out.dial = { croqT: T.P.skCroqT.val, croqD: T.P.skCroqDist.val, spinT: T.P.skSpinT.val * T.ROULETTE_TURN / (2 * Math.PI), spinD: T.P.skSpinDist.val }; return out; });   // (the roulette: seven-eighths of the way round)
info('by Dribbling: ' + JSON.stringify(pace));
ok(Math.abs(pace[10].croqT - pace.dial.croqT) < 0.001 && Math.abs(pace[10].croqD - pace.dial.croqD) < 0.1 && Math.abs(pace[10].spinT - pace.dial.spinT) < 0.001, 'at Dribbling 10 a move is as the dials have it');
ok(Math.abs(pace[1].croqT / pace[10].croqT - 1 / 0.62) < 0.01 && Math.abs(pace[1].spinT / pace[10].spinT - 1 / 0.62) < 0.01 && Math.abs(pace[1].croqD / pace[10].croqD - 0.7) < 0.01 && Math.abs(pace[1].rbDist / pace[10].rbDist - 0.7) < 0.01,
  'at 1 it takes 1.6 times as long and carries 30% less far (croqueta ' + pace[10].croqT + ' s / ' + pace[10].croqD + ' px -> ' + pace[1].croqT + ' s / ' + pace[1].croqD + ' px)');

// WHICH MOVES, BY HIS STARS: a winger 2 m from his man out on the touchline, nobody behind him, 300 picks at each
const picks = await page.evaluate(() => { const T = window.__T, R = T.players().filter(q => q.team === 'R'), G = T.players().filter(q => q.team === 'G');
  const p = R[2], d = G[2], atk = T.atkOf('R'), C = { atk, gx: atk > 0 ? T.FW : 0 }, b = T.ball(), out = {}, keep = { s: p.stats, st: p.stars };
  T.freeze(); p.stats = Object.assign({}, keep.s, { dribbling: 9, ballControl: 9, agility: 9 });
  for(const st of [1, 3, 5]){ const n = {};
    for(let i = 0; i < 300; i++){ p.x = atk > 0 ? T.FW * 0.72 : T.FW * 0.28; p.y = T.YC + T.FH * 0.38; p.vx = atk * 150; p.vy = 0; p.facing = { x: atk, y: 0 }; p.state = 'normal';
      d.x = p.x + atk * 50; d.y = p.y; d.state = 'normal'; p.stars = st; p.skill = null; p.skillCd = 0; b.z = 0; b.vz = 0; T.own(p, p.r + b.r + 5);
      const k = T.aiSkillMove(p, d, 1, C, true); n[k] = (n[k] || 0) + 1; p.skill = null; }
    out[st] = n; }
  p.stats = keep.s; p.stars = keep.st; T.freeze(); return out; });
info('the moves picked, by stars: ' + JSON.stringify(picks));
const kinds = st => Object.keys(picks[st]);
ok(kinds(1).join() === 'flick', 'a one-star man only flicks it on');
ok(kinds(3).every(k => ['flick', 'dragback', 'croq', 'spin', 'cruyff'].includes(k)) && kinds(3).includes('croq') && kinds(3).includes('cruyff'), 'a three-star man up to the croqueta, roulette and Cruyff turn (' + kinds(3).join(', ') + ')');
ok(['rainbow', 'sombrero', 'elastico', 'heel'].every(k => picks[5][k] > 0), 'a five-star man has them all, the rainbow, sombrero, elastico and heel flick too (' + kinds(5).join(', ') + ')');

// IN THE MATCH: a winger with the moves (3 stars, Dribbling 9) and the ball out on the touchline in their third, one of
// ours 4 m in front of him (Tackle 4), nobody else near -- he takes him on with a move; a centre-back there never does
const oneVone = (pos, role, me, him, i) => page.evaluate(({ pos, role, me, him, i }) => new Promise(res => {
  const T = window.__T; T.freeze(); window.__SK = [];
  const R = T.players().filter(q => q.team === 'R'), G = T.players().filter(q => q.team === 'G');
  const p = R[1], d = G[1], atk = T.atkOf('R'), U = u => atk > 0 ? u : T.FW - u, keep = { s: p.stats, a: p.slotAtk, d: d.stats, st: p.stars };
  p.slotAtk = Object.assign({}, keep.a, { pos, role, wide: 1, lineSize: 3, isWidthLine: true, si: -1 }); T.applySlot(p, p.slotAtk);
  p.stats = Object.assign({}, keep.s, { dribbling: me, ballControl: me, agility: me, speed: 7 }); p.stars = 3;
  d.stats = Object.assign({}, keep.d, { tackle: him, defIQ: him, agility: him });
  const park = () => { for(const q of T.players()) if(q !== p && q !== d){ q.x = U(T.FW * 0.3) + (q.team === 'R' ? 0 : 40); q.y = q.team === 'R' ? 60 : 110; q.vx = q.vy = 0; } };
  for(const k of T.keepers()){ k.x = k.homeX; k.y = T.YC; }
  for(const q of [p, d]){ q.state = 'normal'; q.vx = q.vy = 0; q.z = 0; q.vz = 0; q.noTouchT = 0; q.ob = null; q.takeOn = null; q.skill = null; q.skillCd = 0; q.stamina = q.staminaCap = 1; }
  p.x = U(T.FW * 0.72); p.y = T.YC + T.FH * 0.4 * (i % 2 ? 1 : -1); p.facing = { x: atk, y: 0 };
  d.x = p.x + atk * 100; d.y = p.y; d.facing = { x: -atk, y: 0 }; park();
  const b = T.ball(); b.vx = b.vy = b.vz = 0; b.z = 0; b.crossT = 0; b.shotT = 0; T.own(p, p.r + b.r + 5); b.lastTouch = 'R';
  const t0 = T.simNow();
  (function tick(){ park();
    if(window.__SK.length || T.simNow() - t0 > 3){ const out = { move: window.__SK.length ? window.__SK[0].kind : null };
      p.stats = keep.s; d.stats = keep.d; p.slotAtk = keep.a; T.applySlot(p, keep.a); p.stars = keep.st; return res(out); }
    requestAnimationFrame(tick); })(); }), { pos, role, me, him, i });
await page.evaluate(() => { window.__aiAll = true; });
const runs = async (pos, role, me, him, n) => { const r = []; for(let i = 0; i < n; i++) r.push(await oneVone(pos, role, me, him, i)); return r; };
const W = await runs('W', 'ATT', 9, 4, 8), Wlevel = await runs('W', 'ATT', 5, 8, 8), CB = await runs('CB', 'DEF', 9, 4, 8);
const moves = r => r.filter(x => x.move).map(x => x.move);
info(`a winger, 9 against a 4: ${moves(W).length} of 8 took him on with a move (${moves(W).join(' ')}); 5 against an 8: ${moves(Wlevel).length}; a centre-back, 9 against a 4: ${moves(CB).length}`);
ok(moves(W).length >= 4 && new Set(moves(W)).size >= 2, 'a winger with the moves takes his man on with them, on the touchline in their third (' + moves(W).length + ' of 8, ' + [...new Set(moves(W))].join(', ') + ')');
ok(moves(Wlevel).length < moves(W).length, '...far less against a man better than him (' + moves(Wlevel).length + ')');
ok(moves(CB).length === 0, 'a centre-back never does one');

process.exitCode = rep.finish();
await browser.close();
