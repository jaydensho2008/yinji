type SpeechWindow = Window & {
  SpeechRecognition?: new () => BrowserRecognition;
  webkitSpeechRecognition?: new () => BrowserRecognition;
};

type BrowserRecognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  abort: () => void;
};

let voicePromise: Promise<SpeechSynthesisVoice | null> | null = null;

function loadVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  return window.speechSynthesis.getVoices();
}

function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const scored = voices
    .filter((v) => v.lang.toLowerCase().startsWith("en"))
    .map((v) => {
      const lang = v.lang.toLowerCase();
      const name = v.name.toLowerCase();
      let score = 0;
      if (lang.startsWith("en-gb")) score += 8;
      if (lang.startsWith("en-uk")) score += 8;
      if (name.includes("british") || name.includes("uk english") || name.includes("daniel")) score += 6;
      if (name.includes("google") && lang.startsWith("en-gb")) score += 4;
      if (v.localService) score += 1;
      return { v, score };
    })
    .sort((a, b) => b.score - a.score);
  return scored[0]?.v ?? voices.find((v) => v.lang.toLowerCase().startsWith("en")) ?? null;
}

export function waitForVoice(): Promise<SpeechSynthesisVoice | null> {
  if (typeof window === "undefined" || !window.speechSynthesis) return Promise.resolve(null);
  if (voicePromise) return voicePromise;
  voicePromise = new Promise((resolve) => {
    const existing = loadVoices();
    if (existing.length) {
      resolve(pickVoice(existing));
      return;
    }
    const done = () => {
      resolve(pickVoice(loadVoices()));
      window.speechSynthesis.onvoiceschanged = null;
    };
    window.speechSynthesis.onvoiceschanged = done;
    window.setTimeout(done, 800);
  });
  return voicePromise;
}

export function speakEnglish(text: string, rate = 0.86): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return Promise.resolve();
  }
  window.speechSynthesis.cancel();
  return waitForVoice().then(
    (voice) =>
      new Promise((resolve) => {
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = voice?.lang ?? "en-GB";
        if (voice) utter.voice = voice;
        utter.rate = rate;
        utter.pitch = 1;
        utter.onend = () => resolve();
        utter.onerror = () => resolve();
        window.speechSynthesis.speak(utter);
      }),
  );
}

export function stopSpeaking() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}

export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function canRecognize(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as SpeechWindow;
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export function recognizeOnce(lang = "en-GB"): Promise<string> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("unsupported"));
  }
  const w = window as SpeechWindow;
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!Ctor) return Promise.reject(new Error("unsupported"));

  return new Promise((resolve, reject) => {
    const rec = new Ctor();
    rec.lang = lang;
    rec.interimResults = false;
    rec.maxAlternatives = 3;
    rec.continuous = false;
    let settled = false;
    rec.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? "";
      settled = true;
      resolve(transcript);
    };
    rec.onerror = (event) => {
      if (settled) return;
      settled = true;
      reject(new Error(event.error || "recognize-failed"));
    };
    rec.onend = () => {
      if (settled) return;
      settled = true;
      reject(new Error("empty"));
    };
    try {
      rec.start();
    } catch (err) {
      reject(err);
    }
  });
}

function normalizeWord(value: string): string {
  return value.toLowerCase().replace(/[^a-z']/g, "");
}

function levenshtein(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const grid: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));
  for (let i = 0; i < rows; i++) grid[i]![0] = i;
  for (let j = 0; j < cols; j++) grid[0]![j] = j;
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      grid[i]![j] = Math.min(
        grid[i - 1]![j]! + 1,
        grid[i]![j - 1]! + 1,
        grid[i - 1]![j - 1]! + cost,
      );
    }
  }
  return grid[a.length]![b.length]!;
}

export function matchesWord(said: string, target: string): boolean {
  const a = normalizeWord(said);
  const b = normalizeWord(target);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  const limit = b.length <= 3 ? 1 : 2;
  return levenshtein(a, b) <= limit;
}
