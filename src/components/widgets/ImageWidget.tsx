import { useState } from "react";
import type { WidgetConfig } from "../../types";
import { actions } from "../../store/appStore";

export function ImageWidget({ config }: { config: WidgetConfig }) {
  const url = typeof config.options.url === "string" ? config.options.url : "";
  const caption = typeof config.options.caption === "string" ? config.options.caption : "";
  const fit = config.options.fit === "contain" ? "contain" : "cover";
  const [broken, setBroken] = useState(false);

  return (
    <>
      {url && !broken ? (
        <img
          src={url}
          alt={caption || "사용자 이미지"}
          onError={() => setBroken(true)}
          style={{
            width: "100%",
            height: 150,
            objectFit: fit,
            borderRadius: "var(--radius)",
            display: "block",
          }}
        />
      ) : (
        <div className="empty">
          {broken ? "이미지를 불러오지 못했습니다. 주소를 확인해 주세요." : "이미지 주소를 입력해 보세요."}
        </div>
      )}
      {caption && <div className="muted">{caption}</div>}
      <input
        value={url}
        placeholder="https://…"
        aria-label="이미지 주소"
        onChange={(e) => { setBroken(false); actions.setWidgetOption(config.id, "url", e.target.value); }}
      />
      <div className="row">
        <input value={caption} placeholder="캡션" aria-label="캡션" onChange={(e) => actions.setWidgetOption(config.id, "caption", e.target.value)} />
        <select value={fit} aria-label="이미지 맞춤" onChange={(e) => actions.setWidgetOption(config.id, "fit", e.target.value)} style={{ maxWidth: 100 }}>
          <option value="cover">cover</option>
          <option value="contain">contain</option>
        </select>
      </div>
    </>
  );
}
