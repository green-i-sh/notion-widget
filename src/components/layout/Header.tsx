import { WEEKDAYS_EN } from "../../utils/date";
import { useNow } from "../../hooks/useNow";

interface Props {
  onOpenSettings: () => void;
}

export function Header({ onOpenSettings }: Props) {
  const now = useNow(60_000);
  const stamp = `${now.getFullYear()}.${`${now.getMonth() + 1}`.padStart(2, "0")}.${`${now.getDate()}`.padStart(2, "0")}`;

  return (
    <header className="header">
      <div>
        <h1>Widget Station</h1>
        <div className="sub">
          {WEEKDAYS_EN[now.getDay()]} · {stamp}
        </div>
      </div>
      <button type="button" className="btn" onClick={onOpenSettings}>
        Settings
      </button>
    </header>
  );
}
