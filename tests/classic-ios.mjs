// FOOTBALL CLASSIC, THE INSTRUCTIONS ARE AN IPHONE'S (v159): the game ships as an iPhone app, so every word on how to
// play -- HOW TO PLAY, the tips over the pitch, each lab's first line and its tally, the TUNE drawer's notes, the skill
// moves page, your corner's panel -- speaks of the screen's buttons and a finger, whatever it's opened on. Here on a
// computer's page (no touch screen) and on a phone's: the same words on both, and no key, no mouse, no click anywhere.
// On a copy the test can reach.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

const orig = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
let src = orig;
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  // ===== END MANAGER CAREER', '  window.__K={ ev:s=>eval(s) };\n  // ===== END MANAGER CAREER');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-ios-')), 'classic.html');
writeFileSync(copy, src);

// a computer's words: a key, a mouse, a click
const BAD = [/\b(WASD|SPACE|ESC|Esc)\b/, /\b(mouse|click(s|ed|ing)?|keyboard|keys?)\b/i, /<kbd/i, /\bpress(ed)? [A-Z]\b/, /\(Q for/,
  /<b>[A-Z]( [A-Z])?<\/b>/, /\b[JKL] (or|to|and|\+|plays|crosses|clears|slides|heads|passes)\b/, /\bK ?\+ ?(Up|Down|W|S)\b/, /\bdouble-tap [JKL]\b/i];
const bad = t => BAD.filter(re => re.test(t)).map(String);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
const ph = await ctx.newPage();
ph.on('pageerror', e => rep.errs.push('PAGEERROR (phone): ' + e.message));
await ph.goto('file://' + copy); await ph.waitForTimeout(700);
const K = (p, s) => p.evaluate(s => window.__K.ev(s), s);

// everything a player is told, read off one page
async function words(p){
  const out = {};
  out.touch = await K(p, `isTouch`);
  out.card = await K(p, `(()=>{ ctlShow(); const c=document.querySelector('#ctlModal .ctlCard'), r={ heads:[...c.querySelectorAll('.ctlRows b')].map(b=>b.textContent), html:c.innerHTML }; ctlHide(); return r; })()`);
  out.tips = await K(p, `TIPS.map(t=>({ k:t.k, txt:t.txt, key:'key' in t, touch:'touch' in t }))`);
  out.labs = {};
  for(const kind of ['trap', 'pass', 'shoot', 'dribble', 'cross']){
    out.labs[kind] = await K(p, `(()=>{ startLab('${kind}'); return 1; })()`).then(() => p.waitForTimeout(450)).then(() =>
      K(p, `(()=>{ const tally={ trap:labTallyText, pass:passLabTallyText, shoot:shootLabTallyText, dribble:dribLabTallyText, cross:crossLabTallyText }['${kind}'];
        const keep=LAB.auto; LAB.auto=true; const a=tally(); LAB.auto=false; const b=tally(); LAB.auto=keep;
        const hint={ trap:null, pass:passLabHint, shoot:shootLabHint, dribble:dribLabHint, cross:crossLabHint }['${kind}'];
        if('${kind}'==='cross'){ const w=LAB.cWho; LAB.cWho='me'; const h=hint(); LAB.cWho=w; return { intro:document.getElementById('labResult').innerHTML, hint:h, auto:a, cue:b, chips:document.getElementById('labBar').innerHTML }; }
        return { intro:document.getElementById('labResult').innerHTML, hint:hint?hint():null, auto:a, cue:b, chips:document.getElementById('labBar').innerHTML }; })()`));
  }
  out.tune = await K(p, `Object.entries(LAB_DIAL_HINTS).map(([k,v])=>k+': '+v)`);
  out.dials = await K(p, `Object.entries(P).map(([k,d])=>k+': '+(d.label||'')+' / '+(d.hint||''))`);
  out.skills = await K(p, `(()=>{ openSkills(); const t=document.getElementById('skHint').innerHTML; closeSkills(); return t; })()`);
  out.corner = await K(p, `document.getElementById('cornerSet').innerHTML`);
  out.kbd = await K(p, `document.querySelectorAll('kbd').length`);
  out.titles = await K(p, `[...document.querySelectorAll('[title],[aria-label]')].map(e=>(e.getAttribute('title')||'')+' '+(e.getAttribute('aria-label')||''))`);
  return out;
}
const pc = await words(page), mob = await words(ph);
info('the computer page: isTouch ' + pc.touch + ', the phone page: isTouch ' + mob.touch);

// --- HOW TO PLAY ---------------------------------------------------------------------------------------------------------------
const HEADS = ['LEFT', 'PASS', 'SHOOT', 'CROSS', 'SKILL', 'DEFENDING', 'CORNERS', '☰'];
info('the card: ' + pc.card.heads.join(' | '));
ok(!pc.touch && mob.touch && pc.card.heads.join('|') === HEADS.join('|') && pc.card.html === mob.card.html && !bad(pc.card.html).length,
  'HOW TO PLAY on a computer\'s page is the phone\'s card, word for word: the left of the screen to steer, PASS, SHOOT, CROSS, SKILL, defending, your corner, ☰ -- no keys');
ok(/SKILL MOVES in the menu/.test(pc.card.html) && /− and \+/.test(pc.card.html), 'the card says where the skill moves are, and how your corner is set (− and +)');

// --- THE TIPS --------------------------------------------------------------------------------------------------------------------
ok(pc.tips.length === 5 && pc.tips.every(t => t.txt && !t.key && !t.touch && !bad(t.txt).length) && JSON.stringify(pc.tips) === JSON.stringify(mob.tips),
  'the tips over the pitch: one set of words, the buttons\' (' + pc.tips.map(t => t.k).join('') + ')');

// --- THE LABS ------------------------------------------------------------------------------------------------------------------------
for(const kind of Object.keys(pc.labs)){
  const a = pc.labs[kind], b = mob.labs[kind], all = [a.intro, a.hint || '', a.auto, a.cue, a.chips].join(' || ');
  info(kind + ' lab: "' + a.intro.replace(/<[^>]+>/g, '') + '" · "' + a.cue + '" · "' + a.auto + '"');
  ok(!bad(all).length && a.intro === b.intro && a.cue === b.cue && a.auto === b.auto && !/<kbd/.test(a.chips) && /\btap\b/i.test(a.cue),
    'the ' + kind + ' lab: its first line and its tally the phone\'s on both pages, "tap ▶ ..." for the next ball, no key on a chip' + (bad(all).length ? ' (' + bad(all).join(', ') + ')' : ''));
}
ok(/^Flick on <b>SKILL<\/b>/.test(pc.labs.trap.intro) && /^Tap <b>PASS<\/b>/.test(pc.labs.pass.hint) && /<b>Swipe<\/b>/.test(pc.labs.shoot.hint) && /^Start on <b>SKILL<\/b>/.test(pc.labs.dribble.hint) && /^Hold <b>CROSS<\/b>/.test(pc.labs.cross.hint),
  'each lab starts with its button: flick on SKILL (v212: the Trap Lab\'s touch is a match\'s -- it was tap TRAP), tap PASS, swipe (or hold SHOOT), start on SKILL, hold CROSS');
const tuneBad = pc.tune.filter(t => bad(t).length), dialBad = pc.dials.filter(t => bad(t).length);
ok(!tuneBad.length && !dialBad.length, 'the TUNE drawer\'s notes and the settings\' dials: no key, no mouse' + (tuneBad.concat(dialBad).length ? ' -- ' + tuneBad.concat(dialBad).join(' | ').slice(0, 300) : ''));

// --- THE SKILL MOVES PAGE, YOUR CORNER, THE BUTTONS' NAMES ------------------------------------------------------------------------
ok(/^Start on <b>SKILL<\/b> and draw/.test(pc.skills) && pc.skills === mob.skills && !bad(pc.skills).length, 'the skill moves page: "' + pc.skills.replace(/<[^>]+>/g, '') + '"');
ok(!/<kbd/.test(pc.corner) && /−/.test(pc.corner) && pc.kbd === 0, 'your corner\'s panel: − and +, no key beside them; no key hint anywhere on the page');
const tBad = pc.titles.filter(t => bad(t).length || /\([A-Z]\)/.test(t));
ok(!tBad.length, 'no button\'s name gives a key (' + pc.titles.length + ' names and labels)' + (tBad.length ? ' -- ' + tBad.join(' | ') : ''));

// --- AND IN THE SOURCE: no instruction left that turns on the device -----------------------------------------------------------------
const gone = ['CTL_KEYS', 'Q for on cue', 'press R or', 'Hold the <b>mouse', 'click the pitch', '<kbd', 'Press <b>SPACE</b>', "'WASD'", 'desktop-only'].filter(t => orig.includes(t));
const forked = (orig.match(/isTouch\s*\?\s*'/g) || []).length;
ok(!gone.length && !forked, 'the source keeps no computer words and no "on a touch screen this, else that" instruction' + (gone.length ? ' -- ' + gone.join(', ') : '') + (forked ? ' (' + forked + ' forks)' : ''));

process.exitCode = rep.finish();
await browser.close();
