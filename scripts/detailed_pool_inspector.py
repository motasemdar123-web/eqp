import sys
sys.stdout.reconfigure(encoding='utf-8')

from official_verbatim_exams_db import (
    OFFICIAL_N5_VOL1_LISTENING, OFFICIAL_N5_VOL2_LISTENING,
    OFFICIAL_N4_VOL1_LISTENING, OFFICIAL_N4_VOL2_LISTENING
)

def check_pool(name, pool):
    print(f"\n=======================================================")
    print(f"=== {name} ({len(pool)} Qs) ===")
    print(f"=======================================================")
    for i, q in enumerate(pool):
        opts = " | ".join(q['options'])
        corr = q['options'][q['correct']]
        print(f"[{i+1:02d}] {q['type']}")
        print(f"     Q: {q['question']}")
        print(f"     Options: {opts}")
        print(f"     Answer: {corr}")
        print(f"     Audio: {q['audioSrc']}")

check_pool('N5 Vol 1', OFFICIAL_N5_VOL1_LISTENING)
check_pool('N5 Vol 2', OFFICIAL_N5_VOL2_LISTENING)
check_pool('N4 Vol 1', OFFICIAL_N4_VOL1_LISTENING)
check_pool('N4 Vol 2', OFFICIAL_N4_VOL2_LISTENING)
