import type { FilterSettings } from 'composables/useAudioSettings'

interface AudioServiceOptions {
  fftSize?: number
  smoothingTimeConstant?: number
}

interface Filters {
  bass: BiquadFilterNode
  mid: BiquadFilterNode
  treble: BiquadFilterNode
}

export class AudioService {
  private analyser: AnalyserNode | null = null
  private audio: HTMLAudioElement
  private audioContext: AudioContext | null = null
  private filters: Filters | null = null
  private isMetadataLoading = false
  private sourceNode: MediaElementAudioSourceNode | null = null

  constructor(audio: HTMLAudioElement, options: AudioServiceOptions = {}) {
    this.audio = audio
    this.setupAudioContext(options)
  }

  applyAudioSettings(settings: {
    autoplay: boolean
    loop: boolean
    playbackRate: number
    volume: number
  }): void {
    this.audio.volume = settings.volume / 100
    this.audio.playbackRate = settings.playbackRate
    this.audio.loop = settings.loop
    this.audio.autoplay = settings.autoplay
  }

  cleanup(): void {
    if (this.sourceNode) {
      this.sourceNode.disconnect()
      this.sourceNode = null
    }

    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }

    if (this.audio?.src) {
      URL.revokeObjectURL(this.audio.src)
    }

    this.filters = null
    this.analyser = null
    this.isMetadataLoading = false
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyser
  }

  getAudioContext(): AudioContext | null {
    return this.audioContext
  }

  getCurrentTime(): number {
    return this.audio.currentTime || 0
  }

  getDuration(): number {
    return this.audio.duration || 0
  }

  getIsMetadataLoading(): boolean {
    return this.isMetadataLoading
  }

  getProgress(): number {
    const duration = this.getDuration()
    const currentTime = this.getCurrentTime()
    return duration ? Math.trunc((currentTime / duration) * 100) : 0
  }

  async initializeAudio(file: File): Promise<void> {
    if (!file) {
      throw new Error('Аудиофайл не выбран')
    }

    if (!this.audioContext) {
      throw new Error('Аудио контекст не инициализирован')
    }

    try {
      this.isMetadataLoading = true
      this.audio.src = URL.createObjectURL(file)

      if (!this.sourceNode) {
        this.sourceNode = this.audioContext.createMediaElementSource(this.audio)
        this.connectAudioChain()
      }
    }
    catch (error) {
      this.isMetadataLoading = false
      throw error
    }
  }

  isPlaying(): boolean {
    return !this.audio.paused && !this.audio.ended
  }

  onEnded(callback: () => void): void {
    this.audio.addEventListener('ended', callback)
  }

  onLoadedMetadata(callback: () => void): void {
    this.audio.addEventListener('loadedmetadata', callback)
  }

  onTimeUpdate(callback: () => void): void {
    this.audio.addEventListener('timeupdate', callback)
  }

  pause(): void {
    this.audio.pause()
  }

  async play(): Promise<void> {
    await this.resumeAudioContext()
    await this.audio.play()
  }

  removeEventListener(event: string, callback: () => void): void {
    this.audio.removeEventListener(event, callback)
  }

  async resumeAudioContext(): Promise<void> {
    if (this.audioContext?.state === 'suspended') {
      return this.audioContext.resume()
    }
    return Promise.resolve()
  }

  seek(time: number): void {
    if (this.audio.duration && !Number.isNaN(this.audio.duration)) {
      this.audio.currentTime = Math.max(0, Math.min(time, this.audio.duration))
    }
  }

  seekBySeconds(seconds: number): void {
    const newTime = this.audio.currentTime + seconds
    this.seek(newTime)
  }

  updateFilterSettings(settings: FilterSettings): void {
    if (!this.filters)
      return

    this.filters.bass.gain.value = settings.bass.gain
    this.filters.bass.frequency.value = settings.bass.frequency
    this.filters.mid.gain.value = settings.mid.gain
    this.filters.mid.frequency.value = settings.mid.frequency
    this.filters.treble.gain.value = settings.treble.gain
    this.filters.treble.frequency.value = settings.treble.frequency
  }

  private connectAudioChain(): void {
    if (!this.audioContext || !this.sourceNode || !this.analyser) {
      return
    }

    this.filters = this.createFilters()

    if (this.filters) {
      this.sourceNode.connect(this.analyser)
      this.analyser.connect(this.filters.bass)
      this.filters.bass.connect(this.filters.mid)
      this.filters.mid.connect(this.filters.treble)
      this.filters.treble.connect(this.audioContext.destination)
    }
    else {
      this.sourceNode.connect(this.analyser)
      this.analyser.connect(this.audioContext.destination)
    }
  }

  private createFilters(): Filters | null {
    if (!this.audioContext)
      return null

    const filters = {
      bass: this.audioContext.createBiquadFilter(),
      mid: this.audioContext.createBiquadFilter(),
      treble: this.audioContext.createBiquadFilter(),
    }

    filters.bass.type = 'lowshelf'
    filters.mid.type = 'peaking'
    filters.treble.type = 'highshelf'

    return filters
  }

  private setupAudioContext(options: AudioServiceOptions): void {
    if (!window.AudioContext) {
      throw new Error('Web Audio API не поддерживается')
    }

    this.audioContext = new AudioContext()
    this.analyser = this.audioContext.createAnalyser()
    this.analyser.fftSize = options.fftSize || 2048
    this.analyser.smoothingTimeConstant = options.smoothingTimeConstant || 0.8
  }
}
