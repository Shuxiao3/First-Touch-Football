// Five career matches: every tracking hook gets a chance to fire, and the season and career
// totals have to add up across them.
import { open, createCareer, readSave, playMatch } from './_harness.mjs';

const N = 5;
const { browser, page, rep } = await open({ fastFrames: true });
const { ok, info } = rep;

await createCareer(page);
ok(true, 'career created');

for(let n = 1; n <= N; n++){
  const report = await playMatch(page);
  const score = (report.match(/(\d+)\s*[–-]\s*(\d+)/) || []).slice(1, 3).join('-');
  const M = (await readSave(page)).mePro, S = M.season;
  info('match ' + n + '  score ' + score + '  rating ' + M.recent[0].r
     + '  | g' + S.goals + ' a' + S.assists + ' sh' + S.shots + ' on' + S.shotsOn
     + ' pa' + S.passesOk + '/' + S.passes + ' tk' + S.tackles
     + ' int' + S.intercepts + ' lost' + S.lost + '  sp' + M.sp);
  await page.click('#mrContinueBtn');
  await page.waitForTimeout(400);
}

const M = (await readSave(page)).mePro, S = M.season, C = M.career;
ok(S.apps === N, N + ' appearances logged, got ' + S.apps);
ok(C.apps === N, 'career apps = ' + C.apps);
ok(M.recent.length === N, 'recent form holds ' + M.recent.length + ' matches');
ok(Math.abs(S.ratingSum - M.recent.reduce((a, r) => a + r.r, 0)) < 0.001,
   'the season rating sum equals the per-match ratings');
ok(M.sp >= N, 'points accumulated across matches: ' + M.sp);
ok(S.shots > 0, 'the shot hook fired (' + S.shots + ')');
ok(S.passes > 0, 'the pass hook fired (' + S.passes + ')');
info('goals ' + (S.goals > 0 ? 'YES' : 'no') + ' · assists ' + (S.assists > 0 ? 'YES' : 'no')
   + ' · on-target ' + (S.shotsOn > 0 ? 'YES' : 'no')
   + '  (scoring depends on where the ball goes; not asserted)');

await page.click('#chCampus [data-bldg="house"]');
await page.waitForTimeout(400);
const ov = (await page.textContent('#bpBody')).replace(/\s+/g, '');
ok(new RegExp('Apps' + N).test(ov), 'the House overview shows ' + N + ' apps');
ok(/RECENTFORM/.test(ov), 'the House shows recent form');
ok(!/Nothingloggedyet/.test(ov), 'the empty-record notice is gone');

await browser.close();
process.exit(rep.finish() ? 1 : 0);
