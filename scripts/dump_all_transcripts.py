import json, sys

with open('scripts/official_audio_transcripts.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

with open('scripts/full_transcript_timeline_utf8.txt', 'w', encoding='utf-8') as out:
    for path, info in data.items():
        dur = info['duration']
        out.write(f"\n========================================================\n")
        out.write(f"FILE: {path} (Total: {dur:.1f}s)\n")
        out.write(f"========================================================\n")
        for ch in info['chunks']:
            s = int(ch['start'])
            e = int(ch['end'])
            txt = ch['text']
            out.write(f"  [{s:3d}s - {e:3d}s]: {txt}\n")

print("Saved full_transcript_timeline_utf8.txt!")
