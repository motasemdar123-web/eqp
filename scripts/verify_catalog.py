import json
import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('frontend/lib/japanese/examQuestionsData.js', 'r', encoding='utf-8') as f:
    text = f.read()

start_idx = text.find('export const EXAM_PAPERS_CATALOG = ') + len('export const EXAM_PAPERS_CATALOG = ')
end_idx = text.find(';\n\n// Default active sections')
json_str = text[start_idx:end_idx]

catalog = json.loads(json_str)

for level in ['N5', 'N4']:
    exams = catalog[level]
    print(f'=== {level} has {len(exams)} exams ===')
    for ex in exams:
        sec3 = ex['sections'][2]
        qs = sec3['questions']
        sample_q = qs[0]
        has_audio = sample_q.get('audioSrc')
        print(f"  {ex['id']}: {ex['shortTitle']} -> {len(qs)} listening Qs | Sample audio: {has_audio}")

# Check N5 Exam 1 Q5 specifically
n5_ex1_q5 = catalog['N5'][0]['sections'][2]['questions'][4]
print('\n[VERIFICATION: N5 Exam 1 Question 5]')
print('Question:', n5_ex1_q5['question'])
print('Image:', n5_ex1_q5.get('image'))
print('AudioSrc:', n5_ex1_q5.get('audioSrc'))
print('Options:', n5_ex1_q5['options'])
print('Correct:', n5_ex1_q5['correct'])
print('Transcript:', n5_ex1_q5['transcript'].replace('\n', ' '))

# Check N4 Exam 1 Q1
n4_ex1_q1 = catalog['N4'][0]['sections'][2]['questions'][0]
print('\n[VERIFICATION: N4 Exam 1 Question 1]')
print('Question:', n4_ex1_q1['question'])
print('Image:', n4_ex1_q1.get('image'))
print('AudioSrc:', n4_ex1_q1.get('audioSrc'))
print('Options:', n4_ex1_q1['options'])
print('Correct:', n4_ex1_q1['correct'])
