"use client";
import React from 'react';
import Hero from '../components/Hero';

export default function VariationB() {
  return (
    <div>
      <Hero title="System Excellence — Warm Editorial" subtitle="Warm neutrals, editorial rhythm, and modular components." variation="b" />
      <main style={{ maxWidth: 1100, margin: '36px auto', padding: 24 }}>
        <section className="ds-card" style={{ marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20 }}>Design system highlights</h2>
          <p className="ds-subtle">Tokens, predictable spacing, and accessible color contrast.</p>
        </section>
      </main>
    </div>
  );
}
