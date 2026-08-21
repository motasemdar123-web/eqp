// Technical, Factory & Engineering Japanese Data for Manufacturing and Equipment Maintenance

export const TECHNICAL_JAPANESE_CATEGORIES = [
  { id: '5s', name: '5S Methodology (5S活動)', icon: '✨', description: 'Foundational Japanese manufacturing discipline (Seiri, Seiton, Seisou, Seiketsu, Shitsuke)' },
  { id: 'maintenance', name: 'Equipment & Maintenance (設備・保全)', icon: '⚙️', description: 'Machine parts, diagnostics, preventive maintenance, and failure troubleshooting' },
  { id: 'safety', name: 'Safety & Emergency (安全・非常事態)', icon: '🦺', description: 'Factory floor safety rules, hazard warnings, PPE, and emergency stop protocols' },
  { id: 'floor', name: 'Shop Floor & Hou-Ren-Sou (現場・報連相)', icon: '📋', description: 'Shift handovers, morning meetings (朝礼), work instructions, and status reports' },
  { id: 'business', name: 'Business Keigo & Reports (ビジネス・報告書)', icon: '💼', description: 'Professional etiquette, email phrasing, polite requests, and technical summary reports' }
];

export const TECHNICAL_JAPANESE_TERMS = [
  // 5S Methodology
  {
    id: 'tech-1',
    category: '5s',
    term: '整理',
    reading: 'せいり (Seiri)',
    english: 'Sort / Organization',
    definition: 'Distinguishing between necessary and unnecessary items and discarding the unnecessary.',
    example: '不要な工具を整理して、作業スペースを広げます。',
    exampleRomaji: 'Fuyou na kougu wo seiri shite, sagyou supeesu wo hirogemasu.',
    exampleEnglish: 'We sort out unnecessary tools to widen the work space.',
    badge: '5S Pillar 1'
  },
  {
    id: 'tech-2',
    category: '5s',
    term: '整頓',
    reading: 'せいとん (Seiton)',
    english: 'Set in Order / Straighten',
    definition: 'Arranging necessary items so that they are easy to find, use, and return.',
    example: '工具は決められた場所に整頓してください。',
    exampleRomaji: 'Kougu wa kimerareta basho ni seiton shite kudasai.',
    exampleEnglish: 'Please set tools in order in their designated locations.',
    badge: '5S Pillar 2'
  },
  {
    id: 'tech-3',
    category: '5s',
    term: '清掃',
    reading: 'せいそう (Seisou)',
    english: 'Shine / Cleaning',
    definition: 'Cleaning the workplace and equipment to maintain optimal condition and identify early defects.',
    example: '作業後は機械周辺の清掃を徹底します。',
    exampleRomaji: 'Sagyou-go wa kikai shuuhen no seisou wo tettei shimasu.',
    exampleEnglish: 'After work, thoroughly clean around the machinery.',
    badge: '5S Pillar 3'
  },
  {
    id: 'tech-4',
    category: '5s',
    term: '清潔',
    reading: 'せいけつ (Seiketsu)',
    english: 'Standardize / Cleanliness',
    definition: 'Maintaining a high standard of housekeeping and workplace organization at all times.',
    example: '清潔な作業環境を維持することが品質向上につながります。',
    exampleRomaji: 'Seiketsu na sagyou kankyou wo iji suru koto ga hinshitsu koujou ni tsunagarimasu.',
    exampleEnglish: 'Maintaining a clean environment leads to quality improvement.',
    badge: '5S Pillar 4'
  },
  {
    id: 'tech-5',
    category: '5s',
    term: '躾 / 習慣',
    reading: 'しつけ (Shitsuke)',
    english: 'Sustain / Discipline',
    definition: 'Training people to follow rules and standards spontaneously as a daily habit.',
    example: '安全ルールを守る習慣（躾）が事故を防ぎます。',
    exampleRomaji: 'Anzen ruuru wo mamoru shuukan (shitsuke) ga jiko wo fusegimasu.',
    exampleEnglish: 'The habit of following safety rules (discipline) prevents accidents.',
    badge: '5S Pillar 5'
  },

  // Equipment & Maintenance
  {
    id: 'tech-6',
    category: 'maintenance',
    term: '点検',
    reading: 'てんけん (Tenken)',
    english: 'Inspection / Check',
    definition: 'Examining equipment to verify condition and functionality.',
    example: '始業前の日常点検を実施してください。',
    exampleRomaji: 'Shigyou-mae no nichijou tenken wo jisshi shite kudasai.',
    exampleEnglish: 'Please perform daily pre-operation inspection.',
    badge: 'Maintenance'
  },
  {
    id: 'tech-7',
    category: 'maintenance',
    term: '故障',
    reading: 'こしょう (Koshou)',
    english: 'Breakdown / Failure',
    definition: 'Equipment malfunction or failure to operate.',
    example: 'コンベアが異音とともに故障しました。',
    exampleRomaji: 'Konbea ga i’on to tomo ni koshou shimashita.',
    exampleEnglish: 'The conveyor malfunctioned along with an abnormal sound.',
    badge: 'Maintenance'
  },
  {
    id: 'tech-8',
    category: 'maintenance',
    term: '修理 / 保全',
    reading: 'しゅうり (Shuuri) / ほぜん (Hozen)',
    english: 'Repair / Maintenance',
    definition: 'Restoring damaged machinery to working order; preventative maintenance.',
    example: '予備保全として、来週モーターの交換を行います。',
    exampleRomaji: 'Yobi hozen to shite, raishuu mootaa no koukan wo okonaimasu.',
    exampleEnglish: 'As preventive maintenance, we will replace the motor next week.',
    badge: 'Maintenance'
  },
  {
    id: 'tech-9',
    category: 'maintenance',
    term: '稼働率',
    reading: 'かどうりつ (Kadouritsu)',
    english: 'Operating Rate / Availability',
    definition: 'The percentage of time machinery is active and producing output.',
    example: '今月の設備稼働率は98.5%を達成しました。',
    exampleRomaji: 'Kongetsu no setsubi kadouritsu wa kyuujuu hachi ten go paasento wo tassei shimashita.',
    exampleEnglish: 'This month’s equipment operating rate reached 98.5%.',
    badge: 'Metrics'
  },
  {
    id: 'tech-10',
    category: 'maintenance',
    term: '摩耗 / 消耗品',
    reading: 'まもう (Mamou) / しょうもうひん (Shoumouhin)',
    english: 'Wear & Tear / Consumable Parts',
    definition: 'Degradation of components over friction/time.',
    example: 'ベアリングが摩耗しているため、部品交換が必要です。',
    exampleRomaji: 'Bearingu ga mamou shite iru tame, buhin koukan ga hitsuyou desu.',
    exampleEnglish: 'Because the bearing is worn out, part replacement is required.',
    badge: 'Components'
  },
  {
    id: 'tech-11',
    category: 'maintenance',
    term: '油圧 / 空圧',
    reading: 'ゆあつ (Yuatsu) / くうあつ (Kuuatsu)',
    english: 'Hydraulic Pressure / Pneumatic Pressure',
    definition: 'Fluid and air power systems in manufacturing machinery.',
    example: '油圧シリンダーの圧力をゲージで確認します。',
    exampleRomaji: 'Yuatsu shirindaa no atsuryoku wo geeji de kakunin shimasu.',
    exampleEnglish: 'Check the hydraulic cylinder pressure on the gauge.',
    badge: 'Engineering'
  },

  // Safety & Emergency
  {
    id: 'tech-12',
    category: 'safety',
    term: '安全第一',
    reading: 'あんぜんだいいち (Anzen Daiichi)',
    english: 'Safety First',
    definition: 'The foundational industrial motto prioritizing operator well-being above all.',
    example: '作業は焦らず、「安全第一」で行いましょう。',
    exampleRomaji: 'Sagyou wa aserazu, "anzen daiichi" de okonaimashou.',
    exampleEnglish: 'Do not rush work; proceed with "Safety First".',
    badge: 'Safety Rule'
  },
  {
    id: 'tech-13',
    category: 'safety',
    term: '非常停止',
    reading: 'ひじょうていし (Hijou Teishi)',
    english: 'Emergency Stop (E-Stop)',
    definition: 'Immediately halting machine operation upon hazard detection.',
    example: '異常を感じたら、直ちに非常停止ボタンを押してください。',
    exampleRomaji: 'Ijou wo kanjitara, tadachini hijou teishi botan wo oshite kudasai.',
    exampleEnglish: 'If an abnormality is noticed, press the emergency stop button immediately.',
    badge: 'Emergency'
  },
  {
    id: 'tech-14',
    category: 'safety',
    term: '保護具着用',
    reading: 'ほごぐちゃくよう (Hogogu Chakuyou)',
    english: 'Wear Personal Protective Equipment (PPE)',
    definition: 'Wearing safety helmet, glasses, gloves, steel-toe boots.',
    example: '作業エリア内では保護メガネとヘルメットの着用が義務です。',
    exampleRomaji: 'Sagyou eria-nai dewa hogo megane to herumetto no chakuyou ga gimu desu.',
    exampleEnglish: 'Wearing safety goggles and a hardhat is mandatory inside the work area.',
    badge: 'Safety Rule'
  },
  {
    id: 'tech-15',
    category: 'safety',
    term: '指差呼称 / 指差し確認',
    reading: 'ゆびさしこしょう (Yubisashi Koshou)',
    english: 'Point and Call (Safety Verification)',
    definition: 'Pointing at a gauge or switch and calling status aloud ("よし! - All Good!").',
    example: 'バルブの開閉は指差呼称で「バルブ開、ヨシ！」と確認します。',
    exampleRomaji: 'Barubu no kaihei wa yubisashi koshou de "barubu kai, yoshi!" to kakunin shimasu.',
    exampleEnglish: 'Confirm valve opening/closing with point-and-call: "Valve open, Good!".',
    badge: 'Safety Protocol'
  },
  {
    id: 'tech-16',
    category: 'safety',
    term: 'ヒヤリ・ハット',
    reading: 'ひやり・はっと (Hiyari Hatto)',
    english: 'Near-Miss Incident',
    definition: 'An unplanned event that did not result in injury but had potential to do so.',
    example: '床の油で滑りそうになったので、ヒヤリ・ハット報告書を提出します。',
    exampleRomaji: 'Yuka no abura de suberi sou ni natta node, hiyari hatto houkokusho wo teishutsu shimasu.',
    exampleEnglish: 'I almost slipped on oil on the floor, so I will submit a near-miss report.',
    badge: 'Safety Quality'
  },

  // Shop Floor & Hou-Ren-Sou
  {
    id: 'tech-17',
    category: 'floor',
    term: '報連相',
    reading: 'ほうれんそう (Hou-Ren-Sou)',
    english: 'Report, Communicate, Consult',
    definition: 'Houkoku (報告 - Report), Renraku (連絡 - Communicate), Soudan (相談 - Consult).',
    example: 'トラブルが発生した際は、迅速な報連相が鉄則です。',
    exampleRomaji: 'Toraburu ga hassei shita sai wa, jinsoku na hou-ren-sou ga tessoku desu.',
    exampleEnglish: 'When trouble occurs, swift Hou-Ren-Sou is an absolute rule.',
    badge: 'Communication'
  },
  {
    id: 'tech-18',
    category: 'floor',
    term: '朝礼 / 申し送り',
    reading: 'ちょうれい (Chourei) / もうしおくり (Moushiokuri)',
    english: 'Morning Briefing / Shift Handover',
    definition: 'Daily team meeting to share production targets and handover shifts.',
    example: '朝礼で本日の生産計画と注意点を共有します。',
    exampleRomaji: 'Chourei de honjitsu no seisan keikaku to chuuiten wo kyouyuu shimasu.',
    exampleEnglish: 'In the morning meeting, we share today’s production plan and key notices.',
    badge: 'Work Routine'
  },
  {
    id: 'tech-19',
    category: 'floor',
    term: '作業手順書 (SOP)',
    reading: 'さぎょうてじゅんしょ (Sagyou Tejunsho)',
    english: 'Standard Operating Procedure (SOP)',
    definition: 'Documented step-by-step instructions for performing tasks safely and correctly.',
    example: '必ず作業手順書を確認しながら組み立て作業を進めてください。',
    exampleRomaji: 'Kanarazu sagyou tejunsho wo kakunin shinagara kumitate sagyou wo susumete kudasai.',
    exampleEnglish: 'Always proceed with assembly while verifying the standard operating procedure.',
    badge: 'Documentation'
  },
  {
    id: 'tech-20',
    category: 'floor',
    term: '改善',
    reading: 'かいぜん (Kaizen)',
    english: 'Continuous Improvement',
    definition: 'Ongoing effort to improve products, services, or processes by eliminating waste (Muda).',
    example: '作業台の高さを調整する改善活動を行いました。',
    exampleRomaji: 'Sagyoudai no takasa wo chousei suru kaizen katsudou wo okonaimashita.',
    exampleEnglish: 'We performed a Kaizen improvement activity by adjusting the workbench height.',
    badge: 'Philosophy'
  },

  // Business Keigo & Reports
  {
    id: 'tech-21',
    category: 'business',
    term: '承知いたしました / かしこまりました',
    reading: 'しょうちいたしました (Shouchi itashimashita)',
    english: 'Understood / Acknowledged (Polite Humble)',
    definition: 'Standard professional acknowledgement of an instruction from a client or supervisor.',
    example: '「明日の納品数を変更してください。」「承知いたしました。」',
    exampleRomaji: '"Ashita no nouhinsuu wo henkou shite kudasai." "Shouchi itashimashita."',
    exampleEnglish: '"Please adjust tomorrow’s delivery quantity." "Understood."',
    badge: 'Keigo'
  },
  {
    id: 'tech-22',
    category: 'business',
    term: 'お疲れ様です',
    reading: 'おつかれさまです (Otsukaresama desu)',
    english: 'Thank you for your hard work (Greeting)',
    definition: 'Essential greeting between colleagues during and after work.',
    example: '本日の作業は以上です。お疲れ様でした！',
    exampleRomaji: 'Honjitsu no sagyou wa ijou desu. Otsukaresama deshita!',
    exampleEnglish: 'That concludes today’s work. Thank you for your hard work!',
    badge: 'Etiquette'
  },
  {
    id: 'tech-23',
    category: 'business',
    term: 'ご確認のほど、よろしくお願いいたします',
    reading: 'ごかくにんのほど、よろしくおねがいいたします',
    english: 'Please review and confirm (Email / Report Closing)',
    definition: 'Polite concluding sentence when submitting maintenance reports or drawings.',
    example: '保全報告書を添付いたしますので、ご確認のほどよろしくお願いいたします。',
    exampleRomaji: 'Hozen houkokusho wo tempu itashimasu node, gokakunin no hodo yoroshiku onegai itashimasu.',
    exampleEnglish: 'I have attached the maintenance report; kindly review and confirm.',
    badge: 'Email/Report'
  }
];

export const TECHNICAL_QUIZ_QUESTIONS = [
  {
    id: 'tq-1',
    question: '「不要なものを捨てて、必要なものだけを残す」5Sの原則は何ですか。',
    options: ['整理 (Seiri)', '整頓 (Seiton)', '清掃 (Seisou)', '清潔 (Seiketsu)'],
    correct: 0,
    explanation: '整理 (Seiri) means sorting and eliminating unnecessary items from the workplace.'
  },
  {
    id: 'tq-2',
    question: '機械に異常が発生した際、直ちに押すべきボタンは何ですか。',
    options: ['電源スイッチ', 'リセットボタン', '非常停止ボタン', '始動ボタン'],
    correct: 2,
    explanation: '非常停止ボタン (Emergency Stop button) immediately halts machine operations to prevent damage or injury.'
  },
  {
    id: 'tq-3',
    question: '上司や取引先からの指示に対して、ビジネスで最も適切な「わかりました」の返答は？',
    options: ['了解です', 'わかりました', '承知いたしました', 'いいですよ'],
    correct: 2,
    explanation: '「承知いたしました」 (or かしこまりました) is the proper humble Keigo acknowledgement in Japanese business.'
  },
  {
    id: 'tq-4',
    question: '「ほうれんそう（報連相）」の正しい組み合わせはどれですか。',
    options: [
      '報告・連絡・相談',
      '包装・連続・整理',
      '点検・修理・改善',
      '安全・品質・納期'
    ],
    correct: 0,
    explanation: '報連相 stands for 報告 (Report), 連絡 (Communicate), and 相談 (Consult).'
  },
  {
    id: 'tq-5',
    question: '作業者が対象物を指差して「〇〇、ヨシ！」と声を出して確認する安全行動は？',
    options: ['指差呼称 (Yubisashi Koshou)', '5S活動', 'ヒヤリハット', 'カイゼン'],
    correct: 0,
    explanation: '指差呼称 (Point and Call) significantly reduces human error by combining visual, physical, and vocal verification.'
  }
];
