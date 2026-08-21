import miniaudio, wave, io, json, os, sys
import speech_recognition as sr

sys.stdout.reconfigure(encoding='utf-8')
r = sr.Recognizer()

def transcribe_window(decoded, start_sec, dur_sec=4.0):
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

def scan_track(path, expected_count):
    decoded = miniaudio.decode_file(path)
    total_sec = len(decoded.samples) / decoded.sample_rate / decoded.nchannels
    print(f"\n========================================================", flush=True)
    print(f"Scanning {path} ({total_sec:.1f}s)", flush=True)
    print(f"========================================================", flush=True)

    found_markers = {}
    target_nums = [f"{i}番" for i in range(1, expected_count + 1)]
    target_kanji = ["一番", "二番", "三番", "四番", "五番", "六番", "七番", "八番"][:expected_count]

    for t in range(50, int(total_sec) - 4, 3):
        txt = transcribe_window(decoded, t, 4.0)
        if not txt:
            continue
        for idx in range(expected_count):
            k1 = target_nums[idx]
            k2 = target_kanji[idx]
            q_num = idx + 1
            if q_num not in found_markers and (k1 in txt or k2 in txt):
                print(f"  --> Q{q_num} START DETECTED at {t}s: '{txt}'", flush=True)
                found_markers[q_num] = t
                break

    return found_markers

all_tracks = [
    ('n5_v1_m1', 'frontend/public/audio/japanese/n5/captured-media-0-mp3.mp3', 7),
    ('n5_v1_m2', 'frontend/public/audio/japanese/n5/captured-media-3-mp3.mp3', 6),
    ('n5_v1_m3', 'frontend/public/audio/japanese/n5/captured-media-1-mp3.mp3', 5),
    ('n5_v1_m4', 'frontend/public/audio/japanese/n5/captured-media-2-mp3.mp3', 6),

    ('n5_v2_m1', 'frontend/public/audio/japanese/n5_2018/N5Q1.mp3', 7),
    ('n5_v2_m2', 'frontend/public/audio/japanese/n5_2018/N5Q2.mp3', 6),
    ('n5_v2_m3', 'frontend/public/audio/japanese/n5_2018/N5Q3.mp3', 5),
    ('n5_v2_m4', 'frontend/public/audio/japanese/n5_2018/N5Q4.mp3', 6),

    ('n4_v1_m1', 'frontend/public/audio/japanese/n4/captured-media-0-mp3.mp3', 8),
    ('n4_v1_m2', 'frontend/public/audio/japanese/n4/captured-media-1-mp3.mp3', 7),
    ('n4_v1_m3', 'frontend/public/audio/japanese/n4/captured-media-2-mp3.mp3', 5),
    ('n4_v1_m4', 'frontend/public/audio/japanese/n4/captured-media-3-mp3.mp3', 8),

    ('n4_v2_m1', 'frontend/public/audio/japanese/n4_2018/N4Q1.mp3', 8),
    ('n4_v2_m2', 'frontend/public/audio/japanese/n4_2018/N4Q2.mp3', 7),
    ('n4_v2_m3', 'frontend/public/audio/japanese/n4_2018/N4Q3.mp3', 5),
    ('n4_v2_m4', 'frontend/public/audio/japanese/n4_2018/N4Q4.mp3', 8),
]

exact_starts_all = {}
for name, path, count in all_tracks:
    exact_starts_all[name] = {
        'file': path,
        'count': count,
        'starts': scan_track(path, count)
    }

with open('scripts/all_exact_starts.json', 'w', encoding='utf-8') as f:
    json.dump(exact_starts_all, f, ensure_ascii=False, indent=2)

print("\nSaved all exact starts to scripts/all_exact_starts.json!", flush=True)
