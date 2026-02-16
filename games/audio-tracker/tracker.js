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

  function emptyCell() {
    return { note: null, inst: 0, vol: null, fx: null };
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
    var padded = id < 10 ? '0' + id : '' + id;
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

  // ---------------------------------------------------------------------------
  // Data-model API
  // ---------------------------------------------------------------------------

  function newSong() {
    song = {
      title: 'Untitled',
      bpm: 140,
      rowsPerBeat: 4,
      channels: [
        { name: 'Pulse 1' },
        { name: 'Pulse 2' },
        { name: 'Triangle' },
        { name: 'Noise' }
      ],
      instruments: defaultInstruments(),
      patterns: [createEmptyPattern(0, 16)],
      sequence: [[0, 0, 0, 0]]
    };
    undoStack = [];
    redoStack = [];
    return song;
  }

  function getSong() {
    return song;
  }

  function setSong(s) {
    song = s;
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
        }
      }
    }
  }

  function advanceRow() {
    currentRow++;

    // Determine current pattern length (use channel 0 as reference)
    var pat = getPatternForChannel(0);
    var patLen = pat ? pat.length : 16;

    if (currentRow >= patLen) {
      currentRow = 0;

      if (playMode === 'song') {
        currentSeqRow++;
        if (currentSeqRow >= song.sequence.length) {
          // Loop back to start
          currentSeqRow = 0;
          if (onPlaybackEnd) onPlaybackEnd();
        }
      } else {
        // Pattern mode: loop same pattern
        if (onPlaybackEnd) onPlaybackEnd();
      }
    }

    if (onRowChange) onRowChange(currentRow, currentSeqRow);
  }

  function schedulerTick() {
    if (!playing || typeof Synth === 'undefined' || !Synth.getContext) return;

    var ctx = Synth.getContext();
    if (!ctx) return;
    var now = ctx.currentTime;

    while (nextRowTime < now + SCHEDULE_AHEAD) {
      scheduleRow(nextRowTime);
      nextRowTime += secondsPerRow();
      advanceRow();
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

    if (onRowChange) onRowChange(currentRow, currentSeqRow);
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
    isPlaying: function () { return playing; },
    getCurrentRow: function () { return currentRow; },
    getCurrentSequenceRow: function () { return currentSeqRow; },
    setOnRowChange: function (cb) { onRowChange = cb; },
    setOnPlaybackEnd: function (cb) { onPlaybackEnd = cb; },

    // Export / import
    exportFull: exportFull,
    importFull: importFull,
    exportCompact: exportCompact,
    saveToStorage: saveToStorage,
    loadFromStorage: loadFromStorage
  };
})();
