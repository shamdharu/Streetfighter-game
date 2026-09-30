'use strict';

/* ============================================================
 * Headless smoke test: stubs DOM/canvas, loads every game
 * script, then simulates thousands of frames of gameplay and
 * fails on any thrown error.   Run:  node tools/smoke.js
 * ============================================================ */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

/* ---------- canvas 2d context stub ---------- */
function makeCtx() {
  const grad = { addColorStop() {} };
  const store = {};
  return new Proxy(store, {
    get(t, k) {
      if (typeof k === 'symbol') return undefined;
      if (k === 'createLinearGradient' || k === 'createRadialGradient' || k === 'createPattern') {
        return () => grad;
      }
      if (k === 'measureText') return () => ({ width: 10 });
      if (k in t) return t[k];
      t[k] = () => {};
      return t[k];
    },
    set(t, k, v) { t[k] = v; return true; }
  });
}

function makeCanvasStub() {
  return { width: 0, height: 0, getContext: () => makeCtx(), style: {} };
}

/* ---------- DOM stubs ---------- */
const listeners = { load: [] };
const elements = {};
function el(id) {
  if (!elements[id]) {
    elements[id] = {
      id, textContent: '',
      classList: { toggle() {}, add() {}, remove() {} },
      addEventListener() {},
      getContext: () => makeCtx(),
      width: 0, height: 0
    };
  }
  return elements[id];
}

const rafQueue = [];

global.window = {
  addEventListener(type, fn) {
    if (type === 'load') listeners.load.push(fn);
  },
  AudioContext: undefined,
  webkitAudioContext: undefined
};
global.document = {
  getElementById: (id) => el(id),
  createElement: (tag) => (tag === 'canvas' ? makeCanvasStub() : el('tmp-' + tag))
};
global.performance = { now: () => Date.now() };
global.requestAnimationFrame = (cb) => { rafQueue.push(cb); };

/* ---------- load all scripts in one shared scope ---------- */
const files = ['input.js', 'audio.js', 'stickman.js', 'combat.js',
               'level.js', 'player.js', 'enemy.js', 'game.js'];
let source = '';
for (const f of files) {
  source += '\n// ==== ' + f + ' ====\n' +
    fs.readFileSync(path.join(ROOT, 'js', f), 'utf8');
}
vm.runInThisContext(source, { filename: 'bundle.js' });

listeners.load.forEach(fn => fn());
const game = global.window.game;
if (!game) throw new Error('Game did not boot (window.game missing)');

/* ---------- helpers ---------- */
let now = 0;
function frames(n) {
  for (let i = 0; i < n; i++) {
    now += 16.7;
    const cbs = rafQueue.splice(0, rafQueue.length);
    if (!cbs.length) throw new Error('render loop died');
    cbs.forEach(cb => cb(now));
  }
}
function press(code) {
  game.input.down[code] = true;
  game.input.pressed[code] = true;
}
function release(code) { game.input.down[code] = false; }
function tap(code, holdFrames) {
  press(code);
  frames(holdFrames || 2);
  release(code);
  frames(2);
}
function assert(cond, msg) {
  if (!cond) throw new Error('ASSERT FAILED: ' + msg);
}

/* ================= SCENARIO ================= */

// 1) boot state
assert(game.state === 'start', 'boots into start screen');
frames(3);

// 2) start the game
game.startGame();
assert(game.state === 'playing', 'game starts playing');
assert(game.level && game.player, 'level and player exist');
frames(60);

// 3) walk right 2s (triggers first enemy group)
press('KeyD');
frames(120);
release('KeyD');
frames(10);
assert(game.player.x > 300, 'player moved right, x=' + game.player.x);

// 4) J-J-K-K combo chain
tap('KeyJ'); frames(10);
tap('KeyJ'); frames(10);
tap('KeyK'); frames(10);
tap('KeyK'); frames(30);
assert(!game.player.attack, 'attack state fully recovers');

// 5) jump + air kick
tap('KeyW');
tap('KeyK', 4);
frames(60);
assert(game.player.grounded, 'player lands after jump');

// 6) fight real enemies
if (game.enemies.length === 0) game.spawnEnemy('normal', game.player.x + 90, 0);
frames(5);
for (let i = 0; i < 16 && game.enemies.length > 0; i++) {
  const t = game.enemies[0];
  game.player.x = t.x - 50;
  game.player.facing = 1;
  tap('KeyJ'); frames(14);
  tap('KeyK'); frames(18);
}
frames(60);
assert(game.kills > 0, 'enemies can be killed (kills=' + game.kills + ')');

// 7) every enemy type spawns & updates without error
['normal', 'fast', 'heavy', 'gunner', 'crazy', 'mini'].forEach(t => {
  game.spawnEnemy(t, game.player.x + 160, -1);
  game.spawnEnemy(t, game.player.x - 160, -1);
});
frames(500);
assert(game.enemies.length > 0, 'enemy AI runs');

// 8) weapons: gun ammo + melee swing (stabilize player first)
game.enemies = []; // clear leftover brawlers
if (game.player.dead) {
  game.player.dead = false;
  game.player.state = 'idle';
  game.player.rot = 0;
}
game.player.hp = game.player.maxHp;
game.player.hitstun = 0;
game.player.invuln = 30;
game.player.attack = null;
assert(game.state === 'playing', 'still playing before weapon test');
game.player.weapon = { def: WEAPONS.pistol, ammo: 14 };
game.player.x += 100;
tap('KeyL'); frames(40);
assert(game.player.weapon.ammo < 14, 'ammo consumed on shot');
game.player.weapon = { def: WEAPONS.bat, ammo: -1 };
tap('KeyL'); frames(40);

// 9) special attack consumes energy
game.player.energy = 100;
tap('Space'); frames(70);
assert(game.player.energy < 100, 'special consumed energy');

// 10) pickups
game._applyPickup('health', 0, 0);
game._applyPickup('power', 0, 0);
game._applyPickup('shield', 0, 0);
assert(game.player.shield > 0, 'shield applied');

// 11) damage reactions (hitstun, panic, flail, death)
const e2 = game.enemies.find(e => !e.isBoss);
if (e2) {
  e2.hp = 10;
  Combat.applyHit(game, game.player, e2,
    { dmg: 3, kb: 6, kby: 2, hitstop: 4, shake: 2, hitSound: 'hit' });
}
frames(400);

// 12) boss fight through phases → defeat → level complete
game.player.x = game.level.def.boss.trigger + 10;
frames(30);
const boss = game.enemies.find(e => e.isBoss);
assert(!!boss, 'boss spawned');
game.player.hp = 9999; // keep the fight deterministic for the test
let guard = 0;
while (boss && !boss.dying && guard < 6000) {
  if (guard % 40 === 0) {
    Combat.applyHit(game, game.player, boss,
      { dmg: 25, kb: 4, kby: 2, hitstop: 4, shake: 3, hitSound: 'heavy' });
  }
  frames(10);
  guard += 10;
}
assert(!boss || boss.dying, 'boss defeated (guard=' + guard + ')');
frames(320);
assert(game.state === 'levelcomplete' || game.state === 'victory',
  'level completes after boss, state=' + game.state);

// 13) advance to next level
if (game.state === 'levelcomplete') {
  game.nextLevel();
  assert(game.state === 'playing', 'level 2 starts');
  frames(120);
  press('KeyD'); frames(90); release('KeyD');
  frames(30);
}

// 14) player death → game over → retry
Combat.applyHit(game, { x: game.player.x - 40, y: game.player.y - 30, h: 0, facing: 1 },
  game.player, { dmg: 999, kb: 10, kby: 6, hitstop: 6, shake: 6, hitSound: 'heavy' });
assert(game.player.dead, 'player dies from lethal hit');
frames(220);
assert(game.state === 'gameover', 'game over shown, state=' + game.state);
game.retryLevel();
assert(game.state === 'playing', 'retry restarts level');

// 15) pause / resume
game.pause();
assert(game.state === 'paused', 'pauses');
frames(10);
game.resume();
assert(game.state === 'playing', 'resumes');

// 16) stress: many enemies + particle cap
for (let i = 0; i < 6; i++) game.spawnEnemy('fast', game.player.x + 100 + i * 30, -1);
game.spawnParticles(game.player.x, game.player.y - 30, 60, '#fff', 'spark');
game.spawnParticles(game.player.x, game.player.y - 30, 20, '#fff', 'ring');
frames(500);
assert(game.particles.length <= 260, 'particle cap: ' + game.particles.length);

// 17) escalating style ladders: each key press unlocks a NEW style
game.enemies = [];
if (game.player.dead) {
  game.player.dead = false;
  game.player.state = 'idle';
  game.player.rot = 0;
}
game.player.hp = game.player.maxHp;
game.player.hitstun = 0;
game.player.invuln = 60;
game.player.attack = null;
game.player.weapon = null;
assert(game.state === 'playing', 'playing before style tests');

function runChain(key, polls, seen) {
  press(key); frames(3); release(key);
  for (let j = 0; j < polls; j++) {
    frames(1);
    if (game.player.attack) seen.add(game.player.attack.name);
  }
}

// K → kick1 → kick2 (roundhouse) → kick3 (tornado)
const seenK = new Set();
runChain('KeyK', 14, seenK);
runChain('KeyK', 16, seenK);
runChain('KeyK', 60, seenK);
assert(seenK.has('kick1') && seenK.has('kick2') && seenK.has('kick3'),
  'K ladder styles: ' + [...seenK].join(','));
frames(20);

// J → punch1 → punch2 (hook) → punch3 (uppercut)
const seenJ = new Set();
runChain('KeyJ', 14, seenJ);
runChain('KeyJ', 16, seenJ);
runChain('KeyJ', 60, seenJ);
assert(seenJ.has('punch1') && seenJ.has('punch2') && seenJ.has('punch3'),
  'J ladder styles: ' + [...seenJ].join(','));
frames(20);

// L → weaponSwing → weaponSwing2 (reverse) → weaponSwing3 (finisher)
game.player.weapon = { def: WEAPONS.bat, ammo: -1 };
const seenL = new Set();
runChain('KeyL', 15, seenL);
runChain('KeyL', 17, seenL);
runChain('KeyL', 60, seenL);
assert(seenL.has('weaponSwing') && seenL.has('weaponSwing2') && seenL.has('weaponSwing3'),
  'weapon ladder styles: ' + [...seenL].join(','));
frames(20);

// Q drops the weapon as a world pickup
const beforeDrops = game.level.weapons.length;
press('KeyQ'); frames(4); release('KeyQ'); frames(4);
assert(!game.player.weapon, 'Q drops weapon');
assert(game.level.weapons.length === beforeDrops + 1,
  'dropped weapon becomes a pickup');

// rifle autofire while L is held
game.player.weapon = { def: WEAPONS.rifle, ammo: 50 };
press('KeyL'); frames(60); release('KeyL'); frames(40);
assert(game.player.weapon && game.player.weapon.ammo < 48,
  'rifle autofires while held, ammo=' + (game.player.weapon && game.player.weapon.ammo));
game.player.weapon = null;
frames(20);

// 18) victory path: jump to final level, beat boss, expect victory screen
game.startLevel(2);
assert(game.state === 'playing', 'level 3 starts');
game.player.x = game.level.def.boss.trigger + 10;
frames(30);
const boss3 = game.enemies.find(e => e.isBoss);
assert(!!boss3, 'final boss spawned');
game.player.hp = 9999; // keep the fight deterministic for the test
let g2 = 0;
while (boss3 && !boss3.dying && g2 < 6000) {
  if (g2 % 30 === 0) {
    Combat.applyHit(game, game.player, boss3,
      { dmg: 30, kb: 3, kby: 1, hitstop: 3, shake: 3, hitSound: 'heavy' });
  }
  frames(10);
  g2 += 10;
}
frames(320);
assert(game.state === 'victory', 'victory screen after final boss, state=' + game.state);
game.playAgain();
assert(game.state === 'playing' && game.levelIndex === 0, 'play again resets to level 1');

console.log('SMOKE TEST PASSED');
console.log('  kills=' + game.kills + ' score=' + game.score +
  ' maxCombo=' + game.maxCombo);
