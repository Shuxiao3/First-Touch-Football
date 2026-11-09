// FOOTBALL CLASSIC, PACE THE DEAREST OF ALL (v144): speed weighs the most in every outfielder's rating (6, above every
// other) and acceleration 5 -- they were 4 and 2 for a defender, 2 and 1 for a midfielder, 4 and 4 for a forward. A man
// is made to a rating with his pace left as it comes and the rest of his game moved to make it, so a quick man pays for
// it in the rest of his game, and a quick one who's good at the rest as well rates among the best. A usual man of each
// line rates as he did. A man's development still reckons what matters to him on the weights from before (or most of
// every man's growth would go to his pace), and a career kept from before is rated again once.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  // ===== END MANAGER CAREER', '  window.__M={ARCH, STYLES, OVR_W, OVR_W_DEV, OVR_W_V121, OUT_KEYS, cwOverall, cwStatsForOVR, cwMul, styleForSub, devRel, devUnpack, devPack, ovrMainBut, clamp, mgMigrate, mgStats, '
  + 'get d(){ return CAREER&&CAREER.data; }};\n  // ===== END MANAGER CAREER');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-pace-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;

// --- THE WEIGHTS, AND WHAT PACE IS WORTH ------------------------------------------------------------------------------------
const w = await page.evaluate(() => { const M = window.__M, out = {};
  for(const l of ['DEF', 'MID', 'ATT']){ const W = M.OVR_W[l], top = Math.max(...M.OUT_KEYS.filter(k => k !== 'speed').map(k => W[k] || 0));
    const u = Object.assign({}, M.ARCH[l]), q = Object.assign({}, u, { speed: u.speed + 3, acceleration: u.acceleration + 3 });
    out[l] = { speed: W.speed, accel: W.acceleration, top, usual: M.cwOverall(l, u), plus3: M.cwOverall(l, q) - M.cwOverall(l, u) }; }
  out.gk = M.OVR_W.GK.keeperSpd; return out; });
info('the weights and +3 pace (speed and acceleration) on a usual man: ' + JSON.stringify(w));
ok(['DEF', 'MID', 'ATT'].every(l => w[l].speed === 6 && w[l].top <= 5 && w[l].accel === 5) && w.gk === 2,
  'speed the heaviest of every outfielder\'s weights (6, the rest 5 at most), acceleration 5 with the heaviest; a keeper\'s as it was');
ok(['DEF', 'MID', 'ATT'].every(l => w[l].plus3 >= 5) && w.DEF.usual === 69 && w.MID.usual === 67 && w.ATT.usual === 72,
  'three points more pace on a usual man is worth ' + w.DEF.plus3 + ', ' + w.MID.plus3 + ' and ' + w.ATT.plus3 + ' points of rating to a defender, a midfielder and a forward (v143: 4, 2 and 5) -- and the usual man rates as he did (' + [w.DEF.usual, w.MID.usual, w.ATT.usual].join(', ') + ')');

// --- THE PRICE: at the same rating, the quick man has less of the rest ----------------------------------------------------------
// (600 men of each line made at 70, each a type as a career draws them; the rest of his game his line's weighted stats other
// than pace, on the weights from before so the yardstick doesn't move)
const pr = await page.evaluate(() => { const M = window.__M, out = {}, R = M.cwMul(4242), subs = { DEF: ['CB', 'FB'], MID: ['DM', 'CM', 'AM', 'WM'], ATT: ['WNG', 'STK'] };
  for(const l of ['DEF', 'MID', 'ATT']){ const W = Object.assign({}, M.OVR_W_DEV[l]); delete W.speed; delete W.acceleration; for(const k in W) if(W[k] < 2) delete W[k];
    const men = [];
    for(let i = 0; i < 600; i++){ const style = M.styleForSub(subs[l][i % subs[l].length], R()), s = M.cwStatsForOVR(l, 70, M.cwMul(9000 + i), style);   // (v182: his style's make in one -- cwStyleStats gone)
      let a = 0, t = 0; for(const k in W){ a += s[k] * W[k]; t += W[k]; } men.push({ pace: (s.speed + s.acceleration) / 2, rest: a / t, ovr: M.cwOverall(l, s) }); }
    men.sort((x, y) => y.pace - x.pace); const q = men.length >> 2, avg = (a, f) => a.reduce((x, y) => x + f(y), 0) / a.length, fast = men.slice(0, q), slow = men.slice(-q);
    out[l] = { fastPace: +avg(fast, m => m.pace).toFixed(2), slowPace: +avg(slow, m => m.pace).toFixed(2), gap: +(avg(slow, m => m.rest) - avg(fast, m => m.rest)).toFixed(2), ovr: +avg(men, m => m.ovr).toFixed(1) }; }
  return out; });
info('men made at 70, the quickest quarter against the slowest: ' + JSON.stringify(pr));
ok(['DEF', 'MID', 'ATT'].every(l => pr[l].gap >= 0.3 && Math.abs(pr[l].ovr - 70) <= 1),   // (v183: how much is the master sheet's numbers' -- 1.4, 0.36 and 0.55 with them; 0.4 at least till v182)
  'the quickest quarter of men made at 70 have that much less of the rest of their game than the slowest: ' + pr.DEF.gap + ' of a point for a defender, ' + pr.MID.gap + ' for a midfielder, ' + pr.ATT.gap + ' for a forward (v143: 0.70, 0.00 and 0.38; the master sheet\'s numbers since v182) -- all of them rated 70');

// --- DEVELOPMENT, AND A CAREER KEPT FROM BEFORE ----------------------------------------------------------------------------------
await page.click('#smItems [data-act="new"]'); await page.waitForTimeout(150); await page.click('#newSlotList .slotBtn >> nth=0'); await page.waitForTimeout(100);
if(await page.isVisible('#confirmModal.on')) await page.click('#confirmModal [data-cf="yes"]');
await page.waitForSelector('#mgrMaker.on', { timeout: 4000 }); await page.fill('#mgName', 'Sam Okafor'); await page.fill('#mgClubIn', 'Fenmoor Athletic');
await page.click('#mgGo'); await page.waitForSelector('#careerHub.show', { timeout: 8000 });
const cr = await page.evaluate(() => { const M = window.__M, d = JSON.parse(JSON.stringify(M.d)), W = d.world, all = [...d.roster, ...(W.free || []), ...Object.values(W.clubs).flatMap(c => c.players || [])].filter(p => p && p.at);
  // what his development reckons matters to him: pace no more than before -- a centre-back whose style isn't quicker than
  // his line's (v182: the master sheet's Stopper and Cover CB are, and grow their pace with their tackling)
  const slowish = p => !((M.STYLES[p.style].d.speed || 0) > 0) && !((M.STYLES[p.style].d.acceleration || 0) > 0);
  const mid = all.find(p => p.role === 'MID' && p.style === 'playmaker'), cb = all.find(p => p.role === 'DEF' && p.subRole === 'CB' && slowish(p)), rm = M.devRel(mid), rc = M.devRel(cb);
  // (v182) a career kept from before: its men made the old way -- each style's offsets as they were (d181), the rest of
  // his game (never his pace) moved to his rating -- not from the master sheet's numbers, which no save from then has
  const oldMake = p => { const role = p.role, T = p.ovr, s = M.cwStatsForOVR(role, T, M.cwMul((p.seed >>> 0) || 1)), d = (M.STYLES[p.style] && M.STYLES[p.style].d181) || {}, w = M.OVR_W[role], main = M.ovrMainBut(role);
    for(const k in d) s[k] = M.clamp(Math.round((s[k] + d[k]) * 2) / 2, 1, 10);
    for(let it = 0; it < 12; it++){ const cur = M.cwOverall(role, s); if(Math.abs(cur - T) <= 1) break; const step = cur < T ? 0.5 : -0.5; for(const k of main) s[k] = M.clamp(s[k] + step, 1, 10); }
    const ks = M.ovrMainBut(role).sort((a, b) => w[a] - w[b]); for(let it = 0; it < 60; it++){ const cur = M.cwOverall(role, s); if(cur === T) break; const k = ks[it % ks.length]; s[k] = M.clamp(s[k] + (cur < T ? 0.5 : -0.5), 1, 10); }
    return s; };
  for(const p of all) if(p.style) p.at = M.devPack(oldMake(p));

  // a career rated before v144: every man rated on v143's weights, then read
  const W143 = { GK: M.OVR_W.GK }; for(const l of ['DEF', 'MID', 'ATT']) W143[l] = M.OVR_W_DEV[l];
  const mean0 = (st, w) => { let s = 0, t = 0; for(const k in w){ s += (st[k] || 5.5) * w[k]; t += w[k]; } return s / t; };
  const r143 = (role, st) => { const w = W143[role], tot = Object.values(w).reduce((a, v) => a + v, 0), ones = Object.values(w).filter(v => v === 1).length, K = 1 / (1 - 0.45 * ones / tot);
    return Math.max(30, Math.min(95, Math.round((mean0(M.ARCH[role], M.OVR_W_V121[role]) + (mean0(st, w) - mean0(M.ARCH[role], w)) * K) * 10))); };   // (his rating as v143 had it)
  for(const p of all) p.ovr = r143(p.role, M.devUnpack(p.at));
  const before = new Map(all.map(p => [p, p.ovr])); delete d.w144; M.mgMigrate(d);
  const by = {}; for(const p of all){ (by[p.style] = by[p.style] || []).push(p.ovr - before.get(p)); }
  const mean = a => a.length ? +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : null, dAll = all.map(p => p.ovr - before.get(p));
  return { cbStyle: cb.style, relMid: [rm.speed, rm.passAcc], relCb: [rc.speed, rc.tackle], flag: d.w144, rated: all.every(p => p.ovr === Math.max(30, Math.min(95, M.cwOverall(p.role, M.mgStats(p))))),
    mean: mean(dAll), by: Object.fromEntries(['mwinger', 'speedster', 'wingback', 'fullback', 'stopper', 'anchor', 'target', 'deepcreator'].map(k => [k, mean(by[k] || [])])) }; });
info('development and a career kept from before: ' + JSON.stringify(cr));
ok(cr.relMid[0] < cr.relMid[1] && cr.relCb[0] < cr.relCb[1], 'his development reckons what matters to him as it did: a playmaker\'s passing before his pace (' + cr.relMid.join(' / ') + '), a centre-back\'s tackling before his (' + cr.relCb.join(' / ') + ', a ' + cr.cbStyle + ': one whose style isn\'t quicker than his line\'s)');
ok(cr.flag && cr.rated, 'a career kept from before: every man rated again on the new weights, once, his potential too');
ok(Math.abs(cr.mean) <= 0.5 && cr.by.mwinger > 0 && cr.by.speedster > 0 && cr.by.stopper < 0 && cr.by.anchor < 0 && cr.by.target < 0,
  '...the quick ones up and the slow ones down, about the same on average (' + (cr.mean >= 0 ? '+' : '') + cr.mean + '): ' + Object.entries(cr.by).map(([k, v]) => k + ' ' + (v >= 0 ? '+' : '') + v).join(', '));

process.exitCode = rep.finish();
await browser.close();
