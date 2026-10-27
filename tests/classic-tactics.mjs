// FOOTBALL CLASSIC, TACTICS: a shape with the ball and one without it (1-3-3 and 1-4-2 attacking only -- the computer
// never defends in them -- and 4-2-1 and 4-1-2 defending only), width as COMPACT / BALANCED / WIDE, the style and the
// posture set apart, anyone in any position (the keeper too), instructions by position (each spot's own, kept when
// the men in it change; a midfielder told to run in behind gives up holding), and skill stars (1: the cut; 2: + the
// croqueta; 3: + the roulette and the rainbow flick). On a copy of the game that lets the test reach the match.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={players:()=>players, SUBS:()=>SUBS, controlled:()=>controlled, forms:()=>[myForm,myFormDef,rForm,rFormDef], LINEUP:()=>LINEUP, SQUAD:()=>SQUAD, TAC, CLUBS, defFormFor, cwFormFor, ATK_ONLY, DEF_ONLY, POS_OF, ins, instrKeysFor, PI:()=>PI, piSet, holderOf:t=>{ holderCache[t]=null; return holderOf(t); }, '
  + 'trySkill:(st,g)=>{ const c=controlled; restartT=0; offsideT=0; scoredT=0; gkHold=null; skill=null; skillCd=0; c.state="normal"; c.stars=st; own(c,c.r+ball.r+5); const r=startSkill(g); skill=null; skillCd=0; return r; }};\n  const LAB_TITLE=');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-tac-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
const save = () => page.evaluate(() => JSON.parse(localStorage.getItem('ft_mgr_slot1')));

// --- the computer never defends in an attack-only shape ------------------------------------------------
const bad = await page.evaluate(() => { const T = window.__T, out = [];
  for(const c of T.CLUBS) for(const po of ['press','neutral','lowblock']){ const f = T.defFormFor(c.form, po); if(T.ATK_ONLY.includes(f)) out.push(c.id + ' ' + po + ' ' + f); }
  for(const st of ['neutral','tiki','wing','direct','counter']) for(let i = 0; i < 40; i++){ const club = { name: 'Club ' + i, style: st };
    for(const po of ['press','neutral','lowblock']){ const f = T.defFormFor(T.cwFormFor(club), po); if(T.ATK_ONLY.includes(f)) out.push(st + ' ' + po + ' ' + f); } }
  return out; });
ok(bad.length === 0, 'no computer side defends in 1-3-3 or 1-4-2' + (bad.length ? ': ' + bad.slice(0, 4).join(', ') : ''));
const badA = await page.evaluate(() => { const T = window.__T, out = [];
  for(const c of T.CLUBS) if(T.DEF_ONLY.includes(c.form)) out.push(c.id);
  for(const st of ['neutral','tiki','wing','direct','counter']) for(let i = 0; i < 40; i++){ const f = T.cwFormFor({ name: 'Club ' + i, style: st }); if(T.DEF_ONLY.includes(f)) out.push(st + ' ' + f); }
  return out; });
ok(badA.length === 0, 'no computer side attacks in 4-2-1 or 4-1-2');

// --- a career: the tactics screen ------------------------------------------------------------------
await page.click('#smItems [data-act="new"]'); await page.waitForTimeout(150);
await page.click('#newSlotList .slotBtn >> nth=0');
await page.waitForSelector('#mgrMaker.on', { timeout: 4000 });
await page.fill('#mgName', 'Sam Okafor'); await page.fill('#mgClubIn', 'Fenmoor Athletic');
await page.click('#mgGo'); await page.waitForSelector('#careerHub.show', { timeout: 6000 });
await page.click('#chCampus [data-bldg="office"]'); await page.click('#bldgPanel .bpTab:text-is("Tactics")'); await page.waitForTimeout(100);
// the shape, the width and the style are menus on the top row: open one, pick from it (it closes)
const menu = async k => { if(!(await page.$(`#bpBody [data-tdrop="${k}"].on`))){ await page.click(`#bpBody [data-tdrop="${k}"]`); await page.waitForTimeout(60); } };
const shut = async () => { if(await page.$('#bpBody .tbDrop.on')){ await page.click('#bpBody .tbDrop.on'); await page.waitForTimeout(60); } };
const pick = async (k, sel) => { await menu(k); await page.click('#bpBody ' + sel); await page.waitForTimeout(80); };
ok(await page.isVisible('#bpBody [data-ctphase="atk"]') && await page.isVisible('#bpBody [data-ctphase="def"]'), 'WITH THE BALL / WITHOUT THE BALL');
await menu('form');
ok(!(await page.isDisabled('#bpBody [data-cform="1-3-3"]')), 'with the ball, 1-3-3 can be picked');
ok(await page.isDisabled('#bpBody [data-cform="4-2-1"]') && await page.isDisabled('#bpBody [data-cform="4-1-2"]'), 'with the ball, 4-2-1 and 4-1-2 are off');
await page.click('#bpBody [data-cform="2-2-3"]'); await page.waitForTimeout(80);
await pick('width', '[data-cwidth="1.18"]');
await page.click('#bpBody [data-ctphase="def"]'); await page.waitForTimeout(80);
await menu('form');
ok(await page.isDisabled('#bpBody [data-cform="1-3-3"]') && await page.isDisabled('#bpBody [data-cform="1-4-2"]'), 'without it, 1-3-3 and 1-4-2 are off');
await page.click('#bpBody [data-cform="4-2-1"]'); await page.waitForTimeout(80);
ok((await save()).formDef === '4-2-1', 'without it, a back four: 4-2-1');
await pick('form', '[data-cform="3-3-1"]');
await pick('width', '[data-cwidth="0.84"]');
let d = await save();
ok(d.formation === '2-2-3' && d.formDef === '3-3-1', 'saved: 2-2-3 with the ball, 3-3-1 without');
ok(d.width.atk === 1.18 && d.width.def === 0.84, 'saved: wide with the ball, compact without');
ok(d.lineup.def.length === 7 && [...d.lineup.def].sort().join() === [...d.lineup.atk].sort().join(), 'the same seven defend, in the defending spots');
await menu('width');
const widths = await page.$$eval('#bpBody [data-cwidth]', ns => ns.map(n => n.textContent));
ok(String(widths) === 'COMPACT,BALANCED,WIDE', 'width: ' + widths.join(' / '));
await shut();
// the style and the posture are set apart: picking a style leaves the posture alone
await pick('posture', '[data-cposture="press"]');
await page.click('#bpBody [data-ctphase="atk"]'); await page.waitForTimeout(60);
await pick('style', '[data-cstyle="counter"]');
d = await save();
ok(d.style === 'counter' && d.posture === 'press', 'picking a style leaves the posture alone: ' + d.style + ' / ' + d.posture);

// DRAGGING: pick a man up and put him on another (a mouse drags at once; a finger holds him first: see classic-ui)
const centre = sel => page.$eval(sel, e => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
async function drag(a, b, peek){ const p = await centre(a), q = await centre(b); await page.mouse.move(p.x, p.y); await page.mouse.down();
  for(let i = 1; i <= 8; i++){ await page.mouse.move(p.x + (q.x - p.x) * i / 8, p.y + (q.y - p.y) * i / 8); await page.waitForTimeout(15); }
  const seen = peek ? await page.evaluate(peek) : null; await page.mouse.up(); await page.waitForTimeout(100); return seen; }

// anyone anywhere: the keeper out, a defender in goal (dragged onto him)
const gkBefore = d.lineup.gk, field = d.lineup.atk[0];
await page.click('#bpBody [data-ctphase="atk"]'); await page.waitForTimeout(60);
ok(!(await page.$('[data-imove]')), 'no MOVE / SWAP button: a man is moved by dragging him');
await drag(`#bpBody .tpitch .ptk[data-ri="${field}"]`, `#bpBody .tpitch .ptk[data-ri="${gkBefore}"]`);
d = await save();
ok(d.lineup.gk === field && d.lineup.atk.includes(gkBefore) && d.lineup.def.includes(gkBefore), 'an outfielder in goal, the keeper outfield (both phases)');
const tok = await page.$eval(`#bpBody .tpitch .ptk[data-ri="${field}"]`, e => ({ oop: e.classList.contains('oop'), ovr: parseInt(e.querySelector('.ptkOvr').textContent, 10) }));   // (his rating, then his own position)
ok(tok.oop && tok.ovr < d.roster[field].ovr, 'out of position he plays below his rating: ' + tok.ovr + ' in goal, ' + d.roster[field].ovr + ' as a ' + d.roster[field].role);
await page.click('#bpBody [data-mg="best8"]'); await page.waitForTimeout(80);
d = await save();
ok(d.roster[d.lineup.gk].role === 'GK', 'PICK MY BEST EIGHT puts a keeper back in goal');

// instructions by position (2-2-3 with the ball: CB CB CM CM W ST W; 3-3-1 without it: CB CB CB WM CM WM ST)
const tap = async ri => { await page.click(`#bpBody .tpitch .ptk[data-ri="${ri}"]`); await page.waitForTimeout(60); };
const panel = () => page.evaluate(() => ({ head: (document.querySelector('#cTacRight .instrHead') || {}).textContent || '',
  groups: [...document.querySelectorAll('#cTacRight .instrGrpLbl')].map(n => n.textContent),
  on: [...document.querySelectorAll('#cTacRight .iOpt.on')].map(n => n.dataset.ci + '=' + n.dataset.v) }));
const ci = async (k, v) => { await page.click(`#cTacRight [data-ci="${k}"][data-v="${v}"]`); await page.waitForTimeout(60); };
await page.click('#bpBody [data-ctphase="atk"]'); await page.waitForTimeout(60);
let lu = d.lineup;
await tap(lu.atk[5]); await page.click('#cTacRight [data-cside="instr"]'); await page.waitForTimeout(60);   // (his card turned over: the INSTRUCTIONS side, kept from man to man)
let pn = await panel();
ok(String(pn.groups) === 'WIDTH,RUNS' && !pn.head, 'the striker\'s instructions with the ball, on his card without a heading: ' + pn.groups.join(', '));
await ci('stRuns', 'false9'); await ci('stWidth', 'wide');
await tap(lu.atk[4]); pn = await panel();
ok(String(pn.groups) === 'SUPPORT,WIDTH', 'the left winger\'s: ' + pn.groups.join(', '));
await ci('wWidth', 'inside');
await page.click('#bpBody [data-ctphase="def"]'); await page.waitForTimeout(60);
await tap(lu.def[0]); pn = await panel();
ok(String(pn.groups) === 'AGGRESSION', 'a centre-back\'s without it: ' + pn.groups.join(', '));
await ci('cbAggr', 'step');
await tap(lu.def[4]); pn = await panel();
ok(String(pn.groups) === 'COVER,DEFENDING', 'the central midfielder\'s: ' + pn.groups.join(', '));
await ci('cmCover', 'wing'); await ci('cmDef', 'int');
await tap(lu.def[6]); await ci('stDef', 'up');
d = await save();
const PIc = d.pinstr;
ok(JSON.stringify(PIc.atk['2-2-3'][5]) === '{"stRuns":"false9","stWidth":"wide"}' && JSON.stringify(PIc.atk['2-2-3'][4]) === '{"wWidth":"inside"}', 'saved with the ball: ' + JSON.stringify(PIc.atk));
ok(PIc.def['3-3-1'][0].cbAggr === 'step' && PIc.def['3-3-1'][4].cmCover === 'wing' && PIc.def['3-3-1'][4].cmDef === 'int' && PIc.def['3-3-1'][6].stDef === 'up', 'saved without it: ' + JSON.stringify(PIc.def));
await ci('stDef', 'bal');
d = await save();
ok(!d.pinstr.def['3-3-1'][6], 'back to BALANCED: nothing kept');
// they go with the position: the striker and the left winger swap places, and the false nine is still a false nine
await page.click('#bpBody [data-ctphase="atk"]'); await page.waitForTimeout(60);
const st0 = lu.atk[5], w0 = lu.atk[4];
await drag(`#bpBody .tpitch .ptk[data-ri="${st0}"]`, `#bpBody .tpitch .ptk[data-ri="${w0}"]`);
d = await save(); lu = d.lineup;
await tap(lu.atk[5]); pn = await panel();
ok(lu.atk[5] === w0 && lu.atk[4] === st0 && pn.on.includes('stRuns=false9') && d.pinstr.atk['2-2-3'][5].stRuns === 'false9', 'after a swap the spot keeps its instructions: the new man there is the false nine');
const posRi = { st: lu.atk[5], cb: lu.def[0], cm: lu.def[4] };
await page.click('#cTacRight [data-cside="rate"]'); await page.waitForTimeout(60);

// a drag's fits and swaps
const a0 = lu.atk[1], b0 = lu.atk[2], def0 = d.lineup.def.slice();
const fits = await drag(`#bpBody .tpitch .ptk[data-ri="${a0}"]`, `#bpBody .tpitch .ptk[data-ri="${b0}"]`,
  () => [...document.querySelectorAll('#bpBody .tpitch .ptk[data-fit]')].length);
d = await save();
ok(fits >= 6, 'while a man is up, the spots show what he\'d be worth there (' + fits + ' of them)');
ok(d.lineup.atk[1] === b0 && d.lineup.atk[2] === a0 && String(d.lineup.def) === String(def0), 'dragged onto another: they swap spots with the ball, the shape without it as it was');
const benchMan = d.lineup.bench[0], offMan = d.lineup.atk[3];
await drag(`#bpBody .tbBench .ptk[data-ri="${benchMan}"]`, `#bpBody .tpitch .ptk[data-ri="${offMan}"]`);
d = await save();
ok(d.lineup.atk[3] === benchMan && d.lineup.def.includes(benchMan) && d.lineup.bench.includes(offMan), 'one off the bench dropped on a man: he comes on (both shapes), the other to the bench');
await drag(`#bpBody .tpitch .ptk[data-ri="${benchMan}"]`, `#bpBody .tbBench .ptk[data-ri="${offMan}"]`);
d = await save(); lu = d.lineup;
ok(lu.atk[3] === offMan && lu.bench.includes(benchMan), 'and back again');
// the squad list: drop a man from it on the little pitch
await page.click('#bldgPanel .bpTab:text-is("Squad")'); await page.waitForTimeout(100);
const out1 = lu.atk[0], in1 = lu.bench.find(ri => d.roster[ri].role !== 'GK');
await page.$eval(`#bpBody .sqList .mgRow[data-pid="${d.roster[in1].id}"]`, e => e.scrollIntoView({ block: 'center' }));
await drag(`#bpBody .sqList .mgRow[data-pid="${d.roster[in1].id}"]`, `#bpBody .sqPitch .ptk[data-ri="${out1}"]`);
d = await save();
ok(d.lineup.atk[0] === in1 && d.lineup.bench.includes(out1), 'Squad: a man in the list dropped on a spot on the little pitch takes it');
await drag(`#bpBody .sqList .mgRow[data-pid="${d.roster[out1].id}"]`, `#bpBody .sqPitch .ptk[data-ri="${in1}"]`);
d = await save(); lu = d.lineup;
await page.click('#bldgPanel .bpTab:text-is("Tactics")'); await page.waitForTimeout(80);

// --- the match: the shapes, the instructions and the stars reach the pitch ----------------------------
await page.click('#bldgPanel .bpTopBack');
for(let i = 0; i < 6 && !/PLAY/.test(await page.textContent('#chBottom')); i++){ await page.click('#chBottom [data-mg="nextday"]'); await page.waitForTimeout(40); }
await page.click('#chBottom [data-mg="play"]'); await page.waitForTimeout(600);
const ids = { st: d.roster[posRi.st].id, cb: d.roster[posRi.cb].id, cm: d.roster[posRi.cm].id };
const m = await page.evaluate(ids => { const T = window.__T, f = T.forms(), G = T.players().filter(p => p.team === 'G'), R = T.players().filter(p => p.team === 'R');
  const count = (ps, k) => { const o = {}; for(const p of ps){ const r = p[k].role; o[r] = (o[r] || 0) + 1; } return o; };
  const by = id => G.find(p => p.lookKey === id);
  const posOK = G.every(p => p.slotAtk.pos === T.POS_OF[f[0]][p.slotAtk.si] && p.slotDef.pos === T.POS_OF[f[1]][p.slotDef.si]);
  return { f, gAtk: count(G, 'slotAtk'), gDef: count(G, 'slotDef'), rDef: count(R, 'slotDef'), posOK,
    st: [T.ins(by(ids.st), 'stRuns'), T.ins(by(ids.st), 'stWidth')], cb: T.ins(by(ids.cb), 'cbAggr'), cm: [T.ins(by(ids.cm), 'cmCover'), T.ins(by(ids.cm), 'cmDef')],
    other: G.filter(p => p.lookKey !== ids.st).map(p => T.ins(p, 'stRuns')), stars: G.map(p => p.stars) }; }, ids);
ok(m.f[0] === '2-2-3' && m.f[1] === '3-3-1', 'your shapes in the match: ' + m.f[0] + ' / ' + m.f[1]);
ok(m.gAtk.DEF === 2 && m.gAtk.ATT === 3 && m.gDef.DEF === 3 && m.gDef.ATT === 1, 'with the ball 2-2-3, without it 3-3-1: ' + JSON.stringify(m.gAtk) + ' ' + JSON.stringify(m.gDef));
ok(!m.f[3] || !['1-3-3','1-4-2'].includes(m.f[3]), 'the opposition defends in ' + m.f[3]);
ok(m.posOK, 'every spot in the match knows what it is (CB, FB, CM, WM, W, ST)');
ok(m.st.join() === 'false9,wide' && m.cb === 'step' && m.cm.join() === 'wing,int', 'in the match the men in those spots follow them: ' + JSON.stringify([m.st, m.cb, m.cm]));
ok(m.other.every(v => v === 'bal'), 'nobody else is a false nine');
ok(m.stars.every(s => s >= 1 && s <= 3), 'every man has 1-3 stars: ' + m.stars.join(''));

// SUBS: the pause menu's TACTICS, then a man off the bench dragged onto one of yours -- he comes on, on fresh legs
await page.evaluate(() => document.getElementById('menuBtn').click()); await page.waitForTimeout(150);
const pm = await page.$$eval('#pauseGrid [data-pause]', ns => ns.filter(n => getComputedStyle(n).display !== 'none').map(n => n.dataset.pause));
ok(String(pm) === 'tactics,settings,exit,back' && !(await page.$('#pauseQuick')), 'the pause menu: TACTICS, SETTINGS, EXIT, BACK (no quick row)');
await page.click('#pauseGrid [data-pause="tactics"]'); await page.waitForTimeout(150);
const mt = await page.evaluate(() => ({ ghosts: document.querySelectorAll('#mtacBody .tpGhost').length, faces: document.querySelectorAll('#mtacBody .tpitch .ptk img.ptkFace').length,
  men: document.querySelectorAll('#mtacBody .tpitch .ptk').length, bench: document.querySelectorAll('#mtacBody .tbBench .ptk img').length,
  card: !!document.querySelector('#mtacBody img.cardBody'), you: document.querySelectorAll('#mtacBody .ptkYou').length }));
ok(mt.ghosts === 7 && mt.faces === mt.men && mt.men === 8 && !mt.bench && mt.card && !mt.you, 'the match\'s tactics: faces on the men on the pitch (' + mt.faces + '/' + mt.men + '), none on the bench, all of him on his card, the other phase lit under them (' + mt.ghosts + '), no YOU badge');
const onName = await page.$eval('#mtacBody .tbBench .ptk', e => e.querySelector('.ptkName').textContent);
const offSi = await page.$eval('#mtacBody .tpitch .ptk[data-mtk="field"] >> nth=2', e => +e.dataset.si).catch(() => page.$$eval('#mtacBody .tpitch .ptk[data-mtk="field"]', ns => +ns[2].dataset.si));
await drag('#mtacBody .tbBench .ptk', `#mtacBody .tpitch .ptk[data-si="${offSi}"]`);
const sub = await page.evaluate(offSi => { const T = window.__T, S = T.SUBS().G, p = T.players().find(q => q.team === 'G' && q.squadIdx === S.on[0]);
  return { used: S.used, off: S.off[0], name: p && p.pname, legs: p && p.stamina, head: document.getElementById('mtSubs').textContent }; }, offSi);
ok(sub.used === 1 && sub.off === offSi && /\b/.test(sub.name || '') && (sub.name || '').endsWith(onName) && sub.legs === 1 && /2/.test(sub.head),
   'a sub by drag: ' + sub.name + ' on, fresh legs, ' + sub.head);
await page.click('#mtacOv [data-mt="back"]'); await page.waitForTimeout(80); await page.click('#pauseMenu [data-pause="back"]');

// what each position can be told, with the ball and without it
const keys = await page.evaluate(() => { const T = window.__T, o = {}; for(const pos of ['CB','FB','CM','WM','W','ST']) for(const ph of ['atk','def']) o[pos + ph] = T.instrKeysFor(pos, ph).join(','); return o; });
ok(keys.CBatk === 'cbWidth,cbSupport' && keys.CBdef === 'cbAggr' && keys.FBatk === 'fbRuns' && keys.FBdef === 'fbAggr', 'defenders: ' + [keys.CBatk, keys.CBdef, keys.FBatk, keys.FBdef].join(' | '));
ok(keys.CMatk === 'cmSupport,cmCross' && keys.CMdef === 'cmCover,cmDef' && keys.WMatk === 'wmSupport,wmWidth' && keys.WMdef === 'wmDef', 'midfielders: ' + [keys.CMatk, keys.CMdef, keys.WMatk, keys.WMdef].join(' | '));
ok(keys.Watk === 'wSupport,wWidth' && keys.Wdef === 'wDef' && keys.STatk === 'stWidth,stRuns' && keys.STdef === 'stDef', 'forwards: ' + [keys.Watk, keys.Wdef, keys.STatk, keys.STdef].join(' | '));
// a midfielder told to RUN IN BEHIND is never the one holding
const hk = await page.evaluate(() => { const T = window.__T, f = T.forms()[0], h0 = T.holderOf('G'); if(!h0) return {};
  T.piSet(T.PI().G, 'atk', f, h0.slotAtk.si, 'cmSupport', 'run'); const h1 = T.holderOf('G');
  T.piSet(T.PI().G, 'atk', f, h0.slotAtk.si, 'cmSupport', 'bal'); T.holderOf('G');
  return { h0: h0.lookKey, h1: h1 && h1.lookKey }; });
ok(hk.h0 && hk.h1 !== hk.h0, 'told to RUN IN BEHIND, the holder hands it on (' + (hk.h1 ? 'to his partner' : 'to nobody') + ')');

// skill stars: a one-star man can cut but not croqueta; a two-star man can croqueta but not roulette or rainbow
const sk = await page.evaluate(() => { const T = window.__T, out = {};
  for(const [stars, kind] of [[1,'cut'],[1,'croq'],[2,'croq'],[2,'spin'],[2,'rainbow'],[3,'spin'],[3,'rainbow']]){
    const g = kind === 'spin' ? { kind, sense: 1, turn: 6.3 } : kind === 'rainbow' ? { kind } : { kind, dx: 1, dy: 0 };
    out[stars + kind] = T.trySkill(stars, g); }
  return out; });
info(JSON.stringify(sk));
ok(sk['1cut'] === true, '1 star: the cut');
ok(sk['1croq'] === false && sk['2croq'] === true, 'the croqueta needs 2 stars');
ok(sk['2spin'] === false && sk['2rainbow'] === false && sk['3spin'] === true && sk['3rainbow'] === true, 'the roulette and the rainbow need 3 stars');

process.exitCode = rep.finish();
await browser.close();
