// FOOTBALL CLASSIC, HE'S YOURS (v164), the smallest iPhone held sideways (667x375, touch only): a man signed by a tap --
// a free agent, a transfer, a loan from the papers -- or one of yours on a new deal: an overview of him there and then.
// SIGNED (ON LOAN, A NEW DEAL); his figure, number and name, position, archetype and age, rating and potential; where he
// came from and what he cost (a new deal: his wage before and after); his wage and contract; where he is in your squad;
// his six, to look at. All of it on the screen; DONE closes it, a tap outside too; two at once, one after the
// other; over the papers, and the papers still there after; SEE HIM IN THE SQUAD opens his card in the clubhouse. And your
// lineup as you set it: a signing puts him at the end of the bench (it picked the whole nine again). Before,
// a signing was a line at the foot of the screen for a moment. On a copy the test can reach.
import { chromium } from 'playwright';
import { STAR, reporter } from './_harness.mjs';
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

const rep = reporter(); const { ok, info } = rep;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 667, height: 375 }, isMobile: true, hasTouch: true }); await ctx.addInitScript(STAR);
const page = await ctx.newPage();   // (nothing put aside: this is the overview's own test)
page.on('pageerror', e => rep.errs.push('PAGEERROR: ' + e.message));
await page.goto('file://' + copy); await page.waitForTimeout(700);
const K = s => page.evaluate(s => window.__K.ev(s), s);
const isOn = () => K(`document.getElementById('signModal').classList.contains('on')`);
const view = () => K(`(()=>{ const m=document.getElementById('signModal'), c=m.querySelector('.signCard'), r=c.getBoundingClientRect();
  const B=[...c.querySelectorAll('button[data-sg]')].map(b=>{ const q=b.getBoundingClientRect(), at=document.elementFromPoint(q.left+q.width/2,q.top+q.height/2); return { t:b.textContent, ok:q.bottom<=innerHeight&&q.top>=0&&!!at&&(at===b||b.contains(at)) }; });
  const fact=k=>{ const f=[...c.querySelectorAll('.mgFact')].find(x=>x.querySelector('span').textContent===k); return f?f.querySelector('b').textContent:null; };
  return { on:m.classList.contains('on'), title:(c.querySelector('.pauseTitle')||{}).textContent, name:(c.querySelector('.mgCardName')||{}).textContent, sub:(c.querySelector('.mgCardSub')||{}).textContent,
    where:(c.querySelector('.signWhere')||{}).textContent, ovr:(c.querySelector('.mgCardOvr')||{}).textContent, figure:!!c.querySelector('img.cardBody'), six:c.querySelectorAll('.sixC').length, open:!!c.querySelector('.sixOpen'),
    facts:Object.fromEntries([...c.querySelectorAll('.mgFact')].map(x=>[x.querySelector('span').textContent,x.querySelector('b').textContent])), B, top:Math.round(r.top), bottom:Math.round(r.bottom), cut:c.scrollHeight-c.clientHeight, vh:innerHeight }; })()`);
const sub = v => (v.sub || '').replace(/\u00a0/g, ' ');   // (a name kept on one line: its spaces unbreakable)
const outside = async () => { const r = await page.evaluate(() => { const c = document.querySelector('#signModal .signCard').getBoundingClientRect(); return { x: c.left / 2, y: innerHeight / 2 }; }); await page.touchscreen.tap(r.x, r.y); await page.waitForTimeout(150); };

// --- a new career, by taps ------------------------------------------------------------------------------------------------------
await page.tap('#smItems [data-act="new"]'); await page.waitForTimeout(150);
await page.tap('#newSlotList .slotBtn >> nth=0'); await page.waitForSelector('#mgrMaker.on', { timeout: 4000 });
await page.fill('#mgName', 'Sam Okafor'); await page.fill('#mgClubIn', 'Signing Town'); await page.tap('#mgGo'); await page.waitForSelector('#careerHub.show', { timeout: 8000 });
await K(`(()=>{ const d=CAREER.data; d.story={vet:2,kid:2,phone:2}; mgStoryShow(d); mgMarketOpen(d); d.budget=2e7; MGUI.noPile=true; pileHide(); if(d.fw) d.fw.off=true; renderHub(); return 1; })()`);

// --- A FREE AGENT, SIGNED ---------------------------------------------------------------------------------------------------------
const fa = await K(`(()=>{ const d=CAREER.data, p=d.world.free.find(q=>!mgWontCome(d,q)&&q.role!=='GK'); knUp(d,p,3,3); curTab.market='Free agents'; openBuilding('market'); MGUI.sel=p.id; mgSide='deal'; paintBuilding(); return { id:p.id, name:p.name, fee:mgFreeAsk(d,p).fee }; })()`);
await page.waitForTimeout(200);
const lu0 = await K(`(()=>{ const d=CAREER.data, lu=ensureLineup(d), a=lu.atk[2], b=lu.bench[lu.bench.length-1]; lu.atk[2]=b; lu.bench[lu.bench.length-1]=a; lu.def=careerMapDef(d); mgSave(d); return JSON.stringify([lu.gk,lu.atk,lu.bench]); })()`);   // (your own pick first: the last man on the bench in for a starter)
await page.tap('#bpBody [data-mg="signfree"]'); await page.waitForTimeout(300);
const lu1 = await K(`(()=>{ const d=CAREER.data, lu=d.lineup, all=[lu.gk,...lu.atk,...lu.bench]; return { same:JSON.stringify([lu.gk,lu.atk,lu.bench.slice(0,-1)])===${JSON.stringify(lu0)}, last:lu.bench[lu.bench.length-1]===d.roster.length-1, once:new Set(all).size===all.length&&all.length===d.roster.length }; })()`);
ok(lu1.same && lu1.last && lu1.once, 'your lineup as you set it: the signing leaves your nine and your bench be, and puts him at the end of the bench, once (it picked your whole nine again for you, and listed him twice)');
let v = await view();
const me = await K(`(()=>{ const d=CAREER.data, p=d.roster.find(q=>q.id===${fa.id}); if(!p) return null; const lu=ensureLineup(d), bi=lu.bench.indexOf(d.roster.indexOf(p)), xi=mgStarters(d).includes(p);
  return { num:p.num, ovr:p.ovr, wage:money(p.wage)+'/wk', until:'to season '+p.until, pos:natPos(p), style:styleOf(p)?styleOf(p).name:'', age:p.age, where:xi?'nine':bi>=0&&bi<BENCH_N?'bench':'squad' }; })()`);
info('signed: ' + JSON.stringify(v.facts) + ' -- ' + v.name + ' / ' + v.sub + ' / ' + v.where);
ok(me && v.on && v.title === 'SIGNED' && v.name === '#' + me.num + ' ' + fa.name && sub(v).includes(me.pos) && sub(v).includes(me.style) && sub(v).includes('age ' + me.age) && v.ovr === String(me.ovr) && v.figure,
  'a free agent signed: at once, SIGNED and his overview -- his figure, "' + v.name + '", ' + me.pos + ' · ' + me.style + ', age ' + me.age + ', rated ' + v.ovr + ' -- and he\'s in your squad');
ok(v.facts.FROM === 'a free agent' && v.facts['TO SIGN'] === (fa.fee ? '$' + fa.fee.toLocaleString() : 'nothing') && v.facts.WAGE === me.wage && v.facts.CONTRACT === me.until && v.six === 6,
  'where he came from, what he cost, his wage and his contract (' + Object.entries(v.facts).map(([k, x]) => k + ' ' + x).join(', ') + '), and his six');
ok({ nine: /^In your nine/, bench: /^On your bench/, squad: /not in your nine or on the bench yet/ }[me.where].test(v.where), 'where he is in your squad: "' + v.where + '"');
ok(v.top >= 0 && v.bottom <= v.vh && v.cut <= 1 && v.B.length === 2 && v.B.every(b => b.ok), 'all of it on the smallest iPhone held sideways, SEE HIM IN THE SQUAD and DONE a tap away (' + v.top + ' to ' + v.bottom + ' px of ' + v.vh + ')');
await page.tap('#signModal .sixC >> nth=3'); await page.waitForTimeout(150);
const v6 = await view(), plain = await K(`document.querySelectorAll('#signModal button.sixC, #signModal [data-six]').length`);
ok(v6.on && !v6.open && !plain && v6.bottom <= v6.vh && v6.B.every(b => b.ok), 'his six are there to look at -- a tap on one opens nothing, so the card never outgrows the screen (his card in the squad has the rest)');
await page.tap('#signModal [data-sg="done"]'); await page.waitForTimeout(150);
ok(!(await isOn()), 'DONE closes it');
await K(`(()=>{ sixOpen=null; return 1; })()`);

// --- A TRANSFER, SIGNED ----------------------------------------------------------------------------------------------------------
const tr = await K(`(()=>{ const d=CAREER.data, all=mgAiClubs(d).filter(c=>c.tier===d.tier).flatMap(c=>c.players.map(p=>[p,c])), x=all.find(([p,c])=>p.role!=='GK'&&!mgWontCome(d,p)&&!p.loan&&c.players.length>13);
  const [p,c]=x, r=mgBid(d,p.id,mgRound(mgAsk(d,p,c)*1.3)); curTab.market='Search'; openBuilding('market'); MGUI.sel=p.id; MGUI.tier=c.tier; mgSide='deal'; paintBuilding(); const B=mgBidOf(d,p.id);
  return { id:p.id, name:p.name, club:c.name+' ('+MG_LEAGUE[c.tier]+')', fee:B&&B.fee, ok:!!r.ok, st:B&&B.st }; })()`);
await page.waitForTimeout(200);
if(await page.$('#bpBody [data-mside="deal"]')){ await page.tap('#bpBody [data-mside="deal"]'); await page.waitForTimeout(100); }
await page.tap('#bpBody [data-mg="sign"]'); await page.waitForTimeout(300);
v = await view();
info('bought: ' + JSON.stringify(v.facts));
ok(tr.ok && v.on && v.title === 'SIGNED' && v.name.endsWith(tr.name) && v.facts.FROM === tr.club && v.facts.FEE === '$' + tr.fee.toLocaleString(), 'a transfer: SIGN, and his overview -- from ' + v.facts.FROM + ', for ' + v.facts.FEE);
await outside();
ok(!(await isOn()), 'a tap outside the card closes it too');

// --- A NEW DEAL, FROM HIS CARD ------------------------------------------------------------------------------------------------------
const rn = await K(`(()=>{ const d=CAREER.data, p=d.roster.find(q=>!q.loan&&q.role!=='GK'&&q.id!==${fa.id}&&q.id!==${tr.id}); p.cAsk=true; const w0=p.wage, u0=p.until; curTab.club='Squad'; openBuilding('club'); MGUI.sel=p.id; mgSide='deal'; paintBuilding(); return { id:p.id, name:p.name, w0:money(w0)+'/wk, to season '+(u0||d.season) }; })()`);
await page.waitForTimeout(200);
await page.tap('#bpBody [data-mg="renew"]'); await page.waitForTimeout(300);
v = await view();
const now = await K(`(()=>{ const p=CAREER.data.roster.find(q=>q.id===${rn.id}); return money(p.wage)+'/wk, to season '+p.until; })()`);
ok(v.on && v.title === 'A NEW DEAL' && v.name.endsWith(rn.name) && v.facts.WAS === rn.w0 && v.facts.NOW === now, 'a new deal from his card: A NEW DEAL, his wage before and after ("' + v.facts.WAS + '" to "' + v.facts.NOW + '")');
await page.tap('#signModal [data-sg="done"]'); await page.waitForTimeout(150);

// --- TWO AT ONCE ---------------------------------------------------------------------------------------------------------------------
await K(`(()=>{ const d=CAREER.data, a=d.roster[0], b=d.roster[1]; hideBldg(); signShow(d,signPre(d,a.id),'renew'); signShow(d,signPre(d,b.id),'renew'); return 1; })()`); await page.waitForTimeout(150);
const t1 = (await view()).B.map(b => b.t).join('|');
await page.tap('#signModal [data-sg="done"]'); await page.waitForTimeout(150);
const v2 = await view();
await page.tap('#signModal [data-sg="done"]'); await page.waitForTimeout(150);
ok(/NEXT \(1 OF 2\)/.test(t1) && v2.on && v2.B.some(b => b.t === 'DONE') && !(await isOn()), 'two at once: one after the other -- "' + t1.split('|')[1] + '", then DONE');

// --- OVER THE PAPERS: a loan ---------------------------------------------------------------------------------------------------------
const lp = await K(`(()=>{ const d=CAREER.data, R=Math.random; Math.random=()=>0.01; const L=wkLoans(d); Math.random=R; d.wday='mon'; MGUI.noPile=false; pileBuild(d,{dev:null, loans:L}); d.pile.opened=false; renderHub(); pileShow(d,true); return L.map(x=>x.k).join(' '); })()`);
await page.waitForTimeout(150);
let loanTxt = '';
for(let i = 0; i < 14 && await K(`document.getElementById('pileModal').classList.contains('on')`); i++){ const t = await page.innerText('#pileModal .plPaper'); if(/will lend you/.test(t)){ loanTxt = t; break; }
  const b = await page.$('#pileModal .plBtns [data-pile="next"]') || await page.$('#pileModal .plBtns [data-pile="later"]'); if(!b) break; await b.tap(); await page.waitForTimeout(100); }
if(loanTxt){ await page.tap('#pileModal [data-pile="loanin"]'); await page.waitForTimeout(300); }
v = await view();
const papersUnder = await K(`document.getElementById('pileModal').classList.contains('on')`);
info('on loan: ' + JSON.stringify(v.facts));
ok(/loanin/.test(lp) && !!loanTxt && v.on && v.title === 'ON LOAN' && !!v.facts['ON LOAN FROM'] && /^\$/.test(v.facts['LOAN FEE'] || '') && /% of it\)/.test(v.facts['HIS WAGE'] || '') && papersUnder,
  'from the papers, a loan: ON LOAN over them -- from ' + v.facts['ON LOAN FROM'] + ', ' + v.facts['LOAN FEE'] + ' up front, ' + v.facts['HIS WAGE']);
await page.tap('#signModal [data-sg="done"]'); await page.waitForTimeout(150);
ok(!(await isOn()) && await K(`document.getElementById('pileModal').classList.contains('on')`), 'DONE: back to the papers, where you were');
await K(`(()=>{ MGUI.noPile=true; pileHide(); return 1; })()`);

// --- SEE HIM IN THE SQUAD -------------------------------------------------------------------------------------------------------------
const fb = await K(`(()=>{ const d=CAREER.data, p=d.world.free.find(q=>!mgWontCome(d,q)&&q.role!=='GK'&&q.id!==${fa.id}); knUp(d,p,3,3); curTab.market='Free agents'; openBuilding('market'); MGUI.sel=p.id; mgSide='deal'; paintBuilding(); return { id:p.id, name:p.name }; })()`);
await page.waitForTimeout(200);
await page.tap('#bpBody [data-mg="signfree"]'); await page.waitForTimeout(300);
await page.tap('#signModal [data-sg="see"]'); await page.waitForTimeout(300);
const see = await K(`({ on:document.getElementById('signModal').classList.contains('on'), bld:curBldg, tab:curTab.club, sel:MGUI.sel, panel:document.getElementById('bldgPanel').classList.contains('show'), card:(document.querySelector('#bpBody .mgCardName')||{}).textContent||'' })`);
ok(!see.on && see.panel && see.bld === 'club' && see.tab === 'Squad' && see.sel === fb.id && see.card.includes(fb.name), 'SEE HIM IN THE SQUAD: the clubhouse, the squad, his card ("' + see.card + '")');

process.exitCode = rep.finish();
await browser.close();
