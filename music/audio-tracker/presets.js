// Instrument presets and demo song for the chiptune tracker.
// Plain JS -- no imports, no fetch. Consumed via the global `Presets` object.

const Presets = {

  // -----------------------------------------------------------------------
  //  Instruments
  // -----------------------------------------------------------------------
  instruments: [

    // --- 8-bit (NES-style) -----------------------------------------------

    { // 0
      name: "NES Pulse 50%",
      wave: "square",
      detune: 0,
      detuneOsc: false,
      detuneAmount: 0,
      attack: 0.005, decay: 0.15, sustain: 0.4, release: 0.08,
      filterType: "none",
      filterFreq: 2000, filterQ: 1,
      volume: 0.7
    },
    { // 1
      name: "NES Pulse 25%",
      wave: "pulse25",
      detune: 0,
      detuneOsc: false,
      detuneAmount: 0,
      attack: 0.005, decay: 0.12, sustain: 0.35, release: 0.08,
      filterType: "none",
      filterFreq: 2000, filterQ: 1,
      volume: 0.6
    },
    { // 2
      name: "NES Triangle",
      wave: "triangle",
      detune: 0,
      detuneOsc: false,
      detuneAmount: 0,
      attack: 0.005, decay: 0.2, sustain: 0.7, release: 0.1,
      filterType: "none",
      filterFreq: 2000, filterQ: 1,
      volume: 0.8
    },
    { // 3
      name: "NES Noise Kick",
      wave: "noise",
      detune: 0,
      detuneOsc: false,
      detuneAmount: 0,
      attack: 0.002, decay: 0.12, sustain: 0.0, release: 0.04,
      filterType: "lowpass",
      filterFreq: 350, filterQ: 5,
      volume: 0.95
    },
    { // 4
      name: "NES Noise Snare",
      wave: "noise",
      detune: 0,
      detuneOsc: false,
      detuneAmount: 0,
      attack: 0.002, decay: 0.1, sustain: 0.0, release: 0.05,
      filterType: "bandpass",
      filterFreq: 1500, filterQ: 1,
      volume: 0.8
    },
    { // 5
      name: "NES Noise Hi-Hat",
      wave: "noise",
      detune: 0,
      detuneOsc: false,
      detuneAmount: 0,
      attack: 0.001, decay: 0.06, sustain: 0.0, release: 0.03,
      filterType: "highpass",
      filterFreq: 5000, filterQ: 2,
      volume: 0.7
    },

    // --- 16-bit (SNES-style) ---------------------------------------------

    { // 6
      name: "SNES Lead",
      wave: "sawtooth",
      detune: 0,
      detuneOsc: true,
      detuneAmount: 8,
      attack: 0.01, decay: 0.15, sustain: 0.55, release: 0.12,
      filterType: "none",
      filterFreq: 2000, filterQ: 1,
      volume: 0.7
    },
    { // 7
      name: "SNES Pad",
      wave: "sine",
      detune: 0,
      detuneOsc: false,
      detuneAmount: 0,
      attack: 0.3, decay: 0.5, sustain: 0.8, release: 0.4,
      filterType: "none",
      filterFreq: 2000, filterQ: 1,
      volume: 0.6
    },
    { // 8
      name: "Power Bass",
      wave: "sawtooth",
      detune: 0,
      detuneOsc: false,
      detuneAmount: 0,
      attack: 0.005, decay: 0.18, sustain: 0.5, release: 0.08,
      filterType: "lowpass",
      filterFreq: 800, filterQ: 2,
      volume: 0.85
    },

    // --- Organ Stops (from Gemini's Cyber-Cathedral Requiem) ----------------

    { // 9
      name: "Organ Principal",
      wave: "pulse25",
      detune: 0,
      detuneOsc: false,
      detuneAmount: 0,
      attack: 0.02, decay: 0.1, sustain: 0.7, release: 0.2,
      filterType: "lowpass",
      filterFreq: 2500, filterQ: 1,
      volume: 0.6
    },
    { // 10
      name: "Organ Pedal",
      wave: "triangle",
      detune: 0,
      detuneOsc: false,
      detuneAmount: 0,
      attack: 0.05, decay: 0.2, sustain: 0.9, release: 0.3,
      filterType: "none",
      filterFreq: 2000, filterQ: 1,
      volume: 0.9
    },
    { // 11
      name: "Organ Reeds",
      wave: "square",
      detune: 0,
      detuneOsc: true,
      detuneAmount: 7,
      attack: 0.1, decay: 0.2, sustain: 0.7, release: 0.4,
      filterType: "none",
      filterFreq: 2000, filterQ: 1,
      volume: 0.5
    },
    { // 12
      name: "Organ Flute",
      wave: "sine",
      detune: 0,
      detuneOsc: true,
      detuneAmount: 4,
      attack: 0.4, decay: 0.5, sustain: 0.6, release: 0.8,
      filterType: "none",
      filterFreq: 2000, filterQ: 1,
      volume: 0.5
    }
  ],

  // -----------------------------------------------------------------------
  //  Demo Song  --  "Chip Demo"
  //
  //  Key of C major, 140 BPM, 16-row patterns.
  //  Ch 0 = melody   (NES Pulse 50%)
  //  Ch 1 = harmony  (NES Pulse 25%)
  //  Ch 2 = bass     (NES Triangle)
  //  Ch 3 = drums    (Kick / Snare / Hi-Hat)
  //
  //  Instruments indices 0-5 map to the 8-bit set above.
  //  Drum "notes" are arbitrary (the noise instruments ignore pitch);
  //  we use 48 for kick, 60 for snare, 72 for hi-hat by convention.
  // -----------------------------------------------------------------------
  demoSong: {
    title: "Chip Demo",
    bpm: 140,
    rowsPerBeat: 4,
    channels: 4,

    instruments: [
      { // 0 - melody
        name: "NES Pulse 50%",
        wave: "square",
        detune: 0, detuneOsc: false, detuneAmount: 0,
        attack: 0.005, decay: 0.15, sustain: 0.4, release: 0.08,
        filterType: "none", filterFreq: 2000, filterQ: 1,
        volume: 0.7
      },
      { // 1 - harmony
        name: "NES Pulse 25%",
        wave: "pulse25",
        detune: 0, detuneOsc: false, detuneAmount: 0,
        attack: 0.005, decay: 0.12, sustain: 0.35, release: 0.08,
        filterType: "none", filterFreq: 2000, filterQ: 1,
        volume: 0.6
      },
      { // 2 - bass
        name: "NES Triangle",
        wave: "triangle",
        detune: 0, detuneOsc: false, detuneAmount: 0,
        attack: 0.005, decay: 0.2, sustain: 0.7, release: 0.1,
        filterType: "none", filterFreq: 2000, filterQ: 1,
        volume: 0.8
      },
      { // 3 - kick
        name: "NES Noise Kick",
        wave: "noise",
        detune: 0, detuneOsc: false, detuneAmount: 0,
        attack: 0.002, decay: 0.12, sustain: 0.0, release: 0.04,
        filterType: "lowpass", filterFreq: 350, filterQ: 5,
        volume: 0.95
      },
      { // 4 - snare
        name: "NES Noise Snare",
        wave: "noise",
        detune: 0, detuneOsc: false, detuneAmount: 0,
        attack: 0.002, decay: 0.1, sustain: 0.0, release: 0.05,
        filterType: "bandpass", filterFreq: 1500, filterQ: 1,
        volume: 0.8
      },
      { // 5 - hi-hat
        name: "NES Noise Hi-Hat",
        wave: "noise",
        detune: 0, detuneOsc: false, detuneAmount: 0,
        attack: 0.001, decay: 0.06, sustain: 0.0, release: 0.03,
        filterType: "highpass", filterFreq: 5000, filterQ: 2,
        volume: 0.7
      }
    ],

    // --- Helper: shorthand note cell factory (used below) -----------------
    // (Not part of the data -- callers should ignore this if serialising.)

    patterns: (function () {
      // Shorthand builders
      function n(note, inst) {
        return { note: note, inst: inst, vol: null, fx: null };
      }
      var _ = null; // empty cell

      // MIDI note names for readability
      var C3 = 48, D3 = 50, E3 = 52, F3 = 53, G3 = 55, A3 = 57, B3 = 59;
      var C4 = 60, D4 = 62, E4 = 64, F4 = 65, G4 = 67, A4 = 69, B4 = 71;
      var C5 = 72, D5 = 74, E5 = 76;

      // Drum convention notes (pitch ignored by noise)
      var KK = 48;  // kick
      var SN = 60;  // snare
      var HH = 72;  // hi-hat

      // ---- Pattern 0 : Intro / verse ------------------------------------
      //   Upbeat melody over C-Am-F-G progression
      var p0 = [
        // row 0
        [ n(E4, 0), n(C4, 1), n(C3, 2), n(KK, 3) ],
        // row 1
        [ _,         _,         _,         n(HH, 5) ],
        // row 2
        [ n(G4, 0), n(E4, 1), _,         n(HH, 5) ],
        // row 3
        [ _,         _,         _,         n(HH, 5) ],
        // row 4
        [ n(A4, 0), n(E4, 1), n(A3, 2), n(SN, 4) ],
        // row 5
        [ _,         _,         _,         n(HH, 5) ],
        // row 6
        [ n(G4, 0), n(C4, 1), _,         n(HH, 5) ],
        // row 7
        [ _,         _,         _,         n(HH, 5) ],
        // row 8
        [ n(F4, 0), n(A3, 1), n(F3, 2), n(KK, 3) ],
        // row 9
        [ n(E4, 0), _,         _,         n(HH, 5) ],
        // row 10
        [ n(D4, 0), n(F4, 1), _,         n(KK, 3) ],
        // row 11
        [ _,         _,         _,         n(HH, 5) ],
        // row 12
        [ n(E4, 0), n(B3, 1), n(G3, 2), n(SN, 4) ],
        // row 13
        [ n(D4, 0), _,         _,         n(HH, 5) ],
        // row 14
        [ n(C4, 0), n(G4, 1), _,         n(HH, 5) ],
        // row 15
        [ _,         _,         _,         n(KK, 3) ]
      ];

      // ---- Pattern 1 : Chorus -------------------------------------------
      //   Higher energy, jump up to C5, driving bass
      var p1 = [
        // row 0
        [ n(C5, 0), n(E4, 1), n(C3, 2), n(KK, 3) ],
        // row 1
        [ _,         _,         _,         n(HH, 5) ],
        // row 2
        [ n(B4, 0), n(G4, 1), n(C3, 2), n(SN, 4) ],
        // row 3
        [ _,         _,         _,         n(HH, 5) ],
        // row 4
        [ n(A4, 0), n(E4, 1), n(A3, 2), n(KK, 3) ],
        // row 5
        [ n(G4, 0), _,         _,         n(HH, 5) ],
        // row 6
        [ n(A4, 0), n(C4, 1), n(A3, 2), n(SN, 4) ],
        // row 7
        [ _,         _,         _,         n(HH, 5) ],
        // row 8
        [ n(G4, 0), n(F4, 1), n(F3, 2), n(KK, 3) ],
        // row 9
        [ n(F4, 0), _,         _,         n(HH, 5) ],
        // row 10
        [ n(E4, 0), n(A4, 1), n(F3, 2), n(SN, 4) ],
        // row 11
        [ _,         _,         _,         n(HH, 5) ],
        // row 12
        [ n(D4, 0), n(G4, 1), n(G3, 2), n(KK, 3) ],
        // row 13
        [ n(E4, 0), _,         _,         n(HH, 5) ],
        // row 14
        [ n(F4, 0), n(B4, 1), n(G3, 2), n(SN, 4) ],
        // row 15
        [ n(G4, 0), _,         _,         n(KK, 3) ]
      ];

      // ---- Pattern 2 : Ending / turnaround ------------------------------
      //   Descending line resolving to root
      var p2 = [
        // row 0
        [ n(E5, 0), n(C4, 1), n(C3, 2), n(KK, 3) ],
        // row 1
        [ n(D5, 0), _,         _,         n(HH, 5) ],
        // row 2
        [ n(C5, 0), n(E4, 1), _,         n(SN, 4) ],
        // row 3
        [ n(B4, 0), _,         _,         n(HH, 5) ],
        // row 4
        [ n(A4, 0), n(C4, 1), n(F3, 2), n(KK, 3) ],
        // row 5
        [ n(G4, 0), _,         _,         n(HH, 5) ],
        // row 6
        [ n(F4, 0), n(A3, 1), _,         n(SN, 4) ],
        // row 7
        [ n(E4, 0), _,         _,         n(HH, 5) ],
        // row 8
        [ n(D4, 0), n(G4, 1), n(G3, 2), n(KK, 3) ],
        // row 9
        [ _,         _,         _,         n(HH, 5) ],
        // row 10
        [ n(E4, 0), n(B3, 1), n(G3, 2), n(SN, 4) ],
        // row 11
        [ _,         _,         _,         n(HH, 5) ],
        // row 12
        [ n(C4, 0), n(E4, 1), n(C3, 2), n(KK, 3) ],
        // row 13
        [ _,         n(G4, 1), _,         _ ],
        // row 14
        [ _,         n(C5, 1), _,         n(SN, 4) ],
        // row 15
        [ _,         _,         _,         _ ]
      ];

      return [p0, p1, p2];
    })(),

    // Sequence: verse x2, chorus, verse, chorus, ending
    sequence: [0, 0, 1, 0, 1, 2]
  }
};
