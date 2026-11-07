// FOOTBALL CLASSIC, TACTICS: a shape with the ball and one without it (v127: eleven, every one for either -- 2-3-3 and
// 2-4-2, attacking only, gone; v124: nine a side; v126: the two with five at the back gone), width as COMPACT / BALANCED / WIDE, seven styles each
// with its own block without the ball (no posture to set), anyone in any position (the keeper too), the team's instructions
// (v112: no man's or spot's own -- the lines to drag, a style's own set, kept with the career, the same in the match), skill stars in
// the match (each man's own, one to five: which moves each allows is classic-moves.mjs), and POSITIONS: a man's own, his
// second ones (CB: FB; FB: WM, CB; DM: CM, CB; CM: DM, AM, WM; AM: CM, W, ST; WM: FB, W; W: WM, ST; ST: W -- v127, DM and
// AM positions of their own again) and the rest -- what each costs his Off IQ and Def IQ in a match (the spot with the ball his
// Off IQ, the one without it his Def IQ), his rating there, the marks on the tactics pitch, the computer's clubs picking
// their men by them. On a copy of the game that lets the test reach the match.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={statOf, posPenOf, natPos, posFit, fitPos, fitOfP, POS_MAIN, POS_SECOND, STYLES, FIT_PEN, rateAt, players:()=>players, SUBS:()=>SUBS, controlled:()=>controlled, forms:()=>[myForm,myFormDef,rForm,rFormDef], LINEUP:()=>LINEUP, SQUAD:()=>SQUAD, TAC, CLUBS, defFormFor, cwFormFor, postureOf, styleKey, setStyle, ATK_ONLY, DEF_ONLY, POS_OF, TI:()=>TI, tiDefault, holderOf:t=>{ holderCache[t]=null; return holderOf(t); }};\n  const LAB_TITLE=');
patch('  let INJ_OFF=false;', '  let INJ_OFF=true;');   // (injuries off: a man hurt in a match would change who plays -- manager-injury.mjs is injuries' test)
patch('  // ===== END MANAGER CAREER', '  window.__S={get d(){ return CAREER&&CAREER.data; }, mgSave, careerStars, natPos, posFit, fitPos, spotFit, ovrAt, careerSquad, careerSlots, cwFormFor, mgAiClubs, careerMapDef, defFormFor, postureOf};\n  // ===== END MANAGER CAREER');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-tac-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy, papers: 'aside' });   // (a career: its Monday papers put aside)
const { ok, info } = rep;
const save = () => page.evaluate(() => JSON.parse(localStorage.getItem('ft_mgr_slot1')));

// --- the computer defends in a shape there is (none for attacking only now: v127) ------------------------------------
const STYLES = ['neutral','gegen','control','wing','direct','fluid','dcounter'];
const bad = await page.evaluate(STYLES => { const T = window.__T, out = [];
  for(const c of T.CLUBS) for(const po of ['press','neutral','lowblock']){ const f = T.defFormFor(c.form, po); if(T.ATK_ONLY.includes(f) || !T.POS_OF[f]) out.push(c.id + ' ' + po + ' ' + f); }
  for(const st of STYLES) for(let i = 0; i < 40; i++){ const club = { name: 'Club ' + i, style: st };   // (each style without the ball in its own block)
    const f = T.defFormFor(T.cwFormFor(club), T.postureOf(st)); if(T.ATK_ONLY.includes(f) || !T.POS_OF[f]) out.push(st + ' ' + f); }
  return out; }, STYLES);
ok(bad.length === 0 && !(await page.evaluate(() => window.__T.ATK_ONLY.length)), 'every computer side defends in one of the shapes, none of them for attacking only (v127: 2-3-3 and 2-4-2 gone)' + (bad.length ? ': ' + bad.slice(0, 4).join(', ') : ''));
const badA = await page.evaluate(STYLES => { const T = window.__T, out = [];
  for(const c of T.CLUBS) if(T.DEF_ONLY.includes(c.form)) out.push(c.id);
  for(const st of STYLES) for(let i = 0; i < 40; i++){ const f = T.cwFormFor({ name: 'Club ' + i, style: st }); if(T.DEF_ONLY.includes(f)) out.push(st + ' ' + f); }
  return out; }, STYLES);
ok(badA.length === 0, 'no computer side attacks in a shape for defending only (there are none now)');

// --- a career: the tactics screen ------------------------------------------------------------------
await page.click('#smItems [data-act="new"]'); await page.waitForTimeout(150);
await page.click('#newSlotList .slotBtn >> nth=0');
await page.waitForSelector('#mgrMaker.on', { timeout: 4000 });
await page.fill('#mgName', 'Sam Okafor'); await page.fill('#mgClubIn', 'Fenmoor Athletic');
await page.click('#mgGo'); await page.waitForSelector('#careerHub.show', { timeout: 6000 });
if(await page.isVisible('#storyModal.on')){ await page.click('#storyModal [data-st="answer"]'); await page.waitForTimeout(40); await page.click('#storyModal [data-st="phone"]'); await page.waitForTimeout(40); }   // (the phone rings on the first day of pre-season: answered)
await page.emulateMedia({ reducedMotion: 'reduce' });   // (the buildings open at once, the days just turn)
await page.evaluate(() => { const d = window.__S.d; d.lv.train = 4; window.__S.mgSave(d); });   // (every shape, style and instruction: the training pitch's locks are manager-career.mjs's)
await page.click('#chCampus [data-bldg="train"]'); await page.click('#bldgPanel .bpTab:text-is("Tactics")'); await page.waitForTimeout(100);
// the shape, the width and the style are menus on the top row: open one, pick from it (it closes)
const menu = async k => { if(!(await page.$(`#bpBody [data-tdrop="${k}"].on`))){ await page.click(`#bpBody [data-tdrop="${k}"]`); await page.waitForTimeout(60); } };
const shut = async () => { if(await page.$('#bpBody .tbDrop.on')){ await page.click('#bpBody .tbDrop.on'); await page.waitForTimeout(60); } };
const pick = async (k, sel) => { await menu(k); await page.click('#bpBody ' + sel); await page.waitForTimeout(80); };
ok(await page.isVisible('#bpBody [data-ctphase="atk"]') && await page.isVisible('#bpBody [data-ctphase="def"]'), 'WITH THE BALL / WITHOUT THE BALL');
await menu('form');
ok(!(await page.isDisabled('#bpBody [data-cform="3-1-3-1"]')), 'with the ball, 3-1-3-1 can be picked');
ok((await page.$$('#bpBody [data-cform]')).length === 11 && !(await page.$('#bpBody [data-cform="5-2-1"]')) && !(await page.$('#bpBody [data-cform="2-3-3"]')), 'eleven shapes, none with five or two at the back (v126: 5-2-1 and 5-1-2 gone; v127: 2-3-3 and 2-4-2)');
await page.click('#bpBody [data-cform="3-2-3"]'); await page.waitForTimeout(80);
await pick('width', '[data-cwidth="1.18"]');
await page.click('#bpBody [data-ctphase="def"]'); await page.waitForTimeout(80);
await menu('form');
ok((await page.$$('#bpBody [data-cform]:not([disabled])')).length === 11, 'without it, every one of them can be picked too (v127: none for attacking only)');
await page.click('#bpBody [data-cform="4-2-2"]'); await page.waitForTimeout(80);
ok((await save()).formDef === '4-2-2', 'without it, a back four: 4-2-2');
await pick('form', '[data-cform="4-3-1"]');
await pick('width', '[data-cwidth="0.84"]');
let d = await save();
ok(d.formation === '3-2-3' && d.formDef === '4-3-1', 'saved: 3-2-3 with the ball, 4-3-1 without');
ok(d.width.atk === 1.18 && d.width.def === 0.84, 'saved: wide with the ball, compact without');
ok(d.lineup.def.length === 8 && [...d.lineup.def].sort().join() === [...d.lineup.atk].sort().join(), 'the same eight defend, in the defending spots');
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
ok(d.roster[d.lineup.gk].role === 'GK', 'BEST 9 puts a keeper back in goal');

// THE TEAM'S INSTRUCTIONS (v112: no man's own, nor a spot's): INSTRUCTIONS, up in the top row left of BEST 9 (v116), puts
// the team's for the phase where his card was, and lights up -- with the ball DEFENDERS, MIDFIELD, FORWARDS and WIDE MEN
// (no BUILD-UP since v116: it comes with the style); without it the lines' own pitch (the defensive line and the line of
// engagement, to drag: in range, never closer than 14 m), then ENGAGE WITH, DEFENDERS, DEF TACKLES, MID TACKLES and
// FORWARDS. A man tapped: his card again. Kept with the career, a style's own when it's picked
const tap = async ri => { await page.click(`#bpBody .tpitch .ptk[data-ri="${ri}"]`); await page.waitForTimeout(60); };
const panel = () => page.evaluate(() => { const P = document.querySelector('#cTacRight .tiPanel'); return P ? { head: P.querySelector('.tiHead').textContent,
  rows: [...P.querySelectorAll('.tiRow .tiLbl')].map(n => n.textContent), on: [...P.querySelectorAll('.tiOpt.on')].map(n => n.dataset.cti + '=' + n.dataset.v),
  pitch: !!P.querySelector('.tiPitch'), tags: [...P.querySelectorAll('.tiTag')].map(n => n.textContent), note: P.querySelector('.tiNote').textContent } : null; });
const cti = async (k, v) => { await page.click(`#cTacRight [data-cti="${k}"][data-v="${v}"]`); await page.waitForTimeout(60); };
await page.click('#bpBody [data-ctphase="atk"]'); await page.waitForTimeout(60);
let lu = d.lineup;
const insB = () => page.evaluate(() => { const top = document.querySelector('#bpBody .tbTop'), b = top && top.querySelector('.tbIns'), bs = top && top.querySelector('.tbBest');
  return { lit: !!(b && b.classList.contains('go')), left: !!(b && bs && b.nextElementSibling === bs && b.getBoundingClientRect().right <= bs.getBoundingClientRect().left),
    flips: document.querySelectorAll('#cTacRight [data-cside]').length, card: !!document.querySelector('#cTacRight .mgCardHead') }; });
await tap(lu.atk[5]); const ib0 = await insB(); await page.click('#bpBody .tbTop .tbIns'); await page.waitForTimeout(60);
let pn = await panel(); const ib1 = await insB();
ok(!ib0.lit && ib0.left && !ib0.flips && ib0.card && ib1.lit && pn && String(pn.rows) === 'DEFENDERS,MIDFIELD,FORWARDS,WIDE MEN' && /WITH THE BALL/.test(pn.head) && !pn.pitch,
  'INSTRUCTIONS, in the top row just left of BEST 9 (nothing on his card turns it over): lit, the team\'s instructions with the ball where his card was, no BUILD-UP -- ' + (pn && pn.rows.join(', ')));
await cti('aruns', 'run'); await cti('wide', 'feet');
pn = await panel();
ok(/^WIDE MEN: /.test(pn.note), 'the note under them is the last one touched: ' + pn.note);
await tap(lu.atk[4]); const ib2 = await insB(), pn2 = await panel(); await page.click('#bpBody .tbTop .tbIns'); await page.waitForTimeout(60); pn = await panel();
ok(!ib2.lit && ib2.card && !pn2 && pn && pn.on.includes('aruns=run') && pn.on.includes('wide=feet'), 'a man tapped: his card, INSTRUCTIONS unlit; INSTRUCTIONS again: the same set, the team\'s -- ' + (pn && pn.on.join(' ')));
await page.click('#bpBody [data-ctphase="def"]'); await page.waitForTimeout(60);
pn = await panel();
ok(pn && String(pn.rows) === 'ENGAGE WITH,DEFENDERS,DEF TACKLES,MID TACKLES,FORWARDS' && pn.pitch && /WITHOUT THE BALL/.test(pn.head), 'without the ball: the lines\' pitch, then ' + (pn && pn.rows.join(', ')));
ok(String(pn.tags) === 'DEF 46 m,ENGAGE 68 m' && pn.on.includes('dtk=tackle') && pn.on.includes('mtk=tackle') && pn.on.includes('aline=press'), 'GEGENPRESS picked, its instructions came with it: ' + pn.tags.join(', ') + ' -- ' + pn.on.join(' '));
// the lines dragged: the line of engagement up to 74 m; the back line up into it stops at 50 m (as high as it goes); the line
// of engagement back down into it stops 14 m in front of it
const dragLine = async (fromM, toM) => { const b = await page.$eval('#cTacRight .tiPitch', e => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  const X = m => b.x + b.w * m / 99.75; await page.mouse.move(X(fromM), b.y + b.h / 2); await page.mouse.down(); await page.mouse.move(X(toM), b.y + b.h / 2, { steps: 6 }); await page.mouse.up(); await page.waitForTimeout(80); };
await dragLine(68, 74); d = await save(); const l1 = [d.ti.dl, d.ti.loe];
await dragLine(46, 72); d = await save(); const l2 = [d.ti.dl, d.ti.loe];
await dragLine(74, 40); d = await save(); const l3 = [d.ti.dl, d.ti.loe];
pn = await panel();
ok(l1.join() === '46,74' && l2.join() === '50,74' && l3.join() === '50,64' && String(pn.tags) === 'DEF 50 m,ENGAGE 64 m',
  'the lines dragged: the line of engagement up (' + l1 + '), the back line up into it stopping at its highest (' + l2 + '), the line of engagement down into it stopping 14 m short (' + l3 + ')');
await cti('eng', 'mid'); await cti('dline', 'trap'); await cti('dtk', 'front');
d = await save();
const tiKeep = d.ti;
ok(tiKeep.eng === 'mid' && tiKeep.dline === 'trap' && tiKeep.dtk === 'front' && tiKeep.mtk === 'tackle' && tiKeep.aline === 'press' && !('build' in tiKeep) && tiKeep.aruns === 'run' && tiKeep.wide === 'feet',
  'kept with the career: ' + JSON.stringify(tiKeep));
const posRi = { st: lu.atk[5], cb: lu.def[0], cm: lu.def[4] };
await page.click('#bpBody .tbTop .tbIns'); await page.waitForTimeout(60); const ib3 = await insB();
ok(!ib3.lit && ib3.card, 'INSTRUCTIONS tapped again: his card back, the button unlit');
await page.click('#bpBody [data-ctphase="atk"]'); await page.waitForTimeout(60);   // (back to the shape with the ball)

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
const fit = await page.evaluate(() => { const S = window.__S, T = window.__T, spots = ['CB','FB','DM','CM','AM','WM','W','ST'], o = {};
  for(const nat of ['CB','FB','DM','CM','AM','WM','WNG','STK']) o[nat] = spots.map(sp => ({ main: 'M', second: 's', out: '.' })[S.posFit(nat, sp)]).join('');
  o.pen = T.FIT_PEN; return o; });
info('fits (CB FB DM CM AM WM W ST; M his own, s a second, . out of it): ' + Object.entries(fit).filter(([k]) => k !== 'pen').map(([k, v]) => k + ' ' + v).join(' | '));
ok(fit.CB === 'Ms......' && fit.FB === 'sM...s..' && fit.DM === 's.Ms....' && fit.CM === '..sMss..' && fit.AM === '...sM.ss' && fit.WM === '.s...Ms.' && fit.WNG === '.....sMs' && fit.STK === '......sM',
  'a man without an archetype: his own position and his second ones, as given -- a holding, a central and an attacking midfielder each his own (v127), covering the next one along');
// v118: an ARCHETYPE says where he plays -- its own spots, and the ones it covers -- not his position
const tf = await page.evaluate(() => { const S = window.__S, T = window.__T, spots = ['CB','FB','DM','CM','AM','WM','W','ST'], o = {};
  for(const k in T.STYLES) if(T.STYLES[k].role !== 'GK') o[k] = spots.map(sp => ({ main: 'M', second: 's', out: '.' })[S.posFit(k, sp)]).join('');
  o.gk = ['allround','shotstopper','sweeperkeeper'].map(k => S.posFit(k, 'GK') + '/' + S.posFit(k, 'CB')).join(' ');   // (v144: three keepers -- no one-on-one keeper)
  o.fpCover = S.fitPos({ role: 'DEF', subRole: 'CB', style: 'cover' }); o.fpNone = S.fitPos({ role: 'DEF', subRole: 'CB' }); o.fpWas = S.fitPos({ role: 'MID', subRole: 'AM', style: 'creator' });
  return o; });
info('archetypes\' fits (CB FB DM CM AM WM W ST): ' + Object.entries(tf).filter(([k]) => !['gk','fpCover','fpNone','fpWas'].includes(k)).map(([k, v]) => k + ' ' + v).join(' | '));
const WANT = { stopper: 'M.......', cover: 'Ms......', ballplayer: 'M.s.....', widecb: 'Ms......', libero: 'M.Ms....', fullback: '.M...s..', wingback: '.M...Ms.', deffb: 'sM......', invfb: '.Mss.s..',
  ballwinner: '..Ms....', deepcreator: '..Ms....', anchor: 's.Ms....', completemid: '..sMs...', boxtobox: '..sMss..', covermid: '..sM....', mezzala: '...Mss..', playmaker: '...sM...', trequartista: '...sM.ss', shadow: '...sM..s', widemid: '.s.s.M..', mwinger: '.s...Ms.', wideplaymaker: '....sMs.',
  winger: '.....sM.', trickster: '.....sM.', paceywinger: '.....sMs', invwinger: '.....sM.', complete: '......sM', poacher: '.......M', speedster: '......sM', target: '.......M', falsenine: '....s..M', pressfwd: '......sM' };   // (v127: DM and AM spots, and the central midfielders sorted among them; v143: the cover midfielder and the mezzala, the playmaker an AM, no inside forward; v144: the ball-winner a DM, the cover midfielder a CM, the complete midfielder and the pacey winger, an inverted full-back to CM too, a wide playmaker to AM)
const tfBad = Object.keys(WANT).filter(k => tf[k] !== WANT[k]);
ok(!tfBad.length && Object.keys(tf).length === 3 + 1 + Object.keys(WANT).length, 'every archetype\'s own spots and second ones, as agreed: a stopper only a centre-back, a libero a centre-back and a holding midfielder, a wing-back a full-back and a wide midfielder (and a winger at a push), an anchor a holding midfielder who covers centre-back, a false nine a striker who can drop into the hole' + (tfBad.length ? ' -- wrong: ' + tfBad.map(k => k + ' ' + tf[k]).join(', ') : ''));
ok(tf.gk === 'main/out main/out main/out' && tf.fpCover === 'cover' && tf.fpNone === 'CB' && tf.fpWas === 'trequartista', 'a keeper\'s three types (v144): in goal and nowhere else; a man goes by his archetype, one without by his position, and a Creator kept from before is a Trequartista (' + tf.gk + ')');
ok(fit.pen.second.offIQ > fit.pen.second.defIQ && fit.pen.second.defIQ > 0 && fit.pen.out.offIQ >= 2 * fit.pen.second.offIQ && fit.pen.out.defIQ >= 2 * fit.pen.second.offIQ,
  'in a second position a little off his Def IQ out of possession (' + fit.pen.second.defIQ + ') and a little more off his Off IQ on the ball (' + fit.pen.second.offIQ + '); out of position a good deal of both (' + fit.pen.out.offIQ + ', ' + fit.pen.out.defIQ + ')');
const marks = await page.evaluate(() => { const S = window.__S, d = S.d, out = { n: 0, bad: [], rate: [] };
  for(const el of document.querySelectorAll('#bpBody .tpitch .ptk[data-pos]')){ const p = d.roster[+el.dataset.ri], f = S.posFit(S.fitPos(p), el.dataset.pos), want = el.dataset.pos === 'GK' ? '' : { main: '', second: 'sec', out: 'oop' }[f];
    const has = el.classList.contains('oop') ? 'oop' : el.classList.contains('sec') ? 'sec' : ''; out.n++; if(has !== want) out.bad.push(S.natPos(p) + '@' + el.dataset.pos + ':' + has); }
  // one man, his rating in each position: his own, a second one, out of it (a cover CB: full-back's a second position of his)
  const p = d.roster.find(q => S.natPos(q) === 'CB') || d.roster.find(q => q.role === 'DEF'), st0 = p.style; p.style = 'cover';
  out.rate = [p.ovr, S.ovrAt(p, 'DEF', 'CB'), S.ovrAt(p, 'DEF', 'FB'), S.ovrAt(p, 'MID', 'WM'), S.natPos(p)]; p.style = st0;
  // the computer's clubs: how their men fit the spots they're picked for
  const n = { main: 0, second: 0, out: 0 }, nd = { main: 0, second: 0, out: 0 }; for(const c of S.mgAiClubs(d)){ const f = S.cwFormFor(c), sq = S.careerSquad(c, f), sp = S.careerSlots(f, 'atk');
    sq.slice(1).forEach((e, i) => n[S.posFit(S.fitPos(e), S.spotFit(sp[i]))]++);
    // ...and without the ball, in their defending shape
    const fd = S.defFormFor(f, S.postureOf(c.style)), dp = S.careerSlots(fd, 'def'), roster = sq.slice(1);
    S.careerMapDef({ lineup: { atk: [0, 1, 2, 3, 4, 5, 6, 7] }, formation: f, formDef: fd, roster }).forEach((ri, k) => nd[S.posFit(S.fitPos(roster[ri]), S.spotFit(dp[k]))]++); }
  out.clubs = n; out.clubsDef = nd;
  // who defends where: a 3-2-3 in a 4-3-1 needs a fourth defender from midfield -- the anchor (centre-back's one of his
  // second positions) rather than the playmaker beside him (out of position there). (v127: it was a 2-4-2 in a 3-4-1)
  const hold = { formation: '3-2-3', formDef: '4-3-1', lineup: { atk: [0, 1, 2, 3, 4, 5, 6, 7] }, roster: [['CB','cover'], ['CB','stopper'], ['CB','widecb'], ['DM','anchor'], ['CM','playmaker'], ['WNG','winger'], ['STK','poacher'], ['WNG','trickster']].map(([sub, style]) => ({ role: sub === 'CB' ? 'DEF' : sub === 'STK' || sub === 'WNG' ? 'ATT' : 'MID', subRole: sub, style })) };
  const hp = S.careerSlots('4-3-1', 'def'), hm = S.careerMapDef(hold); out.hold = [hp[hm.indexOf(3)].pos, hp[hm.indexOf(4)].pos];
  return out; });
info('your tactics pitch: ' + marks.n + ' tokens' + (marks.bad.length ? ', wrong: ' + marks.bad.join(' ') : '') + '; a ' + marks.rate[4] + ' rated ' + marks.rate[0] + ': ' + marks.rate.slice(1, 4).join(' / ') + ' at CB / FB / WM; the computer\'s clubs\' men in their spots: ' + JSON.stringify(marks.clubs));
ok(marks.n >= 8 && !marks.bad.length, 'on the tactics pitch a man in a second position of his has his rating in lime, one out of position in amber, one in his own as it was');
ok(marks.rate[1] === marks.rate[0] && marks.rate[2] < marks.rate[0] && marks.rate[0] - marks.rate[2] <= 3 && marks.rate[3] < marks.rate[2],
  'his rating: his own in his own position (' + marks.rate[1] + '), a little less in a second (' + marks.rate[2] + '), less again out of position (' + marks.rate[3] + ')');
const cl = marks.clubs, all = cl.main + cl.second + cl.out;
ok(cl.main / all >= 0.5 && cl.out / all <= 0.05, 'the computer\'s clubs pick each spot\'s man by position: ' + Math.round(cl.main / all * 100) + '% in their own, ' + Math.round(cl.second / all * 100) + '% in a second, ' + Math.round(cl.out / all * 100) + '% out of position');
const cd = marks.clubsDef, allD = cd.main + cd.second + cd.out;
ok(marks.hold.join() === 'CB,CM' && cd.out / allD <= 0.10,   // (v118: archetypes are choosier than positions were -- about 6% now, 4% before; over 120 new worlds 3.6% to 8.8%, so 10%: 8% failed one world in fourteen)
   'who defends where: his own position before another (a 3-2-3 defending in a 4-3-1: the anchor drops into the back four, not the playmaker: ' + marks.hold.join(' / ') + '; the computer\'s clubs without the ball ' + Math.round(cd.main / allD * 100) + '% in their own, ' + Math.round(cd.second / allD * 100) + '% in a second, ' + (cd.out / allD * 100).toFixed(1) + '% out of position)');

// --- the match: the shapes, the instructions and the stars reach the pitch ----------------------------
await page.click('#bldgPanel .bpTopBack');
for(let i = 0; i < 8 && !/PLAY/.test(await page.textContent('#chBottom')); i++){ await page.click('#chBottom [data-mg="forward"]'); await page.waitForTimeout(40); }
await page.evaluate(id => { window.__S.d.roster.find(q => q.id === id).cond = 0.6; }, d.roster[posRi.st].id);   // (the striker 60% fit: a game too many)
await page.click('#chBottom [data-mg="play"]'); await page.waitForTimeout(600);
const ids = { st: d.roster[posRi.st].id, cb: d.roster[posRi.cb].id, cm: d.roster[posRi.cm].id };
const m = await page.evaluate(ids => { const T = window.__T, f = T.forms(), G = T.players().filter(p => p.team === 'G'), R = T.players().filter(p => p.team === 'R');
  const count = (ps, k) => { const o = {}; for(const p of ps){ const r = p[k].role; o[r] = (o[r] || 0) + 1; } return o; };
  const by = id => G.find(p => p.lookKey === id);
  const posOK = G.every(p => p.slotAtk.pos === T.POS_OF[f[0]][p.slotAtk.si] && p.slotDef.pos === T.POS_OF[f[1]][p.slotDef.si]);
  return { f, gAtk: count(G, 'slotAtk'), gDef: count(G, 'slotDef'), rDef: count(R, 'slotDef'), posOK, sty: [T.TAC.G.style, T.TAC.G.def, T.TAC.R.style, T.TAC.R.def, T.postureOf(T.TAC.R.style)],
    ti: T.TI().G, tiR: T.TI().R, tiR0: T.tiDefault(T.TAC.R.style), stars: G.map(p => p.stars),
    legs: [by(ids.st).staminaCap, Math.min(...G.filter(p => p.lookKey !== ids.st).map(p => p.staminaCap))],
    want: G.map(p => { const S = window.__S, r = S.d.roster.find(q => q.id === p.lookKey); return r ? S.careerStars(r) : null; }) }; }, ids);
ok(m.f[0] === '3-2-3' && m.f[1] === '4-3-1', 'your shapes in the match: ' + m.f[0] + ' / ' + m.f[1]);
ok(Math.abs(m.legs[0] - 0.6) < 0.03 && m.legs[1] > 0.97, 'a man 60% fit starts the match with his legs\' ceiling at ' + Math.round(m.legs[0] * 100) + '% (the fresh ones at ' + Math.round(m.legs[1] * 100) + '%)');
ok(m.gAtk.DEF === 3 && m.gAtk.ATT === 3 && m.gDef.DEF === 4 && m.gDef.ATT === 1, 'with the ball 3-2-3, without it 4-3-1: ' + JSON.stringify(m.gAtk) + ' ' + JSON.stringify(m.gDef));
ok(!m.f[3] || !['2-3-3','2-4-2'].includes(m.f[3]), 'the opposition defends in ' + m.f[3]);
ok(m.posOK, 'every spot in the match knows what it is (CB, FB, DM, CM, AM, WM, W, ST)');
ok(JSON.stringify(m.ti) === JSON.stringify(tiKeep), 'your team instructions in the match, as you left them: ' + JSON.stringify(m.ti));
ok(JSON.stringify(m.tiR) === JSON.stringify(m.tiR0), 'theirs: their style\'s own (' + m.sty[2] + ')');
ok(m.sty[0] === 'gegen' && m.sty[1] === 'press' && m.sty[3] === m.sty[4], 'your GEGENPRESS presses in the match (its forwards pressing up, the line of engagement high); they (' + m.sty[2] + ') defend in their style\'s block: ' + m.sty.join(' / '));
ok(m.stars.every(s => s >= 1 && s <= 5) && m.stars.join() === m.want.join(), 'every man in the match has his own skill stars (one to five, for his age): ' + m.stars.join(''));
// IN THE MATCH: a man's spots cost him -- with the ball his Off IQ, without it his Def IQ -- as they fit his position
const iq = await page.evaluate(() => { const T = window.__T, p = T.players().find(q => q.team === 'G' && (T.POS_SECOND[T.fitOfP(q)] || []).length) || T.players().find(q => q.team === 'G');   // (a man with a second position: his archetype's, v118)
  const nat = T.fitOfP(p), keep = [p.slotAtk, p.slotDef], base = [p.stats.offIQ, p.stats.defIQ], spot = pos => Object.assign({}, p.slotAtk, { pos, fit: pos });   // (its fit its own: v127, a back three's outside spot's is CB/FB)
  const at = (a, d) => { p.slotAtk = spot(a); p.slotDef = spot(d); return [+T.statOf(p, 'offIQ', 0).toFixed(2), +T.statOf(p, 'defIQ', 0).toFixed(2)]; };
  const own = (T.POS_MAIN[nat] || ['CB'])[0], sec = (T.POS_SECOND[nat] || ['FB'])[0], away = ['ST', 'CB', 'FB', 'W'].find(s => T.posFit(nat, s) === 'out');
  const r = { nat, base, own: at(own, own), secAtk: at(sec, own), secDef: at(own, sec), out: at(away, away) };
  p.slotAtk = keep[0]; p.slotDef = keep[1]; return r; });
info('a ' + iq.nat + ' (Off IQ, Def IQ ' + iq.base.join(', ') + '): ' + JSON.stringify(iq));
ok(iq.own.join() === iq.base.join() && iq.secAtk[0] < iq.base[0] && iq.secAtk[1] === iq.base[1] && iq.secDef[0] === iq.base[0] && iq.secDef[1] < iq.base[1]
   && iq.base[0] - iq.secAtk[0] > iq.base[1] - iq.secDef[1] && iq.out[0] < iq.secAtk[0] && iq.out[1] < iq.secDef[1],
  'in the match: in his own position his IQ as it is; a second position with the ball costs a little Off IQ, without it a little less Def IQ; out of position a good deal of both');

// SUBS: the pause menu's TACTICS, then a man off the bench dragged onto one of yours -- he comes on, on fresh legs
await page.evaluate(() => document.getElementById('menuBtn').click()); await page.waitForTimeout(150);
const pm = await page.$$eval('#pauseGrid [data-pause]', ns => ns.filter(n => getComputedStyle(n).display !== 'none').map(n => n.dataset.pause));
ok(String(pm) === 'tactics,skills,settings,exit,simrest,back' && !(await page.$('#pauseQuick')), 'the pause menu: TACTICS, SKILL MOVES, SETTINGS, EXIT, SIM THE REST (v106), BACK (no quick row)');
await page.click('#pauseGrid [data-pause="tactics"]'); await page.waitForTimeout(150);
const mt = await page.evaluate(() => ({ ghosts: document.querySelectorAll('#mtacBody .tpGhost').length, faces: document.querySelectorAll('#mtacBody .tpitch .ptk img.ptkFace').length,
  men: document.querySelectorAll('#mtacBody .tpitch .ptk').length, bench: document.querySelectorAll('#mtacBody .tbBench .ptk img').length,
  card: !!document.querySelector('#mtacBody img.cardBody'), you: document.querySelectorAll('#mtacBody .ptkYou').length }));
ok(mt.ghosts === 8 && mt.faces === mt.men && mt.men === 9 && !mt.bench && mt.card && !mt.you, 'the match\'s tactics: faces on the men on the pitch (' + mt.faces + '/' + mt.men + '), none on the bench, all of him on his card, the other phase lit under them (' + mt.ghosts + '), no YOU badge');
const pre = await page.evaluate(() => ({ bench: document.querySelectorAll('#mtacBody .tbBench .ptk').length, head: document.getElementById('mtSubs').textContent }));
ok(pre.bench === 5 && /SUBS LEFT 3/.test(pre.head), 'the bench is five, and three subs a match: ' + pre.bench + ' on the bench, ' + pre.head);
const onName = await page.$eval('#mtacBody .tbBench .ptk', e => e.querySelector('.ptkName').textContent);
const offSi = await page.$eval('#mtacBody .tpitch .ptk[data-mtk="field"] >> nth=2', e => +e.dataset.si).catch(() => page.$$eval('#mtacBody .tpitch .ptk[data-mtk="field"]', ns => +ns[2].dataset.si));
await drag('#mtacBody .tbBench .ptk', `#mtacBody .tpitch .ptk[data-si="${offSi}"]`);
const sub = await page.evaluate(offSi => { const T = window.__T, S = T.SUBS().G, p = T.players().find(q => q.team === 'G' && q.squadIdx === S.on[0]);
  return { used: S.used, off: S.off[0], name: p && p.pname, legs: p && p.stamina, head: document.getElementById('mtSubs').textContent }; }, offSi);
ok(sub.used === 1 && sub.off === offSi && /\b/.test(sub.name || '') && (sub.name || '').endsWith(onName) && sub.legs === 1 && /SUBS LEFT 2/.test(sub.head),
   'a sub by drag: ' + sub.name + ' on, fresh legs, ' + sub.head);
// the second and third subs, then a fourth that isn't allowed
for(const k of [3, 4, 5]){ const si = await page.$$eval('#mtacBody .tpitch .ptk[data-mtk="field"]', (ns, k) => +ns[k].dataset.si, k); await drag('#mtacBody .tbBench .ptk', `#mtacBody .tpitch .ptk[data-si="${si}"]`); await page.waitForTimeout(80); }
const sub3 = await page.evaluate(() => ({ used: window.__T.SUBS().G.used, head: document.getElementById('mtSubs').textContent, bench: document.querySelectorAll('#mtacBody .tbBench .ptk').length }));
ok(sub3.used === 3 && /SUBS LEFT 0/.test(sub3.head) && sub3.bench === 2, 'a second sub and a third, and no fourth: ' + sub3.used + ' made, ' + sub3.head + ', ' + sub3.bench + ' left on the bench');
await page.click('#mtacOv [data-mt="back"]'); await page.waitForTimeout(80); await page.click('#pauseMenu [data-pause="back"]');

// the holder: told to GET FORWARD the other midfielders go, and one still holds
const hk = await page.evaluate(() => { const T = window.__T, h0 = T.holderOf('G'); if(!h0) return {}; const keep = T.TI().G.mruns;
  T.TI().G.mruns = 'fwd'; const h1 = T.holderOf('G'); T.TI().G.mruns = keep; T.holderOf('G');
  return { h0: h0.lookKey, h1: h1 && h1.lookKey }; });
ok(hk.h0 && hk.h1 === hk.h0, 'told to GET FORWARD, the midfield keeps its holder (one holds, the others go)');

process.exitCode = rep.finish();
await browser.close();
