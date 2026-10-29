// FOOTBALL CLASSIC, TACTICS: a shape with the ball and one without it (1-3-3 and 1-4-2 attacking only -- the computer
// never defends in them -- and 4-2-1 and 4-1-2 defending only), width as COMPACT / BALANCED / WIDE, seven styles each
// with its own block without the ball (no posture to set), anyone in any position (the keeper too), instructions by position (each spot's own, kept when
// the men in it change; a midfielder told to run in behind gives up holding), the keeper's own (PASS), skill stars in
// the match (each man's own, one to five: which moves each allows is classic-moves.mjs), and POSITIONS: a man's own (a
// holding or attacking midfielder's CM's too), his second ones (CB: FB; FB: WM, CB; CM: WM; DM: CB; AM: WM, W, ST; WM:
// FB, W; W: WM, ST; ST: W) and the rest -- what each costs his Off IQ and Def IQ in a match (the spot with the ball his
// Off IQ, the one without it his Def IQ), his rating there, the marks on the tactics pitch, the computer's clubs picking
// their men by them. On a copy of the game that lets the test reach the match.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={statOf, posPenOf, natPos, posFit, FIT_PEN, rateAt, players:()=>players, SUBS:()=>SUBS, controlled:()=>controlled, forms:()=>[myForm,myFormDef,rForm,rFormDef], LINEUP:()=>LINEUP, SQUAD:()=>SQUAD, TAC, CLUBS, defFormFor, cwFormFor, postureOf, styleKey, setStyle, ATK_ONLY, DEF_ONLY, POS_OF, ins, instrKeysFor, PI:()=>PI, piSet, holderOf:t=>{ holderCache[t]=null; return holderOf(t); }};\n  const LAB_TITLE=');
patch('  // ===== END MANAGER CAREER', '  window.__S={get d(){ return CAREER&&CAREER.data; }, mgSave, careerStars, natPos, posFit, ovrAt, careerSquad, careerSlots, cwFormFor, mgAiClubs, careerMapDef, defFormFor, postureOf};\n  // ===== END MANAGER CAREER');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-tac-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
const save = () => page.evaluate(() => JSON.parse(localStorage.getItem('ft_mgr_slot1')));

// --- the computer never defends in an attack-only shape ------------------------------------------------
const STYLES = ['neutral','gegen','control','wing','direct','fluid','dcounter'];
const bad = await page.evaluate(STYLES => { const T = window.__T, out = [];
  for(const c of T.CLUBS) for(const po of ['press','neutral','lowblock']){ const f = T.defFormFor(c.form, po); if(T.ATK_ONLY.includes(f)) out.push(c.id + ' ' + po + ' ' + f); }
  for(const st of STYLES) for(let i = 0; i < 40; i++){ const club = { name: 'Club ' + i, style: st };   // (each style without the ball in its own block)
    const f = T.defFormFor(T.cwFormFor(club), T.postureOf(st)); if(T.ATK_ONLY.includes(f)) out.push(st + ' ' + f); }
  return out; }, STYLES);
ok(bad.length === 0, 'no computer side defends in 1-3-3 or 1-4-2' + (bad.length ? ': ' + bad.slice(0, 4).join(', ') : ''));
const badA = await page.evaluate(STYLES => { const T = window.__T, out = [];
  for(const c of T.CLUBS) if(T.DEF_ONLY.includes(c.form)) out.push(c.id);
  for(const st of STYLES) for(let i = 0; i < 40; i++){ const f = T.cwFormFor({ name: 'Club ' + i, style: st }); if(T.DEF_ONLY.includes(f)) out.push(st + ' ' + f); }
  return out; }, STYLES);
ok(badA.length === 0, 'no computer side attacks in 4-2-1 or 4-1-2');

// --- a career: the tactics screen ------------------------------------------------------------------
await page.click('#smItems [data-act="new"]'); await page.waitForTimeout(150);
await page.click('#newSlotList .slotBtn >> nth=0');
await page.waitForSelector('#mgrMaker.on', { timeout: 4000 });
await page.fill('#mgName', 'Sam Okafor'); await page.fill('#mgClubIn', 'Fenmoor Athletic');
await page.click('#mgGo'); await page.waitForSelector('#careerHub.show', { timeout: 6000 });
await page.emulateMedia({ reducedMotion: 'reduce' });   // (the buildings open at once, the days just turn)
await page.evaluate(() => { const d = window.__S.d; d.lv.train = 4; window.__S.mgSave(d); });   // (every shape, style and instruction: the training pitch's locks are manager-career.mjs's)
await page.click('#chCampus [data-bldg="train"]'); await page.click('#bldgPanel .bpTab:text-is("Tactics")'); await page.waitForTimeout(100);
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
// seven styles, each with its own block without the ball: no posture to set (a gegenpress presses high, a direct counter sits deep)
ok(!(await page.$('#bpBody [data-tdrop="posture"]')) && !(await page.$('#bpBody [data-cposture]')), 'without the ball: no posture menu');
await menu('style');
const styles = await page.$$eval('#bpBody [data-cstyle]', ns => ns.map(n => n.textContent));
ok(String(styles) === 'BALANCED,GEGENPRESS,CONTROL POSSESSION,WING PLAY,DIRECT,FLUID COUNTER,DIRECT COUNTER', 'the styles: ' + styles.join(' / '));
await page.click('#bpBody [data-cstyle="dcounter"]'); await page.waitForTimeout(80);
d = await save();
ok(d.style === 'dcounter' && !('posture' in d), 'picked without the ball, it is the style (nothing else saved): ' + d.style);
await page.click('#bpBody [data-ctphase="atk"]'); await page.waitForTimeout(60);
ok(!(await page.$('#bpBody [data-tdrop="posture"]')) && /DIRECT COUNTER/.test(await page.textContent('#bpBody [data-tdrop="style"]')), 'with the ball: the same style, and no posture menu');
await pick('style', '[data-cstyle="gegen"]');
d = await save();
ok(d.style === 'gegen', 'GEGENPRESS picked: ' + d.style);
const blocks = await page.evaluate(STYLES => { const T = window.__T, o = {};
  for(const s of STYLES){ T.setStyle('R', s); o[s] = [T.TAC.R.off, T.TAC.R.def, T.TAC.R.brk].filter(Boolean).join('/'); }
  T.setStyle('R', 'neutral');
  o.old = [['tiki','neutral'], ['counter','lowblock'], ['counter','neutral'], ['counter','press'], ['neutral','press'], ['neutral','lowblock'], ['wing','press']].map(a => T.styleKey(a[0], a[1])).join();
  return o; }, STYLES);
ok(blocks.gegen === 'gegen/press' && blocks.dcounter === 'counter/lowblock/direct' && blocks.fluid === 'counter/neutral/fluid' && blocks.control === 'control/neutral'
   && ['neutral','wing','direct'].every(s => blocks[s] === s + '/neutral'), 'each style its own block: ' + JSON.stringify(blocks));
ok(blocks.old === 'control,dcounter,fluid,fluid,gegen,neutral,wing', 'an old save\'s style and posture read as one of the new styles (tiki-taka, counter low / mid / high, balanced pressing, balanced low, wing pressing): ' + blocks.old);

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
// THE KEEPER'S OWN: PASS (who he plays it to when you press PASS, or when his time's up), on either tab
await tap(lu.gk); pn = await panel();
const gkOpts = await page.$$eval('#cTacRight [data-cgi="gkPass"]', ns => ns.map(n => n.textContent));
const gkOn = await page.$eval('#cTacRight [data-cgi="gkPass"].on', n => n.textContent);
ok(String(pn.groups) === 'PASS' && String(gkOpts) === 'PLAYER,CLOSEST OPEN,FARTHEST OPEN,HOOF IT' && gkOn === 'PLAYER', 'the keeper\'s instructions: PASS -- ' + gkOpts.join(' / ') + ' (' + gkOn + ' to start with)');
await page.click('#cTacRight [data-cgi="gkPass"][data-v="farthest"]'); await page.waitForTimeout(60);
d = await save();
ok(d.pinstr.gk && d.pinstr.gk.gkPass === 'farthest' && (await page.$eval('#cTacRight [data-cgi="gkPass"].on', n => n.textContent)) === 'FARTHEST OPEN', 'FARTHEST OPEN picked, and saved: ' + JSON.stringify(d.pinstr.gk));
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
// the squad list (the clubhouse's): drop a man from it on the little pitch
await page.click('#bldgPanel .bpTopBack'); await page.waitForTimeout(60); await page.click('#chCampus [data-bldg="club"]'); await page.click('#bldgPanel .bpTab:text-is("Squad")'); await page.waitForTimeout(100);
const out1 = lu.atk[0], in1 = lu.bench.find(ri => d.roster[ri].role !== 'GK');
await page.$eval(`#bpBody .sqList .mgRow[data-pid="${d.roster[in1].id}"]`, e => e.scrollIntoView({ block: 'center' }));
await drag(`#bpBody .sqList .mgRow[data-pid="${d.roster[in1].id}"]`, `#bpBody .sqPitch .ptk[data-ri="${out1}"]`);
d = await save();
ok(d.lineup.atk[0] === in1 && d.lineup.bench.includes(out1), 'Squad: a man in the list dropped on a spot on the little pitch takes it');
await drag(`#bpBody .sqList .mgRow[data-pid="${d.roster[out1].id}"]`, `#bpBody .sqPitch .ptk[data-ri="${in1}"]`);
d = await save(); lu = d.lineup;
await page.click('#bldgPanel .bpTopBack'); await page.waitForTimeout(60); await page.click('#chCampus [data-bldg="train"]'); await page.click('#bldgPanel .bpTab:text-is("Tactics")'); await page.waitForTimeout(80);

// --- POSITIONS: his own, his second ones, the rest ------------------------------------------------------------------
const fit = await page.evaluate(() => { const S = window.__S, T = window.__T, spots = ['CB','FB','CM','WM','W','ST'], o = {};
  for(const nat of ['CB','FB','DM','CM','AM','WM','WNG','STK']) o[nat] = spots.map(sp => ({ main: 'M', second: 's', out: '.' })[S.posFit(nat, sp)]).join('');
  o.pen = T.FIT_PEN; return o; });
info('fits (CB FB CM WM W ST; M his own, s a second, . out of it): ' + Object.entries(fit).filter(([k]) => k !== 'pen').map(([k, v]) => k + ' ' + v).join(' | '));
ok(fit.CB === 'Ms....' && fit.FB === 'sM.s..' && fit.CM === '..Ms..' && fit.DM === 's.M...' && fit.AM === '..Msss' && fit.WM === '.s.Ms.' && fit.WNG === '...sMs' && fit.STK === '....sM',
  'a man\'s own position and his second ones, as given -- a holding or attacking midfielder\'s own CM\'s too');
ok(fit.pen.second.offIQ > fit.pen.second.defIQ && fit.pen.second.defIQ > 0 && fit.pen.out.offIQ >= 2 * fit.pen.second.offIQ && fit.pen.out.defIQ >= 2 * fit.pen.second.offIQ,
  'in a second position a little off his Def IQ out of possession (' + fit.pen.second.defIQ + ') and a little more off his Off IQ on the ball (' + fit.pen.second.offIQ + '); out of position a good deal of both (' + fit.pen.out.offIQ + ', ' + fit.pen.out.defIQ + ')');
const marks = await page.evaluate(() => { const S = window.__S, d = S.d, out = { n: 0, bad: [], rate: [] };
  for(const el of document.querySelectorAll('#bpBody .tpitch .ptk[data-pos]')){ const p = d.roster[+el.dataset.ri], f = S.posFit(S.natPos(p), el.dataset.pos), want = el.dataset.pos === 'GK' ? '' : { main: '', second: 'sec', out: 'oop' }[f];
    const has = el.classList.contains('oop') ? 'oop' : el.classList.contains('sec') ? 'sec' : ''; out.n++; if(has !== want) out.bad.push(S.natPos(p) + '@' + el.dataset.pos + ':' + has); }
  // one man, his rating in each position: his own, a second one, out of it
  const p = d.roster.find(q => S.natPos(q) === 'CB') || d.roster.find(q => q.role === 'DEF');
  out.rate = [p.ovr, S.ovrAt(p, 'DEF', 'CB'), S.ovrAt(p, 'DEF', 'FB'), S.ovrAt(p, 'MID', 'WM'), S.natPos(p)];
  // the computer's clubs: how their men fit the spots they're picked for
  const n = { main: 0, second: 0, out: 0 }, nd = { main: 0, second: 0, out: 0 }; for(const c of S.mgAiClubs(d)){ const f = S.cwFormFor(c), sq = S.careerSquad(c, f), sp = S.careerSlots(f, 'atk');
    sq.slice(1).forEach((e, i) => n[S.posFit(S.natPos(e), sp[i].pos)]++);
    // ...and without the ball, in their defending shape
    const fd = S.defFormFor(f, S.postureOf(c.style)), dp = S.careerSlots(fd, 'def'), roster = sq.slice(1);
    S.careerMapDef({ lineup: { atk: [0, 1, 2, 3, 4, 5, 6] }, formation: f, formDef: fd, roster }).forEach((ri, k) => nd[S.posFit(S.natPos(roster[ri]), dp[k].pos)]++); }
  out.clubs = n; out.clubsDef = nd;
  // who defends where: a 2-3-2 in a 3-3-1 needs a third centre-back from midfield -- the holding midfielder (one of his
  // second positions), out on the left of it, rather than the central midfielder nearer (out of position there)
  const hold = { formation: '2-3-2', formDef: '3-3-1', lineup: { atk: [0, 1, 2, 3, 4, 5, 6] }, roster: ['CB', 'CB', 'DM', 'CM', 'WM', 'STK', 'STK'].map(sub => ({ role: sub === 'CB' ? 'DEF' : sub === 'STK' ? 'ATT' : 'MID', subRole: sub })) };
  const hp = S.careerSlots('3-3-1', 'def'), hm = S.careerMapDef(hold); out.hold = [hp[hm.indexOf(2)].pos, hp[hm.indexOf(3)].pos];
  return out; });
info('your tactics pitch: ' + marks.n + ' tokens' + (marks.bad.length ? ', wrong: ' + marks.bad.join(' ') : '') + '; a ' + marks.rate[4] + ' rated ' + marks.rate[0] + ': ' + marks.rate.slice(1, 4).join(' / ') + ' at CB / FB / WM; the computer\'s clubs\' men in their spots: ' + JSON.stringify(marks.clubs));
ok(marks.n >= 8 && !marks.bad.length, 'on the tactics pitch a man in a second position of his has his rating in lime, one out of position in amber, one in his own as it was');
ok(marks.rate[1] === marks.rate[0] && marks.rate[2] < marks.rate[0] && marks.rate[0] - marks.rate[2] <= 3 && marks.rate[3] < marks.rate[2],
  'his rating: his own in his own position (' + marks.rate[1] + '), a little less in a second (' + marks.rate[2] + '), less again out of position (' + marks.rate[3] + ')');
const cl = marks.clubs, all = cl.main + cl.second + cl.out;
ok(cl.main / all >= 0.5 && cl.out / all <= 0.05, 'the computer\'s clubs pick each spot\'s man by position: ' + Math.round(cl.main / all * 100) + '% in their own, ' + Math.round(cl.second / all * 100) + '% in a second, ' + Math.round(cl.out / all * 100) + '% out of position');
const cd = marks.clubsDef, allD = cd.main + cd.second + cd.out;
ok(marks.hold.join() === 'CB,CM' && cd.out / allD <= 0.06, 'who defends where: his own position before another (a 2-3-2 defending in a 3-3-1: the holding midfielder drops into the back three, not the central one: ' + marks.hold.join(' / ') + '; the computer\'s clubs without the ball ' + Math.round(cd.main / allD * 100) + '% in their own, ' + Math.round(cd.second / allD * 100) + '% in a second, ' + (cd.out / allD * 100).toFixed(1) + '% out of position)');

// --- the match: the shapes, the instructions and the stars reach the pitch ----------------------------
await page.click('#bldgPanel .bpTopBack');
for(let i = 0; i < 6 && !/PLAY/.test(await page.textContent('#chBottom')); i++){ await page.click('#chBottom [data-mg="nextday"]'); await page.waitForTimeout(40); }
await page.click('#chBottom [data-mg="play"]'); await page.waitForTimeout(600);
const ids = { st: d.roster[posRi.st].id, cb: d.roster[posRi.cb].id, cm: d.roster[posRi.cm].id };
const m = await page.evaluate(ids => { const T = window.__T, f = T.forms(), G = T.players().filter(p => p.team === 'G'), R = T.players().filter(p => p.team === 'R');
  const count = (ps, k) => { const o = {}; for(const p of ps){ const r = p[k].role; o[r] = (o[r] || 0) + 1; } return o; };
  const by = id => G.find(p => p.lookKey === id);
  const posOK = G.every(p => p.slotAtk.pos === T.POS_OF[f[0]][p.slotAtk.si] && p.slotDef.pos === T.POS_OF[f[1]][p.slotDef.si]);
  return { f, gAtk: count(G, 'slotAtk'), gDef: count(G, 'slotDef'), rDef: count(R, 'slotDef'), posOK, gk: (T.PI().G.gk || {}).gkPass, sty: [T.TAC.G.style, T.TAC.G.def, T.TAC.R.style, T.TAC.R.def, T.postureOf(T.TAC.R.style)],
    st: [T.ins(by(ids.st), 'stRuns'), T.ins(by(ids.st), 'stWidth')], cb: T.ins(by(ids.cb), 'cbAggr'), cm: [T.ins(by(ids.cm), 'cmCover'), T.ins(by(ids.cm), 'cmDef')],
    other: G.filter(p => p.lookKey !== ids.st).map(p => T.ins(p, 'stRuns')), stars: G.map(p => p.stars),
    want: G.map(p => { const S = window.__S, r = S.d.roster.find(q => q.id === p.lookKey); return r ? S.careerStars(r) : null; }) }; }, ids);
ok(m.f[0] === '2-2-3' && m.f[1] === '3-3-1', 'your shapes in the match: ' + m.f[0] + ' / ' + m.f[1]);
ok(m.gAtk.DEF === 2 && m.gAtk.ATT === 3 && m.gDef.DEF === 3 && m.gDef.ATT === 1, 'with the ball 2-2-3, without it 3-3-1: ' + JSON.stringify(m.gAtk) + ' ' + JSON.stringify(m.gDef));
ok(!m.f[3] || !['1-3-3','1-4-2'].includes(m.f[3]), 'the opposition defends in ' + m.f[3]);
ok(m.posOK, 'every spot in the match knows what it is (CB, FB, CM, WM, W, ST)');
ok(m.gk === 'farthest', 'the keeper\'s PASS in the match: ' + m.gk);
ok(m.sty[0] === 'gegen' && m.sty[1] === 'press' && m.sty[3] === m.sty[4], 'your GEGENPRESS presses in the match; they (' + m.sty[2] + ') defend in their style\'s block: ' + m.sty.join(' / '));
ok(m.st.join() === 'false9,wide' && m.cb === 'step' && m.cm.join() === 'wing,int', 'in the match the men in those spots follow them: ' + JSON.stringify([m.st, m.cb, m.cm]));
ok(m.other.every(v => v === 'bal'), 'nobody else is a false nine');
ok(m.stars.every(s => s >= 1 && s <= 5) && m.stars.join() === m.want.join(), 'every man in the match has his own skill stars (one to five, for his age): ' + m.stars.join(''));
// IN THE MATCH: a man's spots cost him -- with the ball his Off IQ, without it his Def IQ -- as they fit his position
const iq = await page.evaluate(() => { const T = window.__T, p = T.players().find(q => q.team === 'G' && T.natPos({ role: q.natRole, subRole: q.subRole, style: q.style }) === 'CB') || T.players().find(q => q.team === 'G');
  const nat = T.natPos({ role: p.natRole, subRole: p.subRole, style: p.style }), keep = [p.slotAtk, p.slotDef], base = [p.stats.offIQ, p.stats.defIQ], spot = pos => Object.assign({}, p.slotAtk, { pos });
  const at = (a, d) => { p.slotAtk = spot(a); p.slotDef = spot(d); return [+T.statOf(p, 'offIQ', 0).toFixed(2), +T.statOf(p, 'defIQ', 0).toFixed(2)]; };
  const own = { CB: 'CB', FB: 'FB', DM: 'CM', CM: 'CM', AM: 'CM', WM: 'WM', WNG: 'W', STK: 'ST' }[nat] || 'CB', sec = { CB: 'FB', FB: 'CB', DM: 'CB', CM: 'WM', AM: 'ST', WM: 'FB', WNG: 'ST', STK: 'W' }[nat] || 'FB', away = { CB: 'ST', FB: 'ST', DM: 'ST', CM: 'CB', AM: 'CB', WM: 'CB', WNG: 'CB', STK: 'CB' }[nat] || 'ST';
  const r = { nat, base, own: at(own, own), secAtk: at(sec, own), secDef: at(own, sec), out: at(away, away) };
  p.slotAtk = keep[0]; p.slotDef = keep[1]; return r; });
info('a ' + iq.nat + ' (Off IQ, Def IQ ' + iq.base.join(', ') + '): ' + JSON.stringify(iq));
ok(iq.own.join() === iq.base.join() && iq.secAtk[0] < iq.base[0] && iq.secAtk[1] === iq.base[1] && iq.secDef[0] === iq.base[0] && iq.secDef[1] < iq.base[1]
   && iq.base[0] - iq.secAtk[0] > iq.base[1] - iq.secDef[1] && iq.out[0] < iq.secAtk[0] && iq.out[1] < iq.secDef[1],
  'in the match: in his own position his IQ as it is; a second position with the ball costs a little Off IQ, without it a little less Def IQ; out of position a good deal of both');

// SUBS: the pause menu's TACTICS, then a man off the bench dragged onto one of yours -- he comes on, on fresh legs
await page.evaluate(() => document.getElementById('menuBtn').click()); await page.waitForTimeout(150);
const pm = await page.$$eval('#pauseGrid [data-pause]', ns => ns.filter(n => getComputedStyle(n).display !== 'none').map(n => n.dataset.pause));
ok(String(pm) === 'tactics,skills,settings,exit,back' && !(await page.$('#pauseQuick')), 'the pause menu: TACTICS, SKILL MOVES, SETTINGS, EXIT, BACK (no quick row)');
await page.click('#pauseGrid [data-pause="tactics"]'); await page.waitForTimeout(150);
const mt = await page.evaluate(() => ({ ghosts: document.querySelectorAll('#mtacBody .tpGhost').length, faces: document.querySelectorAll('#mtacBody .tpitch .ptk img.ptkFace').length,
  men: document.querySelectorAll('#mtacBody .tpitch .ptk').length, bench: document.querySelectorAll('#mtacBody .tbBench .ptk img').length,
  card: !!document.querySelector('#mtacBody img.cardBody'), you: document.querySelectorAll('#mtacBody .ptkYou').length }));
ok(mt.ghosts === 7 && mt.faces === mt.men && mt.men === 8 && !mt.bench && mt.card && !mt.you, 'the match\'s tactics: faces on the men on the pitch (' + mt.faces + '/' + mt.men + '), none on the bench, all of him on his card, the other phase lit under them (' + mt.ghosts + '), no YOU badge');
const pre = await page.evaluate(() => ({ bench: document.querySelectorAll('#mtacBody .tbBench .ptk').length, head: document.getElementById('mtSubs').textContent }));
ok(pre.bench === 5 && /SUBS LEFT 2/.test(pre.head), 'the bench is five, and two subs a match: ' + pre.bench + ' on the bench, ' + pre.head);
const onName = await page.$eval('#mtacBody .tbBench .ptk', e => e.querySelector('.ptkName').textContent);
const offSi = await page.$eval('#mtacBody .tpitch .ptk[data-mtk="field"] >> nth=2', e => +e.dataset.si).catch(() => page.$$eval('#mtacBody .tpitch .ptk[data-mtk="field"]', ns => +ns[2].dataset.si));
await drag('#mtacBody .tbBench .ptk', `#mtacBody .tpitch .ptk[data-si="${offSi}"]`);
const sub = await page.evaluate(offSi => { const T = window.__T, S = T.SUBS().G, p = T.players().find(q => q.team === 'G' && q.squadIdx === S.on[0]);
  return { used: S.used, off: S.off[0], name: p && p.pname, legs: p && p.stamina, head: document.getElementById('mtSubs').textContent }; }, offSi);
ok(sub.used === 1 && sub.off === offSi && /\b/.test(sub.name || '') && (sub.name || '').endsWith(onName) && sub.legs === 1 && /SUBS LEFT 1/.test(sub.head),
   'a sub by drag: ' + sub.name + ' on, fresh legs, ' + sub.head);
// the second sub, then a third that isn't allowed
for(const k of [3, 4]){ const si = await page.$$eval('#mtacBody .tpitch .ptk[data-mtk="field"]', (ns, k) => +ns[k].dataset.si, k); await drag('#mtacBody .tbBench .ptk', `#mtacBody .tpitch .ptk[data-si="${si}"]`); await page.waitForTimeout(80); }
const sub3 = await page.evaluate(() => ({ used: window.__T.SUBS().G.used, head: document.getElementById('mtSubs').textContent, bench: document.querySelectorAll('#mtacBody .tbBench .ptk').length }));
ok(sub3.used === 2 && /SUBS LEFT 0/.test(sub3.head), 'a second sub, and no third: ' + sub3.used + ' made, ' + sub3.head + ', ' + sub3.bench + ' left on the bench');
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

process.exitCode = rep.finish();
await browser.close();
