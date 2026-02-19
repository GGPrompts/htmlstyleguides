/**
 * Neon Skyline Storm Renderer
 * A neon cityscape with aurora bands, comets from lead notes, percussion sparks
 * and ripples, bass-driven building pulses, and a perspective grid.
 *
 * Created by Codex.
 */
window.Renderers["neon-skyline-storm"] = (function () {
  "use strict";

  var w = 0;
  var h = 0;
  var analysis = null;

  var roleMap = { lead: 0, harmony: 1, bass: 2, percussion: 3 };
  var channelRoles = ["lead", "harmony", "bass", "percussion"];
  var channelStyles = [];

  var noteHeat = [0, 0, 0, 0];
  var stars = [];
  var buildings = [];
  var comets = [];
  var sparks = [];
  var ripples = [];

  var MAX_COMETS = 20;
  var MAX_SPARKS = 240;
  var MAX_RIPPLES = 40;

  var t = 0;
  var lastRow = -1;
  var beatFlash = 0;
  var energySmooth = 0;
  var skylinePulse = 0;
  var harmonyLift = 0;
  var leadSide = 0;
  var seed = 1;

  var ROLE_STYLES = {
    lead: { main: "#ff6f59", soft: "rgba(255,111,89," },
    harmony: { main: "#5ae6d8", soft: "rgba(90,230,216," },
    bass: { main: "#ffd166", soft: "rgba(255,209,102," },
    percussion: { main: "#8dff8a", soft: "rgba(141,255,138," }
  };
  var FALLBACK_STYLES = [
    ROLE_STYLES.lead,
    ROLE_STYLES.harmony,
    ROLE_STYLES.bass,
    ROLE_STYLES.percussion
  ];
  var INDEX_ROLES = ["lead", "harmony", "bass", "percussion"];

  function clamp(v, lo, hi) {
    if (v < lo) return lo;
    if (v > hi) return hi;
    return v;
  }

  function srand(s) {
    seed = (s >>> 0) || 1;
  }

  function rand() {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  }

  function cappedPush(arr, value, maxLen) {
    if (arr.length >= maxLen) arr.shift();
    arr.push(value);
  }

  function rebuildRoleData() {
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
      channelRoles[i] = INDEX_ROLES[i];
      channelStyles[i] = FALLBACK_STYLES[i];
    }

    if (analysis && analysis.channelRoles) {
      for (i = 0; i < numCh; i++) {
        role = analysis.channelRoles[i] && analysis.channelRoles[i].role;
        if (ROLE_STYLES[role]) {
          channelRoles[i] = role;
          channelStyles[i] = ROLE_STYLES[role];
          roleMap[role] = i;
        }
      }
    }

    if (roleMap.lead >= numCh) roleMap.lead = 0;
    if (roleMap.harmony >= numCh) roleMap.harmony = numCh > 1 ? 1 : 0;
    if (roleMap.bass >= numCh) roleMap.bass = numCh > 2 ? 2 : 0;
    if (roleMap.percussion >= numCh) roleMap.percussion = numCh > 3 ? 3 : (numCh - 1);
  }

  function getStyle(ch) {
    return channelStyles[ch] || FALLBACK_STYLES[ch % 4];
  }

  function buildStars() {
    var count;
    var i;

    stars = [];
    count = ((w * h) / 11000) | 0;
    count = clamp(count, 60, 220);

    for (i = 0; i < count; i++) {
      stars.push({
        x: rand() * w,
        y: rand() * h * 0.68,
        r: 0.5 + rand() * 1.7,
        p: rand() * Math.PI * 2,
        s: 0.4 + rand() * 1.6
      });
    }
  }

  function buildBuildings() {
    var x;
    var bw;
    var gap;
    var baseH;
    var guard;

    buildings = [];
    x = 0;
    guard = 0;

    while (x < w + 80) {
      bw = 22 + rand() * 62;
      gap = 2 + rand() * 4;
      baseH = h * (0.09 + rand() * 0.26);

      buildings.push({
        x: x,
        bw: bw,
        baseH: baseH,
        seed: (rand() * 10000) | 0,
        density: 3 + ((rand() * 6) | 0),
        phase: rand() * Math.PI * 2
      });

      x += bw + gap;
      guard++;
      if (guard > 260) break;
    }
  }

  function spawnComet(note, ch) {
    var style = getStyle(ch);
    var vol = note && note.vol ? note.vol : 0.5;
    var n = note && typeof note.normalized === "number" ? note.normalized : 0.5;
    var startX;
    var startY;
    var targetX;
    var targetY;
    var travel;

    leadSide = 1 - leadSide;
    startX = leadSide ? -30 : (w + 30);
    startY = h * (0.68 - n * 0.35);

    targetX = w * 0.5 + (n - 0.5) * w * 0.45;
    targetY = h * (0.12 + (1 - n) * 0.12);
    travel = 0.9 + (1 - vol) * 0.5;

    cappedPush(comets, {
      x: startX,
      y: startY,
      vx: (targetX - startX) / travel,
      vy: (targetY - startY) / travel,
      life: 0,
      maxLife: 1.2 + vol * 1.1,
      size: 2 + vol * 2.8,
      color: style.main,
      glow: style.soft,
      trail: []
    }, MAX_COMETS);
  }

  function spawnRipple(note, ch, beat) {
    var style = getStyle(ch);
    var vol = note && note.vol ? note.vol : 0.5;
    var lane = (beat % 8) / 7;
    var x;

    if (!isFinite(lane)) lane = rand();

    x = w * (0.1 + lane * 0.8) + (rand() - 0.5) * 40;

    cappedPush(ripples, {
      x: x,
      y: h * 0.72 + 8 + rand() * 24,
      r: 4 + vol * 6,
      life: 0,
      maxLife: 0.8 + vol * 0.9,
      speed: 70 + vol * 140,
      line: 1.2 + vol * 2.4,
      glow: style.soft
    }, MAX_RIPPLES);
  }

  function spawnSparks(note, ch) {
    var style = getStyle(ch);
    var vol = note && note.vol ? note.vol : 0.5;
    var count = 6 + ((vol * 14) | 0);
    var ox = w * (0.15 + rand() * 0.7);
    var oy = h * 0.7 - rand() * 24;
    var i;
    var ang;
    var speed;

    for (i = 0; i < count; i++) {
      ang = rand() * Math.PI * 2;
      speed = 30 + rand() * (160 + vol * 220);
      cappedPush(sparks, {
        x: ox,
        y: oy,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed - 30,
        life: 0,
        maxLife: 0.45 + rand() * 0.65,
        size: 1 + rand() * 2.2,
        color: style.main
      }, MAX_SPARKS);
    }
  }

  function onRow(fd, energy) {
    var notes = fd.currentNotes || [];
    var leadNote = notes[roleMap.lead];
    var harmonyNote = notes[roleMap.harmony];
    var bassNote = notes[roleMap.bass];
    var percNote = notes[roleMap.percussion];
    var beat = fd.cursor ? fd.cursor.beat : 0;

    if (bassNote) skylinePulse = Math.max(skylinePulse, 0.45 + (bassNote.vol || 0.3) * 1.0);
    if (harmonyNote) harmonyLift = Math.max(harmonyLift, 0.35 + (harmonyNote.vol || 0.3) * 0.95);
    if (leadNote) spawnComet(leadNote, roleMap.lead);

    if (percNote) {
      spawnRipple(percNote, roleMap.percussion, beat);
      spawnSparks(percNote, roleMap.percussion);
    }

    if (fd.cursor && (fd.cursor.beat % 4 === 0) && energy > 0.65) {
      spawnRipple({ vol: energy }, roleMap.bass, beat + 2);
    }
  }

  function drawBackground(ctx, energy, cursorBeat) {
    var bg = ctx.createLinearGradient(0, 0, 0, h);
    var i;
    var s;
    var twinkle;
    var alpha;
    var haze;
    var flash;
    var col;

    bg.addColorStop(0, "#02060e");
    bg.addColorStop(0.52, "#07212c");
    bg.addColorStop(1, "#010304");

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    for (i = 0; i < stars.length; i++) {
      s = stars[i];
      twinkle = 0.35 + 0.65 * Math.sin(t * s.s + s.p);
      alpha = (0.06 + twinkle * 0.22) * (0.7 + energy * 1.1);
      alpha = clamp(alpha, 0, 0.55);
      ctx.fillStyle = "rgba(196,229,255," + alpha + ")";
      ctx.fillRect(s.x, s.y, s.r, s.r);
    }

    haze = ctx.createRadialGradient(w * 0.5, h * 0.72, 0, w * 0.5, h * 0.72, Math.max(w, h) * 0.6);
    haze.addColorStop(0, "rgba(31,171,196," + (0.05 + energy * 0.12) + ")");
    haze.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, w, h);

    if (beatFlash > 0.001) {
      col = (cursorBeat % 2 === 0) ? "255,190,102" : "84,224,255";
      flash = ctx.createRadialGradient(w * 0.5, h * 0.72, 0, w * 0.5, h * 0.72, h * 0.55);
      flash.addColorStop(0, "rgba(" + col + "," + (0.14 * beatFlash) + ")");
      flash.addColorStop(1, "rgba(" + col + ",0)");
      ctx.fillStyle = flash;
      ctx.fillRect(0, 0, w, h);
    }
  }

  function drawAurora(ctx, fd, energy) {
    var ch = roleMap.harmony;
    var style = getStyle(ch);
    var heat = noteHeat[ch] + harmonyLift;
    var b;
    var x;
    var nx;
    var y;
    var amp;
    var baseY;
    var phase;
    var wave;
    var alpha;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    for (b = 0; b < 3; b++) {
      amp = h * (0.02 + b * 0.028 + energy * 0.03 + heat * 0.05);
      baseY = h * (0.13 + b * 0.09);
      phase = t * (0.25 + b * 0.12 + energy * 0.25) + (fd.cursor ? fd.cursor.totalFracRow * 0.08 : 0);

      ctx.beginPath();
      for (x = -30; x <= w + 30; x += 24) {
        nx = x / (w || 1);
        wave = Math.sin(nx * Math.PI * 2 * (1.4 + b * 0.3) + phase) * amp;
        wave += Math.cos(nx * Math.PI * 2 * (2.2 + b * 0.4) - phase * 0.8) * amp * 0.45;
        y = baseY + wave;

        if (x === -30) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      alpha = 0.05 + energy * 0.07 + heat * 0.14;
      alpha = clamp(alpha, 0, 0.45);
      ctx.lineWidth = 14 + b * 8 + heat * 16;
      ctx.strokeStyle = style.soft + alpha + ")";
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawCity(ctx, fd, energy, horizonY) {
    var bassCh = roleMap.bass;
    var bassStyle = getStyle(bassCh);
    var bassHeat = noteHeat[bassCh] + skylinePulse;
    var i;
    var b;
    var mul;
    var pulse;
    var bh;
    var top;
    var g;
    var edgeAlpha;
    var beatTick;
    var windowAlpha;
    var wy;
    var wx;
    var hash;
    var threshold;

    for (i = 0; i < buildings.length; i++) {
      b = buildings[i];
      mul = 0.72 + energy * 0.8 + bassHeat * 0.95;
      pulse = 0.93 + 0.12 * Math.sin(t * 0.9 + b.phase);
      bh = b.baseH * clamp(mul * pulse, 0.5, 2.2);
      top = horizonY - bh;

      g = ctx.createLinearGradient(0, top, 0, horizonY);
      g.addColorStop(0, "rgba(9,22,30,0.96)");
      g.addColorStop(1, "rgba(2,6,10,1)");
      ctx.fillStyle = g;
      ctx.fillRect(b.x, top, b.bw, bh);

      edgeAlpha = clamp(0.08 + bassHeat * 0.25, 0, 0.5);
      ctx.strokeStyle = bassStyle.soft + edgeAlpha + ")";
      ctx.lineWidth = 1;
      ctx.strokeRect(b.x + 0.5, top + 0.5, b.bw - 1, bh - 1);

      if (bh > 24) {
        beatTick = fd.cursor ? fd.cursor.beat : ((t * 2) | 0);
        threshold = b.density + ((beatFlash * 4) | 0);
        windowAlpha = clamp(0.04 + energy * 0.25 + bassHeat * 0.18 + beatFlash * 0.2, 0, 0.65);
        ctx.fillStyle = "rgba(255,226,156," + windowAlpha + ")";

        for (wy = top + 6; wy < horizonY - 4; wy += 10) {
          for (wx = b.x + 4; wx < b.x + b.bw - 5; wx += 8) {
            hash = (((wx | 0) * 13 + (wy | 0) * 7 + b.seed + beatTick * 17) & 31);
            if (hash < threshold) ctx.fillRect(wx, wy, 3, 5);
          }
        }
      }
    }

    g = ctx.createLinearGradient(0, horizonY, 0, h);
    g.addColorStop(0, "rgba(0,15,20,0.25)");
    g.addColorStop(1, "rgba(0,0,0,0.9)");
    ctx.fillStyle = g;
    ctx.fillRect(0, horizonY, w, h - horizonY);
  }

  function drawGrid(ctx, fd, energy, horizonY) {
    var i;
    var laneX;
    var style;
    var laneAlpha;
    var z;
    var p;
    var y;
    var offset = fd.cursor ? fd.cursor.totalFracRow * 0.9 : t * 0.7;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, horizonY, w, h - horizonY);
    ctx.clip();

    for (i = -8; i <= 8; i++) {
      ctx.beginPath();
      ctx.moveTo(w * 0.5 + i * (w * 0.06), h + 1);
      ctx.lineTo(w * 0.5 + i * 5, horizonY);
      ctx.strokeStyle = "rgba(130,220,235," + (0.06 + energy * 0.08) + ")";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    for (i = 0; i < 14; i++) {
      z = (i + offset) % 14;
      p = z / 14;
      y = horizonY + (p * p) * (h - horizonY);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.strokeStyle = "rgba(110,200,220," + ((1 - p) * (0.08 + energy * 0.25)) + ")";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    for (i = 0; i < 4; i++) {
      laneX = w * (0.16 + i * 0.22);
      style = getStyle(i);
      laneAlpha = clamp(0.1 + noteHeat[i] * 0.5 + energy * 0.12, 0, 0.75);

      ctx.beginPath();
      ctx.moveTo(laneX, h);
      ctx.quadraticCurveTo(w * 0.5, horizonY + 40, w * 0.5, horizonY);
      ctx.strokeStyle = style.soft + laneAlpha + ")";
      ctx.lineWidth = 1 + noteHeat[i] * 4;
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawRipples(ctx, dt) {
    var i;
    var r;
    var life;
    var alpha;

    for (i = ripples.length - 1; i >= 0; i--) {
      r = ripples[i];
      r.life += dt;
      if (r.life > r.maxLife) {
        ripples.splice(i, 1);
        continue;
      }
    }

    for (i = ripples.length - 1; i >= 0; i--) {
      r = ripples[i];
      life = r.life / r.maxLife;
      r.r += r.speed * dt;
      alpha = (1 - life);
      alpha = alpha * alpha * (0.25 + energySmooth * 0.55 + beatFlash * 0.5);

      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.lineWidth = r.line * (1 - life * 0.6);
      ctx.strokeStyle = r.glow + clamp(alpha, 0, 0.65) + ")";
      ctx.stroke();
    }
  }

  function updateAndDrawComets(ctx, dt) {
    var i;
    var j;
    var c;
    var life;
    var t0;
    var t1;
    var segAlpha;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    for (i = comets.length - 1; i >= 0; i--) {
      c = comets[i];
      c.life += dt;
      if (c.life >= c.maxLife) {
        comets.splice(i, 1);
        continue;
      }

      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.vy += dt * 12;

      cappedPush(c.trail, { x: c.x, y: c.y }, 14);
      life = c.life / c.maxLife;

      for (j = 1; j < c.trail.length; j++) {
        t0 = c.trail[j - 1];
        t1 = c.trail[j];
        segAlpha = (j / c.trail.length) * (1 - life) * 0.4;
        ctx.beginPath();
        ctx.moveTo(t0.x, t0.y);
        ctx.lineTo(t1.x, t1.y);
        ctx.strokeStyle = c.glow + segAlpha + ")";
        ctx.lineWidth = c.size * (j / c.trail.length);
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(c.x, c.y, c.size * (1 - life * 0.4), 0, Math.PI * 2);
      ctx.fillStyle = c.color;
      ctx.globalAlpha = 0.75 + (1 - life) * 0.25;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  function updateAndDrawSparks(ctx, dt) {
    var i;
    var s;
    var life;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    for (i = sparks.length - 1; i >= 0; i--) {
      s = sparks[i];
      s.life += dt;
      if (s.life >= s.maxLife) {
        sparks.splice(i, 1);
        continue;
      }

      s.vy += 120 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;

      if (s.y > h + 20) {
        sparks.splice(i, 1);
        continue;
      }

      life = 1 - s.life / s.maxLife;
      ctx.fillStyle = "rgba(255,245,220," + (life * 0.35) + ")";
      ctx.fillRect(s.x, s.y, s.size, s.size);

      ctx.fillStyle = s.color;
      ctx.globalAlpha = life * 0.8;
      ctx.fillRect(s.x + 0.5, s.y + 0.5, s.size * 0.6, s.size * 0.6);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  return {
    name: "Neon Skyline Storm",

    init: function (ctx, width, height, a) {
      var base = 0xC0FFEE;

      w = width;
      h = height;
      analysis = a;

      if (analysis) {
        base ^= (analysis.totalRows || 0) * 31;
        base ^= (analysis.pitchRange && analysis.pitchRange.min ? analysis.pitchRange.min : 0) * 131;
      }

      srand(base >>> 0);
      rebuildRoleData();
      buildStars();
      buildBuildings();

      t = 0;
      lastRow = -1;
      beatFlash = 0;
      energySmooth = 0;
      skylinePulse = 0;
      harmonyLift = 0;
      leadSide = 0;
      noteHeat = [0, 0, 0, 0];
      comets = [];
      sparks = [];
      ripples = [];
    },

    resize: function (width, height) {
      w = width;
      h = height;
      buildStars();
      buildBuildings();
    },

    render: function (fd) {
      var ctx = fd.ctx;
      var dt = fd.dt || (1 / 60);
      var cursor = fd.cursor;
      var notes = fd.currentNotes || [];
      var energy = 0;
      var beatFrac = 0;
      var i;
      var horizonY;

      w = fd.width;
      h = fd.height;

      if (!analysis && fd.analysis) {
        analysis = fd.analysis;
        rebuildRoleData();
      }

      t += dt;

      for (i = 0; i < 4; i++) {
        noteHeat[i] = Math.max(0, noteHeat[i] - dt * 1.9);
        if (notes[i]) {
          noteHeat[i] = Math.max(noteHeat[i], 0.18 + (notes[i].vol || 0) * 0.9);
        }
      }

      if (analysis && cursor && analysis.energy) {
        energy = analysis.energy[cursor.timelineIndex] || 0;
      }

      energySmooth += (energy - energySmooth) * Math.min(1, dt * 6);
      skylinePulse = Math.max(0, skylinePulse - dt * 1.8);
      harmonyLift = Math.max(0, harmonyLift - dt * 1.1);
      beatFlash = Math.max(0, beatFlash - dt * 2.4);

      if (analysis && cursor && analysis.rpb) {
        beatFrac = (cursor.totalFracRow % analysis.rpb) / analysis.rpb;
        if (beatFrac < 0.09) {
          beatFlash = Math.max(beatFlash, 1 - beatFrac / 0.09);
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

      horizonY = h * 0.72;

      drawBackground(ctx, energySmooth, cursor ? cursor.beat : 0);
      drawAurora(ctx, fd, energySmooth);
      drawCity(ctx, fd, energySmooth, horizonY);
      drawGrid(ctx, fd, energySmooth, horizonY);
      drawRipples(ctx, dt);
      updateAndDrawComets(ctx, dt);
      updateAndDrawSparks(ctx, dt);
    },

    destroy: function () {
      analysis = null;
      stars = [];
      buildings = [];
      comets = [];
      sparks = [];
      ripples = [];
      noteHeat = [0, 0, 0, 0];
      lastRow = -1;
    }
  };
})();
