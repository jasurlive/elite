import { CanvasTexture, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace } from 'three'
import type { Floor } from '../../lib/plan'
import { PALETTE, type Color } from '../../lib/furniture'

// shared materials: created once, reused by every mesh

const std = (color: string, roughness = 0.9, metalness = 0) =>
  new MeshStandardMaterial({ color, roughness, metalness })

export const MAT = {
  wall: std('#ede6da', 0.95),
  cap: std('#d3c8b8'), // top of the cut walls
  ceiling: std('#f6f2ec', 0.95),
  trim: std('#f7f3ec', 0.55), // skirting, frames, door leaves
  steel: std('#3f3b37', 0.5, 0.3), // sliding door + window profiles
  glass: new MeshStandardMaterial({ color: '#dfeaec', roughness: 0.05, transparent: true, opacity: 0.22, depthWrite: false }),
  mirror: std('#ffffff', 0.02, 1),
  chrome: std('#d9d7d3', 0.25, 1),
}

export const FURNITURE_MAT: Record<Color, MeshStandardMaterial> = {
  ...(Object.fromEntries(Object.entries(PALETTE).map(([key, color]) => [key, std(color, 0.85)])) as Record<
    keyof typeof PALETTE,
    MeshStandardMaterial
  >),
  glass: MAT.glass,
  mirror: MAT.mirror,
  chrome: MAT.chrome,
}

// ---------- floors: small canvas textures, UVs are plan mm ----------

// tiny seeded random so the planks look the same on every load
let seed = 7
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646

function texture(base: string, tileMm: number, draw: (ctx: CanvasRenderingContext2D, size: number) => void) {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = base
  ctx.fillRect(0, 0, size, size)
  draw(ctx, size)

  const map = new CanvasTexture(canvas)
  map.wrapS = map.wrapT = RepeatWrapping
  map.repeat.set(1 / tileMm, 1 / tileMm)
  map.colorSpace = SRGBColorSpace
  map.anisotropy = 8
  return new MeshStandardMaterial({ map, roughness: 0.8 })
}

// 6 rows of planks, staggered joints, slight tone change per plank
const planks = (ctx: CanvasRenderingContext2D, size: number) => {
  const rows = 6
  const h = size / rows
  for (let r = 0; r < rows; r++) {
    const joint = rand() * size
    for (const x of [joint - size, joint]) {
      ctx.fillStyle = rand() > 0.5 ? `rgba(255,250,240,${rand() * 0.18})` : `rgba(120,85,45,${rand() * 0.1})`
      ctx.fillRect(x, r * h, size, h)
    }
    ctx.fillStyle = 'rgba(95,70,40,0.28)'
    ctx.fillRect(0, r * h, size, 2)
    ctx.fillRect(joint, r * h, 2, h)
  }
}

const grid = (cells: number, alpha: number) => (ctx: CanvasRenderingContext2D, size: number) => {
  ctx.fillStyle = `rgba(80,70,60,${alpha})`
  for (let i = 0; i < cells; i++) {
    ctx.fillRect((i * size) / cells, 0, 2, size)
    ctx.fillRect(0, (i * size) / cells, size, 2)
  }
}

export const FLOOR_MAT: Record<Floor, MeshStandardMaterial> = {
  oak: texture('#dcc6a3', 1500, planks),
  tile: texture('#e6e1d8', 1200, grid(2, 0.14)),
  stone: texture('#cfc7ba', 800, grid(2, 0.16)),
}
