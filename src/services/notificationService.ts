export interface NotificationSettings {
  notifications: boolean;
  alertSound: boolean;
}

const STORAGE_KEY = 'smartfarm_notifications';
const SOUND_ENABLED_KEY = 'smartfarm_sound_enabled';

let activeOscillator: OscillatorNode | null = null;
let activeGain: GainNode | null = null;
let activeAudioContext: AudioContext | null = null;
let sirenInterval: ReturnType<typeof setInterval> | null = null;

export function getNotificationSettings(): NotificationSettings {
  const notifications = localStorage.getItem(STORAGE_KEY) !== 'false';
  const alertSound = localStorage.getItem(SOUND_ENABLED_KEY) !== 'false';
  return { notifications, alertSound };
}

export function setNotifications(enabled: boolean) {
  localStorage.setItem(STORAGE_KEY, String(enabled));
}

export function setAlertSound(enabled: boolean) {
  localStorage.setItem(SOUND_ENABLED_KEY, String(enabled));
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function showNotification(title: string, body: string): boolean {
  const settings = getNotificationSettings();
  if (!settings.notifications) return false;
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  try {
    new Notification(title, { body, icon: '/vite.svg' });
    return true;
  } catch {
    return false;
  }
}

export function playAlertSound(): void {
  if (typeof window === 'undefined') return;

  try {
    const audioContext = getAudioContext();
    if (!audioContext) return;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(660, audioContext.currentTime + 0.15);

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch {
    // Audio not available
  }
}

export function playEmergencySiren(): void {
  const settings = getNotificationSettings();
  if (!settings.alertSound) return;
  if (typeof window === 'undefined') return;

  try {
    const audioContext = getAudioContext();
    if (!audioContext) return;
    const duration = 4;
    const now = audioContext.currentTime;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sawtooth';
    for (let t = 0; t < duration; t += 0.5) {
      oscillator.frequency.setValueAtTime(800, now + t);
      oscillator.frequency.linearRampToValueAtTime(1200, now + t + 0.25);
      oscillator.frequency.linearRampToValueAtTime(800, now + t + 0.5);
    }

    gainNode.gain.setValueAtTime(0.4, now);
    gainNode.gain.setValueAtTime(0.4, now + duration - 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

    oscillator.start(now);
    oscillator.stop(now + duration);
  } catch {
    // Audio not available
  }
}

export function startEmergencySiren(): void {
  if (typeof window === 'undefined') return;
  stopEmergencySiren();

  try {
    const audioContext = getAudioContext();
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sawtooth';
    const now = audioContext.currentTime;
    oscillator.frequency.setValueAtTime(800, now);
    gainNode.gain.setValueAtTime(0.4, now);
    oscillator.start(now);

    activeOscillator = oscillator;
    activeGain = gainNode;
    activeAudioContext = audioContext;

    let toggle = false;
    sirenInterval = setInterval(() => {
      if (!activeOscillator || !activeAudioContext) return;
      toggle = !toggle;
      activeOscillator.frequency.linearRampToValueAtTime(
        toggle ? 1200 : 800,
        activeAudioContext.currentTime + 0.25,
      );
    }, 500);
  } catch {
    // Audio not available
  }
}

export function stopEmergencySiren(): void {
  if (sirenInterval) {
    clearInterval(sirenInterval);
    sirenInterval = null;
  }
  if (activeOscillator) {
    try {
      const ctx = activeAudioContext;
      if (ctx && activeGain) {
        activeGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      }
      activeOscillator.stop(ctx ? ctx.currentTime + 0.1 : 0);
    } catch {
      // ignore
    }
    activeOscillator = null;
  }
  activeGain = null;
  activeAudioContext = null;
}

function getAudioContext(): AudioContext | null {
  try {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctor();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    return ctx;
  } catch {
    return null;
  }
}
