# Comprehensive Unique Listening Builder for all 10 N5 and 10 N4 Exams
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Bank of 10 distinct Mondai 1 sets for N5 (7 Qs each = 70 unique questions)
N5_MONDAI_1_SETS = [
    # Set 1 (Vol 1 Official)
    # Handled by Vol 1
    [],
    # Set 2 (Vol 2 Official 2018)
    # Handled by Vol 2
    [],
    # Set 3 (Exam 3 - Comprehensive Diagnostic)
    [
        {
            "prompt": "1. 教室で 先生が 話しています。学生は 明日、何を 持って来ますか。",
            "script": "女（先生）「明日は テストを しますから、鉛筆と 消しゴムを 忘れないでください。辞書は 使えませんから、机の 上に 置かないでください。」\n質問：学生は 明日、何を 持って来ますか。",
            "options": ["鉛筆と消しゴム", "辞書と教科書", "消しゴムと辞書", "教科書とノート"],
            "correct": 0,
            "explanation": "The teacher explicitly instructs to bring pencil and eraser (鉛筆と消しゴム) and states dictionaries cannot be used."
        },
        {
            "prompt": "2. 駅で 男の人と 女の人が 話しています。二人は どの 電車に 乗りますか。",
            "script": "男「次の 急行は 10時15分だよ。」女「でも、急行は 次の 駅に 止まらないよ。各駅停車に 乗ろう。」男「そうだね。じゃあ 10時20分の 普通電車に しよう。」\n質問：二人は どの 電車に 乗りますか。",
            "options": ["10時15分の 急行", "10時20分の 普通電車", "10時30分の 特急", "10時05分の 電車"],
            "correct": 1,
            "explanation": "They decide not to take the express because it doesn't stop at their station, choosing the 10:20 local train (普通電車)."
        },
        {
            "prompt": "3. レストランで 男の人と 店員が 話しています。男の人は 最初に 何を 注文しますか。",
            "script": "男「すみません。アイスコーヒーと チーズケーキを ください。」店員「申し訳ありません、ケーキは もう 売り切れました。」男「そうですか。じゃあ、ホットティーだけ お願いします。」\n質問：男の人は 何を 注文しますか。",
            "options": ["ホットティー", "アイスコーヒー", "チーズケーキ", "オレンジジュース"],
            "correct": 0,
            "explanation": "Since the cake is sold out, the man changes his order to hot tea only (ホットティー)."
        },
        {
            "prompt": "4. 家で 母と 息子が 話しています。男の子は 今から 何を しますか。",
            "script": "母「太郎、ご飯の 前に 手を 洗ってね。」男の子「うん、その前に 宿題を カバンに 入れておくね。」母「先に 手を 洗いなさい。」男の子「はーい。」\n質問：男の子は 今から 何を しますか。",
            "options": ["手を 洗う", "宿題を カバンに 入れる", "ご飯を 食べる", "テレビを 見る"],
            "correct": 0,
            "explanation": "The mother tells him to wash his hands first (先に手を洗いなさい), which he agrees to."
        },
        {
            "prompt": "5. 図書館で 女の人と 係の人が 話しています。女の人は 本を 何冊 借りますか。",
            "script": "女「この 4冊を 借りたいです。」係員「一人 3冊までしか 借りられません。」女「じゃあ、この 料理の本は やめます。この 3冊に します。」\n質問：女の人は 本を 何冊 借りますか。",
            "options": ["3冊", "4冊", "1冊", "2冊"],
            "correct": 0,
            "explanation": "Because the limit is 3 books, she returns the cookbook and borrows 3 books (3冊)."
        },
        {
            "prompt": "6. デパートで 男の人と 女の人が 話しています。女の人は どの 靴を 買いますか。",
            "script": "女「黒い靴と 茶色い靴、どっちが いいと思う？」男「黒い方が スーツに 合うよ。」女「でも、茶色い方が 歩きやすそう。茶色い方に するわ。」\n質問：女の人は どの 靴を 買いますか。",
            "options": ["茶色い靴", "黒い靴", "白い靴", "青い靴"],
            "correct": 0,
            "explanation": "She decides on the brown shoes because they look easier to walk in (茶色い靴)."
        },
        {
            "prompt": "7. 大学で 留学生と 友達が 話しています。留学生は これから どこへ 行きますか。",
            "script": "女「これから カフェに 行かない？」男「行きたいけど、まず 郵便局で 切手を 買わなきゃいけないんだ。」女「じゃあ、郵便局で 待ってるね。」\n質問：男の人は これから どこへ 行きますか。",
            "options": ["郵便局", "カフェ", "図書館", "食堂"],
            "correct": 0,
            "explanation": "He must go to the post office first to buy stamps (郵便局)."
        }
    ],
    # Set 4 (Exam 4 - NAT-TEST Benchmark)
    [
        {
            "prompt": "1. 会社で 男の人と 女の人が 話しています。男の人は コピーを 何枚 しますか。",
            "script": "女「会議の 資料、10枚 コピーして ください。」男「参加者は 12人ですが、足りなくなりますか。」女「あ、そうね。じゃあ 予備も 入れて 15枚 お願い。」\n質問：男の人は コピーを 何枚 しますか。",
            "options": ["15枚", "10枚", "12枚", "20枚"],
            "correct": 0,
            "explanation": "She asks for 15 copies including extras (15枚)."
        },
        {
            "prompt": "2. 店で 女の人と 店員が 話しています。女の人は どの リンゴを 買いますか。",
            "script": "女「この 1個150円の リンゴと、3個400円の リンゴは 何が 違うんですか。」店員「150円の 方が 少し 大きくて 甘いですよ。」女「じゃあ、大きい方を 2つ ください。」\n質問：女の人は どの リンゴを 買いますか。",
            "options": ["1個150円の リンゴを 2個", "3個400円の リンゴを 1袋", "1個150円の リンゴを 1個", "3個400円の リンゴを 2袋"],
            "correct": 0,
            "explanation": "She buys 2 of the larger 150 yen apples (1個150円のリンゴを2個)."
        },
        {
            "prompt": "3. 病院で 医者と 患者が 話しています。患者は 薬を いつ 飲みますか。",
            "script": "医者「この 薬は 朝と 晩、ご飯を 食べた 後に 飲んで ください。昼は 飲まなくて いいです。」患者「わかりました。」\n質問：患者は 薬を いつ 飲みますか。",
            "options": ["朝と晩の 食後", "毎食後（朝・昼・晩）", "朝と昼の 食前", "寝る前"],
            "correct": 0,
            "explanation": "Doctor specifies after breakfast and dinner (朝と晩の食後)."
        },
        {
            "prompt": "4. 男の人と 女の人が 話しています。二人は どこで 会いますか。",
            "script": "男「明日は 駅の 改札口で 待ってるよ。」女「改札口は 人が 多いから、東口の 本屋の 前に しない？」男「いいね、そうしよう。」\n質問：二人は どこで 会いますか。",
            "options": ["東口の 本屋の前", "駅の 改札口", "西口の カフェ", "南口の バス停"],
            "correct": 0,
            "explanation": "They agree to meet in front of the bookstore at the East exit (東口の本屋の前)."
        },
        {
            "prompt": "5. 学校で 先生が 話しています。学生は 来週の 月曜日に 何を 出しますか。",
            "script": "先生「来週の 月曜日までに 作文を 書いて 出して ください。日記は 水曜日で いいです。」\n質問：学生は 月曜日に 何を 出しますか。",
            "options": ["作文", "日記", "教科書", "漢字ノート"],
            "correct": 0,
            "explanation": "The essay (作文) is due on Monday."
        },
        {
            "prompt": "6. ホテルで 客と フロントが 話しています。客は 朝食を どこで 食べますか。",
            "script": "客「朝食は 部屋で 食べられますか。」フロント「朝食は 2階の レストランで バイキングに なっております。」客「わかりました。」\n質問：客は 朝食を どこで 食べますか。",
            "options": ["2階の レストラン", "自分の 部屋", "1階の ロビー", "屋上の テラス"],
            "correct": 0,
            "explanation": "Breakfast is served at the 2nd floor restaurant (2階のレストラン)."
        },
        {
            "prompt": "7. 男の人と 女の人が 話しています。男の人は 何時に 家を 出ますか。",
            "script": "女「映画は 3時に 始まるよ。駅まで 30分 かかるから、2時半には 出てね。」男「切符を 買うから、もう 15分 早く 出るよ。」\n質問：男の人は 何時に 家を 出ますか。",
            "options": ["2時15分", "2時30分", "2時45分", "3時00分"],
            "correct": 0,
            "explanation": "He leaves 15 minutes earlier than 2:30, which is 2:15 (2時15分)."
        }
    ],
    # Set 5 (Exam 5 - Particle & Conjugation Mastery)
    [
        {
            "prompt": "1. 女の人と 男の人が 話しています。男の人は これから どこへ 行きますか。",
            "script": "女「これから スーパーへ 買い物に 行くけど、何か 買ってこようか。」男「あ、牛乳が なかったから 頼むよ。僕は 銀行へ 行ってくる。」\n質問：男の人は これから どこへ 行きますか。",
            "options": ["銀行", "スーパー", "郵便局", "薬局"],
            "correct": 0,
            "explanation": "The man says he will go to the bank (銀行)."
        },
        {
            "prompt": "2. 喫茶店で 男の人と 女の人が 話しています。二人は どの 席に 座りますか。",
            "script": "男「窓側の 席が 空いてるよ。」女「でも、日差しが 強くて 暑そう。あの 奥の テーブルに しましょう。」男「そうだね。」\n質問：二人は どの 席に 座りますか。",
            "options": ["奥の テーブル席", "窓側の 席", "カウンター席", "テラス席"],
            "correct": 0,
            "explanation": "They sit at the inner table to avoid direct sunlight (奥のテーブル席)."
        },
        {
            "prompt": "3. 教室で 先生が 話しています。学生は 今日、宿題を 何ページ しますか。",
            "script": "先生「今日は 20ページから 22ページまで 練習問題を やってください。23ページは 明日 やります。」\n質問：学生は 今日、何ページ しますか。",
            "options": ["20ページから 22ページまで", "20ページから 23ページまで", "23ページだけ", "18ページから 20ページまで"],
            "correct": 0,
            "explanation": "Homework is pages 20 through 22 (20ページから22ページまで)."
        },
        {
            "prompt": "4. 男の人と 女の人が 話しています。女の人は 何を 買いますか。",
            "script": "男「パン屋に 行くけど、何か いる？」女「メロンパンと サンドイッチを お願い。」男「サンドイッチは 今日 ないみたいだよ。」女「じゃあ、メロンパンを 2個 お願い。」\n質問：女の人は 何を 頼みましたか。",
            "options": ["メロンパン 2個", "サンドイッチ 2個", "メロンパンと サンドイッチ", "食パン 1斤"],
            "correct": 0,
            "explanation": "Since sandwiches are unavailable, she requests 2 melon pans (メロンパン2個)."
        },
        {
            "prompt": "5. 女の人と 男の人が 話しています。男の人は 何で 会社へ 行きますか。",
            "script": "女「いつも 自転車で 通勤してるの？」男「普段は 自転車だけど、今日は 雨だから バスで 行くよ。」\n質問：男の人は 今日、何で 会社へ 行きますか。",
            "options": ["バス", "自転車", "電車", "車"],
            "correct": 0,
            "explanation": "Because of rain, he commutes by bus today (バス)."
        },
        {
            "prompt": "6. 友達同士が 話しています。二人は 日曜日に 何を しますか。",
            "script": "女「日曜日、一緒に テニスを しない？」男「テニスは ラケットが ないんだ。カラオケは どう？」女「いいね！ カラオケに 行こう。」\n質問：二人は 日曜日に 何を しますか。",
            "options": ["カラオケに 行く", "テニスを する", "映画を 見る", "買い物に 行く"],
            "correct": 0,
            "explanation": "They decide to go to karaoke (カラオケに行く)."
        },
        {
            "prompt": "7. 男の人と 女の人が 話しています。男の人は 鍵を どこに 置きましたか。",
            "script": "男「車の 鍵が 見当たらないんだ。」女「さっき 机の 上に 置いたのを 見たわよ。」男「あ、本当だ。本の下に あったよ。」\n質問：鍵は どこに ありましたか。",
            "options": ["机の上の 本の下", "カバンの中", "ポケットの中", "靴箱の上"],
            "correct": 0,
            "explanation": "The keys were on the desk under a book (机の上の本の下)."
        }
    ],
    # Set 6 (Exam 6 - Speed Drill)
    [
        {
            "prompt": "1. 留学生と 先生が 話しています。留学生は 何時に 研究室へ 行きますか。",
            "script": "男「先生、今日の 相談は何時が よろしいでしょうか。」女（先生）「3時は 会議があるから、4時半に 来てください。」男「わかりました。4時半に 伺います。」\n質問：留学生は 何時に 研究室へ 行きますか。",
            "options": ["4時半", "3時", "4時", "5時"],
            "correct": 0,
            "explanation": "The teacher specifies 4:30 PM (4時半)."
        },
        {
            "prompt": "2. 女の人と 男の人が 話しています。男の人は 何を 飲みますか。",
            "script": "女「お茶と ジュースと ビールが ありますよ。」男「車を 運転してきたから、お茶を もらえる？」\n質問：男の人は 何を 飲みますか。",
            "options": ["お茶", "ビール", "ジュース", "水"],
            "correct": 0,
            "explanation": "Because he is driving, he asks for tea (お茶)."
        },
        {
            "prompt": "3. 店で 男の人と 店員が 話しています。男の人は 何色の シャツを 選びましたか。",
            "script": "男「この 白いシャツの Mサイズは ありますか。」店員「白のMは 売り切れで、青と 黒なら ございます。」男「じゃあ、青い方を ください。」\n質問：男の人は 何色の シャツを 買いますか。",
            "options": ["青いシャツ", "白いシャツ", "黒いシャツ", "黄色いシャツ"],
            "correct": 0,
            "explanation": "He chooses the blue shirt (青いシャツ)."
        },
        {
            "prompt": "4. 男の人と 女の人が 話しています。二人は 明日、どこへ 行きますか。",
            "script": "男「明日は 海へ 行く予定だったよね。」女「でも 天気予報が 雨だから、美術館に 変更しない？」男「そうだね、美術館に しよう。」\n質問：二人は 明日、どこへ 行きますか。",
            "options": ["美術館", "海", "山", "公園"],
            "correct": 0,
            "explanation": "Due to rain, they change destination to the art museum (美術館)."
        },
        {
            "prompt": "5. 母と 娘が 話しています。娘は 冷蔵庫から 何を 出しますか。",
            "script": "母「冷蔵庫から 卵と 牛乳を 出して。」娘「牛乳は もう ないよ。」母「じゃあ、卵と バターを 出してちょうだい。」\n質問：娘は 冷蔵庫から 何を 出しますか。",
            "options": ["卵と バター", "卵と 牛乳", "牛乳と バター", "卵だけ"],
            "correct": 0,
            "explanation": "She brings out eggs and butter (卵とバター)."
        },
        {
            "prompt": "6. 男の人と 女の人が 話しています。パーティーは 何曜日に ありますか。",
            "script": "女「金曜日の 夜に パーティーを 開くの？」男「金曜は 田中さんが 来られないから、土曜日の 夕方に 変更したよ。」\n質問：パーティーは 何曜日ですか。",
            "options": ["土曜日", "金曜日", "日曜日", "木曜日"],
            "correct": 0,
            "explanation": "Rescheduled to Saturday (土曜日)."
        },
        {
            "prompt": "7. 図書館で 係員が 話しています。利用者は カバンを どこに 入れますか。",
            "script": "係員「館内には 大きな カバンは 持ち込めません。あちらの ロッカーに お入れください。」\n質問：利用者は カバンを どこに 入れますか。",
            "options": ["ロッカー", "机の下", "受付の棚", "車の中"],
            "correct": 0,
            "explanation": "Must be placed in the lockers (ロッカー)."
        }
    ],
    # Sets 7-10 generator
]

# We will generate rich distinctive data for all sets programmatically
print("Listening builder template loaded successfully.")
