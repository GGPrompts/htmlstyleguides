/**
 * Synth — Web Audio API synthesis engine for a chiptune tracker.
 * Global IIFE. No DOM access.
 */
var Synth = (function () {
  "use strict";

  var ctx = null;
  var masterGain = null;
  var channelGains = [null, null, null, null];
  var activeVoices = [];
  var pulseWaves = {};

  // ---- Helpers ----

  function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function buildPulseWave(duty, harmonics) {
    var real = new Float32Array(harmonics + 1);
    var imag = new Float32Array(harmonics + 1);
    real[0] = 0;
    imag[0] = 0;
    for (var n = 1; n <= harmonics; n++) {
      // Fourier series for a pulse wave with given duty cycle:
      // b_n = (2 / (n * pi)) * sin(n * pi * duty)
      imag[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * duty);
      real[n] = 0;
    }
    return ctx.createPeriodicWave(real, imag, { disableNormalization: false });
  }

  function createNoiseBuffer(duration) {
    var sampleRate = ctx.sampleRate;
    var length = Math.ceil(sampleRate * duration);
    var buffer = ctx.createBuffer(1, length, sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  function removeVoice(handle) {
    var idx = activeVoices.indexOf(handle);
    if (idx !== -1) {
      activeVoices.splice(idx, 1);
    }
  }

  function clampChannel(ch) {
    return Math.max(0, Math.min(3, ch | 0));
  }

  // ---- Public API ----

  function init() {
    if (ctx) return;

    var AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();

    // Resume on user gesture if suspended
    if (ctx.state === "suspended") {
      var resume = function () {
        ctx.resume();
        document.removeEventListener("click", resume);
        document.removeEventListener("keydown", resume);
        document.removeEventListener("touchstart", resume);
      };
      document.addEventListener("click", resume);
      document.addEventListener("keydown", resume);
      document.addEventListener("touchstart", resume);
    }

    masterGain = ctx.createGain();
    masterGain.gain.value = 0.7;
    masterGain.connect(ctx.destination);

    for (var i = 0; i < 4; i++) {
      channelGains[i] = ctx.createGain();
      channelGains[i].gain.value = 1.0;
      channelGains[i].connect(masterGain);
    }

    // Cache pulse PeriodicWaves (32 harmonics)
    pulseWaves.pulse25 = buildPulseWave(0.25, 32);
    pulseWaves.pulse12 = buildPulseWave(0.125, 32);
  }

  function createOscillator(freq, wave, detuneCents, time) {
    var osc = ctx.createOscillator();

    if (wave === "pulse25") {
      osc.setPeriodicWave(pulseWaves.pulse25);
    } else if (wave === "pulse12") {
      osc.setPeriodicWave(pulseWaves.pulse12);
    } else {
      osc.type = wave; // square, triangle, sawtooth, sine
    }

    osc.frequency.setValueAtTime(freq, time);
    if (detuneCents) {
      osc.detune.setValueAtTime(detuneCents, time);
    }
    return osc;
  }

  function applyADSR(gainNode, instrument, time) {
    var a = instrument.attack || 0.01;
    var d = instrument.decay || 0.1;
    var s = instrument.sustain !== undefined ? instrument.sustain : 0.6;
    var vol = instrument.volume !== undefined ? instrument.volume : 0.8;
    var peak = vol;

    var g = gainNode.gain;
    g.setValueAtTime(0, time);
    g.linearRampToValueAtTime(peak, time + a);
    g.linearRampToValueAtTime(s * peak, time + a + d);
  }

  function applyRelease(gainNode, instrument, time) {
    var r = instrument.release || 0.1;
    var s = instrument.sustain !== undefined ? instrument.sustain : 0.6;
    var vol = instrument.volume !== undefined ? instrument.volume : 0.8;
    var g = gainNode.gain;
    // Cancel future ramps and ramp to zero.
    // Use the instrument's sustain level rather than g.value, which only
    // reflects the gain at JS-execution time — not at the scheduled time.
    g.cancelScheduledValues(time);
    g.setValueAtTime(s * vol, time);
    g.linearRampToValueAtTime(0, time + r);
    return r;
  }

  function createFilter(instrument, time) {
    if (!instrument.filterType || instrument.filterType === "none") {
      return null;
    }
    var filter = ctx.createBiquadFilter();
    filter.type = instrument.filterType;
    filter.frequency.setValueAtTime(
      instrument.filterFreq || 2000,
      time
    );
    filter.Q.setValueAtTime(instrument.filterQ || 1, time);
    return filter;
  }

  /**
   * noteOn — start a pitched voice.
   * Returns a voice handle for use with noteOff.
   */
  function noteOn(channel, midiNote, instrument, time) {
    if (!ctx) return null;

    var ch = clampChannel(channel);
    var t = time || ctx.currentTime;
    var freq = midiToFreq(midiNote);
    var wave = instrument.wave || "square";

    // Don't use noteOn for noise — use triggerNoise instead
    if (wave === "noise") {
      return triggerNoise(ch, instrument, t);
    }

    // ADSR gain node
    var envGain = ctx.createGain();
    applyADSR(envGain, instrument, t);

    // Optional filter
    var filter = createFilter(instrument, t);

    // Primary oscillator
    var osc1 = createOscillator(freq, wave, instrument.detune || 0, t);

    // Optional detuned 2nd oscillator
    var osc2 = null;
    if (instrument.detuneOsc) {
      var d2 = instrument.detuneAmount || 7;
      osc2 = createOscillator(freq, wave, (instrument.detune || 0) + d2, t);
    }

    // Routing: osc(s) -> filter? -> envGain -> channelGain
    var target = filter || envGain;

    osc1.connect(target);
    if (osc2) {
      osc2.connect(target);
    }

    if (filter) {
      filter.connect(envGain);
    }

    envGain.connect(channelGains[ch]);

    osc1.start(t);
    if (osc2) {
      osc2.start(t);
    }

    var handle = {
      type: "tone",
      osc1: osc1,
      osc2: osc2,
      filter: filter,
      envGain: envGain,
      instrument: instrument,
      channel: ch,
      startTime: t,
      released: false
    };

    activeVoices.push(handle);
    return handle;
  }

  /**
   * noteOff — schedule release envelope, then stop oscillators.
   * If quickCut is true, use a very short fade-out (~3ms) instead of the
   * instrument's release time. This avoids overlapping tails when a new
   * note retriggers on the same channel immediately.
   */
  function noteOff(handle, time, quickCut) {
    if (!handle || handle.released) return;
    handle.released = true;

    var t = time || ctx.currentTime;
    var releaseDur;
    if (quickCut) {
      var g = handle.envGain.gain;
      g.cancelScheduledValues(t);
      g.setValueAtTime(g.value, t);
      g.linearRampToValueAtTime(0, t + 0.003);
      releaseDur = 0.003;
    } else {
      releaseDur = applyRelease(handle.envGain, handle.instrument, t);
    }
    var stopTime = t + releaseDur + 0.01;

    handle.osc1.stop(stopTime);
    if (handle.osc2) {
      handle.osc2.stop(stopTime);
    }

    // Clean up after stop — delay must account for the scheduled stop time
    // being in the future, not just the release envelope duration.
    var cleanupDelay = (stopTime - ctx.currentTime + 0.05) * 1000;
    if (cleanupDelay < 50) cleanupDelay = 50;
    setTimeout(function () {
      try {
        handle.osc1.disconnect();
        if (handle.osc2) handle.osc2.disconnect();
        if (handle.filter) handle.filter.disconnect();
        handle.envGain.disconnect();
      } catch (e) {
        // already disconnected
      }
      removeVoice(handle);
    }, cleanupDelay);
  }

  /**
   * triggerNoise — create buffer noise source for percussion.
   * Instrument params control character:
   *   - kick:  lowpass filter, low filterFreq (~150), high Q, short decay
   *   - snare: highpass filter, mid filterFreq (~1000), short decay
   *   - hat:   highpass filter, high filterFreq (~6000), very short decay
   */
  function triggerNoise(channel, instrument, time) {
    if (!ctx) return null;

    var ch = clampChannel(channel);
    var t = time || ctx.currentTime;

    var a = instrument.attack || 0.001;
    var d = instrument.decay || 0.1;
    var s = instrument.sustain !== undefined ? instrument.sustain : 0.0;
    var r = instrument.release || 0.05;
    var vol = instrument.volume !== undefined ? instrument.volume : 0.8;

    // Total duration of the noise burst
    var totalDur = a + d + r + 0.2;

    var buffer = createNoiseBuffer(totalDur);
    var source = ctx.createBufferSource();
    source.buffer = buffer;

    // Envelope
    var envGain = ctx.createGain();
    var g = envGain.gain;
    g.setValueAtTime(0, t);
    g.linearRampToValueAtTime(vol, t + a);
    g.linearRampToValueAtTime(s * vol, t + a + d);
    g.linearRampToValueAtTime(0, t + a + d + r);

    // Optional filter
    var filter = createFilter(instrument, t);

    var target = filter || envGain;
    source.connect(target);
    if (filter) {
      filter.connect(envGain);
    }
    envGain.connect(channelGains[ch]);

    source.start(t);
    source.stop(t + totalDur);

    var handle = {
      type: "noise",
      source: source,
      filter: filter,
      envGain: envGain,
      instrument: instrument,
      channel: ch,
      startTime: t,
      released: true // noise is fire-and-forget
    };

    activeVoices.push(handle);

    // Auto-cleanup
    setTimeout(function () {
      try {
        source.disconnect();
        if (filter) filter.disconnect();
        envGain.disconnect();
      } catch (e) {
        // already disconnected
      }
      removeVoice(handle);
    }, (totalDur + 0.05) * 1000);

    return handle;
  }

  function setMasterVolume(v) {
    if (masterGain) {
      masterGain.gain.setValueAtTime(
        Math.max(0, Math.min(1, v)),
        ctx.currentTime
      );
    }
  }

  function setChannelVolume(ch, v) {
    var c = clampChannel(ch);
    if (channelGains[c]) {
      channelGains[c].gain.setValueAtTime(
        Math.max(0, Math.min(1, v)),
        ctx.currentTime
      );
    }
  }

  function dispose() {
    // Stop and disconnect all active voices
    for (var i = activeVoices.length - 1; i >= 0; i--) {
      var h = activeVoices[i];
      try {
        if (h.type === "tone") {
          h.osc1.stop();
          h.osc1.disconnect();
          if (h.osc2) {
            h.osc2.stop();
            h.osc2.disconnect();
          }
        } else if (h.type === "noise") {
          h.source.stop();
          h.source.disconnect();
        }
        if (h.filter) h.filter.disconnect();
        h.envGain.disconnect();
      } catch (e) {
        // already stopped/disconnected
      }
    }
    activeVoices.length = 0;

    // Close context
    if (ctx) {
      ctx.close().catch(function () {});
      ctx = null;
    }

    masterGain = null;
    channelGains = [null, null, null, null];
    pulseWaves = {};
  }

  function getContext() {
    return ctx;
  }

  function getTime() {
    return ctx ? ctx.currentTime : 0;
  }

  // ---- Public interface ----

  return {
    init: init,
    noteOn: noteOn,
    noteOff: noteOff,
    triggerNoise: triggerNoise,
    setMasterVolume: setMasterVolume,
    setChannelVolume: setChannelVolume,
    dispose: dispose,
    getContext: getContext,
    getTime: getTime
  };
})();
