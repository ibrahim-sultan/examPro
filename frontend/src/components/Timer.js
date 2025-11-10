import React, { useEffect, useMemo, useState } from 'react';

const Timer = ({ startTime, durationMinutes, onTimeUp }) => {
  const endAt = useMemo(() => new Date(new Date(startTime).getTime() + durationMinutes * 60000), [startTime, durationMinutes]);
  const [remaining, setRemaining] = useState(() => endAt - Date.now());

  useEffect(() => {
    const id = setInterval(() => setRemaining(endAt - Date.now()), 1000);
    return () => clearInterval(id);
  }, [endAt]);

  useEffect(() => {
    if (remaining <= 0) onTimeUp?.();
  }, [remaining, onTimeUp]);

  if (remaining <= 0) return <span>00:00</span>;
  const total = Math.max(0, Math.floor(remaining / 1000));
  const mm = String(Math.floor(total / 60)).padStart(2, '0');
  const ss = String(total % 60).padStart(2, '0');
  return <span>{mm}:{ss}</span>;
};

export default Timer;
