#!/usr/bin/env python3
"""Extract the sustaining notes from the last pattern of a chunk for handoff."""
import json, sys

chunk = json.load(open(sys.argv[1]))
# Get the last sequence row to find which patterns are playing last
last_seq = chunk["sequence"][-1]
patterns_by_id = {p["id"]: p for p in chunk["patterns"]}

handoff = {}
for ch_idx, pat_id in enumerate(last_seq):
    pat = patterns_by_id[pat_id]
    pat_len = pat.get("len", pat.get("length", 32))
    events = pat["channels"][ch_idx] if ch_idx < len(pat["channels"]) else []

    # Find the last sounding note (not a note-off)
    last_note = None
    for ev in events:
        row = ev.get("r", ev.get("row", 0))
        note = ev.get("n", ev.get("note", -1))
        inst = ev.get("i", ev.get("inst", 0))
        vol = ev.get("v", ev.get("vol", 12))
        dur = ev.get("d", ev.get("dur", 4))

        if note > 0:  # Not a note-off
            last_note = {"note": note, "inst": inst, "vol": vol, "row": row, "dur": dur,
                         "sustains_past": (row + dur) > pat_len}

    if last_note and last_note["sustains_past"]:
        handoff[f"ch{ch_idx}"] = {"note": last_note["note"], "inst": last_note["inst"], "vol": last_note["vol"]}
    elif last_note:
        handoff[f"ch{ch_idx}"] = {"note": last_note["note"], "inst": last_note["inst"], "vol": last_note["vol"], "ended": True}
    else:
        handoff[f"ch{ch_idx}"] = None

print(json.dumps(handoff, indent=2))
