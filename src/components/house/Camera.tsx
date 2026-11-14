import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { CameraControls, CameraControlsImpl } from '@react-three/drei'
import { Box3, PerspectiveCamera, Vector3 } from 'three'
import { CENTER, EYE, LOOK_AT, ROOMS, walkArea, type Vec3, type View } from '../../lib/plan'
import { useShortcuts } from '../../hooks/LOCAL/useShortcuts'

const { ACTION } = CameraControlsImpl
const LOOK = 0.01 // room mode: target sits 1 cm in front of the eye, so dragging turns the head
const WALL_GAP = 450 // room mode: closest the eye gets to a wall, mm
const STEP = 0.4 // metres per key press
const FOV = { orbit: 40, room: 70, small: 85 } // wider lenses inside rooms, widest in tiny ones

// plan mm → world metres, house centred on the origin
const toWorld = ([x, y, z]: Vec3) => new Vector3((x - CENTER[0]) / 1000, y / 1000, (z - CENTER[1]) / 1000)

// orbit views: fly around the house; room views: stand inside a room, look around and walk
export default function Camera({ view }: { view: View }) {
  const controls = useRef<CameraControls>(null)
  const animate = useRef(false) // first view snaps, later ones glide
  const get = useThree((s) => s.get)
  const room = 'room' in view

  useEffect(() => {
    const c = controls.current
    if (!c) return

    let from: Vector3
    let to: Vector3
    let fov = FOV.orbit

    if ('room' in view) {
      const r = ROOMS.find((x) => x.name === view.room)!
      const [x0, z0, x1, z1] = walkArea(r)
      fov = Math.min(x1 - x0, z1 - z0) < 2500 ? FOV.small : FOV.room
      const [sx, sz] = view.stand ?? [(x0 + x1) / 2, (z0 + z1) / 2]
      const centre: Vec3 = [sx, EYE, sz]
      from = toWorld(centre)
      to = from.clone().add(toWorld([view.look[0], LOOK_AT, view.look[1]]).sub(from).setLength(LOOK))

      c.minDistance = c.maxDistance = LOOK
      c.minPolarAngle = 0.25
      c.maxPolarAngle = Math.PI - 0.25
      c.azimuthRotateSpeed = c.polarRotateSpeed = -0.35 // drag moves the view like turning your head
      c.verticalDragToForward = true // right-drag / two fingers walk on the floor
      c.dollyToCursor = false
      c.mouseButtons.wheel = ACTION.NONE // the wheel walks instead (see below)
      c.mouseButtons.right = ACTION.TRUCK
      c.touches.two = ACTION.TOUCH_TRUCK
      c.boundaryEnclosesCamera = true
      c.setBoundary(
        new Box3(
          toWorld([Math.min(x0 + WALL_GAP, centre[0]), EYE - 300, Math.min(z0 + WALL_GAP, centre[2])]),
          toWorld([Math.max(x1 - WALL_GAP, centre[0]), EYE + 300, Math.max(z1 - WALL_GAP, centre[2])]),
        ),
      )
    } else {
      // wide views were framed for a landscape screen: step back on portrait ones
      const { width, height } = get().size
      const k = view.wide ? Math.max(1, 1.3 / (width / height)) : 1
      to = toWorld(view.to)
      from = toWorld(view.from).sub(to).multiplyScalar(k).add(to)

      c.setBoundary()
      c.minDistance = 0.3
      c.maxDistance = 40
      c.minPolarAngle = 0
      c.maxPolarAngle = Math.PI / 2 - 0.02
      c.azimuthRotateSpeed = c.polarRotateSpeed = 1
      c.verticalDragToForward = false
      c.dollyToCursor = true
      c.mouseButtons.wheel = ACTION.DOLLY
      c.mouseButtons.right = ACTION.TRUCK
      c.touches.two = ACTION.TOUCH_DOLLY_TRUCK
    }

    const camera = get().camera as PerspectiveCamera
    camera.fov = fov
    camera.updateProjectionMatrix()

    c.setLookAt(from.x, from.y, from.z, to.x, to.y, to.z, animate.current)
    animate.current = true
  }, [view, get])

  // room mode: scroll walks forward / back
  useEffect(() => {
    if (!room) return
    const el = get().gl.domElement
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      controls.current?.forward(-e.deltaY * 0.003, true)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [room, get])

  // room mode: W A S D / arrow keys
  const walk = (forward: number, side: number) => () => {
    if (forward) controls.current?.forward(forward, true)
    if (side) controls.current?.truck(side, 0, true)
  }
  useShortcuts(
    room
      ? {
          w: walk(STEP, 0), arrowup: walk(STEP, 0),
          s: walk(-STEP, 0), arrowdown: walk(-STEP, 0),
          a: walk(0, -STEP), arrowleft: walk(0, -STEP),
          d: walk(0, STEP), arrowright: walk(0, STEP),
        }
      : {},
  )

  return <CameraControls ref={controls} makeDefault smoothTime={0.4} />
}
