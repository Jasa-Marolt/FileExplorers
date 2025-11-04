import { loadSettings } from './useSettings';

export enum SoundEffect {
    LeftClick = 'left_click',
    RightClick = 'right_click',
    OpenFolder = 'open_folder',
    Copy = 'copy',
    Cut = 'cut',
    Paste = 'paste',
    Delete = 'recycle',
    Forward = 'forward',
    Backward = 'backward',
    Error = 'error',
    Win = 'win',
}

const soundCache = new Map<string, HTMLAudioElement>();

/**
 * Preload a sound file
 */
function preloadSound(soundName: string): HTMLAudioElement {
    if (soundCache.has(soundName)) {
        return soundCache.get(soundName)!;
    }

    const audio = new Audio(`/sounds/${soundName}.wav`);
    audio.preload = 'auto';
    soundCache.set(soundName, audio);
    return audio;
}

/**
 * Preload all sound effects
 */
export function preloadAllSounds(): void {
    Object.values(SoundEffect).forEach(sound => {
        preloadSound(sound);
    });
}

/**
 * Play a sound effect
 */
export function playSound(sound: SoundEffect): void {
    const settings = loadSettings();
    
    if (!settings.soundEnabled) {
        return;
    }

    try {
        const audio = preloadSound(sound);
        // Clone the audio to allow overlapping sounds
        const audioClone = audio.cloneNode(true) as HTMLAudioElement;
        audioClone.volume = 0.3; // Set volume to 30%
        audioClone.play().catch(err => {
            console.warn('Failed to play sound:', sound, err);
        });
    } catch (error) {
        console.warn('Error playing sound:', sound, error);
    }
}
