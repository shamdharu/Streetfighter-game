'use strict';

/* ============================================================
 * player.js — the stickman hero: movement, combos, weapons.
 * ============================================================ */

class Player {
  constructor(game) {
    this.game = game;
    this.isPlayer = true;
    this.uid = 'player';
    this.reset(140);
  }

  reset(x) {
    const level = this.game.level;
    this.x = x;
    this.y = level ? level.groundY : 470;
    this.vx = 0; this.vy = 0;
    this.w = 30; this.h = 70;
    this.facing = 1;
    this.scale = 1;

    this.hp = 100; this.maxHp = 100;
    this.energy = 100; this.maxEnergy = 100;

    this.state = 'idle';
    this.grounded = true;
    this.onPlatform = false;
    this.dropTimer = 0;
    this.animTime = 0;
    this.runCycle = 0.4;
    this.runAmp = 1.0;

    this.attack = null;   // {def, name, t, phase, prog, fired, hitIds}
    this.buffer = null;   // buffered chain input code

    this.hitstun = 0;
    this.invuln = 0;
    this.flash = 0;
    this.dead = false;
    this.deathT = 0;

    this.weapon = null;   // {def, ammo}
    this.shield = 0;
    this.buffDmg = 0;
    this.buffSpeed = 0;

    this.style = { body: '#14161c', cloth: '#2f80ff', clothType: 'headband' };
    this.rot = 0;
  }

  get dmgMult() { return this.buffDmg > 0 ? 2 : 1; }

  /* ================= main update ================= */

  update(dt, input, level) {
    this.animTime += dt;
    if (this.flash > 0) this.flash -= dt;
    if (this.invuln > 0) this.invuln -= dt;
    if (this.buffDmg > 0) this.buffDmg -= dt;
    if (this.buffSpeed > 0) this.buffSpeed -= dt;

    // ---- death ----
    if (this.dead) {
      this.deathT += dt;
      this.vx *= Math.pow(0.97, dt);
      Combat.move(this, level, dt);
      if (this.grounded) this.rot = lerp(this.rot, Math.PI * 0.5, 0.12 * dt);
      return;
    }

    // ---- hitstun ----
    if (this.hitstun > 0) {
      this.hitstun -= dt;
      this.state = 'hit';
      Combat.move(this, level, dt);
      this.vx *= Math.pow(0.88, dt);
      if (this.hitstun <= 0) {
        this.state = this.grounded ? 'idle' : 'fall';
        this.vx = 0;
      }
      return;
    }

    // slow energy regen
    this.energy = Math.min(this.maxEnergy, this.energy + 0.11 * dt);

    // ---- attack in progress ----
    if (this.attack) {
      this._updateAttack(dt, input);
      Combat.move(this, level, dt);
      return;
    }

    // ================= free movement =================
    const crouching = input.isDown('KeyS', 'ArrowDown') && this.grounded;
    const left = input.isDown('KeyA', 'ArrowLeft');
    const right = input.isDown('KeyD', 'ArrowRight');
    const up = input.justPressed('KeyW', 'ArrowUp');

    if (up && this.grounded && !crouching) {
      this.vy = -14.6;
      this.grounded = false;
      this.state = 'jump';
      this.game.audio.jump();
      this.game.spawnParticles(this.x, this.y, 5, 'rgba(255,255,255,0.8)', 'dust');
    }

    // drop through one-way platform
    if (crouching && this.onPlatform && input.justPressed('KeyS', 'ArrowDown')) {
      this.dropTimer = 14;
      this.y += 3;
      this.grounded = false;
    }

    this.h = crouching ? 46 : 70;
    const speed = 4.3 * (this.buffSpeed > 0 ? 1.5 : 1);
    if (crouching) {
      this.vx = 0;
    } else if (left && !right) {
      this.vx = -speed;
      this.facing = -1;
    } else if (right && !left) {
      this.vx = speed;
      this.facing = 1;
    } else {
      this.vx = 0;
    }

    // ---- attack inputs ----
    if (input.justPressed('Space') && this.energy >= PLAYER_ATTACKS.special.energy) {
      this._startAttack('special', PLAYER_ATTACKS.special);
    } else if (!this.grounded) {
      if (input.justPressed('KeyJ')) this._startAttack('airPunch', PLAYER_ATTACKS.airPunch);
      else if (input.justPressed('KeyK')) this._startAttack('airKick', PLAYER_ATTACKS.airKick);
      else if (input.justPressed('KeyL')) this._startWeaponAttack();
    } else {
      if (crouching && input.justPressed('KeyK')) {
        this._startAttack('lowKick', PLAYER_ATTACKS.lowKick);
      } else if (input.justPressed('KeyJ')) {
        this._startAttack('punch1', PLAYER_ATTACKS.punch1);
      } else if (input.justPressed('KeyK')) {
        this._startAttack('kick1', PLAYER_ATTACKS.kick1);
      } else if (input.justPressed('KeyL')) {
        this._startWeaponAttack();
      }
    }

    // ---- state from motion ----
    if (!this.attack) {
      if (!this.grounded) this.state = this.vy < 0 ? 'jump' : 'fall';
      else if (crouching) this.state = 'crouch';
      else if (Math.abs(this.vx) > 0.1) this.state = 'run';
      else this.state = 'idle';
      this.h = (this.state === 'crouch') ? 46 : 70;
    }

    const wasGrounded = this.grounded;
    Combat.move(this, level, dt);
    if (!wasGrounded && this.grounded && this.state !== 'crouch') {
      this.game.audio.land();
      this.game.spawnParticles(this.x, this.y, 4, 'rgba(220,220,220,0.7)', 'dust');
    }
    if (!this.grounded) this.onPlatform = false;
  }

  /* ================= attacks ================= */

  _startAttack(name, def) {
    this.attack = {
      def: def, name: name, t: 0,
      phase: 'startup', prog: 0, fired: false,
      hitIds: new Set()
    };
    this.buffer = null;
    this.state = 'attack';
    this.h = 70;
    this.vx = 0;
  }

  _startWeaponAttack() {
    const w = this.weapon;
    if (!w) {
      // unarmed: heavy punch acts as the L fallback
      this._startAttack('punch3', PLAYER_ATTACKS.punch3);
      return;
    }
    if (w.def.kind === 'gun') {
      this._startAttack('shoot', {
        name: 'shoot', f: w.def.f, gun: true,
        dmg: w.def.dmg, kb: w.def.kb, kby: w.def.kby || 0,
        hitstop: w.def.hitstop, shake: w.def.shake,
        sound: w.def.sound, hitSound: w.def.hitSound,
        chain: {}
      });
    } else {
      this._startAttack('weaponSwing', {
        name: 'weaponSwing', f: w.def.f,
        dmg: w.def.dmg, reach: w.def.reach, h: w.def.h, oy: w.def.oy,
        kb: w.def.kb, kby: w.def.kby,
        hitstop: w.def.hitstop, shake: w.def.shake,
        sound: w.def.sound, hitSound: w.def.hitSound,
        chain: {}
      });
    }
  }

  _updateAttack(dt, input) {
    const a = this.attack;
    const F = a.def.f;

    // buffer chain inputs while attacking
    if (input.justPressed('KeyJ')) this.buffer = 'KeyJ';
    else if (input.justPressed('KeyK')) this.buffer = 'KeyK';
    else if (input.justPressed('KeyL')) this.buffer = 'KeyL';

    a.t += dt;
    const t = a.t;

    if (t < F.s) {
      a.phase = 'startup'; a.prog = t / F.s;
      if (!this.grounded) this.vx *= Math.pow(0.92, dt);
    } else if (t < F.s + F.a) {
      a.phase = 'active'; a.prog = (t - F.s) / F.a;
      if (!a.fired) {
        a.fired = true;
        this._onAttackStart(a);
      }
      this._onAttackActive(a);
    } else if (t < F.s + F.a + F.r) {
      a.phase = 'recovery'; a.prog = (t - F.s - F.a) / F.r;
      this.vx *= Math.pow(0.8, dt);
    } else {
      // finished — continue the combo if an input was buffered
      const next = a.def.chain ? a.def.chain[this.buffer] : null;
      if (next && PLAYER_ATTACKS[next]) {
        this._startAttack(next, PLAYER_ATTACKS[next]);
        return;
      }
      this.attack = null;
      this.buffer = null;
      this.state = this.grounded ? 'idle' : 'fall';
      this.vx = 0;
    }
  }

  _onAttackStart(a) {
    const def = a.def;
    if (def.name === 'special') return; // handled in active
    if (def.gun) { this.game.audio.gun(); return; }
    if (def.sound) this.game.audio[def.sound]();
    if (this.grounded && def.reach) {
      this.vx = this.facing * 2.2; // small forward lunge
    }
  }

  _onAttackActive(a) {
    const def = a.def;

    if (def.name === 'special') {
      if (!a.specialDone) {
        a.specialDone = true;
        this._doSpecial(def);
      }
      return;
    }

    if (def.gun) {
      if (!a.gunFired) {
        a.gunFired = true;
        this._fireWeapon();
      }
      return;
    }

    const enemies = this.game.enemies;
    for (let i = 0; i < enemies.length; i++) {
      Combat.tryHit(this.game, this, enemies[i], def);
    }
  }

  _doSpecial(def) {
    this.energy -= def.energy;
    this.game.shake(def.shake);
    this.game.hitstop(def.hitstop);
    this.game.audio.special();
    this.game.spawnParticles(this.x, this.y - 30, 26, '#7ad7ff', 'ring');
    this.game.spawnParticles(this.x, this.y - 30, 14, '#ffffff', 'spark');
    this.game.addText(this.x, this.y - this.h - 26, 'SHOCKWAVE!', '#7ad7ff');

    const enemies = this.game.enemies;
    const R2 = def.radius * def.radius;
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      const dx = e.x - this.x, dy = (e.y - e.h / 2) - (this.y - this.h / 2);
      if (dx * dx + dy * dy <= R2) {
        Combat.applyHit(this, this, e, def);
      }
    }
  }

  _fireWeapon() {
    const w = this.weapon;
    if (!w) return;
    this.game.spawnProjectile({
      from: 'player',
      x: this.x + this.facing * 24,
      y: this.y - 36,
      vx: this.facing * w.def.speed,
      vy: 0,
      dmg: w.def.dmg,
      kb: w.def.kb,
      kby: w.def.kby || 0,
      color: w.def.color2 || w.def.color,
      big: !!w.def.big,
      r: w.def.big ? 8 : 4
    });
    this.game.shake(w.def.shake || 2);
    this.game.spawnParticles(this.x + this.facing * 30, this.y - 36, 5, '#ffe066', 'spark');

    w.ammo -= 1;
    if (w.ammo <= 0) {
      this.weapon = null;
      this.game.addText(this.x, this.y - this.h - 20, 'OUT OF AMMO!', '#ff8500');
      this.game.audio.dry();
    }
  }

  /* ================= damage & death ================= */

  heal(n) {
    this.hp = Math.min(this.maxHp, this.hp + n);
  }

  die(dir) {
    if (this.dead) return;
    this.dead = true;
    this.state = 'dead';
    this.attack = null;
    this.hp = 0;
    this.vx = dir * 7;
    this.vy = -11;
    this.hitstun = 0;
    this.game.audio.hurt();
    this.game.audio.death();
    this.game.shake(6);
  }

  /* ================= drawing ================= */

  draw(ctx) {
    const gy = this.game.level.groundY;

    // invulnerability blink
    if (this.invuln > 0 && !this.dead && Math.floor(this.animTime * 0.35) % 2 === 0) {
      ctx.save();
      ctx.globalAlpha = 0.45;
      drawShadow(ctx, this, gy);
      drawStickman(ctx, this);
      this._drawWeapon(ctx);
      ctx.restore();
      return;
    }

    drawShadow(ctx, this, gy);
    drawStickman(ctx, this);
    this._drawWeapon(ctx);

    // speed buff trail
    if (this.buffSpeed > 0 && Math.abs(this.vx) > 3) {
      ctx.save();
      ctx.strokeStyle = 'rgba(82,255,143,0.5)';
      ctx.lineWidth = 3;
      for (let i = 1; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(this.x - this.facing * (14 + i * 10), this.y - 26 - i * 4);
        ctx.lineTo(this.x - this.facing * (30 + i * 10), this.y - 26 - i * 4);
        ctx.stroke();
      }
      ctx.restore();
    }

    // power buff aura
    if (this.buffDmg > 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,133,0,' + (0.4 + Math.sin(this.animTime * 0.2) * 0.2).toFixed(2) + ')';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.x, this.y - 30, 34 + Math.sin(this.animTime * 0.15) * 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // shield bubble
    if (this.shield > 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(110,240,255,0.85)';
      ctx.fillStyle = 'rgba(110,240,255,0.12)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(this.x, this.y - 30, 38, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.restore();
    }
  }

  /** Draw the held weapon near the front hand. */
  _drawWeapon(ctx) {
    const w = this.weapon;
    if (!w) return;
    const f = this.facing;
    let angle = f * 0.6;
    let hx = this.x + f * 20;
    let hy = this.y - 34;

    if (this.attack) {
      const a = this.attack;
      if (a.def.gun) {
        angle = f * (Math.PI / 2); // point forward
        hx = this.x + f * 26;
        hy = this.y - 38;
        if (a.phase === 'recovery') hy -= a.prog * 3; // recoil settle
        if (a.phase === 'startup') hx -= f * (1 - a.prog) * 6;
      } else {
        // swing arc: cock → strike
        const p = a.phase === 'startup' ? -1.4 * (1 - a.prog)
                : a.phase === 'active' ? lerp(-1.2, 1.4, a.prog)
                : lerp(1.4, 0.6, a.prog);
        angle = f * p;
        hx = this.x + f * 16;
        hy = this.y - 40;
      }
    }
    drawWeaponShape(ctx, w.def.id, hx, hy, angle, 1.1);
  }
}