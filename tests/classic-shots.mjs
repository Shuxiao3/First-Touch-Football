// FOOTBALL CLASSIC, SHOTS AND THE KEEPER: a defender in a shot's way blocks it (how close it has to pass him is his
// block reach, a little more or less for his Def IQ); the keeper comes off his line to narrow the angle on a man coming
// in on goal, goes straight at the ball once he's close and takes it off him, and comes for a cross into his six-yard
// box and catches it (one to the edge of the box he leaves); a swipe shot struck off the way the man is facing is
// weaker and wilder; and the near post and side netting are drawn in front of a ball in the goal, not behind it.
// On a copy of the game that lets the test set the scene and hold the stick.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={players:()=>players, keepers:()=>keepers, controlled:()=>controlled, ball:()=>ball, P, FW, FH, YC, MK, GOAL_W, GOAL_H, atkOf, simNow:()=>simNow, '
  + 'gkHold:()=>gkHold, setControlled, blockReachOf, swipeAcross, shootAt, proj, draw:()=>draw(), cam:v=>{ camX=v; }, stick:(x,y)=>{ window.__stick={x,y}; }, '
  + 'freeze:()=>{ restartT=0; offsideT=0; scoredT=0; gkHold=null; skill=null; oneTouch=null; ftAim=null; recvAuto=null; }};\n  const LAB_TITLE=');
patch('    if(padId!==null){const l=Math.hypot(pdx,pdy);if(l>10){ix=pdx/l;iy=pdy/l;}}',
  '    if(padId!==null){const l=Math.hypot(pdx,pdy);if(l>10){ix=pdx/l;iy=pdy/l;}}\n    if(window.__stick&&(window.__stick.x||window.__stick.y)){ ix=window.__stick.x; iy=window.__stick.y; }');   // (a stick the test can hold)
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-shots-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show'); await page.click('#exhGo'); await page.waitForTimeout(1200);
await page.evaluate(() => { const T = window.__T;
  window.__park = keep => { for(const q of T.players()) if(!keep.includes(q)){ q.x = T.FW / 2 + (q.team === 'G' ? -350 : 350); q.y = 40; q.vx = q.vy = 0; q.state = 'normal'; } };
  // run frames (rAF) until done() says so or `secs` of game time pass; each() runs every frame first
  window.__until = (secs, done, each) => new Promise(res => { const t0 = T.simNow(), w0 = performance.now();
    (function tick(){ if(each) each(); const r = done(); if(r !== undefined && r !== false) return res(r);
      if(T.simNow() - t0 > secs || performance.now() - w0 > 15000) return res(null); requestAnimationFrame(tick); })(); }); });

// SHOT BLOCKS: a shot struck through a defender is blocked; one passing 25 px (1 m) off him is blocked at Def IQ 10 (a
// reach of 28 px) and not at Def IQ 1 (22 px) -- the difference kept small
const block = (off, iq) => page.evaluate(({ off, iq }) => {
  const T = window.__T, atk = T.atkOf('G'), d = T.players().find(q => q.team === 'R'); T.freeze();
  window.__park([d]); for(const k of T.keepers()){ k.x = k.homeX; k.y = T.YC + 400; }
  const keep = d.stats; d.stats = Object.assign({}, keep, { defIQ: iq });
  const put = () => { d.x = T.FW / 2 + atk * 300; d.y = T.YC + off; d.vx = d.vy = 0; d.state = 'normal'; d.facing = { x: -atk, y: 0 }; };
  put(); d.noTouchT = 0;
  const b = T.ball(); b.ownedBy = null; b.dribbler = null; b.x = d.x - atk * 260; b.y = T.YC; b.z = 0; b.vz = 90; b.vx = atk * 950; b.vy = 0; b.shotT = 1.1; b.shotBy = 'G'; b.lastTouch = 'G';
  const reach = T.blockReachOf(d);
  return window.__until(0.6, () => b.lastTouch === 'R' ? { blocked: true } : (b.x - d.x) * atk > 60 ? { blocked: false } : undefined, put)
    .then(r => { d.stats = keep; return Object.assign(r || { blocked: false }, { reach: +reach.toFixed(1), out: Math.round(Math.hypot(b.vx, b.vy)) }); });
}, { off, iq });
const on = await block(0, 5.5), edge1 = await block(25, 1), edge10 = await block(25, 10);
info('blocks: ' + JSON.stringify({ on, edge1, edge10 }));
ok(on.blocked && on.out < 600, 'a shot struck through a defender is blocked: it comes off him at ' + on.out + ' px/s (struck at 950)');
ok(edge10.blocked && !edge1.blocked && edge10.reach - edge1.reach <= 7, 'one passing 1 m off him: blocked at Def IQ 10 (reach ' + edge10.reach + ' px), not at 1 (' + edge1.reach + ' px)');

// THE KEEPER CLOSES YOU DOWN: you, on the ball, running straight at their goal from 25 m out (the pitch's metres: he
// goes by the box, 16.5 m) -- he comes off his line as you come, then goes straight at the ball and takes it off you
const kpr = await page.evaluate(() => {
  const T = window.__T, c = T.players().find(q => q.team === 'G'); T.setControlled(c); T.freeze();
  const atk = T.atkOf('G'), gx = atk > 0 ? T.FW : 0, kp = T.keepers().find(k => k.team !== 'G');
  window.__park([c]); kp.x = kp.homeX; kp.y = T.YC; kp.mode = 'line'; kp.diveT = 0; kp.groundT = 0;
  c.x = gx - atk * 25 * T.MK; c.y = T.YC + 40; c.vx = c.vy = 0; c.state = 'normal';
  const b = T.ball(); b.ownedBy = c; b.dribbler = null; b.x = c.x + atk * 25; b.y = c.y; b.z = 0; b.vx = b.vy = 0; b.shotT = 0;
  T.stick(atk, 0); let outAt20 = null;
  return window.__until(5, () => T.gkHold() === kp ? { held: true } : undefined, () => { const bo = Math.abs(gx - b.x); if(outAt20 === null && bo < 20 * T.MK) outAt20 = Math.round(Math.abs(gx - kp.x)); })
    .then(r => { T.stick(0, 0); return Object.assign(r || { held: false }, { ballOut: Math.round(Math.abs(gx - b.x)), kpOut: Math.round(Math.abs(gx - kp.x)), outAt20 }); });
});
info('the keeper and you: ' + JSON.stringify(kpr));
ok(kpr.outAt20 >= 40 && kpr.outAt20 <= 110, 'coming in on goal, the keeper comes off his line to narrow the angle (' + kpr.outAt20 + ' px out with you 20 m out)');
ok(kpr.held && kpr.kpOut > 120 && kpr.ballOut > 150, 'then he goes at the ball and takes it off you, ' + Math.round(kpr.kpOut / 25) + ' m off his line');

// CROSSES: one whipped into his six-yard box he comes for and catches, over their heads; one to the edge of the box he
// leaves
const cross = spotOut => page.evaluate(spotOut => {
  const T = window.__T, atk = T.atkOf('G'), gx = atk > 0 ? T.FW : 0, kp = T.keepers().find(k => k.team !== 'G'); T.freeze();
  window.__park([]); kp.x = kp.homeX; kp.y = T.YC; kp.mode = 'line'; kp.claimCd = 0; kp.diveT = 0; kp.groundT = 0;
  const b = T.ball(), sx = gx - atk * 140, sy = T.YC - 420, tx = gx - atk * spotOut, ty = T.YC, t = 0.95, zH = 34 * 1.15;
  b.ownedBy = null; b.dribbler = null; b.x = sx; b.y = sy; b.z = 2; b.vx = (tx - sx) / t; b.vy = (ty - sy) / t; b.vz = (zH + 260 * t * t) / t;
  b.crossBy = 'G'; b.crossT = 1.6; b.lastTouch = 'G'; b.shotT = 0;
  return window.__until(2, () => T.gkHold() === kp ? { caught: true, z: Math.round(b.z), out: Math.round(Math.abs(gx - kp.x)) } : b.z <= 0 ? { caught: false } : undefined);
}, spotOut);
const six = await cross(90), edge = await cross(330);
info('crosses: ' + JSON.stringify({ six, edge }));
ok(six && six.caught && six.z > 40, 'a cross into his six-yard box: he comes for it and catches it ' + (six ? six.z : '?') + ' px up (the bar is at 69), over their heads');
ok(edge && !edge.caught, 'one to the edge of the box, he leaves');

// A SWIPE OFF HIS LINE: nothing up to 25 degrees off the way he faces, the full cost from 150; struck across his body
// it goes slower and wilder
const sw = await page.evaluate(() => {
  const T = window.__T, c = T.controlled(), atk = T.atkOf(c.team); T.freeze(); c.facing = { x: atk, y: 0 };
  const across = [0, 30, 60, 90, 120, 150, 180].map(a => +T.swipeAcross(c, { x: atk * Math.cos(a * Math.PI / 180), y: Math.sin(a * Math.PI / 180) }).toFixed(2));
  const shots = x => { let sp = 0, s1 = 0, s2 = 0; const n = 300; const b = T.ball();
    for(let i = 0; i < n; i++){ b.ownedBy = c; b.x = c.x + atk * 20; b.y = c.y; b.z = 0; b.vx = b.vy = 0; c.vx = c.vy = 0;
      T.shootAt(c, atk, 0.6, 0.8, 0, undefined, 0, x); const a = Math.atan2(b.vy, b.vx * atk); sp += Math.hypot(b.vx, b.vy); s1 += a; s2 += a * a; }
    b.vx = b.vy = 0; b.shotT = 0; b.shotBy = null; return { sp: Math.round(sp / n), sd: +(Math.sqrt(Math.max(0, s2 / n - (s1 / n) ** 2)) * 180 / Math.PI).toFixed(2) }; };
  c.x = (atk > 0 ? T.FW : 0) - atk * 300; c.y = T.YC;   // (on the edge of the box: no long-range penalty)
  return { across, square: shots(0), turned: shots(1) };
});
info('swipes: ' + JSON.stringify(sw));
ok(sw.across[0] === 0 && sw.across[1] < 0.1 && sw.across[3] > 0.4 && sw.across[3] < 0.6 && sw.across[5] === 1, 'off his line: ' + sw.across.join(', ') + ' at 0, 30, 60, 90, 120, 150, 180 degrees');
ok(sw.turned.sp < sw.square.sp * 0.6 && sw.turned.sd > sw.square.sd * 1.5, 'struck across his body it goes slower (' + sw.turned.sp + ' against ' + sw.square.sp + ' px/s) and wilder (spread ' + sw.turned.sd + ' against ' + sw.square.sd + ' degrees)');

// THE NEAR POST IN FRONT: a ball in the goal just inside the near post is drawn behind it -- the post's own colours
// where they cross, not the ball's -- in the pixel art and in the plain pitch
const post = await page.evaluate(() => {
  const T = window.__T, atk = T.atkOf('G'), gx = atk > 0 ? T.FW : 0, cv = document.querySelector('canvas'), g = cv.getContext('2d'); T.freeze();
  window.__park([]); for(const k of T.keepers()){ k.x = T.FW / 2; k.y = 40; }
  const b = T.ball(); b.ownedBy = null; b.dribbler = null; b.inNet = atk; b.x = gx + atk * 7; b.y = T.YC + T.GOAL_W / 2 - 10; b.z = 22; b.vx = b.vy = b.vz = 0;
  T.cam(gx - atk * 250);
  const look = () => { T.draw(); const s = T.proj(gx, T.YC + T.GOAL_W / 2, 22), bs = T.proj(b.x, b.y, b.z), out = [];
    for(const dy of [-2, 0, 2]){ const d = g.getImageData(Math.round(s.x), Math.round(bs.y) + dy, 1, 1).data; out.push('#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join('')); }
    return { cols: out, over: Math.abs(bs.x - s.x) < 9 }; };
  const pixel = look(); PITCH.enable(false); const plain = look(); PITCH.enable(true);
  b.inNet = 0; b.x = T.FW / 2; b.y = T.YC; b.z = 0;
  return { pixel, plain };
});
info('the near post: ' + JSON.stringify(post));
const ballCols = ['#1c1c28', '#2c2c3c', '#f8f8f4'];
ok(post.pixel.over && post.pixel.cols.every(c => ['#f8f8f8', '#313852'].includes(c)), 'a ball in the goal by the near post is behind the post (' + post.pixel.cols.join(' ') + ')');
ok(post.plain.over && post.plain.cols.every(c => !ballCols.includes(c)) && post.plain.cols.includes('#f4f8f4'), '...in the plain pitch too (' + post.plain.cols.join(' ') + ')');

process.exitCode = rep.finish();
await browser.close();
