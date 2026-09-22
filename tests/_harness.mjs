// Shared harness for the browser tests. Requires playwright on NODE_PATH or linked into
// tests/node_modules — see tests/README.md.
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

export const GAME = 'file://' + resolve(dirname(fileURLToPath(import.meta.url)), '..', 'index.html');

export function reporter(){
  let fails = 0;
  const errs = [];
  return {
    errs,
    ok(cond, msg){ if(!cond) fails++; console.log((cond ? '  PASS  ' : '  FAIL  ') + msg); },
    info(msg){ console.log('  ....  ' + msg); },
    finish(){
      // file:// pages log a cert error for the Google Fonts link; it is not a game fault
      const real = errs.filter(e => !/ERR_CERT_AUTHORITY_INVALID/.test(e));
      if(real.length) console.log('\nERRORS:\n' + real.join('\n'));
      console.log(fails ? ('\n' + fails + ' FAILED') : '\nall passed');
      return fails;
    }
  };
}

export async function open({ fastFrames = false } = {}){
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1100, height: 1000 } });
  const rep = reporter();
  page.on('pageerror', e => rep.errs.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if(m.type() === 'error') rep.errs.push('CONSOLE: ' + m.text()); });
  if(fastFrames){
    // The sim clamps dt at 33ms, so a match cannot be fast-forwarded by inflating
    // timestamps -- it has to be stepped. Pump rAF off a timer instead of the vsync
    // clock and a 6-minute match plays out in about a minute of wall time.
    await page.addInitScript(() => { let vt = 0;
      window.requestAnimationFrame = cb => { setTimeout(() => { vt += 33; cb(vt); }, 0); return 0; }; });
  }
  await page.goto(GAME);
  await page.waitForTimeout(700);
  return { browser, page, rep };
}

// Walk the real new-game flow: create-a-pro, pick a legal squad, land in the career hub.
export async function createCareer(page, { name = 'Rowan Pike', buy = {} } = {}){
  await page.click('#smItems [data-act="new"]');
  await page.waitForTimeout(250);
  await page.click('#newSlotList .slotBtn >> nth=1');          // SLOT 1
  await page.waitForSelector('#charMaker.on', { timeout: 5000 });
  await page.fill('#mkName', name);
  for(const [tree, ids] of Object.entries(buy)){
    await page.click(`#charMaker [data-tab="${tree}"]`);
    await page.waitForTimeout(70);
    for(const id of ids){                                       // tap to select, tap again to buy
      const sel = `#charMaker [data-node="${id}"]`;
      await page.click(sel); await page.waitForTimeout(40);
      await page.click(sel); await page.waitForTimeout(40);
    }
  }
  await page.click('#charMaker [data-mk="next"]');
  await page.waitForTimeout(250);
  const need = [1, 4, 5, 4];                                    // GK / DEF / MID / ATT = 14
  for(let g = 0; g < 4; g++){
    for(let i = 0; i < need[g]; i++){                           // the pool re-renders per pick
      await page.locator('#charMaker .mkPool').nth(g).locator('[data-pick]').nth(i).click();
      await page.waitForTimeout(25);
    }
  }
  await page.click('#charMaker [data-mk="create"]');
  await page.waitForSelector('#careerHub.show', { timeout: 5000 });
}

export const readSave = page =>
  page.evaluate(() => JSON.parse(localStorage.getItem('ft_save_slot1')));

// Play the next fixture through to the match report, driving real input the whole way so
// the tracking hooks actually fire. Standing still exercises none of them.
export async function playMatch(page){
  await page.click('#careerHub [data-hub="play"]');
  await page.waitForTimeout(400);
  let over = false;
  const input = (async () => {
    let i = 0;
    while(!over){
      i++;
      const fwd = (i % 7 < 5) ? 'd' : 'w';
      await page.keyboard.down(fwd).catch(() => {});   await page.waitForTimeout(240);
      await page.keyboard.press('j').catch(() => {});  await page.waitForTimeout(130);
      await page.keyboard.down('k').catch(() => {});   await page.waitForTimeout(240);
      await page.keyboard.up('k').catch(() => {});
      await page.keyboard.up(fwd).catch(() => {});
      if(i % 6 === 0) await page.keyboard.press('Space').catch(() => {});
    }
    for(const k of ['d', 'w', 's', 'a', 'k']) await page.keyboard.up(k).catch(() => {});
  })();
  await page.waitForFunction(
    () => document.getElementById('matchReport').style.display === 'block',
    null, { timeout: 300000, polling: 500 });
  over = true;
  await input.catch(() => {});
  return page.textContent('#matchReport');
}
