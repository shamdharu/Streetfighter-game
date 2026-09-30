'use strict';

/* ============================================================
 * stickman.js — procedural stickman skeleton, poses & renderer.
 *
 * Angle convention: 0 = straight DOWN, positive rotates toward
 * the FRONT (the direction the character faces).
 *   dir(a) = (sin a, cos a)  in canvas space (y grows downward)
 * ============================================================ */

function sv(a) { return { x: Math.sin(a), y: Math.cos(a) }; }
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp01(t) { return t < 0 ? 0 : t > 1 ? 1 : t; }

/* ---------------- pose helpers ---------------- */

function basePose() {
  return {
    lean: 0, crouch: 0, bob: 0, headTilt: 0,
    armF: [0.18, -0.25],   // front arm  [shoulder, elbow]
    armB: [-0.16, -0.22],  // back arm
    legF: [0.10, -0.05],   // front leg  [hip, knee]
    legB: [-0.10, -0.05],  // back leg
    eyes: 'normal', mouth: 'flat'
  };
}

function applyPose(P, src) {
  for (const k in src) {
    const v = src[k];
    if (Array.isArray(v)) P[k] = v.slice();
    else P[k] = v;
  }
}

function blendPose(P, target, t) {
  t = clamp01(t);
  for (const k in target) {
    const v = target[k];
    if (Array.isArray(v)) {
      const cur = P[k] || (P[k] = v.slice());
      for (let i = 0; i < v.length; i++) cur[i] = lerp(cur[i], v[i], t);
    } else if (typeof v === 'number') {
      P[k] = lerp(P[k] ?? 0, v, t);
    } else if (t > 0.5) {
      P[k] = v;
    }
  }
}

/* ---------------- attack poses ---------------- */

const ATTACK_POSES = {
  punch1: {
    cock:  { armF: [-0.5, -1.6], armB: [0.5, -0.6], lean: -0.06 },
    strike:{ armF: [1.55, 0.0],  armB: [-0.7, -1.4], lean: 0.2 }
  },
  punch2: {
    cock:  { armF: [-0.6, -1.7], armB: [0.6, -0.5], lean: -0.08 },
    strike:{ armF: [1.6, 0.0],   armB: [-0.8, -1.5], lean: 0.24 }
  },
  punch3: { // heavy overhand
    cock:  { armF: [-2.2, -0.6], armB: [0.4, -1.2], lean: -0.3, crouch: 0.08 },
    strike:{ armF: [1.1, 0.7],   armB: [-0.9, -1.3], lean: 0.42, crouch: 0.14 }
  },
  kick1: {
    cock:  { legF: [-0.45, -1.0], lean: 0.12, armF: [0.6, -0.9], armB: [-0.7, -0.7] },
    strike:{ legF: [1.5, -0.15],  lean: -0.28, armF: [-0.7, -1.0], armB: [-1.3, -0.5] }
  },
  kickHeavy: {
    cock:  { legF: [-0.5, -1.3], lean: 0.14, crouch: 0.12, armF: [0.7, -1.1] },
    strike:{ legF: [1.9, -0.05], lean: -0.46, crouch: 0.1, armF: [-0.8, -1.2], armB: [-1.5, -0.6] }
  },
  lowKick: {
    cock:  { crouch: 0.5, legF: [-0.3, -0.9], lean: -0.05 },
    strike:{ crouch: 0.55, legF: [1.35, -0.1], lean: -0.18, armF: [-0.4, -0.8], armB: [-0.6, -1.4] }
  },
  airPunch: {
    cock:  { legF: [0.5, -1.1], legB: [-0.5, -1.0], armF: [-0.6, -1.5] },
    strike:{ legF: [0.7, -1.2], legB: [-0.7, -1.3], armF: [1.5, 0.0], lean: 0.25 }
  },
  airKick: {
    cock:  { legF: [0.3, -1.4], legB: [-0.4, -1.5], armF: [0.8, -0.9] },
    strike:{ legF: [1.7, -0.2], legB: [-0.8, -1.5], armF: [-0.9, -1.2], armB: [-1.4, -0.4], lean: -0.32 }
  },
  weaponSwing: {
    cock:  { armF: [-1.7, -1.3], armB: [-0.4, -0.9], lean: -0.16 },
    strike:{ armF: [1.45, 0.3],  armB: [-0.9, -1.2], lean: 0.3 }
  },
  shoot: {
    cock:  { armF: [1.5, -0.05], armB: [-0.3, -1.4], lean: 0.12 },
    strike:{ armF: [1.45, -0.1], armB: [-0.4, -1.5], lean: 0.02 }
  },
  special: {
    cock:  { armF: [-1.1, -1.1], armB: [-1.1, -1.1], crouch: 0.4, lean: -0.12 },
    strike:{ armF: [1.5, -0.1],  armB: [1.4, -0.15], crouch: 0.12, lean: 0.34 }
  },
  enemyJab: {
    cock:  { armF: [-0.5, -1.5], armB: [0.4, -0.7], lean: -0.05 },
    strike:{ armF: [1.5, 0.0],   armB: [-0.7, -1.3], lean: 0.22 }
  },
  enemyHeavy: {
    cock:  { armF: [-2.4, -0.4], armB: [-1.0, -1.0], lean: -0.34, crouch: 0.1 },
    strike:{ armF: [1.0, 0.8],   armB: [-1.0, -1.2], lean: 0.5, crouch: 0.2 }
  },
  enemyKick: {
    cock:  { legF: [-0.5, -1.2], lean: 0.12 },
    strike:{ legF: [1.6, -0.1],  lean: -0.3, armB: [-1.4, -0.5] }
  },
  enemyFlail: {
    cock:  { armF: [-1.6, -1.4], armB: [-1.6, -1.4] },
    strike:{ armF: [1.9, -0.9],  armB: [-1.9, -0.9] }
  },
  bossSwipe: {
    cock:  { armF: [-2.0, -1.4], lean: -0.3, crouch: 0.15 },
    strike:{ armF: [1.7, 0.2],   lean: 0.5, crouch: 0.2 }
  }
};

/* ---------------- pose selection ---------------- */

function stickPose(e) {
  const P = basePose();
  const t = e.animTime || 0;
  const st = e.state;

  if (st === 'corpse') {
    // Sprawled cartoon corpse: limbs out, X eyes, tongue out.
    const w = Math.sin((e.wobbleT || 0) * 0.5) * 0.15;
    applyPose(P, {
      lean: 0.2 + w, crouch: 0,
      armF: [2.5 + w, -0.6], armB: [-2.4 - w, 0.5],
      legF: [0.9 + w, -0.3], legB: [-0.7 - w, -0.4],
      eyes: 'dead', mouth: 'tongue'
    });
    return P;
  }

  if (st === 'hit') {
    applyPose(P, {
      lean: -0.42, headTilt: -0.25,
      armF: [-1.5, -1.2], armB: [-1.9, -0.9],
      legF: [0.55, -0.35], legB: [-0.5, -0.6],
      eyes: 'hurt', mouth: 'ouch'
    });
    return P;
  }

  if (st === 'panic') {
    // Hands clamped on head, sprinting away in terror.
    const c = t * 0.45;
    applyPose(P, {
      lean: 0.3,
      armF: [-2.6, -0.9], armB: [2.6, 0.9],
      legF: [Math.sin(c) * 0.8, -0.3 - Math.max(0, -Math.sin(c))],
      legB: [-Math.sin(c) * 0.8, -0.3 - Math.max(0, Math.sin(c))],
      eyes: 'wide', mouth: 'yell'
    });
    return P;
  }

  if (st === 'flail') {
    // Crazy stickman's absurd damaged reaction.
    const w = Math.sin(t * 1.3);
    applyPose(P, {
      lean: w * 0.3, headTilt: w * 0.3,
      armF: [2.4 * w, -1.2], armB: [-2.4 * w, 1.0],
      legF: [0.6 * w, -0.4], legB: [-0.5 * w, -0.3],
      eyes: 'wide', mouth: 'yell'
    });
    return P;
  }

  if (st === 'attack' && e.attack) {
    const poses = ATTACK_POSES[e.attack.name] || ATTACK_POSES.punch1;
    const ph = e.attack.phase;
    if (ph === 'startup')      blendPose(P, poses.cock, e.attack.prog);
    else if (ph === 'active')  blendPose(P, poses.strike, 1);
    else                       blendPose(P, poses.strike, 1 - e.attack.prog);
    P.eyes = e.enemyEyes || 'angry';
    P.mouth = ph === 'active' ? 'yell' : 'flat';
    return P;
  }

  if (e.grounded) {
    if (st === 'run') {
      const c = t * (e.runCycle || 0.32);
      const amp = e.runAmp || 0.85;
      applyPose(P, {
        lean: 0.22,
        legF: [Math.sin(c) * amp, -0.3 - Math.max(0, -Math.sin(c)) * 1.05],
        legB: [-Math.sin(c) * amp, -0.3 - Math.max(0, Math.sin(c)) * 1.05],
        armF: [-Math.sin(c) * 0.75 + 0.35, -0.55],
        armB: [Math.sin(c) * 0.75 - 0.25, -0.5],
        bob: Math.abs(Math.sin(c)) * 1.6
      });
    } else if (st === 'crouch') {
      applyPose(P, {
        crouch: 1,
        legF: [0.9, -1.7], legB: [-0.7, -1.75],
        armF: [0.4, -1.3], armB: [-0.3, -1.3],
        lean: 0.24
      });
    } else { // idle
      const b = Math.sin(t * 0.055);
      applyPose(P, {
        bob: b * 1.4,
        armF: [0.2 + b * 0.04, -0.25 - b * 0.05],
        armB: [-0.18, -0.22],
        legF: [0.12, -0.06], legB: [-0.12, -0.06],
        lean: 0.03 + b * 0.015
      });
    }
  } else {
    if ((e.vy || 0) < -1.5) { // rising
      applyPose(P, {
        legF: [0.75, -1.35], legB: [-0.35, -1.6],
        armF: [-2.3, -0.7], armB: [-2.6, -0.5],
        lean: 0.1
      });
    } else { // falling
      applyPose(P, {
        legF: [0.55, -0.35], legB: [-0.5, -0.7],
        armF: [-1.7, -0.9], armB: [-1.9, -0.7],
        lean: -0.12
      });
    }
  }

  if (e.expr === 'hurt') { P.eyes = 'hurt'; P.mouth = 'ouch'; }
  else if (e.expr === 'angry') { P.eyes = 'angry'; P.mouth = 'grim'; }
  else if (e.expr === 'dead') { P.eyes = 'dead'; P.mouth = 'tongue'; }

  return P;
}

/* ---------------- drawing ---------------- */

function drawFace(ctx, r, P) {
  const eyeY = -r * 0.22;
  const e1x = r * 0.12, e2x = r * 0.58;
  const dark = (P.eyes === 'dead' || P.eyes === 'hurt') ? '#111' : null;

  ctx.lineWidth = Math.max(1.2, r * 0.14);

  if (P.eyes === 'dead') {
    ctx.strokeStyle = '#111';
    for (const ex of [e1x, e2x]) {
      const s = r * 0.17;
      ctx.beginPath();
      ctx.moveTo(ex - s, eyeY - s); ctx.lineTo(ex + s, eyeY + s);
      ctx.moveTo(ex + s, eyeY - s); ctx.lineTo(ex - s, eyeY + s);
      ctx.stroke();
    }
  } else if (P.eyes === 'wide') {
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#111';
    for (const ex of [e1x, e2x]) {
      ctx.beginPath(); ctx.arc(ex, eyeY, r * 0.17, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(e1x + r * 0.05, eyeY, r * 0.07, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(e2x + r * 0.05, eyeY, r * 0.07, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(e1x, eyeY, r * 0.12, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(e2x, eyeY, r * 0.12, 0, Math.PI * 2); ctx.fill();
    if (P.eyes === 'angry') {
      ctx.strokeStyle = '#111';
      ctx.lineWidth = Math.max(1.4, r * 0.16);
      ctx.beginPath();
      ctx.moveTo(e1x - r * 0.16, eyeY - r * 0.3); ctx.lineTo(e1x + r * 0.2, eyeY - r * 0.13);
      ctx.moveTo(e2x + r * 0.16, eyeY - r * 0.3); ctx.lineTo(e2x - r * 0.2, eyeY - r * 0.13);
      ctx.stroke();
    } else if (P.eyes === 'hurt') {
      ctx.strokeStyle = '#111';
      ctx.lineWidth = Math.max(1.3, r * 0.14);
      for (const ex of [e1x, e2x]) {
        ctx.beginPath();
        ctx.moveTo(ex - r * 0.15, eyeY - r * 0.15);
        ctx.lineTo(ex + r * 0.05, eyeY);
        ctx.lineTo(ex - r * 0.15, eyeY + r * 0.15);
        ctx.stroke();
      }
    }
  }

  // mouth
  ctx.strokeStyle = '#111';
  ctx.lineWidth = Math.max(1.2, r * 0.14);
  const my = r * 0.42, mx = r * 0.34;
  ctx.beginPath();
  if (P.mouth === 'smile') ctx.arc(mx, my, r * 0.2, 0.15, Math.PI - 0.15);
  else if (P.mouth === 'yell') ctx.ellipse(mx, my, r * 0.16, r * 0.22, 0, 0, Math.PI * 2);
  else if (P.mouth === 'ouch') { ctx.moveTo(mx - r * 0.2, my); ctx.lineTo(mx + r * 0.2, my); }
  else if (P.mouth === 'tongue') {
    ctx.arc(mx, my - r * 0.05, r * 0.18, 0, Math.PI);
    ctx.stroke();
    ctx.fillStyle = '#ff5c7a';
    ctx.beginPath();
    ctx.ellipse(mx, my + r * 0.16, r * 0.12, r * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  else if (P.mouth === 'grim') { ctx.moveTo(mx - r * 0.22, my + r * 0.06); ctx.lineTo(mx + r * 0.2, my - r * 0.04); }
  else ctx.arc(mx, my, r * 0.12, 0.2, Math.PI - 0.2);
  ctx.stroke();
}

function drawCloth(ctx, r, style, t) {
  const type = style.clothType;
  const col = style.cloth || '#e63946';
  ctx.strokeStyle = col;
  ctx.fillStyle = col;

  if (type === 'headband' || type === 'bandana') {
    ctx.lineWidth = r * 0.42;
    ctx.beginPath();
    ctx.moveTo(-r * 0.95, -r * 0.25);
    ctx.lineTo(r * 0.95, -r * 0.25);
    ctx.stroke();
    ctx.lineWidth = r * 0.2;
    const w = Math.sin(t * 0.25) * r * 0.3;
    ctx.beginPath();
    ctx.moveTo(-r * 0.9, -r * 0.25);
    ctx.quadraticCurveTo(-r * 1.5, -r * 0.1 + w, -r * 1.8, r * 0.35 + w);
    ctx.stroke();
  } else if (type === 'visor') {
    ctx.fillRect(r * 0.02, -r * 0.45, r * 0.85, r * 0.36);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = r * 0.08;
    ctx.strokeRect(r * 0.02, -r * 0.45, r * 0.85, r * 0.36);
  } else if (type === 'mohawk') {
    ctx.beginPath();
    for (let i = -2; i <= 2; i++) {
      const bx = i * r * 0.32;
      ctx.moveTo(bx - r * 0.16, -r * 0.78);
      ctx.lineTo(bx, -r * 1.5 - Math.abs(Math.sin(t * 0.1 + i)) * r * 0.1);
      ctx.lineTo(bx + r * 0.16, -r * 0.78);
    }
    ctx.fill();
  }
}

/**
 * Draw a stickman. Entity needs: x, y (feet), facing, scale,
 * style {body, cloth, clothType}, state, animTime, optional rot.
 */
function drawStickman(ctx, e, poseOverride) {
  const s = e.scale || 1;
  const f = e.facing >= 0 ? 1 : -1;
  const P = poseOverride || stickPose(e);
  const style = e.style || { body: '#141414', cloth: '#e63946', clothType: 'headband' };
  const flash = (e.flash | 0) > 0;
  const bodyCol = flash ? '#ffffff' : (style.body || '#141414');

  const feetY = e.y + (P.bob || 0);
  const cx = e.x;

  ctx.save();

  // whole-body rotation (spinning deaths / knockdowns)
  if (e.rot) {
    const pivotY = e.y - 30 * s;
    ctx.translate(e.x, pivotY);
    ctx.rotate(e.rot);
    ctx.translate(-e.x, -pivotY);
  }

  // skeleton metrics
  const pelvisY = feetY - 32 * s + P.crouch * 13 * s;
  const torsoLen = 26 * s;
  const neckDir = sv(Math.PI - P.lean);
  const neckX = cx + neckDir.x * torsoLen;
  const neckY = pelvisY + neckDir.y * torsoLen;

  const headR = 9.4 * s;
  const headDir = sv(Math.PI - (P.lean + P.headTilt));
  const headX = cx + headDir.x * (torsoLen + headR * 0.95);
  const headY = pelvisY + headDir.y * (torsoLen + headR * 0.95);

  const armLen1 = 13 * s, armLen2 = 12 * s;
  const legLen1 = 17 * s, legLen2 = 17 * s;

  function limb(ox, oy, a1, a2, l1, l2) {
    const d1 = sv(a1);
    const mx = ox + d1.x * l1, my = oy + d1.y * l1;
    const d2 = sv(a1 + a2);
    ctx.lineTo(mx, my);
    ctx.lineTo(mx + d2.x * l2, my + d2.y * l2);
  }

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const drawArm = (angles, col, widthScale) => {
    ctx.strokeStyle = col;
    ctx.lineWidth = 4.4 * s * (widthScale || 1);
    ctx.beginPath();
    ctx.moveTo(neckX, neckY);
    limb(neckX, neckY, f * angles[0], f * angles[1], armLen1, armLen2);
    ctx.stroke();
  };
  const drawLeg = (angles, col, widthScale) => {
    ctx.strokeStyle = col;
    ctx.lineWidth = 5 * s * (widthScale || 1);
    ctx.beginPath();
    ctx.moveTo(cx, pelvisY);
    limb(cx, pelvisY, f * angles[0], f * angles[1], legLen1, legLen2);
    ctx.stroke();
  };

  // back limbs (shaded)
  const backCol = flash ? '#dddddd' : shade(bodyCol, 0.62);
  drawArm(P.armB, backCol, 0.92);
  drawLeg(P.legB, backCol, 0.95);

  // torso
  ctx.strokeStyle = bodyCol;
  ctx.lineWidth = 5.6 * s;
  ctx.beginPath();
  ctx.moveTo(cx, pelvisY);
  ctx.lineTo(neckX, neckY);
  ctx.stroke();

  // body clothing
  if (style.clothType === 'scarf') {
    ctx.fillStyle = style.cloth;
    ctx.beginPath();
    ctx.moveTo(neckX, neckY);
    ctx.lineTo(neckX - f * 14 * s, neckY + 6 * s + Math.sin((e.animTime || 0) * 0.2) * 3 * s);
    ctx.lineTo(neckX - f * 4 * s, neckY + 12 * s);
    ctx.closePath();
    ctx.fill();
  } else if (style.clothType === 'belt') {
    ctx.strokeStyle = style.cloth;
    ctx.lineWidth = 5 * s;
    ctx.beginPath();
    ctx.moveTo(cx - 7 * s, pelvisY - 2 * s);
    ctx.lineTo(cx + 7 * s, pelvisY - 2 * s);
    ctx.stroke();
  } else if (style.clothType === 'vest') {
    ctx.strokeStyle = style.cloth;
    ctx.lineWidth = 6 * s;
    ctx.beginPath();
    ctx.moveTo(cx + f * 3 * s, neckY + 3 * s);
    ctx.lineTo(cx + f * 2 * s, pelvisY - 3 * s);
    ctx.stroke();
  }

  // front limbs
  drawArm(P.armF, bodyCol);
  drawLeg(P.legF, bodyCol);

  // simple foot flick on the front leg
  ctx.strokeStyle = bodyCol;
  ctx.lineWidth = 4.4 * s;
  const fd = sv(f * (P.legF[0] + P.legF[1]));
  const footX = cx + fd.x * (legLen1 + legLen2);
  const footY = pelvisY + fd.y * (legLen1 + legLen2);
  ctx.beginPath();
  ctx.moveTo(footX, footY);
  ctx.lineTo(footX + f * 6 * s, footY + 1);
  ctx.stroke();

  // head
  ctx.fillStyle = bodyCol;
  ctx.beginPath();
  ctx.arc(headX, headY, headR, 0, Math.PI * 2);
  ctx.fill();

  // face + headwear in head-local space
  ctx.save();
  ctx.translate(headX, headY);
  ctx.rotate(-f * (P.lean + P.headTilt) * 0.5);
  if (f < 0) ctx.scale(-1, 1);
  ctx.strokeStyle = bodyCol;
  ctx.fillStyle = bodyCol;
  drawFace(ctx, headR, P);
  drawCloth(ctx, headR, style, e.animTime || 0);
  ctx.restore();

  ctx.restore();
}

/** Darken a hex color (t = brightness multiplier). */
function shade(hex, t) {
  if (hex[0] !== '#') return hex;
  const n = parseInt(hex.slice(1), 16);
  if (isNaN(n)) return hex;
  const r = Math.min(255, ((n >> 16) & 255) * t) | 0;
  const g = Math.min(255, ((n >> 8) & 255) * t) | 0;
  const b = Math.min(255, (n & 255) * t) | 0;
  return 'rgb(' + r + ',' + g + ',' + b + ')';
}

/** Soft blob shadow under a character. */
function drawShadow(ctx, e, groundY) {
  const h = Math.max(0, groundY - e.y);
  const a = Math.max(0.06, 0.3 - h * 0.0016);
  const w = 26 * (e.scale || 1) * (1 - Math.min(0.5, h * 0.003));
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,' + a.toFixed(3) + ')';
  ctx.beginPath();
  ctx.ellipse(e.x, groundY + 4, w, 5.5 * (e.scale || 1), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}