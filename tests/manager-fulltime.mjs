// FOOTBALL CLASSIC, FULL TIME IN A CAREER (v106): SIM THE REST from the pause menu, then the report in two screens --
// THE RESULT (the score between the two clubs, each side's goals with the minute and who made it, where it leaves you;
// NEXT) and YOUR PLAYERS (a row for every man who played: rating, goals, assists, passes, shots, tackles, interceptions,
// saves; the man of the match starred; CONTINUE) -- the press conference in a press room drawn by the league (a back
// room in Division 2, the full room with its photographers in the Premier Division, the stars on a Continental Champions Cup night),
// then (v242) the STADIUM SUMMARY and the FUND SUMMARY back at the club, a line a press (as the books have it), and the
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
await page.evaluate(()=>{ for(let i=0;i<3;i++){ const g=document.getElementById('mgGo'), m=document.getElementById('mgrMaker'); if(!g||!m||!m.classList.contains('on')||g.disabled) break; g.click(); } })   /* (v242: NEXT, NEXT, START CAREER) */; await page.waitForSelector('#careerHub.show', { timeout: 6000 });
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
ok(sc.trim() === want && goals.length === r.logG + r.logR && goals.every(t => /^\S.* \d+’$/.test(t)) && /TABLE\s+\d+(st|nd|rd|th)\s+(NO CHANGE|[▲▼] \d+ PLACES?)/.test(s1) && /AFTER THE MATCH/.test(s1) && /NEXT/.test(s1) && !/PASSES/.test(s1),
  'THE RESULT (v248: as its template): the score between the two clubs (' + sc.trim() + '), every goal its scorer and its minute (' + (goals.slice(0, 2).join(' | ') || 'none') + '), the table where it leaves you, NEXT');
// (v248) on the templates' grid: AFTER THE MATCH, a box 8 under it across the page 88 high -- each crest 16 in from its side,
// the score in a well over the middle four columns -- then 8 under that the two sides' boxes, five columns each, and the
// table's, two, 8 apart, and NEXT two columns wide under the table's box, 8 lower
const lay = await page.evaluate(() => { const R = s => { const e = document.querySelector('#matchReport ' + s); if(!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), r: Math.round(r.right), b: Math.round(r.bottom) }; };
  return { head: R('.mrPage[data-mrp="0"] .tplHead'), board: R('.mrBoard'), score: R('.mrBoard .mrScore'), cl: R('.mrCrest.l'), cr: R('.mrCrest.r'), gl: R('.mrGls.l'), gr: R('.mrGls.r'), tb: R('.mrTbl'), next: R('#mrNextBtn'),
    nmL: (document.querySelector('#matchReport .mrNm.l') || {}).textContent, nmR: (document.querySelector('#matchReport .mrNm.r') || {}).textContent }; });
{ const L = lay, near = (a, b, t = 1) => Math.abs(a - b) <= t, col = (L.board.w - 88) / 12;
  info('the result on the grid: ' + JSON.stringify({ board: L.board, score: L.score, gl: L.gl, gr: L.gr, tb: L.tb, next: L.next }));
  ok(L.head && L.board && L.cl && L.cr && near(L.board.y, L.head.y + 44) && L.board.h === 88 && near(L.cl.x - L.board.x, 16) && near(L.board.r - L.cr.r, 16)
    && near(L.score.x + L.score.w / 2, L.board.x + L.board.w / 2) && near(L.score.w, col * 4 + 24, 2) && L.score.h === 48
    && near(L.gl.y, L.board.b + 8) && L.gl.x === L.board.x && near(L.tb.r, L.board.r) && near(L.gl.w, col * 5 + 32, 2) && near(L.gr.w, L.gl.w) && near(L.tb.w, col * 2 + 8, 2)
    && near(L.gr.x - L.gl.r, 8) && near(L.tb.x - L.gr.r, 8) && near(L.next.r, L.board.r) && near(L.next.w, L.tb.w) && near(L.next.y, L.gl.b + 8) && L.next.h === 36,
    'v248: THE RESULT on the templates\' grid -- the box 8 under the header, 88 high, each crest 16 in from its side and the score over the middle four columns; the sides\' boxes (five columns) and the table\'s (two) 8 under it and 8 apart; NEXT two columns wide under the table, 8 lower'); }

// --- YOUR PLAYERS -------------------------------------------------------------------------------------------------------------
await page.click('#mrNextBtn'); await page.waitForTimeout(120);
const rows = await page.$$eval('#matchReport .mrStats tbody tr', ns => ns.map(n => ({ t: [...n.children].map(c => c.textContent.trim()), motm: n.classList.contains('motm') })));
r = await K(`(()=>{ const S=SUBS.G, lu=LINEUP.G, on=new Set([lu.gk,...lu.atk]); let n=0; SQUAD.G.forEach((e,si)=>{ if(on.has(si)||S.on.includes(si)||S.off.includes(si)) n++; }); return { n, best:Math.max(...RAT_NOW.map(x=>x.r)) }; })()`);
const motm = rows.filter(x => x.motm);
const lay2 = await page.evaluate(() => { const box = document.querySelector('#matchReport .mrStatsBox').getBoundingClientRect(), cb = document.getElementById('mrContinueBtn').getBoundingClientRect(), head = document.querySelector('#matchReport .mrPage[data-mrp="1"] .tplHead').getBoundingClientRect();
  const th = document.querySelector('#matchReport .mrStats thead th'), td = document.querySelector('#matchReport .mrStats tbody tr:not(.motm) td'), lit = document.querySelector('#matchReport .mrStats tr.motm td');
  return { top: Math.round(box.top - head.top), w: Math.round(box.width), cbR: Math.round(box.right - cb.right), cbY: Math.round(cb.top - box.bottom), cbH: Math.round(cb.height), thBg: getComputedStyle(th).backgroundColor, thH: Math.round(th.getBoundingClientRect().height),
    tdH: Math.round(td.getBoundingClientRect().height), tdBg: getComputedStyle(td).backgroundColor, litBg: lit && getComputedStyle(lit).backgroundColor, litBar: lit && getComputedStyle(lit).boxShadow, title: document.querySelector('#matchReport .mrPage[data-mrp="1"] .tplTitle').textContent }; });
info('YOUR PLAYERS on the grid: ' + JSON.stringify(lay2));
ok(lay2.title === 'YOUR PLAYERS' && lay2.top === 44 && lay2.cbR === 0 && lay2.cbY === 8 && lay2.cbH === 36 && lay2.thH === 24 && lay2.tdH === 22 && lay2.thBg !== lay2.tdBg && lay2.litBg && lay2.litBg !== lay2.tdBg && /inset/.test(lay2.litBar),
  'v248: YOUR PLAYERS as its template -- the table in a box 8 under the header, its heads in the well (24 high), a row of 22 for each man, your best lit with the orange bar; CONTINUE under the box at its right, 8 lower');
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
  'the room grows with the league: Division 2 a reporter or two and no cameras; Division 1 more; the National Division a TV camera; the Premier Division (and a Continental Champions Cup night) ' + r[3].men + ' of them and ' + r[3].cams + ' photographers');

// --- THE MONEY ------------------------------------------------------------------------------------------------------------------
await page.click('#pressModal [data-pr="skip"]'); await page.waitForTimeout(400);
// (v186) after a home game the ground comes up first -- v242: the STADIUM SUMMARY, a line a press: who came, then each part
// of the ground (its fans and price, the cheapest first), then the gate in all -- as the books have it
const press = async n => { for(let i = 0; i < n; i++){ await page.click('#moneyModal [data-mn="go"]'); await page.waitForTimeout(30); } };
const gate = await K(`(()=>{ const d=CAREER.data, c=document.querySelector('#moneyModal .mnCard'), G=d.lastGate; if(!c||!/STADIUM SUMMARY/.test(c.textContent)) return null;
  const rows=[...c.querySelectorAll('.mnList > [data-seat]')];
  return { rows:rows.map(r=>r.dataset.seat).join(), want:G.seats.slice().sort((a,b)=>a.price-b.price).map(x=>x.id).join(), first:c.querySelector('.mnStep').textContent, n:c.querySelectorAll('.mnStep').length,
    shown:c.querySelectorAll('.mnStep.on').length, boxes:[...c.querySelectorAll('.mnSt')].map(b=>({ id:b.dataset.st, f:b.style.getPropertyValue('--f'), t:b.textContent })), att:G.att, cap:G.cap, gate:G.gate, sum:G.seats.reduce((a,x)=>a+x.att,0), take:Math.round(G.seats.reduce((a,x)=>a+x.att*x.price,0)),
    paid:rows.reduce((a,r)=>a+(+r.querySelector('b').textContent.replace(/[^0-9]/g,'')),0), led:d.ledger[0].gate, text:c.textContent,
    seats:G.seats.map(x=>({ id:x.id, att:x.att, cap:x.cap })) }; })()`);
if(gate){ info('THE STADIUM SUMMARY: ' + gate.first + ' · ' + gate.rows);
  ok(gate.shown === 0 && gate.rows === gate.want && gate.sum === gate.att && gate.take === gate.gate && Math.abs(gate.paid - gate.gate) <= gate.rows.split(',').length && gate.led === gate.gate && gate.first.includes(gate.att.toLocaleString()) && gate.text.includes('Taken at the gate'),
    'v242: THE STADIUM SUMMARY first, after a home game -- nothing up till NEXT; then the crowd (' + gate.att + ' of ' + gate.cap + '), each part of the ground cheapest first, its fans and price; they add up to the gate the books took');
  // v243: the ground from above beside the lines -- a box for every part of the ground (the bleachers' two sides both
  // the one part), each to fill as full as it was, saying just how many came and the percentage
  const pcOf = x => x.cap ? Math.round(x.att / x.cap * 100) : 0;
  const boxOk = gate.seats.every(x => gate.boxes.some(b => b.id === x.id)) && gate.boxes.every(b => { const x = gate.seats.find(q => q.id === b.id); if(!x) return false;
    return b.f === Math.min(100, pcOf(x)) + '%' && (!b.t || b.t.replace(/[^0-9]/g, '') === String(x.att) + String(pcOf(x))); });
  ok(boxOk && gate.boxes.filter(b => b.t).length === gate.seats.length, 'v243: the ground beside the lines -- ' + gate.boxes.length + ' stands for ' + gate.seats.length + ' parts of the ground, each to fill as full as it was, with how many came and the percentage (' + gate.boxes.filter(b => b.t).map(b => b.id + ' ' + b.t).join(', ') + ')');
  await press(gate.n + 1); }
// v242: THE FUND SUMMARY (THE MONEY till now): the week from where the bank stood as it began -- each line, the wages in red,
// the week's net, the bank now -- adding up
const fund = await K(`(()=>{ const d=CAREER.data, c=document.querySelector('#moneyModal .mnCard'); if(!c||!/FUND SUMMARY/.test(c.textContent)) return null;
  const num=t=>(/[−-]/.test(t)?-1:1)*(+t.replace(/[^0-9]/g,'')), rows=[...c.querySelectorAll('.mnList > .mnRow')].map(r=>({ l:r.querySelector('span').childNodes[0].textContent, v:num(r.querySelector('b').textContent), cls:r.className }));
  const game=W=>!!(W&&W.L&&['gate','tv','partners','wages'].some(k=>W.L[k])), wk=game(d.wl)?d.wl:game(d.wlPrev)?d.wlPrev:null;   // (the week the game was in)
  const cr=c.getBoundingClientRect(), rr=[...c.querySelectorAll('.mnList > .mnRow')].map(r=>Math.round(r.getBoundingClientRect().height)), go=c.querySelector('[data-mn="go"]').getBoundingClientRect(), pr=document.createElement('i'); pr.style.cssText='position:fixed;left:0;top:0;height:1px;width:var(--tplC)'; document.body.appendChild(pr); const col=pr.getBoundingClientRect().width; pr.remove();   // (a column's width, as the grid has it)
  const tot=c.querySelector('.mnRow.tot');
  return { rows, b0:wk?Math.round(wk.b0):null, bank:Math.round(d.budget), n:c.querySelectorAll('.mnList > *').length, fans:!!c.querySelector('.mnFans')&&/ · [+−]\\d[\\d,]* fans, [\\d,]+ now/.test(tot?tot.textContent:''),
    lay:{ x:Math.round(cr.left), w:Math.round(cr.width), col:Math.round(col*10)/10, rows:rr, goW:Math.round(go.width), inW:Math.round(cr.width-8), title:getComputedStyle(c.querySelector('.mnTitle')).color } }; })()`);
{ const R = fund ? fund.rows : [], first = R[0] || {}, now = R.find(x => /^Now in the bank/.test(x.l)) || {}, net = R.find(x => /^This week/.test(x.l)) || {}, mid = R.filter(x => x !== first && x !== now && x !== net), wages = R.find(x => /^Wages/.test(x.l));
  info('the fund summary: ' + R.map(x => x.l + ' ' + x.v).join(' | '));
  ok(!!fund && first.v === fund.b0 && now.v === fund.bank && mid.reduce((a, x) => a + x.v, 0) === now.v - first.v && net.v === now.v - first.v && fund.fans,
    'v242: THE FUND SUMMARY -- from ' + first.v + ' at the start of the week the game was in, its lines (' + mid.map(x => x.l).join(', ') + ') to ' + now.v + ' now: they add up, the net ' + net.v + '; and the fans');
  ok(!wages || (wages.v < 0 && / dn/.test(wages.cls) && R.indexOf(wages) > R.findIndex(x => /^The gate|^The TV/.test(x.l))), 'v242: the wages after what came in, in red (' + (wages ? wages.v : 'none') + ')');
  { const L = fund && fund.lay; info('the fund summary on the grid: ' + JSON.stringify(L));
    ok(!!L && Math.abs(L.w - (L.col * 8 + 56)) <= 2 && L.rows.slice(0, -1).every(h => h === 24) && L.rows[L.rows.length - 1] === 26 && Math.abs(L.goW - L.inW) <= 1,
      'v248: THE FUND SUMMARY as its template -- a box eight columns wide, its lines in rows of 24 (the bank now 26, the fans gained or lost after its words), CONTINUE the width of the box'); }
  await press(fund ? fund.n : 0); }
await page.click('#moneyModal [data-mn="go"]'); await page.waitForTimeout(200);
r = await K(`(()=>{ const d=CAREER.data, b=document.querySelector('#careerHub .cpPapers'); return { wday:d.wday, pile:document.getElementById('pileModal').classList.contains('on'), side:!!b&&getComputedStyle(b).display!=='none', n:+document.getElementById('cpPapersN').textContent, left:pileLeft(d).length }; })()`);
ok(!(await on('moneyModal')) && r.wday === 'mon' && !r.pile && r.side && r.n === r.left && r.left > 0, 'CONTINUE: the club, Monday -- the papers waiting off to the side, ' + r.n + ' in the orange box');

process.exitCode = rep.finish() ? 1 : 0;
await browser.close();
