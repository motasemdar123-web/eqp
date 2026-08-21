/**
 * Japanese Business Email Templates & Keigo Matrix for Heavy Equipment Operations
 * (コマツ技術連絡・ビジネスメール＆敬語工房)
 */

export const BUSINESS_EMAIL_TEMPLATES = [
  {
    id: 'urgent_quotation',
    category: 'Parts & Procurement (部品調達)',
    title: 'Urgent Quotation & Delivery Inquiry (至急見積・納期確認のご依頼)',
    badge: 'Urgent EO',
    description: 'Formal request to Komatsu Middle East / Japan for an emergency spare parts quotation and express air shipment.',
    defaultParams: {
      recipientCompany: 'コマツ中東FZE (Komatsu Middle East FZE)',
      recipientName: '部品営業部 ご担当者様',
      senderCompany: 'DAR AL HAI GENERAL TRADING (ダル・アルハイ)',
      senderName: 'モタセム・ガーネム (Motasem Ghanem)',
      machineModel: 'PC500LC-10R',
      machineSerial: '100433',
      orderNumber: 'R158/2026',
      partNumber: '708-2L-04140 (Main Hydraulic Pump Assy)',
      quantity: '1台 (1 Unit)',
      urgencyReason: '顧客現場にて油圧ポンプ破損により重機停止中のため'
    },
    generateSubject: (p) => `【至急見積依頼】${p.machineModel}用部品手配の件（発注番号: ${p.orderNumber}）`,
    generateBody: (p) => `
${p.recipientCompany}
${p.recipientName}

いつも大変お世話になっております。
${p.senderCompany}の${p.senderName}でございます。

標記の件、弊社管理下の重機におきまして緊急の部品交換が必要となりましたため、
下記の通り至急の見積りおよび最短納期のご教示をお願い申し上げます。

■ 対象機械情報
・機種名: ${p.machineModel}
・機番（シリアル番号）: ${p.machineSerial}
・弊社管理番号: ${p.orderNumber}

■ 手配希望部品
・部品番号（品番）: ${p.partNumber}
・数量: ${p.quantity}
・手配区分: エマージェンシーオーダー（EO / 航空便希望）

■ 緊急手配の背景
${p.urgencyReason}

お客様の工事現場でのダウンタイムを最小限に抑えるため、
在庫状況および最短の出荷可能日を本日中にご回答いただけますと幸甚に存じます。

PDXポータル上での条件承認（Confirmed）も即時対応いたします。
お忙しいところ恐縮ではございますが、ご高配のほど何卒よろしくお願い申し上げます。

--------------------------------------------------
${p.senderCompany}
整備技術部 / 部品調達課
担当: ${p.senderName}
Email: parts@daralhai.com
--------------------------------------------------
`.trim()
  },

  {
    id: 'technical_assistance',
    category: 'Technical Support (技術サポート)',
    title: 'Equipment Fault Technical Assistance (重機故障・技術支援のご相談)',
    badge: 'Tech Service',
    description: 'Request for Komatsu field engineering guidance and diagnostic consultation on persistent electrical/hydraulic fault codes.',
    defaultParams: {
      recipientCompany: 'コマツ技術サービス部 (Komatsu Technical Service)',
      recipientName: 'フィールドサポート課 ご担当者様',
      senderCompany: 'DAR AL HAI WORKSHOP',
      senderName: 'モタセム・ガーネム (Motasem Ghanem)',
      machineModel: 'PC400-8R',
      machineSerial: '85421',
      orderNumber: 'TECH-2026-08',
      partNumber: 'EMMS Fault Code: CA441 / CA442 (Battery Voltage Low / Sensor Error)',
      quantity: 'Diagnostic Guide + Wiring Schematic',
      urgencyReason: 'エンジン始動直後にエラーコードが点灯し、油圧出力がセーフモード（出力制限）に入るため'
    },
    generateSubject: (p) => `【技術相談】${p.machineModel}（機番:${p.machineSerial}）トラブルシューティングのご相談`,
    generateBody: (p) => `
${p.recipientCompany}
${p.recipientName}

平素は格別のご高配を賜り、厚く御礼申し上げます。
${p.senderCompany}の${p.senderName}と申します。

弊社工場にて整備中の${p.machineModel}におきまして、
原因特定の困難な電気系・油圧トラブルが発生しており、ご相談申し上げます。

■ 対象機概要
・機種: ${p.machineModel}
・シリアル番号: ${p.machineSerial}
・稼働時間（SMR）: 4,850時間

■ 発生事象およびエラーコード
${p.partNumber}

■ 症状詳細
${p.urgencyReason}
現場にてバッテリー端子の導通およびオルタネーター電圧（27.8V）は確認済みですが、
コントローラー側の通信異常が疑われます。

つきましては、関連回路図（電気配線図）のご提供および、
推奨トラブルシューティング手順についてご教示いただけますと幸甚に存じます。

ご多忙の折、誠に恐れ入りますが、何卒ご指導のほどよろしくお願い申し上げます。

--------------------------------------------------
${p.senderCompany}
シニアエンジニア: ${p.senderName}
--------------------------------------------------
`.trim()
  },

  {
    id: 'warranty_claim',
    category: 'Warranty & Claims (保証申請)',
    title: 'Warranty Claim & Defective Part Return (保証クレーム申請書送付)',
    badge: 'Warranty',
    description: 'Formal notification to Komatsu warranty department regarding premature component failure under warranty period.',
    defaultParams: {
      recipientCompany: 'コマツ品質保証部 (Komatsu Quality Assurance)',
      recipientName: '保証クレーム担当 御中',
      senderCompany: 'DAR AL HAI HEAVY EQUIPMENT',
      senderName: 'モタセム・ガーネム (Motasem Ghanem)',
      machineModel: 'WA470-6 Wheel Loader',
      machineSerial: '72015',
      orderNumber: 'CLM-2026-014',
      partNumber: '421-46-H1120 (Transmission Control Valve)',
      quantity: '1点 (Defective Assembly)',
      urgencyReason: '納車後800時間にてソレノイドバルブコイルの内部短絡が発生したため'
    },
    generateSubject: (p) => `【保証クレーム申請】${p.machineModel}（機番:${p.machineSerial}）初期不具合の件`,
    generateBody: (p) => `
${p.recipientCompany}
${p.recipientName}

いつも大変お世話になっております。
${p.senderCompany}の${p.senderName}でございます。

標題の件につきまして、新車納入後保証期間内の${p.machineModel}におきまして、
部品の初期不具合が認められましたので、クレーム申請書および現場写真・KOMTRAXデータを添付にてご送付申し上げます。

■ クレーム申請内容
・機番: ${p.machineSerial}
・稼働時間: 800時間（保証期間内）
・不具合部品: ${p.partNumber}
・クレーム管理番号: ${p.orderNumber}
・原因概要: ${p.urgencyReason}

不具合現品は弊社ワークショップにて厳重に保管しており、
ご指示があり次第、調査用として貴社指定場所へ返送手配いたします。

添付のクレーム申請書をご査収の上、代替新品の手配および費用補償について
ご検討賜りますようお願い申し上げます。

--------------------------------------------------
${p.senderCompany}
保証管理担当: ${p.senderName}
--------------------------------------------------
`.trim()
  }
];

export const KEIGO_TRANSFORMATION_MATRIX = [
  {
    meaning: 'To do (する)',
    plain: 'する (suru)',
    teineigo: 'します (shimasu)',
    kenjougo: 'いたします / させていただきます',
    sonkeigo: 'なさいます / される',
    businessExample: '至急手配いたします。(We will arrange immediately.)'
  },
  {
    meaning: 'To go / come (行く・来る)',
    plain: '行く / 来る',
    teineigo: '行きます / 来ます',
    kenjougo: '伺う (ukagau) / 参る (mairu)',
    sonkeigo: 'いらっしゃる / お越しになる',
    businessExample: '明日現場へ伺います。(I will visit the site tomorrow.)'
  },
  {
    meaning: 'To say / tell (言う)',
    plain: '言う (iu)',
    teineigo: '言います (iimasu)',
    kenjougo: '申す (mōsu) / 申し上げる',
    sonkeigo: 'おっしゃる (ossharu)',
    businessExample: '担当のモタセムと申します。(My name is Motasem.)'
  },
  {
    meaning: 'To see / check (見る・点検する)',
    plain: '見る (miru)',
    teineigo: '見ます / 点検します',
    kenjougo: '拝見する (haiken suru)',
    sonkeigo: 'ご覧になる (goran ni naru)',
    businessExample: '添付の報告書をご査収ください。(Please review attached report.)'
  },
  {
    meaning: 'To know / understand (知る・了解する)',
    plain: '知っている / 分かった',
    teineigo: '知っています / 分かりました',
    kenjougo: '存じております / 承知いたしました',
    sonkeigo: 'ご存知です (go-zonji desu)',
    businessExample: '納期遅延の件、承知いたしました。(Understood regarding delivery delay.)'
  },
  {
    meaning: 'To receive (もらう・受ける)',
    plain: 'もらう (morau)',
    teineigo: 'もらいます / 受け取ります',
    kenjougo: 'いただく / 頂戴する (chōdai suru)',
    sonkeigo: 'お受け取りになる',
    businessExample: '見積書を頂戴できますでしょうか。(Could we receive the quotation?)'
  },
  {
    meaning: 'To send (送る・提出する)',
    plain: '送る (okuru)',
    teineigo: '送ります / 提出します',
    kenjougo: 'お送りする / 送付申し上げます',
    sonkeigo: 'ご送付くださる',
    businessExample: '点検データを送付申し上げます。(I am sending the inspection data.)'
  },
  {
    meaning: 'To meet / visit partner (会う)',
    plain: '会う (au)',
    teineigo: '会います (aimasu)',
    kenjougo: 'お目にかかる (o-me ni kakaru)',
    sonkeigo: 'お会いになる',
    businessExample: '展示会でお目にかかれれば幸甚です。(I look forward to meeting you at the expo.)'
  }
];
