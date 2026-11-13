// FOOTBALL CLASSIC, THE COPIES (v213): the shapes as set on the Signature Players sheet -- five COPIES, each a shape's
// lines with its spots set another way, named for its lines and its number as the sheet names it (3-3-2 (2), 3-2-3 (2),
// 3-2-1-2 (2), 4-3-1 (2), 4-1-2-1 (2)) and on the menus after the one it's a copy of; and 3-1-2-2's and 3-2-2-1's spots
// as the sheet has them now. A copy plays by its own spots: three CMs stand in off the touchlines and play in the middle,
// none of them holding the width; two wingers on their own up front stand as wide as the back line and hold it; the men
// drawn for it are drawn for its spots (no width ahead of a back line: wing-backs at its ends); it defends as the shape
// it's a copy of. A club in a shape whose spots changed has the side kept for it dealt afresh. The career's training pitch
// has the copies too. On a copy of the game that lets the test reach these (and lets the computer play your man too).
import { open, STAR } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  // ===== END MANAGER CAREER', '  window.__C={FORMS, POS_OF, defFormFor, slotsFor, careerSlots, slotStylesFor, SQ_WB, SQ_FB, SQ_CBW, SQ_CB, SQ_W, SQ_ST, SQ_DM, SQ_AM, SQ_CM, SQ_CM1, SQ_WM, '
  + 'clubSig, clubById, clubSide, clubSquadGen, defaultLineup, hashStr, CLUB_SPOTS, isWideMan, setTeamForm, YC:()=>YC, FH:()=>FH, players:()=>players, forms:()=>[myForm,myFormDef,rForm,rFormDef], '
  + 'get d(){ return CAREER&&CAREER.data; }};\n  // ===== END MANAGER CAREER');
// (a computer v computer match: the computer plays your man too, and the frames go uncounted -- as classic-midfield's)
patch('  const LAB_TITLE=', '  window.__S={players:()=>players, now:()=>simNow, over:()=>matchOver, dims:()=>({FW,FH,MK}), held:()=>{ const h=heldBy()||gkHold; return h?h.team:null; }, atkOf};\n  const LAB_TITLE=');
patch('\n    draw();\n', '\n    if(!window.__noDraw) draw();\n');
patch('      if(p===controlled){ if(!skillStep(p,dt)) stepOutfield(p,hi.ix,hi.iy,dt); }', '      if(p===controlled&&!window.__aiAll){ if(!skillStep(p,dt)) stepOutfield(p,hi.ix,hi.iy,dt); }');
patch('carry(p,dt,p===controlled?(hi.ix||hi.iy):true)', 'carry(p,dt,(p===controlled&&!window.__aiAll)?(hi.ix||hi.iy):true)');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-copies-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy, papers: 'aside' });
const { ok, info } = rep;
const COPIES = { '3-3-2 (2)': 'CB CB CB CM CM CM ST ST', '3-2-3 (2)': 'CB CB CB DM DM W ST W', '3-2-1-2 (2)': 'CB CB CB CM CM AM W W', '4-3-1 (2)': 'FB CB CB FB CM CM CM ST', '4-1-2-1 (2)': 'FB CB CB FB CM AM AM ST' };

// --- THE SHAPES: the copies, and the two the sheet changed -------------------------------------------------------------
const sh = await page.evaluate(COPIES => { const C = window.__C, names = Object.keys(C.FORMS), out = {};
  out.names = names.join(', ');
  out.after = Object.keys(COPIES).every(f => names.indexOf(f) === names.indexOf(f.replace(' (2)', '')) + 1 && C.FORMS[f].join('-') === f.replace(' (2)', ''));
  out.spots = Object.keys(COPIES).filter(f => (C.POS_OF[f] || []).join(' ') !== COPIES[f]);
  out.changed = ['3-1-2-2', '3-2-2-1'].map(f => f + ': ' + C.POS_OF[f].join(' ')).join(' | ');
  out.def = Object.keys(COPIES).map(f => f + ' ' + ['press', 'neutral', 'lowblock'].map(p => C.defFormFor(f, p)).join('/'));
  out.defOK = Object.keys(COPIES).every(f => { const o = f.replace(' (2)', ''); return ['press', 'neutral', 'lowblock'].every(p => { const a = C.defFormFor(o, p), b = C.defFormFor(f, p); return a === o ? b === f : b === a; }); });
  return out; }, COPIES);
info('the shapes: ' + sh.names + ' | ' + sh.changed);
ok(sh.names.split(', ').length === 16 && sh.after && !sh.spots.length, 'five copies, each named for its lines and its number and on the menus right after the shape it\'s a copy of, its spots as set on the sheet' + (sh.spots.length ? ': ' + sh.spots.join(', ') : ''));
ok(sh.changed === '3-1-2-2: CB CB CB DM WM WM ST ST | 3-2-2-1: CB CB CB CM CM WM WM ST', '3-1-2-2\'s man in front of the back three a DM (a CM before), 3-2-2-1\'s two there CMs (DMs before), as the sheet has them');
info('without the ball (gegenpress / most styles / sitting deep): ' + sh.def.join(', '));
ok(sh.defOK && /^3-2-3 \(2\) 3-2-3 \(2\)\/3-4-1\/4-3-1$/.test(sh.def[1]), 'a copy defends as the shape it\'s a copy of -- in itself where that one defends in its own (3-2-3 (2): itself when it presses, else 3-4-1, or 4-3-1 sitting deep)');

// --- WHERE ITS MEN STAND: three CMs in off the touchlines; two wingers on their own up front out wide -----------------------
const st = await page.evaluate(() => { const C = window.__C, YC = C.YC(), FH = C.FH(), across = (f, i) => Math.abs(C.slotsFor('G', f, 'atk')[i].homeY - YC) / FH, cx = (f, i) => Math.abs(C.careerSlots(f, 'atk')[i].x - 50);
  const nm = o => o === C.SQ_WB ? 'WB' : o === C.SQ_FB ? 'FB' : o === C.SQ_CBW ? 'CBW' : o === C.SQ_CB ? 'CB' : o === C.SQ_W ? 'W' : o === C.SQ_ST ? 'ST' : o === C.SQ_DM ? 'DM' : o === C.SQ_AM ? 'AM' : o === C.SQ_CM || o === C.SQ_CM1 ? 'CM' : o === C.SQ_WM ? 'WM' : '?';
  return { m332: [across('3-3-2', 3), across('3-3-2 (2)', 3), across('3-3-2', 0)], m431: [across('4-3-1', 4), across('4-3-1 (2)', 4)], f3212: [across('3-2-1-2', 6), across('3-2-1-2 (2)', 6), across('3-2-1-2 (2)', 0)],
    c332: [cx('3-3-2', 3), cx('3-3-2 (2)', 3)], c3212: [cx('3-2-1-2', 6), cx('3-2-1-2 (2)', 6), cx('3-2-1-2 (2)', 0)],
    styles: ['3-3-2', '3-3-2 (2)', '3-2-1-2 (2)', '3-2-3 (2)', '4-3-1 (2)'].map(f => f + ': ' + C.slotStylesFor(f).slice(1).map(nm).join(' ')) }; });
const pc = x => Math.round(x * 100);
info('across the pitch (a share of its width from the middle): 3-3-2\'s WM ' + pc(st.m332[0]) + '%, 3-3-2 (2)\'s CM at the end of the line ' + pc(st.m332[1]) + '%; 4-3-1 ' + pc(st.m431[0]) + '%, 4-3-1 (2) ' + pc(st.m431[1]) + '%; 3-2-1-2\'s ST ' + pc(st.f3212[0]) + '%, 3-2-1-2 (2)\'s W ' + pc(st.f3212[1]) + '% (its back three\'s end ' + pc(st.f3212[2]) + '%)');
ok(st.m332[1] < st.m332[0] * 0.7 && st.m431[1] < st.m431[0] * 0.7 && st.c332[1] < st.c332[0] * 0.7, 'a line of three CMs stands in off the touchlines -- two-thirds as wide as a WM-CM-WM line, in a match and on the career\'s tactics pitch');
ok(Math.abs(st.f3212[1] - st.f3212[2]) < 0.01 && st.f3212[1] > st.f3212[0] * 1.6 && Math.abs(st.c3212[1] - st.c3212[2]) < 0.5, 'two wingers on their own up front stand as wide as the back three\'s ends, as two wide midfielders on their own do -- two strikers stand in the middle');
info('the men each shape\'s spots call for: ' + st.styles.join(' | '));
ok(st.styles[0] === '3-3-2: CBW CB CBW WM CM WM ST ST' && st.styles[1] === '3-3-2 (2): WB CB WB CM CM CM ST ST' && st.styles[2] === '3-2-1-2 (2): CBW CB CBW CM CM AM W W' && st.styles[3] === '3-2-3 (2): CBW CB CBW DM DM W ST W',
  'the men drawn for a copy are drawn for its spots: 3-2-1-2 (2)\'s wingers, 3-2-3 (2)\'s DMs -- and with no width ahead of it, 3-3-2 (2)\'s back three has wing-backs at its ends (3-3-2\'s, a centre-back\'s or full-back\'s)');

// --- A SIDE KEPT IN A SHAPE WHOSE SPOTS CHANGED: dealt afresh ---------------------------------------------------------------
const kept = await page.evaluate(() => { const C = window.__C, all = {}, mk = id => { const c = C.clubById(id), sq = C.clubSquadGen(c), j = sq.findIndex((e, i) => i > 0 && !e.star);
    sq[j] = Object.assign({}, sq[j], { name: 'Kept Man' });   // (the side as it was kept: a man of its own in it)
    return { squad: sq, lineup: C.defaultLineup(), form: c.form, sig: C.hashStr(JSON.stringify([c.form, c.style, C.CLUB_SPOTS[c.id] || {}])) }; };   // (kept under the club's settings before v213)
  for(const id of ['CHE', 'JUV', 'ARS']) all[id] = mk(id);
  localStorage.setItem('ft_clubsq', JSON.stringify(all));
  const has = id => C.clubSide(id).squad.some(e => e && e.name === 'Kept Man');
  return { che: has('CHE'), juv: has('JUV'), ars: has('ARS'), chePos: C.POS_OF[C.clubById('CHE').form].join(' ') }; });
await page.evaluate(() => localStorage.removeItem('ft_clubsq'));
ok(!kept.che && !kept.juv && kept.ars, 'a side kept for Chelsea or Juventus (3-2-2-1, its spots changed) is dealt afresh for its spots now; one kept for Arsenal (its shape as it was) is kept');

// --- PICKED IN A MATCH: from the menu, kept with the club ------------------------------------------------------------------
await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show'); await page.click('#exhTac'); await page.waitForTimeout(400);
await page.click('#mtacBody [data-mtdrop="form"]'); await page.waitForTimeout(100);
const menu = await page.$$eval('#mtacBody [data-mtform]', ns => ns.map(n => ({ f: n.dataset.mtform, t: n.textContent.trim(), top: Math.round(n.getBoundingClientRect().top) })));
const rows = [...new Set(menu.map(m => m.top))].length;
await page.click('#mtacBody [data-mtform="3-2-3 (2)"]'); await page.waitForTimeout(150);
const picked = await page.evaluate(() => ({ forms: window.__C.forms(), shown: (document.querySelector('#mtacBody [data-mtdrop="form"]') || {}).textContent }));
info('the match\'s shape menu: ' + menu.map(m => m.t).join(' · ') + ' (' + rows + ' rows); picked: ' + JSON.stringify(picked));
ok(menu.length === 16 && rows === 4 && menu.every(m => m.t === m.f) && picked.forms[0] === '3-2-3 (2)' && /3-2-3 \(2\)/.test(picked.shown), 'the match\'s shape menu: the sixteen, four rows of four, each by its name; 3-2-3 (2) picked from it and shown on the menu button');
await page.reload(); await page.waitForTimeout(700);
const back = await page.evaluate(() => { const s = window.__C.clubSide(JSON.parse(localStorage.getItem('ft_exh') || '{}').you || 'ARS'); return s.form; });
ok(back === '3-2-3 (2)', 'kept with your club: there again after a reload (' + back + ')');

// --- A MATCH IN THEM: the copies' spots played as set -------------------------------------------------------------------
// a computer v computer match each way (the frames uncounted): each spot's average distance across the pitch with the ball,
// in m, its line and its place in it
async function across(fg, fr){
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 1000 } });
  await ctx.addInitScript(STAR);
  await ctx.addInitScript(() => { try{ localStorage.setItem('ft_exh', JSON.stringify({ you: 'ARS', opp: 'MCI' })); localStorage.removeItem('ft_clubsq'); }catch(e){} });
  await ctx.addInitScript(() => { let vt = 0; const ch = new MessageChannel(), q = [];
    ch.port1.onmessage = () => { const cbs = q.splice(0); vt += 33; for(const cb of cbs){ try{ cb(vt); }catch(e){} } };
    window.requestAnimationFrame = cb => { q.push(cb); if(q.length === 1) ch.port2.postMessage(0); return 0; }; });
  const pg = await ctx.newPage(); pg.on('pageerror', e => rep.errs.push('PAGEERROR: ' + e.message));
  await pg.goto('file://' + copy); await pg.waitForTimeout(300);
  await pg.click('#smItems [data-act="exhibition"]'); await pg.waitForSelector('#exhPanel.show'); await pg.click('#exhGo'); await pg.waitForTimeout(300);
  const r = await pg.evaluate(async ([fg, fr]) => { const C = window.__C, T = window.__S; window.__noDraw = true; window.__aiAll = true;
    for(const [t, f] of [['G', fg], ['R', fr]]) for(const ph of ['atk', 'def']) C.setTeamForm(t, ph, f);
    const acc = {}, wide = {}; let last = -1;
    await new Promise(res => { (function tick(){ const t = T.now(); if(T.over() || t > 200) return res();
      if(t - last > 0.5 && t > 10){ last = t; const h = T.held(); if(h){ const D = T.dims();
        for(const p of T.players()){ if(p.team !== h) continue; const sl = p.slotAtk; if(!sl) continue;
          const k = p.team + sl.pos + sl.lineNo + '.' + sl.lineIdx, a = acc[k] || (acc[k] = { w: 0, n: 0 }); a.w += Math.abs(p.y - D.FH / 2) / D.MK; a.n++; wide[k] = C.isWideMan(p); } } }
      requestAnimationFrame(tick); })(); });
    const out = {}; for(const k in acc) out[k] = +(acc[k].w / acc[k].n).toFixed(1); return { forms: C.forms(), out, wide }; }, [fg, fr]);
  await ctx.close(); return r; }
const A = await across('3-3-2', '3-2-1-2'), B = await across('3-3-2 (2)', '3-2-1-2 (2)');
const m = (r, k1, k2) => (r.out[k1] + r.out[k2]) / 2;
const midA = m(A, 'GWM1.0', 'GWM1.2'), midB = m(B, 'GCM1.0', 'GCM1.2'), upA = m(A, 'RST3.0', 'RST3.1'), upB = m(B, 'RW3.0', 'RW3.1');
info('with the ball, m across: ' + JSON.stringify({ A: A.out, B: B.out }));
info('wide men: ' + JSON.stringify({ A: A.wide, B: B.wide }));
ok(A.forms.join() === '3-3-2,3-3-2,3-2-1-2,3-2-1-2' && B.forms.join() === '3-3-2 (2),3-3-2 (2),3-2-1-2 (2),3-2-1-2 (2)', 'a match in each: 3-3-2 v 3-2-1-2, then their copies');
ok(midB + 4 < midA && !B.wide['GCM1.0'] && !B.wide['GCM1.2'] && A.wide['GWM1.0'] && A.wide['GWM1.2'], '3-3-2 (2)\'s CMs at the ends of its midfield play in the middle with the ball (' + midB.toFixed(1) + ' m across, 3-3-2\'s WMs ' + midA.toFixed(1) + '), and don\'t hold the width');
ok(upB > upA + 5 && B.wide['RW3.0'] && B.wide['RW3.1'] && !A.wide['RST3.0'], '3-2-1-2 (2)\'s two wingers play out wide with the ball (' + upB.toFixed(1) + ' m across, 3-2-1-2\'s strikers ' + upA.toFixed(1) + '), holding the width');

// --- THE CAREER: the copies on the training pitch -----------------------------------------------------------------------
await page.click('#smItems [data-act="new"]'); await page.waitForTimeout(150);
await page.click('#newSlotList .slotBtn >> nth=0');
await page.waitForSelector('#mgrMaker.on', { timeout: 4000 });
await page.fill('#mgName', 'Sam Okafor'); await page.fill('#mgClubIn', 'Fenmoor Athletic');
await page.click('#mgGo'); await page.waitForSelector('#careerHub.show', { timeout: 6000 });
if(await page.isVisible('#storyModal.on')){ await page.click('#storyModal [data-st="answer"]'); await page.waitForTimeout(40); await page.click('#storyModal [data-st="phone"]'); await page.waitForTimeout(40); }
await page.emulateMedia({ reducedMotion: 'reduce' });
await page.click('#chCampus [data-bldg="train"]'); await page.click('#bldgPanel .bpTab:text-is("Tactics")'); await page.waitForTimeout(100);
await page.click('#bpBody [data-tdrop="form"]'); await page.waitForTimeout(60);
const cm = await page.$$eval('#bpBody [data-cform]', ns => ns.map(n => n.dataset.cform + (n.disabled ? '!' : '')));
await page.click('#bpBody [data-cform="4-3-1 (2)"]'); await page.waitForTimeout(100);
await page.click('#bpBody [data-ctphase="def"]'); await page.waitForTimeout(60);
await page.click('#bpBody [data-tdrop="form"]'); await page.waitForTimeout(60); await page.click('#bpBody [data-cform="4-1-2-1 (2)"]'); await page.waitForTimeout(100);
const cs = await page.evaluate(() => { const d = JSON.parse(localStorage.getItem('ft_mgr_slot1')); return { f: d.formation, fd: d.formDef, cms: window.__C.careerSlots(d.formation, 'atk').filter(s => s.pos === 'CM').length }; });
info('the career\'s shape menu: ' + cm.join(', ') + '; set: ' + JSON.stringify(cs));
ok(cm.length === 16 && !cm.some(x => /!/.test(x)) && cs.f === '4-3-1 (2)' && cs.fd === '4-1-2-1 (2)' && cs.cms === 3, 'the career\'s training pitch: the sixteen, every one open; 4-3-1 (2) with the ball and 4-1-2-1 (2) without it, set and saved with the career');

process.exitCode = rep.finish();
await browser.close();
