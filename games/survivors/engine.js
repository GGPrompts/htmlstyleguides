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
  let musicGain = null;
  let ambientOsc = null;
  let ambientFilter = null;
  let muted = false;

  function init() {
    if(actx) return;
    actx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = actx.createGain();
    masterGain.gain.value = 0.4;
    masterGain.connect(actx.destination);
    musicGain = actx.createGain();
    musicGain.gain.value = 0.12;
    musicGain.connect(actx.destination);
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
    if(musicGain) musicGain.gain.value = muted ? 0 : 0.12;
    return muted;
  }

  function setMusicVolume(v) {
    if(musicGain && !muted) musicGain.gain.value = v;
  }

  function getMusicGain() {
    return musicGain;
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

  function overclockSound() {
    // Charging whine then rapid clicks
    note(800, 0.3, 'sawtooth', 0.08);
    note(1200, 0.2, 'sawtooth', 0.06);
    setTimeout(() => { note(1600, 0.15, 'square', 0.07); noise(0.05, 0.06); }, 200);
    setTimeout(() => { note(2000, 0.1, 'square', 0.05); }, 350);
  }

  function bloodRitualSound() {
    // Deep boom + splattering
    note(50, 0.6, 'sawtooth', 0.15);
    note(80, 0.4, 'sine', 0.12);
    noise(0.3, 0.12);
    setTimeout(() => { noise(0.2, 0.08); note(100, 0.3, 'square', 0.06); }, 150);
  }

  function naturesVeilSound() {
    // Rustling leaves → soft chime
    noise(0.15, 0.06);
    note(1200, 0.2, 'sine', 0.05);
    note(1500, 0.15, 'sine', 0.04);
    setTimeout(() => note(900, 0.3, 'sine', 0.03), 100);
  }

  function singularityRiftSound() {
    // Deep warping drone
    note(60, 1.5, 'sawtooth', 0.1);
    note(90, 1.2, 'sawtooth', 0.08, 50);
    noise(0.3, 0.06);
  }

  function singularityCollapseSound() {
    // Explosive release
    note(40, 0.5, 'sawtooth', 0.15);
    noise(0.4, 0.15);
    note(200, 0.3, 'sine', 0.1);
    setTimeout(() => { note(100, 0.4, 'sawtooth', 0.08); noise(0.2, 0.1); }, 100);
  }

  // ---- Background music via ChipPlayer ----
  let musicLoaded = false;

  function loadMusic(songUrl) {
    if(!songUrl || typeof ChipPlayer === 'undefined') return;
    fetch(songUrl)
      .then(r => r.json())
      .then(songJSON => {
        if(!actx) init();
        ChipPlayer.initExternal(actx, musicGain);
        ChipPlayer.load(songJSON);
        musicLoaded = true;
      })
      .catch(err => { console.warn('Music load failed:', err); });
  }

  function startMusic() {
    if(!musicLoaded || typeof ChipPlayer === 'undefined') return;
    ChipPlayer.play();
  }

  function stopMusic() {
    if(typeof ChipPlayer === 'undefined') return;
    ChipPlayer.stop();
    musicLoaded = false;
  }

  return { init, note, noise, weaponSound, hitSound, deathSound, gemSound, levelUpSound, bossWarning, heartbeat, damageTaken, dashSound, updateAmbient, toggleMute, setMusicVolume, getMusicGain, victoryFanfare, lootSound, overclockSound, bloodRitualSound, naturesVeilSound, singularityRiftSound, singularityCollapseSound, loadMusic, startMusic, stopMusic };
})();

// ============================================================
// SAVE MANAGER (localStorage + JSON export/import)
// ============================================================
const SaveManager = (() => {
  const STORAGE_KEY = 'survivors-save';
  const CURRENT_VERSION = 1;

  function defaultClassStats() {
    return { bestTime: 0, bestKills: 0, bestWave: 0, totalRuns: 0, totalKills: 0 };
  }

  function defaultState() {
    return {
      version: CURRENT_VERSION,
      gold: 0,
      skillPoints: 0,
      currentWorld: 0,
      inventory: [],
      equipped: [],
      inventorySlots: 6,
      skillTree: {},
      upgrades: {},
      stats: {
        totalKills: 0,
        bestTime: 0,
        runsCompleted: 0
      },
      classStats: {
        gunner: defaultClassStats(),
        darkknight: defaultClassStats(),
        ranger: defaultClassStats(),
        warlock: defaultClassStats()
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

  function migrateClassStats(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const result = {};
    const classIds = ['gunner', 'darkknight', 'ranger', 'warlock'];
    for (const cid of classIds) {
      const src = raw[cid];
      const def = defaultClassStats();
      if (src && typeof src === 'object') {
        result[cid] = {
          bestTime: typeof src.bestTime === 'number' ? src.bestTime : def.bestTime,
          bestKills: typeof src.bestKills === 'number' ? src.bestKills : def.bestKills,
          bestWave: typeof src.bestWave === 'number' ? src.bestWave : def.bestWave,
          totalRuns: typeof src.totalRuns === 'number' ? src.totalRuns : def.totalRuns,
          totalKills: typeof src.totalKills === 'number' ? src.totalKills : def.totalKills
        };
      } else {
        result[cid] = def;
      }
    }
    return result;
  }

  function migrate(data) {
    const base = defaultState();

    // Migrate classStats: if missing, seed gunner with existing global stats
    let classStats = migrateClassStats(data.classStats);
    if (!classStats) {
      classStats = {
        gunner: defaultClassStats(),
        darkknight: defaultClassStats(),
        ranger: defaultClassStats(),
        warlock: defaultClassStats()
      };
    }
    // If old save had global stats but no classStats, copy into gunner as default
    if (!data.classStats && data.stats) {
      const gs = classStats.gunner;
      if (data.stats.bestTime && data.stats.bestTime > gs.bestTime) gs.bestTime = data.stats.bestTime;
      if (data.stats.totalKills && data.stats.totalKills > gs.totalKills) gs.totalKills = data.stats.totalKills;
      if (data.stats.runsCompleted && data.stats.runsCompleted > gs.totalRuns) gs.totalRuns = data.stats.runsCompleted;
    }

    return {
      version: CURRENT_VERSION,
      gold: typeof data.gold === 'number' ? data.gold : base.gold,
      skillPoints: typeof data.skillPoints === 'number' ? data.skillPoints : base.skillPoints,
      currentWorld: typeof data.currentWorld === 'number' ? data.currentWorld : base.currentWorld,
      inventory: Array.isArray(data.inventory) ? data.inventory : base.inventory,
      equipped: Array.isArray(data.equipped) ? data.equipped.slice(0, 3) : base.equipped,
      inventorySlots: typeof data.inventorySlots === 'number' ? data.inventorySlots : base.inventorySlots,
      skillTree: data.skillTree && typeof data.skillTree === 'object' ? data.skillTree : base.skillTree,
      upgrades: data.upgrades && typeof data.upgrades === 'object' ? data.upgrades : base.upgrades,
      stats: {
        totalKills: (data.stats && typeof data.stats.totalKills === 'number') ? data.stats.totalKills : base.stats.totalKills,
        bestTime: (data.stats && typeof data.stats.bestTime === 'number') ? data.stats.bestTime : base.stats.bestTime,
        runsCompleted: (data.stats && typeof data.stats.runsCompleted === 'number') ? data.stats.runsCompleted : base.stats.runsCompleted
      },
      classStats: classStats
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
  function recordRun(runKills, runTime, earnedGold, classId, runWave) {
    const data = load();
    data.stats.totalKills += runKills;
    data.stats.runsCompleted += 1;
    if (runTime > data.stats.bestTime) {
      data.stats.bestTime = runTime;
    }
    if (typeof earnedGold === 'number' && earnedGold > 0) {
      data.gold += earnedGold;
    }
    // Per-class stats tracking
    if (classId && data.classStats && data.classStats[classId]) {
      const cs = data.classStats[classId];
      cs.totalRuns += 1;
      cs.totalKills += runKills;
      if (runTime > cs.bestTime) cs.bestTime = runTime;
      if (runKills > cs.bestKills) cs.bestKills = runKills;
      const wave = typeof runWave === 'number' ? runWave : 0;
      if (wave > cs.bestWave) cs.bestWave = wave;
    }
    save(data);
    return data;
  }

  const CLASS_NAMES = {
    gunner: 'Gunner',
    darkknight: 'Dark Knight',
    ranger: 'Ranger',
    warlock: 'Warlock'
  };

  return { save, load, exportJSON, importJSON, encodeURL, decodeURL, reset, recordRun, defaultState, CLASS_NAMES };
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
let signatureAbilityRequested = false;
window.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if(e.key === 'Escape') togglePause();
  if(e.key.toLowerCase() === 'i' && (state === 'playing' || state === 'paused')) {
    if(state === 'playing') togglePause();
    switchPauseTab('inventory');
  }
  if(e.key.toLowerCase() === 'k' && (state === 'playing' || state === 'paused')) {
    if(state === 'playing') togglePause();
    switchPauseTab('skills');
  }
  if(e.key.toLowerCase() === 'm') Audio.toggleMute();
  if(e.key.toLowerCase() === 'q' && state === 'playing') {
    signatureAbilityRequested = true;
  }
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
  () => ({ x:0, y:0, hp:0, maxHp:0, size:0, speed:0, type:null, xpValue:0, isBoss:false, isElite:false, spawnTime:0, hitFlash:0,
    movementType:'chase', movementState:null, attackTimer:0, attackPattern:null, shieldAngle:0 }),
  (e, x, y, type, isBoss) => {
    e.x = x; e.y = y;
    e.type = type;
    e.isBoss = isBoss || false;
    e.isElite = false;
    e._dead = false;
    // Steeper HP scaling: base 1.3x early, ramps faster over time
    const hpMult = 1.3 + gameTime / 80 + Math.pow(gameTime / 300, 1.5) * 0.5;
    e.hp = e.maxHp = isBoss ? type.hp * (1.3 + gameTime / 60) * 1.5 : type.hp * hpMult;
    e.size = type.size;
    // Early-game speed boost: enemies are 15% faster in the first 2 minutes
    const earlySpeedMult = gameTime < 120 ? 1.15 : 1.0;
    e.speed = type.speed * earlySpeedMult;
    e.xpValue = type.xp;
    e.spawnTime = gameTime;
    e.hitFlash = 0;
    e.movementType = type.movementType || 'chase';
    e.movementState = { timer: 0, phase: 'approach', dashAngle: 0, anchorX: 0, anchorY: 0, orbitAngle: 0, waitX: 0, waitY: 0, flankSide: Math.random() < 0.5 ? 1 : -1, targetX: 0, targetY: 0 };
    e.attackTimer = isBoss ? 3 + Math.random() * 2 : 0;
    e.attackPattern = type.attackPattern || null;
    e.shieldAngle = 0;
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

const SALVAGE_VALUES = { common: 5, rare: 15, epic: 40, legendary: 100 };

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

// Returns 'primary', 'secondary', or 'offclass' for a weapon type
function getWeaponAffinityTier(type) {
  const affinities = THEME.classConfig && THEME.classConfig.weaponAffinities;
  if (!affinities) return 'primary'; // No affinity data = treat all as primary
  if (affinities.primary && affinities.primary.includes(type)) return 'primary';
  if (affinities.secondary && affinities.secondary.includes(type)) return 'secondary';
  return 'offclass';
}

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
  // Apply class passive modifiers
  if (player.projSpeedMult && player.projSpeedMult !== 1 && stats.speed && (type === 'projectile' || type === 'boomerang')) {
    stats.speed *= player.projSpeedMult;
  }
  if (player.aoeSizeMult && player.aoeSizeMult !== 1 && stats.radius && (type === 'area' || type === 'field')) {
    stats.radius *= player.aoeSizeMult;
  }
  if (player.abilityPowerMult && player.abilityPowerMult !== 1 && stats.damage) {
    stats.damage *= player.abilityPowerMult;
  }
  if (player.cooldownMult && player.cooldownMult !== 1 && stats.cooldown) {
    stats.cooldown *= player.cooldownMult;
  }
  // Apply weapon affinity damage scaling
  const tier = getWeaponAffinityTier(type);
  if (stats.damage) {
    if (tier === 'primary') {
      stats.damage *= 1.25;
    } else if (tier === 'offclass') {
      stats.damage *= 0.75;
    }
    // secondary = 1.0x, no change
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
  const totalCount = stats.count + getEffectiveMultiProjectile();
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
    p.pierce += getEffectivePiercing();
    // Overclock: +2 extra pierce during signature ability
    if(player.sigAbility && player.sigAbility.active && player.classId === 'gunner') {
      p.pierce += 2;
    }
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
    // Visual arc from player to first target
    activeEffects.push({
      type:'chainLine', x1:player.x, y1:player.y, x2:first.x, y2:first.y,
      life: 0.15, maxLife: 0.15
    });
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

// Default beeline toward player (aggressive, with slight acceleration when close)
MOVEMENT_HANDLERS.chase = function(e, dt, player) {
  const dx = player.x - e.x;
  const dy = player.y - e.y;
  const d = Math.hypot(dx, dy);
  if(d > 5) {
    // Speed boost when close to player (within 150px) for more pressure
    const closeMult = d < 150 ? 1.2 : 1.0;
    e.x += (dx/d) * e.speed * closeMult * dt;
    e.y += (dy/d) * e.speed * closeMult * dt;
  }
};

// Circle player at ~150px, dash in frequently
MOVEMENT_HANDLERS.strafe = function(e, dt, player) {
  const dx = player.x - e.x;
  const dy = player.y - e.y;
  const d = Math.hypot(dx, dy);
  const ms = e.movementState;
  ms.timer -= dt;

  if(ms.phase === 'approach') {
    // Move toward strafe range (tighter than before)
    if(d > 170) {
      e.x += (dx/d) * e.speed * 1.1 * dt;
      e.y += (dy/d) * e.speed * 1.1 * dt;
    } else {
      ms.phase = 'circle';
      ms.orbitAngle = Math.atan2(e.y - player.y, e.x - player.x);
      ms.timer = 1.2 + Math.random() * 1.2;
    }
  } else if(ms.phase === 'circle') {
    // Orbit around player at ~150px (tighter, faster)
    ms.orbitAngle += e.speed / 150 * dt;
    const targetX = player.x + Math.cos(ms.orbitAngle) * 150;
    const targetY = player.y + Math.sin(ms.orbitAngle) * 150;
    e.x += (targetX - e.x) * 4 * dt;
    e.y += (targetY - e.y) * 4 * dt;
    if(ms.timer <= 0) {
      ms.phase = 'dash';
      ms.timer = 0.5;
    }
  } else if(ms.phase === 'dash') {
    // Dash toward player
    if(d > 5) {
      e.x += (dx/d) * e.speed * 2.8 * dt;
      e.y += (dy/d) * e.speed * 2.8 * dt;
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

// Spiral inward getting closer (aggressive spiral)
MOVEMENT_HANDLERS.orbit = function(e, dt, player) {
  const dx = player.x - e.x;
  const dy = player.y - e.y;
  const d = Math.hypot(dx, dy);
  const ms = e.movementState;

  if(ms.orbitAngle === 0) {
    ms.orbitAngle = Math.atan2(e.y - player.y, e.x - player.x);
  }

  // Spiral inward at a faster rate
  const orbitRadius = Math.max(25, d - 25 * dt);
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

// Move to player's flank/behind, then rush in from the side
MOVEMENT_HANDLERS.flanker = function(e, dt, player) {
  const dx = player.x - e.x;
  const dy = player.y - e.y;
  const d = Math.hypot(dx, dy);
  const ms = e.movementState;
  ms.timer -= dt;

  if(ms.phase === 'approach') {
    // Calculate a flanking position perpendicular to the player's facing direction
    const perpX = -player.lastDirY * ms.flankSide;
    const perpY = player.lastDirX * ms.flankSide;
    ms.targetX = player.x + perpX * 180 - player.lastDirX * 80;
    ms.targetY = player.y + perpY * 180 - player.lastDirY * 80;
    const tdx = ms.targetX - e.x;
    const tdy = ms.targetY - e.y;
    const td = Math.hypot(tdx, tdy);
    if(td > 40) {
      e.x += (tdx/td) * e.speed * 1.3 * dt;
      e.y += (tdy/td) * e.speed * 1.3 * dt;
    } else {
      ms.phase = 'circle';
      ms.timer = 0.5 + Math.random() * 0.5;
    }
    // If too far from player, just close distance
    if(d > 400) {
      e.x += (dx/d) * e.speed * 1.1 * dt;
      e.y += (dy/d) * e.speed * 1.1 * dt;
    }
  } else if(ms.phase === 'circle') {
    // Brief strafe around the flank position
    const perpX = -dy/d * ms.flankSide;
    const perpY = dx/d * ms.flankSide;
    e.x += perpX * e.speed * 0.8 * dt;
    e.y += perpY * e.speed * 0.8 * dt;
    if(ms.timer <= 0) {
      ms.phase = 'rush';
      ms.timer = 0.6;
      ms.dashAngle = Math.atan2(player.y - e.y, player.x - e.x);
    }
  } else if(ms.phase === 'rush') {
    // Burst toward player at high speed
    e.x += Math.cos(ms.dashAngle) * e.speed * 2.8 * dt;
    e.y += Math.sin(ms.dashAngle) * e.speed * 2.8 * dt;
    if(ms.timer <= 0) {
      ms.phase = 'approach';
      ms.timer = 0;
      ms.flankSide *= -1; // alternate sides
    }
  }
};

// Telegraph an AoE zone on the ground, pause, then crash down dealing area damage
MOVEMENT_HANDLERS.divebomber = function(e, dt, player) {
  const dx = player.x - e.x;
  const dy = player.y - e.y;
  const d = Math.hypot(dx, dy);
  const ms = e.movementState;
  ms.timer -= dt;

  if(ms.phase === 'approach') {
    // Fly toward player
    if(d > 200) {
      e.x += (dx/d) * e.speed * 1.2 * dt;
      e.y += (dy/d) * e.speed * 1.2 * dt;
    } else {
      ms.phase = 'telegraph';
      ms.timer = 1.2;
      // Lock target position (where player is now)
      ms.targetX = player.x;
      ms.targetY = player.y;
    }
  } else if(ms.phase === 'telegraph') {
    // Hover above target, slowing down (enemy rises visually via render)
    e.x += (ms.targetX - e.x) * 0.5 * dt;
    e.y += (ms.targetY - e.y) * 0.5 * dt;
    if(ms.timer <= 0) {
      ms.phase = 'dive';
      ms.timer = 0.2;
    }
  } else if(ms.phase === 'dive') {
    // Snap to target position
    e.x += (ms.targetX - e.x) * 15 * dt;
    e.y += (ms.targetY - e.y) * 15 * dt;
    if(ms.timer <= 0) {
      // Impact: spawn AoE damage effect
      const impactRadius = 60 + (e.isElite ? 20 : 0);
      const impactDmg = (8 + gameTime * 0.04) * (e.isElite ? 1.5 : 1) * getWorldDifficultyMult();
      activeEffects.push({
        type: 'divebomberImpact', x: e.x, y: e.y,
        radius: 0, maxRadius: impactRadius,
        damage: impactDmg, life: 0.4, maxLife: 0.4,
        hit: new Set()
      });
      spawnParticles(e.x, e.y, 10, e.type.color, 4);
      Audio.noise(0.15, 0.1);
      ms.phase = 'recover';
      ms.timer = 1.0;
    }
  } else if(ms.phase === 'recover') {
    // Sit still briefly after impact
    if(ms.timer <= 0) {
      ms.phase = 'approach';
      ms.timer = 0;
    }
  }
};

// Slow approach with a frontal shield that blocks projectiles from one direction
MOVEMENT_HANDLERS.shieldbearer = function(e, dt, player) {
  const dx = player.x - e.x;
  const dy = player.y - e.y;
  const d = Math.hypot(dx, dy);

  // Always face the player (shield direction)
  e.shieldAngle = Math.atan2(dy, dx);

  // Slow, relentless advance toward player
  if(d > 25) {
    e.x += (dx/d) * e.speed * dt;
    e.y += (dy/d) * e.speed * dt;
  }
};

// ============================================================
// BOSS ATTACK SYSTEM
// ============================================================
const BOSS_ATTACK_HANDLERS = {};

// Expanding damage ring — player must move out
BOSS_ATTACK_HANDLERS.shockwave = function(boss) {
  const powerMult = 1 + getPlayerPowerLevel() * 0.02;
  const dmg = (15 + gameTime * 0.05) * powerMult;
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
  const powerMult = 1 + getPlayerPowerLevel() * 0.02;
  const dmg = (15 + gameTime * 0.05) * powerMult;
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
  const powerMult = 1 + getPlayerPowerLevel() * 0.02;
  const dmg = (15 + gameTime * 0.05) * powerMult;
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
// STAT SOFT CAPS (applied at usage time, not storage time)
// ============================================================
const STAT_CAPS = {
  critChance: 0.60,       // 60% max crit chance
  lifesteal: 0.25,        // 25% max lifesteal
  multiProjectile: 3,     // +3 extra projectiles max
  piercing: 3             // +3 piercing max
};

function getEffectiveCritChance() {
  return Math.min(player.permCritChance || 0, STAT_CAPS.critChance);
}

function getEffectiveLifesteal() {
  return Math.min(player.permLifesteal || 0, STAT_CAPS.lifesteal);
}

function tryEvadeHit() {
  if (player.evasionChance > 0 && Math.random() < player.evasionChance) {
    // Show DODGE floating text and white particles
    spawnParticles(player.x, player.y - 15, 4, '#ffffff', 2);
    lootPickupTexts.push({ text: 'DODGE', rarity: 'rare', x: player.x, y: player.y - 20, life: 1.0, maxLife: 1.0 });
    return true; // hit was evaded
  }
  return false;
}

function getEffectiveMultiProjectile() {
  return player.permMultiProjectile ? Math.min(2, STAT_CAPS.multiProjectile) : 0;
}

function getEffectivePiercing() {
  return player.permPiercing ? Math.min(3, STAT_CAPS.piercing) : 0;
}

// ============================================================
// ENEMY / DAMAGE
// ============================================================
function damageEnemy(e, dmg) {
  if(e._dead) return;
  // Stealth ambush bonus: first attack from Nature's Veil deals 3x damage
  if(player.stealthActive && player.stealthAmbush) {
    dmg *= 3;
    player.stealthAmbush = false;
    spawnParticles(e.x, e.y, 10, '#ffff00', 4);
    lootPickupTexts.push({ text: 'AMBUSH! x3', rarity: 'legendary', x: e.x, y: e.y - 20, life: 1.0, maxLife: 1.0 });
    endStealth();
    // End the signature ability early
    if(player.sigAbility) {
      player.sigAbility.active = false;
      player.sigAbility.duration = 0;
    }
  }
  // Berserker bonus: extra damage when below HP threshold
  if(player.permBerserker && player.hp < player.maxHp * player.permBerserker.threshold) {
    dmg *= player.permBerserker.mult;
  }
  // Warlock: Mass Increase — pulled enemies take +25% damage
  if(player.permMassIncrease && e._pulled) {
    dmg *= 1.25;
  }
  // Permanent crit chance: crit damage on crit (base 2x, boosted by skill tree)
  const effectiveCrit = getEffectiveCritChance();
  if(effectiveCrit > 0 && Math.random() < effectiveCrit) {
    dmg *= 2 + (player.permCritDamage || 0);
    spawnParticles(e.x, e.y, 4, '#ffff00', 3); // yellow crit flash
  }
  e.hp -= dmg;
  e.hitFlash = 0.1;
  Audio.hitSound();
  spawnParticles(e.x, e.y, 2, '#ff4444', 2);
  // Permanent lifesteal: heal % of damage dealt (soft-capped)
  const effectiveLifesteal = getEffectiveLifesteal();
  if(effectiveLifesteal > 0) {
    player.hp = Math.min(player.hp + dmg * effectiveLifesteal, player.maxHp);
  }
  // Gunner: Headshot — kill enemies below 15% HP instantly
  if(player.permHeadshot && e.hp > 0 && e.hp < e.maxHp * 0.15 && !e.isBoss) {
    e.hp = 0;
    spawnParticles(e.x, e.y, 6, '#ff0000', 4);
  }
  // Ranger: Poison DoT application
  if(player.permPoison && !e._poisoned) {
    e._poisoned = true;
    e._poisonTimer = 3;
    e._poisonDps = 3 * (player.abilityPowerMult || 1);
  }
  // Ranger: Root Snare — 25% chance to slow 50% for 2s
  if(player.permRootSnare && Math.random() < 0.25) {
    e._rootedUntil = gameTime + 2;
  }
  // Gunner: EMP Burst — 10% chance to stun all nearby enemies 1s
  if(player.permEmpBurst && Math.random() < 0.10) {
    const empNearby = enemyHash.query(e.x, e.y, 100);
    for(const en of empNearby) {
      en._rootedUntil = Math.max(en._rootedUntil || 0, gameTime + 1);
    }
    spawnParticles(e.x, e.y, 8, '#44aaff', 3);
    Audio.note(1200, 0.1, 'square', 0.04);
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

  // --- Class skill on-kill effects ---
  // Gunner: Overdrive — kill streaks grant 2x fire rate for 3s
  if(player.permOverdrive) {
    player.overdriveKills = (player.overdriveKills || 0) + 1;
    if(player.overdriveKills >= 3) {
      player.overdriveTimer = 3;
      player.overdriveKills = 0;
    }
  }
  // Dark Knight: Blood Frenzy — +15% attack speed on kill for 3s
  if(player.permBloodFrenzy) {
    player.bloodFrenzyTimer = 3;
  }
  // Ranger: Virulent — poison spreads to nearby on death
  if(player.permVirulent && e._poisoned) {
    const spreadNearby = enemyHash.query(e.x, e.y, 80);
    for(const en of spreadNearby) {
      if(!en._poisoned && !en._dead) {
        en._poisoned = true;
        en._poisonTimer = 3;
        en._poisonDps = 3 * (player.abilityPowerMult || 1);
      }
    }
    spawnParticles(e.x, e.y, 6, '#27ae60', 3);
  }
  // Ranger: Overgrowth — poisoned enemies leave toxic ground on death
  if(player.permOvergrowth && e._poisoned) {
    activeEffects.push({
      type: 'field', x: e.x, y: e.y,
      radius: 50, damage: player.damage * 1.5 * (player.abilityPowerMult || 1),
      life: 4, maxLife: 4, tickTimer: 0
    });
    spawnParticles(e.x, e.y, 8, '#27ae60', 3);
  }
  // --- End class skill on-kill effects ---

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

// Cached difficulty values (refreshed once per run at start, and on spawn)
let _cachedPowerLevel = 0;
let _cachedWorldDiffMult = 1;
let _diffCacheDirty = true;

function _refreshDifficultyCache() {
  const saveData = SaveManager.load();
  const upgradeCount = Object.keys(saveData.upgrades || {}).length;
  const skillCount = Object.keys(saveData.skillTree || {}).filter(k => saveData.skillTree[k]).length;
  const equippedCount = (saveData.equipped || []).length;
  _cachedPowerLevel = upgradeCount + skillCount + equippedCount;
  const world = saveData.currentWorld || 0;
  // Each completed world adds 12% to enemy stats
  _cachedWorldDiffMult = 1 + world * 0.12;
  _diffCacheDirty = false;
}

// Count total permanent upgrades the player owns (for scaling enemies)
function getPlayerPowerLevel() {
  if(_diffCacheDirty) _refreshDifficultyCache();
  return _cachedPowerLevel;
}

// Get world difficulty multiplier (scales with completed worlds for NG+ feel)
function getWorldDifficultyMult() {
  if(_diffCacheDirty) _refreshDifficultyCache();
  return _cachedWorldDiffMult;
}

function spawnEnemy() {
  const available = THEME.enemies.filter(e => gameTime >= e.spawnAfter);
  if(available.length === 0) return;
  const type = available[Math.random()*available.length|0];
  const angle = Math.random() * Math.PI * 2;
  const dist = Math.max(W, H) * 0.6 + Math.random() * 100;
  const x = player.x + Math.cos(angle) * dist;
  const y = player.y + Math.sin(angle) * dist;
  const e = enemies.get(x, y, type, false);

  // --- Difficulty scaling ---
  const powerLevel = getPlayerPowerLevel();
  const worldMult = getWorldDifficultyMult();
  // Player power scaling: each upgrade adds 3% to enemy HP
  const powerHpMult = 1 + powerLevel * 0.03;

  // Apply HP scaling: steeper time curve + player power + world difficulty
  e.hp *= powerHpMult * worldMult;
  e.maxHp *= powerHpMult * worldMult;

  // Speed scaling: after 5 minutes, enemies get progressively faster
  if(gameTime > 300) {
    const speedBoost = 1 + Math.min(0.4, (gameTime - 300) / 600);
    e.speed *= speedBoost * worldMult;
  } else {
    e.speed *= worldMult;
  }

  // Elite variant: after 3 minutes, increasing chance to spawn as elite
  // Elites have +60% HP, +25% speed, +30% size, and a glow effect
  if(gameTime >= 180) {
    const eliteChance = Math.min(0.35, 0.05 + (gameTime - 180) / 600);
    if(Math.random() < eliteChance) {
      e.isElite = true;
      e.hp *= 1.6;
      e.maxHp *= 1.6;
      e.speed *= 1.25;
      e.size = Math.round(e.size * 1.3);
      e.xpValue = Math.round(e.xpValue * 2);
    }
  }
}

function spawnBoss() {
  if(bossIdx >= THEME.bosses.length) return;
  const type = THEME.bosses[bossIdx];
  Audio.bossWarning();
  const angle = Math.random() * Math.PI * 2;
  const dist = Math.max(W, H) * 0.5;
  const boss = enemies.get(
    player.x + Math.cos(angle)*dist,
    player.y + Math.sin(angle)*dist,
    type, true
  );

  // Boss scaling with player power level and world difficulty
  const powerLevel = getPlayerPowerLevel();
  const worldMult = getWorldDifficultyMult();
  // Boss HP scales with player power (5% per upgrade) and world
  const bossHpMult = (1 + powerLevel * 0.05) * worldMult;
  boss.hp *= bossHpMult;
  boss.maxHp *= bossHpMult;
  // Boss speed scales more gently (2% per upgrade)
  boss.speed *= (1 + powerLevel * 0.02) * worldMult;

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
    // Award 1 skill point every 5 in-run levels
    if (playerLevel % 5 === 0) {
      const sd = SaveManager.load();
      sd.skillPoints = (sd.skillPoints || 0) + 1;
      SaveManager.save(sd);
    }
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
    // Apply affinity tier styling if present
    if (opt.affinityTier) {
      card.classList.add('affinity-' + opt.affinityTier);
    }
    let tierHTML = '';
    if (opt.tierTag) {
      const tierClass = opt.affinityTier === 'primary' ? 'affinity-tag-primary' : opt.affinityTier === 'secondary' ? 'affinity-tag-secondary' : 'affinity-tag-offclass';
      tierHTML = `<div class="affinity-tag ${tierClass}">${opt.tierTag}</div>`;
    }
    card.innerHTML = `<div class="upgrade-hotkey">${i+1}</div>${tierHTML}<div class="upgrade-icon">${opt.icon}</div><div class="upgrade-name">${opt.name}</div><div class="upgrade-desc">${opt.desc}</div>`;
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

// Weighted random pick from weapon array based on affinity tier
function weightedWeaponPick(weaponList) {
  const AFFINITY_WEIGHTS = { primary: 3, secondary: 1.5, offclass: 0.5 };
  let totalWeight = 0;
  const weights = weaponList.map(w => {
    const tier = getWeaponAffinityTier(w.type);
    const weight = AFFINITY_WEIGHTS[tier] || 1;
    totalWeight += weight;
    return weight;
  });
  let roll = Math.random() * totalWeight;
  for (let i = 0; i < weaponList.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return weaponList[i];
  }
  return weaponList[weaponList.length - 1];
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
    const tier = getWeaponAffinityTier(w.type);
    const tierTag = tier === 'primary' ? '\u2605 Primary' : tier === 'secondary' ? 'Secondary' : 'Off-class';
    const tierBonus = tier === 'primary' ? ' (+25% class bonus)' : tier === 'offclass' ? ' (-25% off-class)' : '';
    options.push({
      icon: def.icon, name: `${def.name} Lv${w.level+1}`,
      desc: `Upgrade ${def.name}${tierBonus}`,
      affinityTier: tier,
      tierTag: tierTag,
      apply: () => { w.level++; }
    });
  }

  // Option: new weapon (weighted by affinity tier)
  const unowned = allWeapons.filter(w => !ownedTypes.includes(w.type));
  if(unowned.length > 0 && player.weapons.length < 6) {
    const w = weightedWeaponPick(unowned);
    const tier = getWeaponAffinityTier(w.type);
    const tierTag = tier === 'primary' ? '\u2605 Primary' : tier === 'secondary' ? 'Secondary' : 'Off-class';
    const tierBonus = tier === 'primary' ? ' (+25% class bonus)' : tier === 'offclass' ? ' (-25% off-class)' : '';
    options.push({
      icon: w.icon, name: w.name,
      desc: w.desc + tierBonus,
      affinityTier: tier,
      tierTag: tierTag,
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
    // Add affinity tier indicator
    const tier = getWeaponAffinityTier(w.type);
    slot.classList.add('weapon-affinity-' + tier);
    slot.textContent = def ? def.icon : '?';
    const tierLabel = tier === 'primary' ? 'Primary (+25%)' : tier === 'secondary' ? 'Secondary' : 'Off-class (-25%)';
    slot.title = def ? `${def.name} Lv${w.level} [${tierLabel}]` : '';
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
  const baseDashCooldown = 1.6;
  // Cap total dash cooldown reduction at 50% from all sources combined
  const cappedDashReduction = Math.min(player.dashCooldownReduction || 0, 0.50);
  const DASH_COOLDOWN = baseDashCooldown * (1 - cappedDashReduction);
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
    // Warlock: Time Bubble — leave slow field on dash
    if(player.permTimeBubble) {
      activeEffects.push({
        type: 'field', x: player.x, y: player.y,
        radius: 80, damage: 0,
        life: 3, maxLife: 3, tickTimer: 0,
        isTimeBubble: true
      });
      // Slow enemies in the bubble zone
      const bubbleNearby = enemyHash.query(player.x, player.y, 100);
      for(const be of bubbleNearby) {
        be._rootedUntil = Math.max(be._rootedUntil || 0, gameTime + 3);
      }
      spawnParticles(player.x, player.y, 8, '#3498db', 3);
    }
    // Ranger: Phantom Step — leave decoy that draws enemies for 3s
    if(player.permPhantomStep) {
      player.decoys.push({ x: player.x, y: player.y, life: 3 });
      spawnParticles(player.x, player.y, 6, '#2ecc71', 3);
    }
    Audio.dashSound();
  }
  dashRequested = false;

  // ---- SIGNATURE CLASS ABILITY ----
  if(signatureAbilityRequested && player.sigAbility.cooldown <= 0 && !player.sigAbility.active) {
    activateSignatureAbility();
  }
  signatureAbilityRequested = false;
  updateSignatureAbility(dt);
  // ---- END SIGNATURE CLASS ABILITY ----

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

  // ---- CLASS SKILL RUNTIME LOGIC ----

  // Gunner: Overdrive timer decay
  if(player.permOverdrive && player.overdriveTimer > 0) {
    player.overdriveTimer -= dt;
  }

  // Gunner: Auto-Turret (deploy every 30s)
  if(player.permAutoTurret) {
    player.turretTimer = (player.turretTimer || 0) + dt;
    if(player.turretTimer >= 30) {
      player.turretTimer -= 30;
      player.turrets.push({ x: player.x, y: player.y, life: 15, fireTimer: 0 });
    }
    // Update turrets
    for(let ti = player.turrets.length - 1; ti >= 0; ti--) {
      const t = player.turrets[ti];
      t.life -= dt;
      if(t.life <= 0) { player.turrets.splice(ti, 1); continue; }
      t.fireTimer -= dt;
      if(t.fireTimer <= 0 && enemies.count > 0) {
        t.fireTimer = 0.5;
        let nearest = null, minD = 300;
        enemies.forEach(e => {
          const d = Math.hypot(e.x - t.x, e.y - t.y);
          if(d < minD) { minD = d; nearest = e; }
        });
        if(nearest) {
          const dx = nearest.x - t.x, dy = nearest.y - t.y;
          const d = Math.hypot(dx, dy);
          projectiles.get(t.x, t.y, (dx/d)*400, (dy/d)*400, player.damage * 0.8, 1.0, 'projectile', 1);
        }
      }
    }
  }

  // Gunner: Drone (orbiting shooter)
  if(player.permDrone) {
    player.droneAngle = (player.droneAngle || 0) + dt * 2.5;
    player.droneFireTimer = (player.droneFireTimer || 0) - dt;
    if(player.droneFireTimer <= 0 && enemies.count > 0) {
      player.droneFireTimer = 0.8;
      const droneX = player.x + Math.cos(player.droneAngle) * 50;
      const droneY = player.y + Math.sin(player.droneAngle) * 50;
      let nearest = null, minD = 250;
      enemies.forEach(e => {
        const d = Math.hypot(e.x - droneX, e.y - droneY);
        if(d < minD) { minD = d; nearest = e; }
      });
      if(nearest) {
        const dx = nearest.x - droneX, dy = nearest.y - droneY;
        const d = Math.hypot(dx, dy);
        projectiles.get(droneX, droneY, (dx/d)*350, (dy/d)*350, player.damage * 0.5, 0.8, 'projectile', 1);
      }
    }
  }

  // Dark Knight: Blood Frenzy timer decay
  if(player.permBloodFrenzy && player.bloodFrenzyTimer > 0) {
    player.bloodFrenzyTimer -= dt;
  }

  // Dark Knight: Death Aura (constant 3/s AoE damage around player)
  if(player.permDeathAura) {
    const auraRadius = 80;
    const auraDps = 3 * player.damage * (player.abilityPowerMult || 1);
    const nearby = enemyHash.query(player.x, player.y, auraRadius + 30);
    for(const e of nearby) {
      const d = Math.hypot(e.x - player.x, e.y - player.y);
      if(d < auraRadius + e.size) {
        damageEnemy(e, auraDps * dt);
      }
    }
  }

  // Dark Knight: Skeletons (summon allies)
  if(player.permSkeletons > 0) {
    // Maintain skeleton count
    while(player.skeletons.length < player.permSkeletons) {
      const angle = Math.random() * Math.PI * 2;
      player.skeletons.push({
        x: player.x + Math.cos(angle) * 60,
        y: player.y + Math.sin(angle) * 60,
        hp: 30, speed: 120, attackTimer: 0, shootTimer: 0
      });
    }
    for(let si = player.skeletons.length - 1; si >= 0; si--) {
      const sk = player.skeletons[si];
      // Chase nearest enemy
      let nearest = null, minD = 300;
      enemies.forEach(e => {
        const d = Math.hypot(e.x - sk.x, e.y - sk.y);
        if(d < minD) { minD = d; nearest = e; }
      });
      if(nearest) {
        const dx = nearest.x - sk.x, dy = nearest.y - sk.y;
        const d = Math.hypot(dx, dy);
        if(d > 20) {
          sk.x += (dx/d) * sk.speed * dt;
          sk.y += (dy/d) * sk.speed * dt;
        }
        // Melee attack on contact
        if(d < 25) {
          sk.attackTimer -= dt;
          if(sk.attackTimer <= 0) {
            sk.attackTimer = 0.8;
            damageEnemy(nearest, player.damage * 0.6);
          }
        }
        // Skeleton Mage: ranged attacks
        if(player.permSkeletonMage) {
          sk.shootTimer = (sk.shootTimer || 0) - dt;
          if(sk.shootTimer <= 0 && d < 200 && d > 30) {
            sk.shootTimer = 1.5;
            projectiles.get(sk.x, sk.y, (dx/d)*250, (dy/d)*250, player.damage * 0.4, 0.8, 'projectile', 1);
          }
        }
      } else {
        // Follow player if no enemies
        const dx = player.x - sk.x, dy = player.y - sk.y;
        const d = Math.hypot(dx, dy);
        if(d > 80) {
          sk.x += (dx/d) * sk.speed * dt;
          sk.y += (dy/d) * sk.speed * dt;
        }
      }
    }
  }

  // Dark Knight: Army of Darkness (mass summon every 45s)
  if(player.permArmyOfDarkness) {
    player.armyTimer = (player.armyTimer || 0) + dt;
    if(player.armyTimer >= 45) {
      player.armyTimer -= 45;
      for(let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        player.skeletons.push({
          x: player.x + Math.cos(angle) * 40,
          y: player.y + Math.sin(angle) * 40,
          hp: 20, speed: 140, attackTimer: 0, shootTimer: 0,
          tempLife: 10 // temporary skeletons
        });
      }
      spawnParticles(player.x, player.y, 15, '#8e44ad', 4);
      Audio.levelUpSound();
    }
    // Decay temporary skeletons
    for(let si = player.skeletons.length - 1; si >= 0; si--) {
      const sk = player.skeletons[si];
      if(sk.tempLife !== undefined) {
        sk.tempLife -= dt;
        if(sk.tempLife <= 0) { player.skeletons.splice(si, 1); }
      }
    }
  }

  // Dark Knight: Fortify (standing still 2s grants +25% defense)
  if(player.permFortify) {
    const isMoving = mlen > 0.1 || player.dashTimer > 0;
    if(!isMoving) {
      player.fortifyStillTimer = (player.fortifyStillTimer || 0) + dt;
      if(player.fortifyStillTimer >= 2 && !player.fortifyActive) {
        player.fortifyActive = true;
        spawnParticles(player.x, player.y, 8, '#2c3e50', 3);
      }
    } else {
      player.fortifyStillTimer = 0;
      player.fortifyActive = false;
    }
  }

  // Ranger: Traps (auto-place every 15s)
  if(player.permTraps > 0) {
    player.trapTimer = (player.trapTimer || 0) + dt;
    if(player.trapTimer >= 15 && player.traps.length < player.permTraps) {
      player.trapTimer -= 15;
      player.traps.push({ x: player.x, y: player.y, life: 30, triggered: false });
    }
    // Update traps
    for(let ti = player.traps.length - 1; ti >= 0; ti--) {
      const trap = player.traps[ti];
      trap.life -= dt;
      if(trap.life <= 0 || trap.triggered) { player.traps.splice(ti, 1); continue; }
      // Check enemy collision
      const nearby = enemyHash.query(trap.x, trap.y, 30);
      for(const e of nearby) {
        const d = Math.hypot(e.x - trap.x, e.y - trap.y);
        if(d < 25) {
          trap.triggered = true;
          const trapDmg = player.damage * 3 * (player.permTrapMastery ? 1.5 : 1);
          damageEnemy(e, trapDmg);
          // Root: slow nearby enemies
          const rootNearby = enemyHash.query(trap.x, trap.y, 60);
          for(const re of rootNearby) {
            re._rootedUntil = gameTime + 2;
          }
          spawnParticles(trap.x, trap.y, 10, '#d35400', 3);
          Audio.note(200, 0.2, 'sine', 0.08);
          break;
        }
      }
    }
  }

  // Ranger: Net Launcher (AoE slow every 20s)
  if(player.permNetLauncher) {
    player.netTimer = (player.netTimer || 0) + dt;
    if(player.netTimer >= 20) {
      player.netTimer -= 20;
      const netRadius = 150;
      const nearby = enemyHash.query(player.x, player.y, netRadius + 30);
      for(const e of nearby) {
        const d = Math.hypot(e.x - player.x, e.y - player.y);
        if(d < netRadius) {
          e._rootedUntil = gameTime + 3;
        }
      }
      spawnParticles(player.x, player.y, 12, '#d35400', 3);
      Audio.note(150, 0.3, 'triangle', 0.06);
    }
  }

  // Ranger: Decoy updates (from Phantom Step)
  for(let di = player.decoys.length - 1; di >= 0; di--) {
    const dec = player.decoys[di];
    dec.life -= dt;
    if(dec.life <= 0) { player.decoys.splice(di, 1); }
  }

  // Warlock: Pull Aura (nearby enemies slowly pulled toward player)
  if(player.permPullAura) {
    const pullRadius = 120;
    const pullStr = 40;
    const nearby = enemyHash.query(player.x, player.y, pullRadius + 30);
    for(const e of nearby) {
      const dx = player.x - e.x, dy = player.y - e.y;
      const d = Math.hypot(dx, dy);
      if(d < pullRadius && d > 20) {
        e.x += (dx/d) * pullStr * dt;
        e.y += (dy/d) * pullStr * dt;
        e._pulled = true;
      }
    }
  }

  // Warlock: Gravity Well (every 25s, vortex pulls enemies)
  if(player.permGravityWell) {
    player.gravityWellTimer = (player.gravityWellTimer || 0) + dt;
    if(player.gravityWellTimer >= 25) {
      player.gravityWellTimer -= 25;
      // Create a gravity well effect at player position
      activeEffects.push({
        type: 'field', x: player.x, y: player.y,
        radius: 200, damage: player.damage * 0.5 * (player.abilityPowerMult || 1),
        life: 3, maxLife: 3, tickTimer: 0,
        isGravityWell: true
      });
      spawnParticles(player.x, player.y, 15, '#9b59b6', 4);
    }
  }

  // Warlock: Black Hole (massive pull + damage every 60s)
  if(player.permBlackHole) {
    player.blackHoleTimer = (player.blackHoleTimer || 0) + dt;
    if(player.blackHoleTimer >= 60) {
      player.blackHoleTimer -= 60;
      const bhRadius = 250;
      const nearby = enemyHash.query(player.x, player.y, bhRadius + 50);
      for(const e of nearby) {
        const dx = player.x - e.x, dy = player.y - e.y;
        const d = Math.hypot(dx, dy);
        if(d < bhRadius) {
          // Teleport enemies inward and damage
          e.x += (dx/d) * Math.min(d * 0.7, 150);
          e.y += (dy/d) * Math.min(d * 0.7, 150);
          e._pulled = true;
          damageEnemy(e, player.damage * 5 * (player.abilityPowerMult || 1));
        }
      }
      spawnParticles(player.x, player.y, 25, '#6c3483', 6);
      Audio.note(80, 0.5, 'sawtooth', 0.1);
    }
  }

  // Warlock: Void Bolt (periodic magic projectile every 3s)
  if(player.permVoidBolt) {
    player.voidBoltTimer = (player.voidBoltTimer || 0) + dt;
    if(player.voidBoltTimer >= 3 && enemies.count > 0) {
      player.voidBoltTimer -= 3;
      let nearest = null, minD = 400;
      enemies.forEach(e => {
        const d = Math.hypot(e.x - player.x, e.y - player.y);
        if(d < minD) { minD = d; nearest = e; }
      });
      if(nearest) {
        const dx = nearest.x - player.x, dy = nearest.y - player.y;
        const d = Math.hypot(dx, dy);
        projectiles.get(player.x, player.y, (dx/d)*300, (dy/d)*300,
          player.damage * 2 * (player.abilityPowerMult || 1), 1.2, 'projectile', 2);
        spawnParticles(player.x, player.y, 4, '#e74c3c', 3);
      }
    }
  }

  // Warlock: Singularity (massive AoE every 45s)
  if(player.permSingularity) {
    player.singularityTimer = (player.singularityTimer || 0) + dt;
    if(player.singularityTimer >= 45) {
      player.singularityTimer -= 45;
      activeEffects.push({
        type: 'area', x: player.x, y: player.y,
        radius: 0, maxRadius: 250,
        damage: player.damage * 8 * (player.abilityPowerMult || 1),
        life: 0.6, maxLife: 0.6, hit: new Set()
      });
      spawnParticles(player.x, player.y, 20, '#e74c3c', 5);
      Audio.note(100, 0.4, 'sawtooth', 0.08);
    }
  }

  // Warlock: Rewind HP logging (track last 5s of HP for rewind skill)
  if(player.permRewind && !player.rewindUsed) {
    player.rewindHpLog.push({ time: gameTime, hp: player.hp });
    // Keep only last 5 seconds
    while(player.rewindHpLog.length > 0 && player.rewindHpLog[0].time < gameTime - 5) {
      player.rewindHpLog.shift();
    }
  }

  // ---- END CLASS SKILL RUNTIME LOGIC ----

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
  // Compute fire rate multipliers from class skills
  const overdriveFireMult = (player.permOverdrive && player.overdriveTimer > 0) ? 0.5 : 1.0;
  const frenzyFireMult = (player.permBloodFrenzy && player.bloodFrenzyTimer > 0) ? 0.85 : 1.0;
  // Signature ability: Overclock gives 2x fire rate (0.5 cooldown mult)
  const overclockFireMult = (player.sigAbility && player.sigAbility.active && player.classId === 'gunner') ? 0.5 : 1.0;
  for(const w of player.weapons) {
    if(w.type === 'orbit') continue; // continuous
    if(!weaponTimers[w.type]) weaponTimers[w.type] = 0;
    if(!hasEnemies) continue; // hold cooldowns until first spawn
    weaponTimers[w.type] -= dt;
    if(weaponTimers[w.type] <= 0) {
      const stats = getWeaponStats(w.type, w.level);
      let cd = stats.cooldown * overdriveFireMult * frenzyFireMult * overclockFireMult * (player.cooldownMult || 1);
      // Warlock: Temporal Loop — 15% chance to not consume cooldown
      if(player.permTemporalLoop && Math.random() < 0.15) cd = 0.05;
      weaponTimers[w.type] = cd;
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
        // Shield-bearer: block projectiles hitting the front (shield side)
        if(e.movementType === 'shieldbearer' && !e.isBoss) {
          const projAngle = Math.atan2(p.y - e.y, p.x - e.x);
          const angleDiff = Math.abs(((projAngle - e.shieldAngle + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
          if(angleDiff > Math.PI * 0.55) {
            // Projectile hit the shield — deflect it
            spawnParticles(p.x, p.y, 3, '#ffffff', 2);
            Audio.note(800, 0.05, 'square', 0.04);
            p.pierce--;
            if(p.pierce <= 0) { projectiles.release(p); return; }
            continue;
          }
        }
        damageEnemy(e, p.damage);
        p.pierce--;
        if(p.pierce <= 0) {
          // Gunner: Explosive Rounds — explode on final hit
          if(player.permExplosiveRounds && p.weaponType === 'projectile') {
            activeEffects.push({
              type: 'area', x: p.x, y: p.y,
              radius: 0, maxRadius: 60,
              damage: p.damage * 0.5,
              life: 0.3, maxLife: 0.3, hit: new Set()
            });
            spawnParticles(p.x, p.y, 8, '#f39c12', 3);
            Audio.note(200, 0.15, 'sine', 0.06);
          }
          projectiles.release(p); return;
        }
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
    } else if(ef.type === 'divebomberImpact') {
      ef.radius = ef.maxRadius * (1 - ef.life/ef.maxLife);
      // Damage player if caught in AoE
      const pd = Math.hypot(player.x - ef.x, player.y - ef.y);
      if(pd <= ef.radius && player.invulnTime <= 0 && !ef.hit.has('player')) {
        ef.hit.add('player');
        if (tryEvadeHit()) { player.invulnTime = 0.2; } else {
        const dmg = ef.damage * player.defense;
        player.hp -= dmg;
        player.invulnTime = 0.5;
        damageFlash = 0.15;
        screenShake = 0.1;
        Audio.damageTaken();
        if(player.hp <= 0) gameOver();
        }
      }
    } else if(ef.type === 'bossShockwave') {
      ef.radius = ef.maxRadius * (1 - ef.life/ef.maxLife);
      // Damage player if in ring zone
      const pd = Math.hypot(player.x - ef.x, player.y - ef.y);
      const ringInner = Math.max(0, ef.radius - 30);
      if(pd >= ringInner && pd <= ef.radius && player.invulnTime <= 0 && !ef.hit.has('player')) {
        ef.hit.add('player');
        if (tryEvadeHit()) { player.invulnTime = 0.2; } else {
        const dmg = ef.damage * player.defense;
        player.hp -= dmg;
        player.invulnTime = 0.5;
        damageFlash = 0.15;
        screenShake = 0.15;
        Audio.damageTaken();
        if(player.hp <= 0) gameOver();
        }
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
              if (tryEvadeHit()) { player.invulnTime = 0.2; } else {
              const dmg = ef.damage * player.defense;
              player.hp -= dmg;
              player.invulnTime = 0.5;
              damageFlash = 0.15;
              screenShake = 0.2;
              Audio.damageTaken();
              if(player.hp <= 0) gameOver();
              }
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
            if (tryEvadeHit()) { player.invulnTime = 0.2; } else {
            const dmg = ef.damage * player.defense;
            player.hp -= dmg;
            player.invulnTime = 0.5;
            damageFlash = 0.15;
            screenShake = 0.1;
            Audio.damageTaken();
            if(player.hp <= 0) gameOver();
            }
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
    // Poison DoT processing
    if(e._poisoned && e._poisonTimer > 0) {
      e._poisonTimer -= dt;
      e.hp -= (e._poisonDps || 3) * dt;
      if(e._poisonTimer <= 0) e._poisoned = false;
      if(e.hp <= 0 && !e._dead) { killEnemy(e); return; }
    }

    // Rooted/slowed enemies: reduce movement
    const isRooted = e._rootedUntil && gameTime < e._rootedUntil;
    const rootSpeedMult = isRooted ? 0.5 : 1.0;

    // Decoy attraction: if decoys exist, chase nearest decoy instead of player
    let targetX = player.x, targetY = player.y;
    if(player.decoys && player.decoys.length > 0 && !e.isBoss) {
      let minDD = Infinity;
      for(const dec of player.decoys) {
        const dd = Math.hypot(dec.x - e.x, dec.y - e.y);
        if(dd < minDD && dd < 200) { minDD = dd; targetX = dec.x; targetY = dec.y; }
      }
    }

    // Movement dispatch (with speed modifier for root/slow)
    const origSpeed = e.speed;
    e.speed *= rootSpeedMult;
    // Stealth: enemies wander randomly when player is invisible
    if(player.stealthActive && !e.isBoss) {
      // Random wander
      if(!e._wanderAngle || Math.random() < 0.02) {
        e._wanderAngle = Math.random() * Math.PI * 2;
      }
      e.x += Math.cos(e._wanderAngle) * e.speed * 0.4 * dt;
      e.y += Math.sin(e._wanderAngle) * e.speed * 0.4 * dt;
    } else {
      const handler = MOVEMENT_HANDLERS[e.movementType] || MOVEMENT_HANDLERS.chase;
      handler(e, dt, player);
    }
    e.speed = origSpeed;

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
      if (tryEvadeHit()) { player.invulnTime = 0.2; } else {
      const contactWorldMult = getWorldDifficultyMult();
      const fortifyMult = (player.permFortify && player.fortifyActive) ? 0.75 : 1.0;
      const dmg = (e.isBoss ? 15 + gameTime * 0.05 : 5 + gameTime*0.02) * player.defense * contactWorldMult * fortifyMult;
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
      } // end evasion else
    }
  });

  // Dark Knight: Vampiric Nova — when dropping below 30% HP, heal burst + damage wave
  if(player.permVampiricNova && !player.vampiricNovaUsed && player.hp > 0 && player.hp < player.maxHp * 0.3) {
    player.vampiricNovaUsed = true;
    const healAmt = Math.floor(player.maxHp * 0.25);
    player.hp = Math.min(player.hp + healAmt, player.maxHp);
    player.invulnTime = 1.5;
    // Damage wave
    const novaDmg = player.damage * 5 * (player.abilityPowerMult || 1);
    const novaRadius = 150;
    const novaNearby = enemyHash.query(player.x, player.y, novaRadius);
    for(const ne of novaNearby) {
      const nd = Math.hypot(ne.x - player.x, ne.y - player.y);
      if(nd < novaRadius) damageEnemy(ne, novaDmg);
    }
    spawnParticles(player.x, player.y, 20, '#c0392b', 5);
    Audio.levelUpSound();
    lootPickupTexts.push({ text: 'VAMPIRIC NOVA!', rarity: 'legendary', x: player.x, y: player.y - 30, life: 2.0, maxLife: 2.0 });
  }

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
      if(!saveData.equipped) saveData.equipped = [];
      const maxSlots = saveData.inventorySlots || 6;
      // Count unique items in inventory (stacks count as 1 slot each)
      const uniqueInv = {};
      saveData.inventory.forEach(id => { uniqueInv[id] = true; });
      const usedSlots = Object.keys(uniqueInv).length;
      // Check if item already exists in inventory (stacks into existing slot)
      const alreadyInInventory = saveData.inventory.indexOf(d.item.id) !== -1;

      if(saveData.equipped.length < 3) {
        // Auto-equip if fewer than 3 equipped
        saveData.inventory.push(d.item.id);
        saveData.equipped.push(d.item.id);
      } else if(alreadyInInventory || usedSlots < maxSlots) {
        // Add to inventory (stacks or new slot available)
        saveData.inventory.push(d.item.id);
      } else {
        // Inventory full: auto-salvage for gold
        const salvageGold = SALVAGE_VALUES[d.item.rarity] || 5;
        saveData.gold += salvageGold;
        runGold += salvageGold;
        lootPickupTexts.push({ text: 'Salvaged +' + salvageGold + 'g', rarity: d.item.rarity, x: d.x, y: d.y - 16, life: 1.5, maxLife: 1.5 });
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

EFFECT_RENDERERS.divebomberImpact = function(ctx, ef) {
  const alpha = ef.life / ef.maxLife;
  ctx.save();
  ctx.strokeStyle = `rgba(255,120,30,${alpha * 0.8})`;
  ctx.lineWidth = 3 + (1 - alpha) * 4;
  ctx.shadowColor = '#ff6600';
  ctx.shadowBlur = 12;
  ctx.beginPath(); ctx.arc(ef.x, ef.y, ef.radius, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = `rgba(255,80,20,${alpha * 0.25})`;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
};

EFFECT_RENDERERS.bloodRitualRing = function(ctx, ef) {
  const progress = 1 - ef.life / ef.maxLife;
  const alpha = ef.life / ef.maxLife;
  const r = ef.maxRadius * progress;
  ctx.save();
  // Multiple expanding rings
  for(let ring = 0; ring < 3; ring++) {
    const ringR = r * (0.5 + ring * 0.25);
    const ringAlpha = alpha * (1 - ring * 0.3);
    ctx.strokeStyle = `rgba(139,0,0,${ringAlpha * 0.8})`;
    ctx.lineWidth = 3 - ring;
    ctx.beginPath();
    ctx.arc(ef.x, ef.y, ringR, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Inner fill
  ctx.fillStyle = `rgba(100,0,0,${alpha * 0.15})`;
  ctx.beginPath();
  ctx.arc(ef.x, ef.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
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
    // Dive-bomber: AoE target zone telegraph
    if(e.movementType === 'divebomber' && e.movementState.phase === 'telegraph') {
      if(!telegraphs.find(t => t.source === e && t.type === 'diveZone')) {
        telegraphs.push({
          type: 'diveZone', source: e,
          x: e.movementState.targetX, y: e.movementState.targetY,
          radius: 60 + (e.isElite ? 20 : 0),
          life: 1.2, maxLife: 1.2
        });
      }
      if(!telegraphs.find(t => t.source === e && t.type === 'exclamation')) {
        telegraphs.push({
          type: 'exclamation', source: e,
          life: 1.2, maxLife: 1.2
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

// Pulsing orange/red circle on the ground for divebomber AoE warning
TELEGRAPH_RENDERERS.diveZone = function(ctx, t) {
  const pulse = 0.5 + 0.5 * Math.sin(gameTime * 10);
  const progress = 1 - t.life / t.maxLife;
  const alpha = Math.min(1, progress * 2) * pulse;
  ctx.save();
  ctx.strokeStyle = `rgba(255,120,30,${alpha})`;
  ctx.lineWidth = 3;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.arc(t.x, t.y, t.radius * (0.5 + progress * 0.5), 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = `rgba(255,80,20,${alpha * 0.2})`;
  ctx.fill();
  // Inner crosshair
  ctx.setLineDash([]);
  ctx.strokeStyle = `rgba(255,60,20,${alpha * 0.6})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(t.x - 10, t.y); ctx.lineTo(t.x + 10, t.y);
  ctx.moveTo(t.x, t.y - 10); ctx.lineTo(t.x, t.y + 10);
  ctx.stroke();
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
    // Elite glow effect: pulsing colored halo behind the enemy
    if(e.isElite) {
      const glowPulse = 0.5 + 0.5 * Math.sin(gameTime * 4 + e.spawnTime);
      ctx.save();
      ctx.shadowColor = e.type.color || '#ffaa00';
      ctx.shadowBlur = 15 + glowPulse * 10;
      ctx.fillStyle = `rgba(255,200,50,${0.12 + glowPulse * 0.08})`;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.size * 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    }
    if(e.isBoss) {
      THEME.drawBoss(ctx, e, gameTime);
    } else {
      THEME.drawEnemy(ctx, e, gameTime);
    }
    // Shield-bearer: draw frontal shield arc
    if(e.movementType === 'shieldbearer' && !e.isBoss) {
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.rotate(e.shieldAngle);
      ctx.strokeStyle = 'rgba(100,180,255,0.7)';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#4488ff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(0, 0, e.size + 4, -Math.PI * 0.45, Math.PI * 0.45);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();
    }
    // Elite crown indicator
    if(e.isElite) {
      ctx.save();
      ctx.fillStyle = '#ffcc00';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('\u2605', e.x, e.y - e.size - 6);
      ctx.restore();
    }
    ctx.restore();
  });

  // --- Class skill entity rendering ---
  // Death Aura visual
  if(player.permDeathAura) {
    ctx.save();
    ctx.fillStyle = 'rgba(192,57,43,0.08)';
    ctx.strokeStyle = 'rgba(192,57,43,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(player.x, player.y, 80, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  // Pull Aura visual
  if(player.permPullAura) {
    ctx.save();
    ctx.strokeStyle = 'rgba(155,89,182,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(player.x, player.y, 120, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  // Skeletons
  if(player.skeletons) {
    for(const sk of player.skeletons) {
      ctx.save();
      ctx.fillStyle = sk.tempLife !== undefined ? 'rgba(142,68,173,0.7)' : '#aaa';
      ctx.beginPath(); ctx.arc(sk.x, sk.y, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('\uD83D\uDC80', sk.x, sk.y);
      ctx.restore();
    }
  }
  // Turrets
  if(player.turrets) {
    for(const t of player.turrets) {
      ctx.save();
      ctx.fillStyle = '#555';
      ctx.strokeStyle = '#0ff';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.rect(t.x - 8, t.y - 8, 16, 16); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#0ff';
      ctx.font = '10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('\u2699', t.x, t.y);
      ctx.restore();
    }
  }
  // Traps
  if(player.traps) {
    for(const trap of player.traps) {
      ctx.save();
      ctx.fillStyle = 'rgba(211,84,0,0.4)';
      ctx.strokeStyle = '#d35400';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(trap.x, trap.y, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#d35400';
      ctx.font = '10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('\u26A0', trap.x, trap.y);
      ctx.restore();
    }
  }
  // Decoys
  if(player.decoys) {
    for(const dec of player.decoys) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, dec.life / 3);
      ctx.fillStyle = 'rgba(46,204,113,0.5)';
      ctx.beginPath(); ctx.arc(dec.x, dec.y, 14, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#2ecc71';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }
  // Drone
  if(player.permDrone) {
    const droneX = player.x + Math.cos(player.droneAngle || 0) * 50;
    const droneY = player.y + Math.sin(player.droneAngle || 0) * 50;
    ctx.save();
    ctx.fillStyle = '#0af';
    ctx.strokeStyle = '#0cf';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(droneX, droneY, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  // --- End class skill entity rendering ---

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
  // Stealth: semi-transparent player
  if(player.stealthActive) {
    ctx.save();
    ctx.globalAlpha = 0.3 + 0.1 * Math.sin(gameTime * 6);
  }
  // Overclock: cyan glow around player
  if(player.sigAbility && player.sigAbility.active && player.classId === 'gunner') {
    ctx.save();
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 20 + 10 * Math.sin(gameTime * 10);
  }
  THEME.drawPlayer(ctx, player.x, player.y, pr, gameTime);
  if(player.sigAbility && player.sigAbility.active && player.classId === 'gunner') {
    ctx.restore();
  }
  if(player.stealthActive) {
    ctx.restore();
  }

  // Singularity Rift visual (world space)
  if(player.riftActive) {
    ctx.save();
    const riftAlpha = Math.min(1, player.riftTimer * 2);
    const riftPulse = 0.7 + 0.3 * Math.sin(gameTime * 8);
    const riftRadius = 250;
    // Outer distortion ring
    ctx.strokeStyle = `rgba(106,13,173,${riftAlpha * 0.6 * riftPulse})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(player.riftX, player.riftY, riftRadius * riftPulse, 0, Math.PI * 2);
    ctx.stroke();
    // Inner vortex
    ctx.fillStyle = `rgba(20,0,40,${riftAlpha * 0.4})`;
    ctx.beginPath();
    ctx.arc(player.riftX, player.riftY, riftRadius * 0.5 * riftPulse, 0, Math.PI * 2);
    ctx.fill();
    // Spiraling arms
    for(let arm = 0; arm < 4; arm++) {
      const armAngle = gameTime * 3 + (arm / 4) * Math.PI * 2;
      ctx.strokeStyle = `rgba(150,50,255,${riftAlpha * 0.5})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for(let s = 0; s < 30; s++) {
        const t = s / 30;
        const r = riftRadius * t * riftPulse;
        const a = armAngle + t * 3;
        const sx = player.riftX + Math.cos(a) * r;
        const sy = player.riftY + Math.sin(a) * r;
        if(s === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
    }
    // Center glow
    ctx.fillStyle = `rgba(106,13,173,${riftAlpha * 0.7})`;
    ctx.shadowColor = '#6a0dad';
    ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.arc(player.riftX, player.riftY, 15 + 5 * Math.sin(gameTime * 12), 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

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
    const cdProgress = 1 - player.dashCooldown / 1.6;
    ctx.strokeStyle = `rgba(${THEME.effectColors.invuln.rgb},${0.4 * cdProgress})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 22, -Math.PI/2, -Math.PI/2 + cdProgress * Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Signature ability HUD
  renderSignatureAbilityHUD(ctx);

  // Gold HUD — canvas-rendered, top-right area
  renderGoldHUD(ctx);
}

function renderSignatureAbilityHUD(ctx) {
  const sigConfig = (THEME.classConfig && THEME.classConfig.signatureAbility) || null;
  if(!sigConfig) return;
  const sa = player.sigAbility;
  if(!sa) return;

  const x = 70;
  const y = H - 50;
  const size = 22;

  ctx.save();

  // Background circle
  const isReady = sa.cooldown <= 0 && !sa.active;
  const isActive = sa.active;
  const isOnCooldown = sa.cooldown > 0 && !sa.active;

  if(isActive) {
    // Pulsing bright glow
    const pulse = 0.7 + 0.3 * Math.sin(gameTime * 10);
    ctx.fillStyle = `rgba(255,215,0,${0.3 * pulse})`;
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 15 + 10 * pulse;
    ctx.beginPath();
    ctx.arc(x, y, size + 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // Duration bar (arc)
    const durPct = sa.duration / sa.maxDuration;
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, size + 2, -Math.PI / 2, -Math.PI / 2 + durPct * Math.PI * 2);
    ctx.stroke();
  } else if(isOnCooldown) {
    // Grey background with cooldown sweep
    ctx.fillStyle = 'rgba(50,50,50,0.7)';
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    // Cooldown sweep
    const cdPct = 1 - sa.cooldown / sa.maxCooldown;
    ctx.fillStyle = 'rgba(100,100,100,0.5)';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, size, -Math.PI / 2, -Math.PI / 2 + cdPct * Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    // Cooldown seconds text
    ctx.fillStyle = '#aaa';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(Math.ceil(sa.cooldown) + 's', x, y + size + 14);
  } else if(isReady) {
    // Ready: glowing border
    const pulse = 0.6 + 0.4 * Math.sin(gameTime * 4);
    ctx.fillStyle = `rgba(80,80,80,0.6)`;
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 8 + 6 * pulse;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(255,215,0,${0.5 + 0.5 * pulse})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Icon
  ctx.font = (isOnCooldown ? '16px' : '20px') + ' sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = isOnCooldown ? '#666' : '#fff';
  ctx.fillText(sigConfig.icon || '?', x, y);

  // Keybind label
  if(isReady) {
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('Q', x, y - size - 8);
  }

  // Name label
  ctx.font = '9px sans-serif';
  ctx.fillStyle = isActive ? '#ffd700' : isReady ? '#ccc' : '#666';
  ctx.fillText(sigConfig.name || '', x, y + size + (isOnCooldown ? 26 : 14));

  ctx.restore();
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

  // Skill point indicator (below gold)
  const saveData = SaveManager.load();
  const spentPts = Object.keys(saveData.skillTree || {}).filter(k => saveData.skillTree[k]).length;
  const availPts = (saveData.skillPoints || 0) - spentPts;
  if (availPts > 0) {
    ctx.save();
    const spY = y + 28;
    const pulse = 0.7 + 0.3 * Math.sin(performance.now() / 300);
    ctx.globalAlpha = pulse;
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 8;
    ctx.fillText(`\u2B50 ${availPts} SP  [K]`, x, spY);
    ctx.restore();
  }
}

// ============================================================
// SIGNATURE CLASS ABILITIES
// ============================================================
function activateSignatureAbility() {
  const classId = player.classId || 'gunner';
  const sigConfig = (THEME.classConfig && THEME.classConfig.signatureAbility) || {};
  const sa = player.sigAbility;

  sa.cooldown = sa.maxCooldown;

  if(classId === 'gunner') {
    // OVERCLOCK: 5s of 2x attack speed, +2 pierce
    sa.active = true;
    sa.duration = sigConfig.duration || 5;
    Audio.overclockSound();
    spawnParticles(player.x, player.y, 15, '#00ffff', 4);
    lootPickupTexts.push({ text: 'OVERCLOCK!', rarity: 'legendary', x: player.x, y: player.y - 30, life: 1.5, maxLife: 1.5 });
  } else if(classId === 'darkknight') {
    // BLOOD RITUAL: instant, sacrifice 20% HP, 6 explosions
    sa.active = false; // instant ability
    const sacrifice = Math.floor(player.hp * 0.20);
    player.hp = Math.max(1, player.hp - sacrifice);
    damageFlash = 0.1;
    Audio.bloodRitualSound();
    const explodeDmg = 50 * player.damage * (player.abilityPowerMult || 1);
    const explodeRadius = 80;
    for(let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const ex = player.x + Math.cos(angle) * 100;
      const ey = player.y + Math.sin(angle) * 100;
      // Delayed explosions for visual effect
      setTimeout(() => {
        if(state !== 'playing' && state !== 'victory_vacuum') return;
        activeEffects.push({
          type: 'area', x: ex, y: ey,
          radius: 0, maxRadius: explodeRadius,
          damage: explodeDmg, life: 0.4, maxLife: 0.4,
          hit: new Set(), isBloodRitual: true
        });
        spawnParticles(ex, ey, 10, '#8b0000', 4);
        spawnParticles(ex, ey, 6, '#ff0000', 3);
        // Heal 5% of damage dealt per explosion (estimated from nearby enemies)
        const hits = enemyHash.query(ex, ey, explodeRadius + 20);
        let expDmg = 0;
        for(const en of hits) {
          if(!en._dead) expDmg += Math.min(en.hp, explodeDmg);
        }
        const heal = Math.floor(expDmg * 0.05);
        if(heal > 0) {
          player.hp = Math.min(player.hp + heal, player.maxHp);
        }
      }, i * 80);
    }
    // Show total heal summary after all explosions
    setTimeout(() => {
      if(player.hp < player.maxHp) {
        lootPickupTexts.push({ text: 'Blood Healed', rarity: 'rare', x: player.x, y: player.y - 20, life: 1.0, maxLife: 1.0 });
      }
    }, 6 * 80 + 50);
    screenShake = 0.3;
    // Dark red expanding ring visual
    activeEffects.push({
      type: 'bloodRitualRing', x: player.x, y: player.y,
      radius: 0, maxRadius: 140,
      life: 0.8, maxLife: 0.8
    });
    lootPickupTexts.push({ text: 'BLOOD RITUAL!', rarity: 'legendary', x: player.x, y: player.y - 30, life: 1.5, maxLife: 1.5 });
  } else if(classId === 'ranger') {
    // NATURE'S VEIL: 6s stealth
    sa.active = true;
    sa.duration = sigConfig.duration || 6;
    player.stealthActive = true;
    player.stealthAmbush = true;
    player.stealthSpeedBonus = player.speed * 0.30;
    player.speed += player.stealthSpeedBonus;
    Audio.naturesVeilSound();
    spawnParticles(player.x, player.y, 12, '#228B22', 3);
    spawnParticles(player.x, player.y, 8, '#90EE90', 2);
    lootPickupTexts.push({ text: "NATURE'S VEIL!", rarity: 'legendary', x: player.x, y: player.y - 30, life: 1.5, maxLife: 1.5 });
  } else if(classId === 'warlock') {
    // SINGULARITY RIFT: 4s pull + DoT at player position
    sa.active = true;
    sa.duration = sigConfig.duration || 4;
    player.riftActive = true;
    player.riftX = player.x;
    player.riftY = player.y;
    player.riftTimer = 0;
    Audio.singularityRiftSound();
    spawnParticles(player.x, player.y, 20, '#6a0dad', 5);
    spawnParticles(player.x, player.y, 10, '#000000', 4);
    lootPickupTexts.push({ text: 'SINGULARITY RIFT!', rarity: 'legendary', x: player.x, y: player.y - 30, life: 1.5, maxLife: 1.5 });
  }
}

function updateSignatureAbility(dt) {
  const sa = player.sigAbility;
  const classId = player.classId || 'gunner';

  // Cooldown tick
  if(sa.cooldown > 0) sa.cooldown -= dt;

  if(!sa.active) return;

  sa.duration -= dt;

  if(classId === 'gunner') {
    // Overclock: visual particles while active
    if(Math.random() < 0.3) {
      const angle = Math.random() * Math.PI * 2;
      spawnParticles(
        player.x + Math.cos(angle) * 15, player.y + Math.sin(angle) * 15,
        1, '#00ffff', 2
      );
    }
    // Speed lines effect
    if(Math.random() < 0.15) {
      const behind = Math.atan2(-player.lastDirY, -player.lastDirX);
      const spread = (Math.random() - 0.5) * 1.5;
      particles.get(
        player.x + Math.cos(behind + spread) * 20,
        player.y + Math.sin(behind + spread) * 20,
        Math.cos(behind) * 200, Math.sin(behind) * 200,
        0.2, '#00e5ff', 1
      );
    }
    if(sa.duration <= 0) {
      sa.active = false;
    }
  } else if(classId === 'ranger') {
    // Nature's Veil: leaf particles while stealthed
    if(Math.random() < 0.2) {
      const angle = Math.random() * Math.PI * 2;
      particles.get(
        player.x + Math.cos(angle) * 20,
        player.y + Math.sin(angle) * 20,
        Math.cos(angle) * 30 + (Math.random() - 0.5) * 20,
        Math.sin(angle) * 30 - 20,
        0.5 + Math.random() * 0.3, '#228B22', 2
      );
    }
    if(sa.duration <= 0) {
      endStealth();
      sa.active = false;
    }
  } else if(classId === 'warlock') {
    // Singularity Rift: pull enemies + DoT
    player.riftTimer += dt;
    const riftRadius = 250;
    const pullStr = 200;
    const dps = 15 * player.damage * (player.abilityPowerMult || 1);
    const nearby = enemyHash.query(player.riftX, player.riftY, riftRadius + 50);
    for(const e of nearby) {
      const dx = player.riftX - e.x;
      const dy = player.riftY - e.y;
      const d = Math.hypot(dx, dy);
      if(d < riftRadius && d > 10) {
        // Pull toward center
        const pullForce = pullStr * (1 - d / riftRadius);
        e.x += (dx / d) * pullForce * dt;
        e.y += (dy / d) * pullForce * dt;
        e._pulled = true;
        // DoT
        damageEnemy(e, dps * dt);
      }
    }
    // Swirling particles
    if(Math.random() < 0.4) {
      const pAngle = Math.random() * Math.PI * 2;
      const pDist = 50 + Math.random() * riftRadius;
      const px = player.riftX + Math.cos(pAngle) * pDist;
      const py = player.riftY + Math.sin(pAngle) * pDist;
      const toCenterX = player.riftX - px;
      const toCenterY = player.riftY - py;
      const tcLen = Math.hypot(toCenterX, toCenterY);
      particles.get(px, py, (toCenterX / tcLen) * 150, (toCenterY / tcLen) * 150, 0.4, Math.random() < 0.5 ? '#6a0dad' : '#1a0030', 2);
    }

    if(sa.duration <= 0) {
      // Collapse burst damage
      const burstDmg = 80 * player.damage * (player.abilityPowerMult || 1);
      const burstNearby = enemyHash.query(player.riftX, player.riftY, riftRadius);
      for(const e of burstNearby) {
        const d = Math.hypot(e.x - player.riftX, e.y - player.riftY);
        if(d < riftRadius) {
          damageEnemy(e, burstDmg);
        }
      }
      Audio.singularityCollapseSound();
      spawnParticles(player.riftX, player.riftY, 30, '#6a0dad', 6);
      spawnParticles(player.riftX, player.riftY, 15, '#ffffff', 3);
      screenShake = 0.3;
      player.riftActive = false;
      sa.active = false;
    }
  }
}

function endStealth() {
  if(!player.stealthActive) return;
  player.stealthActive = false;
  player.stealthAmbush = false;
  if(player.stealthSpeedBonus > 0) {
    player.speed -= player.stealthSpeedBonus;
    player.stealthSpeedBonus = 0;
  }
  spawnParticles(player.x, player.y, 8, '#90EE90', 3);
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
      if(!saveData.equipped) saveData.equipped = [];
      const maxSlots = saveData.inventorySlots || 6;
      const uniqueInv = {};
      saveData.inventory.forEach(id => { uniqueInv[id] = true; });
      const usedSlots = Object.keys(uniqueInv).length;
      const alreadyInInventory = saveData.inventory.indexOf(d.item.id) !== -1;

      if(saveData.equipped.length < 3) {
        saveData.inventory.push(d.item.id);
        saveData.equipped.push(d.item.id);
      } else if(alreadyInInventory || usedSlots < maxSlots) {
        saveData.inventory.push(d.item.id);
      } else {
        const salvageGold = SALVAGE_VALUES[d.item.rarity] || 5;
        saveData.gold += salvageGold;
        runGold += salvageGold;
        lootPickupTexts.push({ text: 'Salvaged +' + salvageGold + 'g', rarity: d.item.rarity, x: d.x, y: d.y - 16, life: 1.5, maxLife: 1.5 });
      }
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
  Audio.stopMusic();
  state = 'victory';

  // Record run stats and update world progression
  const cid = player.classId || 'gunner';
  SaveManager.recordRun(kills, gameTime, runGold, cid, waveNum);
  const saveData = SaveManager.load();
  // Award 2 skill points per world completed
  saveData.skillPoints = (saveData.skillPoints || 0) + 2;
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
    const className = SaveManager.CLASS_NAMES[cid] || cid;
    const cs = (saveData.classStats && saveData.classStats[cid]) || {};
    const bestMins = Math.floor((cs.bestTime || 0) / 60);
    const bestSecs = Math.floor((cs.bestTime || 0) % 60);
    const isNewBestTime = gameTime >= (cs.bestTime || 0);
    const isNewBestKills = kills >= (cs.bestKills || 0);
    const newBestHtml = (isNewBestTime || isNewBestKills) ? '<div class="stats-line" style="color:#ffd700;font-weight:bold;margin-top:6px">NEW BEST!</div>' : '';
    victoryStats.innerHTML = `
      <div class="stats-line">Time Survived: ${mins}:${secs.toString().padStart(2,'0')}</div>
      <div class="stats-line">Level Reached: ${playerLevel}</div>
      <div class="stats-line">Enemies Slain: ${kills}</div>
      <div class="stats-line">Gold Earned: ${runGold}g</div>
      <div class="stats-line">Weapons: ${player.weapons.length}</div>
      ${newBestHtml}
      <div class="stats-line" style="margin-top:8px;opacity:0.7">Best as ${className}: ${bestMins}:${bestSecs.toString().padStart(2,'0')} | ${cs.bestKills || 0} kills | ${cs.totalRuns || 0} runs</div>
      <div class="stats-line" style="opacity:0.5">Total Runs: ${saveData.stats.runsCompleted} | All-time Kills: ${saveData.stats.totalKills} | Bank: ${saveData.gold}g</div>
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
  if(THEME.song) { Audio.loadMusic(THEME.song); setTimeout(() => Audio.startMusic(), 300); }
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
  // Apply class starting stats if available, otherwise use defaults
  const classStats = (THEME.classConfig && THEME.classConfig.startingStats) || {};
  player.hp = classStats.hp || 100;
  player.maxHp = classStats.hp || 100;
  player.speed = classStats.speed || 150;
  player.damage = classStats.damage || 1;
  player.attackSpeed = 1;
  player.pickupRadius = 60;
  player.defense = classStats.defense || 1;
  player.invulnTime = 0;
  player.dashTimer = 0;
  player.dashCooldown = 0;
  player.dashDirX = 0; player.dashDirY = 0;
  player.lastDirX = 0; player.lastDirY = 1;
  // Starting weapon: first primary affinity weapon, or first weapon in theme list, or projectile fallback
  const _startType = (THEME.classConfig && THEME.classConfig.weaponAffinities && THEME.classConfig.weaponAffinities.primary && THEME.classConfig.weaponAffinities.primary[0])
    || (THEME.weapons && THEME.weapons[0] && THEME.weapons[0].type)
    || 'projectile';
  player.weapons = [{ type: _startType, level: 1 }];
  player.passives = [];

  // Class identity
  player.classId = (THEME.classConfig && THEME.classConfig.classId) || null;

  // Class passive stats (defaults for all classes)
  player.evasionChance = 0;
  player.aoeSizeMult = 1;
  player.abilityPowerMult = 1;
  player.cooldownMult = 1;
  player.projSpeedMult = 1;

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

  // Class skill flags (reset all, will be set by applyAllSkills)
  player.permHeadshot = false;
  player.permOverdrive = false; player.overdriveTimer = 0; player.overdriveKills = 0;
  player.permExplosiveRounds = false;
  player.permAutoTurret = false; player.turretTimer = 0;
  player.permDrone = false; player.droneAngle = 0; player.droneFireTimer = 0;
  player.permEmpBurst = false;
  player.permBloodFrenzy = false; player.bloodFrenzyTimer = 0;
  player.permDeathAura = false;
  player.permSkeletons = 0; player.permSkeletonMage = false;
  player.permArmyOfDarkness = false; player.armyTimer = 0;
  player.permFortify = false; player.fortifyStillTimer = 0; player.fortifyActive = false;
  player.permVampiricNova = false; player.vampiricNovaUsed = false;
  player.permPoison = false; player.permVirulent = false;
  player.permRootSnare = false; player.permOvergrowth = false;
  player.permDoubleDash = false; player.permPhantomStep = false;
  player.permTraps = 0; player.permTrapMastery = false; player.trapTimer = 0;
  player.permNetLauncher = false; player.netTimer = 0;
  player.permPullAura = false;
  player.permGravityWell = false; player.gravityWellTimer = 0;
  player.permMassIncrease = false;
  player.permBlackHole = false; player.blackHoleTimer = 0;
  player.permTimeBubble = false;
  player.permRewind = false; player.rewindUsed = false; player.rewindHpLog = [];
  player.permTemporalLoop = false;
  player.permVoidBolt = false; player.voidBoltTimer = 0;
  player.permSingularity = false; player.singularityTimer = 0;
  // Runtime entity arrays for summons/traps/turrets/decoys
  player.skeletons = []; player.traps = []; player.turrets = []; player.decoys = [];

  // Signature class ability state
  const sigConfig = (THEME.classConfig && THEME.classConfig.signatureAbility) || {};
  player.sigAbility = {
    cooldown: 0,
    maxCooldown: sigConfig.cooldown || 45,
    active: false,
    duration: 0,
    maxDuration: sigConfig.duration || 0,
    timer: 0 // generic timer for ability-specific state
  };
  // Ranger stealth: ambush flag
  player.stealthActive = false;
  player.stealthAmbush = false;
  player.stealthSpeedBonus = 0;
  // Warlock rift state
  player.riftActive = false;
  player.riftX = 0;
  player.riftY = 0;
  player.riftTimer = 0;

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
    if (upg.weaponType && upg.weaponType !== _startType) {
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

  // --- Apply skill tree bonuses from save state (dynamic per class) ---
  const skillTreeSave = permSave.skillTree || {};
  applyAllSkills(player, skillTreeSave);
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

  // --- Apply class passive effects from THEME ---
  if (THEME.classConfig && THEME.classConfig.classPassive && THEME.classConfig.classPassive.effect) {
    const fx = THEME.classConfig.classPassive.effect;
    if (fx.critBonus) player.permCritChance = (player.permCritChance || 0) + fx.critBonus;
    if (fx.projSpeedMult) player.projSpeedMult = fx.projSpeedMult;
    if (fx.lifestealBonus) player.permLifesteal = (player.permLifesteal || 0) + fx.lifestealBonus;
    if (fx.aoeSizeMult) player.aoeSizeMult = fx.aoeSizeMult;
    if (fx.speedMult) player.speed *= fx.speedMult;
    if (fx.evasionChance) player.evasionChance = fx.evasionChance;
    if (fx.abilityPowerMult) player.abilityPowerMult = fx.abilityPowerMult;
    if (fx.cooldownMult) player.cooldownMult = fx.cooldownMult;
  }
  // --- End class passive effects ---

  // Refresh difficulty cache at run start
  _diffCacheDirty = true;

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
  // Warlock: Rewind — undo last 5s of damage (restore HP from log)
  if(player.permRewind && !player.rewindUsed && player.rewindHpLog && player.rewindHpLog.length > 0) {
    player.rewindUsed = true;
    const oldHp = player.rewindHpLog[0].hp;
    player.hp = Math.min(oldHp, player.maxHp);
    player.invulnTime = 1.5;
    player.rewindHpLog = [];
    spawnParticles(player.x, player.y, 15, '#3498db', 4);
    Audio.levelUpSound();
    lootPickupTexts.push({ text: 'REWIND!', rarity: 'legendary', x: player.x, y: player.y - 30, life: 2.0, maxLife: 2.0 });
    return true;
  }
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
  Audio.stopMusic();
  state = 'gameover';
  // Auto-save run stats + gold to persistent save
  const cid = player.classId || 'gunner';
  SaveManager.recordRun(kills, gameTime, runGold, cid, waveNum);
  const mins = Math.floor(gameTime/60);
  const secs = Math.floor(gameTime%60);
  const saveData = SaveManager.load();
  const className = SaveManager.CLASS_NAMES[cid] || cid;
  const cs = (saveData.classStats && saveData.classStats[cid]) || {};
  const bestMins = Math.floor((cs.bestTime || 0) / 60);
  const bestSecs = Math.floor((cs.bestTime || 0) % 60);
  const isNewBestTime = gameTime >= (cs.bestTime || 0);
  const isNewBestKills = kills >= (cs.bestKills || 0);
  const newBestHtml = (isNewBestTime || isNewBestKills) ? '<div class="stats-line" style="color:#ffd700;font-weight:bold;margin-top:6px">NEW BEST!</div>' : '';
  document.getElementById('go-stats').innerHTML = `
    <div class="stats-line">Time Survived: ${mins}:${secs.toString().padStart(2,'0')}</div>
    <div class="stats-line">Level Reached: ${playerLevel}</div>
    <div class="stats-line">Enemies Slain: ${kills}</div>
    <div class="stats-line">Gold Earned: ${runGold}g</div>
    <div class="stats-line">Weapons: ${player.weapons.length}</div>
    ${newBestHtml}
    <div class="stats-line" style="margin-top:8px;opacity:0.7">Best as ${className}: ${bestMins}:${bestSecs.toString().padStart(2,'0')} | ${cs.bestKills || 0} kills | ${cs.totalRuns || 0} runs</div>
    <div class="stats-line" style="opacity:0.5">Total Runs: ${saveData.stats.runsCompleted} | All-time Kills: ${saveData.stats.totalKills} | Bank: ${saveData.gold}g</div>
  `;
  document.getElementById('game-over-screen').style.display = 'flex';
}

// ============================================================
// PAUSE MENU — TABBED (Resume / Inventory / Skills)
// ============================================================
// ============================================================
// CLASS SKILL TREES — unique per class, dynamic application
// ============================================================
const CLASS_SKILL_TREES = {
  // ---- GUNNER (Cyberpunk) ----
  gunner: {
    precision: {
      label: 'Precision', color: '#e74c3c', icon: '\u2694',
      nodes: [
        { id: 'gunner_precision_1', name: 'Crit Eye',       desc: '+10% critical hit chance',
          apply(p) { p.permCritChance = (p.permCritChance || 0) + 0.10; } },
        { id: 'gunner_precision_2', name: 'Lethal Strikes', desc: '+50% critical damage multiplier',
          apply(p) { p.permCritDamage = (p.permCritDamage || 0) + 0.50; } },
        { id: 'gunner_precision_3', name: 'Headshot',       desc: 'Kills enemies below 15% HP instantly',
          apply(p) { p.permHeadshot = true; } },
        { id: 'gunner_precision_4', name: 'Overdrive',      desc: 'Kill streaks grant 2x fire rate for 3s',
          apply(p) { p.permOverdrive = true; } }
      ]
    },
    arsenal: {
      label: 'Arsenal', color: '#f39c12', icon: '\uD83D\uDD2B',
      nodes: [
        { id: 'gunner_arsenal_1', name: 'Multi-Shot',       desc: '+1 extra projectile per volley',
          apply(p) { p.permMultiProjectile = true; } },
        { id: 'gunner_arsenal_2', name: 'Piercing Rounds',  desc: '+2 pierce on projectiles',
          apply(p) { p.permPiercing = true; } },
        { id: 'gunner_arsenal_3', name: 'Explosive Rounds', desc: 'Projectiles explode on final hit (small AoE)',
          apply(p) { p.permExplosiveRounds = true; } },
        { id: 'gunner_arsenal_4', name: 'Auto-Turret',      desc: 'Deploy a stationary turret every 30s',
          apply(p) { p.permAutoTurret = true; } }
      ]
    },
    tech: {
      label: 'Tech', color: '#3498db', icon: '\u2699',
      nodes: [
        { id: 'gunner_tech_1', name: 'Shield Regen',  desc: 'Regenerate 1 HP every 5s',
          apply(p) { p.permRegen = true; p.permRegenTimer = 0; } },
        { id: 'gunner_tech_2', name: 'Energy Shield',  desc: 'Dash grants 2s invulnerability shield',
          apply(p) { p.permShieldOnDash = true; } },
        { id: 'gunner_tech_3', name: 'Drone',           desc: 'Orbiting drone that shoots enemies',
          apply(p) { p.permDrone = true; } },
        { id: 'gunner_tech_4', name: 'EMP Burst',       desc: '10% chance on hit to stun all nearby enemies 1s',
          apply(p) { p.permEmpBurst = true; } }
      ]
    }
  },

  // ---- DARK KNIGHT (Gothic) ----
  darkknight: {
    blood: {
      label: 'Blood', color: '#c0392b', icon: '\uD83E\uDE78',
      nodes: [
        { id: 'dk_blood_1', name: 'Lifesteal',     desc: '+8% lifesteal on damage dealt',
          apply(p) { p.permLifesteal = (p.permLifesteal || 0) + 0.08; } },
        { id: 'dk_blood_2', name: 'Blood Frenzy',  desc: '+15% attack speed on kill for 3s',
          apply(p) { p.permBloodFrenzy = true; } },
        { id: 'dk_blood_3', name: 'Thorns',        desc: 'Reflect 20% damage back to attackers',
          apply(p) { p.permThorns = (p.permThorns || 0) + 0.20; } },
        { id: 'dk_blood_4', name: 'Death Aura',    desc: 'Constant 3/s AoE damage around player',
          apply(p) { p.permDeathAura = true; } }
      ]
    },
    shadow: {
      label: 'Shadow', color: '#8e44ad', icon: '\uD83D\uDC80',
      nodes: [
        { id: 'dk_shadow_1', name: 'Summon Skeleton', desc: 'Spawn 1 skeleton ally that fights',
          apply(p) { p.permSkeletons = Math.max(p.permSkeletons || 0, 1); } },
        { id: 'dk_shadow_2', name: 'Pack',             desc: 'Summon up to 3 skeleton allies',
          apply(p) { p.permSkeletons = Math.max(p.permSkeletons || 0, 3); } },
        { id: 'dk_shadow_3', name: 'Skeleton Mage',    desc: 'Skeletons shoot ranged projectiles',
          apply(p) { p.permSkeletonMage = true; } },
        { id: 'dk_shadow_4', name: 'Army of Darkness', desc: 'Every 45s, mass summon 8 skeletons for 10s',
          apply(p) { p.permArmyOfDarkness = true; } }
      ]
    },
    undying: {
      label: 'Undying', color: '#2c3e50', icon: '\u26E8',
      nodes: [
        { id: 'dk_undying_1', name: 'Damage Reduction', desc: '-15% damage taken',
          apply(p) { p.defense *= 0.85; } },
        { id: 'dk_undying_2', name: 'Fortify',          desc: 'Standing still 2s grants +25% defense',
          apply(p) { p.permFortify = true; } },
        { id: 'dk_undying_3', name: 'Second Life',      desc: 'Revive once per run at 30% HP',
          apply(p) { p.permSecondLife = true; } },
        { id: 'dk_undying_4', name: 'Vampiric Nova',    desc: 'Dropping below 30% HP triggers heal burst + damage wave',
          apply(p) { p.permVampiricNova = true; } }
      ]
    }
  },

  // ---- RANGER (Forest) ----
  ranger: {
    nature: {
      label: 'Nature', color: '#27ae60', icon: '\uD83C\uDF3F',
      nodes: [
        { id: 'ranger_nature_1', name: 'Poison',     desc: '+3/s poison DoT on hit for 3s',
          apply(p) { p.permPoison = true; } },
        { id: 'ranger_nature_2', name: 'Virulent',   desc: 'Poison spreads to nearby enemies on death',
          apply(p) { p.permVirulent = true; } },
        { id: 'ranger_nature_3', name: 'Root Snare',  desc: '25% chance to slow enemy 50% for 2s on hit',
          apply(p) { p.permRootSnare = true; } },
        { id: 'ranger_nature_4', name: 'Overgrowth',  desc: 'Poisoned enemies leave toxic ground on death',
          apply(p) { p.permOvergrowth = true; } }
      ]
    },
    agility: {
      label: 'Agility', color: '#2ecc71', icon: '\u26A1',
      nodes: [
        { id: 'ranger_agility_1', name: 'Swift',        desc: '+12% movement speed',
          apply(p) { p.speed *= 1.12; } },
        { id: 'ranger_agility_2', name: 'Evasion',      desc: '+15% dodge chance',
          apply(p) { p.evasionChance = (p.evasionChance || 0) + 0.15; } },
        { id: 'ranger_agility_3', name: 'Double Dash',  desc: '2 dash charges (reduced cooldown)',
          apply(p) { p.permDoubleDash = true; p.dashCooldownReduction = (p.dashCooldownReduction || 0) + 0.40; } },
        { id: 'ranger_agility_4', name: 'Phantom Step', desc: 'Dash leaves decoy that draws enemies for 3s',
          apply(p) { p.permPhantomStep = true; } }
      ]
    },
    trapper: {
      label: 'Trapper', color: '#d35400', icon: '\uD83E\uDE64',
      nodes: [
        { id: 'ranger_trapper_1', name: 'Bear Trap',    desc: 'Auto-place trap every 15s (damage + root)',
          apply(p) { p.permTraps = Math.max(p.permTraps || 0, 1); } },
        { id: 'ranger_trapper_2', name: 'More Traps',   desc: 'Up to 3 active traps at once',
          apply(p) { p.permTraps = Math.max(p.permTraps || 0, 3); } },
        { id: 'ranger_trapper_3', name: 'Trap Mastery', desc: '+50% trap damage',
          apply(p) { p.permTrapMastery = true; } },
        { id: 'ranger_trapper_4', name: 'Net Launcher', desc: 'Every 20s, AoE slow in large radius',
          apply(p) { p.permNetLauncher = true; } }
      ]
    }
  },

  // ---- WARLOCK (Cosmic) ----
  warlock: {
    gravity: {
      label: 'Gravity', color: '#9b59b6', icon: '\uD83C\uDF0C',
      nodes: [
        { id: 'warlock_gravity_1', name: 'Pull Aura',     desc: 'Nearby enemies slowly pulled toward player',
          apply(p) { p.permPullAura = true; } },
        { id: 'warlock_gravity_2', name: 'Gravity Well',   desc: 'Every 25s, vortex pulls enemies in area',
          apply(p) { p.permGravityWell = true; } },
        { id: 'warlock_gravity_3', name: 'Mass Increase',  desc: 'Pulled enemies take +25% damage',
          apply(p) { p.permMassIncrease = true; } },
        { id: 'warlock_gravity_4', name: 'Black Hole',     desc: 'Massive pull + damage every 60s',
          apply(p) { p.permBlackHole = true; } }
      ]
    },
    time: {
      label: 'Time', color: '#3498db', icon: '\u231B',
      nodes: [
        { id: 'warlock_time_1', name: 'CDR',          desc: '-15% all cooldowns',
          apply(p) { p.cooldownMult = (p.cooldownMult || 1) * 0.85; } },
        { id: 'warlock_time_2', name: 'Time Bubble',   desc: 'On dash, leave slow field for 3s',
          apply(p) { p.permTimeBubble = true; } },
        { id: 'warlock_time_3', name: 'Rewind',        desc: 'Once per run, undo last 5s of damage taken',
          apply(p) { p.permRewind = true; } },
        { id: 'warlock_time_4', name: 'Temporal Loop',  desc: '15% chance to not consume weapon cooldown',
          apply(p) { p.permTemporalLoop = true; } }
      ]
    },
    voidBranch: {
      label: 'Void', color: '#e74c3c', icon: '\uD83D\uDD73',
      nodes: [
        { id: 'warlock_void_1', name: 'Ability Power',  desc: '+20% all damage',
          apply(p) { p.abilityPowerMult = (p.abilityPowerMult || 1) * 1.20; } },
        { id: 'warlock_void_2', name: 'Void Bolt',      desc: 'Periodic bonus magic projectile every 3s',
          apply(p) { p.permVoidBolt = true; } },
        { id: 'warlock_void_3', name: 'Void Armor',     desc: '+1 defense per 10% ability power bonus',
          apply(p) {
            const apBonus = ((p.abilityPowerMult || 1) - 1) * 10;
            p.defense *= Math.max(0.5, 1 - apBonus * 0.01);
          } },
        { id: 'warlock_void_4', name: 'Singularity',    desc: 'Every 45s, massive AoE centered on player',
          apply(p) { p.permSingularity = true; } }
      ]
    }
  }
};

// Active skill tree: returns the class-specific tree or gunner as fallback
function getActiveSkillTree() {
  const classId = (THEME.classConfig && THEME.classConfig.classId) || 'gunner';
  return CLASS_SKILL_TREES[classId] || CLASS_SKILL_TREES.gunner;
}

// Backwards-compatible SKILL_TREE_DEF via Proxy — delegates to active class tree
const SKILL_TREE_DEF = new Proxy({}, {
  get(_, prop) {
    const tree = getActiveSkillTree();
    if (prop === Symbol.iterator || prop === 'length') return undefined;
    return tree[prop];
  },
  ownKeys() {
    return Object.keys(getActiveSkillTree());
  },
  getOwnPropertyDescriptor(_, prop) {
    const tree = getActiveSkillTree();
    if (prop in tree) return { configurable: true, enumerable: true, value: tree[prop] };
    return undefined;
  },
  has(_, prop) {
    return prop in getActiveSkillTree();
  }
});

// Lookup a skill node by ID across the active tree
function findSkillNode(skillId, tree) {
  tree = tree || getActiveSkillTree();
  for (const branchKey of Object.keys(tree)) {
    for (const node of tree[branchKey].nodes) {
      if (node.id === skillId) return node;
    }
  }
  return null;
}

// Generic: apply all unlocked skills from save data to player
function applyAllSkills(p, skillTreeSave) {
  const tree = getActiveSkillTree();
  for (const branchKey of Object.keys(tree)) {
    for (const node of tree[branchKey].nodes) {
      if (skillTreeSave[node.id] && node.apply) {
        node.apply(p);
      }
    }
  }
}

// ============================================================
// PAUSE MENU — TABBED (Resume / Inventory / Skills)
// ============================================================
let pauseTab = 'resume';

function togglePause() {
  if(state === 'playing') {
    state = 'paused';
    pauseTab = 'resume';
    renderPauseMenu();
    document.getElementById('pause-screen').style.display = 'flex';
  } else if(state === 'paused') {
    reapplyEquippedItems();
    state = 'playing';
    document.getElementById('pause-screen').style.display = 'none';
    lastTime = performance.now();
  }
}

function switchPauseTab(tab) {
  pauseTab = tab;
  renderPauseMenu();
}

function renderPauseMenu() {
  const saveData = SaveManager.load();
  const mins = Math.floor(gameTime / 60);
  const secs = Math.floor(gameTime % 60);
  const spentSkillPts = Object.keys(saveData.skillTree || {}).filter(k => saveData.skillTree[k]).length;
  const availablePts = (saveData.skillPoints || 0) - spentSkillPts;

  const screen = document.getElementById('pause-screen');
  let html = '';

  html += '<div class="pause-header">';
  html += '<div class="pause-stat"><span class="pause-stat-icon" style="color:#ffd700">G</span> ' + (saveData.gold + runGold) + ' gold</div>';
  html += '<div class="pause-stat"><span class="pause-stat-icon" style="color:#44ddff">\u2605</span> ' + availablePts + ' skill pts</div>';
  html += '<div class="pause-stat"><span class="pause-stat-icon" style="color:#aaa">\u23F1</span> ' + mins + ':' + secs.toString().padStart(2, '0') + '</div>';
  html += '</div>';

  html += '<div class="pause-tabs">';
  html += '<button class="pause-tab' + (pauseTab === 'resume' ? ' active' : '') + '" onclick="switchPauseTab(\'resume\')">Resume</button>';
  html += '<button class="pause-tab' + (pauseTab === 'inventory' ? ' active' : '') + '" onclick="switchPauseTab(\'inventory\')">\ud83c\udf92 Inventory</button>';
  html += '<button class="pause-tab' + (pauseTab === 'skills' ? ' active' : '') + '" onclick="switchPauseTab(\'skills\')">\u2b50 Skills' + (availablePts > 0 ? ' <span class="tab-badge">' + availablePts + '</span>' : '') + '</button>';
  html += '</div>';

  html += '<div class="pause-content">';
  if(pauseTab === 'resume') {
    html += renderPauseResume();
  } else if(pauseTab === 'inventory') {
    html += renderPauseInventory(saveData);
  } else if(pauseTab === 'skills') {
    html += renderPauseSkills(saveData);
  }
  html += '</div>';

  screen.innerHTML = html;
}

function renderPauseResume() {
  let h = '<div class="pause-resume-panel">';
  h += '<div class="screen-title" style="font-size:clamp(1.5rem,5vw,2.5rem)">Paused</div>';
  h += '<button class="btn" onclick="togglePause()">Resume</button>';
  h += '<div style="margin-top:16px;opacity:0.5;font-size:0.85rem">Press ESC to resume</div>';
  h += '</div>';
  return h;
}

function renderPauseInventory(saveData) {
  const equipped = saveData.equipped || [];
  const inventory = saveData.inventory || [];
  let h = '';

  h += '<div class="inv-section-label">Equipped (3 slots)</div>';
  h += '<div class="inv-equipped-row">';
  for(let i = 0; i < 3; i++) {
    const itemId = equipped[i] || null;
    const loot = itemId ? getLootById(itemId) : null;
    if(loot) {
      const rc = RARITY_CONFIG[loot.rarity];
      h += '<div class="inv-slot equipped filled" style="border-color:' + rc.color + '" onclick="pauseUnequip(' + i + ')" title="Click to unequip">';
      h += '<div class="inv-slot-icon">' + loot.icon + '</div>';
      h += '<div class="inv-slot-name" style="color:' + rc.color + '">' + loot.name + '</div>';
      h += '<div class="inv-slot-desc">' + loot.desc + '</div>';
      h += '</div>';
    } else {
      h += '<div class="inv-slot equipped empty"><div class="inv-slot-icon" style="opacity:0.3">--</div><div class="inv-slot-name" style="opacity:0.3">Empty</div></div>';
    }
  }
  h += '</div>';

  const maxSlots = saveData.inventorySlots || 6;
  const stacks = {};
  inventory.forEach(id => { stacks[id] = (stacks[id] || 0) + 1; });
  const uniqueItems = Object.keys(stacks);

  h += '<div class="inv-section-label">Inventory (' + uniqueItems.length + '/' + maxSlots + ' slots)</div>';
  h += '<div class="inv-grid">';
  for(let i = 0; i < maxSlots; i++) {
    const itemId = uniqueItems[i] || null;
    const loot = itemId ? getLootById(itemId) : null;
    if(loot) {
      const rc = RARITY_CONFIG[loot.rarity];
      const count = stacks[itemId];
      const isEquipped = equipped.includes(itemId);
      h += '<div class="inv-slot grid-slot filled" style="border-color:' + rc.color + '">';
      h += '<div class="inv-slot-icon">' + loot.icon + (count > 1 ? '<span class="inv-count">x' + count + '</span>' : '') + '</div>';
      h += '<div class="inv-slot-name" style="color:' + rc.color + '">' + loot.name + '</div>';
      h += '<div class="inv-slot-desc">' + loot.desc + '</div>';
      h += '<div class="inv-slot-actions">';
      if(!isEquipped && equipped.length < 3) {
        h += '<button class="inv-btn equip" onclick="pauseEquip(\'' + itemId + '\')">Equip</button>';
      } else if(isEquipped) {
        h += '<span class="inv-equipped-badge">Equipped</span>';
      }
      const salvageVal = SALVAGE_VALUES[loot.rarity] || 5;
      h += '<button class="inv-btn salvage" onclick="pauseSalvage(\'' + itemId + '\')" title="Salvage for ' + salvageVal + 'g">Salvage ' + salvageVal + 'g</button>';
      h += '</div>';
      h += '</div>';
    } else {
      h += '<div class="inv-slot grid-slot empty"><div class="inv-slot-icon" style="opacity:0.2">-</div></div>';
    }
  }
  h += '</div>';
  return h;
}

function renderPauseSkills(saveData) {
  const st = saveData.skillTree || {};
  const spentPts = Object.keys(st).filter(k => st[k]).length;
  const availablePts = (saveData.skillPoints || 0) - spentPts;

  let h = '';
  h += '<div class="skills-header">Skill Points: <span style="color:#ffd700;font-weight:bold">' + availablePts + '</span></div>';

  for(const branchKey of Object.keys(SKILL_TREE_DEF)) {
    const branch = SKILL_TREE_DEF[branchKey];
    h += '<div class="skill-branch">';
    h += '<div class="skill-branch-label" style="color:' + branch.color + '">' + branch.icon + ' ' + branch.label + '</div>';
    h += '<div class="skill-branch-nodes">';
    for(let i = 0; i < branch.nodes.length; i++) {
      const node = branch.nodes[i];
      const unlocked = !!st[node.id];
      const prevUnlocked = i === 0 || !!st[branch.nodes[i - 1].id];
      const canUnlock = !unlocked && prevUnlocked && availablePts > 0;
      let cls = 'skill-node';
      if(unlocked) cls += ' unlocked';
      else if(canUnlock) cls += ' available';
      else cls += ' locked';
      h += '<div class="' + cls + '" style="--branch-color:' + branch.color + '"' + (canUnlock ? ' onclick="pauseUnlockSkill(\'' + node.id + '\')"' : '') + '>';
      h += '<div class="skill-node-name">' + node.name + '</div>';
      h += '<div class="skill-node-desc">' + node.desc + '</div>';
      if(unlocked) h += '<div class="skill-node-badge">\u2713</div>';
      h += '</div>';
      if(i < branch.nodes.length - 1) {
        h += '<div class="skill-connector" style="background:' + (unlocked ? branch.color : '#333') + '"></div>';
      }
    }
    h += '</div>';
    h += '</div>';
  }
  return h;
}

function pauseEquip(itemId) {
  const saveData = SaveManager.load();
  if(!saveData.equipped) saveData.equipped = [];
  if(saveData.equipped.length >= 3) return;
  if(saveData.equipped.includes(itemId)) return;
  saveData.equipped.push(itemId);
  SaveManager.save(saveData);
  renderPauseMenu();
}

function pauseUnequip(slotIdx) {
  const saveData = SaveManager.load();
  if(!saveData.equipped || slotIdx >= saveData.equipped.length) return;
  saveData.equipped.splice(slotIdx, 1);
  SaveManager.save(saveData);
  renderPauseMenu();
}

function pauseSalvage(itemId) {
  const saveData = SaveManager.load();
  const loot = getLootById(itemId);
  if(!loot) return;
  const idx = saveData.inventory.indexOf(itemId);
  if(idx === -1) return;
  saveData.inventory.splice(idx, 1);
  const eqIdx = saveData.equipped.indexOf(itemId);
  if(eqIdx !== -1) saveData.equipped.splice(eqIdx, 1);
  const salvageGold = SALVAGE_VALUES[loot.rarity] || 5;
  saveData.gold += salvageGold;
  runGold += salvageGold;
  SaveManager.save(saveData);
  renderPauseMenu();
}

function pauseUnlockSkill(skillId) {
  const saveData = SaveManager.load();
  if(!saveData.skillTree) saveData.skillTree = {};
  const spentPts = Object.keys(saveData.skillTree).filter(k => saveData.skillTree[k]).length;
  const availablePts = (saveData.skillPoints || 0) - spentPts;
  if(availablePts <= 0) return;
  if(saveData.skillTree[skillId]) return;
  for(const branchKey of Object.keys(SKILL_TREE_DEF)) {
    const nodes = SKILL_TREE_DEF[branchKey].nodes;
    for(let i = 0; i < nodes.length; i++) {
      if(nodes[i].id === skillId) {
        if(i > 0 && !saveData.skillTree[nodes[i - 1].id]) return;
        break;
      }
    }
  }
  saveData.skillTree[skillId] = true;
  SaveManager.save(saveData);
  _diffCacheDirty = true;
  applySkillToPlayer(skillId);
  renderPauseMenu();
}

function applySkillToPlayer(skillId) {
  const node = findSkillNode(skillId);
  if (node && node.apply) node.apply(player);
}

function reapplyEquippedItems() {
  const saveData = SaveManager.load();
  const equippedItems = saveData.equipped || [];
  const permUpgrades = saveData.upgrades || {};
  const skillTree = saveData.skillTree || {};

  let baseMaxHp = 100, baseSpeed = 150, baseDamage = 1, baseAttackSpeed = 1;
  let baseDefense = 1, basePickup = 60, baseDashDist = 1, baseDashCdReduction = 0;
  let baseCritChance = 0, baseCritDamage = 0, baseLifesteal = 0, baseXpMult = 0;

  for(const [uid, upg] of Object.entries(permUpgrades)) {
    if(upg.stat === 'maxHp' && typeof upg.bonus === 'number') baseMaxHp += upg.bonus;
    if(upg.stat === 'speed' && typeof upg.mult === 'number') baseSpeed *= upg.mult;
    if(upg.stat === 'damage' && typeof upg.mult === 'number') baseDamage *= upg.mult;
    if(upg.stat === 'attackSpeed' && typeof upg.mult === 'number') baseAttackSpeed *= upg.mult;
    if(upg.stat === 'defense' && typeof upg.mult === 'number') baseDefense *= upg.mult;
    if(upg.stat === 'pickupRadius' && typeof upg.bonus === 'number') basePickup += upg.bonus;
  }
  if(permUpgrades.p_regen) { player.permRegen = true; }
  if(permUpgrades.p_critchance) baseCritChance += 0.05;
  if(permUpgrades.p_lifesteal) baseLifesteal += 0.01;
  if(permUpgrades.p_xpboost) baseXpMult = 1.10;

  // Reset boolean skill flags before re-applying
  player.permMultiProjectile = false;
  player.permPiercing = false;
  player.permShieldOnDash = false;
  player.permSecondLife = false;
  player.permHeadshot = false;
  player.permOverdrive = false;
  player.permExplosiveRounds = false;
  player.permAutoTurret = false;
  player.permDrone = false;
  player.permEmpBurst = false;
  player.permBloodFrenzy = false;
  player.permDeathAura = false;
  player.permSkeletons = 0; player.permSkeletonMage = false; player.permArmyOfDarkness = false;
  player.permFortify = false;
  player.permVampiricNova = false;
  player.permPoison = false; player.permVirulent = false;
  player.permRootSnare = false; player.permOvergrowth = false;
  player.permDoubleDash = false; player.permPhantomStep = false;
  player.permTraps = 0; player.permTrapMastery = false;
  player.permNetLauncher = false;
  player.permPullAura = false; player.permGravityWell = false;
  player.permMassIncrease = false; player.permBlackHole = false;
  player.permTimeBubble = false; player.permRewind = false;
  player.permTemporalLoop = false;
  player.permVoidBolt = false; player.permSingularity = false;

  // Build a temporary player-like object for skill application, then extract stat deltas
  // We apply skills directly to player since they set flags + modify base stats
  // First store current base values, apply skills, then extract the numeric changes
  const _preDefense = baseDefense;
  const _preSpeed = baseSpeed;
  player.defense = baseDefense;
  player.speed = baseSpeed;
  player.evasionChance = 0;
  player.abilityPowerMult = 1;
  player.cooldownMult = 1;
  player.permCritChance = baseCritChance;
  player.permCritDamage = baseCritDamage;
  player.permLifesteal = baseLifesteal;
  player.permXpMult = baseXpMult;
  player.dashDistance = baseDashDist;
  player.dashCooldownReduction = baseDashCdReduction;
  player.pickupRadius = basePickup;
  applyAllSkills(player, skillTree);
  // Extract the modified values back to base accumulators
  baseDefense = player.defense;
  baseSpeed = player.speed;
  baseCritChance = player.permCritChance;
  baseCritDamage = player.permCritDamage;
  baseLifesteal = player.permLifesteal;
  baseXpMult = player.permXpMult;
  baseDashDist = player.dashDistance;
  baseDashCdReduction = player.dashCooldownReduction;
  basePickup = player.pickupRadius;

  player.permBerserker = null;
  const skillThorns = player.permThorns || 0; // preserve thorns from skill tree
  player.permThorns = skillThorns;
  player.permPhoenixRevive = false;
  for(const itemId of equippedItems) {
    const loot = getLootById(itemId);
    if(!loot) continue;
    const ef = loot.effect;
    if(!ef) continue;
    if(ef.stat === 'maxHp' && typeof ef.bonus === 'number') {
      baseMaxHp += ef.bonus;
      if(ef.regen) { player.permRegen = true; }
    }
    if(ef.stat === 'speed' && typeof ef.mult === 'number') baseSpeed *= ef.mult;
    if(ef.stat === 'damage' && typeof ef.mult === 'number') baseDamage *= ef.mult;
    if(ef.stat === 'attackSpeed' && typeof ef.mult === 'number') baseAttackSpeed *= ef.mult;
    if(ef.stat === 'defense' && typeof ef.mult === 'number') baseDefense *= ef.mult;
    if(ef.stat === 'pickupRadius' && typeof ef.bonus === 'number') basePickup += ef.bonus;
    if(ef.stat === 'lifesteal') baseLifesteal += ef.value;
    if(ef.stat === 'critChance') baseCritChance += ef.value;
    if(ef.stat === 'xpMult') baseXpMult = (baseXpMult || 1) * ef.value;
    if(ef.stat === 'dashCooldown') baseDashCdReduction += ef.value;
    if(ef.stat === 'berserker') player.permBerserker = { threshold: ef.threshold, mult: ef.mult };
    if(ef.stat === 'phoenixRevive') player.permPhoenixRevive = true;
    if(ef.stat === 'thornsDamage') player.permThorns = (player.permThorns || 0) + ef.value;
    if(ef.stat === 'voidPower') {
      baseDamage *= ef.damageMult;
      baseMaxHp = Math.floor(baseMaxHp * ef.hpMult);
    }
  }

  for(const pName of player.passives) {
    const passive = THEME.passives.find(p => p.name === pName);
    if(!passive) continue;
    if(passive.stat === 'maxHp' && passive.mult) baseMaxHp *= passive.mult;
    if(passive.stat === 'speed' && passive.mult) baseSpeed *= passive.mult;
    if(passive.stat === 'damage' && passive.mult) baseDamage *= passive.mult;
    if(passive.stat === 'attackSpeed' && passive.mult) baseAttackSpeed *= passive.mult;
    if(passive.stat === 'defense' && passive.mult) baseDefense *= passive.mult;
    if(passive.stat === 'pickupRadius' && passive.mult) basePickup *= passive.mult;
  }

  const hpRatio = player.maxHp > 0 ? player.hp / player.maxHp : 1;
  player.maxHp = baseMaxHp;
  player.hp = Math.min(Math.round(hpRatio * baseMaxHp), baseMaxHp);
  player.speed = baseSpeed;
  player.damage = baseDamage;
  player.attackSpeed = baseAttackSpeed;
  player.defense = baseDefense;
  player.pickupRadius = basePickup;
  player.dashDistance = baseDashDist;
  player.dashCooldownReduction = baseDashCdReduction;
  player.permCritChance = baseCritChance;
  player.permCritDamage = baseCritDamage;
  player.permLifesteal = baseLifesteal;
  player.permXpMult = baseXpMult;
}

// Inject weapon affinity CSS styles
(function injectAffinityStyles() {
  const s = document.createElement('style');
  s.textContent = [
    '.upgrade-card.affinity-primary{border-color:#ffd700;box-shadow:0 0 12px rgba(255,215,0,0.3)}',
    '.upgrade-card.affinity-secondary{border-color:#aabbcc;box-shadow:0 0 8px rgba(170,187,204,0.2)}',
    '.upgrade-card.affinity-offclass{border-color:#555;opacity:0.8}',
    '.upgrade-card.affinity-offclass:hover{opacity:1}',
    '.affinity-tag{position:absolute;top:8px;left:10px;font-size:0.65rem;font-weight:700;padding:2px 6px;border-radius:3px;letter-spacing:0.5px;text-transform:uppercase}',
    '.affinity-tag-primary{background:rgba(255,215,0,0.25);color:#ffd700;border:1px solid rgba(255,215,0,0.4)}',
    '.affinity-tag-secondary{background:rgba(170,187,204,0.2);color:#aabbcc;border:1px solid rgba(170,187,204,0.3)}',
    '.affinity-tag-offclass{background:rgba(100,100,100,0.2);color:#888;border:1px solid rgba(100,100,100,0.3)}',
    '.weapon-slot.weapon-affinity-primary{border-color:#ffd700;box-shadow:0 0 8px rgba(255,215,0,0.5)}',
    '.weapon-slot.weapon-affinity-secondary{border-color:#aabbcc;box-shadow:0 0 6px rgba(170,187,204,0.3)}',
    '.weapon-slot.weapon-affinity-offclass{border-color:#666;box-shadow:none;opacity:0.75}'
  ].join('\n');
  document.head.appendChild(s);
})();

// Button handlers
document.getElementById('btn-start').addEventListener('click', startGame);
document.getElementById('btn-restart').addEventListener('click', startGame);
// btn-resume click is now handled inside the dynamically rendered pause menu

// Start loop
requestAnimationFrame(gameLoop);
