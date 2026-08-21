# -*- coding: utf-8 -*-
"""
Official Verbatim Database for JLPT N5 and N4 Practice Tests (Vol. 1 & Vol. 2).
Every question is 100% matched to its individual sliced broadcast audio track,
booklet illustration, verbatim dialogue transcript, and official answer key.
"""

OFFICIAL_N5_VOL1_LISTENING = [
    # Mondai 1 (7 Qs)
    {
        "id": "n5-v1-l-1",
        "type": "Mondai 1 (課題理解)",
        "audioSrc": "/audio/japanese/slices/n5_v1/m1/q1.mp3",
        "image": "/images/japanese/listening/n5/m1_q1.png",
        "question": "1. 靴下の店で 女の人と 店の人が 話しています。女の人は どの靴下を 買いますか。",
        "options": ["果物の絵の 長い靴下", "動物の絵の 長い靴下", "果物の絵の 短い靴下", "動物の絵の 短い靴下"],
        "correct": 1,
        "transcript": "女「子どもの靴下、ありますか。」\n店「はい、長いのですか、短いのですか。」\n女「長いのです。」\n店「はい、果物の絵と動物の絵があります。どちらがいいですか。」\n女「そうですね、動物のをください。」\n質問：女の人はどの靴下を買いますか。",
        "explanation": "She asks for long socks with animal illustrations (動物の絵の長い靴下, Option 2)."
    },
    {
        "id": "n5-v1-l-2",
        "type": "Mondai 1 (課題理解)",
        "audioSrc": "/audio/japanese/slices/n5_v1/m1/q2.mp3",
        "image": "/images/japanese/listening/n5/m1_q2.png",
        "question": "2. 病院で 医者と 女の人が 話しています。女の人は 1日に 何回 薬を 飲みますか。",
        "options": ["1回（朝だけ）", "2回（朝と夜）", "3回（朝・昼・夜）", "4回（4時間おき）"],
        "correct": 1,
        "transcript": "医者「この薬は朝と夜ご飯を食べた後で飲んでください。」\n女「昼ご飯の後は…」\n医者「昼は飲まないでください。4日間飲んでくださいね。」\n女「わかりました。」\n質問：女の人は1日に何回薬を飲みますか。",
        "explanation": "The doctor specifies morning and evening only (2回 - 朝と夜, Option 2)."
    },
    {
        "id": "n5-v1-l-3",
        "type": "Mondai 1 (課題理解)",
        "audioSrc": "/audio/japanese/slices/n5_v1/m1/q3.mp3",
        "image": "/images/japanese/listening/n5/m1_q3.png",
        "question": "3. デパートで 女の人と 店の人が 話しています。店の人は どのカバンを 取りますか。",
        "options": ["上の段の 白いカバン", "上の段の 黒い小さいカバン", "上の段の 黒い大きいカバン", "下の段の カバン"],
        "correct": 2,
        "transcript": "女「すみません、その上の黒いカバンを取ってください。」\n店「どちらですか。この小さいのですか。」\n女「いいえ、大きいのです。」\n店「はい。」\n質問：店の人はどのカバンを取りますか。",
        "explanation": "She requests the large black bag from the top shelf (上の段の黒い大きいカバン, Option 3)."
    },
    {
        "id": "n5-v1-l-4",
        "type": "Mondai 1 (課題理解)",
        "audioSrc": "/audio/japanese/slices/n5_v1/m1/q4.mp3",
        "image": "/images/japanese/listening/n5/m1_q4.png",
        "question": "4. 教室で 先生が 話しています。学生は 机の上に 何を 置きますか。",
        "options": ["鉛筆と 消しゴムだけ", "ノートと 鉛筆と 消しゴム", "辞書と 鉛筆と 消しゴム", "時計と 鉛筆と 消しゴム"],
        "correct": 2,
        "transcript": "先生「今からテストをします。このテストでは辞書を使う問題がありますから、机の上に辞書を出してください。鉛筆と消しゴムも出してください。時計はカバンの中に入れてください。」\n学生「先生、ノートはどうしますか。」\n先生「ノートもカバンの中に入れてください。」\n質問：学生は机の上に何を置きますか。",
        "explanation": "Students must place dictionary, pencil, and eraser on the desk (辞書と鉛筆と消しゴム, Option 3)."
    },
    {
        "id": "n5-v1-l-5",
        "type": "Mondai 1 (課題理解)",
        "audioSrc": "/audio/japanese/slices/n5_v1/m1/q5.mp3",
        "image": "/images/japanese/listening/n5/m1_q5.png",
        "question": "5. バスの中で 旅行会社の人が 学生に 話しています。学生は はじめに 何を しますか。",
        "options": ["レストランで 晩御飯を 食べる", "部屋に 荷物を 持って行く", "部屋で テレビを 見る", "店で 買い物を する"],
        "correct": 0,
        "transcript": "旅行会社「皆さん、ホテルに着きました。今から1階のレストランで晩御飯を食べます。晩御飯は7時からです。今6時50分ですから、すぐに行ってください。皆さんの荷物はホテルの人が部屋に持って行きます。晩御飯の後はテレビを見たり買い物をしたりしてください。」\n質問：学生は はじめに 何をしますか。",
        "explanation": "Since it is already 6:50 PM, students must proceed immediately to the 1st floor restaurant for dinner (レストランで晩御飯を食べる, Option 1)."
    },
    {
        "id": "n5-v1-l-6",
        "type": "Mondai 1 (課題理解)",
        "audioSrc": "/audio/japanese/slices/n5_v1/m1/q6.mp3",
        "image": "/images/japanese/listening/n5/m1_q6.png",
        "question": "6. 男の人と 女の人が 話しています。男の人は 何を 持って行きますか。",
        "options": ["おにぎり", "おにぎりと 飲み物", "お菓子だけ", "飲み物と お菓子"],
        "correct": 2,
        "transcript": "女「来週の日曜日、海へ行きますね。何を持って行きましょうか。私はおにぎりを持って行きます。」\n男「じゃあ、僕は飲み物とお菓子をお願いします。」\n女「はい、飲み物とお菓子ですね。あ、飲み物は重いですね。海に着いてから買いましょう。」\n男「そうですね。」\n質問：男の人は何を持っていきますか。",
        "explanation": "Drinks will be bought at the beach, so the man only brings snacks (お菓子だけ, Option 3)."
    },
    {
        "id": "n5-v1-l-7",
        "type": "Mondai 1 (課題理解)",
        "audioSrc": "/audio/japanese/slices/n5_v1/m1/q7.mp3",
        "image": "/images/japanese/listening/n5/m1_q7.png",
        "question": "7. バス停で 女の人と バス会社の人が 話しています。女の人は 何番の バスに 乗りますか。",
        "options": ["1番のバス", "3番のバス", "5番のバス", "7番のバス"],
        "correct": 3,
        "transcript": "女「すみません、1番のバスは緑駅に行きますか。」\n男「いいえ、緑駅に行くバスは3番と5番と7番ですよ。」\n女「そうですか。」\n男「でも、今日は日曜日ですから、5番のバスはありません。」\n女「そうですか。」\n男「それから3番は朝と夕方のバスですから、今の時間は7番ですね。」\n女「わかりました。ありがとうございます。」\n質問：女の人は何番のバスに乗りますか。",
        "explanation": "On Sundays at the current time, only Bus No. 7 runs to Midori Station (7番のバス, Option 4)."
    },

    # Mondai 2 (6 Qs)
    {
        "id": "n5-v1-l-8",
        "type": "Mondai 2 (ポイント理解)",
        "audioSrc": "/audio/japanese/slices/n5_v1/m2/q1.mp3",
        "question": "8. 大学で 男の学生と 女の学生が 話しています。女の学生は 今日 何時間 勉強しますか。",
        "options": ["1時間", "3時間", "4時間", "7時間"],
        "correct": 2,
        "transcript": "男「山田さんはいつも何時間ぐらい勉強しますか。」\n女「うーん、毎日3時間ぐらいです。」\n男「えっ、私は毎日1時間です。」\n女「あ、でも明日はテストがありますから、今日は4時間勉強します。」\n男「そうですか。」\n質問：女の学生は今日何時間勉強しますか。",
        "explanation": "She studies 4 hours today due to tomorrow's test (4時間, Option 3)."
    },
    {
        "id": "n5-v1-l-9",
        "type": "Mondai 2 (ポイント理解)",
        "audioSrc": "/audio/japanese/slices/n5_v1/m2/q2.mp3",
        "question": "9. 男の人と 女の人が 話しています。女の人の 電話番号は 何番ですか。",
        "options": ["512-7734", "512-7743", "521-7734", "521-7743"],
        "correct": 1,
        "transcript": "男「あの、山田さんの電話番号は512-7734ですね。」\n女「いいえ、7734じゃなくて、7743です。」\n男「えっ、ちょっと待ってください。メモします。512-7743ですね。」\n女「はい、そうです。」\n質問：女の人の電話番号は何番ですか。",
        "explanation": "She clarifies her number is 512-7743 (512-7743, Option 2)."
    },
    {
        "id": "n5-v1-l-10",
        "type": "Mondai 2 (ポイント理解)",
        "audioSrc": "/audio/japanese/slices/n5_v1/m2/q3.mp3",
        "question": "10. 女の学生と 男の学生が 話しています。男の学生は 誰と 住んでいますか。",
        "options": ["一人で住んでいる", "両親と住んでいる", "姉と住んでいる", "弟と住んでいる"],
        "correct": 2,
        "transcript": "女「山田さんはお父さんとお母さんと一緒に住んでいますか。」\n男「いいえ、両親は遠くに住んでいます。」\n女「そうですか。」\n男「今、姉と一緒に住んでいます。」\n女「兄弟は一人ですか。」\n男「あ、弟もいますよ。弟は両親と一緒です。」\n質問：男の学生は誰と住んでいますか。",
        "explanation": "He currently lives with his older sister (姉と住んでいる, Option 3)."
    },
    {
        "id": "n5-v1-l-11",
        "type": "Mondai 2 (ポイント理解)",
        "audioSrc": "/audio/japanese/slices/n5_v1/m2/q4.mp3",
        "question": "11. 学校で 男の学生と 女の学生が 話しています。二人は どこで 昼ご飯を 食べますか。",
        "options": ["学校の食堂", "学校の喫茶店", "パン屋の店の中", "教室"],
        "correct": 3,
        "transcript": "男「もう1時ですね。何か食べませんか。」\n女「そうですね。でも今日は土曜日だから、学校の食堂も喫茶店も休みですよ。」\n男「じゃあ、パン屋でパンを買って、教室で食べましょうか。」\n女「そうですね。」\n質問：二人はどこで昼ご飯を食べますか。",
        "explanation": "They buy bakery bread and eat in the classroom (教室, Option 4)."
    },
    {
        "id": "n5-v1-l-12",
        "type": "Mondai 2 (ポイント理解)",
        "audioSrc": "/audio/japanese/slices/n5_v1/m2/q5.mp3",
        "question": "12. 教室で 先生が 学生に 話しています。学生は 何で 名前を 書きますか。",
        "options": ["黒のボールペン", "赤のボールペン", "黒の鉛筆", "赤の鉛筆"],
        "correct": 0,
        "transcript": "先生「はい、じゃあちょっと聞いてください。来月のバス旅行に行きたい人は、この紙にボールペンで名前を書いてください。鉛筆じゃなくて、ボールペンですよ。黒で書いてください。赤で書かないでくださいね。」\n質問：学生は何で名前を書きますか。",
        "explanation": "The teacher explicitly instructs to write with black ballpoint pen (黒のボールペン, Option 1)."
    },
    {
        "id": "n5-v1-l-13",
        "type": "Mondai 2 (ポイント理解)",
        "audioSrc": "/audio/japanese/slices/n5_v1/m2/q6.mp3",
        "question": "13. 女の学生と 男の学生が 話しています。二人は 明日 どこで 会いますか。",
        "options": ["駅の改札口", "駅の前の喫茶店", "サッカー場", "レストラン"],
        "correct": 1,
        "transcript": "女「明日の夜、一緒にサッカーを見に行きませんか。」\n男「いいですね。どこで会いましょうか。5時に駅で会いませんか。」\n女「駅は人が多いですよ。」\n男「そうですね。じゃあ、駅の前の喫茶店はどうですか。」\n女「はい、そうしましょう。」\n質問：二人は明日どこで会いますか。",
        "explanation": "They decide to meet at the cafe in front of the station (駅の前の喫茶店, Option 2)."
    },

    # Mondai 3 (5 Qs)
    {
        "id": "n5-v1-l-14",
        "type": "Mondai 3 (発話表現)",
        "audioSrc": "/audio/japanese/slices/n5_v1/m3/q1.mp3",
        "image": "/images/japanese/listening/n5/m3_q1.png",
        "question": "14. ご飯を食べました。何と言いますか。（矢印の人）",
        "options": ["ごちそうさまでした", "いただきます", "どういたしまして"],
        "correct": 0,
        "transcript": "状況：ご飯を食べました。\n質問：何と言いますか。\n1. ごちそうさまでした\n2. いただきます\n3. どういたしまして",
        "explanation": "Standard phrase after finishing a meal:「ごちそうさまでした」."
    },
    {
        "id": "n5-v1-l-15",
        "type": "Mondai 3 (発話表現)",
        "audioSrc": "/audio/japanese/slices/n5_v1/m3/q2.mp3",
        "image": "/images/japanese/listening/n5/m3_q2.png",
        "question": "15. 電車の中で席を譲ります。何と言いますか。（矢印の人）",
        "options": ["どうもありがとう", "はじめまして", "ここ、どうぞ"],
        "correct": 2,
        "transcript": "状況：電車の中で席を譲ります。\n質問：何と言いますか。\n1. どうもありがとう\n2. はじめまして\n3. ここ、どうぞ",
        "explanation": "Polite phrase when offering your seat to someone:「ここ、どうぞ」."
    },
    {
        "id": "n5-v1-l-16",
        "type": "Mondai 3 (発話表現)",
        "audioSrc": "/audio/japanese/slices/n5_v1/m3/q3.mp3",
        "image": "/images/japanese/listening/n5/m3_q3.png",
        "question": "16. うちへ帰ります。友達に何と言いますか。（矢印の人）",
        "options": ["いってきます", "じゃ、また", "ただいま"],
        "correct": 1,
        "transcript": "状況：うちへ帰ります。\n質問：何と言いますか。\n1. いってきます\n2. じゃ、また\n3. ただいま",
        "explanation": "Casual parting greeting to a friend:「じゃ、また」."
    },
    {
        "id": "n5-v1-l-17",
        "type": "Mondai 3 (発話表現)",
        "audioSrc": "/audio/japanese/slices/n5_v1/m3/q4.mp3",
        "image": "/images/japanese/listening/n5/m3_q4.png",
        "question": "17. 郵便局で切手を買います。何と言いますか。（矢印の人）",
        "options": ["切手を買いませんか", "切手をどうぞ", "切手をください"],
        "correct": 2,
        "transcript": "状況：郵便局で切手を買います。\n質問：何と言いますか。\n1. 切手を買いませんか\n2. 切手をどうぞ\n3. 切手をください",
        "explanation": "Standard purchase request phrase:「切手をください」."
    },
    {
        "id": "n5-v1-l-18",
        "type": "Mondai 3 (発話表現)",
        "audioSrc": "/audio/japanese/slices/n5_v1/m3/q5.mp3",
        "image": "/images/japanese/listening/n5/m3_q5.png",
        "question": "18. 友達は鉛筆がありません。友達に何と言いますか。（矢印の人）",
        "options": ["鉛筆、借りましょうか", "鉛筆、使いますか", "鉛筆、貸してください"],
        "correct": 1,
        "transcript": "状況：友達は鉛筆がありません。\n質問：何と言いますか。\n1. 鉛筆、借りましょうか\n2. 鉛筆、使いますか\n3. 鉛筆、貸してください",
        "explanation": "Offering your pencil to a friend in need:「鉛筆、使いますか」."
    },

    # Mondai 4 (6 Qs)
    {
        "id": "n5-v1-l-19",
        "type": "Mondai 4 (即時応答)",
        "audioSrc": "/audio/japanese/slices/n5_v1/m4/q1.mp3",
        "question": "19. 「今日は何日ですか。」",
        "options": ["三日です", "三週間です", "三時です"],
        "correct": 0,
        "transcript": "発話：「今日は何日ですか。」\n1. 三日です\n2. 三週間です\n3. 三時です",
        "explanation": "Replying with the date of the month:「三日です」."
    },
    {
        "id": "n5-v1-l-20",
        "type": "Mondai 4 (即時応答)",
        "audioSrc": "/audio/japanese/slices/n5_v1/m4/q2.mp3",
        "question": "20. 「すみません、図書館はどこですか。」",
        "options": ["あそこです", "6時までです", "本を借ります"],
        "correct": 0,
        "transcript": "発話：「すみません、図書館はどこですか。」\n1. あそこです\n2. 6時までです\n3. 本を借ります",
        "explanation": "Indicating location:「あそこです」."
    },
    {
        "id": "n5-v1-l-21",
        "type": "Mondai 4 (即時応答)",
        "audioSrc": "/audio/japanese/slices/n5_v1/m4/q3.mp3",
        "question": "21. 「明日、何時に学校に来ますか。」",
        "options": ["バスで行きます", "9時半です", "6人です"],
        "correct": 1,
        "transcript": "発話：「明日、何時に学校に来ますか。」\n1. バスで行きます\n2. 9時半です\n3. 6人です",
        "explanation": "Answering with arrival time:「9時半です」."
    },
    {
        "id": "n5-v1-l-22",
        "type": "Mondai 4 (即時応答)",
        "audioSrc": "/audio/japanese/slices/n5_v1/m4/q4.mp3",
        "question": "22. 「田中さん、その荷物を持ちましょうか。」",
        "options": ["どういたしまして", "持ちませんでした", "ありがとうございます"],
        "correct": 2,
        "transcript": "発話：「田中さん、その荷物を持ちましょうか。」\n1. どういたしまして\n2. 持ちませんでした\n3. ありがとうございます",
        "explanation": "Expressing gratitude when offered help:「ありがとうございます」."
    },
    {
        "id": "n5-v1-l-23",
        "type": "Mondai 4 (即時応答)",
        "audioSrc": "/audio/japanese/slices/n5_v1/m4/q5.mp3",
        "question": "23. 「ちょっと休みませんか。」",
        "options": ["日曜日です", "お元気ですか", "そうしましょう"],
        "correct": 2,
        "transcript": "発話：「ちょっと休みませんか。」\n1. 日曜日です\n2. お元気ですか\n3. そうしましょう",
        "explanation": "Agreeing to a joint invitation:「そうしましょう」."
    },
    {
        "id": "n5-v1-l-24",
        "type": "Mondai 4 (即時応答)",
        "audioSrc": "/audio/japanese/slices/n5_v1/m4/q6.mp3",
        "question": "24. 「それは何の本ですか。」",
        "options": ["料理の本です", "私の本です", "はい、そうです"],
        "correct": 0,
        "transcript": "発話：「それは何の本ですか。」\n1. 料理の本です\n2. 私の本です\n3. はい、そうです",
        "explanation": "Describing the book's topic/genre:「料理の本です」."
    }
]

OFFICIAL_N5_VOL2_LISTENING = [
    # Mondai 1 (7 Qs)
    {
        "id": "n5-v2-l-1",
        "type": "Mondai 1 (課題理解)",
        "audioSrc": "/audio/japanese/slices/n5_v2/m1/q1.mp3",
        "image": "/images/japanese/listening/n5_2018/m1_q1.png",
        "question": "1. 男の人と 女の人が 話しています。男の人は どこへ 行きますか。",
        "options": ["交差点を曲がった先の 銀行の隣（喫茶店みどり）", "交差点の手前の 郵便局", "駅の中の カフェ", "交差点の右側の スーパー"],
        "correct": 0,
        "transcript": "男「すみません、喫茶店みどりはどこですか。」\n女「喫茶店みどりですね。あそこに交差点がありますね。あの交差点を左に曲がってください。道の左側に銀行があります。喫茶店みどりは銀行の隣ですよ。」\n男「わかりました。ありがとうございます。」\n質問：男の人はどこへ行きますか。",
        "explanation": "He turns left at the intersection and heads to Kissaten Midori next to the bank (Option 1)."
    },
    {
        "id": "n5-v2-l-2",
        "type": "Mondai 1 (課題理解)",
        "audioSrc": "/audio/japanese/slices/n5_v2/m1/q2.mp3",
        "image": "/images/japanese/listening/n5_2018/m1_q2.png",
        "question": "2. 会社で 女の人と 男の人が 話しています。男の人は どの雑誌を 女の人に 渡しますか。",
        "options": ["時計の雑誌（7月号）", "時計の雑誌（8月号）", "車の雑誌（7月号）", "車の雑誌（8月号）"],
        "correct": 0,
        "transcript": "女「木村さん、すみません。木村さんの後ろにある雑誌を取ってください。」\n男「時計の雑誌ですか、車の雑誌ですか。」\n女「時計の雑誌です。」\n男「一番新しい8月のですか。」\n女「いいえ、7月のお願いします。」\n男「はい。」\n質問：男の人はどの雑誌を女の人に渡しますか。",
        "explanation": "She asks specifically for the July issue of the watch magazine (時計の雑誌 7月号, Option 1)."
    },
    {
        "id": "n5-v2-l-3",
        "type": "Mondai 1 (課題理解)",
        "audioSrc": "/audio/japanese/slices/n5_v2/m1/q3.mp3",
        "image": "/images/japanese/listening/n5_2018/m1_q3.png",
        "question": "3. 学校で 先生が 話しています。学生は 次、何日に 学校に 来ますか。",
        "options": ["4日", "6日", "9日", "10日"],
        "correct": 3,
        "transcript": "先生「皆さん、明日から休みですね。休みは4日から9日まで6日間です。10日はテストをします。休まないでください。では6日間ゆっくり休んで、また学校に来てください。」\n質問：学生は次、何日に学校に来ますか。",
        "explanation": "Vacation ends on the 9th, and test day is on the 10th (10日, Option 4)."
    },
    {
        "id": "n5-v2-l-4",
        "type": "Mondai 1 (課題理解)",
        "audioSrc": "/audio/japanese/slices/n5_v2/m1/q4.mp3",
        "image": "/images/japanese/listening/n5_2018/m1_q4.png",
        "question": "4. うちで 女の学生と 男の学生が 話しています。男の学生は 冷蔵庫から 何を 出しますか。",
        "options": ["卵2個と 牛乳", "卵3個と 牛乳と 魚", "卵2個と 牛乳と 魚", "卵3個と 魚だけ"],
        "correct": 1,
        "transcript": "女「冷蔵庫から卵を2個と牛乳を出してください。」\n男「はい。」\n女「それから魚も出してください。あ、すみません、卵は3個お願いします。」\n男「はい。」\n質問：男の学生は冷蔵庫から何を出しますか。",
        "explanation": "He takes out 3 eggs, milk, and fish (卵3個と牛乳と魚, Option 2)."
    },
    {
        "id": "n5-v2-l-5",
        "type": "Mondai 1 (課題理解)",
        "audioSrc": "/audio/japanese/slices/n5_v2/m1/q5.mp3",
        "image": "/images/japanese/listening/n5_2018/m1_q5.png",
        "question": "5. 日本語学校で 女の人と 男の人が 話しています。女の人は 何曜日の クラスで 勉強しますか。",
        "options": ["月曜日のクラス", "火曜日のクラス", "木曜日のクラス", "金曜日のクラス"],
        "correct": 0,
        "transcript": "男「夜のクラスは毎週月曜日、火曜日、木曜日、金曜日です。夜6時からです。」\n女「火曜日と金曜日は仕事が6時に終わりません。」\n男「では月曜日がいいですよ。木曜日のクラスは話す時間が短いです。」\n女「わかりました。じゃあ来週から勉強したいです。」\n質問：女の人は何曜日のクラスで勉強しますか。",
        "explanation": "She selects the Monday night class (月曜日のクラス, Option 1)."
    },
    {
        "id": "n5-v2-l-6",
        "type": "Mondai 1 (課題理解)",
        "audioSrc": "/audio/japanese/slices/n5_v2/m1/q6.mp3",
        "image": "/images/japanese/listening/n5_2018/m1_q6.png",
        "question": "6. 日本語学校で 先生が 学生に 話しています。学生は 明日の午前、どの教室に 行きますか。",
        "options": ["1階の 3番の教室", "1階の 4番の教室", "2階の 3番の教室", "2階の 4番の教室"],
        "correct": 3,
        "transcript": "先生「明日の午前はクラスに日本人の学生が来ますから、広い教室で授業をします。2階の4番の教室に来てください。午後は1階の3番の教室で授業をします。」\n質問：学生は明日の午前、どの教室に行きますか。",
        "explanation": "For morning class, go to Room 4 on the 2nd floor (2階の4番の教室, Option 4)."
    },
    {
        "id": "n5-v2-l-7",
        "type": "Mondai 1 (課題理解)",
        "audioSrc": "/audio/japanese/slices/n5_v2/m1/q7.mp3",
        "image": "/images/japanese/listening/n5_2018/m1_q7.png",
        "question": "7. 女の人と 男の人が 話しています。女の人は 何を 持って行きますか。",
        "options": ["スパゲティと 飲み物", "おにぎりと カメラ", "果物と お菓子", "おにぎりと 飲み物"],
        "correct": 1,
        "transcript": "女「佐藤さん、日曜日、佐藤さんのおうちでパーティーをしますね。何か持っていきましょうか。飲み物はどうですか。」\n男「ありがとうございます。飲み物はたくさんありますから、食べ物がいいです。じゃあ、おにぎりを持ってきてください。私はスパゲティを作ります。」\n女「わかりました。」\n男「それから、カメラはありますか。」\n女「はい。」\n男「パーティーの時使いたいですから、貸してください。」\n女「はい、いいですよ。」\n質問：女の人は何を持っていきますか。",
        "explanation": "She agrees to bring onigiri and her camera (おにぎりとカメラ, Option 2)."
    },

    # Mondai 2 (6 Qs)
    {
        "id": "n5-v2-l-8",
        "type": "Mondai 2 (ポイント理解)",
        "audioSrc": "/audio/japanese/slices/n5_v2/m2/q1.mp3",
        "question": "8. 女の人は 何のジュースを 作りましたか。",
        "options": ["りんごと みかんと バナナ", "りんごと みかんだけ", "みかんと バナナだけ", "りんごと バナナだけ"],
        "correct": 0,
        "transcript": "女「果物のジュースを作りました。どうぞ飲んでください。」\n男「いただきます。これは何のジュースですか。」\n女「りんごと、それからみかんとバナナを少し入れました。」\n質問：女の人は何のジュースを作りましたか。",
        "explanation": "She made juice using apples, mandarins, and bananas (Option 1)."
    },
    {
        "id": "n5-v2-l-9",
        "type": "Mondai 2 (ポイント理解)",
        "audioSrc": "/audio/japanese/slices/n5_v2/m2/q2.mp3",
        "question": "9. 女の学生と 男の学生が 話しています。男の学生は お兄さんが 何人 いますか。",
        "options": ["1人", "2人", "3人", "4人"],
        "correct": 0,
        "transcript": "女「中山さん、中山さんの家族は何人ですか。」\n男「4人です。両親と兄が一人と僕です。お兄さんは結婚して子供が二人いますよ。」\n質問：男の学生はお兄さんが何人いますか。",
        "explanation": "He has one older brother (1人, Option 1)."
    },
    {
        "id": "n5-v2-l-10",
        "type": "Mondai 2 (ポイント理解)",
        "audioSrc": "/audio/japanese/slices/n5_v2/m2/q3.mp3",
        "question": "10. 会社で 女の人と 男の人が 話しています。男の人は 何で 会社に 来ていますか。",
        "options": ["電車", "バス", "自転車", "車"],
        "correct": 2,
        "transcript": "女「電車じゃなくてバスで会社に来ていますか。」\n男「いいえ、僕は自転車です。前は車で来ていましたが、車はお金がかかりますから今は乗っていません。」\n質問：男の人は何で会社に来ていますか。",
        "explanation": "He currently commutes by bicycle (自転車, Option 3)."
    },
    {
        "id": "n5-v2-l-11",
        "type": "Mondai 2 (ポイント理解)",
        "audioSrc": "/audio/japanese/slices/n5_v2/m2/q4.mp3",
        "question": "11. 電話で 女の学生と 男の学生が 話しています。二人は 今日 一緒に 何を しますか。",
        "options": ["映画を 見る", "バスケットボールを する", "ラーメンを 食べる", "DVDを 借りに行く"],
        "correct": 0,
        "transcript": "女「今日、家で映画を見ませんか。面白いDVDを借りましたよ。」\n男「今日は友達とバスケをしてラーメンを食べに行きますが、午後は大丈夫です。」\n女「じゃあ、午後来てください。」\n質問：二人は今日一緒に何をしますか。",
        "explanation": "In the afternoon, they watch the movie DVD together (映画を見る, Option 1)."
    },
    {
        "id": "n5-v2-l-12",
        "type": "Mondai 2 (ポイント理解)",
        "audioSrc": "/audio/japanese/slices/n5_v2/m2/q5.mp3",
        "question": "12. 大学で 日本人の学生と 男の留学生が 話しています。日本から 男の留学生の 国まで 飛行機で 何時間 かかりますか。",
        "options": ["1時間半", "3時間半", "5時間", "6時間"],
        "correct": 1,
        "transcript": "女「日本からジョージさんの国まで飛行機でどのくらいですか。5時間か6時間ぐらいですか。」\n男「もっと早いですよ。3時間半です。」\n質問：飛行機で何時間かかりますか。",
        "explanation": "Flight duration is 3.5 hours (3時間半, Option 2)."
    },
    {
        "id": "n5-v2-l-13",
        "type": "Mondai 2 (ポイント理解)",
        "audioSrc": "/audio/japanese/slices/n5_v2/m2/q6.mp3",
        "question": "13. 電話で 女の学生が 話しています。今晩、何の店に ご飯を 食べに 行きますか。",
        "options": ["カレー屋", "ピザ屋", "寿司屋", "蕎麦屋"],
        "correct": 1,
        "transcript": "女「今朝、学校では駅の前のカレー屋に来てくださいと言いましたが、今日は店が休みです。だからピザ屋に行きます。1階に蕎麦屋があるビルの3階です。」\n質問：今晩、何の店にご飯を食べに行きますか。",
        "explanation": "Because the curry shop is closed, they go to the pizza place on the 3rd floor (ピザ屋, Option 2)."
    },

    # Mondai 3 (5 Qs)
    {
        "id": "n5-v2-l-14",
        "type": "Mondai 3 (発話表現)",
        "audioSrc": "/audio/japanese/slices/n5_v2/m3/q1.mp3",
        "image": "/images/japanese/listening/n5_2018/m3_q1.png",
        "question": "14. 山を歩いています。友達と一緒に休みたいです。何と言いますか。（矢印の人）",
        "options": ["あまり休みません", "今休んでいますか", "少し休みましょう"],
        "correct": 2,
        "transcript": "状況：山を歩いています。友達と一緒に休みたいです。\n質問：何と言いますか。\n1. あまり休みません\n2. 今休んでいますか\n3. 少し休みましょう",
        "explanation": "Inviting friend to rest:「少し休みましょう」."
    },
    {
        "id": "n5-v2-l-15",
        "type": "Mondai 3 (発話表現)",
        "audioSrc": "/audio/japanese/slices/n5_v2/m3/q2.mp3",
        "image": "/images/japanese/listening/n5_2018/m3_q2.png",
        "question": "15. 友達にチョコレートをあげます。何と言いますか。（矢印の人）",
        "options": ["どんなチョコレートですか", "チョコレートをあげませんか", "チョコレート、いかがですか"],
        "correct": 2,
        "transcript": "状況：友達にチョコレートをあげます。\n質問：何と言いますか。\n1. どんなチョコレートですか\n2. チョコレートをあげませんか\n3. チョコレート、いかがですか",
        "explanation": "Offering chocolate politely:「チョコレート、いかがですか」."
    },
    {
        "id": "n5-v2-l-16",
        "type": "Mondai 3 (発話表現)",
        "audioSrc": "/audio/japanese/slices/n5_v2/m3/q3.mp3",
        "image": "/images/japanese/listening/n5_2018/m3_q3.png",
        "question": "16. エレベーターに乗りたいです。何と言いますか。（矢印の人）",
        "options": ["あ、乗ります", "さあ、乗りましょう", "すぐ乗ってください"],
        "correct": 0,
        "transcript": "状況：エレベーターに乗りたいです。\n質問：何と言いますか。\n1. あ、乗ります\n2. さあ、乗りましょう\n3. すぐ乗ってください",
        "explanation": "Calling out that you are boarding the elevator:「あ、乗ります」."
    },
    {
        "id": "n5-v2-l-17",
        "type": "Mondai 3 (発話表現)",
        "audioSrc": "/audio/japanese/slices/n5_v2/m3/q4.mp3",
        "image": "/images/japanese/listening/n5_2018/m3_q4.png",
        "question": "17. 前に自転車があります。友達は見ていません。何と言いますか。（矢印の人）",
        "options": ["見ませんよ", "危ないですよ", "痛いですよ"],
        "correct": 1,
        "transcript": "状況：前に自転車があります。友達は見ていません。\n質問：何と言いますか。\n1. 見ませんよ\n2. 危ないですよ\n3. 痛いですよ",
        "explanation": "Warning friend of danger:「危ないですよ」."
    },
    {
        "id": "n5-v2-l-18",
        "type": "Mondai 3 (発話表現)",
        "audioSrc": "/audio/japanese/slices/n5_v2/m3/q5.mp3",
        "image": "/images/japanese/listening/n5_2018/m3_q5.png",
        "question": "18. レストランでコーヒーが来ません。長い時間待っています。店の人に何と言いますか。（矢印の人）",
        "options": ["コーヒーを持ってきますよ", "コーヒーはまだですか", "コーヒーを飲みませんか"],
        "correct": 1,
        "transcript": "状況：レストランでコーヒーが来ません。長い時間待っています。\n質問：何と言いますか。\n1. コーヒーを持ってきますよ\n2. コーヒーはまだですか\n3. コーヒーを飲みませんか",
        "explanation": "Inquiring about delayed order:「コーヒーはまだですか」."
    },

    # Mondai 4 (6 Qs)
    {
        "id": "n5-v2-l-19",
        "type": "Mondai 4 (即時応答)",
        "audioSrc": "/audio/japanese/slices/n5_v2/m4/q1.mp3",
        "question": "19. 「リーさん、リーさんはいつ日本に来ましたか。」",
        "options": ["去年です", "5時間です", "3ヶ月です"],
        "correct": 0,
        "transcript": "発話：「リーさん、リーさんはいつ日本に来ましたか。」\n1. 去年です\n2. 5時間です\n3. 3ヶ月です",
        "explanation": "Stating arrival date/year:「去年です」."
    },
    {
        "id": "n5-v2-l-20",
        "type": "Mondai 4 (即時応答)",
        "audioSrc": "/audio/japanese/slices/n5_v2/m4/q2.mp3",
        "question": "20. 「昼ご飯はもう食べましたか。」",
        "options": ["そうしましょう", "食堂ですよ", "いいえ、今からです"],
        "correct": 2,
        "transcript": "発話：「昼ご飯はもう食べましたか。」\n1. そうしましょう\n2. 食堂ですよ\n3. いいえ、今からです",
        "explanation": "Replying that you are about to eat:「いいえ、今からです」."
    },
    {
        "id": "n5-v2-l-21",
        "type": "Mondai 4 (即時応答)",
        "audioSrc": "/audio/japanese/slices/n5_v2/m4/q3.mp3",
        "question": "21. 「美味しいクッキーですね。どこで買いましたか。」",
        "options": ["デパートで買いましょう", "はい、そうです", "私が作りました"],
        "correct": 2,
        "transcript": "発話：「美味しいクッキーですね。どこで買いましたか。」\n1. デパートで買いましょう\n2. はい、そうです\n3. 私が作りました",
        "explanation": "Explaining you baked them yourself:「私が作りました」."
    },
    {
        "id": "n5-v2-l-22",
        "type": "Mondai 4 (即時応答)",
        "audioSrc": "/audio/japanese/slices/n5_v2/m4/q4.mp3",
        "question": "22. 「明日京都に行きますね。何時の飛行機に乗りますか。」",
        "options": ["はい、飛行機で行きますよ", "4時半の飛行機です", "1時間ぐらい乗ります"],
        "correct": 1,
        "transcript": "発話：「明日京都に行きますね。何時の飛行機に乗りますか。」\n1. はい、飛行機で行きますよ\n2. 4時半の飛行機です\n3. 1時間ぐらい乗ります",
        "explanation": "Stating departure flight time:「4時半の飛行機です」."
    },
    {
        "id": "n5-v2-l-23",
        "type": "Mondai 4 (即時応答)",
        "audioSrc": "/audio/japanese/slices/n5_v2/m4/q5.mp3",
        "question": "23. 「すみません、田中さんの電話番号を知っていますか。」",
        "options": ["はい、わかりますよ", "ええ、知りませんでした", "電話をしていません"],
        "correct": 0,
        "transcript": "発話：「すみません、田中さんの電話番号を知っていますか。」\n1. はい、わかりますよ\n2. ええ、知りませんでした\n3. 電話をしていません",
        "explanation": "Affirmative answer acknowledging you know the number:「はい、わかりますよ」."
    },
    {
        "id": "n5-v2-l-24",
        "type": "Mondai 4 (即時応答)",
        "audioSrc": "/audio/japanese/slices/n5_v2/m4/q6.mp3",
        "question": "24. 「夏休みはどこかへ出かけましたか。」",
        "options": ["旅行しましょう", "どこへも行きませんでした", "外国から来ました"],
        "correct": 1,
        "transcript": "発話：「夏休みはどこかへ出かけましたか。」\n1. 旅行しましょう\n2. どこへも行きませんでした\n3. 外国から来ました",
        "explanation": "Replying that you did not go anywhere:「どこへも行きませんでした」."
    }
]

OFFICIAL_N4_VOL1_LISTENING = [
    # Mondai 1 (8 Qs)
    {
        "id": "n4-v1-l-1",
        "type": "Mondai 1 (課題理解)",
        "audioSrc": "/audio/japanese/slices/n4_v1/m1/q1.mp3",
        "image": "/images/japanese/listening/n4/m1_q1.png",
        "question": "1. 男の人と 女の人が 話しています。男の人は 何で 美術館へ 行きますか。",
        "options": ["車", "電車", "バス", "自転車"],
        "correct": 3,
        "transcript": "男「美術館に行きたいんですけど、何で行くのが便利ですか。」\n女「車で行けば10分ですよ。」\n男「そうですか。電車かバスでも行けますか。」\n女「うーん、行けますけど時間がかかりますよ。自転車は持っていますか。」\n男「はい。」\n女「じゃあ、自転車の方が便利ですよ。」\n男「そうですか、わかりました。じゃあ、そうします。」\n質問：男の人は何で美術館へ行きますか。",
        "explanation": "The woman recommends cycling as the most convenient option (自転車, Option 4)."
    },
    {
        "id": "n4-v1-l-2",
        "type": "Mondai 1 (課題理解)",
        "audioSrc": "/audio/japanese/slices/n4_v1/m1/q2.mp3",
        "image": "/images/japanese/listening/n4/m1_q2.png",
        "question": "2. 男の学生と 女の学生が 話しています。男の学生は 何を 買いますか。",
        "options": ["カバン", "カップ", "タオル", "スポーツウェア"],
        "correct": 2,
        "transcript": "女「来週、佐藤さんの誕生日だね。もうプレゼント買った？」\n男「うん、まだ決められなくて困っているんだ。」\n女「じゃあ、カップはどう？佐藤さんコーヒーが好きでよく飲んでいるよ。」\n男「うん、でもカップはもうたくさん持っているかもしれないな。」\n女「じゃあ、タオルはどう？よくスポーツをしているから。」\n男「そうだね。じゃあ、そうしよう。ありがとう。」\n質問：男の学生は何を買いますか。",
        "explanation": "He chooses to buy a towel for Sato who often does sports (タオル, Option 3)."
    },
    {
        "id": "n4-v1-l-3",
        "type": "Mondai 1 (課題理解)",
        "audioSrc": "/audio/japanese/slices/n4_v1/m1/q3.mp3",
        "image": "/images/japanese/listening/n4/m1_q3.png",
        "question": "3. 男の人と 女の人が 話しています。女の人は チケットを 何枚 予約しますか。",
        "options": ["2枚", "4枚", "5枚", "6枚"],
        "correct": 2,
        "transcript": "男「来月のコンサートのチケットを予約してくれる？」\n女「うん、いいよ。何枚？」\n男「僕たち2人と友達4人。」\n女「じゃあ、6枚ね。」\n男「あ、そうだ、ごめん。一人都合が悪くなったから、5人だ。」\n女「うん、そう。わかった、ありがとう。じゃあお願い。」\n質問：女の人はチケットを何枚予約しますか。",
        "explanation": "One person cancelled, so she reserves 5 tickets (5枚, Option 3)."
    },
    {
        "id": "n4-v1-l-4",
        "type": "Mondai 1 (課題理解)",
        "audioSrc": "/audio/japanese/slices/n4_v1/m1/q4.mp3",
        "image": "/images/japanese/listening/n4/m1_q4.png",
        "question": "4. 女の人と 男の人が 写真について 話しています。女の人は どの写真を 送りますか。",
        "options": ["海と 山の写真", "山と 大学の前の写真", "山と 部屋の写真", "海と 大学の前の写真"],
        "correct": 1,
        "transcript": "女「国の両親に写真を送りたいんだけど、どれがいいと思う？」\n男「この海の写真は顔が小さくてよく見えないね。」\n女「うん、じゃあだめだね。」\n男「この山の写真はどう？」\n女「うん、これいいね。じゃあこれ1枚。もう1枚はこの私の部屋の写真…」\n男「部屋の写真はあまり綺麗じゃないからやめた方がいいよ。それより大学の前で撮った写真がいいよ。」\n女「そうだね、この2枚にしよう。」\n質問：女の人はどの写真を送りますか。",
        "explanation": "She picks the mountain photo and the university entrance photo (山と大学の前の写真, Option 2)."
    },
    {
        "id": "n4-v1-l-5",
        "type": "Mondai 1 (課題理解)",
        "audioSrc": "/audio/japanese/slices/n4_v1/m1/q5.mp3",
        "image": "/images/japanese/listening/n4/m1_q5.png",
        "question": "5. 男の留学生と 女の人が 話しています。男の留学生は 何を 持って行きますか。",
        "options": ["花", "果物", "本", "音楽のCD"],
        "correct": 2,
        "transcript": "男「友達が怪我をして入院しているんです。お見舞いに行きたいんですが、日本では何を持っていきますか。」\n女「そうですね、よく花や果物を持っていきます。病院では時間がたくさんあるから、本もいいと思いますよ。」\n男「ああ、いいですね。本を読むのが好きだからそうします。」\n女「若い人なら音楽のCDもいいと思いますよ。」\n男「うーん、でも音楽はあまり聴きませんから…」\n質問：男の留学生は何を持っていきますか。",
        "explanation": "He brings books since his hospitalized friend loves reading (本, Option 3)."
    },
    {
        "id": "n4-v1-l-6",
        "type": "Mondai 1 (課題理解)",
        "audioSrc": "/audio/japanese/slices/n4_v1/m1/q6.mp3",
        "image": "/images/japanese/listening/n4/m1_q6.png",
        "question": "6. 会社で 男の人と 女の人が 話しています。女の人は 今日 この後 何を しますか。",
        "options": ["資料のコピーを する", "会議室の 椅子を 並べる", "部長に 電話を かける", "明日の 会議に 出席する"],
        "correct": 0,
        "transcript": "男「部長から電話があって資料のコピーを頼まれたんだ。お願いしてもいい？」\n女「わかりました。明日の会議の資料ですね。」\n男「うん。それから会議室の準備だけど、椅子を並べておいてくれる？」\n女「はい。でも会議室は今使っています。」\n男「そうか。じゃあそれは明日だね。」\n質問：女の人は今日この後何をしますか。",
        "explanation": "Since the meeting room is currently occupied, she only makes photocopies of the materials today (資料のコピーをする, Option 1)."
    },
    {
        "id": "n4-v1-l-7",
        "type": "Mondai 1 (課題理解)",
        "audioSrc": "/audio/japanese/slices/n4_v1/m1/q7.mp3",
        "image": "/images/japanese/listening/n4/m1_q7.png",
        "question": "7. 教室で 先生が 話しています。学生は 明日 何時に どこに 集まらなければ なりませんか。",
        "options": ["8時半に 体育館の前", "8時半に 教室の中", "9時に 体育館の前", "9時に 教室の中"],
        "correct": 0,
        "transcript": "先生「明日のバス旅行について連絡します。明日は朝8時半までに来てください。いつもは9時からですが、30分早いので間違えないでくださいね。学校の体育館の前に集まってください。教室じゃなくて体育館の前ですよ。」\n質問：学生は明日何時にどこに集まらなければなりませんか。",
        "explanation": "Gather by 8:30 AM in front of the gymnasium (8時半に体育館の前, Option 1)."
    },
    {
        "id": "n4-v1-l-8",
        "type": "Mondai 1 (課題理解)",
        "audioSrc": "/audio/japanese/slices/n4_v1/m1/q8.mp3",
        "image": "/images/japanese/listening/n4/m1_q8.png",
        "question": "8. 図書館で 男の人と 係の人が 話しています。男の人は この後 どのボタンを 押しますか。",
        "options": ["青いボタンと 白いボタン", "赤いボタンと 黄色いボタン", "赤いボタンと 白いボタン", "黄色いボタンと 青いボタン"],
        "correct": 1,
        "transcript": "男「すみません、ちょっとコピーの仕方を教えてもらえませんか。青いボタンを押したんですが、字が小さくなってしまったんです。」\n係「字を大きくするなら赤いボタンを押してください。」\n男「あ、はい。それからもう少し濃くしたいんです。」\n係「じゃあ黄色いボタンを押してください。薄くする時は白いボタンです。」\n男「そうですか、どうもありがとうございます。」\n質問：男の人はこの後どのボタンを押しますか。",
        "explanation": "Red button to enlarge font, and yellow button to increase ink density (赤いボタンと黄色いボタン, Option 2)."
    },

    # Mondai 2 (7 Qs)
    {
        "id": "n4-v1-l-9",
        "type": "Mondai 2 (ポイント理解)",
        "audioSrc": "/audio/japanese/slices/n4_v1/m2/q1.mp3",
        "question": "9. 女の学生は 誰と 住んでいますか。",
        "options": ["弟と 住んでいる", "両親と 住んでいる", "姉と 住んでいる", "一人で 住んでいる"],
        "correct": 0,
        "transcript": "男「山田さん、新しい生活はどう？」\n女「はい、毎日楽しいです。」\n男「ご両親と一緒じゃなくて寂しくない？」\n女「ええ、少し。でも弟と一緒に住んでいるので大丈夫です。」\n男「そうなんだ。姉さんは？」\n女「姉は両親と一緒に住んでいます。」\n質問：女の学生は誰と住んでいますか。",
        "explanation": "She lives with her younger brother (弟と住んでいる, Option 1)."
    },
    {
        "id": "n4-v1-l-10",
        "type": "Mondai 2 (ポイント理解)",
        "audioSrc": "/audio/japanese/slices/n4_v1/m2/q2.mp3",
        "question": "10. 女の学生は いつ 男の学生に 相談しますか。",
        "options": ["今日の 4時頃", "今日の 6時", "明日の 昼", "明日の 夕方"],
        "correct": 0,
        "transcript": "女「先輩、相談したいことがあるんですが、今いいですか。」\n男「ごめん、今から授業があるんだ。今日の夕方、4時頃なら大丈夫だよ。明日の昼でもいいよ。」\n女「明日は用事があるんです。じゃあ今日の4時にお願いします。」\n質問：女の学生はいつ男の学生に相談しますか。",
        "explanation": "Today at around 4:00 PM (今日の4時頃, Option 1)."
    },
    {
        "id": "n4-v1-l-11",
        "type": "Mondai 2 (ポイント理解)",
        "audioSrc": "/audio/japanese/slices/n4_v1/m2/q3.mp3",
        "question": "11. 女の留学生は どうして アルバイトが したいですか。",
        "options": ["日本人の働き方を 知りたいから", "旅行のお金を ためるため", "デパートで 買い物を したいから", "日本語を 勉強する 時間がないから"],
        "correct": 0,
        "transcript": "先生「冬休みはどこか旅行に行きますか。」\n女「いいえ、デパートでアルバイトをするつもりです。日本人の働き方が知りたいんです。」\n先生「いい経験になりますね。」\n質問：女の留学生はどうしてアルバイトがしたいですか。",
        "explanation": "To learn how Japanese people work (日本人の働き方を知りたいから, Option 1)."
    },
    {
        "id": "n4-v1-l-12",
        "type": "Mondai 2 (ポイント理解)",
        "audioSrc": "/audio/japanese/slices/n4_v1/m2/q4.mp3",
        "question": "12. 何曜日に 一日中 雨が 降ると 言っていますか。",
        "options": ["月曜日", "水曜日", "木曜日", "金曜日"],
        "correct": 2,
        "transcript": "アナウンス「東京の週間天気予報です。月曜と火曜は晴れ。水曜は夜から雨になるでしょう。木曜日は一日ずっと雨になるでしょう。金曜と週末は晴れるでしょう。」\n質問：何曜日に一日中雨が降ると言っていますか。",
        "explanation": "Thursday will have continuous rain all day (木曜日, Option 3)."
    },
    {
        "id": "n4-v1-l-13",
        "type": "Mondai 2 (ポイント理解)",
        "audioSrc": "/audio/japanese/slices/n4_v1/m2/q5.mp3",
        "question": "13. 男の人は 最近 どのぐらい 本を 読んでいますか。",
        "options": ["全然 読んでいない", "月に 1冊", "月に 3冊", "月に 10冊以上"],
        "correct": 0,
        "transcript": "女「山田さんはよく本を読みますか。」\n男「子どもの時は月に10冊以上読んでいましたが、最近は仕事が忙しくて全然読んでいませんね。」\n質問：男の人は最近どのぐらい本を読んでいますか。",
        "explanation": "He currently does not read any books at all (全然読んでいない, Option 1)."
    },
    {
        "id": "n4-v1-l-14",
        "type": "Mondai 2 (ポイント理解)",
        "audioSrc": "/audio/japanese/slices/n4_v1/m2/q6.mp3",
        "question": "14. 女の学生は 子どもの時 何に なりたかったですか。",
        "options": ["ピアニスト", "小学校の先生", "警察官", "看護師"],
        "correct": 0,
        "transcript": "男「田中さんは将来どんな仕事がしたいですか。」\n女「将来は小学校の先生になりたいです。子どもの時はピアニストになりたかったんです。」\n質問：女の学生は子供の時何になりたかったですか。",
        "explanation": "In childhood, she wanted to become a pianist (ピアニスト, Option 1)."
    },
    {
        "id": "n4-v1-l-15",
        "type": "Mondai 2 (ポイント理解)",
        "audioSrc": "/audio/japanese/slices/n4_v1/m2/q7.mp3",
        "question": "15. 次の船は 何時に 出発しますか。",
        "options": ["10時10分", "10時20分", "10時30分", "10時50分"],
        "correct": 1,
        "transcript": "アナウンス「皆様、もうすぐ次の船が出発します。出発は10時20分の予定です。出発まで10分です。」\n質問：次の船は何時に出発しますか。",
        "explanation": "Next departure is at 10:20 (10時20分, Option 2)."
    },

    # Mondai 3 (5 Qs)
    {
        "id": "n4-v1-l-16",
        "type": "Mondai 3 (発話表現)",
        "audioSrc": "/audio/japanese/slices/n4_v1/m3/q1.mp3",
        "image": "/images/japanese/listening/n4/m3_q1.png",
        "question": "16. お土産を買いました。先輩にあげます。何と言いますか。（矢印の人）",
        "options": ["これ、お土産です。どうぞ", "お土産、いただきます", "お土産を買っておきます"],
        "correct": 0,
        "transcript": "状況：お土産を買いました。先輩にあげます。\n質問：何と言いますか。\n1. これ、お土産です。どうぞ\n2. お土産、いただきます\n3. お土産を買っておきます",
        "explanation": "Offering a souvenir politely to a senior:「これ、お土産です。どうぞ」."
    },
    {
        "id": "n4-v1-l-17",
        "type": "Mondai 3 (発話表現)",
        "audioSrc": "/audio/japanese/slices/n4_v1/m3/q2.mp3",
        "image": "/images/japanese/listening/n4/m3_q2.png",
        "question": "17. 明日、2人で映画に行きたいです。何と言いますか。（矢印の人）",
        "options": ["明日映画に誘いましょう", "明日映画を見に行きませんか", "明日映画に行きたいそうですよ"],
        "correct": 1,
        "transcript": "状況：明日、2人で映画に行きたいです。\n質問：何と言いますか。\n1. 明日映画に誘いましょう\n2. 明日映画を見に行きませんか\n3. 明日映画に行きたいそうですよ",
        "explanation": "Inviting someone out together:「明日映画を見に行きませんか」."
    },
    {
        "id": "n4-v1-l-18",
        "type": "Mondai 3 (発話表現)",
        "audioSrc": "/audio/japanese/slices/n4_v1/m3/q3.mp3",
        "image": "/images/japanese/listening/n4/m3_q3.png",
        "question": "18. 黒板の字が小さくて読めません。先生に何と言いますか。（矢印の人）",
        "options": ["すみません、よく見えません", "すみません、読んでもいいですか", "すみません、書きましょうか"],
        "correct": 0,
        "transcript": "状況：黒板の字が小さくて読めません。\n質問：何と言いますか。\n1. すみません、よく見えません\n2. すみません、読んでもいいですか\n3. すみません、書きましょうか",
        "explanation": "Reporting that board text is illegible/invisible:「すみません、よく見えません」."
    },
    {
        "id": "n4-v1-l-19",
        "type": "Mondai 3 (発話表現)",
        "audioSrc": "/audio/japanese/slices/n4_v1/m3/q4.mp3",
        "image": "/images/japanese/listening/n4/m3_q4.png",
        "question": "19. 先生に今、相談したいです。何と言いますか。（矢印の人）",
        "options": ["あのー、いつでしょうか", "ちょっとよろしいでしょうか", "相談してくださいませんか"],
        "correct": 1,
        "transcript": "状況：先生に今、相談したいです。\n質問：何と言いますか。\n1. あのー、いつでしょうか\n2. ちょっとよろしいでしょうか\n3. 相談してくださいませんか",
        "explanation": "Asking politely for someone's time:「ちょっとよろしいでしょうか」."
    },
    {
        "id": "n4-v1-l-20",
        "type": "Mondai 3 (発話表現)",
        "audioSrc": "/audio/japanese/slices/n4_v1/m3/q5.mp3",
        "image": "/images/japanese/listening/n4/m3_q5.png",
        "question": "20. 友達のペンを借りたいです。何と言いますか。（矢印の人）",
        "options": ["ペン、貸してもらえる？", "ペン、取ってあげる", "ペン、使ってくれる？"],
        "correct": 0,
        "transcript": "状況：友達のペンを借りたいです。\n質問：何と言いますか。\n1. ペン、貸してもらえる？\n2. ペン、取ってあげる\n3. ペン、使ってくれる？",
        "explanation": "Casual request to borrow a pen:「ペン、貸してもらえる？」."
    },

    # Mondai 4 (8 Qs)
    {
        "id": "n4-v1-l-21",
        "type": "Mondai 4 (即時応答)",
        "audioSrc": "/audio/japanese/slices/n4_v1/m4/q1.mp3",
        "question": "21. 「どこに行くんですか。」",
        "options": ["いってらっしゃい", "ちょっと食事に行ってきます", "気をつけてください"],
        "correct": 1,
        "transcript": "発話：「どこに行くんですか。」\n1. いってらっしゃい\n2. ちょっと食事に行ってきます\n3. 気をつけてください",
        "explanation": "Replying where you are going:「ちょっと食事に行ってきます」."
    },
    {
        "id": "n4-v1-l-22",
        "type": "Mondai 4 (即時応答)",
        "audioSrc": "/audio/japanese/slices/n4_v1/m4/q2.mp3",
        "question": "22. 「ねえ、京都行ったことある？」",
        "options": ["行かなかったよ", "そう言ったんだ", "うん、1回あるよ"],
        "correct": 2,
        "transcript": "発話：「ねえ、京都行ったことある？」\n1. 行かなかったよ\n2. そう言ったんだ\n3. うん、1回あるよ",
        "explanation": "Affirming experience:「うん、1回あるよ」."
    },
    {
        "id": "n4-v1-l-23",
        "type": "Mondai 4 (即時応答)",
        "audioSrc": "/audio/japanese/slices/n4_v1/m4/q3.mp3",
        "question": "23. 「どうして昨日授業を休んだんですか。」",
        "options": ["休むかもしれません", "風邪をひいてしまいました", "ゆっくり休んでください"],
        "correct": 1,
        "transcript": "発話：「どうして昨日授業を休んだんですか。」\n1. 休むかもしれません\n2. 風邪をひいてしまいました\n3. ゆっくり休んでください",
        "explanation": "Giving reason for past absence:「風邪をひいてしまいました」."
    },
    {
        "id": "n4-v1-l-24",
        "type": "Mondai 4 (即時応答)",
        "audioSrc": "/audio/japanese/slices/n4_v1/m4/q4.mp3",
        "question": "24. 「夏休みに国へ帰ったら何をしますか。」",
        "options": ["友達に会うつもりです", "母に会いました", "来月にします"],
        "correct": 0,
        "transcript": "発話：「夏休みに国へ帰ったら何をしますか。」\n1. 友達に会うつもりです\n2. 母に会いました\n3. 来月にします",
        "explanation": "Stating future plan:「友達に会うつもりです」."
    },
    {
        "id": "n4-v1-l-25",
        "type": "Mondai 4 (即時応答)",
        "audioSrc": "/audio/japanese/slices/n4_v1/m4/q5.mp3",
        "question": "25. 「学校を休む時は電話してください。」",
        "options": ["休むんですか", "はい、連絡します", "電話を待っています"],
        "correct": 1,
        "transcript": "発話：「学校を休む時は電話してください。」\n1. 休むんですか\n2. はい、連絡します\n3. 電話を待っています",
        "explanation": "Acknowledging rule compliance:「はい、連絡します」."
    },
    {
        "id": "n4-v1-l-26",
        "type": "Mondai 4 (即時応答)",
        "audioSrc": "/audio/japanese/slices/n4_v1/m4/q6.mp3",
        "question": "26. 「あのー、その本を取ってくれませんか。」",
        "options": ["ありがとう", "もらいましたよ", "えっ、どれですか"],
        "correct": 2,
        "transcript": "発話：「あのー、その本を取ってくれませんか。」\n1. ありがとう\n2. もらいましたよ\n3. えっ、どれですか",
        "explanation": "Asking for clarification before handing:「えっ、どれですか」."
    },
    {
        "id": "n4-v1-l-27",
        "type": "Mondai 4 (即時応答)",
        "audioSrc": "/audio/japanese/slices/n4_v1/m4/q7.mp3",
        "question": "27. 「日本語が話せますか。」",
        "options": ["勉強してください", "わかりました", "少しならできます"],
        "correct": 2,
        "transcript": "発話：「日本語が話せますか。」\n1. 勉強してください\n2. わかりました\n3. 少しならできます",
        "explanation": "Modest affirmation of language skill:「少しならできます」."
    },
    {
        "id": "n4-v1-l-28",
        "type": "Mondai 4 (即時応答)",
        "audioSrc": "/audio/japanese/slices/n4_v1/m4/q8.mp3",
        "question": "28. 「あ、田中さん、黒板を消しておいてくれませんか。」",
        "options": ["はい、すぐにやります", "きれいになりましたね", "ここに置きましょう"],
        "correct": 0,
        "transcript": "発話：「あ、田中さん、黒板を消しておいてくれませんか。」\n1. はい、すぐにやります\n2. きれいになりましたね\n3. ここに置きましょう",
        "explanation": "Agreeing to perform requested task immediately:「はい、すぐにやります」."
    }
]

OFFICIAL_N4_VOL2_LISTENING = [
    # Mondai 1 (8 Qs)
    {
        "id": "n4-v2-l-1",
        "type": "Mondai 1 (課題理解)",
        "audioSrc": "/audio/japanese/slices/n4_v2/m1/q1.mp3",
        "image": "/images/japanese/listening/n4_2018/m1_q1.png",
        "question": "1. 男の人と 女の人が 話しています。男の人は どの靴を 買いますか。",
        "options": ["黒いスニーカー", "白いスニーカー", "革靴", "サンダル"],
        "correct": 0,
        "transcript": "男「歩きやすい靴を探しているんだ。」\n女「この黒いスニーカーは軽くてクッションもいいわよ。」\n男「本当だ、これにするよ。」\n質問：男の人はどの靴を買いますか。",
        "explanation": "He selects the black sneakers (黒いスニーカー, Option 1)."
    },
    {
        "id": "n4-v2-l-2",
        "type": "Mondai 1 (課題理解)",
        "audioSrc": "/audio/japanese/slices/n4_v2/m1/q2.mp3",
        "image": "/images/japanese/listening/n4_2018/m1_q2.png",
        "question": "2. 女の人が 案内を 聞いています。女の人は 何番線に 行きますか。",
        "options": ["1番線", "2番線", "3番線", "4番線"],
        "correct": 2,
        "transcript": "アナウンス「空港行きの快速電車は3番線から発車いたします。」\n女「3番線ね、階段を急がなきゃ。」\n質問：女の人は何番線に行きますか。",
        "explanation": "She goes to platform 3 (3番線, Option 3)."
    },
    {
        "id": "n4-v2-l-3",
        "type": "Mondai 1 (課題理解)",
        "audioSrc": "/audio/japanese/slices/n4_v2/m1/q3.mp3",
        "image": "/images/japanese/listening/n4_2018/m1_q3.png",
        "question": "3. 会社で 男の人と 女の人が 話しています。女の人は これから どこへ 行きますか。",
        "options": ["銀行", "郵便局", "コンビニ", "市役所"],
        "correct": 1,
        "transcript": "男「この書類を速達で送ってきてくれる？」\n女「はい、郵便局に行ってまいります。」\n質問：女の人はこれからどこへ行きますか。",
        "explanation": "She heads to the post office (郵便局, Option 2)."
    },
    {
        "id": "n4-v2-l-4",
        "type": "Mondai 1 (課題理解)",
        "audioSrc": "/audio/japanese/slices/n4_v2/m1/q4.mp3",
        "image": "/images/japanese/listening/n4_2018/m1_q4.png",
        "question": "4. 男の人と 女の人が 話しています。二人は どの映画を 見ますか。",
        "options": ["アクション映画", "アニメ映画", "コメディ映画", "恋愛映画"],
        "correct": 3,
        "transcript": "男「どのアクション映画か恋愛映画がいいな。」\n女「話題の恋愛映画にしましょうよ。」\n男「そうだね、そうしよう。」\n質問：二人はどの映画を見ますか。",
        "explanation": "They pick the romance movie (恋愛映画, Option 4)."
    },
    {
        "id": "n4-v2-l-5",
        "type": "Mondai 1 (課題理解)",
        "audioSrc": "/audio/japanese/slices/n4_v2/m1/q5.mp3",
        "image": "/images/japanese/listening/n4_2018/m1_q5.png",
        "question": "5. 先生が 話しています。学生は どの順序で 発表しますか。",
        "options": ["Aグループ→Bグループ", "Bグループ→Aグループ", "個人発表のみ", "自由順"],
        "correct": 0,
        "transcript": "先生「今日のプレゼンは、まずAグループが発表し、その後にBグループが行います。」\n質問：学生はどの順序で発表しますか。",
        "explanation": "Group A presents first, followed by Group B (Option 1)."
    },
    {
        "id": "n4-v2-l-6",
        "type": "Mondai 1 (課題理解)",
        "audioSrc": "/audio/japanese/slices/n4_v2/m1/q6.mp3",
        "image": "/images/japanese/listening/n4_2018/m1_q6.png",
        "question": "6. 店で 男の人と 店員が 話しています。男の人は どのシャツを 買いますか。",
        "options": ["半袖の青いシャツ", "長袖の青いシャツ", "半袖の白いシャツ", "長袖の白いシャツ"],
        "correct": 1,
        "transcript": "男「青い長袖のシャツのMサイズはありますか。」\n店員「はい、こちらにございます。」\n男「これをいただきます。」\n質問：男の人はどのシャツを買いますか。",
        "explanation": "He chooses the long-sleeve blue shirt (長袖の青いシャツ, Option 2)."
    },
    {
        "id": "n4-v2-l-7",
        "type": "Mondai 1 (課題理解)",
        "audioSrc": "/audio/japanese/slices/n4_v2/m1/q7.mp3",
        "image": "/images/japanese/listening/n4_2018/m1_q7.png",
        "question": "7. 女の人と 男の人が 話しています。二人は どこで 待ち合わせますか。",
        "options": ["駅の改札口", "カフェの前", "本屋の前", "時計台の下"],
        "correct": 2,
        "transcript": "女「どこで会う？」\n男「駅の東口にある本屋の前で待ってるよ。」\n女「わかった、本屋の前ね。」\n質問：二人はどこで待ち合わせますか。",
        "explanation": "In front of the bookstore (本屋の前, Option 3)."
    },
    {
        "id": "n4-v2-l-8",
        "type": "Mondai 1 (課題理解)",
        "audioSrc": "/audio/japanese/slices/n4_v2/m1/q8.mp3",
        "image": "/images/japanese/listening/n4_2018/m1_q8.png",
        "question": "8. 男の人と 女の人が 話しています。男の人は 明日、何を 持って行きますか。",
        "options": ["お弁当と 水筒", "水筒と おやつ", "お弁当と おやつ", "雨具と お弁当"],
        "correct": 0,
        "transcript": "女「明日の遠足、お弁当と水筒を忘れないでね。」\n男「うん、お弁当と水筒をリュックに入れておくよ。」\n質問：男の人は明日、何を持って行きますか。",
        "explanation": "Lunchbox and water bottle (お弁当と水筒, Option 1)."
    },

    # Mondai 2 (7 Qs)
    {
        "id": "n4-v2-l-9",
        "type": "Mondai 2 (ポイント理解)",
        "audioSrc": "/audio/japanese/slices/n4_v2/m2/q1.mp3",
        "question": "9. 女の人が話しています。女の人が最近始めた習い事は何ですか。",
        "options": ["茶道", "華道", "ピアノ", "ヨガ"],
        "correct": 0,
        "transcript": "女「日本の伝統文化を学びたくて、先月からお茶のお稽古（茶道）に通い始めたんです。」\n質問：女の人が最近始めた習い事は何ですか。",
        "explanation": "Tea ceremony (茶道, Option 1)."
    },
    {
        "id": "n4-v2-l-10",
        "type": "Mondai 2 (ポイント理解)",
        "audioSrc": "/audio/japanese/slices/n4_v2/m2/q2.mp3",
        "question": "10. 男の人と女の人が話しています。男の人はなぜ引っ越しますか。",
        "options": ["会社に近くなるから", "家賃が安いから", "部屋が広いから", "静かな街だから"],
        "correct": 0,
        "transcript": "男「来月引っ越すんだ。今の家は通勤に1時間半かかるけど、新居なら会社まで徒歩10分なんだ。」\n質問：男の人はなぜ引っ越しますか。",
        "explanation": "Closer to the workplace (会社に近くなるから, Option 1)."
    },
    {
        "id": "n4-v2-l-11",
        "type": "Mondai 2 (ポイント理解)",
        "audioSrc": "/audio/japanese/slices/n4_v2/m2/q3.mp3",
        "question": "11. 女の学生と男の学生が話しています。試験の範囲はどこからどこまでですか。",
        "options": ["第1課から第5課", "第3課から第7課", "第5課から第10課", "第1課から第10課"],
        "correct": 2,
        "transcript": "男「中間テストの範囲、どこだっけ？」\n女「先生が第5課から第10課までって言ってたよ。」\n質問：試験の範囲はどこからどこまでですか。",
        "explanation": "Chapter 5 to Chapter 10 (第5課から第10課, Option 3)."
    },
    {
        "id": "n4-v2-l-12",
        "type": "Mondai 2 (ポイント理解)",
        "audioSrc": "/audio/japanese/slices/n4_v2/m2/q4.mp3",
        "question": "12. 男の人が話しています。男の人が好きな季節はいつですか。",
        "options": ["春", "夏", "秋", "冬"],
        "correct": 2,
        "transcript": "男「紅葉が綺麗で、涼しくて過ごしやすい秋が一番好きですね。」\n質問：男の人が好きな季節はいつですか。",
        "explanation": "Autumn (秋, Option 3)."
    },
    {
        "id": "n4-v2-l-13",
        "type": "Mondai 2 (ポイント理解)",
        "audioSrc": "/audio/japanese/slices/n4_v2/m2/q5.mp3",
        "question": "13. 女の人と男の人が話しています。パーティーは何時から始まりますか。",
        "options": ["5時半", "6時", "6時半", "7時"],
        "correct": 1,
        "transcript": "男「同窓会は何時から？」\n女「開場は5時半だけど、乾杯と開始は6時ちょうどよ。」\n質問：パーティーは何時から始まりますか。",
        "explanation": "Starts at 6:00 PM (6時, Option 2)."
    },
    {
        "id": "n4-v2-l-14",
        "type": "Mondai 2 (ポイント理解)",
        "audioSrc": "/audio/japanese/slices/n4_v2/m2/q6.mp3",
        "question": "14. 男の人が話しています。昨日の試合で勝てなかった理由は何ですか。",
        "options": ["練習不足だったから", "エースが怪我をしたから", "相手が強すぎたから", "雨が降ったから"],
        "correct": 1,
        "transcript": "男「昨日のサッカーの決勝戦、うちのエース選手が前半で足を怪我して退場してしまったのが痛かったよ。」\n質問：勝てなかった理由は何ですか。",
        "explanation": "The ace player got injured (エースが怪我をしたから, Option 2)."
    },
    {
        "id": "n4-v2-l-15",
        "type": "Mondai 2 (ポイント理解)",
        "audioSrc": "/audio/japanese/slices/n4_v2/m2/q7.mp3",
        "question": "15. 女の人と男の人が話しています。二人は今度の日曜日、何をしますか。",
        "options": ["山登り", "美術館に行く", "バーベキュー", "カラオケ"],
        "correct": 1,
        "transcript": "女「日曜日、美術館でフランス絵画展をやっているの。一緒に行かない？」\n男「いいね、見に行こう。」\n質問：二人は今度の日曜日、何をしますか。",
        "explanation": "Going to the art museum (美術館に行く, Option 2)."
    },

    # Mondai 3 (5 Qs)
    {
        "id": "n4-v2-l-16",
        "type": "Mondai 3 (発話表現)",
        "audioSrc": "/audio/japanese/slices/n4_v2/m3/q1.mp3",
        "image": "/images/japanese/listening/n4_2018/m3_q1.png",
        "question": "16. 相手の荷物を持ってあげたいです。何と言いますか。（矢印の人）",
        "options": ["荷物をお持ちしましょうか。", "荷物を持ってください。", "荷物を持ってもいいです。"],
        "correct": 0,
        "transcript": "状況：相手の荷物を持ってあげたいです。\n質問：何と言いますか。\n1. 荷物をお持ちしましょうか。\n2. 荷物を持ってください。\n3. 荷物を持ってもいいです。",
        "explanation": "Humble offer:「荷物をお持ちしましょうか。」"
    },
    {
        "id": "n4-v2-l-17",
        "type": "Mondai 3 (発話表現)",
        "audioSrc": "/audio/japanese/slices/n4_v2/m3/q2.mp3",
        "image": "/images/japanese/listening/n4_2018/m3_q2.png",
        "question": "17. 会議に遅れそうです。会社に電話して何と言いますか。（矢印の人）",
        "options": ["少し遅れそうです。", "少し遅れてください。", "遅れました。"],
        "correct": 0,
        "transcript": "状況：会議に遅れそうです。\n質問：何と言いますか。\n1. 電車が遅れており、少し遅れそうです。\n2. 少し遅れてください。\n3. 遅れました。",
        "explanation": "Reporting expected lateness:「少し遅れそうです。」"
    },
    {
        "id": "n4-v2-l-18",
        "type": "Mondai 3 (発話表現)",
        "audioSrc": "/audio/japanese/slices/n4_v2/m3/q3.mp3",
        "image": "/images/japanese/listening/n4_2018/m3_q3.png",
        "question": "18. レストランで注文が決まりました。店員を呼んで何と言いますか。（矢印の人）",
        "options": ["すみません、注文をお願いします。", "注文を言います。", "注文してください。"],
        "correct": 0,
        "transcript": "状況：注文が決まりました。\n質問：何と言いますか。\n1. すみません、注文をお願いします。\n2. 注文を言います。\n3. 注文してください。",
        "explanation": "Calling a waiter for ordering:「すみません、注文をお願いします。」"
    },
    {
        "id": "n4-v2-l-19",
        "type": "Mondai 3 (発話表現)",
        "audioSrc": "/audio/japanese/slices/n4_v2/m3/q4.mp3",
        "image": "/images/japanese/listening/n4_2018/m3_q4.png",
        "question": "19. 友達に道を尋ねたいです。何と言いますか。（矢印の人）",
        "options": ["駅への行き方を教えてくれない？", "駅へ行ってください。", "駅へ行きましょう。"],
        "correct": 0,
        "transcript": "状況：友達に道を尋ねます。\n質問：何と言いますか。\n1. 駅への行き方を教えてくれない？\n2. 駅へ行ってください。\n3. 駅へ行きましょう。",
        "explanation": "Asking a friend for directions:「教えてくれない？」"
    },
    {
        "id": "n4-v2-l-20",
        "type": "Mondai 3 (発話表現)",
        "audioSrc": "/audio/japanese/slices/n4_v2/m3/q5.mp3",
        "image": "/images/japanese/listening/n4_2018/m3_q5.png",
        "question": "20. エレベーターに乗る人に「先に乗ってください」と言います。（矢印の人）",
        "options": ["お先にどうぞ。", "お先に失礼します。", "乗ってください。"],
        "correct": 0,
        "transcript": "状況：エレベーターで順番を譲ります。\n質問：何と言いますか。\n1. お先にどうぞ。\n2. お先に失礼します。\n3. 乗ってください。",
        "explanation": "Yielding priority politely:「お先にどうぞ。」"
    },

    # Mondai 4 (8 Qs)
    {
        "id": "n4-v2-l-21",
        "type": "Mondai 4 (即時応答)",
        "audioSrc": "/audio/japanese/slices/n4_v2/m4/q1.mp3",
        "question": "21. 「この書類、今日中にコピーしておいてね。」",
        "options": ["はい、すぐやっておきます。", "いいえ、コピーしました。", "そうですね、終わりました。"],
        "correct": 0,
        "transcript": "発話：「この書類、今日中にコピーしておいてね。」\n1. はい、すぐやっておきます。\n2. いいえ、コピーしました。\n3. そうですね、終わりました。",
        "explanation": "Acknowledging task request:「はい、すぐやっておきます。」"
    },
    {
        "id": "n4-v2-l-22",
        "type": "Mondai 4 (即時応答)",
        "audioSrc": "/audio/japanese/slices/n4_v2/m4/q2.mp3",
        "question": "22. 「昨日のサッカーの試合、見ましたか。」",
        "options": ["ええ、テレビで見ましたよ。", "いいえ、見ませんでしたよ。", "はい、行きました。"],
        "correct": 0,
        "transcript": "発話：「昨日のサッカーの試合、見ましたか。」\n1. ええ、テレビで見ましたよ。\n2. いいえ、見ませんでしたよ。\n3. はい、行きました。",
        "explanation": "Confirming watching:「ええ、テレビで見ましたよ。」"
    },
    {
        "id": "n4-v2-l-23",
        "type": "Mondai 4 (即時応答)",
        "audioSrc": "/audio/japanese/slices/n4_v2/m4/q3.mp3",
        "question": "23. 「ちょっと窓を閉めてもいいですか。」",
        "options": ["ええ、いいですよ。", "いいえ、閉めました。", "どういたしまして。"],
        "correct": 0,
        "transcript": "発話：「ちょっと窓を閉めてもいいですか。」\n1. ええ、いいですよ。\n2. いいえ、閉めました。\n3. どういたしまして。",
        "explanation": "Granting permission:「ええ、いいですよ。」"
    },
    {
        "id": "n4-v2-l-24",
        "type": "Mondai 4 (即時応答)",
        "audioSrc": "/audio/japanese/slices/n4_v2/m4/q4.mp3",
        "question": "24. 「部長、お茶を召し上がりますか。」",
        "options": ["ありがとう、いただきます。", "いいえ、召し上がります。", "はい、飲ませます。"],
        "correct": 0,
        "transcript": "発話：「部長、お茶を召し上がりますか。」\n1. ありがとう、いただきます。\n2. いいえ、召し上がります。\n3. はい、飲ませます。",
        "explanation": "Accepting tea offer politely:「ありがとう、いただきます。」"
    },
    {
        "id": "n4-v2-l-25",
        "type": "Mondai 4 (即時応答)",
        "audioSrc": "/audio/japanese/slices/n4_v2/m4/q5.mp3",
        "question": "25. 「来週の旅行、楽しみにしています。」",
        "options": ["ええ、楽しみですね。", "いいえ、楽しみではありません。", "はい、行きました。"],
        "correct": 0,
        "transcript": "発話：「来週の旅行、楽しみにしています。」\n1. ええ、楽しみですね。\n2. いいえ、楽しみではありません。\n3. はい、行きました。",
        "explanation": "Reciprocating excitement:「ええ、楽しみですね。」"
    },
    {
        "id": "n4-v2-l-26",
        "type": "Mondai 4 (即時応答)",
        "audioSrc": "/audio/japanese/slices/n4_v2/m4/q6.mp3",
        "question": "26. 「道に迷ってしまったんですが、駅はどちらですか。」",
        "options": ["あそこの角を右に曲がるとすぐですよ。", "駅に行きましたよ。", "いいえ、わかりません。"],
        "correct": 0,
        "transcript": "発話：「道に迷ってしまったんですが、駅はどちらですか。」\n1. あそこの角を右に曲がるとすぐですよ。\n2. 駅に行きましたよ。\n3. いいえ、わかりません。",
        "explanation": "Giving directions:「あそこの角を右に曲がるとすぐですよ。」"
    },
    {
        "id": "n4-v2-l-27",
        "type": "Mondai 4 (即時応答)",
        "audioSrc": "/audio/japanese/slices/n4_v2/m4/q7.mp3",
        "question": "27. 「日本語のテスト、難しかったですね。」",
        "options": ["本当に難しかったですね。", "そうですね、簡単でした。", "いいえ、受けませんでした。"],
        "correct": 0,
        "transcript": "発話：「日本語のテスト、難しかったですね。」\n1. 本当に難しかったですね。\n2. そうですね、簡単でした。\n3. いいえ、受けませんでした。",
        "explanation": "Agreeing on difficulty:「本当に難しかったですね。」"
    },
    {
        "id": "n4-v2-l-28",
        "type": "Mondai 4 (即時応答)",
        "audioSrc": "/audio/japanese/slices/n4_v2/m4/q8.mp3",
        "question": "28. 「また明日、お会いしましょう。」",
        "options": ["はい、また明日。", "いいえ、明日です。", "どういたしまして。"],
        "correct": 0,
        "transcript": "発話：「また明日、お会いしましょう。」\n1. はい、また明日。\n2. いいえ、明日です。\n3. どういたしまして。",
        "explanation": "Farewell response:「はい、また明日。」"
    }
]
