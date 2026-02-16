// ============================================================
// SURVIVORS ENGINE v1.0
// Expects window.THEME to be defined before this script loads.
// ============================================================

// ============================================================
// AUDIO ENGINE (Web Audio API - all synthesized)
// ============================================================
const Audio = (() => {
  let actx = null;
  let masterGain = null;
  let ambientOsc = null;
  let ambientFilter = null;
  let muted = false;

  function init() {
    if(actx) return;
    actx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = actx.createGain();
    masterGain.gain.value = 0.4;
    masterGain.connect(actx.destination);
    startAmbient();
  }

  function startAmbient() {
    ambientOsc = actx.createOscillator();
    ambientFilter = actx.createBiquadFilter();
    const ambGain = actx.createGain();
    ambientOsc.type = 'sawtooth';
    ambientOsc.frequency.value = 55;
    ambientFilter.type = 'lowpass';
    ambientFilter.frequency.value = 200;
    ambientFilter.Q.value = 2;
    ambGain.gain.value = 0.06;
    ambientOsc.connect(ambientFilter);
    ambientFilter.connect(ambGain);
    ambGain.connect(masterGain);
    ambientOsc.start();
  }

  function updateAmbient(progress) {
    if(!ambientFilter) return;
    ambientFilter.frequency.value = 200 + progress * 600;
  }

  function note(freq, dur, type='sine', vol=0.15, detune=0) {
    if(!actx) return;
    const t = actx.currentTime;
    const o = actx.createOscillator();
    const g = actx.createGain();
    o.type = type;
    o.frequency.value = freq;
    o.detune.value = detune;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t+dur);
    o.connect(g); g.connect(masterGain);
    o.start(t); o.stop(t+dur);
  }

  function noise(dur, vol=0.1) {
    if(!actx) return;
    const t = actx.currentTime;
    const buf = actx.createBuffer(1, actx.sampleRate*dur, actx.sampleRate);
    const data = buf.getChannelData(0);
    for(let i=0;i<data.length;i++) data[i] = Math.random()*2-1;
    const src = actx.createBufferSource();
    const g = actx.createGain();
    const f = actx.createBiquadFilter();
    src.buffer = buf;
    f.type = 'highpass'; f.frequency.value = 2000;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t+dur);
    src.connect(f); f.connect(g); g.connect(masterGain);
    src.start(t); src.stop(t+dur);
  }

  function weaponSound(type, level) {
    const l = level || 1;
    if(type==='projectile') {
      note(800+l*100, 0.1, 'sine', 0.08);
      note(1200+l*150, 0.06, 'sine', 0.05);
    } else if(type==='orbit') {
      note(400+l*50, 0.15, 'triangle', 0.04);
    } else if(type==='area') {
      note(200, 0.3, 'sine', 0.1);
      note(400, 0.2, 'sine', 0.06);
      noise(0.15, 0.06);
    } else if(type==='chain') {
      note(600, 0.05, 'sawtooth', 0.07);
      note(900, 0.04, 'sawtooth', 0.05);
      note(1200, 0.03, 'sawtooth', 0.04);
    } else if(type==='beam') {
      note(300+l*30, 0.4, 'sawtooth', 0.05);
    } else if(type==='rain') {
      note(150, 0.15, 'sine', 0.06);
      noise(0.1, 0.08);
    } else if(type==='boomerang') {
      note(500, 0.08, 'triangle', 0.06);
      note(700, 0.06, 'triangle', 0.04);
    } else if(type==='field') {
      note(150, 0.5, 'sine', 0.04);
      note(225, 0.4, 'sine', 0.03);
    }
  }

  function hitSound() { noise(0.06, 0.12); note(200, 0.05, 'square', 0.06); }
  function deathSound() { note(300, 0.15, 'sawtooth', 0.08); note(150, 0.25, 'sawtooth', 0.06); noise(0.1, 0.07); }

  let gemChain = 0; let gemChainTimer = 0;
  function gemSound() {
    gemChain++;
    const freq = 600 + Math.min(gemChain, 20) * 40;
    note(freq, 0.12, 'sine', 0.07);
    note(freq*1.5, 0.08, 'sine', 0.04);
    clearTimeout(gemChainTimer);
    gemChainTimer = setTimeout(() => { gemChain = 0; }, 400);
  }

  function levelUpSound() {
    const t = actx ? actx.currentTime : 0;
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => note(f, 0.3, 'sine', 0.1), i*80);
    });
  }

  function bossWarning() {
    for(let i=0;i<4;i++) {
      setTimeout(() => {
        note(80, 0.3, 'sawtooth', 0.12);
        noise(0.1, 0.1);
      }, i*300);
    }
    note(60, 1.5, 'sawtooth', 0.08);
  }

  function heartbeat() {
    note(60, 0.1, 'sine', 0.15);
    setTimeout(() => note(55, 0.12, 'sine', 0.12), 120);
  }

  function damageTaken() {
    noise(0.08, 0.15);
    note(120, 0.1, 'square', 0.08);
  }

  function dashSound() {
    noise(0.04, 0.08);
    note(400, 0.08, 'sine', 0.06);
    setTimeout(() => note(600, 0.06, 'sine', 0.04), 30);
  }

  function toggleMute() {
    muted = !muted;
    if(masterGain) masterGain.gain.value = muted ? 0 : 0.4;
    return muted;
  }

  function victoryFanfare() {
    [523, 659, 784, 1047, 1318, 1568].forEach((f, i) => {
      setTimeout(() => note(f, 0.5, 'sine', 0.12), i*120);
    });
    setTimeout(() => {
      [1047, 1318, 1568, 2093].forEach((f, i) => {
        setTimeout(() => note(f, 0.8, 'sine', 0.1), i*150);
      });
    }, 800);
  }

  function lootSound(rarity) {
    if(rarity === 'legendary') {
      [784, 988, 1175, 1568].forEach((f, i) => {
        setTimeout(() => note(f, 0.4, 'sine', 0.12), i * 70);
      });
    } else if(rarity === 'epic') {
      note(660, 0.25, 'sine', 0.1);
      setTimeout(() => note(880, 0.3, 'sine', 0.1), 80);
    } else if(rarity === 'rare') {
      note(550, 0.2, 'sine', 0.08);
      setTimeout(() => note(700, 0.15, 'sine', 0.06), 60);
    } else {
      note(440, 0.15, 'sine', 0.06);
    }
  }

  return { init, note, noise, weaponSound, hitSound, deathSound, gemSound, levelUpSound, bossWarning, heartbeat, damageTaken, dashSound, updateAmbient, toggleMute, victoryFanfare, lootSound };
})();

// ============================================================
// SAVE MANAGER (localStorage + JSON export/import)
// ============================================================
const SaveManager = (() => {
  const STORAGE_KEY = 'survivors-save';
  const CURRENT_VERSION = 1;

  function defaultState() {
    return {
      version: CURRENT_VERSION,
      gold: 0,
      skillPoints: 0,
      currentWorld: 0,
      inventory: [],
      equipped: [],
      skillTree: {},
      upgrades: {},
      stats: {
        totalKills: 0,
        bestTime: 0,
        runsCompleted: 0
      }
    };
  }

  function save(data) {
    try {
      const merged = Object.assign(defaultState(), data);
      merged.version = CURRENT_VERSION;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      return true;
    } catch(e) {
      console.warn('SaveManager: failed to save', e);
      return false;
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return defaultState();
      // Migrate if needed (future-proof)
      return migrate(parsed);
    } catch(e) {
      console.warn('SaveManager: failed to load', e);
      return defaultState();
    }
  }

  function migrate(data) {
    // Version 1 is current; future migrations go here
    // e.g. if (data.version < 2) { /* migrate v1 -> v2 */ }
    const base = defaultState();
    return {
      version: CURRENT_VERSION,
      gold: typeof data.gold === 'number' ? data.gold : base.gold,
      skillPoints: typeof data.skillPoints === 'number' ? data.skillPoints : base.skillPoints,
      currentWorld: typeof data.currentWorld === 'number' ? data.currentWorld : base.currentWorld,
      inventory: Array.isArray(data.inventory) ? data.inventory : base.inventory,
      equipped: Array.isArray(data.equipped) ? data.equipped.slice(0, 3) : base.equipped,
      skillTree: data.skillTree && typeof data.skillTree === 'object' ? data.skillTree : base.skillTree,
      upgrades: data.upgrades && typeof data.upgrades === 'object' ? data.upgrades : base.upgrades,
      stats: {
        totalKills: (data.stats && typeof data.stats.totalKills === 'number') ? data.stats.totalKills : base.stats.totalKills,
        bestTime: (data.stats && typeof data.stats.bestTime === 'number') ? data.stats.bestTime : base.stats.bestTime,
        runsCompleted: (data.stats && typeof data.stats.runsCompleted === 'number') ? data.stats.runsCompleted : base.stats.runsCompleted
      }
    };
  }

  function exportJSON() {
    const data = load();
    return JSON.stringify(data, null, 2);
  }

  function importJSON(str) {
    try {
      const parsed = JSON.parse(str);
      if (!parsed || typeof parsed !== 'object') return false;
      if (typeof parsed.version !== 'number') return false;
      const migrated = migrate(parsed);
      return save(migrated);
    } catch(e) {
      console.warn('SaveManager: invalid JSON import', e);
      return false;
    }
  }

  function encodeURL() {
    const data = load();
    const json = JSON.stringify(data);
    const encoded = btoa(unescape(encodeURIComponent(json)));
    return '#save=' + encoded;
  }

  function decodeURL(hash) {
    try {
      if (!hash || !hash.startsWith('#save=')) return null;
      const encoded = hash.slice(6);
      const json = decodeURIComponent(escape(atob(encoded)));
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== 'object') return null;
      return migrate(parsed);
    } catch(e) {
      console.warn('SaveManager: failed to decode URL hash', e);
      return null;
    }
  }

  function reset() {
    const data = defaultState();
    save(data);
    return data;
  }

  // Record end-of-run stats into the persistent save
  function recordRun(runKills, runTime, earnedGold) {
    const data = load();
    data.stats.totalKills += runKills;
    data.stats.runsCompleted += 1;
    if (runTime > data.stats.bestTime) {
      data.stats.bestTime = runTime;
    }
    if (typeof earnedGold === 'number' && earnedGold > 0) {
      data.gold += earnedGold;
    }
    save(data);
    return data;
  }

  return { save, load, exportJSON, importJSON, encodeURL, decodeURL, reset, recordRun, defaultState };
})();

// On page load, check for URL hash save and import if present
(function() {
  if (window.location.hash && window.location.hash.startsWith('#save=')) {
    const imported = SaveManager.decodeURL(window.location.hash);
    if (imported) {
      SaveManager.save(imported);
      // Clean the hash so it does not persist in the URL bar
      history.replaceState(null, '', window.location.pathname + window.location.search);
      console.log('SaveManager: imported save from URL');
    }
  }
})();

// ============================================================
// SPATIAL HASH GRID
// ============================================================
class SpatialHash {
  constructor(cellSize) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }
  clear() { this.cells.clear(); }
  _key(x, y) {
    return ((x/this.cellSize|0) * 73856093) ^ ((y/this.cellSize|0) * 19349663);
  }
  insert(obj) {
    const k = this._key(obj.x, obj.y);
    let cell = this.cells.get(k);
    if(!cell) { cell = []; this.cells.set(k, cell); }
    cell.push(obj);
  }
  query(x, y, radius) {
    const results = [];
    const cs = this.cellSize;
    const x0 = ((x-radius)/cs|0) - 1;
    const x1 = ((x+radius)/cs|0) + 1;
    const y0 = ((y-radius)/cs|0) - 1;
    const y1 = ((y+radius)/cs|0) + 1;
    for(let cx = x0; cx <= x1; cx++) {
      for(let cy = y0; cy <= y1; cy++) {
        const k = (cx * 73856093) ^ (cy * 19349663);
        const cell = this.cells.get(k);
        if(cell) {
          for(const obj of cell) {
            const dx = obj.x - x;
            const dy = obj.y - y;
            if(dx*dx + dy*dy <= radius*radius) results.push(obj);
          }
        }
      }
    }
    return results;
  }
}

// ============================================================
// OBJECT POOLS
// ============================================================
class Pool {
  constructor(factory, reset) {
    this.pool = [];
    this.active = [];
    this.factory = factory;
    this.reset = reset;
  }
  get(...args) {
    let obj = this.pool.pop() || this.factory();
    this.reset(obj, ...args);
    this.active.push(obj);
    return obj;
  }
  release(obj) {
    const idx = this.active.indexOf(obj);
    if(idx !== -1) this.active.splice(idx, 1);
    this.pool.push(obj);
  }
  releaseAll() {
    this.pool.push(...this.active);
    this.active.length = 0;
  }
  forEach(fn) {
    for(let i = this.active.length-1; i >= 0; i--) fn(this.active[i], i);
  }
  get count() { return this.active.length; }
}

// ============================================================
// GAME STATE
// ============================================================
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
let W, H;

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

const keys = {};
let levelUpCards = [];
let levelUpSelection = -1;

function selectLevelUpCard(idx) {
  if(state !== 'levelup' || levelUpCards.length === 0) return;
  levelUpSelection = Math.max(0, Math.min(idx, levelUpCards.length - 1));
  levelUpCards.forEach((c, i) => c.classList.toggle('selected', i === levelUpSelection));
}

function confirmLevelUpSelection() {
  if(state !== 'levelup' || levelUpSelection < 0 || levelUpSelection >= levelUpCards.length) return;
  levelUpCards[levelUpSelection].click();
}

let dashRequested = false;
window.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if(e.key === 'Escape') togglePause();
  if(e.key.toLowerCase() === 'm') Audio.toggleMute();
  if(e.key === ' ' && state === 'playing') {
    e.preventDefault();
    dashRequested = true;
  }
  if(state === 'levelup') {
    if(e.key === '1') { selectLevelUpCard(0); confirmLevelUpSelection(); }
    else if(e.key === '2') { selectLevelUpCard(1); confirmLevelUpSelection(); }
    else if(e.key === '3') { selectLevelUpCard(2); confirmLevelUpSelection(); }
    else if(e.key === 'ArrowLeft') selectLevelUpCard(levelUpSelection <= 0 ? 0 : levelUpSelection - 1);
    else if(e.key === 'ArrowRight') selectLevelUpCard(levelUpSelection < 0 ? 0 : levelUpSelection + 1);
    else if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); confirmLevelUpSelection(); }
  }
});
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

// Touch controls
let touchDir = { x: 0, y: 0 };
let touchActive = false;
let touchStart = { x: 0, y: 0 };
const touchZone = document.getElementById('touch-zone');

let lastTouchTime = 0;
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  Audio.init();
  const now = performance.now();
  if(now - lastTouchTime < 300 && state === 'playing') {
    dashRequested = true;
  }
  lastTouchTime = now;
  const t = e.touches[0];
  touchStart.x = t.clientX;
  touchStart.y = t.clientY;
  touchActive = true;
}, { passive: false });

canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  if(!touchActive) return;
  const t = e.touches[0];
  const dx = t.clientX - touchStart.x;
  const dy = t.clientY - touchStart.y;
  const len = Math.sqrt(dx*dx + dy*dy);
  if(len > 10) {
    touchDir.x = dx/len;
    touchDir.y = dy/len;
  }
}, { passive: false });

canvas.addEventListener('touchend', e => {
  e.preventDefault();
  touchActive = false;
  touchDir.x = 0;
  touchDir.y = 0;
}, { passive: false });

// Game state
let state = 'title'; // title, playing, levelup, paused, gameover
let gameTime = 0;
let kills = 0;
let playerLevel = 1;
let xp = 0;
let xpToNext = 5;
let waveNum = 1;
let waveTimer = 0;
let bossIdx = 0;
let lastBossTime = -999;
let heartbeatTimer = 0;
let damageFlash = 0;
let screenShake = 0;
let runGold = 0;
let goldTimerAccum = 0;
let victoryAchieved = false;
let killedBossNames = [];
const lootPickupTexts = [];

const player = {
  x: 0, y: 0,
  speed: 150,
  maxHp: 100,
  hp: 100,
  damage: 1,
  attackSpeed: 1,
  pickupRadius: 60,
  defense: 1, // multiplier for damage taken
  invulnTime: 0,
  dashTimer: 0,
  dashCooldown: 0,
  dashDirX: 0, dashDirY: 0,
  lastDirX: 0, lastDirY: 1,
  weapons: [],
  passives: []
};

const cam = { x: 0, y: 0 };

// Pools
const enemyHash = new SpatialHash(100);

const enemies = new Pool(
  () => ({ x:0, y:0, hp:0, maxHp:0, size:0, speed:0, type:null, xpValue:0, isBoss:false, spawnTime:0, hitFlash:0,
    movementType:'chase', movementState:null, attackTimer:0, attackPattern:null }),
  (e, x, y, type, isBoss) => {
    e.x = x; e.y = y;
    e.type = type;
    e.isBoss = isBoss || false;
    e._dead = false;
    const hpMult = 1 + gameTime / 120;
    e.hp = e.maxHp = isBoss ? type.hp * (1 + gameTime / 80) * 1.5 : type.hp * hpMult;
    e.size = type.size;
    e.speed = type.speed;
    e.xpValue = type.xp;
    e.spawnTime = gameTime;
    e.hitFlash = 0;
    e.movementType = type.movementType || 'chase';
    e.movementState = { timer: 0, phase: 'approach', dashAngle: 0, anchorX: 0, anchorY: 0, orbitAngle: 0, waitX: 0, waitY: 0 };
    e.attackTimer = isBoss ? 3 + Math.random() * 2 : 0;
    e.attackPattern = type.attackPattern || null;
  }
);

const projectiles = new Pool(
  () => ({ x:0, y:0, vx:0, vy:0, damage:0, pierce:0, life:0, maxLife:0, weaponType:'', level:1, angle:0, target:null, origin:null, bounces:0 }),
  (p, x, y, vx, vy, dmg, life, type, level) => {
    p.x = x; p.y = y; p.vx = vx; p.vy = vy;
    p.damage = dmg; p.life = life; p.maxLife = life;
    p.pierce = level;
    p.weaponType = type;
    p.level = level;
    p.angle = 0;
    p.target = null;
    p.origin = { x, y };
    p.bounces = 0;
  }
);

const gems = new Pool(
  () => ({ x:0, y:0, value:0, life:0, vx:0, vy:0 }),
  (g, x, y, val) => {
    g.x = x; g.y = y; g.value = val;
    g.life = 30;
    g.vx = (Math.random()-0.5)*60;
    g.vy = (Math.random()-0.5)*60;
  }
);

const particles = new Pool(
  () => ({ x:0, y:0, vx:0, vy:0, life:0, maxLife:0, color:'', size:0 }),
  (p, x, y, vx, vy, life, color, size) => {
    p.x = x; p.y = y; p.vx = vx; p.vy = vy;
    p.life = life; p.maxLife = life;
    p.color = color; p.size = size || 3;
  }
);

// ============================================================
// LOOT TABLE & DROP SYSTEM
// ============================================================
const LOOT_TABLE = [
  // Common (60%) - minor stat items
  { id: 'loot_rusty_shield',    name: 'Rusty Shield',      rarity: 'common',    icon: '\u26E8', desc: '+5 Max HP',             effect: { stat: 'maxHp', bonus: 5 } },
  { id: 'loot_old_boots',       name: 'Old Boots',         rarity: 'common',    icon: '\u{1F462}', desc: '+5% Speed',          effect: { stat: 'speed', mult: 1.05 } },
  { id: 'loot_cracked_lens',    name: 'Cracked Lens',      rarity: 'common',    icon: '\u{1F50D}', desc: '+10 Pickup Radius',  effect: { stat: 'pickupRadius', bonus: 10 } },
  { id: 'loot_torn_gloves',     name: 'Torn Gloves',       rarity: 'common',    icon: '\u{1F9E4}', desc: '+5% Damage',         effect: { stat: 'damage', mult: 1.05 } },
  { id: 'loot_dull_whetstone',  name: 'Dull Whetstone',    rarity: 'common',    icon: '\u25C8', desc: '+5% Attack Speed',       effect: { stat: 'attackSpeed', mult: 1.05 } },
  // Rare (25%) - notable items
  { id: 'loot_vampiric_ring',   name: 'Vampiric Ring',     rarity: 'rare',      icon: '\u{1F48D}', desc: '2% Lifesteal',       effect: { stat: 'lifesteal', value: 0.02 } },
  { id: 'loot_scope',           name: 'Marksman Scope',    rarity: 'rare',      icon: '\u{1F3AF}', desc: '+10% Crit Chance',   effect: { stat: 'critChance', value: 0.10 } },
  { id: 'loot_iron_plate',      name: 'Iron Plate',        rarity: 'rare',      icon: '\u2694', desc: '+10% Defense',            effect: { stat: 'defense', mult: 0.90 } },
  { id: 'loot_swift_cloak',     name: 'Swift Cloak',       rarity: 'rare',      icon: '\u{1F9E3}', desc: '+15% Speed',         effect: { stat: 'speed', mult: 1.15 } },
  { id: 'loot_emerald_charm',   name: 'Emerald Charm',     rarity: 'rare',      icon: '\u{1F48E}', desc: '+20% XP Gain',       effect: { stat: 'xpMult', value: 1.20 } },
  // Epic (12%) - powerful items
  { id: 'loot_berserker_gauntlet', name: 'Berserker Gauntlet', rarity: 'epic',  icon: '\u{1F94A}', desc: '+30% Damage below 50% HP', effect: { stat: 'berserker', threshold: 0.5, mult: 1.30 } },
  { id: 'loot_magnet_core',     name: 'Magnet Core',       rarity: 'epic',      icon: '\u{1F9F2}', desc: '+50 Pickup Radius',  effect: { stat: 'pickupRadius', bonus: 50 } },
  { id: 'loot_crimson_heart',   name: 'Crimson Heart',     rarity: 'epic',      icon: '\u2764', desc: '+40 Max HP, +Regen',      effect: { stat: 'maxHp', bonus: 40, regen: true } },
  { id: 'loot_quicksilver',     name: 'Quicksilver Vial',  rarity: 'epic',      icon: '\u{1F4A7}', desc: '-25% Dash Cooldown', effect: { stat: 'dashCooldown', value: 0.25 } },
  { id: 'loot_war_drum',        name: 'War Drum',          rarity: 'epic',      icon: '\u{1F941}', desc: '+25% Attack Speed',  effect: { stat: 'attackSpeed', mult: 1.25 } },
  // Legendary (3%) - game-changing items
  { id: 'loot_phoenix_feather', name: 'Phoenix Feather',   rarity: 'legendary', icon: '\u{1F525}', desc: 'Auto-revive once per run', effect: { stat: 'phoenixRevive' } },
  { id: 'loot_crown_of_thorns', name: 'Crown of Thorns',   rarity: 'legendary', icon: '\u{1F451}', desc: 'Reflect 20% damage taken', effect: { stat: 'thornsDamage', value: 0.20 } },
  { id: 'loot_void_orb',        name: 'Void Orb',          rarity: 'legendary', icon: '\u{1F311}', desc: '+50% Damage, -20% Max HP', effect: { stat: 'voidPower', damageMult: 1.50, hpMult: 0.80 } }
];

const RARITY_CONFIG = {
  common:    { weight: 60, color: '#cccccc', glow: 'rgba(200,200,200,0.4)' },
  rare:      { weight: 25, color: '#4488ff', glow: 'rgba(68,136,255,0.5)' },
  epic:      { weight: 12, color: '#aa44ff', glow: 'rgba(170,68,255,0.5)' },
  legendary: { weight: 3,  color: '#ffcc00', glow: 'rgba(255,204,0,0.6)' }
};

function rollLootItem() {
  const roll = Math.random() * 100;
  let rarity;
  if (roll < 3) rarity = 'legendary';
  else if (roll < 15) rarity = 'epic';
  else if (roll < 40) rarity = 'rare';
  else rarity = 'common';
  const pool = LOOT_TABLE.filter(item => item.rarity === rarity);
  return pool[Math.random() * pool.length | 0];
}

function getLootById(id) {
  return LOOT_TABLE.find(item => item.id === id) || null;
}

const lootDrops = new Pool(
  () => ({ x: 0, y: 0, item: null, life: 0, vx: 0, vy: 0, bobPhase: 0 }),
  (d, x, y, item) => {
    d.x = x; d.y = y; d.item = item;
    d.life = 20;
    d.vx = (Math.random() - 0.5) * 80;
    d.vy = (Math.random() - 0.5) * 80;
    d.bobPhase = Math.random() * Math.PI * 2;
  }
);

// Active fields/beams/areas
const activeEffects = [];
const telegraphs = [];

// Weapon state
const weaponTimers = {};

// ============================================================
// WEAPON SYSTEM
// ============================================================
const WEAPON_DEFS = {
  projectile: {
    cooldown: (l, dm, as) => 0.8 / as,
    damage: (l, dm) => 8 * l * dm,
    speed: 350,
    life: 1.5,
    count: l => Math.min(1 + Math.floor(l / 2), 4)
  },
  orbit: {
    cooldown: () => 0,
    damage: (l, dm) => 5 * l * dm,
    radius: l => 60 + l * 15,
    count: l => 2 + l,
    speed: l => 2 + l * 0.3
  },
  area: {
    cooldown: (l, dm, as) => 3 / as,
    damage: (l, dm) => 12 * l * dm,
    radius: l => 80 + l * 20,
    life: 0.3
  },
  chain: {
    cooldown: (l, dm, as) => 1.2 / as,
    damage: (l, dm) => 6 * l * dm,
    bounces: l => 2 + l,
    range: l => 150 + l * 20
  },
  beam: {
    cooldown: (l, dm, as) => 4 / as,
    damage: (l, dm) => 3 * l * dm,
    duration: l => 0.8 + l * 0.2,
    width: l => 6 + l * 2,
    range: l => 200 + l * 40
  },
  rain: {
    cooldown: (l, dm, as) => 2.5 / as,
    damage: (l, dm) => 10 * l * dm,
    count: l => 3 + l,
    radius: l => 100 + l * 20
  },
  boomerang: {
    cooldown: (l, dm, as) => 1.5 / as,
    damage: (l, dm) => 7 * l * dm,
    speed: 250,
    range: l => 180 + l * 30
  },
  field: {
    cooldown: (l, dm, as) => 5 / as,
    damage: (l, dm) => 4 * l * dm,
    radius: l => 70 + l * 15,
    duration: l => 3 + l * 0.5
  }
};

function getWeaponStats(type, level) {
  const def = WEAPON_DEFS[type];
  if (!def) return {};
  const l = level;
  const dm = player.damage;
  const as = player.attackSpeed;
  const stats = {};
  for (const [key, val] of Object.entries(def)) {
    if (typeof val === 'function') {
      stats[key] = val(l, dm, as);
    } else {
      stats[key] = val;
    }
  }
  // Allow themes to override weapon defs
  if (THEME.weaponOverrides && THEME.weaponOverrides[type]) {
    for (const [key, val] of Object.entries(THEME.weaponOverrides[type])) {
      if (typeof val === 'function') {
        stats[key] = val(l, dm, as);
      } else {
        stats[key] = val;
      }
    }
  }
  return stats;
}

const WEAPON_HANDLERS = {};

WEAPON_HANDLERS.projectile = function(w, stats) {
  // Find nearest enemy for targeting
  const nearby = enemyHash.query(player.x, player.y, 500);
  let target = nearby[0];
  let minDist = Infinity;
  for(const e of nearby) {
    const d = Math.hypot(e.x-player.x, e.y-player.y);
    if(d < minDist) { minDist = d; target = e; }
  }
  const totalCount = stats.count + (player.permMultiProjectile ? 2 : 0);
  for(let i = 0; i < totalCount; i++) {
    let angle;
    if(target) {
      angle = Math.atan2(target.y-player.y, target.x-player.x) + (i-totalCount/2+0.5)*0.2;
    } else {
      angle = Math.PI*2*i/totalCount;
    }
    const p = projectiles.get(
      player.x, player.y,
      Math.cos(angle)*stats.speed, Math.sin(angle)*stats.speed,
      stats.damage, stats.life, 'projectile', w.level
    );
    if(player.permPiercing) p.pierce += 3;
  }
};

WEAPON_HANDLERS.area = function(w, stats) {
  activeEffects.push({
    type: 'area', x: player.x, y: player.y,
    radius: 0, maxRadius: stats.radius,
    damage: stats.damage, life: stats.life, maxLife: stats.life,
    hit: new Set()
  });
};

WEAPON_HANDLERS.chain = function(w, stats) {
  const nearby = enemyHash.query(player.x, player.y, 400);
  if(nearby.length > 0) {
    let minD = Infinity, first = nearby[0];
    for(const e of nearby) {
      const d = Math.hypot(e.x-player.x, e.y-player.y);
      if(d<minD) {minD=d; first=e;}
    }
    chainHit(first, stats.damage, stats.bounces, stats.range, new Set());
  }
};

WEAPON_HANDLERS.beam = function(w, stats) {
  const nearby = enemyHash.query(player.x, player.y, stats.range+200);
  let target = null, minD = Infinity;
  for(const e of nearby) {
    const d = Math.hypot(e.x-player.x, e.y-player.y);
    if(d<minD) { minD=d; target=e; }
  }
  if(target) {
    const angle = Math.atan2(target.y-player.y, target.x-player.x);
    activeEffects.push({
      type:'beam', x:player.x, y:player.y, angle,
      range: stats.range, width: stats.width,
      damage: stats.damage, life: stats.duration, maxLife: stats.duration,
      tickTimer: 0
    });
  }
};

WEAPON_HANDLERS.rain = function(w, stats) {
  for(let i=0;i<stats.count;i++) {
    const rx = player.x + (Math.random()-0.5)*stats.radius*2;
    const ry = player.y + (Math.random()-0.5)*stats.radius*2;
    setTimeout(() => {
      if(state !== 'playing') return;
      projectiles.get(rx, ry-300, 0, 500, stats.damage, 0.7, 'rain', w.level);
      spawnParticles(rx, ry, 5, THEME.effectColors.rain.particle, 2);
    }, i * 150);
  }
};

WEAPON_HANDLERS.boomerang = function(w, stats) {
  const nearby = enemyHash.query(player.x, player.y, 500);
  let target = null, minD = Infinity;
  for(const e of nearby) {
    const d = Math.hypot(e.x-player.x, e.y-player.y);
    if(d<minD) { minD=d; target=e; }
  }
  const angle = target ? Math.atan2(target.y-player.y, target.x-player.x) : Math.random()*Math.PI*2;
  const p = projectiles.get(
    player.x, player.y,
    Math.cos(angle)*stats.speed, Math.sin(angle)*stats.speed,
    stats.damage, stats.range/stats.speed*2, 'boomerang', w.level
  );
  p.origin = { x: player.x, y: player.y };
};

WEAPON_HANDLERS.field = function(w, stats) {
  activeEffects.push({
    type:'field', x: player.x, y: player.y,
    radius: stats.radius, damage: stats.damage,
    life: stats.duration, maxLife: stats.duration,
    tickTimer: 0
  });
};

function fireWeapon(w) {
  const stats = getWeaponStats(w.type, w.level);
  Audio.weaponSound(w.type, w.level);
  const handler = WEAPON_HANDLERS[w.type];
  if (handler) handler(w, stats);
}

function chainHit(enemy, damage, bouncesLeft, range, hitSet) {
  if(!enemy || hitSet.has(enemy)) return;
  hitSet.add(enemy);
  damageEnemy(enemy, damage);
  spawnParticles(enemy.x, enemy.y, 3, THEME.effectColors.chain.particle, 2);

  if(bouncesLeft <= 0) return;
  const nearby = enemyHash.query(enemy.x, enemy.y, range);
  let next = null, minD = Infinity;
  for(const e of nearby) {
    if(hitSet.has(e)) continue;
    const d = Math.hypot(e.x-enemy.x, e.y-enemy.y);
    if(d<minD) { minD=d; next=e; }
  }
  if(next) {
    // Visual chain line
    activeEffects.push({
      type:'chainLine', x1:enemy.x, y1:enemy.y, x2:next.x, y2:next.y,
      life: 0.15, maxLife: 0.15
    });
    setTimeout(() => chainHit(next, damage*0.8, bouncesLeft-1, range, hitSet), 50);
  }
}

// ============================================================
// MOVEMENT BEHAVIORS
// ============================================================
const MOVEMENT_HANDLERS = {};

// Default beeline toward player
MOVEMENT_HANDLERS.chase = function(e, dt, player) {
  const dx = player.x - e.x;
  const dy = player.y - e.y;
  const d = Math.hypot(dx, dy);
  if(d > 5) {
    e.x += (dx/d) * e.speed * dt;
    e.y += (dy/d) * e.speed * dt;
  }
};

// Circle player at ~200px, dash in periodically
MOVEMENT_HANDLERS.strafe = function(e, dt, player) {
  const dx = player.x - e.x;
  const dy = player.y - e.y;
  const d = Math.hypot(dx, dy);
  const ms = e.movementState;
  ms.timer -= dt;

  if(ms.phase === 'approach') {
    // Move toward strafe range
    if(d > 220) {
      e.x += (dx/d) * e.speed * dt;
      e.y += (dy/d) * e.speed * dt;
    } else {
      ms.phase = 'circle';
      ms.orbitAngle = Math.atan2(e.y - player.y, e.x - player.x);
      ms.timer = 2 + Math.random() * 2;
    }
  } else if(ms.phase === 'circle') {
    // Orbit around player at ~200px
    ms.orbitAngle += e.speed / 200 * dt;
    const targetX = player.x + Math.cos(ms.orbitAngle) * 200;
    const targetY = player.y + Math.sin(ms.orbitAngle) * 200;
    e.x += (targetX - e.x) * 3 * dt;
    e.y += (targetY - e.y) * 3 * dt;
    if(ms.timer <= 0) {
      ms.phase = 'dash';
      ms.timer = 0.4;
    }
  } else if(ms.phase === 'dash') {
    // Dash toward player
    if(d > 5) {
      e.x += (dx/d) * e.speed * 2.5 * dt;
      e.y += (dy/d) * e.speed * 2.5 * dt;
    }
    if(ms.timer <= 0) {
      ms.phase = 'approach';
      ms.timer = 0;
    }
  }
};

// Approach to ~250px, pause (telegraph), then dash at 3x speed
MOVEMENT_HANDLERS.charge = function(e, dt, player) {
  const dx = player.x - e.x;
  const dy = player.y - e.y;
  const d = Math.hypot(dx, dy);
  const ms = e.movementState;
  ms.timer -= dt;

  if(ms.phase === 'approach') {
    if(d > 250) {
      e.x += (dx/d) * e.speed * dt;
      e.y += (dy/d) * e.speed * dt;
    } else {
      ms.phase = 'telegraph';
      ms.timer = 1.0;
      ms.dashAngle = Math.atan2(dy, dx);
    }
  } else if(ms.phase === 'telegraph') {
    // Stand still, telegraph is rendered by telegraph system
    if(ms.timer <= 0) {
      ms.phase = 'dash';
      ms.timer = 0.5;
      // Lock dash direction
      ms.dashAngle = Math.atan2(player.y - e.y, player.x - e.x);
    }
  } else if(ms.phase === 'dash') {
    e.x += Math.cos(ms.dashAngle) * e.speed * 3 * dt;
    e.y += Math.sin(ms.dashAngle) * e.speed * 3 * dt;
    if(ms.timer <= 0) {
      ms.phase = 'approach';
      ms.timer = 0;
    }
  }
};

// Spiral inward getting closer
MOVEMENT_HANDLERS.orbit = function(e, dt, player) {
  const dx = player.x - e.x;
  const dy = player.y - e.y;
  const d = Math.hypot(dx, dy);
  const ms = e.movementState;

  if(ms.orbitAngle === 0) {
    ms.orbitAngle = Math.atan2(e.y - player.y, e.x - player.x);
  }

  // Slowly spiral inward
  const orbitRadius = Math.max(30, d - 15 * dt);
  ms.orbitAngle += (e.speed / Math.max(orbitRadius, 80)) * dt;
  const targetX = player.x + Math.cos(ms.orbitAngle) * orbitRadius;
  const targetY = player.y + Math.sin(ms.orbitAngle) * orbitRadius;
  e.x += (targetX - e.x) * 4 * dt;
  e.y += (targetY - e.y) * 4 * dt;
};

// Intercept player's path, wait, then pounce at 2.5x speed
MOVEMENT_HANDLERS.ambush = function(e, dt, player) {
  const dx = player.x - e.x;
  const dy = player.y - e.y;
  const d = Math.hypot(dx, dy);
  const ms = e.movementState;
  ms.timer -= dt;

  if(ms.phase === 'approach') {
    // Move to an intercept point ahead of the player
    if(d > 300) {
      e.x += (dx/d) * e.speed * 1.2 * dt;
      e.y += (dy/d) * e.speed * 1.2 * dt;
    } else {
      ms.phase = 'wait';
      ms.timer = 0.8 + Math.random() * 0.5;
      ms.waitX = e.x;
      ms.waitY = e.y;
    }
  } else if(ms.phase === 'wait') {
    // Hold position
    e.x += (ms.waitX - e.x) * 5 * dt;
    e.y += (ms.waitY - e.y) * 5 * dt;
    if(ms.timer <= 0) {
      ms.phase = 'pounce';
      ms.timer = 0.6;
      ms.dashAngle = Math.atan2(player.y - e.y, player.x - e.x);
    }
  } else if(ms.phase === 'pounce') {
    e.x += Math.cos(ms.dashAngle) * e.speed * 2.5 * dt;
    e.y += Math.sin(ms.dashAngle) * e.speed * 2.5 * dt;
    if(ms.timer <= 0) {
      ms.phase = 'approach';
      ms.timer = 0;
    }
  }
};

// ============================================================
// BOSS ATTACK SYSTEM
// ============================================================
const BOSS_ATTACK_HANDLERS = {};

// Expanding damage ring — player must move out
BOSS_ATTACK_HANDLERS.shockwave = function(boss) {
  const dmg = 15 + gameTime * 0.05;
  activeEffects.push({
    type: 'bossShockwave', x: boss.x, y: boss.y,
    radius: 0, maxRadius: 200 + boss.size,
    damage: dmg, life: 0.8, maxLife: 0.8,
    hit: new Set()
  });
  // Telegraph: warning circle
  telegraphs.push({
    type: 'chargeWarning', source: boss,
    x: boss.x, y: boss.y, life: 0.5, maxLife: 0.5
  });
  telegraphs.push({
    type: 'exclamation', source: boss,
    life: 0.5, maxLife: 0.5
  });
  spawnParticles(boss.x, boss.y, 12, boss.type.color, 4);
  Audio.noise(0.3, 0.12);
  Audio.note(80, 0.5, 'sawtooth', 0.1);
};

// Telegraph line then boss dashes across it
BOSS_ATTACK_HANDLERS.charge = function(boss) {
  const angle = Math.atan2(player.y - boss.y, player.x - boss.x);
  const dmg = 15 + gameTime * 0.05;
  activeEffects.push({
    type: 'bossChargeLine', x: boss.x, y: boss.y, angle: angle,
    range: 400, width: boss.size * 0.8,
    damage: dmg, life: 1.2, maxLife: 1.2,
    phase: 'telegraph', bossRef: boss, hit: new Set()
  });
  Audio.note(150, 0.3, 'square', 0.08);
};

// Spawn minion wave around boss
BOSS_ATTACK_HANDLERS.summon = function(boss) {
  const count = 3 + Math.floor(gameTime / 120);
  const available = THEME.enemies.filter(e => gameTime >= e.spawnAfter);
  if(available.length === 0) return;
  for(let i = 0; i < count; i++) {
    const type = available[Math.random() * available.length | 0];
    const angle = (Math.PI * 2 * i) / count;
    const dist = boss.size + 30;
    enemies.get(boss.x + Math.cos(angle) * dist, boss.y + Math.sin(angle) * dist, type, false);
  }
  spawnParticles(boss.x, boss.y, 15, boss.type.color, 3);
  Audio.note(200, 0.2, 'sawtooth', 0.1);
  Audio.note(100, 0.3, 'sawtooth', 0.08);
};

// Sweeping beam that rotates — must dodge
BOSS_ATTACK_HANDLERS.beam = function(boss) {
  const angle = Math.atan2(player.y - boss.y, player.x - boss.x);
  const dmg = 15 + gameTime * 0.05;
  activeEffects.push({
    type: 'bossSweepBeam', x: boss.x, y: boss.y,
    startAngle: angle - 0.8, angle: angle - 0.8, targetAngle: angle + 0.8,
    range: 350, width: 12,
    damage: dmg, life: 1.5, maxLife: 1.5,
    tickTimer: 0
  });
  // Telegraph: exclamation warning
  telegraphs.push({
    type: 'exclamation', source: boss,
    life: 0.6, maxLife: 0.6
  });
  Audio.note(200, 1.5, 'sawtooth', 0.07);
};

function updateBossAttacks(dt) {
  enemies.forEach(e => {
    if(!e.isBoss || !e.attackPattern) return;
    e.attackTimer -= dt;
    if(e.attackTimer <= 0) {
      e.attackTimer = 4 + Math.random() * 3;
      const handler = BOSS_ATTACK_HANDLERS[e.attackPattern];
      if(handler) handler(e);
    }
  });
}

// ============================================================
// ENEMY / DAMAGE
// ============================================================
function damageEnemy(e, dmg) {
  if(e._dead) return;
  // Berserker bonus: extra damage when below HP threshold
  if(player.permBerserker && player.hp < player.maxHp * player.permBerserker.threshold) {
    dmg *= player.permBerserker.mult;
  }
  // Permanent crit chance: crit damage on crit (base 2x, boosted by skill tree)
  if(player.permCritChance && Math.random() < player.permCritChance) {
    dmg *= 2 + (player.permCritDamage || 0);
    spawnParticles(e.x, e.y, 4, '#ffff00', 3); // yellow crit flash
  }
  e.hp -= dmg;
  e.hitFlash = 0.1;
  Audio.hitSound();
  spawnParticles(e.x, e.y, 2, '#ff4444', 2);
  // Permanent lifesteal: heal % of damage dealt
  if(player.permLifesteal) {
    player.hp = Math.min(player.hp + dmg * player.permLifesteal, player.maxHp);
  }
  if(e.hp <= 0) {
    killEnemy(e);
  }
}

function killEnemy(e) {
  // Guard against double-kill from stale spatial hash references
  if(e._dead) return;
  e._dead = true;
  Audio.deathSound();
  spawnParticles(e.x, e.y, 8, e.type.color, 3);
  gems.get(e.x, e.y, e.xpValue);
  kills++;
  // Track boss kills for victory condition
  if(e.isBoss && e.type && e.type.name) {
    killedBossNames.push(e.type.name);
  }
  // Gold from kills: 1g base, scaled by enemy tier (xpValue), 50g for bosses
  if(e.isBoss) {
    runGold += 50;
  } else {
    runGold += Math.max(1, Math.floor(e.xpValue));
  }
  // Loot drop: 100% from bosses, 2% from normal enemies
  const dropChance = e.isBoss ? 1.0 : 0.02;
  if(Math.random() < dropChance) {
    const lootItem = rollLootItem();
    if(lootItem) {
      lootDrops.get(e.x, e.y, lootItem);
    }
  }
  enemies.release(e);
}

function spawnParticles(x, y, count, color, size) {
  for(let i=0;i<count;i++) {
    const angle = Math.random()*Math.PI*2;
    const speed = 50+Math.random()*100;
    particles.get(x, y, Math.cos(angle)*speed, Math.sin(angle)*speed, 0.4+Math.random()*0.3, color, size);
  }
}

// ============================================================
// SPAWNING
// ============================================================
function spawnEnemy() {
  const available = THEME.enemies.filter(e => gameTime >= e.spawnAfter);
  if(available.length === 0) return;
  const type = available[Math.random()*available.length|0];
  const angle = Math.random() * Math.PI * 2;
  const dist = Math.max(W, H) * 0.6 + Math.random() * 100;
  const x = player.x + Math.cos(angle) * dist;
  const y = player.y + Math.sin(angle) * dist;
  enemies.get(x, y, type, false);
}

function spawnBoss() {
  if(bossIdx >= THEME.bosses.length) return;
  const type = THEME.bosses[bossIdx];
  Audio.bossWarning();
  const angle = Math.random() * Math.PI * 2;
  const dist = Math.max(W, H) * 0.5;
  enemies.get(
    player.x + Math.cos(angle)*dist,
    player.y + Math.sin(angle)*dist,
    type, true
  );
  bossIdx++;
}

// ============================================================
// LEVEL UP
// ============================================================
function addXp(amount) {
  if(player.permXpMult) amount = Math.round(amount * player.permXpMult);
  xp += amount;
  while(xp >= xpToNext) {
    xp -= xpToNext;
    playerLevel++;
    xpToNext = Math.floor(5 * Math.pow(1.4, playerLevel-1));
    showLevelUp();
  }
}

function showLevelUp() {
  Audio.levelUpSound();
  state = 'levelup';
  const container = document.getElementById('upgrade-cards');
  container.innerHTML = '';

  const options = generateUpgradeOptions();
  levelUpCards = [];
  levelUpSelection = -1;
  options.forEach((opt, i) => {
    const card = document.createElement('div');
    card.className = 'upgrade-card';
    card.innerHTML = `<div class="upgrade-hotkey">${i+1}</div><div class="upgrade-icon">${opt.icon}</div><div class="upgrade-name">${opt.name}</div><div class="upgrade-desc">${opt.desc}</div>`;
    card.addEventListener('click', () => {
      opt.apply();
      levelUpCards = [];
      levelUpSelection = -1;
      document.getElementById('level-up-screen').style.display = 'none';
      state = 'playing';
    });
    container.appendChild(card);
    levelUpCards.push(card);
  });

  document.getElementById('level-up-screen').style.display = 'flex';
}

function generateUpgradeOptions() {
  const options = [];
  const allWeapons = THEME.weapons;
  const ownedTypes = player.weapons.map(w => w.type);

  // Option: level up existing weapon
  const upgradeable = player.weapons.filter(w => w.level < 5);
  if(upgradeable.length > 0) {
    const w = upgradeable[Math.random()*upgradeable.length|0];
    const def = allWeapons.find(d => d.type === w.type);
    options.push({
      icon: def.icon, name: `${def.name} Lv${w.level+1}`,
      desc: `Upgrade ${def.name}`,
      apply: () => { w.level++; }
    });
  }

  // Option: new weapon
  const unowned = allWeapons.filter(w => !ownedTypes.includes(w.type));
  if(unowned.length > 0 && player.weapons.length < 6) {
    const w = unowned[Math.random()*unowned.length|0];
    options.push({
      icon: w.icon, name: w.name,
      desc: w.desc,
      apply: () => { player.weapons.push({ type: w.type, level: 1 }); updateWeaponBar(); }
    });
  }

  // Option: passive stat
  const passive = THEME.passives[Math.random()*THEME.passives.length|0];
  options.push({
    icon: passive.icon, name: passive.name,
    desc: passive.desc,
    apply: () => {
      // Apply passive: custom onApply function, or simple stat multiplier
      if(passive.onApply) { passive.onApply(player); }
      else if(passive.stat === 'maxHp') { player.maxHp *= passive.mult; player.hp = Math.min(player.hp + 20, player.maxHp); }
      else if(passive.stat === 'speed') player.speed *= passive.mult;
      else if(passive.stat === 'pickupRadius') player.pickupRadius *= passive.mult;
      else if(passive.stat === 'damage') player.damage *= passive.mult;
      else if(passive.stat === 'attackSpeed') player.attackSpeed *= passive.mult;
      else if(passive.stat === 'defense') player.defense *= passive.mult;
      player.passives.push(passive.name);
    }
  });

  // Fill to 3
  while(options.length < 3) {
    const p = THEME.passives[Math.random()*THEME.passives.length|0];
    if(!options.find(o => o.name === p.name)) {
      options.push({
        icon: p.icon, name: p.name, desc: p.desc,
        apply: () => {
          // Apply passive: custom onApply function, or simple stat multiplier
          if(p.onApply) { p.onApply(player); }
          else if(p.stat === 'maxHp') { player.maxHp *= p.mult; player.hp = Math.min(player.hp+20, player.maxHp); }
          else if(p.stat === 'speed') player.speed *= p.mult;
          else if(p.stat === 'pickupRadius') player.pickupRadius *= p.mult;
          else if(p.stat === 'damage') player.damage *= p.mult;
          else if(p.stat === 'attackSpeed') player.attackSpeed *= p.mult;
          else if(p.stat === 'defense') player.defense *= p.mult;
          player.passives.push(p.name);
        }
      });
    }
  }

  return options.slice(0, 3);
}

// ============================================================
// HUD
// ============================================================
function updateHUD() {
  const mins = Math.floor(gameTime/60);
  const secs = Math.floor(gameTime%60);
  document.getElementById('hud-level').textContent = `Level ${playerLevel}`;
  document.getElementById('hud-time').textContent = `${mins}:${secs.toString().padStart(2,'0')}`;
  document.getElementById('hud-kills').textContent = `Kills: ${kills}`;
  document.getElementById('hud-wave').textContent = `Wave ${waveNum}`;
  document.getElementById('xp-bar').style.width = `${(xp/xpToNext)*100}%`;
  document.getElementById('hp-bar').style.width = `${(player.hp/player.maxHp)*100}%`;
}

function updateWeaponBar() {
  const bar = document.getElementById('weapon-bar');
  bar.innerHTML = '';
  const allW = THEME.weapons;
  player.weapons.forEach(w => {
    const def = allW.find(d => d.type === w.type);
    const slot = document.createElement('div');
    slot.className = 'weapon-slot active';
    slot.textContent = def ? def.icon : '?';
    slot.title = def ? `${def.name} Lv${w.level}` : '';
    bar.appendChild(slot);
  });
}

// ============================================================
// MAIN GAME LOOP
// ============================================================
let lastTime = 0;
let spawnTimer = 0;
let spawnRate = 1.5; // seconds between spawns

function gameLoop(timestamp) {
  requestAnimationFrame(gameLoop);
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;

  if(state === 'title' || state === 'gameover' || state === 'victory') return;
  if(state === 'paused' || state === 'levelup') return;

  // Victory vacuum: suck all pickups into player, then show victory screen
  if(state === 'victory_vacuum') {
    updateVictoryVacuum(dt);
    render(dt);
    return;
  }

  gameTime += dt;

  // Gold from time survived: 1g per 10 seconds
  goldTimerAccum += dt;
  if(goldTimerAccum >= 10) {
    const ticks = Math.floor(goldTimerAccum / 10);
    runGold += ticks;
    goldTimerAccum -= ticks * 10;
  }

  // Difficulty ramp — wave system (40s cycles: 30s intense + 10s breather)
  const progress = Math.min(gameTime / 600, 1); // 10 min to max
  const waveCycle = gameTime % 40;
  const inBreather = waveCycle >= 30;
  const breatherMult = inBreather ? 0.4 : 1.0;
  // Check if any boss is alive — reduce spawns during boss fights
  let bossAlive = false;
  enemies.forEach(e => { if(e.isBoss) bossAlive = true; });
  const bossMult = bossAlive ? 0.4 : 1.0;
  spawnRate = Math.max(0.3, 1.5 - progress * 1.0) / (breatherMult * bossMult);
  waveNum = Math.floor(gameTime / 40) + 1;
  Audio.updateAmbient(progress);

  // Movement + Dash
  const DASH_SPEED_MULT = 4 * (player.dashDistance || 1);
  const DASH_DURATION = 0.15;
  const baseDashCooldown = 1.2;
  const DASH_COOLDOWN = baseDashCooldown * (1 - (player.dashCooldownReduction || 0));
  const DASH_INVULN = 0.15;

  let mx = 0, my = 0;
  if(keys['w'] || keys['arrowup']) my -= 1;
  if(keys['s'] || keys['arrowdown']) my += 1;
  if(keys['a'] || keys['arrowleft']) mx -= 1;
  if(keys['d'] || keys['arrowright']) mx += 1;
  if(touchActive) { mx = touchDir.x; my = touchDir.y; }
  const mlen = Math.sqrt(mx*mx+my*my);
  if(mlen > 0) {
    mx /= mlen; my /= mlen;
    player.lastDirX = mx;
    player.lastDirY = my;
  }

  if(player.dashCooldown > 0) player.dashCooldown -= dt;
  if(player.dashTimer > 0) player.dashTimer -= dt;

  if(dashRequested && player.dashCooldown <= 0 && player.dashTimer <= 0) {
    const dirX = mlen > 0 ? mx : player.lastDirX;
    const dirY = mlen > 0 ? my : player.lastDirY;
    player.dashDirX = dirX;
    player.dashDirY = dirY;
    player.dashTimer = DASH_DURATION;
    player.dashCooldown = DASH_COOLDOWN;
    player.invulnTime = Math.max(player.invulnTime, player.permShieldOnDash ? 0.6 : DASH_INVULN);
    spawnParticles(player.x, player.y, 8, `rgb(${THEME.effectColors.invuln.rgb})`, 3);
    if(player.permShieldOnDash) spawnParticles(player.x, player.y, 12, '#44aaff', 4);
    Audio.dashSound();
  }
  dashRequested = false;

  if(player.dashTimer > 0) {
    player.x += player.dashDirX * player.speed * DASH_SPEED_MULT * dt;
    player.y += player.dashDirY * player.speed * DASH_SPEED_MULT * dt;
  } else if(mlen > 0) {
    player.x += mx * player.speed * dt;
    player.y += my * player.speed * dt;
  }

  // Camera
  cam.x = player.x - W/2;
  cam.y = player.y - H/2;

  // Permanent regen: 1 HP every 5 seconds
  if(player.permRegen) {
    player.permRegenTimer = (player.permRegenTimer || 0) + dt;
    if(player.permRegenTimer >= 5) {
      player.permRegenTimer -= 5;
      player.hp = Math.min(player.hp + 1, player.maxHp);
    }
  }

  // Spawn enemies
  spawnTimer -= dt;
  if(spawnTimer <= 0) {
    spawnTimer = spawnRate;
    const count = 1 + Math.floor(progress * 2.5);
    for(let i=0;i<count;i++) spawnEnemy();
  }

  // Boss spawning
  for(const boss of THEME.bosses) {
    if(gameTime >= boss.spawnAt && lastBossTime < boss.spawnAt) {
      spawnBoss();
    }
  }
  lastBossTime = gameTime;

  // Death reaper at 15 min
  if(gameTime > 900 && enemies.count < 200) {
    for(let i=0;i<5;i++) spawnEnemy();
  }

  // Rebuild spatial hash
  enemyHash.clear();
  enemies.forEach(e => enemyHash.insert(e));

  // Weapon firing — don't fire until enemies exist (avoids phantom explosions at round start)
  const hasEnemies = enemies.count > 0;
  for(const w of player.weapons) {
    if(w.type === 'orbit') continue; // continuous
    if(!weaponTimers[w.type]) weaponTimers[w.type] = 0;
    if(!hasEnemies) continue; // hold cooldowns until first spawn
    weaponTimers[w.type] -= dt;
    if(weaponTimers[w.type] <= 0) {
      const stats = getWeaponStats(w.type, w.level);
      weaponTimers[w.type] = stats.cooldown;
      fireWeapon(w);
    }
  }

  // Orbit weapon (continuous)
  const orbitW = player.weapons.find(w => w.type === 'orbit');
  if(orbitW) {
    const stats = getWeaponStats('orbit', orbitW.level);
    const nearby = enemyHash.query(player.x, player.y, stats.radius + 30);
    for(const e of nearby) {
      const d = Math.hypot(e.x-player.x, e.y-player.y);
      if(d < stats.radius + e.size) {
        damageEnemy(e, stats.damage * dt);
      }
    }
  }

  // Update projectiles
  projectiles.forEach((p, idx) => {
    p.life -= dt;
    if(p.life <= 0) { projectiles.release(p); return; }

    // Boomerang return
    if(p.weaponType === 'boomerang' && p.life < p.maxLife * 0.5) {
      const dx = player.x - p.x;
      const dy = player.y - p.y;
      const d = Math.hypot(dx, dy);
      if(d > 5) {
        p.vx += (dx/d) * 800 * dt;
        p.vy += (dy/d) * 800 * dt;
      }
      if(d < 20) { projectiles.release(p); return; }
    }

    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.angle += 10 * dt;

    // Hit enemies
    const hits = enemyHash.query(p.x, p.y, 20);
    for(const e of hits) {
      const d = Math.hypot(p.x-e.x, p.y-e.y);
      if(d < e.size + 5) {
        damageEnemy(e, p.damage);
        p.pierce--;
        if(p.pierce <= 0) { projectiles.release(p); return; }
      }
    }
  });

  // Update active effects
  for(let i = activeEffects.length-1; i >= 0; i--) {
    const ef = activeEffects[i];
    ef.life -= dt;
    if(ef.life <= 0) { activeEffects.splice(i, 1); continue; }

    if(ef.type === 'area') {
      ef.radius = ef.maxRadius * (1 - ef.life/ef.maxLife);
      const hits = enemyHash.query(ef.x, ef.y, ef.radius);
      for(const e of hits) {
        if(!ef.hit.has(e)) {
          ef.hit.add(e);
          damageEnemy(e, ef.damage);
        }
      }
    } else if(ef.type === 'beam') {
      ef.tickTimer -= dt;
      if(ef.tickTimer <= 0) {
        ef.tickTimer = 0.1;
        // Damage along beam (dedup so each enemy is hit once per tick)
        const cos = Math.cos(ef.angle);
        const sin = Math.sin(ef.angle);
        const beamHit = new Set();
        for(let d = 0; d < ef.range; d += 20) {
          const bx = ef.x + cos*d;
          const by = ef.y + sin*d;
          const hits = enemyHash.query(bx, by, ef.width+10);
          for(const e of hits) {
            if(!beamHit.has(e)) {
              beamHit.add(e);
              damageEnemy(e, ef.damage);
            }
          }
        }
      }
    } else if(ef.type === 'field') {
      ef.tickTimer -= dt;
      if(ef.tickTimer <= 0) {
        ef.tickTimer = 0.5;
        const hits = enemyHash.query(ef.x, ef.y, ef.radius);
        for(const e of hits) damageEnemy(e, ef.damage);
      }
    } else if(ef.type === 'bossShockwave') {
      ef.radius = ef.maxRadius * (1 - ef.life/ef.maxLife);
      // Damage player if in ring zone
      const pd = Math.hypot(player.x - ef.x, player.y - ef.y);
      const ringInner = Math.max(0, ef.radius - 30);
      if(pd >= ringInner && pd <= ef.radius && player.invulnTime <= 0 && !ef.hit.has('player')) {
        ef.hit.add('player');
        const dmg = ef.damage * player.defense;
        player.hp -= dmg;
        player.invulnTime = 0.5;
        damageFlash = 0.15;
        screenShake = 0.15;
        Audio.damageTaken();
        if(player.hp <= 0) gameOver();
      }
    } else if(ef.type === 'bossChargeLine') {
      if(ef.phase === 'telegraph' && ef.life < ef.maxLife * 0.5) {
        // Switch to dash phase
        ef.phase = 'dash';
        if(ef.bossRef) {
          const b = ef.bossRef;
          b.x += Math.cos(ef.angle) * ef.range * 0.8;
          b.y += Math.sin(ef.angle) * ef.range * 0.8;
          // Damage player if in the charge path
          const cos = Math.cos(ef.angle);
          const sin = Math.sin(ef.angle);
          for(let d = 0; d < ef.range; d += 15) {
            const cx = ef.x + cos * d;
            const cy = ef.y + sin * d;
            const pd = Math.hypot(player.x - cx, player.y - cy);
            if(pd < ef.width + 12 && player.invulnTime <= 0 && !ef.hit.has('player')) {
              ef.hit.add('player');
              const dmg = ef.damage * player.defense;
              player.hp -= dmg;
              player.invulnTime = 0.5;
              damageFlash = 0.15;
              screenShake = 0.2;
              Audio.damageTaken();
              if(player.hp <= 0) gameOver();
              break;
            }
          }
        }
      }
    } else if(ef.type === 'bossSweepBeam') {
      // Sweep angle over lifetime
      const t = 1 - ef.life / ef.maxLife;
      ef.angle = ef.startAngle + (ef.targetAngle - ef.startAngle) * t;
      ef.tickTimer -= dt;
      if(ef.tickTimer <= 0) {
        ef.tickTimer = 0.15;
        // Check player collision along beam
        const cos = Math.cos(ef.angle);
        const sin = Math.sin(ef.angle);
        for(let d = 0; d < ef.range; d += 15) {
          const bx = ef.x + cos * d;
          const by = ef.y + sin * d;
          const pd = Math.hypot(player.x - bx, player.y - by);
          if(pd < ef.width + 12 && player.invulnTime <= 0) {
            const dmg = ef.damage * player.defense;
            player.hp -= dmg;
            player.invulnTime = 0.5;
            damageFlash = 0.15;
            screenShake = 0.1;
            Audio.damageTaken();
            if(player.hp <= 0) gameOver();
            break;
          }
        }
      }
    }
  }

  // Boss attack loop
  updateBossAttacks(dt);

  // Update telegraphs
  updateTelegraphs(dt);

  // Update enemies
  player.invulnTime -= dt;
  enemies.forEach(e => {
    // Movement dispatch
    const handler = MOVEMENT_HANDLERS[e.movementType] || MOVEMENT_HANDLERS.chase;
    handler(e, dt, player);
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const d = Math.hypot(dx, dy);
    // Separation from nearby enemies
    const nearby = enemyHash.query(e.x, e.y, e.size * 2.5);
    for(const other of nearby) {
      if(other === e) continue;
      const sx = e.x - other.x;
      const sy = e.y - other.y;
      const sd = Math.hypot(sx, sy);
      const minDist = (e.size + other.size) * 0.8;
      if(sd < minDist && sd > 0.1) {
        const push = (minDist - sd) / minDist * 120 * dt;
        e.x += (sx/sd) * push;
        e.y += (sy/sd) * push;
      }
    }
    e.hitFlash -= dt;

    // Hit player
    if(d < e.size + 12 && player.invulnTime <= 0) {
      const dmg = (e.isBoss ? 15 + gameTime * 0.05 : 5 + gameTime*0.02) * player.defense;
      player.hp -= dmg;
      player.invulnTime = 0.5;
      damageFlash = 0.15;
      screenShake = 0.1;
      Audio.damageTaken();
      // Thorns: reflect damage back to enemy
      if(player.permThorns > 0) {
        const thornsDmg = dmg * player.permThorns;
        e.hp -= thornsDmg;
        spawnParticles(e.x, e.y, 3, '#ff8800', 2);
        if(e.hp <= 0) killEnemy(e);
      }
      if(player.hp <= 0) {
        gameOver();
        return;
      }
    }
  });

  // Victory condition check
  if(checkVictoryCondition()) {
    triggerVictory();
    return;
  }

  // Low health heartbeat
  if(player.hp < player.maxHp * 0.3) {
    heartbeatTimer -= dt;
    if(heartbeatTimer <= 0) {
      heartbeatTimer = 0.8;
      Audio.heartbeat();
    }
  }

  // Update gems
  gems.forEach(g => {
    g.life -= dt;
    if(g.life <= 0) { gems.release(g); return; }
    // Slow down
    g.vx *= 0.95;
    g.vy *= 0.95;
    g.x += g.vx * dt;
    g.y += g.vy * dt;
    // Magnetic pickup
    const dx = player.x - g.x;
    const dy = player.y - g.y;
    const d = Math.hypot(dx, dy);
    if(d < player.pickupRadius) {
      const pull = Math.max(300, 600 * (1 - d/player.pickupRadius));
      g.x += (dx/d) * pull * dt;
      g.y += (dy/d) * pull * dt;
    }
    if(d < 15) {
      addXp(g.value);
      runGold += 2;
      Audio.gemSound();
      gems.release(g);
    }
  });

  // Update loot drops
  lootDrops.forEach(d => {
    d.life -= dt;
    if(d.life <= 0) { lootDrops.release(d); return; }
    // Slow down initial velocity
    d.vx *= 0.94;
    d.vy *= 0.94;
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    d.bobPhase += dt * 3;
    // Magnetic pickup (uses same radius as gems)
    const dx = player.x - d.x;
    const dy = player.y - d.y;
    const dist = Math.hypot(dx, dy);
    if(dist < player.pickupRadius * 0.6) {
      const pull = Math.max(200, 400 * (1 - dist / (player.pickupRadius * 0.6)));
      d.x += (dx / dist) * pull * dt;
      d.y += (dy / dist) * pull * dt;
    }
    if(dist < 20) {
      // Pick up loot: add to persistent inventory
      const saveData = SaveManager.load();
      saveData.inventory.push(d.item.id);
      // Auto-equip if fewer than 3 equipped
      if(!saveData.equipped) saveData.equipped = [];
      if(saveData.equipped.length < 3) {
        saveData.equipped.push(d.item.id);
      }
      SaveManager.save(saveData);
      Audio.lootSound(d.item.rarity);
      const rc = RARITY_CONFIG[d.item.rarity];
      spawnParticles(d.x, d.y, 10, rc.color, 4);
      // Show loot pickup text
      lootPickupTexts.push({ text: d.item.name, rarity: d.item.rarity, x: d.x, y: d.y, life: 1.5, maxLife: 1.5 });
      lootDrops.release(d);
    }
  });

  // Update loot pickup floating texts
  for(let i = lootPickupTexts.length - 1; i >= 0; i--) {
    lootPickupTexts[i].life -= dt;
    lootPickupTexts[i].y -= 30 * dt;
    if(lootPickupTexts[i].life <= 0) lootPickupTexts.splice(i, 1);
  }

  // Update particles
  particles.forEach(p => {
    p.life -= dt;
    if(p.life <= 0) { particles.release(p); return; }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.96;
    p.vy *= 0.96;
  });

  // Render
  render(dt);
  updateHUD();
}

// ============================================================
// EFFECT RENDERERS
// ============================================================
const EFFECT_RENDERERS = {};

EFFECT_RENDERERS.field = function(ctx, ef, theme) {
  const alpha = ef.life / ef.maxLife * 0.3;
  ctx.fillStyle = `rgba(${theme.effectColors.field.fillRgb},${alpha})`;
  ctx.beginPath(); ctx.arc(ef.x, ef.y, ef.radius, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = `rgba(${theme.effectColors.field.strokeRgb},${alpha*2})`;
  ctx.lineWidth = 2;
  ctx.stroke();
};

EFFECT_RENDERERS.area = function(ctx, ef, theme) {
  const alpha = ef.life/ef.maxLife * 0.4;
  ctx.strokeStyle = `rgba(${theme.effectColors.area.rgb},${alpha})`;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(ef.x, ef.y, ef.radius, 0, Math.PI*2); ctx.stroke();
  ctx.fillStyle = `rgba(${theme.effectColors.area.rgb},${alpha*0.3})`;
  ctx.fill();
};

EFFECT_RENDERERS.beam = function(ctx, ef, theme) {
  const alpha = ef.life/ef.maxLife;
  ctx.save();
  ctx.strokeStyle = `rgba(${theme.effectColors.beam.rgb},${alpha})`;
  ctx.shadowColor = theme.effectColors.beam.glow; ctx.shadowBlur = 20;
  ctx.lineWidth = ef.width;
  ctx.beginPath();
  ctx.moveTo(ef.x, ef.y);
  ctx.lineTo(ef.x + Math.cos(ef.angle)*ef.range, ef.y + Math.sin(ef.angle)*ef.range);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();
};

EFFECT_RENDERERS.chainLine = function(ctx, ef, theme) {
  const alpha = ef.life/ef.maxLife;
  ctx.strokeStyle = `rgba(${theme.effectColors.chain.rgb},${alpha})`;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(ef.x1, ef.y1); ctx.lineTo(ef.x2, ef.y2); ctx.stroke();
};

EFFECT_RENDERERS.bossShockwave = function(ctx, ef) {
  const alpha = ef.life / ef.maxLife;
  ctx.save();
  ctx.strokeStyle = `rgba(255,80,30,${alpha * 0.8})`;
  ctx.lineWidth = 4 + (1 - alpha) * 6;
  ctx.shadowColor = '#ff4400';
  ctx.shadowBlur = 15;
  ctx.beginPath(); ctx.arc(ef.x, ef.y, ef.radius, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = `rgba(255,100,50,${alpha * 0.1})`;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
};

EFFECT_RENDERERS.bossChargeLine = function(ctx, ef) {
  const alpha = ef.life / ef.maxLife;
  const cos = Math.cos(ef.angle);
  const sin = Math.sin(ef.angle);
  ctx.save();
  if(ef.phase === 'telegraph') {
    // Pulsing red warning line
    const pulse = 0.4 + 0.6 * Math.sin(gameTime * 15);
    ctx.strokeStyle = `rgba(255,40,40,${pulse * alpha})`;
    ctx.lineWidth = ef.width * 2;
    ctx.setLineDash([15, 10]);
  } else {
    // Solid impact trail
    ctx.strokeStyle = `rgba(255,200,50,${alpha})`;
    ctx.lineWidth = ef.width;
    ctx.shadowColor = '#ffcc00';
    ctx.shadowBlur = 20;
  }
  ctx.beginPath();
  ctx.moveTo(ef.x, ef.y);
  ctx.lineTo(ef.x + cos * ef.range, ef.y + sin * ef.range);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.shadowBlur = 0;
  ctx.restore();
};

EFFECT_RENDERERS.bossSweepBeam = function(ctx, ef) {
  const alpha = ef.life / ef.maxLife;
  const cos = Math.cos(ef.angle);
  const sin = Math.sin(ef.angle);
  ctx.save();
  ctx.strokeStyle = `rgba(255,50,50,${alpha * 0.9})`;
  ctx.shadowColor = '#ff2222';
  ctx.shadowBlur = 25;
  ctx.lineWidth = ef.width;
  ctx.beginPath();
  ctx.moveTo(ef.x, ef.y);
  ctx.lineTo(ef.x + cos * ef.range, ef.y + sin * ef.range);
  ctx.stroke();
  // Wider glow
  ctx.strokeStyle = `rgba(255,100,100,${alpha * 0.3})`;
  ctx.lineWidth = ef.width * 3;
  ctx.beginPath();
  ctx.moveTo(ef.x, ef.y);
  ctx.lineTo(ef.x + cos * ef.range, ef.y + sin * ef.range);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();
};

// ============================================================
// TELEGRAPH SYSTEM
// ============================================================
function updateTelegraphs(dt) {
  // Clean expired telegraphs
  for(let i = telegraphs.length - 1; i >= 0; i--) {
    telegraphs[i].life -= dt;
    if(telegraphs[i].life <= 0) telegraphs.splice(i, 1);
  }

  // Add telegraphs for charge-type enemies in telegraph phase
  enemies.forEach(e => {
    if(e.movementType === 'charge' && e.movementState.phase === 'telegraph') {
      // Check if we already have a telegraph for this enemy
      if(!telegraphs.find(t => t.source === e && t.type === 'chargeWarning')) {
        telegraphs.push({
          type: 'chargeWarning', source: e,
          x: e.x, y: e.y, life: 1.0, maxLife: 1.0
        });
      }
    }
    if(e.movementType === 'charge' && e.movementState.phase === 'telegraph') {
      if(!telegraphs.find(t => t.source === e && t.type === 'exclamation')) {
        telegraphs.push({
          type: 'exclamation', source: e,
          life: 1.0, maxLife: 1.0
        });
      }
    }
  });

  // Update positions to track source
  for(const t of telegraphs) {
    if(t.source && t.type === 'chargeWarning') {
      t.x = t.source.x;
      t.y = t.source.y;
    }
  }
}

const TELEGRAPH_RENDERERS = {};

// Red pulsing danger circle on ground around charging enemy
TELEGRAPH_RENDERERS.chargeWarning = function(ctx, t) {
  const pulse = 0.5 + 0.5 * Math.sin(gameTime * 12);
  const alpha = (t.life / t.maxLife) * pulse;
  ctx.save();
  ctx.strokeStyle = `rgba(255,40,40,${alpha})`;
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 4]);
  ctx.beginPath();
  ctx.arc(t.x, t.y, 40 + (1 - t.life / t.maxLife) * 20, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = `rgba(255,0,0,${alpha * 0.15})`;
  ctx.fill();
  ctx.setLineDash([]);
  ctx.restore();
};

// Bouncing "!" above charging enemies
TELEGRAPH_RENDERERS.exclamation = function(ctx, t) {
  if(!t.source) return;
  const bounce = Math.abs(Math.sin(gameTime * 8)) * 8;
  const alpha = Math.min(1, t.life / t.maxLife * 2);
  ctx.save();
  ctx.fillStyle = `rgba(255,60,60,${alpha})`;
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('!', t.source.x, t.source.y - t.source.size - 12 - bounce);
  ctx.restore();
};

// Edge-of-screen arrows for nearby offscreen enemies/bosses
function renderOffscreenArrows(ctx) {
  enemies.forEach(e => {
    // Only show arrows for bosses and enemies within 400px of screen edge
    const screenX = e.x - cam.x;
    const screenY = e.y - cam.y;
    const margin = 30;
    const isOffscreen = screenX < -margin || screenX > W + margin || screenY < -margin || screenY > H + margin;
    if(!isOffscreen) return;

    const distToPlayer = Math.hypot(e.x - player.x, e.y - player.y);
    if(!e.isBoss && distToPlayer > 400) return;

    // Clamp to screen edge
    const angle = Math.atan2(screenY - H/2, screenX - W/2);
    const edgeX = Math.max(margin, Math.min(W - margin, W/2 + Math.cos(angle) * (W/2 - margin)));
    const edgeY = Math.max(margin, Math.min(H - margin, H/2 + Math.sin(angle) * (H/2 - margin)));

    ctx.save();
    ctx.translate(edgeX, edgeY);
    ctx.rotate(angle);

    // Arrow color: gold for boss, red for regular
    const color = e.isBoss ? '#ffcc00' : '#ff4444';
    const pulse = e.isBoss ? 0.7 + 0.3 * Math.sin(gameTime * 6) : 0.5 + 0.5 * Math.sin(gameTime * 4);
    ctx.globalAlpha = pulse;
    ctx.fillStyle = color;

    // Draw arrow triangle
    const size = e.isBoss ? 14 : 8;
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size * 0.6, -size * 0.6);
    ctx.lineTo(-size * 0.6, size * 0.6);
    ctx.closePath();
    ctx.fill();

    // Boss indicator ring
    if(e.isBoss) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, size + 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  });
}

// ============================================================
// RENDERING
// ============================================================
function render(dt) {
  // Clear entire canvas before camera transform
  ctx.fillStyle = THEME.palette.bg;
  ctx.fillRect(0, 0, W, H);

  ctx.save();

  // Screen shake
  let sx = 0, sy = 0;
  if(screenShake > 0) {
    screenShake -= dt;
    sx = (Math.random()-0.5) * 8;
    sy = (Math.random()-0.5) * 8;
  }
  // Background (drawn in screen space before camera transform)
  ctx.save();
  ctx.translate(sx, sy);
  THEME.drawBackground(ctx, cam, W, H, gameTime);
  ctx.restore();

  ctx.translate(sx - cam.x, sy - cam.y);

  // Field effects (below everything)
  for(const ef of activeEffects) {
    if(ef.type === 'field') {
      EFFECT_RENDERERS.field(ctx, ef, THEME);
    }
  }

  // Gems
  gems.forEach(g => THEME.drawGem(ctx, g, gameTime));

  // Loot drops
  lootDrops.forEach(d => {
    const rc = RARITY_CONFIG[d.item.rarity];
    const bob = Math.sin(d.bobPhase) * 4;
    const pulse = 0.7 + 0.3 * Math.sin(d.bobPhase * 1.5);
    ctx.save();
    // Glow
    ctx.shadowColor = rc.glow;
    ctx.shadowBlur = 12 + pulse * 6;
    // Outer ring
    ctx.strokeStyle = rc.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(d.x, d.y + bob, 10, 0, Math.PI * 2);
    ctx.stroke();
    // Inner fill
    ctx.fillStyle = rc.color;
    ctx.globalAlpha = 0.3 + pulse * 0.3;
    ctx.fill();
    // Icon
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(d.item.icon, d.x, d.y + bob);
    // Sparkle particles around rare+ items
    if(d.item.rarity !== 'common') {
      const sparkleCount = d.item.rarity === 'legendary' ? 3 : d.item.rarity === 'epic' ? 2 : 1;
      for(let i = 0; i < sparkleCount; i++) {
        const sa = d.bobPhase * 2 + i * (Math.PI * 2 / sparkleCount);
        const sr = 14 + Math.sin(sa * 0.7) * 4;
        const sx = d.x + Math.cos(sa) * sr;
        const sy = d.y + bob + Math.sin(sa) * sr;
        ctx.fillStyle = rc.color;
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(sa * 3);
        ctx.beginPath();
        ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  });

  // Enemies
  enemies.forEach(e => {
    ctx.save();
    if(e.hitFlash > 0) {
      ctx.globalAlpha = 0.5 + 0.5*Math.sin(e.hitFlash*30);
    }
    if(e.isBoss) {
      THEME.drawBoss(ctx, e, gameTime);
    } else {
      THEME.drawEnemy(ctx, e, gameTime);
    }
    ctx.restore();
  });

  // Dash afterimage trail
  if(player.dashTimer > 0) {
    const pr = 16;
    for(let i = 3; i >= 1; i--) {
      ctx.save();
      ctx.globalAlpha = 0.15 * i;
      const offset = i * 12;
      THEME.drawPlayer(ctx, player.x - player.dashDirX * offset, player.y - player.dashDirY * offset, pr, gameTime);
      ctx.restore();
    }
  }

  // Player
  const pr = 16;
  THEME.drawPlayer(ctx, player.x, player.y, pr, gameTime);

  // Orbit visual
  const orbitW = player.weapons.find(w => w.type === 'orbit');
  if(orbitW) {
    const stats = getWeaponStats('orbit', orbitW.level);
    ctx.strokeStyle = THEME.effectColors.orbit.ring;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(player.x, player.y, stats.radius, 0, Math.PI*2); ctx.stroke();
    for(let i=0;i<stats.count;i++) {
      const a = gameTime * stats.speed + (Math.PI*2*i/stats.count);
      const ox = player.x + Math.cos(a)*stats.radius;
      const oy = player.y + Math.sin(a)*stats.radius;
      ctx.fillStyle = THEME.effectColors.orbit.orb;
      ctx.shadowColor = THEME.effectColors.orbit.orb; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(ox, oy, 5+orbitW.level, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  // Projectiles
  projectiles.forEach(p => THEME.drawProjectile(ctx, p));

  // Effects (field is already rendered above, skip it here)
  for(const ef of activeEffects) {
    if(ef.type === 'field') continue;
    const renderer = EFFECT_RENDERERS[ef.type];
    if (renderer) renderer(ctx, ef, THEME);
  }

  // Particles
  particles.forEach(p => {
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI*2); ctx.fill();
  });
  ctx.globalAlpha = 1;

  // Render telegraphs (world space)
  for(const t of telegraphs) {
    const renderer = TELEGRAPH_RENDERERS[t.type];
    if(renderer) renderer(ctx, t);
  }

  // Loot pickup floating text (world space)
  for(const lt of lootPickupTexts) {
    const alpha = Math.min(1, lt.life / lt.maxLife * 2);
    const rc = RARITY_CONFIG[lt.rarity];
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = rc.color;
    ctx.shadowColor = rc.glow;
    ctx.shadowBlur = 8;
    ctx.fillText(lt.text, lt.x, lt.y);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  ctx.restore();

  // Offscreen arrows (screen space)
  renderOffscreenArrows(ctx);

  // Damage flash overlay
  if(damageFlash > 0) {
    damageFlash -= 1/60;
    ctx.fillStyle = `rgba(${THEME.effectColors.damageFlash.rgb},${damageFlash * 2})`;
    ctx.fillRect(0, 0, W, H);
  }

  // Invuln indicator
  if(player.invulnTime > 0) {
    ctx.save();
    ctx.translate(W/2, H/2);
    ctx.strokeStyle = `rgba(${THEME.effectColors.invuln.rgb},${0.3*Math.sin(gameTime*20)})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI*2); ctx.stroke();
    ctx.restore();
  }

  // Dash cooldown arc
  if(player.dashCooldown > 0) {
    ctx.save();
    ctx.translate(W/2, H/2);
    const cdProgress = 1 - player.dashCooldown / 1.2;
    ctx.strokeStyle = `rgba(${THEME.effectColors.invuln.rgb},${0.4 * cdProgress})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 22, -Math.PI/2, -Math.PI/2 + cdProgress * Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Gold HUD — canvas-rendered, top-right area
  renderGoldHUD(ctx);
}

function renderGoldHUD(ctx) {
  const padding = 16;
  const coinRadius = 9;
  const x = W - padding;
  const y = 52;
  const accentColor = THEME.palette.accent || THEME.palette.text || '#ffcc00';

  // Gold number (right-aligned)
  ctx.save();
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = accentColor;
  ctx.shadowColor = accentColor;
  ctx.shadowBlur = 6;
  const text = `${runGold}`;
  ctx.fillText(text, x, y);
  ctx.shadowBlur = 0;

  // Coin icon to the left of the number
  const textWidth = ctx.measureText(text).width;
  const coinX = x - textWidth - coinRadius - 6;
  const coinY = y;

  // Coin circle
  ctx.fillStyle = '#ffd700';
  ctx.shadowColor = '#ffd700';
  ctx.shadowBlur = 4;
  ctx.beginPath();
  ctx.arc(coinX, coinY, coinRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Coin inner detail — "G" letter
  ctx.fillStyle = '#b8860b';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('G', coinX, coinY + 1);

  ctx.restore();
}

// ============================================================
// VICTORY SYSTEM
// ============================================================
function checkVictoryCondition() {
  if(victoryAchieved) return false;
  if(!THEME.victoryCondition) return false;
  const vc = THEME.victoryCondition;

  // Check time-based victory
  if(vc.timeSeconds && gameTime >= vc.timeSeconds) {
    return true;
  }

  // Check boss-kill victory
  if(vc.bossName && killedBossNames.includes(vc.bossName)) {
    return true;
  }

  return false;
}

function triggerVictory() {
  if(victoryAchieved) return;
  victoryAchieved = true;

  Audio.victoryFanfare();

  // Kill all enemies — shower the field with rewards
  enemies.forEach(e => {
    if(!e._dead) killEnemy(e);
  });

  // Enter vacuum state: suck all pickups into player before showing overlay
  state = 'victory_vacuum';
  vacuumTimer = 0;
}

let vacuumTimer = 0;
const VACUUM_DURATION = 1.5;
const VACUUM_PULL = 1200;

function updateVictoryVacuum(dt) {
  vacuumTimer += dt;

  // Pull all gems toward player at high speed
  gems.forEach(g => {
    const dx = player.x - g.x;
    const dy = player.y - g.y;
    const d = Math.hypot(dx, dy);
    if(d > 5) {
      const pull = VACUUM_PULL * Math.min(1, vacuumTimer * 2);
      g.x += (dx/d) * pull * dt;
      g.y += (dy/d) * pull * dt;
    }
    if(d < 25) {
      xp += g.value; // collect silently — no level-up during vacuum
      runGold += 2;
      Audio.gemSound();
      gems.release(g);
    }
  });

  // Pull all loot drops toward player
  lootDrops.forEach(d => {
    const dx = player.x - d.x;
    const dy = player.y - d.y;
    const dist = Math.hypot(dx, dy);
    if(dist > 5) {
      const pull = VACUUM_PULL * Math.min(1, vacuumTimer * 2);
      d.x += (dx/dist) * pull * dt;
      d.y += (dy/dist) * pull * dt;
    }
    d.bobPhase += dt * 3;
    if(dist < 25) {
      const saveData = SaveManager.load();
      saveData.inventory.push(d.item.id);
      if(!saveData.equipped) saveData.equipped = [];
      if(saveData.equipped.length < 3) saveData.equipped.push(d.item.id);
      SaveManager.save(saveData);
      Audio.lootSound(d.item.rarity);
      const rc = RARITY_CONFIG[d.item.rarity];
      spawnParticles(d.x, d.y, 10, rc.color, 4);
      lootPickupTexts.push({ text: d.item.name, rarity: d.item.rarity, x: d.x, y: d.y, life: 1.5, maxLife: 1.5 });
      lootDrops.release(d);
    }
  });

  // Update particles so death/pickup effects still animate
  particles.forEach(p => {
    p.life -= dt;
    if(p.life <= 0) { particles.release(p); return; }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.95;
    p.vy *= 0.95;
  });

  // Update loot pickup floating texts
  for(let i = lootPickupTexts.length - 1; i >= 0; i--) {
    lootPickupTexts[i].life -= dt;
    lootPickupTexts[i].y -= 30 * dt;
    if(lootPickupTexts[i].life <= 0) lootPickupTexts.splice(i, 1);
  }

  // Once vacuum is done (or all pickups collected), show victory
  const allCollected = gems.count === 0 && lootDrops.count === 0;
  if(vacuumTimer >= VACUUM_DURATION || allCollected) {
    finalizeVictory();
  }
}

function finalizeVictory() {
  state = 'victory';

  // Record run stats and update world progression
  SaveManager.recordRun(kills, gameTime, runGold);
  const saveData = SaveManager.load();
  // Award 1 skill point per world completed
  saveData.skillPoints = (saveData.skillPoints || 0) + 1;
  // Advance currentWorld if this world is the current one
  if(THEME.worldOrder && typeof THEME.worldOrder.current === 'number') {
    if(saveData.currentWorld <= THEME.worldOrder.current) {
      saveData.currentWorld = THEME.worldOrder.current + 1;
    }
  }
  SaveManager.save(saveData);

  // Show victory overlay
  const mins = Math.floor(gameTime/60);
  const secs = Math.floor(gameTime%60);
  const victoryScreen = document.getElementById('victory-screen');
  const victoryStats = document.getElementById('victory-stats');
  if(victoryStats) {
    victoryStats.innerHTML = `
      <div class="stats-line">Time Survived: ${mins}:${secs.toString().padStart(2,'0')}</div>
      <div class="stats-line">Level Reached: ${playerLevel}</div>
      <div class="stats-line">Enemies Slain: ${kills}</div>
      <div class="stats-line">Gold Earned: ${runGold}g</div>
      <div class="stats-line">Weapons: ${player.weapons.length}</div>
      <div class="stats-line" style="margin-top:8px;opacity:0.7">Total Runs: ${saveData.stats.runsCompleted} | All-time Kills: ${saveData.stats.totalKills} | Bank: ${saveData.gold}g</div>
    `;
  }
  if(victoryScreen) {
    victoryScreen.style.display = 'flex';
  }

  // Redirect to next world after delay
  const nextUrl = THEME.worldOrder ? THEME.worldOrder.next : null;
  if(nextUrl) {
    setTimeout(() => {
      window.location.href = nextUrl;
    }, 4000);
  }
}

// ============================================================
// STATE MANAGEMENT
// ============================================================
function startGame() {
  Audio.init();
  state = 'playing';
  gameTime = 0;
  kills = 0;
  playerLevel = 1;
  xp = 0;
  xpToNext = 5;
  waveNum = 1;
  bossIdx = 0;
  lastBossTime = -999;
  player.x = 0; player.y = 0;
  player.hp = 100; player.maxHp = 100;
  player.speed = 150;
  player.damage = 1;
  player.attackSpeed = 1;
  player.pickupRadius = 60;
  player.defense = 1;
  player.invulnTime = 0;
  player.dashTimer = 0;
  player.dashCooldown = 0;
  player.dashDirX = 0; player.dashDirY = 0;
  player.lastDirX = 0; player.lastDirY = 1;
  player.weapons = [{ type: 'projectile', level: 1 }];
  player.passives = [];

  // Clear permanent passive flags (reset before re-applying from save)
  player.permRegen = false;
  player.permRegenTimer = 0;
  player.permCritChance = 0;
  player.permCritDamage = 0;
  player.permLifesteal = 0;
  player.permXpMult = 0;
  player.permMultiProjectile = false;
  player.permPiercing = false;
  player.permShieldOnDash = false;
  player.permSecondLife = false;
  player.secondLifeUsed = false;
  player.dashDistance = 1;
  player.dashCooldownReduction = 0;

  // --- Apply permanent upgrades from save state ---
  const permSave = SaveManager.load();
  const permUpgrades = permSave.upgrades || {};
  for (const [uid, upg] of Object.entries(permUpgrades)) {
    // Stat upgrades: flat bonus or multiplicative
    if (upg.stat) {
      if (typeof upg.bonus === 'number') {
        if (upg.stat === 'maxHp') { player.maxHp += upg.bonus; player.hp = player.maxHp; }
        else if (upg.stat === 'pickupRadius') player.pickupRadius += upg.bonus;
      }
      if (typeof upg.mult === 'number') {
        if (upg.stat === 'speed') player.speed *= upg.mult;
        else if (upg.stat === 'damage') player.damage *= upg.mult;
        else if (upg.stat === 'attackSpeed') player.attackSpeed *= upg.mult;
        else if (upg.stat === 'defense') player.defense *= upg.mult;
      }
    }
    // Starting weapons: add if not already the default weapon
    if (upg.weaponType && upg.weaponType !== 'projectile') {
      if (!player.weapons.find(w => w.type === upg.weaponType)) {
        player.weapons.push({ type: upg.weaponType, level: 1 });
      }
    }
  }
  // Passive abilities from permanent upgrades
  if (permUpgrades.p_regen) {
    player.permRegen = true;      // 1 HP per 5 seconds
    player.permRegenTimer = 0;
  }
  if (permUpgrades.p_critchance) {
    player.permCritChance = 0.05; // +5% crit chance
  }
  if (permUpgrades.p_lifesteal) {
    player.permLifesteal = 0.01;  // 1% of damage dealt
  }
  if (permUpgrades.p_xpboost) {
    player.permXpMult = 1.10;     // +10% XP
  }
  // --- End permanent upgrades ---

  // --- Apply skill tree bonuses from save state ---
  const skillTree = permSave.skillTree || {};
  // Offense branch
  if (skillTree.offense_1) player.permCritChance = (player.permCritChance || 0) + 0.08;
  if (skillTree.offense_2) player.permCritDamage = (player.permCritDamage || 0) + 0.50;
  if (skillTree.offense_3) player.permMultiProjectile = true;
  if (skillTree.offense_4) player.permPiercing = true;
  // Defense branch
  if (skillTree.defense_1) { player.permRegen = true; player.permRegenTimer = 0; }
  if (skillTree.defense_2) player.permShieldOnDash = true;
  if (skillTree.defense_3) player.defense *= 0.85;
  if (skillTree.defense_4) player.permSecondLife = true;
  // Utility branch
  if (skillTree.utility_1) player.dashDistance = (player.dashDistance || 1) * 1.40;
  if (skillTree.utility_2) player.dashCooldownReduction = (player.dashCooldownReduction || 0) + 0.30;
  if (skillTree.utility_3) player.pickupRadius += 40;
  if (skillTree.utility_4) player.permXpMult = (player.permXpMult || 1) * 1.25;
  // --- End skill tree bonuses ---

  // --- Apply equipped loot item effects ---
  const equippedItems = permSave.equipped || [];
  player.permBerserker = null;
  player.permThorns = 0;
  player.permPhoenixRevive = false;
  player.phoenixUsed = false;
  for (const itemId of equippedItems) {
    const loot = getLootById(itemId);
    if (!loot) continue;
    const ef = loot.effect;
    if (!ef) continue;
    if (ef.stat === 'maxHp' && typeof ef.bonus === 'number') {
      player.maxHp += ef.bonus;
      player.hp = player.maxHp;
      if (ef.regen) { player.permRegen = true; player.permRegenTimer = 0; }
    }
    if (ef.stat === 'speed' && typeof ef.mult === 'number') player.speed *= ef.mult;
    if (ef.stat === 'damage' && typeof ef.mult === 'number') player.damage *= ef.mult;
    if (ef.stat === 'attackSpeed' && typeof ef.mult === 'number') player.attackSpeed *= ef.mult;
    if (ef.stat === 'defense' && typeof ef.mult === 'number') player.defense *= ef.mult;
    if (ef.stat === 'pickupRadius' && typeof ef.bonus === 'number') player.pickupRadius += ef.bonus;
    if (ef.stat === 'lifesteal') player.permLifesteal = (player.permLifesteal || 0) + ef.value;
    if (ef.stat === 'critChance') player.permCritChance = (player.permCritChance || 0) + ef.value;
    if (ef.stat === 'xpMult') player.permXpMult = (player.permXpMult || 1) * ef.value;
    if (ef.stat === 'dashCooldown') player.dashCooldownReduction = (player.dashCooldownReduction || 0) + ef.value;
    if (ef.stat === 'berserker') player.permBerserker = { threshold: ef.threshold, mult: ef.mult };
    if (ef.stat === 'phoenixRevive') player.permPhoenixRevive = true;
    if (ef.stat === 'thornsDamage') player.permThorns = (player.permThorns || 0) + ef.value;
    if (ef.stat === 'voidPower') {
      player.damage *= ef.damageMult;
      player.maxHp = Math.floor(player.maxHp * ef.hpMult);
      player.hp = player.maxHp;
    }
  }
  // --- End equipped loot effects ---

  enemies.releaseAll();
  projectiles.releaseAll();
  gems.releaseAll();
  particles.releaseAll();
  lootDrops.releaseAll();
  lootPickupTexts.length = 0;
  activeEffects.length = 0;
  telegraphs.length = 0;
  Object.keys(weaponTimers).forEach(k => weaponTimers[k] = 0);
  damageFlash = 0;
  screenShake = 0;
  spawnTimer = 0;
  runGold = 0;
  goldTimerAccum = 0;
  victoryAchieved = false;
  killedBossNames = [];
  updateWeaponBar();
  document.getElementById('title-screen').style.display = 'none';
  document.getElementById('game-over-screen').style.display = 'none';
  const vs = document.getElementById('victory-screen');
  if(vs) vs.style.display = 'none';
  lastTime = performance.now();
}

function checkSecondLife() {
  if(player.permSecondLife && !player.secondLifeUsed) {
    player.secondLifeUsed = true;
    player.hp = Math.floor(player.maxHp * 0.3);
    player.invulnTime = 2.0;
    spawnParticles(player.x, player.y, 20, '#ffcc00', 5);
    Audio.levelUpSound();
    return true; // survived
  }
  // Phoenix Feather from equipped loot: auto-revive once
  if(player.permPhoenixRevive && !player.phoenixUsed) {
    player.phoenixUsed = true;
    player.hp = Math.floor(player.maxHp * 0.5);
    player.invulnTime = 2.5;
    spawnParticles(player.x, player.y, 25, '#ff6600', 6);
    spawnParticles(player.x, player.y, 15, '#ffcc00', 4);
    Audio.levelUpSound();
    lootPickupTexts.push({ text: 'Phoenix Feather!', rarity: 'legendary', x: player.x, y: player.y - 30, life: 2.0, maxLife: 2.0 });
    return true;
  }
  return false; // actually dead
}

function gameOver() {
  if(player.hp <= 0 && checkSecondLife()) return;
  state = 'gameover';
  // Auto-save run stats + gold to persistent save
  SaveManager.recordRun(kills, gameTime, runGold);
  const mins = Math.floor(gameTime/60);
  const secs = Math.floor(gameTime%60);
  const saveData = SaveManager.load();
  document.getElementById('go-stats').innerHTML = `
    <div class="stats-line">Time Survived: ${mins}:${secs.toString().padStart(2,'0')}</div>
    <div class="stats-line">Level Reached: ${playerLevel}</div>
    <div class="stats-line">Enemies Slain: ${kills}</div>
    <div class="stats-line">Gold Earned: ${runGold}g</div>
    <div class="stats-line">Weapons: ${player.weapons.length}</div>
    <div class="stats-line" style="margin-top:8px;opacity:0.7">Total Runs: ${saveData.stats.runsCompleted} | All-time Kills: ${saveData.stats.totalKills} | Bank: ${saveData.gold}g</div>
  `;
  document.getElementById('game-over-screen').style.display = 'flex';
}

function togglePause() {
  if(state === 'playing') {
    state = 'paused';
    document.getElementById('pause-screen').style.display = 'flex';
  } else if(state === 'paused') {
    state = 'playing';
    document.getElementById('pause-screen').style.display = 'none';
    lastTime = performance.now();
  }
}

// Button handlers
document.getElementById('btn-start').addEventListener('click', startGame);
document.getElementById('btn-restart').addEventListener('click', startGame);
document.getElementById('btn-resume').addEventListener('click', togglePause);

// Start loop
requestAnimationFrame(gameLoop);
