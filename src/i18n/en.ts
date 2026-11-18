// english = the source: ru and uz must have the same keys (checked by the type below)
const en = {
  lang: { label: 'Language', name: 'English' },
  menu: {
    toggle: 'Toggle sidebar',
    house: 'House',
    views: 'Views',
    cameraViews: 'Camera views',
    utilitiesToggle: 'Utilities on / off',
    withUtilities: 'With utilities',
    noUtilities: 'No utilities',
    plan: 'Plan',
    settings: 'Settings',
    settingsTitle: 'Settings & controls',
    fullscreen: 'Fullscreen',
  },
  help: {
    outside: 'Outside',
    inRoom: 'In the room',
    keyboard: 'Keyboard',
    keys: { drag: 'Drag', scroll: 'Scroll', pinch: 'Pinch', rightDrag: 'Right-drag', twoFingers: 'Two fingers' },
    orbit: 'Orbit around the house',
    zoom: 'Zoom',
    pan: 'Pan',
    look: 'Look around',
    walk: 'Walk forward / back',
    step: 'Step left / right',
    slide: 'Slide sideways',
    collapse: 'Collapse sidebar',
    close: 'Close this panel',
  },
  // rooms + camera views, keyed by slug(label)
  place: {
    overview: 'Overview',
    top: 'Top',
    facade: 'Facade',
    hall: 'Hall',
    kitchen: 'Kitchen',
    bedroom: 'Bedroom',
    'kids-room': "Kids' room",
    corridor: 'Corridor',
    bath: 'Bath',
    storage: 'Storage',
    balcony: 'Balcony',
  },
  home: { withUtilities: 'with utilities', noUtilities: 'no utilities' },
  plan: {
    updated: 'Updated plan',
    original: 'Original drawing',
    download: 'Download PNG',
    openFull: 'Open full size',
    originalAlt: 'Original floor plan: two bedrooms, hall, kitchen, WC, bath and corridor',
    title: 'Elite — updated plan',
    notes1: "kids' room · coding workspace · sliding glass door",
    notes2: 'storage room · walk-in shower + WC',
    m: 'm',
  },
  error: { title: 'Something went wrong', text: 'Try reloading the page.', reload: 'Reload' },
}

type Shape<T> = { [K in keyof T]: T[K] extends string ? string : Shape<T[K]> }
export type Messages = Shape<typeof en>
export default en
