import { useSyncExternalStore } from 'react'
import { VIEWS, type View } from '../../lib/plan'

// shared by the navbar (controls) and the 3D page (scene)
// the view is also in the url hash so it can be linked: /#hall, /#kids-room ...

export const slug = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, '-')

// what is drawn on top of the bare rooms: furniture, nothing, or the plumbing / electrical routes
export const LAYERS = ['furniture', 'empty', 'plumbing', 'electric'] as const
export type Layer = (typeof LAYERS)[number]

let state = {
  view: VIEWS.find((v) => `#${slug(v.label)}` === location.hash) ?? VIEWS[0],
  layer: 'furniture' as Layer,
}

const listeners = new Set<() => void>()

const set = (next: Partial<typeof state>) => {
  state = { ...state, ...next }
  listeners.forEach((l) => l())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const setView = (view: View) => set({ view })
export const setLayer = (layer: Layer) => set({ layer })
export const nextLayer = () => set({ layer: LAYERS[(LAYERS.indexOf(state.layer) + 1) % LAYERS.length] })

export function useHouse() {
  return useSyncExternalStore(subscribe, () => state)
}
