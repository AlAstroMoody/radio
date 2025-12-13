import type { InjectionKey, Ref } from 'vue'

export interface AudioController {
  analyser: Ref<AnalyserNode | null>
  audio: Ref<HTMLAudioElement | null>
  audioContext: Ref<AudioContext | null>
  currentSource: Ref<AudioSourceDescriptor | null>
  load: (descriptor: AudioSourceDescriptor) => Promise<void>
  pause: () => void
  play: () => Promise<void>
  seek: (seconds: number) => void
  setEffectChain: (builder: AudioEffectBuilder | null) => void
  setMuted: (muted: boolean) => void
  setVolume: (value: number) => void
  state: AudioPlaybackState
  stop: () => void
}

export type AudioEffectBuilder = (context: AudioContext, analyser: AnalyserNode) => AudioEffectChain | null

export interface AudioEffectChain {
  cleanup?: () => void
  output: AudioNode
}

export interface AudioPlaybackState {
  buffered: null | TimeRanges
  currentSrc: string
  currentTime: number
  duration: number
  ended: boolean
  error: null | string
  isPlaying: boolean
  isReady: boolean
  muted: boolean
  volume: number
}

export interface AudioSourceDescriptor {
  autoplay?: boolean
  file?: File
  id?: string
  label?: string
  src?: string
  type?: 'external' | 'file' | 'stream'
}

export const audioControllerKey: InjectionKey<AudioController> = Symbol('audio-controller')
