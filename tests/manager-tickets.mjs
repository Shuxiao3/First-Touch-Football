// FOOTBALL CLASSIC, TICKETS (v108). The going rate for a seat is $5 in League 2 (v110; $7 in v108, $3 before), and $10,
// $14 and $20 up the leagues.
// The field and bleachers: one price for the lot. From the big bleachers on, each stand has its own -- the main stand a
// fifth over the going rate, the South at it, the ends under it -- and seats sold at a premium come with the ground: VIP
// seats (60 with the big bleachers, up to 600), executive boxes (with four stands) and the members' club (the grand
// stadium). The dearer a stand against its rate, the emptier; the premium seats sell to the money in the town, more the
// higher the league. A price left alone follows the going rate up the leagues; a save's old default price ($3, $5, ...)
// follows the new one, once. On the stadium's Money tab, each section's − and +, what it sells and takes, and back to the
// going rate. On a copy of the game that lets the test reach it.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  // ===== END MANAGER CAREER', '  window.__K={ ev:s=>eval(s) };\n  // ===== END MANAGER CAREER');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-tickets-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy, papers: true });
const { ok, info } = rep;
const K = s => page.evaluate(s => window.__K.ev(s), s);
let r;
await page.emulateMedia({ reducedMotion: 'reduce' });
await page.click('#smItems [data-act="new"]'); await page.waitForTimeout(150);
await page.click('#newSlotList .slotBtn >> nth=0'); await page.waitForTimeout(100);
await page.waitForSelector('#mgrMaker.on', { timeout: 4000 });
await page.fill('#mgName', 'Kit Varga'); await page.fill('#mgClubIn', 'Turnstile Town');
await page.click('#mgGo'); await page.waitForSelector('#careerHub.show', { timeout: 6000 });
await K(`(()=>{ const d=CAREER.data; d.story={vet:2,kid:2,phone:2}; mgStoryShow(d); pileHide(); return 1; })()`);

// --- THE GOING RATE: $5 in League 2, one price for the bleachers --------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, f=computeFinance(d), s=f.seats; d.loyalty=1000; const f1=computeFinance(d);
  return { rates:[1,2,3,4].map(t=>FIN_TIER[t].price), own:d.ticketPrice, n:s.length, id:s[0].id, price:s[0].price, cap:s[0].cap, att:f1.attendance, gate:f1.ticketGate }; })()`);
ok(r.rates.join() === '25,30,40,60' && r.own === null && r.n === 1 && r.id === 'B' && r.price === 25 && r.cap === 1800 && r.gate === r.att * 25,
  'the going rate (v149: the real game\'s money -- it was $5, $10, $14 and $20): $25 a seat in League 2 (' + r.rates.join(', ') + ' up the leagues); a new career\'s one price for the bleachers is it ($' + r.price + ', ' + r.att + ' of 1,800 at 1,000 fans)');
// the dearer, the emptier -- and the fans feel it
r = await K(`(()=>{ const d=CAREER.data, a=p=>{ d.ticketPrice=p; const f=computeFinance(d); return [f.attendance, f.ticketGate, +seatPriceRatio(d).toFixed(2)]; }, o={ cheap:a(20), rate:a(25), dear:a(35), steep:a(50) }; d.ticketPrice=null; return o; })()`);
info('the bleachers at $20 / $25 / $35 / $50: ' + JSON.stringify(r));
ok(r.cheap[0] >= r.rate[0] && r.rate[0] > r.dear[0] && r.dear[0] > r.steep[0] && r.rate[2] === 1 && r.dear[2] > 1 && r.cheap[2] < 1,
  'dearer, emptier: ' + r.cheap[0] + ' at $20, ' + r.rate[0] + ' at $25, ' + r.dear[0] + ' at $35, ' + r.steep[0] + ' at $50; against the going rate the fans see it (' + r.dear[2] + ' at $35)');

// --- EACH LEVEL'S SEATS: the stands priced on their own from the big bleachers, and the premium seats ---------------------
r = await K(`(()=>{ const d=CAREER.data, S=stadOf(d), out={}; d.loyalty=1400;
  for(const lv of [1,2,3,4,5]){ S.lvl=lv; const f=computeFinance(d); out[lv]={ ids:f.seats.map(x=>x.id).join(), caps:f.seats.reduce((a,x)=>a+x.cap,0), cap:f.capacity,
    prices:f.seats.map(x=>x.id+'$'+x.price).join(' '), prem:f.seats.filter(x=>x.prem).map(x=>x.id+':'+x.cap+'/'+x.att).join(' ') }; }
  S.lvl=1; return out; })()`);
info('the seats, level by level: ' + JSON.stringify(r));
ok(r[1].ids === 'B' && r[2].ids === 'N,S,vip' && r[3].ids === 'N,S,E,W,vip' && r[4].ids === 'N,S,E,W,vip,box' && r[5].ids === 'N,S,E,W,vip,box,club' && [1,2,3,4,5].every(l => r[l].caps === r[l].cap),
  'one price for the bleachers; with the big bleachers the North and South each their own and VIP seats; the ends with covered stands; executive boxes with four stands; the members\' club in the grand stadium -- every seat counted once');
const fe = await K(`(()=>{ const d=CAREER.data; return [seatFair(d,'E',3), seatFair(d,'E',4)]; })()`);
ok(/N\$30 S\$25 vip\$100/.test(r[2].prices) && /E\$19 W\$19/.test(r[3].prices) && /E\$20 W\$20/.test(r[4].prices) && /box\$350/.test(r[4].prices) && /club\$175/.test(r[5].prices) && fe[0] === 18.75 && fe[1] === 20,
  'their going rates in League 2: the main stand $30, the South $25, VIP seats $100; open terraces $19, seated ends $20 (' + fe.join(' and ') + ' before rounding); a box\'s seat $350, the members\' club $175');
// per stand: dearer in the North, only the North thins
r = await K(`(()=>{ const d=CAREER.data, S=stadOf(d); S.lvl=3; d.loyalty=6000; const g=()=>Object.fromEntries(computeFinance(d).seats.map(x=>[x.id,x.att]));
  const a=g(); d.seats={N:80}; const b=g(); d.seats={}; S.lvl=1; return { a, b }; })()`);
ok(r.b.N < r.a.N && r.b.S === r.a.S && r.b.E === r.a.E, 'the North at $80: the North thins (' + r.a.N + ' to ' + r.b.N + '), the South and the ends just as they were');
// premium seats: the money in the town -- more the higher the league
r = await K(`(()=>{ const d=CAREER.data, S=stadOf(d); S.lvl=4; const v=(t,L)=>{ d.tier=t; d.loyalty=L; const x=computeFinance(d).seats.find(x=>x.id==='vip'); return x.att/x.cap; };
  const o={ l2:+v(1,1400).toFixed(2), pl:+v(4,30000).toFixed(2) }; d.tier=1; d.loyalty=1000; S.lvl=1; return o; })()`);
ok(r.l2 < 0.5 && r.pl > 0.9, 'VIP seats sell to the money in the town: ' + Math.round(r.l2 * 100) + '% of them in League 2, ' + Math.round(r.pl * 100) + '% in the Premium League');

// --- UP A LEAGUE: an untouched price follows the going rate; yours stays yours --------------------------------------------
r = await K(`(()=>{ const d=CAREER.data; d.ticketPrice=null; d.tier=2; const a=computeFinance(d).seats[0].price; d.ticketPrice=40; const b=computeFinance(d).seats[0].price; d.tier=1; d.ticketPrice=null; return { a, b }; })()`);
ok(r.a === 30 && r.b === 40, 'up to League 1: a price left alone goes up with the going rate ($' + r.a + '); one you set stays ($' + r.b + ')');
// --- A SAVE FROM BEFORE: the old default price follows the new going rate, once ------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, old=JSON.parse(JSON.stringify(d)); delete old.tk108; old.ticketPrice=3; mgMigrate(old); const a=old.ticketPrice;
  const set=JSON.parse(JSON.stringify(d)); delete set.tk108; set.ticketPrice=9; mgMigrate(set); const b=set.ticketPrice;
  old.ticketPrice=5; mgMigrate(old); const c=old.ticketPrice; return { a, b, c }; })()`);
ok(r.a === null && r.b === 9 && r.c === 5, 'a save from before: left at the old $3, it follows the new going rate; one set to $9 stays; and after that a $5 you set is yours (the change made once)');

// --- ON THE STADIUM'S MONEY TAB ------------------------------------------------------------------------------------------
await K(`(()=>{ const d=CAREER.data; stadOf(d).lvl=2; d.loyalty=1400; d.seats={}; d.ticketPrice=null; curTab.stadium='Money'; openBuilding('stadium'); paintBuilding(); return 1; })()`);
await page.waitForTimeout(150);
const rows = await page.$$eval('#bpBody .tkRow', ns => ns.map(n => ({ id: n.dataset.seat, t: n.textContent })));
await page.click('#bpBody .tkRow[data-seat="N"] [data-stad="seat+"]'); await page.waitForTimeout(80);
await page.click('#bpBody .tkRow[data-seat="N"] [data-stad="seat+"]'); await page.waitForTimeout(80);
await page.click('#bpBody .tkRow[data-seat="vip"] [data-stad="seat-"]'); await page.waitForTimeout(80);
r = await K(`(()=>{ const d=CAREER.data, f=computeFinance(d); return { seats:JSON.stringify(d.seats), head:(document.querySelector('#bpBody .bpSect')||{}).textContent, gate:f.ticketGate,
  shown:[...document.querySelectorAll('#bpBody .tkRow[data-seat="N"] .tkP b')].map(b=>b.textContent).join() }; })()`);
info('the Money tab: ' + JSON.stringify(rows.map(x => x.id)) + ', then ' + JSON.stringify(r));
ok(rows.map(x => x.id).join() === 'N,S,vip' && rows.every(x => /seats/.test(x.t) && /%/.test(x.t)) && r.seats === '{"N":34,"vip":95}' && r.shown === '$34',
  'the Money tab: each section with its seats, its price and − / +, what it sells and takes; + + on the North: $30 to $34; − on the VIP seats: $100 to $95 (a twentieth of the going rate a step)');
await page.click('#bpBody [data-stad="seatrate"]'); await page.waitForTimeout(80);
r = await K(`(()=>{ const d=CAREER.data; return { seats:JSON.stringify(d.seats), own:d.ticketPrice, n:computeFinance(d).seats[0].price }; })()`);
ok(r.seats === '{}' && r.own === null && r.n === 30, 'BACK TO THE GOING RATE: every price its rate again (the North $' + r.n + ')');

process.exitCode = rep.finish() ? 1 : 0;
await browser.close();
