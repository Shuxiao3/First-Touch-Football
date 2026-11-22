// FOOTBALL CLASSIC, A MATCHDAY'S FLOW (v148): before your first career match, HOW TO PLAY -- the controls on a card,
// KICK OFF from it -- and the card again from CONTROLS in the pause menu (v228: the ? over the pitch went with the Studio's
// match screen), the match waiting while it's up; the first time each thing comes up, a word on it over the pitch (once each). At half-time the match stops on a card:
// the score, the numbers so far, SUBS and TACTICS (the board, and back to the card), SECOND HALF; HALF-TIME's PLAY ON in
// the settings plays on. The quick subs say anyone can come off, tired or not. And after the game, what comes up over the
// club comes one at a time, in order, each saying where it is in the run: the press conference (or the money) no longer
// opens under the report. On a copy with injuries off, and the test let in; a browser that's never seen the card.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  let INJ_OFF=false;', '  let INJ_OFF=true;');
patch('  // ===== END MANAGER CAREER', '  window.__K={ ev:s=>eval(s) };\n  // ===== END MANAGER CAREER');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-flow-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy, papers: true });
await page.addInitScript(() => { window.__pwOff = true; }); await page.evaluate(() => { window.__pwOff = true; });   // (v241: no word about the papers it leaves unread as it goes on -- not what it's testing)
const { ok, info } = rep;
const K = s => page.evaluate(s => window.__K.ev(s), s);
// (a browser that's never seen the card: the tips on, a break at half-time -- the harness takes them as seen and off;
// set as the game has them, not by a reload: a page off the disk doesn't always keep what's stored across one)
await K(`(()=>{ Object.assign(PREFS,{seenCtl:0, tips:1, tipsSeen:'', ht:'wait'}); savePrefs(); return 1; })()`);
await page.click('#smItems [data-act="new"]'); await page.waitForTimeout(150);
await page.click('#newSlotList .slotBtn >> nth=0'); await page.waitForTimeout(100);
await page.waitForSelector('#mgrMaker.on', { timeout: 4000 });
await page.fill('#mgName', 'Sam Okafor'); await page.fill('#mgClubIn', 'Flow Town');
await page.evaluate(()=>{ for(let i=0;i<3;i++){ const g=document.getElementById('mgGo'), m=document.getElementById('mgrMaker'); if(!g||!m||!m.classList.contains('on')||g.disabled) break; g.click(); } })   /* (v242: NEXT, NEXT, START CAREER) */; await page.waitForSelector('#careerHub.show', { timeout: 8000 });
await K(`(()=>{ const d=CAREER.data; d.story={vet:2,kid:2,phone:2}; mgStoryShow(d); while(!mgNextGame(d)) mgForward(d); d.pile=null; mgSave(d); renderHub(); return 1; })()`);
const on = id => page.evaluate(id => document.getElementById(id).classList.contains('on'), id);
const simAt = () => K('simNow');

// --- HOW TO PLAY, before your first career match --------------------------------------------------------------------------------
for(let i = 0; i < 8 && !(await page.$('#chBottom [data-mg="play"]')); i++){   // (to the day of the game: the days turning, each one's papers put aside)
  await K(`(()=>{ const d=CAREER.data; if(d.pile) d.pile.opened=true; pileHide(); return 1; })()`);
  await page.click('#chBottom [data-mg="forward"]'); await page.waitForTimeout(400);
  await page.waitForFunction(() => !document.getElementById('careerHub').classList.contains('dayscene'), null, { timeout: 8000 }).catch(() => {}); }
await K(`(()=>{ const d=CAREER.data; if(d.pile) d.pile.opened=true; pileHide(); renderHub(); return 1; })()`);
await page.click('#chBottom [data-mg="play"]'); await page.waitForTimeout(300);
let r = await K(`(()=>{ const c=document.querySelector('#ctlModal .ctlCard'); return { on:document.getElementById('ctlModal').classList.contains('on'), screen:SCREEN, text:c.innerText, keys:[...c.querySelectorAll('.ctlRows b')].map(b=>b.textContent), seen:PREFS.seenCtl }; })()`);
info('the card: ' + r.keys.join(' | '));
ok(r.on && r.screen === 'hub' && ['LEFT', 'PASS', 'SHOOT', 'CROSS', 'SKILL', 'DEFENDING', 'CORNERS', '☰'].every(k => r.keys.includes(k)) && /HOW TO PLAY/.test(r.text) && /KICK OFF/.test(r.text) && /Hold it to wind up/.test(r.text),
  'PLAY, your first career match: HOW TO PLAY first, the match not yet begun -- the screen\'s buttons (v159: on any device): steering on the left, PASS, SHOOT (hold it to wind up), CROSS, SKILL, defending, your corner, ☰; KICK OFF');
await page.click('#ctlModal [data-ctl="go"]'); await page.waitForTimeout(2500);
r = await K(`({ screen:SCREEN, on:document.getElementById('ctlModal').classList.contains('on'), fix:!!careerFix })`);
ok(r.screen === 'match' && !r.on && r.fix, 'KICK OFF: the card gone, the match on');

// --- CONTROLS in the pause menu: the match waits (v228: no ? over the pitch -- the Studio's match screen has none) ------------------
r = await K(`({ q:!!document.getElementById('ctlBtn') })`);
ok(!r.q, 'no ? over the pitch: the controls are in the menu (v228)');
await page.keyboard.press('Escape'); await page.waitForTimeout(150);
await page.click('#pauseMenu [data-pause="controls"]'); await page.waitForTimeout(150);
const t0 = await simAt(); await page.waitForTimeout(800); const t1 = await simAt();
const fromPause = await on('ctlModal');
r = await K(`({ btn:document.querySelector('#ctlModal [data-ctl="go"]').textContent })`);
ok(fromPause && t1 === t0 && /BACK/.test(r.btn), 'CONTROLS in the pause menu: the card, the match waiting (' + t0.toFixed(2) + ' s, then ' + t1.toFixed(2) + ')');
await page.click('#ctlModal [data-ctl="go"]'); await page.waitForTimeout(150);
ok(await on('pauseMenu'), '...BACK to the menu');
await page.click('#pauseMenu [data-pause="back"]'); await page.waitForTimeout(600);
ok(!(await on('ctlModal')) && (await simAt()) > t1, '...and back to the game, the clock going again');

// --- THE QUICK SUBS: anyone, tired or not -----------------------------------------------------------------------------------------
await K(`(()=>{ for(const p of players) if(p.team==='G'){ p.staminaCap=1; p.stamina=1; } QS.open=true; qsRender(qsSuggest()); return 1; })()`);
r = await page.innerText('#qsDrop');
ok(/^No one’s tired yet$|^No one's tired yet$/m.test(r) && /FORCE SUB/.test(r) && !/ALL SUBS/.test(r), 'v242: the quick subs with nobody tired: just "' + r.split('\n')[0] + '" -- and FORCE SUB in place of ALL SUBS');
// (v242) FORCE SUB: the most tired man off -- not tired enough to be offered -- for the bench's best at his spot, at the next break
r = await K(`(()=>{ const men=players.filter(p=>p.team==='G'&&p.squadIdx!=null&&qsSlot(p.squadIdx)); men[2].staminaCap=0.95; const want=men[2].squadIdx, s=qsForce();
  const was=SUBS.G.q.length; document.querySelector('#qsDrop [data-qs="force"]').click(); const q=SUBS.G.q.slice(), done=SUBS.G.used;
  return { want, out:s&&s.out, inn:s&&s.inn, bench:mtBench('G').includes(s&&s.inn), queued:q.some(x=>x.out===want)||done>0, was, open:QS.open }; })()`);
ok(r.out === r.want && r.bench && r.queued && !r.open, 'v242: FORCE SUB takes off the most tired man (ceiling 95%, under nobody\'s threshold) for a man off the bench -- on at the next break (' + JSON.stringify(r) + ')');
await K(`(()=>{ SUBS.G.q=[]; QS.open=false; for(const p of players) if(p.team==='G'){ p.staminaCap=1; p.stamina=1; } return 1; })()`);
await K(`(()=>{ QS.open=false; qsRender(qsSuggest()); return 1; })()`);

// --- THE TIPS: the first time each comes up ------------------------------------------------------------------------------------
const quiet = `restartT=0; restartInfo=null; offsideT=0; offsidePass=null; scoredT=0; kickT=0; kickBy=null; kickTo=null; gkHold=null; breakT=0;`;
const tipAt = async upM => { await K(`(()=>{ ${quiet} const c=controlled&&controlled.team==='G'&&!controlled.isGK?controlled:players.find(q=>q.team==='G'&&q.role==='MID'); if(controlled!==c) switchTo(c);
    const atk=atkOf('G'); c.x=FW/2+atk*${upM}*MK; c.y=YC; c.vx=c.vy=0; c.state='normal'; for(const q of players) if(q!==c&&Math.hypot(q.x-c.x,q.y-c.y)<10*MK){ q.x=FW/2-atk*30*MK; q.y=40; }
    ball.x=c.x+atk*(c.r+ball.r+4); ball.y=c.y; ball.z=0; ball.vx=ball.vy=ball.vz=0; own(c,c.r+ball.r+4); TIP.gap=0; TIP.t=0; return 1; })()`);
  await page.waitForTimeout(250); return K(`({ on:document.getElementById('tipBar').classList.contains('on'), text:document.getElementById('tipBar').innerText, seen:PREFS.tipsSeen })`); };
const tip1 = await tipAt(-5);
ok(tip1.on && /PASS/.test(tip1.text) && /through ball/.test(tip1.text) && !/loft/.test(tip1.text) && tip1.seen === 'p', 'the ball yours for the first time: a word on passing -- and the through ball, no lofted pass now (v167) ("' + tip1.text + '")');
await K(`(()=>{ TIP.t=0; document.getElementById('tipBar').classList.remove('on'); return 1; })()`);
const tip2 = await tipAt(-5);
const tip3 = await tipAt(34);
ok(!tip2.on && tip3.on && /SHOOT/.test(tip3.text) && /strike/.test(tip3.text) && tip2.seen === 'p' && tip3.seen === 'ps', 'the same again: nothing (once each); 18 m out: a word on shooting ("' + tip3.text + '")');
await K(`(()=>{ TIP.t=0; document.getElementById('tipBar').classList.remove('on'); return 1; })()`);

// --- HALF TIME ------------------------------------------------------------------------------------------------------------------------
await K(`(()=>{ ${quiet} mStat(players.find(q=>q.team==='G'),'sh'); endHalf(); return 1; })()`); await page.waitForTimeout(200);
const h0 = await simAt(); await page.waitForTimeout(700); const h1 = await simAt();
r = await K(`(()=>{ const c=document.querySelector('#htModal .htCard'); return { on:document.getElementById('htModal').classList.contains('on'), half, text:c.innerText, btns:[...c.querySelectorAll('[data-ht]')].map(b=>b.textContent) }; })()`);
info('half-time: ' + r.text.replace(/\n+/g, ' | '));
ok(r.on && r.half === 2 && h1 === h0 && /HALF TIME/.test(r.text) && /SHOTS/.test(r.text) && /ON TARGET/.test(r.text) && /FOUND/.test(r.text) && r.btns.some(t => /SUBS/.test(t)) && r.btns.some(t => /TACTICS/.test(t)) && r.btns.some(t => /SECOND HALF/.test(t)),
  'the half-time whistle: a card -- the score, both sides\' numbers so far (shots, on target, passes found...), SUBS, TACTICS, SECOND HALF -- and the match waiting');
await page.click('#htModal [data-ht="tac"] >> nth=0'); await page.waitForTimeout(200);
const board = await on('mtacOv');
await page.click('#mtacOv [data-mt="back"]'); await page.waitForTimeout(200);
ok(board && await on('htModal') && !(await on('pauseMenu')), 'SUBS: the match\'s board (any change); BACK: the half-time card again, not the pause menu');
await page.click('#htModal [data-ht="go"]'); await page.waitForTimeout(800);
ok(!(await on('htModal')) && (await simAt()) > h1, 'SECOND HALF: the card gone and the clock going');
await K(`(()=>{ PREFS.ht='on'; half=1; endHalf(); return 1; })()`); await page.waitForTimeout(150);
ok(!(await on('htModal')), 'HALF-TIME set to PLAY ON: the whistle and on, as it was');
await K(`(()=>{ PREFS.ht='wait'; return 1; })()`);

// --- AFTER THE GAME: one at a time (v242: no "N OF 4" under any of them; the STADIUM and FUND SUMMARY a line a press) -----------
await K(`(()=>{ finishCareerMatch(careerFix); return 1; })()`); await page.waitForTimeout(600);
const ups = () => K(`(()=>{ const L=['storyModal','matchReport','pressModal','moneyModal','pileModal'].filter(mgUpOn); return { L, seq:MGUI.seq&&MGUI.seq.slice(), tag:[...document.querySelectorAll('.seqTag')].filter(x=>x.offsetParent).map(x=>x.textContent.trim()), of:/\\b\\d OF \\d\\b/.test([...document.querySelectorAll('#matchReport,#pressModal,#moneyModal,#pileModal')].filter(e=>e.offsetParent||e.classList.contains('on')).map(e=>e.innerText).join(' ').replace(/QUESTION \\d+ OF \\d+/g,'')) }; })()`);   // (a question's own count isn't the queue's)
const steps = [];
let u = await ups(); steps.push(u);
info('full time: up ' + JSON.stringify(u.L) + ', the run ' + JSON.stringify(u.seq));
ok(u.L.length === 1 && u.L[0] === 'matchReport' && !u.tag.length && !u.of, 'full time: THE RESULT, nothing under it, and no "1 OF 4" (v242)');
await page.click('#mrNextBtn'); await page.waitForTimeout(200); u = await ups(); steps.push(u);
ok(u.L.length === 1 && u.L[0] === 'matchReport' && !u.tag.length && !u.of, 'NEXT: YOUR PLAYERS, no "2 OF 4"');
await page.click('#mrContinueBtn'); await page.waitForTimeout(300); u = await ups(); steps.push(u);
const pressFirst = u.L[0] === 'pressModal';
ok(u.L.length === 1 && !u.of && (pressFirst || u.L[0] === 'moneyModal'), 'CONTINUE: ' + (pressFirst ? 'the press conference, alone, no "3 OF 4"' : 'the money, alone'));
if(pressFirst){ await page.click('#pressModal [data-pr="skip"]'); await page.waitForTimeout(300); u = await ups(); steps.push(u); }
// a summary: its title alone at first, NEXT bringing up a line a press, CONTINUE once they're all up
const card = () => K(`(()=>{ const c=document.querySelector('#moneyModal .mnCard'); return { title:c.querySelector('.mnTitle').textContent, shown:[...c.querySelectorAll('.mnList > .on')].map(e=>e.innerText.replace(/\\s+/g,' ').trim()),
  all:c.querySelectorAll('.mnList > *').length, btn:c.querySelector('[data-mn="go"]').textContent.trim(), red:[...c.querySelectorAll('.mnList > .on.dn')].map(e=>e.innerText.split('\\n')[0]) }; })()`);
const through = async () => { const first = await card(), seen = [first]; for(let i = 0; i < first.all; i++){ await page.click('#moneyModal [data-mn="go"]'); await page.waitForTimeout(40); seen.push(await card()); } return seen; };
ok(u.L.length === 1 && u.L[0] === 'moneyModal' && !u.of, 'then the money, alone, no "4 OF 5"');
let c0 = await card();
if(c0.title === 'STADIUM SUMMARY'){   // (after a home game: the ground first)
  const S = await through(), end = S[S.length - 1], money = t => +t.replace(/[^0-9]/g, '');
  const stands = end.shown.slice(1, -1), prices = stands.map(t => +((t.match(/× \$(\d+)/) || [])[1] || 0));
  ok(S[0].shown.length === 0 && /^NEXT/.test(S[0].btn) && S.slice(1, -1).every((x, i) => x.shown.length === i + 1 && /^NEXT/.test(x.btn)) && /^CONTINUE/.test(end.btn),
    'v242: THE STADIUM SUMMARY starts with its title alone; NEXT brings up a line a press (' + (S.length - 1) + ' lines), and with the last up it reads CONTINUE');
  ok(/^Fans in the ground/.test(end.shown[0]) && prices.length >= 1 && prices.every((p, i) => !i || p >= prices[i - 1]) && /^Taken at the gate/.test(end.shown[end.shown.length - 1]),
    'v242: the fans first, then each part of the ground, its fans and its price, cheapest first ($' + prices.join(', $') + '), then the gate in all');
  await page.click('#moneyModal [data-mn="go"]'); await page.waitForTimeout(300); u = await ups(); steps.push(u); c0 = await card(); }
{ const S = await through(), end = S[S.length - 1], iG = end.shown.findIndex(t => /^The gate/.test(t)), iW = end.shown.findIndex(t => /^Wages/.test(t));
  info('the fund summary: ' + end.shown.join(' | '));
  ok(c0.title === 'FUND SUMMARY' && S[0].shown.length === 0 && /^CONTINUE/.test(end.btn) && /^At the start of the week/.test(end.shown[0]) && end.shown.some(t => /^This week/.test(t)) && end.shown.some(t => /^Now in the bank/.test(t)),
    'v242: THE FUND SUMMARY (THE MONEY till now): from the start of the week, a line a press, to this week\'s net and the bank now, then CONTINUE');
  ok(iW < 0 || (iW > iG && end.red.includes(end.shown[iW].split(' ')[0]) || end.red.some(t => /^Wages/.test(t))), 'v242: the wages after the gate, in red' + (iW < 0 ? ' (none this week)' : '')); }
await page.click('#moneyModal [data-mn="go"]'); await page.waitForTimeout(300); u = await ups(); steps.push(u);
ok(u.L.length <= 1 && (u.L.length === 0 || u.L[0] === 'pileModal') && !u.of, 'then ' + (u.L.length ? 'the papers' : 'the club, nothing more up'));
ok(steps.every(s => s.L.length <= 1), 'never two at once: ' + steps.map(s => s.L.join('+') || 'none').join(' > '));

process.exitCode = rep.finish();
await browser.close();
