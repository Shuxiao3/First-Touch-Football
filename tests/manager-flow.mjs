// FOOTBALL CLASSIC, A MATCHDAY'S FLOW (v148): before your first career match, HOW TO PLAY -- the controls on a card,
// KICK OFF from it -- and the card again from ? over the pitch and CONTROLS in the pause menu, the match waiting while it's
// up; the first time each thing comes up, a word on it over the pitch (once each). At half-time the match stops on a card:
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
const { ok, info } = rep;
const K = s => page.evaluate(s => window.__K.ev(s), s);
// (a browser that's never seen the card: the tips on, a break at half-time -- the harness takes them as seen and off;
// set as the game has them, not by a reload: a page off the disk doesn't always keep what's stored across one)
await K(`(()=>{ Object.assign(PREFS,{seenCtl:0, tips:1, tipsSeen:'', ht:'wait'}); savePrefs(); return 1; })()`);
await page.click('#smItems [data-act="new"]'); await page.waitForTimeout(150);
await page.click('#newSlotList .slotBtn >> nth=0'); await page.waitForTimeout(100);
await page.waitForSelector('#mgrMaker.on', { timeout: 4000 });
await page.fill('#mgName', 'Sam Okafor'); await page.fill('#mgClubIn', 'Flow Town');
await page.click('#mgGo'); await page.waitForSelector('#careerHub.show', { timeout: 8000 });
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

// --- ? over the pitch, and CONTROLS in the pause menu: the match waits ---------------------------------------------------------
await page.click('#ctlBtn'); await page.waitForTimeout(150);
const t0 = await simAt(); await page.waitForTimeout(800); const t1 = await simAt();
r = await K(`({ on:document.getElementById('ctlModal').classList.contains('on'), btn:document.querySelector('#ctlModal [data-ctl="go"]').textContent })`);
ok(r.on && t1 === t0 && /BACK TO THE GAME/.test(r.btn), '? over the pitch: the card, the match waiting (' + t0.toFixed(2) + ' s, then ' + t1.toFixed(2) + ')');
await page.click('#ctlModal [data-ctl="go"]'); await page.waitForTimeout(600);
ok(!(await on('ctlModal')) && (await simAt()) > t1, '...and back to the game, the clock going again');
await page.keyboard.press('Escape'); await page.waitForTimeout(150);
await page.click('#pauseMenu [data-pause="controls"]'); await page.waitForTimeout(150);
const fromPause = await on('ctlModal');
await page.click('#ctlModal [data-ctl="go"]'); await page.waitForTimeout(150);
ok(fromPause && await on('pauseMenu'), 'CONTROLS in the pause menu: the card, and BACK to the menu');
await page.click('#pauseMenu [data-pause="back"]'); await page.waitForTimeout(200);

// --- THE QUICK SUBS: anyone, tired or not -----------------------------------------------------------------------------------------
await K(`(()=>{ for(const p of players) if(p.team==='G'){ p.staminaCap=1; p.stamina=1; } QS.open=true; qsRender(qsSuggest()); return 1; })()`);
r = await page.innerText('#qsDrop');
ok(/any change, any time/.test(r) && /ALL SUBS/.test(r), 'the quick subs with nobody tired: "' + r.split('\n')[0] + '" -- and ALL SUBS (any man off)');
await K(`(()=>{ QS.open=false; qsRender(qsSuggest()); return 1; })()`);

// --- THE TIPS: the first time each comes up ------------------------------------------------------------------------------------
const quiet = `restartT=0; restartInfo=null; offsideT=0; offsidePass=null; scoredT=0; kickT=0; kickBy=null; kickTo=null; gkHold=null; breakT=0;`;
const tipAt = async upM => { await K(`(()=>{ ${quiet} const c=controlled&&controlled.team==='G'&&!controlled.isGK?controlled:players.find(q=>q.team==='G'&&q.role==='MID'); if(controlled!==c) switchTo(c);
    const atk=atkOf('G'); c.x=FW/2+atk*${upM}*MK; c.y=YC; c.vx=c.vy=0; c.state='normal'; for(const q of players) if(q!==c&&Math.hypot(q.x-c.x,q.y-c.y)<10*MK){ q.x=FW/2-atk*30*MK; q.y=40; }
    ball.x=c.x+atk*(c.r+ball.r+4); ball.y=c.y; ball.z=0; ball.vx=ball.vy=ball.vz=0; own(c,c.r+ball.r+4); TIP.gap=0; TIP.t=0; return 1; })()`);
  await page.waitForTimeout(250); return K(`({ on:document.getElementById('tipBar').classList.contains('on'), text:document.getElementById('tipBar').innerText, seen:PREFS.tipsSeen })`); };
const tip1 = await tipAt(-5);
ok(tip1.on && /PASS/.test(tip1.text) && /loft/.test(tip1.text) && tip1.seen === 'p', 'the ball yours for the first time: a word on passing over the pitch ("' + tip1.text + '")');
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

// --- AFTER THE GAME: one at a time -------------------------------------------------------------------------------------------------
await K(`(()=>{ finishCareerMatch(careerFix); return 1; })()`); await page.waitForTimeout(600);
const ups = () => K(`(()=>{ const L=['storyModal','matchReport','pressModal','moneyModal','pileModal'].filter(mgUpOn); return { L, seq:MGUI.seq&&MGUI.seq.slice(), tag:[...document.querySelectorAll('.seqTag')].filter(x=>x.offsetParent).map(x=>x.textContent.trim()) }; })()`);
const steps = [];
let u = await ups(); steps.push(u);
info('full time: up ' + JSON.stringify(u.L) + ', the run ' + JSON.stringify(u.seq) + ', ' + JSON.stringify(u.tag));
const n = u.seq ? u.seq.length : 0;
ok(u.L.length === 1 && u.L[0] === 'matchReport' && u.tag[0] === '· 1 OF ' + n && n >= 4, 'full time: THE RESULT, and nothing under it -- "1 OF ' + n + '" (the run: ' + (u.seq || []).join(', ') + ')');
await page.click('#mrNextBtn'); await page.waitForTimeout(200); u = await ups(); steps.push(u);
ok(u.L.length === 1 && u.L[0] === 'matchReport' && u.tag.includes('· 2 OF ' + n), 'NEXT: YOUR PLAYERS, "2 OF ' + n + '"');
await page.click('#mrContinueBtn'); await page.waitForTimeout(300); u = await ups(); steps.push(u);
const pressFirst = u.L[0] === 'pressModal';
ok(u.L.length === 1 && (pressFirst ? u.tag.includes('· 3 OF ' + n) : u.L[0] === 'moneyModal'), 'CONTINUE: ' + (pressFirst ? 'the press conference, alone, "3 OF ' + n + '"' : 'THE MONEY, alone'));
if(pressFirst){ await page.click('#pressModal [data-pr="skip"]'); await page.waitForTimeout(300); u = await ups(); steps.push(u); }
ok(u.L.length === 1 && u.L[0] === 'moneyModal' && u.tag.some(t => /OF/.test(t)), 'then THE MONEY, alone, "' + u.tag.join('') + '"');
await page.click('#moneyModal [data-mn="go"]'); await page.waitForTimeout(300); u = await ups(); steps.push(u);
ok(u.L.length <= 1 && (u.L.length === 0 || (u.L[0] === 'pileModal' && u.tag.includes('· ' + n + ' OF ' + n))), 'then ' + (u.L.length ? 'the papers, "' + n + ' OF ' + n + '"' : 'the club, nothing more up'));
ok(steps.every(s => s.L.length <= 1), 'never two at once: ' + steps.map(s => s.L.join('+') || 'none').join(' > '));

process.exitCode = rep.finish();
await browser.close();
