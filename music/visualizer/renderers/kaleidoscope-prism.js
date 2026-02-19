/**
 * Kaleidoscope Prism Renderer
 * A true kaleidoscope with N-fold symmetric wedges, concentric mandala rings,
 * hex facets, and prismatic particles — all in warm jewel tones.
 * Designed to work as an animated background behind glassmorphism UI.
 *
 * - Bass: ring pulse (expand/contract), background warmth
 * - Lead: hex facet color (pitch→gem spectrum), facet rotation speed
 * - Harmony: outer wedge opacity/size
 * - Percussion: beat flash, particle spawn, ring burst
 * - Energy: overall brightness, ring count, wedge segment count
 */
window.Renderers["kaleidoscope-prism"] = (function () {
  "use strict";

  /* ── Palette ── */
  var GEMS = [
    { hex: "#C0392B", r: 192, g: 57, b: 43 },   // Ruby
    { hex: "#E67E22", r: 230, g: 126, b: 34 },  // Topaz
    { hex: "#F1C40F", r: 241, g: 196, b: 15 },  // Citrine
    { hex: "#1A9E6F", r: 26, g: 158, b: 111 },  // Emerald
    { hex: "#1A4FA0", r: 26, g: 79, b: 160 },   // Sapphire
    { hex: "#4B3F8C", r: 75, g: 63, b: 140 },   // Tanzanite
    { hex: "#8B44AC", r: 139, g: 68, b: 172 }    // Amethyst
  ];
  var BG_COLOR = "#0D0B14";

  /* ── State ── */
  var w = 0;
  var h = 0;
  var analysis = null;

  var t = 0;
  var lastRow = -1;
  var beatFlash = 0;
  var energySmooth = 0;
  var bassPulse = 0;
  var harmonyPulse = 0;
  var leadNorm = 0.5;
  var leadHeat = 0;

  var outerRot = 0;
  var innerRot = 0;
  var ringRot = 0;

  var roleMap = { lead: 0, harmony: 1, bass: 2, percussion: 3 };
  var roleByChannel = ["lead", "harmony", "bass", "percussion"];
  var DEFAULT_ROLES = ["lead", "harmony", "bass", "percussion"];

  /* ── Particles ── */
  var particles = [];
  var MAX_PARTICLES = 120;

  /* ── Helpers ── */
  function clamp(v, lo, hi) {
    if (v < lo) return lo;
    if (v > hi) return hi;
    return v;
  }

  function gemRGBA(idx, alpha) {
    var g = GEMS[((idx % 7) + 7) % 7];
    return "rgba(" + g.r + "," + g.g + "," + g.b + "," + alpha + ")";
  }

  function gemByNorm(norm) {
    return ((norm * 6.99) | 0) % 7;
  }

  function lerpColor(idxA, idxB, frac, alpha) {
    var a = GEMS[((idxA % 7) + 7) % 7];
    var b = GEMS[((idxB % 7) + 7) % 7];
    var inv = 1 - frac;
    var r = (a.r * inv + b.r * frac) | 0;
    var g = (a.g * inv + b.g * frac) | 0;
    var bl = (a.b * inv + b.b * frac) | 0;
    return "rgba(" + r + "," + g + "," + bl + "," + alpha + ")";
  }

  function rebuildRoleMap() {
    var numCh = 4;
    var i, role;

    if (analysis && analysis.numChannels) {
      numCh = analysis.numChannels;
      if (numCh < 1) numCh = 1;
      if (numCh > 4) numCh = 4;
    }

    roleMap = { lead: 0, harmony: 1, bass: 2, percussion: 3 };
    for (i = 0; i < 4; i++) {
      roleByChannel[i] = DEFAULT_ROLES[i];
    }

    if (analysis && analysis.channelRoles) {
      for (i = 0; i < numCh; i++) {
        role = analysis.channelRoles[i] && analysis.channelRoles[i].role;
        if (role === "lead" || role === "harmony" || role === "bass" || role === "percussion") {
          roleByChannel[i] = role;
          roleMap[role] = i;
        }
      }
    }

    if (roleMap.lead >= numCh) roleMap.lead = 0;
    if (roleMap.harmony >= numCh) roleMap.harmony = numCh > 1 ? 1 : 0;
    if (roleMap.bass >= numCh) roleMap.bass = numCh > 2 ? 2 : 0;
    if (roleMap.percussion >= numCh) roleMap.percussion = numCh > 3 ? 3 : (numCh - 1);
  }

  /* ── Particle pool ── */
  function spawnParticle(norm, vol) {
    var gemIdx = gemByNorm(norm);
    var angle = Math.random() * Math.PI * 2;
    var p = {
      a: angle,
      r: 20 + Math.random() * 30,
      vr: 40 + Math.random() * 80 + vol * 100,
      life: 0,
      maxLife: 0.8 + Math.random() * 1.2,
      size: 1.5 + Math.random() * 2.5 + vol * 2,
      gemIdx: gemIdx
    };
    if (particles.length >= MAX_PARTICLES) {
      particles.shift();
    }
    particles.push(p);
  }

  /* ── Event handler ── */
  function onRow(fd, energy) {
    var notes = fd.currentNotes || [];
    var lead = notes[roleMap.lead];
    var harmony = notes[roleMap.harmony];
    var bass = notes[roleMap.bass];
    var perc = notes[roleMap.percussion];
    var i, count;

    if (lead) {
      leadNorm = typeof lead.normalized === "number" ? lead.normalized : 0.5;
      leadHeat = Math.max(leadHeat, 0.3 + (lead.vol || 0.4) * 0.7);
      count = 1 + ((lead.vol || 0.4) * 3) | 0;
      for (i = 0; i < count; i++) {
        spawnParticle(leadNorm, lead.vol || 0.4);
      }
    }

    if (harmony) {
      harmonyPulse = Math.max(harmonyPulse, 0.3 + (harmony.vol || 0.35) * 0.7);
    }

    if (bass) {
      bassPulse = Math.max(bassPulse, 0.4 + (bass.vol || 0.3) * 0.8);
    }

    if (perc) {
      beatFlash = Math.max(beatFlash, 0.5 + (perc.vol || 0.4) * 0.5);
      count = 3 + ((perc.vol || 0.4) * 6) | 0;
      for (i = 0; i < count; i++) {
        spawnParticle(Math.random(), perc.vol || 0.4);
      }
    }
  }

  /* ── Layer 1: Background ── */
  function drawBackground(ctx, energy, bassHeat) {
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, w, h);

    var warmth = 0.02 + energy * 0.04 + bassHeat * 0.03;
    if (warmth > 0.01) {
      var g = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, Math.min(w, h) * 0.55);
      g.addColorStop(0, "rgba(192,57,43," + clamp(warmth, 0, 0.1) + ")");
      g.addColorStop(0.5, "rgba(230,126,34," + clamp(warmth * 0.5, 0, 0.06) + ")");
      g.addColorStop(1, "rgba(13,11,20,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
  }

  /* ── Layer 2: Outer Conic Wedges ── */
  function drawOuterWedges(ctx, cx, cy, radius, segments, harmonyVal, energy) {
    var step = (Math.PI * 2) / segments;
    var alpha = clamp(0.06 + harmonyVal * 0.08 + energy * 0.04, 0.03, 0.18);
    var outerR = radius * (0.95 + harmonyVal * 0.08);
    var innerR = radius * 0.15;
    var i, a0, a1, gemIdx;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(outerRot);

    for (i = 0; i < segments; i++) {
      a0 = i * step;
      a1 = a0 + step;
      gemIdx = i % 7;

      ctx.beginPath();
      ctx.moveTo(Math.cos(a0) * innerR, Math.sin(a0) * innerR);
      ctx.lineTo(Math.cos(a0) * outerR, Math.sin(a0) * outerR);
      ctx.arc(0, 0, outerR, a0, a1);
      ctx.lineTo(Math.cos(a1) * innerR, Math.sin(a1) * innerR);
      ctx.arc(0, 0, innerR, a1, a0, true);
      ctx.closePath();

      ctx.fillStyle = gemRGBA(gemIdx, alpha);
      ctx.fill();
    }

    ctx.restore();
  }

  /* ── Layer 3: Concentric Mandala Rings ── */
  function drawMandalaRings(ctx, cx, cy, maxRadius, ringCount, bassVal, energy) {
    var i, r, alpha, tickCount, tickLen, j, ta;
    var breathe = bassPulse * 0.06;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ringRot);

    for (i = 0; i < ringCount; i++) {
      var frac = (i + 1) / (ringCount + 1);
      r = maxRadius * frac * (1 + breathe * Math.sin(t * 1.2 + i * 0.8));
      alpha = clamp(0.06 + energy * 0.06 + bassVal * 0.04, 0.03, 0.2);

      // Ring circle
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.strokeStyle = gemRGBA(i % 7, alpha);
      ctx.lineWidth = 1 + energy * 1.5;
      ctx.stroke();

      // Tick marks — batched into single path
      tickCount = 12 + i * 6;
      tickLen = 3 + (maxRadius * 0.015) + energy * 4;
      ctx.beginPath();
      for (j = 0; j < tickCount; j++) {
        ta = (j / tickCount) * Math.PI * 2;
        ctx.moveTo(Math.cos(ta) * (r - tickLen), Math.sin(ta) * (r - tickLen));
        ctx.lineTo(Math.cos(ta) * (r + tickLen), Math.sin(ta) * (r + tickLen));
      }
      ctx.strokeStyle = gemRGBA((i + 3) % 7, alpha * 0.7);
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    ctx.restore();
  }

  /* ── Layer 4: Inner Hex Facets ── */
  function drawHexFacets(ctx, cx, cy, radius, leadNormVal, leadHeatVal, energy) {
    var facetCount = 6;
    var facetR = radius * (0.08 + energy * 0.02);
    var ringR = radius * (0.28 + leadHeatVal * 0.04);
    var step = (Math.PI * 2) / facetCount;
    var gemIdx = gemByNorm(leadNormVal);
    var nextGem = (gemIdx + 1) % 7;
    var gemFrac = (leadNormVal * 6.99) % 1;
    var alpha = clamp(0.08 + leadHeatVal * 0.08 + energy * 0.05, 0.04, 0.22);
    var i, angle, fx, fy, j, ha;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(innerRot);

    for (i = 0; i < facetCount; i++) {
      angle = i * step;
      fx = Math.cos(angle) * ringR;
      fy = Math.sin(angle) * ringR;

      // Draw hexagon
      ctx.beginPath();
      for (j = 0; j < 6; j++) {
        ha = (j / 6) * Math.PI * 2;
        if (j === 0) {
          ctx.moveTo(fx + Math.cos(ha) * facetR, fy + Math.sin(ha) * facetR);
        } else {
          ctx.lineTo(fx + Math.cos(ha) * facetR, fy + Math.sin(ha) * facetR);
        }
      }
      ctx.closePath();

      ctx.fillStyle = lerpColor(gemIdx, nextGem, gemFrac, alpha);
      ctx.fill();
      ctx.strokeStyle = lerpColor(gemIdx, nextGem, gemFrac, alpha + 0.06);
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.restore();
  }

  /* ── Layer 5: Center Glow ── */
  function drawCenterGlow(ctx, cx, cy, radius, energy, beat) {
    var glowR = radius * (0.12 + beat * 0.05 + energy * 0.04);
    var alpha = clamp(0.04 + energy * 0.06 + beat * 0.08, 0.02, 0.2);

    var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR * 3);
    g.addColorStop(0, "rgba(241,196,15," + alpha + ")");
    g.addColorStop(0.4, "rgba(230,126,34," + (alpha * 0.5) + ")");
    g.addColorStop(1, "rgba(13,11,20,0)");
    ctx.fillStyle = g;
    ctx.fillRect(cx - glowR * 3, cy - glowR * 3, glowR * 6, glowR * 6);

    // Bright center dot
    ctx.beginPath();
    ctx.arc(cx, cy, glowR * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,240," + clamp(alpha * 0.8, 0, 0.15) + ")";
    ctx.fill();
  }

  /* ── Layer 6: Prismatic Particles ── */
  function drawParticles(ctx, cx, cy, dt) {
    var i, p, lifeFrac, alpha, x, y;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    for (i = particles.length - 1; i >= 0; i--) {
      p = particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        particles.splice(i, 1);
        continue;
      }

      p.r += p.vr * dt;
      lifeFrac = p.life / p.maxLife;
      alpha = (1 - lifeFrac) * clamp(0.12 + energySmooth * 0.1, 0.05, 0.25);

      x = cx + Math.cos(p.a) * p.r;
      y = cy + Math.sin(p.a) * p.r;

      ctx.beginPath();
      ctx.arc(x, y, p.size * (1 - lifeFrac * 0.4), 0, Math.PI * 2);
      ctx.fillStyle = gemRGBA(p.gemIdx, alpha);
      ctx.fill();
    }

    ctx.restore();
  }

  /* ── Main ── */
  return {
    name: "Kaleidoscope Prism",

    init: function (ctx, width, height, a) {
      w = width;
      h = height;
      analysis = a;
      rebuildRoleMap();

      t = 0;
      lastRow = -1;
      beatFlash = 0;
      energySmooth = 0;
      bassPulse = 0;
      harmonyPulse = 0;
      leadNorm = 0.5;
      leadHeat = 0;
      outerRot = 0;
      innerRot = 0;
      ringRot = 0;
      particles = [];
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
      var energy = 0;
      var cx = w * 0.5;
      var cy = h * 0.5;
      var radialMax = Math.min(w, h) * 0.48;
      var ringCount, wedgeSegments;
      var ambient, breathe, colorCycle;

      w = fd.width;
      h = fd.height;
      cx = w * 0.5;
      cy = h * 0.5;
      radialMax = Math.min(w, h) * 0.48;

      if (!analysis && fd.analysis) {
        analysis = fd.analysis;
        rebuildRoleMap();
      }

      t += dt;

      // Get energy from analysis
      if (analysis && cursor && analysis.energy) {
        energy = analysis.energy[cursor.timelineIndex] || 0;
      }
      energySmooth += (energy - energySmooth) * Math.min(1, dt * 5);

      // Decay pulses
      bassPulse = Math.max(0, bassPulse - dt * 1.6);
      harmonyPulse = Math.max(0, harmonyPulse - dt * 1.2);
      leadHeat = Math.max(0, leadHeat - dt * 1.8);
      beatFlash = Math.max(0, beatFlash - dt * 2.5);

      // Track note heat
      if (notes[roleMap.lead] && typeof notes[roleMap.lead].normalized === "number") {
        leadNorm = notes[roleMap.lead].normalized;
      }

      // Beat detection
      if (analysis && cursor && analysis.rpb) {
        var beatFrac = (cursor.totalFracRow % analysis.rpb) / analysis.rpb;
        if (beatFrac < 0.1) {
          beatFlash = Math.max(beatFlash, (1 - beatFrac / 0.1) * 0.5);
        }
      }

      // Row events
      if (cursor) {
        if (cursor.globalRow !== lastRow) {
          onRow(fd, energy);
          lastRow = cursor.globalRow;
        }
      } else {
        lastRow = -1;
      }

      // Dynamic counts
      ringCount = 5 + Math.round(energySmooth * 3);   // 5-8
      wedgeSegments = energySmooth > 0.5 ? 8 : 6;

      /* ── Ambient / idle mode ── */
      if (!cursor) {
        breathe = Math.sin(t * 0.628) * 0.5 + 0.5;  // ~10s cycle
        colorCycle = (t * 0.02) % 1;                   // ~50s full cycle

        // Slow rotations
        outerRot += dt * 0.0524;   // ~2 min/rev
        innerRot -= dt * 0.1047;   // ~1 min/rev
        ringRot += dt * 0.035;

        // Fake gentle values for ambient drawing
        energySmooth = 0.05 + breathe * 0.04;
        bassPulse = breathe * 0.08;
        harmonyPulse = 0.06 + breathe * 0.05;
        leadNorm = colorCycle;
        leadHeat = 0.05;
        beatFlash = 0;
        ringCount = 6;
        wedgeSegments = 6;
      } else {
        // Music-driven rotations
        outerRot += dt * (0.08 + energySmooth * 0.15);
        innerRot -= dt * (0.2 + leadHeat * 0.3 + energySmooth * 0.1);
        ringRot += dt * (0.05 + bassPulse * 0.1);
      }

      /* ── Draw all layers back-to-front ── */

      // 1. Background
      drawBackground(ctx, energySmooth, bassPulse);

      // 2. Outer Conic Wedges
      drawOuterWedges(ctx, cx, cy, radialMax, wedgeSegments, harmonyPulse, energySmooth);

      // 3. Concentric Mandala Rings
      drawMandalaRings(ctx, cx, cy, radialMax, ringCount, bassPulse, energySmooth);

      // 4. Inner Hex Facets
      drawHexFacets(ctx, cx, cy, radialMax, leadNorm, leadHeat, energySmooth);

      // 5. Center Glow
      drawCenterGlow(ctx, cx, cy, radialMax, energySmooth, beatFlash);

      // 6. Prismatic Particles
      drawParticles(ctx, cx, cy, dt);
    },

    destroy: function () {
      analysis = null;
      particles = [];
      lastRow = -1;
      t = 0;
      beatFlash = 0;
      energySmooth = 0;
      bassPulse = 0;
      harmonyPulse = 0;
      leadHeat = 0;
    }
  };
})();
