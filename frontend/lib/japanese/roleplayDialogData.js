/**
 * Komatsu Workshop & Engineering Roleplay Dialogue Scenarios (現場会話シミュレーター)
 * Structured with speaker turns, audio text, multiple choice response options, Keigo tips, and vocabulary breakdowns.
 */

export const WORKSHOP_SCENARIOS = [
  {
    id: 'fault_report',
    title: '1. Machine Breakdown & Oil Leak Report (故障・漏油の緊急報告)',
    difficulty: 'Intermediate (N4 - Business)',
    icon: '🚨',
    description: 'Report an urgent hydraulic pump failure and boom cylinder oil leak on a PC500LC-10R to Komatsu technical support.',
    setting: 'Calling Komatsu Technical Support Center (コマツ技術サポートセンターへの電話報告)',
    turns: [
      {
        turnId: 1,
        speaker: 'Komatsu Tech Support (コマツ技術担当者)',
        japanese: 'お電話ありがとうございます。コマツ技術サポート窓口の田中です。本日はどのようなご用件でしょうか？',
        reading: 'おでんわありがとうございます。コマツぎじゅつサポートまどぐちのたなかです。ほんじつはどのようなごようけんでしょうか？',
        romaji: 'O-denwa arigatō gozaimasu. Komatsu Gijutsu Sapōto madoguchi no Tanaka desu. Honjitsu wa dono yō na go-yōken deshō ka?',
        english: 'Thank you for calling. This is Tanaka from the Komatsu Technical Support Desk. How may I assist you today?',
        userRolePrompt: 'State that you are calling from Dar Al Hai Workshop and need to report an urgent hydraulic problem on a PC500LC.',
        options: [
          {
            id: 'opt1_a',
            japanese: 'お世話になっております。ダル・アルハイ重機工場のモタセムです。PC500LCショベルの油圧ポンプから異音と油漏れが発生し、緊急でご相談したいのですが。',
            reading: 'おせわになっております。ダル・アルハイじゅうきこうじょうのモタセムです。PC500LCショベルのゆあつポンプからいおんとあぶらもれがはっせいし、きんきゅうでごそうだんしたいのですが。',
            english: 'Hello, this is Motasem from Dar Al Hai Heavy Equipment Workshop. We have an abnormal noise and oil leak from the hydraulic pump on our PC500LC excavator, and I would like to consult urgently.',
            isBest: true,
            keigoLevel: 'Business Keigo (敬語 - Excellent)',
            feedback: 'Perfect polite business greeting (お世話になっております) with precise technical vocabulary (異音, 油漏れ, 緊急).'
          },
          {
            id: 'opt1_b',
            japanese: 'もしもし、機械が壊れました。油が漏れています。助けてください。',
            reading: 'もしもし、きかいがこわれました。あぶらがもれています。たすけてください。',
            english: 'Hello, machine is broken. Oil is leaking. Please help.',
            isBest: false,
            keigoLevel: 'Casual / Basic (初級)',
            feedback: 'Too casual for a professional call. State your company name, machine model, and specific failure details.'
          },
          {
            id: 'opt1_c',
            japanese: 'ダル・アルハイですが、PC500LCの油圧ポンプが動きません。直してください。',
            reading: 'ダル・アルハイですが、PC500LCのゆあつポンプがうごきません。なおしてください。',
            english: 'This is Dar Al Hai, the PC500LC pump does not work. Fix it.',
            isBest: false,
            keigoLevel: 'Direct / Blunt (不十分)',
            feedback: 'Lacks proper polite business cushioning (お世話になっております / ご相談したいのですが).'
          }
        ],
        keywords: [
          { kanji: '異音', reading: 'いおん (ion)', english: 'Abnormal noise' },
          { kanji: '油漏れ / 漏油', reading: 'あぶらもれ / ろうゆ', english: 'Oil leak / seepage' },
          { kanji: '油圧ポンプ', reading: 'ゆあつポンプ', english: 'Hydraulic pump' }
        ]
      },
      {
        turnId: 2,
        speaker: 'Komatsu Tech Support (コマツ技術担当者)',
        japanese: '承知いたしました。大変お困りのことと存じます。まず該当機の機番（シリアル番号）と、モニターに表示されている故障コード（エラーコード）をお教えいただけますでしょうか？',
        reading: 'しょうちいたしました。たいへんおこまりのこととぞんじます。まずがいとうきのきばん（シリアルばんごう）と、モニターにひょうじされているこしょうコード（エラーコード）をおしえいただけますでしょうか？',
        romaji: 'Shōchi itashimashita. Taihen o-komari no koto to zonjimasu. Mazu gaitō-ki no kiban (shiriaru bangō) to, monitā ni hyōji sarete iru koshō kōdo (erā kōdo) o oshie itadakemasu deshō ka?',
        english: 'Understood. We realize this is an urgent matter. First, could you please provide the serial number and the fault code displayed on the monitor panel?',
        userRolePrompt: 'Provide serial number 100433, operating hours 3,250 hrs, and fault code "E02 (Pump Pressure Loss)".',
        options: [
          {
            id: 'opt2_a',
            japanese: 'はい、機番は100433、稼働時間は3250時間です。モニターには「E02・メイン油圧吐出圧低下」のコードが点灯しております。',
            reading: 'はい、きばんは100433、かどうじかんは3250じかんです。モニターには「E02・メインゆあつとしゅつあつていか」のコードがてんとうしております。',
            english: 'Yes, the serial number is 100433, and operating hours are 3,250 hrs. The fault code "E02 - Main Pump Discharge Pressure Loss" is illuminated on the monitor.',
            isBest: true,
            keigoLevel: 'Technical Keigo (技術敬語 - Excellent)',
            feedback: 'Accurate terminology: 機番 (kiban), 稼働時間 (operating hours), 吐出圧低下 (discharge pressure drop), 点灯 (illuminated).'
          },
          {
            id: 'opt2_b',
            japanese: 'シリアルは100433で、画面にE02と書いてあります。',
            reading: 'シリアルは100433で、がめんにE02とかいてあります。',
            english: 'Serial is 100433, and it says E02 on the screen.',
            isBest: false,
            keigoLevel: 'Basic (初級)',
            feedback: 'Understandable, but in technical reporting specify "稼働時間" and "点灯しております".'
          }
        ],
        keywords: [
          { kanji: '機番 / シリアル', reading: 'きばん (kiban)', english: 'Machine serial number' },
          { kanji: '稼働時間', reading: 'かどうじかん (kadō jikan)', english: 'Service meter hours (SMR)' },
          { kanji: '吐出圧力', reading: 'としゅつあつりょく', english: 'Discharge pressure' }
        ]
      },
      {
        turnId: 3,
        speaker: 'Komatsu Tech Support (コマツ技術担当者)',
        japanese: '詳細な情報をありがとうございます。E02ですとポンプ斜板サーボ機構またはリリーフ弁の閉塞の可能性がございます。至急サービスマニュアルの該当ページをお送りし、現地エンジニアの派遣を手配いたしましょうか？',
        reading: 'しょうさいなじょうほうをありがとうございます。E02ですとポンプしゃばんサーボきこうまたはリリーフべんのへいそくのかのうせいがございます。しきゅうサービスマニュアルのがいとうページをおおくりし、げんちエンジニアのはけんをてはいいたしましょうか？',
        romaji: 'Shōsai na jōhō o arigatō gozaimasu. E02 desu to ponpu shaban sābo kikō matawa rirīfu-ben no heisoku no kanōsei ga gozaimasu. Shikyū sābisu manyuaru no gaitō pēji o o-okuri shi, genchi enjinia no haken o tehai itashimashō ka?',
        english: 'Thank you for the detailed information. With E02, there may be an issue with the pump swash plate servo mechanism or relief valve blockage. Shall I send the manual section and arrange a field engineer dispatch?',
        userRolePrompt: 'Thank them politely, request the manual PDF immediately, and state that you will also order the emergency seal kit.',
        options: [
          {
            id: 'opt3_a',
            japanese: 'ありがとうございます。ぜひマニュアルのご送付をお願いいたします。また、至急で油圧シールキットとリリーフバルブの手配も進めさせていただきます。',
            reading: 'ありがとうございます。ぜひマニュアルのごそうふをおねがいいたします。また、しきゅうでゆあつシールキットとリリーフバルブのてはいもすすめさせていただきます。',
            english: 'Thank you very much. Please do send the service manual section. In addition, we will proceed with ordering the emergency hydraulic seal kit and relief valve right away.',
            isBest: true,
            keigoLevel: 'Senior Engineer Keigo (上級敬語 - Flawless)',
            feedback: 'Excellent closing with polite humble request (ご送付をお願いいたします) and proactive action declaration (手配を進めさせていただきます).'
          },
          {
            id: 'opt3_b',
            japanese: 'はい、送ってください。部品も買います。',
            reading: 'はい、おくってください。ぶひんもかいます。',
            english: 'Yes, please send. I will also buy parts.',
            isBest: false,
            keigoLevel: 'Casual (普通)',
            feedback: 'Too blunt for partner communications. Use "ご送付をお願いいたします" instead of "送ってください".'
          }
        ],
        keywords: [
          { kanji: '至急', reading: 'しきゅう (shikyū)', english: 'Urgent / Immediately' },
          { kanji: '手配', reading: 'てはい (tehai)', english: 'Arrangements / Order placement' },
          { kanji: 'ご送付', reading: 'ごそうふ (go-sōfu)', english: 'Sending / Dispatching (Polite)' }
        ]
      }
    ]
  },

  {
    id: 'parts_inquiry',
    title: '2. Urgent Spare Parts & Lead Time (至急部品在庫・納期確認)',
    difficulty: 'Upper-Beginner (N5-N4)',
    icon: '📦',
    description: 'Contact Komatsu Parts Distribution Center regarding emergency order availability, pricing, and air freight delivery.',
    setting: 'Komatsu Dubai Parts Depot Inquiry (コマツ部品配送センターへの納期問い合わせ)',
    turns: [
      {
        turnId: 1,
        speaker: 'Komatsu Parts Specialist (コマツ部品担当者)',
        japanese: 'お世話になっております。コマツパーツセンターの鈴木です。部品のお見積り・在庫確認でしょうか？',
        reading: 'おせわになっております。コマツパーツセンターのすずきです。ぶひんのおみつもり・ざいこかくにんでしょうか？',
        romaji: 'O-sewa ni natte orimasu. Komatsu Pātsu Sentā no Suzuki desu. Buhin no o-mitsumori, zaiko kakunin deshō ka?',
        english: 'Hello, this is Suzuki from the Komatsu Parts Center. Are you inquiring about a quotation or inventory check?',
        userRolePrompt: 'State that you want to check stock and lead time for PC400 hydraulic filter (708-2L-04140) and track bolts under Emergency Order.',
        options: [
          {
            id: 'opt1_a',
            japanese: 'お世話になっております。PC400ショベル用のメインフィルター「708-2L-04140」を5点、至急エマージェンシーオーダー（EO）で手配したいのですが、現在庫と最短納期をご確認いただけますでしょうか？',
            reading: 'おせわになっております。PC400ショベルようのメインフィルター「708-2L-04140」を5てん、しきゅうエマージェンシーオーダー（EO）でてはいしたいのですが、げんざいことさいたんのうきをごかくにんいただけますでしょうか？',
            english: 'Hello. We would like to place an Emergency Order (EO) for 5 units of PC400 main filter "708-2L-04140". Could you please confirm current stock and the earliest delivery date?',
            isBest: true,
            keigoLevel: 'Business Professional (敬語 - Perfect)',
            feedback: 'Clear part number, exact quantity (5点), order type (EO), and polite inquiry (ご確認いただけますでしょうか).'
          },
          {
            id: 'opt1_b',
            japanese: 'フィルター5個ありますか？いつ届きますか？',
            reading: 'フィルター5こありますか？いつとどきますか？',
            english: 'Are there 5 filters? When will they arrive?',
            isBest: false,
            keigoLevel: 'Casual (初級)',
            feedback: 'Specify the Komatsu Part Number (品番) and Order Category (EO / Stock).'
          }
        ],
        keywords: [
          { kanji: '品番', reading: 'ひんばん (hinban)', english: 'Part number' },
          { kanji: '在庫状況', reading: 'ざいこじょうきょう', english: 'Stock availability' },
          { kanji: '最短納期', reading: 'さいたんのうき', english: 'Earliest delivery lead time' }
        ]
      },
      {
        turnId: 2,
        speaker: 'Komatsu Parts Specialist (コマツ部品担当者)',
        japanese: '品番「708-2L-04140」ですね。ただいまシステムを確認いたしましたところ、ドバイ倉庫に10点の在庫がございます。EO扱いであれば、本日夕方の航空便にて出荷可能でございます。',
        reading: 'ひんばん「708-2L-04140」ですね。ただいまシステムをかくにんいたしましたところ、ドバイそうこに10てんのざいこがございます。EOあつかいであれば、ほんじつゆうがたのこうくうびんにてしゅっかかのうでございます。',
        romaji: 'Hinban "708-2L-04140" desu ne. Tadaima shisutemu o kakunin itashimashita tokoro, Dubai sōko ni 10-ten no zaiko ga gozaimasu. EO atsukai de areba, honjitsu yūgata no kōkūbin nite shukka kanō de gozaimasu.',
        english: 'Part number 708-2L-04140. I just checked the system: Dubai warehouse has 10 units in stock. If processed as EO, we can dispatch via this evening’s air cargo.',
        userRolePrompt: 'Confirm order of 5 units via EO and request the proforma invoice / quotation condition confirmation.',
        options: [
          {
            id: 'opt2_a',
            japanese: '迅速なご確認ありがとうございます！では5点すべてEOにて正式発注いたします。PDXシステムより見積条件を承認（Confirmed）いたしますので、出荷手配をお願い申し上げます。',
            reading: 'じんそくなごかくにんありがとうございます！では5てんすべてEOにてせいしきはっちゅういたします。PDXシステムよりみつもりじょうけんをしょうにん（Confirmed）いたしますので、しゅっかてはいをおねがいもうしあげます。',
            english: 'Thank you for the prompt confirmation! We will formally place the order for all 5 units via EO. We will approve (Confirm) the quotation in PDX, so please proceed with shipping arrangements.',
            isBest: true,
            keigoLevel: 'Business Keigo (最上級敬語 - Flawless)',
            feedback: 'Expresses gratitude (迅速なご確認ありがとうございます), formal order commitment (正式発注), and refers to PDX quotation workflow.'
          },
          {
            id: 'opt2_b',
            japanese: 'わかりました。5個買います。送ってください。',
            reading: 'わかりました。5こかいます。おくってください。',
            english: 'Understood. I will buy 5. Please send.',
            isBest: false,
            keigoLevel: 'Too casual',
            feedback: 'Use "正式発注いたします" and "出荷手配をお願い申し上げます".'
          }
        ],
        keywords: [
          { kanji: '正式発注', reading: 'せいしきはっちゅう', english: 'Official purchase order' },
          { kanji: '航空便', reading: 'こうくうびん (kōkūbin)', english: 'Air cargo / Air freight' },
          { kanji: '出荷手配', reading: 'しゅっかてはい', english: 'Shipping arrangements' }
        ]
      }
    ]
  },

  {
    id: 'safety_5s_kyt',
    title: '3. Morning 5S & KYT Safety Briefing (朝礼・危険予知・指差呼称)',
    difficulty: 'Essential Factory Japanese (N5 - 5S)',
    icon: '⛑️',
    description: 'Conduct the daily morning safety meeting with technicians, practice Pointing and Calling (指差呼称 / ヨシ!), and review PPE compliance.',
    setting: 'Dar Al Hai Workshop Floor - 07:30 AM (整備工場 朝礼)',
    turns: [
      {
        turnId: 1,
        speaker: 'Workshop Supervisor (工場長)',
        japanese: 'みなさん、おはようございます！本日も安全第一で作業を進めます。まず本日の作業内容と保護具（PPE）の装着確認を行います。モタセムさん、足回りの整備予定と安全確認項目を報告してください。',
        reading: 'みなさん、おはようございます！ほんじつもあんぜんだいいちでさぎょうをすすめます。まずほんじつのさぎょうないようとほごぐ（PPE）のそうちゃくかくにんをおこないます。モタセムさん、あしまわりのせいびよていとあんぜんかくにんこうもくをほうこくしてください。',
        romaji: 'Mina-san, ohayō gozaimasu! Honjitsu mo anzen daiichi de sagyō o susumemasu. Mazu honjitsu no sagyō naiyō to hogogu (PPE) no sōchaku kakunin o okonaimasu. Motasem-san, ashimawari no seibi yotei to anzen kakunin kōmoku o hōkoku shite kudasai.',
        english: 'Good morning everyone! Today we will proceed with "Safety First". First, let us verify today’s tasks and PPE gear. Motasem-san, please report on the undercarriage overhaul schedule and safety checkpoints.',
        userRolePrompt: 'Report that you will perform PC400 track shoe replacement, confirm safety block insertion, and lead the pointing & calling routine.',
        options: [
          {
            id: 'opt1_a',
            japanese: 'おはようございます！本日はPC400の下部走行体・履帯交換を実施します。ジャッキアップ時は必ず安全支柱（スタンド）を設置し、油圧抜け防止を徹底します。ヘルメット・安全靴・保護メガネ、装着ヨシ！',
            reading: 'おはようございます！ほんじつはPC400のかぶそうこうたい・りたいこうかんをじっしします。ジャッキアップじはかならずあんぜんしちゅう（スタンド）をせっちし、ゆあつぬけぼうしをてっていします。ヘルメット・あんぜんぐつ・ほごメガネ、そうちゃくヨシ！',
            english: 'Good morning! Today we will perform PC400 undercarriage track shoe replacement. When jacking up the machine, we will strictly position safety support stands to prevent hydraulic collapse hazards. Helmet, safety shoes, goggles — All Checked (YOSHI)!',
            isBest: true,
            keigoLevel: 'Standard 5S Workshop Protocol (現場標準 - Excellent)',
            feedback: 'Clear mission statement, hazard countermeasures (安全支柱設置), and spirited Pointing & Calling (装着ヨシ!).'
          },
          {
            id: 'opt1_b',
            japanese: 'トラックの修理をします。気をつけます。',
            reading: 'トラックのしゅうりをします。きをつけます。',
            english: 'I will fix tracks. I will be careful.',
            isBest: false,
            keigoLevel: 'Too brief',
            feedback: 'KYT requires concrete hazard prevention measures like placing safety support stands.'
          }
        ],
        keywords: [
          { kanji: '安全第一', reading: 'あんぜんだいいち (anzen daiichi)', english: 'Safety First' },
          { kanji: '指差呼称', reading: 'しさこしょう (shisa koshō)', english: 'Pointing and Calling' },
          { kanji: '安全靴', reading: 'あんぜんぐつ (anzen-gutsu)', english: 'Steel-toe safety shoes' }
        ]
      }
    ]
  }
];
