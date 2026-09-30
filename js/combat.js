'use strict';

/* ============================================================
 * combat.js — attack data, weapons, physics/collision, hits.
 *
 * Frame counts are in 60fps "frames" multiplied by dt.
 * Entity convention: x = center, y = feet (bottom).
 * ============================================================ */

const GRAVITY = 0.72;

/* ---------------- player attacks ---------------- */
/* chain: buffered input code -> next attack (combo routes) */

const PLAYER_ATTACKS = {
  punch1: { // JAB — base style
    name: 'punch1', f: { s: 4, a: 4, r: 9 },
    dmg: 6, reach: 46, h: 26, oy: 56, kb: 4, kby: 0,
    hitstop: 5, shake: 1.5, sound: 'punch', hitSound: 'hit',
    fx: '#ffe066',
    chain: { KeyJ: 'punch2', KeyK: 'kick1' }
  },
  punch2: { // HOOK — new style: spins into the arm, cyan trail
    name: 'punch2', f: { s: 4, a: 5, r: 11 },
    dmg: 8, reach: 52, h: 30, oy: 56, kb: 6, kby: 2,
    spin: Math.PI * 0.6,
    arc: { cy: -44, color: '#7ad7ff' },
    hitstop: 6, shake: 3, sound: 'punch', hitSound: 'hit',
    fx: '#7ad7ff', styleName: 'HOOK!',
    chain: { KeyJ: 'punch3', KeyK: 'kick2' }
  },
  punch3: { // UPPERCUT — finisher: launches enemy, orange burst, small hop
    name: 'punch3', f: { s: 7, a: 6, r: 17 },
    dmg: 15, reach: 50, h: 46, oy: 64, kb: 7, kby: 10,
    hop: -4,
    hitstop: 11, shake: 6, sound: 'heavy', hitSound: 'heavy',
    fx: '#ff8500', fxType: 'finish', styleName: 'UPPERCUT!',
    chain: {}
  },
  kick1: { // SNAP KICK — base style
    name: 'kick1', f: { s: 6, a: 5, r: 11 },
    dmg: 10, reach: 54, h: 30, oy: 46, kb: 6, kby: 2,
    hitstop: 6, shake: 2.5, sound: 'kick', hitSound: 'hit',
    fx: '#ffe066',
    chain: { KeyK: 'kick2', KeyJ: 'punch2' }
  },
  kick2: { // ROUNDHOUSE — new style: 180° body spin + yellow swoosh
    name: 'kick2', f: { s: 7, a: 6, r: 14 },
    dmg: 13, reach: 62, h: 38, oy: 58, kb: 9, kby: 4,
    spin: Math.PI * 0.9,
    arc: { cy: -36, color: '#ffd60a' },
    hitstop: 8, shake: 5, sound: 'kick', hitSound: 'heavy',
    fx: '#ffd60a', styleName: 'ROUNDHOUSE!',
    chain: { KeyK: 'kick3', KeyJ: 'punch3' }
  },
  kick3: { // TORNADO — finisher: hops + full 360° spin, orange arc, huge knockback
    name: 'kick3', f: { s: 8, a: 8, r: 18 },
    dmg: 19, reach: 68, h: 54, oy: 66, kb: 15, kby: 8,
    spin: Math.PI * 2, hop: -9,
    arc: { cy: -40, color: '#ff8500' },
    hitstop: 13, shake: 8, sound: 'heavy', hitSound: 'heavy',
    fx: '#ff8500', fxType: 'finish', styleName: 'TORNADO KICK!',
    chain: {}
  },
  lowKick: {
    name: 'lowKick', f: { s: 5, a: 5, r: 13 },
    dmg: 8, reach: 52, h: 24, oy: 26, kb: 5, kby: 1,
    hitstop: 6, shake: 2, sound: 'kick', hitSound: 'hit',
    fx: '#ffe066',
    chain: { KeyK: 'kick2', KeyJ: 'punch1' }
  },
  airPunch: {
    name: 'airPunch', f: { s: 4, a: 6, r: 8 },
    dmg: 8, reach: 46, h: 30, oy: 54, kb: 5, kby: 0,
    hitstop: 5, shake: 2, sound: 'punch', hitSound: 'hit',
    fx: '#ffe066',
    chain: {}
  },
  airKick: {
    name: 'airKick', f: { s: 5, a: 10, r: 8 },
    dmg: 13, reach: 56, h: 40, oy: 50, kb: 8, kby: 3,
    hitstop: 8, shake: 4, sound: 'kick', hitSound: 'heavy',
    fx: '#ffd60a', fxType: 'finish',
    chain: {}
  },
  special: { // radial energy blast
    name: 'special', f: { s: 9, a: 5, r: 24 },
    dmg: 24, radius: 115, kb: 15, kby: 9,
    hitstop: 11, shake: 10, sound: 'special', hitSound: 'heavy',
    energy: 35, fx: '#7ad7ff', fxType: 'finish',
    chain: {}
  }
};

/* Melee weapon swing ladder: press L again mid-swing to climb the
 * chain — swing → REVERSE sweep → spinning FINISHER, then back to
 * the base swing. */
const WEAPON_SWING_STYLES = [
  { pose: 'weaponSwing',  dmg: 1.0, spd: 1.0,  kb: 1.0, shake: 1.0,
    reach: 0,   hop: 0,     spin: 0,           name: null },
  { pose: 'weaponSwing2', dmg: 1.2, spd: 0.9,  kb: 1.3, shake: 1.25,
    reach: 4,   hop: 0,     spin: 0,           name: 'REVERSE!' },
  { pose: 'weaponSwing3', dmg: 1.8, spd: 1.1,  kb: 2.0, shake: 1.9,
    reach: 14,  hop: -6,    spin: Math.PI * 2, name: 'FINISHER!' }
];

/* ---------------- weapons ---------------- */
/* Melee weapons have infinite ammo (ammo = -1). */

const WEAPONS = {
  bat: {
    id: 'bat', name: 'BAT', kind: 'melee', ammo: -1,
    dmg: 14, reach: 74, h: 40, oy: 62, kb: 9, kby: 4,
    f: { s: 6, a: 5, r: 13 }, hitstop: 8, shake: 4,
    sound: 'thwack', hitSound: 'heavy', color: '#b5713a'
  },
  sword: {
    id: 'sword', name: 'SWORD', kind: 'melee', ammo: -1,
    dmg: 23, reach: 88, h: 48, oy: 68, kb: 12, kby: 6,
    f: { s: 8, a: 5, r: 17 }, hitstop: 10, shake: 6,
    sound: 'slash', hitSound: 'heavy', color: '#c9d1d9'
  },
  pistol: {
    id: 'pistol', name: 'PISTOL', kind: 'gun', ammo: 14,
    dmg: 13, f: { s: 6, a: 2, r: 10 }, speed: 15, kb: 6, kby: 1,
    hitstop: 4, shake: 2, sound: 'gun', hitSound: 'hit', color: '#9aa0a6'
  },
  rifle: {
    id: 'rifle', name: 'RIFLE', kind: 'gun', ammo: 50,
    dmg: 8, f: { s: 4, a: 2, r: 7 }, speed: 18, kb: 3.5, kby: 0,
    hitstop: 3, shake: 1.2, sound: 'gun', hitSound: 'hit', color: '#5dbb63'
  },
  zapper: {
    id: 'zapper', name: 'ZAPPER', kind: 'gun', ammo: 10,
    dmg: 19, f: { s: 8, a: 3, r: 14 }, speed: 11, kb: 13, kby: 7,
    hitstop: 8, shake: 5, sound: 'gun', hitSound: 'heavy', color: '#b45cff',
    big: true, color2: '#e2a9ff'
  }
};

/* ---------------- hit helpers ---------------- */

const Combat = {
  overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
           a.y < b.y + b.h && a.y + a.h > b.y;
  },

  /** Hurtbox from a feet-anchored entity. */
  hurt(e) {
    return { x: e.x - e.w / 2, y: e.y - e.h, w: e.w, h: e.h };
  },

  /** Melee hitbox in the direction the attacker faces. */
  box(e, atk) {
    const w = atk.reach;
    if (e.facing >= 0) return { x: e.x + e.w * 0.15, y: e.y - atk.oy, w: w, h: atk.h };
    return { x: e.x - e.w * 0.15 - w, y: e.y - atk.oy, w: w, h: atk.h };
  },

  center(e) { return { x: e.x, y: e.y - e.h * 0.5 }; },

  /* ---------------- physics ---------------- */

  /**
   * Move an entity with gravity + collision against the level.
   * Level provides: gravity, groundY, getSolids(), platforms[], getBounds().
   */
  move(e, level, dt) {
    e.vy += level.gravity * dt;
    if (e.vy > 19) e.vy = 19;

    const solids = level.getSolids();
    const prevX = e.x;

    // --- horizontal ---
    e.x += e.vx * dt;
    let hb = this.hurt(e);
    for (let i = 0; i < solids.length; i++) {
      const s = solids[i];
      if (!this.overlap(hb, s)) continue;
      if (e.x > prevX) e.x = s.x - e.w / 2;
      else if (e.x < prevX) e.x = s.x + s.w + e.w / 2;
      else e.x = (e.x < s.x + s.w / 2) ? s.x - e.w / 2 : s.x + s.w + e.w / 2;
      e.vx = 0;
      hb = this.hurt(e);
    }

    // --- vertical ---
    const prevFeet = e.y;
    e.y += e.vy * dt;
    e.grounded = false;
    hb = this.hurt(e);

    // main ground plane
    if (e.y >= level.groundY) {
      e.y = level.groundY;
      e.vy = 0;
      e.grounded = true;
      hb = this.hurt(e);
    }

    // solid boxes (land on top / bump head)
    for (let i = 0; i < solids.length; i++) {
      const s = solids[i];
      if (!this.overlap(hb, s)) continue;
      if (e.vy >= 0 && prevFeet <= s.y + 6) {
        e.y = s.y; e.vy = 0; e.grounded = true;
      } else if (e.vy < 0 && (prevFeet - e.h) >= s.y + s.h - 6) {
        e.y = s.y + s.h + e.h; e.vy = 0;
      } else {
        e.x = (e.x < s.x + s.w / 2) ? s.x - e.w / 2 : s.x + s.w + e.w / 2;
      }
      hb = this.hurt(e);
    }

    // one-way platforms (drop through while dropTimer is set)
    if (e.vy >= 0 && !e.dropTimer) {
      for (let i = 0; i < level.platforms.length; i++) {
        const p = level.platforms[i];
        if (e.x + e.w / 2 > p.x && e.x - e.w / 2 < p.x + p.w &&
            prevFeet <= p.y + 6 && e.y >= p.y) {
          e.y = p.y; e.vy = 0; e.grounded = true;
          e.onPlatform = true;
        }
      }
    }
    if (e.dropTimer > 0) e.dropTimer -= dt;

    // --- world / arena bounds ---
    const b = level.getBounds();
    const half = e.w / 2;
    if (e.x < b.x1 + half) { e.x = b.x1 + half; e.vx = Math.max(0, e.vx); }
    if (e.x > b.x2 - half) { e.x = b.x2 - half; e.vx = Math.min(0, e.vx); }
  },

  /* ---------------- hit resolution ---------------- */

  /** Test attacker's current attack against one target; resolve on overlap. */
  tryHit(game, attacker, target, atk, hitSet) {
    if (!target || target.dead || target.hp <= 0) return false;
    const set = hitSet || attacker.hitIds ||
      (attacker.attack && attacker.attack.hitIds) || null;
    if (set) {
      if (set.has(target.uid)) return false;
      set.add(target.uid);
    }
    if (!this.overlap(this.box(attacker, atk), this.hurt(target))) return false;
    this.applyHit(game, attacker, target, atk);
    return true;
  },

  applyHit(game, attacker, target, atk) {
    const dir = (target.x >= attacker.x) ? 1 : -1;
    const mult = attacker.dmgMult || 1;
    const dmg = Math.round(atk.dmg * mult);

    // Shield absorbs a hit completely.
    if (target.isPlayer && target.shield > 0) {
      target.shield = 0;
      target.invuln = 34;
      target.flash = 6;
      game.hitstop(5);
      game.shake(3);
      game.audio.block();
      game.addText(target.x, target.y - target.h - 14, 'BLOCKED!', '#6ef0ff');
      game.spawnParticles(target.x, target.y - target.h * 0.6, 8, '#6ef0ff', 'spark');
      return;
    }
    if (target.isPlayer && target.invuln > 0) return;

    target.hp -= dmg;
    const kb = atk.kb * (1 - (target.armor || 0));
    target.vx = dir * kb;
    target.vy = -(atk.kby || 0) * (1 - (target.armor || 0) * 0.7);
    target.flash = 7;
    target.hitstun = (atk.stun != null ? atk.stun : 16);
    target.state = 'hit';
    target.attack = null;

    const px = (this.center(attacker).x + this.center(target).x) / 2;
    const py = target.y - target.h * 0.55;

    game.hitstop(atk.hitstop || 5);
    game.shake(atk.shake || 2);
    const fx = atk.fx || '#ffe066';
    game.spawnParticles(px, py, 8 + Math.min(12, (atk.shake || 2) * 2), fx, 'spark');
    game.spawnParticles(px, py, atk.fxType === 'finish' ? 7 : 4, '#ffffff', 'ring');
    if (atk.fxType === 'finish') {
      // finishers throw extra stars for extra style
      game.spawnParticles(px, py, 8, fx, 'star');
      game.addText(px, py - 30, 'SMASH!', fx);
    }
    if (game.audio[atk.hitSound]) game.audio[atk.hitSound]();
    else game.audio.hit();

    if (target.isPlayer) {
      target.invuln = 46;
      game.breakCombo();
      game.audio.hurt();
      if (target.hp <= 0) {
        target.hp = 0;
        target.die(dir);
      }
    } else {
      game.addHit(dmg, target);
      if (target.hp <= 0) {
        target.hp = 0;
        target.startDeath(dir, atk);
      } else {
        target.onDamaged(dir, atk);
      }
    }
  }
};