import React from 'react';

export default function ProphecyDisplay({ prophecy }) {
  if (!prophecy) return null;

  return (
    <div className="prophecy-box">
      <div className="prophecy-box__title">Your Shape Prophecy</div>
      {prophecy.lines.map((line, i) => (
        <p key={i} className="prophecy-box__line">{line}</p>
      ))}
      <div className="prophecy-box__domain">
        Dominant influence: <strong>{prophecy.dominantDomain}</strong>
      </div>
    </div>
  );
}
