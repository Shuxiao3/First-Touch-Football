// FOOTBALL CLASSIC, THE TYPES IN EACH POSITION (v143): three in each of the three middles -- a holding midfielder (DM) the
// Anchor, the Deep creator and the new Cover midfielder; a central one (CM) the Box-to-box, the Ball-winner and the new
// Mezzala; an attacking one (AM) the Playmaker (a central midfielder's before), the Shadow striker and the Trequartista --
// and the Inside forward gone from the wingers, his share to the rest. How common each is in its position, out of a
// hundred; where each plays; their stats' shape; the exhibition clubs' men; and what's kept from before -- an Inside
// forward (a career's, a kept side's) re-labelled as the winger his stats fit best, his stats and rating as they were, and
// a playmaker in a career an attacking midfielder.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  // ===== END MANAGER CAREER', '  window.__M={STYLES, SUB_STYLES, ARCH, typeKept, inferStyle, posFit, natPos, CLUBS, clubSquadGen, clubSide, slotStylesFor, cwStatsForOVR, cwStyleStats, cwOverall, cwMul, '
  + 'mgMigrate, mgStats, get d(){ return CAREER&&CAREER.data; }};\n  // ===== END MANAGER CAREER');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-roster-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;

// --- THE TYPES IN EACH POSITION, AND HOW COMMON ----------------------------------------------------------------------------
const ro = await page.evaluate(() => { const M = window.__M, S = M.SUB_STYLES, out = {};
  out.lists = ['DM', 'CM', 'AM', 'WNG'].map(k => k + ' ' + S[k].map(x => x + ' ' + M.STYLES[x].w).join(', ') + ' = ' + S[k].reduce((a, x) => a + M.STYLES[x].w, 0));
  out.sums = Object.keys(S).map(k => k + ' ' + S[k].reduce((a, x) => a + M.STYLES[x].w, 0)).join(' ');
  out.gone = 'insidefwd' in M.STYLES;
  const fit = k => ['CB', 'DM', 'CM', 'AM', 'WM', 'W', 'ST'].map(s => ({ main: 'M', second: 's', out: '.' })[M.posFit(k, s)]).join('');   // (at CB DM CM AM WM W ST)
  out.fit = ['covermid', 'mezzala', 'playmaker'].map(k => k + ' ' + fit(k)).join(', ');
  out.names = ['covermid', 'mezzala', 'playmaker'].map(k => M.STYLES[k].name).join(', ');
  return out; });
info('the types: ' + ro.lists.join(' | ') + ' -- fits at CB DM CM AM WM W ST: ' + ro.fit);
ok(ro.lists.join(' | ') === 'DM anchor 40, deepcreator 35, covermid 25 = 100 | CM boxtobox 45, ballwinner 30, mezzala 25 = 100 | AM playmaker 40, shadow 35, trequartista 25 = 100 | WNG trickster 37, winger 37, invwinger 26 = 100',
  'three of each in the middle -- DM the anchor 40, the deep creator 35, the cover midfielder 25; CM the box-to-box 45, the ball-winner 30, the mezzala 25; AM the playmaker 40, the shadow striker 35, the trequartista 25 -- and the wingers trickster 37, winger 37, inverted winger 26');
ok(!ro.gone && /^(\w+ 100 ?)+$/.test(ro.sums), 'no Inside forward any more, and every position\'s shares come to a hundred (' + ro.sums + ')');
ok(ro.fit === 'covermid sMs...., mezzala ..Mss.., playmaker ..sM...' && ro.names === 'Cover midfielder, Mezzala, Playmaker',
  'the cover midfielder a holding midfielder who can go to centre-back or central midfield, the mezzala a central one who can go to attacking or wide midfield, the playmaker an attacking one who can drop to central (' + ro.fit + ')');

// --- THEIR STATS: the shape of the man, at the same rating ------------------------------------------------------------------
const st = await page.evaluate(() => { const M = window.__M, out = {}, med = a => { a = a.slice().sort((x, y) => x - y); return a[a.length >> 1]; };
  for(const k of ['anchor', 'deepcreator', 'covermid', 'boxtobox', 'ballwinner', 'mezzala', 'playmaker']){ const S = { speed: [], interceptions: [], defIQ: [], dribbling: [], ovr: [] };
    for(let i = 0; i < 60; i++){ const s = M.cwStatsForOVR('MID', 65, M.cwMul(1000 + i)); M.cwStyleStats('MID', s, k, 65); for(const x of ['speed', 'interceptions', 'defIQ', 'dribbling']) S[x].push(s[x]); S.ovr.push(M.cwOverall('MID', s)); }
    out[k] = { speed: med(S.speed), interceptions: med(S.interceptions), defIQ: med(S.defIQ), dribbling: med(S.dribbling), ovr: med(S.ovr) }; }
  return out; });
info('at a rating of 65, the middle of: ' + Object.entries(st).map(([k, v]) => k + ' ' + JSON.stringify(v)).join(' | '));
ok(st.covermid.speed > st.anchor.speed && st.covermid.speed > st.deepcreator.speed && st.covermid.interceptions >= st.deepcreator.interceptions && st.covermid.defIQ >= st.boxtobox.defIQ + 1,
  'the cover midfielder: the quicker holder (pace ' + st.covermid.speed + ' against the anchor\'s ' + st.anchor.speed + ' and the deep creator\'s ' + st.deepcreator.speed + '), and he reads it -- interceptions ' + st.covermid.interceptions + ', Def IQ ' + st.covermid.defIQ);
ok(st.mezzala.dribbling >= st.boxtobox.dribbling + 1 && st.mezzala.dribbling >= st.ballwinner.dribbling + 1,
  'the mezzala dribbles (' + st.mezzala.dribbling + ', the box-to-box ' + st.boxtobox.dribbling + ', the ball-winner ' + st.ballwinner.dribbling + ')');
ok(Object.values(st).every(v => Math.abs(v.ovr - 65) <= 1), 'and every one of them is the rating he was made for: a type is the kind of man, not how good (' + Object.values(st).map(v => v.ovr).join(' ') + ')');

// --- THE EXHIBITION CLUBS' MEN --------------------------------------------------------------------------------------------
const ex = await page.evaluate(() => { const M = window.__M, n = {}, at = { DM: {}, CM: {}, AM: {} };
  for(const c of M.CLUBS){ const sq = M.clubSquadGen(c); for(const e of sq) if(e && e.style){ n[e.style] = (n[e.style] || 0) + 1; const p = M.natPos(e); if(at[p]) at[p][e.style] = (at[p][e.style] || 0) + 1; } }
  const lists = ['3-1-3-1', '3-2-1-2'].map(f => M.slotStylesFor(f).filter(Boolean).flat());
  return { n, at, inLists: lists.flat().includes('insidefwd'), clubs: M.CLUBS.length }; });
info('the ' + ex.clubs + ' exhibition clubs\' men in the middle: ' + JSON.stringify(ex.at));
ok(!ex.n.insidefwd && !ex.inLists, 'no Inside forward in any exhibition club, nor in any spot\'s list');
ok((ex.at.AM.playmaker || 0) > 0 && !ex.at.CM.playmaker && (ex.at.DM.covermid || 0) + (ex.n.covermid || 0) > 0 && (ex.n.mezzala || 0) > 0,
  'their attacking midfielders include playmakers (' + (ex.at.AM.playmaker || 0) + '), their central midfielders none; cover midfielders (' + (ex.n.covermid || 0) + ') and mezzalas (' + (ex.n.mezzala || 0) + ') among their men');

// --- AN INSIDE FORWARD KEPT FROM BEFORE: the winger his stats fit best, as he was ---------------------------------------------
// (one made as v142 made them: a winger's averages and the Inside forward's offsets, a little either way)
const rl = await page.evaluate(() => { const M = window.__M, was = { speed:1, acceleration:1, dribbling:0.5, shotAcc:1, offIQ:1, composure:0.5, strength:-1.5, crossing:-1, curve:-0.5, heading:-0.5 };
  const R = M.cwMul(77), tally = {};
  for(let i = 0; i < 300; i++){ const s = {}; for(const k in M.ARCH.ATT) s[k] = Math.max(1, Math.min(10, Math.round((M.ARCH.ATT[k] + (was[k] || 0) + (R() * 2 - 1) * 0.9) * 2) / 2));
    const t = M.typeKept('insidefwd', 'ATT', s); tally[t] = (tally[t] || 0) + 1; }
  // ...a side kept on the exhibition screen with one in it
  const c = M.CLUBS[3], side = M.clubSide(c.id), i = side.squad.findIndex(e => e && e.role === 'ATT');
  const e = side.squad[i]; e.style = 'insidefwd'; const stats0 = JSON.stringify(e.stats);
  const all = JSON.parse(localStorage.getItem('ft_clubsq') || '{}') || {}; all[c.id] = side; localStorage.setItem('ft_clubsq', JSON.stringify(all));
  const back = M.clubSide(c.id).squad[i]; localStorage.removeItem('ft_clubsq');
  return { tally, kept: { style: back.style, same: JSON.stringify(back.stats) === stats0 } }; });
info('300 Inside forwards made as v142 made them, re-labelled: ' + JSON.stringify(rl.tally) + '; one in a kept side: ' + JSON.stringify(rl.kept));
const tl = rl.tally, nW = (tl.trickster || 0) + (tl.winger || 0) + (tl.invwinger || 0);
ok(nW === 300 && (tl.invwinger || 0) > 150, 'an Inside forward from before is the winger his stats fit best -- most of them Inverted wingers, the nearest (' + JSON.stringify(tl) + ')');
ok(['trickster', 'winger', 'invwinger'].includes(rl.kept.style) && rl.kept.same, 'one in an exhibition side kept from before: re-labelled (' + rl.kept.style + '), his stats as they were');

// --- A CAREER KEPT FROM BEFORE: its Inside forwards re-labelled, its playmakers attacking midfielders -------------------------
await page.click('#smItems [data-act="new"]'); await page.waitForTimeout(150); await page.click('#newSlotList .slotBtn >> nth=0'); await page.waitForTimeout(100);
if(await page.isVisible('#confirmModal.on')) await page.click('#confirmModal [data-cf="yes"]');
await page.waitForSelector('#mgrMaker.on', { timeout: 4000 }); await page.fill('#mgName', 'Sam Okafor'); await page.fill('#mgClubIn', 'Fenmoor Athletic');
await page.click('#mgGo'); await page.waitForSelector('#careerHub.show', { timeout: 8000 });
const cr = await page.evaluate(() => { const M = window.__M, d = JSON.parse(JSON.stringify(M.d)), W = d.world;
  const all = [...d.roster, ...(W.free || []), ...(d.youth || []), ...Object.values(W.clubs).flatMap(c => c.players || [])];
  const wing = all.filter(p => p.role === 'ATT' && p.subRole === 'WNG').slice(0, 12), mids = all.filter(p => p.role === 'MID' && p.style === 'playmaker');
  const before = wing.map(p => ({ at: p.at, ovr: p.ovr }));
  for(const p of wing) p.style = 'insidefwd';                      // (a career saved with Inside forwards in it)
  for(const p of mids) p.subRole = 'CM';                           // (...and its playmakers central midfielders, as they were)
  M.mgMigrate(d);
  return { wing: wing.map(p => p.style), same: wing.every((p, i) => p.at === before[i].at && p.ovr === before[i].ovr), mids: mids.length, midsAM: mids.filter(p => p.subRole === 'AM').length,
    leftover: all.filter(p => p.style === 'insidefwd').length }; });
info('a career kept from before: its Inside forwards now ' + cr.wing.join(' ') + '; ' + cr.midsAM + ' of its ' + cr.mids + ' playmakers attacking midfielders');
ok(cr.wing.length === 12 && cr.wing.every(s => ['trickster', 'winger', 'invwinger'].includes(s)) && cr.same && !cr.leftover,
  'a career kept from before: every Inside forward (yours, the clubs\', free, youth) the winger his stats fit best, his attributes and rating as they were');
ok(cr.mids > 0 && cr.midsAM === cr.mids, 'and its playmakers attacking midfielders now (' + cr.midsAM + ' of ' + cr.mids + ')');

process.exitCode = rep.finish();
await browser.close();
