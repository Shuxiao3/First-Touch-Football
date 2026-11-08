// FOOTBALL CLASSIC, A SIGNING'S WORTH AND A SALE'S (v156): a man to buy or sign shows what he'd do for your nine -- its
// average now and with him in it, for the weakest of yours in his part of the side -- or "no change"; a man from your
// academy sold, his agent takes a tenth (in the bank and the week's money); an ambitious man turned down for a bigger
// club minds, and says so; a star at a small club draws bids a little more (0.12 a window week, not 0.08) and, when no
// bid comes, a club watching him -- interest you can see nearly every window. On a copy the test can reach.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  let INJ_OFF=false;', '  let INJ_OFF=true;');
patch('  // ===== END MANAGER CAREER', '  window.__K={ ev:s=>eval(s) };\n  // ===== END MANAGER CAREER');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-sgn-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
const K = s => page.evaluate(s => window.__K.ev(s), s);
await page.click('#smItems [data-act="new"]'); await page.waitForTimeout(150);
await page.click('#newSlotList .slotBtn >> nth=0'); await page.waitForTimeout(100);
await page.waitForSelector('#mgrMaker.on', { timeout: 4000 });
await page.fill('#mgName', 'Sam Okafor'); await page.fill('#mgClubIn', 'Signing Town');
await page.click('#mgGo'); await page.waitForSelector('#careerHub.show', { timeout: 8000 });
await K(`(()=>{ const d=CAREER.data; d.story={vet:2,kid:2,phone:2}; mgStoryShow(d); mgMarketOpen(d); MGUI.noPile=true; pileHide(); d.budget=2e7; mgSave(d); renderHub(); return 1; })()`);

// --- WHAT HE'D DO FOR YOUR NINE ---------------------------------------------------------------------------------------------------
let r = await K(`(()=>{ const d=CAREER.data, xi=mgStarters(d), now=xi.reduce((a,q)=>a+q.ovr,0)/xi.length, mids=xi.filter(q=>q.role==='MID'), weak=mids.slice().sort((a,b)=>a.ovr-b.ovr)[0];
  const all=mgAiClubs(d).flatMap(c=>c.players.map(p=>[p,c])), good=all.find(([p])=>p.role==='MID'&&p.ovr>=weak.ovr+6), poor=all.find(([p])=>p.role==='MID'&&p.ovr<=weak.ovr-3);
  for(const [p] of [good,poor]) knUp(d,p,3,3);
  const fact=h=>{ const m=h.match(/<span>YOUR NINE<\\/span><b[^>]*>([^<]*)<\\/b>/); return m?m[1]:null; };
  return { now:+now.toFixed(1), want:+(now+(good[0].ovr-weak.ovr)/xi.length).toFixed(1), g:fact(mgBuyActions(d,good[0],good[1],true)), p:fact(mgBuyActions(d,poor[0],poor[1],true)), weak:weak.ovr, go:good[0].ovr, po:poor[0].ovr,
    free:fact(mgFreeActions(d,d.world.free[0],false)) }; })()`);
info('your nine: ' + JSON.stringify(r));
ok(r.g === r.now.toFixed(1) + ' → ' + r.want.toFixed(1) && r.p === 'no change' && r.free != null,
  'a man to buy shows what he\'d do for your nine: rated ' + r.go + ' for your weakest midfielder (' + r.weak + '), "' + r.g + '"; one rated ' + r.po + ', "' + r.p + '"; a free agent the same (' + r.free + ')');
// it fits the deal side on the narrowest phone
await page.setViewportSize({ width: 640, height: 360 }); await page.waitForTimeout(150);
await K(`(()=>{ curTab.market='Search'; openBuilding('market'); paintBuilding(); return 1; })()`); await page.waitForTimeout(200);
let over = 0, seen = 0;
for(let i = 0; i < 4; i++){ const rows = page.locator('#bpBody .mgList .mgRow:visible'); if(i >= await rows.count()) break; await rows.nth(i).click(); await page.waitForTimeout(80);
  if(await page.$('#bpBody [data-mside="deal"]')){ await page.click('#bpBody [data-mside="deal"]'); await page.waitForTimeout(80); }
  const f = await page.evaluate(() => { const P = document.querySelector('.mgPaneR .mgPaneScroll'); return { by: P.scrollHeight - P.clientHeight, nine: /YOUR NINE/.test(P.textContent) }; });
  seen++; if(f.by > 1 || !f.nine) over++; }
ok(seen >= 3 && over === 0, 'on the narrowest phone (640x360) the deal side has it and still fits (' + seen + ' men)');
await page.setViewportSize({ width: 1100, height: 1000 }); await K(`(()=>{ hideBldg(); return 1; })()`);

// --- HIS AGENT'S CUT ---------------------------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, c=mgAiClubs(d).find(k=>k.tier===d.tier), sell=(p,fee)=>{ c.budget=1e8; const o={id:++d.offerSeq, pid:p.id, club:c.id, fee, wk:d.wkN||0}; d.offers.push(o); const b0=d.budget, t0=(d.wl&&d.wl.L.transfers)||0; const err=mgAcceptOffer(d,o.id); return { err, got:d.budget-b0, led:((d.wl&&d.wl.L.transfers)||0)-t0 }; };
  d.offers=[]; d.offerSeq=d.offerSeq||0; const A=d.roster.filter(p=>!p.hometown&&!p.loan&&p.role!=='GK'); A[0].hg=1; delete A[1].hg;
  const hg=sell(A[0],500000), plain=sell(A[1],500000); return { hg, plain, news:d.news.slice(0,3).map(n=>n.t||n).join(' | ') }; })()`);
info('sold: ' + JSON.stringify(r));
ok(!r.hg.err && r.hg.got === 450000 && r.hg.led === 450000 && !r.plain.err && r.plain.got === 500000 && /his agent takes \$50,000/.test(r.news),
  'a man from your academy sold for $500,000: $450,000 to the club, his agent a tenth (and the week\'s money says so); anyone else, all of it');

// --- HE HEARS OF IT ---------------------------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, up=mgAiClubs(d).find(k=>k.tier>d.tier), same=mgAiClubs(d).find(k=>k.tier===d.tier), [a,b]=d.roster.filter(p=>!p.hometown&&!p.loan&&p.role!=='GK').slice(0,2);
  const setAm=(p,v)=>{ if(!p.hv) p.hv=hvMake(p); const h=typeof p.hv==='string'?p.hv.split(''):p.hv.slice(); h[HV_KEYS.indexOf('am')]=devEnc(v); p.hv=typeof p.hv==='string'?h.join(''):h; };
  setAm(a,8.5); setAm(b,3); a.mor=6.5; b.mor=6.5; delete a.wantsOut;
  const bid=(p,c)=>{ const o={id:++d.offerSeq, pid:p.id, club:c.id, fee:400000, wk:d.wkN||0}; d.offers.push(o); return mgRejectOffer(d,o.id); };
  const m1=bid(a,up), mA=a.mor, m2=bid(b,up), mB=b.mor, m3=bid(a,same), mA2=a.mor; return { m1, mA, m2, mB, m3, mA2, up:up.name }; })()`);
ok(/wanted the move to/.test(r.m1) && Math.abs(r.mA - 5.9) < 1e-6 && r.m2 === null && r.mB === 6.5 && r.m3 === null && r.mA2 === r.mA,
  'a bid turned down: an ambitious man wanting the club a league up minds ("' + r.m1 + '", his mood 6.5 to ' + r.mA + '); a content man doesn\'t, nor anyone over a club of your own league');

// --- INTEREST YOU CAN SEE --------------------------------------------------------------------------------------------------------
r = await K(`(()=>{ const d=CAREER.data, p=d.roster.filter(q=>!q.hometown&&!q.loan&&q.role!=='GK')[2], keep={ovr:p.ovr, tier:d.tier}; p.ovr=MG_LEVEL[d.tier]+8; delete d.listed[p.id]; delete p.wantsOut;
  let bids=0, calls=0; for(let i=0;i<3000;i++){ d.offers=[]; mgAiBids(d,1); calls++; if(d.offers.some(o=>o.pid===p.id)) bids++; }
  // a window: three weeks of pre-season (k 1.5), thirteen league weeks (0.15), the winter break (1.5) -- does he draw a bid, or a club watching him?
  let seen=0; const W=300; for(let w=0;w<W;w++){ delete p.watch; d.season=100+w; d.phase='summer'; d.md=0; const n0=d.news.length; let bid=false;
    for(const [k,ph,md] of [[1.5,'summer',0],[1.5,'summer',0],[1.5,'summer',0],...Array.from({length:13},(_,i)=>[0.15,'league',i]),[1.5,'winter',13]]){ d.phase=ph; d.md=md; d.offers=[]; mgAiBids(d,k); if(d.offers.some(o=>o.pid===p.id)) bid=true; }
    if(bid||p.watch!=null) seen++; }   // (p.watch: the window a club was seen watching him -- the news says so)
  p.ovr=keep.ovr; d.offers=[]; return { rate:Math.round(bids/calls*1000)/10, seen:Math.round(100*seen/W) }; })()`);
ok(r.rate >= 10 && r.rate <= 14.5 && r.seen >= 80, 'a star at a small club (8 over the league\'s level): a bid ' + r.rate + '% of window weeks (it was 8%); over a window a bid or a club watching him ' + r.seen + '% of the time');

process.exitCode = rep.finish();
await browser.close();
