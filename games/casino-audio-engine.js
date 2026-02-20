// Casino Audio Engine — shared tone synthesis for casino games
// Usage: CasinoAudio.init(), CasinoAudio.play('soundName'), CasinoAudio.register('name', fn)
(function() {
    'use strict';

    var ctx = null;
    var sounds = {};

    function init() {
        if (ctx) return;
        ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    function ensureCtx() {
        try {
            if (!ctx) init();
            if (ctx && ctx.state === 'suspended') ctx.resume();
        } catch(e) {}
        return ctx;
    }

    function _osc(freq, type, start, dur, gain) {
        var o = ctx.createOscillator();
        var g = ctx.createGain();
        o.type = type;
        o.frequency.setValueAtTime(freq, start);
        g.gain.setValueAtTime(gain, start);
        g.gain.exponentialRampToValueAtTime(0.001, start + dur);
        o.connect(g); g.connect(ctx.destination);
        o.start(start); o.stop(start + dur);
    }

    function _noise(start, dur, gain) {
        var buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
        var data = buf.getChannelData(0);
        for (var i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
        var src = ctx.createBufferSource();
        var g = ctx.createGain();
        src.buffer = buf;
        g.gain.setValueAtTime(gain, start);
        g.gain.exponentialRampToValueAtTime(0.001, start + dur);
        src.connect(g); g.connect(ctx.destination);
        src.start(start); src.stop(start + dur);
    }

    function play(type) {
        if (!ensureCtx()) return;
        var fn = sounds[type];
        if (fn) {
            try { fn(ctx.currentTime, _osc, _noise, ctx); } catch(e) {}
        }
    }

    function register(name, fn) {
        sounds[name] = fn;
    }

    // ==================== Common Sounds ====================

    // Card flip — used by Video Poker, Solitaire
    register('flip', function(t, osc, noise) {
        noise(t, 0.08, 0.1);
        osc(600, 'sine', t, 0.04, 0.05);
    });

    // Card snap / place — used by Video Poker (deal), Solitaire (place)
    register('deal', function(t, osc, noise) {
        noise(t, 0.06, 0.15);
    });
    register('place', function(t, osc, noise) {
        noise(t, 0.06, 0.15);
    });

    // UI click — used by Slots, Video Poker
    register('click', function(t, osc) {
        osc(800 + Math.random() * 400, 'square', t, 0.03, 0.04);
    });
    register('buttonClick', function(t, osc) {
        osc(1200, 'square', t, 0.04, 0.05);
    });

    // Win jingle — used by Video Poker, Slots, Solitaire
    register('win', function(t, osc) {
        var notes = [523, 659, 784, 1047];
        notes.forEach(function(f, i) {
            osc(f, 'sine', t + i * 0.12, 0.2, 0.1);
            osc(f * 1.5, 'triangle', t + i * 0.12, 0.15, 0.04);
        });
    });

    // Fanfare — used by Solitaire (same C-E-G-C progression, slightly different timing)
    register('fanfare', function(t, osc, noise, audioCtx) {
        var notes = [523, 659, 784, 1047];
        notes.forEach(function(freq, i) {
            osc(freq, 'square', t + i * 0.15, 0.4, 0.08);
            osc(freq, 'sine', t + i * 0.15, 0.5, 0.06);
        });
    });

    // Coin ding — used by Video Poker
    register('coin', function(t, osc) {
        osc(2200, 'sine', t, 0.1, 0.08);
        osc(2800, 'sine', t + 0.06, 0.12, 0.06);
    });

    window.CasinoAudio = {
        init: init,
        play: play,
        register: register
    };
})();
