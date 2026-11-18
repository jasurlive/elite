import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router";
import { FiBox, FiCamera, FiChevronLeft, FiChevronRight, FiLayers, FiMap, FiMaximize, FiMinimize, FiSettings } from "react-icons/fi";
import "../css/menu.css";
import { VIEWS, type View } from "../lib/plan";
import { useShortcuts } from "../hooks/LOCAL/useShortcuts";
import { setView, slug, toggleUtilities, useHouse } from "../hooks/LOCAL/useHouse";
import ControlsHelp from "./ControlsHelp";
import { useTranslation } from "react-i18next";
import i18n, { LANGUAGES, currentLang, usePlace } from "../i18n";

const readCollapsed = () => {
  try {
    return localStorage.getItem("menu-collapsed") !== "false";
  } catch {
    return true;
  }
};

type Panel = "views" | "lang" | "settings" | null;

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
  const { t } = useTranslation();
  const place = usePlace();
  const lang = LANGUAGES.find((l) => l.code === currentLang()) ?? LANGUAGES[0];
  const pickLang = (code: string) => {
    void i18n.changeLanguage(code); // the detector saves it to localStorage
    setPanel(null);
  };

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
          aria-label={`${t("menu.toggle")} (\`)`}
          title={`${t("menu.toggle")} (\`)`}
        >
          {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </button>

        {/* NavLink adds .active on the current page; `end` so "/" isn't active everywhere */}
        <NavLink to="/" end className="menu-item" title={t("menu.house")}>
          <span className="menu-icon"><FiBox /></span>
          <span className="menu-label">{t("menu.house")}</span>
        </NavLink>

        <button
          type="button"
          className={`menu-item ${panel === "views" ? "active" : ""}`}
          onClick={() => togglePanel("views")}
          aria-expanded={panel === "views"}
          title={`${t("menu.views")} (V)`}
        >
          <span className="menu-icon"><FiCamera /></span>
          <span className="menu-label">{t("menu.views")}</span>
        </button>

        <button
          type="button"
          className={`menu-item menu-switch ${utilities ? "is-on" : ""}`}
          onClick={toggleUtilities}
          aria-pressed={utilities}
          title={`${t("menu.utilitiesToggle")} (U)`}
        >
          <span className="menu-icon"><FiLayers /></span>
          <span className="menu-label">{t(utilities ? "menu.withUtilities" : "menu.noUtilities")}</span>
        </button>

        <NavLink to="/plan" className="menu-item" title={t("menu.plan")}>
          <span className="menu-icon"><FiMap /></span>
          <span className="menu-label">{t("menu.plan")}</span>
        </NavLink>

        <button
          type="button"
          className={`menu-item menu-bottom ${panel === "lang" ? "active" : ""}`}
          onClick={() => togglePanel("lang")}
          aria-expanded={panel === "lang"}
          title={t("lang.label")}
        >
          <span className="menu-icon"><lang.flag className="menu-flag" /></span>
          <span className="menu-label">{t("lang.name")}</span>
        </button>

        <button
          type="button"
          className={`menu-item menu-bottom ${panel === "settings" ? "active" : ""}`}
          onClick={() => togglePanel("settings")}
          aria-expanded={panel === "settings"}
          title={t("menu.settingsTitle")}
        >
          <span className="menu-icon"><FiSettings /></span>
          <span className="menu-label">{t("menu.settings")}</span>
        </button>
      </nav>

      {panel && <div className="menu-backdrop" onClick={() => setPanel(null)} />}

      {panel === "settings" && (
        <div className="menu-flyout menu-settings" role="dialog" aria-label={t("menu.settingsTitle")}>
          {canFullscreen && (
            <button
              type="button"
              role="switch"
              aria-checked={fullscreen}
              className="settings-switch"
              onClick={toggleFullscreen}
              title={`${t("menu.fullscreen")} (F)`}
            >
              <span className="menu-icon">{fullscreen ? <FiMinimize /> : <FiMaximize />}</span>
              <span>{t("menu.fullscreen")}</span>
              <span className="settings-knob" />
            </button>
          )}
          <ControlsHelp view={view} />
        </div>
      )}

      {panel === "lang" && (
        <div className="menu-flyout menu-langs" role="menu" aria-label={t("lang.label")}>
          {LANGUAGES.map(({ code, flag: Flag }) => (
            <button
              key={code}
              type="button"
              role="menuitemradio"
              aria-checked={code === lang.code}
              className="menu-view menu-lang"
              lang={code}
              onClick={() => pickLang(code)}
            >
              <Flag className="menu-flag" />
              {t("lang.name", { lng: code })}
            </button>
          ))}
        </div>
      )}

      {panel === "views" && (
        <>
          <div className="menu-flyout menu-views" role="menu" aria-label={t("menu.cameraViews")}>
            {VIEWS.map((v) => (
              <button
                key={v.label}
                type="button"
                role="menuitemradio"
                aria-checked={v === view}
                className="menu-view"
                onClick={() => pickView(v)}
              >
                {place(v.label)}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}
