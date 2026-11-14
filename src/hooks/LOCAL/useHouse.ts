import { useSyncExternalStore } from 'react'
import { VIEWS, type View } from '../../lib/plan'

// shared by the navbar (controls) and the 3D page (scene)
// the view is also in the url hash so it can be linked: /#hall, /#kids-room ...

export const slug = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, '-')

let state = {
  view: VIEWS.find((v) => `#${slug(v.label)}` === location.hash) ?? VIEWS[0],
  utilities: true,
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
export const toggleUtilities = () => set({ utilities: !state.utilities })

export function useHouse() {
  return useSyncExternalStore(subscribe, () => state)
}
