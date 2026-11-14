import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router";
import { FiBox, FiCamera, FiChevronLeft, FiChevronRight, FiLayers, FiMap } from "react-icons/fi";
import "../css/menu.css";
import { VIEWS, type View } from "../lib/plan";
import { useShortcuts } from "../hooks/LOCAL/useShortcuts";
import { setView, slug, toggleUtilities, useHouse } from "../hooks/LOCAL/useHouse";

const readCollapsed = () => {
  try {
    return localStorage.getItem("menu-collapsed") !== "false";
  } catch {
    return true;
  }
};

// sidebar on desktop, floating pill on phones: pages + all 3D controls
export default function Menu() {
  const { view, utilities } = useHouse();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [viewsOpen, setViewsOpen] = useState(false);

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
    setViewsOpen(false);
    navigate({ pathname: "/", hash: slug(v.label) }, { replace: pathname === "/" });
  };

  useShortcuts({
    "`": toggleMenu,
    v: () => setViewsOpen((open) => !open),
    u: toggleUtilities,
    escape: () => setViewsOpen(false),
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
          className={`menu-item ${viewsOpen ? "active" : ""}`}
          onClick={() => setViewsOpen((open) => !open)}
          aria-expanded={viewsOpen}
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
      </nav>

      {viewsOpen && (
        <>
          <div className="menu-backdrop" onClick={() => setViewsOpen(false)} />
          <div className="menu-views" role="menu" aria-label="Camera views">
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
