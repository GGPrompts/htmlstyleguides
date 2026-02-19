/**
 * ChipPlayer — Minimal chiptune playback engine.
 * Standalone IIFE. Plays compact song JSON exported by the tracker.
 * No DOM access, no editing, no UI. Just audio playback.
 */
var ChipPlayer = (function () {
  "use strict";

  var ctx = null;
  var masterGain = null;
  var noiseBuffer = null;
  var pulseWaves = {};
  var playing = false;
  var song = null;
  var timerID = null;
  var nextNoteTime = 0;
  var seqIndex = 0;
  var rowIndex = 0;

  var SCHEDULE_AHEAD = 0.1;   // seconds to schedule ahead
  var TIMER_INTERVAL = 25;    // ms between scheduler ticks

  // ---- Helpers ----

  function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function buildPulseWave(duty) {
    var harmonics = 64;
    var real = new Float32Array(harmonics + 1);
    var imag = new Float32Array(harmonics + 1);
    for (var n = 1; n <= harmonics; n++) {
      imag[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * duty);
    }
    return ctx.createPeriodicWave(real, imag, { disableNormalization: false });
  }

  function createNoiseBuffer() {
    var len = Math.ceil(ctx.sampleRate * 2);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  function secondsPerRow() {
    return 60 / (song.bpm * (song.rpb || 4));
  }

  // ---- Playback note ----

  function playNote(midi, inst, time) {
    var vol = inst.vol !== undefined ? inst.vol : 0.8;
    var a = inst.a || 0.01, d = inst.d || 0.1;
    var s = inst.s !== undefined ? inst.s : 0.6, r = inst.r || 0.1;

    var gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(vol, time + a);
    gainNode.gain.linearRampToValueAtTime(vol * s, time + a + d);
    // Sustain holds until release; schedule release at row end
    var releaseAt = time + secondsPerRow() - 0.005;
    gainNode.gain.setValueAtTime(vol * s, releaseAt);
    gainNode.gain.linearRampToValueAtTime(0, releaseAt + r);

    var endTime = releaseAt + r + 0.05;
    var dest = gainNode;

    // Optional filter
    if (inst.filterType && inst.filterType !== "none") {
      var filter = ctx.createBiquadFilter();
      filter.type = inst.filterType;
      filter.frequency.setValueAtTime(inst.filterFreq || 2000, time);
      filter.Q.setValueAtTime(inst.filterQ || 1, time);
      filter.connect(gainNode);
      dest = filter;
    }

    var freq = midiToFreq(midi);
    var wave = inst.wave || "square";

    if (wave === "noise") {
      var src = ctx.createBufferSource();
      src.buffer = noiseBuffer;
      src.loop = true;
      src.connect(dest);
      src.start(time);
      src.stop(endTime);
    } else {
      // Primary oscillator
      var osc = ctx.createOscillator();
      if (wave === "pulse25") {
        if (!pulseWaves["25"]) pulseWaves["25"] = buildPulseWave(0.25);
        osc.setPeriodicWave(pulseWaves["25"]);
      } else if (wave === "pulse12") {
        if (!pulseWaves["12"]) pulseWaves["12"] = buildPulseWave(0.125);
        osc.setPeriodicWave(pulseWaves["12"]);
      } else {
        osc.type = wave;
      }
      osc.frequency.setValueAtTime(freq, time);
      if (inst.detune) osc.detune.setValueAtTime(inst.detune, time);
      osc.connect(dest);
      osc.start(time);
      osc.stop(endTime);

      // Optional detuned second oscillator
      if (inst.detuneOsc && inst.detuneAmount) {
        var osc2 = ctx.createOscillator();
        if (wave === "pulse25") {
          osc2.setPeriodicWave(pulseWaves["25"]);
        } else if (wave === "pulse12") {
          osc2.setPeriodicWave(pulseWaves["12"]);
        } else {
          osc2.type = wave;
        }
        osc2.frequency.setValueAtTime(freq, time);
        osc2.detune.setValueAtTime((inst.detune || 0) + inst.detuneAmount, time);
        osc2.connect(dest);
        osc2.start(time);
        osc2.stop(endTime);
      }
    }

    gainNode.connect(masterGain);
  }

  // ---- Scheduler ----

  function scheduleRow(time) {
    var seqRow = song.seq[seqIndex];
    for (var ch = 0; ch < seqRow.length; ch++) {
      var patIdx = seqRow[ch];
      var pat = song.patterns[patIdx];
      if (!pat || !pat.ch || !pat.ch[ch]) continue;
      var cell = pat.ch[ch][rowIndex];
      if (!cell || cell[0] < 0) continue;
      var midi = cell[0];
      var inst = song.instruments[cell[1]] || song.instruments[0];
      playNote(midi, inst, time);
    }
  }

  function advanceRow() {
    rowIndex++;
    var seqRow = song.seq[seqIndex];
    var patIdx = seqRow[0];
    var patLen = song.patterns[patIdx] ? song.patterns[patIdx].len : 16;
    if (rowIndex >= patLen) {
      rowIndex = 0;
      seqIndex++;
      if (seqIndex >= song.seq.length) seqIndex = 0;
    }
  }

  function scheduler() {
    while (nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD) {
      scheduleRow(nextNoteTime);
      advanceWithLoop();
      nextNoteTime += secondsPerRow();
    }
  }

  function advanceWithLoop() {
    rowIndex++;
    var seqRow = song.seq[seqIndex];
    var patIdx = seqRow[0];
    var patLen = song.patterns[patIdx] ? song.patterns[patIdx].len : 16;
    if (rowIndex >= patLen) {
      rowIndex = 0;
      seqIndex++;
      var loopEnd = song.loopEndSeq != null ? song.loopEndSeq : song.seq.length;
      var loopStart = song.loopStartSeq || 0;
      if (seqIndex >= loopEnd) {
        seqIndex = loopStart;
      }
    }
  }

  // ---- Public API ----

  return {
    init: function () {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.connect(ctx.destination);
      noiseBuffer = createNoiseBuffer();
      pulseWaves = {};
    },

    /** Init with an external AudioContext and gain node (for embedding in another audio engine). */
    initExternal: function (externalCtx, externalGainNode) {
      ctx = externalCtx;
      masterGain = externalGainNode;
      noiseBuffer = createNoiseBuffer();
      pulseWaves = {};
    },

    load: function (songJSON) {
      song = songJSON;
      // Normalize tracker-native format to compact format
      if (song.sequence && !song.seq) {
        song.seq = song.sequence;
        for (var p = 0; p < song.patterns.length; p++) {
          var pat = song.patterns[p];
          if (pat.channels && !pat.ch) {
            var len = pat.len || 16;
            pat.ch = [];
            for (var c = 0; c < pat.channels.length; c++) {
              var dense = new Array(len);
              for (var r = 0; r < len; r++) dense[r] = null;
              var events = pat.channels[c];
              for (var e = 0; e < events.length; e++) {
                var ev = events[e];
                dense[ev.r] = [ev.n, ev.i];
              }
              pat.ch.push(dense);
            }
          }
        }
      }
      seqIndex = 0;
      rowIndex = 0;
    },

    play: function () {
      if (playing || !song) return;
      if (!ctx) this.init();
      if (ctx.state === "suspended") ctx.resume();
      playing = true;
      seqIndex = 0;
      rowIndex = 0;
      nextNoteTime = ctx.currentTime + 0.05;
      timerID = setInterval(function () {
        while (nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD) {
          scheduleRow(nextNoteTime);
          advanceWithLoop();
          nextNoteTime += secondsPerRow();
        }
      }, TIMER_INTERVAL);
    },

    stop: function () {
      if (!playing) return;
      playing = false;
      if (timerID) { clearInterval(timerID); timerID = null; }
    },

    setVolume: function (v) {
      if (masterGain) masterGain.gain.setValueAtTime(v, ctx.currentTime);
    },

    isPlaying: function () {
      return playing;
    }
  };
})();
