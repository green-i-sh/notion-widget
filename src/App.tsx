import { useEffect, useState } from "react";
import { Header } from "./components/layout/Header";
import { WidgetGrid } from "./components/layout/WidgetGrid";
import { SettingsPanel } from "./components/settings/SettingsPanel";
import { WIDGETS } from "./components/widgets/registry";
import { useAppState } from "./store/appStore";
import { resolvePalette } from "./store/themes";
import type { WidgetConfig, WidgetType } from "./types";

/** `?w=clock` etc. — used to embed a single widget in a Notion block. */
function standaloneType(): WidgetType | null {
  const w = new URLSearchParams(window.location.search).get("w");
  return w && w in WIDGETS ? (w as WidgetType) : null;
}

export default function App() {
  const { appearance } = useAppState();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const standalone = standaloneType();

  // Theme lives in CSS variables so every widget picks it up for free.
  useEffect(() => {
    const palette = resolvePalette(appearance.theme, appearance.custom);
    const root = document.documentElement.style;
    root.setProperty("--bg", palette.bg);
    root.setProperty("--surface", palette.surface);
    root.setProperty("--text", palette.text);
    root.setProperty("--subtext", palette.subtext);
    root.setProperty("--accent", palette.accent);
    root.setProperty("--border", palette.border);
    root.setProperty("--radius", `${appearance.radius}px`);
    root.setProperty("--gap", `${appearance.gap}px`);
    root.setProperty("--cols", `${appearance.columns}`);
  }, [appearance]);

  if (standalone) {
    const { Component } = WIDGETS[standalone];
    const config: WidgetConfig = {
      id: `standalone-${standalone}`,
      type: standalone,
      visible: true,
      size: "l",
      order: 0,
      options: {},
    };
    return (
      <div className={`station${appearance.compact ? " compact" : ""}`}>
        <div className="widget">
          <div className="widget-body"><Component config={config} /></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`station${appearance.compact ? " compact" : ""}`}>
      <Header onOpenSettings={() => setSettingsOpen(true)} />
      <WidgetGrid />
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
