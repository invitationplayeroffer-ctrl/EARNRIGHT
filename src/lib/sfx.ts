const KEY = 'earnright-sound';
let ctx: AudioContext | null = null;

export function soundOn(): boolean {
  if (typeof window === 'undefined') return true;
  return window.localStorage.getItem(KEY) !== 'off';
}

export function setSoundOn(on: boolean) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, on ? 'on' : 'off');
}

function audio(): AudioContext | null {
  if (typeof window === 'undefined' || !soundOn()) return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(f: number, dur: number, type: OscillatorType = 'sine', vol = 0.12, delay = 0, to = f) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + delay;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(Math.max(1, f), t);
  if (to !== f) osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + dur);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

function notes(list: number[], dur: number, type: OscillatorType = 'triangle', vol = 0.11, step = 0.07) {
  list.forEach((f, i) => tone(f, dur, type, vol, i * step));
}

export const sfx = {
  tap: () => tone(620, 0.07, 'triangle', 0.08, 0, 430),
  drop: () => tone(210, 0.15, 'sine', 0.18, 0, 90),
  level: () => notes([523, 659, 784, 1046], 0.18),
  fail: () => tone(320, 0.45, 'sawtooth', 0.1, 0, 70),
  reward: () => notes([784, 1046, 1318, 1568], 0.2, 'sine', 0.12, 0.06),
  boxOpen: () => {
    tone(160, 0.5, 'sawtooth', 0.1, 0, 900);
    notes([659, 880, 1174, 1568, 2093], 0.24, 'sine', 0.1, 0.07);
  },
};
