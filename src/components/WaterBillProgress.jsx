import React, { useState, useEffect } from 'react';

const GOAL_AMOUNT = 17345;
const MOCK_RAISED = 2847.50;

export default function WaterBillProgress({ raised = MOCK_RAISED, goal = GOAL_AMOUNT }) {
  const [displayRaised, setDisplayRaised] = useState(0);
  const percentage = Math.min((raised / goal) * 100, 100);

  useEffect(() => {
    const duration = 1500;
    const start = Date.now();
    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayRaised(raised * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    animate();
  }, [raised]);

  return (
    <div className="water-meter">
      <div className="water-meter__label">
        <span className="sym sym--drop"></span>
        {' '}WATER BILL RECOVERY FUND
      </div>

      <div className="water-meter__pipe">
        <div
          className="water-meter__pipe-fill"
          style={{ height: `${percentage}%` }}
        />
      </div>

      <div className="water-meter__amounts">
        <span className="water-meter__raised">
          ${displayRaised.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span className="water-meter__goal">
          / ${goal.toLocaleString('en-US')}
        </span>
      </div>

      <div className="water-meter__bar">
        <div className="water-meter__bar-fill" style={{ width: `${percentage}%` }} />
      </div>

      <p className="water-meter__note">
        {percentage.toFixed(1)}% toward operational plumbing.
        The water has been off since March.
      </p>
    </div>
  );
}
