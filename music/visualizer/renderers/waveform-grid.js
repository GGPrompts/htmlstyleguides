/**
 * Waveform Grid Renderer
 * 4 horizontal lanes (one per channel), scrolling note blocks colored by instrument,
 * vertical playhead, beat flashes.
 */
window.Renderers["waveform-grid"] = (function () {
  "use strict";

  var w = 0, h = 0;
  var analysis = null;

  // How many rows visible in the scroll window
  var VISIBLE_ROWS = 64;

  // Channel colors
  var CH_COLORS = [
    { bg: "rgba(255,107,107,0.15)", note: "#ff6b6b", border: "#ff4757" },
    { bg: "rgba(72,219,251,0.15)",  note: "#48dbfb", border: "#0abde3" },
    { bg: "rgba(29,209,161,0.15)",  note: "#1dd1a1", border: "#2ed573" },
    { bg: "rgba(164,176,190,0.15)", note: "#a4b0be", border: "#636e72" }
  ];

  // Instrument → hue offsets
  var INST_HUES = [
    "#ff6b6b", "#ffa502", "#1dd1a1", "#48dbfb",
    "#a55eea", "#ff9ff3", "#f7b731", "#2ed573",
    "#5f27cd", "#ee5a24", "#0abde3", "#636e72"
  ];

  function instColor(idx) {
    return INST_HUES[idx % INST_HUES.length];
  }

  return {
    name: "Waveform Grid",

    init: function (ctx, width, height, a) {
      w = width;
      h = height;
      analysis = a;
    },

    resize: function (width, height) {
      w = width;
      h = height;
    },

    render: function (fd) {
      var ctx = fd.ctx;
      w = fd.width;
      h = fd.height;

      // Background
      ctx.fillStyle = "#0d1117";
      ctx.fillRect(0, 0, w, h);

      if (!fd.cursor || !analysis) {
        // Idle state
        ctx.fillStyle = "rgba(255,255,255,0.1)";
        ctx.font = "14px monospace";
        ctx.textAlign = "center";
        ctx.fillText("Press play to visualize", w / 2, h / 2);
        ctx.textAlign = "start";
        return;
      }

      var numCh = analysis.numChannels;
      var footerH = 28;
      var laneH = (h - footerH) / numCh;

      // Current position in timeline
      var currentRow = fd.cursor.totalFracRow;
      var startRow = currentRow - VISIBLE_ROWS * 0.3;
      var endRow = startRow + VISIBLE_ROWS;
      var rowW = w / VISIBLE_ROWS;

      // Draw each channel lane
      for (var ch = 0; ch < numCh; ch++) {
        var laneY = ch * laneH;
        var colors = CH_COLORS[ch % CH_COLORS.length];

        // Lane background
        ctx.fillStyle = colors.bg;
        ctx.fillRect(0, laneY, w, laneH);

        // Lane divider
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, laneY);
        ctx.lineTo(w, laneY);
        ctx.stroke();

        // Channel label
        if (analysis.channelRoles[ch]) {
          ctx.fillStyle = "rgba(255,255,255,0.2)";
          ctx.font = "10px monospace";
          ctx.fillText(analysis.channelRoles[ch].role.toUpperCase(), 6, laneY + 14);
        }

        // Draw note blocks in visible range
        var rowStart = Math.max(0, Math.floor(startRow));
        var rowEnd = Math.min(analysis.timeline.length - 1, Math.ceil(endRow));

        for (var r = rowStart; r <= rowEnd; r++) {
          var note = analysis.timeline[r] ? analysis.timeline[r][ch] : null;
          if (!note) continue;

          var x = (r - startRow) * rowW;
          // Note block height based on pitch within song's range
          var norm = (note.midi - analysis.pitchRange.min) / analysis.pitchRange.span;
          var noteH = 8 + norm * (laneH - 20);
          var noteY = laneY + (laneH - noteH) / 2;

          // Color by instrument
          ctx.fillStyle = instColor(note.instrument);
          ctx.globalAlpha = 0.7 + note.vol * 0.3;
          ctx.fillRect(x, noteY, Math.max(rowW - 1, 2), noteH);

          // Bright top edge
          ctx.fillStyle = "#fff";
          ctx.globalAlpha = 0.15;
          ctx.fillRect(x, noteY, Math.max(rowW - 1, 2), 1);
          ctx.globalAlpha = 1;
        }
      }

      // Playhead (vertical line at 30% from left)
      var playheadX = w * 0.3;
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, h - footerH);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Playhead glow
      var phGrad = ctx.createLinearGradient(playheadX - 20, 0, playheadX + 20, 0);
      phGrad.addColorStop(0, "rgba(255,255,255,0)");
      phGrad.addColorStop(0.5, "rgba(255,255,255,0.05)");
      phGrad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = phGrad;
      ctx.fillRect(playheadX - 20, 0, 40, h - footerH);

      // Beat flash overlay
      var beatFrac = (fd.cursor.totalFracRow % analysis.rpb) / analysis.rpb;
      if (beatFrac < 0.08) {
        var flashAlpha = (1 - beatFrac / 0.08) * 0.05;
        ctx.fillStyle = "rgba(255,255,255," + flashAlpha + ")";
        ctx.fillRect(0, 0, w, h - footerH);
      }

      // Beat markers
      var beatRowSpacing = analysis.rpb;
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      for (var br = Math.floor(startRow / beatRowSpacing) * beatRowSpacing; br < endRow; br += beatRowSpacing) {
        var bx = (br - startRow) * rowW;
        if (bx < 0 || bx > w) continue;
        ctx.beginPath();
        ctx.moveTo(bx, 0);
        ctx.lineTo(bx, h - footerH);
        ctx.stroke();
      }

      // Footer bar with song info
      var footerY = h - footerH;
      ctx.fillStyle = "#161b22";
      ctx.fillRect(0, footerY, w, footerH);
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.beginPath();
      ctx.moveTo(0, footerY);
      ctx.lineTo(w, footerY);
      ctx.stroke();

      ctx.font = "bold 11px monospace";
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      var songTitle = fd.song ? (fd.song.title || "") : "";
      ctx.fillText(songTitle, 12, footerY + 18);

      var elapsed = fd.cursor.elapsed;
      var mins = Math.floor(elapsed / 60);
      var secs = Math.floor(elapsed % 60);
      var timeStr = (mins < 10 ? "0" : "") + mins + ":" + (secs < 10 ? "0" : "") + secs;
      ctx.textAlign = "right";
      ctx.fillText(timeStr + "  BPM:" + (fd.song ? fd.song.bpm : "?"), w - 12, footerY + 18);
      ctx.textAlign = "start";
    },

    destroy: function () {
      analysis = null;
    }
  };
})();
