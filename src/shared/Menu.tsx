import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router";
import { FiBox, FiCamera, FiChevronLeft, FiChevronRight, FiLayers, FiMap, FiMaximize, FiMinimize, FiSettings } from "react-icons/fi";
import "../css/menu.css";
import { VIEWS, type View } from "../lib/plan";
import { useShortcuts } from "../hooks/LOCAL/useShortcuts";
import { setView, slug, toggleUtilities, useHouse } from "../hooks/LOCAL/useHouse";
import ControlsHelp from "./ControlsHelp";

const readCollapsed = () => {
  try {
    return localStorage.getItem("menu-collapsed") !== "false";
  } catch {
    return true;
  }
};

type Panel = "views" | "settings" | null;

// fullscreen state, kept in sync when the user leaves with Esc; iPhone Safari has no fullscreen API
const canFullscreen = typeof document !== "undefined" && document.fullscreenEnabled;
function useFullscreen() {
  const [on, setOn] = useState(() => !!document.fullscreenElement);
  useEffect(() => {
    const sync = () => setOn(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  const toggle = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen().catch(() => {});
  };
  return [on, toggle] as const;
}

// sidebar on desktop, floating pill on phones: pages + all 3D controls
export default function Menu() {
  const { view, utilities } = useHouse();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [panel, setPanel] = useState<Panel>(null);
  const [fullscreen, toggleFullscreen] = useFullscreen();
  const togglePanel = (p: Panel) => setPanel((open) => (open === p ? null : p));

  const toggleMenu = () => {
    setCollapsed((value) => {
      try {
        localStorage.setItem("menu-collapsed", String(!value));
      } catch {}
      return !value;
    });
  };

  const pickView = (v: View) => {
    setView(v);
    setPanel(null);
    navigate({ pathname: "/", hash: slug(v.label) }, { replace: pathname === "/" });
  };

  useShortcuts({
    "`": toggleMenu,
    v: () => togglePanel("views"),
    u: toggleUtilities,
    ...(canFullscreen && { f: toggleFullscreen }),
    escape: () => setPanel(null),
  });

  return (
    <>
      <nav className={`menu ${collapsed ? "menu-collapsed" : ""}`}>
        <button
          type="button"
          className="menu-toggle"
          onClick={toggleMenu}
          aria-label="Toggle sidebar (`)"
          title="Toggle sidebar (`)"
        >
          {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </button>

        {/* NavLink adds .active on the current page; `end` so "/" isn't active everywhere */}
        <NavLink to="/" end className="menu-item" title="House">
          <span className="menu-icon"><FiBox /></span>
          <span className="menu-label">House</span>
        </NavLink>

        <button
          type="button"
          className={`menu-item ${panel === "views" ? "active" : ""}`}
          onClick={() => togglePanel("views")}
          aria-expanded={panel === "views"}
          title="Views (V)"
        >
          <span className="menu-icon"><FiCamera /></span>
          <span className="menu-label">Views</span>
        </button>

        <button
          type="button"
          className={`menu-item menu-switch ${utilities ? "is-on" : ""}`}
          onClick={toggleUtilities}
          aria-pressed={utilities}
          title="Utilities on / off (U)"
        >
          <span className="menu-icon"><FiLayers /></span>
          <span className="menu-label">{utilities ? "With utilities" : "No utilities"}</span>
        </button>

        <NavLink to="/plan" className="menu-item" title="Plan">
          <span className="menu-icon"><FiMap /></span>
          <span className="menu-label">Plan</span>
        </NavLink>

        <button
          type="button"
          className={`menu-item menu-bottom ${panel === "settings" ? "active" : ""}`}
          onClick={() => togglePanel("settings")}
          aria-expanded={panel === "settings"}
          title="Settings & controls"
        >
          <span className="menu-icon"><FiSettings /></span>
          <span className="menu-label">Settings</span>
        </button>
      </nav>

      {panel && <div className="menu-backdrop" onClick={() => setPanel(null)} />}

      {panel === "settings" && (
        <div className="menu-flyout menu-settings" role="dialog" aria-label="Settings and controls">
          {canFullscreen && (
            <button
              type="button"
              role="switch"
              aria-checked={fullscreen}
              className="settings-switch"
              onClick={toggleFullscreen}
              title="Fullscreen (F)"
            >
              <span className="menu-icon">{fullscreen ? <FiMinimize /> : <FiMaximize />}</span>
              <span>Fullscreen</span>
              <span className="settings-knob" />
            </button>
          )}
          <ControlsHelp view={view} />
        </div>
      )}

      {panel === "views" && (
        <>
          <div className="menu-flyout menu-views" role="menu" aria-label="Camera views">
            {VIEWS.map((v) => (
              <button
                key={v.label}
                type="button"
                role="menuitemradio"
                aria-checked={v === view}
                className="menu-view"
                onClick={() => pickView(v)}
              >
                {v.label}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}
