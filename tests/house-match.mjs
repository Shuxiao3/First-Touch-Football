// Play one career match and check the whole pipeline: hooks -> rating -> points -> save ->
// the House -> spending -> refund.
import { open, createCareer, readSave, playMatch } from './_harness.mjs';

const { browser, page, rep } = await open({ fastFrames: true });
const { ok, info } = rep;

await createCareer(page);
ok((await readSave(page)).mePro.sp === 0, 'no points before kick-off');

const t0 = Date.now();
const report = await playMatch(page);
info('match played in ' + Math.round((Date.now() - t0) / 1000) + 's of wall clock');

ok(/ROWAN PIKE/.test(report), 'the match report carries your section');
ok(/Match rating/.test(report), 'report shows a match rating');
ok(/Skill points earned/.test(report), 'report shows the points earned');
const rating = (report.match(/Match rating([\d.]+)/) || [])[1];
const earned = (report.match(/Skill points earned\+(\d+)/) || [])[1];
ok(rating && +rating >= 1 && +rating <= 10, 'rating is in range: ' + rating);
ok(earned && +earned >= 1, 'at least the appearance point was paid: +' + earned);

const S = (await readSave(page)).mePro.season;
info('tracked — ' + JSON.stringify({ shots: S.shots, onTarget: S.shotsOn, passes: S.passes,
  completed: S.passesOk, tackles: S.tackles, intercepts: S.intercepts, lost: S.lost,
  goals: S.goals, assists: S.assists }));
// which hooks fire depends on where the ball goes, so assert involvement rather than a
// specific event -- house-season.mjs covers the individual counters over five matches.
ok(S.shots + S.passes + S.tackles + S.intercepts + S.lost > 0,
   'the engine hooks recorded involvement');

const M = (await readSave(page)).mePro;
ok(M.sp === +earned, 'the save matches the report: sp=' + M.sp);
ok(M.season.apps === 1, 'one appearance logged');
ok(Math.abs(M.season.ratingSum - +rating) < 0.001, 'season rating sum = ' + M.season.ratingSum);
ok(M.recent.length === 1 && M.recent[0].r === +rating, 'recent form recorded');
ok(M.career.apps === 1, 'career apps = 1');

// --- the House sees it, and spending reaches the pitch --------------------------------
await page.click('#mrContinueBtn'); await page.waitForTimeout(400);
await page.click('#chCampus [data-bldg="house"]'); await page.waitForTimeout(300);
await page.click('#bldgPanel [data-tab="Development"]'); await page.waitForTimeout(300);
const pts = (await page.textContent('#bpBody .mkMeta')).replace(/\s+/g, ' ').trim();
ok(new RegExp('PTS ' + (90 + +earned) + '(?!\\d)').test(pts),
   'the House budget grew by the earned points: ' + pts);

const speed = () => readSave(page).then(d => d.roster.find(p => p && p.me).stats.speed);
const before = await speed();
await page.click('#bpBody [data-node="r1a"]'); await page.waitForTimeout(150);
await page.click('#bpBody [data-node="r1a"]'); await page.waitForTimeout(250);
ok(await speed() === before + 0.5, 'spending a point raised speed from ' + before);
ok(Object.keys((await readSave(page)).mePro.owned).length === 1, 'the purchase is in the save');
await page.click('#bpBody [data-node="r1a"]'); await page.waitForTimeout(250);
ok(await speed() === before, 'refunding restores speed to ' + before);

await browser.close();
process.exit(rep.finish() ? 1 : 0);
