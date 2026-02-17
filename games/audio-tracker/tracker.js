/**
 * Tracker — data model, sequencer, undo/redo, and import/export
 * for a 4-channel chiptune tracker.
 *
 * Depends on the global `Synth` object for audio playback.
 * No DOM access — pure data + scheduling logic.
 */
var Tracker = (function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Internal state
  // ---------------------------------------------------------------------------

  var song = null;
  var playing = false;
  var playMode = null;           // 'song' | 'pattern'
  var schedulerHandle = null;
  var currentRow = 0;
  var currentSeqRow = 0;
  var nextRowTime = 0;           // AudioContext time the next row fires
  var activeVoices = [null, null, null, null]; // per-channel voice refs

  var onRowChange = null;
  var onRowChangeListeners = [];
  var onPlaybackEnd = null;

  // Undo / redo stacks (cell-level diffs)
  var undoStack = [];
  var redoStack = [];
  var UNDO_LIMIT = 100;

  // Lookahead constants (seconds / ms)
  var SCHEDULE_AHEAD = 0.1;      // 100 ms
  var TICK_MS = 25;

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function fireRowChange(row, seqRow) {
    if (onRowChange) onRowChange(row, seqRow);
    for (var i = 0; i < onRowChangeListeners.length; i++) {
      onRowChangeListeners[i](row, seqRow);
    }
  }

  function emptyCell() {
    return { note: null, inst: 0, vol: null, fx: null };
  }

  function pad2(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  function toInt(value, fallback) {
    var n = parseInt(value, 10);
    return isNaN(n) ? fallback : n;
  }

  function defaultChannels() {
    return [
      { name: 'Pulse 1' },
      { name: 'Pulse 2' },
      { name: 'Triangle' },
      { name: 'Noise' }
    ];
  }

  function normalizeChannels(rawChannels) {
    var defaults = defaultChannels();
    if (!Array.isArray(rawChannels)) return defaults;

    var out = [];
    for (var i = 0; i < 4; i++) {
      var src = rawChannels[i];
      if (typeof src === 'string') {
        out.push({ name: src });
      } else if (src && typeof src === 'object') {
        out.push({ name: src.name || defaults[i].name });
      } else {
        out.push({ name: defaults[i].name });
      }
    }
    return out;
  }

  function cloneCell(c) {
    if (!c) return emptyCell();
    return {
      note: c.note,
      inst: c.inst,
      vol: c.vol,
      fx: c.fx ? { type: c.fx.type, p1: c.fx.p1, p2: c.fx.p2 } : null
    };
  }

  function createEmptyPattern(id, length) {
    var channels = [];
    for (var ch = 0; ch < 4; ch++) {
      var rows = [];
      for (var r = 0; r < length; r++) {
        rows.push(emptyCell());
      }
      channels.push(rows);
    }
    var padded = pad2(id);
    return { id: id, name: 'Pattern ' + padded, length: length, channels: channels };
  }

  function defaultInstruments() {
    // If a global Presets helper exists, pull from it; otherwise use sensible
    // defaults for the four classic NES-style channels.
    if (typeof Presets !== 'undefined' && Presets.defaults) {
      return Presets.defaults();
    }
    return [
      { name: 'Pulse 50%',  wave: 'square',   detune: 0, detuneOsc: false, detuneAmount: 0, attack: 0.01, decay: 0.1, sustain: 0.6, release: 0.15, filterType: 'none', filterFreq: 2000, filterQ: 1, volume: 0.8 },
      { name: 'Pulse 25%',  wave: 'pulse25',  detune: 0, detuneOsc: false, detuneAmount: 0, attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.15, filterType: 'none', filterFreq: 2000, filterQ: 1, volume: 0.8 },
      { name: 'Triangle',   wave: 'triangle', detune: 0, detuneOsc: false, detuneAmount: 0, attack: 0.01, decay: 0.0, sustain: 1.0, release: 0.05, filterType: 'none', filterFreq: 2000, filterQ: 1, volume: 0.7 },
      { name: 'Noise',      wave: 'noise',    detune: 0, detuneOsc: false, detuneAmount: 0, attack: 0.01, decay: 0.2, sustain: 0.0, release: 0.05, filterType: 'none', filterFreq: 2000, filterQ: 1, volume: 0.6 }
    ];
  }

  function nextPatternId() {
    var max = -1;
    for (var i = 0; i < song.patterns.length; i++) {
      if (song.patterns[i].id > max) max = song.patterns[i].id;
    }
    return max + 1;
  }

  function findPattern(id) {
    for (var i = 0; i < song.patterns.length; i++) {
      if (song.patterns[i].id === id) return song.patterns[i];
    }
    return null;
  }

  function secondsPerRow() {
    return 60 / song.bpm / (song.rowsPerBeat || 4);
  }

  function normalizeCell(rawCell) {
    var out = emptyCell();
    if (rawCell === null || rawCell === undefined) return out;

    if (Array.isArray(rawCell)) {
      if (rawCell.length > 0) out.note = rawCell[0];
      if (rawCell.length > 1) out.inst = rawCell[1];
      if (rawCell.length > 2) out.vol = rawCell[2];
      return normalizeCell(out);
    }

    if (typeof rawCell === 'number') {
      out.note = rawCell;
      return normalizeCell(out);
    }

    if (typeof rawCell === 'object') {
      var note = (rawCell.note !== undefined) ? rawCell.note : rawCell.n;
      var inst = (rawCell.inst !== undefined) ? rawCell.inst : rawCell.i;
      var vol = (rawCell.vol !== undefined) ? rawCell.vol : rawCell.v;
      var fx = (rawCell.fx !== undefined) ? rawCell.fx : rawCell.f;

      if (rawCell.off === true) note = -1;

      out.note = (note === undefined) ? null : note;
      out.inst = (inst === undefined || inst === null) ? 0 : inst;
      out.vol = (vol === undefined) ? null : vol;
      out.fx = fx || null;
    }

    if (out.note !== null) out.note = toInt(out.note, null);
    out.inst = toInt(out.inst, 0);
    if (out.vol !== null) out.vol = toInt(out.vol, null);
    return out;
  }

  function looksLikeEvent(item) {
    return !!item
      && !Array.isArray(item)
      && typeof item === 'object'
      && (item.r !== undefined || item.row !== undefined);
  }

  function channelIsEventList(rawChannel) {
    if (!Array.isArray(rawChannel)) return false;
    for (var i = 0; i < rawChannel.length; i++) {
      if (looksLikeEvent(rawChannel[i])) return true;
    }
    return false;
  }

  function inferPatternLength(rawPattern) {
    var length = toInt(rawPattern.length, NaN);
    if (isNaN(length)) length = toInt(rawPattern.len, NaN);

    var inferred = 0;
    var rawChannels = rawPattern.channels || rawPattern.ch || [];
    if (!Array.isArray(rawChannels)) rawChannels = [];

    for (var ch = 0; ch < rawChannels.length; ch++) {
      var rc = rawChannels[ch];
      if (!Array.isArray(rc)) continue;

      if (channelIsEventList(rc)) {
        for (var ei = 0; ei < rc.length; ei++) {
          var ev = rc[ei];
          if (!looksLikeEvent(ev)) continue;
          var row = toInt((ev.r !== undefined) ? ev.r : ev.row, NaN);
          if (isNaN(row) || row < 0) continue;
          var end = row + 1;
          var dur = toInt((ev.d !== undefined) ? ev.d : ev.dur, 0);
          if (dur > 0) end = row + dur + 1;
          if (end > inferred) inferred = end;
        }
      } else if (rc.length > inferred) {
        inferred = rc.length;
      }
    }

    if (isNaN(length) || length < 1) length = inferred || 16;
    if (inferred > length) length = inferred;
    if (length < 1) length = 1;
    return length;
  }

  function normalizePattern(rawPattern, fallbackId) {
    if (!rawPattern || typeof rawPattern !== 'object') rawPattern = {};

    var id = toInt(rawPattern.id, fallbackId);
    var len = inferPatternLength(rawPattern);
    var name = rawPattern.name || ('Pattern ' + pad2(id));
    var rawChannels = rawPattern.channels || rawPattern.ch || [];
    if (!Array.isArray(rawChannels)) rawChannels = [];
    var channels = [];

    for (var ch = 0; ch < 4; ch++) {
      var rows = [];
      for (var r = 0; r < len; r++) rows.push(emptyCell());

      var rawChannel = Array.isArray(rawChannels[ch]) ? rawChannels[ch] : [];
      if (channelIsEventList(rawChannel)) {
        for (var ei = 0; ei < rawChannel.length; ei++) {
          var ev = rawChannel[ei];
          if (!looksLikeEvent(ev)) continue;
          var row = toInt((ev.r !== undefined) ? ev.r : ev.row, NaN);
          if (isNaN(row) || row < 0 || row >= len) continue;

          var evNote = (ev.note !== undefined) ? ev.note : ev.n;
          if (ev.off === true) evNote = -1;
          var evVol = (ev.vol !== undefined) ? ev.vol : ev.v;
          var evFx = (ev.fx !== undefined) ? ev.fx : ev.f;
          var hasNote = (evNote !== undefined);
          if (!hasNote && evVol === undefined && evFx === undefined) continue;

          var cell = normalizeCell({
            note: hasNote ? evNote : null,
            inst: (ev.inst !== undefined) ? ev.inst : ev.i,
            vol: evVol,
            fx: evFx
          });
          rows[row] = cell;

          // Optional duration sugar for event format:
          // if d/dur is provided for note-on, auto-place note-off.
          if (cell.note !== null && cell.note >= 0) {
            var dur = toInt((ev.d !== undefined) ? ev.d : ev.dur, 0);
            if (dur > 0) {
              cell._dur = dur;
              var offRow = row + dur;
              if (offRow >= 0 && offRow < len && rows[offRow].note === null) {
                rows[offRow] = { note: -1, inst: cell.inst, vol: null, fx: null };
              }
            }
          }
        }
      } else {
        for (var r2 = 0; r2 < len && r2 < rawChannel.length; r2++) {
          rows[r2] = normalizeCell(rawChannel[r2]);
        }
      }

      channels.push(rows);
    }

    return { id: id, name: name, length: len, channels: channels };
  }

  function normalizeInstrument(rawInst, idx) {
    if (!rawInst || typeof rawInst !== 'object') rawInst = {};
    return {
      name: rawInst.name || ('Instrument ' + pad2(idx)),
      wave: rawInst.wave || 'square',
      detune: rawInst.detune || 0,
      detuneOsc: !!rawInst.detuneOsc,
      detuneAmount: rawInst.detuneAmount || 0,
      attack: (rawInst.attack !== undefined) ? rawInst.attack : (rawInst.a !== undefined ? rawInst.a : 0.01),
      decay: (rawInst.decay !== undefined) ? rawInst.decay : (rawInst.d !== undefined ? rawInst.d : 0.1),
      sustain: (rawInst.sustain !== undefined) ? rawInst.sustain : (rawInst.s !== undefined ? rawInst.s : 0.6),
      release: (rawInst.release !== undefined) ? rawInst.release : (rawInst.r !== undefined ? rawInst.r : 0.15),
      filterType: rawInst.filterType || 'none',
      filterFreq: (rawInst.filterFreq !== undefined) ? rawInst.filterFreq : 2000,
      filterQ: (rawInst.filterQ !== undefined) ? rawInst.filterQ : 1,
      volume: (rawInst.volume !== undefined) ? rawInst.volume : (rawInst.vol !== undefined ? rawInst.vol : 0.8)
    };
  }

  function normalizeSong(rawSong) {
    if (!rawSong || typeof rawSong !== 'object') rawSong = {};

    var out = {
      title: rawSong.title || 'Untitled',
      bpm: toInt(rawSong.bpm, 140),
      rowsPerBeat: toInt((rawSong.rowsPerBeat !== undefined) ? rawSong.rowsPerBeat : rawSong.rpb, 4),
      channels: normalizeChannels(rawSong.channels),
      instruments: [],
      patterns: [],
      sequence: [],
      loopStartSeq: 0,
      loopEndSeq: 0
    };

    var rawInstruments = Array.isArray(rawSong.instruments) ? rawSong.instruments : [];
    if (rawInstruments.length === 0) {
      out.instruments = defaultInstruments();
    } else {
      for (var i = 0; i < rawInstruments.length; i++) {
        out.instruments.push(normalizeInstrument(rawInstruments[i], i));
      }
    }

    var rawPatterns = Array.isArray(rawSong.patterns) ? rawSong.patterns : [];
    if (rawPatterns.length === 0) {
      out.patterns = [createEmptyPattern(0, 16)];
    } else {
      for (var p = 0; p < rawPatterns.length; p++) {
        out.patterns.push(normalizePattern(rawPatterns[p], p));
      }
    }

    var validPatternIds = {};
    for (var vp = 0; vp < out.patterns.length; vp++) {
      validPatternIds[out.patterns[vp].id] = true;
    }
    var fallbackPatternId = out.patterns[0].id;

    var rawSequence = rawSong.sequence || rawSong.seq || [];
    if (!Array.isArray(rawSequence) || rawSequence.length === 0) rawSequence = [[fallbackPatternId, fallbackPatternId, fallbackPatternId, fallbackPatternId]];

    for (var s = 0; s < rawSequence.length; s++) {
      var row = rawSequence[s];
      var seqRow = [fallbackPatternId, fallbackPatternId, fallbackPatternId, fallbackPatternId];

      if (typeof row === 'number') {
        seqRow = [row, row, row, row];
      } else if (Array.isArray(row)) {
        var fill = (row.length > 0) ? row[0] : fallbackPatternId;
        seqRow = [
          row[0] !== undefined ? row[0] : fill,
          row[1] !== undefined ? row[1] : fill,
          row[2] !== undefined ? row[2] : fill,
          row[3] !== undefined ? row[3] : fill
        ];
      } else if (row && typeof row === 'object' && Array.isArray(row.ch)) {
        var ch = row.ch;
        var fillObj = (ch.length > 0) ? ch[0] : fallbackPatternId;
        seqRow = [
          ch[0] !== undefined ? ch[0] : fillObj,
          ch[1] !== undefined ? ch[1] : fillObj,
          ch[2] !== undefined ? ch[2] : fillObj,
          ch[3] !== undefined ? ch[3] : fillObj
        ];
      }

      for (var c = 0; c < 4; c++) {
        seqRow[c] = toInt(seqRow[c], fallbackPatternId);
        if (!validPatternIds[seqRow[c]]) seqRow[c] = fallbackPatternId;
      }
      out.sequence.push(seqRow);
    }

    var maxSeq = out.sequence.length - 1;
    var loopStart = toInt(
      (rawSong.loopStartSeq !== undefined) ? rawSong.loopStartSeq : rawSong.loopStart,
      0
    );
    var loopEnd = toInt(
      (rawSong.loopEndSeq !== undefined) ? rawSong.loopEndSeq : rawSong.loopEnd,
      maxSeq
    );

    if (loopStart < 0 || loopStart > maxSeq) loopStart = 0;
    if (loopEnd < 0 || loopEnd > maxSeq) loopEnd = maxSeq;
    if (loopEnd < loopStart) loopEnd = maxSeq;
    out.loopStartSeq = loopStart;
    out.loopEndSeq = loopEnd;

    return out;
  }

  function getLoopStartSeq() {
    if (!song || !song.sequence || song.sequence.length === 0) return 0;
    var max = song.sequence.length - 1;
    var s = toInt(song.loopStartSeq, 0);
    if (s < 0 || s > max) s = 0;
    return s;
  }

  function getLoopEndSeq() {
    if (!song || !song.sequence || song.sequence.length === 0) return 0;
    var max = song.sequence.length - 1;
    var e = toInt(song.loopEndSeq, max);
    if (e < 0 || e > max) e = max;
    var s = getLoopStartSeq();
    if (e < s) e = max;
    return e;
  }

  // ---------------------------------------------------------------------------
  // Data-model API
  // ---------------------------------------------------------------------------

  function newSong() {
    song = {
      title: 'Untitled',
      bpm: 140,
      rowsPerBeat: 4,
      channels: defaultChannels(),
      instruments: defaultInstruments(),
      patterns: [createEmptyPattern(0, 16)],
      sequence: [[0, 0, 0, 0]],
      loopStartSeq: 0,
      loopEndSeq: 0
    };
    undoStack = [];
    redoStack = [];
    return song;
  }

  function getSong() {
    return song;
  }

  function setSong(s) {
    song = normalizeSong(s);
    undoStack = [];
    redoStack = [];
  }

  function addPattern() {
    var id = nextPatternId();
    var pat = createEmptyPattern(id, 16);
    song.patterns.push(pat);
    return pat;
  }

  function deletePattern(id) {
    if (song.patterns.length <= 1) return false;
    for (var i = 0; i < song.patterns.length; i++) {
      if (song.patterns[i].id === id) {
        song.patterns.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  function addInstrument(inst) {
    song.instruments.push(inst);
    return song.instruments.length - 1;
  }

  function deleteInstrument(idx) {
    if (song.instruments.length <= 1) return false;
    if (idx < 0 || idx >= song.instruments.length) return false;
    song.instruments.splice(idx, 1);
    return true;
  }

  function getCell(patternId, channel, row) {
    var pat = findPattern(patternId);
    if (!pat) return null;
    if (channel < 0 || channel >= pat.channels.length) return null;
    if (row < 0 || row >= pat.length) return null;
    return pat.channels[channel][row];
  }

  function setCell(patternId, channel, row, cell) {
    var pat = findPattern(patternId);
    if (!pat) return;
    if (channel < 0 || channel >= pat.channels.length) return;
    if (row < 0 || row >= pat.length) return;

    var oldCell = cloneCell(pat.channels[channel][row]);
    var newCell = cloneCell(cell);
    pat.channels[channel][row] = newCell;

    // Push undo diff
    undoStack.push({
      patternId: patternId,
      channel: channel,
      row: row,
      oldCell: oldCell,
      newCell: cloneCell(newCell)
    });
    if (undoStack.length > UNDO_LIMIT) {
      undoStack.shift();
    }
    // Any edit clears the redo stack
    redoStack = [];
  }

  function clearCell(patternId, channel, row) {
    setCell(patternId, channel, row, emptyCell());
  }

  // ---------------------------------------------------------------------------
  // Sequence (arrangement) API
  // ---------------------------------------------------------------------------

  function addSequenceRow() {
    // Default: copy last row or zeros
    var last = song.sequence[song.sequence.length - 1] || [0, 0, 0, 0];
    song.sequence.push(last.slice());
    return song.sequence.length - 1;
  }

  function deleteSequenceRow(idx) {
    if (song.sequence.length <= 1) return false;
    if (idx < 0 || idx >= song.sequence.length) return false;
    song.sequence.splice(idx, 1);
    return true;
  }

  function setSequenceEntry(seqRow, channel, patternId) {
    if (seqRow < 0 || seqRow >= song.sequence.length) return;
    if (channel < 0 || channel >= 4) return;
    song.sequence[seqRow][channel] = patternId;
  }

  // ---------------------------------------------------------------------------
  // Undo / Redo
  // ---------------------------------------------------------------------------

  function undo() {
    if (undoStack.length === 0) return false;
    var diff = undoStack.pop();
    var pat = findPattern(diff.patternId);
    if (pat) {
      pat.channels[diff.channel][diff.row] = cloneCell(diff.oldCell);
    }
    redoStack.push(diff);
    if (redoStack.length > UNDO_LIMIT) {
      redoStack.shift();
    }
    return true;
  }

  function redo() {
    if (redoStack.length === 0) return false;
    var diff = redoStack.pop();
    var pat = findPattern(diff.patternId);
    if (pat) {
      pat.channels[diff.channel][diff.row] = cloneCell(diff.newCell);
    }
    undoStack.push(diff);
    if (undoStack.length > UNDO_LIMIT) {
      undoStack.shift();
    }
    return true;
  }

  // ---------------------------------------------------------------------------
  // Sequencer (lookahead scheduler)
  // ---------------------------------------------------------------------------

  function getPatternForChannel(ch) {
    // In pattern mode we always play the first pattern in the current
    // sequence row.  In song mode we index into the sequence.
    var seqEntry = song.sequence[currentSeqRow];
    if (!seqEntry) return null;
    var patId = seqEntry[ch];
    return findPattern(patId);
  }

  function scheduleRow(time) {
    for (var ch = 0; ch < 4; ch++) {
      var pat = getPatternForChannel(ch);
      if (!pat) continue;
      if (currentRow >= pat.length) continue;

      var cell = pat.channels[ch][currentRow];
      if (!cell || cell.note === null) continue;

      var inst = song.instruments[cell.inst] || song.instruments[0];
      var vol = (cell.vol !== null && cell.vol !== undefined)
        ? cell.vol / 15
        : (inst.volume !== undefined ? inst.volume : 0.8);

      if (cell.note === -1) {
        // Note-off
        if (activeVoices[ch] !== null) {
          if (typeof Synth !== 'undefined' && Synth.noteOff) {
            Synth.noteOff(activeVoices[ch], time);
          }
          activeVoices[ch] = null;
        }
      } else if (cell.note >= 0) {
        // Note-on: stop previous voice on this channel first
        if (activeVoices[ch] !== null) {
          if (typeof Synth !== 'undefined' && Synth.noteOff) {
            Synth.noteOff(activeVoices[ch], time);
          }
          activeVoices[ch] = null;
        }

        if (typeof Synth !== 'undefined') {
          var voice = null;
          if (inst.wave === 'noise' && Synth.triggerNoise) {
            voice = Synth.triggerNoise(ch, inst, time);
          } else if (Synth.noteOn) {
            voice = Synth.noteOn(ch, cell.note, inst, time);
          }
          activeVoices[ch] = voice;

          // Cross-boundary duration: if note-off falls at or past the
          // pattern boundary, schedule a precise future note-off via
          // Web Audio timing instead of relying on a row event.
          if (voice && cell._dur) {
            var offRow = currentRow + cell._dur;
            var patLen = pat.length;
            if (offRow >= patLen) {
              var offTime = time + cell._dur * secondsPerRow();
              Synth.noteOff(voice, offTime);
            }
          }
        }
      }
    }
  }

  // Internal row advancement — pure state update, no UI callback.
  // Used by schedulerTick to batch-schedule rows without triggering
  // expensive DOM work between each row.
  function advanceRow_internal() {
    currentRow++;

    // Determine current pattern length (use channel 0 as reference)
    var pat = getPatternForChannel(0);
    var patLen = pat ? pat.length : 16;

    if (currentRow >= patLen) {
      currentRow = 0;

      if (playMode === 'song') {
        currentSeqRow++;
        if (currentSeqRow > getLoopEndSeq() || currentSeqRow >= song.sequence.length) {
          // Loop within configured sequence loop window.
          currentSeqRow = getLoopStartSeq();
          if (onPlaybackEnd) onPlaybackEnd();
        }
      } else {
        // Pattern mode: loop same pattern
        if (onPlaybackEnd) onPlaybackEnd();
      }
    }
  }

  function advanceRow() {
    advanceRow_internal();
    fireRowChange(currentRow, currentSeqRow);
  }

  function schedulerTick() {
    if (!playing || typeof Synth === 'undefined' || !Synth.getContext) return;

    var ctx = Synth.getContext();
    if (!ctx) return;
    var now = ctx.currentTime;

    // Schedule all rows within the lookahead window first, deferring
    // UI callbacks until after the scheduling batch completes.  This
    // prevents expensive DOM work inside the tight scheduling loop
    // from delaying subsequent row scheduling and causing audible gaps
    // at pattern boundaries (especially at higher tempos).
    var lastRow = currentRow;
    var lastSeqRow = currentSeqRow;
    var scheduled = false;

    while (nextRowTime < now + SCHEDULE_AHEAD) {
      scheduleRow(nextRowTime);
      nextRowTime += secondsPerRow();
      advanceRow_internal();
      scheduled = true;
    }

    // Notify UI once with the final position after the batch
    if (scheduled && (lastRow !== currentRow || lastSeqRow !== currentSeqRow)) {
      fireRowChange(currentRow, currentSeqRow);
    }
  }

  function play(mode) {
    if (playing) stop();
    if (!song) return;

    playMode = mode || 'pattern';
    playing = true;
    currentRow = 0;
    if (playMode === 'song') {
      currentSeqRow = 0;
    }
    activeVoices = [null, null, null, null];

    if (typeof Synth !== 'undefined' && Synth.getContext) {
      var ctx = Synth.getContext();
      if (ctx) {
        // Resume context if suspended (autoplay policy)
        if (ctx.state === 'suspended' && ctx.resume) {
          ctx.resume();
        }
        nextRowTime = ctx.currentTime + 0.05; // tiny lead-in
      }
    }

    schedulerHandle = setInterval(schedulerTick, TICK_MS);

    fireRowChange(currentRow, currentSeqRow);
  }

  function stop() {
    playing = false;
    if (schedulerHandle !== null) {
      clearInterval(schedulerHandle);
      schedulerHandle = null;
    }

    // Release all active voices
    if (typeof Synth !== 'undefined' && Synth.noteOff) {
      var now = (Synth.getContext && Synth.getContext())
        ? Synth.getContext().currentTime
        : 0;
      for (var ch = 0; ch < 4; ch++) {
        if (activeVoices[ch] !== null) {
          Synth.noteOff(activeVoices[ch], now);
          activeVoices[ch] = null;
        }
      }
    }

    currentRow = 0;
    currentSeqRow = 0;
  }

  function seekTo(seqRow) {
    if (!song) return;
    var maxSeq = song.sequence.length - 1;
    var target = Math.max(0, Math.min(seqRow, maxSeq));

    // Release all active voices immediately
    if (typeof Synth !== 'undefined' && Synth.noteOff) {
      var now = (Synth.getContext && Synth.getContext())
        ? Synth.getContext().currentTime
        : 0;
      for (var ch = 0; ch < 4; ch++) {
        if (activeVoices[ch] !== null) {
          Synth.noteOff(activeVoices[ch], now);
          activeVoices[ch] = null;
        }
      }
    }

    currentSeqRow = target;
    currentRow = 0;

    if (playing) {
      // Reset the scheduler timing so it picks up from the new position
      if (typeof Synth !== 'undefined' && Synth.getContext) {
        var ctx = Synth.getContext();
        if (ctx) nextRowTime = ctx.currentTime + 0.05;
      }
    }

    fireRowChange(currentRow, currentSeqRow);
  }

  function getTotalSequenceRows() {
    if (!song || !song.sequence) return 0;
    return song.sequence.length;
  }

  // ---------------------------------------------------------------------------
  // Export / Import
  // ---------------------------------------------------------------------------

  function exportFull() {
    return JSON.stringify(song, null, 2);
  }

  function importFull(json) {
    var parsed = JSON.parse(json);
    setSong(parsed);
    return song;
  }

  function exportCompact() {
    // Minimal representation matching ChipPlayer (playback-engine.js) format.
    var compact = {
      title: song.title,
      bpm: song.bpm,
      rpb: song.rowsPerBeat,
      loopStartSeq: getLoopStartSeq(),
      loopEndSeq: getLoopEndSeq(),
      instruments: [],
      patterns: [],
      seq: song.sequence
    };

    // Instruments: keep playback-essential fields with compact keys
    for (var i = 0; i < song.instruments.length; i++) {
      var src = song.instruments[i];
      compact.instruments.push({
        wave: src.wave,
        detune: src.detune || 0,
        detuneOsc: src.detuneOsc || false,
        detuneAmount: src.detuneAmount || 0,
        a: src.attack,
        d: src.decay,
        s: src.sustain,
        r: src.release,
        vol: src.volume,
        filterType: src.filterType || 'none',
        filterFreq: src.filterFreq || 2000,
        filterQ: src.filterQ || 1
      });
    }

    // Patterns: notes as arrays [midi, inst] or null
    for (var p = 0; p < song.patterns.length; p++) {
      var pat = song.patterns[p];
      var compactPat = { len: pat.length, ch: [] };
      for (var ch = 0; ch < pat.channels.length; ch++) {
        var compactCh = [];
        for (var r = 0; r < pat.channels[ch].length; r++) {
          var cell = pat.channels[ch][r];
          if (cell.note === null) {
            compactCh.push(null);
          } else {
            compactCh.push([cell.note, cell.inst]);
          }
        }
        compactPat.ch.push(compactCh);
      }
      compact.patterns.push(compactPat);
    }

    return JSON.stringify(compact);
  }

  function saveToStorage() {
    if (!song) return false;
    try {
      localStorage.setItem('chiptracker-song', exportFull());
      return true;
    } catch (e) {
      return false;
    }
  }

  function loadFromStorage() {
    try {
      var json = localStorage.getItem('chiptracker-song');
      if (!json) return false;
      importFull(json);
      return true;
    } catch (e) {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  return {
    // Song management
    newSong: newSong,
    getSong: getSong,
    setSong: setSong,

    // Patterns
    addPattern: addPattern,
    deletePattern: deletePattern,

    // Instruments
    addInstrument: addInstrument,
    deleteInstrument: deleteInstrument,

    // Cell editing
    getCell: getCell,
    setCell: setCell,
    clearCell: clearCell,

    // Sequence / arrangement
    addSequenceRow: addSequenceRow,
    deleteSequenceRow: deleteSequenceRow,
    setSequenceEntry: setSequenceEntry,

    // Undo / redo
    undo: undo,
    redo: redo,

    // Sequencer transport
    play: play,
    stop: stop,
    seekTo: seekTo,
    isPlaying: function () { return playing; },
    getCurrentRow: function () { return currentRow; },
    getCurrentSequenceRow: function () { return currentSeqRow; },
    getTotalSequenceRows: getTotalSequenceRows,
    setOnRowChange: function (cb) { onRowChange = cb; },
    addOnRowChange: function (cb) { onRowChangeListeners.push(cb); },
    setOnPlaybackEnd: function (cb) { onPlaybackEnd = cb; },

    // Export / import
    exportFull: exportFull,
    importFull: importFull,
    exportCompact: exportCompact,
    saveToStorage: saveToStorage,
    loadFromStorage: loadFromStorage
  };
})();
