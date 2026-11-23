// FOOTBALL CLASSIC, MANAGER CAREER: a live career match. PLAY from the town, the match runs in your club's colours
// against the opposition's, and the report afterwards has the score, the rest of the round, the money and the fans;
// the round is recorded in every league.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
// (on a copy with injuries off: a man hurt in it would change who plays -- manager-injury.mjs is injuries' test)
const src = readFileSync(new URL('../classic.html', import.meta.url), 'utf8').replace('  let INJ_OFF=false;', '  let INJ_OFF=true;');
if(!/let INJ_OFF=true;/.test(src)) throw new Error('instrumenting: INJ_OFF not found');
const CLASSIC = 'file://' + join(mkdtempSync(join(tmpdir(), 'ftf-mm-')), 'classic.html'); writeFileSync(new URL(CLASSIC), src);

const { browser, page, rep } = await open({ fastFrames: true, url: CLASSIC });
const { ok, info } = rep;
await page.click('#smItems [data-act="new"]'); await page.waitForTimeout(150);
await page.click('#newSlotList .slotBtn >> nth=0');
await page.waitForSelector('#mgrMaker.on', { timeout: 4000 });
await page.fill('#mgName', 'Sam Okafor'); await page.fill('#mgClubIn', 'Fenmoor Athletic');
await page.evaluate(()=>{ for(let i=0;i<3;i++){ const g=document.getElementById('mgGo'), m=document.getElementById('mgrMaker'); if(!g||!m||!m.classList.contains('on')||g.disabled) break; g.click(); } })   /* (v242: NEXT, NEXT, START CAREER) */; await page.waitForSelector('#careerHub.show', { timeout: 6000 });
if(await page.isVisible('#storyModal.on')){ await page.click('#storyModal [data-st="answer"]'); await page.waitForTimeout(40); await page.click('#storyModal [data-st="phone"]'); await page.waitForTimeout(40); }   // (the phone rings on the first day of pre-season: answered)
await page.emulateMedia({ reducedMotion: 'reduce' });   // (the days just turn: NEXT DAY's sunset is manager-career.mjs's)
for(let i = 0; i < 8 && !/PLAY/.test(await page.textContent('#chBottom')); i++){ await page.click('#chBottom [data-mg="forward"]'); await page.waitForTimeout(50); }
info(await page.textContent('#chBottom'));

const d0 = await page.evaluate(() => JSON.parse(localStorage.getItem('ft_mgr_slot1')));
const you = d0.world.clubs[d0.clubId];
await page.click('#chBottom [data-mg="play"]'); await page.waitForTimeout(500);
ok(!(await page.isVisible('#careerHub')), 'the town hides for the match');
ok(await page.textContent('#tnG') === you.code, 'the scoreboard has your club: ' + await page.textContent('#tnG') + ' v ' + await page.textContent('#tnR'));

const t0 = Date.now();
await page.waitForSelector('#matchReport', { state: 'visible', timeout: 240000 });
info('the match took ' + Math.round((Date.now() - t0) / 1000) + 's');
const text = await page.innerText('#matchReport');
ok(/AFTER THE MATCH/.test(text) && /\d+ – \d+/.test(text) && /TABLE\s+\d+(st|nd|rd|th)/.test(text) && /NEXT/.test(text), 'the report, THE RESULT (v106; v248 as its template): the score between the two clubs, the goals, the table where it leaves you, NEXT');
await page.click('#mrNextBtn'); await page.waitForTimeout(120);
const text2 = await page.innerText('#matchReport');
const lit = await page.$$eval('#matchReport .mrStats tr.motm', ns => ns.map(n => n.textContent));
ok(/YOUR PLAYERS/.test(text2) && /RATING/.test(text2) && /PASSES/.test(text2) && /SHOTS/.test(text2) && /TACKLES/.test(text2) && lit.length === 1 && /★/.test(lit[0]), 'NEXT: YOUR PLAYERS -- each one\'s rating, goals, assists, passes, shots, tackles; your best starred, his row lit (v248)');

const d = await page.evaluate(() => JSON.parse(localStorage.getItem('ft_mgr_slot1')));
ok(d.md === 1 && [1, 2, 3, 4].every(t => d.lg[t].fx[0].every(m => m[2] != null)), 'matchday 1 recorded in every league');
const m = d.lg[1].fx[0].find(x => x[0] === d.clubId || x[1] === d.clubId);
info('your game: ' + JSON.stringify(m));
ok(d.roster.filter(p => p.apps === 1).length === 9, 'the nine who started have a game each');
ok(d.week === 1 && d.ledger.length === 1, 'the week was paid');
await page.click('#mrContinueBtn'); await page.waitForTimeout(250);
await page.evaluate(() => { const b = document.querySelector('#pressModal.on [data-pr="skip"]'); if(b) b.click(); }); await page.waitForTimeout(250);   // (the press first)
const allLines = () => page.evaluate(() => { for(let i = 0; i < 40; i++){ const g = document.querySelector('#moneyModal.on [data-mn="go"]'); if(!g || /CONTINUE/.test(g.textContent)) break; g.click(); } });   // (v242: a line a press)
let money = await page.innerText('#moneyModal').catch(() => '');
if(/STADIUM SUMMARY/.test(money)){   // (a home game -- a new career's first game is home or away as its fixtures fall: the ground first, v186)
  await allLines(); money = await page.innerText('#moneyModal').catch(() => '');
  ok(/[\d,]+ in · (full|\d+% full)/.test(money) && /taken at the gate/i.test(money), 'a home game: THE STADIUM SUMMARY first, who came and what they paid (v242; v243: beside the ground filling up)');
  await page.evaluate(() => { const b = document.querySelector('#moneyModal.on [data-mn="go"]'); if(b) b.click(); }); await page.waitForTimeout(250); }
await allLines(); money = await page.innerText('#moneyModal').catch(() => '');
ok(/FUND SUMMARY/.test(money) && /At the start of the week/.test(money) && /Wages/.test(money) && /This week/.test(money) && /Now in the bank/.test(money) && /fans/.test(money),
  'back at the club, after the press: THE FUND SUMMARY -- the week from its start, the wages, the week\'s net, now in the bank, and the fans (v242: THE MONEY till now)');
await page.evaluate(() => { const b = document.querySelector('#moneyModal.on [data-mn="go"]'); if(b) b.click(); }); await page.waitForTimeout(150);
ok(await page.isVisible('#careerHub') && /Matchday 2/.test(await page.getAttribute('#chPhase', 'data-long')), 'back on the campus for matchday 2');

process.exitCode = rep.finish();
await browser.close();
