/**
 * SheetMusic — scrolling grand-staff renderer for the Cathedral Organ.
 *
 * Renders tracker song data as standard notation on a canvas that scrolls
 * right-to-left during playback. Notes are colored by channel.
 *
 * Usage:
 *   SheetMusic.init(canvasEl)
 *   SheetMusic.loadSong(song)        // Tracker song object
 *   SheetMusic.onRow(row, seqRow)    // call from Tracker.setOnRowChange
 *   SheetMusic.stop()
 *   SheetMusic.setVisible(bool)
 */
var SheetMusic = (function () {
  'use strict';

  // ── Configuration ──

  var CHANNEL_COLORS = [
    '#b8954a',  // ch0 gold
    '#c06080',  // ch1 rose
    '#9b7ab8',  // ch2 purple
    '#cccccc'   // ch3 white/silver
  ];
  var CHANNEL_COLORS_DIM = [
    'rgba(184,149,74,0.2)',
    'rgba(192,96,128,0.2)',
    'rgba(155,122,184,0.2)',
    'rgba(204,204,204,0.2)'
  ];
  var CHANNEL_COLORS_MED = [
    'rgba(184,149,74,0.6)',
    'rgba(192,96,128,0.6)',
    'rgba(155,122,184,0.6)',
    'rgba(204,204,204,0.6)'
  ];

  var STAFF_LINE_COLOR = 'rgba(216,207,192,0.3)';
  var CURSOR_COLOR = 'rgba(184,149,74,0.6)';
  var LEDGER_COLOR = 'rgba(216,207,192,0.2)';
  var BG_COLOR = '#110e18';

  // Layout
  var LINE_SPACING = 10;        // pixels between adjacent staff lines
  var STAFF_GAP = 60;           // gap between treble and bass staves
  var NOTE_HEAD_RX = 6;         // notehead horizontal radius
  var NOTE_HEAD_RY = 4.5;       // notehead vertical radius
  var CURSOR_X_FRAC = 0.15;    // cursor at 15% from left
  var PIXELS_PER_ROW = 40;     // horizontal spacing per tracker row
  var SCROLL_MARGIN = 80;      // left/right margin

  // ── State ──

  var canvas, ctx;
  var visible = false;
  var timeline = [];            // [{row, midi, channel, duration, staffY}]
  var songData = null;
  var totalRows = 0;
  var currentRowFrac = 0;       // fractional row position for smooth scroll
  var targetRow = 0;
  var targetRowTime = 0;        // performance.now() when targetRow was set
  var animId = null;
  var playing = false;
  var bpm = 120;
  var rowsPerBeat = 4;
  var seqRowOffsets = [];        // seq row -> absolute row offset
  var maxNoteDurationRows = 1;
  var trackerPollMs = 40;
  var lastTrackerPollTime = 0;
  var lastTrackerAbsRow = null;

  // Computed layout
  var staffTop = 0;             // y of top treble staff line
  var trebleBottom = 0;         // y of bottom treble staff line
  var bassTop = 0;              // y of top bass staff line
  var bassBottom = 0;           // y of bottom bass staff line
  var cursorX = 0;
  var canvasW = 0;
  var canvasH = 0;
  var dpr = 1;

  // ── Note → staff position mapping ──
  // Staff position 0 = middle C (C4, MIDI 60)
  // Each +1 = one diatonic step up; -1 = one step down
  // Treble staff bottom line (E4) = position +2
  // Bass staff top line (A3) = position -2

  // MIDI note → {pos: diatonic position from middle C, accidental: 0|1|-1}
  // C=0, D=1, E=2, F=3, G=4, A=5, B=6 within octave
  var DIATONIC_MAP = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6]; // semitone→diatonic
  var IS_SHARP =     [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0]; // semitone→sharp?

  function midiToStaffPos(midi) {
    var octave = Math.floor(midi / 12) - 1; // MIDI octave (C4=60 → octave 4)
    var semitone = midi % 12;
    var diatonic = DIATONIC_MAP[semitone];
    var sharp = IS_SHARP[semitone];
    // Position relative to C4 (middle C = 0)
    var pos = (octave - 4) * 7 + diatonic;
    return { pos: pos, sharp: sharp };
  }

  function staffPosToY(pos) {
    // The two staves are visually separated by STAFF_GAP, so we need
    // separate mappings for treble and bass regions.
    //
    // Treble: bottom line = E4 (pos 2) at y=trebleBottom, top = F5 (pos 10) at y=staffTop
    // Bass:   top line = A3 (pos -2) at y=bassTop, bottom = G2 (pos -10) at y=bassBottom
    //
    // Notes at pos >= 0 are drawn in the treble region (middle C gets a ledger line below).
    // Notes at pos < 0 are drawn in the bass region.

    if (pos >= 0) {
      // Treble region
      return trebleBottom - (pos - 2) * (LINE_SPACING / 2);
    } else {
      // Bass region
      return bassTop - (pos + 2) * (LINE_SPACING / 2);
    }
  }

  // ── Build timeline from song data ──

  function buildTimeline(song) {
    timeline = [];
    seqRowOffsets = [];
    maxNoteDurationRows = 1;
    if (!song || !song.patterns || !song.sequence) return;

    var patById = {};
    for (var pi = 0; pi < song.patterns.length; pi++) {
      var pRef = song.patterns[pi];
      patById[pRef.id] = pRef;
    }

    function rowsUntilNextControlEvent(seqIndex, channel) {
      var dist = 0;
      for (var s2 = seqIndex + 1; s2 < song.sequence.length; s2++) {
        var seq2 = song.sequence[s2];
        if (!seq2) continue;
        var pat2 = patById[seq2[channel]];
        if (!pat2) continue;
        for (var r2 = 0; r2 < pat2.length; r2++) {
          var c2 = pat2.channels[channel][r2];
          if (c2 && c2.note !== null) return dist + r2;
        }
        dist += pat2.length;
      }
      return null;
    }

    totalRows = 0;
    var rowOffset = 0;

    for (var si = 0; si < song.sequence.length; si++) {
      seqRowOffsets[si] = rowOffset;
      var seq = song.sequence[si];
      // Determine pattern length from first channel
      var firstPatId = seq[0];
      var firstPat = patById[firstPatId] || null;
      var patLen = firstPat ? firstPat.length : 16;

      for (var ch = 0; ch < 4; ch++) {
        var patId = seq[ch];
        var pat = patById[patId] || null;
        if (!pat) continue;

        // Walk through rows to find note-on events and compute durations
        var noteStart = -1;
        var noteMidi = 0;
        var noteDurHint = 0;

        for (var r = 0; r < pat.length; r++) {
          var cell = pat.channels[ch][r];
          if (!cell) continue;

          if (cell.note !== null && cell.note > 0) {
            // Skip noise instruments — they have no meaningful pitch
            var inst = song.instruments[cell.inst] || song.instruments[0];
            if (inst.wave === 'noise') {
              if (noteStart >= 0) {
                pushNote(noteStart + rowOffset, noteMidi, ch, r - noteStart);
                noteStart = -1;
                noteDurHint = 0;
              }
              continue;
            }
            // If there was a previous note, end it
            if (noteStart >= 0) {
              pushNote(noteStart + rowOffset, noteMidi, ch, r - noteStart);
            }
            noteStart = r;
            noteMidi = cell.note;
            noteDurHint = (typeof cell._dur === 'number' && cell._dur > 0) ? cell._dur : 0;
          } else if (cell.note === -1) {
            // Note-off
            if (noteStart >= 0) {
              pushNote(noteStart + rowOffset, noteMidi, ch, r - noteStart);
              noteStart = -1;
              noteDurHint = 0;
            }
          }
        }
        // If note still active at pattern end, close it
        if (noteStart >= 0) {
          var dur = pat.length - noteStart;

          // Event-format durations can intentionally sustain past a pattern
          // boundary. Reflect that in notation unless a future event would
          // cut the note sooner.
          if (noteDurHint > dur) {
            var extraWanted = noteDurHint - dur;
            var rowsToNextControl = rowsUntilNextControlEvent(si, ch);
            if (rowsToNextControl !== null) {
              extraWanted = Math.min(extraWanted, rowsToNextControl);
            }
            if (extraWanted > 0) dur += extraWanted;
          }

          pushNote(noteStart + rowOffset, noteMidi, ch, dur);
        }
      }

      rowOffset += patLen;
    }

    totalRows = rowOffset;

    // Sort by row for efficient rendering
    timeline.sort(function (a, b) { return a.row - b.row; });
  }

  function pushNote(row, midi, channel, duration) {
    var clampedDuration = Math.max(duration, 1);
    var sp = midiToStaffPos(midi);
    if (clampedDuration > maxNoteDurationRows) {
      maxNoteDurationRows = clampedDuration;
    }
    timeline.push({
      row: row,
      midi: midi,
      channel: channel,
      duration: clampedDuration,
      staffPos: sp.pos,
      sharp: sp.sharp,
      y: 0  // computed at render time after layout
    });
  }

  function absoluteRow(row, seqRow) {
    if (!songData || !songData.sequence) return row || 0;
    if (typeof seqRow !== 'number' || seqRow < 0) seqRow = 0;
    if (seqRow >= seqRowOffsets.length) seqRow = seqRowOffsets.length - 1;
    var base = seqRow >= 0 ? seqRowOffsets[seqRow] : 0;
    return base + (row || 0);
  }

  function setTargetRow(absRow, nowMs) {
    targetRow = absRow;
    targetRowTime = nowMs || performance.now();
    playing = true;
    lastTrackerAbsRow = absRow;
  }

  function findFirstTimelineIndex(rowThreshold) {
    var lo = 0;
    var hi = timeline.length;
    while (lo < hi) {
      var mid = (lo + hi) >> 1;
      if (timeline[mid].row < rowThreshold) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }
    return lo;
  }

  function pollTracker(nowMs) {
    if (!songData || !window.Tracker) {
      return;
    }
    var tracker = window.Tracker;
    if (!tracker.isPlaying) return;
    if (!tracker.isPlaying()) {
      playing = false;
      return;
    }
    if (nowMs - lastTrackerPollTime < trackerPollMs) {
      return;
    }
    lastTrackerPollTime = nowMs;

    if (!tracker.getCurrentRow || !tracker.getCurrentSequenceRow) {
      return;
    }
    var row = tracker.getCurrentRow();
    var seqRow = tracker.getCurrentSequenceRow();
    if (typeof row !== 'number' || typeof seqRow !== 'number') {
      return;
    }
    var absRow = absoluteRow(row, seqRow);
    if (absRow !== lastTrackerAbsRow) {
      setTargetRow(absRow, nowMs);
    }
  }

  // ── Layout computation ──

  function computeLayout() {
    dpr = window.devicePixelRatio || 1;
    var rect = canvas.getBoundingClientRect();
    canvasW = rect.width;
    canvasH = rect.height;
    canvas.width = canvasW * dpr;
    canvas.height = canvasH * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Center the grand staff vertically
    var totalStaffH = LINE_SPACING * 4 * 2 + STAFF_GAP; // 2 staves + gap
    staffTop = (canvasH - totalStaffH) / 2;
    trebleBottom = staffTop + LINE_SPACING * 4;
    bassTop = trebleBottom + STAFF_GAP;
    bassBottom = bassTop + LINE_SPACING * 4;

    cursorX = SCROLL_MARGIN + (canvasW - SCROLL_MARGIN * 2) * CURSOR_X_FRAC;
  }

  // ── Rendering ──

  function render() {
    if (!visible || !ctx) return;

    ctx.clearRect(0, 0, canvasW, canvasH);

    // Background
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, canvasW, canvasH);

    drawStaves();
    drawClefs();
    drawNotes();
    drawCursor();
    drawBarLines();
  }

  function drawStaves() {
    ctx.strokeStyle = STAFF_LINE_COLOR;
    ctx.lineWidth = 1;

    // Treble staff (5 lines)
    for (var i = 0; i < 5; i++) {
      var y = staffTop + i * LINE_SPACING;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasW, y);
      ctx.stroke();
    }

    // Bass staff (5 lines)
    for (var j = 0; j < 5; j++) {
      var y2 = bassTop + j * LINE_SPACING;
      ctx.beginPath();
      ctx.moveTo(0, y2);
      ctx.lineTo(canvasW, y2);
      ctx.stroke();
    }

    // Brace / bracket hint (thin vertical line on left)
    ctx.strokeStyle = 'rgba(216,207,192,0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(SCROLL_MARGIN - 20, staffTop);
    ctx.lineTo(SCROLL_MARGIN - 20, bassBottom);
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  function drawClefs() {
    ctx.fillStyle = 'rgba(216,207,192,0.45)';

    // Treble clef — draw a stylized G-clef shape
    drawTrebleClef(SCROLL_MARGIN - 8, staffTop + LINE_SPACING * 2);

    // Bass clef — draw a stylized F-clef shape
    drawBassClef(SCROLL_MARGIN - 8, bassTop + LINE_SPACING);
  }

  function drawTrebleClef(cx, cy) {
    // Simplified treble clef using canvas paths
    ctx.save();
    ctx.strokeStyle = 'rgba(216,207,192,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Main curve
    ctx.moveTo(cx + 2, cy + LINE_SPACING * 2.5);
    ctx.bezierCurveTo(cx - 8, cy + LINE_SPACING * 1.5, cx - 8, cy - LINE_SPACING, cx + 2, cy - LINE_SPACING * 0.5);
    ctx.bezierCurveTo(cx + 10, cy, cx + 10, cy + LINE_SPACING * 1.2, cx, cy + LINE_SPACING * 1.5);
    ctx.bezierCurveTo(cx - 6, cy + LINE_SPACING * 1.8, cx - 4, cy + LINE_SPACING * 2.2, cx + 2, cy + LINE_SPACING * 2.5);
    ctx.stroke();
    // Vertical stem
    ctx.beginPath();
    ctx.moveTo(cx + 2, cy - LINE_SPACING * 2);
    ctx.lineTo(cx + 2, cy + LINE_SPACING * 2.5);
    ctx.stroke();
    // Small circle at bottom
    ctx.beginPath();
    ctx.arc(cx + 2, cy + LINE_SPACING * 2.8, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawBassClef(cx, cy) {
    ctx.save();
    ctx.strokeStyle = 'rgba(216,207,192,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Main curve
    ctx.arc(cx, cy, LINE_SPACING * 1.2, -Math.PI * 0.8, Math.PI * 0.4);
    ctx.stroke();
    // Dot at origin
    ctx.beginPath();
    ctx.arc(cx + 2, cy - LINE_SPACING * 0.3, 3, 0, Math.PI * 2);
    ctx.fill();
    // Two dots
    ctx.beginPath();
    ctx.arc(cx + LINE_SPACING * 1.5, cy - LINE_SPACING * 0.5, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + LINE_SPACING * 1.5, cy + LINE_SPACING * 0.5, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawCursor() {
    // Vertical playhead line
    ctx.strokeStyle = CURSOR_COLOR;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cursorX, staffTop - 15);
    ctx.lineTo(cursorX, bassBottom + 15);
    ctx.stroke();
    ctx.lineWidth = 1;

    // Subtle glow
    var grad = ctx.createLinearGradient(cursorX - 20, 0, cursorX + 20, 0);
    grad.addColorStop(0, 'rgba(184,149,74,0)');
    grad.addColorStop(0.5, 'rgba(184,149,74,0.06)');
    grad.addColorStop(1, 'rgba(184,149,74,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(cursorX - 20, staffTop - 15, 40, bassBottom - staffTop + 30);
  }

  function drawBarLines() {
    if (!songData || totalRows === 0) return;
    var rpb = songData.rowsPerBeat || 4;
    var beatsPerBar = 4; // assume 4/4
    var rowsPerBar = rpb * beatsPerBar;

    ctx.strokeStyle = 'rgba(216,207,192,0.12)';
    ctx.lineWidth = 1;

    for (var bar = 0; bar <= Math.ceil(totalRows / rowsPerBar); bar++) {
      var barRow = bar * rowsPerBar;
      var x = cursorX + (barRow - currentRowFrac) * PIXELS_PER_ROW;
      if (x < -10 || x > canvasW + 10) continue;

      ctx.beginPath();
      ctx.moveTo(x, staffTop);
      ctx.lineTo(x, trebleBottom);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, bassTop);
      ctx.lineTo(x, bassBottom);
      ctx.stroke();
    }
  }

  function drawNotes() {
    if (timeline.length === 0) return;

    // Visible range in rows
    var leftRow = currentRowFrac - (cursorX + SCROLL_MARGIN) / PIXELS_PER_ROW;
    var rightRow = currentRowFrac + (canvasW - cursorX + SCROLL_MARGIN) / PIXELS_PER_ROW;
    var startRow = leftRow - maxNoteDurationRows;
    var startIdx = findFirstTimelineIndex(startRow);

    for (var i = startIdx; i < timeline.length; i++) {
      var note = timeline[i];
      // Quick bounds check
      var noteEnd = note.row + note.duration;
      if (noteEnd < leftRow) continue;
      if (note.row > rightRow) break; // sorted by row, can stop early

      var x = cursorX + (note.row - currentRowFrac) * PIXELS_PER_ROW;
      var y = staffPosToY(note.staffPos);

      // Determine if this note is at or past the cursor (already played)
      var pastCursor = note.row < currentRowFrac;
      var atCursor = note.row <= currentRowFrac && noteEnd > currentRowFrac;

      // Draw note duration as a horizontal line/beam
      var noteW = note.duration * PIXELS_PER_ROW;
      var dimColor = CHANNEL_COLORS_DIM[note.channel];
      var medColor = CHANNEL_COLORS_MED[note.channel];
      var brightColor = CHANNEL_COLORS[note.channel];
      var noteColor = atCursor ? brightColor : (pastCursor ? dimColor : medColor);

      // Duration beam
      ctx.fillStyle = noteColor;
      var beamH = 4;
      var beamW = Math.max(1, noteW - NOTE_HEAD_RX);
      ctx.fillRect(x + NOTE_HEAD_RX, y - beamH / 2, beamW, beamH);

      // Draw ledger lines if needed
      drawLedgerLines(x, y, note.staffPos);

      // Draw accidental (sharp)
      if (note.sharp) {
        ctx.fillStyle = noteColor;
        ctx.font = '14px serif';
        ctx.fillText('#', x - NOTE_HEAD_RX - 12, y + 5);
      }

      // Notehead (filled ellipse)
      ctx.fillStyle = noteColor;
      ctx.beginPath();
      ctx.ellipse(x, y, NOTE_HEAD_RX, NOTE_HEAD_RY, -0.2, 0, Math.PI * 2);
      ctx.fill();

      // Glow on active notes
      if (atCursor) {
        ctx.shadowColor = brightColor;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.ellipse(x, y, NOTE_HEAD_RX, NOTE_HEAD_RY, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
      }

      // Stem
      var stemH = LINE_SPACING * 3.5;
      ctx.strokeStyle = noteColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (note.staffPos >= 0) {
        // Above middle C: stem down (right side, going down)
        ctx.moveTo(x + NOTE_HEAD_RX - 1, y);
        ctx.lineTo(x + NOTE_HEAD_RX - 1, y + stemH);
      } else {
        // Below middle C: stem up (right side, going up)
        ctx.moveTo(x + NOTE_HEAD_RX - 1, y);
        ctx.lineTo(x + NOTE_HEAD_RX - 1, y - stemH);
      }
      ctx.stroke();
      ctx.lineWidth = 1;
    }
  }

  function drawLedgerLines(x, y, staffPos) {
    ctx.strokeStyle = LEDGER_COLOR;
    ctx.lineWidth = 1;
    var lw = NOTE_HEAD_RX * 2 + 8;

    if (staffPos >= 0) {
      // Treble region — staff lines at 2,4,6,8,10
      // Ledger lines below staff (pos 0 = middle C, and below if needed)
      if (staffPos <= 0) {
        for (var p = 0; p >= staffPos; p -= 2) {
          drawOneLedger(x, staffPosToY(p), lw);
        }
      }
      // Ledger lines above staff (pos 12, 14, ...)
      if (staffPos >= 12) {
        for (var p2 = 12; p2 <= staffPos; p2 += 2) {
          drawOneLedger(x, staffPosToY(p2), lw);
        }
      }
    } else {
      // Bass region — staff lines at -2,-4,-6,-8,-10
      // Ledger lines above staff (pos 0 = middle C if drawn in bass region)
      if (staffPos >= 0) {
        for (var p3 = 0; p3 <= staffPos; p3 += 2) {
          drawOneLedger(x, staffPosToY(p3), lw);
        }
      }
      // Ledger lines below staff (pos -12, -14, ...)
      if (staffPos <= -12) {
        for (var p4 = -12; p4 >= staffPos; p4 -= 2) {
          drawOneLedger(x, staffPosToY(p4), lw);
        }
      }
    }
  }

  function drawOneLedger(x, ly, lw) {
    ctx.beginPath();
    ctx.moveTo(x - lw / 2, ly);
    ctx.lineTo(x + lw / 2, ly);
    ctx.stroke();
  }

  // ── Animation loop ──

  function tick() {
    if (!visible) return;

    var now = performance.now();
    pollTracker(now);

    if (playing) {
      // Extrapolate position forward from last known row at playback speed
      var rowsPerSec = (bpm / 60) * rowsPerBeat;
      var elapsed = (now - targetRowTime) / 1000;
      if (elapsed < 0) elapsed = 0;
      currentRowFrac = targetRow + elapsed * rowsPerSec;
    }

    render();
    animId = requestAnimationFrame(tick);
  }

  function startAnimation() {
    if (animId) return;
    animId = requestAnimationFrame(tick);
  }

  function stopAnimation() {
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }
  }

  // ── Public API ──

  function init(canvasEl) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    computeLayout();

    window.addEventListener('resize', function () {
      if (visible) {
        computeLayout();
        render();
      }
    });
  }

  function loadSong(song) {
    songData = song;
    bpm = song.bpm || 120;
    rowsPerBeat = song.rowsPerBeat || 4;
    buildTimeline(song);
    currentRowFrac = -2; // start slightly before beginning
    targetRow = -2;
    targetRowTime = performance.now();
    lastTrackerAbsRow = null;
    lastTrackerPollTime = 0;
    playing = false;
    if (visible) render();
  }

  function onRow(row, seqRow) {
    if (!songData) return;
    setTargetRow(absoluteRow(row, seqRow), performance.now());
  }

  function stop() {
    playing = false;
    currentRowFrac = -2;
    targetRow = -2;
    targetRowTime = performance.now();
    lastTrackerAbsRow = null;
    lastTrackerPollTime = 0;
    if (visible) render();
  }

  function setVisible(show) {
    visible = show;
    if (show) {
      computeLayout();
      startAnimation();
      render();
    } else {
      stopAnimation();
    }
  }

  function isVisible() {
    return visible;
  }

  return {
    init: init,
    loadSong: loadSong,
    onRow: onRow,
    stop: stop,
    setVisible: setVisible,
    isVisible: isVisible
  };
})();
