// YOUR HOUSE: creation carries into the House, all three tabs render, the save is shaped right.
import { open, createCareer, readSave } from './_harness.mjs';

const { browser, page, rep } = await open();
const { ok } = rep;

await createCareer(page, { buy: { pace: ['r1a', 'r1b'], shooting: ['r1a', 'r1b'] } });
ok(true, 'career created through the real new-game flow');

// --- the House --------------------------------------------------------------------
await page.click('#chCampus [data-bldg="house"]');
await page.waitForTimeout(300);
ok(await page.isVisible('#bldgPanel'), 'house panel opened');
ok((await page.textContent('#bpTitle')).includes('YOUR HOUSE'), 'house title');
const tabs = await page.$$eval('#bldgPanel .bpTab', ns => ns.map(n => n.textContent));
ok(String(tabs) === 'Overview,Development,Appearance', 'three tabs: ' + tabs);

const ov = await page.textContent('#bpBody');
ok(ov.includes('Rowan Pike'), 'overview shows your name');
ok(/SEASON 1/.test(ov), 'overview shows the season block');
ok(/Nothing logged yet/.test(ov), 'overview explains the empty record');
ok(/^\d+$/.test((await page.textContent('#bpBody .hsOvr')).trim()), 'overview shows an OVR');
ok((await page.$$('#bpBody .hsPort svg')).length === 1, 'portrait rendered');

// --- development ------------------------------------------------------------------
await page.click('#bldgPanel [data-tab="Development"]');
await page.waitForTimeout(250);
const dev = await page.textContent('#bpBody');
ok(/PTS/.test(dev) && /ATTRIBUTES/.test(dev), 'development tab rendered');
ok((await page.$$('#bpBody [data-node]')).length === 14, 'pace tree drew its 14 nodes');
ok(await page.$$eval('#bpBody polygon[fill="#2f7a22"]', n => n.length) === 2,
   'the two pace nodes bought in creation show as owned');
const pts = (await page.textContent('#bpBody .mkMeta')).replace(/\s+/g, ' ').trim();
ok(/PTS 86(?!\d)/.test(pts), 'unspent creation points carry into the House: ' + pts);
ok((await page.$$('#bpBody .hsAt')).length === 20, 'all 20 outfield attributes listed');

const ids = await page.$$eval('#bpBody [data-node]', ns => ns.map(n => n.dataset.node));
const deep = ids[ids.length - 1];
await page.click(`#bpBody [data-node="${deep}"]`); await page.waitForTimeout(150);
ok(/Unlock a connected node|Not enough points/
   .test((await page.textContent('#bpBody .mkDetail')).replace(/\s+/g, ' ')),
   'a node with no owned parent refuses and says why');
await page.click(`#bpBody [data-node="${deep}"]`); await page.waitForTimeout(150);
ok(await page.$$eval('#bpBody polygon[fill="#2f7a22"]', n => n.length) === 2,
   'tapping it again buys nothing');

// --- appearance -------------------------------------------------------------------
await page.click('#bldgPanel [data-tab="Appearance"]');
await page.waitForTimeout(250);
ok((await page.$$('#bpBody .hsSw')).length === 19, '19 swatches (6 kit + 6 boot + 7 hair)');
await page.click('#bpBody [data-look="hair"][data-li="3"]'); await page.waitForTimeout(200);
ok(/\bon\b/.test(await page.getAttribute('#bpBody [data-look="hair"][data-li="3"]', 'class')),
   'the selected swatch is marked');
await page.click('#bpBody [data-look="kit"][data-li="2"]'); await page.waitForTimeout(200);
const look = (await readSave(page)).mePro.look;
ok(look.hair === 3 && look.kit === 2, 'appearance persisted: ' + JSON.stringify(look));

// --- the saved record ---------------------------------------------------------------
const d = await readSave(page), M = d.mePro;
ok(M.budget0 === 90, 'budget0 = the 90-point creation budget');
ok(M.sp === 0, 'earned points start at 0');
ok(Object.keys(M.owned).length === 4, '4 owned nodes stored, got ' + Object.keys(M.owned).length);
ok(M.base && M.base.speed === 4, 'the pre-tree base stats are stored');
ok(M.season && M.season.season === 1, 'season block present');
const me = d.roster.find(p => p && p.me);
ok(me && me.name === 'Rowan Pike', 'the roster carries your pro');
ok(me.stats.speed === 4.5 && me.stats.acceleration === 4.5,
   'tree grants reached the roster stats: spd=' + me.stats.speed + ' acl=' + me.stats.acceleration);

await browser.close();
process.exit(rep.finish() ? 1 : 0);
