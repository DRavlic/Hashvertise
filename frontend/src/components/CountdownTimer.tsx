import { useState, useEffect } from "react";
import { formatCountdown } from "../lib/date";
import { COUNTDOWN_REFRESH_INTERVAL_MS } from "../lib/constants";

interface CountdownTimerProps {
  targetDate: string;
  prefix?: string;
  className?: string;
}

export function CountdownTimer({
  targetDate,
  prefix,
  className = "",
}: CountdownTimerProps) {
  const [countdown, setCountdown] = useState<string>("");

  useEffect(() => {
    // Initial update
    const updateCountdown = () => {
      const target = new Date(targetDate);
      setCountdown(formatCountdown(target));
    };
    updateCountdown();

    // Set up interval to update every minute
    const interval = setInterval(
      updateCountdown,
      COUNTDOWN_REFRESH_INTERVAL_MS
    );

    // Clean up interval
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className={`font-medium ${className}`}>
      {prefix && <span>{prefix} </span>}
      <span className="font-mono">{countdown}</span>
    </div>
  );
}
