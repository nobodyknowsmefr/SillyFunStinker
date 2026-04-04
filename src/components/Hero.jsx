import React from 'react';

export default function Hero({ onRevealFortune, disabled }) {
  return (
    <section className="hero">
      <div className="hero__badge">
        <span className="sym sym--star-sm"></span>
        {' '}OFFICIAL SHAPE STORE AUTHORIZED RESELLER{' '}
        <span className="sym sym--star-sm"></span>
      </div>

      <h1 className="hero__title">
        whyk4re's Shape Necklace Emporium
      </h1>

      <p className="hero__subtitle">
        Harvested fresh from certified shape trees.
      </p>

      <p className="hero__lore">
        The Shape Store Agricultural Science Facility cultivates shape trees whose
        harvested forms are processed into necklaces imbued with peculiar properties.
        Every sequence carries peculiar future implications.
      </p>

      <div className="hero__water-notice">
        <span className="sym sym--drop"></span>
        {' '}whyk4re is currently attempting to resolve a serious water-related billing issue.{' '}
        <span className="sym sym--drop"></span>
      </div>

      <button
        className="btn btn--primary"
        onClick={onRevealFortune}
        disabled={disabled}
      >
        Reveal My Fortune
      </button>
    </section>
  );
}
