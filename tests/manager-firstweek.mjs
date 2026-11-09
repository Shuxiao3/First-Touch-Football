// FOOTBALL CLASSIC, A NEW CAREER'S FIRST WEEK, EMPTY SCREENS AND THE MATCH'S BUTTONS (v157): the menu says NEW CAREER;
// a new career's campus has YOUR FIRST WEEK -- pick your nine, meet the squad, answer the phone, play your first match
// -- ticked as each is done, a tap to where it's done, ✕ to put it away, gone by itself when all four are; an empty
// record, a man with no games, a season with no form and a league with no goals each say why, never a bare dash; and
// every chip and button in a match says what it is, the menu's top the score, the minute and your subs left. On a
// copy the test can reach.
import { open, startExhibition } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  let INJ_OFF=false;', '  let INJ_OFF=true;');
patch('  // ===== END MANAGER CAREER', '  window.__K={ ev:s=>eval(s) };\n  // ===== END MANAGER CAREER');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-fw-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
const K = s => page.evaluate(s => window.__K.ev(s), s);
const menuText = await page.textContent('#smItems [data-act="new"]');
ok(/NEW CAREER/.test(menuText) && !/NEW GAME/.test(menuText), 'the menu names the mode: "' + menuText.replace('▶', '').trim() + '"');
await page.click('#smItems [data-act="new"]'); await page.waitForTimeout(150);
await page.click('#newSlotList .slotBtn >> nth=0'); await page.waitForTimeout(100);
await page.waitForSelector('#mgrMaker.on', { timeout: 4000 });
await page.fill('#mgName', 'Sam Okafor'); await page.fill('#mgClubIn', 'First Town');
await page.click('#mgGo'); await page.waitForSelector('#careerHub.show', { timeout: 8000 });
await K(`(()=>{ const d=CAREER.data; d.story={vet:2,kid:2,phone:2}; mgStoryShow(d); MGUI.noPile=true; pileHide(); renderHub(); return 1; })()`); await page.waitForTimeout(150);

// --- YOUR FIRST WEEK ---------------------------------------------------------------------------------------------------------
const fw = () => page.evaluate(() => { const el = document.getElementById('cpFirst'); if(!el || el.style.display === 'none') return null;
  return [...el.querySelectorAll('.fwRow')].map(r => (r.classList.contains('done') ? '✓' : '·') + r.textContent.replace(/^[✓·]/, '')); });
let r0 = await fw();
info('the campus, week one: ' + JSON.stringify(r0));
ok(r0 && r0.length === 4 && r0.join('|') === '·Pick your nine|·Meet the squad|·Answer the phone|·Play your first match', 'a new career\'s campus: YOUR FIRST WEEK, four steps, none done');
await page.click('#cpFirst .fwRow >> nth=0'); await page.waitForSelector('#bldgPanel.show'); await page.waitForTimeout(120);
const t1 = await page.textContent('#bpTitle');
await K(`(()=>{ hideBldg(); renderHub(); return 1; })()`); await page.waitForTimeout(100);
await page.click('#cpFirst .fwRow >> nth=1'); await page.waitForSelector('#bldgPanel.show'); await page.waitForTimeout(120);
const t2 = await page.textContent('#bpTitle'), tab2 = await page.textContent('#bpTabs .bpTab.on');
await K(`(()=>{ hideBldg(); mgMarketOpen(CAREER.data); renderHub(); return 1; })()`); await page.waitForTimeout(100);
const r1 = await fw();
ok(/TRAINING/.test(t1) && /CLUBHOUSE/.test(t2) && tab2 === 'Squad' && r1 && r1.join('|') === '✓Pick your nine|✓Meet the squad|✓Answer the phone|·Play your first match',
  'each a tap to where it\'s done (Training; the clubhouse\'s Squad), ticked as it is -- and the phone, answered');
r0 = await K(`(()=>{ const d=CAREER.data; let i=0; while(i<20&&!mgForm(d).length){ if(mgNextGame(d)&&d.wday!=='mon') mgSim(d); else mgForward(d); i++; } MGUI.noPile=true; pileHide(); for(const id of ['pressModal','moneyModal']){ const m=document.getElementById(id); if(m) m.classList.remove('on'); } document.getElementById('matchReport').style.display='none'; MGUI.seq=null; renderHub(); return { off:!!d.fw.off, games:mgForm(d).length }; })()`);
const r2 = await fw();
ok(r0.off && r0.games >= 1 && r2 === null, 'all four done: it goes by itself (' + r0.games + ' game played)');

// --- AN EMPTY SCREEN SAYS WHY --------------------------------------------------------------------------------------------------
let r = await K(`(()=>{ const d=CAREER.data, keep=d.rec, p=d.roster.find(q=>!q.rn), strip=h=>h.replace(/<[^>]+>/g,' ').replace(/\\s+/g,' ');
  d.rec={}; const ch=mgClubTab(d), recs=[...ch.matchAll(/<div class="clRec none" data-xpl="([^"]*)"><i class="clLbl">([^<]*)<\\/i><span><b>([^<]*)<\\/b>/g)].map(m=>[m[2],m[3],m[1]]); d.rec=keep; const p0=JSON.parse(JSON.stringify(d.roster[0])); delete p0.rn; delete p0.fm;   // (v172: a card a record, "—" till it's set, why a tap away)
  const k=JSON.stringify(d.lg[d.tier].fx), f=d.lg[d.tier]; const saved=JSON.parse(JSON.stringify(f.fx)); for(const day of f.fx) for(const m of day){ m[2]=null; m[3]=null; }
  const fxh=mgFixturesTab(d), fx=strip(fxh).slice(0,120)+((fxh.match(/data-xpl="(Form: [^"]*)"/)||[])[1]||'')+' dots '+((fxh.match(/<span class="clDots">(.*?)<\\/span>/)||['',''])[1].match(/<i><\\/i>/g)||[]).length; f.fx=saved;   // (v177: the form as dots, what they are a tap away)
  const sc=d.div[d.tier].flatMap(id=>mgPlayersOf(d,id)), g=sc.map(q=>q.goals); for(const q of sc) q.goals=0; const top=strip(mgScorersTab(d)); sc.forEach((q,i)=>q.goals=g[i]);
  return { recs, fx, top }; })()`);
info('empty: ' + JSON.stringify(r));
const why = k => (r.recs.find(x => x[0] === k) || [])[2] || '';
ok(r.recs.length === 7 && r.recs.every(x => x[1] === '—') && why('MOST GAMES') === 'Set after your first game.' && why('BIGGEST WIN') === 'Set with your first win.' && why('RECORD SIGNING') === 'Set with your first fee paid.'
   && /Form: none yet, no games\./.test(r.fx) && / dots 5$/.test(r.fx) && /start with the league’s first matchday/.test(r.top),
  'an empty screen says why: the club\'s records, "—" on each card till it\'s set and why a tap on it (v172: "Set after your first game.", "Set with your first win.", "Set with your first fee paid."), a season\'s form (five empty dots, "none yet, no games" a tap away -- v177), the top scorers');
r = await K(`(()=>{ const d=CAREER.data, p=d.roster.find(q=>q.role!=='GK'), keep=[p.rn,p.rs,p.fm]; delete p.rn; delete p.fm; mgSide='rate'; curTab.club='Squad'; openBuilding('club'); MGUI.sel=p.id; paintBuilding();
  const t=[...document.querySelectorAll('#bpBody .mgCard .mgFact')].map(e=>e.textContent).find(x=>/RATING/.test(x)); hideBldg(); [p.rn,p.rs,p.fm]=keep; return t; })()`);
ok(/RATING · FORM\s*none yet$/.test(r), 'a man with no games: "' + r + '"');

// --- EVERY MATCH BUTTON SAYS WHAT IT IS ---------------------------------------------------------------------------------------
await K(`(()=>{ hubToMenu(); return 1; })()`); await page.waitForTimeout(200);
await startExhibition(page); await page.waitForTimeout(1500);
r = await page.evaluate(() => { const has = id => { const e = document.getElementById(id); return !!e && !!(e.dataset.xpl || e.title || e.getAttribute('aria-label') || e.textContent.trim().length > 2); };
  return { score: document.getElementById('rScore').dataset.xpl, clock: document.getElementById('rClockChip').dataset.xpl, ui: ['rScore', 'rClockChip', 'rDir', 'rPlayer'].every(id => document.getElementById(id).classList.contains('xplUI')),
    menu: document.getElementById('menuBtn').title, ctl: document.getElementById('ctlBtn').title, subs: document.getElementById('qsBtn').textContent.trim(), all: ['rScore', 'rDir', 'rClockChip', 'qsBtn', 'rPlayer', 'menuBtn', 'ctlBtn'].every(has) }; });
await page.evaluate(() => document.getElementById('rClockChip').click()); await page.waitForTimeout(60);
const tip = await page.evaluate(() => { const t = document.getElementById('xplTip'); return t.classList.contains('on') ? t.textContent : ''; });
ok(r.all && r.ui && r.score === 'score' && r.clock === 'clock' && /Pause/.test(r.menu) && /How to play/.test(r.ctl) && /^SUBS/.test(r.subs) && /THE CLOCK/.test(tip),
  'in a match every chip and button says what it is: the score and the clock a tap ("' + tip.slice(0, 50) + '..."), the menu and the controls their titles, SUBS its word');
await page.evaluate(() => document.getElementById('menuBtn').click()); await page.waitForTimeout(150);
const st = await page.textContent('#pauseState');
ok(/^\S+ \d+–\d+ \S+ · \d+:\d\d · \d subs? left$/.test(st), 'the menu\'s top: the match at a glance -- "' + st + '"');

process.exitCode = rep.finish();
await browser.close();
