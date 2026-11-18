import { WALL_H, type Vec3 } from './plan'

// plumbing + electrical routes, plan mm like everything else: points are [x, y, z], y = height
// the 3D scene draws them as pipes / cables, the 2D plan draws their footprint

// ---------- plumbing ----------
// cold + hot run along the wall faces (hot a little further out, so the two never touch),
// drains lie in the floor screed with a fall to the stack; everything meets at a riser shaft

export type PipeKind = 'cold' | 'hot' | 'drain'
export type Pipe = { kind: PipeKind; r: number; points: Vec3[]; outlet?: boolean } // outlet: ends at a valve / fitting

const riser = (kind: PipeKind, x: number, z: number, r = kind === 'drain' ? 55 : 20): Pipe => ({
  kind,
  r,
  points: [[x, 0, z], [x, WALL_H, z]],
})
const cold = (...points: Vec3[]): Pipe => ({ kind: 'cold', r: 20, points, outlet: true })
const hot = (...points: Vec3[]): Pipe => ({ kind: 'hot', r: 20, points, outlet: true })
const drain = (r: number, ...points: Vec3[]): Pipe => ({ kind: 'drain', r, points })

// riser shafts (stoyak): x, z of the drain stack / cold / hot
export const RISERS = [
  { room: 'Bath', drain: [2600, 10020], cold: [2560, 10175], hot: [2620, 10120] },
  { room: 'Kitchen', drain: [6980, -900], cold: [7060, -1025], hot: [7120, -970] },
] as const

export const PIPES: Pipe[] = [
  ...RISERS.flatMap(({ drain: d, cold: c, hot: h }) => [riser('drain', d[0], d[1]), riser('cold', c[0], c[1]), riser('hot', h[0], h[1])]),

  // ---------- bath: shower mixer on the south wall, wall-hung wc, basin mixer on the west wall ----------
  cold([2560, 420, 10175], [3830, 420, 10175], [3830, 1100, 10175]), // shower
  hot([2620, 340, 10120], [3920, 340, 10120], [3920, 1100, 10120]),
  cold([3050, 420, 10175], [3050, 1000, 10175]), // wc cistern in the wall frame
  hot([2475, 820, 8400], [2475, 820, 8025], [4185, 820, 8025], [4185, 885, 8025]), // heated towel rail: branch off the basin line, along the north wall
  cold([2560, 900, 10175], [2475, 900, 10175], [2475, 900, 8500], [2475, 1040, 8500]), // basin
  hot([2620, 820, 10120], [2475, 820, 10120], [2475, 820, 8400], [2475, 1040, 8400]),
  drain(55, [2900, 230, 10160], [2900, 230, 10020], [2600, 230, 10020]), // wc → stack, 110 mm
  drain(25, [3420, 30, 10150], [3200, 30, 10150], [3200, 30, 10020], [2600, 30, 10020]), // linear shower drain
  drain(25, [2700, 830, 8450], [2700, 550, 8450], [2480, 550, 8450], [2480, 60, 8450], [2480, 60, 10020], [2600, 60, 10020]), // basin

  // ---------- kitchen: sink under window 1, washing machine between the windows ----------
  cold([7060, 420, -1025], [9050, 420, -1025], [9050, 600, -1025]), // to the washer valve
  cold([7620, 420, -1025], [7620, 600, -1025]), // sink
  hot([7120, 340, -970], [7710, 340, -970], [7710, 600, -970]),
  drain(25, [9050, 650, -900], [9050, 250, -900], [6980, 250, -900]), // washer standpipe → stack
  drain(25, [7667, 800, -800], [7667, 250, -800], [7667, 250, -900]), // sink trap
]

// ---------- electrical ----------
// board by the entrance → feeders along the corridor ceiling → one junction box per room by its door;
// from there cables run in the ceiling zone (300 mm below the ceiling) and drop straight down to each point

export type Facing = 'n' | 's' | 'e' | 'w' // the way a wall device faces (into the room)
export type DeviceKind = 'socket' | 'switch' | 'light'
export type Device = { kind: DeviceKind; at: Vec3; face?: Facing }
export type CableKind = 'power' | 'light'
export type Cable = { kind: CableKind; points: Vec3[] }

export const CABLE_Y = WALL_H - 150
const CEIL = WALL_H - 10
const OFF = 15 // cables + boxes sit just proud of the wall face

const NORMAL: Record<Facing, [number, number]> = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] }
const onWall = (x: number, y: number, z: number, f: Facing): Vec3 => [x + NORMAL[f][0] * OFF, y, z + NORMAL[f][1] * OFF]

const socket = (x: number, z: number, face: Facing, y = 300): Device => ({ kind: 'socket', at: [x, y, z], face })
const toggle = (x: number, z: number, face: Facing, y = 900): Device => ({ kind: 'switch', at: [x, y, z], face })
const light = (x: number, z: number): Device => ({ kind: 'light', at: [x, CEIL, z] })

type Circuit = { room: string; box: Vec3; feed: Vec3[]; devices: Device[] }

// distribution board on the corridor wall next to the entrance
export const BOARD = { at: [4600, 1450, 9950] as Vec3, size: [120, 500, 400] as Vec3, face: 'e' as Facing }
const TOP: Vec3 = [4615, CABLE_Y, 9950] // where the feeders leave the board
const TRUNK: Vec3 = [4615, CABLE_Y, 4650] // corridor trunk, then east / west along z 4650

const CIRCUITS: Circuit[] = [
  {
    room: 'Corridor',
    box: TOP,
    feed: [],
    devices: [
      light(5425, 9000),
      light(5425, 6500),
      light(4700, 5300),
      toggle(6060, 10200, 'n'), // by the entrance door, latch side
      socket(6250, 7900, 'w'),
    ],
  },
  {
    room: 'Bath',
    box: onWall(4450, CABLE_Y, 8150, 'w'),
    feed: [TOP, [4615, CABLE_Y, 8150]],
    devices: [
      light(3450, 9100),
      toggle(4600, 7900, 'e'), // outside, in the corridor
      socket(2450, 9050, 'e', 1100), // by the mirror cabinet, splash-proof
    ],
  },
  {
    room: 'Storage',
    box: onWall(4450, CABLE_Y, 7300, 'w'),
    feed: [TOP, [4615, CABLE_Y, 7300]],
    devices: [light(3450, 7100), toggle(4600, 7150, 'e')],
  },
  {
    room: "Kids' room",
    box: onWall(3100, CABLE_Y, 4650, 'w'),
    feed: [TOP, TRUNK],
    devices: [
      light(1550, 3075),
      toggle(3100, 4650, 'w'),
      socket(3100, 850, 'w', 900), // study desk, one per laptop
      socket(3100, 2050, 'w', 900),
      socket(0, 2250, 'e', 650), // by the bunk bed, between it and the bookshelf
      socket(3100, 4300, 'w'),
    ],
  },
  {
    room: 'Bedroom',
    box: onWall(4850, CABLE_Y, 4300, 'n'),
    feed: [TOP, TRUNK, [4850, CABLE_Y, 4650]],
    devices: [
      light(4750, 2150),
      toggle(4850, 4300, 'n'),
      socket(3250, 800, 'e', 650), // both nightstands
      socket(3250, 3600, 'e', 650),
      socket(6250, 1000, 'w', 900), // coding desk: monitor, laptop
      socket(6250, 1450, 'w', 900),
      socket(3700, 4300, 'n'),
    ],
  },
  {
    room: 'Hall',
    box: onWall(6400, CABLE_Y, 4650, 'e'),
    feed: [TOP, TRUNK],
    devices: [
      light(8600, 3800),
      toggle(6400, 4650, 'e'),
      socket(6400, 3900, 'e', 1150), // behind the tv
      socket(6400, 4500, 'e', 500), // media unit
      socket(10800, 1500, 'w'), // both ends of the sofa
      socket(10800, 6200, 'w'),
      socket(8600, 6300, 'n'),
    ],
  },
  {
    room: 'Kitchen',
    box: onWall(6400, CABLE_Y, 1035, 'e'),
    feed: [TOP, TRUNK, [6415, CABLE_Y, 4650]],
    devices: [
      light(8600, 50),
      toggle(9750, 1150, 'n'), // beside the sliding door
      socket(6400, 800, 'e'), // fridge
      socket(6400, -580, 'e', 2250), // hood, inside the cabinet
      socket(6400, 150, 'e', 1100), // worktop
      socket(8600, -1050, 's', 1100),
      socket(10450, -1050, 's', 1100),
      socket(9050, -1050, 's', 500), // washing machine, in the base unit next to it
    ],
  },
]

// cable from a junction box to a device: along the ceiling zone, finishing along the device's own wall, then straight down
const route = (box: Vec3, d: Device): Vec3[] => {
  const end: Vec3 = d.face ? onWall(d.at[0], d.at[1], d.at[2], d.face) : d.at
  const [x, , z] = end
  const along = d.face === 'e' || d.face === 'w' ? 'z' : 'x' // last ceiling leg runs along this axis
  const corner: Vec3 = along === 'z' ? [x, CABLE_Y, box[2]] : [box[0], CABLE_Y, z]
  const pts: Vec3[] = [box, corner, [x, CABLE_Y, z], end]
  return pts.filter((p, i) => i === 0 || p.some((v, k) => v !== pts[i - 1][k]))
}

export const BOXES: Vec3[] = CIRCUITS.map((c) => c.box)
export const DEVICES: Device[] = CIRCUITS.flatMap((c) => c.devices)
export const CABLES: Cable[] = [
  { kind: 'power', points: [[TOP[0], BOARD.at[1] + BOARD.size[1], TOP[2]], TOP] },
  ...CIRCUITS.filter((c) => c.feed.length).map((c): Cable => ({ kind: 'power', points: [...c.feed, c.box] })),
  ...CIRCUITS.flatMap((c) => c.devices.map((d): Cable => ({ kind: d.kind === 'socket' ? 'power' : 'light', points: route(c.box, d) }))),
]

export const SERVICE_COLOR = {
  cold: '#3a7fc1',
  hot: '#cf4a3c',
  drain: '#7d848c',
  power: '#e07b2a',
  light: '#d8b021',
}
