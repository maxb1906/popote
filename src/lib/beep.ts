import { Platform } from 'react-native';

/**
 * Timer ring for the web / iPhone home-screen app, where vibration and notifications are not available.
 * iOS only lets a page play sound after a tap, so `primeAudio()` runs when the user starts a timer.
 */
let ctx: AudioContext | null = null;

export function primeAudio() {
  if (Platform.OS !== 'web') return;
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx ??= new AC();
    if (ctx.state === 'suspended') void ctx.resume();
    // a silent blip unlocks audio on iOS
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    g.gain.value = 0;
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.01);
  } catch {
    /* no audio */
  }
}

export function ring() {
  if (Platform.OS !== 'web' || !ctx) return;
  try {
    const t0 = ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = 880;
      const t = t0 + i * 0.45;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.4, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.4);
    }
  } catch {
    /* no audio */
  }
}
