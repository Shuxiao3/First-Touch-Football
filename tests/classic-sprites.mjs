// FOOTBALL CLASSIC, SPRITES: the players are put together from parts drawn in the style of the reference overworld
// sprites. Each man now has an eye colour of his own beside his skin, hair and boots, swapped into his sheet like the
// rest of his look, and every sprite stands on a flat oval of whole pixels instead of the soft shadow (which is back
// when the sprites are switched off). On a copy of the game that lets the test reach the players.
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

process.exitCode = rep.finish();
await browser.close();
