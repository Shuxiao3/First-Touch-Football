// When the season rolls over, the finished season has to be filed into the career history
// rather than silently overwritten.
import { open, createCareer, readSave } from './_harness.mjs';

const { browser, page, rep } = await open();
const { ok } = rep;

await createCareer(page);

// give season 1 a record, then roll the club into season 2
await page.evaluate(() => {
  for(const k of ['ft_save_slot1', 'ft_save_auto']){
    const d = JSON.parse(localStorage.getItem(k));
    d.mePro.season = { season: 1, apps: 11, goals: 6, assists: 4, og: 0, shots: 24, shotsOn: 11,
      passes: 213, passesOk: 178, tackles: 19, intercepts: 14, lost: 31, ratingSum: 78.9,
      w: 6, d: 3, l: 2 };
    d.mePro.career = { apps: 11, goals: 6, assists: 4, ratingSum: 78.9, seasons: [] };
    d.mePro.sp = 34;
    d.season = 2;                       // what endSeason does at the end of a campaign
    localStorage.setItem(k, JSON.stringify(d));
  }
});
await page.reload(); await page.waitForTimeout(700);
await page.click('#smItems [data-act="continue"]'); await page.waitForTimeout(600);

const M = (await readSave(page)).mePro;
ok(M.career.seasons.length === 1, 'the finished season was filed, got ' + M.career.seasons.length);
ok(M.career.seasons[0].season === 1, 'it is filed under season 1');
ok(M.career.seasons[0].apps === 11, 'its appearances survived the roll: ' + M.career.seasons[0].apps);
ok(M.season.season === 2 && M.season.apps === 0, 'season 2 starts clean');
ok(M.career.apps === 11, 'career totals are untouched by the roll');
ok(M.sp === 34, 'earned points survive the roll');

await page.click('#chCampus [data-bldg="house"]'); await page.waitForTimeout(400);
const ov = (await page.textContent('#bpBody')).replace(/\s+/g, '');
ok(/PREVIOUSSEASONS/.test(ov), 'the House shows a previous-seasons table');
ok(/SEASON2/.test(ov), 'the current block is season 2');

// rolling again must not duplicate or lose anything
await page.click('[data-hub="bldgback"]').catch(() => {});
await page.evaluate(() => {
  for(const k of ['ft_save_slot1', 'ft_save_auto']){
    const d = JSON.parse(localStorage.getItem(k));
    d.mePro.season.apps = 5; d.mePro.season.ratingSum = 33; d.season = 3;
    localStorage.setItem(k, JSON.stringify(d));
  }
});
await page.reload(); await page.waitForTimeout(700);
await page.click('#smItems [data-act="continue"]'); await page.waitForTimeout(600);
const M2 = (await readSave(page)).mePro;
ok(M2.career.seasons.length === 2, 'a second roll files a second season, got ' + M2.career.seasons.length);
ok(M2.career.seasons.map(s => s.season).join(',') === '1,2', 'both seasons in order');
ok(M2.season.season === 3, 'now in season 3');

await browser.close();
process.exit(rep.finish() ? 1 : 0);
