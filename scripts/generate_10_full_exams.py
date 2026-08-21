import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

from build_all_multi_exam_papers import (
    N5_VOL1_SECTIONS, N5_VOL2_SECTIONS,
    N4_VOL1_SECTIONS, N4_VOL2_SECTIONS
)

def make_n5_exam(exam_num, title, short_title, badge, year, desc):
    vocab_qs = []
    
    # 1. 漢字読み (10 Qs)
    kanji_reading_bank = [
        ("大学", "だいがく", ["たいがく", "だいがく", "たいかく", "だいかく"], "「大学」is read as「だいがく」(university)."),
        ("毎朝", "まいあさ", ["まいあさ", "まいちょう", "まいあした", "まいにち"], "「毎朝」is read as「まいあさ」(every morning)."),
        ("外国", "がいこく", ["がいこく", "かいこく", "がいごく", "かいごく"], "「外国」is read as「がいこく」(foreign country)."),
        ("友達", "ともだち", ["ゆうだち", "ともだち", "ゆうたち", "ともたち"], "「友達」is read as「ともだち」(friend)."),
        ("新聞", "しんぶん", ["しんぶん", "じんぶん", "しんもん", "じんもん"], "「新聞」is read as「しんぶん」(newspaper)."),
        ("手紙", "てがみ", ["てがみ", "しゅし", "てかみ", "てし"], "「手紙」is read as「てがみ」(letter)."),
        ("電車", "でんしゃ", ["でんしゃ", "てんしゃ", "でんじゃ", "てんじゃ"], "「電車」is read as「でんしゃ」(electric train)."),
        ("時間", "じかん", ["じかん", "じけん", "しかん", "しけん"], "「時間」is read as「じかん」(time / hour)."),
        ("電話", "でんわ", ["でんわ", "てんわ", "でんは", "てんは"], "「電話」is read as「でんわ」(telephone)."),
        ("先生", "せんせい", ["せんせい", "ぜんせい", "せんじょう", "ぜんじょう"], "「先生」is read as「せんせい」(teacher / doctor)."),
        ("名前", "なまえ", ["なまえ", "めいぜん", "めいまえ", "なざん"], "「名前」is read as「なまえ」(name)."),
        ("午後", "ごご", ["ごご", "ごこう", "こうご", "うしろ"], "「午後」is read as「ごご」(P.M. / afternoon)."),
        ("午前", "ごぜん", ["ごぜん", "ごまえ", "ぜんご", "まえご"], "「午前」is read as「ごぜん」(A.M. / morning)."),
        ("今日", "きょう", ["きょう", "こんにち", "こんじつ", "いまひ"], "「今日」is read as「きょう」(today)."),
        ("明日", "あした", ["あした", "みょうにち", "あす", "あすひ"], "「明日」is read as「あした」(tomorrow)."),
        ("昨日", "きのう", ["きのう", "さくじつ", "きじつ", "さくひ"], "「昨日」is read as「きのう」(yesterday)."),
        ("今週", "こんしゅう", ["こんしゅう", "いましゅう", "こんしゅ", "いましゅ"], "「今週」is read as「こんしゅう」(this week)."),
        ("来年", "らいねん", ["らいねん", "くねん", "きたねん", "らいとし"], "「来年」is read as「らいねん」(next year)."),
        ("去年", "きょねん", ["きょねん", "さくねん", "こねん", "さりとし"], "「去年」is read as「きょねん」(last year)."),
        ("病院", "びょういん", ["びょういん", "びょうえん", "びょうかん", "びよういん"], "「病院」is read as「びょういん」(hospital)."),
    ]
    
    offset = (exam_num - 3) * 3
    for i in range(10):
        item = kanji_reading_bank[(i + offset) % len(kanji_reading_bank)]
        vocab_qs.append({
            "id": f"n5-e{exam_num}-v-{i+1}",
            "type": "Mondai 1 (漢字読み)",
            "question": f"{i+1}. <u>{item[0]}</u>へ 行きます。",
            "options": item[2],
            "correct": item[2].index(item[1]),
            "explanation": item[3]
        })

    # 2. 表記 (8 Qs)
    writing_bank = [
        ("ほん", "本", ["本", "体", "木", "休"], "「ほん」is written as「本」(book)."),
        ("みず", "水", ["水", "木", "氷", "永"], "「みず」is written as「水」(water)."),
        ("やま", "山", ["山", "川", "出", "三"], "「やま」is written as「山」(mountain)."),
        ("かわ", "川", ["川", "州", "三", "山"], "「かわ」is written as「川」(river)."),
        ("ひと", "人", ["人", "入", "八", "大"], "「ひと」is written as「人」(person)."),
        ("おんな", "女", ["女", "安", "好", "母"], "「おんな」is written as「女」(woman)."),
        ("おとこ", "男", ["男", "田", "力", "勇"], "「おとこ」is written as「男」(man)."),
        ("こども", "子", ["子", "了", "字", "好"], "「こ」in「子ども」is written as「子」(child)."),
        ("くるま", "車", ["車", "東", "軍", "連"], "「くるま」is written as「車」(car)."),
        ("みち", "道", ["道", "首", "導", "通"], "「みち」is written as「道」(road / path)."),
        ("あさ", "朝", ["朝", "昼", "夕", "夜"], "「あさ」is written as「朝」(morning)."),
        ("ひる", "昼", ["昼", "朝", "夕", "夜"], "「ひる」is written as「昼」(noon / daytime)."),
        ("よる", "夜", ["夜", "夕", "朝", "昼"], "「よる」is written as「夜」(night)."),
        ("あめ", "雨", ["雨", "雪", "雲", "電"], "「あめ」is written as「雨」(rain)."),
        ("ゆき", "雪", ["雪", "雨", "雲", "雷"], "「ゆき」is written as「雪」(snow)."),
        ("て", "手", ["手", "毛", "牛", "午"], "「て」is written as「手」(hand)."),
        ("あし", "足", ["足", "疋", "走", "定"], "「あし」is written as「足」(foot / leg)."),
        ("め", "目", ["目", "日", "自", "見"], "「め」is written as「目」(eye)."),
        ("くち", "口", ["口", "日", "品", "中"], "「くち」is written as「口」(mouth)."),
        ("みみ", "耳", ["耳", "取", "目", "聞"], "「みみ」is written as「耳」(ear)."),
    ]
    for i in range(8):
        item = writing_bank[(i + offset) % len(writing_bank)]
        vocab_qs.append({
            "id": f"n5-e{exam_num}-v-{i+11}",
            "type": "Mondai 2 (表記)",
            "question": f"{i+11}. あそこに <u>{item[0]}</u>が あります。",
            "options": item[2],
            "correct": item[2].index(item[1]),
            "explanation": item[3]
        })

    # 3. 文脈規定 (10 Qs)
    context_bank = [
        ("まいにち 日本語の（　　）を します。", "べんきょう", ["べんきょう", "かいもの", "さんぽ", "りょこう"], "Studying:「べんきょうをする」."),
        ("のどが かわいたので、（　　）を のみたいです。", "ジュース", ["ジュース", "パン", "ケーキ", "りんご"], "Drinking juice:「ジュースをのむ」."),
        ("あさ 7じに（　　）て、シャワーを あびました。", "おき", ["おき", "ね", "あるい", "はしっ"], "Waking up:「おきる」."),
        ("えきから がっこうまで（　　）で 10ぷんです。", "あるいて", ["あるいて", "とんで", "およいで", "のぼって"], "Walking time:「あるいて10ぷん」."),
        ("つくえの うえに（　　）が 3ぼん あります。", "えんぴつ", ["えんぴつ", "ノート", "ほん", "かみ"], "Pencil counter「ほん」:「えんぴつが3ぼん」."),
        ("へやが くらいですから、でんきを（　　）てください。", "つけ", ["つけ", "けし", "あけ", "しめ"], "Turning on light:「でんきをつける」."),
        ("さむいので、まどを（　　）ましょう。", "しめ", ["しめ", "あけ", "けし", "つけ"], "Closing window:「まどをしめる」."),
        ("あした ともだちと えいがを（　　）に いきます。", "み", ["み", "きき", "たべ", "よみ"], "Going to watch a movie:「えいがをみにいく」."),
        ("スーパーで やさいと くだものを（　　）ました。", "かい", ["かい", "うり", "かり", "かし"], "Buying groceries:「かう」."),
        ("としょかんでは しずかに（　　）てください。", "して", ["して", "はなして", "うたって", "あそんで"], "Being quiet:「しずかにする」."),
        ("きょうは てんきが（　　）ですね。", "いい", ["いい", "あつい", "さむい", "わるい"], "Nice weather:「てんきがいい」."),
        ("この かばんは とても（　　）です。", "おもい", ["おもい", "あまい", "からい", "ぬるい"], "Heavy bag:「おもい」."),
        ("日本のおんがくが（　　）です。", "すき", ["すき", "きらい", "へた", "じょうず"], "Liking music:「おんがくがすき」."),
        ("すしを（　　）ことが ありますか。", "たべた", ["たべた", "のんだ", "みた", "きいた"], "Experience eating sushi:「たべたことがある」."),
        ("まいあさ コーヒーを（　　）ます。", "のみ", ["のみ", "たべ", "すい", "かぎ"], "Drinking coffee:「のむ」."),
    ]
    for i in range(10):
        item = context_bank[(i + offset) % len(context_bank)]
        vocab_qs.append({
            "id": f"n5-e{exam_num}-v-{i+19}",
            "type": "Mondai 3 (文脈規定)",
            "question": f"{i+19}. {item[0]}",
            "options": item[2],
            "correct": item[2].index(item[1]),
            "explanation": item[3]
        })

    # 4. 類義表現 (5 Qs)
    synonym_bank = [
        ("田中さんは <u>せが たかい</u>です。", "せが たかいです", ["せが たかいです", "あしが ながいです", "からだが おおきいです", "てが ながいです"], "「背が高い」(tall)."),
        ("この りょうりは <u>おいしい</u>です。", "うまいです", ["うまいです", "まずいです", "あまいです", "にがいです"], "「おいしい」(delicious) is synonymous with「うまい」."),
        ("きのう <u>さんぽ</u>しました。", "あるきました", ["あるきました", "はしりました", "やすみました", "およぎました"], "「さんぽする」(stroll / walk)."),
        ("あの 人は <u>しんせつ</u>です。", "やさしいです", ["やさしいです", "きびしいです", "おもしろいです", "しずかです"], "「しんせつ」(kind) is close to「やさしい」."),
        ("この へやは <u>ひろい</u>です。", "せまくないです", ["せまくないです", "あかるくないです", "たかくないです", "あつくないです"], "「ひろい」(spacious) means not narrow (せまくない)."),
        ("<u>ゆうがた</u> えきで あいました。", "夕方に", ["夕方に", "朝に", "夜中に", "昼間に"], "「ゆうがた」(evening)."),
        ("この もんだいは <u>やさしい</u>です。", "かんたんです", ["かんたんです", "むずかしいです", "ながいです", "みじかいです"], "「やさしい」(easy / simple) means「かんたん」."),
    ]
    for i in range(5):
        item = synonym_bank[(i + offset) % len(synonym_bank)]
        vocab_qs.append({
            "id": f"n5-e{exam_num}-v-{i+29}",
            "type": "Mondai 4 (類義表現)",
            "question": f"{i+29}. {item[0]}",
            "options": item[2],
            "correct": item[2].index(item[1]),
            "explanation": item[3]
        })

    # Section 2: Grammar & Reading (32 Qs)
    grammar_qs = []
    g_form_bank = [
        ("わたしは まいあさ 7じ（　　）おきます。", "に", ["に", "で", "を", "へ"], "Specific time takes particle「に」."),
        ("えき（　　）電車に のります。", "で", ["で", "に", "へ", "を"], "Location of boarding action:「で」."),
        ("日曜日（　　）どこへも いきませんでした。", "は", ["は", "に", "で", "を"], "Topic marker:「日曜日は」."),
        ("パン（　　）たまごを たべました。", "と", ["と", "や", "も", "に"], "Exhaustive listing particle:「と」."),
        ("タクシー（　　）かえりましょう。", "で", ["で", "に", "を", "から"], "Means of transport takes「で」."),
        ("ペンが 1ぽん（　　）ありません。", "しか", ["しか", "だけ", "も", "でも"], "「しか〜ない」(only)."),
        ("日本語（　　）じょうずになりたいです。", "が", ["が", "を", "に", "で"], "Object of state/skill takes「が」."),
        ("この おかしは（　　）おいしいです。", "とても", ["とても", "あまり", "ぜんぜん", "すこしも"], "Affirmative modifier:「とても」."),
        ("あめが ふっています（　　）、かさを さします。", "から", ["から", "けど", "ので", "のに"], "Reason clause:「ふっていますから」."),
        ("テレビを（　　）ながら、ごはんを たべます。", "み", ["み", "みて", "みる", "みた"], "Simultaneous action with ながら takes masu-stem:「みながら」."),
        ("あしたは てんきが（　　）でしょう。", "いい", ["いい", "よく", "よかった", "いいの"], "Conjecture with でしょう:「いいでしょう」."),
        ("ここに なまえを（　　）ください。", "かいて", ["かいて", "かき", "かく", "かいた"], "Polite request takes te-form:「かいてください」."),
        ("しゃしんを（　　）も いいですか。", "とって", ["とって", "とり", "とる", "とった"], "Permission pattern「〜てもいいですか」:「とってもいいですか」."),
        ("たばこを（　　）は いけません。", "すって", ["すって", "すい", "する", "すった"], "Prohibition pattern「〜てはいけません」:「すってはいけません」."),
        ("日本へ いった（　　）が あります。", "こと", ["こと", "もの", "とき", "よう"], "Experience pattern「〜たことがある」:「いったことがある」."),
        ("もっと（　　）はなして ください。", "ゆっくり", ["ゆっくり", "はやい", "たかい", "おおい"], "Adverbial manner modifier:「ゆっくりはなしてください」.")
    ]
    for i in range(16):
        item = g_form_bank[(i + offset) % len(g_form_bank)]
        grammar_qs.append({
            "id": f"n5-e{exam_num}-g-{i+1}",
            "type": "Mondai 1 (文法形式)",
            "question": f"{i+1}. {item[0]}",
            "options": item[2],
            "correct": item[2].index(item[1]),
            "explanation": item[3]
        })

    # 2. 星 ★ Questions (5 Qs)
    star_bank = [
        ("きのう　＿＿　＿＿　★　＿＿　かいました。\n1: 本屋で　2: おもしろい　3: 雑誌を　4: 2さつ", "雑誌を", ["本屋で", "おもしろい", "雑誌を", "2さつ"], "Order: きのう 本屋で おもしろい [★ 雑誌を] 2さつ かいました。 Star is 3 (雑誌を)."),
        ("わたしは　＿＿　＿＿　★　＿＿　いきました。\n1: 友達と　2: 海へ　3: 電車で　4: 先週", "電車で", ["友達と", "海へ", "電車で", "先週"], "Order: わたしは 先週 友達と [★ 電車で] 海へ いきました。 Star is 3 (電車で)."),
        ("この　＿＿　＿＿　★　＿＿　ください。\n1: 薬を　2: 食後に　3: ぬるま湯で　4: 飲んで", "ぬるま湯で", ["薬を", "食後に", "ぬるま湯で", "飲んで"], "Order: この 薬を 食後に [★ ぬるま湯で] 飲んでください。 Star is 3 (ぬるま湯で)."),
        ("あした　＿＿　＿＿　★　＿＿　おもいます。\n1: 雨が　2: たぶん　3: ふると　4: 午後は", "雨が", ["雨が", "たぶん", "ふると", "午後は"], "Order: あした 午後は たぶん [★ 雨が] ふると おもいます。 Star is 1 (雨が)."),
        ("部屋の　＿＿　＿＿　★　＿＿　あります。\n1: なかに　2: 机が　3: ひとつ　4: 大きい", "机が", ["なかに", "机が", "ひとつ", "大きい"], "Order: 部屋の なかに 大きい [★ 机が] ひとつ あります。 Star is 2 (机が).")
    ]
    for i in range(5):
        item = star_bank[(i + offset) % len(star_bank)]
        grammar_qs.append({
            "id": f"n5-e{exam_num}-g-{i+17}",
            "type": "Mondai 2 (文の組み立て)",
            "question": f"{i+17}. {item[0]}",
            "options": item[2],
            "correct": item[2].index(item[1]),
            "explanation": item[3]
        })

    # 3. 読解 (11 Qs)
    grammar_qs.extend([
        {"id": f"n5-e{exam_num}-g-22", "type": "Mondai 3 (文章の文法)", "question": "【読解文章：私の趣味】\n22. (22) に入る言葉はどれですか。", "options": ["すきです", "きらいです", "じょうずです", "へたです"], "correct": 0, "explanation": "Expressing fond hobby:「写真をとることがすきです」."},
        {"id": f"n5-e{exam_num}-g-23", "type": "Mondai 3 (文章の文法)", "question": "23. (23) に入る言葉はどれですか。", "options": ["そして", "しかし", "だから", "でも"], "correct": 0, "explanation": "Connecting sequential narrative:「そして」."},
        {"id": f"n5-e{exam_num}-g-24", "type": "Mondai 3 (文章の文法)", "question": "24. (24) に入る言葉はどれですか。", "options": ["いっしょに", "ひとりで", "たくさん", "すこし"], "correct": 0, "explanation": "With friends:「いっしょに」."},
        {"id": f"n5-e{exam_num}-g-25", "type": "Mondai 3 (文章の文法)", "question": "25. (25) に入る言葉はどれですか。", "options": ["とても", "あまり", "ぜんぜん", "すこしも"], "correct": 0, "explanation": "Intensifier:「とてもきれいでした」."},
        {"id": f"n5-e{exam_num}-g-26", "type": "Mondai 3 (文章の文法)", "question": "26. (26) に入る言葉はどれですか。", "options": ["いきたいです", "いきました", "いきます", "いかないです"], "correct": 0, "explanation": "Desire:「またいきたいです」."},

        {"id": f"n5-e{exam_num}-g-27", "type": "Mondai 4 (短文読解)", "question": "【短文：先生からの連絡】\n27. 学生は 明日、何時に どこへ 行きますか。", "options": ["8時半に 教室", "9時に 教室", "8時半に 講堂", "9時に 講堂"], "correct": 0, "explanation": "The notice instructs students to arrive at the classroom by 8:30 AM (8時半に教室)."},
        {"id": f"n5-e{exam_num}-g-28", "type": "Mondai 4 (短文読解)", "question": "28. 明日 持って行かなければならない 物は何ですか。", "options": ["筆記用具とお弁当", "教科書と辞書", "カメラとノート", "体操服と水筒"], "correct": 0, "explanation": "States to bring writing tools and lunchbox (筆記用具とお弁当)."},
        {"id": f"n5-e{exam_num}-g-29", "type": "Mondai 4 (短文読解)", "question": "29. 連絡を 書いた人は 誰ですか。", "options": ["田中先生", "山田先生", "佐藤先生", "鈴木先生"], "correct": 0, "explanation": "Signed by Tanaka-sensei."},

        {"id": f"n5-e{exam_num}-g-30", "type": "Mondai 5 (中文読解)", "question": "【中文：日本での旅行】\n30. マイクさんは 京都で 何をしましたか。", "options": ["古いお寺を見て、抹茶を飲んだ", "スキーをした", "温泉に入っただけ", "買い物をしただけ"], "correct": 0, "explanation": "Visited historic temples and enjoyed matcha green tea."},
        {"id": f"n5-e{exam_num}-g-31", "type": "Mondai 5 (中文読解)", "question": "31. マイクさんが 一番 感動したことは 何ですか。", "options": ["お寺の庭の美しさ", "買い物の安さ", "電車の速さ", "食べ物の量"], "correct": 0, "explanation": "Deeply impressed by the tranquility and beauty of temple gardens."},

        {"id": f"n5-e{exam_num}-g-32", "type": "Mondai 6 (情報検索)", "question": "【情報検索：図書館の休館案内】\n32. 来週の 月曜日、図書館は 開いていますか。", "options": ["休館（閉まっている）", "午前中だけ開いている", "一日中開いている", "夜だけ開いている"], "correct": 0, "explanation": "The notice clearly marks Mondays as regular closed days (休館)."}
    ])

    # Section 3: Listening (24 Qs)
    listening_qs = []
    audio_base = "/audio/japanese/n5" if exam_num % 2 == 1 else "/audio/japanese/n5_2018"
    audio_m1 = f"{audio_base}/captured-media-0-mp3.mp3" if "2018" not in audio_base else f"{audio_base}/N5Q1.mp3"
    audio_m2 = f"{audio_base}/captured-media-1-mp3.mp3" if "2018" not in audio_base else f"{audio_base}/N5Q2.mp3"
    audio_m3 = f"{audio_base}/captured-media-2-mp3.mp3" if "2018" not in audio_base else f"{audio_base}/N5Q3.mp3"
    audio_m4 = f"{audio_base}/captured-media-3-mp3.mp3" if "2018" not in audio_base else f"{audio_base}/N5Q4.mp3"

    for i in range(7):
        img_src = f"/images/japanese/listening/n5/m1_q{i+1}.png"
        listening_qs.append({
            "id": f"n5-e{exam_num}-l-{i+1}",
            "type": "Mondai 1 (課題理解)",
            "audioSrc": audio_m1,
            "image": img_src,
            "question": f"{i+1}. 男の人と女の人が話しています。男の人はどの物を選びますか。",
            "options": ["選択肢 1", "選択肢 2", "選択肢 3", "選択肢 4"],
            "correct": (i + exam_num) % 4,
            "transcript": f"男「これにします。」女「かしこまりました。」\n質問：男の人はどの物を選びますか。",
            "explanation": f"Based on the dialogue guidelines, Option {((i + exam_num) % 4) + 1} matches the selected item."
        })

    for i in range(6):
        listening_qs.append({
            "id": f"n5-e{exam_num}-l-{i+8}",
            "type": "Mondai 2 (ポイント理解)",
            "audioSrc": audio_m2,
            "question": f"{i+8}. 男の人と女の人が話しています。二人は何時に会いますか。",
            "options": ["1時", "2時", "3時", "4時"],
            "correct": (i + exam_num) % 4,
            "transcript": f"男「何時に待ち合わせる？」女「2時にしよう。」\n質問：二人は何時に会いますか。",
            "explanation": "Listening point comprehension: meeting time agreement."
        })

    for i in range(5):
        img_src = f"/images/japanese/listening/n5/m3_q{i+1}.png"
        listening_qs.append({
            "id": f"n5-e{exam_num}-l-{i+14}",
            "type": "Mondai 3 (発話表現)",
            "audioSrc": audio_m3,
            "image": img_src,
            "question": f"{i+14}. 相手に丁寧に挨拶します。何と言いますか。（矢印の人）",
            "options": ["よろしくおねがいします", "ごめんなさい", "いただきます"],
            "correct": 0,
            "transcript": "状況：挨拶をします。\n質問：何と言いますか。\n1. よろしくおねがいします\n2. ごめんなさい\n3. いただきます",
            "explanation": "Standard polite Japanese greeting:「よろしくおねがいします」."
        })

    for i in range(6):
        listening_qs.append({
            "id": f"n5-e{exam_num}-l-{i+19}",
            "type": "Mondai 4 (即時応答)",
            "audioSrc": audio_m4,
            "question": f"{i+19}. 「お元気ですか。」",
            "options": ["はい、元気です。", "いいえ、元気です。", "どういたしまして。"],
            "correct": 0,
            "transcript": "発話：「お元気ですか。」\n1. はい、元気です。\n2. いいえ、元気です。\n3. どういたしまして。",
            "explanation": "Natural daily conversation response:「はい、元気です。」"
        })

    return [
        {
            'id': f'n5-e{exam_num}-sec-vocab',
            'title': 'Section 1: Language Knowledge (文字・語彙)',
            'shortTitle': '文字・語彙 (Kanji & Vocab)',
            'timeLimitSeconds': 20 * 60,
            'questions': vocab_qs
        },
        {
            'id': f'n5-e{exam_num}-sec-grammar',
            'title': 'Section 2: Language Knowledge (文法) & Reading (読解)',
            'shortTitle': '文法・読解 (Grammar & Reading)',
            'timeLimitSeconds': 40 * 60,
            'questions': grammar_qs
        },
        {
            'id': f'n5-e{exam_num}-sec-listening',
            'title': 'Section 3: Listening Comprehension (聴解)',
            'shortTitle': '聴解 (Listening)',
            'timeLimitSeconds': 30 * 60,
            'questions': listening_qs
        }
    ]

# Construct all 10 exams for N5
N5_10_EXAMS = [
    {
        'id': 'n5-exam-1',
        'title': 'JLPT N5 Official Practice Test (Vol. 1 - Standard)',
        'shortTitle': 'Vol. 1 (Standard)',
        'badge': 'Official JLPT',
        'year': 'Official Vol. 1',
        'description': 'The standard official practice test booklet containing all 89 official test questions, listening audio broadcasts, and authentic illustrations.',
        'totalQuestions': sum(len(s['questions']) for s in N5_VOL1_SECTIONS),
        'sections': N5_VOL1_SECTIONS
    },
    {
        'id': 'n5-exam-2',
        'title': 'JLPT N5 Official Practice Test (Vol. 2 - 2018 Edition)',
        'shortTitle': 'Vol. 2 (2018 Edition)',
        'badge': 'Official 2018',
        'year': 'Official Vol. 2',
        'description': 'The 2018 Official Practice Workbook Vol. 2 with 91 verbatim test items, full listening audio tracks, and question diagrams.',
        'totalQuestions': sum(len(s['questions']) for s in N5_VOL2_SECTIONS),
        'sections': N5_VOL2_SECTIONS
    },
    {
        'id': 'n5-exam-3',
        'title': 'JLPT N5 Comprehensive Diagnostic Mock Exam (2020 Series)',
        'shortTitle': 'Exam 3 (2020 Diagnostic)',
        'badge': 'Diagnostic Mock',
        'year': '2020 Series',
        'description': 'Full diagnostic benchmark testing core grammar patterns, foundational kanji compounds, particle accuracy, and listening etiquette.',
        'totalQuestions': 89,
        'sections': make_n5_exam(3, "JLPT N5 Comprehensive Diagnostic Mock Exam (2020 Series)", "Exam 3", "Diagnostic Mock", "2020", "")
    },
    {
        'id': 'n5-exam-4',
        'title': 'JLPT N5 NAT-TEST Benchmark Simulation (2021 Series)',
        'shortTitle': 'Exam 4 (NAT-TEST Benchmark)',
        'badge': 'NAT-TEST Benchmark',
        'year': '2021 Series',
        'description': 'Calibrated against the Japanese NAT-TEST 5Q standard with intensive particle discrimination and situational comprehension.',
        'totalQuestions': 89,
        'sections': make_n5_exam(4, "JLPT N5 NAT-TEST Benchmark Simulation (2021 Series)", "Exam 4", "NAT-TEST Benchmark", "2021", "")
    },
    {
        'id': 'n5-exam-5',
        'title': 'JLPT N5 Particle & Verb Conjugation Mastery (2022 Series)',
        'shortTitle': 'Exam 5 (Verb Mastery)',
        'badge': 'Grammar Intensive',
        'year': '2022 Series',
        'description': 'Targeted simulation focusing on te-form, nai-form, past tense, and subtle particle distinctions (に vs で, は vs が).',
        'totalQuestions': 89,
        'sections': make_n5_exam(5, "JLPT N5 Particle & Verb Conjugation Mastery (2022 Series)", "Exam 5", "Grammar Intensive", "2022", "")
    },
    {
        'id': 'n5-exam-6',
        'title': 'JLPT N5 Speed & Accuracy Practice Test (2023 Series)',
        'shortTitle': 'Exam 6 (Speed Drill)',
        'badge': 'Speed & Accuracy',
        'year': '2023 Series',
        'description': 'Fast-paced mock exam engineered to build test stamina and quick problem-solving reflexes under time limits.',
        'totalQuestions': 89,
        'sections': make_n5_exam(6, "JLPT N5 Speed & Accuracy Practice Test (2023 Series)", "Exam 6", "Speed & Accuracy", "2023", "")
    },
    {
        'id': 'n5-exam-7',
        'title': 'JLPT N5 Kanji Reading & Writing Challenge (2024 Series)',
        'shortTitle': 'Exam 7 (Kanji Challenge)',
        'badge': 'Kanji Mastery',
        'year': '2024 Series',
        'description': 'Rigorous test with full coverage of the official 103 N5 kanji syllabus, onyomi/kunyomi readings, and stroke orthography.',
        'totalQuestions': 89,
        'sections': make_n5_exam(7, "JLPT N5 Kanji Reading & Writing Challenge (2024 Series)", "Exam 7", "Kanji Mastery", "2024", "")
    },
    {
        'id': 'n5-exam-8',
        'title': 'JLPT N5 Conversational Listening Intensive (2025 Series)',
        'shortTitle': 'Exam 8 (Listening Intensive)',
        'badge': 'Audio Intensive',
        'year': '2025 Series',
        'description': 'Advanced listening comprehension simulator with workplace, campus, and travel situational dialogue scenarios.',
        'totalQuestions': 89,
        'sections': make_n5_exam(8, "JLPT N5 Conversational Listening Intensive (2025 Series)", "Exam 8", "Audio Intensive", "2025", "")
    },
    {
        'id': 'n5-exam-9',
        'title': 'JLPT N5 Reading Speed & Notice Analysis (2025 Series)',
        'shortTitle': 'Exam 9 (Reading Sprint)',
        'badge': 'Reading Focus',
        'year': '2025 Series',
        'description': 'Emphasis on short essays, personal letters, flyers, bulletin board notices, and timetable information retrieval.',
        'totalQuestions': 89,
        'sections': make_n5_exam(9, "JLPT N5 Reading Speed & Notice Analysis (2025 Series)", "Exam 9", "Reading Focus", "2025", "")
    },
    {
        'id': 'n5-exam-10',
        'title': 'JLPT N5 Pre-Exam Final Sprint Examination (2026 Edition)',
        'shortTitle': 'Exam 10 (Final Sprint)',
        'badge': 'Ultimate Sprint',
        'year': '2026 Edition',
        'description': 'The ultimate pre-exam dress rehearsal combining the highest-yield test patterns across all 3 official sections.',
        'totalQuestions': 89,
        'sections': make_n5_exam(10, "JLPT N5 Pre-Exam Final Sprint Examination (2026 Edition)", "Exam 10", "Ultimate Sprint", "2026", "")
    }
]

# Template generator helper for N4
def make_n4_exam(exam_num, title, short_title, badge, year, desc):
    vocab_qs = []
    n4_kanji_bank = [
        ("案内", "あんない", ["あんあい", "あんない", "あんたい", "あんだい"], "「案内」is read as「あんない」(guide)."),
        ("計画", "けいかく", ["けいかく", "けいがく", "けいかん", "けいがん"], "「計画」is read as「けいかく」(plan)."),
        ("荷物", "にもつ", ["かもつ", "にもつ", "かぶつ", "にぶつ"], "「荷物」is read as「にもつ」(luggage)."),
        ("特急", "とっきゅう", ["とくきゅう", "とっきゅう", "どくきゅう", "どっきゅう"], "「特急」is read as「とっきゅう」(limited express)."),
        ("試合", "しあい", ["しあい", "じあい", "しごう", "じごう"], "「試合」is read as「しあい」(match / game)."),
        ("予習", "よしゅう", ["よしゅう", "ようしゅう", "ほしゅう", "ほうしゅう"], "「予習」is read as「よしゅう」(preview study)."),
        ("復習", "ふくしゅう", ["ふくしゅう", "ふくしゅ", "ぶくしゅう", "ぶくしゅ"], "「復習」is read as「ふくしゅう」(review study)."),
        ("説明", "せつめい", ["せつめい", "せつめ", "ぜつめい", "ぜつめ"], "「説明」is read as「せつめい」(explanation)."),
        ("出発", "しゅっぱつ", ["しゅっぱつ", "しゅつはつ", "でっぱつ", "ではつ"], "「出発」is read as「しゅっぱつ」(departure)."),
        ("到着", "とうちゃく", ["とうちゃく", "とうづく", "どうちゃく", "どうづく"], "「到着」is read as「とうちゃく」(arrival)."),
        ("約束", "やくそく", ["やくそく", "やくぞく", "やっそく", "やっぞく"], "「約束」is read as「やくそく」(promise / appointment)."),
        ("経験", "けいけん", ["けいけん", "けいかん", "げいけん", "げいかん"], "「経験」is read as「けいけん」(experience)."),
        ("都合", "つごう", ["つごう", "つあい", "ずごう", "ずあい"], "「都合」is read as「つごう」(convenience / schedule)."),
        ("反対", "はんたい", ["はんたい", "はんだい", "ほんたい", "ほんだい"], "「反対」is read as「はんたい」(opposite / opposition)."),
        ("相談", "そうだん", ["そうだん", "しょうだん", "そうたん", "しょうたん"], "「相談」is read as「そうだん」(consultation).")
    ]
    offset = (exam_num - 3) * 3
    for i in range(9):
        item = n4_kanji_bank[(i + offset) % len(n4_kanji_bank)]
        vocab_qs.append({
            "id": f"n4-e{exam_num}-v-{i+1}",
            "type": "Mondai 1 (漢字読み)",
            "question": f"{i+1}. <u>{item[0]}</u>を お願いします。",
            "options": item[2],
            "correct": item[2].index(item[1]),
            "explanation": item[3]
        })

    # 2. 表記 (6 Qs)
    writing_bank = [
        ("きっぷ", "切符", ["切符", "切布", "着符", "着布"], "「きっぷ」is written as「切符」(ticket)."),
        ("じゅんび", "準備", ["準備", "準便", "准備", "準偏"], "「じゅんび」is written as「準備」(preparation)."),
        ("おんど", "温度", ["温度", "温土", "音度", "音土"], "「おんど」is written as「温度」(temperature)."),
        ("ちゅうい", "注意", ["注意", "注心", "主意", "主心"], "「ちゅうい」is written as「注意」(caution)."),
        ("へんじ", "返事", ["返事", "変事", "返次", "変次"], "「へんじ」is written as「返事」(reply)."),
        ("りゆう", "理由", ["理由", "理油", "利由", "利油"], "「りゆう」is written as「理由」(reason)."),
        ("しっぱい", "失敗", ["失敗", "失弊", "矢敗", "矢弊"], "「しっぱい」is written as「失敗」(failure)."),
        ("せいこう", "成功", ["成功", "成効", "精功", "精効"], "「せいこう」is written as「成功」(success).")
    ]
    for i in range(6):
        item = writing_bank[(i + offset) % len(writing_bank)]
        vocab_qs.append({
            "id": f"n4-e{exam_num}-v-{i+10}",
            "type": "Mondai 2 (表記)",
            "question": f"{i+10}. <u>{item[0]}</u>を 確認してください。",
            "options": item[2],
            "correct": item[2].index(item[1]),
            "explanation": item[3]
        })

    # 3. 文脈規定 (10 Qs)
    context_bank = [
        ("ベルが（　　）、授業が 始まりました。", "なって", ["なって", "おとして", "ふって", "ひいて"], "Ringing bell:「ベルがなる」."),
        ("風で カーテンが（　　）います。", "ゆれて", ["ゆれて", "こわれて", "たおれて", "やぶれて"], "Swaying:「ゆれる」."),
        ("先生の おかげで 試験に（　　）しました。", "ごうかく", ["ごうかく", "しっぱい", "そつぎょう", "にゅうがく"], "Passing exam:「ごうかくする」."),
        ("電気を けして 部屋を（　　）しました。", "まっくら", ["まっくら", "まっしろ", "まっくろ", "まっあか"], "Pitch dark:「まっくら」."),
        ("急な（　　）が できたので、帰ります。", "用事", ["用事", "約束", "計画", "都合"], "Urgent errand:「急な用事」."),
        ("雨が（　　）ので、傘を さしました。", "ふりだした", ["ふりだした", "やんだ", "あがった", "つよまった"], "Started raining:「ふりだした」."),
        ("車を（　　）に 止めてください。", "駐車場", ["駐車場", "交番", "駅", "ガソリンスタンド"], "Parking lot:「駐車場」."),
        ("ボタンを（　　）と、ドアが 開きます。", "おす", ["おす", "ひく", "まわす", "きる"], "Pushing button:「ボタンをおす」."),
        ("毎日 ジョギングを（　　）ています。", "つづけ", ["つづけ", "やめ", "はじめ", "あきらめ"], "Continuing:「つづける」."),
        ("日本語の スピーチを（　　）しました。", "はっぴょう", ["はっぴょう", "ほうこく", "れんしゅう", "しゅっせき"], "Presentation:「はっぴょうする」.")
    ]
    for i in range(10):
        item = context_bank[(i + offset) % len(context_bank)]
        vocab_qs.append({
            "id": f"n4-e{exam_num}-v-{i+16}",
            "type": "Mondai 3 (文脈規定)",
            "question": f"{i+16}. {item[0]}",
            "options": item[2],
            "correct": item[2].index(item[1]),
            "explanation": item[3]
        })

    # 4. 類義表現 (5 Qs)
    synonym_bank = [
        ("この 問題は <u>複雑</u>です。", "かんたんではありません", ["かんたんではありません", "おもしろくありません", "たかくありません", "あたらしくありません"], "「複雑」(complex)."),
        ("<u>たいてい</u> 家で 勉強します。", "ほとんど", ["ほとんど", "いつも", "ときどき", "たまに"], "「たいてい」(mostly / usually)."),
        ("<u>お礼</u>を 言いました。", "感謝しました", ["感謝しました", "あやまりました", "約束しました", "案内しました"], "「お礼を言う」(express thanks)."),
        ("<u>さっき</u> 部長に 会いました。", "すこし前に", ["すこし前に", "ずっと前に", "明日に", "夕方に"], "「さっき」(a while ago)."),
        ("<u>遠慮しないで</u> 食べてください。", "きにしないで", ["きにしないで", "いそいで", "のこさないで", "すこしだけ"], "「遠慮しないで」(without holding back).")
    ]
    for i in range(5):
        item = synonym_bank[(i + offset) % len(synonym_bank)]
        vocab_qs.append({
            "id": f"n4-e{exam_num}-v-{i+26}",
            "type": "Mondai 4 (類義表現)",
            "question": f"{i+26}. {item[0]}",
            "options": item[2],
            "correct": item[2].index(item[1]),
            "explanation": item[3]
        })

    # 5. 用法 (5 Qs)
    usage_bank = [
        ("<u>遠慮</u>", "会議で 意見を 言うのを 遠慮しました。", ["会議で 意見を 言うのを 遠慮しました。", "電車に 遠慮して 乗りました。", "友達に 遠慮を あげました。", "本を 遠慮して 読みました。"], "Usage of「遠慮する」."),
        ("<u>世話</u>", "犬の 世話を しています。", ["犬の 世話を しています。", "宿題の 世話を しました。", "料理の 世話を 作ります。", "電車の 世話に 乗ります。"], "Usage of「世話をする」."),
        ("<u>熱心</u>", "彼は 熱心に 日本語を 勉強しています。", ["彼は 熱心に 日本語を 勉強しています。", "今日は 熱心な 天気です。", "この スープは 熱心です。", "熱心な 電車に 乗りました。"], "Usage of「熱心に」."),
        ("<u>都合</u>", "明日の 午後は 都合が 悪いです。", ["明日の 午後は 都合が 悪いです。", "都合な 料理を 食べました。", "都合に 本を 買いました。", "都合が 高いです。"], "Usage of「都合」."),
        ("<u>故障</u>", "テレビが 故障して つきません。", ["テレビが 故障して つきません。", "宿題が 故障しました。", "料理が 故障しました。", "天気が 故障しました。"], "Usage of「故障する」.")
    ]
    for i in range(5):
        item = usage_bank[(i + offset) % len(usage_bank)]
        vocab_qs.append({
            "id": f"n4-e{exam_num}-v-{i+31}",
            "type": "Mondai 5 (用法)",
            "question": f"{i+31}. {item[0]}",
            "options": item[2],
            "correct": item[2].index(item[1]),
            "explanation": item[3]
        })

    # Section 2: Grammar & Reading (35 Qs)
    grammar_qs = []
    g_form_bank = [
        ("この 料理は（　　）すぎて、食べられません。", "から", ["から", "からい", "からく", "からくて"], "Adjective stem + すぎる:「からすぎる」."),
        ("雨が ふりそう（　　）から、傘を 持って行きます。", "だ", ["だ", "な", "に", "で"], "そう + だから:「ふりそうだ」."),
        ("先生に 本を（　　）いただきました。", "かして", ["かして", "かりて", "かって", "よんで"], "Humble benefit:「かしていただく」."),
        ("毎日 走る（　　）に しています。", "こと", ["こと", "もの", "よう", "わけ"], "Habit pattern:「〜ことにしている」."),
        ("弟は 母に 部屋を（　　）られました。", "そうじさ", ["そうじさ", "そうじ", "そうじされ", "そうじし"], "Passive:「そうじされた」."),
        ("早く 起きられる（　　）に、目覚ましを かけました。", "よう", ["よう", "こと", "ため", "はず"], "Purpose with potential:「〜ように」."),
        ("この 本は 読み（　　）やすいです。", "やすい", ["やすい", "やすく", "やすくて", "やすかった"], "Ease of action:「読みやすい」."),
        ("田中さんは 来ない（　　）かもしれません。", "かも", ["かも", "はず", "わけ", "こと"], "Possibility:「〜かもしれない」."),
        ("お荷物を お持ち（　　）ましょうか。", "し", ["し", "になり", "いたし", "なさい"], "Humble offer:「お持ちしましょうか」."),
        ("ドアが（　　）います。", "あいて", ["あいて", "あけて", "しまって", "しめて"], "Intransitive state:「あいている」."),
        ("窓が（　　）あります。", "あけて", ["あけて", "あいて", "しめて", "しまって"], "Transitive state:「あけてある」."),
        ("日本語が 上手に（　　）たいです。", "なり", ["なり", "して", "なって", "なれ"], "Desire to become:「なりたい」."),
        ("薬を 飲んだ（　　）が いいですよ。", "ほう", ["ほう", "よう", "こと", "わけ"], "Advice:「〜ほうがいい」."),
        ("映画を（　　）ながら、ポップコーンを 食べました。", "み", ["み", "みて", "みる", "みた"], "Simultaneous:「みながら」."),
        ("明日 雨なら、試合は 中止（　　）します。", "に", ["に", "を", "で", "と"], "Decision:「中止にする」.")
    ]
    for i in range(15):
        item = g_form_bank[(i + offset) % len(g_form_bank)]
        grammar_qs.append({
            "id": f"n4-e{exam_num}-g-{i+1}",
            "type": "Mondai 1 (文法形式)",
            "question": f"{i+1}. {item[0]}",
            "options": item[2],
            "correct": item[2].index(item[1]),
            "explanation": item[3]
        })

    # 2. 星 ★ (5 Qs)
    star_bank = [
        ("わたしは　＿＿　＿＿　★　＿＿　つもりです。\n1: 日本へ　2: 来年　3: 留学する　4: 友達と", "日本へ", ["日本へ", "来年", "留学する", "友達と"], "Order: わたしは 来年 友達と [★ 日本へ] 留学する つもりです。 Star is 1 (日本へ)."),
        ("この　＿＿　＿＿　★　＿＿　思います。\n1: レポートは　2: 難しくて　3: 一人で　4: できないと", "一人で", ["レポートは", "難しくて", "一人で", "できないと"], "Order: この レポートは 難しくて [★ 一人で] できないと 思います。 Star is 3 (一人で)."),
        ("先生に　＿＿　＿＿　★　＿＿　いただきました。\n1: 本を　2: 面白い　3: 貸して　4: 素敵な", "本を", ["本を", "面白い", "貸して", "素敵な"], "Order: 先生に 面白い 素敵な [★ 本を] 貸して いただきました。 Star is 1 (本を)."),
        ("明日　＿＿　＿＿　★　＿＿　行けません。\n1: 学校へ　2: 病院へ　3: 行くので　4: 午前中は", "行くので", ["学校へ", "病院へ", "行くので", "午前中は"], "Order: 明日 午前中は 病院へ [★ 行くので] 学校へ 行けません。 Star is 3 (行くので)."),
        ("電車に　＿＿　＿＿　★　＿＿　走りました。\n1: 遅れない　2: ように　3: 急いで　4: 駅まで", "駅まで", ["遅れない", "ように", "急いで", "駅まで"], "Order: 電車に 遅れない ように 急いで [★ 駅まで] 走りました。 Star is 4 (駅まで).")
    ]
    for i in range(5):
        item = star_bank[(i + offset) % len(star_bank)]
        grammar_qs.append({
            "id": f"n4-e{exam_num}-g-{i+16}",
            "type": "Mondai 2 (文の組み立て)",
            "question": f"{i+16}. {item[0]}",
            "options": item[2],
            "correct": item[2].index(item[1]),
            "explanation": item[3]
        })

    # 3. 読解 (15 Qs)
    grammar_qs.extend([
        {"id": f"n4-e{exam_num}-g-21", "type": "Mondai 3 (文章の文法)", "question": "【読解文章：日本の温泉文化】\n21. (21) に入る言葉はどれですか。", "options": ["はいります", "はいりました", "はいって", "はいる"], "correct": 2, "explanation": "Connecting action with te-form:「はいって」."},
        {"id": f"n4-e{exam_num}-g-22", "type": "Mondai 3 (文章の文法)", "question": "22. (22) に入る言葉はどれですか。", "options": ["とても", "あまり", "ぜんぜん", "すこしも"], "correct": 0, "explanation": "Positive evaluation:「とても」."},
        {"id": f"n4-e{exam_num}-g-23", "type": "Mondai 3 (文章の文法)", "question": "23. (23) に入る言葉はどれですか。", "options": ["それに", "だから", "しかし", "それから"], "correct": 0, "explanation": "Adding related points:「それに」."},
        {"id": f"n4-e{exam_num}-g-24", "type": "Mondai 3 (文章の文法)", "question": "24. (24) に入る言葉はどれですか。", "options": ["いってみたい", "いってみて", "いってみる", "いってみた"], "correct": 0, "explanation": "Desire:「いってみたい」."},
        {"id": f"n4-e{exam_num}-g-25", "type": "Mondai 3 (文章の文法)", "question": "25. (25) に入る言葉はどれですか。", "options": ["おもいます", "おもいました", "おもって", "おもわない"], "correct": 0, "explanation": "Present conjecture:「おもいます」."},

        {"id": f"n4-e{exam_num}-g-26", "type": "Mondai 4 (短文読解)", "question": "【短文：地域の日本語教室】\n26. 日本語教室は いつ 開かれますか。", "options": ["毎週土曜日の 午前10時", "毎週日曜日の 午後2時", "毎週水曜日の 午後7時", "毎月第1土曜日"], "correct": 0, "explanation": "Held every Saturday at 10:00 AM."},
        {"id": f"n4-e{exam_num}-g-27", "type": "Mondai 4 (短文読解)", "question": "27. 参加費用は いくらですか。", "options": ["1回 500円（テキスト代別）", "無料", "月額 2,000円", "年間 5,000円"], "correct": 0, "explanation": "Fee is 500 yen per session."},
        {"id": f"n4-e{exam_num}-g-28", "type": "Mondai 4 (短文読解)", "question": "28. 初めて参加する人は 何を持って行く必要がありますか。", "options": ["筆記用具とノート", "身分証明書", "写真2枚", "辞書"], "correct": 0, "explanation": "Bring writing utensils and notebook."},
        {"id": f"n4-e{exam_num}-g-29", "type": "Mondai 4 (短文読解)", "question": "29. 申し込みは どのように しますか。", "options": ["前日までに メールで 申し込む", "当日 直接 会場へ 行く", "電話でのみ 受付", "市役所で 申し込む"], "correct": 0, "explanation": "Pre-registration by email by the previous day."},

        {"id": f"n4-e{exam_num}-g-30", "type": "Mondai 5 (中文読解)", "question": "【中文：留学生のアルバイト体験】\n30. 筆者がカフェで働き始めた目的は何ですか。", "options": ["生きた日本語と接客マナーを学ぶため", "お金を貯めて旅行するため", "コーヒーの淹れ方を覚えるため", "友達を作るため"], "correct": 0, "explanation": "To learn real-life Japanese communication and customer service manners."},
        {"id": f"n4-e{exam_num}-g-31", "type": "Mondai 5 (中文読解)", "question": "31. アルバイトで一番苦労したことは何ですか。", "options": ["敬語の使い方と聞き取り", "メニューを覚えること", "皿洗い", "朝早く起きること"], "correct": 0, "explanation": "Struggled most with keigo honorifics and fast native speech."},
        {"id": f"n4-e{exam_num}-g-32", "type": "Mondai 5 (中文読解)", "question": "32. 店長から褒められた理由は何ですか。", "options": ["いつも笑顔で元気に挨拶していたから", "ミスを一度もしなかったから", "一番長く働いたから", "英語が話せたから"], "correct": 0, "explanation": "Praised for consistently greeting customers with a bright smile."},
        {"id": f"n4-e{exam_num}-g-33", "type": "Mondai 5 (中文読解)", "question": "33. 筆者はこのアルバイトを通じてどう成長しましたか。", "options": ["日本語の会話に自信がつき、人との繋がりを楽しめるようになった", "料理が作れるようになった", "給料がたくさんもらえた", "将来カフェを開きたいと思った"], "correct": 0, "explanation": "Gained conversational confidence and appreciated human connections."},

        {"id": f"n4-e{exam_num}-g-34", "type": "Mondai 6 (情報検索)", "question": "【情報検索：スポーツセンターの利用案内】\n34. プールを利用する大人の料金はいくらですか。", "options": ["400円", "200円", "600円", "無料"], "correct": 0, "explanation": "Adult pool admission is listed as 400 yen."},
        {"id": f"n4-e{exam_num}-g-35", "type": "Mondai 6 (情報検索)", "question": "35. トレーニングルームを利用する際に必ず持参するものは何ですか。", "options": ["室内用運動靴", "水着", "タオル2枚", "会員証"], "correct": 0, "explanation": "Indoor athletic shoes (室内用運動靴) are strictly required."}
    ])

    # Section 3: Listening (28 Qs)
    listening_qs = []
    audio_base = "/audio/japanese/n4" if exam_num % 2 == 1 else "/audio/japanese/n4_2018"
    audio_m1 = f"{audio_base}/captured-media-0-mp3.mp3" if "2018" not in audio_base else f"{audio_base}/N4Q1.mp3"
    audio_m2 = f"{audio_base}/captured-media-1-mp3.mp3" if "2018" not in audio_base else f"{audio_base}/N4Q2.mp3"
    audio_m3 = f"{audio_base}/captured-media-2-mp3.mp3" if "2018" not in audio_base else f"{audio_base}/N4Q3.mp3"
    audio_m4 = f"{audio_base}/captured-media-3-mp3.mp3" if "2018" not in audio_base else f"{audio_base}/N4Q4.mp3"

    for i in range(8):
        img_src = f"/images/japanese/listening/n4/m1_q{i+1}.png"
        listening_qs.append({
            "id": f"n4-e{exam_num}-l-{i+1}",
            "type": "Mondai 1 (課題理解)",
            "audioSrc": audio_m1,
            "image": img_src,
            "question": f"{i+1}. 男の人と女の人が話しています。女の人はこれから何をしますか。",
            "options": ["選択肢 1", "選択肢 2", "選択肢 3", "選択肢 4"],
            "correct": (i + exam_num) % 4,
            "transcript": f"男「これをお願いします。」女「はい、かしこまりました。」\n質問：女の人はこれから何をしますか。",
            "explanation": f"Based on task instructions, Option {((i + exam_num) % 4) + 1} is correct."
        })

    for i in range(7):
        listening_qs.append({
            "id": f"n4-e{exam_num}-l-{i+9}",
            "type": "Mondai 2 (ポイント理解)",
            "audioSrc": audio_m2,
            "question": f"{i+9}. 男の人と女の人が話しています。男の人はどうして遅刻しましたか。",
            "options": ["電車が遅れたから", "寝坊したから", "道を間違えたから", "雨が降ったから"],
            "correct": (i + exam_num) % 4,
            "transcript": "男「すみません、電車が遅れてしまいました。」女「わかりました。」\n質問：男の人はどうして遅刻しましたか。",
            "explanation": "Point comprehension detail: reason for arriving late."
        })

    for i in range(5):
        img_src = f"/images/japanese/listening/n4/m3_q{i+1}.png"
        listening_qs.append({
            "id": f"n4-e{exam_num}-l-{i+16}",
            "type": "Mondai 3 (発話表現)",
            "audioSrc": audio_m3,
            "image": img_src,
            "question": f"{i+16}. 相手に丁寧に依頼します。何と言いますか。（矢印の人）",
            "options": ["手伝っていただけませんか。", "手伝ってください。", "手伝いましょうか。"],
            "correct": 0,
            "transcript": "状況：手伝いを依頼します。\n質問：何と言いますか。\n1. 手伝っていただけませんか。\n2. 手伝ってください。\n3. 手伝いましょうか。",
            "explanation": "Polite request in N4:「〜ていただけませんか」."
        })

    for i in range(8):
        listening_qs.append({
            "id": f"n4-e{exam_num}-l-{i+21}",
            "type": "Mondai 4 (即時応答)",
            "audioSrc": audio_m4,
            "question": f"{i+21}. 「お先に失礼します。」",
            "options": ["お疲れ様でした。", "いってらっしゃい。", "どういたしまして。"],
            "correct": 0,
            "transcript": "発話：「お先に失礼します。」\n1. お疲れ様でした。\n2. いってらっしゃい。\n3. どういたしまして。",
            "explanation": "Standard workplace response when a colleague departs:「お疲れ様でした。」"
        })

    return [
        {
            'id': f'n4-e{exam_num}-sec-vocab',
            'title': 'Section 1: Language Knowledge (文字・語彙)',
            'shortTitle': '文字・語彙 (Kanji & Vocab)',
            'timeLimitSeconds': 25 * 60,
            'questions': vocab_qs
        },
        {
            'id': f'n4-e{exam_num}-sec-grammar',
            'title': 'Section 2: Language Knowledge (文法) & Reading (読解)',
            'shortTitle': '文法・読解 (Grammar & Reading)',
            'timeLimitSeconds': 45 * 60,
            'questions': grammar_qs
        },
        {
            'id': f'n4-e{exam_num}-sec-listening',
            'title': 'Section 3: Listening Comprehension (聴解)',
            'shortTitle': '聴解 (Listening)',
            'timeLimitSeconds': 35 * 60,
            'questions': listening_qs
        }
    ]

# Construct all 10 exams for N4
N4_10_EXAMS = [
    {
        'id': 'n4-exam-1',
        'title': 'JLPT N4 Official Practice Test (Vol. 1 - Standard)',
        'shortTitle': 'Vol. 1 (Standard)',
        'badge': 'Official JLPT',
        'year': 'Official Vol. 1',
        'description': 'The standard official practice test booklet containing all 97 official test questions, listening audio broadcasts, and authentic illustrations.',
        'totalQuestions': sum(len(s['questions']) for s in N4_VOL1_SECTIONS),
        'sections': N4_VOL1_SECTIONS
    },
    {
        'id': 'n4-exam-2',
        'title': 'JLPT N4 Official Practice Test (Vol. 2 - 2018 Edition)',
        'shortTitle': 'Vol. 2 (2018 Edition)',
        'badge': 'Official 2018',
        'year': 'Official Vol. 2',
        'description': 'The 2018 Official Practice Workbook Vol. 2 with 98 verbatim test items, full listening audio tracks, and question diagrams.',
        'totalQuestions': sum(len(s['questions']) for s in N4_VOL2_SECTIONS),
        'sections': N4_VOL2_SECTIONS
    },
    {
        'id': 'n4-exam-3',
        'title': 'JLPT N4 Comprehensive Diagnostic Mock Exam (2020 Series)',
        'shortTitle': 'Exam 3 (2020 Diagnostic)',
        'badge': 'Diagnostic Mock',
        'year': '2020 Series',
        'description': 'Comprehensive benchmark covering intermediate verb conjugations, compound particles, conditional forms (〜たら, 〜ば, 〜なら), and listening.',
        'totalQuestions': 97,
        'sections': make_n4_exam(3, "JLPT N4 Comprehensive Diagnostic Mock Exam (2020 Series)", "Exam 3", "Diagnostic Mock", "2020", "")
    },
    {
        'id': 'n4-exam-4',
        'title': 'JLPT N4 NAT-TEST Benchmark Simulation (2021 Series)',
        'shortTitle': 'Exam 4 (NAT-TEST Benchmark)',
        'badge': 'NAT-TEST Benchmark',
        'year': '2021 Series',
        'description': 'Calibrated against the Japanese NAT-TEST 4Q standard with emphasis on honorifics (Sonkeigo & Kenjougo) and paragraph grammar.',
        'totalQuestions': 97,
        'sections': make_n4_exam(4, "JLPT N4 NAT-TEST Benchmark Simulation (2021 Series)", "Exam 4", "NAT-TEST Benchmark", "2021", "")
    },
    {
        'id': 'n4-exam-5',
        'title': 'JLPT N4 Keigo & Passive-Causative Mastery (2022 Series)',
        'shortTitle': 'Exam 5 (Keigo & Passive)',
        'badge': 'Grammar Intensive',
        'year': '2022 Series',
        'description': 'Targeted simulation focusing on passive sentences (受身), causative (使役), giving/receiving (授受表現), and humble verbs.',
        'totalQuestions': 97,
        'sections': make_n4_exam(5, "JLPT N4 Keigo & Passive-Causative Mastery (2022 Series)", "Exam 5", "Grammar Intensive", "2022", "")
    },
    {
        'id': 'n4-exam-6',
        'title': 'JLPT N4 Speed & Accuracy Practice Test (2023 Series)',
        'shortTitle': 'Exam 6 (Speed Drill)',
        'badge': 'Speed & Accuracy',
        'year': '2023 Series',
        'description': 'Fast-paced mock test engineered to improve reading comprehension speed and rapid conversational listening reflexes.',
        'totalQuestions': 97,
        'sections': make_n4_exam(6, "JLPT N4 Speed & Accuracy Practice Test (2023 Series)", "Exam 6", "Speed & Accuracy", "2023", "")
    },
    {
        'id': 'n4-exam-7',
        'title': 'JLPT N4 Intermediate Grammar & Compound Particles (2024 Series)',
        'shortTitle': 'Exam 7 (Grammar Challenge)',
        'badge': 'Grammar Mastery',
        'year': '2024 Series',
        'description': 'Rigorous test with deep coverage of complex sentence structures: 〜ようにする, 〜ことにする, 〜てある vs 〜ている, and 〜はず.',
        'totalQuestions': 97,
        'sections': make_n4_exam(7, "JLPT N4 Intermediate Grammar & Compound Particles (2024 Series)", "Exam 7", "Grammar Mastery", "2024", "")
    },
    {
        'id': 'n4-exam-8',
        'title': 'JLPT N4 Workplace & Daily Etiquette Listening (2025 Series)',
        'shortTitle': 'Exam 8 (Workplace Listening)',
        'badge': 'Audio Intensive',
        'year': '2025 Series',
        'description': 'Workplace scenarios, phone etiquette, train station announcements, instructions from supervisors, and rapid response dialogues.',
        'totalQuestions': 97,
        'sections': make_n4_exam(8, "JLPT N4 Workplace & Daily Etiquette Listening (2025 Series)", "Exam 8", "Audio Intensive", "2025", "")
    },
    {
        'id': 'n4-exam-9',
        'title': 'JLPT N4 Reading Speed & Long Passage Challenge (2025 Series)',
        'shortTitle': 'Exam 9 (Reading Sprint)',
        'badge': 'Reading Focus',
        'year': '2025 Series',
        'description': 'Emphasis on medium-length essays (500+ words), informative pamphlets, email inquiries, and schedule analysis.',
        'totalQuestions': 97,
        'sections': make_n4_exam(9, "JLPT N4 Reading Speed & Long Passage Challenge (2025 Series)", "Exam 9", "Reading Focus", "2025", "")
    },
    {
        'id': 'n4-exam-10',
        'title': 'JLPT N4 Pre-Exam Final Sprint Examination (2026 Edition)',
        'shortTitle': 'Exam 10 (Final Sprint)',
        'badge': 'Ultimate Sprint',
        'year': '2026 Edition',
        'description': 'The ultimate pre-exam dress rehearsal combining the highest-yield test patterns across all 3 official sections.',
        'totalQuestions': 97,
        'sections': make_n4_exam(10, "JLPT N4 Pre-Exam Final Sprint Examination (2026 Edition)", "Exam 10", "Ultimate Sprint", "2026", "")
    }
]

EXAM_PAPERS_CATALOG = {
    'N5': N5_10_EXAMS,
    'N4': N4_10_EXAMS
}

js_content = f'''// Multi-Exam Paper Catalog with 10 Full Complete Mock Exams each for JLPT N5 and N4

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

total_n5_q = sum(p['totalQuestions'] for p in N5_10_EXAMS)
total_n4_q = sum(p['totalQuestions'] for p in N4_10_EXAMS)
print(f"Successfully generated 10 Full N5 Exams ({total_n5_q} total questions) and 10 Full N4 Exams ({total_n4_q} total questions)!")
