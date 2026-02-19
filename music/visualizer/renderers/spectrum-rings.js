/**
 * Spectrum Rings Renderer
 * 4 concentric rings (one per channel). Radius pulses with note activity,
 * arcs show active notes, rings rotate at different speeds.
 */
window.Renderers["spectrum-rings"] = (function () {
  "use strict";

  var w = 0, h = 0;
  var analysis = null;
  var rotations = [0, 0, 0, 0];
  var pulses = [0, 0, 0, 0];
  var trails = [[], [], [], []];
  var MAX_TRAIL = 24;

  // Ring colors per channel
  var RING_COLORS = [
    { main: "#ff6b6b", glow: "rgba(255,107,107,", arc: "#ff4757" },
    { main: "#48dbfb", glow: "rgba(72,219,251,",  arc: "#0abde3" },
    { main: "#1dd1a1", glow: "rgba(29,209,161,",  arc: "#10ac84" },
    { main: "#ffa502", glow: "rgba(255,165,2,",   arc: "#ff9f43" }
  ];

  // Rotation speeds (radians per second)
  var ROT_SPEEDS = [0.3, -0.2, 0.15, -0.1];

  return {
    name: "Spectrum Rings",

    init: function (ctx, width, height, a) {
      w = width;
      h = height;
      analysis = a;
      rotations = [0, 0, 0, 0];
      pulses = [0, 0, 0, 0];
      trails = [[], [], [], []];
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

      // Background — dark with subtle radial gradient
      ctx.fillStyle = "#0a0a1a";
      ctx.fillRect(0, 0, w, h);

      var cx = w / 2;
      var cy = h / 2;
      var maxR = Math.min(w, h) * 0.42;

      // Background radial glow
      var bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 1.2);
      bgGrad.addColorStop(0, "rgba(30,30,60,0.4)");
      bgGrad.addColorStop(1, "rgba(10,10,26,0)");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      if (!analysis) return;

      var numCh = Math.min(analysis.numChannels, 4);

      // Energy-based center glow
      if (fd.cursor) {
        var e = analysis.energy[fd.cursor.timelineIndex] || 0;
        if (e > 0.05) {
          var eGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.3 * e);
          eGrad.addColorStop(0, "rgba(255,255,255," + (e * 0.1) + ")");
          eGrad.addColorStop(1, "rgba(255,255,255,0)");
          ctx.fillStyle = eGrad;
          ctx.fillRect(0, 0, w, h);
        }
      }

      // Draw rings from outermost to innermost
      for (var ch = numCh - 1; ch >= 0; ch--) {
        var ringR = maxR * (0.3 + (ch / numCh) * 0.7);
        var colors = RING_COLORS[ch % RING_COLORS.length];

        // Update rotation
        rotations[ch] += ROT_SPEEDS[ch] * dt;

        // Pulse decay
        pulses[ch] *= 0.92;

        // Check for active note
        var note = fd.currentNotes ? fd.currentNotes[ch] : null;
        if (note) {
          pulses[ch] = Math.max(pulses[ch], note.vol);
          // Add trail point
          trails[ch].push({
            angle: rotations[ch] + note.normalized * Math.PI * 2,
            size: note.vol,
            life: 1
          });
          if (trails[ch].length > MAX_TRAIL) trails[ch].shift();
        }

        var pulsedR = ringR + pulses[ch] * 20;

        // Ring base circle
        ctx.beginPath();
        ctx.arc(cx, cy, pulsedR, 0, Math.PI * 2);
        ctx.strokeStyle = colors.main;
        ctx.globalAlpha = 0.2 + pulses[ch] * 0.3;
        ctx.lineWidth = 1.5 + pulses[ch] * 2;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Glow ring
        ctx.beginPath();
        ctx.arc(cx, cy, pulsedR, 0, Math.PI * 2);
        ctx.strokeStyle = colors.main;
        ctx.globalAlpha = pulses[ch] * 0.15;
        ctx.lineWidth = 8 + pulses[ch] * 12;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Active note arc
        if (note) {
          var arcStart = rotations[ch];
          var arcLen = 0.3 + note.normalized * 1.2;
          ctx.beginPath();
          ctx.arc(cx, cy, pulsedR, arcStart, arcStart + arcLen);
          ctx.strokeStyle = colors.arc;
          ctx.lineWidth = 4 + note.vol * 6;
          ctx.globalAlpha = 0.7 + note.vol * 0.3;
          ctx.stroke();
          ctx.globalAlpha = 1;

          // Note dot at arc end
          var dotAngle = arcStart + arcLen;
          var dotX = cx + Math.cos(dotAngle) * pulsedR;
          var dotY = cy + Math.sin(dotAngle) * pulsedR;
          ctx.beginPath();
          ctx.arc(dotX, dotY, 3 + note.vol * 4, 0, Math.PI * 2);
          ctx.fillStyle = colors.main;
          ctx.fill();
        }

        // Trail dots
        for (var ti = trails[ch].length - 1; ti >= 0; ti--) {
          var t = trails[ch][ti];
          t.life -= dt * 1.5;
          if (t.life <= 0) {
            trails[ch].splice(ti, 1);
            continue;
          }
          var tAngle = t.angle;
          var tX = cx + Math.cos(tAngle) * pulsedR;
          var tY = cy + Math.sin(tAngle) * pulsedR;
          ctx.beginPath();
          ctx.arc(tX, tY, 2 * t.life * t.size, 0, Math.PI * 2);
          ctx.fillStyle = colors.main;
          ctx.globalAlpha = t.life * 0.4;
          ctx.fill();
          ctx.globalAlpha = 1;
        }

        // Channel role label
        if (analysis.channelRoles[ch]) {
          var labelAngle = rotations[ch] + Math.PI * 1.5;
          var labelX = cx + Math.cos(labelAngle) * (pulsedR + 18);
          var labelY = cy + Math.sin(labelAngle) * (pulsedR + 18);
          ctx.fillStyle = colors.main;
          ctx.globalAlpha = 0.3;
          ctx.font = "10px monospace";
          ctx.textAlign = "center";
          ctx.fillText(analysis.channelRoles[ch].role, labelX, labelY);
          ctx.textAlign = "start";
          ctx.globalAlpha = 1;
        }
      }

      // Center dot
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.globalAlpha = 0.5;
      ctx.fill();
      ctx.globalAlpha = 1;

      // Beat pulse at center
      if (fd.cursor) {
        var beatFrac = (fd.cursor.totalFracRow % analysis.rpb) / analysis.rpb;
        if (beatFrac < 0.15) {
          var beatAlpha = (1 - beatFrac / 0.15) * 0.3;
          ctx.beginPath();
          ctx.arc(cx, cy, 15 + (1 - beatFrac / 0.15) * 30, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(255,255,255," + beatAlpha + ")";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      // Song info
      if (fd.cursor) {
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.font = "11px monospace";
        ctx.textAlign = "center";
        var mins = Math.floor(fd.cursor.elapsed / 60);
        var secs = Math.floor(fd.cursor.elapsed % 60);
        ctx.fillText(
          (mins < 10 ? "0" : "") + mins + ":" + (secs < 10 ? "0" : "") + secs,
          cx, h - 16
        );
        ctx.textAlign = "start";
      }
    },

    destroy: function () {
      analysis = null;
      rotations = [0, 0, 0, 0];
      pulses = [0, 0, 0, 0];
      trails = [[], [], [], []];
    }
  };
})();
