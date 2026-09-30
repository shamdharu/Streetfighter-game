'use strict';

/* ============================================================
 * enemy.js — enemy types, AI behaviours, funny deaths, bosses.
 * ============================================================ */

let ENEMY_UID = 1;

/* ---------------- type configs ---------------- */

const ENEMY_TYPES = {
  normal: {
    name: 'GRUNT', hp: 45, speed: 2.2, score: 100,
    scale: 1, w: 30, h: 70, armor: 0,
    range: 78, attackCd: [45, 75],
    style: { body: '#141414', cloth: '#e63946', clothType: 'headband' },
    attack: {
      pose: 'enemyJab', f: { s: 10, a: 5, r: 16 },
      dmg: 9, reach: 52, kb: 6, kby: 2,
      hitstop: 5, shake: 2, sound: 'punch', hitSound: 'hit', stun: 16
    }
  },
  fast: {
    name: 'SPRINTER', hp: 24, speed: 4.5, score: 150,
    scale: 0.92, w: 27, h: 64, armor: 0,
    range: 62, attackCd: [25, 45],
    style: { body: '#141414', cloth: '#ffd60a', clothType: 'scarf' },
    attack: {
      pose: 'enemyJab', f: { s: 6, a: 4, r: 11 },
      dmg: 6, reach: 46, kb: 4.5, kby: 1,
      hitstop: 4, shake: 1.5, sound: 'punch', hitSound: 'hit', stun: 12
    }
  },
  heavy: {
    name: 'HEAVY', hp: 110, speed: 1.35, score: 280,
    scale: 1.45, w: 44, h: 100, armor: 0.55,
    range: 92, attackCd: [70, 105],
    style: { body: '#141414', cloth: '#7b2cbf', clothType: 'belt' },
    attack: {
      pose: 'enemyHeavy', f: { s: 18, a: 6, r: 26 },
      dmg: 17, reach: 70, kb: 13, kby: 6,
      hitstop: 8, shake: 5, sound: 'heavy', hitSound: 'heavy', stun: 24
    }
  },
  gunner: {
    name: 'GUNNER', hp: 30, speed: 2.6, score: 200,
    scale: 1, w: 30, h: 70, armor: 0,
    range: 300, attackCd: [80, 120], preferred: 230,
    style: { body: '#141414', cloth: '#2ec27e', clothType: 'visor' },
    attack: {
      pose: 'shoot', f: { s: 9, a: 3, r: 15 }, gun: true,
      dmg: 8, speed: 10, kb: 5, kby: 1,
      hitstop: 4, shake: 2, sound: 'gun', hitSound: 'hit', stun: 14
    },
    melee: { // weak kick if cornered
      pose: 'enemyKick', f: { s: 9, a: 4, r: 14 },
      dmg: 6, reach: 50, kb: 5, kby: 1,
      hitstop: 4, shake: 1.5, sound: 'kick', hitSound: 'hit', stun: 14
    }
  },
  crazy: {
    name: 'WACKO', hp: 38, speed: 3.3, score: 180,
    scale: 1.05, w: 30, h: 74, armor: 0,
    range: 70, attackCd: [35, 70],
    style: { body: '#141414', cloth: '#ff8500', clothType: 'mohawk' },
    attack: {
      pose: 'enemyFlail', f: { s: 7, a: 8, r: 15 },
      dmg: 8, reach: 60, kb: 7, kby: 3,
      hitstop: 5, shake: 2.5, sound: 'kick', hitSound: 'hit', stun: 16
    }
  },
  mini: {
    name: 'THE WALL', hp: 200, speed: 1.7, score: 600,
    scale: 1.7, w: 50, h: 118, armor: 0.5,
    range: 105, attackCd: [65, 95], showName: true,
    style: { body: '#141414', cloth: '#5a5a72', clothType: 'vest' },
    attack: {
      pose: 'enemyHeavy', f: { s: 20, a: 6, r: 28 },
      dmg: 20, reach: 82, kb: 15, kby: 7,
      hitstop: 9, shake: 6, sound: 'heavy', hitSound: 'heavy', stun: 26
    }
  },
  // base entry used by Boss via super(); every field is overwritten by BOSSES cfg
  boss: {
    name: 'BOSS', hp: 300, speed: 2.2, score: 1500,
    scale: 2.1, w: 62, h: 146, armor: 0.7,
    range: 110, attackCd: [50, 80], showName: true,
    style: { body: '#141414', cloth: '#e63946', clothType: 'belt' },
    attack: {
      pose: 'bossSwipe', f: { s: 20, a: 9, r: 28 },
      dmg: 18, reach: 96, kb: 16, kby: 8,
      hitstop: 10, shake: 6, sound: 'heavy', hitSound: 'heavy', stun: 26
    }
  }
};

/* ---------------- boss configs ---------------- */

const BOSSES = {
  brute: {
    id: 'brute', name: 'BIG BRUTE',
    scale: 2.15, w: 64, h: 150, speed: 2.3, armor: 0.75,
    style: { body: '#141414', cloth: '#e63946', clothType: 'belt' },
    moves: ['charge', 'slam', 'swipe'],
    melee: {
      pose: 'bossSwipe', f: { s: 22, a: 10, r: 30 },
      dmg: 18, reach: 96, kb: 16, kby: 8,
      hitstop: 9, shake: 6, sound: 'heavy', hitSound: 'heavy', stun: 26
    }
  },
  duelist: {
    id: 'duelist', name: 'THE DUELIST',
    scale: 2.0, w: 56, h: 140, speed: 3.5, armor: 0.6,
    style: { body: '#141414', cloth: '#7b2cbf', clothType: 'headband' },
    moves: ['dashSlash', 'throw', 'leapSlash'],
    melee: {
      pose: 'bossSwipe', f: { s: 16, a: 8, r: 24 },
      dmg: 15, reach: 88, kb: 12, kby: 6,
      hitstop: 8, shake: 5, sound: 'swing', hitSound: 'heavy', stun: 22
    },
    ranged: { dmg: 12, speed: 12, kb: 7, color: '#d7dee8' }
  },
  megabot: {
    id: 'megabot', name: 'MEGABOT',
    scale: 2.3, w: 66, h: 158, speed: 2.7, armor: 0.7,
    style: { body: '#1c1f26', cloth: '#2ec27e', clothType: 'visor' },
    moves: ['charge', 'slam', 'barrage', 'summon'],
    melee: {
      pose: 'bossSwipe', f: { s: 20, a: 9, r: 28 },
      dmg: 19, reach: 100, kb: 17, kby: 8,
      hitstop: 10, shake: 7, sound: 'heavy', hitSound: 'heavy', stun: 26
    },
    ranged: { dmg: 13, speed: 9, kb: 9, color: '#66ff9e' }
  }
};

/* ---------------- base enemy ---------------- */

const DEATH_QUIPS = ['OOF!', 'BONK!', 'WHACK!', 'POW!', 'YEET!', 'SPLAT!',
                     'ZONK!', 'WHOOPS!', 'SEE YA!'];

class Enemy {
  constructor(game, type, x, groupId) {
    this.game = game;
    this.type = type;
    this.uid = ENEMY_UID++;
    this.groupId = (groupId != null) ? groupId : -1;

    const c = ENEMY_TYPES[type];
    this.cfg = c;
    this.isBoss = false;
    this.name = c.name;
    this.showName = !!c.showName;

    this.x = x;
    this.y = game.level.groundY;
    this.vx = 0; this.vy = 0;
    this.w = c.w; this.h = c.h;
    this.scale = c.scale;
    this.armor = c.armor || 0;
    this.score = c.score;
    this.style = c.style;

    this.hp = c.hp; this.maxHp = c.hp;
    this.facing = -1;
    this.state = 'idle';
    this.grounded = true;
    this.onPlatform = false;
    this.dropTimer = 0;
    this.animTime = Math.random() * 100;
    this.runCycle = 0.3 + Math.random() * 0.08;
    this.runAmp = 0.85;

    this.attack = null;
    this.attackCd = 30 + Math.random() * 50;
    this.shootCd = 60 + Math.random() * 60;
    this.decideT = 0;
    this.hitstun = 0;
    this.invuln = 0;
    this.flash = 0;
    this.expr = null;
    this.exprT = 0;
    this.wantFlail = false;

    this.dying = false;
    this.panicked = false;
    this.panicT = 0;
    this.flailT = 0;
  }

  /* ---------------- update ---------------- */

  update(dt) {
    this.animTime += dt;
    if (this.flash > 0) this.flash -= dt;
    if (this.exprT > 0) { this.exprT -= dt; if (this.exprT <= 0) this.expr = null; }

    // ---- hitstun ----
    if (this.hitstun > 0) {
      this.hitstun -= dt;
      this.state = 'hit';
      Combat.move(this, this.game.level, dt);
      this.vx *= Math.pow(0.86, dt);
      if (this.hitstun <= 0) {
        this.vx = 0;
        if (this.wantFlail && this.type === 'crazy') {
          this.state = 'flail';
          this.flailT = 26;
        } else {
          this.state = 'idle';
          this.attackCd = Math.min(this.attackCd, 30);
        }
      }
      return;
    }

    // ---- panic (holds head & runs away) ----
    if (this.state === 'panic') {
      this.panicT -= dt;
      if (Math.random() < 0.12 * dt) {
        this.game.spawnParticles(this.x, this.y - this.h - 6, 1, '#7ad7ff', 'sweat');
      }
      Combat.move(this, this.game.level, dt);
      if (this.panicT <= 0) {
        this.state = 'idle';
        this.vx = 0;
        this.attackCd = 35;
      }
      return;
    }

    // ---- crazy flail reaction ----
    if (this.state === 'flail') {
      this.flailT -= dt;
      this.vx *= Math.pow(0.9, dt);
      Combat.move(this, this.game.level, dt);
      if (this.flailT <= 0) this.state = 'idle';
      return;
    }

    if (this.attack) this._updateAttack(dt);
    else this._ai(dt);

    Combat.move(this, this.game.level, dt);
    if (!this.grounded) this.onPlatform = false;
  }

  /* ---------------- AI ---------------- */

  _ai(dt) {
    const p = this.game.player;
    if (!p || p.dead) {
      this.vx = 0;
      this.state = 'idle';
      return;
    }

    const dx = p.x - this.x;
    const adist = Math.abs(dx);
    this.facing = dx >= 0 ? 1 : -1;
    this.attackCd -= dt;
    this.shootCd -= dt;
    this.decideT -= dt;
    const c = this.cfg;

    switch (this.type) {
      case 'gunner': {
        if (adist < 165) {
          // back off!
          this.vx = -this.facing * c.speed;
          if (this.grounded && adist < 110 && Math.random() < 0.03 * dt) {
            this.vy = -13; // hop away
          }
          if (adist < 62 && this.attackCd <= 0) { // cornered kick
            this._startAttack(c.melee);
            this.attackCd = this._cd();
          }
        } else if (adist > c.preferred + 90) {
          this.vx = this.facing * c.speed;
        } else {
          this.vx *= Math.pow(0.8, dt);
          if (this.shootCd <= 0) {
            this._startAttack(c.attack);
            this.shootCd = this._cd();
            this.attackCd = this._cd();
          }
        }
        break;
      }

      case 'crazy': {
        // erratic decisions
        if (this.decideT <= 0) {
          this.decideT = 30 + Math.random() * 50;
          const r = Math.random();
          this.aiMode = (r < 0.55) ? 'charge' : (r < 0.75) ? 'retreat' : 'wiggle';
        }
        if (this.aiMode === 'charge') {
          this.vx = this.facing * c.speed * (0.8 + Math.sin(this.animTime * 0.3) * 0.5);
        } else if (this.aiMode === 'retreat') {
          this.vx = -this.facing * c.speed * 0.8;
        } else {
          this.vx = Math.sin(this.animTime * 0.25) * c.speed;
          if (Math.random() < 0.01 * dt && this.grounded) this.vy = -12;
        }
        if (adist < c.range && this.attackCd <= 0 && Math.random() < 0.08 * dt) {
          this._startAttack(c.attack);
          this.attackCd = this._cd();
        }
        break;
      }

      case 'fast': {
        const strikeAt = c.range * 0.85;
        if (adist > strikeAt) {
          const burst = adist > 220 ? 1.35 : 1;
          this.vx = this.facing * c.speed * burst;
        } else {
          this.vx *= Math.pow(0.7, dt);
          if (this.attackCd <= 0) {
            this._startAttack(c.attack);
            this.attackCd = this._cd();
          }
        }
        break;
      }

      default: { // normal, heavy, mini — close in to actual striking distance
        const strikeAt = c.range * 0.78;
        if (adist > strikeAt) {
          this.vx = this.facing * c.speed;
        } else {
          this.vx *= Math.pow(0.6, dt);
          if (this.attackCd <= 0) {
            this._startAttack(c.attack);
            this.attackCd = this._cd();
          }
        }
        break;
      }
    }

    this.state = Math.abs(this.vx) > 0.2 ? 'run' : 'idle';
  }

  _cd() {
    const r = this.cfg.attackCd;
    return r[0] + Math.random() * (r[1] - r[0]);
  }

  /* ---------------- enemy attacks ---------------- */

  _startAttack(def) {
    this.attack = {
      def: def, name: def.pose, t: 0,
      phase: 'startup', prog: 0, fired: false,
      hitIds: new Set()
    };
    this.vx = 0;
    this.state = 'attack';
  }

  _updateAttack(dt) {
    const a = this.attack;
    const F = a.def.f;
    a.t += dt;
    const t = a.t;

    if (t < F.s) {
      a.phase = 'startup'; a.prog = t / F.s;
    } else if (t < F.s + F.a) {
      a.phase = 'active'; a.prog = (t - F.s) / F.a;
      if (!a.fired) {
        a.fired = true;
        if (a.def.gun) this._shootAtPlayer();
        else if (a.def.sound) this.game.audio[a.def.sound]();
      }
      if (!a.def.gun) {
        Combat.tryHit(this.game, this, this.game.player, this._atkBoxDef(a.def));
      }
    } else if (t < F.s + F.a + F.r) {
      a.phase = 'recovery'; a.prog = (t - F.s - F.a) / F.r;
    } else {
      this.attack = null;
      this.state = 'idle';
    }
  }

  /** Adds hitbox geometry (reach/oy/h) scaled to this enemy's size. */
  _atkBoxDef(def) {
    if (!def._box) {
      def._box = {
        reach: def.reach,
        oy: Math.round(this.h * 0.72),
        h: Math.round(this.h * 0.42)
      };
    }
    const box = def._box;
    return {
      dmg: def.dmg, reach: box.reach, oy: box.oy, h: box.h,
      kb: def.kb, kby: def.kby, hitstop: def.hitstop, shake: def.shake,
      hitSound: def.hitSound, stun: def.stun
    };
  }

  _shootAtPlayer() {
    const p = this.game.player;
    if (!p || p.dead) return;
    const def = this.attack.def;
    this.game.audio.gun();
    const dx = p.x - this.x;
    const dy = (p.y - p.h * 0.55) - (this.y - this.h * 0.6);
    const dist = Math.max(1, Math.hypot(dx, dy));
    const sp = def.speed || 10;
    this.game.spawnProjectile({
      from: 'enemy',
      x: this.x + this.facing * 26,
      y: this.y - this.h * 0.62,
      vx: (dx / dist) * sp,
      vy: (dy / dist) * sp,
      dmg: def.dmg, kb: def.kb, kby: def.kby || 0,
      color: '#ffe066', r: 4, life: 150
    });
    this.game.spawnParticles(this.x + this.facing * 30, this.y - this.h * 0.62,
      4, '#ffe066', 'spark');
  }

  /* ---------------- damage reactions ---------------- */

  onDamaged(dir) {
    this.expr = 'hurt';
    this.exprT = 34;
    this.wantFlail = false;

    // crazy stickman flails absurdly when hit
    if (this.type === 'crazy') this.wantFlail = Math.random() < 0.6;

    // badly damaged enemies may grab their head and run away
    if (!this.panicked && !this.isBoss && this.hp > 0 &&
        this.hp / this.maxHp < 0.32 && Math.random() < 0.4) {
      this.startPanic(dir);
    }
  }

  startPanic(dir) {
    this.panicked = true;
    this.state = 'panic';
    this.panicT = 85;
    this.attack = null;
    this.hitstun = 0;
    this.vx = dir * 6.2;
    this.game.audio.death();
    this.game.addText(this.x, this.y - this.h - 14, 'AAAAH!', '#7ad7ff');
  }

  /* ---------------- funny cartoon death ---------------- */

  startDeath(dir, atk) {
    if (this.dying) return;
    this.dying = true;

    const r = Math.random();
    const mode = r < 0.3 ? 'fly' : r < 0.55 ? 'launch' : r < 0.8 ? 'spin' : 'stumble';
    const corpse = {
      isCorpse: true, uid: this.uid,
      state: 'corpse', mode: mode,
      x: this.x, y: this.y,
      vx: 0, vy: 0, rot: 0, rotV: 0,
      w: this.w, h: this.h, scale: this.scale,
      style: this.style, facing: this.facing,
      animTime: this.animTime, wobbleT: 0,
      grounded: false, life: 260, fallen: false,
      flag: false, quip: DEATH_QUIPS[(Math.random() * DEATH_QUIPS.length) | 0],
      deathT: 0
    };

    const power = (atk && atk.kb) || 8;
    if (mode === 'fly') {
      corpse.vx = dir * (9 + power * 0.35);
      corpse.vy = -11;
      corpse.rotV = dir * 0.32;
    } else if (mode === 'launch') {
      corpse.vx = dir * 2.5;
      corpse.vy = -17;
      corpse.rotV = dir * 0.5;
    } else if (mode === 'spin') {
      corpse.vx = dir * (7 + power * 0.2);
      corpse.vy = -7;
      corpse.rotV = dir * 0.6;
    } else { // stumble: wobbles backward, then topples
      corpse.vx = dir * 2.4;
      corpse.vy = -2;
      corpse.mode = 'stumble';
    }

    this.game.spawnCorpse(corpse);
    this.game.onEnemyDeath(this, corpse);
  }

  /* ---------------- drawing ---------------- */

  draw(ctx) {
    const gy = this.game.level.groundY;
    drawShadow(ctx, this, gy);
    drawStickman(ctx, this);

    // small hp bar when damaged
    if (this.hp < this.maxHp && this.hp > 0) {
      const w = 34 * this.scale;
      const x = this.x - w / 2;
      const y = this.y - this.h - 14;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(x - 1, y - 1, w + 2, 6);
      ctx.fillStyle = '#ff4d6d';
      ctx.fillRect(x, y, w * (this.hp / this.maxHp), 4);
    }

    // name label for big guys
    if (this.showName || this.isBoss) {
      ctx.fillStyle = '#ffd60a';
      ctx.font = 'bold 11px Trebuchet MS, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.name, this.x, this.y - this.h - 20);
    }

    // telegraph glow during heavy attack startup
    if (this.attack && this.attack.phase === 'startup' && this.attack.def.f.s >= 14) {
      ctx.save();
      ctx.globalAlpha = 0.35 + Math.sin(this.animTime * 0.4) * 0.2;
      ctx.strokeStyle = '#ff4d6d';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.x, this.y - this.h * 0.5, this.h * 0.55, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}

/* ---------------- boss ---------------- */

class Boss extends Enemy {
  constructor(game, cfg, x) {
    super(game, 'boss', x, -1);
    this.cfg = { attackCd: [40, 40], style: cfg.style, speed: cfg.speed };
    this.bossCfg = cfg;
    this.isBoss = true;
    this.name = cfg.name;
    this.showName = true;

    const bd = game.level.def.boss;
    this.x = x;
    this.y = game.level.groundY;
    this.vx = 0; this.vy = 0;
    this.w = cfg.w; this.h = cfg.h;
    this.scale = cfg.scale;
    this.armor = cfg.armor;
    this.score = bd.score;
    this.style = cfg.style;

    this.hp = bd.hp; this.maxHp = bd.hp;
    this.facing = -1;
    this.state = 'idle';
    this.grounded = true;
    this.onPlatform = false;
    this.dropTimer = 0;
    this.animTime = 0;
    this.runCycle = 0.22;
    this.runAmp = 0.7;

    this.attack = null;
    this.hitstun = 0;
    this.invuln = 0;
    this.flash = 0;
    this.expr = null;
    this.exprT = 0;
    this.dying = false;

    this.phase = 1;
    this.mode = null;
    this.modeT = 0;
    this.modeStage = 0;
    this.modeCd = 50;
    this.lastMove = null;
    this.fired = false;
  }

  /* ---------------- update ---------------- */

  update(dt) {
    this.animTime += dt;
    if (this.flash > 0) this.flash -= dt;
    if (this.exprT > 0) { this.exprT -= dt; if (this.exprT <= 0) this.expr = null; }

    // short flinch (reacts to hits but keeps pressure)
    if (this.hitstun > 0) {
      this.hitstun -= dt;
      this.state = 'hit';
      Combat.move(this, this.game.level, dt);
      this.vx *= Math.pow(0.85, dt);
      if (this.hitstun <= 0) {
        this.state = 'idle';
        this.vx = 0;
        this.mode = null;
        this.modeT = 0;
        this.modeCd = Math.min(this.modeCd, 35);
      }
      return;
    }

    // phase 2 — boss gets angry at 50% hp
    if (this.phase === 1 && this.hp < this.maxHp * 0.5 && this.hp > 0) {
      this.phase = 2;
      this.game.level.showBanner(this.name + ' IS ANGRY!', 110);
      this.game.audio.roar();
      this.game.shake(9);
      this.game.hitstop(10);
      this.game.spawnParticles(this.x, this.y - this.h * 0.6, 24, '#ff8500', 'spark');
      this.game.addText(this.x, this.y - this.h - 30, 'RAGE MODE!', '#ff8500');
    }

    if (this.mode) {
      this._runMode(dt);
    } else {
      this._idle(dt);
    }

    Combat.move(this, this.game.level, dt);
    if (!this.grounded) this.onPlatform = false;
  }

  _idle(dt) {
    const p = this.game.player;
    if (!p || p.dead) { this.vx = 0; this.state = 'idle'; return; }
    const dx = p.x - this.x;
    this.facing = dx >= 0 ? 1 : -1;
    this.modeCd -= dt;

    const adist = Math.abs(dx);
    if (adist > 110) {
      this.vx = this.facing * this.bossCfg.speed * (this.phase === 2 ? 1.25 : 1);
      this.state = 'run';
    } else {
      this.vx *= Math.pow(0.7, dt);
      this.state = 'idle';
    }

    if (this.modeCd <= 0) this._chooseMode();
  }

  _chooseMode() {
    const moves = this.bossCfg.moves;
    let pick = moves[(Math.random() * moves.length) | 0];
    if (pick === this.lastMove && moves.length > 1) {
      pick = moves[(Math.random() * moves.length) | 0];
      if (pick === this.lastMove) pick = moves[(moves.indexOf(pick) + 1) % moves.length];
    }
    this.lastMove = pick;
    this.mode = pick;
    this.modeT = 0;
    this.modeStage = 0;
    this.fired = false;
    this.attack = null;
    this.vx = 0;
    this._modeHits = new Set();
  }

  _endMode(recover) {
    this.mode = 'recover';
    this.modeT = 0;
    this.recoverLen = recover || 36;
    this.attack = null;
  }

  _pose(name, phase, prog) {
    this.attack = {
      name: name, phase: phase, prog: prog,
      def: this.bossCfg.melee, hitIds: this._modeHits || null,
      t: 0, fired: this.fired
    };
    this.state = 'attack';
  }

  _runMode(dt) {
    this.modeT += dt;
    const t = this.modeT;
    const p = this.game.player;
    const lvl = this.game.level;
    const ph2 = this.phase === 2;
    const melee = this.bossCfg.melee;

    switch (this.mode) {

      case 'charge': {
        if (!this._modeHits) this._modeHits = new Set();
        if (t < 34) {
          this._pose('enemyHeavy', 'startup', t / 34);
          this.vx = 0;
          this.game.shake(0.6 * dt);
        } else if (t < 150) {
          this._pose('enemyHeavy', 'active', (t - 34) / 116);
          this.vx = this.facing * 12 * (ph2 ? 1.35 : 1);
          Combat.tryHit(this.game, this, p, this._chargeAtk(), this._modeHits);
          const b = lvl.getBounds();
          if (this.x <= b.x1 + 45 || this.x >= b.x2 - 45) {
            // crashed into the wall — funny dizzy stagger
            this.mode = 'stun';
            this.modeT = 0;
            this.vx = 0;
            this.attack = null;
            this.game.shake(7);
            this.game.audio.heavy();
            this.game.spawnParticles(this.x, this.y - this.h * 0.7, 14, '#ffe066', 'star');
            this.game.addText(this.x, this.y - this.h - 24, 'DIZZY!', '#ffe066');
          }
        } else this._endMode(38);
        break;
      }

      case 'stun': { // hit the wall
        this.vx = 0;
        this.state = 'hit';
        this.expr = 'hurt';
        this.exprT = 4;
        if (Math.random() < 0.3 * dt) {
          this.game.spawnParticles(
            this.x + (Math.random() - 0.5) * 40, this.y - this.h - 10,
            1, '#ffe066', 'star');
        }
        if (t > 52) this._endMode(34);
        break;
      }

      case 'swipe': {
        if (!this._modeHits) this._modeHits = new Set();
        if (t < melee.f.s) {
          this._pose(melee.pose, 'startup', t / melee.f.s);
          this.vx = 0;
        } else if (t < melee.f.s + melee.f.a) {
          this._pose(melee.pose, 'active', (t - melee.f.s) / melee.f.a);
          if (!this.fired) { this.fired = true; this.game.audio.swing(); }
          Combat.tryHit(this.game, this, p, this._atkBoxDef(melee), this._modeHits);
        } else if (t < melee.f.s + melee.f.a + melee.f.r) {
          this._pose(melee.pose, 'recovery', (t - melee.f.s - melee.f.a) / melee.f.r);
        } else this._endMode(30);
        break;
      }

      case 'dashSlash': { // duelist crosses the arena
        if (!this._modeHits) this._modeHits = new Set();
        if (t < 20) {
          this._pose('bossSwipe', 'startup', t / 20);
          this.vx = 0;
        } else if (t < 52) {
          this._pose('bossSwipe', 'active', (t - 20) / 32);
          this.vx = this.facing * 13;
          if (!this.fired) { this.fired = true; this.game.audio.swing(); }
          Combat.tryHit(this.game, this, p, this._atkBoxDef(melee), this._modeHits);
        } else if (t < 84) {
          this._pose('bossSwipe', 'recovery', (t - 52) / 32);
          this.vx *= Math.pow(0.85, dt);
        } else this._endMode(30);
        break;
      }

      case 'recover': {
        this.vx *= Math.pow(0.8, dt);
        this.state = 'idle';
        this.attack = null;
        if (t >= this.recoverLen) {
          this.mode = null;
          this.modeCd = (ph2 ? 38 : 68) + Math.random() * 30;
        }
        break;
      }

      case 'slam': {
        if (!this._modeHits) this._modeHits = new Set();
        if (this.modeStage === 0 && t < 28) {
          this._pose('enemyHeavy', 'startup', t / 28);
          this.vx = 0;
          this.game.shake(0.5 * dt);
        } else if (this.modeStage === 0) {
          this.modeStage = 1;
          this.vy = -15;
          this.vx = Math.max(-7, Math.min(7, (p.x - this.x) * 0.06));
          this.game.audio.jump();
        } else if (this.modeStage === 1) {
          this._pose('enemyHeavy', 'active', 0.5);
          if (this.grounded && t > 40) {
            // LAND! shockwaves both ways
            this.game.shake(10);
            this.game.hitstop(9);
            this.game.audio.heavy();
            this.game.spawnParticles(this.x, this.y, 18, 'rgba(230,220,200,0.9)', 'dust');
            this.game.spawnProjectile({
              from: 'enemy', x: this.x, y: lvl.groundY - 12,
              vx: 7, vy: 0, dmg: 14, kb: 13, kby: 7,
              color: '#ffb703', r: 10, life: 80, ground: true
            });
            this.game.spawnProjectile({
              from: 'enemy', x: this.x, y: lvl.groundY - 12,
              vx: -7, vy: 0, dmg: 14, kb: 13, kby: 7,
              color: '#ffb703', r: 10, life: 80, ground: true
            });
            const dx = Math.abs(p.x - this.x);
            if (dx < 90 && p.grounded) {
              Combat.applyHit(this.game, this, p, {
                dmg: 16, kb: 14, kby: 8, hitstop: 10, shake: 8,
                hitSound: 'heavy', stun: 26
              });
            }
            this._endMode(44);
          }
        }
        break;
      }

      case 'throw': { // knives / energy balls
        if (t < 24) {
          this._pose('enemyJab', 'startup', t / 24);
          this.vx = 0;
        } else if (t < 27) {
          this._pose('enemyJab', 'active', 0.5);
          if (!this.fired) {
            this.fired = true;
            this.game.audio.gun();
            const r = this.bossCfg.ranged;
            const dx = p.x - this.x;
            const dy = (p.y - p.h * 0.5) - (this.y - this.h * 0.6);
            const base = Math.atan2(dy, dx);
            for (let i = -1; i <= 1; i++) {
              const ang = base + i * 0.28;
              this.game.spawnProjectile({
                from: 'enemy',
                x: this.x + Math.cos(ang) * 30,
                y: this.y - this.h * 0.6,
                vx: Math.cos(ang) * r.speed,
                vy: Math.sin(ang) * r.speed,
                dmg: r.dmg, kb: r.kb, kby: 4,
                color: r.color, r: 6, life: 160, spin: true
              });
            }
          }
        } else if (t > 58) this._endMode(32);
        break;
      }

      case 'leapSlash': {
        if (!this._modeHits) this._modeHits = new Set();
        if (this.modeStage === 0 && t < 16) {
          this._pose('bossSwipe', 'startup', t / 16);
          this.vx = 0;
        } else if (this.modeStage === 0) {
          this.modeStage = 1;
          this.vy = -13;
          this.vx = Math.max(-8, Math.min(8, (p.x - this.x) * 0.07));
          this.game.audio.jump();
        } else if (this.modeStage === 1) {
          this._pose('bossSwipe', 'active', 0.6);
          Combat.tryHit(this.game, this, p, this._atkBoxDef(this.bossCfg.melee), this._modeHits);
          if (this.grounded && t > 30) {
            this.game.shake(6);
            this.game.audio.heavy();
            this.game.spawnParticles(this.x, this.y, 10, 'rgba(230,220,200,0.9)', 'dust');
            this._endMode(36);
          }
        }
        break;
      }

      case 'barrage': { // megabot energy spray
        if (t < 30) {
          this._pose('enemyHeavy', 'startup', t / 30);
          this.vx = 0;
        } else if (t < 34) {
          this._pose('enemyHeavy', 'active', 0.5);
          if (!this.fired) {
            this.fired = true;
            this.game.audio.gun();
            const r = this.bossCfg.ranged;
            const dx = p.x - this.x;
            const dy = (p.y - p.h * 0.5) - (this.y - this.h * 0.6);
            const base = Math.atan2(dy, dx);
            for (let i = -2; i <= 2; i++) {
              const ang = base + i * 0.2;
              this.game.spawnProjectile({
                from: 'enemy',
                x: this.x + Math.cos(ang) * 34,
                y: this.y - this.h * 0.6,
                vx: Math.cos(ang) * r.speed,
                vy: Math.sin(ang) * r.speed,
                dmg: r.dmg, kb: r.kb, kby: 5,
                color: r.color, r: 7, life: 170, spin: true
              });
            }
          }
        } else if (t > 70) this._endMode(40);
        break;
      }

      case 'summon': { // calls minions
        if (t < 44) {
          this._pose('enemyFlail', 'startup', t / 44);
          this.vx = 0;
          if (Math.random() < 0.2 * dt) this.game.shake(0.8);
        } else if (!this.fired) {
          this.fired = true;
          this.game.audio.roar();
          this.game.level.showBanner('MINIONS, ASSEMBLE!', 90);
          const minions = this.game.enemies.filter(e => !e.isBoss).length;
          if (minions < 3) {
            this.game.spawnEnemy('normal', this.x - 90, -1);
            this.game.spawnEnemy('fast', this.x + 90, -1);
          }
          this.game.spawnParticles(this.x, this.y - this.h * 0.5, 20, '#b45cff', 'spark');
        } else if (t > 84) this._endMode(40);
        break;
      }

      default: {
        this.mode = null;
        break;
      }
    }
  }

  _chargeAtk() {
    if (!this._chargeDef) {
      this._chargeDef = {
        dmg: 22, reach: this.w + 44,
        oy: Math.round(this.h * 0.62), h: Math.round(this.h * 0.5),
        kb: 16, kby: 8, hitstop: 12, shake: 8,
        hitSound: 'heavy', stun: 26
      };
    }
    return this._chargeDef;
  }

  /* boss funny death: launched sky-high waving a tiny white flag */
  startDeath(dir, atk) {
    if (this.dying) return;
    this.dying = true;
    const corpse = {
      isCorpse: true, uid: this.uid, isBoss: true,
      state: 'corpse', mode: 'launch',
      x: this.x, y: this.y,
      vx: dir * 4, vy: -21, rot: 0, rotV: dir * 0.4,
      w: this.w, h: this.h, scale: this.scale,
      style: this.style, facing: this.facing,
      animTime: this.animTime, wobbleT: 0,
      grounded: false, life: 420, fallen: false,
      flag: true, quip: 'KO!!!', deathT: 0
    };
    this.game.spawnCorpse(corpse);
    this.game.onEnemyDeath(this, corpse);
  }
}