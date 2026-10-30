// FOOTBALL CLASSIC, AN EXHIBITION'S SIDES: every club plays its own way by default (its style, as well as its shape) --
// Liverpool GEGENPRESS, Manchester City CONTROL POSSESSION, Brentford DIRECT, ... -- shown on the setup screen under its
// shape, and each side plays its own in the match. TACTICS on the setup screen sets the match up and waits: its tactics
// screen before kick-off (◀ CLUBS back to the setup, KICK OFF ▶ to play), where a man off the bench for one in the team
// is a change of team, not a sub; your shape and style there are kept with your club, and the match kicks off with
// everyone in his spot in the shape you picked. A style back at the club's own isn't kept as a change.
// On a copy of the game that lets the test reach the match.
import { open } from './_harness.mjs';
import { devices } from 'playwright';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__K={ ev:s=>eval(s) };\n  const LAB_TITLE=');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-exh-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
const K = s => page.evaluate(s => window.__K.ev(s), s);
await page.evaluate(() => { localStorage.removeItem('ft_clubsq'); window.__K.ev("EXH.you='LIV'; EXH.opp='MCI'"); });
const card = t => page.evaluate(t => { const el = document.getElementById('exhSide' + t); return { name: el.querySelector('.exhName').textContent, meta: el.querySelector('.exhMeta').textContent, style: el.querySelector('.exhStyle').textContent }; }, t);

// THE SETUP SCREEN: each club's way of playing under its shape
await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show');
const g0 = await card('G'), r0 = await card('R');
const all = await K(`CLUBS.map(c=>c.id+':'+c.style).join(' ')`), kinds = await K(`new Set(CLUBS.map(c=>c.style)).size`);
info('the clubs: ' + all);
ok(g0.name === 'Liverpool' && g0.style === 'GEGENPRESS' && r0.name === 'Manchester City' && r0.style === 'CONTROL POSSESSION', `on the setup screen, each club's way of playing under its shape: ${g0.name} ${g0.style}, ${r0.name} ${r0.style}`);
ok(kinds >= 6 && /BRE:direct/.test(all) && /CRY:dcounter/.test(all) && /AVL:fluid/.test(all), `the twenty clubs play ${kinds} different ways, not all BALANCED`);
await page.click('#exhSideR [data-exh="next"]'); await page.waitForTimeout(80); const r1 = await card('R');
await page.click('#exhSideR [data-exh="prev"]'); await page.waitForTimeout(80);
ok(r1.name === 'Manchester United' && r1.style === 'WING PLAY', `...the next club, its own: ${r1.name} ${r1.style}`);

// KICK OFF as it was: straight in, each side its club's way
await page.click('#exhGo'); await page.waitForTimeout(600);
const s0 = await K(`({ G:TAC.G.style, R:TAC.R.style, run:SCREEN==='match'&&!menuOpen })`);
ok(s0.run && s0.G === 'gegen' && s0.R === 'control', `KICK OFF: straight in, Liverpool gegenpressing, City keeping the ball (${s0.G}, ${s0.R})`);
await K('pauseFromMatch()'); await page.waitForTimeout(150);

// TACTICS: the match set up and waiting, its tactics screen before kick-off
await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show'); await page.click('#exhTac'); await page.waitForTimeout(400);
const t0 = await K('simNow'); await page.waitForTimeout(800);
const pre = await page.evaluate(() => { const ov = document.getElementById('mtacOv'), k = document.getElementById('mtKick').getBoundingClientRect();
  return { on: ov.classList.contains('on') && ov.classList.contains('pre'), back: ov.querySelector('.bpTopBack').textContent, head: document.getElementById('mtSubs').textContent, kick: k.width > 0 && k.right <= innerWidth,
    still: window.__K.ev('simNow'), screen: window.__K.ev('SCREEN'), dim: document.querySelectorAll('#mtacBody .tbBench .ptk.dim').length, bench: document.querySelectorAll('#mtacBody .tbBench .ptk').length }; });
ok(pre.on && pre.back === '◀ CLUBS' && pre.head === 'BEFORE KICK-OFF' && pre.kick && pre.still === t0 && pre.screen === 'match', 'TACTICS: the tactics screen before kick-off -- ◀ CLUBS, BEFORE KICK-OFF, KICK OFF ▶ -- and the match waiting for it');
ok(pre.bench === 5 && pre.dim === 0, 'the bench, all five to be had');
// style and shape
await page.click('#mtacBody [data-mtdrop="style"]'); await page.waitForTimeout(80); await page.click('#mtacBody [data-mtstyle="wing"]'); await page.waitForTimeout(80);
await page.click('#mtacBody [data-mtdrop="form"]'); await page.waitForTimeout(80); await page.click('#mtacBody [data-mtform="2-3-2"]'); await page.waitForTimeout(120);
const s1 = await K(`({ style:TAC.G.style, form:myForm })`);
ok(s1.style === 'wing' && s1.form === '2-3-2', `your style and shape picked before kick-off (${s1.style}, ${s1.form})`);
// a man off the bench for one in the team: a change of team, not a sub
const centre = sel => page.$eval(sel, e => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
async function drag(a, b){ const p = await centre(a), q = await centre(b); await page.mouse.move(p.x, p.y); await page.mouse.down();
  for(let i = 1; i <= 8; i++){ await page.mouse.move(p.x + (q.x - p.x) * i / 8, p.y + (q.y - p.y) * i / 8); await page.waitForTimeout(15); }
  await page.mouse.up(); await page.waitForTimeout(120); }
const inn = await page.$eval('#mtacBody .tbBench .ptk[data-mtk="bench"] >> nth=2', e => +e.dataset.si).catch(() => page.$$eval('#mtacBody .tbBench .ptk[data-mtk="bench"]', ns => +ns[2].dataset.si));
const out = await page.$$eval('#mtacBody .tpitch .ptk[data-mtk="field"]', ns => +ns[3].dataset.si);
await drag(`#mtacBody .tbBench .ptk[data-si="${inn}"]`, `#mtacBody .tpitch .ptk[data-si="${out}"]`);
const sw = await K(`({ inTeam:LINEUP.G.atk.includes(${inn}), outBench:mtBench('G').includes(${out}), used:SUBS.G.used, onPitch:players.some(p=>p.team==='G'&&p.squadIdx===${inn}), msg:document.getElementById('mtMsg').textContent })`);
ok(sw.inTeam && sw.onPitch && sw.outBench && sw.used === 0 && /no sub used/.test(sw.msg), `a man off the bench onto one in the team: in the team, the other on the bench, no sub used ("${sw.msg}")`);
// KICK OFF ▶: the match goes, everyone in his spot in the shape picked (kicked off, and read in the same moment: its
// button is tapped on the phone below)
const k0 = await K(`(()=>{ mtKickOff(); const G=players.filter(p=>p.team==='G'), off=G.filter(p=>ball.ownedBy!==p&&controlled!==p).map(p=>Math.hypot(p.x-p.homeX,p.y-p.homeY));
  const lines=[0,0,0]; for(const p of G){ const l=p.slotAtk&&p.slotAtk.role; lines[l==='DEF'?0:l==='MID'?1:2]++; }
  return { menu:menuOpen, ov:document.getElementById('mtacOv').classList.contains('on'), worst:Math.round(Math.max(...off)), t:simNow, lines:lines.join('-') }; })()`);
await page.waitForTimeout(700); const k1 = await K('({ t:simNow, style:TAC.G.style, R:TAC.R.style })');
ok(!k0.menu && !k0.ov && k1.t > k0.t && k1.style === 'wing' && k1.R === 'control', 'KICK OFF ▶: the match goes, in your style, City in theirs');
ok(k0.worst === 0 && k0.lines === '2-3-2', `...kicking off with everyone in his spot, the side in the shape you picked (${k0.lines} with the ball)`);
// kept with the club: the setup screen says so, the opponent's as it was
await K('pauseFromMatch()'); await page.waitForTimeout(150);
await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show');
const g2 = await card('G'), r2 = await card('R'), kept = await page.evaluate(() => { const o = JSON.parse(localStorage.getItem('ft_clubsq') || '{}'); return { liv: o.LIV && o.LIV.style, mci: o.MCI ? (o.MCI.style || null) : 'none', livIn: o.LIV && o.LIV.lineup.atk.length }; });
ok(g2.style === 'WING PLAY' && /2-3-2/.test(g2.meta) && kept.liv === 'wing' && r2.style === 'CONTROL POSSESSION' && kept.mci === null,
  `kept with your club: ${g2.name} ${g2.style} ${g2.meta.split(' · ')[2]}; City still ${r2.style} (nothing stored for it)`);
// ◀ CLUBS: back to the setup screen, no match
await page.click('#exhTac'); await page.waitForTimeout(300);
await page.click('#mtacOv .bpTopBack'); await page.waitForTimeout(200);
const back = await page.evaluate(() => ({ panel: document.getElementById('exhPanel').classList.contains('show'), screen: window.__K.ev('SCREEN'), ov: document.getElementById('mtacOv').classList.contains('on'), menu: window.__K.ev('menuOpen') }));
ok(back.panel && back.screen === 'menu' && !back.ov && !back.menu, '◀ CLUBS: back to the setup screen, no match');
// back to the club's own style: not kept as a change
await page.click('#exhTac'); await page.waitForTimeout(300);
await page.click('#mtacBody [data-mtdrop="style"]'); await page.waitForTimeout(80); await page.click('#mtacBody [data-mtstyle="gegen"]'); await page.waitForTimeout(80);
const own = await page.evaluate(() => { const o = JSON.parse(localStorage.getItem('ft_clubsq') || '{}'); return { has: 'style' in (o.LIV || {}), style: window.__K.ev('TAC.G.style') }; });
ok(own.style === 'gegen' && !own.has, 'set back to the club\'s own way, nothing\'s kept as a change: it\'s the club\'s again');
await browser.close();

// ON A PHONE: TACTICS, the screen and its KICK OFF on it, a tap kicks off
const { chromium } = await import('playwright');
const b2 = await chromium.launch(), ctx = await b2.newContext({ ...devices['iPhone 14 landscape'] }), ph = await ctx.newPage();
await ph.goto('file://' + copy); await ph.waitForTimeout(700);
await ph.tap('#smItems [data-act="exhibition"]'); await ph.waitForSelector('#exhPanel.show');
const eb = await ph.evaluate(() => [...document.querySelectorAll('#exhPanel .exhGo .smBtn')].map(b => { const r = b.getBoundingClientRect(); return { t: b.textContent.trim(), ok: r.right <= innerWidth && r.bottom <= innerHeight && r.height >= 30 }; }));
ok(eb.length === 3 && eb.every(b => b.ok) && /TACTICS/.test(eb[1].t), 'on a phone, the setup screen\'s KICK OFF, TACTICS and BACK all on it');
await ph.tap('#exhTac'); await ph.waitForTimeout(400);
const pk = await ph.evaluate(() => { const r = document.getElementById('mtKick').getBoundingClientRect(); return { on: r.width > 0 && r.right <= innerWidth && r.top >= 0, h: r.height }; });
await ph.tap('#mtKick'); await ph.waitForTimeout(300);
const ph1 = await ph.evaluate(() => ({ menu: window.__K.ev('menuOpen'), screen: window.__K.ev('SCREEN') }));
ok(pk.on && pk.h >= 30 && !ph1.menu && ph1.screen === 'match', 'on a phone, TACTICS before kick-off, its KICK OFF ▶ on the screen, and a tap on it kicks off');
await b2.close();

process.exit(rep.finish() ? 1 : 0);
