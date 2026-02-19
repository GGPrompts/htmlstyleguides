/**
 * Cyber Horizon Renderer
 * A synthwave-inspired cityscape with a perspective grid, a pulsing retro sun,
 * and buildings that rise and glow based on channel activity and musical roles.
 *
 * Created by Gemini.
 */
window.Renderers['cyber-horizon'] = (function () {
  "use strict";

  var w = 0, h = 0;
  var analysis = null;
  var stars = [];
  var gridOffset = 0;
  var pillarHeights = [0, 0, 0, 0];
  var pillarVols = [0, 0, 0, 0];

  var COLORS = [
    { main: "#00ffff", glow: "rgba(0, 255, 255, 0.5)" }, // Cyan
    { main: "#ff00ff", glow: "rgba(255, 0, 255, 0.5)" }, // Magenta
    { main: "#ffff00", glow: "rgba(255, 255, 0, 0.5)" }, // Yellow
    { main: "#00ff00", glow: "rgba(0, 255, 0, 0.5)" }   // Green
  ];

  function initStars() {
    stars = [];
    for (var i = 0; i < 150; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random() * 0.55,
        size: 0.5 + Math.random() * 1.5,
        speed: 0.02 + Math.random() * 0.05
      });
    }
  }

  return {
    name: 'Cyber Horizon',

    init: function (ctx, width, height, a) {
      w = width; h = height; analysis = a;
      initStars();
      pillarHeights = [0, 0, 0, 0];
      pillarVols = [0, 0, 0, 0];
      gridOffset = 0;
    },

    resize: function (width, height) { w = width; h = height; },

    render: function (fd) {
      var ctx = fd.ctx;
      var dt = fd.dt || 0.016;
      w = fd.width; h = fd.height;

      // 1. Background Gradient
      var bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, "#020205");
      bgGrad.addColorStop(0.55, "#150525");
      bgGrad.addColorStop(0.56, "#0a0a20");
      bgGrad.addColorStop(1, "#000000");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      var energy = (fd.cursor && analysis) ? (analysis.energy[fd.cursor.timelineIndex] || 0) : 0;

      // 2. Stars
      ctx.fillStyle = "#fff";
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var twinkle = Math.sin((fd.cursor ? fd.cursor.elapsed : 0) * 3 + i) * 0.5 + 0.5;
        ctx.globalAlpha = (0.2 + twinkle * 0.8) * (1 - (s.y / 0.55));
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.size * (1 + energy), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // 3. Synth Sun
      var sunX = w / 2, sunY = h * 0.55, sunR = Math.min(w, h) * 0.22;
      var sunGrad = ctx.createLinearGradient(0, sunY - sunR, 0, sunY);
      sunGrad.addColorStop(0, "#ffde17");
      sunGrad.addColorStop(1, "#e91e63");

      ctx.shadowBlur = 15 + energy * 30;
      ctx.shadowColor = "#e91e63";
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR * (1 + energy * 0.05), Math.PI, 0);
      ctx.fill();

      // Sun Scanline Bars
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#150525";
      for (var j = 1; j < 8; j++) {
        var bh = 1 + j * 1.8;
        var by = sunY - (j / 8) * sunR * 0.9;
        ctx.fillRect(sunX - sunR * 1.2, by, sunR * 2.4, bh);
      }

      // Sunglasses
      var glassY = sunY - sunR * 0.38;
      var glassW = sunR * 0.32;
      var glassH = sunR * 0.22;
      var glassGap = sunR * 0.06;
      var glassR = sunR * 0.06;
      var bridgeY = glassY + glassH * 0.35;

      ctx.fillStyle = "#0a0a0a";
      ctx.strokeStyle = "#222";
      ctx.lineWidth = Math.max(1.5, sunR * 0.02);

      // Left lens
      var lx = sunX - glassGap - glassW;
      ctx.beginPath();
      ctx.moveTo(lx + glassR, glassY);
      ctx.lineTo(lx + glassW - glassR, glassY);
      ctx.quadraticCurveTo(lx + glassW, glassY, lx + glassW, glassY + glassR);
      ctx.lineTo(lx + glassW, glassY + glassH - glassR);
      ctx.quadraticCurveTo(lx + glassW, glassY + glassH, lx + glassW - glassR, glassY + glassH);
      ctx.lineTo(lx + glassR, glassY + glassH);
      ctx.quadraticCurveTo(lx, glassY + glassH, lx, glassY + glassH - glassR);
      ctx.lineTo(lx, glassY + glassR);
      ctx.quadraticCurveTo(lx, glassY, lx + glassR, glassY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Right lens
      var rx = sunX + glassGap;
      ctx.beginPath();
      ctx.moveTo(rx + glassR, glassY);
      ctx.lineTo(rx + glassW - glassR, glassY);
      ctx.quadraticCurveTo(rx + glassW, glassY, rx + glassW, glassY + glassR);
      ctx.lineTo(rx + glassW, glassY + glassH - glassR);
      ctx.quadraticCurveTo(rx + glassW, glassY + glassH, rx + glassW - glassR, glassY + glassH);
      ctx.lineTo(rx + glassR, glassY + glassH);
      ctx.quadraticCurveTo(rx, glassY + glassH, rx, glassY + glassH - glassR);
      ctx.lineTo(rx, glassY + glassR);
      ctx.quadraticCurveTo(rx, glassY, rx + glassR, glassY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Bridge
      ctx.beginPath();
      ctx.moveTo(sunX - glassGap, bridgeY);
      ctx.quadraticCurveTo(sunX, bridgeY - sunR * 0.04, sunX + glassGap, bridgeY);
      ctx.strokeStyle = "#222";
      ctx.lineWidth = Math.max(2, sunR * 0.03);
      ctx.stroke();

      // Arms extending outward
      ctx.beginPath();
      ctx.moveTo(lx, glassY + glassH * 0.3);
      ctx.lineTo(lx - sunR * 0.3, glassY + glassH * 0.15);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(rx + glassW, glassY + glassH * 0.3);
      ctx.lineTo(rx + glassW + sunR * 0.3, glassY + glassH * 0.15);
      ctx.stroke();

      // Lens glare
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(lx + glassW * 0.15, glassY + glassH * 0.15, glassW * 0.25, glassH * 0.3);
      ctx.fillRect(rx + glassW * 0.15, glassY + glassH * 0.15, glassW * 0.25, glassH * 0.3);

      // 4. Horizon & Grid
      var horY = h * 0.55;
      gridOffset += dt * 80 * (1 + energy * 2);
      if (gridOffset > 100) gridOffset -= 100;

      ctx.strokeStyle = "rgba(0, 255, 255, 0.4)";
      ctx.lineWidth = 1;
      // Perspective vanishing lines
      for (var k = -10; k <= 10; k++) {
        ctx.beginPath();
        ctx.moveTo(w / 2 + k * (w * 0.02), horY);
        ctx.lineTo(w / 2 + k * (w * 0.5), h);
        ctx.stroke();
      }
      // Horizontal scrolling lines
      for (var l = 0; l < 12; l++) {
        var hz = (l * 40 + gridOffset) % 480;
        var ly = horY + Math.pow(hz / 480, 1.5) * (h - horY);
        ctx.globalAlpha = (hz / 480) * 0.8;
        ctx.beginPath();
        ctx.moveTo(0, ly);
        ctx.lineTo(w, ly);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // 5. Digital City Pillars
      if (analysis) {
        var numCh = Math.min(analysis.numChannels, 4);
        var totalCityW = w * 0.7;
        var chW = (totalCityW / numCh);

        for (var c = 0; c < numCh; c++) {
          var note = fd.currentNotes ? fd.currentNotes[c] : null;
          var role = (analysis.channelRoles && analysis.channelRoles[c]) ?
            analysis.channelRoles[c].role : "harmony";
          var clr = COLORS[c % COLORS.length];

          if (note) {
            pillarVols[c] = Math.max(pillarVols[c], note.vol);
            var hFactor = (role === "lead") ? 0.45 : (role === "bass" ? 0.2 : 0.3);
            var targetH = note.normalized * h * hFactor + note.vol * h * 0.1;
            pillarHeights[c] += (targetH - pillarHeights[c]) * 0.4;
          } else {
            pillarHeights[c] *= 0.85;
            pillarVols[c] *= 0.92;
          }

          var ph = pillarHeights[c];
          var pv = pillarVols[c];
          var cx = (w - totalCityW) / 2 + c * chW + chW / 2;
          var curW = (role === "bass" ? chW * 0.8 : (role === "lead" ? chW * 0.3 : chW * 0.5));

          if (ph > 2) {
            ctx.fillStyle = "#050510";
            ctx.strokeStyle = clr.main;
            ctx.lineWidth = 1 + pv * 3;
            ctx.shadowBlur = 4 + pv * 12;
            ctx.shadowColor = clr.main;

            ctx.fillRect(cx - curW / 2, horY - ph, curW, ph);
            ctx.strokeRect(cx - curW / 2, horY - ph, curW, ph);

            // Windows / Data lines internal detail
            if (ph > 15) {
              ctx.shadowBlur = 0;
              ctx.fillStyle = clr.main;
              ctx.globalAlpha = 0.2 + pv * 0.5;
              var rowCount = Math.floor(ph / 10);
              for (var r = 0; r < rowCount; r++) {
                if (Math.sin(c * 10 + r) > -0.2) {
                  ctx.fillRect(cx - curW / 2 + 2, horY - ph + 5 + r * 10, curW - 4, 2);
                }
              }
              ctx.globalAlpha = 1;
            }
          }
        }
      }
      ctx.shadowBlur = 0;

      // 6. Beat Sync Effects
      if (fd.cursor) {
        var rpb = analysis.rpb || 4;
        var bFrac = (fd.cursor.totalFracRow % rpb) / rpb;
        if (bFrac < 0.1) {
          var alpha = (1 - bFrac / 0.1) * 0.08;
          ctx.fillStyle = "rgba(255, 255, 255, " + alpha + ")";
          ctx.fillRect(0, 0, w, h);

          // Flash the horizon line
          ctx.strokeStyle = "rgba(255, 255, 255, " + (alpha * 1.5) + ")";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(0, horY);
          ctx.lineTo(w, horY);
          ctx.stroke();
        }
      }
    },

    destroy: function () {
      analysis = null;
      stars = [];
      pillarHeights = [0, 0, 0, 0];
      pillarVols = [0, 0, 0, 0];
    }
  };
})();
