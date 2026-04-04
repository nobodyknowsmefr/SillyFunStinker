import React, { useState, useCallback, useRef, lazy, Suspense } from 'react';
import FortuneTextFlow from './components/FortuneTextFlow';
import ErrorBoundary from './components/ErrorBoundary';
import { generateValidSequence } from './logic/sequenceGenerator';
import { generateProphecy } from './logic/prophecyGenerator';
import { useShopifyFill } from './hooks/useShopifyFill';
import html2canvas from 'html2canvas';

const ShapeTreeScene = lazy(() => import('./components/ShapeTreeScene'));

const WACKY_COLORS = ['#D63230', '#F5B700', '#1B4DE4', '#2D936C'];

function WackyText({ text }) {
  let letterIdx = 0;
  return text.split('').map((ch, i) => {
    if (ch === ' ') return <span key={i} className="morph-space">&nbsp;</span>;
    const colorIdx = letterIdx % 4;
    letterIdx++;
    return (
      <span
        key={i}
        className="morph-letter"
        style={{
          color: WACKY_COLORS[colorIdx],
          animationDelay: `${i * 0.1}s`,
        }}
      >
        {ch}
      </span>
    );
  });
}

export default function App() {
  const [sequence, setSequence] = useState(null);
  const [prophecy, setProphecy] = useState(null);
  const [shorthandCode, setShorthandCode] = useState('');
  const [seed, setSeed] = useState('');
  const [phase, setPhase] = useState('shower'); // 'shower' | 'forming' | 'formed'
  const [busy, setBusy] = useState(false);
  const exportRef = useRef(null);
  const beadScreenPositionsRef = useRef([]);

  // Shopify purchase progress — swap mode to 'live' + set apiUrl for production
  const { fillLevel, total, goal } = useShopifyFill({ mode: 'demo', goal: 50000 });

  const handleReveal = useCallback(() => {
    if (busy) return;
    setBusy(true);

    const result = generateValidSequence();
    const newProphecy = generateProphecy(result.sequence, result.seed);

    setSequence(result.sequence);
    setProphecy(newProphecy);
    setShorthandCode(result.shorthandCode);
    setSeed(result.seed);

    setPhase('forming');
    setTimeout(() => {
      setPhase('formed');
      setBusy(false);
    }, 2800);
  }, [busy]);

  const handleNewFortune = useCallback(() => {
    if (busy) return;
    setBusy(true);
    setPhase('shower');
    setSequence(null);
    setProphecy(null);
    setTimeout(() => {
      const result = generateValidSequence();
      const newProphecy = generateProphecy(result.sequence, result.seed);
      setSequence(result.sequence);
      setProphecy(newProphecy);
      setShorthandCode(result.shorthandCode);
      setSeed(result.seed);
      setPhase('forming');
      setTimeout(() => {
        setPhase('formed');
        setBusy(false);
      }, 2800);
    }, 1200);
  }, [busy]);

  const handleBack = useCallback(() => {
    setBusy(false);
    setPhase('shower');
    setSequence(null);
    setProphecy(null);
  }, []);

  const handleSaveImage = useCallback(async () => {
    if (!exportRef.current) return;
    try {
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: '#FAF8F5',
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = `shape-fortune-${seed?.slice(0, 12) || 'card'}.png`;
      // Export with warm cream background matching the new palette
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Export failed:', e);
    }
  }, [seed]);

  const showResults = phase === 'formed' && prophecy;

  return (
    <div className="app">
      {/* Fullscreen 3D Scene */}
      <div className="scene-fullscreen">
        <Suspense fallback={
          <div className="scene-loading">
            <span>Loading...</span>
          </div>
        }>
          <ErrorBoundary fallback={
            <div className="scene-loading">
              <span>[ 3D unavailable ]</span>
            </div>
          }>
            <ShapeTreeScene sequence={sequence} phase={phase} fillLevel={fillLevel} beadScreenPositionsRef={beadScreenPositionsRef} />
          </ErrorBoundary>
        </Suspense>
      </div>

      {/* Floating UI Overlay */}
      <div className="overlay">

        {/* Logo — top center, fades out when fortune is revealed */}
        <div className={`header-logo ${phase !== 'shower' ? 'header-logo--hidden' : ''}`}>
          <img src="/thelogo.png" alt="The Shape Store" className="header-logo__img" />
          <img src="/ykarelogo.png" alt="YKARE" className="header-logo__sub" />
        </div>


        {/* Back button — visible when not on home */}
        {phase !== 'shower' && (
          <button className="back-btn" onClick={handleBack}>
            <WackyText text="← BACK" />
          </button>
        )}

        {/* Center action — reveal button (only in shower phase) */}
        {phase === 'shower' && (
          <div className="center-action">
            <button
              className="reveal-btn"
              onClick={handleReveal}
              disabled={busy}
            >
              {'REVEAL YOUR FORTUNE'.split('').map((ch, i) => {
                const colors = ['#D63230', '#F5B700', '#1B4DE4', '#2D936C'];
                if (ch === ' ') return <span key={i} className="morph-space">&nbsp;</span>;
                const colorIdx = (() => {
                  let letterCount = 0;
                  for (let j = 0; j < i; j++) {
                    if ('REVEAL YOUR FORTUNE'[j] !== ' ') letterCount++;
                  }
                  return letterCount % 4;
                })();
                return (
                  <span
                    key={i}
                    className="morph-letter"
                    style={{
                      color: colors[colorIdx],
                      animationDelay: `${i * 0.12}s`,
                    }}
                  >
                    {ch}
                  </span>
                );
              })}
            </button>
          </div>
        )}

        {/* Forming indicator */}
        {phase === 'forming' && (
          <div className="center-action">
            <div className="forming-text">Reading the shapes...</div>
          </div>
        )}

        {/* Shape GIF — right side, dissolves in on reveal */}
        {(phase === 'forming' || phase === 'formed') && (
          <div className={`shape-gif ${phase === 'formed' ? 'shape-gif--visible' : 'shape-gif--forming'}`}>
            <img src="/shapegif.gif" alt="" />
          </div>
        )}

        {/* Fortune text — flows around 3D necklace beads */}
        <FortuneTextFlow
          lines={prophecy?.lines}
          beadScreenPositionsRef={beadScreenPositionsRef}
          visible={showResults}
        />

        {/* Results panel — action buttons only */}
        {showResults && (
          <div className="results-panel">
            <div className="results-panel__actions">
              <button className="action-btn" onClick={handleSaveImage}>
                <WackyText text="SAVE FORTUNE" />
              </button>
              <button
                className="action-btn action-btn--outline"
                onClick={handleNewFortune}
                disabled={busy}
              >
                <WackyText text="NEW FORTUNE" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden export card */}
      {showResults && (
        <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
          <div ref={exportRef} className="export-card">
            <div className="export-card__header">
              <div className="export-card__brand">
                {'THE SHAPE STORE'.split('').map((ch, i) => {
                  if (ch === ' ') return <span key={i}>&nbsp;</span>;
                  const colors = ['#D63230', '#F5B700', '#1B4DE4', '#2D936C', '#1A1918'];
                  const s = ((i * 16807 + 7) % 2147483647);
                  const r1 = ((s) % 1000) / 1000;
                  const rot = (r1 - 0.5) * 10;
                  return (
                    <span key={i} style={{
                      display: 'inline-block',
                      color: colors[i % colors.length],
                      transform: `rotate(${rot}deg)`,
                      fontWeight: 700,
                    }}>{ch}</span>
                  );
                })}
              </div>
              <div className="export-card__sub">
                {'Fortune Card'.split('').map((ch, i) => {
                  if (ch === ' ') return <span key={i}>&nbsp;</span>;
                  const colors = ['#D63230', '#F5B700', '#1B4DE4', '#2D936C', '#1A1918'];
                  const s = ((i * 48271 + 13) % 2147483647);
                  const r1 = ((s) % 1000) / 1000;
                  const rot = (r1 - 0.5) * 8;
                  return (
                    <span key={i} style={{
                      display: 'inline-block',
                      color: colors[(i + 2) % colors.length],
                      transform: `rotate(${rot}deg)`,
                      fontWeight: 600,
                    }}>{ch}</span>
                  );
                })}
              </div>
            </div>

            {/* Necklace arc — 2D shapes matching the 3D layout */}
            <div className="export-necklace">
              <svg className="export-necklace__rope" viewBox="0 0 480 120" preserveAspectRatio="none">
                <path d="M 10,20 Q 80,110 240,115 Q 400,110 470,20" fill="none" stroke="#8D6E63" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <div className="export-necklace__beads">
                {sequence.map((b, i) => {
                  const total = sequence.length;
                  const t = i / (total - 1);
                  const angle = Math.PI * 0.15 + t * Math.PI * 0.7;
                  const x = 240 + Math.cos(angle) * 220;
                  const y = 15 + Math.sin(angle) * 95;
                  const size = b.type === 'star' ? 49 : 22;

                  if (b.type === 'star') {
                    return (
                      <span
                        key={i}
                        className="export-arc-bead"
                        style={{
                          left: `${x}px`,
                          top: `${y}px`,
                          width: `${size}px`,
                          height: `${size}px`,
                          backgroundColor: 'transparent',
                          color: b.hex,
                          fontSize: `${size + 8}px`,
                          lineHeight: `${size}px`,
                          textAlign: 'center',
                          overflow: 'visible',
                          zIndex: 10,
                        }}
                      >★</span>
                    );
                  }

                  return (
                    <span
                      key={i}
                      className={`export-arc-bead export-arc-bead--${b.type}`}
                      style={{
                        backgroundColor: b.hex,
                        left: `${x}px`,
                        top: `${y}px`,
                        width: `${size}px`,
                        height: `${size}px`,
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Fortune text — wacky style matching web */}
            <div className="export-card__fortune">
              {prophecy.lines.join(' ').split(/\s+/).filter(Boolean).map((word, i) => {
                // Deterministic per-word randomness matching FortuneTextFlow
                const seed = ((prophecy.lines.join(' ').length * 7 + 31) * 16807 ** (i + 1)) % 2147483647;
                const r1 = ((seed * 16807) % 2147483647 - 1) / 2147483646;
                const r2 = ((seed * 16807 * 16807) % 2147483647 - 1) / 2147483646;
                const r3 = ((seed * 16807 * 16807 * 16807) % 2147483647 - 1) / 2147483646;
                const r4 = ((seed * 16807 * 16807 * 16807 * 16807) % 2147483647 - 1) / 2147483646;
                const colors = ['#D63230', '#F5B700', '#1B4DE4', '#2D936C', '#1A1918'];
                const rotation = (r1 - 0.5) * 12;
                const scaleX = 0.88 + r2 * 0.3;
                const scaleY = 0.82 + r3 * 0.4;
                const fontSize = 13 + Math.floor(r4 * 8);
                return (
                  <span
                    key={i}
                    className="export-fortune-word"
                    style={{
                      color: colors[i % colors.length],
                      fontSize: `${fontSize}px`,
                      transform: `rotate(${rotation}deg) scaleX(${scaleX}) scaleY(${scaleY})`,
                    }}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
