import miniaudio, wave, io, json, os, sys
import speech_recognition as sr

sys.stdout.reconfigure(encoding='utf-8')
r = sr.Recognizer()

from official_verbatim_exams_db import (
    OFFICIAL_N5_VOL1_LISTENING, OFFICIAL_N5_VOL2_LISTENING,
    OFFICIAL_N4_VOL1_LISTENING, OFFICIAL_N4_VOL2_LISTENING
)

def transcribe_audio_file(path):
    try:
        decoded = miniaudio.decode_file(path)
        sample_rate = decoded.sample_rate
        channels = decoded.nchannels
        wav_io = io.BytesIO()
        with wave.open(wav_io, 'wb') as wf:
            wf.setnchannels(channels)
            wf.setsampwidth(2)
            wf.setframerate(sample_rate)
            wf.writeframes(decoded.samples)
        wav_io.seek(0)
        with sr.AudioFile(wav_io) as src:
            return r.recognize_google(r.record(src), language='ja-JP')
    except Exception as e:
        return f"ERR: {e}"

def check_pool(name, pool):
    print(f"\n=======================================================", flush=True)
    print(f"AUDITING {name} ({len(pool)} questions)", flush=True)
    print(f"=======================================================", flush=True)
    for idx, q in enumerate(pool):
        audio_rel = q['audioSrc'].lstrip('/')
        audio_path = os.path.join('frontend/public', audio_rel)
        exists = os.path.exists(audio_path)
        size = os.path.getsize(audio_path) if exists else 0
        img_rel = q.get('image', '').lstrip('/') if q.get('image') else ''
        img_exists = os.path.exists(os.path.join('frontend/public', img_rel)) if img_rel else True

        # Transcribe
        txt = transcribe_audio_file(audio_path) if exists else "FILE NOT FOUND"
        
        print(f"\n[{idx+1}] Question: {q['question'][:45]}...", flush=True)
        print(f"    Audio: {q['audioSrc']} ({size/1024:.1f} KB)", flush=True)
        print(f"    Image: {q.get('image')} (Exists: {img_exists})", flush=True)
        print(f"    Spoken Text (ASR): {txt[:80]}...", flush=True)
        print(f"    Expected Dialogue: {q['transcript'].replace(chr(10), ' ')[:80]}...", flush=True)

print("Starting deep audit of all 4 master question pools...", flush=True)
check_pool("N5 VOL 1", OFFICIAL_N5_VOL1_LISTENING)
check_pool("N5 VOL 2", OFFICIAL_N5_VOL2_LISTENING)
check_pool("N4 VOL 1", OFFICIAL_N4_VOL1_LISTENING)
check_pool("N4 VOL 2", OFFICIAL_N4_VOL2_LISTENING)
