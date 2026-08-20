import { useState } from "react";
import { useAppState, actions } from "../../store/appStore";
import { WIDGETS } from "../widgets/registry";
import { WidgetContainer } from "./WidgetContainer";

export function WidgetGrid() {
  const { widgets } = useAppState();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const visible = widgets
    .filter((w) => w.visible)
    .sort((a, b) => a.order - b.order);

  if (!visible.length) {
    return <p className="empty">Settings에서 위젯을 켜면 여기에 나타납니다.</p>;
  }

  return (
    <div className="grid">
      {visible.map((config) => {
        const entry = WIDGETS[config.type];
        if (!entry) return null;
        const { title, Component } = entry;
        return (
          <WidgetContainer
            key={config.id}
            config={config}
            title={title}
            dragging={dragId === config.id}
            dropTarget={overId === config.id && dragId !== config.id}
            onDragStart={() => setDragId(config.id)}
            onDragEnd={() => { setDragId(null); setOverId(null); }}
            onDragOver={() => setOverId(config.id)}
            onDrop={() => {
              if (dragId) actions.moveWidget(dragId, config.id);
              setDragId(null);
              setOverId(null);
            }}
          >
            <Component config={config} />
          </WidgetContainer>
        );
      })}
    </div>
  );
}
