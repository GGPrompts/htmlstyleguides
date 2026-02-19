window.THEME = {
  name: 'Gothic Survivors',
  fonts: { title: 'Cinzel', body: 'Crimson Text' },
  victoryCondition: { timeSeconds: 420, bossName: 'The Pale One' },
  worldOrder: { current: 1, next: 'shop.html?world=forest' },
  song: '../../music/audio-tracker/songs/survivors-gothic.json',
  palette: {
    bg: '#0a0a0f', bgLight: '#1a1020', accent: '#8b0000',
    gold: '#d4af37', bone: '#e8dcc8', emerald: '#2e8b57',
    purple: '#6b2fa0', blood: '#cc3333', midnight: '#0d0d1a',
    floorBase: '#1a1420', floorLine: '#251830'
  },
  effectColors: {
    field: { fillRgb: '212,175,55', strokeRgb: '212,175,55' },
    orbit: { ring: 'rgba(212,175,55,0.15)', orb: '#d4af37' },
    area: { rgb: '212,175,55' },
    beam: { rgb: '255,220,100', glow: '#ffd866' },
    chain: { rgb: '119,187,255', particle: '#77bbff' },
    damageFlash: { rgb: '180,0,0' },
    invuln: { rgb: '255,255,255' },
    rain: { particle: '#ff6633' }
  },
  enemies: [
    { name:'Skeleton', color:'#c8b89a', size:14, speed:55, hp:3, xp:1, spawnAfter:0, draw:'skeleton', movementType:'chase' },
    { name:'Zombie', color:'#5a7a5a', size:16, speed:35, hp:6, xp:2, spawnAfter:0, draw:'zombie', movementType:'chase' },
    { name:'Ghost', color:'rgba(180,180,220,0.6)', size:13, speed:70, hp:2, xp:2, spawnAfter:30, draw:'ghost', movementType:'orbit' },
    { name:'Wraith', color:'#6633aa', size:15, speed:80, hp:4, xp:3, spawnAfter:90, draw:'wraith', movementType:'strafe' },
    { name:'Shadow Stalker', color:'#332244', size:14, speed:88, hp:5, xp:3, spawnAfter:120, draw:'stalker', movementType:'flanker' },
    { name:'Vampire', color:'#aa2222', size:15, speed:90, hp:8, xp:5, spawnAfter:180, draw:'vampire', movementType:'ambush' },
    { name:'Gargoyle', color:'#777788', size:16, speed:60, hp:7, xp:4, spawnAfter:180, draw:'gargoyle', movementType:'divebomber' },
    { name:'Dark Knight', color:'#556677', size:18, speed:35, hp:15, xp:5, spawnAfter:240, draw:'darkknight', movementType:'shieldbearer' },
    { name:'Lich', color:'#44ddaa', size:17, speed:60, hp:15, xp:8, spawnAfter:300, draw:'lich', movementType:'charge' }
  ],
  bosses: [
    { name:'Bone Colossus', color:'#ddd0b8', size:50, speed:30, hp:200, xp:50, spawnAt:120, attackPattern:'shockwave' },
    { name:'Death Knight', color:'#444466', size:45, speed:45, hp:400, xp:80, spawnAt:240, attackPattern:'charge' },
    { name:'Arch-Lich', color:'#33cc99', size:48, speed:50, hp:700, xp:120, spawnAt:360, attackPattern:'summon' },
    { name:'The Pale One', color:'#eeeeff', size:55, speed:55, hp:1200, xp:200, spawnAt:480, attackPattern:'beam' }
  ],
  weapons: [
    { name:'Holy Bolt', desc:'Fires a bolt of light', icon:'\u2720', type:'projectile' },
    { name:'Guardian Spirit', desc:'Orbiting spirit shield', icon:'\u2748', type:'orbit' },
    { name:'Divine Nova', desc:'Expanding holy blast', icon:'\u2600', type:'area' },
    { name:'Chain Lightning', desc:'Bounces between foes', icon:'\u26A1', type:'chain' },
    { name:'Purifying Ray', desc:'Sustained beam of light', icon:'\u2604', type:'beam' },
    { name:'Meteor Shower', desc:'Holy fire from above', icon:'\u2604', type:'rain' },
    { name:'Chakram of Light', desc:'Returning blade of dawn', icon:'\u25C9', type:'boomerang' },
    { name:'Consecrated Ground', desc:'Hallowed earth zone', icon:'\u2742', type:'field' }
  ],
  passives: [
    { name:'Vitality', desc:'+20% Max HP', icon:'\u2665', stat:'maxHp', mult:1.2 },
    { name:'Swiftness', desc:'+15% Move Speed', icon:'\u27A4', stat:'speed', mult:1.15 },
    { name:'Magnetism', desc:'+40% Pickup Range', icon:'\u2609', stat:'pickupRadius', mult:1.4 },
    { name:'Might', desc:'+20% Damage', icon:'\u2694', stat:'damage', mult:1.2 },
    { name:'Haste', desc:'+15% Attack Speed', icon:'\u231A', stat:'attackSpeed', mult:1.15 },
    { name:'Armor', desc:'-15% Damage Taken', icon:'\u26E8', stat:'defense', mult:0.85 }
  ],
  drawPlayer(ctx, x, y, r, time) {
    // Robed figure
    ctx.save();
    ctx.translate(x, y);
    // Cloak
    ctx.beginPath();
    ctx.moveTo(-r*0.7, -r*0.3);
    ctx.lineTo(-r*0.9, r);
    ctx.lineTo(r*0.9, r);
    ctx.lineTo(r*0.7, -r*0.3);
    ctx.closePath();
    ctx.fillStyle = '#2a1a3a';
    ctx.fill();
    // Body
    ctx.beginPath();
    ctx.arc(0, -r*0.1, r*0.65, 0, Math.PI*2);
    ctx.fillStyle = '#3a2a4a';
    ctx.fill();
    // Head
    ctx.beginPath();
    ctx.arc(0, -r*0.7, r*0.35, 0, Math.PI*2);
    ctx.fillStyle = '#e8dcc8';
    ctx.fill();
    // Eyes glow
    const glow = 0.5 + 0.5*Math.sin(time*3);
    ctx.fillStyle = `rgba(212,175,55,${0.6+glow*0.4})`;
    ctx.beginPath();
    ctx.arc(-r*0.12, -r*0.75, 2.5, 0, Math.PI*2);
    ctx.arc(r*0.12, -r*0.75, 2.5, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  },
  drawEnemy(ctx, e, time) {
    const {x, y, size, type} = e;
    ctx.save();
    ctx.translate(x, y);
    const s = size;
    if(type.draw==='skeleton') {
      ctx.fillStyle = type.color;
      ctx.beginPath(); ctx.arc(0, -s*0.4, s*0.4, 0, Math.PI*2); ctx.fill();
      ctx.fillRect(-s*0.25, -s*0.1, s*0.5, s*0.8);
      ctx.fillStyle='#333';
      ctx.fillRect(-s*0.15, -s*0.5, s*0.08, s*0.08);
      ctx.fillRect(s*0.07, -s*0.5, s*0.08, s*0.08);
    } else if(type.draw==='zombie') {
      ctx.fillStyle = type.color;
      ctx.beginPath(); ctx.arc(0, -s*0.3, s*0.45, 0, Math.PI*2); ctx.fill();
      ctx.fillRect(-s*0.3, 0, s*0.6, s*0.6);
      ctx.fillStyle='#2a4a2a';
      ctx.fillRect(-s*0.3, 0.1*s, s*0.6, s*0.3);
    } else if(type.draw==='ghost') {
      const a = 0.4+0.3*Math.sin(time*4+e.spawnTime);
      ctx.globalAlpha = a;
      ctx.fillStyle = '#b4b4dc';
      ctx.beginPath(); ctx.arc(0, -s*0.2, s*0.5, Math.PI, 0);
      ctx.lineTo(s*0.5, s*0.5);
      for(let i=0;i<5;i++){
        const px = s*0.5 - i*(s/5);
        ctx.lineTo(px - s*0.1, s*0.3 + (i%2)*s*0.2);
      }
      ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
    } else if(type.draw==='wraith') {
      ctx.fillStyle = '#6633aa';
      ctx.shadowColor = '#9955ff';
      ctx.shadowBlur = 15;
      ctx.beginPath(); ctx.arc(0, 0, s*0.5, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#cc77ff';
      ctx.beginPath(); ctx.arc(-s*0.15,-s*0.1,3,0,Math.PI*2); ctx.arc(s*0.15,-s*0.1,3,0,Math.PI*2); ctx.fill();
    } else if(type.draw==='vampire') {
      ctx.fillStyle = '#1a0a0a';
      ctx.beginPath();
      ctx.moveTo(-s*0.8, -s*0.2);
      ctx.lineTo(-s*0.3, -s*0.6);
      ctx.lineTo(s*0.3, -s*0.6);
      ctx.lineTo(s*0.8, -s*0.2);
      ctx.lineTo(s*0.3, s*0.4);
      ctx.lineTo(-s*0.3, s*0.4);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = type.color;
      ctx.beginPath(); ctx.arc(0, -s*0.3, s*0.3, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle='#ff3333';
      ctx.beginPath(); ctx.arc(-s*0.1,-s*0.3,2.5,0,Math.PI*2); ctx.arc(s*0.1,-s*0.3,2.5,0,Math.PI*2); ctx.fill();
    } else if(type.draw==='lich') {
      ctx.fillStyle = '#1a3a2a';
      ctx.beginPath(); ctx.arc(0, 0, s*0.55, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = type.color;
      ctx.shadowColor = type.color; ctx.shadowBlur = 20;
      ctx.beginPath(); ctx.arc(0, -s*0.15, s*0.35, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#001a0d';
      ctx.beginPath(); ctx.arc(-s*0.1,-s*0.2,3,0,Math.PI*2); ctx.arc(s*0.1,-s*0.2,3,0,Math.PI*2); ctx.fill();
    } else if(type.draw==='stalker') {
      // Dark shadowy figure with glowing eyes
      ctx.fillStyle = type.color;
      ctx.shadowColor = '#6633aa';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(0, -s*0.5);
      ctx.lineTo(s*0.4, s*0.4);
      ctx.lineTo(-s*0.4, s*0.4);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      // Glowing eyes
      ctx.fillStyle = '#ff3366';
      ctx.beginPath(); ctx.arc(-s*0.1, -s*0.1, 2, 0, Math.PI*2); ctx.arc(s*0.1, -s*0.1, 2, 0, Math.PI*2); ctx.fill();
    } else if(type.draw==='gargoyle') {
      // Winged stone creature
      const hover = Math.sin(time * 3 + e.spawnTime) * 3;
      ctx.translate(0, hover);
      ctx.fillStyle = type.color;
      ctx.beginPath(); ctx.arc(0, 0, s*0.4, 0, Math.PI*2); ctx.fill();
      // Wings
      ctx.fillStyle = '#555566';
      ctx.beginPath();
      ctx.moveTo(-s*0.3, -s*0.1); ctx.lineTo(-s*0.7, -s*0.4); ctx.lineTo(-s*0.2, s*0.1);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(s*0.3, -s*0.1); ctx.lineTo(s*0.7, -s*0.4); ctx.lineTo(s*0.2, s*0.1);
      ctx.closePath(); ctx.fill();
      // Eyes
      ctx.fillStyle = '#ff4400';
      ctx.beginPath(); ctx.arc(-s*0.1, -s*0.05, 2, 0, Math.PI*2); ctx.arc(s*0.1, -s*0.05, 2, 0, Math.PI*2); ctx.fill();
    } else if(type.draw==='darkknight') {
      // Armored knight shape with shield
      ctx.fillStyle = type.color;
      ctx.fillRect(-s*0.35, -s*0.5, s*0.7, s*0.9);
      // Helmet
      ctx.fillStyle = '#334455';
      ctx.beginPath(); ctx.arc(0, -s*0.35, s*0.3, Math.PI, 0); ctx.fill();
      // Visor slit
      ctx.fillStyle = '#cc2222';
      ctx.fillRect(-s*0.15, -s*0.35, s*0.3, 3);
    }
    ctx.restore();
  },
  drawBoss(ctx, e, time) {
    const {x, y, size} = e;
    ctx.save();
    ctx.translate(x, y);
    const s = size;
    ctx.fillStyle = e.type.color;
    ctx.shadowColor = e.type.color;
    ctx.shadowBlur = 30;
    ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    // Inner details
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.arc(0, 0, s*0.7, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = e.type.color;
    ctx.beginPath(); ctx.arc(0, 0, s*0.4, 0, Math.PI*2); ctx.fill();
    // Eyes
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(-s*0.2, -s*0.15, s*0.1, 0, Math.PI*2);
    ctx.arc(s*0.2, -s*0.15, s*0.1, 0, Math.PI*2);
    ctx.fill();
    // HP bar
    const hpPct = e.hp / e.maxHp;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(-s, -s-14, s*2, 8);
    ctx.fillStyle = hpPct > 0.5 ? '#cc3333' : '#ff6600';
    ctx.fillRect(-s, -s-14, s*2*hpPct, 8);
    ctx.strokeStyle = '#888';
    ctx.strokeRect(-s, -s-14, s*2, 8);
    // Name
    ctx.fillStyle = '#d4af37';
    ctx.font = '12px Cinzel';
    ctx.textAlign = 'center';
    ctx.fillText(e.type.name, 0, -s-18);
    ctx.restore();
  },
  drawBackground(ctx, cam, W, H, time) {
    // Dark stone floor with grid
    ctx.fillStyle = THEME.palette.floorBase;
    ctx.fillRect(0, 0, W, H);
    const gs = 64;
    const ox = (-cam.x % gs + gs) % gs;
    const oy = (-cam.y % gs + gs) % gs;
    ctx.strokeStyle = THEME.palette.floorLine;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;
    for(let x = ox; x < W; x += gs) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for(let y = oy; y < H; y += gs) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // Occasional torch-like flicker spots
    const flickerT = time * 2;
    for(let i = 0; i < 6; i++) {
      const tx = ((i * 347 + 100) % 1200) - cam.x % 1200;
      const ty = ((i * 521 + 200) % 900) - cam.y % 900;
      const flicker = 0.15 + 0.1 * Math.sin(flickerT + i * 1.7);
      const grd = ctx.createRadialGradient(tx, ty, 0, tx, ty, 120);
      grd.addColorStop(0, `rgba(200,120,40,${flicker})`);
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.fillRect(tx-120, ty-120, 240, 240);
    }
  },
  drawProjectile(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    if(p.weaponType === 'projectile') {
      ctx.fillStyle = '#d4af37';
      ctx.shadowColor = '#d4af37'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(0,0,4+p.level,0,Math.PI*2); ctx.fill();
    } else if(p.weaponType === 'chain') {
      ctx.strokeStyle = '#77bbff';
      ctx.shadowColor = '#77bbff'; ctx.shadowBlur = 12;
      ctx.lineWidth = 2 + p.level;
      ctx.beginPath(); ctx.moveTo(-8,0); ctx.lineTo(8,0); ctx.stroke();
    } else if(p.weaponType === 'rain') {
      ctx.fillStyle = '#ff6633';
      ctx.shadowColor = '#ff3300'; ctx.shadowBlur = 15;
      ctx.beginPath(); ctx.arc(0,0,6+p.level*2,0,Math.PI*2); ctx.fill();
    } else if(p.weaponType === 'boomerang') {
      ctx.fillStyle = '#d4af37';
      ctx.rotate(p.angle || 0);
      ctx.beginPath();
      ctx.arc(0,-4,5+p.level,0,Math.PI);
      ctx.arc(0,4,5+p.level,Math.PI,0);
      ctx.fill();
    }
    ctx.restore();
  },
  drawGem(ctx, g, time) {
    const pulse = 1 + 0.15*Math.sin(time*5 + g.x);
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = g.value > 5 ? '#d4af37' : g.value > 2 ? '#2e8b57' : '#6b2fa0';
    ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(0, -5); ctx.lineTo(5, 0); ctx.lineTo(0, 5); ctx.lineTo(-5, 0);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  },
  classConfig: {
    classId: 'darkknight',
    className: 'Dark Knight',
    classIcon: '\u2694\uFE0F',
    classDesc: 'Melee bruiser. Thrives in close combat with lifesteal and AoE.',
    startingStats: { hp: 120, speed: 140, damage: 1.0, defense: 1.2 },
    weaponAffinities: {
      primary: ['area', 'chain', 'field'],
      secondary: ['orbit', 'beam']
    },
    classPassive: { id: 'blood_pact', name: 'Blood Pact', desc: '+8% lifesteal, +10% AoE size', effect: { lifestealBonus: 0.08, aoeSizeMult: 1.10 } },
    signatureAbility: { name: 'Blood Ritual', desc: 'Sacrifice 20% HP, 6 blood explosions', icon: '\uD83E\uDE78', cooldown: 60, duration: 0 }
  },

  ui: {
    title: 'Gothic Survivors',
    subtitle: 'Survive the Endless Night',
    gameOverTitle: 'Death Claims You',
    levelUpSubtitle: 'Choose your blessing',
    victoryTitleColor: '#d4af37',
    victorySubtitle: 'The Darkness has been vanquished',
    victoryNextText: 'Warping to next world...',
    victoryNextColor: '#8b0000',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Crimson+Text:ital,wght@0,400;0,700;1,400&display=swap'
  },

  cssVars: {
    '--bg': '#0a0a0f',
    '--body-font': "'Crimson Text',serif",
    '--body-color': '#e8dcc8',
    '--title-font': "'Cinzel',serif",
    '--title-weight': '900',
    '--hud-shadow': 'rgba(180,30,30,0.6)',
    '--gold': '#d4af37',
    '--accent': '#8b0000',
    '--xp-start': '#6b2fa0',
    '--xp-end': '#d4af37',
    '--hp-start': '#8b0000',
    '--hp-end': '#cc3333',
    '--gold-glow': 'rgba(212,175,55,0.5)',
    '--title-bg-inner': '#1a0a0a',
    '--title-bg-outer': '#0a0a0f',
    '--overlay-rgb': '5,0,0',
    '--screen-title-shadow': '0 0 40px rgba(139,0,0,0.6),0 0 80px rgba(139,0,0,0.3)',
    '--subtitle-style': 'italic',
    '--btn-bg': 'rgba(139,0,0,0.3)',
    '--btn-hover-bg': 'rgba(139,0,0,0.6)',
    '--btn-hover-shadow': 'rgba(212,175,55,0.4)',
    '--stats-color': '#b0a090',
    '--card-bg': 'rgba(20,10,10,0.9)',
    '--hint-color': '#777'
  },

  shopConfig: {
    title: "Dark Knight\u2019s Sanctum",
    subtitle: 'Embrace the darkness, Dark Knight',
    goldIcon: '\u2620',
    nextWorld: { label: 'the Gothic Realm', url: 'arena.html?world=gothic' },
    continueVerb: 'Descend into',
    categories: {
      stats: { icon: '\u2620', label: 'Dark Arts' },
      weapons: { icon: '\u2694', label: 'Cursed Armaments' },
      passives: { icon: '\u2728', label: 'Forbidden Rites' },
      skills: { icon: '\uD83C\uDF33', label: 'Skill Tree' },
      inventory: { icon: '\uD83C\uDF92', label: 'Inventory' }
    },
    emptyInventoryMsg: 'No relics yet. Slay the darkness to claim its treasures.',
    statUpgrades: [
      { id: 'hp1', name: 'Blood Tonic I',       desc: '+20 Max HP. Brewed from nightshade and grave moss.',  icon: '\u2665', cost: 150,  stat: 'maxHp', bonus: 20 },
      { id: 'hp2', name: 'Blood Tonic II',      desc: '+20 Max HP. Distilled with marrow from the crypt.',  icon: '\u2665', cost: 400,  stat: 'maxHp', bonus: 20, requires: 'hp1' },
      { id: 'hp3', name: 'Blood Tonic III',     desc: '+20 Max HP. Infused with a vampire\'s sigh.',        icon: '\u2665', cost: 1000, stat: 'maxHp', bonus: 20, requires: 'hp2' },
      { id: 'hp4', name: 'Blood Tonic IV',      desc: '+20 Max HP. Sealed with a saint\'s bone.',           icon: '\u2665', cost: 2000, stat: 'maxHp', bonus: 20, requires: 'hp3' },
      { id: 'hp5', name: 'Blood Tonic V',       desc: '+20 Max HP. The final draught. Do not ask the cost.', icon: '\u2665', cost: 4000, stat: 'maxHp', bonus: 20, requires: 'hp4' },
      { id: 'def1', name: 'Ossuary Ward I',     desc: '+10% Defense. Woven from crypt spider silk.',        icon: '\u26E8', cost: 150,  stat: 'defense', mult: 0.90 },
      { id: 'def2', name: 'Ossuary Ward II',    desc: '+10% Defense. Reinforced with iron coffin nails.',   icon: '\u26E8', cost: 400,  stat: 'defense', mult: 0.90, requires: 'def1' },
      { id: 'def3', name: 'Ossuary Ward III',   desc: '+10% Defense. Blessed by a defrocked priest.',       icon: '\u26E8', cost: 1000, stat: 'defense', mult: 0.90, requires: 'def2' },
      { id: 'def4', name: 'Ossuary Ward IV',    desc: '+10% Defense. Carved from a gargoyle\'s rib.',       icon: '\u26E8', cost: 2000, stat: 'defense', mult: 0.90, requires: 'def3' },
      { id: 'def5', name: 'Ossuary Ward V',     desc: '+10% Defense. You are become the cathedral wall.',   icon: '\u26E8', cost: 4000, stat: 'defense', mult: 0.90, requires: 'def4' },
      { id: 'dmg1', name: 'Blight Edge I',      desc: '+15% Damage. Coated in hemlock venom.',              icon: '\u2694', cost: 150,  stat: 'damage', mult: 1.15 },
      { id: 'dmg2', name: 'Blight Edge II',     desc: '+15% Damage. Tempered in a witch\'s cauldron.',      icon: '\u2694', cost: 400,  stat: 'damage', mult: 1.15, requires: 'dmg1' },
      { id: 'dmg3', name: 'Blight Edge III',    desc: '+15% Damage. Quenched in black cathedral wine.',     icon: '\u2694', cost: 1000, stat: 'damage', mult: 1.15, requires: 'dmg2' },
      { id: 'dmg4', name: 'Blight Edge IV',     desc: '+15% Damage. Etched with a dying curse.',            icon: '\u2694', cost: 2000, stat: 'damage', mult: 1.15, requires: 'dmg3' },
      { id: 'dmg5', name: 'Blight Edge V',      desc: '+15% Damage. It hungers. You feel it too.',          icon: '\u2694', cost: 4000, stat: 'damage', mult: 1.15, requires: 'dmg4' },
      { id: 'pick1', name: 'Grave Reach I',     desc: '+15 Pickup Range. The dead offer up their gifts.',   icon: '\u2609', cost: 150,  stat: 'pickupRadius', bonus: 15 },
      { id: 'pick2', name: 'Grave Reach II',    desc: '+15 Pickup Range. They crawl toward you now.',       icon: '\u2609', cost: 400,  stat: 'pickupRadius', bonus: 15, requires: 'pick1' },
      { id: 'pick3', name: 'Grave Reach III',   desc: '+15 Pickup Range. A magnetic pull from beyond.',     icon: '\u2609', cost: 1000, stat: 'pickupRadius', bonus: 15, requires: 'pick2' },
      { id: 'pick4', name: 'Grave Reach IV',    desc: '+15 Pickup Range. Nothing escapes your grasp.',      icon: '\u2609', cost: 2000, stat: 'pickupRadius', bonus: 15, requires: 'pick3' },
      { id: 'pick5', name: 'Grave Reach V',     desc: '+15 Pickup Range. The earth itself bows to you.',    icon: '\u2609', cost: 4000, stat: 'pickupRadius', bonus: 15, requires: 'pick4' }
    ],
    startingWeapons: [
      { id: 'w_orbit',      name: 'Spectral Chains',   desc: 'Start with orbiting phantom shackles',              icon: '\u2B21', cost: 400, weaponType: 'orbit' },
      { id: 'w_area',       name: 'Crypt Burst',       desc: 'Start with an eruption of sepulchral energy',       icon: '\u29BF', cost: 400, weaponType: 'area' },
      { id: 'w_field',      name: 'Hallowed Ground',   desc: 'Start with a persistent zone of consecrated agony', icon: '\u2742', cost: 400, weaponType: 'field' },
      { id: 'w_rain',       name: 'Gargoyle\'s Tears', desc: 'Start with stone tears falling from above',         icon: '\u2663', cost: 600, weaponType: 'rain' },
      { id: 'w_chain',      name: 'Soul Tether',       desc: 'Start with a chain of stolen spirits',              icon: '\u2301', cost: 600, weaponType: 'chain' },
      { id: 'w_beam',       name: 'Deathgaze',         desc: 'Start with a withering beam from the abyss',        icon: '\u2588', cost: 800, weaponType: 'beam' },
      { id: 'w_projectile', name: 'Bone Shard',        desc: 'Start with a hurled splinter of ancient bone',      icon: '\u2726', cost: 800, weaponType: 'projectile' },
      { id: 'w_boomerang',  name: 'Bat Fang Disc',     desc: 'Start with a returning disc of razor fangs',        icon: '\u25C9', cost: 800, weaponType: 'boomerang' }
    ],
    passives: [
      { id: 'p_lifesteal',  name: 'Vampiric Hunger',   desc: 'Heal 1% of damage dealt. Drink deep.',                   icon: '\u2764', cost: 400 },
      { id: 'p_regen',      name: 'Sanguine Pact',     desc: 'Recover 1 HP every 5 seconds. The wound closes itself.', icon: '\u2661', cost: 400 },
      { id: 'p_xpboost',    name: 'Memento Mori',      desc: '+10% XP from all sources. Remember what you learned.',    icon: '\u2605', cost: 600 },
      { id: 'p_critchance', name: 'Executioner\'s Eye', desc: '+5% critical hit chance. You see where to cut.',          icon: '\u25C8', cost: 800 }
    ],
    skillTree: {
      offense: {
        label: 'Offense',
        color: '#e74c3c',
        icon: '\u2694',
        nodes: [
          { id: 'offense_1', name: 'Critical Eye',       desc: '+8% critical hit chance' },
          { id: 'offense_2', name: 'Lethal Strikes',     desc: '+50% critical damage multiplier' },
          { id: 'offense_3', name: 'Multi-Projectile',   desc: '+2 extra projectiles per volley' },
          { id: 'offense_4', name: 'Piercing Shots',     desc: 'Projectiles pierce +3 enemies' }
        ]
      },
      defense: {
        label: 'Defense',
        color: '#3498db',
        icon: '\u26E8',
        nodes: [
          { id: 'defense_1', name: 'Regeneration',       desc: 'Recover 1 HP every 5 seconds' },
          { id: 'defense_2', name: 'Dash Shield',        desc: 'Extended invulnerability after dashing' },
          { id: 'defense_3', name: 'Damage Reduction',   desc: '15% less damage taken' },
          { id: 'defense_4', name: 'Second Life',        desc: 'Revive once per run at 30% HP' }
        ]
      },
      utility: {
        label: 'Utility',
        color: '#2ecc71',
        icon: '\u2728',
        nodes: [
          { id: 'utility_1', name: 'Long Dash',          desc: '+40% dash distance' },
          { id: 'utility_2', name: 'Quick Recovery',     desc: '-30% dash cooldown' },
          { id: 'utility_3', name: 'Magnet Range',       desc: '+40 pickup radius' },
          { id: 'utility_4', name: 'XP Multiplier',      desc: '+25% XP from all sources' }
        ]
      }
    },
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Uncial+Antiqua&family=Crimson+Text:ital,wght@0,400;0,700;1,400&display=swap',
    cssVars: {
      '--bg': '#0d0a0e',
      '--bg-card': '#1a1020',
      '--bg-card-hover': '#251535',
      '--accent': '#c4a24e',
      '--accent-dim': '#7a6530',
      '--text': '#e0d4c8',
      '--text-dim': '#8a7a6e',
      '--success': '#5a8f4a',
      '--danger': '#9e2a2a',
      '--owned': '#3a6635',
      '--disabled': '#2a2030',
      '--border': '#3a2845',
      '--radius': '6px',
      '--gap': '16px',
      '--font-title': "'Cinzel', Georgia, serif",
      '--font-display': "'Uncial Antiqua', 'Cinzel', Georgia, serif",
      '--font-body': "'Crimson Text', Georgia, serif",
      '--highlight': '#8b1a2b',
      '--tooltip-bg': '#1a1020',
      '--btn-primary-bg': 'linear-gradient(135deg, #8b1a2b, #5a1020)',
      '--btn-primary-color': '#d8cfc0',
      '--btn-primary-hover-bg': 'linear-gradient(135deg, #a5222e, #6a1525)',
      '--btn-primary-hover-shadow': '0 0 16px rgba(139, 26, 43, 0.3)'
    },
    headerDecorationHtml: '<div class="candle-glow candle-left"></div><div class="candle-glow candle-right"></div>',
    extraCss: `
      body {
        background-image:
          radial-gradient(ellipse at 20% 30%, rgba(139, 26, 43, 0.08) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 70%, rgba(45, 22, 64, 0.12) 0%, transparent 50%),
          repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(58, 40, 69, 0.06) 40px, rgba(58, 40, 69, 0.06) 41px),
          repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(58, 40, 69, 0.04) 40px, rgba(58, 40, 69, 0.04) 41px);
      }
      .shop-header::before {
        content: '\\2E3B';
        display: block;
        font-size: 1.5rem;
        color: #8b1a2b;
        margin-bottom: 12px;
        letter-spacing: 16px;
        opacity: 0.6;
      }
      .shop-header::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 50%;
        transform: translateX(-50%);
        width: 120px;
        height: 2px;
        background: linear-gradient(90deg, transparent, #8b1a2b, transparent);
      }
      .shop-title { font-family: var(--font-display); font-weight: 400; }
      .player-bar { box-shadow: inset 0 1px 0 rgba(196, 162, 78, 0.06); }
      .category-title { color: #d8cfc0; }
      .item-name { color: #d8cfc0; }
      .toast { box-shadow: 0 4px 20px rgba(139, 26, 43, 0.3); }
      .btn-primary { border: 1px solid rgba(139, 26, 43, 0.5); }
      .continue-btn { font-size: 1.2rem; }
      .skill-tree-svg .branch-label { font-family: 'Cinzel', Georgia, serif; }
      .skill-tree-svg .node-label { font-family: 'Crimson Text', Georgia, serif; }
      @keyframes flicker {
        0%, 100% { opacity: 0.8; }
        25% { opacity: 0.6; }
        50% { opacity: 0.9; }
        75% { opacity: 0.5; }
      }
      .candle-glow {
        position: absolute;
        width: 60px; height: 60px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(232, 168, 64, 0.15) 0%, transparent 70%);
        animation: flicker 3s ease-in-out infinite;
        pointer-events: none;
      }
      .candle-left { left: 10%; top: 20%; }
      .candle-right { right: 10%; top: 20%; animation-delay: 1.5s; }
      @media (max-width: 768px) {
        .shop-title { font-size: 1.6rem; }
        .candle-left, .candle-right { display: none; }
      }
    `
  }
};
