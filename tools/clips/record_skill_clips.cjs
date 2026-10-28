#!/usr/bin/env node
// FOOTBALL CLASSIC -- the skill moves page's clips. Each move recorded as the game itself plays it: a man running at one of
// theirs 3 m ahead (who stands his ground, watching the ball: a man closing him down is on top of him, and the move can't
// be seen) -- the sombrero standing, his back to the man 1.5 m behind him, as it's done -- the move, and on: once it's done
// the stick is held the way the move sends him, and left alone while he goes to a ball of his own. Every 1/30 s: where the
// two men are, their sprites' animation, frame and way, and where the ball is. The frames are stepped at a steady 60 a second and the computer's dice
// are seeded, so a recording comes out the same every time. Run it after changing a move and the page shows the change:
//
//     node tools/clips/record_skill_clips.cjs        # rewrites the SKILL_CLIPS line in classic.html
//
// The clips carry a signature of the moves' code (mkSkill and skillStep): tests/classic-moves.mjs fails when a move has
// changed since they were recorded. Needs Playwright (as the tests do).
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), os = require('os');

const FILE = path.join(__dirname, '..', '..', 'classic.html');
// the move each clip shows, as the page's drawings have them (a way: along his run, across it, + his right), the way the
// stick goes after it (go; else the way he's facing once it's done), how far off his line the man in front stands (dy);
// back: standing, the man behind him
const MOVES = [['knock', { d: [0.87, -0.5], go: [0.87, -0.5] }], ['dragback', { d: [-0.94, 0.33] }], ['croq', { d: [0, 1], go: [1, 0] }], ['spin', { sense: 1 }], ['cruyff', { d: [-0.6, 0.8] }],
  ['rainbow', { go: [1, 0], dy: 14 }], ['sombrero', { side: 1, back: true }], ['elastico', { side: -1, go: [0.8, -0.6] }], ['heel', { d: [0.85, 0.53], go: [1, 0] }]];

const src = fs.readFileSync(FILE, 'utf8');
if(!/^  const SKILL_CLIPS = .*;$/m.test(src)) throw new Error('no SKILL_CLIPS line in classic.html');
// a copy that lets the recorder reach the match and hold the stick
let rec = src;
const patch = (a, b) => { if(rec.split(a).length !== 2) throw new Error('anchor not found once: ' + a.slice(0, 60)); rec = rec.replace(a, b); };
patch('  const LAB_TITLE=', '  window.__T={mkSkill, sig:()=>hashStr(String(mkSkill)+String(skillStep)), setSkill:s=>{ skill=s; }, skill:()=>skill, recv:()=>recvAuto, controlled:()=>controlled, players:()=>players, keepers:()=>keepers, ball:()=>ball, simNow:()=>simNow, atkOf, FW, YC, '
  + 'freeze:()=>{ restartT=0; offsideT=0; scoredT=0; gkHold=null; oneTouch=null; ftAim=null; recvAuto=null; skill=null; skillCd=0; }};\n  const LAB_TITLE=');
patch('  function checkOffsideTouch(t){\n', '  function checkOffsideTouch(t){\n    return false;\n');
patch('  function humanIntent(){\n', '  function humanIntent(){\n    if(window.__stick) return {ix:window.__stick.x, iy:window.__stick.y};\n');
const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'ftf-clips-')), 'classic.html');
fs.writeFileSync(tmp, rec);

(async () => {
  const browser = await chromium.launch(), page = await browser.newPage({ viewport: { width: 1100, height: 1000 } }), errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.addInitScript(() => {
    let vt = 0, q = [], armed = false;                  // every frame 1/60 s on, whoever asks for it
    window.requestAnimationFrame = cb => { q.push(cb); if(!armed){ armed = true; setTimeout(() => { armed = false; vt += 1000 / 60; const run = q; q = []; for(const f of run) f(vt); }, 0); } return 0; };
    let s = 20251028; Math.random = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  });
  await page.goto('file://' + tmp); await page.waitForTimeout(700);
  await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show'); await page.click('#exhGo'); await page.waitForTimeout(1200);
  const clips = { sig: await page.evaluate(() => window.__T.sig()) };   // (the moves' code they were recorded from: see tests/classic-moves.mjs)
  for(const [kind, o] of MOVES){
    clips[kind] = { fps: 30, f: await page.evaluate(({ kind, o }) => new Promise(res => {
      const T = window.__T, p = T.controlled(), b = T.ball(), atk = T.atkOf(p.team), d = T.players().filter(q => q.team !== p.team)[0];
      T.freeze();
      for(const q of T.players()) if(q !== p){ q.x = T.FW / 2 - atk * 400; q.y = 60; q.vx = q.vy = 0; }
      for(const k of T.keepers()) k.y = 30;
      const X0 = T.FW / 2, Y0 = T.YC, DX = o.back ? -34 : 70;   // where the move starts: a short run-up first (or standing, his back to the man)
      p.x = X0 - (o.back ? 0 : atk * 40); p.y = Y0; p.vx = o.back ? 0 : atk * 150; p.vy = 0; p.facing = { x: atk, y: 0 }; p.stars = 5; p.state = 'normal'; p.noTouchT = 0; p.skill = null; p.stamina = 1; p.sprint = false;
      const pin = () => { d.x = X0 + atk * DX; d.y = Y0 + atk * (o.dy || 6); d.vx = d.vy = 0; d.state = 'normal'; d.noTouchT = 99; d.tackleCd = 99;
        const fx = b.x - d.x, fy = b.y - d.y, l = Math.hypot(fx, fy) || 1; d.facing = { x: fx / l, y: fy / l }; };   // (he watches the ball)
      pin();
      b.ownedBy = p; b.x = p.x + atk * 14; b.y = p.y; b.z = 0; b.vx = p.vx; b.vy = 0; b.vz = 0; b.lob = null; b.thru = null; b.dribbler = null; b.dribbleGrace = 0; b.intendedRcv = null; b.curveSpinT = 0;
      window.__stick = o.back ? null : { x: atk, y: 0 };
      const R = Math.round, rel = (x, y) => [R((x - X0) * atk), R((y - Y0) * atk)], A = ['idle', 'run', 'shoot', 'pass', 'slide'];
      const spr = q => { const k = window.SPRITE.pick(q), dx = k[2] * atk, dy = k[3] * atk;   // (his way turned round as the pitch is, for a man running right)
        return [Math.max(0, A.indexOf(k[0])), k[1], ((Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) % 8) + 8) % 8]; };
      const f = [], t0 = T.simNow(); let tick = 0, started = null, back = null;
      (function step(){ const t = T.simNow() - t0; pin();
        if(started == null && (o.back ? t > 0.35 : atk * (p.x - X0) >= 0 || t > 0.6)){
          const m = { kind }; if(o.d) m.d = { x: o.d[0] * atk, y: o.d[1] * atk }; if(o.sense) m.sense = o.sense; if(o.side) m.side = o.side;
          T.setSkill(T.mkSkill(p, m)); b.ownedBy = p; started = t; }
        if(started != null) window.__stick = T.skill() || T.recv() ? null : o.go ? { x: o.go[0] * atk, y: o.go[1] * atk } : { x: p.facing.x, y: p.facing.y };   // (none while the move's on, or he's going to it)
        if(tick++ % 2 === 0){ const m = rel(p.x, p.y), q = rel(d.x, d.y), w = rel(b.x, b.y); f.push(m[0], m[1], ...spr(p), q[0], q[1], ...spr(d), w[0], w[1], R(b.z)); }
        if(started != null && !T.skill() && t > started + 0.05){ if(b.ownedBy !== p) back = null; else if(back == null) back = t; }   // (on it, and staying on it)
        if(t < (back != null ? back + 0.55 : started != null ? started + 2.8 : 9)) return requestAnimationFrame(step);
        window.__stick = null; res(f); })(); }), { kind, o }) };
    const n = clips[kind].f.length / 13; console.log(kind.padEnd(9), n + ' frames (' + (n / 30).toFixed(2) + ' s)');
  }
  await browser.close();
  if(errs.length) throw new Error('page errors: ' + [...new Set(errs)].slice(0, 3).join(' | '));
  const line = '  const SKILL_CLIPS = ' + JSON.stringify(clips) + ';';
  fs.writeFileSync(FILE, src.replace(/^  const SKILL_CLIPS = .*;$/m, () => line));
  console.log('SKILL_CLIPS written to classic.html: ' + (line.length / 1024).toFixed(1) + ' KB');
})().catch(e => { console.error(e); process.exit(1); });
