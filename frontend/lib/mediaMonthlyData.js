export const CONTENT_PILLARS = [
  { id: 'pillar_heavy_iron', label: 'Heavy Iron Dominance', shortLabel: 'Heavy Iron', color: 'bg-amber-50 text-amber-800 border-amber-200', tagColor: 'amber', targetPct: 35, desc: 'Highlight power, fuel economy, and Japanese engineering durability in quarrying and earthworks.' },
  { id: 'pillar_parts_fluids', label: 'Genuine Parts & Fluids', shortLabel: 'Parts & Fluids', color: 'bg-sky-50 text-sky-800 border-sky-200', tagColor: 'sky', targetPct: 25, desc: 'Educate on total cost of ownership (TCO) and component protection against extreme heat and dust.' },
  { id: 'pillar_service_field', label: 'Service & Field Response', shortLabel: 'Field Service', color: 'bg-emerald-50 text-emerald-800 border-emerald-200', tagColor: 'emerald', targetPct: 25, desc: 'Build contractor confidence via certified mobile technicians, Komtrax monitoring, and quick dispatch.' },
  { id: 'pillar_commercial', label: 'Commercial & Lead Gen', shortLabel: 'Lead Gen', color: 'bg-rose-50 text-rose-800 border-rose-200', tagColor: 'rose', targetPct: 15, desc: 'Drive direct WhatsApp inquiries, scheduled fleet audits, and seasonal preventive maintenance kits.' },
  { id: 'pillar_authority', label: 'Brand Authority & Japanese Heritage', shortLabel: 'Brand Heritage', color: 'bg-sky-50 text-sky-800 border-sky-200', tagColor: 'sky', targetPct: 20, desc: 'Highlighting Komatsu Japanese precision, Dar Al Hay partnership, and Kuwait infrastructure leadership.' },
  { id: 'pillar_engineering', label: 'Technical & Product Specs', shortLabel: 'Tech Specs', color: 'bg-indigo-50 text-indigo-800 border-indigo-200', tagColor: 'indigo', targetPct: 25, desc: 'Deep-dive machine walkthroughs, specs, KOMTRAX telematics, and heavy-duty desert cooling systems.' },
  { id: 'pillar_workshop', label: 'Workshop BTS & Overhauls', shortLabel: 'Workshop BTS', color: 'bg-amber-50 text-amber-800 border-amber-200', tagColor: 'amber', targetPct: 20, desc: 'Certified engineers, engine overhauls, diagnostic testing, and parts warehouse inventory in Shuwaikh.' },
  { id: 'pillar_projects', label: 'Kuwait Jobsites & Case Studies', shortLabel: 'Jobsites', color: 'bg-emerald-50 text-emerald-800 border-emerald-200', tagColor: 'emerald', targetPct: 20, desc: 'Real-world machinery performance at Sabah Al-Ahmad Sea City, desert earthworks, and highway projects.' },
  { id: 'pillar_leadgen', label: 'After-Sales & Spare Parts', shortLabel: 'After-Sales', color: 'bg-rose-50 text-rose-800 border-rose-200', tagColor: 'rose', targetPct: 15, desc: 'Emergency field service, genuine parts direct delivery, EQP maintenance contracts, and machine sales.' },
];

export const FORMAT_TYPES = [
  { id: 'reel', label: 'Reels / Motion Video', shortLabel: 'Reel', tag: 'Motion Video', color: 'bg-purple-50 text-purple-800 border-purple-200' },
  { id: 'carousel', label: 'Carousels (Multi-Slide)', shortLabel: 'Carousel', tag: 'Swipe Deck', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  { id: 'photography', label: 'Hero Photography', shortLabel: 'Photo', tag: 'Photo Showcase', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  { id: 'designed_post', label: 'Technical Infographic', shortLabel: 'Infographic', tag: 'Graphic / Data', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  { id: 'cta_post', label: 'Conversion / Inquiry', shortLabel: 'Inquiry', tag: 'Direct Offer', color: 'bg-rose-50 text-rose-800 border-rose-200' },
];

export const GOAL_TYPES = [
  { id: 'brand_awareness', label: 'Brand Awareness & Authority', color: 'bg-sky-50 text-sky-800 border-sky-200' },
  { id: 'product_education', label: 'Product Education & Specs', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  { id: 'lead_generation', label: 'Lead Generation & Sales', color: 'bg-rose-50 text-rose-800 border-rose-200' },
  { id: 'trust_humanize', label: 'Engineering Craft & Trust', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  { id: 'case_study', label: 'Jobsite Validation & Case Study', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  { id: 'expertise', label: 'Preventive Maintenance Guide', color: 'bg-purple-50 text-purple-800 border-purple-200' },
];

export const PIPELINE_STAGES = [
  { id: 'idea', label: 'Concept Draft', shortLabel: 'Draft', badgeTone: 'neutral' },
  { id: 'scripted', label: 'Scripted & Briefed', shortLabel: 'Scripted', badgeTone: 'info' },
  { id: 'production', label: 'Filming / Designing', shortLabel: 'Filming', badgeTone: 'warning' },
  { id: 'review', label: 'Under Review', shortLabel: 'Review', badgeTone: 'yellow' },
  { id: 'ready', label: 'Ready to Publish', shortLabel: 'Ready', badgeTone: 'ready' },
  { id: 'published', label: 'Published', shortLabel: 'Published', badgeTone: 'ready' },
];

export const MEDIA_PLATFORMS = [
  { id: 'instagram', label: 'Instagram', code: 'IG', badgeTone: 'active', handle: '@daralhay_komatsu' },
  { id: 'linkedin', label: 'LinkedIn', code: 'LI', badgeTone: 'info', handle: 'Dar Al Hay Commercial Co.' },
  { id: 'facebook', label: 'Facebook', code: 'FB', badgeTone: 'ready', handle: 'Dar Al Hay - Komatsu Kuwait' },
];


export const TOV_GUIDELINES = {
  overall: {
    title: 'Dar Al Hay Brand Voice & Persona',
    summary: 'Authoritative, Precision-Driven, Industrial Strength, and Rooted in Kuwait Progress.',
    traits: [
      { name: 'Japanese Precision & Heritage', desc: 'Emphasize Komatsu factory standards, strict quality controls, and world-leading hydraulic engineering.' },
      { name: 'Kuwait Desert Toughness', desc: 'Acknowledge the harsh 50°C+ climate, fine desert sand, and heavy rock conditions in Kuwait and how our machines conquer them.' },
      { name: 'Unwavering Engineering Authority', desc: 'Talk like certified master engineers and fleet directors — avoid generic sales fluff, focus on uptime, SMR hours, fuel efficiency, and ROI.' },
      { name: 'Customer Partnership', desc: 'Frame Dar Al Hay not just as an equipment seller, but as an indispensable operational partner on Kuwait megaprojects.' },
    ],
  },
  platforms: {
    linkedin: {
      platform: 'LinkedIn',
      tone: 'Authoritative B2B Engineering & Fleet Economics',
      target: 'C-Suite, Procurement Directors, Project Managers, Fleet Supervisors',
      guidelines: 'Focus on total cost of ownership (TCO), fuel economy data, KOMTRAX satellite telemetry, preventive maintenance contracts, and Kuwait project case studies. Use professional terminology and structured bullet points.',
    },
    instagram: {
      platform: 'Instagram',
      tone: 'Visual, High-Energy, Cinematic, & Behind-The-Scenes',
      target: 'Heavy Machinery Operators, Young Engineers, Contractors, Brand Fans',
      guidelines: 'Lead with strong 3-second visual hooks, close-up engine sounds, slow-motion hydraulic action, golden hour desert shots, and relatable maintenance tips.',
    },
    facebook: {
      platform: 'Facebook',
      tone: 'Community-Focused, Accessible, Practical & Bilingual (Arabic First)',
      target: 'Local Subcontractors, Workshop Owners, Equipment Operators, General Public',
      guidelines: 'Clear value propositions, direct WhatsApp/phone contact CTAs, workshop open days, fast spare parts availability, and transparent service offerings in both Arabic and English.',
    },
  },
  doAndDont: [
    { do: 'Use exact technical terms (e.g., PC350LC-8M0, SAA6D114E-3 engine, KOMTRAX, KTCS traction).', dont: 'Use vague generic terms like "our big digger" or "super strong machine".' },
    { do: 'Provide bilingual copy (Arabic + English) with natural professional Gulf/Kuwait phrasing.', dont: 'Rely on automated literal translations that sound robotic or awkward.' },
    { do: 'Highlight certified engineers, PPE safety helmets, clean Shuwaikh workshop, and genuine parts.', dont: 'Show uncertified field repairs without safety gear or messy workshop environments.' },
    { do: 'Include clear Call To Actions with contact numbers, WhatsApp links, and showroom location.', dont: 'Leave posts with no next step for interested fleet managers.' },
  ],
  designerGuidelines: {
    title: 'Visual Assets Tone of Voice (Text on Pictures & Videos)',
    summary: 'Rules & directives for graphic designers and video editors on what typography, badges, and headlines to overlay directly on visuals.',
    colorPalette: [
      { name: 'Komatsu Yellow', hex: '#FFD100', text: '#000000', role: 'Primary accent, key badges, hook highlight' },
      { name: 'Industrial Navy', hex: '#0F172A', text: '#FFFFFF', role: 'Solid background cards, high-contrast containers' },
      { name: 'Pure White', hex: '#FFFFFF', text: '#0F172A', role: 'Primary text on dark background scrims' },
      { name: 'Safety Amber', hex: '#F59E0B', text: '#000000', role: 'Secondary callouts, warnings, KPI tags' },
      { name: 'Steel Gray', hex: '#475569', text: '#FFFFFF', role: 'Subtitles, metric units, borders' },
    ],
    safeZones: {
      reels916: 'Top 15% clear (profile/header), Bottom 22% clear (captions/audio/UI buttons), Sides 5% margin. Keep critical text within 1080x1080 center square.',
      portrait45: '10% margin on all sides. Center hook in top 35% or lower 30%.',
      square11: '8% padding margin on all sides.',
    },
    onImageRules: [
      { rule: 'Ultra-Punchy Headline (3–5 Words)', desc: 'Viewers scan images in under 1 second. Never write full paragraphs on photos — write bold claims like "BUILT FOR 52°C DESERT HEAT".' },
      { rule: 'Specific Technical Badge', desc: 'Always anchor the photo with the exact model number or spec badge (e.g., [KOMATSU PC350LC-8M0 • 35 TON]).' },
      { rule: 'Bilingual Lockup Harmony', desc: 'Place English technical headline in bold uppercase sans-serif; pair with natural Arabic phrase in modern clean geometric font (DIN / GE SS Two).' },
      { rule: 'Visual Scrim / Contrast Bar', desc: 'Never place raw white text on bright sand or reflective metal. Always use a subtle 40–60% dark gradient scrim or solid dark container pill.' },
      { rule: 'Clear On-Asset Micro-CTA', desc: 'Add subtle directional prompt: "Swipe for Specs 👉" or "📍 Shuwaikh Showroom" without cluttering the machine.' },
    ],
    onVideoRules: [
      { rule: '0:00–0:03 Hook Card Overlay', desc: 'Large high-contrast text bar stating the core intrigue (e.g. "CAN YOUR EXCAVATOR SURVIVE 52°C?"). 85% of users watch without sound!' },
      { rule: 'Lower-Third Engineering ID', desc: 'When staff or engineers appear, display: [Eng. Name] | Certified Komatsu Master Specialist | Dar Al Hay Kuwait.' },
      { rule: 'Technical Metric Popups', desc: 'Animate quick 1-2 second data badges synced with action: "+18% Fuel Economy", "350 Bar Hydraulic Pressure", "15,000 Parts in Shuwaikh".' },
      { rule: 'End-Card Outro (Last 3–4 Seconds)', desc: 'Clean lockup: Official Komatsu Distributor Logo + Dar Al Hay + Direct WhatsApp/Phone + Showroom Location.' },
    ],
    doAndDont: [
      { do: 'Use bold, high-contrast, condensed sans-serif fonts with solid backing.', dont: 'Use thin, script, or decorative fonts that wash out in bright desert sun.' },
      { do: 'Include exact machine codes (e.g. PC500LC, WA470, D155A).', dont: 'Use generic text like "Great Heavy Bulldozer" or "Super Strong Digger".' },
      { do: 'Keep image overlays under 20% total surface area to let machine visual shine.', dont: 'Cover the excavator bucket, hydraulic boom, or engine bay with giant text blocks.' },
      { do: 'Provide both English & Arabic on key hero slides and covers.', dont: 'Use awkward machine-translated Arabic that lacks Kuwaiti industrial fluency.' },
    ],
    headlineTemplates: [
      { category: 'Extreme Heat & Reliability', en: 'CONQUERING 52°C DESERT HEAT', ar: 'قهر حرارة الصحراء فوق 50 درجة مئوية' },
      { category: 'Japanese Engineering', en: 'JAPANESE PRECISION. KUWAIT TOUGHNESS.', ar: 'دقة يابانية.. لقوة تضاريس الكويت' },
      { category: 'Preventive Maintenance', en: 'ZERO DOWNTIME. MAXIMUM UPTIME.', ar: 'صفر توقف.. أعلى إنتاجية مستمرة' },
      { category: 'Genuine Parts', en: '100% GENUINE KOMATSU PARTS IN SHUWAIKH', ar: 'قطع غيار كوماتسو أصلية 100% في الشويخ' },
      { category: 'Megaproject Validation', en: 'POWERING KUWAIT MEGAPROJECTS', ar: 'نبني أضخم مشاريع البنية التحتية في الكويت' },
      { category: 'Fleet ROI', en: 'LOWER TCO. PROVEN 10,000+ HOUR ENDURANCE.', ar: 'تكلفة تشغيلية أقل.. واعتمادية تفوق 10,000 ساعة' },
    ],
    badgePresets: [
      'KOMATSU PC350LC-8M0',
      '50°C+ AMBIENT RATED',
      '15,000+ GENUINE PARTS IN STOCK',
      'DAR AL HAY OFFICIAL KUWAIT DISTRIBUTOR',
      '24/7 MOBILE DESERT FIELD CARE',
      'KOMTRAX SATELLITE TELEMETRY',
      'ZERO-HOUR CERTIFIED OVERHAUL',
    ],
  },
};

export const PRE_PRODUCTION_CHECKLIST = [
  { id: 'permits', category: 'Approvals & Access', task: 'Obtain worksite entry and filming permits (Kuwait Municipality / PAHW / KOC / Client).' },
  { id: 'safety', category: 'Safety & PPE', task: 'Ensure all filming crew and on-screen staff wear Komatsu safety vests, hard hats, and steel-toe boots.' },
  { id: 'cleaning', category: 'Asset Preparation', task: 'Pressure wash machine body, bucket, and tracks; ensure Komatsu & Dar Al Hay branding stickers are clean and visible.' },
  { id: 'camera', category: 'Camera & Lighting', task: 'Pack 4K gimbal stabilizer, wide-angle lens (16-35mm), macro lens for parts, and circular polarizer filter for desert glare.' },
  { id: 'audio', category: 'Audio Gear', task: 'Test dual wireless lapel microphones with deadcat wind protection for clear voiceover in windy desert conditions.' },
  { id: 'talent', category: 'Talent Briefing', task: 'Rehearse spoken script in both Arabic and English with certified service engineer prior to rolling camera.' },
];

export const INITIAL_MONTHLY_CAMPAIGNS = {
  "2026-08": {
    "monthId": "2026-08",
    "monthName": "August 2026",
    "themeTitle": "Extreme Desert Heat Endurance & 50°C+ Summer Resilience",
    "strategicGoal": "Position Komatsu high-ambient cooling systems and Dar Al Hay 24/7 mobile field response as the premier solution for zero summer downtime in Kuwait.",
    "targetKpi": "25 Qualified Fleet Inquiries • 180,000 Video Views in Kuwait • 95% Positive Engagement",
    "pillarDistribution": {
      "pillar_authority": 20,
      "pillar_engineering": 30,
      "pillar_workshop": 20,
      "pillar_projects": 15,
      "pillar_leadgen": 15
    },
    "concepts": [
      {
        "id": 101,
        "conceptNumber": 1,
        "week": "Week 1",
        "day": "Sunday",
        "publishDate": "2026-08-02",
        "title": "Hero Machine – PC350LC-8M0 Cinematic Brand Intro",
        "pillar": "pillar_authority",
        "format": "reel",
        "platforms": [
          "instagram",
          "linkedin",
          "facebook"
        ],
        "goal": "brand_awareness",
        "status": "published",
        "targetAudience": "Contractors, Government Infrastructure Stakeholders, Fleet Owners",
        "tov": "Cinematic, High-Impact, Authoritative Industrial",
        "summary": "Cinematic 25-sec video intro: Kuwait desert landscape -> Dar Al Hay facility -> Komatsu machine lineup -> Workshop engine rebuild -> Parts warehouse -> Engineering team -> Logo lockup.",
        "hook": {
          "spokenEn": "Built for the toughest desert terrain on earth. Meet Komatsu in Kuwait.",
          "spokenAr": "صُنعت لتقهر أصعب تضاريس الصحراء في العالم.. كوماتسو في الكويت.",
          "visualHook": "Rapid cinematic crash-zoom from drone altitude over South Kuwait desert directly into the heavy steel bucket of a Komatsu PC350LC digging through rock."
        },
        "scenes": [
          {
            "sceneNo": 1,
            "time": "0:00 - 0:04",
            "visual": "Drone establishing shot over Kuwait desert highway at sunrise; transition into low-angle PC350LC track moving forward.",
            "talentAction": "Machine operator swings boom smoothly into frame.",
            "audioVoiceoverEn": "Built for the toughest desert terrain on earth.",
            "audioVoiceoverAr": "صُنعت لتقهر أصعب تضاريس الصحراء في العالم..",
            "onScreenTextEn": "BUILT FOR KUWAIT | KOMATSU PC350LC",
            "onScreenTextAr": "صُنعت للكويت | كوماتسو PC350LC",
            "sfxMusic": "Deep cinematic sub drop + engine roar"
          },
          {
            "sceneNo": 2,
            "time": "0:04 - 0:10",
            "visual": "Match-cut to Dar Al Hay modern Shuwaikh facility exterior and heavy showroom.",
            "talentAction": "Service Engineer in Komatsu uniform walking purposefully toward camera carrying diagnostic tablet.",
            "audioVoiceoverEn": "Backed by Dar Al Hay’s certified engineering and complete local support.",
            "audioVoiceoverAr": "بدعم هندسي متكامل وخبرة معتمدة من دار الحي.",
            "onScreenTextEn": "OFFICIAL KOMATSU DISTRIBUTOR IN KUWAIT",
            "onScreenTextAr": "الموزع المعتمد لكوماتسو في الكويت",
            "sfxMusic": "Percussive riser"
          },
          {
            "sceneNo": 3,
            "time": "0:10 - 0:18",
            "visual": "Montage inside Shuwaikh workshop: Torque wrench clicking on cylinder head, hydraulic testing bench, parts warehouse.",
            "talentAction": "Master technician tightening manifold; sparks in soft background.",
            "audioVoiceoverEn": "Zero-hour rebuilds, 15,000+ genuine parts in stock, and 24/7 mobile field care.",
            "audioVoiceoverAr": "مراكز صيانة متطورة، أكثر من 15,000 قطعة غيار أصلية جاهزة، وفرق دعم ميداني 24/7.",
            "onScreenTextEn": "GENUINE PARTS • CERTIFIED OVERHAULS",
            "onScreenTextAr": "قطع أصلية • صيانة معتمدة",
            "sfxMusic": "Ratchet foley + synthesizer pulse"
          }
        ],
        "brollChecklist": [
          "Drone slow-mo flyby over desert excavator at sunrise",
          "Macro close-up of hydraulic hoses flexing under 350 bar",
          "Shuwaikh warehouse aisle showing barcoded genuine Komatsu yellow boxes"
        ],
        "postProductionNotes": "Warm desert contrast with true Komatsu yellow and navy grading.",
        "captionEn": "From high-speed national highway networks to deep desert earthworks, Komatsu heavy machinery powers Kuwait’s progress.\n\nBacked by Dar Al Hay’s factory-trained engineers, extensive genuine parts inventory in Shuwaikh, and 24/7 mobile field service.",
        "captionAr": "من شبكات الطرق السريعة ومشاريع البنية التحتية الكبرى إلى أضخم أعمال الردم والإنشاءات، تواصل معدات كوماتسو ريادتها في الكويت.\n\nمدعومة بخبرات دار الحي الهندسية المعتمدة، ومخزون متكامل من قطع الغيار الأصلية في الشويخ.",
        "hashtags": "#Komatsu #DarAlHay #KuwaitConstruction #HeavyMachinery #PC350LC #Excavator #KuwaitEngineers #Shuwaikh",
        "ctaText": "Visit our Shuwaikh showroom or call our heavy equipment sales desk.",
        "slides": []
      },
      {
        "id": 102,
        "conceptNumber": 2,
        "week": "Week 1",
        "day": "Tuesday",
        "publishDate": "2026-08-04",
        "title": "Dar Al Hay Complete Partnership Ecosystem",
        "pillar": "pillar_authority",
        "format": "carousel",
        "platforms": [
          "linkedin",
          "instagram",
          "facebook"
        ],
        "goal": "brand_awareness",
        "status": "published",
        "targetAudience": "Fleet Managers, Maintenance Directors, Construction Contractors",
        "tov": "Corporate, Educational, Consultative",
        "summary": "5-slide carousel explaining the relationship between Dar Al Hay & Komatsu, services provided, industries served, and contact CTA.",
        "hook": {
          "spokenEn": "More than just heavy machines: How Dar Al Hay protects your fleet lifecycle in Kuwait.",
          "spokenAr": "أكثر من مجرد توريد آليات.. كيف تحمي دار الحي استثمارك وأسطولك في الكويت.",
          "visualHook": "High-contrast graphic showing a Komatsu excavator split into 5 operational support sectors."
        },
        "scenes": [],
        "brollChecklist": [
          "Studio photo of Komatsu diagnostic tools",
          "Clean exterior photo of Shuwaikh service complex"
        ],
        "postProductionNotes": "1080x1350 vertical carousel format.",
        "captionEn": "Purchasing heavy machinery is an investment. Ensuring that machine delivers maximum uptime over 10,000+ operating hours is where Dar Al Hay makes the difference.\n\nSwipe through to see our complete engineering ecosystem.",
        "captionAr": "شراء المعدات الثقيلة استثمار استراتيجي. وضمان عمل هذه المعدات بأعلى كفاءة لأكثر من 10,000 ساعة تشغيل هو ما تصنعه شراكتك مع دار الحي.\n\nاسحب الشاشة للتعرف على التفاصيل.",
        "hashtags": "#DarAlHay #KomatsuKuwait #FleetManagement #PreventiveMaintenance #AssetLifecycle",
        "ctaText": "Swipe through to learn more -> Save this post for your fleet maintenance guide.",
        "slides": [
          {
            "slideNo": 1,
            "title": "Official Komatsu Partnership in Kuwait",
            "body": "Decades of engineering leadership delivering certified Japanese heavy machinery designed for high-ambient desert endurance."
          },
          {
            "slideNo": 2,
            "title": "Full Machinery Fleet Portfolio",
            "body": "Hydraulic excavators (20T to 50T), articulated haulers, large wheel loaders, and heavy bulldozers tailored for Kuwait rock and sand."
          },
          {
            "slideNo": 3,
            "title": "Industries We Power Every Day",
            "body": "Civil infrastructure, mega-highways, marine reclamation, coastal works, aggregate quarrying, and desert development."
          },
          {
            "slideNo": 4,
            "title": "Complete Lifecycle Care (EQP)",
            "body": "Scheduled 250h/500h/1000h preventive maintenance, KOMTRAX satellite telemetry, and oil analysis to prevent breakdowns."
          },
          {
            "slideNo": 5,
            "title": "Partner With Dar Al Hay Today",
            "body": "Contact our heavy equipment team to schedule your fleet inspection or request a customized maintenance proposal."
          }
        ]
      },
      {
        "id": 103,
        "conceptNumber": 3,
        "week": "Week 1",
        "day": "Thursday",
        "publishDate": "2026-08-06",
        "title": "Hero Machine on Site – Low-Angle Power Shot in South Kuwait",
        "pillar": "pillar_projects",
        "format": "photography",
        "platforms": [
          "instagram",
          "linkedin",
          "facebook"
        ],
        "goal": "brand_awareness",
        "status": "published",
        "targetAudience": "Civil Engineers, Project Directors, Equipment Enthusiasts",
        "tov": "Inspirational, Bold, High-Aesthetic Industrial",
        "summary": "Powerful low-angle environmental photograph of a Komatsu PC500LC operating at Sabah Al-Ahmad Sea City with golden hour sunset lighting.",
        "hook": {
          "spokenEn": "Power meets precision against the Kuwait golden hour.",
          "spokenAr": "القوة تجتمع مع الدقة مع غروب شمس الكويت.",
          "visualHook": "Ultra-low 24mm wide angle photo with dust backlighting."
        },
        "scenes": [],
        "brollChecklist": [
          "High-res photography from ground level looking up at boom",
          "Golden hour rim light catching sand dust"
        ],
        "postProductionNotes": "Sharpen metallic textures, enhance warm desert tones.",
        "captionEn": "Built to dominate heavy excavation in 50°C+ summer heat. The Komatsu PC500LC delivers relentless breakout force with advanced hydraulic efficiency.\n\n📍 On site in South Kuwait earthmoving projects.",
        "captionAr": "مصممة للعمل الشاق المتواصل في درجات حرارة تتجاوز 50 درجة مئوية. حفارة كوماتسو PC500LC تمنحك أقصى قوة كسر وحفر مع كفاءة استثنائية في استهلاك الوقود.\n\n📍 موقع العمل - جنوب الكويت.",
        "hashtags": "#Komatsu #PC500LC #HeavyEquipmentPhotography #KuwaitConstruction #DarAlHay #GoldenHour",
        "ctaText": "Follow @daralhay_komatsu for daily machinery operations.",
        "slides": []
      },
      {
        "id": 104,
        "conceptNumber": 4,
        "week": "Week 2",
        "day": "Sunday",
        "publishDate": "2026-08-09",
        "title": "Why Genuine Komatsu Parts? – The True Cost of Cheap Filters",
        "pillar": "pillar_engineering",
        "format": "carousel",
        "platforms": [
          "linkedin",
          "facebook",
          "instagram"
        ],
        "goal": "product_education",
        "status": "ready",
        "targetAudience": "Fleet Maintenance Engineers, Procurement Officers, Workshop Managers",
        "tov": "Analytical, Factual, Educational & Persuasive",
        "summary": "Explaining genuine parts reliability, exact tolerances, desert heat filtration, warranty protection, and long-term lifecycle savings.",
        "hook": {
          "spokenEn": "Are non-genuine filters costing you thousands in silent downtime? Here is the proof.",
          "spokenAr": "هل تكلفك قطع الغيار المقلدة آلاف الدنانير في التوقف المفاجئ؟ إليك الدليل العلمي.",
          "visualHook": "Microscope side-by-side graphic comparing genuine Komatsu micro-glass filter media vs generic paper filter."
        },
        "scenes": [],
        "brollChecklist": [
          "Macro cut-section of genuine hydraulic filter",
          "Barcoded packaging on warehouse shelves"
        ],
        "postProductionNotes": "Blueprint styling with clean callouts.",
        "captionEn": "In Kuwait’s fine sand and extreme summer temperatures, a substandard hydraulic filter can cause catastrophic pump failure in under 200 hours. Protect your investment with genuine Komatsu components.",
        "captionAr": "في بيئة العمل الصحراوية والحرارة الشديدة بالكويت، استخدام فلاتر غير أصلية قد يسبب أعطالاً مفاجئة في المضخات خلال أقل من 200 ساعة. احمِ استثمارك بقطع غيار كوماتسو الأصلية.",
        "hashtags": "#GenuineParts #KomatsuParts #DarAlHay #FleetMaintenance #HydraulicFilters #TCO",
        "ctaText": "Order genuine parts directly through our Shuwaikh warehouse.",
        "slides": [
          {
            "slideNo": 1,
            "title": "The Desert Filtration Challenge",
            "body": "Kuwait sand particles measure down to 5 microns. Aftermarket paper filters let up to 40% of micro-debris pass into your hydraulic pumps."
          },
          {
            "slideNo": 2,
            "title": "Micro-Glass Multi-Layer Media",
            "body": "Genuine Komatsu filters feature synthetic micro-glass fibers capturing 99.8% of micro-particles without restricting oil flow."
          },
          {
            "slideNo": 3,
            "title": "High-Temperature Oil Seals",
            "body": "Formulated to withstand 120°C continuous oil temperatures without hardening, cracking, or leaking hydraulic pressure."
          },
          {
            "slideNo": 4,
            "title": "Zero Warranty & Asset Risk",
            "body": "Genuine parts keep your factory warranty intact and preserve maximum resale value across your entire fleet."
          },
          {
            "slideNo": 5,
            "title": "15,000+ Lines in Shuwaikh",
            "body": "Direct access to Kuwait’s largest genuine Komatsu inventory with immediate site dispatch."
          }
        ]
      },
      {
        "id": 105,
        "conceptNumber": 5,
        "week": "Week 2",
        "day": "Tuesday",
        "publishDate": "2026-08-11",
        "title": "Machine Walkaround – WA600 Heavy Specs in Kuwait",
        "pillar": "pillar_engineering",
        "format": "reel",
        "platforms": [
          "instagram",
          "linkedin",
          "facebook"
        ],
        "goal": "product_education",
        "status": "ready",
        "targetAudience": "Contractors, Quarry Operators, Site Supervisors",
        "tov": "Instructive, Engaging, Expert-Led & Technical",
        "summary": "Service Engineer walks around the WA600 Wheel Loader and explains 3 critical design advantages for Kuwait quarry & earthmoving operations.",
        "hook": {
          "spokenEn": "3 reasons why contractors choose the Komatsu WA600 for heavy sand and quarry loading in Kuwait.",
          "spokenAr": "3 أسباب تجعل لودر كوماتسو WA600 الخيار الأول لشركات المقاولات والكسارات في الكويت.",
          "visualHook": "Engineer taps the massive 6.4 cubic meter reinforced bucket with a wrench, stepping into camera frame."
        },
        "scenes": [
          {
            "sceneNo": 1,
            "time": "0:00 - 0:05",
            "visual": "Engineer standing next to the massive front wheel of WA600, pointing up to lift arms.",
            "talentAction": "Engineer addresses camera with high energy.",
            "audioVoiceoverEn": "If you are moving thousands of tons of sand in Kuwait, here is why the WA600 dominates.",
            "audioVoiceoverAr": "إذا كنت تنقل آلاف الأطنان من الرمال والصخور في الكويت، إليك سر تفوق لودر كوماتسو WA600.",
            "onScreenTextEn": "KOMATSU WA600 | 3 KEY SPECS",
            "onScreenTextAr": "كوماتسو WA600 | 3 مميزات",
            "sfxMusic": "Energetic beat"
          },
          {
            "sceneNo": 2,
            "time": "0:05 - 0:12",
            "visual": "Open engine compartment showing high-ambient radiator core and auto-reversible cooling fan.",
            "talentAction": "Engineer demonstrates reversible fan dust purging.",
            "audioVoiceoverEn": "First: High-ambient cooling package with an auto-reversible fan that blows out desert sand build-up automatically.",
            "audioVoiceoverAr": "أولاً: نظام تبريد صحراوي ومروحة عكسية تنظف الرادياتير من الغبار تلقائياً.",
            "onScreenTextEn": "1. AUTO-REVERSIBLE FAN",
            "onScreenTextAr": "1. مروحة تبريد عكسية",
            "sfxMusic": "Air purge whoosh"
          }
        ],
        "brollChecklist": [
          "Gimbal orbit around front bucket",
          "Close-up of tire treads in soft sand"
        ],
        "postProductionNotes": "Crisp callout graphics pointing to mechanical elements.",
        "captionEn": "Technical walkaround of the powerhouse Komatsu WA600 Wheel Loader.\n\nEngineered for massive bucket payloads, rapid cycle times, and operator endurance in Kuwait’s toughest conditions.",
        "captionAr": "جولة تقنية سريعة للتعرف على أسرار لودر كوماتسو WA600 العملاق.\n\nمصمم للتحميل الثقيل وسرعة دورات العمل في أصعب مواقع الكويت.",
        "hashtags": "#KomatsuWA600 #WheelLoader #EarthmovingKuwait #DarAlHayEngineering #HeavyMachinery",
        "ctaText": "Comment \"WA600\" to receive the full technical spec sheet.",
        "slides": []
      },
      {
        "id": 106,
        "conceptNumber": 6,
        "week": "Week 2",
        "day": "Thursday",
        "publishDate": "2026-08-13",
        "title": "Inside Our Workshop – Engine & Component Overhaul Standards",
        "pillar": "pillar_workshop",
        "format": "reel",
        "platforms": [
          "linkedin",
          "instagram",
          "facebook"
        ],
        "goal": "trust_humanize",
        "status": "production",
        "targetAudience": "Fleet Directors, Heavy Equipment Mechanics, Business Owners",
        "tov": "Authentic, High-Craftsmanship, Industrial",
        "summary": "BTS inside the Dar Al Hay central workshop: diagnostic computers, cylinder honing, injector calibration, and precision torque wrenching.",
        "hook": {
          "spokenEn": "Behind the scenes where million-dollar heavy machines get restored to factory zero-hour precision.",
          "spokenAr": "خلف الكواليس.. كيف نعيد محركات الآليات الثقيلة إلى كفاءة الصفر ساعة في دار الحي.",
          "visualHook": "Overhead crane slowly lowering a massive 6-cylinder Komatsu turbo diesel engine block onto the rebuild stand."
        },
        "scenes": [],
        "brollChecklist": [
          "Macro slow-mo oil pouring over camshaft",
          "Electronic torque wrench digital beep readout"
        ],
        "postProductionNotes": "Industrial sound design with ratchet clicks.",
        "captionEn": "Factory-standard diagnostic equipment, Komatsu-certified master technicians, and genuine overhaul kits.\n\nStep inside the Dar Al Hay central service facility in Shuwaikh, Kuwait.",
        "captionAr": "أحدث أجهزة الفحص والتشخيص المعتمدة عالمياً، مع كادر فني معتمد وقطع غيار أصلية 100%.\n\nنظرة من داخل مركز صيانة دار الحي الرئيسي بالشويخ.",
        "hashtags": "#DarAlHayWorkshop #KomatsuService #EngineOverhaul #KuwaitEngineering #Shuwaikh",
        "ctaText": "Schedule a certified workshop overhaul for your fleet.",
        "slides": []
      },
      {
        "id": 107,
        "conceptNumber": 7,
        "week": "Week 3",
        "day": "Sunday",
        "publishDate": "2026-08-16",
        "title": "KOMTRAX Telematics – Satellite Fleet Intelligence on Your Phone",
        "pillar": "pillar_engineering",
        "format": "carousel",
        "platforms": [
          "linkedin",
          "facebook",
          "instagram"
        ],
        "goal": "product_education",
        "status": "scripted",
        "targetAudience": "Fleet Managers, Operations Directors, CFOs",
        "tov": "Data-Driven, Modern, Tech-Savvy",
        "summary": "How KOMTRAX satellite tracking monitors fuel burn, idle time, operator habits, and health codes live from any Kuwait jobsite.",
        "hook": {
          "spokenEn": "How Kuwait fleet owners monitor 50 machines across the desert from a single smartphone screen.",
          "spokenAr": "كيف يتابع مدراء الأساطيل في الكويت أكثر من 50 معدة في عمق الصحراء من شاشة هاتف واحدة؟",
          "visualHook": "Smartphone screen showing live satellite map of Kuwait with green machine status pins."
        },
        "scenes": [],
        "brollChecklist": [
          "KOMTRAX mobile app UI screencast",
          "Antenna module on top of excavator cab"
        ],
        "postProductionNotes": "High-tech graphic overlays with telemetry graphs.",
        "captionEn": "Never wonder where your diesel is going. KOMTRAX satellite telematics gives fleet directors real-time visibility into working hours, idle time, and maintenance alerts across Kuwait.\n\nSwipe through to see KOMTRAX in action.",
        "captionAr": "لا تدع الوقود يُهدر دون رقابة. نظام المتابعة عبر الأقمار الصناعية KOMTRAX يمنحك رؤية فورية لساعات التشغيل والوقود وحالة المعدات في أي موقع بالكويت.\n\nاسحب الشاشة للتعرف على النظام.",
        "hashtags": "#KOMTRAX #FleetTelematics #SmartConstruction #KomatsuKuwait #FleetEfficiency",
        "ctaText": "Activate KOMTRAX fleet tracking on your machinery today.",
        "slides": [
          {
            "slideNo": 1,
            "title": "Satellite-Connected Heavy Fleets",
            "body": "KOMTRAX transmitters broadcast machine location, SMR hours, and fuel consumption via satellite 24/7."
          },
          {
            "slideNo": 2,
            "title": "Eliminate Fuel Waste & Idle Time",
            "body": "Identify operators leaving engines idling during hot afternoon breaks. Cut monthly diesel bills by up to 18%."
          },
          {
            "slideNo": 3,
            "title": "Instant Error Code Alerts",
            "body": "Receive immediate alerts before a small sensor fault turns into an expensive site shutdown."
          },
          {
            "slideNo": 4,
            "title": "Automated Service Scheduling",
            "body": "Dar Al Hay engineers monitor your fleet hours remotely and schedule 250h/500h service before intervals lapse."
          },
          {
            "slideNo": 5,
            "title": "Complimentary with Komatsu Machines",
            "body": "Factory-installed on every new Komatsu machine delivered by Dar Al Hay in Kuwait."
          }
        ]
      },
      {
        "id": 108,
        "conceptNumber": 8,
        "week": "Week 3",
        "day": "Tuesday",
        "publishDate": "2026-08-18",
        "title": "Emergency Mobile Field Service – Dispatched to Abdali Highway",
        "pillar": "pillar_leadgen",
        "format": "reel",
        "platforms": [
          "instagram",
          "linkedin",
          "facebook"
        ],
        "goal": "lead_generation",
        "status": "scripted",
        "targetAudience": "Site Supervisors, Highway Contractors, Quarry Managers",
        "tov": "Urgent, Action-Oriented, Reassuring",
        "summary": "Follow Dar Al Hay’s heavy field service truck responding to an urgent hydraulic line call in the desert within 90 minutes.",
        "hook": {
          "spokenEn": "When a machine stops on a remote desert jobsite, this is our 90-minute mobile response team.",
          "spokenAr": "عندما تتوقف آلية في موقع صحراوي ناءٍ.. هكذا تستجيب فرق الصيانة الميدانية لدار الحي في 90 دقيقة.",
          "visualHook": "Service van headlights cutting through morning desert dust with mobile crane arm unfolding."
        },
        "scenes": [],
        "brollChecklist": [
          "Field truck rolling on desert road",
          "Technician using portable hydraulic hose crimper"
        ],
        "postProductionNotes": "Documentary style with fast cuts and urgent pacing.",
        "captionEn": "Downtime costs money. When unexpected field repairs happen on Kuwait jobsites, Dar Al Hay’s mobile service fleet brings certified engineers, hydraulic crimpers, and genuine parts directly to your machine.\n\n📞 24/7 Emergency Hotline ready for dispatch.",
        "captionAr": "كل دقيقة توقف تكلفك مالاً. عند حدوث أي طارئ في مواقع العمل بالكويت، تتحرك ورش دار الحي المتنقلة بكامل التجهيزات الهندسية وقطع الغيار الأصلية إلى موقعك مباشرة.\n\n📞 خط الطوارئ الميداني جاهز على مدار الساعة.",
        "hashtags": "#FieldService #EmergencyRepair #DarAlHay #KomatsuSupport #HeavyEquipmentService #KuwaitContractors",
        "ctaText": "Save our 24/7 Field Service Dispatch number in your phone today.",
        "slides": []
      },
      {
        "id": 109,
        "conceptNumber": 9,
        "week": "Week 3",
        "day": "Thursday",
        "publishDate": "2026-08-20",
        "title": "Undercarriage Wear Guide – Extending Track Life in Sand",
        "pillar": "pillar_workshop",
        "format": "carousel",
        "platforms": [
          "linkedin",
          "facebook",
          "instagram"
        ],
        "goal": "expertise",
        "status": "idea",
        "targetAudience": "Equipment Operators, Workshop Superintendents, Fleet Owners",
        "tov": "Educational, Practical, Maintenance-Focused",
        "summary": "Step-by-step visual guide on measuring track chain sag, sprocket wear, and pin turning to prevent premature track replacement.",
        "hook": {
          "spokenEn": "The 5-minute track inspection that saves fleet owners 8,000 KD in undercarriage wear.",
          "spokenAr": "فحص بسيط لمدة 5 دقائق يحمي جنازير آلياتك من التآكل ويوفر آلاف الدنانير.",
          "visualHook": "Engineer measuring track chain tension sag with a steel ruler against track shoe."
        },
        "scenes": [],
        "brollChecklist": [
          "Close-up of track shoe grouser bar height",
          "Comparison of sharp worn sprocket vs new Komatsu sprocket"
        ],
        "postProductionNotes": "Infographic style with dimension arrows.",
        "captionEn": "Undercarriage represents nearly 50% of an excavator’s lifetime maintenance cost. In Kuwait’s abrasive sand, proper track tension and timely pin turns extend chain life by thousands of hours.\n\nSwipe through for our master technician’s undercarriage guide.",
        "captionAr": "تمثل الجنازير والقطع السفلية نحو 50% من تكلفة صيانة الحفارة على مدار عمرها. في رمال الكويت الحارقة، الضبط الصحيح للشد وتدوير المسامير في الوقت المناسب يضاعف عمر الجنزير.\n\nاسحب الشاشة للتعرف على نصائح الفحص.",
        "hashtags": "#Undercarriage #TrackMaintenance #ExcavatorTracks #PreventiveMaintenance #KomatsuKuwait #DarAlHay",
        "ctaText": "Book a free undercarriage wear inspection by Dar Al Hay certified engineers.",
        "slides": [
          {
            "slideNo": 1,
            "title": "Check Track Chain Tension Sag",
            "body": "Tracks that are too tight increase bushing friction by 300% in sand. Maintain 10–15mm sag per Komatsu factory specs."
          },
          {
            "slideNo": 2,
            "title": "Inspect Drive Sprocket Teeth",
            "body": "Worn pointed sprocket teeth accelerate link damage. Replace before teeth wear down to a sharp profile."
          },
          {
            "slideNo": 3,
            "title": "Turn Pins & Bushings at 3,000h",
            "body": "Turning pins 180 degrees doubles bushing life before full replacement is required."
          },
          {
            "slideNo": 4,
            "title": "Clean Sand Packed in Rollers",
            "body": "Packed clay and sand lock carrier rollers, creating flat spots on steel rollers."
          },
          {
            "slideNo": 5,
            "title": "Free Ultrasonic Wear Measurement",
            "body": "Contact Dar Al Hay for an on-site ultrasonic undercarriage wear report for your entire fleet."
          }
        ]
      },
      {
        "id": 110,
        "conceptNumber": 10,
        "week": "Week 4",
        "day": "Sunday",
        "publishDate": "2026-08-23",
        "title": "Komatsu D155A Heavy Dozer – Pushing Desert Dunes in South Kuwait",
        "pillar": "pillar_projects",
        "format": "reel",
        "platforms": [
          "instagram",
          "linkedin",
          "facebook"
        ],
        "goal": "case_study",
        "status": "idea",
        "targetAudience": "Earthmoving Contractors, Highway Builders, Land Reclamation Firms",
        "tov": "Massive Power, High-Octane, Cinematic",
        "summary": "High-energy 20-sec reel showing the Komatsu D155A Crawler Dozer leveling massive sand dunes at 45° slope in extreme summer heat.",
        "hook": {
          "spokenEn": "350 horsepower of raw Japanese pushing force conquering Kuwait sand dunes.",
          "spokenAr": "350 حصان من القوة اليابانية الهادرة تروّض رمال وكثبان الكويت.",
          "visualHook": "Front blade pushing a 9-cubic-meter wall of red sand with turbo spool whistle."
        },
        "scenes": [],
        "brollChecklist": [
          "Drone tracking shot parallel to moving dozer blade",
          "Slow motion track shoes biting into soft dune"
        ],
        "postProductionNotes": "Heavy bass sound design with metallic track clinking.",
        "captionEn": "Massive blade capacity, low ground pressure, and legendary lock-up torque transmission. The Komatsu D155A Crawler Dozer makes light work of Kuwait’s largest desert earthworks.\n\n🚜 Available for fleet delivery across Kuwait through Dar Al Hay.",
        "captionAr": "سعة جرف هائلة، وتوزيع مثالي للوزن على الرمال الناعمة، وناقل حركة متطور. بلدوزر كوماتسو D155A ينجز أضخم مشاريع تسوية الأراضي والصحراء في الكويت.\n\n🚜 متوفر للتوريد الفوري عبر شركة دار الحي.",
        "hashtags": "#KomatsuD155A #CrawlerDozer #BulldozerKuwait #DesertEarthworks #HeavyMachinery #DarAlHay",
        "ctaText": "Request dozer specifications and fleet delivery timelines today.",
        "slides": []
      },
      {
        "id": 111,
        "conceptNumber": 11,
        "week": "Week 4",
        "day": "Tuesday",
        "publishDate": "2026-08-25",
        "title": "Fleet Preventive Maintenance Contracts (EQP) Explained",
        "pillar": "pillar_leadgen",
        "format": "carousel",
        "platforms": [
          "linkedin",
          "facebook",
          "instagram"
        ],
        "goal": "lead_generation",
        "status": "idea",
        "targetAudience": "Contracting CFOs, Procurement Directors, Project Managers",
        "tov": "Commercial, Strategic, Cost-Savings Focus",
        "summary": "Comparing unscheduled emergency repairs vs fixed-price Dar Al Hay EQP maintenance agreements over 5,000 operating hours.",
        "hook": {
          "spokenEn": "Why top Kuwait contractors choose fixed-price maintenance agreements over breakdown surprises.",
          "spokenAr": "لماذا تفضل كبرى شركات المقاولات في الكويت عقود الصيانة الوقائية الشاملة؟",
          "visualHook": "Side-by-side cost comparison graph: Unpredictable breakdown expenses vs flat predictable EQP agreement."
        },
        "scenes": [],
        "brollChecklist": [
          "Dar Al Hay signed agreement document graphic",
          "Service engineer stamping certified maintenance book"
        ],
        "postProductionNotes": "Executive corporate styling with clean typography.",
        "captionEn": "Predictable maintenance costs, certified Japanese parts, zero surprise breakdown bills. Dar Al Hay’s EQP Maintenance Contracts protect your equipment ROI over 5,000+ operating hours.\n\nSwipe through to see the financial case for scheduled fleet care.",
        "captionAr": "تكاليف صيانة ثابتة ومدروسة، قطع غيار أصلية 100%، وضمان ضد التوقف المفاجئ. عقود الصيانة الشاملة EQP من دار الحي تحمي أسطولك وعوائد مشاريعك.\n\nاسحب الشاشة للمقارنة المالية.",
        "hashtags": "#FleetMaintenance #EQPContract #TCO #ContractorFinance #KomatsuKuwait #DarAlHay",
        "ctaText": "Contact our heavy equipment team for a customized fleet maintenance proposal.",
        "slides": [
          {
            "slideNo": 1,
            "title": "The Hidden Cost of Breakdown Culture",
            "body": "Unscheduled breakdowns cost up to 4x more than scheduled care when factoring in idle operators and project delay penalties."
          },
          {
            "slideNo": 2,
            "title": "Fixed Per-Hour Maintenance Rates",
            "body": "Know your exact operating cost per machine hour down to the fils. No hidden charges or surprise invoices."
          },
          {
            "slideNo": 3,
            "title": "Certified Fluid Sampling & Telemetry",
            "body": "Includes regular KOWA oil laboratory diagnostics and KOMTRAX satellite health monitoring."
          },
          {
            "slideNo": 4,
            "title": "Priority Dispatch & Standby Units",
            "body": "Contract holders receive guaranteed priority field response and preferential parts pricing across Kuwait."
          },
          {
            "slideNo": 5,
            "title": "Tailored for Your Fleet Size",
            "body": "From single-machine operators to 100+ unit civil contractors. Request your customized proposal today."
          }
        ]
      },
      {
        "id": 112,
        "conceptNumber": 12,
        "week": "Week 4",
        "day": "Thursday",
        "publishDate": "2026-08-27",
        "title": "Monthly Campaign Wrap-Up – Zero Summer Downtime Achieved",
        "pillar": "pillar_authority",
        "format": "photography",
        "platforms": [
          "instagram",
          "linkedin",
          "facebook"
        ],
        "goal": "brand_awareness",
        "status": "idea",
        "targetAudience": "General Industry Stakeholders, Operators, Partners",
        "tov": "Proud, Celebrating Success, Community-Focused",
        "summary": "Group photo of Dar Al Hay service engineering team standing proudly in front of a newly delivered Komatsu fleet lineup in Shuwaikh.",
        "hook": {
          "spokenEn": "Another summer of Kuwait megaprojects powered with zero downtime.",
          "spokenAr": "صيف آخر من الإنجاز وبناء مشاريع الكويت دون توقف.. مع دار الحي وكوماتسو.",
          "visualHook": "Wide group portrait of engineers and technicians in crisp uniforms with fleet in background."
        },
        "scenes": [],
        "brollChecklist": [
          "Wide photography of team in Shuwaikh yard",
          "Close-up of engineer smiling with hardhat"
        ],
        "postProductionNotes": "Bright, clean, trustworthy commercial grading.",
        "captionEn": "Through 50°C+ summer heat, dust storms, and non-stop shifts, our team and our machines delivered. Thank you to Kuwait’s contractors and engineers for putting your trust in Dar Al Hay and Komatsu.\n\n🚜 Onward to the winter project season!",
        "captionAr": "رغم حرارة الصيف وشدة بيئة العمل، واصلت كوادرنا ومعداتنا العمل بأعلى كفاءة. شكراً لشركائنا ومهندسي الكويت على ثقتكم المستمرة في دار الحي وكوماتسو.\n\n🚜 مستعدون معاً لمشاريع موسم الشتاء القادم!",
        "hashtags": "#DarAlHayTeam #KomatsuKuwait #KuwaitEngineers #SummerEndurance #HeavyMachinery #Partnership",
        "ctaText": "Partner with Dar Al Hay for your upcoming infrastructure contracts.",
        "slides": []
      }
    ]
  },
  "2026-09": {
    "monthId": "2026-09",
    "monthName": "September 2026",
    "themeTitle": "Power, Reliability & The People Behind the Iron | القوة، الاعتمادية والإنسان",
    "strategicGoal": "Position Dar Al Hay & Komatsu as Kuwait’s undisputed infrastructure partner through flagship equipment showcases (GD705, PC210, WA380, D155, HM400), certified spare parts reliability & discounts, and inspiring human-centered brand storytelling.",
    "targetKpi": "35 Qualified Fleet Inquiries • 250,000 Video Views in Kuwait • 10% Spare Parts Discount Conversions",
    "pillarDistribution": {
      "pillar_authority": 25,
      "pillar_engineering": 30,
      "pillar_workshop": 15,
      "pillar_projects": 15,
      "pillar_leadgen": 15
    },
    "concepts": [
      {
        "id": 201,
        "conceptNumber": 1,
        "week": "Week 1",
        "day": "Thursday",
        "publishDate": "2026-09-03",
        "title": "Hero Machine – Motor Grader GD705 on Kuwait Highway Projects",
        "pillar": "pillar_projects",
        "format": "photography",
        "platforms": [
          "instagram",
          "linkedin",
          "facebook"
        ],
        "goal": "brand_awareness",
        "status": "published",
        "targetAudience": "Road Contractors, Civil Infrastructure Engineers, Site Supervisors",
        "tov": "Bold, Authoritative, High-Aesthetic Industrial",
        "summary": "High-aesthetic environmental photography of the Komatsu GD705 Motor Grader leveling sub-base gravel on Kuwait highway and infrastructure projects.",
        "hook": {
          "spokenEn": "Precision grading to the millimeter under the Kuwait sun. Meet the Komatsu GD705.",
          "spokenAr": "تسوية دقيقة حتى المليمتر تحت شمس الكويت.. جريدر كوماتسو GD705.",
          "visualHook": "Ultra-low 24mm wide angle photo looking up at the heavy moldboard blade cutting through sub-base gravel."
        },
        "scenes": [],
        "photoShots": [
          {
            "id": 1,
            "title": "3/4 Low-Angle Front Hero Shot",
            "framing": "Camera 30cm off gravel, 24mm wide angle, looking up at moldboard blade and front axle leaning geometry to emphasize scale.",
            "lighting": "Golden hour low sun (4:30 PM), backlit sand dust flare, circular polarizer filter to cut windshield glare.",
            "aspectRatio": "4:5 Portrait (IG & LinkedIn)",
            "staging": "Machine washed, moldboard tilted at 30°, amber roof hazard beacons illuminated, clean jobsite background."
          }
        ],
        "brollChecklist": [
          "4K slow motion shot of hydraulic boom and moldboard movement",
          "Close-up of genuine Komatsu logo badge and clean filter housing",
          "Operator in cabin view looking down at blade precision control"
        ],
        "postProductionNotes": "Warm golden hour desert tone, sharp metallic textures and rich Komatsu yellow grading.",
        "captionEn": "Precision grading to the millimeter. The Komatsu GD705 Motor Grader delivers exceptional blade control, heavy drawbar pull, and lock-up torque converter efficiency on Kuwait highway infrastructure.\n\n📍 On site sub-base leveling in Kuwait.",
        "captionAr": "دقة تسوية حتى المليمتر. جريدر كوماتسو GD705 يمنحك تحكماً فائقاً بسكينة التسوية، قوة سحب هيدروليكية جبارة، وكفاءة وقود استثنائية في مشاريع الطرق والبنية التحتية بالكويت.\n\n📍 موقع العمل - مشاريع تسوية الطرق السريعة.",
        "hashtags": "#Komatsu #GD705 #MotorGrader #RoadConstruction #KuwaitInfrastructure #DarAlHay #HeavyMachinery",
        "ctaText": "Contact our heavy equipment sales desk for GD705 demonstrations and delivery schedules.",
        "slides": [],
        "onAssetCopy": {
          "headlineEn": "PRECISION GRADING TO TH",
          "headlineAr": "تسوية دقيقة حتى المليمت",
          "badge": "📸 HERO PHOTOGRAPHY • 50°C",
          "callouts": [
            "4K slow motion shot of hydraulic boom and moldboard movement",
            "Close-up of genuine Komatsu logo badge and clean filter housing",
            "Operator in cabin view looking down at blade precision control"
          ],
          "visualCta": "Contact our heavy equipment sales desk for GD705 demonstrations and delivery schedules.",
          "designNotes": ""
        },
        "description": "High-aesthetic environmental photography of the Komatsu GD705 Motor Grader leveling sub-base gravel on Kuwait highway and infrastructure projects."
      },
      {
        "id": 202,
        "conceptNumber": 2,
        "week": "Week 1",
        "day": "Thursday",
        "publishDate": "2026-09-10",
        "title": "قطع الغيار الأصلية – الفرق الميكروسكوبي لحماية المحركات (Genuine Parts vs Cheap Filters)",
        "pillar": "pillar_engineering",
        "format": "carousel",
        "platforms": [
          "linkedin",
          "facebook",
          "instagram"
        ],
        "goal": "product_education",
        "status": "ready",
        "targetAudience": "Fleet Maintenance Engineers, Procurement Officers, Workshop Managers",
        "tov": "Analytical, Factual, Educational & Persuasive",
        "summary": "5-slide educational breakdown comparing genuine Komatsu micro-glass filters against cheap aftermarket paper filters in Kuwait desert fine sand.",
        "hook": {
          "spokenEn": "Kuwait sand measures down to 5 microns. Here is why cheap filters cause total pump seizure.",
          "spokenAr": "ذرات رمل الكويت تصل إلى 5 ميكرون.. كيف تدمر الفلاتر المقلدة مضخاتك الهيدروليكية في صمت؟",
          "visualHook": "Microscopic side-by-side comparison between multi-layer microglass filter media vs generic paper."
        },
        "scenes": [],
        "brollChecklist": [
          "Macro cut-section of genuine hydraulic filter vs generic paper element",
          "Barcoded packaging on climate-controlled warehouse shelves in Shuwaikh",
          "Certified engineer inspecting filter micron rating on tablet"
        ],
        "postProductionNotes": "1080x1350 vertical slides with clean blueprint aesthetic and microscopic callouts.",
        "captionEn": "In Kuwait’s harsh desert environment, saving a few dinars on non-genuine filters can lead to catastrophic hydraulic pump failure. Protect your fleet with certified Japanese micro-glass filtration.\n\nSwipe through for the engineering proof. 🔬",
        "captionAr": "في بيئة العمل الصحراوية بالكويت، استخدام فلاتر غير أصلية قد يسبب أعطالاً كارثية في المضخات والمحركات خلال أقل من 200 ساعة. احمِ استثمارك بقطع غيار كوماتسو الأصلية من دار الحي.\n\nاسحب الشاشة للتعرف على الدليل العلمي. 🔬",
        "hashtags": "#GenuineParts #KomatsuParts #DarAlHay #FleetMaintenance #HydraulicFilters #TCO #KuwaitContractors",
        "ctaText": "Order genuine Komatsu parts directly through our Shuwaikh warehouse.",
        "slides": [
          {
            "slideNo": 1,
            "title": "The 5-Micron Desert Sand Threat",
            "body": "Kuwait sand particles measure down to 5 microns. Standard paper filters let up to 40% of micro-debris pass into your hydraulic pumps."
          },
          {
            "slideNo": 2,
            "title": "Synthetic Micro-Glass Media",
            "body": "Genuine Komatsu filters feature synthetic micro-glass fibers capturing 99.8% of micro-particles without restricting oil flow under extreme heats."
          },
          {
            "slideNo": 3,
            "title": "High-Temperature Viton Seals",
            "body": "Engineered to withstand 120°C continuous oil temperatures without hardening, cracking, or leaking hydraulic pressure."
          },
          {
            "slideNo": 4,
            "title": "Complete Fleet Asset Protection",
            "body": "Saving with an imitation filter risks an engine overhaul and weeks of lost project revenue."
          }
        ],
        "photoShots": [],
        "description": "5-slide educational breakdown comparing genuine Komatsu micro-glass filters against cheap aftermarket paper filters in Kuwait desert fine sand."
      },
      {
        "id": 203,
        "conceptNumber": 3,
        "week": "Week 1",
        "day": "Thursday",
        "publishDate": "2026-09-17",
        "title": "فريق الصيانة  - خدمات ",
        "pillar": "pillar_workshop",
        "format": "carousel",
        "platforms": [
          "instagram",
          "linkedin",
          "facebook"
        ],
        "goal": "trust_humanize",
        "status": "ready",
        "targetAudience": "Fleet Owners, Project Directors, Equipment Supervisors",
        "tov": "Authoritative Industrial & Fleet Economics",
        "summary": "Slide 1: Did you meet our service team? Get to know our services.\nSlide 2: Technical Support (Selling the machine is only the beginning, we offer our continuous support to keep your projects up!\nSlide 3: Maintenance Contracts (We carry the responsibility from your shoulder, ensuring the best practices to maintain your machine in a good standing)\nSlide 4: KOWA Analysis, Custom Consultation and more!",
        "hook": {
          "spokenEn": "Inside Kuwait’s premier certified heavy machinery workshop. This is how we guarantee 10,000+ hours.",
          "spokenAr": "داخل أحدث مجمع صيانة معتمد للآليات الثقيلة في الشويخ.. هكذا نضمن استمرار معدتك لأكثر من 10,000 ساعة عمل.",
          "visualHook": "Calibrated digital torque wrench clicking with LED flash onto cylinder head bolt, followed by rapid montage of workshop action."
        },
        "scenes": [
          {
            "sceneNo": 1,
            "time": "0:00 - 0:04",
            "visual": "Clean workshop floor, engineer tightening cylinder head bolt with torque wrench.",
            "talentAction": "Tightening manifold with high focus and precision.",
            "audioVoiceoverEn": "Inside Dar Alhai’s heavy equipment workshop.",
            "audioVoiceoverAr": "داخل مركز صيانة دار الحي..",
            "onScreenTextEn": "Al-Rai Area",
            "onScreenTextAr": "مركز صيانة معتمد",
            "sfxMusic": "Sub drop + torque click foley"
          },
          {
            "sceneNo": 2,
            "time": "0:04 - 0:10",
            "visual": "Master diagnostic technician testing high-pressure hydraulic pump on test bench.",
            "talentAction": "Reading digital pressure dials and verifying flow rate.",
            "audioVoiceoverEn": "",
            "audioVoiceoverAr": "إعادة تأهيل بمعايير عالمية، فحص دقيق, ونتائج احترافية.",
            "onScreenTextEn": "FACTORY CALIBRATION & TESTING",
            "onScreenTextAr": "فحص ومعايرة المصنع",
            "sfxMusic": "Synthesizer pulse + hydraulic hum"
          },
          {
            "sceneNo": 3,
            "time": "0:10 - 0:16",
            "visual": "Service engineer shaking hands with fleet manager in front of newly overhauled excavator.",
            "talentAction": "Handing over certified test report with confidence.",
            "audioVoiceoverEn": "",
            "audioVoiceoverAr": "لأن وقت عمل آلياتك هو رأس مالك.",
            "onScreenTextEn": "ZERO DOWNTIME COMMITMENT",
            "onScreenTextAr": "جاهزية تشغيلية قصوى",
            "sfxMusic": "Cinematic music swell"
          },
          {
            "sceneNo": 4,
            "time": "0:15 - 0:20",
            "visual": "Technician tightening the screw - Close Shot",
            "talentAction": "إحنا, نحفظلك إياه.",
            "audioVoiceoverEn": "",
            "audioVoiceoverAr": "",
            "onScreenTextEn": "",
            "onScreenTextAr": "",
            "sfxMusic": ""
          }
        ],
        "brollChecklist": [
          "Close-up of torque wrench digital readout clicking",
          "Hydraulic test bench pressure gauge surging to 350 bar",
          "Certified engineer reviewing oil spectral chart on tablet"
        ],
        "postProductionNotes": "Dynamic speed ramps between tool actions and warm industrial color grading.",
        "captionEn": "Preventive maintenance is not an expense — it is the heartbeat of fleet profitability. At Dar Alhai, our trained engineers ensure your Komatsu machinery operates at peak performance.\n\n⚙️ Scheduled maintenance, diagnostic oil analysis, and genuine overhauls.",
        "captionAr": "الصيانة الوقائية ليست تكلفة، بل هي صمام الأمان لإنتاجية معداتك.\nفي دار الحي، يقدم مهندسونا المعتمدون أعلى معايير الصيانة اليابانية لضمان أعلى أداء لمعدتك في أصعب الظروف.\n\n⚙️ عقود صيانة وقائية، فحص مخبري للزيوت، وتجديد شامل للمحركات والهيدروليك.",
        "hashtags": "#DarAlHay #KomatsuService #PreventiveMaintenance #ShuwaikhWorkshop #HeavyMachinery #KuwaitEngineers #EQP",
        "ctaText": "Schedule your fleet preventive maintenance inspection with Dar Al Hay today.",
        "slides": [],
        "onAssetCopy": {
          "headlineEn": "Al-Rai Area",
          "headlineAr": "",
          "badge": "🎬 REEL • 4K MOTION",
          "callouts": [
            "Close-up of torque wrench digital readout clicking",
            "Hydraulic test bench pressure gauge surging to 350 bar",
            "Certified engineer reviewing oil spectral chart on tablet"
          ],
          "visualCta": "Schedule your fleet preventive maintenance inspection with Dar Al Hay today.",
          "designNotes": "Dynamic speed ramps between tool actions and warm industrial color grading."
        },
        "photoShots": [],
        "description": "Slide 1: Did you meet our service team? Get to know our services.\nSlide 2: Technical Support (Selling the machine is only the beginning, we offer our continuous support to keep your projects up!\nSlide 3: Maintenance Contracts (We carry the responsibility from your shoulder, ensuring the best practices to maintain your machine in a good standing)\nSlide 4: KOWA Analysis, Custom Consultation and more!"
      },
      {
        "id": 204,
        "conceptNumber": 4,
        "week": "Week 2",
        "day": "Wednesday",
        "publishDate": "2026-09-09",
        "title": "PC350 - A tool of success",
        "pillar": "pillar_engineering",
        "format": "reel",
        "platforms": [
          "instagram",
          "linkedin",
          "facebook"
        ],
        "goal": "product_education",
        "status": "ready",
        "targetAudience": "Civil Contractors, Excavation Specialists, Project Managers",
        "tov": "Instructive, Engaging, Expert-Led & Technical",
        "summary": "Sales engineer conducts an energetic walkaround of the PC210-10M0 Excavator, explaining the 20% fuel savings, reinforced heavy arm, and desert cooling package.",
        "hook": {
          "spokenEn": "Why is the Komatsu PC210 the #1 choice for Kuwait contractors? 3 key engineering reasons.",
          "spokenAr": "لماذا تعتبر حفارة كوماتسو PC210 الخيار الأول لشركات المقاولات في الكويت؟ 3 أسباب هندسية حاسمة.",
          "visualHook": "Engineer steps onto PC210 track, tapping the reinforced heavy-duty bucket with an engineering micrometer."
        },
        "scenes": [
          {
            "sceneNo": 1,
            "time": "0:00 - 0:05",
            "visual": "Engineer standing beside PC210 track in South Kuwait jobsite.",
            "talentAction": "Pointing to reinforced boom and stepping toward camera.",
            "audioVoiceoverEn": "3 reasons why the PC210 dominates civil excavation in Kuwait.",
            "audioVoiceoverAr": "3 أسباب تجعل كوماتسو PC210 الحفارة الأكثر طلباً في الكويت.",
            "onScreenTextEn": "KOMATSU PC210 | 3 KEY ADVANTAGES",
            "onScreenTextAr": "كوماتسو PC210 | 3 مميزات",
            "sfxMusic": "Energetic beat"
          },
          {
            "sceneNo": 2,
            "time": "0:05 - 0:11",
            "visual": "Open engine hood revealing low-emission fuel-efficient engine and high-ambient radiator.",
            "talentAction": "Demonstrating auto-idle and Eco-mode controls.",
            "audioVoiceoverEn": "First: Advanced hydraulic regeneration cutting diesel consumption by up to 20%.",
            "audioVoiceoverAr": "أولاً: نظام تدوير هيدروليكي متطور يوفر حتى 20% من استهلاك الوقود.",
            "onScreenTextEn": "1. 20% DIESEL SAVINGS",
            "onScreenTextAr": "1. توفير 20% في الوقود",
            "sfxMusic": "Engine rev foley"
          },
          {
            "sceneNo": 3,
            "time": "0:11 - 0:17",
            "visual": "Operator cab interior showing wide color monitor and air-suspended cooling seat.",
            "talentAction": "Operator comfortably swinging boom in smooth cycle.",
            "audioVoiceoverEn": "Second: Heavy-duty desert air filtration and high-ambient cooling that never overheats in 52°C.",
            "audioVoiceoverAr": "ثانياً: رادياتير تبريد صحراوي وفلاتر هواء مضاعفة تقاوم غبار وحرارة الصيف.",
            "onScreenTextEn": "2. 52°C AMBIENT RATING",
            "onScreenTextAr": "2. نظام تبريد 52 درجة مئوية",
            "sfxMusic": "Whoosh effect + hydraulic release"
          }
        ],
        "brollChecklist": [
          "Bucket biting into hard limestone gravel with high breakout force",
          "Close-up of operator monitor showing KOMTRAX fuel economy gauge",
          "Side profile of PC210 swinging in synchronized rhythm"
        ],
        "postProductionNotes": "Crisp callout graphics pointing to mechanical elements and vibrant Komatsu yellow.",
        "captionEn": "Reliability, high breakout force, and industry-leading fuel efficiency. The Komatsu PC350 is engineered to maximize contractor profitability across Kuwait civil infrastructure projects.\nContact us and get your own quotation.",
        "captionAr": "اعتمادية يابانية، قوة كسر هيدروليكية هائلة، واستهلاك وقود هو الأقل في فئتها. حفارة كوماتسو PC350 صُممت لتمنح المقاولين أعلى إنتاجية وأقل تكلفة تشغيلية في مشاريع الكويت.\nتواصل معنا واحصل على عرض السعر الخاص بك!",
        "hashtags": "#PC210 #KomatsuExcavator #FuelEfficiency #KuwaitConstruction #DarAlHay #HeavyEquipment",
        "ctaText": "Inquire today for PC210 inventory availability and financing options.",
        "slides": [],
        "onAssetCopy": {
          "headlineEn": "KOMATSU PC210 | 3 KEY ADVANTAGES",
          "headlineAr": "",
          "badge": "🎬 REEL • 4K MOTION",
          "callouts": [
            "Bucket biting into hard limestone gravel with high breakout force",
            "Close-up of operator monitor showing KOMTRAX fuel economy gauge",
            "Side profile of PC210 swinging in synchronized rhythm"
          ],
          "visualCta": "Inquire today for PC210 inventory availability and financing options.",
          "designNotes": "Crisp callout graphics pointing to mechanical elements and vibrant Komatsu yellow."
        },
        "photoShots": [],
        "description": "Sales engineer conducts an energetic walkaround of the PC210-10M0 Excavator, explaining the 20% fuel savings, reinforced heavy arm, and desert cooling package."
      },
      {
        "id": 205,
        "conceptNumber": 5,
        "week": "Week 2",
        "day": "Sunday",
        "publishDate": "2026-09-13",
        "title": "WA480 – ثبات وجرف لا يلين في الكسارات والرمل ",
        "pillar": "pillar_projects",
        "format": "photography",
        "platforms": [
          "instagram",
          "linkedin",
          "facebook"
        ],
        "goal": "brand_awareness",
        "status": "ready",
        "targetAudience": "Contractors, Quarry Operators, Aggregate Handlers",
        "tov": "Bold, Powerful, High Aesthetic (Wherever power is needed, W480-6 answers the call!)",
        "summary": "High-impact hero photography of Komatsu WA380 Wheel Loader operating in aggregate quarry and sand loading sites with golden hour lighting.",
        "hook": {
          "spokenEn": "Massive breakout force meets perfect machine balance. The Komatsu WA380 at work.",
          "spokenAr": "قوة اختراق جبارة مع توازن استثنائي في نقل الرمل والصلبوخ.. لودر كوماتسو WA380.",
          "visualHook": "Low-angle 24mm wide hero photo of WA380 lifting a heaped 3.3m³ bucket into golden hour sunlight."
        },
        "scenes": [],
        "photoShots": [
          {
            "id": 1,
            "title": "3/4 Heaped Bucket Lift Hero Shot",
            "framing": "Camera low to ground, 24mm wide angle, capturing the massive 3.3m³ bucket raised high against desert sky.",
            "lighting": "Golden hour sunset backlighting, rim light catching aggregate dust.",
            "aspectRatio": "4:5 Portrait (IG & LinkedIn)",
            "staging": "Bucket heaped with gravel, tires digging firmly, amber beacon ON."
          },
          {
            "id": 2,
            "title": "Full Side Loading Profile",
            "framing": "50mm lens showing articulated center-pin steering flex and heavy cast counterweight balance.",
            "lighting": "Crisp desert side-light highlighting yellow paint and steel boom.",
            "aspectRatio": "16:9 Landscape (Web & Banner)",
            "staging": "Active loading posture alongside dump truck bed."
          },
          {
            "id": 3,
            "title": "Heavy Radial Tire & Rim Detail",
            "framing": "85mm macro on cut-resistant L3 rock tires biting into dense gravel substrate.",
            "lighting": "High texture contrast on deep tire treads.",
            "aspectRatio": "1:1 Square (Detail)",
            "staging": "Pristine black rubber with sharp gravel texture."
          }
        ],
        "brollChecklist": [
          "Low-angle photo of WA380 scooping dense aggregate pile",
          "Macro detail of hydraulic tilt cylinder and Komatsu yellow emblem",
          "Driver cabin interior showing ergonomic joystick steering and wide visibility"
        ],
        "postProductionNotes": "Sharpen metallic textures and enhance warm desert tones.",
        "captionEn": "Heaped bucket capacity, rapid cycle times, and legendary powertrain reliability. The Komatsu WA480 Wheel Loader powers sand, aggregate, and asphalt operations across Kuwait with unmatched stability.\n\n",
        "captionAr": "سعة باكت هائلة، سرعة دورات تفريغ فائقة، وقوة دفع جبارة تنقل آلاف الأطنان يومياً دون عناء. لودر كوماتسو WA480 يثبت جدارته كأفضل استثمار في مواقع تداول الرمل والصلبوخ والكسارات بالكويت.\n\n",
        "hashtags": "#WA380 #WheelLoader #KomatsuKuwait #QuarryOperations #AggregateHauling #DarAlHay #HeavyEarthmoving",
        "ctaText": "Visit our Shuwaikh showroom to inspect the WA380 specifications.",
        "slides": [],
        "description": "High-impact hero photography of Komatsu WA380 Wheel Loader operating in aggregate quarry and sand loading sites with golden hour lighting."
      },
      {
        "id": 206,
        "conceptNumber": 6,
        "week": "Week 2",
        "day": "Wednesday",
        "publishDate": "2026-09-16",
        "title": "أسطول معدات كوماتسو الكامل – المنظومة الهندسية المتكاملة في الكويت (Full Fleet Portfolio)",
        "pillar": "pillar_authority",
        "format": "carousel",
        "platforms": [
          "linkedin",
          "instagram",
          "facebook"
        ],
        "goal": "brand_awareness",
        "status": "ready",
        "targetAudience": "Fleet Managers, Procurement Directors, Construction Contractors",
        "tov": "Taken for the latest hero-machine posts",
        "summary": "5-slide comprehensive overview of Dar Al Hay’s complete machinery fleet: Excavators, Loaders, Bulldozers, Graders, and Haulers for Kuwait mega-projects.",
        "hook": {
          "spokenEn": "From earth excavation to heavy transport: The complete Komatsu heavy machinery fleet in Kuwait.",
          "spokenAr": "من الحفر والردم إلى النقل والتسوية.. الدليل الكامل لأسطول كوماتسو في الكويت.",
          "visualHook": "High-contrast graphic showing the entire Komatsu heavy line-up aligned in precision formation."
        },
        "scenes": [],
        "brollChecklist": [
          "Studio photography of Komatsu machine lineup in Kuwait",
          "Graphic overview of excavator and loader class breakdown",
          "Dar Al Hay showroom and parts support badge"
        ],
        "postProductionNotes": "1080x1350 vertical carousel deck with high-contrast fleet hierarchy.",
        "captionEn": "Whether executing civil infrastructure, marine reclamation, highway networks, or desert earthworks, Dar Al Hay provides the complete Komatsu fleet tailored for Kuwait’s toughest conditions.\n\nSwipe through to explore our machinery portfolio. 🚜",
        "captionAr": "سواء كنت تنفذ مشاريع البنية التحتية، شبكات الطرق السريعة، الردم الساحلي، أو الأعمال الترابية الكبرى، توفر دار الحي أسطول كوماتسو الياباني المتكامل لمشاريع الكويت.\n\nاسحب الشاشة للتعرف على تشكيلة الآليات المتكاملة. 🚜",
        "hashtags": "#KomatsuKuwait #DarAlHay #HeavyFleet #Excavators #WheelLoaders #Bulldozers #KuwaitContractors #Infrastructure",
        "ctaText": "Download our complete equipment catalogue or request a customized fleet proposal.",
        "slides": [
          {
            "slideNo": 1,
            "title": "Hydraulic Excavators (20T to 50T)",
            "body": "PC210, PC350, and PC500 built for deep trenching, rock demolition, and marine canal digging."
          },
          {
            "slideNo": 2,
            "title": "Heavy Wheel Loaders",
            "body": "WA380, WA470, and WA600 designed for rapid aggregate cycle times and quarry loading."
          },
          {
            "slideNo": 3,
            "title": "Bulldozers & Graders",
            "body": "D85, D155, and GD705 delivering massive drawbar pull for road sub-base leveling and desert earthworks."
          },
          {
            "slideNo": 4,
            "title": "Articulated Dump Trucks",
            "body": "HM400 6x6 haulers conquering soft mud, wet sand, and steep gradients with 40-ton payloads."
          },
          {
            "slideNo": 5,
            "title": "Complete Lifecycle Partnership",
            "body": "One certified distributor, complete genuine parts stock in Shuwaikh, and 24/7 mobile field service."
          }
        ],
        "photoShots": [],
        "description": "5-slide comprehensive overview of Dar Al Hay’s complete machinery fleet: Excavators, Loaders, Bulldozers, Graders, and Haulers for Kuwait mega-projects."
      },
      {
        "id": 208,
        "conceptNumber": 8,
        "week": "Week 3",
        "day": "Sunday",
        "publishDate": "2026-09-20",
        "title": "اعتمادية كوماتسو – أكثر من 100 عام من الهندسة اليابانية (Komatsu Reliability)",
        "pillar": "pillar_authority",
        "format": "reel",
        "platforms": [
          "linkedin",
          "facebook",
          "instagram"
        ],
        "goal": "brand_awareness",
        "status": "ready",
        "targetAudience": "C-Suite, Procurement Directors, Project Managers, Fleet Supervisors",
        "tov": "Authoritative Industrial & Fleet Economics",
        "summary": "Technical animation highlighting the 4 core pillars of Komatsu.\n\nAmbition\n\nPerseverance\n\nCollaboration\n\nAuthenticity\n\nPoints to focus on:\n- The Story began from a village called \"Komatsu\"\n- Where there was a need, Komatsu came.\n- It was all to help the humans, have an easier life.\n- To build their future.\n- And here in Kuwait (Let's focus on Culture, housing, and big projects)\n- Focus on what the humans need to be delivered.",
        "hook": {
          "spokenEn": "Why do Komatsu machines outlast the competition in Kuwait? The engineering behind 100+ years of Japanese precision.",
          "spokenAr": "لماذا تعيش معدات كوماتسو لسنوات أطول في بيئة الكويت القاسية؟ أسرار 100 عام من الهندسة اليابانية.",
          "visualHook": "Technical 3D wireframe infographic displaying Komatsu heavy structural steel, 52°C cooling radiator, and satellite telemetry."
        },
        "scenes": [],
        "brollChecklist": [
          "3D wireframe render of Komatsu hydraulic pump and cooling module",
          "Macro photo of heavy forged steel casting with Komatsu stamp",
          "KOMTRAX satellite map displaying machine fleet telemetry over Kuwait"
        ],
        "postProductionNotes": "Clean blueprint aesthetic with Komatsu navy, technical cyan, and gold badges.",
        "captionEn": "For over a century, Komatsu has defined the global standard for heavy engineering reliability. From high-tensile Japanese cast steel to high-ambient cooling circuits designed for 52°C+ desert operations, our machines are built to endure.\n\n📐 Certified Japanese engineering backed by Dar Al Hay Kuwait.",
        "captionAr": "لأكثر من قرن من الزمان، تواصل كوماتسو صياغة معايير الاعتمادية الهندسية في العالم. من هياكل الحديد المصبوب المعالج حرارياً إلى أنظمة التبريد الصحراوية المصممة لحرارة تتجاوز 52 درجة مئوية، صُنعت هذه الآليات لتقهر المستحيل.\n\n📐 هندسة يابانية معتمدة بدعم دار الحي في الكويت.",
        "hashtags": "#KomatsuHeritage #JapaneseEngineering #HeavyEquipmentReliability #BuiltToLast #DarAlHay #KuwaitInfrastructure",
        "ctaText": "Learn more about Komatsu engineering standards at our Shuwaikh showroom.",
        "slides": [],
        "photoShots": [],
        "description": "Technical animation highlighting the 4 core pillars of Komatsu.\n\nAmbition\n\nPerseverance\n\nCollaboration\n\nAuthenticity\n\nPoints to focus on:\n- The Story began from a village called \"Komatsu\"\n- Where there was a need, Komatsu came.\n- It was all to help the humans, have an easier life.\n- To build their future.\n- And here in Kuwait (Let's focus on Culture, housing, and big projects)\n- Focus on what the humans need to be delivered."
      },
      {
        "id": 209,
        "conceptNumber": 9,
        "week": "Week 3",
        "day": "Tuesday",
        "publishDate": "2026-09-22",
        "title": "بلدوزر كوماتسو D155 – كاسر الصخور وعملاق التسوية والردم (Bulldozer D155A Heavy Power)",
        "pillar": "pillar_engineering",
        "format": "reel",
        "platforms": [
          "instagram",
          "linkedin",
          "facebook"
        ],
        "goal": "product_education",
        "status": "ready",
        "targetAudience": "Civil Contractors, Earthmoving Project Managers, Mining/Quarry Operators",
        "tov": "Dramatic, Powerful, Unstoppable ",
        "summary": "Reel Concept: The Salesman's Pitch (Komatsu D155A)\nDuration: 30-40 Seconds\nVisual Style: Fast-paced cuts. The salesman should be dynamic—walking around the machine, pointing to key features, and speaking with authority.\n\nتبحث عن معدة ما تعرف المستحيل!\nالـD155A-6 هي خيارك الأمثل!\n\nمصمم للعمل حتى في أقسى الظروف!\n\nعندك كمية أعمال ضخمة؟\nلا تحاتي! شفرة بلدوزرنا أضخم\n\nقوة دفع كبيرة!\nريبر قاسي, بيحفر أعتى الصخور!\n\nالـD155, بيدفعك, لما بتنخاه!\n\n",
        "hook": {
          "spokenEn": "Massive tractive power ripping through solid Kuwait limestone. The Komatsu D155 Bulldozer.",
          "spokenAr": "قوة سحب وجرف جبارة تكسر أصلب صخور الكويت.. بلدوزر كوماتسو D155.",
          "visualHook": "Dramatic low-angle photo of D155 giant ripper shank cutting through rocky terrain with dust shockwave."
        },
        "scenes": [],
        "photoShots": [
          {
            "id": 1,
            "title": "3/4 Front Blade Push Hero Shot",
            "framing": "24mm wide angle, low to ground, showing SIGMADOZER blade rolling a mountain of desert sand and rock.",
            "lighting": "Intense midday desert sun with high shadow contrast.",
            "aspectRatio": "4:5 Portrait (IG & LinkedIn)",
            "staging": "Blade fully loaded with rocky soil, grousers digging deep."
          },
          {
            "id": 2,
            "title": "Giant Hydraulic Ripper Action Profile",
            "framing": "50mm side shot capturing the heavy hydraulic shank penetrating limestone substrate with dust kick-up.",
            "lighting": "Side-light emphasizing fractured rock textures.",
            "aspectRatio": "16:9 Landscape (Web & Banner)",
            "staging": "Ripper lowered into rock, track chains under tension."
          },
          {
            "id": 3,
            "title": "Heavy Undercarriage & Grouser Detail",
            "framing": "85mm macro on dual-flange track rollers, sealed track pins, and heavy steel grousers.",
            "lighting": "High metallic sharpness.",
            "aspectRatio": "1:1 Square (Detail)",
            "staging": "Grousers coated in fine limestone dust."
          }
        ],
        "brollChecklist": [
          "Photo of D155 pushing dense sand dune with dust billowing",
          "Macro shot of hydraulic tilt cylinders and Komatsu cast steel",
          "Operator in quiet pressurized cab looking forward at blade"
        ],
        "postProductionNotes": "High-contrast industrial aesthetic with enhanced warm sand textures.",
        "captionEn": "When raw earthmoving power and rock penetration are required, the Komatsu D155A Bulldozer is unmatched. Featuring the innovative SIGMADOZER blade for 15% higher pushing capacity and lock-up torque converter efficiency.\n",
        "captionAr": "عندما يتطلب المشروع أقصى قوة جرف وكسر للصخور الصلبة، يأتي بلدوزر كوماتسو D155A في المقدمة, بشفرة ضخمة وريبر يقوة هايدروليكية هائاة!\n\n",
        "hashtags": "#Bulldozer #D155A #KomatsuKuwait #Earthmoving #RockRipping #HeavyMachinery #DarAlHay",
        "ctaText": "Contact our heavy machinery department for D155 technical specifications.",
        "slides": [],
        "description": "Reel Concept: The Salesman's Pitch (Komatsu D155A)\nDuration: 30-40 Seconds\nVisual Style: Fast-paced cuts. The salesman should be dynamic—walking around the machine, pointing to key features, and speaking with authority.\n\nتبحث عن معدة ما تعرف المستحيل!\nالـD155A-6 هي خيارك الأمثل!\n\nمصمم للعمل حتى في أقسى الظروف!\n\nعندك كمية أعمال ضخمة؟\nلا تحاتي! شفرة بلدوزرنا أضخم\n\nقوة دفع كبيرة!\nريبر قاسي, بيحفر أعتى الصخور!\n\nالـD155, بيدفعك, لما بتنخاه!\n\n"
      },
      {
        "id": 210,
        "conceptNumber": 10,
        "week": "Week 4",
        "day": "Thursday",
        "publishDate": "2026-09-24",
        "title": "HM400 – حمولة هائلة",
        "pillar": "pillar_engineering",
        "format": "carousel",
        "platforms": [
          "linkedin",
          "facebook",
          "instagram"
        ],
        "goal": "product_education",
        "status": "ready",
        "targetAudience": "Civil Contractors, Haulage Fleet Managers, Coastal Engineers",
        "tov": "Technical, Data-Driven, Dynamic",
        "summary": "5-slide breakdown of the Komatsu HM400-5 articulated dump truck, explaining the 6x6 drivetrain, KTCS automatic traction control, and 40-ton payload in soft sand & mud.",
        "hook": {
          "spokenEn": "How to haul 40 tons through soft Kuwait sand where rigid trucks get stuck: The Komatsu HM400.",
          "spokenAr": "كيف تنقل 40 طناً من الصخور عبر أضعف الرمال الناعمة دون أن تغرز شاحناتك؟ كوماتسو HM400.",
          "visualHook": "Graphic showing 6x6 articulation flexing independently over rough mud dunes with zero traction loss."
        },
        "scenes": [],
        "brollChecklist": [
          "High-res photo of HM400 dumping 40-ton payload on coastal embankment",
          "Diagram of KTCS independent inter-axle differential lock mechanism",
          "Cabin view showing rear-view camera and payload weight meter display"
        ],
        "postProductionNotes": "1080x1350 vertical slides with dynamic action cutouts.",
        "captionEn": "Soft sand, tidal mud, and steep gradients stop standard dump trucks in their tracks. The Komatsu HM400-5 articulated dump truck delivers 40 tons of payload with automated 6x6 traction control (KTCS) across Kuwait coastal and earthmoving projects.\n\nSwipe through for the engineering breakdown. 🚛",
        "captionAr": "الرمال الناعمة، الأراضي الطينية، والمنحدرات القاسية توقف الشاحنات العادية فوراً. شاحنة كوماتسو المفصلية HM400-5 تمنحك حمولة 40 طناً مع نظام تحكم بالجر الذكي KTCS ودفع سداسي حقيقي يعبر أصعب التضاريس.\n\nاسحب الشاشة للتعرف على التفاصيل الهندسية. 🚛",
        "hashtags": "#HM400 #ArticulatedDumpTruck #KomatsuKuwait #HeavyHauling #SeaCity #KuwaitConstruction #DarAlHay",
        "ctaText": "Request a haulage fleet consultation from our equipment engineering team.",
        "slides": [
          {
            "slideNo": 1,
            "title": "The Soft Terrain Challenge",
            "body": "Rigid dump trucks sink and lose traction in coastal mud, soft sand, and steep haul roads."
          },
          {
            "slideNo": 2,
            "title": "KTCS Advanced Traction Control",
            "body": "Komatsu Traction Control System automatically detects wheel slip and applies independent inter-axle differential locks."
          },
          {
            "slideNo": 3,
            "title": "True 40-Metric-Ton Payload",
            "body": "High-strength abrasion-resistant steel body carrying 24.0 m³ with low loading height."
          },
          {
            "slideNo": 4,
            "title": "Hydro-Pneumatic Suspension",
            "body": "Front and rear hydro-pneumatic suspension ensures a smooth high-speed ride and protects operator spine."
          },
          {
            "slideNo": 5,
            "title": "Tested on Kuwait Mega-Projects",
            "body": "Proven performance at Sabah Al-Ahmad Sea City, desert highways, and coastal reclamation."
          }
        ],
        "photoShots": [],
        "description": "5-slide breakdown of the Komatsu HM400-5 articulated dump truck, explaining the 6x6 drivetrain, KTCS automatic traction control, and 40-ton payload in soft sand & mud."
      },
      {
        "id": 211,
        "conceptNumber": 11,
        "week": "Week 4",
        "day": "Sunday",
        "publishDate": "2026-09-27",
        "title": "عرض خاص لشركات المقاولات – خصم 10% على قطع الغيار الأصلية بالتنسيق مع رامي (10% Spare Parts Discount Campaign)",
        "pillar": "pillar_leadgen",
        "format": "cta_post",
        "platforms": [
          "linkedin",
          "facebook",
          "instagram"
        ],
        "goal": "lead_generation",
        "status": "ready",
        "targetAudience": "Fleet Owners, Procurement Managers, Workshop Supervisors, Contracting Companies",
        "tov": "Urgent, High-Value, Direct & Actionable",
        "summary": "Exclusive limited-time 10% discount campaign on genuine Komatsu filters, engine overhaul kits, and hydraulic components in direct coordination with Spare Parts Lead Rami.",
        "hook": {
          "spokenEn": "Special 10% discount on genuine Komatsu spare parts packages for Kuwait contracting fleets.",
          "spokenAr": "عرض خاص لشركات المقاولات بالكويت: خصم 10% على باقات قطع الغيار والفلاتر الأصلية بالتنسيق المباشر مع قسم المبيعات.",
          "visualHook": "High-contrast promotional banner featuring genuine Komatsu yellow parts boxes with bold 10% DISCOUNT badge and Shuwaikh warehouse backdrop."
        },
        "scenes": [],
        "brollChecklist": [
          "Photo of genuine Komatsu branded filters, gaskets, and oil barrels on warehouse pallets",
          "Customer service desk in Shuwaikh warehouse with parts manager assisting contractor",
          "WhatsApp inquiry direct QR code graphic"
        ],
        "postProductionNotes": "High-contrast marketing banner design with bold 10% OFF badge, Komatsu navy and yellow.",
        "captionEn": "🔥 Exclusive Fleet Maintenance Offer for Kuwait Contractors:\n\nEquip your fleet for uninterrupted autumn performance with a limited-time 10% DISCOUNT on genuine Komatsu filters, maintenance packages, and fast-moving spare parts.\n\n📞 Coordinated directly through our Spare Parts Lead (Rami) & Shuwaikh sales team.\n\n✅ 100% Genuine Japanese Factory Parts\n✅ Immediate Site Dispatch across Kuwait\n✅ Full Manufacturer Warranty Protection",
        "captionAr": "🔥 عرض خاص وحصري لشركات المقاولات وأصحاب الأساطيل في الكويت:\n\nجهّز آلياتك لموسم العمل الخريفي بأعلى كفاءة مع خصم خاص 10% على باقات قطع الغيار الأصلية، فلاتر الصيانة، والزيوت المعتمدة من كوماتسو.\n\n📞 بالتنسيق المباشر مع مسؤول قسم قطع الغيار (الأخ رامي) وفريق مبيعات الشويخ.\n\n✅ قطع يابانية أصلية 100% مضمونة\n✅ تسليم فوري ومباشر إلى موقع مشروعك\n✅ حماية كاملة للمحركات والضمان المصنعي",
        "hashtags": "#KomatsuParts #SpecialOffer #DarAlHay #KuwaitContractors #SparePartsDiscount #Shuwaikh #FleetMaintenance",
        "ctaText": "Contact Rami & our spare parts desk via WhatsApp (+965 2200 XXXX) or visit Shuwaikh to claim your 10% discount.",
        "slides": []
      },
      {
        "id": 212,
        "conceptNumber": 12,
        "week": "Week 4",
        "day": "Tuesday",
        "publishDate": "2026-09-29",
        "title": "فيديو براندنغ إنساني – وراء كل صرح سواعد تبني: العمل والعائلة وقيمة الإنسان (The People Behind the Iron)",
        "pillar": "pillar_authority",
        "format": "reel",
        "platforms": [
          "instagram",
          "linkedin",
          "facebook"
        ],
        "goal": "trust_humanize",
        "status": "ready",
        "targetAudience": "All Audiences, Kuwait Engineering Community, Heavy Machinery Operators, General Public",
        "tov": "Emotional, Inspiring, Warm, Human-Centered & Patriotic",
        "summary": "Inspiring cinematic video honoring the operators, mechanics, and engineers who build Kuwait’s future with Komatsu machinery, returning safely with pride to their families.",
        "hook": {
          "spokenEn": "Behind every highway, bridge, and foundation in Kuwait.. stands a human being.",
          "spokenAr": "خلف كل طريق، وكل صرح، وكل مشروع في الكويت.. يقف إنسان مخلص وعائلة تنتظر.",
          "visualHook": "Cinematic silhouette of a heavy machine operator wiping his brow at sunset, looking up at the sky, smiling proudly with the Kuwait skyline in background."
        },
        "scenes": [
          {
            "sceneNo": 1,
            "time": "0:00 - 0:05",
            "visual": "Sunrise over Kuwait desert jobsite: Machine operator stepping into cabin, service engineer checking oil with careful focus.",
            "talentAction": "Warm sunlight catching dust; operator smiling with determination.",
            "audioVoiceoverEn": "Behind the iron and steel of heavy machinery, lies the real power: The human spirit.",
            "audioVoiceoverAr": "وراء الحديد والصلب وقوة المحركات، تكمن القوة الحقيقية: سواعدكم وعزيمتكم.",
            "onScreenTextEn": "THE REAL POWER IS HUMAN",
            "onScreenTextAr": "القوة الحقيقية هي الإنسان",
            "sfxMusic": "Warm piano melody with gentle wind foley"
          },
          {
            "sceneNo": 2,
            "time": "0:05 - 0:12",
            "visual": "Montage of dedication: Certified technician smiling as an engine starts, operator expertly grading a road, team working in harmony under the Kuwait sun.",
            "talentAction": "Genuine smiles, teamwork, high-fives in safety vests.",
            "audioVoiceoverEn": "Dedicated men who brave the heat every day to build Kuwait’s tomorrow.",
            "audioVoiceoverAr": "رجال يواصلون العطاء كل يوم بكل إخلاص لبناء مستقبل كويت الغد.",
            "onScreenTextEn": "BUILDING KUWAIT EVERY DAY",
            "onScreenTextAr": "نبني كويت الغد معاً",
            "sfxMusic": "Emotional strings swell"
          },
          {
            "sceneNo": 3,
            "time": "0:12 - 0:20",
            "visual": "Operator clocking out safely at dusk, returning home to hug his child with pride and joy; Dar Al Hay & Komatsu logo lockup.",
            "talentAction": "Family embracing warmly, father smiling with deep fulfillment.",
            "audioVoiceoverEn": "We build the toughest machines so you return home safely to those you love. Dar Al Hay — Proud partners in human progress.",
            "audioVoiceoverAr": "نصنع أقوى الآليات لتعودوا بسلام وفخر لمن تحبون. دار الحي — شركاء في بناء الإنسان والوطن.",
            "onScreenTextEn": "DAR AL HAY • BUILDING TOGETHER",
            "onScreenTextAr": "دار الحي • نبني معاً",
            "sfxMusic": "Cinematic orchestral crescendo"
          }
        ],
        "brollChecklist": [
          "Cinematic golden hour silhouette of operator putting on hardhat with pride",
          "Genuine warm portrait of engineer smiling after completing machine overhaul",
          "Slow-motion Kuwait flag fluttering on worksite overlooking distant city skyline"
        ],
        "postProductionNotes": "Warm cinematic film grading, emotional piano and orchestral score, deep resonant Arabic voiceover.",
        "captionEn": "Behind every highway, harbor, and building rising across Kuwait stands the real hero: The human being operating, maintaining, and dedicating their sweat to building our nation.\n\nAt Dar Al Hay and Komatsu, we don’t just supply heavy machinery — we protect the safety, pride, and future of every worker and their family.\n\n🇰🇼 Built with Japanese precision. Powered by Kuwaiti determination.",
        "captionAr": "خلف كل طريق ممهد، وكل ميناء، وكل صرح يرتفع في سماء الكويت.. يقف البطل الحقيقي: الإنسان الذي يواصل العمل بإخلاص وشغف لبناء هذا الوطن.\n\nفي دار الحي وكوماتسو، لا نوفر مجرد معدات ثقيلة، بل نحرص على سلامة، وكرامة، ومستقبل كل عامل ومهندس يعود فخوراً لأسرته وأبنائه.\n\n🇰🇼 معداتنا تُبنى بالدقة اليابانية.. ولكن عزيمتكم هي من تصنع الفارق.",
        "hashtags": "#KuwaitPride #DarAlHay #KomatsuKuwait #HumanValue #BehindTheIron #KuwaitEngineers #BuildingTheFuture #SafetyFirst",
        "ctaText": "Share this tribute with the hardworking builders and engineers of Kuwait.",
        "slides": []
      },
      {
        "id": 1788937720691,
        "conceptNumber": 12,
        "title": "HM400",
        "publishDate": "2026-09-15",
        "format": "photography",
        "status": "idea",
        "summary": "Hero photo showing the Dump truck HM400 in duty, showing its reliability and strength.",
        "tov": "Moving the earth! ينقل أحلامكم",
        "captionEn": "\nThe Komatsu HM400 delivers the strength, reliability, and durability you need to keep demanding operations moving — even in tough conditions.\n\nKomatsu HM400 — Moving the Earth.",
        "captionAr": "مصمّم لنقل المزيد. ومصمّم ليواصل العمل.\nيوفّر Komatsu HM400 القوة والاعتمادية والمتانة التي تحتاجها لمواصلة العمل بكفاءة، حتى في أصعب الظروف.\n\nKomatsu HM400 — ينقل أحلامكم!",
        "platforms": [
          "instagram",
          "linkedin",
          "facebook"
        ],
        "pillar": "pillar_engineering",
        "day": "Tuesday",
        "description": "Hero photo showing the Dump truck HM400 in duty, showing its reliability and strength.",
        "scenes": [],
        "slides": [],
        "photoShots": []
      }
    ]
  },
  "2026-10": {
  "monthId": "2026-10",
  "monthName": "October 2026",
  "themeTitle": "Komatsu Campaign Plan: Heavy Iron Dominance & Total Fleet Reliability",
  "strategicGoal": "Highlight power, fuel economy, and Japanese engineering durability in quarrying and earthworks, while educating on genuine parts/fluids and building contractor confidence with mobile service response.",
  "targetKpi": "12 Core Deliverables • 3 Posts / Week • 250,000+ Reach in Kuwait • 30+ Qualified Fleet Inquiries",
  "pillarDistribution": {
    "pillar_heavy_iron": 35,
    "pillar_parts_fluids": 25,
    "pillar_service_field": 25,
    "pillar_commercial": 15
  },
  "concepts": [
    {
      "id": 301,
      "conceptNumber": 1,
      "week": "Week 1",
      "day": "Sunday",
      "publishDate": "2026-10-04",
      "deliverableCode": "DELIVERABLE 01 • DAY 02 (SUN)",
      "title": "D155A-6 Heavy Crawler Bulldozer – قوة الدفع في أقصى التضاريس الصخرية",
      "pillar": "pillar_heavy_iron",
      "format": "photography",
      "platforms": [
        "instagram",
        "linkedin",
        "facebook"
      ],
      "goal": "brand_awareness",
      "status": "ready",
      "targetAudience": "Earthmoving Contractors, Mine Foremen",
      "tov": "Powerful, Bold, Industrial",
      "summary": "Dramatic wide-angle ground shot of the D155A-6 engaging dense rock with its single-shank giant ripper. Highlights structural frame rigidity, lock-up torque converter efficiency, and sheer tractive effort under high resistance.",
      "hook": {
        "spokenEn": "When the rock refuses to yield, the Komatsu D155A-6 exerts sheer tractive dominance.",
        "spokenAr": "عندما تتوقف الحلول التقليدية أمام صلابة الأرض.. بلدوزر كوماتسو D155A-6 يفرض سيطرته بقوة دفع لا تلين.",
        "visualHook": "Dramatic wide-angle ground-level shot of the single-shank giant ripper fracturing dense bedrock."
      },
      "photoShots": [
        {
          "shotNo": 1,
          "angle": "Ultra-low ground angle 24mm",
          "focus": "Single-shank giant ripper penetrating dense bedrock with track grousers biting ground."
        },
        {
          "shotNo": 2,
          "angle": "Side 45-degree heroic profile",
          "focus": "Heavy blade curvature, reinforced push arms, and operator ROPS cabin."
        },
        {
          "shotNo": 3,
          "angle": "Macro mechanical detail",
          "focus": "Lock-up torque converter housing and heavy undercarriage track links."
        }
      ],
      "brollChecklist": [
        "Ground-level slow shutter of giant ripper fracture line",
        "Track shoe grousers clawing into rocky quarry floor",
        "Komatsu D155A-6 emblem with golden hour lighting"
      ],
      "postProductionNotes": "High-contrast cinematic grade with deep industrial shadows and vibrant Komatsu yellow highlights.",
      "captionEn": "Dense rock and extreme quarry terrain demand unmatched tractive effort.\n\nThe Komatsu D155A-6 heavy crawler dozer combines structural frame rigidity, a lock-up torque converter for maximum fuel efficiency, and a massive single-shank giant ripper engineered to break through the toughest bedrock.\n\nBuilt with Japanese engineering heritage to deliver non-stop pushing power across Kuwait's earthmoving and civil projects.\n\n📍 Dar Al Hay – Official Komatsu Distributor in Kuwait.",
      "captionAr": "الصخور الصلبة والتضاريس القاسية تتطلب قوة دفع لا تعرف التراجع.\n\nبلدوزر كوماتسو D155A-6 يجمع بين صلابة الهيكل الهندسية الفائقة، ومحول عزم الإغلاق (Lock-up Torque Converter) لتوفير الوقود، مع كسارة صخور خلفية عملاقة (Single-Shank Ripper) صُممت لاختراق أعتى الطبقات الصخرية.\n\nقوة يابانية رائدة تضمن إنتاجية مستمرة لأضخم مشاريع الحفر والتسوية في الكويت.\n\n📍 شركة دار الحي – الموزع المعتمد لكوماتسو في الكويت.",
      "hashtags": "#Komatsu #D155A #HeavyCrawler #Bulldozer #Earthmoving #HeavyMachinery #DarAlHay #KuwaitConstruction #QuarryOperations",
      "ctaText": "Contact Dar Al Hay heavy machinery division for Komatsu D155A technical specifications and availability.",
      "onAssetCopy": {
        "headlineEn": "SHEER TRACTIVE EFFORT UNDER HIGH RESISTANCE",
        "headlineAr": "قوة الدفع في أقصى التضاريس الصخرية",
        "badge": "KOMATSU D155A-6 • GIANT RIPPER",
        "callouts": [
          "Single-Shank Giant Ripper",
          "Lock-Up Torque Converter",
          "High-Rigidity Box Frame"
        ],
        "visualCta": "Inquire Today • Dar Al Hay Kuwait",
        "designNotes": "Ultra-wide ground-angle shot with high contrast; bold headline at top with Komatsu yellow badge."
      },
      "scenes": [],
      "slides": []
    },
    {
      "id": 302,
      "conceptNumber": 2,
      "week": "Week 1",
      "day": "Tuesday",
      "publishDate": "2026-10-06",
      "deliverableCode": "DELIVERABLE 02 • DAY 04 (TUE)",
      "title": "Komtrax Telematics: Fleet Intelligence – إدارة الأسطول الذكية ومراقبة استهلاك الوقود",
      "pillar": "pillar_service_field",
      "format": "reel",
      "platforms": [
        "instagram",
        "linkedin",
        "facebook"
      ],
      "goal": "product_education",
      "status": "ready",
      "targetAudience": "Fleet Managers, Operations Heads",
      "tov": "Instructive, Tech-Forward",
      "summary": "Split-screen video combining actual Komtrax desktop/mobile dashboard notifications with real-world machine operation. Demonstrates live fuel burn tracking, idle time alerts, and proactive maintenance error notifications before jobsite breakdowns happen.",
      "hook": {
        "spokenEn": "What if you could spot machine trouble before your operator even notices it?",
        "spokenAr": "ماذا لو استطعت اكتشاف أعطال المعدات وتجاوزات استهلاك الوقود قبل أن يلاحظها السائق؟",
        "visualHook": "Split screen snaps into view: Left is mobile phone getting an urgent yellow Komtrax alert; Right is an excavator operating on site."
      },
      "scenes": [
        {
          "sceneNo": 1,
          "time": "0:00 - 0:04",
          "visual": "Split-screen layout: Komtrax app screen showing real-time fuel burn rate (L/hr) synced with excavator digging on Kuwait site.",
          "talentAction": "Fleet manager glancing at tablet while machine swings behind office window.",
          "audioVoiceoverEn": "Total control over every drop of fuel and operating minute across your entire fleet.",
          "audioVoiceoverAr": "تحكم كامل في كل قطرة وقود ودقيقة تشغيل في أسطولك الميداني.",
          "onScreenTextEn": "LIVE SATELLITE FLEET TELEMETRY",
          "onScreenTextAr": "تتبع فوري للأساطيل عبر الأقمار الصناعية",
          "sfxMusic": "Modern digital notification ping + subtle machine hum"
        },
        {
          "sceneNo": 2,
          "time": "0:04 - 0:10",
          "visual": "Close-up of Komtrax dashboard highlight: Idle Time alert (32% idle) followed by proactive hydraulic pressure warning code.",
          "talentAction": "User taps alert to reveal exact machine coordinates and diagnostic error code.",
          "audioVoiceoverEn": "Spot excessive idling and catch sensor anomalies before they turn into costly breakdowns.",
          "audioVoiceoverAr": "راقب الهدر أثناء التوقف، واكتشف التحذيرات المبكرة قبل حدوث التوقف المفاجئ.",
          "onScreenTextEn": "PROACTIVE ERROR CODES • ZERO BREAKDOWNS",
          "onScreenTextAr": "تنبيهات صيانة استباقية • بدون توقف مفاجئ",
          "sfxMusic": "Fast electronic riser"
        },
        {
          "sceneNo": 3,
          "time": "0:10 - 0:16",
          "visual": "Dar Al Hay service desk receiving the same telematics alert and dispatching service unit immediately.",
          "talentAction": "Service coordinator tapping 'Dispatch Technician' button.",
          "audioVoiceoverEn": "Connected machines. Proactive service. That’s the Komtrax advantage with Dar Al Hay.",
          "audioVoiceoverAr": "معدات متصلة.. واستجابة ميدانية استباقية. هذه هي ميزة كوماتسو مع دار الحي.",
          "onScreenTextEn": "KOMTRAX FLEET INTELLIGENCE",
          "onScreenTextAr": "كومتركس: الإدارة الذكية للأسطول",
          "sfxMusic": "Affirmative chime + outro beat"
        }
      ],
      "brollChecklist": [
        "Screen capture of live Komtrax map with machine pins in Kuwait",
        "Macro of machine cabin satellite antenna receiver",
        "Operator in cab with Komtrax display terminal lit up"
      ],
      "postProductionNotes": "High-tech clean overlays, precise UI mockups synced with real machinery audio.",
      "captionEn": "Stop guessing fleet expenses. Komtrax satellite telemetry gives fleet owners full visibility over machine health, fuel burn, idle time, and proactive maintenance error codes 24/7.\n\nDiscover how intelligent telematics keeps your machines earning and cuts unnecessary operating costs.\n\n📲 Activated on every Komatsu machine via Dar Al Hay.",
      "captionAr": "لا تترك تكاليف التشغيل للصدفة. يمنحك نظام كومتركس (Komtrax) للأقمار الصناعية رؤية كاملة على مدار الساعة لاستهلاك الوقود، ساعات العمل الفعلي مقابل التوقف (Idle Time)، وتنبيهات الأعطال المسبقة قبل حدوثها.\n\nإدارة أسطول ذكية تحافظ على ميزانيتك وتضمن استمرار الإنتاجية.\n\n📲 مفعل في جميع معدات كوماتسو عبر دار الحي.",
      "hashtags": "#Komtrax #FleetManagement #Telematics #Komatsu #DarAlHay #KuwaitContractors #SmartFleet #Operations",
      "ctaText": "Request a live Komtrax fleet management demo for your company.",
      "slides": []
    },
    {
      "id": 303,
      "conceptNumber": 3,
      "week": "Week 1",
      "day": "Thursday",
      "publishDate": "2026-10-08",
      "deliverableCode": "DELIVERABLE 03 • DAY 06 (THU)",
      "title": "Genuine Fluids Under Summer Heat – الزيوت الأصلية: صمام الأمان في حرارة الصيف",
      "pillar": "pillar_parts_fluids",
      "format": "carousel",
      "platforms": [
        "linkedin",
        "instagram",
        "facebook"
      ],
      "goal": "product_education",
      "status": "ready",
      "targetAudience": "Maintenance Engineers, Procurement",
      "tov": "Analytical, Educational",
      "summary": "Slide breakdown of viscosity retention at 50°C ambient temperatures. Compares Komatsu genuine hydraulic fluid with generic lubricants, showing anti-wear additive packages, valve cavitation prevention, and extended hydraulic pump longevity.",
      "slides": [
        {
          "slideNo": 1,
          "title": "50°C Ambient Heat: Why Generic Fluids Fail",
          "body": "When ambient desert heat reaches 50°C, hydraulic oil temperatures exceed 90°C inside cylinders. Low-grade commercial oils experience rapid viscosity thinning, leading to metal-on-metal friction and valve cavitation."
        },
        {
          "slideNo": 2,
          "title": "Viscosity Retention & Thermal Stability",
          "body": "Komatsu Genuine Hydraulic Fluid utilizes high-viscosity-index mineral base stocks that maintain a stable lubricating film even under continuous maximum working pressure and desert thermal stress."
        },
        {
          "slideNo": 3,
          "title": "Proprietary Anti-Wear Additive Package",
          "body": "Formulated specifically for Komatsu axial piston pumps and control valves. Prevents micro-pitting, reduces foaming, and shields spool tolerances measured in microns against abrasive soot and dust."
        },
        {
          "slideNo": 4,
          "title": "The True TCO: Double Pump Service Life",
          "body": "Saving 15% on generic oil risks a $12,000 hydraulic pump rebuild and costly jobsite downtime. Genuine Komatsu fluids protect factory warranties and extend component lifecycles to 10,000+ operating hours."
        }
      ],
      "brollChecklist": [
        "Macro of golden Komatsu genuine hydraulic fluid pouring into clean sight gauge",
        "Laboratory viscosity graph showing generic vs genuine oil curve at 100°C",
        "Sealed genuine Komatsu DH / HO blue-and-yellow drums in Shuwaikh warehouse"
      ],
      "postProductionNotes": "Clean scientific comparison graphics with temperature gradients (cool blue to heat red).",
      "captionEn": "In Kuwait's severe climate, hydraulic fluid is not just a lubricant — it is a critical machine component.\n\nAt 50°C ambient temperatures, generic lubricants lose film strength, causing valve cavitation and pump wear. Komatsu Genuine Fluids are engineered specifically to maintain viscosity and protect high-pressure components.\n\nSwipe through the technical breakdown to understand the science behind genuine protection ➡️",
      "captionAr": "في مناخ الكويت الصيفي، زيت الهيدروليك ليس مجرد سائل تشحيم.. بل هو صمام الأمان لمنظومة المعدة بالكامل.\n\nعندما تلامس الحرارة 50 درجة مئوية، تفقد الزيوت التجارية غير المعتمدة لزوجتها سريعاً مسببة تآكل المضخات وتجويف الصمامات (Cavitation). زيوت كوماتسو الأصلية صُممت خصيصاً لتحافظ على ثباتها الحراري تحت أقصى ضغوط العمل.\n\nاسحب الشاشة للتعرف على الفرق الهندسي الدقيق ➡️",
      "hashtags": "#GenuineFluids #KomatsuParts #HydraulicOil #PreventiveMaintenance #TCO #DarAlHay #HeavyEquipment #KuwaitEngineers",
      "ctaText": "Order genuine Komatsu hydraulic and engine oil packs directly from Dar Al Hay central warehouse in Shuwaikh.",
      "scenes": []
    },
    {
      "id": 304,
      "conceptNumber": 4,
      "week": "Week 2",
      "day": "Sunday",
      "publishDate": "2026-10-11",
      "deliverableCode": "DELIVERABLE 04 • DAY 09 (SUN)",
      "title": "WA480 Wheel Loader: Fast Loading Cycles – إنتاجية الكسارات وسرعة التحميل القياسية",
      "pillar": "pillar_heavy_iron",
      "format": "reel",
      "platforms": [
        "instagram",
        "linkedin",
        "facebook"
      ],
      "goal": "case_study",
      "status": "ready",
      "targetAudience": "Quarry Operators, Batch Plant Leads",
      "tov": "Dynamic, High-Speed, Robust",
      "summary": "Fast-cut field reel documenting rapid V-shape truck loading in quarry aggregates. Showcases the high bucket-fill factor, quick forward/reverse directional shifts, and responsive hydraulics that save critical seconds per truck turn.",
      "hook": {
        "spokenEn": "Every 5 seconds saved per truck load adds up to hundreds of tons per shift.",
        "spokenAr": "كل 5 ثوانٍ توفرها في دورة التحميل تعني مئات الأطنان الإضافية في كل وردية.",
        "visualHook": "Rapid-cut high-speed montage: Heavy WA480 bucket plunging into aggregate pile, boom rocketing upwards, gravel cascading into tipper truck."
      },
      "scenes": [
        {
          "sceneNo": 1,
          "time": "0:00 - 0:04",
          "visual": "Fast-paced ground shot of Komatsu WA480 piercing aggregate stock pile with powerful tractive push; bucket rolls back fully filled.",
          "talentAction": "Operator effortlessly executes smooth high-curl bucket movement.",
          "audioVoiceoverEn": "Maximum bucket-fill factor on the first push.",
          "audioVoiceoverAr": "امتلاء كامل للمغرفة من أول دفعة.",
          "onScreenTextEn": "HIGH BUCKET-FILL FACTOR",
          "onScreenTextAr": "أعلى معامل امتلاء للمغرفة",
          "sfxMusic": "Punchy industrial drum hit + gravel crash"
        },
        {
          "sceneNo": 2,
          "time": "0:04 - 0:10",
          "visual": "Wide angle showing seamless V-shape loading cycle: quick directional reverse shift, rapid travel, dumping clean into waiting tipper truck.",
          "talentAction": "Smooth direction change with electronic clutch modulation.",
          "audioVoiceoverEn": "Instant direction shifts and ultra-responsive hydraulics save critical seconds on every cycle.",
          "audioVoiceoverAr": "استجابة هيدروليكية فائقة وسلاسة في التبديل توفر ثوانٍ ثمينة في كل دورة.",
          "onScreenTextEn": "FAST V-SHAPE LOADING CYCLE",
          "onScreenTextAr": "سرعة قياسية في دورات التحميل",
          "sfxMusic": "Rising rhythmic synth pulse"
        },
        {
          "sceneNo": 3,
          "time": "0:10 - 0:16",
          "visual": "Loaded tipper pulling away as WA480 is already positioning for the next truck; on-screen stats ticker.",
          "talentAction": "Thumbs up from truck driver, loader in fluid continuous motion.",
          "audioVoiceoverEn": "Komatsu WA480: The heartbeat of high-output quarry and batch plant operations.",
          "audioVoiceoverAr": "كوماتسو WA480: شريان الإنتاجية في الكسارات ومحطات الخرسانة.",
          "onScreenTextEn": "KOMATSU WA480 • MAXIMUM TONNAGE",
          "onScreenTextAr": "كوماتسو WA480 • إنتاجية بلا توقف",
          "sfxMusic": "Heavy low-end impact + engine roar fade"
        }
      ],
      "brollChecklist": [
        "High-speed 120fps slow-motion of gravel falling from 4.5m³ bucket",
        "Operator cabin controls: ergonomic joystick finger adjustments",
        "Side-view tire grip under heavy crowd force into aggregate pile"
      ],
      "postProductionNotes": "Punchy speed ramps, crisp foley sound of crushing gravel and roaring Komatsu SAA6D125E engine.",
      "captionEn": "In quarries and concrete batch plants, seconds translate directly into profit.\n\nThe Komatsu WA480 wheel loader is engineered for ultra-fast V-shape loading cycles, outstanding breakout force, and superior fuel economy. Watch how quick directional shifts and high bucket-fill factors keep haul trucks rolling without delay.\n\n🚜 Power your production with Dar Al Hay Kuwait.",
      "captionAr": "في الكسارات ومحطات الخرسانة الجاهزة، كل ثانية توفرها في دورة التحميل تتحول مباشرة إلى أرباح إضافية.\n\nتتميز لودر كوماتسو WA480 بسرعة استثنائية في دورات التحميل (V-Shape Cycle)، وقوة رفع هيدروليكية هائلة تضمن سرعة ملء الشاحنات دون أي هدر للوقت أو الوقود.\n\n🚜 ارفع معدلات إنتاجية مشروعك مع دار الحي الكويت.",
      "hashtags": "#WA480 #WheelLoader #QuarryOperations #Aggregate #BatchPlant #Komatsu #DarAlHay #KuwaitConstruction #Earthmoving",
      "ctaText": "Explore Komatsu WA480 wheel loader configurations and bucket attachments.",
      "slides": []
    },
    {
      "id": 305,
      "conceptNumber": 5,
      "week": "Week 2",
      "day": "Tuesday",
      "publishDate": "2026-10-13",
      "deliverableCode": "DELIVERABLE 05 • DAY 11 (TUE)",
      "title": "5-Minute Pre-Shift Machine Walkaround – 5 دقائق فحص يومي تجنبك توقف الموقع المفاجئ",
      "pillar": "pillar_service_field",
      "format": "carousel",
      "platforms": [
        "linkedin",
        "instagram",
        "facebook"
      ],
      "goal": "expertise",
      "status": "ready",
      "targetAudience": "Site Foremen, Operators",
      "tov": "Practical, Field-Ready",
      "summary": "Bookmarkable checklist for operators: 1. Fluid sight gauges, 2. Track sagging and link tension, 3. Hydraulic line friction and weeping, 4. Radiator core airflow clearance, 5. Central grease point distribution.",
      "slides": [
        {
          "slideNo": 1,
          "title": "Check 1: Fluid Sight Gauges & Levels",
          "body": "Inspect engine oil dipstick, coolant expansion tank, and hydraulic sight gauge with the machine on level ground and cylinders retracted. Verify fluid clarity and ensure no foaming or discoloration."
        },
        {
          "slideNo": 2,
          "title": "Check 2: Track Sagging & Link Tension",
          "body": "Measure track sag between carrier rollers according to factory manual (usually 20-30mm). Tracks that are too tight accelerate bushing wear; tracks that are too loose risk de-tracking in sand."
        },
        {
          "slideNo": 3,
          "title": "Check 3: Hydraulic Line Friction & Weeping",
          "body": "Inspect main boom and arm high-pressure flexible hoses. Check routing clamps for looseness and look for weeping at hose swage fittings before micro-leaks blow out under 350-bar pressure."
        },
        {
          "slideNo": 4,
          "title": "Check 4: Radiator Core Airflow Clearance",
          "body": "Kuwait desert dust quickly clogs cooling fins. Check oil cooler and radiator screens. Clear compacted sand before shift startup to prevent engine temperature derating in high ambient heat."
        },
        {
          "slideNo": 5,
          "title": "Check 5: Central Grease Points & Pins",
          "body": "Purge bucket pivot pins, boom foot, and swing bearing with fresh Komatsu heavy grease until clean lubricant emerges. Daily purging expels abrasive silica sand and extends pin life by 300%."
        }
      ],
      "brollChecklist": [
        "Hands measuring track sag with metal ruler",
        "Clear macro shot of clean hydraulic sight glass oil meniscus",
        "Grease gun coupler snapping onto zerk fitting with fresh grease purging"
      ],
      "postProductionNotes": "Numbered checklist format with checkmark icons and clean step-by-step layout.",
      "captionEn": "5 minutes of disciplined inspection before every shift can save hours of unplanned downtime and thousands of dinars in repairs.\n\nSave this practical 5-point walkaround checklist for your site foremen, operators, and maintenance teams. Share it across your jobsite WhatsApp groups 📌\n\nEquipped and supported by Dar Al Hay Kuwait.",
      "captionAr": "5 دقائق فقط من الفحص اليومي الواعي قبل بداية الوردية تحميك من توقف مفاجئ للمعدة وتوفر آلاف الدنانير من تكاليف الصيانة.\n\nاحفظ هذا الدليل العملي المكون من 5 نقاط وشاركه مع مشرفي المواقع وسائقي المعدات في مشروعك 📌\n\nدعم هندسي مستمر من شركة دار الحي كوماتسو الكويت.",
      "hashtags": "#MaintenanceGuide #PreShiftWalkaround #OperatorTips #JobsiteSafety #KomatsuKuwait #PreventiveCare #DarAlHay #FleetUptime",
      "ctaText": "Bookmark this guide and request laminated cab-check cards from Dar Al Hay for your operators.",
      "scenes": []
    },
    {
      "id": 306,
      "conceptNumber": 6,
      "week": "Week 2",
      "day": "Thursday",
      "publishDate": "2026-10-15",
      "deliverableCode": "DELIVERABLE 06 • DAY 13 (THU)",
      "title": "Mobile Service Vans: Jobsite Ready – ورش الصيانة المتنقلة: نصل إليك أينما كان مشروعك",
      "pillar": "pillar_service_field",
      "format": "photography",
      "platforms": [
        "instagram",
        "linkedin",
        "facebook"
      ],
      "goal": "trust_humanize",
      "status": "ready",
      "targetAudience": "General Contractors, Project Directors",
      "tov": "Reassuring, Professional",
      "summary": "Clean, high-impact visual of a fully kitted Komatsu field service van dispatched right next to heavy equipment on a desert project. Highlights onboard diagnostic tooling, crane support, genuine parts stock, and rapid on-site emergency repair capabilities.",
      "photoShots": [
        {
          "shotNo": 1,
          "angle": "Crisp wide environmental landscape",
          "focus": "Branded Dar Al Hay / Komatsu mobile service truck parked alongside PC350LC in remote desert site."
        },
        {
          "shotNo": 2,
          "angle": "Side profile of open vehicle compartments",
          "focus": "Mounted air compressor, lube dispensing reels, onboard crane hoist, and organized genuine parts bins."
        },
        {
          "shotNo": 3,
          "angle": "Medium shot of certified technician",
          "focus": "Technician in high-visibility Komatsu gear holding diagnostic computer tablet connected to equipment."
        }
      ],
      "brollChecklist": [
        "Van emergency strobe lights reflecting off evening sand",
        "Onboard hydraulic hose crimping machine in action",
        "Technician smiling with confidence next to machine tracks"
      ],
      "postProductionNotes": "Premium twilight/golden-hour grading, sharp vehicle graphics, high-visibility PPE colors popping.",
      "captionEn": "No matter how remote your jobsite in Kuwait — from the northern border works to South Mutlaa and coastal projects — Dar Al Hay’s mobile service fleet brings full workshop capabilities directly to your machine.\n\nEquipped with onboard diagnostic computers, crane hoists, emergency hose crimping, and fast-moving genuine spares, our factory-certified technicians minimize jobsite interruption.\n\n📍 We reach you wherever your project builds.",
      "captionAr": "مهما كان موقع مشروعك بعيداً في صحراء الكويت — من أقصى الشمال إلى جنوب المطلاع والمشاريع الساحلية — ورش دار الحي المتنقلة تجلب إمكانيات مركز الصيانة مباشرة إلى موقع معدتك.\n\nمجهزة بأحدث أجهزة الفحص الإلكتروني، وروافع هيدروليكية، ومخزون لقطع الغيار السريعة، مع فنيين معتمدين جاهزين للتعامل مع أي طارئ بسرعة وكفاءة.\n\n📍 نصل إليك أينما كان مشروعك.. لنضمن استمرار العمل.",
      "hashtags": "#MobileService #FieldService #KomatsuKuwait #24_7Support #JobsiteReady #DarAlHay #KuwaitContractors #EmergencyRepair",
      "ctaText": "Save Dar Al Hay's 24/7 Mobile Field Dispatch direct hotline.",
      "scenes": [],
      "slides": []
    },
    {
      "id": 307,
      "conceptNumber": 7,
      "week": "Week 3",
      "day": "Sunday",
      "publishDate": "2026-10-18",
      "deliverableCode": "DELIVERABLE 07 • DAY 16 (SUN)",
      "title": "PC350LC Heavy Duty Boom & Arm – الصلابة الهيكلية لذراع الحفر في أصعب البيئات",
      "pillar": "pillar_heavy_iron",
      "format": "designed_post",
      "platforms": [
        "linkedin",
        "instagram",
        "facebook"
      ],
      "goal": "product_education",
      "status": "ready",
      "targetAudience": "Civil & Infrastructure Contractors",
      "tov": "Premium, Rugged, Unmatched",
      "summary": "Close-up engineering aesthetic focusing on high-tensile steel boom casting, internal baffle reinforcement plates, and large-diameter pins. Accompanying copy breaks down structural stress dissipation during tough rock excavation.",
      "photoShots": [
        {
          "shotNo": 1,
          "angle": "Close-up 50mm technical angle",
          "focus": "Massive robotic weld seams connecting the boom pivot casting to heavy high-tensile steel side plates."
        },
        {
          "shotNo": 2,
          "angle": "Cutaway infographic overlay",
          "focus": "Internal baffle plates distributing torsional digging stress along the arm box structure."
        },
        {
          "shotNo": 3,
          "angle": "Arm foot pivot pin macro",
          "focus": "Induction-hardened large diameter chrome pin and tungsten-carbide coated bushings."
        }
      ],
      "brollChecklist": [
        "Macro zoom on factory robotic weld seams",
        "Infographic callout labels pointing to high-stress dissipation zones",
        "PC350LC boom in deep rock trench lifting heavy basalt boulder"
      ],
      "postProductionNotes": "Blueprint / technical infographic overlay with callout arrows and steel tensile strength ratings (MPa).",
      "captionEn": "Excavating dense rock and hardpan caliche in Kuwait places immense torsional stress on an excavator’s boom and arm.\n\nThe Komatsu PC350LC-8M0 features thick high-tensile steel plates, continuous robotic submerged-arc welding, internal partition baffle plates, and large-diameter induction-hardened pins designed to dissipate stress and eliminate fatigue cracking.\n\nEngineered in Japan. Proven across Kuwait's hardest civil excavations.\n\n🏗️ Discover the structural superiority of Komatsu with Dar Al Hay.",
      "captionAr": "أعمال الحفر في الصخور والطبقات الصلبة (الصلبوخ) في الكويت تفرض إجهاداً هائلاً على ذراع الحفار.\n\nتم تصميم ذراع وبوم كوماتسو PC350LC-8M0 بهيكل صندوقي معزز بصفائح فولاذية عالية الشد، ولحامات روبوتية متواصلة، مع ألواح دعم داخلية (Internal Baffles) لتشتيت الإجهاد، ومحاور مفصلية معالجة حرارياً لمنع أي تشققات هيكلية على المدى الطويل.\n\nمتانة يابانية متفوقة تضمن بقاء الحفار يعمل بكامل طاقته لسنوات طويلة.\n\n🏗️ اكتشف تفاصيل الهندسة اليابانية مع دار الحي كوماتسو الكويت.",
      "hashtags": "#PC350LC #Excavator #BoomAndArm #StructuralEngineering #HeavyExcavation #JapaneseEngineering #DarAlHay #Komatsu",
      "ctaText": "View full technical specifications of the Komatsu PC350LC-8M0 at Dar Al Hay.",
      "scenes": [],
      "slides": []
    },
    {
      "id": 308,
      "conceptNumber": 8,
      "week": "Week 3",
      "day": "Tuesday",
      "publishDate": "2026-10-20",
      "deliverableCode": "DELIVERABLE 08 • DAY 18 (TUE)",
      "title": "Inside the Central Spares Distribution Hub – من الرف إلى موقع العمل: جاهزية فورية لأصعب التحديات",
      "pillar": "pillar_parts_fluids",
      "format": "reel",
      "platforms": [
        "instagram",
        "linkedin",
        "facebook"
      ],
      "goal": "trust_humanize",
      "status": "ready",
      "targetAudience": "Spare Parts Buyers, Fleet Managers",
      "tov": "Fast-Paced, Customer-Centric",
      "summary": "Fast, rhythmic warehouse walkthrough tracking an order from automated picking to courier packaging and field dispatch. Emphasizes 95%+ first-pick availability and zero-downtime commitment for critical wear parts.",
      "hook": {
        "spokenEn": "When your machine is down on site, every minute waiting for parts costs real money.",
        "spokenAr": "عندما تتوقف معدتك في الموقع، كل دقيقة انتظار لقطعة الغيار تكلفك الكثير.",
        "visualHook": "Fast tracking shot following an automated barcode picker gliding down tall multi-level warehouse aisles filled with genuine Komatsu yellow boxes in Shuwaikh."
      },
      "scenes": [
        {
          "sceneNo": 1,
          "time": "0:00 - 0:04",
          "visual": "Wide high-bay warehouse shot in Shuwaikh: Barcode scanner beeping, inventory specialist picking genuine part package.",
          "talentAction": "Specialist scanning item barcode; digital display confirms item match.",
          "audioVoiceoverEn": "Over 15,000 line items ready in stock right here in Shuwaikh.",
          "audioVoiceoverAr": "أكثر من 15,000 صنف أصلي متوفر في مستودعاتنا المركزية بالشويخ.",
          "onScreenTextEn": "95%+ FIRST-PICK AVAILABILITY",
          "onScreenTextAr": "جاهزية فورية تفوق 95% لقطع الغيار",
          "sfxMusic": "Satisfying barcode beep + dynamic electronic beat"
        },
        {
          "sceneNo": 2,
          "time": "0:04 - 0:10",
          "visual": "Quick cuts: Quality verification inspection, boxing in heavy-duty packaging, tagging with delivery barcode.",
          "talentAction": "Careful packaging with official Komatsu holographic tamper seal applied.",
          "audioVoiceoverEn": "From order confirmation to dispatch in under 45 minutes for critical jobsite breakdowns.",
          "audioVoiceoverAr": "من تأكيد الطلب إلى التجهيز والشحن في أقل من 45 دقيقة للحالات الطارئة.",
          "onScreenTextEn": "RAPID EXPEDITION & PACKAGING",
          "onScreenTextAr": "تجهيز وشحن فوري للحالات الطارئة",
          "sfxMusic": "Percussive riser + tape dispensing foley"
        },
        {
          "sceneNo": 3,
          "time": "0:10 - 0:16",
          "visual": "Dispatch door rolling up; driver loading container into express service van driving straight to Kuwait project.",
          "talentAction": "Driver closing rear door, van wheels rolling onto Shuwaikh street.",
          "audioVoiceoverEn": "Your parts on site when you need them. Dar Al Hay: Protecting your uptime.",
          "audioVoiceoverAr": "قطعك تصل لموقعك فوراً.. دار الحي: شريكك الدائم لاستمرارية العمل.",
          "onScreenTextEn": "ZERO DOWNTIME COMMITMENT",
          "onScreenTextAr": "التزامنا: صفر توقف لأعمالك",
          "sfxMusic": "Energetic cymbal smash + outro"
        }
      ],
      "brollChecklist": [
        "Overhead drone / high gimbal glide along Shuwaikh warehouse racking",
        "Macro of genuine Komatsu hologram tamper-evident label",
        "Inventory screen updating stock count automatically"
      ],
      "postProductionNotes": "Fast snappy editing, rhythmic sound effects synced to footsteps and barcode scans.",
      "captionEn": "Waiting days for overseas parts shipment is a thing of the past.\n\nInside Dar Al Hay’s central Shuwaikh distribution hub, over 15,000 genuine Komatsu parts — from seal kits and hydraulic sensors to turbochargers and undercarriage rollers — are cataloged with 95%+ first-pick availability.\n\n📦 Watch how our expedited logistics keeps Kuwait’s machinery fleets running non-stop.",
      "captionAr": "انتظار وصول قطع الغيار من الخارج لأيام أصبح من الماضي.\n\nمن داخل مركز التوزيع الرئيسي لدار الحي بالشويخ، أكثر من 15,000 قطعة غيار أصلية جاهزة على الرفوف — من أطقم الجوانات ومستشعرات الهيدروليك إلى التيربو وبكرات الجنازير — بنسبة توافر فوري تتجاوز 95%.\n\n📦 شاهد سرعة منظومتنا اللوجستية في خدمة أساطيل المقاولات بالكويت.",
      "hashtags": "#SpareParts #Warehouse #KomatsuKuwait #SupplyChain #ZeroDowntime #Shuwaikh #DarAlHay #GenuineParts",
      "ctaText": "Check spare parts availability via our direct WhatsApp parts counter.",
      "slides": []
    },
    {
      "id": 309,
      "conceptNumber": 9,
      "week": "Week 3",
      "day": "Thursday",
      "publishDate": "2026-10-22",
      "deliverableCode": "DELIVERABLE 09 • DAY 20 (THU)",
      "title": "Undercarriage Diagnostics: Signs of Wear – دليل فحص وتآكل هيكل السير والجنزير",
      "pillar": "pillar_parts_fluids",
      "format": "carousel",
      "platforms": [
        "linkedin",
        "instagram",
        "facebook"
      ],
      "goal": "expertise",
      "status": "ready",
      "targetAudience": "Heavy Machinery Workshop Chiefs",
      "tov": "Technical, Cost-Saving",
      "summary": "Visual comparison illustrating sprocket tooth thinning, track link pitch extension, and carrier roller scalloping. Includes actionable thresholds on when to turn pins and bushings to double the operational lifecycle of the track chains.",
      "slides": [
        {
          "slideNo": 1,
          "title": "Sprocket Tooth Thinning & Root Wear",
          "body": "Inspect drive sprocket teeth for reverse-drive thinning and root pocket erosion. As link pitch extends, bushings ride up on tooth tips, accelerating drive motor stress and track slap."
        },
        {
          "slideNo": 2,
          "title": "Track Link Pitch Extension Measurement",
          "body": "Use a precision 4-link caliper across 4 pins. A pitch extension greater than 3% indicates internal pin and bushing wear, alerting you to schedule maintenance before master link failure."
        },
        {
          "slideNo": 3,
          "title": "Actionable Threshold: Turning Pins & Bushings",
          "body": "Turning pins and bushings 180° at 50% wear exposes unworn contact surfaces. This simple workshop procedure doubles track chain lifecycle and saves up to 45% compared to purchasing new chains."
        },
        {
          "slideNo": 4,
          "title": "Carrier & Track Roller Scalloping",
          "body": "Check roller flanges for uneven dish-shaped wear (scalloping). Uneven wear indicates misalignment or packed debris, which damages track rail surfaces and increases rolling resistance."
        }
      ],
      "brollChecklist": [
        "Ultrasonic gauge measuring remaining track shoe grouser thickness",
        "Worn vs brand-new sprocket side-by-side graphic overlay",
        "Hydraulic track tensioner grease relief valve inspection"
      ],
      "postProductionNotes": "Clear before/after diagrammatic slides with measurement millimeter callouts.",
      "captionEn": "The undercarriage represents up to 50% of an excavator or dozer’s lifetime maintenance cost.\n\nCatching wear early and turning pins and bushings at the right threshold can double the operational life of your track chains and slash replacement costs by thousands of dinars.\n\nSwipe through our certified workshop guide for actionable inspection thresholds ➡️",
      "captionAr": "يمثل هيكل السير والجنزير (Undercarriage) ما يصل إلى 50% من إجمالي تكاليف صيانة الحفارات والبلدوزرات طوال عمرها التشغيلي.\n\nاكتشاف التآكل مبكراً وتدوير البنوز والجلب (Pin & Bushing Turn) في التوقيت المناسب يضاعف عمر الجنزير ويوفر آلاف الدنانير مقارنة بشراء طقم جديد بالكامل.\n\nاسحب الشاشة للاطلاع على دليل الفحص الهندسي والنسب المسموحة ➡️",
      "hashtags": "#Undercarriage #TrackWear #SprocketWear #PreventiveMaintenance #WorkshopChiefs #DarAlHay #Komatsu #CostSaving",
      "ctaText": "Book an on-site Ultrasonic Undercarriage Wear Inspection with Dar Al Hay specialists.",
      "scenes": []
    },
    {
      "id": 310,
      "conceptNumber": 10,
      "week": "Week 4",
      "day": "Sunday",
      "publishDate": "2026-10-25",
      "deliverableCode": "DELIVERABLE 10 • DAY 23 (SUN)",
      "title": "HM400 Articulated Dump Truck: Sand Mobility – نظام الجر المتطور KTCS: ثبات كامل في الرمال الناعمة",
      "pillar": "pillar_heavy_iron",
      "format": "reel",
      "platforms": [
        "instagram",
        "linkedin",
        "facebook"
      ],
      "goal": "product_education",
      "status": "ready",
      "targetAudience": "Large Bulk-Earthmoving Contractors",
      "tov": "Authoritative, Heavy-Duty",
      "summary": "High-definition footage of an HM400 fully loaded traversing deep desert dunes. Dynamic overlay graphics illustrate the Komatsu Traction Control System (KTCS) auto-locking inter-axle differentials without operator intervention.",
      "hook": {
        "spokenEn": "40 tons of rock moving through soft desert sand without getting stuck. How?",
        "spokenAr": "40 طناً من الصخور تتحرك بسلاسة عبر الرمال الصحراوية الناعمة دون توقف أو غرز.. كيف؟",
        "visualHook": "Massive Komatsu HM400 hauler thundering through a steep dune incline, kicking up rooster tails of sand while maintaining relentless forward momentum."
      },
      "scenes": [
        {
          "sceneNo": 1,
          "time": "0:00 - 0:04",
          "visual": "Dune level camera: Massive HM400 articulated hauler loaded with 40 tons navigating soft deep sand incline with total traction.",
          "talentAction": "Truck maintains steady climbing speed without wheel spin.",
          "audioVoiceoverEn": "Deep desert dunes and loose sand stop ordinary haul trucks in their tracks.",
          "audioVoiceoverAr": "الرمال الصحراوية الناعمة توقف شاحنات النقل العادية في مكانها..",
          "onScreenTextEn": "CONQUERING SOFT DESERT SAND",
          "onScreenTextAr": "ثبات وقوة في الرمال الناعمة",
          "sfxMusic": "Low rumble + heavy engine turbo spool"
        },
        {
          "sceneNo": 2,
          "time": "0:04 - 0:10",
          "visual": "3D HUD graphic overlay on wheels: KTCS sensors detect micro-slip on left rear axle and automatically engage differential inter-lock in milliseconds.",
          "talentAction": "Close-up inside cab: Operator keeps hands steadily on wheel, no manual diff-lock buttons pressed.",
          "audioVoiceoverEn": "KTCS: Komatsu Traction Control System. Automatic differential locking with zero operator input required.",
          "audioVoiceoverAr": "نظام الجر المتطور KTCS: إقفال تفاضلي تلقائي ذكي دون أي تدخل يدوي من السائق.",
          "onScreenTextEn": "KTCS • AUTOMATIC TRACTION CONTROL",
          "onScreenTextAr": "نظام KTCS للتحكم الذكي بالجر",
          "sfxMusic": "Futuristic mechanical engagement click + bass synth"
        },
        {
          "sceneNo": 3,
          "time": "0:10 - 0:16",
          "visual": "HM400 cresting ridge effortlessly and dumping payload at fill site; Dar Al Hay badge.",
          "talentAction": "Truck body raises smoothly, rocks unloading.",
          "audioVoiceoverEn": "Move more material, faster, through the harshest terrain. Komatsu HM400.",
          "audioVoiceoverAr": "انقل كميات أكبر، بسرعة وأمان، في أقسى التضاريس. كوماتسو HM400.",
          "onScreenTextEn": "KOMATSU HM400 • 40-TON HAULER",
          "onScreenTextAr": "كوماتسو HM400 • حمولة 40 طناً",
          "sfxMusic": "Power swell + orchestral hit"
        }
      ],
      "brollChecklist": [
        "Ground wheel level 4K 60fps showing wide flotation tires flexing over loose sand",
        "Cab articulate pivot joint twisting smoothly during tight turning",
        "Payload heap view with sky backdrop"
      ],
      "postProductionNotes": "Epic desert color grading, sleek blue-and-gold tech HUD overlays showing wheel speed and torque distribution.",
      "captionEn": "Moving 40 tons of earth through Kuwait’s loose desert sand requires more than raw horsepower — it requires intelligent traction.\n\nThe Komatsu HM400 articulated dump truck features KTCS (Komatsu Traction Control System). When sensors detect wheel slip, KTCS automatically engages the optimal differential lock within milliseconds, delivering uninterrupted pushing power without slowing the operator down.\n\n🚛 Discover peak hauling productivity with Dar Al Hay Kuwait.",
      "captionAr": "نقل 40 طناً من التربة والصخور عبر الرمال الناعمة في الكويت يحتاج لأكثر من مجرد قوة محرك.. يحتاج إلى ذكاء حركي متطور.\n\nتتميز شاحنة النقل المفصلية كوماتسو HM400 بنظام التحكم بالجر الذكي (KTCS). بمجرد استشعار أي انزلاق، يقوم النظام تلقائياً بتفعيل القفل التفاضلي المناسب في أجزاء من الثانية دون حاجة لتدخل السائق، مما يحافظ على سرعة النقل واستمرارية العمل.\n\n🚛 اكتشف أعلى إنتاجية لنقل الردم مع دار الحي كوماتسو الكويت.",
      "hashtags": "#HM400 #ArticulatedDumpTruck #KTCS #SandMobility #BulkEarthmoving #Komatsu #DarAlHay #KuwaitInfrastructure",
      "ctaText": "Consult with Dar Al Hay specialists on fleet sizing and articulated dump truck leasing or sales.",
      "slides": []
    },
    {
      "id": 311,
      "conceptNumber": 11,
      "week": "Week 4",
      "day": "Tuesday",
      "publishDate": "2026-10-27",
      "deliverableCode": "DELIVERABLE 11 • DAY 25 (TUE)",
      "title": "Meet the Master Field Technician – سواعد وطنية وخبرات هندسية تضمن استمرار العمل",
      "pillar": "pillar_service_field",
      "format": "reel",
      "platforms": [
        "instagram",
        "linkedin",
        "facebook"
      ],
      "goal": "trust_humanize",
      "status": "ready",
      "targetAudience": "Corporate Decision Makers",
      "tov": "Warm, Inspiring, Confident",
      "summary": "Documentary-style spotlight featuring a senior factory-certified field technician. Captures precise calibration of common-rail injection pressures, hydraulic valve tuning, and a dedication to safeguarding client uptime.",
      "hook": {
        "spokenEn": "A machine is only as good as the hands that care for it.",
        "spokenAr": "قوة المعدة وعمرها التشغيلي يعتمد أولاً على خبرة وإخلاص الأيدي التي تعتني بها.",
        "visualHook": "Warm cinematic slow-motion portrait of a senior certified master technician strapping his hardhat at sunrise with a calm, proud smile."
      },
      "scenes": [
        {
          "sceneNo": 1,
          "time": "0:00 - 0:05",
          "visual": "Cinematic close-up of senior technician looking at calibrated digital gauge in workshop; delicate precision adjustments.",
          "talentAction": "Calibrating common-rail injection pressure to exact factory micron specifications.",
          "audioVoiceoverEn": "Behind every roaring engine is engineering precision measured in microns.",
          "audioVoiceoverAr": "وراء هدير كل محرك دقة هندسية تُقاس بالميكرون.",
          "onScreenTextEn": "FACTORY-CERTIFIED MASTERY",
          "onScreenTextAr": "خبرات هندسية معتمدة من المصنع",
          "sfxMusic": "Gentle emotional strings + piano chords"
        },
        {
          "sceneNo": 2,
          "time": "0:05 - 0:11",
          "visual": "Montage of field visits: Technician greeting site manager with warm professional handshake, checking hydraulic line, tuning valve bank.",
          "talentAction": "Confident, courteous interaction on site; wiping hands with clean towel, signing off report.",
          "audioVoiceoverEn": "Years of Komatsu factory training, dedicated to keeping Kuwait’s biggest projects running on schedule.",
          "audioVoiceoverAr": "سنوات من التدريب في مصانع كوماتسو، نكرسها لنضمن إنجاز أضخم مشاريع الكويت في موعدها.",
          "onScreenTextEn": "SAFEGUARDING YOUR UPTIME",
          "onScreenTextAr": "نحمي إنتاجيتك.. ونضمن استمرارية أعمالك",
          "sfxMusic": "Inspiring orchestral swell"
        },
        {
          "sceneNo": 3,
          "time": "0:11 - 0:18",
          "visual": "Technician standing proudly in front of a gleaming PC350LC as the sun illuminates the machine; Dar Al Hay logo lockup.",
          "talentAction": "Proud smile directly to camera.",
          "audioVoiceoverEn": "We don’t just repair iron. We build trust. Dar Al Hay — Your engineering partner.",
          "audioVoiceoverAr": "لا نقوم بصيانة المعدات فقط.. بل نبني شراكة وثقة تدوم. دار الحي — شريكك الهندسي المعتمد.",
          "onScreenTextEn": "DAR AL HAY • PRECISION & TRUST",
          "onScreenTextAr": "دار الحي • دقة، خبرة، وثقة مستمرة",
          "sfxMusic": "Warm cinematic crescendo and resolve"
        }
      ],
      "brollChecklist": [
        "Macro of technician's hands using micrometer torque wrench",
        "Portrait framing with natural warm Kuwait golden light",
        "Komatsu Master Technician certification badge on uniform pocket"
      ],
      "postProductionNotes": "Rich documentary film grade, soft filmic grain, inspiring musical track, authentic bilingual voiceover.",
      "captionEn": "Heavy equipment is only as reliable as the engineers behind it.\n\nMeet the master certified technicians of Dar Al Hay. Armed with rigorous Komatsu factory training, specialized diagnostic tooling, and an uncompromising dedication to precision, our team ensures your machines deliver peak performance every single working day.\n\n🔧 Japanese engineering excellence. Local engineering dedication.",
      "captionAr": "المعدات الثقيلة لا تكتمل قوتها إلا بخبرة وإخلاص الكوادر الهندسية التي تدعمها.\n\nتعرفوا على مهندسي وفنيي دار الحي المعتمدين من مصانع كوماتسو. خبرات عميقة، أدوات فحص إلكتروني متقدمة، وشغف دائم بضمان أعلى معايير الجودة والأمان في كل صيانة.\n\n🔧 دقة الهندسة اليابانية.. بسواعد هندسية مخلصة في خدمة الكويت.",
      "hashtags": "#BehindTheIron #MasterTechnician #KomatsuKuwait #HumanTrust #EngineeringPride #DarAlHay #CertifiedService",
      "ctaText": "Discover the Dar Al Hay certified maintenance difference for your fleet.",
      "slides": []
    },
    {
      "id": 312,
      "conceptNumber": 12,
      "week": "Week 4",
      "day": "Thursday",
      "publishDate": "2026-10-29",
      "deliverableCode": "DELIVERABLE 12 • DAY 27 (THU)",
      "title": "Fleet Health Check & Preventive Overhaul Kit – عرض خاص: باقة الفحص الشامل وخصم على أطقم الفلاتر",
      "pillar": "pillar_commercial",
      "format": "cta_post",
      "platforms": [
        "linkedin",
        "instagram",
        "facebook"
      ],
      "goal": "lead_generation",
      "status": "ready",
      "targetAudience": "General Contractors & Owners",
      "tov": "Urgent, Actionable, High-Value",
      "summary": "Direct commercial conversion post offering complimentary on-site multi-point inspections for contractor fleets upon booking, paired with bundled tier discounts on genuine filter service kits and routine oil packages.",
      "photoShots": [
        {
          "shotNo": 1,
          "angle": "Clean commercial promo graphic layout",
          "focus": "Genuine Komatsu yellow filter boxes neatly arranged next to oil drums and digital diagnostic tablet."
        },
        {
          "shotNo": 2,
          "angle": "Call-to-action banner lockup",
          "focus": "Special Offer badge: 'Complimentary 50-Point Fleet Health Check + 15% Off Filter Service Kits'."
        }
      ],
      "brollChecklist": [
        "Stacked genuine Komatsu filter cartons in Shuwaikh showroom",
        "Technician completing digital multi-point health check report on iPad",
        "Clean showroom display of preventive maintenance kits"
      ],
      "postProductionNotes": "High-contrast commercial conversion graphic with prominent Komatsu yellow and navy ribbon, clear phone & WhatsApp icons.",
      "captionEn": "Prepare your machinery fleet for peak winter project deadlines with Dar Al Hay's seasonal fleet health offer!\n\nBook before the end of the month and receive:\n✅ Complimentary on-site 50-point machine health inspection by certified engineers\n✅ Up to 15% discount on bundled genuine Komatsu filter service kits (250h / 500h / 1000h)\n✅ Special package rates on genuine hydraulic & engine oil barrels\n✅ Full telematics health report for your fleet\n\nLimited booking slots available across Kuwait jobsites.\n\n📲 Click the link or WhatsApp our commercial service desk now!",
      "captionAr": "استعد لأعلى وتيرة عمل في مشاريع الشتاء مع باقة العناية الوقائية الخاصة من دار الحي كوماتسو!\n\nسجل أسطولك قبل نهاية الشهر واحصل على:\n✅ فحص ميداني شامل مجاني (50 نقطة فحص) بواسطة مهندسين معتمدين\n✅ خصم يصل إلى 15% على أطقم فلاتر كوماتسو الأصلية (250 / 500 / 1000 ساعة)\n✅ أسعار خاصة على براميل الزيوت الأصلية (هيدروليك ومحرك)\n✅ تقرير تفصيلي بحالة الأسطول وجاهزيته للمشاريع\n\nالأماكن محدودة لجدولة الفحص الميداني في مواقعكم.\n\n📲 تواصل معنا الآن عبر الواتساب أو اتصل بمسؤولي المبيعات لحجز موعدك!",
      "hashtags": "#SpecialOffer #FleetCheck #KomatsuKuwait #PreventiveMaintenance #FilterKits #GenuineParts #DarAlHay #ContractorsKuwait",
      "ctaText": "Book your complimentary on-site fleet health inspection via WhatsApp today.",
      "scenes": [],
      "slides": []
    }
  ]
}
};

export function getConceptOnAssetCopy(concept) {
  if (!concept) {
    return {
      headlineEn: 'BUILT FOR KUWAIT 50°C',
      headlineAr: 'صُنعت لتقهر تضاريس الكويت',
      badge: 'KOMATSU PC350LC-8M0',
      callouts: ['Japanese Precision', '50°C+ Ambient Resilience', 'Shuwaikh Certified Support'],
      visualCta: 'Visit Showroom | WhatsApp 180XXXX',
      designNotes: 'High-contrast bold typography with Komatsu yellow accent bar. Keep text within upper/lower safe zones.',
    };
  }

  const hookEn = typeof concept.hook === 'string' ? concept.hook : (concept.hook?.spokenEn || '');
  const hookAr = typeof concept.hook === 'object' ? (concept.hook?.spokenAr || '') : '';
  const firstSceneText = concept.scenes?.[0]?.onScreenTextEn || '';
  const firstSceneTextAr = concept.scenes?.[0]?.onScreenTextAr || '';
  const firstSlide = concept.slides?.[0]?.title || '';

  const fallbackHeadlineEn = firstSceneText || firstSlide || (hookEn ? hookEn.slice(0, 48).toUpperCase() : (concept.title || 'KOMATSU HEAVY MACHINERY'));
  const fallbackHeadlineAr = firstSceneTextAr || (hookAr ? hookAr.slice(0, 50) : 'كوماتسو الكويت | دار الحي');
  const fallbackBadge = concept.format === 'reel' ? '🎬 REEL • 4K MOTION' : concept.format === 'carousel' ? '📑 SWIPE DECK • 5 SLIDES' : concept.format === 'photography' ? '📸 HERO PHOTOGRAPHY • 50°C' : '📐 TECHNICAL BLUEPRINT';
  const fallbackCallouts = (concept.brollChecklist && concept.brollChecklist.length > 0)
    ? concept.brollChecklist.slice(0, 3)
    : ['Japanese Precision & Quality', 'Shuwaikh Certified Overhaul', '15,000+ Genuine Parts In Stock'];
  const fallbackCta = concept.ctaText || 'Visit Shuwaikh Showroom • WhatsApp 180XXXX';
  const fallbackDesignNotes = concept.postProductionNotes || 'High-contrast bold typography with Komatsu yellow (#FFD100) accent. Respect safe zones for mobile viewports.';

  return {
    headlineEn: concept.visualHeadlineEn || concept.onAssetCopy?.headlineEn || fallbackHeadlineEn,
    headlineAr: concept.visualHeadlineAr || concept.onAssetCopy?.headlineAr || fallbackHeadlineAr,
    badge: concept.onAssetCopy?.badge || fallbackBadge,
    callouts: concept.onAssetCopy?.callouts && concept.onAssetCopy.callouts.length > 0 ? concept.onAssetCopy.callouts : fallbackCallouts,
    visualCta: concept.onAssetCopy?.visualCta || fallbackCta,
    designNotes: concept.visualNotes || concept.onAssetCopy?.designNotes || fallbackDesignNotes,
  };
}

