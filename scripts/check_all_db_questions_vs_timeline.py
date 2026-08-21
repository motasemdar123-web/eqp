import json, os, sys

sys.stdout.reconfigure(encoding='utf-8')

from official_verbatim_exams_db import (
    OFFICIAL_N5_VOL1_LISTENING, OFFICIAL_N5_VOL2_LISTENING,
    OFFICIAL_N4_VOL1_LISTENING, OFFICIAL_N4_VOL2_LISTENING
)

with open('scripts/full_transcript_timeline_utf8.txt', 'r', encoding='utf-8') as f:
    timeline_txt = f.read()

def audit_pool(name, pool):
    print(f"\n=======================================================")
    print(f"AUDITING {name} ({len(pool)} Qs)")
    print(f"=======================================================")
    mismatches = []
    for idx, q in enumerate(pool):
        # Look for keywords from q['question'] or q['transcript'] in timeline
        q_key = q['question'][:15]
        # Check options
        print(f"[{idx+1:2d}] {q['type']}: {q['question']}")
        print(f"     Audio: {q['audioSrc']}")
        print(f"     Options: {q['options']}")
        print(f"     Correct: {q['correct']} -> {q['options'][q['correct']]}")

audit_pool("N5 Vol 1", OFFICIAL_N5_VOL1_LISTENING)
audit_pool("N5 Vol 2", OFFICIAL_N5_VOL2_LISTENING)
audit_pool("N4 Vol 1", OFFICIAL_N4_VOL1_LISTENING)
audit_pool("N4 Vol 2", OFFICIAL_N4_VOL2_LISTENING)
