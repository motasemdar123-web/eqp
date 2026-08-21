// JLPT Sentence Scrambler & Particle Builder Data (Mondai 2 "Star" Question Simulation)

export const SENTENCE_SCRAMBLER_DATA = {
  N5: [
    {
      id: 'scramble-n5-1',
      promptEnglish: 'I drink hot coffee every morning.',
      tokens: ['毎朝、', '熱い', 'コーヒーを', '飲みます。'],
      correctOrder: ['毎朝、', '熱い', 'コーヒーを', '飲みます。'],
      starPosition: 2, // 3rd token (index 2) is the Star item in JLPT
      grammarRule: 'Time + Adjective + Noun + を (Object Particle) + Verb',
      explanation: '「熱い」 modifies the noun 「コーヒー」, followed by the direct object particle 「を」 before the polite verb 「飲みます」.'
    },
    {
      id: 'scramble-n5-2',
      promptEnglish: 'I go to the library by bicycle.',
      tokens: ['自転車で', '図書館へ', '行きます。', '私は'],
      correctOrder: ['私は', '自転車で', '図書館へ', '行きます。'],
      starPosition: 2,
      grammarRule: 'Topic (は) + Means/Method (で) + Direction (へ/に) + Motion Verb',
      explanation: '「で」 indicates means of transportation (by bicycle), and 「へ」 indicates the destination.'
    },
    {
      id: 'scramble-n5-3',
      promptEnglish: 'There is a black cat under the desk.',
      tokens: ['机の', '下に', '黒い猫が', 'います。'],
      correctOrder: ['机の', '下に', '黒い猫が', 'います。'],
      starPosition: 2,
      grammarRule: 'Location + の下 (under) + に (at) + Subject (が) + います (animate existence)',
      explanation: 'For living creatures (animals and people), use the existence verb 「います」.'
    },
    {
      id: 'scramble-n5-4',
      promptEnglish: 'Yesterday I studied Japanese together with a friend.',
      tokens: ['友達と', '日本語を', '勉強しました。', '昨日、'],
      correctOrder: ['昨日、', '友達と', '日本語を', '勉強しました。'],
      starPosition: 1,
      grammarRule: 'Time + Companion (と) + Object (を) + Past Verb',
      explanation: 'Particle 「と」 marks the person with whom the action was performed (together with friend).'
    },
    {
      id: 'scramble-n5-5',
      promptEnglish: 'This room is quiet and clean.',
      tokens: ['この部屋は', '静かで、', 'きれいです。', 'とても'],
      correctOrder: ['この部屋は', 'とても', '静かで、', 'きれいです。'],
      starPosition: 2,
      grammarRule: 'Na-adjective て-form: 静か → 静かで (and)',
      explanation: 'Connecting Na-adjectives is done with 「で」 (静かで).'
    },
    {
      id: 'scramble-n5-6',
      promptEnglish: 'Please write your name here with a pencil.',
      tokens: ['ここに', '鉛筆で', '名前を', '書いてください。'],
      correctOrder: ['ここに', '鉛筆で', '名前を', '書いてください。'],
      starPosition: 2,
      grammarRule: 'Location (に) + Tool (で) + Object (を) + 〜てください (Please do)',
      explanation: '「書いてください」 is the polite request form derived from the て-form of 書く (かく).'
    },
    {
      id: 'scramble-n5-7',
      promptEnglish: 'Shall we eat lunch at the restaurant together?',
      tokens: ['レストランで', '昼ご飯を', '一緒に', '食べませんか。'],
      correctOrder: ['一緒に', 'レストランで', '昼ご飯を', '食べませんか。'],
      starPosition: 2,
      grammarRule: '〜ませんか (Polite Invitation)',
      explanation: '「〜ませんか」 is the standard invitation phrasing ("Won’t you / Shall we?").'
    }
  ],
  N4: [
    {
      id: 'scramble-n4-1',
      promptEnglish: 'If it rains tomorrow, I will stay at home.',
      tokens: ['明日', '雨が', '降ったら、', '家にいます。'],
      correctOrder: ['明日', '雨が', '降ったら、', '家にいます。'],
      starPosition: 2,
      grammarRule: '〜たら (Conditional "If/When")',
      explanation: 'The past tense + ら (降った + ら) creates the conditional hypothesis "if it rains".'
    },
    {
      id: 'scramble-n4-2',
      promptEnglish: 'I practice every day in order to become good at Japanese.',
      tokens: ['日本語が', '上手に', 'なるように、', '毎日練習しています。'],
      correctOrder: ['日本語が', '上手に', 'なるように、', '毎日練習しています。'],
      starPosition: 2,
      grammarRule: 'Verb (Dictionary/Potential) + ように (So that / In order to)',
      explanation: '「〜ように」 expresses a goal or desired state towards which conscious effort is directed.'
    },
    {
      id: 'scramble-n4-3',
      promptEnglish: 'A map is posted on the wall.',
      tokens: ['壁に', '地図が', '貼ってあります。', '大きな'],
      correctOrder: ['壁に', '大きな', '地図が', '貼ってあります。'],
      starPosition: 2,
      grammarRule: 'Transitive Verb (て-form) + あります (Resulting state from intentional action)',
      explanation: '「貼ってあります」 indicates that someone deliberately posted the map, and it remains there in that state.'
    },
    {
      id: 'scramble-n4-4',
      promptEnglish: 'I was praised by the teacher yesterday.',
      tokens: ['昨日、', '先生に', 'テストを', '褒められました。'],
      correctOrder: ['昨日、', '先生に', 'テストを', '褒められました。'],
      starPosition: 1,
      grammarRule: 'Passive Voice (受身): Agent (に) + Verb (られる)',
      explanation: 'In passive constructions, the agent who performed the action (teacher) is marked with 「に」.'
    },
    {
      id: 'scramble-n4-5',
      promptEnglish: 'I try to go to bed before 11:00 PM every night.',
      tokens: ['毎晩', '11時までに', '寝るように', 'しています。'],
      correctOrder: ['毎晩', '11時までに', '寝るように', 'しています。'],
      starPosition: 2,
      grammarRule: 'Verb (Dictionary/ない) + ようにしている (Making a conscious habit/effort)',
      explanation: '「〜ようにしている」 expresses an intentional routine or personal rule.'
    },
    {
      id: 'scramble-n4-6',
      promptEnglish: 'The meeting is scheduled to start at 2:00 PM.',
      tokens: ['会議は', '午後2時から', '始まる', 'ことになっています。'],
      correctOrder: ['会議は', '午後2時から', '始まる', 'ことになっています。'],
      starPosition: 2,
      grammarRule: 'Verb (Dictionary) + ことになっている (Scheduled / Decided rule)',
      explanation: '「〜ことになっている」 denotes an official rule, regulation, or external schedule.'
    },
    {
      id: 'scramble-n4-7',
      promptEnglish: 'Tanaka said that he will be absent tomorrow.',
      tokens: ['田中さんは', '明日の会議を', '休むと', '言っていました。'],
      correctOrder: ['田中さんは', '明日の会議を', '休むと', '言っていました。'],
      starPosition: 2,
      grammarRule: 'Quotation Particle (と) + 言う / 言っていました (Reported Speech)',
      explanation: 'The plain form verb is wrapped with 「と」 before the reporting verb 「言っていました」.'
    }
  ]
};
