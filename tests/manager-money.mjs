// FOOTBALL CLASSIC, THE MONEY: shirt sales (passive, with each week's money: your fans, a star, the club's mood); the
// boards come with the stands (as many as the ground's level has, each let at once -- never bought); and a sponsor's
// deal pays a base fee every week and a bonus at the season's end for hitting its target -- a league finish, wins,
// goals, clean sheets or full crowds, in one to three tiers, the highest reached paying -- shown on its offer, by the
// deal through the season, and in the season's review. On a copy of the game that lets the test reach it.
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
await K(`(()=>{ const d=CAREER.data; d.story={vet:2,kid:2,phone:2}; mgSave(d); return 1; })()`);

// --- shirt sales ---------------------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, f=computeFinance(d), s=shirtSales(d), L0=d.loyalty, tm0=d.tm;
  const at=o=>{ Object.assign(d,o); const v=shirtSales(d).wk; d.loyalty=L0; d.tm=tm0; return v; };
  const best=d.roster.reduce((a,p)=>p.ovr>a.ovr?p:a,d.roster[0]), o0=best.ovr; best.ovr=MG_LEVEL[d.tier]+10; const star=shirtSales(d).wk; best.ovr=o0;
  return { wk:f.shirtWk, s, more:at({loyalty:L0*2}), happy:at({tm:9}), low:at({tm:2}), star, pool:f.poolWk===f.sponsorWk+f.broadcastWk+f.commercialWk+f.shirtWk }; })()`);
info('shirt sales: ' + JSON.stringify(r));
ok(r.wk > 0 && r.wk === r.s.wk && r.pool && Math.abs(r.more - 2 * r.wk) <= 2, 'shirt sales: ' + r.wk + ' a week from ' + Math.round(r.s.fans) + ' fans, paid with the rest of each week\'s money; twice the fans, twice the sales (' + r.more + ')');
ok(r.star > r.wk && r.happy > r.wk && r.low < r.wk, 'a star sells shirts (' + r.star + ' with a man ten above the league), a happy club more (' + r.happy + '), an unhappy one fewer (' + r.low + ')');

// --- the boards come with the stands ----------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, S=stadOf(d), b0=S.boards, ads0=S.ads.length, uniq=new Set(S.ads.map(a=>a.short)).size===S.ads.length, buy=boardBuy(d), wk0=computeFinance(d).boardsWk;
  d.budget=1e6; const up=stadUpgrade(d); const S2=stadOf(d); return { b0, ads0, uniq, buy, wk0, up, b1:S2.boards, ads1:S2.ads.length, lvl:S2.lvl }; })()`);
info('the boards: ' + JSON.stringify(r));
ok(r.b0 === 6 && r.ads0 === 6 && r.uniq && /come with the stands/.test(r.buy) && r.wk0 > 0 && r.up === null && r.lvl === 2 && r.b1 === 10 && r.ads1 === 10,
  'the boards come with the stands: 6 round a new ground, each let at once (' + r.wk0 + ' a week), none to buy ("' + r.buy + '"); the next level, 10');

// --- a sponsor's offer: a base fee and a bonus, in tiers ----------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, kinds=['kit','ground','N'], out={}, all=[];
  for(let day=0;day<12;day++){ d.day=day; for(const k of kinds){ const L=dealBids(d,k); for(const b of L){ all.push([k,b]); } } }
  const pick={kit:DEAL_PICK.kit, ground:DEAL_PICK.ground, N:DEAL_PICK.stand};
  out.n=all.length; out.metOk=all.every(([k,b])=>b.m&&pick[k].includes(b.m.k)); out.tiers=[...new Set(all.map(([k,b])=>b.m.t.length))].sort().join();
  out.harder=all.every(([k,b])=>b.m.t.every((x,i,A)=>!i||(x[1]>A[i-1][1]&&(b.m.k==='pos'?x[0]<A[i-1][0]:x[0]>A[i-1][0]))));
  out.kinds=[...new Set(all.map(([k,b])=>b.m.k))].sort().join(); out.base=all.every(([k,b])=>b.wk>0);
  const kit=all.find(([k,b])=>k==='kit'&&b.m.t.length===3)[1]; out.kit={wk:kit.wk, t:kit.m.t, txt:dealMetTxt(kit.m)};
  return out; })()`);
info('the offers: ' + JSON.stringify(r));
ok(r.metOk && r.base && r.tiers === '1,2,3' && r.harder && /pos/.test(r.kinds) && /crowd/.test(r.kinds) && /goals|cs/.test(r.kinds),
  'every offer a base fee and a bonus for a target: the shirt\'s a finish or wins, the ground\'s full crowds, a stand\'s goals, clean sheets or crowds (' + r.kinds + '); one to three tiers, each harder one paying more');
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
const boards = await page.textContent('#bpBody').then(t => (t.match(/BOARDS[^$]*\$[\d,]+\/wk/) || [''])[0]);
const putUp = await page.$('#bpBody [data-stad="board"]');
await K(`(()=>{ const d=CAREER.data; delete stadOf(d).deals.N; MGUI.stadOffer='N'; mgSave(d); return 1; })()`);
await page.click('#bldgPanel .bpTab:text-is("Sponsors")'); await page.waitForTimeout(150);
const offers = await page.$$eval('#bpBody .spBonus', ns => ns.map(n => n.textContent));
info('the Sponsors tab: ' + JSON.stringify({ deals, boards, offers }));
ok(deals.some(t => /^BONUS · top 10 \+\$1\.2K · top 6 \+\$2\.8K · top 2 \+\$4\.8K · now \d+(st|nd|rd|th)$/.test(t)) && deals.some(t => /75% full \+\$2\.4K · now 70% full/.test(t)) && /round the ground/.test(boards) && !putUp,
  'the Sponsors tab: each deal\'s bonus and where you stand ("' + deals[0] + '"), the boards round the ground with no buying');
ok(offers.length === 3 && offers.every(t => /^BONUS · /.test(t)), 'each offer says its bonus ("' + offers[0] + '")');
await K(`(()=>{ MGUI.stadOffer=null; return 1; })()`);
await page.click('#bldgPanel .bpTopBack'); await page.waitForTimeout(150);
// the review and the books
r = await K(`(()=>{ const d=CAREER.data; d.review={season:d.season,tier:d.tier,pos:4,result:'STAYED UP',prize:1000,grew:[],expired:[],retired:[],youthOut:[],moves:{1:{table:d.div[1],up:[],down:[]},2:{table:d.div[2],up:[],down:[]},3:{table:d.div[3],up:[],down:[]},4:{table:d.div[4],up:[],down:[]}},
    bonus:[{sp:'Apex Motors',lbl:'top 6',amt:2800},{sp:'Kestrel Bank',lbl:'not 75% full',amt:0}]}; const h=mgReviewBody(d).replace(/<[^>]+>/g,' ').replace(/\\s+/g,' '); const b=mgFinanceTab(d).replace(/<[^>]+>/g,' ').replace(/\\s+/g,' '); d.review=null;
  return { review:h.slice(h.indexOf('SPONSORS'),h.indexOf('SPONSORS')+90), books:/Shirt sales \\$[\\d,]+/.test(b) }; })()`);
info('the review and the books: ' + JSON.stringify(r));
ok(/SPONSORS’ BONUSES Apex Motors · top 6 \+\$2,800 Kestrel Bank · not 75% full —/.test(r.review) && r.books, 'the season\'s review lists the sponsors\' bonuses; the books, the shirt sales');

process.exitCode = rep.finish() ? 1 : 0;
await browser.close();
