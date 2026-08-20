import { useRef, useState } from "react";
import { exportState, importState, actions } from "../../store/appStore";

export function DataPanel() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const download = () => {
    const blob = new Blob([exportState()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `widget-station-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const upload = async (file: File) => {
    setError(null);
    setMessage(null);
    try {
      const problem = importState(await file.text());
      if (problem) setError(problem);
      else setMessage("복원했습니다.");
    } catch {
      setError("파일을 읽지 못했습니다.");
    }
  };

  return (
    <section>
      <h3>Data</h3>
      <div className="row">
        <button type="button" className="btn" onClick={download}>Export</button>
        <button type="button" className="btn" onClick={() => fileInput.current?.click()}>Import</button>
        <button
          type="button"
          className="btn"
          onClick={() => {
            if (window.confirm("모든 설정과 기록을 지웁니다. 계속할까요?")) {
              actions.reset();
              setMessage("초기화했습니다.");
            }
          }}
        >Reset</button>
      </div>
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        hidden
        aria-label="백업 파일 선택"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
          e.target.value = "";
        }}
      />
      {message && <div className="muted">{message}</div>}
      {error && <div className="error">{error}</div>}
    </section>
  );
}
