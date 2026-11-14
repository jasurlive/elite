import { Shape, Vector2 } from 'three'
import type { Vec2 } from '../../lib/plan'

// plan outline → flat Shape
// floor: drawn in (x, -z), rotated −90° about x it lies face up
// ceiling: drawn in (x, z), rotated +90° about x it lies face down
export const toShape = (outline: Vec2[], ceiling = false) =>
  new Shape(outline.map(([x, z]) => new Vector2(x, ceiling ? z : -z)))
