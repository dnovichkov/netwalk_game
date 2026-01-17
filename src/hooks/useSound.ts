import { useCallback, useRef } from 'react';
import { useSettingsStore } from '../store';

type SoundType = 'click' | 'connect' | 'win' | 'error';

interface SoundConfig {
  frequency: number;
  duration: number;
  type: OscillatorType;
  volume: number;
}

const SOUNDS: Record<SoundType, SoundConfig> = {
  click: {
    frequency: 800,
    duration: 0.05,
    type: 'square',
    volume: 0.1,
  },
  connect: {
    frequency: 523.25, // C5
    duration: 0.15,
    type: 'sine',
    volume: 0.15,
  },
  win: {
    frequency: 523.25, // C5
    duration: 0.5,
    type: 'sine',
    volume: 0.2,
  },
  error: {
    frequency: 200,
    duration: 0.2,
    type: 'sawtooth',
    volume: 0.1,
  },
};

export function useSound() {
  const soundEnabled = useSettingsStore((state) => state.soundEnabled);
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  const playSound = useCallback(
    (type: SoundType) => {
      if (!soundEnabled) return;

      try {
        const ctx = getAudioContext();
        const config = SOUNDS[type];

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = config.type;
        oscillator.frequency.setValueAtTime(config.frequency, ctx.currentTime);

        // Envelope for smooth sound
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(config.volume, ctx.currentTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + config.duration);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + config.duration);
      } catch {
        // Audio not supported or blocked
      }
    },
    [soundEnabled, getAudioContext]
  );

  const playClick = useCallback(() => playSound('click'), [playSound]);
  const playConnect = useCallback(() => playSound('connect'), [playSound]);
  const playWin = useCallback(() => playSound('win'), [playSound]);
  const playError = useCallback(() => playSound('error'), [playSound]);

  // Play win melody (ascending notes)
  const playWinMelody = useCallback(() => {
    if (!soundEnabled) return;

    try {
      const ctx = getAudioContext();
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const noteDuration = 0.15;

      notes.forEach((freq, index) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, ctx.currentTime);

        const startTime = ctx.currentTime + index * noteDuration;
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
        gainNode.gain.linearRampToValueAtTime(0, startTime + noteDuration);

        oscillator.start(startTime);
        oscillator.stop(startTime + noteDuration);
      });
    } catch {
      // Audio not supported or blocked
    }
  }, [soundEnabled, getAudioContext]);

  return {
    playClick,
    playConnect,
    playWin,
    playWinMelody,
    playError,
  };
}
