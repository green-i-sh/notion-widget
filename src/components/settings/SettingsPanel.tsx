import { useEffect, useRef } from "react";
import type { Palette, ThemeName } from "../../types";
import { useAppState, actions } from "../../store/appStore";
import { PALETTE_LABELS, THEME_LABELS, resolvePalette } from "../../store/themes";
import { WidgetToggles } from "./WidgetToggles";
import { DataPanel } from "./DataPanel";

const THEME_NAMES = Object.keys(THEME_LABELS) as ThemeName[];
const PALETTE_KEYS = Object.keys(PALETTE_LABELS) as (keyof Palette)[];

interface Props {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: Props) {
  const { appearance } = useAppState();
  const panel = useRef<HTMLDivElement>(null);
  const palette = resolvePalette(appearance.theme, appearance.custom);

  // Escape closes the panel; focus starts inside it for keyboard users.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    panel.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="panel"
        role="dialog"
        aria-modal="true"
        aria-label="설정"
        tabIndex={-1}
        ref={panel}
      >
        <div className="row">
          <h2>Settings</h2>
          <button
            type="button"
            className="btn ghost"
            style={{ marginLeft: "auto" }}
            onClick={onClose}
            aria-label="설정 닫기"
          >
            ✕
          </button>
        </div>

        <section>
          <h3>Appearance</h3>
          <div className="theme-list">
            {THEME_NAMES.map((name) => (
              <button
                key={name}
                type="button"
                className="theme-chip"
                aria-pressed={appearance.theme === name}
                onClick={() => actions.setAppearance({ theme: name })}
              >
                {THEME_LABELS[name]}
              </button>
            ))}
          </div>

          {PALETTE_KEYS.map((key) => (
            <div className="field" key={key}>
              <label htmlFor={`color-${key}`}>{PALETTE_LABELS[key]}</label>
              <div className="row" style={{ maxWidth: 160 }}>
                <input
                  id={`color-${key}`}
                  type="color"
                  value={palette[key]}
                  onChange={(e) => actions.setCustomColor(key, e.target.value)}
                />
                {appearance.custom[key] && (
                  <button
                    type="button"
                    className="btn tiny"
                    onClick={() => actions.setCustomColor(key, null)}
                  >
                    초기화
                  </button>
                )}
              </div>
            </div>
          ))}

          <div className="field">
            <label htmlFor="radius">Border Radius</label>
            <input
              id="radius"
              type="range"
              min={0}
              max={16}
              value={appearance.radius}
              onChange={(e) => actions.setAppearance({ radius: Number(e.target.value) })}
            />
          </div>
        </section>

        <section>
          <h3>Layout</h3>
          <div className="field">
            <label htmlFor="columns">Columns</label>
            <select
              id="columns"
              value={appearance.columns}
              onChange={(e) => actions.setAppearance({ columns: Number(e.target.value) })}
            >
              {[2, 3, 4].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="gap">Gap</label>
            <input
              id="gap"
              type="range"
              min={6}
              max={28}
              value={appearance.gap}
              onChange={(e) => actions.setAppearance({ gap: Number(e.target.value) })}
            />
          </div>
          <div className="field">
            <label htmlFor="compact">Compact Mode</label>
            <input
              id="compact"
              type="checkbox"
              checked={appearance.compact}
              onChange={() => actions.setAppearance({ compact: !appearance.compact })}
            />
          </div>
        </section>

        <WidgetToggles />
        <DataPanel />
      </div>
    </div>
  );
}
