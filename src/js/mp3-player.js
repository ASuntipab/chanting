/**
 * Tamma OS - High-Density Compressed Audio Engine (.webm / .ogg + MP3 Fallback)
 * Intelligent codec negotiation & offline audio cache for Buddhist chanting.
 */

export const CHANTING_AUDIO_TRACKS = [
  // --- ทำวัตรเช้า-เย็น ---
  {
    id: 'track-morning-chanting',
    title: 'ทำวัตรเช้า (แปลไทย-บาลี)',
    temple: 'วัดอัมรวดี / สายวัดป่าหนองป่าพง',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-English-Wat_Amaravati-Morning_Chanting.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-English-Wat_Amaravati-Morning_Chanting.mp3',
    durationEst: '26:37',
    category: 'ทำวัตร'
  },
  {
    id: 'track-evening-chanting',
    title: 'ทำวัตรเย็น (แปลไทย-บาลี)',
    temple: 'วัดอัมรวดี / สายวัดป่าหนองป่าพง',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-12-Evening_Chanting.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-12-Evening_Chanting.mp3',
    durationEst: '09:34',
    category: 'ทำวัตร'
  },
  {
    id: 'track-chinabanchorn',
    title: 'พระคาถาชินบัญชร (สมเด็จโต)',
    temple: 'พระคาถาชินบัญชรฉบับโบราณ',
    srcWebm: 'https://ia800706.us.archive.org/14/items/JinapanjaraGatha/Jinapanjara%20Gatha.ogg',
    srcMp3: 'https://ia800706.us.archive.org/14/items/JinapanjaraGatha/Jinapanjara%20Gatha.mp3',
    durationEst: '07:27',
    category: 'คาถาศักดิ์สิทธิ์'
  },
  {
    id: 'track-phahung-mahaka',
    title: 'พุทธชัยมงคลคาถา (พาหุง-มหากา)',
    temple: 'วัดอัมรวดี / สายวัดป่า',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-Bahum_Sahassam-abhinimmita.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-Bahum_Sahassam-abhinimmita.mp3',
    durationEst: '02:29',
    category: 'ชัยมงคลคาถา'
  },
  {
    id: 'track-karaniya-metta',
    title: 'กรณียเมตตสูตร (แผ่เมตตา)',
    temple: 'วัดอัมรวดี / สายวัดป่า',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-Karaniyamattha_kusalena.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-Karaniyamattha_kusalena.mp3',
    durationEst: '02:10',
    category: 'แผ่เมตตา'
  },

  // --- พระสูตรสำคัญปฐมเทศนาและอริยสัจ ---
  {
    id: 'track-dhammacakka',
    title: 'ธัมมจักกัปปวัตตนสูตร (ปฐมเทศนา)',
    temple: 'วัดอัมรวดี / สายวัดป่า',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-Dhammacakkappavattana.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-Dhammacakkappavattana.mp3',
    durationEst: '12:54',
    category: 'พระสูตรสำคัญ'
  },
  {
    id: 'track-anattalakkhana',
    title: 'อนัตตลักขณสูตร (ขันธ์ ๕ เป็นอนัตตา)',
    temple: 'วัดอัมรวดี / สายวัดป่า',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-Anatta_Sutta.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-Anatta_Sutta.mp3',
    durationEst: '10:39',
    category: 'พระสูตรสำคัญ'
  },
  {
    id: 'track-adittapariyaya',
    title: 'อาทิตตปริยายสูตร (ไฟราคะ-โทสะ-โมหะ)',
    temple: 'วัดอัมรวดี / สายวัดป่า',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-Aditta-Pariyaya_Sutta.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-Aditta-Pariyaya_Sutta.mp3',
    durationEst: '07:45',
    category: 'พระสูตรสำคัญ'
  },
  {
    id: 'track-dhammaniyama',
    title: 'ธัมมนิยามสูตร (กฎธรรมชาติ สรรพสิ่งไม่เที่ยง)',
    temple: 'วัดธรรมมงคล (หลวงพ่อวิริยังค์)',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-Pali-Wat_Dhammamonkhon-Dhammaneeyam.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-Pali-Wat_Dhammamonkhon-Dhammaneeyam.mp3',
    durationEst: '04:30',
    category: 'พระสูตรสำคัญ'
  },
  {
    id: 'track-ovada-patimokkha',
    title: 'โอวาทปาติโมกข์ (หัวใจพระพุทธศาสนา)',
    temple: 'วัดป่านานาชาติ',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-English-Pali-Wat_Pah_Nanachat-Ovada_Patimokkha.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-English-Pali-Wat_Pah_Nanachat-Ovada_Patimokkha.mp3',
    durationEst: '01:35',
    category: 'พระสูตรสำคัญ'
  },
  {
    id: 'track-abhinhapaccavekkhana',
    title: 'อภิณหปัจจเวกขณ์ (พิจารณาความแก่-เจ็บ-ตาย ๕ ข้อ)',
    temple: 'วัดป่านานาชาติ',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-English-Pali-Wat_Pah_Nanachat-Abhinhapaccavekkhanapatham.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-English-Pali-Wat_Pah_Nanachat-Abhinhapaccavekkhanapatham.mp3',
    durationEst: '01:28',
    category: 'บทสวดประจำวัน'
  },
  {
    id: 'track-anapanasati',
    title: 'อานาปานสติสูตร (เจริญสติกำหนดลมหายใจ)',
    temple: 'วัดป่านานาชาติ',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-English-Pali-Wat_Pah_Nanachat-Mindfulness_of_Breathing.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-English-Pali-Wat_Pah_Nanachat-Mindfulness_of_Breathing.mp3',
    durationEst: '05:40',
    category: 'พระสูตรสำคัญ'
  },
  {
    id: 'track-ariya-magga',
    title: 'อริยมรรคมีองค์ ๘ (ทางอันเอกเพื่อความพ้นทุกข์)',
    temple: 'วัดป่านานาชาติ',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-English-Pali-Wat_Pah_Nanachat-The_Noble_Eightfold_Path.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-English-Pali-Wat_Pah_Nanachat-The_Noble_Eightfold_Path.mp3',
    durationEst: '07:15',
    category: 'พระสูตรสำคัญ'
  },

  // --- พระปริตร ๗ ตำนาน และ ๑๒ ตำนาน คุ้มครองป้องกันภัย ---
  {
    id: 'track-mangala-sutta',
    title: 'มงคลสูตร (มงคล ๓๘ ประการ)',
    temple: 'วัดอัมรวดี / สายวัดป่า',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-Asevana_Ca_Balanam.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-Asevana_Ca_Balanam.mp3',
    durationEst: '01:58',
    category: 'ชัยมงคลคาถา'
  },
  {
    id: 'track-ratana-sutta',
    title: 'รัตนสูตร (ดับภัยพิบัติและโรคระบาด)',
    temple: 'วัดอัมรวดี / สายวัดป่า',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-Yankinci_Vittam.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-Yankinci_Vittam.mp3',
    durationEst: '01:57',
    category: 'ชัยมงคลคาถา'
  },
  {
    id: 'track-khandha-paritta',
    title: 'ขันธปริตร (ป้องกันสัตว์มีพิษและอสรพิษ)',
    temple: 'วัดอัมรวดี / สายวัดป่า',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-Virupakkehi_Me_Mettam.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-Virupakkehi_Me_Mettam.mp3',
    durationEst: '01:15',
    category: 'ชัยมงคลคาถา'
  },
  {
    id: 'track-bojjhanga-paritta',
    title: 'โพชฌังคปริตร (หายจากโรคภัยไข้เจ็บ)',
    temple: 'วัดอัมรวดี / สายวัดป่า',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-Bojjango_Satisankhato.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-Bojjango_Satisankhato.mp3',
    durationEst: '01:32',
    category: 'ชัยมงคลคาถา'
  },
  {
    id: 'track-abhaya-paritta',
    title: 'อภยปริตร (ยันทุนนิมิตตัง ปัดเป่าฝันร้าย)',
    temple: 'วัดอัมรวดี / สายวัดป่า',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-Yandunnimittam_Avamangalanca.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-Yandunnimittam_Avamangalanca.mp3',
    durationEst: '00:47',
    category: 'ชัยมงคลคาถา'
  },
  {
    id: 'track-angulimala-paritta',
    title: 'อังคุลิมาลปริตร (คลอดบุตรง่าย ปลอดภัย)',
    temple: 'วัดอัมรวดี / สายวัดป่า',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-Yatoham_Bhagini_Ariyaya.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-Yatoham_Bhagini_Ariyaya.mp3',
    durationEst: '00:53',
    category: 'ชัยมงคลคาถา'
  },
  {
    id: 'track-atanatiya-paritta',
    title: 'อาฏานาฏิยปริตร (ภาณยักษ์ คุ้มครองจากภูตผี)',
    temple: 'วัดอัมรวดี / สายวัดป่า',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-Atanatiya_Parittam.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-Atanatiya_Parittam.mp3',
    durationEst: '08:33',
    category: 'ชัยมงคลคาถา'
  },
  {
    id: 'track-jaya-noy',
    title: 'ชัยน้อย (ชยมังคลคาถา มหาชัยชนะ)',
    temple: 'วัดธรรมมงคล (หลวงพ่อวิริยังค์)',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-Pali-Wat_Dhammamonkhon-Jaya_Noy.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-Pali-Wat_Dhammamonkhon-Jaya_Noy.mp3',
    durationEst: '03:15',
    category: 'ชัยมงคลคาถา'
  },
  {
    id: 'track-unhissavijaya',
    title: 'อุณหิสสวิชัย (คาถาต่ออายุ ชนะความตาย)',
    temple: 'วัดธรรมมงคล (หลวงพ่อวิริยังค์)',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-Pali-Wat_Dhammamonkhon-Atatiunhit.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-Pali-Wat_Dhammamonkhon-Atatiunhit.mp3',
    durationEst: '00:45',
    category: 'ชัยมงคลคาถา'
  },
  {
    id: 'track-12-tamnan-paritta',
    title: 'พระปริตร ๑๒ ตำนาน (รวมบทสวดคุ้มครองครบชุด)',
    temple: 'วัดอัมรวดี / สายวัดป่า',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-Parittas-All.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-Parittas-All.mp3',
    durationEst: '18:40',
    category: 'บทสวดประจำวัน'
  },

  // --- สรรเสริญพระรัตนตรัย พิธีกรรม และพระปาติโมกข์ ---
  {
    id: 'track-tisarana',
    title: 'สรณคมนปาฐะ (ถึงพระพุทธ พระธรรม พระสงฆ์ เป็นที่พึ่ง)',
    temple: 'วัดมาบจันทร์ (หลวงพ่ออนันต์)',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-Pali-Wat_Mab_Chan-Tisarana.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-Pali-Wat_Mab_Chan-Tisarana.mp3',
    durationEst: '07:30',
    category: 'บทสวดประจำวัน'
  },
  {
    id: 'track-itipiso',
    title: 'อิติปิโส ภะคะวา (บทสรรเสริญพระพุทธคุณ)',
    temple: 'วัดอัมรวดี / สายวัดป่า',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-Itipi_So_Bhagava.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-Itipi_So_Bhagava.mp3',
    durationEst: '01:10',
    category: 'บทสวดประจำวัน'
  },
  {
    id: 'track-mahakaruniko',
    title: 'มหาการุณิโก นาโถ (บทถวายพรพระ)',
    temple: 'วัดอัมรวดี / สายวัดป่า',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-Mahakaruniko_Natho.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-Mahakaruniko_Natho.mp3',
    durationEst: '01:05',
    category: 'ชัยมงคลคาถา'
  },
  {
    id: 'track-deva-aradhana',
    title: 'ชุมนุมเทวดา & อาราธนาพระปริตร (สัคเค กาเม...)',
    temple: 'วัดอัมรวดี / สายวัดป่า',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-Invitation_to_the_Devata.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-Invitation_to_the_Devata.mp3',
    durationEst: '01:02',
    category: 'พิธีกรรม'
  },
  {
    id: 'track-patimokkha-full',
    title: 'พระปาติโมกข์ ๒๒๗ สิกขาบท (สวดสวดทวนศีลปาติโมกข์ฉบับเต็ม)',
    temple: 'พระอาจารย์ปุริโส / พระธรรมวินัย',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-Pali-Ajan_Puriso-Patimokkha.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-Pali-Ajan_Puriso-Patimokkha.mp3',
    durationEst: '45:00',
    category: 'พิธีกรรม'
  },

  // --- วัดธรรมมงคล (หลวงพ่อวิริยังค์) เพิ่มเติม ---
  {
    id: 'track-buddha-vandana-dhammamon',
    title: 'พุทธวันทนา (บทนมัสการพระพุทธเจ้า)',
    temple: 'วัดธรรมมงคล (หลวงพ่อวิริยังค์)',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-Pali-Wat_Dhammamonkhon-Buddha_Vandana.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-Pali-Wat_Dhammamonkhon-Buddha_Vandana.mp3',
    durationEst: '05:30',
    category: 'บทสวดประจำวัน'
  },
  {
    id: 'track-bhojananga-dhammamon',
    title: 'โภชนังคปริตร (พิจารณาอาหาร)',
    temple: 'วัดธรรมมงคล (หลวงพ่อวิริยังค์)',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-Pali-Wat_Dhammamonkhon-Bhojananga.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-Pali-Wat_Dhammamonkhon-Bhojananga.mp3',
    durationEst: '01:10',
    category: 'บทสวดประจำวัน'
  },
  {
    id: 'track-deva-aradhana-dhammamon',
    title: 'อาราธนาเทวดา (ชุมนุมเทวดาฉบับวัดธรรมมงคล)',
    temple: 'วัดธรรมมงคล (หลวงพ่อวิริยังค์)',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-Pali-Wat_Dhammamonkhon-Deva_Aradhana.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-Pali-Wat_Dhammamonkhon-Deva_Aradhana.mp3',
    durationEst: '00:50',
    category: 'พิธีกรรม'
  },
  {
    id: 'track-dhammacakka-dhammamon',
    title: 'ธัมมจักกัปปวัตตนสูตร (ฉบับวัดธรรมมงคล)',
    temple: 'วัดธรรมมงคล (หลวงพ่อวิริยังค์)',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-Pali-Wat_Dhammamonkhon-Dhammachakka_Pavathana_Sutta.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-Pali-Wat_Dhammamonkhon-Dhammachakka_Pavathana_Sutta.mp3',
    durationEst: '07:15',
    category: 'พระสูตรสำคัญ'
  },
  {
    id: 'track-karaniya-dhammamon',
    title: 'กรณียเมตตสูตร (ฉบับวัดธรรมมงคล)',
    temple: 'วัดธรรมมงคล (หลวงพ่อวิริยังค์)',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-Pali-Wat_Dhammamonkhon-Karaniyametta_Sutta.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-Pali-Wat_Dhammamonkhon-Karaniyametta_Sutta.mp3',
    durationEst: '01:25',
    category: 'แผ่เมตตา'
  },
  {
    id: 'track-ratana-dhammamon',
    title: 'รัตนสูตร (ฉบับวัดธรรมมงคล)',
    temple: 'วัดธรรมมงคล (หลวงพ่อวิริยังค์)',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-Pali-Wat_Dhammamonkhon-Ratana_Sutta.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-Pali-Wat_Dhammamonkhon-Ratana_Sutta.mp3',
    durationEst: '03:30',
    category: 'ชัยมงคลคาถา'
  },
  {
    id: 'track-abhaya-dhammamon',
    title: 'ยันทุนนิมิตตัง (ฉบับวัดธรรมมงคล)',
    temple: 'วัดธรรมมงคล (หลวงพ่อวิริยังค์)',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-Pali-Wat_Dhammamonkhon-Yandunnimittan.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-Pali-Wat_Dhammamonkhon-Yandunnimittan.mp3',
    durationEst: '00:35',
    category: 'ชัยมงคลคาถา'
  },

  // --- วัดป่านานาชาติ เพิ่มเติม ---
  {
    id: 'track-metta-nanachat',
    title: 'เมตตสูตร (ฉบับวัดป่านานาชาติ)',
    temple: 'วัดป่านานาชาติ (อุบลราชธานี)',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-English-Pali-Wat_Pah_Nanachat-Metta_Sutta.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-English-Pali-Wat_Pah_Nanachat-Metta_Sutta.mp3',
    durationEst: '01:20',
    category: 'แผ่เมตตา'
  },
  {
    id: 'track-morning-nanachat-01',
    title: 'ทำวัตรเช้าภาค ๑ (วัดป่านานาชาติ)',
    temple: 'วัดป่านานาชาติ (อุบลราชธานี)',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-English-Pali-Wat_Pah_Nanachat-Morning_Chanting_01.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-English-Pali-Wat_Pah_Nanachat-Morning_Chanting_01.mp3',
    durationEst: '11:00',
    category: 'ทำวัตร'
  },
  {
    id: 'track-salutation-nanachat',
    title: 'นมัสการพระรัตนตรัย (วัดป่านานาชาติ)',
    temple: 'วัดป่านานาชาติ (อุบลราชธานี)',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-English-Pali-Wat_Pah_Nanachat-Salutation_Of_The_Triple_Gem.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-English-Pali-Wat_Pah_Nanachat-Salutation_Of_The_Triple_Gem.mp3',
    durationEst: '04:15',
    category: 'บทสวดประจำวัน'
  },
  {
    id: 'track-merit-sharing-nanachat',
    title: 'แผ่ส่วนบุญแก่สรรพสัตว์ (วัดป่านานาชาติ)',
    temple: 'วัดป่านานาชาติ (อุบลราชธานี)',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-English-Pali-Wat_Pah_Nanachat-Sharing_Merit_with_all_Beings.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-English-Pali-Wat_Pah_Nanachat-Sharing_Merit_with_all_Beings.mp3',
    durationEst: '01:35',
    category: 'แผ่เมตตา'
  },
  {
    id: 'track-dhammacakka-nanachat',
    title: 'ธัมมจักกัปปวัตตนสูตร (ฉบับวัดป่านานาชาติ)',
    temple: 'วัดป่านานาชาติ (อุบลราชธานี)',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-English-Pali-Wat_Pah_Nanachat-Turning_the_Wheel_of_Dhamma_-Dhammacakkappavattanasutta.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-English-Pali-Wat_Pah_Nanachat-Turning_the_Wheel_of_Dhamma_-Dhammacakkappavattanasutta.mp3',
    durationEst: '10:30',
    category: 'พระสูตรสำคัญ'
  },
  {
    id: 'track-wellbeing-nanachat',
    title: 'แผ่เมตตาสากล (วัดป่านานาชาติ)',
    temple: 'วัดป่านานาชาติ (อุบลราชธานี)',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-English-Pali-Wat_Pah_Nanachat-Reflection_on_Universal_wellbeing.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-English-Pali-Wat_Pah_Nanachat-Reflection_on_Universal_wellbeing.mp3',
    durationEst: '02:50',
    category: 'แผ่เมตตา'
  },
  {
    id: 'track-buddha-words-nanachat',
    title: 'พุทธพจน์แรกและสุดท้าย (วัดป่านานาชาติ)',
    temple: 'วัดป่านานาชาติ (อุบลราชธานี)',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-English-Pali-Wat_Pah_Nanachat-The_Buddhas_First_and_Last_Words.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-English-Pali-Wat_Pah_Nanachat-The_Buddhas_First_and_Last_Words.mp3',
    durationEst: '01:15',
    category: 'พระสูตรสำคัญ'
  },
  {
    id: 'track-paritta-nanachat',
    title: 'สวดพระปริตร (ฉบับวัดป่านานาชาติ)',
    temple: 'วัดป่านานาชาติ (อุบลราชธานี)',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-Pali-Wat_Pah_Nanachat-Paritta_Chanting.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-Pali-Wat_Pah_Nanachat-Paritta_Chanting.mp3',
    durationEst: '14:30',
    category: 'บทสวดประจำวัน'
  },

  // --- วัดมาบจันทร์ เพิ่มเติม ---
  {
    id: 'track-paritta-mabchan-01',
    title: 'พระปริตร ภาค ๑ (วัดมาบจันทร์)',
    temple: 'วัดมาบจันทร์ (หลวงพ่ออนันต์)',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-Pali-Wat_Mab_Chan-Paritta_01.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-Pali-Wat_Mab_Chan-Paritta_01.mp3',
    durationEst: '14:40',
    category: 'บทสวดประจำวัน'
  },
  {
    id: 'track-paritta-mabchan-02',
    title: 'พระปริตร ภาค ๒ (วัดมาบจันทร์)',
    temple: 'วัดมาบจันทร์ (หลวงพ่ออนันต์)',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-Pali-Wat_Mab_Chan-Paritta_02.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-Pali-Wat_Mab_Chan-Paritta_02.mp3',
    durationEst: '14:00',
    category: 'บทสวดประจำวัน'
  },
  {
    id: 'track-sutta-mabchan',
    title: 'สวดพระสูตร (วัดมาบจันทร์)',
    temple: 'วัดมาบจันทร์ (หลวงพ่ออนันต์)',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-Pali-Wat_Mab_Chan-Sutta_chanting.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-Pali-Wat_Mab_Chan-Sutta_chanting.mp3',
    durationEst: '05:40',
    category: 'พระสูตรสำคัญ'
  },

  // --- วัดอัมรวดี เพิ่มเติม ---
  {
    id: 'track-buddha-vandana-amaravati',
    title: 'พุทธวันทนา (วัดอัมรวดี)',
    temple: 'วัดอัมรวดี (อังกฤษ)',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-Buddha_Vandana.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-Buddha_Vandana.mp3',
    durationEst: '06:15',
    category: 'บทสวดประจำวัน'
  },
  {
    id: 'track-namo-tassa',
    title: 'นะโม ตัสสะ ภะคะวะโต (บทเปิดสวดมนต์)',
    temple: 'วัดอัมรวดี (อังกฤษ)',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-Namo_Tassa.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-Namo_Tassa.mp3',
    durationEst: '00:25',
    category: 'บทสวดประจำวัน'
  },
  {
    id: 'track-tisarana-amaravati',
    title: 'ไตรสรณคมน์ (พระพุทธ พระธรรม พระสงฆ์ — วัดอัมรวดี)',
    temple: 'วัดอัมรวดี (อังกฤษ)',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-The_Three_Refuges.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-The_Three_Refuges.mp3',
    durationEst: '00:30',
    category: 'บทสวดประจำวัน'
  },
  {
    id: 'track-paritta-amaravati-01',
    title: 'พระปริตร ภาค ๑ (วัดอัมรวดี)',
    temple: 'วัดอัมรวดี (อังกฤษ)',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-Paritta-Part-01.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-Paritta-Part-01.mp3',
    durationEst: '14:50',
    category: 'บทสวดประจำวัน'
  },
  {
    id: 'track-paritta-amaravati-02',
    title: 'พระปริตร ภาค ๒ (วัดอัมรวดี)',
    temple: 'วัดอัมรวดี (อังกฤษ)',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-Paritta-Part-02.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-Paritta-Part-02.mp3',
    durationEst: '04:15',
    category: 'บทสวดประจำวัน'
  },
  {
    id: 'track-sharing-blessings',
    title: 'แผ่ส่วนบุญ-ให้พร (วัดอัมรวดี)',
    temple: 'วัดอัมรวดี (อังกฤษ)',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-13-Reflections-Sharing_Blessings.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-13-Reflections-Sharing_Blessings.mp3',
    durationEst: '01:25',
    category: 'แผ่เมตตา'
  },
  {
    id: 'track-yo-cakkhuma',
    title: 'โย จักขุมา โมหะมะลัง (บทสรรเสริญพระธรรม)',
    temple: 'วัดอัมรวดี (อังกฤษ)',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-Yo_Cakkhuma.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-Yo_Cakkhuma.mp3',
    durationEst: '01:10',
    category: 'บทสวดประจำวัน'
  },

  // --- ดนตรีประกอบเสียงสวด (ไทย) ---
  {
    id: 'track-jayamangala-music',
    title: 'ชัยมงคลคาถา (ประกอบดนตรี)',
    temple: 'บทสวดมนต์ประกอบดนตรีไทย',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-Pali-Music-Jaya_Mangala_Gatha.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-Pali-Music-Jaya_Mangala_Gatha.mp3',
    durationEst: '01:45',
    category: 'ชัยมงคลคาถา'
  },
  {
    id: 'track-chinabanchorn-music',
    title: 'ชินบัญชร (ประกอบดนตรี)',
    temple: 'บทสวดมนต์ประกอบดนตรีไทย',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-Pali-Music-Jinapanjara_Gatha.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-Pali-Music-Jinapanjara_Gatha.mp3',
    durationEst: '03:30',
    category: 'คาถาศักดิ์สิทธิ์'
  },
  {
    id: 'track-blessing-music',
    title: 'บทอวยพร (ประกอบดนตรี)',
    temple: 'บทสวดมนต์ประกอบดนตรีไทย',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-Pali-Music-The_Blessing_Chant.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-Pali-Music-The_Blessing_Chant.mp3',
    durationEst: '02:40',
    category: 'แผ่เมตตา'
  },
  {
    id: 'track-tipitaka-chant-music',
    title: 'สวดพระไตรปิฎก (ประกอบดนตรี)',
    temple: 'บทสวดมนต์ประกอบดนตรีไทย',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-Pali-Music-Tripitaka_Chant.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-Pali-Music-Tripitaka_Chant.mp3',
    durationEst: '07:25',
    category: 'พระสูตรสำคัญ'
  },
  {
    id: 'track-dhammacakka-thai',
    title: 'ธัมมจักกัปปวัตตนสูตร (ฉบับไทย)',
    temple: 'บทสวดมนต์ไทย',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-Pali-Dhammacakka_Pavathana_Sutta.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Thailand-Pali-Dhammacakka_Pavathana_Sutta.mp3',
    durationEst: '04:00',
    category: 'พระสูตรสำคัญ'
  },

  // --- คลังเสียงภายนอก (IA Collections) ---
  {
    id: 'track-morning-pali-thai-1',
    title: 'ทำวัตรเช้าบาลี-ไทย ภาค ๑',
    temple: 'บทสวดมนต์ทำวัตรบาลี-ไทย',
    srcWebm: 'https://ia601605.us.archive.org/0/items/MorningChantingPali-thai/m1.ogg',
    srcMp3: 'https://ia601605.us.archive.org/0/items/MorningChantingPali-thai/m1.mp3',
    durationEst: '10:30',
    category: 'ทำวัตร'
  },
  {
    id: 'track-morning-pali-thai-2',
    title: 'ทำวัตรเช้าบาลี-ไทย ภาค ๒',
    temple: 'บทสวดมนต์ทำวัตรบาลี-ไทย',
    srcWebm: 'https://ia601605.us.archive.org/0/items/MorningChantingPali-thai/m2.ogg',
    srcMp3: 'https://ia601605.us.archive.org/0/items/MorningChantingPali-thai/m2.mp3',
    durationEst: '10:30',
    category: 'ทำวัตร'
  },
  {
    id: 'track-morning-pali-thai-3',
    title: 'ทำวัตรเช้าบาลี-ไทย ภาค ๓',
    temple: 'บทสวดมนต์ทำวัตรบาลี-ไทย',
    srcWebm: 'https://ia601605.us.archive.org/0/items/MorningChantingPali-thai/m3.ogg',
    srcMp3: 'https://ia601605.us.archive.org/0/items/MorningChantingPali-thai/m3.mp3',
    durationEst: '07:15',
    category: 'ทำวัตร'
  },
  {
    id: 'track-karaniya-standalone',
    title: 'กรณียเมตตสูตร (สวดบาลีฉบับเต็ม)',
    temple: 'บทสวดบาลีเดี่ยว',
    srcWebm: 'https://ia601503.us.archive.org/20/items/KaraniyaMettaSutta/Mettasuttam8.ogg',
    srcMp3: 'https://ia601503.us.archive.org/20/items/KaraniyaMettaSutta/Mettasuttam8.mp3',
    durationEst: '02:05',
    category: 'แผ่เมตตา'
  },
  {
    id: 'track-dhammapada-yamaka',
    title: 'ธรรมบท: ยมกวรรค (คู่พระธรรม ว่าด้วยจิต)',
    temple: 'สวดธรรมบทบาลี 26 วรรค',
    srcWebm: 'https://dn801303.us.archive.org/0/items/Dhammapada-Chanted-in-Pali/01-Yamakavaggo.ogg',
    srcMp3: 'https://dn801303.us.archive.org/0/items/Dhammapada-Chanted-in-Pali/01-Yamakavaggo.mp3',
    durationEst: '09:10',
    category: 'พระสูตรสำคัญ'
  },
  {
    id: 'track-dhammapada-buddha',
    title: 'ธรรมบท: พุทธวรรค (ว่าด้วยพระพุทธเจ้า)',
    temple: 'สวดธรรมบทบาลี 26 วรรค',
    srcWebm: 'https://dn801303.us.archive.org/0/items/Dhammapada-Chanted-in-Pali/14-Buddhavaggo.ogg',
    srcMp3: 'https://dn801303.us.archive.org/0/items/Dhammapada-Chanted-in-Pali/14-Buddhavaggo.mp3',
    durationEst: '07:30',
    category: 'พระสูตรสำคัญ'
  },

  // --- พระคาถามหาจักรพรรดิ & สายหลวงปู่ดู่ พรหมปัญโญ ---
  {
    id: 'track-maha-chakraphat',
    title: 'พระคาถามหาจักรพรรดิ (นะโมพุทธายะ ฉบับเต็ม)',
    temple: 'หลวงปู่ดู่ พรหมปัญโญ / วัดสะแก',
    srcWebm: 'https://archive.org/download/KaTha_201411/KaTha%E0%B8%84%E0%B8%B2%E0%B8%96%E0%B8%B2%E0%B8%A1%E0%B8%AB%E0%B8%B2%E0%B8%88%E0%B8%B1%E0%B8%81%E0%B8%A3%E0%B8%9E%E0%B8%A3%E0%B8%A3%E0%B8%94%E0%B8%B4%29.ogg',
    srcMp3: 'https://archive.org/download/KaTha_201411/KaTha%E0%B8%84%E0%B8%B2%E0%B8%96%E0%B8%B2%E0%B8%A1%E0%B8%AB%E0%B8%B2%E0%B8%88%E0%B8%B1%E0%B8%81%E0%B8%A3%E0%B8%9E%E0%B8%A3%E0%B8%A3%E0%B8%94%E0%B8%B4%29.mp3',
    durationEst: '15:40',
    category: 'บทสวดประจำวัน'
  },
  {
    id: 'track-supphe-du',
    title: 'บทสวดสัพเพ แผ่บุญปรับภพภูมิ (๕ จบ)',
    temple: 'หลวงปู่ดู่ พรหมปัญโญ / วัดถ้ำเมืองนะ',
    srcWebm: 'https://archive.org/download/108_20211114/02_%E0%B8%AA%E0%B8%A7%E0%B8%94%E0%B8%AA%E0%B8%B1%E0%B8%9E%E0%B9%80%E0%B8%9E%205%20%E0%B8%88%E0%B8%9A.mp3',
    srcMp3: 'https://archive.org/download/108_20211114/02_%E0%B8%AA%E0%B8%A7%E0%B8%94%E0%B8%AA%E0%B8%B1%E0%B8%9E%E0%B9%80%E0%B8%9E%205%20%E0%B8%88%E0%B8%9A.mp3',
    durationEst: '02:55',
    category: 'บทสวดประจำวัน'
  },

  // --- ยอดพระกัณฑ์ไตรปิฎก & วัดพระราม ๙ กาญจนาภิเษก ---
  {
    id: 'track-yod-phrakand',
    title: 'ยอดพระกัณฑ์ไตรปิฎก (ฉบับโบราณสมบูรณ์)',
    temple: 'วัดพระราม ๙ กาญจนาภิเษก',
    srcWebm: 'https://archive.org/download/PraySong/PS1280012.ogg',
    srcMp3: 'https://archive.org/download/PraySong/PS1280012.MP3',
    durationEst: '22:30',
    category: 'คาถาศักดิ์สิทธิ์'
  },
  {
    id: 'track-baramee-30-tas',
    title: 'พระคาถาบารมี ๓๐ ทัศ (ทานะ ปาระมี สัมปันโน...)',
    temple: 'วัดพระราม ๙ กาญจนาภิเษก',
    srcWebm: 'https://archive.org/download/PraySong/PS1280008.ogg',
    srcMp3: 'https://archive.org/download/PraySong/PS1280008.MP3',
    durationEst: '04:50',
    category: 'บทสวดประจำวัน'
  },
  {
    id: 'track-katha-photibat',
    title: 'พระคาถาโพธิบาท (กันภัย ๑๐ ทิศ - บูรพารัสมิง...)',
    temple: 'วัดพระราม ๙ กาญจนาภิเษก',
    srcWebm: 'https://archive.org/download/PraySong/PS1280007.ogg',
    srcMp3: 'https://archive.org/download/PraySong/PS1280007.MP3',
    durationEst: '06:35',
    category: 'ชัยมงคลคาถา'
  },
  {
    id: 'track-yatha-sappi',
    title: 'บทกรวดน้ำให้พร ยะถา สัพพี',
    temple: 'วัดพระราม ๙ กาญจนาภิเษก',
    srcWebm: 'https://archive.org/download/PraySong/PS1280009.ogg',
    srcMp3: 'https://archive.org/download/PraySong/PS1280009.MP3',
    durationEst: '04:50',
    category: 'แผ่เมตตา'
  },

  // --- มหาเมตตาใหญ่ & พระคาถาเงินล้าน ---
  {
    id: 'track-maha-metta-yai',
    title: 'บทสวดมหาเมตตาใหญ่ (ฉบับเต็ม ๑๒ หน้า)',
    temple: 'เมตตาพรหมวิหาระภาวนา',
    srcWebm: 'https://archive.org/download/01Mahamettayai_201411/01%20Mahamettayai%E0%B8%9A%E0%B8%97%E0%B8%AA%E0%B8%A7%E0%B8%94%E0%B8%A1%E0%B8%99%E0%B8%95%E0%B9%8C%E0%B8%A1%E0%B8%AB%E0%B8%B2%E0%B9%80%E0%B8%A1%E0%B8%95%E0%B8%95%E0%B8%B2%E0%B9%83%E0%B8%AB%E0%B8%8D%E0%B9%88.ogg',
    srcMp3: 'https://archive.org/download/01Mahamettayai_201411/01%20Mahamettayai%E0%B8%9A%E0%B8%97%E0%B8%AA%E0%B8%A7%E0%B8%94%E0%B8%A1%E0%B8%99%E0%B8%95%E0%B9%8C%E0%B8%A1%E0%B8%AB%E0%B8%B2%E0%B9%80%E0%B8%A1%E0%B8%95%E0%B8%95%E0%B8%B2%E0%B9%83%E0%B8%AB%E0%B8%8D%E0%B9%88.mp3',
    durationEst: '35:00',
    category: 'แผ่เมตตา'
  },
  {
    id: 'track-katha-ngoen-lan',
    title: 'พระคาถาเงินล้าน ๙ จบ (สัมปะจิตฉามิ นาสังสิโม...)',
    temple: 'หลวงพ่อฤๅษีลิงดำ (วัดท่าซุง)',
    srcWebm: 'https://archive.org/download/20230602_20230602_0904/%E0%B8%84%E0%B8%B2%E0%B8%96%E0%B8%B2%E0%B8%A1%E0%B8%87%E0%B8%B4%E0%B8%99%E0%B8%A5%E0%B9%89%E0%B8%B2%E0%B8%99%20%E0%B9%99%20%E0%B8%88%E0%B8%9A.mp3',
    srcMp3: 'https://archive.org/download/20230602_20230602_0904/%E0%B8%84%E0%B8%B2%E0%B8%96%E0%B8%B2%E0%B8%A1%E0%B8%87%E0%B8%B4%E0%B8%99%E0%B8%A5%E0%B9%89%E0%B8%B2%E0%B8%99%20%E0%B9%99%20%E0%B8%88%E0%B8%9A.mp3',
    durationEst: '04:30',
    category: 'คาถาศักดิ์สิทธิ์'
  },

  // --- พระปริตรโบราณ (โมรปริตร, ธชัคค, วัฏฏกะ, มงคลจักรวาฬใหญ่, ฉัททันตะ) ---
  {
    id: 'track-mora-paritta',
    title: 'โมรปริตร (พระคาถาพญานกยูงทอง)',
    temple: 'สายพระป่ากรรมฐาน / หลวงปู่มั่น ภูริทัตโต',
    srcWebm: 'https://ia601800.us.archive.org/17/items/pinthavong_yahoo_12./09.%E0%B9%82%E0%B8%A1%E0%B8%A3%E0%B8%B0%E0%B8%9B%E0%B8%A0%E0%B8%A3%E0%B8%B4%E0%B8%95%E0%B8%95%E0%B8%B1%E0%B8%87.ogg',
    srcMp3: 'https://ia601800.us.archive.org/17/items/pinthavong_yahoo_12./09.%E0%B9%82%E0%B8%A1%E0%B8%A3%E0%B8%B0%E0%B8%9B%E0%B8%A0%E0%B8%A3%E0%B8%B4%E0%B8%95%E0%B8%95%E0%B8%B1%E0%B8%87.mp3',
    durationEst: '01:10',
    category: 'ชัยมงคลคาถา'
  },
  {
    id: 'track-vattaka-paritta',
    title: 'วัฏฏกปริตร (ดับไฟ ป้องกันอัคคีภัย)',
    temple: 'พระปริตรโบราณ',
    srcWebm: 'https://ia601800.us.archive.org/17/items/pinthavong_yahoo_12./10.%E0%B8%A7%E0%B8%B1%E0%B8%8F%E0%B8%8F%E0%B8%B0%E0%B8%81%E0%B8%B0%E0%B8%9B%E0%B8%A0%E0%B8%A3%E0%B8%B4%E0%B8%95%E0%B8%95%E0%B8%B1%E0%B8%87.ogg',
    srcMp3: 'https://ia601800.us.archive.org/17/items/pinthavong_yahoo_12./10.%E0%B8%A7%E0%B8%B1%E0%B8%8F%E0%B8%8F%E0%B8%B0%E0%B8%81%E0%B8%B0%E0%B8%9B%E0%B8%A0%E0%B8%A3%E0%B8%B4%E0%B8%95%E0%B8%95%E0%B8%B1%E0%B8%87.mp3',
    durationEst: '00:50',
    category: 'ชัยมงคลคาถา'
  },
  {
    id: 'track-dhajagga-paritta',
    title: 'ธชัคคสูตร / ธชัคคปริตร (ยอดธงแห่งชัยชนะ ป้องกันภัย)',
    temple: 'พระปริตรโบราณ',
    srcWebm: 'https://ia601800.us.archive.org/17/items/pinthavong_yahoo_12./11.%E0%B8%98%E0%B8%B0%E0%B8%8A%E0%B8%B1%E0%B8%84%E0%B8%84%E0%B8%B0%E0%B8%9B%E0%B8%A0%E0%B8%A3%E0%B8%B4%E0%B8%95%E0%B8%B1%E0%B8%87.ogg',
    srcMp3: 'https://ia601800.us.archive.org/17/items/pinthavong_yahoo_12./11.%E0%B8%98%E0%B8%B0%E0%B8%8A%E0%B8%B1%E0%B8%84%E0%B8%84%E0%B8%B0%E0%B8%9B%E0%B8%A0%E0%B8%A3%E0%B8%B4%E0%B8%95%E0%B8%B1%E0%B8%87.mp3',
    durationEst: '06:05',
    category: 'ชัยมงคลคาถา'
  },
  {
    id: 'track-mongkol-chakrawan-yai',
    title: 'มงคลจักรวาฬใหญ่ (สิริธิติมะติเตโช...)',
    temple: 'พระปริตรโบราณ',
    srcWebm: 'https://ia601800.us.archive.org/17/items/pinthavong_yahoo_12./18.%E0%B8%A1%E0%B8%87%E0%B8%84%E0%B8%A5%E0%B8%88%E0%B8%B1%E0%B8%81%E0%B8%A3%E0%B8%A7%E0%B8%B2%E0%B8%AC%E0%B9%83%E0%B8%AB%E0%B8%8D%E0%B9%88.ogg',
    srcMp3: 'https://ia601800.us.archive.org/17/items/pinthavong_yahoo_12./18.%E0%B8%A1%E0%B8%87%E0%B8%84%E0%B8%A5%E0%B8%88%E0%B8%B1%E0%B8%81%E0%B8%A3%E0%B8%A7%E0%B8%B2%E0%B8%AC%E0%B9%83%E0%B8%AB%E0%B8%8D%E0%B9%88.mp3',
    durationEst: '02:35',
    category: 'ชัยมงคลคาถา'
  },
  {
    id: 'track-chaddanta-paritta',
    title: 'ฉัททันตปริตร (คุ้มครองดวงชะตาและแคล้วคลาด)',
    temple: 'พระปริตรโบราณ',
    srcWebm: 'https://ia601800.us.archive.org/17/items/pinthavong_yahoo_12./08.%E0%B8%89%E0%B8%B1%E0%B8%97%E0%B8%97%E0%B8%B1%E0%B8%99%E0%B8%95%E0%B8%B0%E0%B8%9B%E0%B8%A0%E0%B8%A3%E0%B8%B4%E0%B8%95%E0%B8%95%E0%B8%B1%E0%B8%87.ogg',
    srcMp3: 'https://ia601800.us.archive.org/17/items/pinthavong_yahoo_12./08.%E0%B8%89%E0%B8%B1%E0%B8%97%E0%B8%97%E0%B8%B1%E0%B8%99%E0%B8%95%E0%B8%B0%E0%B8%9B%E0%B8%A0%E0%B8%A3%E0%B8%B4%E0%B8%95%E0%B8%95%E0%B8%B1%E0%B8%87.mp3',
    durationEst: '00:35',
    category: 'ชัยมงคลคาถา'
  }
];

class MP3ChantingAudioEngine {
  constructor() {
    this.audioElement = null;
    this.currentTrack = null;
    this.isPlaying = false;
    this.isLooping = false;
    this.playbackRate = 1.0;
    this.preferredFormat = 'webm';
    this.onStateChangeCallbacks = [];
    this.onProgressCallbacks = [];
    this.cacheName = 'tamma-chanting-audio-v1';
    this._initFormatSupport();
    this._initAudioElement();
  }

  _initFormatSupport() {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') {
      this.preferredFormat = 'webm';
      return;
    }
    const a = new Audio();
    const canPlayWebm = a.canPlayType('audio/webm; codecs="opus"').replace(/no/, '') ||
                        a.canPlayType('audio/webm').replace(/no/, '') ||
                        a.canPlayType('audio/ogg; codecs="opus"').replace(/no/, '') ||
                        a.canPlayType('audio/ogg').replace(/no/, '');
    this.preferredFormat = canPlayWebm ? 'webm' : 'mp3';
  }

  _initAudioElement() {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') return;

    this.audioElement = new Audio();
    this.audioElement.preload = 'auto';

    this.audioElement.addEventListener('play', () => {
      this.isPlaying = true;
      this._notifyState();
      this._setupMediaSession();
    });

    this.audioElement.addEventListener('pause', () => {
      this.isPlaying = false;
      this._notifyState();
    });

    this.audioElement.addEventListener('ended', () => {
      if (this.isLooping) {
        this.play();
      } else {
        this.isPlaying = false;
        this._notifyState();
      }
    });

    this.audioElement.addEventListener('timeupdate', () => {
      if (!this.audioElement) return;
      const current = this.audioElement.currentTime || 0;
      const duration = this.audioElement.duration || 0;
      const percent = duration > 0 ? (current / duration) * 100 : 0;
      this.onProgressCallbacks.forEach(cb => cb({
        current,
        duration,
        percent,
        formattedCurrent: this.formatTime(current),
        formattedDuration: this.formatTime(duration)
      }));
    });

    this.audioElement.addEventListener('error', (e) => {
      console.warn('Audio fallback triggered, attempting MP3 fallback:', e);
      if (this.currentTrack && this.audioElement.src !== this.currentTrack.srcMp3) {
        this.audioElement.src = this.currentTrack.srcMp3;
        this.audioElement.play().catch(() => {});
      } else {
        this.isPlaying = false;
        this._notifyState();
      }
    });
  }

  _setupMediaSession() {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator && this.currentTrack) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: this.currentTrack.title,
          artist: this.currentTrack.temple,
          album: 'ธรรมะ E-Book บทสวดมนต์',
          artwork: [
            { src: 'src/assets/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'src/assets/icon-512.png', sizes: '512x512', type: 'image/png' }
          ]
        });

        navigator.mediaSession.setActionHandler('play', () => this.play());
        navigator.mediaSession.setActionHandler('pause', () => this.pause());
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.seekTime && this.audioElement) {
            this.seek(details.seekTime);
          }
        });
      } catch (err) {
        console.log('MediaSession notice:', err);
      }
    }
  }

  getTracks() {
    return CHANTING_AUDIO_TRACKS;
  }

  /**
   * Returns matching audio track for the prayer, or NULL if this prayer has no real recording.
   * Ensures the UI only displays the audio button when real monastic audio actually exists!
   */
  getTrackForPrayer(prayer) {
    if (!prayer) return null;
    
    const title = (prayer.title || '').toLowerCase();
    const id = (prayer.id || '').toLowerCase();

    // 1. พระคาถาชินบัญชร
    if (title.includes('ชินบัญชร') || id.includes('chinabanchorn')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-chinabanchorn') || null;
    }
    // 2. ทำวัตรเช้า-เย็น
    if (title.includes('ทำวัตรเย็น') || id.includes('evening')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-evening-chanting') || null;
    }
    if (title.includes('ทำวัตรเช้า') || id.includes('morning')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-morning-chanting') || null;
    }
    // 3. พาหุง-มหากา & ชัยมงคล
    if (title.includes('พาหุง') || id.includes('phahung') || id.includes('jayamongkol')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-phahung-mahaka') || null;
    }
    if (title.includes('ชัยน้อย') || id.includes('jaya-noy')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-jaya-noy') || null;
    }
    if (title.includes('อุณหิสสวิชัย') || id.includes('unhissa')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-unhissavijaya') || null;
    }
    if (title.includes('มหาการุณิโก') || id.includes('mahakaruniko')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-mahakaruniko') || null;
    }
    // 4. แผ่เมตตา / กรณียเมตตสูตร
    if (title.includes('กรณียเมตตสูตร') || id.includes('karaniya') || title.includes('เมตตสูตร')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-karaniya-metta') || null;
    }
    // 5. พระสูตรสำคัญ
    if (title.includes('ธัมมจัก') || id.includes('dhammacakka') || title.includes('ปฐมเทศนา')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-dhammacakka') || null;
    }
    if (title.includes('อนัตตลักขณสูตร') || id.includes('anattalakkhana')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-anattalakkhana') || null;
    }
    if (title.includes('อาทิตตปริยายสูตร') || id.includes('adittapariyaya')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-adittapariyaya') || null;
    }
    if (title.includes('ธัมมนิยาม') || id.includes('dhammaniyama')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-dhammaniyama') || null;
    }
    if (title.includes('โอวาทปาติโมกข์') || id.includes('ovada')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-ovada-patimokkha') || null;
    }
    if (title.includes('อภิณหปัจจเวกขณ์') || id.includes('abhinha') || title.includes('ปัจจเวกขณ์')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-abhinhapaccavekkhana') || null;
    }
    if (title.includes('อานาปานสติ') || id.includes('anapanasati')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-anapanasati') || null;
    }
    if (title.includes('อริยมรรค') || id.includes('ariya-magga') || title.includes('มรรคมีองค์')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-ariya-magga') || null;
    }
    if (title.includes('ธรรมบท') || id.includes('dhammapada')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-dhammapada-yamaka') || null;
    }
    // 6. พระปริตร ๗ / ๑๒ ตำนาน
    if (title.includes('มงคลสูตร') || id.includes('mangala-sutta')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-mangala-sutta') || null;
    }
    if (title.includes('รัตนสูตร') || id.includes('ratana-sutta')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-ratana-sutta') || null;
    }
    if (title.includes('ขันธปริตร') || id.includes('khandha')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-khandha-paritta') || null;
    }
    if (title.includes('โพชฌังคปริตร') || id.includes('bojjhanga') || title.includes('โพชฌงค์')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-bojjhanga-paritta') || null;
    }
    if (title.includes('โภชนังค') || id.includes('bhojananga')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-bhojananga-dhammamon') || null;
    }
    if (title.includes('อภยปริตร') || id.includes('abhaya') || title.includes('ยันทุนนิมิตตัง')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-abhaya-paritta') || null;
    }
    if (title.includes('อังคุลิมาลปริตร') || id.includes('angulimala')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-angulimala-paritta') || null;
    }
    if (title.includes('อาฏานาฏิย') || id.includes('atanatiya') || title.includes('ภาณยักษ์')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-atanatiya-paritta') || null;
    }
    if (title.includes('๑๒ ตำนาน') || title.includes('12 ตำนาน') || id.includes('12-tamnan')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-12-tamnan-paritta') || null;
    }
    // 7. สรรเสริญพระพุทธคุณ / สรณคมน์ / ปาติโมกข์ / ชุมนุมเทวดา / นะโม / พุทธวันทนา
    if (title.includes('นะโม ตัสสะ') || title.includes('นะโมตัสสะ') || id.includes('namo-tassa')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-namo-tassa') || null;
    }
    if (title.includes('อิติปิโส') || id.includes('itipiso') || title.includes('สรรเสริญพระพุทธคุณ')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-itipiso') || null;
    }
    if (title.includes('พุทธวันทนา') || id.includes('buddha-vandana')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-buddha-vandana-dhammamon') || null;
    }
    if (title.includes('ไตรสรณคมน์') || id.includes('tisarana') || title.includes('สรณคมน์')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-tisarana') || null;
    }
    if (title.includes('ชุมนุมเทวดา') || id.includes('aradhana') || title.includes('อาราธนาพระปริตร')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-deva-aradhana') || null;
    }
    if (title.includes('ปาติโมกข์') || id.includes('patimokkha')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-patimokkha-full') || null;
    }
    if (title.includes('แผ่เมตตา') || title.includes('แผ่ส่วนบุญ') || id.includes('metta-sharing')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-sharing-blessings') || null;
    }
    if (title.includes('โย จักขุมา') || id.includes('yo-cakkhuma')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-yo-cakkhuma') || null;
    }
    if (title.includes('พุทธพจน์') || id.includes('buddha-words')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-buddha-words-nanachat') || null;
    }
    if (title.includes('นมัสการพระรัตนตรัย') || id.includes('salutation')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-salutation-nanachat') || null;
    }

    // 8. พระคาถามหาจักรพรรดิ & สัพเพ (หลวงปู่ดู่)
    if (title.includes('มหาจักรพรรดิ') || id.includes('maha-chakraphat')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-maha-chakraphat') || null;
    }
    if (title.includes('สัพเพ') || id.includes('supphe')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-supphe-du') || null;
    }

    // 9. ยอดพระกัณฑ์ไตรปิฎก, บารมี ๓๐ ทัศ, โพธิบาท & ยะถาสัพพี (วัดพระราม ๙)
    if (title.includes('ยอดพระกัณฑ์') || id.includes('yod-phrakand')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-yod-phrakand') || null;
    }
    if (title.includes('บารมี ๓๐ ทัศ') || title.includes('บารมี 30 ทัศ') || id.includes('baramee-30-tas')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-baramee-30-tas') || null;
    }
    if (title.includes('โพธิบาท') || title.includes('กันภัย ๑๐ ทิศ') || title.includes('กันภัย 10 ทิศ') || id.includes('photibat')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-katha-photibat') || null;
    }
    if (title.includes('ยะถา') || title.includes('กรวดน้ำ') || id.includes('imina') || id.includes('yatha')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-yatha-sappi') || null;
    }

    // 10. มหาเมตตาใหญ่ & พระคาถาเงินล้าน
    if (title.includes('มหาเมตตาใหญ่') || id.includes('maha-metta-yai')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-maha-metta-yai') || null;
    }
    if (title.includes('เงินล้าน') || id.includes('katha-ngoen-lan')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-katha-ngoen-lan') || null;
    }

    // 11. พระปริตรสำคัญ (โมรปริตร, วัฏฏกะ, ธชัคคะ, มงคลจักรวาฬใหญ่, ฉัททันตะ)
    if (title.includes('โมรปริตร') || title.includes('พญานกยูงทอง') || id.includes('mora-paritta')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-mora-paritta') || null;
    }
    if (title.includes('วัฏฏก') || id.includes('vattaka')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-vattaka-paritta') || null;
    }
    if (title.includes('ธชัคค') || id.includes('dhajagga')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-dhajagga-paritta') || null;
    }
    if (title.includes('มงคลจักรวาฬ') || id.includes('mongkol-chakrawan')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-mongkol-chakrawan-yai') || null;
    }
    if (title.includes('ฉัททันต') || id.includes('chaddanta')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-chaddanta-paritta') || null;
    }

    // No direct matching real audio file for this prayer
    return null;
  }

  /**
   * Returns all alternative audio tracks for a prayer (multiple temples/versions).
   * Used for the track selector dropdown when multiple recordings exist.
   */
  getAlternativeTracks(prayer) {
    if (!prayer) return [];
    
    const title = (prayer.title || '').toLowerCase();
    const id = (prayer.id || '').toLowerCase();
    const results = [];

    // ธัมมจักกัปปวัตตนสูตร — 4 versions
    if (title.includes('ธัมมจัก') || id.includes('dhammacakka') || title.includes('ปฐมเทศนา')) {
      ['track-dhammacakka', 'track-dhammacakka-dhammamon', 'track-dhammacakka-nanachat', 'track-dhammacakka-thai'].forEach(tid => {
        const t = CHANTING_AUDIO_TRACKS.find(tr => tr.id === tid);
        if (t) results.push(t);
      });
    }
    // กรณียเมตตสูตร — 4 versions
    else if (title.includes('กรณียเมตตสูตร') || id.includes('karaniya') || title.includes('เมตตสูตร')) {
      ['track-karaniya-metta', 'track-karaniya-dhammamon', 'track-metta-nanachat', 'track-karaniya-standalone'].forEach(tid => {
        const t = CHANTING_AUDIO_TRACKS.find(tr => tr.id === tid);
        if (t) results.push(t);
      });
    }
    // รัตนสูตร — 2 versions
    else if (title.includes('รัตนสูตร') || id.includes('ratana-sutta')) {
      ['track-ratana-sutta', 'track-ratana-dhammamon'].forEach(tid => {
        const t = CHANTING_AUDIO_TRACKS.find(tr => tr.id === tid);
        if (t) results.push(t);
      });
    }
    // ชินบัญชร — 2 versions
    else if (title.includes('ชินบัญชร') || id.includes('chinabanchorn')) {
      ['track-chinabanchorn', 'track-chinabanchorn-music'].forEach(tid => {
        const t = CHANTING_AUDIO_TRACKS.find(tr => tr.id === tid);
        if (t) results.push(t);
      });
    }
    // ยันทุนนิมิตตัง / อภยปริตร — 2 versions
    else if (title.includes('อภยปริตร') || title.includes('ยันทุนนิมิตตัง') || id.includes('abhaya')) {
      ['track-abhaya-paritta', 'track-abhaya-dhammamon'].forEach(tid => {
        const t = CHANTING_AUDIO_TRACKS.find(tr => tr.id === tid);
        if (t) results.push(t);
      });
    }
    // ทำวัตรเช้า — 4 versions
    else if (title.includes('ทำวัตรเช้า') || id.includes('morning')) {
      ['track-morning-chanting', 'track-morning-nanachat-01', 'track-morning-pali-thai-1', 'track-morning-pali-thai-2', 'track-morning-pali-thai-3'].forEach(tid => {
        const t = CHANTING_AUDIO_TRACKS.find(tr => tr.id === tid);
        if (t) results.push(t);
      });
    }
    // มหาจักรพรรดิ & สัพเพ — 2 versions
    else if (title.includes('มหาจักรพรรดิ') || id.includes('maha-chakraphat')) {
      ['track-maha-chakraphat', 'track-supphe-du'].forEach(tid => {
        const t = CHANTING_AUDIO_TRACKS.find(tr => tr.id === tid);
        if (t) results.push(t);
      });
    }
    // มหาเมตตาใหญ่ — 2 versions
    else if (title.includes('มหาเมตตาใหญ่') || id.includes('maha-metta-yai')) {
      ['track-maha-metta-yai', 'track-karaniya-metta'].forEach(tid => {
        const t = CHANTING_AUDIO_TRACKS.find(tr => tr.id === tid);
        if (t) results.push(t);
      });
    }

    return results;
  }

  hasAudioForPrayer(prayer) {
    return !!this.getTrackForPrayer(prayer);
  }

  loadTrack(trackIdOrObj) {
    const track = typeof trackIdOrObj === 'string'
      ? CHANTING_AUDIO_TRACKS.find(t => t.id === trackIdOrObj) || null
      : trackIdOrObj;

    if (!track) return;
    this.currentTrack = track;

    // Pick compressed WebM/Ogg if supported, or fallback to MP3
    const targetUrl = (this.preferredFormat === 'webm' && track.srcWebm) ? track.srcWebm : track.srcMp3;

    if (this.audioElement) {
      if (this.audioElement.src !== targetUrl) {
        this.audioElement.src = targetUrl;
      }
      this.audioElement.playbackRate = this.playbackRate;
      this.audioElement.loop = this.isLooping;
    }

    // Background offline cache preloader
    this._cacheAudioOffline(targetUrl);

    this._notifyState();
  }

  async _cacheAudioOffline(url) {
    if (typeof window === 'undefined' || !('caches' in window) || !url) return;
    try {
      const cache = await window.caches.open(this.cacheName);
      const match = await cache.match(url);
      if (!match) {
        cache.add(url).catch(() => {});
      }
    } catch (e) {
      // Cache silently ignored in non-secure or restricted contexts
    }
  }

  play(trackIdOrObj = null) {
    if (trackIdOrObj) {
      this.loadTrack(trackIdOrObj);
    }

    if (this.audioElement && this.currentTrack) {
      const playPromise = this.audioElement.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.log('Audio playback notice:', err);
        });
      }
    }
  }

  pause() {
    if (this.audioElement) {
      this.audioElement.pause();
    }
    this.isPlaying = false;
    this._notifyState();
  }

  togglePlay(trackIdOrObj = null) {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play(trackIdOrObj);
    }
  }

  seek(seconds) {
    if (this.audioElement && !isNaN(seconds)) {
      this.audioElement.currentTime = Math.max(0, Math.min(seconds, this.audioElement.duration || 0));
    }
  }

  seekPercent(percent) {
    if (this.audioElement && this.audioElement.duration) {
      const targetTime = (percent / 100) * this.audioElement.duration;
      this.seek(targetTime);
    }
  }

  setSpeed(rate) {
    this.playbackRate = rate;
    if (this.audioElement) {
      this.audioElement.playbackRate = rate;
    }
    this._notifyState();
  }

  toggleLoop() {
    this.isLooping = !this.isLooping;
    if (this.audioElement) {
      this.audioElement.loop = this.isLooping;
    }
    this._notifyState();
    return this.isLooping;
  }

  formatTime(secs) {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  onStateChange(cb) {
    this.onStateChangeCallbacks.push(cb);
  }

  onProgress(cb) {
    this.onProgressCallbacks.push(cb);
  }

  _notifyState() {
    const state = {
      isPlaying: this.isPlaying,
      isLooping: this.isLooping,
      playbackRate: this.playbackRate,
      preferredFormat: this.preferredFormat,
      currentTrack: this.currentTrack
    };
    this.onStateChangeCallbacks.forEach(cb => cb(state));
  }
}

export const mp3Player = new MP3ChantingAudioEngine();
export { MP3ChantingAudioEngine };
