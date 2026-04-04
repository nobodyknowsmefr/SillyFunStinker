import React, { useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import SequenceDisplay from './SequenceDisplay';

export default function FortuneCardExport({ sequence, prophecy, shorthandCode, seed }) {
  const cardRef = useRef(null);

  const handleExportImage = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `shape-fortune-${seed?.slice(0, 12) || 'card'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Export failed:', e);
    }
  }, [seed]);

  const handlePrint = useCallback(() => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !cardRef.current) return;

    const html = cardRef.current.outerHTML;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Shape Fortune Card</title>
        <link href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Comic+Neue:wght@400;700&family=VT323&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Comic Neue', cursive; display: flex; justify-content: center; padding: 20px; }
          .fortune-card { width: 560px; background: white; border: 2px solid #1a1a1a; border-radius: 8px; padding: 24px; }
          .fortune-card__header { text-align: center; border-bottom: 1px solid #bbb; padding-bottom: 10px; margin-bottom: 10px; }
          .fortune-card__header h3 { font-family: 'Fredoka One', cursive; font-size: 1rem; margin-bottom: 2px; }
          .fortune-card__header p { font-family: 'VT323', monospace; font-size: 0.7rem; color: #888; }
          .fortune-card__sequence { margin-bottom: 12px; }
          .fortune-card__prophecy { background: #FFFDE7; border: 1px solid #FDD835; border-radius: 6px; padding: 12px; margin-bottom: 10px; }
          .fortune-card__prophecy p { font-family: 'Comic Neue', cursive; font-size: 0.85rem; line-height: 1.6; margin-bottom: 2px; }
          .fortune-card__prophecy-title { font-family: 'VT323', monospace; font-size: 0.7rem; color: #8E24AA; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px; }
          .fortune-card__footer { text-align: center; font-family: 'VT323', monospace; font-size: 0.65rem; color: #888; border-top: 1px dashed #bbb; padding-top: 8px; }
          .fortune-card__code { font-family: 'VT323', monospace; font-size: 0.55rem; word-break: break-all; color: #888; margin-top: 6px; line-height: 1.3; }
          .fortune-card__assembly { font-family: 'VT323', monospace; font-size: 0.65rem; margin-top: 8px; text-align: center; color: #888; }
          .sequence-display { display: flex; flex-wrap: wrap; gap: 4px; justify-content: center; padding: 6px 0; }
          .bead { width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; border: 1.5px solid rgba(0,0,0,0.25); font-family: 'VT323', monospace; font-size: 0.55rem; color: white; text-shadow: 0 1px 1px rgba(0,0,0,0.4); }
          .bead--cube { border-radius: 3px; }
          .bead--round { border-radius: 50%; }
          .bead--star { clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%); width: 30px; height: 30px; border: none; }
        </style>
      </head>
      <body>${html}</body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  }, []);

  if (!sequence || !prophecy) return null;

  return (
    <>
      {/* Inline action buttons — rendered in fortune-actions row */}
      <button className="btn btn--secondary btn--sm" onClick={handleExportImage}>
        Save Image
      </button>
      <button className="btn btn--ghost btn--sm" onClick={handlePrint}>
        Print
      </button>

      {/* Hidden card rendered off-screen for html2canvas capture */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div ref={cardRef} className="fortune-card">
          <div className="fortune-card__header">
            <h3>Shape Necklace Fortune Card</h3>
            <p>Assembly Reference / Prophecy Record</p>
          </div>

          <div className="fortune-card__sequence">
            <SequenceDisplay sequence={sequence} />
          </div>

          <div className="fortune-card__prophecy">
            <div className="fortune-card__prophecy-title">Your Shape Prophecy</div>
            {prophecy.lines.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>

          <div className="fortune-card__assembly">
            {sequence.map((b, i) => `${i + 1}.${b.shorthand}`).join(' - ')}
          </div>

          <div className="fortune-card__code">
            {shorthandCode}
          </div>

          <div className="fortune-card__footer">
            Shape Store / whyk4re -- Harvested from certified shape trees
          </div>
        </div>
      </div>
    </>
  );
}
