/**
 * AudioManager
 * Pure Web Audio API procedural sound synthesizer.
 * Provides high-impact, streamer-grade sound effects without external audio files.
 */
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.isMuted = typeof localStorage !== 'undefined' ? localStorage.getItem('kick_arena_muted') === 'true' : false;
    this.volume = typeof localStorage !== 'undefined' ? parseFloat(localStorage.getItem('kick_arena_volume') || '0.7') : 0.7;
    this.unlocked = false;

    if (typeof window !== 'undefined') {
      // Try to restore user audio context on first user interaction
      const unlockAudio = () => {
        this._initContext();
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
      };

      window.addEventListener('click', unlockAudio);
      window.addEventListener('keydown', unlockAudio);
      window.addEventListener('touchstart', unlockAudio);
    }
  }

  _initContext() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        if (this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
        this.unlocked = true;
      }
    } else if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('kick_arena_volume', this.volume.toString());
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('kick_arena_muted', this.isMuted.toString());
    }
    return this.isMuted;
  }

  setMuted(muted) {
    this.isMuted = !!muted;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('kick_arena_muted', this.isMuted.toString());
    }
  }

  getEffectiveVolume() {
    if (this.isMuted) return 0;
    return this.volume;
  }

  /**
   * Sound: New participant joined lobby
   */
  playJoin() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08); // A5

      const effVol = this.getEffectiveVolume() * 0.25;
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(effVol, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {
      // Graceful fallback
    }
  }

  /**
   * Sound: Turbo Nitro Boost Whoosh
   */
  playTurboWhoosh() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);

      const effVol = this.getEffectiveVolume() * 0.45;
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(effVol, now + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {}
  }

  /**
   * Sound: Comical Bonk / Wall Slam
   */
  playBonk() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.12);

      const effVol = this.getEffectiveVolume() * 0.6;
      gain.gain.setValueAtTime(effVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {}
  }

  /**
   * Sound: Cartoon Spring Boing
   */
  playBoing() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.25);

      const effVol = this.getEffectiveVolume() * 0.45;
      gain.gain.setValueAtTime(effVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {}
  }

  /**
   * Sound: Mechanical Hydraulic Door Open / Slide
   */
  playDoorSlide() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(280, now + 0.3);

      const effVol = this.getEffectiveVolume() * 0.3;
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(effVol, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.38);
    } catch (e) {}
  }

  /**
   * Sound: Countdown tick (3, 2, 1, GO)
   */
  playCountdownTick(isFinal = false) {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = isFinal ? 'triangle' : 'sine';
      const freq = isFinal ? 987.77 : 523.25; // B5 for final, C5 for tick
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.1);

      const effVol = this.getEffectiveVolume() * (isFinal ? 0.6 : 0.35);
      gain.gain.setValueAtTime(effVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (isFinal ? 0.35 : 0.18));

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + (isFinal ? 0.36 : 0.2));
    } catch (e) {}
  }

  /**
   * Sound: Safe zone reveal / dramatic tension riser
   */
  playZoneReveal() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(220, now);
      osc1.frequency.exponentialRampToValueAtTime(660, now + 0.4);

      osc2.frequency.setValueAtTime(222, now);
      osc2.frequency.exponentialRampToValueAtTime(666, now + 0.4);

      const effVol = this.getEffectiveVolume() * 0.4;
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(effVol, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.55);
      osc2.stop(now + 0.55);
    } catch (e) {}
  }

  /**
   * Sound: Laser elimination / zap / explosive boom
   */
  playElimination() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Sub bass boom / laser pitch dive
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.35);

      const effVol = this.getEffectiveVolume() * 0.55;
      gain.gain.setValueAtTime(effVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.46);

      // Noise burst for laser impact sizzle
      const bufferSize = this.ctx.sampleRate * 0.2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.frequency.exponentialRampToValueAtTime(200, now + 0.25);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(effVol * 0.5, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.26);
    } catch (e) {}
  }

  /**
   * Sound: Round transition / progression chime
   */
  playRoundTransition() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880]; // A major arpeggio
      const effVol = this.getEffectiveVolume() * 0.35;

      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + i * 0.08;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.01, start);
        gain.gain.linearRampToValueAtTime(effVol, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.35);
      });
    } catch (e) {}
  }

  /**
   * Sound: Tile Crack warning in Lava Floor Panic
   */
  playTileCrack() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.15);

      const effVol = this.getEffectiveVolume() * 0.4;
      gain.gain.setValueAtTime(effVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {}
  }

  /**
   * Sound: Molten Lava Sizzle / Burn
   */
  playLavaSizzle() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.28);
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.1));
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.frequency.linearRampToValueAtTime(300, now + 0.25);

      const gain = this.ctx.createGain();
      const effVol = this.getEffectiveVolume() * 0.5;
      gain.gain.setValueAtTime(effVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.3);
    } catch (e) {}
  }

  /**
   * Sound: Victory fanfare for the final winner!
   */
  playWinnerFanfare() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const effVol = this.getEffectiveVolume() * 0.45;
      // Majestic triumphant brass fanfare: C4, G4, C5, E5, G5, C6
      const fanfare = [
        { freq: 523.25, start: 0.00, dur: 0.16 }, // C5
        { freq: 523.25, start: 0.18, dur: 0.16 }, // C5
        { freq: 523.25, start: 0.36, dur: 0.16 }, // C5
        { freq: 659.25, start: 0.54, dur: 0.40 }, // E5
        { freq: 587.33, start: 0.96, dur: 0.18 }, // D5
        { freq: 659.25, start: 1.16, dur: 0.18 }, // E5
        { freq: 783.99, start: 1.36, dur: 0.75 }, // G5
        { freq: 1046.50, start: 2.15, dur: 1.40 } // C6 (Grand finish)
      ];

      fanfare.forEach(n => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = now + n.start;

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(n.freq, t);

        gain.gain.setValueAtTime(0.01, t);
        gain.gain.linearRampToValueAtTime(effVol, t + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t + n.dur);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + n.dur + 0.05);
      });
    } catch (e) {}
  }

  /**
   * Sound: High-Pressure Milk Jet Squirt
   */
  playSquirt() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.12);

      const effVol = this.getEffectiveVolume() * 0.45;
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(effVol, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch (e) {}
  }

  /**
   * Sound: Milk Splat Impact
   */
  playMilkSplash() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.2);
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.05));
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, now);
      filter.frequency.linearRampToValueAtTime(400, now + 0.18);

      const gain = this.ctx.createGain();
      const effVol = this.getEffectiveVolume() * 0.55;
      gain.gain.setValueAtTime(effVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.22);
    } catch (e) {}
  }

  /**
   * Sound: Cow Moo
   */
  playCowMoo() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(120, now + 0.25);
      osc.frequency.linearRampToValueAtTime(90, now + 0.6);

      const effVol = this.getEffectiveVolume() * 0.5;
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(effVol, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.7);
    } catch (e) {}
  }

  /**
   * Sound: Oil Rating Star Ding
   */
  playRatingScore() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1046.5, now); // C6
      osc.frequency.exponentialRampToValueAtTime(1567.98, now + 0.1); // G6

      const effVol = this.getEffectiveVolume() * 0.45;
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(effVol, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.38);
    } catch (e) {}
  }

  /**
   * Sound: Oil Bottle Liquid Swirl
   */
  playOilSwirl() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.linearRampToValueAtTime(380, now + 0.15);
      osc.frequency.linearRampToValueAtTime(220, now + 0.3);

      const effVol = this.getEffectiveVolume() * 0.35;
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(effVol, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.38);
    } catch (e) {}
  }

  /**
   * Sound: Suspenseful Inspection Drumroll
   */
  playDrumroll() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      for (let i = 0; i < 10; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = now + i * 0.045;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140 + Math.random() * 40, t);

        const effVol = this.getEffectiveVolume() * 0.25;
        gain.gain.setValueAtTime(effVol, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.06);
      }
    } catch (e) {}
  }

  /**
   * Sound: Rubber Dodgeball Thud Impact
   */
  playDodgeballHit() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.15);

      const effVol = this.getEffectiveVolume() * 0.6;
      gain.gain.setValueAtTime(effVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {}
  }

  /**
   * Sound: Quick Dive Dodge Whoosh
   */
  playDodgeWhoosh() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.linearRampToValueAtTime(180, now + 0.12);

      const effVol = this.getEffectiveVolume() * 0.35;
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(effVol, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {}
  }

  /**
   * Sound: Ball Bounce off Wall
   */
  playBallBounce() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);

      const effVol = this.getEffectiveVolume() * 0.25;
      gain.gain.setValueAtTime(effVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {}
  }

  /**
   * 1v1 DUEL SOUND EFFECTS
   */

  /**
   * Sword Duel metal clash / parry
   */
  playSwordClang(isBig = false) {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const dur = isBig ? 0.65 : 0.38;
      const effVol = this.getEffectiveVolume() * (isBig ? 0.55 : 0.38);

      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(isBig ? 1850 : 2200, now);
      osc1.frequency.exponentialRampToValueAtTime(isBig ? 980 : 1240, now + dur);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(isBig ? 2950 : 3400, now);
      osc2.frequency.exponentialRampToValueAtTime(isBig ? 1420 : 1780, now + dur);

      const bufferSize = Math.floor(this.ctx.sampleRate * 0.05);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(effVol * 0.8, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      gain.gain.setValueAtTime(effVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      noise.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      noise.start(now);

      osc1.stop(now + dur);
      osc2.stop(now + dur);
      noise.stop(now + 0.05);
    } catch (e) {}
  }

  /**
   * Sound: Sword Swing Whoosh
   */
  playSwordWhoosh(isHeavy = false) {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isHeavy ? 350 : 480, now);
      osc.frequency.exponentialRampToValueAtTime(isHeavy ? 120 : 180, now + 0.14);

      const effVol = this.getEffectiveVolume() * (isHeavy ? 0.35 : 0.25);
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(effVol, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch (e) {}
  }

  /**
   * Sound: Heavy Body / Ground Thud
   */
  playSwordThud() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.22);

      const effVol = this.getEffectiveVolume() * 0.45;
      gain.gain.setValueAtTime(effVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {}
  }

  /**
   * Sound: Arena Battle Bell
   */
  playBell() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(840, now + 1.2);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1760, now);
      osc2.frequency.exponentialRampToValueAtTime(1680, now + 1.2);

      const effVol = this.getEffectiveVolume() * 0.4;
      gain.gain.setValueAtTime(effVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.2);
      osc2.stop(now + 1.2);
    } catch (e) {}
  }

  /**
   * Sound: Entrant Slot Lock In
   */
  playLock() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.12);

      const effVol = this.getEffectiveVolume() * 0.4;
      gain.gain.setValueAtTime(effVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.14);
    } catch (e) {}
  }

  /**
   * High Noon Gunshot
   */
  playGunshot() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const dur = 0.55;
      const effVol = this.getEffectiveVolume() * 0.7;

      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);

      oscGain.gain.setValueAtTime(effVol * 0.8, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      const bufferSize = Math.floor(this.ctx.sampleRate * dur);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(effVol, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);

      noise.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      osc.start(now);
      noise.start(now);

      osc.stop(now + 0.25);
      noise.stop(now + dur);
    } catch (e) {}
  }

  /**
   * High Noon Draw Signal / Tension Chime
   */
  playDrawSignal() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(960, now);
      osc.frequency.exponentialRampToValueAtTime(1440, now + 0.18);

      const effVol = this.getEffectiveVolume() * 0.45;
      gain.gain.setValueAtTime(effVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {}
  }

  /**
   * Tension Heartbeat pulse
   */
  playHeartbeat() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.14);

      const effVol = this.getEffectiveVolume() * 0.4;
      gain.gain.setValueAtTime(effVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.14);
    } catch (e) {}
  }

  /**
   * Sumo Heavy Collision Slam
   */
  playSumoSlam() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.4);

      const effVol = this.getEffectiveVolume() * 0.6;
      gain.gain.setValueAtTime(effVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      const bufferSize = Math.floor(this.ctx.sampleRate * 0.15);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(effVol * 0.6, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      noise.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      osc.start(now);
      noise.start(now);
      osc.stop(now + 0.4);
      noise.stop(now + 0.15);
    } catch (e) {}
  }

  /**
   * High Card Flip
   */
  playCardFlip() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(950, now + 0.09);

      const effVol = this.getEffectiveVolume() * 0.25;
      gain.gain.setValueAtTime(effVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch (e) {}
  }

  /**
   * High Card Energy Zap
   */
  playCardZap() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.28);

      const effVol = this.getEffectiveVolume() * 0.35;
      gain.gain.setValueAtTime(effVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.28);
    } catch (e) {}
  }

  /**
   * UI Click sound
   */
  playClick() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.03);

      gain.gain.setValueAtTime(this.getEffectiveVolume() * 0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {}
  }
  stopAll() {
    if (this.ctx && this.ctx.state !== 'closed') {
      try {
        this.ctx.suspend().catch(() => {});
      } catch (e) {}
    }
  }
}
