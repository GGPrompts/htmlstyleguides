# AI Song Format (No Build Step)

The tracker now accepts two song JSON styles:

1. Full row-by-row format (existing files).
2. Compact event format (recommended for AI-generated songs).

`Tracker.importFull(json)` accepts both and expands compact data at runtime in the browser.

## Compact Event Format

- `rowsPerBeat` or `rpb`
- `patterns[].length` or `patterns[].len`
- `patterns[].channels[ch]` can be:
  - full row cells (legacy), or
  - sparse events with `r`/`row`
- Loop points:
  - `loopStartSeq`
  - `loopEndSeq`

### Event fields

- `r` or `row`: row index in pattern
- `n` or `note`: MIDI note (`-1` for note-off)
- `i` or `inst`: instrument index
- `v` or `vol`: volume (`0..15`, optional)
- `d` or `dur`: optional duration helper in rows (auto note-off inserted)

## Minimal Template

```json
{
  "title": "Temple Loop",
  "bpm": 96,
  "rpb": 4,
  "loopStartSeq": 1,
  "loopEndSeq": 4,
  "instruments": [
    { "name": "Lead", "wave": "square", "a": 0.01, "d": 0.08, "s": 0.6, "r": 0.12, "vol": 0.7 },
    { "name": "Bass", "wave": "triangle", "a": 0.005, "d": 0.05, "s": 0.8, "r": 0.08, "vol": 0.8 },
    { "name": "Pad", "wave": "pulse25", "a": 0.02, "d": 0.15, "s": 0.45, "r": 0.2, "vol": 0.55 },
    { "name": "Perc", "wave": "noise", "a": 0.001, "d": 0.06, "s": 0.0, "r": 0.03, "vol": 0.3 }
  ],
  "patterns": [
    {
      "id": 0,
      "len": 32,
      "name": "Intro",
      "channels": [
        [{ "r": 0, "n": 64, "i": 0, "d": 4 }, { "r": 8, "n": 67, "i": 0, "d": 4 }],
        [{ "r": 0, "n": 40, "i": 1, "d": 8 }],
        [],
        [{ "r": 4, "n": 60, "i": 3 }, { "r": 12, "n": 60, "i": 3 }]
      ]
    },
    {
      "id": 1,
      "len": 32,
      "name": "Loop A",
      "channels": [
        [{ "r": 0, "n": 69, "i": 0, "d": 4 }, { "r": 8, "n": 67, "i": 0, "d": 4 }],
        [{ "r": 0, "n": 45, "i": 1, "d": 8 }],
        [{ "r": 0, "n": 57, "i": 2, "d": 16 }],
        [{ "r": 4, "n": 60, "i": 3 }, { "r": 12, "n": 60, "i": 3 }]
      ]
    }
  ],
  "sequence": [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [1, 1, 1, 1],
    [1, 1, 1, 1],
    [1, 1, 1, 1]
  ]
}
```

## Tips For AI Song Generation

- Keep patterns short (`16` or `32` rows) and reuse via `sequence`.
- Always set `patterns[].len`/`length` explicitly (do not rely on inference).
- Use one intro pattern before loop section.
- Put loop markers on `sequence` rows, not pattern rows.
- For percussion, use sparse events and `noise` instrument.
- Keep note-offs explicit (`n: -1`) when exact gate timing matters.
- For seamless boundaries, let at least one pitched channel sustain or use pickup notes before major section changes.

## Post-Composition: Fix Boundary Gaps

After generating a song, run the boundary gap fixer to smooth pattern transitions:

```bash
python3 music/audio-tracker/tools/fix-boundary-gaps.py --fix music/audio-tracker/songs/your-song.json
```

This scans for silent gaps at pattern boundaries — where a note's `d` ends before the pattern length and the next pattern doesn't immediately start a note — and extends durations to sustain through. Use `--all` to scan the entire library.

## Deep Composition Reference

For music theory, style profiles, chord progressions, and full-length composition guidance, see the chiptune-composer skill:

- `.claude/skills/chiptune-composer/SKILL.md` — workflow, wave types, instrument params, MIDI reference
- `.claude/skills/chiptune-composer/references/style-profiles.md` — 10 genre profiles, counterpoint rules, motivic development, modulation techniques
- `.claude/skills/chiptune-composer/references/chord-cookbook.md` — progressions by mood, cadence types, tempo/key recommendations
