window.THEME = {
  name: 'Cyberpunk Survivors',
  fonts: { title: 'Orbitron', body: 'Share Tech Mono' },
  victoryCondition: { timeSeconds: 300, bossName: 'Singularity' },
  worldOrder: { current: 0, next: 'shop.html?world=gothic' },
  song: '../../music/audio-tracker/songs/survivors-cyberpunk.json',
  palette: {
    bg: '#0a0a1a', bgLight: '#1a1a2a', accent: '#ff0080',
    gold: '#00ffff', bone: '#c0e0ff', emerald: '#39ff14',
    purple: '#bf00ff', blood: '#ff0040', midnight: '#050515',
    floorBase: '#0d0d2a', floorLine: '#1a1a3a'
  },
  effectColors: {
    field: { fillRgb: '0,255,255', strokeRgb: '255,0,128' },
    orbit: { ring: 'rgba(0,255,255,0.15)', orb: '#00ffff' },
    area: { rgb: '0,255,255' },
    beam: { rgb: '0,255,255', glow: '#00ffff' },
    chain: { rgb: '136,170,255', particle: '#88aaff' },
    damageFlash: { rgb: '255,0,128' },
    invuln: { rgb: '0,255,255' },
    rain: { particle: '#39ff14' }
  },
  enemies: [
    { name:'Drone', color:'#00ddff', size:12, speed:65, hp:3, xp:1, spawnAfter:0, draw:'drone', movementType:'strafe' },
    { name:'Mech', color:'#888899', size:18, speed:30, hp:8, xp:2, spawnAfter:0, draw:'mech', movementType:'chase' },
    { name:'Glitch Bug', color:'#ff00ff', size:11, speed:85, hp:2, xp:2, spawnAfter:30, draw:'glitch', movementType:'ambush' },
    { name:'Cyber-wolf', color:'#39ff14', size:14, speed:95, hp:4, xp:3, spawnAfter:90, draw:'cyberwolf', movementType:'charge' },
    { name:'Stealth Flanker', color:'#cc44ff', size:13, speed:90, hp:5, xp:3, spawnAfter:120, draw:'flanker', movementType:'flanker' },
    { name:'Heavy Tank', color:'#ff6600', size:20, speed:25, hp:12, xp:5, spawnAfter:180, draw:'tank', movementType:'shieldbearer' },
    { name:'Bomber Drone', color:'#ff8800', size:14, speed:70, hp:6, xp:4, spawnAfter:180, draw:'bomber', movementType:'divebomber' },
    { name:'Rogue AI', color:'#ffffff', size:16, speed:70, hp:18, xp:8, spawnAfter:300, draw:'rogueai', movementType:'orbit' }
  ],
  bosses: [
    { name:'Mega Drone', color:'#00ffff', size:50, speed:35, hp:200, xp:50, spawnAt:120, attackPattern:'beam' },
    { name:'War Mech', color:'#ff6600', size:48, speed:40, hp:400, xp:80, spawnAt:240, attackPattern:'charge' },
    { name:'Virus Core', color:'#ff00ff', size:45, speed:55, hp:700, xp:120, spawnAt:360, attackPattern:'summon' },
    { name:'Singularity', color:'#ffffff', size:55, speed:50, hp:1200, xp:200, spawnAt:480, attackPattern:'shockwave' }
  ],
  weapons: [
    { name:'Plasma Pistol', desc:'Fires a plasma bolt', icon:'\u26A1', type:'projectile' },
    { name:'Shield Drones', desc:'Orbiting drone shield', icon:'\u2B21', type:'orbit' },
    { name:'EMP Pulse', desc:'Expanding EMP blast', icon:'\u29BF', type:'area' },
    { name:'Arc Discharge', desc:'Bounces between foes', icon:'\u2301', type:'chain' },
    { name:'Laser Beam', desc:'Sustained laser beam', icon:'\u2588', type:'beam' },
    { name:'Nano Swarm', desc:'Nanobots from above', icon:'\u2663', type:'rain' },
    { name:'Disc Launcher', desc:'Returning energy disc', icon:'\u25C9', type:'boomerang' },
    { name:'Firewall', desc:'Burning code zone', icon:'\u2593', type:'field' }
  ],
  passives: [
    { name:'Nanomed', desc:'+20% Max HP', icon:'\u2665', stat:'maxHp', mult:1.2 },
    { name:'Overclock', desc:'+15% Move Speed', icon:'\u27A4', stat:'speed', mult:1.15 },
    { name:'Tractor Beam', desc:'+40% Pickup Range', icon:'\u2609', stat:'pickupRadius', mult:1.4 },
    { name:'Amplifier', desc:'+20% Damage', icon:'\u2694', stat:'damage', mult:1.2 },
    { name:'Turbo', desc:'+15% Attack Speed', icon:'\u231A', stat:'attackSpeed', mult:1.15 },
    { name:'Plating', desc:'-15% Damage Taken', icon:'\u26E8', stat:'defense', mult:0.85 }
  ],
  drawPlayer(ctx, x, y, r, time) {
    // Cyberpunk character - angular body, visor/helmet with cyan glow
    ctx.save();
    ctx.translate(x, y);
    // Dark armor body
    ctx.beginPath();
    ctx.moveTo(-r*0.6, -r*0.2);
    ctx.lineTo(-r*0.8, r);
    ctx.lineTo(-r*0.2, r*0.8);
    ctx.lineTo(r*0.2, r*0.8);
    ctx.lineTo(r*0.8, r);
    ctx.lineTo(r*0.6, -r*0.2);
    ctx.closePath();
    ctx.fillStyle = '#1a1a2a';
    ctx.fill();
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Torso
    ctx.beginPath();
    ctx.moveTo(-r*0.5, -r*0.3);
    ctx.lineTo(-r*0.4, r*0.3);
    ctx.lineTo(r*0.4, r*0.3);
    ctx.lineTo(r*0.5, -r*0.3);
    ctx.closePath();
    ctx.fillStyle = '#252540';
    ctx.fill();
    // Helmet
    ctx.beginPath();
    ctx.arc(0, -r*0.6, r*0.4, 0, Math.PI*2);
    ctx.fillStyle = '#1a1a30';
    ctx.fill();
    ctx.strokeStyle = '#ff0080';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Visor glow
    const glow = 0.5 + 0.5*Math.sin(time*3);
    ctx.fillStyle = `rgba(0,255,255,${0.6+glow*0.4})`;
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(0, -r*0.65, r*0.28, r*0.08, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // Shoulder accents
    ctx.fillStyle = '#ff0080';
    ctx.fillRect(-r*0.55, -r*0.25, r*0.12, r*0.06);
    ctx.fillRect(r*0.43, -r*0.25, r*0.12, r*0.06);
    ctx.restore();
  },
  drawEnemy(ctx, e, time) {
    const {x, y, size, type} = e;
    ctx.save();
    ctx.translate(x, y);
    const s = size;
    if(type.draw==='drone') {
      // Diamond shape with cyan glow, rotating
      const rot = time * 3 + e.spawnTime;
      ctx.rotate(rot);
      ctx.fillStyle = type.color;
      ctx.shadowColor = type.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(0, -s*0.6);
      ctx.lineTo(s*0.5, 0);
      ctx.lineTo(0, s*0.6);
      ctx.lineTo(-s*0.5, 0);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#0a0a1a';
      ctx.beginPath(); ctx.arc(0, 0, s*0.15, 0, Math.PI*2); ctx.fill();
    } else if(type.draw==='mech') {
      // Rectangular body with treads, grey metal
      ctx.fillStyle = '#555566';
      ctx.fillRect(-s*0.4, -s*0.5, s*0.8, s*0.9);
      ctx.fillStyle = type.color;
      ctx.fillRect(-s*0.35, -s*0.45, s*0.7, s*0.3);
      // Treads
      ctx.fillStyle = '#333344';
      ctx.fillRect(-s*0.5, s*0.2, s*0.15, s*0.4);
      ctx.fillRect(s*0.35, s*0.2, s*0.15, s*0.4);
      // Eye visor
      ctx.fillStyle = '#ff0040';
      ctx.fillRect(-s*0.2, -s*0.38, s*0.4, s*0.08);
    } else if(type.draw==='glitch') {
      // Flickering square that shifts position slightly
      const flick = Math.sin(time*20 + e.spawnTime*7);
      const ox = flick * 3;
      const oy = Math.cos(time*17 + e.spawnTime*5) * 2;
      ctx.fillStyle = type.color;
      ctx.globalAlpha = 0.6 + 0.4*Math.abs(flick);
      ctx.shadowColor = type.color;
      ctx.shadowBlur = 10;
      ctx.fillRect(-s*0.4+ox, -s*0.4+oy, s*0.8, s*0.8);
      ctx.shadowBlur = 0;
      // Scanlines
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      for(let i=0;i<4;i++) {
        ctx.fillRect(-s*0.4+ox, -s*0.4+oy+i*s*0.2, s*0.8, 2);
      }
      ctx.globalAlpha = 1;
    } else if(type.draw==='cyberwolf') {
      // Angular wolf shape, green glow
      ctx.fillStyle = type.color;
      ctx.shadowColor = type.color;
      ctx.shadowBlur = 8;
      // Body
      ctx.beginPath();
      ctx.moveTo(-s*0.6, 0);
      ctx.lineTo(-s*0.3, -s*0.4);
      ctx.lineTo(s*0.4, -s*0.3);
      ctx.lineTo(s*0.7, -s*0.1);
      ctx.lineTo(s*0.5, s*0.3);
      ctx.lineTo(-s*0.4, s*0.3);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      // Eye
      ctx.fillStyle = '#ff0040';
      ctx.beginPath(); ctx.arc(s*0.3, -s*0.15, 2.5, 0, Math.PI*2); ctx.fill();
      // Legs
      ctx.strokeStyle = type.color;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-s*0.3,s*0.3); ctx.lineTo(-s*0.35,s*0.55); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s*0.2,s*0.3); ctx.lineTo(s*0.25,s*0.55); ctx.stroke();
    } else if(type.draw==='tank') {
      // Wide hexagonal shape, orange glow, bulky
      ctx.fillStyle = '#443322';
      ctx.shadowColor = type.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(-s*0.3, -s*0.55);
      ctx.lineTo(s*0.3, -s*0.55);
      ctx.lineTo(s*0.6, 0);
      ctx.lineTo(s*0.3, s*0.55);
      ctx.lineTo(-s*0.3, s*0.55);
      ctx.lineTo(-s*0.6, 0);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = type.color;
      ctx.lineWidth = 2;
      ctx.stroke();
      // Inner plate
      ctx.fillStyle = type.color;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.moveTo(-s*0.15, -s*0.3);
      ctx.lineTo(s*0.15, -s*0.3);
      ctx.lineTo(s*0.3, 0);
      ctx.lineTo(s*0.15, s*0.3);
      ctx.lineTo(-s*0.15, s*0.3);
      ctx.lineTo(-s*0.3, 0);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
      // Center dot
      ctx.fillStyle = type.color;
      ctx.beginPath(); ctx.arc(0, 0, s*0.12, 0, Math.PI*2); ctx.fill();
    } else if(type.draw==='rogueai') {
      // Pulsing white sphere with data streams
      const pulse = 0.8 + 0.2*Math.sin(time*5 + e.spawnTime);
      ctx.fillStyle = type.color;
      ctx.shadowColor = type.color;
      ctx.shadowBlur = 20;
      ctx.globalAlpha = 0.7 + 0.3*pulse;
      ctx.beginPath(); ctx.arc(0, 0, s*0.5*pulse, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
      // Data stream rings
      ctx.strokeStyle = 'rgba(0,255,255,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(0, 0, s*0.65, time*2, time*2+Math.PI*1.2); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,0,128,0.4)';
      ctx.beginPath(); ctx.arc(0, 0, s*0.75, -time*1.5, -time*1.5+Math.PI*0.8); ctx.stroke();
      ctx.globalAlpha = 1;
      // Core
      ctx.fillStyle = '#00ffff';
      ctx.beginPath(); ctx.arc(0, 0, s*0.15, 0, Math.PI*2); ctx.fill();
    } else if(type.draw==='flanker') {
      // Sleek angular stealth drone shape
      const rot = time * 2;
      ctx.fillStyle = type.color;
      ctx.shadowColor = type.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(0, -s*0.6);
      ctx.lineTo(s*0.5, s*0.3);
      ctx.lineTo(0, s*0.1);
      ctx.lineTo(-s*0.5, s*0.3);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#1a0033';
      ctx.beginPath(); ctx.arc(0, -s*0.1, s*0.12, 0, Math.PI*2); ctx.fill();
    } else if(type.draw==='bomber') {
      // Round body with propellers/wings
      const hover = Math.sin(time * 3 + e.spawnTime) * 3;
      ctx.translate(0, hover);
      ctx.fillStyle = type.color;
      ctx.shadowColor = type.color;
      ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(0, 0, s*0.45, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
      // Wings
      ctx.fillStyle = '#664400';
      ctx.fillRect(-s*0.7, -s*0.1, s*0.3, s*0.2);
      ctx.fillRect(s*0.4, -s*0.1, s*0.3, s*0.2);
      // Bomb indicator
      ctx.fillStyle = '#ff2200';
      ctx.beginPath(); ctx.arc(0, s*0.2, s*0.12, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();
  },
  drawBoss(ctx, e, time) {
    const {x, y, size} = e;
    ctx.save();
    ctx.translate(x, y);
    const s = size;
    // Neon glow outer
    ctx.fillStyle = e.type.color;
    ctx.shadowColor = e.type.color;
    ctx.shadowBlur = 40;
    ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    // Inner dark ring
    ctx.fillStyle = 'rgba(10,10,26,0.5)';
    ctx.beginPath(); ctx.arc(0, 0, s*0.7, 0, Math.PI*2); ctx.fill();
    // Inner core
    ctx.fillStyle = e.type.color;
    ctx.beginPath(); ctx.arc(0, 0, s*0.4, 0, Math.PI*2); ctx.fill();
    // Scanlines
    ctx.strokeStyle = 'rgba(10,10,26,0.3)';
    ctx.lineWidth = 2;
    for(let i=-s;i<s;i+=6) {
      ctx.beginPath(); ctx.moveTo(-s, i); ctx.lineTo(s, i); ctx.stroke();
    }
    // Eyes
    ctx.fillStyle = '#ff0080';
    ctx.shadowColor = '#ff0080';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(-s*0.2, -s*0.15, s*0.1, 0, Math.PI*2);
    ctx.arc(s*0.2, -s*0.15, s*0.1, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // HP bar
    const hpPct = e.hp / e.maxHp;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(-s, -s-14, s*2, 8);
    ctx.fillStyle = hpPct > 0.5 ? '#00ffff' : '#ff0080';
    ctx.fillRect(-s, -s-14, s*2*hpPct, 8);
    ctx.strokeStyle = '#555';
    ctx.strokeRect(-s, -s-14, s*2, 8);
    // Name
    ctx.fillStyle = '#00ffff';
    ctx.font = '12px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText(e.type.name, 0, -s-18);
    ctx.restore();
  },
  drawBackground(ctx, cam, W, H, time) {
    // Dark grid floor with neon grid lines
    ctx.fillStyle = THEME.palette.floorBase;
    ctx.fillRect(0, 0, W, H);
    const gs = 64;
    const ox = (-cam.x % gs + gs) % gs;
    const oy = (-cam.y % gs + gs) % gs;
    // Cyan grid lines
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.08;
    for(let x = ox; x < W; x += gs) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for(let y = oy; y < H; y += gs) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // Digital rain-like particles in background
    const rainCount = 12;
    for(let i = 0; i < rainCount; i++) {
      const rx = ((i * 347 + 100) % 1400) - cam.x % 1400;
      const ry = ((i * 521 + (time * 40 * (1 + i%3)) ) % 1000) - cam.y % 1000;
      const a = 0.06 + 0.04 * Math.sin(time * 2 + i);
      ctx.fillStyle = `rgba(0,255,255,${a})`;
      ctx.font = '10px Share Tech Mono';
      const chars = ['0','1','0','1','#','@','$'];
      ctx.fillText(chars[i % chars.length], rx, ry);
    }
    // Occasional glitch flicker spots
    if(Math.sin(time * 7.3) > 0.95) {
      const gx = ((time * 200) % W);
      const gy = ((time * 137) % H);
      ctx.fillStyle = 'rgba(255,0,128,0.06)';
      ctx.fillRect(gx - 50, gy - 2, 100, 4);
    }
    if(Math.sin(time * 11.7) > 0.93) {
      const gx2 = ((time * 300 + 400) % W);
      const gy2 = ((time * 200 + 100) % H);
      ctx.fillStyle = 'rgba(0,255,255,0.05)';
      ctx.fillRect(gx2 - 80, gy2 - 1, 160, 2);
    }
  },
  drawProjectile(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    if(p.weaponType === 'projectile') {
      // Bright cyan elongated bolt
      ctx.fillStyle = '#00ffff';
      ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 12;
      const angle = Math.atan2(p.vy, p.vx);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.ellipse(0, 0, 6+p.level, 2+p.level*0.5, 0, 0, Math.PI*2);
      ctx.fill();
    } else if(p.weaponType === 'chain') {
      // Electric arcs (blue-white)
      ctx.strokeStyle = '#ccddff';
      ctx.shadowColor = '#88aaff'; ctx.shadowBlur = 12;
      ctx.lineWidth = 2 + p.level;
      ctx.beginPath(); ctx.moveTo(-8,0); ctx.lineTo(-3,4); ctx.lineTo(3,-4); ctx.lineTo(8,0); ctx.stroke();
    } else if(p.weaponType === 'rain') {
      // Green nano particles falling
      ctx.fillStyle = '#39ff14';
      ctx.shadowColor = '#39ff14'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(0,0,4+p.level,0,Math.PI*2); ctx.fill();
      // Tiny orbiting dots
      for(let i=0;i<3;i++) {
        const a = p.angle*3 + i*Math.PI*2/3;
        ctx.fillStyle = 'rgba(57,255,20,0.5)';
        ctx.beginPath(); ctx.arc(Math.cos(a)*6, Math.sin(a)*6, 1.5, 0, Math.PI*2); ctx.fill();
      }
    } else if(p.weaponType === 'boomerang') {
      // Spinning pink disc
      ctx.fillStyle = '#ff0080';
      ctx.shadowColor = '#ff0080'; ctx.shadowBlur = 10;
      ctx.rotate(p.angle || 0);
      ctx.beginPath();
      ctx.arc(0, 0, 5+p.level, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#0a0a1a';
      ctx.beginPath();
      ctx.arc(0, 0, 2+p.level*0.3, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.restore();
  },
  drawGem(ctx, g, time) {
    const pulse = 1 + 0.15*Math.sin(time*5 + g.x);
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.scale(pulse, pulse);
    // Hexagonal data fragments
    ctx.fillStyle = g.value > 5 ? '#00ffff' : g.value > 2 ? '#ff0080' : '#39ff14';
    ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 8;
    ctx.beginPath();
    for(let i=0;i<6;i++) {
      const a = Math.PI/3 * i - Math.PI/6;
      const px = Math.cos(a) * 5;
      const py = Math.sin(a) * 5;
      if(i===0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill();
    ctx.restore();
  },
  classConfig: {
    classId: 'gunner',
    className: 'Gunner',
    classIcon: '\u{1F52B}',
    classDesc: 'Ranged specialist. Excels with projectiles and precision damage.',
    startingStats: { hp: 80, speed: 160, damage: 1.2, defense: 0.9 },
    weaponAffinities: {
      primary: ['projectile', 'beam', 'chain'],
      secondary: ['rain', 'boomerang']
    },
    classPassive: { id: 'targeting_system', name: 'Targeting System', desc: '+10% crit chance, +15% projectile speed', effect: { critBonus: 0.10, projSpeedMult: 1.15 } },
    signatureAbility: { name: 'Overclock', desc: '2x fire rate, +2 pierce for 5s', icon: '\u26A1', cooldown: 45, duration: 5 }
  },

  ui: {
    title: 'Cyberpunk Survivors',
    subtitle: 'Survive the Grid',
    gameOverTitle: 'System Failure',
    levelUpSubtitle: 'Choose your upgrade',
    victoryTitleColor: '#00ffff',
    victorySubtitle: 'The Grid has been purged',
    victoryNextText: 'Warping to next world...',
    victoryNextColor: '#ff0080',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&display=swap'
  },

  cssVars: {
    '--bg': '#0a0a1a',
    '--body-font': "'Share Tech Mono',monospace",
    '--body-color': '#c0e0ff',
    '--title-font': "'Orbitron',sans-serif",
    '--title-weight': '900',
    '--hud-shadow': 'rgba(0,255,255,0.6)',
    '--gold': '#00ffff',
    '--accent': '#ff0080',
    '--xp-start': '#ff0080',
    '--xp-end': '#00ffff',
    '--hp-start': '#00ffff',
    '--hp-end': '#ff0080',
    '--gold-glow': 'rgba(0,255,255,0.5)',
    '--title-bg-inner': '#0a0a2a',
    '--title-bg-outer': '#0a0a1a',
    '--overlay-rgb': '5,0,15',
    '--screen-title-shadow': '0 0 40px rgba(255,0,128,0.6),0 0 80px rgba(0,255,255,0.3)',
    '--subtitle-style': 'normal',
    '--btn-bg': 'rgba(255,0,128,0.3)',
    '--btn-hover-bg': 'rgba(255,0,128,0.6)',
    '--btn-hover-shadow': 'rgba(0,255,255,0.4)',
    '--stats-color': '#8090b0',
    '--card-bg': 'rgba(10,10,30,0.9)',
    '--hint-color': '#556'
  }
};
