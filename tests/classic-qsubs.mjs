// FOOTBALL CLASSIC, QUICK SUBS: at the top of the screen, left of your man's card, SUBS and how many you've left; it
// drops down your suggested subs -- your most tired men, each with the man on the bench who'd do his job best on fresh
// legs -- and drops down by itself when one of yours gets too tired, going back up after a few seconds if you leave it.
// A tap makes the sub there and then (the man on fresh legs, one sub fewer, the man off gone for good); one coming off
// with the ball at his feet goes once he's played it. With no subs left it's gone, and it's never there in a lab. A tap
// on it is a tap on it, not on the game. ALL SUBS opens the match's tactics.
// On a copy of the game that lets the test reach the match's men and its subs.
import { open } from './_harness.mjs';
import { devices } from 'playwright';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__K={ ev:s=>eval(s) };\n  const LAB_TITLE=');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-qsubs-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
const K = s => page.evaluate(s => window.__K.ev(s), s);
await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show'); await page.click('#exhGo'); await page.waitForTimeout(1200);
await K('P.halfMin.val=5');   // (a long half: no half time while the test runs)
const box = sel => page.evaluate(s => { const e = document.querySelector(s); if(!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width }; }, sel);
const state = () => page.evaluate(() => { const w = document.getElementById('qsWrap');
  return { shown: getComputedStyle(w).display !== 'none', open: w.classList.contains('open'), hot: w.classList.contains('hot'), left: document.getElementById('qsLeft').textContent,
    rows: [...document.querySelectorAll('#qsDrop .qsRow')].map(r => r.innerText.replace(/\s+/g, ' ').trim()), none: !!document.querySelector('#qsDrop .qsNone'),
    msg: document.getElementById('qsMsg').classList.contains('on') ? document.getElementById('qsMsg').innerText : '' }; });

// THE CHIP: there at kick-off, SUBS 2, just left of your man's card on the same line
let S = await state(); const chip = await box('#qsWrap'), card = await box('#rPlayer');
info('at kick-off: ' + JSON.stringify(S) + ' chip ' + JSON.stringify(chip) + ' card ' + JSON.stringify(card));
ok(S.shown && S.left === '2' && !S.open, 'at kick-off the SUBS chip is up there, with 2 left, shut');
ok(chip && card && chip.r <= card.l && card.l - chip.r < 16 && Math.abs(chip.t - card.t) < 2, 'it sits just left of your man\'s card, on the same line');
// opened with nobody tired: nothing to suggest, and the way to all of them
await page.click('#qsBtn'); await page.waitForTimeout(150); S = await state();
ok(S.open && S.none && S.rows.length === 0, 'opened at kick-off, nobody\'s tired: "Nobody needs taking off yet", no rows');
await page.click('#qsBtn'); await page.waitForTimeout(150); S = await state();
ok(!S.open, 'a second tap on the chip puts it back up');
await page.click('#qsBtn'); const tOpen = await K('simNow');
await page.waitForFunction(t => window.__K.ev('simNow') > t + 10.3, tOpen, { timeout: 60000, polling: 100 }); S = await state();
ok(!S.open, 'opened and left alone, it goes back up after 10 seconds');

// TOO TIRED: one of yours worn down to half his ceiling -- it drops down by itself with him on it, the man from the
// bench best at his spot to come on, and goes back up by itself after a few seconds
const worn = await K(`(()=>{ const p=players.filter(q=>q.team==='G'&&q!==controlled)[1]; p.staminaCap=0.5; p.stamina=0.45; return {si:p.squadIdx, name:p.pname}; })()`);
await page.waitForTimeout(250); S = await state(); const tDrop = await K('simNow');
info('one worn out (' + worn.name + '): ' + JSON.stringify(S));
ok(S.open && S.hot && S.rows.length >= 1 && S.rows[0].includes(worn.name.split(' ').slice(-1)[0]), 'a man worn down to half his ceiling: it drops down by itself, him first, and the chip lights up');
const sug = await K(`qsSuggest().map(s=>({out:s.out,inn:s.inn,rIn:s.rIn,rOut:s.rOut,cap:s.cap}))`);
const best = await K(`(()=>{ const s=qsSuggest()[0], sl=qsSlot(s.out); return Math.max(...mtBench('G').filter(si=>SQUAD.G[si].role!=='GK').map(si=>mtRating(SQUAD.G[si],sl.role,sl.pos))); })()`);
ok(sug.length && sug[0].out === worn.si && sug[0].rIn === best && sug[0].rIn > sug[0].rOut * (0.74 + 0.26 * sug[0].cap), `...offering the bench's best at his spot (${sug[0] && sug[0].rIn}, against his ${sug[0] && sug[0].rOut} on tired legs)`);
await page.waitForFunction(t => window.__K.ev('simNow') > t + 6.3, tDrop, { timeout: 40000, polling: 100 }); S = await state();   // (six seconds of the match, however fast it's running)
ok(!S.open && S.hot, 'left alone, it goes back up after a few seconds (the chip still lit)');
await page.waitForTimeout(400); S = await state();
ok(!S.open, '...and doesn\'t drop down again for the same man');

// THE SUB: tap his row -- the bench man's on in his place there and then, fresh; one sub left; the man off can't come back
await page.click('#qsBtn'); await page.waitForTimeout(150);
await page.click('#qsDrop .qsRow'); await page.waitForTimeout(250);
const after = await K(`(()=>{ const p=players.find(q=>q.team==='G'&&q.squadIdx===${sug[0].inn}); return { on:!!p, name:p&&p.pname, cap:p&&+p.staminaCap.toFixed(2), st:p&&+p.stamina.toFixed(2),
  offOn:players.some(q=>q.team==='G'&&q.squadIdx===${sug[0].out}), used:SUBS.G.used, benchHasOff:mtBench('G').includes(${sug[0].out}), offs:SUBS.G.off }; })()`);
S = await state();
info('after the sub: ' + JSON.stringify(after) + ' ' + JSON.stringify(S));
ok(after.on && !after.offOn && after.cap >= 0.99 && after.st >= 0.9, `a tap on his row: ${after.name} on in his place there and then, on fresh legs (${after.cap}, ${after.st} a moment on)`);
ok(after.used === 1 && S.left === '1' && !after.benchHasOff, 'one sub fewer (1 left), and the man off isn\'t on the bench to come back');
ok(!S.open && /ON .* OFF/.test(S.msg), `it goes back up and says who's on and who's off ("${S.msg}")`);

// ON THE BALL: the rest of the side worn down, the one it suggests first made your man, with the ball at his feet (and
// you not touching anything, he keeps it) -- tapped, he stays on until he's played it
await K(`players.filter(q=>q.team==='G'&&q.squadIdx!==${sug[0].inn}).forEach((q,i)=>{ q.staminaCap=0.45+i*0.01; q.stamina=0.4; })`);
const w2 = await K(`(()=>{ const s=qsSuggest()[0]; if(!s) return null; const p=players.find(q=>q.team==='G'&&q.squadIdx===s.out); setControlled(p); own(p,p.r+ball.r+4); return {si:s.out, row:s.out+':'+s.inn, name:p.pname}; })()`);
await page.waitForTimeout(250); S = await state();
if(!S.open){ await page.click('#qsBtn'); await page.waitForTimeout(150); }
const row2 = w2 && w2.row;
await page.click(`#qsDrop .qsRow[data-qs="${row2}"]`); await page.waitForTimeout(120);
const held = await K(`({ stillOn:players.some(q=>q.team==='G'&&q.squadIdx===${w2.si}), pend:!!QS.pend, used:SUBS.G.used })`); S = await state();
ok(row2 && held.stillOn && held.pend && held.used === 1 && S.rows.some(r => /WHEN HE'S PLAYED IT/.test(r)), 'one coming off with the ball at his feet stays on while he has it ("WHEN HE\'S PLAYED IT")');
await K(`(()=>{ ball.ownedBy=null; ball.dribbler=null; ball.x=FW/2; ball.y=40; ball.vx=ball.vy=0; })()`); await page.waitForTimeout(250);
const gone = await K(`({ stillOn:players.some(q=>q.team==='G'&&q.squadIdx===${w2.si}), used:SUBS.G.used, t:simNow })`); S = await state();
ok(!gone.stillOn && gone.used === 2, '...and goes as soon as he\'s off the ball');
ok(S.shown && /ON .* OFF/.test(S.msg) && S.left === '0', `the last one too says who's on and who's off ("${S.msg}")`);
await page.waitForFunction(t => window.__K.ev('simNow') > t + 2.8, gone.t, { timeout: 30000, polling: 100 }); S = await state();
ok(!S.shown, '...and then, no subs left, the chip\'s gone');

await browser.close();

// ON A PHONE: a tap on the chip opens it and isn't a tap on the game; ALL SUBS opens the match's tactics; in a lab it's never there
const { chromium } = await import('playwright');
const b3 = await chromium.launch(), ctx = await b3.newContext({ ...devices['iPhone 14 landscape'] }), ph = await ctx.newPage();
await ph.goto('file://' + copy); await ph.waitForTimeout(800);
await ph.tap('#smItems [data-act="exhibition"]'); await ph.waitForSelector('#exhPanel.show'); await ph.tap('#exhGo'); await ph.waitForTimeout(1200);
const KP = s => ph.evaluate(s => window.__K.ev(s), s);
await ph.tap('#qsBtn'); await ph.waitForTimeout(150);
const t1 = await KP(`({ open:document.getElementById('qsWrap').classList.contains('open'), taps:Object.keys(tapStart).filter(k=>tapStart[k]).length, trap:trapHeld })`);
ok(t1.open && t1.taps === 0 && !t1.trap, 'on a phone, a tap on the chip opens it and isn\'t taken as a tap on the game');
const fit = await ph.evaluate(() => { const r = document.getElementById('qsDrop').getBoundingClientRect(), c = document.getElementById('rPlayer').getBoundingClientRect(), q = document.getElementById('qsWrap').getBoundingClientRect();
  return { l: r.left, r: r.right, vw: innerWidth, row: Math.abs(c.top - q.top) < 2 }; });
ok(fit.l >= 0 && fit.r <= fit.vw && fit.row, `...it fits on the screen (${Math.round(fit.l)}-${Math.round(fit.r)} of ${fit.vw}), the chip on the card's line`);
await ph.tap('#qsDrop [data-qs="all"]'); await ph.waitForTimeout(250);
const tac = await KP(`({ tac:document.getElementById('mtacOv').classList.contains('on'), open:document.getElementById('qsWrap').classList.contains('open') })`);
ok(tac.tac && !tac.open, 'ALL SUBS opens the match\'s tactics');
await KP(`(()=>{ closeMatchTac(); closePause(); LAB.on=true; })()`); await ph.waitForTimeout(150);
const lab = await ph.evaluate(() => getComputedStyle(document.getElementById('qsWrap')).display);
await KP('LAB.on=false');
ok(lab === 'none', 'in a lab it isn\'t there');
await b3.close();

process.exit(rep.finish() ? 1 : 0);
