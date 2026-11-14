import type { View } from "../lib/plan";

type Row = [keys: string, action: string];

const OUTSIDE: Row[] = [
  ["Drag", "Orbit around the house"],
  ["Scroll · Pinch", "Zoom"],
  ["Right-drag · Two fingers", "Pan"],
];

const ROOM: Row[] = [
  ["Drag", "Look around"],
  ["Scroll · W S · ↑ ↓", "Walk forward / back"],
  ["A D · ← →", "Step left / right"],
  ["Right-drag · Two fingers", "Slide sideways"],
];

const KEYS: Row[] = [
  ["V", "Camera views"],
  ["U", "Utilities on / off"],
  ["F", "Fullscreen"],
  ["`", "Collapse sidebar"],
  ["Esc", "Close this panel"],
];

function Section({ title, rows, className = "" }: { title: string; rows: Row[]; className?: string }) {
  return (
    <section className={`help-section ${className}`}>
      <h3 className="help-title">{title}</h3>
      <dl className="help-rows">
        {rows.map(([keys, action]) => (
          <div key={keys} className="help-row">
            <dt>
              {keys.split(" · ").map((k) => (
                <kbd key={k}>{k}</kbd>
              ))}
            </dt>
            <dd>{action}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

// settings panel content: how to move around in the current view + keyboard shortcuts
export default function ControlsHelp({ view }: { view: View }) {
  const inRoom = "room" in view;
  return (
    <>
      <Section title={inRoom ? `In the room · ${view.label}` : `Outside · ${view.label}`} rows={inRoom ? ROOM : OUTSIDE} />
      <Section title="Keyboard" rows={KEYS} className="help-keyboard" />
    </>
  );
}
