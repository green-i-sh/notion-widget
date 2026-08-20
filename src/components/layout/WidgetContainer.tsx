import type { ReactNode } from "react";
import type { WidgetConfig, WidgetSize } from "../../types";
import { actions } from "../../store/appStore";

const NEXT_SIZE: Record<WidgetSize, WidgetSize> = { s: "m", m: "l", l: "s" };

interface Props {
  config: WidgetConfig;
  title: string;
  children: ReactNode;
  dragging: boolean;
  dropTarget: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: () => void;
  onDrop: () => void;
}

/** Shared frame: header, actions, body. Widgets only render their body. */
export function WidgetContainer({
  config,
  title,
  children,
  dragging,
  dropTarget,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: Props) {
  const className = [
    "widget",
    `span-${config.size}`,
    dragging ? "dragging" : "",
    dropTarget ? "drop-target" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section
      className={className}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver();
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
      aria-label={title}
    >
      <header className="widget-head">
        <span className="widget-title">{title}</span>
        <div className="widget-actions">
          <button
            type="button"
            className="btn ghost"
            title="크기 변경"
            aria-label={`${title} 크기 변경`}
            onClick={() => actions.updateWidget(config.id, { size: NEXT_SIZE[config.size] })}
          >
            {config.size.toUpperCase()}
          </button>
          <button
            type="button"
            className="btn ghost"
            title="숨기기"
            aria-label={`${title} 숨기기`}
            onClick={() => actions.updateWidget(config.id, { visible: false })}
          >
            ✕
          </button>
        </div>
      </header>
      <div className="widget-body">{children}</div>
    </section>
  );
}
