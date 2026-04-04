import React, { useState, useEffect } from 'react';

export default function CooldownTimer({ cooldownExpires, onExpired }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!cooldownExpires) return;

    const tick = () => {
      const ms = cooldownExpires - Date.now();
      if (ms <= 0) {
        setRemaining(0);
        onExpired?.();
        return;
      }
      setRemaining(ms);
    };

    tick();
    const interval = setInterval(tick, 100);
    return () => clearInterval(interval);
  }, [cooldownExpires, onExpired]);

  if (remaining <= 0) return null;

  const seconds = Math.ceil(remaining / 1000);

  return (
    <div className="cooldown">
      <div className="cooldown__timer">{seconds}s</div>
      <div className="cooldown__message">
        The shape trees are reconfiguring. Please allow {seconds} second{seconds !== 1 ? 's' : ''} for your next arrangement.
      </div>
      <div className="cooldown__message" style={{ marginTop: 4 }}>
        Your current future remains active.
      </div>
    </div>
  );
}
