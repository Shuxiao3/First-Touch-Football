// FOOTBALL CLASSIC, THE TYPES IN EACH POSITION (v143): three in each of the three middles -- a holding midfielder (DM) the
// Anchor, the Deep creator and the new Cover midfielder; a central one (CM) the Box-to-box, the Ball-winner and the new
// Mezzala; an attacking one (AM) the Playmaker (a central midfielder's before), the Shadow striker and the Trequartista --
// and the Inside forward gone from the wingers, his share to the rest. How common each is in its position, out of a
// hundred; where each plays; their stats' shape; the exhibition clubs' men; and what's kept from before -- an Inside
// forward (a career's, a kept side's) re-labelled as the winger his stats fit best, his stats and rating as they were, and
// a playmaker in a career an attacking midfielder. (v144: DM the ball-winner 40, the deep creator 35, the anchor 25; CM the
// new complete midfielder 40, the box-to-box 25, the cover midfielder 20 -- a CM's now -- and the mezzala 15; AM the
// playmaker 50, the trequartista 35, the shadow striker 15; the wingers the winger 40, the trickster 25, the new pacey
// winger 20, the inverted winger 15; the strikers the complete forward 25, the poacher 25, the speedster 20, the target
// man 20, the false nine 10, no pressing forward made; the keepers the all-rounder 40, the shot-stopper 35, the sweeper
// keeper 25 -- the one-on-one keeper gone, re-labelled as the keeper his keeping fits best.)
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
  out.lists = ['DM', 'CM', 'AM', 'WNG', 'STK', 'GK'].map(k => k + ' ' + S[k].map(x => x + ' ' + M.STYLES[x].w).join(', ') + ' = ' + S[k].reduce((a, x) => a + M.STYLES[x].w, 0));
  out.sums = Object.keys(S).map(k => k + ' ' + S[k].reduce((a, x) => a + M.STYLES[x].w, 0)).join(' ');
  out.gone = 'insidefwd' in M.STYLES || 'onevone' in M.STYLES;
  const fit = k => ['CB', 'DM', 'CM', 'AM', 'WM', 'W', 'ST'].map(s => ({ main: 'M', second: 's', out: '.' })[M.posFit(k, s)]).join('');   // (at CB DM CM AM WM W ST)
  out.fit = ['ballwinner', 'completemid', 'covermid', 'mezzala', 'playmaker', 'wideplaymaker', 'paceywinger'].map(k => k + ' ' + fit(k)).join(', ');
  out.names = ['ballwinner', 'completemid', 'covermid', 'mezzala', 'playmaker', 'paceywinger'].map(k => M.STYLES[k].name).join(', ');
  out.invfb = M.posFit('invfb', 'CM');
  return out; });
info('the types: ' + ro.lists.join(' | ') + ' -- fits at CB DM CM AM WM W ST: ' + ro.fit);
ok(ro.lists.join(' | ') === 'DM ballwinner 40, deepcreator 35, anchor 25 = 100 | CM completemid 40, boxtobox 25, covermid 20, mezzala 15 = 100 | AM playmaker 50, trequartista 35, shadow 15 = 100 | WNG winger 40, trickster 25, paceywinger 20, invwinger 15 = 100 | STK complete 25, poacher 25, speedster 20, target 20, falsenine 10, pressfwd 0 = 100 | GK allround 40, shotstopper 35, sweeperkeeper 25 = 100',
  'v144: DM the ball-winner 40, the deep creator 35, the anchor 25; CM the complete midfielder 40, the box-to-box 25, the cover midfielder 20, the mezzala 15; AM the playmaker 50, the trequartista 35, the shadow striker 15; the wingers 40, 25, 20 (the pacey winger) and 15; the strikers 25, 25, 20, 20, 10 -- no pressing forward made; the keepers 40, 35, 25');
ok(!ro.gone && /^(\w+ 100 ?)+$/.test(ro.sums), 'no Inside forward and no One-on-one keeper any more, and every position\'s shares come to a hundred (' + ro.sums + ')');
ok(ro.fit === 'ballwinner .Ms...., completemid .sMs..., covermid .sM...., mezzala ..Mss.., playmaker ..sM..., wideplaymaker ...sMs., paceywinger ....sMs' && ro.invfb === 'second'
   && ro.names === 'Ball-winner, Complete midfielder, Cover midfielder, Mezzala, Playmaker, Pacey winger',
  'where they play: the ball-winner a DM (CM too), the complete midfielder a CM (DM and AM too), the cover midfielder a CM (DM too), the mezzala a CM (AM and WM), the playmaker an AM (CM), the wide playmaker AM too, the pacey winger a winger (WM and ST); an inverted full-back CM too (' + ro.fit + ')');

// --- THEIR STATS: the shape of the man, at the same rating ------------------------------------------------------------------
const st = await page.evaluate(() => { const M = window.__M, out = {}, med = a => { a = a.slice().sort((x, y) => x - y); return a[a.length >> 1]; };
  const KEYS = ['speed', 'interceptions', 'defIQ', 'dribbling', 'stamina', 'crossing', 'passAcc', 'ballControl', 'tackle', 'offIQ', 'shotAcc', 'strength'];
  for(const [k, role] of [['anchor', 'MID'], ['deepcreator', 'MID'], ['ballwinner', 'MID'], ['completemid', 'MID'], ['boxtobox', 'MID'], ['covermid', 'MID'], ['mezzala', 'MID'], ['playmaker', 'MID'], ['winger', 'ATT'], ['paceywinger', 'ATT']]){
    const S = { ovr: [] }; for(const x of KEYS) S[x] = [];
    for(let i = 0; i < 60; i++){ const s = M.cwStatsForOVR(role, 65, M.cwMul(1000 + i)); M.cwStyleStats(role, s, k, 65); for(const x of KEYS) S[x].push(s[x]); S.ovr.push(M.cwOverall(role, s)); }
    out[k] = { ovr: med(S.ovr) }; for(const x of KEYS) out[k][x] = med(S[x]); }
  return out; });
const low = k => Math.min(...['passAcc', 'ballControl', 'tackle', 'interceptions', 'defIQ', 'offIQ', 'shotAcc', 'stamina', 'strength', 'dribbling'].map(x => st[k][x]));
info('at a rating of 65, the middle of: ' + Object.entries(st).map(([k, v]) => k + ' ' + JSON.stringify(v)).join(' | '));
ok(st.covermid.speed > st.anchor.speed && st.covermid.speed > st.deepcreator.speed && st.covermid.interceptions >= st.deepcreator.interceptions && st.covermid.defIQ >= st.boxtobox.defIQ + 1,
  'the cover midfielder: quicker than the holders (pace ' + st.covermid.speed + ' against the anchor\'s ' + st.anchor.speed + ' and the deep creator\'s ' + st.deepcreator.speed + '), and he reads it -- interceptions ' + st.covermid.interceptions + ', Def IQ ' + st.covermid.defIQ);
ok(low('completemid') >= low('boxtobox') && low('completemid') >= low('mezzala') && low('completemid') >= low('covermid') && low('completemid') >= low('playmaker') && st.boxtobox.stamina > Math.max(st.completemid.stamina, st.covermid.stamina, st.mezzala.stamina),
  'the complete midfielder has no weak spot -- his worst a ' + low('completemid') + ' (the box-to-box\'s ' + low('boxtobox') + ', the mezzala\'s ' + low('mezzala') + ', the cover midfielder\'s ' + low('covermid') + ') -- and the box-to-box the engine: stamina ' + st.boxtobox.stamina);
ok(st.paceywinger.speed >= st.winger.speed + 0.5 && st.paceywinger.crossing < st.winger.crossing,
  'the pacey winger: the quickest of the wingers (' + st.paceywinger.speed + ', the winger ' + st.winger.speed + '), paid for in the rest -- crossing ' + st.paceywinger.crossing + ' to the winger\'s ' + st.winger.crossing);
ok(st.mezzala.dribbling >= st.boxtobox.dribbling + 1 && st.mezzala.dribbling >= st.ballwinner.dribbling + 1,
  'the mezzala dribbles (' + st.mezzala.dribbling + ', the box-to-box ' + st.boxtobox.dribbling + ', the ball-winner ' + st.ballwinner.dribbling + ')');
ok(Object.values(st).every(v => Math.abs(v.ovr - 65) <= 1), 'and every one of them is the rating he was made for: a type is the kind of man, not how good (' + Object.values(st).map(v => v.ovr).join(' ') + ')');

// --- THE EXHIBITION CLUBS' MEN --------------------------------------------------------------------------------------------
const ex = await page.evaluate(() => { const M = window.__M, n = {}, at = { DM: {}, CM: {}, AM: {} };
  for(const c of M.CLUBS){ const sq = M.clubSquadGen(c); for(const e of sq) if(e && e.style){ n[e.style] = (n[e.style] || 0) + 1; const p = M.natPos(e); if(at[p]) at[p][e.style] = (at[p][e.style] || 0) + 1; } }
  const lists = ['3-1-3-1', '3-2-1-2'].map(f => M.slotStylesFor(f).filter(Boolean).flat());
  return { n, at, inLists: ['insidefwd', 'onevone', 'pressfwd'].filter(k => lists.flat().includes(k)), clubs: M.CLUBS.length }; });
info('the ' + ex.clubs + ' exhibition clubs\' men in the middle: ' + JSON.stringify(ex.at));
ok(!ex.n.insidefwd && !ex.n.onevone && !ex.n.pressfwd && !ex.inLists.length, 'no Inside forward, One-on-one keeper or Pressing forward in any exhibition club, nor in any spot\'s list');
ok((ex.at.AM.playmaker || 0) > 0 && (ex.at.DM.ballwinner || 0) > 0 && (ex.at.CM.completemid || 0) > 0 && (ex.n.paceywinger || 0) > 0,
  'their attacking midfielders include playmakers (' + (ex.at.AM.playmaker || 0) + '), their holding ones ball-winners (' + (ex.at.DM.ballwinner || 0) + '), their central ones complete midfielders (' + (ex.at.CM.completemid || 0) + '); pacey wingers among their men (' + (ex.n.paceywinger || 0) + ')');

// --- AN INSIDE FORWARD KEPT FROM BEFORE: the winger his stats fit best, as he was ---------------------------------------------
// (one made as v142 made them: a winger's averages and the Inside forward's offsets, a little either way)
const rl = await page.evaluate(() => { const M = window.__M, was = { speed:1, acceleration:1, dribbling:0.5, shotAcc:1, offIQ:1, composure:0.5, strength:-1.5, crossing:-1, curve:-0.5, heading:-0.5 };
  const R = M.cwMul(77), tally = {};
  for(let i = 0; i < 300; i++){ const s = {}; for(const k in M.ARCH.ATT) s[k] = Math.max(1, Math.min(10, Math.round((M.ARCH.ATT[k] + (was[k] || 0) + (R() * 2 - 1) * 0.9) * 2) / 2));
    const t = M.typeKept('insidefwd', 'ATT', s); tally[t] = (tally[t] || 0) + 1; }
  const wasK = { keeperSpd:1, gkDiveRange:1, composure:0.5, gkReach:-0.5, gkHandling:-0.5, gkReflex:-0.5 }, ktally = {};
  for(let i = 0; i < 300; i++){ const s = {}; for(const k in M.ARCH.GK) s[k] = Math.max(1, Math.min(10, Math.round((M.ARCH.GK[k] + (wasK[k] || 0) + (R() * 2 - 1) * 0.9) * 2) / 2));
    const t = M.typeKept('onevone', 'GK', s); ktally[t] = (ktally[t] || 0) + 1; }
  // ...a side kept on the exhibition screen with one in it
  const c = M.CLUBS[3], side = M.clubSide(c.id), i = side.squad.findIndex(e => e && e.role === 'ATT');
  const e = side.squad[i]; e.style = 'insidefwd'; const stats0 = JSON.stringify(e.stats);
  const all = JSON.parse(localStorage.getItem('ft_clubsq') || '{}') || {}; all[c.id] = side; localStorage.setItem('ft_clubsq', JSON.stringify(all));
  const back = M.clubSide(c.id).squad[i]; localStorage.removeItem('ft_clubsq');
  return { tally, ktally, kept: { style: back.style, same: JSON.stringify(back.stats) === stats0 } }; });
info('300 Inside forwards made as v142 made them, re-labelled: ' + JSON.stringify(rl.tally) + '; 300 One-on-one keepers made as v143 made them: ' + JSON.stringify(rl.ktally) + '; one in a kept side: ' + JSON.stringify(rl.kept));
const WT = ['winger', 'trickster', 'paceywinger', 'invwinger'], tl = rl.tally, nW = WT.reduce((a, k) => a + (tl[k] || 0), 0), kt = rl.ktally, nK = ['allround', 'shotstopper', 'sweeperkeeper'].reduce((a, k) => a + (kt[k] || 0), 0);
ok(nW === 300, 'an Inside forward from before is the winger his stats fit best (' + JSON.stringify(tl) + ')');
ok(nK === 300 && (kt.sweeperkeeper || 0) > 150, 'a One-on-one keeper from before is the keeper his keeping fits best -- most of them Sweeper keepers, quick off their line as he was (' + JSON.stringify(kt) + ')');
ok(WT.includes(rl.kept.style) && rl.kept.same, 'one in an exhibition side kept from before: re-labelled (' + rl.kept.style + '), his stats as they were');

// --- A CAREER KEPT FROM BEFORE: its Inside forwards re-labelled, its playmakers attacking midfielders -------------------------
await page.click('#smItems [data-act="new"]'); await page.waitForTimeout(150); await page.click('#newSlotList .slotBtn >> nth=0'); await page.waitForTimeout(100);
if(await page.isVisible('#confirmModal.on')) await page.click('#confirmModal [data-cf="yes"]');
await page.waitForSelector('#mgrMaker.on', { timeout: 4000 }); await page.fill('#mgName', 'Sam Okafor'); await page.fill('#mgClubIn', 'Fenmoor Athletic');
await page.click('#mgGo'); await page.waitForSelector('#careerHub.show', { timeout: 8000 });
const cr = await page.evaluate(() => { const M = window.__M, d = JSON.parse(JSON.stringify(M.d)), W = d.world; M.mgMigrate(d);   // (as it's kept now, first)
  const all = [...d.roster, ...(W.free || []), ...(d.youth || []), ...Object.values(W.clubs).flatMap(c => c.players || [])];
  const wing = all.filter(p => p.role === 'ATT' && p.subRole === 'WNG').slice(0, 12), mids = all.filter(p => p.role === 'MID' && p.style === 'playmaker');
  const bw = all.filter(p => p.role === 'MID' && p.style === 'ballwinner'), cm = all.filter(p => p.role === 'MID' && p.style === 'covermid'), gks = all.filter(p => p.role === 'GK').slice(0, 6);
  const before = wing.concat(gks).map(p => ({ at: p.at, ovr: p.ovr }));
  for(const p of wing) p.style = 'insidefwd';                      // (a career saved with Inside forwards in it)
  for(const p of gks) p.style = 'onevone';                         // (...and One-on-one keepers)
  for(const p of mids) p.subRole = 'CM';                           // (...its playmakers central midfielders, as they were before v143)
  for(const p of bw) p.subRole = 'CM'; for(const p of cm) p.subRole = 'DM';   // (...its ball-winners CMs and its cover midfielders DMs, as in v143)
  M.mgMigrate(d);
  return { wing: wing.map(p => p.style), gks: gks.map(p => p.style), same: wing.concat(gks).every((p, i) => p.at === before[i].at && p.ovr === before[i].ovr), mids: mids.length, midsAM: mids.filter(p => p.subRole === 'AM').length,
    bw: bw.length, bwDM: bw.filter(p => p.subRole === 'DM').length, cm: cm.length, cmCM: cm.filter(p => p.subRole === 'CM').length,
    leftover: all.filter(p => p.style === 'insidefwd' || p.style === 'onevone').length }; });
info('a career kept from before: its Inside forwards now ' + cr.wing.join(' ') + '; its One-on-one keepers ' + cr.gks.join(' ') + '; ' + cr.midsAM + ' of its ' + cr.mids + ' playmakers AMs, ' + cr.bwDM + ' of ' + cr.bw + ' ball-winners DMs, ' + cr.cmCM + ' of ' + cr.cm + ' cover midfielders CMs');
ok(cr.wing.length === 12 && cr.wing.every(s => WT.includes(s)) && cr.gks.every(s => ['allround', 'shotstopper', 'sweeperkeeper'].includes(s)) && cr.same && !cr.leftover,
  'a career kept from before: every Inside forward the winger his stats fit best, every One-on-one keeper the keeper his keeping fits best -- yours, the clubs\', free, youth -- their attributes and ratings as they were');
ok(cr.mids > 0 && cr.midsAM === cr.mids && cr.bwDM === cr.bw && cr.cmCM === cr.cm, 'and its playmakers attacking midfielders, its ball-winners holding ones, its cover midfielders central ones (' + cr.midsAM + '/' + cr.mids + ', ' + cr.bwDM + '/' + cr.bw + ', ' + cr.cmCM + '/' + cr.cm + ')');

process.exitCode = rep.finish();
await browser.close();
