import miniaudio, wave, io, json, os, sys
import speech_recognition as sr

sys.stdout.reconfigure(encoding='utf-8')

r = sr.Recognizer()

def transcribe_window(decoded, start_sec, dur_sec):
    start_s = int(start_sec * decoded.sample_rate * decoded.nchannels)
    end_s = int((start_sec + dur_sec) * decoded.sample_rate * decoded.nchannels)
    wav_io = io.BytesIO()
    with wave.open(wav_io, 'wb') as wf:
        wf.setnchannels(decoded.nchannels)
        wf.setsampwidth(2)
        wf.setframerate(decoded.sample_rate)
        wf.writeframes(decoded.samples[start_s:end_s])
    wav_io.seek(0)
    try:
        with sr.AudioFile(wav_io) as src:
            return r.recognize_google(r.record(src), language='ja-JP')
    except Exception:
        return ""

def scan_track_for_questions(track_path, expected_count):
    decoded = miniaudio.decode_file(track_path)
    total_sec = len(decoded.samples) / decoded.sample_rate / decoded.nchannels
    print(f"\n========================================================", flush=True)
    print(f"Scanning {track_path} ({total_sec:.1f}s, expected {expected_count} Qs)", flush=True)
    print(f"========================================================", flush=True)
    
    # 1. First pass: transcribe in 5-second overlapping windows
    timeline = []
    for t in range(0, int(total_sec) - 5, 4):
        txt = transcribe_window(decoded, t, 6.0)
        if txt:
            timeline.append((t, txt))
            # print if mentions number
            for num_kw in ['1番', '2番', '3番', '4番', '5番', '6番', '7番', '8番',
                           '一番', '二番', '三番', '四番', '五番', '六番', '七番', '八番']:
                if num_kw in txt:
                    print(f"  [{t:3d}s - {t+6:3d}s]: {num_kw} -> {txt}", flush=True)
    
    return timeline

# Test scanning N5 Vol 1 and Vol 2 master tracks
tracks = [
    ('frontend/public/audio/japanese/n5/captured-media-0-mp3.mp3', 7),
    ('frontend/public/audio/japanese/n5/captured-media-3-mp3.mp3', 6),
    ('frontend/public/audio/japanese/n5/captured-media-1-mp3.mp3', 5),
    ('frontend/public/audio/japanese/n5/captured-media-2-mp3.mp3', 6),
    ('frontend/public/audio/japanese/n5_2018/N5Q1.mp3', 7),
    ('frontend/public/audio/japanese/n5_2018/N5Q2.mp3', 6),
    ('frontend/public/audio/japanese/n5_2018/N5Q3.mp3', 5),
    ('frontend/public/audio/japanese/n5_2018/N5Q4.mp3', 6),
]

results = {}
for path, count in tracks:
    results[path] = scan_track_for_questions(path, count)

with open('scripts/scanned_timeline_n5.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print("\nScan complete!", flush=True)
