/**
 * Stained Glass Shadows Renderer
 * Dark, subtle cathedral ambience with role-driven motion:
 * - bass: nave glow and low pulse rings
 * - harmony: drifting stained-glass caustics
 * - lead: thin upward light rays
 * - percussion: sparse dust bursts near window edges
 */
window.Renderers["stained-glass-shadows"] = (function () {
  "use strict";

  var w = 0;
  var h = 0;
  var analysis = null;

  var t = 0;
  var lastRow = -1;
  var energySmooth = 0;
  var beatFlash = 0;
  var bassGlow = 0;
  var harmonyFlow = 0;
  var leadLift = 0;
  var rayPhase = 0;

  var roleMap = { lead: 0, harmony: 1, bass: 2, percussion: 3 };
  var styleByChannel = [];
  var windows = [];

  var rays = [];
  var motes = [];
  var pulseRings = [];
  var MAX_RAYS = 80;
  var MAX_MOTES = 260;
  var MAX_RINGS = 28;

  var ROLE_STYLES = {
    lead: { main: "#b8d9ff", soft: "rgba(184,217,255," },
    harmony: { main: "#8c6bb4", soft: "rgba(140,107,180," },
    bass: { main: "#8f425c", soft: "rgba(143,66,92," },
    percussion: { main: "#d7b474", soft: "rgba(215,180,116," }
  };
  var FALLBACK_STYLES = [
    ROLE_STYLES.lead,
    ROLE_STYLES.harmony,
    ROLE_STYLES.bass,
    ROLE_STYLES.percussion
  ];

  function clamp(v, lo, hi) {
    if (v < lo) return lo;
    if (v > hi) return hi;
    return v;
  }

  function cappedPush(arr, obj, maxLen) {
    if (arr.length >= maxLen) arr.shift();
    arr.push(obj);
  }

  function styleOf(ch) {
    return styleByChannel[ch] || FALLBACK_STYLES[ch % 4];
  }

  function rebuildRoles() {
    var numCh = 4;
    var i;
    var role;

    if (analysis && analysis.numChannels) {
      numCh = analysis.numChannels;
      if (numCh < 1) numCh = 1;
      if (numCh > 4) numCh = 4;
    }

    roleMap = { lead: 0, harmony: 1, bass: 2, percussion: 3 };

    for (i = 0; i < 4; i++) {
      styleByChannel[i] = FALLBACK_STYLES[i];
    }

    if (analysis && analysis.channelRoles) {
      for (i = 0; i < numCh; i++) {
        role = analysis.channelRoles[i] && analysis.channelRoles[i].role;
        if (ROLE_STYLES[role]) {
          styleByChannel[i] = ROLE_STYLES[role];
          roleMap[role] = i;
        }
      }
    }

    if (roleMap.lead >= numCh) roleMap.lead = 0;
    if (roleMap.harmony >= numCh) roleMap.harmony = numCh > 1 ? 1 : 0;
    if (roleMap.bass >= numCh) roleMap.bass = numCh > 2 ? 2 : 0;
    if (roleMap.percussion >= numCh) roleMap.percussion = numCh > 3 ? 3 : (numCh - 1);
  }

  function buildWindows() {
    var count = 5;
    var gap = w / (count + 1);
    var i;
    var cx;
    var ww = gap * 0.56;
    var wh = h * 0.34;
    var top = h * 0.13;

    windows = [];
    for (i = 0; i < count; i++) {
      cx = gap * (i + 1);
      windows.push({
        cx: cx,
        top: top,
        w: ww,
        h: wh
      });
    }
  }

  function spawnRay(note, beat, energy) {
    var vol = note && note.vol ? note.vol : 0.3;
    var n = note && typeof note.normalized === "number" ? note.normalized : 0.5;
    var phasePos = 0.5 + Math.sin(rayPhase) * (0.28 + energy * 0.12);
    var lanePos = 0.5;
    var lane;
    var mix;
    var xNorm;
    var x;
    var len = h * (0.15 + vol * 0.35);

    if (windows.length > 0) {
      lane = windows[((beat | 0) + ((rayPhase * 2.2) | 0)) % windows.length];
      lanePos = lane.cx / (w || 1);
    }

    mix = (Math.random() - 0.5) * (0.16 + energy * 0.08);
    xNorm = n * 0.22 + phasePos * 0.43 + lanePos * 0.35 + mix;
    xNorm = clamp(xNorm, 0.08, 0.92);
    x = w * xNorm;

    cappedPush(rays, {
      x: x,
      y: h * 0.06 + Math.random() * h * 0.14,
      len: len,
      w: 0.8 + vol * 2.2,
      drift: (Math.random() - 0.5) * (26 + energy * 20) + (lanePos - 0.5) * 14,
      life: 0,
      maxLife: 0.9 + Math.random() * 1.2
    }, MAX_RAYS);
  }

  function spawnMotes(ch, note, amount) {
    var style = styleOf(ch);
    var vol = note && note.vol ? note.vol : 0.35;
    var i;
    var j;
    var win;
    var burst = amount || (4 + ((vol * 8) | 0));

    for (i = 0; i < burst; i++) {
      if (windows.length === 0) break;
      j = (Math.random() * windows.length) | 0;
      win = windows[j];
      cappedPush(motes, {
        x: win.cx + (Math.random() - 0.5) * win.w,
        y: win.top + Math.random() * win.h * 0.9,
        vx: (Math.random() - 0.5) * 18,
        vy: -8 - Math.random() * 20,
        r: 0.7 + Math.random() * (1.2 + vol * 1.6),
        life: 0,
        maxLife: 0.7 + Math.random() * 1.1,
        color: style.soft
      }, MAX_MOTES);
    }
  }

  function spawnPulseRing(ch, strength) {
    var style = styleOf(ch);
    cappedPush(pulseRings, {
      r: Math.min(w, h) * 0.08,
      speed: 30 + strength * 120,
      life: 0,
      maxLife: 0.7 + strength * 1.0,
      line: 0.9 + strength * 2.5,
      glow: style.soft
    }, MAX_RINGS);
  }

  function onRow(fd, energy) {
    var notes = fd.currentNotes || [];
    var lead = notes[roleMap.lead];
    var harmony = notes[roleMap.harmony];
    var bass = notes[roleMap.bass];
    var perc = notes[roleMap.percussion];
    var beat = fd.cursor ? fd.cursor.beat : 0;

    if (lead) {
      leadLift = Math.max(leadLift, 0.25 + (lead.vol || 0.3) * 0.7);
      rayPhase += 0.45 + (lead.normalized || 0.5) * 0.35;
      spawnRay(lead, beat, energy);
    }

    if (harmony) {
      harmonyFlow = Math.max(harmonyFlow, 0.25 + (harmony.vol || 0.3) * 0.8);
      if (Math.random() < 0.45) spawnMotes(roleMap.harmony, harmony, (2 + ((harmony.vol || 0.3) * 5)) | 0);
    }

    if (bass) {
      bassGlow = Math.max(bassGlow, 0.35 + (bass.vol || 0.3) * 0.95);
      spawnPulseRing(roleMap.bass, 0.25 + (bass.vol || 0.3) * 0.55);
    }

    if (perc) {
      beatFlash = Math.max(beatFlash, 0.25 + (perc.vol || 0.3) * 0.45);
      spawnMotes(roleMap.percussion, perc, (5 + ((perc.vol || 0.3) * 10)) | 0);
    }

    if (fd.cursor && (fd.cursor.beat % 4 === 0) && energy > 0.55) {
      spawnPulseRing(roleMap.harmony, energy * 0.5);
    }
  }

  function drawBackdrop(ctx, energy) {
    var bg = ctx.createLinearGradient(0, 0, 0, h);
    var vig;
    bg.addColorStop(0, "#0d0a12");
    bg.addColorStop(0.65, "#120d16");
    bg.addColorStop(1, "#08070d");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    vig = ctx.createRadialGradient(w * 0.5, h * 0.56, 0, w * 0.5, h * 0.56, Math.max(w, h) * 0.66);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(0,0,0,0.52)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);

    if (energy > 0.04) {
      var haze = ctx.createRadialGradient(w * 0.5, h * 0.72, 0, w * 0.5, h * 0.72, Math.max(w, h) * 0.42);
      haze.addColorStop(0, "rgba(110,88,130," + (0.03 + energy * 0.06) + ")");
      haze.addColorStop(1, "rgba(110,88,130,0)");
      ctx.fillStyle = haze;
      ctx.fillRect(0, 0, w, h);
    }
  }

  function drawWindowFrame(ctx, win) {
    var left = win.cx - win.w * 0.5;
    var right = win.cx + win.w * 0.5;
    var top = win.top;
    var bottom = win.top + win.h;
    var archR = win.w * 0.5;

    ctx.beginPath();
    ctx.moveTo(left, bottom);
    ctx.lineTo(left, top + archR);
    ctx.arc(win.cx, top + archR, archR, Math.PI, 0);
    ctx.lineTo(right, bottom);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(win.cx, top + archR * 0.3);
    ctx.lineTo(win.cx, bottom);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(left + win.w * 0.2, top + archR);
    ctx.lineTo(right - win.w * 0.2, top + archR);
    ctx.stroke();
  }

  function drawArchitecture(ctx) {
    var i;
    var win;
    var style = "rgba(188,164,128,0.12)";
    var roseR = Math.min(w, h) * 0.06;

    ctx.strokeStyle = style;
    ctx.lineWidth = 1;
    for (i = 0; i < windows.length; i++) {
      win = windows[i];
      drawWindowFrame(ctx, win);
    }

    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.11, roseR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w * 0.5 - roseR, h * 0.11);
    ctx.lineTo(w * 0.5 + roseR, h * 0.11);
    ctx.moveTo(w * 0.5, h * 0.11 - roseR);
    ctx.lineTo(w * 0.5, h * 0.11 + roseR);
    ctx.stroke();
  }

  function drawHarmonyCaustics(ctx, energy, beat) {
    var harmonyStyle = styleOf(roleMap.harmony);
    var i;
    var win;
    var band;
    var y0;
    var sway;
    var alpha;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    for (i = 0; i < windows.length; i++) {
      win = windows[i];
      for (band = 0; band < 3; band++) {
        y0 = win.top + win.h * (0.18 + band * 0.22);
        sway = Math.sin(t * (0.28 + band * 0.12) + i * 0.9 + band * 1.7) * (8 + harmonyFlow * 20);
        alpha = 0.016 + energy * 0.03 + harmonyFlow * 0.045 + beat * 0.025;
        ctx.fillStyle = harmonyStyle.soft + clamp(alpha, 0, 0.16) + ")";
        ctx.fillRect(win.cx - win.w * 0.44 + sway, y0, win.w * 0.88, 3 + band * 1.2);
      }
    }

    ctx.restore();
  }

  function drawBassGlow(ctx, energy) {
    var bassStyle = styleOf(roleMap.bass);
    var g = ctx.createRadialGradient(w * 0.5, h * 0.9, 0, w * 0.5, h * 0.9, Math.max(w, h) * 0.52);
    var alpha = clamp(0.04 + bassGlow * 0.12 + energy * 0.05, 0, 0.24);
    g.addColorStop(0, bassStyle.soft + alpha + ")");
    g.addColorStop(1, bassStyle.soft + "0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function updateAndDrawRays(ctx, dt) {
    var i;
    var r;
    var life;
    var leadStyle = styleOf(roleMap.lead);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    for (i = rays.length - 1; i >= 0; i--) {
      r = rays[i];
      r.life += dt;
      if (r.life >= r.maxLife) {
        rays.splice(i, 1);
        continue;
      }
      life = 1 - (r.life / r.maxLife);
      r.x += r.drift * dt;

      ctx.strokeStyle = leadStyle.soft + clamp(life * (0.08 + leadLift * 0.12), 0, 0.2) + ")";
      ctx.lineWidth = r.w * (0.6 + life * 0.7);
      ctx.beginPath();
      ctx.moveTo(r.x, r.y);
      ctx.lineTo(r.x + r.drift * 0.15, r.y + r.len);
      ctx.stroke();
    }

    ctx.restore();
  }

  function updateAndDrawMotes(ctx, dt) {
    var i;
    var m;
    var life;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    for (i = motes.length - 1; i >= 0; i--) {
      m = motes[i];
      m.life += dt;
      if (m.life >= m.maxLife) {
        motes.splice(i, 1);
        continue;
      }
      m.vx *= 0.985;
      m.vy += 5 * dt;
      m.x += m.vx * dt;
      m.y += m.vy * dt;

      life = 1 - (m.life / m.maxLife);
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r * (0.7 + life * 0.6), 0, Math.PI * 2);
      ctx.fillStyle = m.color + clamp(life * (0.07 + energySmooth * 0.08 + beatFlash * 0.06), 0, 0.18) + ")";
      ctx.fill();
    }

    ctx.restore();
  }

  function updateAndDrawPulseRings(ctx, dt) {
    var i;
    var ring;
    var life;
    var cx = w * 0.5;
    var cy = h * 0.88;

    for (i = pulseRings.length - 1; i >= 0; i--) {
      ring = pulseRings[i];
      ring.life += dt;
      if (ring.life >= ring.maxLife) {
        pulseRings.splice(i, 1);
        continue;
      }
      ring.r += ring.speed * dt;
      life = 1 - (ring.life / ring.maxLife);

      ctx.beginPath();
      ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
      ctx.strokeStyle = ring.glow + clamp(life * (0.08 + bassGlow * 0.1 + beatFlash * 0.05), 0, 0.2) + ")";
      ctx.lineWidth = ring.line * (0.8 + life * 0.5);
      ctx.stroke();
    }
  }

  return {
    name: "Stained Glass Shadows",

    init: function (ctx, width, height, a) {
      w = width;
      h = height;
      analysis = a;
      rebuildRoles();
      buildWindows();

      t = 0;
      lastRow = -1;
      energySmooth = 0;
      beatFlash = 0;
      bassGlow = 0;
      harmonyFlow = 0;
      leadLift = 0;
      rayPhase = 0;
      rays = [];
      motes = [];
      pulseRings = [];
    },

    resize: function (width, height) {
      w = width;
      h = height;
      buildWindows();
    },

    render: function (fd) {
      var ctx = fd.ctx;
      var dt = fd.dt || (1 / 60);
      var cursor = fd.cursor;
      var energy = 0;
      var beatFrac = 0.5;

      w = fd.width;
      h = fd.height;

      if (!analysis && fd.analysis) {
        analysis = fd.analysis;
        rebuildRoles();
      }

      if (windows.length === 0) buildWindows();

      if (analysis && cursor && analysis.energy) {
        energy = analysis.energy[cursor.timelineIndex] || 0;
      }

      t += dt;
      energySmooth += (energy - energySmooth) * Math.min(1, dt * 5.5);
      beatFlash = Math.max(0, beatFlash - dt * 2.2);
      bassGlow = Math.max(0, bassGlow - dt * 0.8);
      harmonyFlow = Math.max(0, harmonyFlow - dt * 0.7);
      leadLift = Math.max(0, leadLift - dt * 1.2);

      if (analysis && cursor && analysis.rpb) {
        beatFrac = (cursor.totalFracRow % analysis.rpb) / analysis.rpb;
        if (beatFrac < 0.08) {
          beatFlash = Math.max(beatFlash, 1 - beatFrac / 0.08);
        }
      }

      if (cursor) {
        if (cursor.globalRow !== lastRow) {
          onRow(fd, energy);
          lastRow = cursor.globalRow;
        }
      } else {
        lastRow = -1;
      }

      drawBackdrop(ctx, energySmooth);
      drawArchitecture(ctx);
      drawHarmonyCaustics(ctx, energySmooth, beatFlash);
      drawBassGlow(ctx, energySmooth);
      updateAndDrawPulseRings(ctx, dt);
      updateAndDrawRays(ctx, dt);
      updateAndDrawMotes(ctx, dt);

      if (!cursor) {
        ctx.fillStyle = "rgba(214,198,170,0.22)";
        ctx.font = "12px serif";
        ctx.textAlign = "center";
        ctx.fillText("Silence in the nave", w * 0.5, h * 0.92);
        ctx.textAlign = "start";
      }
    },

    destroy: function () {
      analysis = null;
      windows = [];
      rays = [];
      motes = [];
      pulseRings = [];
      lastRow = -1;
    }
  };
})();
