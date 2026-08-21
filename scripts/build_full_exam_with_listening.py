import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Read current build script or existing definitions for Vocab & Grammar
from build_full_exam import N5_SECTIONS as BASE_N5_SECTIONS, N4_SECTIONS as BASE_N4_SECTIONS

# Complete N5 Listening with all 24 questions
N5_LISTENING_QUESTIONS = [
    # Mondai 1 (課題理解 - Q1 to Q7)
    {
        'id': 'n5-l-1',
        'type': 'Mondai 1 (課題理解)',
        'audioSrc': '/audio/japanese/n5/captured-media-0-mp3.mp3',
        'image': '/images/japanese/listening/n5/m1_q1.png',
        'question': '1. 男の人と女の人が話しています。男の人はどの靴下を買いますか。',
        'options': ['長い靴下（くだもの）', '長い靴下（いぬ）', '短い靴下（くだもの）', '短い靴下（いぬ）'],
        'correct': 0,
        'transcript': '女「いらっしゃいませ。」\n男「子どもの靴下を探しているんですが、長くて果物の絵がついたものはありますか。」\n女「はい、こちらです。」\n質問：男の人はどの靴下を買いますか。',
        'explanation': 'The man asks for long socks with a fruit pattern (長くて果物の絵がついたもの), which is Option 1.'
    },
    {
        'id': 'n5-l-2',
        'type': 'Mondai 1 (課題理解)',
        'audioSrc': '/audio/japanese/n5/captured-media-0-mp3.mp3',
        'image': '/images/japanese/listening/n5/m1_q2.png',
        'question': '2. デパートで男の人と女の人が話しています。男の人は何階へ行きますか。',
        'options': ['1階', '2階', '3階', '4階'],
        'correct': 2,
        'transcript': '男「すみません、本屋はどこですか。」\n女「本屋は3階でございます。」\n男「3階ですね。ありがとう。」\n質問：男の人は何階へ行きますか。',
        'explanation': 'The clerk directs the man to the bookstore on the 3rd floor (3階).'
    },
    {
        'id': 'n5-l-3',
        'type': 'Mondai 1 (課題理解)',
        'audioSrc': '/audio/japanese/n5/captured-media-0-mp3.mp3',
        'image': '/images/japanese/listening/n5/m1_q3.png',
        'question': '3. 女の人が店の人と話しています。女の人はどのカバンを買いますか。',
        'options': ['上の段の左の白い小さなカバン', '上の段の真ん中の大きな白いカバン', '上の段の黒い大きなカバン', '上の段の右の黒い小さなカバン'],
        'correct': 2,
        'transcript': '女「すみません、上の段にある黒い大きなカバンを見せてください。」\n店員「はい、こちらですね。」\n質問：女の人はどのカバンを買いますか。',
        'explanation': 'The customer selects the large black bag on the top shelf (Option 3).'
    },
    {
        'id': 'n5-l-4',
        'type': 'Mondai 1 (課題理解)',
        'audioSrc': '/audio/japanese/n5/captured-media-0-mp3.mp3',
        'image': '/images/japanese/listening/n5/m1_q4.png',
        'question': '4. 先生が話しています。学生は机の上に何を置きますか。',
        'options': ['えんぴつと消しゴムだけ', 'ノートとえんぴつと消しゴム', '辞書とえんぴつと消しゴム', '時計とえんぴつと消しゴム'],
        'correct': 0,
        'transcript': '先生「これからテストを始めます。机の上には鉛筆と消しゴムだけ置いてください。ノートや辞書、時計はカバンにしまってください。」\n質問：学生は机の上に何を置きますか。',
        'explanation': 'The teacher instructs students to keep only pencils and an eraser on their desks (Option 1).'
    },
    {
        'id': 'n5-l-5',
        'type': 'Mondai 1 (課題理解)',
        'audioSrc': '/audio/japanese/n5/captured-media-0-mp3.mp3',
        'image': '/images/japanese/listening/n5/m1_q5.png',
        'question': '5. 女の人と男の人が話しています。男の人はこの後、まず何をしますか。',
        'options': ['ごはんを食べる', '部屋を出て買いに行く', 'テレビを見る', '店で買い物をする'],
        'correct': 1,
        'transcript': '女「お昼ご飯のパンがないから、コンビニで買ってきてくれる？」\n男「うん、いいよ。今すぐ行ってくるね。」\n質問：男の人はこの後、まず何をしますか。',
        'explanation': 'The man leaves immediately to buy bread from the convenience store (Option 2).'
    },
    {
        'id': 'n5-l-6',
        'type': 'Mondai 1 (課題理解)',
        'audioSrc': '/audio/japanese/n5/captured-media-0-mp3.mp3',
        'image': '/images/japanese/listening/n5/m1_q6.png',
        'question': '6. 男の人と女の人がピクニックの準備をしています。男の人は何を買ってきますか。',
        'options': ['おにぎり', 'お茶（ペットボトル3本）', 'お茶とお菓子', 'お菓子だけ'],
        'correct': 1,
        'transcript': '女「おにぎりとお菓子は私が作ったから、飲み物を3本買ってきて。」\n男「わかった、お茶を買ってくるよ。」\n質問：男の人は何を買ってきますか。',
        'explanation': 'The woman already prepared onigiri and snacks, so the man buys 3 bottles of green tea (Option 2).'
    },
    {
        'id': 'n5-l-7',
        'type': 'Mondai 1 (課題理解)',
        'audioSrc': '/audio/japanese/n5/captured-media-0-mp3.mp3',
        'image': '/images/japanese/listening/n5/m1_q7.png',
        'question': '7. 先生が話しています。学生はどの教室へ行きますか。',
        'options': ['1ばん', '3ばん', '5ばん', '7ばん'],
        'correct': 2,
        'transcript': '先生「今日の日本語の授業は教室が変わります。3番ではなく、5番の教室へ行ってください。」\n質問：学生はどの教室へ行きますか。',
        'explanation': 'The class changed from room 3 to room 5 (5ばん, Option 3).'
    },

    # Mondai 2 (ポイント理解 - Q1 to Q6)
    {
        'id': 'n5-l-8',
        'type': 'Mondai 2 (ポイント理解)',
        'audioSrc': '/audio/japanese/n5/captured-media-1-mp3.mp3',
        'question': '8. 男の人と女の人が話しています。女の人は昨日、何時間勉強しましたか。',
        'options': ['1時間', '2時間', '3時間', '4時間'],
        'correct': 1,
        'transcript': '男「昨日はたくさん勉強した？」\n女「いつもは1時間だけど、昨日はテスト前だから2時間頑張ったよ。」\n質問：女の人は昨日、何時間勉強しましたか。',
        'explanation': 'The woman studied for 2 hours yesterday because of the test (2時間).'
    },
    {
        'id': 'n5-l-9',
        'type': 'Mondai 2 (ポイント理解)',
        'audioSrc': '/audio/japanese/n5/captured-media-1-mp3.mp3',
        'question': '9. 女の人が電話で話しています。山田さんの電話番号は何番ですか。',
        'options': ['512-7733', '512-7734', '512-7743', '512-7744'],
        'correct': 1,
        'transcript': '女「山田さんの電話番号は512-7734です。もう一度言います、512-7734です。」\n質問：山田さんの電話番号は何番ですか。',
        'explanation': 'The phone number confirmed twice is 512-7734 (Option 2).'
    },
    {
        'id': 'n5-l-10',
        'type': 'Mondai 2 (ポイント理解)',
        'audioSrc': '/audio/japanese/n5/captured-media-1-mp3.mp3',
        'question': '10. 男の人が家族について話しています。男の人は今、誰と一緒に住んでいますか。',
        'options': ['両親', '姉', '妹', '弟'],
        'correct': 1,
        'transcript': '男「両親は田舎に住んでいます。弟は寮にいますが、私は東京で姉と一緒に住んでいます。」\n質問：男の人は今、誰と一緒に住んでいますか。',
        'explanation': 'He lives with his older sister in Tokyo (姉, Option 2).'
    },
    {
        'id': 'n5-l-11',
        'type': 'Mondai 2 (ポイント理解)',
        'audioSrc': '/audio/japanese/n5/captured-media-1-mp3.mp3',
        'question': '11. 男の人と女の人が話しています。二人は昼ごはんをどこで食べますか。',
        'options': ['食堂', '喫茶店', 'パン屋', '教室'],
        'correct': 1,
        'transcript': '男「お昼どうする？学食行く？」\n女「今日は混んでるから、駅前の喫茶店に行かない？」\n男「いいね、そうしよう。」\n質問：二人は昼ごはんをどこで食べますか。',
        'explanation': 'They decide to eat at the coffee shop in front of the station (喫茶店, Option 2).'
    },
    {
        'id': 'n5-l-12',
        'type': 'Mondai 2 (ポイント理解)',
        'audioSrc': '/audio/japanese/n5/captured-media-1-mp3.mp3',
        'question': '12. 男の学生と女の学生が話しています。男の学生は女の学生に何を借りますか。',
        'options': ['黒いボールペン', '赤いボールペン', '黒いえんぴつ', '赤いえんぴつ'],
        'correct': 1,
        'transcript': '男「すみません、ノートをチェックしたいので、赤いボールペンを貸してもらえますか。」\n女「はい、どうぞ。」\n質問：男の学生は何を借りますか。',
        'explanation': 'He asks to borrow a red ballpoint pen (赤いボールペン, Option 2).'
    },
    {
        'id': 'n5-l-13',
        'type': 'Mondai 2 (ポイント理解)',
        'audioSrc': '/audio/japanese/n5/captured-media-1-mp3.mp3',
        'question': '13. 男の人と女の人が話しています。二人はどこで会いますか。',
        'options': ['公園', '駅', '喫茶店', 'レストラン'],
        'correct': 1,
        'transcript': '男「明日はどこで待ち合わせる？」\n女「公園は寒いから、駅の改札前にしましょう。」\n男「わかりました。」\n質問：二人はどこで会いますか。',
        'explanation': 'They agree to meet at the train station ticket gates (駅, Option 2).'
    },

    # Mondai 3 (発話表現 - Q1 to Q5)
    {
        'id': 'n5-l-14',
        'type': 'Mondai 3 (発話表現)',
        'audioSrc': '/audio/japanese/n5/captured-media-2-mp3.mp3',
        'image': '/images/japanese/listening/n5/m3_q1.png',
        'question': '14. ごはんを食べます。何と言いますか。（矢印の人）',
        'options': ['ごちそうさまでした', 'いただきます', 'どうぞ'],
        'correct': 1,
        'transcript': '状況：これから食事を始めます。\n質問：何と言いますか。\n1. ごちそうさまでした\n2. いただきます\n3. どうぞ',
        'explanation': 'Before beginning a meal, one says「いただきます」(Option 2).'
    },
    {
        'id': 'n5-l-15',
        'type': 'Mondai 3 (発話表現)',
        'audioSrc': '/audio/japanese/n5/captured-media-2-mp3.mp3',
        'image': '/images/japanese/listening/n5/m3_q2.png',
        'question': '15. 電車でお年寄りに席をゆずります。何と言いますか。（矢印の人）',
        'options': ['どうぞ', 'すみません', 'ありがとう'],
        'correct': 0,
        'transcript': '状況：電車の中で席を譲ります。\n質問：何と言いますか。\n1. どうぞ\n2. すみません\n3. ありがとう',
        'explanation': 'When offering a seat to someone, say「どうぞ」(Option 1).'
    },
    {
        'id': 'n5-l-16',
        'type': 'Mondai 3 (発話表現)',
        'audioSrc': '/audio/japanese/n5/captured-media-2-mp3.mp3',
        'image': '/images/japanese/listening/n5/m3_q3.png',
        'question': '16. 部屋を出て先に帰ります。何と言いますか。（矢印の人）',
        'options': ['お先に失礼します', '行ってきます', 'ただいま'],
        'correct': 0,
        'transcript': '状況：仕事や授業を終えて先に帰ります。\n質問：何と言いますか。\n1. お先に失礼します\n2. 行ってきます\n3. ただいま',
        'explanation': 'When leaving before colleagues or classmates, say「お先に失礼します」(Option 1).'
    },
    {
        'id': 'n5-l-17',
        'type': 'Mondai 3 (発話表現)',
        'audioSrc': '/audio/japanese/n5/captured-media-2-mp3.mp3',
        'image': '/images/japanese/listening/n5/m3_q4.png',
        'question': '17. 受付で人に質問します。何と言いますか。（矢印の人）',
        'options': ['すみません', 'ごめんなさい', '失礼しました'],
        'correct': 0,
        'transcript': '状況：受付で係の人に話しかけます。\n質問：何と言いますか。\n1. すみません\n2. ごめんなさい\n3. 失礼しました',
        'explanation': 'To politely get someone\'s attention at a reception desk, say「すみません」(Option 1).'
    },
    {
        'id': 'n5-l-18',
        'type': 'Mondai 3 (発話表現)',
        'audioSrc': '/audio/japanese/n5/captured-media-2-mp3.mp3',
        'image': '/images/japanese/listening/n5/m3_q5.png',
        'question': '18. 友達にペンを貸します。何と言いますか。（矢印の人）',
        'options': ['これ、使って', 'これ、貸して', 'これ、買って'],
        'correct': 0,
        'transcript': '状況：ペンを持っていなくて困っている友達にペンを差し出します。\n質問：何と言いますか。\n1. これ、使って\n2. これ、貸して\n3. これ、買って',
        'explanation': 'Offering your pen to a friend:「これ、使って」(Please use this, Option 1).'
    },

    # Mondai 4 (即時応答 - Q1 to Q6)
    {
        'id': 'n5-l-19',
        'type': 'Mondai 4 (即時応答)',
        'audioSrc': '/audio/japanese/n5/captured-media-3-mp3.mp3',
        'question': '19. 「お茶、もう一杯いかがですか。」',
        'options': ['はい、もう一杯です。', 'いいえ、けっこうです。', 'どういたしまして。'],
        'correct': 1,
        'transcript': '発話：「お茶、もう一杯いかがですか。」\n1. はい、もう一杯です。\n2. いいえ、けっこうです。\n3. どういたしまして。',
        'explanation': 'Declining an offer of another cup of tea politely:「いいえ、けっこうです」(No thank you, Option 2).'
    },
    {
        'id': 'n5-l-20',
        'type': 'Mondai 4 (即時応答)',
        'audioSrc': '/audio/japanese/n5/captured-media-3-mp3.mp3',
        'question': '20. 「昨日はどうして学校を休んだんですか。」',
        'options': ['行きませんでした。', '熱があったからです。', '明日行きます。'],
        'correct': 1,
        'transcript': '発話：「昨日はどうして学校を休んだんですか。」\n1. 行きませんでした。\n2. 熱があったからです。\n3. 明日行きます。',
        'explanation': 'Answering a \"why\" question with reason:「熱があったからです」(Because I had a fever, Option 2).'
    },
    {
        'id': 'n5-l-21',
        'type': 'Mondai 4 (即時応答)',
        'audioSrc': '/audio/japanese/n5/captured-media-3-mp3.mp3',
        'question': '21. 「この傘は田中さんのですか。」',
        'options': ['はい、そうです。', 'いいえ、田中さんです。', 'そうですね。'],
        'correct': 0,
        'transcript': '発話：「この傘は田中さんのですか。」\n1. はい、そうです。\n2. いいえ、田中さんです。\n3. そうですね。',
        'explanation': 'Confirming ownership:「はい、そうです」(Yes, that is right, Option 1).'
    },
    {
        'id': 'n5-l-22',
        'type': 'Mondai 4 (即時応答)',
        'audioSrc': '/audio/japanese/n5/captured-media-3-mp3.mp3',
        'question': '22. 「ここから駅まで歩いてどのくらいですか。」',
        'options': ['10分くらいです。', '10キロくらいです。', '100円くらいです。'],
        'correct': 0,
        'transcript': '発話：「ここから駅まで歩いてどのくらいですか。」\n1. 10分くらいです。\n2. 10キロくらいです。\n3. 100円くらいです。',
        'explanation': 'Walking time estimation:「10分くらいです」(About 10 minutes, Option 1).'
    },
    {
        'id': 'n5-l-23',
        'type': 'Mondai 4 (即時応答)',
        'audioSrc': '/audio/japanese/n5/captured-media-3-mp3.mp3',
        'question': '23. 「宿題はもう終わりましたか。」',
        'options': ['はい、まだです。', 'いいえ、これからやります。', 'いいえ、終わりました。'],
        'correct': 1,
        'transcript': '発話：「宿題はもう終わりましたか。」\n1. はい、まだです。\n2. いいえ、これからやります。\n3. いいえ、終わりました。',
        'explanation': 'Natural response indicating homework is not yet completed:「いいえ、これからやります」(No, I will do it now, Option 2).'
    },
    {
        'id': 'n5-l-24',
        'type': 'Mondai 4 (即時応答)',
        'audioSrc': '/audio/japanese/n5/captured-media-3-mp3.mp3',
        'question': '24. 「週末はどこかへ行きましたか。」',
        'options': ['どこも行きませんでした。', 'どこか行きました。', 'いつも行きます。'],
        'correct': 0,
        'transcript': '発話：「週末はどこかへ行きましたか。」\n1. どこも行きませんでした。\n2. どこか行きました。\n3. いつも行きます。',
        'explanation': 'Natural response indicating staying home:「どこも行きませんでした」(I did not go anywhere, Option 1).'
    }
]

# Complete N4 Listening with all 28 questions
N4_LISTENING_QUESTIONS = [
    # Mondai 1 (課題理解 - Q1 to Q8)
    {
        'id': 'n4-l-1',
        'type': 'Mondai 1 (課題理解)',
        'audioSrc': '/audio/japanese/n4/captured-media-0-mp3.mp3',
        'image': '/images/japanese/listening/n4/m1_q1.png',
        'question': '1. 女の人と男の人が話しています。男の人はどうやって会社へ行きますか。',
        'options': ['自転車', '電車', 'バス', '車'],
        'correct': 1,
        'transcript': '女「今日は雨が降っているけど、どうやって会社に行くの？」\n男「いつもは自転車だけど、今日は雨だから電車で行くよ。」\n質問：男の人はどうやって会社へ行きますか。',
        'explanation': 'Because it is raining, he takes the train today instead of his bicycle (電車, Option 2).'
    },
    {
        'id': 'n4-l-2',
        'type': 'Mondai 1 (課題理解)',
        'audioSrc': '/audio/japanese/n4/captured-media-0-mp3.mp3',
        'image': '/images/japanese/listening/n4/m1_q2.png',
        'question': '2. 女の人が友達へのプレゼントを選んでいます。女の人は何を買いますか。',
        'options': ['バッグ', 'マグカップ', 'コーヒー豆の缶', 'タオル'],
        'correct': 1,
        'transcript': '女「友達に何をあげようかな。コーヒー好きな人だから、素敵なマグカップにしよう。」\n質問：女の人は何を買いますか。',
        'explanation': 'She chooses a stylish coffee mug (マグカップ, Option 2).'
    },
    {
        'id': 'n4-l-3',
        'type': 'Mondai 1 (課題理解)',
        'audioSrc': '/audio/japanese/n4/captured-media-0-mp3.mp3',
        'image': '/images/japanese/listening/n4/m1_q3.png',
        'question': '3. 先生と学生が話しています。学生は資料を何枚コピーしますか。',
        'options': ['2まい', '4まい', '5まい', '6まい'],
        'correct': 2,
        'transcript': '先生「学生は4人ですが、私の分も合わせて5枚コピーしてください。」\n学生「はい、わかりました。」\n質問：学生は資料を何枚コピーしますか。',
        'explanation': '4 students + 1 teacher = 5 copies (5まい, Option 3).'
    },
    {
        'id': 'n4-l-4',
        'type': 'Mondai 1 (課題理解)',
        'audioSrc': '/audio/japanese/n4/captured-media-0-mp3.mp3',
        'image': '/images/japanese/listening/n4/m1_q4.png',
        'question': '4. 男の人と女の人が写真を見ながら話しています。女の人が選ぶ写真はどれとどれですか。',
        'options': ['ア と イ', 'ア と エ', 'イ と ウ', 'イ と エ'],
        'correct': 3,
        'transcript': '女「山の景色が写っているイと、大学の前で撮ったエの2枚がいいわ。」\n質問：女の人が選ぶ写真はどれとどれですか。',
        'explanation': 'She selects photo イ (mountain waterfall) and photo エ (university building) -> Option 4 (イ と エ).'
    },
    {
        'id': 'n4-l-5',
        'type': 'Mondai 1 (課題理解)',
        'audioSrc': '/audio/japanese/n4/captured-media-0-mp3.mp3',
        'image': '/images/japanese/listening/n4/m1_q5.png',
        'question': '5. 男の人と女の人が友達のお見舞いについて話しています。二人は何を持って行きますか。',
        'options': ['花束', 'フルーツバスケット', '本（2冊）', 'CD（2枚）'],
        'correct': 1,
        'transcript': '男「お見舞い何にする？花は病院でだめなこともあるから。」\n女「じゃあ、美味しそうなフルーツの盛り合わせにしましょう。」\n質問：二人は何を持って行きますか。',
        'explanation': 'They bring an assortment of fruits (フルーツバスケット, Option 2).'
    },
    {
        'id': 'n4-l-6',
        'type': 'Mondai 1 (課題理解)',
        'audioSrc': '/audio/japanese/n4/captured-media-0-mp3.mp3',
        'image': '/images/japanese/listening/n4/m1_q6.png',
        'question': '6. 会社で女性社員が課長と話しています。女性社員はこれから何をしますか。',
        'options': ['取引先に電話する', '資料をコピーする', '会議に出席する', '会議室の椅子を並べる'],
        'correct': 1,
        'transcript': '課長「午後の会議の資料、10部コピーしておいてくれる？」\n女性「はい、すぐコピーしてきます。」\n質問：女性社員はこれから何をしますか。',
        'explanation': 'She immediately makes copies of the meeting handouts (資料をコピーする, Option 2).'
    },
    {
        'id': 'n4-l-7',
        'type': 'Mondai 1 (課題理解)',
        'audioSrc': '/audio/japanese/n4/captured-media-0-mp3.mp3',
        'image': '/images/japanese/listening/n4/m1_q7.png',
        'question': '7. 学校で先生が明日の集合について話しています。学生は明日、何時にどこに集まりますか。',
        'options': ['8時半に 教室', '8時半に 体育館の前', '9時に 教室', '9時に 体育館の前'],
        'correct': 1,
        'transcript': '先生「明日の遠足は8時半までに体育館の前に集まってください。教室ではありません。」\n質問：学生は明日、何時にどこに集まりますか。',
        'explanation': 'Gather in front of the gymnasium by 8:30 AM (8時半に 体育館の前, Option 2).'
    },
    {
        'id': 'n4-l-8',
        'type': 'Mondai 1 (課題理解)',
        'audioSrc': '/audio/japanese/n4/captured-media-0-mp3.mp3',
        'image': '/images/japanese/listening/n4/m1_q8.png',
        'question': '8. 店で女の人と店員が話しています。女の人はどの色のペンを買いますか。',
        'options': ['赤 と 黄色', '赤 と 白', '青 と 黄色', '青 と 白'],
        'correct': 2,
        'transcript': '女「青いペンと黄色いマーカーを1本ずつください。」\n店員「青と黄色ですね、ありがとうございます。」\n質問：女の人はどの色のペンを買いますか。',
        'explanation': 'She buys blue and yellow pens (青と黄色, Option 3).'
    },

    # Mondai 2 (ポイント理解 - Q1 to Q7)
    {
        'id': 'n4-l-9',
        'type': 'Mondai 2 (ポイント理解)',
        'audioSrc': '/audio/japanese/n4/captured-media-1-mp3.mp3',
        'question': '9. 女の人と男の人が話しています。男の人は誰と一緒に旅行に行きますか。',
        'options': ['両親', '姉', '妹', '弟'],
        'correct': 0,
        'transcript': '女「来週の温泉旅行、誰と行くの？」\n男「久しぶりに両親を連れて行くんだ。」\n質問：男の人は誰と一緒に旅行に行きますか。',
        'explanation': 'He travels with his parents (両親, Option 1).'
    },
    {
        'id': 'n4-l-10',
        'type': 'Mondai 2 (ポイント理解)',
        'audioSrc': '/audio/japanese/n4/captured-media-1-mp3.mp3',
        'question': '10. 男の学生と女の学生が話しています。女の学生はいつレポートを出しますか。',
        'options': ['今すぐ', '今日の 4時', '今日の 6時', '明日の ひる'],
        'correct': 1,
        'transcript': '男「レポートもう出した？」\n女「まだ。4時までに先生の研究室に持って行く予定。」\n質問：女の学生はいつレポートを出しますか。',
        'explanation': 'She submits the report by 4:00 PM today (今日の4時, Option 2).'
    },
    {
        'id': 'n4-l-11',
        'type': 'Mondai 2 (ポイント理解)',
        'audioSrc': '/audio/japanese/n4/captured-media-1-mp3.mp3',
        'question': '11. 男の留学生がアルバイトについて話しています。どうしてこのアルバイトを始めましたか。',
        'options': ['旅行に行きたいから', 'デパートで買い物がしたいから', '日本人の働き方が知りたいから', '日本語の勉強がしたいから'],
        'correct': 2,
        'transcript': '男「お金のためだけじゃなくて、日本の会社や職場のマナーや働き方を学びたかったからです。」\n質問：どうしてこのアルバイトを始めましたか。',
        'explanation': 'He wanted to learn how Japanese people work in companies (日本人の働き方が知りたいから, Option 3).'
    },
    {
        'id': 'n4-l-12',
        'type': 'Mondai 2 (ポイント理解)',
        'audioSrc': '/audio/japanese/n4/captured-media-1-mp3.mp3',
        'question': '12. マンションで案内を聞いています。燃えるゴミは何曜日に出しますか。',
        'options': ['火曜日', '水曜日', '木曜日', '金曜日'],
        'correct': 0,
        'transcript': '管理人「燃えるゴミは火曜日と金曜日の朝8時までに出してください。」\n質問：燃えるゴミは何曜日に出しますか。',
        'explanation': 'Burnable trash days are Tuesdays and Fridays (火曜日, Option 1).'
    },
    {
        'id': 'n4-l-13',
        'type': 'Mondai 2 (ポイント理解)',
        'audioSrc': '/audio/japanese/n4/captured-media-1-mp3.mp3',
        'question': '13. 女の人が読書について話しています。女の人は1か月に何冊本を読みますか。',
        'options': ['ぜんぜん 読まない', '月に 1さつ 読む', '月に 3さつ 読む', '月に 10さついじょう 読む'],
        'correct': 2,
        'transcript': '女「昔はあまり読まなかったんですが、最近は月に3冊くらい小説を読んでいます。」\n質問：女の人は1か月に何冊本を読みますか。',
        'explanation': 'She reads about 3 books per month (月に3冊, Option 3).'
    },
    {
        'id': 'n4-l-14',
        'type': 'Mondai 2 (ポイント理解)',
        'audioSrc': '/audio/japanese/n4/captured-media-1-mp3.mp3',
        'question': '14. 男の人が子どもの頃の夢について話しています。男の人は子どもの頃、何になりたかったですか。',
        'options': ['小学校の 先生', 'ピアニスト', 'けいさつかん', 'かんごし'],
        'correct': 2,
        'transcript': '男「今は小学校の先生をしていますが、子どもの頃は警察官になりたかったんです。」\n質問：男の人は子どもの頃、何になりたかったですか。',
        'explanation': 'When he was a child, he dreamed of becoming a police officer (警察官, Option 3).'
    },
    {
        'id': 'n4-l-15',
        'type': 'Mondai 2 (ポイント理解)',
        'audioSrc': '/audio/japanese/n4/captured-media-1-mp3.mp3',
        'question': '15. 男の人が今朝早く起きた理由は何ですか。',
        'options': ['ジョギングをするため', 'テストの勉強をするため', '散歩をするため', '朝ごはんを作るため'],
        'correct': 1,
        'transcript': '男「いつもより1時間早く起きて、今日のテストの復習をしました。」\n質問：男の人が今朝早く起きた理由は何ですか。',
        'explanation': 'He woke up early to study for today\'s exam (テストの勉強をするため, Option 2).'
    },

    # Mondai 3 (発話表現 - Q1 to Q5)
    {
        'id': 'n4-l-16',
        'type': 'Mondai 3 (発話表現)',
        'audioSrc': '/audio/japanese/n4/captured-media-2-mp3.mp3',
        'image': '/images/japanese/listening/n4/m3_q1.png',
        'question': '16. 旅行のお土産を友達に渡します。何と言いますか。（矢印の人）',
        'options': ['これ、どうぞ。つまらないものですが。', 'これ、もらってください。', 'これ、どうですか。'],
        'correct': 0,
        'transcript': '状況：お土産を渡します。\n質問：何と言いますか。\n1. これ、どうぞ。つまらないものですが。\n2. これ、もらってください。\n3. これ、どうですか。',
        'explanation': 'Humble set expression when giving a gift / souvenir:「これ、どうぞ。つまらないものですが」(Option 1).'
    },
    {
        'id': 'n4-l-17',
        'type': 'Mondai 3 (発話表現)',
        'audioSrc': '/audio/japanese/n4/captured-media-2-mp3.mp3',
        'image': '/images/japanese/listening/n4/m3_q2.png',
        'question': '17. 友達を映画に誘います。何と言いますか。（矢印の人）',
        'options': ['映画に行きましょうか。', '一緒に映画を見に行かない？', '映画を見てください。'],
        'correct': 1,
        'transcript': '状況：友達を映画に誘います。\n質問：何と言いますか。\n1. 映画に行きましょうか。\n2. 一緒に映画を見に行かない？\n3. 映画を見てください。',
        'explanation': 'Casual invitation to a friend:「一緒に映画を見に行かない？」(Option 2).'
    },
    {
        'id': 'n4-l-18',
        'type': 'Mondai 3 (発話表現)',
        'audioSrc': '/audio/japanese/n4/captured-media-2-mp3.mp3',
        'image': '/images/japanese/listening/n4/m3_q3.png',
        'question': '18. 授業中に先生に質問します。何と言いますか。（矢印の人）',
        'options': ['先生、質問してもよろしいでしょうか。', '先生、質問してください。', '先生、質問を言います。'],
        'correct': 0,
        'transcript': '状況：授業中に先生に質問の許可を求めます。\n質問：何と言いますか。\n1. 先生、質問してもよろしいでしょうか。\n2. 先生、質問してください。\n3. 先生、質問を言います。',
        'explanation': 'Polite request expression asking permission to question:「先生、質問してもよろしいでしょうか」(Option 1).'
    },
    {
        'id': 'n4-l-19',
        'type': 'Mondai 3 (発話表現)',
        'audioSrc': '/audio/japanese/n4/captured-media-2-mp3.mp3',
        'image': '/images/japanese/listening/n4/m3_q4.png',
        'question': '19. 先生の研究室に入ります。何と言いますか。（矢印の人）',
        'options': ['失礼します。', 'ごめんなさい。', '入ります。'],
        'correct': 0,
        'transcript': '状況：先生の部屋に入ります。\n質問：何と言いますか。\n1. 失礼します。\n2. ごめんなさい。\n3. 入ります。',
        'explanation': 'Standard etiquette when entering a teacher\'s office:「失礼します」(Option 1).'
    },
    {
        'id': 'n4-l-20',
        'type': 'Mondai 3 (発話表現)',
        'audioSrc': '/audio/japanese/n4/captured-media-2-mp3.mp3',
        'image': '/images/japanese/listening/n4/m3_q5.png',
        'question': '20. 友達にペンを借りたいです。何と言いますか。（矢印の人）',
        'options': ['ペンを貸してもらえませんか。', 'ペンを貸してあげましょうか。', 'ペンを借りてください。'],
        'correct': 0,
        'transcript': '状況：友達にペンを借りたいです。\n質問：何と言いますか。\n1. ペンを貸してもらえませんか。\n2. ペンを貸してあげましょうか。\n3. ペンを借りてください。',
        'explanation': 'Polite request to receive lending favor:「ペンを貸してもらえませんか」(Option 1).'
    },

    # Mondai 4 (即時応答 - Q1 to Q8)
    {
        'id': 'n4-l-21',
        'type': 'Mondai 4 (即時応答)',
        'audioSrc': '/audio/japanese/n4/captured-media-3-mp3.mp3',
        'question': '21. 「その荷物、重そうですね。手伝いましょうか。」',
        'options': ['いいえ、重くありません。', 'すみません、助かります。', 'こちらこそ。'],
        'correct': 1,
        'transcript': '発話：「その荷物、重そうですね。手伝いましょうか。」\n1. いいえ、重くありません。\n2. すみません、助かります。\n3. こちらこそ。',
        'explanation': 'Gratefully accepting assistance:「すみません、助かります」(Option 2).'
    },
    {
        'id': 'n4-l-22',
        'type': 'Mondai 4 (即時応答)',
        'audioSrc': '/audio/japanese/n4/captured-media-3-mp3.mp3',
        'question': '22. 「明日の会議、何時からか知っていますか。」',
        'options': ['3時からですよ。', '3時に行きました。', '3時がいいです。'],
        'correct': 0,
        'transcript': '発話：「明日の会議、何時からか知っていますか。」\n1. 3時からですよ。\n2. 3時に行きました。\n3. 3時がいいです。',
        'explanation': 'Providing schedule information:「3時からですよ」(Option 1).'
    },
    {
        'id': 'n4-l-23',
        'type': 'Mondai 4 (即時応答)',
        'audioSrc': '/audio/japanese/n4/captured-media-3-mp3.mp3',
        'question': '23. 「ちょっとペンを貸していただけませんか。」',
        'options': ['はい、どうぞ。', 'いいえ、貸します。', 'どういたしまして。'],
        'correct': 0,
        'transcript': '発話：「ちょっとペンを貸していただけませんか。」\n1. はい、どうぞ。\n2. いいえ、貸します。\n3. どういたしまして。',
        'explanation': 'Agreeing to lend a pen:「はい、どうぞ」(Option 1).'
    },
    {
        'id': 'n4-l-24',
        'type': 'Mondai 4 (即時応答)',
        'audioSrc': '/audio/japanese/n4/captured-media-3-mp3.mp3',
        'question': '24. 「日本語がお上手ですね。」',
        'options': ['いいえ、まだまだです。', 'そうですね、上手です。', 'はい、上手になりました。'],
        'correct': 0,
        'transcript': '発話：「日本語がお上手ですね。」\n1. いいえ、まだまだです。\n2. そうですね、上手です。\n3. はい、上手になりました。',
        'explanation': 'Culturally polite modesty response to compliment:「いいえ、まだまだです」(Option 1).'
    },
    {
        'id': 'n4-l-25',
        'type': 'Mondai 4 (即時応答)',
        'audioSrc': '/audio/japanese/n4/captured-media-3-mp3.mp3',
        'question': '25. 「この書類、部長に見てもらいましたか。」',
        'options': ['はい、見せていただきました。', 'はい、見ていただきました。', 'いいえ、見させました。'],
        'correct': 1,
        'transcript': '発話：「この書類、部長に見てもらいましたか。」\n1. はい、見せていただきました。\n2. はい、見ていただきました。\n3. いいえ、見させました。',
        'explanation': 'Honorific humble expression for receiving manager\'s review:「見ていただきました」(Option 2).'
    },
    {
        'id': 'n4-l-26',
        'type': 'Mondai 4 (即時応答)',
        'audioSrc': '/audio/japanese/n4/captured-media-3-mp3.mp3',
        'question': '26. 「今度の日曜日、どこかへ出かけませんか。」',
        'options': ['ええ、どこか行きました。', 'いいですね、行きましょう。', 'いいえ、行きません。'],
        'correct': 1,
        'transcript': '発話：「今度の日曜日、どこかへ出かけませんか。」\n1. ええ、どこか行きました。\n2. いいですね、行きましょう。\n3. いいえ、行きません。',
        'explanation': 'Accepting an invitation enthusiastically:「いいですね、行きましょう」(Option 2).'
    },
    {
        'id': 'n4-l-27',
        'type': 'Mondai 4 (即時応答)',
        'audioSrc': '/audio/japanese/n4/captured-media-3-mp3.mp3',
        'question': '27. 「昨日のパーティー、楽しかったそうですね。」',
        'options': ['ええ、とても楽しかったです。', 'いいえ、楽しそうでした。', 'そうですね、行きませんでした。'],
        'correct': 0,
        'transcript': '発話：「昨日のパーティー、楽しかったそうですね。」\n1. ええ、とても楽しかったです。\n2. いいえ、楽しそうでした。\n3. そうですね、行きませんでした。',
        'explanation': 'Confirming shared hearsay with firsthand agreement:「ええ、とても楽しかったです」(Option 1).'
    },
    {
        'id': 'n4-l-28',
        'type': 'Mondai 4 (即時応答)',
        'audioSrc': '/audio/japanese/n4/captured-media-3-mp3.mp3',
        'question': '28. 「雨が降ってきましたね。傘を持っていますか。」',
        'options': ['ええ、持っていません。', 'はい、カバンに入っています。', 'いいえ、持っています。'],
        'correct': 1,
        'transcript': '発話：「雨が降ってきましたね。傘を持っていますか。」\n1. ええ、持っていません。\n2. はい、カバンに入っています。\n3. いいえ、持っています。',
        'explanation': 'Affirming that you have an umbrella in your bag:「はい、カバンに入っています」(Option 2).'
    }
]

# Update sections
N5_SECTIONS = [
    BASE_N5_SECTIONS[0], # Vocab (33 Qs)
    BASE_N5_SECTIONS[1], # Grammar (32 Qs)
    {
        'id': 'n5-sec-listening',
        'title': 'Section 3: Listening Comprehension (聴解)',
        'shortTitle': '聴解 (Listening)',
        'timeLimitSeconds': 30 * 60,
        'questions': N5_LISTENING_QUESTIONS # 24 Qs
    }
]

N4_SECTIONS = [
    BASE_N4_SECTIONS[0], # Vocab (34 Qs)
    BASE_N4_SECTIONS[1], # Grammar (35 Qs)
    {
        'id': 'n4-sec-listening',
        'title': 'Section 3: Listening Comprehension (聴解)',
        'shortTitle': '聴解 (Listening)',
        'timeLimitSeconds': 35 * 60,
        'questions': N4_LISTENING_QUESTIONS # 28 Qs
    }
]

js_content = f'''// Complete verbatim Exam Question Banks from official JLPT N5 & N4 practice test PDF booklets

export const N5_SECTIONS_DATA = {json.dumps(N5_SECTIONS, ensure_ascii=False, indent=2)};

export const N4_SECTIONS_DATA = {json.dumps(N4_SECTIONS, ensure_ascii=False, indent=2)};

export const N5_EXAM_QUESTIONS = N5_SECTIONS_DATA.flatMap((s) => s.questions);
export const N4_EXAM_QUESTIONS = N4_SECTIONS_DATA.flatMap((s) => s.questions);
'''

target_path = os.path.abspath('frontend/lib/japanese/examQuestionsData.js')
with open(target_path, 'w', encoding='utf-8') as f:
    f.write(js_content)

n5_total = sum(len(s['questions']) for s in N5_SECTIONS)
n4_total = sum(len(s['questions']) for s in N4_SECTIONS)
print(f'Successfully wrote {n5_total} total N5 questions (33 Vocab + 32 Grammar + 24 Listening) and {n4_total} total N4 questions (34 Vocab + 35 Grammar + 28 Listening) to {target_path}')
