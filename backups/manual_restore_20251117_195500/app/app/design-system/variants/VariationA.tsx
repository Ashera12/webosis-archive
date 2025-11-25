"use client";
import React from 'react';
import Hero from '../components/Hero';

export default function VariationA() {
  return (
    <div>
      <Hero title="Minimalism — Editorial Grade" subtitle="A minimal, elegant landing with soft pastel palette and serif headings." variation="a" />
      <main style={{ maxWidth: 1100, margin: '36px auto', padding: 24 }}>
        <section className="ds-card" style={{ marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'Merriweather, serif', fontSize: 20 }}>Editorial summary</h2>
          <p className="ds-subtle">Clean layout, generous breathing space, and high readability.</p>
        </section>
      </main>
    </div>
  );
}
