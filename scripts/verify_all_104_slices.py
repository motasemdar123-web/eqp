import miniaudio, wave, io, os, sys
import speech_recognition as sr

sys.stdout.reconfigure(encoding='utf-8')
r = sr.Recognizer()

def test_slice(path):
    try:
        decoded = miniaudio.decode_file(path)
        sr_rate = decoded.sample_rate
        ch = decoded.nchannels
        frames = min(len(decoded.samples), int(8.0 * sr_rate * ch))
        wav_io = io.BytesIO()
        with wave.open(wav_io, 'wb') as wf:
            wf.setnchannels(ch)
            wf.setsampwidth(2)
            wf.setframerate(sr_rate)
            wf.writeframes(decoded.samples[:frames])
        wav_io.seek(0)
        with sr.AudioFile(wav_io) as src:
            return r.recognize_google(r.record(src), language='ja-JP')
    except Exception as e:
        return f"ERR: {e}"

sections = [
    'n5_v1/m1', 'n5_v1/m2', 'n5_v1/m3', 'n5_v1/m4',
    'n5_v2/m1', 'n5_v2/m2', 'n5_v2/m3', 'n5_v2/m4',
    'n4_v1/m1', 'n4_v1/m2', 'n4_v1/m3', 'n4_v1/m4',
    'n4_v2/m1', 'n4_v2/m2', 'n4_v2/m3', 'n4_v2/m4',
]

results = []
for sec in sections:
    folder = os.path.join('frontend/public/audio/japanese/slices', sec)
    files = sorted([f for f in os.listdir(folder) if f.endswith('.mp3')], key=lambda x: int(x[1:-4]))
    for f in files:
        p = os.path.join(folder, f)
        txt = test_slice(p)
        q_num = f[1:-4]
        has_num = (f"{q_num}番" in txt or (q_num == "1" and "一番" in txt) or (q_num == "2" and "二番" in txt) or (q_num == "3" and "三番" in txt) or (q_num == "4" and "四番" in txt))
        status = "OK" if has_num else "CHECK"
        line = f"[{status}] {sec}/{f}: '{txt}'"
        print(line, flush=True)
        results.append((status, sec, f, txt))

total = len(results)
ok_cnt = sum(1 for r in results if r[0] == "OK")
print(f"\nVerification Complete: {ok_cnt}/{total} slices cleanly open with question number!", flush=True)
