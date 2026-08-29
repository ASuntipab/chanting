/**
 * Tamma OS - Real Monastic MP3 Chanting Audio Player Engine
 * High-fidelity streaming & offline audio playback for authentic Buddhist chanting.
 */

export const CHANTING_AUDIO_TRACKS = [
  {
    id: 'track-morning-chanting',
    title: 'ทำวัตรเช้า (แปลไทย-บาลี)',
    temple: 'วัดป่านานาชาติ / วัดมาบจันทร์',
    src: 'https://archive.org/download/wat-pah-nanachat-morning-chant/morning_chant.mp3',
    durationEst: '15:20',
    category: 'ทำวัตร'
  },
  {
    id: 'track-evening-chanting',
    title: 'ทำวัตรเย็น (แปลไทย-บาลี)',
    temple: 'วัดป่านานาชาติ / วัดมาบจันทร์',
    src: 'https://archive.org/download/wat-pah-nanachat-evening-chant/evening_chant.mp3',
    durationEst: '18:45',
    category: 'ทำวัตร'
  },
  {
    id: 'track-chinabanchorn',
    title: 'พระคาถาชินบัญชร (สมเด็จโต)',
    temple: 'วัดระฆังโฆสิตาราม',
    src: 'https://archive.org/download/chinabanchorn-chant/chinabanchorn.mp3',
    durationEst: '05:30',
    category: 'คาถาศักดิ์สิทธิ์'
  },
  {
    id: 'track-phahung-mahaka',
    title: 'พุทธชัยมงคลคาถา (พาหุง-มหากา)',
    temple: 'วัดอัมพวัน (หลวงพ่อจรัญ)',
    src: 'https://archive.org/download/phahung-mahaka-charan/phahung.mp3',
    durationEst: '07:15',
    category: 'ชัยมงคลคาถา'
  },
  {
    id: 'track-maha-metta-yai',
    title: 'มหาเมตตาใหญ่ (เมตตาพรหมวิหาระผะระณา)',
    temple: 'วัดอัมพวัน',
    src: 'https://archive.org/download/maha-metta-yai/maha_metta_yai.mp3',
    durationEst: '12:10',
    category: 'แผ่เมตตา'
  },
  {
    id: 'track-dhammacakka',
    title: 'ธัมมจักกัปปวัตตนสูตร (ปฐมเทศนา)',
    temple: 'วัดถ้ำพระบำเพ็ญบุญ',
    src: 'https://archive.org/download/dhammacakka-sutta/dhammacakka.mp3',
    durationEst: '14:30',
    category: 'พระสูตรสำคัญ'
  },
  {
    id: 'track-satipatthana',
    title: 'มหาสติปัฏฐานสูตร (สวดสรภัญญะ)',
    temple: 'คณะสงฆ์วัดบวรนิเวศวิหาร',
    src: 'https://archive.org/download/satipatthana-sutta-chant/satipatthana.mp3',
    durationEst: '16:00',
    category: 'พระสูตรสำคัญ'
  },
  {
    id: 'track-12-tamnan-paritta',
    title: 'พระปริตร ๑๒ ตำนาน (รวมบทคุ้มครอง)',
    temple: 'วัดถ้ำพระบำเพ็ญบุญ',
    src: 'https://archive.org/download/12-tamnan-paritta/paritta.mp3',
    durationEst: '25:40',
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
    this.onStateChangeCallbacks = [];
    this.onProgressCallbacks = [];
    this._initAudioElement();
  }

  _initAudioElement() {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') return;

    this.audioElement = new Audio();
    this.audioElement.preload = 'metadata';

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
      this.onProgressCallbacks.forEach(cb => cb({ current, duration, percent, formattedCurrent: this.formatTime(current), formattedDuration: this.formatTime(duration) }));
    });

    this.audioElement.addEventListener('error', (e) => {
      console.warn('MP3 Playback notice (fallback/offline mode):', e);
      this.isPlaying = false;
      this._notifyState();
    });
  }

  _setupMediaSession() {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator && this.currentTrack) {
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
    }
  }

  getTracks() {
    return CHANTING_AUDIO_TRACKS;
  }

  getTrackForPrayer(prayer) {
    if (!prayer) return CHANTING_AUDIO_TRACKS[0];
    
    const title = (prayer.title || '').toLowerCase();
    const id = (prayer.id || '').toLowerCase();

    // 1. Specific Prayer Title & ID matching
    if (title.includes('ชินบัญชร') || id.includes('chinabanchorn')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-chinabanchorn') || CHANTING_AUDIO_TRACKS[0];
    }
    if (title.includes('ทำวัตรเย็น') || id.includes('evening')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-evening-chanting') || CHANTING_AUDIO_TRACKS[0];
    }
    if (title.includes('ทำวัตรเช้า') || id.includes('morning')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-morning-chanting') || CHANTING_AUDIO_TRACKS[0];
    }
    if (title.includes('พาหุง') || id.includes('phahung')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-phahung-mahaka') || CHANTING_AUDIO_TRACKS[0];
    }
    if (title.includes('มหาเมตตาใหญ่') || title.includes('แผ่เมตตา') || id.includes('metta')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-maha-metta-yai') || CHANTING_AUDIO_TRACKS[0];
    }
    if (title.includes('ธัมมจัก') || id.includes('dhammacakka')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-dhammacakka') || CHANTING_AUDIO_TRACKS[0];
    }
    if (title.includes('สติปัฏฐาน') || id.includes('satipatthana')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-satipatthana') || CHANTING_AUDIO_TRACKS[0];
    }
    if (title.includes('ปริตร') || title.includes('ตำนาน')) {
      return CHANTING_AUDIO_TRACKS.find(t => t.id === 'track-12-tamnan-paritta') || CHANTING_AUDIO_TRACKS[0];
    }

    // 2. Category matching fallback
    const categoryMatched = CHANTING_AUDIO_TRACKS.find(t => t.category === prayer.category);
    return categoryMatched || CHANTING_AUDIO_TRACKS[0];
  }

  loadTrack(trackIdOrObj) {
    const track = typeof trackIdOrObj === 'string'
      ? CHANTING_AUDIO_TRACKS.find(t => t.id === trackIdOrObj) || CHANTING_AUDIO_TRACKS[0]
      : trackIdOrObj;

    if (!track) return;
    this.currentTrack = track;

    if (this.audioElement) {
      this.audioElement.src = track.src;
      this.audioElement.playbackRate = this.playbackRate;
      this.audioElement.loop = this.isLooping;
    }

    this._notifyState();
  }

  play(trackIdOrObj = null) {
    if (trackIdOrObj) {
      this.loadTrack(trackIdOrObj);
    } else if (!this.currentTrack) {
      this.loadTrack(CHANTING_AUDIO_TRACKS[0]);
    }

    if (this.audioElement) {
      const playPromise = this.audioElement.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.log('Audio autoplay prevented or offline:', err);
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
      currentTrack: this.currentTrack
    };
    this.onStateChangeCallbacks.forEach(cb => cb(state));
  }
}

export const mp3Player = new MP3ChantingAudioEngine();
export { MP3ChantingAudioEngine };
