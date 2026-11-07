// WebGL-рендер шейдера огня (Shadertoy) для декоративного фона.
// Рисует в прозрачный канвас, уважает prefers-reduced-motion и ставит анимацию на паузу
// при скрытой вкладке.

import type { Ref } from 'vue'

import { onBeforeUnmount, onMounted, ref } from 'vue'

import fragmentShaderSource from './fire/fire.frag.glsl?raw'
import vertexShaderSource from './fire/fire.vert.glsl?raw'

export interface FireShaderOptions {
  /** Играет ли музыка: в паузе огонь проседает до углей. */
  active?: Ref<boolean>
  /** Анализатор аудио: бас/середина/высокие модулируют пламя. */
  analyser?: Ref<AnalyserNode | null>
  /** Включена ли аудио-реактивность: при false огонь статичный. */
  audioReactive?: Ref<boolean>
  /** Высота пламени относительно высоты канваса (1 — на всю высоту). */
  flameHeight?: number
  /** Ограничение FPS, чтобы не жечь батарею на телефоне. */
  fps?: number
  /** Базовая сила пламени (0..1): для постоянно слабого бокового огня. */
  intensity?: number
  /** Общая прозрачность огня. */
  opacity?: number
  /** Направление, откуда поднимается пламя. */
  orientation?: 'bottom' | 'left'
  /** Скорость анимации. */
  speed?: number
}

interface UseFireShaderReturn {
  isReady: Readonly<Ref<boolean>>
}

const QUAD_VERTICES = new Float32Array([
  -1,
  -1,
  1,
  -1,
  -1,
  1,
  -1,
  1,
  1,
  -1,
  1,
  1,
])

export function useFireShader(
  canvas: Ref<HTMLCanvasElement | null>,
  options: FireShaderOptions = {},
): UseFireShaderReturn {
  const isReady = ref(false)

  const speed = options.speed ?? 1
  const flameHeight = options.flameHeight ?? 0.9
  const opacity = options.opacity ?? 1
  const intensity = Math.min(1, Math.max(0, options.intensity ?? 1))
  const orientation = options.orientation === 'left' ? 1 : 0
  const frameInterval = 1000 / Math.min(60, Math.max(1, options.fps ?? 30))

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

  let gl: null | WebGLRenderingContext = null
  let program: null | WebGLProgram = null
  let positionBuffer: null | WebGLBuffer = null
  let uTime: null | WebGLUniformLocation = null
  let uResolution: null | WebGLUniformLocation = null
  let uFlameHeight: null | WebGLUniformLocation = null
  let uOpacity: null | WebGLUniformLocation = null
  let uOrientation: null | WebGLUniformLocation = null
  let uAudio: null | WebGLUniformLocation = null
  let uPresence: null | WebGLUniformLocation = null
  let uPulse: null | WebGLUniformLocation = null

  let analyserData: null | Uint8Array<ArrayBuffer> = null
  let audioBass = 0
  let audioMid = 0
  let audioTreble = 0
  let pulse = 0

  const isAudioReactive = (): boolean => options.audioReactive?.value ?? true
  const isActive = (): boolean => options.active?.value ?? true

  // При старте в паузе сразу показываем угли, без вспышки полного пламени.
  let presence = !isAudioReactive() || isActive() ? 1 : 0

  let rafId = 0
  let startedAt = 0
  let accumulated = 0
  let lastFrameAt = 0
  let isRunning = false
  let resizeObserver: null | ResizeObserver = null

  function resizeCanvas(): boolean {
    const element = canvas.value
    if (!element || !gl)
      return false

    const width = Math.max(1, Math.round(element.clientWidth))
    const height = Math.max(1, Math.round(element.clientHeight))

    if (element.width === width && element.height === height)
      return false

    element.width = width
    element.height = height
    gl.viewport(0, 0, width, height)

    return true
  }

  function averageRange(data: Uint8Array<ArrayBuffer>, start: number, end: number): number {
    let sum = 0
    for (let i = start; i < end; i++)
      sum += data[i]

    return end > start ? sum / (end - start) / 255 : 0
  }

  function smoothAudio(current: number, target: number): number {
    return current + (target - current) * (target > current ? 0.35 : 0.08)
  }

  function sampleAudio(): void {
    const node = options.analyser?.value
    let targetBass = 0
    let targetMid = 0
    let targetTreble = 0

    if (node) {
      const binCount = node.frequencyBinCount

      if (!analyserData || analyserData.length !== binCount)
        analyserData = new Uint8Array(binCount)

      node.getByteFrequencyData(analyserData)

      const binHz = node.context.sampleRate / 2 / binCount
      const bassEnd = Math.min(binCount, Math.max(1, Math.ceil(250 / binHz)))
      const midEnd = Math.min(binCount, Math.max(bassEnd + 1, Math.ceil(2000 / binHz)))
      const trebleEnd = Math.min(binCount, Math.max(midEnd + 1, Math.ceil(8000 / binHz)))

      targetBass = Math.min(1, averageRange(analyserData, 0, bassEnd) * 1.2)
      targetMid = Math.min(1, averageRange(analyserData, bassEnd, midEnd) * 1.5)
      targetTreble = Math.min(1, averageRange(analyserData, midEnd, trebleEnd) * 1.8)
    }

    const bassAttack = Math.max(0, targetBass - audioBass)

    audioBass = smoothAudio(audioBass, targetBass)
    audioMid = smoothAudio(audioMid, targetMid)
    audioTreble = smoothAudio(audioTreble, targetTreble)
    pulse = Math.max(pulse * 0.84, Math.min(1, bassAttack * 1.8))

    let targetPresence = 1

    if (isAudioReactive()) {
      if (!isActive()) {
        targetPresence = 0
      }
      else {
        // Даже в тихом месте огонь остаётся ниже обычного, а на громком — поднимается.
        const energy = audioBass * 0.55 + audioMid * 0.3 + audioTreble * 0.15
        targetPresence = Math.min(1, 0.18 + energy * 1.25)
      }
    }

    presence += (targetPresence - presence) * (targetPresence > presence ? 0.22 : 0.07)
  }

  function draw(time: number): void {
    const element = canvas.value
    if (!gl || !program || !element)
      return

    sampleAudio()

    gl.useProgram(program)
    gl.uniform1f(uTime, time * speed)
    gl.uniform2f(uResolution, element.width, element.height)
    gl.uniform1f(uFlameHeight, flameHeight)
    gl.uniform1f(uOpacity, opacity)
    gl.uniform1i(uOrientation, orientation)
    gl.uniform3f(uAudio, audioBass, audioMid, audioTreble)
    gl.uniform1f(uPresence, presence * intensity)
    gl.uniform1f(uPulse, pulse)
    gl.drawArrays(gl.TRIANGLES, 0, QUAD_VERTICES.length / 2)
  }

  function frame(now: number): void {
    rafId = requestAnimationFrame(frame)

    if (now - lastFrameAt < frameInterval)
      return

    lastFrameAt = now
    draw(accumulated + (now - startedAt) / 1000)
  }

  function start(): void {
    if (isRunning || !isReady.value || reduceMotion.matches)
      return

    isRunning = true
    startedAt = performance.now()
    lastFrameAt = 0
    rafId = requestAnimationFrame(frame)
  }

  function stop(): void {
    if (!isRunning)
      return

    accumulated += (performance.now() - startedAt) / 1000
    isRunning = false

    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = 0
    }
  }

  function cleanupGl(): void {
    if (!gl)
      return

    if (positionBuffer)
      gl.deleteBuffer(positionBuffer)
    if (program)
      gl.deleteProgram(program)

    positionBuffer = null
    program = null
    gl = null
  }

  function setup(): boolean {
    const element = canvas.value
    if (!element)
      return false

    const context = element.getContext('webgl', {
      alpha: true,
      antialias: false,
      depth: false,
      powerPreference: 'low-power',
      premultipliedAlpha: true,
      stencil: false,
    })

    if (!context) {
      console.warn('[fire] WebGL is not supported')
      return false
    }

    gl = context
    program = createProgram(context)

    if (!program)
      return false

    positionBuffer = context.createBuffer()
    if (!positionBuffer)
      return false

    context.bindBuffer(context.ARRAY_BUFFER, positionBuffer)
    context.bufferData(context.ARRAY_BUFFER, QUAD_VERTICES, context.STATIC_DRAW)
    context.enableVertexAttribArray(0)
    context.vertexAttribPointer(0, 2, context.FLOAT, false, 0, 0)

    uTime = context.getUniformLocation(program, 'uTime')
    uResolution = context.getUniformLocation(program, 'uResolution')
    uFlameHeight = context.getUniformLocation(program, 'uFlameHeight')
    uOpacity = context.getUniformLocation(program, 'uOpacity')
    uOrientation = context.getUniformLocation(program, 'uOrientation')
    uAudio = context.getUniformLocation(program, 'uAudio')
    uPresence = context.getUniformLocation(program, 'uPresence')
    uPulse = context.getUniformLocation(program, 'uPulse')

    resizeCanvas()

    return true
  }

  function handleVisibilityChange(): void {
    if (document.hidden)
      stop()
    else
      start()
  }

  function handleMotionPreferenceChange(): void {
    if (reduceMotion.matches) {
      stop()
      draw(6)
    }
    else {
      start()
    }
  }

  function handleContextLost(event: Event): void {
    event.preventDefault()
    stop()
    isReady.value = false
    cleanupGl()
  }

  function handleContextRestored(): void {
    if (!setup())
      return

    isReady.value = true
    draw(accumulated)
    start()
  }

  onMounted(() => {
    const element = canvas.value
    if (!element || !setup()) {
      cleanupGl()
      return
    }

    isReady.value = true

    resizeObserver = new ResizeObserver(() => {
      if (resizeCanvas() && !isRunning)
        draw(accumulated)
    })
    resizeObserver.observe(element)

    document.addEventListener('visibilitychange', handleVisibilityChange)
    element.addEventListener('webglcontextlost', handleContextLost)
    element.addEventListener('webglcontextrestored', handleContextRestored)
    reduceMotion.addEventListener('change', handleMotionPreferenceChange)

    if (reduceMotion.matches)
      draw(6)
    else
      start()
  })

  onBeforeUnmount(() => {
    stop()
    resizeObserver?.disconnect()
    resizeObserver = null

    const element = canvas.value
    if (element) {
      element.removeEventListener('webglcontextlost', handleContextLost)
      element.removeEventListener('webglcontextrestored', handleContextRestored)
    }

    document.removeEventListener('visibilitychange', handleVisibilityChange)
    reduceMotion.removeEventListener('change', handleMotionPreferenceChange)

    cleanupGl()
    isReady.value = false
  })

  return { isReady }
}

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): null | WebGLShader {
  const shader = gl.createShader(type)
  if (!shader)
    return null

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn('[fire] shader compile error:', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }

  return shader
}

function createProgram(gl: WebGLRenderingContext): null | WebGLProgram {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)

  if (!vertexShader || !fragmentShader) {
    if (vertexShader)
      gl.deleteShader(vertexShader)
    if (fragmentShader)
      gl.deleteShader(fragmentShader)
    return null
  }

  const program = gl.createProgram()
  if (!program) {
    gl.deleteShader(vertexShader)
    gl.deleteShader(fragmentShader)
    return null
  }

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.bindAttribLocation(program, 0, 'aPosition')
  gl.linkProgram(program)

  gl.deleteShader(vertexShader)
  gl.deleteShader(fragmentShader)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn('[fire] program link error:', gl.getProgramInfoLog(program))
    gl.deleteProgram(program)
    return null
  }

  return program
}
