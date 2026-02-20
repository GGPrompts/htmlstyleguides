/* base-renderer.js — factory for music video renderer boilerplate
 *
 * Eliminates the repeated W/H/analysis/lastBeat/beatPulse/flashAlpha
 * declarations and beat-detection logic found in every video renderer.
 *
 * PATTERN A — Closure-friendly (recommended for converting existing renderers):
 *
 *   BaseRenderer('my-slug', 'Display Name', {
 *     beatDecay: 8,       // optional, default 8
 *     flashDecay: 5,      // optional, default 5 (0 to disable)
 *
 *     init: function(W, H, analysis) { ... },
 *     resize: function(W, H) { ... },             // optional
 *     destroy: function() { ... },                 // optional
 *
 *     // render receives the pre-computed beat info + full frameData
 *     render: function(ctx, W, H, frameData, beat) { ... }
 *   });
 *
 *   beat object: { pulse, flash, changed, num, dt }
 *     pulse   — 0-1, set to 1 on beat change, decays each frame
 *     flash   — 0-1, renderer sets this, factory auto-decays
 *     changed — true on the frame a new beat arrives
 *     num     — current beat number from cursor.beat
 *     dt      — delta time in seconds
 *
 *   To trigger a flash from inside render():
 *     beat.flash = Math.max(beat.flash, 0.3);
 *
 * Renderers keep their own closure variables for all scene-specific state.
 * The factory only manages: W, H, analysis, lastBeat, beatPulse, flashAlpha.
 *
 * PATTERN B — Stateless config (for simple new renderers):
 *
 *   Same as above but init/resize/render can also receive a `state` object
 *   if you provide a `state: function(W, H) { return {...}; }` callback.
 *   The state is reset on each init() call.
 */
(function() {
    'use strict';

    window.BaseRenderer = function(slug, displayName, config) {
        var W = 0, H = 0;
        var analysis = null;
        var lastBeat = -1;
        var beatPulse = 0;
        var flashAlpha = 0;

        var beatDecay = config.beatDecay !== undefined ? config.beatDecay : 8;
        var flashDecay = config.flashDecay !== undefined ? config.flashDecay : 5;
        var useExpDecay = config.expDecay !== undefined ? config.expDecay : true;

        // Shared beat object — reused each frame to avoid allocation
        var beat = { pulse: 0, flash: 0, changed: false, num: 0, dt: 0 };

        window.Renderers[slug] = {
            name: displayName,

            init: function(ctx, w, h, anal) {
                W = w; H = h;
                analysis = anal;
                lastBeat = -1;
                beatPulse = 0;
                flashAlpha = 0;
                if (config.init) {
                    config.init(W, H, analysis);
                }
            },

            resize: function(w, h) {
                W = w; H = h;
                if (config.resize) {
                    config.resize(W, H);
                }
            },

            render: function(frameData) {
                var ctx = frameData.ctx;
                var dt = frameData.dt || 1 / 60;
                var cursor = frameData.cursor;

                // Beat detection
                var beatChanged = false;
                var beatNum = lastBeat;
                if (cursor) {
                    beatNum = cursor.beat;
                    if (beatNum !== lastBeat) {
                        beatChanged = true;
                        beatPulse = 1;
                        lastBeat = beatNum;
                    }
                }

                // Decay
                if (useExpDecay) {
                    beatPulse *= Math.exp(-beatDecay * dt);
                    if (flashDecay) flashAlpha *= Math.exp(-flashDecay * dt);
                } else {
                    beatPulse *= beatDecay;
                    if (flashDecay) flashAlpha *= flashDecay;
                }

                // Populate beat object
                beat.pulse = beatPulse;
                beat.flash = flashAlpha;
                beat.changed = beatChanged;
                beat.num = beatNum;
                beat.dt = dt;

                // Call renderer
                config.render(ctx, W, H, frameData, beat);

                // Read back flash (renderer may have modified it)
                flashAlpha = beat.flash;
            },

            destroy: function() {
                if (config.destroy) {
                    config.destroy();
                }
            }
        };
    };
})();
