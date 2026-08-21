import miniaudio, wave, io, json, os, sys
import speech_recognition as sr

sys.stdout.reconfigure(encoding='utf-8')
r = sr.Recognizer()

def transcribe_at(decoded, sec, dur=3.5):
    start_s = int(sec * decoded.sample_rate * decoded.nchannels)
    end_s = int((sec + dur) * decoded.sample_rate * decoded.nchannels)
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

def pin_point_starts(master_file, search_ranges):
    decoded = miniaudio.decode_file(master_file)
    print(f"\nScanning {master_file}...", flush=True)
    exact_starts = []
    for q_idx, approx_sec, target_kw in search_ranges:
        best_t = approx_sec
        found = False
        # scan from approx_sec - 15 to approx_sec + 15 in 2s steps
        for t in range(approx_sec - 15, approx_sec + 15, 2):
            txt = transcribe_at(decoded, t, 3.5)
            if any(k in txt for k in target_kw):
                print(f"  Q{q_idx}: Found {target_kw} at {t}s -> '{txt}'", flush=True)
                best_t = t
                found = True
                break
        if not found:
            print(f"  Q{q_idx}: Target {target_kw} not found near {approx_sec}s, using {approx_sec}s", flush=True)
        exact_starts.append((q_idx, best_t))
    return exact_starts

# N5 Vol 1
pin_point_starts('frontend/public/audio/japanese/n5/captured-media-0-mp3.mp3', [
    (1, 160, ['1番', '一番', '始めます']),
    (2, 212, ['2番', '二番']),
    (3, 278, ['3番', '三番']),
    (4, 342, ['4番', '四番']),
    (5, 412, ['5番', '五番']),
    (6, 485, ['6番', '六番']),
    (7, 555, ['7番', '七番']),
])
