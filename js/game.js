'use strict';

/* ============================================================
 * game.js — main loop, states, camera, HUD, rendering.
 * ============================================================ */

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.W = 960;
    this.H = 540;

    this.input = new Input();
    this.audio = new AudioSys();

    this.state = 'start'; // start | playing | paused | gameover | levelcomplete | victory
    this.levelIndex = 0;
    this.level = null;
    this.player = null;

    this.enemies = [];
    this.corpses = [];
    this.projectiles = [];
    this.particles = [];
    this.texts = [];

    this.score = 0;
    this.maxCombo = 0;
    this.combo = 0;
    this.comboT = 0;
    this.kills = 0;

    this.shakeMag = 0;
    this.hitstopT = 0;
    this.camera = { x: 0 };

    this.levelTime = 0;
    this.levelStartScore = 0;
    this.playerDeathT = 0;
    this.completeT = -1;

    this.screens = {
      start: document.getElementById('screen-start'),
      pause: document.getElementById('screen-pause'),
      gameover: document.getElementById('screen-gameover'),
      levelcomplete: document.getElementById('screen-levelcomplete'),
      victory: document.getElementById('screen-victory')
    };

    this._bindUI();
    this._last = performance.now();
    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  /* ================= UI & global input ================= */

  _bindUI() {
    const click = (id, fn) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('click', () => { this.audio.init(); fn.call(this); });
    };
    click('btn-start', this.startGame);
    click('btn-resume', this.resume);
    click('btn-restart', this.restartLevel);
    click('btn-retry', this.retryLevel);
    click('btn-next', this.nextLevel);
    click('btn-again', this.playAgain);

    const initAudio = () => this.audio.init();
    window.addEventListener('keydown', initAudio);
    window.addEventListener('pointerdown', initAudio);
  }

  _handleGlobalKeys() {
    const inp = this.input;
    if (inp.justPressed('KeyM')) {
      this.audio.enabled = !this.audio.enabled;
      this.addText(this.camera.x + this.W / 2, 200,
        this.audio.enabled ? 'SOUND ON' : 'SOUND OFF', '#8ff0ff');
    }
    if (inp.justPressed('KeyP', 'Escape')) {
      if (this.state === 'playing') this.pause();
      else if (this.state === 'paused') this.resume();
    }
    if (inp.justPressed('Enter')) {
      if (this.state === 'start') this.startGame();
      else if (this.state === 'gameover') this.retryLevel();
      else if (this.state === 'levelcomplete') this.nextLevel();
      else if (this.state === 'victory') this.playAgain();
    }
  }

  _showScreen(name) {
    for (const k in this.screens) {
      this.screens[k].classList.toggle('hidden', k !== name);
    }
  }

  /* ================= state transitions ================= */

  startGame() {
    this.audio.init();
    this.score = 0;
    this.maxCombo = 0;
    this.kills = 0;
    this.startLevel(0);
  }

  startLevel(i) {
    this.levelIndex = i;
    this.level = new Level(this, i);
    this.enemies = [];
    this.corpses = [];
    this.projectiles = [];
    this.particles = [];
    this.texts = [];

    this.player = new Player(this);
    this.player.reset(140);

    this.camera.x = 0;
    this.shakeMag = 0;
    this.hitstopT = 0;
    this.combo = 0;
    this.comboT = 0;
    this.levelTime = 0;
    this.levelStartScore = this.score;
    this.playerDeathT = 0;
    this.completeT = -1;

    this.input.clear();
    this.state = 'playing';
    this._showScreen(null);
    this.level.showBanner('LEVEL ' + (i + 1) + ': ' + this.level.def.name, 150);
  }

  pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this._showScreen('pause');
    this.input.clear();
  }

  resume() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this._showScreen(null);
    this.input.clear();
    this._last = performance.now();
  }

  restartLevel() {
    this.score = this.levelStartScore;
    this.startLevel(this.levelIndex);
  }

  retryLevel() {
    this.audio.init();
    this.score = this.levelStartScore;
    this.startLevel(this.levelIndex);
  }

  _gameOver() {
    if (this.state !== 'playing') return;
    this.state = 'gameover';
    document.getElementById('go-score').textContent = this.score;
    document.getElementById('go-level').textContent =
      'Level ' + (this.levelIndex + 1) + ' — ' + this.level.def.name;
    this._showScreen('gameover');
    this.audio.gameOver();
    this.input.clear();
  }

  _levelComplete() {
    if (this.state !== 'playing') return;
    if (this.levelIndex >= LEVELS.length - 1) {
      this.state = 'victory';
      document.getElementById('v-score').textContent = this.score;
      document.getElementById('v-combo').textContent = this.maxCombo;
      this._showScreen('victory');
    } else {
      this.state = 'levelcomplete';
      document.getElementById('lc-score').textContent = this.score;
      document.getElementById('lc-combo').textContent = this.maxCombo;
      document.getElementById('lc-time').textContent =
        Math.round(this.levelTime / 60) + 's';
      this._showScreen('levelcomplete');
    }
    this.audio.levelClear();
    this.input.clear();
  }

  nextLevel() {
    this.audio.init();
    this.startLevel(Math.min(LEVELS.length - 1, this.levelIndex + 1));
  }

  playAgain() {
    this.audio.init();
    this.score = 0;
    this.maxCombo = 0;
    this.kills = 0;
    this.startLevel(0);
  }

  /* ================= main loop ================= */

  _loop(ts) {
    const raw = (ts - this._last) / 16.6667;
    this._last = ts;
    const dt = Math.max(0.1, Math.min(raw, 2.5));

    this._handleGlobalKeys();

    if (this.state === 'playing') {
      if (this.hitstopT > 0) {
        // freeze the world, keep pressed inputs buffered for the next frame
        this.hitstopT -= dt;
        this.shakeMag *= Math.pow(0.9, dt);
      } else {
        this._update(dt);
        this.input.endFrame();
      }
    } else {
      this.input.endFrame();
    }

    this._render();
    requestAnimationFrame(this._loop);
  }

  /* ================= spawning & scoring ================= */

  spawnEnemy(type, x, groupId) {
    if (this.enemies.length >= 14) return null;
    const e = new Enemy(this, type, x, groupId);
    this.enemies.push(e);
    return e;
  }

  spawnBoss(bd) {
    const cfg = BOSSES[bd.id];
    const boss = new Boss(this, cfg, bd.x2 - 140);
    boss.facing = -1;
    this.enemies.push(boss);
    this.boss = boss;
    return boss;
  }

  spawnCorpse(c) { this.corpses.push(c); }

  spawnProjectile(o) {
    if (this.projectiles.length >= 40) return;
    o.life = o.life || 120;
    o.rot = o.rot || 0;
    this.projectiles.push(o);
  }

  spawnParticles(x, y, n, color, type) {
    if (this.particles.length > 260) return;
    for (let i = 0; i < n; i++) {
      if (this.particles.length > 260) break;
      const a = Math.random() * Math.PI * 2;
      const sp = 1 + Math.random() * 4;
      const p = {
        x: x, y: y, type: type || 'spark',
        color: color, life: 1, size: 2 + Math.random() * 3
      };
      if (type === 'ring') {
        p.vx = 0; p.vy = 0; p.size = 6; p.life = 1;
      } else if (type === 'dust') {
        p.vx = Math.cos(a) * sp * 0.5; p.vy = -Math.random() * 1.2;
        p.life = 0.7;
      } else if (type === 'sweat') {
        p.vx = Math.cos(a) * 1.5; p.vy = -1.5 - Math.random();
        p.life = 0.8;
      } else if (type === 'star') {
        p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp - 1;
        p.life = 1;
      } else { // spark
        p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp;
        p.life = 0.6 + Math.random() * 0.3;
      }
      p.maxLife = p.life;
      this.particles.push(p);
    }
  }

  addText(x, y, str, color) {
    if (this.texts.length > 18) this.texts.shift();
    this.texts.push({
      x: x, y: y, str: str, color: color || '#fff',
      life: 1, vy: -0.8
    });
  }

  hitstop(frames) {
    if (frames > this.hitstopT) this.hitstopT = frames;
  }

  shake(mag) {
    this.shakeMag = Math.min(16, Math.max(this.shakeMag, mag));
  }

  addHit(dmg, target) {
    this.combo++;
    this.comboT = 150; // 2.5s to keep the chain alive
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;
    this.score += Math.round(dmg * (1 + this.combo * 0.08));
    if (this.combo >= 5 && this.combo % 5 === 0) {
      this.audio.combo(Math.min(8, this.combo / 5));
      this.addText(this.player.x, this.player.y - this.player.h - 30,
        'COMBO x' + this.combo, '#ffd60a');
    }
    if (target && target.hp <= 0) { /* death score added in onEnemyDeath */ }
  }

  breakCombo() {
    if (this.combo >= 8) {
      this.addText(this.player.x, this.player.y - this.player.h - 30, 'COMBO LOST', '#ff6b81');
    }
    this.combo = 0;
    this.comboT = 0;
  }

  addScore(n) { this.score += n; }

  groupAlive(groupId) {
    if (groupId < 0) return false;
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.groupId === groupId && !e.dying) return true;
    }
    return false;
  }

  onEnemyDeath(enemy, corpse) {
    this.kills++;
    this.addScore(enemy.score);
    this.addText(corpse.x, corpse.y - Math.min(120, enemy.h + 30),
      corpse.quip, '#ffd60a');
    this.spawnParticles(enemy.x, enemy.y - enemy.h * 0.5, 10, '#ffe066', 'star');

    if (enemy.isBoss) {
      this.audio.bigDeath();
      this.shake(11);
      this.hitstop(14);
      this.level.onBossDefeated();
      this.completeT = 150;
      this.addScore(enemy.score);
      this.addText(enemy.x, enemy.y - enemy.h - 40, 'BOSS DEFEATED!', '#52ff8f');
      this.boss = null;
    } else {
      this.audio.death();
    }
  }

  /* ================= world update ================= */

  _update(dt) {
    this.levelTime += dt;
    this.level.update(dt);
    this.player.update(dt, this.input, this.level);

    // enemies
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (!e.dying) e.update(dt);
    }
    this._separateEnemies();

    // remove corpses-in-waiting (spawned via startDeath)
    if (this.enemies.some(e => e.dying)) {
      this.enemies = this.enemies.filter(e => !e.dying);
    }

    this._updateCorpses(dt);
    this._updateProjectiles(dt);
    this._updateParticles(dt);
    this._updateTexts(dt);
    this._updatePickups(dt);

    // combo decay
    if (this.comboT > 0) {
      this.comboT -= dt;
      if (this.comboT <= 0) this.combo = 0;
    }

    this._updateCamera(dt);
    this.shakeMag *= Math.pow(0.86, dt);

    // player death → game over
    if (this.player.dead) {
      this.playerDeathT += dt;
      if (this.playerDeathT > 115) this._gameOver();
    }

    // boss defeated → level complete
    if (this.completeT > 0) {
      this.completeT -= dt;
      if (this.completeT <= 0) this._levelComplete();
    }
  }

  _updateCamera(dt) {
    const p = this.player;
    let target = p.x - this.W * 0.42;
    target = Math.max(0, Math.min(this.level.width - this.W, target));
    this.camera.x += (target - this.camera.x) * Math.min(1, 0.12 * dt);
  }

  _separateEnemies() {
    const arr = this.enemies;
    for (let i = 0; i < arr.length; i++) {
      const a = arr[i];
      if (a.dying) continue;
      for (let j = i + 1; j < arr.length; j++) {
        const b = arr[j];
        if (b.dying) continue;
        const dx = b.x - a.x;
        const min = (a.w + b.w) * 0.42;
        const dy = (b.y - b.h / 2) - (a.y - a.h / 2);
        if (Math.abs(dx) < min && Math.abs(dy) < Math.max(a.h, b.h) * 0.55) {
          const push = (min - Math.abs(dx)) / 2;
          const s = dx >= 0 ? 1 : -1;
          a.x -= s * push;
          b.x += s * push;
        }
      }
    }
  }

  /* ---------------- pickups & weapon drops ---------------- */

  _updatePickups(dt) {
    const p = this.player;
    if (!p || p.dead) return;
    const lvl = this.level;

    for (let i = 0; i < lvl.pickups.length; i++) {
      const pk = lvl.pickups[i];
      if (pk.taken) continue;
      const dx = pk.x - p.x, dy = pk.y - (p.y - p.h * 0.5);
      if (dx * dx + dy * dy < 44 * 44) {
        pk.taken = true;
        this._applyPickup(pk.type, pk.x, pk.y);
      }
    }

    for (let i = 0; i < lvl.weapons.length; i++) {
      const w = lvl.weapons[i];
      if (w.taken || w.delay > 0) continue;
      const dx = w.x - p.x, dy = (w.y - 20) - (p.y - p.h * 0.5);
      if (dx * dx + dy * dy < 46 * 46) {
        w.taken = true;
        // swapping drops your old weapon right here instead of deleting it
        if (p.weapon) this.dropWeapon(w.x, w.y);
        const def = WEAPONS[w.wid];
        p.weapon = { def: def, ammo: (w.ammo != null ? w.ammo : def.ammo) };
        this.audio.powerup();
        this.addText(w.x, w.y - 50, def.name + '!', def.color);
        this.spawnParticles(w.x, w.y - 20, 12, def.color, 'spark');
        this.addScore(75);
      }
    }
  }

  /** Drop the held weapon as a collectable (Q key / weapon swap). */
  dropWeapon(x, y) {
    const p = this.player;
    if (!p || !p.weapon) return;
    const w = p.weapon;
    this.level.weapons.push({
      x: (x != null) ? x : p.x + p.facing * 24,
      y: (y != null) ? y : this.level.groundY - 18,
      wid: w.def.id,
      ammo: w.ammo,
      t: 0, taken: false,
      delay: 25 // brief grace period so you don't instantly re-pick it up
    });
    p.weapon = null;
    this.audio.dry();
    this.addText(p.x, p.y - p.h - 20, 'DROPPED ' + w.def.name, '#c9c9d6');
  }

  _applyPickup(type, x, y) {
    const p = this.player;
    const info = PICKUP_TYPES[type];
    this.audio[info.sound]();
    this.spawnParticles(x, y, 14, info.color, 'star');
    this.addScore(50);

    if (type === 'health') {
      p.heal(35);
      this.addText(x, y - 26, '+35 HP', '#ff4d6d');
    } else if (type === 'energy') {
      p.energy = Math.min(p.maxEnergy, p.energy + 55);
      this.addText(x, y - 26, '+ENERGY', '#ffd60a');
    } else if (type === 'power') {
      p.buffDmg = 600;
      this.addText(x, y - 26, 'DMG x2 (10s)!', '#ff8500');
    } else if (type === 'speed') {
      p.buffSpeed = 600;
      this.addText(x, y - 26, 'SPEED x2 (10s)!', '#52ff8f');
    } else if (type === 'shield') {
      p.shield = 1;
      this.addText(x, y - 26, 'SHIELD!', '#6ef0ff');
    }
  }

  /* ---------------- corpses (funny deaths) ---------------- */

  _updateCorpses(dt) {
    const gy = this.level.groundY;
    const list = this.corpses;
    for (let i = list.length - 1; i >= 0; i--) {
      const c = list[i];
      c.deathT += dt;
      c.animTime += dt;
      c.wobbleT += dt;
      c.life -= dt;

      if (c.mode === 'stumble' && !c.fallen) {
        // wobbles backward a few steps, then topples over
        c.x += c.vx * dt;
        c.rot = Math.sin(c.wobbleT * 0.35) * 0.3;
        if (Math.random() < 0.08 * dt) {
          this.spawnParticles(c.x, c.y - 4, 1, '#ffe066', 'star');
        }
        if (c.wobbleT > 44) {
          c.fallen = true;
          c.vy = -4;
          c.rotV = (c.vx >= 0 ? 1 : -1) * 0.13;
        }
      } else {
        c.vy += GRAVITY * dt;
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.rot += c.rotV * dt;

        if (c.y >= gy) {
          if (!c.grounded) {
            // first landing thump
            c.y = gy;
            c.grounded = true;
            const wasFast = Math.abs(c.vy) > 7;
            c.vy = 0;
            c.vx *= 0.55;
            c.rotV *= 0.35;
            this.spawnParticles(c.x, gy, 6, 'rgba(230,220,200,0.9)', 'dust');
            if (wasFast) {
              if (c.isBoss) { this.shake(7); this.audio.heavy(); }
              else this.audio.land();
            }
          } else {
            c.y = gy;
            c.vy = 0;
            c.vx *= Math.pow(0.82, dt);
            c.rotV *= Math.pow(0.8, dt);
          }
        }

        // settle flat once resting
        if (c.grounded && Math.abs(c.vx) < 0.4) {
          const flat = Math.round(c.rot / (Math.PI / 2)) * (Math.PI / 2);
          c.rot += (flat - c.rot) * Math.min(1, 0.15 * dt);
          c.rotV = 0;
        }
      }

      if (c.life <= 0) list.splice(i, 1);
    }
  }

  /* ---------------- projectiles ---------------- */

  _updateProjectiles(dt) {
    const solids = this.level.getSolids();
    const p = this.player;

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const pr = this.projectiles[i];
      pr.life -= dt;
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      if (pr.spin) pr.rot += 0.25 * dt;
      if (pr.ground) pr.y = this.level.groundY - 12;

      let dead = pr.life <= 0 ||
        pr.x < -40 || pr.x > this.level.width + 40;

      // hit walls / crates
      if (!dead) {
        const box = { x: pr.x - pr.r, y: pr.y - pr.r, w: pr.r * 2, h: pr.r * 2 };
        for (let s = 0; s < solids.length; s++) {
          if (Combat.overlap(box, solids[s])) { dead = true; break; }
        }
        if (!pr.ground && pr.y >= this.level.groundY) dead = true;
      }

      if (!dead && pr.from === 'player') {
        for (let e = 0; e < this.enemies.length; e++) {
          const en = this.enemies[e];
          if (en.dying) continue;
          const box = { x: pr.x - pr.r, y: pr.y - pr.r, w: pr.r * 2, h: pr.r * 2 };
          if (Combat.overlap(box, Combat.hurt(en))) {
            Combat.applyHit(this, {
              x: pr.x - Math.sign(pr.vx) * 24, y: pr.y, h: 0, facing: -Math.sign(pr.vx)
            }, en, {
              dmg: pr.dmg, kb: pr.kb, kby: pr.kby,
              hitstop: 5, shake: 3, hitSound: 'hit', stun: 16,
              fx: pr.color || '#ffe066'
            });
            this.spawnParticles(pr.x, pr.y, 7, pr.color || '#ffe066', 'spark');
            dead = true;
            break;
          }
        }
      } else if (!dead && pr.from === 'enemy') {
        if (p && !p.dead) {
          const box = { x: pr.x - pr.r, y: pr.y - pr.r, w: pr.r * 2, h: pr.r * 2 };
          if (Combat.overlap(box, Combat.hurt(p))) {
            Combat.applyHit(this, {
              x: pr.x - Math.sign(pr.vx) * 24, y: pr.y, h: 0, facing: -Math.sign(pr.vx)
            }, p, {
              dmg: pr.dmg, kb: pr.kb, kby: pr.kby,
              hitstop: 5, shake: 3, hitSound: 'hit', stun: 16,
              fx: pr.color || '#ffe066'
            });
            this.spawnParticles(pr.x, pr.y, 7, pr.color || '#ffe066', 'spark');
            dead = true;
          }
        }
      }

      if (dead) {
        if (pr.life <= 0 || pr.x < -40 || pr.x > this.level.width + 40) {
          this.spawnParticles(pr.x, pr.y, 3, pr.color || '#ffe066', 'spark');
        }
        this.projectiles.splice(i, 1);
      }
    }
  }

  /* ---------------- particles & floating text ---------------- */

  _updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= 0.028 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.type === 'spark' || p.type === 'star') p.vy += 0.14 * dt;
      if (p.type === 'ring') p.size += 4.5 * dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  _updateTexts(dt) {
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.y += t.vy * dt;
      t.vy *= Math.pow(0.96, dt);
      t.life -= 0.014 * dt;
      if (t.life <= 0) this.texts.splice(i, 1);
    }
  }

  /* ================= rendering ================= */

  _render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.W, this.H);

    if (!this.level) {
      // start screen backdrop
      const g = ctx.createLinearGradient(0, 0, 0, this.H);
      g.addColorStop(0, '#1b1b2e');
      g.addColorStop(1, '#0b0b14');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, this.W, this.H);
      return;
    }

    const camX = this.camera.x;
    const sx = this.shakeMag > 0.2 ? (Math.random() - 0.5) * this.shakeMag * 2 : 0;
    const sy = this.shakeMag > 0.2 ? (Math.random() - 0.5) * this.shakeMag * 2 : 0;

    this.level.drawSky(ctx);
    this.level.drawParallax(ctx, camX);

    ctx.save();
    ctx.translate(-camX + sx, sy);

    this.level.drawTerrain(ctx, camX);
    this.level.drawItems(ctx);

    // corpses
    for (let i = 0; i < this.corpses.length; i++) {
      this._drawCorpse(ctx, this.corpses[i]);
    }

    // enemies
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.x < camX - 140 || e.x > camX + 1100) continue;
      e.draw(ctx);
    }

    // player
    this.player.draw(ctx);

    this._drawProjectiles(ctx);
    this._drawParticles(ctx);
    this._drawTexts(ctx);

    ctx.restore();

    this._drawHUD(ctx);
  }

  _drawCorpse(ctx, c) {
    if (c.x < this.camera.x - 160 || c.x > this.camera.x + 1120) return;
    ctx.save();
    if (c.life < 40) ctx.globalAlpha = Math.max(0, c.life / 40);
    drawShadow(ctx, c, this.level.groundY);
    drawStickman(ctx, c);

    // boss white flag while flying
    if (c.flag && !c.grounded) {
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(c.x, c.y - c.h * 0.7);
      ctx.lineTo(c.x, c.y - c.h * 0.7 - 44);
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#bbb';
      ctx.beginPath();
      ctx.moveTo(c.x, c.y - c.h * 0.7 - 44);
      ctx.lineTo(c.x + 30, c.y - c.h * 0.7 - 38);
      ctx.lineTo(c.x, c.y - c.h * 0.7 - 30);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }

  _drawProjectiles(ctx) {
    for (let i = 0; i < this.projectiles.length; i++) {
      const pr = this.projectiles[i];
      ctx.save();
      ctx.translate(pr.x, pr.y);
      ctx.rotate(pr.rot || 0);
      ctx.fillStyle = pr.color || '#ffe066';
      if (pr.ground) {
        // shockwave mound
        ctx.beginPath();
        ctx.moveTo(-pr.r, pr.r * 0.6);
        ctx.lineTo(0, -pr.r);
        ctx.lineTo(pr.r, pr.r * 0.6);
        ctx.closePath();
        ctx.fill();
      } else if (pr.big) {
        ctx.shadowColor = pr.color;
        ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(0, 0, pr.r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(0, 0, pr.r * 0.4, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillRect(-pr.r * 1.6, -pr.r * 0.5, pr.r * 3.2, pr.r);
      }
      ctx.restore();
    }
  }

  _drawParticles(ctx) {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const a = Math.max(0, Math.min(1, p.life / (p.maxLife || 1)));
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color || '#fff';
      ctx.strokeStyle = p.color || '#fff';
      if (p.type === 'ring') {
        ctx.lineWidth = 3 * a;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'star') {
        const s = p.size;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x - s, p.y); ctx.lineTo(p.x + s, p.y);
        ctx.moveTo(p.x, p.y - s); ctx.lineTo(p.x, p.y + s);
        ctx.stroke();
      } else if (p.type === 'dust') {
        ctx.globalAlpha = a * 0.6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 1.6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  _drawTexts(ctx) {
    ctx.textAlign = 'center';
    for (let i = 0; i < this.texts.length; i++) {
      const t = this.texts[i];
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, t.life));
      ctx.font = 'bold 17px Trebuchet MS, sans-serif';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(0,0,0,0.7)';
      ctx.strokeText(t.str, t.x, t.y);
      ctx.fillStyle = t.color;
      ctx.fillText(t.str, t.x, t.y);
      ctx.restore();
    }
  }

  /* ================= HUD ================= */

  _drawHUD(ctx) {
    const p = this.player;
    if (!p) return;
    const W = this.W;

    // --- health bar ---
    const hx = 14, hy = 14, hw = 240, hh = 20;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(hx - 2, hy - 2, hw + 4, hh + 4);
    ctx.fillStyle = '#3a1220';
    ctx.fillRect(hx, hy, hw, hh);
    const hpFrac = Math.max(0, p.hp / p.maxHp);
    const hg = ctx.createLinearGradient(hx, 0, hx + hw, 0);
    hg.addColorStop(0, '#ff4d6d');
    hg.addColorStop(1, '#ff8fa3');
    ctx.fillStyle = hg;
    ctx.fillRect(hx, hy, hw * hpFrac, hh);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Trebuchet MS, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('HP ' + Math.ceil(p.hp), hx + 6, hy + 15);

    // --- energy bar ---
    const ey = hy + hh + 6, ew = 190, eh = 11;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(hx - 2, ey - 2, ew + 4, eh + 4);
    ctx.fillStyle = '#2a2a10';
    ctx.fillRect(hx, ey, ew, eh);
    ctx.fillStyle = p.energy >= PLAYER_ATTACKS.special.energy ? '#ffd60a' : '#8a7a20';
    ctx.fillRect(hx, ey, ew * (p.energy / p.maxEnergy), eh);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 9px Trebuchet MS, sans-serif';
    ctx.fillText('ENERGY (SPACE)', hx + ew + 8, ey + 9);

    // --- buff timers ---
    let by = ey + eh + 16;
    ctx.font = 'bold 11px Trebuchet MS, sans-serif';
    if (p.buffDmg > 0) {
      ctx.fillStyle = '#ff8500';
      ctx.fillText('DMG x2  ' + Math.ceil(p.buffDmg / 60) + 's', hx, by); by += 14;
    }
    if (p.buffSpeed > 0) {
      ctx.fillStyle = '#52ff8f';
      ctx.fillText('SPEED x2  ' + Math.ceil(p.buffSpeed / 60) + 's', hx, by); by += 14;
    }
    if (p.shield > 0) {
      ctx.fillStyle = '#6ef0ff';
      ctx.fillText('SHIELD READY', hx, by);
    }

    // --- level label ---
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(W / 2 - 130, 12, 260, 22);
    ctx.fillStyle = '#ffd60a';
    ctx.font = 'bold 13px Trebuchet MS, sans-serif';
    ctx.fillText('LEVEL ' + (this.levelIndex + 1) + ' — ' + this.level.def.name,
      W / 2, 28);

    // --- score ---
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(W - 186, 12, 174, 46);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px Trebuchet MS, sans-serif';
    ctx.fillText('SCORE ' + this.score, W - 16, 34);
    ctx.fillStyle = '#9ff0b1';
    ctx.font = 'bold 11px Trebuchet MS, sans-serif';
    ctx.fillText('KOs ' + this.kills + '   BEST x' + this.maxCombo, W - 16, 52);

    // --- combo counter ---
    if (this.combo >= 2) {
      const pulse = 1 + Math.sin(this.levelTime * 0.3) * 0.06;
      ctx.save();
      ctx.translate(W - 120, 150);
      ctx.scale(pulse, pulse);
      ctx.textAlign = 'center';
      ctx.font = 'bold 34px Trebuchet MS, sans-serif';
      ctx.lineWidth = 6;
      ctx.strokeStyle = 'rgba(0,0,0,0.65)';
      ctx.strokeText('COMBO x' + this.combo, 0, 0);
      ctx.fillStyle = this.combo >= 10 ? '#ff8500' : '#ffd60a';
      ctx.fillText('COMBO x' + this.combo, 0, 0);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(-60, 10, 120, 5);
      ctx.fillStyle = '#ffd60a';
      ctx.fillRect(-60, 10, 120 * (this.comboT / 150), 5);
      ctx.restore();
    }

    // --- weapon panel ---
    ctx.textAlign = 'right';
    const wy = this.H - 18;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(W - 210, this.H - 62, 196, 48);
    if (p.weapon) {
      const wd = p.weapon.def;
      ctx.fillStyle = wd.color;
      ctx.font = 'bold 15px Trebuchet MS, sans-serif';
      ctx.fillText(wd.name, W - 24, wy - 12);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px Trebuchet MS, sans-serif';
      const ammo = (wd.ammo === -1) ? 'UNLIMITED' : ('AMMO ' + p.weapon.ammo);
      ctx.fillText(ammo, W - 24, wy + 6);
    } else {
      ctx.fillStyle = '#c9c9d6';
      ctx.font = 'bold 14px Trebuchet MS, sans-serif';
      ctx.fillText('FISTS  [L = heavy]', W - 24, wy - 6);
    }

    // --- boss bar ---
    let boss = null;
    for (let i = 0; i < this.enemies.length; i++) {
      if (this.enemies[i].isBoss && !this.enemies[i].dying) { boss = this.enemies[i]; break; }
    }
    if (boss) {
      const bw = 560, bx = (W - bw) / 2, bY = this.H - 46;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(bx - 3, bY - 3, bw + 6, 30);
      ctx.fillStyle = '#3a0f14';
      ctx.fillRect(bx, bY, bw, 24);
      const frac = Math.max(0, boss.hp / boss.maxHp);
      const bg = ctx.createLinearGradient(bx, 0, bx + bw, 0);
      bg.addColorStop(0, boss.phase === 2 ? '#ff8500' : '#e63946');
      bg.addColorStop(1, boss.phase === 2 ? '#ffd60a' : '#ff8fa3');
      ctx.fillStyle = bg;
      ctx.fillRect(bx, bY, bw * frac, 24);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px Trebuchet MS, sans-serif';
      ctx.fillText(boss.name + (boss.phase === 2 ? ' — ENRAGED!' : ''),
        W / 2, bY + 17);
    }

    // --- level banner ---
    if (this.level.bannerT > 0) {
      const bt = this.level.bannerT;
      let alpha = 1;
      if (bt > 130) alpha = (150 - bt) / 20;
      else if (bt < 18) alpha = bt / 18;
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.textAlign = 'center';
      ctx.translate(W / 2, 120);
      ctx.font = 'bold 40px Trebuchet MS, sans-serif';
      ctx.lineWidth = 8;
      ctx.strokeStyle = 'rgba(0,0,0,0.75)';
      ctx.strokeText(this.level.bannerText, 0, 0);
      ctx.fillStyle = '#ffd60a';
      ctx.fillText(this.level.bannerText, 0, 0);
      ctx.restore();
    }

    // --- hurt vignette ---
    if (p.invuln > 34 && !p.dead) {
      ctx.save();
      ctx.globalAlpha = 0.22;
      const vg = ctx.createRadialGradient(W / 2, 270, 140, W / 2, 270, 520);
      vg.addColorStop(0, 'rgba(255,0,0,0)');
      vg.addColorStop(1, 'rgba(255,40,60,0.9)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, this.H);
      ctx.restore();
    }

    // hitstop flash
    if (this.hitstopT > 4) {
      ctx.save();
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, W, this.H);
      ctx.restore();
    }
  }
}

/* ================= boot ================= */
window.addEventListener('load', () => {
  window.game = new Game();
});