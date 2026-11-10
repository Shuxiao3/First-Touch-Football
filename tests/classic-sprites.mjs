// FOOTBALL CLASSIC, SPRITES: the players are put together from parts drawn in the style of the reference overworld
// sprites. Each man now has an eye colour of his own beside his skin, hair and boots, swapped into his sheet like the
// rest of his look, and every sprite stands on a flat oval of whole pixels instead of the soft shadow (which is back
// when the sprites are switched off). THE REDRAWN MEN (v187): every part drawn again by hand -- seven hairstyles (spikes and
// a side parting where the long hair and the bun were, at their odds), each head 21 by 19, its sides running straight down
// past his ears (they stuck out a pixel just under the hair, like horns), and the keepers in their own hair. v188, every
// body frame drawn by hand: standing, running, shooting or passing, his arms never come up past his shoulders (the posed
// run had a hand swinging up by his head). On a copy of the game that lets the test reach the players.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={players:()=>players, keepers:()=>keepers, parts:()=>PLAYER_PARTS};\n  const LAB_TITLE=');
patch('lookOf, shadow,', 'lookOf, shadow, EYE_COLS,');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-spr-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show'); await page.click('#exhGo'); await page.waitForTimeout(1500);

const r = await page.evaluate(() => {
  const T = window.__T, S = window.SPRITE, P = T.parts();
  const hex = c => '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
  const colours = cv => { const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data, set = new Set();
    for(let i = 0; i < d.length; i += 4) if(d[i + 3]) set.add(hex([d[i], d[i + 1], d[i + 2]])); return set; };
  const drawnIris = (P.drawn.iris || [])[0];
  const men = T.players(), gks = T.keepers();
  const out = { ready: S.ready && S.keeperReady, drawnIris, eyeNames: Object.keys(S.EYE_COLS), men: [], gkSheets: [] };
  for(const p of men){
    const L = S.lookOf(p), key = Object.keys(S.cfg.looks).find(k => k.startsWith(p.team + '|' + L.key));
    const set = key ? colours(S.cfg.looks[key]) : new Set();
    out.men.push({ eyes: L.eyes, sheet: !!key, own: set.has(S.EYE_COLS[L.eyes]), drawn: set.has(drawnIris) });
  }
  for(const k in S.cfg.gk.looks) out.gkSheets.push(colours(S.cfg.gk.looks[k]).has(drawnIris));
  out.shadowOn = S.shadow(100, 100);
  S.disable(); out.shadowOff = S.shadow(100, 100); S.enable();
  return out;
});
info('eye colours on the pitch: ' + r.men.map(m => m.eyes).join(' '));
ok(r.ready, 'the players and the keepers are drawn from their sheets');
ok(/^#[0-9a-f]{6}$/.test(r.drawnIris || ''), 'the parts carry an iris to swap (' + r.drawnIris + ')');
ok(r.men.length >= 14 && r.men.every(m => r.eyeNames.includes(m.eyes)), 'every man has an eye colour (' + r.men.length + ' men)');
ok(new Set(r.men.map(m => m.eyes)).size >= 2, 'not all the same: ' + new Set(r.men.map(m => m.eyes)).size + ' colours between them');
ok(r.men.every(m => m.sheet && m.own && !m.drawn), 'each man\'s sheet has his own eye colour, and none has the drawn one left');
ok(r.gkSheets.length >= 2 && r.gkSheets.every(d => !d), 'the keepers\' eyes are swapped too (' + r.gkSheets.length + ' sheets)');
ok(r.shadowOn === true && r.shadowOff === false, 'the pixel shadow is drawn with the sprites on, and the plain one with them off');

// --- THE REDRAWN MEN (v187) ----------------------------------------------------------------------------------------------
const v = await page.evaluate(() => {
  const S = window.SPRITE, P = window.__T.parts(), A = P.atlas, out = { styles: P.styles, cell: [A.w, A.h, P.baseW], horns: [], seen: {} };
  const px = im => { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0); return { d: x.getImageData(0, 0, c.width, c.height).data, w: c.width, h: c.height }; };
  // a head's sides: no run of a row or two standing out past the rows over and under it (the horns had both sides out at
  // the two rows under the hair, cols 2 and 18 where the rows round them were at 3 and 17)
  const H = px(S.cfg.heads);
  P.styles.forEach((st, si) => P.views.forEach((vw, vi) => { const L = [], R = [];
    for(let y = 0; y < A.h; y++){ let l = -1, r = -1; for(let x = 0; x < A.w; x++) if(H.d[((si * A.h + y) * H.w + vi * A.w + x) * 4 + 3]){ if(l < 0) l = x; r = x; } L.push(l); R.push(r); }
    for(const [E, out_] of [[L, (a, b) => a < b], [R, (a, b) => a > b]]) for(let a = 1; a < A.h - 1; a++) for(const n of [1, 2]){ const b = a + n - 1; if(b >= A.h - 1) continue;
      const run = E.slice(a, b + 1); if(E[a] < 0 || run.some(e => e !== E[a]) || E[a - 1] < 0 || E[b + 1] < 0) continue;
      if(R[a] - L[a] < 10) continue;                       // (the head itself, at least 11 wide: not the tip of a crest or a spike)
      if(out_(E[a], E[a - 1]) && out_(E[a], E[b + 1])) out.horns.push(st + '/' + vw + ' rows ' + a + (n > 1 ? '-' + b : '')); } }));
  // the hairstyles a look is dealt: all of them drawn, the long hair and the bun no more
  for(let i = 0; i < 600; i++){ const L = S.lookOf({ lookKey: 'v187-' + i, natRole: 'MID' }); out.seen[L.style] = (out.seen[L.style] || 0) + 1; }
  // the keepers: a head in every cell of their sheet
  const G = px(S.cfg.gk.img), K = px(S.gkSrc('crop', [])); let cells = 0, headed = 0;
  for(let r = 0; r < G.h / 32; r++) for(let f = 0; f < G.w / 32; f++){ let a = 0, b = 0;
    for(let y = 0; y < 32; y++) for(let x = 0; x < 32; x++){ const i = (((r * 32 + y) * G.w) + f * 32 + x) * 4 + 3; if(G.d[i]) a++; if(K.d[i]) b++; }
    if(a){ cells++; if(b > a + 40) headed++; } }
  out.gk = { cells, headed };
  // v188: the bodies (no heads on them) -- standing, running, shooting and passing -- nothing above his shoulders, row 20
  const B = px(S.cfg.body); out.high = [];
  for(let r = 0; r < 32; r++) for(let f = 0; f < 4; f++){ let top = -1;
    for(let y = 0; y < 32 && top < 0; y++) for(let x = 0; x < 32; x++) if(B.d[(((r * 32 + y) * B.w) + f * 32 + x) * 4 + 3]){ top = y; break; }
    if(top >= 0 && top < 20) out.high.push(r + ',' + f + ' row ' + top); }
  return out; });
info('hairstyles dealt to 600 men: ' + JSON.stringify(v.seen));
ok(v.styles.join() === 'mop,crop,bald,afro,spiky,mohawk,side' && v.cell.join() === '21,19,21', 'seven hairstyles drawn, each head 21 by 19 (' + v.styles.join(', ') + ')');
ok(!v.horns.length, 'every head\'s sides run straight down past his ears, no row or two standing out like horns (' + (v.horns.join('; ') || 'none') + ')');
ok(Object.keys(v.seen).every(k => v.styles.includes(k)) && v.seen.spiky > 0 && v.seen.side > 0 && !v.seen.long && !v.seen.bun, 'every man gets a hairstyle that\'s drawn: spikes and side partings now, no long hair or buns');
ok(v.gk.cells >= 70 && v.gk.headed === v.gk.cells, 'the keepers wear their own hair: a head on every one of the ' + v.gk.cells + ' cells of their sheet');
ok(!v.high.length, 'standing, running, shooting or passing, nothing of him comes up past his shoulders -- no arm swinging up by his head (' + (v.high.join('; ') || 'none') + ')');

process.exitCode = rep.finish();
await browser.close();
