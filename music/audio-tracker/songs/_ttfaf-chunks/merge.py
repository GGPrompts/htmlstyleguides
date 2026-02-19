#!/usr/bin/env python3
"""Merge TTFAF chunks into a single song JSON."""
import json, glob, sys, os

base_dir = os.path.dirname(os.path.abspath(__file__))
master = json.load(open(os.path.join(base_dir, 'instruments.json')))

song = {
    "title": master["title"],
    "bpm": master["bpm"],
    "rpb": master["rpb"],
    "instruments": master["instruments"],
    "patterns": [],
    "sequence": []
}

chunk_files = sorted(glob.glob(os.path.join(base_dir, 'chunk-*.json')))
print(f"Found {len(chunk_files)} chunks")

pattern_offset = 0
for cf in chunk_files:
    chunk = json.load(open(cf))
    num_patterns = len(chunk["patterns"])

    # Remap pattern IDs
    id_map = {}
    for p in chunk["patterns"]:
        old_id = p["id"]
        new_id = old_id + pattern_offset
        id_map[old_id] = new_id
        p["id"] = new_id
        song["patterns"].append(p)

    # Remap sequence references
    for seq_row in chunk["sequence"]:
        song["sequence"].append([id_map.get(ch, ch + pattern_offset) for ch in seq_row])

    print(f"  {os.path.basename(cf)}: {num_patterns} patterns, {len(chunk['sequence'])} seq rows (offset {pattern_offset})")
    pattern_offset += num_patterns

out_path = os.path.join(base_dir, '..', 'through-the-fire-and-flames.json')
with open(out_path, 'w') as f:
    json.dump(song, f, indent=2)

print(f"\nMerged: {len(song['patterns'])} patterns, {len(song['sequence'])} sequence rows")
print(f"Written to: {out_path}")
