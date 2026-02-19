# Music Visualizer

Canvas-based music visualizer synced to the chiptune song library (57 songs). Pluggable renderer system — new visual styles can be authored independently.

## Architecture

```
music-visualizer/
  index.html              # Hub: full-viewport canvas + overlay UI
  engine.js               # Core: audio, cursor, analysis, canvas, renderer dispatch
  renderers/
    particle-field.js     # Particle bursts from channel quadrants
    waveform-grid.js      # Scrolling note blocks in horizontal lanes
    spectrum-rings.js     # Concentric rotating rings per channel
```

### Engine (`engine.js`) — `window.Visualizer`

Creates an `AudioContext` shared with `ChipPlayer` via `initExternal()`. On song load, normalizes the tracker-native JSON to compact format and runs pre-analysis.

**Pre-analysis** produces:
- `pitchRange` — min/max MIDI across all channels
- `channelRoles` — heuristic role per channel (lead/harmony/bass/percussion)
- `timeline[]` — flattened row-by-row note data for the full sequence
- `energy[]` — 0.0–1.0 per row (note density + pitch spread)
- `sectionChanges[]` — row indices where patterns change
- `totalDuration`, `secondsPerRow`, `secondsPerBeat`

**Song cursor** mirrors ChipPlayer's deterministic timing (`60 / (bpm * rpb)`) from `AudioContext.currentTime`. Computed every frame with fractional interpolation.

**Public API**: `init(canvas)`, `loadSong(json)`, `setRenderer(name)`, `play()`, `stop()`, `setVolume(v)`, `getRendererList()`, `getAnalysis()`, `getSong()`

### Dependencies (not modified)

- `games/audio-tracker/playback-engine.js` — ChipPlayer audio engine
- `games/audio-tracker/songs/index.json` — song manifest (title, category, BPM)
- `games/audio-tracker/songs/*.json` — song data files

## Writing a New Renderer

Register on the global `window.Renderers` object. The engine handles all DOM, audio, and timing — renderers just draw.

```js
window.Renderers['my-renderer'] = {
  name: 'Display Name',

  // Called on song load or renderer switch
  init(ctx, width, height, analysis) {
    // Set up internal state, color palettes, etc.
    // `analysis` contains pitchRange, channelRoles, timeline, energy, etc.
  },

  // Called every animation frame during playback
  render(frameData) {
    // Draw to frameData.ctx (already DPR-scaled, cleared)
  },

  // Optional — called on window resize
  resize(width, height) {},

  // Optional — cleanup when switching away
  destroy() {}
};
```

### `frameData` passed to `render()`

| Field | Type | Description |
|---|---|---|
| `ctx` | CanvasRenderingContext2D | DPR-scaled, pre-cleared |
| `width`, `height` | number | CSS pixels (not physical) |
| `dt` | number | Delta time in seconds since last frame |
| `cursor` | object or null | `{ seqIndex, rowIndex, globalRow, fractionalRow, totalFracRow, beat, bar, elapsed, timelineIndex }` |
| `currentNotes` | array | `[ch0, ch1, ch2, ch3]` — each `{ midi, freq, instrument, wave, vol, channel, normalized }` or `null` |
| `analysis` | object | Pre-computed song analysis (see above) |
| `song` | object | Normalized song JSON |

`cursor` is `null` when stopped. `currentNotes[i].normalized` is 0.0–1.0 within the song's pitch range.

### Renderer rules

- Never touch DOM or manage audio — just draw on the provided `ctx`
- Use `frameData.analysis.channelRoles` to assign visual meaning to channels
- Use `frameData.cursor.beat` / `fractionalRow` for beat-synced effects
- Use `frameData.analysis.energy[cursor.timelineIndex]` for intensity effects
- Handle `cursor === null` gracefully (idle/stopped state)

### Adding to the hub

1. Create `renderers/my-renderer.js`
2. Add a `<script>` tag in `index.html` before the inline `<script>` block
3. It auto-appears in the renderer dropdown

## Stick Fight Engine (`stick-fight-engine.js`)

Shared stick-figure skeleton, pose, and ragdoll toolkit. Not a renderer — a module that video renderers call into. ES5 IIFE exposing `window.StickFight`.

### Loading

Add the script tag **after** `engine.js` and **before** the inline renderer:

```html
<script src="../audio-tracker/playback-engine.js"></script>
<script src="engine.js"></script>
<script src="stick-fight-engine.js"></script>
<script>
window.Renderers['my-video'] = (function() { ... })();
</script>
```

### Quick Start Pattern

```js
// In init():
var figH = H * 0.3;
var groundY = H * 0.78;
var a = StickFight.create({ x: W * 0.35, y: groundY, figH: figH, facing: 1, color: '#8898c8' });
var b = StickFight.create({ x: W * 0.65, y: groundY, figH: figH, facing: -1, color: '#c09070' });

// On beat:
StickFight.setPose(a, 'lunge');
StickFight.setPose(b, 'block');

// Each frame:
StickFight.updateAll([a, b], dt);
StickFight.drawAll(ctx, [a, b]);
```

### API Reference

| Function | Description |
|----------|-------------|
| `create(opts)` | New figure. Options: `x, y, figH, facing (1/-1), color, lineWidth, poseSpeed` |
| `setPose(fig, name)` | Set targets from named pose library |
| `setTarget(fig, key, val)` | Override a single target parameter |
| `computeJoints(fig)` | Returns 13 joint positions (relative to feet at 0,0) |
| `drawFigure(ctx, fig, joints?)` | Draw one figure (joints computed if omitted) |
| `updateFigure(fig, dt)` | Lerp params toward targets (or step ragdoll) |
| `updateAll(figs, dt)` | Batch update |
| `drawAll(ctx, figs)` | Batch draw (auto-handles pose vs ragdoll mode) |
| `goRagdoll(fig, groundY, impulseX, impulseY)` | Switch to Verlet ragdoll physics |
| `lerpExp(cur, tgt, speed, dt)` | Exponential lerp helper |
| `defaultParams()` | Fresh pose parameter object |

### Figure Object

Created by `StickFight.create()`. Key fields:

```
fig.x, fig.y         — world position (feet)
fig.figH             — total figure height in pixels
fig.facing           — 1 (right) or -1 (left)
fig.color            — stroke color
fig.lineWidth        — stroke width (default 3)
fig.params           — current pose parameters (lerped each frame)
fig.targets          — target pose parameters (set by setPose/setTarget)
fig.poseSpeed        — lerp speed (default 10, higher = snappier)
fig.mode             — 'pose' or 'ragdoll'
fig.ragdoll          — Verlet state (null until goRagdoll called)
```

### Pose Parameters

All params are numbers, lerped smoothly each frame:

| Param | Range | Effect |
|-------|-------|--------|
| `bounce` | -1..1 | Vertical bob (positive = up) |
| `lean` | -1..1 | Torso lean (positive = forward relative to facing) |
| `armLAngle` | radians | Left arm angle from straight-down (negative = up/forward) |
| `armRAngle` | radians | Right arm angle |
| `elbowLBend` | 0..1 | Left forearm bend |
| `elbowRBend` | 0..1 | Right forearm bend |
| `legSpread` | 0..1 | Stance width |
| `kneeL` | -1..1 | Left knee offset (negative = forward) |
| `kneeR` | -1..1 | Right knee offset |
| `swordAngle` | radians | Weapon angle (only drawn if swordLen > 0) |
| `swordLen` | 0..1 | Weapon length as fraction of figH (0 = no weapon) |

### Named Poses

`idle` `guard` `lunge` `punch` `kick` `block` `recoil` `dance_basic` `arms_up` `kneel` `fallen` `salute`

Use `setPose` to set all targets at once, then `setTarget` to tweak individual params:

```js
StickFight.setPose(fig, 'guard');
StickFight.setTarget(fig, 'swordAngle', -0.5);  // custom sword position
StickFight.setTarget(fig, 'lean', 0.3);          // lean forward more
```

### Bone Proportions (fractions of figH)

```
headR: 0.07, neck: 0.06, shoulder: 0.09, torso: 0.28,
upperArm: 0.13, forearm: 0.12, thigh: 0.20, shin: 0.19
```

Accessible as `StickFight.BONE`. Total standing height ≈ `shin + thigh + torso + neck + headR*2` = ~0.81 * figH (rest is bounce headroom).

### Joint Names (13 points)

`head` `neck` `shoulderL` `shoulderR` `elbowL` `elbowR` `handL` `handR` `hip` `kneeL` `kneeR` `ankleL` `ankleR`

Positions are relative to (0,0) at the figure's feet, y-negative = up. Use `computeJoints(fig)` to get them, e.g. for attaching effects to a hand or checking sword tip position.

### Ragdoll

Switch a figure to ragdoll mode when it should collapse/fly/tumble:

```js
// On the killing blow:
StickFight.goRagdoll(fig, groundY, impulseX, impulseY);
// impulseX/Y in pixels/sec — e.g. (200, -300) launches up-right
```

- Snapshots current joint positions into 13 Verlet point masses
- Distance constraints keep limbs connected
- Ground collision with configurable bounce (0.3) and friction (0.85)
- Auto-settles after 0.5s of low velocity
- `updateAll` and `drawAll` handle ragdoll figures automatically
- Once ragdolled, the figure stays ragdolled (no automatic recovery)

### Weapons

Figures can hold a sword/weapon drawn from `handL`:

```js
fig.params.swordLen = 0.35;    // set both current and target
fig.targets.swordLen = 0.35;   // (fraction of figH)
StickFight.setTarget(fig, 'swordAngle', -0.2);  // angle in radians
```

The engine draws the blade (silver) with a guard crossbar (figure color). For attack flash effects (glow on sword tip), handle that in your renderer — see `fencing-match-in-a-thunderstorm-video.html` for the pattern.

### Coordinate System

- `fig.y` is the **ground line** (feet position). Figures extend upward (negative y).
- `drawFigure` translates to `(fig.x, fig.y)` internally, so joint coords are local.
- Ragdoll points are in **world coordinates** (no translation needed).
- `facing` flips arm movement direction but not the skeleton — arms that reach "forward" go in the facing direction.

### Integration Tips

- **Non-combat videos** only need `create` + `setPose` + `updateAll` + `drawAll` — no weapons, no ragdoll.
- **Custom poses**: use `setTarget` to tweak individual params after `setPose`, or skip `setPose` entirely and set all targets manually.
- **Beat sync**: call `setPose` on beat changes, let `updateAll(figs, dt)` handle smooth transitions.
- **Multiple figures**: pass arrays to `updateAll` / `drawAll`. Create as many as you need.
- **Scene-specific drawing** (hair, clothing, faces, glow effects) stays in the video renderer — the engine just draws the skeleton.
- **Position movement**: update `fig.x` directly in your renderer (the engine doesn't move figures laterally).

### Videos Using the Engine

| Video | Pattern |
|-------|---------|
| `fencing-match-in-a-thunderstorm-video.html` | 2 armed figures, pose choreography + denouement ragdoll |

### Future Sessions (not yet implemented)

- **Combat system**: `StickFight.attack(attacker, moveName, target)` — hit detection, reactions
- **Gore & effects**: `StickFight.updateEffects(dt)` / `drawEffects(ctx)` — blood particles, dismemberment
- Remaining ~20 stick figure videos to be refactored to use the engine

## Embeddability

Other pages can embed a visualizer background:

```html
<canvas id="bg-viz" style="position:fixed;top:0;left:0;width:100%;height:100%"></canvas>
<script src="games/audio-tracker/playback-engine.js"></script>
<script src="games/music-visualizer/engine.js"></script>
<script src="games/music-visualizer/renderers/particle-field.js"></script>
<script>
  Visualizer.init(document.getElementById('bg-viz'));
  fetch('games/audio-tracker/songs/crystal-caves.json')
    .then(r => r.json())
    .then(json => {
      Visualizer.loadSong(json);
      Visualizer.setRenderer('particle-field');
    });
</script>
```
