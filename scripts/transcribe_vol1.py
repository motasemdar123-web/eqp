import miniaudio, wave, io, json, os, sys
import speech_recognition as sr

sys.stdout.reconfigure(encoding='utf-8')

def transcribe_whole_mp3(path, chunk_sec=35):
    decoded = miniaudio.decode_file(path)
    total_sec = len(decoded.samples) / decoded.sample_rate / decoded.nchannels
    print(f"Transcribing {path} ({total_sec:.1f}s)...", flush=True)
    r = sr.Recognizer()
    chunks = []
    for start in range(0, int(total_sec), chunk_sec):
        dur = min(chunk_sec, total_sec - start)
        start_s = int(start * decoded.sample_rate * decoded.nchannels)
        end_s = int((start + dur) * decoded.sample_rate * decoded.nchannels)
        wav_io = io.BytesIO()
        with wave.open(wav_io, 'wb') as wf:
            wf.setnchannels(decoded.nchannels)
            wf.setsampwidth(2)
            wf.setframerate(decoded.sample_rate)
            wf.writeframes(decoded.samples[start_s:end_s])
        wav_io.seek(0)
        try:
            with sr.AudioFile(wav_io) as src:
                txt = r.recognize_google(r.record(src), language='ja-JP')
                chunks.append({'start': start, 'end': start+dur, 'text': txt})
                print(f"  [{start:3d}s-{int(start+dur):3d}s]: {txt}", flush=True)
        except Exception:
            pass
    return {'file': path, 'duration': total_sec, 'chunks': chunks}

files_vol1 = [
    'frontend/public/audio/japanese/n5/captured-media-0-mp3.mp3', # N5 M1
    'frontend/public/audio/japanese/n5/captured-media-3-mp3.mp3', # N5 M2
    'frontend/public/audio/japanese/n5/captured-media-1-mp3.mp3', # N5 M3
    'frontend/public/audio/japanese/n5/captured-media-2-mp3.mp3', # N5 M4
    'frontend/public/audio/japanese/n4/captured-media-0-mp3.mp3', # N4 M1
    'frontend/public/audio/japanese/n4/captured-media-1-mp3.mp3', # N4 M2
    'frontend/public/audio/japanese/n4/captured-media-2-mp3.mp3', # N4 M3
    'frontend/public/audio/japanese/n4/captured-media-3-mp3.mp3'  # N4 M4
]

all_data = {}
if os.path.exists('scripts/official_audio_transcripts.json'):
    with open('scripts/official_audio_transcripts.json', 'r', encoding='utf-8') as f:
        all_data = json.load(f)

for p in files_vol1:
    all_data[p] = transcribe_whole_mp3(p)

with open('scripts/official_audio_transcripts.json', 'w', encoding='utf-8') as f:
    json.dump(all_data, f, ensure_ascii=False, indent=2)
print("Finished transcribing all Vol 1 files!", flush=True)
