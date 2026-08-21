import miniaudio, wave, io, json, os, sys, math
import speech_recognition as sr

sys.stdout.reconfigure(encoding='utf-8')
r = sr.Recognizer()

def get_rms_envelope(samples, sample_rate, window_ms=200):
    window_samples = int(sample_rate * (window_ms / 1000.0))
    rms_list = []
    for i in range(0, len(samples), window_samples):
        chunk = samples[i:i+window_samples]
        if not chunk:
            continue
        sum_sq = sum(s * s for s in chunk)
        rms = math.sqrt(sum_sq / len(chunk))
        rms_list.append((i / sample_rate, rms))
    return rms_list

def transcribe_clip(decoded, start_sec, dur_sec):
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

def locate_question_starts(track_path):
    decoded = miniaudio.decode_file(track_path)
    total_sec = len(decoded.samples) / decoded.sample_rate / decoded.nchannels
    print(f"\n==================================================", flush=True)
    print(f"Analyzing {track_path} ({total_sec:.1f}s)", flush=True)
    print(f"==================================================", flush=True)

    # Sample speech every 10 seconds to find general region of 1番, 2番, etc.
    markers = []
    # Test every 10 seconds with 8s window
    for t in range(0, int(total_sec) - 8, 8):
        txt = transcribe_clip(decoded, t, 8.0)
        for kw in ['1番', '2番', '3番', '4番', '5番', '6番', '7番', '8番',
                   '一番', '二番', '三番', '四番', '五番', '六番', '七番', '八番',
                   '問題1', '問題2', '問題3', '問題4', '始めます']:
            if kw in txt:
                print(f"  Approx marker at {t}s: [{kw}] -> {txt}", flush=True)
                markers.append((t, kw, txt))

    return markers

# Test N5 Vol 1 tracks
print("--- N5 Vol 1 Master Tracks ---", flush=True)
locate_question_starts('frontend/public/audio/japanese/n5/captured-media-0-mp3.mp3') # M1
locate_question_starts('frontend/public/audio/japanese/n5/captured-media-3-mp3.mp3') # M2
locate_question_starts('frontend/public/audio/japanese/n5/captured-media-1-mp3.mp3') # M3
locate_question_starts('frontend/public/audio/japanese/n5/captured-media-2-mp3.mp3') # M4
