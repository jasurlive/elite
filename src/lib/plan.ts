// floor plan from assets/elite.jpg — everything in millimetres
// origin = inner top-left corner of bedroom 1, x → right, z → down (as on the drawing)

export type Vec2 = [x: number, z: number]
export type Vec3 = [x: number, y: number, z: number]

export const WALL_H = 2700
export const SLAB = 60 // floor thickness, below y = 0

const EXT = 250 // exterior wall
const INT = 150 // partition

// vertical span of each opening kind
export const SPAN = {
  door: [0, 2100],
  slide: [0, 2400],
  window: [850, 2250],
} as const

// side: which face of the wall a door swings to (+1 = left of a → b, -1 = right)
// hinge: which end of the opening the leaf hangs on
export type Opening =
  | { kind: 'window'; at: number; width: number }
  | { kind: 'slide'; at: number; width: number }
  | { kind: 'door'; at: number; width: number; hinge: 'start' | 'end'; side: 1 | -1; glazed?: boolean; mirror?: boolean }

// facade: brick skin on the outside face of a wall
// side: which face looks out (same convention as a door's side), from/to: stretch along the wall (default: all of it)
export type Brick = 'red' | 'buff'
export type Facade = { side: 1 | -1; brick: Brick; from?: number; to?: number }

// railing: a wrought-iron balcony railing instead of a solid wall
export type WallDef = { a: Vec2; b: Vec2; t: number; height?: number; openings?: Opening[]; facade?: Facade; railing?: boolean }

export type Floor = 'oak' | 'tile' | 'stone'
// label: where the 2D plan writes the name, walk: rect the first-person camera stays in
export type Room = { name: string; floor: Floor; outline: Vec2[]; label?: Vec2; walk?: [number, number, number, number] }

const rect = (x0: number, z0: number, x1: number, z1: number): Vec2[] => [
  [x0, z0], [x1, z0], [x1, z1], [x0, z1],
]

export const ROOMS: Room[] = [
  { name: "Kids' room", floor: 'oak', outline: rect(0, 0, 3100, 6150) },
  { name: 'Bedroom', floor: 'oak', outline: rect(3250, 0, 6250, 4300) },
  { name: 'Kitchen', floor: 'tile', outline: rect(6400, -1050, 10800, 1150) },
  { name: 'Hall', floor: 'oak', outline: rect(6400, 1300, 10800, 6300) },
  { name: 'Bath', floor: 'tile', outline: rect(2450, 8000, 4450, 10200) },
  // old WC: storage + make-up room, top-right corner cut at 45° (door sits on the cut)
  { name: 'Storage', floor: 'oak', outline: [[2450, 6350], [3760, 6350], [4450, 7040], [4450, 7850], [2450, 7850]] },
  {
    name: 'Corridor',
    floor: 'oak',
    label: [5425, 8300],
    walk: [4600, 4450, 6250, 10200], // the long leg, so you can't walk through into storage
    outline: [[3250, 4450], [6250, 4450], [6250, 10200], [4600, 10200], [4600, 6978], [3772, 6150], [3250, 6150]],
  },
  { name: 'Balcony', floor: 'stone', outline: [[3350, -250], [3900, -1250], [6250, -1250], [6250, -250]] },
]

type DoorOpts = { glazed?: boolean; mirror?: boolean }
const door = (at: number, width: number, hinge: 'start' | 'end', side: 1 | -1, opts: DoorOpts = {}): Opening => ({
  kind: 'door', at, width, hinge, side, ...opts,
})
const win = (at: number, width = 1200): Opening => ({ kind: 'window', at, width })

export const WALLS: WallDef[] = [
  // exterior
  { a: [-125, -250], b: [-125, 6400], t: EXT },
  // street facade: red brick; the kitchen bay sticks out and is buff brick, like the bays on the building
  {
    a: [-250, -125],
    b: [6250, -125],
    t: EXT,
    openings: [win(1800, 1000), door(5030, 900, 'start', 1, { glazed: true })], // bedroom 1 window, balcony door
    facade: { side: -1, brick: 'red' },
  },
  {
    a: [6250, -1175],
    b: [11050, -1175],
    t: EXT,
    openings: [win(1417), win(3283)], // two kitchen windows, equal gaps
    facade: { side: -1, brick: 'buff', from: -20, to: 4820 },
  },
  { a: [10925, -1300], b: [10925, 6550], t: EXT, facade: { side: -1, brick: 'buff', to: 1050 } },
  { a: [6250, 6425], b: [11050, 6425], t: EXT },
  { a: [6375, 6300], b: [6375, 10450], t: EXT },
  { a: [2200, 10325], b: [6500, 10325], t: EXT, openings: [door(3245, 900, 'start', -1)] }, // entrance
  { a: [2325, 6150], b: [2325, 10450], t: EXT },
  { a: [-250, 6275], b: [2450, 6275], t: EXT },

  // partitions (doors open into rooms, except bath + storage which open out)
  { a: [6325, -1300], b: [6325, 6300], t: INT, openings: [door(6570, 900, 'end', -1)], facade: { side: 1, brick: 'buff', to: 1050 } }, // hall
  { a: [6400, 1225], b: [10800, 1225], t: INT, openings: [{ kind: 'slide', at: 2200, width: 2800 }] }, // kitchen ↔ hall
  { a: [3175, 0], b: [3175, 6150], t: INT, openings: [door(5270, 900, 'end', 1)] }, // bedroom 1
  { a: [3250, 4375], b: [6250, 4375], t: INT, openings: [door(2200, 900, 'end', -1)] }, // bedroom 2
  { a: [2450, 6250], b: [3800, 6250], t: 200 },
  { a: [3724, 6208], b: [4567, 7051], t: INT, openings: [door(596, 700, 'end', -1, { mirror: true })] }, // storage
  { a: [4525, 6990], b: [4525, 10200], t: INT, openings: [door(1970, 800, 'end', -1)] }, // bath
  { a: [2450, 7925], b: [4450, 7925], t: INT },

  // balcony railing
  { a: [3350, -250], b: [3900, -1250], t: 40, height: 1000, railing: true },
  { a: [3900, -1250], b: [6250, -1250], t: 40, height: 1000, railing: true },
]

// house centre, used to put the model at the world origin
export const CENTER: Vec2 = [5400, 4575]

// wide: an outside / above view that should step back on narrow (portrait) screens
// two kinds of camera presets (plan mm, y = height):
// orbit: fly around the house from outside — from / to; wide = step back on portrait screens
// room: stand in a room (its middle, or `stand`) and look around — look = the point you face first
export type View =
  | { label: string; from: Vec3; to: Vec3; wide?: boolean }
  | { label: string; room: string; look: Vec2; stand?: Vec2 }

export const EYE = 1600
export const LOOK_AT = 1100 // height of the point a room view looks at: slightly down, like a person

export const VIEWS: View[] = [
  { label: 'Overview', from: [13400, 19000, 16500], to: [5400, 0, 4575], wide: true },
  { label: 'Top', from: [5400, 19000, 4585], to: [5400, 0, 4575], wide: true },
  { label: 'Facade', from: [4000, 2400, -11500], to: [5400, 1300, -600], wide: true },
  { label: 'Hall', room: 'Hall', look: [8600, 1300] },
  { label: 'Kitchen', room: 'Kitchen', look: [6400, -900] },
  { label: 'Bedroom', room: 'Bedroom', look: [6000, 600] },
  { label: "Kids' room", room: "Kids' room", look: [1500, 0] },
  { label: 'Corridor', room: 'Corridor', look: [5425, 4450] },
  { label: 'Bath', room: 'Bath', stand: [4150, 8500], look: [3300, 10200] },
  { label: 'Storage', room: 'Storage', stand: [3900, 6800], look: [2450, 7850] },
  { label: 'Balcony', room: 'Balcony', stand: [5000, -450], look: [4300, -1250] },
]

// the floor area you can walk in: the room's bounding box unless set (rect: x0, z0, x1, z1)
export const walkArea = (room: Room): [number, number, number, number] => {
  if (room.walk) return room.walk
  const xs = room.outline.map(([x]) => x)
  const zs = room.outline.map(([, z]) => z)
  return [Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs)]
}
