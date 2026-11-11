// FOOTBALL CLASSIC, RATINGS BY PLAYSTYLE AND CLUBS AS THEY'RE SET (v202): a man is rated on what his playstyle is good
// at -- its best stats on the master sheet count 5, its worst 1, pace 6 and 5 for everyone -- each style's usual man
// rating what he did, a new career's men within a point or so of what their line's weights gave them, a saved career and
// a kept exhibition side rated again; a star with one name keeps the one name in his window in a match; a club's stars
// in the spots its settings give them (CLUB_SPOTS), a side kept from before its club's settings changed made again from
// them, one kept from before v202 stamped with the settings it was kept under; and in a career, a club of the same name
// playing the same way -- its style and shape at a new career's start and in a saved one -- and its stars in their spots.
// On a copy of the game that lets the test reach inside.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  // ===== END MANAGER CAREER', '  window.__K={ ev:s=>eval(s) };\n  // ===== END MANAGER CAREER');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-clubs-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
const K = s => page.evaluate(s => window.__K.ev(s), s);
await page.evaluate(() => localStorage.removeItem('ft_clubsq'));
const newCareer = `mgNewCareer({slot:'x', manager:'Sam Okafor', clubName:'Fenmoor Athletic', colors:['#d4202a','#ffffff'], code:'FEN', crest:null})`;

// --- A MAN'S RATING BY HIS PLAYSTYLE ---------------------------------------------------------------------------------------
const w = await K(`(()=>{ const bad=[]; let n=0;
  for(const k in STYLE_SHEET){ const S=STYLES[k]; if(!S||S.role==='GK') continue; n++; const W=OVR_STY[k], P=STYLE_SHEET[k], ks=OUT_KEYS.filter(x=>x!=='speed'&&x!=='acceleration');
    const hi=Math.max(...ks.map(x=>P[OUT_KEYS.indexOf(x)])), lo=Math.min(...ks.map(x=>P[OUT_KEYS.indexOf(x)]));
    if(!W||W.speed!==6||W.acceleration!==5||ks.some(x=>W[x]<1||W[x]>5)||ks.some(x=>P[OUT_KEYS.indexOf(x)]===hi&&W[x]!==5)||ks.some(x=>P[OUT_KEYS.indexOf(x)]===lo&&W[x]!==1)) bad.push(k); }
  return { n, bad, wb:OVR_STY.wingback, st:OVR_STY.stopper, dc:OVR_STY.deepcreator, gk:ovrStyleKey('GK','shotstopper') }; })()`);
info('a wing-back\'s weights: ' + JSON.stringify(w.wb));
ok(w.n === 31 && !w.bad.length && w.gk === null, 'every outfield playstyle (' + w.n + ') rated on its own weights: its best stats 5, its worst 1, the rest between, and pace above all, speed 6 and acceleration 5; a keeper by his line\'s' + (w.bad.length ? ': ' + w.bad.join(', ') : ''));
ok(w.wb.crossing === 5 && w.wb.stamina === 5 && w.wb.heading === 1 && w.st.heading === 5 && w.st.tackle === 5 && w.st.dribbling === 1 && w.dc.longPass === 5 && w.dc.heading === 1,
  'what each is about counts most: a wing-back\'s crossing and stamina 5 and heading 1, a stopper\'s heading and tackling 5 and dribbling 1, a deep creator\'s long passing 5');
const cal = await K(`(()=>{ let worst=0; for(const k in OVR_STY){ const S=STYLES[k], st={}; for(const x of ALL_STAT_KEYS) st[x]=clamp(ARCH[S.role][x]+(S.d[x]||0),1,10);
    worst=Math.max(worst,Math.abs(cwOverallX(S.role,st,k)-cwOverallX(S.role,st))); }
  const S=STYLES.wingback, mk=()=>{ const st={}; for(const x of ALL_STAT_KEYS) st[x]=clamp(ARCH[S.role][x]+(S.d[x]||0),1,10); return st; };
  const own=mk(), off=mk(); for(const x of ['crossing','stamina']) own[x]+=1.5; for(const x of ['heading','strength']) off[x]+=1.5;
  const b=cwOverallX('DEF',mk(),'wingback');
  return { worst, own:cwOverallX('DEF',own,'wingback')-b, off:cwOverallX('DEF',off,'wingback')-b, lineOwn:cwOverallX('DEF',own)-cwOverallX('DEF',mk()), lineOff:cwOverallX('DEF',off)-cwOverallX('DEF',mk()) }; })()`);
info('a wing-back of the usual make, three points more (on the sheet) at crossing and stamina: +' + cal.own.toFixed(1) + ' (his line\'s weights +' + cal.lineOwn.toFixed(1) + '); at heading and strength: +' + cal.off.toFixed(1) + ' (+' + cal.lineOff.toFixed(1) + ')');
ok(cal.worst < 0.01, 'each playstyle\'s usual man rates what he did (the most any is off: ' + cal.worst.toFixed(3) + ')');
ok(cal.own > 2 * cal.off && cal.own > cal.lineOwn && cal.off < cal.lineOff, 'a wing-back better at what a wing-back does rates higher than one as much better in the air and in strength -- as his line\'s weights had it the other way round');

const cw = await K(`(()=>{ const pos={}, d=${newCareer}; let n=0, ad=0;
  for(const p of [...d.world.free, ...Object.values(d.world.clubs).flatMap(c=>c.players)]){ if(p.star||p.role==='GK') continue; const st=mgStats(p), x=cwOverallX(p.role,st,p.style)-cwOverallX(p.role,st);
    const a=pos[p.subRole]=pos[p.subRole]||{n:0,s:0}; a.n++; a.s+=x; n++; ad+=Math.abs(x);
    if(p.ovr!==clamp(cwOverall(p.role,st,p.style),30,95)) return { stale:p.name }; }
  const by={}; for(const k in pos) by[k]=+(pos[k].s/pos[k].n).toFixed(2); return { by, mad:ad/n, n }; })()`);
info('a new career\'s men, by playstyle against by line: ' + JSON.stringify(cw.by) + ', ' + (cw.mad || 0).toFixed(2) + ' either way on average (' + cw.n + ' men)');
ok(!cw.stale && Object.values(cw.by).every(v => Math.abs(v) < 0.5) && cw.mad < 1.2, 'a new career\'s men rated by their playstyles, each position within half a point on average of what their line\'s weights gave' + (cw.stale ? ' (' + cw.stale + ' rated on the old weights)' : ''));
const old = await K(`(()=>{ const d=${newCareer}, c=Object.values(d.world.clubs).find(x=>!x.euro&&x.id!==d.clubId), p=c.players.find(x=>x.role!=='GK'&&Math.abs(cwOverall(x.role,mgStats(x),x.style)-cwOverall(x.role,mgStats(x)))>=1);
  if(!p) return null; const want=cwOverall(p.role,mgStats(p),p.style); p.ovr=cwOverall(p.role,mgStats(p)); delete d.w202; mgMigrate(d); return { was:cwOverall(p.role,mgStats(p)), want, now:p.ovr, flag:d.w202 }; })()`);
ok(old && old.now === old.want && old.flag === true, 'a career saved before v202: every man rated again by his playstyle when it\'s loaded (' + JSON.stringify(old) + ')');
const kept = await K(`(()=>{ const sq=clubSquadGen(clubById('LIV')); for(const e of sq) e.ovr=1;
  localStorage.setItem('ft_clubsq',JSON.stringify({LIV:{squad:sq, lineup:defaultLineup(), form:'3-2-3', dform:null, sig:clubSig(clubById('LIV'))}}));
  const s=clubSide('LIV'); localStorage.removeItem('ft_clubsq'); return s.squad.every(e=>e.ovr===overallOf(e)&&e.ovr>1); })()`);
ok(kept === true, 'an exhibition side kept from before: each man rated as ratings go now');

const st = await K(`(()=>{ localStorage.setItem('ft_clubsq',JSON.stringify({ ARS:{ squad:[], lineup:{gk:0,atk:[],def:[]}, form:'3-2-3' } }));
  clubSidesStamp(); const o=JSON.parse(localStorage.getItem('ft_clubsq')||'{}'); localStorage.removeItem('ft_clubsq'); return { sig:o.ARS?o.ARS.sig:'none', want:clubSig(clubById('ARS')) }; })()`);
const boot = src.includes('\n  clubSidesStamp();\n');   // (called as the game loads)
ok(st.sig === st.want && boot, 'a side kept before v202 is stamped, as the game loads, with the settings it was kept under (' + JSON.stringify(st) + ')');

// --- A STAR WITH ONE NAME --------------------------------------------------------------------------------------------------
const nm = await K(`[fullName('Mancala',true), fullName('Abbott'), fullName('Paul Worra')].join('|')`);
ok(/^Mancala\|\S+ Abbott\|Paul Worra$/.test(nm), 'a star goes by what he\'s called -- Mancala, not a first name and Mancala -- while a club\'s man with only his surname is given one (' + nm + ')');
await K(`EXH.you='ROY'; EXH.opp='LIV'`);
await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show');
await page.click('#exhGo'); await page.waitForTimeout(700);
const hud = await K(`(()=>{ const m=players.find(p=>p.team==='G'&&p.pname==='Mancala'); if(!m) return null; controlled=m; rpKey=''; playerHud(); return { uniq:m.uniq, name:document.getElementById('rpName').textContent }; })()`);
ok(hud && hud.uniq === true && hud.name === 'Mancala', 'in a match, Madrid Royale\'s Mancala\'s window says Mancala (' + JSON.stringify(hud) + ')');
await page.evaluate(() => { localStorage.removeItem('ft_clubsq'); });

// --- A CLUB AS IT'S SET ----------------------------------------------------------------------------------------------------
const sp = await K(`(()=>{ const at=()=>clubSquadGen(clubById('ROY')).map((e,i)=>e.star?e.star+'@'+(i-1):null).filter(Boolean).join(' ');
  const before=at(); CLUB_SPOTS.ROY={magic:5, zayn:3}; const after=at(); delete CLUB_SPOTS.ROY; return { before, after }; })()`);
info('Madrid Royale\'s stars, as placed and as set: ' + sp.before + ' | ' + sp.after);
ok(/magic@3/.test(sp.before) && /zayn@5/.test(sp.before) && /magic@5/.test(sp.after) && /zayn@3/.test(sp.after) && /mancala@0/.test(sp.after) && /star@7/.test(sp.after),
  'a club\'s stars in the spots its settings give them -- Luka Magic in Madrid Royale\'s AM spot and Zacary Zayn in the DM, if they\'re set so -- the rest placed round them');
const sf = await K(`(()=>{ const c=clubById('ROY'), was=c.form; c.form='4-2-2'; const sq=clubSquadGen(c), pos=sq.slice(1,9).map(e=>natPos(e)).join(' '), st=sq.map((e,i)=>e.star?e.star+'@'+POS_OF['4-2-2'][i-1]:null).filter(Boolean).join(' '); c.form=was; return { pos, st }; })()`);
ok(/^FB CB CB FB /.test(sf.pos) && /mancala@FB/.test(sf.st) && /star@ST/.test(sf.st), 'set in another shape, its squad is made for it and its stars placed in it: 4-2-2, ' + sf.pos + ' (' + sf.st + ')');
const ks = await K(`(()=>{ const c=clubById('ROY'), sq=clubSquadGen(c); sq[2].name='Kept Man';
  const save=sig=>localStorage.setItem('ft_clubsq',JSON.stringify({ROY:{squad:sq, lineup:defaultLineup(), form:'3-1-3-1', dform:null, sig}}));
  save(clubSig(c)); const a=clubSide('ROY').squad[2].name; save(clubSig(c)); CLUB_SPOTS.ROY={magic:5}; const b=clubSide('ROY').squad[2].name; delete CLUB_SPOTS.ROY; localStorage.removeItem('ft_clubsq'); return { a, b }; })()`);
ok(ks.a === 'Kept Man' && ks.b !== 'Kept Man', 'a side kept with its club is kept while the club\'s set the same, and made again from its settings once they\'ve changed (' + JSON.stringify(ks) + ')');

// --- IN A CAREER -----------------------------------------------------------------------------------------------------------
const cs = await K(`[cwClubSet('Arsenio'), cwClubSet('BurnMouth'), cwClubSet('Madrid Royale'), cwClubSet('Fenmoor Athletic')].map(x=>x?x.id+' '+x.form+' '+x.style:'none').join(' | ')`);
ok(cs === 'ARS 3-2-3 control | BOU 3-3-2 gegen | ROY 3-1-3-1 control | none', 'a career\'s club of the same name has its settings -- the Premier League\'s by their career names, the clubs from abroad by their own (' + cs + ')');
const cc = await K(`(()=>{ const d=${newCareer}; const by=n=>Object.values(d.world.clubs).find(c=>c.name===n);
  const a=by('Arsenio'), r=by('Madrid Royale'), m=by('Mancunian City'); const out={ a:a.style+' '+cwFormFor(a), r:r?r.style+' '+cwFormFor(r):'none', m:m.style+' '+cwFormFor(m) };
  a.style='direct'; delete a.form; mgMigrate(d); out.back=a.style+' '+cwFormFor(a);
  CLUB_SPOTS.ARS={worra:4}; const sq=careerSquad(a,'3-2-3'); delete CLUB_SPOTS.ARS; out.worra=sq.findIndex(e=>e.name==='Paul Worra');
  const sq2=careerSquad(a,'3-2-3'); out.free=sq2.findIndex(e=>e.name==='Paul Worra'); return out; })()`);
info('a new career: Arsenio ' + cc.a + ', Madrid Royale ' + cc.r + ', Mancunian City ' + cc.m + '; Arsenio set another way in a save, loaded: ' + cc.back + '; Paul Worra at ' + cc.worra + ' (left to the computer: ' + cc.free + ')');
ok(cc.a === 'control 3-2-3' && cc.r === 'control 3-1-3-1' && cc.m === 'control 4-1-3', 'a new career\'s clubs of the same names play as the clubs are set: Arsenio and Mancunian City as Arsenal and Manchester City, Madrid Royale as itself');
ok(cc.back === 'control 3-2-3', 'a saved career: such a club set the way it\'s set now when it\'s loaded (' + cc.back + ')');
ok(cc.worra === 5, 'a star in the spot his club gives him in a career match: Paul Worra set in Arsenio\'s second central midfield spot is there (' + cc.worra + ')');

process.exitCode = rep.finish() ? 1 : 0;

await browser.close();
