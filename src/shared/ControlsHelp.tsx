import { useTranslation } from "react-i18next";
import type { View } from "../lib/plan";
import { usePlace } from "../i18n";
import type en from "../i18n/en";

// keys: words (drag, scroll …) are translated, literal keys (W S, Esc …) shown as they are
type Word = keyof typeof en.help.keys;
type Row = [keys: (Word | string)[], action: string];

const OUTSIDE: Row[] = [
  [["drag"], "help.orbit"],
  [["scroll", "pinch"], "help.zoom"],
  [["rightDrag", "twoFingers"], "help.pan"],
];

const ROOM: Row[] = [
  [["drag"], "help.look"],
  [["scroll", "W S", "↑ ↓"], "help.walk"],
  [["A D", "← →"], "help.step"],
  [["rightDrag", "twoFingers"], "help.slide"],
];

const KEYS: Row[] = [
  [["V"], "menu.cameraViews"],
  [["U"], "menu.layers"],
  [["F"], "menu.fullscreen"],
  [["`"], "help.collapse"],
  [["Esc"], "help.close"],
];

function Section({ title, rows, className = "" }: { title: string; rows: Row[]; className?: string }) {
  const { t } = useTranslation();
  const word = (k: string) => (k in t("help.keys", { returnObjects: true }) ? t(`help.keys.${k as Word}`) : k);
  return (
    <section className={`help-section ${className}`}>
      <h3 className="help-title">{title}</h3>
      <dl className="help-rows">
        {rows.map(([keys, action]) => (
          <div key={action} className="help-row">
            <dt>
              {keys.map((k) => (
                <kbd key={k}>{word(k)}</kbd>
              ))}
            </dt>
            <dd>{t(action as never)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

// settings panel content: how to move around in the current view + keyboard shortcuts
export default function ControlsHelp({ view }: { view: View }) {
  const { t } = useTranslation();
  const place = usePlace();
  const inRoom = "room" in view;
  return (
    <>
      <Section title={`${t(inRoom ? "help.inRoom" : "help.outside")} · ${place(view.label)}`} rows={inRoom ? ROOM : OUTSIDE} />
      <Section title={t("help.keyboard")} rows={KEYS} className="help-keyboard" />
    </>
  );
}
