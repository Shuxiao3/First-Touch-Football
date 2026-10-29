// FOOTBALL CLASSIC, QUICK SUBS: at the top of the screen, left of your man's card, SUBS and how many you've left (three
// a match). Pressed -- and only pressed: it never drops down by itself, and stays down until you press it again -- it
// drops down a short list, a sub a line, small: in a career match your planned subs first (the training pitch's Subs
// tab), then your most tired men, each with the man on the bench who'd do his job best on fresh legs. When one of yours
// gets too tired the chip lights up. A tap makes the sub there and then (the man on fresh legs, one fewer, the man off
// gone for good); one coming off with the ball at his feet goes once he's played it. With no subs left it's gone, and
// it's never there in a lab. A tap on it is a tap on it, not on the game. ALL SUBS opens the match's tactics. The Subs
// tab: tap a man on the pitch and one on the bench to pair them, up to three; in the match they're first on the list.
// On a copy of the game that lets the test reach the match's men and its subs, and the career.
import { open } from './_harness.mjs';
import { devices } from 'playwright';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__K={ ev:s=>eval(s) };\n  const LAB_TITLE=');
patch('  // ===== END MANAGER CAREER', '  window.__MG={get d(){ return CAREER&&CAREER.data; }, mgPlay, mgNextDay, mgNextGame, ensureLineup, mgSave};\n  // ===== END MANAGER CAREER');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-qsubs-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
const K = s => page.evaluate(s => window.__K.ev(s), s);
const simFor = async secs => { const t0 = await K('simNow'); await page.waitForFunction(t => window.__K.ev('simNow') > t, t0 + secs, { timeout: 60000, polling: 100 }); };   // (that much of the match, however fast it runs)
await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show'); await page.click('#exhGo'); await page.waitForTimeout(1200);
await K('P.halfMin.val=5');   // (a long half: no half time while the test runs)
const box = sel => page.evaluate(s => { const e = document.querySelector(s); if(!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; }, sel);
const state = () => page.evaluate(() => { const w = document.getElementById('qsWrap');
  return { shown: getComputedStyle(w).display !== 'none', open: w.classList.contains('open'), hot: w.classList.contains('hot'), left: document.getElementById('qsLeft').textContent,
    rows: [...document.querySelectorAll('#qsDrop .qsRow')].map(r => ({ qs: r.dataset.qs, text: r.innerText.replace(/\s+/g, ' ').trim(), plan: r.classList.contains('plan'), wait: r.classList.contains('wait'), h: r.getBoundingClientRect().height })),
    none: !!document.querySelector('#qsDrop .qsNone'), msg: document.getElementById('qsMsg').classList.contains('on') ? document.getElementById('qsMsg').innerText : '' }; });

// THE CHIP: there at kick-off, SUBS 3, just left of your man's card on the same line
let S = await state(); const chip = await box('#qsWrap'), card = await box('#rPlayer');
ok(S.shown && S.left === '3' && !S.open, 'at kick-off the SUBS chip is up there, with 3 left, shut');
ok(chip && card && chip.r <= card.l && card.l - chip.r < 16 && Math.abs(chip.t - card.t) < 2, 'it sits just left of your man\'s card, on the same line');
await page.click('#qsBtn'); await page.waitForTimeout(150); S = await state();
ok(S.open && S.none && S.rows.length === 0, 'pressed at kick-off, nobody tired: "No one\'s tired yet", no lines');
await simFor(12); S = await state();
ok(S.open, 'down, it stays down (12 s of the match on) until it\'s pressed again');
await page.click('#qsBtn'); await page.waitForTimeout(150); S = await state();
ok(!S.open, 'pressed again, it goes back up');

// TOO TIRED: one of yours worn down to half his ceiling -- it doesn't drop down; the chip lights up, that's all; pressed,
// he's first, with the bench's best at his spot, on a small one-line row
const worn = await K(`(()=>{ const p=players.filter(q=>q.team==='G'&&q!==controlled)[1]; p.staminaCap=0.5; p.stamina=0.45; return {si:p.squadIdx, name:p.pname}; })()`);
await simFor(1.5); S = await state();
ok(!S.open && S.hot, 'one of yours worn down to half his ceiling: it doesn\'t drop down by itself, the chip just lights up');
await page.click('#qsBtn'); await page.waitForTimeout(150); S = await state();
const sug = await K(`qsSuggest().map(s=>({out:s.out,inn:s.inn,rIn:s.rIn,rOut:s.rOut,cap:s.cap}))`);
const best = await K(`(()=>{ const s=qsSuggest()[0], sl=qsSlot(s.out); return Math.max(...mtBench('G').filter(si=>SQUAD.G[si].role!=='GK').map(si=>mtRating(SQUAD.G[si],sl.role,sl.pos))); })()`);
info('worn out (' + worn.name + '): ' + JSON.stringify(S.rows));
ok(S.rows.length >= 1 && S.rows[0].text.includes(worn.name.split(' ').slice(-1)[0]) && sug[0].out === worn.si && sug[0].rIn === best && sug[0].rIn > sug[0].rOut * (0.74 + 0.26 * sug[0].cap),
  `pressed, he's first, with the bench's best at his spot (${sug[0] && sug[0].rIn}, against his ${sug[0] && sug[0].rOut} on tired legs)`);
const dropBox = await box('#qsDrop');
ok(dropBox.w <= 210 && S.rows.every(r => r.h <= 30) && /▸/.test(S.rows[0].text) && !/OFF|ON |FRESH/.test(S.rows[0].text), `small: ${Math.round(dropBox.w)} px wide, a sub a line ${Math.round(S.rows[0].h)} px high ("${S.rows[0].text}")`);

// THE SUB: tap his line -- the bench man's on in his place there and then, fresh; two left; the man off can't come back
await page.click('#qsDrop .qsRow'); await page.waitForTimeout(250);
const after = await K(`(()=>{ const p=players.find(q=>q.team==='G'&&q.squadIdx===${sug[0].inn}); return { on:!!p, name:p&&p.pname, cap:p&&+p.staminaCap.toFixed(2), st:p&&+p.stamina.toFixed(2),
  offOn:players.some(q=>q.team==='G'&&q.squadIdx===${sug[0].out}), used:SUBS.G.used, benchHasOff:mtBench('G').includes(${sug[0].out}) }; })()`);
S = await state();
ok(after.on && !after.offOn && after.cap >= 0.99 && after.st >= 0.9, `a tap on his line: ${after.name} on in his place there and then, on fresh legs`);
ok(after.used === 1 && S.left === '2' && !after.benchHasOff, 'one sub fewer (2 left), and the man off isn\'t on the bench to come back');
ok(!S.open && /ON .* OFF/.test(S.msg), `it goes back up and says who's on and who's off ("${S.msg}")`);

// ON THE BALL: the rest worn down, the first it suggests made your man, the ball at his feet (and you not touching
// anything, he keeps it) -- tapped, he stays on until he's played it
await K(`players.filter(q=>q.team==='G'&&q.squadIdx!==${sug[0].inn}).forEach((q,i)=>{ q.staminaCap=0.45+i*0.01; q.stamina=0.4; })`);
const w2 = await K(`(()=>{ const s=qsSuggest()[0]; if(!s) return null; const p=players.find(q=>q.team==='G'&&q.squadIdx===s.out); setControlled(p); own(p,p.r+ball.r+4); return {si:s.out, row:s.out+':'+s.inn}; })()`);
await page.click('#qsBtn'); await page.waitForTimeout(150);
await page.click(`#qsDrop .qsRow[data-qs="${w2 && w2.row}"]`); await page.waitForTimeout(120);
const held = await K(`({ stillOn:players.some(q=>q.team==='G'&&q.squadIdx===${w2 && w2.si}), pend:!!QS.pend, used:SUBS.G.used })`); S = await state();
ok(w2 && held.stillOn && held.pend && held.used === 1 && S.rows.some(r => r.wait), 'one coming off with the ball at his feet stays on while he has it (his line lit, waiting)');
await K(`(()=>{ ball.ownedBy=null; ball.dribbler=null; ball.x=FW/2; ball.y=40; ball.vx=ball.vy=0; })()`); await page.waitForTimeout(250);
const gone = await K(`({ stillOn:players.some(q=>q.team==='G'&&q.squadIdx===${w2 && w2.si}), used:SUBS.G.used })`); S = await state();
ok(!gone.stillOn && gone.used === 2 && S.shown && S.left === '1', '...and goes as soon as he\'s off the ball (one left)');

// THE THIRD: the last one, its word on who's on, then the chip goes
if(!S.open){ await page.click('#qsBtn'); await page.waitForTimeout(150); }
await page.click('#qsDrop .qsRow'); await page.waitForTimeout(200);
const g3 = await K(`({ used:SUBS.G.used, t:simNow })`); S = await state();
ok(g3.used === 3 && S.shown && /ON .* OFF/.test(S.msg) && S.left === '0', `a third sub (three a match), and its word on who's on ("${S.msg}")`);
await page.waitForFunction(t => window.__K.ev('simNow') > t + 2.8, g3.t, { timeout: 30000, polling: 100 }); S = await state();
ok(!S.shown, '...and then, no subs left, the chip\'s gone');
await browser.close();

// ON A PHONE: a tap on the chip opens it and isn't a tap on the game; it's small there too; ALL SUBS opens the match's
// tactics; in a lab it's never there
const { chromium } = await import('playwright');
const b3 = await chromium.launch(), ctx = await b3.newContext({ ...devices['iPhone 14 landscape'] }), ph = await ctx.newPage();
await ph.goto('file://' + copy); await ph.waitForTimeout(800);
await ph.tap('#smItems [data-act="exhibition"]'); await ph.waitForSelector('#exhPanel.show'); await ph.tap('#exhGo'); await ph.waitForTimeout(1200);
const KP = s => ph.evaluate(s => window.__K.ev(s), s);
await KP(`players.filter(q=>q.team==='G').forEach((q,i)=>{ q.staminaCap=0.5+i*0.01; })`);   // (three to suggest: the list at its longest)
await ph.tap('#qsBtn'); await ph.waitForTimeout(200);
const t1 = await KP(`({ open:document.getElementById('qsWrap').classList.contains('open'), taps:Object.keys(tapStart).filter(k=>tapStart[k]).length, trap:trapHeld })`);
ok(t1.open && t1.taps === 0 && !t1.trap, 'on a phone, a tap on the chip opens it and isn\'t taken as a tap on the game');
const fit = await ph.evaluate(() => { const r = document.getElementById('qsDrop').getBoundingClientRect(), c = document.getElementById('rPlayer').getBoundingClientRect(), q = document.getElementById('qsWrap').getBoundingClientRect();
  return { l: r.left, r: r.right, w: r.width, h: r.height, vw: innerWidth, vh: innerHeight, rows: document.querySelectorAll('#qsDrop .qsRow').length, row: Math.abs(c.top - q.top) < 2 }; });
ok(fit.l >= 0 && fit.r <= fit.vw && fit.row && fit.rows === 3 && fit.h <= 130 && fit.w <= 210,
  `...and three subs down it is ${Math.round(fit.w)}x${Math.round(fit.h)} px of a ${fit.vw}x${fit.vh} screen, on it, the chip on the card's line`);
await ph.tap('#qsDrop [data-qs="all"]'); await ph.waitForTimeout(250);
const tac = await KP(`({ tac:document.getElementById('mtacOv').classList.contains('on'), open:document.getElementById('qsWrap').classList.contains('open') })`);
ok(tac.tac && !tac.open, 'ALL SUBS opens the match\'s tactics');
await KP(`(()=>{ closeMatchTac(); closePause(); LAB.on=true; })()`); await ph.waitForTimeout(150);
const lab = await ph.evaluate(() => getComputedStyle(document.getElementById('qsWrap')).display);
await KP('LAB.on=false');
ok(lab === 'none', 'in a lab it isn\'t there');
await b3.close();

// A CAREER: the training pitch's Subs tab -- tap a man on the pitch and one on the bench to pair them; pair him again and
// the new pair takes the old one's place; ✕ takes one off; up to three. Then the match: your pairs first on the list,
// nobody tired, and a tap on one is that sub
const { browser: b4, page: pc, rep: r4 } = await open({ url: 'file://' + copy });
pc.on('pageerror', e => rep.errs.push('PAGEERROR: ' + e.message));
await pc.click('#smItems [data-act="new"]'); await pc.waitForTimeout(150); await pc.click('#newSlotList .slotBtn >> nth=0');
await pc.waitForSelector('#mgrMaker.on', { timeout: 4000 }); await pc.fill('#mgName', 'Sam Okafor'); await pc.fill('#mgClubIn', 'Fenmoor Athletic');
await pc.click('#mgGo'); await pc.waitForSelector('#careerHub.show', { timeout: 8000 }); await pc.waitForTimeout(300);
await pc.click('#chCampus [data-bldg="train"]'); await pc.waitForSelector('#bldgPanel.show'); await pc.click('#bldgPanel .bpTab:text-is("Subs")'); await pc.waitForTimeout(120);
const tab = () => pc.evaluate(() => ({ plan: JSON.stringify(__MG.d.qsubs || []), pairs: [...document.querySelectorAll('#bpBody .qpPair:not(.empty) .slNm')].map(e => e.textContent),
  head: [...document.querySelectorAll('#bpBody .selHd')].map(e => e.textContent), xi: document.querySelectorAll('#bpBody .qpRow[data-side="xi"]').length,
  bench: document.querySelectorAll('#bpBody .qpRow[data-side="bench"]').length, gkOff: [...document.querySelectorAll('#bpBody .qpRow[data-side="bench"]')].filter(b => b.disabled).length }));
const id = (side, k) => pc.$eval(`#bpBody .qpRow[data-side="${side}"] >> nth=${k}`, e => +e.dataset.qid).catch(() => pc.$$eval(`#bpBody .qpRow[data-side="${side}"]`, (ns, k) => +ns[k].dataset.qid, k));
const tapRow = async (side, k) => { await pc.click(`#bpBody .qpRow[data-side="${side}"] >> nth=${k}`); await pc.waitForTimeout(80); };
let T0 = await tab();
ok(T0.xi === 7 && T0.bench === 5 && T0.gkOff === 1 && T0.head.join('|') === 'ON THE PITCH|THE BENCH|QUICK SUBS · 0 OF 3' && T0.pairs.length === 0,
  'the Subs tab: the seven on the pitch, the bench\'s five (its keeper not to be had), and QUICK SUBS · 0 OF 3');
const x1 = await id('xi', 1), b1 = await id('bench', 1), b2 = await id('bench', 2), x4 = await id('xi', 4), b3i = await id('bench', 3);
await tapRow('xi', 1); await tapRow('bench', 1); let T1 = await tab();
await tapRow('xi', 1); await tapRow('bench', 2); let T2 = await tab();
await tapRow('bench', 3); await tapRow('xi', 4); let T3 = await tab();
info('Subs tab: ' + JSON.stringify({ T1: T1.pairs, T2: T2.pairs, T3: T3.pairs, plan: T3.plan }));
ok(T1.plan === JSON.stringify([{ off: x1, on: b1 }]) && T1.head[2] === 'QUICK SUBS · 1 OF 3', 'a man on the pitch, then one on the bench: paired (' + T1.pairs[0] + ')');
ok(T2.plan === JSON.stringify([{ off: x1, on: b2 }]), '...paired again with another, the new pair takes the old one\'s place');
ok(T3.plan === JSON.stringify([{ off: x1, on: b2 }, { off: x4, on: b3i }]), '...and the bench first, then the pitch, pairs them just the same (' + T3.pairs.join(' | ') + ')');
await pc.click('#bpBody .qpX >> nth=0'); await pc.waitForTimeout(80); const T4 = await tab();
await tapRow('xi', 1); await tapRow('bench', 2); const T5 = await tab();
ok(T4.plan === JSON.stringify([{ off: x4, on: b3i }]) && T5.plan === JSON.stringify([{ off: x4, on: b3i }, { off: x1, on: b2 }]), '✕ takes a pair off, and it can be made again');
// the match: days on to the first game (a new career starts in the summer), the plan as it was, then kick-off
await pc.click('#bldgPanel .bpTopBack'); await pc.waitForTimeout(100);
const kept = await pc.evaluate(() => { const d = __MG.d, was = JSON.stringify(d.qsubs); let n = 0; while(!__MG.mgNextGame(d) && n++ < 400) __MG.mgNextDay(d); __MG.mgSave(d);
  return { days: n, same: JSON.stringify(d.qsubs) === was }; });
await pc.evaluate(() => __MG.mgPlay(__MG.d)); await pc.waitForTimeout(1200);
ok(kept.same && await pc.evaluate(() => window.__K.ev("SCREEN==='match'&&!!careerFix")), `the plan is kept with the career (${kept.days} days on to the first game), and it's a career match`);
const KC = s => pc.evaluate(s => window.__K.ev(s), s);
await pc.click('#qsBtn'); await pc.waitForTimeout(200);
const want = await KC(`(()=>{ const d=CAREER.data, si=id=>SQUAD.G.findIndex(e=>e&&e.ri!=null&&d.roster[e.ri].id===id); return d.qsubs.map(q=>si(q.off)+':'+si(q.on)); })()`);
const tired = await KC(`players.filter(q=>q.team==='G'&&q.staminaCap<0.85).length`);
const M = await pc.evaluate(() => [...document.querySelectorAll('#qsDrop .qsRow')].map(r => ({ qs: r.dataset.qs, plan: r.classList.contains('plan') })));
info('the career match, pressed: ' + JSON.stringify({ want, rows: M, tired }));
ok(M.length >= 2 && M[0].plan && M[1].plan && M[0].qs === want[0] && M[1].qs === want[1] && !tired, 'in the match, pressed with nobody tired: your two planned subs first on the list, lit as yours');
await pc.click('#qsDrop .qsRow >> nth=0'); await pc.waitForTimeout(250);
const done = await KC(`(()=>{ const [o,i]=${JSON.stringify(want[0])}.split(':').map(Number); return { on:players.some(q=>q.team==='G'&&q.squadIdx===i), off:players.some(q=>q.team==='G'&&q.squadIdx===o), used:SUBS.G.used }; })()`);
ok(done.on && !done.off && done.used === 1, 'a tap on the first: that sub, there and then');
await b4.close();

process.exit(rep.finish() ? 1 : 0);
