/**
 * Tiny in-tab event bus for UI echoes that should not round-trip through the
 * data channel (e.g. showing your own reaction immediately).
 */
type LocalEvents = {
  reaction: { emoji: string; name: string; mine: boolean };
  chime: { kind: "recording" | "knock" | "hand" };
};

type AnyHandler = (payload: unknown) => void;

const listeners = new Map<keyof LocalEvents, Set<AnyHandler>>();

export const localBus = {
  on<K extends keyof LocalEvents>(
    type: K,
    handler: (payload: LocalEvents[K]) => void,
  ): () => void {
    let set = listeners.get(type);
    if (!set) {
      set = new Set();
      listeners.set(type, set);
    }
    const wrapped = handler as AnyHandler;
    set.add(wrapped);
    return () => {
      set?.delete(wrapped);
    };
  },
  emit<K extends keyof LocalEvents>(type: K, payload: LocalEvents[K]): void {
    listeners.get(type)?.forEach((h) => h(payload));
  },
};

let audioCtx: AudioContext | null = null;

/** Short synthesized tone — the "audible announcement" without shipping assets. */
export function playChime(kind: LocalEvents["chime"]["kind"]): void {
  if (typeof window === "undefined") return;
  try {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return;
    audioCtx ??= new Ctor();
    const ctx = audioCtx;
    const now = ctx.currentTime;
    const notes =
      kind === "recording"
        ? [660, 880]
        : kind === "knock"
          ? [523, 659, 784]
          : [740];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.14);
      gain.gain.linearRampToValueAtTime(0.08, now + i * 0.14 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.14 + 0.28);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.14);
      osc.stop(now + i * 0.14 + 0.3);
    });
  } catch {
    // audio is a nicety; never throw
  }
}
