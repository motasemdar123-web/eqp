/**
 * Komatsu Heavy Equipment Components & Parts Dictionary (建機部品図鑑)
 * Categorized by system, structure, and workshop inspection routines.
 */

export const MACHINE_MODELS = [
  {
    id: 'excavator',
    name: 'Hydraulic Excavator (油圧ショベル / ショベルカー)',
    japanese: '油圧ショベル',
    reading: 'ゆあつショベル (Yuatsu Shoberu)',
    description: 'PC200 / PC400 / PC500LC Series Excavators',
    systems: ['work_equipment', 'upper_structure', 'undercarriage', 'hydraulic_system', 'engine_system']
  },
  {
    id: 'wheel_loader',
    name: 'Wheel Loader (ホイールローダー)',
    japanese: 'ホイールローダー',
    reading: 'ホイールローダー (Hoiiru Roodaa)',
    description: 'WA380 / WA470 / WA500 Series Loaders',
    systems: ['work_equipment', 'powertrain', 'hydraulic_system', 'operator_cab']
  },
  {
    id: 'bulldozer',
    name: 'Bulldozer (ブルドーザー)',
    japanese: 'ブルドーザー',
    reading: 'ブルドーザー (Burudoozaa)',
    description: 'D65 / D85 / D155 / D275 Series Crawler Dozers',
    systems: ['work_equipment', 'undercarriage', 'powertrain', 'engine_system']
  }
];

export const MACHINE_SYSTEM_CATEGORIES = [
  { id: 'all', label: 'All Components (全パーツ)', icon: '⚙️' },
  { id: 'work_equipment', label: 'Work Equipment (作業機)', icon: '🚜' },
  { id: 'upper_structure', label: 'Upper Structure (上部旋回体)', icon: '🔄' },
  { id: 'undercarriage', label: 'Undercarriage (下部走行体)', icon: '⛓️' },
  { id: 'hydraulic_system', label: 'Hydraulic System (油圧装置)', icon: '💧' },
  { id: 'engine_system', label: 'Engine & Filters (エンジン・フィルター)', icon: '🔥' },
  { id: 'powertrain', label: 'Power Train & Drive (動力伝達装置)', icon: '⚡' },
  { id: 'operator_cab', label: 'Operator Cab & Controls (運転席・操作部)', icon: '💺' }
];

export const MACHINE_COMPONENTS = [
  // --- Work Equipment (作業機) ---
  {
    id: 'boom',
    system: 'work_equipment',
    machine: 'excavator',
    kanji: 'ブーム',
    reading: 'ブーム (Būmu)',
    english: 'Boom',
    arabic: 'ذراع الرفع الرئيسي (البوم)',
    description: 'Main structural lifting arm connected directly to the upper structure swing frame.',
    inspectionPhrase: 'ブーム溶接部のクラック及び油圧配管の損傷を点検してください。',
    inspectionEnglish: 'Please inspect the boom weld sections for cracks and hydraulic piping for damage.',
    komatsuCategory: 'Structure & Linkage',
    typicalFailures: ['Weld crack (溶接割れ)', 'Bush wear (ブッシュ摩耗)', 'Cylinder seal leak (シリンダーシール漏れ)']
  },
  {
    id: 'arm',
    system: 'work_equipment',
    machine: 'excavator',
    kanji: 'アーム',
    reading: 'アーム (Āmu)',
    english: 'Arm / Stick / Dipper',
    arabic: 'الذراع الأوسط (الآرم / اليد)',
    description: 'Articulating arm connecting the boom to the bucket assembly.',
    inspectionPhrase: 'アームシリンダーのロッド部に傷や油漏れがないか確認する。',
    inspectionEnglish: 'Check if there are scratches or oil leaks on the arm cylinder rod.',
    komatsuCategory: 'Structure & Linkage',
    typicalFailures: ['Rod scoring (ロッド傷)', 'Pin play (ピンガタ)', 'Hose abrasion (ホース摩耗)']
  },
  {
    id: 'bucket',
    system: 'work_equipment',
    machine: 'excavator',
    kanji: 'バケット',
    reading: 'バケット (Baketto)',
    english: 'Bucket',
    arabic: 'الغرفة / الباكت (الدلو)',
    description: 'Ground-engaging excavation attachment equipped with teeth (adapters) and side cutters.',
    inspectionPhrase: 'バケットツースの摩耗限界およびロックピンの脱落を確認してください。',
    inspectionEnglish: 'Verify bucket tooth wear limit and ensure locking pins are not missing.',
    komatsuCategory: 'Ground Engaging Tools (G.E.T.)',
    typicalFailures: ['Tooth wear (ツース摩耗)', 'Side cutter crack (サイドカッター割れ)', 'Lip plate deformation (リップ変形)']
  },
  {
    id: 'bucket_tooth',
    system: 'work_equipment',
    machine: 'excavator',
    kanji: 'バケットツース',
    reading: 'バケットツース (Baketto Tsūsu)',
    english: 'Bucket Teeth / Point',
    arabic: 'أسنان الباكت (الظفر)',
    description: 'Replaceable wear teeth mounted on the front edge adapter of the bucket.',
    inspectionPhrase: '摩耗したツースは早期に新品へ交換してください。',
    inspectionEnglish: 'Replace worn teeth with new ones promptly to protect the bucket adapter.',
    komatsuCategory: 'G.E.T. Consumables',
    typicalFailures: ['Missing pin (ピン抜け)', 'Tip fracture (先端折損)']
  },
  {
    id: 'hydraulic_cylinder',
    system: 'hydraulic_system',
    machine: 'excavator',
    kanji: '油圧シリンダー',
    reading: 'ゆあつシリンダー (Yuatsu Shirindaa)',
    english: 'Hydraulic Cylinder',
    arabic: 'بستم هيدروليك / أسطوانة هيدروليكية',
    description: 'Actuator converting hydraulic fluid pressure into linear mechanical motion for boom, arm, or bucket.',
    inspectionPhrase: 'シリンダーロッドのオイル漏れ及びダストシールの破損を点検する。',
    inspectionEnglish: 'Inspect cylinder rod oil leakage and dust seal integrity.',
    komatsuCategory: 'Hydraulics',
    typicalFailures: ['Wiper seal failure (ワイパーシール破損)', 'Piston seal bypass (ピストンシール漏れ)']
  },

  // --- Undercarriage (下部走行体) ---
  {
    id: 'track_shoe',
    system: 'undercarriage',
    machine: 'excavator',
    kanji: '履帯 / シュー',
    reading: 'りたい / シュー (Ritai / Shū)',
    english: 'Track Shoe / Crawler Track',
    arabic: 'الجنزير / بلاطة الجنزير',
    description: 'Steel plates linked together forming the endless tracks for machine mobility and weight distribution.',
    inspectionPhrase: '履帯の張り（テンション）とボルトの緩みを測定してください。',
    inspectionEnglish: 'Measure track tension sag and inspect shoe mounting bolts for looseness.',
    komatsuCategory: 'Undercarriage (UC)',
    typicalFailures: ['Loose bolts (ボルト緩み)', 'Link pitch elongation (リンクピッチ伸び)', 'Grouser wear (ラグ摩耗)']
  },
  {
    id: 'sprocket',
    system: 'undercarriage',
    machine: 'excavator',
    kanji: 'スプロケット',
    reading: 'スプロケット (Supuroketto)',
    english: 'Drive Sprocket',
    arabic: 'مسنن الجنزير (السبراكت)',
    description: 'Toothed wheel powered by final drive motor that drives the track link assembly.',
    inspectionPhrase: 'スプロケット歯の偏摩耗やクラックの有無を点検する。',
    inspectionEnglish: 'Inspect sprocket teeth for uneven wear and cracks.',
    komatsuCategory: 'Undercarriage (UC)',
    typicalFailures: ['Tooth tip wear (歯先摩耗)', 'Loose mounting bolts (取付ボルト緩み)']
  },
  {
    id: 'idler',
    system: 'undercarriage',
    machine: 'excavator',
    kanji: 'アイドラー',
    reading: 'アイドラー (Aidoraa)',
    english: 'Front Idler',
    arabic: 'عجلة التوجيه الأمامية (الآيدلر)',
    description: 'Front guide wheel connected to recoil spring and track tension adjuster cylinder.',
    inspectionPhrase: 'アイドラーフローティングシールの油漏れを点検してください。',
    inspectionEnglish: 'Inspect front idler floating seals for oil leaks.',
    komatsuCategory: 'Undercarriage (UC)',
    typicalFailures: ['Floating seal oil leak (フローティングシール油漏れ)', 'Guide flange wear (ツバ摩耗)']
  },
  {
    id: 'track_roller',
    system: 'undercarriage',
    machine: 'excavator',
    kanji: 'トラックローラー',
    reading: 'トラックローラー (Torakku Rōraa)',
    english: 'Track Roller (Bottom Roller)',
    arabic: 'بكرات الجنزير السفلية (الرولر)',
    description: 'Bottom rollers supporting the heavy weight of the machine along the track chain.',
    inspectionPhrase: '下部ローラーの回転不良および油漏れを日常点検で確認する。',
    inspectionEnglish: 'Confirm smooth rotation and check for oil leakage on bottom track rollers.',
    komatsuCategory: 'Undercarriage (UC)',
    typicalFailures: ['Seized bearing (焼付き)', 'Seal leak (シール漏油)']
  },
  {
    id: 'carrier_roller',
    system: 'undercarriage',
    machine: 'excavator',
    kanji: 'キャリアローラー',
    reading: 'キャリアローラー (Kyaria Rōraa)',
    english: 'Carrier Roller (Top Roller)',
    arabic: 'بكرات الجنزير العلوية',
    description: 'Top roller supporting the upper strand of the track shoe chain.',
    inspectionPhrase: '上部キャリアローラーに泥詰まりがないか確認する。',
    inspectionEnglish: 'Check if top carrier rollers are free from mud buildup.',
    komatsuCategory: 'Undercarriage (UC)',
    typicalFailures: ['Mud locking (泥噛み固着)', 'Tread wear (踏面摩耗)']
  },

  // --- Upper Structure & Hydraulics (上部旋回体 & 油圧) ---
  {
    id: 'hydraulic_pump',
    system: 'hydraulic_system',
    machine: 'excavator',
    kanji: 'メイン油圧ポンプ',
    reading: 'メインゆあつポンプ (Mein Yuatsu Ponpu)',
    english: 'Main Hydraulic Pump',
    arabic: 'مضخة الهيدروليك الرئيسية (المين بامب)',
    description: 'Variable displacement axial piston pump generating high pressure fluid (up to 38 MPa).',
    inspectionPhrase: 'メインポンプの吐出圧力および異音・振動を計測する。',
    inspectionEnglish: 'Measure main pump discharge pressure and check for abnormal noise or vibration.',
    komatsuCategory: 'Hydraulic Power Unit',
    typicalFailures: ['Cavitation noise (キャビテーション異音)', 'Pressure drop (圧力低下)', 'Swash plate scoring (斜板傷)']
  },
  {
    id: 'control_valve',
    system: 'hydraulic_system',
    machine: 'excavator',
    kanji: 'コントロールバルブ',
    reading: 'コントロールバルブ (Kontorōru Barubu)',
    english: 'Main Control Valve (MCV)',
    arabic: 'مجمع صمامات التحكم (الكونترول فالف)',
    description: 'Multi-spool valve manifold directing hydraulic flow from pumps to each working actuator.',
    inspectionPhrase: 'コントロールバルブブロック各スプール部の油にじみを点検する。',
    inspectionEnglish: 'Inspect all spool sections of the control valve block for oil seepage.',
    komatsuCategory: 'Hydraulic Controls',
    typicalFailures: ['Spool sticking (スプール固着)', 'O-ring blowout (Oリング破損)', 'Internal leakage (内部リーク)']
  },
  {
    id: 'swing_motor',
    system: 'upper_structure',
    machine: 'excavator',
    kanji: '旋回モーター / 減速機',
    reading: 'せんかいモーター / げんそくき (Senkai Mōtā / Gensokuki)',
    english: 'Swing Motor & Reduction Gearbox',
    arabic: 'موتور الدوران والجيربكس',
    description: 'Hydraulic motor and planetary gear reducer that rotates the 360-degree upper structure.',
    inspectionPhrase: '旋回減速機のギヤオイル量および旋回ブレーキ作動を確認する。',
    inspectionEnglish: 'Verify swing gearbox oil level and inspect swing parking brake operation.',
    komatsuCategory: 'Swing Mechanism',
    typicalFailures: ['Swing play / backlash (旋回ガタ)', 'Gear oil contamination (ギヤ油劣化)', 'Brake drag (ブレーキ引きずり)']
  },
  {
    id: 'swing_circle',
    system: 'upper_structure',
    machine: 'excavator',
    kanji: '旋回サークル / スイングベアリング',
    reading: 'せんかいサークル (Senkai Saakuru)',
    english: 'Swing Bearing / Slewing Ring',
    arabic: 'كرسي الدوران (صينية الدوران)',
    description: 'Large diameter internal geared bearing connecting upper frame to undercarriage frame.',
    inspectionPhrase: '旋回ベアリングへのグリース給脂を規定時間毎に実施する。',
    inspectionEnglish: 'Perform regular greasing of the swing slewing ring bearing at specified intervals.',
    komatsuCategory: 'Structure & Bearing',
    typicalFailures: ['Grease starvation (グリース不足)', 'Tooth chipping (ピニオン歯欠け)']
  },

  // --- Engine & Filtration (エンジン & フィルター) ---
  {
    id: 'engine_assembly',
    system: 'engine_system',
    machine: 'excavator',
    kanji: 'ディーゼルエンジン',
    reading: 'ディーゼルエンジン (Dīzeru Enjin)',
    english: 'Diesel Engine (Komatsu SAA6D Series)',
    arabic: 'محرك الديزل (كوماتسو)',
    description: 'Direct-injection, turbocharged, aftercooled diesel powerhouse (e.g. SAA6D107E, SAA6D125E, SAA6D140E).',
    inspectionPhrase: 'エンジンオイルのレベルおよび冷却水（LLC）の量を始業前に点検する。',
    inspectionEnglish: 'Inspect engine oil level and coolant (LLC) quantity prior to daily startup.',
    komatsuCategory: 'Engine Prime Mover',
    typicalFailures: ['Overheating (オーバーヒート)', 'Blowby gas increase (ブローバイ過大)', 'Oil consumption (オイル減り)']
  },
  {
    id: 'engine_oil_filter',
    system: 'engine_system',
    machine: 'excavator',
    kanji: 'エンジンオイルフィルター',
    reading: 'エンジンオイルフィルター (Enjin Oiru Firutaa)',
    english: 'Engine Oil Filter Cartridge',
    arabic: 'فلتر زيت المحرك',
    description: 'Spin-on full-flow filter trapping carbon soot and metal particles.',
    inspectionPhrase: '500時間毎にエンジンオイルとフィルターエレメントを同時交換してください。',
    inspectionEnglish: 'Replace the engine oil and filter element concurrently every 500 operating hours.',
    komatsuCategory: 'Periodic Maintenance Parts',
    typicalFailures: ['Filter clogging (フィルター詰まり)', 'Gasket leakage (パッキン漏油)']
  },
  {
    id: 'fuel_filter_separator',
    system: 'engine_system',
    machine: 'excavator',
    kanji: '燃料プレフィルター / 油水分離器',
    reading: 'ねんりょうプレフィルター / ゆすいぶんりき (Nenryō Purefirutaa / Yusui Bunriki)',
    english: 'Fuel Pre-Filter & Water Separator',
    arabic: 'فلتر الديزل وفاصوليا فصل الماء',
    description: 'Separates condensation water and coarse dirt from diesel fuel to protect common rail injectors.',
    inspectionPhrase: '水分離器底部のドレンプラグを緩めて溜まった水を毎日排出する。',
    inspectionEnglish: 'Loosen the drain plug at the bottom of the water separator daily to drain accumulated water.',
    komatsuCategory: 'Fuel System',
    typicalFailures: ['Water sensor alarm (水混入警告)', 'Injector damage (インジェクター破損)']
  },
  {
    id: 'hydraulic_oil_filter',
    system: 'hydraulic_system',
    machine: 'excavator',
    kanji: '油圧作動油フィルター (リターンフィルター)',
    reading: 'ゆあつさどうゆフィルター (Yuatsu Sadōyu Firutaa)',
    english: 'Hydraulic Tank Return Filter Element',
    arabic: 'فلتر الهيدروليك الراجع داخل التانكي',
    description: 'Micronic glass-fiber filter element cleaning return fluid before entering the hydraulic tank.',
    inspectionPhrase: '油圧フィルター交換時はタンク内に金属粉や異物がないか目視点検する。',
    inspectionEnglish: 'When changing hydraulic filters, visually inspect the tank for metal particles or debris.',
    komatsuCategory: 'Hydraulic Maintenance',
    typicalFailures: ['Clogged bypass valve opened (バイパス作動)', 'Metal filings (金属粉付着)']
  },
  {
    id: 'air_cleaner',
    system: 'engine_system',
    machine: 'excavator',
    kanji: 'エアクリーナーエレメント',
    reading: 'エアクリーナーエレメント (Ea Kuriinaa Eremento)',
    english: 'Air Cleaner Element (Outer/Inner)',
    arabic: 'فلتر الهواء (الخارجي والداخلي)',
    description: 'Double element air filter preventing desert dust and silica particles from entering combustion chambers.',
    inspectionPhrase: 'ダストインジケーターが赤色を表示したらアウターエレメントを清掃または交換する。',
    inspectionEnglish: 'If the dust indicator shows red, clean or replace the outer air filter element immediately.',
    komatsuCategory: 'Intake System',
    typicalFailures: ['Dust indicator tripped (目詰まり表示)', 'Inner element soiled (インナー汚れ)']
  },

  // --- Operator Cab & Controls (運転席 & 操作部) ---
  {
    id: 'operator_monitor',
    system: 'operator_cab',
    machine: 'excavator',
    kanji: 'マルチモニター / コマツEMMS',
    reading: 'マルチモニター (Maruchi Monitā)',
    english: 'Multi-Function Machine Monitor (KOMTRAX / EMMS)',
    arabic: 'شاشة التحكم المركزية (نظام المراقبة)',
    description: 'High-resolution cockpit LCD displaying fault codes, hydraulic modes (P, E, L, B, ATT), and fuel economy.',
    inspectionPhrase: '始動時にモニターのエラーコード（故障コード）の点灯がないか確認する。',
    inspectionEnglish: 'Verify that no fault error codes are illuminated on the monitor panel upon startup.',
    komatsuCategory: 'Electrical & Monitoring',
    typicalFailures: ['Error code display (エラーコード表示)', 'Sensor signal loss (センサー断線)']
  },
  {
    id: 'safety_lock_lever',
    system: 'operator_cab',
    machine: 'excavator',
    kanji: '安全ロックレバー',
    reading: 'あんぜんロックレバー (Anzen Rokku Rebaa)',
    english: 'Safety Hydraulic Lockout Lever',
    arabic: 'ذراع أمان قفل الهيدروليك',
    description: 'Pilot hydraulic cut-off lever that mechanically locks all joystick controls when exiting the operator seat.',
    inspectionPhrase: '運転席から離れる際は必ず安全ロックレバーを「ロック位置」にしてください。',
    inspectionEnglish: 'Always pull the safety lock lever to the LOCKED position before leaving the operator cab.',
    komatsuCategory: 'Safety Mechanism',
    typicalFailures: ['Microswitch failure (リミットスイッチ故障)', 'Lever binding (レバー固着)']
  }
];

export const WORKSHOP_5S_EQUIPMENT_RULES = [
  {
    rule: '整理 (Seiri) - Sort',
    japanese: '不要な部品や廃油・古フィルターを直ちに分別して廃棄する。',
    english: 'Immediately segregate and dispose of unwanted scrap parts, waste oil, and used filters.',
    point: 'Keep only necessary Komatsu parts in the active repair bay.'
  },
  {
    rule: '整頓 (Seiton) - Set in Order',
    japanese: '特工・トルクレンチ・SST（特殊工具）は定位置に明示して保管する。',
    english: 'Clearly label and store torque wrenches, specialized Komatsu service tools (SST) in designated racks.',
    point: 'Tool availability within 30 seconds reduces machine downtime.'
  },
  {
    rule: '清掃 (Seisou) - Shine & Clean',
    japanese: '油圧機器の分解前には外部の泥・油汚れを高圧洗浄で完全に落とす。',
    english: 'Thoroughly wash away exterior mud and grease with high pressure before dismantling hydraulic valves/pumps.',
    point: 'Contamination prevention is the #1 rule in hydraulic maintenance.'
  },
  {
    rule: '清潔 (Seiketsu) - Standardize',
    japanese: '作業服・保護具（ヘルメット・安全靴・保護メガネ）の着用を標準化する。',
    english: 'Standardize the proper wearing of PPE (hard hat, safety shoes, safety goggles) at all times.',
    point: 'Maintain clean, hazard-free workshop bays.'
  },
  {
    rule: '躾 (Shitsuke) - Sustain / Discipline',
    japanese: '作業前点検と作業後の「指差呼称（ヨシ！）」を習慣化する。',
    english: 'Habituate pre-job inspection and post-job Pointing and Calling ("Yoshi!").',
    point: 'Discipline prevents catastrophic field accidents.'
  }
];
