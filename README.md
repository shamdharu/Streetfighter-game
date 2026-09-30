# Stickman Rampage

An original, fully playable 2D side-scrolling stickman action game built with
HTML5 Canvas, CSS3 and vanilla JavaScript — no frameworks, no external assets.

## Run it

Serve the folder with any static server and open the URL in a browser:

```bash
# Python
python -m http.server 8080

# or Node
npx serve .
```

Then open http://localhost:8080

## Controls

| Key | Action |
| --- | --- |
| A / D or arrows | Move |
| W or Up | Jump |
| S / Down | Crouch (hold on a platform to drop through) |
| J | Punch |
| K | Kick (S+K = low kick, in air = jump kick) |
| L | Weapon attack / shoot (hold with rifle = autofire) |
| Q | Drop current weapon |
| SPACE | Special attack (costs energy) |
| P / ESC | Pause |
| M | Mute / unmute |
| ENTER | Confirm menus |

### Combo style ladder (each press = a NEW style, then it resets)

- **K** → snap kick, **K K** → ROUNDHOUSE (180° spin + yellow swoosh),
  **K K K** → TORNADO KICK (hop + full 360° spin + orange burst finisher)
- **J** → jab, **J J** → HOOK (spinning arm + cyan trail), **J J J** → UPPERCUT
  (launches enemies + orange burst)
- **L L L** (melee weapon) → swing → REVERSE sweep → spinning FINISHER
- Finishers cause extra hit-stop, screen shake, star bursts and a
  "SMASH!" popup — then the chain returns to the base style.
- S+K = low kick (chains into the kick ladder); air K = jump kick
- Land hits within 2.5s to build the **COMBO** counter and score multiplier.

## Game systems

- **3 levels** (Street Cleanup, Park Panic, Factory Fury) with ambush groups,
  locked gates, platforms, crates, pickups, weapon drops, a miniboss and a boss.
- **5 enemy types**: Grunt, Sprinter, Heavy, Gunner (keeps distance and shoots),
  Wacko (erratic), plus the miniboss *The Wall*.
- **Bosses** with attack patterns (charge, ground-slam shockwaves, projectiles,
  summons), a rage phase below 50% HP, and a funny white-flag death.
- **Weapons**: bat, sword, pistol, rifle, zap blaster — different damage, range,
  knockback and ammo.
- **Power-ups**: health, energy, damage x2, speed x2, shield.
- **Funny cartoon deaths**: enemies fly, spin, stumble and stick their tongues
  out — no gore.
- **Game feel**: hit-stop, screen shake, knockback, impact particles, floating text.
- **HUD**: health/energy bars, score, combo counter, weapon + ammo, boss bar.
- **Sounds**: all procedurally generated (original), never copyrighted samples.

## Project structure

```
/index.html
/style.css
/js/input.js      keyboard input & buffering
/js/audio.js      generated sound effects
/js/stickman.js   procedural stickman renderer & poses
/js/combat.js     attacks, weapons, physics, hit resolution
/js/level.js      level data, triggers, gates, scenery
/js/player.js     player states, combos, weapons
/js/enemy.js      enemy AI, funny deaths, bosses
/js/game.js       main loop, camera, HUD, screens
/assets/          empty — everything is generated
/tools/smoke.js   headless runtime test (optional, requires Node)
```

## Credits

100% original code and generated art/audio. Not affiliated with or derived from
any existing stickman game.
