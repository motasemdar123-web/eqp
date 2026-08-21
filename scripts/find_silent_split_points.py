import miniaudio, wave, io, json, os, sys, numpy as np

sys.stdout.reconfigure(encoding='utf-8')

# Function to compute RMS volume envelope in 100ms frames
def get_energy_profile(audio_path, frame_ms=100):
    decoded = miniaudio.decode_file(audio_path)
    sr = decoded.sample_rate
    ch = decoded.nchannels
    samples = np.frombuffer(decoded.samples, dtype=np.int16)
    if ch > 1:
        samples = samples.reshape(-1, ch).mean(axis=1)
    
    samples_per_frame = int(sr * (frame_ms / 1000.0))
    n_frames = len(samples) // samples_per_frame
    
    # Reshape and calculate RMS energy
    frames = samples[:n_frames * samples_per_frame].reshape(n_frames, samples_per_frame)
    energy = np.sqrt(np.mean(frames.astype(np.float64)**2, axis=1))
    
    duration = len(samples) / sr
    return energy, sr, frame_ms, duration

print("Energy analyzer defined.", flush=True)
