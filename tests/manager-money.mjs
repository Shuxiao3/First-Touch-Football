// FOOTBALL CLASSIC, THE MONEY: shirt sales (passive, with each week's money: your fans, a star, the club's mood); the
// boards come with the stands, bare to start -- one round a new ground, nobody on it and no offers (v103) -- and the
// sponsors who call are the club's size: local businesses for a new club (a coffee shop, the tyre place), the town's
// firms a league up, national companies and global brands at the top, each paying its size's fee; and a sponsor's
// deal pays a base fee every week and, from a town firm up, a bonus at the season's end for hitting its target -- a
// league finish, wins, goals, clean sheets or full crowds, in one to three tiers, the highest reached paying -- shown on
// its offer, by the deal through the season, and in the season's review. On a copy of the game that lets the test reach it.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  let INJ_OFF=false;', '  let INJ_OFF=true;');
patch('  // ===== END MANAGER CAREER', '  window.__K={ ev:s=>eval(s) };\n  // ===== END MANAGER CAREER');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-money-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
const K = s => page.evaluate(s => window.__K.ev(s), s);
let r;
await page.emulateMedia({ reducedMotion: 'reduce' });
await page.click('#smItems [data-act="new"]'); await page.waitForTimeout(150);
await page.click('#newSlotList .slotBtn >> nth=0'); await page.waitForTimeout(100);
await page.waitForSelector('#mgrMaker.on', { timeout: 4000 });
await page.fill('#mgName', 'Sam Okafor'); await page.fill('#mgClubIn', 'Money Town');
await page.click('#mgGo'); await page.waitForSelector('#careerHub.show', { timeout: 6000 });
await K(`(()=>{ const d=CAREER.data; d.story={vet:2,kid:2,phone:2}; mgStoryShow(d); mgSave(d); return 1; })()`);

// --- shirt sales ---------------------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, f=computeFinance(d), s=shirtSales(d), L0=d.loyalty, tm0=d.tm;
  const at=o=>{ Object.assign(d,o); const v=shirtSales(d).wk; d.loyalty=L0; d.tm=tm0; return v; };
  const best=popTop(d,1)[0], p0=best.pop; best.pop=95; const star=shirtSales(d).wk; best.pop=p0;   // (v105: a star is a man the fans love -- his popularity)
  return { wk:f.shirtWk, s, more:at({loyalty:L0*2}), happy:at({tm:9}), low:at({tm:2}), star, pool:f.poolWk===f.sponsorWk+f.broadcastWk+f.commercialWk+f.shirtWk }; })()`);
info('shirt sales: ' + JSON.stringify(r));
ok(r.wk > 0 && r.wk === r.s.wk && r.pool && Math.abs(r.more - 2 * r.wk) <= 2, 'shirt sales: ' + r.wk + ' a week from ' + Math.round(r.s.fans) + ' fans, counted in a typical week (paid each Monday since v105: see manager-deadline); twice the fans, twice the sales (' + r.more + ')');
ok(r.star > r.wk && r.happy > r.wk && r.low < r.wk, 'a star sells shirts (' + r.star + ' with a man the fans idolise, popularity 95), a happy club more (' + r.happy + '), an unhappy one fewer (' + r.low + ')');

// --- the boards come with the stands: one round a new ground, bare, and nobody calling yet (v103) -------------------------
r = await K(`(()=>{ const d=CAREER.data, S=stadOf(d), b0=S.boards, ads0=S.ads.length, offers0=(d.spOff||[]).length, deals0=Object.keys(S.deals).length, buy=boardBuy(d), wk0=computeFinance(d).boardsWk, drawn=groundOfYours(d).boards.map(b=>b.short);
  d.budget=1e6; const up=stadUpgrade(d); const S2=stadOf(d); return { b0, ads0, offers0, deals0, buy, wk0, drawn, kit:spOpen(d,'kit'), stand:spOpen(d,'N'), ground:spOpen(d,'ground'), up, b1:S2.boards, ads1:S2.ads.length, lvl:S2.lvl, drawn1:groundOfYours(d).boards.length }; })()`);
info('the boards: ' + JSON.stringify(r));
ok(r.b0 === 1 && r.ads0 === 0 && r.offers0 === 0 && r.deals0 === 0 && r.wk0 === 0 && r.drawn.join() === 'YOUR AD HERE' && /come with the stands/.test(r.buy),
  'a new career\'s ground: one board round the pitch, bare ("' + r.drawn[0] + '"), nothing coming in from it, no sponsors and no offers; none to buy');
ok(!r.kit && !r.stand && !r.ground && r.up === null && r.lvl === 2 && r.b1 === 3 && r.ads1 === 0 && r.drawn1 === 3,
  'the shirt, the stands\' names and the ground\'s not open to sponsors yet; a bigger ground, more boards (3 at level 2), bare till someone takes them');

// --- who calls: the club's size -- local businesses first, then bigger and bigger ----------------------------------------
r = await K(`(()=>{ const d=CAREER.data, S=stadOf(d), was={tier:d.tier, lvl:S.lvl, loy:d.loyalty, md:d.md};
  const gen=(k,n)=>{ const L=[]; for(let i=0;i<n;i++){ const o=spOfferFor(d,k,new Set()); if(o) L.push(o); } return L; }, out={};
  const at=(tier,lvl,fans)=>{ d.tier=tier; S.lvl=lvl; d.loyalty=Math.round((LOYALTY_BASE[tier]||1000)*fans); d.md=0; return Math.round(spStanding(d)*10)/10; };
  out.st=[at(1,1,1)]; const loc=gen('board',80); out.loc={sz:[...new Set(loc.map(o=>o.sz))].join(), names:loc.slice(0,4).map(o=>o.sp.name+' $'+o.wk), fee:loc.every(o=>o.wk>=15&&o.wk<=40), bonus:loc.some(o=>o.m), yrs:loc.every(o=>o.yrs===1),
    trades:loc.every(o=>SP_SIZES[0].b.some(t=>o.sp.name.endsWith(' '+t))), short:loc.every(o=>o.sp.short.length<=12)};
  out.st.push(at(2,2,1)); const town=gen('board',80); out.town={sz:town.filter(o=>o.sz===1).length, n:town.length};
  out.st.push(at(4,5,2)); const top=gen('kit',60); out.top={sz:[...new Set(top.map(o=>o.sz))].sort().join(), fee:Math.min(...top.map(o=>o.wk))};
  // the places' bonuses, from a town firm up
  at(3,4,1); const kinds=['kit','ground','N'], all=[]; for(const k of kinds) for(const o of gen(k,40)) all.push([k,o]);
  const pick={kit:DEAL_PICK.kit, ground:DEAL_PICK.ground, N:DEAL_PICK.stand};
  out.metOk=all.every(([k,o])=>o.m&&pick[k].includes(o.m.k)); out.tiers=[...new Set(all.map(([k,o])=>o.m.t.length))].sort().join();
  out.harder=all.every(([k,o])=>o.m.t.every((x,i,A)=>!i||(x[1]>A[i-1][1]&&(o.m.k==='pos'?x[0]<A[i-1][0]:x[0]>A[i-1][0]))));
  out.kinds=[...new Set(all.map(([k,o])=>o.m.k))].sort().join(); out.base=all.every(([k,o])=>o.wk>0); out.gname=all.filter(([k])=>k==='ground').every(([k,o])=>o.ground&&o.sz>=1);
  const kit=all.find(([k,o])=>k==='kit'&&o.m.t.length===3)[1]; out.kit={wk:kit.wk, t:kit.m.t, txt:dealMetTxt(kit.m)};
  d.tier=was.tier; S.lvl=was.lvl; d.loyalty=was.loy; d.md=was.md; return out; })()`);
info('who calls: ' + JSON.stringify(r));
ok(r.st[0] === 0 && r.loc.sz === '0' && r.loc.fee && !r.loc.bonus && r.loc.yrs && r.loc.trades && r.loc.short,
  'a new club: only local businesses call (' + r.loc.names.join(', ') + '), $15 to $40 a week for a board, to the season\'s end, no bonus');
ok(r.st[1] > 22 && r.town.sz > r.town.n * 0.5 && r.st[2] > 88 && /4/.test(r.top.sz) && r.top.fee >= 1800,   // (a national company's $2,000 and up, a three-season deal a tenth less a week)
  'a league up and a bigger ground, mostly the town\'s firms (' + r.town.sz + ' of ' + r.town.n + '); at the top with a grand stadium, national companies and global brands (sizes ' + r.top.sz + '), the shirt for ' + r.top.fee + ' a week and up');
ok(r.metOk && r.base && r.tiers === '1,2,3' && r.harder && /pos/.test(r.kinds) && /crowd/.test(r.kinds) && /goals|cs/.test(r.kinds) && r.gname,
  'from a town firm up, a base fee and a bonus for a target: the shirt\'s a finish or wins, the ground\'s full crowds, a stand\'s goals, clean sheets or crowds (' + r.kinds + '); one to three tiers, each harder one paying more');
ok(r.kit.t.map(x => x[1]).join() === [3, 7, 12].map(w => Math.max(10, Math.round(r.kit.wk * w / 10) * 10)).join(), 'a three-tier bonus: 3, 7 and 12 weeks of its fee (' + r.kit.txt + ', on ' + r.kit.wk + ' a week)');

// --- the season: where you stand, the bonus, the review --------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, S=stadOf(d); S.deals={};
  S.deals.kit={sp:spMake(rng32(1)), wk:400, until:d.season+1, since:d.season, m:{k:'pos', t:[[10,1200],[6,2800],[2,4800]]}};
  S.deals.ground={sp:spMake(rng32(2)), wk:300, until:d.season, since:d.season, ground:'Apex Park', m:{k:'crowd', t:[[0.75,2400]]}};
  S.deals.N={sp:spMake(rng32(3)), wk:100, until:d.season, since:d.season, m:{k:'goals', t:[[35,400],[48,1200]]}};
  const keep=dealNow; dealNow=(d,k)=>({pos:4, crowd:0.6, goals:40, wins:12, cs:6})[k];
  const tiers=['kit','ground','N'].map(k=>dealTier(d,S.deals[k].m)); const b0=d.budget, R={}; dealBonuses(d,R); const paid=d.budget-b0; dealNow=keep;
  d.crowd={n:0,sum:0}; const f=computeFinance(d); applyWeek(d,{home:true}); const c1=d.crowd.n; applyWeek(d,{home:false}); const c2=d.crowd.n;
  return { tiers, paid, bonus:R.bonus, news:d.news.slice(0,4).map(n=>n.t), crowd:[c1,c2,+(d.crowd.sum).toFixed(3), +(f.attendance/f.capacity).toFixed(3)] }; })()`);
info('the season\'s end: ' + JSON.stringify(r));
ok(r.tiers.join() === '1,-1,0' && r.paid === 2800 + 400 && r.bonus.length === 3 && r.bonus.some(b => b.amt === 0 && /^not /.test(b.lbl)) && r.news.some(t => /bonus of \$2,800: top 6/.test(t)),
  'at the season\'s end each deal pays its highest tier reached: 4th is top 6 for the shirt (+$2,800, not top 2), 40 goals the first of a stand\'s two (+$400), crowds short of 75% nothing; the news says so');
ok(r.crowd[0] === 1 && r.crowd[1] === 1 && r.crowd[2] === r.crowd[3], 'the home crowds are counted for the ground\'s sponsor, a home game at a time (away games not)');

// --- what you see: the offers, the deals with where you stand, the review ---------------------------------------------------------
await K(`(()=>{ const d=CAREER.data; d.crowd={n:2,sum:1.4}; d.md=3; mgSave(d); renderHub(); return 1; })()`);   // (three games in: where you stand)
await page.click('#chCampus [data-bldg="stadium"]'); await page.waitForSelector('#bldgPanel.show'); await page.click('#bldgPanel .bpTab:text-is("Sponsors")'); await page.waitForTimeout(150);
const deals = await page.$$eval('#bpBody .spBonus', ns => ns.map(n => n.textContent));
const boards = await page.textContent('#bpBody').then(t => (t.match(/BOARDS\s*\d+ of \d+ taken[^$]*\$[\d,]+\/wk/) || [''])[0]);
const putUp = await page.$('#bpBody [data-stad="board"]');
await K(`(()=>{ const d=CAREER.data, S=stadOf(d); delete S.deals.N; d.tier=2; const bonused=k=>{ for(let i=0;i<40;i++){ const o=spOfferFor(d,k,new Set()); if(o&&o.m) return o; } }; d.spOff=[bonused('N'), bonused('kit')]; d.tier=1; mgSave(d); return 1; })()`);   // (two from town firms: a smaller one, now and then, has no bonus)
await page.click('#bldgPanel .bpTab:text-is("Sponsors")'); await page.waitForTimeout(150);
const offers = await page.$$eval('#bpBody .spRow:has([data-stad="spsign"]) + .spBonus', ns => ns.map(n => n.textContent));
info('the Sponsors tab: ' + JSON.stringify({ deals, boards, offers }));
ok(deals.some(t => /^BONUS · top 10 \+\$1\.2K · top 6 \+\$2\.8K · top 2 \+\$4\.8K · now \d+(st|nd|rd|th)$/.test(t)) && deals.some(t => /75% full \+\$2\.4K · now 70% full/.test(t)) && /of \d+ taken/.test(boards) && !putUp,
  'the Sponsors tab: each deal\'s bonus and where you stand ("' + deals[0] + '"), the boards (' + boards.replace(/\s+/g, ' ') + ') with no buying');
ok(offers.length === 2 && offers.every(t => /^BONUS · /.test(t)), 'the offers waiting, each with its bonus ("' + offers[0] + '")');
await page.click('#bldgPanel .bpTopBack'); await page.waitForTimeout(150);
// the review and the books
r = await K(`(()=>{ const d=CAREER.data; d.review={season:d.season,tier:d.tier,pos:4,result:'STAYED UP',prize:1000,grew:[],expired:[],retired:[],youthOut:[],moves:{1:{table:d.div[1],up:[],down:[]},2:{table:d.div[2],up:[],down:[]},3:{table:d.div[3],up:[],down:[]},4:{table:d.div[4],up:[],down:[]}},
    bonus:[{sp:'Apex Motors',lbl:'top 6',amt:2800},{sp:'Kestrel Bank',lbl:'not 75% full',amt:0}]}; const h=mgReviewBody(d).replace(/<[^>]+>/g,' ').replace(/\\s+/g,' '); const b=mgFinanceTab(d).replace(/<[^>]+>/g,' ').replace(/\\s+/g,' '); d.review=null;
  return { review:h.slice(h.indexOf('SPONSORS'),h.indexOf('SPONSORS')+90), books:/Shirt sales \\(each Monday\\) \\$[\\d,]+/.test(b) }; })()`);   // (v105: the shirts are each Monday's)
info('the review and the books: ' + JSON.stringify(r));
ok(/SPONSORS’ BONUSES Apex Motors · top 6 \+\$2,800 Kestrel Bank · not 75% full —/.test(r.review) && r.books, 'the season\'s review lists the sponsors\' bonuses; the books, the shirt sales (each Monday)');

process.exitCode = rep.finish() ? 1 : 0;
await browser.close();
