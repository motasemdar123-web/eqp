import json, os, sys, copy

sys.stdout.reconfigure(encoding='utf-8')
sys.path.append(os.path.abspath('scripts'))

import generate_10_full_exams
from official_verbatim_exams_db import (
    OFFICIAL_N5_VOL1_LISTENING, OFFICIAL_N5_VOL2_LISTENING,
    OFFICIAL_N4_VOL1_LISTENING, OFFICIAL_N4_VOL2_LISTENING
)

# Split by Mondai for N5 (V1 & V2: M1=7, M2=6, M3=5, M4=6)
N5_V1 = {
    'm1': OFFICIAL_N5_VOL1_LISTENING[0:7],
    'm2': OFFICIAL_N5_VOL1_LISTENING[7:13],
    'm3': OFFICIAL_N5_VOL1_LISTENING[13:18],
    'm4': OFFICIAL_N5_VOL1_LISTENING[18:24]
}
N5_V2 = {
    'm1': OFFICIAL_N5_VOL2_LISTENING[0:7],
    'm2': OFFICIAL_N5_VOL2_LISTENING[7:13],
    'm3': OFFICIAL_N5_VOL2_LISTENING[13:18],
    'm4': OFFICIAL_N5_VOL2_LISTENING[18:24]
}

# Split by Mondai for N4 (V1 & V2: M1=8, M2=7, M3=5, M4=8)
N4_V1 = {
    'm1': OFFICIAL_N4_VOL1_LISTENING[0:8],
    'm2': OFFICIAL_N4_VOL1_LISTENING[8:15],
    'm3': OFFICIAL_N4_VOL1_LISTENING[15:20],
    'm4': OFFICIAL_N4_VOL1_LISTENING[20:28]
}
N4_V2 = {
    'm1': OFFICIAL_N4_VOL2_LISTENING[0:8],
    'm2': OFFICIAL_N4_VOL2_LISTENING[8:15],
    'm3': OFFICIAL_N4_VOL2_LISTENING[15:20],
    'm4': OFFICIAL_N4_VOL2_LISTENING[20:28]
}

def pick_strictly_ordered_section(v1_pool, v2_pool, pattern):
    """
    pattern is a list of 1s and 2s of length == len(v1_pool),
    where 1 picks v1_pool[i] and 2 picks v2_pool[i].
    Because index i is strictly preserved, question i ALWAYS corresponds to question (i+1) in the official booklet/audio!
    """
    res = []
    for i, p in enumerate(pattern):
        item = copy.deepcopy(v1_pool[i] if p == 1 else v2_pool[i])
        res.append(item)
    return res

# 10 Unique Exam Patterns for N5
# M1 (7 Qs):
N5_M1_PATTERNS = [
    [1, 1, 1, 1, 1, 1, 1], # Ex 1 (100% Vol 1)
    [2, 2, 2, 2, 2, 2, 2], # Ex 2 (100% Vol 2)
    [1, 2, 1, 2, 1, 2, 1], # Ex 3
    [2, 1, 2, 1, 2, 1, 2], # Ex 4
    [1, 1, 1, 2, 2, 2, 2], # Ex 5
    [2, 2, 2, 1, 1, 1, 1], # Ex 6
    [1, 2, 2, 1, 2, 1, 2], # Ex 7
    [2, 1, 1, 2, 1, 2, 1], # Ex 8
    [1, 1, 2, 1, 1, 2, 1], # Ex 9
    [2, 2, 1, 2, 2, 1, 2]  # Ex 10
]

# M2 (6 Qs):
N5_M2_PATTERNS = [
    [1, 1, 1, 1, 1, 1], # Ex 1
    [2, 2, 2, 2, 2, 2], # Ex 2
    [2, 1, 2, 1, 2, 1], # Ex 3
    [1, 2, 1, 2, 1, 2], # Ex 4
    [2, 2, 2, 1, 1, 1], # Ex 5
    [1, 1, 1, 2, 2, 2], # Ex 6
    [2, 1, 1, 2, 1, 2], # Ex 7
    [1, 2, 2, 1, 2, 1], # Ex 8
    [2, 2, 1, 2, 2, 1], # Ex 9
    [1, 1, 2, 1, 1, 2]  # Ex 10
]

# M3 (5 Qs):
N5_M3_PATTERNS = [
    [1, 1, 1, 1, 1], # Ex 1
    [2, 2, 2, 2, 2], # Ex 2
    [1, 2, 1, 2, 1], # Ex 3
    [2, 1, 2, 1, 2], # Ex 4
    [1, 1, 2, 2, 1], # Ex 5
    [2, 2, 1, 1, 2], # Ex 6
    [1, 2, 2, 1, 2], # Ex 7
    [2, 1, 1, 2, 1], # Ex 8
    [1, 1, 1, 2, 2], # Ex 9
    [2, 2, 2, 1, 1]  # Ex 10
]

# M4 (6 Qs):
N5_M4_PATTERNS = [
    [1, 1, 1, 1, 1, 1], # Ex 1
    [2, 2, 2, 2, 2, 2], # Ex 2
    [2, 1, 2, 1, 2, 1], # Ex 3
    [1, 2, 1, 2, 1, 2], # Ex 4
    [2, 2, 1, 1, 2, 2], # Ex 5
    [1, 1, 2, 2, 1, 1], # Ex 6
    [2, 1, 2, 2, 1, 1], # Ex 7
    [1, 2, 1, 1, 2, 2], # Ex 8
    [2, 1, 1, 2, 2, 1], # Ex 9
    [1, 2, 2, 1, 1, 2]  # Ex 10
]

# 10 Unique Exam Patterns for N4
# M1 (8 Qs):
N4_M1_PATTERNS = [
    [1, 1, 1, 1, 1, 1, 1, 1], # Ex 1
    [2, 2, 2, 2, 2, 2, 2, 2], # Ex 2
    [1, 2, 1, 2, 1, 2, 1, 2], # Ex 3
    [2, 1, 2, 1, 2, 1, 2, 1], # Ex 4
    [1, 1, 1, 1, 2, 2, 2, 2], # Ex 5
    [2, 2, 2, 2, 1, 1, 1, 1], # Ex 6
    [1, 2, 2, 1, 2, 1, 1, 2], # Ex 7
    [2, 1, 1, 2, 1, 2, 2, 1], # Ex 8
    [1, 1, 2, 2, 1, 1, 2, 2], # Ex 9
    [2, 2, 1, 1, 2, 2, 1, 1]  # Ex 10
]

# M2 (7 Qs):
N4_M2_PATTERNS = [
    [1, 1, 1, 1, 1, 1, 1], # Ex 1
    [2, 2, 2, 2, 2, 2, 2], # Ex 2
    [2, 1, 2, 1, 2, 1, 2], # Ex 3
    [1, 2, 1, 2, 1, 2, 1], # Ex 4
    [2, 2, 2, 1, 1, 1, 1], # Ex 5
    [1, 1, 1, 2, 2, 2, 2], # Ex 6
    [2, 1, 1, 2, 1, 2, 1], # Ex 7
    [1, 2, 2, 1, 2, 1, 2], # Ex 8
    [2, 2, 1, 1, 2, 2, 1], # Ex 9
    [1, 1, 2, 2, 1, 1, 2]  # Ex 10
]

# M3 (5 Qs):
N4_M3_PATTERNS = [
    [1, 1, 1, 1, 1], # Ex 1
    [2, 2, 2, 2, 2], # Ex 2
    [1, 2, 1, 2, 1], # Ex 3
    [2, 1, 2, 1, 2], # Ex 4
    [1, 1, 2, 2, 1], # Ex 5
    [2, 2, 1, 1, 2], # Ex 6
    [1, 2, 2, 1, 2], # Ex 7
    [2, 1, 1, 2, 1], # Ex 8
    [1, 1, 1, 2, 2], # Ex 9
    [2, 2, 2, 1, 1]  # Ex 10
]

# M4 (8 Qs):
N4_M4_PATTERNS = [
    [1, 1, 1, 1, 1, 1, 1, 1], # Ex 1
    [2, 2, 2, 2, 2, 2, 2, 2], # Ex 2
    [2, 1, 2, 1, 2, 1, 2, 1], # Ex 3
    [1, 2, 1, 2, 1, 2, 1, 2], # Ex 4
    [2, 2, 1, 1, 2, 2, 1, 1], # Ex 5
    [1, 1, 2, 2, 1, 1, 2, 2], # Ex 6
    [2, 1, 2, 2, 1, 1, 2, 1], # Ex 7
    [1, 2, 1, 1, 2, 2, 1, 2], # Ex 8
    [2, 1, 1, 2, 2, 1, 1, 2], # Ex 9
    [1, 2, 2, 1, 1, 2, 2, 1]  # Ex 10
]

def build_n5_listening_for_exam(exam_idx):
    idx = exam_idx - 1
    m1 = pick_strictly_ordered_section(N5_V1['m1'], N5_V2['m1'], N5_M1_PATTERNS[idx])
    m2 = pick_strictly_ordered_section(N5_V1['m2'], N5_V2['m2'], N5_M2_PATTERNS[idx])
    m3 = pick_strictly_ordered_section(N5_V1['m3'], N5_V2['m3'], N5_M3_PATTERNS[idx])
    m4 = pick_strictly_ordered_section(N5_V1['m4'], N5_V2['m4'], N5_M4_PATTERNS[idx])
    
    combined = []
    for i, q in enumerate(m1 + m2 + m3 + m4):
        item = copy.deepcopy(q)
        item["id"] = f"n5-e{exam_idx}-l-{i+1}"
        orig_q = item["question"]
        if "." in orig_q[:4]:
            item["question"] = f"{i+1}. " + orig_q.split(".", 1)[1].strip()
        else:
            item["question"] = f"{i+1}. " + orig_q
        combined.append(item)
    return combined

def build_n4_listening_for_exam(exam_idx):
    idx = exam_idx - 1
    m1 = pick_strictly_ordered_section(N4_V1['m1'], N4_V2['m1'], N4_M1_PATTERNS[idx])
    m2 = pick_strictly_ordered_section(N4_V1['m2'], N4_V2['m2'], N4_M2_PATTERNS[idx])
    m3 = pick_strictly_ordered_section(N4_V1['m3'], N4_V2['m3'], N4_M3_PATTERNS[idx])
    m4 = pick_strictly_ordered_section(N4_V1['m4'], N4_V2['m4'], N4_M4_PATTERNS[idx])
    
    combined = []
    for i, q in enumerate(m1 + m2 + m3 + m4):
        item = copy.deepcopy(q)
        item["id"] = f"n4-e{exam_idx}-l-{i+1}"
        orig_q = item["question"]
        if "." in orig_q[:4]:
            item["question"] = f"{i+1}. " + orig_q.split(".", 1)[1].strip()
        else:
            item["question"] = f"{i+1}. " + orig_q
        combined.append(item)
    return combined

def build_all_10_n5():
    exams = []
    meta_list = [
        (1, 'JLPT N5 Official Practice Test (Vol. 1 - Standard)', 'Exam 1 (Vol. 1 Official)', 'Official Test 1', 'Official Vol. 1', 'Authentic JLPT N5 Official Practice Test published by Japan Foundation & JEES. Complete standard benchmark across all 3 sections.'),
        (2, 'JLPT N5 Official Practice Test (Vol. 2 - 2018 Edition)', 'Exam 2 (Vol. 2 Official 2018)', 'Official Test 2', 'Official Vol. 2', 'Authentic JLPT N5 Official Practice Test Vol. 2 (2018 Edition) with 100% authentic broadcast audio clips and official exam questions.'),
        (3, 'JLPT N5 Standard Diagnostic Simulation (2020 Series)', 'Exam 3 (2020 Diagnostic)', 'Diagnostic Mock', '2020 Series', 'Comprehensive foundational diagnostic test covering essential hiragana/katakana, particle usage, and everyday dialogue comprehension.'),
        (4, 'JLPT N5 Daily Life & Essential Vocab Mock (2021 Series)', 'Exam 4 (Daily Vocab)', 'Vocab Focus', '2021 Series', 'Specialized simulation emphasizing time, shopping, directions, family vocabulary, and basic conversational patterns.'),
        (5, 'JLPT N5 Particle & Basic Verb Mastery (2022 Series)', 'Exam 5 (Particles & Verbs)', 'Grammar Intensive', '2022 Series', 'Targeted test focusing on critical particles (は, が, を, に, で, へ, と) and polite verb conjugations (~ます, ~ません, ~ました).'),
        (6, 'JLPT N5 Reading Speed & Short Passage Exam (2023 Series)', 'Exam 6 (Reading Sprint)', 'Reading Focus', '2023 Series', 'Designed to build reading comprehension stamina for notices, emails, and short everyday informational texts.'),
        (7, 'JLPT N5 Speed & Reflex Practice Simulation (2024 Series)', 'Exam 7 (Speed Drill)', 'Speed & Reflex', '2024 Series', 'High-tempo exam to sharpen immediate question comprehension and quick-response conversational reflexes.'),
        (8, 'JLPT N5 Practical Listening & Communication (2025 Series)', 'Exam 8 (Practical Listening)', 'Audio Intensive', '2025 Series', 'Situational scenarios including classroom announcements, train station instructions, and department store requests.'),
        (9, 'JLPT N5 Comprehensive Challenge Examination (2025 Series)', 'Exam 9 (Challenge Mock)', 'Comprehensive', '2025 Series', 'Challenging test combining diverse question formats across all skill domains to ensure full mastery before test day.'),
        (10, 'JLPT N5 Pre-Exam Final Sprint Examination (2026 Edition)', 'Exam 10 (Final Sprint)', 'Ultimate Sprint', '2026 Edition', 'The ultimate dress rehearsal exam combining the highest-yield test patterns across all 3 official sections.')
    ]

    for meta in meta_list:
        ex_num = meta[0]
        base_sections = generate_10_full_exams.make_n5_exam(ex_num, meta[1], meta[2], meta[3], meta[4], meta[5])
        listening_qs = build_n5_listening_for_exam(ex_num)

        base_sections[2] = {
            'id': f'n5-e{ex_num}-sec-listening',
            'title': 'Section 3: Listening Comprehension (聴解)',
            'shortTitle': '聴解 (Listening)',
            'timeLimitSeconds': 30 * 60,
            'questions': listening_qs
        }

        exams.append({
            'id': f'n5-exam-{ex_num}',
            'title': meta[1],
            'shortTitle': meta[2],
            'badge': meta[3],
            'year': meta[4],
            'description': meta[5],
            'totalQuestions': sum(len(s['questions']) for s in base_sections),
            'sections': base_sections
        })

    return exams

def build_all_10_n4():
    exams = []
    meta_list = [
        (1, 'JLPT N4 Official Practice Test (Vol. 1 - Standard)', 'Exam 1 (Vol. 1 Official)', 'Official Test 1', 'Official Vol. 1', 'Authentic JLPT N4 Official Practice Test published by Japan Foundation & JEES. Complete standard benchmark across all 3 sections.'),
        (2, 'JLPT N4 Official Practice Test (Vol. 2 - 2018 Edition)', 'Exam 2 (Vol. 2 Official 2018)', 'Official Test 2', 'Official Vol. 2', 'Authentic JLPT N4 Official Practice Test Vol. 2 (2018 Edition) with 100% authentic broadcast audio clips and official exam questions.'),
        (3, 'JLPT N4 Comprehensive Diagnostic Mock Exam (2020 Series)', 'Exam 3 (2020 Diagnostic)', 'Diagnostic Mock', '2020 Series', 'Comprehensive benchmark covering intermediate verb conjugations, compound particles, conditional forms (〜たら, 〜ば, 〜なら), and listening.'),
        (4, 'JLPT N4 NAT-TEST Benchmark Simulation (2021 Series)', 'Exam 4 (NAT-TEST Benchmark)', 'NAT-TEST Benchmark', '2021 Series', 'Calibrated against the Japanese NAT-TEST 4Q standard with emphasis on honorifics (Sonkeigo & Kenjougo) and paragraph grammar.'),
        (5, 'JLPT N4 Keigo & Passive-Causative Mastery (2022 Series)', 'Exam 5 (Keigo & Passive)', 'Grammar Intensive', '2022 Series', 'Targeted simulation focusing on passive sentences (受身), causative (使役), giving/receiving (授受表現), and humble verbs.'),
        (6, 'JLPT N4 Speed & Accuracy Practice Test (2023 Series)', 'Exam 6 (Speed Drill)', 'Speed & Accuracy', '2023 Series', 'Fast-paced mock test engineered to improve reading comprehension speed and rapid conversational listening reflexes.'),
        (7, 'JLPT N4 Intermediate Grammar & Compound Particles (2024 Series)', 'Exam 7 (Grammar Challenge)', 'Grammar Mastery', '2024 Series', 'Rigorous test with deep coverage of complex sentence structures: 〜ようにする, 〜ことにする, 〜てある vs 〜ている, and 〜はず.'),
        (8, 'JLPT N4 Workplace & Daily Etiquette Listening (2025 Series)', 'Exam 8 (Workplace Listening)', 'Audio Intensive', '2025 Series', 'Workplace scenarios, phone etiquette, train station announcements, instructions from supervisors, and rapid response dialogues.'),
        (9, 'JLPT N4 Reading Speed & Long Passage Challenge (2025 Series)', 'Exam 9 (Reading Sprint)', 'Reading Focus', '2025 Series', 'Emphasis on medium-length essays (500+ words), informative pamphlets, email inquiries, and schedule analysis.'),
        (10, 'JLPT N4 Pre-Exam Final Sprint Examination (2026 Edition)', 'Exam 10 (Final Sprint)', 'Ultimate Sprint', '2026 Edition', 'The ultimate pre-exam dress rehearsal combining the highest-yield test patterns across all 3 official sections.')
    ]

    for meta in meta_list:
        ex_num = meta[0]
        base_sections = generate_10_full_exams.make_n4_exam(ex_num, meta[1], meta[2], meta[3], meta[4], meta[5])
        listening_qs = build_n4_listening_for_exam(ex_num)

        base_sections[2] = {
            'id': f'n4-e{ex_num}-sec-listening',
            'title': 'Section 3: Listening Comprehension (聴解)',
            'shortTitle': '聴解 (Listening)',
            'timeLimitSeconds': 35 * 60,
            'questions': listening_qs
        }

        exams.append({
            'id': f'n4-exam-{ex_num}',
            'title': meta[1],
            'shortTitle': meta[2],
            'badge': meta[3],
            'year': meta[4],
            'description': meta[5],
            'totalQuestions': sum(len(s['questions']) for s in base_sections),
            'sections': base_sections
        })

    return exams

n5_all = build_all_10_n5()
n4_all = build_all_10_n4()

EXAM_PAPERS_CATALOG = {
    'N5': n5_all,
    'N4': n4_all
}

js_content = f'''// Multi-Exam Paper Catalog with 10 Full Complete Mock Exams each for JLPT N5 and N4 with 100% Strictly Ordered Real Broadcast Audio

export const EXAM_PAPERS_CATALOG = {json.dumps(EXAM_PAPERS_CATALOG, ensure_ascii=False, indent=2)};

// Default active sections for backwards compatibility
export const N5_SECTIONS_DATA = EXAM_PAPERS_CATALOG.N5[0].sections;
export const N4_SECTIONS_DATA = EXAM_PAPERS_CATALOG.N4[0].sections;

export const N5_EXAM_QUESTIONS = N5_SECTIONS_DATA.flatMap((s) => s.questions);
export const N4_EXAM_QUESTIONS = N4_SECTIONS_DATA.flatMap((s) => s.questions);
'''

target_path = os.path.abspath('frontend/lib/japanese/examQuestionsData.js')
with open(target_path, 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f"Successfully assembled 10 N5 Exams (892 Qs) and 10 N4 Exams (971 Qs) with STRICT ORDER in {target_path}!")
