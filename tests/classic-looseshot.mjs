// FOOTBALL CLASSIC, SHOOT AT A BALL THAT'S NOBODY'S (v139): your striker in their box and the ball coming to him -- a pass
// along the grass, a pass in the air, one rolling across him -- and SHOOT tapped on a phone a moment before it gets to him:
// a shot every time (first time, or headed), never a slide tackle; at full stretch, a sliding finish. With one of theirs on
// the ball the button reads SLIDE and slides; with it nobody's, SHOOT. On the keyboard, K with a pass on its way to you:
// struck first time as it gets there. The sliding finish: as far as his Shot accuracy takes it, not his Slide tackle; a
// shot, never a tackle. After your shot's been saved, K is a shot again (not a bend on the old one).
import { reporter, STAR } from './_harness.mjs';
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={players:()=>players, keepers:()=>keepers, ball:()=>ball, FW, FH, YC, MK, atkOf, simNow:()=>simNow, controlled:()=>controlled, setCtl:q=>setControlled(q), ballAt, '
  + 'startSlideShot, slideShotLenOf, pressK, releaseShoot, shotQ:()=>shotQ, curve:()=>curveArmed, label:()=>{ const b=document.getElementById("shootBtn"); return b?b.textContent:""; }, '
  + 'volleyMul, firstTimeShot, ftAcc:()=>P.firstTouchAcc.val, '
  + 'freeze:()=>{ restartT=0; restartInfo=null; offsideT=0; offsidePass=null; scoredT=0; gkHold=null; kickT=0; kickBy=null; kickTo=null; skill=null; matchClock=0; advOn=false; endCurve(); recvAuto=null; oneTouch=null; ftAim=null; shotQ=null; }};\n  const LAB_TITLE=');
patch("    mStat(p,'sh'); shotSeen(p); if(meIs(p)) meBump('shots');\n", "    mStat(p,'sh'); shotSeen(p); if(meIs(p)) meBump('shots'); window.__acc=accMul; if(window.__shot) window.__shot(p, p.state==='slide'?'sliding finish':ball.ownedBy===p?'after his touch':'first time');\n");
patch("    lastGrade='HEADER!'; gradeColor=p.team==='G'?'#9dff3c':'#ff5a4d'; gradeFade=1.4;\n  }", "    lastGrade='HEADER!'; gradeColor=p.team==='G'?'#9dff3c':'#ff5a4d'; gradeFade=1.4;\n    if(window.__shot) window.__shot(p,'header');\n  }");
patch("    p.state='slide';p.stateT=0.45*slideLenOf(p)*staFac;", "    if(window.__slide) window.__slide(p); p.state='slide';p.stateT=0.45*slideLenOf(p)*staFac;");
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-loose-')), 'classic.html');
writeFileSync(copy, src);

// a scene: your striker 12 m out (14 for one across him), theirs out of the way (one coming in on a ball across him),
// and the ball on its way: 'ground' a pass to his feet, 'air' one dropping on him, 'across' rolling across him 2.6 m in
// front, 'stretch' faster and 3.3 m out
const SCENE = `window.__scene = (kind, i) => { const T = window.__T, b = T.ball(); T.freeze();
  const atk = T.atkOf('G'), gx = atk > 0 ? T.FW : 0;
  const st = T.players().filter(p => p.team === 'G' && p.role === 'ATT')[0] || T.players().filter(p => p.team === 'G')[0];
  for(const p of T.players()){ p.vx = p.vy = 0; p.state = 'normal'; p.stateT = 0; p.noTouchT = 0; p.skill = null; p.tackleCd = 0;
    if(p.team === 'R'){ p.x = T.FW / 2 - atk * 10 * T.MK; p.y = T.YC + (p.y > T.YC ? 1 : -1) * 20 * T.MK; }
    else if(p !== st){ p.x = T.FW / 2; p.y = 40 + (i % 5) * 9; } }
  for(const k of T.keepers()){ k.x = k.homeX; k.y = T.YC; k.mode = 'line'; k.claimCd = 2; }
  st.x = gx - atk * 12 * T.MK; st.y = T.YC + 3 * T.MK; st.facing = { x: atk, y: 0 }; st.stamina = st.staminaCap = 1; st.gassed = false; T.setCtl(st); window.__st = st;
  b.ownedBy = null; b.dribbler = null; b.dribbleGrace = 0; b.lastTouch = 'G'; b.shotT = 0; b.crossT = 0; b.intendedRcv = null; b.z = 0; b.vz = 0;
  if(kind === 'ground'){ b.x = st.x - atk * 18 * T.MK; b.y = st.y + 6 * T.MK; const d = Math.hypot(st.x - b.x, st.y - b.y); b.vx = (st.x - b.x) / d * 520; b.vy = (st.y - b.y) / d * 520; b.intendedRcv = st; }
  if(kind === 'air'){ b.x = st.x - atk * 16 * T.MK; b.y = st.y - 8 * T.MK; b.vx = st.x - b.x; b.vy = st.y - b.y; b.vz = 270; b.z = 1; b.intendedRcv = st; }
  if(kind === 'across' || kind === 'stretch'){ const fast = kind === 'stretch'; st.x = gx - atk * 14 * T.MK; b.x = st.x + atk * (fast ? 3.3 : 2.6) * T.MK; b.y = st.y - 5 * T.MK; b.vy = fast ? 720 : 520; b.vx = 0; b.lastTouch = 'R';
    const d = T.players().filter(p => p.team === 'R')[0]; d.x = st.x + atk * 4 * T.MK; d.y = st.y + 15 * T.MK; for(const k of T.keepers()) k.claimCd = 5; }
  window.__ev = { shot: null, slide: null }; window.__kind = kind;
  window.__shot = (p, g) => { if(p === window.__st && !window.__ev.shot) window.__ev.shot = g; };
  window.__slide = p => { if(p === window.__st && !window.__ev.slide) window.__ev.slide = 'tackle'; }; };
// the moment to press: the ball \`early\` s off getting to him (across him: off crossing his line)
window.__until = early => new Promise(res => { const T = window.__T, st = window.__st, t0 = T.simNow(); let n = 0;
  (function tick(){ let arr = 9; const b = T.ball(); if(++n < 4) return requestAnimationFrame(tick);   // (a few frames first: the button's label drawn)
    if(window.__kind === 'across' || window.__kind === 'stretch') arr = b.vy > 1 ? (st.y - b.y) / b.vy : 0;
    else for(let t = 0; t <= 2; t += 0.02){ const B = T.ballAt(t); if(Math.hypot(B.x - st.x, B.y - st.y) < 40 && B.z < 50){ arr = t; break; } }
    if(arr <= early || T.simNow() - t0 > 2.5) return res(); requestAnimationFrame(tick); })(); });
window.__after = () => new Promise(res => { const T = window.__T, t0 = T.simNow();
  (function tick(){ const e = window.__ev; if(e.shot || T.simNow() - t0 > 2.2) return res({ shot: e.shot, slide: e.slide }); requestAnimationFrame(tick); })(); });`;

// --- ON A PHONE: SHOOT, tapped as it comes ------------------------------------------------------------------------
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });
await ctx.addInitScript(() => { try{ localStorage.setItem('ftc_prefs', JSON.stringify({ diff: 'star', halfMin: 4, pv: 1, ht: 'on', tips: 0, seenCtl: 1 })); }catch(e){} });
const page = await ctx.newPage();
const rep = reporter(), { ok, info } = rep;
page.on('pageerror', e => rep.errs.push('PAGEERROR: ' + e.message));
await page.goto('file://' + copy); await page.waitForTimeout(700);
await page.tap('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show'); await page.tap('#exhGo'); await page.waitForTimeout(800);
await page.evaluate(SCENE);
const cdp = await ctx.newCDPSession(page), touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 7 }] });
const btn = await page.$eval('#shootBtn', e => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
const tapShoot = async () => { await touch('touchStart', btn.x, btn.y); await page.waitForTimeout(60); await touch('touchEnd', btn.x, btn.y); };
const res = {};
for(const [kind, earlies] of [['ground', [0.15, 0.3, 0.45, 0.6]], ['air', [0.15, 0.3, 0.45, 0.6]], ['across', [0.12, 0.15, 0.18, 0.2]]]){
  res[kind] = [];
  for(let i = 0; i < earlies.length; i++){
    await page.evaluate(([k, i]) => window.__scene(k, i), [kind, i]);
    await page.evaluate(e => window.__until(e), earlies[i]);
    const lbl = await page.evaluate(() => window.__T.label());
    await tapShoot();
    const ev = await page.evaluate(() => window.__after());
    res[kind].push({ lbl, shot: ev.shot, slide: ev.slide });
  }
}
info('tapped as it comes: ' + JSON.stringify(Object.fromEntries(Object.entries(res).map(([k, a]) => [k, a.map(r => (r.shot || (r.slide ? 'SLIDE TACKLE' : 'nothing')) + '/' + r.lbl).join(', ')]))));
const all = Object.values(res).flat();
ok(['ground', 'air', 'across'].every(k => res[k].every(r => r.shot && !r.slide)), 'a pass to his feet, one dropping on him, one rolling across him: SHOOT is a shot every time -- first time, or headed -- never a slide tackle');
ok(all.every(r => !r.slide) && all.every(r => r.lbl === 'SHOOT'), 'the button reads SHOOT while it\'s nobody\'s, and nothing\'s a slide tackle');

// ...and with one of theirs on it, it's SLIDE
{
  const r = await page.evaluate(() => new Promise(res => { const T = window.__T, b = T.ball(); window.__scene('ground', 0); const st = window.__st, o = T.players().filter(p => p.team === 'R')[1];
    o.x = st.x + T.atkOf('G') * 3 * T.MK; o.y = st.y; o.facing = { x: -T.atkOf('G'), y: 0 }; b.vx = b.vy = 0; b.x = o.x - T.atkOf('G') * (o.r + b.r + 5); b.y = o.y; b.intendedRcv = null; b.ownedBy = o; b.lastTouch = 'R';
    o.soldT = T.simNow() + 3; o.soldAt = { x: o.x, y: o.y };                                   // (held where he is, the ball at his feet)
    let n = 0; (function tick(){ if(++n > 4) return res(T.label()); requestAnimationFrame(tick); })(); }));
  await tapShoot();
  const ev = await page.evaluate(() => new Promise(res => { const T = window.__T, t0 = T.simNow(); (function tick(){ if(window.__ev.slide || T.simNow() - t0 > 0.5) return res(window.__ev); requestAnimationFrame(tick); })(); }));
  info('theirs: ' + r + ' -> ' + JSON.stringify(ev));
  ok(r === 'SLIDE' && ev.slide === 'tackle' && !ev.shot, 'one of theirs on the ball: the button reads SLIDE, and a tap slides in');
}
// ...and in your own half, a ball nobody's: SLIDE, as it was (v140) -- no shot from there
{
  const r = await page.evaluate(() => new Promise(res => { const T = window.__T, b = T.ball(); window.__scene('ground', 1); const st = window.__st, atk = T.atkOf('G');
    st.x = T.FW / 2 - atk * 20 * T.MK; st.y = T.YC; b.vx = b.vy = 0; b.intendedRcv = null; b.lastTouch = 'R'; b.x = st.x + atk * 5 * T.MK; b.y = st.y + 2 * T.MK;
    let n = 0; (function tick(){ if(++n > 4) return res(T.label()); requestAnimationFrame(tick); })(); }));
  await tapShoot();
  const ev = await page.evaluate(() => new Promise(res => { const T = window.__T, t0 = T.simNow(); (function tick(){ if(window.__ev.slide || window.__ev.shot || T.simNow() - t0 > 0.5) return res(Object.assign({ asked: !!T.shotQ() }, window.__ev)); requestAnimationFrame(tick); })(); }));
  info('your own half: ' + r + ' -> ' + JSON.stringify(ev));
  ok(r === 'SLIDE' && ev.slide === 'tackle' && !ev.shot && !ev.asked, 'in your own half, a ball nobody\'s: the button reads SLIDE and slides, as it did -- no shot from there');
}
await page.evaluate(() => window.__T.freeze());
await ctx.close();

// --- ON THE KEYBOARD: K with a pass on its way; the sliding finish's length; a shot, never a tackle; a save, then K ---
const dctx = await browser.newContext({ viewport: { width: 1100, height: 1000 } });
await dctx.addInitScript(STAR);
await dctx.addInitScript(() => { let vt = 0; window.requestAnimationFrame = cb => { setTimeout(() => { vt += 33; cb(vt); }, 0); return 0; }; });   // (frames pumped, as the harness's fastFrames)
const pg = await dctx.newPage();
pg.on('pageerror', e => rep.errs.push('PAGEERROR: ' + e.message));
await pg.goto('file://' + copy); await pg.waitForTimeout(700);
await pg.click('#smItems [data-act="exhibition"]'); await pg.waitForSelector('#exhPanel.show'); await pg.click('#exhGo'); await pg.waitForTimeout(400);
await pg.evaluate(SCENE);
const kb = [];
for(const e of [0.2, 0.4, 0.6]){
  await pg.evaluate(() => window.__scene('ground', 1));
  await pg.evaluate(x => window.__until(x), e);
  await pg.keyboard.down('KeyK'); await pg.waitForTimeout(30); await pg.keyboard.up('KeyK');
  kb.push(await pg.evaluate(() => window.__after()));
}
info('K, a pass on its way: ' + JSON.stringify(kb));
const sl = [];
for(let i = 0; i < 4; i++){
  sl.push(await pg.evaluate(i => new Promise(res => { const T = window.__T; window.__scene('stretch', i); T.pressK();   // (a fast one 3.3 m in front of him, K at once)
    const t0 = T.simNow(); (function tick(){ const e = window.__ev; if(e.shot || T.simNow() - t0 > 2) return res(e); requestAnimationFrame(tick); })(); }), i));
}
info('at full stretch: ' + JSON.stringify(sl));
ok(kb.every(r => r.shot && !r.slide), 'on the keyboard, K with a pass on its way to him: struck as it gets there (' + kb.map(r => r.shot).join(', ') + ')');
ok(sl.every(r => r.shot === 'sliding finish' && !r.slide), 'at full stretch -- a fast one 3.3 m in front of him, beyond his reach on his feet -- he slides in and strikes it (' + sl.map(r => r.shot).join(', ') + ')');
let r = await pg.evaluate(() => new Promise(res => { const T = window.__T, b = T.ball(), out = {};
  const run = (sec) => new Promise(r2 => { const t0 = T.simNow(); (function tick(){ if(T.simNow() - t0 >= sec) return r2(); requestAnimationFrame(tick); })(); });
  (async () => {
    // how far the sliding finish takes him: Shot accuracy 1 and 10, his Slide tackle the other way about -- and a slide tackle's
    for(const [sa, st] of [[1, 10], [10, 1]]){
      window.__scene('ground', 2); const p = window.__st; b.vx = b.vy = 0; b.x = p.x - 30 * T.MK; b.y = p.y;
      p.stats = Object.assign({}, p.stats, { shotAcc: sa, slideTackle: st }); p.stamina = 1;
      const x0 = p.x, y0 = p.y; T.startSlideShot(p, p.x, p.y + 200);
      await new Promise(r2 => { const t0 = T.simNow(); (function tick(){ if(p.state !== 'slide' || T.simNow() - t0 > 1) return r2(); requestAnimationFrame(tick); })(); });   // (to the end of the slide)
      out['acc' + sa] = +(Math.hypot(p.x - x0, p.y - y0) / T.MK).toFixed(2); out['len' + sa] = +T.slideShotLenOf(p).toFixed(2); await run(0.7); }
    // a sliding finish into the man on the ball: no tackle -- and into a ball nobody's: a shot at goal
    window.__scene('ground', 3); { const p = window.__st, o = T.players().filter(q => q.team === 'R')[1], atk = T.atkOf('G');
      o.x = p.x; o.y = p.y + 2 * T.MK; b.vx = b.vy = 0; b.x = o.x; b.y = o.y + o.r + b.r + 5; b.ownedBy = o; b.lastTouch = 'R'; b.intendedRcv = null; b.lastTouchP = o;
      o.soldT = T.simNow() + 3; o.soldAt = { x: o.x, y: o.y };
      T.startSlideShot(p, o.x, o.y); await run(0.6); out.tackled = b.ownedBy !== o || b.lastTouchP === p; out.noShot = !window.__ev.shot; }
    window.__scene('ground', 4); { const p = window.__st, atk = T.atkOf('G'); b.vx = b.vy = 0; b.intendedRcv = null; b.x = p.x + atk * 1.5 * T.MK; b.y = p.y + 1.5 * T.MK; b.lastTouch = 'R';
      T.startSlideShot(p, b.x, b.y);
      await new Promise(r2 => { const t0 = T.simNow(); (function tick(){ if(window.__ev.shot || T.simNow() - t0 > 0.6) return r2(); requestAnimationFrame(tick); })(); });
      out.slideShot = window.__ev.shot; out.toGoal = Math.sign(b.vx) === atk && b.shotT > 0 && b.shotBy === 'G'; }
    // in your own half, K at a ball nobody's asks for nothing (v140)
    window.__scene('ground', 2); { const p = window.__st, atk = T.atkOf('G'); p.x = T.FW / 2 - atk * 20 * T.MK; p.y = T.YC; b.vx = b.vy = 0; b.intendedRcv = null; b.lastTouch = 'R'; b.x = p.x + atk * 5 * T.MK; b.y = p.y;
      T.pressK(); out.ownHalfAsked = !!T.shotQ(); }
    // your shot, saved and parried: K is a shot again (asked for), not a bend on the old one
    window.__scene('ground', 0); { const p = window.__st, atk = T.atkOf('G'); b.vx = b.vy = 0; b.intendedRcv = null; b.x = p.x + atk * (p.r + b.r + 4); b.y = p.y; b.ownedBy = p;
      T.pressK(); T.releaseShoot(); out.armed = T.curve(); const kp = T.keepers().find(k => k.team === 'R');
      await run(0.1); b.ownedBy = null; b.lastTouchP = kp; b.lastTouch = 'R'; b.shotT = 0; b.x = p.x + atk * 8 * T.MK; b.y = p.y; b.vx = -atk * 60; b.vy = 0; b.z = 0; b.vz = 0;
      await run(0.1); out.armedAfter = T.curve(); T.pressK(); out.asked = !!T.shotQ(); }
    T.freeze(); res(out); })(); }));
info('the sliding finish: ' + JSON.stringify(r));
ok(r.acc1 >= 1.1 && r.acc1 <= 1.6 && r.acc10 >= 2.7 && r.acc10 <= 3.3 && r.len1 === 0.45 && r.len10 === 0.75,
  'the sliding finish goes as far as his Shot accuracy takes it: ' + r.acc1 + ' m at 1, ' + r.acc10 + ' m at 10 (his Slide tackle the other way about: no matter)');
ok(!r.tackled && r.noShot, 'slid into the man on the ball, it\'s no tackle: he keeps it');
ok(r.slideShot === 'sliding finish' && r.toGoal, 'slid into a ball nobody\'s, it\'s a shot at goal');
ok(r.armed && !r.armedAfter && r.asked, 'your shot saved and parried: K is a shot again, asked for -- not a bend on the old one');
ok(r.ownHalfAsked === false, 'in your own half, K at a ball nobody\'s asks for no shot (v140)');
// A VOLLEY (v179): struck first time, the ball's height and pace cost it some of his first-time accuracy -- rolling to
// him at walking pace none, at his knee at 22 m/s a seventh, at his waist at 32 m/s more than a quarter -- and the
// strike carries what's left
const vol = await pg.evaluate(() => { const T = window.__T, b = T.ball(), out = {}; window.__scene('ground', 3); const st = window.__st;
  for(const [k, z, v] of [['ground', 0, 100], ['knee', 13, 550], ['waist', 26, 800]]){ T.freeze(); st.vx = st.vy = 0; st.state = 'normal';
    Object.assign(b, { ownedBy: null, dribbler: null, x: st.x + 10, y: st.y, z, vz: 0, vx: -v, vy: 0, shotT: 0 });
    const m = T.volleyMul(st); window.__acc = null; T.firstTimeShot(); out[k] = { m: +m.toFixed(3), acc: +(window.__acc / T.ftAcc()).toFixed(3) }; }
  T.freeze(); return out; });
info('volleys, what each keeps of his first-time accuracy: ' + JSON.stringify(vol));
ok(vol.ground.m === 1 && Math.abs(vol.knee.m - 0.857) < 0.01 && Math.abs(vol.waist.m - 0.715) < 0.01 && ['ground', 'knee', 'waist'].every(k => Math.abs(vol[k].acc - vol[k].m) < 0.002),
  'a volley: rolling to him at walking pace it keeps all his first-time accuracy, at his knee at 22 m/s ' + vol.knee.m + ', at his waist at 32 m/s ' + vol.waist.m + ' -- and the strike goes with it (v178: all of it, whatever the ball)');

process.exitCode = rep.finish();
await browser.close();
