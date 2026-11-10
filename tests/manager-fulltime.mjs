// FOOTBALL CLASSIC, FULL TIME IN A CAREER (v106): SIM THE REST from the pause menu, then the report in two screens --
// THE RESULT (the score between the two clubs, each side's goals with the minute and who made it, where it leaves you;
// NEXT) and YOUR PLAYERS (a row for every man who played: rating, goals, assists, passes, shots, tackles, interceptions,
// saves; the man of the match starred; CONTINUE) -- the press conference in a press room drawn by the league (a back
// room in League 2, the full room with its photographers in the Premium League, the stars on a Champions League night),
// then THE MONEY back at the club (before the game, from the game, the wages, now -- as the books have it), and the
// Monday papers waiting off to the side. On a copy of the game that lets the test reach it.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  let INJ_OFF=false;', '  let INJ_OFF=true;');
patch('  // ===== END MANAGER CAREER', '  window.__K={ ev:s=>eval(s) };\n  // ===== END MANAGER CAREER');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-fulltime-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy, papers: true });   // (it goes through the press and the money itself)
const { ok, info } = rep;
const K = s => page.evaluate(s => window.__K.ev(s), s);
const on = id => page.evaluate(id => document.getElementById(id).classList.contains('on'), id);
let r;
await page.emulateMedia({ reducedMotion: 'reduce' });
await page.click('#smItems [data-act="new"]'); await page.waitForTimeout(150);
await page.click('#newSlotList .slotBtn >> nth=0'); await page.waitForTimeout(100);
await page.waitForSelector('#mgrMaker.on', { timeout: 4000 });
await page.fill('#mgName', 'Kit Varga'); await page.fill('#mgClubIn', 'Fulltime Town');
await page.click('#mgGo'); await page.waitForSelector('#careerHub.show', { timeout: 6000 });
await K(`(()=>{ const d=CAREER.data; d.story={vet:2,kid:2,phone:2}; mgStoryShow(d); let n=0; while(!(d.phase==='league'&&d.wday==='sat')&&n++<20) mgForward(d); if(d.pile) d.pile.opened=true; pileHide(); mgSave(d); renderHub(); return 1; })()`);

// --- SIM THE REST: kick off, a few seconds of it, then the pause menu's SIM THE REST ----------------------------------------------
await K(`(()=>{ mgPlay(CAREER.data); return 1; })()`); await page.waitForTimeout(2500);
const before = await K(`(()=>({ clock:matchClock, half, g:scoreG, r:scoreR, bud:Math.round(CAREER.data.budget) }))()`);
await K(`(()=>{ openPause(); return 1; })()`); await page.waitForTimeout(150);
await page.click('#pauseMenu [data-pause="simrest"]'); await page.waitForTimeout(150);
const asked = await on('confirmModal'), paused = await K('pauseOpen');
await page.click('#confirmModal [data-cf="yes"]');
await page.waitForFunction(() => document.getElementById('matchReport').style.display === 'block', null, { timeout: 15000 });
r = await K(`(()=>{ const d=CAREER.data, m=d.lg[d.tier].fx[0].find(x=>x[0]===d.clubId||x[1]===d.clubId), home=m[0]===d.clubId;
  return { you:home?m[2]:m[3], them:home?m[3]:m[2], home, logG:goalLog.filter(x=>x.team==='G').length, logR:goalLog.filter(x=>x.team==='R').length, md:d.md }; })()`);
ok(asked && paused && r.md === 1 && r.you === r.logG && r.them === r.logR, 'SIM THE REST: asked first, the match paused while you decide; then full time, the round played, ' + r.you + '–' + r.them + ' as the log has it');

// --- THE RESULT ---------------------------------------------------------------------------------------------------------------
const s1 = await page.innerText('#matchReport');
const goals = await page.$$eval('#matchReport .mrPage[data-mrp="0"] .mrGoal', ns => ns.map(n => n.textContent));
const sc = await page.textContent('#matchReport .mrBoard .mrScore');
const want = r.home ? r.you + ' – ' + r.them : r.them + ' – ' + r.you;
ok(sc.trim() === want && goals.length === r.logG + r.logR && goals.every(t => /^\d+’/.test(t)) && /League position/.test(s1) && /NEXT/.test(s1) && !/PASSES/.test(s1),
  'THE RESULT: the score between the two clubs (' + sc.trim() + '), every goal with its minute and who made it (' + (goals.slice(0, 2).join(' | ') || 'none') + '), where it leaves you, NEXT');

// --- YOUR PLAYERS -------------------------------------------------------------------------------------------------------------
await page.click('#mrNextBtn'); await page.waitForTimeout(120);
const rows = await page.$$eval('#matchReport .mrStats tbody tr', ns => ns.map(n => ({ t: [...n.children].map(c => c.textContent.trim()), motm: n.classList.contains('motm') })));
r = await K(`(()=>{ const S=SUBS.G, lu=LINEUP.G, on=new Set([lu.gk,...lu.atk]); let n=0; SQUAD.G.forEach((e,si)=>{ if(on.has(si)||S.on.includes(si)||S.off.includes(si)) n++; }); return { n, best:Math.max(...RAT_NOW.map(x=>x.r)) }; })()`);
const motm = rows.filter(x => x.motm);
ok(rows.length === r.n && rows.every(x => x.t.length === 12) && motm.length === 1 && +motm[0].t[2] === r.best && /★/.test(motm[0].t[0]),
  'YOUR PLAYERS: a row for each of the ' + r.n + ' who played -- rating, goals, assists, passes, the share found, shots, on target (v147: its own column), tackles, interceptions, saves -- and your best on the day starred (' + motm[0].t[0] + ', ' + motm[0].t[2] + ')');

// --- the press conference, in its room -----------------------------------------------------------------------------------------
await page.click('#mrContinueBtn'); await page.waitForTimeout(250);
r = await K(`(()=>{ const d=CAREER.data, cv=document.querySelector('#pressModal .prScene'); if(!cv) return null; const px=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data, cols=new Set();
  for(let i=0;i<px.length;i+=16) cols.add(px[i]<<16|px[i+1]<<8|px[i+2]); return { room:d.press&&d.press.room, tier:d.tier, cols:cols.size, w:cv.width, h:cv.height, money:document.getElementById('moneyModal').classList.contains('on') }; })()`);
ok(await on('pressModal') && r && r.room === r.tier && r.cols > 12 && r.w === 128 && r.h === 80 && !r.money,
  'then the press conference, in a press room drawn for the league (room ' + (r && r.room) + ', ' + (r && r.cols) + ' colours); the money waits for it');
r = await K(`(()=>{ const n=l=>{ const S=prScene(l,['#c0392b','#fff'],7); return { men:S.men.length, cams:S.cams.filter(c=>!c.tv).length, tv:S.cams.filter(c=>c.tv).length }; }; return [1,2,3,4,5].map(n); })()`);
info('the rooms: ' + JSON.stringify(r));
ok(r[0].men <= 2 && r[0].cams + r[0].tv === 0 && r[1].men > r[0].men && r[2].tv === 1 && r[3].men >= 12 && r[3].cams >= 4 && r[4].men === r[3].men,
  'the room grows with the league: League 2 a reporter or two and no cameras; League 1 more; the Championship a TV camera; the Premium League (and a Champions League night) ' + r[3].men + ' of them and ' + r[3].cams + ' photographers');

// --- THE MONEY ------------------------------------------------------------------------------------------------------------------
await page.click('#pressModal [data-pr="skip"]'); await page.waitForTimeout(400);
// (v186) after a home game THE GATE comes up first: who came, stand by stand, and what they paid -- as the books have it
const gate = await K(`(()=>{ const d=CAREER.data, c=document.querySelector('#moneyModal .mnCard'), G=d.lastGate; if(!c||!/THE GATE/.test(c.textContent)) return null;
  return { rows:[...c.querySelectorAll('.gtRow')].map(r=>r.dataset.seat).join(), big:c.querySelector('.gtBig').textContent, seats:G.seats.map(x=>x.id).join(), att:G.att, cap:G.cap, gate:G.gate,
    sum:G.seats.reduce((a,x)=>a+x.att,0), take:Math.round(G.seats.reduce((a,x)=>a+x.att*x.price,0)), led:d.ledger[0].gate, text:c.textContent }; })()`);
if(gate){ info('THE GATE: ' + gate.big + ' · ' + gate.rows);
  ok(gate.rows === gate.seats && gate.sum === gate.att && gate.take === gate.gate && gate.led === gate.gate && gate.big.includes(gate.att.toLocaleString()) && gate.text.includes('Taken at the gate'),
    'THE GATE first, after a home game: every stand its crowd, seats, price and takings; they add up to the crowd (' + gate.att + ' of ' + gate.cap + ') and to the gate the books took');
  await page.click('#moneyModal [data-mn="go"]'); await page.waitForTimeout(250); }
const vals = await page.$$eval('#moneyModal .mnRow', ns => ns.map(n => ({ k: n.dataset.mn, v: n.querySelector('b').textContent })));
r = await K(`(()=>{ const d=CAREER.data; return { ledger:d.ledger[0], budget:Math.round(d.budget), fans:document.querySelector('#moneyModal .mnFans')?document.querySelector('#moneyModal .mnFans').textContent:'' }; })()`);
const num = t => (t.includes('−') || t.includes('-') ? -1 : 1) * +t.replace(/[^\d]/g, '');
const M = Object.fromEntries(vals.map(x => [x.k, num(x.v)]));
info('the money: ' + JSON.stringify({ M, ledger: r.ledger }));
ok(await on('moneyModal') && M.from === before.bud && M.inc === r.ledger.income && M.wages === -r.ledger.wages && M.to === r.ledger.budget && M.from + M.inc + M.wages === M.to && /fans/.test(r.fans),
  'back at the club: THE MONEY -- before the game ' + M.from + ', from the game +' + M.inc + ', wages ' + M.wages + ', now ' + M.to + ': as the books have it; and the fans');
await page.click('#moneyModal [data-mn="go"]'); await page.waitForTimeout(200);
r = await K(`(()=>{ const d=CAREER.data, b=document.querySelector('#careerHub .cpPapers'); return { wday:d.wday, pile:document.getElementById('pileModal').classList.contains('on'), side:!!b&&getComputedStyle(b).display!=='none', n:+document.getElementById('cpPapersN').textContent, left:pileLeft(d).length }; })()`);
ok(!(await on('moneyModal')) && r.wday === 'mon' && !r.pile && r.side && r.n === r.left && r.left > 0, 'CONTINUE: the club, Monday -- the papers waiting off to the side, ' + r.n + ' in the orange box');

process.exitCode = rep.finish() ? 1 : 0;
await browser.close();
