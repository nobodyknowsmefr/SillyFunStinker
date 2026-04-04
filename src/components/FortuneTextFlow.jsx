import React, { useMemo } from 'react';

// Seeded pseudo-random for deterministic per-word wackiness
function seededRand(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const COLORS = ['#D63230', '#F5B700', '#1B4DE4', '#2D936C', '#1A1918'];

/**
 * Renders fortune text with wild, disproportionate, morphing word styling.
 * Each word gets randomized rotation, scale, skew — hand-drawn bezier energy.
 */
export default function FortuneTextFlow({ lines, beadScreenPositionsRef, visible }) {
  // Build per-word style seeds once when lines change
  const wordData = useMemo(() => {
    if (!lines) return [];
    const allText = lines.join(' ');
    const words = allText.split(/\s+/).filter(Boolean);
    const rand = seededRand(allText.length * 7 + 31);

    return words.map((word, i) => {
      const r = rand;
      const rotation = (r() - 0.5) * 14;          // -7° to +7°
      const scaleX = 0.85 + r() * 0.35;            // 0.85 to 1.2
      const scaleY = 0.8 + r() * 0.5;              // 0.8 to 1.3 — disproportionate height
      const skewX = (r() - 0.5) * 8;               // -4° to +4°
      const translateY = (r() - 0.5) * 12;          // -6px to +6px
      const color = COLORS[i % COLORS.length];
      const fontSize = 18 + Math.floor(r() * 14);   // 18px to 32px — size variation
      const animDuration = 2.5 + r() * 3;           // 2.5s to 5.5s
      const animDelay = r() * -3;                    // stagger
      const enterDelay = i * 0.04;                   // cascade entrance

      return {
        word,
        rotation,
        scaleX,
        scaleY,
        skewX,
        translateY,
        color,
        fontSize,
        animDuration,
        animDelay,
        enterDelay,
      };
    });
  }, [lines]);

  if (!visible || !wordData.length) return null;

  return (
    <div className="fortune-flow">
      <div className="fortune-flow__words">
        {wordData.map((wd, i) => (
          <span
            key={i}
            className="fortune-word"
            style={{
              '--rot': `${wd.rotation}deg`,
              '--sx': wd.scaleX,
              '--sy': wd.scaleY,
              '--skx': `${wd.skewX}deg`,
              '--ty': `${wd.translateY}px`,
              '--dur': `${wd.animDuration}s`,
              '--del': `${wd.animDelay}s`,
              color: wd.color,
              fontSize: `${wd.fontSize}px`,
              animationDelay: `${wd.enterDelay}s`,
            }}
          >
            {wd.word}
          </span>
        ))}
      </div>
    </div>
  );
}
