// FOOTBALL CLASSIC, NINE A SIDE (v124): eight outfielders and a keeper. Ten shapes, each a seven-outfielder one with a man
// more at the back (2-3-2 is 3-3-2 now), their spots eight long, two for attacking only (two at the back) and two for
// defending only (five at the back); an old shape's name read as its new one (a seven- or six-outfielder one). Every
// exhibition club nine and a bench of five: its eight from before, named as they were, and a ninth -- a centre-back of its
// own in the middle of its back line -- the outside men of a back four full-backs; nobody shares a name. A match nine a side.
// What's kept from eight a side gets its eighth outfielder at the back, everyone else in his spot: a career (its shapes
// too), a club's side kept from the exhibition, the quick match's squads. On a copy of the game that lets the test reach it.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  // ===== END MANAGER CAREER', '  window.__N={FORMS, POS_OF, OUTFIELD, ATK_ONLY, DEF_ONLY, FORM_FROM_7, formOK, defFormFor, CLUBS, CLUB_NAME_DEAL, clubSquadGen, clubSide, clubCB9At, SQ_CB, '
  + 'players:()=>players, keepers:()=>keepers, SQUAD:()=>SQUAD, LINEUP:()=>LINEUP, forms:()=>[myForm,myFormDef,rForm,rFormDef], mgMigrate, ensureLineup, careerSlots, get d(){ return CAREER&&CAREER.data; }};\n  // ===== END MANAGER CAREER');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-nine-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy, papers: 'aside' });
const { ok, info } = rep;

// --- THE SHAPES ----------------------------------------------------------------------------------------------------------
const sh = await page.evaluate(() => { const N = window.__N, out = { bad: [] };
  out.names = Object.keys(N.FORMS).join(' ');
  for(const [f, L] of Object.entries(N.FORMS)){ if(L.reduce((a, b) => a + b, 0) !== 8 || f !== L.join('-')) out.bad.push(f + ' lines'); if((N.POS_OF[f] || []).length !== 8) out.bad.push(f + ' spots'); }
  out.from7 = Object.entries(N.FORM_FROM_7).filter(([o, n]) => { const a = o.split('-').map(Number), b = n.split('-').map(Number); return !(b[0] === a[0] + 1 && b[1] === a[1] && b[2] === a[2] && N.FORMS[n]); }).map(x => x.join('>'));
  out.read = [N.formOK('2-3-2', null), N.formOK('1-3-3', null), N.formOK('4-2-1', null), N.formOK('2-3-1', null), N.formOK('3-3-2', null), N.formOK('9-9-9', 'x')].join(' ');
  out.only = [N.ATK_ONLY.join(' '), N.DEF_ONLY.join(' ')];
  out.fb = Object.entries(N.POS_OF).filter(([f, P]) => { const n = N.FORMS[f][0], back = P.slice(0, n); return n >= 4 ? !(back[0] === 'FB' && back[n - 1] === 'FB' && back.slice(1, -1).every(p => p === 'CB')) : !back.every(p => p === 'CB'); }).map(x => x[0]);
  return out; });
info('the shapes: ' + sh.names + '; read from old saves: ' + sh.read);
ok(!sh.bad.length && sh.names.split(' ').length === 10, 'ten shapes, every one\'s lines adding up to eight and its spots eight long' + (sh.bad.length ? ': ' + sh.bad.join(', ') : ''));
ok(!sh.from7.length && sh.read === '3-3-2 2-3-3 5-2-1 3-3-2 3-3-2 x', 'each seven-outfielder shape grows into one with a man more at the back (2-3-2 3-3-2, 1-3-3 2-3-3, 4-2-1 5-2-1), a six-outfielder one through it (2-3-1 3-3-2)' + (sh.from7.length ? ': ' + sh.from7.join(', ') : ''));
ok(sh.only[0] === '2-3-3 2-4-2' && sh.only[1] === '5-2-1 5-1-2', 'two at the back for attacking only (' + sh.only[0] + '), five for defending only (' + sh.only[1] + ')');
ok(!sh.fb.length, 'a back three is centre-backs, a back four or five has a full-back at each end' + (sh.fb.length ? ': ' + sh.fb.join(', ') : ''));

// --- THE CLUBS: nine and a bench of five, the eight from before as they were and a centre-back of their own ---------------
const cl = await page.evaluate(() => { const N = window.__N, out = { bad: [], names: [], n: 0 }, K = N.CLUBS.length, D = N.CLUB_NAME_DEAL;
  N.CLUBS.forEach((c, ci) => { const sq = N.clubSquadGen(c), at = N.clubCB9At(c), xi = sq.slice(0, 9), L = N.FORMS[c.form], pos = N.POS_OF[c.form];
    if(sq.length !== 14) out.bad.push(c.id + ' ' + sq.length + ' men');
    const old = xi.filter((e, i) => i !== at);                                   // (the eight from before, in their order)
    old.forEach((e, i) => { const want = D[(i < 7 ? ci * 7 + i : K * 7 + ci) % D.length]; if(e.name !== want) out.bad.push(c.id + ' ' + e.name + ' for ' + want); });
    const cb = xi[at]; if(cb.role !== 'DEF' || !N.SQ_CB.includes(cb.style) || cb.name !== D[(K * 8 + ci) % D.length] || at !== 1 + Math.floor(L[0] / 2)) out.bad.push(c.id + ' ninth ' + cb.name + ' ' + cb.style + ' at ' + at);
    xi.slice(1).forEach((e, i) => { const p = pos[i], r = p === 'CB' || p === 'FB' ? 'DEF' : p === 'ST' || p === 'W' ? 'ATT' : 'MID'; if(e.role !== r) out.bad.push(c.id + ' ' + e.name + ' ' + e.role + ' at ' + p);
      if(p === 'FB' && !['fullback', 'deffb', 'invfb', 'wingback'].includes(e.style)) out.bad.push(c.id + ' ' + e.name + ' a ' + e.style + ' at FB'); });
    out.names.push(...sq.map(e => e.name)); out.n++; });
  out.dupes = out.names.length - new Set(out.names).size; out.names = out.names.length; return out; });
info('the clubs: ' + JSON.stringify(cl));
ok(cl.n === 20 && !cl.bad.length, 'every club nine and a bench of five: its eight from before, named as they were, each in his line, a full-back at each end of a back four, and a ninth -- a centre-back of its own -- in the middle of its back line' + (cl.bad.length ? ': ' + cl.bad.slice(0, 4).join(', ') : ''));
ok(cl.dupes === 0, 'nobody shares a name (' + cl.names + ' men)');

// --- A MATCH: nine a side, each in a spot of his shape -----------------------------------------------------------------
await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show'); await page.click('#exhGo'); await page.waitForTimeout(800);
const mt = await page.evaluate(() => { const N = window.__N, f = N.forms(), P = N.players(), side = t => P.filter(p => p.team === t);
  const fits = (t, fa, fd) => side(t).every(p => p.slotAtk.pos === N.POS_OF[fa][p.slotAtk.si] && p.slotDef.pos === N.POS_OF[fd][p.slotDef.si]);
  return { G: side('G').length, R: side('R').length, k: N.keepers().length, f, fit: fits('G', f[0], f[1]) && fits('R', f[2], f[3]) }; });
ok(mt.G === 8 && mt.R === 8 && mt.k === 2 && mt.fit, 'a match nine a side: eight outfielders each and the keepers (' + mt.G + ' + ' + mt.R + ' + ' + mt.k + '), every man in a spot of his side\'s shapes (' + mt.f.join(', ') + ')');

// --- KEPT FROM EIGHT A SIDE: a club's side, the quick match's squads -----------------------------------------------------
// a side as the exhibition kept it at eight a side: its keeper and seven, its bench of five, in its shape's old name
const side = await page.evaluate(() => { const N = window.__N, c = N.CLUBS.find(k => k.id === 'MCI'), sq = N.clubSquadGen(c), at = N.clubCB9At(c), cb = sq[at];
  const old = sq.filter((e, i) => i !== at), lineup = { gk: 0, atk: [7, 6, 5, 4, 3, 2, 1], def: [1, 2, 3, 4, 5, 6, 7] };   // (his own order: the side as you'd left it)
  localStorage.setItem('ft_clubsq', JSON.stringify({ MCI: { squad: old, lineup, form: '3-1-3', dform: '3-3-1' } }));
  const s = N.clubSide('MCI'); return { n: s.squad.length, atk: s.lineup.atk.join(), form: s.form, dform: s.dform, last: s.squad[s.squad.length - 1].name, cb: cb.name }; });
info('a side kept from eight a side: ' + JSON.stringify(side));
ok(side.n === 14 && side.last === side.cb && side.atk === '7,6,13,5,4,3,2,1' && side.form === '4-1-3' && side.dform === '4-3-1',
  'a club\'s side kept from eight a side: its ninth man joins it, in the middle of its back line (with the ball: ' + side.atk + '), everyone else in his spot; its shapes 3-1-3 / 3-3-1 read as ' + side.form + ' / ' + side.dform);
// the quick match's squads, kept at eight a side (a keeper and seven): a centre-back joins each, in the middle of the back line
const kept = await page.evaluate(() => { const N = window.__N; localStorage.removeItem('ft_clubsq');
  const S = N.SQUAD(), cut = t => S[t].slice(0, 8).map((e, i) => Object.assign({}, e, { role: ['GK', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'ATT', 'ATT'][i] }));
  return JSON.stringify({ __v: 1, SQUAD: { G: cut('G'), R: cut('R') }, LINEUP: { G: { gk: 0, atk: [1, 2, 3, 4, 5, 6, 7], def: [2, 1, 3, 4, 5, 6, 7] }, R: { gk: 0, atk: [1, 2, 3, 4, 5, 6, 7], def: [1, 2, 3, 4, 5, 6, 7] } } }); });
// (stored as the page loads, before the game reads it: a write just before a reload isn't always there after it)
await page.addInitScript(kept => { try{ if(!sessionStorage.getItem('qm8')){ sessionStorage.setItem('qm8', '1'); localStorage.setItem('ft7_squads', kept); } }catch(e){} }, kept);
await page.reload(); await page.waitForTimeout(700);
const qm = await page.evaluate(() => { const N = window.__N, S = N.SQUAD(), L = N.LINEUP(), f = N.forms(); return { n: [S.G.length, S.R.length], role: S.G[8] && S.G[8].role, atk: L.G.atk.join(), def: L.G.def.join(), f: f.slice(0, 2) }; });
info('the quick match\'s squads kept at eight a side: ' + JSON.stringify(qm));
const mid = f => String(Math.floor(+f.split('-')[0] / 2));
ok(qm.n.join() === '9,9' && qm.role === 'DEF' && qm.atk.split(',')[mid(qm.f[0])] === '8' && qm.def.split(',')[mid(qm.f[1])] === '8' && qm.atk.split(',').length === 8,
  'the quick match\'s squads kept at eight a side: a centre-back joins each (' + qm.n.join(' and ') + ' men), in the middle of the back line with the ball and without it (' + qm.atk + ' / ' + qm.def + ')');

// --- A CAREER saved with seven outfielders: its shapes grow, its eighth comes off the bench into the middle of the back line
await page.click('#smItems [data-act="new"]'); await page.waitForTimeout(150); await page.click('#newSlotList .slotBtn >> nth=0');
await page.waitForSelector('#mgrMaker.on', { timeout: 4000 }); await page.fill('#mgName', 'Sam Okafor'); await page.fill('#mgClubIn', 'Fenmoor Athletic');
await page.click('#mgGo'); await page.waitForSelector('#careerHub.show', { timeout: 8000 });
const cr = await page.evaluate(() => { const N = window.__N, d0 = N.d, R = d0.roster;
  const fresh = { roster: R.length, atk: N.ensureLineup(d0).atk.length, form: d0.formation, eight: !!d0.eight };
  // the same squad as a v123 save had it: 2-3-2 with the ball, 3-3-1 without, seven outfielders, no flag
  const d = JSON.parse(JSON.stringify(d0)); delete d.eight; d.formation = '2-3-2'; d.formDef = '3-3-1';
  const gk = R.findIndex(p => p.role === 'GK'), by = r => R.map((p, i) => i).filter(i => R[i].role === r && i !== gk);
  const def = by('DEF'), mid = by('MID'), att = by('ATT');
  const atk = [def[0], def[1], mid[0], mid[1], mid[2], att[0], att[1]], dfn = [def[0], mid[0], def[1], mid[1], mid[2], att[0], att[1]];   // (3-3-1 without it: a midfielder in the back three)
  d.lineup = { gk, atk, def: dfn, bench: R.map((p, i) => i).filter(i => i !== gk && !atk.includes(i)) };
  const firstDef = d.lineup.bench.find(i => R[i].role === 'DEF'), was = { atk: atk.slice(), dfn: dfn.slice() };
  N.mgMigrate(d);
  return { fresh, form: d.formation, formDef: d.formDef, atk: d.lineup.atk, def: d.lineup.def, was, firstDef, eight: d.eight, benchN: d.lineup.bench.length }; });
info('a career from seven outfielders: ' + JSON.stringify(cr));
const ins = (a, k, x) => { const b = a.slice(); b.splice(k, 0, x); return b.join(); };
ok(cr.fresh.roster === 15 && cr.fresh.atk === 8 && cr.fresh.form === '3-3-2' && cr.fresh.eight, 'a new career: fifteen men, eight outfielders on the pitch, in a 3-3-2');
ok(cr.form === '3-3-2' && cr.formDef === '4-3-1' && cr.eight, 'a career saved with seven outfielders: 2-3-2 with the ball reads as 3-3-2, 3-3-1 without it as 4-3-1');
ok(cr.atk.join() === ins(cr.was.atk, 1, cr.firstDef) && cr.def.join() === ins(cr.was.dfn, 2, cr.firstDef),
  '...and the first defender off the bench is its eighth, in the middle of the back line with the ball and without it, everyone else in his spot (' + cr.atk.join() + ' / ' + cr.def.join() + ')');

process.exitCode = rep.finish() ? 1 : 0;
await browser.close();
