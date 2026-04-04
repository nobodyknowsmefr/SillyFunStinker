import React from 'react';
import { COLORS, COLOR_HEX } from '../logic/shapeInventory';

export default function WhatsIncluded() {
  return (
    <div className="whats-included">
      <h3 className="whats-included__title">Contents</h3>

      <div className="whats-included__grid">
        <div className="whats-included__category">
          <h4>Cubes <span className="dim">(12)</span></h4>
          {COLORS.map((color) => (
            <div key={`cube-${color}`} className="whats-included__item">
              <div
                className="whats-included__swatch whats-included__swatch--cube"
                style={{ backgroundColor: COLOR_HEX[color] }}
              />
              <span>2x {color}</span>
            </div>
          ))}
        </div>

        <div className="whats-included__category">
          <h4>Rounds <span className="dim">(12)</span></h4>
          {COLORS.map((color) => (
            <div key={`round-${color}`} className="whats-included__item">
              <div
                className="whats-included__swatch whats-included__swatch--round"
                style={{ backgroundColor: COLOR_HEX[color] }}
              />
              <span>2x {color}</span>
            </div>
          ))}
        </div>

        <div className="whats-included__category">
          <h4>Special</h4>
          <div className="whats-included__item">
            <div
              className="whats-included__swatch whats-included__swatch--star"
              style={{ backgroundColor: COLOR_HEX.yellow }}
            />
            <span>1x yellow star</span>
          </div>
          <div className="whats-included__item">
            <div
              className="whats-included__swatch whats-included__swatch--cube"
              style={{ backgroundColor: '#8D6E63' }}
            />
            <span>1x rope</span>
          </div>
          <p className="whats-included__aside">
            The star is always yellow. There is no orange star.
          </p>
        </div>
      </div>

      <p className="whats-included__total">
        25 beads + 1 rope = 1 necklace. Sequence determined by fortune.
      </p>
    </div>
  );
}
