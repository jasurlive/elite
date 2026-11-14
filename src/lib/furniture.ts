// "utilities": furniture + fixtures, shown with the toggle
// every piece = plan rect (x0, z0 → x1, z1) + height (y0 → y1) in mm, drawn as a soft box, cylinder or sphere

export const PALETTE = {
  oak: '#c8ad86',
  oakLight: '#dcc8a8',
  linen: '#e3d8c6',
  linenWhite: '#f4efe7',
  oat: '#cfc3b0',
  sand: '#c9b79c',
  rug: '#e8dfd0',
  white: '#faf8f4',
  stone: '#bdb4a6',
  charcoal: '#4f4a45',
  clay: '#b9967a',
  sage: '#8e9c82',
}

export type Color = keyof typeof PALETTE | 'glass' | 'mirror' | 'chrome'
export type Shape = 'box' | 'cyl' | 'sphere'
export type Piece = {
  box: [x0: number, z0: number, x1: number, z1: number, y0: number, y1: number]
  color: Color
  shape?: Shape
  radius?: number // corner radius for boxes
}

const p = (x0: number, z0: number, x1: number, z1: number, y0: number, y1: number, color: Color, shape: Shape = 'box', radius?: number): Piece => ({
  box: [x0, z0, x1, z1, y0, y1],
  color,
  shape,
  radius,
})

// round thing centred at (x, z)
const round = (x: number, z: number, r: number, y0: number, y1: number, color: Color, shape: Shape = 'cyl') =>
  p(x - r, z - r, x + r, z + r, y0, y1, color, shape)

// four slim legs under a rect
const legs = (x0: number, z0: number, x1: number, z1: number, h: number, color: Color = 'oak', s = 40, inset = 40) => [
  p(x0 + inset, z0 + inset, x0 + inset + s, z0 + inset + s, 0, h, color),
  p(x1 - inset - s, z0 + inset, x1 - inset, z0 + inset + s, 0, h, color),
  p(x0 + inset, z1 - inset - s, x0 + inset + s, z1 - inset, 0, h, color),
  p(x1 - inset - s, z1 - inset - s, x1 - inset, z1 - inset, 0, h, color),
]

// ---------- pieces ----------

// local frame for things that face a direction: u = to the right, v = forward
const DIRS = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] } as const
type Facing = keyof typeof DIRS

const local = (x: number, z: number, f: Facing) => {
  const [fx, fz] = DIRS[f]
  const [rx, rz] = [-fz, fx]
  return (u0: number, u1: number, v0: number, v1: number, y0: number, y1: number, color: Color, shape: Shape = 'box', radius?: number) => {
    const xs = [u0 * rx + v0 * fx, u1 * rx + v1 * fx]
    const zs = [u0 * rz + v0 * fz, u1 * rz + v1 * fz]
    return p(x + Math.min(...xs), z + Math.min(...zs), x + Math.max(...xs), z + Math.max(...zs), y0, y1, color, shape, radius)
  }
}

// bed with its headboard against x = wall, running towards +x; one pillow on a single bed
const bed = (wall: number, z0: number, z1: number, length = 2100, duvet: Color = 'linen'): Piece[] => {
  // a, b = distance from the headboard wall
  const part = (a: number, b: number, za: number, zb: number, y0: number, y1: number, color: Color, r: number) =>
    p(wall + a, za, wall + b, zb, y0, y1, color, 'box', r)
  const zc = (z0 + z1) / 2
  const single = z1 - z0 < 1200
  return [
    part(120, length - 60, z0 + 60, z1 - 60, 0, 180, 'oak', 10),
    part(80, length, z0, z1, 180, 320, 'oak', 20),
    part(110, length - 30, z0 + 30, z1 - 30, 320, 540, 'linenWhite', 60),
    part(800, length - 10, z0 + 10, z1 - 10, 540, 580, duvet, 18),
    part(length - 520, length - 300, z0 - 15, z1 + 15, 580, 596, 'sand', 6),
    ...(single
      ? [part(180, 560, z0 + 120, z1 - 120, 540, 680, 'white', 55)]
      : [part(180, 560, z0 + 90, zc - 30, 540, 680, 'white', 55), part(180, 560, zc + 30, z1 - 90, 540, 680, 'white', 55)]),
    part(0, 110, z0 - 40, z1 + 40, 0, 1150, 'oat', 40),
  ]
}

// nightstand with a small lamp
const nightstand = (x0: number, z0: number): Piece[] => [
  p(x0, z0, x0 + 450, z0 + 400, 120, 520, 'oakLight', 'box', 12),
  ...legs(x0, z0, x0 + 450, z0 + 400, 120, 'oak', 25, 30),
  round(x0 + 225, z0 + 200, 60, 520, 760, 'stone'),
  round(x0 + 225, z0 + 200, 140, 760, 960, 'linenWhite'),
]

// doors on the side that faces the room
const wardrobe = (x0: number, z0: number, x1: number, z1: number, front: Facing): Piece[] => {
  const alongX = front === 'n' || front === 's'
  const mid = alongX ? (x0 + x1) / 2 : (z0 + z1) / 2
  const face = { n: z0 - 25, s: z1, e: x1, w: x0 - 25 }[front]
  const pull = (m0: number, m1: number) =>
    alongX ? p(m0, face, m1, face + 25, 900, 1500, 'oak') : p(face, m0, face + 25, m1, 900, 1500, 'oak')
  return [
    p(x0, z0, x1, z1, 60, 2300, 'linenWhite', 'box', 8),
    p(x0 + 20, z0 + 20, x1 - 20, z1 - 20, 0, 60, 'oak'),
    pull(mid - 40, mid - 20),
    pull(mid + 20, mid + 40),
  ]
}

const chair = (x: number, z: number, f: Facing, color: Color = 'oat'): Piece[] => {
  const b = local(x, z, f)
  return [
    b(-220, 220, -220, 220, 430, 480, color, 'box', 20),
    ...legs(x - 220, z - 220, x + 220, z + 220, 430, 'oak', 30, 20),
    b(-220, 220, -230, -190, 480, 850, color, 'box', 15),
  ]
}

// ergonomic desk chair: star base, gas lift, seat, tall back, arms
const officeChair = (x: number, z: number, f: Facing): Piece[] => {
  const b = local(x, z, f)
  return [
    round(x, z, 320, 0, 50, 'charcoal'),
    round(x, z, 30, 50, 430, 'chrome'),
    b(-250, 250, -220, 260, 430, 500, 'charcoal', 'box', 30),
    b(-230, 230, -280, -230, 560, 1250, 'charcoal', 'box', 25),
    b(-275, -245, -150, 150, 630, 660, 'charcoal'),
    b(245, 275, -150, 150, 630, 660, 'charcoal'),
  ]
}

// open laptop on a desk of height h; (x, z) = middle of the keyboard, screen on the far side
const laptop = (x: number, z: number, f: Facing, h = 750): Piece[] => {
  const b = local(x, z, f)
  return [b(-165, 165, -115, 115, h, h + 15, 'stone', 'box', 6), b(-165, 165, 105, 115, h + 15, h + 235, 'charcoal', 'box', 4)]
}

const monitor = (x: number, z: number, f: Facing, h = 750): Piece[] => {
  const b = local(x, z, f)
  return [
    b(-110, 110, -90, 90, h, h + 15, 'stone', 'box', 6),
    round(x, z, 20, h + 15, h + 260, 'stone'),
    b(-310, 310, -14, 14, h + 230, h + 600, 'charcoal', 'box', 6),
  ]
}

const deskLamp = (x: number, z: number, h = 750): Piece[] => [
  round(x, z, 80, h, h + 20, 'charcoal'),
  round(x, z, 10, h + 20, h + 420, 'charcoal'),
  round(x, z, 100, h + 420, h + 560, 'linenWhite'),
]

// open shelves against a left-hand wall at x = wall, filled with books / boxes in muted colours
const BOOKS: [width: number, height: number, color: Color][] = [
  [180, 300, 'sage'], [140, 250, 'clay'], [230, 320, 'sand'], [90, 230, 'charcoal'], [160, 280, 'oat'], [120, 260, 'linen'],
]
const bookshelf = (wall: number, z0: number, z1: number, depth = 320, h = 1800): Piece[] => {
  const shelves = [0, 450, 900, 1350]
  const pieces = [
    p(wall, z0, wall + depth, z0 + 25, 0, h, 'linenWhite'),
    p(wall, z1 - 25, wall + depth, z1, 0, h, 'linenWhite'),
    ...[...shelves, h - 25].map((y) => p(wall, z0, wall + depth, z1, y, y + 25, 'linenWhite')),
  ]
  shelves.forEach((y, row) => {
    let z = z0 + 50
    for (let i = 0; z < z0 + (z1 - z0) * 0.7; i++) {
      const [w, bh, color] = BOOKS[(i + row * 2) % BOOKS.length]
      pieces.push(p(wall + 40, z, wall + depth - 40, z + w, y + 25, y + 25 + bh, color, 'box', 4))
      z += w + 10
    }
  })
  return pieces
}

const plant = (x: number, z: number, scale = 1): Piece[] => [
  round(x, z, 170 * scale, 0, 380 * scale, 'clay'),
  round(x, z, 280 * scale, 300 * scale, 1150 * scale, 'sage', 'sphere'),
]

export const FURNITURE: Piece[] = [
  // ---------- kids' room: two single beds, shared desk + bookshelf ----------
  ...bed(0, 2350, 3250, 2000, 'sage'),
  ...bed(0, 3950, 4850, 2000, 'clay'),
  ...nightstand(0, 3400),
  ...bookshelf(0, 300, 2100),
  // shared study desk on the right wall: window light comes from the left, no glare on the screens
  p(2450, 250, 3100, 2650, 720, 750, 'oakLight', 'box', 8),
  ...legs(2450, 250, 3100, 2650, 720, 'oak', 30, 30),
  ...chair(2150, 850, 'e', 'sage'),
  ...chair(2150, 2050, 'e', 'clay'),
  ...laptop(2800, 850, 'e'),
  ...laptop(2800, 2050, 'e'),
  ...deskLamp(2950, 1450),
  p(900, 500, 2300, 2300, 0, 8, 'rug', 'box', 4),
  round(1300, 5150, 300, 0, 450, 'sand', 'sphere'),
  ...wardrobe(0, 5550, 1800, 6150, 'n'),

  // ---------- bedroom + coding workspace ----------
  ...bed(3250, 1400, 3000, 2050),
  ...nightstand(3250, 900),
  ...nightstand(3250, 3100),
  p(4100, 1500, 5300, 3300, 0, 8, 'rug', 'box', 4),
  ...wardrobe(5650, 1800, 6250, 3400, 'w'),
  // desk by the balcony door: daylight from the side, never behind or on the screen
  p(5600, 250, 6250, 1650, 720, 750, 'oak', 'box', 8),
  ...legs(5600, 250, 6250, 1650, 720, 'oak', 30, 30),
  ...monitor(6100, 750, 'e'),
  ...laptop(5850, 1300, 'e'),
  ...deskLamp(6150, 1520),
  ...officeChair(5200, 900, 'e'),

  // ---------- hall ----------
  p(8000, 2700, 10400, 5300, 0, 8, 'rug', 'box', 4),
  // sofa
  p(9900, 2800, 10780, 5100, 90, 400, 'oat', 'box', 30),
  ...legs(9900, 2800, 10780, 5100, 90, 'oak', 35, 60),
  p(10560, 2800, 10780, 5100, 400, 820, 'oat', 'box', 50),
  p(9900, 2800, 10560, 2960, 400, 620, 'oat', 'box', 40),
  p(9900, 4940, 10560, 5100, 400, 620, 'oat', 'box', 40),
  p(9930, 2980, 10560, 3950, 400, 520, 'linen', 'box', 50),
  p(9930, 3950, 10560, 4920, 400, 520, 'linen', 'box', 50),
  p(10380, 3100, 10540, 3600, 520, 900, 'sand', 'box', 60),
  // coffee table + side lamp
  round(9000, 3950, 450, 360, 400, 'oak'),
  round(9000, 3950, 70, 0, 360, 'oak'),
  round(10560, 5450, 160, 0, 30, 'charcoal'),
  round(10560, 5450, 15, 30, 1450, 'charcoal'),
  round(10560, 5450, 210, 1450, 1720, 'linenWhite'),
  // tv sideboard
  p(6400, 2900, 6850, 4600, 150, 600, 'oakLight', 'box', 10),
  ...legs(6400, 2900, 6850, 4600, 150, 'oak', 30, 30),
  // tv on the west wall: side-on to the daylight from the sliding door, so no reflections
  p(6470, 3025, 6510, 4475, 850, 1680, 'charcoal', 'box', 6),
  // dining
  round(7700, 2350, 550, 720, 755, 'oak'),
  round(7700, 2350, 60, 40, 720, 'oak'),
  round(7700, 2350, 250, 0, 40, 'oak'),
  ...chair(7700, 1680, 's'),
  ...chair(7700, 3020, 'n'),
  ...plant(10450, 6000),

  // ---------- kitchen ----------
  p(6400, -1050, 10100, -450, 100, 870, 'linenWhite', 'box', 6),
  p(6420, -1030, 10080, -470, 0, 100, 'stone'),
  p(6400, -1050, 10100, -430, 870, 910, 'oak', 'box', 6),
  round(7300, -750, 260, 910, 915, 'charcoal'),
  p(8350, -980, 8950, -620, 895, 912, 'stone', 'box', 30),
  round(8650, -980, 18, 912, 1250, 'chrome'),
  p(6500, -1050, 7900, -800, 1550, 1580, 'oak'),
  p(6500, -1050, 7900, -800, 1900, 1930, 'oak'),
  p(10150, -1050, 10800, -400, 0, 2150, 'linenWhite', 'box', 6),
  p(10130, -900, 10150, -550, 950, 1500, 'oak'),

  // ---------- corridor ----------
  p(5000, 7000, 5850, 9700, 0, 8, 'rug', 'box', 4),
  p(5900, 8200, 6250, 9700, 120, 520, 'oakLight', 'box', 10),
  ...legs(5900, 8200, 6250, 9700, 120, 'oak', 30, 30),
  p(6230, 8400, 6250, 9500, 1100, 1900, 'mirror'),

  // ---------- storage + make-up (old wc) ----------
  ...bookshelf(2450, 6350, 7850, 400, 2200),
  // make-up table + stool
  p(3050, 7400, 4250, 7850, 720, 760, 'oak', 'box', 8),
  ...legs(3050, 7400, 4250, 7850, 720, 'oak', 30, 30),
  round(3650, 7100, 200, 0, 460, 'sand'),
  round(3650, 7820, 120, 1100, 1350, 'linenWhite'),

  // ---------- bath: walk-in shower + wc ----------
  p(2450, 9300, 3400, 10200, 0, 40, 'white', 'box', 8),
  p(3380, 9300, 3400, 10200, 40, 2000, 'glass'),
  // wall-hung wc with built-in cistern
  p(2450, 8450, 2620, 9050, 0, 1100, 'linenWhite', 'box', 6),
  p(2620, 8580, 3150, 8920, 260, 640, 'white', 'box', 140),
  // vanity + mirror
  p(3250, 8000, 4150, 8480, 450, 820, 'oak', 'box', 8),
  p(3400, 8050, 4000, 8430, 820, 900, 'white', 'box', 40),
  p(3300, 8000, 4100, 8015, 1100, 1900, 'mirror'),
  // washer
  p(3800, 9600, 4420, 10180, 0, 850, 'white', 'box', 20),

  // ---------- balcony ----------
  round(5200, -750, 300, 700, 730, 'oak'),
  round(5200, -750, 30, 0, 700, 'charcoal'),
  ...chair(5200, -1150, 's', 'sand'),
  ...plant(6000, -1050, 0.8),
]
