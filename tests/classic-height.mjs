// FOOTBALL CLASSIC, HEIGHT (v184): every man is short, medium or tall -- seeded like his look, from his name (a career
// man's from himself), and weighted by his line: keepers and defenders the tallest, midfielders the shortest. A tall man's
// sprite has two rows more and a short man's two fewer, at the knee and in his boots, so his head, shirt and feet are as
// drawn and his feet stay on his spot; a slide and a keeper's dive or spread are left as drawn. The old 0.95-1.06 scale on
// each look is gone. At a throw-in he holds the ball in front of his face wherever his face is. His card says his height.
// For now that's all it is: no header, reach or turn goes by it. On a copy of the game that lets the test reach inside.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={players:()=>players, keepers:()=>keepers, heightFrom, HEIGHT_PX, HEIGHT_W, HEIGHT_NAME, throwZ:p=>throwZ(p), get THROW_Z(){ return THROW_Z; }, '
  + 'mtCard:(t,si,ph)=>mtCard(t,si,ph), mtWho:(t,si)=>mtWho(t,si), heightWord:w=>heightWord(w), squad:t=>SQUAD[t], gkRow:()=>KEEPER_SHEET_PAL.rows.dive, PLAYER_H};\n  const LAB_TITLE=');
patch('keeperShowsBall, lookOf, shadow,', 'keeperShowsBall, lookOf, shadow, gkSheet,');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-height-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
await page.addInitScript(() => { try{ localStorage.setItem('ft_exh', JSON.stringify({ you: 'ARS', opp: 'LIV' })); }catch(e){} });
await page.goto('file://' + copy); await page.waitForTimeout(400);
await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show'); await page.click('#exhGo'); await page.waitForTimeout(2000);

// --- WHO'S WHICH: seeded, weighted by his line -------------------------------------------------------------------------
let r = await page.evaluate(() => { const T = window.__T, out = { share: {} };
  for(const role of ['GK', 'DEF', 'MID', 'FWD']){ const n = [0, 0, 0]; for(let i = 0; i < 6000; i++) n[T.heightFrom('id|test' + i, role) + 1]++; out.share[role] = n.map(v => +(v / 60).toFixed(1)); }
  out.same = [0, 1, 2, 3, 4].every(i => T.heightFrom('id|m' + i, 'DEF') === T.heightFrom('id|m' + i, 'DEF'));
  out.W = T.HEIGHT_W; out.px = T.HEIGHT_PX;
  return out; });
info('short / medium / tall, % of 6000 men a line: ' + JSON.stringify(r.share));
ok(r.px === 2, 'a height step is 2 px on the 32 px sprite');
ok(r.same, 'the same man is the same height every time');
ok(['GK', 'DEF', 'MID', 'FWD'].every(k => r.share[k].every((v, i) => Math.abs(v - r.W[k][i]) < 2.5)), 'each line\'s heights come out as weighted (within 2.5 points of ' + JSON.stringify(r.W) + ')');
ok(r.share.GK[2] > r.share.DEF[2] && r.share.DEF[2] > r.share.FWD[2] && r.share.FWD[2] > r.share.MID[2] && r.share.MID[0] > r.share.DEF[0],
  'keepers are tallest, then defenders, then forwards; midfielders the shortest');

// --- ON THE PITCH: each man his own height, his look's scale gone -------------------------------------------------------
r = await page.evaluate(() => { const T = window.__T, S = window.SPRITE, out = { men: [] };
  for(const p of [...T.players(), ...T.keepers()]){ const L = S.lookOf(p), role = p.side != null ? 'GK' : p.natRole;
    out.men.push({ ht: L.ht, key: L.key.endsWith('|h' + L.ht), own: L.ht === T.heightFrom(p._lookSeed, role), size: L.size }); }
  return out; });
info('heights on the pitch: ' + r.men.map(m => m.ht).join(' '));
ok(r.men.length === 18 && r.men.every(m => [-1, 0, 1].includes(m.ht) && m.key && m.own), 'all 18 men have a height of their own, by their line, in their sheet\'s key');
ok(new Set(r.men.map(m => m.ht)).size >= 2, 'not all one height (' + [...new Set(r.men.map(m => m.ht))].join(', ') + ')');
ok(r.men.every(m => m.size === undefined), 'no look carries the old 0.95-1.06 scale any more');

// --- THE SHEETS: two rows more or fewer, the feet where they were -------------------------------------------------------
r = await page.evaluate(() => { const T = window.__T, S = window.SPRITE, CELL = 32, H = S.heightRows(), out = { bad: [], cells: 0, slideSame: true, gkBad: [], gkCells: 0, diveSame: true, nulls: 0, gkNulls: 0 };
  const data = c => { if(!c.getContext){ const x = document.createElement('canvas'); x.width = c.width; x.height = c.height; x.getContext('2d').drawImage(c, 0, 0); c = x; } return c.getContext('2d').getImageData(0, 0, c.width, c.height).data; };
  const span = (d, W, r, f) => { let top = -1, bot = -1; for(let y = 0; y < CELL; y++) for(let x = 0; x < CELL; x++) if(d[((r * CELL + y) * W + f * CELL + x) * 4 + 3]){ if(top < 0) top = y; bot = y; break; } return [top, bot]; };
  const same = (a, b, W, r, f) => { for(let y = 0; y < CELL; y++) for(let x = 0; x < CELL; x++){ const i = ((r * CELL + y) * W + f * CELL + x) * 4; for(let k = 0; k < 4; k++) if(a[i + k] !== b[i + k]) return false; } return true; };
  const check = (d0, W, rows, ht, dh, bad, skipFrom, tag) => { let n = 0; rows.forEach((row, r) => row.forEach((c, f) => {
      const [t0, b0] = span(d0[0], W, r, f); if(t0 < 0) return;
      if(r >= skipFrom){ if(!same(d0[0], dh, W, r, f)) bad.push(tag + ' ' + r + ',' + f + ' changed'); return; }
      if(!c){ bad.push(tag + ' ' + r + ',' + f + ' no rows'); return; }
      const [t1, b1] = span(dh, W, r, f); n++;
      if(t1 !== t0 - 2 * ht || b1 !== b0) bad.push(tag + ' ' + r + ',' + f + ' ' + [t0, b0] + '->' + [t1, b1]); })); return n; };
  for(const st of ['mop', 'crop', 'bald', 'afro', 'long', 'mohawk', 'bun']) for(const ht of [-1, 1]){
    const d0 = data(S.lookSrc(st, ['band'], 0)), W = S.lookSrc(st, [], 0).width;
    out.cells += check([d0], W, H.body, ht, data(S.lookSrc(st, ['band'], ht)), out.bad, 32, st); }
  // the keepers: his own sheet at each height against his medium one (the dive and the spread as drawn)
  const kp = T.keepers()[0], L = S.lookOf(kp), was = [L.ht, L.key], sheet = ht => { L.ht = ht; L.key = was[1].replace(/\|h-?\d$/, '|h' + ht); return S.gkSheet(kp); };
  const g0 = data(sheet(0)), GW = S.cfg.gk.img.width;
  for(const ht of [-1, 1]) out.gkCells += check([g0], GW, H.gk, ht, data(sheet(ht)), out.gkBad, T.gkRow(), 'gk');
  L.ht = was[0]; L.key = was[1];
  return out; });
info('outfield cells checked ' + r.cells + ', keeper cells ' + r.gkCells + (r.bad.length ? '; ' + r.bad.slice(0, 6).join('; ') : '') + (r.gkBad.length ? '; ' + r.gkBad.slice(0, 6).join('; ') : ''));
ok(r.cells >= 7 * 2 * 60 && !r.bad.length, 'every hairstyle, short and tall: in every drawn cell his head is 2 px lower or higher and his feet on the same row; the slide is as drawn');
ok(r.gkCells >= 2 * 70 && !r.gkBad.length, 'the keepers the same, short and tall; the dive and the spread as drawn');

// --- THE THROW-IN: the ball in front of his face, wherever his face is --------------------------------------------------
r = await page.evaluate(() => { const T = window.__T, S = window.SPRITE, p = T.players()[0], L = S.lookOf(p), was = L.ht, z = {};
  for(const ht of [-1, 0, 1]){ L.ht = ht; z[ht] = +T.throwZ(p).toFixed(2); } L.ht = was; return { z, base: T.THROW_Z, sc: S.cfg.scale, PH: T.PLAYER_H }; });
info('throw-in heights: ' + JSON.stringify(r.z));
ok(r.z[0] === r.base && Math.abs(r.z[1] - r.base - 2 * r.sc) < 0.01 && Math.abs(r.z[-1] - r.base + 2 * r.sc) < 0.01,
  'a medium man holds it where it always was (' + r.base + '), a tall man 2 sprite px higher, a short man 2 lower');

// --- HIS CARD: his height under his name; a career man's the same as on the pitch ---------------------------------------
r = await page.evaluate(() => { const T = window.__T, S = window.SPRITE, out = { cards: [] };
  for(let si = 0; si < 9; si++){ const who = T.mtWho('G', si), h = T.mtCard('G', si, 'atk'); out.cards.push({ word: T.HEIGHT_NAME[S.lookOf(who).ht], has: h.includes(' · ' + T.HEIGHT_NAME[S.lookOf(who).ht]) }); }
  out.career = ['DEF', 'MID', 'GK'].map((role, i) => { const id = 'p' + (100 + i), a = S.lookOf({ lookKey: id, natRole: role }).ht;
    return a === T.heightFrom('id|' + id, role) && a === S.lookOf({ lookKey: id, natRole: role, team: 'G' }).ht; });
  return out; });
info('cards: ' + r.cards.map(c => c.word).join(' '));
ok(r.cards.every(c => c.has), 'every man\'s card in the match says how tall he is');
ok(r.career.every(Boolean), 'a career man is the height on his card that he is on the pitch (seeded from himself and his line)');

process.exitCode = rep.finish();
await browser.close();
