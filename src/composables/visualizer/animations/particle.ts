export interface Particle {
  color: string
  life: number
  rotation: number
  rotationSpeed: number
  shape: 'circle' | 'square' | 'star' | 'triangle'
  size: number
  vx: number
  vy: number
  x: number
  y: number
}

const MAX_PARTICLES = 50

export function drawParticle(
  ctx: CanvasRenderingContext2D,
  dataArray: Uint8Array,
  bufferLength: number,
  centerX: number,
  centerY: number,
  isDark: boolean,
  visualizationIntensity: number,
  particles: Particle[],
): void {
  const intensity = (dataArray.reduce((sum, val) => sum + val, 0) / bufferLength) * visualizationIntensity

  if (particles.length < MAX_PARTICLES && Math.random() < intensity / 255) {
    const shapes: Array<'circle' | 'square' | 'star' | 'triangle'> = ['circle', 'square', 'triangle', 'star']
    const colors = isDark
      ? ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd']
      : ['#e74c3c', '#27ae60', '#3498db', '#f39c12', '#9b59b6', '#e67e22', '#1abc9c', '#34495e']

    particles.push({
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      size: Math.random() * 4 + 2,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      x: centerX,
      y: centerY,
    })
  }

  const activeParticles = particles
    .filter(p => p.life > 0)
    .slice(0, MAX_PARTICLES)

  activeParticles.forEach((p) => {
    p.x += p.vx * 2
    p.y += p.vy
    p.life -= 0.02
    p.rotation += p.rotationSpeed

    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(p.rotation)
    ctx.globalAlpha = p.life
    ctx.fillStyle = p.color
    ctx.strokeStyle = p.color
    ctx.lineWidth = 1

    switch (p.shape) {
      case 'circle':
        ctx.beginPath()
        ctx.arc(0, 0, p.size, 0, Math.PI * 2)
        ctx.fill()
        break

      case 'square':
        ctx.fillRect(-p.size, -p.size, p.size * 2, p.size * 2)
        break

      case 'star':
        ctx.beginPath()
        for (let i = 0; i < 5; i++) {
          const angle = (i * Math.PI * 2) / 5 - Math.PI / 2
          const x = Math.cos(angle) * p.size
          const y = Math.sin(angle) * p.size
          if (i === 0)
            ctx.moveTo(x, y)
          else ctx.lineTo(x, y)

          const innerAngle = angle + Math.PI / 5
          const innerX = Math.cos(innerAngle) * (p.size * 0.5)
          const innerY = Math.sin(innerAngle) * (p.size * 0.5)
          ctx.lineTo(innerX, innerY)
        }
        ctx.closePath()
        ctx.fill()
        break

      case 'triangle':
        ctx.beginPath()
        ctx.moveTo(0, -p.size)
        ctx.lineTo(-p.size, p.size)
        ctx.lineTo(p.size, p.size)
        ctx.closePath()
        ctx.fill()
        break
    }

    ctx.restore()
  })

  particles.length = 0
  particles.push(...activeParticles)
}
