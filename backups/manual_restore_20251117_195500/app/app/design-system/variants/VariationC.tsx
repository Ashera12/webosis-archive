"use client";
import React from 'react';
import Hero from '../components/Hero';

export default function VariationC() {
  return (
    <div>
      <Hero title="Interaction — Sophisticated Motion" subtitle="Subtle motion, adaptive timing, and cross-platform readiness." variation="c" />
      <main style={{ maxWidth: 1100, margin: '36px auto', padding: 24 }}>
        <section className="ds-card" style={{ marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20 }}>Interaction focus</h2>
          <p className="ds-subtle">Motion tuned to 0.18–0.25s cubic-bezier for smooth cognitive-friendly transitions.</p>
        </section>
      </main>
    </div>
  );
}
