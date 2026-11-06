// FOOTBALL CLASSIC, THE MIDFIELD (v127): eleven shapes -- 3-3-2, 3-2-3, 3-4-1, 3-1-3-1, 3-2-1-2, 3-1-2-2, 3-2-2-1, 4-2-2,
// 4-3-1, 4-1-3, 4-1-2-1 -- five of them in four lines, with a holding midfielder's spot (DM) and an attacking midfielder's
// (AM) where they have them; DM and AM positions of their own again, the central midfield archetypes sorted among the
// three, each covering the next one along; a holding and an attacking midfielder each half as common as a central one, a
// man drawn on his own and across a new career's world, every computer club with the men its shapes need; the outside men
// of a back three centre-backs or full-backs alike, nothing off either; a four-line shape played in four lines in a match,
// with the ball and without it, and drawn in four on both tactics pitches; and what's kept from before -- a career's central
// midfielders in their archetypes' positions, a side kept in 2-4-2 or 2-3-3 in the shape it's read as, each man in the spot
// nearest his old one. On a copy of the game that lets the test reach it (and lets the computer play your man too).
import { open, STAR } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  // ===== END MANAGER CAREER', '  window.__M={FORMS, POS_OF, STYLES, SUB_STYLES, natPos, fitPos, posFit, rateAt, spotFit, slotsFor, careerSlots, cwSubRole, cwFormFor, defFormFor, postureOf, '
  + 'CLUBS, clubSquadGen, clubSide, ensureForms, mgMigrate, posPenOf, openMatchTac, KID_POS, get MK_POS(){ return MK_POS; }, players:()=>players, SQUAD:()=>SQUAD, LINEUP:()=>LINEUP, '
  + 'forms:()=>[myForm,myFormDef,rForm,rFormDef], get d(){ return CAREER&&CAREER.data; }};\n  // ===== END MANAGER CAREER');
// (a computer v computer match: the computer plays your man too, and the frames go uncounted -- see the match below)
patch('  const LAB_TITLE=', '  window.__S={players:()=>players, now:()=>simNow, over:()=>matchOver, dims:()=>({FW,FH,MK}), held:()=>{ const h=heldBy()||gkHold; return h?h.team:null; }, atkOf, forms:()=>[myForm,myFormDef,rForm,rFormDef]};\n  const LAB_TITLE=');
patch('\n    draw();\n', '\n    if(!window.__noDraw) draw();\n');
patch('      if(p===controlled){ if(!skillStep(p,dt)) stepOutfield(p,hi.ix,hi.iy,dt); }', '      if(p===controlled&&!window.__aiAll){ if(!skillStep(p,dt)) stepOutfield(p,hi.ix,hi.iy,dt); }');
patch('carry(p,dt,p===controlled?(hi.ix||hi.iy):true)', 'carry(p,dt,(p===controlled&&!window.__aiAll)?(hi.ix||hi.iy):true)');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-mid-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy, papers: 'aside' });
const { ok, info } = rep;

// --- THE SHAPES ------------------------------------------------------------------------------------------------------------
const sh = await page.evaluate(() => { const M = window.__M, P = M.POS_OF;
  const four = Object.keys(M.FORMS).filter(f => M.FORMS[f].length === 4);
  const dmam = Object.keys(P).filter(f => P[f].some(x => x === 'DM' || x === 'AM'));
  return { names: Object.keys(M.FORMS).join(' '), four: four.join(' '), dmam: dmam.join(' '),
    spots: ['3-1-3-1', '3-2-1-2', '3-1-2-2', '3-2-2-1', '4-1-2-1', '4-1-3'].map(f => f + ': ' + P[f].join(' ')) }; });
info('the shapes: ' + sh.names + ' | ' + sh.spots.join(' | '));
ok(sh.names === '3-3-2 3-2-3 3-4-1 3-1-3-1 3-2-1-2 3-1-2-2 3-2-2-1 4-2-2 4-3-1 4-1-3 4-1-2-1', 'the eleven shapes, in their order on the menus (' + sh.names + ')');
ok(sh.four === '3-1-3-1 3-2-1-2 3-1-2-2 3-2-2-1 4-1-2-1' && sh.dmam === '3-1-3-1 3-2-1-2 3-2-2-1 4-1-2-1', 'five in four lines; the DM and AM spots only in four of them (' + sh.dmam + ')');
ok(sh.spots.join(' | ') === '3-1-3-1: CB CB CB DM WM AM WM ST | 3-2-1-2: CB CB CB CM CM AM ST ST | 3-1-2-2: CB CB CB CM WM WM ST ST | 3-2-2-1: CB CB CB DM DM WM WM ST | 4-1-2-1: FB CB CB FB DM WM WM ST | 4-1-3: FB CB CB FB CM W ST W',
  'each as asked: 3-1-3-1 a DM, two WMs and an AM; 3-2-1-2 two CMs and an AM; 3-1-2-2 a CM and two WMs; 3-2-2-1 two DMs and two WMs; 4-1-2-1 a DM and two WMs; 4-1-3\'s one in the middle a CM');

// --- POSITIONS AND ARCHETYPES --------------------------------------------------------------------------------------------
const po = await page.evaluate(() => { const M = window.__M, S = M.SUB_STYLES, w = k => S[k].reduce((a, x) => a + M.STYLES[x].w, 0), out = {};
  out.lists = ['DM', 'CM', 'AM'].map(k => k + ' ' + S[k].join(',') + ' (' + w(k) + ')');
  out.nat = [M.natPos({ role: 'MID', subRole: 'DM' }), M.natPos({ role: 'MID', subRole: 'AM' }), M.natPos({ role: 'MID', style: 'anchor' }), M.natPos({ role: 'MID', style: 'shadow' }), M.natPos({ role: 'MID', style: 'playmaker' })].join(' ');
  const fit = k => ['DM', 'CM', 'AM'].map(s => M.posFit(k, s)[0]).join('');   // (m: his own, s: a second one, o: out of position)
  out.fit = ['anchor', 'deepcreator', 'ballwinner', 'boxtobox', 'playmaker', 'shadow', 'trequartista'].map(k => k + ' ' + fit(k)).join(', ');
  return out; });
info('archetypes: ' + po.lists.join(' | ') + ' -- at DM, CM, AM: ' + po.fit);
ok(po.lists.join(' | ') === 'DM anchor,deepcreator (100) | CM boxtobox,playmaker,ballwinner (100) | AM shadow,trequartista (100)', 'the central midfield archetypes sorted among the three: DM the anchor and the deep creator, CM the box-to-box, the playmaker and the ball-winner, AM the shadow striker and the trequartista');
ok(po.nat === 'DM AM DM AM CM', 'a holding and an attacking midfielder are positions of their own again, and an archetype\'s is his (' + po.nat + ')');
ok(po.fit === 'anchor mso, deepcreator mso, ballwinner smo, boxtobox sms, playmaker oms, shadow osm, trequartista osm', 'each covers the next one along as a second position, and none the far end (' + po.fit + ')');

// --- A HOLDING AND AN ATTACKING MIDFIELDER HALF AS COMMON AS A CENTRAL ONE ----------------------------------------------------
const one = await page.evaluate(() => { const M = window.__M, n = { CM: 0, DM: 0, AM: 0, WM: 0 }; let s = 12345;
  const R = () => { s = (s * 1103515245 + 12345) >>> 0; return (s >>> 8) / 16777216; };
  for(let i = 0; i < 40000; i++) n[M.cwSubRole('MID', R)]++; return n; });
info('a midfielder drawn on his own, 40,000 times: ' + JSON.stringify(one));
ok(Math.abs(one.DM / one.CM - 0.5) < 0.04 && Math.abs(one.AM / one.CM - 0.5) < 0.04 && Math.abs(one.WM / 40000 - 0.25) < 0.01, 'a man drawn on his own: a holding and an attacking midfielder each half as common as a central one (' + (one.DM / one.CM).toFixed(2) + ', ' + (one.AM / one.CM).toFixed(2) + '), a wide one a quarter of them');

// --- THE OUTSIDE MEN OF A BACK THREE --------------------------------------------------------------------------------------
const b3 = await page.evaluate(() => { const M = window.__M, out = { bad: [] };
  for(const f of Object.keys(M.FORMS)){ const n = M.FORMS[f][0], want = n === 3 ? 'CB/FB CB CB/FB' : 'FB CB CB FB';
    const a = M.slotsFor('G', f, 'atk').slice(0, n).map(M.spotFit).join(' '), c = M.careerSlots(f, 'atk').slice(0, n).map(M.spotFit).join(' ');
    if(a !== want || c !== want) out.bad.push(f + ': ' + a + ' / ' + c); }
  out.fit = ['fullback', 'wingback', 'deffb', 'invfb', 'stopper', 'cover', 'ballplayer', 'widecb', 'libero', 'widemid', 'winger'].map(k => k + ' ' + M.posFit(k, 'CB/FB')[0]).join(', ');
  out.rate = [M.rateAt('DEF', 70, {}, 'fullback', 'DEF', 'CB/FB'), M.rateAt('DEF', 70, {}, 'fullback', 'DEF', 'CB')];
  return out; });
info('at a back three\'s outside spots: ' + b3.fit + '; a full-back rated 70 there ' + b3.rate[0] + ', in its middle ' + b3.rate[1]);
ok(!b3.bad.length, 'every back three\'s outside spots take a centre-back or a full-back (CB/FB), its middle a centre-back; a back four\'s ends full-backs -- in a match and on the career\'s pitch alike' + (b3.bad.length ? ': ' + b3.bad.join('; ') : ''));
ok(b3.fit === 'fullback m, wingback m, deffb m, invfb m, stopper m, cover m, ballplayer m, widecb m, libero m, widemid s, winger o' && b3.rate[0] === 70 && b3.rate[1] < 70,
  'every full-back and centre-back is in his own position there, nothing off his rating (a full-back rated 70: ' + b3.rate[0] + '; ' + b3.rate[1] + ' in the middle of it)');

// --- THE CLUBS: a squad for its shape ---------------------------------------------------------------------------------------
const cl = await page.evaluate(() => { const M = window.__M, out = [];
  for(const c of M.CLUBS){ const sq = M.clubSquadGen(c).slice(1, 9), sl = M.slotsFor('G', c.form, 'atk');
    const mis = sq.map((e, i) => M.posFit(M.fitPos(e), M.spotFit(sl[i]))).filter(f => f !== 'main').length;
    if(M.FORMS[c.form].length === 4 || mis) out.push(c.id + ' ' + c.form + ' ' + sq.map(e => M.natPos(e)).join(' ') + (mis ? ' (' + mis + ' off)' : '')); }
  return out; });
info('the clubs in four lines: ' + cl.join(' | '));
ok(cl.filter(x => /\(/.test(x)).length <= 1 && cl.filter(x => / 3-1-3-1 | 3-2-1-2 | 3-1-2-2 | 3-2-2-1 | 4-1-2-1 /.test(x)).length === 5
  && cl.some(x => /^TOT 3-1-3-1 CB CB CB DM WM AM WM STK/.test(x)) && cl.some(x => /^CHE 3-2-2-1 CB CB CB DM DM WM WM/.test(x)) && cl.some(x => /^BHA 3-2-1-2 CB CB CB CM CM AM/.test(x)),
  'five of the clubs play the four-line shapes, each with a squad made for its spots -- a DM in a DM\'s, an AM in an AM\'s -- and every club\'s men in their own positions (a second striker who\'s a winger aside)');

// --- THE TACTICS: a four-line shape drawn in four lines -----------------------------------------------------------------
// (set as the page loads: one set just before a reload can be lost -- v131, it started the wrong clubs now and then)
await page.addInitScript(() => { try{ localStorage.setItem('ft_exh', JSON.stringify({ you: 'TOT', opp: 'BHA' })); localStorage.removeItem('ft_clubsq'); }catch(e){} });
await page.reload(); await page.waitForTimeout(700);
await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show'); await page.click('#exhGo'); await page.waitForTimeout(800);
await page.evaluate(() => window.__M.openMatchTac(false)); await page.waitForTimeout(300);   // (drawn afresh for the side on the pitch now)
const tk = await page.evaluate(() => { const M = window.__M, at = {};
  for(const t of document.querySelectorAll('#mtacBody .tpitch .ptk[data-mtk="field"]')){ const r = t.getBoundingClientRect(), k = t.dataset.pos; (at[k] = at[k] || []).push(Math.round(r.left + r.width / 2)); }
  const mean = a => a ? a.reduce((s, v) => s + v, 0) / a.length : NaN;
  return { forms: M.forms(), x: Object.fromEntries(Object.entries(at).map(([k, v]) => [k, Math.round(mean(v))])), cs: M.careerSlots('3-2-2-1', 'atk').map(s => s.pos + '@' + s.y).join(' ') }; });
info('Tottenham\'s 3-1-3-1 on the match\'s tactics pitch (across): ' + JSON.stringify(tk.x) + '; 3-2-2-1 on the career\'s (down): ' + tk.cs);
ok(tk.forms[0] === '3-1-3-1' && tk.x.CB < tk.x.DM && tk.x.DM < tk.x.AM && tk.x.AM < tk.x.ST && Math.abs(tk.x.WM - tk.x.AM) < 3 && tk.x['CB/FB'] < tk.x.DM,
  'a four-line shape on the match\'s tactics pitch: four lines, back to front -- the back three, the DM, the WMs and the AM, the striker');
ok(tk.cs === 'CB@70 CB@70 CB@70 DM@54 DM@54 WM@36 WM@36 ST@18', '...and on the career\'s: four lines, its two midfield lines between the back line and the forward (' + tk.cs + ')');
await page.evaluate(() => { const o = document.getElementById('mtacOv'); if(o) o.classList.remove('on', 'pre'); });

// --- A MATCH: four lines with the ball and without it -----------------------------------------------------------------------
// two computer v computer matches, the frames uncounted: each spot's average depth (m from its own goal) and how far across
async function lines(you, opp){
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 1000 } });
  await ctx.addInitScript(STAR);
  await ctx.addInitScript(([you, opp]) => { try{ localStorage.setItem('ft_exh', JSON.stringify({ you, opp })); }catch(e){} }, [you, opp]);
  await ctx.addInitScript(() => { let vt = 0; const ch = new MessageChannel(), q = [];
    ch.port1.onmessage = () => { const cbs = q.splice(0); vt += 33; for(const cb of cbs){ try{ cb(vt); }catch(e){} } };
    window.requestAnimationFrame = cb => { q.push(cb); if(q.length === 1) ch.port2.postMessage(0); return 0; }; });
  const pg = await ctx.newPage(); pg.on('pageerror', e => rep.errs.push('PAGEERROR: ' + e.message));
  await pg.goto('file://' + copy); await pg.waitForTimeout(300);
  await pg.click('#smItems [data-act="exhibition"]'); await pg.waitForSelector('#exhPanel.show'); await pg.click('#exhGo'); await pg.waitForTimeout(300);
  const r = await pg.evaluate(async () => { const T = window.__S; window.__noDraw = true; window.__aiAll = true; const acc = {}; let last = -1;
    await new Promise(res => { (function tick(){ const t = T.now(); if(T.over() || t > 240) return res();
      if(t - last > 0.5){ last = t; const h = T.held(); if(h){ const D = T.dims();
        for(const p of T.players()){ const ph = p.team === h ? 'atk' : 'def', sl = ph === 'atk' ? p.slotAtk : p.slotDef; if(!sl) continue;
          const k = p.team + ph + sl.pos, a = acc[k] || (acc[k] = { u: 0, w: 0, n: 0 }); a.u += (T.atkOf(p.team) > 0 ? p.x : D.FW - p.x) / D.MK; a.w += Math.abs(p.y - D.FH / 2) / D.MK; a.n++; } } }
      requestAnimationFrame(tick); })(); });
    const out = {}; for(const k in acc) out[k] = [+(acc[k].u / acc[k].n).toFixed(1), +(acc[k].w / acc[k].n).toFixed(1)]; return { forms: T.forms(), out }; });
  await ctx.close(); return r; }
const m1 = await lines('TOT', 'BHA'), u1 = (k) => m1.out[k] ? m1.out[k][0] : NaN;
info('Tottenham 3-1-3-1 v Brighton 3-2-1-2, depth in m: ' + JSON.stringify(m1.out));
ok(m1.forms.join() === '3-1-3-1,3-1-3-1,3-2-1-2,3-2-1-2', 'Tottenham in their 3-1-3-1 and Brighton in their 3-2-1-2, with the ball and without it');
ok(u1('GatkCB') < u1('GatkDM') && u1('GatkDM') + 6 < u1('GatkAM') && u1('GatkAM') < u1('GatkST') && u1('GdefCB') < u1('GdefDM') && u1('GdefDM') + 3 < u1('GdefAM') && u1('GdefAM') < u1('GdefST'),
  '3-1-3-1: the DM a line behind the AM, with the ball (' + u1('GatkDM') + ' and ' + u1('GatkAM') + ' m out) and without it (' + u1('GdefDM') + ' and ' + u1('GdefAM') + ')');
ok(u1('RatkCM') + 1 < u1('RatkAM') && u1('RatkAM') < u1('RatkST') && u1('RdefCM') + 1 < u1('RdefAM') && u1('RdefAM') < u1('RdefST'),   // (v134: 3 and 2 m -- one match's average swings by more: 1.3 to 5.1 m with the ball over three on v131)
  '3-2-1-2: the AM between the two CMs and the strikers, with the ball (' + u1('RatkCM') + ', ' + u1('RatkAM') + ', ' + u1('RatkST') + ' m) and without it (' + u1('RdefCM') + ', ' + u1('RdefAM') + ', ' + u1('RdefST') + ')');
const m2 = await lines('HUL', 'SUN'), v2 = (k, i) => m2.out[k] ? m2.out[k][i] : NaN;
info('Hull 3-1-2-2 v Sunderland 4-1-2-1, [depth, across] in m: ' + JSON.stringify(m2.out));
ok(v2('GatkWM', 1) > 18 && v2('GatkCM', 1) < 10 && v2('GatkCM', 0) < v2('GatkWM', 0), '3-1-2-2: its two WMs on their own in a line play wide (' + v2('GatkWM', 1) + ' m across with the ball), the CM central behind them');
ok(v2('RdefDM', 0) < v2('RdefWM', 0) && v2('RdefCB', 0) < v2('RdefDM', 0) && v2('RatkDM', 0) < v2('RatkWM', 0), '4-1-2-1: the DM between the back four and the WMs (' + v2('RdefCB', 0) + ', ' + v2('RdefDM', 0) + ', ' + v2('RdefWM', 0) + ' m out without the ball)');

// --- A NEW CAREER'S WORLD, AND WHAT'S KEPT FROM BEFORE ------------------------------------------------------------------------
await page.click('#smItems [data-act="new"]').catch(async () => { await page.reload(); await page.waitForTimeout(700); await page.click('#smItems [data-act="new"]'); });
await page.waitForTimeout(150); await page.click('#newSlotList .slotBtn >> nth=0'); await page.waitForTimeout(100);
if(await page.isVisible('#confirmModal.on')) await page.click('#confirmModal [data-cf="yes"]');
await page.waitForSelector('#mgrMaker.on', { timeout: 4000 }); await page.fill('#mgName', 'Sam Okafor'); await page.fill('#mgClubIn', 'Fenmoor Athletic');
await page.click('#mgGo'); await page.waitForSelector('#careerHub.show', { timeout: 8000 });
const wd = await page.evaluate(() => { const M = window.__M, d = M.d, n = { CM: 0, DM: 0, AM: 0 }, short = [];
  for(const c of Object.values(d.world.clubs)){ if(c.id === d.clubId) continue; const have = {};
    for(const p of c.players){ const s = M.natPos(p); have[s] = (have[s] || 0) + 1; if(n[s] != null) n[s]++; }
    const f = M.cwFormFor(c), need = {}; for(const F of [f, M.defFormFor(f, M.postureOf(c.style))]){ const k = {}; for(const s of M.POS_OF[F]) k[s] = (k[s] || 0) + 1; for(const s in k) need[s] = Math.max(need[s] || 0, k[s]); }
    for(const s of ['DM', 'AM', 'CM']) if((need[s] || 0) > (have[s] || 0)) short.push(c.name + ' ' + f + ' ' + s); }
  const R = d.roster.map(p => M.natPos(p)).filter(s => s === 'CM' || s === 'DM' || s === 'AM');
  return { n, short, yours: R.join(' '), kid: M.KID_POS.join(' '), mk: M.MK_POS.map(x => x[0]).join(' ') }; });
info('a new career\'s computer clubs: ' + JSON.stringify(wd.n) + ' in the middle of midfield; yours: ' + wd.yours);
ok(wd.n.DM / wd.n.CM > 0.3 && wd.n.DM / wd.n.CM < 0.75 && wd.n.AM / wd.n.CM > 0.3 && wd.n.AM / wd.n.CM < 0.75,   // (v131: 0.35 to 0.68 -- a world came out at 0.69)
  'across the computer clubs, a holding and an attacking midfielder each about half as common as a central one (' + (wd.n.DM / wd.n.CM).toFixed(2) + ', ' + (wd.n.AM / wd.n.CM).toFixed(2) + ')');
ok(!wd.short.length, 'every computer club has a man of his own for each DM, AM and CM spot of its shapes' + (wd.short.length ? ': short at ' + wd.short.slice(0, 3).join(', ') : ''));
ok(/CM/.test(wd.yours), 'your own squad has a central midfielder for the 3-3-2 you start in (' + wd.yours + ')');
ok(/ DM CM AM /.test(' ' + wd.kid + ' ') && / DM CM AM /.test(' ' + wd.mk + ' '), 'the wonderkid\'s POSITION and the market\'s have DM and AM (' + wd.kid + ' / ' + wd.mk + ')');
const kept = await page.evaluate(() => { const M = window.__M, d0 = M.d, R = d0.roster;
  // a career saved before: its central midfielders all CMs (v118 to v126), whatever their archetypes
  const d = JSON.parse(JSON.stringify(d0)), mids = d.roster.filter(p => p.role === 'MID' && p.subRole !== 'WM').slice(0, 3);
  ['anchor', 'shadow', 'playmaker'].forEach((k, i) => { if(mids[i]){ mids[i].style = k; mids[i].subRole = 'CM'; } });
  M.mgMigrate(d); const pos = mids.map(p => p.style + ' ' + p.subRole).join(', ');
  // ...and one in 2-4-2, its men in its spots: read as 3-4-1, each man to the spot nearest his old one
  const e = JSON.parse(JSON.stringify(d0)), by = r => e.roster.map((p, i) => i).filter(i => e.roster[i].role === r);
  const df = by('DEF'), md = by('MID'), at = by('ATT'), atk = [df[0], df[1], md[0], md[1], md[2], md[3], at[0], at[1]];
  e.formation = '2-4-2'; e.formDef = '3-4-1'; e.lineup = { gk: e.lineup.gk, atk, def: atk.slice(), bench: e.roster.map((p, i) => i).filter(i => i !== e.lineup.gk && !atk.includes(i)) };
  M.ensureForms(e); const sp = M.careerSlots(e.formation, 'atk').map(s => s.pos), was = ['CB', 'CB', 'WM', 'CM', 'CM', 'WM', 'ST', 'ST'];
  const moved = atk.map((ri, i) => was[i] + '>' + sp[e.lineup.atk.indexOf(ri)]);
  return { pos, form: e.formation, moved: moved.join(' '), same: [...e.lineup.def].sort().join() === [...e.lineup.atk].sort().join() }; });
info('a career saved before: ' + kept.pos + '; in 2-4-2: read as ' + kept.form + ', its men ' + kept.moved);
ok(kept.pos === 'anchor DM, shadow AM, playmaker CM', 'a career saved before: a central midfielder\'s position is his archetype\'s (' + kept.pos + ')');
const LN = { CB: 0, FB: 0, DM: 1, CM: 1, AM: 1, WM: 1, W: 2, ST: 2 }, far = kept.moved.split(' ').filter(m => { const [a, b] = m.split('>'); return Math.abs(LN[a] - LN[b]) > 1; });
ok(kept.form === '3-4-1' && /^CB>CB CB>CB /.test(kept.moved) && /ST>ST/.test(kept.moved) && !far.length && kept.same,
  'a career kept in 2-4-2: it plays 3-4-1, its centre-backs and a striker where they were, nobody more than a line from his old spot, the same eight without the ball (' + kept.moved + ')');
const ex = await page.evaluate(() => { const M = window.__M, c = M.CLUBS.find(k => k.id === 'TOT'), sq = M.clubSquadGen(c);
  // Tottenham's side as the exhibition kept it in 2-3-3 (CB CB WM CM WM W ST W): the same men, in their old spots
  const order = [1, 2, 3, 4, 5, 6, 7, 8], was = ['CB', 'CB', 'WM', 'CM', 'WM', 'W', 'ST', 'W'];
  localStorage.setItem('ft_clubsq', JSON.stringify({ TOT: { squad: sq, lineup: { gk: 0, atk: order.slice(), def: order.slice() }, form: '2-3-3', dform: '3-3-2' } }));
  const s = M.clubSide('TOT'), sp = M.slotsFor('G', s.form, 'atk').map(x => x.pos); localStorage.removeItem('ft_clubsq');
  return { form: s.form, moved: order.map((si, i) => was[i] + '>' + sp[s.lineup.atk.indexOf(si)]).join(' ') }; });
info('an exhibition side kept in 2-3-3: read as ' + ex.form + ', its men ' + ex.moved);
ok(ex.form === '3-2-3' && /^CB>CB CB>CB /.test(ex.moved) && / W>W ST>ST W>W$/.test(ex.moved), 'an exhibition side kept in 2-3-3: it plays 3-2-3, its front three and centre-backs where they were (' + ex.moved + ')');

process.exitCode = rep.finish() ? 1 : 0;
await browser.close();
