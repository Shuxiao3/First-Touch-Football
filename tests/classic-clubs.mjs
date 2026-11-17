// FOOTBALL CLASSIC, RATINGS BY PLAYSTYLE AND CLUBS AS THEY'RE SET (v202): a man is rated on what his playstyle is good
// at -- its best stats on the master sheet count 5, its worst 1, pace 6 and 5 for everyone -- each style's usual man
// rating what he did, a new career's men within a point or so of what their line's weights gave them, a saved career and
// a kept exhibition side rated again; a star with one name keeps the one name in his window in a match; a club's stars
// in the spots its settings give them (CLUB_SPOTS), a side kept from before its club's settings changed made again from
// them, one kept from before v202 stamped with the settings it was kept under; and in a career, a club of the same name
// playing the same way -- its style and shape at a new career's start and in a saved one -- and its stars in their spots.
// (v205: the weights as set on the sheet's Ratings page, 0 to 5 a stat; the clubs as set on its Teams page -- a club's
// own shape without the ball, width and team instructions, Paris Eiffel's in an exhibition and a career, a club with
// none of its own playing its style's, in its style's block whatever the last match was; Paul Jolla at Bergamont Juvenile.)
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
  for(const k in STYLE_SHEET){ const S=STYLES[k]; if(!S||S.role==='GK') continue; n++; const W=OVR_STY[k], T=OVR_W_SHEET[k];   // (v205: as set on the sheet)
    if(!W||!T||OUT_KEYS.some((x,i)=>W[x]!==T[i]||!(W[x]>=0&&W[x]<=5))) bad.push(k); }
  const pace=k=>OVR_STY[k].speed+'/'+OVR_STY[k].acceleration;
  const st={}; for(const x of ALL_STAT_KEYS) st[x]=clamp(ARCH.DEF[x]+(STYLES.stopper.d[x]||0),1,10); const at=v=>{ st.crossing=v; return cwOverallX('DEF',st,'stopper'); };
  return { n, bad, wb:OVR_STY.wingback, st:OVR_STY.stopper, cv:OVR_STY.cover, dc:OVR_STY.deepcreator, gk:ovrStyleKey('GK','shotstopper'), pace:['stopper','speedster','target','paceywinger','anchor'].map(k=>k+' '+pace(k)).join(', '), cross:at(1)===at(10) }; })()`);
info('a wing-back\'s weights: ' + JSON.stringify(w.wb));
ok(w.n === 31 && !w.bad.length && w.gk === null, 'every outfield playstyle (' + w.n + ') rated on its own weights, as set on the sheet\'s Ratings page (v205), 0 to 5 a stat; a keeper by his line\'s' + (w.bad.length ? ': ' + w.bad.join(', ') : ''));
ok(/stopper 2\/2/.test(w.pace) && /speedster 5\/5/.test(w.pace) && /target 3\/3/.test(w.pace), 'pace counts as the sheet has it: ' + w.pace + ' (speed/acceleration; v203 a stopper 3/2, a speedster 5/4, a target man 2/3; v202 6/5 for everyone)');
ok(w.wb.crossing === 5 && w.st.heading === 5 && w.st.tackle === 5 && w.dc.longPass === 5 && w.st.crossing === 0 && w.cv.crossing === 0 && w.cross === true,
  'what each is about counts most: a wing-back\'s crossing 5, a stopper\'s heading and tackling 5, a deep creator\'s long passing 5 -- and a stopper\'s and a cover centre-back\'s crossing not at all (0: a stopper crosses at 1 or 10 and rates the same)');
const cal = await K(`(()=>{ let worst=0; for(const k in OVR_STY){ const S=STYLES[k], st={}; for(const x of ALL_STAT_KEYS) st[x]=clamp(ARCH[S.role][x]+(S.d[x]||0),1,10);
    worst=Math.max(worst,Math.abs(cwOverallX(S.role,st,k)-cwOverallLin(S.role,st))); }   // (v230: against his line's straight line, what his style's usual level is reckoned from)
  const S=STYLES.wingback, mk=()=>{ const st={}; for(const x of ALL_STAT_KEYS) st[x]=clamp(ARCH[S.role][x]+(S.d[x]||0),1,10); return st; };
  const own=mk(), off=mk(); for(const x of ['crossing','stamina']) own[x]+=1.5; for(const x of ['heading','strength']) off[x]+=1.5;
  const b=cwOverallX('DEF',mk(),'wingback');
  return { worst, own:cwOverallX('DEF',own,'wingback')-b, off:cwOverallX('DEF',off,'wingback')-b, lineOwn:cwOverallX('DEF',own)-cwOverallX('DEF',mk()), lineOff:cwOverallX('DEF',off)-cwOverallX('DEF',mk()) }; })()`);
info('a wing-back of the usual make, three points more (on the sheet) at crossing and stamina: +' + cal.own.toFixed(1) + ' (his line\'s weights +' + cal.lineOwn.toFixed(1) + '); at heading and strength: +' + cal.off.toFixed(1) + ' (+' + cal.lineOff.toFixed(1) + ')');
ok(cal.worst < 0.01, 'each playstyle\'s usual man rates what he did (the most any is off: ' + cal.worst.toFixed(3) + ')');

// --- (v230) THE TOP OF A STAT COUNTS FOR MORE: a point near 10 worth more than one near 1, the more so the more his style
// needs the stat; every playstyle set on the curve at its usual man and at a man made for the Premier Division --------------
const cv = await K(`(()=>{ const out={}, lin=(k,st)=>(OVR_STY_LIN[k].A+OVR_STY_LIN[k].K*ovrMean(st,OVR_STY[k]))*10;
  const mk=k=>{ const T=STYLES[k], st={}; for(const x of ALL_STAT_KEYS) st[x]=clamp(ARCH[T.role][x]+(T.d[x]||0),1,10); return st; };
  const at81=k=>{ const T=STYLES[k], m0=mk(k); let lo=-4, hi=5; for(let i=0;i<48;i++){ const m=(lo+hi)/2; if(lin(k,ovrMakeAt(T.role,m0,m))<OVR_TOP) lo=m; else hi=m; } return ovrMakeAt(T.role,m0,lo); };
  let w0=0, w81=0; for(const k in OVR_STY){ const T=STYLES[k]; w0=Math.max(w0,Math.abs(cwOverallX(T.role,mk(k),k)-STYLE_REF[k]*10)); w81=Math.max(w81,Math.abs(cwOverallX(T.role,at81(k),k)-OVR_TOP)); }
  const top=at81('deepcreator'), at=(x,v)=>cwOverallX('MID',Object.assign({},top,{[x]:v}),'deepcreator');
  out.pass=[at('passAcc',10)-at('passAcc',9.5), at('passAcc',1.5)-at('passAcc',1)]; out.head=[at('heading',10)-at('heading',9.5), at('heading',1.5)-at('heading',1)];
  out.wPass=OVR_STY.deepcreator.passAcc; out.wHead=OVR_STY.deepcreator.heading;
  let off=0, n=0, bias=0; for(const k of ['stopper','boxtobox','poacher','winger']) for(const R of [50,60,70,81]){ let sg=0; for(let i=0;i<20;i++){ const s=cwStatsForOVR(STYLES[k].role,R,cwMul(900+i),k), v=cwOverallX(STYLES[k].role,s,k)-R; off+=Math.abs(v); sg+=v; n++; } bias=Math.max(bias,Math.abs(sg/20)); }
  Object.assign(out,{ w0, w81, made:off/n, bias, g:OVR_CURVE }); return out; })()`);
info('the curve (' + cv.g + '): a deep creator made for the Premier Division, his passing (counted ' + cv.wPass + ') 9.5 to 10 +' + cv.pass[0].toFixed(2) + ', 1 to 1.5 +' + cv.pass[1].toFixed(2) + '; his heading (counted ' + cv.wHead + ') +' + cv.head[0].toFixed(2) + ' and +' + cv.head[1].toFixed(2) + '; men made to a rating ' + cv.made.toFixed(2) + ' off it by their playstyles');
ok(cv.w0 < 0.01 && cv.w81 < 0.01, 'every playstyle on the curve where it was: its usual man at its usual level, a man made for the Premier Division at 81 (off by ' + cv.w0.toFixed(3) + ' and ' + cv.w81.toFixed(3) + ' at most)');
ok(cv.pass[0] > 1.8 * cv.pass[1] && cv.head[0] / cv.head[1] < cv.pass[0] / cv.pass[1] && cv.head[0] / cv.head[1] > 1, 'the top of a stat counts for more: a deep creator\'s passing from 9.5 to 10 is worth ' + (cv.pass[0] / cv.pass[1]).toFixed(1) + ' times what 1 to 1.5 is, his heading (a stat his style counts little) ' + (cv.head[0] / cv.head[1]).toFixed(1) + ' times');
ok(cv.bias < 0.6 && cv.made < 1.2, 'a man made to a rating rates it by his own playstyle, at any level: ' + cv.bias.toFixed(2) + ' off at most on average for a playstyle and level (each man ' + cv.made.toFixed(2) + ' off his on average: the maker stops within a point of it, the rest his own make)');
ok(cal.own > 2 * cal.off && cal.own > cal.lineOwn && cal.off < cal.lineOff, 'a wing-back better at what a wing-back does rates higher than one as much better in the air and in strength -- as his line\'s weights had it the other way round');

const cw = await K(`(()=>{ const pos={}, d=${newCareer}; let n=0, ad=0;
  for(const p of [...d.world.free, ...Object.values(d.world.clubs).flatMap(c=>c.players)]){ if(p.star||p.role==='GK') continue; const st=mgStats(p), x=cwOverallX(p.role,st,p.style)-cwOverallLin(p.role,st);   // (v230: against his line's straight line)
    const a=pos[p.subRole]=pos[p.subRole]||{n:0,s:0}; a.n++; a.s+=x; n++; ad+=Math.abs(x);
    if(p.ovr!==clamp(cwOverall(p.role,st,p.style),32,97)) return { stale:p.name }; }
  const by={}; for(const k in pos) by[k]=+(pos[k].s/pos[k].n).toFixed(2); return { by, mad:ad/n, n }; })()`);
info('a new career\'s men, by playstyle against by line: ' + JSON.stringify(cw.by) + ', ' + (cw.mad || 0).toFixed(2) + ' either way on average (' + cw.n + ' men)');
const cwLo = Math.min(...Object.values(cw.by)), cwHi = Math.max(...Object.values(cw.by));   // (a new career's men are random: a position's mean moves a tenth or two from one to the next)
ok(!cw.stale && cwLo > -0.5 && cwHi < 1 && cwHi - cwLo < 0.8 && cw.mad < 1.5, 'a new career\'s men rated by their playstyles, each position on average a shade over what their line\'s weights gave on the straight line, and none far from the rest (' + cwLo.toFixed(2) + ' to ' + cwHi.toFixed(2) + '; v230: the curve, Division 2\'s men most; within half a point of it before)' + (cw.stale ? ' (' + cw.stale + ' rated on the old weights)' : ''));
const old = await K(`(()=>{ const d=${newCareer}, c=Object.values(d.world.clubs).find(x=>!x.euro&&x.id!==d.clubId), p=c.players.find(x=>x.role!=='GK'&&Math.abs(cwOverall(x.role,mgStats(x),x.style)-cwOverall(x.role,mgStats(x)))>=1);
  if(!p) return null; const want=cwOverall(p.role,mgStats(p),p.style); p.ovr=cwOverall(p.role,mgStats(p)); delete d.w202; mgMigrate(d); return { was:cwOverall(p.role,mgStats(p)), want, now:p.ovr, flag:d.w202 }; })()`);
ok(old && old.now === old.want && old.flag === true, 'a career saved before v202: every man rated again by his playstyle when it\'s loaded (' + JSON.stringify(old) + ')');
const old3 = await K(`(()=>{ const d=${newCareer}, c=Object.values(d.world.clubs).find(x=>!x.euro&&x.id!==d.clubId), p=c.players.find(x=>x.role!=='GK'); const want=p.ovr; p.ovr=1; d.wr=204; mgMigrate(d); return { want, now:p.ovr, wr:d.wr }; })()`);
ok(old3.now === old3.want && old3.wr === 230, 'a career saved on v204\'s weights: rated again on the sheet\'s when it\'s loaded (' + JSON.stringify(old3) + ')');
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
ok(cs === 'ARS 3-2-3 neutral | BOU 3-3-2 counter | ROY 3-1-3-1 control | none', 'a career\'s club of the same name has its settings -- the Premier League\'s by their career names, the clubs from abroad by their own (' + cs + ')');
const cc = await K(`(()=>{ const d=${newCareer}; const by=n=>Object.values(d.world.clubs).find(c=>c.name===n);
  const a=by('Arsenio'), r=by('Madrid Royale'), m=by('Mancunian City'); const out={ a:a.style+' '+cwFormFor(a), r:r?r.style+' '+cwFormFor(r):'none', m:m.style+' '+cwFormFor(m) };
  a.style='direct'; delete a.form; mgMigrate(d); out.back=a.style+' '+cwFormFor(a);
  const was=CLUB_SPOTS.ARS; CLUB_SPOTS.ARS={worra:4}; const sq=careerSquad(a,'3-2-3'); delete CLUB_SPOTS.ARS; out.worra=sq.findIndex(e=>e.name==='Paul Worra');
  const sq2=careerSquad(a,'3-2-3'); CLUB_SPOTS.ARS=was; out.free=sq2.findIndex(e=>e.name==='Paul Worra'); return out; })()`);
info('a new career: Arsenio ' + cc.a + ', Madrid Royale ' + cc.r + ', Mancunian City ' + cc.m + '; Arsenio set another way in a save, loaded: ' + cc.back + '; Paul Worra at ' + cc.worra + ' (left to the computer: ' + cc.free + ')');
ok(cc.a === 'neutral 3-2-3' && cc.r === 'control 3-1-3-1' && cc.m === 'control 3-4-1', 'a new career\'s clubs of the same names play as the clubs are set: Arsenio and Mancunian City as Arsenal and Manchester City, Madrid Royale as itself');
ok(cc.back === 'neutral 3-2-3', 'a saved career: such a club set the way it\'s set now when it\'s loaded (' + cc.back + ')');
ok(cc.worra === 5, 'a star in the spot his club gives him in a career match: Paul Worra set in Arsenio\'s second central midfield spot is there (' + cc.worra + ')');


// --- v205: A CLUB'S OWN SHAPE WITHOUT THE BALL, WIDTH AND INSTRUCTIONS, AS SET ON THE SHEET; PAUL JOLLA -----------------
const ex = await K(`(()=>{ localStorage.removeItem('ft_clubsq'); const p=clubSide('PAR'), wd=id=>{ const w=clubSide(id).width; return w.atk+'/'+w.def; };
  return { pd:p.dform, pa:p.ti&&p.ti.aline, pw:wd('PAR'), bw:wd('BRE'), jw:wd('JUV'), lw:wd('LIV'),
    jolla:clubSquadGen(clubById('JUV')).findIndex(e=>e.star==='jolla'), avl:clubSquadGen(clubById('AVL')).some(e=>e.star==='jolla') }; })()`);
info('an exhibition: Paris Eiffel ' + ex.pd + ' without the ball, its forwards ' + ex.pa + ', ' + ex.pw + ' wide; Brentford ' + ex.bw + ', Bergamont Juvenile ' + ex.jw + ', Liverpool ' + ex.lw);
ok(ex.pd === '3-3-2' && ex.pa === 'conserve' && ex.pw === '1.18/1', 'Paris Eiffel as it\'s set: a 3-2-3 that defends in a 3-3-2, its forwards conserving, WIDE with the ball');
ok(ex.bw === '1.18/1' && ex.jw === '0.84/0.84' && ex.lw === '1/1', 'a club with no width of its own plays its style\'s: Brentford\'s WING PLAY wide with the ball, Bergamont Juvenile\'s COUNTER-ATTACK compact both ways, Liverpool\'s GEGENPRESS balanced');
ok(ex.jolla === 8 && !ex.avl, 'Paul Jolla plays for Bergamont Juvenile, up front in its 3-2-2-1 (' + ex.jolla + '), and not for Aston Villa');
const ko = await K(`(()=>{ localStorage.removeItem('ft_clubsq'); EXH.you='ARS'; EXH.opp='PAR'; TAC.R.def='lowblock'; kickOffExhibition();
  const par={ df:rFormDef, a:TI.R.aline, w:TAC.R.width.atk+'/'+TAC.R.width.def };
  EXH.opp='ATH'; TAC.R.def='press'; kickOffExhibition(); const ath={ df:rFormDef, a:TI.R.aline, w:TAC.R.width.atk+'/'+TAC.R.width.def };
  localStorage.removeItem('ft_clubsq'); return { par, ath }; })()`);
info('kicked off: against Paris Eiffel ' + JSON.stringify(ko.par) + ', against Madrid Athletics ' + JSON.stringify(ko.ath));
ok(ko.par.df === '3-3-2' && ko.par.a === 'conserve' && ko.par.w === '1.18/1', 'in the match, Paris Eiffel defend in their 3-3-2 with their forwards conserving, WIDE with the ball');
ok(ko.ath.df === '4-3-1' && ko.ath.w === '0.84/0.84', 'a club with no shape of its own without the ball defends in its style\'s block -- Madrid Athletics\' COUNTER-ATTACK 4-2-2 sits deep in a 4-3-1 -- whatever the last match left (it went by that till v205)');
const cx = await K(`(()=>{ const d=${newCareer}, by=n=>Object.values(d.world.clubs).find(c=>c.name===n), par=by('Paris Eiffel'), jv=by('Bergamont Juvenile'), av=by('Ashton Town');
  const out={ par:par?[par.form, par.dform, par.ti&&par.ti.aline, JSON.stringify(cwWidthFor(par)), cwDefFormFor(par), cwDefFormFor(par,'4-2-2')].join(' '):'none', jv:!!(jv&&jv.players.some(p=>p.star==='jolla')) };
  delete par.ti; delete par.dform; par.width={atk:0.84,def:0.84}; mgMigrate(d); out.back=[par.dform, par.ti&&par.ti.aline, par.width.atk].join(' ');
  const s=STARS.find(x=>x.key==='jolla'), p=jv.players.find(x=>x.star==='jolla'); jv.players.splice(jv.players.indexOf(p),1); av.players.push(p);
  p.starSig=hashStr(JSON.stringify([s.name,'AVL','Ashton Town',s.pos,s.base,s.age,s.sk,s.v])); mgMigrate(d); out.moved=jv.players.includes(p)&&!av.players.includes(p); return out; })()`);
info('a new career: Paris Eiffel ' + cx.par + '; loaded with them gone: ' + cx.back);
ok(cx.par === '3-2-3 3-3-2 conserve {"atk":1.18,"def":1} 3-3-2 4-2-2' && cx.back === '3-3-2 conserve 1.18', 'in a career, Paris Eiffel as they\'re set -- their 3-3-2 without the ball (put in another shape, its style\'s: BALANCED keeps a 4-2-2 a 4-2-2), their forwards conserving, WIDE -- in a new career and a saved one');
ok(cx.jv === true && cx.moved === true, 'in a career Paul Jolla is at Bergamont Juvenile, and a career saved with him at Ashton Town sees him go there when it\'s loaded');

process.exitCode = rep.finish() ? 1 : 0;

await browser.close();
