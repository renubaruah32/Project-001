// Premium high-fidelity Web Audio Synthesizer for UI tactile interactions
let audioContext: AudioContext | null = null;
let masterVolume = 0.8; // High fidelity default interaction volume

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }
  return audioContext;
}

// Ensure first click on page unlocks AudioContext securely
export function unlockAudio() {
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  } catch (e) {}
}

// 1. Tactile Premium Click Sound (Resonates beautifully with dynamic pitch decaying)
export function playClick() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Use a multi-oscillator attack transient to create an elegant physical push resonance
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Deep physical tap: quick sweep from 850Hz down to 240Hz
    osc.frequency.setValueAtTime(850, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.05);

    // Warm, round and clean feel
    const clickGain = 0.14 * masterVolume;
    gain.gain.setValueAtTime(clickGain, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  } catch (e) {
    // Fail-safe for browser sandbox policy
  }
}

// 2. Subtle Interactive Hover Sound
export function playHover() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Soft high-frequency pure harmonic pluck
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.setValueAtTime(1000, now + 0.015);

    const hoverGain = 0.03 * masterVolume;
    gain.gain.setValueAtTime(hoverGain, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.025);
  } catch (e) {
    // Fail-safe
  }
}

// 3. Dynamic Victory Win Chime Sound (Delightful A-major scale arpeggio chime)
export function playWin() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const notes = [440.00, 554.37, 659.25, 880.00]; // A4, C#5, E5, A5
    
    notes.forEach((freq, idx) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const delay = idx * 0.045; // Staggered arpeggiator

      o.type = 'sine';
      o.frequency.setValueAtTime(freq, now + delay);
      
      const chordVolume = 0.08 * masterVolume;
      g.gain.setValueAtTime(0.0, now + delay);
      g.gain.linearRampToValueAtTime(chordVolume, now + delay + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.3);

      o.connect(g);
      g.connect(ctx.destination);
      o.start(now + delay);
      o.stop(now + delay + 0.35);
    });
  } catch (e) {
    // Fail-safe
  }
}

// 4. Background Pad Ambient Soundscape (Disabled per user custom instruction)
export function startAmbient() {
  // Silent placeholder to comply with "Remove continuous background sound"
}

export function stopAmbient() {
  // Silent placeholder
}

// 5. Continuous Aviator Retro Synth Soundtrack (Removed per user instruction)
// Deleted hardcoded synth soundtrack to connect with Supabase admin page uploaded audio instead

// Global reference for active HTML5 custom audio elements
let activeGameAudio: HTMLAudioElement | null = null;

export function startGameMusic(gameId: string, customUrl?: string) {
  // Stop existing music first
  stopGameMusic();

  if (customUrl) {
    try {
      activeGameAudio = new Audio(customUrl);
      activeGameAudio.loop = true;
      activeGameAudio.volume = masterVolume * 0.45; // loop at gentle volume level
      activeGameAudio.play().catch((err) => {
        console.warn("[Audio Synth] Custom background music autoplay blocked or failed:", err);
      });
    } catch (e) {
      console.error("[Audio Synth] Failed to initialize custom game music:", e);
    }
  }
}

export function stopGameMusic() {
  if (activeGameAudio) {
    try {
      activeGameAudio.pause();
      activeGameAudio.src = "";
      activeGameAudio = null;
    } catch (e) {}
  }
}

// Get and Set master volume slider controls
export function getVolume(): number {
  return masterVolume;
}

export function setVolume(vol: number) {
  masterVolume = Math.min(1, Math.max(0, vol));
  if (activeGameAudio) {
    try {
      activeGameAudio.volume = masterVolume * 0.45;
    } catch (e) {}
  }
}

// Toggle mute state
export function setAmbientMuted(muteState: boolean) {
  // Stubbed mapping
  return muteState;
}

export function getMutedStatus(): boolean {
  return false;
}
