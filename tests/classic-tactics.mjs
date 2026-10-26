// FOOTBALL CLASSIC, TACTICS: a shape with the ball and one without it (1-3-3 and 1-4-2 attacking only -- the computer
// never defends in them), width as COMPACT / BALANCED / WIDE, the style and the posture set apart, anyone in any
// position (the keeper too), player instructions (a midfielder told into the box gives up holding), and skill stars
// (1: the cut; 2: + the croqueta; 3: + the roulette and the rainbow flick). On a copy of the game that lets the test
// reach the match.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={players:()=>players, controlled:()=>controlled, forms:()=>[myForm,myFormDef,rForm,rFormDef], LINEUP:()=>LINEUP, SQUAD:()=>SQUAD, TAC, CLUBS, defFormFor, cwFormFor, ATK_ONLY, ins, instrKeys, holderOf:t=>{ holderCache[t]=null; return holderOf(t); }, '
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

// --- a career: the tactics screen ------------------------------------------------------------------
await page.click('#smItems [data-act="new"]'); await page.waitForTimeout(150);
await page.click('#newSlotList .slotBtn >> nth=0');
await page.waitForSelector('#mgrMaker.on', { timeout: 4000 });
await page.fill('#mgName', 'Sam Okafor'); await page.fill('#mgClubIn', 'Fenmoor Athletic');
await page.click('#mgGo'); await page.waitForSelector('#careerHub.show', { timeout: 6000 });
await page.click('#chCampus [data-bldg="office"]'); await page.click('#bldgPanel .bpTab:text-is("Tactics")'); await page.waitForTimeout(100);
ok(await page.isVisible('#bpBody [data-ctphase="atk"]') && await page.isVisible('#bpBody [data-ctphase="def"]'), 'WITH THE BALL / WITHOUT THE BALL');
ok(!(await page.isDisabled('#bpBody [data-cform="1-3-3"]')), 'with the ball, 1-3-3 can be picked');
await page.click('#bpBody [data-cform="2-2-3"]'); await page.waitForTimeout(80);
await page.click('#bpBody [data-cwidth="1.18"]'); await page.waitForTimeout(80);
await page.click('#bpBody [data-ctphase="def"]'); await page.waitForTimeout(80);
ok(await page.isDisabled('#bpBody [data-cform="1-3-3"]') && await page.isDisabled('#bpBody [data-cform="1-4-2"]'), 'without it, 1-3-3 and 1-4-2 are off');
await page.click('#bpBody [data-cform="3-3-1"]'); await page.waitForTimeout(80);
await page.click('#bpBody [data-cwidth="0.84"]'); await page.waitForTimeout(80);
let d = await save();
ok(d.formation === '2-2-3' && d.formDef === '3-3-1', 'saved: 2-2-3 with the ball, 3-3-1 without');
ok(d.width.atk === 1.18 && d.width.def === 0.84, 'saved: wide with the ball, compact without');
ok(d.lineup.def.length === 7 && [...d.lineup.def].sort().join() === [...d.lineup.atk].sort().join(), 'the same seven defend, in the defending spots');
const widths = await page.$$eval('#bpBody [data-cwidth]', ns => ns.map(n => n.textContent));
ok(String(widths) === 'COMPACT,BALANCED,WIDE', 'width: ' + widths.join(' / '));
// the style and the posture are set apart: picking a style leaves the posture alone
await page.click('#bpBody [data-cposture="press"]'); await page.waitForTimeout(60);
await page.click('#bpBody [data-ctphase="atk"]'); await page.waitForTimeout(60);
await page.click('#bpBody [data-cstyle="counter"]'); await page.waitForTimeout(60);
d = await save();
ok(d.style === 'counter' && d.posture === 'press', 'picking a style leaves the posture alone: ' + d.style + ' / ' + d.posture);

// anyone anywhere: the keeper out, a defender in goal (MOVE / SWAP)
const gkBefore = d.lineup.gk, field = d.lineup.atk[0];
await page.click('#bpBody [data-ctphase="atk"]'); await page.waitForTimeout(60);
await page.click(`#bpBody .pitch .ptk[data-ri="${field}"]`); await page.waitForTimeout(60);
await page.click('#tacStatRight [data-imove]'); await page.waitForTimeout(60);
await page.click(`#bpBody .pitch .ptk[data-ri="${gkBefore}"]`); await page.waitForTimeout(80);
d = await save();
ok(d.lineup.gk === field && d.lineup.atk.includes(gkBefore) && d.lineup.def.includes(gkBefore), 'an outfielder in goal, the keeper outfield (both phases)');
const tok = await page.$eval(`#bpBody .pitch .ptk[data-ri="${field}"]`, e => ({ oop: e.classList.contains('oop'), ovr: +e.querySelector('.ptkOvr').textContent }));
ok(tok.oop && tok.ovr < d.roster[field].ovr, 'out of position he plays below his rating: ' + tok.ovr + ' in goal, ' + d.roster[field].ovr + ' as a ' + d.roster[field].role);
await page.click('#bpBody [data-mg="best8"]'); await page.waitForTimeout(80);
d = await save();
ok(d.roster[d.lineup.gk].role === 'GK', 'PICK MY BEST EIGHT puts a keeper back in goal');

// instructions: a forward told to go in behind, a midfielder into the box, a man told to close down
const att = d.lineup.atk.find(ri => d.roster[ri].role === 'ATT');
await page.click(`#bpBody .pitch .ptk[data-ri="${att}"]`); await page.waitForTimeout(60);
const keys = await page.$$eval('#tacStatRight .instrGrpLbl', ns => ns.map(n => n.textContent));
ok(keys.includes('MOVEMENT') && keys.includes('ON THE BALL') && keys.includes('SHOOTING'), 'a forward\'s instructions with the ball: ' + keys.join(', '));
await page.click('#tacStatRight [data-ci="move"][data-v="behind"]'); await page.waitForTimeout(60);
await page.click('#tacStatRight [data-ci="shoot"][data-v="sight"]'); await page.waitForTimeout(60);
await page.click('#bpBody [data-ctphase="def"]'); await page.waitForTimeout(60);
await page.click(`#bpBody .pitch .ptk[data-ri="${att}"]`); await page.waitForTimeout(60);
await page.click('#tacStatRight [data-ci="press"][data-v="close"]'); await page.waitForTimeout(60);
d = await save();
const pid = d.roster[att].id;
ok(d.instr[pid] && d.instr[pid].move === 'behind' && d.instr[pid].shoot === 'sight' && d.instr[pid].press === 'close', 'saved: ' + JSON.stringify(d.instr[pid]));
await page.click('#tacStatRight [data-ci="press"][data-v="bal"]'); await page.waitForTimeout(60);
d = await save();
ok(!('press' in d.instr[pid]), 'back to BALANCED: nothing kept');

// --- the match: the shapes, the instructions and the stars reach the pitch ----------------------------
await page.click('#bldgPanel .bpTopBack');
for(let i = 0; i < 6 && !/PLAY/.test(await page.textContent('#chBottom')); i++){ await page.click('#chBottom [data-mg="nextday"]'); await page.waitForTimeout(40); }
await page.click('#chBottom [data-mg="play"]'); await page.waitForTimeout(600);
const m = await page.evaluate(pid => { const T = window.__T, f = T.forms(), G = T.players().filter(p => p.team === 'G'), R = T.players().filter(p => p.team === 'R');
  const count = (ps, k) => { const o = {}; for(const p of ps){ const r = p[k].role; o[r] = (o[r] || 0) + 1; } return o; };
  const me = G.find(p => p.lookKey === pid);
  return { f, gAtk: count(G, 'slotAtk'), gDef: count(G, 'slotDef'), rDef: count(R, 'slotDef'), instr: me && me.instr, stars: G.map(p => p.stars) }; }, pid);
ok(m.f[0] === '2-2-3' && m.f[1] === '3-3-1', 'your shapes in the match: ' + m.f[0] + ' / ' + m.f[1]);
ok(m.gAtk.DEF === 2 && m.gAtk.ATT === 3 && m.gDef.DEF === 3 && m.gDef.ATT === 1, 'with the ball 2-2-3, without it 3-3-1: ' + JSON.stringify(m.gAtk) + ' ' + JSON.stringify(m.gDef));
ok(!m.f[3] || !['1-3-3','1-4-2'].includes(m.f[3]), 'the opposition defends in ' + m.f[3]);
ok(m.instr && m.instr.move === 'behind' && m.instr.shoot === 'sight', 'his instructions are on him in the match');
ok(m.stars.every(s => s >= 1 && s <= 3), 'every man has 1-3 stars: ' + m.stars.join(''));

// a wide midfielder is told where to stand (POSITION), not when to go forward; a midfielder told INTO THE BOX is never
// the one holding
const hk = await page.evaluate(() => { const T = window.__T, wide = T.instrKeys('MID', 'MID', true, 'atk'), mid = T.instrKeys('MID', 'MID', false, 'atk');
  const h0 = T.holderOf('G'); if(!h0) return { wide, mid };
  const was = h0.instr; h0.instr = Object.assign({}, was, { fwdMID: 'box' }); const h1 = T.holderOf('G'); h0.instr = was; T.holderOf('G');
  return { wide, mid, h0: h0.lookKey, h1: h1 && h1.lookKey }; });
ok(!hk.wide.includes('fwdMID') && hk.wide.includes('pos') && hk.mid.includes('fwdMID'), 'a wide midfielder: ' + hk.wide.join(', ') + '; a central one: ' + hk.mid.join(', '));
ok(hk.h0 && hk.h1 !== hk.h0, 'told INTO THE BOX, the holder hands it on (' + (hk.h1 ? 'to his partner' : 'to nobody') + ')');

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
