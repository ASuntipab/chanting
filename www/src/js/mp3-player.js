/**
 * Tamma OS - High-Density Compressed Audio Engine (.webm / .ogg + MP3 Fallback)
 * Intelligent codec negotiation & offline audio cache for Buddhist chanting.
 */

export const CHANTING_AUDIO_TRACKS = [
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
    id: 'track-12-tamnan-paritta',
    title: 'พระปริตร ๑๒ ตำนาน (รวมบทสวดคุ้มครองครบชุด)',
    temple: 'วัดอัมรวดี / สายวัดป่า',
    srcWebm: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-Parittas-All.ogg',
    srcMp3: 'https://ia601609.us.archive.org/29/items/Buddhist.Chanting/Western-Pali-Wat_Amaravati-Parittas-All.mp3',
    durationEst: '18:40',
    category: 'บทสวดประจำวัน'
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

    // 1. Specific Prayer Title & ID matching
    if (title.includes('ชินบัญชร') || id.includes('chinabanchorn')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-chinabanchorn') || null;
    }
    if (title.includes('ทำวัตรเย็น') || id.includes('evening')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-evening-chanting') || null;
    }
    if (title.includes('ทำวัตรเช้า') || id.includes('morning')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-morning-chanting') || null;
    }
    if (title.includes('พาหุง') || id.includes('phahung') || id.includes('jayamongkol')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-phahung-mahaka') || null;
    }
    if (title.includes('กรณียเมตตสูตร') || id.includes('karaniya')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-karaniya-metta') || null;
    }
    if (title.includes('ธัมมจัก') || id.includes('dhammacakka')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-dhammacakka') || null;
    }
    if (title.includes('อนัตตลักขณสูตร') || id.includes('anattalakkhana')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-anattalakkhana') || null;
    }
    if (title.includes('อาทิตตปริยายสูตร') || id.includes('adittapariyaya')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-adittapariyaya') || null;
    }
    if (title.includes('มงคลสูตร') || id.includes('mangala-sutta')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-mangala-sutta') || null;
    }
    if (title.includes('รัตนสูตร') || id.includes('ratana-sutta')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-ratana-sutta') || null;
    }
    if (title.includes('ขันธปริตร') || id.includes('khandha')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-khandha-paritta') || null;
    }
    if (title.includes('โพชฌังคปริตร') || id.includes('bojjhanga')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-bojjhanga-paritta') || null;
    }
    if (title.includes('อภยปริตร') || id.includes('abhaya')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-abhaya-paritta') || null;
    }
    if (title.includes('อังคุลิมาลปริตร') || id.includes('angulimala')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-angulimala-paritta') || null;
    }
    if (title.includes('อาฏานาฏิย') || id.includes('atanatiya')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-atanatiya-paritta') || null;
    }
    if (title.includes('๑๒ ตำนาน') || title.includes('12 ตำนาน') || id.includes('12-tamnan')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-12-tamnan-paritta') || null;
    }

    // No direct matching real audio file for this prayer
    return null;
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
