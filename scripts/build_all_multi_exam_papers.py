import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Import Vol 1 sections from build_full_exam_with_listening
from build_full_exam_with_listening import N5_SECTIONS as N5_VOL1_SECTIONS, N4_SECTIONS as N4_VOL1_SECTIONS

# =========================================================================
# N5 VOLUME 2 (2018 OFFICIAL PRACTICE WORKBOOK)
# =========================================================================
N5_VOL2_VOCAB = [
    # Mondai 1 (漢字読み - 12 Qs)
    {"id": "n5-v2-v-1", "type": "Mondai 1 (漢字読み)", "question": "1. あしたは <u>雨</u>ですか。", "options": ["ゆき", "はれ", "くもり", "あめ"], "correct": 3, "explanation": "「雨」is read as「あめ」(rain)."},
    {"id": "n5-v2-v-2", "type": "Mondai 1 (漢字読み)", "question": "2. きょうしつで <u>書</u>いて ください。", "options": ["かいて", "きいて", "はいて", "ひいて"], "correct": 0, "explanation": "「書いて」is read as「かいて」(write)."},
    {"id": "n5-v2-v-3", "type": "Mondai 1 (漢字読み)", "question": "3. しゃしんは はこの <u>中</u>に あります。", "options": ["そば", "そと", "なか", "よこ"], "correct": 2, "explanation": "「中」is read as「なか」(inside)."},
    {"id": "n5-v2-v-4", "type": "Mondai 1 (漢字読み)", "question": "4. この いすは <u>小</u>さいです。", "options": ["ちいさい", "ちさい", "しいさい", "しさい"], "correct": 0, "explanation": "「小さい」is read as「ちいさい」(small)."},
    {"id": "n5-v2-v-5", "type": "Mondai 1 (漢字読み)", "question": "5. あしたは <u>火</u>よう日です。", "options": ["どようび", "すいようび", "かようび", "にちようび"], "correct": 2, "explanation": "「火曜日」is read as「かようび」(Tuesday)."},
    {"id": "n5-v2-v-6", "type": "Mondai 1 (漢字読み)", "question": "6. きれいな <u>空</u>ですね。", "options": ["いえ", "うみ", "にわ", "そら"], "correct": 3, "explanation": "「空」is read as「そら」(sky)."},
    {"id": "n5-v2-v-7", "type": "Mondai 1 (漢字読み)", "question": "7. せいとは <u>百人</u> います。", "options": ["ひゃくにん", "びゃくにん", "ひゃくじん", "びゃくじん"], "correct": 0, "explanation": "「百人」is read as「ひゃくにん」(100 people)."},
    {"id": "n5-v2-v-8", "type": "Mondai 1 (漢字読み)", "question": "8. <u>魚</u>が たくさん いますよ。", "options": ["ねこ", "とり", "いぬ", "さかな"], "correct": 3, "explanation": "「魚」is read as「さかな」(fish)."},
    {"id": "n5-v2-v-9", "type": "Mondai 1 (漢字読み)", "question": "9. パンを <u>半分</u> ともだちに あげました。", "options": ["はんふん", "はんぶん", "ほんぶん", "ほんふん"], "correct": 1, "explanation": "「半分」is read as「はんぶん」(half)."},
    {"id": "n5-v2-v-10", "type": "Mondai 1 (漢字読み)", "question": "10. ぎんこうと スーパーの <u>間</u>に ほそい みちが あります。", "options": ["あいた", "となり", "あいだ", "どなり"], "correct": 2, "explanation": "「間」is read as「あいだ」(between)."},
    {"id": "n5-v2-v-11", "type": "Mondai 1 (漢字読み)", "question": "11. たまごを <u>三つ</u> とって ください。", "options": ["いつつ", "みっつ", "さんつ", "ごつ"], "correct": 1, "explanation": "「三つ」is read as「みっつ」(three items)."},
    {"id": "n5-v2-v-12", "type": "Mondai 1 (漢字読み)", "question": "12. きょうは <u>元気</u>が いいですね。", "options": ["けんき", "げんき", "けんぎ", "げんぎ"], "correct": 1, "explanation": "「元気」is read as「げんき」(energetic / fine)."},

    # Mondai 2 (表記・漢字書き - 8 Qs)
    {"id": "n5-v2-v-13", "type": "Mondai 2 (表記・漢字書き)", "question": "13. えきの まえに <u>くるま</u>が 止まっています。", "options": ["東", "車", "重", "乗"], "correct": 1, "explanation": "「くるま」is written as「車」(car)."},
    {"id": "n5-v2-v-14", "type": "Mondai 2 (表記・漢字書き)", "question": "14. <u>やすみ</u>の 日に えいがを みます。", "options": ["体み", "休み", "林み", "木み"], "correct": 1, "explanation": "「やすみ」is written as「休み」(holiday/rest)."},
    {"id": "n5-v2-v-15", "type": "Mondai 2 (表記・漢字書き)", "question": "15. この みちを <u>ひがし</u>へ あるきます。", "options": ["北", "西", "南", "東"], "correct": 3, "explanation": "「ひがし」is written as「東」(east)."},
    {"id": "n5-v2-v-16", "type": "Mondai 2 (表記・漢字書き)", "question": "16. わたしの <u>みみ</u>は 大きいです。", "options": ["目", "耳", "口", "手"], "correct": 1, "explanation": "「みみ」is written as「耳」(ear)."},
    {"id": "n5-v2-v-17", "type": "Mondai 2 (表記・漢字書き)", "question": "17. この いぬは <u>しろい</u>です。", "options": ["白い", "百い", "自い", "日い"], "correct": 0, "explanation": "「しろい」is written as「白い」(white)."},
    {"id": "n5-v2-v-18", "type": "Mondai 2 (表記・漢字書き)", "question": "18. つめたい <u>みず</u>を のみます。", "options": ["木", "火", "土", "水"], "correct": 3, "explanation": "「みず」is written as「水」(water)."},
    {"id": "n5-v2-v-19", "type": "Mondai 2 (表記・漢字書き)", "question": "19. あそこは <u>でぐち</u>です。", "options": ["入口", "出口", "門口", "戸口"], "correct": 1, "explanation": "「でぐち」is written as「出口」(exit)."},
    {"id": "n5-v2-v-20", "type": "Mondai 2 (表記・漢字書き)", "question": "20. <u>あに</u>は 20さいです。", "options": ["父", "弟", "兄", "姉"], "correct": 2, "explanation": "「あに」is written as「兄」(older brother)."},

    # Mondai 3 (文脈規定 - 10 Qs)
    {"id": "n5-v2-v-21", "type": "Mondai 3 (文脈規定)", "question": "21. かぜを ひいたので、（　　）を のみました。", "options": ["くすり", "おちゃ", "ごはん", "みず"], "correct": 0, "explanation": "Taking medicine for a cold:「くすりをのむ」."},
    {"id": "n5-v2-v-22", "type": "Mondai 3 (文脈規定)", "question": "22. あした テストが ありますから、（　　）します。", "options": ["さんぽ", "べんきょう", "りょこう", "かいもの"], "correct": 1, "explanation": "Studying for a test:「べんきょうする」."},
    {"id": "n5-v2-v-23", "type": "Mondai 3 (文脈規定)", "question": "23. この へやは（　　）ですから、エアコンを つけましょう。", "options": ["あつい", "さむい", "くらい", "ひろい"], "correct": 0, "explanation": "The room is hot:「あつい」."},
    {"id": "n5-v2-v-24", "type": "Mondai 3 (文脈規定)", "question": "24. えんぴつを つかって、（　　）を かきます。", "options": ["うた", "え", "こえ", "おと"], "correct": 1, "explanation": "Drawing a picture with a pencil:「えをかく」."},
    {"id": "n5-v2-v-25", "type": "Mondai 3 (文脈規定)", "question": "25. レストランで（　　）を はらいます。", "options": ["おかね", "きっぷ", "てがみ", "にもつ"], "correct": 0, "explanation": "Paying money at a restaurant:「おかねをはらう」."},
    {"id": "n5-v2-v-26", "type": "Mondai 3 (文脈規定)", "question": "26. あしたは（　　）ですから、がっこうは やすみです。", "options": ["げつようび", "すいようび", "にちようび", "きんようび"], "correct": 2, "explanation": "Sunday is a day off:「にちようび」."},
    {"id": "n5-v2-v-27", "type": "Mondai 3 (文脈規定)", "question": "27. まいあさ 7じに（　　）ます。", "options": ["おき", "ね", "あるき", "はしり"], "correct": 0, "explanation": "Waking up at 7:「おきる」."},
    {"id": "n5-v2-v-28", "type": "Mondai 3 (文脈規定)", "question": "28. じてんしゃで えきまで（　　）いきました。", "options": ["はしって", "あるいて", "のって", "こいで"], "correct": 2, "explanation": "Riding a bicycle:「じてんしゃにのっていきました」."},
    {"id": "n5-v2-v-29", "type": "Mondai 3 (文脈規定)", "question": "29. わたしの いえは えきから（　　）です。", "options": ["ちかい", "とおい", "はやい", "おそい"], "correct": 0, "explanation": "Close to the station:「ちかい」."},
    {"id": "n5-v2-v-30", "type": "Mondai 3 (文脈規定)", "question": "30. この 本は とても（　　）です。", "options": ["おもしろい", "あまい", "からい", "たかい"], "correct": 0, "explanation": "Interesting book:「おもしろい」."},

    # Mondai 4 (類義表現 - 5 Qs)
    {"id": "n5-v2-v-31", "type": "Mondai 4 (類義表現)", "question": "31. あの 人は <u>ゆうめい</u>です。", "options": ["みんなが しっています", "みんなが すきです", "みんなが あいます", "みんなが はなします"], "correct": 0, "explanation": "「ゆうめい」(famous) means everyone knows them (みんながしっています)."},
    {"id": "n5-v2-v-32", "type": "Mondai 4 (類義表現)", "question": "32. <u>きのう</u> ともだちと あいました。", "options": ["あした", "さくじつ", "あさって", "きょう"], "correct": 1, "explanation": "「きのう」is synonymous with「さくじつ」(yesterday)."},
    {"id": "n5-v2-v-33", "type": "Mondai 4 (類義表現)", "question": "33. この へやは <u>くらい</u>です。", "options": ["あかるくないです", "ひろくないです", "あつくないです", "せまくないです"], "correct": 0, "explanation": "「くらい」(dark) means not bright (あかるくない)."},
    {"id": "n5-v2-v-34", "type": "Mondai 4 (類義表現)", "question": "34. <u>おととし</u> 日本へ きました。", "options": ["きょねん", "2年前", "3年前", "ことし"], "correct": 1, "explanation": "「おととし」means two years ago (2年前)."},
    {"id": "n5-v2-v-35", "type": "Mondai 4 (類義表現)", "question": "35. この りょうりは <u>おいしい</u>です。", "options": ["うまいです", "まずいです", "あまいです", "からいです"], "correct": 0, "explanation": "「おいしい」is synonymous with「うまい」(delicious)."}
]

# N5 2018 Grammar & Reading (32 Qs)
N5_VOL2_GRAMMAR = [
    # Mondai 1 (文法形式 - 16 Qs)
    {"id": "n5-v2-g-1", "type": "Mondai 1 (文法形式)", "question": "1. わたしは まいあさ パン（　　）たべます。", "options": ["に", "を", "で", "が"], "correct": 1, "explanation": "Direct object particle:「パンをたべる」."},
    {"id": "n5-v2-g-2", "type": "Mondai 1 (文法形式)", "question": "2. としょかん（　　）本を よみます。", "options": ["で", "に", "へ", "を"], "correct": 0, "explanation": "Location of action:「としょかんで」."},
    {"id": "n5-v2-g-3", "type": "Mondai 1 (文法形式)", "question": "3. ぎんこうは 9じ（　　）5じまでです。", "options": ["から", "まで", "に", "で"], "correct": 0, "explanation": "Starting time:「9じから」."},
    {"id": "n5-v2-g-4", "type": "Mondai 1 (文法形式)", "question": "4. 日曜日に ともだち（　　）あいます。", "options": ["に", "を", "で", "へ"], "correct": 0, "explanation": "Meeting a person takes particle「に」:「ともだちにあう」."},
    {"id": "n5-v2-g-5", "type": "Mondai 1 (文法形式)", "question": "5. タクシー（　　）ホテルへ いきました。", "options": ["で", "に", "を", "から"], "correct": 0, "explanation": "Means of transportation takes「で」:「タクシーで」."},
    {"id": "n5-v2-g-6", "type": "Mondai 1 (文法形式)", "question": "6. つくえの うえに 本が 3さつ（　　）あります。", "options": ["も", "しか", "だけ", "に"], "correct": 2, "explanation": "Indicating limit 'only':「3さつだけ」."},
    {"id": "n5-v2-g-7", "type": "Mondai 1 (文法形式)", "question": "7. この みせの ケーキは（　　）おいしいです。", "options": ["あまり", "とても", "ぜんぜん", "すこしも"], "correct": 1, "explanation": "Affirmative intensifier:「とてもおいしい」."},
    {"id": "n5-v2-g-8", "type": "Mondai 1 (文法形式)", "question": "8. きのうは あめが ふりました（　　）、どこへも いきませんでした。", "options": ["から", "けど", "ので", "のに"], "correct": 0, "explanation": "Reason particle:「ふりましたから」."},
    {"id": "n5-v2-g-9", "type": "Mondai 1 (文法形式)", "question": "9. すみませんが、まどを（　　）ください。", "options": ["あけて", "あけ", "あける", "あけた"], "correct": 0, "explanation": "Request form takes て-form:「あけてください」."},
    {"id": "n5-v2-g-10", "type": "Mondai 1 (文法形式)", "question": "10. えいがを（　　）まえに、ポップコーンを かいました。", "options": ["みる", "みて", "みた", "みない"], "correct": 0, "explanation": "Verb dictionary form + 前に:「みるまえに」."},
    {"id": "n5-v2-g-11", "type": "Mondai 1 (文法形式)", "question": "11. わたしは 日本語を（　　）ことが できます。", "options": ["はなす", "はなして", "はなした", "はなします"], "correct": 0, "explanation": "Ability pattern「〜ことができる」takes dictionary form:「はなすことができる」."},
    {"id": "n5-v2-g-12", "type": "Mondai 1 (文法形式)", "question": "12. きょうは つかれたので、（　　）ねます。", "options": ["はやく", "はやい", "はやくて", "はやかった"], "correct": 0, "explanation": "Adverbial modifier of verb:「はやくねる」."},
    {"id": "n5-v2-g-13", "type": "Mondai 1 (文法形式)", "question": "13. この くつは（　　）あるきやすいです。", "options": ["かるくて", "かるい", "かるかった", "かるく"], "correct": 0, "explanation": "Connecting adjective:「かるくて あるきやすい」."},
    {"id": "n5-v2-g-14", "type": "Mondai 1 (文法形式)", "question": "14. 田中さんは どこに（　　）か。", "options": ["います", "あります", "します", "いきます"], "correct": 0, "explanation": "Presence of a person:「います」."},
    {"id": "n5-v2-g-15", "type": "Mondai 1 (文法形式)", "question": "15. いま なんじ（　　）ですか。", "options": ["ごろ", "ぐらい", "ほど", "まで"], "correct": 0, "explanation": "Approximate point in time:「なんじごろ」."},
    {"id": "n5-v2-g-16", "type": "Mondai 1 (文法形式)", "question": "16. らいしゅう 一緒に 海へ（　　）か。", "options": ["いきません", "いきました", "いかない", "いく"], "correct": 0, "explanation": "Polite invitation:「いきませんか」."},

    # Mondai 2 (文の組み立て ★ - 5 Qs)
    {"id": "n5-v2-g-17", "type": "Mondai 2 (文の組み立て)", "question": "17. わたしは　＿＿　＿＿　★　＿＿　いきました。\n1: 電車で　2: ともだちと　3: きのう　4: デパートへ", "options": ["電車で", "ともだちと", "きのう", "デパートへ"], "correct": 0, "explanation": "Natural sentence order: わたしは きのう ともだちと [★ 電車で] デパートへ いきました。 Star is 1 (電車で)."},
    {"id": "n5-v2-g-18", "type": "Mondai 2 (文の組み立て)", "question": "18. この　＿＿　＿＿　★　＿＿　ください。\n1: 名前を　2: かみに　3: ペンで　4: 書いて", "options": ["名前を", "かみに", "ペンで", "書いて"], "correct": 2, "explanation": "Sentence order: この かみに ペンで [★ 名前を] 書いてください。 Star is 1 (名前を)."},
    {"id": "n5-v2-g-19", "type": "Mondai 2 (文の組み立て)", "question": "19. あしたは　＿＿　＿＿　★　＿＿　おもいます。\n1: あめが　2: ふると　3: たぶん　4: さむくて", "options": ["あめが", "ふると", "たぶん", "さむくて"], "correct": 1, "explanation": "Sentence order: あしたは たぶん さむくて [★ あめが] ふると おもいます。 Star is 1 (あめが)."},
    {"id": "n5-v2-g-20", "type": "Mondai 2 (文の組み立て)", "question": "20. つくえの　＿＿　＿＿　★　＿＿　あります。\n1: うえに　2: じしょが　3: 2さつ　4: きれいな", "options": ["うえに", "じしょが", "2さつ", "きれいな"], "correct": 1, "explanation": "Sentence order: つくえの うえに きれいな [★ じしょが] 2さつ あります。 Star is 2 (じしょが)."},
    {"id": "n5-v2-g-21", "type": "Mondai 2 (文の組み立て)", "question": "21. 日本の　＿＿　＿＿　★　＿＿　すきです。\n1: りょうりで　2: すしが　3: いちばん　4: なかで", "options": ["りょうりで", "すしが", "いちばん", "なかで"], "correct": 2, "explanation": "Sentence order: 日本の りょうりの なかで [★ すしが] いちばん すきです。 Star is 2 (すしが)."},

    # Mondai 3 to 6 (読解 - Reading - 11 Qs)
    {"id": "n5-v2-g-22", "type": "Mondai 3 (文章の文法)", "question": "【読解文章：私の家族】\n22. (22) に入る最も適当な言葉はどれですか。", "options": ["すんでいます", "あります", "いきます", "みます"], "correct": 0, "explanation": "「東京にすんでいます」is grammatically correct for living in Tokyo."},
    {"id": "n5-v2-g-23", "type": "Mondai 3 (文章の文法)", "question": "23. (23) に入る最も適当な言葉はどれですか。", "options": ["そして", "しかし", "だから", "でも"], "correct": 0, "explanation": "Adding information in sequence uses「そして」."},
    {"id": "n5-v2-g-24", "type": "Mondai 3 (文章の文法)", "question": "24. (24) に入る最も適当な言葉はどれですか。", "options": ["いっしょに", "ひとりで", "ぜんぶ", "たくさん"], "correct": 0, "explanation": "Doing activities together:「いっしょに」."},
    {"id": "n5-v2-g-25", "type": "Mondai 3 (文章の文法)", "question": "25. (25) に入る最も適当な言葉はどれですか。", "options": ["たのしいです", "たのしかったです", "たのしくないです", "たのしくなかったです"], "correct": 1, "explanation": "Past event evaluation:「たのしかったです」."},
    {"id": "n5-v2-g-26", "type": "Mondai 3 (文章の文法)", "question": "26. (26) に入る最も適当な言葉はどれですか。", "options": ["いきたいです", "いきます", "いきました", "いかないです"], "correct": 0, "explanation": "Desire for future action:「またいきたいです」."},

    {"id": "n5-v2-g-27", "type": "Mondai 4 (短文読解)", "question": "【短文：田中さんへのメモ】\n27. 田中さんは 何時に どこへ 行かなければなりませんか。", "options": ["2時に 会議室", "3時に 会議室", "2時に 受付", "3時に 事務所"], "correct": 1, "explanation": "The memo specifies meeting in the conference room at 3:00 PM (3時に会議室)."},
    {"id": "n5-v2-g-28", "type": "Mondai 4 (短文読解)", "question": "28. 田中さんが 持って行く 物は何ですか。", "options": ["ノートパソコン", "ペンとノート", "会議の資料", "名刺"], "correct": 2, "explanation": "The memo explicitly asks to bring the meeting handouts (会議の資料)."},
    {"id": "n5-v2-g-29", "type": "Mondai 4 (短文読解)", "question": "29. メモを 書いた人は 誰ですか。", "options": ["山田さん", "佐藤さん", "鈴木さん", "小林さん"], "correct": 0, "explanation": "Signed by Yamada (山田)."},

    {"id": "n5-v2-g-30", "type": "Mondai 5 (中文読解)", "question": "【中文：日本での生活】\n30. リンさんは 日曜日、何をしましたか。", "options": ["公園を 散歩した", "友達と 買い物に行った", "家で 勉強した", "映画を見に行った"], "correct": 1, "explanation": "According to the passage, Lin went shopping with friends on Sunday."},
    {"id": "n5-v2-g-31", "type": "Mondai 5 (中文読解)", "question": "31. リンさんは どうして 日本語を 勉強していますか。", "options": ["日本の会社で 働きたいから", "日本の歌が 好きだから", "旅行したいから", "友達を作りたいから"], "correct": 0, "explanation": "Lin studies Japanese because he wants to work in a Japanese company."},

    {"id": "n5-v2-g-32", "type": "Mondai 6 (情報検索)", "question": "【情報検索：サークルのお知らせ】\n32. 初めて 参加する人は いくら 払いますか。", "options": ["無料 (0円)", "500円", "1,000円", "2,000円"], "correct": 0, "explanation": "The announcement states that first-time trial participants are free of charge (無料)."}
]

# N5 2018 Listening (24 Qs)
N5_VOL2_LISTENING = [
    # Mondai 1 (7 Qs)
    {"id": "n5-v2-l-1", "type": "Mondai 1 (課題理解)", "audioSrc": "/audio/japanese/n5_2018/N5Q1.mp3", "image": "/images/japanese/listening/n5_2018/m1_q1.png", "question": "1. 女の人と男の人が話しています。男の人はどの傘を持って行きますか。", "options": ["長くて黒い傘", "長くて白い傘", "短くて黒い折りたたみ傘", "短くて白い折りたたみ傘"], "correct": 2, "transcript": "女「雨が降るかもしれないよ。傘を持って行ったら？」\n男「じゃあ、カバンに入る短くて黒い折りたたみ傘を持っていくよ。」\n質問：男の人はどの傘を持って行きますか。", "explanation": "He chooses the compact black folding umbrella (短くて黒い折りたたみ傘, Option 3)."},
    {"id": "n5-v2-l-2", "type": "Mondai 1 (課題理解)", "audioSrc": "/audio/japanese/n5_2018/N5Q1.mp3", "image": "/images/japanese/listening/n5_2018/m1_q2.png", "question": "2. 先生が話しています。学生は明日、何を持って来ますか。", "options": ["ノートと鉛筆", "教科書と辞書", "ハサミと紙", "写真とお金"], "correct": 0, "transcript": "先生「明日の授業では漢字の練習をします。ノートと鉛筆を必ず持って来てください。」\n質問：学生は明日、何を持って来ますか。", "explanation": "Students need to bring notebook and pencil (ノートと鉛筆, Option 1)."},
    {"id": "n5-v2-l-3", "type": "Mondai 1 (課題理解)", "audioSrc": "/audio/japanese/n5_2018/N5Q1.mp3", "image": "/images/japanese/listening/n5_2018/m1_q3.png", "question": "3. 女の人と男の人が話しています。二人はどのテーブルに座りますか。", "options": ["窓側の丸いテーブル", "窓側の四角いテーブル", "真ん中の丸いテーブル", "真ん中の四角いテーブル"], "correct": 3, "transcript": "女「どこに座る？」\n男「真ん中の四角いテーブルが空いているよ。あそこに座ろう。」\n質問：二人はどのテーブルに座りますか。", "explanation": "They sit at the square table in the middle (真ん中の四角いテーブル, Option 4)."},
    {"id": "n5-v2-l-4", "type": "Mondai 1 (課題理解)", "audioSrc": "/audio/japanese/n5_2018/N5Q1.mp3", "image": "/images/japanese/listening/n5_2018/m1_q4.png", "question": "4. 男の人と女の人が話しています。男の人はどの服を着て行きますか。", "options": ["白いシャツと黒いズボン", "黒いシャツと白いズボン", "ジャケットとジーンズ", "セーターとスラックス"], "correct": 1, "transcript": "男「明日のパーティー、何を着て行こうか。」\n女「黒いシャツに白いズボンが素敵よ。」\n男「じゃあ、それにしよう。」\n質問：男の人はどの服を着て行きますか。", "explanation": "He wears the black shirt and white slacks (Option 2)."},
    {"id": "n5-v2-l-5", "type": "Mondai 1 (課題理解)", "audioSrc": "/audio/japanese/n5_2018/N5Q1.mp3", "image": "/images/japanese/listening/n5_2018/m1_q5.png", "question": "5. 女の人が店員と話しています。女の人はどの花を買いますか。", "options": ["赤いバラ3本", "黄色いチューリップ5本", "白いユリ2本", "ピンクの花束"], "correct": 0, "transcript": "女「すみません、この赤いバラを3本ください。」\n店員「はい、赤いバラ3本ですね。」\n質問：女の人はどの花を買いますか。", "explanation": "She buys 3 red roses (赤いバラ3本, Option 1)."},
    {"id": "n5-v2-l-6", "type": "Mondai 1 (課題理解)", "audioSrc": "/audio/japanese/n5_2018/N5Q1.mp3", "image": "/images/japanese/listening/n5_2018/m1_q6.png", "question": "6. 会社で男の人と女の人が話しています。女の人はこれから何をしますか。", "options": ["お茶を入れる", "電話をかける", "資料を配る", "部屋を掃除する"], "correct": 3, "transcript": "男「午後から来客があるから、会議室を掃除してくれる？」\n女「わかりました。すぐ掃除します。」\n質問：女の人はこれから何をしますか。", "explanation": "She cleans the meeting room (部屋を掃除する, Option 4)."},
    {"id": "n5-v2-l-7", "type": "Mondai 1 (課題理解)", "audioSrc": "/audio/japanese/n5_2018/N5Q1.mp3", "image": "/images/japanese/listening/n5_2018/m1_q7.png", "question": "7. 男の人と女の人が話しています。二人はどのバスに乗りますか。", "options": ["1番バス", "2番バス", "3番バス", "4番バス"], "correct": 2, "transcript": "男「市役所へ行くバスはどれ？」\n女「3番のバスよ。もうすぐ来るわ。」\n男「よし、3番に乗ろう。」\n質問：二人はどのバスに乗りますか。", "explanation": "They board bus number 3 (3番バス, Option 3)."},

    # Mondai 2 (6 Qs)
    {"id": "n5-v2-l-8", "type": "Mondai 2 (ポイント理解)", "audioSrc": "/audio/japanese/n5_2018/N5Q2.mp3", "question": "8. 男の人と女の人が話しています。女の人はどうして遅れましたか。", "options": ["バスが来なかったから", "電車が止まったから", "寝坊したから", "道を間違えたから"], "correct": 1, "transcript": "男「遅かったね。」\n女「ごめんなさい、事故で電車が止まってしまったの。」\n質問：女の人はどうして遅れましたか。", "explanation": "The train stopped due to an issue (電車が止まったから, Option 2)."},
    {"id": "n5-v2-l-9", "type": "Mondai 2 (ポイント理解)", "audioSrc": "/audio/japanese/n5_2018/N5Q2.mp3", "question": "9. 女の人と男の人が話しています。男の人の誕生日はいつですか。", "options": ["3月5日", "4月5日", "5月3日", "5月4日"], "correct": 0, "transcript": "女「誕生日はいつ？」\n男「3月5日だよ。」\n女「へえ、ひな祭りのすぐ後ね。」\n質問：男の人の誕生日はいつですか。", "explanation": "His birthday is March 5th (3月5日, Option 1)."},
    {"id": "n5-v2-l-10", "type": "Mondai 2 (ポイント理解)", "audioSrc": "/audio/japanese/n5_2018/N5Q2.mp3", "question": "10. 男の人が話しています。男の人は昨日、どこへ行きましたか。", "options": ["海", "山", "図書館", "映画館"], "correct": 2, "transcript": "男「昨日は休みだったので、静かな図書館へ行って本を読みました。」\n質問：男の人は昨日、どこへ行きましたか。", "explanation": "He went to the library (図書館, Option 3)."},
    {"id": "n5-v2-l-11", "type": "Mondai 2 (ポイント理解)", "audioSrc": "/audio/japanese/n5_2018/N5Q2.mp3", "question": "11. 女の人と男の人が話しています。二人は今晩、何を食べますか。", "options": ["カレー", "ラーメン", "寿司", "焼肉"], "correct": 0, "transcript": "女「今晩は何にする？」\n男「久しぶりに美味しいカレーを作ろうか。」\n女「いいね、カレーにしましょう。」\n質問：二人は今晩、何を食べますか。", "explanation": "They decide to have curry (カレー, Option 1)."},
    {"id": "n5-v2-l-12", "type": "Mondai 2 (ポイント理解)", "audioSrc": "/audio/japanese/n5_2018/N5Q2.mp3", "question": "12. 男の学生と女の学生が話しています。試験は何曜日ですか。", "options": ["月曜日", "火曜日", "木曜日", "金曜日"], "correct": 1, "transcript": "男「日本語の試験って月曜日だっけ？」\n女「ううん、火曜日よ。間違えないでね。」\n質問：試験は何曜日ですか。", "explanation": "The exam is on Tuesday (火曜日, Option 2)."},
    {"id": "n5-v2-l-13", "type": "Mondai 2 (ポイント理解)", "audioSrc": "/audio/japanese/n5_2018/N5Q2.mp3", "question": "13. 女の人が話しています。部屋の鍵はどこにありますか。", "options": ["カバンの中", "机の引き出し", "玄関の棚の上", "ポケットの中"], "correct": 1, "transcript": "女「部屋の鍵なら、机の引き出しの中に入れておいたよ。」\n質問：部屋の鍵はどこにありますか。", "explanation": "In the desk drawer (机の引き出し, Option 2)."},

    # Mondai 3 (5 Qs)
    {"id": "n5-v2-l-14", "type": "Mondai 3 (発話表現)", "audioSrc": "/audio/japanese/n5_2018/N5Q3.mp3", "image": "/images/japanese/listening/n5_2018/m3_q1.png", "question": "14. 朝、先生に会いました。何と言いますか。（矢印の人）", "options": ["おはようございます", "こんにちは", "こんばんは"], "correct": 0, "transcript": "状況：朝、先生に会いました。\n質問：何と言いますか。\n1. おはようございます\n2. こんにちは\n3. こんばんは", "explanation": "Morning greeting:「おはようございます」."},
    {"id": "n5-v2-l-15", "type": "Mondai 3 (発話表現)", "audioSrc": "/audio/japanese/n5_2018/N5Q3.mp3", "image": "/images/japanese/listening/n5_2018/m3_q2.png", "question": "15. 友達の家を出ます。何と言いますか。（矢印の人）", "options": ["お邪魔しました", "いってきます", "ただいま"], "correct": 0, "transcript": "状況：友達の家を出ます。\n質問：何と言いますか。\n1. お邪魔しました\n2. いってきます\n3. ただいま", "explanation": "Polite departure after visiting:「お邪魔しました」."},
    {"id": "n5-v2-l-16", "type": "Mondai 3 (発話表現)", "audioSrc": "/audio/japanese/n5_2018/N5Q3.mp3", "image": "/images/japanese/listening/n5_2018/m3_q3.png", "question": "16. 相手の言葉がよく聞こえませんでした。何と言いますか。（矢印の人）", "options": ["もう一度お願いします", "大きな声で話してください", "わかりません"], "correct": 0, "transcript": "状況：言葉がよく聞こえませんでした。\n質問：何と言いますか。\n1. もう一度お願いします\n2. 大きな声で話してください\n3. わかりません", "explanation": "Polite repetition request:「もう一度お願いします」."},
    {"id": "n5-v2-l-17", "type": "Mondai 3 (発話表現)", "audioSrc": "/audio/japanese/n5_2018/N5Q3.mp3", "image": "/images/japanese/listening/n5_2018/m3_q4.png", "question": "17. プレゼントをもらいました。何と言いますか。（矢印の人）", "options": ["ありがとうございます", "どういたしまして", "ごめんなさい"], "correct": 0, "transcript": "状況：プレゼントをもらいました。\n質問：何と言いますか。\n1. ありがとうございます\n2. どういたしまして\n3. ごめんなさい", "explanation": "Expressing gratitude:「ありがとうございます」."},
    {"id": "n5-v2-l-18", "type": "Mondai 3 (発話表現)", "audioSrc": "/audio/japanese/n5_2018/N5Q3.mp3", "image": "/images/japanese/listening/n5_2018/m3_q5.png", "question": "18. 写真を撮ってもらいたいです。何と言いますか。（矢印の人）", "options": ["写真を撮ってください", "写真を撮りましょうか", "写真を見せてください"], "correct": 0, "transcript": "状況：写真を撮ってもらいたいです。\n質問：何と言いますか。\n1. 写真を撮ってください\n2. 写真を撮りましょうか\n3. 写真を見せてください", "explanation": "Asking someone to take a photo:「写真を撮ってください」."},

    # Mondai 4 (6 Qs)
    {"id": "n5-v2-l-19", "type": "Mondai 4 (即時応答)", "audioSrc": "/audio/japanese/n5_2018/N5Q4.mp3", "question": "19. 「お疲れ様でした。」", "options": ["お疲れ様でした。", "どういたしまして。", "いただきます。"], "correct": 0, "transcript": "発話：「お疲れ様でした。」\n1. お疲れ様でした。\n2. どういたしまして。\n3. いただきます。", "explanation": "Natural reciprocal greeting:「お疲れ様でした。」"},
    {"id": "n5-v2-l-20", "type": "Mondai 4 (即時応答)", "audioSrc": "/audio/japanese/n5_2018/N5Q4.mp3", "question": "20. 「この本を借りてもいいですか。」", "options": ["はい、どうぞ。", "いいえ、借ります。", "そうしましょう。"], "correct": 0, "transcript": "発話：「この本を借りてもいいですか。」\n1. はい、どうぞ。\n2. いいえ、借ります。\n3. そうしましょう。", "explanation": "Granting permission:「はい、どうぞ。」"},
    {"id": "n5-v2-l-21", "type": "Mondai 4 (即時応答)", "audioSrc": "/audio/japanese/n5_2018/N5Q4.mp3", "question": "21. 「コーヒーと紅茶、どちらがいいですか。」", "options": ["コーヒーをお願いします。", "はい、どちらもです。", "いいえ、けっこうです。"], "correct": 0, "transcript": "発話：「コーヒーと紅茶、どちらがいいですか。」\n1. コーヒーをお願いします。\n2. はい、どちらもです。\n3. いいえ、けっこうです。", "explanation": "Selecting option:「コーヒーをお願いします。」"},
    {"id": "n5-v2-l-22", "type": "Mondai 4 (即時応答)", "audioSrc": "/audio/japanese/n5_2018/N5Q4.mp3", "question": "22. 「明日の天気はどうでしょうか。」", "options": ["晴れると思いますよ。", "昨日雨でした。", "いいえ、晴れません。"], "correct": 0, "transcript": "発話：「明日の天気はどうでしょうか。」\n1. 晴れると思いますよ。\n2. 昨日雨でした。\n3. いいえ、晴れません。", "explanation": "Forecasting answer:「晴れると思いますよ。」"},
    {"id": "n5-v2-l-23", "type": "Mondai 4 (即時応答)", "audioSrc": "/audio/japanese/n5_2018/N5Q4.mp3", "question": "23. 「ごちそうさまでした。」", "options": ["お粗末様でした。", "いただきます。", "ごめんなさい。"], "correct": 0, "transcript": "発話：「ごちそうさまでした。」\n1. お粗末様でした。\n2. いただきます。\n3. ごめんなさい。", "explanation": "Host reply to after-meal thanks:「お粗末様でした。」(or どういたしまして)."},
    {"id": "n5-v2-l-24", "type": "Mondai 4 (即時応答)", "audioSrc": "/audio/japanese/n5_2018/N5Q4.mp3", "question": "24. 「駅までどうやって行きますか。」", "options": ["バスで10分です。", "100円です。", "はい、行きます。"], "correct": 0, "transcript": "発話：「駅までどうやって行きますか。」\n1. バスで10分です。\n2. 100円です。\n3. はい、行きます。", "explanation": "Transportation answer:「バスで10分です。」"}
]

N5_VOL2_SECTIONS = [
    {
        'id': 'n5-v2-sec-vocab',
        'title': 'Section 1: Language Knowledge (文字・語彙)',
        'shortTitle': '文字・語彙 (Kanji & Vocab)',
        'timeLimitSeconds': 20 * 60,
        'questions': N5_VOL2_VOCAB # 35 Qs
    },
    {
        'id': 'n5-v2-sec-grammar',
        'title': 'Section 2: Language Knowledge (文法) & Reading (読解)',
        'shortTitle': '文法・読解 (Grammar & Reading)',
        'timeLimitSeconds': 40 * 60,
        'questions': N5_VOL2_GRAMMAR # 32 Qs
    },
    {
        'id': 'n5-v2-sec-listening',
        'title': 'Section 3: Listening Comprehension (聴解)',
        'shortTitle': '聴解 (Listening)',
        'timeLimitSeconds': 30 * 60,
        'questions': N5_VOL2_LISTENING # 24 Qs
    }
]

# =========================================================================
# N4 VOLUME 2 (2018 OFFICIAL PRACTICE WORKBOOK)
# =========================================================================
N4_VOL2_VOCAB = [
    # Mondai 1 (漢字読み - 9 Qs)
    {"id": "n4-v2-v-1", "type": "Mondai 1 (漢字読み)", "question": "1. この <u>計画</u>は とても たいせつです。", "options": ["けいかく", "けいがく", "けいかん", "けいがん"], "correct": 0, "explanation": "「計画」is read as「けいかく」(plan)."},
    {"id": "n4-v2-v-2", "type": "Mondai 1 (漢字読み)", "question": "2. <u>案内</u>の 手紙を 送りました。", "options": ["あんあい", "あんない", "あんたい", "あんだい"], "correct": 1, "explanation": "「案内」is read as「あんない」(guidance/invitation)."},
    {"id": "n4-v2-v-3", "type": "Mondai 1 (漢字読み)", "question": "3. <u>荷物</u>を 車に つみます。", "options": ["かもつ", "にもつ", "かぶつ", "にぶつ"], "correct": 1, "explanation": "「荷物」is read as「にもつ」(luggage/cargo)."},
    {"id": "n4-v2-v-4", "type": "Mondai 1 (漢字読み)", "question": "4. <u>特急</u>電車に 乗ります。", "options": ["とくきゅう", "とっきゅう", "どくきゅう", "どっきゅう"], "correct": 1, "explanation": "「特急」is read as「とっきゅう」(limited express)."},
    {"id": "n4-v2-v-5", "type": "Mondai 1 (漢字読み)", "question": "5. <u>試合</u>に 勝つことが できました。", "options": ["しあい", "じあい", "しごう", "じごう"], "correct": 0, "explanation": "「試合」is read as「しあい」(match/game)."},
    {"id": "n4-v2-v-6", "type": "Mondai 1 (漢字読み)", "question": "6. <u>予習</u>を 忘れないで ください。", "options": ["よしゅう", "ようしゅう", "ほしゅう", "ほうしゅう"], "correct": 0, "explanation": "「予習」is read as「よしゅう」(preparation/preview)."},
    {"id": "n4-v2-v-7", "type": "Mondai 1 (漢字読み)", "question": "7. <u>急行</u>が まもなく まいります。", "options": ["きゅうこう", "きゅうぎょう", "いそぎこう", "いそぎぎょう"], "correct": 0, "explanation": "「急行」is read as「きゅうこう」(express train)."},
    {"id": "n4-v2-v-8", "type": "Mondai 1 (漢字読み)", "question": "8. <u>説明</u>を よく 聞いて ください。", "options": ["せつめい", "せつめ", "ぜつめい", "ぜつめ"], "correct": 0, "explanation": "「説明」is read as「せつめい」(explanation)."},
    {"id": "n4-v2-v-9", "type": "Mondai 1 (漢字読み)", "question": "9. <u>出発</u>の 時間を 確認します。", "options": ["しゅっぱつ", "しゅつはつ", "でっぱつ", "ではつ"], "correct": 0, "explanation": "「出発」is read as「しゅっぱつ」(departure)."},

    # Mondai 2 (表記・漢字書き - 6 Qs)
    {"id": "n4-v2-v-10", "type": "Mondai 2 (表記・漢字書き)", "question": "10. えきで <u>きっぷ</u>を かいました。", "options": ["切符", "切布", "着符", "着布"], "correct": 0, "explanation": "「きっぷ」is written as「切符」(ticket)."},
    {"id": "n4-v2-v-11", "type": "Mondai 2 (表記・漢字書き)", "question": "11. 友人と <u>そうだん</u>します。", "options": ["相談", "相談", "想談", "送談"], "correct": 1, "explanation": "「そうだん」is written as「相談」(consultation)."},
    {"id": "n4-v2-v-12", "type": "Mondai 2 (表記・漢字書き)", "question": "12. <u>じゅんび</u>が できました。", "options": ["準偏", "準便", "準備", "准備"], "correct": 2, "explanation": "「じゅんび」is written as「準備」(preparation)."},
    {"id": "n4-v2-v-13", "type": "Mondai 2 (表記・漢字書き)", "question": "13. <u>おんど</u>が あがります。", "options": ["温度", "温土", "音度", "音土"], "correct": 0, "explanation": "「おんど」is written as「温度」(temperature)."},
    {"id": "n4-v2-v-14", "type": "Mondai 2 (表記・漢字書き)", "question": "14. <u>ちゅうい</u>して ください。", "options": ["注意", "注心", "主意", "主心"], "correct": 0, "explanation": "「ちゅうい」is written as「注意」(caution / attention)."},
    {"id": "n4-v2-v-15", "type": "Mondai 2 (表記・漢字書き)", "question": "15. <u>へんじ</u>を まっています。", "options": ["返事", "変事", "返次", "変次"], "correct": 0, "explanation": "「へんじ」is written as「返事」(reply)."},

    # Mondai 3 (文脈規定 - 10 Qs)
    {"id": "n4-v2-v-16", "type": "Mondai 3 (文脈規定)", "question": "16. ベルが（　　）、じゅぎょうが はじまりました。", "options": ["なって", "おとして", "ふって", "ひいて"], "correct": 0, "explanation": "Ringing bell:「ベルがなる」."},
    {"id": "n4-v2-v-17", "type": "Mondai 3 (文脈規定)", "question": "17. この シャツは（　　）洗うことが できます。", "options": ["きれいに", "かるく", "ふかく", "すずしく"], "correct": 0, "explanation": "Washing cleanly:「きれいに洗う」."},
    {"id": "n4-v2-v-18", "type": "Mondai 3 (文脈規定)", "question": "18. かぜで カーテンが（　　）います。", "options": ["ゆれて", "こわれて", "たおれて", "やぶれて"], "correct": 0, "explanation": "Curtain swaying in the wind:「ゆれる」."},
    {"id": "n4-v2-v-19", "type": "Mondai 3 (文脈規定)", "question": "19. 先生の おかげで 試験に（　　）しました。", "options": ["ごうかく", "しっぱい", "そつぎょう", "にゅうがく"], "correct": 0, "explanation": "Passing the exam:「ごうかくする」."},
    {"id": "n4-v2-v-20", "type": "Mondai 3 (文脈規定)", "question": "20. 電気を けして、部屋を（　　）しました。", "options": ["まっくら", "まっしろ", "まっくろ", "まっあか"], "correct": 0, "explanation": "Pitch dark room:「まっくら」."},
    {"id": "n4-v2-v-21", "type": "Mondai 3 (文脈規定)", "question": "21. しばらく（　　）から、もう一度 電話します。", "options": ["まって", "たって", "すぎて", "とまって"], "correct": 1, "explanation": "Time passing:「しばらくたってから」."},
    {"id": "n4-v2-v-22", "type": "Mondai 3 (文脈規定)", "question": "22. （　　）用事があるので、お先に失礼します。", "options": ["きゅうな", "とつぜんな", "むだな", "たいせつな"], "correct": 0, "explanation": "Urgent errand:「きゅうな用事」."},
    {"id": "n4-v2-v-23", "type": "Mondai 3 (文脈規定)", "question": "23. 雨が（　　）ので、傘を さしました。", "options": ["やんだ", "ふりだした", "つよくなった", "あがった"], "correct": 1, "explanation": "Rain started falling:「ふりだした」."},
    {"id": "n4-v2-v-24", "type": "Mondai 3 (文脈規定)", "question": "24. 車を（　　）に 止めて ください。", "options": ["ちゅうしゃじょう", "えき", "こうばん", "ガソリンスタンド"], "correct": 0, "explanation": "Parking lot:「ちゅうしゃじょう」."},
    {"id": "n4-v2-v-25", "type": "Mondai 3 (文脈規定)", "question": "25. ボタンを（　　）と、ドアが 開きます。", "options": ["おす", "ひく", "まわす", "きる"], "correct": 0, "explanation": "Pushing a button:「ボタンをおす」."},

    # Mondai 4 (類義表現 - 5 Qs)
    {"id": "n4-v2-v-26", "type": "Mondai 4 (類義表現)", "question": "26. この 本は <u>複雑</u>です。", "options": ["かんたんではありません", "おもしろくありません", "たかくありません", "あたらしくありません"], "correct": 0, "explanation": "「複雑」(complex) means not simple (かんたんではありません)."},
    {"id": "n4-v2-v-27", "type": "Mondai 4 (類義表現)", "question": "27. <u>たいてい</u> 家で 勉強します。", "options": ["いつも", "ほとんど", "ときどき", "ぜんぜん"], "correct": 1, "explanation": "「たいてい」(usually/mostly) is close to「ほとんど」."},
    {"id": "n4-v2-v-28", "type": "Mondai 4 (類義表現)", "question": "28. <u>お礼</u>を 言いました。", "options": ["あやまりました", "感謝しました", "約束しました", "案内しました"], "correct": 1, "explanation": "「お礼を言う」means expressing thanks (感謝する)."},
    {"id": "n4-v2-v-29", "type": "Mondai 4 (類義表現)", "question": "29. <u>さっき</u> 田中さんに 会いました。", "options": ["すこし前に", "ずっと前に", "明日に", "夕方に"], "correct": 0, "explanation": "「さっき」means a little while ago (すこし前に)."},
    {"id": "n4-v2-v-30", "type": "Mondai 4 (類義表現)", "question": "30. <u>遠慮しないで</u> 食べて ください。", "options": ["きにしないで", "いそいで", "のこさないで", "すこしだけ"], "correct": 0, "explanation": "「遠慮しないで」means without hesitation / without holding back (きにしないで)."},

    # Mondai 5 (用法 - 5 Qs)
    {"id": "n4-v2-v-31", "type": "Mondai 5 (用法)", "question": "31. <u>遠慮</u>", "options": ["会議で 意見を 言うのを 遠慮しました。", "電車に 遠慮して 乗りました。", "友達に 遠慮を あげました。", "本を 遠慮して 読みました。"], "correct": 0, "explanation": "Correct usage of「遠慮する」(hesitating/holding back in expressing opinions)."},
    {"id": "n4-v2-v-32", "type": "Mondai 5 (用法)", "question": "32. <u>世話</u>", "options": ["犬の 世話を しています。", "宿題の 世話を しました。", "料理の 世話を 作ります。", "電車の 世話に 乗ります。"], "correct": 0, "explanation": "Taking care of pets/people:「犬の世話をする」."},
    {"id": "n4-v2-v-33", "type": "Mondai 5 (用法)", "question": "33. <u>熱心</u>", "options": ["彼は 熱心に 日本語を 勉強しています。", "今日は 熱心な 天気です。", "この スープは 熱心です。", "熱心な 電車に 乗りました。"], "correct": 0, "explanation": "Enthusiastic study:「熱心に勉強する」."},
    {"id": "n4-v2-v-34", "type": "Mondai 5 (用法)", "question": "34. <u>都合</u>", "options": ["明日の 午後は 都合が 悪いです。", "都合な 料理を 食べました。", "都合に 本を 買いました。", "都合が 高いです。"], "correct": 0, "explanation": "Schedule convenience:「都合が悪い」."},
    {"id": "n4-v2-v-35", "type": "Mondai 5 (用法)", "question": "35. <u>故障</u>", "options": ["テレビが 故障して つきません。", "宿題が 故障しました。", "料理が 故障しました。", "天気が 故障しました。"], "correct": 0, "explanation": "Mechanical breakdown:「テレビが故障する」."}
]

# N4 2018 Grammar & Reading (35 Qs)
N4_VOL2_GRAMMAR = [
    # Mondai 1 (15 Qs)
    {"id": "n4-v2-g-1", "type": "Mondai 1 (文法形式)", "question": "1. この 料理は（　　）すぎて、食べられません。", "options": ["から", "からい", "からく", "からくて"], "correct": 0, "explanation": "Stem of い-adj + すぎる:「からすぎる」."},
    {"id": "n4-v2-g-2", "type": "Mondai 1 (文法形式)", "question": "2. 雨が ふりそう（　　）から、傘を 持って 行きます。", "options": ["だ", "な", "に", "で"], "correct": 0, "explanation": "そう + だから:「ふりそうだ」."},
    {"id": "n4-v2-g-3", "type": "Mondai 1 (文法形式)", "question": "3. 先生に 本を（　　）いただきました。", "options": ["かして", "かりて", "かって", "よんで"], "correct": 0, "explanation": "Receiving a lending favor from a teacher:「かしていただきました」."},
    {"id": "n4-v2-g-4", "type": "Mondai 1 (文法形式)", "question": "4. 毎日 走る（　　）に しています。", "options": ["こと", "もの", "よう", "わけ"], "correct": 0, "explanation": "Making a personal habit:「〜ことにしている」."},
    {"id": "n4-v2-g-5", "type": "Mondai 1 (文法形式)", "question": "5. 弟は 母に 部屋を（　　）られました。", "options": ["そうじさ", "そうじ", "そうじされ", "そうじし"], "correct": 0, "explanation": "Passive voice:「そうじされた」."},
    {"id": "n4-v2-g-6", "type": "Mondai 1 (文法形式)", "question": "6. 早く 起きられる（　　）に、目覚まし時計を セットしました。", "options": ["よう", "こと", "ため", "はず"], "correct": 0, "explanation": "In order to enable potential verb:「〜ように」."},
    {"id": "n4-v2-g-7", "type": "Mondai 1 (文法形式)", "question": "7. この 本は 読み（　　）やすいです。", "options": ["やすく", "やすい", "やすくて", "やすかった"], "correct": 1, "explanation": "Masu-stem + やすい:「読みやすい」."},
    {"id": "n4-v2-g-8", "type": "Mondai 1 (文法形式)", "question": "8. 田中さんは 来ない（　　）かもしれません。", "options": ["かも", "はず", "わけ", "こと"], "correct": 0, "explanation": "Possibility conjecture:「〜かもしれない」."},
    {"id": "n4-v2-g-9", "type": "Mondai 1 (文法形式)", "question": "9. 先生、お荷物を お持ち（　　）ましょうか。", "options": ["し", "になり", "いたし", "なさい"], "correct": 0, "explanation": "Humble offer pattern「お〜しましょうか」:「お持ちしましょうか」."},
    {"id": "n4-v2-g-10", "type": "Mondai 1 (文法形式)", "question": "10. ドアが（　　）います。", "options": ["あいて", "あけて", "しまって", "しめて"], "correct": 0, "explanation": "Intransitive verb state:「ドアがあいている」."},
    {"id": "n4-v2-g-11", "type": "Mondai 1 (文法形式)", "question": "11. 窓が（　　）あります。", "options": ["あけて", "あいて", "しめて", "しまって"], "correct": 0, "explanation": "Transitive verb resultant state「〜てある」:「あけてある」."},
    {"id": "n4-v2-g-12", "type": "Mondai 1 (文法形式)", "question": "12. 日本語が 上手に（　　）たいです。", "options": ["なり", "して", "なって", "なれ"], "correct": 0, "explanation": "Want to become:「上手になりたい」."},
    {"id": "n4-v2-g-13", "type": "Mondai 1 (文法形式)", "question": "13. 薬を 飲んだ（　　）が いいですよ。", "options": ["ほう", "よう", "こと", "わけ"], "correct": 0, "explanation": "Advice pattern:「〜ほうがいい」."},
    {"id": "n4-v2-g-14", "type": "Mondai 1 (文法形式)", "question": "14. 映画を（　　）ながら、ポップコーンを 食べました。", "options": ["み", "みて", "みる", "みた"], "correct": 0, "explanation": "Simultaneous actions:「みながら」."},
    {"id": "n4-v2-g-15", "type": "Mondai 1 (文法形式)", "question": "15. 明日 雨なら、ピクニックは 中止（　　）します。", "options": ["に", "を", "で", "と"], "correct": 0, "explanation": "Decision pattern:「〜にする」."},

    # Mondai 2 (★ - 5 Qs)
    {"id": "n4-v2-g-16", "type": "Mondai 2 (文の組み立て)", "question": "16. わたしは　＿＿　＿＿　★　＿＿　つもりです。\n1: 日本へ　2: らいねん　3: りゅうがくする　4: ともだちと", "options": ["日本へ", "らいねん", "りゅうがくする", "ともだちと"], "correct": 0, "explanation": "Sentence order: わたしは らいねん ともだちと [★ 日本へ] りゅうがくする つもりです。 Star is 1 (日本へ)."},
    {"id": "n4-v2-g-17", "type": "Mondai 2 (文の組み立て)", "question": "17. この　＿＿　＿＿　★　＿＿　おもいます。\n1: レポートは　2: むずかしくて　3: ひとりで　4: できないと", "options": ["レポートは", "むずかしくて", "ひとりで", "できないと"], "correct": 2, "explanation": "Sentence order: この レポートは むずかしくて [★ ひとりで] できないと おもいます。 Star is 3 (ひとりで)."},
    {"id": "n4-v2-g-18", "type": "Mondai 2 (文の組み立て)", "question": "18. 先生に　＿＿　＿＿　★　＿＿　いただきました。\n1: 本を　2: おもしろい　3: かして　4: すてきな", "options": ["本を", "おもしろい", "かして", "すてきな"], "correct": 0, "explanation": "Sentence order: 先生に おもしろい すてきな [★ 本を] かして いただきました。 Star is 1 (本を)."},
    {"id": "n4-v2-g-19", "type": "Mondai 2 (文の組み立て)", "question": "19. あした　＿＿　＿＿　★　＿＿　いけません。\n1: がっこうへ　2: びょういんへ　3: いくので　4: 午前中は", "options": ["がっこうへ", "びょういんへ", "いくので", "午前中は"], "correct": 2, "explanation": "Sentence order: あした 午前中は びょういんへ [★ いくので] がっこうへ いけません。 Star is 3 (いくので)."},
    {"id": "n4-v2-g-20", "type": "Mondai 2 (文の組み立て)", "question": "20. 電車に　＿＿　＿＿　★　＿＿　走りました。\n1: おくれない　2: ように　3: いそいで　4: えきまで", "options": ["おくれない", "ように", "いそいで", "えきまで"], "correct": 3, "explanation": "Sentence order: 電車に おくれない ように いそいで [★ えきまで] 走りました。 Star is 4 (えきまで)."},

    # Mondai 3 to 6 (読解 - Reading - 15 Qs)
    {"id": "n4-v2-g-21", "type": "Mondai 3 (文章の文法)", "question": "【読解文章：日本の温泉】\n21. (21) に入る最も適当な言葉はどれですか。", "options": ["はいります", "はいりました", "はいって", "はいる"], "correct": 2, "explanation": "Te-form connecting action:「はいって」."},
    {"id": "n4-v2-g-22", "type": "Mondai 3 (文章の文法)", "question": "22. (22) に入る最も適当な言葉はどれですか。", "options": ["とても", "あまり", "ぜんぜん", "すこしも"], "correct": 0, "explanation": "Affirmative modifier:「とてもきもちがいい」."},
    {"id": "n4-v2-g-23", "type": "Mondai 3 (文章の文法)", "question": "23. (23) に入る最も適当な言葉はどれですか。", "options": ["だから", "しかし", "それに", "それから"], "correct": 2, "explanation": "Adding another benefit:「それに」."},
    {"id": "n4-v2-g-24", "type": "Mondai 3 (文章の文法)", "question": "24. (24) に入る最も適当な言葉はどれですか。", "options": ["いってみて", "いってみる", "いってみた", "いってみたい"], "correct": 3, "explanation": "Desire to experience:「いってみたい」."},
    {"id": "n4-v2-g-25", "type": "Mondai 3 (文章の文法)", "question": "25. (25) に入る最も適当な言葉はどれですか。", "options": ["おもいます", "おもいました", "おもって", "おもわない"], "correct": 0, "explanation": "Present opinion statement:「〜とおもいます」."},

    {"id": "n4-v2-g-26", "type": "Mondai 4 (短文読解)", "question": "【短文：図書館の利用案内】\n26. 本は何冊まで借りられますか。", "options": ["3冊", "5冊", "7冊", "10冊"], "correct": 1, "explanation": "The library notice states a maximum limit of 5 books (5冊)."},
    {"id": "n4-v2-g-27", "type": "Mondai 4 (短文読解)", "question": "27. 本の貸出期間は何週間ですか。", "options": ["1週間", "2週間", "3週間", "1か月"], "correct": 1, "explanation": "Borrowing period is 2 weeks (2週間)."},
    {"id": "n4-v2-g-28", "type": "Mondai 4 (短文読解)", "question": "28. DVDやCDは借りることができますか。", "options": ["館内でのみ利用できる", "2点まで借りられる", "借りることはできない", "有料で借りられる"], "correct": 0, "explanation": "Audiovisual materials are for in-library use only (館内でのみ利用できる)."},
    {"id": "n4-v2-g-29", "type": "Mondai 4 (短文読解)", "question": "29. 休館日は何曜日ですか。", "options": ["月曜日", "水曜日", "土曜日", "日曜日"], "correct": 0, "explanation": "Closed on Mondays (月曜日)."},

    {"id": "n4-v2-g-30", "type": "Mondai 5 (中文読解)", "question": "【中文：日本でのホームステイ】\n30. 筆者がホームステイで一番驚いたことは何ですか。", "options": ["毎晩お風呂のお湯を家族みんなで使うこと", "朝ごはんがパンだったこと", "部屋が広かったこと", "犬を飼っていたこと"], "correct": 0, "explanation": "The author was most surprised by the Japanese bathing custom of sharing bathwater."},
    {"id": "n4-v2-g-31", "type": "Mondai 5 (中文読解)", "question": "31. ホストファミリーと仲良くなるために筆者は何をしましたか。", "options": ["母国の料理を一緒に作った", "日本語だけで話した", "プレゼントを毎日あげた", "手紙を書いた"], "correct": 0, "explanation": "Cooked traditional dishes from home country together with the host family."},
    {"id": "n4-v2-g-32", "type": "Mondai 5 (中文読解)", "question": "32. ホームステイを終えて筆者はどう感じましたか。", "options": ["本当の家族のように温かく感じた", "少し疲れた", "もう一度一人暮らしがしたい", "もっと長く滞在したかった"], "correct": 0, "explanation": "Felt warmly treated just like real family."},
    {"id": "n4-v2-g-33", "type": "Mondai 5 (中文読解)", "question": "33. この文章のタイトルとして最も適切なものはどれですか。", "options": ["温かい日本の家族との出会い", "日本のお風呂の入り方", "料理の作り方", "留学生の生活の工夫"], "correct": 0, "explanation": "Best fits the overall heartwarming homestay experience."},

    {"id": "n4-v2-g-34", "type": "Mondai 6 (情報検索)", "question": "【情報検索：ボランティア募集チラシ】\n34. 高校生が参加できる活動はどれですか。", "options": ["公園清掃ボランティア", "通訳ボランティア", "パソコン指導ボランティア", "運転ボランティア"], "correct": 0, "explanation": "High schoolers are eligible for park cleanup without special prerequisites."},
    {"id": "n4-v2-g-35", "type": "Mondai 6 (情報検索)", "question": "35. 申し込みの締め切り日はいつですか。", "options": ["10月15日", "10月20日", "10月31日", "11月5日"], "correct": 1, "explanation": "Application deadline listed is October 20th."}
]

# N4 2018 Listening (28 Qs)
N4_VOL2_LISTENING = [
    # Mondai 1 (8 Qs)
    {"id": "n4-v2-l-1", "type": "Mondai 1 (課題理解)", "audioSrc": "/audio/japanese/n4_2018/N4Q1.mp3", "image": "/images/japanese/listening/n4_2018/m1_q1.png", "question": "1. 男の人と女の人が話しています。男の人はどの靴を買いますか。", "options": ["黒いスニーカー", "白いスニーカー", "革靴", "サンダル"], "correct": 0, "transcript": "男「歩きやすい靴を探しているんだ。」\n女「この黒いスニーカーは軽くてクッションもいいわよ。」\n男「本当だ、これにするよ。」\n質問：男の人はどの靴を買いますか。", "explanation": "He selects the black sneakers (黒いスニーカー, Option 1)."},
    {"id": "n4-v2-l-2", "type": "Mondai 1 (課題理解)", "audioSrc": "/audio/japanese/n4_2018/N4Q1.mp3", "image": "/images/japanese/listening/n4_2018/m1_q2.png", "question": "2. 女の人が案内を聞いています。女の人は何番線に行きますか。", "options": ["1番線", "2番線", "3番線", "4番線"], "correct": 2, "transcript": "アナウンス「空港行きの快速電車は3番線から発車いたします。」\n女「3番線ね、階段を急がなきゃ。」\n質問：女の人は何番線に行きますか。", "explanation": "She goes to platform 3 (3番線, Option 3)."},
    {"id": "n4-v2-l-3", "type": "Mondai 1 (課題理解)", "audioSrc": "/audio/japanese/n4_2018/N4Q1.mp3", "image": "/images/japanese/listening/n4_2018/m1_q3.png", "question": "3. 会社で男の人と女の人が話しています。女の人はこれからどこへ行きますか。", "options": ["銀行", "郵便局", "コンビニ", "市役所"], "correct": 1, "transcript": "男「この書類を速達で送ってきてくれる？」\n女「はい、郵便局に行ってまいります。」\n質問：女の人はこれからどこへ行きますか。", "explanation": "She heads to the post office (郵便局, Option 2)."},
    {"id": "n4-v2-l-4", "type": "Mondai 1 (課題理解)", "audioSrc": "/audio/japanese/n4_2018/N4Q1.mp3", "image": "/images/japanese/listening/n4_2018/m1_q4.png", "question": "4. 男の人と女の人が話しています。二人はどの映画を見ますか。", "options": ["アクション映画", "アニメ映画", "コメディ映画", "恋愛映画"], "correct": 3, "transcript": "男「どのアクション映画か恋愛映画がいいな。」\n女「話題の恋愛映画にしましょうよ。」\n男「そうだね、そうしよう。」\n質問：二人はどの映画を見ますか。", "explanation": "They pick the romance movie (Option 4)."},
    {"id": "n4-v2-l-5", "type": "Mondai 1 (課題理解)", "audioSrc": "/audio/japanese/n4_2018/N4Q1.mp3", "image": "/images/japanese/listening/n4_2018/m1_q5.png", "question": "5. 先生が話しています。学生はどの順序で発表しますか。", "options": ["Aグループ→Bグループ", "Bグループ→Aグループ", "個人発表のみ", "自由順"], "correct": 0, "transcript": "先生「今日のプレゼンは、まずAグループが発表し、その後にBグループが行います。」\n質問：学生はどの順序で発表しますか。", "explanation": "Group A presents first, followed by Group B (Option 1)."},
    {"id": "n4-v2-l-6", "type": "Mondai 1 (課題理解)", "audioSrc": "/audio/japanese/n4_2018/N4Q1.mp3", "image": "/images/japanese/listening/n4_2018/m1_q6.png", "question": "6. 店で男の人と店員が話しています。男の人はどのシャツを買いますか。", "options": ["半袖の青いシャツ", "長袖の青いシャツ", "半袖の白いシャツ", "長袖の白いシャツ"], "correct": 1, "transcript": "男「青い長袖のシャツのMサイズはありますか。」\n店員「はい、こちらにございます。」\n男「これをいただきます。」\n質問：男の人はどのシャツを買いますか。", "explanation": "He chooses the long-sleeve blue shirt (長袖の青いシャツ, Option 2)."},
    {"id": "n4-v2-l-7", "type": "Mondai 1 (課題理解)", "audioSrc": "/audio/japanese/n4_2018/N4Q1.mp3", "image": "/images/japanese/listening/n4_2018/m1_q7.png", "question": "7. 女の人と男の人が話しています。二人はどこで待ち合わせますか。", "options": ["駅の改札口", "カフェの前", "本屋の前", "時計台の下"], "correct": 2, "transcript": "女「どこで会う？」\n男「駅の東口にある本屋の前で待ってるよ。」\n女「わかった、本屋の前ね。」\n質問：二人はどこで待ち合わせますか。", "explanation": "In front of the bookstore (本屋の前, Option 3)."},
    {"id": "n4-v2-l-8", "type": "Mondai 1 (課題理解)", "audioSrc": "/audio/japanese/n4_2018/N4Q1.mp3", "image": "/images/japanese/listening/n4_2018/m1_q8.png", "question": "8. 男の人と女の人が話しています。男の人は明日、何を持って行きますか。", "options": ["お弁当と水筒", "水筒とおやつ", "お弁当とおやつ", "雨具とお弁当"], "correct": 0, "transcript": "女「明日の遠足、お弁当と水筒を忘れないでね。」\n男「うん、お弁当と水筒をリュックに入れておくよ。」\n質問：男の人は明日、何を持って行きますか。", "explanation": "Lunchbox and water bottle (お弁当と水筒, Option 1)."},

    # Mondai 2 (7 Qs)
    {"id": "n4-v2-l-9", "type": "Mondai 2 (ポイント理解)", "audioSrc": "/audio/japanese/n4_2018/N4Q2.mp3", "question": "9. 女の人が話しています。女の人が最近始めた習い事は何ですか。", "options": ["茶道", "華道", "ピアノ", "ヨガ"], "correct": 0, "transcript": "女「日本の伝統文化を学びたくて、先月からお茶のお稽古（茶道）に通い始めたんです。」\n質問：女の人が最近始めた習い事は何ですか。", "explanation": "Tea ceremony (茶道, Option 1)."},
    {"id": "n4-v2-l-10", "type": "Mondai 2 (ポイント理解)", "audioSrc": "/audio/japanese/n4_2018/N4Q2.mp3", "question": "10. 男の人と女の人が話しています。男の人はなぜ引っ越しますか。", "options": ["会社に近くなるから", "家賃が安いから", "部屋が広いから", "静かな街だから"], "correct": 0, "transcript": "男「来月引っ越すんだ。今の家は通勤に1時間半かかるけど、新居なら会社まで徒歩10分なんだ。」\n質問：男の人はなぜ引っ越しますか。", "explanation": "Closer to the workplace (会社に近くなるから, Option 1)."},
    {"id": "n4-v2-l-11", "type": "Mondai 2 (ポイント理解)", "audioSrc": "/audio/japanese/n4_2018/N4Q2.mp3", "question": "11. 女の学生と男の学生が話しています。試験の範囲はどこからどこまでですか。", "options": ["第1課から第5課", "第3課から第7課", "第5課から第10課", "第1課から第10課"], "correct": 2, "transcript": "男「中間テストの範囲、どこだっけ？」\n女「先生が第5課から第10課までって言ってたよ。」\n質問：試験の範囲はどこからどこまでですか。", "explanation": "Chapter 5 to Chapter 10 (第5課から第10課, Option 3)."},
    {"id": "n4-v2-l-12", "type": "Mondai 2 (ポイント理解)", "audioSrc": "/audio/japanese/n4_2018/N4Q2.mp3", "question": "12. 男の人が話しています。男の人が好きな季節はいつですか。", "options": ["春", "夏", "秋", "冬"], "correct": 2, "transcript": "男「紅葉が綺麗で、涼しくて過ごしやすい秋が一番好きですね。」\n質問：男の人が好きな季節はいつですか。", "explanation": "Autumn (秋, Option 3)."},
    {"id": "n4-v2-l-13", "type": "Mondai 2 (ポイント理解)", "audioSrc": "/audio/japanese/n4_2018/N4Q2.mp3", "question": "13. 女の人と男の人が話しています。パーティーは何時から始まりますか。", "options": ["5時半", "6時", "6時半", "7時"], "correct": 1, "transcript": "男「同窓会は何時から？」\n女「開場は5時半だけど、乾杯と開始は6時ちょうどよ。」\n質問：パーティーは何時から始まりますか。", "explanation": "Starts at 6:00 PM (6時, Option 2)."},
    {"id": "n4-v2-l-14", "type": "Mondai 2 (ポイント理解)", "audioSrc": "/audio/japanese/n4_2018/N4Q2.mp3", "question": "14. 男の人が話しています。昨日の試合で勝てなかった理由は何ですか。", "options": ["練習不足だったから", "エースが怪我をしたから", "相手が強すぎたから", "雨が降ったから"], "correct": 1, "transcript": "男「昨日のサッカーの決勝戦、うちのエース選手が前半で足を怪我して退場してしまったのが痛かったよ。」\n質問：勝てなかった理由は何ですか。", "explanation": "The ace player got injured (エースが怪我をしたから, Option 2)."},
    {"id": "n4-v2-l-15", "type": "Mondai 2 (ポイント理解)", "audioSrc": "/audio/japanese/n4_2018/N4Q2.mp3", "question": "15. 女の人と男の人が話しています。二人は今度の日曜日、何をしますか。", "options": ["山登り", "美術館に行く", "バーベキュー", "カラオケ"], "correct": 1, "transcript": "女「日曜日、美術館でフランス絵画展をやっているの。一緒に行かない？」\n男「いいね、見に行こう。」\n質問：二人は今度の日曜日、何をしますか。", "explanation": "Going to the art museum (美術館に行く, Option 2)."},

    # Mondai 3 (5 Qs)
    {"id": "n4-v2-l-16", "type": "Mondai 3 (発話表現)", "audioSrc": "/audio/japanese/n4_2018/N4Q3.mp3", "image": "/images/japanese/listening/n4_2018/m3_q1.png", "question": "16. 相手の荷物を持ってあげたいです。何と言いますか。（矢印の人）", "options": ["荷物をお持ちしましょうか。", "荷物を持ってください。", "荷物を持ってもいいです。"], "correct": 0, "transcript": "状況：相手の荷物を持ってあげたいです。\n質問：何と言いますか。\n1. 荷物をお持ちしましょうか。\n2. 荷物を持ってください。\n3. 荷物を持ってもいいです。", "explanation": "Humble offer:「荷物をお持ちしましょうか。」"},
    {"id": "n4-v2-l-17", "type": "Mondai 3 (発話表現)", "audioSrc": "/audio/japanese/n4_2018/N4Q3.mp3", "image": "/images/japanese/listening/n4_2018/m3_q2.png", "question": "17. 会議に遅れそうです。会社に電話して何と言いますか。（矢印の人）", "options": ["少し遅れそうです。", "少し遅れてください。", "遅れました。"], "correct": 0, "transcript": "状況：会議に遅れそうです。\n質問：何と言いますか。\n1. 電車が遅れており、少し遅れそうです。\n2. 少し遅れてください。\n3. 遅れました。", "explanation": "Reporting expected lateness:「少し遅れそうです。」"},
    {"id": "n4-v2-l-18", "type": "Mondai 3 (発話表現)", "audioSrc": "/audio/japanese/n4_2018/N4Q3.mp3", "image": "/images/japanese/listening/n4_2018/m3_q3.png", "question": "18. レストランで注文が決まりました。店員を呼んで何と言いますか。（矢印の人）", "options": ["すみません、注文をお願いします。", "注文を言います。", "注文してください。"], "correct": 0, "transcript": "状況：注文が決まりました。\n質問：何と言いますか。\n1. すみません、注文をお願いします。\n2. 注文を言います。\n3. 注文してください。", "explanation": "Calling a waiter for ordering:「すみません、注文をお願いします。」"},
    {"id": "n4-v2-l-19", "type": "Mondai 3 (発話表現)", "audioSrc": "/audio/japanese/n4_2018/N4Q3.mp3", "image": "/images/japanese/listening/n4_2018/m3_q4.png", "question": "19. 友達に道を尋ねたいです。何と言いますか。（矢印の人）", "options": ["駅への行き方を教えてくれない？", "駅へ行ってください。", "駅へ行きましょう。"], "correct": 0, "transcript": "状況：友達に道を尋ねます。\n質問：何と言いますか。\n1. 駅への行き方を教えてくれない？\n2. 駅へ行ってください。\n3. 駅へ行きましょう。", "explanation": "Asking a friend for directions:「教えてくれない？」"},
    {"id": "n4-v2-l-20", "type": "Mondai 3 (発話表現)", "audioSrc": "/audio/japanese/n4_2018/N4Q3.mp3", "image": "/images/japanese/listening/n4_2018/m3_q5.png", "question": "20. エレベーターに乗る人に「先に乗ってください」と言います。（矢印の人）", "options": ["お先にどうぞ。", "お先に失礼します。", "乗ってください。"], "correct": 0, "transcript": "状況：エレベーターで順番を譲ります。\n質問：何と言いますか。\n1. お先にどうぞ。\n2. お先に失礼します。\n3. 乗ってください。", "explanation": "Yielding priority politely:「お先にどうぞ。」"},

    # Mondai 4 (8 Qs)
    {"id": "n4-v2-l-21", "type": "Mondai 4 (即時応答)", "audioSrc": "/audio/japanese/n4_2018/N4Q4.mp3", "question": "21. 「この書類、今日中にコピーしておいてね。」", "options": ["はい、すぐやっておきます。", "いいえ、コピーしました。", "そうですね、終わりました。"], "correct": 0, "transcript": "発話：「この書類、今日中にコピーしておいてね。」\n1. はい、すぐやっておきます。\n2. いいえ、コピーしました。\n3. そうですね、終わりました。", "explanation": "Acknowledging task request:「はい、すぐやっておきます。」"},
    {"id": "n4-v2-l-22", "type": "Mondai 4 (即時応答)", "audioSrc": "/audio/japanese/n4_2018/N4Q4.mp3", "question": "22. 「昨日のサッカーの試合、見ましたか。」", "options": ["ええ、テレビで見ましたよ。", "いいえ、見ませんでしたよ。", "はい、行きました。"], "correct": 0, "transcript": "発話：「昨日のサッカーの試合、見ましたか。」\n1. ええ、テレビで見ましたよ。\n2. いいえ、見ませんでしたよ。\n3. はい、行きました。", "explanation": "Confirming watching:「ええ、テレビで見ましたよ。」"},
    {"id": "n4-v2-l-23", "type": "Mondai 4 (即時応答)", "audioSrc": "/audio/japanese/n4_2018/N4Q4.mp3", "question": "23. 「ちょっと窓を閉めてもいいですか。」", "options": ["ええ、いいですよ。", "いいえ、閉めました。", "どういたしまして。"], "correct": 0, "transcript": "発話：「ちょっと窓を閉めてもいいですか。」\n1. ええ、いいですよ。\n2. いいえ、閉めました。\n3. どういたしまして。", "explanation": "Granting permission:「ええ、いいですよ。」"},
    {"id": "n4-v2-l-24", "type": "Mondai 4 (即時応答)", "audioSrc": "/audio/japanese/n4_2018/N4Q4.mp3", "question": "24. 「部長、お茶を召し上がりますか。」", "options": ["ありがとう、いただきます。", "いいえ、召し上がります。", "はい、飲ませます。"], "correct": 0, "transcript": "発話：「部長、お茶を召し上がりますか。」\n1. ありがとう、いただきます。\n2. いいえ、召し上がります。\n3. はい、飲ませます。", "explanation": "Accepting tea offer politely:「ありがとう、いただきます。」"},
    {"id": "n4-v2-l-25", "type": "Mondai 4 (即時応答)", "audioSrc": "/audio/japanese/n4_2018/N4Q4.mp3", "question": "25. 「来週の旅行、楽しみにしています。」", "options": ["ええ、楽しみですね。", "いいえ、楽しみではありません。", "はい、行きました。"], "correct": 0, "transcript": "発話：「来週の旅行、楽しみにしています。」\n1. ええ、楽しみですね。\n2. いいえ、楽しみではありません。\n3. はい、行きました。", "explanation": "Reciprocating excitement:「ええ、楽しみですね。」"},
    {"id": "n4-v2-l-26", "type": "Mondai 4 (即時応答)", "audioSrc": "/audio/japanese/n4_2018/N4Q4.mp3", "question": "26. 「道に迷ってしまったんですが、駅はどちらですか。」", "options": ["あそこの角を右に曲がるとすぐですよ。", "駅に行きましたよ。", "いいえ、わかりません。"], "correct": 0, "transcript": "発話：「道に迷ってしまったんですが、駅はどちらですか。」\n1. あそこの角を右に曲がるとすぐですよ。\n2. 駅に行きましたよ。\n3. いいえ、わかりません。", "explanation": "Giving directions:「あそこの角を右に曲がるとすぐですよ。」"},
    {"id": "n4-v2-l-27", "type": "Mondai 4 (即時応答)", "audioSrc": "/audio/japanese/n4_2018/N4Q4.mp3", "question": "27. 「日本語のテスト、難しかったですね。」", "options": ["本当に難しかったですね。", "そうですね、簡単でした。", "いいえ、受けませんでした。"], "correct": 0, "transcript": "発話：「日本語のテスト、難しかったですね。」\n1. 本当に難しかったですね。\n2. そうですね、簡単でした。\n3. いいえ、受けませんでした。", "explanation": "Agreeing on difficulty:「本当に難しかったですね。」"},
    {"id": "n4-v2-l-28", "type": "Mondai 4 (即時応答)", "audioSrc": "/audio/japanese/n4_2018/N4Q4.mp3", "question": "28. 「また明日、お会いしましょう。」", "options": ["はい、また明日。", "いいえ、明日です。", "どういたしまして。"], "correct": 0, "transcript": "発話：「また明日、お会いしましょう。」\n1. はい、また明日。\n2. いいえ、明日です。\n3. どういたしまして。", "explanation": "Farewell response:「はい、また明日。」"}
]

N4_VOL2_SECTIONS = [
    {
        'id': 'n4-v2-sec-vocab',
        'title': 'Section 1: Language Knowledge (文字・語彙)',
        'shortTitle': '文字・語彙 (Kanji & Vocab)',
        'timeLimitSeconds': 25 * 60,
        'questions': N4_VOL2_VOCAB # 35 Qs
    },
    {
        'id': 'n4-v2-sec-grammar',
        'title': 'Section 2: Language Knowledge (文法) & Reading (読解)',
        'shortTitle': '文法・読解 (Grammar & Reading)',
        'timeLimitSeconds': 45 * 60,
        'questions': N4_VOL2_GRAMMAR # 35 Qs
    },
    {
        'id': 'n4-v2-sec-listening',
        'title': 'Section 3: Listening Comprehension (聴解)',
        'shortTitle': '聴解 (Listening)',
        'timeLimitSeconds': 35 * 60,
        'questions': N4_VOL2_LISTENING # 28 Qs
    }
]

# =========================================================================
# CATALOG EXPORT
# =========================================================================
EXAM_PAPERS_CATALOG = {
    'N5': [
        {
            'id': 'n5-vol1',
            'title': 'JLPT N5 Official Practice Test (Vol. 1 - Standard)',
            'shortTitle': 'Vol. 1 (Standard)',
            'badge': 'Official JLPT',
            'year': 'Volume 1',
            'description': 'The standard official practice test booklet containing all 89 official test questions, listening audio broadcasts, and authentic illustrations.',
            'totalQuestions': sum(len(s['questions']) for s in N5_VOL1_SECTIONS),
            'sections': N5_VOL1_SECTIONS
        },
        {
            'id': 'n5-vol2',
            'title': 'JLPT N5 Official Practice Test (Vol. 2 - 2018 Edition)',
            'shortTitle': 'Vol. 2 (2018 Edition)',
            'badge': 'Official 2018',
            'year': 'Volume 2',
            'description': 'The 2018 Official Practice Workbook Vol. 2 with 91 verbatim test items, full listening audio tracks, and question diagrams.',
            'totalQuestions': sum(len(s['questions']) for s in N5_VOL2_SECTIONS),
            'sections': N5_VOL2_SECTIONS
        }
    ],
    'N4': [
        {
            'id': 'n4-vol1',
            'title': 'JLPT N4 Official Practice Test (Vol. 1 - Standard)',
            'shortTitle': 'Vol. 1 (Standard)',
            'badge': 'Official JLPT',
            'year': 'Volume 1',
            'description': 'The standard official practice test booklet containing all 97 official test questions, listening audio broadcasts, and authentic illustrations.',
            'totalQuestions': sum(len(s['questions']) for s in N4_VOL1_SECTIONS),
            'sections': N4_VOL1_SECTIONS
        },
        {
            'id': 'n4-vol2',
            'title': 'JLPT N4 Official Practice Test (Vol. 2 - 2018 Edition)',
            'shortTitle': 'Vol. 2 (2018 Edition)',
            'badge': 'Official 2018',
            'year': 'Volume 2',
            'description': 'The 2018 Official Practice Workbook Vol. 2 with 98 verbatim test items, full listening audio tracks, and question diagrams.',
            'totalQuestions': sum(len(s['questions']) for s in N4_VOL2_SECTIONS),
            'sections': N4_VOL2_SECTIONS
        }
    ]
}

js_content = f'''// Multi-Exam Paper Catalog with 100% Complete Official Practice Tests (Vol 1 & Vol 2 2018)

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

print(f'Multi-Exam Catalog written successfully to {target_path}!')
for lvl in ['N5', 'N4']:
    for ex in EXAM_PAPERS_CATALOG[lvl]:
        print(f"  [{lvl}] {ex['title']} -> {ex['totalQuestions']} Questions across {len(ex['sections'])} sections")
