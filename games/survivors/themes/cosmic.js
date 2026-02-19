window.THEME = {
  name: 'Cosmic Survivors',
  fonts: { title: 'Exo 2', body: 'Space Mono' },
  victoryCondition: { timeSeconds: 720, bossName: 'The Singularity' },
  worldOrder: { current: 3, next: 'victory.html' },
  song: '../../music/audio-tracker/songs/survivors-cosmic.json',
  palette: {
    bg: '#050510', bgLight: '#101025', accent: '#9933ff',
    gold: '#ffd700', bone: '#d0d8f0', emerald: '#33ff88',
    purple: '#9933ff', blood: '#ff3366', midnight: '#030308',
    floorBase: '#080818', floorLine: '#151530'
  },
  effectColors: {
    field: { fillRgb: '153,51,255', strokeRgb: '153,51,255' },
    orbit: { ring: 'rgba(153,51,255,0.15)', orb: '#9933ff' },
    area: { rgb: '255,215,0' },
    beam: { rgb: '153,51,255', glow: '#9933ff' },
    chain: { rgb: '187,102,255', particle: '#bb66ff' },
    damageFlash: { rgb: '153,0,255' },
    invuln: { rgb: '255,255,255' },
    rain: { particle: '#ff6633' }
  },
  enemies: [
    { name:'Alien Spore', color:'#33ff88', size:10, speed:50, hp:2, xp:1, spawnAfter:0, draw:'spore', movementType:'chase' },
    { name:'Swarm Drone', color:'#aaaacc', size:12, speed:75, hp:3, xp:1, spawnAfter:0, draw:'swarmdrone', movementType:'orbit' },
    { name:'Asteroid Beast', color:'#996633', size:20, speed:30, hp:10, xp:3, spawnAfter:30, draw:'asteroid', movementType:'charge' },
    { name:'Void Wraith', color:'#6600cc', size:14, speed:85, hp:5, xp:3, spawnAfter:90, draw:'voidwraith', movementType:'strafe' },
    { name:'Phase Stalker', color:'#00ccff', size:13, speed:92, hp:4, xp:3, spawnAfter:120, draw:'phasestalker', movementType:'flanker' },
    { name:'Hive Swarm', color:'#ffaa00', size:11, speed:100, hp:3, xp:2, spawnAfter:180, draw:'hiveswarm', movementType:'ambush' },
    { name:'Meteor Fiend', color:'#ff6633', size:15, speed:65, hp:6, xp:4, spawnAfter:180, draw:'meteor', movementType:'divebomber' },
    { name:'Sentinel', color:'#8888aa', size:19, speed:30, hp:18, xp:5, spawnAfter:240, draw:'sentinel', movementType:'shieldbearer' },
    { name:'Cosmic Horror', color:'#ff0066', size:18, speed:55, hp:20, xp:8, spawnAfter:300, draw:'cosmichorror', movementType:'orbit' }
  ],
  bosses: [
    { name:'Hive Queen', color:'#ffaa00', size:50, speed:30, hp:200, xp:50, spawnAt:120, attackPattern:'summon' },
    { name:'Void Leviathan', color:'#6600cc', size:55, speed:35, hp:400, xp:80, spawnAt:240, attackPattern:'beam' },
    { name:'Star Eater', color:'#ff3300', size:50, speed:45, hp:700, xp:120, spawnAt:360, attackPattern:'shockwave' },
    { name:'The Singularity', color:'#ffffff', size:60, speed:40, hp:1200, xp:200, spawnAt:480, attackPattern:'charge' }
  ],
  weapons: [
    { name:'Plasma Bolt', desc:'Fires a bolt of plasma', icon:'\u25C6', type:'projectile' },
    { name:'Graviton Orbit', desc:'Orbiting gravity shield', icon:'\u2748', type:'orbit' },
    { name:'Solar Flare', desc:'Expanding solar blast', icon:'\u2600', type:'area' },
    { name:'Chain Tether', desc:'Bounces between foes', icon:'\u26A1', type:'chain' },
    { name:'Ion Beam', desc:'Sustained ion beam', icon:'\u2604', type:'beam' },
    { name:'Comet Rain', desc:'Comets from above', icon:'\u2604', type:'rain' },
    { name:'Quantum Disc', desc:'Returning energy disc', icon:'\u25C9', type:'boomerang' },
    { name:'Singularity Field', desc:'Warped space zone', icon:'\u2742', type:'field' }
  ],
  passives: [
    { name:'Hull Integrity', desc:'+20% Max HP', icon:'\u2665', stat:'maxHp', mult:1.2 },
    { name:'Thrusters', desc:'+15% Move Speed', icon:'\u27A4', stat:'speed', mult:1.15 },
    { name:'Gravity Well', desc:'+40% Pickup Range', icon:'\u2609', stat:'pickupRadius', mult:1.4 },
    { name:'Plasma Core', desc:'+20% Damage', icon:'\u2694', stat:'damage', mult:1.2 },
    { name:'Warp Drive', desc:'+15% Attack Speed', icon:'\u231A', stat:'attackSpeed', mult:1.15 },
    { name:'Shields', desc:'-15% Damage Taken', icon:'\u26E8', stat:'defense', mult:0.85 }
  ],
  drawPlayer(ctx, x, y, r, time) {
    ctx.save();
    ctx.translate(x, y);
    // Engine glow trail
    const enginePulse = 0.6 + 0.4*Math.sin(time*10);
    const grd = ctx.createRadialGradient(0, r*0.8, 0, 0, r*0.8, r*0.6);
    grd.addColorStop(0, `rgba(51,136,255,${enginePulse*0.8})`);
    grd.addColorStop(0.5, `rgba(51,136,255,${enginePulse*0.3})`);
    grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd;
    ctx.fillRect(-r*0.5, r*0.3, r, r*0.8);
    // Ship body (triangle)
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(-r*0.7, r*0.6);
    ctx.lineTo(-r*0.3, r*0.4);
    ctx.lineTo(0, r*0.5);
    ctx.lineTo(r*0.3, r*0.4);
    ctx.lineTo(r*0.7, r*0.6);
    ctx.closePath();
    ctx.fillStyle = '#445577';
    ctx.fill();
    ctx.strokeStyle = '#6688aa';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Cockpit light
    const cockpitGlow = 0.5 + 0.5*Math.sin(time*3);
    ctx.fillStyle = `rgba(153,51,255,${0.6+cockpitGlow*0.4})`;
    ctx.beginPath();
    ctx.arc(0, -r*0.3, r*0.2, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = `rgba(255,255,255,${0.3+cockpitGlow*0.3})`;
    ctx.beginPath();
    ctx.arc(0, -r*0.3, r*0.1, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  },
  drawEnemy(ctx, e, time) {
    const {x, y, size, type} = e;
    ctx.save();
    ctx.translate(x, y);
    const s = size;
    if(type.draw==='spore') {
      // Pulsing green circle with tendrils
      const pulse = 1 + 0.15*Math.sin(time*6 + e.spawnTime*3);
      ctx.fillStyle = type.color;
      ctx.shadowColor = type.color;
      ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(0, 0, s*0.4*pulse, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
      // Tendrils
      ctx.strokeStyle = type.color;
      ctx.lineWidth = 1.5;
      for(let i=0;i<5;i++) {
        const a = (Math.PI*2*i/5) + time*2;
        const tx = Math.cos(a)*s*0.7;
        const ty = Math.sin(a)*s*0.7;
        ctx.beginPath(); ctx.moveTo(0,0);
        ctx.quadraticCurveTo(Math.cos(a+0.5)*s*0.4, Math.sin(a+0.5)*s*0.4, tx, ty);
        ctx.stroke();
      }
    } else if(type.draw==='swarmdrone') {
      // Angular small ship shape
      ctx.fillStyle = type.color;
      ctx.beginPath();
      ctx.moveTo(0, -s*0.5);
      ctx.lineTo(-s*0.5, s*0.3);
      ctx.lineTo(-s*0.2, s*0.5);
      ctx.lineTo(s*0.2, s*0.5);
      ctx.lineTo(s*0.5, s*0.3);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#666688';
      ctx.fillRect(-s*0.15, -s*0.2, s*0.3, s*0.3);
    } else if(type.draw==='asteroid') {
      // Rough irregular rocky circle
      ctx.fillStyle = type.color;
      ctx.beginPath();
      for(let i=0;i<8;i++) {
        const a = (Math.PI*2*i/8);
        const variance = 0.7 + 0.3*Math.sin(i*2.5 + e.spawnTime);
        const px = Math.cos(a)*s*0.5*variance;
        const py = Math.sin(a)*s*0.5*variance;
        if(i===0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      // Rocky texture dots
      ctx.fillStyle = '#776644';
      ctx.beginPath(); ctx.arc(-s*0.15, -s*0.1, s*0.1, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#554422';
      ctx.beginPath(); ctx.arc(s*0.1, s*0.15, s*0.08, 0, Math.PI*2); ctx.fill();
    } else if(type.draw==='voidwraith') {
      // Semi-transparent purple ghost entity
      const a = 0.4+0.3*Math.sin(time*4+e.spawnTime);
      ctx.globalAlpha = a;
      ctx.fillStyle = '#9933ff';
      ctx.shadowColor = '#6600cc';
      ctx.shadowBlur = 15;
      ctx.beginPath(); ctx.arc(0, -s*0.2, s*0.5, Math.PI, 0);
      ctx.lineTo(s*0.5, s*0.5);
      for(let i=0;i<5;i++){
        const px = s*0.5 - i*(s/5);
        ctx.lineTo(px - s*0.1, s*0.3 + (i%2)*s*0.2);
      }
      ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0;
      // Eyes
      ctx.globalAlpha = a + 0.3;
      ctx.fillStyle = '#ff66ff';
      ctx.beginPath(); ctx.arc(-s*0.15,-s*0.2,2.5,0,Math.PI*2); ctx.arc(s*0.15,-s*0.2,2.5,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;
    } else if(type.draw==='hiveswarm') {
      // Small orange insectoid
      ctx.fillStyle = type.color;
      // Body
      ctx.beginPath(); ctx.ellipse(0, 0, s*0.3, s*0.4, 0, 0, Math.PI*2); ctx.fill();
      // Wings buzzing
      const wingAngle = Math.sin(time*30 + e.spawnTime*5)*0.3;
      ctx.fillStyle = 'rgba(255,170,0,0.4)';
      ctx.beginPath(); ctx.ellipse(-s*0.4, -s*0.1, s*0.3, s*0.15, wingAngle, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(s*0.4, -s*0.1, s*0.3, s*0.15, -wingAngle, 0, Math.PI*2); ctx.fill();
      // Eyes
      ctx.fillStyle = '#ff3300';
      ctx.beginPath(); ctx.arc(-s*0.1,-s*0.2,2,0,Math.PI*2); ctx.arc(s*0.1,-s*0.2,2,0,Math.PI*2); ctx.fill();
    } else if(type.draw==='cosmichorror') {
      // Tentacled mass with glowing red eye
      ctx.fillStyle = '#330033';
      ctx.beginPath(); ctx.arc(0, 0, s*0.55, 0, Math.PI*2); ctx.fill();
      // Tentacles
      ctx.strokeStyle = type.color;
      ctx.lineWidth = 2;
      for(let i=0;i<6;i++) {
        const a = (Math.PI*2*i/6) + time*1.5;
        ctx.beginPath(); ctx.moveTo(0,0);
        const cp1x = Math.cos(a)*s*0.4;
        const cp1y = Math.sin(a)*s*0.4;
        const endX = Math.cos(a + Math.sin(time*3+i)*0.5)*s*0.9;
        const endY = Math.sin(a + Math.sin(time*3+i)*0.5)*s*0.9;
        ctx.quadraticCurveTo(cp1x, cp1y, endX, endY);
        ctx.stroke();
      }
      // Central eye
      ctx.fillStyle = '#ff0066';
      ctx.shadowColor = '#ff0066';
      ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(0, 0, s*0.2, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(0, 0, s*0.08, 0, Math.PI*2); ctx.fill();
    } else if(type.draw==='phasestalker') {
      // Ghostly blue figure that flickers
      const flicker = 0.6 + 0.4 * Math.sin(time * 8 + e.spawnTime * 3);
      ctx.globalAlpha = flicker;
      ctx.fillStyle = type.color;
      ctx.shadowColor = type.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(0, -s*0.5);
      ctx.lineTo(s*0.35, s*0.1);
      ctx.lineTo(s*0.2, s*0.5);
      ctx.lineTo(-s*0.2, s*0.5);
      ctx.lineTo(-s*0.35, s*0.1);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(-s*0.08, -s*0.15, 2, 0, Math.PI*2); ctx.arc(s*0.08, -s*0.15, 2, 0, Math.PI*2); ctx.fill();
    } else if(type.draw==='meteor') {
      // Flaming rock that hovers
      const hover = Math.sin(time * 3 + e.spawnTime) * 4;
      ctx.translate(0, hover);
      ctx.fillStyle = type.color;
      ctx.shadowColor = '#ff4400';
      ctx.shadowBlur = 10;
      // Irregular rock shape
      ctx.beginPath();
      ctx.moveTo(0, -s*0.45);
      ctx.lineTo(s*0.35, -s*0.2);
      ctx.lineTo(s*0.4, s*0.2);
      ctx.lineTo(s*0.1, s*0.4);
      ctx.lineTo(-s*0.3, s*0.35);
      ctx.lineTo(-s*0.4, 0);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      // Flame trail
      ctx.fillStyle = '#ffaa00';
      ctx.globalAlpha = 0.6;
      ctx.beginPath(); ctx.arc(0, -s*0.55, s*0.15, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#ff4400';
      ctx.beginPath(); ctx.arc(s*0.1, -s*0.6, s*0.1, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;
    } else if(type.draw==='sentinel') {
      // Armored alien construct with frontal shield
      ctx.fillStyle = type.color;
      ctx.fillRect(-s*0.35, -s*0.45, s*0.7, s*0.9);
      // Visor
      ctx.fillStyle = '#4444ff';
      ctx.shadowColor = '#4444ff';
      ctx.shadowBlur = 8;
      ctx.fillRect(-s*0.25, -s*0.3, s*0.5, s*0.15);
      ctx.shadowBlur = 0;
      // Armor plates
      ctx.strokeStyle = '#666688';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-s*0.35, -s*0.45, s*0.7, s*0.9);
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
    ctx.fillStyle = hpPct > 0.5 ? '#9933ff' : '#ff6600';
    ctx.fillRect(-s, -s-14, s*2*hpPct, 8);
    ctx.strokeStyle = '#888';
    ctx.strokeRect(-s, -s-14, s*2, 8);
    // Name
    ctx.fillStyle = '#ffd700';
    ctx.font = '12px Exo 2';
    ctx.textAlign = 'center';
    ctx.fillText(e.type.name, 0, -s-18);
    ctx.restore();
  },
  drawBackground(ctx, cam, W, H, time) {
    // Deep space
    ctx.fillStyle = THEME.palette.floorBase;
    ctx.fillRect(0, 0, W, H);

    // Nebula gradients (subtle purple/blue)
    const nebula1x = W*0.3 - (cam.x*0.05) % W;
    const nebula1y = H*0.4 - (cam.y*0.05) % H;
    const grd1 = ctx.createRadialGradient(nebula1x, nebula1y, 0, nebula1x, nebula1y, 300);
    grd1.addColorStop(0, 'rgba(80,20,120,0.08)');
    grd1.addColorStop(0.5, 'rgba(40,10,80,0.04)');
    grd1.addColorStop(1, 'transparent');
    ctx.fillStyle = grd1;
    ctx.fillRect(0, 0, W, H);

    const nebula2x = W*0.7 - (cam.x*0.03) % W;
    const nebula2y = H*0.6 - (cam.y*0.03) % H;
    const grd2 = ctx.createRadialGradient(nebula2x, nebula2y, 0, nebula2x, nebula2y, 250);
    grd2.addColorStop(0, 'rgba(20,40,120,0.06)');
    grd2.addColorStop(0.5, 'rgba(10,20,80,0.03)');
    grd2.addColorStop(1, 'transparent');
    ctx.fillStyle = grd2;
    ctx.fillRect(0, 0, W, H);

    // Parallax starfield - layer 1 (distant, small, dim)
    ctx.fillStyle = 'rgba(200,210,240,0.3)';
    for(let i = 0; i < 80; i++) {
      const sx = ((i * 347 + 50) % 1600) - (cam.x * 0.1) % 1600;
      const sy = ((i * 521 + 80) % 1200) - (cam.y * 0.1) % 1200;
      const nx = ((sx % 1600) + 1600) % 1600;
      const ny = ((sy % 1200) + 1200) % 1200;
      if(nx < W && ny < H) {
        ctx.fillRect(nx, ny, 1, 1);
      }
    }

    // Parallax starfield - layer 2 (mid, medium)
    ctx.fillStyle = 'rgba(220,225,250,0.5)';
    for(let i = 0; i < 50; i++) {
      const sx = ((i * 233 + 120) % 1400) - (cam.x * 0.3) % 1400;
      const sy = ((i * 419 + 170) % 1000) - (cam.y * 0.3) % 1000;
      const nx = ((sx % 1400) + 1400) % 1400;
      const ny = ((sy % 1000) + 1000) % 1000;
      if(nx < W && ny < H) {
        ctx.beginPath(); ctx.arc(nx, ny, 1.2, 0, Math.PI*2); ctx.fill();
      }
    }

    // Parallax starfield - layer 3 (near, bright, larger)
    for(let i = 0; i < 30; i++) {
      const sx = ((i * 179 + 200) % 1200) - (cam.x * 0.6) % 1200;
      const sy = ((i * 311 + 260) % 900) - (cam.y * 0.6) % 900;
      const nx = ((sx % 1200) + 1200) % 1200;
      const ny = ((sy % 900) + 900) % 900;
      if(nx < W && ny < H) {
        const twinkle = 0.5 + 0.5*Math.sin(time*2 + i*1.7);
        ctx.fillStyle = `rgba(240,240,255,${0.4 + twinkle*0.4})`;
        ctx.beginPath(); ctx.arc(nx, ny, 1.5 + twinkle*0.5, 0, Math.PI*2); ctx.fill();
      }
    }
  },
  drawProjectile(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    if(p.weaponType === 'projectile') {
      // Blue-white plasma bolt
      ctx.fillStyle = '#88ccff';
      ctx.shadowColor = '#3388ff'; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(0,0,4+p.level,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(0,0,2+p.level*0.5,0,Math.PI*2); ctx.fill();
    } else if(p.weaponType === 'chain') {
      // Purple energy tether
      ctx.strokeStyle = '#bb66ff';
      ctx.shadowColor = '#9933ff'; ctx.shadowBlur = 12;
      ctx.lineWidth = 2 + p.level;
      ctx.beginPath(); ctx.moveTo(-8,0); ctx.lineTo(8,0); ctx.stroke();
    } else if(p.weaponType === 'rain') {
      // Orange comet trail
      ctx.fillStyle = '#ffaa33';
      ctx.shadowColor = '#ff6600'; ctx.shadowBlur = 15;
      ctx.beginPath(); ctx.arc(0,0,6+p.level*2,0,Math.PI*2); ctx.fill();
      // Tail
      ctx.fillStyle = 'rgba(255,100,0,0.4)';
      ctx.beginPath(); ctx.arc(0,-4,4+p.level,0,Math.PI*2); ctx.fill();
    } else if(p.weaponType === 'boomerang') {
      // Golden spinning disc
      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 8;
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
    ctx.fillStyle = g.value > 5 ? '#ffd700' : g.value > 2 ? '#33ff88' : '#9933ff';
    ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 8;
    // Star shape
    ctx.beginPath();
    for(let i=0;i<5;i++) {
      const outerA = (Math.PI*2*i/5) - Math.PI/2;
      const innerA = outerA + Math.PI/5;
      ctx.lineTo(Math.cos(outerA)*6, Math.sin(outerA)*6);
      ctx.lineTo(Math.cos(innerA)*3, Math.sin(innerA)*3);
    }
    ctx.closePath(); ctx.fill();
    ctx.restore();
  },
  classConfig: {
    classId: 'warlock',
    className: 'Warlock',
    classIcon: '\u{1F52E}',
    classDesc: 'Arcane caster. Commands gravity, orbits, and devastating area spells.',
    startingStats: { hp: 70, speed: 150, damage: 1.3, defense: 0.8 },
    weaponAffinities: {
      primary: ['orbit', 'field', 'area'],
      secondary: ['beam', 'rain']
    },
    classPassive: { id: 'arcane_attunement', name: 'Arcane Attunement', desc: '+15% ability power, -10% cooldowns', effect: { abilityPowerMult: 1.15, cooldownMult: 0.90 } },
    signatureAbility: { name: 'Singularity Rift', desc: 'Pull + DoT vortex for 4s, burst on collapse', icon: '\uD83C\uDF00', cooldown: 50, duration: 4 }
  },

  ui: {
    title: 'Cosmic Survivors',
    subtitle: 'Lost Among the Stars',
    gameOverTitle: 'Death Claims You',
    levelUpSubtitle: 'Choose your blessing',
    victoryTitleColor: '#ffd700',
    victorySubtitle: 'The Cosmos bows before you',
    victoryNextText: 'Warping to final victory...',
    victoryNextColor: '#9933ff',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Exo+2:wght@400;700;900&family=Space+Mono&display=swap'
  },

  cssVars: {
    '--bg': '#050510',
    '--body-font': "'Space Mono',monospace",
    '--body-color': '#d0d8f0',
    '--title-font': "'Exo 2',sans-serif",
    '--title-weight': '900',
    '--hud-shadow': 'rgba(153,51,255,0.6)',
    '--gold': '#ffd700',
    '--accent': '#9933ff',
    '--xp-start': '#3388ff',
    '--xp-end': '#ffd700',
    '--hp-start': '#6600cc',
    '--hp-end': '#3388ff',
    '--gold-glow': 'rgba(255,215,0,0.5)',
    '--title-bg-inner': '#101025',
    '--title-bg-outer': '#050510',
    '--overlay-rgb': '3,3,8',
    '--screen-title-shadow': '0 0 40px rgba(153,51,255,0.6),0 0 80px rgba(153,51,255,0.3),0 0 4px rgba(255,215,0,0.4)',
    '--subtitle-style': 'italic',
    '--btn-bg': 'rgba(153,51,255,0.3)',
    '--btn-hover-bg': 'rgba(153,51,255,0.6)',
    '--btn-hover-shadow': 'rgba(255,215,0,0.4)',
    '--stats-color': '#8088a0',
    '--card-bg': 'rgba(10,10,25,0.9)',
    '--hint-color': '#777'
  },

  shopConfig: {
    title: "Warlock\u2019s Sanctum",
    subtitle: 'Deepen your arcane knowledge, Warlock',
    goldIcon: '\u2B50',
    nextWorld: { label: 'Cosmic Frontier', url: 'arena.html?world=cosmic' },
    continueVerb: 'Continue to',
    categories: {
      stats: { icon: '\uD83D\uDD2E', label: 'Arcane Studies' },
      weapons: { icon: '\u26A1', label: 'Stellar Armaments' },
      passives: { icon: '\u2728', label: 'Void Blessings' },
      skills: { icon: '\uD83C\uDF0C', label: 'Constellation Map' },
      inventory: { icon: '\uD83C\uDF92', label: 'Cargo Hold' }
    },
    emptyInventoryMsg: 'No items yet. Defeat cosmic entities to find loot!',
    statUpgrades: [
      { id: 'dmg1', name: 'Arcane Flux I',      desc: '+15% Damage \u2014 Channel raw void energy',       icon: '\uD83D\uDD2E', cost: 150,  stat: 'damage', mult: 1.15 },
      { id: 'dmg2', name: 'Arcane Flux II',     desc: '+15% Damage \u2014 Refine the cosmic flow',        icon: '\uD83D\uDD2E', cost: 400,  stat: 'damage', mult: 1.15, requires: 'dmg1' },
      { id: 'dmg3', name: 'Arcane Flux III',    desc: '+15% Damage \u2014 Tap forbidden frequencies',     icon: '\uD83D\uDD2E', cost: 1000, stat: 'damage', mult: 1.15, requires: 'dmg2' },
      { id: 'dmg4', name: 'Arcane Flux IV',     desc: '+15% Damage \u2014 Resonate with dark matter',     icon: '\uD83D\uDD2E', cost: 2000, stat: 'damage', mult: 1.15, requires: 'dmg3' },
      { id: 'dmg5', name: 'Arcane Flux V',      desc: '+15% Damage \u2014 Become the singularity',        icon: '\uD83D\uDD2E', cost: 4000, stat: 'damage', mult: 1.15, requires: 'dmg4' },
      { id: 'hp1', name: 'Stellar Core I',      desc: '+20 Max HP \u2014 Infuse stardust into your hull',    icon: '\u2665', cost: 150,  stat: 'maxHp', bonus: 20 },
      { id: 'hp2', name: 'Stellar Core II',     desc: '+20 Max HP \u2014 Neutron-reinforced plating',        icon: '\u2665', cost: 400,  stat: 'maxHp', bonus: 20, requires: 'hp1' },
      { id: 'hp3', name: 'Stellar Core III',    desc: '+20 Max HP \u2014 White dwarf compression armor',     icon: '\u2665', cost: 1000, stat: 'maxHp', bonus: 20, requires: 'hp2' },
      { id: 'hp4', name: 'Stellar Core IV',     desc: '+20 Max HP \u2014 Pulsar-grade shielding',            icon: '\u2665', cost: 2000, stat: 'maxHp', bonus: 20, requires: 'hp3' },
      { id: 'hp5', name: 'Stellar Core V',      desc: '+20 Max HP \u2014 Supernova remnant fortress',        icon: '\u2665', cost: 4000, stat: 'maxHp', bonus: 20, requires: 'hp4' },
      { id: 'spd1', name: 'Warp Drive I',       desc: '+10% Speed \u2014 Tachyon-laced thrusters',          icon: '\u27A4', cost: 150,  stat: 'speed', mult: 1.10 },
      { id: 'spd2', name: 'Warp Drive II',      desc: '+10% Speed \u2014 Graviton wave surfing',            icon: '\u27A4', cost: 400,  stat: 'speed', mult: 1.10, requires: 'spd1' },
      { id: 'spd3', name: 'Warp Drive III',     desc: '+10% Speed \u2014 Fold spacetime around you',        icon: '\u27A4', cost: 1000, stat: 'speed', mult: 1.10, requires: 'spd2' },
      { id: 'spd4', name: 'Warp Drive IV',      desc: '+10% Speed \u2014 Alcubierre micro-bubble',          icon: '\u27A4', cost: 2000, stat: 'speed', mult: 1.10, requires: 'spd3' },
      { id: 'spd5', name: 'Warp Drive V',       desc: '+10% Speed \u2014 Phase through reality itself',     icon: '\u27A4', cost: 4000, stat: 'speed', mult: 1.10, requires: 'spd4' },
      { id: 'pick1', name: 'Gravity Well I',    desc: '+15 Pickup Range \u2014 Micro black hole attractor',  icon: '\u2609', cost: 150,  stat: 'pickupRadius', bonus: 15 },
      { id: 'pick2', name: 'Gravity Well II',   desc: '+15 Pickup Range \u2014 Singularity siphon',          icon: '\u2609', cost: 400,  stat: 'pickupRadius', bonus: 15, requires: 'pick1' },
      { id: 'pick3', name: 'Gravity Well III',  desc: '+15 Pickup Range \u2014 Event horizon expansion',     icon: '\u2609', cost: 1000, stat: 'pickupRadius', bonus: 15, requires: 'pick2' },
      { id: 'pick4', name: 'Gravity Well IV',   desc: '+15 Pickup Range \u2014 Spacetime curvature lens',    icon: '\u2609', cost: 2000, stat: 'pickupRadius', bonus: 15, requires: 'pick3' },
      { id: 'pick5', name: 'Gravity Well V',    desc: '+15 Pickup Range \u2014 Absolute gravitational pull', icon: '\u2609', cost: 4000, stat: 'pickupRadius', bonus: 15, requires: 'pick4' }
    ],
    startingWeapons: [
      { id: 'w_area',       name: 'Supernova Burst',    desc: 'Start with an expanding stellar shockwave',     icon: '\u29BF', cost: 400, weaponType: 'area' },
      { id: 'w_field',      name: 'Dark Matter Zone',   desc: 'Start with a persistent dark energy field',     icon: '\u2742', cost: 400, weaponType: 'field' },
      { id: 'w_chain',      name: 'Neutrino Chain',     desc: 'Start with a particle-chaining beam',           icon: '\u2301', cost: 600, weaponType: 'chain' },
      { id: 'w_beam',       name: 'Quasar Beam',        desc: 'Start with a sustained quasar energy beam',     icon: '\u2588', cost: 600, weaponType: 'beam' },
      { id: 'w_rain',       name: 'Meteor Shower',      desc: 'Start with a rain of cosmic debris from above', icon: '\u2663', cost: 600, weaponType: 'rain' },
      { id: 'w_orbit',      name: 'Asteroid Ring',      desc: 'Start with orbiting space debris shield',       icon: '\u2B21', cost: 800, weaponType: 'orbit' },
      { id: 'w_projectile', name: 'Plasma Bolt',        desc: 'Start with a superheated plasma projector',     icon: '\u2726', cost: 800, weaponType: 'projectile' },
      { id: 'w_boomerang',  name: 'Orbital Disc',       desc: 'Start with a returning graviton disc',          icon: '\u25C9', cost: 800, weaponType: 'boomerang' }
    ],
    passives: [
      { id: 'p_regen',      name: 'Cosmic Mending',     desc: 'Recover 1 HP every 5 seconds from starlight',  icon: '\u2661', cost: 400 },
      { id: 'p_xpboost',    name: 'Nebula Wisdom',      desc: '+10% XP from all sources in the cosmos',       icon: '\u2605', cost: 400 },
      { id: 'p_lifesteal',  name: 'Void Siphon',        desc: 'Drain 1% of damage dealt as life force',       icon: '\u2764', cost: 600 },
      { id: 'p_critchance', name: 'Singularity Focus',  desc: '+5% critical hit chance via quantum targeting', icon: '\u25C8', cost: 800 }
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
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Exo+2:ital,wght@0,300;0,400;0,700;1,400&display=swap',
    cssVars: {
      '--bg': '#060613',
      '--bg-card': '#0d0d24',
      '--bg-card-hover': '#151538',
      '--accent': '#7df9ff',
      '--accent-dim': '#3a8a8f',
      '--text': '#d0d8f0',
      '--text-dim': '#6670a0',
      '--success': '#4caf50',
      '--danger': '#e74c3c',
      '--owned': '#2e7d32',
      '--disabled': '#1a1a3a',
      '--border': '#1e2050',
      '--radius': '8px',
      '--gap': '16px',
      '--font-title': "'Orbitron', 'Courier New', monospace",
      '--font-body': "'Exo 2', 'Segoe UI', sans-serif",
      '--highlight': '#7df9ff',
      '--tooltip-bg': '#0a0a28',
      '--btn-primary-bg': '#7df9ff',
      '--btn-primary-color': '#060613',
      '--btn-primary-hover-bg': '#a0fbff',
      '--btn-primary-hover-shadow': '0 0 20px rgba(125,249,255,0.3)'
    },
    extraCss: `
      body::before {
        content: '';
        position: fixed;
        inset: 0;
        z-index: 0;
        background:
          radial-gradient(ellipse at 20% 50%, rgba(88, 28, 135, 0.15) 0%, transparent 60%),
          radial-gradient(ellipse at 80% 20%, rgba(30, 58, 138, 0.12) 0%, transparent 50%),
          radial-gradient(ellipse at 60% 80%, rgba(6, 78, 59, 0.1) 0%, transparent 50%),
          radial-gradient(1px 1px at 10% 15%, #fff 50%, transparent 50%),
          radial-gradient(1px 1px at 25% 35%, rgba(255,255,255,0.8) 50%, transparent 50%),
          radial-gradient(1px 1px at 40% 10%, #fff 50%, transparent 50%),
          radial-gradient(1px 1px at 55% 65%, rgba(255,255,255,0.6) 50%, transparent 50%),
          radial-gradient(1px 1px at 70% 45%, #fff 50%, transparent 50%),
          radial-gradient(1px 1px at 85% 75%, rgba(255,255,255,0.7) 50%, transparent 50%),
          radial-gradient(1px 1px at 15% 80%, #fff 50%, transparent 50%),
          radial-gradient(1px 1px at 50% 25%, rgba(255,255,255,0.5) 50%, transparent 50%),
          radial-gradient(1px 1px at 90% 10%, #fff 50%, transparent 50%),
          radial-gradient(1.5px 1.5px at 30% 55%, rgba(125,249,255,0.6) 50%, transparent 50%),
          radial-gradient(1.5px 1.5px at 65% 30%, rgba(155,89,182,0.5) 50%, transparent 50%),
          radial-gradient(1.5px 1.5px at 78% 88%, rgba(0,230,118,0.4) 50%, transparent 50%),
          radial-gradient(1px 1px at 5% 50%, #fff 50%, transparent 50%),
          radial-gradient(1px 1px at 95% 55%, rgba(255,255,255,0.6) 50%, transparent 50%),
          radial-gradient(1px 1px at 45% 90%, #fff 50%, transparent 50%),
          radial-gradient(1px 1px at 33% 5%, rgba(255,255,255,0.7) 50%, transparent 50%),
          radial-gradient(1px 1px at 60% 50%, rgba(255,255,255,0.4) 50%, transparent 50%);
        pointer-events: none;
      }
      .shop-title {
        text-shadow: 0 0 20px rgba(125,249,255,0.4), 0 0 40px rgba(125,249,255,0.15);
      }
      .player-bar { box-shadow: 0 0 16px rgba(125,249,255,0.05); }
      .item-card:hover:not(.item-owned):not(.item-locked) {
        box-shadow: 0 0 16px rgba(125,249,255,0.15);
      }
      .toast { box-shadow: 0 0 20px rgba(125,249,255,0.2); }
      .btn-primary { background: var(--accent); color: var(--bg); }
      .btn-primary:hover { background: #a0fbff; box-shadow: 0 0 20px rgba(125,249,255,0.3); }
      .skill-tree-svg .branch-label { font-family: 'Orbitron', 'Courier New', monospace; }
      .skill-tree-svg .node-label { font-family: 'Exo 2', 'Segoe UI', sans-serif; }
      .skill-tree-tooltip { background: #0a0a28; box-shadow: 0 0 16px rgba(125,249,255,0.15); }
      .inv-tooltip { background: #0a0a28; box-shadow: 0 0 16px rgba(125,249,255,0.15); }
      .modal { box-shadow: 0 0 40px rgba(125,249,255,0.1); }
      @media (max-width: 768px) {
        .shop-title { font-size: 1.5rem; letter-spacing: 2px; }
      }
    `
  }
};
