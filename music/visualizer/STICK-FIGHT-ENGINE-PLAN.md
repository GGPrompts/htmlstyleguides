# Stick Fight Engine — Full Implementation Plan

## Overview

A shared stick figure animation engine for the music visualizer. Provides reusable skeleton rendering, physics ragdoll, combat moves, and gore effects — usable for both battle scenes (stickdeath.com style) and peaceful scenes (dance, drama, crowds).

**21 of 52 videos** have stick figure characters that can use this engine.

## Architecture

**One new file:** `music/visualizer/stick-fight-engine.js`
- IIFE module exposing `window.StickFight`
- ES5 style (matches codebase — no class/const/let/arrows)
- Videos load it with `<script src="stick-fight-engine.js"></script>` before their inline renderer
- Not a renderer itself — a toolkit that video renderers call into

## Phase 1: Core Skeleton + Pose System (~150 lines)

Create `stick-fight-engine.js` with:

- **`StickFight.create(opts)`** — creates a figure with position, facing, color, figH, analytical pose params + targets
- **`StickFight.computeJoints(fig)`** — computes 13 named joint positions (head, neck, shoulderL/R, elbowL/R, handL/R, hip, kneeL/R, ankleL/R) from pose params, all relative to figH. Based on the `wap-video.html` pattern.
- **`StickFight.drawFigure(ctx, fig, joints)`** — draws skeleton with stroke lines + head circle. Handles facing via `ctx.scale(facing, 1)`.
- **`StickFight.setPose(fig, name)`** — sets targets from a named pose library
- **`StickFight.setTarget(fig, key, val)`** — direct target override for custom poses
- **`StickFight.updateFigure(fig, dt)`** — lerps params toward targets using `lerpExp`
- **`StickFight.updateAll(figs, dt)` / `drawAll(ctx, figs)`** — batch helpers

### Bone Proportions (relative to figH)
```
headR: 0.07, neckLen: 0.06, shoulder: 0.10, hipWidth: 0.12,
torso: 0.28, upperArm: 0.13, forearm: 0.12, thigh: 0.20, shin: 0.19
```

### Pose Library
- **Combat:** idle, guard, lunge, punch, kick, block, recoil
- **Dance:** dance_basic, arms_up
- **Drama:** kneel, fallen

### Pose Parameters (lerped scalars)
```
lean, bounce, armLAngle, armRAngle, elbowLBend, elbowRBend,
legPhase, legSpread, hipThrust, headTilt, headBob, crouching
```

## Phase 2: Ragdoll Physics (~150 lines)

Verlet point-mass ragdoll system:

- **`StickFight.goRagdoll(fig, groundY, impulseX, impulseY)`** — snapshots current joint positions into 13 point masses with distance constraints, switches from 'pose' to 'ragdoll' mode
- **Verlet integration:** position + previous position (velocity implicit), gravity, ground collision with bounce/friction
- **Constraint projection:** 6 iterations per frame, 15 distance constraints between joints
- **`drawRagdoll(ctx, fig)`** — draws from ragdoll point positions
- `updateAll` and `drawAll` automatically handle both modes

### Ragdoll Constants
```
gravity: 900 px/s^2, groundBounce: 0.25, friction: 0.85, constraintIterations: 6
```

### Constraints (bone connections)
```
head-neck, neck-shoulderL, neck-shoulderR, shoulderL-shoulderR,
neck-hip (torso), hip-shoulderL (diagonal), hip-shoulderR (diagonal),
shoulderL-elbowL, elbowL-handL, shoulderR-elbowR, elbowR-handR,
hip-kneeL, kneeL-ankleL, hip-kneeR, kneeR-ankleR
```

## Phase 3: Combat System (~150 lines)

Attack moves with hit detection:

- **Move library** (`MOVES`): punch_r, punch_l, kick_high, slash, lunge, block, grab
  - Each has: duration, keyframe phases, hitAt timing, hitRange, damage, impulse
- **`StickFight.attack(attacker, moveName, target)`** — starts an attack, drives pose from keyframes
- **Hit detection:** distance from weapon tip / fist to target torso at hitAt time
- **`applyHit(target, hit, attacker)`** — damage, stun, recoil pose, or ragdoll if lethal
- Block reduces incoming damage when target is in block pose
- Simple combo tracker (hit within 0.8s window increments combo counter)

### Move Example
```
punch_r: { duration: 0.22, hitAt: 0.12, hitRange: 0.18 * figH,
           damage: 15, impulseX: 400, impulseY: -150 }
```

## Phase 4: Gore & Effects (~100 lines)

All opt-in — zero overhead if not called:

- **Blood particles:** `spawnBlood(x, y, count, impulseX, impulseY)` — red particles with gravity, ground splats that linger
- **Dismemberment:** `detachLimb(fig, limbName, groundY)` — severs a limb into an independent mini-ragdoll (2-3 point Verlet). Triggered on overkill damage (-20hp).
  - Limb types: armR, armL, legR, legL, head
- **Death types:** `applyDeath(fig, type, groundY)`
  - `'collapse'` — stumble backward and crumple (small ragdoll impulse)
  - `'flung'` — strong hit sends figure flying (large impulse)
  - `'dramatic'` — kneel for 0.5s, then tip over into ragdoll
- **`updateEffects(dt, groundY)` / `drawEffects(ctx)`** — batch update/draw

## Phase 5: Fencing Match Refactor

Full refactor of `fencing-match-in-a-thunderstorm-video.html`:

1. Add `<script src="stick-fight-engine.js"></script>`
2. Replace `fencerA/B` objects with `StickFight.create()` calls
3. Replace `drawFencer()` (~80 lines) with `StickFight.drawAll()`
4. Replace `setLunge/setParry/setGuard` with `StickFight.setPose()` + `StickFight.attack()`
5. Replace `updateFencer()` with `StickFight.updateAll()`
6. Add actual hit detection + ragdoll death in denouement
7. Add blood on sword hits in finale
8. Keep scene-specific effects (rain, lightning, sparks) in the video file

## Phase 6+: Refactor Remaining Videos

### High-Priority (complex jointed skeletons — most benefit)
- `wap-video.html` — 13-joint skeleton, dance moves, hair physics
- `tavern-brawl-crescendo-video.html` — 8 patrons, brawl + thrown objects
- `classical-runner-overture-video.html` — running gait animation
- `hollow-choir-ascendant-video.html` — breathing + mouth animation
- `the-duel-at-worlds-end-video.html` — two dueling musicians
- `the-divas-aria-video.html` — full figure with dress + singing mouth

### Medium-Priority (simpler skeletons)
- `through-the-fire-and-flames-video.html` — warrior with sword
- `survivors-campfire-video.html` — sitting pose
- `survivors-forest-video.html` — sword arm
- `survivors-cosmic-video.html` — arm angles
- `survivors-gothic-video.html` — vampire + fighter variants
- `long-december-video.html` — walking figures

### Lower-Priority (basic/crowd figures)
- `cyber-cathedral-requiem-video.html` — congregation
- `bazaar-of-the-midnight-sun-video.html` — crowd
- `ocarina-echoes-video.html` — pixel character
- `bowser-on-steroids-video.html` — boss monster (non-humanoid)
- `cradle-of-the-colossus-video.html` — giant colossus
- `requiem-in-stone-video.html` — gargoyle (non-humanoid)
- `speedrun-any-percent-video.html` — pixel hero + dragon
- `save-corrupted-video.html` — pixel-grid sprite

## Video Usage Pattern

```js
// init
var a = StickFight.create({ x: W*0.35, y: groundY, figH: H*0.3, facing: 1, color: '#8898c8' });
var b = StickFight.create({ x: W*0.65, y: groundY, figH: H*0.3, facing: -1, color: '#c09070' });

// on beat — choreography is per-video
if (beat % 8 < 4) {
  StickFight.attack(a, 'lunge', b);
  StickFight.setPose(b, 'block');
} else {
  StickFight.attack(b, 'slash', a);
  StickFight.setPose(a, 'guard');
}

// each frame
StickFight.updateAll([a, b], dt, groundY);
StickFight.updateEffects(dt, groundY);
StickFight.drawAll(ctx, [a, b]);
StickFight.drawEffects(ctx);
```

For non-combat videos: just `create` + `setPose` + `updateAll` + `drawAll`. No attacks, no gore.

## Key Reference Files

| File | Why |
|------|-----|
| `music/visualizer/engine.js` | Visualizer frameData API (ctx, dt, cursor, analysis) |
| `music/visualizer/wap-video.html` | Best named-joint skeleton (`computeJoints`) |
| `music/visualizer/fencing-match-in-a-thunderstorm-video.html` | Cleanest combat choreography |
| `music/visualizer/tavern-brawl-crescendo-video.html` | Multi-figure + hit-stun + expressions |
| `music/visualizer/CLAUDE.md` | Renderer conventions |

## Design Decisions

- **ES5 IIFE** — matches codebase style, no transpilation needed
- **lerpExp** for pose transitions — simple, framerate-stable, proven across all existing videos
- **Verlet ragdoll** — self-contained (no separate velocity state), trivial ground collision, naturally janky aesthetic matching stickdeath style
- **Named poses + free targets** — `setPose('guard')` for common cases, `setTarget(fig, 'armRAngle', -1.5)` for custom
- **Gore is opt-in** — particle pools start empty, zero overhead if not called
- **Single file** — keeps `<script>` requirement minimal; split only if >700 lines
