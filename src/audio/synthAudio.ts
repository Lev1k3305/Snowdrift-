/**
 * Procedural Web Audio Synthesizer for Snowdrift
 * Zero external audio files — 100% synthesized in real time.
 */

class SynthAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;

  // Engine sound nodes
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;
  private isEngineRunning: boolean = false;

  // Snow crunch nodes
  private snowCrunchNode: AudioNode | null = null;
  private snowCrunchGain: GainNode | null = null;
  private isSnowCrunching: boolean = false;

  // Ambient wind
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private windLfo: OscillatorNode | null = null;

  // Blizzard howling resonance
  private blizzardHowlGain: GainNode | null = null;
  private blizzardHowlFilter: BiquadFilterNode | null = null;
  private blizzardHowlLfo: OscillatorNode | null = null;

  // Ambient birds in clear weather
  private birdTimer: number | null = null;
  private currentWeather: 'clear' | 'light_snow' | 'blizzard' = 'light_snow';
  private currentTimeOfDay: 'morning' | 'midday' | 'sunset' | 'night' = 'morning';

  // Noise buffers for crunchy snow and wind
  private noiseBuffer: AudioBuffer | null = null;
  private pinkNoiseBuffer: AudioBuffer | null = null;

  constructor() {
    // Lazy init on first user interaction
  }

  private initContext() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.75, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      this.createNoiseBuffers();
      this.startAmbientWind();
      this.initEngineSynth();
      this.initSnowCrunchSynth();
    } catch (e) {
      console.warn('AudioContext failed to initialize:', e);
    }
  }

  public ensureStarted() {
    if (!this.ctx) {
      this.initContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private createNoiseBuffers() {
    if (!this.ctx) return;
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * 2; // 2 seconds loop
    
    // White noise buffer
    const whiteBuffer = this.ctx.createBuffer(1, length, sampleRate);
    const whiteData = whiteBuffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      whiteData[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = whiteBuffer;

    // Pink noise buffer (for cozy winter wind)
    const pinkBuffer = this.ctx.createBuffer(1, length, sampleRate);
    const pinkData = pinkBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      pinkData[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    this.pinkNoiseBuffer = pinkBuffer;
  }

  private initEngineSynth() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // Dual oscillator engine with warm filter
    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc1.type = 'sawtooth';
    this.engineOsc1.frequency.setValueAtTime(38, t);

    this.engineOsc2 = this.ctx.createOscillator();
    this.engineOsc2.type = 'triangle';
    this.engineOsc2.frequency.setValueAtTime(76, t);

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(140, t);
    this.engineFilter.Q.setValueAtTime(3.5, t);

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.001, t);

    this.engineOsc1.connect(this.engineFilter);
    this.engineOsc2.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.sfxGain);

    this.engineOsc1.start();
    this.engineOsc2.start();
    this.isEngineRunning = true;
  }

  private initSnowCrunchSynth() {
    if (!this.ctx || !this.noiseBuffer || !this.sfxGain) return;

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.noiseBuffer;
    noiseSource.loop = true;

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(950, this.ctx.currentTime);
    bandpass.Q.setValueAtTime(1.8, this.ctx.currentTime);

    const highpass = this.ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(450, this.ctx.currentTime);

    this.snowCrunchGain = this.ctx.createGain();
    this.snowCrunchGain.gain.setValueAtTime(0, this.ctx.currentTime);

    noiseSource.connect(bandpass);
    bandpass.connect(highpass);
    highpass.connect(this.snowCrunchGain);
    this.snowCrunchGain.connect(this.sfxGain);

    noiseSource.start();
    this.snowCrunchNode = noiseSource;
    this.isSnowCrunching = true;
  }

  private startAmbientWind() {
    if (!this.ctx || !this.pinkNoiseBuffer || !this.ambientGain) return;

    const windSource = this.ctx.createBufferSource();
    windSource.buffer = this.pinkNoiseBuffer;
    windSource.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.setValueAtTime(320, this.ctx.currentTime);
    this.windFilter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    // Subtle LFO modulating wind filter frequency for gusting effect
    this.windLfo = this.ctx.createOscillator();
    this.windLfo.type = 'sine';
    this.windLfo.frequency.setValueAtTime(0.12, this.ctx.currentTime); // ~8 sec period

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(120, this.ctx.currentTime);

    this.windLfo.connect(lfoGain);
    lfoGain.connect(this.windFilter.frequency);
    this.windLfo.start();

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

    windSource.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.ambientGain);

    windSource.start();

    // 2. High-resonance blizzard howl synth
    const howlSource = this.ctx.createBufferSource();
    howlSource.buffer = this.pinkNoiseBuffer;
    howlSource.loop = true;

    this.blizzardHowlFilter = this.ctx.createBiquadFilter();
    this.blizzardHowlFilter.type = 'bandpass';
    this.blizzardHowlFilter.frequency.setValueAtTime(580, this.ctx.currentTime);
    this.blizzardHowlFilter.Q.setValueAtTime(8.5, this.ctx.currentTime); // very high Q creates eerie whistling howl

    this.blizzardHowlLfo = this.ctx.createOscillator();
    this.blizzardHowlLfo.type = 'sine';
    this.blizzardHowlLfo.frequency.setValueAtTime(0.22, this.ctx.currentTime);

    const howlModGain = this.ctx.createGain();
    howlModGain.gain.setValueAtTime(160, this.ctx.currentTime);
    this.blizzardHowlLfo.connect(howlModGain);
    howlModGain.connect(this.blizzardHowlFilter.frequency);
    this.blizzardHowlLfo.start();

    this.blizzardHowlGain = this.ctx.createGain();
    this.blizzardHowlGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

    howlSource.connect(this.blizzardHowlFilter);
    this.blizzardHowlFilter.connect(this.blizzardHowlGain);
    this.blizzardHowlGain.connect(this.ambientGain);

    howlSource.start();
  }

  /**
   * Adjust ambient synth wind and bird soundscape based on weather condition
   */
  public setWeather(weather: 'clear' | 'light_snow' | 'blizzard') {
    this.currentWeather = weather;
    if (!this.ctx || !this.windGain || !this.windFilter) return;
    const t = this.ctx.currentTime;

    if (weather === 'blizzard') {
      // Roaring howling wind with eerie whistling resonance
      this.windGain.gain.setTargetAtTime(0.42, t, 1.2);
      this.windFilter.frequency.setTargetAtTime(750, t, 1.0);
      this.windFilter.Q.setTargetAtTime(2.2, t, 1.0);
      if (this.windLfo) {
        this.windLfo.frequency.setTargetAtTime(0.35, t, 1.0); // faster gusts
      }
      if (this.blizzardHowlGain) {
        this.blizzardHowlGain.gain.setTargetAtTime(0.28, t, 1.5); // activate howling resonance
      }
      this.stopBirdScheduler();
    } else if (weather === 'clear') {
      // Whispering soft gentle breeze
      this.windGain.gain.setTargetAtTime(0.06, t, 1.5);
      this.windFilter.frequency.setTargetAtTime(220, t, 1.5);
      this.windFilter.Q.setTargetAtTime(0.8, t, 1.5);
      if (this.windLfo) {
        this.windLfo.frequency.setTargetAtTime(0.08, t, 1.5);
      }
      if (this.blizzardHowlGain) {
        this.blizzardHowlGain.gain.setTargetAtTime(0.0001, t, 1.0);
      }
      // Start birds chirping during clear daytime
      if (this.currentTimeOfDay !== 'night') {
        this.startBirdScheduler();
      }
    } else {
      // Gentle alpine snowfall breeze
      this.windGain.gain.setTargetAtTime(0.18, t, 1.5);
      this.windFilter.frequency.setTargetAtTime(320, t, 1.5);
      this.windFilter.Q.setTargetAtTime(1.2, t, 1.5);
      if (this.windLfo) {
        this.windLfo.frequency.setTargetAtTime(0.12, t, 1.5);
      }
      if (this.blizzardHowlGain) {
        this.blizzardHowlGain.gain.setTargetAtTime(0.0001, t, 1.0);
      }
      this.stopBirdScheduler();
    }
  }

  /**
   * Modulate ambient environment based on Time of Day
   */
  public setTimeOfDay(timeOfDay: 'morning' | 'midday' | 'sunset' | 'night') {
    this.currentTimeOfDay = timeOfDay;
    if (timeOfDay === 'night') {
      this.stopBirdScheduler();
    } else if (this.currentWeather === 'clear') {
      this.startBirdScheduler();
    }
  }

  private startBirdScheduler() {
    if (this.birdTimer !== null) return;
    const scheduleNext = () => {
      if (this.currentWeather !== 'clear' || this.currentTimeOfDay === 'night') {
        this.stopBirdScheduler();
        return;
      }
      const delay = 3500 + Math.random() * 4000;
      this.birdTimer = window.setTimeout(() => {
        this.playBirdChirp();
        scheduleNext();
      }, delay);
    };
    scheduleNext();
  }

  private stopBirdScheduler() {
    if (this.birdTimer !== null) {
      clearTimeout(this.birdTimer);
      this.birdTimer = null;
    }
  }

  /**
   * Procedural avian chirping for crisp, sunny alpine weather
   */
  public playBirdChirp() {
    if (!this.ctx || !this.ambientGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const style = Math.random();

    if (style < 0.5) {
      // Double peep: 2 short high-frequency chirps
      const f1 = 3400 + Math.random() * 600;
      [0, 0.1].forEach((delay) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f1, t + delay);
        osc.frequency.exponentialRampToValueAtTime(f1 * 1.35, t + delay + 0.035);
        osc.frequency.exponentialRampToValueAtTime(f1 * 0.95, t + delay + 0.07);

        gain.gain.setValueAtTime(0.0001, t + delay);
        gain.gain.linearRampToValueAtTime(0.045, t + delay + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.08);

        osc.connect(gain);
        gain.connect(this.ambientGain!);
        osc.start(t + delay);
        osc.stop(t + delay + 0.09);
      });
    } else {
      // Melodic trill: 3 ascending musical notes
      const baseFreq = 2800 + Math.random() * 400;
      const notes = [baseFreq, baseFreq * 1.15, baseFreq * 1.33];
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const delay = idx * 0.065;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + delay);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.12, t + delay + 0.04);

        gain.gain.setValueAtTime(0.0001, t + delay);
        gain.gain.linearRampToValueAtTime(0.04, t + delay + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.07);

        osc.connect(gain);
        gain.connect(this.ambientGain!);
        osc.start(t + delay);
        osc.stop(t + delay + 0.08);
      });
    }
  }

  /**
   * Modulate engine sound based on truck speed and throttle
   * @param speed normalized speed 0 to 1
   * @param isBoosting boolean
   */
  public updateEngine(speed: number, isBoosting: boolean) {
    if (!this.ctx || !this.engineGain || !this.engineFilter || !this.engineOsc1 || !this.engineOsc2) return;
    const t = this.ctx.currentTime;
    const clampedSpeed = Math.max(0, Math.min(speed, 1.2));
    
    // Base frequency idle 42Hz, up to 130Hz
    const baseFreq = 42 + clampedSpeed * 75 + (isBoosting ? 25 : 0);
    this.engineOsc1.frequency.setTargetAtTime(baseFreq, t, 0.05);
    this.engineOsc2.frequency.setTargetAtTime(baseFreq * 2.01, t, 0.05);

    // Filter opens as speed increases
    const cutoff = 130 + clampedSpeed * 380 + (isBoosting ? 200 : 0);
    this.engineFilter.frequency.setTargetAtTime(cutoff, t, 0.06);

    // Volume level
    const targetGain = 0.07 + clampedSpeed * 0.16 + (isBoosting ? 0.08 : 0);
    this.engineGain.gain.setTargetAtTime(targetGain, t, 0.05);
  }

  /**
   * Set crunch level when plowing through snow
   * @param intensity 0 (not plowing) to 1 (heavy snow)
   */
  public setSnowPlowing(intensity: number) {
    if (!this.ctx || !this.snowCrunchGain) return;
    const t = this.ctx.currentTime;
    const clamped = Math.max(0, Math.min(intensity, 1));
    const targetGain = clamped > 0.02 ? clamped * 0.22 : 0;
    this.snowCrunchGain.gain.setTargetAtTime(targetGain, t, 0.04);
  }

  /**
   * Sparkly snow pickup chime (pentatonic notes)
   */
  public playSnowFlakeChime(pitchMultiplier: number = 1.0) {
    this.ensureStarted();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const pentatonic = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5]; // C5, D5, E5, G5, A5, C6
    const note = pentatonic[Math.floor(Math.random() * pentatonic.length)] * pitchMultiplier;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(note, t);
    osc.frequency.exponentialRampToValueAtTime(note * 1.5, t + 0.18);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  /**
   * Combo multiplier milestone chime (synth FM chord)
   */
  public playComboChime(tier: number) {
    this.ensureStarted();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    // Ascending chord tiers: C, D, Em, G, A, Cmaj7
    const chords: number[][] = [
      [261.63, 329.63, 392.0],        // C4, E4, G4 (1.5x)
      [293.66, 369.99, 440.0],        // D4, F#4, A4 (2x)
      [329.63, 392.0, 493.88, 659.25], // Em (3x)
      [392.0, 493.88, 587.33, 783.99], // G4 (5x)
      [440.0, 554.37, 659.25, 880.0],  // A major (8x)
      [523.25, 659.25, 783.99, 987.77, 1318.5] // Cmaj9 shimmer (10x+)
    ];

    const chordIndex = Math.min(Math.max(0, tier - 1), chords.length - 1);
    const chord = chords[chordIndex];

    chord.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.04);

      gain.gain.setValueAtTime(0.0001, t + idx * 0.04);
      gain.gain.linearRampToValueAtTime(0.14 / (chord.length * 0.6), t + idx * 0.04 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.8 + idx * 0.05);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(t + idx * 0.04);
      osc.stop(t + 0.9 + idx * 0.05);
    });
  }

  /**
   * Warm dual-tone horn honk
   */
  public playHorn() {
    this.ensureStarted();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const tones = [311.13, 370.0]; // Eb4 + F#4 warm diesel truck horn interval

    tones.forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const filter = this.ctx!.createBiquadFilter();
      const gain = this.ctx!.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, t);
      filter.frequency.exponentialRampToValueAtTime(600, t + 0.35);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.04);
      gain.gain.setValueAtTime(0.18, t + 0.28);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.42);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(t);
      osc.stop(t + 0.45);
    });
  }

  /**
   * Turbo Boost whoosh sound
   */
  public playBoost() {
    this.ensureStarted();
    if (!this.ctx || !this.noiseBuffer || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, t);
    filter.frequency.exponentialRampToValueAtTime(2400, t + 0.3);
    filter.frequency.exponentialRampToValueAtTime(400, t + 0.7);
    filter.Q.setValueAtTime(3, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.75);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + 0.8);
  }

  /**
   * Level victory / milestone fanfare
   */
  public playVictoryFanfare() {
    this.ensureStarted();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const notes = [
      { f: 523.25, time: 0.0, dur: 0.14 }, // C5
      { f: 659.25, time: 0.14, dur: 0.14 }, // E5
      { f: 783.99, time: 0.28, dur: 0.14 }, // G5
      { f: 1046.5, time: 0.42, dur: 0.45 }, // C6
      { f: 1318.5, time: 0.58, dur: 0.6 }  // E6
    ];

    notes.forEach((n) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, t + n.time);

      gain.gain.setValueAtTime(0.001, t + n.time);
      gain.gain.linearRampToValueAtTime(0.22, t + n.time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + n.time + n.dur);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(t + n.time);
      osc.stop(t + n.time + n.dur + 0.05);
    });
  }

  /**
   * Upgrade purchased sound
   */
  public playUpgradeSound() {
    this.ensureStarted();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const chord = [440, 554.37, 659.25, 880]; // A major

    chord.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.05);

      gain.gain.setValueAtTime(0.001, t + i * 0.05);
      gain.gain.linearRampToValueAtTime(0.18, t + i * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(t + i * 0.05);
      osc.stop(t + i * 0.05 + 0.4);
    });
  }

  /**
   * Bump or obstacle crash bump
   */
  public playBumpSound() {
    this.ensureStarted();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(95, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.12);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.16);
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.75, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }
}

export const synthAudio = new SynthAudioEngine();
