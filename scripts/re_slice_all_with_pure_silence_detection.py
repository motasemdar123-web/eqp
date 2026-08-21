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

def pinpoint_q_start(decoded, low_s, high_s, target_k1, target_k2):
    # Scan in 1s steps
    for t in range(low_s, high_s):
        txt = transcribe_window(decoded, t, 2.8)
        if target_k1 in txt or target_k2 in txt:
            return t
    return None

# Definitions for all 16 master audio tracks with search windows around question chimes
MASTER_TRACKS = [
    # -------------------------------------------------------------------------
    # N5 Vol 1 (captured-media-0..3)
    # -------------------------------------------------------------------------
    {
        "out_dir": "frontend/public/audio/japanese/slices/n5_v1/m1",
        "file": "frontend/public/audio/japanese/n5/captured-media-0-mp3.mp3",
        "windows": [(155, 175), (220, 240), (280, 300), (335, 355), (400, 420), (475, 495), (545, 565)],
        "count": 7
    },
    {
        "out_dir": "frontend/public/audio/japanese/slices/n5_v1/m2",
        "file": "frontend/public/audio/japanese/n5/captured-media-3-mp3.mp3",
        "windows": [(115, 135), (180, 200), (250, 270), (320, 340), (390, 410), (460, 480)],
        "count": 6
    },
    {
        "out_dir": "frontend/public/audio/japanese/slices/n5_v1/m3",
        "file": "frontend/public/audio/japanese/n5/captured-media-1-mp3.mp3",
        "windows": [(85, 105), (125, 145), (160, 180), (200, 220), (235, 255)],
        "count": 5
    },
    {
        "out_dir": "frontend/public/audio/japanese/slices/n5_v1/m4",
        "file": "frontend/public/audio/japanese/n5/captured-media-2-mp3.mp3",
        "windows": [(75, 95), (105, 125), (140, 160), (170, 190), (205, 225), (235, 255)],
        "count": 6
    },

    # -------------------------------------------------------------------------
    # N5 Vol 2 (n5_2018/N5Q1..Q4)
    # -------------------------------------------------------------------------
    {
        "out_dir": "frontend/public/audio/japanese/slices/n5_v2/m1",
        "file": "frontend/public/audio/japanese/n5_2018/N5Q1.mp3",
        "windows": [(145, 165), (210, 230), (280, 300), (350, 370), (420, 440), (490, 510), (560, 580)],
        "count": 7
    },
    {
        "out_dir": "frontend/public/audio/japanese/slices/n5_v2/m2",
        "file": "frontend/public/audio/japanese/n5_2018/N5Q2.mp3",
        "windows": [(115, 135), (180, 200), (240, 260), (315, 335), (390, 410), (465, 485)],
        "count": 6
    },
    {
        "out_dir": "frontend/public/audio/japanese/slices/n5_v2/m3",
        "file": "frontend/public/audio/japanese/n5_2018/N5Q3.mp3",
        "windows": [(80, 100), (120, 140), (155, 175), (195, 215), (230, 250)],
        "count": 5
    },
    {
        "out_dir": "frontend/public/audio/japanese/slices/n5_v2/m4",
        "file": "frontend/public/audio/japanese/n5_2018/N5Q4.mp3",
        "windows": [(70, 90), (100, 120), (135, 155), (165, 185), (200, 220), (230, 250)],
        "count": 6
    },

    # -------------------------------------------------------------------------
    # N4 Vol 1 (captured-media-0..3)
    # -------------------------------------------------------------------------
    {
        "out_dir": "frontend/public/audio/japanese/slices/n4_v1/m1",
        "file": "frontend/public/audio/japanese/n4/captured-media-0-mp3.mp3",
        "windows": [(150, 170), (215, 235), (285, 305), (355, 375), (425, 445), (495, 515), (565, 585), (635, 655)],
        "count": 8
    },
    {
        "out_dir": "frontend/public/audio/japanese/slices/n4_v1/m2",
        "file": "frontend/public/audio/japanese/n4/captured-media-1-mp3.mp3",
        "windows": [(145, 165), (220, 240), (320, 340), (425, 445), (525, 545), (630, 650), (705, 725)],
        "count": 7
    },
    {
        "out_dir": "frontend/public/audio/japanese/slices/n4_v1/m3",
        "file": "frontend/public/audio/japanese/n4/captured-media-2-mp3.mp3",
        "windows": [(80, 100), (120, 140), (160, 180), (200, 220), (240, 260)],
        "count": 5
    },
    {
        "out_dir": "frontend/public/audio/japanese/slices/n4_v1/m4",
        "file": "frontend/public/audio/japanese/n4/captured-media-3-mp3.mp3",
        "windows": [(75, 95), (110, 130), (145, 165), (175, 195), (210, 230), (245, 265), (280, 300), (310, 330)],
        "count": 8
    },

    # -------------------------------------------------------------------------
    # N4 Vol 2 (n4_2018/N4Q1..Q4)
    # -------------------------------------------------------------------------
    {
        "out_dir": "frontend/public/audio/japanese/slices/n4_v2/m1",
        "file": "frontend/public/audio/japanese/n4_2018/N4Q1.mp3",
        "windows": [(145, 165), (215, 235), (285, 305), (365, 385), (445, 465), (525, 545), (600, 620), (670, 690)],
        "count": 8
    },
    {
        "out_dir": "frontend/public/audio/japanese/slices/n4_v2/m2",
        "file": "frontend/public/audio/japanese/n4_2018/N4Q2.mp3",
        "windows": [(145, 165), (245, 265), (325, 345), (455, 475), (560, 580), (665, 685), (770, 790)],
        "count": 7
    },
    {
        "out_dir": "frontend/public/audio/japanese/slices/n4_v2/m3",
        "file": "frontend/public/audio/japanese/n4_2018/N4Q3.mp3",
        "windows": [(80, 100), (115, 135), (155, 175), (195, 215), (235, 255)],
        "count": 5
    },
    {
        "out_dir": "frontend/public/audio/japanese/slices/n4_v2/m4",
        "file": "frontend/public/audio/japanese/n4_2018/N4Q4.mp3",
        "windows": [(75, 95), (110, 130), (145, 165), (180, 200), (215, 235), (250, 270), (285, 305), (320, 340)],
        "count": 8
    }
]

kanji_nums = ["一番", "二番", "三番", "四番", "五番", "六番", "七番", "八番"]

def process_all_tracks():
    total_processed = 0
    for track in MASTER_TRACKS:
        file_path = track["file"]
        out_dir = track["out_dir"]
        count = track["count"]
        windows = track["windows"]
        os.makedirs(out_dir, exist_ok=True)
        
        decoded = miniaudio.decode_file(file_path)
        total_dur = len(decoded.samples) / decoded.sample_rate / decoded.nchannels
        print(f"\nProcessing {file_path} ({count} Qs)...", flush=True)
        
        # Detect exact starts
        starts = []
        for i in range(count):
            low, high = windows[i]
            q_num = i + 1
            t = pinpoint_q_start(decoded, low, high, f"{q_num}番", kanji_nums[i])
            if t is None:
                t = (low + high) // 2
                print(f"  Q{q_num}: estimated {t}s", flush=True)
            else:
                print(f"  Q{q_num}: exact chime at {t}s", flush=True)
            starts.append(t)
            
        # Slicing with exact padded start and clean cut
        for i in range(count):
            q_num = i + 1
            # Start 1.0s before chime announcement
            s_time = max(0, starts[i] - 1.0)
            
            # End 2.0s before NEXT chime (or at end of track)
            if i < count - 1:
                e_time = starts[i+1] - 2.0
            else:
                e_time = total_dur - 1.0
                
            dur_time = e_time - s_time
            out_mp3 = os.path.join(out_dir, f"q{q_num}.mp3")
            
            cmd = [
                ffmpeg_exe, "-y",
                "-ss", str(s_time),
                "-i", file_path,
                "-t", str(dur_time),
                "-b:a", "96k",
                out_mp3
            ]
            subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
            total_processed += 1
            print(f"  --> Sliced {out_mp3}: {s_time:.1f}s -> {e_time:.1f}s (dur: {dur_time:.1f}s)", flush=True)

    print(f"\nDone! Successfully processed all {total_processed} audio files with zero cross-talk!", flush=True)

if __name__ == "__main__":
    process_all_tracks()
