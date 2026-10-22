// Exhibition setup. EXHIBITION opens a match setup before kick-off: your club and the opponent (this
// season's Premier League), and the player you control. The match then plays in those clubs' kits and
// names with the player you picked; the choice is remembered, a club's tactics edits stay with that club
// (never over the saved custom squads), and leaving for a lab puts the GRN / RED sides back.
import { open } from './_harness.mjs';

const { browser, page, rep } = await open();
const ok = rep.ok, info = rep.info;
const text = (p, sel) => p.textContent(sel).then(t => (t || '').trim());
const side = (p, t) => p.evaluate(t => {
  const el = document.getElementById('exhSide' + t);
  return { name: el.querySelector('.exhName').textContent.trim(), meta: el.querySelector('.exhMeta').textContent.trim() };
}, t);
const players = p => p.$$eval('#exhPlayers .exhPl', bs => bs.map(b => ({ i: +b.dataset.i, role: b.querySelector('.r').textContent, name: b.querySelector('.n').textContent, sel: b.classList.contains('sel') })));

// ---- the setup screen ----
await page.click('#smItems [data-act="exhibition"]');
await page.waitForTimeout(250);
ok(await page.isVisible('#exhPanel'), 'EXHIBITION opens the match setup first');
ok(/PREMIER LEAGUE/.test(await text(page, '#exhLeague')), 'the clubs are the Premier League: ' + await text(page, '#exhLeague'));
let G = await side(page, 'G'), R = await side(page, 'R');
info(`defaults: ${G.name} (${G.meta}) v ${R.name} (${R.meta})`);
ok(G.name && R.name && G.name !== R.name, 'two different clubs to start with');
ok(/· 2-2-3 ·/.test(G.meta) && /· 3-1-3 ·/.test(R.meta), 'each club shows its own shape: ' + G.meta + ' / ' + R.meta);
let pl = await players(page);
ok(pl.length === 7 && pl.filter(x => x.sel).length === 1, 'seven outfield players to pick from, one picked');
ok(pl.find(x => x.sel).role === 'ATT', 'by default you are the striker');

await page.click('#exhSideG [data-exh="next"]'); await page.waitForTimeout(100);
const G2 = await side(page, 'G');
ok(G2.name !== G.name, 'the arrows change your club: ' + G.name + ' -> ' + G2.name);
ok(/· 2-4-1 ·/.test(G2.meta) && (await players(page)).find(x => x.sel).role === 'ATT', 'Aston Villa play 2-4-1, and you are still their striker: ' + G2.meta);
await page.click('#exhSideG [data-exh="prev"]'); await page.waitForTimeout(100);
ok((await side(page, 'G')).name === G.name, '...and back');

await page.click('#exhSideR .exhClub'); await page.waitForTimeout(150);
const chips = await page.$$eval('#exhGrid .exhChip', bs => bs.map(b => ({ id: b.dataset.id, off: b.disabled })));
ok(chips.length === 20, 'tapping the opponent lists all 20 clubs: ' + chips.length);
ok(chips.filter(c => c.off).length === 1 && chips.find(c => c.off).id === 'ARS', 'your own club is greyed out there');
await page.click('#exhGrid [data-id="LIV"]'); await page.waitForTimeout(150);
R = await side(page, 'R');
ok(R.name === 'Liverpool' && !(await page.isVisible('#exhGrid .exhChip')), 'picking one sets it and closes the list: ' + R.name);
ok(/CHANGE KIT/.test(R.meta), 'Liverpool change out of red against Arsenal: ' + R.meta);
await page.click('#exhPlayers [data-i="1"]'); await page.waitForTimeout(100);
pl = await players(page);
const mine = pl.find(x => x.sel);
ok(mine.i === 1 && mine.role === 'DEF', 'you can pick another player: ' + mine.name);

// ---- kick off: their names, your player ----
const customBefore = await page.evaluate(() => localStorage.getItem('ft7_squads'));
await page.click('#exhGo'); await page.waitForTimeout(800);
ok(!(await page.isVisible('#startMenu')), 'KICK OFF starts the match');
ok((await text(page, '#rScore')).replace(/\s+/g, ' ') === 'ARS 0 : 0 LIV', 'the score reads the club codes: ' + await text(page, '#rScore'));
await page.click('#menuBtn'); await page.click('#pauseMenu [data-pause="tactics"]'); await page.waitForTimeout(200);
const youTab = await page.$$eval('#menuBody .sqTab', bs => (bs.find(b => /▶/.test(b.textContent)) || {}).textContent || '');
ok(youTab.includes(mine.name.replace(/^#\d+ /, '')), 'you control the player you picked: ' + youTab);
ok(/ARS/.test(await text(page, '.mteam[data-mteam="G"]')) && /LIV/.test(await text(page, '.mteam[data-mteam="R"]')), 'the tactics menu names both clubs');
const formOf = t => page.evaluate(t => { document.querySelector('.tteam[data-tteam="' + t + '"]').click(); const a = document.querySelector('.form.active'); return a ? a.dataset.form : ''; }, t);
ok(await formOf('G') === '2-2-3' && await formOf('R') === '2-2-3', 'both line up in their own shapes (Arsenal and Liverpool: 2-2-3)');
await page.evaluate(() => document.querySelector('.form[data-form="3-3-1"]').click()); await page.waitForTimeout(100);   // (the opponent's, still picked)
ok(await formOf('R') === '3-3-1' && (JSON.parse(await page.evaluate(() => localStorage.getItem('ft_clubsq')) || '{}').LIV || {}).form === '3-3-1', 'a shape changed in the match is kept with the club');
await page.evaluate(() => document.querySelector('.tteam[data-tteam="G"]').click());
// a stat edit is kept with the club, not over the saved custom squads
await page.click('#editToggle'); await page.waitForTimeout(100);
await page.evaluate(() => { const s = document.querySelector('#menuBody input[type=range]'); s.value = 9.5; s.dispatchEvent(new Event('input', { bubbles: true })); });
const st = await page.evaluate(() => ({ custom: localStorage.getItem('ft7_squads'), club: JSON.parse(localStorage.getItem('ft_clubsq') || '{}') }));
ok(st.custom === customBefore, 'the saved custom squads are untouched by a club match');
ok(st.club.ARS && st.club.LIV, 'the edit is kept with the clubs instead');
await page.click('#menuClose'); await page.waitForTimeout(100);
if(await page.isVisible('#pauseMenu')) await page.keyboard.press('Escape');

// ---- remembered, and BACK / Escape leave it ----
await page.reload(); await page.waitForTimeout(800);
await page.click('#smItems [data-act="exhibition"]'); await page.waitForTimeout(200);
G = await side(page, 'G'); R = await side(page, 'R'); pl = await players(page);
ok(G.name === 'Arsenal' && R.name === 'Liverpool' && pl.find(x => x.sel).i === 1, 'the setup is remembered: ' + G.name + ' v ' + R.name);
ok(/· 3-3-1 ·/.test(R.meta), '...and Liverpool in the shape you gave them: ' + R.meta);
await page.keyboard.press('Escape'); await page.waitForTimeout(150);
ok(!(await page.isVisible('#exhPanel')) && await page.isVisible('#smItems'), 'Escape goes back to the start menu');
await page.click('#smItems [data-act="exhibition"]'); await page.waitForTimeout(150);
await page.click('#exhPanel [data-act="back"]'); await page.waitForTimeout(150);
ok(!(await page.isVisible('#exhPanel')), 'so does BACK');

// ---- a lab afterwards is GRN v RED again ----
await page.click('#smItems [data-act="exhibition"]'); await page.waitForTimeout(150);
await page.keyboard.press('Enter'); await page.waitForTimeout(500);
ok((await text(page, '#tnG')) === 'ARS', 'Enter kicks off from the setup');
await page.click('#menuBtn'); await page.click('#pauseMenu [data-pause="exit"]'); await page.waitForTimeout(300);
await page.click('#smItems [data-act="traplab"]'); await page.waitForTimeout(400);
ok((await text(page, '#tnG')) === 'GRN' && (await text(page, '#tnR')) === 'RED', 'a lab plays GRN v RED again');
await page.click('#labExitBtn'); await page.waitForTimeout(200);

// ---- phone: it fits and takes taps ----
{
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  const ph = await ctx.newPage();
  ph.on('pageerror', e => rep.errs.push('PAGEERROR (phone): ' + e.message));
  await ph.goto(page.url()); await ph.waitForTimeout(700);
  await ph.tap('#smItems [data-act="exhibition"]'); await ph.waitForTimeout(250);
  const go = await ph.evaluate(() => document.getElementById('exhGo').getBoundingClientRect().bottom);
  ok(go <= 390, 'phone: the whole setup fits the screen, KICK OFF included (' + Math.round(go) + ' px)');
  await ph.tap('#exhSideR [data-exh="next"]'); await ph.waitForTimeout(100);
  await ph.tap('#exhPlayers [data-i="3"]'); await ph.waitForTimeout(100);
  const sel = await ph.$eval('#exhPlayers .exhPl.sel', b => +b.dataset.i);
  ok(sel === 3, 'phone: a tap picks your player');
  await ph.tap('#exhGo'); await ph.waitForTimeout(600);
  ok(!(await ph.isVisible('#startMenu')) && /^[A-Z]{3}$/.test(await text(ph, '#tnR')), 'phone: KICK OFF starts it: ' + (await text(ph, '#rScore')).replace(/\s+/g, ' '));
  await ctx.close();
}

await browser.close();
process.exit(rep.finish() ? 1 : 0);
