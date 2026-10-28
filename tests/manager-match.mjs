// FOOTBALL CLASSIC, MANAGER CAREER: a live career match. PLAY from the town, the match runs in your club's colours
// against the opposition's, and the report afterwards has the score, the rest of the round, the money and the fans;
// the round is recorded in every league.
import { open } from './_harness.mjs';
const CLASSIC = 'file://' + new URL('../classic.html', import.meta.url).pathname;

const { browser, page, rep } = await open({ fastFrames: true, url: CLASSIC });
const { ok, info } = rep;
await page.click('#smItems [data-act="new"]'); await page.waitForTimeout(150);
await page.click('#newSlotList .slotBtn >> nth=0');
await page.waitForSelector('#mgrMaker.on', { timeout: 4000 });
await page.fill('#mgName', 'Sam Okafor'); await page.fill('#mgClubIn', 'Fenmoor Athletic');
await page.click('#mgGo'); await page.waitForSelector('#careerHub.show', { timeout: 6000 });
for(let i = 0; i < 6 && !/PLAY/.test(await page.textContent('#chBottom')); i++){ await page.click('#chBottom [data-mg="nextday"]'); await page.waitForTimeout(50); }
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
ok(/MATCHDAY 1/.test(text) && /THE REST OF THE ROUND/.test(text) && /League position/.test(text), 'the report: the round and the table');
ok(/FINANCES/.test(text) && /Net this week/.test(text) && /FANS/.test(text), 'the report: the money and the fans');

const d = await page.evaluate(() => JSON.parse(localStorage.getItem('ft_mgr_slot1')));
ok(d.md === 1 && [1, 2, 3, 4].every(t => d.lg[t].fx[0].every(m => m[2] != null)), 'matchday 1 recorded in every league');
const m = d.lg[1].fx[0].find(x => x[0] === d.clubId || x[1] === d.clubId);
info('your game: ' + JSON.stringify(m));
ok(d.roster.filter(p => p.apps === 1).length === 8, 'the eight who started have a game each');
ok(d.week === 1 && d.ledger.length === 1, 'the week was paid');
await page.click('#mrContinueBtn'); await page.waitForTimeout(150);
ok(await page.isVisible('#careerHub') && /Matchday 2/.test(await page.getAttribute('#chPhase', 'data-long')), 'back on the campus for matchday 2');

process.exitCode = rep.finish();
await browser.close();
