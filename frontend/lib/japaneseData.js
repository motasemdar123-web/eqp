// Japanese JLPT N5 & N4 Master Learning Curricula Consolidated Entry

import { N5_KANJI, N4_KANJI } from './japanese/kanjiData';
import { N5_GRAMMAR, N4_GRAMMAR } from './japanese/grammarData';
import { N5_VERBS, N4_VERBS } from './japanese/verbsData';
import { N5_ADJECTIVES, N4_ADJECTIVES } from './japanese/adjectivesData';
import { N5_VOCABULARY as N5_BASE_VOCAB, N4_VOCABULARY as N4_BASE_VOCAB } from './japanese/vocabularyData';
import { N5_EXAM_QUESTIONS, N4_EXAM_QUESTIONS } from './japanese/examQuestionsData';
import { N5_LISTENING_EXAM, N4_LISTENING_EXAM } from './japanese/examListeningData';

export {
  N5_KANJI,
  N4_KANJI,
  N5_GRAMMAR,
  N4_GRAMMAR,
  N5_VERBS,
  N4_VERBS,
  N5_ADJECTIVES,
  N4_ADJECTIVES,
  N5_EXAM_QUESTIONS,
  N4_EXAM_QUESTIONS,
  N5_LISTENING_EXAM,
  N4_LISTENING_EXAM,
};

// Comprehensive composite vocabulary arrays
export const N5_VOCABULARY = [
  ...N5_VERBS.map((v) => ({
    jp: v.jp,
    kana: v.masuForm || v.jp,
    romaji: v.romaji,
    en: v.meaning,
    category: 'Verbs',
  })),
  ...N5_ADJECTIVES.map((a) => ({
    jp: a.jp,
    kana: a.kana,
    romaji: a.romaji,
    en: a.meaning,
    category: a.type === 'i-adjective' ? 'I-Adjectives' : 'Na-Adjectives',
  })),
  ...N5_BASE_VOCAB,
];

export const N4_VOCABULARY = [
  ...N4_VERBS.map((v) => ({
    jp: v.jp,
    kana: v.kana || v.jp,
    romaji: '',
    en: v.meaning,
    category: 'Verbs',
  })),
  ...N4_ADJECTIVES.map((a) => ({
    jp: a.jp,
    kana: a.kana,
    romaji: a.romaji,
    en: a.meaning,
    category: a.type === 'i-adjective' ? 'I-Adjectives' : 'Na-Adjectives',
  })),
  ...N4_BASE_VOCAB,
];

export const N5_MOCK_EXAM = {
  title: 'Official JLPT N5 Full Simulation Test',
  audioTracks: N5_LISTENING_EXAM.audioTracks,
  questions: N5_EXAM_QUESTIONS,
};

export const N4_MOCK_EXAM = {
  title: 'Official JLPT N4 Full Simulation Test',
  audioTracks: N4_LISTENING_EXAM.audioTracks,
  questions: N4_EXAM_QUESTIONS,
};
