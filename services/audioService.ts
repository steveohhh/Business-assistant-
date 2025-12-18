
export type SoundEvent = 'UI_CLICK' | 'NOTIFICATION' | 'SALE_SUCCESS' | 'ERROR' | 'AMBIENT_LOOP';

class AudioService {
    private audioContext: AudioContext;
    private masterGain: GainNode;
    private sounds: Map<SoundEvent, AudioBuffer> = new Map();
    private isMuted = false;
    private ambientSource: AudioBufferSourceNode | null = null;

    constructor() {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = 0.3; // Start at a reasonable volume
        this.masterGain.connect(this.audioContext.destination);
        this.loadSounds();
    }

    private async loadSound(url: string): Promise<AudioBuffer> {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        return this.audioContext.decodeAudioData(arrayBuffer);
    }

    private async loadSounds() {
        try {
            // --- AUDIO DISABLED TO PREVENT DECODING ERRORS ---
            // this.sounds.set('UI_CLICK', await this.loadSound('https://cdn.jsdelivr.net/gh/k-next/sounds@main/sounds/ui-button-click.mp3'));
            // this.sounds.set('NOTIFICATION', await this.loadSound('https://cdn.jsdelivr.net/gh/k-next/sounds@main/sounds/notification.mp3'));
            // this.sounds.set('SALE_SUCCESS', await this.loadSound('https://cdn.jsdelivr.net/gh/k-next/sounds@main/sounds/kaching.mp3'));
            // this.sounds.set('ERROR', await this.loadSound('https://cdn.jsdelivr.net/gh/k-next/sounds@main/sounds/error-alert.mp3'));
            // this.sounds.set('AMBIENT_LOOP', await this.loadSound('https://cdn.jsdelivr.net/gh/k-next/sounds@main/sounds/ambient-drone-sci-fi.mp3'));
            // this.playAmbientLoop();
        } catch (e) {
            console.error("Failed to load audio assets:", e);
        }
    }

    public playSound(event: SoundEvent) {
        if (this.isMuted || !this.sounds.has(event)) return;
        // Resume context on user interaction
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        const source = this.audioContext.createBufferSource();
        source.buffer = this.sounds.get(event)!;
        source.connect(this.masterGain);
        source.start(0);
    }

    private playAmbientLoop() {
        if (this.isMuted || !this.sounds.has('AMBIENT_LOOP')) return;

        if (this.ambientSource) {
            this.ambientSource.stop();
        }
        this.ambientSource = this.audioContext.createBufferSource();
        this.ambientSource.buffer = this.sounds.get('AMBIENT_LOOP')!;
        this.ambientSource.loop = true;
        
        const ambientGain = this.audioContext.createGain();
        ambientGain.gain.value = 0.1; // Very low volume for background
        this.ambientSource.connect(ambientGain).connect(this.masterGain);
        
        this.ambientSource.start(0);
    }

    public toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.masterGain.gain.setValueAtTime(0, this.audioContext.currentTime);
            if (this.ambientSource) this.ambientSource.stop();
        } else {
            this.masterGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            this.playAmbientLoop();
        }
        return this.isMuted;
    }
    
    public getMuteState() {
        return this.isMuted;
    }
}

export const audioService = new AudioService();
