import { useAppState, actions } from "../../store/appStore";
import { WIDGETS } from "../widgets/registry";

export function WidgetToggles() {
  const { widgets } = useAppState();
  const ordered = [...widgets].sort((a, b) => a.order - b.order);

  return (
    <section>
      <h3>Widgets</h3>
      {ordered.map((w) => (
        <div className="field" key={w.id}>
          <label htmlFor={`toggle-${w.id}`}>{WIDGETS[w.type]?.title ?? w.type}</label>
          <input
            id={`toggle-${w.id}`}
            type="checkbox"
            checked={w.visible}
            onChange={() => actions.updateWidget(w.id, { visible: !w.visible })}
          />
        </div>
      ))}
    </section>
  );
}
