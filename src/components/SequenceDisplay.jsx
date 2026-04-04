import React from 'react';

function BeadIcon({ bead }) {
  const classMap = {
    cube: 'bead bead--cube',
    round: 'bead bead--round',
    star: 'bead bead--star',
  };

  return (
    <div
      className={classMap[bead.type]}
      style={{ backgroundColor: bead.hex }}
      title={`${bead.label} (${bead.shorthand})`}
    >
      {bead.shorthand}
    </div>
  );
}

export default function SequenceDisplay({ sequence }) {
  if (!sequence || sequence.length === 0) return null;

  return (
    <div className="sequence-display">
      {sequence.map((bead, i) => (
        <BeadIcon key={i} bead={bead} />
      ))}
    </div>
  );
}
