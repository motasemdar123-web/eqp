import json
import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('scripts/official_audio_transcripts.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for path, info in data.items():
    dur = info['duration']
    print(f"\n=== {path} ({dur:.1f}s) ===")
    for ch in info['chunks']:
        txt = ch['text']
        s = ch['start']
        e = ch['end']
        for kw in ['1番', '2番', '3番', '4番', '5番', '6番', '7番', '8番', '一番', '二番', '三番', '四番', '五番', '六番', '七番', '八番']:
            if kw in txt:
                print(f"  [{s:3d}s - {e:3d}s]: {kw} -> {txt}")
