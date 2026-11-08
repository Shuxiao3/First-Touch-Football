// FOOTBALL CLASSIC, THE CAMPUS SAYS WHAT'S WAITING AND WHAT'S NEXT (v153): a path, not a loop -- the rail names what a
// locked building waits for ("needs clubhouse 2", not "2"), the clubhouse what the next one costs, with your money
// against it; a building that isn't up, or a level waiting for its clubhouse, shows THE WAY TO IT, each clubhouse on
// the way in order, ticked as done, the next lit with your money against its price; and the clubhouse says what each
// one UNLOCKS, ticked. What's waiting on you counted on the rail (deals ending and men asking, your nine's keeper and
// its hurt and tired, sponsors' offers, bids for your men and answers to yours), and what has a deadline inside two
// weeks said on the campus, four at most and the rest a tap away. A deal running out said at the season's start too. On
// a copy the test can reach.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  let INJ_OFF=false;', '  let INJ_OFF=true;');
patch('  // ===== END MANAGER CAREER', '  window.__K={ ev:s=>eval(s) };\n  // ===== END MANAGER CAREER');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-hub-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
const K = s => page.evaluate(s => window.__K.ev(s), s);
await page.click('#smItems [data-act="new"]'); await page.waitForTimeout(150);
await page.click('#newSlotList .slotBtn >> nth=0'); await page.waitForTimeout(100);
await page.waitForSelector('#mgrMaker.on', { timeout: 4000 });
await page.fill('#mgName', 'Sam Okafor'); await page.fill('#mgClubIn', 'Path Town');
await page.click('#mgGo'); await page.waitForSelector('#careerHub.show', { timeout: 8000 });
await K(`(()=>{ const d=CAREER.data; d.story={vet:2,kid:2,phone:2}; mgStoryShow(d); MGUI.noPile=true; pileHide(); d.budget=250000; d.offers=[]; d.bids=[]; d.spOff=[]; for(const p of d.roster){ delete p.cAsk; delete p.inj; p.cond=1; } mgSave(d); renderHub(); return 1; })()`);
const rail = () => page.evaluate(() => Object.fromEntries([...document.querySelectorAll('#chCampus .bldg')].map(b => [b.dataset.bldg, {
  sub: (b.querySelector('.bn') || {}).dataset ? b.querySelector('.bn').dataset.sub || '' : '', price: (b.querySelector('.bPrice') || {}).textContent || '', locked: b.classList.contains('locked'),
  badge: (b.querySelector('.bBadge') || {}).style && b.querySelector('.bBadge').style.display !== 'none' ? b.querySelector('.bBadge').textContent : '', title: (b.querySelector('.bBadge') || {}).title || '',
  bar: (b.querySelector('.bProg i') || {}).style ? b.querySelector('.bProg i').style.width : null }])));

// --- A PATH, NOT A LOOP --------------------------------------------------------------------------------------------------------------
let R = await rail();
info('the rail at clubhouse 1: ' + JSON.stringify(R));
ok(R.physio.locked && R.physio.sub === 'needs clubhouse 2' && R.scouting.sub === 'needs clubhouse 2' && R.academy.sub === 'needs clubhouse 3' && !/\d/.test(R.physio.price + R.academy.price)
   && R.club.sub === 'next $400K' && R.club.bar === '63%',
  'the rail: a locked building says what it waits for ("' + R.physio.sub + '", "' + R.academy.sub + '" -- it was a lock and "2", which read as a building at level 2); the clubhouse what the next costs ("' + R.club.sub + '"), your $250,000 a bar ' + R.club.bar + ' of the way');
let r = await K(`(()=>{ const d=CAREER.data, rows=h=>[...h.matchAll(/<div class="pathR (\\w+)"><b>([^<]*)<\\/b><span>([^<]*)<\\/span>(?:<em>([^<]*))?/g)].map(m=>[m[1],m[2],m[3],m[4]||'']); return { acad:rows(mgBuildBody(d,'academy')), phys:rows(mgBuildBody(d,'physio')) }; })()`);
info('the academy, the way to it: ' + JSON.stringify(r.acad));
ok(r.acad.map(x => x[0] + ':' + x[2]).join(' | ') === 'done:The shed · clubhouse 1 | next:The cabin · clubhouse 2 | later:The clubhouse · clubhouse 3 | later:The youth academy'
   && r.acad[1][3] === '$250,000 of $400,000' && r.acad[2][3] === '$2,000,000' && r.acad[3][3] === '$400,000' && r.acad.map(x => x[1]).join('') === '✓▸··',
  'a building waiting for its clubhouse: THE WAY TO IT, in order -- ✓ the shed, ▸ the cabin ($250,000 of $400,000), · the clubhouse ($2,000,000), · the academy ($400,000)');
r = await K(`(()=>{ const d=CAREER.data, b=d.budget; d.budget=1e7; bldUp(d,'club'); bldUp(d,'physio'); bldUp(d,'physio'); d.budget=b; renderHub();
  const h=lvlNext(d,'physio','BUILD IT UP'), rows=[...h.matchAll(/<div class="pathR (\\w+)"><b>([^<]*)<\\/b><span>([^<]*)<\\/span>/g)].map(m=>m[1]+':'+m[3]); return { rows, lv:lvOf(d,'physio') }; })()`);
ok(r.lv === 2 && r.rows.join(' | ') === 'done:The cabin · clubhouse 2 | next:The clubhouse · clubhouse 3 | later:Level 3', 'a level waiting for its clubhouse (the physio\'s 3rd at the cabin): ' + r.rows.join(', '));
R = await rail();
ok(!R.physio.locked && R.physio.sub === '' && R.scouting.price === '$200K' && R.academy.sub === 'needs clubhouse 3' && R.club.sub === 'next $2M', 'at the cabin: the scouts\' house its price ($200K), the academy still "needs clubhouse 3", the clubhouse "next $2M"');
r = await K(`(()=>{ const d=CAREER.data; curTab.club='Club'; openBuilding('club'); const h=mgClubTab(d); hideBldg(); return { next:(h.match(/Next, [^<]*/)||[''])[0], each:[...h.matchAll(/<b class="(\\w*)">([^<]*)<\\/b><span class="\\w*">([^<]*)<\\/span>/g)].map(m=>m[2]+' :: '+m[3]) }; })()`);
info('the clubhouse: ' + r.next + ' / ' + r.each.join(' / '));
ok(/^Next, the clubhouse\. It unlocks the youth academy/.test(r.next) && !/put up|build up/.test(r.next) && /^✓ THE SHED/.test(r.each[0]) && /^✓ THE CABIN/.test(r.each[1]) && /^▸ THE CLUBHOUSE :: the youth academy.* · \$2,000,000$/.test(r.each[2]) && /^· THE HALL/.test(r.each[3]),
  'the clubhouse says what the next UNLOCKS ("' + r.next.slice(0, 60) + '..."), each one ticked as it\'s done, the next lit with its price -- not "put up... build up the training pitch to 2", which read as what it needed');

// --- WHAT'S WAITING ON YOU -----------------------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, R=d.roster, S=d.season, c=mgAiClubs(d).find(k=>k.tier===d.tier), xi=mgStarters(d);
  mgMarketOpen(d); d.phase='league'; d.md=Math.max(d.md,1);
  for(const p of R) p.until=S+2; R[1].until=S; R[2].until=S; R[3].until=S; R[3].cGo=S;   // (two deals ending, and one let go)
  R[4].cAsk={wage:R[4].wage*2, wk:d.weeks||0};                                            // (a man asking)
  const hurt=xi.find(p=>p.role!=='GK'), tired=xi.filter(p=>p.role!=='GK'&&p!==hurt)[0]; hurt.inj={k:'knock',d:5}; tired.cond=0.6;
  d.offers=[{id:++d.offerSeq, pid:R[5].id, club:c.id, fee:100000, wk:(d.wkN||0)-1}, {id:++d.offerSeq, pid:R[6].id, club:c.id, fee:90000, wk:d.wkN||0}];   // (one from last week: its last)
  const t=c.players[0]; d.bids=[{id:++d.bidSeq, pid:t.id, club:c.id, fee:500000, st:'yes', wk:d.weeks||0}];
  d.spOff=[{id:1, k:'board', sp:{name:'Acme Pies', short:'ACME'}, sz:0, wk:1000, yrs:1, m:1, at:d.weeks||0}];
  mgSave(d); renderHub(); return { t:surname(t.name), c:c.name }; })()`);
R = await rail();
info('the rail with work waiting: ' + JSON.stringify({ club: [R.club.badge, R.club.title], train: [R.train.badge, R.train.title], stadium: [R.stadium.badge, R.stadium.title], market: [R.market.badge, R.market.title] }));
ok(R.club.badge === '3' && /2 deals end this season/.test(R.club.title) && /1 man wants a new deal/.test(R.club.title) && R.train.badge === '2' && /hurt/.test(R.train.title) && /tired/.test(R.train.title)
   && R.stadium.badge === '1' && R.market.badge === '3' && /2 bids for your men/.test(R.market.title) && /1 answer to your bids/.test(R.market.title),
  'what\'s waiting, counted on the rail: the clubhouse 3 (two deals ending -- not the man let go -- and one asking), training 2 (a man in your nine hurt, one tired), the stadium a sponsor\'s offer, transfers 3 (two bids, a club\'s yes)');
const warn = () => page.evaluate(() => { const w = document.getElementById('chWarn'); return { text: w.textContent, more: (w.querySelector('[data-hub="warnall"]') || {}).textContent || '' }; });
let W = await warn();
info('the campus\'s line: ' + JSON.stringify(W));
ok(/\+\d+ MORE/.test(W.more), 'more than four things to say: the first three, and +' + W.more.replace(/\D/g, '') + ' MORE');
await page.click('#chWarn [data-hub="warnall"]'); await page.waitForTimeout(100);
W = await warn();
info('all of it: ' + W.text);
ok(/2 bids for your players — one lapses this week · Transfers/.test(W.text) && W.text.includes(r.c + ' say yes for ' + r.t + ' — sign him before the window shuts') && /1 sponsor’s offer — two weeks to answer · Stadium/.test(W.text)
   && /wants a new deal · Clubhouse/.test(W.text) && /2 contracts end this season/.test(W.text) === false && W.more === 'LESS',
  'tapped, all of it, each with when: a bid lapsing this week, a club\'s yes to sign before the window shuts, a sponsor\'s offer with two weeks to answer, a man asking for a new deal; LESS takes it back');
r = await K(`(()=>{ const d=CAREER.data; d.md=MG_MD-8; renderHub(); const a=document.getElementById('chWarn').textContent; d.md=MG_HALF-1; renderHub(); const b=document.getElementById('chWarn').textContent; d.md=1; renderHub(); return { a, b, wl:(d.md=MG_HALF-1, mgWindowWeeks(d)) }; })()`);
ok(/2 contracts end this season — renew in the Clubhouse/.test(r.a) && /The transfer window shuts in two weeks/.test(r.b) && r.wl === 2,
  'and in its time: the deals that end with the season from its last eight weeks (it was six), the window shutting from two weeks out');
await page.click('#chWarn [data-hub="warnall"]').catch(() => {}); await page.waitForTimeout(80);

// --- A DEAL RUNNING OUT, SAID IN TIME --------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data; MGUI.noPile=true; d.phase='summer'; d.day=1; d.wkN=0; d.md=0; mgWeekStart(d); const first=d.pile.list.some(x=>x.k==='ending');
  mgWeekStart(d); const second=d.pile.list.some(x=>x.k==='ending'); return { first, second, wk:d.wkN }; })()`);
ok(r.first && !r.second, 'a deal into its last season: the season\'s first Monday\'s papers say so (then the winter break, the last four weeks and the playoffs, and the clubhouse\'s count all season)');

process.exitCode = rep.finish();
await browser.close();
