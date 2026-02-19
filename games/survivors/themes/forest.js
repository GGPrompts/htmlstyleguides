window.THEME = {
  name: 'Forest Survivors',
  fonts: { title: 'Amatic SC', body: 'Cabin' },
  victoryCondition: { timeSeconds: 540, bossName: 'The Blight' },
  worldOrder: { current: 2, next: 'shop.html?world=cosmic' },
  song: '../../music/audio-tracker/songs/survivors-forest.json',
  palette: {
    bg: '#0a1a0a', bgLight: '#152015', accent: '#228b22',
    gold: '#daa520', bone: '#d8e8c8', emerald: '#33cc33',
    purple: '#9966cc', blood: '#cc4444', midnight: '#050a05',
    floorBase: '#0d1a0d', floorLine: '#1a2a1a'
  },
  effectColors: {
    field: { fillRgb: '34,139,34', strokeRgb: '34,139,34' },
    orbit: { ring: 'rgba(34,139,34,0.15)', orb: '#33cc33' },
    area: { rgb: '34,139,34' },
    beam: { rgb: '200,255,100', glow: '#aaff44' },
    chain: { rgb: '51,170,51', particle: '#77bbff' },
    damageFlash: { rgb: '180,0,0' },
    invuln: { rgb: '255,255,255' },
    rain: { particle: '#ff6633' }
  },
  enemies: [
    { name:'Beetle', color:'#554422', size:12, speed:50, hp:3, xp:1, spawnAfter:0, draw:'beetle', movementType:'chase' },
    { name:'Wasp', color:'#ccaa00', size:10, speed:90, hp:2, xp:1, spawnAfter:0, draw:'wasp', movementType:'strafe' },
    { name:'Spider', color:'#333333', size:15, speed:55, hp:6, xp:2, spawnAfter:30, draw:'spider', movementType:'ambush' },
    { name:'Thorned Vine', color:'#336633', size:14, speed:40, hp:8, xp:3, spawnAfter:90, draw:'vine', movementType:'orbit' },
    { name:'Fox Hunter', color:'#cc5500', size:13, speed:95, hp:4, xp:3, spawnAfter:120, draw:'fox', movementType:'flanker' },
    { name:'Wolf Pack', color:'#777788', size:14, speed:100, hp:5, xp:3, spawnAfter:180, draw:'wolf', movementType:'charge' },
    { name:'Hawk', color:'#886644', size:13, speed:75, hp:5, xp:4, spawnAfter:180, draw:'hawk', movementType:'divebomber' },
    { name:'Corrupted Treant', color:'#443322', size:22, speed:25, hp:25, xp:8, spawnAfter:240, draw:'treant', movementType:'shieldbearer' },
    { name:'Forest Warden', color:'#225522', size:18, speed:50, hp:20, xp:6, spawnAfter:300, draw:'warden', movementType:'chase' }
  ],
  bosses: [
    { name:'Giant Spider Queen', color:'#222222', size:50, speed:30, hp:200, xp:50, spawnAt:120, attackPattern:'summon' },
    { name:'Thorned Titan', color:'#336633', size:55, speed:25, hp:400, xp:80, spawnAt:240, attackPattern:'shockwave' },
    { name:'Alpha Wolf', color:'#aaaaaa', size:40, speed:65, hp:600, xp:120, spawnAt:360, attackPattern:'charge' },
    { name:'The Blight', color:'#553300', size:60, speed:35, hp:1200, xp:200, spawnAt:480, attackPattern:'beam' }
  ],
  weapons: [
    { name:'Thorn Shot', desc:'Fires a barbed thorn bolt', icon:'\u273B', type:'projectile' },
    { name:'Fairy Orbit', desc:'Orbiting fairy lights', icon:'\u2748', type:'orbit' },
    { name:'Root Nova', desc:'Expanding root blast', icon:'\u2618', type:'area' },
    { name:'Chain Vine', desc:'Vines lash between foes', icon:'\u2E19', type:'chain' },
    { name:'Sunbeam', desc:'Focused ray of sunlight', icon:'\u2600', type:'beam' },
    { name:'Seed Rain', desc:'Seeds rain from the canopy', icon:'\u2766', type:'rain' },
    { name:'Leaf Blade', desc:'Returning razor leaf', icon:'\u2618', type:'boomerang' },
    { name:'Mushroom Spore Field', desc:'Toxic spore cloud zone', icon:'\u2668', type:'field' }
  ],
  passives: [
    { name:"Nature's Gift", desc:'+20% Max HP', icon:'\u2665', stat:'maxHp', mult:1.2 },
    { name:'Deer Speed', desc:'+15% Move Speed', icon:'\u27A4', stat:'speed', mult:1.15 },
    { name:'Pollen Wind', desc:'+40% Pickup Range', icon:'\u2609', stat:'pickupRadius', mult:1.4 },
    { name:'Bear Strength', desc:'+20% Damage', icon:'\u2694', stat:'damage', mult:1.2 },
    { name:'Hummingbird', desc:'+15% Attack Speed', icon:'\u231A', stat:'attackSpeed', mult:1.15 },
    { name:'Bark Skin', desc:'-15% Damage Taken', icon:'\u26E8', stat:'defense', mult:0.85 }
  ],
  drawPlayer(ctx, x, y, r, time) {
    // Forest druid/ranger - hooded figure in green robes
    ctx.save();
    ctx.translate(x, y);
    // Cloak / robe
    ctx.beginPath();
    ctx.moveTo(-r*0.7, -r*0.3);
    ctx.lineTo(-r*0.9, r);
    ctx.lineTo(r*0.9, r);
    ctx.lineTo(r*0.7, -r*0.3);
    ctx.closePath();
    ctx.fillStyle = '#1a3a1a';
    ctx.fill();
    // Body
    ctx.beginPath();
    ctx.arc(0, -r*0.1, r*0.65, 0, Math.PI*2);
    ctx.fillStyle = '#2a4a2a';
    ctx.fill();
    // Head / hood
    ctx.beginPath();
    ctx.arc(0, -r*0.7, r*0.35, 0, Math.PI*2);
    ctx.fillStyle = '#d8e8c8';
    ctx.fill();
    // Eyes glow (green-gold)
    const glow = 0.5 + 0.5*Math.sin(time*3);
    ctx.fillStyle = `rgba(218,165,32,${0.6+glow*0.4})`;
    ctx.beginPath();
    ctx.arc(-r*0.12, -r*0.75, 2.5, 0, Math.PI*2);
    ctx.arc(r*0.12, -r*0.75, 2.5, 0, Math.PI*2);
    ctx.fill();
    // Wooden staff glow
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(r*0.5, -r*0.6);
    ctx.lineTo(r*0.5, r*0.9);
    ctx.stroke();
    // Staff top glow
    ctx.fillStyle = `rgba(51,204,51,${0.4+glow*0.3})`;
    ctx.shadowColor = '#33cc33';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(r*0.5, -r*0.7, 3, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // Leaf particles around feet
    for(let i = 0; i < 3; i++) {
      const la = time*2 + i*2.1;
      const lx = Math.cos(la) * r*0.6;
      const ly = r*0.7 + Math.sin(la*1.3) * 3;
      ctx.fillStyle = `rgba(34,139,34,${0.3+0.2*Math.sin(time*3+i)})`;
      ctx.beginPath();
      ctx.ellipse(lx, ly, 3, 1.5, la, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.restore();
  },
  drawEnemy(ctx, e, time) {
    const {x, y, size, type} = e;
    ctx.save();
    ctx.translate(x, y);
    const s = size;
    if(type.draw==='beetle') {
      // Round brown body with shell pattern and small legs
      ctx.fillStyle = type.color;
      ctx.beginPath(); ctx.ellipse(0, 0, s*0.5, s*0.4, 0, 0, Math.PI*2); ctx.fill();
      // Shell line
      ctx.strokeStyle = '#332211';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, -s*0.4); ctx.lineTo(0, s*0.4); ctx.stroke();
      // Legs
      ctx.strokeStyle = '#443322';
      ctx.lineWidth = 1;
      for(let i = -1; i <= 1; i++) {
        ctx.beginPath(); ctx.moveTo(-s*0.4, i*s*0.15); ctx.lineTo(-s*0.65, i*s*0.25); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(s*0.4, i*s*0.15); ctx.lineTo(s*0.65, i*s*0.25); ctx.stroke();
      }
      // Head
      ctx.fillStyle = '#332211';
      ctx.beginPath(); ctx.arc(0, -s*0.45, s*0.15, 0, Math.PI*2); ctx.fill();
    } else if(type.draw==='wasp') {
      // Elongated yellow-black striped body with small wings
      ctx.fillStyle = type.color;
      ctx.beginPath(); ctx.ellipse(0, 0, s*0.3, s*0.55, 0, 0, Math.PI*2); ctx.fill();
      // Stripes
      ctx.fillStyle = '#111';
      ctx.fillRect(-s*0.25, -s*0.15, s*0.5, s*0.08);
      ctx.fillRect(-s*0.25, s*0.05, s*0.5, s*0.08);
      ctx.fillRect(-s*0.25, s*0.25, s*0.5, s*0.08);
      // Wings
      const wingFlap = Math.sin(time*20 + e.spawnTime*10);
      ctx.fillStyle = 'rgba(200,220,255,0.4)';
      ctx.beginPath(); ctx.ellipse(-s*0.4, -s*0.1, s*0.25, s*0.1*Math.abs(wingFlap), 0.3, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(s*0.4, -s*0.1, s*0.25, s*0.1*Math.abs(wingFlap), -0.3, 0, Math.PI*2); ctx.fill();
      // Head
      ctx.fillStyle = '#111';
      ctx.beginPath(); ctx.arc(0, -s*0.55, s*0.12, 0, Math.PI*2); ctx.fill();
    } else if(type.draw==='spider') {
      // Round body with 8 legs radiating outward
      ctx.fillStyle = type.color;
      ctx.beginPath(); ctx.arc(0, 0, s*0.35, 0, Math.PI*2); ctx.fill();
      // Abdomen
      ctx.beginPath(); ctx.arc(0, s*0.25, s*0.3, 0, Math.PI*2); ctx.fill();
      // 8 legs
      ctx.strokeStyle = type.color;
      ctx.lineWidth = 1.5;
      for(let i = 0; i < 8; i++) {
        const a = (i/8)*Math.PI*2 - Math.PI/2;
        const legLen = s*0.7;
        const midX = Math.cos(a)*s*0.4;
        const midY = Math.sin(a)*s*0.4;
        const endX = Math.cos(a)*legLen + Math.cos(a+0.5)*s*0.3;
        const endY = Math.sin(a)*legLen + Math.sin(a+0.5)*s*0.3;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(midX, midY); ctx.lineTo(endX, endY); ctx.stroke();
      }
      // Eyes (small red dots)
      ctx.fillStyle = '#cc0000';
      ctx.beginPath(); ctx.arc(-s*0.1, -s*0.15, 2, 0, Math.PI*2); ctx.arc(s*0.1, -s*0.15, 2, 0, Math.PI*2); ctx.fill();
    } else if(type.draw==='vine') {
      // Snaking green tendril with thorns
      ctx.strokeStyle = type.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -s*0.5);
      for(let i = 0; i < 5; i++) {
        const vy = -s*0.5 + i*(s*0.25);
        const vx = Math.sin(time*3 + i + e.spawnTime)*s*0.3;
        ctx.lineTo(vx, vy);
      }
      ctx.stroke();
      // Thorns
      ctx.fillStyle = '#225522';
      for(let i = 0; i < 4; i++) {
        const ty = -s*0.35 + i*(s*0.25);
        const tx = Math.sin(time*3 + i + e.spawnTime)*s*0.3;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx + s*0.15, ty - s*0.08);
        ctx.lineTo(tx + s*0.05, ty + s*0.05);
        ctx.closePath();
        ctx.fill();
      }
    } else if(type.draw==='wolf') {
      // Angular canine shape, grey fur
      ctx.fillStyle = type.color;
      // Body
      ctx.beginPath();
      ctx.ellipse(0, 0, s*0.55, s*0.3, 0, 0, Math.PI*2);
      ctx.fill();
      // Head
      ctx.beginPath();
      ctx.arc(0, -s*0.35, s*0.25, 0, Math.PI*2);
      ctx.fill();
      // Ears (pointed)
      ctx.beginPath();
      ctx.moveTo(-s*0.2, -s*0.5); ctx.lineTo(-s*0.1, -s*0.75); ctx.lineTo(0, -s*0.5);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, -s*0.5); ctx.lineTo(s*0.1, -s*0.75); ctx.lineTo(s*0.2, -s*0.5);
      ctx.closePath(); ctx.fill();
      // Eyes
      ctx.fillStyle = '#ffcc00';
      ctx.beginPath(); ctx.arc(-s*0.08, -s*0.38, 2, 0, Math.PI*2); ctx.arc(s*0.08, -s*0.38, 2, 0, Math.PI*2); ctx.fill();
      // Snout
      ctx.fillStyle = '#555566';
      ctx.beginPath(); ctx.arc(0, -s*0.25, s*0.08, 0, Math.PI*2); ctx.fill();
    } else if(type.draw==='treant') {
      // Large tree-like shape with face, brown with green leaves
      // Trunk
      ctx.fillStyle = type.color;
      ctx.fillRect(-s*0.3, -s*0.2, s*0.6, s*0.8);
      // Roots
      ctx.beginPath();
      ctx.moveTo(-s*0.3, s*0.6); ctx.lineTo(-s*0.5, s*0.8);
      ctx.moveTo(s*0.3, s*0.6); ctx.lineTo(s*0.5, s*0.8);
      ctx.strokeStyle = type.color; ctx.lineWidth = 3; ctx.stroke();
      // Canopy / leaves
      ctx.fillStyle = '#225522';
      ctx.beginPath(); ctx.arc(0, -s*0.4, s*0.5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#338833';
      ctx.beginPath(); ctx.arc(-s*0.2, -s*0.5, s*0.25, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(s*0.2, -s*0.45, s*0.25, 0, Math.PI*2); ctx.fill();
      // Face
      ctx.fillStyle = '#ffcc66';
      ctx.beginPath(); ctx.arc(-s*0.12, -s*0.1, 3, 0, Math.PI*2); ctx.arc(s*0.12, -s*0.1, 3, 0, Math.PI*2); ctx.fill();
      // Mouth
      ctx.strokeStyle = '#ffcc66';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(0, s*0.05, s*0.1, 0, Math.PI); ctx.stroke();
    } else if(type.draw==='fox') {
      // Sleek orange fox shape
      ctx.fillStyle = type.color;
      ctx.beginPath();
      ctx.moveTo(0, -s*0.5);
      ctx.lineTo(s*0.4, s*0.2);
      ctx.lineTo(s*0.15, s*0.4);
      ctx.lineTo(-s*0.15, s*0.4);
      ctx.lineTo(-s*0.4, s*0.2);
      ctx.closePath();
      ctx.fill();
      // Ears
      ctx.beginPath();
      ctx.moveTo(-s*0.2, -s*0.4); ctx.lineTo(-s*0.35, -s*0.65); ctx.lineTo(-s*0.05, -s*0.35);
      ctx.moveTo(s*0.2, -s*0.4); ctx.lineTo(s*0.35, -s*0.65); ctx.lineTo(s*0.05, -s*0.35);
      ctx.fillStyle = '#ff7700'; ctx.fill();
      // Eyes
      ctx.fillStyle = '#ffcc00';
      ctx.beginPath(); ctx.arc(-s*0.1, -s*0.15, 2, 0, Math.PI*2); ctx.arc(s*0.1, -s*0.15, 2, 0, Math.PI*2); ctx.fill();
    } else if(type.draw==='hawk') {
      // Bird with spread wings
      const hover = Math.sin(time * 3 + e.spawnTime) * 4;
      ctx.translate(0, hover);
      ctx.fillStyle = type.color;
      // Body
      ctx.beginPath(); ctx.ellipse(0, 0, s*0.2, s*0.35, 0, 0, Math.PI*2); ctx.fill();
      // Wings
      ctx.beginPath();
      ctx.moveTo(-s*0.15, 0); ctx.lineTo(-s*0.65, -s*0.3); ctx.lineTo(-s*0.5, s*0.1);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(s*0.15, 0); ctx.lineTo(s*0.65, -s*0.3); ctx.lineTo(s*0.5, s*0.1);
      ctx.closePath(); ctx.fill();
      // Eye
      ctx.fillStyle = '#ffcc00';
      ctx.beginPath(); ctx.arc(0, -s*0.15, 2, 0, Math.PI*2); ctx.fill();
    } else if(type.draw==='warden') {
      // Armored forest guardian
      ctx.fillStyle = type.color;
      ctx.beginPath(); ctx.arc(0, 0, s*0.5, 0, Math.PI*2); ctx.fill();
      // Antlers
      ctx.strokeStyle = '#443322';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-s*0.15, -s*0.4); ctx.lineTo(-s*0.35, -s*0.7); ctx.lineTo(-s*0.5, -s*0.65);
      ctx.moveTo(s*0.15, -s*0.4); ctx.lineTo(s*0.35, -s*0.7); ctx.lineTo(s*0.5, -s*0.65);
      ctx.stroke();
      // Eyes
      ctx.fillStyle = '#44ff44';
      ctx.beginPath(); ctx.arc(-s*0.12, -s*0.1, 3, 0, Math.PI*2); ctx.arc(s*0.12, -s*0.1, 3, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();
  },
  drawBoss(ctx, e, time) {
    const {x, y, size} = e;
    ctx.save();
    ctx.translate(x, y);
    const s = size;
    ctx.fillStyle = e.type.color;
    ctx.shadowColor = '#33cc33';
    ctx.shadowBlur = 30;
    ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    // Inner details
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.arc(0, 0, s*0.7, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = e.type.color;
    ctx.beginPath(); ctx.arc(0, 0, s*0.4, 0, Math.PI*2); ctx.fill();
    // Eyes
    ctx.fillStyle = '#33cc33';
    ctx.beginPath();
    ctx.arc(-s*0.2, -s*0.15, s*0.1, 0, Math.PI*2);
    ctx.arc(s*0.2, -s*0.15, s*0.1, 0, Math.PI*2);
    ctx.fill();
    // HP bar
    const hpPct = e.hp / e.maxHp;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(-s, -s-14, s*2, 8);
    ctx.fillStyle = hpPct > 0.5 ? '#228b22' : '#daa520';
    ctx.fillRect(-s, -s-14, s*2*hpPct, 8);
    ctx.strokeStyle = '#888';
    ctx.strokeRect(-s, -s-14, s*2, 8);
    // Name
    ctx.fillStyle = '#daa520';
    ctx.font = '12px Amatic SC';
    ctx.textAlign = 'center';
    ctx.fillText(e.type.name, 0, -s-18);
    ctx.restore();
  },
  drawBackground(ctx, cam, W, H, time) {
    // Forest floor with grass texture
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
    // Scattered grass dots / patches
    const seed = 12345;
    for(let i = 0; i < 40; i++) {
      const gx = ((i * 347 + 50) % 1400) - cam.x % 1400;
      const gy = ((i * 521 + 80) % 1000) - cam.y % 1000;
      ctx.fillStyle = `rgba(34,139,34,${0.08 + 0.04*Math.sin(time*0.5+i)})`;
      ctx.beginPath(); ctx.arc(gx, gy, 2+i%3, 0, Math.PI*2); ctx.fill();
    }
    // Subtle dark tree silhouettes in background
    ctx.globalAlpha = 0.06;
    for(let i = 0; i < 4; i++) {
      const tx = ((i * 431 + 200) % 1200) - cam.x % 1200;
      const ty = ((i * 293 + 100) % 900) - cam.y % 900;
      ctx.fillStyle = '#0a2a0a';
      // Trunk
      ctx.fillRect(tx-4, ty, 8, 60);
      // Canopy
      ctx.beginPath(); ctx.arc(tx, ty-10, 30+i*5, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // Wildflower spots of color
    for(let i = 0; i < 8; i++) {
      const fx = ((i * 613 + 300) % 1300) - cam.x % 1300;
      const fy = ((i * 401 + 150) % 950) - cam.y % 950;
      const colors = ['rgba(255,100,100,0.12)','rgba(255,200,50,0.12)','rgba(180,100,255,0.12)','rgba(100,200,255,0.12)'];
      ctx.fillStyle = colors[i%4];
      ctx.beginPath(); ctx.arc(fx, fy, 3, 0, Math.PI*2); ctx.fill();
    }
    // Soft dappled light effects
    const flickerT = time * 0.8;
    for(let i = 0; i < 6; i++) {
      const lx = ((i * 347 + 100) % 1200) - cam.x % 1200;
      const ly = ((i * 521 + 200) % 900) - cam.y % 900;
      const flicker = 0.08 + 0.06 * Math.sin(flickerT + i * 1.7);
      const grd = ctx.createRadialGradient(lx, ly, 0, lx, ly, 100);
      grd.addColorStop(0, `rgba(200,220,120,${flicker})`);
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.fillRect(lx-100, ly-100, 200, 200);
    }
  },
  drawProjectile(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    if(p.weaponType === 'projectile') {
      // Green thorn/seed bolt
      ctx.fillStyle = '#33cc33';
      ctx.shadowColor = '#33cc33'; ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(0, -(4+p.level));
      ctx.lineTo(3+p.level*0.5, 0);
      ctx.lineTo(0, 4+p.level);
      ctx.lineTo(-(3+p.level*0.5), 0);
      ctx.closePath();
      ctx.fill();
    } else if(p.weaponType === 'chain') {
      // Vine tendril connecting enemies (green)
      ctx.strokeStyle = '#33aa33';
      ctx.shadowColor = '#33aa33'; ctx.shadowBlur = 12;
      ctx.lineWidth = 2 + p.level;
      ctx.beginPath(); ctx.moveTo(-8,0); ctx.quadraticCurveTo(0, -5, 8, 0); ctx.stroke();
    } else if(p.weaponType === 'rain') {
      // Seeds/acorns falling (brown)
      ctx.fillStyle = '#8B6914';
      ctx.shadowColor = '#daa520'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(0,0,4+p.level,0,Math.PI*2); ctx.fill();
      // Acorn cap
      ctx.fillStyle = '#5a4a1a';
      ctx.beginPath(); ctx.arc(0, -(2+p.level*0.5), 3+p.level*0.5, Math.PI, 0); ctx.fill();
    } else if(p.weaponType === 'boomerang') {
      // Spinning leaf (green)
      ctx.fillStyle = '#228b22';
      ctx.rotate(p.angle || 0);
      ctx.beginPath();
      ctx.ellipse(0, 0, 6+p.level, 3+p.level*0.5, 0, 0, Math.PI*2);
      ctx.fill();
      // Leaf vein
      ctx.strokeStyle = '#115511';
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(-(6+p.level), 0); ctx.lineTo(6+p.level, 0); ctx.stroke();
    }
    ctx.restore();
  },
  drawGem(ctx, g, time) {
    // Dewdrop/seed shapes
    const pulse = 1 + 0.15*Math.sin(time*5 + g.x);
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = g.value > 5 ? '#daa520' : g.value > 2 ? '#33cc33' : '#9966cc';
    ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 8;
    // Dewdrop shape
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.quadraticCurveTo(5, 0, 0, 5);
    ctx.quadraticCurveTo(-5, 0, 0, -6);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  },
  classConfig: {
    classId: 'ranger',
    className: 'Ranger',
    classIcon: '\u{1F3F9}',
    classDesc: 'Swift hunter. Masters boomerangs, traps, and damage over time.',
    startingStats: { hp: 90, speed: 180, damage: 1.0, defense: 1.0 },
    weaponAffinities: {
      primary: ['boomerang', 'rain', 'field'],
      secondary: ['projectile', 'chain']
    },
    classPassive: { id: 'wild_stride', name: 'Wild Stride', desc: '+15% move speed, +10% evasion', effect: { speedMult: 1.15, evasionChance: 0.10 } },
    signatureAbility: { name: "Nature's Veil", desc: 'Stealth + 30% speed for 6s, ambush 3x dmg', icon: '\uD83C\uDF3F', cooldown: 40, duration: 6 }
  },

  ui: {
    title: 'Forest Survivors',
    subtitle: 'Defend the Grove',
    gameOverTitle: 'The Grove Falls',
    levelUpSubtitle: 'Choose your blessing',
    victoryTitleColor: '#33cc33',
    victorySubtitle: 'The Grove is cleansed',
    victoryNextText: 'Warping to next world...',
    victoryNextColor: '#228b22',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Amatic+SC:wght@400;700&family=Cabin:wght@400;700&display=swap'
  },

  cssVars: {
    '--bg': '#0a1a0a',
    '--body-font': "'Cabin',sans-serif",
    '--body-color': '#d8e8c8',
    '--title-font': "'Amatic SC',cursive",
    '--title-weight': '700',
    '--hud-shadow': 'rgba(34,139,34,0.6)',
    '--gold': '#daa520',
    '--accent': '#228b22',
    '--xp-start': '#228b22',
    '--xp-end': '#daa520',
    '--hp-start': '#145214',
    '--hp-end': '#33cc33',
    '--gold-glow': 'rgba(218,165,32,0.5)',
    '--title-bg-inner': '#0a1a0a',
    '--title-bg-outer': '#050a05',
    '--overlay-rgb': '5,10,5',
    '--screen-title-shadow': '0 0 40px rgba(34,139,34,0.6),0 0 80px rgba(218,165,32,0.3)',
    '--subtitle-style': 'italic',
    '--btn-bg': 'rgba(34,139,34,0.3)',
    '--btn-hover-bg': 'rgba(34,139,34,0.6)',
    '--btn-hover-shadow': 'rgba(218,165,32,0.4)',
    '--stats-color': '#a0b8a0',
    '--card-bg': 'rgba(10,20,10,0.9)',
    '--hint-color': '#777'
  },

  shopConfig: {
    title: "Ranger\u2019s Outpost",
    subtitle: 'Sharpen your instincts, Ranger',
    goldIcon: '\u{1F33E}',
    nextWorld: { label: 'The Whispering Forest', url: 'arena.html?world=forest' },
    continueVerb: 'Venture into',
    categories: {
      stats: { icon: '\u{1F3F9}', label: 'Wilderness Training' },
      weapons: { icon: '\u{1F343}', label: 'Druidic Armaments' },
      passives: { icon: '\u2728', label: 'Woodland Enchantments' },
      skills: { icon: '\u{1F333}', label: 'Living Roots' },
      inventory: { icon: '\u{1F392}', label: 'Satchel' }
    },
    emptyInventoryMsg: 'No items yet. Defeat enemies to find loot!',

    statUpgrades: [
      { id: 'spd1', name: 'Deer Sprint I',    desc: '+10% Speed \u2014 Fleet as a fawn',            icon: '\u{1F98C}', cost: 150,  stat: 'speed', mult: 1.10 },
      { id: 'spd2', name: 'Deer Sprint II',   desc: '+10% Speed \u2014 Wind through the canopy',    icon: '\u{1F98C}', cost: 400,  stat: 'speed', mult: 1.10, requires: 'spd1' },
      { id: 'spd3', name: 'Deer Sprint III',  desc: '+10% Speed \u2014 Swift as falling leaves',    icon: '\u{1F98C}', cost: 1000, stat: 'speed', mult: 1.10, requires: 'spd2' },
      { id: 'spd4', name: 'Deer Sprint IV',   desc: '+10% Speed \u2014 Foxfire agility',            icon: '\u{1F98C}', cost: 2000, stat: 'speed', mult: 1.10, requires: 'spd3' },
      { id: 'spd5', name: 'Deer Sprint V',    desc: '+10% Speed \u2014 Phantom of the woods',       icon: '\u{1F98C}', cost: 4000, stat: 'speed', mult: 1.10, requires: 'spd4' },
      { id: 'dmg1', name: 'Thorn Strike I',   desc: '+15% Damage \u2014 Briar-kissed blows',        icon: '\u{1F339}', cost: 150,  stat: 'damage', mult: 1.15 },
      { id: 'dmg2', name: 'Thorn Strike II',  desc: '+15% Damage \u2014 Poison ivy venom',          icon: '\u{1F339}', cost: 400,  stat: 'damage', mult: 1.15, requires: 'dmg1' },
      { id: 'dmg3', name: 'Thorn Strike III', desc: '+15% Damage \u2014 Wildwood fury',             icon: '\u{1F339}', cost: 1000, stat: 'damage', mult: 1.15, requires: 'dmg2' },
      { id: 'dmg4', name: 'Thorn Strike IV',  desc: '+15% Damage \u2014 Elder tree wrath',          icon: '\u{1F339}', cost: 2000, stat: 'damage', mult: 1.15, requires: 'dmg3' },
      { id: 'dmg5', name: 'Thorn Strike V',   desc: '+15% Damage \u2014 World-root crush',          icon: '\u{1F339}', cost: 4000, stat: 'damage', mult: 1.15, requires: 'dmg4' },
      { id: 'pick1', name: 'Root Reach I',    desc: '+15 Pickup Range \u2014 Tendrils seek nearby',  icon: '\u{1F33F}', cost: 150,  stat: 'pickupRadius', bonus: 15 },
      { id: 'pick2', name: 'Root Reach II',   desc: '+15 Pickup Range \u2014 Mycelium network',      icon: '\u{1F33F}', cost: 400,  stat: 'pickupRadius', bonus: 15, requires: 'pick1' },
      { id: 'pick3', name: 'Root Reach III',  desc: '+15 Pickup Range \u2014 Sprawling undergrowth', icon: '\u{1F33F}', cost: 1000, stat: 'pickupRadius', bonus: 15, requires: 'pick2' },
      { id: 'pick4', name: 'Root Reach IV',   desc: '+15 Pickup Range \u2014 Ancient root web',      icon: '\u{1F33F}', cost: 2000, stat: 'pickupRadius', bonus: 15, requires: 'pick3' },
      { id: 'pick5', name: 'Root Reach V',    desc: '+15 Pickup Range \u2014 Forest-wide communion', icon: '\u{1F33F}', cost: 4000, stat: 'pickupRadius', bonus: 15, requires: 'pick4' }
    ],

    startingWeapons: [
      { id: 'w_projectile', name: 'Thorn Volley',     desc: 'Start with a barrage of razor thorns',        icon: '\u{1F331}', cost: 400, weaponType: 'projectile' },
      { id: 'w_boomerang',  name: 'Leaf Blade',       desc: 'Start with a returning razor leaf',            icon: '\u{1F342}', cost: 400, weaponType: 'boomerang' },
      { id: 'w_chain',      name: 'Vine Lash',        desc: 'Start with a chaining vine whip',              icon: '\u{1FAB4}', cost: 600, weaponType: 'chain' },
      { id: 'w_rain',       name: 'Acorn Rain',       desc: 'Start with a hail of enchanted acorns',        icon: '\u{1F330}', cost: 600, weaponType: 'rain' },
      { id: 'w_field',      name: 'Fungal Patch',     desc: 'Start with a persistent toxic mushroom zone',  icon: '\u{1F340}', cost: 600, weaponType: 'field' },
      { id: 'w_beam',       name: 'Sunbeam',          desc: 'Start with a focused beam of sunlight',        icon: '\u2600',    cost: 800, weaponType: 'beam' },
      { id: 'w_orbit',      name: 'Circling Sprites', desc: 'Start with orbiting will-o-wisps',             icon: '\u{1F7E2}', cost: 800, weaponType: 'orbit' },
      { id: 'w_area',       name: 'Spore Burst',      desc: 'Start with an expanding cloud of spores',      icon: '\u{1F344}', cost: 800, weaponType: 'area' }
    ],

    passives: [
      { id: 'p_critchance', name: 'Hawk\u2019s Gaze', desc: '+5% critical hit chance \u2014 predator instinct',       icon: '\u{1F985}', cost: 400 },
      { id: 'p_xpboost',    name: 'Ancient Wisdom',   desc: '+10% XP from all sources \u2014 the grove remembers',    icon: '\u{1F989}', cost: 400 },
      { id: 'p_regen',      name: 'Verdant Renewal',  desc: 'Recover 1 HP every 5 seconds \u2014 the forest heals',  icon: '\u{1F33B}', cost: 600 },
      { id: 'p_lifesteal',  name: 'Parasitic Root',   desc: 'Heal 1% of damage dealt \u2014 drain their essence',     icon: '\u{1FAB5}', cost: 800 }
    ],

    skillTree: {
      offense: {
        label: 'Offense',
        color: '#c0392b',
        icon: '\u{1F339}',
        nodes: [
          { id: 'offense_1', name: 'Predator\u2019s Eye',    desc: '+8% critical hit chance' },
          { id: 'offense_2', name: 'Venomous Thorns',        desc: '+50% critical damage multiplier' },
          { id: 'offense_3', name: 'Splinter Volley',        desc: '+2 extra projectiles per volley' },
          { id: 'offense_4', name: 'Piercing Bramble',       desc: 'Projectiles pierce +3 enemies' }
        ]
      },
      defense: {
        label: 'Defense',
        color: '#27ae60',
        icon: '\u{1F343}',
        nodes: [
          { id: 'defense_1', name: 'Verdant Pulse',          desc: 'Recover 1 HP every 5 seconds' },
          { id: 'defense_2', name: 'Misty Veil',             desc: 'Extended invulnerability after dashing' },
          { id: 'defense_3', name: 'Ironbark',               desc: '15% less damage taken' },
          { id: 'defense_4', name: 'Phoenix Bloom',          desc: 'Revive once per run at 30% HP' }
        ]
      },
      utility: {
        label: 'Utility',
        color: '#c9a84c',
        icon: '\u{1F33F}',
        nodes: [
          { id: 'utility_1', name: 'Wind Stride',            desc: '+40% dash distance' },
          { id: 'utility_2', name: 'Nimble Paws',            desc: '-30% dash cooldown' },
          { id: 'utility_3', name: 'Deep Roots',             desc: '+40 pickup radius' },
          { id: 'utility_4', name: 'Elder Knowledge',        desc: '+25% XP from all sources' }
        ]
      }
    },

    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400;0,700;1,400&family=Amatic+SC:wght@400;700&display=swap',

    cssVars: {
      '--bg': '#0e1a0b',
      '--bg-card': '#162211',
      '--bg-card-hover': '#1e2e18',
      '--accent': '#c9a84c',
      '--accent-dim': '#8b7a35',
      '--text': '#d4cdb8',
      '--text-dim': '#7a7560',
      '--success': '#4caf50',
      '--danger': '#b54a3a',
      '--owned': '#2e7d32',
      '--disabled': '#2a3328',
      '--border': '#2e3b26',
      '--radius': '8px',
      '--gap': '16px',
      '--font-title': "'Amatic SC', cursive",
      '--font-display': "'Cormorant Garamond', Georgia, serif",
      '--font-body': "'Lora', Georgia, serif",
      '--highlight': '#5a8a3c',
      '--tooltip-bg': '#14220e',
      '--btn-primary-bg': '#5a8a3c',
      '--btn-primary-color': '#fff',
      '--btn-primary-hover-bg': '#6b9e4a',
      '--btn-primary-hover-shadow': 'none'
    },

    headerDecorationHtml: '',

    extraCss: `
      body::before {
        content: '';
        position: fixed;
        inset: 0;
        z-index: -1;
        background:
          radial-gradient(ellipse 80px 60px at 15% 8%, rgba(90, 138, 60, 0.12) 0%, transparent 100%),
          radial-gradient(ellipse 120px 80px at 75% 5%, rgba(90, 138, 60, 0.10) 0%, transparent 100%),
          radial-gradient(ellipse 60px 40px at 45% 3%, rgba(90, 138, 60, 0.08) 0%, transparent 100%),
          radial-gradient(ellipse 100px 70px at 90% 12%, rgba(61, 107, 53, 0.10) 0%, transparent 100%),
          radial-gradient(ellipse 90px 50px at 30% 15%, rgba(61, 107, 53, 0.07) 0%, transparent 100%),
          radial-gradient(ellipse 30px 200px at 20% 30%, rgba(232, 200, 76, 0.04) 0%, transparent 100%),
          radial-gradient(ellipse 25px 180px at 55% 25%, rgba(232, 200, 76, 0.03) 0%, transparent 100%),
          radial-gradient(ellipse 35px 250px at 80% 20%, rgba(232, 200, 76, 0.04) 0%, transparent 100%),
          linear-gradient(180deg, #0a140a 0%, #0e1a0b 30%, #121f0e 100%);
      }
      body { position: relative; }
      .shop-header { padding: 32px 0 24px; }
      .shop-header::after {
        content: '\\1F33F \\2022 \\1F343 \\2022 \\1F33F';
        display: block;
        position: absolute;
        bottom: -10px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--bg);
        padding: 0 16px;
        color: #5a8a3c;
        font-size: 0.9rem;
        letter-spacing: 4px;
      }
      .shop-title { font-size: 3.2rem; }
      .shop-subtitle { font-family: var(--font-display); }
      .gold-display { font-size: 1.8rem; }
      .category-title { font-family: var(--font-display); font-size: 1.4rem; }
      .item-name { font-family: var(--font-display); font-size: 1.1rem; }
      .item-cost { font-family: var(--font-display); }
      .item-badge { font-family: var(--font-display); }
      .btn { font-family: var(--font-display); }
      .btn-danger:hover { background: #9a3d2e; }
      .continue-btn {
        font-family: var(--font-title);
        font-size: 1.6rem;
        background: linear-gradient(135deg, #5a8a3c, #3d6b35);
        text-shadow: 0 1px 2px rgba(0,0,0,0.3);
      }
      .continue-btn:hover { background: linear-gradient(135deg, #6b9e4a, #4a8040); }
      .skill-tree-svg .branch-label { font-family: 'Cormorant Garamond', Georgia, serif; }
      .skill-tree-svg .node-label { font-family: 'Lora', Georgia, serif; }
      .skill-points-display { font-family: var(--font-display); }
      .equip-slot .slot-label { font-family: var(--font-display); }
      .inv-item .inv-name { font-family: var(--font-display); }
      .inv-item .inv-rarity { font-family: var(--font-display); }
      .inv-item .inv-equipped-badge { font-family: var(--font-display); }
      .inv-salvage-btn { font-family: var(--font-display); }
      .modal h3 { font-family: var(--font-display); }
      .skill-tree-tooltip .tt-name { font-family: var(--font-display); }
      .inv-tooltip .tt-name { font-family: var(--font-display); }
      .toast { font-family: var(--font-display); }
      @media (max-width: 768px) {
        .shop-title { font-size: 2.2rem; }
      }
    `
  }
};
