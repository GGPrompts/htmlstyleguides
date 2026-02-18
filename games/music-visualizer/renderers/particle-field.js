/**
 * Particle Field Renderer
 * Dark background. Notes trigger particle bursts from channel quadrants.
 * Particle size = volume, color = wave type. Beat shockwaves from center.
 */
window.Renderers["particle-field"] = (function () {
  "use strict";

  var particles = [];
  var shockwaves = [];
  var w = 0, h = 0;
  var analysis = null;
  var lastBeat = -1;
  var MAX_PARTICLES = 600;

  // Wave type → color palette
  var WAVE_COLORS = {
    square:   ["#ff6b6b", "#ff4757", "#ee5a24"],
    pulse25:  ["#ffa502", "#ff9f43", "#f7b731"],
    pulse12:  ["#ffdd57", "#ffd32a", "#eccc68"],
    triangle: ["#1dd1a1", "#2ed573", "#7bed9f"],
    sawtooth: ["#5f27cd", "#a55eea", "#cf6a87"],
    sine:     ["#48dbfb", "#0abde3", "#74b9ff"],
    noise:    ["#a4b0be", "#dfe6e9", "#636e72"]
  };

  function getColor(wave) {
    var palette = WAVE_COLORS[wave] || WAVE_COLORS.square;
    return palette[Math.floor(Math.random() * palette.length)];
  }

  // Channel quadrant centers (0=top-left, 1=top-right, 2=bottom-left, 3=bottom-right)
  function channelOrigin(ch) {
    var cx = (ch % 2 === 0) ? w * 0.3 : w * 0.7;
    var cy = (ch < 2) ? h * 0.35 : h * 0.65;
    return { x: cx, y: cy };
  }

  function scale() { return Math.min(w, h) / 500; }

  function spawnParticles(note, ch) {
    var origin = channelOrigin(ch);
    var count = 3 + Math.floor(note.vol * 8);
    var sc = scale();
    for (var i = 0; i < count && particles.length < MAX_PARTICLES; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = (40 + Math.random() * 120 * note.vol) * sc;
      var size = (3 + note.vol * 10 + note.normalized * 8) * sc;
      particles.push({
        x: origin.x + (Math.random() - 0.5) * 40 * sc,
        y: origin.y + (Math.random() - 0.5) * 40 * sc,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: size,
        life: 1,
        decay: 0.3 + Math.random() * 0.6,
        color: getColor(note.wave),
        alpha: 0.8 + Math.random() * 0.2
      });
    }
  }

  function spawnShockwave(beat) {
    var sc = scale();
    shockwaves.push({
      x: w / 2,
      y: h / 2,
      radius: 10 * sc,
      maxRadius: Math.min(w, h) * 0.5,
      speed: (300 + (beat % 4 === 0 ? 200 : 0)) * sc,
      lineWidth: 2 + sc,
      alpha: beat % 4 === 0 ? 0.4 : 0.2,
      color: beat % 4 === 0 ? "#ff6b6b" : "#48dbfb"
    });
  }

  return {
    name: "Particle Field",

    init: function (ctx, width, height, a) {
      w = width;
      h = height;
      analysis = a;
      particles = [];
      shockwaves = [];
      lastBeat = -1;
    },

    resize: function (width, height) {
      w = width;
      h = height;
    },

    render: function (fd) {
      var ctx = fd.ctx;
      w = fd.width;
      h = fd.height;
      var dt = fd.dt || 1 / 60;

      // Background
      ctx.fillStyle = "#0a0a1a";
      ctx.fillRect(0, 0, w, h);

      // Subtle grid
      ctx.strokeStyle = "rgba(255,255,255,0.03)";
      ctx.lineWidth = 1;
      var gridSize = 40;
      for (var gx = 0; gx < w; gx += gridSize) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
        ctx.stroke();
      }
      for (var gy = 0; gy < h; gy += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
      }

      if (!fd.cursor) return;

      // Beat shockwave
      var currentBeat = fd.cursor.beat;
      if (currentBeat !== lastBeat) {
        spawnShockwave(currentBeat);
        lastBeat = currentBeat;
      }

      // Spawn particles for active notes
      var notes = fd.currentNotes;
      for (var i = 0; i < notes.length; i++) {
        if (notes[i]) spawnParticles(notes[i], i);
      }

      // Energy glow behind center
      if (analysis) {
        var idx = fd.cursor.timelineIndex;
        var e = analysis.energy[idx] || 0;
        if (e > 0.1) {
          var grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.35 * e);
          grad.addColorStop(0, "rgba(255,100,100," + (e * 0.15) + ")");
          grad.addColorStop(1, "rgba(255,100,100,0)");
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);
        }
      }

      // Update and draw shockwaves
      for (var si = shockwaves.length - 1; si >= 0; si--) {
        var sw = shockwaves[si];
        sw.radius += sw.speed * dt;
        sw.alpha *= 0.96;
        if (sw.radius > sw.maxRadius || sw.alpha < 0.01) {
          shockwaves.splice(si, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = sw.color.replace(")", "," + sw.alpha + ")").replace("rgb", "rgba");
        // Hex color — convert via temp
        ctx.globalAlpha = sw.alpha;
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = sw.lineWidth;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Channel labels (subtle)
      var sc = scale();
      ctx.font = Math.round(11 * sc) + "px monospace";
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      if (analysis) {
        for (var ci = 0; ci < analysis.numChannels; ci++) {
          var origin = channelOrigin(ci);
          var role = analysis.channelRoles[ci];
          ctx.fillText(role.role.toUpperCase(), origin.x - 20, origin.y - 30);
        }
      }

      // Update and draw particles
      for (var pi = particles.length - 1; pi >= 0; pi--) {
        var p = particles[pi];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.life -= p.decay * dt;

        if (p.life <= 0) {
          particles.splice(pi, 1);
          continue;
        }

        ctx.globalAlpha = p.life * p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();

        // Glow
        if (p.size > 4 * sc) {
          ctx.globalAlpha = p.life * p.alpha * 0.3;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * p.life * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;

      // Beat indicator (bottom center)
      var beatInBar = currentBeat % 4;
      for (var bi = 0; bi < 4; bi++) {
        var bx = w / 2 - 30 * sc + bi * 20 * sc;
        var by = h - 30 * sc;
        ctx.beginPath();
        ctx.arc(bx, by, (bi === beatInBar ? 6 : 4) * sc, 0, Math.PI * 2);
        ctx.fillStyle = bi === beatInBar ? "#ff6b6b" : "rgba(255,255,255,0.2)";
        ctx.fill();
      }
    },

    destroy: function () {
      particles = [];
      shockwaves = [];
      lastBeat = -1;
    }
  };
})();
