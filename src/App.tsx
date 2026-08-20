import { useEffect, useState } from "react";
import { Header } from "./components/layout/Header";
import { WidgetGrid } from "./components/layout/WidgetGrid";
import { SettingsPanel } from "./components/settings/SettingsPanel";
import { useAppState } from "./store/appStore";
import { resolvePalette } from "./store/themes";

export default function App() {
  const { appearance } = useAppState();
  const [settingsOpen, setSettingsOpen] = useState(false);

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

  return (
    <div className={`station${appearance.compact ? " compact" : ""}`}>
      <Header onOpenSettings={() => setSettingsOpen(true)} />
      <WidgetGrid />
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
