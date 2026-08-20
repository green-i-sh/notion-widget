import type { Palette, ThemeName } from "../types";

/**
 * Six palettes. "default" is tuned to sit inside the My Life Planner page
 * without looking like an embedded third-party site.
 */
export const THEMES: Record<ThemeName, Palette> = {
  default: {
    bg: "#ffffff",
    surface: "#ffffff",
    text: "#1f2024",
    subtext: "#8b8e97",
    accent: "#5b62a8",
    border: "#e8e8ec",
  },
  paper: {
    bg: "#fbfaf7",
    surface: "#ffffff",
    text: "#26251f",
    subtext: "#8d8a7e",
    accent: "#6f6a58",
    border: "#e7e4da",
  },
  lavender: {
    bg: "#f7f7fc",
    surface: "#ffffff",
    text: "#25242e",
    subtext: "#8b88a0",
    accent: "#6f6bb0",
    border: "#e6e5f1",
  },
  sage: {
    bg: "#f6f9f6",
    surface: "#ffffff",
    text: "#1f2621",
    subtext: "#828e85",
    accent: "#4f7a5f",
    border: "#e0e8e1",
  },
  warm: {
    bg: "#fdfaf4",
    surface: "#ffffff",
    text: "#2a2520",
    subtext: "#948b7c",
    accent: "#9a7647",
    border: "#ece4d6",
  },
  dark: {
    bg: "#1b1c20",
    surface: "#232429",
    text: "#eceded",
    subtext: "#8f9199",
    accent: "#a5a9e0",
    border: "#33353c",
  },
};

export const THEME_LABELS: Record<ThemeName, string> = {
  default: "Default",
  paper: "Paper",
  lavender: "Lavender",
  sage: "Sage",
  warm: "Warm",
  dark: "Dark",
};

export const PALETTE_LABELS: Record<keyof Palette, string> = {
  bg: "Background",
  surface: "Surface",
  text: "Text",
  subtext: "Secondary Text",
  accent: "Accent",
  border: "Border",
};

export function resolvePalette(
  theme: ThemeName,
  custom: Partial<Palette>
): Palette {
  return { ...THEMES[theme], ...custom };
}
