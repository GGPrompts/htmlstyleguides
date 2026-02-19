/**
 * Crystalline Kaleidoscope Renderer
 * A mirrored crystal mandala driven by channel roles and song energy.
 * - Lead: high-frequency prism streaks
 * - Harmony: blooming facet petals
 * - Bass: core pulse + geometric rings
 * - Percussion: crack bursts and glint shards
 */
window.Renderers["crystalline-kaleidoscope"] = (function () {
  "use strict";

  var w = 0;
  var h = 0;
  var analysis = null;

  var t = 0;
  var lastRow = -1;
  var beatFlash = 0;
  var energySmooth = 0;
  var corePulse = 0;
  var bloomPulse = 0;
  var rotations = [0, 0, 0, 0];
  var noteHeat = [0, 0, 0, 0];

  var roleMap = { lead: 0, harmony: 1, bass: 2, percussion: 3 };
  var roleByChannel = ["lead", "harmony", "bass", "percussion"];
  var styleByChannel = [];

  var glints = [];
  var burstRings = [];
  var MAX_GLINTS = 320;
  var MAX_RINGS = 36;

  var ROLE_STYLES = {
    lead: { main: "#6ff7ff", soft: "rgba(111,247,255,", edge: "#e6fcff" },
    harmony: { main: "#c18cff", soft: "rgba(193,140,255,", edge: "#f0e1ff" },
    bass: { main: "#5b8cff", soft: "rgba(91,140,255,", edge: "#d7e5ff" },
    percussion: { main: "#8dffd8", soft: "rgba(141,255,216,", edge: "#e9fff7" }
  };
  var FALLBACK_STYLES = [
    ROLE_STYLES.lead,
    ROLE_STYLES.harmony,
    ROLE_STYLES.bass,
    ROLE_STYLES.percussion
  ];
  var DEFAULT_ROLES = ["lead", "harmony", "bass", "percussion"];

  function clamp(v, lo, hi) {
    if (v < lo) return lo;
    if (v > hi) return hi;
    return v;
  }

  function cappedPush(arr, obj, maxLen) {
    if (arr.length >= maxLen) arr.shift();
    arr.push(obj);
  }

  function rebuildRoleMap() {
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
      roleByChannel[i] = DEFAULT_ROLES[i];
      styleByChannel[i] = FALLBACK_STYLES[i];
    }

    if (analysis && analysis.channelRoles) {
      for (i = 0; i < numCh; i++) {
        role = analysis.channelRoles[i] && analysis.channelRoles[i].role;
        if (ROLE_STYLES[role]) {
          roleByChannel[i] = role;
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

  function styleOf(ch) {
    return styleByChannel[ch] || FALLBACK_STYLES[ch % 4];
  }

  function spawnGlints(ch, note, amount) {
    var style = styleOf(ch);
    var i;
    var vol = note && note.vol ? note.vol : 0.4;
    var norm = note && typeof note.normalized === "number" ? note.normalized : 0.5;
    var count = amount || (4 + ((vol * 10) | 0));

    for (i = 0; i < count; i++) {
      cappedPush(glints, {
        a: Math.random() * Math.PI * 2,
        r: 8 + Math.random() * (Math.min(w, h) * 0.05 + norm * Math.min(w, h) * 0.14),
        vr: 35 + Math.random() * 180 + vol * 170,
        va: (Math.random() - 0.5) * 4.5,
        tw: Math.random() * Math.PI * 2,
        life: 0,
        maxLife: 0.45 + Math.random() * 0.95,
        size: 1 + Math.random() * (1.8 + vol * 2.8),
        color: style.main
      }, MAX_GLINTS);
    }
  }

  function spawnBurstRing(ch, strength) {
    var style = styleOf(ch);
    cappedPush(burstRings, {
      r: 12,
      speed: 70 + strength * 260,
      life: 0,
      maxLife: 0.5 + strength * 0.85,
      line: 1.2 + strength * 4.0,
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
      spawnGlints(roleMap.lead, lead, (5 + ((lead.vol || 0.4) * 9)) | 0);
    }

    if (harmony) {
      bloomPulse = Math.max(bloomPulse, 0.35 + (harmony.vol || 0.35) * 0.9);
      if ((beat % 2) === 0) {
        spawnBurstRing(roleMap.harmony, 0.25 + (harmony.vol || 0.4) * 0.5);
      }
    }

    if (bass) {
      corePulse = Math.max(corePulse, 0.45 + (bass.vol || 0.3) * 1.0);
      spawnBurstRing(roleMap.bass, 0.4 + (bass.vol || 0.3) * 0.8);
    }

    if (perc) {
      beatFlash = Math.max(beatFlash, 0.5 + (perc.vol || 0.4) * 0.7);
      spawnGlints(roleMap.percussion, perc, (10 + ((perc.vol || 0.4) * 14)) | 0);
      spawnBurstRing(roleMap.percussion, 0.55 + (perc.vol || 0.4) * 0.9);
    }

    if (fd.cursor && (fd.cursor.beat % 4 === 0) && energy > 0.62) {
      spawnBurstRing(roleMap.lead, energy * 0.9);
    }
  }

  function drawBackground(ctx, energy) {
    var g = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.72);
    g.addColorStop(0, "#0f1024");
    g.addColorStop(0.55, "#090b1a");
    g.addColorStop(1, "#03040c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    if (energy > 0.03) {
      var haze = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, Math.min(w, h) * 0.6);
      haze.addColorStop(0, "rgba(130,165,255," + (0.05 + energy * 0.1) + ")");
      haze.addColorStop(1, "rgba(130,165,255,0)");
      ctx.fillStyle = haze;
      ctx.fillRect(0, 0, w, h);
    }
  }

  function drawShardLayer(ctx, opts) {
    var cx = w * 0.5;
    var cy = h * 0.5;
    var segments = opts.segments;
    var step = (Math.PI * 2) / segments;
    var i;
    var baseA;
    var heat = opts.heat;
    var energy = opts.energy;
    var beat = opts.beat;
    var r0 = opts.inner;
    var r1 = opts.outer;
    var bend = opts.bend;
    var freq = opts.freq;
    var spin = opts.spin;
    var edgeAlpha;
    var fillAlpha;
    var k;
    var m;
    var a0;
    var a1;
    var am;
    var pulse;
    var p0x;
    var p0y;
    var p1x;
    var p1y;
    var p2x;
    var p2y;
    var p3x;
    var p3y;

    rotations[opts.ch] += spin * (opts.dt || (1 / 60));
    baseA = rotations[opts.ch];

    fillAlpha = clamp(0.06 + energy * 0.12 + heat * 0.26 + beat * 0.2, 0, 0.55);
    edgeAlpha = clamp(0.18 + energy * 0.14 + heat * 0.4 + beat * 0.15, 0, 0.9);

    for (i = 0; i < segments; i++) {
      m = (i % 2 === 0) ? 1 : -1;
      k = i / segments;
      pulse = Math.sin(t * freq + k * Math.PI * 2 + heat * 1.5) * 0.5 + 0.5;
      a0 = baseA + i * step;
      a1 = a0 + step;
      am = a0 + step * (0.5 + m * (bend + pulse * 0.06));

      p0x = cx + Math.cos(a0) * (r0 + pulse * 8);
      p0y = cy + Math.sin(a0) * (r0 + pulse * 8);
      p1x = cx + Math.cos(a1) * (r0 + pulse * 8);
      p1y = cy + Math.sin(a1) * (r0 + pulse * 8);
      p2x = cx + Math.cos(am + m * 0.08) * (r1 + pulse * (24 + energy * 35));
      p2y = cy + Math.sin(am + m * 0.08) * (r1 + pulse * (24 + energy * 35));
      p3x = cx + Math.cos(am - m * 0.05) * (r1 * (0.82 + pulse * 0.2));
      p3y = cy + Math.sin(am - m * 0.05) * (r1 * (0.82 + pulse * 0.2));

      ctx.beginPath();
      ctx.moveTo(p0x, p0y);
      ctx.lineTo(p2x, p2y);
      ctx.lineTo(p1x, p1y);
      ctx.lineTo(p3x, p3y);
      ctx.closePath();

      ctx.fillStyle = opts.style.soft + fillAlpha + ")";
      ctx.fill();
      ctx.strokeStyle = opts.style.soft + edgeAlpha + ")";
      ctx.lineWidth = 1 + heat * 2.5 + energy * 1.2;
      ctx.stroke();
    }
  }

  function drawCore(ctx, energy, bassHeat, beatFrac) {
    var cx = w * 0.5;
    var cy = h * 0.5;
    var r = Math.min(w, h) * (0.072 + bassHeat * 0.03 + corePulse * 0.05);
    var glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * (3.2 + energy * 1.2));
    var bassStyle = styleOf(roleMap.bass);
    var pulse = (1 - beatFrac);

    glow.addColorStop(0, bassStyle.soft + (0.34 + energy * 0.32) + ")");
    glow.addColorStop(1, bassStyle.soft + "0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = bassStyle.soft + (0.2 + bassHeat * 0.4) + ")";
    ctx.fill();
    ctx.strokeStyle = bassStyle.edge;
    ctx.lineWidth = 1.2 + bassHeat * 2.4;
    ctx.stroke();

    if (pulse > 0.86) {
      ctx.beginPath();
      ctx.arc(cx, cy, r + (1 - pulse) * 110, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255," + ((pulse - 0.86) * 1.2) + ")";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  function drawBurstRings(ctx, dt) {
    var i;
    var r;
    var life;
    var alpha;
    var cx = w * 0.5;
    var cy = h * 0.5;

    for (i = burstRings.length - 1; i >= 0; i--) {
      r = burstRings[i];
      r.life += dt;
      if (r.life >= r.maxLife) {
        burstRings.splice(i, 1);
        continue;
      }
      r.r += r.speed * dt;
      life = r.life / r.maxLife;
      alpha = (1 - life) * (0.3 + energySmooth * 0.5 + beatFlash * 0.4);

      ctx.beginPath();
      ctx.arc(cx, cy, r.r, 0, Math.PI * 2);
      ctx.strokeStyle = r.glow + clamp(alpha, 0, 0.8) + ")";
      ctx.lineWidth = r.line * (1 - life * 0.65);
      ctx.stroke();
    }
  }

  function updateAndDrawGlints(ctx, dt) {
    var i;
    var g;
    var lifeFrac;
    var alpha;
    var cx = w * 0.5;
    var cy = h * 0.5;
    var x;
    var y;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    for (i = glints.length - 1; i >= 0; i--) {
      g = glints[i];
      g.life += dt;
      if (g.life >= g.maxLife) {
        glints.splice(i, 1);
        continue;
      }

      g.r += g.vr * dt;
      g.a += g.va * dt;
      g.tw += dt * 8;
      lifeFrac = g.life / g.maxLife;
      alpha = (1 - lifeFrac) * (0.3 + energySmooth * 0.45 + beatFlash * 0.35);

      x = cx + Math.cos(g.a) * g.r;
      y = cy + Math.sin(g.a) * g.r;

      ctx.strokeStyle = "rgba(255,255,255," + clamp(alpha * 0.7, 0, 0.8) + ")";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - g.size * 2.4, y);
      ctx.lineTo(x + g.size * 2.4, y);
      ctx.moveTo(x, y - g.size * 2.4);
      ctx.lineTo(x, y + g.size * 2.4);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x, y, g.size * (1 - lifeFrac * 0.5), 0, Math.PI * 2);
      ctx.fillStyle = g.color;
      ctx.globalAlpha = clamp(alpha, 0, 0.9);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  return {
    name: "Crystalline Kaleidoscope",

    init: function (ctx, width, height, a) {
      w = width;
      h = height;
      analysis = a;
      rebuildRoleMap();

      t = 0;
      lastRow = -1;
      beatFlash = 0;
      energySmooth = 0;
      corePulse = 0;
      bloomPulse = 0;
      rotations = [0, 0, 0, 0];
      noteHeat = [0, 0, 0, 0];
      glints = [];
      burstRings = [];
    },

    resize: function (width, height) {
      w = width;
      h = height;
    },

    render: function (fd) {
      var ctx = fd.ctx;
      var dt = fd.dt || (1 / 60);
      var cursor = fd.cursor;
      var notes = fd.currentNotes || [];
      var i;
      var energy = 0;
      var beatFrac = 0.5;
      var leadCh;
      var harmonyCh;
      var bassCh;
      var percCh;
      var radialMax;

      w = fd.width;
      h = fd.height;

      if (!analysis && fd.analysis) {
        analysis = fd.analysis;
        rebuildRoleMap();
      }

      t += dt;

      for (i = 0; i < 4; i++) {
        noteHeat[i] = Math.max(0, noteHeat[i] - dt * 1.75);
        if (notes[i]) {
          noteHeat[i] = Math.max(noteHeat[i], 0.16 + (notes[i].vol || 0) * 0.95);
        }
      }

      if (analysis && cursor && analysis.energy) {
        energy = analysis.energy[cursor.timelineIndex] || 0;
      }
      energySmooth += (energy - energySmooth) * Math.min(1, dt * 5.5);

      corePulse = Math.max(0, corePulse - dt * 1.7);
      bloomPulse = Math.max(0, bloomPulse - dt * 1.2);
      beatFlash = Math.max(0, beatFlash - dt * 2.6);

      if (analysis && cursor && analysis.rpb) {
        beatFrac = (cursor.totalFracRow % analysis.rpb) / analysis.rpb;
        if (beatFrac < 0.1) {
          beatFlash = Math.max(beatFlash, 1 - beatFrac / 0.1);
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

      leadCh = roleMap.lead;
      harmonyCh = roleMap.harmony;
      bassCh = roleMap.bass;
      percCh = roleMap.percussion;
      radialMax = Math.min(w, h) * 0.48;

      drawBackground(ctx, energySmooth);

      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      drawShardLayer(ctx, {
        ch: harmonyCh,
        style: styleOf(harmonyCh),
        inner: radialMax * (0.14 + noteHeat[harmonyCh] * 0.04),
        outer: radialMax * (0.54 + bloomPulse * 0.12),
        segments: 14,
        bend: 0.08,
        freq: 1.6,
        spin: 0.24,
        heat: noteHeat[harmonyCh] + bloomPulse * 0.6,
        energy: energySmooth,
        beat: beatFlash * 0.4,
        dt: dt
      });

      drawShardLayer(ctx, {
        ch: leadCh,
        style: styleOf(leadCh),
        inner: radialMax * (0.2 + noteHeat[leadCh] * 0.05),
        outer: radialMax * (0.78 + noteHeat[leadCh] * 0.14),
        segments: 20,
        bend: 0.12,
        freq: 2.8,
        spin: -0.55,
        heat: noteHeat[leadCh],
        energy: energySmooth,
        beat: beatFlash * 0.55,
        dt: dt
      });

      drawShardLayer(ctx, {
        ch: percCh,
        style: styleOf(percCh),
        inner: radialMax * (0.3 + noteHeat[percCh] * 0.05),
        outer: radialMax * (0.9 + noteHeat[percCh] * 0.08),
        segments: 24,
        bend: 0.16,
        freq: 4.1,
        spin: 0.9,
        heat: noteHeat[percCh] * 0.8 + beatFlash * 0.6,
        energy: energySmooth,
        beat: beatFlash,
        dt: dt
      });

      ctx.restore();

      drawCore(ctx, energySmooth, noteHeat[bassCh], beatFrac);
      drawBurstRings(ctx, dt);
      updateAndDrawGlints(ctx, dt);

      if (!cursor) {
        ctx.fillStyle = "rgba(255,255,255,0.25)";
        ctx.font = "12px monospace";
        ctx.textAlign = "center";
        ctx.fillText("Press play to refract", w * 0.5, h * 0.5 + radialMax * 0.75);
        ctx.textAlign = "start";
      }
    },

    destroy: function () {
      analysis = null;
      glints = [];
      burstRings = [];
      noteHeat = [0, 0, 0, 0];
      rotations = [0, 0, 0, 0];
      lastRow = -1;
    }
  };
})();
