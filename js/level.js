'use strict';

/* ============================================================
 * level.js — level data, triggers/gates, pickups, backgrounds.
 *
 * Coordinates: x left→right, y feet-anchored (groundY = floor).
 * spawns[] activate when the player passes their x.
 * gate = temporary wall that locks the arena until cleared.
 * ============================================================ */

const LEVELS = [
  /* ============ LEVEL 1 — STREET CLEANUP ============ */
  {
    name: 'STREET CLEANUP',
    theme: 'city',
    width: 4600,
    groundY: 470,
    platforms: [
      { x: 740,  y: 386, w: 190, h: 16 },
      { x: 1520, y: 392, w: 170, h: 16 },
      { x: 2330, y: 380, w: 210, h: 16 },
      { x: 3320, y: 398, w: 150, h: 16 }
    ],
    obstacles: [
      { x: 1150, w: 56, h: 46 },
      { x: 2660, w: 60, h: 52 },
      { x: 3540, w: 56, h: 46 }
    ],
    spawns: [
      { x: 540,  enemies: [{ t: 'normal', dx: 0 }, { t: 'normal', dx: 80 }] },
      { x: 1080, enemies: [{ t: 'normal', dx: 0 }, { t: 'fast', dx: 110 }] },
      { x: 1780, gate: 1680,
        enemies: [{ t: 'normal', dx: 0 }, { t: 'normal', dx: 90 },
                  { t: 'fast', dx: 180 }, { t: 'normal', dx: 260 }] },
      { x: 2320, enemies: [{ t: 'heavy', dx: 0 }, { t: 'normal', dx: 120 }] },
      { x: 2980,
        enemies: [{ t: 'fast', dx: 0 }, { t: 'fast', dx: 90 },
                  { t: 'normal', dx: 170 }, { t: 'normal', dx: 250 }] },
      { x: 3780, gate: 3680,
        enemies: [{ t: 'mini', dx: 0 }, { t: 'fast', dx: 150 }, { t: 'normal', dx: 240 }] }
    ],
    pickups: [
      { x: 1400, type: 'health' },
      { x: 2620, type: 'energy' },
      { x: 3450, type: 'power' }
    ],
    weapons: [
      { x: 1460, id: 'bat' },
      { x: 3180, id: 'pistol' }
    ],
    boss: {
      trigger: 4080, x1: 3980, x2: 4560,
      id: 'brute', name: 'BIG BRUTE', hp: 300, score: 1500
    }
  },

  /* ============ LEVEL 2 — PARK PANIC ============ */
  {
    name: 'PARK PANIC',
    theme: 'park',
    width: 5200,
    groundY: 470,
    platforms: [
      { x: 900,  y: 372, w: 200, h: 16 },
      { x: 1700, y: 400, w: 150, h: 16 },
      { x: 2150, y: 330, w: 190, h: 16 },
      { x: 3050, y: 384, w: 220, h: 16 },
      { x: 4050, y: 350, w: 170, h: 16 }
    ],
    obstacles: [
      { x: 1350, w: 64, h: 44 },
      { x: 2500, w: 58, h: 58 },
      { x: 3600, w: 64, h: 44 },
      { x: 4400, w: 58, h: 58 }
    ],
    spawns: [
      { x: 560,  enemies: [{ t: 'normal', dx: 0 }, { t: 'crazy', dx: 110 }] },
      { x: 1150, enemies: [{ t: 'gunner', dx: 40 }, { t: 'normal', dx: 140 }, { t: 'fast', dx: 220 }] },
      { x: 1850, gate: 1750,
        enemies: [{ t: 'crazy', dx: 0 }, { t: 'crazy', dx: 100 },
                  { t: 'fast', dx: 200 }, { t: 'normal', dx: 280 }] },
      { x: 2450, enemies: [{ t: 'heavy', dx: 0 }, { t: 'gunner', dx: 220 }] },
      { x: 3100, gate: 3000,
        enemies: [{ t: 'fast', dx: 0 }, { t: 'fast', dx: 90 }, { t: 'crazy', dx: 180 },
                  { t: 'normal', dx: 260 }, { t: 'normal', dx: 340 }] },
      { x: 3800, enemies: [{ t: 'heavy', dx: 0 }, { t: 'heavy', dx: 150 }, { t: 'gunner', dx: 300 }] },
      { x: 4480, gate: 4380,
        enemies: [{ t: 'mini', dx: 0 }, { t: 'crazy', dx: 160 }, { t: 'gunner', dx: 300 }] }
    ],
    pickups: [
      { x: 1000, type: 'energy' },
      { x: 2200, type: 'health' },
      { x: 3300, type: 'speed' },
      { x: 4250, type: 'shield' }
    ],
    weapons: [
      { x: 1560, id: 'bat' },
      { x: 2900, id: 'sword' },
      { x: 4150, id: 'rifle' }
    ],
    boss: {
      trigger: 4680, x1: 4580, x2: 5160,
      id: 'duelist', name: 'THE DUELIST', hp: 380, score: 2500
    }
  },

  /* ============ LEVEL 3 — FACTORY FURY ============ */
  {
    name: 'FACTORY FURY',
    theme: 'factory',
    width: 5800,
    groundY: 470,
    platforms: [
      { x: 800,  y: 388, w: 180, h: 16 },
      { x: 1450, y: 340, w: 170, h: 16 },
      { x: 2050, y: 396, w: 200, h: 16 },
      { x: 2750, y: 350, w: 190, h: 16 },
      { x: 3450, y: 390, w: 160, h: 16 },
      { x: 4200, y: 340, w: 200, h: 16 },
      { x: 4900, y: 392, w: 170, h: 16 }
    ],
    obstacles: [
      { x: 1200, w: 60, h: 52 },
      { x: 2400, w: 66, h: 46 },
      { x: 3100, w: 60, h: 58 },
      { x: 3900, w: 66, h: 46 },
      { x: 4700, w: 60, h: 52 }
    ],
    spawns: [
      { x: 560,  enemies: [{ t: 'fast', dx: 0 }, { t: 'normal', dx: 90 }, { t: 'normal', dx: 180 }] },
      { x: 1150, enemies: [{ t: 'heavy', dx: 0 }, { t: 'crazy', dx: 130 }, { t: 'fast', dx: 220 }] },
      { x: 1800, gate: 1700,
        enemies: [{ t: 'gunner', dx: 60 }, { t: 'gunner', dx: 200 },
                  { t: 'normal', dx: 0 }, { t: 'fast', dx: 280 }] },
      { x: 2480, enemies: [{ t: 'heavy', dx: 0 }, { t: 'heavy', dx: 160 }, { t: 'crazy', dx: 300 }] },
      { x: 3150, gate: 3050,
        enemies: [{ t: 'fast', dx: 0 }, { t: 'fast', dx: 80 }, { t: 'fast', dx: 160 },
                  { t: 'crazy', dx: 240 }, { t: 'normal', dx: 320 }, { t: 'normal', dx: 400 }] },
      { x: 3850, enemies: [{ t: 'heavy', dx: 0 }, { t: 'gunner', dx: 200 }, { t: 'crazy', dx: 320 }] },
      { x: 4550, gate: 4450,
        enemies: [{ t: 'mini', dx: 0 }, { t: 'mini', dx: 200 }, { t: 'fast', dx: 380 }] }
    ],
    pickups: [
      { x: 1050, type: 'health' },
      { x: 2300, type: 'power' },
      { x: 3400, type: 'shield' },
      { x: 4350, type: 'health' },
      { x: 5100, type: 'energy' }
    ],
    weapons: [
      { x: 1620, id: 'sword' },
      { x: 2950, id: 'pistol' },
      { x: 4050, id: 'rifle' },
      { x: 5000, id: 'zapper' }
    ],
    boss: {
      trigger: 5280, x1: 5180, x2: 5760,
      id: 'megabot', name: 'MEGABOT', hp: 480, score: 4000
    }
  }
];

const PICKUP_TYPES = {
  health: { color: '#ff4d6d', label: '+HP',        sound: 'pickup' },
  energy: { color: '#ffd60a', label: '+EN',        sound: 'pickup' },
  power:  { color: '#ff8500', label: 'DMG x2',     sound: 'powerup' },
  speed:  { color: '#52ff8f', label: 'SPEED x2',   sound: 'powerup' },
  shield: { color: '#6ef0ff', label: 'SHIELD',     sound: 'powerup' }
};

/* deterministic pseudo-random for stable scenery */
function seededRand(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

class Level {
  constructor(game, index) {
    this.game = game;
    this.index = index;
    this.def = LEVELS[index];

    this.width = this.def.width;
    this.groundY = this.def.groundY;
    this.gravity = GRAVITY;

    this.platforms = this.def.platforms.map(p => ({ x: p.x, y: p.y, w: p.w, h: p.h }));
    this.obstacles = this.def.obstacles.map(o => ({
      x: o.x, y: this.groundY - o.h, w: o.w, h: o.h
    }));

    // spawn groups
    this.spawns = this.def.spawns.map((s, i) => ({
      id: i, x: s.x, gate: s.gate, enemies: s.enemies,
      state: 'waiting', // waiting | active | cleared
      gateRect: null
    }));

    // pickups & weapons (bob with t)
    this.pickups = this.def.pickups.map((p, i) => ({
      id: i, x: p.x, y: p.y || (this.groundY - 34),
      type: p.type, t: i * 40, taken: false
    }));
    this.weapons = this.def.weapons.map((w, i) => ({
      id: i, x: w.x, y: this.groundY - 18,
      wid: w.id, ammo: (w.ammo != null ? w.ammo : null),
      t: i * 30, taken: false
    }));

    // boss state
    this.bossState = 'waiting'; // waiting | active | dead
    this.arena = null;
    this.complete = false;
    this.bannerT = 0;
    this.bannerText = '';

    this._solids = [];
    this._solidsDirty = true;
    this._rebuildSolids();

    // pre-rendered parallax layers
    this._renderLayers();
  }

  /* ---------------- collision queries ---------------- */

  _rebuildSolids() {
    const list = this.obstacles.slice();
    for (let i = 0; i < this.spawns.length; i++) {
      const s = this.spawns[i];
      if (s.gateRect) list.push(s.gateRect);
    }
    this._solids = list;
    this._solidsDirty = false;
  }

  getSolids() {
    if (this._solidsDirty) this._rebuildSolids();
    return this._solids;
  }

  getBounds() {
    if (this.arena) return { x1: this.arena.x1, x2: this.arena.x2 };
    return { x1: 0, x2: this.width };
  }

  showBanner(text, frames) {
    this.bannerText = text;
    this.bannerT = frames || 110;
  }

  /* ---------------- per-frame update ---------------- */

  update(dt) {
    if (this.bannerT > 0) this.bannerT -= dt;

    const player = this.game.player;
    if (!player) return;

    // --- spawn triggers ---
    for (let i = 0; i < this.spawns.length; i++) {
      const s = this.spawns[i];
      if (s.state === 'waiting' && player.x >= s.x) {
        s.state = 'active';
        // lock the gate behind the player (ambush)
        if (s.gate != null) {
          s.gateRect = { x: s.gate, y: this.groundY - 620, w: 26, h: 620, gate: true };
          this._solidsDirty = true;
        }
        for (let j = 0; j < s.enemies.length; j++) {
          const e = s.enemies[j];
          const baseX = (s.gate != null) ? s.gate + 70 : s.x;
          this.game.spawnEnemy(e.t, baseX + e.dx, s.id);
        }
        this.showBanner('ENEMIES!', 70);
      } else if (s.state === 'active') {
        // cleared once every enemy of this group is gone
        if (!this.game.groupAlive(s.id)) {
          s.state = 'cleared';
          s.gateRect = null;
          this._solidsDirty = true;
          this.game.audio.gate();
          this.game.addText(player.x, player.y - player.h - 20, 'AREA CLEAR!', '#52ff8f');
        }
      }
    }

    // --- boss trigger ---
    if (this.bossState === 'waiting' && player.x >= this.def.boss.trigger) {
      this.bossState = 'active';
      this.arena = { x1: this.def.boss.x1, x2: this.def.boss.x2 };
      this.game.audio.bossWarning();
      this.showBanner('BOSS: ' + this.def.boss.name, 130);
      this.game.spawnBoss(this.def.boss);
    }

    // bob pickups
    for (let i = 0; i < this.pickups.length; i++) {
      const p = this.pickups[i];
      if (!p.taken) p.t += dt;
    }
    for (let i = 0; i < this.weapons.length; i++) {
      const w = this.weapons[i];
      if (!w.taken) {
        w.t += dt;
        if (w.delay > 0) w.delay -= dt;
      }
    }
  }

  onBossDefeated() {
    this.bossState = 'dead';
    this.complete = true;
  }

  /* ---------------- parallax layer pre-rendering ---------------- */

  _renderLayers() {
    const H = 540, W = 960;
    this.farFactor = 0.5;
    this.nearFactor = 0.85;
    const farW = Math.ceil(this.width * this.farFactor) + W;
    const nearW = Math.ceil(this.width * this.nearFactor) + W;

    this.far = document.createElement('canvas');
    this.far.width = farW; this.far.height = H;
    this.near = document.createElement('canvas');
    this.near.width = nearW; this.near.height = H;

    const theme = this.def.theme;
    if (theme === 'park') this._renderPark(farW, nearW, H);
    else if (theme === 'factory') this._renderFactory(farW, nearW, H);
    else this._renderCity(farW, nearW, H);
  }

  _renderCity(farW, nearW, H) {
    const f = this.far.getContext('2d');
    const n = this.near.getContext('2d');
    const rnd = seededRand(1234);

    // far skyline
    let x = 0;
    while (x < farW) {
      const w = 60 + rnd() * 90;
      const h = 90 + rnd() * 170;
      f.fillStyle = '#4b4267';
      f.fillRect(x, H - h, w, h);
      f.fillStyle = 'rgba(255,220,120,0.55)';
      for (let wy = H - h + 12; wy < H - 12; wy += 18) {
        for (let wx = x + 8; wx < x + w - 10; wx += 16) {
          if (rnd() > 0.45) f.fillRect(wx, wy, 6, 8);
        }
      }
      x += w + 8 + rnd() * 30;
    }

    // near buildings (bright, with awnings)
    x = 0;
    while (x < nearW) {
      const w = 90 + rnd() * 130;
      const h = 70 + rnd() * 130;
      const hue = 200 + rnd() * 100;
      n.fillStyle = 'hsl(' + hue + ',35%,' + (38 + rnd() * 14) + '%)';
      n.fillRect(x, H - h, w, h);
      n.fillStyle = 'rgba(255,255,255,0.14)';
      n.fillRect(x, H - h, w, 6);
      // door + windows
      n.fillStyle = 'rgba(20,24,40,0.8)';
      n.fillRect(x + w * 0.4, H - 34, 24, 34);
      n.fillStyle = 'rgba(255,235,160,0.8)';
      n.fillRect(x + 12, H - h + 16, 18, 20);
      n.fillRect(x + w - 34, H - h + 16, 18, 20);
      x += w + 20 + rnd() * 50;
    }
  }

  _renderPark(farW, nearW, H) {
    const f = this.far.getContext('2d');
    const n = this.near.getContext('2d');
    const rnd = seededRand(777);

    // distant hills
    f.fillStyle = '#7ec46b';
    f.beginPath();
    f.moveTo(0, H);
    let hx = 0;
    while (hx <= farW) {
      f.quadraticCurveTo(hx + 60, H - 70 - rnd() * 60, hx + 140, H - 20 - rnd() * 30);
      hx += 140;
    }
    f.lineTo(farW, H);
    f.closePath();
    f.fill();
    // clouds
    f.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < farW / 260; i++) {
      const cx = i * 240 + rnd() * 120, cy = 50 + rnd() * 110, r = 22 + rnd() * 18;
      f.beginPath();
      f.arc(cx, cy, r, 0, 7); f.arc(cx + r, cy + 6, r * 0.8, 0, 7);
      f.arc(cx - r, cy + 8, r * 0.7, 0, 7); f.fill();
    }

    // near trees
    let x = 30;
    while (x < nearW) {
      const th = 90 + rnd() * 90;
      n.fillStyle = '#7a4b2a';
      n.fillRect(x - 7, H - th, 14, th);
      const g = 90 + rnd() * 40;
      n.fillStyle = 'hsl(115,45%,' + g * 0.55 + '%)';
      n.beginPath();
      n.arc(x, H - th - 14, 34 + rnd() * 18, 0, 7);
      n.arc(x - 26, H - th + 6, 26, 0, 7);
      n.arc(x + 26, H - th + 6, 26, 0, 7);
      n.fill();
      x += 150 + rnd() * 160;
    }
  }

  _renderFactory(farW, nearW, H) {
    const f = this.far.getContext('2d');
    const n = this.near.getContext('2d');
    const rnd = seededRand(4242);

    // industrial skyline
    let x = 0;
    while (x < farW) {
      const w = 100 + rnd() * 140;
      const h = 80 + rnd() * 150;
      f.fillStyle = '#3c3f52';
      f.fillRect(x, H - h, w, h);
      // smokestack
      if (rnd() > 0.5) {
        f.fillStyle = '#2f3243';
        f.fillRect(x + w * 0.6, H - h - 60, 22, 60);
        f.fillStyle = 'rgba(200,200,220,0.25)';
        f.beginPath(); f.arc(x + w * 0.6 + 11, H - h - 74, 18, 0, 7); f.fill();
        f.beginPath(); f.arc(x + w * 0.6 + 24, H - h - 96, 24, 0, 7); f.fill();
      }
      x += w + 26 + rnd() * 40;
    }

    // near pipes & gears
    x = 0;
    while (x < nearW) {
      const col = rnd() > 0.5 ? '#565d75' : '#49506b';
      n.strokeStyle = col; n.fillStyle = col;
      const ph = 60 + rnd() * 90;
      n.lineWidth = 16;
      n.beginPath();
      n.moveTo(x, H); n.lineTo(x, H - ph); n.lineTo(x + 90, H - ph); n.stroke();
      // gear
      const gx = x + 90, gy = H - ph - 26, gr = 20 + rnd() * 14;
      n.beginPath(); n.arc(gx, gy, gr, 0, Math.PI * 2); n.fill();
      n.fillStyle = '#2b2f42';
      n.beginPath(); n.arc(gx, gy, gr * 0.4, 0, Math.PI * 2); n.fill();
      x += 200 + rnd() * 140;
    }
  }

  /* ---------------- drawing ---------------- */

  drawSky(ctx) {
    const t = this.def.theme;
    const g = ctx.createLinearGradient(0, 0, 0, 540);
    if (t === 'park')         { g.addColorStop(0, '#63b4f5'); g.addColorStop(1, '#cdeeff'); }
    else if (t === 'factory') { g.addColorStop(0, '#241f38'); g.addColorStop(1, '#6b4a5e'); }
    else                      { g.addColorStop(0, '#ff9a56'); g.addColorStop(1, '#ffd9a0'); }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 960, 540);

    if (t === 'city') { // sunset sun
      ctx.fillStyle = 'rgba(255,240,180,0.9)';
      ctx.beginPath(); ctx.arc(760, 110, 46, 0, Math.PI * 2); ctx.fill();
    }
  }

  drawParallax(ctx, camX) {
    ctx.drawImage(this.far, -camX * this.farFactor, 0);
    ctx.drawImage(this.near, -camX * this.nearFactor, 0);
  }

  /** Terrain: ground plane + platforms + obstacles + gates (world space). */
  drawTerrain(ctx, camX) {
    const t = this.def.theme;
    const gy = this.groundY;

    // --- ground fill ---
    if (t === 'park') {
      ctx.fillStyle = '#8a5a33';
      ctx.fillRect(0, gy, this.width, 540 - gy);
      ctx.fillStyle = '#4fae4a';
      ctx.fillRect(0, gy, this.width, 13);
      ctx.fillStyle = '#3f9340';
      for (let x = 0; x < this.width; x += 26) ctx.fillRect(x, gy, 12, 4);
    } else if (t === 'factory') {
      ctx.fillStyle = '#3a3f52';
      ctx.fillRect(0, gy, this.width, 540 - gy);
      ctx.fillStyle = '#5a617c';
      ctx.fillRect(0, gy, this.width, 10);
      ctx.fillStyle = '#2c3040';
      for (let x = 20; x < this.width; x += 64) {
        ctx.beginPath(); ctx.arc(x, gy + 34, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x, gy + 64, 4, 0, Math.PI * 2); ctx.fill();
      }
    } else { // city street
      ctx.fillStyle = '#54566a';
      ctx.fillRect(0, gy, this.width, 540 - gy);
      ctx.fillStyle = '#7d8095';
      ctx.fillRect(0, gy, this.width, 14);
      ctx.fillStyle = '#f2c14e';
      for (let x = Math.floor(camX / 80) * 80; x < camX + 1040; x += 80) {
        ctx.fillRect(x, gy + 44, 44, 6);
      }
    }

    // --- platforms ---
    for (let i = 0; i < this.platforms.length; i++) {
      const p = this.platforms[i];
      if (p.x + p.w < camX - 40 || p.x > camX + 1000) continue;
      if (t === 'park') {
        ctx.fillStyle = '#a9713f';
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = '#c98d52';
        ctx.fillRect(p.x, p.y, p.w, 5);
        ctx.fillStyle = '#7c5029';
        for (let x = p.x + 12; x < p.x + p.w; x += 34) ctx.fillRect(x, p.y + 5, 3, p.h - 5);
      } else if (t === 'factory') {
        ctx.fillStyle = '#6a7290';
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = '#8d97bb';
        ctx.fillRect(p.x, p.y, p.w, 4);
        ctx.fillStyle = '#454b66';
        for (let x = p.x + 8; x < p.x + p.w; x += 24) ctx.fillRect(x, p.y + 7, 10, p.h - 9);
      } else {
        ctx.fillStyle = '#9aa3b8';
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = '#c4cbdd';
        ctx.fillRect(p.x, p.y, p.w, 4);
        ctx.fillStyle = '#6d7590';
        ctx.fillRect(p.x + 4, p.y + p.h - 3, p.w - 8, 3);
      }
    }

    // --- obstacles (crates) ---
    for (let i = 0; i < this.obstacles.length; i++) {
      const o = this.obstacles[i];
      if (o.x + o.w < camX - 40 || o.x > camX + 1000) continue;
      ctx.fillStyle = (t === 'factory') ? '#7a5c3a' : '#b5793c';
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.strokeStyle = 'rgba(60,35,10,0.7)';
      ctx.lineWidth = 3;
      ctx.strokeRect(o.x + 2, o.y + 2, o.w - 4, o.h - 4);
      ctx.beginPath();
      ctx.moveTo(o.x + 4, o.y + 4); ctx.lineTo(o.x + o.w - 4, o.y + o.h - 4);
      ctx.moveTo(o.x + o.w - 4, o.y + 4); ctx.lineTo(o.x + 4, o.y + o.h - 4);
      ctx.stroke();
    }

    // --- locked gates ---
    for (let i = 0; i < this.spawns.length; i++) {
      const s = this.spawns[i];
      if (!s.gateRect) continue;
      const gx = s.gateRect.x;
      const alpha = 0.55 + Math.sin(Date.now() * 0.012) * 0.25;
      ctx.fillStyle = 'rgba(230,60,80,' + alpha.toFixed(2) + ')';
      ctx.fillRect(gx + 8, s.gateRect.y, 10, s.gateRect.h);
      ctx.strokeStyle = 'rgba(255,120,140,' + alpha.toFixed(2) + ')';
      ctx.lineWidth = 3;
      for (let y = s.gateRect.y + 10; y < s.gateRect.y + s.gateRect.h; y += 34) {
        ctx.strokeRect(gx + 2, y, 22, 22);
      }
    }

    // boss arena boundary hints
    if (this.arena) {
      ctx.fillStyle = 'rgba(255,80,80,0.25)';
      ctx.fillRect(this.arena.x1, 60, 8, this.groundY - 60);
      ctx.fillRect(this.arena.x2 - 8, 60, 8, this.groundY - 60);
    }
  }

  /** Pickups + weapon drops (call inside world transform). */
  drawItems(ctx) {
    const camX = this.game.camera.x;
    for (let i = 0; i < this.pickups.length; i++) {
      const p = this.pickups[i];
      if (p.taken) continue;
      if (p.x < camX - 60 || p.x > camX + 1020) continue;
      drawPickupIcon(ctx, p.x, p.y + Math.sin(p.t * 0.06) * 5, p.type, p.t);
    }
    for (let i = 0; i < this.weapons.length; i++) {
      const w = this.weapons[i];
      if (w.taken) continue;
      if (w.x < camX - 60 || w.x > camX + 1020) continue;
      drawWeaponShape(ctx, w.wid, w.x, w.y - 16 + Math.sin(w.t * 0.06) * 4, -0.5, 1);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = 'bold 10px Trebuchet MS, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(WEAPONS[w.wid].name, w.x, w.y - 38);
    }
  }
}

/* ---------------- item icons ---------------- */

function drawPickupIcon(ctx, x, y, type, t) {
  const info = PICKUP_TYPES[type];
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = info.color;
  ctx.globalAlpha = 0.22 + Math.sin(t * 0.1) * 0.08;
  ctx.beginPath(); ctx.arc(0, 0, 17, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = info.color;
  ctx.strokeStyle = '#1b1b26';
  ctx.lineWidth = 2;

  if (type === 'health') {        // heart
    ctx.beginPath();
    ctx.moveTo(0, 9);
    ctx.bezierCurveTo(-13, -1, -9, -12, 0, -5);
    ctx.bezierCurveTo(9, -12, 13, -1, 0, 9);
    ctx.fill(); ctx.stroke();
  } else if (type === 'energy') { // lightning bolt
    ctx.beginPath();
    ctx.moveTo(3, -11); ctx.lineTo(-7, 2); ctx.lineTo(-1, 2);
    ctx.lineTo(-3, 12); ctx.lineTo(8, -2); ctx.lineTo(2, -2);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (type === 'power') {  // fist
    ctx.fillRect(-8, -6, 16, 12);
    ctx.strokeRect(-8, -6, 16, 12);
    ctx.fillRect(-8, -10, 5, 6);
    ctx.strokeRect(-8, -10, 5, 6);
  } else if (type === 'speed') {  // boot
    ctx.beginPath();
    ctx.moveTo(-6, -10); ctx.lineTo(2, -10); ctx.lineTo(2, 3);
    ctx.lineTo(11, 6); ctx.lineTo(11, 11); ctx.lineTo(-6, 11);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-15, -4); ctx.lineTo(-10, -4);
    ctx.moveTo(-17, 2); ctx.lineTo(-11, 2);
    ctx.stroke();
  } else if (type === 'shield') { // shield
    ctx.beginPath();
    ctx.moveTo(0, -11); ctx.lineTo(10, -6); ctx.lineTo(9, 4);
    ctx.quadraticCurveTo(6, 10, 0, 12);
    ctx.quadraticCurveTo(-6, 10, -9, 4);
    ctx.lineTo(-10, -6);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 9px Trebuchet MS, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(info.label, 0, 25);
  ctx.restore();
}

function drawWeaponShape(ctx, wid, x, y, angle, scale) {
  const def = WEAPONS[wid];
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle || 0);
  ctx.scale(scale || 1, scale || 1);
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';

  if (wid === 'bat') {
    ctx.fillStyle = '#b5713a';
    ctx.strokeStyle = '#7a4a22';
    ctx.beginPath();
    ctx.moveTo(-4, 10); ctx.lineTo(-4, -4);
    ctx.quadraticCurveTo(0, -20, 0, -14);
    ctx.quadraticCurveTo(4, -4, 4, 10);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (wid === 'sword') {
    ctx.fillStyle = '#d7dee8'; ctx.strokeStyle = '#8b95a5';
    ctx.fillRect(-3, -22, 6, 30); ctx.strokeRect(-3, -22, 6, 30);
    ctx.fillStyle = '#c8a44a';
    ctx.fillRect(-9, 7, 18, 5);
    ctx.fillStyle = '#7a4a22';
    ctx.fillRect(-3, 12, 6, 9);
  } else if (wid === 'pistol') {
    ctx.fillStyle = '#8f96a3'; ctx.strokeStyle = '#4a4f5a';
    ctx.fillRect(-4, -6, 18, 7); ctx.strokeRect(-4, -6, 18, 7);
    ctx.fillRect(-4, 0, 7, 11); ctx.strokeRect(-4, 0, 7, 11);
  } else if (wid === 'rifle') {
    ctx.fillStyle = '#4f8a52'; ctx.strokeStyle = '#2e5a31';
    ctx.fillRect(-14, -5, 34, 6); ctx.strokeRect(-14, -5, 34, 6);
    ctx.fillRect(-6, 1, 7, 9); ctx.strokeRect(-6, 1, 7, 9);
    ctx.fillStyle = '#7a4a22'; ctx.fillRect(-16, -4, 6, 9);
  } else if (wid === 'zapper') {
    ctx.fillStyle = '#a45cff'; ctx.strokeStyle = '#6a2fb0';
    ctx.fillRect(-8, -6, 22, 10); ctx.strokeRect(-8, -6, 22, 10);
    ctx.fillRect(-4, 3, 7, 10); ctx.strokeRect(-4, 3, 7, 10);
    ctx.fillStyle = '#e2a9ff';
    ctx.beginPath(); ctx.arc(15, -1, 5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}