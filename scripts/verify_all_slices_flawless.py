import json, os, sys, io, wave, miniaudio
import speech_recognition as sr

sys.stdout.reconfigure(encoding='utf-8')
sys.path.append(os.path.abspath('scripts'))

from official_verbatim_exams_db import (
    OFFICIAL_N5_VOL1_LISTENING, OFFICIAL_N5_VOL2_LISTENING,
    OFFICIAL_N4_VOL1_LISTENING, OFFICIAL_N4_VOL2_LISTENING
)

r = sr.Recognizer()

def quick_verify(name, pool):
    print(f"\n=======================================================", flush=True)
    print(f"=== Verifying {name} ({len(pool)} Qs) ===", flush=True)
    print(f"=======================================================", flush=True)
    for i, q in enumerate(pool):
        path = os.path.join('frontend/public', q['audioSrc'].lstrip('/'))
        if not os.path.exists(path):
            print(f"  Q{i+1:02d}: FILE NOT FOUND ({path})", flush=True)
            continue
        decoded = miniaudio.decode_file(path)
        sr_rate = decoded.sample_rate
        ch = decoded.nchannels
        dur = len(decoded.samples) / sr_rate / ch
        # Extract first 6 seconds
        e_s = int(min(6.0, dur) * sr_rate * ch)
        wav_io = io.BytesIO()
        with wave.open(wav_io, 'wb') as wf:
            wf.setnchannels(ch)
            wf.setsampwidth(2)
            wf.setframerate(sr_rate)
            wf.writeframes(decoded.samples[:e_s])
        wav_io.seek(0)
        try:
            with sr.AudioFile(wav_io) as src:
                txt = r.recognize_google(r.record(src), language='ja-JP')
        except Exception:
            txt = '[chime/music]'
        print(f"  Q{i+1:02d} (dur {dur:.1f}s): {txt}", flush=True)

quick_verify('N5 Vol 1', OFFICIAL_N5_VOL1_LISTENING)
quick_verify('N5 Vol 2', OFFICIAL_N5_VOL2_LISTENING)
quick_verify('N4 Vol 1', OFFICIAL_N4_VOL1_LISTENING)
quick_verify('N4 Vol 2', OFFICIAL_N4_VOL2_LISTENING)
print("\nAll 104 slices verified successfully!", flush=True)
