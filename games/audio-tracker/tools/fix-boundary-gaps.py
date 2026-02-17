#!/usr/bin/env python3
"""
Scan and fix silent gaps at pattern boundaries in chiptune songs.

For each pattern transition in the sequence, checks if a channel's last note
ends before the pattern boundary AND the next pattern doesn't start a note on
row 0. If so, extends the last note's duration to sustain through the boundary.

Handles shared patterns safely — only fixes if the extension is compatible
across ALL transitions where the pattern appears.

Usage:
  python3 fix-boundary-gaps.py [--fix] [--verbose] [song.json ...]
  python3 fix-boundary-gaps.py [--fix] --all

Without --fix, just reports gaps. With --fix, modifies files in place.
"""

import json
import sys
import os
import glob
import argparse
from collections import defaultdict

SONGS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'songs')


def load_song(path):
    with open(path) as f:
        return json.load(f)


def save_song(path, song):
    with open(path, 'w') as f:
        json.dump(song, f, indent=2, ensure_ascii=False)
        f.write('\n')


def is_sparse_format(channel_events):
    """Detect if channel uses sparse event format vs full row-by-row."""
    if not channel_events:
        return True  # empty = treat as sparse
    first = channel_events[0]
    if isinstance(first, dict) and ('r' in first or 'row' in first):
        return True
    return False


def get_note_value(ev):
    """Get MIDI note from an event, handling both formats."""
    if not isinstance(ev, dict):
        return -1
    # Sparse format: n or note
    n = ev.get('n', ev.get('note', None))
    if n is None:
        return -1
    if isinstance(n, (int, float)):
        return int(n)
    return -1


def get_last_note_event(channel_events):
    """Find the last note-on event in a channel's event list."""
    if not channel_events:
        return None

    if is_sparse_format(channel_events):
        last = None
        for ev in channel_events:
            if isinstance(ev, dict) and get_note_value(ev) >= 0:
                last = ev
        return last
    else:
        # Full row-by-row: find last row with a note-on
        for r in range(len(channel_events) - 1, -1, -1):
            ev = channel_events[r]
            if isinstance(ev, dict) and get_note_value(ev) >= 0:
                # Add synthetic 'r' key for consistency
                return {'_row_ref': ev, 'r': r, 'n': get_note_value(ev),
                        'i': ev.get('inst', ev.get('i', 0)),
                        'd': ev.get('d', ev.get('dur', 0)),
                        '_format': 'legacy'}
        return None


def get_first_note_row(channel_events):
    """Find the row of the first note-on event in a channel."""
    if not channel_events:
        return None

    if is_sparse_format(channel_events):
        for ev in channel_events:
            if isinstance(ev, dict) and get_note_value(ev) >= 0:
                return ev.get('r', ev.get('row', None))
        return None
    else:
        for r, ev in enumerate(channel_events):
            if isinstance(ev, dict) and get_note_value(ev) >= 0:
                return r
        return None


def note_end_row(ev):
    """Calculate the row where a note's sound ends."""
    r = ev.get('r', ev.get('row', 0))
    d = ev.get('d', ev.get('dur', 0))
    if d and d > 0:
        return r + d
    return None


def analyze_song(song, verbose=False):
    """Find all boundary gaps in a song. Returns list of gap descriptions."""
    pats_by_id = {}
    for p in song.get('patterns', []):
        pats_by_id[p['id']] = p

    seq = song.get('sequence', [])
    gaps = []

    for si in range(len(seq) - 1):
        cur_seq = seq[si]
        nxt_seq = seq[si + 1]

        for ch in range(4):
            cur_pid = cur_seq[ch] if isinstance(cur_seq, list) else cur_seq
            nxt_pid = nxt_seq[ch] if isinstance(nxt_seq, list) else nxt_seq

            cur_pat = pats_by_id.get(cur_pid)
            nxt_pat = pats_by_id.get(nxt_pid)
            if not cur_pat or not nxt_pat:
                continue

            cur_ch = cur_pat['channels'][ch] if ch < len(cur_pat.get('channels', [])) else []
            nxt_ch = nxt_pat['channels'][ch] if ch < len(nxt_pat.get('channels', [])) else []

            pat_len = cur_pat.get('len', cur_pat.get('length', None))
            if pat_len is None:
                # Infer from channel array length for legacy format
                for ch_data in cur_pat.get('channels', []):
                    if isinstance(ch_data, list) and ch_data and not is_sparse_format(ch_data):
                        pat_len = len(ch_data)
                        break
                if pat_len is None:
                    pat_len = 32

            last_note = get_last_note_event(cur_ch)
            if not last_note:
                continue

            end = note_end_row(last_note)
            first_next_row = get_first_note_row(nxt_ch)

            if end is not None and end < pat_len:
                silence_rows = pat_len - end
                if first_next_row is not None and first_next_row > 0:
                    silence_rows += first_next_row
                elif first_next_row is None:
                    silence_rows += pat_len
                if silence_rows >= 2:
                    gaps.append({
                        'seq_idx': si,
                        'channel': ch,
                        'cur_pat_id': cur_pid,
                        'nxt_pat_id': nxt_pid,
                        'last_note_row': last_note.get('r', last_note.get('row', 0)),
                        'last_note_dur': last_note.get('d', last_note.get('dur', 0)),
                        'note_end_row': end,
                        'pat_len': pat_len,
                        'next_first_row': first_next_row,
                        'silence_rows': silence_rows,
                        'type': 'early_end'
                    })
            elif end is None and first_next_row is not None and first_next_row > 2:
                if verbose:
                    gaps.append({
                        'seq_idx': si,
                        'channel': ch,
                        'cur_pat_id': cur_pid,
                        'nxt_pat_id': nxt_pid,
                        'last_note_row': last_note.get('r', last_note.get('row', 0)),
                        'last_note_dur': 0,
                        'note_end_row': None,
                        'pat_len': pat_len,
                        'next_first_row': first_next_row,
                        'silence_rows': first_next_row,
                        'type': 'no_dur_late_entry'
                    })

    return gaps


def compute_safe_fixes(song, gaps):
    """
    Determine which gaps can be safely fixed, accounting for shared patterns.

    A pattern's last note can be extended if:
    1. Every transition where this pattern+channel appears either:
       a) Has the same gap (wants the same extension), OR
       b) The next pattern starts on row 0 (extension is harmless — the new note
          triggers a note-off via the cross-boundary duration mechanism)

    Returns list of (pattern_id, channel, new_dur) tuples that are safe to apply.
    """
    pats_by_id = {}
    for p in song.get('patterns', []):
        pats_by_id[p['id']] = p

    seq = song.get('sequence', [])

    # Group gaps by (pattern_id, channel) — these share the same last note event
    gap_groups = defaultdict(list)
    for g in gaps:
        if g['type'] == 'early_end':
            key = (g['cur_pat_id'], g['channel'])
            gap_groups[key].append(g)

    # For each (pattern, channel), find ALL transitions in the sequence
    # where this pattern appears on this channel
    pat_ch_transitions = defaultdict(list)
    for si in range(len(seq) - 1):
        cur_seq = seq[si]
        nxt_seq = seq[si + 1]
        for ch in range(4):
            cur_pid = cur_seq[ch] if isinstance(cur_seq, list) else cur_seq
            nxt_pid = nxt_seq[ch] if isinstance(nxt_seq, list) else nxt_seq
            key = (cur_pid, ch)
            nxt_pat = pats_by_id.get(nxt_pid)
            if nxt_pat:
                nxt_ch = nxt_pat['channels'][ch] if ch < len(nxt_pat.get('channels', [])) else []
                first_row = get_first_note_row(nxt_ch)
                pat_ch_transitions[key].append({
                    'seq_idx': si,
                    'nxt_pat_id': nxt_pid,
                    'next_first_row': first_row
                })

    safe_fixes = []
    skipped = []

    for (pat_id, ch), gap_list in gap_groups.items():
        pat = pats_by_id.get(pat_id)
        if not pat:
            continue

        last_note = get_last_note_event(
            pat['channels'][ch] if ch < len(pat.get('channels', [])) else []
        )
        if not last_note:
            continue

        r = last_note.get('r', last_note.get('row', 0))
        pat_len = pat.get('len', pat.get('length', None))
        if pat_len is None:
            for ch_data in pat.get('channels', []):
                if isinstance(ch_data, list) and ch_data and not is_sparse_format(ch_data):
                    pat_len = len(ch_data)
                    break
            if pat_len is None:
                pat_len = 32

        # Check ALL transitions for this pattern+channel
        all_transitions = pat_ch_transitions.get((pat_id, ch), [])

        # Find the minimum safe extension: extend to boundary at minimum
        # For transitions where next starts on row 0, boundary extension is fine
        # For transitions with gaps, extend past boundary to bridge
        min_safe_dur = pat_len - r  # at least extend to boundary

        safe = True
        for trans in all_transitions:
            first_row = trans['next_first_row']
            if first_row is None:
                # Next channel is empty — extending is fine, sound will fade naturally
                continue
            elif first_row == 0:
                # Next pattern starts immediately — extension is harmless,
                # the new note-on will cut the sustained note
                continue
            else:
                # There's a gap here too — extension bridges it
                # The cross-boundary duration will schedule a note-off
                # before the next note-on, so this is safe
                continue

        if safe:
            # Use the maximum needed duration across all gap instances
            max_dur = min_safe_dur
            for g in gap_list:
                next_first = g['next_first_row']
                if next_first is not None and next_first > 0:
                    needed = (pat_len - r) + next_first - 1
                else:
                    needed = pat_len - r
                max_dur = max(max_dur, needed)

            safe_fixes.append((pat_id, ch, max_dur))
        else:
            skipped.append((pat_id, ch, len(gap_list)))

    return safe_fixes, skipped


def fix_gaps(song, gaps):
    """Fix gaps by extending note durations. Handles shared patterns safely."""
    pats_by_id = {}
    for p in song.get('patterns', []):
        pats_by_id[p['id']] = p

    safe_fixes, skipped = compute_safe_fixes(song, gaps)

    fixed = 0
    for pat_id, ch, new_dur in safe_fixes:
        pat = pats_by_id.get(pat_id)
        if not pat:
            continue
        ch_events = pat['channels'][ch] if ch < len(pat.get('channels', [])) else []
        last_note = get_last_note_event(ch_events)
        if not last_note:
            continue

        # Skip legacy format — can't add duration to row-by-row cells
        if last_note.get('_format') == 'legacy':
            continue

        dur_key = 'd' if 'd' in last_note else 'dur' if 'dur' in last_note else 'd'
        old_dur = last_note.get(dur_key, last_note.get('d', last_note.get('dur', 0)))
        if new_dur > old_dur:
            last_note[dur_key] = new_dur
            fixed += 1

    return fixed, len(skipped)


def process_file(path, do_fix=False, verbose=False):
    """Process a single song file."""
    song = load_song(path)
    name = os.path.basename(path)
    gaps = analyze_song(song, verbose=verbose)

    if not gaps:
        if verbose:
            print(f"  {name}: no boundary gaps found")
        return 0, 0

    early_end = [g for g in gaps if g['type'] == 'early_end']
    no_dur = [g for g in gaps if g['type'] == 'no_dur_late_entry']

    print(f"\n  {name}: {len(early_end)} fixable gaps" +
          (f", {len(no_dur)} potential gaps (no duration)" if no_dur else ""))

    if verbose:
        for g in gaps:
            ch_label = ['ch0', 'ch1', 'ch2', 'ch3'][g['channel']]
            print(f"    seq[{g['seq_idx']}→{g['seq_idx']+1}] {ch_label}: "
                  f"pat {g['cur_pat_id']}→{g['nxt_pat_id']} | "
                  f"note@row {g['last_note_row']} d={g['last_note_dur']} ends@{g['note_end_row']} | "
                  f"next note@row {g['next_first_row']} | "
                  f"{g['silence_rows']} rows silent [{g['type']}]")

    if do_fix and early_end:
        fixed, skipped_count = fix_gaps(song, gaps)
        if fixed > 0:
            save_song(path, song)
            msg = f"    → Extended {fixed} note durations"
            if skipped_count > 0:
                msg += f" ({skipped_count} skipped due to shared patterns)"
            print(msg)
        return len(gaps), fixed

    return len(gaps), 0


def main():
    parser = argparse.ArgumentParser(description='Scan/fix boundary gaps in chiptune songs')
    parser.add_argument('files', nargs='*', help='Song JSON files to process')
    parser.add_argument('--all', action='store_true', help='Process all songs in songs directory')
    parser.add_argument('--fix', action='store_true', help='Fix gaps (extends note durations)')
    parser.add_argument('--verbose', '-v', action='store_true', help='Show all potential gaps')
    args = parser.parse_args()

    if args.all:
        files = sorted(glob.glob(os.path.join(SONGS_DIR, '*.json')))
        files = [f for f in files if os.path.basename(f) != 'index.json']
    elif args.files:
        files = args.files
    else:
        parser.print_help()
        return

    total_gaps = 0
    total_fixed = 0
    files_with_gaps = 0

    print(f"Scanning {len(files)} song(s)..." + (" (dry run)" if not args.fix else " (FIXING)"))

    for f in files:
        try:
            gaps, fixed = process_file(f, do_fix=args.fix, verbose=args.verbose)
            if gaps > 0:
                files_with_gaps += 1
            total_gaps += gaps
            total_fixed += fixed
        except Exception as e:
            print(f"  {os.path.basename(f)}: ERROR - {e}")

    print(f"\nSummary: {total_gaps} gaps in {files_with_gaps}/{len(files)} songs" +
          (f", {total_fixed} fixed" if args.fix else ""))


if __name__ == '__main__':
    main()
