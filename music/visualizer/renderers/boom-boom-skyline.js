/**
 * Boom Boom Skyline Renderer
 * Fireworks display inspired by Boom Boom Rocket (Xbox 360).
 * A city skyline silhouette at the bottom with fireworks launched ahead of time
 * using timeline look-ahead — shells rise so explosions sync exactly with notes.
 */
window.Renderers["boom-boom-skyline"] = (function () {
  "use strict";

  var w = 0;
  var h = 0;
  var analysis = null;
  var secondsPerRow = 0;

  var LAUNCH_AHEAD = 14;
  var MAX_SHELLS = 30;
  var MAX_PARTICLES = 800;
  var MAX_EMBERS = 200;

  var shells = [];
  var particles = [];
  var embers = [];
  var stars = [];
  var buildings = [];
  var skylineGlow = 0;
  var lastTimelineIndex = -1;
  var seed = 1;

  // Deterministic pseudo-random
  function srand(s) { seed = (s >>> 0) || 1; }
  function rand() {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  }

  function sc() { return Math.min(w, h) / 600; }

  // Channel colors by role
  var ROLE_COLORS = {
    lead:       { core: "#fff8e1", outer: "#ffd54f", trail: "#ffca28", burst: ["#fff8e1", "#ffe082", "#ffd54f", "#ffca28", "#ffb300"] },
    harmony:    { core: "#e0f7fa", outer: "#4dd0e1", trail: "#00bcd4", burst: ["#e0f7fa", "#80deea", "#4dd0e1", "#26c6da", "#00acc1"] },
    bass:       { core: "#fff3e0", outer: "#ff7043", trail: "#e64a19", burst: ["#ffccbc", "#ff8a65", "#ff7043", "#f4511e", "#e64a19"] },
    percussion: { core: "#e8f5e9", outer: "#66bb6a", trail: "#43a047", burst: ["#e8f5e9", "#a5d6a7", "#81c784", "#66bb6a", "#ffffff"] }
  };
  var FALLBACK_ROLES = ["lead", "harmony", "bass", "percussion"];

  function getRole(ch) {
    if (analysis && analysis.channelRoles && analysis.channelRoles[ch]) {
      return analysis.channelRoles[ch].role || FALLBACK_ROLES[ch] || "lead";
    }
    return FALLBACK_ROLES[ch] || "lead";
  }

  function getRoleColors(ch) {
    return ROLE_COLORS[getRole(ch)] || ROLE_COLORS.lead;
  }

  // Skyline generation
  function generateBuildings() {
    buildings = [];
    srand(42);
    var skylineH = h * 0.15;
    var x = 0;
    while (x < w) {
      var bw = 20 + rand() * 60;
      var bh = skylineH * (0.3 + rand() * 0.7);
      var hasAntenna = rand() > 0.7;
      var antennaH = hasAntenna ? bh * (0.15 + rand() * 0.25) : 0;
      var windowRows = Math.floor(bh / 12);
      var windowCols = Math.max(1, Math.floor(bw / 14));
      buildings.push({
        x: x, w: bw, h: bh,
        antenna: antennaH,
        windowRows: windowRows,
        windowCols: windowCols,
        windowSeed: (rand() * 99999) >>> 0
      });
      x += bw + 2 + rand() * 6;
    }
  }

  function generateStars() {
    stars = [];
    srand(7777);
    var count = 120 + Math.floor(rand() * 80);
    for (var i = 0; i < count; i++) {
      stars.push({
        x: rand(),
        y: rand() * 0.75,
        size: 0.5 + rand() * 1.5,
        twinkleSpeed: 0.5 + rand() * 2,
        twinkleOffset: rand() * Math.PI * 2,
        brightness: 0.3 + rand() * 0.7
      });
    }
  }

  // Launch positions: evenly spaced along skyline
  function launchX(ch, numCh) {
    var margin = w * 0.12;
    var span = w - margin * 2;
    if (numCh <= 1) return w / 2;
    return margin + (ch / (numCh - 1)) * span;
  }

  function launchY() {
    return h - h * 0.15;
  }

  // Burst altitude based on normalized pitch (0=low, 1=high)
  function burstY(normalized) {
    var top = h * 0.08;
    var bottom = h * 0.55;
    return bottom - normalized * (bottom - top);
  }

  function spawnShell(ch, note, travelTime) {
    if (shells.length >= MAX_SHELLS) return;
    var numCh = analysis ? analysis.numChannels : 4;
    var lx = launchX(ch, numCh);
    var ly = launchY();
    var ty = burstY(note.normalized || 0.5);
    var colors = getRoleColors(ch);

    // Slight horizontal wobble target
    var wobbleX = (Math.random() - 0.5) * w * 0.06;

    shells.push({
      x: lx,
      y: ly,
      startX: lx,
      startY: ly,
      targetX: lx + wobbleX,
      targetY: ty,
      travelTime: travelTime,
      elapsed: 0,
      ch: ch,
      note: note,
      colors: colors,
      trail: [],
      burst: false
    });
  }

  function burstShell(shell) {
    var role = getRole(shell.ch);
    var vol = shell.note.vol || 0.7;
    var count;
    var i, angle, speed, life, size;
    var colors = shell.colors;
    var cx = shell.x;
    var cy = shell.y;
    var s = sc();

    if (role === "percussion") {
      // Crackle/strobe: many small fast sparkles
      count = 20 + Math.floor(vol * 25);
      for (i = 0; i < count && particles.length < MAX_PARTICLES; i++) {
        angle = Math.random() * Math.PI * 2;
        speed = (80 + Math.random() * 200) * s;
        particles.push({
          x: cx, y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          gravity: 60 * s,
          life: 0.2 + Math.random() * 0.4,
          maxLife: 0.6,
          color: colors.burst[Math.floor(Math.random() * colors.burst.length)],
          size: (1 + Math.random() * 2.5) * s,
          flicker: true
        });
      }
    } else if (role === "bass") {
      // Wide palm burst: larger, slower, drooping tendrils
      count = 30 + Math.floor(vol * 20);
      for (i = 0; i < count && particles.length < MAX_PARTICLES; i++) {
        angle = Math.random() * Math.PI * 2;
        speed = (40 + Math.random() * 100) * s;
        life = 1.0 + Math.random() * 1.2;
        particles.push({
          x: cx, y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          gravity: 35 * s,
          life: life,
          maxLife: life,
          color: colors.burst[Math.floor(Math.random() * colors.burst.length)],
          size: (3 + Math.random() * 4) * s,
          flicker: false
        });
      }
    } else {
      // Chrysanthemum / peony: classic spherical burst
      count = 35 + Math.floor(vol * 30);
      for (i = 0; i < count && particles.length < MAX_PARTICLES; i++) {
        angle = Math.random() * Math.PI * 2;
        speed = (60 + Math.random() * 140) * s;
        life = 0.7 + Math.random() * 0.8;
        size = (2 + Math.random() * 3) * s;
        particles.push({
          x: cx, y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          gravity: 45 * s,
          life: life,
          maxLife: life,
          color: colors.burst[Math.floor(Math.random() * colors.burst.length)],
          size: size,
          flicker: false
        });
      }
      // Inner bright core for lead
      if (role === "lead") {
        for (i = 0; i < 8 && particles.length < MAX_PARTICLES; i++) {
          angle = Math.random() * Math.PI * 2;
          speed = (20 + Math.random() * 40) * s;
          particles.push({
            x: cx, y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            gravity: 30 * s,
            life: 0.5 + Math.random() * 0.4,
            maxLife: 0.9,
            color: "#ffffff",
            size: (3 + Math.random() * 2) * s,
            flicker: false
          });
        }
      }
    }

    // Spawn embers that drift down
    var emberCount = 6 + Math.floor(vol * 10);
    for (i = 0; i < emberCount && embers.length < MAX_EMBERS; i++) {
      angle = Math.random() * Math.PI * 2;
      speed = (10 + Math.random() * 30) * s;
      embers.push({
        x: cx + (Math.random() - 0.5) * 20 * s,
        y: cy + (Math.random() - 0.5) * 20 * s,
        vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 10 * s,
        vy: Math.sin(angle) * speed,
        gravity: 25 * s,
        wind: (Math.random() - 0.5) * 15 * s,
        life: 1.5 + Math.random() * 1.5,
        color: colors.outer,
        size: (1 + Math.random() * 1.5) * s
      });
    }
  }

  // Easing: slow start, accelerate into burst
  function easeInQuad(t) { return t * t; }

  function drawSkyline(ctx, glowAmount) {
    var skylineH = h * 0.15;
    var baseY = h - skylineH;

    // Glow behind skyline
    if (glowAmount > 0.01) {
      var glowGrad = ctx.createLinearGradient(0, baseY - skylineH * 0.5, 0, h);
      glowGrad.addColorStop(0, "rgba(255,180,80,0)");
      glowGrad.addColorStop(0.4, "rgba(255,140,50," + (glowAmount * 0.15) + ")");
      glowGrad.addColorStop(1, "rgba(255,100,30," + (glowAmount * 0.08) + ")");
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, baseY - skylineH * 0.5, w, h - baseY + skylineH * 0.5);
    }

    // Buildings
    var buildingFill = "#060610";
    var edgeColor = "rgba(100,120,180,0.12)";
    ctx.fillStyle = buildingFill;
    for (var i = 0; i < buildings.length; i++) {
      var b = buildings[i];
      var bx = b.x;
      var by = h - b.h;
      ctx.fillRect(bx, by, b.w, b.h);

      // Subtle edge highlights
      ctx.fillStyle = edgeColor;
      ctx.fillRect(bx, by, 1, b.h);
      ctx.fillRect(bx + b.w - 1, by, 1, b.h);
      ctx.fillRect(bx, by, b.w, 1);
      ctx.fillStyle = buildingFill;

      // Antenna
      if (b.antenna > 0) {
        ctx.fillRect(bx + b.w * 0.45, by - b.antenna, b.w * 0.1, b.antenna);
        // Antenna light
        ctx.fillStyle = "rgba(255,50,50,0.8)";
        ctx.beginPath();
        ctx.arc(bx + b.w * 0.5, by - b.antenna, 2 * sc(), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = buildingFill;
      }

      // Windows
      srand(b.windowSeed);
      var winW = Math.min(6, b.w / (b.windowCols * 2.5));
      var winH = Math.min(5, b.h / (b.windowRows * 2.5));
      var padX = (b.w - b.windowCols * winW * 2) / 2 + winW * 0.5;
      var padY = 8;
      for (var r = 0; r < b.windowRows; r++) {
        for (var c = 0; c < b.windowCols; c++) {
          if (rand() > 0.4) {
            var brightness = 0.15 + rand() * 0.3;
            var warm = rand() > 0.3;
            ctx.fillStyle = warm
              ? "rgba(255,220,130," + brightness + ")"
              : "rgba(180,210,255," + brightness + ")";
            ctx.fillRect(
              bx + padX + c * winW * 2,
              by + padY + r * winH * 2.5,
              winW, winH
            );
          }
        }
      }
      ctx.fillStyle = buildingFill;
    }

    // Ground line
    ctx.fillStyle = "#030308";
    ctx.fillRect(0, h - 4, w, 4);
  }

  function drawStars(ctx, elapsed) {
    var s = sc();
    for (var i = 0; i < stars.length; i++) {
      var st = stars[i];
      var twinkle = 0.5 + 0.5 * Math.sin(elapsed * st.twinkleSpeed + st.twinkleOffset);
      var alpha = st.brightness * twinkle * 0.6;
      if (alpha < 0.05) continue;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(st.x * w, st.y * h, st.size * s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawShellTrail(ctx, shell, s) {
    var trail = shell.trail;
    if (trail.length < 2) return;
    var colors = shell.colors;
    for (var i = 1; i < trail.length; i++) {
      var alpha = (i / trail.length) * 0.7;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = colors.trail;
      ctx.beginPath();
      ctx.arc(trail[i].x, trail[i].y, (1.5 + (i / trail.length) * 1.5) * s, 0, Math.PI * 2);
      ctx.fill();

      // Sparks along trail
      if (i % 3 === 0) {
        ctx.globalAlpha = alpha * 0.5;
        ctx.fillStyle = colors.core;
        var sx = trail[i].x + (Math.random() - 0.5) * 6 * s;
        var sy = trail[i].y + (Math.random() - 0.5) * 6 * s;
        ctx.beginPath();
        ctx.arc(sx, sy, 0.8 * s, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  return {
    name: "Boom Boom Skyline",

    init: function (ctx, width, height, a) {
      w = width;
      h = height;
      analysis = a;
      shells = [];
      particles = [];
      embers = [];
      lastTimelineIndex = -1;
      skylineGlow = 0;

      secondsPerRow = 0;
      if (a && a.secondsPerRow) {
        secondsPerRow = a.secondsPerRow;
      }

      generateStars();
      generateBuildings();
    },

    resize: function (width, height) {
      w = width;
      h = height;
      generateBuildings();
    },

    render: function (fd) {
      var ctx = fd.ctx;
      w = fd.width;
      h = fd.height;
      var dt = fd.dt || 1 / 60;
      var elapsed = fd.cursor ? fd.cursor.elapsed : 0;
      var s = sc();
      var i, p;

      // Sky gradient
      var skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, "#05071a");
      skyGrad.addColorStop(0.5, "#0a1028");
      skyGrad.addColorStop(0.85, "#111535");
      skyGrad.addColorStop(1, "#0c1025");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Stars
      drawStars(ctx, elapsed);

      // --- Look-ahead shell spawning ---
      if (fd.cursor && analysis && analysis.timeline && secondsPerRow > 0) {
        var currentRow = fd.cursor.timelineIndex;

        // Only check on new rows to avoid duplicate spawns
        if (currentRow !== lastTimelineIndex) {
          var futureRow = currentRow + LAUNCH_AHEAD;
          if (futureRow < analysis.timeline.length) {
            var futureData = analysis.timeline[futureRow];
            if (futureData) {
              var numCh = analysis.numChannels || 4;
              for (i = 0; i < numCh; i++) {
                if (futureData[i] && futureData[i].vol > 0) {
                  var note = futureData[i];
                  // Normalize pitch
                  var normalized = 0.5;
                  if (analysis.pitchRange && analysis.pitchRange.span > 0) {
                    normalized = (note.midi - analysis.pitchRange.min) / analysis.pitchRange.span;
                  }
                  note = {
                    midi: note.midi,
                    vol: note.vol,
                    instrument: note.instrument,
                    wave: note.wave,
                    normalized: normalized
                  };
                  var travelTime = LAUNCH_AHEAD * secondsPerRow;
                  spawnShell(i, note, travelTime);
                }
              }
            }
          }
          lastTimelineIndex = currentRow;
        }

        // Beat-synced skyline glow
        var beat = fd.cursor.beat;
        if (fd.cursor.fractionalRow % (analysis.rpb || 4) < 0.5) {
          skylineGlow = Math.max(skylineGlow, 0.6);
        }
      }

      skylineGlow *= Math.pow(0.05, dt);

      // --- Update and burst shells ---
      for (i = shells.length - 1; i >= 0; i--) {
        var shell = shells[i];
        shell.elapsed += dt;
        var progress = Math.min(shell.elapsed / shell.travelTime, 1);
        var eased = easeInQuad(progress);

        shell.x = shell.startX + (shell.targetX - shell.startX) * eased;
        shell.y = shell.startY + (shell.targetY - shell.startY) * eased;

        // Trail points
        shell.trail.push({ x: shell.x, y: shell.y });
        if (shell.trail.length > 20) shell.trail.shift();

        if (progress >= 1 && !shell.burst) {
          shell.burst = true;
          burstShell(shell);
          skylineGlow = Math.max(skylineGlow, 0.8);
          shells.splice(i, 1);
          continue;
        }

        // Remove stale shells that haven't burst (safety)
        if (shell.elapsed > shell.travelTime + 1) {
          shells.splice(i, 1);
        }
      }

      // --- Update particles ---
      for (i = particles.length - 1; i >= 0; i--) {
        p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += p.gravity * dt;
        p.vx *= 0.99;
        p.life -= dt;

        if (p.life <= 0) {
          particles.splice(i, 1);
        }
      }

      // --- Update embers ---
      for (i = embers.length - 1; i >= 0; i--) {
        var e = embers[i];
        e.x += (e.vx + e.wind) * dt;
        e.y += e.vy * dt;
        e.vy += e.gravity * dt;
        e.vx *= 0.98;
        e.life -= dt;

        if (e.life <= 0) {
          embers.splice(i, 1);
        }
      }

      // --- Draw burst glow (behind skyline) ---
      for (i = 0; i < particles.length; i++) {
        p = particles[i];
        var lifeRat = p.life / p.maxLife;
        if (lifeRat > 0.7) {
          var glowR = p.size * 15;
          var glowAlpha = (lifeRat - 0.7) * 0.12;
          ctx.globalAlpha = glowAlpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      // --- Draw skyline ---
      drawSkyline(ctx, skylineGlow);

      // --- Draw shell trails and heads ---
      for (i = 0; i < shells.length; i++) {
        var sh = shells[i];
        drawShellTrail(ctx, sh, s);

        // Shell head (bright dot)
        var headSize = (2.5 + sh.note.vol * 2) * s;
        ctx.fillStyle = sh.colors.core;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(sh.x, sh.y, headSize, 0, Math.PI * 2);
        ctx.fill();

        // Head glow
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(sh.x, sh.y, headSize * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // --- Draw particles ---
      for (i = 0; i < particles.length; i++) {
        p = particles[i];
        var lifeRatio = p.life / p.maxLife;
        var alpha = lifeRatio;

        // Flicker for percussion
        if (p.flicker) {
          alpha *= (Math.random() > 0.3) ? 1 : 0.2;
        }

        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * Math.max(lifeRatio, 0.3), 0, Math.PI * 2);
        ctx.fill();

        // Bright core in early life
        if (lifeRatio > 0.5) {
          ctx.globalAlpha = alpha * 0.6;
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      // --- Draw embers ---
      for (i = 0; i < embers.length; i++) {
        var em = embers[i];
        ctx.globalAlpha = Math.min(em.life * 0.5, 0.6);
        ctx.fillStyle = em.color;
        ctx.beginPath();
        ctx.arc(em.x, em.y, em.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // --- Launch point indicators (subtle) ---
      if (fd.cursor && analysis) {
        var numCh = analysis.numChannels || 4;
        ctx.globalAlpha = 0.25;
        for (i = 0; i < numCh; i++) {
          var lx = launchX(i, numCh);
          var ly = launchY();
          var colors = getRoleColors(i);
          ctx.fillStyle = colors.outer;
          ctx.beginPath();
          ctx.arc(lx, ly, 3 * s, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    },

    destroy: function () {
      shells = [];
      particles = [];
      embers = [];
      stars = [];
      buildings = [];
      analysis = null;
      lastTimelineIndex = -1;
      skylineGlow = 0;
    }
  };
})();
