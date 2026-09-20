import { useState, useEffect } from "react";

export function TaskbarClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 10_000);
    return () => clearInterval(id);
  }, []);

  const time = now.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  const date = now.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <span className="text-[13px] font-medium text-white/90 tabular-nums select-none whitespace-nowrap">
      {date} {time}
    </span>
  );
}
