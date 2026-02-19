/**
 * Visualizer Engine — Canvas music visualizer synced to ChipPlayer.
 * IIFE exposing window.Visualizer.
 *
 * Responsibilities:
 *  - AudioContext creation, shared with ChipPlayer via initExternal()
 *  - Song loading + pre-analysis (pitch range, energy, sections, timeline)
 *  - Deterministic song cursor mirroring ChipPlayer's row timing
 *  - DPR-aware canvas management
 *  - Renderer dispatch (pluggable render() calls each frame)
 */
window.Visualizer = (function () {
  "use strict";

  // ---- State ----
  var ctx = null;          // AudioContext
  var masterGain = null;
  var canvas = null;
  var canvasCtx = null;
  var dpr = 1;
  var cssW = 0, cssH = 0;

  var song = null;
  var analysis = null;
  var activeRenderer = null;
  var rendererName = null;

  var playing = false;
  var startTime = 0;       // AudioContext time when play() was called
  var rafID = null;
  var lastFrameTime = 0;

  // ---- Helpers ----

  function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  /**
   * Normalize song JSON to compact format (same logic as ChipPlayer.load).
   * Returns a shallow copy so the original stays untouched.
   */
  /**
   * Normalize song JSON to a consistent internal format for analysis.
   * Handles two source formats:
   *   1. Tracker-native: positional arrays of {note, inst, vol, fx} per row
   *   2. Compact event: sparse arrays of {r, n, i} with explicit row index
   * Both get converted to dense arrays: pat.ch[channel][row] = [midi, instIdx] | null
   */
  function normalizeSong(raw) {
    var s = JSON.parse(JSON.stringify(raw));
    // rpb alias
    if (!s.rpb && s.rowsPerBeat) s.rpb = s.rowsPerBeat;
    if (!s.rpb) s.rpb = 4;

    if (s.sequence && !s.seq) {
      s.seq = s.sequence;
    }

    // Normalize instruments: tracker-native uses long names, ChipPlayer expects short
    if (s.instruments) {
      for (var i = 0; i < s.instruments.length; i++) {
        var inst = s.instruments[i];
        if (inst.attack !== undefined && inst.a === undefined) inst.a = inst.attack;
        if (inst.decay !== undefined && inst.d === undefined) inst.d = inst.decay;
        if (inst.sustain !== undefined && inst.s === undefined) inst.s = inst.sustain;
        if (inst.release !== undefined && inst.r === undefined) inst.r = inst.release;
        if (inst.volume !== undefined && inst.vol === undefined) inst.vol = inst.volume;
      }
    }

    for (var p = 0; p < s.patterns.length; p++) {
      var pat = s.patterns[p];
      // Normalize length field
      if (!pat.len && pat.length) pat.len = pat.length;
      if (!pat.len) pat.len = 16;
      if (pat.channels && !pat.ch) {
        pat.ch = [];
        for (var c = 0; c < pat.channels.length; c++) {
          var dense = new Array(pat.len);
          for (var r = 0; r < pat.len; r++) dense[r] = null;
          var events = pat.channels[c];
          for (var e = 0; e < events.length; e++) {
            var ev = events[e];
            if (!ev) continue;
            if (ev.n != null && ev.r != null) {
              // Compact event format: {r: row, n: note, i: instrument}
              if (ev.n > 0 && ev.r < pat.len) {
                dense[ev.r] = [ev.n, ev.i != null ? ev.i : 0];
              }
            } else if (ev.note != null) {
              // Tracker-native format: positional, index e IS the row
              dense[e] = [ev.note, ev.inst != null ? ev.inst : 0];
            }
          }
          pat.ch.push(dense);
        }
      }
    }
    return s;
  }

  /**
   * Build a song object in the exact format ChipPlayer expects:
   * - seq[] array, bpm, rpb
   * - instruments with short keys (a, d, s, r, vol, wave, etc.)
   * - patterns with len and ch[channel][row] = [midi, instIdx] | null
   */
  function buildChipPlayerSong(raw) {
    var s = JSON.parse(JSON.stringify(raw));
    if (!s.rpb && s.rowsPerBeat) s.rpb = s.rowsPerBeat;
    if (!s.rpb) s.rpb = 4;
    if (s.sequence && !s.seq) s.seq = s.sequence;

    // Normalize instruments to short keys
    if (s.instruments) {
      for (var i = 0; i < s.instruments.length; i++) {
        var inst = s.instruments[i];
        if (inst.attack !== undefined && inst.a === undefined) inst.a = inst.attack;
        if (inst.decay !== undefined && inst.d === undefined) inst.d = inst.decay;
        if (inst.sustain !== undefined && inst.s === undefined) inst.s = inst.sustain;
        if (inst.release !== undefined && inst.r === undefined) inst.r = inst.release;
        if (inst.volume !== undefined && inst.vol === undefined) inst.vol = inst.volume;
      }
    }

    // Normalize patterns to ch[][] dense format
    for (var p = 0; p < s.patterns.length; p++) {
      var pat = s.patterns[p];
      if (!pat.len && pat.length) pat.len = pat.length;
      if (!pat.len) pat.len = 16;
      if (pat.channels && !pat.ch) {
        pat.ch = [];
        for (var c = 0; c < pat.channels.length; c++) {
          var dense = new Array(pat.len);
          for (var r = 0; r < pat.len; r++) dense[r] = null;
          var events = pat.channels[c];
          for (var e = 0; e < events.length; e++) {
            var ev = events[e];
            if (!ev) continue;
            if (ev.n != null && ev.r != null) {
              // Compact event: {r, n, i}
              if (ev.n > 0 && ev.r < pat.len) dense[ev.r] = [ev.n, ev.i != null ? ev.i : 0];
            } else if (ev.note != null) {
              // Tracker-native: positional
              dense[e] = [ev.note, ev.inst != null ? ev.inst : 0];
            }
          }
          pat.ch.push(dense);
        }
      }
    }
    return s;
  }

  // ---- Pre-analysis ----

  function analyzeSong(s) {
    var rpb = s.rpb || 4;
    var spr = 60 / (s.bpm * rpb);
    var numChannels = s.seq[0] ? s.seq[0].length : 4;

    var minMidi = 127, maxMidi = 0;
    var timeline = [];
    var energy = [];
    var sectionChanges = [0];
    var prevPatKey = null;

    // Channel role detection accumulators
    var chPitchSum = new Array(numChannels);
    var chNoteCount = new Array(numChannels);
    var chWaveTypes = [];
    for (var ci = 0; ci < numChannels; ci++) {
      chPitchSum[ci] = 0;
      chNoteCount[ci] = 0;
      chWaveTypes.push({});
    }

    var totalRows = 0;

    for (var si = 0; si < s.seq.length; si++) {
      var seqRow = s.seq[si];
      var patIdx = seqRow[0];
      var pat = s.patterns[patIdx];
      var patLen = pat ? pat.len || 16 : 16;

      // Section change detection
      var patKey = seqRow.join(",");
      if (patKey !== prevPatKey) {
        if (si > 0) sectionChanges.push(totalRows);
        prevPatKey = patKey;
      }

      for (var ri = 0; ri < patLen; ri++) {
        var rowNotes = [];
        var density = 0;
        var pitchSpread = 0;
        var rowPitches = [];

        for (var ch = 0; ch < numChannels; ch++) {
          var pIdx = seqRow[ch];
          var p = s.patterns[pIdx];
          var cell = (p && p.ch && p.ch[ch]) ? p.ch[ch][ri] : null;

          if (cell && cell[0] > 0) {
            var midi = cell[0];
            var instIdx = cell[1] || 0;
            var inst = s.instruments[instIdx] || s.instruments[0];
            if (midi < minMidi) minMidi = midi;
            if (midi > maxMidi) maxMidi = midi;
            chPitchSum[ch] += midi;
            chNoteCount[ch]++;
            if (inst && inst.wave) {
              chWaveTypes[ch][inst.wave] = (chWaveTypes[ch][inst.wave] || 0) + 1;
            }
            density++;
            rowPitches.push(midi);
            rowNotes.push({
              midi: midi,
              freq: midiToFreq(midi),
              instrument: instIdx,
              wave: inst ? inst.wave : "square",
              vol: inst ? (inst.volume != null ? inst.volume : inst.vol != null ? inst.vol : 0.8) : 0.8,
              channel: ch
            });
          } else {
            rowNotes.push(null);
          }
        }

        if (rowPitches.length > 1) {
          pitchSpread = Math.max.apply(null, rowPitches) - Math.min.apply(null, rowPitches);
        }

        timeline.push(rowNotes);
        // Energy: note density (0-1) + pitch spread contribution
        var e = Math.min(1, (density / numChannels) * 0.7 + (pitchSpread / 48) * 0.3);
        energy.push(e);
        totalRows++;
      }
    }

    if (minMidi > maxMidi) { minMidi = 48; maxMidi = 84; }

    // Channel roles
    var channelRoles = [];
    for (var ch2 = 0; ch2 < numChannels; ch2++) {
      var avgPitch = chNoteCount[ch2] > 0 ? chPitchSum[ch2] / chNoteCount[ch2] : 60;
      var dominantWave = "square";
      var maxCount = 0;
      for (var w in chWaveTypes[ch2]) {
        if (chWaveTypes[ch2][w] > maxCount) {
          maxCount = chWaveTypes[ch2][w];
          dominantWave = w;
        }
      }

      var role;
      if (dominantWave === "noise") {
        role = "percussion";
      } else if (avgPitch < 52) {
        role = "bass";
      } else if (avgPitch > 72) {
        role = "lead";
      } else {
        role = "harmony";
      }
      channelRoles.push({ role: role, avgPitch: avgPitch, wave: dominantWave });
    }
    // If no lead found, promote highest-pitched non-percussion channel
    var hasLead = channelRoles.some(function (cr) { return cr.role === "lead"; });
    if (!hasLead) {
      var bestCh = -1, bestPitch = -1;
      for (var ch3 = 0; ch3 < channelRoles.length; ch3++) {
        if (channelRoles[ch3].role !== "percussion" && channelRoles[ch3].avgPitch > bestPitch) {
          bestPitch = channelRoles[ch3].avgPitch;
          bestCh = ch3;
        }
      }
      if (bestCh >= 0) channelRoles[bestCh].role = "lead";
    }

    // Loop boundaries
    var loopEnd = s.loopEndSeq != null ? s.loopEndSeq : s.seq.length;
    var loopStart = s.loopStartSeq || 0;

    return {
      pitchRange: { min: minMidi, max: maxMidi, span: maxMidi - minMidi || 1 },
      channelRoles: channelRoles,
      timeline: timeline,
      energy: energy,
      sectionChanges: sectionChanges,
      totalRows: totalRows,
      secondsPerRow: spr,
      secondsPerBeat: 60 / s.bpm,
      totalDuration: totalRows * spr,
      numChannels: numChannels,
      rpb: rpb,
      loopStart: loopStart,
      loopEnd: loopEnd
    };
  }

  // ---- Canvas management ----

  function sizeCanvas() {
    if (!canvas) return;
    dpr = window.devicePixelRatio || 1;
    cssW = canvas.clientWidth;
    cssH = canvas.clientHeight;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    canvasCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (activeRenderer && activeRenderer.resize) {
      activeRenderer.resize(cssW, cssH);
    }
  }

  // ---- Cursor ----

  function getCursor(elapsed) {
    if (!song || !analysis) return null;
    var spr = analysis.secondsPerRow;
    var rpb = analysis.rpb;

    // Total fractional row from start
    var totalFracRow = elapsed / spr;

    // Walk through sequence to find position (handling variable pattern lengths)
    var rowsAccum = 0;
    var seqIdx = 0;
    var loopEnd = analysis.loopEnd;
    var loopStart = analysis.loopStart;
    var loopRows = 0;

    // Calculate rows in one full pass through the sequence
    var seqRowCounts = [];
    for (var si = 0; si < song.seq.length; si++) {
      var patIdx = song.seq[si][0];
      var pat = song.patterns[patIdx];
      var patLen = pat ? (pat.len || 16) : 16;
      seqRowCounts.push(patLen);
    }

    // Total rows in one play-through up to loopEnd
    var totalPlayRows = 0;
    for (var si2 = 0; si2 < loopEnd; si2++) {
      totalPlayRows += seqRowCounts[si2];
    }
    // Rows in loop section
    var loopSectionRows = 0;
    for (var si3 = loopStart; si3 < loopEnd; si3++) {
      loopSectionRows += seqRowCounts[si3];
    }

    var currentRow = totalFracRow;
    // If past the end of the sequence, loop
    if (currentRow >= totalPlayRows && loopSectionRows > 0) {
      var excess = currentRow - totalPlayRows;
      var preLoopRows = 0;
      for (var si4 = 0; si4 < loopStart; si4++) {
        preLoopRows += seqRowCounts[si4];
      }
      currentRow = preLoopRows + (excess % loopSectionRows);
    }

    var intRow = Math.floor(currentRow);
    var frac = currentRow - intRow;

    // Find which sequence index + row offset
    rowsAccum = 0;
    seqIdx = 0;
    var rowInPat = 0;
    for (var si5 = 0; si5 < song.seq.length; si5++) {
      if (rowsAccum + seqRowCounts[si5] > intRow) {
        seqIdx = si5;
        rowInPat = intRow - rowsAccum;
        break;
      }
      rowsAccum += seqRowCounts[si5];
    }

    // Timeline index (clamp to available data)
    var timelineIdx = Math.min(intRow, analysis.timeline.length - 1);
    if (timelineIdx < 0) timelineIdx = 0;

    var beat = Math.floor(currentRow / rpb);
    var bar = Math.floor(beat / 4);

    return {
      seqIndex: seqIdx,
      rowIndex: rowInPat,
      globalRow: intRow,
      fractionalRow: frac,
      totalFracRow: currentRow,
      beat: beat,
      bar: bar,
      elapsed: elapsed,
      timelineIndex: timelineIdx
    };
  }

  function getCurrentNotes(cursor) {
    if (!cursor || !analysis) return [null, null, null, null];
    var row = analysis.timeline[cursor.timelineIndex];
    if (!row) return [null, null, null, null];
    var notes = [];
    for (var i = 0; i < analysis.numChannels; i++) {
      var n = row[i];
      if (n) {
        // Add normalized pitch (0-1 within song's pitch range)
        notes.push({
          midi: n.midi,
          freq: n.freq,
          instrument: n.instrument,
          wave: n.wave,
          vol: n.vol,
          channel: n.channel,
          normalized: (n.midi - analysis.pitchRange.min) / analysis.pitchRange.span
        });
      } else {
        notes.push(null);
      }
    }
    return notes;
  }

  // ---- Render loop ----

  function frame(timestamp) {
    if (!playing) return;
    rafID = requestAnimationFrame(frame);

    var now = timestamp / 1000;
    var dt = lastFrameTime ? now - lastFrameTime : 1 / 60;
    lastFrameTime = now;
    if (dt > 0.1) dt = 1 / 60; // clamp large gaps

    var elapsed = ctx.currentTime - startTime;
    var cursor = getCursor(elapsed);
    var currentNotes = getCurrentNotes(cursor);

    canvasCtx.clearRect(0, 0, cssW, cssH);

    if (activeRenderer && activeRenderer.render) {
      activeRenderer.render({
        ctx: canvasCtx,
        width: cssW,
        height: cssH,
        dt: dt,
        cursor: cursor,
        currentNotes: currentNotes,
        analysis: analysis,
        song: song
      });
    }
  }

  // ---- Public API ----

  var api = {
    init: function (canvasEl) {
      canvas = canvasEl;
      canvasCtx = canvas.getContext("2d");

      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.connect(ctx.destination);

      // Init ChipPlayer with our shared context
      if (window.ChipPlayer) {
        ChipPlayer.initExternal(ctx, masterGain);
      }

      sizeCanvas();
      window.addEventListener("resize", sizeCanvas);
    },

    loadSong: function (songJSON) {
      // Stop current playback
      if (playing) api.stop();

      song = normalizeSong(songJSON);
      analysis = analyzeSong(song);

      // Build a ChipPlayer-compatible copy of the song.
      // ChipPlayer expects compact format: seq[], patterns with ch[][] = [midi, inst]
      // and instruments with short keys (a, d, s, r, vol).
      if (window.ChipPlayer) {
        ChipPlayer.load(buildChipPlayerSong(songJSON));
      }

      // Re-init current renderer with new analysis
      if (activeRenderer && activeRenderer.init) {
        activeRenderer.init(canvasCtx, cssW, cssH, analysis);
      }
    },

    setRenderer: function (name) {
      if (!window.Renderers || !window.Renderers[name]) return;
      // Destroy old renderer
      if (activeRenderer && activeRenderer.destroy) {
        activeRenderer.destroy();
      }
      rendererName = name;
      activeRenderer = window.Renderers[name];
      if (activeRenderer.init) {
        activeRenderer.init(canvasCtx, cssW, cssH, analysis);
      }
    },

    play: function () {
      if (playing || !song) return;
      playing = true;
      lastFrameTime = 0;

      var startPlayback = function () {
        startTime = ctx.currentTime + 0.05;
        if (window.ChipPlayer) ChipPlayer.play();
        rafID = requestAnimationFrame(frame);
      };

      if (ctx.state === "suspended") {
        ctx.resume().then(startPlayback);
      } else {
        startPlayback();
      }
    },

    stop: function () {
      if (!playing) return;
      playing = false;
      if (rafID) cancelAnimationFrame(rafID);
      rafID = null;
      if (window.ChipPlayer) ChipPlayer.stop();
      // Clear canvas
      if (canvasCtx) canvasCtx.clearRect(0, 0, cssW, cssH);
      // Draw idle state
      if (activeRenderer && activeRenderer.render) {
        activeRenderer.render({
          ctx: canvasCtx,
          width: cssW,
          height: cssH,
          dt: 0,
          cursor: null,
          currentNotes: [null, null, null, null],
          analysis: analysis,
          song: song
        });
      }
    },

    setVolume: function (v) {
      if (masterGain && ctx) {
        masterGain.gain.setValueAtTime(v, ctx.currentTime);
      }
    },

    isPlaying: function () {
      return playing;
    },

    getRendererList: function () {
      var list = [];
      if (!window.Renderers) return list;
      for (var key in window.Renderers) {
        if (window.Renderers.hasOwnProperty(key)) {
          list.push({ id: key, name: window.Renderers[key].name || key });
        }
      }
      return list;
    },

    getAnalysis: function () {
      return analysis;
    },

    getSong: function () {
      return song;
    }
  };

  return api;
})();

// Global renderer registry
if (!window.Renderers) window.Renderers = {};
