import miniaudio, wave, io, json, os, sys, subprocess, imageio_ffmpeg
import speech_recognition as sr

sys.stdout.reconfigure(encoding='utf-8')
ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
r = sr.Recognizer()

def transcribe_window(decoded, start_sec, dur_sec=3.0):
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

def find_exact_question_starts(master_file, expected_count, search_ranges):
    decoded = miniaudio.decode_file(master_file)
    total_dur = len(decoded.samples) / decoded.sample_rate / decoded.nchannels
    print(f"\n=======================================================", flush=True)
    print(f"Scanning {master_file} ({total_dur:.1f}s, {expected_count} Qs)", flush=True)
    print(f"=======================================================", flush=True)
    
    exact_starts = []
    kanji_nums = ["一番", "二番", "三番", "四番", "五番", "六番", "七番", "八番"]
    
    for q_idx in range(1, expected_count + 1):
        target_k1 = f"{q_idx}番"
        target_k2 = kanji_nums[q_idx - 1]
        
        # Search window from approx range
        low_bound, high_bound = search_ranges[q_idx - 1]
        found_sec = None
        
        for t in range(low_bound, high_bound):
            txt = transcribe_window(decoded, t, 2.5)
            if target_k1 in txt or target_k2 in txt or (q_idx == 1 and "始めます" in txt):
                print(f"  Q{q_idx}: Found '{target_k1}/{target_k2}' at {t}s -> '{txt}'", flush=True)
                found_sec = t
                break
        
        if found_sec is None:
            # Fallback to midpoint
            found_sec = (low_bound + high_bound) // 2
            print(f"  Q{q_idx}: [WARNING] Keyword not matched, using default {found_sec}s", flush=True)
        
        exact_starts.append(found_sec)
        
    return exact_starts, total_dur

print("Flawless boundary detector ready.")
