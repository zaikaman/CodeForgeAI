// Simple sound effects using Web Audio API
class SoundEffects {
  private audioContext: AudioContext | null = null
  private enabled = false

  constructor() {
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      this.audioContext = new AudioContext()
      console.log('[SoundEffects] AudioContext initialized')
    } else {
      console.warn('[SoundEffects] AudioContext not available')
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
    console.log('[SoundEffects] Sound effects', enabled ? 'ENABLED' : 'DISABLED')
    
    // Resume audio context on first enable (needed for browser autoplay policies)
    if (enabled && this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().then(() => {
        console.log('[SoundEffects] AudioContext resumed')
      })
    }
  }

  isEnabled() {
    return this.enabled
  }

  // Core beep sound generator
  playBeep(frequency = 800, duration = 100, waveType: OscillatorType = 'square', volume = 0.1) {
    if (!this.enabled) {
      console.log('[SoundEffects] Sound disabled, skipping playBeep')
      return
    }
    
    if (!this.audioContext) {
      console.warn('[SoundEffects] AudioContext not available')
      return
    }

    // Resume context if suspended
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }

    try {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      oscillator.frequency.value = frequency
      oscillator.type = waveType

      gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + duration / 1000
      )

      oscillator.start(this.audioContext.currentTime)
      oscillator.stop(this.audioContext.currentTime + duration / 1000)
      
      console.log('[SoundEffects] Played beep:', frequency, 'Hz')
    } catch (error) {
      console.error('[SoundEffects] Error playing sound:', error)
    }
  }

  // Button click - short crisp sound
  playClick() {
    this.playBeep(1400, 25, 'square', 0.08)
  }

  // Hover sound - very subtle
  playHover() {
    this.playBeep(1600, 15, 'sine', 0.04)
  }

  // Tab switch sound
  playTabSwitch() {
    this.playBeep(900, 40, 'triangle', 0.06)
  }

  // File select sound
  playFileSelect() {
    if (!this.enabled || !this.audioContext) return
    setTimeout(() => this.playBeep(1100, 30, 'sine', 0.07), 0)
    setTimeout(() => this.playBeep(1300, 30, 'sine', 0.05), 30)
  }

  // Success sound - ascending tones
  playSuccess() {
    if (!this.enabled || !this.audioContext) return
    setTimeout(() => this.playBeep(600, 70, 'sine', 0.08), 0)
    setTimeout(() => this.playBeep(800, 70, 'sine', 0.08), 70)
    setTimeout(() => this.playBeep(1000, 100, 'sine', 0.1), 140)
  }

  // Error sound - descending harsh tones
  playError() {
    if (!this.enabled || !this.audioContext) return
    setTimeout(() => this.playBeep(800, 90, 'sawtooth', 0.12), 0)
    setTimeout(() => this.playBeep(600, 90, 'sawtooth', 0.12), 90)
    setTimeout(() => this.playBeep(400, 130, 'sawtooth', 0.15), 180)
  }

  // Typing sound - very short click
  playType() {
    this.playBeep(1500, 18, 'square', 0.03)
  }

  // Notification sound - double beep
  playNotification() {
    if (!this.enabled || !this.audioContext) return
    setTimeout(() => this.playBeep(850, 80, 'sine', 0.09), 0)
    setTimeout(() => this.playBeep(1100, 90, 'sine', 0.09), 130)
  }

  // Message received sound
  playMessageReceived() {
    if (!this.enabled || !this.audioContext) return
    setTimeout(() => this.playBeep(700, 50, 'triangle', 0.08), 0)
    setTimeout(() => this.playBeep(900, 60, 'triangle', 0.07), 60)
  }

  // Collapse/Expand panel sound
  playToggle() {
    if (!this.enabled || !this.audioContext) return
    this.playBeep(1000, 35, 'triangle', 0.07)
  }

  // Deploy/Generate start sound
  playStart() {
    if (!this.enabled || !this.audioContext) return
    setTimeout(() => this.playBeep(500, 60, 'sine', 0.09), 0)
    setTimeout(() => this.playBeep(700, 60, 'sine', 0.09), 60)
    setTimeout(() => this.playBeep(900, 60, 'sine', 0.09), 120)
    setTimeout(() => this.playBeep(1100, 80, 'sine', 0.1), 180)
  }

  // Complete sound
  playComplete() {
    if (!this.enabled || !this.audioContext) return
    setTimeout(() => this.playBeep(800, 60, 'triangle', 0.08), 0)
    setTimeout(() => this.playBeep(1000, 60, 'triangle', 0.08), 70)
    setTimeout(() => this.playBeep(1200, 80, 'triangle', 0.09), 140)
    setTimeout(() => this.playBeep(1400, 100, 'triangle', 0.1), 220)
  }

  // Warning sound
  playWarning() {
    if (!this.enabled || !this.audioContext) return
    setTimeout(() => this.playBeep(900, 100, 'square', 0.1), 0)
    setTimeout(() => this.playBeep(900, 100, 'square', 0.1), 200)
  }
}

export const soundEffects = new SoundEffects()
